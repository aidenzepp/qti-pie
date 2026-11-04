-- Validate law __item_tool_shape_alternatives_3vbdi4w3ws: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."item_tool", "qti"."item_tool_both", "qti"."item_tool_name", "qti"."item_tool_version" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_item_tool_shape_alternatives_l43nv6mr4a"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'item_tool'::text THEN
    FOR "p" IN SELECT "r1"."tree" AS "c1", "r1"."shape" AS "c2" FROM "qti"."item_tool" AS "r1" WHERE "r1"."tree" = NEW."tree" LOOP
      CASE "p"."c2"
        WHEN 'both'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'nameOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_name" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'versionOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_version" AS "r1" WHERE "r1"."tree" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __item_tool_shape_alternatives_3vbdi4w3ws violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__item_tool_shape_alternatives_3vbdi4w3ws'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ItemTool",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ItemTool"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'item_tool_both'::text THEN
    FOR "p" IN SELECT "r1"."tree" AS "c1", "r1"."shape" AS "c2" FROM "qti"."item_tool" AS "r1" WHERE "r1"."tree" = OLD."tree" LOOP
      CASE "p"."c2"
        WHEN 'both'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'nameOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_name" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'versionOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_version" AS "r1" WHERE "r1"."tree" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __item_tool_shape_alternatives_3vbdi4w3ws violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__item_tool_shape_alternatives_3vbdi4w3ws'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ItemTool",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ItemTool"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'item_tool_name'::text THEN
    FOR "p" IN SELECT "r1"."tree" AS "c1", "r1"."shape" AS "c2" FROM "qti"."item_tool" AS "r1" WHERE "r1"."tree" = OLD."tree" LOOP
      CASE "p"."c2"
        WHEN 'both'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'nameOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_name" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'versionOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_version" AS "r1" WHERE "r1"."tree" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __item_tool_shape_alternatives_3vbdi4w3ws violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__item_tool_shape_alternatives_3vbdi4w3ws'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ItemTool",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ItemTool"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."tree" AS "c1", "r1"."shape" AS "c2" FROM "qti"."item_tool" AS "r1" WHERE "r1"."tree" = OLD."tree" LOOP
      CASE "p"."c2"
        WHEN 'both'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'nameOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_name" AS "r1" WHERE "r1"."tree" = "p"."c1";
        WHEN 'versionOnly'::"qti"."tool_shape" THEN
          PERFORM 1 FROM "qti"."item_tool_version" AS "r1" WHERE "r1"."tree" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __item_tool_shape_alternatives_3vbdi4w3ws violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__item_tool_shape_alternatives_3vbdi4w3ws'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ItemTool",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ItemTool"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_tool_shape_alternatives_l43nv6mr4a"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_item_tool_shape_alternatives_omcshkztbq"
  AFTER INSERT ON "qti"."item_tool"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_tool_shape_alternatives_l43nv6mr4a"();

CREATE CONSTRAINT TRIGGER "__law_item_tool_shape_alternatives_uwalguulym"
  AFTER DELETE ON "qti"."item_tool_both"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_tool_shape_alternatives_l43nv6mr4a"();

CREATE CONSTRAINT TRIGGER "__law_item_tool_shape_alternatives_gh3kdjpkx4"
  AFTER DELETE ON "qti"."item_tool_name"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_tool_shape_alternatives_l43nv6mr4a"();

CREATE CONSTRAINT TRIGGER "__law_item_tool_shape_alternatives_bowpk65l2h"
  AFTER DELETE ON "qti"."item_tool_version"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_tool_shape_alternatives_l43nv6mr4a"();

-- The full violation query of law __item_tool_shape_alternatives_3vbdi4w3ws.
DO $$
BEGIN
  IF EXISTS (SELECT "r28"."c29" AS "tree" FROM (SELECT "r9"."c10" FROM (SELECT DISTINCT "r4"."c4" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."shape", "r1"."tree" FROM "qti"."item_tool" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c1" = 'both'::"qti"."tool_shape") AS "r3"("c3")) AS "r4"("c4") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c8" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."tool_name", "r5"."tool_version", "r5"."tree" FROM "qti"."item_tool_both" AS "r5") AS "r6"("c5", "c6", "c7")) AS "r7"("c8")) AS "r8"("c9") WHERE "r8"."c9" = "r4"."c4")) AS "r9"("c10") UNION SELECT "r18"."c19" FROM (SELECT DISTINCT "r13"."c14" FROM (SELECT DISTINCT "r12"."c13" FROM (SELECT DISTINCT "r11"."c12" FROM (SELECT DISTINCT "r10"."shape", "r10"."tree" FROM "qti"."item_tool" AS "r10") AS "r11"("c11", "c12") WHERE "r11"."c11" = 'nameOnly'::"qti"."tool_shape") AS "r12"("c13")) AS "r13"("c14") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c17" FROM (SELECT DISTINCT "r15"."c16" FROM (SELECT DISTINCT "r14"."tool_name", "r14"."tree" FROM "qti"."item_tool_name" AS "r14") AS "r15"("c15", "c16")) AS "r16"("c17")) AS "r17"("c18") WHERE "r17"."c18" = "r13"."c14")) AS "r18"("c19") UNION SELECT "r27"."c28" FROM (SELECT DISTINCT "r22"."c23" FROM (SELECT DISTINCT "r21"."c22" FROM (SELECT DISTINCT "r20"."c21" FROM (SELECT DISTINCT "r19"."shape", "r19"."tree" FROM "qti"."item_tool" AS "r19") AS "r20"("c20", "c21") WHERE "r20"."c20" = 'versionOnly'::"qti"."tool_shape") AS "r21"("c22")) AS "r22"("c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c26" FROM (SELECT DISTINCT "r24"."c25" FROM (SELECT DISTINCT "r23"."tool_version", "r23"."tree" FROM "qti"."item_tool_version" AS "r23") AS "r24"("c24", "c25")) AS "r25"("c26")) AS "r26"("c27") WHERE "r26"."c27" = "r22"."c23")) AS "r27"("c28")) AS "r28"("c29")) THEN
    RAISE EXCEPTION 'law __item_tool_shape_alternatives_3vbdi4w3ws is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__item_tool_shape_alternatives_3vbdi4w3ws'::text;
  END IF;
END
$$;
