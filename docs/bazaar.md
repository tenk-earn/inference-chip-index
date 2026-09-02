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

Success looks like `valid: true` and `simulation.outcome: "accepted"`. Inspect `bazaarExtension`. Save the JSON under `/workspace/tenk/evidence/`. There is **no public URL yet** (no Cloudflare login on this box), so this curl cannot be run against a live seller.

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

## Next human step (blocked on login)

1. Cloudflare **free** account login on this box (`PATH=/tmp/node22/bin:$PATH wrangler login`) **or** a Hugging Face Space if Cloudflare is refused.
2. Create a **new** CDP API key (ID + secret as env/secrets only). Do not paste into the repo.
3. `PATH=/tmp/node22/bin:$PATH bun run deploy:cloudflare` (Node 22 is installed at `/tmp/node22`).
4. POST validate against the public HTTPS URL; save JSON under `/workspace/tenk/evidence/`.
5. Wait for a stranger buyer to settle. Do not self-pay.

Node 22: `/tmp/node22/bin/node` reports `v22.23.2`. Box default remains Node 20.19.2. Wrangler was not logged in; no public URL was created.
