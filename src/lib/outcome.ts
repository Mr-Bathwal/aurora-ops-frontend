export type Severity = "ok" | "warn" | "crit";

export type Outcome = {
  severity: Severity;
  label: string;
};

const NEGATION = /\b(not|no|never|isn'?t|wasn'?t|cannot|can'?t|couldn'?t|failed|unable|without)\b/;

/** True when `term` appears in `text` but is negated by something shortly before it.
 *
 * Written for one specific miss: a supervisor report ending "the issue appears not to be
 * resolved" was scoring **Resolved**, in green, at the top of the workflow chart — the
 * loudest possible way to say the opposite of what the agent wrote. A plain `includes` cannot
 * see the "not" four words upstream; a window can. */
function negated(text: string, term: string, window = 44): boolean {
  const i = text.indexOf(term);
  if (i === -1) return false;
  return NEGATION.test(text.slice(Math.max(0, i - window), i));
}

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

  // Explicitly-denied resolution outranks every positive word later in the same report.
  if (text.includes("unresolved") || negated(text, "resolved")) {
    return { severity: "warn", label: "Unresolved" };
  }

  // A run that fell over mid-way has not earned a verdict either way. This is the shape a
  // failed tool call takes by the time the supervisor has written it up.
  if (
    text.includes("incomplete") ||
    text.includes("error code") ||
    text.includes("was not possible") ||
    text.includes("could not be completed") ||
    text.includes("prevented a complete") ||
    // The exact wording `agents.py` returns when a run throws. Without it, "the agent hit an
    // error mid-run and couldn't finish" scored **Healthy**, in green — a failed run
    // presented as a clean bill of health.
    text.includes("hit an error mid-run") ||
    text.includes("couldn't finish") ||
    text.includes("could not finish")
  ) {
    return { severity: "warn", label: "Incomplete" };
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
