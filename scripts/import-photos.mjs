#!/usr/bin/env node
/**
 * 批量导入摄影照片到 Sanity。
 *
 * 用法：
 *   npm run photos:import                     # 导入「照片展示」文件夹，默认分类 landscape
 *   node scripts/import-photos.mjs 我的照片 --category=portrait
 *   node scripts/import-photos.mjs --dry-run  # 只列出将上传的文件，不写入
 *
 * 行为：
 *   - 将文件夹内每张图片上传为 Sanity image asset，再创建一张 photo 文档。
 *   - 默认给所有照片打上 landscape（风光）分类，保证导入后立即在摄影页可见；
 *     需要人像分类的照片之后在 Studio 里逐个调整即可。
 *   - 幂等：同一张图片（内容哈希相同）已存在时跳过，不会产生重复文档。
 *   - 鉴权优先读环境变量 SANITY_IMPORT_TOKEN，缺失时回退到本机 Sanity CLI 的登录会话。
 *
 * 与 Studio 批量上传面板的关系：本脚本是 buildBatchPhotoDocument
 * （sanity/components/batch-photo.ts）的命令行版本，字段结构保持一致。
 */
import {createReadStream, readFileSync, readdirSync} from 'node:fs';
import {createClient} from '@sanity/client';
import {join, resolve} from 'node:path';

const API_VERSION = '2026-07-27';
const DEFAULT_FOLDER = '照片展示';
const DEFAULT_CATEGORY = 'landscape';
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif)$/i;

function resolveToken() {
  const fromEnv = process.env.SANITY_IMPORT_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const config = JSON.parse(
      readFileSync(join(process.env.HOME, '.config/sanity/config.json'), 'utf8'),
    );
    return config.authToken || null;
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const result = {folder: DEFAULT_FOLDER, category: DEFAULT_CATEGORY, dryRun: false};
  for (const arg of argv) {
    if (arg === '--dry-run') result.dryRun = true;
    else if (arg.startsWith('--category=')) result.category = arg.slice('--category='.length);
    else if (!arg.startsWith('--')) result.folder = arg;
  }
  return result;
}

/**
 * 与 sanity/components/batch-photo.ts 的 buildBatchPhotoDocument 保持一致。
 * 只填充图片 + 可选默认分类；其余元数据（alt/日期/城市/简介/精选）留空，由后台补充。
 */
function buildPhotoDocument(assetRef, category) {
  const document = {
    _type: 'photo',
    image: {
      _type: 'image',
      asset: {_type: 'reference', _ref: assetRef},
      hotspot: {_type: 'sanity.imageHotspot', x: 0.5, y: 0.5, width: 1, height: 1},
    },
  };
  if (category) document.categories = [category];
  return document;
}

const args = parseArgs(process.argv.slice(2));
const folder = resolve(process.cwd(), args.folder);

const token = resolveToken();
if (!token) {
  console.error('找不到 Sanity token：请设置 SANITY_IMPORT_TOKEN，或先运行 `npx sanity login`。');
  process.exit(1);
}

const client = createClient({
  projectId: 'n4ck95jq',
  dataset: 'development',
  apiVersion: API_VERSION,
  useCdn: false,
  token,
});

const files = readdirSync(folder)
  .filter((name) => IMAGE_EXTENSION.test(name))
  .sort();

if (files.length === 0) {
  console.error(`文件夹「${folder}」里没有可导入的图片。`);
  process.exit(1);
}

console.log(`找到 ${files.length} 张图片，默认分类：${args.category}${args.dryRun ? '（仅演练，不写入）' : ''}`);

// 已存在的照片资产引用集合，用于幂等去重
const existingAssetRefs = new Set(
  await client.fetch('*[_type=="photo"].image.asset._ref'),
);
console.log(`Sanity 中现有 photo 文档 ${existingAssetRefs.size} 张。\n`);

let created = 0;
let skipped = 0;
let failed = 0;

for (const [index, fileName] of files.entries()) {
  const filePath = join(folder, fileName);
  const label = `${index + 1}/${files.length} ${fileName}`;

  if (args.dryRun) {
    console.log(`  [演练] ${label}`);
    continue;
  }

  try {
    // 上传原图；Sanity 按内容哈希去重，重复文件会返回同一资产
    const asset = await client.assets.upload(
      'image',
      createReadStream(filePath),
      {filename: fileName},
    );
    const assetId = asset?._id ?? asset?.document?._id;

    if (existingAssetRefs.has(assetId)) {
      console.log(`  ⏭ ${label} 已存在，跳过`);
      skipped += 1;
      continue;
    }

    await client.create(buildPhotoDocument(assetId, args.category));
    existingAssetRefs.add(assetId);
    created += 1;
    console.log(`  ✓ ${label} → ${assetId}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${label} 失败: ${error.message}`);
  }
}

console.log(
  `\n导入完成：新建 ${created} 张，跳过 ${skipped} 张，失败 ${failed} 张。`,
);
if (failed > 0) process.exitCode = 1;
