import { z } from "zod";
import { SLICE_IDS } from "./slices";

export const emptyInput = z.object({});

export const previewInput = z.object({
  sliceId: z
    .string()
    .min(1)
    .optional()
    .describe("Optional exact comparison slice ID. Defaults to llama3.1-8b Offline tokens/s."),
});

export const rankInput = z.object({
  sliceId: z
    .enum(SLICE_IDS)
    .describe("Exact comparison slice ID. Primary: v6.0|closed|llama3.1-8b|Offline|99|tokens_per_second"),
  vendors: z
    .array(z.string().min(1))
    .max(16)
    .optional()
    .describe("Optional vendor filter, e.g. NVIDIA, Intel, AMD."),
  metricView: z
    .enum(["official", "derived"])
    .optional()
    .describe("official = submitted-system result; derived = per-accelerator when count is known."),
  grouping: z.enum(["all-systems", "best-per-accelerator"]).optional(),
  page: z.number().int().min(1).optional().describe("1-based page. Default 1."),
  pageSize: z.number().int().min(1).max(50).optional().describe("Page size 1-50. Default 25."),
});

export const compareInput = z.object({
  sliceId: z
    .enum(SLICE_IDS)
    .describe("Exact comparison slice ID. Primary: v6.0|closed|llama3.1-8b|Offline|99|tokens_per_second"),
  acceleratorSlugs: z
    .array(z.string().min(1))
    .min(2)
    .max(8)
    .describe("2-8 accelerator slugs, e.g. nvidia-b300-sxm-270gb and nvidia-rtx-pro-6000-blackwell."),
  baselineSlug: z
    .string()
    .min(1)
    .optional()
    .describe("Optional baseline slug for deltas. Defaults to the first slug."),
  metricView: z.enum(["official", "derived"]).optional(),
});

const sourceSchema = z.object({
  repository: z.string(),
  commit: z.string(),
  path: z.string(),
  url: z.string(),
  sha256: z.string(),
});

export const statusOutput = z.object({
  manifest: z.object({
    datasetVersion: z.string(),
    release: z.string(),
    division: z.string(),
    sourceCommit: z.string(),
    sourceRepository: z.string(),
    generatedAt: z.string(),
    lastReviewedAt: z.string(),
    freshness: z.enum(["fresh", "stale"]),
    mode: z.enum(["fixture", "full-source"]),
    snapshotHash: z.string(),
    counts: z.object({
      accelerators: z.number(),
      systems: z.number(),
      results: z.number(),
      acceptedResults: z.number(),
      slices: z.number(),
      quarantined: z.number(),
    }),
    sliceIds: z.array(z.string()),
  }),
  sourceLinks: z.array(z.string()),
});

const previewRow = z.object({
  submitter: z.string(),
  systemName: z.string(),
  acceleratorDisplayName: z.string().nullable(),
  officialValue: z.number(),
  unit: z.string(),
  source: sourceSchema,
});

export const previewOutput = z.object({
  sliceId: z.string().nullable(),
  comparability: z.string(),
  datasetVersion: z.string(),
  rows: z.array(previewRow),
  sourceLinks: z.array(z.string()),
});

export const rankOutput = z.object({
  slice: z.object({
    sliceId: z.string(),
    release: z.string(),
    division: z.string(),
    workload: z.string(),
    scenario: z.string(),
    accuracyTarget: z.string(),
    metricKey: z.string(),
    unit: z.string(),
    winningDirection: z.enum(["higher", "lower"]),
    comparability: z.string(),
    acceptedCount: z.number(),
  }),
  comparability: z.string(),
  datasetVersion: z.string(),
  metricView: z.enum(["official", "derived"]),
  grouping: z.enum(["all-systems", "best-per-accelerator"]),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  rows: z.array(z.object({
    rank: z.number(),
    position: z.number(),
    logicalId: z.string(),
    submitter: z.string(),
    systemId: z.string(),
    systemName: z.string(),
    acceleratorSlug: z.string().nullable(),
    acceleratorVendor: z.string().nullable(),
    acceleratorFamily: z.string().nullable(),
    acceleratorDisplayName: z.string().nullable(),
    acceleratorCount: z.number().nullable(),
    officialValue: z.number(),
    derivedPerAccelerator: z.number().nullable(),
    displayedValue: z.number(),
    displayedLabel: z.string(),
    unit: z.string(),
    source: sourceSchema,
  })),
  sourceLinks: z.array(z.string()),
});

export const compareOutput = z.object({
  slice: z.object({
    sliceId: z.string(),
    comparability: z.string(),
  }).passthrough(),
  comparability: z.string(),
  datasetVersion: z.string(),
  baselineSlug: z.string(),
  metricView: z.enum(["official", "derived"]),
  unit: z.string(),
  rows: z.array(z.object({
    acceleratorSlug: z.string(),
    present: z.boolean(),
    missingReason: z.string().nullable(),
    submitter: z.string().nullable(),
    systemName: z.string().nullable(),
    officialValue: z.number().nullable(),
    derivedPerAccelerator: z.number().nullable(),
    displayedValue: z.number().nullable(),
    deltaVsBaseline: z.number().nullable(),
    sourceUrl: z.string().nullable(),
  })),
  sourceLinks: z.array(z.string()),
});
