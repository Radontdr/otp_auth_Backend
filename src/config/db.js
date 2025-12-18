import pkg from "pg";
import { ENV } from "./env.js";

const { Pool } = pkg;

export const db = new Pool({
  connectionString: ENV.DATABASE_URL,
});
