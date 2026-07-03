function buildDonorScanUrl(donorId, frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173") {
  const base = String(frontendOrigin || "http://localhost:5173").replace(/\/$/, "");
  return `${base}/qr/${donorId}`;
}

module.exports = {
  buildDonorScanUrl,
};
