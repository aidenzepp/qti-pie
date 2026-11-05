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
  IF EXISTS (SELECT "r27"."c61" AS "id" FROM (SELECT "r13"."c31" FROM (SELECT DISTINCT "r12"."c29" FROM (SELECT DISTINCT "r11"."c27", "r11"."c28" FROM (SELECT DISTINCT "r4"."c7", "r10"."c26" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."package", "r1"."type", "r1"."version" FROM "qti"."resource" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5")) AS "r3"("c6")) AS "r4"("c7"), (SELECT DISTINCT "r9"."c23", "r9"."c24" FROM (SELECT "r8"."c22", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12" FROM (SELECT DISTINCT "r5"."href", "r5"."id", "r5"."package", "r5"."position", "r5"."resource" FROM "qti"."file" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12")) AS "r7"("c13", "c14", "c15", "c16", "c17")) AS "r8"("c18", "c19", "c20", "c21", "c22") GROUP BY "r8"."c22") AS "r9"("c23", "c24")) AS "r10"("c25", "c26") WHERE "r4"."c7" = "r10"."c25") AS "r11"("c27", "c28") WHERE "r11"."c28" < 1::bigint) AS "r12"("c29", "c30")) AS "r13"("c31") UNION SELECT "r26"."c60" FROM (SELECT DISTINCT "r25"."c59" FROM (SELECT DISTINCT "r24"."c58" FROM (SELECT DISTINCT "r17"."c38" FROM (SELECT DISTINCT "r16"."c37" FROM (SELECT DISTINCT "r15"."c32" FROM (SELECT DISTINCT "r14"."id", "r14"."identifier", "r14"."package", "r14"."type", "r14"."version" FROM "qti"."resource" AS "r14") AS "r15"("c32", "c33", "c34", "c35", "c36")) AS "r16"("c37")) AS "r17"("c38") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c54", "r22"."c55" FROM (SELECT "r21"."c53", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c44", "r20"."c45", "r20"."c46", "r20"."c47", "r20"."c48" FROM (SELECT DISTINCT "r19"."c39", "r19"."c40", "r19"."c41", "r19"."c42", "r19"."c43" FROM (SELECT DISTINCT "r18"."href", "r18"."id", "r18"."package", "r18"."position", "r18"."resource" FROM "qti"."file" AS "r18") AS "r19"("c39", "c40", "c41", "c42", "c43")) AS "r20"("c44", "c45", "c46", "c47", "c48")) AS "r21"("c49", "c50", "c51", "c52", "c53") GROUP BY "r21"."c53") AS "r22"("c54", "c55")) AS "r23"("c56", "c57") WHERE "r23"."c56" = "r17"."c38")) AS "r24"("c58") WHERE 0::bigint < 1::bigint) AS "r25"("c59")) AS "r26"("c60")) AS "r27"("c61")) THEN
    RAISE EXCEPTION 'law __resource_capacity_file_djgmjylfly is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_capacity_file_djgmjylfly'::"pg_catalog"."text";
  END IF;
END
$$;
