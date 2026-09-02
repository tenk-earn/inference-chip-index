import Link from "next/link";
import { loadSnapshot } from "@/lib/dataset";
import { rankRows } from "@/lib/ranking";
import { ProvenanceBar } from "@/components/ProvenanceBar";
import { StateBanner } from "@/components/States";

type Search = {
  workload?: string;
  scenario?: string;
  accuracy?: string;
  submitter?: string;
  vendor?: string;
  metric?: string;
  view?: string;
  grouping?: string;
  slice?: string;
};

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const snapshot = loadSnapshot();
  const slices = snapshot.slices;
  const slice =
    slices.find((s) => s.sliceId === sp.slice) ??
    slices.find((s) =>
      (!sp.workload || s.workload === sp.workload) &&
      (!sp.scenario || s.scenario === sp.scenario) &&
      (!sp.accuracy || s.accuracyTarget === sp.accuracy) &&
      (!sp.metric || s.metricKey === sp.metric)
    ) ??
    slices.find((s) => s.workload === "llama3.1-8b" && s.scenario === "Offline" && s.metricKey === "tokens_per_second") ??
    slices[0];

  const invalid = Boolean(sp.slice && !snapshot.slices.some((s) => s.sliceId === sp.slice));
  const vendors = sp.vendor ? [sp.vendor] : undefined;
  const ranked = slice
    ? rankRows(snapshot, {
        sliceId: slice.sliceId,
        vendors,
        metricView: sp.view === "derived" ? "derived" : "official",
        grouping: sp.grouping === "best-per-accelerator" ? "best-per-accelerator" : "all-systems",
        pageSize: 50,
      })
    : { error: "No slices", code: "empty" };

  const rows = ranked && !("error" in ranked) ? ranked.rows.filter((r) => !sp.submitter || r.submitter === sp.submitter) : [];
  const submitters = [...new Set(snapshot.results.map((r) => r.submitter))].sort();
  const vendorList = [...new Set(snapshot.accelerators.map((a) => a.vendor))].sort();

  return (
    <div className="space-y-6">
      <h1 className="serif text-4xl">Leaderboard</h1>
      <p className="max-w-3xl text-[var(--muted)]">
        Release is fixed to v6.0 and division to Closed. Change workload, scenario, accuracy target, and metric to
        choose another exact comparison slice. Official submitted-system results rank by default.
      </p>
      <ProvenanceBar manifest={snapshot.manifest} />
      {snapshot.manifest.freshness === "stale" ? (
        <StateBanner tone="warn" title="Stale data">
          This snapshot is older than 30 days. Re-run the documented full-source importer before relying on rankings.
        </StateBanner>
      ) : null}
      {invalid ? (
        <StateBanner tone="danger" title="Invalid filters">
          Slice ID <span className="num">{sp.slice}</span> is not in this dataset version.
        </StateBanner>
      ) : null}

      <form className="grid gap-3 border border-[var(--line)] p-4 text-sm md:grid-cols-4" method="get">
        <label>Workload
          <select name="workload" defaultValue={slice?.workload} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            {["llama3.1-8b", "gpt-oss-120b", "deepseek-r1"].map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label>Scenario
          <select name="scenario" defaultValue={slice?.scenario} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            {["Offline", "Server", "Interactive"].map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label>Accuracy target
          <select name="accuracy" defaultValue={slice?.accuracyTarget ?? "99"} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            <option value="99">99%</option>
          </select>
        </label>
        <label>Metric
          <select name="metric" defaultValue={slice?.metricKey} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            {["tokens_per_second", "completed_tokens_per_second", "samples_per_second", "completed_samples_per_second"].map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label>Submitter
          <select name="submitter" defaultValue={sp.submitter ?? ""} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            <option value="">All</option>
            {submitters.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label>Vendor
          <select name="vendor" defaultValue={sp.vendor ?? ""} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            <option value="">All</option>
            {vendorList.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label>Metric view
          <select name="view" defaultValue={sp.view ?? "official"} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            <option value="official">Official system result</option>
            <option value="derived">Derived per accelerator</option>
          </select>
        </label>
        <label>Grouping
          <select name="grouping" defaultValue={sp.grouping ?? "all-systems"} className="mt-1 w-full bg-[var(--bg-elev)] p-2">
            <option value="all-systems">All systems</option>
            <option value="best-per-accelerator">Best per accelerator</option>
          </select>
        </label>
        <div className="md:col-span-4">
          <button className="bg-[var(--ink)] px-4 py-2 text-[var(--bg)]" type="submit">Apply slice</button>
        </div>
      </form>

      {slice ? (
        <p className="text-sm text-[var(--muted)]">
          <span className="text-[var(--ink)]">Slice</span> {slice.sliceId}
          <br />
          {slice.comparability}
        </p>
      ) : null}

      {"error" in ranked ? (
        <StateBanner tone="warn" title="No comparable results">{ranked.error}</StateBanner>
      ) : rows.length === 0 ? (
        <StateBanner tone="warn" title="No comparable results">
          Nothing in this exact slice matches the current filters.
        </StateBanner>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <caption className="sr-only">Official MLPerf rankings for the selected comparison slice</caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Pos</th>
                <th scope="col">Accelerator</th>
                <th scope="col">Vendor / family</th>
                <th scope="col">Submitter / system</th>
                <th scope="col">Official</th>
                <th scope="col">Derived /acc</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.logicalId}>
                  <td className="num">{row.rank}</td>
                  <td className="num">{row.position}</td>
                  <td>{row.acceleratorDisplayName}</td>
                  <td className="text-sm">{row.acceleratorVendor} · {row.acceleratorFamily}</td>
                  <td className="text-sm text-[var(--muted)]">{row.submitter}<br />{row.systemName}</td>
                  <td className="num">{row.officialValue.toLocaleString()} {row.unit}</td>
                  <td className="num">{row.derivedPerAccelerator == null ? "—" : row.derivedPerAccelerator.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td><a className="text-xs text-[var(--accent)]" href={row.source.url}>commit path</a></td>
                </tr>
              ))}
            </tbody>
          </table>
          {sp.view === "derived" ? (
            <StateBanner tone="muted" title="Derived values are not the ranking default">
              Per-accelerator throughput is official system result divided by established accelerator count. It is labelled derived and is never inferred from names such as x8 or NVL72.
            </StateBanner>
          ) : null}
        </div>
      )}
      <p className="text-sm text-[var(--muted)]">
        Partial evidence and quarantined rows are excluded from rankings. See the <Link href="/updates" className="underline">updates</Link> report.
      </p>
    </div>
  );
}
