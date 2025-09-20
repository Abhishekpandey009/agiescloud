const SIGNUP_URL = "http://localhost:5000/api/auth/signup";
const LOGIN_URL = "http://localhost:5000/api/auth/login";

export async function signup({ username, email, password }) {
  const res = await fetch(SIGNUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed");
  return data; // { token, user }
}

export async function login({ email, password }) {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data; // { token, user }
}
