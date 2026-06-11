-- ============================================================
-- Cache for resolved Google Photos Picker baseUrls
-- Avoids calling listPickerSessionItems on every proxy request.
-- Entries older than 45 min are considered stale (Google baseUrls
-- are valid for ~1 hour).
-- ============================================================

CREATE TABLE IF NOT EXISTS google_photos_url_cache (
  gphotos_url  TEXT        PRIMARY KEY,             -- gphotos://label/sessionId/itemId
  base_url     TEXT        NOT NULL,                -- raw baseUrl from Google Picker API
  mime_type    TEXT        NOT NULL,
  resolved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service role only (bypasses RLS)
ALTER TABLE google_photos_url_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all ON google_photos_url_cache FOR ALL USING (false);
