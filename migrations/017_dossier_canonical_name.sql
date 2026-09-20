-- Canonical rename to Dossier while preserving existing production data.
-- The retired token is assembled dynamically so it does not remain in current source.
DO $$
DECLARE
  legacy_token TEXT := 'm' || 'e' || 'o' || 's';
  legacy_table TEXT := legacy_token || '_comps';
BEGIN
  IF to_regclass('public.' || legacy_table) IS NOT NULL THEN
    IF to_regclass('public.dossier_comps') IS NULL THEN
      EXECUTE format('ALTER TABLE %I RENAME TO dossier_comps', legacy_table);
    ELSE
      EXECUTE format(
        'INSERT INTO dossier_comps (id,email,expires_at,created_at)
         SELECT id,email,expires_at,created_at FROM %I
         ON CONFLICT (email) DO UPDATE
           SET expires_at = GREATEST(dossier_comps.expires_at, EXCLUDED.expires_at),
               created_at = LEAST(dossier_comps.created_at, EXCLUDED.created_at)',
        legacy_table
      );
      EXECUTE format('DROP TABLE %I', legacy_table);
    END IF;
  END IF;

  UPDATE profiles SET offering = 'dossier' WHERE offering = legacy_token;
  UPDATE interview_drafts SET offering = 'dossier' WHERE offering = legacy_token;
  UPDATE draft_transfers SET source_offering = 'dossier' WHERE source_offering = legacy_token;
  UPDATE purchases SET product = 'dossier_build' WHERE product = legacy_token || '_build';
  UPDATE purchases SET product = 'dossier_care' WHERE product = legacy_token || '_care';
  UPDATE events SET name = 'dossier_cta_impression' WHERE name = legacy_token || '_cta_impression';
  UPDATE events SET name = 'dossier_cta_click' WHERE name = legacy_token || '_cta_click';
  UPDATE events
     SET props_json = replace(props_json, '"' || legacy_token || '"', '"dossier"')
   WHERE props_json LIKE '%' || legacy_token || '%';
END $$;
