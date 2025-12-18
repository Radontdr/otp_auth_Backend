import dotenv from "dotenv";
dotenv.config();

function mustGet(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: mustGet("DATABASE_URL"),
  OTP_PEPPER: mustGet("OTP_PEPPER"),
};
