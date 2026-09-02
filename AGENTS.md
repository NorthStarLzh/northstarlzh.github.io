# AGENTS.md

本文件适用于整个仓库。修改子目录前，先检查该目录是否存在更具体的 `AGENTS.md`；若有，以更具体的说明为准。

## 项目概览

这是一个中文优先、同时支持英文的个人作品集网站，包含首页、摄影、科研、简历、联系信息和内嵌 Sanity Studio。

- Web：Next.js 16 App Router、React 19、TypeScript strict mode
- 内容：Sanity，经仓储、映射器和领域契约与 UI 隔离
- UI：Tailwind CSS v4、CSS Modules、语义化 CSS 变量、Motion、Radix Dialog
- 国际化与主题：`next-intl`（`zh` / `en`）和 `next-themes`
- 测试：Vitest + Testing Library、Playwright、axe、视觉快照
- 包管理器：npm 10；Node 版本见 `.nvmrc` 和 `package.json#engines`

开始改动前，按任务需要阅读：

- `src/ARCHITECTURE.md`：目录职责与依赖方向
- `doc/detailed_design.md`：领域契约、页面行为和系统设计
- 相关目录的 `README.md`：局部规则
- `tests/README.md`：测试分层

设计文档可能落后于已实现代码；发生冲突时，先以当前代码、测试和配置为事实依据，并在改动中保持既有架构边界。

## 常用命令

```bash
npm ci
cp .env.example .env.local
npm run dev

npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run build:pages
```

- 常规改动至少运行 `npm run lint`、`npm run typecheck` 和相关单元测试。
- 路由、交互、响应式、主题、语言、无障碍或页面视觉变化需要运行相关 Playwright 用例；条件允许时运行完整 `npm run test:e2e`。
- 部署或静态导出相关改动同时验证 `npm run build:pages`。
- 不要仅为让测试通过而无审查地运行 `npm run test:e2e:update`。视觉基线只能在视觉变化符合预期后更新，并检查桌面、平板和移动端结果。

## 架构边界

保持以下单向依赖：

```text
app -> features -> content/contracts
app -> components
features -> components
content/repositories -> content/mappers -> content/contracts
content/sanity -> Sanity SDK
```

- `src/app` 只负责路由和组合。页面与 Route Handler 通过仓储接口访问内容，不得直接导入 Sanity Client、GROQ、原始 Sanity 文档或 `src/content/sanity`。
- `src/features/<name>` 是独立业务模块。不要导入其他 feature 的私有实现；跨 feature 能力应下沉为共享组件、契约或工具。
- `src/components/ui`、`layout` 和 `feedback` 必须保持业务无关，不得依赖 feature。
- `src/content/contracts` 只包含 CMS 无关的领域类型、仓储接口和验证规则。
- `src/content/mappers` 负责把不可信外部数据防御性地转换为领域对象；无效记录应被记录并隔离，不能把原始 CMS 数据传给 React 组件。
- 只有 `src/content/sanity` 可以包含 GROQ 或导入 Sanity SDK。Sanity Studio 的 schema、structure 和 actions 位于仓库根目录的 `sanity/`。
- 第三方 UI 或基础设施库应包在本地适配层中，避免其类型渗入领域契约或散落在页面代码中。
- 优先使用 Server Component。只有事件处理、浏览器 API、局部交互状态或客户端库确实需要时才添加 `'use client'`，并保持客户端边界尽量小。

## 代码与界面约定

- 使用 TypeScript，保持 strict mode；不要用 `any`、非必要类型断言或关闭 lint 规则来绕过问题。
- 内部导入优先使用 `@/`；测试 fixture 使用 `@fixtures/`。尊重既有模块的公开 `index.ts`，不要依赖其他模块的私有文件。
- 遵循相邻文件的格式和命名：组件使用 PascalCase，函数/变量使用 camelCase，文件通常使用 kebab-case；不要做与任务无关的全仓格式化。
- 状态保持局部且职责单一；不要引入共享可变全局状态来混合主题、语言、摄影查看器或科研弹窗状态。
- 保留渐进增强和无障碍行为：语义化 HTML、键盘操作、焦点管理、可读标签、替代文本和 reduced-motion 均不能因视觉实现而退化。
- 图片通过项目的 `AppImage`、图片 URL helper 或 feature 内适配层处理；提供准确尺寸与双语 alt，避免布局抖动。

## 国际化与样式

- 支持语言固定为 `zh` 和 `en`，默认语言为 `zh`，语言前缀始终出现在 URL 中。
- 静态界面文案放在 `src/i18n/messages/{zh,en}.json`；可编辑作品内容保留在领域对象的双语字段中。新增用户可见文案时同步补齐两种语言。
- 语言切换必须尽量保留当前路径、查询参数和锚点。
- `src/styles/globals.css` 是唯一 Tailwind v4 入口，只能由应用根布局导入一次。
- 优先使用 `src/styles` 中的语义化颜色、间距、圆角等 token，或共享组件；不要在 feature 中创建重复设计 token。
- 共享断点来自 `src/styles/tokens.ts`。不要添加彼此不一致的 feature 私有断点。
- 主题相关样式必须同时检查 light/dark；响应式变化至少考虑桌面、820px 平板和 390px 手机基线。

## 内容、配置与安全

- `.env.example` 只描述变量；真实值放在未提交的 `.env.local`。绝不提交 token、webhook secret、个人凭据或真实敏感内容。
- `NEXT_PUBLIC_*` 会暴露给浏览器；`SANITY_READ_TOKEN` 和 `SANITY_REVALIDATE_SECRET` 必须仅在服务端使用。
- Sanity API 日期必须固定，不要改成随时间移动的值。
- 单元和 E2E 测试不得连接真实 Sanity 项目或外部网络，使用 `tests/fixtures`、内存仓储或 `E2E_FIXTURE_MODE=1`。
- `npm run build:pages` 会临时移出 `src/app/api` 以完成静态导出。修改 API、静态导出或构建脚本时，要确认失败后也能恢复目录，并且不要把临时产物提交进仓库。

## 测试与完成标准

测试应靠近最合适的层级：

- 纯函数、验证器、状态机和组件行为：`tests/unit`
- 仓储、映射、Route Handler 或页面边界：`tests/integration`（若新增该层，沿用 `tests/README.md` 的职责）
- 关键用户旅程、键盘操作、主题/语言、响应式和无障碍：`tests/e2e`
- 可复用确定性数据：`tests/fixtures`
- 经批准的截图：`tests/visual/baselines`

修复 bug 时优先添加能复现问题的回归测试。不要依赖测试顺序、真实时间、随机数据或外部服务。提交结果前：

1. 检查 `git diff`，确认没有覆盖用户已有改动或包含临时文件。
2. 运行与改动范围相称的 lint、类型检查、测试和构建。
3. 说明实际运行过的命令、未运行的检查及原因。
4. 若行为、契约、环境变量或维护流程发生变化，同步更新最近的 README 或设计文档。
