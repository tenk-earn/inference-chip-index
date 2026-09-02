# Inference Chip Index

Find the fastest **verified** inference hardware **for your workload**. There is no universally fastest chip.

This is a public Next.js index and Lucid Agents API over official [MLPerf Inference v6.0](https://github.com/mlcommons/inference_results_v6.0) **Closed** division results for `llama3.1-8b`, `gpt-oss-120b`, and `deepseek-r1`. Rankings compare an exact slice: release, division, workload, scenario, accuracy target, metric, and unit.

Pinned source commit: [`4d3916ac9cf474b679cdfcf492d43a0559418ad1`](https://github.com/mlcommons/inference_results_v6.0/tree/4d3916ac9cf474b679cdfcf492d43a0559418ad1)

## Quick start

```bash
bun install
bun run dataset          # reproduce fixture + full-source hashes
bun test
bun run type-check
bun run build
bun dev                  # http://localhost:3000
```

Lucid runtime is mounted at `/api/agent`. Next.js routes delegate to `runtime.http.handlers`.

```bash
curl -sS http://localhost:3000/api/agent/health
curl -sS http://localhost:3000/api/agent/entrypoints
curl -sS http://localhost:3000/api/agent/entrypoints/get-dataset-status/invoke \
  -H 'content-type: application/json' --data '{"input":{}}'
```

Paid entrypoints (`rank-inference-chips` $0.02, `compare-inference-chips` $0.03) **fail closed** without payment configuration. They never become free. Configure Base Sepolia x402 with `PAYMENTS_RECEIVABLE_ADDRESS`, `FACILITATOR_URL` or `PAYMENTS_FACILITATOR_URL`, and `PAYMENTS_NETWORK=eip155:84532`. See [docs/payments.md](docs/payments.md).

## Dataset

- Fixture pack: `data/fixtures` (NVIDIA, AMD, Intel, multi-accelerator, deliberate quarantine).
- Full-source pack: compact parse-only files from the pinned commit in `data/mlperf-v6.0`.
- Generated snapshot: `data/generated` and `src/data/generated`.

```bash
bun run dataset:fixture
bun run dataset:full
```

Update/rollback: [docs/update-rollback.md](docs/update-rollback.md). Sources: [DATA_SOURCES.md](DATA_SOURCES.md).

## Deploy

Cloudflare Workers via OpenNext (free-tier attempt):

```bash
bun run deploy:cloudflare
# equivalent: npx @opennextjs/cloudflare build && npx wrangler deploy
```

If Wrangler is not logged in, or the Worker exceeds the free plan size, skip deploy. `bun run build` must still pass. Details: [docs/deploy.md](docs/deploy.md).

## Stack

- Next.js 15 App Router, TypeScript
- `@lucid-agents/core@5.0.0` `@lucid-agents/http@4.0.0` `@lucid-agents/payments@5.0.0`

## CI

Copy [docs/github-ci.yml](docs/github-ci.yml) to `.github/workflows/ci.yml` (the push token here lacks the `workflow` scope).
