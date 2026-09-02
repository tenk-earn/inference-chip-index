import Link from "next/link";

const links = [
  ["Leaderboard", "/leaderboard"],
  ["Methodology", "/methodology"],
  ["API", "/api"],
  ["Updates", "/updates"],
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="serif text-lg tracking-tight">
          Inference Chip Index
        </Link>
        <nav className="flex gap-5 text-sm text-[var(--muted)]">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-[var(--ink)]">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
