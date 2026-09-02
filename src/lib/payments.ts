import { paymentsFromEnv } from "@lucid-agents/payments";

/** TenK Base worker. Public receive address. Never Kennath. */
export const TENK_PAY_TO = "0x75Cdae07B4F2BddC09Fe2368f0a8ce34e10AE072" as const;

/** Coinbase x402 Bazaar live catalog: USDC on Base mainnet. */
export const BASE_MAINNET = "eip155:8453" as const;
export const BASE_SEPOLIA = "eip155:84532" as const;
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const CDP_FACILITATOR_URL = "https://api.cdp.coinbase.com/platform/v2/x402" as const;

export type PaymentsEnv = Record<string, string | undefined>;

function envRecord(env?: PaymentsEnv): PaymentsEnv {
  if (env) return env;
  if (typeof process === "undefined") return {};
  return process.env;
}

/** Default Base mainnet. Sepolia only when PAYMENTS_NETWORK/NETWORK is an explicit override. */
export function resolvePaymentsNetwork(env?: PaymentsEnv): typeof BASE_MAINNET | typeof BASE_SEPOLIA | string {
  const raw = (envRecord(env).PAYMENTS_NETWORK ?? envRecord(env).NETWORK ?? BASE_MAINNET).trim();
  if (raw === "base" || raw === BASE_MAINNET) return BASE_MAINNET;
  if (raw === "base-sepolia" || raw === BASE_SEPOLIA) return BASE_SEPOLIA;
  return raw;
}

/**
 * Lucid payments config. Fail closed unless a facilitator URL is set
 * (priced routes then 503). payTo defaults to the TenK Base worker.
 * Network defaults to Base mainnet. Secrets stay in env, never in git.
 */
export function paymentsConfig(env?: PaymentsEnv) {
  const e = envRecord(env);
  const facilitator = e.FACILITATOR_URL ?? e.PAYMENTS_FACILITATOR_URL;
  if (!facilitator) return false;
  const payTo = e.PAYMENTS_RECEIVABLE_ADDRESS ?? TENK_PAY_TO;
  return (
    paymentsFromEnv(
      {
        network: resolvePaymentsNetwork(e),
        payTo,
        facilitatorUrl: facilitator,
      },
      e,
    ) ?? false
  );
}
