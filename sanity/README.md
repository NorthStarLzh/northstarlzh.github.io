# Sanity Studio boundary

The embedded Studio is available at `/studio`. It uses Sanity authentication and
the `development` dataset by default. Configure the public Sanity identifiers from
`.env.example`; no write token belongs in the Next.js application.

The content tree exposes the fixed `profile` singleton followed by education,
awards, photography, and research. Photography is grouped under **摄影管理** so the
batch uploader, complete work list, and collections stay together. The uploader
can apply shared categories, category-page ordering number, shooting month, and
city to a batch; duplicate pending files are skipped and failed items remain for
retry. In **全部摄影作品管理**, **替换图片** uploads a new asset and directly
overwrites the published image while retaining its metadata; an existing draft is
updated as well, so editors do not need to unpublish first. Managed documents use
**保存并公开**, an explicit delete confirmation, and Sanity's built-in
history/restore recovery entry points.

Project-side access control must be configured in Sanity Manage: invite only the
website owner, do not enable public write grants, and add the preview origin to CORS.
These external controls cannot be proven from repository code.
