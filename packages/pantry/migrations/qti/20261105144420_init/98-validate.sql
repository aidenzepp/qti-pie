-- Validate law __typed_value_set_cardinality_single_capacity_djjrdbcpve: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declared_value", "qti"."typed_value_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_kiu65e5jqc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."cardinality" AS "c2" FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = OLD."value_set" LOOP
    IF "t"."c2" = 'single'::"qti"."typed_cardinality" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = "t"."c1" GROUP BY "r1"."value_set") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."declared_value" AS "r3" WHERE "r3"."value_set" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __typed_value_set_cardinality_single_capacity_djjrdbcpve violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__typed_value_set_cardinality_single_capacity_djjrdbcpve'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TypedValueSet",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TypedValueSet"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_kiu65e5jqc"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_saw7ppfoch"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."cardinality" AS "c2" FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = NEW."value_set" LOOP
    IF "t"."c2" = 'single'::"qti"."typed_cardinality" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = "t"."c1" GROUP BY "r1"."value_set") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."declared_value" AS "r3" WHERE "r3"."value_set" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __typed_value_set_cardinality_single_capacity_djjrdbcpve violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__typed_value_set_cardinality_single_capacity_djjrdbcpve'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TypedValueSet",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TypedValueSet"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_saw7ppfoch"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_isnt4nlerg"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."cardinality" AS "c2" FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'single'::"qti"."typed_cardinality" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = "t"."c1" GROUP BY "r1"."value_set") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."declared_value" AS "r3" WHERE "r3"."value_set" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __typed_value_set_cardinality_single_capacity_djjrdbcpve violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__typed_value_set_cardinality_single_capacity_djjrdbcpve'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TypedValueSet",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TypedValueSet"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_isnt4nlerg"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_typed_value_set_cardinality_single_capacity_jougcekjxr"
  AFTER DELETE ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_kiu65e5jqc"();

CREATE CONSTRAINT TRIGGER "__law_typed_value_set_cardinality_single_capacity_w5ghdoaph4"
  AFTER INSERT ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_saw7ppfoch"();

CREATE CONSTRAINT TRIGGER "__law_typed_value_set_cardinality_single_capacity_q4b6a5hsem"
  AFTER INSERT ON "qti"."typed_value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."cardinality" = 'single'::"qti"."typed_cardinality")
  EXECUTE FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_isnt4nlerg"();

-- The full violation query of law __typed_value_set_cardinality_single_capacity_djjrdbcpve.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c40" AS "id" FROM (WITH "r4"("c6") AS MATERIALIZED (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c4" FROM (SELECT DISTINCT "r1"."base_type", "r1"."cardinality", "r1"."declaration", "r1"."id" FROM "qti"."typed_value_set" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c2" = 'single'::"qti"."typed_cardinality") AS "r3"("c5")), "r12"("c25", "c26") AS MATERIALIZED (SELECT DISTINCT "r11"."c23", "r11"."c24" FROM (SELECT "r10"."c22", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c13", "r9"."c14", "r9"."c15", "r9"."c16", "r9"."c17" FROM (SELECT DISTINCT "r8"."c8", "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12" FROM (SELECT DISTINCT "r7"."base_type", "r7"."id", "r7"."position", "r7"."shape", "r7"."value_set" FROM "qti"."declared_value" AS "r7") AS "r8"("c8", "c9", "c10", "c11", "c12")) AS "r9"("c13", "c14", "c15", "c16", "c17")) AS "r10"("c18", "c19", "c20", "c21", "c22") GROUP BY "r10"."c22") AS "r11"("c23", "c24")) SELECT "r17"."c33" FROM (SELECT DISTINCT "r16"."c31" FROM (SELECT DISTINCT "r15"."c29", "r15"."c30" FROM (SELECT DISTINCT "r6"."c7", "r14"."c28" FROM (SELECT "r5"."c6" FROM "r4" AS "r5") AS "r6"("c7"), (SELECT "r13"."c25", "r13"."c26" FROM "r12" AS "r13") AS "r14"("c27", "c28") WHERE "r6"."c7" = "r14"."c27") AS "r15"("c29", "c30") WHERE "r15"."c30" < 1::bigint OR "r15"."c30" > 1::bigint) AS "r16"("c31", "c32")) AS "r17"("c33") UNION SELECT "r24"."c39" FROM (SELECT DISTINCT "r23"."c38" FROM (SELECT DISTINCT "r22"."c37" FROM (SELECT DISTINCT "r19"."c34" FROM (SELECT "r18"."c6" FROM "r4" AS "r18") AS "r19"("c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c25", "r20"."c26" FROM "r12" AS "r20") AS "r21"("c35", "c36") WHERE "r21"."c35" = "r19"."c34")) AS "r22"("c37") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c38")) AS "r24"("c39")) AS "r25"("c40")) THEN
    RAISE EXCEPTION 'law __typed_value_set_cardinality_single_capacity_djjrdbcpve is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__typed_value_set_cardinality_single_capacity_djjrdbcpve'::"pg_catalog"."text";
  END IF;
END
$$;
