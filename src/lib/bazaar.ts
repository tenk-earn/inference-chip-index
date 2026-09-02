import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { PRIMARY_SLICE_ID } from "./slices";

/** Shape Lucid x402.offers[].extensions expects. */
export function asOfferBazaar(declared: { bazaar?: unknown }): { key: "bazaar"; info: Record<string, unknown> } {
  const bazaar = declared.bazaar;
  if (!bazaar || typeof bazaar !== "object") {
    throw new Error("declareDiscoveryExtension did not return a bazaar key");
  }
  return { key: "bazaar", info: bazaar as Record<string, unknown> };
}


const SOURCE_URL =
  "https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/NVIDIA/results/B300-SXM-270GBx8_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt";

const sliceExample = {
  sliceId: PRIMARY_SLICE_ID,
  release: "v6.0",
  division: "closed",
  workload: "llama3.1-8b",
  scenario: "Offline",
  accuracyTarget: "99",
  metricKey: "tokens_per_second",
  unit: "tok/s",
  winningDirection: "higher" as const,
  comparability:
    "Comparable only for MLPerf Inference v6.0 Closed division, workload llama3.1-8b, scenario Offline, accuracy target 99%, metric Tokens per second (system) in tok/s.",
  acceptedCount: 23,
};

const rankRowExample = {
  rank: 2,
  position: 2,
  logicalId: "res:NVIDIA:B300-SXM-270GBx8_TRT:llama3.1-8b:Offline:99:tokens_per_second",
  submitter: "NVIDIA",
  systemId: "B300-SXM-270GBx8_TRT",
  systemName: "NVIDIA DGX B300 (8x B300-SXM-270GB, TensorRT)",
  acceleratorSlug: "nvidia-b300-sxm-270gb",
  acceleratorVendor: "NVIDIA",
  acceleratorFamily: "B300",
  acceleratorDisplayName: "NVIDIA B300 SXM 270GB",
  acceleratorCount: 8,
  officialValue: 165432,
  derivedPerAccelerator: 20679,
  displayedValue: 165432,
  displayedLabel: "official submitted system",
  unit: "tok/s",
  source: {
    repository: "https://github.com/mlcommons/inference_results_v6.0",
    commit: "4d3916ac9cf474b679cdfcf492d43a0559418ad1",
    path: "closed/NVIDIA/results/B300-SXM-270GBx8_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt",
    url: SOURCE_URL,
    sha256: "95a6bd7cd7435f12f536bea03306ca0a36ff8a0262cc78c5fb150067ad636e33",
  },
};

/**
 * Accurate Bazaar metadata for Lucid POST invoke.
 * Lucid (@lucid-agents/payments 5.0.0) emits extensions.bazaar when
 * `reconciliation.bazaar.enabled` is true, derived from entrypoint Zod schemas.
 * These helpers are the intended schemas/examples (primary rank + compare).
 */
export const RANK_DESCRIPTION =
  "Rank verified MLPerf Inference v6.0 Closed-division inference accelerators for one exact slice. Never a universal fastest chip. $0.02 USDC on Base mainnet.";

export const COMPARE_DESCRIPTION =
  "Compare 2-8 accelerator slugs on one exact MLPerf Inference v6.0 Closed slice, with optional baseline deltas. $0.03 USDC on Base mainnet.";

export function rankDiscoveryExtension() {
  return declareDiscoveryExtension({
    method: "POST",
    bodyType: "json",
    input: {
      input: {
        sliceId: PRIMARY_SLICE_ID,
        vendors: ["NVIDIA", "Intel"],
        metricView: "official",
        grouping: "all-systems",
        page: 1,
        pageSize: 10,
      },
    },
    inputSchema: {
      properties: {
        input: {
          type: "object",
          description: "Rank query. sliceId is required; other fields are optional filters.",
          properties: {
            sliceId: {
              type: "string",
              description: `Exact comparison slice ID. Primary: ${PRIMARY_SLICE_ID}`,
            },
            vendors: {
              type: "array",
              items: { type: "string" },
              description: "Optional vendor filter, e.g. NVIDIA, Intel, AMD.",
            },
            metricView: {
              type: "string",
              enum: ["official", "derived"],
              description: "official = submitted-system result; derived = per-accelerator when count is known.",
            },
            grouping: {
              type: "string",
              enum: ["all-systems", "best-per-accelerator"],
            },
            page: { type: "integer", minimum: 1 },
            pageSize: { type: "integer", minimum: 1, maximum: 50 },
          },
          required: ["sliceId"],
        },
      },
      required: ["input"],
    },
    output: {
      example: {
        output: {
          slice: sliceExample,
          comparability: sliceExample.comparability,
          datasetVersion: "chip-index-v6.0-full-source-3d26cfcc5423",
          metricView: "official",
          grouping: "all-systems",
          total: 23,
          page: 1,
          pageSize: 10,
          rows: [rankRowExample],
          sourceLinks: [SOURCE_URL],
        },
      },
    },
  });
}

export function compareDiscoveryExtension() {
  return declareDiscoveryExtension({
    method: "POST",
    bodyType: "json",
    input: {
      input: {
        sliceId: PRIMARY_SLICE_ID,
        acceleratorSlugs: ["nvidia-b300-sxm-270gb", "nvidia-rtx-pro-6000-blackwell"],
        baselineSlug: "nvidia-rtx-pro-6000-blackwell",
        metricView: "official",
      },
    },
    inputSchema: {
      properties: {
        input: {
          type: "object",
          description: "Compare 2-8 accelerator slugs on one exact slice.",
          properties: {
            sliceId: {
              type: "string",
              description: `Exact comparison slice ID. Primary: ${PRIMARY_SLICE_ID}`,
            },
            acceleratorSlugs: {
              type: "array",
              minItems: 2,
              maxItems: 8,
              items: { type: "string" },
              description: "Accelerator slugs, e.g. nvidia-b300-sxm-270gb.",
            },
            baselineSlug: {
              type: "string",
              description: "Optional baseline slug for deltas. Defaults to the first slug.",
            },
            metricView: {
              type: "string",
              enum: ["official", "derived"],
            },
          },
          required: ["sliceId", "acceleratorSlugs"],
        },
      },
      required: ["input"],
    },
    output: {
      example: {
        output: {
          slice: {
            sliceId: PRIMARY_SLICE_ID,
            comparability: sliceExample.comparability,
          },
          comparability: sliceExample.comparability,
          datasetVersion: "chip-index-v6.0-full-source-3d26cfcc5423",
          baselineSlug: "nvidia-rtx-pro-6000-blackwell",
          metricView: "official",
          unit: "tok/s",
          rows: [
            {
              acceleratorSlug: "nvidia-b300-sxm-270gb",
              present: true,
              missingReason: null,
              submitter: "ASUSTeK",
              systemName: "XA NB3I-E12",
              officialValue: 166745,
              derivedPerAccelerator: 20843.125,
              displayedValue: 166745,
              deltaVsBaseline: 106065.1,
              sourceUrl:
                "https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/ASUSTeK/results/XA_NB3I-E12_B300x8_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt",
            },
            {
              acceleratorSlug: "nvidia-rtx-pro-6000-blackwell",
              present: true,
              missingReason: null,
              submitter: "HPE",
              systemName: "HPE ProLiant Compute DL380a Gen12 (10x NVIDIA RTX PRO 6000 Blackwell Server Edition, TensorRT)",
              officialValue: 60679.9,
              derivedPerAccelerator: 6067.99,
              displayedValue: 60679.9,
              deltaVsBaseline: null,
              sourceUrl:
                "https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/HPE/results/HPE_PROLIANT_DL380A_RTX_PRO_6000_PCIE_96GBx10_TRT_10_14_1_48_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt",
            },
          ],
          sourceLinks: [
            "https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/ASUSTeK/results/XA_NB3I-E12_B300x8_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt",
            "https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/HPE/results/HPE_PROLIANT_DL380A_RTX_PRO_6000_PCIE_96GBx10_TRT_10_14_1_48_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt",
          ],
        },
      },
    },
  });
}
