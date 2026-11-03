-- Validate law __match_interaction_capacity_edge_wdgbs4ckqr: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."match_interaction" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_match_interaction_capacity_edge_66zciqz7x2"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'match_interaction'::text THEN
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."match_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind") LOOP
        IF "g"."c1" < 2::bigint OR "g"."c1" > 2::bigint THEN
          RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MatchInteraction",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["MatchInteraction"]'::text END;
        END IF;
      END LOOP;
    END LOOP;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      IF NEW."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" THEN
        FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."match_interaction" AS "r1" WHERE "r1"."id" = NEW."parent" LOOP
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind") LOOP
            IF "g"."c1" < 2::bigint OR "g"."c1" > 2::bigint THEN
              RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MatchInteraction",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["MatchInteraction"]'::text END;
            END IF;
          END LOOP;
        END LOOP;
      END IF;
    ELSE
      IF OLD."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" THEN
        FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."match_interaction" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind") LOOP
            IF "g"."c1" < 2::bigint OR "g"."c1" > 2::bigint THEN
              RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MatchInteraction",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["MatchInteraction"]'::text END;
            END IF;
          END LOOP;
        END LOOP;
      END IF;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_interaction_capacity_edge_66zciqz7x2"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_match_interaction_capacity_edge_l46raduurz"
  AFTER INSERT OR DELETE ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_interaction_capacity_edge_66zciqz7x2"();

CREATE CONSTRAINT TRIGGER "__law_match_interaction_capacity_edge_jj6e64qr7k"
  AFTER INSERT ON "qti"."match_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_interaction_capacity_edge_66zciqz7x2"();

-- The full violation query of law __match_interaction_capacity_edge_wdgbs4ckqr.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c87" AS "id" FROM (SELECT "r13"."c44" FROM (SELECT DISTINCT "r12"."c42" FROM (SELECT DISTINCT "r11"."c40", "r11"."c41" FROM (SELECT DISTINCT "r4"."c8", "r10"."c39" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."match_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")) AS "r4"("c8"), (SELECT DISTINCT "r9"."c36", "r9"."c37" FROM (SELECT "r8"."c30", count(*) FROM (SELECT DISTINCT "r7"."c18", "r7"."c19", "r7"."c20", "r7"."c21", "r7"."c22", "r7"."c23", "r7"."c24", "r7"."c25", "r7"."c26" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14", "r6"."c15", "r6"."c16", "r6"."c17" FROM (SELECT DISTINCT "r5"."child", "r5"."child_ancestry", "r5"."child_kind", "r5"."parent", "r5"."parent_ancestry", "r5"."parent_kind", "r5"."position", "r5"."tree", "r5"."version" FROM "qti"."edge" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13", "c14", "c15", "c16", "c17") WHERE "r6"."c11" = 'qti-simple-match-set'::"qti"."node_kind") AS "r7"("c18", "c19", "c20", "c21", "c22", "c23", "c24", "c25", "c26")) AS "r8"("c27", "c28", "c29", "c30", "c31", "c32", "c33", "c34", "c35") GROUP BY "r8"."c30") AS "r9"("c36", "c37")) AS "r10"("c38", "c39") WHERE "r4"."c8" = "r10"."c38") AS "r11"("c40", "c41") WHERE "r11"."c41" < 2::bigint OR "r11"."c41" > 2::bigint) AS "r12"("c42", "c43")) AS "r13"("c44") UNION SELECT "r26"."c86" FROM (SELECT DISTINCT "r25"."c85" FROM (SELECT DISTINCT "r24"."c84" FROM (SELECT DISTINCT "r17"."c52" FROM (SELECT DISTINCT "r16"."c51" FROM (SELECT DISTINCT "r15"."c45" FROM (SELECT DISTINCT "r14"."id", "r14"."max_associations_n", "r14"."min_associations_n", "r14"."response_identifier", "r14"."root_kind", "r14"."shuffle" FROM "qti"."match_interaction" AS "r14") AS "r15"("c45", "c46", "c47", "c48", "c49", "c50")) AS "r16"("c51")) AS "r17"("c52") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c80", "r22"."c81" FROM (SELECT "r21"."c74", count(*) FROM (SELECT DISTINCT "r20"."c62", "r20"."c63", "r20"."c64", "r20"."c65", "r20"."c66", "r20"."c67", "r20"."c68", "r20"."c69", "r20"."c70" FROM (SELECT DISTINCT "r19"."c53", "r19"."c54", "r19"."c55", "r19"."c56", "r19"."c57", "r19"."c58", "r19"."c59", "r19"."c60", "r19"."c61" FROM (SELECT DISTINCT "r18"."child", "r18"."child_ancestry", "r18"."child_kind", "r18"."parent", "r18"."parent_ancestry", "r18"."parent_kind", "r18"."position", "r18"."tree", "r18"."version" FROM "qti"."edge" AS "r18") AS "r19"("c53", "c54", "c55", "c56", "c57", "c58", "c59", "c60", "c61") WHERE "r19"."c55" = 'qti-simple-match-set'::"qti"."node_kind") AS "r20"("c62", "c63", "c64", "c65", "c66", "c67", "c68", "c69", "c70")) AS "r21"("c71", "c72", "c73", "c74", "c75", "c76", "c77", "c78", "c79") GROUP BY "r21"."c74") AS "r22"("c80", "c81")) AS "r23"("c82", "c83") WHERE "r23"."c82" = "r17"."c52")) AS "r24"("c84") WHERE 0::bigint < 2::bigint OR 0::bigint > 2::bigint) AS "r25"("c85")) AS "r26"("c86")) AS "r27"("c87")) THEN
    RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::text;
  END IF;
END
$$;
