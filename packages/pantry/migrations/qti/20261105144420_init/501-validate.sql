-- Validate law __order_interaction_max_bound_bounded_capacity_6p47x6pzn3: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."order_interaction", "qti"."simple_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_order_interaction_max_bound_bounded_capacity_2ckzqq3vsk"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."order_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c3" = 'bounded'::"qti"."bound" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."simple_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."simple_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __order_interaction_max_bound_bounded_capacity_6p47x6pzn3 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__order_interaction_max_bound_bounded_capacity_6p47x6pzn3'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["OrderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["OrderInteraction"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_order_interaction_max_bound_bounded_capacity_2ckzqq3vsk"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_order_interaction_max_bound_bounded_capacity_kz5bfo6uyo"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."order_interaction" AS "r1" WHERE "r1"."id" = OLD."interaction" LOOP
    IF "t"."c3" = 'bounded'::"qti"."bound" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."simple_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."simple_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __order_interaction_max_bound_bounded_capacity_6p47x6pzn3 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__order_interaction_max_bound_bounded_capacity_6p47x6pzn3'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["OrderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["OrderInteraction"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_order_interaction_max_bound_bounded_capacity_kz5bfo6uyo"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_order_interaction_max_bound_bounded_capacity_yftngpekfq"
  AFTER INSERT ON "qti"."order_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."max_bound" = 'bounded'::"qti"."bound")
  EXECUTE FUNCTION "qti"."__law_order_interaction_max_bound_bounded_capacity_2ckzqq3vsk"();

CREATE CONSTRAINT TRIGGER "__law_order_interaction_max_bound_bounded_capacity_uyw77al2wu"
  AFTER DELETE ON "qti"."simple_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_order_interaction_max_bound_bounded_capacity_kz5bfo6uyo"();

-- The full violation query of law __order_interaction_max_bound_bounded_capacity_6p47x6pzn3.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c51" AS "id" FROM (WITH "r4"("c10", "c11") AS MATERIALIZED (SELECT DISTINCT "r3"."c8", "r3"."c9" FROM (SELECT DISTINCT "r2"."c1", "r2"."c4" FROM (SELECT DISTINCT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."order_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c2" = 'bounded'::"qti"."bound") AS "r3"("c8", "c9")), "r12"("c31", "c32") AS MATERIALIZED (SELECT DISTINCT "r11"."c29", "r11"."c30" FROM (SELECT "r10"."c27", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c19", "r9"."c20", "r9"."c21", "r9"."c22", "r9"."c23" FROM (SELECT DISTINCT "r8"."c14", "r8"."c15", "r8"."c16", "r8"."c17", "r8"."c18" FROM (SELECT DISTINCT "r7"."fixed", "r7"."id", "r7"."identifier", "r7"."interaction", "r7"."show_hide" FROM "qti"."simple_choice" AS "r7") AS "r8"("c14", "c15", "c16", "c17", "c18")) AS "r9"("c19", "c20", "c21", "c22", "c23")) AS "r10"("c24", "c25", "c26", "c27", "c28") GROUP BY "r10"."c27") AS "r11"("c29", "c30")) SELECT "r17"."c41" FROM (SELECT DISTINCT "r16"."c38" FROM (SELECT DISTINCT "r15"."c35", "r15"."c36", "r15"."c37" FROM (SELECT DISTINCT "r6"."c12", "r6"."c13", "r14"."c34" FROM (SELECT "r5"."c10", "r5"."c11" FROM "r4" AS "r5") AS "r6"("c12", "c13"), (SELECT "r13"."c31", "r13"."c32" FROM "r12" AS "r13") AS "r14"("c33", "c34") WHERE "r6"."c12" = "r14"."c33") AS "r15"("c35", "c36", "c37") WHERE "r15"."c37" < "r15"."c36") AS "r16"("c38", "c39", "c40")) AS "r17"("c41") UNION SELECT "r24"."c50" FROM (SELECT DISTINCT "r23"."c48" FROM (SELECT DISTINCT "r22"."c46", "r22"."c47" FROM (SELECT DISTINCT "r19"."c42", "r19"."c43" FROM (SELECT "r18"."c10", "r18"."c11" FROM "r4" AS "r18") AS "r19"("c42", "c43") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c31", "r20"."c32" FROM "r12" AS "r20") AS "r21"("c44", "c45") WHERE "r21"."c44" = "r19"."c42")) AS "r22"("c46", "c47") WHERE 0::bigint < "r22"."c47") AS "r23"("c48", "c49")) AS "r24"("c50")) AS "r25"("c51")) THEN
    RAISE EXCEPTION 'law __order_interaction_max_bound_bounded_capacity_6p47x6pzn3 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__order_interaction_max_bound_bounded_capacity_6p47x6pzn3'::"pg_catalog"."text";
  END IF;
END
$$;
