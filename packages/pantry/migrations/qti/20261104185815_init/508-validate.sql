-- Validate law __repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."repeat", "qti"."repeat_number_repeats_ref" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_e3rrinotw6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."number_repeats_kind" AS "c2" FROM "qti"."repeat" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."repeat_number_repeats_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."repeat_number_repeats_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Repeat",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Repeat"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_e3rrinotw6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_34iec4w2nr"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."number_repeats_kind" AS "c2" FROM "qti"."repeat" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."repeat_number_repeats_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."repeat_number_repeats_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Repeat",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Repeat"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_34iec4w2nr"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_t4v666o6ld"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."number_repeats_kind" AS "c2" FROM "qti"."repeat" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."repeat_number_repeats_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."repeat_number_repeats_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Repeat",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Repeat"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_t4v666o6ld"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_repeat_number_repeats_kind_ref_capacity_repeat_v6rnyvnms4"
  AFTER INSERT ON "qti"."repeat"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."number_repeats_kind" = 'ref'::"qti"."ref_or_literal")
  EXECUTE FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_e3rrinotw6"();

CREATE CONSTRAINT TRIGGER "__law_repeat_number_repeats_kind_ref_capacity_repeat_mkkyb2iwm2"
  AFTER DELETE ON "qti"."repeat_number_repeats_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_34iec4w2nr"();

CREATE CONSTRAINT TRIGGER "__law_repeat_number_repeats_kind_ref_capacity_repeat_soboqf6jbv"
  AFTER INSERT ON "qti"."repeat_number_repeats_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_repeat_number_repeats_kind_ref_capacity_repeat_t4v666o6ld"();

-- The full violation query of law __repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c39" AS "id" FROM (SELECT "r13"."c20" FROM (SELECT DISTINCT "r12"."c18" FROM (SELECT DISTINCT "r11"."c16", "r11"."c17" FROM (SELECT DISTINCT "r4"."c5", "r10"."c15" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."number_repeats_kind", "r1"."number_repeats_value" FROM "qti"."repeat" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'ref'::"qti"."ref_or_literal") AS "r3"("c4")) AS "r4"("c5"), (SELECT DISTINCT "r9"."c12", "r9"."c13" FROM (SELECT "r8"."c11", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c8", "r7"."c9" FROM (SELECT DISTINCT "r6"."c6", "r6"."c7" FROM (SELECT DISTINCT "r5"."identifier", "r5"."node" FROM "qti"."repeat_number_repeats_ref" AS "r5") AS "r6"("c6", "c7")) AS "r7"("c8", "c9")) AS "r8"("c10", "c11") GROUP BY "r8"."c11") AS "r9"("c12", "c13")) AS "r10"("c14", "c15") WHERE "r4"."c5" = "r10"."c14") AS "r11"("c16", "c17") WHERE "r11"."c17" < 1::bigint OR "r11"."c17" > 1::bigint) AS "r12"("c18", "c19")) AS "r13"("c20") UNION SELECT "r26"."c38" FROM (SELECT DISTINCT "r25"."c37" FROM (SELECT DISTINCT "r24"."c36" FROM (SELECT DISTINCT "r17"."c25" FROM (SELECT DISTINCT "r16"."c24" FROM (SELECT DISTINCT "r15"."c21" FROM (SELECT DISTINCT "r14"."id", "r14"."number_repeats_kind", "r14"."number_repeats_value" FROM "qti"."repeat" AS "r14") AS "r15"("c21", "c22", "c23") WHERE "r15"."c22" = 'ref'::"qti"."ref_or_literal") AS "r16"("c24")) AS "r17"("c25") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c32", "r22"."c33" FROM (SELECT "r21"."c31", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c28", "r20"."c29" FROM (SELECT DISTINCT "r19"."c26", "r19"."c27" FROM (SELECT DISTINCT "r18"."identifier", "r18"."node" FROM "qti"."repeat_number_repeats_ref" AS "r18") AS "r19"("c26", "c27")) AS "r20"("c28", "c29")) AS "r21"("c30", "c31") GROUP BY "r21"."c31") AS "r22"("c32", "c33")) AS "r23"("c34", "c35") WHERE "r23"."c34" = "r17"."c25")) AS "r24"("c36") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c37")) AS "r26"("c38")) AS "r27"("c39")) THEN
    RAISE EXCEPTION 'law __repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__repeat_number_repeats_kind_ref_capacity_repeat_mon22qfnsn'::"pg_catalog"."text";
  END IF;
END
$$;
