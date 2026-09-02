import { describe, expect, it } from "bun:test";
import { resolveAlias } from "../src/pipeline/aliases";
import { getMetric, METRIC_REGISTRY } from "../src/pipeline/metrics";

describe("identity", () => {
  it("maps reviewed aliases and refuses N/A", () => {
    expect(resolveAlias("NVIDIA B300-SXM-270GB")?.family).toBe("B300");
    expect(resolveAlias("Intel(R) Arc Pro(R) B60")?.vendor).toBe("Intel");
    expect(resolveAlias("AMD Instinct MI355X 288GB HBM3e")?.slug).toBe("amd-instinct-mi355x");
    expect(resolveAlias("N/A")).toBeNull();
  });
});

describe("metric registry", () => {
  it("declares unit, direction, log keys, and derivation policy", () => {
    for (const m of METRIC_REGISTRY) {
      expect(m.unit.length).toBeGreaterThan(0);
      expect(["higher", "lower"]).toContain(m.winningDirection);
      expect(m.logKeys.length).toBeGreaterThan(0);
    }
    expect(getMetric("tokens_per_second")?.derivationAllowed).toBe(true);
    expect(getMetric("tokens_per_second")?.scenarios).toContain("Offline");
  });
});
