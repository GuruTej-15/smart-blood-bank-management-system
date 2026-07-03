const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDonorScanUrl } = require("../utils/qr");

test("buildDonorScanUrl returns a frontend scan route for a donor", () => {
  const url = buildDonorScanUrl("donor123", "https://example.com");
  assert.equal(url, "https://example.com/qr/donor123");
});

test("buildDonorScanUrl uses the request origin when provided", () => {
  const req = {
    headers: {
      origin: "https://mobile.example.com",
    },
  };

  const url = buildDonorScanUrl("donor123", req);
  assert.equal(url, "https://mobile.example.com/qr/donor123");
});
