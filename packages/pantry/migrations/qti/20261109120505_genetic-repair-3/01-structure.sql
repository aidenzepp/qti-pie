DROP VIEW "qti__author"."site_path";

DROP VIEW "qti__author"."site";

DROP VIEW "qti__author"."reference";

ALTER TABLE "qti"."reference" ADD COLUMN "__node_6rmfntt35j" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "kind" = 110::smallint AND "name" = 103::smallint AND "scope" <> 1::smallint THEN "node" END) STORED;

ALTER TABLE "qti"."reference" ADD CONSTRAINT "__reference_fk_node_gpi5levv2r" FOREIGN KEY ("__node_6rmfntt35j") REFERENCES "qti"."site_path" ("node") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE VIEW "qti__author"."reference" ("document", "kind", "kind_name", "lead", "lexical", "name", "name_name", "node", "params", "scope", "scope_name", "target", "trail") AS
SELECT "r1"."document", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."lead", "r1"."lexical", "r1"."name", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."name" + 1]::"pg_catalog"."text", "r1"."node", "r1"."params", "r1"."scope", ("qti"."__href_scope_names_y4pbuo4f5q"())["r1"."scope" + 1]::"pg_catalog"."text", "r1"."target", "r1"."trail"
FROM "qti"."reference" AS "r1";

GRANT SELECT ON TABLE "qti__author"."reference" TO "qti__author";

CREATE VIEW "qti__author"."site" ("ancestry", "children", "document", "document_type", "document_type_name", "external", "governs", "governs_name", "kind", "kind_name", "nearest", "nearest_kind", "nearest_kind_name", "node", "parent", "parent_kind", "parent_kind_name", "parent_loose_chain", "parent_mixes", "part", "replaced", "start", "version", "version_name") AS
SELECT "r1"."ancestry", "r1"."children", "r1"."document", "r1"."document_type", ("qti"."__resource_type_names_iatibe6omc"())["r1"."document_type" + 1]::"pg_catalog"."text", "r1"."external", "r1"."governs", ("qti"."__type_name_names_nykiaxxd3n"())["r1"."governs" + 1]::"pg_catalog"."text", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."nearest", "r1"."nearest_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."nearest_kind" + 1]::"pg_catalog"."text", "r1"."node", "r1"."parent", "r1"."parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_kind" + 1]::"pg_catalog"."text", "r1"."parent_loose_chain", "r1"."parent_mixes", "r1"."part", "r1"."replaced", "r1"."start", "r1"."version", ("qti"."__schema_version_names_p2hfvbhu24"())["r1"."version" + 1]::"pg_catalog"."text"
FROM "qti"."site" AS "r1";

GRANT SELECT ON TABLE "qti__author"."site" TO "qti__author";

CREATE VIEW "qti__author"."site_path" ("entry", "kind", "kind_name", "node", "package", "path") AS
SELECT "r1"."entry", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."node", "r1"."package", "r1"."path"
FROM "qti"."site_path" AS "r1";

GRANT SELECT ON TABLE "qti__author"."site_path" TO "qti__author";
