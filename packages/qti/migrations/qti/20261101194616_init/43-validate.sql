-- Validate law __value_set_capacity_declared_value_xru4ub4zai: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declared_value", "qti"."value_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_value_set_capacity_declared_value_z3glpgyy2h"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
BEGIN
  IF TG_TABLE_NAME = 'value_set'::text THEN
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      PERFORM 1 FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __value_set_capacity_declared_value_xru4ub4zai violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__value_set_capacity_declared_value_xru4ub4zai'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ValueSet",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ValueSet"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = OLD."value_set" LOOP
      PERFORM 1 FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __value_set_capacity_declared_value_xru4ub4zai violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__value_set_capacity_declared_value_xru4ub4zai'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ValueSet",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ValueSet"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_value_set_capacity_declared_value_z3glpgyy2h"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_value_set_capacity_declared_value_tyljrkdi67"
  AFTER DELETE ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_capacity_declared_value_z3glpgyy2h"();

CREATE CONSTRAINT TRIGGER "__law_value_set_capacity_declared_value_xzgk4olpx2"
  AFTER INSERT ON "qti"."value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_capacity_declared_value_z3glpgyy2h"();

-- The full violation query of law __value_set_capacity_declared_value_xru4ub4zai.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c59" AS "id" FROM (SELECT "r13"."c30" FROM (SELECT DISTINCT "r12"."c28" FROM (SELECT DISTINCT "r11"."c26", "r11"."c27" FROM (SELECT DISTINCT "r4"."c6", "r10"."c25" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."declaration", "r1"."id", "r1"."role", "r1"."shape" FROM "qti"."value_set" AS "r1") AS "r2"("c1", "c2", "c3", "c4")) AS "r3"("c5")) AS "r4"("c6"), (SELECT DISTINCT "r9"."c22", "r9"."c23" FROM (SELECT "r8"."c21", count(*) FROM (SELECT DISTINCT "r7"."c12", "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."base_type", "r5"."id", "r5"."position", "r5"."shape", "r5"."value_set" FROM "qti"."declared_value" AS "r5") AS "r6"("c7", "c8", "c9", "c10", "c11")) AS "r7"("c12", "c13", "c14", "c15", "c16")) AS "r8"("c17", "c18", "c19", "c20", "c21") GROUP BY "r8"."c21") AS "r9"("c22", "c23")) AS "r10"("c24", "c25") WHERE "r4"."c6" = "r10"."c24") AS "r11"("c26", "c27") WHERE "r11"."c27" < 1::bigint) AS "r12"("c28", "c29")) AS "r13"("c30") UNION SELECT "r26"."c58" FROM (SELECT DISTINCT "r25"."c57" FROM (SELECT DISTINCT "r24"."c56" FROM (SELECT DISTINCT "r17"."c36" FROM (SELECT DISTINCT "r16"."c35" FROM (SELECT DISTINCT "r15"."c32" FROM (SELECT DISTINCT "r14"."declaration", "r14"."id", "r14"."role", "r14"."shape" FROM "qti"."value_set" AS "r14") AS "r15"("c31", "c32", "c33", "c34")) AS "r16"("c35")) AS "r17"("c36") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c52", "r22"."c53" FROM (SELECT "r21"."c51", count(*) FROM (SELECT DISTINCT "r20"."c42", "r20"."c43", "r20"."c44", "r20"."c45", "r20"."c46" FROM (SELECT DISTINCT "r19"."c37", "r19"."c38", "r19"."c39", "r19"."c40", "r19"."c41" FROM (SELECT DISTINCT "r18"."base_type", "r18"."id", "r18"."position", "r18"."shape", "r18"."value_set" FROM "qti"."declared_value" AS "r18") AS "r19"("c37", "c38", "c39", "c40", "c41")) AS "r20"("c42", "c43", "c44", "c45", "c46")) AS "r21"("c47", "c48", "c49", "c50", "c51") GROUP BY "r21"."c51") AS "r22"("c52", "c53")) AS "r23"("c54", "c55") WHERE "r23"."c54" = "r17"."c36")) AS "r24"("c56") WHERE 0::bigint < 1::bigint) AS "r25"("c57")) AS "r26"("c58")) AS "r27"("c59")) THEN
    RAISE EXCEPTION 'law __value_set_capacity_declared_value_xru4ub4zai is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__value_set_capacity_declared_value_xru4ub4zai'::text;
  END IF;
END
$$;
