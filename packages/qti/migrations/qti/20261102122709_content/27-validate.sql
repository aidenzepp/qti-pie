-- Validate law __graphic_order_interaction_max_bound_bounded_nsuybbcrym: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."graphic_order_interaction", "qti"."hotspot_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_z6zs7absnm"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'graphic_order_interaction'::text THEN
    IF NEW."max_bound" = 'bounded'::"qti"."bound" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."graphic_order_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c3" = 'bounded'::"qti"."bound" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."hotspot_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
            IF "g"."c1" < "t"."c2"::bigint THEN
              RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_nsuybbcrym violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_nsuybbcrym'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GraphicOrderInteraction",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["GraphicOrderInteraction"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min_choices_n" AS "c2", "r1"."max_bound" AS "c3" FROM "qti"."graphic_order_interaction" AS "r1" WHERE "r1"."id" = OLD."interaction" LOOP
      IF "t"."c3" = 'bounded'::"qti"."bound" THEN
        FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."hotspot_choice" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
          IF "g"."c1" < "t"."c2"::bigint THEN
            RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_nsuybbcrym violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_nsuybbcrym'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GraphicOrderInteraction",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["GraphicOrderInteraction"]'::text END;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_z6zs7absnm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_graphic_order_interaction_max_bound_bounded_43ik4qaty2"
  AFTER INSERT ON "qti"."graphic_order_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_z6zs7absnm"();

CREATE CONSTRAINT TRIGGER "__law_graphic_order_interaction_max_bound_bounded_mgiluag45e"
  AFTER DELETE ON "qti"."hotspot_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_graphic_order_interaction_max_bound_bounded_z6zs7absnm"();

-- The full violation query of law __graphic_order_interaction_max_bound_bounded_nsuybbcrym.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c65" AS "id" FROM (SELECT "r13"."c33" FROM (SELECT DISTINCT "r12"."c30" FROM (SELECT DISTINCT "r11"."c27", "r11"."c28", "r11"."c29" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10", "r10"."c26" FROM (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c1", "r2"."c4" FROM (SELECT DISTINCT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind" FROM "qti"."graphic_order_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c2" = 'bounded'::"qti"."bound") AS "r3"("c7", "c8")) AS "r4"("c9", "c10"), (SELECT DISTINCT "r9"."c23", "r9"."c24" FROM (SELECT "r8"."c21", count(*) FROM (SELECT DISTINCT "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."shape" FROM "qti"."hotspot_choice" AS "r5") AS "r6"("c11", "c12", "c13", "c14")) AS "r7"("c15", "c16", "c17", "c18")) AS "r8"("c19", "c20", "c21", "c22") GROUP BY "r8"."c21") AS "r9"("c23", "c24")) AS "r10"("c25", "c26") WHERE "r4"."c9" = "r10"."c25") AS "r11"("c27", "c28", "c29") WHERE "r11"."c29" < "r11"."c28") AS "r12"("c30", "c31", "c32")) AS "r13"("c33") UNION SELECT "r26"."c64" FROM (SELECT DISTINCT "r25"."c62" FROM (SELECT DISTINCT "r24"."c60", "r24"."c61" FROM (SELECT DISTINCT "r17"."c42", "r17"."c43" FROM (SELECT DISTINCT "r16"."c40", "r16"."c41" FROM (SELECT DISTINCT "r15"."c34", "r15"."c37" FROM (SELECT DISTINCT "r14"."id", "r14"."max_bound", "r14"."max_choices_n", "r14"."min_choices_n", "r14"."response_identifier", "r14"."root_kind" FROM "qti"."graphic_order_interaction" AS "r14") AS "r15"("c34", "c35", "c36", "c37", "c38", "c39") WHERE "r15"."c35" = 'bounded'::"qti"."bound") AS "r16"("c40", "c41")) AS "r17"("c42", "c43") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c56", "r22"."c57" FROM (SELECT "r21"."c54", count(*) FROM (SELECT DISTINCT "r20"."c48", "r20"."c49", "r20"."c50", "r20"."c51" FROM (SELECT DISTINCT "r19"."c44", "r19"."c45", "r19"."c46", "r19"."c47" FROM (SELECT DISTINCT "r18"."id", "r18"."identifier", "r18"."interaction", "r18"."shape" FROM "qti"."hotspot_choice" AS "r18") AS "r19"("c44", "c45", "c46", "c47")) AS "r20"("c48", "c49", "c50", "c51")) AS "r21"("c52", "c53", "c54", "c55") GROUP BY "r21"."c54") AS "r22"("c56", "c57")) AS "r23"("c58", "c59") WHERE "r23"."c58" = "r17"."c42")) AS "r24"("c60", "c61") WHERE 0::bigint < "r24"."c61") AS "r25"("c62", "c63")) AS "r26"("c64")) AS "r27"("c65")) THEN
    RAISE EXCEPTION 'law __graphic_order_interaction_max_bound_bounded_nsuybbcrym is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__graphic_order_interaction_max_bound_bounded_nsuybbcrym'::text;
  END IF;
END
$$;
