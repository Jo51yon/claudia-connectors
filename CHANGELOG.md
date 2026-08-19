# Changelog

Semantic versioning: MAJOR = a prop, exported type, or default behaviour changed in a way that
could break an existing consumer without any code change on their side. MINOR = additive only.
Consuming projects should pin to a tag (`#v1.0.0`), never `#main`.

## v1.0.0 — 2026-08-19

First release. `ConnectAIPanel` — generic, multi-provider "Connect an AI assistant" panel,
extracted from PETGI's real Settings.tsx and generalized. Provider support level is
fact-checked per provider, not assumed uniform: Claude has a genuine one-click browser OAuth
flow; Kimi Code CLI has real OAuth via its own CLI command; Gemini, GLM and GitHub Copilot's
web chat have no consumer connector UI today and are given accurate URL/config guidance
instead of an overclaimed one-click flow.

**Known consumers at this tag:** none yet at release — PETGI is the first real adoption,
landing in the same session this tag was cut.
