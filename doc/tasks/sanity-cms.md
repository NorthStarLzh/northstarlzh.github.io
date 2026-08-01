# M03 Sanity 内容后台

## 模块目标

建立仅供网站所有者使用的浏览器后台，完整覆盖个人资料、教育、获奖、摄影与科研内容，并在保存后直接公开。

## 前置依赖

- M01 基础契约与测试数据。

## 最小任务

- [ ] M03-T01 创建 Sanity 项目配置、开发数据集和 `/studio` 路由，确认未登录状态要求身份验证。
- [x] M03-T02 定义可复用双语短文本、双语长文本和双语列表 Schema 对象。
- [x] M03-T03 实现 `profile` 单例 Schema，包含头像、简介、学校、身份、邮箱、首页主图和 PDF 简历。
- [x] M03-T04 实现 `education` Schema，包含双语机构、说明、起止时间和排序。
- [x] M03-T05 实现 `award` Schema，包含双语奖项、时间、可选说明和排序。
- [x] M03-T06 实现 `photo` Schema，包含图片、双语替代文本、分类、年月、城市、介绍、精选和精选顺序。
- [x] M03-T07 实现 `researchProject` Schema，包含双语名称、时间、简介、1 至 3 张图片、论文列表、精选和顺序。
- [x] M03-T08 添加邮箱、年月、PDF MIME、必填双语、分类、图片数量和非负排序校验。
- [x] M03-T09 添加跨文档异步校验，限制精选照片最多 5、首页精选科研最多 3、同类精选顺序不重复。
- [x] M03-T10 配置后台内容树：个人资料单例、教育、获奖、摄影、科研。
- [x] M03-T11 实现“保存并公开”文档动作，校验失败时不得发布。
- [x] M03-T12 配置删除二次确认和可用的历史恢复入口。
- [x] M03-T13 编写 Schema 校验测试和发布动作测试。
- [ ] M03-T14 使用测试账号完成新增、编辑、删除、上传图片和替换 PDF 的后台冒烟测试。

## 完成标准

- [ ] 所有公开内容均可在浏览器中维护。
- [ ] 后台无法发布违反数量、格式或双语完整性约束的内容。
- [ ] 除网站所有者外无人获得后台写入权限。

## 验证记录（2026-07-27）

- 仓库实现已通过 `npm run typecheck`、`npm run lint` 以及 M03 的 14 项单元测试。
- `/studio` 路由和 `development` 数据集配置已实现，但执行环境中
  `NEXT_PUBLIC_SANITY_PROJECT_ID`、`NEXT_PUBLIC_SANITY_DATASET`、
  `NEXT_PUBLIC_SANITY_API_VERSION`、`SANITY_READ_TOKEN` 均不存在，且没有
  `.env.local` / `.env.development.local`。因此无法创建或连接真实 development
  dataset，也无法证明未登录重定向、所有者权限与真实增删改、图片上传、PDF
  替换；M03-T01、M03-T14 和权限完成标准保持未勾选。
- 全量 `npm test` 当次运行共 151 项，其中 M03 测试全部通过；另有 5 项 M02
  设计系统测试失败（测试 DOM 清理、图片 `sizes` 与焦点断言），不在本模块修改边界内。

## 阻塞复核（2026-07-28）

- 再次逐项复核现有离线实现；`npm test -- tests/unit/sanity-validation.test.ts
  tests/unit/sanity-actions.test.ts` 的 2 个文件、14 项测试全部通过，`npm run
  typecheck`、`npm run lint` 和 `npm run build` 均通过。构建产物包含动态路由
  `/studio/[[...tool]]`；启动生产服务器后请求 `/studio` 返回 `HTTP 200` 和 HTML。
  最终全量 `npm test` 的 22 个文件、187 项测试也全部通过。
- 首次在沙箱内构建因 Turbopack 子进程无法绑定本地端口而失败（`EPERM`）；在获准的
  沙箱外环境原命令重跑后成功。这是执行环境限制，不是应用构建错误。
- 相关 7 个环境变量 `NEXT_PUBLIC_SANITY_PROJECT_ID`、
  `NEXT_PUBLIC_SANITY_DATASET`、`NEXT_PUBLIC_SANITY_API_VERSION`、
  `SANITY_READ_TOKEN`、`SANITY_AUTH_TOKEN`、`SANITY_API_TOKEN`、
  `SANITY_REVALIDATE_SECRET` 均未设置；常见 Sanity CLI 配置目录初始均不存在。
  `npx sanity projects list` 在沙箱内和获准联网后各执行一次，均以状态码 1 返回
  `Error: Failed to list projects`。CLI 随后创建的 42 字节配置文件只有遥测披露状态，
  没有认证字段。
- 浏览器控制运行时没有可用浏览器实例，因此本次只能以生产构建和 HTTP 请求验证
  Studio 路由壳层，不能替代真实后台交互。
- 因不存在非交互 Sanity 身份、真实项目标识或测试账号，本次无法安全创建/复用
  `development` dataset，也无法验证未登录身份挑战、单所有者写权限、真实新增/编辑/
  删除、图片上传及 PDF 替换。M03-T01、M03-T14 与三个完成标准继续保持未勾选，
  未将外部失败伪报为成功。
