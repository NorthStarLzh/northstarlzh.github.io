# Sanity Studio boundary

The embedded Studio is available at `/studio`. It uses Sanity authentication and
the `development` dataset by default. Configure the public Sanity identifiers from
`.env.example`; no write token belongs in the Next.js application.

The content tree exposes the fixed `profile` singleton followed by education,
awards, photography, and research. Managed documents use **保存并公开**, an explicit
delete confirmation, and Sanity's built-in history/restore recovery entry points.

Project-side access control must be configured in Sanity Manage: invite only the
website owner, do not enable public write grants, and add the preview origin to CORS.
These external controls cannot be proven from repository code.
