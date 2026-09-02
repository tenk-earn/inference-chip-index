import { describe, expect, it } from "bun:test";
import { loadSnapshot } from "../src/lib/dataset";
import { comparableResults, rankRows } from "../src/lib/ranking";
import { compareChips } from "../src/lib/compare";

const snapshot = loadSnapshot();
const slice = snapshot.slices.find((s) => s.sliceId.includes("llama3.1-8b|Offline|99|tokens_per_second"))!;

describe("ranking", () => {
  it("never mixes incompatible dimensions", () => {
    const rows = comparableResults(snapshot, slice);
    expect(rows.length).toBeGreaterThan(2);
    expect(new Set(rows.map((r) => r.workload)).size).toBe(1);
    expect(new Set(rows.map((r) => r.scenario)).size).toBe(1);
    expect(new Set(rows.map((r) => r.metricKey)).size).toBe(1);
    expect(new Set(rows.map((r) => r.unit)).size).toBe(1);
  });

  it("has a verified slice spanning two vendors and two families", () => {
    const ranked = rankRows(snapshot, { sliceId: slice.sliceId, pageSize: 50 });
    if ("error" in ranked) throw new Error(ranked.error);
    const vendors = new Set(ranked.rows.map((r) => r.acceleratorVendor));
    const families = new Set(ranked.rows.map((r) => r.acceleratorFamily));
    expect(ranked.rows.length).toBeGreaterThanOrEqual(3);
    expect(vendors.size).toBeGreaterThanOrEqual(2);
    expect(families.size).toBeGreaterThanOrEqual(2);
  });

  it("keeps competition ranks and sequential positions across ties", () => {
    const ranked = rankRows(snapshot, { sliceId: slice.sliceId, pageSize: 50 });
    if ("error" in ranked) throw new Error(ranked.error);
    ranked.rows.forEach((row, i) => {
      expect(row.position).toBe(i + 1);
      if (i > 0 && row.displayedValue === ranked.rows[i - 1].displayedValue) {
        expect(row.rank).toBe(ranked.rows[i - 1].rank);
      }
    });
  });

  it("labels derived per-accelerator values and refuses name-only counts", () => {
    const nvidia = snapshot.results.find((r) => r.submitter === "NVIDIA" && r.metricKey === "tokens_per_second" && r.workload === "llama3.1-8b" && r.reviewStatus === "accepted");
    expect(nvidia?.acceleratorCount).toBe(8);
    expect(nvidia?.derivedPerAccelerator).toBeCloseTo(nvidia!.officialValue / 8);
    const mystery = snapshot.systems.find((s) => s.systemId === "mystery-NVL72");
    // Full-source GB200 NVL72 systems may have a JSON-established count; names are never parsed.
    if (mystery) expect(mystery.acceleratorCount).toBeNull();
    expect(nvidia?.reviewReasons ?? []).not.toContain("inferred-from-name");
  });
});

describe("compare", () => {
  it("returns missing-evidence reasons and deltas only vs baseline", () => {
    const slugs = [...new Set(snapshot.results.filter((r) => r.workload === "llama3.1-8b" && r.reviewStatus === "accepted").map((r) => r.acceleratorSlug).filter((s): s is string => Boolean(s)))].slice(0, 3);
    const out = compareChips(snapshot, { sliceId: slice.sliceId, acceleratorSlugs: [...slugs, "no-such-chip"], baselineSlug: slugs[0] });
    if ("error" in out) throw new Error(out.error);
    expect(out.rows.some((r) => r.missingReason)).toBe(true);
    const base = out.rows.find((r) => r.acceleratorSlug === slugs[0]);
    expect(base?.deltaVsBaseline).toBeNull();
  });
});
