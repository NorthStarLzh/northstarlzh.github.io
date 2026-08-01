# M02 设计系统

## 模块目标

建立低饱和、摄影优先的基础视觉系统和可复用 UI 适配层，使业务模块不直接依赖第三方 Dialog、图库或状态组件实现。

## 前置依赖

- M01 基础契约与测试数据。

## 最小任务

- [x] M02-T01 配置 Tailwind CSS，并建立颜色、间距、圆角、阴影、字级、动效和层级 Token。
- [x] M02-T02 实现全局字体、页面背景、正文、链接、选择文本和清晰焦点样式。
- [x] M02-T03 实现 `Container`、`Section`、`Stack`、`Cluster` 等最小布局组件并编写渲染测试。
- [x] M02-T04 实现按钮、图标按钮、链接按钮的尺寸、禁用、加载和键盘焦点状态。
- [x] M02-T05 实现响应式 `AppImage` 基础组件，要求宽高、替代文本和加载策略均可显式传入。
- [x] M02-T06 封装无障碍 `Dialog` 适配层，公开标题、描述、关闭和内容接口，不向业务模块泄露第三方类型。
- [x] M02-T07 实现 `ModuleState`，覆盖 loading、empty、error 和 retry 状态，并准备双语文案入口。
- [x] M02-T08 实现 Skeleton，占位尺寸必须接近真实内容，避免布局明显跳动。
- [x] M02-T09 建立手机、平板和桌面统一断点，禁止业务模块自行定义冲突断点。
- [x] M02-T10 为按钮、Dialog、状态组件运行键盘与 axe 组件测试。
- [x] M02-T11 创建组件展示页或测试 Story，人工检查浅色、深色和三类视口。
- [x] M02-T12 运行类型检查、组件测试和视觉快照，修复全部失败。

## 完成标准

- [x] 业务模块可只使用语义 Token 和本地 UI 组件完成布局。
- [x] Dialog 支持焦点捕获、Esc、关闭后焦点恢复。
- [x] 基础组件不存在阻塞级无障碍问题。

## 验证记录

- 完成日期：2026-07-27
- 模块测试：`npx vitest run tests/unit/design-system-*.test.ts tests/unit/design-system-*.test.tsx`，7 个测试文件、28 项测试通过。
- 全量回归：`npm test`，17 个测试文件、154 项测试通过（最终集成结果）。
- 静态检查：`npm run typecheck` 与 `npm run lint` 通过。
- 样式编译：Tailwind/PostCSS 对 `src/styles/globals.css` 的实际编译通过，且无递归 Token。
- 生产构建：`npm run build` 通过（沙箱端口权限限制后经批准提升权限验证）。

### 2026-07-28 复核

- 补齐外部受控触发器关闭后的焦点恢复测试与实现；Dialog 不再要求业务模块必须使用内置 `trigger` 才能恢复焦点。
- 修正手机端底部 Dialog 的进入动画坐标系，避免复用居中弹窗关键帧造成明显位移。
- Skeleton 文本行数对 `0`、负数、`NaN` 和 `Infinity` 使用单行稳定占位。
- 模块测试：`npx vitest run tests/unit/design-system-*.test.ts tests/unit/design-system-*.test.tsx`，7 个测试文件、34 项测试通过。
- 全量回归：`npm test`，22 个测试文件、180 项测试通过。
- 静态检查：`npm run typecheck` 与 `npm run lint` 通过。
- 样式编译：通过 PostCSS + Tailwind 实际编译 `src/styles/globals.css`，生成 19334 字节 CSS 并包含手机 Dialog 动画。
- 本轮生产构建由主 Agent 在集成阶段执行，避免与 M01 持有的 Next.js 构建锁冲突；上一轮生产构建记录仍有效。
