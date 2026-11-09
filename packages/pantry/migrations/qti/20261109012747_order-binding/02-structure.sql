DROP VIEW "qti__author"."placed_binding_cardinality";

DROP VIEW "qti__author"."placed_binding_base_type";

DROP VIEW "qti__author"."binding_cardinality";

DROP VIEW "qti__author"."binding_base_type";

ALTER TABLE "qti"."binding_base_type" ADD CONSTRAINT "__binding_base_type_check_binding_base_type_kind_23yvyam52t" CHECK ((NOT (NOT "kind" IN (18::smallint, 130::smallint, 117::smallint) AND "attribute" = 76::smallint AND "cardinality" <> 3::smallint) IS TRUE OR "pg_catalog"."substring"("qti"."__constant_ajahbtka65"(), ("base_type" * 4 + "cardinality") * 644 + "kind" + 1, 1)::integer = 1) IS TRUE) NOT VALID;

ALTER TABLE "qti"."binding_cardinality" ADD CONSTRAINT "__binding_cardinality_check_binding_cardinality_kind_xorrwqje25" CHECK ((NOT (NOT "kind" IN (18::smallint, 130::smallint, 117::smallint) AND "attribute" = 76::smallint AND "cardinality" = 3::smallint) IS TRUE OR "pg_catalog"."substring"("qti"."__constant_xvmgsamjvy"(), "kind" + 1, 1)::integer = 1) IS TRUE) NOT VALID;

ALTER TABLE "qti"."placed_binding_base_type" ADD CONSTRAINT "__placed_binding_base_type_check_placed_binding_base_h2fneegqzy" CHECK ((NOT (NOT "kind" IN (18::smallint, 130::smallint, 117::smallint) AND "attribute" = 76::smallint AND "cardinality" <> 3::smallint) IS TRUE OR "pg_catalog"."substring"("qti"."__constant_ajahbtka65"(), ("base_type" * 4 + "cardinality") * 644 + "kind" + 1, 1)::integer = 1) IS TRUE) NOT VALID;

ALTER TABLE "qti"."placed_binding_cardinality" ADD CONSTRAINT "__placed_binding_cardinality_check_placed_binding_nb3luy3de5" CHECK ((NOT (NOT "kind" IN (18::smallint, 130::smallint, 117::smallint) AND "attribute" = 76::smallint AND "cardinality" = 3::smallint) IS TRUE OR "pg_catalog"."substring"("qti"."__constant_xvmgsamjvy"(), "kind" + 1, 1)::integer = 1) IS TRUE) NOT VALID;

CREATE VIEW "qti__author"."binding_base_type" ("attribute", "attribute_name", "base_type", "base_type_name", "cardinality", "cardinality_name", "declaration", "kind", "kind_name", "node") AS
SELECT "r1"."attribute", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."attribute" + 1]::"pg_catalog"."text", "r1"."base_type", ("qti"."__base_type_names_ok3nu5nck4"())["r1"."base_type" + 1]::"pg_catalog"."text", "r1"."cardinality", ("qti"."__cardinality_names_kqiairsoqa"())["r1"."cardinality" + 1]::"pg_catalog"."text", "r1"."declaration", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."node"
FROM "qti"."binding_base_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_base_type" TO "qti__author";

CREATE VIEW "qti__author"."binding_cardinality" ("attribute", "attribute_name", "base_types", "cardinality", "cardinality_name", "declaration", "gaps", "kind", "kind_name", "mosts", "node") AS
SELECT "r1"."attribute", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."attribute" + 1]::"pg_catalog"."text", "r1"."base_types", "r1"."cardinality", ("qti"."__cardinality_names_kqiairsoqa"())["r1"."cardinality" + 1]::"pg_catalog"."text", "r1"."declaration", "r1"."gaps", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."mosts", "r1"."node"
FROM "qti"."binding_cardinality" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_cardinality" TO "qti__author";

CREATE VIEW "qti__author"."placed_binding_base_type" ("attribute", "attribute_name", "base_type", "base_type_name", "cardinality", "cardinality_name", "declaration", "instance", "kind", "kind_name", "node") AS
SELECT "r1"."attribute", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."attribute" + 1]::"pg_catalog"."text", "r1"."base_type", ("qti"."__base_type_names_ok3nu5nck4"())["r1"."base_type" + 1]::"pg_catalog"."text", "r1"."cardinality", ("qti"."__cardinality_names_kqiairsoqa"())["r1"."cardinality" + 1]::"pg_catalog"."text", "r1"."declaration", "r1"."instance", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."node"
FROM "qti"."placed_binding_base_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."placed_binding_base_type" TO "qti__author";

CREATE VIEW "qti__author"."placed_binding_cardinality" ("attribute", "attribute_name", "base_types", "cardinality", "cardinality_name", "declaration", "gaps", "instance", "kind", "kind_name", "mosts", "node") AS
SELECT "r1"."attribute", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."attribute" + 1]::"pg_catalog"."text", "r1"."base_types", "r1"."cardinality", ("qti"."__cardinality_names_kqiairsoqa"())["r1"."cardinality" + 1]::"pg_catalog"."text", "r1"."declaration", "r1"."gaps", "r1"."instance", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."mosts", "r1"."node"
FROM "qti"."placed_binding_cardinality" AS "r1";

GRANT SELECT ON TABLE "qti__author"."placed_binding_cardinality" TO "qti__author";
