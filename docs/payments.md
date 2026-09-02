# Payments (x402 / Base Sepolia)

Free entrypoints (`get-dataset-status`, `preview-inference-chips`) boot with no payment environment.

Paid entrypoints:

| Key | Advertised price |
| --- | --- |
| rank-inference-chips | 0.02 USD |
| compare-inference-chips | 0.03 USD |

Network: `eip155:84532` (Base Sepolia).

Environment (never commit these):

```
PAYMENTS_RECEIVABLE_ADDRESS=0x...
FACILITATOR_URL=https://...
# or PAYMENTS_FACILITATOR_URL
PAYMENTS_NETWORK=eip155:84532
# optional FACILITATOR_AUTH / PAYMENTS_FACILITATOR_AUTH
```

When this configuration is absent, Lucid returns HTTP 503 `payment_configuration_error` for priced routes. Paid handlers do not execute. Do not add a second Next.js x402 middleware.
