-- Validate law __node_kind_bdo_capacity_node_dir_rloxzsrimj: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."node", "qti"."node_dir" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_uxcorhwmep"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'bdo'::"qti"."node_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."node_dir" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_dir" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_uxcorhwmep"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_emkjql2ke5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
    IF "t"."c2" = 'bdo'::"qti"."node_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."node_dir" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_dir" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_emkjql2ke5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_f74phcvw5g"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'bdo'::"qti"."node_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."node_dir" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_dir" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_f74phcvw5g"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_bdo_capacity_node_dir_7cin3s2ikz"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'bdo'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_uxcorhwmep"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_bdo_capacity_node_dir_ojvw27laug"
  AFTER DELETE ON "qti"."node_dir"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_emkjql2ke5"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_bdo_capacity_node_dir_mijm5sxtak"
  AFTER INSERT ON "qti"."node_dir"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_f74phcvw5g"();

-- The full violation query of law __node_kind_bdo_capacity_node_dir_rloxzsrimj.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c40" AS "id" FROM (WITH "r4"("c9") AS MATERIALIZED (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'bdo'::"qti"."node_kind") AS "r3"("c8")), "r12"("c25", "c26") AS MATERIALIZED (SELECT DISTINCT "r11"."c23", "r11"."c24" FROM (SELECT "r10"."c21", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c15", "r9"."c16", "r9"."c17", "r9"."c18" FROM (SELECT DISTINCT "r8"."c11", "r8"."c12", "r8"."c13", "r8"."c14" FROM (SELECT DISTINCT "r7"."attribute", "r7"."kind", "r7"."node", "r7"."value" FROM "qti"."node_dir" AS "r7") AS "r8"("c11", "c12", "c13", "c14")) AS "r9"("c15", "c16", "c17", "c18")) AS "r10"("c19", "c20", "c21", "c22") GROUP BY "r10"."c21") AS "r11"("c23", "c24")) SELECT "r17"."c33" FROM (SELECT DISTINCT "r16"."c31" FROM (SELECT DISTINCT "r15"."c29", "r15"."c30" FROM (SELECT DISTINCT "r6"."c10", "r14"."c28" FROM (SELECT "r5"."c9" FROM "r4" AS "r5") AS "r6"("c10"), (SELECT "r13"."c25", "r13"."c26" FROM "r12" AS "r13") AS "r14"("c27", "c28") WHERE "r6"."c10" = "r14"."c27") AS "r15"("c29", "c30") WHERE "r15"."c30" < 1::bigint OR "r15"."c30" > 1::bigint) AS "r16"("c31", "c32")) AS "r17"("c33") UNION SELECT "r24"."c39" FROM (SELECT DISTINCT "r23"."c38" FROM (SELECT DISTINCT "r22"."c37" FROM (SELECT DISTINCT "r19"."c34" FROM (SELECT "r18"."c9" FROM "r4" AS "r18") AS "r19"("c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c25", "r20"."c26" FROM "r12" AS "r20") AS "r21"("c35", "c36") WHERE "r21"."c35" = "r19"."c34")) AS "r22"("c37") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c38")) AS "r24"("c39")) AS "r25"("c40")) THEN
    RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::"pg_catalog"."text";
  END IF;
END
$$;
