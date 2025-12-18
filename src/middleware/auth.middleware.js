import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "AUTH_TOKEN_MISSING",
      traceId: req.traceId
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET);
    req.user = payload; // { userId, identifier }
    next();
  } catch (err) {
    return res.status(401).json({
      error: "INVALID_OR_EXPIRED_TOKEN",
      traceId: req.traceId
    });
  }
}
