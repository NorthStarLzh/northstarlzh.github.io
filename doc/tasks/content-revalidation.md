# M14 内容刷新

## 模块目标

实现 Sanity 发布后的签名 Webhook 和按内容类型清理缓存，使公开页面通常立即更新，并以 60 秒缓存周期兜底。

## 前置依赖

- M03 Sanity 内容后台。
- M04 内容访问层。

## 最小任务

- [x] M14-T01 创建 `POST /api/revalidate` Route Handler，拒绝其他方法。
- [x] M14-T02 定义只包含 `documentId`、`documentType` 的请求体契约和大小上限。
- [x] M14-T03 使用原始请求体和服务端密钥校验 Webhook 签名。
- [x] M14-T04 实现文档类型白名单和缓存标签映射。
- [x] M14-T05 对 profile、education、award、photo、researchProject 分别刷新正确标签。
- [x] M14-T06 返回最小成功信息，不返回密钥、Token 或内部 CMS 配置。
- [x] M14-T07 对无效签名返回 401，对非法类型/请求体返回 400。
- [x] M14-T08 保证重复 Webhook 幂等，不创建重复内容或额外写入。
- [ ] M14-T09 配置 Sanity 发布 Webhook 和环境密钥。
- [x] M14-T10 为有效签名、无效签名、类型映射、重复调用和请求上限添加集成测试。
- [x] M14-T11 模拟 Webhook 失败，验证最多 60 秒兜底刷新仍然生效。
- [ ] M14-T12 在开发数据集发布一条内容，记录公开页面更新时间并确认不超过目标。

## 完成标准

- [ ] 正常发布无需重新部署即可更新页面。
- [x] Webhook 失败不会造成内容长期不一致。
- [x] 日志和响应均不泄露任何秘密。

## 验证记录（2026-07-30）

- 离线实现完成：Route 只导出 `POST`；请求体严格限制为 `documentId` 与
  `documentType` 两个字段、最大 8 KiB 且只接受 JSON。签名使用 Sanity 官方
  `@sanity/webhook` 对未解析的原始正文校验，同时兼容 Sanity 标准
  `sanity-webhook-signature` 与详细设计指定的 `X-Webhook-Signature`。
- 白名单标签映射为：`profile -> profile`、`education -> education + resume`、
  `award -> awards + resume`、`photo -> photos + home`、
  `researchProject -> research + home`。响应只包含标签或稳定错误码；无效签名为
  401，非法正文/类型/大小为 400，服务端配置或标签失效异常为脱敏 500。
- `npm test -- tests/unit/content-revalidation-api.test.ts
  tests/unit/sanity-content-infrastructure.test.ts tests/unit/sanity-repositories.test.ts`
  通过：3 个文件、52 项测试。`npm run lint` 通过。`npm run typecheck` 的 M14
  代码已被检查，但全局命令当前被并发 M11 的 `photo-viewer` 测试所引用的尚未落盘
  导出/模块阻断；该错误不来自 M14，留主 Agent 集成复核。
- 再次检查运行环境后，仍没有 `NEXT_PUBLIC_SANITY_PROJECT_ID`、
  `NEXT_PUBLIC_SANITY_DATASET`、`SANITY_AUTH_TOKEN`、`SANITY_API_TOKEN` 或
  `SANITY_REVALIDATE_SECRET`，也没有可复用的 `.env.local`。因此无法安全创建或配置
  真实 Sanity 发布 Webhook，也无法在 development dataset 发布内容并记录公开页面
  刷新时间。M14-T09、M14-T12 与“正常发布无需重新部署即可更新页面”完成标准保持
  未勾选，未伪造外部成功结果。
