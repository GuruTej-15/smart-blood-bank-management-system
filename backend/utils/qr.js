function buildDonorScanUrl(donorId, frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173") {
  let base = "http://localhost:5173";

  if (frontendOrigin && typeof frontendOrigin === "object") {
    const originHeader = frontendOrigin.headers?.origin || frontendOrigin.headers?.referer || "";
    if (originHeader) {
      try {
        base = new URL(originHeader).origin;
      } catch {
        base = originHeader.replace(/\/$/, "");
      }
    }
  } else if (typeof frontendOrigin === "string" && frontendOrigin) {
    try {
      base = new URL(frontendOrigin).origin;
    } catch {
      base = frontendOrigin.replace(/\/$/, "");
    }
  }

  return `${base.replace(/\/$/, "")}/qr/${donorId}`;
}

module.exports = {
  buildDonorScanUrl,
};
