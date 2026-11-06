-- Validate law __document_id_holder_alternatives_pwzd7tub5c: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."context_declaration_id", "qti"."document_id", "qti"."document_xml_id", "qti"."html_id", "qti"."item_body_id", "qti"."printed_variable_id", "qti"."response_declaration_id" IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER "__law_document_id_holder_alternatives_kfc467y2lm" ON "qti"."context_declaration_id";

DROP TRIGGER "__law_document_id_holder_alternatives_qlgtnc5l2w" ON "qti"."document_id";

DROP TRIGGER "__law_document_id_holder_alternatives_xa3wz3uj7i" ON "qti"."html_id";

DROP TRIGGER "__law_document_id_holder_alternatives_hx2i3m6ivw" ON "qti"."item_body_id";

DROP TRIGGER "__law_document_id_holder_alternatives_3d3g2czv5g" ON "qti"."printed_variable_id";

DROP TRIGGER "__law_document_id_holder_alternatives_mpb337miyt" ON "qti"."response_declaration_id";

CREATE OR REPLACE FUNCTION "qti"."__law_document_id_holder_alternatives_47tule3r7t"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = NEW."document" AND "r1"."id" = NEW."id" LOOP
    CASE "p"."c3"
      WHEN 'responseDeclaration'::"qti"."id_holder" THEN
        PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentId",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentId"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'htmlId'::"qti"."id_holder" THEN
        PERFORM 1 FROM "qti"."html_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentId",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentId"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'itemBody'::"qti"."id_holder" THEN
        PERFORM 1 FROM "qti"."item_body_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentId",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentId"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'printedVariable'::"qti"."id_holder" THEN
        PERFORM 1 FROM "qti"."printed_variable_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentId",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentId"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'contextDeclaration'::"qti"."id_holder" THEN
        PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentId",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentId"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'xmlId'::"qti"."id_holder" THEN
        PERFORM 1 FROM "qti"."document_xml_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentId",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentId"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_id_holder_alternatives_47tule3r7t"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_document_id_holder_alternatives_trhklhp7rm"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."id" = OLD."id" LOOP
    IF "p"."c3" = 'xmlId'::"qti"."id_holder" THEN
      PERFORM 1 FROM "qti"."document_xml_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentId",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentId"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_id_holder_alternatives_trhklhp7rm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_kfc467y2lm"
  AFTER DELETE ON "qti"."context_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_fubnbcp36d"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_qlgtnc5l2w"
  AFTER INSERT ON "qti"."document_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_47tule3r7t"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_f2snwdxqhg"
  AFTER DELETE ON "qti"."document_xml_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_trhklhp7rm"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_xa3wz3uj7i"
  AFTER DELETE ON "qti"."html_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_y3uybf3qu7"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_hx2i3m6ivw"
  AFTER DELETE ON "qti"."item_body_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_fcmxlfjniz"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_3d3g2czv5g"
  AFTER DELETE ON "qti"."printed_variable_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_rbat4ok3my"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_mpb337miyt"
  AFTER DELETE ON "qti"."response_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_42jdo6tmjq"();

-- The full violation query of law __document_id_holder_alternatives_pwzd7tub5c.
DO $$
BEGIN
  IF EXISTS (SELECT "r55"."c101" AS "document", "r55"."c102" AS "id" FROM (SELECT "r9"."c15", "r9"."c16"::"pg_catalog"."text" FROM (SELECT DISTINCT "r4"."c6", "r4"."c7" FROM (SELECT DISTINCT "r3"."c4", "r3"."c5" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."holder", "r1"."id" FROM "qti"."document_id" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'responseDeclaration'::"qti"."id_holder") AS "r3"("c4", "c5")) AS "r4"("c6", "c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."node" FROM "qti"."response_declaration_id" AS "r5") AS "r6"("c8", "c9", "c10")) AS "r7"("c11", "c12")) AS "r8"("c13", "c14") WHERE "r8"."c13" = "r4"."c6" AND "r8"."c14" = "r4"."c7")) AS "r9"("c15", "c16") UNION SELECT "r18"."c33", "r18"."c34"::"pg_catalog"."text" FROM (SELECT DISTINCT "r13"."c22", "r13"."c23" FROM (SELECT DISTINCT "r12"."c20", "r12"."c21" FROM (SELECT DISTINCT "r11"."c17", "r11"."c19" FROM (SELECT DISTINCT "r10"."document", "r10"."holder", "r10"."id" FROM "qti"."document_id" AS "r10") AS "r11"("c17", "c18", "c19") WHERE "r11"."c18" = 'htmlId'::"qti"."id_holder") AS "r12"("c20", "c21")) AS "r13"("c22", "c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c29", "r16"."c30" FROM (SELECT DISTINCT "r15"."c25", "r15"."c26" FROM (SELECT DISTINCT "r14"."attribute", "r14"."document", "r14"."id", "r14"."kind", "r14"."node" FROM "qti"."html_id" AS "r14") AS "r15"("c24", "c25", "c26", "c27", "c28")) AS "r16"("c29", "c30")) AS "r17"("c31", "c32") WHERE "r17"."c31" = "r13"."c22" AND "r17"."c32" = "r13"."c23")) AS "r18"("c33", "c34") UNION SELECT "r27"."c49", "r27"."c50"::"pg_catalog"."text" FROM (SELECT DISTINCT "r22"."c40", "r22"."c41" FROM (SELECT DISTINCT "r21"."c38", "r21"."c39" FROM (SELECT DISTINCT "r20"."c35", "r20"."c37" FROM (SELECT DISTINCT "r19"."document", "r19"."holder", "r19"."id" FROM "qti"."document_id" AS "r19") AS "r20"("c35", "c36", "c37") WHERE "r20"."c36" = 'itemBody'::"qti"."id_holder") AS "r21"("c38", "c39")) AS "r22"("c40", "c41") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c45", "r25"."c46" FROM (SELECT DISTINCT "r24"."c42", "r24"."c43" FROM (SELECT DISTINCT "r23"."document", "r23"."id", "r23"."node" FROM "qti"."item_body_id" AS "r23") AS "r24"("c42", "c43", "c44")) AS "r25"("c45", "c46")) AS "r26"("c47", "c48") WHERE "r26"."c47" = "r22"."c40" AND "r26"."c48" = "r22"."c41")) AS "r27"("c49", "c50") UNION SELECT "r36"."c65", "r36"."c66"::"pg_catalog"."text" FROM (SELECT DISTINCT "r31"."c56", "r31"."c57" FROM (SELECT DISTINCT "r30"."c54", "r30"."c55" FROM (SELECT DISTINCT "r29"."c51", "r29"."c53" FROM (SELECT DISTINCT "r28"."document", "r28"."holder", "r28"."id" FROM "qti"."document_id" AS "r28") AS "r29"("c51", "c52", "c53") WHERE "r29"."c52" = 'printedVariable'::"qti"."id_holder") AS "r30"("c54", "c55")) AS "r31"("c56", "c57") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c61", "r34"."c62" FROM (SELECT DISTINCT "r33"."c58", "r33"."c59" FROM (SELECT DISTINCT "r32"."document", "r32"."id", "r32"."node" FROM "qti"."printed_variable_id" AS "r32") AS "r33"("c58", "c59", "c60")) AS "r34"("c61", "c62")) AS "r35"("c63", "c64") WHERE "r35"."c63" = "r31"."c56" AND "r35"."c64" = "r31"."c57")) AS "r36"("c65", "c66") UNION SELECT "r45"."c81", "r45"."c82"::"pg_catalog"."text" FROM (SELECT DISTINCT "r40"."c72", "r40"."c73" FROM (SELECT DISTINCT "r39"."c70", "r39"."c71" FROM (SELECT DISTINCT "r38"."c67", "r38"."c69" FROM (SELECT DISTINCT "r37"."document", "r37"."holder", "r37"."id" FROM "qti"."document_id" AS "r37") AS "r38"("c67", "c68", "c69") WHERE "r38"."c68" = 'contextDeclaration'::"qti"."id_holder") AS "r39"("c70", "c71")) AS "r40"("c72", "c73") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c77", "r43"."c78" FROM (SELECT DISTINCT "r42"."c74", "r42"."c75" FROM (SELECT DISTINCT "r41"."document", "r41"."id", "r41"."node" FROM "qti"."context_declaration_id" AS "r41") AS "r42"("c74", "c75", "c76")) AS "r43"("c77", "c78")) AS "r44"("c79", "c80") WHERE "r44"."c79" = "r40"."c72" AND "r44"."c80" = "r40"."c73")) AS "r45"("c81", "c82") UNION SELECT "r54"."c99", "r54"."c100"::"pg_catalog"."text" FROM (SELECT DISTINCT "r49"."c88", "r49"."c89" FROM (SELECT DISTINCT "r48"."c86", "r48"."c87" FROM (SELECT DISTINCT "r47"."c83", "r47"."c85" FROM (SELECT DISTINCT "r46"."document", "r46"."holder", "r46"."id" FROM "qti"."document_id" AS "r46") AS "r47"("c83", "c84", "c85") WHERE "r47"."c84" = 'xmlId'::"qti"."id_holder") AS "r48"("c86", "c87")) AS "r49"("c88", "c89") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r52"."c95", "r52"."c96" FROM (SELECT DISTINCT "r51"."c91", "r51"."c92" FROM (SELECT DISTINCT "r50"."attribute", "r50"."document", "r50"."id", "r50"."kind", "r50"."node" FROM "qti"."document_xml_id" AS "r50") AS "r51"("c90", "c91", "c92", "c93", "c94")) AS "r52"("c95", "c96")) AS "r53"("c97", "c98") WHERE "r53"."c97" = "r49"."c88" AND "r53"."c98" = "r49"."c89")) AS "r54"("c99", "c100")) AS "r55"("c101", "c102")) THEN
    RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::"pg_catalog"."text";
  END IF;
END
$$;
