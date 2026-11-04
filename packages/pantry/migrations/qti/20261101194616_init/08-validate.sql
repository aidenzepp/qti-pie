-- Validate law __interaction_binding_shape_alternatives_uh7dna62r2: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."interaction_binding", "qti"."record_binding", "qti"."typed_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_43wn74vwrt"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'interaction_binding'::text THEN
    FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."node" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["InteractionBinding",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["InteractionBinding"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'typed_binding'::text THEN
    FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["InteractionBinding",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["InteractionBinding"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_binding" AS "r1" WHERE "r1"."node" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["InteractionBinding",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["InteractionBinding"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_interaction_binding_shape_alternatives_43wn74vwrt"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_interaction_binding_shape_alternatives_xiunwhaz7u"
  AFTER INSERT ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_43wn74vwrt"();

CREATE CONSTRAINT TRIGGER "__law_interaction_binding_shape_alternatives_piejm2wh7b"
  AFTER DELETE ON "qti"."record_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_43wn74vwrt"();

CREATE CONSTRAINT TRIGGER "__law_interaction_binding_shape_alternatives_aec4jxfna5"
  AFTER DELETE ON "qti"."typed_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_interaction_binding_shape_alternatives_43wn74vwrt"();

-- The full violation query of law __interaction_binding_shape_alternatives_uh7dna62r2.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c30" AS "node" FROM (SELECT "r9"."c17" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape" FROM "qti"."interaction_binding" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = 'typed'::"qti"."declaration_shape") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c15" FROM (SELECT DISTINCT "r6"."c13" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."document", "r5"."interaction_kind", "r5"."max_count", "r5"."node", "r5"."response_identifier" FROM "qti"."typed_binding" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12", "c13", "c14")) AS "r7"("c15")) AS "r8"("c16") WHERE "r8"."c16" = "r4"."c7")) AS "r9"("c17") UNION SELECT "r18"."c29" FROM (SELECT DISTINCT "r13"."c24" FROM (SELECT DISTINCT "r12"."c23" FROM (SELECT DISTINCT "r11"."c20" FROM (SELECT DISTINCT "r10"."document", "r10"."interaction_kind", "r10"."node", "r10"."response_identifier", "r10"."shape" FROM "qti"."interaction_binding" AS "r10") AS "r11"("c18", "c19", "c20", "c21", "c22") WHERE "r11"."c22" = 'record'::"qti"."declaration_shape") AS "r12"("c23")) AS "r13"("c24") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c27" FROM (SELECT DISTINCT "r15"."c26" FROM (SELECT DISTINCT "r14"."interaction_kind", "r14"."node" FROM "qti"."record_binding" AS "r14") AS "r15"("c25", "c26")) AS "r16"("c27")) AS "r17"("c28") WHERE "r17"."c28" = "r13"."c24")) AS "r18"("c29")) AS "r19"("c30")) THEN
    RAISE EXCEPTION 'law __interaction_binding_shape_alternatives_uh7dna62r2 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__interaction_binding_shape_alternatives_uh7dna62r2'::text;
  END IF;
END
$$;
