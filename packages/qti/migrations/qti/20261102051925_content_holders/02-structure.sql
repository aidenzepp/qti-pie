DROP POLICY "qti__author" ON "qti"."node";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."document_id";

CREATE TABLE "qti"."context_declaration_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__context_declaration_id_pk_mgpu5tsgi5" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__context_declaration_id_key_node_6wysjljein" UNIQUE ("node")
);

CREATE TABLE "qti"."html_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__html_id_pk_5qgpxb2xq3" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__html_id_key_node_jvsu27ct75" UNIQUE ("node")
);

CREATE TABLE "qti"."item_body_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__item_body_id_pk_ibzhodnt2d" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__item_body_id_key_node_hel7ph2kih" UNIQUE ("node")
);

CREATE TABLE "qti"."printed_variable_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__printed_variable_id_pk_uow5oqhfb2" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__printed_variable_id_key_node_dqzglovtb6" UNIQUE ("node")
);

ALTER TABLE "qti"."context_declaration_id" ADD CONSTRAINT "__context_declaration_id_fk_node_document_5vt3ni7od7" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_node_document_kind_4jmntfh5as" FOREIGN KEY ("node", "document", "kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body_id" ADD CONSTRAINT "__item_body_id_fk_node_document_yub5r24zvj" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_id" ADD CONSTRAINT "__printed_variable_id_fk_node_document_ner24327p2" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."context_declaration_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."html_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_body_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."context_declaration_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."context_declaration_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."context_declaration_id" TO "qti__author";

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

CREATE POLICY "qti__author" ON "qti"."context_declaration_id" AS PERMISSIVE FOR ALL TO "qti__author"
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
