/** Exact comparison slice IDs in this pinned MLPerf v6.0 Closed snapshot. Primary first for Bazaar examples. */
export const PRIMARY_SLICE_ID = "v6.0|closed|llama3.1-8b|Offline|99|tokens_per_second" as const;

export const SLICE_IDS = [
  PRIMARY_SLICE_ID,
  "v6.0|closed|llama3.1-8b|Offline|99|samples_per_second",
  "v6.0|closed|llama3.1-8b|Server|99|completed_samples_per_second",
  "v6.0|closed|llama3.1-8b|Server|99|completed_tokens_per_second",
  "v6.0|closed|gpt-oss-120b|Offline|99|samples_per_second",
  "v6.0|closed|gpt-oss-120b|Offline|99|tokens_per_second",
  "v6.0|closed|gpt-oss-120b|Server|99|completed_samples_per_second",
  "v6.0|closed|gpt-oss-120b|Server|99|completed_tokens_per_second",
  "v6.0|closed|deepseek-r1|Offline|99|samples_per_second",
  "v6.0|closed|deepseek-r1|Offline|99|tokens_per_second",
  "v6.0|closed|deepseek-r1|Server|99|completed_samples_per_second",
  "v6.0|closed|deepseek-r1|Server|99|completed_tokens_per_second",
] as const;

export type SliceId = (typeof SLICE_IDS)[number];
