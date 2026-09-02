import { LoadingTable } from "@/components/States";

export default function Loading() {
  return (
    <div>
      <p className="mb-3 text-sm text-[var(--muted)]">Loading verified results…</p>
      <LoadingTable />
    </div>
  );
}
