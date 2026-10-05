import type { Bootstrap, LoginRequest, SessionResponse } from "./contracts";
let csrfToken = "";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}
type RequestOptions<TBody> = Omit<RequestInit, "body"> & {
  body?: TBody;
  idempotencyKey?: string;
};
export async function request<TResponse, TBody = never>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const mutation = Boolean(options.method && !["GET", "HEAD"].includes(options.method));
  const { idempotencyKey, ...fetchOptions } = options;
  const response = await fetch(path, {
    ...fetchOptions,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(mutation ? { "Idempotency-Key": idempotencyKey ?? crypto.randomUUID() } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.error || "No fue posible completar la operación.",
      response.status,
      data.fields,
    );
  }
  if (response.status === 204) return undefined as TResponse;
  return response.json();
}
export async function bootstrap() {
  const data = await request<Bootstrap>("/api/bootstrap");
  csrfToken = data.csrfToken;
  return data;
}
export async function login(email: string, password: string) {
  const body: LoginRequest = { email, password };
  const data = await request<SessionResponse, LoginRequest>("/api/auth/login", {
    method: "POST",
    body,
  });
  csrfToken = data.csrfToken;
}
export async function logout() {
  await request<void>("/api/auth/logout", { method: "POST" });
  csrfToken = "";
}
