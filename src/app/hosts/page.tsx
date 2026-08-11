"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Loader2, Plus, RefreshCw, Server, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/aurora/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { AddHostDialog } from "@/components/hosts/add-host-dialog";
import { ConnectionBadge, StatusPill, relativeTime } from "@/components/hosts/host-status";
import { useRequireSession } from "@/hooks/use-session";
import { ControlApiError, control, type CollectorStatus, type Host } from "@/lib/control-api";

/** The fleet inventory — every machine this organisation has connected.
 *
 * Polls while mounted. Enrolment is asynchronous by nature (the agent has to start, enrol and
 * check in), so a host that says "awaiting enrolment" has to become "online" without anyone
 * reaching for the refresh button, or the flow feels broken exactly when it is working.
 */
const POLL_MS = 6000;

export default function HostsPage() {
  const { status: sessionStatus } = useRequireSession();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [collector, setCollector] = useState<CollectorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Bumping this re-runs the effect below. The fetch lives inside the effect rather than in
  // a useCallback the effect calls, which is what the React Compiler's set-state-in-effect
  // rule wants — and the `active` guard it makes room for is worth having regardless, since
  // a poll landing after unmount would otherwise setState on a dead component.
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let active = true;

    async function fetchAll() {
      try {
        const [{ hosts: list }, coll] = await Promise.all([
          control.hosts(),
          control.collector().catch(() => null),
        ]);
        if (!active) return;
        setHosts(list);
        setCollector(coll);
        setError(null);
      } catch (e) {
        if (!active) return;
        if (e instanceof ControlApiError && e.isAuthError) return; // the guard is redirecting
        setError(e instanceof ControlApiError ? e.message : "Could not load hosts.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAll();
    const id = window.setInterval(fetchAll, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [sessionStatus, reloadKey]);

  async function testHost(id: string) {
    setTesting(id);
    try {
      await control.testHost(id);
      load();
    } finally {
      setTesting(null);
    }
  }

  async function removeHost(host: Host) {
    if (!window.confirm(`Remove "${host.name}"? Its history and metrics go with it.`)) return;
    try {
      await control.deleteHost(host.id);
      load();
    } catch (e) {
      setError(e instanceof ControlApiError ? e.message : "Could not remove the host.");
    }
  }

  // Not just "loading". An anonymous visitor is mid-redirect, and falling through to the
  // real markup meant the guarded page rendered in full — heading, empty state and all —
  // before the navigation landed. Anything short of authenticated shows the spinner.
  if (sessionStatus !== "authenticated") return <CentredSpinner />;

  return (
    <div>
      <PageHeader
        eyebrow="Fleet"
        title="Hosts"
        subtitle="Every server connected to this workspace. Agents reach out to us; SSH hosts we reach out to."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button onClick={() => setShowAdd(true)} className="gap-1.5 bg-grad text-[#0c0f14] hover:brightness-110">
          <Plus size={15} />
          Connect a server
        </Button>
        <Button variant="outline" onClick={load} className="gap-1.5">
          <RefreshCw size={14} />
          Refresh
        </Button>
        {collector && <CollectorChip collector={collector} />}
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-[12px] border border-crit/40 bg-crit-soft px-4 py-3 text-[13px] text-crit">
          {error}
        </div>
      )}

      {loading ? (
        <CentredSpinner />
      ) : hosts.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : (
        <div className="grid gap-3">
          {hosts.map((host, i) => (
            <motion.div
              key={host.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.04 }}
            >
              <HostRow
                host={host}
                testing={testing === host.id}
                onTest={() => testHost(host.id)}
                onRemove={() => removeHost(host)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {showAdd && <AddHostDialog onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}

function HostRow({
  host, testing, onTest, onRemove,
}: { host: Host; testing: boolean; onTest: () => void; onRemove: () => void }) {
  return (
    <div className="group rounded-[16px] border border-white/10 bg-[rgba(10,14,22,0.6)] p-4 backdrop-blur-xl transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-brand/40">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/hosts/${host.id}`}
              className="font-heading text-[15px] font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {host.name}
            </Link>
            <StatusPill status={host.status} />
            <ConnectionBadge type={host.connection_type} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11.5px] text-faint">
            {host.hostname && <span>{host.hostname}</span>}
            {host.os_family && <span>{host.os_family} {host.os_version}</span>}
            {host.address && <span>{host.address}</span>}
            {host.agent_version && <span>agent {host.agent_version}</span>}
            <span>seen {relativeTime(host.last_seen_at)}</span>
          </div>

          {host.status === "error" && host.last_error && (
            <p className="mt-2 text-[12.5px] leading-[1.5] text-crit">{host.last_error}</p>
          )}
          {host.status === "pending" && (
            <p className="mt-2 text-[12.5px] leading-[1.5] text-warn">
              Waiting for the agent to run its install command and check in.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onTest} disabled={testing} className="gap-1.5">
            {testing ? <Loader2 className="animate-spin" size={13} /> : <Activity size={13} />}
            Test
          </Button>
          {/* `buttonVariants` rather than a Button wrapping a Link: this Button is built on
              base-ui and has no `asChild`, so nesting an anchor inside it would render a link
              inside a <button> — invalid HTML, and keyboard activation stops working. */}
          <Link href={`/hosts/${host.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Open
          </Link>
          {host.connection_type !== "local" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label={`Remove ${host.name}`}
              className="text-faint hover:text-crit"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectorChip({ collector }: { collector: CollectorStatus }) {
  const healthy = collector.running && !collector.last_error;
  return (
    <span
      className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-muted-foreground"
      title={
        collector.last_error ??
        `Collecting every ${collector.interval_seconds}s · ${collector.cycles} cycles`
      }
    >
      <span className={`size-1.5 rounded-full ${healthy ? "bg-ok" : "bg-crit"}`} aria-hidden />
      {healthy
        ? `Collecting every ${collector.interval_seconds}s`
        : collector.enabled
          ? "Collector stopped"
          : "Collector disabled"}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center">
      <Server size={26} className="mx-auto text-faint" />
      <h2 className="mt-4 font-heading text-[17px] font-semibold">No servers connected yet</h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-[1.6] text-muted-foreground">
        Connect one and the agents can start checking it. Installing the agent takes a single
        command and needs no inbound firewall rule.
      </p>
      <Button onClick={onAdd} className="mt-5 gap-1.5 bg-grad text-[#0c0f14] hover:brightness-110">
        <Plus size={15} />
        Connect a server
      </Button>
    </div>
  );
}

function CentredSpinner() {
  return (
    <div className="grid place-items-center py-20">
      <Loader2 className="animate-spin text-brand" size={22} />
    </div>
  );
}
