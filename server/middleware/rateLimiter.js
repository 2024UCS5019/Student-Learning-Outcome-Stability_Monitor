const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests" } = {}) => {
  const hits = new Map();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(retryAfterSeconds, 1)));
      return res.status(429).json({ message });
    }

    entry.count += 1;
    hits.set(key, entry);
    next();
  };
};

module.exports = createRateLimiter;
