-- Validate law __variable_ref_kind_alternatives_5tghedigzl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."built_in_ref", "qti"."declared_ref", "qti"."variable_ref" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_cshuhfsw2k"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'variable_ref'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'declared'::"qti"."ref_kind" THEN
          PERFORM 1 FROM "qti"."declared_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["VariableRef",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["VariableRef"]'::text END;
          END IF;
        WHEN 'builtIn'::"qti"."ref_kind" THEN
          PERFORM 1 FROM "qti"."built_in_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["VariableRef",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["VariableRef"]'::text END;
          END IF;
        ELSE
      END CASE;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_ref'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'declared'::"qti"."ref_kind" THEN
          PERFORM 1 FROM "qti"."declared_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["VariableRef",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["VariableRef"]'::text END;
          END IF;
        WHEN 'builtIn'::"qti"."ref_kind" THEN
          PERFORM 1 FROM "qti"."built_in_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["VariableRef",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["VariableRef"]'::text END;
          END IF;
        ELSE
      END CASE;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'declared'::"qti"."ref_kind" THEN
          PERFORM 1 FROM "qti"."declared_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["VariableRef",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["VariableRef"]'::text END;
          END IF;
        WHEN 'builtIn'::"qti"."ref_kind" THEN
          PERFORM 1 FROM "qti"."built_in_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["VariableRef",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["VariableRef"]'::text END;
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_cshuhfsw2k"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_3bicjdpx43"
  AFTER DELETE ON "qti"."built_in_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_cshuhfsw2k"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_mz5n3vslds"
  AFTER DELETE ON "qti"."declared_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_cshuhfsw2k"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_do3v5z4ehq"
  AFTER INSERT ON "qti"."variable_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_cshuhfsw2k"();

-- The full violation query of law __variable_ref_kind_alternatives_5tghedigzl.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c22" AS "id" FROM (SELECT "r9"."c11" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."kind" FROM "qti"."variable_ref" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c3" = 'declared'::"qti"."ref_kind") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c9" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."identifier" FROM "qti"."declared_ref" AS "r5") AS "r6"("c6", "c7", "c8")) AS "r7"("c9")) AS "r8"("c10") WHERE "r8"."c10" = "r4"."c5")) AS "r9"("c11") UNION SELECT "r18"."c21" FROM (SELECT DISTINCT "r13"."c16" FROM (SELECT DISTINCT "r12"."c15" FROM (SELECT DISTINCT "r11"."c13" FROM (SELECT DISTINCT "r10"."document", "r10"."id", "r10"."kind" FROM "qti"."variable_ref" AS "r10") AS "r11"("c12", "c13", "c14") WHERE "r11"."c14" = 'builtIn'::"qti"."ref_kind") AS "r12"("c15")) AS "r13"("c16") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c19" FROM (SELECT DISTINCT "r15"."c17" FROM (SELECT DISTINCT "r14"."id", "r14"."name" FROM "qti"."built_in_ref" AS "r14") AS "r15"("c17", "c18")) AS "r16"("c19")) AS "r17"("c20") WHERE "r17"."c20" = "r13"."c16")) AS "r18"("c21")) AS "r19"("c22")) THEN
    RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::text;
  END IF;
END
$$;
