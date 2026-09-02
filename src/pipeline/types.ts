import type { ScenarioId, WorkloadId } from "./constants";

export type SourceRef = {
  repository: string;
  commit: string;
  path: string;
  url: string;
  sha256: string;
};

export type ProvenanceRecord = {
  logicalId: string;
  contentVersionId: string;
  source: SourceRef;
};

export type AcceleratorRecord = ProvenanceRecord & {
  slug: string;
  vendor: string;
  family: string;
  displayName: string;
  rawModelName: string;
};

export type SubmittedSystemRecord = ProvenanceRecord & {
  submitter: string;
  systemId: string;
  systemName: string;
  status: string;
  systemType: string;
  acceleratorSlug: string | null;
  acceleratorCount: number | null;
  acceleratorsPerNode: number | null;
  numberOfNodes: number | null;
  framework: string | null;
  hostProcessor: string | null;
  reviewStatus: "accepted" | "review-required";
  reviewReasons: string[];
};

export type BenchmarkResultRecord = ProvenanceRecord & {
  systemLogicalId: string;
  submitter: string;
  systemId: string;
  systemName: string;
  acceleratorSlug: string | null;
  acceleratorVendor: string | null;
  acceleratorFamily: string | null;
  acceleratorDisplayName: string | null;
  acceleratorCount: number | null;
  workload: WorkloadId;
  scenario: ScenarioId;
  accuracyTarget: string;
  metricKey: string;
  unit: string;
  officialValue: number;
  derivedPerAccelerator: number | null;
  valid: boolean;
  reviewStatus: "accepted" | "review-required";
  reviewReasons: string[];
};

export type SliceRecord = {
  sliceId: string;
  release: string;
  division: string;
  workload: WorkloadId;
  scenario: ScenarioId;
  accuracyTarget: string;
  metricKey: string;
  unit: string;
  winningDirection: "higher" | "lower";
  comparability: string;
  acceptedCount: number;
};

export type QuarantineRecord = {
  kind: "system" | "result";
  path: string;
  reasons: string[];
  source?: SourceRef;
};

export type CoverageCell = {
  vendor: string;
  family: string;
  workload: WorkloadId;
  accepted: number;
  quarantined: number;
};

export type DatasetManifest = {
  datasetVersion: string;
  release: string;
  division: string;
  sourceCommit: string;
  sourceRepository: string;
  generatedAt: string;
  lastReviewedAt: string;
  freshness: "fresh" | "stale";
  mode: "fixture" | "full-source";
  snapshotHash: string;
  counts: {
    accelerators: number;
    systems: number;
    results: number;
    acceptedResults: number;
    slices: number;
    quarantined: number;
  };
  sliceIds: string[];
};

export type DatasetSnapshot = {
  manifest: DatasetManifest;
  accelerators: AcceleratorRecord[];
  systems: SubmittedSystemRecord[];
  results: BenchmarkResultRecord[];
  slices: SliceRecord[];
  quarantine: QuarantineRecord[];
  coverage: CoverageCell[];
  changelog: { version: string; generatedAt: string; summary: string; entries: string[] };
  tombstones: { logicalId: string; reason: string; removedIn: string }[];
};
