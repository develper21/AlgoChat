import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMessageTime } from "../src/lib/utils.js";

test("formatMessageTime renders 24h HH:MM with padded hour", () => {
  const date = new Date(2026, 8, 29, 9, 5); // local time 09:05
  assert.equal(formatMessageTime(date), "09:05");
});

test("formatMessageTime renders afternoon time without seconds", () => {
  const date = new Date(2026, 8, 29, 17, 45); // local time 17:45
  assert.equal(formatMessageTime(date), "17:45");
});
