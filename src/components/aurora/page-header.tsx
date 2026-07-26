export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-grad">{eyebrow}</div>
      <h1 className="font-heading text-[28px] font-semibold leading-[1.08] tracking-tight sm:text-[30px]">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-[64ch] text-[14.5px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
