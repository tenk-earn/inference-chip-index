export function StateBanner({
  tone = "muted",
  title,
  children,
}: {
  tone?: "muted" | "warn" | "ok" | "danger";
  title: string;
  children?: React.ReactNode;
}) {
  const color =
    tone === "ok" ? "var(--ok)" : tone === "danger" ? "var(--danger)" : tone === "warn" ? "var(--accent)" : "var(--muted)";
  return (
    <div className="my-4 border border-[var(--line)] bg-[var(--bg-elev)] px-4 py-3" role="status">
      <div className="text-sm font-medium" style={{ color }}>{title}</div>
      {children ? <div className="mt-1 text-sm text-[var(--muted)]">{children}</div> : null}
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="animate-pulse space-y-2" aria-busy="true" aria-live="polite">
      <div className="h-8 bg-[var(--bg-elev)]" />
      <div className="h-8 bg-[var(--bg-elev)] opacity-80" />
      <div className="h-8 bg-[var(--bg-elev)] opacity-60" />
    </div>
  );
}
