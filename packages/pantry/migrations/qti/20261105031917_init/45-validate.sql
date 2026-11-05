-- Validate law __choice_interaction_capacity_simple_choice_ng5oqmdiif: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."choice_interaction", "qti"."simple_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_musyfntmz7"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."choice_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."simple_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __choice_interaction_capacity_simple_choice_ng5oqmdiif violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__choice_interaction_capacity_simple_choice_ng5oqmdiif'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ChoiceInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ChoiceInteraction"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_musyfntmz7"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_atdqa5xoi4"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."choice_interaction" AS "r1" WHERE "r1"."id" = OLD."interaction" LOOP
    PERFORM 1 FROM "qti"."simple_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __choice_interaction_capacity_simple_choice_ng5oqmdiif violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__choice_interaction_capacity_simple_choice_ng5oqmdiif'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ChoiceInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ChoiceInteraction"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_atdqa5xoi4"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_choice_interaction_capacity_simple_choice_auwwxjx2eg"
  AFTER INSERT ON "qti"."choice_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_musyfntmz7"();

CREATE CONSTRAINT TRIGGER "__law_choice_interaction_capacity_simple_choice_p2qsyom5fr"
  AFTER DELETE ON "qti"."simple_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_atdqa5xoi4"();

-- The full violation query of law __choice_interaction_capacity_simple_choice_ng5oqmdiif.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c65" AS "id" FROM (SELECT "r13"."c33" FROM (SELECT DISTINCT "r12"."c31" FROM (SELECT DISTINCT "r11"."c29", "r11"."c30" FROM (SELECT DISTINCT "r4"."c9", "r10"."c28" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."orientation", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."choice_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7")) AS "r3"("c8")) AS "r4"("c9"), (SELECT DISTINCT "r9"."c25", "r9"."c26" FROM (SELECT "r8"."c23", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18", "r7"."c19" FROM (SELECT DISTINCT "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."fixed", "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."show_hide" FROM "qti"."simple_choice" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14")) AS "r7"("c15", "c16", "c17", "c18", "c19")) AS "r8"("c20", "c21", "c22", "c23", "c24") GROUP BY "r8"."c23") AS "r9"("c25", "c26")) AS "r10"("c27", "c28") WHERE "r4"."c9" = "r10"."c27") AS "r11"("c29", "c30") WHERE "r11"."c30" < 1::bigint) AS "r12"("c31", "c32")) AS "r13"("c33") UNION SELECT "r26"."c64" FROM (SELECT DISTINCT "r25"."c63" FROM (SELECT DISTINCT "r24"."c62" FROM (SELECT DISTINCT "r17"."c42" FROM (SELECT DISTINCT "r16"."c41" FROM (SELECT DISTINCT "r15"."c34" FROM (SELECT DISTINCT "r14"."id", "r14"."max_choices_n", "r14"."min_choices_n", "r14"."orientation", "r14"."response_identifier", "r14"."root_kind", "r14"."shuffle" FROM "qti"."choice_interaction" AS "r14") AS "r15"("c34", "c35", "c36", "c37", "c38", "c39", "c40")) AS "r16"("c41")) AS "r17"("c42") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c58", "r22"."c59" FROM (SELECT "r21"."c56", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c48", "r20"."c49", "r20"."c50", "r20"."c51", "r20"."c52" FROM (SELECT DISTINCT "r19"."c43", "r19"."c44", "r19"."c45", "r19"."c46", "r19"."c47" FROM (SELECT DISTINCT "r18"."fixed", "r18"."id", "r18"."identifier", "r18"."interaction", "r18"."show_hide" FROM "qti"."simple_choice" AS "r18") AS "r19"("c43", "c44", "c45", "c46", "c47")) AS "r20"("c48", "c49", "c50", "c51", "c52")) AS "r21"("c53", "c54", "c55", "c56", "c57") GROUP BY "r21"."c56") AS "r22"("c58", "c59")) AS "r23"("c60", "c61") WHERE "r23"."c60" = "r17"."c42")) AS "r24"("c62") WHERE 0::bigint < 1::bigint) AS "r25"("c63")) AS "r26"("c64")) AS "r27"("c65")) THEN
    RAISE EXCEPTION 'law __choice_interaction_capacity_simple_choice_ng5oqmdiif is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__choice_interaction_capacity_simple_choice_ng5oqmdiif'::"pg_catalog"."text";
  END IF;
END
$$;
