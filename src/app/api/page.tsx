import { loadSnapshot, defaultSliceId } from "@/lib/dataset";
import { StateBanner } from "@/components/States";

export default function ApiPage() {
  const snapshot = loadSnapshot();
  const slice = defaultSliceId(snapshot);
  const invoke = `curl -sS http://localhost:3000/api/agent/entrypoints/preview-inference-chips/invoke \\
  -H 'content-type: application/json' \\
  --data '{"input":{"sliceId":"${slice}"}}'`;
  const rank = `curl -i http://localhost:3000/api/agent/entrypoints/rank-inference-chips/invoke \\
  -H 'content-type: application/json' \\
  --data '{"input":{"sliceId":"${slice}","metricView":"official","grouping":"all-systems","page":1,"pageSize":10}}'`;

  return (
    <div className="space-y-8">
      <h1 className="serif text-4xl">Lucid Agents API</h1>
      <p className="max-w-3xl text-[var(--muted)]">
        One server-only Lucid runtime is mounted at <code>/api/agent</code>. Next.js route modules delegate to
        <code>runtime.http.handlers</code>. There is no second payment layer.
      </p>

      <section className="space-y-3">
        <h2 className="serif text-2xl">Discovery and health</h2>
        <pre className="overflow-x-auto bg-[var(--bg-elev)] p-4 text-xs">{`GET /api/agent/health
GET /api/agent/entrypoints
GET /api/agent/.well-known/agent-card.json
GET /api/agent/.well-known/agent.json
GET /api/agent/.well-known/oasf-record.json
POST /api/agent/entrypoints/:key/invoke
POST /api/agent/entrypoints/:key/stream`}</pre>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl">Entrypoints</h2>
        <div className="space-y-4 text-sm">
          <div className="border border-[var(--line)] p-4">
            <h3 className="font-medium">get-dataset-status · free</h3>
            <p className="text-[var(--muted)]">Input: {}. Output: manifest, freshness, source commit, counts, source links, all exact slice IDs.</p>
          </div>
          <div className="border border-[var(--line)] p-4">
            <h3 className="font-medium">preview-inference-chips · free</h3>
            <p className="text-[var(--muted)]">Input: optional sliceId. Output: up to five verified official rows plus comparability text.</p>
          </div>
          <div className="border border-[var(--line)] p-4">
            <h3 className="font-medium">rank-inference-chips · $0.02</h3>
            <p className="text-[var(--muted)]">Requires exact sliceId. Optional vendors, metricView official|derived, grouping all-systems|best-per-accelerator, page, pageSize≤50. Response is bounded below 1 MiB.</p>
          </div>
          <div className="border border-[var(--line)] p-4">
            <h3 className="font-medium">compare-inference-chips · $0.03</h3>
            <p className="text-[var(--muted)]">Requires sliceId and 2–8 accelerator slugs. Deltas only versus an explicit baseline when units match.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="serif text-2xl">Copyable requests</h2>
        <pre className="overflow-x-auto bg-[var(--bg-elev)] p-4 text-xs">{invoke}</pre>
        <pre className="overflow-x-auto bg-[var(--bg-elev)] p-4 text-xs">{rank}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="serif text-2xl">x402 flow</h2>
        <ol className="list-decimal space-y-2 pl-5 text-[var(--muted)]">
          <li>Discover the Agent Card and priced skills (rank $0.02, compare $0.03) on Base mainnet (eip155:8453).</li>
          <li>When payment is configured, invoke a paid entrypoint without X-Payment and receive HTTP 402 with x402 offers.</li>
          <li>When payment configuration is absent, paid entrypoints fail closed (HTTP 503 payment_configuration_error) and never become free.</li>
          <li>Settle on Base mainnet, retry invoke with the payment header, receive the ranked JSON.</li>
        </ol>
        <StateBanner tone="warn" title="Payment required">
          Paid routes advertise x402 offers on Base mainnet (eip155:8453) after FACILITATOR_URL is set. payTo defaults to the TenK Base worker. They do not silently degrade to free. Sepolia is an explicit PAYMENTS_NETWORK override only.
        </StateBanner>
        <StateBanner tone="ok" title="Paid success">
          A successful paid invoke returns Lucid JSON {"{ run_id, status: \"succeeded\", output }"} with the slice, ranks, and source URLs.
        </StateBanner>
        <StateBanner tone="danger" title="API error">
          Unknown slices, incompatible metric views, and oversized pages return Lucid handler errors without mixing benchmark dimensions.
        </StateBanner>
      </section>
    </div>
  );
}
