import type { ConfigStatus, GraphPatch, GraphState, NewsSource } from "../types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function searchSources(query: string): Promise<NewsSource[]> {
  const params = new URLSearchParams({ q: query });
  return requestJson<NewsSource[]>(`/api/sources/search?${params.toString()}`);
}

export async function importSourceGraphPatch(sourceId: string): Promise<GraphPatch> {
  return requestJson<GraphPatch>(`/api/sources/${sourceId}/import`, {
    method: "POST",
  });
}

export async function getGraphState(): Promise<GraphState> {
  return requestJson<GraphState>("/api/graph");
}

export async function resetGraphState(): Promise<GraphState> {
  return requestJson<GraphState>("/api/graph/reset", {
    method: "POST",
  });
}

export async function getConfigStatus(): Promise<ConfigStatus> {
  return requestJson<ConfigStatus>("/api/config/status");
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function buildErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string" && payload.detail.length > 0) {
      return payload.detail;
    }
  } catch {
    // Fall through to the status text when the backend does not return JSON.
  }

  return `Backend request failed: ${response.status} ${response.statusText}`;
}
