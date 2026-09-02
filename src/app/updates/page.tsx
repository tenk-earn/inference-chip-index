import { loadSnapshot } from "@/lib/dataset";
import { ProvenanceBar } from "@/components/ProvenanceBar";
import { StateBanner } from "@/components/States";

export default function UpdatesPage() {
  const snapshot = loadSnapshot();
  return (
    <div className="space-y-6">
      <h1 className="serif text-4xl">Updates</h1>
      <ProvenanceBar manifest={snapshot.manifest} />
      <section>
        <h2 className="serif text-2xl">Changelog</h2>
        <p className="text-[var(--muted)]">{snapshot.changelog.summary}</p>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {snapshot.changelog.entries.map((e) => <li key={e}>{e}</li>)}
        </ul>
        <p className="mt-2 num text-xs text-[var(--muted)]">snapshot {snapshot.manifest.snapshotHash}</p>
      </section>
      <section>
        <h2 className="serif text-2xl">Coverage matrix</h2>
        <table>
          <caption className="sr-only">Accepted versus quarantined results by vendor, family, and workload</caption>
          <thead>
            <tr><th>Vendor</th><th>Family</th><th>Workload</th><th>Accepted</th><th>Quarantined</th></tr>
          </thead>
          <tbody>
            {snapshot.coverage.map((c) => (
              <tr key={`${c.vendor}-${c.family}-${c.workload}`}>
                <td>{c.vendor}</td>
                <td>{c.family}</td>
                <td className="num">{c.workload}</td>
                <td className="num">{c.accepted}</td>
                <td className="num">{c.quarantined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="serif text-2xl">Quarantine (first 25)</h2>
        <StateBanner tone="muted" title="Partial evidence">
          Review-required rows are excluded from rankings until accelerator identity, count, metric, unit, and validity are established.
        </StateBanner>
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          {snapshot.quarantine.slice(0, 25).map((q, i) => (
            <li key={`${q.path}-${i}`}>
              <span className="text-[var(--ink)]">{q.kind}</span> {q.reasons.join(", ")}
              <div className="num text-xs">{q.path}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
