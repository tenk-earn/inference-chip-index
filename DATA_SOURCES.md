# Data sources

All benchmark numbers come from official MLPerf Inference v6.0 files. None are invented.

| Field | Value |
| --- | --- |
| Repository | https://github.com/mlcommons/inference_results_v6.0 |
| Commit | `4d3916ac9cf474b679cdfcf492d43a0559418ad1` |
| Division | `closed` only |
| Workloads | `llama3.1-8b` (also source dir `llama3_1-8b`), `gpt-oss-120b`, `deepseek-r1` |
| Scenarios | Offline, Server, Interactive when present |
| System metadata | `closed/<submitter>/systems/*.json` |
| Metrics | `performance/run_1/mlperf_log_summary.txt` (`Tokens per second`, `Samples per second`, `Completed tokens per second`, `Completed samples per second`) |
| Validity | `Result is : VALID` |

Each published record stores repository, commit, path, HTTPS blob URL, and SHA-256 of the source file bytes.

Out of scope: Open, Network, edge, vision, speech, training, vendor marketing, supplemental vendor datasets.

The compact tree in `data/mlperf-v6.0` is a parse-only subset (systems JSON, summaries, accuracy.txt, measurements.json). It is not a fork of other people's applications.
