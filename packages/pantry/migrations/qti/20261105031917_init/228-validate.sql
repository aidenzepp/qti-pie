-- Validate law __index_n_kind_ref_capacity_index_n_ref_vi572aw4b2: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."index", "qti"."index_n_ref" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_2u2dhkk6dq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."n_kind" AS "c2" FROM "qti"."index" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."index_n_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."index_n_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __index_n_kind_ref_capacity_index_n_ref_vi572aw4b2 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__index_n_kind_ref_capacity_index_n_ref_vi572aw4b2'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Index",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Index"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_2u2dhkk6dq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_7wyh5zt6b5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."n_kind" AS "c2" FROM "qti"."index" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."index_n_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."index_n_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __index_n_kind_ref_capacity_index_n_ref_vi572aw4b2 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__index_n_kind_ref_capacity_index_n_ref_vi572aw4b2'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Index",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Index"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_7wyh5zt6b5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_modsuyfg5h"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."n_kind" AS "c2" FROM "qti"."index" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."index_n_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."index_n_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __index_n_kind_ref_capacity_index_n_ref_vi572aw4b2 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__index_n_kind_ref_capacity_index_n_ref_vi572aw4b2'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Index",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Index"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_modsuyfg5h"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_index_n_kind_ref_capacity_index_n_ref_4vzuyi754q"
  AFTER INSERT ON "qti"."index"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."n_kind" = 'ref'::"qti"."ref_or_literal")
  EXECUTE FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_2u2dhkk6dq"();

CREATE CONSTRAINT TRIGGER "__law_index_n_kind_ref_capacity_index_n_ref_uznnv62fcf"
  AFTER DELETE ON "qti"."index_n_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_7wyh5zt6b5"();

CREATE CONSTRAINT TRIGGER "__law_index_n_kind_ref_capacity_index_n_ref_m2o6rxj2ju"
  AFTER INSERT ON "qti"."index_n_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_index_n_kind_ref_capacity_index_n_ref_modsuyfg5h"();

-- The full violation query of law __index_n_kind_ref_capacity_index_n_ref_vi572aw4b2.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c39" AS "id" FROM (SELECT "r13"."c20" FROM (SELECT DISTINCT "r12"."c18" FROM (SELECT DISTINCT "r11"."c16", "r11"."c17" FROM (SELECT DISTINCT "r4"."c5", "r10"."c15" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."n_kind", "r1"."n_value" FROM "qti"."index" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'ref'::"qti"."ref_or_literal") AS "r3"("c4")) AS "r4"("c5"), (SELECT DISTINCT "r9"."c12", "r9"."c13" FROM (SELECT "r8"."c11", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c8", "r7"."c9" FROM (SELECT DISTINCT "r6"."c6", "r6"."c7" FROM (SELECT DISTINCT "r5"."identifier", "r5"."node" FROM "qti"."index_n_ref" AS "r5") AS "r6"("c6", "c7")) AS "r7"("c8", "c9")) AS "r8"("c10", "c11") GROUP BY "r8"."c11") AS "r9"("c12", "c13")) AS "r10"("c14", "c15") WHERE "r4"."c5" = "r10"."c14") AS "r11"("c16", "c17") WHERE "r11"."c17" < 1::bigint OR "r11"."c17" > 1::bigint) AS "r12"("c18", "c19")) AS "r13"("c20") UNION SELECT "r26"."c38" FROM (SELECT DISTINCT "r25"."c37" FROM (SELECT DISTINCT "r24"."c36" FROM (SELECT DISTINCT "r17"."c25" FROM (SELECT DISTINCT "r16"."c24" FROM (SELECT DISTINCT "r15"."c21" FROM (SELECT DISTINCT "r14"."id", "r14"."n_kind", "r14"."n_value" FROM "qti"."index" AS "r14") AS "r15"("c21", "c22", "c23") WHERE "r15"."c22" = 'ref'::"qti"."ref_or_literal") AS "r16"("c24")) AS "r17"("c25") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c32", "r22"."c33" FROM (SELECT "r21"."c31", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c28", "r20"."c29" FROM (SELECT DISTINCT "r19"."c26", "r19"."c27" FROM (SELECT DISTINCT "r18"."identifier", "r18"."node" FROM "qti"."index_n_ref" AS "r18") AS "r19"("c26", "c27")) AS "r20"("c28", "c29")) AS "r21"("c30", "c31") GROUP BY "r21"."c31") AS "r22"("c32", "c33")) AS "r23"("c34", "c35") WHERE "r23"."c34" = "r17"."c25")) AS "r24"("c36") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c37")) AS "r26"("c38")) AS "r27"("c39")) THEN
    RAISE EXCEPTION 'law __index_n_kind_ref_capacity_index_n_ref_vi572aw4b2 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__index_n_kind_ref_capacity_index_n_ref_vi572aw4b2'::"pg_catalog"."text";
  END IF;
END
$$;
