import { mkdirSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ingestTree } from "../src/pipeline/parser";
import { canonicalStringify, sha256 } from "../src/pipeline/canonical";
import type { DatasetSnapshot } from "../src/pipeline/types";

const REVIEWED = "2026-09-02T00:00:00.000Z";

function atomicWrite(path: string, contents: string) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, contents);
  renameSync(tmp, path);
}

function writeSnapshot(snapshot: DatasetSnapshot, outDir: string) {
  mkdirSync(outDir, { recursive: true });
  atomicWrite(join(outDir, "snapshot.json"), canonicalStringify(snapshot));
  atomicWrite(join(outDir, "manifest.json"), canonicalStringify(snapshot.manifest));
  atomicWrite(join(outDir, "quarantine.json"), canonicalStringify(snapshot.quarantine));
  atomicWrite(join(outDir, "coverage.json"), canonicalStringify(snapshot.coverage));
  atomicWrite(join(outDir, "changelog.json"), canonicalStringify(snapshot.changelog));
  atomicWrite(join(outDir, "tombstones.json"), canonicalStringify(snapshot.tombstones));
  atomicWrite(join(outDir, "HASH"), `${snapshot.manifest.snapshotHash}\n`);
}

function run(mode: "fixture" | "full-source") {
  const root = resolve(
    mode === "fixture" ? "data/fixtures" : "data/mlperf-v6.0",
  );
  if (!existsSync(root)) {
    throw new Error(`Source root missing: ${root}`);
  }
  const snapshot = ingestTree({
    root,
    mode,
    generatedAt: REVIEWED,
    lastReviewedAt: REVIEWED,
  });
  const outDir = mode === "fixture" ? "data/generated/fixture" : "data/generated/full";
  writeSnapshot(snapshot, outDir);
  if (mode === "full-source") {
    writeSnapshot(snapshot, "data/generated");
    writeSnapshot(snapshot, "src/data/generated");
  }
  console.log(`${mode} hash ${snapshot.manifest.snapshotHash}`);
  console.log(`accepted ${snapshot.manifest.counts.acceptedResults} / ${snapshot.manifest.counts.results} results`);
  console.log(`slices ${snapshot.manifest.counts.slices}`);
  const llama = snapshot.slices.find((s) => s.sliceId.includes("llama3.1-8b|Offline|99|tokens_per_second"));
  if (llama) console.log(`llama offline tokens slice accepted=${llama.acceptedCount} id=${llama.sliceId}`);
}

const mode = (process.argv[2] as "fixture" | "full-source" | "both") ?? "both";
if (mode === "both") {
  run("fixture");
  run("full-source");
} else {
  run(mode);
}
