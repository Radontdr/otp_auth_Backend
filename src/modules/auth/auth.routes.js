import express from "express";
import {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
} from "./auth.controller.js";

const router = express.Router();

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/resend-otp", resendOtpController);

export default router;
