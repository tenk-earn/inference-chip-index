import { createAgent } from "@lucid-agents/core";
import { http } from "@lucid-agents/http";
import { payments } from "@lucid-agents/payments";
import { compareInput, emptyInput, previewInput, rankInput, compareOutput, previewOutput, rankOutput, statusOutput } from "./schemas";
import { defaultSliceId, loadSnapshot } from "./dataset";
import { paymentsConfig, resolvePaymentsNetwork } from "./payments";
import { rankRows } from "./ranking";
import { compareChips } from "./compare";
import {
  COMPARE_DESCRIPTION,
  RANK_DESCRIPTION,
  asOfferBazaar,
  compareDiscoveryExtension,
  rankDiscoveryExtension,
} from "./bazaar";

const snapshot = loadSnapshot();

function statusPayload() {
  return {
    manifest: snapshot.manifest,
    sourceLinks: [snapshot.manifest.sourceRepository, `${snapshot.manifest.sourceRepository}/tree/${snapshot.manifest.sourceCommit}`],
  };
}

export const agentRuntime = await createAgent({
  name: "inference-chip-index",
  version: "1.0.0",
  description:
    "Verified MLPerf Inference v6.0 Closed-division comparisons of inference accelerators for autonomous research agents. Rankings are workload-specific and never claim a universal fastest chip.",
})
  .use(
    payments({
      config: paymentsConfig(),
      // Lucid auto-bazaar (enabled:true) derives examples from Zod via exampleFromJsonSchema
      // which emits ""/0/[] and then fails enum/min schema validation. Attach official
      // declareDiscoveryExtension payloads on the exact offers instead. Method is POST.
      reconciliation: { bazaar: { enabled: false } },
    }),
  )
  .use(http({ basePath: "/api/agent" }))
  .addEntrypoint({
    key: "get-dataset-status",
    description: "Free dataset manifest, freshness, source commit, counts, and exact comparison slice IDs.",
    input: emptyInput,
    output: statusOutput,
    async handler() {
      return { output: statusPayload() };
    },
  })
  .addEntrypoint({
    key: "preview-inference-chips",
    description: "Free preview of up to five verified rows for an optional exact comparison slice.",
    input: previewInput,
    output: previewOutput,
    async handler({ input }) {
      const sliceId = input.sliceId ?? defaultSliceId(snapshot);
      if (!sliceId) {
        return {
          output: {
            sliceId: null,
            comparability: "No verified comparison slices are available in this dataset version.",
            datasetVersion: snapshot.manifest.datasetVersion,
            rows: [],
            sourceLinks: [],
          },
        };
      }
      const ranked = rankRows(snapshot, { sliceId, page: 1, pageSize: 5, metricView: "official", grouping: "all-systems" });
      if ("error" in ranked) {
        return {
          output: {
            sliceId,
            comparability: ranked.error,
            datasetVersion: snapshot.manifest.datasetVersion,
            rows: [],
            sourceLinks: [],
          },
        };
      }
      return {
        output: {
          sliceId: ranked.slice.sliceId,
          comparability: ranked.comparability,
          datasetVersion: ranked.datasetVersion,
          rows: ranked.rows.map((row) => ({
            submitter: row.submitter,
            systemName: row.systemName,
            acceleratorDisplayName: row.acceleratorDisplayName,
            officialValue: row.officialValue,
            unit: row.unit,
            source: row.source,
          })),
          sourceLinks: ranked.sourceLinks,
        },
      };
    },
  })
  .addEntrypoint({
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
          network: resolvePaymentsNetwork(),
          price: "0.02",
          extensions: [asOfferBazaar(rankDiscoveryExtension())],
        },
      ],
    },
    async handler({ input }) {
      const ranked = rankRows(snapshot, {
        sliceId: input.sliceId,
        vendors: input.vendors,
        metricView: input.metricView,
        grouping: input.grouping,
        page: input.page,
        pageSize: input.pageSize,
      });
      if ("error" in ranked) {
        throw new Error(ranked.error);
      }
      return { output: ranked };
    },
  })
  .addEntrypoint({
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
          network: resolvePaymentsNetwork(),
          price: "0.03",
          extensions: [asOfferBazaar(compareDiscoveryExtension())],
        },
      ],
    },
    async handler({ input }) {
      const compared = compareChips(snapshot, input);
      if ("error" in compared) {
        throw new Error(compared.error);
      }
      return { output: compared };
    },
  })
  .build();

export const handlers = agentRuntime.http.handlers;
