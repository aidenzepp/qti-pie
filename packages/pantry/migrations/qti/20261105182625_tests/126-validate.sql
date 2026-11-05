-- Validate law __section_duration_target_ref_kind_section_duration_52rkc7bjf7: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."section_duration_ref", "qti"."section_duration_target" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_3xs4mtudd5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."section_duration_ref" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."document" = OLD."document" AND "r1"."prefix" = OLD."prefix";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2" FROM "qti"."section_duration_target" AS "r1" WHERE "r1"."ref" = OLD."id" AND "r1"."document" = OLD."document" AND "r1"."prefix" = OLD."prefix" AND "r1"."ref_kind" = 'sectionDuration'::"qti"."ref_kind" ORDER BY "r1"."ref", "r1"."test" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __section_duration_target_ref_kind_section_duration_52rkc7bjf7 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__section_duration_target_ref_kind_section_duration_52rkc7bjf7'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionDurationTarget",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionDurationTarget"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_3xs4mtudd5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_ppo6ygqm2b"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."section_duration_ref" AS "r1" WHERE "r1"."id" = NEW."ref" AND "r1"."document" = NEW."document" AND "r1"."prefix" = NEW."prefix";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2" FROM "qti"."section_duration_target" AS "r1" WHERE "r1"."ref" = NEW."ref" AND "r1"."document" = NEW."document" AND "r1"."prefix" = NEW."prefix" AND "r1"."ref_kind" = 'sectionDuration'::"qti"."ref_kind" ORDER BY "r1"."ref", "r1"."test" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __section_duration_target_ref_kind_section_duration_52rkc7bjf7 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__section_duration_target_ref_kind_section_duration_52rkc7bjf7'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionDurationTarget",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionDurationTarget"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_ppo6ygqm2b"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_section_duration_target_ref_kind_section_g2lolbwn4q"
  AFTER DELETE ON "qti"."section_duration_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_3xs4mtudd5"();

CREATE CONSTRAINT TRIGGER "__law_section_duration_target_ref_kind_section_wzsvv3oafk"
  AFTER INSERT ON "qti"."section_duration_target"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."ref_kind" = 'sectionDuration'::"qti"."ref_kind")
  EXECUTE FUNCTION "qti"."__law_section_duration_target_ref_kind_section_ppo6ygqm2b"();

-- The full violation query of law __section_duration_target_ref_kind_section_duration_52rkc7bjf7.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c24" AS "ref", "r9"."c25" AS "document", "r9"."c26" AS "prefix" FROM (SELECT DISTINCT "r4"."c11", "r4"."c12", "r4"."c13" FROM (SELECT DISTINCT "r3"."c8", "r3"."c9", "r3"."c10"::"qti"."__text_rhdrzkabze" FROM (SELECT DISTINCT "r2"."c5", "r2"."c1", "r2"."c4" FROM (SELECT DISTINCT "r1"."document", "r1"."holder", "r1"."holder_kind", "r1"."prefix", "r1"."ref", "r1"."ref_kind", "r1"."test" FROM "qti"."section_duration_target" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'sectionDuration'::"qti"."ref_kind") AS "r3"("c8", "c9", "c10")) AS "r4"("c11", "c12", "c13") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c18", "r7"."c19", "r7"."c20"::"qti"."__text_rhdrzkabze" FROM (SELECT DISTINCT "r6"."c15", "r6"."c14", "r6"."c16" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."prefix", "r5"."root" FROM "qti"."section_duration_ref" AS "r5") AS "r6"("c14", "c15", "c16", "c17")) AS "r7"("c18", "c19", "c20")) AS "r8"("c21", "c22", "c23") WHERE "r8"."c21" = "r4"."c11" AND "r8"."c22" = "r4"."c12" AND "r8"."c23" = "r4"."c13")) AS "r9"("c24", "c25", "c26")) THEN
    RAISE EXCEPTION 'law __section_duration_target_ref_kind_section_duration_52rkc7bjf7 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__section_duration_target_ref_kind_section_duration_52rkc7bjf7'::"pg_catalog"."text";
  END IF;
END
$$;
