DROP VIEW "qti__author"."reading";

DROP VIEW "qti__author"."placed_variable_ref_declaration";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."declaration_table";

DROP VIEW "qti__author"."declaration_cardinality";

DROP VIEW "qti__author"."declaration_base_type";

CREATE TABLE "qti"."placed_reference_type" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."cardinality" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "instance" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__placed_reference_type_pk_bliqehu4av" PRIMARY KEY ("instance", "node", "attribute"),
  CONSTRAINT "condition_type" CHECK ((NOT "kind" IN (49::smallint, 50::smallint, 62::smallint) OR NOT "parent_kind" IN (174::smallint, 173::smallint, 191::smallint, 190::smallint, 218::smallint, 211::smallint, 210::smallint) OR "base_type" = 0::smallint AND "cardinality" = 0::smallint) IS TRUE)
);

ALTER TABLE "qti"."placed_variable_ref_declaration" ADD COLUMN "__tag_area_mapping_qti_area_mapping_wt62csr7ml" smallint GENERATED ALWAYS AS (2::smallint) STORED NOT NULL;

ALTER TABLE "qti"."placed_variable_ref_declaration" ADD COLUMN "__tag_mapping_qti_mapping_7jrdswnrkn" smallint GENERATED ALWAYS AS (1::smallint) STORED NOT NULL;

ALTER TABLE "qti"."placed_variable_ref_declaration" ADD COLUMN "__declaration_tjmicd327x" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "attribute" = 86::smallint AND "kind" = 69::smallint THEN "declaration" END) STORED;

ALTER TABLE "qti"."placed_variable_ref_declaration" ADD COLUMN "__declaration_y3rrijdizl" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "attribute" = 86::smallint AND "kind" = 68::smallint THEN "declaration" END) STORED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."placed_reference_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

ALTER TABLE "qti"."reading"
  DROP CONSTRAINT "reference_type",
  ADD CONSTRAINT "reference_type" CHECK ((NOT ((NOT "kind" IN (178::smallint, 217::smallint, 216::smallint, 180::smallint, 213::smallint) OR "form" = 0::smallint) AND ("resource_type" IN (11::smallint, 20::smallint, 21::smallint) AND ("form" IN (2::smallint, 1::smallint) AND "found" = true AND "named_kind" = 109::smallint) OR "source" <> 0::smallint) AND ("number" ~ '\A[0-9]*[1-9][0-9]*\Z'::"pg_catalog"."text" AND "replaced" = true OR "form" <> 2::smallint) AND "form" <> 3::smallint) OR "declaration_kind" IN (3::smallint, 2::smallint) AND "source" IN (1::smallint, 2::smallint) OR "resource_type" IN (11::smallint, 20::smallint, 21::smallint) AND ("form" IN (2::smallint, 1::smallint) AND "found" = true AND "named_kind" = 109::smallint) OR "attribute" = 86::smallint) IS TRUE) NOT VALID;

ALTER TABLE "qti"."placed_reference_type" ADD CONSTRAINT "__placed_reference_type_fk_declaration_base_type_yeet5nnaj4" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."declaration_base_type" ("node", "base_type") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."placed_reference_type" ADD CONSTRAINT "__placed_reference_type_fk_declaration_cardinality_tpscqklpzl" FOREIGN KEY ("declaration", "cardinality") REFERENCES "qti"."declaration_cardinality" ("node", "cardinality") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."placed_variable_ref_declaration" ADD CONSTRAINT "__placed_variable_ref_declaration_fk_declaration_tag_kb2nnityho" FOREIGN KEY ("__declaration_tjmicd327x", "__tag_mapping_qti_mapping_7jrdswnrkn") REFERENCES "qti"."declaration_table" ("declaration", "mapping") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_variable_ref_declaration" ADD CONSTRAINT "__placed_variable_ref_declaration_fk_declaration_tag_d6u2v7tdbc" FOREIGN KEY ("__declaration_y3rrijdizl", "__tag_area_mapping_qti_area_mapping_wt62csr7ml") REFERENCES "qti"."declaration_table" ("declaration", "area_mapping") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE VIEW "qti__author"."declaration_base_type" ("base_type", "base_type_name", "base_type_lexical", "node", "value_base", "value_base_name") AS
SELECT "r1"."base_type", ("qti"."__base_type_names_ok3nu5nck4"())["r1"."base_type" + 1]::"pg_catalog"."text", "r1"."base_type_lexical", "r1"."node", "r1"."value_base", ("qti"."__value_base_names_pjzlcpdwvv"())["r1"."value_base" + 1]::"pg_catalog"."text"
FROM "qti"."declaration_base_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration_base_type" TO "qti__author";

CREATE VIEW "qti__author"."declaration_cardinality" ("cardinality", "cardinality_name", "cardinality_lexical", "node") AS
SELECT "r1"."cardinality", ("qti"."__cardinality_names_kqiairsoqa"())["r1"."cardinality" + 1]::"pg_catalog"."text", "r1"."cardinality_lexical", "r1"."node"
FROM "qti"."declaration_cardinality" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration_cardinality" TO "qti__author";

CREATE VIEW "qti__author"."declaration_table" ("area_mapping", "area_mapping_name", "declaration", "lookup", "lookup_name", "mapping", "mapping_name") AS
SELECT "r1"."area_mapping", ("qti"."__referenced_table_names_ynujnwu6bv"())["r1"."area_mapping" + 1]::"pg_catalog"."text", "r1"."declaration", "r1"."lookup", ("qti"."__referenced_table_names_ynujnwu6bv"())["r1"."lookup" + 1]::"pg_catalog"."text", "r1"."mapping", ("qti"."__referenced_table_names_ynujnwu6bv"())["r1"."mapping" + 1]::"pg_catalog"."text"
FROM "qti"."declaration_table" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration_table" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "at", "attributes", "attrs", "barred_children", "chars", "chars_after", "chars_was", "children", "counted_children", "document", "document_type", "document_type_name", "double_value", "element_children", "elements", "elements_was", "end", "first", "governs", "governs_name", "id", "kind", "kind_name", "last", "last_state", "last_state_name", "namespaces", "nearest", "nearest_kind", "nearest_kind_name", "parent", "parent_ancestry", "parent_governs", "parent_governs_name", "parent_kind", "parent_kind_name", "parent_nearest", "parent_nearest_kind", "parent_nearest_kind_name", "parent_parent_kind", "parent_parent_kind_name", "prefix", "start", "state", "state_name", "string_value", "version", "version_name", "was", "was_name") AS
SELECT "r1"."ancestry", "r1"."at", "r1"."attributes", "r1"."attrs", "r1"."barred_children", "r1"."chars", "r1"."chars_after", "r1"."chars_was", "r1"."children", "r1"."counted_children", "r1"."document", "r1"."document_type", ("qti"."__resource_type_names_iatibe6omc"())["r1"."document_type" + 1]::"pg_catalog"."text", "r1"."double_value", "r1"."element_children", "r1"."elements", "r1"."elements_was", "r1"."end", "r1"."first", "r1"."governs", ("qti"."__type_name_names_nykiaxxd3n"())["r1"."governs" + 1]::"pg_catalog"."text", "r1"."id", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."last", "r1"."last_state", ("qti"."__position_names_sglcn7ygpg"())["r1"."last_state" + 1]::"pg_catalog"."text", "r1"."namespaces", "r1"."nearest", "r1"."nearest_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."nearest_kind" + 1]::"pg_catalog"."text", "r1"."parent", "r1"."parent_ancestry", "r1"."parent_governs", ("qti"."__type_name_names_nykiaxxd3n"())["r1"."parent_governs" + 1]::"pg_catalog"."text", "r1"."parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_kind" + 1]::"pg_catalog"."text", "r1"."parent_nearest", "r1"."parent_nearest_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_nearest_kind" + 1]::"pg_catalog"."text", "r1"."parent_parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_parent_kind" + 1]::"pg_catalog"."text", "r1"."prefix", "r1"."start", "r1"."state", ("qti"."__position_names_sglcn7ygpg"())["r1"."state" + 1]::"pg_catalog"."text", "r1"."string_value", "r1"."version", ("qti"."__schema_version_names_p2hfvbhu24"())["r1"."version" + 1]::"pg_catalog"."text", "r1"."was", ("qti"."__position_names_sglcn7ygpg"())["r1"."was" + 1]::"pg_catalog"."text"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."placed_reference_type" ("attribute", "attribute_name", "base_type", "base_type_name", "cardinality", "cardinality_name", "declaration", "instance", "kind", "kind_name", "node", "parent_kind", "parent_kind_name") AS
SELECT "r1"."attribute", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."attribute" + 1]::"pg_catalog"."text", "r1"."base_type", ("qti"."__base_type_names_ok3nu5nck4"())["r1"."base_type" + 1]::"pg_catalog"."text", "r1"."cardinality", ("qti"."__cardinality_names_kqiairsoqa"())["r1"."cardinality" + 1]::"pg_catalog"."text", "r1"."declaration", "r1"."instance", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."node", "r1"."parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_kind" + 1]::"pg_catalog"."text"
FROM "qti"."placed_reference_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."placed_reference_type" TO "qti__author";

CREATE VIEW "qti__author"."placed_variable_ref_declaration" ("assembly", "attribute", "attribute_name", "decl_base_types", "decl_cardinalities", "declaration", "declaration_kind", "declaration_kind_name", "identifier", "instance", "kind", "kind_name", "node") AS
SELECT "r1"."assembly", "r1"."attribute", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."attribute" + 1]::"pg_catalog"."text", "r1"."decl_base_types", "r1"."decl_cardinalities", "r1"."declaration", "r1"."declaration_kind", ("qti"."__declaration_kind_names_o62wpad2p7"())["r1"."declaration_kind" + 1]::"pg_catalog"."text", "r1"."identifier", "r1"."instance", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."node"
FROM "qti"."placed_variable_ref_declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."placed_variable_ref_declaration" TO "qti__author";

CREATE VIEW "qti__author"."reading" ("assembly", "attribute", "attribute_name", "decl_base_types", "decl_cardinalities", "declaration", "declaration_kind", "declaration_kind_name", "declared", "form", "form_name", "found", "identifier", "kind", "kind_name", "lookup_document", "mapped", "named", "named_kind", "named_kind_name", "node", "number", "placements", "replaced", "resource_type", "resource_type_name", "role", "role_name", "scope", "source", "source_name", "split", "variable") AS
SELECT "r1"."assembly", "r1"."attribute", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."attribute" + 1]::"pg_catalog"."text", "r1"."decl_base_types", "r1"."decl_cardinalities", "r1"."declaration", "r1"."declaration_kind", ("qti"."__declaration_kind_names_o62wpad2p7"())["r1"."declaration_kind" + 1]::"pg_catalog"."text", "r1"."declared", "r1"."form", ("qti"."__reading_form_names_tbdimwd3yh"())["r1"."form" + 1]::"pg_catalog"."text", "r1"."found", "r1"."identifier", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."lookup_document", "r1"."mapped", "r1"."named", "r1"."named_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."named_kind" + 1]::"pg_catalog"."text", "r1"."node", "r1"."number", "r1"."placements", "r1"."replaced", "r1"."resource_type", ("qti"."__resource_type_names_iatibe6omc"())["r1"."resource_type" + 1]::"pg_catalog"."text", "r1"."role", ("qti"."__reference_role_names_ce5jhrrzsl"())["r1"."role" + 1]::"pg_catalog"."text", "r1"."scope", "r1"."source", ("qti"."__reading_source_names_d5b4pcfzkz"())["r1"."source" + 1]::"pg_catalog"."text", "r1"."split", "r1"."variable"
FROM "qti"."reading" AS "r1";

GRANT SELECT ON TABLE "qti__author"."reading" TO "qti__author";
