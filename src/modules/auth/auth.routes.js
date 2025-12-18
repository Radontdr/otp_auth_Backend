import express from "express";
import {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
} from "./auth.controller.js";
import { otpRateLimiter } from "../../middleware/rateLimit.js";

const router = express.Router();

router.post("/send-otp", otpRateLimiter, sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/resend-otp", otpRateLimiter, resendOtpController);

export default router;
