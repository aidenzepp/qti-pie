-- Validate law __choice_interaction_capacity_simple_choice_ng5oqmdiif: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."choice_interaction", "qti"."simple_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_xud7umlydk"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
BEGIN
  IF TG_TABLE_NAME = 'choice_interaction'::text THEN
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."choice_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      PERFORM 1 FROM "qti"."simple_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __choice_interaction_capacity_simple_choice_ng5oqmdiif violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__choice_interaction_capacity_simple_choice_ng5oqmdiif'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ChoiceInteraction",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ChoiceInteraction"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."choice_interaction" AS "r1" WHERE "r1"."id" = OLD."interaction" LOOP
      PERFORM 1 FROM "qti"."simple_choice" AS "r1" WHERE "r1"."interaction" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __choice_interaction_capacity_simple_choice_ng5oqmdiif violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__choice_interaction_capacity_simple_choice_ng5oqmdiif'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ChoiceInteraction",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ChoiceInteraction"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_xud7umlydk"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_choice_interaction_capacity_simple_choice_b7ijoktz6e"
  AFTER INSERT ON "qti"."choice_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_xud7umlydk"();

CREATE CONSTRAINT TRIGGER "__law_choice_interaction_capacity_simple_choice_7vrtcqj77g"
  AFTER DELETE ON "qti"."simple_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_xud7umlydk"();

-- The full violation query of law __choice_interaction_capacity_simple_choice_ng5oqmdiif.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c69" AS "id" FROM (SELECT "r13"."c35" FROM (SELECT DISTINCT "r12"."c33" FROM (SELECT DISTINCT "r11"."c31", "r11"."c32" FROM (SELECT DISTINCT "r4"."c11", "r10"."c30" FROM (SELECT DISTINCT "r3"."c10" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."max_choices", "r1"."max_choices_n", "r1"."min_choices", "r1"."min_choices_n", "r1"."orientation", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."choice_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9")) AS "r3"("c10")) AS "r4"("c11"), (SELECT DISTINCT "r9"."c27", "r9"."c28" FROM (SELECT "r8"."c25", count(*) FROM (SELECT DISTINCT "r7"."c17", "r7"."c18", "r7"."c19", "r7"."c20", "r7"."c21" FROM (SELECT DISTINCT "r6"."c12", "r6"."c13", "r6"."c14", "r6"."c15", "r6"."c16" FROM (SELECT DISTINCT "r5"."fixed", "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."show_hide" FROM "qti"."simple_choice" AS "r5") AS "r6"("c12", "c13", "c14", "c15", "c16")) AS "r7"("c17", "c18", "c19", "c20", "c21")) AS "r8"("c22", "c23", "c24", "c25", "c26") GROUP BY "r8"."c25") AS "r9"("c27", "c28")) AS "r10"("c29", "c30") WHERE "r4"."c11" = "r10"."c29") AS "r11"("c31", "c32") WHERE "r11"."c32" < 1::bigint) AS "r12"("c33", "c34")) AS "r13"("c35") UNION SELECT "r26"."c68" FROM (SELECT DISTINCT "r25"."c67" FROM (SELECT DISTINCT "r24"."c66" FROM (SELECT DISTINCT "r17"."c46" FROM (SELECT DISTINCT "r16"."c45" FROM (SELECT DISTINCT "r15"."c36" FROM (SELECT DISTINCT "r14"."id", "r14"."max_choices", "r14"."max_choices_n", "r14"."min_choices", "r14"."min_choices_n", "r14"."orientation", "r14"."response_identifier", "r14"."root_kind", "r14"."shuffle" FROM "qti"."choice_interaction" AS "r14") AS "r15"("c36", "c37", "c38", "c39", "c40", "c41", "c42", "c43", "c44")) AS "r16"("c45")) AS "r17"("c46") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c62", "r22"."c63" FROM (SELECT "r21"."c60", count(*) FROM (SELECT DISTINCT "r20"."c52", "r20"."c53", "r20"."c54", "r20"."c55", "r20"."c56" FROM (SELECT DISTINCT "r19"."c47", "r19"."c48", "r19"."c49", "r19"."c50", "r19"."c51" FROM (SELECT DISTINCT "r18"."fixed", "r18"."id", "r18"."identifier", "r18"."interaction", "r18"."show_hide" FROM "qti"."simple_choice" AS "r18") AS "r19"("c47", "c48", "c49", "c50", "c51")) AS "r20"("c52", "c53", "c54", "c55", "c56")) AS "r21"("c57", "c58", "c59", "c60", "c61") GROUP BY "r21"."c60") AS "r22"("c62", "c63")) AS "r23"("c64", "c65") WHERE "r23"."c64" = "r17"."c46")) AS "r24"("c66") WHERE 0::bigint < 1::bigint) AS "r25"("c67")) AS "r26"("c68")) AS "r27"("c69")) THEN
    RAISE EXCEPTION 'law __choice_interaction_capacity_simple_choice_ng5oqmdiif is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__choice_interaction_capacity_simple_choice_ng5oqmdiif'::text;
  END IF;
END
$$;
