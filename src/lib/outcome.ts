export type Severity = "ok" | "warn" | "crit";

export type Outcome = {
  severity: Severity;
  label: string;
};

/**
 * The backend returns free-form LLM prose, not a structured status code.
 * This scans for the same signals a human skimming the report would: explicit
 * error/warning counts first, then risk language, then a healthy default.
 */
export function inferOutcome(report: string): Outcome {
  const text = report.toLowerCase();

  const errorMatch = text.match(/(\d+)\s+errors?/);
  if (errorMatch && Number(errorMatch[1]) > 0) {
    return { severity: "crit", label: `${errorMatch[1]} error${errorMatch[1] === "1" ? "" : "s"}` };
  }
  if (text.includes("critical") || text.includes("at risk")) {
    return { severity: "crit", label: text.includes("at risk") ? "At risk" : "Critical" };
  }

  const warnMatch = text.match(/(\d+)\s+warnings?/);
  if (warnMatch && Number(warnMatch[1]) > 0) {
    return { severity: "warn", label: "Advisory" };
  }
  if (
    text.includes("partially resolved") ||
    text.includes("partial") ||
    text.includes("nearing") ||
    text.includes("watch") ||
    text.includes("warning") ||
    text.includes("advisory")
  ) {
    return { severity: "warn", label: "Advisory" };
  }

  if (text.includes("protected")) return { severity: "ok", label: "Protected" };
  if (text.includes("healthy")) return { severity: "ok", label: "Healthy" };
  if (text.includes("resolved")) return { severity: "ok", label: "Resolved" };
  return { severity: "ok", label: "Healthy" };
}
