-- Validate law __value_set_shape_alternatives_drug5mnsg7: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."record_value_set", "qti"."typed_value_set", "qti"."value_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_value_set_shape_alternatives_z6tj6kfwmo"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'value_set'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ValueSet",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ValueSet"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'typed_value_set'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ValueSet",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ValueSet"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ValueSet",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ValueSet"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_value_set_shape_alternatives_z6tj6kfwmo"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_value_set_shape_alternatives_j6h45dmjmw"
  AFTER DELETE ON "qti"."record_value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_shape_alternatives_z6tj6kfwmo"();

CREATE CONSTRAINT TRIGGER "__law_value_set_shape_alternatives_2hyk562674"
  AFTER DELETE ON "qti"."typed_value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_shape_alternatives_z6tj6kfwmo"();

CREATE CONSTRAINT TRIGGER "__law_value_set_shape_alternatives_mlu456gxd2"
  AFTER INSERT ON "qti"."value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_shape_alternatives_z6tj6kfwmo"();

-- The full violation query of law __value_set_shape_alternatives_drug5mnsg7.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c24" AS "id" FROM (SELECT "r9"."c13" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."declaration", "r1"."id", "r1"."role", "r1"."shape" FROM "qti"."value_set" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'typed'::"qti"."declaration_shape") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."declaration", "r5"."id" FROM "qti"."typed_value_set" AS "r5") AS "r6"("c7", "c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c6")) AS "r9"("c13") UNION SELECT "r18"."c23" FROM (SELECT DISTINCT "r13"."c19" FROM (SELECT DISTINCT "r12"."c18" FROM (SELECT DISTINCT "r11"."c15" FROM (SELECT DISTINCT "r10"."declaration", "r10"."id", "r10"."role", "r10"."shape" FROM "qti"."value_set" AS "r10") AS "r11"("c14", "c15", "c16", "c17") WHERE "r11"."c17" = 'record'::"qti"."declaration_shape") AS "r12"("c18")) AS "r13"("c19") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c21" FROM (SELECT DISTINCT "r15"."c20" FROM (SELECT DISTINCT "r14"."id" FROM "qti"."record_value_set" AS "r14") AS "r15"("c20")) AS "r16"("c21")) AS "r17"("c22") WHERE "r17"."c22" = "r13"."c19")) AS "r18"("c23")) AS "r19"("c24")) THEN
    RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::text;
  END IF;
END
$$;
