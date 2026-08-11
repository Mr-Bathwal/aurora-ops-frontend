"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkyBackdrop } from "@/components/aurora/sky-backdrop";
import { ControlApiError, control } from "@/lib/control-api";
import { useSession } from "@/hooks/use-session";

/** Sign in / create an account.
 *
 * One page, two modes. A separate /signup route would duplicate the whole form to change a
 * heading and one field, and the two are close enough that toggling between them in place is
 * both less code and a better experience for anyone who lands on the wrong one.
 */
export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Someone already signed in has no business on this page.
  useEffect(() => {
    if (status === "authenticated") router.replace("/hosts");
  }, [status, router]);

  /** Takes an optional event because it is wired to two things: the form's `onSubmit`, so the
   *  Enter key works from either field, and the button's `onClick`.
   *
   *  Both are needed. The `Button` here is base-ui's, which does not participate in native
   *  form submission — a `type="submit"` inside the form renders correctly, enables
   *  correctly, and then does nothing at all when clicked. Every other page in this codebase
   *  uses `onClick` for exactly that reason; this is the first form, so it is the first place
   *  the gap shows up. */
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await control.signup(email, password, orgName);
      } else {
        await control.login(email, password);
      }
      // A full navigation rather than router.push: every guarded page reads the session on
      // mount, and a client-side transition can render them before the cookie has settled.
      window.location.href = "/hosts";
    } catch (err) {
      setError(err instanceof ControlApiError ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= (mode === "signup" ? 8 : 1) &&
    !busy;

  return (
    <div className="flex min-h-[calc(100vh-13rem)] items-center justify-center px-4">
      {/* The card below is glass — translucent fill, `backdrop-blur-2xl` — and was drawn that
          way from the start, so it needs something behind it to be glass *over*. Without this
          it sat on flat black and the blur had nothing to do. Scrimmed hard and centred: the
          form is dead in the middle of the viewport and is the only thing on the page. */}
      <SkyBackdrop
        src="/media/images/hero/constellation-field.webp"
        opacity={0.42}
        scrim="radial-gradient(46% 44% at 50% 46%, rgba(3,5,7,0.88), rgba(3,5,7,0.42) 64%, transparent 100%)"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="mb-7 text-center">
          <div className="mb-3 font-mono text-[12px] font-medium uppercase tracking-[0.22em] text-brand">
            {mode === "login" ? "Welcome back" : "Get started"}
          </div>
          <h1
            className="font-heading font-bold"
            style={{
              fontSize: "var(--text-h3)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              backgroundImage: "var(--grad-text)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {mode === "login" ? "Sign in to Aurora Ops" : "Create your workspace"}
          </h1>
          <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">
            {mode === "login"
              ? "Your fleet, your run history, and every agent you have deployed."
              : "You will get an organisation, and this machine registered as your first host."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[20px] border border-white/10 bg-[rgba(10,14,22,0.6)] p-6 backdrop-blur-2xl"
          style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,0.9)" }}
        >
          {mode === "signup" && (
            <div className="mb-4">
              <Label htmlFor="org" className="mb-1.5 block text-[13px]">Organisation</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={15} />
                <Input
                  id="org"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme IT"
                  className="pl-9"
                  autoComplete="organization"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="email" className="mb-1.5 block text-[13px]">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={15} />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-9"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="mb-5">
            <Label htmlFor="password" className="mb-1.5 block text-[13px]">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={15} />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                className="pl-9"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
            {mode === "signup" && password.length > 0 && password.length < 8 && (
              <p className="mt-1.5 text-[12px] text-warn">
                {8 - password.length} more character{8 - password.length === 1 ? "" : "s"} needed.
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-[12px] border border-crit/40 bg-crit-soft px-3.5 py-2.5 text-[13px] text-crit"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="w-full gap-1.5 bg-grad text-[#0c0f14] hover:brightness-110 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                {mode === "login" ? "Sign in" : "Create workspace"}
                <ArrowRight size={15} />
              </>
            )}
          </Button>

          <p className="mt-4 text-center text-[13px] text-muted-foreground">
            {mode === "login" ? "No account yet?" : "Already have one?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="font-medium text-brand-2 underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
