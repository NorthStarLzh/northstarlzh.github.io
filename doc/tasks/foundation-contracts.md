# M01 基础契约与测试数据

## 模块目标

初始化可运行的 Next.js TypeScript 项目，建立不依赖 Sanity 和 UI 库的领域契约、校验规则及可重复使用的测试数据。后续模块只能依赖这里公开的类型和测试工厂。

## 前置依赖

无。

## 最小任务

- [x] M01-T01 初始化 Next.js App Router、TypeScript、Lint、测试运行器和统一包管理脚本，确认开发服务器、类型检查和空测试均可执行。
- [x] M01-T02 建立详细设计第 5 节约定的核心目录，添加目录职责说明，禁止页面直接访问 Sanity。
- [x] M01-T03 定义 `Locale`、`ThemeMode`、`PhotoCategory`、`LocalizedText` 和 `ImageAsset` 类型，并为枚举值编写单元测试。
- [x] M01-T04 定义 `Profile`、`EducationEntry`、`AwardEntry` 领域类型，并创建最小合法 Fixture。
- [x] M01-T05 定义 `Photo`、`PageResult<Photo>`、摄影分页输入类型，并创建风光、人像与跨分类 Fixture。
- [x] M01-T06 定义 `PaperResult`、`ResearchProject` 领域类型，并创建包含 1、2、3 张图片的 Fixture。
- [x] M01-T07 实现双语非空、邮箱、`YYYY-MM`、图片宽高、摄影分类、科研图片数量等纯函数校验器。
- [x] M01-T08 为每个校验器添加合法边界、非法边界和空值单元测试。
- [x] M01-T09 生成约 100 张仅含元数据的确定性摄影测试集，确保精选 5 张、两类作品和多个年月均被覆盖。
- [x] M01-T10 建立 `InMemoryProfileRepository`、`InMemoryPhotoRepository`、`InMemoryResearchRepository` 的接口骨架和测试替身。
- [x] M01-T11 添加测试数据不变性检查：精选照片不超过 5、精选科研不超过 3、科研图片为 1 至 3 张。
- [x] M01-T12 运行类型检查、Lint 和单元测试，并修复全部失败。

## 完成标准

- [x] 后续模块无需连接 Sanity 即可使用完整领域对象进行开发。
- [x] Fixture 每次运行结果一致，不包含真实密钥或未公开信息。
- [x] 所有契约和校验测试通过。
