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

  static forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many reset link requests. Please try again later.",
    },
  });

  static resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many reset password requests. Please try again later.",
    },
  });

  static resendVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message:
        "Too many verification requests. Please check your email or try again later.",
    },
  });
}
