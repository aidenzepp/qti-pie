-- Validate law __graphic_order_interaction_max_bound_bounded_nsuybbcrym: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."graphic_order_interaction", "qti"."hotspot_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_z5qwbksd2o"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."graphic_order_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c3" = 'bounded'::"qti"."bound" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."hotspot_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_nsuybbcrym violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_nsuybbcrym'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["GraphicOrderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["GraphicOrderInteraction"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_z5qwbksd2o"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_ipvtkxa4ld"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."graphic_order_interaction" AS "r1" WHERE "r1"."id" = OLD."interaction" LOOP
    IF "t"."c3" = 'bounded'::"qti"."bound" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."hotspot_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_nsuybbcrym violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_nsuybbcrym'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["GraphicOrderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["GraphicOrderInteraction"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_ipvtkxa4ld"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_graphic_order_interaction_max_bound_bounded_xlddgd7kbz"
  AFTER INSERT ON "qti"."graphic_order_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."max_bound" = 'bounded'::"qti"."bound")
  EXECUTE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_z5qwbksd2o"();

CREATE CONSTRAINT TRIGGER "__law_graphic_order_interaction_max_bound_bounded_sv5usx6foo"
  AFTER DELETE ON "qti"."hotspot_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_ipvtkxa4ld"();

-- The full violation query of law __graphic_order_interaction_max_bound_bounded_nsuybbcrym.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c71" AS "id" FROM (SELECT "r13"."c36" FROM (SELECT DISTINCT "r12"."c33" FROM (SELECT DISTINCT "r11"."c30", "r11"."c31", "r11"."c32" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10", "r10"."c29" FROM (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c1", "r2"."c4" FROM (SELECT DISTINCT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind" FROM "qti"."graphic_order_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c2" = 'bounded'::"qti"."bound") AS "r3"("c7", "c8")) AS "r4"("c9", "c10"), (SELECT DISTINCT "r9"."c26", "r9"."c27" FROM (SELECT "r8"."c23", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c16", "r7"."c17", "r7"."c18", "r7"."c19", "r7"."c20" FROM (SELECT DISTINCT "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14", "r6"."c15" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."shape", "r5"."show_hide" FROM "qti"."hotspot_choice" AS "r5") AS "r6"("c11", "c12", "c13", "c14", "c15")) AS "r7"("c16", "c17", "c18", "c19", "c20")) AS "r8"("c21", "c22", "c23", "c24", "c25") GROUP BY "r8"."c23") AS "r9"("c26", "c27")) AS "r10"("c28", "c29") WHERE "r4"."c9" = "r10"."c28") AS "r11"("c30", "c31", "c32") WHERE "r11"."c32" < "r11"."c31") AS "r12"("c33", "c34", "c35")) AS "r13"("c36") UNION SELECT "r26"."c70" FROM (SELECT DISTINCT "r25"."c68" FROM (SELECT DISTINCT "r24"."c66", "r24"."c67" FROM (SELECT DISTINCT "r17"."c45", "r17"."c46" FROM (SELECT DISTINCT "r16"."c43", "r16"."c44" FROM (SELECT DISTINCT "r15"."c37", "r15"."c40" FROM (SELECT DISTINCT "r14"."id", "r14"."max_bound", "r14"."max_choices_n", "r14"."min_choices_n", "r14"."response_identifier", "r14"."root_kind" FROM "qti"."graphic_order_interaction" AS "r14") AS "r15"("c37", "c38", "c39", "c40", "c41", "c42") WHERE "r15"."c38" = 'bounded'::"qti"."bound") AS "r16"("c43", "c44")) AS "r17"("c45", "c46") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c62", "r22"."c63" FROM (SELECT "r21"."c59", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c52", "r20"."c53", "r20"."c54", "r20"."c55", "r20"."c56" FROM (SELECT DISTINCT "r19"."c47", "r19"."c48", "r19"."c49", "r19"."c50", "r19"."c51" FROM (SELECT DISTINCT "r18"."id", "r18"."identifier", "r18"."interaction", "r18"."shape", "r18"."show_hide" FROM "qti"."hotspot_choice" AS "r18") AS "r19"("c47", "c48", "c49", "c50", "c51")) AS "r20"("c52", "c53", "c54", "c55", "c56")) AS "r21"("c57", "c58", "c59", "c60", "c61") GROUP BY "r21"."c59") AS "r22"("c62", "c63")) AS "r23"("c64", "c65") WHERE "r23"."c64" = "r17"."c45")) AS "r24"("c66", "c67") WHERE 0::bigint < "r24"."c67") AS "r25"("c68", "c69")) AS "r26"("c70")) AS "r27"("c71")) THEN
    RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_nsuybbcrym is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_nsuybbcrym'::"pg_catalog"."text";
  END IF;
END
$$;
