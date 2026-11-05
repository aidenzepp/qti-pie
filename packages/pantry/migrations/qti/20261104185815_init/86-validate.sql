-- Validate law __node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."csm_set", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_k3xjss2vu2"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."host" LOOP
    IF "t"."c2" = 'cp:metadata.resource'::"qti"."node_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."csm_set" AS "r1" WHERE "r1"."host" = "t"."c1" GROUP BY "r1"."host") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."csm_set" AS "r3" WHERE "r3"."host" = "t"."c1") LOOP
        IF "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_k3xjss2vu2"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_c2cugui234"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'cp:metadata.resource'::"qti"."node_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."csm_set" AS "r1" WHERE "r1"."host" = "t"."c1" GROUP BY "r1"."host") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."csm_set" AS "r3" WHERE "r3"."host" = "t"."c1") LOOP
        IF "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_c2cugui234"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_cp_metadata_resource_capacity_csm_q4bf5ymecg"
  AFTER INSERT ON "qti"."csm_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_k3xjss2vu2"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_cp_metadata_resource_capacity_csm_lepptpcnzx"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'cp:metadata.resource'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_c2cugui234"();

-- The full violation query of law __node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c24" AS "id" FROM (SELECT DISTINCT "r12"."c22" FROM (SELECT DISTINCT "r11"."c20", "r11"."c21" FROM (SELECT DISTINCT "r4"."c9", "r10"."c19" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'cp:metadata.resource'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9"), (SELECT DISTINCT "r9"."c16", "r9"."c17" FROM (SELECT "r8"."c14", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c12", "r7"."c13" FROM (SELECT DISTINCT "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."host", "r5"."id" FROM "qti"."csm_set" AS "r5") AS "r6"("c10", "c11")) AS "r7"("c12", "c13")) AS "r8"("c14", "c15") GROUP BY "r8"."c14") AS "r9"("c16", "c17")) AS "r10"("c18", "c19") WHERE "r4"."c9" = "r10"."c18") AS "r11"("c20", "c21") WHERE "r11"."c21" < 0::bigint OR "r11"."c21" > 1::bigint) AS "r12"("c22", "c23")) AS "r13"("c24")) THEN
    RAISE EXCEPTION 'law __node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_kind_cp_metadata_resource_capacity_csm_set_kvdp6cvhg4'::"pg_catalog"."text";
  END IF;
END
$$;
