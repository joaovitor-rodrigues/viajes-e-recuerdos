-- ============================================================
-- Replace pin_date (single day) with start_date + end_date
-- ============================================================

-- 1. Add new columns (nullable first so we can backfill)
ALTER TABLE pins ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE pins ADD COLUMN IF NOT EXISTS end_date   DATE;

-- 2. Backfill from existing pin_date
UPDATE pins SET start_date = pin_date, end_date = pin_date;

-- 3. Enforce NOT NULL
ALTER TABLE pins ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE pins ALTER COLUMN end_date   SET NOT NULL;

-- 4. Replace index
DROP INDEX IF EXISTS idx_pins_date;
CREATE INDEX IF NOT EXISTS idx_pins_start_date ON pins (start_date);

-- 5. Remove the old column
ALTER TABLE pins DROP COLUMN IF EXISTS pin_date;
