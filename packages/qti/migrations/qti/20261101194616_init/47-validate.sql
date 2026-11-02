-- Validate law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_identifier", "qti"."resource_lom_identified" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_c534m3pdvg"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'lom_identifier'::text THEN
    IF NEW."owner" = 'resource'::"qti"."lom_owner" THEN
      PERFORM 1 FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = NEW."lom";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = NEW."lom" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["LomIdentifier",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["LomIdentifier"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = OLD."lom";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = OLD."lom" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["LomIdentifier",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["LomIdentifier"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_c534m3pdvg"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_lom_identifier_owner_resource_in_resource_lom_e4mm3jcaxc"
  AFTER INSERT ON "qti"."lom_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_c534m3pdvg"();

CREATE CONSTRAINT TRIGGER "__law_lom_identifier_owner_resource_in_resource_lom_jlw2bxafkc"
  AFTER DELETE ON "qti"."resource_lom_identified"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_c534m3pdvg"();

-- The full violation query of law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c13" AS "lom" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."id", "r1"."lom", "r1"."owner", "r1"."position" FROM "qti"."lom_identifier" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c3" = 'resource'::"qti"."lom_owner") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."lom", "r5"."package", "r5"."resource", "r5"."type" FROM "qti"."resource_lom_identified" AS "r5") AS "r6"("c7", "c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c6")) AS "r9"("c13")) THEN
    RAISE EXCEPTION 'law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs'::text;
  END IF;
END
$$;
