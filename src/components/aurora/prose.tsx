import { Fragment } from "react";

function renderInline(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Minimal rendering for LLM prose: paragraph breaks + **bold** spans, no full markdown parser. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className="mb-3 last:mb-0">
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}
