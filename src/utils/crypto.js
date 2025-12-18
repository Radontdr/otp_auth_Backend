import crypto from "crypto";
import { ENV } from "../config/env.js";

export function generateOtp(length) {
  const max = 10 ** length;
  return String(crypto.randomInt(0, max)).padStart(length, "0");
}

export function makeSalt() {
  return crypto.randomBytes(16).toString("hex");
}

export function hashOtp(otp, salt, identifier) {
  const data = `${otp}:${salt}:${identifier}`;
  return crypto
    .createHmac("sha256", ENV.OTP_PEPPER)
    .update(data)
    .digest("hex");
}
