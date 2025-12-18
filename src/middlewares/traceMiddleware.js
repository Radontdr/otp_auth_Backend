import crypto from "crypto";

export function traceMiddleware(req, res, next) {
  req.traceId = crypto.randomBytes(12).toString("hex");
  next();
}
