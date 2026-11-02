-- Validate law __document_id_holder_alternatives_pwzd7tub5c: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."context_declaration_id", "qti"."document_id", "qti"."html_id", "qti"."item_body_id", "qti"."printed_variable_id", "qti"."response_declaration_id" IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER "__law_document_id_holder_alternatives_xredhbipsh" ON "qti"."document_id";

DROP TRIGGER "__law_document_id_holder_alternatives_hewcediiwx" ON "qti"."response_declaration_id";

CREATE OR REPLACE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'document_id'::text THEN
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = NEW."document" AND "r1"."id" = NEW."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'htmlId'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."html_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'itemBody'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."item_body_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'printedVariable'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."printed_variable_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'contextDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'response_declaration_id'::text THEN
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'htmlId'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."html_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'itemBody'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."item_body_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'printedVariable'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."printed_variable_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'contextDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'html_id'::text THEN
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'htmlId'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."html_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'itemBody'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."item_body_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'printedVariable'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."printed_variable_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'contextDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'item_body_id'::text THEN
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'htmlId'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."html_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'itemBody'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."item_body_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'printedVariable'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."printed_variable_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'contextDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'printed_variable_id'::text THEN
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'htmlId'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."html_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'itemBody'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."item_body_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'printedVariable'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."printed_variable_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'contextDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'htmlId'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."html_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'itemBody'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."item_body_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'printedVariable'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."printed_variable_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        WHEN 'contextDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_lpf77naqso"
  AFTER DELETE ON "qti"."context_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_xredhbipsh"
  AFTER INSERT ON "qti"."document_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_n6stzi6iym"
  AFTER DELETE ON "qti"."html_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_54jnibezup"
  AFTER DELETE ON "qti"."item_body_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_zfd6wcesip"
  AFTER DELETE ON "qti"."printed_variable_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_hewcediiwx"
  AFTER DELETE ON "qti"."response_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

-- The full violation query of law __document_id_holder_alternatives_pwzd7tub5c.
DO $$
BEGIN
  IF EXISTS (SELECT "r46"."c82" AS "document", "r46"."c83" AS "id" FROM (SELECT "r9"."c15", "r9"."c16"::text FROM (SELECT DISTINCT "r4"."c6", "r4"."c7" FROM (SELECT DISTINCT "r3"."c4", "r3"."c5" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."holder", "r1"."id" FROM "qti"."document_id" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'responseDeclaration'::"qti"."id_holder") AS "r3"("c4", "c5")) AS "r4"("c6", "c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."node" FROM "qti"."response_declaration_id" AS "r5") AS "r6"("c8", "c9", "c10")) AS "r7"("c11", "c12")) AS "r8"("c13", "c14") WHERE "r8"."c13" = "r4"."c6" AND "r8"."c14" = "r4"."c7")) AS "r9"("c15", "c16") UNION SELECT "r18"."c32", "r18"."c33"::text FROM (SELECT DISTINCT "r13"."c22", "r13"."c23" FROM (SELECT DISTINCT "r12"."c20", "r12"."c21" FROM (SELECT DISTINCT "r11"."c17", "r11"."c19" FROM (SELECT DISTINCT "r10"."document", "r10"."holder", "r10"."id" FROM "qti"."document_id" AS "r10") AS "r11"("c17", "c18", "c19") WHERE "r11"."c18" = 'htmlId'::"qti"."id_holder") AS "r12"("c20", "c21")) AS "r13"("c22", "c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c28", "r16"."c29" FROM (SELECT DISTINCT "r15"."c24", "r15"."c25" FROM (SELECT DISTINCT "r14"."document", "r14"."id", "r14"."kind", "r14"."node" FROM "qti"."html_id" AS "r14") AS "r15"("c24", "c25", "c26", "c27")) AS "r16"("c28", "c29")) AS "r17"("c30", "c31") WHERE "r17"."c30" = "r13"."c22" AND "r17"."c31" = "r13"."c23")) AS "r18"("c32", "c33") UNION SELECT "r27"."c48", "r27"."c49"::text FROM (SELECT DISTINCT "r22"."c39", "r22"."c40" FROM (SELECT DISTINCT "r21"."c37", "r21"."c38" FROM (SELECT DISTINCT "r20"."c34", "r20"."c36" FROM (SELECT DISTINCT "r19"."document", "r19"."holder", "r19"."id" FROM "qti"."document_id" AS "r19") AS "r20"("c34", "c35", "c36") WHERE "r20"."c35" = 'itemBody'::"qti"."id_holder") AS "r21"("c37", "c38")) AS "r22"("c39", "c40") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c44", "r25"."c45" FROM (SELECT DISTINCT "r24"."c41", "r24"."c42" FROM (SELECT DISTINCT "r23"."document", "r23"."id", "r23"."node" FROM "qti"."item_body_id" AS "r23") AS "r24"("c41", "c42", "c43")) AS "r25"("c44", "c45")) AS "r26"("c46", "c47") WHERE "r26"."c46" = "r22"."c39" AND "r26"."c47" = "r22"."c40")) AS "r27"("c48", "c49") UNION SELECT "r36"."c64", "r36"."c65"::text FROM (SELECT DISTINCT "r31"."c55", "r31"."c56" FROM (SELECT DISTINCT "r30"."c53", "r30"."c54" FROM (SELECT DISTINCT "r29"."c50", "r29"."c52" FROM (SELECT DISTINCT "r28"."document", "r28"."holder", "r28"."id" FROM "qti"."document_id" AS "r28") AS "r29"("c50", "c51", "c52") WHERE "r29"."c51" = 'printedVariable'::"qti"."id_holder") AS "r30"("c53", "c54")) AS "r31"("c55", "c56") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c60", "r34"."c61" FROM (SELECT DISTINCT "r33"."c57", "r33"."c58" FROM (SELECT DISTINCT "r32"."document", "r32"."id", "r32"."node" FROM "qti"."printed_variable_id" AS "r32") AS "r33"("c57", "c58", "c59")) AS "r34"("c60", "c61")) AS "r35"("c62", "c63") WHERE "r35"."c62" = "r31"."c55" AND "r35"."c63" = "r31"."c56")) AS "r36"("c64", "c65") UNION SELECT "r45"."c80", "r45"."c81"::text FROM (SELECT DISTINCT "r40"."c71", "r40"."c72" FROM (SELECT DISTINCT "r39"."c69", "r39"."c70" FROM (SELECT DISTINCT "r38"."c66", "r38"."c68" FROM (SELECT DISTINCT "r37"."document", "r37"."holder", "r37"."id" FROM "qti"."document_id" AS "r37") AS "r38"("c66", "c67", "c68") WHERE "r38"."c67" = 'contextDeclaration'::"qti"."id_holder") AS "r39"("c69", "c70")) AS "r40"("c71", "c72") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c76", "r43"."c77" FROM (SELECT DISTINCT "r42"."c73", "r42"."c74" FROM (SELECT DISTINCT "r41"."document", "r41"."id", "r41"."node" FROM "qti"."context_declaration_id" AS "r41") AS "r42"("c73", "c74", "c75")) AS "r43"("c76", "c77")) AS "r44"("c78", "c79") WHERE "r44"."c78" = "r40"."c71" AND "r44"."c79" = "r40"."c72")) AS "r45"("c80", "c81")) AS "r46"("c82", "c83")) THEN
    RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text;
  END IF;
END
$$;
