import rateLimit from "express-rate-limit";

export class RateLimitMiddleware {
  static loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many login attempts. Please try again later.",
    },
  });
}
