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
    throw new ApiError(path, res.status, `${path} failed with ${res.status} ${res.statusText}`);
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
  autoRemediate: () => request<AutoRemediateResult>("/api/auto-remediate", { method: "POST" }),
};

export { ApiError };
