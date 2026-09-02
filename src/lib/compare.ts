import type { DatasetSnapshot } from "@/pipeline/types";
import { findSlice, comparableResults } from "./ranking";
import { getMetric } from "@/pipeline/metrics";

export type CompareQuery = {
  sliceId: string;
  acceleratorSlugs: string[];
  baselineSlug?: string;
  metricView?: "official" | "derived";
};

export type CompareRow = {
  acceleratorSlug: string;
  present: boolean;
  missingReason: string | null;
  submitter: string | null;
  systemName: string | null;
  officialValue: number | null;
  derivedPerAccelerator: number | null;
  displayedValue: number | null;
  deltaVsBaseline: number | null;
  sourceUrl: string | null;
};

export function compareChips(snapshot: DatasetSnapshot, query: CompareQuery) {
  const slice = findSlice(snapshot, query.sliceId);
  if (!slice) return { error: `Unknown comparison slice: ${query.sliceId}`, code: "invalid_slice" as const };
  const slugs = query.acceleratorSlugs;
  if (slugs.length < 2 || slugs.length > 8) {
    return { error: "Provide between 2 and 8 accelerator slugs.", code: "invalid_slug_count" as const };
  }
  const view = query.metricView ?? "official";
  const metric = getMetric(slice.metricKey);
  const rowsInSlice = comparableResults(snapshot, slice);
  const bestBySlug = new Map<string, (typeof rowsInSlice)[number]>();
  for (const row of rowsInSlice) {
    if (!row.acceleratorSlug) continue;
    const existing = bestBySlug.get(row.acceleratorSlug);
    const value = view === "derived" ? row.derivedPerAccelerator : row.officialValue;
    if (value === null) continue;
    if (!existing) {
      bestBySlug.set(row.acceleratorSlug, row);
      continue;
    }
    const prev = view === "derived" ? existing.derivedPerAccelerator : existing.officialValue;
    if (prev === null || (metric?.winningDirection === "higher" ? value > prev : value < prev)) {
      bestBySlug.set(row.acceleratorSlug, row);
    }
  }

  const baselineSlug = query.baselineSlug ?? slugs[0];
  const baseline = bestBySlug.get(baselineSlug);
  const baselineValue =
    baseline == null ? null : view === "derived" ? baseline.derivedPerAccelerator : baseline.officialValue;

  const rows: CompareRow[] = slugs.map((slug) => {
    const hit = bestBySlug.get(slug);
    if (!hit) {
      return {
        acceleratorSlug: slug,
        present: false,
        missingReason: `No accepted ${slice.workload} ${slice.scenario} ${slice.metricKey} result for ${slug} in this exact slice.`,
        submitter: null,
        systemName: null,
        officialValue: null,
        derivedPerAccelerator: null,
        displayedValue: null,
        deltaVsBaseline: null,
        sourceUrl: null,
      };
    }
    const displayed = view === "derived" ? hit.derivedPerAccelerator : hit.officialValue;
    const delta =
      baselineValue !== null && displayed !== null && slug !== baselineSlug ? displayed - baselineValue : null;
    return {
      acceleratorSlug: slug,
      present: true,
      missingReason: null,
      submitter: hit.submitter,
      systemName: hit.systemName,
      officialValue: hit.officialValue,
      derivedPerAccelerator: hit.derivedPerAccelerator,
      displayedValue: displayed,
      deltaVsBaseline: delta,
      sourceUrl: hit.source.url,
    };
  });

  return {
    slice,
    comparability: slice.comparability,
    datasetVersion: snapshot.manifest.datasetVersion,
    baselineSlug,
    metricView: view,
    unit: slice.unit,
    rows,
    sourceLinks: rows.map((r) => r.sourceUrl).filter((u): u is string => Boolean(u)),
  };
}
