CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  mobile TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE otp_status AS ENUM (
  'PENDING',
  'VERIFIED',
  'EXPIRED',
  'INVALIDATED',
  'BLOCKED'
);

CREATE TABLE otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),

  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL,

  otp_hash TEXT NOT NULL,
  salt TEXT NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL,
  status otp_status DEFAULT 'PENDING',

  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,

  resend_count INT DEFAULT 0,
  max_resends INT DEFAULT 3,
  cooldown_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  api_name TEXT NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
