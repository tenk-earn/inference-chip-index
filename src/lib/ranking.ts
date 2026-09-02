import { getMetric } from "@/pipeline/metrics";
import { MAX_RANK_PAGE_SIZE, MAX_RESPONSE_BYTES } from "@/pipeline/constants";
import type { BenchmarkResultRecord, DatasetSnapshot, SliceRecord } from "@/pipeline/types";
import { canonicalStringify } from "@/pipeline/canonical";

export type MetricView = "official" | "derived";
export type Grouping = "all-systems" | "best-per-accelerator";

export type RankQuery = {
  sliceId: string;
  vendors?: string[];
  metricView?: MetricView;
  grouping?: Grouping;
  page?: number;
  pageSize?: number;
};

export type RankedRow = {
  rank: number;
  position: number;
  logicalId: string;
  submitter: string;
  systemId: string;
  systemName: string;
  acceleratorSlug: string | null;
  acceleratorVendor: string | null;
  acceleratorFamily: string | null;
  acceleratorDisplayName: string | null;
  acceleratorCount: number | null;
  officialValue: number;
  derivedPerAccelerator: number | null;
  displayedValue: number;
  displayedLabel: string;
  unit: string;
  source: BenchmarkResultRecord["source"];
};

export type RankResponse = {
  slice: SliceRecord;
  comparability: string;
  datasetVersion: string;
  metricView: MetricView;
  grouping: Grouping;
  total: number;
  page: number;
  pageSize: number;
  rows: RankedRow[];
  sourceLinks: string[];
};

export function parseSliceId(sliceId: string): SliceRecord["sliceId"] {
  return sliceId;
}

export function findSlice(snapshot: DatasetSnapshot, sliceId: string): SliceRecord | undefined {
  return snapshot.slices.find((s) => s.sliceId === sliceId);
}

function displayedValue(row: BenchmarkResultRecord, view: MetricView): number | null {
  if (view === "derived") return row.derivedPerAccelerator;
  return row.officialValue;
}

export function comparableResults(snapshot: DatasetSnapshot, slice: SliceRecord): BenchmarkResultRecord[] {
  return snapshot.results.filter(
    (r) =>
      r.reviewStatus === "accepted" &&
      r.valid &&
      r.workload === slice.workload &&
      r.scenario === slice.scenario &&
      r.accuracyTarget === slice.accuracyTarget &&
      r.metricKey === slice.metricKey &&
      r.unit === slice.unit,
  );
}

export function rankRows(snapshot: DatasetSnapshot, query: RankQuery): RankResponse | { error: string; code: string } {
  const slice = findSlice(snapshot, query.sliceId);
  if (!slice) return { error: `Unknown or empty comparison slice: ${query.sliceId}`, code: "invalid_slice" };
  const metric = getMetric(slice.metricKey);
  if (!metric) return { error: `Unknown metric ${slice.metricKey}`, code: "unknown_metric" };

  const view: MetricView = query.metricView ?? "official";
  const grouping: Grouping = query.grouping ?? "all-systems";
  if (view === "derived" && !metric.derivationAllowed) {
    return { error: "Derived metric view is not allowed for this metric.", code: "derivation_not_allowed" };
  }

  let rows = comparableResults(snapshot, slice);
  if (query.vendors?.length) {
    const set = new Set(query.vendors.map((v) => v.toLowerCase()));
    rows = rows.filter((r) => r.acceleratorVendor && set.has(r.acceleratorVendor.toLowerCase()));
  }
  if (view === "derived") {
    rows = rows.filter((r) => r.derivedPerAccelerator !== null);
  }

  const scored = rows
    .map((r) => ({ r, value: displayedValue(r, view) }))
    .filter((x): x is { r: BenchmarkResultRecord; value: number } => x.value !== null);

  scored.sort((a, b) => {
    const cmp = metric.winningDirection === "higher" ? b.value - a.value : a.value - b.value;
    if (cmp !== 0) return cmp;
    return a.r.logicalId.localeCompare(b.r.logicalId);
  });

  let grouped = scored;
  if (grouping === "best-per-accelerator") {
    const best = new Map<string, (typeof scored)[number]>();
    for (const item of scored) {
      const key = item.r.acceleratorSlug ?? item.r.logicalId;
      if (!best.has(key)) best.set(key, item);
    }
    grouped = [...best.values()].sort((a, b) => {
      const cmp = metric.winningDirection === "higher" ? b.value - a.value : a.value - b.value;
      if (cmp !== 0) return cmp;
      return a.r.logicalId.localeCompare(b.r.logicalId);
    });
  }

  const ranked: RankedRow[] = grouped.map((item, index) => {
    return {
      rank: 0,
      position: index + 1,
      logicalId: item.r.logicalId,
      submitter: item.r.submitter,
      systemId: item.r.systemId,
      systemName: item.r.systemName,
      acceleratorSlug: item.r.acceleratorSlug,
      acceleratorVendor: item.r.acceleratorVendor,
      acceleratorFamily: item.r.acceleratorFamily,
      acceleratorDisplayName: item.r.acceleratorDisplayName,
      acceleratorCount: item.r.acceleratorCount,
      officialValue: item.r.officialValue,
      derivedPerAccelerator: item.r.derivedPerAccelerator,
      displayedValue: item.value,
      displayedLabel: view === "derived" ? "derived per accelerator" : "official submitted system",
      unit: item.r.unit,
      source: item.r.source,
    };
  });

  let currentRank = 0;
  let currentValue: number | null = null;
  for (const row of ranked) {
    if (currentValue === null || row.displayedValue !== currentValue) {
      currentRank = row.position;
      currentValue = row.displayedValue;
    }
    row.rank = currentRank;
  }

  const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), MAX_RANK_PAGE_SIZE);
  const page = Math.max(query.page ?? 1, 1);
  const start = (page - 1) * pageSize;
  const pageRows = ranked.slice(start, start + pageSize);

  const response: RankResponse = {
    slice,
    comparability: slice.comparability,
    datasetVersion: snapshot.manifest.datasetVersion,
    metricView: view,
    grouping,
    total: ranked.length,
    page,
    pageSize,
    rows: pageRows,
    sourceLinks: [...new Set(pageRows.map((r) => r.source.url))],
  };

  const size = Buffer.byteLength(canonicalStringify(response), "utf8");
  if (size > MAX_RESPONSE_BYTES) {
    return { error: "Ranked response exceeds the 1 MiB proof bound; narrow filters or page size.", code: "response_too_large" };
  }
  return response;
}
