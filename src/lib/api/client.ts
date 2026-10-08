import type { ApiResponse } from "@/types/api";

export class ApiError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function unwrap<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!payload || payload.ok === false) {
    if (payload && payload.ok === false) {
      throw new ApiError(payload.error.message, payload.error.code, payload.error.details);
    }
    throw new ApiError(`Request failed: ${res.status}`, "NETWORK");
  }
  return payload.data;
}

async function request<T>(method: Method, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return unwrap<T>(res);
}

export function apiGet<T>(url: string): Promise<T> {
  return request<T>("GET", url);
}

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return request<T>("POST", url, body);
}

export function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", url, body);
}

export function apiDelete<T>(url: string): Promise<T> {
  return request<T>("DELETE", url);
}

export async function apiPostForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData });
  return unwrap<T>(res);
}
