import Link from "next/link";
import { loadSnapshot, defaultSliceId } from "@/lib/dataset";
import { rankRows } from "@/lib/ranking";
import { ProvenanceBar } from "@/components/ProvenanceBar";

export default function HomePage() {
  const snapshot = loadSnapshot();
  const sliceId = defaultSliceId(snapshot);
  const preview = sliceId ? rankRows(snapshot, { sliceId, pageSize: 5 }) : null;
  const previewRows = preview && !("error" in preview) ? preview.rows : [];

  return (
    <div className="space-y-12">
      <section className="max-w-3xl space-y-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">MLPerf Inference v6.0 · Closed</p>
        <h1 className="serif text-5xl leading-[1.1] tracking-tight md:text-6xl">
          Find the fastest verified inference hardware for your workload.
        </h1>
        <p className="text-lg text-[var(--muted)]">
          There is no universally fastest chip. This index ranks official submitted-system results for one exact
          benchmark slice: the same release, division, workload, scenario, accuracy target, metric, and unit.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/leaderboard" className="bg-[var(--ink)] px-4 py-2 text-sm text-[var(--bg)]">
            Open leaderboard
          </Link>
          <Link href="/methodology" className="border border-[var(--line)] px-4 py-2 text-sm">
            Read methodology
          </Link>
          <Link href="/api" className="border border-[var(--line)] px-4 py-2 text-sm">
            Lucid Agents API
          </Link>
        </div>
      </section>

      <ProvenanceBar manifest={snapshot.manifest} />

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="serif text-2xl">Default verified slice</h2>
          <p className="text-sm text-[var(--muted)]">{sliceId}</p>
        </div>
        {previewRows.length === 0 ? (
          <p className="text-[var(--muted)]">No comparable results in the default slice.</p>
        ) : (
          <table>
            <caption className="sr-only">Preview of official system throughput for the default llama3.1-8b Offline slice</caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Accelerator</th>
                <th scope="col">System</th>
                <th scope="col">Official tok/s</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={row.logicalId}>
                  <td className="num">{row.rank}</td>
                  <td>{row.acceleratorDisplayName}</td>
                  <td className="text-sm text-[var(--muted)]">{row.submitter} · {row.systemName}</td>
                  <td className="num">{row.officialValue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
