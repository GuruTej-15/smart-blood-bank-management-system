const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDonorScanUrl } = require("../utils/qr");

test("buildDonorScanUrl returns a frontend scan route for a donor", () => {
  const url = buildDonorScanUrl("donor123", "https://example.com");
  assert.equal(url, "https://example.com/qr/donor123");
});
