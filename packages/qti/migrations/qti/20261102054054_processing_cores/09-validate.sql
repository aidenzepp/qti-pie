-- Validate law __expression_max_capacity_operand_wnbd2spdy4: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."expression_max", "qti"."operand" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_max_capacity_operand_5pbjlyctx4"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'expression_max'::text THEN
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."max" AS "c2" FROM "qti"."expression_max" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."operand" AS "r1" WHERE "r1"."expression" = "t"."c1" GROUP BY "r1"."expression") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."operand" AS "r3" WHERE "r3"."expression" = "t"."c1") LOOP
        IF "g"."c1" > "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __expression_max_capacity_operand_wnbd2spdy4 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__expression_max_capacity_operand_wnbd2spdy4'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ExpressionMax",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ExpressionMax"]'::text END;
        END IF;
      END LOOP;
    END LOOP;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."max" AS "c2" FROM "qti"."expression_max" AS "r1" WHERE "r1"."id" = NEW."expression" LOOP
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."operand" AS "r1" WHERE "r1"."expression" = "t"."c1" GROUP BY "r1"."expression") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."operand" AS "r3" WHERE "r3"."expression" = "t"."c1") LOOP
        IF "g"."c1" > "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __expression_max_capacity_operand_wnbd2spdy4 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__expression_max_capacity_operand_wnbd2spdy4'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ExpressionMax",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ExpressionMax"]'::text END;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_max_capacity_operand_5pbjlyctx4"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_expression_max_capacity_operand_rqithowvhr"
  AFTER INSERT ON "qti"."expression_max"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_max_capacity_operand_5pbjlyctx4"();

CREATE CONSTRAINT TRIGGER "__law_expression_max_capacity_operand_rlevvchvdf"
  AFTER INSERT ON "qti"."operand"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_max_capacity_operand_5pbjlyctx4"();

-- The full violation query of law __expression_max_capacity_operand_wnbd2spdy4.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c53" AS "id" FROM (SELECT "r13"."c27" FROM (SELECT DISTINCT "r12"."c24" FROM (SELECT DISTINCT "r11"."c21", "r11"."c22", "r11"."c23" FROM (SELECT DISTINCT "r4"."c6", "r4"."c7", "r10"."c20" FROM (SELECT DISTINCT "r3"."c4", "r3"."c5" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."id", "r1"."kind", "r1"."max" FROM "qti"."expression_max" AS "r1") AS "r2"("c1", "c2", "c3")) AS "r3"("c4", "c5")) AS "r4"("c6", "c7"), (SELECT DISTINCT "r9"."c17", "r9"."c18" FROM (SELECT "r8"."c15", count(*) FROM (SELECT DISTINCT "r7"."c11", "r7"."c12", "r7"."c13" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9", "r6"."c10" FROM (SELECT DISTINCT "r5"."child", "r5"."expression", "r5"."position" FROM "qti"."operand" AS "r5") AS "r6"("c8", "c9", "c10")) AS "r7"("c11", "c12", "c13")) AS "r8"("c14", "c15", "c16") GROUP BY "r8"."c15") AS "r9"("c17", "c18")) AS "r10"("c19", "c20") WHERE "r4"."c6" = "r10"."c19") AS "r11"("c21", "c22", "c23") WHERE "r11"."c23" < 0::bigint OR "r11"."c23" > "r11"."c22") AS "r12"("c24", "c25", "c26")) AS "r13"("c27") UNION SELECT "r26"."c52" FROM (SELECT DISTINCT "r25"."c50" FROM (SELECT DISTINCT "r24"."c48", "r24"."c49" FROM (SELECT DISTINCT "r17"."c33", "r17"."c34" FROM (SELECT DISTINCT "r16"."c31", "r16"."c32" FROM (SELECT DISTINCT "r15"."c28", "r15"."c30" FROM (SELECT DISTINCT "r14"."id", "r14"."kind", "r14"."max" FROM "qti"."expression_max" AS "r14") AS "r15"("c28", "c29", "c30")) AS "r16"("c31", "c32")) AS "r17"("c33", "c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c44", "r22"."c45" FROM (SELECT "r21"."c42", count(*) FROM (SELECT DISTINCT "r20"."c38", "r20"."c39", "r20"."c40" FROM (SELECT DISTINCT "r19"."c35", "r19"."c36", "r19"."c37" FROM (SELECT DISTINCT "r18"."child", "r18"."expression", "r18"."position" FROM "qti"."operand" AS "r18") AS "r19"("c35", "c36", "c37")) AS "r20"("c38", "c39", "c40")) AS "r21"("c41", "c42", "c43") GROUP BY "r21"."c42") AS "r22"("c44", "c45")) AS "r23"("c46", "c47") WHERE "r23"."c46" = "r17"."c33")) AS "r24"("c48", "c49") WHERE 0::bigint < 0::bigint OR 0::bigint > "r24"."c49") AS "r25"("c50", "c51")) AS "r26"("c52")) AS "r27"("c53")) THEN
    RAISE EXCEPTION 'law __expression_max_capacity_operand_wnbd2spdy4 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__expression_max_capacity_operand_wnbd2spdy4'::text;
  END IF;
END
$$;
