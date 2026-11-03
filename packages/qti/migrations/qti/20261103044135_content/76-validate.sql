-- Validate law __declaration_kind_template_in_template_declaration_43olusrqz4: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declaration", "qti"."template_declaration_arm" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_kind_template_in_template_tjl3isp2qr"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'declaration'::text THEN
    IF NEW."kind" = 'template'::"qti"."declaration_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'template'::"qti"."declaration_kind" THEN
          PERFORM 1 FROM "qti"."template_declaration_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __declaration_kind_template_in_template_declaration_43olusrqz4 violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__declaration_kind_template_in_template_declaration_43olusrqz4'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Declaration",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Declaration"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'template'::"qti"."declaration_kind" THEN
        PERFORM 1 FROM "qti"."template_declaration_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __declaration_kind_template_in_template_declaration_43olusrqz4 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__declaration_kind_template_in_template_declaration_43olusrqz4'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Declaration",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Declaration"]'::text END;
        END IF;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_kind_template_in_template_tjl3isp2qr"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declaration_kind_template_in_template_5ywwd56hgj"
  AFTER INSERT ON "qti"."declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_kind_template_in_template_tjl3isp2qr"();

CREATE CONSTRAINT TRIGGER "__law_declaration_kind_template_in_template_7w7fhm6ey7"
  AFTER DELETE ON "qti"."template_declaration_arm"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_kind_template_in_template_tjl3isp2qr"();

-- The full violation query of law __declaration_kind_template_in_template_declaration_43olusrqz4.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c13" AS "id" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape" FROM "qti"."declaration" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'template'::"qti"."declaration_kind") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."id", "r5"."math_variable", "r5"."param_variable" FROM "qti"."template_declaration_arm" AS "r5") AS "r6"("c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c7")) AS "r9"("c13")) THEN
    RAISE EXCEPTION 'law __declaration_kind_template_in_template_declaration_43olusrqz4 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__declaration_kind_template_in_template_declaration_43olusrqz4'::text;
  END IF;
END
$$;
