// In-memory sliding window rate limiter
const requests = new Map();

export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 100; // 100 requests per window
  const message = options.message || { error: "Too many requests, please try again later." };

  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const timestamps = requests.get(ip).filter((ts) => now - ts < windowMs);
    timestamps.push(now);
    requests.set(ip, timestamps);

    if (timestamps.length > max) {
      return res.status(429).json(message);
    }

    next();
  };
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again in a few minutes."
  }
});

export const apiLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "API rate limit exceeded. Please slow down."
  }
});
