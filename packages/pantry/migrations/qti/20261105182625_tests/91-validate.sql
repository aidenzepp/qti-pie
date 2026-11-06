-- Validate law __item_ref_resolution_target_kind_alternatives_n7f3awtjcc: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."item_ref_document", "qti"."item_ref_lti", "qti"."item_ref_resolution" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_xs2wsedckb"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."item_ref" AS "c1", "r1"."target_kind" AS "c2" FROM "qti"."item_ref_resolution" AS "r1" WHERE "r1"."item_ref" = OLD."item_ref" LOOP
    IF "p"."c2" = 'item'::"qti"."item_ref_target" THEN
      PERFORM 1 FROM "qti"."item_ref_document" AS "r1" WHERE "r1"."item_ref" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __item_ref_resolution_target_kind_alternatives_n7f3awtjcc violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__item_ref_resolution_target_kind_alternatives_n7f3awtjcc'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemRefResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemRefResolution"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_xs2wsedckb"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_cbwph6v6jl"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."item_ref" AS "c1", "r1"."target_kind" AS "c2" FROM "qti"."item_ref_resolution" AS "r1" WHERE "r1"."item_ref" = OLD."item_ref" LOOP
    IF "p"."c2" = 'lti'::"qti"."item_ref_target" THEN
      PERFORM 1 FROM "qti"."item_ref_lti" AS "r1" WHERE "r1"."item_ref" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __item_ref_resolution_target_kind_alternatives_n7f3awtjcc violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__item_ref_resolution_target_kind_alternatives_n7f3awtjcc'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemRefResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemRefResolution"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_cbwph6v6jl"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_6jqcb57r2t"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."item_ref" AS "c1", "r1"."target_kind" AS "c2" FROM "qti"."item_ref_resolution" AS "r1" WHERE "r1"."item_ref" = NEW."item_ref" LOOP
    CASE "p"."c2"
      WHEN 'item'::"qti"."item_ref_target" THEN
        PERFORM 1 FROM "qti"."item_ref_document" AS "r1" WHERE "r1"."item_ref" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __item_ref_resolution_target_kind_alternatives_n7f3awtjcc violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__item_ref_resolution_target_kind_alternatives_n7f3awtjcc'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemRefResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemRefResolution"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'lti'::"qti"."item_ref_target" THEN
        PERFORM 1 FROM "qti"."item_ref_lti" AS "r1" WHERE "r1"."item_ref" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __item_ref_resolution_target_kind_alternatives_n7f3awtjcc violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__item_ref_resolution_target_kind_alternatives_n7f3awtjcc'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemRefResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemRefResolution"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_6jqcb57r2t"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_item_ref_resolution_target_kind_alternatives_4u3o6zdms5"
  AFTER DELETE ON "qti"."item_ref_document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_xs2wsedckb"();

CREATE CONSTRAINT TRIGGER "__law_item_ref_resolution_target_kind_alternatives_wdpfilq2hj"
  AFTER DELETE ON "qti"."item_ref_lti"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_cbwph6v6jl"();

CREATE CONSTRAINT TRIGGER "__law_item_ref_resolution_target_kind_alternatives_bafmpu3c6z"
  AFTER INSERT ON "qti"."item_ref_resolution"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_6jqcb57r2t"();

-- The full violation query of law __item_ref_resolution_target_kind_alternatives_n7f3awtjcc.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c27" AS "itemRef" FROM (SELECT "r9"."c13" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."item_ref", "r1"."package", "r1"."path", "r1"."target_kind" FROM "qti"."item_ref_resolution" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'item'::"qti"."item_ref_target") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."document", "r5"."item_ref", "r5"."package", "r5"."path" FROM "qti"."item_ref_document" AS "r5") AS "r6"("c7", "c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c6")) AS "r9"("c13") UNION SELECT "r18"."c26" FROM (SELECT DISTINCT "r13"."c19" FROM (SELECT DISTINCT "r12"."c18" FROM (SELECT DISTINCT "r11"."c14" FROM (SELECT DISTINCT "r10"."item_ref", "r10"."package", "r10"."path", "r10"."target_kind" FROM "qti"."item_ref_resolution" AS "r10") AS "r11"("c14", "c15", "c16", "c17") WHERE "r11"."c17" = 'lti'::"qti"."item_ref_target") AS "r12"("c18")) AS "r13"("c19") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c24" FROM (SELECT DISTINCT "r15"."c20" FROM (SELECT DISTINCT "r14"."item_ref", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."item_ref_lti" AS "r14") AS "r15"("c20", "c21", "c22", "c23")) AS "r16"("c24")) AS "r17"("c25") WHERE "r17"."c25" = "r13"."c19")) AS "r18"("c26")) AS "r19"("c27")) THEN
    RAISE EXCEPTION 'law __item_ref_resolution_target_kind_alternatives_n7f3awtjcc is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__item_ref_resolution_target_kind_alternatives_n7f3awtjcc'::"pg_catalog"."text";
  END IF;
END
$$;
