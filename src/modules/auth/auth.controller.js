import { sendOtpService } from "./auth.service.js";
import { auditLog } from "./repositories/audit.repo.js";

export async function sendOtpController(req, res) {
  const traceId = req.traceId;

  try {
    const { identifier } = req.body;
    const result = await sendOtpService(traceId, identifier);
    res.status(200).json(result);
  } catch (err) {
    await auditLog({
      traceId,
      apiName: "SEND_OTP",
      step: "ERROR",
      status: "FAIL",
      message: err.message
    });

    res.status(400).json({ error: err.message, traceId });
  }
}

export async function verifyOtpController(req, res) {
  const traceId = req.traceId;

  try {
    const { identifier, otp } = req.body;
    const result = await verifyOtpService(traceId, identifier, otp);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message, traceId });
  }
}

export async function resendOtpController(req, res) {
  const traceId = req.traceId;

  try {
    const { identifier } = req.body;
    const result = await resendOtpService(traceId, identifier);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message, traceId });
  }
}

