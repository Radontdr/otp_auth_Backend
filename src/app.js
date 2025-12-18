import express from "express";
import { traceMiddleware } from "./middlewares/traceMiddleware.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(express.json());
app.use(traceMiddleware);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);

export default app;
