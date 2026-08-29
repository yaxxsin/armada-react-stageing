-- Armada Control 104 Group — invite (registration) tokens
-- Run together with the other migrations via `npm run migrate`.

CREATE TABLE IF NOT EXISTS registration_tokens (
  id          SERIAL PRIMARY KEY,
  token       TEXT UNIQUE NOT NULL,
  label       TEXT,
  created_by  INT REFERENCES users(id) ON DELETE SET NULL,
  max_uses    INT NOT NULL DEFAULT 1,
  uses        INT NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens (token);
