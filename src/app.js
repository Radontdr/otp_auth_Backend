import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import { traceMiddleware } from "./middleware/traceMiddleware.js";

const app = express();

app.use(express.json());
app.use(traceMiddleware);

app.use("/auth", authRoutes);
app.use("/user", userRoutes);

export default app;
