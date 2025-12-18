import { db } from "../../../config/db.js";

export async function auditLog({
  traceId,
  apiName,
  step,
  status,
  message,
  meta,
}) {
  await db.query(
    `INSERT INTO audit_logs
     (trace_id, api_name, step, status, message, meta)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [traceId, apiName, step, status, message, meta || null]
  );
}
