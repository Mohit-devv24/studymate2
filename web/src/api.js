const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("authToken");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to StudyMate backend. Check the backend URL and make sure the server is running."
    );
  }

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

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
    throw new Error(
      response.data?.detail || "Backend test failed"
    );
  }

  return response.data;
}

export async function signupUser(name, email, password) {
  const response = await apiFetch("/api/signup", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Signup failed"
    );
  }

  return response.data;
}

export async function loginUser(email, password) {
  const response = await apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      response.data?.detail ||
        response.data?.message ||
        "Login failed"
    );
  }

  return response.data;
}

export { API_URL };