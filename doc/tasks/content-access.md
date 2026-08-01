# M04 内容访问层

## 模块目标

通过 Repository、Mapper 和缓存适配器隔离 Sanity，使页面只依赖领域契约，并在内容异常时提供可预测的模块级失败策略。

## 前置依赖

- M01 基础契约与测试数据。
- M03 Sanity 内容后台。

## 最小任务

- [x] M04-T01 创建只读 Sanity Client 工厂，区分开发数据集配置并保证前端不包含写入 Token。
- [x] M04-T02 定义 `ProfileRepository`、`PhotoRepository`、`ResearchRepository` 的最终接口。
- [x] M04-T03 编写个人资料、教育和获奖 GROQ 查询，查询结果只包含渲染所需字段。
- [x] M04-T04 编写首页主图、5 张精选照片和摄影分页 GROQ 查询，保证排序稳定。
- [x] M04-T05 编写 3 个精选科研、全部科研和按 ID 获取科研项目的 GROQ 查询。
- [x] M04-T06 实现个人资料 Mapper，将 Sanity 文档转换为 `Profile`、`EducationEntry`、`AwardEntry`。
- [x] M04-T07 实现摄影 Mapper，生成宽高比、替代文本、分类、年月和图片资产字段。
- [x] M04-T08 实现科研 Mapper，校验 1 至 3 张图片和论文名称列表。
- [x] M04-T09 对单条非法普通文档执行“记录并排除”，对缺失个人资料执行显式错误。
- [x] M04-T10 实现 `profile`、`education`、`awards`、`photos`、`research`、`home` 缓存标签和 60 秒兜底周期。
- [x] M04-T11 实现首页主图缺失时使用第一张精选照片的回退逻辑。
- [x] M04-T12 为 Mapper、查询参数、排序、非法数据和 CMS 失败添加单元/集成测试。
- [ ] M04-T13 用真实开发数据集完成一次只读冒烟查询，确认不产生写入。

## 完成标准

- [x] 页面与业务组件不直接导入 Sanity SDK 或 GROQ。
- [x] Sanity 原始类型不会越过 Mapper 层。
- [x] 缓存和错误行为有自动测试覆盖。

## 验证记录（2026-07-30）

- M04 定向验证：`npx vitest run tests/unit/content-mappers.test.ts tests/unit/sanity-content-infrastructure.test.ts tests/unit/sanity-repositories.test.ts`，3 个文件、53 项测试通过。
- 全仓验证：`npm run typecheck && npm run lint && npm test`，类型检查与 lint 通过，33 个测试文件、279 项测试通过。
- 生产构建：`npm run build` 通过；Next.js 16.2.12 完成编译、类型检查和 5 个静态页面生成。
- 依赖边界扫描：公开页面、功能模块和共享组件未导入 Sanity SDK、GROQ 或 `src/content/sanity`；唯一 Sanity 命中为预期的 Studio 管理后台入口 `src/app/studio/[[...tool]]/page.tsx`。
- M04-T13 阻塞证据：当前进程中 `NEXT_PUBLIC_SANITY_PROJECT_ID` 与 `NEXT_PUBLIC_SANITY_DATASET` 均未配置；仓库根目录只有不含真实值的 `.env.example`。因此没有可解析的真实开发项目/数据集目标，未发起、未伪造真实查询，T13 保持未勾选。
