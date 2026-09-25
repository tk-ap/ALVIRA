-- Grant the existing Katina Bland Bernal account permanent Founding Beta access.
-- This migration fails closed if the expected live account cannot be found exactly once.

DO $$
DECLARE
  target_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO target_count
  FROM users
  WHERE LOWER(TRIM(email)) = 'katinablandbernal@gmail.com';

  IF target_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one ALVIRA user for katinablandbernal@gmail.com; found %',
      target_count;
  END IF;
END $$;

WITH target AS (
  SELECT id, tier
  FROM users
  WHERE LOWER(TRIM(email)) = 'katinablandbernal@gmail.com'
), grant_access AS (
  INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
  SELECT
    id,
    CASE WHEN tier = 'founding_beta' THEN 'free' ELSE tier END,
    TIMESTAMPTZ '9999-12-31T23:59:59Z'
  FROM target
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at
  RETURNING user_id
)
UPDATE users
SET tier = 'founding_beta'
WHERE id IN (SELECT user_id FROM grant_access)
  AND tier = 'free';
