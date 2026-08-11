/** The working pages' header.
 *
 * Shares SectionHeading's grammar — an accent eyebrow in mono caps, then the title, then a
 * muted sub — but left-aligned, because these are tools rather than landing-page chapters.
 * What matters is that the *sizes come off the scale*: it used to set 28/30px titles and a
 * 14.5px sub, none of which the scale names, and that mismatch is a large part of why the
 * app pages read as a slightly different product from the landing page.
 *
 * The title stays solid rather than taking the shimmer. The gradient is tuned for centred
 * headings; left-aligned and short, it fades a two-word page title into grey by its second
 * word, which reads as a rendering fault rather than as a flourish.
 */
export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <div className="mb-3 font-mono text-[12px] font-medium uppercase tracking-[0.22em] text-brand">{eyebrow}</div>
      <h1
        className="font-heading font-bold text-foreground"
        style={{ fontSize: "var(--text-h3)", lineHeight: 1.12, letterSpacing: "-0.02em" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-[64ch] text-body leading-[1.6] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
