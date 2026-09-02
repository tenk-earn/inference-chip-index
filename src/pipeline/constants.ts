export const MLPERF_RELEASE = "v6.0";
export const MLPERF_DIVISION = "closed";
export const MLPERF_COMMIT = "4d3916ac9cf474b679cdfcf492d43a0559418ad1";
export const MLPERF_REPOSITORY = "https://github.com/mlcommons/inference_results_v6.0";
export const MLPERF_REPO_SLUG = "mlcommons/inference_results_v6.0";

export const ALLOWED_WORKLOADS = ["llama3.1-8b", "gpt-oss-120b", "deepseek-r1"] as const;
export type WorkloadId = (typeof ALLOWED_WORKLOADS)[number];

export const WORKLOAD_ALIASES: Record<string, WorkloadId> = {
  "llama3.1-8b": "llama3.1-8b",
  "llama3_1-8b": "llama3.1-8b",
  "gpt-oss-120b": "gpt-oss-120b",
  "deepseek-r1": "deepseek-r1",
};

export const ALLOWED_SCENARIOS = ["Offline", "Server", "Interactive"] as const;
export type ScenarioId = (typeof ALLOWED_SCENARIOS)[number];

export const DEFAULT_ACCURACY_TARGET = "99";

export const MAX_RANK_PAGE_SIZE = 50;
export const MAX_RESPONSE_BYTES = 900_000;
