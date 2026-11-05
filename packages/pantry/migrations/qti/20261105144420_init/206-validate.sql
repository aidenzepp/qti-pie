-- Validate law __graphic_order_interaction_max_bound_bounded_mv5y4sfljs: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."graphic_order_interaction", "qti"."hotspot_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_kwotlvw5x5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."max_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."graphic_order_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c3" = 'bounded'::"qti"."bound" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."hotspot_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_mv5y4sfljs violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_mv5y4sfljs'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["GraphicOrderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["GraphicOrderInteraction"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_kwotlvw5x5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_cdxms7ns7e"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."max_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."graphic_order_interaction" AS "r1" WHERE "r1"."id" = OLD."interaction" LOOP
    IF "t"."c3" = 'bounded'::"qti"."bound" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."hotspot_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_mv5y4sfljs violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_mv5y4sfljs'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["GraphicOrderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["GraphicOrderInteraction"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_cdxms7ns7e"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_graphic_order_interaction_max_bound_bounded_65kmr5myry"
  AFTER INSERT ON "qti"."graphic_order_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."max_bound" = 'bounded'::"qti"."bound")
  EXECUTE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_kwotlvw5x5"();

CREATE CONSTRAINT TRIGGER "__law_graphic_order_interaction_max_bound_bounded_tkqsw5d3xk"
  AFTER DELETE ON "qti"."hotspot_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_cdxms7ns7e"();

-- The full violation query of law __graphic_order_interaction_max_bound_bounded_mv5y4sfljs.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c50" AS "id" FROM (WITH "r4"("c9", "c10") AS MATERIALIZED (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind" FROM "qti"."graphic_order_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c2" = 'bounded'::"qti"."bound") AS "r3"("c7", "c8")), "r12"("c30", "c31") AS MATERIALIZED (SELECT DISTINCT "r11"."c28", "r11"."c29" FROM (SELECT "r10"."c25", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c18", "r9"."c19", "r9"."c20", "r9"."c21", "r9"."c22" FROM (SELECT DISTINCT "r8"."c13", "r8"."c14", "r8"."c15", "r8"."c16", "r8"."c17" FROM (SELECT DISTINCT "r7"."id", "r7"."identifier", "r7"."interaction", "r7"."shape", "r7"."show_hide" FROM "qti"."hotspot_choice" AS "r7") AS "r8"("c13", "c14", "c15", "c16", "c17")) AS "r9"("c18", "c19", "c20", "c21", "c22")) AS "r10"("c23", "c24", "c25", "c26", "c27") GROUP BY "r10"."c25") AS "r11"("c28", "c29")) SELECT "r17"."c40" FROM (SELECT DISTINCT "r16"."c37" FROM (SELECT DISTINCT "r15"."c34", "r15"."c35", "r15"."c36" FROM (SELECT DISTINCT "r6"."c11", "r6"."c12", "r14"."c33" FROM (SELECT "r5"."c9", "r5"."c10" FROM "r4" AS "r5") AS "r6"("c11", "c12"), (SELECT "r13"."c30", "r13"."c31" FROM "r12" AS "r13") AS "r14"("c32", "c33") WHERE "r6"."c11" = "r14"."c32") AS "r15"("c34", "c35", "c36") WHERE "r15"."c36" < "r15"."c35") AS "r16"("c37", "c38", "c39")) AS "r17"("c40") UNION SELECT "r24"."c49" FROM (SELECT DISTINCT "r23"."c47" FROM (SELECT DISTINCT "r22"."c45", "r22"."c46" FROM (SELECT DISTINCT "r19"."c41", "r19"."c42" FROM (SELECT "r18"."c9", "r18"."c10" FROM "r4" AS "r18") AS "r19"("c41", "c42") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c30", "r20"."c31" FROM "r12" AS "r20") AS "r21"("c43", "c44") WHERE "r21"."c43" = "r19"."c41")) AS "r22"("c45", "c46") WHERE 0::bigint < "r22"."c46") AS "r23"("c47", "c48")) AS "r24"("c49")) AS "r25"("c50")) THEN
    RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_mv5y4sfljs is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_mv5y4sfljs'::"pg_catalog"."text";
  END IF;
END
$$;
