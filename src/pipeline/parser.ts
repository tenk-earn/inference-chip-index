import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  ALLOWED_SCENARIOS,
  DEFAULT_ACCURACY_TARGET,
  MLPERF_COMMIT,
  MLPERF_DIVISION,
  MLPERF_RELEASE,
  MLPERF_REPOSITORY,
  WORKLOAD_ALIASES,
  type ScenarioId,
  type WorkloadId,
} from "./constants";
import { resolveAlias } from "./aliases";
import { getMetric, METRIC_REGISTRY } from "./metrics";
import { canonicalStringify, contentVersionId, parseNumber, sha256 } from "./canonical";
import type {
  AcceleratorRecord,
  BenchmarkResultRecord,
  CoverageCell,
  DatasetSnapshot,
  QuarantineRecord,
  SliceRecord,
  SourceRef,
  SubmittedSystemRecord,
} from "./types";

function sourceRef(absPath: string, repoRoot: string): SourceRef {
  const rel = relative(repoRoot, absPath).split(sep).join("/");
  const bytes = readFileSync(absPath);
  const inClosed = rel.startsWith("closed/");
  const githubPath = inClosed ? rel : `closed/${rel}`;
  return {
    repository: MLPERF_REPOSITORY,
    commit: MLPERF_COMMIT,
    path: githubPath,
    url: `${MLPERF_REPOSITORY}/blob/${MLPERF_COMMIT}/${githubPath}`,
    sha256: sha256(bytes),
  };
}

function parseSummaryMetrics(text: string): {
  valid: boolean | null;
  values: Record<string, number>;
  scenario: string | null;
} {
  const validMatch = text.match(/^Result is\s*:\s*(VALID|INVALID)/m);
  const valid = validMatch ? validMatch[1] === "VALID" : null;
  const scenarioMatch = text.match(/^Scenario\s*:\s*(\S+)/m);
  const values: Record<string, number> = {};
  const pairs: Array<[string, RegExp]> = [
    ["tokens_per_second", /^Tokens per second:\s*([0-9.]+)/m],
    ["samples_per_second", /^Samples per second:\s*([0-9.]+)/m],
    ["completed_tokens_per_second", /^Completed tokens per second:\s*([0-9.]+)/m],
    ["completed_samples_per_second", /^Completed samples per second\s*:\s*([0-9.]+)/m],
  ];
  for (const [key, re] of pairs) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) values[key] = n;
    }
  }
  return { valid, values, scenario: scenarioMatch?.[1] ?? null };
}

function sliceId(parts: {
  workload: WorkloadId;
  scenario: ScenarioId;
  accuracyTarget: string;
  metricKey: string;
}): string {
  return [MLPERF_RELEASE, MLPERF_DIVISION, parts.workload, parts.scenario, parts.accuracyTarget, parts.metricKey].join("|");
}

function comparability(parts: {
  workload: WorkloadId;
  scenario: ScenarioId;
  accuracyTarget: string;
  metricKey: string;
}): string {
  const metric = getMetric(parts.metricKey);
  return `Comparable only for MLPerf Inference ${MLPERF_RELEASE} Closed division, workload ${parts.workload}, scenario ${parts.scenario}, accuracy target ${parts.accuracyTarget}%, metric ${metric?.label ?? parts.metricKey} in ${metric?.unit ?? "unknown units"}. Rankings never mix other releases, divisions, workloads, scenarios, accuracy targets, metrics, or units. The official submitted-system result is the ranking metric; per-accelerator values are derived only when accelerator count is established in the system JSON.`;
}

export function ingestTree(opts: {
  root: string;
  mode: "fixture" | "full-source";
  generatedAt?: string;
  lastReviewedAt?: string;
}): DatasetSnapshot {
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const lastReviewedAt = opts.lastReviewedAt ?? generatedAt;
  const closedRoot = existsSync(join(opts.root, "closed")) ? join(opts.root, "closed") : opts.root;

  const accelerators = new Map<string, AcceleratorRecord>();
  const systems: SubmittedSystemRecord[] = [];
  const results: BenchmarkResultRecord[] = [];
  const quarantine: QuarantineRecord[] = [];
  const seenLogical = new Set<string>();

  const submitters = readdirSync(closedRoot).filter((name) => statSync(join(closedRoot, name)).isDirectory());

  for (const submitter of submitters.sort()) {
    const systemsDir = join(closedRoot, submitter, "systems");
    if (!existsSync(systemsDir)) continue;
    const systemFiles = readdirSync(systemsDir).filter((n) => n.endsWith(".json"));
    for (const file of systemFiles.sort()) {
      const abs = join(systemsDir, file);
      const systemId = file.replace(/\.json$/i, "");
      const src = sourceRef(abs, opts.root.endsWith("closed") ? join(opts.root, "..") : opts.root);
      let raw: Record<string, unknown>;
      try {
        raw = JSON.parse(readFileSync(abs, "utf8")) as Record<string, unknown>;
      } catch {
        quarantine.push({ kind: "system", path: src.path, reasons: ["system-json-parse-error"], source: src });
        continue;
      }

      const reasons: string[] = [];
      const division = String(raw.division ?? "").toLowerCase();
      if (division && division !== "closed") reasons.push(`division-not-closed:${division}`);
      const systemType = String(raw.system_type ?? "");
      if (systemType && systemType.toLowerCase() === "edge") reasons.push("system-type-edge-out-of-scope");

      const rawModel = typeof raw.accelerator_model_name === "string" ? raw.accelerator_model_name.trim() : "";
      if (!rawModel || /^n\/a$/i.test(rawModel)) reasons.push("accelerator-identity-missing");
      if (rawModel.includes(" and ")) reasons.push("accelerator-identity-ambiguous-mixed-models");

      const alias = resolveAlias(rawModel);
      if (rawModel && !/^n\/a$/i.test(rawModel) && !alias) reasons.push("accelerator-identity-unreviewed");

      const acceleratorsPerNode = parseNumber(raw.accelerators_per_node);
      const numberOfNodes = parseNumber(raw.number_of_nodes);
      if (acceleratorsPerNode === null) reasons.push("accelerator-count-unestablished");
      if (numberOfNodes === null) reasons.push("node-count-unestablished");
      if (acceleratorsPerNode !== null && acceleratorsPerNode < 1) reasons.push("accelerator-count-zero-or-negative");

      const acceleratorCount =
        acceleratorsPerNode !== null && numberOfNodes !== null && acceleratorsPerNode >= 1 && numberOfNodes >= 1
          ? acceleratorsPerNode * numberOfNodes
          : null;

      const reviewStatus = reasons.length ? ("review-required" as const) : ("accepted" as const);
      const logicalId = `sys:${submitter}:${systemId}`;
      if (seenLogical.has(logicalId)) {
        quarantine.push({ kind: "system", path: src.path, reasons: ["duplicate-system-id"], source: src });
        continue;
      }
      seenLogical.add(logicalId);

      if (alias && !accelerators.has(alias.slug)) {
        const accBody = {
          slug: alias.slug,
          vendor: alias.vendor,
          family: alias.family,
          displayName: alias.displayName,
          rawModelName: alias.raw,
        };
        accelerators.set(alias.slug, {
          logicalId: `acc:${alias.slug}`,
          contentVersionId: contentVersionId(accBody),
          source: src,
          ...accBody,
        });
      }

      const systemBody = {
        submitter: String(raw.submitter ?? submitter),
        systemId,
        systemName: String(raw.system_name ?? systemId),
        status: String(raw.status ?? "unknown"),
        systemType: systemType || "unspecified",
        acceleratorSlug: alias?.slug ?? null,
        acceleratorCount,
        acceleratorsPerNode,
        numberOfNodes,
        framework: typeof raw.framework === "string" ? raw.framework : null,
        hostProcessor: typeof raw.host_processor_model_name === "string" ? raw.host_processor_model_name : null,
        reviewStatus,
        reviewReasons: reasons,
      };
      const rec: SubmittedSystemRecord = {
        logicalId,
        contentVersionId: contentVersionId(systemBody),
        source: src,
        ...systemBody,
      };
      systems.push(rec);
      if (reviewStatus === "review-required") {
        quarantine.push({ kind: "system", path: src.path, reasons, source: src });
      }
    }
  }

  for (const submitter of submitters.sort()) {
    const resultsDir = join(closedRoot, submitter, "results");
    if (!existsSync(resultsDir)) continue;
    for (const systemId of readdirSync(resultsDir).sort()) {
      const systemDir = join(resultsDir, systemId);
      if (!statSync(systemDir).isDirectory()) continue;
      const system =
        systems.find((s) => s.systemId === systemId && (s.submitter === submitter || true) && s.logicalId === `sys:${submitter}:${systemId}`) ??
        systems.find((s) => s.systemId === systemId);
      for (const workloadDirName of readdirSync(systemDir).sort()) {
        const workload = WORKLOAD_ALIASES[workloadDirName];
        if (!workload) continue;
        const workloadDir = join(systemDir, workloadDirName);
        if (!statSync(workloadDir).isDirectory()) continue;
        for (const scenarioName of readdirSync(workloadDir).sort()) {
          if (!(ALLOWED_SCENARIOS as readonly string[]).includes(scenarioName)) continue;
          const scenario = scenarioName as ScenarioId;
          const summaryPath = join(workloadDir, scenarioName, "performance", "run_1", "mlperf_log_summary.txt");
          if (!existsSync(summaryPath)) {
            quarantine.push({
              kind: "result",
              path: relative(closedRoot, join(workloadDir, scenarioName)).split(sep).join("/"),
              reasons: ["missing-performance-summary"],
            });
            continue;
          }
          const srcRoot = opts.root.endsWith("closed") ? join(opts.root, "..") : opts.root;
          const src = sourceRef(summaryPath, srcRoot);
          const text = readFileSync(summaryPath, "utf8");
          const parsed = parseSummaryMetrics(text);
          const reasons: string[] = [];
          if (!system) reasons.push("missing-matching-system-json");
          if (system?.reviewStatus === "review-required") reasons.push(...system.reviewReasons.map((r) => `system:${r}`));
          if (parsed.valid === null) reasons.push("validity-unparsed");
          if (parsed.valid === false) reasons.push("mlperf-result-invalid");
          if (parsed.scenario && parsed.scenario !== scenario) reasons.push("scenario-mismatch-in-log");

          const metricKeys = METRIC_REGISTRY.filter((m) => m.scenarios.includes(scenario) && m.workloads.includes(workload)).map((m) => m.key);
          const present = metricKeys.filter((k) => parsed.values[k] !== undefined);
          if (!present.length) reasons.push("no-registered-metric-in-log");

          const acc = system?.acceleratorSlug ? accelerators.get(system.acceleratorSlug) : undefined;

          for (const metricKey of present) {
            const metric = getMetric(metricKey)!;
            const officialValue = parsed.values[metricKey];
            if (!Number.isFinite(officialValue) || officialValue < 0) {
              quarantine.push({ kind: "result", path: src.path, reasons: ["invalid-metric-number", metricKey], source: src });
              continue;
            }
            const derived =
              metric.derivationAllowed && system?.acceleratorCount && system.acceleratorCount > 0
                ? officialValue / system.acceleratorCount
                : null;
            const resultReasons = [...reasons];
            if (parsed.valid !== true) resultReasons.push("not-officially-valid");
            if (!acc) resultReasons.push("accelerator-unresolved");
            const reviewStatus = (resultReasons.length || parsed.valid !== true ? "review-required" : "accepted") as "accepted" | "review-required";
            const logicalId = `res:${submitter}:${systemId}:${workload}:${scenario}:${DEFAULT_ACCURACY_TARGET}:${metricKey}`;
            if (seenLogical.has(logicalId)) {
              quarantine.push({ kind: "result", path: src.path, reasons: ["duplicate-result-id"], source: src });
              continue;
            }
            seenLogical.add(logicalId);
            const body = {
              systemLogicalId: system?.logicalId ?? `sys:${submitter}:${systemId}`,
              submitter,
              systemId,
              systemName: system?.systemName ?? systemId,
              acceleratorSlug: acc?.slug ?? null,
              acceleratorVendor: acc?.vendor ?? null,
              acceleratorFamily: acc?.family ?? null,
              acceleratorDisplayName: acc?.displayName ?? null,
              acceleratorCount: system?.acceleratorCount ?? null,
              workload,
              scenario,
              accuracyTarget: DEFAULT_ACCURACY_TARGET,
              metricKey,
              unit: metric.unit,
              officialValue,
              derivedPerAccelerator: derived,
              valid: parsed.valid === true,
              reviewStatus,
              reviewReasons: resultReasons,
            };
            const rec: BenchmarkResultRecord = {
              logicalId,
              contentVersionId: contentVersionId(body),
              source: src,
              ...body,
            };
            results.push(rec);
            if (reviewStatus === "review-required") {
              quarantine.push({ kind: "result", path: src.path, reasons: resultReasons, source: src });
            }
          }
        }
      }
    }
  }

  const accepted = results.filter((r) => r.reviewStatus === "accepted" && r.valid);
  const sliceMap = new Map<string, SliceRecord>();
  for (const r of accepted) {
    const id = sliceId(r);
    const existing = sliceMap.get(id);
    if (existing) {
      existing.acceptedCount += 1;
    } else {
      sliceMap.set(id, {
        sliceId: id,
        release: MLPERF_RELEASE,
        division: MLPERF_DIVISION,
        workload: r.workload,
        scenario: r.scenario,
        accuracyTarget: r.accuracyTarget,
        metricKey: r.metricKey,
        unit: r.unit,
        winningDirection: getMetric(r.metricKey)?.winningDirection ?? "higher",
        comparability: comparability(r),
        acceptedCount: 1,
      });
    }
  }

  const coverageMap = new Map<string, CoverageCell>();
  for (const r of results) {
    const vendor = r.acceleratorVendor ?? "unresolved";
    const family = r.acceleratorFamily ?? "unresolved";
    const key = `${vendor}|${family}|${r.workload}`;
    const cell = coverageMap.get(key) ?? { vendor, family, workload: r.workload, accepted: 0, quarantined: 0 };
    if (r.reviewStatus === "accepted") cell.accepted += 1;
    else cell.quarantined += 1;
    coverageMap.set(key, cell);
  }
  for (const vendor of ["NVIDIA", "AMD", "Intel"]) {
    const has = [...coverageMap.values()].some((c) => c.vendor === vendor && c.accepted > 0);
    if (!has) {
      coverageMap.set(`${vendor}|none|none`, {
        vendor,
        family: "none",
        workload: "llama3.1-8b",
        accepted: 0,
        quarantined: results.filter((r) => r.acceleratorVendor === vendor && r.reviewStatus !== "accepted").length,
      });
    }
  }

  const slices = [...sliceMap.values()].sort((a, b) => a.sliceId.localeCompare(b.sliceId));
  const accList = [...accelerators.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  const systemsSorted = [...systems].sort((a, b) => a.logicalId.localeCompare(b.logicalId));
  const resultsSorted = [...results].sort((a, b) => a.logicalId.localeCompare(b.logicalId));
  const quarantineSorted = [...quarantine].sort((a, b) => a.path.localeCompare(b.path) || a.reasons.join().localeCompare(b.reasons.join()));
  const coverage = [...coverageMap.values()].sort((a, b) => `${a.vendor}|${a.family}|${a.workload}`.localeCompare(`${b.vendor}|${b.family}|${b.workload}`));

  const bodyForHash = {
    accelerators: accList,
    systems: systemsSorted,
    results: resultsSorted,
    slices,
  };
  const snapshotHash = sha256(canonicalStringify(bodyForHash));
  const datasetVersion = `chip-index-${MLPERF_RELEASE}-${opts.mode}-${snapshotHash.slice(0, 12)}`;

  const generatedMs = Date.parse(generatedAt);
  const freshness = Number.isFinite(generatedMs) && Date.now() - generatedMs < 1000 * 60 * 60 * 24 * 30 ? "fresh" : "stale";

  const changelog = {
    version: datasetVersion,
    generatedAt,
    summary: `Imported ${opts.mode} MLPerf Inference ${MLPERF_RELEASE} closed-division allowlisted workloads.`,
    entries: [
      `${systemsSorted.length} submitted systems`,
      `${resultsSorted.length} parsed results (${accepted.length} accepted)`,
      `${quarantineSorted.length} quarantine notes`,
      `${slices.length} comparison slices`,
    ],
  };

  const manifest = {
    datasetVersion,
    release: MLPERF_RELEASE,
    division: MLPERF_DIVISION,
    sourceCommit: MLPERF_COMMIT,
    sourceRepository: MLPERF_REPOSITORY,
    generatedAt,
    lastReviewedAt,
    freshness: freshness as "fresh" | "stale",
    mode: opts.mode,
    snapshotHash,
    counts: {
      accelerators: accList.length,
      systems: systemsSorted.length,
      results: resultsSorted.length,
      acceptedResults: accepted.length,
      slices: slices.length,
      quarantined: quarantineSorted.length,
    },
    sliceIds: slices.map((s) => s.sliceId),
  };

  return {
    manifest,
    accelerators: accList,
    systems: systemsSorted,
    results: resultsSorted,
    slices,
    quarantine: quarantineSorted,
    coverage,
    changelog,
    tombstones: [],
  };
}

export function stableHash(snapshot: DatasetSnapshot): string {
  return snapshot.manifest.snapshotHash;
}

export { sliceId, parseSummaryMetrics, sourceRef };
