DROP POLICY "qti__author" ON "qti"."variable_ref";

DROP POLICY "qti__author" ON "qti"."rule_operand";

DROP POLICY "qti__author" ON "qti"."outcome_min_max";

DROP POLICY "qti__author" ON "qti"."operand";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."expression";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."declared_ref";

DROP POLICY "qti__author" ON "qti"."declaration";

DROP POLICY "qti__author" ON "qti"."built_in_ref";

DROP VIEW "qti__author"."variable_ref";

DROP VIEW "qti__author"."rule_operand";

DROP VIEW "qti__author"."outcome_min_max";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."operand";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."declared_ref";

DROP VIEW "qti__author"."declaration";

DROP VIEW "qti__author"."built_in_ref";

ALTER TABLE "qti"."built_in_ref" ADD COLUMN "referrer_kind" "qti"."node_kind" DEFAULT 'qti-variable'::"qti"."node_kind" NOT NULL;
ALTER TABLE "qti"."built_in_ref" ALTER COLUMN "referrer_kind" DROP DEFAULT;

ALTER TABLE "qti"."declared_ref" ADD COLUMN "declaration_kind" "qti"."declaration_kind" DEFAULT 'response'::"qti"."declaration_kind" NOT NULL;
ALTER TABLE "qti"."declared_ref" ALTER COLUMN "declaration_kind" DROP DEFAULT;

ALTER TABLE "qti"."declared_ref" ADD COLUMN "referrer_kind" "qti"."node_kind" DEFAULT 'qti-variable'::"qti"."node_kind" NOT NULL;
ALTER TABLE "qti"."declared_ref" ALTER COLUMN "referrer_kind" DROP DEFAULT;

ALTER TABLE "qti"."expression" ADD COLUMN "bounded" "qti"."arity_bound" DEFAULT 'unbounded'::"qti"."arity_bound" NOT NULL;
ALTER TABLE "qti"."expression" ALTER COLUMN "bounded" DROP DEFAULT;

ALTER TABLE "qti"."expression" ADD COLUMN "min" bigint DEFAULT 0 NOT NULL;
ALTER TABLE "qti"."expression" ALTER COLUMN "min" DROP DEFAULT;

CREATE TABLE "qti"."expression_max" (
  "id" uuid NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "max" bigint NOT NULL,
  CONSTRAINT "__expression_max_pk_5l6znhgifp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."operator_arity_unbounded" (
  "kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__operator_arity_unbounded_pk_do57zr3u7b" PRIMARY KEY ("kind")
);

CREATE TABLE "qti"."template_parameter_ref" (
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "referrer_kind" "qti"."node_kind" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__template_parameter_ref_pk_37vwxe24iq" PRIMARY KEY ("id"),
  CONSTRAINT "template_parameter_referrer" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind", 'qti-correct'::"qti"."node_kind", 'qti-map-response'::"qti"."node_kind", 'qti-map-response-point'::"qti"."node_kind", 'qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind", 'qti-set-template-value'::"qti"."node_kind", 'qti-set-default-value'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind")) IS TRUE),
  CONSTRAINT "template_parameter_root" CHECK (("root_kind" = 'rptemplate'::"qti"."root_kind") IS TRUE)
);

ALTER TABLE "qti"."template_parameter_ref" ADD COLUMN "__tag_kind_template_parameter_izkfu4qd5a" "qti"."ref_kind" GENERATED ALWAYS AS ('templateParameter'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."built_in_ref" ADD CONSTRAINT "built_in_ref_kind" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind") OR "name" = 'completionStatus'::"qti"."built_in" AND "referrer_kind" = 'qti-set-outcome-value'::"qti"."node_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "declared_ref_kind" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind") OR "declaration_kind" IN ('response'::"qti"."declaration_kind", 'outcome'::"qti"."declaration_kind") AND "referrer_kind" = 'qti-set-default-value'::"qti"."node_kind" OR "referrer_kind" IN ('qti-correct'::"qti"."node_kind", 'qti-map-response'::"qti"."node_kind", 'qti-map-response-point'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind") AND "declaration_kind" = 'response'::"qti"."declaration_kind" OR "referrer_kind" IN ('qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind") AND "declaration_kind" = 'outcome'::"qti"."declaration_kind" OR "declaration_kind" = 'template'::"qti"."declaration_kind" AND "referrer_kind" = 'qti-set-template-value'::"qti"."node_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."outcome_min_max" ADD CONSTRAINT "outcome_min_max_kind" CHECK (("kind" IN ('qti-outcome-minimum'::"qti"."node_kind", 'qti-outcome-maximum'::"qti"."node_kind")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."rule_operand" ADD CONSTRAINT "rule_operand_kind" CHECK (("rule_kind" IN ('qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind", 'qti-set-template-value'::"qti"."node_kind", 'qti-set-default-value'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind", 'qti-template-constraint'::"qti"."node_kind", 'qti-response-if'::"qti"."node_kind", 'qti-response-else-if'::"qti"."node_kind", 'qti-outcome-if'::"qti"."node_kind", 'qti-outcome-else-if'::"qti"."node_kind", 'qti-template-if'::"qti"."node_kind", 'qti-template-else-if'::"qti"."node_kind")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."built_in_ref" ADD CONSTRAINT "__built_in_ref_fk_id_referrer_kind_twy2vn4yhi" FOREIGN KEY ("id", "referrer_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "__declared_ref_fk_document_identifier_declaration_6mv3afxrwr" FOREIGN KEY ("document", "identifier", "declaration_kind") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "__declared_ref_fk_id_referrer_kind_ym5jvsd3mo" FOREIGN KEY ("id", "referrer_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."operand" ADD CONSTRAINT "__operand_fk_child_expression_position_4gzu3ccf2u" FOREIGN KEY ("child", "expression", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_tag_kind_template_4useummycx" FOREIGN KEY ("id", "__tag_kind_template_parameter_izkfu4qd5a") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_document_gw45ohjvze" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_referrer_kind_efehhyeyf6" FOREIGN KEY ("id", "referrer_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_root_kind_u3na5yshqe" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operator_arity_unbounded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_parameter_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."built_in_ref" ("id", "name", "referrer_kind") AS
SELECT "r1"."id", "r1"."name", "r1"."referrer_kind"
FROM "qti"."built_in_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."built_in_ref" TO "qti__author";

CREATE VIEW "qti__author"."declaration" ("document", "id", "identifier", "kind", "shape") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape"
FROM "qti"."declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration" TO "qti__author";

CREATE VIEW "qti__author"."declared_ref" ("declaration_kind", "document", "id", "identifier", "referrer_kind") AS
SELECT "r1"."declaration_kind", "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind"
FROM "qti"."declared_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_ref" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."expression" ("bounded", "document", "id", "kind", "min") AS
SELECT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."expression_max" ("id", "kind", "max") AS
SELECT "r1"."id", "r1"."kind", "r1"."max"
FROM "qti"."expression_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_max" TO "qti__author";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."operand" ("child", "expression", "position") AS
SELECT "r1"."child", "r1"."expression", "r1"."position"
FROM "qti"."operand" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operand" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity" ("kind", "min") AS
SELECT "r1"."kind", "r1"."min"
FROM "qti"."operator_arity" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_max" ("kind", "max") AS
SELECT "r1"."kind", "r1"."max"
FROM "qti"."operator_arity_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_max" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_unbounded" ("kind") AS
SELECT "r1"."kind"
FROM "qti"."operator_arity_unbounded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_unbounded" TO "qti__author";

CREATE VIEW "qti__author"."outcome_min_max" ("id", "kind", "outcome_identifier") AS
SELECT "r1"."id", "r1"."kind", "r1"."outcome_identifier"
FROM "qti"."outcome_min_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_min_max" TO "qti__author";

CREATE VIEW "qti__author"."rule_operand" ("child", "position", "rule", "rule_kind") AS
SELECT "r1"."child", "r1"."position", "r1"."rule", "r1"."rule_kind"
FROM "qti"."rule_operand" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rule_operand" TO "qti__author";

CREATE VIEW "qti__author"."template_parameter_ref" ("document", "id", "identifier", "referrer_kind", "root_kind") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind", "r1"."root_kind"
FROM "qti"."template_parameter_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_parameter_ref" TO "qti__author";

CREATE VIEW "qti__author"."variable_ref" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variable_ref" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."built_in_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression_max" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."operand" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_min_max" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rule_operand" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_parameter_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
