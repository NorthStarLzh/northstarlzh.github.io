import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Select,
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
  computeNextFeaturedOrder,
  hasReachedFeaturedLimit,
  isSupportedImageFile,
  MAX_FEATURED_PHOTOS,
  PHOTO_CATEGORY_OPTIONS,
  type BatchPhotoCategory,
} from './batch-photo';

const BATCH_UPLOAD_API_VERSION = '2026-07-27';
const FEATURED_PHOTOS_QUERY = '*[_type == "photo" && featured == true]{featuredOrder}';
const ALL_PHOTOS_QUERY = `*[_type == "photo"]
  | order(featured desc, coalesce(featuredOrder, 2147483647) asc, _createdAt desc){
    _id,
    "title": coalesce(alt.zh, ""),
    featured,
    _createdAt
  }`;

// Monotonic counter keeps preview keys unique even when the same file is
// appended again in a later selection.
let previewIdCounter = 0;

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
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
  createdAt?: string;
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
  const [category, setCategory] = useState<'' | BatchPhotoCategory>('');
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

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
      const images = Array.from(incoming).filter(isSupportedImageFile);
      if (images.length === 0) {
        toast.push({status: 'warning', title: '未选择可用的图片文件'});
        return;
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
    [toast, trackPreview],
  );

  const removePending = useCallback(
    (targetId: string) => {
      setPending((current) => {
        const target = current.find(({id}) => id === targetId);
        if (target) revokePreview(target.previewUrl);
        return current.filter(({id}) => id !== targetId);
      });
    },
    [revokePreview],
  );

  const loadAllPhotos = useCallback(async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const docs = await client.fetch<
        Array<{_id: string; title?: string; featured?: boolean; _createdAt?: string}>
      >(ALL_PHOTOS_QUERY);
      setAllPhotos(docs.map((doc) => ({
        id: doc._id,
        title: typeof doc.title === 'string' && doc.title.trim() ? doc.title.trim() : '未命名摄影作品',
        featured: doc.featured === true,
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

  const handleUpload = useCallback(async () => {
    if (pending.length === 0 || running) return;
    setRunning(true);
    setError(null);
    setCreated([]);
    const defaults = {
      category: category || undefined,
      shotAt: shotAt || undefined,
      city: city || undefined,
    };
    const results: CreatedPhoto[] = [];
    try {
      for (let index = 0; index < pending.length; index += 1) {
        const {file, previewUrl} = pending[index];
        setProgress(`正在上传 ${index + 1}/${pending.length}：${file.name}`);
        const asset = await client.assets.upload('image', file);
        const document = buildBatchPhotoDocument(asset._id, defaults);
        const createdDocument = await client.create(document);
        results.push({id: createdDocument._id, fileName: file.name, featured: false});
        revokePreview(previewUrl);
      }
      setCreated(results);
      setPending([]);
      toast.push({status: 'success', title: `已创建 ${results.length} 张摄影作品`});
      if (showAll) void loadAllPhotos();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败，请稍后重试');
      toast.push({status: 'error', title: `上传中断，已完成 ${results.length} 张`});
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }, [category, city, client, loadAllPhotos, pending, revokePreview, running, showAll, shotAt, toast]);

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
            批量上传摄影图
          </Heading>
          <Text size={1} muted>
            一次选择多张图片，每张都会自动创建为一篇「摄影作品」文档。所有附加信息均可选。
          </Text>
        </Stack>

        <Card
          border
          padding={4}
          radius={2}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{cursor: 'pointer'}}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              appendFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <Stack space={2}>
            <Text size={2} align="center">
              将多张图片拖到这里，或点击选择文件
            </Text>
            <Text size={1} muted align="center">
              支持 JPG / PNG / WebP 等常见图片格式，可多选
            </Text>
          </Stack>
        </Card>

        {pending.length > 0 && (
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
                    onClick={() => removePending(image.id)}
                  />
                </Flex>
              </Card>
            ))}
          </Grid>
        )}

        <Stack space={3}>
          <Text size={1} muted>
            以下信息为可选，填写后将应用到本批全部图片（也可之后逐张修改）
          </Text>
          <Select
            value={category}
            onChange={(event) => setCategory(event.currentTarget.value as '' | BatchPhotoCategory)}
          >
            <option value="">不设置分类</option>
            {PHOTO_CATEGORY_OPTIONS.map(({value, title}) => (
              <option key={value} value={value}>
                {title}
              </option>
            ))}
          </Select>
          <TextInput
            placeholder="拍摄年月（可选，如 2026-07）"
            value={shotAt}
            onChange={(event) => setShotAt(event.currentTarget.value)}
          />
          <TextInput
            placeholder="拍摄城市（可选，中英文都会填写）"
            value={city}
            onChange={(event) => setCity(event.currentTarget.value)}
          />
        </Stack>

        <Flex gap={2} align="center">
          <Button
            text={pending.length > 0 ? `开始上传 ${pending.length} 张` : '开始上传'}
            tone="primary"
            disabled={pending.length === 0 || running}
            onClick={handleUpload}
          />
          {running && (
            <Text size={1} muted>
              {progress}
            </Text>
          )}
        </Flex>

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
                          checked={photo.featured}
                          disabled={Boolean(togglingId)}
                          onChange={(event) => void patchFeatured(photo.id, event.currentTarget.checked)}
                        />
                        <Text size={1} muted textOverflow="ellipsis" style={{minWidth: 0}}>
                          {photo.title}
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
              ))}
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
