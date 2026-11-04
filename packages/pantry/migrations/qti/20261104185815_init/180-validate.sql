-- Validate law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."expression", "qti"."operator_arity_unbounded" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_7jebdvag2q"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."operator_arity_unbounded" AS "r1" WHERE "r1"."kind" = NEW."kind";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."kind" = NEW."kind" AND "r1"."bounded" = 'unbounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__expression_bounded_unbounded_in_operator_arity_5gqnghgf3l'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Expression",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Expression"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_7jebdvag2q"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_cufy3cnxjg"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."operator_arity_unbounded" AS "r1" WHERE "r1"."kind" = OLD."kind";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."kind" = OLD."kind" AND "r1"."bounded" = 'unbounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__expression_bounded_unbounded_in_operator_arity_5gqnghgf3l'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Expression",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Expression"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_cufy3cnxjg"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_unbounded_in_operator_arity_l53hya6hew"
  AFTER INSERT ON "qti"."expression"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."bounded" = 'unbounded'::"qti"."arity_bound")
  EXECUTE FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_7jebdvag2q"();

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_unbounded_in_operator_arity_ystbc4ksaw"
  AFTER DELETE ON "qti"."operator_arity_unbounded"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_bounded_unbounded_in_operator_arity_cufy3cnxjg"();

-- The full violation query of law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c11" AS "kind" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c4" FROM (SELECT DISTINCT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min" FROM "qti"."expression" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c1" = 'unbounded'::"qti"."arity_bound") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c9" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."kind" FROM "qti"."operator_arity_unbounded" AS "r5") AS "r6"("c8")) AS "r7"("c9")) AS "r8"("c10") WHERE "r8"."c10" = "r4"."c7")) AS "r9"("c11")) THEN
    RAISE EXCEPTION 'law __expression_bounded_unbounded_in_operator_arity_5gqnghgf3l is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__expression_bounded_unbounded_in_operator_arity_5gqnghgf3l'::"pg_catalog"."text";
  END IF;
END
$$;
