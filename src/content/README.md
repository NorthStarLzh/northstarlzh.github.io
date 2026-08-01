# Content boundary

Public pages consume `contracts` and repository interfaces. Raw CMS documents and GROQ stay inside `sanity`, while `mappers` convert them to validated domain objects. No page may access Sanity directly.
