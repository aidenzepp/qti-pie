-- Validate law __interaction_binding_shape_alternatives_uh7dna62r2: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."interaction_binding", "qti"."record_binding", "qti"."typed_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_eaa2crx4u5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."node" LOOP
    CASE "p"."c2"
      WHEN 'typed'::"qti"."declaration_shape" THEN
        PERFORM 1 FROM "qti"."typed_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["InteractionBinding",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["InteractionBinding"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'record'::"qti"."declaration_shape" THEN
        PERFORM 1 FROM "qti"."record_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["InteractionBinding",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["InteractionBinding"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_interaction_binding_shape_alternatives_eaa2crx4u5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_5qx2nnzftp"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
    IF "p"."c2" = 'record'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."record_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["InteractionBinding",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["InteractionBinding"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_interaction_binding_shape_alternatives_5qx2nnzftp"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_at745fv3y3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
    IF "p"."c2" = 'typed'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."typed_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["InteractionBinding",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["InteractionBinding"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_interaction_binding_shape_alternatives_at745fv3y3"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_interaction_binding_shape_alternatives_bu7vqbbmbd"
  AFTER INSERT ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_eaa2crx4u5"();

CREATE CONSTRAINT TRIGGER "__law_interaction_binding_shape_alternatives_n6upj3augy"
  AFTER DELETE ON "qti"."record_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_5qx2nnzftp"();

CREATE CONSTRAINT TRIGGER "__law_interaction_binding_shape_alternatives_3n2kzosyea"
  AFTER DELETE ON "qti"."typed_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_at745fv3y3"();

-- The full violation query of law __interaction_binding_shape_alternatives_uh7dna62r2.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c34" AS "node" FROM (SELECT "r9"."c19" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c5" FROM (SELECT DISTINCT "r1"."adaptive", "r1"."ancestry", "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape" FROM "qti"."interaction_binding" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c7" = 'typed'::"qti"."declaration_shape") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c17" FROM (SELECT DISTINCT "r6"."c15" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."document", "r5"."interaction_kind", "r5"."max_count", "r5"."node", "r5"."response_identifier" FROM "qti"."typed_binding" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14", "c15", "c16")) AS "r7"("c17")) AS "r8"("c18") WHERE "r8"."c18" = "r4"."c9")) AS "r9"("c19") UNION SELECT "r18"."c33" FROM (SELECT DISTINCT "r13"."c28" FROM (SELECT DISTINCT "r12"."c27" FROM (SELECT DISTINCT "r11"."c24" FROM (SELECT DISTINCT "r10"."adaptive", "r10"."ancestry", "r10"."document", "r10"."interaction_kind", "r10"."node", "r10"."response_identifier", "r10"."shape" FROM "qti"."interaction_binding" AS "r10") AS "r11"("c20", "c21", "c22", "c23", "c24", "c25", "c26") WHERE "r11"."c26" = 'record'::"qti"."declaration_shape") AS "r12"("c27")) AS "r13"("c28") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c31" FROM (SELECT DISTINCT "r15"."c30" FROM (SELECT DISTINCT "r14"."interaction_kind", "r14"."node" FROM "qti"."record_binding" AS "r14") AS "r15"("c29", "c30")) AS "r16"("c31")) AS "r17"("c32") WHERE "r17"."c32" = "r13"."c28")) AS "r18"("c33")) AS "r19"("c34")) THEN
    RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::"pg_catalog"."text";
  END IF;
END
$$;
