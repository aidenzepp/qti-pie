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
  IF EXISTS (SELECT "r27"."c59" AS "lom" FROM (SELECT "r13"."c30" FROM (SELECT DISTINCT "r12"."c28" FROM (SELECT DISTINCT "r11"."c26", "r11"."c27" FROM (SELECT DISTINCT "r4"."c6", "r10"."c25" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_identified" AS "r1") AS "r2"("c1", "c2", "c3", "c4")) AS "r3"("c5")) AS "r4"("c6"), (SELECT DISTINCT "r9"."c22", "r9"."c23" FROM (SELECT "r8"."c18", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c12", "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."id", "r5"."lom", "r5"."owner", "r5"."parent", "r5"."position" FROM "qti"."lom_identifier" AS "r5") AS "r6"("c7", "c8", "c9", "c10", "c11")) AS "r7"("c12", "c13", "c14", "c15", "c16")) AS "r8"("c17", "c18", "c19", "c20", "c21") GROUP BY "r8"."c18") AS "r9"("c22", "c23")) AS "r10"("c24", "c25") WHERE "r4"."c6" = "r10"."c24") AS "r11"("c26", "c27") WHERE "r11"."c27" < 1::bigint) AS "r12"("c28", "c29")) AS "r13"("c30") UNION SELECT "r26"."c58" FROM (SELECT DISTINCT "r25"."c57" FROM (SELECT DISTINCT "r24"."c56" FROM (SELECT DISTINCT "r17"."c36" FROM (SELECT DISTINCT "r16"."c35" FROM (SELECT DISTINCT "r15"."c31" FROM (SELECT DISTINCT "r14"."lom", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."resource_lom_identified" AS "r14") AS "r15"("c31", "c32", "c33", "c34")) AS "r16"("c35")) AS "r17"("c36") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c52", "r22"."c53" FROM (SELECT "r21"."c48", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c42", "r20"."c43", "r20"."c44", "r20"."c45", "r20"."c46" FROM (SELECT DISTINCT "r19"."c37", "r19"."c38", "r19"."c39", "r19"."c40", "r19"."c41" FROM (SELECT DISTINCT "r18"."id", "r18"."lom", "r18"."owner", "r18"."parent", "r18"."position" FROM "qti"."lom_identifier" AS "r18") AS "r19"("c37", "c38", "c39", "c40", "c41")) AS "r20"("c42", "c43", "c44", "c45", "c46")) AS "r21"("c47", "c48", "c49", "c50", "c51") GROUP BY "r21"."c48") AS "r22"("c52", "c53")) AS "r23"("c54", "c55") WHERE "r23"."c54" = "r17"."c36")) AS "r24"("c56") WHERE 0::bigint < 1::bigint) AS "r25"("c57")) AS "r26"("c58")) AS "r27"("c59")) THEN
    RAISE EXCEPTION 'law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_identified_capacity_lom_identifier_7pnhbhckku'::"pg_catalog"."text";
  END IF;
END
$$;
