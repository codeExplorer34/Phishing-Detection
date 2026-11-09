import type { z } from "zod";

import { healthSchema, messageResultSchema, scanResultSchema, type MessageResult, type ScanResult } from "./schemas";

export type ApiOutcome<T> = { ok: true; data: T } | { ok: false; error: string };

const TIMEOUT_MS = 30_000; // the first request after a quiet spell loads the models
const OFFLINE = "Fishy couldn’t reach its models. Check your connection and try again.";
const UNEXPECTED = "Fishy got an answer it didn’t understand. Please try again.";
const TIMED_OUT = "This is taking longer than usual. Please try again.";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function errorFromBody(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string" && body.error) {
    return body.error;
  }
  if (status === 429) return "You’ve checked a lot quickly. Wait a minute and try again.";
  return status >= 500 ? "Something went wrong on Fishy’s side. Please try again." : UNEXPECTED;
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
  fetchImpl: FetchLike = fetch,
): Promise<ApiOutcome<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(path, { ...init, signal: controller.signal });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: errorFromBody(body, response.status) };
    const envelope = body as { ok?: unknown; data?: unknown } | null;
    if (!envelope || envelope.ok !== true) return { ok: false, error: errorFromBody(body, response.status) };
    const parsed = schema.safeParse(envelope.data);
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: UNEXPECTED };
  } catch (error: unknown) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return { ok: false, error: aborted ? TIMED_OUT : OFFLINE };
  } finally {
    clearTimeout(timer);
  }
}

const postJson = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function scanLink(url: string, fetchImpl?: FetchLike): Promise<ApiOutcome<ScanResult>> {
  return request("/api/py/scan", scanResultSchema, postJson({ url }), fetchImpl);
}

export function scanMessage(text: string, fetchImpl?: FetchLike): Promise<ApiOutcome<MessageResult>> {
  return request("/api/py/scan-message", messageResultSchema, postJson({ text }), fetchImpl);
}

export function warmUp(fetchImpl?: FetchLike): Promise<ApiOutcome<z.infer<typeof healthSchema>>> {
  return request("/api/py/health", healthSchema, {}, fetchImpl);
}
