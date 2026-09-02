import type { ScenarioId, WorkloadId } from "./constants";

export type WinningDirection = "higher" | "lower";

export type MetricDefinition = {
  key: string;
  label: string;
  unit: string;
  winningDirection: WinningDirection;
  workloads: readonly WorkloadId[];
  scenarios: readonly ScenarioId[];
  logKeys: readonly string[];
  validity: string;
  derivationAllowed: boolean;
};

const ALL_WORKLOADS: WorkloadId[] = ["llama3.1-8b", "gpt-oss-120b", "deepseek-r1"];

export const METRIC_REGISTRY: readonly MetricDefinition[] = [
  {
    key: "tokens_per_second",
    label: "Tokens per second (system)",
    unit: "tok/s",
    winningDirection: "higher",
    workloads: ALL_WORKLOADS,
    scenarios: ["Offline"],
    logKeys: ["Tokens per second"],
    validity: "MLPerf log must report Result is VALID. Offline min-duration, min-queries, and early-stopping must be satisfied.",
    derivationAllowed: true,
  },
  {
    key: "samples_per_second",
    label: "Samples per second (system)",
    unit: "samples/s",
    winningDirection: "higher",
    workloads: ALL_WORKLOADS,
    scenarios: ["Offline"],
    logKeys: ["Samples per second"],
    validity: "MLPerf log must report Result is VALID.",
    derivationAllowed: true,
  },
  {
    key: "completed_tokens_per_second",
    label: "Completed tokens per second (system)",
    unit: "tok/s",
    winningDirection: "higher",
    workloads: ALL_WORKLOADS,
    scenarios: ["Server", "Interactive"],
    logKeys: ["Completed tokens per second"],
    validity: "MLPerf log must report Result is VALID. Server/Interactive TTFT and TPOT constraints must be satisfied when present.",
    derivationAllowed: true,
  },
  {
    key: "completed_samples_per_second",
    label: "Completed samples per second (system)",
    unit: "samples/s",
    winningDirection: "higher",
    workloads: ALL_WORKLOADS,
    scenarios: ["Server", "Interactive"],
    logKeys: ["Completed samples per second"],
    validity: "MLPerf log must report Result is VALID.",
    derivationAllowed: true,
  },
];

export function getMetric(key: string): MetricDefinition | undefined {
  return METRIC_REGISTRY.find((m) => m.key === key);
}

export function defaultMetricForScenario(scenario: ScenarioId): string {
  return scenario === "Offline" ? "tokens_per_second" : "completed_tokens_per_second";
}
