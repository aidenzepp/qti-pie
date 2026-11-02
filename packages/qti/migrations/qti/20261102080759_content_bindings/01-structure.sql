DROP POLICY "qti__author" ON "qti"."typed_binding";

DROP POLICY "qti__author" ON "qti"."record_binding";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."interaction_binding";

DROP POLICY "qti__author" ON "qti"."assessment_item";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."assessment_item";

CREATE TABLE "qti"."gap_match_binding" (
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__gap_match_binding_pk_5z6qjfwig6" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."interaction_binding" ADD COLUMN "adaptive" "qti"."__text_cz7v66q3ce" DEFAULT 'false' NOT NULL;
ALTER TABLE "qti"."interaction_binding" ALTER COLUMN "adaptive" DROP DEFAULT;

ALTER TABLE "qti"."interaction_binding" ADD COLUMN "ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."interaction_binding" ALTER COLUMN "ancestry" DROP DEFAULT;

CREATE TABLE "qti"."record_binding_fit" (
  "interaction_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__record_binding_fit_pk_w5zm2vgswj" PRIMARY KEY ("interaction_kind")
);

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "adaptive_feedback" CHECK ((NOT "ancestry" IN ('fb'::"qti"."ancestry", 'fb.modal'::"qti"."ancestry", 'fb.rubric'::"qti"."ancestry", 'fb.tmpl'::"qti"."ancestry", 'fb.int'::"qti"."ancestry", 'fb.htx'::"qti"."ancestry", 'fb.modal.tmpl'::"qti"."ancestry", 'fb.modal.htx'::"qti"."ancestry", 'fb.rubric.tmpl'::"qti"."ancestry", 'fb.rubric.htx'::"qti"."ancestry", 'fb.tmpl.int'::"qti"."ancestry", 'fb.tmpl.htx'::"qti"."ancestry", 'fb.int.gap'::"qti"."ancestry", 'fb.int.choice'::"qti"."ancestry", 'fb.int.htx'::"qti"."ancestry", 'fb.modal.tmpl.htx'::"qti"."ancestry", 'fb.rubric.tmpl.htx'::"qti"."ancestry", 'fb.tmpl.int.gap'::"qti"."ancestry", 'fb.tmpl.int.choice'::"qti"."ancestry", 'fb.tmpl.int.htx'::"qti"."ancestry", 'fb.int.gap.choice'::"qti"."ancestry", 'fb.int.gap.htx'::"qti"."ancestry", 'fb.int.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice'::"qti"."ancestry", 'fb.tmpl.int.gap.htx'::"qti"."ancestry", 'fb.tmpl.int.choice.htx'::"qti"."ancestry", 'fb.int.gap.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice.htx'::"qti"."ancestry") OR "adaptive" = 'true'::text) IS TRUE) NOT VALID;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_node_ancestry_gxhxoppump" FOREIGN KEY ("node", "ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."record_binding" ADD CONSTRAINT "__record_binding_fk_interaction_kind_lxuzwecsd5" FOREIGN KEY ("interaction_kind") REFERENCES "qti"."record_binding_fit" ("interaction_kind") NOT VALID;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_binding_fit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."assessment_item" ("adaptive", "id", "time_dependent", "tree") AS
SELECT "r1"."adaptive", "r1"."id", "r1"."time_dependent", "r1"."tree"
FROM "qti"."assessment_item" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_binding" ("cardinality", "node") AS
SELECT "r1"."cardinality", "r1"."node"
FROM "qti"."gap_match_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_binding" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("adaptive", "ancestry", "document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."adaptive", "r1"."ancestry", "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."record_binding_fit" ("interaction_kind") AS
SELECT "r1"."interaction_kind"
FROM "qti"."record_binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."assessment_item" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interaction_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."record_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."record_binding_fit" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
