const sanitizeObject = (input) => {
  if (Array.isArray(input)) return input.map(sanitizeObject);
  if (!input || typeof input !== "object" || input.constructor !== Object) return input;

  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
};

module.exports = sanitizeRequest;
