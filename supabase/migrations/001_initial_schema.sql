-- ============================================================
-- Viajes e Recuerdos — Initial Schema
-- ============================================================

-- ── Updated-at trigger function ──────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Table: pins ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pins (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude    DECIMAL(10,8) NOT NULL,
  longitude   DECIMAL(11,8) NOT NULL,
  city        TEXT          NOT NULL,
  state       TEXT,
  country     TEXT          NOT NULL,
  title       TEXT          NOT NULL,
  description TEXT,
  pin_date    DATE          NOT NULL,
  media       JSONB         NOT NULL DEFAULT '[]',
  color       TEXT          NOT NULL DEFAULT '#C9485B',
  icon        TEXT          NOT NULL DEFAULT '💕',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pins_date    ON pins (pin_date);
CREATE INDEX IF NOT EXISTS idx_pins_country ON pins (country);
CREATE INDEX IF NOT EXISTS idx_pins_city    ON pins (city);

CREATE TRIGGER trg_pins_updated_at
  BEFORE UPDATE ON pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_full_access ON pins
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ── Table: visual_theme ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS visual_theme (
  id                 INT         NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  primary_color      TEXT        NOT NULL DEFAULT '#C9485B',
  secondary_color    TEXT        NOT NULL DEFAULT '#4ECDC4',
  background_color   TEXT        NOT NULL DEFAULT '#0f0f1a',
  text_color         TEXT        NOT NULL DEFAULT '#f0ece4',
  map_style          TEXT        NOT NULL DEFAULT 'dark',
  enable_particles   BOOLEAN     NOT NULL DEFAULT true,
  enable_glow        BOOLEAN     NOT NULL DEFAULT true,
  enable_animations  BOOLEAN     NOT NULL DEFAULT true,
  font_family        TEXT        NOT NULL DEFAULT 'Cormorant Garamond',
  sidebar_position   TEXT        NOT NULL DEFAULT 'right',
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_visual_theme_updated_at
  BEFORE UPDATE ON visual_theme
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE visual_theme ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_full_access ON visual_theme
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ── Default theme row ────────────────────────────────────────
INSERT INTO visual_theme (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
