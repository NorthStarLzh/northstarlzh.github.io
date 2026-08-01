# M16 开发预览交付记录

> 检查日期：2026-07-30  
> 目标：Vercel Preview + Sanity `development`  
> 状态：外部条件阻塞，尚未部署

## 当前交付状态

| 项目 | 实际结果 |
| --- | --- |
| Preview 地址 | 未分配；未创建或冒充 URL |
| 部署日期 | 未部署 |
| Studio 地址 | 部署后应为 `<Preview Origin>/studio`，当前无真实地址 |
| Vercel 身份 | 本机非交互凭据存在；官方 API 身份检查返回 HTTP 200 |
| Vercel 可复用项目 | 只读检查发现 5 个现有项目；按工程名筛选无匹配项，未创建重复或孤立项目 |
| 代码仓库连接 | 当前工作区无 `.git` 元数据，无法识别或连接代码仓库 |
| Sanity 身份 | `SANITY_AUTH_TOKEN`、常见 Sanity API/写入令牌与 CLI 会话均不存在 |
| Sanity 项目/数据集 | `NEXT_PUBLIC_SANITY_PROJECT_ID` 与 `NEXT_PUBLIC_SANITY_DATASET` 均缺失；没有可验证的 `development` 数据集 |
| Webhook/来源/所有者 | 因缺少 Sanity 身份和项目，均未配置或验证 |
| 发布刷新 | 未执行真实后台发布，不能宣称 60 秒内刷新通过 |
| 大陆网络实测 | 未获得 Preview URL，未执行 |

## 已完成的离线交付

- `.env.example` 逐项说明用途、获取方式和公开/秘密边界，没有真实值。
- `npm run preview:check` 对缺失值、错误数据集、API 日期、弱 Webhook 密钥和非 HTTPS Origin 失败关闭，且不回显值。
- `vercel.json` 将该预检设为托管构建门槛，缺失配置不能静默生成错误 Preview。
- `npm run test:e2e:preview` 为真实 HTTPS Preview 提供独立的只读 Playwright 冒烟入口，不启动本地 Fixture 服务。
- `.vercelignore` 排除测试产物、文档、本地环境文件与浏览器缓存。
- 维护、发布、回滚、误改恢复和 Sanity 带资产导出流程见 `doc/preview-maintenance.md`。
- 已确认本阶段未购买或绑定域名、未配置大陆生产服务器、未启动 ICP 备案，也未创建任何付费资源。

## 继续执行所需的客观条件

1. 恢复或提供当前代码仓库的 Git 元数据/远端，使 Vercel 能幂等连接正确仓库。
2. 提供已登录的 Sanity CLI 会话或非交互 Token；随后先查询并复用项目，不存在时才创建免费项目与 `development` 数据集。
3. 在秘密存储中生成并配置 Webhook 签名秘密；禁止通过聊天、文档或命令输出传递。
4. 配置唯一所有者、CORS 和发布 Webhook 后，部署真实 Preview，再运行 `npm run test:e2e:preview`、发布刷新和大陆网络实测。

这些条件满足前，M16-T03–T09、M16-T13 以及前两项完成标准必须保持未完成。
