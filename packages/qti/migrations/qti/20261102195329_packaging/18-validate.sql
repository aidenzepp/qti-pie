-- Validate law __node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."csm_set", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_cp_metadata_manifest_capacity_csm_2gudtvojmu"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'node'::text THEN
    IF NEW."kind" = 'cp:metadata.manifest'::"qti"."node_kind" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'cp:metadata.manifest'::"qti"."node_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."csm_set" AS "r1" WHERE "r1"."host" = "t"."c1" GROUP BY "r1"."host") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."csm_set" AS "r3" WHERE "r3"."host" = "t"."c1") LOOP
            IF "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."host" LOOP
      IF "t"."c2" = 'cp:metadata.manifest'::"qti"."node_kind" THEN
        FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."csm_set" AS "r1" WHERE "r1"."host" = "t"."c1" GROUP BY "r1"."host") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."csm_set" AS "r3" WHERE "r3"."host" = "t"."c1") LOOP
          IF "g"."c1" > 1::bigint THEN
            RAISE EXCEPTION 'law __node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_cp_metadata_manifest_capacity_csm_2gudtvojmu"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_cp_metadata_manifest_capacity_csm_cpgyjqmjbq"
  AFTER INSERT ON "qti"."csm_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_cp_metadata_manifest_capacity_csm_2gudtvojmu"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_cp_metadata_manifest_capacity_csm_yqljsdph5x"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_cp_metadata_manifest_capacity_csm_2gudtvojmu"();

-- The full violation query of law __node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c23" AS "id" FROM (SELECT DISTINCT "r12"."c21" FROM (SELECT DISTINCT "r11"."c19", "r11"."c20" FROM (SELECT DISTINCT "r4"."c8", "r10"."c18" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c2" = 'cp:metadata.manifest'::"qti"."node_kind") AS "r3"("c7")) AS "r4"("c8"), (SELECT DISTINCT "r9"."c15", "r9"."c16" FROM (SELECT "r8"."c13", count(*) FROM (SELECT DISTINCT "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10" FROM (SELECT DISTINCT "r5"."host", "r5"."id" FROM "qti"."csm_set" AS "r5") AS "r6"("c9", "c10")) AS "r7"("c11", "c12")) AS "r8"("c13", "c14") GROUP BY "r8"."c13") AS "r9"("c15", "c16")) AS "r10"("c17", "c18") WHERE "r4"."c8" = "r10"."c17") AS "r11"("c19", "c20") WHERE "r11"."c20" < 0::bigint OR "r11"."c20" > 1::bigint) AS "r12"("c21", "c22")) AS "r13"("c23")) THEN
    RAISE EXCEPTION 'law __node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__node_kind_cp_metadata_manifest_capacity_csm_set_43j65xxgiv'::text;
  END IF;
END
$$;
