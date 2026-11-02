DROP POLICY "qti__author" ON "qti"."template_inline";

DROP POLICY "qti__author" ON "qti"."template_block";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."feedback_block";

DROP VIEW "qti__author"."template_inline";

DROP VIEW "qti__author"."template_block";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."feedback_block";

CREATE TABLE "qti"."declared_rubric_template_block_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_rubric_template_block_show_hide_pk_tqinnfq34p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_rubric_template_inline_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_rubric_template_inline_show_hide_pk_yqpebrml7t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_template_feedback_block_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_template_feedback_block_show_hide_pk_iyminu7tvz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."rubric_template_block" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__rubric_template_block_pk_2spkmf6x3o" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rubric_template_inline" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__rubric_template_inline_pk_t5tzr7x7yx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_feedback_block" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "outcome_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__template_feedback_block_pk_4wuud44jqr" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."rubric_template_block" ADD COLUMN "__tag_kind_qti_template_block_rubric_si2cxyuet3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-block.rubric'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rubric_template_inline" ADD COLUMN "__tag_kind_qti_template_inline_rubric_o5ok5velix" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-inline.rubric'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_feedback_block" ADD COLUMN "__tag_kind_qti_feedback_block_template_koyzwlsapg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-feedback-block.template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."declared_rubric_template_block_show_hide" ADD CONSTRAINT "__declared_rubric_template_block_show_hide_fk_node_nhhdywdoss" FOREIGN KEY ("node") REFERENCES "qti"."rubric_template_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_rubric_template_inline_show_hide" ADD CONSTRAINT "__declared_rubric_template_inline_show_hide_fk_node_sbphi5cue2" FOREIGN KEY ("node") REFERENCES "qti"."rubric_template_inline" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_template_feedback_block_show_hide" ADD CONSTRAINT "__declared_template_feedback_block_show_hide_fk_node_pb6ahfblff" FOREIGN KEY ("node") REFERENCES "qti"."template_feedback_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_template_block" ADD CONSTRAINT "__rubric_template_block_fk_id_tag_kind_qti_template_7ndolb2xld" FOREIGN KEY ("id", "__tag_kind_qti_template_block_rubric_si2cxyuet3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_template_inline" ADD CONSTRAINT "__rubric_template_inline_fk_id_tag_kind_qti_template_xc64dw3wwd" FOREIGN KEY ("id", "__tag_kind_qti_template_inline_rubric_o5ok5velix") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_feedback_block" ADD CONSTRAINT "__template_feedback_block_fk_id_tag_kind_qti_i3ukwhqmkc" FOREIGN KEY ("id", "__tag_kind_qti_feedback_block_template_koyzwlsapg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_rubric_template_block_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_rubric_template_inline_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_template_feedback_block_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rubric_template_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rubric_template_inline"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_feedback_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."declared_rubric_template_block_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_rubric_template_block_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_rubric_template_block_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_rubric_template_inline_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_rubric_template_inline_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_rubric_template_inline_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_template_feedback_block_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_template_feedback_block_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_template_feedback_block_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."feedback_block" ("id", "identifier", "outcome_identifier", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide"
FROM "qti"."feedback_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."feedback_block" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."rubric_template_block" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."rubric_template_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rubric_template_block" TO "qti__author";

CREATE VIEW "qti__author"."rubric_template_inline" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."rubric_template_inline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rubric_template_inline" TO "qti__author";

CREATE VIEW "qti__author"."template_block" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."template_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_block" TO "qti__author";

CREATE VIEW "qti__author"."template_feedback_block" ("id", "identifier", "outcome_identifier", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide"
FROM "qti"."template_feedback_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_feedback_block" TO "qti__author";

CREATE VIEW "qti__author"."template_inline" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."template_inline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_inline" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."declared_rubric_template_block_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_rubric_template_inline_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_template_feedback_block_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."feedback_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rubric_template_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rubric_template_inline" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_feedback_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_inline" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
