-- Validate law __resource_capacity_file_djgmjylfly: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."file", "qti"."resource" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_capacity_file_qu5jn22rbc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."resource" AS "r1" WHERE "r1"."id" = OLD."resource" LOOP
    PERFORM 1 FROM "qti"."file" AS "r1" WHERE "r1"."resource" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __resource_capacity_file_djgmjylfly violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__resource_capacity_file_djgmjylfly'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Resource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Resource"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_capacity_file_qu5jn22rbc"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_capacity_file_33vmyja67e"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."resource" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."file" AS "r1" WHERE "r1"."resource" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __resource_capacity_file_djgmjylfly violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__resource_capacity_file_djgmjylfly'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Resource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Resource"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_capacity_file_33vmyja67e"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_resource_capacity_file_4rhi5fdtr4"
  AFTER DELETE ON "qti"."file"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_capacity_file_qu5jn22rbc"();

CREATE CONSTRAINT TRIGGER "__law_resource_capacity_file_4mwzgdcmww"
  AFTER INSERT ON "qti"."resource"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_capacity_file_33vmyja67e"();

-- The full violation query of law __resource_capacity_file_djgmjylfly.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c41" AS "id" FROM (WITH "r4"("c7") AS MATERIALIZED (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."package", "r1"."type", "r1"."version" FROM "qti"."resource" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5")) AS "r3"("c6")), "r12"("c26", "c27") AS MATERIALIZED (SELECT DISTINCT "r11"."c24", "r11"."c25" FROM (SELECT "r10"."c23", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c14", "r9"."c15", "r9"."c16", "r9"."c17", "r9"."c18" FROM (SELECT DISTINCT "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13" FROM (SELECT DISTINCT "r7"."href", "r7"."id", "r7"."package", "r7"."position", "r7"."resource" FROM "qti"."file" AS "r7") AS "r8"("c9", "c10", "c11", "c12", "c13")) AS "r9"("c14", "c15", "c16", "c17", "c18")) AS "r10"("c19", "c20", "c21", "c22", "c23") GROUP BY "r10"."c23") AS "r11"("c24", "c25")) SELECT "r17"."c34" FROM (SELECT DISTINCT "r16"."c32" FROM (SELECT DISTINCT "r15"."c30", "r15"."c31" FROM (SELECT DISTINCT "r6"."c8", "r14"."c29" FROM (SELECT "r5"."c7" FROM "r4" AS "r5") AS "r6"("c8"), (SELECT "r13"."c26", "r13"."c27" FROM "r12" AS "r13") AS "r14"("c28", "c29") WHERE "r6"."c8" = "r14"."c28") AS "r15"("c30", "c31") WHERE "r15"."c31" < 1::bigint) AS "r16"("c32", "c33")) AS "r17"("c34") UNION SELECT "r24"."c40" FROM (SELECT DISTINCT "r23"."c39" FROM (SELECT DISTINCT "r22"."c38" FROM (SELECT DISTINCT "r19"."c35" FROM (SELECT "r18"."c7" FROM "r4" AS "r18") AS "r19"("c35") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c26", "r20"."c27" FROM "r12" AS "r20") AS "r21"("c36", "c37") WHERE "r21"."c36" = "r19"."c35")) AS "r22"("c38") WHERE 0::bigint < 1::bigint) AS "r23"("c39")) AS "r24"("c40")) AS "r25"("c41")) THEN
    RAISE EXCEPTION 'law __resource_capacity_file_djgmjylfly is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_capacity_file_djgmjylfly'::"pg_catalog"."text";
  END IF;
END
$$;
