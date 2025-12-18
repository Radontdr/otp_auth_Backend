import { OTP_POLICY } from "./policies/otp.policy.js";
import { generateOtp, makeSalt, hashOtp } from "../../utils/crypto.js";
import { isValidEmail, isValidMobile, normalizeIdentifier } from "../../utils/validate.js";
import { auditLog } from "./repositories/audit.repo.js";
import { findUserByIdentifier, createUser } from "./repositories/user.repo.js";
import { getLatestOtp, createOtp, invalidateOtp } from "./repositories/otp.repo.js";

export async function sendOtpService(traceId, rawIdentifier) {
  const apiName = "SEND_OTP";
  await auditLog({ traceId, apiName, step: "START", status: "INFO", message: "Send OTP started" });

  const identifier = normalizeIdentifier(rawIdentifier);
  const type = identifier.includes("@") ? "EMAIL" : "MOBILE";

  const valid =
    type === "EMAIL"
      ? isValidEmail(identifier)
      : isValidMobile(identifier);

  if (!valid) {
    await auditLog({ traceId, apiName, step: "VALIDATION", status: "FAIL", message: "Invalid identifier" });
    throw new Error("INVALID_IDENTIFIER");
  }

  const previousOtp = await getLatestOtp(identifier);
  if (previousOtp && previousOtp.status === "PENDING") {
    await invalidateOtp(previousOtp.id);
  }

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
    user = await createUser(identifier, type);
  }

  await auditLog({
    traceId,
    apiName,
    step: "OTP_CREATED",
    status: "SUCCESS",
    message: "OTP generated and stored",
    meta: { otpId: otpRecord.id }
  });

  console.log("OTP (for testing):", otp); // REMOVE in production

  return { message: "OTP sent successfully", traceId };
}

import crypto from "crypto";

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

  await auditLog({
    traceId,
    apiName,
    step: "OTP_VERIFIED",
    status: "SUCCESS",
    message: "OTP verified successfully"
  });

  return { message: "Login successful", traceId };
}

export async function resendOtpService(traceId, rawIdentifier) {
  const identifier = normalizeIdentifier(rawIdentifier);
  const record = await getLatestOtp(identifier);

  if (!record) throw new Error("OTP_NOT_FOUND");

  if (record.resend_count >= record.max_resends) {
    throw new Error("RESEND_LIMIT_REACHED");
  }

  if (record.cooldown_until && new Date(record.cooldown_until) > new Date()) {
    throw new Error("COOLDOWN_ACTIVE");
  }

  await invalidateOtp(record.id);

  return sendOtpService(traceId, identifier);
}

