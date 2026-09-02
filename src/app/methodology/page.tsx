export default function MethodologyPage() {
  return (
    <article className="prose-invert max-w-3xl space-y-6 text-[var(--ink)]">
      <h1 className="serif text-4xl">Methodology</h1>
      <p className="text-[var(--muted)]">
        This index is a normalized view of official MLPerf Inference v6.0 Closed-division submissions. It is not a
        vendor benchmark and it does not run hardware.
      </p>
      <h2 className="serif text-2xl">Systems versus chips</h2>
      <p>
        MLPerf publishes <em>submitted system</em> results. A system is a counted set of accelerators, hosts, software,
        and a measured scenario. A chip (accelerator) is identified from <code>accelerator_model_name</code> through a
        reviewed alias registry. Rankings default to the official system metric. A per-accelerator figure is shown only
        as a labelled derived value when <code>accelerators_per_node</code> and <code>number_of_nodes</code> are numeric
        in the system JSON. Names such as <code>x8</code> or <code>NVL72</code> are never used to infer count.
      </p>
      <h2 className="serif text-2xl">Official versus derived metrics</h2>
      <p>
        Official: the log value for the registered metric (tokens/s or samples/s) on a VALID run. Derived: official
        divided by established accelerator count, and only for metrics that allow derivation. Derived is never the
        default ranking key.
      </p>
      <h2 className="serif text-2xl">Scenarios and accuracy targets</h2>
      <p>
        V1 includes Offline, Server, and Interactive when present. Workloads: llama3.1-8b (including source directory
        llama3_1-8b), gpt-oss-120b, and deepseek-r1. Accuracy target is recorded as the Closed-division default 99%
        slice key. Results that are not VALID, or whose accelerator identity/count/metric/unit is ambiguous, are
        quarantined as review-required and excluded from rankings.
      </p>
      <h2 className="serif text-2xl">Comparability limits</h2>
      <ul className="list-disc space-y-2 pl-5 text-[var(--muted)]">
        <li>Never mix releases, divisions, workloads, scenarios, accuracy targets, metrics, or units.</li>
        <li>Open, Network, edge, vision, speech, training, and vendor marketing datasets are out of scope.</li>
        <li>Every published row carries a logical ID, content-version ID, and HTTPS source (repo, commit, path, URL, SHA-256).</li>
        <li>Ties share a rank; position stays sequential across pages.</li>
      </ul>
    </article>
  );
}
