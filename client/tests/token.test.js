import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Node has no localStorage — stub it (same shape as the browser API)
const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
});

const { getAuthToken, setAuthToken, removeAuthToken } = await import(
  "../src/lib/token.js"
);

beforeEach(() => store.clear());

test("setAuthToken stores the token in localStorage", () => {
  setAuthToken("jwt-abc");
  assert.equal(store.get("token"), "jwt-abc");
});

test("getAuthToken returns the stored token", () => {
  setAuthToken("jwt-abc");
  assert.equal(getAuthToken(), "jwt-abc");
});

test("getAuthToken returns null when no token exists", () => {
  assert.equal(getAuthToken(), null);
});

test("setAuthToken with empty value removes the token (logout)", () => {
  setAuthToken("jwt-abc");
  setAuthToken(undefined);
  assert.equal(store.has("token"), false);
  assert.equal(getAuthToken(), null);
});

test("removeAuthToken clears a previously stored token", () => {
  setAuthToken("jwt-abc");
  removeAuthToken();
  assert.equal(getAuthToken(), null);
});
