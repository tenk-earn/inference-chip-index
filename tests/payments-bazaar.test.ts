import { describe, expect, it } from "bun:test";
import { projectX402Payment } from "@lucid-agents/payments";
import { validateDiscoveryExtension } from "@x402/extensions/bazaar";
import { asOfferBazaar, compareDiscoveryExtension, rankDiscoveryExtension, RANK_DESCRIPTION, COMPARE_DESCRIPTION } from "../src/lib/bazaar";
import { BASE_MAINNET, BASE_SEPOLIA, CDP_FACILITATOR_URL, TENK_PAY_TO, paymentsConfig, resolvePaymentsNetwork } from "../src/lib/payments";
import { compareInput, rankInput, rankOutput, compareOutput } from "../src/lib/schemas";
import { PRIMARY_SLICE_ID, SLICE_IDS } from "../src/lib/slices";

const payConfig = {
  payTo: TENK_PAY_TO,
  facilitatorUrl: CDP_FACILITATOR_URL,
  network: BASE_MAINNET,
} as const;

describe("payments network defaults", () => {
  it("defaults to Base mainnet and keeps Sepolia as an explicit override", () => {
    expect(resolvePaymentsNetwork({})).toBe(BASE_MAINNET);
    expect(resolvePaymentsNetwork({ PAYMENTS_NETWORK: "eip155:8453" })).toBe(BASE_MAINNET);
    expect(resolvePaymentsNetwork({ PAYMENTS_NETWORK: "base" })).toBe(BASE_MAINNET);
    expect(resolvePaymentsNetwork({ PAYMENTS_NETWORK: "eip155:84532" })).toBe(BASE_SEPOLIA);
    expect(resolvePaymentsNetwork({ PAYMENTS_NETWORK: "base-sepolia" })).toBe(BASE_SEPOLIA);
    expect(resolvePaymentsNetwork({ NETWORK: "eip155:84532" })).toBe(BASE_SEPOLIA);
  });

  it("fails closed without a facilitator URL", () => {
    expect(paymentsConfig({})).toBe(false);
    expect(paymentsConfig({ PAYMENTS_RECEIVABLE_ADDRESS: TENK_PAY_TO })).toBe(false);
  });

  it("defaults payTo to TenK and network to mainnet when facilitator is set", () => {
    const cfg = paymentsConfig({ FACILITATOR_URL: CDP_FACILITATOR_URL });
    expect(cfg).not.toBe(false);
    if (cfg === false) return;
    expect(cfg.payTo).toBe(TENK_PAY_TO);
    expect(cfg.network).toBe(BASE_MAINNET);
    expect(cfg.facilitatorUrl).toBe(CDP_FACILITATOR_URL);
  });
});

describe("bazaar discovery extensions", () => {
  it("declares valid rank-inference-chips metadata with a real slice example", () => {
    const ext = rankDiscoveryExtension();
    const bazaar = ext.bazaar;
    expect(bazaar).toBeDefined();
    const validation = validateDiscoveryExtension(bazaar);
    expect(validation.valid).toBe(true);
    const input = (bazaar as { info?: { input?: { method?: string; body?: { input?: { sliceId?: string } } } } }).info?.input;
    expect(input?.method).toBe("POST");
    expect(input?.body?.input?.sliceId).toBe(PRIMARY_SLICE_ID);
  });

  it("declares valid compare-inference-chips metadata with 2-8 slugs", () => {
    const ext = compareDiscoveryExtension();
    const validation = validateDiscoveryExtension(ext.bazaar);
    expect(validation.valid).toBe(true);
  });

  it("Lucid projectX402Payment attaches bazaar for both paid routes on Base mainnet", () => {
    const rank = projectX402Payment(
      {
        key: "rank-inference-chips",
        description: RANK_DESCRIPTION,
        input: rankInput,
        output: rankOutput,
        price: "0.02",
        paymentProtocol: "x402",
        x402: {
          offers: [
            {
              scheme: "exact",
              network: BASE_MAINNET,
              price: "0.02",
              extensions: [asOfferBazaar(rankDiscoveryExtension())],
            },
          ],
        },
      },
      "invoke",
      payConfig,
    );
    expect(rank).toBeDefined();
    expect(rank?.offers[0]?.network).toBe(BASE_MAINNET);
    const rankBazaar = rank?.extensions?.bazaar;
    expect(rankBazaar).toBeDefined();
    expect(validateDiscoveryExtension(rankBazaar).valid).toBe(true);
    expect(JSON.stringify(rankBazaar)).toContain(PRIMARY_SLICE_ID);

    const compare = projectX402Payment(
      {
        key: "compare-inference-chips",
        description: COMPARE_DESCRIPTION,
        input: compareInput,
        output: compareOutput,
        price: "0.03",
        paymentProtocol: "x402",
        x402: {
          offers: [
            {
              scheme: "exact",
              network: BASE_MAINNET,
              price: "0.03",
              extensions: [asOfferBazaar(compareDiscoveryExtension())],
            },
          ],
        },
      },
      "invoke",
      payConfig,
    );
    expect(compare).toBeDefined();
    expect(validateDiscoveryExtension(compare?.extensions?.bazaar).valid).toBe(true);
    expect(SLICE_IDS).toHaveLength(12);
  });
});
