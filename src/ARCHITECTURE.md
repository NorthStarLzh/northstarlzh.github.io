# Source directory responsibilities

The source tree follows the one-way dependency rules in `doc/detailed_design.md`:

- `app`: routing and composition only. Pages may call repository interfaces, but must never import a Sanity client, GROQ query, raw Sanity document, or `content/sanity` module.
- `features`: business UI and interaction modules. Features depend on domain contracts and shared components, not on another feature's internals.
- `components`: reusable layout, UI, and feedback primitives. `components/ui` does not import feature modules.
- `content/contracts`: CMS-independent domain types, repository interfaces, and validation rules.
- `content/repositories`: repository implementations and test substitutes behind the public interfaces.
- `content/mappers`: defensive conversion from external documents into domain objects.
- `content/sanity`: the only source location allowed to import the Sanity SDK or contain GROQ queries.
- `config`, `i18n`, `lib`, and `styles`: cross-cutting configuration, messages, utilities, and design tokens.

The dependency direction is `app -> features -> content/contracts` and
`content/repositories -> content/mappers -> content/contracts`. External CMS data
must be mapped before it reaches a page or React component.
