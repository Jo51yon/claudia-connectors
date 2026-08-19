import { useCallback, useEffect, useState } from 'react';

/**
 * ConnectAIPanel — a reusable "connect an AI assistant" component.
 *
 * Extracted from PETGI's real Settings.tsx "Connect Claude" section (2026-08-19) and
 * generalized. The underlying server (claudia-mcp-oauth + the project's own {slug}-mcp
 * function) is already a spec-compliant OAuth 2.1 + MCP-over-HTTP server, shared across
 * Claudia/Lintel/PETGI/S3 Photobook via claudia_mcp_products — this component is the UI half,
 * which was previously hardcoded to "Claude" only in every project that had it.
 *
 * Provider list below is fact-checked against each provider's actual current connection
 * mechanism (2026-08-19), not assumed to all work the same way Claude's does:
 *
 * - Claude: full one-click OAuth via a browser "Add custom connector" flow. The only provider
 *   with a genuine paste-and-go consumer UI today.
 * - Kimi Code CLI: `kimi mcp add --transport http <name> <url>`, with its own OAuth support
 *   (`kimi mcp auth <name>`) and an mcp.json format documented as compatible with Claude
 *   Desktop's. The existing claudia-mcp-oauth redirect allowlist already permits generic
 *   localhost/127.0.0.1 loopback callbacks (the standard CLI OAuth pattern) — so this may
 *   already work end-to-end, but that is UNVERIFIED here, not claimed as proven.
 * - Gemini: MCP support is real (Gemini API/SDK, Gemini CLI, Vertex AI Agent Platform) but
 *   there is no consumer browser "add connector" page — connection happens via CLI config or
 *   an API request's own `tools` array. This panel can only offer the URL and a config
 *   snippet, not a one-click flow.
 * - GitHub Copilot: MCP works in IDEs (VS Code/JetBrains/Eclipse/Xcode/Visual Studio) via
 *   `mcp.json`, and in Copilot Studio via a "paste a URL" onboarding wizard. The consumer web
 *   chat at github.com/copilot does NOT support custom MCP connectors yet (open feature
 *   request as of this writing) — do not claim it does.
 * - GLM / Z.AI: MCP is supported at the API level (`tools: [{type:"mcp", mcp:{server_url,
 *   transport_type:"streamable-http"}}]`) and via third-party testing tools. No first-party
 *   consumer connector UI found. Offer the URL and the raw API shape, nothing more.
 *
 * This list is a fact as of 2026-08-19 and WILL go stale — providers are shipping MCP support
 * quickly. Treat `PROVIDERS` below as the single place to update when that changes, not
 * something to hardcode again per project.
 */

export type ConnectorKind = 'oauth_browser' | 'cli_oauth' | 'cli_config' | 'api_config' | 'ide_config' | 'deeplink';

export interface AIProvider {
  key: string;
  label: string;
  kind: ConnectorKind;
  /** Short instruction shown under the provider's own button/snippet. */
  instructions: string;
  /** If kind === 'oauth_browser' or 'deeplink', builds the real URL to open. */
  deepLink?: (params: { slug: string; url: string; productName: string }) => string;
  /** If kind involves a CLI, the command template. {url} and {slug} are substituted. */
  cliCommand?: string;
}

// Base64, URL-safe-tolerant, of a UTF-8 string -- for deep links whose config travels
// base64-encoded in the query string (Cursor).
function b64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

export const PROVIDERS: AIProvider[] = [
  {
    key: 'claude',
    label: 'Claude',
    kind: 'oauth_browser',
    instructions: 'Opens Claude\u2019s "Add custom connector" dialog with the name and URL already filled in \u2014 confirm and sign in, nothing to type.',
    // Real, verified query params (confirmed against a real Anthropic-tracked GitHub issue,
    // not assumed): modal=add-custom-connector + mcpName/mcpServerUrl pre-populate the Name
    // and Remote URL fields. Corrected 2026-08-19 -- earlier versions of this file claimed
    // Claude had no such link at all, which was wrong.
    deepLink: ({ url, productName }) =>
      'https://claude.ai/settings/connectors?modal=add-custom-connector' +
      `&mcpName=${encodeURIComponent(productName)}` +
      `&mcpServerUrl=${encodeURIComponent(url)}`,
  },
  {
    key: 'cursor',
    label: 'Cursor',
    kind: 'deeplink',
    instructions: 'Opens Cursor and prompts to install this MCP server; Cursor then asks you to sign in to your own account. Deep links are occasionally flaky on some Linux setups (a known Cursor issue, not specific to this server) \u2014 the URL is always available below as a fallback.',
    // Real, official schema (cursor.com/docs/mcp/install-links): base64 JSON config, and that
    // config REQUIRES a "type" field ("http" here) -- verified against Cursor's own docs and
    // multiple real working examples. A config missing "type" is a real, easy mistake to make
    // (found one while researching this).
    deepLink: ({ url, productName }) =>
      `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(productName)}` +
      `&config=${b64(JSON.stringify({ type: 'http', url }))}`,
  },
  {
    key: 'vscode',
    label: 'VS Code',
    kind: 'deeplink',
    instructions: 'Opens VS Code and adds this MCP server (also usable from GitHub Copilot\u2019s agent mode once added). VS Code will prompt you to sign in.',
    deepLink: ({ url, productName }) =>
      `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: productName, url }))}`,
  },
  {
    key: 'kimi',
    label: 'Kimi Code CLI',
    kind: 'cli_oauth',
    instructions: 'Run the command below, then `kimi mcp auth {slug}` to complete OAuth sign-in from your own session.',
    cliCommand: 'kimi mcp add --transport http {slug} {url}',
  },
  {
    key: 'gemini',
    label: 'Gemini',
    kind: 'cli_config',
    instructions: 'No one-click connector yet \u2014 add this URL via the Gemini CLI\u2019s MCP config, or pass it as a tool in your own Gemini API requests.',
  },
  {
    key: 'copilot',
    label: 'GitHub Copilot',
    kind: 'ide_config',
    instructions: 'The VS Code entry above covers Copilot\u2019s agent mode there. In JetBrains, Eclipse, Xcode or Visual Studio, or in Copilot Studio\u2019s own "Add an MCP server" wizard, paste the URL below or download the config. The github.com/copilot web chat does not support custom connectors yet.',
  },
  {
    key: 'glm',
    label: 'GLM / Z.AI',
    kind: 'api_config',
    instructions: 'No consumer connector UI \u2014 pass this URL as a tool in your own API requests: tools: [{type: "mcp", mcp: {server_url: "...", transport_type: "streamable-http"}}].',
  },
];

interface Connection {
  id: string; client_id: string; last_four: string | null; scopes: string | null;
  created_at: string; is_active: boolean;
}

export interface ConnectAIPanelProps {
  /** The project's registered slug in claudia_mcp_products, e.g. 'petgi'. */
  slug: string;
  /** The project's own product display name, e.g. 'PETGI'. */
  productName: string;
  /** Proxied MCP endpoint, e.g. https://claudia.sicoru.org/mcp/{slug} — must already exist. */
  mcpUrl: string;
  /** Supabase client with .rpc(), used for claudia_mcp_my_connections / claudia_mcp_revoke_connection. */
  supabase: { rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: any; error: any }> };
  /**
   * Added v1.1.0. Optional download link for this project's own skill doc, e.g.
   * `${SUPABASE_URL}/functions/v1/claudia-skill-source?slug=petgi` — the same
   * claudia-skill-source pattern already shared across products (see component-library.md),
   * generalised here rather than left as a PETGI-only addition, since any product with a
   * skill doc benefits from telling a newly-connected client where to find it.
   */
  skillUrl?: string;
}

export default function ConnectAIPanel({ slug, productName, mcpUrl, supabase, skillUrl }: ConnectAIPanelProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('claude');

  const load = useCallback(() => {
    setLoading(true);
    supabase.rpc('claudia_mcp_my_connections', { p_product_slug: slug }).then(({ data, error: e }) => {
      if (e) setError(e.message); else { setConnections(data ?? []); setError(null); }
      setLoading(false);
    });
  }, [slug, supabase]);
  useEffect(load, [load]);

  async function copyUrl() {
    await navigator.clipboard.writeText(mcpUrl);
    setCopied('url'); setTimeout(() => setCopied(null), 2000);
  }
  function connectOAuth(provider: AIProvider) {
    if (!provider.deepLink) return;
    window.open(provider.deepLink({ slug, url: mcpUrl, productName }), '_blank', 'noopener');
  }
  function downloadConfig() {
    const config = { mcpServers: { [slug]: { type: 'http', url: mcpUrl } } };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.mcp.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function revoke(id: string) {
    const { error: e } = await supabase.rpc('claudia_mcp_revoke_connection', { p_id: id });
    if (e) setError(e.message);
    load();
  }

  const provider = PROVIDERS.find((p) => p.key === activeProvider)!;
  const cliCommand = provider.cliCommand?.replace('{slug}', slug).replace('{url}', mcpUrl);

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Connect an AI assistant</h3>
      <p className="dim" style={{ fontSize: '.85rem' }}>
        Connect any MCP-compatible client directly to your own {productName} access. It runs
        as you, with your own real permissions, never elevated.
      </p>
      <p className="dim" style={{ fontSize: '.85rem' }}>
        You will be asked to authorise it from your own logged-in {productName} session the
        first time — a real OAuth consent step, not a shared or static credential.
      </p>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: '.75rem' }}>
        {PROVIDERS.map((p) => (
          <button key={p.key} type="button"
            className={p.key === activeProvider ? 'btn sm' : 'btn quiet sm'}
            onClick={() => setActiveProvider(p.key)}>{p.label}</button>
        ))}
      </div>

      <div className="filters" style={{ marginTop: '.6rem' }}>
        <input className="field" readOnly style={{ flex: '1 1 320px', fontFamily: 'monospace', fontSize: '.82rem' }}
               value={mcpUrl} onFocus={(e) => e.target.select()} />
        {(provider.kind === 'oauth_browser' || provider.kind === 'deeplink') && (
          <button className="btn sm" onClick={() => connectOAuth(provider)}>Connect to {provider.label}</button>
        )}
        <button className="btn quiet sm" onClick={copyUrl}>{copied === 'url' ? 'Copied' : 'Copy URL'}</button>
        <button className="btn quiet sm" onClick={downloadConfig}>Download .mcp.json</button>
      </div>

      {cliCommand && (
        <div style={{ marginTop: '.5rem' }}>
          <code style={{
            display: 'block', padding: '8px 10px', background: 'var(--claudia-kernel-surface, #f5f5f5)', borderRadius: 'var(--claudia-kernel-radius, 8px)',
            border: '1px solid var(--claudia-kernel-line, #e0e0e0)', fontSize: 13, overflowX: 'auto', whiteSpace: 'pre',
          }}>{cliCommand}</code>
        </div>
      )}

      <p className="dim" style={{ fontSize: '.78rem', marginTop: '.4rem' }}>{provider.instructions}</p>

      {skillUrl && (
        <p style={{ fontSize: '.82rem', marginTop: '.5rem' }}>
          Once connected, download the {productName} skill below and give it to your client — it explains how to use the connector and which tool to reach for, for what.{' '}
          <a className="btn quiet sm" href={skillUrl} download={`${slug}-SKILL.md`}>Download {productName} skill</a>
        </p>
      )}

      {!loading && connections.length > 0 && (
        <table className="table" style={{ marginTop: '1rem', fontSize: '.82rem' }}>
          <thead><tr><th>Client</th><th>Token</th><th>Connected</th><th>Status</th><th /></tr></thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id}>
                <td>{c.client_id}</td>
                <td>{c.last_four ? `\u2022\u2022\u2022\u2022${c.last_four}` : '\u2014'}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td>{c.is_active ? 'Active' : 'Revoked'}</td>
                <td>{c.is_active && <button className="btn quiet sm" onClick={() => revoke(c.id)}>Revoke</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <p className="err" style={{ fontSize: '.8rem' }}>{error}</p>}
    </div>
  );
}
