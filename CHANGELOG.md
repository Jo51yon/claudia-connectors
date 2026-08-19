# Changelog

Semantic versioning: MAJOR = a prop, exported type, or default behaviour changed in a way that
could break an existing consumer without any code change on their side. MINOR = additive only.
Consuming projects should pin to a tag (`#v1.0.0`), never `#main`.

## v1.1.1 — 2026-08-19

Patch. `supabase` prop's `rpc()` return type was typed as `Promise<...>`, but real
`@supabase/supabase-js` returns a `PostgrestFilterBuilder` — thenable, but missing `.catch`/
`.finally`/`Symbol.toStringTag`, so it fails structural assignability against `Promise` even
though `.then()` (the only method this component actually calls) works identically. Caught
integrating into PETGI's real Settings.tsx, not in isolation — widened to `PromiseLike<...>`,
the minimal type that matches both what Supabase actually returns and what this component
actually uses.

## v1.1.0 — 2026-08-19

Additive only, no consumer needs to change anything to stay on this version. Adds optional
`skillUrl` prop: renders a "Download {productName} skill" link, generalising a feature found
in PETGI's original hand-written Settings.tsx section (which downloaded via
`claudia-skill-source?slug=petgi`, itself already a shared pattern per component-library.md)
rather than dropping it during extraction.

## v1.0.0 — 2026-08-19

First release. `ConnectAIPanel` — generic, multi-provider "Connect an AI assistant" panel,
extracted from PETGI's real Settings.tsx and generalized. Provider support level is
fact-checked per provider, not assumed uniform: Claude has a genuine one-click browser OAuth
flow; Kimi Code CLI has real OAuth via its own CLI command; Gemini, GLM and GitHub Copilot's
web chat have no consumer connector UI today and are given accurate URL/config guidance
instead of an overclaimed one-click flow.

**Known consumers at this tag:** none yet at release — PETGI is the first real adoption,
landing in the same session this tag was cut.
