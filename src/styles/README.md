# Styles

`globals.css` is the single Tailwind v4 entry point. The application root layout
must import it once:

```ts
import '@/styles/globals.css';
```

Business modules should use the semantic CSS variables (`--color-surface`,
`--space-lg`, `--radius-md`, and related tokens) or the local components under
`src/components`. Shared breakpoint values are exported by `tokens.ts`; do not
add feature-local media-query breakpoints.
