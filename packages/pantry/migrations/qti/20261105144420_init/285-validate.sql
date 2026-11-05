-- Validate law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_identifier", "qti"."resource_lom_identified" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_nd4kvpbxly"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1" FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = OLD."lom" LOOP
    PERFORM 1 FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__resource_lom_identified_capacity_lom_identifier_7pnhbhckku'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomIdentified",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomIdentified"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_nd4kvpbxly"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_h7n7ofolbs"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1" FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    PERFORM 1 FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__resource_lom_identified_capacity_lom_identifier_7pnhbhckku'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomIdentified",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomIdentified"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_h7n7ofolbs"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_resource_lom_identified_capacity_lom_lisqaeq5fs"
  AFTER DELETE ON "qti"."lom_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_nd4kvpbxly"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_identified_capacity_lom_6tlumotyrg"
  AFTER INSERT ON "qti"."resource_lom_identified"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_h7n7ofolbs"();

-- The full violation query of law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c40" AS "lom" FROM (WITH "r4"("c6") AS MATERIALIZED (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_identified" AS "r1") AS "r2"("c1", "c2", "c3", "c4")) AS "r3"("c5")), "r12"("c25", "c26") AS MATERIALIZED (SELECT DISTINCT "r11"."c23", "r11"."c24" FROM (SELECT "r10"."c19", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c13", "r9"."c14", "r9"."c15", "r9"."c16", "r9"."c17" FROM (SELECT DISTINCT "r8"."c8", "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12" FROM (SELECT DISTINCT "r7"."id", "r7"."lom", "r7"."owner", "r7"."parent", "r7"."position" FROM "qti"."lom_identifier" AS "r7") AS "r8"("c8", "c9", "c10", "c11", "c12")) AS "r9"("c13", "c14", "c15", "c16", "c17")) AS "r10"("c18", "c19", "c20", "c21", "c22") GROUP BY "r10"."c19") AS "r11"("c23", "c24")) SELECT "r17"."c33" FROM (SELECT DISTINCT "r16"."c31" FROM (SELECT DISTINCT "r15"."c29", "r15"."c30" FROM (SELECT DISTINCT "r6"."c7", "r14"."c28" FROM (SELECT "r5"."c6" FROM "r4" AS "r5") AS "r6"("c7"), (SELECT "r13"."c25", "r13"."c26" FROM "r12" AS "r13") AS "r14"("c27", "c28") WHERE "r6"."c7" = "r14"."c27") AS "r15"("c29", "c30") WHERE "r15"."c30" < 1::bigint) AS "r16"("c31", "c32")) AS "r17"("c33") UNION SELECT "r24"."c39" FROM (SELECT DISTINCT "r23"."c38" FROM (SELECT DISTINCT "r22"."c37" FROM (SELECT DISTINCT "r19"."c34" FROM (SELECT "r18"."c6" FROM "r4" AS "r18") AS "r19"("c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c25", "r20"."c26" FROM "r12" AS "r20") AS "r21"("c35", "c36") WHERE "r21"."c35" = "r19"."c34")) AS "r22"("c37") WHERE 0::bigint < 1::bigint) AS "r23"("c38")) AS "r24"("c39")) AS "r25"("c40")) THEN
    RAISE EXCEPTION 'law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_identified_capacity_lom_identifier_7pnhbhckku'::"pg_catalog"."text";
  END IF;
END
$$;
