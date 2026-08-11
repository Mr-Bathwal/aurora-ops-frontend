"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ControlApiError, control, type Session } from "@/lib/control-api";

/** Client-side session state.
 *
 * Client-side rather than in `proxy.ts`, and not because it is easier. The session cookie is
 * HttpOnly and set by FastAPI on its own origin, so the Next server never receives it — a
 * proxy guard would be checking for a cookie that structurally cannot be there, and would
 * either wave everyone through or lock everyone out. Next's own guidance says the same thing
 * from the other direction: proxy is for optimistic checks, not for session management.
 *
 * So the source of truth is the backend, asked once on mount. `status` is deliberately three
 * states rather than a boolean: "loading" and "signed out" look identical to a boolean and
 * must not, or every guarded page flashes its empty state before the check comes back.
 *
 * The fetch is defined inside the effect and guarded by `active`, matching `useBackendStatus`.
 * Hoisting it into a `useCallback` and calling that from the effect reads more cleanly but
 * trips the React Compiler's set-state-in-effect rule, and the guard is worth having anyway:
 * without it, a component unmounted mid-request still calls setState when the response lands.
 */
export type SessionStatus = "loading" | "authenticated" | "anonymous";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const me = await control.me();
        if (!active) return;
        setSession(me);
        setStatus("authenticated");
        setError(null);
      } catch (e) {
        if (!active) return;
        setSession(null);
        setStatus("anonymous");
        // A 401 is the expected answer for a signed-out visitor and is not worth surfacing.
        // A connection failure is worth surfacing loudly — it means the backend is down, and
        // "please sign in" would be a misleading thing to show someone in that case.
        setError(e instanceof ControlApiError && !e.isAuthError ? e.message : null);
      }
    }

    check();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const signOut = useCallback(async () => {
    try {
      await control.logout();
    } catch {
      /* already gone server-side; clearing locally is still correct */
    }
    setSession(null);
    setStatus("anonymous");
  }, []);

  return { session, status, error, refresh, signOut };
}

/** Redirects to /login when the session check comes back anonymous. */
export function useRequireSession() {
  const state = useSession();
  const router = useRouter();
  const shouldRedirect = state.status === "anonymous" && !state.error;

  useEffect(() => {
    if (shouldRedirect) router.replace("/login");
  }, [shouldRedirect, router]);

  return state;
}
