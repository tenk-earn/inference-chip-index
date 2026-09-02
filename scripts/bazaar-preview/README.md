# Bazaar 402 preview Worker

Tiny Cloudflare Worker that serves the **same** `rank-inference-chips` 402 (Base mainnet USDC, TenK payTo, `extensions.bazaar`) without the Next.js/Lucid bundle. Used for `wrangler deploy --temporary` so CDP validate has a public HTTPS URL.

It does **not** fulfill a paid rank. Do not pay it. Durable listing is the Lucid app (`bun run deploy:cloudflare`).

```bash
export PATH=/tmp/node22/bin:$PATH
cd scripts/bazaar-preview
wrangler deploy --temporary   # 60-minute preview, no login
```
