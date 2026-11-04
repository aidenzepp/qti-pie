REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_ojm4wya66v", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."attribute_entity_reference", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."entity_reference", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."item_body", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."operand", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."ws" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."comment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_external_scored" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_interpretation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_long_interpretation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_mastery_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_normal_maximum" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_normal_minimum" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_variable_identifier_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_view" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_adaptive" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_value_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dependency" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."edge" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_content" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_height" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interaction_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_body" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_aggregation_level" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_contribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_copyright_and_other_restrictions" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_cost" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_coverage" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_date" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_date_time" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_description" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_entity" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_format" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_general" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_general_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_catalog" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_installation_remarks" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_keyword" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_life_cycle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_maximum_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_meta_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_metadataschema" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_minimum_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_or_composite" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_other_platform_requirements" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_requirement" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_rights" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_role" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_size" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_source" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_status" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_string_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_structure" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_technical" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."namespace_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."operand" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."organizations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."p" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."package" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."package_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pi" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."prompt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_composite" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_custom_type_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_feedback_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_interaction_kind" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_interaction_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_item_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_portable_custom_interaction_context" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_scoring_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_solution_available" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_time_dependent" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_tool_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_tool_vendor" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qmd_tool_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_field" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_titled" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resources" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_item" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice_template_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."standard_template_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_doctype" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_export_charset" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_misc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_root" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_encoding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_standalone" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ws" FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_celz4obcnh", "qti"."__text_uc3mvgolsg", "qti"."__text_gemmttam7z", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_hvweswafjf", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_ibaizj6fv3", "qti"."__text_gubl3xpcnx", "qti"."__text_mmzgy7vcfw", "qti"."__text_vtz3bnghkc", "qti"."__text_djykoynpls", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_ojm4wya66v", "qti"."__text_u3q4acbjwm", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_2hoxdcszyn", "qti"."__text_6uwfpnix5n", "qti"."__text_vwnl4b5fqr", "qti"."__text_wuvwyowttn" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."admission", "qti__author"."and", "qti__author"."any_n", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."container_size", "qti__author"."contains", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_substring", "qti__author"."declared_tolerance_mode", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."divide", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."fallback", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_content", "qti__author"."gcd", "qti__author"."gt", "qti__author"."gte", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."lcm", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."match", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."member", "qti__author"."min", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."or", "qti__author"."ordered", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."power", "qti__author"."product", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."rule_operand", "qti__author"."schema_location", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."stats_operator", "qti__author"."string_match", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_if_arm", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."and" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."any_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."comment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."container_size" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."contains" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."correct" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator_class" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator_definition" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_lower_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_upper_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_rounding_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_substring" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_tolerance_mode" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."default" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."delete" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dependency" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."divide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."duration_gte" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."duration_lt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."edge" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."equal" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."equal_rounded" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."equal_tolerance" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."exit_response" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."exit_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."exit_test" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_exclude_category" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_include_category" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_section_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_weight_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."fallback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."field_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_content" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gcd" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gte" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_height" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."index" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inside" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."integer_divide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."integer_modulus" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."integer_to_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interaction_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."is_null" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_body" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lcm" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lookup_outcome_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lte" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_response" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_response_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_constant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_operator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."max" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."member" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."multiple" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."namespace_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."not" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."null" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_correct" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_incorrect" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_presented" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_responded" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_selected" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."operand" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."or" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ordered" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."organizations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_condition_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_else_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_else_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_maximum_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_min_max" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_minimum_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_processing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_processing_fragment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."p" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."package" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."package_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pattern_match" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."power" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."product" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."random" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."random_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."random_float_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."random_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."random_integer_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."random_integer_step" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_field" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."repeat" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_titled" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resources" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_condition_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_else_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_else_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_fragment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."round" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."round_to" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rule_operand" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_correct_response" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_outcome_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_template_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice_template_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."standard_template_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stats_operator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."string_match" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."substring" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."subtract" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_condition_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_constraint" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_else_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_else_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_processing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_variables" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_variables_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_node" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_doctype" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_export_charset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_misc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_root" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_encoding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_standalone" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."truncate" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_weight_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ws" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_encoding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_parse" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_xpointer" TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) TO "qti__author";

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."admission", "qti"."and", "qti"."any_n", "qti"."assessment_item", "qti"."attribute_entity_reference", "qti"."attribute_lexical", "qti"."binding_fit", "qti"."built_in_ref", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."comment", "qti"."container_size", "qti"."contains", "qti"."correct", "qti"."correct_response_arm", "qti"."custom_operator", "qti"."custom_operator_class", "qti"."custom_operator_definition", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_fixed", "qti"."declared_include_lower_bound", "qti"."declared_include_upper_bound", "qti"."declared_max_choices", "qti"."declared_min_choices", "qti"."declared_orientation", "qti"."declared_ref", "qti"."declared_rounding_mode", "qti"."declared_show_hide", "qti"."declared_shuffle", "qti"."declared_substring", "qti"."declared_tolerance_mode", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."default", "qti"."default_value_arm", "qti"."delete", "qti"."dependency", "qti"."divide", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_title", "qti"."duration_gte", "qti"."duration_lt", "qti"."edge", "qti"."entity_reference", "qti"."equal", "qti"."equal_rounded", "qti"."equal_tolerance", "qti"."exit_response", "qti"."exit_template", "qti"."exit_test", "qti"."expression", "qti"."expression_exclude_category", "qti"."expression_include_category", "qti"."expression_section_identifier", "qti"."expression_weight_identifier", "qti"."fallback", "qti"."field_value", "qti"."file", "qti"."file_content", "qti"."gcd", "qti"."gt", "qti"."gte", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."index", "qti"."inside", "qti"."integer_divide", "qti"."integer_modulus", "qti"."integer_to_float", "qti"."interaction_binding", "qti"."is_null", "qti"."item_body", "qti"."lcm", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_entity", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_keyword", "qti"."lom_language", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_requirement", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_size", "qti"."lom_source", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_value", "qti"."lom_version", "qti"."lookup_outcome_value", "qti"."lt", "qti"."lte", "qti"."manifest", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."map_response", "qti"."map_response_point", "qti"."match", "qti"."math_constant", "qti"."math_operator", "qti"."max", "qti"."member", "qti"."min", "qti"."multiple", "qti"."namespace_declaration", "qti"."node", "qti"."not", "qti"."null", "qti"."number_correct", "qti"."number_incorrect", "qti"."number_presented", "qti"."number_responded", "qti"."number_selected", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."or", "qti"."ordered", "qti"."organizations", "qti"."outcome_condition_arm", "qti"."outcome_declaration_arm", "qti"."outcome_else_arm", "qti"."outcome_else_if_arm", "qti"."outcome_if_arm", "qti"."outcome_maximum_arm", "qti"."outcome_min_max", "qti"."outcome_minimum_arm", "qti"."outcome_processing", "qti"."outcome_processing_fragment", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."pattern_match", "qti"."pi", "qti"."power", "qti"."product", "qti"."prompt", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_metadata", "qti"."random", "qti"."random_float", "qti"."random_float_min", "qti"."random_integer", "qti"."random_integer_min", "qti"."random_integer_step", "qti"."record_binding", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."repeat", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_identified", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_condition_arm", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_else_arm", "qti"."response_else_if_arm", "qti"."response_if_arm", "qti"."response_processing", "qti"."response_processing_fragment", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."round", "qti"."round_to", "qti"."rule_operand", "qti"."schema_location", "qti"."set_correct_response", "qti"."set_default_value", "qti"."set_outcome_value", "qti"."set_template_value", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."standard_template_reference", "qti"."stats_operator", "qti"."string_match", "qti"."substring", "qti"."subtract", "qti"."sum", "qti"."template_condition_arm", "qti"."template_constraint", "qti"."template_else_arm", "qti"."template_else_if_arm", "qti"."template_if_arm", "qti"."template_processing", "qti"."test_variables", "qti"."test_variables_base_type", "qti"."text_node", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."truncate", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."value_set", "qti"."value_set_interpretation", "qti"."variable", "qti"."variable_ref", "qti"."variable_weight_identifier", "qti"."ws", "qti"."x_include", "qti"."x_include_accept", "qti"."x_include_accept_language", "qti"."x_include_encoding", "qti"."x_include_href", "qti"."x_include_parse", "qti"."x_include_xpointer", "qti__author"."admission", "qti__author"."and", "qti__author"."any_n", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."container_size", "qti__author"."contains", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_substring", "qti__author"."declared_tolerance_mode", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."divide", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."fallback", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_content", "qti__author"."gcd", "qti__author"."gt", "qti__author"."gte", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."lcm", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."match", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."member", "qti__author"."min", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."or", "qti__author"."ordered", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."power", "qti__author"."product", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."rule_operand", "qti__author"."schema_location", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."stats_operator", "qti__author"."string_match", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_if_arm", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_djykoynpls", "qti"."__text_cz7v66q3ce", "qti"."__text_raisrajgpi", "qti"."__text_rhdrzkabze", "qti"."__text_kqeswaav46", "qti"."__text_clza6vokfo", "qti"."__text_yakcqa4zli", "qti"."__text_k3z6naurdo", "qti"."__text_6uwfpnix5n", "qti"."__text_jld3q663or", "qti"."__text_f63vbnbw4t", "qti"."__text_d72l462ftm", "qti"."__text_qtkbmkpj6l", "qti"."__text_7grqskvjta", "qti"."__text_c34ec7mxid", "qti"."__text_tyjqwtj7ky", "qti"."__text_2dix7luqoi", "qti"."__text_celz4obcnh", "qti"."__text_hvweswafjf", "qti"."__text_vtz3bnghkc", "qti"."__text_uc3mvgolsg", "qti"."__text_tso7kvy6dv", "qti"."__text_ifp42a6zk6", "qti"."__text_7mulu52tr6", "qti"."__text_gubl3xpcnx", "qti"."__text_2hoxdcszyn", "qti"."__text_ieskz75v7g", "qti"."__text_popyschjwc", "qti"."__text_betq2bg2bg", "qti"."__text_qyq7zjychy", "qti"."__text_ibaizj6fv3", "qti"."__text_u3q4acbjwm", "qti"."__text_httzcaefcn", "qti"."__text_mvg26oprvk", "qti"."__text_f3hdif3553", "qti"."__text_ojm4wya66v", "qti"."__text_pftpnuhm3d", "qti"."__text_wuvwyowttn", "qti"."__text_i67gmkzdk7", "qti"."__text_mmzgy7vcfw", "qti"."__text_gemmttam7z", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_uia6zcss44", "qti"."__text_r5xluaej3z", "qti"."__text_ottycep7en", "qti"."__text_vwnl4b5fqr" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

COMMENT ON DOMAIN "qti"."__text_celz4obcnh" IS 'text pattern 1fd15b3d71ca5ffbc3db67b4d1c810eb9e9c6729cd8529791eca9dfadb2c3a72';

COMMENT ON DOMAIN "qti"."__text_uc3mvgolsg" IS 'text pattern 24cabe50215e85af4fb60b1f383fd21b8f5bc537c7a7b28ae2e0d0770f71b7d1';

COMMENT ON DOMAIN "qti"."__text_gemmttam7z" IS 'text pattern 2adffb18d740a07d189994cdf51badfec99f6d34605d1fa48606056c1201e7c3';

COMMENT ON DOMAIN "qti"."__text_hvweswafjf" IS 'text pattern 4ab196491437970b482f0ce5308a911095739fb3a53dffb21c5edc01d04a3db1';

COMMENT ON DOMAIN "qti"."__text_ibaizj6fv3" IS 'text pattern 7dc0d69c210bbd3c9f7a48a7250adfa68660a3d1ff946c0b0a79ee29b0103b5e';

COMMENT ON DOMAIN "qti"."__text_gubl3xpcnx" IS 'text pattern 7fe7c5f36069b882496db4f50fbe66fa9acd27043d2a28c61c43059de1ac276e';

COMMENT ON DOMAIN "qti"."__text_mmzgy7vcfw" IS 'text pattern 865b2b09df347dbbc4dd98c452885159558b10ae80d9d9f04576349bf5376485';

COMMENT ON DOMAIN "qti"."__text_vtz3bnghkc" IS 'text pattern 87bf5c2c077ca55473bba31317698ba8743f89707ef4e22fa1a32d9f9a33c28c';

COMMENT ON DOMAIN "qti"."__text_djykoynpls" IS 'text pattern 8a22c7d1defe4dbd4c3d9ca4063de732a8e26ba2e4b6b41f03c241e95497f907';

COMMENT ON DOMAIN "qti"."__text_u3q4acbjwm" IS 'text pattern c7999f47f856adc41549f0004c6845444193e50f78975883c66f3600c9d1f507';

COMMENT ON DOMAIN "qti"."__text_2hoxdcszyn" IS 'text pattern f31337cf28559ff01ba85223bf863315abdc22492ed7c8bf53b562fcd262e46c';

COMMENT ON DOMAIN "qti"."__text_vwnl4b5fqr" IS 'text pattern f83a0c8d7766d08e55c68b72e803c71ffd15e8d93acbe9a565bf19f5470cfad9';

COMMENT ON DOMAIN "qti"."__text_wuvwyowttn" IS 'text pattern f8a05ecd533dab1de04750b892c4621ef73bb500448d6f804689dec251c6926d';

COMMENT ON FUNCTION "qti"."__law_node_kind_alternatives_vfnu4bvxbc"() IS 'function of law alternatives of Node.kind';

COMMENT ON FUNCTION "qti"."__law_equal_tolerance_mode_absolute_in_equal_7y5weh5bu4"() IS 'function of law Equal(id) where toleranceMode = "absolute" in EqualTolerance(node)';

COMMENT ON FUNCTION "qti"."__law_equal_tolerance_mode_relative_in_equal_fhyetowfe6"() IS 'function of law Equal(id) where toleranceMode = "relative" in EqualTolerance(node)';

COMMENT ON CONSTRAINT "__and_pk_lce55mvyir" ON "qti"."and" IS 'primary key of And';

COMMENT ON CONSTRAINT "__any_n_pk_quebk2zfhq" ON "qti"."any_n" IS 'primary key of AnyN';

COMMENT ON CONSTRAINT "__container_size_pk_xrmvgf377a" ON "qti"."container_size" IS 'primary key of ContainerSize';

COMMENT ON CONSTRAINT "__contains_pk_g5zczg6nw5" ON "qti"."contains" IS 'primary key of Contains';

COMMENT ON CONSTRAINT "__correct_pk_5p7ahf4znz" ON "qti"."correct" IS 'primary key of Correct';

COMMENT ON CONSTRAINT "__custom_operator_pk_gls44jz4e7" ON "qti"."custom_operator" IS 'primary key of CustomOperator';

COMMENT ON CONSTRAINT "__custom_operator_class_pk_j72263baud" ON "qti"."custom_operator_class" IS 'primary key of CustomOperatorClass';

COMMENT ON CONSTRAINT "__custom_operator_definition_pk_kgofkkpsq2" ON "qti"."custom_operator_definition" IS 'primary key of CustomOperatorDefinition';

COMMENT ON CONSTRAINT "__declared_include_lower_bound_pk_u5oritomi4" ON "qti"."declared_include_lower_bound" IS 'primary key of DeclaredIncludeLowerBound';

COMMENT ON CONSTRAINT "__declared_include_upper_bound_pk_6rx7uubshf" ON "qti"."declared_include_upper_bound" IS 'primary key of DeclaredIncludeUpperBound';

COMMENT ON CONSTRAINT "__declared_rounding_mode_pk_23tqco34ok" ON "qti"."declared_rounding_mode" IS 'primary key of DeclaredRoundingMode';

COMMENT ON CONSTRAINT "__declared_substring_pk_gfqwlespam" ON "qti"."declared_substring" IS 'primary key of DeclaredSubstring';

COMMENT ON CONSTRAINT "__declared_tolerance_mode_pk_74cy5zo6cw" ON "qti"."declared_tolerance_mode" IS 'primary key of DeclaredToleranceMode';

COMMENT ON CONSTRAINT "__default_pk_v2pmuqkicx" ON "qti"."default" IS 'primary key of Default';

COMMENT ON CONSTRAINT "__delete_pk_lmo6nithdz" ON "qti"."delete" IS 'primary key of Delete';

COMMENT ON CONSTRAINT "__divide_pk_lkbryowscx" ON "qti"."divide" IS 'primary key of Divide';

COMMENT ON CONSTRAINT "__duration_gte_pk_bi352ynkm5" ON "qti"."duration_gte" IS 'primary key of DurationGte';

COMMENT ON CONSTRAINT "__duration_lt_pk_x5qmccsiof" ON "qti"."duration_lt" IS 'primary key of DurationLt';

COMMENT ON CONSTRAINT "__equal_pk_u4jsiv4n7p" ON "qti"."equal" IS 'primary key of Equal';

COMMENT ON CONSTRAINT "__equal_key_id_tolerance_mode_5oe7crwwrv" ON "qti"."equal" IS 'key Equal(id, toleranceMode)';

COMMENT ON CONSTRAINT "__equal_rounded_pk_ycg6nkvg3x" ON "qti"."equal_rounded" IS 'primary key of EqualRounded';

COMMENT ON CONSTRAINT "__equal_tolerance_pk_cxz24d6cmb" ON "qti"."equal_tolerance" IS 'primary key of EqualTolerance';

COMMENT ON CONSTRAINT "__exit_response_pk_bwsvjrgab5" ON "qti"."exit_response" IS 'primary key of ExitResponse';

COMMENT ON CONSTRAINT "__exit_template_pk_rfggxuggcj" ON "qti"."exit_template" IS 'primary key of ExitTemplate';

COMMENT ON CONSTRAINT "__exit_test_pk_b2jqs6hf6b" ON "qti"."exit_test" IS 'primary key of ExitTest';

COMMENT ON CONSTRAINT "__expression_exclude_category_pk_35alh46qit" ON "qti"."expression_exclude_category" IS 'primary key of ExpressionExcludeCategory';

COMMENT ON CONSTRAINT "__expression_include_category_pk_xasj2jeoni" ON "qti"."expression_include_category" IS 'primary key of ExpressionIncludeCategory';

COMMENT ON CONSTRAINT "__expression_section_identifier_pk_by6zkbxpzz" ON "qti"."expression_section_identifier" IS 'primary key of ExpressionSectionIdentifier';

COMMENT ON CONSTRAINT "__expression_weight_identifier_pk_do5kpjfyyv" ON "qti"."expression_weight_identifier" IS 'primary key of ExpressionWeightIdentifier';

COMMENT ON CONSTRAINT "__fallback_pk_wb6fgkjy6i" ON "qti"."fallback" IS 'primary key of Fallback';

COMMENT ON CONSTRAINT "__field_value_pk_3px6tuekcx" ON "qti"."field_value" IS 'primary key of FieldValue';

COMMENT ON CONSTRAINT "__gcd_pk_d5prwpqmbl" ON "qti"."gcd" IS 'primary key of Gcd';

COMMENT ON CONSTRAINT "__gt_pk_yf26zc4hjc" ON "qti"."gt" IS 'primary key of Gt';

COMMENT ON CONSTRAINT "__gte_pk_xjiyylmyqr" ON "qti"."gte" IS 'primary key of Gte';

COMMENT ON CONSTRAINT "__index_pk_jgklvulh7y" ON "qti"."index" IS 'primary key of Index';

COMMENT ON CONSTRAINT "__inside_pk_atcirtha2w" ON "qti"."inside" IS 'primary key of Inside';

COMMENT ON CONSTRAINT "__integer_divide_pk_zzxu7j5w7f" ON "qti"."integer_divide" IS 'primary key of IntegerDivide';

COMMENT ON CONSTRAINT "__integer_modulus_pk_htpqzwn5ph" ON "qti"."integer_modulus" IS 'primary key of IntegerModulus';

COMMENT ON CONSTRAINT "__integer_to_float_pk_plufh2y2er" ON "qti"."integer_to_float" IS 'primary key of IntegerToFloat';

COMMENT ON CONSTRAINT "__is_null_pk_rztk2ces37" ON "qti"."is_null" IS 'primary key of IsNull';

COMMENT ON CONSTRAINT "__lcm_pk_a62kmxetqr" ON "qti"."lcm" IS 'primary key of Lcm';

COMMENT ON CONSTRAINT "__lookup_outcome_value_pk_ide6hvpftx" ON "qti"."lookup_outcome_value" IS 'primary key of LookupOutcomeValue';

COMMENT ON CONSTRAINT "__lt_pk_auwosookqt" ON "qti"."lt" IS 'primary key of Lt';

COMMENT ON CONSTRAINT "__lte_pk_qqbow34kv6" ON "qti"."lte" IS 'primary key of Lte';

COMMENT ON CONSTRAINT "__map_response_pk_xro657lehh" ON "qti"."map_response" IS 'primary key of MapResponse';

COMMENT ON CONSTRAINT "__map_response_point_pk_sqnqvr2sdx" ON "qti"."map_response_point" IS 'primary key of MapResponsePoint';

COMMENT ON CONSTRAINT "__match_pk_uehnzuwybm" ON "qti"."match" IS 'primary key of Match';

COMMENT ON CONSTRAINT "__math_constant_pk_wsg3qmfz2p" ON "qti"."math_constant" IS 'primary key of MathConstant';

COMMENT ON CONSTRAINT "__math_operator_pk_nc3i3g73dh" ON "qti"."math_operator" IS 'primary key of MathOperator';

COMMENT ON CONSTRAINT "__max_pk_2pspzdsgps" ON "qti"."max" IS 'primary key of Max';

COMMENT ON CONSTRAINT "__member_pk_ce5j5h4dqs" ON "qti"."member" IS 'primary key of Member';

COMMENT ON CONSTRAINT "__min_pk_nkdgt2ynof" ON "qti"."min" IS 'primary key of Min';

COMMENT ON CONSTRAINT "__multiple_pk_vvs64v475f" ON "qti"."multiple" IS 'primary key of Multiple';

COMMENT ON CONSTRAINT "__not_pk_bauz5nu6h7" ON "qti"."not" IS 'primary key of Not';

COMMENT ON CONSTRAINT "__null_pk_g63z7msytv" ON "qti"."null" IS 'primary key of Null';

COMMENT ON CONSTRAINT "__number_correct_pk_qlz7x6yb2w" ON "qti"."number_correct" IS 'primary key of NumberCorrect';

COMMENT ON CONSTRAINT "__number_incorrect_pk_zlrq5c77ks" ON "qti"."number_incorrect" IS 'primary key of NumberIncorrect';

COMMENT ON CONSTRAINT "__number_presented_pk_ewjcxpyfdx" ON "qti"."number_presented" IS 'primary key of NumberPresented';

COMMENT ON CONSTRAINT "__number_responded_pk_mojv4byhkl" ON "qti"."number_responded" IS 'primary key of NumberResponded';

COMMENT ON CONSTRAINT "__number_selected_pk_cokievddwb" ON "qti"."number_selected" IS 'primary key of NumberSelected';

COMMENT ON CONSTRAINT "__or_pk_y7duy5pfgu" ON "qti"."or" IS 'primary key of Or';

COMMENT ON CONSTRAINT "__ordered_pk_bqvukunel4" ON "qti"."ordered" IS 'primary key of Ordered';

COMMENT ON CONSTRAINT "__outcome_condition_arm_pk_wo3d4slnda" ON "qti"."outcome_condition_arm" IS 'primary key of OutcomeConditionArm';

COMMENT ON CONSTRAINT "__outcome_else_arm_pk_yswy2y7e4t" ON "qti"."outcome_else_arm" IS 'primary key of OutcomeElseArm';

COMMENT ON CONSTRAINT "__outcome_else_arm_key_condition_fz6vete2cx" ON "qti"."outcome_else_arm" IS 'key OutcomeElseArm(condition)';

COMMENT ON CONSTRAINT "__outcome_else_if_arm_pk_ha426uaa6s" ON "qti"."outcome_else_if_arm" IS 'primary key of OutcomeElseIfArm';

COMMENT ON CONSTRAINT "__outcome_if_arm_pk_lwzvhkiup2" ON "qti"."outcome_if_arm" IS 'primary key of OutcomeIfArm';

COMMENT ON CONSTRAINT "__outcome_if_arm_key_condition_5tumrsqgpm" ON "qti"."outcome_if_arm" IS 'key OutcomeIfArm(condition)';

COMMENT ON CONSTRAINT "__outcome_maximum_arm_pk_etovftfrz3" ON "qti"."outcome_maximum_arm" IS 'primary key of OutcomeMaximumArm';

COMMENT ON CONSTRAINT "__outcome_min_max_pk_f23nbtrqiq" ON "qti"."outcome_min_max" IS 'primary key of OutcomeMinMax';

COMMENT ON CONSTRAINT "__outcome_minimum_arm_pk_e3w4q2hbek" ON "qti"."outcome_minimum_arm" IS 'primary key of OutcomeMinimumArm';

COMMENT ON CONSTRAINT "__outcome_processing_pk_xvxv6zwarp" ON "qti"."outcome_processing" IS 'primary key of OutcomeProcessing';

COMMENT ON CONSTRAINT "__outcome_processing_fragment_pk_gvneivp4il" ON "qti"."outcome_processing_fragment" IS 'primary key of OutcomeProcessingFragment';

COMMENT ON CONSTRAINT "__pattern_match_pk_enhbe55iiw" ON "qti"."pattern_match" IS 'primary key of PatternMatch';

COMMENT ON CONSTRAINT "__power_pk_r5lq7qyhym" ON "qti"."power" IS 'primary key of Power';

COMMENT ON CONSTRAINT "__product_pk_6ykszscxwz" ON "qti"."product" IS 'primary key of Product';

COMMENT ON CONSTRAINT "__random_pk_7rdffnzvjo" ON "qti"."random" IS 'primary key of Random';

COMMENT ON CONSTRAINT "__random_float_pk_7hxcqp7hcb" ON "qti"."random_float" IS 'primary key of RandomFloat';

COMMENT ON CONSTRAINT "__random_float_min_pk_aej2iktm7e" ON "qti"."random_float_min" IS 'primary key of RandomFloatMin';

COMMENT ON CONSTRAINT "__random_integer_pk_7ubdngnlaj" ON "qti"."random_integer" IS 'primary key of RandomInteger';

COMMENT ON CONSTRAINT "__random_integer_min_pk_5q2fi4dj4p" ON "qti"."random_integer_min" IS 'primary key of RandomIntegerMin';

COMMENT ON CONSTRAINT "__random_integer_step_pk_hp6mozrawn" ON "qti"."random_integer_step" IS 'primary key of RandomIntegerStep';

COMMENT ON CONSTRAINT "__repeat_pk_sucagcjref" ON "qti"."repeat" IS 'primary key of Repeat';

COMMENT ON CONSTRAINT "__response_condition_arm_pk_h7ymbdp7g2" ON "qti"."response_condition_arm" IS 'primary key of ResponseConditionArm';

COMMENT ON CONSTRAINT "__response_else_arm_pk_2tcvw4myw3" ON "qti"."response_else_arm" IS 'primary key of ResponseElseArm';

COMMENT ON CONSTRAINT "__response_else_arm_key_condition_plufqal34d" ON "qti"."response_else_arm" IS 'key ResponseElseArm(condition)';

COMMENT ON CONSTRAINT "__response_else_if_arm_pk_tcq6albawo" ON "qti"."response_else_if_arm" IS 'primary key of ResponseElseIfArm';

COMMENT ON CONSTRAINT "__response_if_arm_pk_my6j3ksjx3" ON "qti"."response_if_arm" IS 'primary key of ResponseIfArm';

COMMENT ON CONSTRAINT "__response_if_arm_key_condition_jcpht666ni" ON "qti"."response_if_arm" IS 'key ResponseIfArm(condition)';

COMMENT ON CONSTRAINT "__response_processing_fragment_pk_z4c7albdel" ON "qti"."response_processing_fragment" IS 'primary key of ResponseProcessingFragment';

COMMENT ON CONSTRAINT "__round_pk_qzw6omft62" ON "qti"."round" IS 'primary key of Round';

COMMENT ON CONSTRAINT "__round_to_pk_d45lpqk5n3" ON "qti"."round_to" IS 'primary key of RoundTo';

COMMENT ON CONSTRAINT "__rule_operand_pk_jcni7ipc5p" ON "qti"."rule_operand" IS 'primary key of RuleOperand';

COMMENT ON CONSTRAINT "__rule_operand_key_child_qloy3wxzn5" ON "qti"."rule_operand" IS 'key RuleOperand(child)';

COMMENT ON CONSTRAINT "__set_correct_response_pk_sxqj5x5hy6" ON "qti"."set_correct_response" IS 'primary key of SetCorrectResponse';

COMMENT ON CONSTRAINT "__set_default_value_pk_v7un4utfsm" ON "qti"."set_default_value" IS 'primary key of SetDefaultValue';

COMMENT ON CONSTRAINT "__set_outcome_value_pk_lbvpf5wb5e" ON "qti"."set_outcome_value" IS 'primary key of SetOutcomeValue';

COMMENT ON CONSTRAINT "__set_template_value_pk_ovr7opqhur" ON "qti"."set_template_value" IS 'primary key of SetTemplateValue';

COMMENT ON CONSTRAINT "__stats_operator_pk_vb3cdvabdi" ON "qti"."stats_operator" IS 'primary key of StatsOperator';

COMMENT ON CONSTRAINT "__string_match_pk_2yrytbiaer" ON "qti"."string_match" IS 'primary key of StringMatch';

COMMENT ON CONSTRAINT "__substring_pk_xyhgl3p6sv" ON "qti"."substring" IS 'primary key of Substring';

COMMENT ON CONSTRAINT "__subtract_pk_3mqph5ppcc" ON "qti"."subtract" IS 'primary key of Subtract';

COMMENT ON CONSTRAINT "__sum_pk_x5uo2a3mdb" ON "qti"."sum" IS 'primary key of Sum';

COMMENT ON CONSTRAINT "__template_condition_arm_pk_5if3lwsukp" ON "qti"."template_condition_arm" IS 'primary key of TemplateConditionArm';

COMMENT ON CONSTRAINT "__template_constraint_pk_p62ienp6si" ON "qti"."template_constraint" IS 'primary key of TemplateConstraint';

COMMENT ON CONSTRAINT "__template_else_arm_pk_piarpc3rde" ON "qti"."template_else_arm" IS 'primary key of TemplateElseArm';

COMMENT ON CONSTRAINT "__template_else_arm_key_condition_vceem34ndx" ON "qti"."template_else_arm" IS 'key TemplateElseArm(condition)';

COMMENT ON CONSTRAINT "__template_else_if_arm_pk_ucexwtn32p" ON "qti"."template_else_if_arm" IS 'primary key of TemplateElseIfArm';

COMMENT ON CONSTRAINT "__template_if_arm_pk_kgbpihwhko" ON "qti"."template_if_arm" IS 'primary key of TemplateIfArm';

COMMENT ON CONSTRAINT "__template_if_arm_key_condition_r2j7wjf6gy" ON "qti"."template_if_arm" IS 'key TemplateIfArm(condition)';

COMMENT ON CONSTRAINT "__template_processing_pk_s6nxl6qirh" ON "qti"."template_processing" IS 'primary key of TemplateProcessing';

COMMENT ON CONSTRAINT "__template_processing_key_item_dw4vumlyl4" ON "qti"."template_processing" IS 'key TemplateProcessing(item)';

COMMENT ON CONSTRAINT "__test_variables_pk_prmrb6n465" ON "qti"."test_variables" IS 'primary key of TestVariables';

COMMENT ON CONSTRAINT "__test_variables_base_type_pk_2cymaruanl" ON "qti"."test_variables_base_type" IS 'primary key of TestVariablesBaseType';

COMMENT ON CONSTRAINT "__truncate_pk_jihc6zxq3s" ON "qti"."truncate" IS 'primary key of Truncate';

COMMENT ON CONSTRAINT "__variable_pk_uw2snpik7k" ON "qti"."variable" IS 'primary key of Variable';

COMMENT ON CONSTRAINT "__variable_weight_identifier_pk_5cjde2q7ie" ON "qti"."variable_weight_identifier" IS 'primary key of VariableWeightIdentifier';

COMMENT ON CONSTRAINT "__x_include_pk_pq26xdbsr2" ON "qti"."x_include" IS 'primary key of XInclude';

COMMENT ON CONSTRAINT "__x_include_accept_pk_bbdlyyklyj" ON "qti"."x_include_accept" IS 'primary key of XIncludeAccept';

COMMENT ON CONSTRAINT "__x_include_accept_language_pk_zoi5c6eu5q" ON "qti"."x_include_accept_language" IS 'primary key of XIncludeAcceptLanguage';

COMMENT ON CONSTRAINT "__x_include_encoding_pk_ycj6l57qqa" ON "qti"."x_include_encoding" IS 'primary key of XIncludeEncoding';

COMMENT ON CONSTRAINT "__x_include_href_pk_tcda3sytvb" ON "qti"."x_include_href" IS 'primary key of XIncludeHref';

COMMENT ON CONSTRAINT "__x_include_parse_pk_sna47bsnxm" ON "qti"."x_include_parse" IS 'primary key of XIncludeParse';

COMMENT ON CONSTRAINT "__x_include_xpointer_pk_t2wlgmegik" ON "qti"."x_include_xpointer" IS 'primary key of XIncludeXpointer';

COMMENT ON COLUMN "qti"."and"."__tag_kind_qti_and_hietom4ymf" IS 'tag Node.kind = qti-and';

COMMENT ON COLUMN "qti"."any_n"."__tag_kind_qti_any_n_7fjipr6x66" IS 'tag Node.kind = qti-any-n';

COMMENT ON COLUMN "qti"."container_size"."__tag_kind_qti_container_size_ffge7oxu2m" IS 'tag Node.kind = qti-container-size';

COMMENT ON COLUMN "qti"."contains"."__tag_kind_qti_contains_ffvmh3ao5n" IS 'tag Node.kind = qti-contains';

COMMENT ON COLUMN "qti"."correct"."__tag_kind_qti_correct_adce6nmlck" IS 'tag Node.kind = qti-correct';

COMMENT ON COLUMN "qti"."custom_operator"."__tag_kind_qti_custom_operator_hgnfdy7pnw" IS 'tag Node.kind = qti-custom-operator';

COMMENT ON COLUMN "qti"."default"."__tag_kind_qti_default_jhwhuox3of" IS 'tag Node.kind = qti-default';

COMMENT ON COLUMN "qti"."delete"."__tag_kind_qti_delete_w5w6qiomne" IS 'tag Node.kind = qti-delete';

COMMENT ON COLUMN "qti"."divide"."__tag_kind_qti_divide_dgjmhfkvv3" IS 'tag Node.kind = qti-divide';

COMMENT ON COLUMN "qti"."duration_gte"."__tag_kind_qti_duration_gte_lzoivglsok" IS 'tag Node.kind = qti-duration-gte';

COMMENT ON COLUMN "qti"."duration_lt"."__tag_kind_qti_duration_lt_xn3larffx7" IS 'tag Node.kind = qti-duration-lt';

COMMENT ON COLUMN "qti"."equal"."__tag_kind_qti_equal_srgxur27t7" IS 'tag Node.kind = qti-equal';

COMMENT ON COLUMN "qti"."equal_rounded"."__tag_kind_qti_equal_rounded_v6objmsi4d" IS 'tag Node.kind = qti-equal-rounded';

COMMENT ON COLUMN "qti"."exit_response"."__tag_kind_qti_exit_response_7dymabqkc4" IS 'tag Node.kind = qti-exit-response';

COMMENT ON COLUMN "qti"."exit_template"."__tag_kind_qti_exit_template_ifkvvzdxdx" IS 'tag Node.kind = qti-exit-template';

COMMENT ON COLUMN "qti"."exit_test"."__tag_kind_qti_exit_test_ju554ikqov" IS 'tag Node.kind = qti-exit-test';

COMMENT ON COLUMN "qti"."fallback"."__tag_kind_xi_fallback_mi6ozofd6d" IS 'tag Node.kind = xi:fallback';

COMMENT ON COLUMN "qti"."field_value"."__tag_kind_qti_field_value_2z2wrjjwbo" IS 'tag Node.kind = qti-field-value';

COMMENT ON COLUMN "qti"."gcd"."__tag_kind_qti_gcd_fif4dvbbgi" IS 'tag Node.kind = qti-gcd';

COMMENT ON COLUMN "qti"."gt"."__tag_kind_qti_gt_jyjg6yqgqv" IS 'tag Node.kind = qti-gt';

COMMENT ON COLUMN "qti"."gte"."__tag_kind_qti_gte_gurw6edziz" IS 'tag Node.kind = qti-gte';

COMMENT ON COLUMN "qti"."index"."__tag_kind_qti_index_ekqtqbvpem" IS 'tag Node.kind = qti-index';

COMMENT ON COLUMN "qti"."inside"."__tag_kind_qti_inside_uqwtkeu4d6" IS 'tag Node.kind = qti-inside';

COMMENT ON COLUMN "qti"."integer_divide"."__tag_kind_qti_integer_divide_p6arj4ose5" IS 'tag Node.kind = qti-integer-divide';

COMMENT ON COLUMN "qti"."integer_modulus"."__tag_kind_qti_integer_modulus_3qu7obkveq" IS 'tag Node.kind = qti-integer-modulus';

COMMENT ON COLUMN "qti"."integer_to_float"."__tag_kind_qti_integer_to_float_hdfmecar27" IS 'tag Node.kind = qti-integer-to-float';

COMMENT ON COLUMN "qti"."is_null"."__tag_kind_qti_is_null_ibjh6ibqii" IS 'tag Node.kind = qti-is-null';

COMMENT ON COLUMN "qti"."lcm"."__tag_kind_qti_lcm_e3pbv2j3vf" IS 'tag Node.kind = qti-lcm';

COMMENT ON COLUMN "qti"."literal"."__tag_kind_qti_base_value_s2tktoudmi" IS 'tag Node.kind = qti-base-value';

COMMENT ON COLUMN "qti"."lookup_outcome_value"."__tag_kind_qti_lookup_outcome_value_upvgllrywv" IS 'tag Node.kind = qti-lookup-outcome-value';

COMMENT ON COLUMN "qti"."lt"."__tag_kind_qti_lt_mu6hpi7jul" IS 'tag Node.kind = qti-lt';

COMMENT ON COLUMN "qti"."lte"."__tag_kind_qti_lte_rzob7fldtj" IS 'tag Node.kind = qti-lte';

COMMENT ON COLUMN "qti"."map_response"."__tag_kind_qti_map_response_argeupazur" IS 'tag Node.kind = qti-map-response';

COMMENT ON COLUMN "qti"."map_response_point"."__tag_kind_qti_map_response_point_q6t4cnql4v" IS 'tag Node.kind = qti-map-response-point';

COMMENT ON COLUMN "qti"."match"."__tag_kind_qti_match_lnqs6dxwup" IS 'tag Node.kind = qti-match';

COMMENT ON COLUMN "qti"."math_constant"."__tag_kind_qti_math_constant_33aeaomua7" IS 'tag Node.kind = qti-math-constant';

COMMENT ON COLUMN "qti"."math_operator"."__tag_kind_qti_math_operator_5q3gpyxbee" IS 'tag Node.kind = qti-math-operator';

COMMENT ON COLUMN "qti"."max"."__tag_kind_qti_max_k2fgxlddd5" IS 'tag Node.kind = qti-max';

COMMENT ON COLUMN "qti"."member"."__tag_kind_qti_member_wlwyybwmab" IS 'tag Node.kind = qti-member';

COMMENT ON COLUMN "qti"."min"."__tag_kind_qti_min_5k4uqv4ded" IS 'tag Node.kind = qti-min';

COMMENT ON COLUMN "qti"."multiple"."__tag_kind_qti_multiple_blwsugoch2" IS 'tag Node.kind = qti-multiple';

COMMENT ON COLUMN "qti"."not"."__tag_kind_qti_not_ctn3qliz6a" IS 'tag Node.kind = qti-not';

COMMENT ON COLUMN "qti"."null"."__tag_kind_qti_null_sjdltnabyd" IS 'tag Node.kind = qti-null';

COMMENT ON COLUMN "qti"."number_correct"."__tag_kind_qti_number_correct_vgudlj33aa" IS 'tag Node.kind = qti-number-correct';

COMMENT ON COLUMN "qti"."number_incorrect"."__tag_kind_qti_number_incorrect_fobw5d7gbp" IS 'tag Node.kind = qti-number-incorrect';

COMMENT ON COLUMN "qti"."number_presented"."__tag_kind_qti_number_presented_c4kw7h2vss" IS 'tag Node.kind = qti-number-presented';

COMMENT ON COLUMN "qti"."number_responded"."__tag_kind_qti_number_responded_rej7fdtd2o" IS 'tag Node.kind = qti-number-responded';

COMMENT ON COLUMN "qti"."number_selected"."__tag_kind_qti_number_selected_y5wyghaa7n" IS 'tag Node.kind = qti-number-selected';

COMMENT ON COLUMN "qti"."or"."__tag_kind_qti_or_2bm3cp5uoy" IS 'tag Node.kind = qti-or';

COMMENT ON COLUMN "qti"."ordered"."__tag_kind_qti_ordered_wujbvdvnaz" IS 'tag Node.kind = qti-ordered';

COMMENT ON COLUMN "qti"."outcome_condition_arm"."__tag_kind_qti_outcome_condition_3td227dwcr" IS 'tag Node.kind = qti-outcome-condition';

COMMENT ON COLUMN "qti"."outcome_else_arm"."__tag_kind_qti_outcome_else_7klt3q36ge" IS 'tag Node.kind = qti-outcome-else';

COMMENT ON COLUMN "qti"."outcome_else_if_arm"."__tag_kind_qti_outcome_else_if_dfe5qckhzt" IS 'tag Node.kind = qti-outcome-else-if';

COMMENT ON COLUMN "qti"."outcome_if_arm"."__tag_kind_qti_outcome_if_unq7efyvy3" IS 'tag Node.kind = qti-outcome-if';

COMMENT ON COLUMN "qti"."outcome_maximum_arm"."__tag_kind_qti_outcome_maximum_xfo2bco2fs" IS 'tag Node.kind = qti-outcome-maximum';

COMMENT ON COLUMN "qti"."outcome_minimum_arm"."__tag_kind_qti_outcome_minimum_tdjdlbn6dy" IS 'tag Node.kind = qti-outcome-minimum';

COMMENT ON COLUMN "qti"."outcome_processing"."__tag_kind_qti_outcome_processing_fhxwpg6h24" IS 'tag Node.kind = qti-outcome-processing';

COMMENT ON COLUMN "qti"."outcome_processing_fragment"."__tag_kind_qti_outcome_processing_fragment_unfq3d4o7g" IS 'tag Node.kind = qti-outcome-processing-fragment';

COMMENT ON COLUMN "qti"."pattern_match"."__tag_kind_qti_pattern_match_fvc7hdtz3d" IS 'tag Node.kind = qti-pattern-match';

COMMENT ON COLUMN "qti"."power"."__tag_kind_qti_power_kpx2em75ca" IS 'tag Node.kind = qti-power';

COMMENT ON COLUMN "qti"."product"."__tag_kind_qti_product_hojc6apo2s" IS 'tag Node.kind = qti-product';

COMMENT ON COLUMN "qti"."random"."__tag_kind_qti_random_erxmfosfti" IS 'tag Node.kind = qti-random';

COMMENT ON COLUMN "qti"."random_float"."__tag_kind_qti_random_float_y4p3lnm6a4" IS 'tag Node.kind = qti-random-float';

COMMENT ON COLUMN "qti"."random_integer"."__tag_kind_qti_random_integer_rbwxdayyl2" IS 'tag Node.kind = qti-random-integer';

COMMENT ON COLUMN "qti"."repeat"."__tag_kind_qti_repeat_bpcaeiu7tm" IS 'tag Node.kind = qti-repeat';

COMMENT ON COLUMN "qti"."response_condition_arm"."__tag_kind_qti_response_condition_gplnrgu2ol" IS 'tag Node.kind = qti-response-condition';

COMMENT ON COLUMN "qti"."response_else_arm"."__tag_kind_qti_response_else_hxjbbfwd4n" IS 'tag Node.kind = qti-response-else';

COMMENT ON COLUMN "qti"."response_else_if_arm"."__tag_kind_qti_response_else_if_z5u6rg462x" IS 'tag Node.kind = qti-response-else-if';

COMMENT ON COLUMN "qti"."response_if_arm"."__tag_kind_qti_response_if_vi7uxgsitt" IS 'tag Node.kind = qti-response-if';

COMMENT ON COLUMN "qti"."response_processing_fragment"."__tag_kind_qti_response_processing_fragment_ftcfl3v7ub" IS 'tag Node.kind = qti-response-processing-fragment';

COMMENT ON COLUMN "qti"."round"."__tag_kind_qti_round_5eosswhdnh" IS 'tag Node.kind = qti-round';

COMMENT ON COLUMN "qti"."round_to"."__tag_kind_qti_round_to_qrylojzgc7" IS 'tag Node.kind = qti-round-to';

COMMENT ON COLUMN "qti"."set_correct_response"."__tag_kind_qti_set_correct_response_p4ucnvbenj" IS 'tag Node.kind = qti-set-correct-response';

COMMENT ON COLUMN "qti"."set_default_value"."__tag_kind_qti_set_default_value_rj2hosazj5" IS 'tag Node.kind = qti-set-default-value';

COMMENT ON COLUMN "qti"."set_outcome_value"."__tag_kind_qti_set_outcome_value_h6wjpdpvko" IS 'tag Node.kind = qti-set-outcome-value';

COMMENT ON COLUMN "qti"."set_template_value"."__tag_kind_qti_set_template_value_nb6cflrq6l" IS 'tag Node.kind = qti-set-template-value';

COMMENT ON COLUMN "qti"."stats_operator"."__tag_kind_qti_stats_operator_x5autjgscg" IS 'tag Node.kind = qti-stats-operator';

COMMENT ON COLUMN "qti"."string_match"."__tag_kind_qti_string_match_ymwg654alj" IS 'tag Node.kind = qti-string-match';

COMMENT ON COLUMN "qti"."substring"."__tag_kind_qti_substring_j2vyby2o5h" IS 'tag Node.kind = qti-substring';

COMMENT ON COLUMN "qti"."subtract"."__tag_kind_qti_subtract_fn3f5wibuj" IS 'tag Node.kind = qti-subtract';

COMMENT ON COLUMN "qti"."sum"."__tag_kind_qti_sum_2bm2f65vor" IS 'tag Node.kind = qti-sum';

COMMENT ON COLUMN "qti"."template_condition_arm"."__tag_kind_qti_template_condition_5iedsmf35c" IS 'tag Node.kind = qti-template-condition';

COMMENT ON COLUMN "qti"."template_constraint"."__tag_kind_qti_template_constraint_nwjpfefvxc" IS 'tag Node.kind = qti-template-constraint';

COMMENT ON COLUMN "qti"."template_else_arm"."__tag_kind_qti_template_else_td6wimhp7s" IS 'tag Node.kind = qti-template-else';

COMMENT ON COLUMN "qti"."template_else_if_arm"."__tag_kind_qti_template_else_if_xkgqxjlgvf" IS 'tag Node.kind = qti-template-else-if';

COMMENT ON COLUMN "qti"."template_if_arm"."__tag_kind_qti_template_if_kdp2hjyxni" IS 'tag Node.kind = qti-template-if';

COMMENT ON COLUMN "qti"."template_processing"."__tag_kind_qti_template_processing_julsyuopii" IS 'tag Node.kind = qti-template-processing';

COMMENT ON COLUMN "qti"."test_variables"."__tag_kind_qti_test_variables_ssteaad3nd" IS 'tag Node.kind = qti-test-variables';

COMMENT ON COLUMN "qti"."truncate"."__tag_kind_qti_truncate_vkai3xtk23" IS 'tag Node.kind = qti-truncate';

COMMENT ON COLUMN "qti"."variable"."__tag_kind_qti_variable_obgp52jplg" IS 'tag Node.kind = qti-variable';

COMMENT ON COLUMN "qti"."x_include"."__tag_kind_xi_include_tnsd6wpc7o" IS 'tag Node.kind = xi:include';

COMMENT ON CONSTRAINT "__and_fk_id_roez54kv57" ON "qti"."and" IS 'foreign key And(id) to Expression(id)';

COMMENT ON CONSTRAINT "__and_fk_id_tag_kind_qti_and_hietom_4_ymf_x43hurxfdz" ON "qti"."and" IS 'foreign key And(id, __tag_kind_qti_and_hietom4ymf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__any_n_fk_id_pvphqpmb6x" ON "qti"."any_n" IS 'foreign key AnyN(id) to Expression(id)';

COMMENT ON CONSTRAINT "__any_n_fk_id_tag_kind_qti_any_n_7_fjipr_6_x_66_5rylr7ljir" ON "qti"."any_n" IS 'foreign key AnyN(id, __tag_kind_qti_any_n_7fjipr6x66) to Node(id, kind)';

COMMENT ON CONSTRAINT "__container_size_fk_id_7px3ii6zuw" ON "qti"."container_size" IS 'foreign key ContainerSize(id) to Expression(id)';

COMMENT ON CONSTRAINT "__container_size_fk_id_tag_kind_qti_container_size_uqn4djigxs" ON "qti"."container_size" IS 'foreign key ContainerSize(id, __tag_kind_qti_container_size_ffge7oxu2m) to Node(id, kind)';

COMMENT ON CONSTRAINT "__contains_fk_id_zgkj3nkwy5" ON "qti"."contains" IS 'foreign key Contains(id) to Expression(id)';

COMMENT ON CONSTRAINT "__contains_fk_id_tag_kind_qti_contains_ffvmh_3_ao_5_5gryjokbos" ON "qti"."contains" IS 'foreign key Contains(id, __tag_kind_qti_contains_ffvmh3ao5n) to Node(id, kind)';

COMMENT ON CONSTRAINT "__correct_fk_id_xekitpgoxu" ON "qti"."correct" IS 'foreign key Correct(id) to Expression(id)';

COMMENT ON CONSTRAINT "__correct_fk_id_yn5ncjb4ja" ON "qti"."correct" IS 'foreign key Correct(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__correct_fk_id_tag_kind_qti_correct_adce_6_nmlck_4s6bp2abb7" ON "qti"."correct" IS 'foreign key Correct(id, __tag_kind_qti_correct_adce6nmlck) to Node(id, kind)';

COMMENT ON CONSTRAINT "__custom_operator_fk_id_kefw73uwn4" ON "qti"."custom_operator" IS 'foreign key CustomOperator(id) to Expression(id)';

COMMENT ON CONSTRAINT "__custom_operator_fk_id_tag_kind_qti_custom_operator_lgrzuqjcys" ON "qti"."custom_operator" IS 'foreign key CustomOperator(id, __tag_kind_qti_custom_operator_hgnfdy7pnw) to Node(id, kind)';

COMMENT ON CONSTRAINT "__custom_operator_class_fk_node_3dfgstdo7s" ON "qti"."custom_operator_class" IS 'foreign key CustomOperatorClass(node) to CustomOperator(id)';

COMMENT ON CONSTRAINT "__custom_operator_definition_fk_node_dfov4csotl" ON "qti"."custom_operator_definition" IS 'foreign key CustomOperatorDefinition(node) to CustomOperator(id)';

COMMENT ON CONSTRAINT "__declared_include_lower_bound_fk_node_ped2a3xl5q" ON "qti"."declared_include_lower_bound" IS 'foreign key DeclaredIncludeLowerBound(node) to Equal(id)';

COMMENT ON CONSTRAINT "__declared_include_upper_bound_fk_node_cxsgi7rsgh" ON "qti"."declared_include_upper_bound" IS 'foreign key DeclaredIncludeUpperBound(node) to Equal(id)';

COMMENT ON CONSTRAINT "__declared_rounding_mode_fk_node_up55mfxhaz" ON "qti"."declared_rounding_mode" IS 'foreign key DeclaredRoundingMode(node) to EqualRounded(id)';

COMMENT ON CONSTRAINT "__declared_substring_fk_node_dr6edie4bt" ON "qti"."declared_substring" IS 'foreign key DeclaredSubstring(node) to StringMatch(id)';

COMMENT ON CONSTRAINT "__declared_tolerance_mode_fk_node_nirjmcd4y6" ON "qti"."declared_tolerance_mode" IS 'foreign key DeclaredToleranceMode(node) to Equal(id)';

COMMENT ON CONSTRAINT "__default_fk_id_yae276tuus" ON "qti"."default" IS 'foreign key Default(id) to Expression(id)';

COMMENT ON CONSTRAINT "__default_fk_id_3w4dzl762a" ON "qti"."default" IS 'foreign key Default(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__default_fk_id_tag_kind_qti_default_jhwhuox_3_of_eoaql2ij27" ON "qti"."default" IS 'foreign key Default(id, __tag_kind_qti_default_jhwhuox3of) to Node(id, kind)';

COMMENT ON CONSTRAINT "__delete_fk_id_guc43fhhuy" ON "qti"."delete" IS 'foreign key Delete(id) to Expression(id)';

COMMENT ON CONSTRAINT "__delete_fk_id_tag_kind_qti_delete_w_5_w_6_qiomne_ashud7226e" ON "qti"."delete" IS 'foreign key Delete(id, __tag_kind_qti_delete_w5w6qiomne) to Node(id, kind)';

COMMENT ON CONSTRAINT "__divide_fk_id_5ne4j5abf7" ON "qti"."divide" IS 'foreign key Divide(id) to Expression(id)';

COMMENT ON CONSTRAINT "__divide_fk_id_tag_kind_qti_divide_dgjmhfkvv_3_pvlvhxtstb" ON "qti"."divide" IS 'foreign key Divide(id, __tag_kind_qti_divide_dgjmhfkvv3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__duration_gte_fk_id_soljtl2ru6" ON "qti"."duration_gte" IS 'foreign key DurationGte(id) to Expression(id)';

COMMENT ON CONSTRAINT "__duration_gte_fk_id_tag_kind_qti_duration_gte_x7s7qaqvye" ON "qti"."duration_gte" IS 'foreign key DurationGte(id, __tag_kind_qti_duration_gte_lzoivglsok) to Node(id, kind)';

COMMENT ON CONSTRAINT "__duration_lt_fk_id_t4gbten367" ON "qti"."duration_lt" IS 'foreign key DurationLt(id) to Expression(id)';

COMMENT ON CONSTRAINT "__duration_lt_fk_id_tag_kind_qti_duration_lt_xn_3_2es53ohito" ON "qti"."duration_lt" IS 'foreign key DurationLt(id, __tag_kind_qti_duration_lt_xn3larffx7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__equal_fk_id_avgfouuask" ON "qti"."equal" IS 'foreign key Equal(id) to Expression(id)';

COMMENT ON CONSTRAINT "__equal_fk_id_tag_kind_qti_equal_srgxur_27_t_7_ekrupelmig" ON "qti"."equal" IS 'foreign key Equal(id, __tag_kind_qti_equal_srgxur27t7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__equal_rounded_fk_id_dm5fy2x5fx" ON "qti"."equal_rounded" IS 'foreign key EqualRounded(id) to Expression(id)';

COMMENT ON CONSTRAINT "__equal_rounded_fk_id_tag_kind_qti_equal_rounded_v_6_lmnw7bvxu4" ON "qti"."equal_rounded" IS 'foreign key EqualRounded(id, __tag_kind_qti_equal_rounded_v6objmsi4d) to Node(id, kind)';

COMMENT ON CONSTRAINT "__equal_tolerance_fk_node_tolerance_mode_zggqkxh66v" ON "qti"."equal_tolerance" IS 'foreign key EqualTolerance(node, toleranceMode) to Equal(id, toleranceMode)';

COMMENT ON CONSTRAINT "__exit_response_fk_id_tag_kind_qti_exit_response_7_aaj7ucbwcy" ON "qti"."exit_response" IS 'foreign key ExitResponse(id, __tag_kind_qti_exit_response_7dymabqkc4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__exit_template_fk_id_tag_kind_qti_exit_template_2ifyz2wilo" ON "qti"."exit_template" IS 'foreign key ExitTemplate(id, __tag_kind_qti_exit_template_ifkvvzdxdx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__exit_test_fk_id_tag_kind_qti_exit_test_ju_554_uthcipxi25" ON "qti"."exit_test" IS 'foreign key ExitTest(id, __tag_kind_qti_exit_test_ju554ikqov) to Node(id, kind)';

COMMENT ON CONSTRAINT "__expression_exclude_category_fk_node_y63mccgxjm" ON "qti"."expression_exclude_category" IS 'foreign key ExpressionExcludeCategory(node) to Expression(id)';

COMMENT ON CONSTRAINT "__expression_include_category_fk_node_bbmn3oh7lp" ON "qti"."expression_include_category" IS 'foreign key ExpressionIncludeCategory(node) to Expression(id)';

COMMENT ON CONSTRAINT "__expression_section_identifier_fk_node_2vkg2rmdrz" ON "qti"."expression_section_identifier" IS 'foreign key ExpressionSectionIdentifier(node) to Expression(id)';

COMMENT ON CONSTRAINT "__expression_weight_identifier_fk_node_eo6avloo6c" ON "qti"."expression_weight_identifier" IS 'foreign key ExpressionWeightIdentifier(node) to Expression(id)';

COMMENT ON CONSTRAINT "__fallback_fk_id_tag_kind_xi_fallback_mi_6_ozofd_6_d_jqjumf2cb3" ON "qti"."fallback" IS 'foreign key Fallback(id, __tag_kind_xi_fallback_mi6ozofd6d) to Node(id, kind)';

COMMENT ON CONSTRAINT "__field_value_fk_id_xy6vy4ozmk" ON "qti"."field_value" IS 'foreign key FieldValue(id) to Expression(id)';

COMMENT ON CONSTRAINT "__field_value_fk_id_tag_kind_qti_field_value_2_z_2_noxgq3e3l4" ON "qti"."field_value" IS 'foreign key FieldValue(id, __tag_kind_qti_field_value_2z2wrjjwbo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__gcd_fk_id_njtn2gkwq5" ON "qti"."gcd" IS 'foreign key Gcd(id) to Expression(id)';

COMMENT ON CONSTRAINT "__gcd_fk_id_tag_kind_qti_gcd_fif_4_dvbbgi_ozbhrvoz52" ON "qti"."gcd" IS 'foreign key Gcd(id, __tag_kind_qti_gcd_fif4dvbbgi) to Node(id, kind)';

COMMENT ON CONSTRAINT "__gt_fk_id_zgvlugkn52" ON "qti"."gt" IS 'foreign key Gt(id) to Expression(id)';

COMMENT ON CONSTRAINT "__gt_fk_id_tag_kind_qti_gt_jyjg_6_yqgqv_y4pkalesqo" ON "qti"."gt" IS 'foreign key Gt(id, __tag_kind_qti_gt_jyjg6yqgqv) to Node(id, kind)';

COMMENT ON CONSTRAINT "__gte_fk_id_suxk6gqnxf" ON "qti"."gte" IS 'foreign key Gte(id) to Expression(id)';

COMMENT ON CONSTRAINT "__gte_fk_id_tag_kind_qti_gte_gurw_6_edziz_lvdrbzrkmk" ON "qti"."gte" IS 'foreign key Gte(id, __tag_kind_qti_gte_gurw6edziz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__index_fk_id_mhiugan6ac" ON "qti"."index" IS 'foreign key Index(id) to Expression(id)';

COMMENT ON CONSTRAINT "__index_fk_id_tag_kind_qti_index_ekqtqbvpem_g3lwhqdjn7" ON "qti"."index" IS 'foreign key Index(id, __tag_kind_qti_index_ekqtqbvpem) to Node(id, kind)';

COMMENT ON CONSTRAINT "__inside_fk_id_r76h3gwgel" ON "qti"."inside" IS 'foreign key Inside(id) to Expression(id)';

COMMENT ON CONSTRAINT "__inside_fk_id_tag_kind_qti_inside_uqwtkeu_4_d_6_ec2775uahe" ON "qti"."inside" IS 'foreign key Inside(id, __tag_kind_qti_inside_uqwtkeu4d6) to Node(id, kind)';

COMMENT ON CONSTRAINT "__integer_divide_fk_id_aapblfmkop" ON "qti"."integer_divide" IS 'foreign key IntegerDivide(id) to Expression(id)';

COMMENT ON CONSTRAINT "__integer_divide_fk_id_tag_kind_qti_integer_divide_p_45aioisyeh" ON "qti"."integer_divide" IS 'foreign key IntegerDivide(id, __tag_kind_qti_integer_divide_p6arj4ose5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__integer_modulus_fk_id_zai577tyu4" ON "qti"."integer_modulus" IS 'foreign key IntegerModulus(id) to Expression(id)';

COMMENT ON CONSTRAINT "__integer_modulus_fk_id_tag_kind_qti_integer_modulus_2gttwvkmmk" ON "qti"."integer_modulus" IS 'foreign key IntegerModulus(id, __tag_kind_qti_integer_modulus_3qu7obkveq) to Node(id, kind)';

COMMENT ON CONSTRAINT "__integer_to_float_fk_id_rihzowuazj" ON "qti"."integer_to_float" IS 'foreign key IntegerToFloat(id) to Expression(id)';

COMMENT ON CONSTRAINT "__integer_to_float_fk_id_tag_kind_qti_integer_to_r4o33zvjtl" ON "qti"."integer_to_float" IS 'foreign key IntegerToFloat(id, __tag_kind_qti_integer_to_float_hdfmecar27) to Node(id, kind)';

COMMENT ON CONSTRAINT "__is_null_fk_id_47fcopwphs" ON "qti"."is_null" IS 'foreign key IsNull(id) to Expression(id)';

COMMENT ON CONSTRAINT "__is_null_fk_id_tag_kind_qti_is_null_ibjh_6_ibqii_l5z6eltsen" ON "qti"."is_null" IS 'foreign key IsNull(id, __tag_kind_qti_is_null_ibjh6ibqii) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lcm_fk_id_7ozlvyivcj" ON "qti"."lcm" IS 'foreign key Lcm(id) to Expression(id)';

COMMENT ON CONSTRAINT "__lcm_fk_id_tag_kind_qti_lcm_e_3_pbv_2_j_3_vf_tgxcqh6nr5" ON "qti"."lcm" IS 'foreign key Lcm(id, __tag_kind_qti_lcm_e3pbv2j3vf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__literal_fk_id_tag_kind_qti_base_value_s_2_tktoudmi_ezrzio63ck" ON "qti"."literal" IS 'foreign key Literal(id, __tag_kind_qti_base_value_s2tktoudmi) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lookup_outcome_value_fk_id_oz7cfhuqid" ON "qti"."lookup_outcome_value" IS 'foreign key LookupOutcomeValue(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__lookup_outcome_value_fk_id_ditaed6wt4" ON "qti"."lookup_outcome_value" IS 'foreign key LookupOutcomeValue(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__lookup_outcome_value_fk_id_tag_kind_qti_lookup_dfgs5ltobq" ON "qti"."lookup_outcome_value" IS 'foreign key LookupOutcomeValue(id, __tag_kind_qti_lookup_outcome_value_upvgllrywv) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lt_fk_id_inbmmkow27" ON "qti"."lt" IS 'foreign key Lt(id) to Expression(id)';

COMMENT ON CONSTRAINT "__lt_fk_id_tag_kind_qti_lt_mu_6_hpi_7_jul_w3xe35lmuy" ON "qti"."lt" IS 'foreign key Lt(id, __tag_kind_qti_lt_mu6hpi7jul) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lte_fk_id_kyui6hi5of" ON "qti"."lte" IS 'foreign key Lte(id) to Expression(id)';

COMMENT ON CONSTRAINT "__lte_fk_id_tag_kind_qti_lte_rzob_7_fldtj_qois4rus27" ON "qti"."lte" IS 'foreign key Lte(id, __tag_kind_qti_lte_rzob7fldtj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__map_response_fk_id_fuhcgjkpzo" ON "qti"."map_response" IS 'foreign key MapResponse(id) to Expression(id)';

COMMENT ON CONSTRAINT "__map_response_fk_id_v3lhvp7zwk" ON "qti"."map_response" IS 'foreign key MapResponse(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__map_response_fk_id_tag_kind_qti_map_response_7kz5oqqvrj" ON "qti"."map_response" IS 'foreign key MapResponse(id, __tag_kind_qti_map_response_argeupazur) to Node(id, kind)';

COMMENT ON CONSTRAINT "__map_response_point_fk_id_q5hysxtwju" ON "qti"."map_response_point" IS 'foreign key MapResponsePoint(id) to Expression(id)';

COMMENT ON CONSTRAINT "__map_response_point_fk_id_rfzddt37sa" ON "qti"."map_response_point" IS 'foreign key MapResponsePoint(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__map_response_point_fk_id_tag_kind_qti_map_response_pqjmyxmroj" ON "qti"."map_response_point" IS 'foreign key MapResponsePoint(id, __tag_kind_qti_map_response_point_q6t4cnql4v) to Node(id, kind)';

COMMENT ON CONSTRAINT "__match_fk_id_hvzxeiva7v" ON "qti"."match" IS 'foreign key Match(id) to Expression(id)';

COMMENT ON CONSTRAINT "__match_fk_id_tag_kind_qti_match_lnqs_6_dxwup_zmwvvpefyc" ON "qti"."match" IS 'foreign key Match(id, __tag_kind_qti_match_lnqs6dxwup) to Node(id, kind)';

COMMENT ON CONSTRAINT "__math_constant_fk_id_3if4wk74ff" ON "qti"."math_constant" IS 'foreign key MathConstant(id) to Expression(id)';

COMMENT ON CONSTRAINT "__math_constant_fk_id_tag_kind_qti_math_constant_33_iaucqlqiqv" ON "qti"."math_constant" IS 'foreign key MathConstant(id, __tag_kind_qti_math_constant_33aeaomua7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__math_operator_fk_id_3qu4p4udeg" ON "qti"."math_operator" IS 'foreign key MathOperator(id) to Expression(id)';

COMMENT ON CONSTRAINT "__math_operator_fk_id_tag_kind_qti_math_operator_5_q_3mbmdzquip" ON "qti"."math_operator" IS 'foreign key MathOperator(id, __tag_kind_qti_math_operator_5q3gpyxbee) to Node(id, kind)';

COMMENT ON CONSTRAINT "__max_fk_id_g5zf7brjq6" ON "qti"."max" IS 'foreign key Max(id) to Expression(id)';

COMMENT ON CONSTRAINT "__max_fk_id_tag_kind_qti_max_k_2_fgxlddd_5_kfmzhfjbif" ON "qti"."max" IS 'foreign key Max(id, __tag_kind_qti_max_k2fgxlddd5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__member_fk_id_oojwslvahd" ON "qti"."member" IS 'foreign key Member(id) to Expression(id)';

COMMENT ON CONSTRAINT "__member_fk_id_tag_kind_qti_member_wlwyybwmab_tuy6q4dbzl" ON "qti"."member" IS 'foreign key Member(id, __tag_kind_qti_member_wlwyybwmab) to Node(id, kind)';

COMMENT ON CONSTRAINT "__min_fk_id_vetagsffvs" ON "qti"."min" IS 'foreign key Min(id) to Expression(id)';

COMMENT ON CONSTRAINT "__min_fk_id_tag_kind_qti_min_5_k_4_uqv_4_ded_m7743yrr2x" ON "qti"."min" IS 'foreign key Min(id, __tag_kind_qti_min_5k4uqv4ded) to Node(id, kind)';

COMMENT ON CONSTRAINT "__multiple_fk_id_cxclpn5p2n" ON "qti"."multiple" IS 'foreign key Multiple(id) to Expression(id)';

COMMENT ON CONSTRAINT "__multiple_fk_id_tag_kind_qti_multiple_blwsugoch_2_ph7jucqnpt" ON "qti"."multiple" IS 'foreign key Multiple(id, __tag_kind_qti_multiple_blwsugoch2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__not_fk_id_cmsiylmljp" ON "qti"."not" IS 'foreign key Not(id) to Expression(id)';

COMMENT ON CONSTRAINT "__not_fk_id_tag_kind_qti_not_ctn_3_qliz_6_a_sebxf5zr6o" ON "qti"."not" IS 'foreign key Not(id, __tag_kind_qti_not_ctn3qliz6a) to Node(id, kind)';

COMMENT ON CONSTRAINT "__null_fk_id_ldxmdadr3e" ON "qti"."null" IS 'foreign key Null(id) to Expression(id)';

COMMENT ON CONSTRAINT "__null_fk_id_tag_kind_qti_null_sjdltnabyd_7fti64b735" ON "qti"."null" IS 'foreign key Null(id, __tag_kind_qti_null_sjdltnabyd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__number_correct_fk_id_iarcqhrcze" ON "qti"."number_correct" IS 'foreign key NumberCorrect(id) to Expression(id)';

COMMENT ON CONSTRAINT "__number_correct_fk_id_tag_kind_qti_number_correct_x6ksglx5lo" ON "qti"."number_correct" IS 'foreign key NumberCorrect(id, __tag_kind_qti_number_correct_vgudlj33aa) to Node(id, kind)';

COMMENT ON CONSTRAINT "__number_incorrect_fk_id_j24hcc54zj" ON "qti"."number_incorrect" IS 'foreign key NumberIncorrect(id) to Expression(id)';

COMMENT ON CONSTRAINT "__number_incorrect_fk_id_tag_kind_qti_number_ttjziwrnxm" ON "qti"."number_incorrect" IS 'foreign key NumberIncorrect(id, __tag_kind_qti_number_incorrect_fobw5d7gbp) to Node(id, kind)';

COMMENT ON CONSTRAINT "__number_presented_fk_id_a5x2tt6j5b" ON "qti"."number_presented" IS 'foreign key NumberPresented(id) to Expression(id)';

COMMENT ON CONSTRAINT "__number_presented_fk_id_tag_kind_qti_number_onbvhyq2bq" ON "qti"."number_presented" IS 'foreign key NumberPresented(id, __tag_kind_qti_number_presented_c4kw7h2vss) to Node(id, kind)';

COMMENT ON CONSTRAINT "__number_responded_fk_id_gfpoethceq" ON "qti"."number_responded" IS 'foreign key NumberResponded(id) to Expression(id)';

COMMENT ON CONSTRAINT "__number_responded_fk_id_tag_kind_qti_number_oefmiaomde" ON "qti"."number_responded" IS 'foreign key NumberResponded(id, __tag_kind_qti_number_responded_rej7fdtd2o) to Node(id, kind)';

COMMENT ON CONSTRAINT "__number_selected_fk_id_7c23e26pls" ON "qti"."number_selected" IS 'foreign key NumberSelected(id) to Expression(id)';

COMMENT ON CONSTRAINT "__number_selected_fk_id_tag_kind_qti_number_selected_mungmro26d" ON "qti"."number_selected" IS 'foreign key NumberSelected(id, __tag_kind_qti_number_selected_y5wyghaa7n) to Node(id, kind)';

COMMENT ON CONSTRAINT "__or_fk_id_tscrqmza5p" ON "qti"."or" IS 'foreign key Or(id) to Expression(id)';

COMMENT ON CONSTRAINT "__or_fk_id_tag_kind_qti_or_2_bm_3_cp_5_uoy_b3a2z75he4" ON "qti"."or" IS 'foreign key Or(id, __tag_kind_qti_or_2bm3cp5uoy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__ordered_fk_id_eewdmtzqwd" ON "qti"."ordered" IS 'foreign key Ordered(id) to Expression(id)';

COMMENT ON CONSTRAINT "__ordered_fk_id_tag_kind_qti_ordered_wujbvdvnaz_djxt4mgw26" ON "qti"."ordered" IS 'foreign key Ordered(id, __tag_kind_qti_ordered_wujbvdvnaz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_condition_arm_fk_id_xhrncakxwx" ON "qti"."outcome_condition_arm" IS 'foreign key OutcomeConditionArm(id) to OutcomeIfArm(condition)';

COMMENT ON CONSTRAINT "__outcome_condition_arm_fk_id_tag_kind_qti_outcome_xgomswhii7" ON "qti"."outcome_condition_arm" IS 'foreign key OutcomeConditionArm(id, __tag_kind_qti_outcome_condition_3td227dwcr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_else_arm_fk_id_tag_kind_qti_outcome_else_7_yutniokik2" ON "qti"."outcome_else_arm" IS 'foreign key OutcomeElseArm(id, __tag_kind_qti_outcome_else_7klt3q36ge) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_else_arm_fk_id_condition_thr2iy3hbr" ON "qti"."outcome_else_arm" IS 'foreign key OutcomeElseArm(id, condition) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__outcome_else_if_arm_fk_id_4flu66ksyg" ON "qti"."outcome_else_if_arm" IS 'foreign key OutcomeElseIfArm(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__outcome_else_if_arm_fk_id_tag_kind_qti_outcome_a3sb3aax6w" ON "qti"."outcome_else_if_arm" IS 'foreign key OutcomeElseIfArm(id, __tag_kind_qti_outcome_else_if_dfe5qckhzt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_if_arm_fk_condition_f4ncbmgu25" ON "qti"."outcome_if_arm" IS 'foreign key OutcomeIfArm(condition) to OutcomeConditionArm(id)';

COMMENT ON CONSTRAINT "__outcome_if_arm_fk_id_4xnfondegy" ON "qti"."outcome_if_arm" IS 'foreign key OutcomeIfArm(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__outcome_if_arm_fk_id_tag_kind_qti_outcome_if_unq_7_qjmeehzmtj" ON "qti"."outcome_if_arm" IS 'foreign key OutcomeIfArm(id, __tag_kind_qti_outcome_if_unq7efyvy3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_if_arm_fk_id_condition_loiz5l7s2v" ON "qti"."outcome_if_arm" IS 'foreign key OutcomeIfArm(id, condition) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__outcome_maximum_arm_fk_id_vwh4v63gob" ON "qti"."outcome_maximum_arm" IS 'foreign key OutcomeMaximumArm(id) to OutcomeMinMax(id)';

COMMENT ON CONSTRAINT "__outcome_maximum_arm_fk_id_tag_kind_qti_outcome_wvicjkszpx" ON "qti"."outcome_maximum_arm" IS 'foreign key OutcomeMaximumArm(id, __tag_kind_qti_outcome_maximum_xfo2bco2fs) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_min_max_fk_id_g6ayyix4px" ON "qti"."outcome_min_max" IS 'foreign key OutcomeMinMax(id) to Expression(id)';

COMMENT ON CONSTRAINT "__outcome_min_max_fk_id_kind_z432ftoffo" ON "qti"."outcome_min_max" IS 'foreign key OutcomeMinMax(id, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_minimum_arm_fk_id_27krwgiz2y" ON "qti"."outcome_minimum_arm" IS 'foreign key OutcomeMinimumArm(id) to OutcomeMinMax(id)';

COMMENT ON CONSTRAINT "__outcome_minimum_arm_fk_id_tag_kind_qti_outcome_5fjyioefaz" ON "qti"."outcome_minimum_arm" IS 'foreign key OutcomeMinimumArm(id, __tag_kind_qti_outcome_minimum_tdjdlbn6dy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_processing_fk_id_tag_kind_qti_outcome_27vrfx42fi" ON "qti"."outcome_processing" IS 'foreign key OutcomeProcessing(id, __tag_kind_qti_outcome_processing_fhxwpg6h24) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_processing_fragment_fk_id_tag_kind_qti_j5zojarox7" ON "qti"."outcome_processing_fragment" IS 'foreign key OutcomeProcessingFragment(id, __tag_kind_qti_outcome_processing_fragment_unfq3d4o7g) to Node(id, kind)';

COMMENT ON CONSTRAINT "__pattern_match_fk_id_paggty4v4t" ON "qti"."pattern_match" IS 'foreign key PatternMatch(id) to Expression(id)';

COMMENT ON CONSTRAINT "__pattern_match_fk_id_tag_kind_qti_pattern_match_fvc_tgqazw72z4" ON "qti"."pattern_match" IS 'foreign key PatternMatch(id, __tag_kind_qti_pattern_match_fvc7hdtz3d) to Node(id, kind)';

COMMENT ON CONSTRAINT "__power_fk_id_2dz5cm56km" ON "qti"."power" IS 'foreign key Power(id) to Expression(id)';

COMMENT ON CONSTRAINT "__power_fk_id_tag_kind_qti_power_kpx_2_em_75_ca_4ojebbslvf" ON "qti"."power" IS 'foreign key Power(id, __tag_kind_qti_power_kpx2em75ca) to Node(id, kind)';

COMMENT ON CONSTRAINT "__product_fk_id_jjwyrz7j4o" ON "qti"."product" IS 'foreign key Product(id) to Expression(id)';

COMMENT ON CONSTRAINT "__product_fk_id_tag_kind_qti_product_hojc_6_apo_2_s_yloixsjp5u" ON "qti"."product" IS 'foreign key Product(id, __tag_kind_qti_product_hojc6apo2s) to Node(id, kind)';

COMMENT ON CONSTRAINT "__random_fk_id_y6bzpmjkno" ON "qti"."random" IS 'foreign key Random(id) to Expression(id)';

COMMENT ON CONSTRAINT "__random_fk_id_tag_kind_qti_random_erxmfosfti_z3obv6o7r4" ON "qti"."random" IS 'foreign key Random(id, __tag_kind_qti_random_erxmfosfti) to Node(id, kind)';

COMMENT ON CONSTRAINT "__random_float_fk_id_u2zitqvmnl" ON "qti"."random_float" IS 'foreign key RandomFloat(id) to Expression(id)';

COMMENT ON CONSTRAINT "__random_float_fk_id_tag_kind_qti_random_float_y_4_p_5gxzghh6jx" ON "qti"."random_float" IS 'foreign key RandomFloat(id, __tag_kind_qti_random_float_y4p3lnm6a4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__random_float_min_fk_node_4obkovkwuc" ON "qti"."random_float_min" IS 'foreign key RandomFloatMin(node) to RandomFloat(id)';

COMMENT ON CONSTRAINT "__random_integer_fk_id_puarvo7zql" ON "qti"."random_integer" IS 'foreign key RandomInteger(id) to Expression(id)';

COMMENT ON CONSTRAINT "__random_integer_fk_id_tag_kind_qti_random_integer_hyj5nu26iy" ON "qti"."random_integer" IS 'foreign key RandomInteger(id, __tag_kind_qti_random_integer_rbwxdayyl2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__random_integer_min_fk_node_p4wuno4r2v" ON "qti"."random_integer_min" IS 'foreign key RandomIntegerMin(node) to RandomInteger(id)';

COMMENT ON CONSTRAINT "__random_integer_step_fk_node_varwgz7e24" ON "qti"."random_integer_step" IS 'foreign key RandomIntegerStep(node) to RandomInteger(id)';

COMMENT ON CONSTRAINT "__repeat_fk_id_chy7zjngpv" ON "qti"."repeat" IS 'foreign key Repeat(id) to Expression(id)';

COMMENT ON CONSTRAINT "__repeat_fk_id_tag_kind_qti_repeat_bpcaeiu_7_tm_paitvwlydr" ON "qti"."repeat" IS 'foreign key Repeat(id, __tag_kind_qti_repeat_bpcaeiu7tm) to Node(id, kind)';

COMMENT ON CONSTRAINT "__response_condition_arm_fk_id_cqennxujn3" ON "qti"."response_condition_arm" IS 'foreign key ResponseConditionArm(id) to ResponseIfArm(condition)';

COMMENT ON CONSTRAINT "__response_condition_arm_fk_id_tag_kind_qti_response_arfysdid6d" ON "qti"."response_condition_arm" IS 'foreign key ResponseConditionArm(id, __tag_kind_qti_response_condition_gplnrgu2ol) to Node(id, kind)';

COMMENT ON CONSTRAINT "__response_else_arm_fk_id_tag_kind_qti_response_else_pw5zdqtyat" ON "qti"."response_else_arm" IS 'foreign key ResponseElseArm(id, __tag_kind_qti_response_else_hxjbbfwd4n) to Node(id, kind)';

COMMENT ON CONSTRAINT "__response_else_arm_fk_id_condition_6rv4ogvmus" ON "qti"."response_else_arm" IS 'foreign key ResponseElseArm(id, condition) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__response_else_if_arm_fk_id_x4wstscymw" ON "qti"."response_else_if_arm" IS 'foreign key ResponseElseIfArm(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__response_else_if_arm_fk_id_tag_kind_qti_response_7xqxxbwsg3" ON "qti"."response_else_if_arm" IS 'foreign key ResponseElseIfArm(id, __tag_kind_qti_response_else_if_z5u6rg462x) to Node(id, kind)';

COMMENT ON CONSTRAINT "__response_if_arm_fk_condition_qwwjbbttwd" ON "qti"."response_if_arm" IS 'foreign key ResponseIfArm(condition) to ResponseConditionArm(id)';

COMMENT ON CONSTRAINT "__response_if_arm_fk_id_dwfoomqo67" ON "qti"."response_if_arm" IS 'foreign key ResponseIfArm(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__response_if_arm_fk_id_tag_kind_qti_response_if_vi_nkmvms4df5" ON "qti"."response_if_arm" IS 'foreign key ResponseIfArm(id, __tag_kind_qti_response_if_vi7uxgsitt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__response_if_arm_fk_id_condition_zwk5nyeyvf" ON "qti"."response_if_arm" IS 'foreign key ResponseIfArm(id, condition) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__response_processing_fragment_fk_id_tag_kind_qti_iz4amgqjhf" ON "qti"."response_processing_fragment" IS 'foreign key ResponseProcessingFragment(id, __tag_kind_qti_response_processing_fragment_ftcfl3v7ub) to Node(id, kind)';

COMMENT ON CONSTRAINT "__round_fk_id_f3qoxihsbv" ON "qti"."round" IS 'foreign key Round(id) to Expression(id)';

COMMENT ON CONSTRAINT "__round_fk_id_tag_kind_qti_round_5_eosswhdnh_slr33gqyno" ON "qti"."round" IS 'foreign key Round(id, __tag_kind_qti_round_5eosswhdnh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__round_to_fk_id_6bdnmlefbu" ON "qti"."round_to" IS 'foreign key RoundTo(id) to Expression(id)';

COMMENT ON CONSTRAINT "__round_to_fk_id_tag_kind_qti_round_to_qrylojzgc_7_nrzxzwtn6v" ON "qti"."round_to" IS 'foreign key RoundTo(id, __tag_kind_qti_round_to_qrylojzgc7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__rule_operand_fk_child_7esccijwzc" ON "qti"."rule_operand" IS 'foreign key RuleOperand(child) to Expression(id)';

COMMENT ON CONSTRAINT "__rule_operand_fk_child_rule_position_5w6a3el2wz" ON "qti"."rule_operand" IS 'foreign key RuleOperand(child, rule, position) to Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__rule_operand_fk_rule_rule_kind_4l7dbb3x5o" ON "qti"."rule_operand" IS 'foreign key RuleOperand(rule, ruleKind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__set_correct_response_fk_id_lgg56iessp" ON "qti"."set_correct_response" IS 'foreign key SetCorrectResponse(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__set_correct_response_fk_id_lplfp6sayy" ON "qti"."set_correct_response" IS 'foreign key SetCorrectResponse(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__set_correct_response_fk_id_tag_kind_qti_set_ol5qug2p33" ON "qti"."set_correct_response" IS 'foreign key SetCorrectResponse(id, __tag_kind_qti_set_correct_response_p4ucnvbenj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__set_default_value_fk_id_olvhaapdis" ON "qti"."set_default_value" IS 'foreign key SetDefaultValue(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__set_default_value_fk_id_asetqp7zu7" ON "qti"."set_default_value" IS 'foreign key SetDefaultValue(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__set_default_value_fk_id_tag_kind_qti_set_default_hjxuscwbtz" ON "qti"."set_default_value" IS 'foreign key SetDefaultValue(id, __tag_kind_qti_set_default_value_rj2hosazj5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__set_outcome_value_fk_id_pfrhyv46y7" ON "qti"."set_outcome_value" IS 'foreign key SetOutcomeValue(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__set_outcome_value_fk_id_bumawry4vz" ON "qti"."set_outcome_value" IS 'foreign key SetOutcomeValue(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__set_outcome_value_fk_id_tag_kind_qti_set_outcome_fdk4ivb536" ON "qti"."set_outcome_value" IS 'foreign key SetOutcomeValue(id, __tag_kind_qti_set_outcome_value_h6wjpdpvko) to Node(id, kind)';

COMMENT ON CONSTRAINT "__set_template_value_fk_id_tjdylovby7" ON "qti"."set_template_value" IS 'foreign key SetTemplateValue(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__set_template_value_fk_id_tm6uzya2mc" ON "qti"."set_template_value" IS 'foreign key SetTemplateValue(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__set_template_value_fk_id_tag_kind_qti_set_template_6gjtgeelfk" ON "qti"."set_template_value" IS 'foreign key SetTemplateValue(id, __tag_kind_qti_set_template_value_nb6cflrq6l) to Node(id, kind)';

COMMENT ON CONSTRAINT "__stats_operator_fk_id_y5rf4zqbhe" ON "qti"."stats_operator" IS 'foreign key StatsOperator(id) to Expression(id)';

COMMENT ON CONSTRAINT "__stats_operator_fk_id_tag_kind_qti_stats_operator_x_jzxwnal226" ON "qti"."stats_operator" IS 'foreign key StatsOperator(id, __tag_kind_qti_stats_operator_x5autjgscg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__string_match_fk_id_jq2ajvyvkw" ON "qti"."string_match" IS 'foreign key StringMatch(id) to Expression(id)';

COMMENT ON CONSTRAINT "__string_match_fk_id_tag_kind_qti_string_match_ymwg_vcyzam6xca" ON "qti"."string_match" IS 'foreign key StringMatch(id, __tag_kind_qti_string_match_ymwg654alj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__substring_fk_id_ivk2bfevn6" ON "qti"."substring" IS 'foreign key Substring(id) to Expression(id)';

COMMENT ON CONSTRAINT "__substring_fk_id_tag_kind_qti_substring_j_2_vyby_2_rgl5brzppm" ON "qti"."substring" IS 'foreign key Substring(id, __tag_kind_qti_substring_j2vyby2o5h) to Node(id, kind)';

COMMENT ON CONSTRAINT "__subtract_fk_id_nx6wnhe4si" ON "qti"."subtract" IS 'foreign key Subtract(id) to Expression(id)';

COMMENT ON CONSTRAINT "__subtract_fk_id_tag_kind_qti_subtract_fn_3_f_5_ctuvkqaktb" ON "qti"."subtract" IS 'foreign key Subtract(id, __tag_kind_qti_subtract_fn3f5wibuj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__sum_fk_id_rx5nfmiks4" ON "qti"."sum" IS 'foreign key Sum(id) to Expression(id)';

COMMENT ON CONSTRAINT "__sum_fk_id_tag_kind_qti_sum_2_bm_2_f_65_vor_oavvrxntuo" ON "qti"."sum" IS 'foreign key Sum(id, __tag_kind_qti_sum_2bm2f65vor) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_condition_arm_fk_id_z5j4vsryhz" ON "qti"."template_condition_arm" IS 'foreign key TemplateConditionArm(id) to TemplateIfArm(condition)';

COMMENT ON CONSTRAINT "__template_condition_arm_fk_id_tag_kind_qti_template_arzqxp5ipa" ON "qti"."template_condition_arm" IS 'foreign key TemplateConditionArm(id, __tag_kind_qti_template_condition_5iedsmf35c) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_constraint_fk_id_r6c7e632cr" ON "qti"."template_constraint" IS 'foreign key TemplateConstraint(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__template_constraint_fk_id_tag_kind_qti_template_tjfrdq7dlv" ON "qti"."template_constraint" IS 'foreign key TemplateConstraint(id, __tag_kind_qti_template_constraint_nwjpfefvxc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_else_arm_fk_id_tag_kind_qti_template_else_jakvytlxkn" ON "qti"."template_else_arm" IS 'foreign key TemplateElseArm(id, __tag_kind_qti_template_else_td6wimhp7s) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_else_arm_fk_id_condition_luyzxske2m" ON "qti"."template_else_arm" IS 'foreign key TemplateElseArm(id, condition) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__template_else_if_arm_fk_id_hmxk5riuwv" ON "qti"."template_else_if_arm" IS 'foreign key TemplateElseIfArm(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__template_else_if_arm_fk_id_tag_kind_qti_template_r2fxuxzf72" ON "qti"."template_else_if_arm" IS 'foreign key TemplateElseIfArm(id, __tag_kind_qti_template_else_if_xkgqxjlgvf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_if_arm_fk_condition_4y7sbcvmtj" ON "qti"."template_if_arm" IS 'foreign key TemplateIfArm(condition) to TemplateConditionArm(id)';

COMMENT ON CONSTRAINT "__template_if_arm_fk_id_gmp35rspej" ON "qti"."template_if_arm" IS 'foreign key TemplateIfArm(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__template_if_arm_fk_id_tag_kind_qti_template_if_kdp_cqqvjgrgzg" ON "qti"."template_if_arm" IS 'foreign key TemplateIfArm(id, __tag_kind_qti_template_if_kdp2hjyxni) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_if_arm_fk_id_condition_q36sv5r4ug" ON "qti"."template_if_arm" IS 'foreign key TemplateIfArm(id, condition) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__template_processing_fk_id_tag_kind_qti_template_ugnev7dg4d" ON "qti"."template_processing" IS 'foreign key TemplateProcessing(id, __tag_kind_qti_template_processing_julsyuopii) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_processing_fk_id_item_7fu36bhszp" ON "qti"."template_processing" IS 'foreign key TemplateProcessing(id, item) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__template_processing_fk_item_b6ae2itijo" ON "qti"."template_processing" IS 'foreign key TemplateProcessing(item) to AssessmentItem(id)';

COMMENT ON CONSTRAINT "__test_variables_fk_id_e6yrgko5ch" ON "qti"."test_variables" IS 'foreign key TestVariables(id) to Expression(id)';

COMMENT ON CONSTRAINT "__test_variables_fk_id_tag_kind_qti_test_variables_5pron4hsut" ON "qti"."test_variables" IS 'foreign key TestVariables(id, __tag_kind_qti_test_variables_ssteaad3nd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__test_variables_base_type_fk_node_viobp7iox3" ON "qti"."test_variables_base_type" IS 'foreign key TestVariablesBaseType(node) to TestVariables(id)';

COMMENT ON CONSTRAINT "__truncate_fk_id_7pvxp2mxsf" ON "qti"."truncate" IS 'foreign key Truncate(id) to Expression(id)';

COMMENT ON CONSTRAINT "__truncate_fk_id_tag_kind_qti_truncate_vkai_3_xtk_23_ain5obud4q" ON "qti"."truncate" IS 'foreign key Truncate(id, __tag_kind_qti_truncate_vkai3xtk23) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variable_fk_id_4qrpe3j6x3" ON "qti"."variable" IS 'foreign key Variable(id) to Expression(id)';

COMMENT ON CONSTRAINT "__variable_fk_id_lva6pkmnaw" ON "qti"."variable" IS 'foreign key Variable(id) to VariableRef(id)';

COMMENT ON CONSTRAINT "__variable_fk_id_tag_kind_qti_variable_obgp_52_jplg_fefvglcgp2" ON "qti"."variable" IS 'foreign key Variable(id, __tag_kind_qti_variable_obgp52jplg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variable_weight_identifier_fk_node_uxqmpfxmjf" ON "qti"."variable_weight_identifier" IS 'foreign key VariableWeightIdentifier(node) to Variable(id)';

COMMENT ON CONSTRAINT "__variable_weight_identifier_fk_node_root_kind_xvoekdwiqu" ON "qti"."variable_weight_identifier" IS 'foreign key VariableWeightIdentifier(node, rootKind) to Node(id, rootKind)';

COMMENT ON CONSTRAINT "__x_include_fk_id_tag_kind_xi_include_tnsd_6_wpc_7_o_o3evvlk3on" ON "qti"."x_include" IS 'foreign key XInclude(id, __tag_kind_xi_include_tnsd6wpc7o) to Node(id, kind)';

COMMENT ON CONSTRAINT "__x_include_accept_fk_node_hlrbyjbj4b" ON "qti"."x_include_accept" IS 'foreign key XIncludeAccept(node) to XInclude(id)';

COMMENT ON CONSTRAINT "__x_include_accept_language_fk_node_22obtslbu6" ON "qti"."x_include_accept_language" IS 'foreign key XIncludeAcceptLanguage(node) to XInclude(id)';

COMMENT ON CONSTRAINT "__x_include_encoding_fk_node_wr4gpsamg5" ON "qti"."x_include_encoding" IS 'foreign key XIncludeEncoding(node) to XInclude(id)';

COMMENT ON CONSTRAINT "__x_include_href_fk_node_ria6nowp77" ON "qti"."x_include_href" IS 'foreign key XIncludeHref(node) to XInclude(id)';

COMMENT ON CONSTRAINT "__x_include_parse_fk_node_boyx4sfcrs" ON "qti"."x_include_parse" IS 'foreign key XIncludeParse(node) to XInclude(id)';

COMMENT ON CONSTRAINT "__x_include_xpointer_fk_node_2ugojdzhfl" ON "qti"."x_include_xpointer" IS 'foreign key XIncludeXpointer(node) to XInclude(id)';

COMMENT ON TRIGGER "__law_node_kind_alternatives_37mn75zlv6" ON "qti"."and" IS 'trigger of law alternatives of Node.kind on And';

COMMENT ON TRIGGER "__law_node_kind_alternatives_enkrobv7su" ON "qti"."any_n" IS 'trigger of law alternatives of Node.kind on AnyN';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5skm7kkgib" ON "qti"."assessment_item" IS 'trigger of law alternatives of Node.kind on AssessmentItem';

COMMENT ON TRIGGER "__law_node_kind_alternatives_upkyeydjz7" ON "qti"."choice_interaction" IS 'trigger of law alternatives of Node.kind on ChoiceInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_py43thbsit" ON "qti"."comment" IS 'trigger of law alternatives of Node.kind on Comment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zusrsittei" ON "qti"."container_size" IS 'trigger of law alternatives of Node.kind on ContainerSize';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fcn4ljer3c" ON "qti"."contains" IS 'trigger of law alternatives of Node.kind on Contains';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6yhav47k3n" ON "qti"."correct" IS 'trigger of law alternatives of Node.kind on Correct';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ikfqexnafy" ON "qti"."correct_response_arm" IS 'trigger of law alternatives of Node.kind on CorrectResponseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xfck4aqqou" ON "qti"."custom_operator" IS 'trigger of law alternatives of Node.kind on CustomOperator';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5vhdpgz25" ON "qti"."declared_value" IS 'trigger of law alternatives of Node.kind on DeclaredValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_a2g6hsjz3y" ON "qti"."default" IS 'trigger of law alternatives of Node.kind on Default';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ssrxqpoval" ON "qti"."default_value_arm" IS 'trigger of law alternatives of Node.kind on DefaultValueArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_62wn4o7qqc" ON "qti"."delete" IS 'trigger of law alternatives of Node.kind on Delete';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6td2gbd75c" ON "qti"."dependency" IS 'trigger of law alternatives of Node.kind on Dependency';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ub225oyu52" ON "qti"."divide" IS 'trigger of law alternatives of Node.kind on Divide';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xetkscpi64" ON "qti"."duration_gte" IS 'trigger of law alternatives of Node.kind on DurationGte';

COMMENT ON TRIGGER "__law_node_kind_alternatives_a725iairvb" ON "qti"."duration_lt" IS 'trigger of law alternatives of Node.kind on DurationLt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xuefsrgzju" ON "qti"."entity_reference" IS 'trigger of law alternatives of Node.kind on EntityReference';

COMMENT ON TRIGGER "__law_node_kind_alternatives_42jl7ga7vq" ON "qti"."equal" IS 'trigger of law alternatives of Node.kind on Equal';

COMMENT ON TRIGGER "__law_equal_tolerance_mode_absolute_in_equal_v3pcmab2xz" ON "qti"."equal" IS 'trigger of law Equal(id) where toleranceMode = "absolute" in EqualTolerance(node) on Equal';

COMMENT ON TRIGGER "__law_equal_tolerance_mode_relative_in_equal_qmnxmcichh" ON "qti"."equal" IS 'trigger of law Equal(id) where toleranceMode = "relative" in EqualTolerance(node) on Equal';

COMMENT ON TRIGGER "__law_node_kind_alternatives_d2v2qogal2" ON "qti"."equal_rounded" IS 'trigger of law alternatives of Node.kind on EqualRounded';

COMMENT ON TRIGGER "__law_equal_tolerance_mode_absolute_in_equal_aczcto3mys" ON "qti"."equal_tolerance" IS 'trigger of law Equal(id) where toleranceMode = "absolute" in EqualTolerance(node) on EqualTolerance';

COMMENT ON TRIGGER "__law_equal_tolerance_mode_relative_in_equal_42rjsdc5i5" ON "qti"."equal_tolerance" IS 'trigger of law Equal(id) where toleranceMode = "relative" in EqualTolerance(node) on EqualTolerance';

COMMENT ON TRIGGER "__law_node_kind_alternatives_jvfc675pvw" ON "qti"."exit_response" IS 'trigger of law alternatives of Node.kind on ExitResponse';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5q6jhxxrz" ON "qti"."exit_template" IS 'trigger of law alternatives of Node.kind on ExitTemplate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2llobzpqtx" ON "qti"."exit_test" IS 'trigger of law alternatives of Node.kind on ExitTest';

COMMENT ON TRIGGER "__law_node_kind_alternatives_gn5vugm5uh" ON "qti"."fallback" IS 'trigger of law alternatives of Node.kind on Fallback';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bljunbv6a4" ON "qti"."field_value" IS 'trigger of law alternatives of Node.kind on FieldValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oxdcy2a5y4" ON "qti"."file" IS 'trigger of law alternatives of Node.kind on File';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bez7fcvlw4" ON "qti"."gcd" IS 'trigger of law alternatives of Node.kind on Gcd';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qwr45dw7qd" ON "qti"."gt" IS 'trigger of law alternatives of Node.kind on Gt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ohukgvxpdy" ON "qti"."gte" IS 'trigger of law alternatives of Node.kind on Gte';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qi3e3sk75r" ON "qti"."img" IS 'trigger of law alternatives of Node.kind on Img';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bfzvmmamlz" ON "qti"."index" IS 'trigger of law alternatives of Node.kind on Index';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kukhsehhdl" ON "qti"."inside" IS 'trigger of law alternatives of Node.kind on Inside';

COMMENT ON TRIGGER "__law_node_kind_alternatives_socy7oqpoa" ON "qti"."integer_divide" IS 'trigger of law alternatives of Node.kind on IntegerDivide';

COMMENT ON TRIGGER "__law_node_kind_alternatives_h4jlohqiza" ON "qti"."integer_modulus" IS 'trigger of law alternatives of Node.kind on IntegerModulus';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zi63opktkz" ON "qti"."integer_to_float" IS 'trigger of law alternatives of Node.kind on IntegerToFloat';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bedqyw6apz" ON "qti"."is_null" IS 'trigger of law alternatives of Node.kind on IsNull';

COMMENT ON TRIGGER "__law_node_kind_alternatives_smgee6gejq" ON "qti"."item_body" IS 'trigger of law alternatives of Node.kind on ItemBody';

COMMENT ON TRIGGER "__law_node_kind_alternatives_enva3mtyiu" ON "qti"."lcm" IS 'trigger of law alternatives of Node.kind on Lcm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qx5kbifnra" ON "qti"."literal" IS 'trigger of law alternatives of Node.kind on Literal';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_5atjkt54uj" ON "qti"."lom_identifier" IS 'trigger of law alternatives of Node.kind on LomIdentifier';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_jawlfyawy3" ON "qti"."lookup_outcome_value" IS 'trigger of law alternatives of Node.kind on LookupOutcomeValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dyx73lsfkj" ON "qti"."lt" IS 'trigger of law alternatives of Node.kind on Lt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cm5ghdvymu" ON "qti"."lte" IS 'trigger of law alternatives of Node.kind on Lte';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ipuymtixeh" ON "qti"."manifest_metadata" IS 'trigger of law alternatives of Node.kind on ManifestMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_k3727kgr4f" ON "qti"."manifest_schema" IS 'trigger of law alternatives of Node.kind on ManifestSchema';

COMMENT ON TRIGGER "__law_node_kind_alternatives_edwin77ceo" ON "qti"."manifest_schema_version" IS 'trigger of law alternatives of Node.kind on ManifestSchemaVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_brzxsqukvm" ON "qti"."map_response" IS 'trigger of law alternatives of Node.kind on MapResponse';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mjhfl3wyl7" ON "qti"."map_response_point" IS 'trigger of law alternatives of Node.kind on MapResponsePoint';

COMMENT ON TRIGGER "__law_node_kind_alternatives_usuabdsung" ON "qti"."match" IS 'trigger of law alternatives of Node.kind on Match';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tpsysay6ib" ON "qti"."math_constant" IS 'trigger of law alternatives of Node.kind on MathConstant';

COMMENT ON TRIGGER "__law_node_kind_alternatives_omsmksa6kz" ON "qti"."math_operator" IS 'trigger of law alternatives of Node.kind on MathOperator';

COMMENT ON TRIGGER "__law_node_kind_alternatives_q65ea36mmv" ON "qti"."max" IS 'trigger of law alternatives of Node.kind on Max';

COMMENT ON TRIGGER "__law_node_kind_alternatives_a5aejjzoon" ON "qti"."member" IS 'trigger of law alternatives of Node.kind on Member';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7nh7liv5xs" ON "qti"."min" IS 'trigger of law alternatives of Node.kind on Min';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dvuizi4td3" ON "qti"."multiple" IS 'trigger of law alternatives of Node.kind on Multiple';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sv4lck5ue6" ON "qti"."node" IS 'trigger of law alternatives of Node.kind on Node';

COMMENT ON TRIGGER "__law_node_kind_alternatives_yvsiznlbf3" ON "qti"."not" IS 'trigger of law alternatives of Node.kind on Not';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4ged6socq3" ON "qti"."null" IS 'trigger of law alternatives of Node.kind on Null';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bizaob5zum" ON "qti"."number_correct" IS 'trigger of law alternatives of Node.kind on NumberCorrect';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xm2tvblysw" ON "qti"."number_incorrect" IS 'trigger of law alternatives of Node.kind on NumberIncorrect';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fdsa37gu2r" ON "qti"."number_presented" IS 'trigger of law alternatives of Node.kind on NumberPresented';

COMMENT ON TRIGGER "__law_node_kind_alternatives_uqp5526nsp" ON "qti"."number_responded" IS 'trigger of law alternatives of Node.kind on NumberResponded';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vztuzzvdxa" ON "qti"."number_selected" IS 'trigger of law alternatives of Node.kind on NumberSelected';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zpcbcbgfyt" ON "qti"."or" IS 'trigger of law alternatives of Node.kind on Or';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pixiy5rev2" ON "qti"."ordered" IS 'trigger of law alternatives of Node.kind on Ordered';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bv75ttdv6d" ON "qti"."organizations" IS 'trigger of law alternatives of Node.kind on Organizations';

COMMENT ON TRIGGER "__law_node_kind_alternatives_gfvnndzdfi" ON "qti"."outcome_condition_arm" IS 'trigger of law alternatives of Node.kind on OutcomeConditionArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qhu3dxqvfw" ON "qti"."outcome_declaration_arm" IS 'trigger of law alternatives of Node.kind on OutcomeDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tsxsqatw2g" ON "qti"."outcome_else_arm" IS 'trigger of law alternatives of Node.kind on OutcomeElseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wrwokfflhq" ON "qti"."outcome_else_if_arm" IS 'trigger of law alternatives of Node.kind on OutcomeElseIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kkjppxh6t2" ON "qti"."outcome_if_arm" IS 'trigger of law alternatives of Node.kind on OutcomeIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ivq2q3ajct" ON "qti"."outcome_maximum_arm" IS 'trigger of law alternatives of Node.kind on OutcomeMaximumArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wvykqitc5y" ON "qti"."outcome_minimum_arm" IS 'trigger of law alternatives of Node.kind on OutcomeMinimumArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_up3wt37aol" ON "qti"."outcome_processing" IS 'trigger of law alternatives of Node.kind on OutcomeProcessing';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mkubqmpv44" ON "qti"."outcome_processing_fragment" IS 'trigger of law alternatives of Node.kind on OutcomeProcessingFragment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3psrbuzkn3" ON "qti"."p" IS 'trigger of law alternatives of Node.kind on P';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nmhjri6454" ON "qti"."package" IS 'trigger of law alternatives of Node.kind on Package';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bz6ds4ncee" ON "qti"."pattern_match" IS 'trigger of law alternatives of Node.kind on PatternMatch';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rsadoosbdw" ON "qti"."pi" IS 'trigger of law alternatives of Node.kind on Pi';

COMMENT ON TRIGGER "__law_node_kind_alternatives_hpby5bq4cc" ON "qti"."power" IS 'trigger of law alternatives of Node.kind on Power';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bhgdigxnzg" ON "qti"."product" IS 'trigger of law alternatives of Node.kind on Product';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_vhit6soubo" ON "qti"."random" IS 'trigger of law alternatives of Node.kind on Random';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oslb6utu36" ON "qti"."random_float" IS 'trigger of law alternatives of Node.kind on RandomFloat';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wowrdjb74h" ON "qti"."random_integer" IS 'trigger of law alternatives of Node.kind on RandomInteger';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sshvgjxpzu" ON "qti"."repeat" IS 'trigger of law alternatives of Node.kind on Repeat';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j53oleenel" ON "qti"."resource" IS 'trigger of law alternatives of Node.kind on Resource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rzmuape27g" ON "qti"."resource_metadata" IS 'trigger of law alternatives of Node.kind on ResourceMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rqsqvzbn2g" ON "qti"."resources" IS 'trigger of law alternatives of Node.kind on Resources';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xtrmkdein7" ON "qti"."response_condition_arm" IS 'trigger of law alternatives of Node.kind on ResponseConditionArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_p5egrc7ys2" ON "qti"."response_declaration_arm" IS 'trigger of law alternatives of Node.kind on ResponseDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_s3qy6el6cr" ON "qti"."response_else_arm" IS 'trigger of law alternatives of Node.kind on ResponseElseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oq4pjdntgk" ON "qti"."response_else_if_arm" IS 'trigger of law alternatives of Node.kind on ResponseElseIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_23p7gy2l6v" ON "qti"."response_if_arm" IS 'trigger of law alternatives of Node.kind on ResponseIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ob7fyfvlkb" ON "qti"."response_processing" IS 'trigger of law alternatives of Node.kind on ResponseProcessing';

COMMENT ON TRIGGER "__law_node_kind_alternatives_v4xia4pdlk" ON "qti"."response_processing_fragment" IS 'trigger of law alternatives of Node.kind on ResponseProcessingFragment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mmzukmexfn" ON "qti"."round" IS 'trigger of law alternatives of Node.kind on Round';

COMMENT ON TRIGGER "__law_node_kind_alternatives_gngbcmilz2" ON "qti"."round_to" IS 'trigger of law alternatives of Node.kind on RoundTo';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5tmibfhypw" ON "qti"."set_correct_response" IS 'trigger of law alternatives of Node.kind on SetCorrectResponse';

COMMENT ON TRIGGER "__law_node_kind_alternatives_q36wwhwxtq" ON "qti"."set_default_value" IS 'trigger of law alternatives of Node.kind on SetDefaultValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ulw6kxgum6" ON "qti"."set_outcome_value" IS 'trigger of law alternatives of Node.kind on SetOutcomeValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sfxqtewzr2" ON "qti"."set_template_value" IS 'trigger of law alternatives of Node.kind on SetTemplateValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mp3irnnixf" ON "qti"."simple_choice" IS 'trigger of law alternatives of Node.kind on SimpleChoice';

COMMENT ON TRIGGER "__law_node_kind_alternatives_smnwa6u5cu" ON "qti"."stats_operator" IS 'trigger of law alternatives of Node.kind on StatsOperator';

COMMENT ON TRIGGER "__law_node_kind_alternatives_frv6y4ptvd" ON "qti"."string_match" IS 'trigger of law alternatives of Node.kind on StringMatch';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2lwrhumony" ON "qti"."substring" IS 'trigger of law alternatives of Node.kind on Substring';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7psbud4cz2" ON "qti"."subtract" IS 'trigger of law alternatives of Node.kind on Subtract';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bl2t2knygh" ON "qti"."sum" IS 'trigger of law alternatives of Node.kind on Sum';

COMMENT ON TRIGGER "__law_node_kind_alternatives_gngplvjki7" ON "qti"."template_condition_arm" IS 'trigger of law alternatives of Node.kind on TemplateConditionArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5fdgy2jheo" ON "qti"."template_constraint" IS 'trigger of law alternatives of Node.kind on TemplateConstraint';

COMMENT ON TRIGGER "__law_node_kind_alternatives_y6lrwlh2rd" ON "qti"."template_else_arm" IS 'trigger of law alternatives of Node.kind on TemplateElseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ho4ol55qrl" ON "qti"."template_else_if_arm" IS 'trigger of law alternatives of Node.kind on TemplateElseIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_i5wd6p3avp" ON "qti"."template_if_arm" IS 'trigger of law alternatives of Node.kind on TemplateIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7xb37ile3r" ON "qti"."template_processing" IS 'trigger of law alternatives of Node.kind on TemplateProcessing';

COMMENT ON TRIGGER "__law_node_kind_alternatives_w5lbqmj6id" ON "qti"."test_variables" IS 'trigger of law alternatives of Node.kind on TestVariables';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dhvs325itr" ON "qti"."text_node" IS 'trigger of law alternatives of Node.kind on TextNode';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4qidad7cp6" ON "qti"."truncate" IS 'trigger of law alternatives of Node.kind on Truncate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_z7pc5podx4" ON "qti"."variable" IS 'trigger of law alternatives of Node.kind on Variable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qra75t5mkw" ON "qti"."ws" IS 'trigger of law alternatives of Node.kind on Ws';

COMMENT ON TRIGGER "__law_node_kind_alternatives_yod7eg5ohq" ON "qti"."x_include" IS 'trigger of law alternatives of Node.kind on XInclude';
