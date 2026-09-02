export type AcceleratorAlias = {
  raw: string;
  slug: string;
  vendor: string;
  family: string;
  displayName: string;
};

const ALIASES: AcceleratorAlias[] = [
  { raw: "NVIDIA B200-SXM-180GB", slug: "nvidia-b200-sxm-180gb", vendor: "NVIDIA", family: "B200", displayName: "NVIDIA B200 SXM 180GB" },
  { raw: "NVIDIA B300-SXM-270GB", slug: "nvidia-b300-sxm-270gb", vendor: "NVIDIA", family: "B300", displayName: "NVIDIA B300 SXM 270GB" },
  { raw: "NVIDIA GB200", slug: "nvidia-gb200", vendor: "NVIDIA", family: "GB200", displayName: "NVIDIA GB200" },
  { raw: "NVIDIA GB300", slug: "nvidia-gb300", vendor: "NVIDIA", family: "GB300", displayName: "NVIDIA GB300" },
  { raw: "NVIDIA GB10", slug: "nvidia-gb10", vendor: "NVIDIA", family: "GB10", displayName: "NVIDIA GB10" },
  { raw: "NVIDIA H200-NVL-141GB", slug: "nvidia-h200-nvl-141gb", vendor: "NVIDIA", family: "H200", displayName: "NVIDIA H200 NVL 141GB" },
  { raw: "NVIDIA H200-SXM-141GB", slug: "nvidia-h200-sxm-141gb", vendor: "NVIDIA", family: "H200", displayName: "NVIDIA H200 SXM 141GB" },
  { raw: "NVIDIA L4-PCIe-24GB", slug: "nvidia-l4-pcie-24gb", vendor: "NVIDIA", family: "L4", displayName: "NVIDIA L4 PCIe 24GB" },
  { raw: "NVIDIA L40S", slug: "nvidia-l40s", vendor: "NVIDIA", family: "L40S", displayName: "NVIDIA L40S" },
  { raw: "NVIDIA RTX PRO 4500 Blackwell", slug: "nvidia-rtx-pro-4500-blackwell", vendor: "NVIDIA", family: "RTX-PRO-4500-Blackwell", displayName: "NVIDIA RTX PRO 4500 Blackwell" },
  { raw: "NVIDIA RTX PRO 6000 Blackwell Server Edition", slug: "nvidia-rtx-pro-6000-blackwell", vendor: "NVIDIA", family: "RTX-PRO-6000-Blackwell", displayName: "NVIDIA RTX PRO 6000 Blackwell Server Edition" },
  { raw: "NVIDIA GeForce RTX 4090", slug: "nvidia-geforce-rtx-4090", vendor: "NVIDIA", family: "GeForce-RTX-4090", displayName: "NVIDIA GeForce RTX 4090" },
  { raw: "NVIDIA GeForce GTX 1650 Ti", slug: "nvidia-geforce-gtx-1650-ti", vendor: "NVIDIA", family: "GeForce-GTX-1650-Ti", displayName: "NVIDIA GeForce GTX 1650 Ti" },
  { raw: "AMD Instinct MI300X 192GB HBM3", slug: "amd-instinct-mi300x", vendor: "AMD", family: "MI300X", displayName: "AMD Instinct MI300X 192GB" },
  { raw: "AMD Instinct MI325X 256GB HBM3e", slug: "amd-instinct-mi325x", vendor: "AMD", family: "MI325X", displayName: "AMD Instinct MI325X 256GB" },
  { raw: "AMD Instinct MI350X 288GB HBM3e", slug: "amd-instinct-mi350x", vendor: "AMD", family: "MI350X", displayName: "AMD Instinct MI350X 288GB" },
  { raw: "AMD Instinct MI355X 288GB HBM3e", slug: "amd-instinct-mi355x", vendor: "AMD", family: "MI355X", displayName: "AMD Instinct MI355X 288GB" },
  { raw: "AMD Instinct MI355X 288GB HBM3e (Power Cap 1000 W)", slug: "amd-instinct-mi355x-1000w", vendor: "AMD", family: "MI355X", displayName: "AMD Instinct MI355X 288GB (1000 W cap)" },
  { raw: "AMD Instinct MI355X 288GB HBM3e (x87)", slug: "amd-instinct-mi355x", vendor: "AMD", family: "MI355X", displayName: "AMD Instinct MI355X 288GB" },
  { raw: "AMD Instinct MI355X 288GB HBM3e (x94)", slug: "amd-instinct-mi355x", vendor: "AMD", family: "MI355X", displayName: "AMD Instinct MI355X 288GB" },
  { raw: "Intel(R) Arc Pro(R) B50", slug: "intel-arc-pro-b50", vendor: "Intel", family: "Arc-Pro-B50", displayName: "Intel Arc Pro B50" },
  { raw: "Intel(R) Arc Pro(R) B60", slug: "intel-arc-pro-b60", vendor: "Intel", family: "Arc-Pro-B60", displayName: "Intel Arc Pro B60" },
  { raw: "Intel(R) Arc Pro(R) B70", slug: "intel-arc-pro-b70", vendor: "Intel", family: "Arc-Pro-B70", displayName: "Intel Arc Pro B70" },
  { raw: "MS-Intel Arc Pro B60 Dual 48G Turbo", slug: "intel-arc-pro-b60-dual", vendor: "Intel", family: "Arc-Pro-B60", displayName: "Intel Arc Pro B60 Dual 48G Turbo" },
];

const BY_RAW = new Map(ALIASES.map((a) => [a.raw, a]));

export function resolveAlias(raw: string | undefined | null): AcceleratorAlias | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || /^n\/a$/i.test(trimmed)) return null;
  return BY_RAW.get(trimmed) ?? null;
}

export function reviewedAliases(): AcceleratorAlias[] {
  return ALIASES;
}
