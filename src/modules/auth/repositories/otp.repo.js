import { db } from "../../../config/db.js";

export async function getLatestOtp(identifier) {
  const result = await db.query(
    `SELECT * FROM otp_requests
     WHERE identifier = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [identifier]
  );

  return result.rows[0] || null;
}

export async function createOtp(data) {
  const {
    userId,
    identifier,
    identifierType,
    otpHash,
    salt,
    expiresAt,
    maxAttempts,
    maxResends,
    cooldownUntil
  } = data;

  const result = await db.query(
    `INSERT INTO otp_requests
     (user_id, identifier, identifier_type, otp_hash, salt,
      expires_at, max_attempts, max_resends, cooldown_until)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      userId,
      identifier,
      identifierType,
      otpHash,
      salt,
      expiresAt,
      maxAttempts,
      maxResends,
      cooldownUntil
    ]
  );

  return result.rows[0];
}

export async function invalidateOtp(id) {
  await db.query(
    `UPDATE otp_requests
     SET status = 'INVALIDATED'
     WHERE id = $1`,
    [id]
  );
}
