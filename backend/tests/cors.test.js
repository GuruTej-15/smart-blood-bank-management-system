const test = require("node:test");
const assert = require("node:assert/strict");
const { isAllowedOrigin, parseAllowedOrigins } = require("../utils/cors");

test("allows localhost and Vercel-style origins", () => {
  const origins = parseAllowedOrigins("http://localhost:5173,https://myapp.vercel.app");
  assert.equal(isAllowedOrigin("http://localhost:5173", origins), true);
  assert.equal(isAllowedOrigin("https://myapp.vercel.app", origins), true);
  assert.equal(isAllowedOrigin("https://evil.example.com", origins), false);
});
