# M15 质量验证问题与例外

> 验证日期：2026-07-30  
> 范围：本地 Fixture 驱动的公开站点，不包含真实 Sanity 写入或 Vercel 预览。

## 测试环境

| 项目 | 值 |
| --- | --- |
| 操作系统 | macOS arm64 |
| Node / npm | Node 23.9.0 / npm 10.9.2（项目声明支持 Node 22.13+ 或 24+；见 QA-003） |
| Web | Next.js 16.2.12 本地开发服务器，`http://127.0.0.1:3100` |
| 浏览器 | Playwright 1.62.0，Chromium 151.0.7922.34 |
| 桌面项目 | 1440 × 900，1× DPR |
| 平板项目 | 820 × 1180，触控，1× DPR |
| 手机项目 | 390 × 844，触控，1× DPR |
| 内容 | `E2E_FIXTURE_MODE=1`；100 张确定性测试照片、双语内容、1–3 图科研项目与本地测试 PDF |

## 已通过结果

- Playwright：桌面、平板、手机共 42 条测试通过；12 张首页、摄影、科研、简历视觉基线复跑一致。
- 无障碍：四个核心页面在稳定动效状态下均无 axe `serious` 或 `critical` 违规。
- 性能：三项目均满足 LCP ≤ 2500ms、CLS ≤ 0.1、主题交互响应 ≤ 200ms、开场动画 ≤ 1000ms；测试报告附有每项目 JSON 指标。这里的 LCP 是本机预热开发服务器与本地占位图实验室结果，不代表真实网络 RUM。
- 摄影规模：公开分页 API 的风光与人像集合并后正好 100 个唯一 ID；首屏固定 20 张，未一次性渲染全部内容。
- 隐私：未发现第三方、统计、广告或行为追踪请求；没有营销 Cookie 或额外业务存储。只观察到功能性 `NEXT_LOCALE` Cookie，以及 Next.js 开发服务器的 `__next_debug_channel:*` 临时会话键。

| 项目 | LCP | CLS | 主题交互响应 | 开场动画 |
| --- | ---: | ---: | ---: | ---: |
| 桌面 | 64ms | 0.0011 | 1.80ms | 804ms |
| 平板 | 60ms | 0 | 1.10ms | 802ms |
| 手机 | 48ms | 0 | 0.90ms | 811ms |

## 外部阻塞

### QA-001：真实 CMS 发布后 60 秒内更新旅程未执行

- 状态：外部阻塞，不以 Mock 冒充成功。
- 对应：详细设计 26.4 第 10 项、M15 完成标准第一项。
- 证据：M03、M04、M14 已记录当前环境缺少可用的 Sanity 身份、project、dataset 与 webhook secret；因此无法安全创建测试发布、触发真实 Webhook 并观察公开页面更新。
- 解锁条件：提供或配置免费层测试 Sanity 项目、development dataset、所有者身份和独立 webhook secret 后，在 Preview 或隔离测试环境执行一次真实发布旅程。

## 已解决的整合问题

### Next.js Page 与 Route Handler 的测试 helper 具名导出

- 原因：home、photography、resume 三个 Page，以及 photos、revalidate 两个 Route Handler 曾直接导出测试 helper，不符合 Next.js 特殊文件导出约束。
- 处理：helper 已迁移到普通模块，相关测试导入同步更新。
- 复核：迁移后 `npm run typecheck`、`npm run lint`、相关定向测试、42 项三视口 Playwright 和 `npm run build -- --webpack` 均通过；生产构建完成 13 个静态页面的数据收集与生成。

## 已知非阻塞问题

### QA-002：首批摄影和科研占位图触发 Next.js LCP 加载建议

- 现象：开发服务器提示首屏候选占位图使用 `loading="lazy"`，建议对真正位于视口内的首张图使用 eager 策略。
- 影响：当前三视口实验室预算均通过，功能、CLS 和分批加载未受影响；真实高分辨率素材仍可能放大影响。
- 建议：在接入真实内容后复测摄影页与科研页 LCP，并只把首屏可见的第一张候选图提升为 eager，不扩大整批预加载。

### QA-003：本机默认 Node 版本不在项目声明范围内

- 现象：本机为 Node 23.9.0，`package.json` 声明 `^22.13.0 || >=24.0.0`。
- 影响：本次 Lint、402 项 Vitest、42 项 Playwright 和完整 webpack 生产构建均可运行；引擎告警仍会降低环境可复现性。
- 建议：CI 和预览部署固定 Node 24，开发机按 `.nvmrc` 切换后再做一次发布前门槛复核。

### QA-004：Next.js 开发模式客户端导航产生脚本标签诊断提示

- 现象：中英文客户端切换时，开发服务器偶发输出“Scripts inside React components are never executed”诊断；生产功能和测试断言未失败。
- 影响：当前为开发模式诊断，未产生外部请求、注水错误或用户可见故障。
- 建议：在 M16 Preview 的生产构建上复核浏览器控制台；若仍出现，再定位主题启动脚本与客户端路由的组合。
