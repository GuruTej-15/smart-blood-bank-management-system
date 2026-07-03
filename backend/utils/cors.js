function parseAllowedOrigins(value = "") {
  return String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin, allowedOrigins = []) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

module.exports = {
  parseAllowedOrigins,
  isAllowedOrigin,
};
