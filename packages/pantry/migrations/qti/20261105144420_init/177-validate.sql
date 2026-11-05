-- Validate law __expression_capacity_operand_6iwkpxjwro: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."expression", "qti"."operand" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_capacity_operand_xvjrnev3hg"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min" AS "c2" FROM "qti"."expression" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."operand" AS "r1" WHERE "r1"."expression" = "t"."c1" GROUP BY "r1"."expression") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."operand" AS "r3" WHERE "r3"."expression" = "t"."c1") LOOP
      IF "g"."c1" < "t"."c2"::bigint THEN
        RAISE EXCEPTION 'law __expression_capacity_operand_6iwkpxjwro violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__expression_capacity_operand_6iwkpxjwro'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Expression",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Expression"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_capacity_operand_xvjrnev3hg"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_capacity_operand_djtgwylrgd"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min" AS "c2" FROM "qti"."expression" AS "r1" WHERE "r1"."id" = OLD."expression" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."operand" AS "r1" WHERE "r1"."expression" = "t"."c1" GROUP BY "r1"."expression") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."operand" AS "r3" WHERE "r3"."expression" = "t"."c1") LOOP
      IF "g"."c1" < "t"."c2"::bigint THEN
        RAISE EXCEPTION 'law __expression_capacity_operand_6iwkpxjwro violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__expression_capacity_operand_6iwkpxjwro'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Expression",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Expression"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_capacity_operand_djtgwylrgd"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_expression_capacity_operand_xcie7eahmj"
  AFTER INSERT ON "qti"."expression"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_capacity_operand_xvjrnev3hg"();

CREATE CONSTRAINT TRIGGER "__law_expression_capacity_operand_olc6abnw4n"
  AFTER DELETE ON "qti"."operand"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_capacity_operand_djtgwylrgd"();

-- The full violation query of law __expression_capacity_operand_6iwkpxjwro.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c43" AS "id" FROM (WITH "r4"("c8", "c9") AS MATERIALIZED (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c3", "r2"."c5" FROM (SELECT DISTINCT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min" FROM "qti"."expression" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5")) AS "r3"("c6", "c7")), "r12"("c23", "c24") AS MATERIALIZED (SELECT DISTINCT "r11"."c21", "r11"."c22" FROM (SELECT "r10"."c19", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c15", "r9"."c16", "r9"."c17" FROM (SELECT DISTINCT "r8"."c12", "r8"."c13", "r8"."c14" FROM (SELECT DISTINCT "r7"."child", "r7"."expression", "r7"."position" FROM "qti"."operand" AS "r7") AS "r8"("c12", "c13", "c14")) AS "r9"("c15", "c16", "c17")) AS "r10"("c18", "c19", "c20") GROUP BY "r10"."c19") AS "r11"("c21", "c22")) SELECT "r17"."c33" FROM (SELECT DISTINCT "r16"."c30" FROM (SELECT DISTINCT "r15"."c27", "r15"."c28", "r15"."c29" FROM (SELECT DISTINCT "r6"."c10", "r6"."c11", "r14"."c26" FROM (SELECT "r5"."c8", "r5"."c9" FROM "r4" AS "r5") AS "r6"("c10", "c11"), (SELECT "r13"."c23", "r13"."c24" FROM "r12" AS "r13") AS "r14"("c25", "c26") WHERE "r6"."c10" = "r14"."c25") AS "r15"("c27", "c28", "c29") WHERE "r15"."c29" < "r15"."c28") AS "r16"("c30", "c31", "c32")) AS "r17"("c33") UNION SELECT "r24"."c42" FROM (SELECT DISTINCT "r23"."c40" FROM (SELECT DISTINCT "r22"."c38", "r22"."c39" FROM (SELECT DISTINCT "r19"."c34", "r19"."c35" FROM (SELECT "r18"."c8", "r18"."c9" FROM "r4" AS "r18") AS "r19"("c34", "c35") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c23", "r20"."c24" FROM "r12" AS "r20") AS "r21"("c36", "c37") WHERE "r21"."c36" = "r19"."c34")) AS "r22"("c38", "c39") WHERE 0::bigint < "r22"."c39") AS "r23"("c40", "c41")) AS "r24"("c42")) AS "r25"("c43")) THEN
    RAISE EXCEPTION 'law __expression_capacity_operand_6iwkpxjwro is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__expression_capacity_operand_6iwkpxjwro'::"pg_catalog"."text";
  END IF;
END
$$;
