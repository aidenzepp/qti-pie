-- Validate law __colgroup_span_capacity_edge_cvpdr7bmrm: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."colgroup_span", "qti"."edge" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_colgroup_span_capacity_edge_bduykondjj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."node" AS "c1" FROM "qti"."colgroup_span" AS "r1" WHERE "r1"."node" = NEW."node" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'col'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'col'::"qti"."node_kind") LOOP
      IF "g"."c1" > 0::bigint THEN
        RAISE EXCEPTION 'law __colgroup_span_capacity_edge_cvpdr7bmrm violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__colgroup_span_capacity_edge_cvpdr7bmrm'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ColgroupSpan",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ColgroupSpan"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_colgroup_span_capacity_edge_bduykondjj"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_colgroup_span_capacity_edge_h4v5tm6mop"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."node" AS "c1" FROM "qti"."colgroup_span" AS "r1" WHERE "r1"."node" = NEW."parent" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'col'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'col'::"qti"."node_kind") LOOP
      IF "g"."c1" > 0::bigint THEN
        RAISE EXCEPTION 'law __colgroup_span_capacity_edge_cvpdr7bmrm violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__colgroup_span_capacity_edge_cvpdr7bmrm'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ColgroupSpan",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ColgroupSpan"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_colgroup_span_capacity_edge_h4v5tm6mop"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_colgroup_span_capacity_edge_ohtal3k3cp"
  AFTER INSERT ON "qti"."colgroup_span"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_colgroup_span_capacity_edge_bduykondjj"();

CREATE CONSTRAINT TRIGGER "__law_colgroup_span_capacity_edge_pvaz5ptsxq"
  AFTER INSERT ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."child_kind" = 'col'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_colgroup_span_capacity_edge_h4v5tm6mop"();

-- The full violation query of law __colgroup_span_capacity_edge_cvpdr7bmrm.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c40" AS "node" FROM (SELECT DISTINCT "r12"."c38" FROM (SELECT DISTINCT "r11"."c36", "r11"."c37" FROM (SELECT DISTINCT "r4"."c4", "r10"."c35" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."node", "r1"."value" FROM "qti"."colgroup_span" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c32", "r9"."c33" FROM (SELECT "r8"."c26", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c14", "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18", "r7"."c19", "r7"."c20", "r7"."c21", "r7"."c22" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6", "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13" FROM (SELECT DISTINCT "r5"."child", "r5"."child_ancestry", "r5"."child_kind", "r5"."parent", "r5"."parent_ancestry", "r5"."parent_kind", "r5"."position", "r5"."tree", "r5"."version" FROM "qti"."edge" AS "r5") AS "r6"("c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13") WHERE "r6"."c7" = 'col'::"qti"."node_kind") AS "r7"("c14", "c15", "c16", "c17", "c18", "c19", "c20", "c21", "c22")) AS "r8"("c23", "c24", "c25", "c26", "c27", "c28", "c29", "c30", "c31") GROUP BY "r8"."c26") AS "r9"("c32", "c33")) AS "r10"("c34", "c35") WHERE "r4"."c4" = "r10"."c34") AS "r11"("c36", "c37") WHERE "r11"."c37" < 0::bigint OR "r11"."c37" > 0::bigint) AS "r12"("c38", "c39")) AS "r13"("c40")) THEN
    RAISE EXCEPTION 'law __colgroup_span_capacity_edge_cvpdr7bmrm is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__colgroup_span_capacity_edge_cvpdr7bmrm'::"pg_catalog"."text";
  END IF;
END
$$;
