-- Validate law __tree_kind_alternatives_6zrwb32r64: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document", "qti"."manifest", "qti"."tree" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_tree_kind_alternatives_jsubzrxvlj"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'tree'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."tree" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'document'::"qti"."tree_kind" THEN
          PERFORM 1 FROM "qti"."document" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'manifest'::"qti"."tree_kind" THEN
          PERFORM 1 FROM "qti"."manifest" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __tree_kind_alternatives_6zrwb32r64 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__tree_kind_alternatives_6zrwb32r64'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Tree",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Tree"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'document'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."tree" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'document'::"qti"."tree_kind" THEN
          PERFORM 1 FROM "qti"."document" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'manifest'::"qti"."tree_kind" THEN
          PERFORM 1 FROM "qti"."manifest" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __tree_kind_alternatives_6zrwb32r64 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__tree_kind_alternatives_6zrwb32r64'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Tree",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Tree"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."tree" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'document'::"qti"."tree_kind" THEN
          PERFORM 1 FROM "qti"."document" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'manifest'::"qti"."tree_kind" THEN
          PERFORM 1 FROM "qti"."manifest" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __tree_kind_alternatives_6zrwb32r64 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__tree_kind_alternatives_6zrwb32r64'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Tree",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Tree"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_tree_kind_alternatives_jsubzrxvlj"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_tree_kind_alternatives_yjvtq4lz7j"
  AFTER DELETE ON "qti"."document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_tree_kind_alternatives_jsubzrxvlj"();

CREATE CONSTRAINT TRIGGER "__law_tree_kind_alternatives_6g73tzdoj6"
  AFTER DELETE ON "qti"."manifest"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_tree_kind_alternatives_jsubzrxvlj"();

CREATE CONSTRAINT TRIGGER "__law_tree_kind_alternatives_xsjvbpn6sr"
  AFTER INSERT ON "qti"."tree"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_tree_kind_alternatives_jsubzrxvlj"();

-- The full violation query of law __tree_kind_alternatives_6zrwb32r64.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c29" AS "id" FROM (SELECT "r9"."c17" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."charset", "r1"."id", "r1"."kind", "r1"."root", "r1"."version" FROM "qti"."tree" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c3" = 'document'::"qti"."tree_kind") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c15" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."id", "r5"."package", "r5"."path", "r5"."resource", "r5"."resource_type", "r5"."root", "r5"."version" FROM "qti"."document" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12", "c13", "c14")) AS "r7"("c15")) AS "r8"("c16") WHERE "r8"."c16" = "r4"."c7")) AS "r9"("c17") UNION SELECT "r18"."c28" FROM (SELECT DISTINCT "r13"."c24" FROM (SELECT DISTINCT "r12"."c23" FROM (SELECT DISTINCT "r11"."c19" FROM (SELECT DISTINCT "r10"."charset", "r10"."id", "r10"."kind", "r10"."root", "r10"."version" FROM "qti"."tree" AS "r10") AS "r11"("c18", "c19", "c20", "c21", "c22") WHERE "r11"."c20" = 'manifest'::"qti"."tree_kind") AS "r12"("c23")) AS "r13"("c24") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c26" FROM (SELECT DISTINCT "r15"."c25" FROM (SELECT DISTINCT "r14"."id" FROM "qti"."manifest" AS "r14") AS "r15"("c25")) AS "r16"("c26")) AS "r17"("c27") WHERE "r17"."c27" = "r13"."c24")) AS "r18"("c28")) AS "r19"("c29")) THEN
    RAISE EXCEPTION 'law __tree_kind_alternatives_6zrwb32r64 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__tree_kind_alternatives_6zrwb32r64'::text;
  END IF;
END
$$;
