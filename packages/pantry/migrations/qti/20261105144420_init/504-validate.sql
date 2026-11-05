-- Validate law __package_capacity_resources_54adfjloiw: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."package", "qti"."resources" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_package_capacity_resources_5u4mn5lxg3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."package" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."resources" AS "r1" WHERE "r1"."manifest" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __package_capacity_resources_54adfjloiw violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__package_capacity_resources_54adfjloiw'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Package",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Package"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_package_capacity_resources_5u4mn5lxg3"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_package_capacity_resources_kw5apgspub"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."package" AS "r1" WHERE "r1"."id" = OLD."manifest" LOOP
    PERFORM 1 FROM "qti"."resources" AS "r1" WHERE "r1"."manifest" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __package_capacity_resources_54adfjloiw violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__package_capacity_resources_54adfjloiw'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Package",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Package"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_package_capacity_resources_kw5apgspub"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_package_capacity_resources_z7auq4fzpb"
  AFTER INSERT ON "qti"."package"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_package_capacity_resources_5u4mn5lxg3"();

CREATE CONSTRAINT TRIGGER "__law_package_capacity_resources_c6mlmdtqoc"
  AFTER DELETE ON "qti"."resources"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_package_capacity_resources_kw5apgspub"();

-- The full violation query of law __package_capacity_resources_54adfjloiw.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c30" AS "id" FROM (WITH "r4"("c5") AS MATERIALIZED (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."schemaversion" FROM "qti"."package" AS "r1") AS "r2"("c1", "c2", "c3")) AS "r3"("c4")), "r12"("c15", "c16") AS MATERIALIZED (SELECT DISTINCT "r11"."c13", "r11"."c14" FROM (SELECT "r10"."c12", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c9", "r9"."c10" FROM (SELECT DISTINCT "r8"."c7", "r8"."c8" FROM (SELECT DISTINCT "r7"."id", "r7"."manifest" FROM "qti"."resources" AS "r7") AS "r8"("c7", "c8")) AS "r9"("c9", "c10")) AS "r10"("c11", "c12") GROUP BY "r10"."c12") AS "r11"("c13", "c14")) SELECT "r17"."c23" FROM (SELECT DISTINCT "r16"."c21" FROM (SELECT DISTINCT "r15"."c19", "r15"."c20" FROM (SELECT DISTINCT "r6"."c6", "r14"."c18" FROM (SELECT "r5"."c5" FROM "r4" AS "r5") AS "r6"("c6"), (SELECT "r13"."c15", "r13"."c16" FROM "r12" AS "r13") AS "r14"("c17", "c18") WHERE "r6"."c6" = "r14"."c17") AS "r15"("c19", "c20") WHERE "r15"."c20" < 1::bigint OR "r15"."c20" > 1::bigint) AS "r16"("c21", "c22")) AS "r17"("c23") UNION SELECT "r24"."c29" FROM (SELECT DISTINCT "r23"."c28" FROM (SELECT DISTINCT "r22"."c27" FROM (SELECT DISTINCT "r19"."c24" FROM (SELECT "r18"."c5" FROM "r4" AS "r18") AS "r19"("c24") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c15", "r20"."c16" FROM "r12" AS "r20") AS "r21"("c25", "c26") WHERE "r21"."c25" = "r19"."c24")) AS "r22"("c27") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c28")) AS "r24"("c29")) AS "r25"("c30")) THEN
    RAISE EXCEPTION 'law __package_capacity_resources_54adfjloiw is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__package_capacity_resources_54adfjloiw'::"pg_catalog"."text";
  END IF;
END
$$;
