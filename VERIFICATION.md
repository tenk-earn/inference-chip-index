# Verification report

Ran 2026-09-02 16:12 Asia/Bangkok (09:12 UTC) on the TenK box.

## Commands

```bash
bun run dataset:fixture
bun run dataset:full
bun test
bun run type-check
bun run build
```

## Results

| Command | Result |
| --- | --- |
| `bun run dataset:fixture` | hash `8eee52b66826c98993482685295e89fe03462d4e12d973b6adfe37a627e26c08` |
| `bun run dataset:full` | hash `3d26cfcc5423f248d09ec84515d3ae2a7872d3d0287798be7878a545cd2e131f` · 272 accepted / 330 parsed results · 12 slices |
| `bun test` | 16 pass, 0 fail |
| `bun run type-check` | `tsc --noEmit` exit 0 |
| `bun run build` | Next.js 15.5.2 production build exit 0; Lucid routes mounted under `/api/agent` |

NVIDIA llama3.1-8b Offline `Tokens per second: 165432` is copied from `closed/NVIDIA/results/B300-SXM-270GBx8_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt` at commit `4d3916ac9cf474b679cdfcf492d43a0559418ad1`. No invented MLPerf numbers.

Verified slice `v6.0|closed|llama3.1-8b|Offline|99|tokens_per_second` has ≥3 accepted results spanning NVIDIA and Intel (B300, RTX PRO 6000 Blackwell, Arc Pro B60).

Paid `rank-inference-chips` returns a payment-configuration error without env (fail closed). Free health/preview succeed.

## Deploy

Skipped. `wrangler` on this box requires Node.js ≥ 22 (box is v20.19.2) and no Cloudflare account/token is configured. Exact command when a free Cloudflare login exists:

```bash
npx @opennextjs/cloudflare build && npx wrangler deploy
```

Do not use a paid plan or Kennath’s card.
