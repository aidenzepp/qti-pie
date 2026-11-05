-- Validate law __inline_choice_interaction_capacity_inline_choice_42ny6gmcyf: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."inline_choice", "qti"."inline_choice_interaction" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_inline_choice_interaction_capacity_inline_3cbsli6oe4"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."inline_choice_interaction" AS "r1" WHERE "r1"."id" = OLD."interaction" LOOP
    PERFORM 1 FROM "qti"."inline_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __inline_choice_interaction_capacity_inline_choice_42ny6gmcyf violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__inline_choice_interaction_capacity_inline_choice_42ny6gmcyf'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["InlineChoiceInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["InlineChoiceInteraction"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_inline_choice_interaction_capacity_inline_3cbsli6oe4"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_inline_choice_interaction_capacity_inline_fy53rpka63"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."inline_choice_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."inline_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __inline_choice_interaction_capacity_inline_choice_42ny6gmcyf violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__inline_choice_interaction_capacity_inline_choice_42ny6gmcyf'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["InlineChoiceInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["InlineChoiceInteraction"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_inline_choice_interaction_capacity_inline_fy53rpka63"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_inline_choice_interaction_capacity_inline_66mpemvdfe"
  AFTER DELETE ON "qti"."inline_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_inline_choice_interaction_capacity_inline_3cbsli6oe4"();

CREATE CONSTRAINT TRIGGER "__law_inline_choice_interaction_capacity_inline_cayrth5nkw"
  AFTER INSERT ON "qti"."inline_choice_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_inline_choice_interaction_capacity_inline_fy53rpka63"();

-- The full violation query of law __inline_choice_interaction_capacity_inline_choice_42ny6gmcyf.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c42" AS "id" FROM (WITH "r4"("c8") AS MATERIALIZED (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."min_choices", "r1"."required", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."inline_choice_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")), "r12"("c27", "c28") AS MATERIALIZED (SELECT DISTINCT "r11"."c25", "r11"."c26" FROM (SELECT "r10"."c23", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c15", "r9"."c16", "r9"."c17", "r9"."c18", "r9"."c19" FROM (SELECT DISTINCT "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13", "r8"."c14" FROM (SELECT DISTINCT "r7"."fixed", "r7"."id", "r7"."identifier", "r7"."interaction", "r7"."show_hide" FROM "qti"."inline_choice" AS "r7") AS "r8"("c10", "c11", "c12", "c13", "c14")) AS "r9"("c15", "c16", "c17", "c18", "c19")) AS "r10"("c20", "c21", "c22", "c23", "c24") GROUP BY "r10"."c23") AS "r11"("c25", "c26")) SELECT "r17"."c35" FROM (SELECT DISTINCT "r16"."c33" FROM (SELECT DISTINCT "r15"."c31", "r15"."c32" FROM (SELECT DISTINCT "r6"."c9", "r14"."c30" FROM (SELECT "r5"."c8" FROM "r4" AS "r5") AS "r6"("c9"), (SELECT "r13"."c27", "r13"."c28" FROM "r12" AS "r13") AS "r14"("c29", "c30") WHERE "r6"."c9" = "r14"."c29") AS "r15"("c31", "c32") WHERE "r15"."c32" < 1::bigint) AS "r16"("c33", "c34")) AS "r17"("c35") UNION SELECT "r24"."c41" FROM (SELECT DISTINCT "r23"."c40" FROM (SELECT DISTINCT "r22"."c39" FROM (SELECT DISTINCT "r19"."c36" FROM (SELECT "r18"."c8" FROM "r4" AS "r18") AS "r19"("c36") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c27", "r20"."c28" FROM "r12" AS "r20") AS "r21"("c37", "c38") WHERE "r21"."c37" = "r19"."c36")) AS "r22"("c39") WHERE 0::bigint < 1::bigint) AS "r23"("c40")) AS "r24"("c41")) AS "r25"("c42")) THEN
    RAISE EXCEPTION 'law __inline_choice_interaction_capacity_inline_choice_42ny6gmcyf is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__inline_choice_interaction_capacity_inline_choice_42ny6gmcyf'::"pg_catalog"."text";
  END IF;
END
$$;
