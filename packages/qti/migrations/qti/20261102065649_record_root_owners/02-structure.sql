DROP POLICY "qti__author" ON "qti"."tree_root";

DROP POLICY "qti__author" ON "qti"."outcome_declaration_arm";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."lom";

DROP POLICY "qti__author" ON "qti"."file";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."document_identifier";

DROP POLICY "qti__author" ON "qti"."document";

DROP POLICY "qti__author" ON "qti"."declaration";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."tree_root";

DROP VIEW "qti__author"."tree";

DROP VIEW "qti__author"."root_of_type";

DROP VIEW "qti__author"."response_processing";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."outcome_declaration_arm";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."lom";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."file";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."document_title";

DROP VIEW "qti__author"."document_identifier";

DROP VIEW "qti__author"."document";

DROP VIEW "qti__author"."declaration";

DROP VIEW "qti__author"."choice_interaction";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."admission";

CREATE TABLE "qti"."external_lom" (
  "document" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__external_lom_pk_hhxtaxx7kt" PRIMARY KEY ("lom"),
  CONSTRAINT "__external_lom_key_package_resource_hxwjkfkaj7" UNIQUE ("package", "resource")
);

CREATE TABLE "qti"."file_lom" (
  "file" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__file_lom_pk_gj2z5oqrlb" PRIMARY KEY ("lom")
);

CREATE TABLE "qti"."file_metadata" (
  "file" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__file_metadata_pk_3xst2gux4o" PRIMARY KEY ("id"),
  CONSTRAINT "__file_metadata_key_file_tm4sdkskv6" UNIQUE ("file"),
  CONSTRAINT "__file_metadata_key_id_file_pbbxismiu4" UNIQUE ("id", "file")
);

CREATE TABLE "qti"."outcome_document" (
  "declaration" uuid NOT NULL,
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__outcome_document_pk_rmlhdozvqn" PRIMARY KEY ("document")
);

ALTER TABLE "qti"."external_lom" ADD COLUMN "__tag_root_external_lom_dv2arbt3fq" "qti"."root_kind" GENERATED ALWAYS AS ('externalLom'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."external_lom" ADD COLUMN "__tag_owner_external_yt3hiwiixf" "qti"."lom_owner" GENERATED ALWAYS AS ('external'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."file_lom" ADD COLUMN "__tag_owner_file_gyehcaynyu" "qti"."lom_owner" GENERATED ALWAYS AS ('file'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."file_metadata" ADD COLUMN "__tag_kind_cp_metadata_file_ec5cdzv4wr" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.file'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_document" ADD COLUMN "__tag_root_outcomes_5xb23aywsn" "qti"."root_kind" GENERATED ALWAYS AS ('outcomes'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_tag_owner_external_yt_3_po4evf3fs2" FOREIGN KEY ("lom", "__tag_owner_external_yt3hiwiixf") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_package_5kjzf5zk6j" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_tag_owner_file_gyehcaynyu_wwsmm2yqrr" FOREIGN KEY ("lom", "__tag_owner_file_gyehcaynyu") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_metadata_4fdumrj4ds" FOREIGN KEY ("lom", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_package_3awnniv4xf" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_metadata_file_6pywi74w2y" FOREIGN KEY ("metadata", "file") REFERENCES "qti"."file_metadata" ("id", "file");

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_file_5wy6mgwjgi" FOREIGN KEY ("file") REFERENCES "qti"."file" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_id_tag_kind_cp_metadata_file_ec_5_jjpl4lfsb7" FOREIGN KEY ("id", "__tag_kind_cp_metadata_file_ec5cdzv4wr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_id_file_6z66x37ioo" FOREIGN KEY ("id", "file") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_declaration_lvjuav56en" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_declaration_document_d6q5lquv7z" FOREIGN KEY ("declaration", "document", "identifier") REFERENCES "qti"."declaration" ("id", "document", "identifier") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."external_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_document"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."admission" ("child", "parent", "version") AS
SELECT "r1"."child", "r1"."parent", "r1"."version"
FROM "qti"."admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."admission" TO "qti__author";

CREATE VIEW "qti__author"."attribute_lexical" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_lexical" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_lexical" TO "qti__author";

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."choice_interaction" ("id", "max_choices", "max_choices_n", "min_choices", "min_choices_n", "orientation", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_choices", "r1"."max_choices_n", "r1"."min_choices", "r1"."min_choices_n", "r1"."orientation", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."choice_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."choice_interaction" TO "qti__author";

CREATE VIEW "qti__author"."declaration" ("document", "id", "identifier", "kind", "shape") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape"
FROM "qti"."declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration" TO "qti__author";

CREATE VIEW "qti__author"."document" ("id", "package", "path", "resource", "resource_type", "root", "version") AS
SELECT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version"
FROM "qti"."document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document" TO "qti__author";

CREATE VIEW "qti__author"."document_identifier" ("document", "package", "resource", "root", "value") AS
SELECT "r1"."document", "r1"."package", "r1"."resource", "r1"."root", "r1"."value"
FROM "qti"."document_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_identifier" TO "qti__author";

CREATE VIEW "qti__author"."document_title" ("collapsed", "document", "package", "resource", "root", "value") AS
SELECT "r1"."collapsed", "r1"."document", "r1"."package", "r1"."resource", "r1"."root", "r1"."value"
FROM "qti"."document_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_title" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."expression" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."external_lom" ("document", "lom", "package", "resource") AS
SELECT "r1"."document", "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."external_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."external_lom" TO "qti__author";

CREATE VIEW "qti__author"."file" ("href", "id", "package", "position", "resource") AS
SELECT "r1"."href", "r1"."id", "r1"."package", "r1"."position", "r1"."resource"
FROM "qti"."file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."file" TO "qti__author";

CREATE VIEW "qti__author"."file_lom" ("file", "lom", "metadata", "package") AS
SELECT "r1"."file", "r1"."lom", "r1"."metadata", "r1"."package"
FROM "qti"."file_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."file_lom" TO "qti__author";

CREATE VIEW "qti__author"."file_metadata" ("file", "id") AS
SELECT "r1"."file", "r1"."id"
FROM "qti"."file_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."file_metadata" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."lom" ("id", "owner", "package") AS
SELECT "r1"."id", "r1"."owner", "r1"."package"
FROM "qti"."lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom" TO "qti__author";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity" ("kind", "min") AS
SELECT "r1"."kind", "r1"."min"
FROM "qti"."operator_arity" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_max" ("kind", "max") AS
SELECT "r1"."kind", "r1"."max"
FROM "qti"."operator_arity_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_max" TO "qti__author";

CREATE VIEW "qti__author"."outcome_declaration_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_declaration_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_declaration_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_document" ("declaration", "document", "identifier") AS
SELECT "r1"."declaration", "r1"."document", "r1"."identifier"
FROM "qti"."outcome_document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_document" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."response_processing" ("id", "root_kind") AS
SELECT "r1"."id", "r1"."root_kind"
FROM "qti"."response_processing" AS "r1";

GRANT SELECT ON TABLE "qti__author"."response_processing" TO "qti__author";

CREATE VIEW "qti__author"."root_of_type" ("root", "type") AS
SELECT "r1"."root", "r1"."type"
FROM "qti"."root_of_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."root_of_type" TO "qti__author";

CREATE VIEW "qti__author"."tree" ("charset", "id", "kind", "root", "version") AS
SELECT "r1"."charset", "r1"."id", "r1"."kind", "r1"."root", "r1"."version"
FROM "qti"."tree" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tree" TO "qti__author";

CREATE VIEW "qti__author"."tree_root" ("node", "tree") AS
SELECT "r1"."node", "r1"."tree"
FROM "qti"."tree_root" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tree_root" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."external_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_root" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
