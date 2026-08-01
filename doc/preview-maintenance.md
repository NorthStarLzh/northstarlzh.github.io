# 开发预览维护与恢复

本文只适用于 Vercel Preview 与 Sanity `development` 数据集。当前阶段不购买或绑定自定义域名，不部署中国大陆生产服务器，也不启动 ICP 备案。

## 1. 首次配置门槛

1. 从 `.env.example` 建立被 Git 忽略的本地环境文件；真实值只进入本地环境或 Vercel/Sanity 的秘密存储。
2. 运行 `npm run preview:check`。命令只报告变量名称和错误类型，不回显值。
3. Preview 必须使用 `development` 数据集；`NEXT_PUBLIC_SITE_ORIGIN` 必须是最终 Vercel Preview 的完整 HTTPS Origin。
4. 在 Sanity Manage 只保留网站所有者一个可写成员，确认没有匿名写入授权。
5. 将本地开发 Origin 与实际 Preview Origin 加入 Sanity CORS。访问 `/studio` 需要身份 Cookie，因此 Studio 所在 Origin 使用 credentials；不要添加 `*`。
6. 在 Sanity 创建指向 `<Preview Origin>/api/revalidate` 的发布 Webhook，筛选 `profile`、`education`、`award`、`photo` 和 `researchProject`，并使用与 Vercel `SANITY_REVALIDATE_SECRET` 相同的签名秘密。秘密不得出现在 URL、命令行参数或文档中。

`vercel.json` 在托管构建前强制执行同一预检，因此变量缺失或误指向非 `development` 数据集时部署会明确失败，不会生成连接占位项目的 Preview。

在外部配置前先执行只读检查，避免重复创建：

```sh
vercel project ls
npx sanity projects list
npx sanity datasets list --project-id <project-id>
npx sanity cors list --project-id <project-id>
npx sanity hooks list --project-id <project-id>
```

只有已有非交互身份有效时才能继续。不得通过自动流程打开浏览器登录，也不得创建付费资源。

## 2. 部署与验收

代码仓库恢复 Git 元数据并接入 Vercel 后，在 Vercel 项目的 Preview 环境配置 `.env.example` 中的变量。秘密通过 Dashboard 或标准输入写入，禁止使用会把值保存在 Shell 历史中的命令参数。

部署前依次运行：

```sh
npm run preview:check
npm run typecheck
npm run lint
npm test
npm run build
vercel deploy --yes --target=preview
```

记录命令返回的实际 HTTPS URL，再从安全的临时环境变量运行部署后冒烟：

```sh
PREVIEW_BASE_URL=<actual-preview-origin> npm run test:e2e:preview
```

随后在真实中国大陆常用网络环境检查中文首页、摄影缩略图、大图与 `/studio`。该记录只说明开发预览的单次体验，不构成生产性能承诺。

## 3. 日常内容维护

### 登录

打开 `<Preview Origin>/studio`，使用唯一网站所有者的 Sanity 身份登录。若看到权限错误，不要共享账号或扩大匿名权限，应在 Sanity Manage 核对项目成员和数据集授权。

### 上传照片与设置 5 张精选

1. 在“摄影作品”中新建条目并上传高清原图。
2. 完成拍摄年月、分类、中文/英文替代文本、城市和介绍。
3. 精选作品恰好保留 5 张，并为它们设置互不重复的精选顺序。
4. 使用“保存并公开”；前台缩略图由 Sanity CDN 生成，原片仍应在 CMS 外保留主副本。

### 添加科研项目

填写双语名称、时期和简介，上传 1–3 张图片，添加双语论文名称；首页精选最多 3 项且顺序不得重复，然后“保存并公开”。

### 替换 PDF 简历

打开“个人资料”，仅上传 PDF 并替换现有简历资产；保存并公开后分别检查中文和英文简历页的下载入口。

### 验证发布刷新

每次修改一小段可识别的中英文本，记下发布时间，在 Preview 轮询对应页面。目标为 60 秒内出现新内容。再恢复正式内容并重复验证。若超时，先查看 Sanity Webhook 日志和签名配置，再等待 60 秒缓存兜底；日志中不得复制签名或 Token。

## 4. 恢复误改

1. 在 Sanity 文档历史中选择最后一个正确版本并恢复、重新发布。
2. 对误删资产，优先从 CMS 外保存的原始文件重新上传；不要假定 Content Lake 是原片唯一备份。
3. 发布恢复版本后验证 Webhook，并检查公开页面在 60 秒内恢复。
4. 不删除未知数据集、项目、成员或现有部署来“修复”问题。

## 5. Vercel Preview 回滚

Preview 不使用生产域名。优先从 Vercel Deployment 列表找到最后一个已通过冒烟测试的部署，重新部署其 Git 提交并把团队共享的 Preview 链接更新为该部署。若项目后来启用了可回滚的别名，可使用：

```sh
vercel rollback <verified-deployment-id-or-url>
vercel rollback status
```

回滚后必须再次运行 `PREVIEW_BASE_URL=<rolled-back-origin> npm run test:e2e:preview`。不要使用 `--prod`，也不要在本阶段绑定自定义域名。

## 6. Sanity 内容导出

在仓库外或被 Git 忽略的备份目录执行；默认包含资产，输出文件不得提交到仓库：

```sh
npx sanity datasets export development <safe-backup-path>/development-YYYY-MM-DD.tar.gz --project-id <project-id>
```

导出前用 `npx sanity datasets list --project-id <project-id>` 确认目标确实为 `development`。恢复或导入具有覆盖风险，必须先另存当前导出并单独审批；本阶段不自动执行导入。
