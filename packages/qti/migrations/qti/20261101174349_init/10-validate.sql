-- Validate law __lom_owner_alternatives_sglqrocoop: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom", "qti"."manifest_lom", "qti"."resource_lom" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_owner_alternatives_qipk6s5rsl"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'lom'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'manifest'::"qti"."lom_owner" THEN
          PERFORM 1 FROM "qti"."manifest_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Lom",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Lom"]'::text END;
          END IF;
        WHEN 'resource'::"qti"."lom_owner" THEN
          PERFORM 1 FROM "qti"."resource_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Lom",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Lom"]'::text END;
          END IF;
        ELSE
      END CASE;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'manifest_lom'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = OLD."lom" LOOP
      CASE "p"."c2"
        WHEN 'manifest'::"qti"."lom_owner" THEN
          PERFORM 1 FROM "qti"."manifest_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Lom",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Lom"]'::text END;
          END IF;
        WHEN 'resource'::"qti"."lom_owner" THEN
          PERFORM 1 FROM "qti"."resource_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Lom",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Lom"]'::text END;
          END IF;
        ELSE
      END CASE;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = OLD."lom" LOOP
      CASE "p"."c2"
        WHEN 'manifest'::"qti"."lom_owner" THEN
          PERFORM 1 FROM "qti"."manifest_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Lom",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Lom"]'::text END;
          END IF;
        WHEN 'resource'::"qti"."lom_owner" THEN
          PERFORM 1 FROM "qti"."resource_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Lom",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Lom"]'::text END;
          END IF;
        ELSE
      END CASE;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_owner_alternatives_qipk6s5rsl"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_aikkcw5eu4"
  AFTER INSERT ON "qti"."lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_qipk6s5rsl"();

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_as4icxtbgu"
  AFTER DELETE ON "qti"."manifest_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_qipk6s5rsl"();

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_boamltns5u"
  AFTER DELETE ON "qti"."resource_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_qipk6s5rsl"();

-- The full violation query of law __lom_owner_alternatives_sglqrocoop.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c25" AS "id" FROM (SELECT "r9"."c11" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."owner", "r1"."package" FROM "qti"."lom" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'manifest'::"qti"."lom_owner") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c9" FROM (SELECT DISTINCT "r6"."c6" FROM (SELECT DISTINCT "r5"."lom", "r5"."metadata", "r5"."package" FROM "qti"."manifest_lom" AS "r5") AS "r6"("c6", "c7", "c8")) AS "r7"("c9")) AS "r8"("c10") WHERE "r8"."c10" = "r4"."c5")) AS "r9"("c11") UNION SELECT "r18"."c24" FROM (SELECT DISTINCT "r13"."c16" FROM (SELECT DISTINCT "r12"."c15" FROM (SELECT DISTINCT "r11"."c12" FROM (SELECT DISTINCT "r10"."id", "r10"."owner", "r10"."package" FROM "qti"."lom" AS "r10") AS "r11"("c12", "c13", "c14") WHERE "r11"."c13" = 'resource'::"qti"."lom_owner") AS "r12"("c15")) AS "r13"("c16") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c17" FROM (SELECT DISTINCT "r14"."lom", "r14"."metadata", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."resource_lom" AS "r14") AS "r15"("c17", "c18", "c19", "c20", "c21")) AS "r16"("c22")) AS "r17"("c23") WHERE "r17"."c23" = "r13"."c16")) AS "r18"("c24")) AS "r19"("c25")) THEN
    RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::text;
  END IF;
END
$$;
