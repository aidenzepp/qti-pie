-- Validate law __expression_capacity_operand_6iwkpxjwro: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."expression", "qti"."operand" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_capacity_operand_y43qtzor5d"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'expression'::text THEN
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min" AS "c2" FROM "qti"."expression" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."operand" AS "r1" WHERE "r1"."expression" = "t"."c1" GROUP BY "r1"."expression") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."operand" AS "r3" WHERE "r3"."expression" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __expression_capacity_operand_6iwkpxjwro violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__expression_capacity_operand_6iwkpxjwro'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Expression",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Expression"]'::text END;
        END IF;
      END LOOP;
    END LOOP;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."min" AS "c2" FROM "qti"."expression" AS "r1" WHERE "r1"."id" = OLD."expression" LOOP
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."operand" AS "r1" WHERE "r1"."expression" = "t"."c1" GROUP BY "r1"."expression") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."operand" AS "r3" WHERE "r3"."expression" = "t"."c1") LOOP
        IF "g"."c1" < "t"."c2"::bigint THEN
          RAISE EXCEPTION 'law __expression_capacity_operand_6iwkpxjwro violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__expression_capacity_operand_6iwkpxjwro'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Expression",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Expression"]'::text END;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_capacity_operand_y43qtzor5d"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_expression_capacity_operand_vwmiht7wfu"
  AFTER INSERT ON "qti"."expression"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_capacity_operand_y43qtzor5d"();

CREATE CONSTRAINT TRIGGER "__law_expression_capacity_operand_sv2vw62lrk"
  AFTER DELETE ON "qti"."operand"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_capacity_operand_y43qtzor5d"();

-- The full violation query of law __expression_capacity_operand_6iwkpxjwro.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c57" AS "id" FROM (SELECT "r13"."c29" FROM (SELECT DISTINCT "r12"."c26" FROM (SELECT DISTINCT "r11"."c23", "r11"."c24", "r11"."c25" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9", "r10"."c22" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c3", "r2"."c5" FROM (SELECT DISTINCT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min" FROM "qti"."expression" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5")) AS "r3"("c6", "c7")) AS "r4"("c8", "c9"), (SELECT DISTINCT "r9"."c19", "r9"."c20" FROM (SELECT "r8"."c17", count(*) FROM (SELECT DISTINCT "r7"."c13", "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c10", "r6"."c11", "r6"."c12" FROM (SELECT DISTINCT "r5"."child", "r5"."expression", "r5"."position" FROM "qti"."operand" AS "r5") AS "r6"("c10", "c11", "c12")) AS "r7"("c13", "c14", "c15")) AS "r8"("c16", "c17", "c18") GROUP BY "r8"."c17") AS "r9"("c19", "c20")) AS "r10"("c21", "c22") WHERE "r4"."c8" = "r10"."c21") AS "r11"("c23", "c24", "c25") WHERE "r11"."c25" < "r11"."c24") AS "r12"("c26", "c27", "c28")) AS "r13"("c29") UNION SELECT "r26"."c56" FROM (SELECT DISTINCT "r25"."c54" FROM (SELECT DISTINCT "r24"."c52", "r24"."c53" FROM (SELECT DISTINCT "r17"."c37", "r17"."c38" FROM (SELECT DISTINCT "r16"."c35", "r16"."c36" FROM (SELECT DISTINCT "r15"."c32", "r15"."c34" FROM (SELECT DISTINCT "r14"."bounded", "r14"."document", "r14"."id", "r14"."kind", "r14"."min" FROM "qti"."expression" AS "r14") AS "r15"("c30", "c31", "c32", "c33", "c34")) AS "r16"("c35", "c36")) AS "r17"("c37", "c38") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c48", "r22"."c49" FROM (SELECT "r21"."c46", count(*) FROM (SELECT DISTINCT "r20"."c42", "r20"."c43", "r20"."c44" FROM (SELECT DISTINCT "r19"."c39", "r19"."c40", "r19"."c41" FROM (SELECT DISTINCT "r18"."child", "r18"."expression", "r18"."position" FROM "qti"."operand" AS "r18") AS "r19"("c39", "c40", "c41")) AS "r20"("c42", "c43", "c44")) AS "r21"("c45", "c46", "c47") GROUP BY "r21"."c46") AS "r22"("c48", "c49")) AS "r23"("c50", "c51") WHERE "r23"."c50" = "r17"."c37")) AS "r24"("c52", "c53") WHERE 0::bigint < "r24"."c53") AS "r25"("c54", "c55")) AS "r26"("c56")) AS "r27"("c57")) THEN
    RAISE EXCEPTION 'law __expression_capacity_operand_6iwkpxjwro is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__expression_capacity_operand_6iwkpxjwro'::text;
  END IF;
END
$$;
