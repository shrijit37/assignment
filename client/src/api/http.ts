const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/** Error surfaced by the API, including per-field validation messages. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readMessage(payload: unknown): { message?: string; fields?: Record<string, string[]> } {
  if (typeof payload !== "object" || payload === null) return {};

  const record = payload as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : undefined;
  const fields =
    typeof record.fields === "object" && record.fields !== null
      ? (record.fields as Record<string, string[]>)
      : undefined;

  return { message, fields };
}

/**
 * Thin wrapper around `fetch` that prefixes the API path, sends JSON and turns
 * error responses into `ApiError`.
 *
 * @param path Path below `/api`, e.g. `/tasks`.
 * @param init Optional fetch options.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const { message, fields } = readMessage(payload);
    throw new ApiError(
      response.status,
      message ?? `Request failed with status ${response.status}`,
      fields,
    );
  }

  return payload as T;
}
