import crypto from "crypto";

import { OTP_POLICY } from "./policies/otp.policy.js";
import { generateOtp, makeSalt, hashOtp } from "../../utils/crypto.js";
import { normalizeIdentifier, isValidEmail, isValidMobile } from "../../utils/validate.js";
import { generateAccessToken } from "../../utils/jwt.js";

import { auditLog } from "./repositories/audit.repo.js";
import { findUserByIdentifier, createUser } from "./repositories/user.repo.js";
import {
  getLatestOtp,
  createOtp,
  invalidateOtp,
  incrementAttempts,
  markBlocked,
  markVerified,
  incrementResend
} from "./repositories/otp.repo.js";

/* sendOtpService remains as you already implemented */

export async function verifyOtpService(traceId, rawIdentifier, otp) {
  const apiName = "VERIFY_OTP";
  const identifier = normalizeIdentifier(rawIdentifier);

  const record = await getLatestOtp(identifier);
  if (!record) throw new Error("OTP_NOT_FOUND");

  if (record.status !== "PENDING") throw new Error("OTP_NOT_ACTIVE");
  if (new Date(record.expires_at) < new Date()) throw new Error("OTP_EXPIRED");

  const computedHash = hashOtp(otp, record.salt, identifier);
  const match = crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(record.otp_hash, "hex")
  );

  if (!match) {
    const updated = await incrementAttempts(record.id);
    if (updated.rows[0].attempts >= record.max_attempts) {
      await markBlocked(record.id);
      throw new Error("OTP_BLOCKED");
    }
    throw new Error("INVALID_OTP");
  }

  await markVerified(record.id);

  const accessToken = generateAccessToken({
    userId: record.user_id,
    identifier: record.identifier
  });

  await auditLog({
    traceId,
    apiName,
    step: "OTP_VERIFIED",
    status: "SUCCESS",
    message: "OTP verified successfully"
  });

  return {
    message: "Login successful",
    accessToken
  };
}

export async function sendOtpService(traceId, rawIdentifier) {
  const apiName = "SEND_OTP";
  const identifier = normalizeIdentifier(rawIdentifier);
  const type = identifier.includes("@") ? "EMAIL" : "MOBILE";

  const valid =
    type === "EMAIL"
      ? isValidEmail(identifier)
      : isValidMobile(identifier);

  if (!valid) throw new Error("INVALID_IDENTIFIER");

  let user = await findUserByIdentifier(identifier, type);

  const otp = generateOtp(OTP_POLICY.OTP_LENGTH);
  const salt = makeSalt();
  const otpHash = hashOtp(otp, salt, identifier);
  const expiresAt = new Date(Date.now() + OTP_POLICY.OTP_TTL_SECONDS * 1000);

  const otpRecord = await createOtp({
    userId: user ? user.id : null,
    identifier,
    identifierType: type,
    otpHash,
    salt,
    expiresAt,
    maxAttempts: OTP_POLICY.MAX_ATTEMPTS,
    maxResends: OTP_POLICY.MAX_RESENDS,
    cooldownUntil: null
  });

  if (!user) {
    await createUser(identifier, type);
  }

  await auditLog({
    traceId,
    apiName,
    step: "OTP_CREATED",
    status: "SUCCESS",
    message: "OTP generated",
    meta: { otpId: otpRecord.id }
  });

  console.log("OTP (dev only):", otp);

  return { message: "OTP sent successfully", traceId };
}


export async function resendOtpService(traceId, rawIdentifier) {
  const apiName = "RESEND_OTP";
  const identifier = normalizeIdentifier(rawIdentifier);

  const record = await getLatestOtp(identifier);
  if (!record) throw new Error("OTP_NOT_FOUND");

  if (record.resend_count >= record.max_resends) {
    throw new Error("RESEND_LIMIT_REACHED");
  }

  if (record.cooldown_until && new Date(record.cooldown_until) > new Date()) {
    throw new Error("COOLDOWN_ACTIVE");
  }

  const cooldownUntil = new Date(
    Date.now() + OTP_POLICY.RESEND_COOLDOWN_SECONDS * 1000
  );

  await incrementResend(record.id, cooldownUntil);
  await invalidateOtp(record.id);

  await auditLog({
    traceId,
    apiName,
    step: "RESEND",
    status: "SUCCESS",
    message: "OTP resent"
  });

  return sendOtpService(traceId, identifier);
}

