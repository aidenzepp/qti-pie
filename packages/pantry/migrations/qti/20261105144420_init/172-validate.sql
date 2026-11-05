-- Validate law __equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."equal_rounded", "qti"."equal_rounded_figures_ref" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_7tjtvphjs4"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."figures_kind" AS "c2" FROM "qti"."equal_rounded" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."equal_rounded_figures_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."equal_rounded_figures_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["EqualRounded",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["EqualRounded"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_7tjtvphjs4"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_ricnmycnq3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."figures_kind" AS "c2" FROM "qti"."equal_rounded" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."equal_rounded_figures_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."equal_rounded_figures_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["EqualRounded",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["EqualRounded"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_ricnmycnq3"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_s2tjvenwi5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."figures_kind" AS "c2" FROM "qti"."equal_rounded" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."equal_rounded_figures_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."equal_rounded_figures_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["EqualRounded",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["EqualRounded"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_s2tjvenwi5"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_equal_rounded_figures_kind_ref_capacity_equal_q2ixfysa2q"
  AFTER INSERT ON "qti"."equal_rounded"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."figures_kind" = 'ref'::"qti"."ref_or_literal")
  EXECUTE FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_7tjtvphjs4"();

CREATE CONSTRAINT TRIGGER "__law_equal_rounded_figures_kind_ref_capacity_equal_7z3kqknfr3"
  AFTER DELETE ON "qti"."equal_rounded_figures_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_ricnmycnq3"();

CREATE CONSTRAINT TRIGGER "__law_equal_rounded_figures_kind_ref_capacity_equal_rx5hdyjbya"
  AFTER INSERT ON "qti"."equal_rounded_figures_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_equal_rounded_figures_kind_ref_capacity_equal_s2tjvenwi5"();

-- The full violation query of law __equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c31" AS "id" FROM (WITH "r4"("c6") AS MATERIALIZED (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode" FROM "qti"."equal_rounded" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c1" = 'ref'::"qti"."ref_or_literal") AS "r3"("c5")), "r12"("c16", "c17") AS MATERIALIZED (SELECT DISTINCT "r11"."c14", "r11"."c15" FROM (SELECT "r10"."c13", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c10", "r9"."c11" FROM (SELECT DISTINCT "r8"."c8", "r8"."c9" FROM (SELECT DISTINCT "r7"."identifier", "r7"."node" FROM "qti"."equal_rounded_figures_ref" AS "r7") AS "r8"("c8", "c9")) AS "r9"("c10", "c11")) AS "r10"("c12", "c13") GROUP BY "r10"."c13") AS "r11"("c14", "c15")) SELECT "r17"."c24" FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c20", "r15"."c21" FROM (SELECT DISTINCT "r6"."c7", "r14"."c19" FROM (SELECT "r5"."c6" FROM "r4" AS "r5") AS "r6"("c7"), (SELECT "r13"."c16", "r13"."c17" FROM "r12" AS "r13") AS "r14"("c18", "c19") WHERE "r6"."c7" = "r14"."c18") AS "r15"("c20", "c21") WHERE "r15"."c21" < 1::bigint OR "r15"."c21" > 1::bigint) AS "r16"("c22", "c23")) AS "r17"("c24") UNION SELECT "r24"."c30" FROM (SELECT DISTINCT "r23"."c29" FROM (SELECT DISTINCT "r22"."c28" FROM (SELECT DISTINCT "r19"."c25" FROM (SELECT "r18"."c6" FROM "r4" AS "r18") AS "r19"("c25") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c16", "r20"."c17" FROM "r12" AS "r20") AS "r21"("c26", "c27") WHERE "r21"."c26" = "r19"."c25")) AS "r22"("c28") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c29")) AS "r24"("c30")) AS "r25"("c31")) THEN
    RAISE EXCEPTION 'law __equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__equal_rounded_figures_kind_ref_capacity_equal_i5ayloeoqm'::"pg_catalog"."text";
  END IF;
END
$$;
