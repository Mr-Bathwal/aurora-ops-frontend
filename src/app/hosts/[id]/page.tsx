"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Play, RefreshCw, Save, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectionBadge, StatusPill, relativeTime } from "@/components/hosts/host-status";
import { useRequireSession } from "@/hooks/use-session";
import {
  ControlApiError, control,
  type Anomaly, type Evaluation, type Host, type Snapshot, type Thresholds, type Trend,
} from "@/lib/control-api";

/** One host: what it is doing now, what it has been doing, and what "normal" means for it.
 *
 * Metrics and trends load without an LLM anywhere in the path — they come from the structured
 * snapshot and the stored history, so this page is fast, deterministic and free to refresh.
 * The AI health check is a deliberate, explicit action, because it costs a model call and
 * takes tens of seconds.
 */
export default function HostDetailPage() {
  const params = useParams<{ id: string }>();
  const hostId = params?.id;
  const { status: sessionStatus } = useRequireSession();

  const [host, setHost] = useState<Host | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [trends, setTrends] = useState<Record<string, Trend> | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [report, setReport] = useState<{ report: string; severity: string } | null>(null);
  const [running, setRunning] = useState(false);

  // Same shape as the hosts list: the fetch lives inside the effect, `reloadKey` re-runs it,
  // and `active` stops a late response writing to an unmounted component.
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !hostId) return;
    let active = true;

    async function fetchAll() {
      try {
        const h = await control.host(hostId!);
        if (!active) return;
        setHost(h);
        // Render as soon as the host itself is known. Identity and status come back in about
        // a hundred milliseconds; a snapshot through an agent is a queued job and takes ten
        // seconds or more. Holding the whole page for the slow one meant a blank screen while
        // the name, status and last-seen time were already in hand.
        setLoading(false);
        setMetricsLoading(true);
        // Settled, not all-or-nothing: a host that is unreachable still has a name, a status
        // and stored history worth showing. Failing the whole page because the live snapshot
        // timed out would hide exactly the information needed to diagnose why.
        const [snap, tr] = await Promise.allSettled([
          control.snapshot(hostId!),
          control.trends(hostId!, 24),
        ]);
        if (!active) return;
        setSnapshot(snap.status === "fulfilled" ? snap.value : null);
        if (tr.status === "fulfilled") {
          setTrends(tr.value.trends);
          setAnomalies(tr.value.anomalies);
          setThresholds(tr.value.thresholds);
        }
        setError(
          snap.status === "rejected"
            ? snap.reason instanceof ControlApiError
              ? snap.reason.message
              : "Could not reach this host."
            : null
        );
      } catch (e) {
        if (!active) return;
        if (e instanceof ControlApiError && e.isAuthError) return;
        setError(e instanceof ControlApiError ? e.message : "Could not load this host.");
      } finally {
        if (active) {
          setLoading(false);
          setMetricsLoading(false);
          setRefreshing(false);
        }
      }
    }

    fetchAll();
    return () => {
      active = false;
    };
  }, [sessionStatus, hostId, reloadKey]);

  async function runHealthCheck() {
    if (!hostId) return;
    setRunning(true);
    setReport(null);
    try {
      const r = await control.healthCheck(hostId);
      setReport({ report: r.report, severity: r.severity });
    } catch (e) {
      setReport({
        report: e instanceof ControlApiError ? e.message : "The health check failed.",
        severity: "unknown",
      });
    } finally {
      setRunning(false);
    }
  }

  // `!== "authenticated"` rather than `=== "loading"`: an anonymous visitor is mid-redirect
  // and must not be shown the page they are being redirected away from.
  if (sessionStatus !== "authenticated" || loading) {
    return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-brand" size={22} /></div>;
  }
  if (!host) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">{error ?? "Host not found."}</p>
        <Link href="/hosts" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          Back to hosts
        </Link>
      </div>
    );
  }

  const evaluation = snapshot?.evaluation as Evaluation | undefined;

  return (
    <div>
      <Link href="/hosts" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        All hosts
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-h3 font-bold tracking-tight">{host.name}</h1>
            <StatusPill status={host.status} />
            <ConnectionBadge type={host.connection_type} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11.5px] text-faint">
            {host.hostname && <span>{host.hostname}</span>}
            {host.os_family && <span>{host.os_family} {host.os_version}</span>}
            <span>seen {relativeTime(host.last_seen_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setRefreshing(true); load(); }} disabled={refreshing} className="gap-1.5">
            {refreshing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            Refresh
          </Button>
          <Button onClick={runHealthCheck} disabled={running} className="gap-1.5 bg-grad text-[#0c0f14] hover:brightness-110">
            {running ? <Loader2 className="animate-spin" size={15} /> : <Play size={14} />}
            {running ? "Checking…" : "Run health check"}
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-[12px] border border-crit/40 bg-crit-soft px-4 py-3 text-[13px] text-crit">
          {error}
        </div>
      )}

      {evaluation && <VerdictBanner evaluation={evaluation} />}

      {!snapshot && metricsLoading && (
        <div className="mb-5 flex items-center gap-2.5 rounded-[16px] border border-white/10 bg-[rgba(10,14,22,0.6)] px-4 py-5 text-[13px] text-muted-foreground">
          <Loader2 className="animate-spin text-brand" size={15} />
          Collecting live metrics from this host…
        </div>
      )}

      {snapshot && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="CPU" snapshot={snapshot} probe="cpu" trend={trends?.cpu} thresholds={thresholds} />
          <MetricTile label="Memory" snapshot={snapshot} probe="memory" trend={trends?.memory} thresholds={thresholds} />
          <MetricTile label="Disk" snapshot={snapshot} probe="disk" trend={trends?.disk} thresholds={thresholds} />
          <MetricTile label="Swap" snapshot={snapshot} probe="swap" trend={trends?.swap} thresholds={thresholds} />
        </div>
      )}

      {anomalies.length > 0 && (
        <section className="mb-5 rounded-[16px] border border-warn/35 bg-warn/8 p-4">
          <h2 className="font-heading text-[15px] font-semibold text-warn">Trend findings</h2>
          <ul className="mt-2.5 space-y-1.5">
            {anomalies.map((a, i) => (
              <li key={i} className="text-[13px] leading-[1.55] text-muted-foreground">
                <span className="mr-2 font-mono text-[11px] uppercase text-warn">{a.level}</span>
                {a.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ReportPanel report={report} running={running} />
        <ThresholdPanel
          key={thresholds ? `${thresholds.warn}-${thresholds.crit}` : "pending"}
          hostId={host.id}
          thresholds={thresholds}
          onSaved={setThresholds}
        />
      </div>
    </div>
  );
}

function VerdictBanner({ evaluation }: { evaluation: Evaluation }) {
  const tone =
    evaluation.overall_status === "CRITICAL"
      ? { border: "border-crit/40", bg: "bg-crit-soft", text: "text-crit" }
      : evaluation.overall_status === "WARNING"
        ? { border: "border-warn/35", bg: "bg-warn/8", text: "text-warn" }
        : { border: "border-ok/30", bg: "bg-ok-soft", text: "text-ok" };
  const notable = evaluation.findings.filter((f) => f.level !== "OK");

  return (
    <div className={`mb-5 rounded-[16px] border ${tone.border} ${tone.bg} p-4`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={`font-heading text-[16px] font-bold ${tone.text}`}>{evaluation.overall_status}</span>
        <span className="text-[13px] text-muted-foreground">
          {notable.length === 0
            ? "No thresholds breached."
            : `${notable.length} finding${notable.length === 1 ? "" : "s"} needing attention.`}
        </span>
      </div>
      {notable.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {notable.map((f) => (
            <li key={f.metric} className="text-[13px] text-muted-foreground">
              <span className={`mr-2 font-mono text-[11px] uppercase ${tone.text}`}>{f.level}</span>
              {f.label}: <span className="tabular-nums text-foreground">{String(f.value)}</span>
            </li>
          ))}
        </ul>
      )}
      {evaluation.checks_unavailable?.length > 0 && (
        <p className="mt-2.5 text-[12px] text-faint">
          Could not run: {evaluation.checks_unavailable.join(", ")} — not counted as passing.
        </p>
      )}
    </div>
  );
}

function MetricTile({
  label, snapshot, probe, trend, thresholds,
}: {
  label: string; snapshot: Snapshot; probe: string;
  trend?: Trend; thresholds: Thresholds | null;
}) {
  const block = snapshot[probe] as Record<string, unknown> | undefined;
  const value = typeof block?.percent === "number" ? block.percent : null;
  const warn = thresholds?.warn ?? 85;
  const crit = thresholds?.crit ?? 95;

  const tone =
    value === null ? "text-faint"
      : value >= crit ? "text-crit"
        : value >= warn ? "text-warn"
          : "text-foreground";

  const TrendIcon =
    trend?.direction === "rising" ? TrendingUp
      : trend?.direction === "falling" ? TrendingDown
        : Minus;

  return (
    <div className="rounded-[16px] border border-white/10 bg-[rgba(10,14,22,0.6)] p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        {trend?.sufficient_data && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[10.5px] text-faint"
            title={`${trend.direction} · ${trend.change! > 0 ? "+" : ""}${trend.change}% over ${trend.window_hours}h`}
          >
            <TrendIcon size={12} />
            {trend.direction}
          </span>
        )}
      </div>
      <div className={`mt-2 font-heading text-[26px] font-bold leading-none tabular-nums ${tone}`}>
        {value === null ? "—" : `${value}%`}
      </div>
      {trend?.sufficient_data ? (
        <div className="mt-2 font-mono text-[10.5px] text-faint">
          avg {trend.avg}% · peak {trend.max}% · {trend.samples} readings
        </div>
      ) : (
        <div className="mt-2 font-mono text-[10.5px] text-faint">building baseline…</div>
      )}
    </div>
  );
}

function ReportPanel({ report, running }: { report: { report: string; severity: string } | null; running: boolean }) {
  return (
    <section className="rounded-[16px] border border-white/10 bg-[rgba(10,14,22,0.6)] p-5 backdrop-blur-xl">
      <h2 className="font-heading text-[15px] font-semibold">AI health report</h2>
      {!report && !running && (
        <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
          The metrics above are read directly from the host — no model involved. Run a health
          check when you want the agent to investigate and explain, including the posture
          checks a resource graph cannot show.
        </p>
      )}
      {running && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="animate-spin text-brand" size={14} />
          Collecting metrics and posture checks, then writing the report…
        </p>
      )}
      {report && (
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.65] text-muted-foreground">
          {report.report}
        </pre>
      )}
    </section>
  );
}

/** Note the `key` at the call site. The fields are initialised from props and then owned by
 *  the user, which is exactly the case an effect syncing props into state handles badly — it
 *  would overwrite half-typed input every time the parent refetched. Remounting on a changed
 *  threshold is both simpler and correct. */
function ThresholdPanel({
  hostId, thresholds, onSaved,
}: { hostId: string; thresholds: Thresholds | null; onSaved: (t: Thresholds) => void }) {
  const [warn, setWarn] = useState(thresholds ? String(thresholds.warn) : "");
  const [crit, setCrit] = useState(thresholds ? String(thresholds.crit) : "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      onSaved(await control.setThresholds(hostId, Number(warn), Number(crit)));
      setMessage("Saved.");
    } catch (e) {
      setMessage(e instanceof ControlApiError ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[16px] border border-white/10 bg-[rgba(10,14,22,0.6)] p-5 backdrop-blur-xl">
      <h2 className="font-heading text-[15px] font-semibold">Thresholds</h2>
      <p className="mt-2 text-[12.5px] leading-[1.55] text-muted-foreground">
        A database server idling at 90% memory is doing its job. A web server at 90% is about
        to fall over. Set what counts as trouble for this host.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="warn" className="mb-1.5 block text-[12px]">Warning %</Label>
          <Input id="warn" type="number" value={warn} onChange={(e) => setWarn(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="crit" className="mb-1.5 block text-[12px]">Critical %</Label>
          <Input id="crit" type="number" value={crit} onChange={(e) => setCrit(e.target.value)} />
        </div>
      </div>
      <Button onClick={save} disabled={busy} variant="outline" className="mt-3 w-full gap-1.5">
        {busy ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
        Save thresholds
      </Button>
      {message && <p className="mt-2 text-[12px] text-muted-foreground">{message}</p>}
      {thresholds && !thresholds.customised && (
        <p className="mt-2 text-[11.5px] text-faint">Currently using the workspace defaults.</p>
      )}
    </section>
  );
}
