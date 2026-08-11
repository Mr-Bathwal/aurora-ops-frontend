/** Client for the control plane — accounts, hosts, metrics, thresholds.
 *
 * Separate from `api.ts` on purpose. That module talks to the original single-machine
 * endpoints and sends no credentials; everything here is authenticated and host-scoped, and
 * mixing the two would mean every call carrying a `credentials` flag that only half of them
 * need.
 *
 * `credentials: "include"` on every request, because the session lives in an HttpOnly cookie
 * the backend sets on its own origin. Worth being precise about why that works: the cookie is
 * `SameSite=Lax`, and SameSite is evaluated per *site*, not per origin — port is not part of a
 * site — so `localhost:3000` calling `localhost:8000` is same-site and the cookie rides along.
 * It is still cross-*origin*, which is why the backend names both origins explicitly in its
 * CORS config; `allow_origins: ["*"]` is not permitted once credentials are involved.
 *
 * The same fact rules out Next's `proxy.ts` for route protection: the cookie belongs to
 * :8000, so the Next server never receives it and cannot check a session before rendering.
 * Guarding happens client-side in `useSession` instead.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ControlApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ControlApiError";
  }

  /** True when the caller should be sent back to the login screen. */
  get isAuthError() {
    return this.status === 401;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ControlApiError(0, `Can't reach the control plane at ${API_URL}. Is it running?`);
  }
  if (!res.ok) {
    // FastAPI puts the human-readable reason in `detail`. Falling back to the status text
    // matters for 502s from the transport layer, which have no JSON body at all.
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* non-JSON error body; the status line is the best we have */
    }
    throw new ControlApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/* ---------- types ---------- */

export type Session = { user_id: string; org_id: string; email: string; role: string };

export type ConnectionType = "local" | "agent" | "ssh";
export type HostStatus = "pending" | "online" | "offline" | "error";

export type Host = {
  id: string;
  name: string;
  connection_type: ConnectionType;
  status: HostStatus;
  os_family: string | null;
  os_version: string | null;
  hostname: string | null;
  agent_version: string | null;
  last_seen_at: string | null;
  last_error: string | null;
  created_at: string;
  address?: string | null;
  enrolled_at?: string | null;
};

export type NewAgentHost = Host & {
  enrol_token: string;
  enrol_expires_at: string;
  install_command: string;
};

export type Trend = {
  metric: string;
  window_hours: number;
  samples: number;
  sufficient_data: boolean;
  note?: string;
  current?: number;
  min?: number;
  max?: number;
  avg?: number;
  p95?: number;
  change?: number;
  direction?: "rising" | "falling" | "stable";
};

export type Anomaly = { metric: string; level: string; kind: string; detail: string };

export type Thresholds = { warn: number; crit: number; customised: boolean };

export type Finding = {
  metric: string;
  label: string;
  value: number | boolean;
  level: "OK" | "WARNING" | "CRITICAL";
};

export type Evaluation = {
  overall_status: "HEALTHY" | "WARNING" | "CRITICAL";
  findings: Finding[];
  checks_unavailable: string[];
};

export type Snapshot = Record<string, Record<string, unknown>> & { evaluation?: Evaluation };

export type CollectorStatus = {
  running: boolean;
  enabled: boolean;
  cycles: number;
  interval_seconds: number;
  last_run: string | null;
  last_error: string | null;
  hosts_ok: number;
  hosts_failed: number;
};

export type RunRecord = {
  id: string;
  host_id: string | null;
  host_name: string | null;
  agent_key: string;
  request: string | null;
  report: string | null;
  severity: string | null;
  started_at: string;
  error: string | null;
};

/* ---------- calls ---------- */

export const control = {
  signup: (email: string, password: string, org_name: string) =>
    request<Session & { session_token: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, org_name }),
    }),

  login: (email: string, password: string) =>
    request<Session & { session_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<Session>("/api/auth/me"),

  hosts: () => request<{ hosts: Host[] }>("/api/hosts"),
  host: (id: string) => request<Host>(`/api/hosts/${id}`),

  addAgentHost: (name: string) =>
    request<NewAgentHost>("/api/hosts/agent", { method: "POST", body: JSON.stringify({ name }) }),

  addSshHost: (body: {
    name: string;
    address: string;
    username: string;
    port: number;
    auth_method: "password" | "private_key";
    secret: string;
  }) => request<Host>("/api/hosts/ssh", { method: "POST", body: JSON.stringify(body) }),

  reissueEnrolment: (id: string) =>
    request<{ enrol_token: string; enrol_expires_at: string }>(`/api/hosts/${id}/reissue`, {
      method: "POST",
    }),

  testHost: (id: string) =>
    request<{ ok: boolean; error?: string; os_family?: string; hostname?: string }>(
      `/api/hosts/${id}/test`,
      { method: "POST" }
    ),

  deleteHost: (id: string) => request<{ ok: boolean }>(`/api/hosts/${id}`, { method: "DELETE" }),

  snapshot: (id: string) => request<Snapshot>(`/api/hosts/${id}/snapshot`),

  trends: (id: string, hours = 24) =>
    request<{ trends: Record<string, Trend>; anomalies: Anomaly[]; thresholds: Thresholds }>(
      `/api/hosts/${id}/trends?hours=${hours}`
    ),

  series: (id: string, metric: string, hours = 24) =>
    request<{ metric: string; points: { recorded_at: string; value: number }[] }>(
      `/api/hosts/${id}/series/${metric}?hours=${hours}`
    ),

  thresholds: (id: string) => request<Thresholds>(`/api/hosts/${id}/thresholds`),

  setThresholds: (id: string, warn_pct: number | null, crit_pct: number | null) =>
    request<Thresholds>(`/api/hosts/${id}/thresholds`, {
      method: "PUT",
      body: JSON.stringify({ warn_pct, crit_pct }),
    }),

  healthCheck: (id: string, query?: string) =>
    request<{ report: string; severity: string; run_id: string; host_name: string }>(
      `/api/hosts/${id}/health${query ? `?query=${encodeURIComponent(query)}` : ""}`,
      { method: "POST" }
    ),

  collector: () => request<CollectorStatus>("/api/collector"),
  collectNow: () => request<{ hosts_ok: number; hosts_failed: number }>("/api/collector/run", { method: "POST" }),

  runs: (limit = 50) => request<{ runs: RunRecord[] }>(`/api/runs?limit=${limit}`),
};
