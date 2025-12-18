import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getMe } from "./user.controller.js";

const router = Router();

router.get("/me", authMiddleware, getMe);

export default router;
