const { sanitizeInput } = require("../utils/security");

function sanitizeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return sanitizeInput(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === "object") {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(object) {
  if (!object || typeof object !== "object") return object;
  return Object.keys(object).reduce((result, key) => {
    result[key] = sanitizeValue(object[key]);
    return result;
  }, {});
}

function sanitizeRequest(req, res, next) {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
}

module.exports = sanitizeRequest;
