// Unset in production: client and server share an origin there, so relative
// paths (empty prefix) already resolve correctly.
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, adminPassword?: string): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (adminPassword) headers["x-admin-password"] = adminPassword;
  if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${SERVER_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? body.error ?? `Erreur ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function imageUrl(path: string) {
  return `${SERVER_URL}${path}`;
}

export const api = {
  adminLogin: (password: string) => request<{ ok: true }>("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) }),
  adminStatus: (password: string) => request<{ phase: string }>("/api/admin/status", {}, password),
  adminReset: (password: string) => request("/api/admin/reset", { method: "POST" }, password),

  listCategories: (password: string) => request<CategoryDto[]>("/api/categories", {}, password),
  createCategory: (password: string, title: string) =>
    request<CategoryDto>("/api/categories", { method: "POST", body: JSON.stringify({ title }) }, password),
  updateCategory: (password: string, id: string, data: { title?: string; order?: number }) =>
    request<CategoryDto>(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }, password),
  deleteCategory: (password: string, id: string) => request(`/api/categories/${id}`, { method: "DELETE" }, password),

  createNominee: (password: string, categoryId: string, data: { name: string; imageUrl?: string }) =>
    request<NomineeDto>(`/api/categories/${categoryId}/nominees`, { method: "POST", body: JSON.stringify(data) }, password),
  updateNominee: (password: string, id: string, data: { name?: string; imageUrl?: string | null; order?: number }) =>
    request<NomineeDto>(`/api/nominees/${id}`, { method: "PATCH", body: JSON.stringify(data) }, password),
  deleteNominee: (password: string, id: string) => request(`/api/nominees/${id}`, { method: "DELETE" }, password),

  uploadImage: async (password: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return request<{ url: string }>("/api/upload", { method: "POST", body: form }, password);
  },

  exportPdfUrl: () => `${SERVER_URL}/api/export/pdf`,
};

export interface NomineeDto {
  id: string;
  categoryId: string;
  name: string;
  imageUrl: string | null;
  order: number;
}

export interface CategoryDto {
  id: string;
  title: string;
  order: number;
  status: string;
  nominees: NomineeDto[];
}
