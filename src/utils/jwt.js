import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export function generateAccessToken(payload) {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  });
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}
