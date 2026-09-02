import { describe, expect, it } from "bun:test";
import { ingestTree } from "../src/pipeline/parser";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const fixture = ingestTree({
  root: resolve("data/fixtures"),
  mode: "fixture",
  generatedAt: "2026-09-02T00:00:00.000Z",
  lastReviewedAt: "2026-09-02T00:00:00.000Z",
});

describe("parser", () => {
  it("parses official NVIDIA tokens/s from the log, not invented numbers", () => {
    const nvidia = fixture.results.find((r) => r.submitter === "NVIDIA" && r.metricKey === "tokens_per_second" && r.workload === "llama3.1-8b");
    expect(nvidia?.officialValue).toBe(165432);
    expect(nvidia?.reviewStatus).toBe("accepted");
    const summary = readFileSync("data/fixtures/NVIDIA/results/B300-SXM-270GBx8_TRT/llama3.1-8b/Offline/performance/run_1/mlperf_log_summary.txt", "utf8");
    expect(summary).toContain("Tokens per second: 165432");
  });

  it("accepts AMD, Intel, and a multi-accelerator NVIDIA system when evidence exists", () => {
    expect(fixture.results.some((r) => r.acceleratorVendor === "AMD" && r.reviewStatus === "accepted")).toBe(true);
    expect(fixture.results.some((r) => r.acceleratorVendor === "Intel" && r.reviewStatus === "accepted")).toBe(true);
    const nvidia = fixture.systems.find((s) => s.submitter === "NVIDIA" && s.reviewStatus === "accepted");
    expect(nvidia?.acceleratorCount).toBe(8);
  });

  it("quarantines CPU-only N/A accelerators and NVL72-without-count mystery systems", () => {
    const cpu = fixture.systems.find((s) => s.systemId === "1-node-2S-GNR_128C");
    expect(cpu?.reviewStatus).toBe("review-required");
    const mystery = fixture.systems.find((s) => s.systemId === "mystery-NVL72");
    expect(mystery?.reviewStatus).toBe("review-required");
    expect(mystery?.reviewReasons.join(" ")).toMatch(/count|unreviewed|identity/i);
  });

  it("attaches sha256 provenance to every published record", () => {
    for (const rec of [...fixture.accelerators, ...fixture.systems, ...fixture.results]) {
      expect(rec.logicalId.length).toBeGreaterThan(3);
      expect(rec.contentVersionId.startsWith("cv_")).toBe(true);
      expect(rec.source.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(rec.source.commit).toBe("4d3916ac9cf474b679cdfcf492d43a0559418ad1");
    }
  });

  it("reproduces the checked-in fixture hash", () => {
    const expected = readFileSync("data/generated/fixture/HASH", "utf8").trim();
    expect(fixture.manifest.snapshotHash).toBe(expected);
  });
});
