# M13 简历与联系方式

## 模块目标

实现可在首页和独立简历页复用的个人简介、教育、获奖、PDF 下载及邮箱组件，不引入表单、社交平台或 PDF 阅读器。

## 前置依赖

- M01 基础契约与测试数据。
- M02 设计系统。
- M04 内容访问层。
- M05 国际化。

## 最小任务

- [x] M13-T01 创建中英文简历页面并通过 Repository 获取个人资料、教育和获奖数据。
- [x] M13-T02 实现 `ProfileSummary`，展示头像、昵称和当前语言简介。
- [x] M13-T03 实现 `EducationTimeline`，按后台 `order` 升序展示。
- [x] M13-T04 实现 `AwardList`，按后台 `order` 升序展示，并支持可选说明为空。
- [x] M13-T05 实现首页用的紧凑简历摘要，复用 Profile、Education、Award 展示组件。
- [x] M13-T06 实现单一 PDF 下载按钮，使用 CMS 文件下载 URL 和稳定文件名。
- [x] M13-T07 PDF 缺失时隐藏失效链接并显示当前语言的暂不可用提示。
- [x] M13-T08 确认网站不解析、翻译或内嵌 PDF；下载卡片只显示对应 PDF 首页生成的静态预览图。
- [x] M13-T09 实现独立 `ContactSection` 页面与 `contact` 区块，提供唯一公开邮箱入口及来信提示。
- [x] M13-T10 生成经过校验的 `mailto:` 链接，不添加表单、电话或社交媒体。
- [x] M13-T11 添加排序、双语、PDF 存在/缺失、邮箱合法性和首页复用测试。
- [x] M13-T12 在三类设备验证时间线、奖项、下载按钮和联系方式布局。

## 完成标准

- [x] 首页摘要和简历页共享领域组件，不复制排序逻辑。
- [x] 只有一个 PDF 下载入口行为，文件可由后台替换。
- [x] 联系模块不会写入数据、设置 Cookie 或发送表单请求。

## 验证记录（2026-07-30）

- M13 与受影响字典定向验证：`npx vitest run tests/unit/i18n-messages.test.ts tests/unit/resume-content.test.ts tests/unit/resume-components.test.tsx tests/unit/resume-page.test.tsx tests/unit/contact-section.test.tsx tests/unit/resume-contact-visual.test.tsx`，6 个文件、28 项测试通过。
- 类型检查：`npm run typecheck` 通过。
- 本模块 Lint：`npx eslint 'src/app/[locale]/resume/page.tsx' src/features/resume src/features/contact tests/unit/resume-content.test.ts tests/unit/resume-components.test.tsx tests/unit/resume-page.test.tsx tests/unit/contact-section.test.tsx tests/unit/resume-contact-visual.test.tsx --max-warnings=0` 通过。
- 边界扫描确认简历/联系页面与组件未直接访问 Sanity/GROQ，且未引入 PDF 阅读器、表单、电话、社交平台、Cookie 或请求写入。
- 真实 Sanity development dataset 仍未配置；页面通过 Repository seam 与 Fixture 完成开发和 SSR 测试，默认路由在无可用内容服务时显示本地化模块错误状态。
