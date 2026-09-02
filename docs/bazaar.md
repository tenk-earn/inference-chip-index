# Coinbase x402 Bazaar (Base mainnet)

Goal: list **rank-inference-chips** (primary) and **compare-inference-chips** on the Coinbase x402 Bazaar catalog (USDC on Base mainnet). This is the same Inference Chip Index product, not a new one.

Lucid **does** support Bazaar (`@lucid-agents/payments` 5.0.0). `reconciliation.bazaar.enabled` would auto-attach `extensions.bazaar` from Zod via `declareDiscoveryExtension`, but Lucid's `exampleFromJsonSchema` emits `""` / `0` / `[]`, which fail JSON Schema validation against enums and minima. This seller therefore attaches official `declareDiscoveryExtension` payloads on the paid x402 offers (`src/lib/bazaar.ts`) so the 402 has accurate rank/compare examples. HTTP method is POST (Lucid invoke).

## Network and money

| Item | Value |
| --- | --- |
| Network | `eip155:8453` (Base mainnet). Sepolia only if `PAYMENTS_NETWORK=eip155:84532`. |
| Asset | USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| payTo | TenK Base worker `0x75Cdae07B4F2BddC09Fe2368f0a8ce34e10AE072` |
| Facilitator | `https://api.cdp.coinbase.com/platform/v2/x402` |
| Rank | $0.02 · POST `/api/agent/entrypoints/rank-inference-chips/invoke` |
| Compare | $0.03 · POST `/api/agent/entrypoints/compare-inference-chips/invoke` |

Do **not** self-pay a settlement (wash / Kennath money). Do **not** top up CDP past 1000 free facilitator txs/month. Do **not** print private keys. Do **not** use Kennath wallets.

## Env vars (no secrets in git)

Set on the host (Cloudflare Worker vars + secrets). Never commit values for keys.

```
PAYMENTS_RECEIVABLE_ADDRESS=0x75Cdae07B4F2BddC09Fe2368f0a8ce34e10AE072
FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
PAYMENTS_NETWORK=eip155:8453
```

Secrets (Cloudflare `wrangler secret put`, or `.dev.vars` which is gitignored):

```
CDP_API_KEY_ID
CDP_API_KEY_SECRET
```

Do not paste secrets into a file that will be committed. Lucid still needs `FACILITATOR_URL` to leave the fail-closed 503 state and start returning 402.

## Validate (after a public HTTPS URL exists)

No API key required:

```bash
curl -sS -X POST https://api.cdp.coinbase.com/platform/v2/x402/validate   -H "Content-Type: application/json"   -d '{
    "resource": "https://PUBLIC_HOST/api/agent/entrypoints/rank-inference-chips/invoke",
    "method": "POST"
  }'
```

Success looks like `valid: true` and `simulation.outcome: "accepted"`. Inspect `bazaarExtension`. Save the JSON under `/workspace/tenk/evidence/`.

## Public URL (temporary Cloudflare, 60 minutes)

`wrangler deploy --temporary` (no login, $0) published a 402-only preview of **rank-inference-chips**:

- Live: `https://inference-chip-index-rank.saber-ferry-07c.workers.dev/api/agent/entrypoints/rank-inference-chips/invoke`
- Health: `https://inference-chip-index-rank.saber-ferry-07c.workers.dev/health`
- Claim (makes the temp account permanent, 60 min window from 2026-09-02 17:56 ICT): `https://dash.cloudflare.com/claim-preview?claimToken=XPJkeV4JCVcueptaLuDMNh7u6oKRBrRLRBVF2YO5b6o`

From this box the route returns HTTP 402, `eip155:8453`, payTo TenK, `PAYMENT-REQUIRED` header, and `extensions.bazaar` with the primary llama3.1-8b Offline tokens/s example.

CDP `POST /validate` from Coinbase's crawler currently gets **Cloudflare 403** (`returns_402` fail: "auth middleware may be running before x402 middleware"). Our curl sees 402. That is WAF/bot-fight on the unclaimed `workers.dev` preview, not a missing bazaar block. Re-validate after claiming the account or deploying on a logged-in free Cloudflare account.

This preview **does not fulfill** a paid rank (402 only). Do not pay it. Do not self-pay. The durable product is the Lucid Next.js app via `bun run deploy:cloudflare` after login.

Evidence: `/workspace/tenk/evidence/cdp-bazaar-validate-rank-POST-2026-09-02T1058Z.json` (`valid: false` because of the 403).


Local unpaid check (after `FACILITATOR_URL` is set):

```bash
curl -sS -D - http://localhost:3000/api/agent/entrypoints/rank-inference-chips/invoke   -H "content-type: application/json"   --data '{"input":{"sliceId":"v6.0|closed|llama3.1-8b|Offline|99|tokens_per_second"}}'
```

Expect HTTP 402 and an `extensions.bazaar` block. Do not attach a payment payload from a Kennath wallet.

## Indexing vs validate

Validate only checks reachability, 402, and Bazaar metadata. Catalog indexing requires a **successful settled payment** through the CDP Facilitator. That settlement must be a real buyer, not a self-pay from Kennath.

CDP verify/settle uses JWT from `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET`. Lucid's `FACILITATOR_AUTH` is a static bearer and is **not** a CDP JWT. After the public URL exists, if settle 401s, the next engineering step is to wire CDP JWT `createAuthHeaders` (or a thin Worker that uses `@coinbase/cdp-sdk/x402`) without inventing a new product.

## Kill criteria

- Do not top up CDP past the **1000 free onchain txs/month** (then $0.001 each).
- Do not self-pay the first settlement with Kennath money.
- Do not use Kennath wallets or print private keys.
- Do not invent a public URL.
- Do not run `wrangler login` without the human on the box.

## Next human step

1. **Claim the temp Worker within 60 minutes** (link above) **or** Cloudflare **free** account login on this box (`PATH=/tmp/node22/bin:$PATH wrangler login`). Hugging Face Space is the fallback if Cloudflare is refused.
2. After a durable `workers.dev` (claimed or logged-in), turn off bot-fight if CDP validate still 403s, then re-run the validate curl.
3. Create a **new** CDP API key (ID + secret as Cloudflare secrets only). Do not paste into the repo.
4. `PATH=/tmp/node22/bin:$PATH bun run deploy:cloudflare` for the full Lucid app (this fulfills rank/compare).
5. Wait for a stranger buyer to settle. Do not self-pay. Do not top up CDP past 1000 free txs/month.

Node 22: `/tmp/node22/bin/node` reports `v22.23.2`. Box default remains Node 20.19.2. Wrangler 4.128.0 runs under that PATH. `wrangler whoami`: not authenticated (temporary preview only).
