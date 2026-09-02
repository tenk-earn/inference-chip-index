# Payments (x402 / Base mainnet)

Free entrypoints (`get-dataset-status`, `preview-inference-chips`) boot with no payment environment.

Paid entrypoints:

| Key | Advertised price | Protocol |
| --- | --- | --- |
| rank-inference-chips | 0.02 USD | POST `/api/agent/entrypoints/rank-inference-chips/invoke` |
| compare-inference-chips | 0.03 USD | POST `/api/agent/entrypoints/compare-inference-chips/invoke` |

Default network: `eip155:8453` (Base **mainnet**), USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

payTo (TenK Base worker): `0x75Cdae07B4F2BddC09Fe2368f0a8ce34e10AE072`.

Facilitator: `https://api.cdp.coinbase.com/platform/v2/x402`.

Sepolia (`eip155:84532` / `base-sepolia`) is an **explicit override only** via `PAYMENTS_NETWORK`. Do not use it for Coinbase x402 Bazaar listing.

Lucid (`@lucid-agents/payments`) emits HTTP 402 for priced routes when a facilitator URL is configured. With `reconciliation.bazaar.enabled`, the 402 includes `extensions.bazaar` derived from the entrypoint Zod schemas (plus the explicit examples in `src/lib/bazaar.ts`). Do not add a second Next.js x402 middleware.

Environment (never commit secrets; `.env*` is gitignored):

```
PAYMENTS_RECEIVABLE_ADDRESS=0x75Cdae07B4F2BddC09Fe2368f0a8ce34e10AE072
FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
# or PAYMENTS_FACILITATOR_URL
PAYMENTS_NETWORK=eip155:8453
# optional explicit Sepolia override: PAYMENTS_NETWORK=eip155:84532
# CDP_API_KEY_ID=  (Cloudflare secret; not committed)
# CDP_API_KEY_SECRET=  (Cloudflare secret; not committed)
# optional FACILITATOR_AUTH / PAYMENTS_FACILITATOR_AUTH  (Lucid static bearer)
```

`payTo` defaults to the TenK address when `PAYMENTS_RECEIVABLE_ADDRESS` is unset. Payments still **fail closed** (HTTP 503 `payment_configuration_error`) until `FACILITATOR_URL` / `PAYMENTS_FACILITATOR_URL` is set. Paid handlers do not execute without that config.

CDP Facilitator verify/settle authenticates with `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` (JWT). Lucid's `FACILITATOR_AUTH` is a static bearer; it is not a substitute for those keys. 402 challenges and the public validate endpoint do not need the CDP key. Settlement (required to *index* on Bazaar after validate) does.

See [bazaar.md](bazaar.md) for validate curl, kill criteria, and the next human deploy step.
