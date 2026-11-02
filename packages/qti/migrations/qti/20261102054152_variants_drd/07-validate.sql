-- Validate law __manifest_id_holder_alternatives_hgch5sybz6: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."manifest_id", "qti"."manifest_id_of_manifest", "qti"."manifest_id_of_resource", "qti"."manifest_id_of_variant" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'manifest_id'::text THEN
    FOR "p" IN SELECT "r1"."package" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."manifest_id" AS "r1" WHERE "r1"."package" = NEW."package" AND "r1"."id" = NEW."id" LOOP
      CASE "p"."c3"
        WHEN 'manifest'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_manifest" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'resource'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_resource" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'variant'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_variant" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __manifest_id_holder_alternatives_hgch5sybz6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__manifest_id_holder_alternatives_hgch5sybz6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ManifestId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["ManifestId"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'manifest_id_of_manifest'::text THEN
    FOR "p" IN SELECT "r1"."package" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."manifest_id" AS "r1" WHERE "r1"."package" = OLD."package" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'manifest'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_manifest" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'resource'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_resource" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'variant'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_variant" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __manifest_id_holder_alternatives_hgch5sybz6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__manifest_id_holder_alternatives_hgch5sybz6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ManifestId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["ManifestId"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'manifest_id_of_resource'::text THEN
    FOR "p" IN SELECT "r1"."package" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."manifest_id" AS "r1" WHERE "r1"."package" = OLD."package" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'manifest'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_manifest" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'resource'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_resource" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'variant'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_variant" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __manifest_id_holder_alternatives_hgch5sybz6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__manifest_id_holder_alternatives_hgch5sybz6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ManifestId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["ManifestId"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."package" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."manifest_id" AS "r1" WHERE "r1"."package" = OLD."package" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'manifest'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_manifest" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'resource'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_resource" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'variant'::"qti"."manifest_id_holder" THEN
          PERFORM 1 FROM "qti"."manifest_id_of_variant" AS "r1" WHERE "r1"."package" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __manifest_id_holder_alternatives_hgch5sybz6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__manifest_id_holder_alternatives_hgch5sybz6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ManifestId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["ManifestId"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_manifest_id_holder_alternatives_n3trdmevxd"
  AFTER INSERT ON "qti"."manifest_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"();

CREATE CONSTRAINT TRIGGER "__law_manifest_id_holder_alternatives_5ovauixwzl"
  AFTER DELETE ON "qti"."manifest_id_of_manifest"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"();

CREATE CONSTRAINT TRIGGER "__law_manifest_id_holder_alternatives_ughu4aiuxc"
  AFTER DELETE ON "qti"."manifest_id_of_resource"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"();

CREATE CONSTRAINT TRIGGER "__law_manifest_id_holder_alternatives_tdhldo4cny"
  AFTER DELETE ON "qti"."manifest_id_of_variant"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"();

-- The full violation query of law __manifest_id_holder_alternatives_hgch5sybz6.
DO $$
BEGIN
  IF EXISTS (SELECT "r28"."c46" AS "package", "r28"."c47" AS "id" FROM (SELECT "r9"."c14", "r9"."c15"::text FROM (SELECT DISTINCT "r4"."c6", "r4"."c7" FROM (SELECT DISTINCT "r3"."c4", "r3"."c5" FROM (SELECT DISTINCT "r2"."c3", "r2"."c2" FROM (SELECT DISTINCT "r1"."holder", "r1"."id", "r1"."package" FROM "qti"."manifest_id" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c1" = 'manifest'::"qti"."manifest_id_holder") AS "r3"("c4", "c5")) AS "r4"("c6", "c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10", "r7"."c11" FROM (SELECT DISTINCT "r6"."c9", "r6"."c8" FROM (SELECT DISTINCT "r5"."id", "r5"."package" FROM "qti"."manifest_id_of_manifest" AS "r5") AS "r6"("c8", "c9")) AS "r7"("c10", "c11")) AS "r8"("c12", "c13") WHERE "r8"."c12" = "r4"."c6" AND "r8"."c13" = "r4"."c7")) AS "r9"("c14", "c15") UNION SELECT "r18"."c29", "r18"."c30"::text FROM (SELECT DISTINCT "r13"."c21", "r13"."c22" FROM (SELECT DISTINCT "r12"."c19", "r12"."c20" FROM (SELECT DISTINCT "r11"."c18", "r11"."c17" FROM (SELECT DISTINCT "r10"."holder", "r10"."id", "r10"."package" FROM "qti"."manifest_id" AS "r10") AS "r11"("c16", "c17", "c18") WHERE "r11"."c16" = 'resource'::"qti"."manifest_id_holder") AS "r12"("c19", "c20")) AS "r13"("c21", "c22") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c25", "r16"."c26" FROM (SELECT DISTINCT "r15"."c24", "r15"."c23" FROM (SELECT DISTINCT "r14"."id", "r14"."package" FROM "qti"."manifest_id_of_resource" AS "r14") AS "r15"("c23", "c24")) AS "r16"("c25", "c26")) AS "r17"("c27", "c28") WHERE "r17"."c27" = "r13"."c21" AND "r17"."c28" = "r13"."c22")) AS "r18"("c29", "c30") UNION SELECT "r27"."c44", "r27"."c45"::text FROM (SELECT DISTINCT "r22"."c36", "r22"."c37" FROM (SELECT DISTINCT "r21"."c34", "r21"."c35" FROM (SELECT DISTINCT "r20"."c33", "r20"."c32" FROM (SELECT DISTINCT "r19"."holder", "r19"."id", "r19"."package" FROM "qti"."manifest_id" AS "r19") AS "r20"("c31", "c32", "c33") WHERE "r20"."c31" = 'variant'::"qti"."manifest_id_holder") AS "r21"("c34", "c35")) AS "r22"("c36", "c37") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c40", "r25"."c41" FROM (SELECT DISTINCT "r24"."c39", "r24"."c38" FROM (SELECT DISTINCT "r23"."id", "r23"."package" FROM "qti"."manifest_id_of_variant" AS "r23") AS "r24"("c38", "c39")) AS "r25"("c40", "c41")) AS "r26"("c42", "c43") WHERE "r26"."c42" = "r22"."c36" AND "r26"."c43" = "r22"."c37")) AS "r27"("c44", "c45")) AS "r28"("c46", "c47")) THEN
    RAISE EXCEPTION 'law __manifest_id_holder_alternatives_hgch5sybz6 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__manifest_id_holder_alternatives_hgch5sybz6'::text;
  END IF;
END
$$;
