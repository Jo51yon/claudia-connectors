# Changelog

Semantic versioning: MAJOR = a prop, exported type, or default behaviour changed in a way that
could break an existing consumer without any code change on their side. MINOR = additive only.
Consuming projects should pin to a tag (`#v1.0.0`), never `#main`.

## v1.3.0 — 2026-08-20

Additive. Adds `providers` (filter, reorder, or add project-specific entries to the built-in
list) and `defaultProviderKey` (which tab is active first) as real config -- found in a
systematic audit against the 'fully configurable, working defaults' bar: PROVIDERS was a
module-level constant with no way to override it short of forking the component. Defaults to
the full built-in list and 'claude', unchanged behaviour for every existing consumer.

Real crash risk found and fixed while adding this, not shipped: a caller passing an empty
providers array, or a defaultProviderKey matching nothing in a filtered list, would have hit
provider.cliCommand on undefined. Falls back to the first entry in providers, and a genuinely
empty list now renders a real, visible message instead of crashing.

## v1.2.0 — 2026-08-19

Corrects a real inaccuracy from v1.0.0, adds two real providers. Not hypothetical improvements
— found while checking SafeSpaces' own, more mature `ConnectMcpPanel`/`mcpProviders.ts` for a
genuine cross-codebase sync, then independently verified each claim before bringing anything
back rather than copying it blind:

- **Claude now has a real one-click deep link.** v1.0.0-v1.1.2 claimed "Claude has no link
  that pre-fills this yet" — wrong. Confirmed via a real Anthropic-tracked GitHub issue
  (anthropics/claude-ai-mcp#74): `?modal=add-custom-connector&mcpName=...&mcpServerUrl=...`
  genuinely pre-populates the Add Custom Connector dialog. The "copy the URL, paste it
  yourself" step this package always described for Claude was never actually necessary.
- **Cursor**, added: `cursor://anysphere.cursor-deeplink/mcp/install?name=...&config=...`
  (base64 JSON). Verified against Cursor's own official docs — and caught a real bug while
  verifying, not copied from SafeSpaces' implementation as-is: the config JSON requires a
  `"type"` field (`"http"` here); SafeSpaces' own `mcpProviders.ts` sends `{url}` without one,
  which the schema doesn't call for. Fixed here, not propagated.
- **VS Code**, added: `vscode:mcp/install?<url-encoded-json>`.
- `deepLink` changed from a static string to a function
  `({slug, url, productName}) => string` so it can build the real per-connection URL instead
  of a bare settings page. Export *names* unchanged (verified: `check-breaking-exports.mjs`
  passes clean) and no known real consumer constructs an `AIProvider` object directly — all
  three current consumers only ever pass props to `<ConnectAIPanel>` — so this ships as MINOR,
  not MAJOR, on the basis of real consumer impact, not just "the type changed."

## v1.1.2 — 2026-08-19

Patch. Internal styling only referenced `var(--surface)`/`var(--radius)`/`var(--line)` with no
fallback at all — invalid (and therefore unstyled) in any host that doesn't define those exact
names, which is every host checked so far. Switched to the shared `--claudia-kernel-*`
semantic vocabulary (see `kernel-design-tokens.md` in the claudia repo) with real fallback
values, so this renders correctly in any host with zero adapter present, and picks up each
host's real theme automatically once one exists.

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
