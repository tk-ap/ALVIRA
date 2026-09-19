-- Put the dedicated E2E account on an internal full-access testing tier.
-- This preserves the account and history while keeping it separate from
-- Free, paid, Founding Beta, and owner/admin cohorts.

DO $$
DECLARE
  target_count INTEGER;
  current_tier TEXT;
BEGIN
  SELECT COUNT(*), MAX(tier)
    INTO target_count, current_tier
    FROM users
   WHERE LOWER(TRIM(email)) = 'codex-e2e-1788235310@example.com';

  IF target_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one ALVIRA user for codex-e2e-1788235310@example.com; found %',
      target_count;
  END IF;

  IF current_tier NOT IN ('free', 'smoke_testing') THEN
    RAISE EXCEPTION
      'Refusing to replace unexpected tier % for codex-e2e-1788235310@example.com',
      current_tier;
  END IF;

  UPDATE users
     SET tier = 'smoke_testing'
   WHERE LOWER(TRIM(email)) = 'codex-e2e-1788235310@example.com';
END $$;
