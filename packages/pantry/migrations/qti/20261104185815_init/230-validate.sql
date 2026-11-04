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
  IF EXISTS (SELECT "r27"."c63" AS "id" FROM (SELECT "r13"."c32" FROM (SELECT DISTINCT "r12"."c30" FROM (SELECT DISTINCT "r11"."c28", "r11"."c29" FROM (SELECT DISTINCT "r4"."c8", "r10"."c27" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."min_choices", "r1"."required", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."inline_choice_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")) AS "r4"("c8"), (SELECT DISTINCT "r9"."c24", "r9"."c25" FROM (SELECT "r8"."c22", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c14", "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13" FROM (SELECT DISTINCT "r5"."fixed", "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."show_hide" FROM "qti"."inline_choice" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13")) AS "r7"("c14", "c15", "c16", "c17", "c18")) AS "r8"("c19", "c20", "c21", "c22", "c23") GROUP BY "r8"."c22") AS "r9"("c24", "c25")) AS "r10"("c26", "c27") WHERE "r4"."c8" = "r10"."c26") AS "r11"("c28", "c29") WHERE "r11"."c29" < 1::bigint) AS "r12"("c30", "c31")) AS "r13"("c32") UNION SELECT "r26"."c62" FROM (SELECT DISTINCT "r25"."c61" FROM (SELECT DISTINCT "r24"."c60" FROM (SELECT DISTINCT "r17"."c40" FROM (SELECT DISTINCT "r16"."c39" FROM (SELECT DISTINCT "r15"."c33" FROM (SELECT DISTINCT "r14"."id", "r14"."min_choices", "r14"."required", "r14"."response_identifier", "r14"."root_kind", "r14"."shuffle" FROM "qti"."inline_choice_interaction" AS "r14") AS "r15"("c33", "c34", "c35", "c36", "c37", "c38")) AS "r16"("c39")) AS "r17"("c40") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c56", "r22"."c57" FROM (SELECT "r21"."c54", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c46", "r20"."c47", "r20"."c48", "r20"."c49", "r20"."c50" FROM (SELECT DISTINCT "r19"."c41", "r19"."c42", "r19"."c43", "r19"."c44", "r19"."c45" FROM (SELECT DISTINCT "r18"."fixed", "r18"."id", "r18"."identifier", "r18"."interaction", "r18"."show_hide" FROM "qti"."inline_choice" AS "r18") AS "r19"("c41", "c42", "c43", "c44", "c45")) AS "r20"("c46", "c47", "c48", "c49", "c50")) AS "r21"("c51", "c52", "c53", "c54", "c55") GROUP BY "r21"."c54") AS "r22"("c56", "c57")) AS "r23"("c58", "c59") WHERE "r23"."c58" = "r17"."c40")) AS "r24"("c60") WHERE 0::bigint < 1::bigint) AS "r25"("c61")) AS "r26"("c62")) AS "r27"("c63")) THEN
    RAISE EXCEPTION 'law __inline_choice_interaction_capacity_inline_choice_42ny6gmcyf is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__inline_choice_interaction_capacity_inline_choice_42ny6gmcyf'::"pg_catalog"."text";
  END IF;
END
$$;
