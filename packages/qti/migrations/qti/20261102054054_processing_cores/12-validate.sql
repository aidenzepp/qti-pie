-- Validate law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."expression", "qti"."operator_arity_unbounded" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_uyrruypozo"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'expression'::text THEN
    IF NEW."bounded" = 'unbounded'::"qti"."arity_bound" THEN
      PERFORM 1 FROM "qti"."operator_arity_unbounded" AS "r1" WHERE "r1"."kind" = NEW."kind";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."kind" = NEW."kind" AND "r1"."bounded" = 'unbounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__expression_bounded_unbounded_in_operator_arity_5gqnghgf3l'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Expression",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["Expression"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."operator_arity_unbounded" AS "r1" WHERE "r1"."kind" = OLD."kind";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."kind" = OLD."kind" AND "r1"."bounded" = 'unbounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__expression_bounded_unbounded_in_operator_arity_5gqnghgf3l'::text,
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_uyrruypozo"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_unbounded_in_operator_arity_lktnrpzabs"
  AFTER INSERT ON "qti"."expression"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_uyrruypozo"();

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_unbounded_in_operator_arity_2yujppqgoe"
  AFTER DELETE ON "qti"."operator_arity_unbounded"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_uyrruypozo"();

-- The full violation query of law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c11" AS "kind" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c4" FROM (SELECT DISTINCT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min" FROM "qti"."expression" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c1" = 'unbounded'::"qti"."arity_bound") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c9" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."kind" FROM "qti"."operator_arity_unbounded" AS "r5") AS "r6"("c8")) AS "r7"("c9")) AS "r8"("c10") WHERE "r8"."c10" = "r4"."c7")) AS "r9"("c11")) THEN
    RAISE EXCEPTION 'law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__expression_bounded_unbounded_in_operator_arity_5gqnghgf3l'::text;
  END IF;
END
$$;
