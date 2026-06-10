-- ============================================================
-- Google OAuth tokens for Google Photos integration
-- ============================================================

CREATE TABLE IF NOT EXISTS google_tokens (
  id            SERIAL PRIMARY KEY,
  label         TEXT        NOT NULL UNIQUE,  -- 'joão' | 'jéssica'
  email         TEXT,
  access_token  TEXT,
  refresh_token TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_google_tokens_updated_at
  BEFORE UPDATE ON google_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Only service role can access tokens (bypasses RLS)
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all ON google_tokens FOR ALL USING (false);
