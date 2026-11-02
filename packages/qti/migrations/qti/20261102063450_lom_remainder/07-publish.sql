REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xarz6cej2e", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_4f3dzz6i4f", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ojm4wya66v", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_ukaaxf45sk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."access_for_all_resource", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."entity_reference", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."operand", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_access_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_access_mode_adapted" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_adaptation_detail" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_adaptation_media_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_adaptation_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_api_interoperable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_at_interoperable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_control_flexibility" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_display_transformability" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_educational_complexity_of_adaptation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_educational_level_of_adaptation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_has_adaptation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_hazard" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_is_adaptation_of" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_is_full_adaptation_of" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_is_partial_adaptation_of" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drd_language_of_adaptation" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_manifest" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_variant" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variant_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ws" FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xarz6cej2e", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_4f3dzz6i4f", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ojm4wya66v", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_ukaaxf45sk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_annotation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_classification" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_context" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_contribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_copyright_and_other_restrictions" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_cost" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_coverage" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_date" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_date_time" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_description" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_difficulty" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_educational" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_entity" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_entry_lang_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_format" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_general" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_general_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_catalog" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_installation_remarks" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_intended_end_user_role" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_interactivity_level" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_interactivity_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_keyword" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_kind" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_learning_resource_type" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_purpose" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_relation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_requirement" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_rights" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_role" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_semantic_density" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_size" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_source" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_source_lang_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_status" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_string_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_structure" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_taxon" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_taxon_path" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_technical" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_typical_age_range" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_typical_learning_time" TO "qti__author";

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

REVOKE ALL ON TABLE "qti"."access_for_all_resource", "qti"."admission", "qti"."assessment_item", "qti"."attribute_entity_reference", "qti"."attribute_lexical", "qti"."binding_fit", "qti"."built_in_ref", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."comment", "qti"."correct_response_arm", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_fixed", "qti"."declared_max_choices", "qti"."declared_min_choices", "qti"."declared_orientation", "qti"."declared_ref", "qti"."declared_show_hide", "qti"."declared_shuffle", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."default_value_arm", "qti"."dependency", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_title", "qti"."drd_access_mode", "qti"."drd_access_mode_adapted", "qti"."drd_adaptation_detail", "qti"."drd_adaptation_media_type", "qti"."drd_adaptation_type", "qti"."drd_api_interoperable", "qti"."drd_at_interoperable", "qti"."drd_control_flexibility", "qti"."drd_display_transformability", "qti"."drd_educational_complexity_of_adaptation", "qti"."drd_educational_level_of_adaptation", "qti"."drd_has_adaptation", "qti"."drd_hazard", "qti"."drd_is_adaptation_of", "qti"."drd_is_full_adaptation_of", "qti"."drd_is_partial_adaptation_of", "qti"."drd_language_of_adaptation", "qti"."edge", "qti"."entity_reference", "qti"."expression", "qti"."file", "qti"."file_content", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."interaction_binding", "qti"."item_body", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_annotation", "qti"."lom_classification", "qti"."lom_context", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_difficulty", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_educational", "qti"."lom_entity", "qti"."lom_entry_lang_string", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_id", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_intended_end_user_role", "qti"."lom_interactivity_level", "qti"."lom_interactivity_type", "qti"."lom_keyword", "qti"."lom_kind", "qti"."lom_language", "qti"."lom_learning_resource_type", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_purpose", "qti"."lom_relation", "qti"."lom_requirement", "qti"."lom_resource", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_semantic_density", "qti"."lom_size", "qti"."lom_source", "qti"."lom_source_lang_string", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_taxon", "qti"."lom_taxon_path", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_typical_age_range", "qti"."lom_typical_learning_time", "qti"."lom_value", "qti"."lom_version", "qti"."manifest", "qti"."manifest_id", "qti"."manifest_id_of_manifest", "qti"."manifest_id_of_resource", "qti"."manifest_id_of_variant", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."namespace_declaration", "qti"."node", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."organizations", "qti"."outcome_declaration_arm", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."pi", "qti"."prompt", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_metadata", "qti"."record_binding", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_identified", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_processing", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."schema_location", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."standard_template_reference", "qti"."text_node", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."value_set", "qti"."value_set_interpretation", "qti"."variable_ref", "qti"."variant", "qti"."variant_metadata", "qti"."ws", "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."file", "qti__author"."file_content", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_cz7v66q3ce", "qti"."__text_raisrajgpi", "qti"."__text_rhdrzkabze", "qti"."__text_kqeswaav46", "qti"."__text_clza6vokfo", "qti"."__text_yakcqa4zli", "qti"."__text_6uwfpnix5n", "qti"."__text_k3z6naurdo", "qti"."__text_jld3q663or", "qti"."__text_f63vbnbw4t", "qti"."__text_d72l462ftm", "qti"."__text_qtkbmkpj6l", "qti"."__text_7grqskvjta", "qti"."__text_c34ec7mxid", "qti"."__text_tyjqwtj7ky", "qti"."__text_2dix7luqoi", "qti"."__text_4f3dzz6i4f", "qti"."__text_sa4c4ywp5v", "qti"."__text_2rz6hgcvt2", "qti"."__text_4adkkv4wal", "qti"."__text_xarz6cej2e", "qti"."__text_lsy6pxooea", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ukaaxf45sk", "qti"."__text_tso7kvy6dv", "qti"."__text_ifp42a6zk6", "qti"."__text_7mulu52tr6", "qti"."__text_ieskz75v7g", "qti"."__text_popyschjwc", "qti"."__text_betq2bg2bg", "qti"."__text_qyq7zjychy", "qti"."__text_httzcaefcn", "qti"."__text_mvg26oprvk", "qti"."__text_f3hdif3553", "qti"."__text_ojm4wya66v", "qti"."__text_pftpnuhm3d", "qti"."__text_i67gmkzdk7", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_uia6zcss44", "qti"."__text_r5xluaej3z", "qti"."__text_ottycep7en" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

COMMENT ON FUNCTION "qti"."__law_node_kind_alternatives_vfnu4bvxbc"() IS 'function of law alternatives of Node.kind';

COMMENT ON CONSTRAINT "__edge_key_child_parent_kind_jv6mposiie" ON "qti"."edge" IS 'key Edge(child, parentKind)';

COMMENT ON CONSTRAINT "__lom_annotation_pk_pahdalsdmw" ON "qti"."lom_annotation" IS 'primary key of LomAnnotation';

COMMENT ON CONSTRAINT "__lom_classification_pk_sv4svz23wo" ON "qti"."lom_classification" IS 'primary key of LomClassification';

COMMENT ON CONSTRAINT "__lom_context_pk_d3q5q7l6tv" ON "qti"."lom_context" IS 'primary key of LomContext';

COMMENT ON CONSTRAINT "__lom_difficulty_pk_izmwy4nlak" ON "qti"."lom_difficulty" IS 'primary key of LomDifficulty';

COMMENT ON CONSTRAINT "__lom_educational_pk_obnzvqdy6m" ON "qti"."lom_educational" IS 'primary key of LomEducational';

COMMENT ON CONSTRAINT "__lom_entry_lang_string_pk_ieu73vzaj3" ON "qti"."lom_entry_lang_string" IS 'primary key of LomEntryLangString';

COMMENT ON CONSTRAINT "__lom_id_pk_m3vjr77vsc" ON "qti"."lom_id" IS 'primary key of LomId';

COMMENT ON CONSTRAINT "__lom_intended_end_user_role_pk_4ns4gxzj42" ON "qti"."lom_intended_end_user_role" IS 'primary key of LomIntendedEndUserRole';

COMMENT ON CONSTRAINT "__lom_interactivity_level_pk_smnf62qv23" ON "qti"."lom_interactivity_level" IS 'primary key of LomInteractivityLevel';

COMMENT ON CONSTRAINT "__lom_interactivity_type_pk_bs5vquvjc5" ON "qti"."lom_interactivity_type" IS 'primary key of LomInteractivityType';

COMMENT ON CONSTRAINT "__lom_kind_pk_lvae7tdas3" ON "qti"."lom_kind" IS 'primary key of LomKind';

COMMENT ON CONSTRAINT "__lom_learning_resource_type_pk_nmjempx6wc" ON "qti"."lom_learning_resource_type" IS 'primary key of LomLearningResourceType';

COMMENT ON CONSTRAINT "__lom_purpose_pk_icp6pnpvro" ON "qti"."lom_purpose" IS 'primary key of LomPurpose';

COMMENT ON CONSTRAINT "__lom_relation_pk_gm4jfwfabn" ON "qti"."lom_relation" IS 'primary key of LomRelation';

COMMENT ON CONSTRAINT "__lom_resource_pk_jcjprudbpj" ON "qti"."lom_resource" IS 'primary key of LomResource';

COMMENT ON CONSTRAINT "__lom_semantic_density_pk_le3a5envz3" ON "qti"."lom_semantic_density" IS 'primary key of LomSemanticDensity';

COMMENT ON CONSTRAINT "__lom_source_lang_string_pk_6aokne5mpu" ON "qti"."lom_source_lang_string" IS 'primary key of LomSourceLangString';

COMMENT ON CONSTRAINT "__lom_taxon_pk_23daz4igko" ON "qti"."lom_taxon" IS 'primary key of LomTaxon';

COMMENT ON CONSTRAINT "__lom_taxon_path_pk_22rkrrz3j6" ON "qti"."lom_taxon_path" IS 'primary key of LomTaxonPath';

COMMENT ON CONSTRAINT "__lom_typical_age_range_pk_3xmo44huiz" ON "qti"."lom_typical_age_range" IS 'primary key of LomTypicalAgeRange';

COMMENT ON CONSTRAINT "__lom_typical_learning_time_pk_a3dl6vpcbh" ON "qti"."lom_typical_learning_time" IS 'primary key of LomTypicalLearningTime';

COMMENT ON COLUMN "qti"."lom_annotation"."__tag_kind_lom_annotation_wmk4msekhm" IS 'tag Node.kind = lom:annotation';

COMMENT ON COLUMN "qti"."lom_classification"."__tag_kind_lom_classification_s33zb3ydxx" IS 'tag Node.kind = lom:classification';

COMMENT ON COLUMN "qti"."lom_context"."__tag_kind_lom_context_unp6fhu2i5" IS 'tag Node.kind = lom:context';

COMMENT ON COLUMN "qti"."lom_difficulty"."__tag_kind_lom_difficulty_u6oh2pluob" IS 'tag Node.kind = lom:difficulty';

COMMENT ON COLUMN "qti"."lom_educational"."__tag_kind_lom_educational_bfejue5lpc" IS 'tag Node.kind = lom:educational';

COMMENT ON COLUMN "qti"."lom_entry_lang_string"."__tag_kind_lom_entry_lang_string_yr7dyefaw7" IS 'tag Node.kind = lom:entry.langString';

COMMENT ON COLUMN "qti"."lom_id"."__tag_kind_lom_id_qophyddse4" IS 'tag Node.kind = lom:id';

COMMENT ON COLUMN "qti"."lom_intended_end_user_role"."__tag_kind_lom_intended_end_user_role_fu7zxsgpuk" IS 'tag Node.kind = lom:intendedEndUserRole';

COMMENT ON COLUMN "qti"."lom_interactivity_level"."__tag_kind_lom_interactivity_level_42hqjwr3eg" IS 'tag Node.kind = lom:interactivityLevel';

COMMENT ON COLUMN "qti"."lom_interactivity_type"."__tag_kind_lom_interactivity_type_mx3pzoaf7t" IS 'tag Node.kind = lom:interactivityType';

COMMENT ON COLUMN "qti"."lom_kind"."__tag_kind_lom_kind_xuf2kkwyr4" IS 'tag Node.kind = lom:kind';

COMMENT ON COLUMN "qti"."lom_learning_resource_type"."__tag_kind_lom_learning_resource_type_mm2kxi35r2" IS 'tag Node.kind = lom:learningResourceType';

COMMENT ON COLUMN "qti"."lom_purpose"."__tag_kind_lom_purpose_qtsfpmrlct" IS 'tag Node.kind = lom:purpose';

COMMENT ON COLUMN "qti"."lom_relation"."__tag_kind_lom_relation_adpqqvr6or" IS 'tag Node.kind = lom:relation';

COMMENT ON COLUMN "qti"."lom_resource"."__tag_kind_lom_resource_jgqpmzi3u4" IS 'tag Node.kind = lom:resource';

COMMENT ON COLUMN "qti"."lom_semantic_density"."__tag_kind_lom_semantic_density_uqmekskg64" IS 'tag Node.kind = lom:semanticDensity';

COMMENT ON COLUMN "qti"."lom_source_lang_string"."__tag_kind_lom_source_lang_string_3blfwn3hhk" IS 'tag Node.kind = lom:source.langString';

COMMENT ON COLUMN "qti"."lom_taxon"."__tag_kind_lom_taxon_2gykitonjg" IS 'tag Node.kind = lom:taxon';

COMMENT ON COLUMN "qti"."lom_taxon_path"."__tag_kind_lom_taxon_path_ifvs3xty7l" IS 'tag Node.kind = lom:taxonPath';

COMMENT ON COLUMN "qti"."lom_typical_age_range"."__tag_kind_lom_typical_age_range_b2nwhfufjs" IS 'tag Node.kind = lom:typicalAgeRange';

COMMENT ON COLUMN "qti"."lom_typical_learning_time"."__tag_kind_lom_typical_learning_time_jvgzdwqqg4" IS 'tag Node.kind = lom:typicalLearningTime';

COMMENT ON CONSTRAINT "__lom_annotation_fk_id_tag_kind_lom_annotation_wmk_4_lavkjljdee" ON "qti"."lom_annotation" IS 'foreign key LomAnnotation(id, __tag_kind_lom_annotation_wmk4msekhm) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_annotation_fk_id_lom_fvl6yckn7w" ON "qti"."lom_annotation" IS 'foreign key LomAnnotation(id, lom) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_annotation_fk_lom_zekvm5wtoq" ON "qti"."lom_annotation" IS 'foreign key LomAnnotation(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_classification_fk_id_tag_kind_lom_2chxdeo54b" ON "qti"."lom_classification" IS 'foreign key LomClassification(id, __tag_kind_lom_classification_s33zb3ydxx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_classification_fk_id_lom_lbzjzocrka" ON "qti"."lom_classification" IS 'foreign key LomClassification(id, lom) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_classification_fk_lom_oe4atcfgdx" ON "qti"."lom_classification" IS 'foreign key LomClassification(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_context_fk_id_tag_kind_lom_context_unp_6_fhu_2_uutdmnxs3j" ON "qti"."lom_context" IS 'foreign key LomContext(id, __tag_kind_lom_context_unp6fhu2i5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_context_fk_lom_y2fvbzxfmp" ON "qti"."lom_context" IS 'foreign key LomContext(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_difficulty_fk_id_tag_kind_lom_difficulty_u_6_f6wuieia5v" ON "qti"."lom_difficulty" IS 'foreign key LomDifficulty(id, __tag_kind_lom_difficulty_u6oh2pluob) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_difficulty_fk_lom_qtl7zjkhp4" ON "qti"."lom_difficulty" IS 'foreign key LomDifficulty(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_educational_fk_id_tag_kind_lom_educational_u2hj6zfswu" ON "qti"."lom_educational" IS 'foreign key LomEducational(id, __tag_kind_lom_educational_bfejue5lpc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_educational_fk_id_lom_lkprbuhw2p" ON "qti"."lom_educational" IS 'foreign key LomEducational(id, lom) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_educational_fk_lom_cwyavg2yop" ON "qti"."lom_educational" IS 'foreign key LomEducational(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_entry_lang_string_fk_id_tag_kind_lom_entry_gmkubnhnma" ON "qti"."lom_entry_lang_string" IS 'foreign key LomEntryLangString(id, __tag_kind_lom_entry_lang_string_yr7dyefaw7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_entry_lang_string_fk_lom_t3jwxa4puv" ON "qti"."lom_entry_lang_string" IS 'foreign key LomEntryLangString(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_id_fk_id_tag_kind_lom_id_qophyddse_4_dn4cdvz5zw" ON "qti"."lom_id" IS 'foreign key LomId(id, __tag_kind_lom_id_qophyddse4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_intended_end_user_role_fk_id_tag_kind_lom_egpc75apis" ON "qti"."lom_intended_end_user_role" IS 'foreign key LomIntendedEndUserRole(id, __tag_kind_lom_intended_end_user_role_fu7zxsgpuk) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_intended_end_user_role_fk_lom_ktfhs6wv7t" ON "qti"."lom_intended_end_user_role" IS 'foreign key LomIntendedEndUserRole(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_interactivity_level_fk_id_tag_kind_lom_aiamt7iwqo" ON "qti"."lom_interactivity_level" IS 'foreign key LomInteractivityLevel(id, __tag_kind_lom_interactivity_level_42hqjwr3eg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_interactivity_level_fk_lom_sbe3wkv47z" ON "qti"."lom_interactivity_level" IS 'foreign key LomInteractivityLevel(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_interactivity_type_fk_id_tag_kind_lom_r22zgwluzg" ON "qti"."lom_interactivity_type" IS 'foreign key LomInteractivityType(id, __tag_kind_lom_interactivity_type_mx3pzoaf7t) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_interactivity_type_fk_lom_ttjit342cz" ON "qti"."lom_interactivity_type" IS 'foreign key LomInteractivityType(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_kind_fk_id_tag_kind_lom_kind_xuf_2_kkwyr_4_zz5lccb55i" ON "qti"."lom_kind" IS 'foreign key LomKind(id, __tag_kind_lom_kind_xuf2kkwyr4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_kind_fk_lom_x5v72f33di" ON "qti"."lom_kind" IS 'foreign key LomKind(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_learning_resource_type_fk_id_tag_kind_lom_7uw7egcsk5" ON "qti"."lom_learning_resource_type" IS 'foreign key LomLearningResourceType(id, __tag_kind_lom_learning_resource_type_mm2kxi35r2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_learning_resource_type_fk_lom_u64xh2vyxm" ON "qti"."lom_learning_resource_type" IS 'foreign key LomLearningResourceType(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_purpose_fk_id_tag_kind_lom_purpose_qtsfpmrlct_nobdk2jbas" ON "qti"."lom_purpose" IS 'foreign key LomPurpose(id, __tag_kind_lom_purpose_qtsfpmrlct) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_purpose_fk_lom_xy4taailou" ON "qti"."lom_purpose" IS 'foreign key LomPurpose(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_relation_fk_id_tag_kind_lom_relation_adpqqvr_6_6cfiwwa7tj" ON "qti"."lom_relation" IS 'foreign key LomRelation(id, __tag_kind_lom_relation_adpqqvr6or) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_relation_fk_id_lom_zmkhto22ty" ON "qti"."lom_relation" IS 'foreign key LomRelation(id, lom) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__lom_relation_fk_lom_gmpdl7y72h" ON "qti"."lom_relation" IS 'foreign key LomRelation(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_resource_fk_id_tag_kind_lom_resource_jgqpmzi_3_6qi7ptxdfc" ON "qti"."lom_resource" IS 'foreign key LomResource(id, __tag_kind_lom_resource_jgqpmzi3u4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_resource_fk_lom_jmhhitoiys" ON "qti"."lom_resource" IS 'foreign key LomResource(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_semantic_density_fk_id_tag_kind_lom_semantic_4fn5sxcuig" ON "qti"."lom_semantic_density" IS 'foreign key LomSemanticDensity(id, __tag_kind_lom_semantic_density_uqmekskg64) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_semantic_density_fk_lom_dxydczl7vk" ON "qti"."lom_semantic_density" IS 'foreign key LomSemanticDensity(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_source_lang_string_fk_id_tag_kind_lom_source_r7qdlilqsg" ON "qti"."lom_source_lang_string" IS 'foreign key LomSourceLangString(id, __tag_kind_lom_source_lang_string_3blfwn3hhk) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_source_lang_string_fk_lom_z7zml3al6y" ON "qti"."lom_source_lang_string" IS 'foreign key LomSourceLangString(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_taxon_fk_id_tag_kind_lom_taxon_2_gykitonjg_zavitntcvd" ON "qti"."lom_taxon" IS 'foreign key LomTaxon(id, __tag_kind_lom_taxon_2gykitonjg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_taxon_fk_lom_5mvtruica4" ON "qti"."lom_taxon" IS 'foreign key LomTaxon(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_taxon_path_fk_id_tag_kind_lom_taxon_path_ifvs_tq7eupudq3" ON "qti"."lom_taxon_path" IS 'foreign key LomTaxonPath(id, __tag_kind_lom_taxon_path_ifvs3xty7l) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_taxon_path_fk_lom_k3h74twnz6" ON "qti"."lom_taxon_path" IS 'foreign key LomTaxonPath(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_typical_age_range_fk_id_tag_kind_lom_typical_ioa2kacvy3" ON "qti"."lom_typical_age_range" IS 'foreign key LomTypicalAgeRange(id, __tag_kind_lom_typical_age_range_b2nwhfufjs) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_typical_age_range_fk_lom_mvwf7dmhci" ON "qti"."lom_typical_age_range" IS 'foreign key LomTypicalAgeRange(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_typical_learning_time_fk_id_tag_kind_lom_43cggo65yx" ON "qti"."lom_typical_learning_time" IS 'foreign key LomTypicalLearningTime(id, __tag_kind_lom_typical_learning_time_jvgzdwqqg4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__lom_typical_learning_time_fk_lom_rybcun2wt3" ON "qti"."lom_typical_learning_time" IS 'foreign key LomTypicalLearningTime(lom) to Lom(id)';

COMMENT ON CONSTRAINT "__lom_value_fk_id_parent_kind_k3ati6fakb" ON "qti"."lom_value" IS 'foreign key LomValue(id, parentKind) to Edge(child, parentKind)';

COMMENT ON INDEX "qti"."__lom_annotation_ix_lom_e2eimfmnfc" IS 'btree index LomAnnotation(lom)';

COMMENT ON INDEX "qti"."__lom_classification_ix_lom_c74wuapevs" IS 'btree index LomClassification(lom)';

COMMENT ON INDEX "qti"."__lom_context_ix_lom_7mcdhp6zav" IS 'btree index LomContext(lom)';

COMMENT ON INDEX "qti"."__lom_difficulty_ix_lom_h6zzds2vp5" IS 'btree index LomDifficulty(lom)';

COMMENT ON INDEX "qti"."__lom_educational_ix_lom_capn5cdki5" IS 'btree index LomEducational(lom)';

COMMENT ON INDEX "qti"."__lom_entry_lang_string_ix_lom_rjgjkdwiep" IS 'btree index LomEntryLangString(lom)';

COMMENT ON INDEX "qti"."__lom_intended_end_user_role_ix_lom_gt2d4jzpsr" IS 'btree index LomIntendedEndUserRole(lom)';

COMMENT ON INDEX "qti"."__lom_interactivity_level_ix_lom_up36fuwjat" IS 'btree index LomInteractivityLevel(lom)';

COMMENT ON INDEX "qti"."__lom_interactivity_type_ix_lom_4uqluzxxew" IS 'btree index LomInteractivityType(lom)';

COMMENT ON INDEX "qti"."__lom_kind_ix_lom_gmrpylwpku" IS 'btree index LomKind(lom)';

COMMENT ON INDEX "qti"."__lom_learning_resource_type_ix_lom_2vhkaf4fwj" IS 'btree index LomLearningResourceType(lom)';

COMMENT ON INDEX "qti"."__lom_purpose_ix_lom_s255xvv4jg" IS 'btree index LomPurpose(lom)';

COMMENT ON INDEX "qti"."__lom_relation_ix_lom_euclmi77pp" IS 'btree index LomRelation(lom)';

COMMENT ON INDEX "qti"."__lom_resource_ix_lom_w6xzhkqagp" IS 'btree index LomResource(lom)';

COMMENT ON INDEX "qti"."__lom_semantic_density_ix_lom_qxdpkf2jc2" IS 'btree index LomSemanticDensity(lom)';

COMMENT ON INDEX "qti"."__lom_source_lang_string_ix_lom_m7onpvx5h7" IS 'btree index LomSourceLangString(lom)';

COMMENT ON INDEX "qti"."__lom_taxon_ix_lom_cvrvpisqtw" IS 'btree index LomTaxon(lom)';

COMMENT ON INDEX "qti"."__lom_taxon_path_ix_lom_u5esjg4mdm" IS 'btree index LomTaxonPath(lom)';

COMMENT ON INDEX "qti"."__lom_typical_age_range_ix_lom_xd346hbqwo" IS 'btree index LomTypicalAgeRange(lom)';

COMMENT ON INDEX "qti"."__lom_typical_learning_time_ix_lom_6i456qniqn" IS 'btree index LomTypicalLearningTime(lom)';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vleugtkftj" ON "qti"."access_for_all_resource" IS 'trigger of law alternatives of Node.kind on AccessForAllResource';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_l4foyh3kda" ON "qti"."lom_annotation" IS 'trigger of law alternatives of Node.kind on LomAnnotation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_azbqyyfzvb" ON "qti"."lom_classification" IS 'trigger of law alternatives of Node.kind on LomClassification';

COMMENT ON TRIGGER "__law_node_kind_alternatives_eopjbq47sr" ON "qti"."lom_context" IS 'trigger of law alternatives of Node.kind on LomContext';

COMMENT ON TRIGGER "__law_node_kind_alternatives_he2rgj5mbx" ON "qti"."lom_contribute" IS 'trigger of law alternatives of Node.kind on LomContribute';

COMMENT ON TRIGGER "__law_node_kind_alternatives_r2e6hdkalh" ON "qti"."lom_copyright_and_other_restrictions" IS 'trigger of law alternatives of Node.kind on LomCopyrightAndOtherRestrictions';

COMMENT ON TRIGGER "__law_node_kind_alternatives_shvebtrlgf" ON "qti"."lom_cost" IS 'trigger of law alternatives of Node.kind on LomCost';

COMMENT ON TRIGGER "__law_node_kind_alternatives_l2hrke52xd" ON "qti"."lom_coverage" IS 'trigger of law alternatives of Node.kind on LomCoverage';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rumdkk3upt" ON "qti"."lom_date" IS 'trigger of law alternatives of Node.kind on LomDate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_lmrorx3a3k" ON "qti"."lom_date_time" IS 'trigger of law alternatives of Node.kind on LomDateTime';

COMMENT ON TRIGGER "__law_node_kind_alternatives_koa233guz3" ON "qti"."lom_description" IS 'trigger of law alternatives of Node.kind on LomDescription';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dxxjmqvdoc" ON "qti"."lom_difficulty" IS 'trigger of law alternatives of Node.kind on LomDifficulty';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ecwbudisg7" ON "qti"."lom_duration" IS 'trigger of law alternatives of Node.kind on LomDuration';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bny3lmkb33" ON "qti"."lom_duration_string" IS 'trigger of law alternatives of Node.kind on LomDurationString';

COMMENT ON TRIGGER "__law_node_kind_alternatives_eey3hf6nyn" ON "qti"."lom_educational" IS 'trigger of law alternatives of Node.kind on LomEducational';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ims3brka4l" ON "qti"."lom_entity" IS 'trigger of law alternatives of Node.kind on LomEntity';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nlracufgkh" ON "qti"."lom_entry_lang_string" IS 'trigger of law alternatives of Node.kind on LomEntryLangString';

COMMENT ON TRIGGER "__law_node_kind_alternatives_jcx37zt5ue" ON "qti"."lom_format" IS 'trigger of law alternatives of Node.kind on LomFormat';

COMMENT ON TRIGGER "__law_node_kind_alternatives_taa3jqho7t" ON "qti"."lom_general" IS 'trigger of law alternatives of Node.kind on LomGeneral';

COMMENT ON TRIGGER "__law_node_kind_alternatives_njovp3m4wd" ON "qti"."lom_general_title" IS 'trigger of law alternatives of Node.kind on LomGeneralTitle';

COMMENT ON TRIGGER "__law_node_kind_alternatives_d3mibhnuku" ON "qti"."lom_id" IS 'trigger of law alternatives of Node.kind on LomId';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5atjkt54uj" ON "qti"."lom_identifier" IS 'trigger of law alternatives of Node.kind on LomIdentifier';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2kftzfane5" ON "qti"."lom_identifier_catalog" IS 'trigger of law alternatives of Node.kind on LomIdentifierCatalog';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5h54ilotkw" ON "qti"."lom_identifier_entry" IS 'trigger of law alternatives of Node.kind on LomIdentifierEntry';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kmzpkwdfwz" ON "qti"."lom_installation_remarks" IS 'trigger of law alternatives of Node.kind on LomInstallationRemarks';

COMMENT ON TRIGGER "__law_node_kind_alternatives_yqnddsb22y" ON "qti"."lom_intended_end_user_role" IS 'trigger of law alternatives of Node.kind on LomIntendedEndUserRole';

COMMENT ON TRIGGER "__law_node_kind_alternatives_l3fomfy5bl" ON "qti"."lom_interactivity_level" IS 'trigger of law alternatives of Node.kind on LomInteractivityLevel';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rhzyadldyd" ON "qti"."lom_interactivity_type" IS 'trigger of law alternatives of Node.kind on LomInteractivityType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kbwcf2fp7r" ON "qti"."lom_keyword" IS 'trigger of law alternatives of Node.kind on LomKeyword';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ac3zoxvm4j" ON "qti"."lom_kind" IS 'trigger of law alternatives of Node.kind on LomKind';

COMMENT ON TRIGGER "__law_node_kind_alternatives_frtyzfpn44" ON "qti"."lom_language" IS 'trigger of law alternatives of Node.kind on LomLanguage';

COMMENT ON TRIGGER "__law_node_kind_alternatives_q5sf354e6j" ON "qti"."lom_learning_resource_type" IS 'trigger of law alternatives of Node.kind on LomLearningResourceType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qrphqsncb2" ON "qti"."lom_life_cycle" IS 'trigger of law alternatives of Node.kind on LomLifeCycle';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nskr4gdykp" ON "qti"."lom_location" IS 'trigger of law alternatives of Node.kind on LomLocation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_i5vk5zpkqs" ON "qti"."lom_maximum_version" IS 'trigger of law alternatives of Node.kind on LomMaximumVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ivgqamob5e" ON "qti"."lom_meta_metadata" IS 'trigger of law alternatives of Node.kind on LomMetaMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2ojzrgiu3b" ON "qti"."lom_metadataschema" IS 'trigger of law alternatives of Node.kind on LomMetadataschema';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tzulcyjncq" ON "qti"."lom_minimum_version" IS 'trigger of law alternatives of Node.kind on LomMinimumVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j7umbljrel" ON "qti"."lom_name" IS 'trigger of law alternatives of Node.kind on LomName';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zxusyvmfdr" ON "qti"."lom_or_composite" IS 'trigger of law alternatives of Node.kind on LomOrComposite';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bvsjorb2ct" ON "qti"."lom_other_platform_requirements" IS 'trigger of law alternatives of Node.kind on LomOtherPlatformRequirements';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7ux7bhlsbi" ON "qti"."lom_purpose" IS 'trigger of law alternatives of Node.kind on LomPurpose';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vp5257cx4v" ON "qti"."lom_relation" IS 'trigger of law alternatives of Node.kind on LomRelation';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vf5xjk6ifd" ON "qti"."lom_requirement" IS 'trigger of law alternatives of Node.kind on LomRequirement';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7whyqfzr7w" ON "qti"."lom_resource" IS 'trigger of law alternatives of Node.kind on LomResource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xvzx2v3rl5" ON "qti"."lom_rights" IS 'trigger of law alternatives of Node.kind on LomRights';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pm2skzhtr5" ON "qti"."lom_role" IS 'trigger of law alternatives of Node.kind on LomRole';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tjvofjeefd" ON "qti"."lom_semantic_density" IS 'trigger of law alternatives of Node.kind on LomSemanticDensity';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fam52ju36s" ON "qti"."lom_size" IS 'trigger of law alternatives of Node.kind on LomSize';

COMMENT ON TRIGGER "__law_node_kind_alternatives_djllplcds2" ON "qti"."lom_source" IS 'trigger of law alternatives of Node.kind on LomSource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_a4o5fnl46x" ON "qti"."lom_source_lang_string" IS 'trigger of law alternatives of Node.kind on LomSourceLangString';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wlex3fqd5y" ON "qti"."lom_status" IS 'trigger of law alternatives of Node.kind on LomStatus';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ve5pxjgpfh" ON "qti"."lom_string" IS 'trigger of law alternatives of Node.kind on LomString';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ti3uxbwvxw" ON "qti"."lom_structure" IS 'trigger of law alternatives of Node.kind on LomStructure';

COMMENT ON TRIGGER "__law_node_kind_alternatives_n24ewornhn" ON "qti"."lom_taxon" IS 'trigger of law alternatives of Node.kind on LomTaxon';

COMMENT ON TRIGGER "__law_node_kind_alternatives_uu7kasb7av" ON "qti"."lom_taxon_path" IS 'trigger of law alternatives of Node.kind on LomTaxonPath';

COMMENT ON TRIGGER "__law_node_kind_alternatives_c3ajmngdz5" ON "qti"."lom_technical" IS 'trigger of law alternatives of Node.kind on LomTechnical';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pnqk3xgbee" ON "qti"."lom_type" IS 'trigger of law alternatives of Node.kind on LomType';

COMMENT ON TRIGGER "__law_node_kind_alternatives_unz5ymy3ef" ON "qti"."lom_typical_age_range" IS 'trigger of law alternatives of Node.kind on LomTypicalAgeRange';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kpkiz3alks" ON "qti"."lom_typical_learning_time" IS 'trigger of law alternatives of Node.kind on LomTypicalLearningTime';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qz5dugmojw" ON "qti"."lom_value" IS 'trigger of law alternatives of Node.kind on LomValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2erkrdrbjq" ON "qti"."lom_version" IS 'trigger of law alternatives of Node.kind on LomVersion';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_r4pd3dasye" ON "qti"."variant_metadata" IS 'trigger of law alternatives of Node.kind on VariantMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qra75t5mkw" ON "qti"."ws" IS 'trigger of law alternatives of Node.kind on Ws';
