-- Validate law __expression_bounded_bounded_in_operator_arity_max_35sb2djj5w: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."expression", "qti"."operator_arity_max" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_bounded_bounded_in_operator_arity_ur6lckdtec"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."operator_arity_max" AS "r1" WHERE "r1"."kind" = NEW."kind";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."kind" = NEW."kind" AND "r1"."bounded" = 'bounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __expression_bounded_bounded_in_operator_arity_max_35sb2djj5w violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__expression_bounded_bounded_in_operator_arity_max_35sb2djj5w'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Expression",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Expression"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_bounded_bounded_in_operator_arity_ur6lckdtec"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_expression_bounded_bounded_in_operator_arity_y7jik36skl"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."operator_arity_max" AS "r1" WHERE "r1"."kind" = OLD."kind";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."expression" AS "r1" WHERE "r1"."kind" = OLD."kind" AND "r1"."bounded" = 'bounded'::"qti"."arity_bound" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __expression_bounded_bounded_in_operator_arity_max_35sb2djj5w violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__expression_bounded_bounded_in_operator_arity_max_35sb2djj5w'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Expression",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Expression"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_expression_bounded_bounded_in_operator_arity_y7jik36skl"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_bounded_in_operator_arity_2e7xdsejxw"
  AFTER INSERT ON "qti"."expression"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."bounded" = 'bounded'::"qti"."arity_bound")
  EXECUTE FUNCTION "qti"."__law_expression_bounded_bounded_in_operator_arity_ur6lckdtec"();

CREATE CONSTRAINT TRIGGER "__law_expression_bounded_bounded_in_operator_arity_d3y3ewyybt"
  AFTER DELETE ON "qti"."operator_arity_max"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_expression_bounded_bounded_in_operator_arity_y7jik36skl"();

-- The full violation query of law __expression_bounded_bounded_in_operator_arity_max_35sb2djj5w.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "kind" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c4" FROM (SELECT DISTINCT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min" FROM "qti"."expression" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c1" = 'bounded'::"qti"."arity_bound") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."kind", "r5"."max" FROM "qti"."operator_arity_max" AS "r5") AS "r6"("c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c7")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __expression_bounded_bounded_in_operator_arity_max_35sb2djj5w is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__expression_bounded_bounded_in_operator_arity_max_35sb2djj5w'::"pg_catalog"."text";
  END IF;
END
$$;
