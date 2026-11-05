-- Validate law __lom_owner_alternatives_sglqrocoop: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."external_lom", "qti"."file_lom", "qti"."lom", "qti"."manifest_lom", "qti"."resource_lom" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_owner_alternatives_axj6l27fzt"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = OLD."lom" LOOP
    IF "p"."c2" = 'external'::"qti"."lom_owner" THEN
      PERFORM 1 FROM "qti"."external_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_owner_alternatives_axj6l27fzt"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_owner_alternatives_3osu3rtyn6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = OLD."lom" LOOP
    IF "p"."c2" = 'file'::"qti"."lom_owner" THEN
      PERFORM 1 FROM "qti"."file_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_owner_alternatives_3osu3rtyn6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_owner_alternatives_qiq3rhj5yx"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'manifest'::"qti"."lom_owner" THEN
        PERFORM 1 FROM "qti"."manifest_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'resource'::"qti"."lom_owner" THEN
        PERFORM 1 FROM "qti"."resource_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'file'::"qti"."lom_owner" THEN
        PERFORM 1 FROM "qti"."file_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'external'::"qti"."lom_owner" THEN
        PERFORM 1 FROM "qti"."external_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_owner_alternatives_qiq3rhj5yx"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_owner_alternatives_eghltub2lx"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = OLD."lom" LOOP
    IF "p"."c2" = 'manifest'::"qti"."lom_owner" THEN
      PERFORM 1 FROM "qti"."manifest_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_owner_alternatives_eghltub2lx"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_owner_alternatives_db3f6t5xls"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."owner" AS "c2" FROM "qti"."lom" AS "r1" WHERE "r1"."id" = OLD."lom" LOOP
    IF "p"."c2" = 'resource'::"qti"."lom_owner" THEN
      PERFORM 1 FROM "qti"."resource_lom" AS "r1" WHERE "r1"."lom" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Lom",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Lom"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_owner_alternatives_db3f6t5xls"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_tc25kffdrg"
  AFTER DELETE ON "qti"."external_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_axj6l27fzt"();

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_f4b3pquhjh"
  AFTER DELETE ON "qti"."file_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_3osu3rtyn6"();

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_aexmebcdge"
  AFTER INSERT ON "qti"."lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_qiq3rhj5yx"();

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_m4hitjnybw"
  AFTER DELETE ON "qti"."manifest_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_eghltub2lx"();

CREATE CONSTRAINT TRIGGER "__law_lom_owner_alternatives_q2lsmppbjs"
  AFTER DELETE ON "qti"."resource_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_owner_alternatives_db3f6t5xls"();

-- The full violation query of law __lom_owner_alternatives_sglqrocoop.
DO $$
BEGIN
  IF EXISTS (SELECT "r37"."c49" AS "id" FROM (SELECT "r9"."c11" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."owner", "r1"."package" FROM "qti"."lom" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'manifest'::"qti"."lom_owner") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c9" FROM (SELECT DISTINCT "r6"."c6" FROM (SELECT DISTINCT "r5"."lom", "r5"."metadata", "r5"."package" FROM "qti"."manifest_lom" AS "r5") AS "r6"("c6", "c7", "c8")) AS "r7"("c9")) AS "r8"("c10") WHERE "r8"."c10" = "r4"."c5")) AS "r9"("c11") UNION SELECT "r18"."c24" FROM (SELECT DISTINCT "r13"."c16" FROM (SELECT DISTINCT "r12"."c15" FROM (SELECT DISTINCT "r11"."c12" FROM (SELECT DISTINCT "r10"."id", "r10"."owner", "r10"."package" FROM "qti"."lom" AS "r10") AS "r11"("c12", "c13", "c14") WHERE "r11"."c13" = 'resource'::"qti"."lom_owner") AS "r12"("c15")) AS "r13"("c16") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c17" FROM (SELECT DISTINCT "r14"."lom", "r14"."metadata", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."resource_lom" AS "r14") AS "r15"("c17", "c18", "c19", "c20", "c21")) AS "r16"("c22")) AS "r17"("c23") WHERE "r17"."c23" = "r13"."c16")) AS "r18"("c24") UNION SELECT "r27"."c36" FROM (SELECT DISTINCT "r22"."c29" FROM (SELECT DISTINCT "r21"."c28" FROM (SELECT DISTINCT "r20"."c25" FROM (SELECT DISTINCT "r19"."id", "r19"."owner", "r19"."package" FROM "qti"."lom" AS "r19") AS "r20"("c25", "c26", "c27") WHERE "r20"."c26" = 'file'::"qti"."lom_owner") AS "r21"("c28")) AS "r22"("c29") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c34" FROM (SELECT DISTINCT "r24"."c31" FROM (SELECT DISTINCT "r23"."file", "r23"."lom", "r23"."metadata", "r23"."package" FROM "qti"."file_lom" AS "r23") AS "r24"("c30", "c31", "c32", "c33")) AS "r25"("c34")) AS "r26"("c35") WHERE "r26"."c35" = "r22"."c29")) AS "r27"("c36") UNION SELECT "r36"."c48" FROM (SELECT DISTINCT "r31"."c41" FROM (SELECT DISTINCT "r30"."c40" FROM (SELECT DISTINCT "r29"."c37" FROM (SELECT DISTINCT "r28"."id", "r28"."owner", "r28"."package" FROM "qti"."lom" AS "r28") AS "r29"("c37", "c38", "c39") WHERE "r29"."c38" = 'external'::"qti"."lom_owner") AS "r30"("c40")) AS "r31"("c41") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c46" FROM (SELECT DISTINCT "r33"."c43" FROM (SELECT DISTINCT "r32"."document", "r32"."lom", "r32"."package", "r32"."resource" FROM "qti"."external_lom" AS "r32") AS "r33"("c42", "c43", "c44", "c45")) AS "r34"("c46")) AS "r35"("c47") WHERE "r35"."c47" = "r31"."c41")) AS "r36"("c48")) AS "r37"("c49")) THEN
    RAISE EXCEPTION 'law __lom_owner_alternatives_sglqrocoop is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__lom_owner_alternatives_sglqrocoop'::"pg_catalog"."text";
  END IF;
END
$$;
