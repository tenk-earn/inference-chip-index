import type { DatasetSnapshot } from "@/pipeline/types";
import snapshotJson from "@/data/generated/snapshot.json";

export function loadSnapshot(): DatasetSnapshot {
  return snapshotJson as DatasetSnapshot;
}

export function defaultSliceId(snapshot: DatasetSnapshot): string | null {
  const preferred = snapshot.slices
    .filter((s) => s.metricKey === "tokens_per_second" && s.scenario === "Offline" && s.workload === "llama3.1-8b")
    .sort((a, b) => b.acceptedCount - a.acceptedCount)[0];
  return preferred?.sliceId ?? snapshot.slices[0]?.sliceId ?? null;
}
