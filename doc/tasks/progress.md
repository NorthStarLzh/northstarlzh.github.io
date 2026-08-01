# 个人作品网站开发进度

> 需求文档：[proposal.md](../proposal.md)  
> 详细设计：[detailed_design.md](../detailed_design.md)  
> 当前进度：11 / 16 个模块完成

## 使用规则

- 每次只执行一个模块文件中的一个未完成任务。
- 完成任务实现、对应测试和必要文档后，才勾选该任务。
- 一个模块文件中的任务全部勾选且模块验收通过后，才在本文件勾选该模块。
- 如果实现改变了接口、依赖或产品行为，先更新详细设计文档，再继续编码。
- 不得因为后续模块尚未完成而跳过当前模块可独立执行的测试。

## 模块进度

- [x] M01 [基础契约与测试数据](./foundation-contracts.md)
- [x] M02 [设计系统](./design-system.md)
- [ ] M03 [Sanity 内容后台](./sanity-cms.md)
- [ ] M04 [内容访问层](./content-access.md)
- [x] M05 [国际化](./internationalization.md)
- [x] M06 [主题系统](./theme.md)
- [x] M07 [应用外壳与导航](./app-shell.md)
- [x] M08 [首页开场动画](./intro-animation.md)
- [x] M09 [首页内容](./home.md)
- [x] M10 [摄影列表](./photography-list.md)
- [x] M11 [摄影查看器](./photography-viewer.md)
- [x] M12 [科研成果](./research.md)
- [x] M13 [简历与联系方式](./resume-contact.md)
- [ ] M14 [内容刷新](./content-revalidation.md)
- [ ] M15 [端到端、无障碍与性能验证](./quality-assurance.md)
- [ ] M16 [开发预览部署](./preview-deployment.md)

## 推荐执行顺序

```text
M01
├── M02 ── M06 ── M07 ── M08
├── M03 ── M04 ── M14
└── M05

M02 + M04 + M05 ── M10 ── M11
M02 + M04 + M05 ── M12
M02 + M04 + M05 ── M13
M04 + M07 + M08 + M11 + M12 + M13 ── M09

M01-M14 完成后：M15 -> M16
```

在满足依赖关系后，M05、M06、M08、M10、M12、M13 和 M14 可以独立推进。

## 模块完成记录

| 模块 | 完成日期 | 验证方式 | 备注 |
| --- | --- | --- | --- |
| M01 | 2026-07-27 | `npm run typecheck && npm run lint && npm test && npm run build` | Next.js 16.2.12；4 个测试文件、92 项测试通过；生产构建通过。 |
| M02 | 2026-07-27 | `npm run typecheck && npm run lint && npm test && npm run build` | Tailwind/PostCSS、基础组件、Dialog、axe 与视觉快照；最终全量 17 文件、155 项测试通过。 |
| M03 | 未完成 | M03 定向测试 14 项；typecheck、lint、build、`/studio` HTTP 冒烟通过 | 离线 Schema/动作完成；缺少 Sanity 非交互身份与项目，T01、T14 及真实所有者权限验收阻塞。 |
| M04 | 未完成 | M04 定向测试 53 项；typecheck、lint、全量 279 项、build 通过 | T01–T12 及离线完成标准通过；缺少真实 Sanity project/dataset，T13 只读冒烟未执行。 |
| M05 | 2026-07-27 | 单元/组件测试、HTTP 路由冒烟、全量构建 | `/` 307→`/zh`；`zh`/`en` 200、非法语言 404；上下文保留测试通过。 |
| M06 | 2026-07-28 | `npm run typecheck && npm run lint`；主题定向测试 22 项 | next-intl 文案、主题持久化与损坏存储降级、系统主题、对比度及图片无滤镜均验证通过；生产构建由主 Agent 集成复核通过。 |
| M07 | 2026-07-30 | `npm run typecheck && npm run lint && npm test`；M07 定向测试 32 项 | 桌面与移动导航、焦点循环、路由关闭、跳转链接、三视口与 axe 均通过；全量 279 项回归通过。 |
| M08 | 2026-07-30 | `npm run typecheck && npm run lint && npm test`；M08 定向测试 22 项 | 1000ms 安全退出、reduced motion、卸载清理、重复进入与服务端正文验证通过；全量 279 项回归通过。 |
| M09 | 2026-07-30 | M09 定向测试 55 项；`npm run typecheck && npm run lint && npm test && npm run build` | 六路并行内容、三级 Hero 回退、独立错误隔离、模块复用与响应式图片通过；全量 399 项回归通过。 |
| M10 | 2026-07-30 | M10 定向测试 30 项；全量静态检查、测试与生产构建 | URL 分类、20 张游标分页、瀑布流、取消防串、重试和 100 张 Fixture 渐进加载通过。 |
| M11 | 2026-07-30 | M11 定向测试 31 项；M15 三设备 Playwright；全量静态检查、测试与生产构建 | 动态 Lightbox、缩放、键盘/触摸、信息、预取与焦点恢复通过；真实浏览器三视口旅程由 M15 验收。 |
| M12 | 2026-07-30 | M12 关联测试 47 项；全量静态检查、测试与生产构建 | 卡片/居中弹窗、1–3 图、长内容、焦点与移动滚动通过；图片使用共享响应式 URL seam。 |
| M13 | 2026-07-30 | M13 定向测试 28 项；全量静态检查、测试与生产构建 | 简历排序、双语、PDF 有无、公开邮箱、三视口与 axe 验证通过。 |
| M14 | 未完成 | M14 定向测试 52 项；全量静态检查、399 项测试与生产构建通过 | T01–T08、T10–T11 完成；缺 Sanity 身份/project/dataset/secret，T09 与 T12 真实 Webhook/发布实测阻塞。 |
| M15 | 未完成 | 62 个 Vitest 文件/402 项；3 项目 Playwright 42 项；12 张视觉基线；axe；typecheck、lint、Turbopack/webpack build | 本地 T01–T16 均通过；唯一未满足完成标准为真实 Sanity 发布后 60 秒刷新旅程（QA-001），受 M03/M14 外部条件阻塞。 |
| M16 | 未完成 | Preview 定向测试 36 项；最终 typecheck、lint、63 文件/405 项测试、生产构建；远程 smoke 2 项可枚举 | T01、T02、T10–T12 与秘密扫描完成；Vercel 身份有效但无匹配项目/无 Git 仓库，且 Sanity 身份、project、dataset、secret、origin 缺失，T03–T09/T13 阻塞。 |
