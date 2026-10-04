import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { server } from "../lib/socket.js";
import "../app.js"; // attaches middleware + routes (no listen, no DB)

let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function call(method, path, body) {
  return fetch(baseUrl + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ---- Auth: input validation (no DB needed — errors return before queries) ----

test("POST /auth/signup rejects missing fields with 400", async () => {
  const res = await call("POST", "/auth/signup", { email: "a@b.com" });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "Email, password, and full name are required");
});

test("POST /auth/signup rejects short password with 400", async () => {
  const res = await call("POST", "/auth/signup", {
    fullName: "Test User",
    email: "a@b.com",
    password: "123",
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "Password must be at least 6 characters");
});

test("POST /auth/login rejects missing credentials with 400", async () => {
  const res = await call("POST", "/auth/login", {});
  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "Email and password are required");
});

// ---- protectRoute: every protected route must reject missing token with 401 ----

test("GET /auth/check without token returns 401", async () => {
  const res = await call("GET", "/auth/check");
  assert.equal(res.status, 401);
  assert.equal((await res.json()).message, "Unauthorized - No token provided");
});

test("GET /messages/users without token returns 401", async () => {
  const res = await call("GET", "/messages/users");
  assert.equal(res.status, 401);
  assert.equal((await res.json()).message, "Unauthorized - No token provided");
});

test("POST /messages/send/:id without token returns 401", async () => {
  const res = await call("POST", "/messages/send/6612f987abc4ee0012345679", { text: "hi" });
  assert.equal(res.status, 401);
  assert.equal((await res.json()).message, "Unauthorized - No token provided");
});
