import type { DatasetManifest } from "@/pipeline/types";

export function ProvenanceBar({ manifest }: { manifest: DatasetManifest }) {
  return (
    <section className="grid gap-3 border border-[var(--line)] bg-[var(--bg-elev)] p-4 text-sm md:grid-cols-5" aria-label="Dataset provenance">
      <div>
        <div className="text-[0.68rem] uppercase tracking-wider text-[var(--muted)]">Release</div>
        <div>MLPerf Inference {manifest.release} · {manifest.division}</div>
      </div>
      <div>
        <div className="text-[0.68rem] uppercase tracking-wider text-[var(--muted)]">Source commit</div>
        <a className="num text-[var(--accent)]" href={`${manifest.sourceRepository}/tree/${manifest.sourceCommit}`}>
          {manifest.sourceCommit.slice(0, 12)}
        </a>
      </div>
      <div>
        <div className="text-[0.68rem] uppercase tracking-wider text-[var(--muted)]">Last reviewed</div>
        <div className="num">{manifest.lastReviewedAt.replace("T", " ").replace(".000Z", " UTC")}</div>
      </div>
      <div>
        <div className="text-[0.68rem] uppercase tracking-wider text-[var(--muted)]">Freshness</div>
        <div>{manifest.freshness === "fresh" ? "Fresh" : "Stale"} ({manifest.mode})</div>
      </div>
      <div>
        <div className="text-[0.68rem] uppercase tracking-wider text-[var(--muted)]">Records</div>
        <div className="num">{manifest.counts.acceptedResults} accepted / {manifest.counts.results} parsed · {manifest.counts.slices} slices</div>
      </div>
    </section>
  );
}
