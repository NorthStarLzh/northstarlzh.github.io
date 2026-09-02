import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Stack,
  Switch,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui';
import {useClient} from 'sanity';
import {IntentLink} from 'sanity/router';

import {
  buildBatchPhotoDocument,
  buildPhotoImageValue,
  computeNextFeaturedOrder,
  hasReachedFeaturedLimit,
  isSupportedImageFile,
  MAX_FEATURED_PHOTOS,
  PHOTO_CATEGORY_OPTIONS,
  sanitizeDisplayOrder,
  type BatchPhotoCategory,
} from './batch-photo';

const BATCH_UPLOAD_API_VERSION = '2026-07-27';
const FEATURED_PHOTOS_QUERY = '*[_type == "photo" && featured == true]{featuredOrder}';
const ALL_PHOTOS_QUERY = `*[_type == "photo" && !(_id in path("drafts.**"))]
  | order(coalesce(displayOrder, 2147483647) asc, featured desc, coalesce(featuredOrder, 2147483647) asc, _createdAt desc){
    _id,
    "title": coalesce(alt.zh, ""),
    featured,
    categories,
    displayOrder,
    _createdAt
  }`;

// Monotonic counter keeps preview keys unique even when the same file is
// appended again in a later selection.
let previewIdCounter = 0;

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  /** Reused when document creation fails after the image asset has uploaded. */
  assetRef?: string;
}

interface CreatedPhoto {
  id: string;
  fileName: string;
  featured: boolean;
}

interface ManagedPhoto {
  id: string;
  title: string;
  featured: boolean;
  categories: BatchPhotoCategory[];
  displayOrder?: number;
  createdAt?: string;
}

function fileSignature(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function categorySummary(categories: readonly BatchPhotoCategory[]): string {
  if (categories.length === 0) return '未分类';
  return categories
    .map((category) => PHOTO_CATEGORY_OPTIONS.find(({value}) => value === category)?.title ?? category)
    .join('、');
}

/**
 * Studio pane that uploads many photography images at once. Each image becomes
 * its own `photo` document with only the image populated; every metadata field
 * stays optional and is applied from the shared defaults when filled in.
 * After upload every photo can be toggled to the homepage feature slot, and an
 * optional management list exposes the same toggle for all existing photos.
 */
export function BatchUploadPane() {
  const client = useClient({apiVersion: BATCH_UPLOAD_API_VERSION});
  const toast = useToast();
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [categories, setCategories] = useState<BatchPhotoCategory[]>([]);
  const [displayOrder, setDisplayOrder] = useState('');
  const [shotAt, setShotAt] = useState('');
  const [city, setCity] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<ManagedPhoto[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replacementTarget, setReplacementTarget] = useState<ManagedPhoto | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const replacementInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const pendingSignaturesRef = useRef<Set<string>>(new Set());

  const revokePreview = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  }, []);

  const trackPreview = useCallback((url: string) => {
    previewUrlsRef.current.add(url);
    return url;
  }, []);

  // Revoke any surviving preview URLs when the pane unmounts.
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const appendFiles = useCallback(
    (incoming: FileList | File[] | null) => {
      if (!incoming) return;
      if (running) {
        toast.push({status: 'warning', title: '当前批次正在上传，请完成后再添加图片'});
        return;
      }
      const candidates = Array.from(incoming).filter(isSupportedImageFile);
      const images = candidates.filter((file) => {
        const signature = fileSignature(file);
        if (pendingSignaturesRef.current.has(signature)) return false;
        pendingSignaturesRef.current.add(signature);
        return true;
      });
      if (images.length === 0) {
        toast.push({status: 'warning', title: candidates.length > 0 ? '这些图片已在待上传列表中' : '未选择可用的图片文件'});
        return;
      }
      if (images.length < candidates.length) {
        toast.push({status: 'warning', title: `已跳过 ${candidates.length - images.length} 个重复文件`});
      }
      setCreated([]);
      setError(null);
      setPending((current) => [
        ...current,
        ...images.map((file) => ({
          id: `preview-${previewIdCounter += 1}`,
          file,
          previewUrl: trackPreview(URL.createObjectURL(file)),
        })),
      ]);
    },
    [running, toast, trackPreview],
  );

  const removePending = useCallback(
    (targetId: string) => {
      setPending((current) => {
        const target = current.find(({id}) => id === targetId);
        if (target) {
          revokePreview(target.previewUrl);
          pendingSignaturesRef.current.delete(fileSignature(target.file));
        }
        return current.filter(({id}) => id !== targetId);
      });
    },
    [revokePreview],
  );

  const loadAllPhotos = useCallback(async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const docs = await client.fetch<Array<{
        _id: string;
        title?: string;
        featured?: boolean;
        categories?: string[];
        displayOrder?: number;
        _createdAt?: string;
      }>>(ALL_PHOTOS_QUERY);
      setAllPhotos(docs.map((doc) => ({
        id: doc._id,
        title: typeof doc.title === 'string' && doc.title.trim() ? doc.title.trim() : '未命名摄影作品',
        featured: doc.featured === true,
        categories: Array.isArray(doc.categories)
          ? doc.categories.filter((value): value is BatchPhotoCategory => (
            value === 'landscape' || value === 'portrait'
          ))
          : [],
        ...(typeof doc.displayOrder === 'number' && Number.isInteger(doc.displayOrder) && doc.displayOrder >= 0
          ? {displayOrder: doc.displayOrder}
          : {}),
        createdAt: doc._createdAt,
      })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载摄影作品失败');
    } finally {
      setLoadingAll(false);
    }
  }, [client]);

  const patchFeatured = useCallback(async (photoId: string, enabled: boolean) => {
    if (togglingId) return;
    setTogglingId(photoId);
    setError(null);
    try {
      if (!enabled) {
        await client.patch(photoId).set({featured: false}).unset(['featuredOrder']).commit();
      } else {
        const featured = await client.fetch<Array<{featuredOrder?: number}>>(FEATURED_PHOTOS_QUERY);
        if (hasReachedFeaturedLimit(featured.length)) {
          toast.push({
            status: 'warning',
            title: `首页精选最多 ${MAX_FEATURED_PHOTOS} 张，请先取消其他精选`,
          });
          return;
        }
        const order = computeNextFeaturedOrder(
          featured
            .map((item) => item.featuredOrder)
            .filter((value): value is number => typeof value === 'number'),
        );
        await client.patch(photoId).set({featured: true, featuredOrder: order}).commit();
      }
      setCreated((current) => current.map((photo) => (
        photo.id === photoId ? {...photo, featured: enabled} : photo
      )));
      setAllPhotos((current) => current.map((photo) => (
        photo.id === photoId ? {...photo, featured: enabled} : photo
      )));
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : '更新精选状态失败');
      toast.push({status: 'error', title: '更新精选状态失败'});
    } finally {
      setTogglingId(null);
    }
  }, [client, toast, togglingId]);

  const startReplacement = useCallback((photo: ManagedPhoto) => {
    if (running || replacingId) return;
    setReplacementTarget(photo);
    replacementInputRef.current?.click();
  }, [replacingId, running]);

  const replacePublishedPhoto = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    const target = replacementTarget;
    if (!target || !file) return;
    if (!isSupportedImageFile(file)) {
      setError('请选择 JPG、PNG、WebP 等图片文件。');
      return;
    }

    setReplacingId(target.id);
    setReplacementTarget(null);
    setError(null);
    try {
      const asset = await client.assets.upload('image', file);
      const image = buildPhotoImageValue(asset._id);
      const draftId = `drafts.${target.id}`;
      const draft = await client.getDocument(draftId);
      const transaction = client.transaction();
      transaction.patch(target.id, {set: {image}});
      // Keep an existing metadata draft in sync so a later normal publish does
      // not restore the old image over this direct replacement.
      if (draft) transaction.patch(draftId, {set: {image}});
      await transaction.commit();
      toast.push({status: 'success', title: `已替换「${target.title}」的公开图片`});
    } catch (replacementError) {
      setError(replacementError instanceof Error ? replacementError.message : '替换图片失败，请重试');
      toast.push({status: 'error', title: '替换图片失败'});
    } finally {
      setReplacingId(null);
    }
  }, [client, replacementTarget, toast]);

  const toggleCategory = useCallback((target: BatchPhotoCategory) => {
    setCategories((current) => current.includes(target)
      ? current.filter((category) => category !== target)
      : [...current, target]);
  }, []);

  const handleUpload = useCallback(async () => {
    if (pending.length === 0 || running) return;
    const normalizedDisplayOrder = displayOrder.trim().length === 0
      ? undefined
      : sanitizeDisplayOrder(displayOrder);
    if (displayOrder.trim().length > 0 && normalizedDisplayOrder === undefined) {
      setError('分类页排序编号必须是 0 或更大的整数。');
      return;
    }
    setRunning(true);
    setError(null);
    setCreated([]);
    const defaults = {
      categories: categories.length > 0 ? categories : undefined,
      displayOrder: normalizedDisplayOrder,
      shotAt: shotAt || undefined,
      city: city || undefined,
    };
    const results: CreatedPhoto[] = [];
    const failed: PendingImage[] = [];
    for (let index = 0; index < pending.length; index += 1) {
      const current = pending[index];
      const {file, previewUrl} = current;
      let assetRef = current.assetRef;
      try {
        setProgress(`正在上传 ${index + 1}/${pending.length}：${file.name}`);
        if (!assetRef) {
          const asset = await client.assets.upload('image', file);
          assetRef = asset._id;
        }
        const document = buildBatchPhotoDocument(assetRef, defaults);
        const createdDocument = await client.create(document);
        results.push({id: createdDocument._id, fileName: file.name, featured: false});
        revokePreview(previewUrl);
        pendingSignaturesRef.current.delete(fileSignature(file));
      } catch (uploadError) {
        failed.push({...current, ...(assetRef ? {assetRef} : {})});
        setError(uploadError instanceof Error ? uploadError.message : '部分图片上传失败，请重试');
      }
    }
    setCreated(results);
    setPending(failed);
    if (failed.length === 0) {
      toast.push({status: 'success', title: `已创建 ${results.length} 张摄影作品`});
    } else {
      toast.push({status: 'error', title: `${failed.length} 张上传失败，已保留在列表中供重试`});
    }
    if (showAll) void loadAllPhotos();
    setRunning(false);
    setProgress(null);
  }, [categories, city, client, displayOrder, loadAllPhotos, pending, revokePreview, running, showAll, shotAt, toast]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      appendFiles(event.dataTransfer.files);
    },
    [appendFiles],
  );

  return (
    <Box padding={[3, 4, 5]}>
      <Stack space={4}>
        <Stack space={2}>
          <Heading as="h1" size={2}>
            上传摄影作品
          </Heading>
          <Text size={1} muted>
            先选择图片，再为整批设置分类、展示排序与拍摄信息。已公开作品可在下方直接替换原图，无需先撤下公开状态。
          </Text>
        </Stack>

        <Card
          border
          padding={4}
          radius={2}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !running && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (!running && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={running ? -1 : 0}
          aria-disabled={running}
          aria-label="选择要批量上传的摄影图片"
          style={{cursor: running ? 'not-allowed' : 'pointer'}}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={running}
            onChange={(event) => {
              appendFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <input
            ref={replacementInputRef}
            type="file"
            accept="image/*"
            hidden
            disabled={running || Boolean(replacingId)}
            onChange={(event) => void replacePublishedPhoto(event)}
          />
          <Stack space={2}>
            <Text size={2} align="center">
              将多张图片拖到这里，或点击选择
            </Text>
            <Text size={1} muted align="center">
              支持 JPG / PNG / WebP 等常见图片格式；重复文件会自动跳过
            </Text>
          </Stack>
        </Card>

        {pending.length > 0 && (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              待上传 {pending.length} 张
            </Text>
            <Grid columns={[2, 3, 4]} gap={2}>
              {pending.map((image) => (
                <Card key={image.id} border radius={2} overflow="hidden">
                  {/* Studio pane previews local blob URLs; next/image does not apply here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    style={{
                      display: 'block',
                      width: '100%',
                      aspectRatio: '4 / 3',
                      objectFit: 'cover',
                    }}
                  />
                  <Flex padding={2} gap={2} align="center" justify="space-between">
                    <Text size={1} muted textOverflow="ellipsis">
                      {image.file.name}
                    </Text>
                    <Button
                      text="移除"
                      tone="critical"
                      mode="ghost"
                      fontSize={1}
                      disabled={running}
                      onClick={() => removePending(image.id)}
                    />
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Stack>
        )}

        <Card border padding={4} radius={2}>
          <Stack space={3}>
            <Stack space={1}>
              <Heading as="h2" size={1}>这批作品的展示信息</Heading>
              <Text size={1} muted>
                以下信息会应用到整批图片；上传完成后仍可在单张作品里调整。
              </Text>
            </Stack>
            <Stack space={2}>
              <Text size={1} weight="semibold">分类</Text>
              <Flex gap={3} wrap="wrap">
                {PHOTO_CATEGORY_OPTIONS.map(({value, title}) => (
                  <Card key={value} border padding={2} radius={2}>
                    <Flex gap={2} align="center">
                      <Switch
                        aria-label={`将本批图片归入${title}`}
                        checked={categories.includes(value)}
                        disabled={running}
                        onChange={() => toggleCategory(value)}
                      />
                      <Text size={1}>{title}</Text>
                    </Flex>
                  </Card>
                ))}
              </Flex>
              <Text size={1} muted>可同时归入风光与人像；不选择则暂不出现在分类页。</Text>
            </Stack>
            <Grid columns={[1, 2]} gap={3}>
              <Stack space={2}>
                <Text size={1} weight="semibold">分类页排序编号</Text>
                <TextInput
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="可选，例如 10"
                  value={displayOrder}
                  disabled={running}
                  onChange={(event) => setDisplayOrder(event.currentTarget.value)}
                />
                <Text size={1} muted>数字越小越靠前；同号作品会稳定随机排列。</Text>
              </Stack>
              <Stack space={2}>
                <Text size={1} weight="semibold">拍摄年月</Text>
                <TextInput
                  placeholder="可选，例如 2026-07"
                  value={shotAt}
                  disabled={running}
                  onChange={(event) => setShotAt(event.currentTarget.value)}
                />
                <Text size={1} muted>用于未编号作品的默认时间排序。</Text>
              </Stack>
            </Grid>
            <Stack space={2}>
              <Text size={1} weight="semibold">拍摄城市</Text>
              <TextInput
                placeholder="可选；会同时写入中英文"
                value={city}
                disabled={running}
                onChange={(event) => setCity(event.currentTarget.value)}
              />
            </Stack>
          </Stack>
        </Card>

        <Card border padding={3} radius={2} tone="primary">
          <Flex gap={3} align="center" justify="space-between" wrap="wrap">
            <Stack space={1}>
              <Text size={1} weight="semibold">确认后开始上传</Text>
              <Text size={1} muted>单张失败不会中断其余图片，失败项会保留在列表中供重试。</Text>
            </Stack>
            <Button
              text={pending.length > 0 ? `开始上传 ${pending.length} 张` : '开始上传'}
              tone="primary"
              disabled={pending.length === 0 || running}
              onClick={handleUpload}
            />
          </Flex>
          {running && (
            <Text size={1} muted style={{marginTop: 12}}>
              {progress}
            </Text>
          )}
        </Card>

        {error && (
          <Card border padding={2} radius={2} tone="critical">
            <Text size={1}>{error}</Text>
          </Card>
        )}

        {created.length > 0 && (
          <Card border padding={3} radius={2} tone="positive">
            <Stack space={2}>
              <Text size={1} weight="semibold">
                已创建 {created.length} 张摄影作品：
              </Text>
              <Text size={1} muted>
                开启「精选到首页」后图片会展示在首页（最多 {MAX_FEATURED_PHOTOS} 张）
              </Text>
              {created.map((photo) => (
                <Flex key={photo.id} gap={2} align="center" justify="space-between">
                  <Flex gap={2} align="center" style={{minWidth: 0, flex: '1 1 auto'}}>
                    <Switch
                      checked={photo.featured}
                      disabled={Boolean(togglingId)}
                      onChange={(event) => void patchFeatured(photo.id, event.currentTarget.checked)}
                    />
                    <Text size={1} muted textOverflow="ellipsis" style={{minWidth: 0}}>
                      {photo.fileName}
                    </Text>
                  </Flex>
                  <IntentLink
                    intent="edit"
                    params={{id: photo.id}}
                    style={{fontSize: 12, textDecoration: 'underline', whiteSpace: 'nowrap'}}
                  >
                    打开
                  </IntentLink>
                </Flex>
              ))}
            </Stack>
          </Card>
        )}

        <Card border padding={3} radius={2}>
          <Stack space={2}>
            <Flex gap={2} align="center" justify="space-between">
              <Text size={1} weight="semibold">
                全部摄影作品管理
              </Text>
              <Button
                text={showAll ? '收起' : '加载列表'}
                mode="ghost"
                fontSize={1}
                disabled={loadingAll}
                onClick={() => {
                  if (showAll) {
                    setShowAll(false);
                    return;
                  }
                  setShowAll(true);
                  void loadAllPhotos();
                }}
              />
            </Flex>
            <Text size={1} muted>
              替换图片会直接覆盖已公开的原图，并保留分类、排序、精选和拍摄信息；若有未公开的文字编辑，也会同步使用新图片。
            </Text>
            {showAll &&
              (loadingAll ? (
                <Text size={1} muted>
                  正在加载…
                </Text>
              ) : allPhotos.length === 0 ? (
                <Text size={1} muted>
                  暂无摄影作品
                </Text>
              ) : (
                <Stack space={2}>
                  {allPhotos.map((photo) => (
                    <Flex key={photo.id} gap={2} align="center" justify="space-between">
                      <Flex gap={2} align="center" style={{minWidth: 0, flex: '1 1 auto'}}>
                        <Switch
                          aria-label={`将${photo.title}设为首页精选`}
                          checked={photo.featured}
                          disabled={Boolean(togglingId)}
                          onChange={(event) => void patchFeatured(photo.id, event.currentTarget.checked)}
                        />
                        <Stack space={1} style={{minWidth: 0}}>
                          <Text size={1} muted textOverflow="ellipsis">
                            {photo.title}
                          </Text>
                          <Text size={0} muted>
                            {categorySummary(photo.categories)} · {photo.displayOrder === undefined ? '未编号' : `排序 #${photo.displayOrder}`}
                          </Text>
                        </Stack>
                      </Flex>
                      <Flex gap={2} align="center">
                        <Button
                          text={replacingId === photo.id ? '替换中…' : '替换图片'}
                          mode="ghost"
                          fontSize={1}
                          disabled={running || Boolean(togglingId) || Boolean(replacingId)}
                          onClick={() => startReplacement(photo)}
                        />
                        <IntentLink
                          intent="edit"
                          params={{id: photo.id}}
                          style={{fontSize: 12, textDecoration: 'underline', whiteSpace: 'nowrap'}}
                        >
                          打开
                        </IntentLink>
                      </Flex>
                    </Flex>
                  ))}
                </Stack>
              ))}
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
