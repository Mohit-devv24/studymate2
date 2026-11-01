const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
const isProd = Boolean((import.meta as any).env?.PROD);

const API_URL = (
  (rawApiUrl && rawApiUrl !== "http://127.0.0.1:8000" && rawApiUrl !== "http://localhost:8000")
    ? rawApiUrl
    : isProd
    ? "https://studymate2-s38r.onrender.com"
    : rawApiUrl || "http://127.0.0.1:8000"
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

export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp === "number") {
      // 5-second buffer before absolute expiration
      return payload.exp * 1000 <= Date.now() + 5000;
    }
    return false;
  } catch {
    return true;
  }
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

  if (response.status === 401 && !path.includes("/api/login")) {
    logoutUser();
    if (typeof window !== "undefined") {
      const currentPath =
        window.location.pathname + window.location.search + window.location.hash;
      const expiredMsg = "Your session has expired. Please log in again.";
      try {
        sessionStorage.setItem("studymate_auth_message", expiredMsg);
        sessionStorage.setItem("studymate_auth_redirect", currentPath);
      } catch {
        // ignore
      }

      window.dispatchEvent(
        new CustomEvent("studymate-session-expired", {
          detail: {
            from: currentPath,
            message: expiredMsg,
          },
        })
      );
    }
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
