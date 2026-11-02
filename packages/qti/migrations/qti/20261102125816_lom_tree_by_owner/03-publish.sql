ALTER TABLE "qti"."lom" DROP CONSTRAINT "__lom_fk_id_package_d6xf5t5xkg";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."statistic_kind", "qti"."target_object_type", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xarz6cej2e", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_4f3dzz6i4f", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ojm4wya66v", "qti"."__text_gjl5q4ofup", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_ukaaxf45sk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_default_value", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."external_lom", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_metadata", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."categorized_statistic_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."comment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_case_item_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_guid" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_labelled_guid" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_metadata_provider_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_of_guids" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_of_guids_region" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_of_guids_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_resource_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_resource_part_id" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_default_value" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."external_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_content" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_metadata" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_annotation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_classification" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_context" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_contribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_copyright_and_other_restrictions" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_cost" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_coverage" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_date" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_date_time" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_description" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_difficulty" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_duration_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_educational" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_entity" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_entry_lang_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_format" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_general" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_general_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_catalog" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_identifier_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_installation_remarks" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_intended_end_user_role" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_interactivity_level" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_interactivity_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_keyword" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_kind" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_learning_resource_type" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_purpose" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_relation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_requirement" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_rights" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_role" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_semantic_density" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_size" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_source" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_source_lang_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_status" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_string_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_structure" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_taxon" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_taxon_path" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_technical" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_typical_age_range" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_typical_learning_time" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ordinary_statistic_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."organizations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_document" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_external_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_resource_lom" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_case_count" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_glossary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_last_updated" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_deviation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_error" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."target_object" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."target_object_object_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."target_object_part_identifier" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_data" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_data_glossary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_map_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_map_entry_case_sensitive" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_mapping_lower_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_mapping_upper_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_value_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_value_field_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variant_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ws" FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."statistic_kind", "qti"."target_object_type", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xarz6cej2e", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_4f3dzz6i4f", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ojm4wya66v", "qti"."__text_gjl5q4ofup", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_ukaaxf45sk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_default_value", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."external_lom", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."categorized_statistic_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."comment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_case_item_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_guid" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_labelled_guid" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_metadata_provider_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_of_guids" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_of_guids_region" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_of_guids_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_resource_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."csm_set_resource_part_id" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_default_value" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."external_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_content" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_metadata" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ordinary_statistic_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."organizations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_document" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_external_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_resource_lom" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_case_count" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_glossary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_last_updated" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_deviation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_error" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object_object_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object_part_identifier" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_data" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_data_glossary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_map_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_map_entry_case_sensitive" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_mapping_lower_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_mapping_upper_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_typed_value_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_value_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_value_field_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ws" TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) TO "qti__author";

COMMENT ON CONSTRAINT "__file_lom_fk_lom_package_jdvawz4chd" ON "qti"."file_lom" IS 'foreign key FileLom(lom, package) to Node(id, tree)';

COMMENT ON CONSTRAINT "__manifest_lom_fk_lom_package_a6edccbozn" ON "qti"."manifest_lom" IS 'foreign key ManifestLom(lom, package) to Node(id, tree)';

COMMENT ON CONSTRAINT "__resource_lom_fk_lom_package_z2mqb4ohk3" ON "qti"."resource_lom" IS 'foreign key ResourceLom(lom, package) to Node(id, tree)';
