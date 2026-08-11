"use client";

import { useState } from "react";
import { AlertTriangle, Check, Cloud, Copy, Loader2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ControlApiError, control, type NewAgentHost } from "@/lib/control-api";

/** Connecting a server, both ways.
 *
 * The two paths are presented as a genuine choice rather than a default and a fallback,
 * because they suit different customers: the agent is right for anything long-lived or behind
 * a firewall, SSH is right for a box nobody will install software on or a quick trial.
 *
 * The agent flow ends on a token shown exactly once. That is a real constraint of the backend
 * — only a hash is stored — so the UI has to make copying it feel deliberate rather than
 * incidental, and has to say plainly that it will not be shown again.
 */

type Mode = "choose" | "agent" | "ssh" | "enrolled";

export function AddHostDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [mode, setMode] = useState<Mode>("choose");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<NewAgentHost | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [port, setPort] = useState(22);
  const [authMethod, setAuthMethod] = useState<"password" | "private_key">("password");
  const [secret, setSecret] = useState("");

  async function createAgentHost() {
    setBusy(true);
    setError(null);
    try {
      setCreated(await control.addAgentHost(name.trim()));
      setMode("enrolled");
      onAdded();
    } catch (e) {
      setError(e instanceof ControlApiError ? e.message : "Could not create the host.");
    } finally {
      setBusy(false);
    }
  }

  async function createSshHost() {
    setBusy(true);
    setError(null);
    try {
      await control.addSshHost({
        name: name.trim(), address: address.trim(), username: username.trim(),
        port, auth_method: authMethod, secret,
      });
      onAdded();
      onClose();
    } catch (e) {
      setError(e instanceof ControlApiError ? e.message : "Could not add the host.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Connect a server"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-white/12 bg-[rgba(10,14,22,0.96)] p-6 backdrop-blur-2xl"
        style={{ boxShadow: "0 30px 80px -30px rgba(0,0,0,0.95)" }}
      >
        {mode === "choose" && (
          <>
            <h2 className="font-heading text-h4 font-semibold">Connect a server</h2>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-muted-foreground">
              Two ways in. Both give the same checks — they differ in who opens the connection.
            </p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => setMode("agent")}
                className="group rounded-[16px] border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-brand/50 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  <Cloud size={17} className="text-brand" />
                  <span className="font-heading text-[15px] font-semibold">Install the agent</span>
                  <span className="ml-auto rounded-full bg-brand-2/12 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-2">
                    Recommended
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground">
                  One command on the server. It only makes outbound connections, so it works
                  behind NAT and firewalls with no inbound port and no credentials held here.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("ssh")}
                className="group rounded-[16px] border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-brand/50 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  <Terminal size={17} className="text-brand" />
                  <span className="font-heading text-[15px] font-semibold">Connect over SSH</span>
                </div>
                <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground">
                  Nothing to install. We connect out to the host with credentials you store
                  here, encrypted at rest. Needs a network route in, plus python3 and psutil
                  on the target for full metrics.
                </p>
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </>
        )}

        {mode === "agent" && (
          <>
            <h2 className="font-heading text-h4 font-semibold">Name this server</h2>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              Something you will recognise in a list at 3am.
            </p>
            <div className="mt-5">
              <Label htmlFor="agent-name" className="mb-1.5 block text-[13px]">Display name</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="prod-db-01"
                autoFocus
              />
            </div>
            {error && <ErrorBox message={error} />}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode("choose")}>Back</Button>
              <Button
                onClick={createAgentHost}
                disabled={!name.trim() || busy}
                className="gap-1.5 bg-grad text-[#0c0f14] hover:brightness-110"
              >
                {busy ? <Loader2 className="animate-spin" size={15} /> : "Generate install command"}
              </Button>
            </div>
          </>
        )}

        {mode === "enrolled" && created && (
          <EnrolmentInstructions host={created} onDone={onClose} />
        )}

        {mode === "ssh" && (
          <>
            <h2 className="font-heading text-h4 font-semibold">SSH connection</h2>
            <div className="mt-5 grid gap-4">
              <div>
                <Label htmlFor="ssh-name" className="mb-1.5 block text-[13px]">Display name</Label>
                <Input id="ssh-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="web-02" autoFocus />
              </div>
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <div>
                  <Label htmlFor="ssh-addr" className="mb-1.5 block text-[13px]">Address</Label>
                  <Input id="ssh-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="10.0.1.24" />
                </div>
                <div>
                  <Label htmlFor="ssh-port" className="mb-1.5 block text-[13px]">Port</Label>
                  <Input id="ssh-port" type="number" value={port} onChange={(e) => setPort(Number(e.target.value) || 22)} />
                </div>
              </div>
              <div>
                <Label htmlFor="ssh-user" className="mb-1.5 block text-[13px]">Username</Label>
                <Input id="ssh-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ubuntu" autoComplete="off" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[13px]">Authentication</Label>
                <div className="flex gap-2">
                  {(["password", "private_key"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setAuthMethod(m); setSecret(""); }}
                      className={`rounded-[8px] border px-3 py-1.5 text-[13px] transition-colors ${
                        authMethod === m
                          ? "border-brand/60 bg-brand/12 text-foreground"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "password" ? "Password" : "Private key"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="ssh-secret" className="mb-1.5 block text-[13px]">
                  {authMethod === "password" ? "Password" : "Private key"}
                </Label>
                {authMethod === "password" ? (
                  <Input id="ssh-secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="new-password" />
                ) : (
                  <Textarea
                    id="ssh-secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    rows={5}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    className="font-mono text-[12px]"
                  />
                )}
                <p className="mt-1.5 text-[12px] text-faint">
                  Encrypted before storage and never returned by any read. Decrypted only in
                  memory, for the duration of a connection.
                </p>
              </div>
            </div>
            {error && <ErrorBox message={error} />}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode("choose")}>Back</Button>
              <Button
                onClick={createSshHost}
                disabled={!name.trim() || !address.trim() || !username.trim() || !secret || busy}
                className="gap-1.5 bg-grad text-[#0c0f14] hover:brightness-110"
              >
                {busy ? <Loader2 className="animate-spin" size={15} /> : "Add host"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="mt-4 flex gap-2 rounded-[12px] border border-crit/40 bg-crit-soft px-3.5 py-2.5 text-[13px] text-crit">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function EnrolmentInstructions({ host, onDone }: { host: NewAgentHost; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(host.install_command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the command is selectable on screen either way */
    }
  }

  return (
    <>
      <h2 className="font-heading text-h4 font-semibold">Run this on {host.name}</h2>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-muted-foreground">
        The agent will enrol itself and appear here as online within a few seconds.
      </p>

      <div className="mt-4 rounded-[12px] border border-white/10 bg-black/50 p-3.5">
        <code className="block overflow-x-auto whitespace-pre font-mono text-[12px] leading-[1.7] text-brand-2">
          {host.install_command}
        </code>
      </div>

      <Button onClick={copy} className="mt-3 w-full gap-2" variant="outline">
        {copied ? <Check size={15} className="text-ok" /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy command"}
      </Button>

      <div className="mt-4 flex gap-2 rounded-[12px] border border-warn/35 bg-warn/8 px-3.5 py-3 text-[12.5px] leading-[1.55] text-warn">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>
          This token is shown once and cannot be retrieved — only a hash of it is stored. It is
          single-use and expires in an hour. If you lose it, reissue a new one from the host.
        </span>
      </div>

      <p className="mt-4 text-[12.5px] leading-[1.6] text-faint">
        Requires Python 3.9+ with <code className="font-mono text-muted-foreground">psutil</code> and{" "}
        <code className="font-mono text-muted-foreground">httpx</code>, plus outbound HTTPS to
        this control plane. No inbound firewall rule is needed.
      </p>

      <div className="mt-5 flex justify-end">
        <Button onClick={onDone} className="bg-grad text-[#0c0f14] hover:brightness-110">Done</Button>
      </div>
    </>
  );
}
