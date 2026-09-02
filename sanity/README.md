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

## Publish content to GitHub Pages

GitHub Pages serves a static export, so content is read from Sanity during each
Pages build. The **保存并公开** action writes the document to Sanity, but it
does not by itself update the public site.

For immediate updates, run **Deploy to GitHub Pages** from the repository's
Actions tab. For automatic updates, create a Sanity document webhook in
Sanity Manage → API → Webhooks with these settings:

- URL: `https://api.github.com/repos/NorthStarLzh/northstarlzh.github.io/dispatches`
- Method: `POST`
- Dataset: `development`
- Events: create, update, and delete; leave drafts disabled.
- Filter: `_type in ["profile", "education", "award", "photo", "photoCollection", "researchProject"]`
- Projection: `{ "event_type": "sanity-update" }`
- Headers: `Accept: application/vnd.github+json`,
  `Authorization: Bearer <GitHub fine-grained token>`.

The GitHub token must be restricted to this repository and granted only
**Contents: write**, which is required to create a `repository_dispatch` event.
Store it only in the webhook header—never in this repository or a `NEXT_PUBLIC_`
environment variable. A successful delivery returns HTTP `204` and starts the
existing Pages workflow.
