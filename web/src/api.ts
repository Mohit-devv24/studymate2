const API_URL = (
  (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

export function getCurrentUser(): { id: string; name: string; email: string; token: string } | null {
  const token = localStorage.getItem("authToken");
  const id = localStorage.getItem("userId");
  const name = localStorage.getItem("userName");
  const email = localStorage.getItem("userEmail");
  if (!token || !id) return null;
  return { id, name: name || "Student", email: email || "", token };
}

export function logoutUser(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  json: () => Promise<T>;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to StudyMate backend. Make sure the server is running."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (response.status === 401 && token && !path.includes("/api/login")) {
    logoutUser();
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    json: async () => data,
  };
}

export async function testBackend() {
  const response = await apiFetch("/api/test");
  if (!response.ok) {
    throw new Error(response.data?.detail || "Backend test failed");
  }
  return response.data;
}

export async function signupUser(name: string, email: string, password: string) {
  const response = await apiFetch("/api/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error(
      response.data?.detail || response.data?.message || "Signup failed"
    );
  }
  return response.data;
}

export async function loginUser(email: string, password: string) {
  const response = await apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(
      response.data?.detail || response.data?.message || "Invalid email or password"
    );
  }

  const data = response.data;
  const user = data.user || data;
  const id = data.id ?? data.user_id ?? user.id ?? user.user_id;
  const token = data.token ?? data.access_token;
  const normalized = {
    ...data,
    id,
    token,
    name: data.name ?? user.name,
    email: data.email ?? user.email,
    course: data.course ?? user.course ?? "JEE (Main & Advanced)",
  };

  if (normalized.token) {
    localStorage.setItem("authToken", normalized.token);
  }
  if (normalized.id != null) {
    localStorage.setItem("userId", String(normalized.id));
  }
  if (normalized.name) localStorage.setItem("userName", normalized.name);
  if (normalized.email) localStorage.setItem("userEmail", normalized.email);
  if (normalized.course) localStorage.setItem("userCourse", normalized.course);

  return normalized;
}

export { API_URL };
