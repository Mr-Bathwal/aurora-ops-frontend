const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Vitals = {
  cpu: number;
  memory: number;
  disk: number;
};

export type TraceStep =
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; content: string };

export type AgentReport = {
  report: string;
  trace: TraceStep[];
};

export type OrchestrateResult = {
  report: string;
  agent: "health" | "log" | "backup" | "unknown";
};

export type AutoRemediateResult = {
  report: string;
  diagnosis: string;
  needs_backup: boolean;
  remediation: string | null;
};

class ApiError extends Error {
  constructor(
    public path: string,
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(path, 0, `Can't reach the backend at ${API_URL}. Is it running?`);
  }
  if (!res.ok) {
    // Prefer the server's own explanation. FastAPI puts it in `detail`, and for the failures
    // an operator actually hits — the model provider's rate limit, a rejected tool call — it
    // says what to do next, which `500 Internal Server Error` never does.
    const detail = await res
      .json()
      .then((b) => (typeof b?.detail === "string" ? b.detail : null))
      .catch(() => null);
    throw new ApiError(path, res.status, detail ?? `${path} failed with ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  vitals: () => request<Vitals>("/api/vitals"),
  systemHealth: (query?: string) =>
    request<AgentReport>(`/api/system-health${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  logAnalysis: () => request<AgentReport>("/api/log-analysis"),
  backup: () => request<AgentReport>("/api/backup", { method: "POST" }),
  orchestrate: (userRequest: string) =>
    request<OrchestrateResult>("/api/orchestrate", {
      method: "POST",
      body: JSON.stringify({ request: userRequest }),
    }),
  /** `userRequest` steers the chain: it reaches the Log Analyzer's brief and the router that
   *  decides whether Backup & DR runs. Omitting it runs the default sweep. */
  autoRemediate: (userRequest?: string) =>
    request<AutoRemediateResult>("/api/auto-remediate", {
      method: "POST",
      body: JSON.stringify({ request: userRequest ?? null }),
    }),
};

export { ApiError };
