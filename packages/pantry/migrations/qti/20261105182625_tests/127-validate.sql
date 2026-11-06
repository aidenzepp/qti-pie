-- Validate law __section_duration_target_ref_kind_section_variable_zxugkmbztr: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."section_duration_target", "qti"."section_variable_duration" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_5i443wtidx"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."ref_kind" AS "c3" FROM "qti"."section_duration_target" AS "r1" WHERE "r1"."ref" = NEW."ref" AND "r1"."test" = NEW."test" LOOP
    IF "p"."c3" = 'sectionVariable'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."section_variable_duration" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __section_duration_target_ref_kind_section_variable_zxugkmbztr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__section_duration_target_ref_kind_section_variable_zxugkmbztr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionDurationTarget",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionDurationTarget"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_5i443wtidx"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_dts7omyyed"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."ref_kind" AS "c3" FROM "qti"."section_duration_target" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'sectionVariable'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."section_variable_duration" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __section_duration_target_ref_kind_section_variable_zxugkmbztr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__section_duration_target_ref_kind_section_variable_zxugkmbztr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionDurationTarget",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionDurationTarget"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_dts7omyyed"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_section_duration_target_ref_kind_section_daityxdksk"
  AFTER INSERT ON "qti"."section_duration_target"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."ref_kind" = 'sectionVariable'::"qti"."ref_kind")
  EXECUTE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_5i443wtidx"();

CREATE CONSTRAINT TRIGGER "__law_section_duration_target_ref_kind_section_v43mud2bog"
  AFTER DELETE ON "qti"."section_variable_duration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_dts7omyyed"();

-- The full violation query of law __section_duration_target_ref_kind_section_variable_zxugkmbztr.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c18" AS "ref", "r9"."c19" AS "test" FROM (SELECT DISTINCT "r4"."c10", "r4"."c11" FROM (SELECT DISTINCT "r3"."c8", "r3"."c9" FROM (SELECT DISTINCT "r2"."c5", "r2"."c7" FROM (SELECT DISTINCT "r1"."document", "r1"."holder", "r1"."holder_kind", "r1"."prefix", "r1"."ref", "r1"."ref_kind", "r1"."test" FROM "qti"."section_duration_target" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'sectionVariable'::"qti"."ref_kind") AS "r3"("c8", "c9")) AS "r4"("c10", "c11") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c12", "r6"."c13" FROM (SELECT DISTINCT "r5"."ref", "r5"."test" FROM "qti"."section_variable_duration" AS "r5") AS "r6"("c12", "c13")) AS "r7"("c14", "c15")) AS "r8"("c16", "c17") WHERE "r8"."c16" = "r4"."c10" AND "r8"."c17" = "r4"."c11")) AS "r9"("c18", "c19")) THEN
    RAISE EXCEPTION 'law __section_duration_target_ref_kind_section_variable_zxugkmbztr is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__section_duration_target_ref_kind_section_variable_zxugkmbztr'::"pg_catalog"."text";
  END IF;
END
$$;
