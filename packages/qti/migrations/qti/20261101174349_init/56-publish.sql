CREATE ROLE "qti__author" NOLOGIN;

CREATE ROLE "qti__author_app" LOGIN NOINHERIT;

CREATE SCHEMA "qti__author";

CREATE VIEW "qti__author"."admission" ("child", "parent", "version") AS
SELECT "r1"."child", "r1"."parent", "r1"."version"
FROM "qti"."admission" AS "r1";

CREATE VIEW "qti__author"."assessment_item" ("adaptive", "id", "time_dependent") AS
SELECT "r1"."adaptive", "r1"."id", "r1"."time_dependent"
FROM "qti"."assessment_item" AS "r1";

CREATE VIEW "qti__author"."attribute_entity_reference" ("attribute", "name", "node", "offset") AS
SELECT "r1"."attribute", "r1"."name", "r1"."node", "r1"."offset"
FROM "qti"."attribute_entity_reference" AS "r1";

CREATE VIEW "qti__author"."attribute_lexical" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_lexical" AS "r1";

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

CREATE VIEW "qti__author"."built_in_ref" ("id", "name") AS
SELECT "r1"."id", "r1"."name"
FROM "qti"."built_in_ref" AS "r1";

CREATE VIEW "qti__author"."choice_interaction" ("id", "max_choices", "max_choices_n", "min_choices", "min_choices_n", "orientation", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_choices", "r1"."max_choices_n", "r1"."min_choices", "r1"."min_choices_n", "r1"."orientation", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."choice_interaction" AS "r1";

CREATE VIEW "qti__author"."choice_interaction_max_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."choice_interaction_max_selections_message" AS "r1";

CREATE VIEW "qti__author"."choice_interaction_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."choice_interaction_min_selections_message" AS "r1";

CREATE VIEW "qti__author"."comment" ("id", "text") AS
SELECT "r1"."id", "r1"."text"
FROM "qti"."comment" AS "r1";

CREATE VIEW "qti__author"."correct_response_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."correct_response_arm" AS "r1";

CREATE VIEW "qti__author"."declaration" ("document", "id", "identifier", "kind", "shape") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape"
FROM "qti"."declaration" AS "r1";

CREATE VIEW "qti__author"."declaration_external_scored" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_external_scored" AS "r1";

CREATE VIEW "qti__author"."declaration_interpretation" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_interpretation" AS "r1";

CREATE VIEW "qti__author"."declaration_long_interpretation" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_long_interpretation" AS "r1";

CREATE VIEW "qti__author"."declaration_mastery_value" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_mastery_value" AS "r1";

CREATE VIEW "qti__author"."declaration_normal_maximum" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_normal_maximum" AS "r1";

CREATE VIEW "qti__author"."declaration_normal_minimum" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_normal_minimum" AS "r1";

CREATE VIEW "qti__author"."declaration_variable_identifier_ref" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_variable_identifier_ref" AS "r1";

CREATE VIEW "qti__author"."declaration_view" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_view" AS "r1";

CREATE VIEW "qti__author"."declared_adaptive" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_adaptive" AS "r1";

CREATE VIEW "qti__author"."declared_fixed" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_fixed" AS "r1";

CREATE VIEW "qti__author"."declared_max_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_max_choices" AS "r1";

CREATE VIEW "qti__author"."declared_min_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_min_choices" AS "r1";

CREATE VIEW "qti__author"."declared_orientation" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_orientation" AS "r1";

CREATE VIEW "qti__author"."declared_ref" ("document", "id", "identifier") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier"
FROM "qti"."declared_ref" AS "r1";

CREATE VIEW "qti__author"."declared_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_show_hide" AS "r1";

CREATE VIEW "qti__author"."declared_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_shuffle" AS "r1";

CREATE VIEW "qti__author"."declared_value" ("base_type", "id", "position", "shape", "value_set") AS
SELECT "r1"."base_type", "r1"."id", "r1"."position", "r1"."shape", "r1"."value_set"
FROM "qti"."declared_value" AS "r1";

CREATE VIEW "qti__author"."declared_value_boolean" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_boolean" AS "r1";

CREATE VIEW "qti__author"."declared_value_directed_pair" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_directed_pair" AS "r1";

CREATE VIEW "qti__author"."declared_value_duration" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_duration" AS "r1";

CREATE VIEW "qti__author"."declared_value_file" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_file" AS "r1";

CREATE VIEW "qti__author"."declared_value_float" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_float" AS "r1";

CREATE VIEW "qti__author"."declared_value_identifier" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_identifier" AS "r1";

CREATE VIEW "qti__author"."declared_value_integer" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_integer" AS "r1";

CREATE VIEW "qti__author"."declared_value_pair" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_pair" AS "r1";

CREATE VIEW "qti__author"."declared_value_point" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_point" AS "r1";

CREATE VIEW "qti__author"."declared_value_string" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_string" AS "r1";

CREATE VIEW "qti__author"."declared_value_uri" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."declared_value_uri" AS "r1";

CREATE VIEW "qti__author"."default_value_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."default_value_arm" AS "r1";

CREATE VIEW "qti__author"."dependency" ("id", "package", "resource", "target") AS
SELECT "r1"."id", "r1"."package", "r1"."resource", "r1"."target"
FROM "qti"."dependency" AS "r1";

CREATE VIEW "qti__author"."document" ("id", "package", "path", "resource", "resource_type", "root", "version") AS
SELECT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version"
FROM "qti"."document" AS "r1";

CREATE VIEW "qti__author"."document_id" ("document", "holder", "id") AS
SELECT "r1"."document", "r1"."holder", "r1"."id"
FROM "qti"."document_id" AS "r1";

CREATE VIEW "qti__author"."document_identifier" ("document", "package", "resource", "root", "value") AS
SELECT "r1"."document", "r1"."package", "r1"."resource", "r1"."root", "r1"."value"
FROM "qti"."document_identifier" AS "r1";

CREATE VIEW "qti__author"."document_title" ("collapsed", "document", "package", "resource", "root", "value") AS
SELECT "r1"."collapsed", "r1"."document", "r1"."package", "r1"."resource", "r1"."root", "r1"."value"
FROM "qti"."document_title" AS "r1";

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

CREATE VIEW "qti__author"."entity_reference" ("id", "name") AS
SELECT "r1"."id", "r1"."name"
FROM "qti"."entity_reference" AS "r1";

CREATE VIEW "qti__author"."expression" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."expression" AS "r1";

CREATE VIEW "qti__author"."file" ("href", "id", "package", "position", "resource") AS
SELECT "r1"."href", "r1"."id", "r1"."package", "r1"."position", "r1"."resource"
FROM "qti"."file" AS "r1";

CREATE VIEW "qti__author"."file_content" ("byte_length", "content", "mime_type", "package", "path") AS
SELECT "r1"."byte_length", "r1"."content", "r1"."mime_type", "r1"."package", "r1"."path"
FROM "qti"."file_content" AS "r1";

CREATE VIEW "qti__author"."img" ("alt", "id", "src") AS
SELECT "r1"."alt", "r1"."id", "r1"."src"
FROM "qti"."img" AS "r1";

CREATE VIEW "qti__author"."img_height" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."img_height" AS "r1";

CREATE VIEW "qti__author"."img_longdesc" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."img_longdesc" AS "r1";

CREATE VIEW "qti__author"."img_width" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."img_width" AS "r1";

CREATE VIEW "qti__author"."interaction_binding" ("document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

CREATE VIEW "qti__author"."item_body" ("id", "item") AS
SELECT "r1"."id", "r1"."item"
FROM "qti"."item_body" AS "r1";

CREATE VIEW "qti__author"."literal" ("base_type", "id") AS
SELECT "r1"."base_type", "r1"."id"
FROM "qti"."literal" AS "r1";

CREATE VIEW "qti__author"."literal_boolean" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_boolean" AS "r1";

CREATE VIEW "qti__author"."literal_directed_pair" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_directed_pair" AS "r1";

CREATE VIEW "qti__author"."literal_duration" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_duration" AS "r1";

CREATE VIEW "qti__author"."literal_file" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_file" AS "r1";

CREATE VIEW "qti__author"."literal_float" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_float" AS "r1";

CREATE VIEW "qti__author"."literal_identifier" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_identifier" AS "r1";

CREATE VIEW "qti__author"."literal_integer" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_integer" AS "r1";

CREATE VIEW "qti__author"."literal_pair" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_pair" AS "r1";

CREATE VIEW "qti__author"."literal_point" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_point" AS "r1";

CREATE VIEW "qti__author"."literal_string" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_string" AS "r1";

CREATE VIEW "qti__author"."literal_uri" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."literal_uri" AS "r1";

CREATE VIEW "qti__author"."lom" ("id", "owner", "package") AS
SELECT "r1"."id", "r1"."owner", "r1"."package"
FROM "qti"."lom" AS "r1";

CREATE VIEW "qti__author"."lom_aggregation_level" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_aggregation_level" AS "r1";

CREATE VIEW "qti__author"."lom_contribute" ("id", "lom", "parent", "position") AS
SELECT "r1"."id", "r1"."lom", "r1"."parent", "r1"."position"
FROM "qti"."lom_contribute" AS "r1";

CREATE VIEW "qti__author"."lom_copyright_and_other_restrictions" ("id", "lom", "rights") AS
SELECT "r1"."id", "r1"."lom", "r1"."rights"
FROM "qti"."lom_copyright_and_other_restrictions" AS "r1";

CREATE VIEW "qti__author"."lom_cost" ("id", "lom", "rights") AS
SELECT "r1"."id", "r1"."lom", "r1"."rights"
FROM "qti"."lom_cost" AS "r1";

CREATE VIEW "qti__author"."lom_coverage" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_coverage" AS "r1";

CREATE VIEW "qti__author"."lom_date" ("contribute", "id", "lom") AS
SELECT "r1"."contribute", "r1"."id", "r1"."lom"
FROM "qti"."lom_date" AS "r1";

CREATE VIEW "qti__author"."lom_date_time" ("collapsed", "date", "id", "lom", "value") AS
SELECT "r1"."collapsed", "r1"."date", "r1"."id", "r1"."lom", "r1"."value"
FROM "qti"."lom_date_time" AS "r1";

CREATE VIEW "qti__author"."lom_description" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_description" AS "r1";

CREATE VIEW "qti__author"."lom_duration" ("id", "lom", "technical") AS
SELECT "r1"."id", "r1"."lom", "r1"."technical"
FROM "qti"."lom_duration" AS "r1";

CREATE VIEW "qti__author"."lom_duration_string" ("collapsed", "duration", "id", "lom", "value") AS
SELECT "r1"."collapsed", "r1"."duration", "r1"."id", "r1"."lom", "r1"."value"
FROM "qti"."lom_duration_string" AS "r1";

CREATE VIEW "qti__author"."lom_entity" ("collapsed", "contribute", "id", "lom", "position", "value") AS
SELECT "r1"."collapsed", "r1"."contribute", "r1"."id", "r1"."lom", "r1"."position", "r1"."value"
FROM "qti"."lom_entity" AS "r1";

CREATE VIEW "qti__author"."lom_format" ("collapsed", "id", "lom", "position", "technical", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."lom", "r1"."position", "r1"."technical", "r1"."value"
FROM "qti"."lom_format" AS "r1";

CREATE VIEW "qti__author"."lom_general" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_general" AS "r1";

CREATE VIEW "qti__author"."lom_general_title" ("id", "lom", "owner") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner"
FROM "qti"."lom_general_title" AS "r1";

CREATE VIEW "qti__author"."lom_identifier" ("id", "lom", "owner", "position") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."position"
FROM "qti"."lom_identifier" AS "r1";

CREATE VIEW "qti__author"."lom_identifier_catalog" ("collapsed", "id", "identifier", "lom", "owner", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."identifier", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_identifier_catalog" AS "r1";

CREATE VIEW "qti__author"."lom_identifier_entry" ("collapsed", "id", "identifier", "lom", "owner", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."identifier", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_identifier_entry" AS "r1";

CREATE VIEW "qti__author"."lom_installation_remarks" ("id", "lom", "technical") AS
SELECT "r1"."id", "r1"."lom", "r1"."technical"
FROM "qti"."lom_installation_remarks" AS "r1";

CREATE VIEW "qti__author"."lom_keyword" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_keyword" AS "r1";

CREATE VIEW "qti__author"."lom_language" ("id", "lom", "position", "value") AS
SELECT "r1"."id", "r1"."lom", "r1"."position", "r1"."value"
FROM "qti"."lom_language" AS "r1";

CREATE VIEW "qti__author"."lom_life_cycle" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_life_cycle" AS "r1";

CREATE VIEW "qti__author"."lom_location" ("collapsed", "id", "lom", "position", "technical", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."lom", "r1"."position", "r1"."technical", "r1"."value"
FROM "qti"."lom_location" AS "r1";

CREATE VIEW "qti__author"."lom_maximum_version" ("collapsed", "id", "lom", "or_composite", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."lom", "r1"."or_composite", "r1"."value"
FROM "qti"."lom_maximum_version" AS "r1";

CREATE VIEW "qti__author"."lom_meta_metadata" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_meta_metadata" AS "r1";

CREATE VIEW "qti__author"."lom_metadataschema" ("collapsed", "id", "lom", "meta_metadata", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."lom", "r1"."meta_metadata", "r1"."position", "r1"."value"
FROM "qti"."lom_metadataschema" AS "r1";

CREATE VIEW "qti__author"."lom_minimum_version" ("collapsed", "id", "lom", "or_composite", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."lom", "r1"."or_composite", "r1"."value"
FROM "qti"."lom_minimum_version" AS "r1";

CREATE VIEW "qti__author"."lom_name" ("id", "lom", "or_composite") AS
SELECT "r1"."id", "r1"."lom", "r1"."or_composite"
FROM "qti"."lom_name" AS "r1";

CREATE VIEW "qti__author"."lom_object_identifier" ("collapsed", "lom", "package", "position", "resource", "type") AS
SELECT "r1"."collapsed", "r1"."lom", "r1"."package", "r1"."position", "r1"."resource", "r1"."type"
FROM "qti"."lom_object_identifier" AS "r1";

CREATE VIEW "qti__author"."lom_object_title" ("collapsed", "lom", "package", "position", "resource", "type") AS
SELECT "r1"."collapsed", "r1"."lom", "r1"."package", "r1"."position", "r1"."resource", "r1"."type"
FROM "qti"."lom_object_title" AS "r1";

CREATE VIEW "qti__author"."lom_or_composite" ("id", "lom", "position", "requirement") AS
SELECT "r1"."id", "r1"."lom", "r1"."position", "r1"."requirement"
FROM "qti"."lom_or_composite" AS "r1";

CREATE VIEW "qti__author"."lom_other_platform_requirements" ("id", "lom", "technical") AS
SELECT "r1"."id", "r1"."lom", "r1"."technical"
FROM "qti"."lom_other_platform_requirements" AS "r1";

CREATE VIEW "qti__author"."lom_requirement" ("id", "lom", "position", "technical") AS
SELECT "r1"."id", "r1"."lom", "r1"."position", "r1"."technical"
FROM "qti"."lom_requirement" AS "r1";

CREATE VIEW "qti__author"."lom_rights" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_rights" AS "r1";

CREATE VIEW "qti__author"."lom_role" ("contribute", "id", "lom") AS
SELECT "r1"."contribute", "r1"."id", "r1"."lom"
FROM "qti"."lom_role" AS "r1";

CREATE VIEW "qti__author"."lom_size" ("collapsed", "id", "lom", "technical", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."lom", "r1"."technical", "r1"."value"
FROM "qti"."lom_size" AS "r1";

CREATE VIEW "qti__author"."lom_source" ("collapsed", "id", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."value"
FROM "qti"."lom_source" AS "r1";

CREATE VIEW "qti__author"."lom_status" ("id", "life_cycle", "lom") AS
SELECT "r1"."id", "r1"."life_cycle", "r1"."lom"
FROM "qti"."lom_status" AS "r1";

CREATE VIEW "qti__author"."lom_string" ("collapsed", "id", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."value"
FROM "qti"."lom_string" AS "r1";

CREATE VIEW "qti__author"."lom_string_language" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."lom_string_language" AS "r1";

CREATE VIEW "qti__author"."lom_structure" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_structure" AS "r1";

CREATE VIEW "qti__author"."lom_technical" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_technical" AS "r1";

CREATE VIEW "qti__author"."lom_title" ("collapsed", "id", "lom", "owner", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_title" AS "r1";

CREATE VIEW "qti__author"."lom_type" ("id", "lom", "or_composite") AS
SELECT "r1"."id", "r1"."lom", "r1"."or_composite"
FROM "qti"."lom_type" AS "r1";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."value"
FROM "qti"."lom_value" AS "r1";

CREATE VIEW "qti__author"."lom_version" ("id", "life_cycle", "lom") AS
SELECT "r1"."id", "r1"."life_cycle", "r1"."lom"
FROM "qti"."lom_version" AS "r1";

CREATE VIEW "qti__author"."manifest" ("id") AS
SELECT "r1"."id"
FROM "qti"."manifest" AS "r1";

CREATE VIEW "qti__author"."manifest_lom" ("lom", "metadata", "package") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package"
FROM "qti"."manifest_lom" AS "r1";

CREATE VIEW "qti__author"."manifest_metadata" ("id", "manifest") AS
SELECT "r1"."id", "r1"."manifest"
FROM "qti"."manifest_metadata" AS "r1";

CREATE VIEW "qti__author"."manifest_schema" ("id", "metadata", "value") AS
SELECT "r1"."id", "r1"."metadata", "r1"."value"
FROM "qti"."manifest_schema" AS "r1";

CREATE VIEW "qti__author"."manifest_schema_version" ("id", "metadata", "value") AS
SELECT "r1"."id", "r1"."metadata", "r1"."value"
FROM "qti"."manifest_schema_version" AS "r1";

CREATE VIEW "qti__author"."namespace_declaration" ("node", "position", "prefix", "uri") AS
SELECT "r1"."node", "r1"."position", "r1"."prefix", "r1"."uri"
FROM "qti"."namespace_declaration" AS "r1";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

CREATE VIEW "qti__author"."operand" ("child", "expression", "position") AS
SELECT "r1"."child", "r1"."expression", "r1"."position"
FROM "qti"."operand" AS "r1";

CREATE VIEW "qti__author"."operator_arity" ("kind", "min") AS
SELECT "r1"."kind", "r1"."min"
FROM "qti"."operator_arity" AS "r1";

CREATE VIEW "qti__author"."operator_arity_max" ("kind", "max") AS
SELECT "r1"."kind", "r1"."max"
FROM "qti"."operator_arity_max" AS "r1";

CREATE VIEW "qti__author"."organizations" ("id", "manifest") AS
SELECT "r1"."id", "r1"."manifest"
FROM "qti"."organizations" AS "r1";

CREATE VIEW "qti__author"."outcome_declaration_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_declaration_arm" AS "r1";

CREATE VIEW "qti__author"."p" ("id") AS
SELECT "r1"."id"
FROM "qti"."p" AS "r1";

CREATE VIEW "qti__author"."package" ("id", "identifier", "schemaversion") AS
SELECT "r1"."id", "r1"."identifier", "r1"."schemaversion"
FROM "qti"."package" AS "r1";

CREATE VIEW "qti__author"."package_entry" ("kind", "package", "path") AS
SELECT "r1"."kind", "r1"."package", "r1"."path"
FROM "qti"."package_entry" AS "r1";

CREATE VIEW "qti__author"."pi" ("data", "id", "target") AS
SELECT "r1"."data", "r1"."id", "r1"."target"
FROM "qti"."pi" AS "r1";

CREATE VIEW "qti__author"."prompt" ("id", "parent") AS
SELECT "r1"."id", "r1"."parent"
FROM "qti"."prompt" AS "r1";

CREATE VIEW "qti__author"."qmd_composite" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_composite" AS "r1";

CREATE VIEW "qti__author"."qmd_custom_type_identifier" ("context", "id", "value") AS
SELECT "r1"."context", "r1"."id", "r1"."value"
FROM "qti"."qmd_custom_type_identifier" AS "r1";

CREATE VIEW "qti__author"."qmd_feedback_type" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_feedback_type" AS "r1";

CREATE VIEW "qti__author"."qmd_interaction_kind" ("context", "id", "value") AS
SELECT "r1"."context", "r1"."id", "r1"."value"
FROM "qti"."qmd_interaction_kind" AS "r1";

CREATE VIEW "qti__author"."qmd_interaction_type" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_interaction_type" AS "r1";

CREATE VIEW "qti__author"."qmd_item_template" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_item_template" AS "r1";

CREATE VIEW "qti__author"."qmd_portable_custom_interaction_context" ("id", "qti_metadata") AS
SELECT "r1"."id", "r1"."qti_metadata"
FROM "qti"."qmd_portable_custom_interaction_context" AS "r1";

CREATE VIEW "qti__author"."qmd_scoring_mode" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_scoring_mode" AS "r1";

CREATE VIEW "qti__author"."qmd_solution_available" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_solution_available" AS "r1";

CREATE VIEW "qti__author"."qmd_time_dependent" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_time_dependent" AS "r1";

CREATE VIEW "qti__author"."qmd_tool_name" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_tool_name" AS "r1";

CREATE VIEW "qti__author"."qmd_tool_vendor" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_tool_vendor" AS "r1";

CREATE VIEW "qti__author"."qmd_tool_version" ("id", "qti_metadata", "value") AS
SELECT "r1"."id", "r1"."qti_metadata", "r1"."value"
FROM "qti"."qmd_tool_version" AS "r1";

CREATE VIEW "qti__author"."qti_metadata" ("id", "metadata", "resource") AS
SELECT "r1"."id", "r1"."metadata", "r1"."resource"
FROM "qti"."qti_metadata" AS "r1";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

CREATE VIEW "qti__author"."record_declaration" ("id") AS
SELECT "r1"."id"
FROM "qti"."record_declaration" AS "r1";

CREATE VIEW "qti__author"."record_field" ("field_identifier", "id") AS
SELECT "r1"."field_identifier", "r1"."id"
FROM "qti"."record_field" AS "r1";

CREATE VIEW "qti__author"."record_value_set" ("id") AS
SELECT "r1"."id"
FROM "qti"."record_value_set" AS "r1";

CREATE VIEW "qti__author"."resource" ("id", "identifier", "package", "type", "version") AS
SELECT "r1"."id", "r1"."identifier", "r1"."package", "r1"."type", "r1"."version"
FROM "qti"."resource" AS "r1";

CREATE VIEW "qti__author"."resource_href" ("href", "package", "resource") AS
SELECT "r1"."href", "r1"."package", "r1"."resource"
FROM "qti"."resource_href" AS "r1";

CREATE VIEW "qti__author"."resource_lom" ("lom", "metadata", "package", "resource", "type") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."resource_lom" AS "r1";

CREATE VIEW "qti__author"."resource_lom_identified" ("lom", "package", "resource", "type") AS
SELECT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."resource_lom_identified" AS "r1";

CREATE VIEW "qti__author"."resource_lom_titled" ("lom", "package", "resource", "type") AS
SELECT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."resource_lom_titled" AS "r1";

CREATE VIEW "qti__author"."resource_metadata" ("id", "resource") AS
SELECT "r1"."id", "r1"."resource"
FROM "qti"."resource_metadata" AS "r1";

CREATE VIEW "qti__author"."resource_type_of" ("type", "version") AS
SELECT "r1"."type", "r1"."version"
FROM "qti"."resource_type_of" AS "r1";

CREATE VIEW "qti__author"."resources" ("id", "manifest") AS
SELECT "r1"."id", "r1"."manifest"
FROM "qti"."resources" AS "r1";

CREATE VIEW "qti__author"."response_declaration_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."response_declaration_arm" AS "r1";

CREATE VIEW "qti__author"."response_declaration_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."response_declaration_id" AS "r1";

CREATE VIEW "qti__author"."response_processing" ("id", "root_kind") AS
SELECT "r1"."id", "r1"."root_kind"
FROM "qti"."response_processing" AS "r1";

CREATE VIEW "qti__author"."response_processing_item" ("id", "item") AS
SELECT "r1"."id", "r1"."item"
FROM "qti"."response_processing_item" AS "r1";

CREATE VIEW "qti__author"."response_processing_template" ("node", "uri") AS
SELECT "r1"."node", "r1"."uri"
FROM "qti"."response_processing_template" AS "r1";

CREATE VIEW "qti__author"."response_processing_template_location" ("node", "uri") AS
SELECT "r1"."node", "r1"."uri"
FROM "qti"."response_processing_template_location" AS "r1";

CREATE VIEW "qti__author"."root_of_type" ("root", "type") AS
SELECT "r1"."root", "r1"."type"
FROM "qti"."root_of_type" AS "r1";

CREATE VIEW "qti__author"."schema_location" ("node", "prefix", "value") AS
SELECT "r1"."node", "r1"."prefix", "r1"."value"
FROM "qti"."schema_location" AS "r1";

CREATE VIEW "qti__author"."simple_choice" ("fixed", "id", "identifier", "interaction", "show_hide") AS
SELECT "r1"."fixed", "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."show_hide"
FROM "qti"."simple_choice" AS "r1";

CREATE VIEW "qti__author"."simple_choice_template_identifier" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."simple_choice_template_identifier" AS "r1";

CREATE VIEW "qti__author"."standard_template_reference" ("node", "template") AS
SELECT "r1"."node", "r1"."template"
FROM "qti"."standard_template_reference" AS "r1";

CREATE VIEW "qti__author"."text" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."text" AS "r1";

CREATE VIEW "qti__author"."tree" ("charset", "id", "kind", "root", "version") AS
SELECT "r1"."charset", "r1"."id", "r1"."kind", "r1"."root", "r1"."version"
FROM "qti"."tree" AS "r1";

CREATE VIEW "qti__author"."tree_doctype" ("text", "tree") AS
SELECT "r1"."text", "r1"."tree"
FROM "qti"."tree_doctype" AS "r1";

CREATE VIEW "qti__author"."tree_export_charset" ("label", "tree") AS
SELECT "r1"."label", "r1"."tree"
FROM "qti"."tree_export_charset" AS "r1";

CREATE VIEW "qti__author"."tree_misc" ("kind", "placement", "position", "text", "tree") AS
SELECT "r1"."kind", "r1"."placement", "r1"."position", "r1"."text", "r1"."tree"
FROM "qti"."tree_misc" AS "r1";

CREATE VIEW "qti__author"."tree_root" ("node", "tree") AS
SELECT "r1"."node", "r1"."tree"
FROM "qti"."tree_root" AS "r1";

CREATE VIEW "qti__author"."tree_xml_encoding" ("tree", "value") AS
SELECT "r1"."tree", "r1"."value"
FROM "qti"."tree_xml_encoding" AS "r1";

CREATE VIEW "qti__author"."tree_xml_standalone" ("tree", "value") AS
SELECT "r1"."tree", "r1"."value"
FROM "qti"."tree_xml_standalone" AS "r1";

CREATE VIEW "qti__author"."tree_xml_version" ("tree", "value") AS
SELECT "r1"."tree", "r1"."value"
FROM "qti"."tree_xml_version" AS "r1";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

CREATE VIEW "qti__author"."typed_declaration" ("base_type", "cardinality", "document", "id", "identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."id", "r1"."identifier"
FROM "qti"."typed_declaration" AS "r1";

CREATE VIEW "qti__author"."typed_value_set" ("base_type", "cardinality", "declaration", "id") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."declaration", "r1"."id"
FROM "qti"."typed_value_set" AS "r1";

CREATE VIEW "qti__author"."value_set" ("declaration", "id", "role", "shape") AS
SELECT "r1"."declaration", "r1"."id", "r1"."role", "r1"."shape"
FROM "qti"."value_set" AS "r1";

CREATE VIEW "qti__author"."value_set_interpretation" ("value", "value_set") AS
SELECT "r1"."value", "r1"."value_set"
FROM "qti"."value_set_interpretation" AS "r1";

CREATE VIEW "qti__author"."variable_ref" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."variable_ref" AS "r1";

CREATE VIEW "qti__author"."ws" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."ws" AS "r1";

CREATE POLICY "qti__author" ON "qti"."assessment_item" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."attribute_entity_reference" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."attribute_lexical" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."built_in_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."choice_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."choice_interaction_max_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."choice_interaction_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."comment" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."correct_response_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_external_scored" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_interpretation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_long_interpretation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_mastery_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_normal_maximum" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_normal_minimum" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_variable_identifier_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_view" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_adaptive" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_fixed" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_orientation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_value_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."default_value_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."dependency" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."entity_reference" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file_content" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."img" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."img_height" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."img_longdesc" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."img_width" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interaction_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_body" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_aggregation_level" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_contribute" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_copyright_and_other_restrictions" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_cost" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_coverage" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_date" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_date_time" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_description" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_duration_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_entity" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_format" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_general" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_general_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier_catalog" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_installation_remarks" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_keyword" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_language" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_life_cycle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_location" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_maximum_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_meta_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_metadataschema" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_minimum_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_name" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_object_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_object_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_or_composite" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_other_platform_requirements" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_requirement" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_rights" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_role" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_size" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_source" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_status" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_string_language" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_structure" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_technical" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_schema" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_schema_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."namespace_declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."operand" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."organizations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."p" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."package" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."package_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."pi" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."prompt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_composite" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_custom_type_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_feedback_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_interaction_kind" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_interaction_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_item_template" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_portable_custom_interaction_context" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_scoring_mode" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_solution_available" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_time_dependent" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_tool_name" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_tool_vendor" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qmd_tool_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."record_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."record_declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."record_field" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."record_value_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_href" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom_identified" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom_titled" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resources" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_declaration_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_processing" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_processing_item" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_processing_template" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_processing_template_location" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."schema_location" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_choice" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_choice_template_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."standard_template_reference" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."text" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_doctype" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_export_charset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_misc" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_root" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_xml_encoding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_xml_standalone" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_xml_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_value_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."value_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."value_set_interpretation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ws" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

GRANT "qti__author" TO "qti__author_app" WITH INHERIT FALSE, SET TRUE;

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_ojm4wya66v", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."ws" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."comment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_external_scored" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_interpretation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_long_interpretation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_mastery_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_normal_maximum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_normal_minimum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_variable_identifier_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_view" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_adaptive" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dependency" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."edge" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_content" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_height" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interaction_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_body" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_aggregation_level" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_contribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_copyright_and_other_restrictions" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_cost" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_coverage" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_date" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_date_time" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_description" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_entity" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_format" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_general" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_general_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_catalog" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_installation_remarks" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_keyword" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_life_cycle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_maximum_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_meta_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_metadataschema" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_minimum_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_or_composite" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_other_platform_requirements" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_requirement" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_rights" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_role" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_size" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_source" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_status" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_string_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_structure" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_technical" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."namespace_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."operand" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."organizations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."p" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."package" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."package_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."prompt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_composite" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_custom_type_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_feedback_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_interaction_kind" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_interaction_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_item_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_portable_custom_interaction_context" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_scoring_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_solution_available" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_time_dependent" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_tool_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_tool_vendor" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qmd_tool_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_field" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_titled" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resources" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice_template_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."standard_template_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_doctype" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_export_charset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_misc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_root" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_encoding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_standalone" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ws" TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) TO "qti__author";

GRANT USAGE ON SCHEMA "qti" TO "qti__author_app";

GRANT EXECUTE ON FUNCTION "qti"."__snapshot_guard"(text) TO "qti__author_app";

GRANT SELECT ON TABLE "qti"."__ledger" TO "qti__author_app";

ALTER ROLE "qti__author_app" SET jit = 'off';

ALTER ROLE "qti__author_app" SET extra_float_digits = '1';

ALTER ROLE "qti__author_app" SET lc_monetary = 'C.UTF-8';

ALTER ROLE "qti__author_app" SET lc_numeric = 'C.UTF-8';

ALTER ROLE "qti__author_app" SET lc_time = 'C.UTF-8';

ALTER ROLE "qti__author_app" SET lc_messages = 'C.UTF-8';

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."admission", "qti"."assessment_item", "qti"."attribute_entity_reference", "qti"."attribute_lexical", "qti"."binding_fit", "qti"."built_in_ref", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."comment", "qti"."correct_response_arm", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_fixed", "qti"."declared_max_choices", "qti"."declared_min_choices", "qti"."declared_orientation", "qti"."declared_ref", "qti"."declared_show_hide", "qti"."declared_shuffle", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."default_value_arm", "qti"."dependency", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_title", "qti"."edge", "qti"."entity_reference", "qti"."expression", "qti"."file", "qti"."file_content", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."interaction_binding", "qti"."item_body", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_entity", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_keyword", "qti"."lom_language", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_requirement", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_size", "qti"."lom_source", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_value", "qti"."lom_version", "qti"."manifest", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."namespace_declaration", "qti"."node", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."organizations", "qti"."outcome_declaration_arm", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."pi", "qti"."prompt", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_metadata", "qti"."record_binding", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_identified", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_processing", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."schema_location", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."standard_template_reference", "qti"."text", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."value_set", "qti"."value_set_interpretation", "qti"."variable_ref", "qti"."ws", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."ws" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_cz7v66q3ce", "qti"."__text_raisrajgpi", "qti"."__text_rhdrzkabze", "qti"."__text_kqeswaav46", "qti"."__text_clza6vokfo", "qti"."__text_yakcqa4zli", "qti"."__text_6uwfpnix5n", "qti"."__text_k3z6naurdo", "qti"."__text_jld3q663or", "qti"."__text_f63vbnbw4t", "qti"."__text_d72l462ftm", "qti"."__text_qtkbmkpj6l", "qti"."__text_7grqskvjta", "qti"."__text_c34ec7mxid", "qti"."__text_tyjqwtj7ky", "qti"."__text_2dix7luqoi", "qti"."__text_tso7kvy6dv", "qti"."__text_ifp42a6zk6", "qti"."__text_7mulu52tr6", "qti"."__text_ieskz75v7g", "qti"."__text_popyschjwc", "qti"."__text_betq2bg2bg", "qti"."__text_qyq7zjychy", "qti"."__text_httzcaefcn", "qti"."__text_mvg26oprvk", "qti"."__text_f3hdif3553", "qti"."__text_ojm4wya66v", "qti"."__text_pftpnuhm3d", "qti"."__text_i67gmkzdk7", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_uia6zcss44", "qti"."__text_r5xluaej3z", "qti"."__text_ottycep7en" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

COMMENT ON DOMAIN "qti"."__text_i67gmkzdk7" IS 'text pattern 04c13211be847421520416bc20eaf80e9f4864b91b3fc2b13afdd98ec9612240';

COMMENT ON DOMAIN "qti"."__text_f63vbnbw4t" IS 'text pattern 13dd7b6fd03c14f0b526ee0b6750b3af8019821bb3301c4135bcb46ee59b216c';

COMMENT ON DOMAIN "qti"."__text_pftpnuhm3d" IS 'text pattern 1796eb59c9a8fcf69183157003dd2f26f4b91d5971a962867267e169f70a894b';

COMMENT ON DOMAIN "qti"."__text_7mulu52tr6" IS 'text pattern 18b75eede708ef803b259c8ee6facf2159fccf026c37464009e83bc86df42347';

COMMENT ON DOMAIN "qti"."__text_ottycep7en" IS 'text pattern 2db4e48019c8e0e247465c394f8e5629f2a17ad6dbe279b59860fb5d155bb25a';

COMMENT ON DOMAIN "qti"."__text_c34ec7mxid" IS 'text pattern 2e9f8667211e6ea7560820d0ca5058b0efceedbee67de9ea06f758b5e08895a6';

COMMENT ON DOMAIN "qti"."__text_betq2bg2bg" IS 'text pattern 423c7b25da64f818cd554a0b449a9818bee0831842c437058f6831d0f27e9f4e';

COMMENT ON DOMAIN "qti"."__text_kqeswaav46" IS 'text pattern 426c679ed03867e39655fe1a257fb40702c71a76eed6d392dc31cd3def7b57dd';

COMMENT ON DOMAIN "qti"."__text_2dix7luqoi" IS 'text pattern 42bb89b0e882014b3d6ed776015c31e8f039c9e4225068f4321a711b40fe6f27';

COMMENT ON DOMAIN "qti"."__text_7grqskvjta" IS 'text pattern 4306529fda596276201977a38149c551c147b504f887508b01446e972d46c0ee';

COMMENT ON DOMAIN "qti"."__text_cz7v66q3ce" IS 'text pattern 45847e176530a2e7639ca73b97d7a426b8e5f11d077396a1a5fad0f186931bfc';

COMMENT ON DOMAIN "qti"."__text_qtkbmkpj6l" IS 'text pattern 465d2e1f338c9da95eda11d91bcf8aa0f3d3b48765a9443c244afc981e222170';

COMMENT ON DOMAIN "qti"."__text_f3hdif3553" IS 'text pattern 50eae57a1cfbc8ff982860977ea883ae63eaef395018b74f9ebb4104da53fe45';

COMMENT ON DOMAIN "qti"."__text_jld3q663or" IS 'text pattern 530f34cc2bbe2a6da503d157061492f61db71e07510019f1597cd237ad94c381';

COMMENT ON DOMAIN "qti"."__text_uia6zcss44" IS 'text pattern 5affb4da1a2e55459f7245209bf1063b85d2cc8ec600dc1e253621a8f3bc74b5';

COMMENT ON DOMAIN "qti"."__text_ieskz75v7g" IS 'text pattern 5b3cbad77afd49bc1639a2b04002608b0092db01ec390efd00ae2b93ec458cf6';

COMMENT ON DOMAIN "qti"."__text_yakcqa4zli" IS 'text pattern 60d32e057fce2de86298df00f65a65a3ecdd0ca240ceebe36522ceeca5a88563';

COMMENT ON DOMAIN "qti"."__text_r5xluaej3z" IS 'text pattern 715c3eebe5bd6af57ae647199c8851539a25ebca59ec666ebccfef3112a609b6';

COMMENT ON DOMAIN "qti"."__text_hmmood6ekl" IS 'text pattern 75c6fed9d8596a8387909d6cc90cb561c71559a1beef21a8dffd8df2152cd08f';

COMMENT ON DOMAIN "qti"."__text_d72l462ftm" IS 'text pattern 77c33e8b7b853139c5740232096a3fa77a051e2d7e040aa09dd29cc8ad7d9c68';

COMMENT ON DOMAIN "qti"."__text_k3z6naurdo" IS 'text pattern a7c15e9ca75817f2403d6cb99fcaa38375535bd40c6ffbc4d501782cec8066b7';

COMMENT ON DOMAIN "qti"."__text_tso7kvy6dv" IS 'text pattern aa69c6413fa170c64b335593295c04b7b8669ad70a286d5430ddb0bbbfd10653';

COMMENT ON DOMAIN "qti"."__text_wyfa622e2r" IS 'text pattern b0974d1df3b9543cd71ee791ff73710a432248a6b7b8ef8b6c460333d3bfe658';

COMMENT ON DOMAIN "qti"."__text_raisrajgpi" IS 'text pattern b37b025df2c13dbe7a38717ce221614f50fcff3765dabc03a192e45381e62f5e';

COMMENT ON DOMAIN "qti"."__text_ojm4wya66v" IS 'text pattern c278b97e18db2ad58b8db5754f9f62749e07844c815e13c4e21ae0518d90947c';

COMMENT ON DOMAIN "qti"."__text_popyschjwc" IS 'text pattern cd6ec194d8cc40877ca0967d2c96660e9739ce3054641ffc209ae19204b72529';

COMMENT ON DOMAIN "qti"."__text_rhdrzkabze" IS 'text pattern cdd26feaa20cb7e0ebf0df1d02ed2008459191e3fb716fb4364be8e28cbe9d6d';

COMMENT ON DOMAIN "qti"."__text_mvg26oprvk" IS 'text pattern d187ac667f1e9a81154b1d747506b658127fff8a00077f0a4365fd47fefa1826';

COMMENT ON DOMAIN "qti"."__text_clza6vokfo" IS 'text pattern d70ccd983a8b1f23a80a64f6a6131443c2bcc85779c95b474fdd50bfdb0ac1dc';

COMMENT ON DOMAIN "qti"."__text_qyq7zjychy" IS 'text pattern d7bc28f2faf96ec00de422201c220faeae5484beda460b92af71414280277294';

COMMENT ON DOMAIN "qti"."__text_tyjqwtj7ky" IS 'text pattern e35325539c4d69cc69701d03524442c7cf69b7b11b47b796d8a64654f044b3f5';

COMMENT ON DOMAIN "qti"."__text_ifp42a6zk6" IS 'text pattern e3d452a987d7b2e1d616219dbe591417143af391912756d5efdd2ce705050364';

COMMENT ON DOMAIN "qti"."__text_httzcaefcn" IS 'text pattern eea8cf31689f082aa28d7ace0886966aeab46a6a07c4ba4cb371f3d821664072';

COMMENT ON DOMAIN "qti"."__text_6uwfpnix5n" IS 'text pattern f4c4fb991ebc143f5544f051ffdf2e21b35f56fe8c684bb57183253d638228f0';

COMMENT ON FUNCTION "qti"."__law_declaration_shape_alternatives_ne4hwb3c7v"() IS 'function of law alternatives of Declaration.shape';

COMMENT ON FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"() IS 'function of law alternatives of DeclaredValue.baseType';

COMMENT ON FUNCTION "qti"."__law_declared_value_shape_alternatives_3ylemaegbl"() IS 'function of law alternatives of DeclaredValue.shape';

COMMENT ON FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"() IS 'function of law alternatives of DocumentId.holder';

COMMENT ON FUNCTION "qti"."__law_interaction_binding_shape_alternatives_43wn74vwrt"() IS 'function of law alternatives of InteractionBinding.shape';

COMMENT ON FUNCTION "qti"."__law_literal_base_type_alternatives_k55cqzfoea"() IS 'function of law alternatives of Literal.baseType';

COMMENT ON FUNCTION "qti"."__law_lom_owner_alternatives_qipk6s5rsl"() IS 'function of law alternatives of Lom.owner';

COMMENT ON FUNCTION "qti"."__law_node_kind_alternatives_vfnu4bvxbc"() IS 'function of law alternatives of Node.kind';

COMMENT ON FUNCTION "qti"."__law_tree_kind_alternatives_jsubzrxvlj"() IS 'function of law alternatives of Tree.kind';

COMMENT ON FUNCTION "qti"."__law_value_set_shape_alternatives_z6tj6kfwmo"() IS 'function of law alternatives of ValueSet.shape';

COMMENT ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_cshuhfsw2k"() IS 'function of law alternatives of VariableRef.kind';

COMMENT ON FUNCTION "qti"."__law_choice_interaction_capacity_simple_choice_xud7umlydk"() IS 'function of law capacity of ChoiceInteraction(id) over SimpleChoice(interaction) within 1..*';

COMMENT ON FUNCTION "qti"."__law_document_root_item_capacity_document_zxxdsuf4kr"() IS 'function of law capacity of Document(id) where root = item over DocumentIdentifier(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_item_capacity_document_title_rzkeegstyz"() IS 'function of law capacity of Document(id) where root = item over DocumentTitle(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_manifest_capacity_document_gkylcfe5sc"() IS 'function of law capacity of Document(id) where root = manifest over DocumentIdentifier(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_document_root_manifest_capacity_document_title_hs2cs2k6vx"() IS 'function of law capacity of Document(id) where root = manifest over DocumentTitle(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_document_root_outcomes_capacity_document_xvwfvxt3ox"() IS 'function of law capacity of Document(id) where root = outcomes over DocumentIdentifier(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_outcomes_capacity_document_title_i5kunulrhu"() IS 'function of law capacity of Document(id) where root = outcomes over DocumentTitle(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_document_root_rptemplate_capacity_document_56fy5myaeo"() IS 'function of law capacity of Document(id) where root = rptemplate over DocumentIdentifier(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_document_root_rptemplate_capacity_document_hq4wt7kewr"() IS 'function of law capacity of Document(id) where root = rptemplate over DocumentTitle(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_document_root_section_capacity_document_2hhpl3mm3d"() IS 'function of law capacity of Document(id) where root = section over DocumentIdentifier(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_section_capacity_document_title_jt73uqqcbb"() IS 'function of law capacity of Document(id) where root = section over DocumentTitle(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_stimulus_capacity_document_vv7tus4fj7"() IS 'function of law capacity of Document(id) where root = stimulus over DocumentIdentifier(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_stimulus_capacity_document_title_uc7ekh7myp"() IS 'function of law capacity of Document(id) where root = stimulus over DocumentTitle(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_test_capacity_document_rfs6k4uc3b"() IS 'function of law capacity of Document(id) where root = test over DocumentIdentifier(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_test_capacity_document_title_zlmn65bqdy"() IS 'function of law capacity of Document(id) where root = test over DocumentTitle(document) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_usagedata_capacity_document_ffc7q6dqwe"() IS 'function of law capacity of Document(id) where root = usagedata over DocumentIdentifier(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_document_root_usagedata_capacity_document_ljtrgvxyc3"() IS 'function of law capacity of Document(id) where root = usagedata over DocumentTitle(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_bi2jl6foco"() IS 'function of law capacity of ManifestMetadata(id) over ManifestSchema(metadata) within 1..1';

COMMENT ON FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_vejmcla2r7"() IS 'function of law capacity of ManifestMetadata(id) over ManifestSchemaVersion(metadata) within 1..1';

COMMENT ON FUNCTION "qti"."__law_package_capacity_manifest_metadata_ntdh7wc2vd"() IS 'function of law capacity of Package(id) over ManifestMetadata(manifest) within 1..1';

COMMENT ON FUNCTION "qti"."__law_package_capacity_organizations_fiohej4acc"() IS 'function of law capacity of Package(id) over Organizations(manifest) within 1..1';

COMMENT ON FUNCTION "qti"."__law_package_capacity_resources_gply2xvjvz"() IS 'function of law capacity of Package(id) over Resources(manifest) within 1..1';

COMMENT ON FUNCTION "qti"."__law_resource_capacity_file_37oihogekr"() IS 'function of law capacity of Resource(id) over File(resource) within 1..*';

COMMENT ON FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_3ertx4jjrz"() IS 'function of law capacity of ResourceLomIdentified(lom) over LomIdentifier(lom) within 1..*';

COMMENT ON FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_o7xodx7qsa"() IS 'function of law capacity of ResourceLomIdentified(lom) where type = "imsqti_item_xmlv3p0" over LomObjectIdentifier(lom) within 1..1';

COMMENT ON FUNCTION "qti"."__law_resource_lom_titled_capacity_lom_general_title_q3buitylei"() IS 'function of law capacity of ResourceLomTitled(lom) over LomGeneralTitle(lom) within 1..1';

COMMENT ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_v6sn3ztbzo"() IS 'function of law capacity of ResourceLomTitled(lom) where type = "imsqti_item_xmlv3p0" over LomObjectTitle(lom) within 1..1';

COMMENT ON FUNCTION "qti"."__law_typed_value_set_cardinality_single_capacity_fsofzqj22h"() IS 'function of law capacity of TypedValueSet(id) where cardinality = single over DeclaredValue(valueSet) within 1..1';

COMMENT ON FUNCTION "qti"."__law_value_set_capacity_declared_value_z3glpgyy2h"() IS 'function of law capacity of ValueSet(id) over DeclaredValue(valueSet) within 1..*';

COMMENT ON FUNCTION "qti"."__law_choice_interaction_root_kind_item_in_hfa5ureu64"() IS 'function of law ChoiceInteraction(id, responseIdentifier) where rootKind = item in InteractionBinding(node, responseIdentifier)';

COMMENT ON FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_c5t2mvzfki"() IS 'function of law DeclaredValue(valueSet, baseType) where shape = typed in TypedValueSet(id, baseType)';

COMMENT ON FUNCTION "qti"."__law_lom_general_title_owner_resource_in_resource_wk2an2fswl"() IS 'function of law LomGeneralTitle(lom) where owner = resource in ResourceLomTitled(lom)';

COMMENT ON FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_c534m3pdvg"() IS 'function of law LomIdentifier(lom) where owner = resource in ResourceLomIdentified(lom)';

COMMENT ON FUNCTION "qti"."__law_response_processing_root_kind_rptemplate_in_h7uvgdgfla"() IS 'function of law ResponseProcessing(id) where rootKind = rptemplate in TreeRoot(node)';

COMMENT ON FUNCTION "qti"."__law_tree_kind_manifest_in_package_soguk2tyu4"() IS 'function of law Tree(id, version) where kind = manifest in Package(id, schemaversion)';

COMMENT ON FUNCTION "qti"."__law_declaration_kind_outcome_in_outcome_c5u6yofdgn"() IS 'function of law Declaration(id) where kind = outcome in OutcomeDeclarationArm(id), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_declaration_kind_response_in_response_5xnwckhb3b"() IS 'function of law Declaration(id) where kind = response in ResponseDeclarationArm(id), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_declaration_kind_response_in_response_32upb7p5nf"() IS 'function of law Declaration(id, document, identifier) where kind = response in ResponseDeclarationId(node, document, id), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_response_processing_root_kind_item_in_response_ayyqb5wbp5"() IS 'function of law ResponseProcessing(id) where rootKind = item in ResponseProcessingItem(id), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_value_set_role_correct_in_correct_response_arm_rsdwkieg2w"() IS 'function of law ValueSet(id) where role = correct in CorrectResponseArm(id), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_value_set_role_default_in_default_value_arm_6bn64r3hk6"() IS 'function of law ValueSet(id) where role = default in DefaultValueArm(id), a mirrors half';

COMMENT ON CONSTRAINT "__admission_pk_5vjazwledx" ON "qti"."admission" IS 'primary key of Admission';

COMMENT ON CONSTRAINT "__assessment_item_pk_5svyn5edkt" ON "qti"."assessment_item" IS 'primary key of AssessmentItem';

COMMENT ON CONSTRAINT "__attribute_entity_reference_pk_pnly3xqwxa" ON "qti"."attribute_entity_reference" IS 'primary key of AttributeEntityReference';

COMMENT ON CONSTRAINT "__attribute_lexical_pk_qi53b27egd" ON "qti"."attribute_lexical" IS 'primary key of AttributeLexical';

COMMENT ON CONSTRAINT "__binding_fit_pk_zlfybq6q3o" ON "qti"."binding_fit" IS 'primary key of BindingFit';

COMMENT ON CONSTRAINT "__built_in_ref_pk_efu5zp7bth" ON "qti"."built_in_ref" IS 'primary key of BuiltInRef';

COMMENT ON CONSTRAINT "__choice_interaction_pk_dxmiqmyvgh" ON "qti"."choice_interaction" IS 'primary key of ChoiceInteraction';

COMMENT ON CONSTRAINT "__choice_interaction_max_selections_message_pk_tlfjnpqllf" ON "qti"."choice_interaction_max_selections_message" IS 'primary key of ChoiceInteractionMaxSelectionsMessage';

COMMENT ON CONSTRAINT "__choice_interaction_min_selections_message_pk_buoctmpill" ON "qti"."choice_interaction_min_selections_message" IS 'primary key of ChoiceInteractionMinSelectionsMessage';

COMMENT ON CONSTRAINT "__comment_pk_zalmloung6" ON "qti"."comment" IS 'primary key of Comment';

COMMENT ON CONSTRAINT "__correct_response_arm_pk_wusr6prctw" ON "qti"."correct_response_arm" IS 'primary key of CorrectResponseArm';

COMMENT ON CONSTRAINT "__declaration_pk_kfs3bogieg" ON "qti"."declaration" IS 'primary key of Declaration';

COMMENT ON CONSTRAINT "__declaration_key_document_identifier_nhssflcoha" ON "qti"."declaration" IS 'key Declaration(document, identifier)';

COMMENT ON CONSTRAINT "__declaration_key_id_shape_mu2s257vd4" ON "qti"."declaration" IS 'key Declaration(id, shape)';

COMMENT ON CONSTRAINT "__declaration_key_document_identifier_shape_lzyberz5rq" ON "qti"."declaration" IS 'key Declaration(document, identifier, shape)';

COMMENT ON CONSTRAINT "__declaration_key_document_identifier_kind_6qqc7ch76r" ON "qti"."declaration" IS 'key Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__declaration_key_id_document_identifier_q47zggzoeq" ON "qti"."declaration" IS 'key Declaration(id, document, identifier)';

COMMENT ON CONSTRAINT "__declaration_key_id_kind_dpb6dzt55d" ON "qti"."declaration" IS 'key Declaration(id, kind)';

COMMENT ON CONSTRAINT "__declaration_key_id_document_identifier_kind_mvchic7xpf" ON "qti"."declaration" IS 'key Declaration(id, document, identifier, kind)';

COMMENT ON CONSTRAINT "__declaration_external_scored_pk_iucwsc25qw" ON "qti"."declaration_external_scored" IS 'primary key of DeclarationExternalScored';

COMMENT ON CONSTRAINT "__declaration_interpretation_pk_jzan4e33hu" ON "qti"."declaration_interpretation" IS 'primary key of DeclarationInterpretation';

COMMENT ON CONSTRAINT "__declaration_long_interpretation_pk_gsj2qzn5ta" ON "qti"."declaration_long_interpretation" IS 'primary key of DeclarationLongInterpretation';

COMMENT ON CONSTRAINT "__declaration_mastery_value_pk_c3ablixaqt" ON "qti"."declaration_mastery_value" IS 'primary key of DeclarationMasteryValue';

COMMENT ON CONSTRAINT "__declaration_normal_maximum_pk_ae4pqmamf6" ON "qti"."declaration_normal_maximum" IS 'primary key of DeclarationNormalMaximum';

COMMENT ON CONSTRAINT "__declaration_normal_minimum_pk_ktd2c3st7m" ON "qti"."declaration_normal_minimum" IS 'primary key of DeclarationNormalMinimum';

COMMENT ON CONSTRAINT "__declaration_variable_identifier_ref_pk_6lwgamxhdv" ON "qti"."declaration_variable_identifier_ref" IS 'primary key of DeclarationVariableIdentifierRef';

COMMENT ON CONSTRAINT "__declaration_view_pk_6zxyzofraw" ON "qti"."declaration_view" IS 'primary key of DeclarationView';

COMMENT ON CONSTRAINT "__declared_adaptive_pk_peor3rnexn" ON "qti"."declared_adaptive" IS 'primary key of DeclaredAdaptive';

COMMENT ON CONSTRAINT "__declared_fixed_pk_p223qdk6qz" ON "qti"."declared_fixed" IS 'primary key of DeclaredFixed';

COMMENT ON CONSTRAINT "__declared_max_choices_pk_kqpg3t3hvl" ON "qti"."declared_max_choices" IS 'primary key of DeclaredMaxChoices';

COMMENT ON CONSTRAINT "__declared_min_choices_pk_wjom3ecba4" ON "qti"."declared_min_choices" IS 'primary key of DeclaredMinChoices';

COMMENT ON CONSTRAINT "__declared_orientation_pk_idge7x3tju" ON "qti"."declared_orientation" IS 'primary key of DeclaredOrientation';

COMMENT ON CONSTRAINT "__declared_ref_pk_uif5t6o33f" ON "qti"."declared_ref" IS 'primary key of DeclaredRef';

COMMENT ON CONSTRAINT "__declared_show_hide_pk_lvd64jnrrn" ON "qti"."declared_show_hide" IS 'primary key of DeclaredShowHide';

COMMENT ON CONSTRAINT "__declared_shuffle_pk_tmz5d3bh2j" ON "qti"."declared_shuffle" IS 'primary key of DeclaredShuffle';

COMMENT ON CONSTRAINT "__declared_value_pk_5pcq2npmhm" ON "qti"."declared_value" IS 'primary key of DeclaredValue';

COMMENT ON CONSTRAINT "__declared_value_key_id_base_type_3dbnrwpq7k" ON "qti"."declared_value" IS 'key DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_key_id_shape_37ypo3n26u" ON "qti"."declared_value" IS 'key DeclaredValue(id, shape)';

COMMENT ON CONSTRAINT "__declared_value_boolean_pk_ddj52fqh6d" ON "qti"."declared_value_boolean" IS 'primary key of DeclaredValueBoolean';

COMMENT ON CONSTRAINT "__declared_value_directed_pair_pk_6wxayfungq" ON "qti"."declared_value_directed_pair" IS 'primary key of DeclaredValueDirectedPair';

COMMENT ON CONSTRAINT "__declared_value_duration_pk_35uc6vgqks" ON "qti"."declared_value_duration" IS 'primary key of DeclaredValueDuration';

COMMENT ON CONSTRAINT "__declared_value_file_pk_mtfyf4xj5n" ON "qti"."declared_value_file" IS 'primary key of DeclaredValueFile';

COMMENT ON CONSTRAINT "__declared_value_float_pk_jl3zamlr24" ON "qti"."declared_value_float" IS 'primary key of DeclaredValueFloat';

COMMENT ON CONSTRAINT "__declared_value_identifier_pk_a74zzqpigw" ON "qti"."declared_value_identifier" IS 'primary key of DeclaredValueIdentifier';

COMMENT ON CONSTRAINT "__declared_value_integer_pk_4gbwrvrfsf" ON "qti"."declared_value_integer" IS 'primary key of DeclaredValueInteger';

COMMENT ON CONSTRAINT "__declared_value_pair_pk_x7wxicbs2y" ON "qti"."declared_value_pair" IS 'primary key of DeclaredValuePair';

COMMENT ON CONSTRAINT "__declared_value_point_pk_2zrgg3g5eh" ON "qti"."declared_value_point" IS 'primary key of DeclaredValuePoint';

COMMENT ON CONSTRAINT "__declared_value_string_pk_sf7doe2qrv" ON "qti"."declared_value_string" IS 'primary key of DeclaredValueString';

COMMENT ON CONSTRAINT "__declared_value_uri_pk_w6vkr3buaw" ON "qti"."declared_value_uri" IS 'primary key of DeclaredValueUri';

COMMENT ON CONSTRAINT "__default_value_arm_pk_gsdxrg3f6p" ON "qti"."default_value_arm" IS 'primary key of DefaultValueArm';

COMMENT ON CONSTRAINT "__dependency_pk_d6a6ko4xiy" ON "qti"."dependency" IS 'primary key of Dependency';

COMMENT ON CONSTRAINT "__document_pk_4kx3ps5ktb" ON "qti"."document" IS 'primary key of Document';

COMMENT ON CONSTRAINT "__document_key_package_path_hvs3spxdfn" ON "qti"."document" IS 'key Document(package, path)';

COMMENT ON CONSTRAINT "__document_key_package_resource_ffl2twv7tp" ON "qti"."document" IS 'key Document(package, resource)';

COMMENT ON CONSTRAINT "__document_key_id_package_resource_root_nfipbzda3x" ON "qti"."document" IS 'key Document(id, package, resource, root)';

COMMENT ON CONSTRAINT "__document_id_pk_x7sxopulh7" ON "qti"."document_id" IS 'primary key of DocumentId';

COMMENT ON CONSTRAINT "__document_id_key_document_id_holder_lfvlmxo4b4" ON "qti"."document_id" IS 'key DocumentId(document, id, holder)';

COMMENT ON CONSTRAINT "__document_identifier_pk_afnsowpxmd" ON "qti"."document_identifier" IS 'primary key of DocumentIdentifier';

COMMENT ON CONSTRAINT "__document_identifier_key_package_resource_4w3bw3solt" ON "qti"."document_identifier" IS 'key DocumentIdentifier(package, resource)';

COMMENT ON CONSTRAINT "__document_identifier_key_package_resource_value_jyew76k7bo" ON "qti"."document_identifier" IS 'key DocumentIdentifier(package, resource, value)';

COMMENT ON CONSTRAINT "__document_title_pk_aemuz3eyle" ON "qti"."document_title" IS 'primary key of DocumentTitle';

COMMENT ON CONSTRAINT "__document_title_key_package_resource_34i3iox4ft" ON "qti"."document_title" IS 'key DocumentTitle(package, resource)';

COMMENT ON CONSTRAINT "__document_title_key_package_resource_collapsed_x734cq6egx" ON "qti"."document_title" IS 'key DocumentTitle(package, resource, collapsed)';

COMMENT ON CONSTRAINT "__edge_pk_7mkowjkaik" ON "qti"."edge" IS 'primary key of Edge';

COMMENT ON CONSTRAINT "__edge_key_child_hgvfjbjilm" ON "qti"."edge" IS 'key Edge(child)';

COMMENT ON CONSTRAINT "__edge_key_child_parent_e22uz7r65h" ON "qti"."edge" IS 'key Edge(child, parent)';

COMMENT ON CONSTRAINT "__edge_key_child_position_ycndxvfvdk" ON "qti"."edge" IS 'key Edge(child, position)';

COMMENT ON CONSTRAINT "__edge_key_child_parent_position_5nn5z4ycin" ON "qti"."edge" IS 'key Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__entity_reference_pk_dmli6ubp5p" ON "qti"."entity_reference" IS 'primary key of EntityReference';

COMMENT ON CONSTRAINT "__expression_pk_djkytcc7ot" ON "qti"."expression" IS 'primary key of Expression';

COMMENT ON CONSTRAINT "__file_pk_i2bjocdyi2" ON "qti"."file" IS 'primary key of File';

COMMENT ON CONSTRAINT "__file_key_package_resource_position_so6ywuntxa" ON "qti"."file" IS 'key File(package, resource, position)';

COMMENT ON CONSTRAINT "__file_content_pk_kztaujzbaq" ON "qti"."file_content" IS 'primary key of FileContent';

COMMENT ON CONSTRAINT "__img_pk_5crzbdfk6h" ON "qti"."img" IS 'primary key of Img';

COMMENT ON CONSTRAINT "__img_height_pk_wjxjfgsbqi" ON "qti"."img_height" IS 'primary key of ImgHeight';

COMMENT ON CONSTRAINT "__img_longdesc_pk_h464cr4fxi" ON "qti"."img_longdesc" IS 'primary key of ImgLongdesc';

COMMENT ON CONSTRAINT "__img_width_pk_h4nleda2od" ON "qti"."img_width" IS 'primary key of ImgWidth';

COMMENT ON CONSTRAINT "__interaction_binding_pk_5gb33vv6zw" ON "qti"."interaction_binding" IS 'primary key of InteractionBinding';

COMMENT ON CONSTRAINT "__interaction_binding_key_document_response_22rxbgbwhi" ON "qti"."interaction_binding" IS 'key InteractionBinding(document, responseIdentifier)';

COMMENT ON CONSTRAINT "__interaction_binding_key_node_shape_yhsfpovhkg" ON "qti"."interaction_binding" IS 'key InteractionBinding(node, shape)';

COMMENT ON CONSTRAINT "__item_body_pk_6niwnztdcy" ON "qti"."item_body" IS 'primary key of ItemBody';

COMMENT ON CONSTRAINT "__item_body_key_item_ksx3s2fj7n" ON "qti"."item_body" IS 'key ItemBody(item)';

COMMENT ON CONSTRAINT "__literal_pk_aelubxdbzj" ON "qti"."literal" IS 'primary key of Literal';

COMMENT ON CONSTRAINT "__literal_key_id_base_type_n6picv5q76" ON "qti"."literal" IS 'key Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_boolean_pk_pzorcnr4yz" ON "qti"."literal_boolean" IS 'primary key of LiteralBoolean';

COMMENT ON CONSTRAINT "__literal_directed_pair_pk_4awlgrcin7" ON "qti"."literal_directed_pair" IS 'primary key of LiteralDirectedPair';

COMMENT ON CONSTRAINT "__literal_duration_pk_ogja6w3jzn" ON "qti"."literal_duration" IS 'primary key of LiteralDuration';

COMMENT ON CONSTRAINT "__literal_file_pk_ex3xvxhvfs" ON "qti"."literal_file" IS 'primary key of LiteralFile';

COMMENT ON CONSTRAINT "__literal_float_pk_rfnv2wul2k" ON "qti"."literal_float" IS 'primary key of LiteralFloat';

COMMENT ON CONSTRAINT "__literal_identifier_pk_3pbylrgphi" ON "qti"."literal_identifier" IS 'primary key of LiteralIdentifier';

COMMENT ON CONSTRAINT "__literal_integer_pk_puy5zdh44m" ON "qti"."literal_integer" IS 'primary key of LiteralInteger';

COMMENT ON CONSTRAINT "__literal_pair_pk_2djc6cp3gc" ON "qti"."literal_pair" IS 'primary key of LiteralPair';

COMMENT ON CONSTRAINT "__literal_point_pk_f5phugbw7g" ON "qti"."literal_point" IS 'primary key of LiteralPoint';

COMMENT ON CONSTRAINT "__literal_string_pk_7jxwemsry2" ON "qti"."literal_string" IS 'primary key of LiteralString';

COMMENT ON CONSTRAINT "__literal_uri_pk_fzufg3fltq" ON "qti"."literal_uri" IS 'primary key of LiteralUri';

COMMENT ON CONSTRAINT "__lom_pk_cfwl65ptfj" ON "qti"."lom" IS 'primary key of Lom';

COMMENT ON CONSTRAINT "__lom_key_id_owner_2k4rqjrbzk" ON "qti"."lom" IS 'key Lom(id, owner)';

COMMENT ON CONSTRAINT "__lom_key_id_package_mwadkm4ng4" ON "qti"."lom" IS 'key Lom(id, package)';

COMMENT ON CONSTRAINT "__lom_aggregation_level_pk_s2tympvcri" ON "qti"."lom_aggregation_level" IS 'primary key of LomAggregationLevel';

COMMENT ON CONSTRAINT "__lom_contribute_pk_mumbgx5cgs" ON "qti"."lom_contribute" IS 'primary key of LomContribute';

COMMENT ON CONSTRAINT "__lom_contribute_key_parent_position_4mn4pfsbrs" ON "qti"."lom_contribute" IS 'key LomContribute(parent, position)';

COMMENT ON CONSTRAINT "__lom_copyright_and_other_restrictions_pk_5pyhbwfpgo" ON "qti"."lom_copyright_and_other_restrictions" IS 'primary key of LomCopyrightAndOtherRestrictions';

COMMENT ON CONSTRAINT "__lom_copyright_and_other_restrictions_key_rights_7wudgbtm3p" ON "qti"."lom_copyright_and_other_restrictions" IS 'key LomCopyrightAndOtherRestrictions(rights)';

COMMENT ON CONSTRAINT "__lom_cost_pk_ifg475rcuj" ON "qti"."lom_cost" IS 'primary key of LomCost';

COMMENT ON CONSTRAINT "__lom_cost_key_rights_y6buu3xmcc" ON "qti"."lom_cost" IS 'key LomCost(rights)';

COMMENT ON CONSTRAINT "__lom_coverage_pk_u27robnrhh" ON "qti"."lom_coverage" IS 'primary key of LomCoverage';

COMMENT ON CONSTRAINT "__lom_date_pk_5uwbwivc4y" ON "qti"."lom_date" IS 'primary key of LomDate';

COMMENT ON CONSTRAINT "__lom_date_key_contribute_5wm3nnpxkr" ON "qti"."lom_date" IS 'key LomDate(contribute)';

COMMENT ON CONSTRAINT "__lom_date_time_pk_cly7hfrljo" ON "qti"."lom_date_time" IS 'primary key of LomDateTime';

COMMENT ON CONSTRAINT "__lom_date_time_key_date_rxpe6aqrb6" ON "qti"."lom_date_time" IS 'key LomDateTime(date)';

COMMENT ON CONSTRAINT "__lom_description_pk_pd5msgzo2g" ON "qti"."lom_description" IS 'primary key of LomDescription';

COMMENT ON CONSTRAINT "__lom_duration_pk_ydmuoijchs" ON "qti"."lom_duration" IS 'primary key of LomDuration';

COMMENT ON CONSTRAINT "__lom_duration_key_technical_4cqyvamai2" ON "qti"."lom_duration" IS 'key LomDuration(technical)';

COMMENT ON CONSTRAINT "__lom_duration_string_pk_y5fwqaj5mn" ON "qti"."lom_duration_string" IS 'primary key of LomDurationString';

COMMENT ON CONSTRAINT "__lom_duration_string_key_duration_dzi5dckpud" ON "qti"."lom_duration_string" IS 'key LomDurationString(duration)';

COMMENT ON CONSTRAINT "__lom_entity_pk_ck4cxgvlzx" ON "qti"."lom_entity" IS 'primary key of LomEntity';

COMMENT ON CONSTRAINT "__lom_entity_key_contribute_position_mwtyzdiqme" ON "qti"."lom_entity" IS 'key LomEntity(contribute, position)';

COMMENT ON CONSTRAINT "__lom_format_pk_jnwntdq52w" ON "qti"."lom_format" IS 'primary key of LomFormat';

COMMENT ON CONSTRAINT "__lom_format_key_technical_position_krheameqai" ON "qti"."lom_format" IS 'key LomFormat(technical, position)';

COMMENT ON CONSTRAINT "__lom_general_pk_3nzxyyowxe" ON "qti"."lom_general" IS 'primary key of LomGeneral';

COMMENT ON CONSTRAINT "__lom_general_key_lom_7ftwyoy6mr" ON "qti"."lom_general" IS 'key LomGeneral(lom)';

COMMENT ON CONSTRAINT "__lom_general_title_pk_s5eey4iqlu" ON "qti"."lom_general_title" IS 'primary key of LomGeneralTitle';

COMMENT ON CONSTRAINT "__lom_general_title_key_lom_nsilkncsee" ON "qti"."lom_general_title" IS 'key LomGeneralTitle(lom)';

COMMENT ON CONSTRAINT "__lom_identifier_pk_vfc5s25ym5" ON "qti"."lom_identifier" IS 'primary key of LomIdentifier';

COMMENT ON CONSTRAINT "__lom_identifier_key_lom_position_i5jf554z7n" ON "qti"."lom_identifier" IS 'key LomIdentifier(lom, position)';

COMMENT ON CONSTRAINT "__lom_identifier_catalog_pk_plebwsw2uo" ON "qti"."lom_identifier_catalog" IS 'primary key of LomIdentifierCatalog';

COMMENT ON CONSTRAINT "__lom_identifier_entry_pk_urwvfn3yd6" ON "qti"."lom_identifier_entry" IS 'primary key of LomIdentifierEntry';

COMMENT ON CONSTRAINT "__lom_identifier_entry_key_lom_position_w4f2vsovly" ON "qti"."lom_identifier_entry" IS 'key LomIdentifierEntry(lom, position)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_key_lom_position_collapsed_gj4fwidr7p" ON "qti"."lom_identifier_entry" IS 'key LomIdentifierEntry(lom, position, collapsed)';

COMMENT ON CONSTRAINT "__lom_installation_remarks_pk_2niiuddo5m" ON "qti"."lom_installation_remarks" IS 'primary key of LomInstallationRemarks';

COMMENT ON CONSTRAINT "__lom_installation_remarks_key_technical_hjt52iv2h6" ON "qti"."lom_installation_remarks" IS 'key LomInstallationRemarks(technical)';

COMMENT ON CONSTRAINT "__lom_keyword_pk_isklyggmvm" ON "qti"."lom_keyword" IS 'primary key of LomKeyword';

COMMENT ON CONSTRAINT "__lom_language_pk_dyuesseefb" ON "qti"."lom_language" IS 'primary key of LomLanguage';

COMMENT ON CONSTRAINT "__lom_life_cycle_pk_atprldcekz" ON "qti"."lom_life_cycle" IS 'primary key of LomLifeCycle';

COMMENT ON CONSTRAINT "__lom_life_cycle_key_lom_w22vjmbhh3" ON "qti"."lom_life_cycle" IS 'key LomLifeCycle(lom)';

COMMENT ON CONSTRAINT "__lom_location_pk_w2bior4ffq" ON "qti"."lom_location" IS 'primary key of LomLocation';

COMMENT ON CONSTRAINT "__lom_location_key_technical_position_2qidj6qt7d" ON "qti"."lom_location" IS 'key LomLocation(technical, position)';

COMMENT ON CONSTRAINT "__lom_maximum_version_pk_oj36nnjc4h" ON "qti"."lom_maximum_version" IS 'primary key of LomMaximumVersion';

COMMENT ON CONSTRAINT "__lom_maximum_version_key_or_composite_bahlcymzma" ON "qti"."lom_maximum_version" IS 'key LomMaximumVersion(orComposite)';

COMMENT ON CONSTRAINT "__lom_meta_metadata_pk_exhl26vrjw" ON "qti"."lom_meta_metadata" IS 'primary key of LomMetaMetadata';

COMMENT ON CONSTRAINT "__lom_meta_metadata_key_lom_zny5hdt5ep" ON "qti"."lom_meta_metadata" IS 'key LomMetaMetadata(lom)';

COMMENT ON CONSTRAINT "__lom_metadataschema_pk_kpxnnes2gd" ON "qti"."lom_metadataschema" IS 'primary key of LomMetadataschema';

COMMENT ON CONSTRAINT "__lom_metadataschema_key_meta_metadata_position_fekuqgnvzc" ON "qti"."lom_metadataschema" IS 'key LomMetadataschema(metaMetadata, position)';

COMMENT ON CONSTRAINT "__lom_minimum_version_pk_aqxotk3lkv" ON "qti"."lom_minimum_version" IS 'primary key of LomMinimumVersion';

COMMENT ON CONSTRAINT "__lom_minimum_version_key_or_composite_uahanfchvh" ON "qti"."lom_minimum_version" IS 'key LomMinimumVersion(orComposite)';

COMMENT ON CONSTRAINT "__lom_name_pk_jpsvu77jw4" ON "qti"."lom_name" IS 'primary key of LomName';

COMMENT ON CONSTRAINT "__lom_name_key_or_composite_ndyhak5cuq" ON "qti"."lom_name" IS 'key LomName(orComposite)';

COMMENT ON CONSTRAINT "__lom_object_identifier_pk_yut5ma3dl7" ON "qti"."lom_object_identifier" IS 'primary key of LomObjectIdentifier';

COMMENT ON CONSTRAINT "__lom_object_title_pk_224q5nl6cj" ON "qti"."lom_object_title" IS 'primary key of LomObjectTitle';

COMMENT ON CONSTRAINT "__lom_or_composite_pk_w7azuxggmw" ON "qti"."lom_or_composite" IS 'primary key of LomOrComposite';

COMMENT ON CONSTRAINT "__lom_or_composite_key_requirement_position_o2o6t3a7fq" ON "qti"."lom_or_composite" IS 'key LomOrComposite(requirement, position)';

COMMENT ON CONSTRAINT "__lom_other_platform_requirements_pk_nermqxuz6n" ON "qti"."lom_other_platform_requirements" IS 'primary key of LomOtherPlatformRequirements';

COMMENT ON CONSTRAINT "__lom_other_platform_requirements_key_technical_3yuf3rc5xd" ON "qti"."lom_other_platform_requirements" IS 'key LomOtherPlatformRequirements(technical)';

COMMENT ON CONSTRAINT "__lom_requirement_pk_2ds2omkmqa" ON "qti"."lom_requirement" IS 'primary key of LomRequirement';

COMMENT ON CONSTRAINT "__lom_requirement_key_technical_position_y3rwmrsnzh" ON "qti"."lom_requirement" IS 'key LomRequirement(technical, position)';

COMMENT ON CONSTRAINT "__lom_rights_pk_jf7l6nnzdh" ON "qti"."lom_rights" IS 'primary key of LomRights';

COMMENT ON CONSTRAINT "__lom_rights_key_lom_igi3mirrcx" ON "qti"."lom_rights" IS 'key LomRights(lom)';

COMMENT ON CONSTRAINT "__lom_role_pk_5bktrzsauq" ON "qti"."lom_role" IS 'primary key of LomRole';

COMMENT ON CONSTRAINT "__lom_role_key_contribute_ehaei34cce" ON "qti"."lom_role" IS 'key LomRole(contribute)';

COMMENT ON CONSTRAINT "__lom_size_pk_vfewaszzzv" ON "qti"."lom_size" IS 'primary key of LomSize';

COMMENT ON CONSTRAINT "__lom_size_key_technical_5iy4diylyq" ON "qti"."lom_size" IS 'key LomSize(technical)';

COMMENT ON CONSTRAINT "__lom_source_pk_hq442or7kb" ON "qti"."lom_source" IS 'primary key of LomSource';

COMMENT ON CONSTRAINT "__lom_status_pk_rprhxrcz6w" ON "qti"."lom_status" IS 'primary key of LomStatus';

COMMENT ON CONSTRAINT "__lom_status_key_life_cycle_c3hodmun3m" ON "qti"."lom_status" IS 'key LomStatus(lifeCycle)';

COMMENT ON CONSTRAINT "__lom_string_pk_j6pxaair7j" ON "qti"."lom_string" IS 'primary key of LomString';

COMMENT ON CONSTRAINT "__lom_string_key_id_value_collapsed_ewkonewg3e" ON "qti"."lom_string" IS 'key LomString(id, value, collapsed)';

COMMENT ON CONSTRAINT "__lom_string_language_pk_467ufc6ip4" ON "qti"."lom_string_language" IS 'primary key of LomStringLanguage';

COMMENT ON CONSTRAINT "__lom_structure_pk_7wbnknpp7i" ON "qti"."lom_structure" IS 'primary key of LomStructure';

COMMENT ON CONSTRAINT "__lom_technical_pk_72qh5dseuv" ON "qti"."lom_technical" IS 'primary key of LomTechnical';

COMMENT ON CONSTRAINT "__lom_technical_key_lom_vbphyfmpwb" ON "qti"."lom_technical" IS 'key LomTechnical(lom)';

COMMENT ON CONSTRAINT "__lom_title_pk_6humwubm5t" ON "qti"."lom_title" IS 'primary key of LomTitle';

COMMENT ON CONSTRAINT "__lom_title_key_lom_position_osweencxmz" ON "qti"."lom_title" IS 'key LomTitle(lom, position)';

COMMENT ON CONSTRAINT "__lom_title_key_lom_position_collapsed_kxw7nki5dn" ON "qti"."lom_title" IS 'key LomTitle(lom, position, collapsed)';

COMMENT ON CONSTRAINT "__lom_type_pk_ih5sl4jgoq" ON "qti"."lom_type" IS 'primary key of LomType';

COMMENT ON CONSTRAINT "__lom_type_key_or_composite_wg6m3zavcu" ON "qti"."lom_type" IS 'key LomType(orComposite)';

COMMENT ON CONSTRAINT "__lom_value_pk_uzcm4enckp" ON "qti"."lom_value" IS 'primary key of LomValue';

COMMENT ON CONSTRAINT "__lom_version_pk_cf45ruciof" ON "qti"."lom_version" IS 'primary key of LomVersion';

COMMENT ON CONSTRAINT "__lom_version_key_life_cycle_ik4t5dfusg" ON "qti"."lom_version" IS 'key LomVersion(lifeCycle)';

COMMENT ON CONSTRAINT "__manifest_pk_qjlydhnqtl" ON "qti"."manifest" IS 'primary key of Manifest';

COMMENT ON CONSTRAINT "__manifest_lom_pk_gtw6b2jkpd" ON "qti"."manifest_lom" IS 'primary key of ManifestLom';

COMMENT ON CONSTRAINT "__manifest_lom_key_package_erdswzvc25" ON "qti"."manifest_lom" IS 'key ManifestLom(package)';

COMMENT ON CONSTRAINT "__manifest_metadata_pk_o5smotlktf" ON "qti"."manifest_metadata" IS 'primary key of ManifestMetadata';

COMMENT ON CONSTRAINT "__manifest_metadata_key_manifest_vtlsxnvblg" ON "qti"."manifest_metadata" IS 'key ManifestMetadata(manifest)';

COMMENT ON CONSTRAINT "__manifest_schema_pk_7olepmmwbb" ON "qti"."manifest_schema" IS 'primary key of ManifestSchema';

COMMENT ON CONSTRAINT "__manifest_schema_key_metadata_hkhzp7bnux" ON "qti"."manifest_schema" IS 'key ManifestSchema(metadata)';

COMMENT ON CONSTRAINT "__manifest_schema_version_pk_xrqjnte57i" ON "qti"."manifest_schema_version" IS 'primary key of ManifestSchemaVersion';

COMMENT ON CONSTRAINT "__manifest_schema_version_key_metadata_lvlvkimnnz" ON "qti"."manifest_schema_version" IS 'key ManifestSchemaVersion(metadata)';

COMMENT ON CONSTRAINT "__namespace_declaration_pk_qkfnrroixl" ON "qti"."namespace_declaration" IS 'primary key of NamespaceDeclaration';

COMMENT ON CONSTRAINT "__node_pk_3sd4cqvxbf" ON "qti"."node" IS 'primary key of Node';

COMMENT ON CONSTRAINT "__node_key_id_tree_version_kind_sjr4jx6soj" ON "qti"."node" IS 'key Node(id, tree, version, kind)';

COMMENT ON CONSTRAINT "__node_key_id_tree_kind_4maffhlb7n" ON "qti"."node" IS 'key Node(id, tree, kind)';

COMMENT ON CONSTRAINT "__node_key_id_tree_q3mjcmmvwy" ON "qti"."node" IS 'key Node(id, tree)';

COMMENT ON CONSTRAINT "__node_key_id_root_kind_bko2kkuujd" ON "qti"."node" IS 'key Node(id, rootKind)';

COMMENT ON CONSTRAINT "__node_key_id_kind_phk5q5ctpf" ON "qti"."node" IS 'key Node(id, kind)';

COMMENT ON CONSTRAINT "__operand_pk_kv4v2shmyp" ON "qti"."operand" IS 'primary key of Operand';

COMMENT ON CONSTRAINT "__operand_key_child_xhxiir4t3r" ON "qti"."operand" IS 'key Operand(child)';

COMMENT ON CONSTRAINT "__operator_arity_pk_q24hdn3ki4" ON "qti"."operator_arity" IS 'primary key of OperatorArity';

COMMENT ON CONSTRAINT "__operator_arity_max_pk_2il4lpb7ts" ON "qti"."operator_arity_max" IS 'primary key of OperatorArityMax';

COMMENT ON CONSTRAINT "__organizations_pk_s75qmfyk3u" ON "qti"."organizations" IS 'primary key of Organizations';

COMMENT ON CONSTRAINT "__organizations_key_manifest_l2ctxec4pj" ON "qti"."organizations" IS 'key Organizations(manifest)';

COMMENT ON CONSTRAINT "__outcome_declaration_arm_pk_pnkc34gvyg" ON "qti"."outcome_declaration_arm" IS 'primary key of OutcomeDeclarationArm';

COMMENT ON CONSTRAINT "__p_pk_hx26m6msb5" ON "qti"."p" IS 'primary key of P';

COMMENT ON CONSTRAINT "__package_pk_sg2cyzxgtm" ON "qti"."package" IS 'primary key of Package';

COMMENT ON CONSTRAINT "__package_key_id_schemaversion_2sbnqejonp" ON "qti"."package" IS 'key Package(id, schemaversion)';

COMMENT ON CONSTRAINT "__package_entry_pk_3i35ab5o3w" ON "qti"."package_entry" IS 'primary key of PackageEntry';

COMMENT ON CONSTRAINT "__pi_pk_vqm3tcomg6" ON "qti"."pi" IS 'primary key of Pi';

COMMENT ON CONSTRAINT "__prompt_pk_wxy2gmqfd7" ON "qti"."prompt" IS 'primary key of Prompt';

COMMENT ON CONSTRAINT "__prompt_key_parent_4f55velenh" ON "qti"."prompt" IS 'key Prompt(parent)';

COMMENT ON CONSTRAINT "__qmd_composite_pk_xlqha76w6j" ON "qti"."qmd_composite" IS 'primary key of QmdComposite';

COMMENT ON CONSTRAINT "__qmd_composite_key_qti_metadata_lbf64f3xqh" ON "qti"."qmd_composite" IS 'key QmdComposite(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_custom_type_identifier_pk_t2e27tuazw" ON "qti"."qmd_custom_type_identifier" IS 'primary key of QmdCustomTypeIdentifier';

COMMENT ON CONSTRAINT "__qmd_custom_type_identifier_key_context_6hcmllgbnf" ON "qti"."qmd_custom_type_identifier" IS 'key QmdCustomTypeIdentifier(context)';

COMMENT ON CONSTRAINT "__qmd_feedback_type_pk_n3cozndfbx" ON "qti"."qmd_feedback_type" IS 'primary key of QmdFeedbackType';

COMMENT ON CONSTRAINT "__qmd_feedback_type_key_qti_metadata_fbnqiylecc" ON "qti"."qmd_feedback_type" IS 'key QmdFeedbackType(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_interaction_kind_pk_jjituwkg3a" ON "qti"."qmd_interaction_kind" IS 'primary key of QmdInteractionKind';

COMMENT ON CONSTRAINT "__qmd_interaction_kind_key_context_zgrdm4kzyz" ON "qti"."qmd_interaction_kind" IS 'key QmdInteractionKind(context)';

COMMENT ON CONSTRAINT "__qmd_interaction_type_pk_ohm4idltho" ON "qti"."qmd_interaction_type" IS 'primary key of QmdInteractionType';

COMMENT ON CONSTRAINT "__qmd_item_template_pk_mimqgmhu2u" ON "qti"."qmd_item_template" IS 'primary key of QmdItemTemplate';

COMMENT ON CONSTRAINT "__qmd_item_template_key_qti_metadata_oew4krly7g" ON "qti"."qmd_item_template" IS 'key QmdItemTemplate(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_portable_custom_interaction_context_pk_xac34gmcx6" ON "qti"."qmd_portable_custom_interaction_context" IS 'primary key of QmdPortableCustomInteractionContext';

COMMENT ON CONSTRAINT "__qmd_portable_custom_interaction_context_key_qti_xhmydb4ask" ON "qti"."qmd_portable_custom_interaction_context" IS 'key QmdPortableCustomInteractionContext(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_scoring_mode_pk_c37sji4e2c" ON "qti"."qmd_scoring_mode" IS 'primary key of QmdScoringMode';

COMMENT ON CONSTRAINT "__qmd_solution_available_pk_vuhhrrl3yq" ON "qti"."qmd_solution_available" IS 'primary key of QmdSolutionAvailable';

COMMENT ON CONSTRAINT "__qmd_solution_available_key_qti_metadata_rhehxypx2m" ON "qti"."qmd_solution_available" IS 'key QmdSolutionAvailable(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_time_dependent_pk_totdnpiz57" ON "qti"."qmd_time_dependent" IS 'primary key of QmdTimeDependent';

COMMENT ON CONSTRAINT "__qmd_time_dependent_key_qti_metadata_pizyu76fq2" ON "qti"."qmd_time_dependent" IS 'key QmdTimeDependent(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_tool_name_pk_eos7lhy5x6" ON "qti"."qmd_tool_name" IS 'primary key of QmdToolName';

COMMENT ON CONSTRAINT "__qmd_tool_name_key_qti_metadata_2mqtwkzgw5" ON "qti"."qmd_tool_name" IS 'key QmdToolName(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_tool_vendor_pk_nsbkalhujg" ON "qti"."qmd_tool_vendor" IS 'primary key of QmdToolVendor';

COMMENT ON CONSTRAINT "__qmd_tool_vendor_key_qti_metadata_dxe3sypo7i" ON "qti"."qmd_tool_vendor" IS 'key QmdToolVendor(qtiMetadata)';

COMMENT ON CONSTRAINT "__qmd_tool_version_pk_3k4ht2nmw5" ON "qti"."qmd_tool_version" IS 'primary key of QmdToolVersion';

COMMENT ON CONSTRAINT "__qmd_tool_version_key_qti_metadata_rrsckkvtse" ON "qti"."qmd_tool_version" IS 'key QmdToolVersion(qtiMetadata)';

COMMENT ON CONSTRAINT "__qti_metadata_pk_s4olys2stl" ON "qti"."qti_metadata" IS 'primary key of QtiMetadata';

COMMENT ON CONSTRAINT "__qti_metadata_key_resource_rnqab2cujf" ON "qti"."qti_metadata" IS 'key QtiMetadata(resource)';

COMMENT ON CONSTRAINT "__record_binding_pk_zo6rox5gzm" ON "qti"."record_binding" IS 'primary key of RecordBinding';

COMMENT ON CONSTRAINT "__record_declaration_pk_5bmpqtimiy" ON "qti"."record_declaration" IS 'primary key of RecordDeclaration';

COMMENT ON CONSTRAINT "__record_field_pk_qhg6nv6lbn" ON "qti"."record_field" IS 'primary key of RecordField';

COMMENT ON CONSTRAINT "__record_value_set_pk_hw4xyls63o" ON "qti"."record_value_set" IS 'primary key of RecordValueSet';

COMMENT ON CONSTRAINT "__resource_pk_yrfq7dxmhs" ON "qti"."resource" IS 'primary key of Resource';

COMMENT ON CONSTRAINT "__resource_key_package_identifier_fsvcnui6cz" ON "qti"."resource" IS 'key Resource(package, identifier)';

COMMENT ON CONSTRAINT "__resource_key_package_identifier_type_24kwhezduw" ON "qti"."resource" IS 'key Resource(package, identifier, type)';

COMMENT ON CONSTRAINT "__resource_key_id_package_zmgj4vl2s5" ON "qti"."resource" IS 'key Resource(id, package)';

COMMENT ON CONSTRAINT "__resource_href_pk_fzjlywz4ma" ON "qti"."resource_href" IS 'primary key of ResourceHref';

COMMENT ON CONSTRAINT "__resource_lom_pk_cx7m3uevdj" ON "qti"."resource_lom" IS 'primary key of ResourceLom';

COMMENT ON CONSTRAINT "__resource_lom_key_package_resource_wavh3iq5t3" ON "qti"."resource_lom" IS 'key ResourceLom(package, resource)';

COMMENT ON CONSTRAINT "__resource_lom_key_lom_package_resource_type_7gdyikkhg4" ON "qti"."resource_lom" IS 'key ResourceLom(lom, package, resource, type)';

COMMENT ON CONSTRAINT "__resource_lom_identified_pk_xrqngnwel5" ON "qti"."resource_lom_identified" IS 'primary key of ResourceLomIdentified';

COMMENT ON CONSTRAINT "__resource_lom_identified_key_lom_package_resource_pfavxom73q" ON "qti"."resource_lom_identified" IS 'key ResourceLomIdentified(lom, package, resource, type)';

COMMENT ON CONSTRAINT "__resource_lom_titled_pk_txhs6tqqu2" ON "qti"."resource_lom_titled" IS 'primary key of ResourceLomTitled';

COMMENT ON CONSTRAINT "__resource_lom_titled_key_lom_package_resource_type_qreilk2jjd" ON "qti"."resource_lom_titled" IS 'key ResourceLomTitled(lom, package, resource, type)';

COMMENT ON CONSTRAINT "__resource_metadata_pk_nb4q7foofw" ON "qti"."resource_metadata" IS 'primary key of ResourceMetadata';

COMMENT ON CONSTRAINT "__resource_metadata_key_resource_ugm3u666g4" ON "qti"."resource_metadata" IS 'key ResourceMetadata(resource)';

COMMENT ON CONSTRAINT "__resource_type_of_pk_vcggjjciac" ON "qti"."resource_type_of" IS 'primary key of ResourceTypeOf';

COMMENT ON CONSTRAINT "__resources_pk_h7o56gfsbb" ON "qti"."resources" IS 'primary key of Resources';

COMMENT ON CONSTRAINT "__resources_key_manifest_q7t3wn3azt" ON "qti"."resources" IS 'key Resources(manifest)';

COMMENT ON CONSTRAINT "__response_declaration_arm_pk_5hhor6gekm" ON "qti"."response_declaration_arm" IS 'primary key of ResponseDeclarationArm';

COMMENT ON CONSTRAINT "__response_declaration_id_pk_tki7iml5lk" ON "qti"."response_declaration_id" IS 'primary key of ResponseDeclarationId';

COMMENT ON CONSTRAINT "__response_processing_pk_vj24li3bev" ON "qti"."response_processing" IS 'primary key of ResponseProcessing';

COMMENT ON CONSTRAINT "__response_processing_key_id_root_kind_nfaywgrq6y" ON "qti"."response_processing" IS 'key ResponseProcessing(id, rootKind)';

COMMENT ON CONSTRAINT "__response_processing_item_pk_p4n6eptdbw" ON "qti"."response_processing_item" IS 'primary key of ResponseProcessingItem';

COMMENT ON CONSTRAINT "__response_processing_item_key_item_g4l5s2zefn" ON "qti"."response_processing_item" IS 'key ResponseProcessingItem(item)';

COMMENT ON CONSTRAINT "__response_processing_template_pk_gpwzrvcd55" ON "qti"."response_processing_template" IS 'primary key of ResponseProcessingTemplate';

COMMENT ON CONSTRAINT "__response_processing_template_location_pk_gq3aqrt7vu" ON "qti"."response_processing_template_location" IS 'primary key of ResponseProcessingTemplateLocation';

COMMENT ON CONSTRAINT "__root_of_type_pk_kdi6c7gguy" ON "qti"."root_of_type" IS 'primary key of RootOfType';

COMMENT ON CONSTRAINT "__root_of_type_key_type_root_v4guhvvyrl" ON "qti"."root_of_type" IS 'key RootOfType(type, root)';

COMMENT ON CONSTRAINT "__schema_location_pk_q6ijfxgo2t" ON "qti"."schema_location" IS 'primary key of SchemaLocation';

COMMENT ON CONSTRAINT "__simple_choice_pk_3t5mywknt4" ON "qti"."simple_choice" IS 'primary key of SimpleChoice';

COMMENT ON CONSTRAINT "__simple_choice_key_interaction_identifier_atyd34wpmk" ON "qti"."simple_choice" IS 'key SimpleChoice(interaction, identifier)';

COMMENT ON CONSTRAINT "__simple_choice_template_identifier_pk_vhko3seq67" ON "qti"."simple_choice_template_identifier" IS 'primary key of SimpleChoiceTemplateIdentifier';

COMMENT ON CONSTRAINT "__standard_template_reference_pk_cpeprqiikq" ON "qti"."standard_template_reference" IS 'primary key of StandardTemplateReference';

COMMENT ON CONSTRAINT "__text_pk_uuxplnj5cm" ON "qti"."text" IS 'primary key of Text';

COMMENT ON CONSTRAINT "__tree_pk_xcoqlm6nqt" ON "qti"."tree" IS 'primary key of Tree';

COMMENT ON CONSTRAINT "__tree_key_id_version_root_ezbdftzuy4" ON "qti"."tree" IS 'key Tree(id, version, root)';

COMMENT ON CONSTRAINT "__tree_key_id_kind_atw4zjatmg" ON "qti"."tree" IS 'key Tree(id, kind)';

COMMENT ON CONSTRAINT "__tree_doctype_pk_rih2k4j4qa" ON "qti"."tree_doctype" IS 'primary key of TreeDoctype';

COMMENT ON CONSTRAINT "__tree_export_charset_pk_p65tu3cdwm" ON "qti"."tree_export_charset" IS 'primary key of TreeExportCharset';

COMMENT ON CONSTRAINT "__tree_misc_pk_y3enpvf5gu" ON "qti"."tree_misc" IS 'primary key of TreeMisc';

COMMENT ON CONSTRAINT "__tree_root_pk_qiciwu2u3r" ON "qti"."tree_root" IS 'primary key of TreeRoot';

COMMENT ON CONSTRAINT "__tree_root_key_node_ubg4rtjyq7" ON "qti"."tree_root" IS 'key TreeRoot(node)';

COMMENT ON CONSTRAINT "__tree_xml_encoding_pk_dj5tvpgs25" ON "qti"."tree_xml_encoding" IS 'primary key of TreeXmlEncoding';

COMMENT ON CONSTRAINT "__tree_xml_standalone_pk_pbqvnzrs6o" ON "qti"."tree_xml_standalone" IS 'primary key of TreeXmlStandalone';

COMMENT ON CONSTRAINT "__tree_xml_version_pk_l6mrjnkgaa" ON "qti"."tree_xml_version" IS 'primary key of TreeXmlVersion';

COMMENT ON CONSTRAINT "__typed_binding_pk_axyc57xkgj" ON "qti"."typed_binding" IS 'primary key of TypedBinding';

COMMENT ON CONSTRAINT "__typed_declaration_pk_zcmmxhw3lj" ON "qti"."typed_declaration" IS 'primary key of TypedDeclaration';

COMMENT ON CONSTRAINT "__typed_declaration_key_document_identifier_ppvxmo2ouu" ON "qti"."typed_declaration" IS 'key TypedDeclaration(document, identifier)';

COMMENT ON CONSTRAINT "__typed_declaration_key_id_base_type_cardinality_fd257gl7mq" ON "qti"."typed_declaration" IS 'key TypedDeclaration(id, baseType, cardinality)';

COMMENT ON CONSTRAINT "__typed_declaration_key_document_identifier_base_fx6yo6vuhe" ON "qti"."typed_declaration" IS 'key TypedDeclaration(document, identifier, baseType, cardinality)';

COMMENT ON CONSTRAINT "__typed_value_set_pk_fsblbpp4do" ON "qti"."typed_value_set" IS 'primary key of TypedValueSet';

COMMENT ON CONSTRAINT "__value_set_pk_aviyvdskxo" ON "qti"."value_set" IS 'primary key of ValueSet';

COMMENT ON CONSTRAINT "__value_set_key_declaration_role_4stlepfimk" ON "qti"."value_set" IS 'key ValueSet(declaration, role)';

COMMENT ON CONSTRAINT "__value_set_key_id_declaration_hkaytoxio7" ON "qti"."value_set" IS 'key ValueSet(id, declaration)';

COMMENT ON CONSTRAINT "__value_set_key_id_shape_mgay3c5bmp" ON "qti"."value_set" IS 'key ValueSet(id, shape)';

COMMENT ON CONSTRAINT "__value_set_key_id_role_3wmhajx4d2" ON "qti"."value_set" IS 'key ValueSet(id, role)';

COMMENT ON CONSTRAINT "__value_set_interpretation_pk_ieijhj5gvd" ON "qti"."value_set_interpretation" IS 'primary key of ValueSetInterpretation';

COMMENT ON CONSTRAINT "__variable_ref_pk_xysknydg4p" ON "qti"."variable_ref" IS 'primary key of VariableRef';

COMMENT ON CONSTRAINT "__variable_ref_key_id_kind_trsdltzwu4" ON "qti"."variable_ref" IS 'key VariableRef(id, kind)';

COMMENT ON CONSTRAINT "__ws_pk_rt3xgtnvrh" ON "qti"."ws" IS 'primary key of Ws';

COMMENT ON COLUMN "qti"."assessment_item"."__tag_kind_qti_assessment_item_lutv7awadt" IS 'tag Node.kind = qti-assessment-item';

COMMENT ON COLUMN "qti"."built_in_ref"."__tag_kind_built_in_a5gr6jz3gp" IS 'tag VariableRef.kind = builtIn';

COMMENT ON COLUMN "qti"."choice_interaction"."__tag_kind_qti_choice_interaction_lrhq33h2cc" IS 'tag Node.kind = qti-choice-interaction';

COMMENT ON COLUMN "qti"."comment"."__tag_kind_comment_nmb7feek53" IS 'tag Node.kind = comment';

COMMENT ON COLUMN "qti"."correct_response_arm"."__tag_kind_qti_correct_response_y6bjt74uq7" IS 'tag Node.kind = qti-correct-response';

COMMENT ON COLUMN "qti"."correct_response_arm"."__tag_role_correct_a6k2xxecvb" IS 'tag ValueSet.role = correct';

COMMENT ON COLUMN "qti"."declared_ref"."__tag_kind_declared_chtay4st64" IS 'tag VariableRef.kind = declared';

COMMENT ON COLUMN "qti"."declared_value"."__tag_kind_qti_value_a22pfhf3za" IS 'tag Node.kind = qti-value';

COMMENT ON COLUMN "qti"."declared_value_boolean"."__tag_base_type_boolean_kh6dvyf44c" IS 'tag DeclaredValue.baseType = boolean';

COMMENT ON COLUMN "qti"."declared_value_directed_pair"."__tag_base_type_directed_pair_v5chnfdlrm" IS 'tag DeclaredValue.baseType = directedPair';

COMMENT ON COLUMN "qti"."declared_value_duration"."__tag_base_type_duration_kk5q7nzzuo" IS 'tag DeclaredValue.baseType = duration';

COMMENT ON COLUMN "qti"."declared_value_file"."__tag_base_type_file_pesir3i32k" IS 'tag DeclaredValue.baseType = file';

COMMENT ON COLUMN "qti"."declared_value_float"."__tag_base_type_float_3szfpoo33f" IS 'tag DeclaredValue.baseType = float';

COMMENT ON COLUMN "qti"."declared_value_identifier"."__tag_base_type_identifier_skvmp74o7n" IS 'tag DeclaredValue.baseType = identifier';

COMMENT ON COLUMN "qti"."declared_value_integer"."__tag_base_type_integer_azuvzqcuvs" IS 'tag DeclaredValue.baseType = integer';

COMMENT ON COLUMN "qti"."declared_value_pair"."__tag_base_type_pair_m6e2ivamry" IS 'tag DeclaredValue.baseType = pair';

COMMENT ON COLUMN "qti"."declared_value_point"."__tag_base_type_point_c2g2yehgpw" IS 'tag DeclaredValue.baseType = point';

COMMENT ON COLUMN "qti"."declared_value_string"."__tag_base_type_string_hs2lnlklfn" IS 'tag DeclaredValue.baseType = string';

COMMENT ON COLUMN "qti"."declared_value_uri"."__tag_base_type_uri_7nvvazwudq" IS 'tag DeclaredValue.baseType = uri';

COMMENT ON COLUMN "qti"."default_value_arm"."__tag_kind_qti_default_value_ectibzonfr" IS 'tag Node.kind = qti-default-value';

COMMENT ON COLUMN "qti"."default_value_arm"."__tag_role_default_st3rg3iau2" IS 'tag ValueSet.role = default';

COMMENT ON COLUMN "qti"."dependency"."__tag_kind_cp_dependency_zkvh26cbdi" IS 'tag Node.kind = cp:dependency';

COMMENT ON COLUMN "qti"."document"."__tag_kind_document_3ilsmwej65" IS 'tag Tree.kind = document';

COMMENT ON COLUMN "qti"."entity_reference"."__tag_kind_entity_ref_vjzwdvldjb" IS 'tag Node.kind = entityRef';

COMMENT ON COLUMN "qti"."file"."__tag_kind_cp_file_lmc4p5hp74" IS 'tag Node.kind = cp:file';

COMMENT ON COLUMN "qti"."img"."__tag_kind_img_i7yel3m6ld" IS 'tag Node.kind = img';

COMMENT ON COLUMN "qti"."interaction_binding"."__tag_kind_response_h34dku2bqb" IS 'tag Declaration.kind = response';

COMMENT ON COLUMN "qti"."item_body"."__tag_kind_qti_item_body_jcju2zecro" IS 'tag Node.kind = qti-item-body';

COMMENT ON COLUMN "qti"."literal_boolean"."__tag_base_type_boolean_4735tuf3vg" IS 'tag Literal.baseType = boolean';

COMMENT ON COLUMN "qti"."literal_directed_pair"."__tag_base_type_directed_pair_g5lmbdounu" IS 'tag Literal.baseType = directedPair';

COMMENT ON COLUMN "qti"."literal_duration"."__tag_base_type_duration_x4kusayrrj" IS 'tag Literal.baseType = duration';

COMMENT ON COLUMN "qti"."literal_file"."__tag_base_type_file_f3nyrmvnuq" IS 'tag Literal.baseType = file';

COMMENT ON COLUMN "qti"."literal_float"."__tag_base_type_float_3yebf7fbld" IS 'tag Literal.baseType = float';

COMMENT ON COLUMN "qti"."literal_identifier"."__tag_base_type_identifier_su3axkpwpi" IS 'tag Literal.baseType = identifier';

COMMENT ON COLUMN "qti"."literal_integer"."__tag_base_type_integer_42hpi675dm" IS 'tag Literal.baseType = integer';

COMMENT ON COLUMN "qti"."literal_pair"."__tag_base_type_pair_j5c4komwfk" IS 'tag Literal.baseType = pair';

COMMENT ON COLUMN "qti"."literal_point"."__tag_base_type_point_vrpib4j3ph" IS 'tag Literal.baseType = point';

COMMENT ON COLUMN "qti"."literal_string"."__tag_base_type_string_3acd7sfocx" IS 'tag Literal.baseType = string';

COMMENT ON COLUMN "qti"."literal_uri"."__tag_base_type_uri_dedabn4vho" IS 'tag Literal.baseType = uri';

COMMENT ON COLUMN "qti"."lom"."__tag_kind_lom_lom_f6hipyl2uh" IS 'tag Node.kind = lom:lom';

COMMENT ON COLUMN "qti"."lom_aggregation_level"."__tag_kind_lom_aggregation_level_nz6q333tpc" IS 'tag Node.kind = lom:aggregationLevel';

COMMENT ON COLUMN "qti"."lom_contribute"."__tag_kind_lom_contribute_df2trhtcwa" IS 'tag Node.kind = lom:contribute';

COMMENT ON COLUMN "qti"."lom_copyright_and_other_restrictions"."__tag_kind_lom_copyright_and_other_restrictions_iumfuc7nd6" IS 'tag Node.kind = lom:copyrightAndOtherRestrictions';

COMMENT ON COLUMN "qti"."lom_cost"."__tag_kind_lom_cost_6szqfkzkkf" IS 'tag Node.kind = lom:cost';

COMMENT ON COLUMN "qti"."lom_coverage"."__tag_kind_lom_coverage_4gxjudfzzd" IS 'tag Node.kind = lom:coverage';

COMMENT ON COLUMN "qti"."lom_date"."__tag_kind_lom_date_w2vdyftvu3" IS 'tag Node.kind = lom:date';

COMMENT ON COLUMN "qti"."lom_date_time"."__tag_kind_lom_date_time_rwc33opc6i" IS 'tag Node.kind = lom:dateTime';

COMMENT ON COLUMN "qti"."lom_description"."__tag_kind_lom_description_fgwqgc6sgl" IS 'tag Node.kind = lom:description';

COMMENT ON COLUMN "qti"."lom_duration"."__tag_kind_lom_duration_iav5iizeai" IS 'tag Node.kind = lom:duration';

COMMENT ON COLUMN "qti"."lom_duration_string"."__tag_kind_lom_duration_string_ijve2g6fui" IS 'tag Node.kind = lom:duration.string';

COMMENT ON COLUMN "qti"."lom_entity"."__tag_kind_lom_entity_ja2pg4zr5e" IS 'tag Node.kind = lom:entity';

COMMENT ON COLUMN "qti"."lom_format"."__tag_kind_lom_format_zjeruunvce" IS 'tag Node.kind = lom:format';

COMMENT ON COLUMN "qti"."lom_general"."__tag_kind_lom_general_kdtvdmn7oa" IS 'tag Node.kind = lom:general';

COMMENT ON COLUMN "qti"."lom_general_title"."__tag_kind_lom_title_acxzzapsiz" IS 'tag Node.kind = lom:title';

COMMENT ON COLUMN "qti"."lom_identifier"."__tag_kind_lom_identifier_zhhp3vq26p" IS 'tag Node.kind = lom:identifier';

COMMENT ON COLUMN "qti"."lom_identifier_catalog"."__tag_kind_lom_catalog_yeeo53s2uf" IS 'tag Node.kind = lom:catalog';

COMMENT ON COLUMN "qti"."lom_identifier_entry"."__tag_kind_lom_entry_z2frivifgf" IS 'tag Node.kind = lom:entry';

COMMENT ON COLUMN "qti"."lom_installation_remarks"."__tag_kind_lom_installation_remarks_6actui7z3e" IS 'tag Node.kind = lom:installationRemarks';

COMMENT ON COLUMN "qti"."lom_keyword"."__tag_kind_lom_keyword_7mdhbpmyak" IS 'tag Node.kind = lom:keyword';

COMMENT ON COLUMN "qti"."lom_language"."__tag_kind_lom_language_umo24qkhua" IS 'tag Node.kind = lom:language';

COMMENT ON COLUMN "qti"."lom_life_cycle"."__tag_kind_lom_life_cycle_v5zcy35q77" IS 'tag Node.kind = lom:lifeCycle';

COMMENT ON COLUMN "qti"."lom_location"."__tag_kind_lom_location_3tcexzxgfh" IS 'tag Node.kind = lom:location';

COMMENT ON COLUMN "qti"."lom_maximum_version"."__tag_kind_lom_maximum_version_anah5x464b" IS 'tag Node.kind = lom:maximumVersion';

COMMENT ON COLUMN "qti"."lom_meta_metadata"."__tag_kind_lom_meta_metadata_z7muqedeoe" IS 'tag Node.kind = lom:metaMetadata';

COMMENT ON COLUMN "qti"."lom_metadataschema"."__tag_kind_lom_metadataschema_kjpxrlzjhx" IS 'tag Node.kind = lom:metadataschema';

COMMENT ON COLUMN "qti"."lom_minimum_version"."__tag_kind_lom_minimum_version_prl3rwqtuc" IS 'tag Node.kind = lom:minimumVersion';

COMMENT ON COLUMN "qti"."lom_name"."__tag_kind_lom_name_ta2c7syhrg" IS 'tag Node.kind = lom:name';

COMMENT ON COLUMN "qti"."lom_or_composite"."__tag_kind_lom_or_composite_hivjg4kbyy" IS 'tag Node.kind = lom:orComposite';

COMMENT ON COLUMN "qti"."lom_other_platform_requirements"."__tag_kind_lom_other_platform_requirements_u6lzfnmyqi" IS 'tag Node.kind = lom:otherPlatformRequirements';

COMMENT ON COLUMN "qti"."lom_requirement"."__tag_kind_lom_requirement_giyfrxir3d" IS 'tag Node.kind = lom:requirement';

COMMENT ON COLUMN "qti"."lom_rights"."__tag_kind_lom_rights_2fcs3c7jc3" IS 'tag Node.kind = lom:rights';

COMMENT ON COLUMN "qti"."lom_role"."__tag_kind_lom_role_mff47g5aja" IS 'tag Node.kind = lom:role';

COMMENT ON COLUMN "qti"."lom_size"."__tag_kind_lom_size_lxvgvtngju" IS 'tag Node.kind = lom:size';

COMMENT ON COLUMN "qti"."lom_source"."__tag_kind_lom_source_2h4d2ilrdk" IS 'tag Node.kind = lom:source';

COMMENT ON COLUMN "qti"."lom_status"."__tag_kind_lom_status_vvuyk32w3f" IS 'tag Node.kind = lom:status';

COMMENT ON COLUMN "qti"."lom_string"."__tag_kind_lom_string_s72bccwbh3" IS 'tag Node.kind = lom:string';

COMMENT ON COLUMN "qti"."lom_structure"."__tag_kind_lom_structure_7zyt26pyt6" IS 'tag Node.kind = lom:structure';

COMMENT ON COLUMN "qti"."lom_technical"."__tag_kind_lom_technical_yobodngzpk" IS 'tag Node.kind = lom:technical';

COMMENT ON COLUMN "qti"."lom_type"."__tag_kind_lom_type_gxwahsvklo" IS 'tag Node.kind = lom:type';

COMMENT ON COLUMN "qti"."lom_value"."__tag_kind_lom_value_rhv3macnym" IS 'tag Node.kind = lom:value';

COMMENT ON COLUMN "qti"."lom_version"."__tag_kind_lom_version_o4inak47bb" IS 'tag Node.kind = lom:version';

COMMENT ON COLUMN "qti"."manifest"."__tag_kind_manifest_s7wedmbljj" IS 'tag Tree.kind = manifest';

COMMENT ON COLUMN "qti"."manifest_lom"."__tag_owner_manifest_rrl26sfdmq" IS 'tag Lom.owner = manifest';

COMMENT ON COLUMN "qti"."manifest_lom"."__tag_kind_cp_metadata_manifest_lxlasjebcx" IS 'tag Node.kind = cp:metadata.manifest';

COMMENT ON COLUMN "qti"."manifest_metadata"."__tag_kind_cp_metadata_manifest_lxlasjebcx" IS 'tag Node.kind = cp:metadata.manifest';

COMMENT ON COLUMN "qti"."manifest_schema"."__tag_kind_cp_schema_wydqdv7nqu" IS 'tag Node.kind = cp:schema';

COMMENT ON COLUMN "qti"."manifest_schema_version"."__tag_kind_cp_schemaversion_b5pisyerct" IS 'tag Node.kind = cp:schemaversion';

COMMENT ON COLUMN "qti"."organizations"."__tag_kind_cp_organizations_io7npeoiga" IS 'tag Node.kind = cp:organizations';

COMMENT ON COLUMN "qti"."outcome_declaration_arm"."__tag_kind_outcome_glkysklooj" IS 'tag Declaration.kind = outcome';

COMMENT ON COLUMN "qti"."outcome_declaration_arm"."__tag_kind_qti_outcome_declaration_pavxgyuva7" IS 'tag Node.kind = qti-outcome-declaration';

COMMENT ON COLUMN "qti"."p"."__tag_kind_p_mm76ho4kjx" IS 'tag Node.kind = p';

COMMENT ON COLUMN "qti"."package"."__tag_kind_cp_manifest_vqajffgjxd" IS 'tag Node.kind = cp:manifest';

COMMENT ON COLUMN "qti"."pi"."__tag_kind_pi_iifj7oyikt" IS 'tag Node.kind = pi';

COMMENT ON COLUMN "qti"."prompt"."__tag_kind_qti_prompt_4i6supq76j" IS 'tag Node.kind = qti-prompt';

COMMENT ON COLUMN "qti"."qmd_composite"."__tag_kind_qmd_composite_sp2gjoeow2" IS 'tag Node.kind = qmd:composite';

COMMENT ON COLUMN "qti"."qmd_custom_type_identifier"."__tag_kind_qmd_custom_type_identifier_6maf4fokd4" IS 'tag Node.kind = qmd:customTypeIdentifier';

COMMENT ON COLUMN "qti"."qmd_feedback_type"."__tag_kind_qmd_feedback_type_i4afuxmkum" IS 'tag Node.kind = qmd:feedbackType';

COMMENT ON COLUMN "qti"."qmd_interaction_kind"."__tag_kind_qmd_interaction_kind_hqx3cimuzu" IS 'tag Node.kind = qmd:interactionKind';

COMMENT ON COLUMN "qti"."qmd_interaction_type"."__tag_kind_qmd_interaction_type_yfu5laontj" IS 'tag Node.kind = qmd:interactionType';

COMMENT ON COLUMN "qti"."qmd_item_template"."__tag_kind_qmd_item_template_qed7bxhx4c" IS 'tag Node.kind = qmd:itemTemplate';

COMMENT ON COLUMN "qti"."qmd_portable_custom_interaction_context"."__tag_kind_qmd_portable_custom_interaction_context_qpozrauewz" IS 'tag Node.kind = qmd:portableCustomInteractionContext';

COMMENT ON COLUMN "qti"."qmd_scoring_mode"."__tag_kind_qmd_scoring_mode_eautyyrud4" IS 'tag Node.kind = qmd:scoringMode';

COMMENT ON COLUMN "qti"."qmd_solution_available"."__tag_kind_qmd_solution_available_2phsdzymgo" IS 'tag Node.kind = qmd:solutionAvailable';

COMMENT ON COLUMN "qti"."qmd_time_dependent"."__tag_kind_qmd_time_dependent_kcomlfhb7l" IS 'tag Node.kind = qmd:timeDependent';

COMMENT ON COLUMN "qti"."qmd_tool_name"."__tag_kind_qmd_tool_name_27iaqneif4" IS 'tag Node.kind = qmd:toolName';

COMMENT ON COLUMN "qti"."qmd_tool_vendor"."__tag_kind_qmd_tool_vendor_q5oz7iuy5a" IS 'tag Node.kind = qmd:toolVendor';

COMMENT ON COLUMN "qti"."qmd_tool_version"."__tag_kind_qmd_tool_version_pnqrau5xa6" IS 'tag Node.kind = qmd:toolVersion';

COMMENT ON COLUMN "qti"."qti_metadata"."__tag_kind_cp_metadata_resource_scp7neoqwd" IS 'tag Node.kind = cp:metadata.resource';

COMMENT ON COLUMN "qti"."qti_metadata"."__tag_kind_qmd_qti_metadata_x6anaifca7" IS 'tag Node.kind = qmd:qtiMetadata';

COMMENT ON COLUMN "qti"."record_binding"."__tag_shape_record_qozhrcs4ym" IS 'tag InteractionBinding.shape = record';

COMMENT ON COLUMN "qti"."record_declaration"."__tag_shape_record_oogx67q33t" IS 'tag Declaration.shape = record';

COMMENT ON COLUMN "qti"."record_field"."__tag_shape_record_3rfzi5mgny" IS 'tag DeclaredValue.shape = record';

COMMENT ON COLUMN "qti"."record_value_set"."__tag_shape_record_lavxfyvieb" IS 'tag ValueSet.shape = record';

COMMENT ON COLUMN "qti"."resource"."__tag_kind_cp_resource_42ghp3dst6" IS 'tag Node.kind = cp:resource';

COMMENT ON COLUMN "qti"."resource_lom"."__tag_owner_resource_r2xv4rjzei" IS 'tag Lom.owner = resource';

COMMENT ON COLUMN "qti"."resource_lom"."__tag_kind_cp_metadata_resource_scp7neoqwd" IS 'tag Node.kind = cp:metadata.resource';

COMMENT ON COLUMN "qti"."resource_metadata"."__tag_kind_cp_metadata_resource_scp7neoqwd" IS 'tag Node.kind = cp:metadata.resource';

COMMENT ON COLUMN "qti"."resources"."__tag_kind_cp_resources_vfmef7qkml" IS 'tag Node.kind = cp:resources';

COMMENT ON COLUMN "qti"."response_declaration_arm"."__tag_kind_response_h34dku2bqb" IS 'tag Declaration.kind = response';

COMMENT ON COLUMN "qti"."response_declaration_arm"."__tag_kind_qti_response_declaration_mnirjlf2bs" IS 'tag Node.kind = qti-response-declaration';

COMMENT ON COLUMN "qti"."response_declaration_id"."__tag_kind_response_h34dku2bqb" IS 'tag Declaration.kind = response';

COMMENT ON COLUMN "qti"."response_declaration_id"."__tag_holder_response_declaration_bgk6jyj7am" IS 'tag DocumentId.holder = responseDeclaration';

COMMENT ON COLUMN "qti"."response_processing"."__tag_kind_qti_response_processing_w7uh2je46r" IS 'tag Node.kind = qti-response-processing';

COMMENT ON COLUMN "qti"."response_processing_item"."__tag_root_kind_item_od6jgyppue" IS 'tag ResponseProcessing.rootKind = item';

COMMENT ON COLUMN "qti"."simple_choice"."__tag_kind_qti_simple_choice_z52ayjzccu" IS 'tag Node.kind = qti-simple-choice';

COMMENT ON COLUMN "qti"."text"."__tag_kind_text_vrxl6g2xzn" IS 'tag Node.kind = text';

COMMENT ON COLUMN "qti"."typed_binding"."__tag_shape_typed_gdmqmo4yqk" IS 'tag InteractionBinding.shape = typed';

COMMENT ON COLUMN "qti"."typed_declaration"."__tag_shape_typed_qnenjfvgbj" IS 'tag Declaration.shape = typed';

COMMENT ON COLUMN "qti"."typed_value_set"."__tag_shape_typed_atyt4o6rfl" IS 'tag ValueSet.shape = typed';

COMMENT ON COLUMN "qti"."ws"."__tag_kind_ws_v2rnjnoedh" IS 'tag Node.kind = ws';

COMMENT ON CONSTRAINT "__assessment_item_fk_id_tag_kind_qti_assessment_item_tb6ofvomqn" ON "qti"."assessment_item" IS 'foreign key AssessmentItem(id, __tag_kind_qti_assessment_item_lutv7awadt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__attribute_entity_reference_fk_node_dmowipcsds" ON "qti"."attribute_entity_reference" IS 'foreign key AttributeEntityReference(node) to Node(id)';

COMMENT ON CONSTRAINT "__attribute_lexical_fk_node_kind_nalamcdh2a" ON "qti"."attribute_lexical" IS 'foreign key AttributeLexical(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__built_in_ref_fk_id_tag_kind_built_in_a_5_gr_6_jz_3_uxqwbgzpu7" ON "qti"."built_in_ref" IS 'foreign key BuiltInRef(id, __tag_kind_built_in_a5gr6jz3gp) to VariableRef(id, kind)';

COMMENT ON CONSTRAINT "__choice_interaction_fk_id_tag_kind_qti_choice_prxl6btdny" ON "qti"."choice_interaction" IS 'foreign key ChoiceInteraction(id, __tag_kind_qti_choice_interaction_lrhq33h2cc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__choice_interaction_fk_id_root_kind_gl3vcjjab4" ON "qti"."choice_interaction" IS 'foreign key ChoiceInteraction(id, rootKind) to Node(id, rootKind)';

COMMENT ON CONSTRAINT "__choice_interaction_max_selections_message_fk_node_ljbdlz5nru" ON "qti"."choice_interaction_max_selections_message" IS 'foreign key ChoiceInteractionMaxSelectionsMessage(node) to ChoiceInteraction(id)';

COMMENT ON CONSTRAINT "__choice_interaction_min_selections_message_fk_node_zvytaotb4p" ON "qti"."choice_interaction_min_selections_message" IS 'foreign key ChoiceInteractionMinSelectionsMessage(node) to ChoiceInteraction(id)';

COMMENT ON CONSTRAINT "__comment_fk_id_tag_kind_comment_nmb_7_feek_53_2tnuqa2fb2" ON "qti"."comment" IS 'foreign key Comment(id, __tag_kind_comment_nmb7feek53) to Node(id, kind)';

COMMENT ON CONSTRAINT "__correct_response_arm_fk_id_tag_kind_qti_correct_cemzm7tt6m" ON "qti"."correct_response_arm" IS 'foreign key CorrectResponseArm(id, __tag_kind_qti_correct_response_y6bjt74uq7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__correct_response_arm_fk_id_tag_role_correct_a_6_k_5fsnfymwai" ON "qti"."correct_response_arm" IS 'foreign key CorrectResponseArm(id, __tag_role_correct_a6k2xxecvb) to ValueSet(id, role)';

COMMENT ON CONSTRAINT "__declaration_fk_id_document_pdsrpobeub" ON "qti"."declaration" IS 'foreign key Declaration(id, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__declaration_external_scored_fk_declaration_bxmjtnregf" ON "qti"."declaration_external_scored" IS 'foreign key DeclarationExternalScored(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declaration_interpretation_fk_declaration_ps6b7rahqa" ON "qti"."declaration_interpretation" IS 'foreign key DeclarationInterpretation(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declaration_long_interpretation_fk_declaration_6esmkzbmky" ON "qti"."declaration_long_interpretation" IS 'foreign key DeclarationLongInterpretation(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declaration_mastery_value_fk_declaration_kznj66n5qv" ON "qti"."declaration_mastery_value" IS 'foreign key DeclarationMasteryValue(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declaration_normal_maximum_fk_declaration_ouqrml32ux" ON "qti"."declaration_normal_maximum" IS 'foreign key DeclarationNormalMaximum(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declaration_normal_minimum_fk_declaration_xpeecehvfd" ON "qti"."declaration_normal_minimum" IS 'foreign key DeclarationNormalMinimum(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declaration_variable_identifier_ref_fk_declaration_ynmg2ojbwh" ON "qti"."declaration_variable_identifier_ref" IS 'foreign key DeclarationVariableIdentifierRef(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declaration_view_fk_declaration_grq4o2auzk" ON "qti"."declaration_view" IS 'foreign key DeclarationView(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__declared_adaptive_fk_node_2ekpm2as3f" ON "qti"."declared_adaptive" IS 'foreign key DeclaredAdaptive(node) to AssessmentItem(id)';

COMMENT ON CONSTRAINT "__declared_fixed_fk_node_azddieafgj" ON "qti"."declared_fixed" IS 'foreign key DeclaredFixed(node) to SimpleChoice(id)';

COMMENT ON CONSTRAINT "__declared_max_choices_fk_node_y7jlgtncxu" ON "qti"."declared_max_choices" IS 'foreign key DeclaredMaxChoices(node) to ChoiceInteraction(id)';

COMMENT ON CONSTRAINT "__declared_min_choices_fk_node_hravvjubmj" ON "qti"."declared_min_choices" IS 'foreign key DeclaredMinChoices(node) to ChoiceInteraction(id)';

COMMENT ON CONSTRAINT "__declared_orientation_fk_node_66p7tw6wgw" ON "qti"."declared_orientation" IS 'foreign key DeclaredOrientation(node) to ChoiceInteraction(id)';

COMMENT ON CONSTRAINT "__declared_ref_fk_document_identifier_o4crlxzv7z" ON "qti"."declared_ref" IS 'foreign key DeclaredRef(document, identifier) to Declaration(document, identifier)';

COMMENT ON CONSTRAINT "__declared_ref_fk_id_tag_kind_declared_chtay_4_st_64_737grlrvxv" ON "qti"."declared_ref" IS 'foreign key DeclaredRef(id, __tag_kind_declared_chtay4st64) to VariableRef(id, kind)';

COMMENT ON CONSTRAINT "__declared_show_hide_fk_node_y7io7lazvc" ON "qti"."declared_show_hide" IS 'foreign key DeclaredShowHide(node) to SimpleChoice(id)';

COMMENT ON CONSTRAINT "__declared_shuffle_fk_node_o4rn4edxva" ON "qti"."declared_shuffle" IS 'foreign key DeclaredShuffle(node) to ChoiceInteraction(id)';

COMMENT ON CONSTRAINT "__declared_value_fk_id_tag_kind_qti_value_a_22_pfhf_jauk5xk5xj" ON "qti"."declared_value" IS 'foreign key DeclaredValue(id, __tag_kind_qti_value_a22pfhf3za) to Node(id, kind)';

COMMENT ON CONSTRAINT "__declared_value_fk_id_value_set_position_vwygqxfi6l" ON "qti"."declared_value" IS 'foreign key DeclaredValue(id, valueSet, position) to Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__declared_value_fk_value_set_shape_xzwb4amgw4" ON "qti"."declared_value" IS 'foreign key DeclaredValue(valueSet, shape) to ValueSet(id, shape)';

COMMENT ON CONSTRAINT "__declared_value_boolean_fk_id_tag_base_type_boolean_x6nluowxw7" ON "qti"."declared_value_boolean" IS 'foreign key DeclaredValueBoolean(id, __tag_base_type_boolean_kh6dvyf44c) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_directed_pair_fk_id_tag_base_type_s66pkuzt37" ON "qti"."declared_value_directed_pair" IS 'foreign key DeclaredValueDirectedPair(id, __tag_base_type_directed_pair_v5chnfdlrm) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_duration_fk_id_tag_base_type_xywa3wenpe" ON "qti"."declared_value_duration" IS 'foreign key DeclaredValueDuration(id, __tag_base_type_duration_kk5q7nzzuo) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_file_fk_id_tag_base_type_file_pesir_f7ctotkmyo" ON "qti"."declared_value_file" IS 'foreign key DeclaredValueFile(id, __tag_base_type_file_pesir3i32k) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_float_fk_id_tag_base_type_float_3_nh3q3iblhm" ON "qti"."declared_value_float" IS 'foreign key DeclaredValueFloat(id, __tag_base_type_float_3szfpoo33f) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_identifier_fk_id_tag_base_type_elcr7q4rl7" ON "qti"."declared_value_identifier" IS 'foreign key DeclaredValueIdentifier(id, __tag_base_type_identifier_skvmp74o7n) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_integer_fk_id_tag_base_type_integer_pk3kvnfdz4" ON "qti"."declared_value_integer" IS 'foreign key DeclaredValueInteger(id, __tag_base_type_integer_azuvzqcuvs) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_pair_fk_id_tag_base_type_pair_m_6_e_hikp7eey3b" ON "qti"."declared_value_pair" IS 'foreign key DeclaredValuePair(id, __tag_base_type_pair_m6e2ivamry) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_point_fk_id_tag_base_type_point_c_2_jykv3lgoe2" ON "qti"."declared_value_point" IS 'foreign key DeclaredValuePoint(id, __tag_base_type_point_c2g2yehgpw) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_string_fk_id_tag_base_type_string_3jrhsa7n4m" ON "qti"."declared_value_string" IS 'foreign key DeclaredValueString(id, __tag_base_type_string_hs2lnlklfn) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__declared_value_uri_fk_id_tag_base_type_uri_7_62m5ydt7xt" ON "qti"."declared_value_uri" IS 'foreign key DeclaredValueUri(id, __tag_base_type_uri_7nvvazwudq) to DeclaredValue(id, baseType)';

COMMENT ON CONSTRAINT "__default_value_arm_fk_id_tag_kind_qti_default_value_xhc5veob6w" ON "qti"."default_value_arm" IS 'foreign key DefaultValueArm(id, __tag_kind_qti_default_value_ectibzonfr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__default_value_arm_fk_id_tag_role_default_st_3_rg_3_lmb42endeu" ON "qti"."default_value_arm" IS 'foreign key DefaultValueArm(id, __tag_role_default_st3rg3iau2) to ValueSet(id, role)';

COMMENT ON CONSTRAINT "__dependency_fk_id_tag_kind_cp_dependency_zkvh_26_wnnn5r3xed" ON "qti"."dependency" IS 'foreign key Dependency(id, __tag_kind_cp_dependency_zkvh26cbdi) to Node(id, kind)';

COMMENT ON CONSTRAINT "__dependency_fk_id_package_cbnscsch6q" ON "qti"."dependency" IS 'foreign key Dependency(id, package) to Node(id, tree)';

COMMENT ON CONSTRAINT "__dependency_fk_package_resource_mszunxanb6" ON "qti"."dependency" IS 'foreign key Dependency(package, resource) to Resource(package, identifier)';

COMMENT ON CONSTRAINT "__dependency_fk_package_target_bi3d2qvhiq" ON "qti"."dependency" IS 'foreign key Dependency(package, target) to Resource(package, identifier)';

COMMENT ON CONSTRAINT "__document_fk_id_tag_kind_document_3_ilsmwej_65_dazgvbo74c" ON "qti"."document" IS 'foreign key Document(id, __tag_kind_document_3ilsmwej65) to Tree(id, kind)';

COMMENT ON CONSTRAINT "__document_fk_id_version_root_i36v6ovq5m" ON "qti"."document" IS 'foreign key Document(id, version, root) to Tree(id, version, root)';

COMMENT ON CONSTRAINT "__document_fk_package_path_4tuuhnqkls" ON "qti"."document" IS 'foreign key Document(package, path) to PackageEntry(package, path)';

COMMENT ON CONSTRAINT "__document_fk_package_resource_7mq3hcy5mi" ON "qti"."document" IS 'foreign key Document(package, resource) to Resource(package, identifier)';

COMMENT ON CONSTRAINT "__document_fk_package_resource_resource_type_ysuyluweu3" ON "qti"."document" IS 'foreign key Document(package, resource, resourceType) to Resource(package, identifier, type)';

COMMENT ON CONSTRAINT "__document_fk_package_version_eu6wa6vo6k" ON "qti"."document" IS 'foreign key Document(package, version) to Package(id, schemaversion)';

COMMENT ON CONSTRAINT "__document_fk_resource_type_root_5efvxdghx6" ON "qti"."document" IS 'foreign key Document(resourceType, root) to RootOfType(type, root)';

COMMENT ON CONSTRAINT "__document_id_fk_document_ufpi2unt5l" ON "qti"."document_id" IS 'foreign key DocumentId(document) to Document(id)';

COMMENT ON CONSTRAINT "__document_identifier_fk_document_package_resource_jwndwc6bku" ON "qti"."document_identifier" IS 'foreign key DocumentIdentifier(document, package, resource, root) to Document(id, package, resource, root)';

COMMENT ON CONSTRAINT "__document_title_fk_document_package_resource_root_jhvo3sglgq" ON "qti"."document_title" IS 'foreign key DocumentTitle(document, package, resource, root) to Document(id, package, resource, root)';

COMMENT ON CONSTRAINT "__edge_fk_child_tree_version_child_kind_addtg4tokv" ON "qti"."edge" IS 'foreign key Edge(child, tree, version, childKind) to Node(id, tree, version, kind)';

COMMENT ON CONSTRAINT "__edge_fk_parent_tree_version_parent_kind_v7ynxlx4m6" ON "qti"."edge" IS 'foreign key Edge(parent, tree, version, parentKind) to Node(id, tree, version, kind)';

COMMENT ON CONSTRAINT "__edge_fk_version_parent_kind_child_kind_3g237kcsl6" ON "qti"."edge" IS 'foreign key Edge(version, parentKind, childKind) to Admission(version, parent, child)';

COMMENT ON CONSTRAINT "__entity_reference_fk_id_tag_kind_entity_ref_dhfdm5v4z3" ON "qti"."entity_reference" IS 'foreign key EntityReference(id, __tag_kind_entity_ref_vjzwdvldjb) to Node(id, kind)';

COMMENT ON CONSTRAINT "__expression_fk_id_document_kind_fwcnepbw3e" ON "qti"."expression" IS 'foreign key Expression(id, document, kind) to Node(id, tree, kind)';

COMMENT ON CONSTRAINT "__file_fk_id_tag_kind_cp_file_lmc_4_p_5_hp_74_k5m33baabe" ON "qti"."file" IS 'foreign key File(id, __tag_kind_cp_file_lmc4p5hp74) to Node(id, kind)';

COMMENT ON CONSTRAINT "__file_fk_id_resource_position_er7we6b2by" ON "qti"."file" IS 'foreign key File(id, resource, position) to Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__file_fk_package_href_ycd4s7qtk3" ON "qti"."file" IS 'foreign key File(package, href) to PackageEntry(package, path)';

COMMENT ON CONSTRAINT "__file_fk_resource_package_nkqadixour" ON "qti"."file" IS 'foreign key File(resource, package) to Resource(id, package)';

COMMENT ON CONSTRAINT "__file_content_fk_package_path_nfk4i2vf5j" ON "qti"."file_content" IS 'foreign key FileContent(package, path) to PackageEntry(package, path)';

COMMENT ON CONSTRAINT "__img_fk_id_tag_kind_img_i_7_yel_3_m_6_ld_jmhphj53q5" ON "qti"."img" IS 'foreign key Img(id, __tag_kind_img_i7yel3m6ld) to Node(id, kind)';

COMMENT ON CONSTRAINT "__img_height_fk_node_ms33zlenv7" ON "qti"."img_height" IS 'foreign key ImgHeight(node) to Img(id)';

COMMENT ON CONSTRAINT "__img_longdesc_fk_node_y4lwafy67d" ON "qti"."img_longdesc" IS 'foreign key ImgLongdesc(node) to Img(id)';

COMMENT ON CONSTRAINT "__img_width_fk_node_h2rn2uti4n" ON "qti"."img_width" IS 'foreign key ImgWidth(node) to Img(id)';

COMMENT ON CONSTRAINT "__interaction_binding_fk_document_response_d5b6agd3yq" ON "qti"."interaction_binding" IS 'foreign key InteractionBinding(document, responseIdentifier, __tag_kind_response_h34dku2bqb) to Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__interaction_binding_fk_document_response_5zpazi3say" ON "qti"."interaction_binding" IS 'foreign key InteractionBinding(document, responseIdentifier, shape) to Declaration(document, identifier, shape)';

COMMENT ON CONSTRAINT "__interaction_binding_fk_node_document_interaction_3rgydma4v2" ON "qti"."interaction_binding" IS 'foreign key InteractionBinding(node, document, interactionKind) to Node(id, tree, kind)';

COMMENT ON CONSTRAINT "__item_body_fk_id_tag_kind_qti_item_body_jcju_2_47smepwucf" ON "qti"."item_body" IS 'foreign key ItemBody(id, __tag_kind_qti_item_body_jcju2zecro) to Node(id, kind)';

COMMENT ON CONSTRAINT "__item_body_fk_id_item_eyzw7eb2oe" ON "qti"."item_body" IS 'foreign key ItemBody(id, item) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__literal_fk_id_bejzcmox5h" ON "qti"."literal" IS 'foreign key Literal(id) to Expression(id)';

COMMENT ON CONSTRAINT "__literal_boolean_fk_id_tag_base_type_boolean_4735_4myj62jp3d" ON "qti"."literal_boolean" IS 'foreign key LiteralBoolean(id, __tag_base_type_boolean_4735tuf3vg) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_directed_pair_fk_id_tag_base_type_directed_gwg4wthbw7" ON "qti"."literal_directed_pair" IS 'foreign key LiteralDirectedPair(id, __tag_base_type_directed_pair_g5lmbdounu) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_duration_fk_id_tag_base_type_duration_x_4_lbgynv7vln" ON "qti"."literal_duration" IS 'foreign key LiteralDuration(id, __tag_base_type_duration_x4kusayrrj) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_file_fk_id_tag_base_type_file_f_3_nyrmvnuq_gntznale5u" ON "qti"."literal_file" IS 'foreign key LiteralFile(id, __tag_base_type_file_f3nyrmvnuq) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_float_fk_id_tag_base_type_float_3_yebf_7_kv56wpv5vt" ON "qti"."literal_float" IS 'foreign key LiteralFloat(id, __tag_base_type_float_3yebf7fbld) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_identifier_fk_id_tag_base_type_identifier_r66k3na6ph" ON "qti"."literal_identifier" IS 'foreign key LiteralIdentifier(id, __tag_base_type_identifier_su3axkpwpi) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_integer_fk_id_tag_base_type_integer_42_hpi_fhexpvem2f" ON "qti"."literal_integer" IS 'foreign key LiteralInteger(id, __tag_base_type_integer_42hpi675dm) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_pair_fk_id_tag_base_type_pair_j_5_c_4_5n2tcec7hs" ON "qti"."literal_pair" IS 'foreign key LiteralPair(id, __tag_base_type_pair_j5c4komwfk) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_point_fk_id_tag_base_type_point_vrpib_4_j_mtxacunnh2" ON "qti"."literal_point" IS 'foreign key LiteralPoint(id, __tag_base_type_point_vrpib4j3ph) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_string_fk_id_tag_base_type_string_3_acd_7_bsbjfi6uy7" ON "qti"."literal_string" IS 'foreign key LiteralString(id, __tag_base_type_string_3acd7sfocx) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__literal_uri_fk_id_tag_base_type_uri_dedabn_4_vho_opebmm36hg" ON "qti"."literal_uri" IS 'foreign key LiteralUri(id, __tag_base_type_uri_dedabn4vho) to Literal(id, baseType)';

COMMENT ON CONSTRAINT "__lom_fk_id_tag_kind_lom_lom_f_6_hipyl_2_uh_bz6un6sdnw" ON "qti"."lom" IS 'foreign key Lom(id, __tag_kind_lom_lom_f6hipyl2uh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_fk_id_package_d6xf5t5xkg" ON "qti"."lom" IS 'foreign key Lom(id, package) to Node(id, tree)';

COMMENT ON CONSTRAINT "__lom_aggregation_level_fk_id_tag_kind_lom_whlaput7np" ON "qti"."lom_aggregation_level" IS 'foreign key LomAggregationLevel(id, __tag_kind_lom_aggregation_level_nz6q333tpc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_aggregation_level_fk_lom_bv6km72pzq" ON "qti"."lom_aggregation_level" IS 'foreign key LomAggregationLevel(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_contribute_fk_id_tag_kind_lom_contribute_df_2_7rpcq7mxt2" ON "qti"."lom_contribute" IS 'foreign key LomContribute(id, __tag_kind_lom_contribute_df2trhtcwa) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_contribute_fk_id_parent_azdg5nrcbj" ON "qti"."lom_contribute" IS 'foreign key LomContribute(id, parent) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_contribute_fk_id_position_anrlpze2a6" ON "qti"."lom_contribute" IS 'foreign key LomContribute(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_contribute_fk_lom_xet4pxcqbo" ON "qti"."lom_contribute" IS 'foreign key LomContribute(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_copyright_and_other_restrictions_fk_id_tag_674dg4oy6o" ON "qti"."lom_copyright_and_other_restrictions" IS 'foreign key LomCopyrightAndOtherRestrictions(id, __tag_kind_lom_copyright_and_other_restrictions_iumfuc7nd6) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_copyright_and_other_restrictions_fk_id_rights_t2r4pp36py" ON "qti"."lom_copyright_and_other_restrictions" IS 'foreign key LomCopyrightAndOtherRestrictions(id, rights) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_copyright_and_other_restrictions_fk_lom_2eyn5uf3yv" ON "qti"."lom_copyright_and_other_restrictions" IS 'foreign key LomCopyrightAndOtherRestrictions(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_cost_fk_id_tag_kind_lom_cost_6_szqfkzkkf_23zskd6km7" ON "qti"."lom_cost" IS 'foreign key LomCost(id, __tag_kind_lom_cost_6szqfkzkkf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_cost_fk_id_rights_qspq7ohb4b" ON "qti"."lom_cost" IS 'foreign key LomCost(id, rights) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_cost_fk_lom_wflrpcbp5c" ON "qti"."lom_cost" IS 'foreign key LomCost(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_coverage_fk_id_tag_kind_lom_coverage_4_eywvbqgq6w" ON "qti"."lom_coverage" IS 'foreign key LomCoverage(id, __tag_kind_lom_coverage_4gxjudfzzd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_coverage_fk_lom_sdgsgwwmry" ON "qti"."lom_coverage" IS 'foreign key LomCoverage(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_date_fk_id_tag_kind_lom_date_w_2_vdyftvu_3_dohk4pi2cr" ON "qti"."lom_date" IS 'foreign key LomDate(id, __tag_kind_lom_date_w2vdyftvu3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_date_fk_id_contribute_rdgokm4ivk" ON "qti"."lom_date" IS 'foreign key LomDate(id, contribute) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_date_fk_lom_pg6czotexk" ON "qti"."lom_date" IS 'foreign key LomDate(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_date_time_fk_id_tag_kind_lom_date_time_rwc_33_6hsukamghe" ON "qti"."lom_date_time" IS 'foreign key LomDateTime(id, __tag_kind_lom_date_time_rwc33opc6i) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_date_time_fk_id_date_twmqij6thy" ON "qti"."lom_date_time" IS 'foreign key LomDateTime(id, date) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_date_time_fk_lom_57lwwhv3j3" ON "qti"."lom_date_time" IS 'foreign key LomDateTime(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_description_fk_id_tag_kind_lom_description_rf5lxo4ary" ON "qti"."lom_description" IS 'foreign key LomDescription(id, __tag_kind_lom_description_fgwqgc6sgl) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_description_fk_lom_fskniocyns" ON "qti"."lom_description" IS 'foreign key LomDescription(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_duration_fk_id_tag_kind_lom_duration_iav_5_iznkpng5qz" ON "qti"."lom_duration" IS 'foreign key LomDuration(id, __tag_kind_lom_duration_iav5iizeai) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_duration_fk_id_technical_na4zhuhr2o" ON "qti"."lom_duration" IS 'foreign key LomDuration(id, technical) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_duration_fk_lom_7mahss6ctn" ON "qti"."lom_duration" IS 'foreign key LomDuration(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_duration_string_fk_id_tag_kind_lom_duration_xdrnlvqqvg" ON "qti"."lom_duration_string" IS 'foreign key LomDurationString(id, __tag_kind_lom_duration_string_ijve2g6fui) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_duration_string_fk_id_duration_e4sg3lhowz" ON "qti"."lom_duration_string" IS 'foreign key LomDurationString(id, duration) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_duration_string_fk_lom_dhbyhlqylo" ON "qti"."lom_duration_string" IS 'foreign key LomDurationString(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_entity_fk_id_tag_kind_lom_entity_ja_2_pg_4_zr_ptcquakojw" ON "qti"."lom_entity" IS 'foreign key LomEntity(id, __tag_kind_lom_entity_ja2pg4zr5e) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_entity_fk_id_contribute_r6ecje37rr" ON "qti"."lom_entity" IS 'foreign key LomEntity(id, contribute) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_entity_fk_id_position_tkckn2awlf" ON "qti"."lom_entity" IS 'foreign key LomEntity(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_entity_fk_lom_iku6rztwyh" ON "qti"."lom_entity" IS 'foreign key LomEntity(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_format_fk_id_tag_kind_lom_format_zjeruunvce_c3w7xdh64r" ON "qti"."lom_format" IS 'foreign key LomFormat(id, __tag_kind_lom_format_zjeruunvce) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_format_fk_id_position_xeaahl3cte" ON "qti"."lom_format" IS 'foreign key LomFormat(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_format_fk_id_technical_itq4yc3ebb" ON "qti"."lom_format" IS 'foreign key LomFormat(id, technical) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_format_fk_lom_kvxpepk4uj" ON "qti"."lom_format" IS 'foreign key LomFormat(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_general_fk_id_tag_kind_lom_general_kdtvdmn_7_vdkmh6scgo" ON "qti"."lom_general" IS 'foreign key LomGeneral(id, __tag_kind_lom_general_kdtvdmn7oa) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_general_fk_lom_si32sc6scb" ON "qti"."lom_general" IS 'foreign key LomGeneral(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_general_title_fk_id_tag_kind_lom_title_jr4y2w4pqy" ON "qti"."lom_general_title" IS 'foreign key LomGeneralTitle(id, __tag_kind_lom_title_acxzzapsiz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_general_title_fk_lom_owner_sufevcrymo" ON "qti"."lom_general_title" IS 'foreign key LomGeneralTitle(lom, owner) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__lom_identifier_fk_id_tag_kind_lom_identifier_zhhp_azlnipzw4a" ON "qti"."lom_identifier" IS 'foreign key LomIdentifier(id, __tag_kind_lom_identifier_zhhp3vq26p) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_identifier_fk_id_position_nbqr2amaal" ON "qti"."lom_identifier" IS 'foreign key LomIdentifier(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_identifier_fk_lom_owner_7ppq3a6qxr" ON "qti"."lom_identifier" IS 'foreign key LomIdentifier(lom, owner) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__lom_identifier_catalog_fk_id_tag_kind_lom_catalog_6hfzamzc7d" ON "qti"."lom_identifier_catalog" IS 'foreign key LomIdentifierCatalog(id, __tag_kind_lom_catalog_yeeo53s2uf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_identifier_catalog_fk_id_identifier_26rxzb7n44" ON "qti"."lom_identifier_catalog" IS 'foreign key LomIdentifierCatalog(id, identifier) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_identifier_catalog_fk_lom_owner_mvqepvvndf" ON "qti"."lom_identifier_catalog" IS 'foreign key LomIdentifierCatalog(lom, owner) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__lom_identifier_catalog_fk_lom_position_pa3s54vugg" ON "qti"."lom_identifier_catalog" IS 'foreign key LomIdentifierCatalog(lom, position) to LomIdentifier(lom, position)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_fk_id_tag_kind_lom_entry_z_2_l75xmxt3kd" ON "qti"."lom_identifier_entry" IS 'foreign key LomIdentifierEntry(id, __tag_kind_lom_entry_z2frivifgf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_fk_id_identifier_pxcobfxgo6" ON "qti"."lom_identifier_entry" IS 'foreign key LomIdentifierEntry(id, identifier) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_fk_lom_owner_yz7zl3s77l" ON "qti"."lom_identifier_entry" IS 'foreign key LomIdentifierEntry(lom, owner) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_fk_lom_position_egoqmumcjs" ON "qti"."lom_identifier_entry" IS 'foreign key LomIdentifierEntry(lom, position) to LomIdentifier(lom, position)';

COMMENT ON CONSTRAINT "__lom_installation_remarks_fk_id_tag_kind_lom_ww27inllwj" ON "qti"."lom_installation_remarks" IS 'foreign key LomInstallationRemarks(id, __tag_kind_lom_installation_remarks_6actui7z3e) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_installation_remarks_fk_id_technical_g77yyfu5bk" ON "qti"."lom_installation_remarks" IS 'foreign key LomInstallationRemarks(id, technical) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_installation_remarks_fk_lom_i776nbzk4n" ON "qti"."lom_installation_remarks" IS 'foreign key LomInstallationRemarks(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_keyword_fk_id_tag_kind_lom_keyword_7_mdhbpmyak_66kpjugviq" ON "qti"."lom_keyword" IS 'foreign key LomKeyword(id, __tag_kind_lom_keyword_7mdhbpmyak) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_keyword_fk_lom_qa3ryhoecq" ON "qti"."lom_keyword" IS 'foreign key LomKeyword(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_language_fk_id_tag_kind_lom_language_umo_24_ebp2bvszn4" ON "qti"."lom_language" IS 'foreign key LomLanguage(id, __tag_kind_lom_language_umo24qkhua) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_language_fk_id_position_7hf5mv3uq6" ON "qti"."lom_language" IS 'foreign key LomLanguage(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_language_fk_lom_7hxs4cmxlz" ON "qti"."lom_language" IS 'foreign key LomLanguage(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_life_cycle_fk_id_tag_kind_lom_life_cycle_v_5_k73jlrfy56" ON "qti"."lom_life_cycle" IS 'foreign key LomLifeCycle(id, __tag_kind_lom_life_cycle_v5zcy35q77) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_life_cycle_fk_lom_yejqs4n4pv" ON "qti"."lom_life_cycle" IS 'foreign key LomLifeCycle(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_location_fk_id_tag_kind_lom_location_3_4kpuqcn6oz" ON "qti"."lom_location" IS 'foreign key LomLocation(id, __tag_kind_lom_location_3tcexzxgfh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_location_fk_id_position_bdje3mxzpc" ON "qti"."lom_location" IS 'foreign key LomLocation(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_location_fk_id_technical_4m3blt4uw7" ON "qti"."lom_location" IS 'foreign key LomLocation(id, technical) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_location_fk_lom_4o7q6h3llc" ON "qti"."lom_location" IS 'foreign key LomLocation(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_maximum_version_fk_id_tag_kind_lom_maximum_nsm3qgub3j" ON "qti"."lom_maximum_version" IS 'foreign key LomMaximumVersion(id, __tag_kind_lom_maximum_version_anah5x464b) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_maximum_version_fk_id_or_composite_3zkqflygdl" ON "qti"."lom_maximum_version" IS 'foreign key LomMaximumVersion(id, orComposite) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_maximum_version_fk_lom_rb6t2quj3i" ON "qti"."lom_maximum_version" IS 'foreign key LomMaximumVersion(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_meta_metadata_fk_id_tag_kind_lom_meta_metadata_globm7frj7" ON "qti"."lom_meta_metadata" IS 'foreign key LomMetaMetadata(id, __tag_kind_lom_meta_metadata_z7muqedeoe) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_meta_metadata_fk_lom_x2hpctp7aw" ON "qti"."lom_meta_metadata" IS 'foreign key LomMetaMetadata(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_metadataschema_fk_id_tag_kind_lom_ue4jxpqynq" ON "qti"."lom_metadataschema" IS 'foreign key LomMetadataschema(id, __tag_kind_lom_metadataschema_kjpxrlzjhx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_metadataschema_fk_id_meta_metadata_523sbhi6t6" ON "qti"."lom_metadataschema" IS 'foreign key LomMetadataschema(id, metaMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_metadataschema_fk_id_position_n4wwt3fdvx" ON "qti"."lom_metadataschema" IS 'foreign key LomMetadataschema(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_metadataschema_fk_lom_t6kwhxajdg" ON "qti"."lom_metadataschema" IS 'foreign key LomMetadataschema(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_minimum_version_fk_id_tag_kind_lom_minimum_ucb2ck63ug" ON "qti"."lom_minimum_version" IS 'foreign key LomMinimumVersion(id, __tag_kind_lom_minimum_version_prl3rwqtuc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_minimum_version_fk_id_or_composite_fmhozeoprj" ON "qti"."lom_minimum_version" IS 'foreign key LomMinimumVersion(id, orComposite) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_minimum_version_fk_lom_ge6recni3p" ON "qti"."lom_minimum_version" IS 'foreign key LomMinimumVersion(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_name_fk_id_tag_kind_lom_name_ta_2_c_7_syhrg_m7vxpjven6" ON "qti"."lom_name" IS 'foreign key LomName(id, __tag_kind_lom_name_ta2c7syhrg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_name_fk_id_or_composite_uldc7fa66v" ON "qti"."lom_name" IS 'foreign key LomName(id, orComposite) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_name_fk_lom_rrgxp2dfyn" ON "qti"."lom_name" IS 'foreign key LomName(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_object_identifier_fk_lom_package_resource_type_z7kymlx7md" ON "qti"."lom_object_identifier" IS 'foreign key LomObjectIdentifier(lom, package, resource, type) to ResourceLomIdentified(lom, package, resource, type)';

COMMENT ON CONSTRAINT "__lom_object_identifier_fk_lom_position_collapsed_jelttyi4kl" ON "qti"."lom_object_identifier" IS 'foreign key LomObjectIdentifier(lom, position, collapsed) to LomIdentifierEntry(lom, position, collapsed)';

COMMENT ON CONSTRAINT "__lom_object_identifier_fk_package_resource_ggz2gyu5bk" ON "qti"."lom_object_identifier" IS 'foreign key LomObjectIdentifier(package, resource, collapsed) to DocumentIdentifier(package, resource, value)';

COMMENT ON CONSTRAINT "__lom_object_title_fk_lom_package_resource_type_rjk5h4sxdc" ON "qti"."lom_object_title" IS 'foreign key LomObjectTitle(lom, package, resource, type) to ResourceLomTitled(lom, package, resource, type)';

COMMENT ON CONSTRAINT "__lom_object_title_fk_lom_position_collapsed_45znyzcxnu" ON "qti"."lom_object_title" IS 'foreign key LomObjectTitle(lom, position, collapsed) to LomTitle(lom, position, collapsed)';

COMMENT ON CONSTRAINT "__lom_object_title_fk_package_resource_collapsed_4eqo3tv4fi" ON "qti"."lom_object_title" IS 'foreign key LomObjectTitle(package, resource, collapsed) to DocumentTitle(package, resource, collapsed)';

COMMENT ON CONSTRAINT "__lom_or_composite_fk_id_tag_kind_lom_or_composite_7ce3hso5cy" ON "qti"."lom_or_composite" IS 'foreign key LomOrComposite(id, __tag_kind_lom_or_composite_hivjg4kbyy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_or_composite_fk_id_position_5r4kzrw6am" ON "qti"."lom_or_composite" IS 'foreign key LomOrComposite(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_or_composite_fk_id_requirement_bnqtdcvais" ON "qti"."lom_or_composite" IS 'foreign key LomOrComposite(id, requirement) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_or_composite_fk_lom_wjxfsgy4f2" ON "qti"."lom_or_composite" IS 'foreign key LomOrComposite(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_other_platform_requirements_fk_id_tag_kind_lom_d2uneiz6lx" ON "qti"."lom_other_platform_requirements" IS 'foreign key LomOtherPlatformRequirements(id, __tag_kind_lom_other_platform_requirements_u6lzfnmyqi) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_other_platform_requirements_fk_id_technical_qazogkhd55" ON "qti"."lom_other_platform_requirements" IS 'foreign key LomOtherPlatformRequirements(id, technical) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_other_platform_requirements_fk_lom_zvqps66ffy" ON "qti"."lom_other_platform_requirements" IS 'foreign key LomOtherPlatformRequirements(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_requirement_fk_id_tag_kind_lom_requirement_nfadn3cyem" ON "qti"."lom_requirement" IS 'foreign key LomRequirement(id, __tag_kind_lom_requirement_giyfrxir3d) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_requirement_fk_id_position_vugvji5ewc" ON "qti"."lom_requirement" IS 'foreign key LomRequirement(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_requirement_fk_id_technical_z5utcb23yp" ON "qti"."lom_requirement" IS 'foreign key LomRequirement(id, technical) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_requirement_fk_lom_micqxebrwb" ON "qti"."lom_requirement" IS 'foreign key LomRequirement(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_rights_fk_id_tag_kind_lom_rights_2_fcs_3_c_7_2bx2lvxqbi" ON "qti"."lom_rights" IS 'foreign key LomRights(id, __tag_kind_lom_rights_2fcs3c7jc3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_rights_fk_lom_yz7vcplc3r" ON "qti"."lom_rights" IS 'foreign key LomRights(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_role_fk_id_tag_kind_lom_role_mff_47_g_5_aja_lw24d6m3vn" ON "qti"."lom_role" IS 'foreign key LomRole(id, __tag_kind_lom_role_mff47g5aja) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_role_fk_id_contribute_pblcscwxcp" ON "qti"."lom_role" IS 'foreign key LomRole(id, contribute) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_role_fk_lom_mhaq6h6hjy" ON "qti"."lom_role" IS 'foreign key LomRole(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_size_fk_id_tag_kind_lom_size_lxvgvtngju_7db3jsoefd" ON "qti"."lom_size" IS 'foreign key LomSize(id, __tag_kind_lom_size_lxvgvtngju) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_size_fk_id_technical_s3a7qj7jeq" ON "qti"."lom_size" IS 'foreign key LomSize(id, technical) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_size_fk_lom_3slqvedexx" ON "qti"."lom_size" IS 'foreign key LomSize(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_source_fk_id_tag_kind_lom_source_2_h_4_d_2_oofbgs4mub" ON "qti"."lom_source" IS 'foreign key LomSource(id, __tag_kind_lom_source_2h4d2ilrdk) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_status_fk_id_tag_kind_lom_status_vvuyk_32_w_3_ehlua2tnpr" ON "qti"."lom_status" IS 'foreign key LomStatus(id, __tag_kind_lom_status_vvuyk32w3f) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_status_fk_id_life_cycle_u3d4fcmxhx" ON "qti"."lom_status" IS 'foreign key LomStatus(id, lifeCycle) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_status_fk_lom_jdj5c7e4l2" ON "qti"."lom_status" IS 'foreign key LomStatus(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_string_fk_id_tag_kind_lom_string_s_72_bccwbh_3_is2lj6hc2y" ON "qti"."lom_string" IS 'foreign key LomString(id, __tag_kind_lom_string_s72bccwbh3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_string_language_fk_node_56hhggldpq" ON "qti"."lom_string_language" IS 'foreign key LomStringLanguage(node) to LomString(id)';

COMMENT ON CONSTRAINT "__lom_structure_fk_id_tag_kind_lom_structure_7_zyt_pdjqzi3jue" ON "qti"."lom_structure" IS 'foreign key LomStructure(id, __tag_kind_lom_structure_7zyt26pyt6) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_structure_fk_lom_uh7zsbgbgz" ON "qti"."lom_structure" IS 'foreign key LomStructure(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_technical_fk_id_tag_kind_lom_technical_6zvnm5bwg3" ON "qti"."lom_technical" IS 'foreign key LomTechnical(id, __tag_kind_lom_technical_yobodngzpk) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_technical_fk_lom_xvuznblomi" ON "qti"."lom_technical" IS 'foreign key LomTechnical(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_title_fk_id_position_e4eoi76yyj" ON "qti"."lom_title" IS 'foreign key LomTitle(id, position) to Edge(child, position)';

COMMENT ON CONSTRAINT "__lom_title_fk_id_value_collapsed_tbloyxeasb" ON "qti"."lom_title" IS 'foreign key LomTitle(id, value, collapsed) to LomString(id, value, collapsed)';

COMMENT ON CONSTRAINT "__lom_title_fk_lom_owner_jyifashk6t" ON "qti"."lom_title" IS 'foreign key LomTitle(lom, owner) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__lom_type_fk_id_tag_kind_lom_type_gxwahsvklo_cfzouoexzc" ON "qti"."lom_type" IS 'foreign key LomType(id, __tag_kind_lom_type_gxwahsvklo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_type_fk_id_or_composite_lxutp3jajs" ON "qti"."lom_type" IS 'foreign key LomType(id, orComposite) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_type_fk_lom_2amb2kaljt" ON "qti"."lom_type" IS 'foreign key LomType(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_value_fk_id_tag_kind_lom_value_rhv_3_macnym_izneuoby3s" ON "qti"."lom_value" IS 'foreign key LomValue(id, __tag_kind_lom_value_rhv3macnym) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_version_fk_id_tag_kind_lom_version_o_4_inak_47_lhuqp5xp4w" ON "qti"."lom_version" IS 'foreign key LomVersion(id, __tag_kind_lom_version_o4inak47bb) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_version_fk_id_life_cycle_ktsfyp4drx" ON "qti"."lom_version" IS 'foreign key LomVersion(id, lifeCycle) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_version_fk_lom_m5ko4nzlsu" ON "qti"."lom_version" IS 'foreign key LomVersion(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__manifest_fk_id_3ausivvy2g" ON "qti"."manifest" IS 'foreign key Manifest(id) to Package(id)';

COMMENT ON CONSTRAINT "__manifest_fk_id_tag_kind_manifest_s_7_wedmbljj_ujghxp6a5t" ON "qti"."manifest" IS 'foreign key Manifest(id, __tag_kind_manifest_s7wedmbljj) to Tree(id, kind)';

COMMENT ON CONSTRAINT "__manifest_lom_fk_lom_tag_owner_manifest_rrl_26_lf5zw3hdgk" ON "qti"."manifest_lom" IS 'foreign key ManifestLom(lom, __tag_owner_manifest_rrl26sfdmq) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__manifest_lom_fk_lom_metadata_exz2q367yy" ON "qti"."manifest_lom" IS 'foreign key ManifestLom(lom, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__manifest_lom_fk_lom_package_mqfnkg5gyu" ON "qti"."manifest_lom" IS 'foreign key ManifestLom(lom, package) to Lom(id, package)';

COMMENT ON CONSTRAINT "__manifest_lom_fk_metadata_tag_kind_cp_metadata_j5ubrgqjeh" ON "qti"."manifest_lom" IS 'foreign key ManifestLom(metadata, __tag_kind_cp_metadata_manifest_lxlasjebcx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__manifest_metadata_fk_id_tag_kind_cp_metadata_fe72riq7my" ON "qti"."manifest_metadata" IS 'foreign key ManifestMetadata(id, __tag_kind_cp_metadata_manifest_lxlasjebcx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__manifest_metadata_fk_id_manifest_jimqgxh5is" ON "qti"."manifest_metadata" IS 'foreign key ManifestMetadata(id, manifest) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__manifest_metadata_fk_manifest_4jgh6ftqug" ON "qti"."manifest_metadata" IS 'foreign key ManifestMetadata(manifest) to Package(id)';

COMMENT ON CONSTRAINT "__manifest_schema_fk_id_tag_kind_cp_schema_wydqdv_7_palxkyuh46" ON "qti"."manifest_schema" IS 'foreign key ManifestSchema(id, __tag_kind_cp_schema_wydqdv7nqu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__manifest_schema_fk_id_metadata_pandrdslwh" ON "qti"."manifest_schema" IS 'foreign key ManifestSchema(id, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__manifest_schema_fk_metadata_fs4pmegkrc" ON "qti"."manifest_schema" IS 'foreign key ManifestSchema(metadata) to ManifestMetadata(id)';

COMMENT ON CONSTRAINT "__manifest_schema_version_fk_id_tag_kind_cp_73wpzhbjjc" ON "qti"."manifest_schema_version" IS 'foreign key ManifestSchemaVersion(id, __tag_kind_cp_schemaversion_b5pisyerct) to Node(id, kind)';

COMMENT ON CONSTRAINT "__manifest_schema_version_fk_id_metadata_wgpbnfvr2w" ON "qti"."manifest_schema_version" IS 'foreign key ManifestSchemaVersion(id, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__manifest_schema_version_fk_metadata_qnzzhkogjs" ON "qti"."manifest_schema_version" IS 'foreign key ManifestSchemaVersion(metadata) to ManifestMetadata(id)';

COMMENT ON CONSTRAINT "__namespace_declaration_fk_node_3d3hbes2yn" ON "qti"."namespace_declaration" IS 'foreign key NamespaceDeclaration(node) to Node(id)';

COMMENT ON CONSTRAINT "__node_fk_tree_version_root_kind_zpi2yvq4yw" ON "qti"."node" IS 'foreign key Node(tree, version, rootKind) to Tree(id, version, root)';

COMMENT ON CONSTRAINT "__operand_fk_child_esvwbv5qvw" ON "qti"."operand" IS 'foreign key Operand(child) to Expression(id)';

COMMENT ON CONSTRAINT "__operand_fk_expression_j6slibtu5a" ON "qti"."operand" IS 'foreign key Operand(expression) to Expression(id)';

COMMENT ON CONSTRAINT "__organizations_fk_id_tag_kind_cp_organizations_io_7_db7fzjtwu2" ON "qti"."organizations" IS 'foreign key Organizations(id, __tag_kind_cp_organizations_io7npeoiga) to Node(id, kind)';

COMMENT ON CONSTRAINT "__organizations_fk_id_manifest_tri2qkyb2l" ON "qti"."organizations" IS 'foreign key Organizations(id, manifest) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__organizations_fk_manifest_fb7sc7ale2" ON "qti"."organizations" IS 'foreign key Organizations(manifest) to Package(id)';

COMMENT ON CONSTRAINT "__outcome_declaration_arm_fk_id_tag_kind_outcome_22chhrzgof" ON "qti"."outcome_declaration_arm" IS 'foreign key OutcomeDeclarationArm(id, __tag_kind_outcome_glkysklooj) to Declaration(id, kind)';

COMMENT ON CONSTRAINT "__outcome_declaration_arm_fk_id_tag_kind_qti_outcome_wgdpfrnmwl" ON "qti"."outcome_declaration_arm" IS 'foreign key OutcomeDeclarationArm(id, __tag_kind_qti_outcome_declaration_pavxgyuva7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__p_fk_id_tag_kind_p_mm_76_ho_4_kjx_btiv6c7hco" ON "qti"."p" IS 'foreign key P(id, __tag_kind_p_mm76ho4kjx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__package_fk_id_qkk3hvg5u6" ON "qti"."package" IS 'foreign key Package(id) to Manifest(id)';

COMMENT ON CONSTRAINT "__package_fk_id_tag_kind_cp_manifest_vqajffgjxd_4fjgrvwawo" ON "qti"."package" IS 'foreign key Package(id, __tag_kind_cp_manifest_vqajffgjxd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__package_entry_fk_package_3f4tbft6yj" ON "qti"."package_entry" IS 'foreign key PackageEntry(package) to Package(id)';

COMMENT ON CONSTRAINT "__pi_fk_id_tag_kind_pi_iifj_7_oyikt_rmzkyimkem" ON "qti"."pi" IS 'foreign key Pi(id, __tag_kind_pi_iifj7oyikt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__prompt_fk_id_tag_kind_qti_prompt_4_i_6_supq_76_j_e3luwmtdtl" ON "qti"."prompt" IS 'foreign key Prompt(id, __tag_kind_qti_prompt_4i6supq76j) to Node(id, kind)';

COMMENT ON CONSTRAINT "__prompt_fk_id_parent_yuyejxedmn" ON "qti"."prompt" IS 'foreign key Prompt(id, parent) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_composite_fk_id_tag_kind_qmd_composite_sp_2_w7goerpcuq" ON "qti"."qmd_composite" IS 'foreign key QmdComposite(id, __tag_kind_qmd_composite_sp2gjoeow2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_composite_fk_id_qti_metadata_rltqut3omc" ON "qti"."qmd_composite" IS 'foreign key QmdComposite(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_custom_type_identifier_fk_id_tag_kind_qmd_juhianhcwa" ON "qti"."qmd_custom_type_identifier" IS 'foreign key QmdCustomTypeIdentifier(id, __tag_kind_qmd_custom_type_identifier_6maf4fokd4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_custom_type_identifier_fk_id_context_gba6i6a6uk" ON "qti"."qmd_custom_type_identifier" IS 'foreign key QmdCustomTypeIdentifier(id, context) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_feedback_type_fk_id_tag_kind_qmd_feedback_type_gqyhcryw34" ON "qti"."qmd_feedback_type" IS 'foreign key QmdFeedbackType(id, __tag_kind_qmd_feedback_type_i4afuxmkum) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_feedback_type_fk_id_qti_metadata_epakzlvve2" ON "qti"."qmd_feedback_type" IS 'foreign key QmdFeedbackType(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_interaction_kind_fk_id_tag_kind_qmd_khrgw6ttuv" ON "qti"."qmd_interaction_kind" IS 'foreign key QmdInteractionKind(id, __tag_kind_qmd_interaction_kind_hqx3cimuzu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_interaction_kind_fk_id_context_7jpeebird6" ON "qti"."qmd_interaction_kind" IS 'foreign key QmdInteractionKind(id, context) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_interaction_type_fk_id_tag_kind_qmd_ry22iea4su" ON "qti"."qmd_interaction_type" IS 'foreign key QmdInteractionType(id, __tag_kind_qmd_interaction_type_yfu5laontj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_interaction_type_fk_id_qti_metadata_ybgt6st54k" ON "qti"."qmd_interaction_type" IS 'foreign key QmdInteractionType(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_item_template_fk_id_tag_kind_qmd_item_template_lnwilcyl2j" ON "qti"."qmd_item_template" IS 'foreign key QmdItemTemplate(id, __tag_kind_qmd_item_template_qed7bxhx4c) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_item_template_fk_id_qti_metadata_76urwcvj3t" ON "qti"."qmd_item_template" IS 'foreign key QmdItemTemplate(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_portable_custom_interaction_context_fk_id_tag_u27enhz75w" ON "qti"."qmd_portable_custom_interaction_context" IS 'foreign key QmdPortableCustomInteractionContext(id, __tag_kind_qmd_portable_custom_interaction_context_qpozrauewz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_portable_custom_interaction_context_fk_id_qti_tql6iasbh2" ON "qti"."qmd_portable_custom_interaction_context" IS 'foreign key QmdPortableCustomInteractionContext(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_scoring_mode_fk_id_tag_kind_qmd_scoring_mode_yn3ythnjwy" ON "qti"."qmd_scoring_mode" IS 'foreign key QmdScoringMode(id, __tag_kind_qmd_scoring_mode_eautyyrud4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_scoring_mode_fk_id_qti_metadata_52k3fctbf2" ON "qti"."qmd_scoring_mode" IS 'foreign key QmdScoringMode(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_solution_available_fk_id_tag_kind_qmd_solution_hwti37e5ul" ON "qti"."qmd_solution_available" IS 'foreign key QmdSolutionAvailable(id, __tag_kind_qmd_solution_available_2phsdzymgo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_solution_available_fk_id_qti_metadata_exg2b4t6mu" ON "qti"."qmd_solution_available" IS 'foreign key QmdSolutionAvailable(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_time_dependent_fk_id_tag_kind_qmd_time_5jynlam4no" ON "qti"."qmd_time_dependent" IS 'foreign key QmdTimeDependent(id, __tag_kind_qmd_time_dependent_kcomlfhb7l) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_time_dependent_fk_id_qti_metadata_ve4pocydcn" ON "qti"."qmd_time_dependent" IS 'foreign key QmdTimeDependent(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_tool_name_fk_id_tag_kind_qmd_tool_name_27_erzxutcz6a" ON "qti"."qmd_tool_name" IS 'foreign key QmdToolName(id, __tag_kind_qmd_tool_name_27iaqneif4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_tool_name_fk_id_qti_metadata_5nme7u6a3p" ON "qti"."qmd_tool_name" IS 'foreign key QmdToolName(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_tool_vendor_fk_id_tag_kind_qmd_tool_vendor_q_5_dwa53iimkv" ON "qti"."qmd_tool_vendor" IS 'foreign key QmdToolVendor(id, __tag_kind_qmd_tool_vendor_q5oz7iuy5a) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_tool_vendor_fk_id_qti_metadata_b3kcfvtqeh" ON "qti"."qmd_tool_vendor" IS 'foreign key QmdToolVendor(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qmd_tool_version_fk_id_tag_kind_qmd_tool_version_gwzwtlwzze" ON "qti"."qmd_tool_version" IS 'foreign key QmdToolVersion(id, __tag_kind_qmd_tool_version_pnqrau5xa6) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qmd_tool_version_fk_id_qti_metadata_5qhf4jnj4e" ON "qti"."qmd_tool_version" IS 'foreign key QmdToolVersion(id, qtiMetadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qti_metadata_fk_id_tag_kind_qmd_qti_metadata_x_6_6z2za3iios" ON "qti"."qti_metadata" IS 'foreign key QtiMetadata(id, __tag_kind_qmd_qti_metadata_x6anaifca7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qti_metadata_fk_id_metadata_sjj6dojrsg" ON "qti"."qti_metadata" IS 'foreign key QtiMetadata(id, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qti_metadata_fk_metadata_tag_kind_cp_metadata_qzc3ba74y7" ON "qti"."qti_metadata" IS 'foreign key QtiMetadata(metadata, __tag_kind_cp_metadata_resource_scp7neoqwd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__qti_metadata_fk_resource_y2rrzblzav" ON "qti"."qti_metadata" IS 'foreign key QtiMetadata(resource) to Resource(id)';

COMMENT ON CONSTRAINT "__record_binding_fk_node_tag_shape_record_qozhrcs_4_3ry2ahdbqe" ON "qti"."record_binding" IS 'foreign key RecordBinding(node, __tag_shape_record_qozhrcs4ym) to InteractionBinding(node, shape)';

COMMENT ON CONSTRAINT "__record_declaration_fk_id_tag_shape_record_oogx_67_xesz66xh77" ON "qti"."record_declaration" IS 'foreign key RecordDeclaration(id, __tag_shape_record_oogx67q33t) to Declaration(id, shape)';

COMMENT ON CONSTRAINT "__record_field_fk_id_tag_shape_record_3_rfzi_5_mgny_ubwuszlite" ON "qti"."record_field" IS 'foreign key RecordField(id, __tag_shape_record_3rfzi5mgny) to DeclaredValue(id, shape)';

COMMENT ON CONSTRAINT "__record_value_set_fk_id_tag_shape_record_lavxfyvieb_qortsgqn3b" ON "qti"."record_value_set" IS 'foreign key RecordValueSet(id, __tag_shape_record_lavxfyvieb) to ValueSet(id, shape)';

COMMENT ON CONSTRAINT "__resource_fk_id_tag_kind_cp_resource_42_ghp_3_dst_6_w3frun75ds" ON "qti"."resource" IS 'foreign key Resource(id, __tag_kind_cp_resource_42ghp3dst6) to Node(id, kind)';

COMMENT ON CONSTRAINT "__resource_fk_id_package_lgzh24zzew" ON "qti"."resource" IS 'foreign key Resource(id, package) to Node(id, tree)';

COMMENT ON CONSTRAINT "__resource_fk_package_ibohlw6rop" ON "qti"."resource" IS 'foreign key Resource(package) to Package(id)';

COMMENT ON CONSTRAINT "__resource_fk_package_version_cq22wjnaos" ON "qti"."resource" IS 'foreign key Resource(package, version) to Package(id, schemaversion)';

COMMENT ON CONSTRAINT "__resource_fk_version_type_t5numxxnax" ON "qti"."resource" IS 'foreign key Resource(version, type) to ResourceTypeOf(version, type)';

COMMENT ON CONSTRAINT "__resource_href_fk_resource_package_2n5d27l5ex" ON "qti"."resource_href" IS 'foreign key ResourceHref(resource, package) to Resource(id, package)';

COMMENT ON CONSTRAINT "__resource_lom_fk_lom_tag_owner_resource_r_2_xv_4_ps3p3dlhni" ON "qti"."resource_lom" IS 'foreign key ResourceLom(lom, __tag_owner_resource_r2xv4rjzei) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__resource_lom_fk_lom_metadata_tstiovefp3" ON "qti"."resource_lom" IS 'foreign key ResourceLom(lom, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__resource_lom_fk_lom_package_axqj54t764" ON "qti"."resource_lom" IS 'foreign key ResourceLom(lom, package) to Lom(id, package)';

COMMENT ON CONSTRAINT "__resource_lom_fk_metadata_tag_kind_cp_metadata_ldfoygvkhx" ON "qti"."resource_lom" IS 'foreign key ResourceLom(metadata, __tag_kind_cp_metadata_resource_scp7neoqwd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__resource_lom_fk_package_resource_type_cfijxypydp" ON "qti"."resource_lom" IS 'foreign key ResourceLom(package, resource, type) to Resource(package, identifier, type)';

COMMENT ON CONSTRAINT "__resource_lom_identified_fk_lom_package_resource_zy2pnxrsq6" ON "qti"."resource_lom_identified" IS 'foreign key ResourceLomIdentified(lom, package, resource, type) to ResourceLom(lom, package, resource, type)';

COMMENT ON CONSTRAINT "__resource_lom_titled_fk_lom_package_resource_type_j6w2vbwkpm" ON "qti"."resource_lom_titled" IS 'foreign key ResourceLomTitled(lom, package, resource, type) to ResourceLom(lom, package, resource, type)';

COMMENT ON CONSTRAINT "__resource_metadata_fk_id_tag_kind_cp_metadata_knszm4kknw" ON "qti"."resource_metadata" IS 'foreign key ResourceMetadata(id, __tag_kind_cp_metadata_resource_scp7neoqwd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__resource_metadata_fk_id_resource_w5ujkigusd" ON "qti"."resource_metadata" IS 'foreign key ResourceMetadata(id, resource) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__resource_metadata_fk_resource_3dfpd32tkn" ON "qti"."resource_metadata" IS 'foreign key ResourceMetadata(resource) to Resource(id)';

COMMENT ON CONSTRAINT "__resources_fk_id_tag_kind_cp_resources_vfmef_7_qkml_zg6bbsyilf" ON "qti"."resources" IS 'foreign key Resources(id, __tag_kind_cp_resources_vfmef7qkml) to Node(id, kind)';

COMMENT ON CONSTRAINT "__resources_fk_id_manifest_7jnjdqsavb" ON "qti"."resources" IS 'foreign key Resources(id, manifest) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__resources_fk_manifest_2czsykboj3" ON "qti"."resources" IS 'foreign key Resources(manifest) to Package(id)';

COMMENT ON CONSTRAINT "__response_declaration_arm_fk_id_tag_kind_qti_f4xiuadvs7" ON "qti"."response_declaration_arm" IS 'foreign key ResponseDeclarationArm(id, __tag_kind_qti_response_declaration_mnirjlf2bs) to Node(id, kind)';

COMMENT ON CONSTRAINT "__response_declaration_arm_fk_id_tag_kind_response_h_3liyki26gd" ON "qti"."response_declaration_arm" IS 'foreign key ResponseDeclarationArm(id, __tag_kind_response_h34dku2bqb) to Declaration(id, kind)';

COMMENT ON CONSTRAINT "__response_declaration_id_fk_document_id_tag_holder_i4txfimhl4" ON "qti"."response_declaration_id" IS 'foreign key ResponseDeclarationId(document, id, __tag_holder_response_declaration_bgk6jyj7am) to DocumentId(document, id, holder)';

COMMENT ON CONSTRAINT "__response_declaration_id_fk_node_document_id_tag_4wjysgnaca" ON "qti"."response_declaration_id" IS 'foreign key ResponseDeclarationId(node, document, id, __tag_kind_response_h34dku2bqb) to Declaration(id, document, identifier, kind)';

COMMENT ON CONSTRAINT "__response_processing_fk_id_tag_kind_qti_response_qon4wlz6ge" ON "qti"."response_processing" IS 'foreign key ResponseProcessing(id, __tag_kind_qti_response_processing_w7uh2je46r) to Node(id, kind)';

COMMENT ON CONSTRAINT "__response_processing_fk_id_root_kind_5ongdtogaj" ON "qti"."response_processing" IS 'foreign key ResponseProcessing(id, rootKind) to Node(id, rootKind)';

COMMENT ON CONSTRAINT "__response_processing_item_fk_id_tag_root_kind_item_nkqao7pvho" ON "qti"."response_processing_item" IS 'foreign key ResponseProcessingItem(id, __tag_root_kind_item_od6jgyppue) to ResponseProcessing(id, rootKind)';

COMMENT ON CONSTRAINT "__response_processing_item_fk_id_item_bsskbx5lby" ON "qti"."response_processing_item" IS 'foreign key ResponseProcessingItem(id, item) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__response_processing_item_fk_item_7c5mz5zc7w" ON "qti"."response_processing_item" IS 'foreign key ResponseProcessingItem(item) to AssessmentItem(id)';

COMMENT ON CONSTRAINT "__response_processing_template_fk_node_b45d5c65om" ON "qti"."response_processing_template" IS 'foreign key ResponseProcessingTemplate(node) to ResponseProcessing(id)';

COMMENT ON CONSTRAINT "__response_processing_template_location_fk_node_jfjndrc6xk" ON "qti"."response_processing_template_location" IS 'foreign key ResponseProcessingTemplateLocation(node) to ResponseProcessing(id)';

COMMENT ON CONSTRAINT "__schema_location_fk_node_o4jcb2f2aj" ON "qti"."schema_location" IS 'foreign key SchemaLocation(node) to Node(id)';

COMMENT ON CONSTRAINT "__simple_choice_fk_id_tag_kind_qti_simple_choice_z_ylt3oa5b4p" ON "qti"."simple_choice" IS 'foreign key SimpleChoice(id, __tag_kind_qti_simple_choice_z52ayjzccu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__simple_choice_fk_id_interaction_vf43rkjowe" ON "qti"."simple_choice" IS 'foreign key SimpleChoice(id, interaction) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__simple_choice_template_identifier_fk_node_dtixe7cfvf" ON "qti"."simple_choice_template_identifier" IS 'foreign key SimpleChoiceTemplateIdentifier(node) to SimpleChoice(id)';

COMMENT ON CONSTRAINT "__standard_template_reference_fk_node_um7etzu6k3" ON "qti"."standard_template_reference" IS 'foreign key StandardTemplateReference(node) to ResponseProcessingTemplate(node)';

COMMENT ON CONSTRAINT "__text_fk_id_tag_kind_text_vrxl_6_g_2_xzn_3b3tvgxovp" ON "qti"."text" IS 'foreign key Text(id, __tag_kind_text_vrxl6g2xzn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__tree_fk_id_ifxa72pndo" ON "qti"."tree" IS 'foreign key Tree(id) to TreeRoot(tree)';

COMMENT ON CONSTRAINT "__tree_doctype_fk_tree_js3v4oc2mb" ON "qti"."tree_doctype" IS 'foreign key TreeDoctype(tree) to Tree(id)';

COMMENT ON CONSTRAINT "__tree_export_charset_fk_tree_6nskdfos2j" ON "qti"."tree_export_charset" IS 'foreign key TreeExportCharset(tree) to Tree(id)';

COMMENT ON CONSTRAINT "__tree_misc_fk_tree_7layckvwjj" ON "qti"."tree_misc" IS 'foreign key TreeMisc(tree) to Tree(id)';

COMMENT ON CONSTRAINT "__tree_root_fk_node_tree_grmsgvpo4e" ON "qti"."tree_root" IS 'foreign key TreeRoot(node, tree) to Node(id, tree)';

COMMENT ON CONSTRAINT "__tree_root_fk_tree_f56cdfpty2" ON "qti"."tree_root" IS 'foreign key TreeRoot(tree) to Tree(id)';

COMMENT ON CONSTRAINT "__tree_xml_encoding_fk_tree_7h2ox5njoy" ON "qti"."tree_xml_encoding" IS 'foreign key TreeXmlEncoding(tree) to Tree(id)';

COMMENT ON CONSTRAINT "__tree_xml_standalone_fk_tree_7jbo3bffyy" ON "qti"."tree_xml_standalone" IS 'foreign key TreeXmlStandalone(tree) to Tree(id)';

COMMENT ON CONSTRAINT "__tree_xml_version_fk_tree_jew3d6jxfx" ON "qti"."tree_xml_version" IS 'foreign key TreeXmlVersion(tree) to Tree(id)';

COMMENT ON CONSTRAINT "__typed_binding_fk_document_response_identifier_base_5ucjatxedk" ON "qti"."typed_binding" IS 'foreign key TypedBinding(document, responseIdentifier, baseType, cardinality) to TypedDeclaration(document, identifier, baseType, cardinality)';

COMMENT ON CONSTRAINT "__typed_binding_fk_interaction_kind_base_type_bblgyhj6xh" ON "qti"."typed_binding" IS 'foreign key TypedBinding(interactionKind, baseType, cardinality) to BindingFit(interactionKind, baseType, cardinality)';

COMMENT ON CONSTRAINT "__typed_binding_fk_node_tag_shape_typed_gdmqmo_4_yqk_2bdrcbrgzj" ON "qti"."typed_binding" IS 'foreign key TypedBinding(node, __tag_shape_typed_gdmqmo4yqk) to InteractionBinding(node, shape)';

COMMENT ON CONSTRAINT "__typed_declaration_fk_id_tag_shape_typed_qnenjfvgbj_e6j6tjzg52" ON "qti"."typed_declaration" IS 'foreign key TypedDeclaration(id, __tag_shape_typed_qnenjfvgbj) to Declaration(id, shape)';

COMMENT ON CONSTRAINT "__typed_declaration_fk_id_document_identifier_6d4fics7jb" ON "qti"."typed_declaration" IS 'foreign key TypedDeclaration(id, document, identifier) to Declaration(id, document, identifier)';

COMMENT ON CONSTRAINT "__typed_value_set_fk_declaration_base_type_yxpne76buw" ON "qti"."typed_value_set" IS 'foreign key TypedValueSet(declaration, baseType, cardinality) to TypedDeclaration(id, baseType, cardinality)';

COMMENT ON CONSTRAINT "__typed_value_set_fk_id_tag_shape_typed_atyt_4_o_6_gfidjsnbow" ON "qti"."typed_value_set" IS 'foreign key TypedValueSet(id, __tag_shape_typed_atyt4o6rfl) to ValueSet(id, shape)';

COMMENT ON CONSTRAINT "__typed_value_set_fk_id_declaration_wjla6dmxga" ON "qti"."typed_value_set" IS 'foreign key TypedValueSet(id, declaration) to ValueSet(id, declaration)';

COMMENT ON CONSTRAINT "__value_set_fk_declaration_shape_hldjke3uzi" ON "qti"."value_set" IS 'foreign key ValueSet(declaration, shape) to Declaration(id, shape)';

COMMENT ON CONSTRAINT "__value_set_fk_id_declaration_5nufpikaia" ON "qti"."value_set" IS 'foreign key ValueSet(id, declaration) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__value_set_interpretation_fk_value_set_5ttk24ay2k" ON "qti"."value_set_interpretation" IS 'foreign key ValueSetInterpretation(valueSet) to ValueSet(id)';

COMMENT ON CONSTRAINT "__variable_ref_fk_id_document_jnexkah4is" ON "qti"."variable_ref" IS 'foreign key VariableRef(id, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__ws_fk_id_tag_kind_ws_v_2_rnjnoedh_z7flyfbov6" ON "qti"."ws" IS 'foreign key Ws(id, __tag_kind_ws_v2rnjnoedh) to Node(id, kind)';

COMMENT ON INDEX "qti"."__lom_general_title_key_lom_jlcfowoam5" IS 'unique index LomGeneralTitle(lom)';

COMMENT ON INDEX "qti"."__manifest_metadata_key_manifest_2ntkwgdgmn" IS 'unique index ManifestMetadata(manifest)';

COMMENT ON INDEX "qti"."__manifest_schema_key_metadata_qazxuynlsp" IS 'unique index ManifestSchema(metadata)';

COMMENT ON INDEX "qti"."__manifest_schema_version_key_metadata_f6e5tc2dqq" IS 'unique index ManifestSchemaVersion(metadata)';

COMMENT ON INDEX "qti"."__organizations_key_manifest_myqunp6c5p" IS 'unique index Organizations(manifest)';

COMMENT ON INDEX "qti"."__resources_key_manifest_v3e3achdnh" IS 'unique index Resources(manifest)';

COMMENT ON INDEX "qti"."__attribute_lexical_ix_node_kind_hwyadhp4if" IS 'btree index AttributeLexical(node, kind)';

COMMENT ON INDEX "qti"."__declared_ref_ix_document_identifier_4nsnfmfyel" IS 'btree index DeclaredRef(document, identifier)';

COMMENT ON INDEX "qti"."__declared_value_ix_value_set_base_type_zitbtn6nwa" IS 'btree index DeclaredValue(valueSet, baseType)';

COMMENT ON INDEX "qti"."__declared_value_ix_value_set_shape_zegpafstry" IS 'btree index DeclaredValue(valueSet, shape)';

COMMENT ON INDEX "qti"."__dependency_ix_package_resource_k7yvrhb5p6" IS 'btree index Dependency(package, resource)';

COMMENT ON INDEX "qti"."__dependency_ix_package_target_irvksks4il" IS 'btree index Dependency(package, target)';

COMMENT ON INDEX "qti"."__document_ix_package_version_2zrptn52fq" IS 'btree index Document(package, version)';

COMMENT ON INDEX "qti"."__document_ix_resource_type_root_krtmo7mbrt" IS 'btree index Document(resourceType, root)';

COMMENT ON INDEX "qti"."__edge_ix_parent_tree_version_parent_kind_rncqfqwmf2" IS 'btree index Edge(parent, tree, version, parentKind)';

COMMENT ON INDEX "qti"."__edge_ix_version_parent_kind_child_kind_2tg4zz3a7o" IS 'btree index Edge(version, parentKind, childKind)';

COMMENT ON INDEX "qti"."__file_ix_package_href_vgnf3xnans" IS 'btree index File(package, href)';

COMMENT ON INDEX "qti"."__file_ix_resource_3lt2t6uxt3" IS 'btree index File(resource)';

COMMENT ON INDEX "qti"."__lom_aggregation_level_ix_lom_crtqoeboje" IS 'btree index LomAggregationLevel(lom)';

COMMENT ON INDEX "qti"."__lom_contribute_ix_lom_wom4wgkdxk" IS 'btree index LomContribute(lom)';

COMMENT ON INDEX "qti"."__lom_copyright_and_other_restrictions_ix_lom_sfpdyjfpb2" IS 'btree index LomCopyrightAndOtherRestrictions(lom)';

COMMENT ON INDEX "qti"."__lom_cost_ix_lom_xhsvj33rgy" IS 'btree index LomCost(lom)';

COMMENT ON INDEX "qti"."__lom_coverage_ix_lom_txnrszdfo3" IS 'btree index LomCoverage(lom)';

COMMENT ON INDEX "qti"."__lom_date_ix_lom_aqs5sp5tv7" IS 'btree index LomDate(lom)';

COMMENT ON INDEX "qti"."__lom_date_time_ix_lom_n4aroup2ei" IS 'btree index LomDateTime(lom)';

COMMENT ON INDEX "qti"."__lom_description_ix_lom_vnyonuegvg" IS 'btree index LomDescription(lom)';

COMMENT ON INDEX "qti"."__lom_duration_ix_lom_pheyxyu47i" IS 'btree index LomDuration(lom)';

COMMENT ON INDEX "qti"."__lom_duration_string_ix_lom_ktf56bgpmh" IS 'btree index LomDurationString(lom)';

COMMENT ON INDEX "qti"."__lom_entity_ix_lom_n2l5ake4in" IS 'btree index LomEntity(lom)';

COMMENT ON INDEX "qti"."__lom_format_ix_lom_7qax32efgp" IS 'btree index LomFormat(lom)';

COMMENT ON INDEX "qti"."__lom_identifier_ix_lom_owner_wzkf734f4v" IS 'btree index LomIdentifier(lom, owner)';

COMMENT ON INDEX "qti"."__lom_identifier_catalog_ix_lom_owner_ucyua7radl" IS 'btree index LomIdentifierCatalog(lom, owner)';

COMMENT ON INDEX "qti"."__lom_identifier_catalog_ix_lom_position_wgnkpa3owk" IS 'btree index LomIdentifierCatalog(lom, position)';

COMMENT ON INDEX "qti"."__lom_identifier_entry_ix_lom_owner_su645mpz6h" IS 'btree index LomIdentifierEntry(lom, owner)';

COMMENT ON INDEX "qti"."__lom_installation_remarks_ix_lom_qjvmsukpm5" IS 'btree index LomInstallationRemarks(lom)';

COMMENT ON INDEX "qti"."__lom_keyword_ix_lom_gu2t5sxzd7" IS 'btree index LomKeyword(lom)';

COMMENT ON INDEX "qti"."__lom_language_ix_lom_r6g2pzfink" IS 'btree index LomLanguage(lom)';

COMMENT ON INDEX "qti"."__lom_location_ix_lom_ha5vcr722n" IS 'btree index LomLocation(lom)';

COMMENT ON INDEX "qti"."__lom_maximum_version_ix_lom_sxkgn27yw5" IS 'btree index LomMaximumVersion(lom)';

COMMENT ON INDEX "qti"."__lom_metadataschema_ix_lom_fxwgialmzq" IS 'btree index LomMetadataschema(lom)';

COMMENT ON INDEX "qti"."__lom_minimum_version_ix_lom_fnuw2hzfka" IS 'btree index LomMinimumVersion(lom)';

COMMENT ON INDEX "qti"."__lom_name_ix_lom_j3tsm6s3w7" IS 'btree index LomName(lom)';

COMMENT ON INDEX "qti"."__lom_object_identifier_ix_package_resource_fvyo7vsxtk" IS 'btree index LomObjectIdentifier(package, resource, collapsed)';

COMMENT ON INDEX "qti"."__lom_object_title_ix_package_resource_collapsed_mctzzsj7mu" IS 'btree index LomObjectTitle(package, resource, collapsed)';

COMMENT ON INDEX "qti"."__lom_or_composite_ix_lom_y24ycko4jv" IS 'btree index LomOrComposite(lom)';

COMMENT ON INDEX "qti"."__lom_other_platform_requirements_ix_lom_lz5kv6b6lf" IS 'btree index LomOtherPlatformRequirements(lom)';

COMMENT ON INDEX "qti"."__lom_requirement_ix_lom_d3iex7gu7u" IS 'btree index LomRequirement(lom)';

COMMENT ON INDEX "qti"."__lom_role_ix_lom_bsi3n32r2b" IS 'btree index LomRole(lom)';

COMMENT ON INDEX "qti"."__lom_size_ix_lom_6itjjvkq3e" IS 'btree index LomSize(lom)';

COMMENT ON INDEX "qti"."__lom_status_ix_lom_emiyxi6m22" IS 'btree index LomStatus(lom)';

COMMENT ON INDEX "qti"."__lom_structure_ix_lom_6u7wnpggrk" IS 'btree index LomStructure(lom)';

COMMENT ON INDEX "qti"."__lom_title_ix_lom_owner_zggm6lanqk" IS 'btree index LomTitle(lom, owner)';

COMMENT ON INDEX "qti"."__lom_type_ix_lom_6y3cbtt2b6" IS 'btree index LomType(lom)';

COMMENT ON INDEX "qti"."__lom_version_ix_lom_5vgccnw4wo" IS 'btree index LomVersion(lom)';

COMMENT ON INDEX "qti"."__manifest_lom_ix_metadata_x76b6ms7vy" IS 'btree index ManifestLom(metadata)';

COMMENT ON INDEX "qti"."__node_ix_tree_version_root_kind_midgktllgy" IS 'btree index Node(tree, version, rootKind)';

COMMENT ON INDEX "qti"."__qti_metadata_ix_metadata_pxk5ddkomg" IS 'btree index QtiMetadata(metadata)';

COMMENT ON INDEX "qti"."__resource_ix_package_version_wqz6pkayka" IS 'btree index Resource(package, version)';

COMMENT ON INDEX "qti"."__resource_ix_version_type_5nf4p4seqz" IS 'btree index Resource(version, type)';

COMMENT ON INDEX "qti"."__resource_lom_ix_metadata_vavjihmzwx" IS 'btree index ResourceLom(metadata)';

COMMENT ON INDEX "qti"."__typed_binding_ix_document_response_identifier_base_ywuawwudab" IS 'btree index TypedBinding(document, responseIdentifier, baseType, cardinality)';

COMMENT ON INDEX "qti"."__typed_binding_ix_interaction_kind_base_type_f63zbhy6nz" IS 'btree index TypedBinding(interactionKind, baseType, cardinality)';

COMMENT ON INDEX "qti"."__typed_value_set_ix_declaration_base_type_zpsvrx2gkw" IS 'btree index TypedValueSet(declaration, baseType, cardinality)';

COMMENT ON INDEX "qti"."__value_set_ix_declaration_shape_2ttql7vose" IS 'btree index ValueSet(declaration, shape)';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5skm7kkgib" ON "qti"."assessment_item" IS 'trigger of law alternatives of Node.kind on AssessmentItem';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_3bicjdpx43" ON "qti"."built_in_ref" IS 'trigger of law alternatives of VariableRef.kind on BuiltInRef';

COMMENT ON TRIGGER "__law_node_kind_alternatives_upkyeydjz7" ON "qti"."choice_interaction" IS 'trigger of law alternatives of Node.kind on ChoiceInteraction';

COMMENT ON TRIGGER "__law_choice_interaction_capacity_simple_choice_b7ijoktz6e" ON "qti"."choice_interaction" IS 'trigger of law capacity of ChoiceInteraction(id) over SimpleChoice(interaction) within 1..* on ChoiceInteraction';

COMMENT ON TRIGGER "__law_choice_interaction_root_kind_item_in_5nlrgqujyl" ON "qti"."choice_interaction" IS 'trigger of law ChoiceInteraction(id, responseIdentifier) where rootKind = item in InteractionBinding(node, responseIdentifier) on ChoiceInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_py43thbsit" ON "qti"."comment" IS 'trigger of law alternatives of Node.kind on Comment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ikfqexnafy" ON "qti"."correct_response_arm" IS 'trigger of law alternatives of Node.kind on CorrectResponseArm';

COMMENT ON TRIGGER "__law_value_set_role_correct_in_correct_response_arm_hdxmdgxtza" ON "qti"."correct_response_arm" IS 'trigger of law ValueSet(id) where role = correct in CorrectResponseArm(id), a mirrors half on CorrectResponseArm';

COMMENT ON TRIGGER "__law_declaration_shape_alternatives_gobp44zwso" ON "qti"."declaration" IS 'trigger of law alternatives of Declaration.shape on Declaration';

COMMENT ON TRIGGER "__law_declaration_kind_outcome_in_outcome_rdxzyw2vsb" ON "qti"."declaration" IS 'trigger of law Declaration(id) where kind = outcome in OutcomeDeclarationArm(id), a mirrors half on Declaration';

COMMENT ON TRIGGER "__law_declaration_kind_response_in_response_x3yw3rucou" ON "qti"."declaration" IS 'trigger of law Declaration(id) where kind = response in ResponseDeclarationArm(id), a mirrors half on Declaration';

COMMENT ON TRIGGER "__law_declaration_kind_response_in_response_kqtea5gfs6" ON "qti"."declaration" IS 'trigger of law Declaration(id, document, identifier) where kind = response in ResponseDeclarationId(node, document, id), a mirrors half on Declaration';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_mz5n3vslds" ON "qti"."declared_ref" IS 'trigger of law alternatives of VariableRef.kind on DeclaredRef';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_4w34r7nktl" ON "qti"."declared_value" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValue';

COMMENT ON TRIGGER "__law_declared_value_shape_alternatives_t2luymqvvk" ON "qti"."declared_value" IS 'trigger of law alternatives of DeclaredValue.shape on DeclaredValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5vhdpgz25" ON "qti"."declared_value" IS 'trigger of law alternatives of Node.kind on DeclaredValue';

COMMENT ON TRIGGER "__law_typed_value_set_cardinality_single_capacity_34nvs6golz" ON "qti"."declared_value" IS 'trigger of law capacity of TypedValueSet(id) where cardinality = single over DeclaredValue(valueSet) within 1..1 on DeclaredValue';

COMMENT ON TRIGGER "__law_value_set_capacity_declared_value_tyljrkdi67" ON "qti"."declared_value" IS 'trigger of law capacity of ValueSet(id) over DeclaredValue(valueSet) within 1..* on DeclaredValue';

COMMENT ON TRIGGER "__law_declared_value_shape_typed_in_typed_value_set_lgwmxbgdqa" ON "qti"."declared_value" IS 'trigger of law DeclaredValue(valueSet, baseType) where shape = typed in TypedValueSet(id, baseType) on DeclaredValue';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_mgimadxysu" ON "qti"."declared_value_boolean" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueBoolean';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_jlvjy7zbkg" ON "qti"."declared_value_directed_pair" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueDirectedPair';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_pljp3smpng" ON "qti"."declared_value_duration" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueDuration';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_7k7uh2pbe3" ON "qti"."declared_value_file" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueFile';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_oxhzuibafc" ON "qti"."declared_value_float" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueFloat';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_25lksnkfdz" ON "qti"."declared_value_identifier" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueIdentifier';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_k5rhlgc3tt" ON "qti"."declared_value_integer" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueInteger';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_codktwlwvu" ON "qti"."declared_value_pair" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValuePair';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_o4hjz65tk7" ON "qti"."declared_value_point" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValuePoint';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_k6ndyc2dma" ON "qti"."declared_value_string" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueString';

COMMENT ON TRIGGER "__law_declared_value_base_type_alternatives_jgctflzzgt" ON "qti"."declared_value_uri" IS 'trigger of law alternatives of DeclaredValue.baseType on DeclaredValueUri';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ssrxqpoval" ON "qti"."default_value_arm" IS 'trigger of law alternatives of Node.kind on DefaultValueArm';

COMMENT ON TRIGGER "__law_value_set_role_default_in_default_value_arm_u7xtwkds2s" ON "qti"."default_value_arm" IS 'trigger of law ValueSet(id) where role = default in DefaultValueArm(id), a mirrors half on DefaultValueArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6td2gbd75c" ON "qti"."dependency" IS 'trigger of law alternatives of Node.kind on Dependency';

COMMENT ON TRIGGER "__law_tree_kind_alternatives_yjvtq4lz7j" ON "qti"."document" IS 'trigger of law alternatives of Tree.kind on Document';

COMMENT ON TRIGGER "__law_document_root_item_capacity_document_prnjkp54jr" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = item over DocumentIdentifier(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_item_capacity_document_title_nrxxq4nnui" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = item over DocumentTitle(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_manifest_capacity_document_ywaxmzr3uz" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = manifest over DocumentIdentifier(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_manifest_capacity_document_title_nfxlr5rj5v" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = manifest over DocumentTitle(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_outcomes_capacity_document_7m42eusftx" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = outcomes over DocumentIdentifier(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_outcomes_capacity_document_title_hvkm2yaj7e" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = outcomes over DocumentTitle(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_rptemplate_capacity_document_hf4tncedgq" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = rptemplate over DocumentIdentifier(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_rptemplate_capacity_document_m4cldzcrfx" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = rptemplate over DocumentTitle(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_section_capacity_document_5sg4ctjcgn" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = section over DocumentIdentifier(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_section_capacity_document_title_6p7ofzgy4i" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = section over DocumentTitle(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_stimulus_capacity_document_dk25covvgb" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = stimulus over DocumentIdentifier(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_stimulus_capacity_document_title_hlevcyh7ec" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = stimulus over DocumentTitle(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_test_capacity_document_q67upbyczr" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = test over DocumentIdentifier(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_test_capacity_document_title_geftzm3qi5" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = test over DocumentTitle(document) within 1..1 on Document';

COMMENT ON TRIGGER "__law_document_root_usagedata_capacity_document_3usfev5ega" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = usagedata over DocumentIdentifier(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_usagedata_capacity_document_q5rfatcv25" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = usagedata over DocumentTitle(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_id_holder_alternatives_xredhbipsh" ON "qti"."document_id" IS 'trigger of law alternatives of DocumentId.holder on DocumentId';

COMMENT ON TRIGGER "__law_document_root_item_capacity_document_6smtdgqapw" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = item over DocumentIdentifier(document) within 1..1 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_manifest_capacity_document_huwyjbiaax" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = manifest over DocumentIdentifier(document) within 0..0 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_outcomes_capacity_document_izd2tixgdz" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = outcomes over DocumentIdentifier(document) within 1..1 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_rptemplate_capacity_document_x5joe25vjo" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = rptemplate over DocumentIdentifier(document) within 0..0 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_section_capacity_document_x642dbwmke" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = section over DocumentIdentifier(document) within 1..1 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_stimulus_capacity_document_y6rvav2gy6" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = stimulus over DocumentIdentifier(document) within 1..1 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_test_capacity_document_x7dwiuwkfx" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = test over DocumentIdentifier(document) within 1..1 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_usagedata_capacity_document_u452schews" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = usagedata over DocumentIdentifier(document) within 0..0 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_item_capacity_document_title_eoyh7sfbay" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = item over DocumentTitle(document) within 1..1 on DocumentTitle';

COMMENT ON TRIGGER "__law_document_root_manifest_capacity_document_title_lhyuubgbzj" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = manifest over DocumentTitle(document) within 0..0 on DocumentTitle';

COMMENT ON TRIGGER "__law_document_root_outcomes_capacity_document_title_eiej2syn6o" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = outcomes over DocumentTitle(document) within 0..0 on DocumentTitle';

COMMENT ON TRIGGER "__law_document_root_rptemplate_capacity_document_i4breldrzj" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = rptemplate over DocumentTitle(document) within 0..0 on DocumentTitle';

COMMENT ON TRIGGER "__law_document_root_section_capacity_document_title_k2p5qwq3wp" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = section over DocumentTitle(document) within 1..1 on DocumentTitle';

COMMENT ON TRIGGER "__law_document_root_stimulus_capacity_document_title_epuevnbwwk" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = stimulus over DocumentTitle(document) within 1..1 on DocumentTitle';

COMMENT ON TRIGGER "__law_document_root_test_capacity_document_title_ajbeyqxpgg" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = test over DocumentTitle(document) within 1..1 on DocumentTitle';

COMMENT ON TRIGGER "__law_document_root_usagedata_capacity_document_gvfp3gvgjl" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = usagedata over DocumentTitle(document) within 0..0 on DocumentTitle';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xuefsrgzju" ON "qti"."entity_reference" IS 'trigger of law alternatives of Node.kind on EntityReference';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oxdcy2a5y4" ON "qti"."file" IS 'trigger of law alternatives of Node.kind on File';

COMMENT ON TRIGGER "__law_resource_capacity_file_ctjmfxa3s3" ON "qti"."file" IS 'trigger of law capacity of Resource(id) over File(resource) within 1..* on File';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qi3e3sk75r" ON "qti"."img" IS 'trigger of law alternatives of Node.kind on Img';

COMMENT ON TRIGGER "__law_interaction_binding_shape_alternatives_xiunwhaz7u" ON "qti"."interaction_binding" IS 'trigger of law alternatives of InteractionBinding.shape on InteractionBinding';

COMMENT ON TRIGGER "__law_choice_interaction_root_kind_item_in_hlbgvipwhd" ON "qti"."interaction_binding" IS 'trigger of law ChoiceInteraction(id, responseIdentifier) where rootKind = item in InteractionBinding(node, responseIdentifier) on InteractionBinding';

COMMENT ON TRIGGER "__law_node_kind_alternatives_smgee6gejq" ON "qti"."item_body" IS 'trigger of law alternatives of Node.kind on ItemBody';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_fgobaid6bh" ON "qti"."literal" IS 'trigger of law alternatives of Literal.baseType on Literal';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_zqvxolwpdw" ON "qti"."literal_boolean" IS 'trigger of law alternatives of Literal.baseType on LiteralBoolean';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_rheuilr2xw" ON "qti"."literal_directed_pair" IS 'trigger of law alternatives of Literal.baseType on LiteralDirectedPair';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_xiic4gbndm" ON "qti"."literal_duration" IS 'trigger of law alternatives of Literal.baseType on LiteralDuration';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_vlslf77hqo" ON "qti"."literal_file" IS 'trigger of law alternatives of Literal.baseType on LiteralFile';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_3re4wm377d" ON "qti"."literal_float" IS 'trigger of law alternatives of Literal.baseType on LiteralFloat';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_hbyiqdxxer" ON "qti"."literal_identifier" IS 'trigger of law alternatives of Literal.baseType on LiteralIdentifier';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_j7wpznds5d" ON "qti"."literal_integer" IS 'trigger of law alternatives of Literal.baseType on LiteralInteger';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_enfxt7q6zg" ON "qti"."literal_pair" IS 'trigger of law alternatives of Literal.baseType on LiteralPair';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_jj73kjfjcs" ON "qti"."literal_point" IS 'trigger of law alternatives of Literal.baseType on LiteralPoint';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_zd3tsz2tzg" ON "qti"."literal_string" IS 'trigger of law alternatives of Literal.baseType on LiteralString';

COMMENT ON TRIGGER "__law_literal_base_type_alternatives_g4kll6su77" ON "qti"."literal_uri" IS 'trigger of law alternatives of Literal.baseType on LiteralUri';

COMMENT ON TRIGGER "__law_lom_owner_alternatives_aikkcw5eu4" ON "qti"."lom" IS 'trigger of law alternatives of Lom.owner on Lom';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2dcbln6kcy" ON "qti"."lom" IS 'trigger of law alternatives of Node.kind on Lom';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mv5aefdwh2" ON "qti"."lom_aggregation_level" IS 'trigger of law alternatives of Node.kind on LomAggregationLevel';

COMMENT ON TRIGGER "__law_node_kind_alternatives_he2rgj5mbx" ON "qti"."lom_contribute" IS 'trigger of law alternatives of Node.kind on LomContribute';

COMMENT ON TRIGGER "__law_node_kind_alternatives_r2e6hdkalh" ON "qti"."lom_copyright_and_other_restrictions" IS 'trigger of law alternatives of Node.kind on LomCopyrightAndOtherRestrictions';

COMMENT ON TRIGGER "__law_node_kind_alternatives_shvebtrlgf" ON "qti"."lom_cost" IS 'trigger of law alternatives of Node.kind on LomCost';

COMMENT ON TRIGGER "__law_node_kind_alternatives_l2hrke52xd" ON "qti"."lom_coverage" IS 'trigger of law alternatives of Node.kind on LomCoverage';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rumdkk3upt" ON "qti"."lom_date" IS 'trigger of law alternatives of Node.kind on LomDate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_lmrorx3a3k" ON "qti"."lom_date_time" IS 'trigger of law alternatives of Node.kind on LomDateTime';

COMMENT ON TRIGGER "__law_node_kind_alternatives_koa233guz3" ON "qti"."lom_description" IS 'trigger of law alternatives of Node.kind on LomDescription';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ecwbudisg7" ON "qti"."lom_duration" IS 'trigger of law alternatives of Node.kind on LomDuration';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bny3lmkb33" ON "qti"."lom_duration_string" IS 'trigger of law alternatives of Node.kind on LomDurationString';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ims3brka4l" ON "qti"."lom_entity" IS 'trigger of law alternatives of Node.kind on LomEntity';

COMMENT ON TRIGGER "__law_node_kind_alternatives_jcx37zt5ue" ON "qti"."lom_format" IS 'trigger of law alternatives of Node.kind on LomFormat';

COMMENT ON TRIGGER "__law_node_kind_alternatives_taa3jqho7t" ON "qti"."lom_general" IS 'trigger of law alternatives of Node.kind on LomGeneral';

COMMENT ON TRIGGER "__law_node_kind_alternatives_njovp3m4wd" ON "qti"."lom_general_title" IS 'trigger of law alternatives of Node.kind on LomGeneralTitle';

COMMENT ON TRIGGER "__law_resource_lom_titled_capacity_lom_general_title_ipfiike3xl" ON "qti"."lom_general_title" IS 'trigger of law capacity of ResourceLomTitled(lom) over LomGeneralTitle(lom) within 1..1 on LomGeneralTitle';

COMMENT ON TRIGGER "__law_lom_general_title_owner_resource_in_resource_u67bwcznca" ON "qti"."lom_general_title" IS 'trigger of law LomGeneralTitle(lom) where owner = resource in ResourceLomTitled(lom) on LomGeneralTitle';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5atjkt54uj" ON "qti"."lom_identifier" IS 'trigger of law alternatives of Node.kind on LomIdentifier';

COMMENT ON TRIGGER "__law_resource_lom_identified_capacity_lom_jri5j54oyk" ON "qti"."lom_identifier" IS 'trigger of law capacity of ResourceLomIdentified(lom) over LomIdentifier(lom) within 1..* on LomIdentifier';

COMMENT ON TRIGGER "__law_lom_identifier_owner_resource_in_resource_lom_e4mm3jcaxc" ON "qti"."lom_identifier" IS 'trigger of law LomIdentifier(lom) where owner = resource in ResourceLomIdentified(lom) on LomIdentifier';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2kftzfane5" ON "qti"."lom_identifier_catalog" IS 'trigger of law alternatives of Node.kind on LomIdentifierCatalog';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5h54ilotkw" ON "qti"."lom_identifier_entry" IS 'trigger of law alternatives of Node.kind on LomIdentifierEntry';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kmzpkwdfwz" ON "qti"."lom_installation_remarks" IS 'trigger of law alternatives of Node.kind on LomInstallationRemarks';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kbwcf2fp7r" ON "qti"."lom_keyword" IS 'trigger of law alternatives of Node.kind on LomKeyword';

COMMENT ON TRIGGER "__law_node_kind_alternatives_frtyzfpn44" ON "qti"."lom_language" IS 'trigger of law alternatives of Node.kind on LomLanguage';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qrphqsncb2" ON "qti"."lom_life_cycle" IS 'trigger of law alternatives of Node.kind on LomLifeCycle';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nskr4gdykp" ON "qti"."lom_location" IS 'trigger of law alternatives of Node.kind on LomLocation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_i5vk5zpkqs" ON "qti"."lom_maximum_version" IS 'trigger of law alternatives of Node.kind on LomMaximumVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ivgqamob5e" ON "qti"."lom_meta_metadata" IS 'trigger of law alternatives of Node.kind on LomMetaMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2ojzrgiu3b" ON "qti"."lom_metadataschema" IS 'trigger of law alternatives of Node.kind on LomMetadataschema';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tzulcyjncq" ON "qti"."lom_minimum_version" IS 'trigger of law alternatives of Node.kind on LomMinimumVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j7umbljrel" ON "qti"."lom_name" IS 'trigger of law alternatives of Node.kind on LomName';

COMMENT ON TRIGGER "__law_resource_lom_identified_type_imsqti_item_xmlv_fn6jbcxhml" ON "qti"."lom_object_identifier" IS 'trigger of law capacity of ResourceLomIdentified(lom) where type = "imsqti_item_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on LomObjectIdentifier';

COMMENT ON TRIGGER "__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_naeeyf6yjv" ON "qti"."lom_object_title" IS 'trigger of law capacity of ResourceLomTitled(lom) where type = "imsqti_item_xmlv3p0" over LomObjectTitle(lom) within 1..1 on LomObjectTitle';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zxusyvmfdr" ON "qti"."lom_or_composite" IS 'trigger of law alternatives of Node.kind on LomOrComposite';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bvsjorb2ct" ON "qti"."lom_other_platform_requirements" IS 'trigger of law alternatives of Node.kind on LomOtherPlatformRequirements';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vf5xjk6ifd" ON "qti"."lom_requirement" IS 'trigger of law alternatives of Node.kind on LomRequirement';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xvzx2v3rl5" ON "qti"."lom_rights" IS 'trigger of law alternatives of Node.kind on LomRights';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pm2skzhtr5" ON "qti"."lom_role" IS 'trigger of law alternatives of Node.kind on LomRole';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fam52ju36s" ON "qti"."lom_size" IS 'trigger of law alternatives of Node.kind on LomSize';

COMMENT ON TRIGGER "__law_node_kind_alternatives_djllplcds2" ON "qti"."lom_source" IS 'trigger of law alternatives of Node.kind on LomSource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wlex3fqd5y" ON "qti"."lom_status" IS 'trigger of law alternatives of Node.kind on LomStatus';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ve5pxjgpfh" ON "qti"."lom_string" IS 'trigger of law alternatives of Node.kind on LomString';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ti3uxbwvxw" ON "qti"."lom_structure" IS 'trigger of law alternatives of Node.kind on LomStructure';

COMMENT ON TRIGGER "__law_node_kind_alternatives_c3ajmngdz5" ON "qti"."lom_technical" IS 'trigger of law alternatives of Node.kind on LomTechnical';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pnqk3xgbee" ON "qti"."lom_type" IS 'trigger of law alternatives of Node.kind on LomType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qz5dugmojw" ON "qti"."lom_value" IS 'trigger of law alternatives of Node.kind on LomValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2erkrdrbjq" ON "qti"."lom_version" IS 'trigger of law alternatives of Node.kind on LomVersion';

COMMENT ON TRIGGER "__law_tree_kind_alternatives_6g73tzdoj6" ON "qti"."manifest" IS 'trigger of law alternatives of Tree.kind on Manifest';

COMMENT ON TRIGGER "__law_lom_owner_alternatives_as4icxtbgu" ON "qti"."manifest_lom" IS 'trigger of law alternatives of Lom.owner on ManifestLom';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ipuymtixeh" ON "qti"."manifest_metadata" IS 'trigger of law alternatives of Node.kind on ManifestMetadata';

COMMENT ON TRIGGER "__law_manifest_metadata_capacity_manifest_schema_o7zogxhhxv" ON "qti"."manifest_metadata" IS 'trigger of law capacity of ManifestMetadata(id) over ManifestSchema(metadata) within 1..1 on ManifestMetadata';

COMMENT ON TRIGGER "__law_manifest_metadata_capacity_manifest_schema_4dmq5wmfhg" ON "qti"."manifest_metadata" IS 'trigger of law capacity of ManifestMetadata(id) over ManifestSchemaVersion(metadata) within 1..1 on ManifestMetadata';

COMMENT ON TRIGGER "__law_package_capacity_manifest_metadata_l4xfgaedl3" ON "qti"."manifest_metadata" IS 'trigger of law capacity of Package(id) over ManifestMetadata(manifest) within 1..1 on ManifestMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_k3727kgr4f" ON "qti"."manifest_schema" IS 'trigger of law alternatives of Node.kind on ManifestSchema';

COMMENT ON TRIGGER "__law_manifest_metadata_capacity_manifest_schema_qhqxl45nsl" ON "qti"."manifest_schema" IS 'trigger of law capacity of ManifestMetadata(id) over ManifestSchema(metadata) within 1..1 on ManifestSchema';

COMMENT ON TRIGGER "__law_node_kind_alternatives_edwin77ceo" ON "qti"."manifest_schema_version" IS 'trigger of law alternatives of Node.kind on ManifestSchemaVersion';

COMMENT ON TRIGGER "__law_manifest_metadata_capacity_manifest_schema_veibfwdjcv" ON "qti"."manifest_schema_version" IS 'trigger of law capacity of ManifestMetadata(id) over ManifestSchemaVersion(metadata) within 1..1 on ManifestSchemaVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sv4lck5ue6" ON "qti"."node" IS 'trigger of law alternatives of Node.kind on Node';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bv75ttdv6d" ON "qti"."organizations" IS 'trigger of law alternatives of Node.kind on Organizations';

COMMENT ON TRIGGER "__law_package_capacity_organizations_gckhlnlkg2" ON "qti"."organizations" IS 'trigger of law capacity of Package(id) over Organizations(manifest) within 1..1 on Organizations';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qhu3dxqvfw" ON "qti"."outcome_declaration_arm" IS 'trigger of law alternatives of Node.kind on OutcomeDeclarationArm';

COMMENT ON TRIGGER "__law_declaration_kind_outcome_in_outcome_ug53wmpfie" ON "qti"."outcome_declaration_arm" IS 'trigger of law Declaration(id) where kind = outcome in OutcomeDeclarationArm(id), a mirrors half on OutcomeDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3psrbuzkn3" ON "qti"."p" IS 'trigger of law alternatives of Node.kind on P';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nmhjri6454" ON "qti"."package" IS 'trigger of law alternatives of Node.kind on Package';

COMMENT ON TRIGGER "__law_package_capacity_manifest_metadata_m3acntpjbt" ON "qti"."package" IS 'trigger of law capacity of Package(id) over ManifestMetadata(manifest) within 1..1 on Package';

COMMENT ON TRIGGER "__law_package_capacity_organizations_vcl7cb753d" ON "qti"."package" IS 'trigger of law capacity of Package(id) over Organizations(manifest) within 1..1 on Package';

COMMENT ON TRIGGER "__law_package_capacity_resources_g4ggia6vyr" ON "qti"."package" IS 'trigger of law capacity of Package(id) over Resources(manifest) within 1..1 on Package';

COMMENT ON TRIGGER "__law_tree_kind_manifest_in_package_uhhfalo2z7" ON "qti"."package" IS 'trigger of law Tree(id, version) where kind = manifest in Package(id, schemaversion) on Package';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rsadoosbdw" ON "qti"."pi" IS 'trigger of law alternatives of Node.kind on Pi';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mhdzlnjncv" ON "qti"."prompt" IS 'trigger of law alternatives of Node.kind on Prompt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_57ub5oxhzf" ON "qti"."qmd_composite" IS 'trigger of law alternatives of Node.kind on QmdComposite';

COMMENT ON TRIGGER "__law_node_kind_alternatives_d7g2apdcpb" ON "qti"."qmd_custom_type_identifier" IS 'trigger of law alternatives of Node.kind on QmdCustomTypeIdentifier';

COMMENT ON TRIGGER "__law_node_kind_alternatives_k2qrxndoek" ON "qti"."qmd_feedback_type" IS 'trigger of law alternatives of Node.kind on QmdFeedbackType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pe5d4fc2aj" ON "qti"."qmd_interaction_kind" IS 'trigger of law alternatives of Node.kind on QmdInteractionKind';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wvalkywjuv" ON "qti"."qmd_interaction_type" IS 'trigger of law alternatives of Node.kind on QmdInteractionType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_r7yxp36zr7" ON "qti"."qmd_item_template" IS 'trigger of law alternatives of Node.kind on QmdItemTemplate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_luryhf4x4y" ON "qti"."qmd_portable_custom_interaction_context" IS 'trigger of law alternatives of Node.kind on QmdPortableCustomInteractionContext';

COMMENT ON TRIGGER "__law_node_kind_alternatives_s52u2qgxdk" ON "qti"."qmd_scoring_mode" IS 'trigger of law alternatives of Node.kind on QmdScoringMode';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6axcinau5s" ON "qti"."qmd_solution_available" IS 'trigger of law alternatives of Node.kind on QmdSolutionAvailable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6trflifsqg" ON "qti"."qmd_time_dependent" IS 'trigger of law alternatives of Node.kind on QmdTimeDependent';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7luy63fgiv" ON "qti"."qmd_tool_name" IS 'trigger of law alternatives of Node.kind on QmdToolName';

COMMENT ON TRIGGER "__law_node_kind_alternatives_s4jgrzsaum" ON "qti"."qmd_tool_vendor" IS 'trigger of law alternatives of Node.kind on QmdToolVendor';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2sgxgfm3rf" ON "qti"."qmd_tool_version" IS 'trigger of law alternatives of Node.kind on QmdToolVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cp525k7f3z" ON "qti"."qti_metadata" IS 'trigger of law alternatives of Node.kind on QtiMetadata';

COMMENT ON TRIGGER "__law_interaction_binding_shape_alternatives_piejm2wh7b" ON "qti"."record_binding" IS 'trigger of law alternatives of InteractionBinding.shape on RecordBinding';

COMMENT ON TRIGGER "__law_declaration_shape_alternatives_mej22q6oik" ON "qti"."record_declaration" IS 'trigger of law alternatives of Declaration.shape on RecordDeclaration';

COMMENT ON TRIGGER "__law_declared_value_shape_alternatives_orevxj6eud" ON "qti"."record_field" IS 'trigger of law alternatives of DeclaredValue.shape on RecordField';

COMMENT ON TRIGGER "__law_value_set_shape_alternatives_j6h45dmjmw" ON "qti"."record_value_set" IS 'trigger of law alternatives of ValueSet.shape on RecordValueSet';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j53oleenel" ON "qti"."resource" IS 'trigger of law alternatives of Node.kind on Resource';

COMMENT ON TRIGGER "__law_resource_capacity_file_5dvxuzgjyu" ON "qti"."resource" IS 'trigger of law capacity of Resource(id) over File(resource) within 1..* on Resource';

COMMENT ON TRIGGER "__law_lom_owner_alternatives_boamltns5u" ON "qti"."resource_lom" IS 'trigger of law alternatives of Lom.owner on ResourceLom';

COMMENT ON TRIGGER "__law_resource_lom_identified_capacity_lom_uld7hppwtf" ON "qti"."resource_lom_identified" IS 'trigger of law capacity of ResourceLomIdentified(lom) over LomIdentifier(lom) within 1..* on ResourceLomIdentified';

COMMENT ON TRIGGER "__law_resource_lom_identified_type_imsqti_item_xmlv_5oyd5nvvfl" ON "qti"."resource_lom_identified" IS 'trigger of law capacity of ResourceLomIdentified(lom) where type = "imsqti_item_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on ResourceLomIdentified';

COMMENT ON TRIGGER "__law_lom_identifier_owner_resource_in_resource_lom_jlw2bxafkc" ON "qti"."resource_lom_identified" IS 'trigger of law LomIdentifier(lom) where owner = resource in ResourceLomIdentified(lom) on ResourceLomIdentified';

COMMENT ON TRIGGER "__law_resource_lom_titled_capacity_lom_general_title_zhf42uo5dn" ON "qti"."resource_lom_titled" IS 'trigger of law capacity of ResourceLomTitled(lom) over LomGeneralTitle(lom) within 1..1 on ResourceLomTitled';

COMMENT ON TRIGGER "__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_3m4ligbgq2" ON "qti"."resource_lom_titled" IS 'trigger of law capacity of ResourceLomTitled(lom) where type = "imsqti_item_xmlv3p0" over LomObjectTitle(lom) within 1..1 on ResourceLomTitled';

COMMENT ON TRIGGER "__law_lom_general_title_owner_resource_in_resource_o6j4kw5gah" ON "qti"."resource_lom_titled" IS 'trigger of law LomGeneralTitle(lom) where owner = resource in ResourceLomTitled(lom) on ResourceLomTitled';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rzmuape27g" ON "qti"."resource_metadata" IS 'trigger of law alternatives of Node.kind on ResourceMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rqsqvzbn2g" ON "qti"."resources" IS 'trigger of law alternatives of Node.kind on Resources';

COMMENT ON TRIGGER "__law_package_capacity_resources_zfve6ejwob" ON "qti"."resources" IS 'trigger of law capacity of Package(id) over Resources(manifest) within 1..1 on Resources';

COMMENT ON TRIGGER "__law_node_kind_alternatives_p5egrc7ys2" ON "qti"."response_declaration_arm" IS 'trigger of law alternatives of Node.kind on ResponseDeclarationArm';

COMMENT ON TRIGGER "__law_declaration_kind_response_in_response_sbshlrinxo" ON "qti"."response_declaration_arm" IS 'trigger of law Declaration(id) where kind = response in ResponseDeclarationArm(id), a mirrors half on ResponseDeclarationArm';

COMMENT ON TRIGGER "__law_document_id_holder_alternatives_hewcediiwx" ON "qti"."response_declaration_id" IS 'trigger of law alternatives of DocumentId.holder on ResponseDeclarationId';

COMMENT ON TRIGGER "__law_declaration_kind_response_in_response_7edkptsm6d" ON "qti"."response_declaration_id" IS 'trigger of law Declaration(id, document, identifier) where kind = response in ResponseDeclarationId(node, document, id), a mirrors half on ResponseDeclarationId';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ob7fyfvlkb" ON "qti"."response_processing" IS 'trigger of law alternatives of Node.kind on ResponseProcessing';

COMMENT ON TRIGGER "__law_response_processing_root_kind_rptemplate_in_oz3pw5mqew" ON "qti"."response_processing" IS 'trigger of law ResponseProcessing(id) where rootKind = rptemplate in TreeRoot(node) on ResponseProcessing';

COMMENT ON TRIGGER "__law_response_processing_root_kind_item_in_response_5pujs2ecc4" ON "qti"."response_processing" IS 'trigger of law ResponseProcessing(id) where rootKind = item in ResponseProcessingItem(id), a mirrors half on ResponseProcessing';

COMMENT ON TRIGGER "__law_response_processing_root_kind_item_in_response_nsfftltvxp" ON "qti"."response_processing_item" IS 'trigger of law ResponseProcessing(id) where rootKind = item in ResponseProcessingItem(id), a mirrors half on ResponseProcessingItem';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mp3irnnixf" ON "qti"."simple_choice" IS 'trigger of law alternatives of Node.kind on SimpleChoice';

COMMENT ON TRIGGER "__law_choice_interaction_capacity_simple_choice_7vrtcqj77g" ON "qti"."simple_choice" IS 'trigger of law capacity of ChoiceInteraction(id) over SimpleChoice(interaction) within 1..* on SimpleChoice';

COMMENT ON TRIGGER "__law_node_kind_alternatives_b3nqpl22a2" ON "qti"."text" IS 'trigger of law alternatives of Node.kind on Text';

COMMENT ON TRIGGER "__law_tree_kind_alternatives_xsjvbpn6sr" ON "qti"."tree" IS 'trigger of law alternatives of Tree.kind on Tree';

COMMENT ON TRIGGER "__law_tree_kind_manifest_in_package_j3dyqr7eb5" ON "qti"."tree" IS 'trigger of law Tree(id, version) where kind = manifest in Package(id, schemaversion) on Tree';

COMMENT ON TRIGGER "__law_response_processing_root_kind_rptemplate_in_yndfez6sa4" ON "qti"."tree_root" IS 'trigger of law ResponseProcessing(id) where rootKind = rptemplate in TreeRoot(node) on TreeRoot';

COMMENT ON TRIGGER "__law_interaction_binding_shape_alternatives_aec4jxfna5" ON "qti"."typed_binding" IS 'trigger of law alternatives of InteractionBinding.shape on TypedBinding';

COMMENT ON TRIGGER "__law_declaration_shape_alternatives_db3qhpck3r" ON "qti"."typed_declaration" IS 'trigger of law alternatives of Declaration.shape on TypedDeclaration';

COMMENT ON TRIGGER "__law_value_set_shape_alternatives_2hyk562674" ON "qti"."typed_value_set" IS 'trigger of law alternatives of ValueSet.shape on TypedValueSet';

COMMENT ON TRIGGER "__law_typed_value_set_cardinality_single_capacity_ikwpbrzcks" ON "qti"."typed_value_set" IS 'trigger of law capacity of TypedValueSet(id) where cardinality = single over DeclaredValue(valueSet) within 1..1 on TypedValueSet';

COMMENT ON TRIGGER "__law_declared_value_shape_typed_in_typed_value_set_7gbbmjqgdv" ON "qti"."typed_value_set" IS 'trigger of law DeclaredValue(valueSet, baseType) where shape = typed in TypedValueSet(id, baseType) on TypedValueSet';

COMMENT ON TRIGGER "__law_value_set_shape_alternatives_mlu456gxd2" ON "qti"."value_set" IS 'trigger of law alternatives of ValueSet.shape on ValueSet';

COMMENT ON TRIGGER "__law_value_set_capacity_declared_value_xzgk4olpx2" ON "qti"."value_set" IS 'trigger of law capacity of ValueSet(id) over DeclaredValue(valueSet) within 1..* on ValueSet';

COMMENT ON TRIGGER "__law_value_set_role_correct_in_correct_response_arm_wfz5cuquz2" ON "qti"."value_set" IS 'trigger of law ValueSet(id) where role = correct in CorrectResponseArm(id), a mirrors half on ValueSet';

COMMENT ON TRIGGER "__law_value_set_role_default_in_default_value_arm_jijeodzme6" ON "qti"."value_set" IS 'trigger of law ValueSet(id) where role = default in DefaultValueArm(id), a mirrors half on ValueSet';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_do3v5z4ehq" ON "qti"."variable_ref" IS 'trigger of law alternatives of VariableRef.kind on VariableRef';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qra75t5mkw" ON "qti"."ws" IS 'trigger of law alternatives of Node.kind on Ws';
