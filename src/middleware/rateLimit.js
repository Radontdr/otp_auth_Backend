import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many OTP requests. Try again later."
  }
});
