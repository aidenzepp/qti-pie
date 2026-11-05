-- Validate law __coords_shape_alternatives_u2axxdlpvr: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."coords", "qti"."coords_circle", "qti"."coords_default", "qti"."coords_ellipse", "qti"."coords_poly", "qti"."coords_rect" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_shape_alternatives_rahmagnsax"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = NEW."node" LOOP
    CASE "p"."c2"
      WHEN 'circle'::"qti"."shape" THEN
        PERFORM 1 FROM "qti"."coords_circle" AS "r1" WHERE "r1"."node" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'default'::"qti"."shape" THEN
        PERFORM 1 FROM "qti"."coords_default" AS "r1" WHERE "r1"."node" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'ellipse'::"qti"."shape" THEN
        PERFORM 1 FROM "qti"."coords_ellipse" AS "r1" WHERE "r1"."node" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'poly'::"qti"."shape" THEN
        PERFORM 1 FROM "qti"."coords_poly" AS "r1" WHERE "r1"."node" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'rect'::"qti"."shape" THEN
        PERFORM 1 FROM "qti"."coords_rect" AS "r1" WHERE "r1"."node" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_shape_alternatives_rahmagnsax"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_shape_alternatives_tdyo4sokmb"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
    IF "p"."c2" = 'circle'::"qti"."shape" THEN
      PERFORM 1 FROM "qti"."coords_circle" AS "r1" WHERE "r1"."node" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_shape_alternatives_tdyo4sokmb"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_shape_alternatives_jxov2ngnl5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
    IF "p"."c2" = 'default'::"qti"."shape" THEN
      PERFORM 1 FROM "qti"."coords_default" AS "r1" WHERE "r1"."node" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_shape_alternatives_jxov2ngnl5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_shape_alternatives_qw3fyxjif2"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
    IF "p"."c2" = 'ellipse'::"qti"."shape" THEN
      PERFORM 1 FROM "qti"."coords_ellipse" AS "r1" WHERE "r1"."node" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_shape_alternatives_qw3fyxjif2"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_shape_alternatives_z3xztk5jj5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
    IF "p"."c2" = 'poly'::"qti"."shape" THEN
      PERFORM 1 FROM "qti"."coords_poly" AS "r1" WHERE "r1"."node" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_shape_alternatives_z3xztk5jj5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_shape_alternatives_gb646jtoxh"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."node" AS "c1", "r1"."shape" AS "c2" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = OLD."node" LOOP
    IF "p"."c2" = 'rect'::"qti"."shape" THEN
      PERFORM 1 FROM "qti"."coords_rect" AS "r1" WHERE "r1"."node" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_shape_alternatives_gb646jtoxh"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_coords_shape_alternatives_sfmob5zxf5"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_shape_alternatives_rahmagnsax"();

CREATE CONSTRAINT TRIGGER "__law_coords_shape_alternatives_vke3hlc2ud"
  AFTER DELETE ON "qti"."coords_circle"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_shape_alternatives_tdyo4sokmb"();

CREATE CONSTRAINT TRIGGER "__law_coords_shape_alternatives_mgcovtevc6"
  AFTER DELETE ON "qti"."coords_default"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_shape_alternatives_jxov2ngnl5"();

CREATE CONSTRAINT TRIGGER "__law_coords_shape_alternatives_datwc4slwz"
  AFTER DELETE ON "qti"."coords_ellipse"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_shape_alternatives_qw3fyxjif2"();

CREATE CONSTRAINT TRIGGER "__law_coords_shape_alternatives_bmw5u2dh7p"
  AFTER DELETE ON "qti"."coords_poly"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_shape_alternatives_z3xztk5jj5"();

CREATE CONSTRAINT TRIGGER "__law_coords_shape_alternatives_6xrsacb4gc"
  AFTER DELETE ON "qti"."coords_rect"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_shape_alternatives_gb646jtoxh"();

-- The full violation query of law __coords_shape_alternatives_u2axxdlpvr.
DO $$
BEGIN
  IF EXISTS (SELECT "r46"."c56" AS "node" FROM (SELECT "r9"."c11" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."node", "r1"."owner_kind", "r1"."shape", "r1"."value" FROM "qti"."coords" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c3" = 'circle'::"qti"."shape") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c9" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."node", "r5"."value" FROM "qti"."coords_circle" AS "r5") AS "r6"("c7", "c8")) AS "r7"("c9")) AS "r8"("c10") WHERE "r8"."c10" = "r4"."c6")) AS "r9"("c11") UNION SELECT "r18"."c22" FROM (SELECT DISTINCT "r13"."c17" FROM (SELECT DISTINCT "r12"."c16" FROM (SELECT DISTINCT "r11"."c12" FROM (SELECT DISTINCT "r10"."node", "r10"."owner_kind", "r10"."shape", "r10"."value" FROM "qti"."coords" AS "r10") AS "r11"("c12", "c13", "c14", "c15") WHERE "r11"."c14" = 'default'::"qti"."shape") AS "r12"("c16")) AS "r13"("c17") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c20" FROM (SELECT DISTINCT "r15"."c18" FROM (SELECT DISTINCT "r14"."node", "r14"."value" FROM "qti"."coords_default" AS "r14") AS "r15"("c18", "c19")) AS "r16"("c20")) AS "r17"("c21") WHERE "r17"."c21" = "r13"."c17")) AS "r18"("c22") UNION SELECT "r27"."c33" FROM (SELECT DISTINCT "r22"."c28" FROM (SELECT DISTINCT "r21"."c27" FROM (SELECT DISTINCT "r20"."c23" FROM (SELECT DISTINCT "r19"."node", "r19"."owner_kind", "r19"."shape", "r19"."value" FROM "qti"."coords" AS "r19") AS "r20"("c23", "c24", "c25", "c26") WHERE "r20"."c25" = 'ellipse'::"qti"."shape") AS "r21"("c27")) AS "r22"("c28") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c31" FROM (SELECT DISTINCT "r24"."c29" FROM (SELECT DISTINCT "r23"."node", "r23"."value" FROM "qti"."coords_ellipse" AS "r23") AS "r24"("c29", "c30")) AS "r25"("c31")) AS "r26"("c32") WHERE "r26"."c32" = "r22"."c28")) AS "r27"("c33") UNION SELECT "r36"."c44" FROM (SELECT DISTINCT "r31"."c39" FROM (SELECT DISTINCT "r30"."c38" FROM (SELECT DISTINCT "r29"."c34" FROM (SELECT DISTINCT "r28"."node", "r28"."owner_kind", "r28"."shape", "r28"."value" FROM "qti"."coords" AS "r28") AS "r29"("c34", "c35", "c36", "c37") WHERE "r29"."c36" = 'poly'::"qti"."shape") AS "r30"("c38")) AS "r31"("c39") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c42" FROM (SELECT DISTINCT "r33"."c40" FROM (SELECT DISTINCT "r32"."node", "r32"."value" FROM "qti"."coords_poly" AS "r32") AS "r33"("c40", "c41")) AS "r34"("c42")) AS "r35"("c43") WHERE "r35"."c43" = "r31"."c39")) AS "r36"("c44") UNION SELECT "r45"."c55" FROM (SELECT DISTINCT "r40"."c50" FROM (SELECT DISTINCT "r39"."c49" FROM (SELECT DISTINCT "r38"."c45" FROM (SELECT DISTINCT "r37"."node", "r37"."owner_kind", "r37"."shape", "r37"."value" FROM "qti"."coords" AS "r37") AS "r38"("c45", "c46", "c47", "c48") WHERE "r38"."c47" = 'rect'::"qti"."shape") AS "r39"("c49")) AS "r40"("c50") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c53" FROM (SELECT DISTINCT "r42"."c51" FROM (SELECT DISTINCT "r41"."node", "r41"."value" FROM "qti"."coords_rect" AS "r41") AS "r42"("c51", "c52")) AS "r43"("c53")) AS "r44"("c54") WHERE "r44"."c54" = "r40"."c50")) AS "r45"("c55")) AS "r46"("c56")) THEN
    RAISE EXCEPTION 'law __coords_shape_alternatives_u2axxdlpvr is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__coords_shape_alternatives_u2axxdlpvr'::"pg_catalog"."text";
  END IF;
END
$$;
