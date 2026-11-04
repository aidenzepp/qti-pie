-- Validate law __expression_bounded_bounded_in_expression_max_yfzdt2t6bl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."expression", "qti"."expression_max" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_bounded_bounded_in_expression_max_hcm7lha5v3"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'expression'::text THEN
    IF NEW."bounded" = 'bounded'::"qti"."arity_bound" THEN
      PERFORM 1 FROM "qti"."expression_max" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."kind" = NEW."kind";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."kind" = NEW."kind" AND "r1"."bounded" = 'bounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __expression_bounded_bounded_in_expression_max_yfzdt2t6bl violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__expression_bounded_bounded_in_expression_max_yfzdt2t6bl'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Expression",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["Expression"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."expression_max" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."kind" = OLD."kind";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."kind" = OLD."kind" AND "r1"."bounded" = 'bounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __expression_bounded_bounded_in_expression_max_yfzdt2t6bl violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__expression_bounded_bounded_in_expression_max_yfzdt2t6bl'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Expression",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["Expression"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_bounded_bounded_in_expression_max_hcm7lha5v3"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_bounded_in_expression_max_rp75z4ople"
  AFTER INSERT ON "qti"."expression"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_bounded_bounded_in_expression_max_hcm7lha5v3"();

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_bounded_in_expression_max_qf4nms4ihi"
  AFTER DELETE ON "qti"."expression_max"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_bounded_bounded_in_expression_max_hcm7lha5v3"();

-- The full violation query of law __expression_bounded_bounded_in_expression_max_yfzdt2t6bl.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c17" AS "id", "r9"."c18" AS "kind" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c3", "r2"."c4" FROM (SELECT DISTINCT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min" FROM "qti"."expression" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c1" = 'bounded'::"qti"."arity_bound") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13", "r7"."c14" FROM (SELECT DISTINCT "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."id", "r5"."kind", "r5"."max" FROM "qti"."expression_max" AS "r5") AS "r6"("c10", "c11", "c12")) AS "r7"("c13", "c14")) AS "r8"("c15", "c16") WHERE "r8"."c15" = "r4"."c8" AND "r8"."c16" = "r4"."c9")) AS "r9"("c17", "c18")) THEN
    RAISE EXCEPTION 'law __expression_bounded_bounded_in_expression_max_yfzdt2t6bl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__expression_bounded_bounded_in_expression_max_yfzdt2t6bl'::text;
  END IF;
END
$$;
