DROP POLICY "qti__author" ON "qti"."typed_declaration";

DROP POLICY "qti__author" ON "qti"."printed_variable_id";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."item_body_id";

DROP POLICY "qti__author" ON "qti"."html_id";

DROP POLICY "qti__author" ON "qti"."document_id";

DROP POLICY "qti__author" ON "qti"."declaration_normal_maximum";

DROP POLICY "qti__author" ON "qti"."declaration";

DROP POLICY "qti__author" ON "qti"."context_declaration_id";

DROP VIEW "qti__author"."typed_declaration";

DROP VIEW "qti__author"."printed_variable_id";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."item_body_id";

DROP VIEW "qti__author"."html_id";

DROP VIEW "qti__author"."document_id";

DROP VIEW "qti__author"."declaration_normal_maximum";

DROP VIEW "qti__author"."declaration";

DROP VIEW "qti__author"."context_declaration_id";

CREATE TABLE "qti"."context_declaration_arm" (
  "id" uuid NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__context_declaration_arm_pk_4w56ikkwxc" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."declaration_normal_maximum" ALTER COLUMN "value" TYPE "qti"."__text_acxfo763jg" USING "value"::"qti"."__text_acxfo763jg";

CREATE TABLE "qti"."declared_math_variable" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_math_variable_pk_v4jg5r25qv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_param_variable" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_param_variable_pk_wlbpejkruf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."template_declaration_arm" (
  "id" uuid NOT NULL,
  "math_variable" "qti"."__text_cz7v66q3ce" NOT NULL,
  "param_variable" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__template_declaration_arm_pk_ekiad5g2nx" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."typed_declaration" ADD COLUMN "kind" "qti"."declaration_kind" DEFAULT 'response' NOT NULL;
ALTER TABLE "qti"."typed_declaration" ALTER COLUMN "kind" DROP DEFAULT;

ALTER TABLE "qti"."context_declaration_arm" ADD COLUMN "__tag_kind_context_ebo2ipjj7k" "qti"."declaration_kind" GENERATED ALWAYS AS ('context'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."context_declaration_arm" ADD COLUMN "__tag_kind_qti_context_declaration_ooqez2egyz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-context-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."context_declaration_id" ADD COLUMN "__tag_holder_context_declaration_i5zus6a3u6" "qti"."id_holder" GENERATED ALWAYS AS ('contextDeclaration'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."html_id" ADD COLUMN "__tag_holder_html_id_rvco6j7tck" "qti"."id_holder" GENERATED ALWAYS AS ('htmlId'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."item_body_id" ADD COLUMN "__tag_holder_item_body_aqj24xldnt" "qti"."id_holder" GENERATED ALWAYS AS ('itemBody'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."printed_variable_id" ADD COLUMN "__tag_holder_printed_variable_s5vwhne3e7" "qti"."id_holder" GENERATED ALWAYS AS ('printedVariable'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."template_declaration_arm" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_declaration_arm" ADD COLUMN "__tag_kind_qti_template_declaration_kfzjha6iro" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "reserved_outcome_types" CHECK (((NOT ("identifier" IN ('SCORE'::text, 'MAXSCORE'::text) AND "kind" = 'outcome'::"qti"."declaration_kind") OR "base_type" = 'float'::"qti"."base_type") AND (NOT ("identifier" = 'PASSED'::text AND "kind" = 'outcome'::"qti"."declaration_kind") OR "base_type" = 'boolean'::"qti"."base_type")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_tag_kind_context_ebo_w7jjsjo6yl" FOREIGN KEY ("id", "__tag_kind_context_ebo2ipjj7k") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_tag_kind_qti_context_4rufw6vqkp" FOREIGN KEY ("id", "__tag_kind_qti_context_declaration_ooqez2egyz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_id" ADD CONSTRAINT "__context_declaration_id_fk_document_id_tag_holder_3ovlvjpr5t" FOREIGN KEY ("document", "id", "__tag_holder_context_declaration_i5zus6a3u6") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."declared_math_variable" ADD CONSTRAINT "__declared_math_variable_fk_node_ecbtvvsfvu" FOREIGN KEY ("node") REFERENCES "qti"."template_declaration_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_param_variable" ADD CONSTRAINT "__declared_param_variable_fk_node_f5xg36jh5g" FOREIGN KEY ("node") REFERENCES "qti"."template_declaration_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_document_id_tag_holder_html_id_rvco_6_j_4xxrdxqzag" FOREIGN KEY ("document", "id", "__tag_holder_html_id_rvco6j7tck") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_body_id" ADD CONSTRAINT "__item_body_id_fk_document_id_tag_holder_item_body_qbqnxl7tow" FOREIGN KEY ("document", "id", "__tag_holder_item_body_aqj24xldnt") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."printed_variable_id" ADD CONSTRAINT "__printed_variable_id_fk_document_id_tag_holder_m4vrflia5s" FOREIGN KEY ("document", "id", "__tag_holder_printed_variable_s5vwhne3e7") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."template_declaration_arm" ADD CONSTRAINT "__template_declaration_arm_fk_id_tag_kind_qti_7xly7smluk" FOREIGN KEY ("id", "__tag_kind_qti_template_declaration_kfzjha6iro") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_declaration_arm" ADD CONSTRAINT "__template_declaration_arm_fk_id_tag_kind_template_6_oi2ijzf4ae" FOREIGN KEY ("id", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_fk_id_kind_wxilruvjz2" FOREIGN KEY ("id", "kind") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."context_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_math_variable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_param_variable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."context_declaration_arm" ("id", "version") AS
SELECT "r1"."id", "r1"."version"
FROM "qti"."context_declaration_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."context_declaration_arm" TO "qti__author";

CREATE VIEW "qti__author"."context_declaration_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."context_declaration_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."context_declaration_id" TO "qti__author";

CREATE VIEW "qti__author"."declaration" ("document", "id", "identifier", "kind", "shape") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape"
FROM "qti"."declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration" TO "qti__author";

CREATE VIEW "qti__author"."declaration_normal_maximum" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_normal_maximum" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration_normal_maximum" TO "qti__author";

CREATE VIEW "qti__author"."declared_math_variable" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_math_variable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_math_variable" TO "qti__author";

CREATE VIEW "qti__author"."declared_param_variable" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_param_variable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_param_variable" TO "qti__author";

CREATE VIEW "qti__author"."document_id" ("document", "holder", "id") AS
SELECT "r1"."document", "r1"."holder", "r1"."id"
FROM "qti"."document_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_id" TO "qti__author";

CREATE VIEW "qti__author"."html_id" ("document", "id", "kind", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."kind", "r1"."node"
FROM "qti"."html_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."html_id" TO "qti__author";

CREATE VIEW "qti__author"."item_body_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."item_body_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_body_id" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."printed_variable_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable_id" TO "qti__author";

CREATE VIEW "qti__author"."template_declaration_arm" ("id", "math_variable", "param_variable") AS
SELECT "r1"."id", "r1"."math_variable", "r1"."param_variable"
FROM "qti"."template_declaration_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_declaration_arm" TO "qti__author";

CREATE VIEW "qti__author"."typed_declaration" ("base_type", "cardinality", "document", "id", "identifier", "kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind"
FROM "qti"."typed_declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_declaration" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."context_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."context_declaration_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_normal_maximum" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_math_variable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_param_variable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."html_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_body_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
