REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_ojm4wya66v", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."entity_reference", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."operand", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."ws" FROM "qti__author";

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

GRANT USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xarz6cej2e", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_4f3dzz6i4f", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ojm4wya66v", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_ukaaxf45sk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_access_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_access_mode_adapted" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_adaptation_detail" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_adaptation_media_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_adaptation_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_api_interoperable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_at_interoperable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_control_flexibility" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_display_transformability" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_educational_complexity_of_adaptation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_educational_level_of_adaptation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_has_adaptation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_hazard" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_is_adaptation_of" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_is_full_adaptation_of" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_is_partial_adaptation_of" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drd_language_of_adaptation" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_manifest" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_variant" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_node" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ws" TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) TO "qti__author";

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."access_for_all_resource", "qti"."admission", "qti"."assessment_item", "qti"."attribute_entity_reference", "qti"."attribute_lexical", "qti"."binding_fit", "qti"."built_in_ref", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."comment", "qti"."correct_response_arm", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_fixed", "qti"."declared_max_choices", "qti"."declared_min_choices", "qti"."declared_orientation", "qti"."declared_ref", "qti"."declared_show_hide", "qti"."declared_shuffle", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."default_value_arm", "qti"."dependency", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_title", "qti"."drd_access_mode", "qti"."drd_access_mode_adapted", "qti"."drd_adaptation_detail", "qti"."drd_adaptation_media_type", "qti"."drd_adaptation_type", "qti"."drd_api_interoperable", "qti"."drd_at_interoperable", "qti"."drd_control_flexibility", "qti"."drd_display_transformability", "qti"."drd_educational_complexity_of_adaptation", "qti"."drd_educational_level_of_adaptation", "qti"."drd_has_adaptation", "qti"."drd_hazard", "qti"."drd_is_adaptation_of", "qti"."drd_is_full_adaptation_of", "qti"."drd_is_partial_adaptation_of", "qti"."drd_language_of_adaptation", "qti"."edge", "qti"."entity_reference", "qti"."expression", "qti"."file", "qti"."file_content", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."interaction_binding", "qti"."item_body", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_entity", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_keyword", "qti"."lom_language", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_requirement", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_size", "qti"."lom_source", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_value", "qti"."lom_version", "qti"."manifest", "qti"."manifest_id", "qti"."manifest_id_of_manifest", "qti"."manifest_id_of_resource", "qti"."manifest_id_of_variant", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."namespace_declaration", "qti"."node", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."organizations", "qti"."outcome_declaration_arm", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."pi", "qti"."prompt", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_metadata", "qti"."record_binding", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_identified", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_processing", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."schema_location", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."standard_template_reference", "qti"."text_node", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."value_set", "qti"."value_set_interpretation", "qti"."variable_ref", "qti"."variant", "qti"."variant_metadata", "qti"."ws", "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_cz7v66q3ce", "qti"."__text_raisrajgpi", "qti"."__text_rhdrzkabze", "qti"."__text_kqeswaav46", "qti"."__text_clza6vokfo", "qti"."__text_yakcqa4zli", "qti"."__text_6uwfpnix5n", "qti"."__text_k3z6naurdo", "qti"."__text_jld3q663or", "qti"."__text_f63vbnbw4t", "qti"."__text_d72l462ftm", "qti"."__text_qtkbmkpj6l", "qti"."__text_7grqskvjta", "qti"."__text_c34ec7mxid", "qti"."__text_tyjqwtj7ky", "qti"."__text_2dix7luqoi", "qti"."__text_4f3dzz6i4f", "qti"."__text_sa4c4ywp5v", "qti"."__text_2rz6hgcvt2", "qti"."__text_4adkkv4wal", "qti"."__text_xarz6cej2e", "qti"."__text_lsy6pxooea", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ukaaxf45sk", "qti"."__text_tso7kvy6dv", "qti"."__text_ifp42a6zk6", "qti"."__text_7mulu52tr6", "qti"."__text_ieskz75v7g", "qti"."__text_popyschjwc", "qti"."__text_betq2bg2bg", "qti"."__text_qyq7zjychy", "qti"."__text_httzcaefcn", "qti"."__text_mvg26oprvk", "qti"."__text_f3hdif3553", "qti"."__text_ojm4wya66v", "qti"."__text_pftpnuhm3d", "qti"."__text_i67gmkzdk7", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_uia6zcss44", "qti"."__text_r5xluaej3z", "qti"."__text_ottycep7en" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

COMMENT ON DOMAIN "qti"."__text_4adkkv4wal" IS 'text pattern 17d13e84935acd5517a0ee39b738838fd5a3baeefc6548245ceff8382bee8ecd';

COMMENT ON DOMAIN "qti"."__text_xarz6cej2e" IS 'text pattern 56d2afc74476eeb75322323a34b164a1b1e2ed2a3147d8bef4db1ddb2115ffc9';

COMMENT ON DOMAIN "qti"."__text_4f3dzz6i4f" IS 'text pattern 6c2d1be35dd0906e4f02fc31c0c3e290335fb7a662002f8266fd530ba9f5b5cf';

COMMENT ON DOMAIN "qti"."__text_sa4c4ywp5v" IS 'text pattern 90ce6171956d556f50871e036b47c2e07e54d8596408457b9790a7129be7dabb';

COMMENT ON DOMAIN "qti"."__text_lsy6pxooea" IS 'text pattern 93e4e5ef0da0e7d97452f38155c3e0edff2cdd74fcb75276970f5e934da9508f';

COMMENT ON DOMAIN "qti"."__text_d46tbgbbco" IS 'text pattern bfed332c6cc1252a21a4fcdaff955a3990e205d763a03e20040a9e63dc1ee24c';

COMMENT ON DOMAIN "qti"."__text_3zzmpysrx3" IS 'text pattern c14feedd3aeccaab6526afd03d4f9813d8e890119d5814e931a0c55d63593310';

COMMENT ON DOMAIN "qti"."__text_ukaaxf45sk" IS 'text pattern d3264bc6c0e69a9f9671c10acd5a47dd40d7b6e45106fed0de1e45e5f5c37331';

COMMENT ON DOMAIN "qti"."__text_2rz6hgcvt2" IS 'text pattern ee812d879d96b9563c7632fd883386f52d77277cc65c60d548043670e669d466';

COMMENT ON FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"() IS 'function of law alternatives of ManifestId.holder';

COMMENT ON FUNCTION "qti"."__law_node_kind_alternatives_vfnu4bvxbc"() IS 'function of law alternatives of Node.kind';

COMMENT ON FUNCTION "qti"."__law_variant_capacity_variant_metadata_lmpypa4kyp"() IS 'function of law capacity of Variant(id) over VariantMetadata(variant) within 1..1';

COMMENT ON FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_sz5fyljxxa"() IS 'function of law capacity of VariantMetadata(id) over AccessForAllResource(metadata) within 1..1';

COMMENT ON CONSTRAINT "__access_for_all_resource_pk_kr5wpjf4ev" ON "qti"."access_for_all_resource" IS 'primary key of AccessForAllResource';

COMMENT ON CONSTRAINT "__access_for_all_resource_key_metadata_eocm4jdfj5" ON "qti"."access_for_all_resource" IS 'key AccessForAllResource(metadata)';

COMMENT ON CONSTRAINT "__drd_access_mode_pk_eab4ksn3t5" ON "qti"."drd_access_mode" IS 'primary key of DrdAccessMode';

COMMENT ON CONSTRAINT "__drd_access_mode_adapted_pk_egxqwzwqtu" ON "qti"."drd_access_mode_adapted" IS 'primary key of DrdAccessModeAdapted';

COMMENT ON CONSTRAINT "__drd_adaptation_detail_pk_jaiktkxtd5" ON "qti"."drd_adaptation_detail" IS 'primary key of DrdAdaptationDetail';

COMMENT ON CONSTRAINT "__drd_adaptation_media_type_pk_laoj4yvrwz" ON "qti"."drd_adaptation_media_type" IS 'primary key of DrdAdaptationMediaType';

COMMENT ON CONSTRAINT "__drd_adaptation_type_pk_hfpnvjly2m" ON "qti"."drd_adaptation_type" IS 'primary key of DrdAdaptationType';

COMMENT ON CONSTRAINT "__drd_api_interoperable_pk_piemed6yeo" ON "qti"."drd_api_interoperable" IS 'primary key of DrdApiInteroperable';

COMMENT ON CONSTRAINT "__drd_at_interoperable_pk_d3v7xsw5ur" ON "qti"."drd_at_interoperable" IS 'primary key of DrdAtInteroperable';

COMMENT ON CONSTRAINT "__drd_at_interoperable_key_owner_p2miwggcue" ON "qti"."drd_at_interoperable" IS 'key DrdAtInteroperable(owner)';

COMMENT ON CONSTRAINT "__drd_control_flexibility_pk_4khcglwnjo" ON "qti"."drd_control_flexibility" IS 'primary key of DrdControlFlexibility';

COMMENT ON CONSTRAINT "__drd_display_transformability_pk_slrde5ougf" ON "qti"."drd_display_transformability" IS 'primary key of DrdDisplayTransformability';

COMMENT ON CONSTRAINT "__drd_educational_complexity_of_adaptation_pk_5wijuzqco5" ON "qti"."drd_educational_complexity_of_adaptation" IS 'primary key of DrdEducationalComplexityOfAdaptation';

COMMENT ON CONSTRAINT "__drd_educational_complexity_of_adaptation_key_owner_2a7j3lt6az" ON "qti"."drd_educational_complexity_of_adaptation" IS 'key DrdEducationalComplexityOfAdaptation(owner)';

COMMENT ON CONSTRAINT "__drd_educational_level_of_adaptation_pk_7plz4utccw" ON "qti"."drd_educational_level_of_adaptation" IS 'primary key of DrdEducationalLevelOfAdaptation';

COMMENT ON CONSTRAINT "__drd_has_adaptation_pk_verlwmupji" ON "qti"."drd_has_adaptation" IS 'primary key of DrdHasAdaptation';

COMMENT ON CONSTRAINT "__drd_hazard_pk_3uqy5jjtai" ON "qti"."drd_hazard" IS 'primary key of DrdHazard';

COMMENT ON CONSTRAINT "__drd_is_adaptation_of_pk_q5eggfejhg" ON "qti"."drd_is_adaptation_of" IS 'primary key of DrdIsAdaptationOf';

COMMENT ON CONSTRAINT "__drd_is_full_adaptation_of_pk_h5i46jurdg" ON "qti"."drd_is_full_adaptation_of" IS 'primary key of DrdIsFullAdaptationOf';

COMMENT ON CONSTRAINT "__drd_is_partial_adaptation_of_pk_h26cxdkvet" ON "qti"."drd_is_partial_adaptation_of" IS 'primary key of DrdIsPartialAdaptationOf';

COMMENT ON CONSTRAINT "__drd_language_of_adaptation_pk_rotg7tsgr6" ON "qti"."drd_language_of_adaptation" IS 'primary key of DrdLanguageOfAdaptation';

COMMENT ON CONSTRAINT "__manifest_id_pk_qzrdp24pyf" ON "qti"."manifest_id" IS 'primary key of ManifestId';

COMMENT ON CONSTRAINT "__manifest_id_key_package_id_holder_3bmpkpiao7" ON "qti"."manifest_id" IS 'key ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__manifest_id_of_manifest_pk_hll6ulewxl" ON "qti"."manifest_id_of_manifest" IS 'primary key of ManifestIdOfManifest';

COMMENT ON CONSTRAINT "__manifest_id_of_resource_pk_neqjtae66j" ON "qti"."manifest_id_of_resource" IS 'primary key of ManifestIdOfResource';

COMMENT ON CONSTRAINT "__manifest_id_of_variant_pk_mgmrbimez5" ON "qti"."manifest_id_of_variant" IS 'primary key of ManifestIdOfVariant';

COMMENT ON CONSTRAINT "__package_key_id_identifier_udumz3ewib" ON "qti"."package" IS 'key Package(id, identifier)';

COMMENT ON CONSTRAINT "__resource_key_id_package_identifier_jx53gsgn4j" ON "qti"."resource" IS 'key Resource(id, package, identifier)';

COMMENT ON CONSTRAINT "__variant_pk_2v76wn4lby" ON "qti"."variant" IS 'primary key of Variant';

COMMENT ON CONSTRAINT "__variant_key_package_identifier_ydffbrgs2g" ON "qti"."variant" IS 'key Variant(package, identifier)';

COMMENT ON CONSTRAINT "__variant_metadata_pk_vsyvrlpnm2" ON "qti"."variant_metadata" IS 'primary key of VariantMetadata';

COMMENT ON CONSTRAINT "__variant_metadata_key_variant_7uhcph353w" ON "qti"."variant_metadata" IS 'key VariantMetadata(variant)';

COMMENT ON COLUMN "qti"."access_for_all_resource"."__tag_kind_drd_access_for_all_resource_dcvrnrucvz" IS 'tag Node.kind = drd:accessForAllResource';

COMMENT ON COLUMN "qti"."drd_access_mode"."__tag_kind_drd_access_mode_njghsaxgib" IS 'tag Node.kind = drd:accessMode';

COMMENT ON COLUMN "qti"."drd_access_mode_adapted"."__tag_kind_drd_access_mode_adapted_6n47kwzvq4" IS 'tag Node.kind = drd:accessModeAdapted';

COMMENT ON COLUMN "qti"."drd_adaptation_detail"."__tag_kind_drd_adaptation_detail_q4chm2z7fd" IS 'tag Node.kind = drd:adaptationDetail';

COMMENT ON COLUMN "qti"."drd_adaptation_media_type"."__tag_kind_drd_adaptation_media_type_ms4x34iisf" IS 'tag Node.kind = drd:adaptationMediaType';

COMMENT ON COLUMN "qti"."drd_adaptation_type"."__tag_kind_drd_adaptation_type_cr4axc6ol7" IS 'tag Node.kind = drd:adaptationType';

COMMENT ON COLUMN "qti"."drd_api_interoperable"."__tag_kind_drd_api_interoperable_qnxbi5kb5p" IS 'tag Node.kind = drd:apiInteroperable';

COMMENT ON COLUMN "qti"."drd_at_interoperable"."__tag_kind_drd_at_interoperable_zjkivbnkxx" IS 'tag Node.kind = drd:atInteroperable';

COMMENT ON COLUMN "qti"."drd_control_flexibility"."__tag_kind_drd_control_flexibility_ogpln6c34g" IS 'tag Node.kind = drd:controlFlexibility';

COMMENT ON COLUMN "qti"."drd_display_transformability"."__tag_kind_drd_display_transformability_hlcmwybrbn" IS 'tag Node.kind = drd:displayTransformability';

COMMENT ON COLUMN "qti"."drd_educational_complexity_of_adaptation"."__tag_kind_drd_educational_complexity_of_adaptation_mfzwmr74m2" IS 'tag Node.kind = drd:educationalComplexityOfAdaptation';

COMMENT ON COLUMN "qti"."drd_educational_level_of_adaptation"."__tag_kind_drd_educational_level_of_adaptation_ezcznxqajt" IS 'tag Node.kind = drd:educationalLevelOfAdaptation';

COMMENT ON COLUMN "qti"."drd_has_adaptation"."__tag_kind_drd_has_adaptation_4x7nx53hok" IS 'tag Node.kind = drd:hasAdaptation';

COMMENT ON COLUMN "qti"."drd_hazard"."__tag_kind_drd_hazard_3n5ihtfyij" IS 'tag Node.kind = drd:hazard';

COMMENT ON COLUMN "qti"."drd_is_adaptation_of"."__tag_kind_drd_is_adaptation_of_viq3qn3bmy" IS 'tag Node.kind = drd:isAdaptationOf';

COMMENT ON COLUMN "qti"."drd_is_full_adaptation_of"."__tag_kind_drd_is_full_adaptation_of_tvwox3ztrp" IS 'tag Node.kind = drd:isFullAdaptationOf';

COMMENT ON COLUMN "qti"."drd_is_partial_adaptation_of"."__tag_kind_drd_is_partial_adaptation_of_5ojegjo7cp" IS 'tag Node.kind = drd:isPartialAdaptationOf';

COMMENT ON COLUMN "qti"."drd_language_of_adaptation"."__tag_kind_drd_language_of_adaptation_p3eiulmmnm" IS 'tag Node.kind = drd:languageOfAdaptation';

COMMENT ON COLUMN "qti"."manifest_id_of_manifest"."__tag_holder_manifest_7wghkxashe" IS 'tag ManifestId.holder = manifest';

COMMENT ON COLUMN "qti"."manifest_id_of_resource"."__tag_holder_resource_3lbxhuqadk" IS 'tag ManifestId.holder = resource';

COMMENT ON COLUMN "qti"."manifest_id_of_variant"."__tag_holder_variant_yyymqmlpge" IS 'tag ManifestId.holder = variant';

COMMENT ON COLUMN "qti"."variant"."__tag_kind_cpx_variant_zd5caenuzr" IS 'tag Node.kind = cpx:variant';

COMMENT ON COLUMN "qti"."variant_metadata"."__tag_kind_cpx_metadata_etdkl37kij" IS 'tag Node.kind = cpx:metadata';

COMMENT ON CONSTRAINT "__access_for_all_resource_fk_id_tag_kind_drd_access_tfbg7eqeci" ON "qti"."access_for_all_resource" IS 'foreign key AccessForAllResource(id, __tag_kind_drd_access_for_all_resource_dcvrnrucvz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__access_for_all_resource_fk_id_metadata_xfrhrrhkhp" ON "qti"."access_for_all_resource" IS 'foreign key AccessForAllResource(id, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__access_for_all_resource_fk_metadata_zxw7a2wvbn" ON "qti"."access_for_all_resource" IS 'foreign key AccessForAllResource(metadata) to VariantMetadata(id)';

COMMENT ON CONSTRAINT "__drd_access_mode_fk_id_tag_kind_drd_access_mode_vuxjxmmlzw" ON "qti"."drd_access_mode" IS 'foreign key DrdAccessMode(id, __tag_kind_drd_access_mode_njghsaxgib) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_access_mode_fk_id_owner_rn7ubxr6fm" ON "qti"."drd_access_mode" IS 'foreign key DrdAccessMode(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_access_mode_fk_owner_jzvejnp7gm" ON "qti"."drd_access_mode" IS 'foreign key DrdAccessMode(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_access_mode_adapted_fk_id_tag_kind_drd_access_7vr72hwvgw" ON "qti"."drd_access_mode_adapted" IS 'foreign key DrdAccessModeAdapted(id, __tag_kind_drd_access_mode_adapted_6n47kwzvq4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_access_mode_adapted_fk_id_owner_an2mivqfcv" ON "qti"."drd_access_mode_adapted" IS 'foreign key DrdAccessModeAdapted(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_access_mode_adapted_fk_owner_wbdqipwa67" ON "qti"."drd_access_mode_adapted" IS 'foreign key DrdAccessModeAdapted(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_adaptation_detail_fk_id_tag_kind_drd_exjqq7blbz" ON "qti"."drd_adaptation_detail" IS 'foreign key DrdAdaptationDetail(id, __tag_kind_drd_adaptation_detail_q4chm2z7fd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_adaptation_detail_fk_id_owner_lrm72yi2bp" ON "qti"."drd_adaptation_detail" IS 'foreign key DrdAdaptationDetail(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_adaptation_detail_fk_owner_p6k6ryibwf" ON "qti"."drd_adaptation_detail" IS 'foreign key DrdAdaptationDetail(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_adaptation_media_type_fk_id_tag_kind_drd_b576jcpkfd" ON "qti"."drd_adaptation_media_type" IS 'foreign key DrdAdaptationMediaType(id, __tag_kind_drd_adaptation_media_type_ms4x34iisf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_adaptation_media_type_fk_id_owner_flyzlynmlg" ON "qti"."drd_adaptation_media_type" IS 'foreign key DrdAdaptationMediaType(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_adaptation_media_type_fk_owner_ofx2n4dzrq" ON "qti"."drd_adaptation_media_type" IS 'foreign key DrdAdaptationMediaType(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_adaptation_type_fk_id_tag_kind_drd_adaptation_mkwzx225pn" ON "qti"."drd_adaptation_type" IS 'foreign key DrdAdaptationType(id, __tag_kind_drd_adaptation_type_cr4axc6ol7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_adaptation_type_fk_id_owner_lvvmww4mmu" ON "qti"."drd_adaptation_type" IS 'foreign key DrdAdaptationType(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_adaptation_type_fk_owner_3oowyhvioq" ON "qti"."drd_adaptation_type" IS 'foreign key DrdAdaptationType(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_api_interoperable_fk_id_tag_kind_drd_api_ir7glc237l" ON "qti"."drd_api_interoperable" IS 'foreign key DrdApiInteroperable(id, __tag_kind_drd_api_interoperable_qnxbi5kb5p) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_api_interoperable_fk_id_owner_cxjwz34g42" ON "qti"."drd_api_interoperable" IS 'foreign key DrdApiInteroperable(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_api_interoperable_fk_owner_yqohhnuw6p" ON "qti"."drd_api_interoperable" IS 'foreign key DrdApiInteroperable(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_at_interoperable_fk_id_tag_kind_drd_at_mjka4ackmf" ON "qti"."drd_at_interoperable" IS 'foreign key DrdAtInteroperable(id, __tag_kind_drd_at_interoperable_zjkivbnkxx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_at_interoperable_fk_id_owner_hk2hm45sxf" ON "qti"."drd_at_interoperable" IS 'foreign key DrdAtInteroperable(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_at_interoperable_fk_owner_e52xbcn3hb" ON "qti"."drd_at_interoperable" IS 'foreign key DrdAtInteroperable(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_control_flexibility_fk_id_tag_kind_drd_control_vfpbix2kua" ON "qti"."drd_control_flexibility" IS 'foreign key DrdControlFlexibility(id, __tag_kind_drd_control_flexibility_ogpln6c34g) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_control_flexibility_fk_id_owner_5hrfwrw7en" ON "qti"."drd_control_flexibility" IS 'foreign key DrdControlFlexibility(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_control_flexibility_fk_owner_pcgv3lf3mm" ON "qti"."drd_control_flexibility" IS 'foreign key DrdControlFlexibility(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_display_transformability_fk_id_tag_kind_drd_jybpwfkthu" ON "qti"."drd_display_transformability" IS 'foreign key DrdDisplayTransformability(id, __tag_kind_drd_display_transformability_hlcmwybrbn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_display_transformability_fk_id_owner_wlolwxvc5z" ON "qti"."drd_display_transformability" IS 'foreign key DrdDisplayTransformability(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_display_transformability_fk_owner_7vr6dpp3m4" ON "qti"."drd_display_transformability" IS 'foreign key DrdDisplayTransformability(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_id_tag_iditd5uyhp" ON "qti"."drd_educational_complexity_of_adaptation" IS 'foreign key DrdEducationalComplexityOfAdaptation(id, __tag_kind_drd_educational_complexity_of_adaptation_mfzwmr74m2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_id_ewfvtarag3" ON "qti"."drd_educational_complexity_of_adaptation" IS 'foreign key DrdEducationalComplexityOfAdaptation(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_owner_sw4eaoxuwe" ON "qti"."drd_educational_complexity_of_adaptation" IS 'foreign key DrdEducationalComplexityOfAdaptation(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_educational_level_of_adaptation_fk_id_tag_kind_m5jrqt3fve" ON "qti"."drd_educational_level_of_adaptation" IS 'foreign key DrdEducationalLevelOfAdaptation(id, __tag_kind_drd_educational_level_of_adaptation_ezcznxqajt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_educational_level_of_adaptation_fk_id_owner_smy723fsu5" ON "qti"."drd_educational_level_of_adaptation" IS 'foreign key DrdEducationalLevelOfAdaptation(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_educational_level_of_adaptation_fk_owner_r5kgg27jjw" ON "qti"."drd_educational_level_of_adaptation" IS 'foreign key DrdEducationalLevelOfAdaptation(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_has_adaptation_fk_id_tag_kind_drd_has_36m2bsoxuy" ON "qti"."drd_has_adaptation" IS 'foreign key DrdHasAdaptation(id, __tag_kind_drd_has_adaptation_4x7nx53hok) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_has_adaptation_fk_id_owner_fin43w3cci" ON "qti"."drd_has_adaptation" IS 'foreign key DrdHasAdaptation(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_has_adaptation_fk_owner_4uklqawtxz" ON "qti"."drd_has_adaptation" IS 'foreign key DrdHasAdaptation(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_hazard_fk_id_tag_kind_drd_hazard_3_n_5_ihtfyij_dantc7k2rm" ON "qti"."drd_hazard" IS 'foreign key DrdHazard(id, __tag_kind_drd_hazard_3n5ihtfyij) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_hazard_fk_id_owner_fw6qwjvuan" ON "qti"."drd_hazard" IS 'foreign key DrdHazard(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_hazard_fk_owner_j66pae5hpj" ON "qti"."drd_hazard" IS 'foreign key DrdHazard(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_is_adaptation_of_fk_id_tag_kind_drd_is_op6hhr7uxb" ON "qti"."drd_is_adaptation_of" IS 'foreign key DrdIsAdaptationOf(id, __tag_kind_drd_is_adaptation_of_viq3qn3bmy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_is_adaptation_of_fk_id_owner_k3kokwweg7" ON "qti"."drd_is_adaptation_of" IS 'foreign key DrdIsAdaptationOf(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_is_adaptation_of_fk_owner_2jbu57gyfx" ON "qti"."drd_is_adaptation_of" IS 'foreign key DrdIsAdaptationOf(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_is_full_adaptation_of_fk_id_tag_kind_drd_is_oigemsrwkx" ON "qti"."drd_is_full_adaptation_of" IS 'foreign key DrdIsFullAdaptationOf(id, __tag_kind_drd_is_full_adaptation_of_tvwox3ztrp) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_is_full_adaptation_of_fk_id_owner_m77kbgb332" ON "qti"."drd_is_full_adaptation_of" IS 'foreign key DrdIsFullAdaptationOf(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_is_full_adaptation_of_fk_owner_uulxxpv45w" ON "qti"."drd_is_full_adaptation_of" IS 'foreign key DrdIsFullAdaptationOf(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_is_partial_adaptation_of_fk_id_tag_kind_drd_is_ct2d4bsqnu" ON "qti"."drd_is_partial_adaptation_of" IS 'foreign key DrdIsPartialAdaptationOf(id, __tag_kind_drd_is_partial_adaptation_of_5ojegjo7cp) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_is_partial_adaptation_of_fk_id_owner_vpnno7y2hr" ON "qti"."drd_is_partial_adaptation_of" IS 'foreign key DrdIsPartialAdaptationOf(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_is_partial_adaptation_of_fk_owner_aq2gyhxpjy" ON "qti"."drd_is_partial_adaptation_of" IS 'foreign key DrdIsPartialAdaptationOf(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__drd_language_of_adaptation_fk_id_tag_kind_drd_e7yff3ecq2" ON "qti"."drd_language_of_adaptation" IS 'foreign key DrdLanguageOfAdaptation(id, __tag_kind_drd_language_of_adaptation_p3eiulmmnm) to Node(id, kind)';

COMMENT ON CONSTRAINT "__drd_language_of_adaptation_fk_id_owner_quhzgdhsum" ON "qti"."drd_language_of_adaptation" IS 'foreign key DrdLanguageOfAdaptation(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__drd_language_of_adaptation_fk_owner_izhddtm3go" ON "qti"."drd_language_of_adaptation" IS 'foreign key DrdLanguageOfAdaptation(owner) to AccessForAllResource(id)';

COMMENT ON CONSTRAINT "__manifest_id_fk_package_yrywtozstf" ON "qti"."manifest_id" IS 'foreign key ManifestId(package) to Package(id)';

COMMENT ON CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj" ON "qti"."manifest_id_of_manifest" IS 'foreign key ManifestIdOfManifest(package, id) to Package(id, identifier)';

COMMENT ON CONSTRAINT "__manifest_id_of_manifest_fk_package_id_tag_holder_hcdzuklnac" ON "qti"."manifest_id_of_manifest" IS 'foreign key ManifestIdOfManifest(package, id, __tag_holder_manifest_7wghkxashe) to ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__manifest_id_of_resource_fk_package_id_moulqn3fj4" ON "qti"."manifest_id_of_resource" IS 'foreign key ManifestIdOfResource(package, id) to Resource(package, identifier)';

COMMENT ON CONSTRAINT "__manifest_id_of_resource_fk_package_id_tag_holder_zdlxck3tn7" ON "qti"."manifest_id_of_resource" IS 'foreign key ManifestIdOfResource(package, id, __tag_holder_resource_3lbxhuqadk) to ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__manifest_id_of_variant_fk_package_id_huvjqiu33v" ON "qti"."manifest_id_of_variant" IS 'foreign key ManifestIdOfVariant(package, id) to Variant(package, identifier)';

COMMENT ON CONSTRAINT "__manifest_id_of_variant_fk_package_id_tag_holder_jf7shcoyrs" ON "qti"."manifest_id_of_variant" IS 'foreign key ManifestIdOfVariant(package, id, __tag_holder_variant_yyymqmlpge) to ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc" ON "qti"."package" IS 'foreign key Package(id, identifier) to ManifestIdOfManifest(package, id)';

COMMENT ON CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv" ON "qti"."resource" IS 'foreign key Resource(package, identifier) to ManifestIdOfResource(package, id)';

COMMENT ON CONSTRAINT "__variant_fk_id_tag_kind_cpx_variant_zd_5_caenuzr_jtims4ygfy" ON "qti"."variant" IS 'foreign key Variant(id, __tag_kind_cpx_variant_zd5caenuzr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variant_fk_id_resource_tfxcbdkpma" ON "qti"."variant" IS 'foreign key Variant(id, resource) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__variant_fk_package_identifier_ffjrlehepf" ON "qti"."variant" IS 'foreign key Variant(package, identifier) to ManifestIdOfVariant(package, id)';

COMMENT ON CONSTRAINT "__variant_fk_package_identifierref_zujo3dkru3" ON "qti"."variant" IS 'foreign key Variant(package, identifierref) to Resource(package, identifier)';

COMMENT ON CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu" ON "qti"."variant" IS 'foreign key Variant(resource, package, resourceIdentifier) to Resource(id, package, identifier)';

COMMENT ON CONSTRAINT "__variant_metadata_fk_id_tag_kind_cpx_metadata_etdkl_qkdqmccwxj" ON "qti"."variant_metadata" IS 'foreign key VariantMetadata(id, __tag_kind_cpx_metadata_etdkl37kij) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variant_metadata_fk_id_variant_cm4y6w45jw" ON "qti"."variant_metadata" IS 'foreign key VariantMetadata(id, variant) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__variant_metadata_fk_variant_ddw6cifzji" ON "qti"."variant_metadata" IS 'foreign key VariantMetadata(variant) to Variant(id)';

COMMENT ON INDEX "qti"."__access_for_all_resource_key_metadata_ltyeuwg5av" IS 'unique index AccessForAllResource(metadata)';

COMMENT ON INDEX "qti"."__variant_metadata_key_variant_ythetc2gkq" IS 'unique index VariantMetadata(variant)';

COMMENT ON INDEX "qti"."__drd_access_mode_ix_owner_nafahrej5h" IS 'btree index DrdAccessMode(owner)';

COMMENT ON INDEX "qti"."__drd_access_mode_adapted_ix_owner_i27o64enej" IS 'btree index DrdAccessModeAdapted(owner)';

COMMENT ON INDEX "qti"."__drd_adaptation_detail_ix_owner_36p5ul4zxq" IS 'btree index DrdAdaptationDetail(owner)';

COMMENT ON INDEX "qti"."__drd_adaptation_media_type_ix_owner_jfqysxuqek" IS 'btree index DrdAdaptationMediaType(owner)';

COMMENT ON INDEX "qti"."__drd_adaptation_type_ix_owner_p5qnadkbqx" IS 'btree index DrdAdaptationType(owner)';

COMMENT ON INDEX "qti"."__drd_api_interoperable_ix_owner_ydwgzfpay4" IS 'btree index DrdApiInteroperable(owner)';

COMMENT ON INDEX "qti"."__drd_control_flexibility_ix_owner_aytmj32cw5" IS 'btree index DrdControlFlexibility(owner)';

COMMENT ON INDEX "qti"."__drd_display_transformability_ix_owner_xuwg6wzl2h" IS 'btree index DrdDisplayTransformability(owner)';

COMMENT ON INDEX "qti"."__drd_educational_level_of_adaptation_ix_owner_l2degszvbf" IS 'btree index DrdEducationalLevelOfAdaptation(owner)';

COMMENT ON INDEX "qti"."__drd_has_adaptation_ix_owner_z7aoreiwl4" IS 'btree index DrdHasAdaptation(owner)';

COMMENT ON INDEX "qti"."__drd_hazard_ix_owner_k6ix5wgkdh" IS 'btree index DrdHazard(owner)';

COMMENT ON INDEX "qti"."__drd_is_adaptation_of_ix_owner_5ulfafssre" IS 'btree index DrdIsAdaptationOf(owner)';

COMMENT ON INDEX "qti"."__drd_is_full_adaptation_of_ix_owner_2z6xfb26ad" IS 'btree index DrdIsFullAdaptationOf(owner)';

COMMENT ON INDEX "qti"."__drd_is_partial_adaptation_of_ix_owner_vy2fsymohn" IS 'btree index DrdIsPartialAdaptationOf(owner)';

COMMENT ON INDEX "qti"."__drd_language_of_adaptation_ix_owner_7kx4y32tgl" IS 'btree index DrdLanguageOfAdaptation(owner)';

COMMENT ON INDEX "qti"."__variant_ix_package_identifierref_cgd3uzvweq" IS 'btree index Variant(package, identifierref)';

COMMENT ON INDEX "qti"."__variant_ix_resource_package_resource_identifier_3mcke6ybyd" IS 'btree index Variant(resource, package, resourceIdentifier)';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vleugtkftj" ON "qti"."access_for_all_resource" IS 'trigger of law alternatives of Node.kind on AccessForAllResource';

COMMENT ON TRIGGER "__law_variant_metadata_capacity_access_for_all_odo6ya6gbr" ON "qti"."access_for_all_resource" IS 'trigger of law capacity of VariantMetadata(id) over AccessForAllResource(metadata) within 1..1 on AccessForAllResource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5skm7kkgib" ON "qti"."assessment_item" IS 'trigger of law alternatives of Node.kind on AssessmentItem';

COMMENT ON TRIGGER "__law_node_kind_alternatives_upkyeydjz7" ON "qti"."choice_interaction" IS 'trigger of law alternatives of Node.kind on ChoiceInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_py43thbsit" ON "qti"."comment" IS 'trigger of law alternatives of Node.kind on Comment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ikfqexnafy" ON "qti"."correct_response_arm" IS 'trigger of law alternatives of Node.kind on CorrectResponseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5vhdpgz25" ON "qti"."declared_value" IS 'trigger of law alternatives of Node.kind on DeclaredValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ssrxqpoval" ON "qti"."default_value_arm" IS 'trigger of law alternatives of Node.kind on DefaultValueArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6td2gbd75c" ON "qti"."dependency" IS 'trigger of law alternatives of Node.kind on Dependency';

COMMENT ON TRIGGER "__law_node_kind_alternatives_umfgrooi2i" ON "qti"."drd_access_mode" IS 'trigger of law alternatives of Node.kind on DrdAccessMode';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xhggb5fs2c" ON "qti"."drd_access_mode_adapted" IS 'trigger of law alternatives of Node.kind on DrdAccessModeAdapted';

COMMENT ON TRIGGER "__law_node_kind_alternatives_hdujr5yy7j" ON "qti"."drd_adaptation_detail" IS 'trigger of law alternatives of Node.kind on DrdAdaptationDetail';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wyvp7rzqj4" ON "qti"."drd_adaptation_media_type" IS 'trigger of law alternatives of Node.kind on DrdAdaptationMediaType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_abddsoyqxo" ON "qti"."drd_adaptation_type" IS 'trigger of law alternatives of Node.kind on DrdAdaptationType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_54m6acxet2" ON "qti"."drd_api_interoperable" IS 'trigger of law alternatives of Node.kind on DrdApiInteroperable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mx2j72inl3" ON "qti"."drd_at_interoperable" IS 'trigger of law alternatives of Node.kind on DrdAtInteroperable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vw4ytqyvsh" ON "qti"."drd_control_flexibility" IS 'trigger of law alternatives of Node.kind on DrdControlFlexibility';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xsa3v33pmc" ON "qti"."drd_display_transformability" IS 'trigger of law alternatives of Node.kind on DrdDisplayTransformability';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rimvrtf4pl" ON "qti"."drd_educational_complexity_of_adaptation" IS 'trigger of law alternatives of Node.kind on DrdEducationalComplexityOfAdaptation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_omog22ylq2" ON "qti"."drd_educational_level_of_adaptation" IS 'trigger of law alternatives of Node.kind on DrdEducationalLevelOfAdaptation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_y47rmhxpnn" ON "qti"."drd_has_adaptation" IS 'trigger of law alternatives of Node.kind on DrdHasAdaptation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ns2w3mwmy2" ON "qti"."drd_hazard" IS 'trigger of law alternatives of Node.kind on DrdHazard';

COMMENT ON TRIGGER "__law_node_kind_alternatives_l7yrjhaf26" ON "qti"."drd_is_adaptation_of" IS 'trigger of law alternatives of Node.kind on DrdIsAdaptationOf';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wa5glxkinn" ON "qti"."drd_is_full_adaptation_of" IS 'trigger of law alternatives of Node.kind on DrdIsFullAdaptationOf';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2tbi5mitfc" ON "qti"."drd_is_partial_adaptation_of" IS 'trigger of law alternatives of Node.kind on DrdIsPartialAdaptationOf';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sx35ief3vq" ON "qti"."drd_language_of_adaptation" IS 'trigger of law alternatives of Node.kind on DrdLanguageOfAdaptation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xuefsrgzju" ON "qti"."entity_reference" IS 'trigger of law alternatives of Node.kind on EntityReference';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oxdcy2a5y4" ON "qti"."file" IS 'trigger of law alternatives of Node.kind on File';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qi3e3sk75r" ON "qti"."img" IS 'trigger of law alternatives of Node.kind on Img';

COMMENT ON TRIGGER "__law_node_kind_alternatives_smgee6gejq" ON "qti"."item_body" IS 'trigger of law alternatives of Node.kind on ItemBody';

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

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_n3trdmevxd" ON "qti"."manifest_id" IS 'trigger of law alternatives of ManifestId.holder on ManifestId';

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_5ovauixwzl" ON "qti"."manifest_id_of_manifest" IS 'trigger of law alternatives of ManifestId.holder on ManifestIdOfManifest';

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_ughu4aiuxc" ON "qti"."manifest_id_of_resource" IS 'trigger of law alternatives of ManifestId.holder on ManifestIdOfResource';

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_tdhldo4cny" ON "qti"."manifest_id_of_variant" IS 'trigger of law alternatives of ManifestId.holder on ManifestIdOfVariant';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ipuymtixeh" ON "qti"."manifest_metadata" IS 'trigger of law alternatives of Node.kind on ManifestMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_k3727kgr4f" ON "qti"."manifest_schema" IS 'trigger of law alternatives of Node.kind on ManifestSchema';

COMMENT ON TRIGGER "__law_node_kind_alternatives_edwin77ceo" ON "qti"."manifest_schema_version" IS 'trigger of law alternatives of Node.kind on ManifestSchemaVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sv4lck5ue6" ON "qti"."node" IS 'trigger of law alternatives of Node.kind on Node';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bv75ttdv6d" ON "qti"."organizations" IS 'trigger of law alternatives of Node.kind on Organizations';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qhu3dxqvfw" ON "qti"."outcome_declaration_arm" IS 'trigger of law alternatives of Node.kind on OutcomeDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3psrbuzkn3" ON "qti"."p" IS 'trigger of law alternatives of Node.kind on P';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nmhjri6454" ON "qti"."package" IS 'trigger of law alternatives of Node.kind on Package';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_j53oleenel" ON "qti"."resource" IS 'trigger of law alternatives of Node.kind on Resource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rzmuape27g" ON "qti"."resource_metadata" IS 'trigger of law alternatives of Node.kind on ResourceMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rqsqvzbn2g" ON "qti"."resources" IS 'trigger of law alternatives of Node.kind on Resources';

COMMENT ON TRIGGER "__law_node_kind_alternatives_p5egrc7ys2" ON "qti"."response_declaration_arm" IS 'trigger of law alternatives of Node.kind on ResponseDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ob7fyfvlkb" ON "qti"."response_processing" IS 'trigger of law alternatives of Node.kind on ResponseProcessing';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mp3irnnixf" ON "qti"."simple_choice" IS 'trigger of law alternatives of Node.kind on SimpleChoice';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dhvs325itr" ON "qti"."text_node" IS 'trigger of law alternatives of Node.kind on TextNode';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tr4wev6nbi" ON "qti"."variant" IS 'trigger of law alternatives of Node.kind on Variant';

COMMENT ON TRIGGER "__law_variant_capacity_variant_metadata_nzsbmxh54i" ON "qti"."variant" IS 'trigger of law capacity of Variant(id) over VariantMetadata(variant) within 1..1 on Variant';

COMMENT ON TRIGGER "__law_node_kind_alternatives_r4pd3dasye" ON "qti"."variant_metadata" IS 'trigger of law alternatives of Node.kind on VariantMetadata';

COMMENT ON TRIGGER "__law_variant_capacity_variant_metadata_orngzoitpp" ON "qti"."variant_metadata" IS 'trigger of law capacity of Variant(id) over VariantMetadata(variant) within 1..1 on VariantMetadata';

COMMENT ON TRIGGER "__law_variant_metadata_capacity_access_for_all_yd4rirjjle" ON "qti"."variant_metadata" IS 'trigger of law capacity of VariantMetadata(id) over AccessForAllResource(metadata) within 1..1 on VariantMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qra75t5mkw" ON "qti"."ws" IS 'trigger of law alternatives of Node.kind on Ws';
