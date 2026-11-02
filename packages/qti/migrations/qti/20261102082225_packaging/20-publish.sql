REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xarz6cej2e", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_4f3dzz6i4f", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ojm4wya66v", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_ukaaxf45sk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_6uwfpnix5n" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."access_for_all_resource", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."entity_reference", "qti__author"."external_lom", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."operand", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" FROM "qti__author";

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

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."access_for_all_resource", "qti"."admission", "qti"."assessment_item", "qti"."attribute_entity_reference", "qti"."attribute_lexical", "qti"."binding_fit", "qti"."built_in_ref", "qti"."categorized_statistic_arm", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."comment", "qti"."correct_response_arm", "qti"."csm_case_item_uri", "qti"."csm_guid", "qti"."csm_label", "qti"."csm_labelled_guid", "qti"."csm_metadata", "qti"."csm_metadata_provider_id", "qti"."csm_set", "qti"."csm_set_of_guids", "qti"."csm_set_of_guids_region", "qti"."csm_set_of_guids_version", "qti"."csm_set_resource_label", "qti"."csm_set_resource_part_id", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_default_value", "qti"."declared_fixed", "qti"."declared_max_choices", "qti"."declared_min_choices", "qti"."declared_orientation", "qti"."declared_ref", "qti"."declared_show_hide", "qti"."declared_shuffle", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."default_value_arm", "qti"."dependency", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_title", "qti"."drd_access_mode", "qti"."drd_access_mode_adapted", "qti"."drd_adaptation_detail", "qti"."drd_adaptation_media_type", "qti"."drd_adaptation_type", "qti"."drd_api_interoperable", "qti"."drd_at_interoperable", "qti"."drd_control_flexibility", "qti"."drd_display_transformability", "qti"."drd_educational_complexity_of_adaptation", "qti"."drd_educational_level_of_adaptation", "qti"."drd_has_adaptation", "qti"."drd_hazard", "qti"."drd_is_adaptation_of", "qti"."drd_is_full_adaptation_of", "qti"."drd_is_partial_adaptation_of", "qti"."drd_language_of_adaptation", "qti"."edge", "qti"."entity_reference", "qti"."expression", "qti"."external_lom", "qti"."file", "qti"."file_content", "qti"."file_lom", "qti"."file_metadata", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."interaction_binding", "qti"."item_body", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_annotation", "qti"."lom_classification", "qti"."lom_context", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_difficulty", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_educational", "qti"."lom_entity", "qti"."lom_entry_lang_string", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_id", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_intended_end_user_role", "qti"."lom_interactivity_level", "qti"."lom_interactivity_type", "qti"."lom_keyword", "qti"."lom_kind", "qti"."lom_language", "qti"."lom_learning_resource_type", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_purpose", "qti"."lom_relation", "qti"."lom_requirement", "qti"."lom_resource", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_semantic_density", "qti"."lom_size", "qti"."lom_source", "qti"."lom_source_lang_string", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_taxon", "qti"."lom_taxon_path", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_typical_age_range", "qti"."lom_typical_learning_time", "qti"."lom_value", "qti"."lom_version", "qti"."manifest", "qti"."manifest_id", "qti"."manifest_id_of_manifest", "qti"."manifest_id_of_resource", "qti"."manifest_id_of_variant", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."namespace_declaration", "qti"."node", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."ordinary_statistic_arm", "qti"."organizations", "qti"."outcome_declaration_arm", "qti"."outcome_document", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."pi", "qti"."prompt", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_metadata", "qti"."qti_metadata_in_external_lom", "qti"."qti_metadata_in_metadata", "qti"."qti_metadata_in_resource_lom", "qti"."record_binding", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_identified", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_processing", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."schema_location", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."standard_template_reference", "qti"."statistic", "qti"."statistic_case_count", "qti"."statistic_glossary", "qti"."statistic_last_updated", "qti"."statistic_std_deviation", "qti"."statistic_std_error", "qti"."target_object", "qti"."target_object_object_type", "qti"."target_object_part_identifier", "qti"."text_node", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."usage_data", "qti"."usage_data_glossary", "qti"."usage_map_entry", "qti"."usage_map_entry_case_sensitive", "qti"."usage_mapping", "qti"."usage_mapping_lower_bound", "qti"."usage_mapping_upper_bound", "qti"."usage_typed_value", "qti"."usage_typed_value_boolean", "qti"."usage_typed_value_directed_pair", "qti"."usage_typed_value_duration", "qti"."usage_typed_value_file", "qti"."usage_typed_value_float", "qti"."usage_typed_value_identifier", "qti"."usage_typed_value_integer", "qti"."usage_typed_value_pair", "qti"."usage_typed_value_point", "qti"."usage_typed_value_string", "qti"."usage_typed_value_uri", "qti"."usage_value", "qti"."usage_value_base_type", "qti"."usage_value_field_identifier", "qti"."value_set", "qti"."value_set_interpretation", "qti"."variable_ref", "qti"."variant", "qti"."variant_metadata", "qti"."ws", "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_default_value", "qti__author"."declared_fixed", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."external_lom", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."interaction_binding", "qti__author"."item_body", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pi", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."schema_location", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable_ref", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."statistic_kind", "qti"."target_object_type", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_cz7v66q3ce", "qti"."__text_raisrajgpi", "qti"."__text_rhdrzkabze", "qti"."__text_kqeswaav46", "qti"."__text_clza6vokfo", "qti"."__text_yakcqa4zli", "qti"."__text_k3z6naurdo", "qti"."__text_6uwfpnix5n", "qti"."__text_jld3q663or", "qti"."__text_f63vbnbw4t", "qti"."__text_d72l462ftm", "qti"."__text_qtkbmkpj6l", "qti"."__text_7grqskvjta", "qti"."__text_c34ec7mxid", "qti"."__text_tyjqwtj7ky", "qti"."__text_2dix7luqoi", "qti"."__text_4f3dzz6i4f", "qti"."__text_sa4c4ywp5v", "qti"."__text_2rz6hgcvt2", "qti"."__text_4adkkv4wal", "qti"."__text_xarz6cej2e", "qti"."__text_lsy6pxooea", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ukaaxf45sk", "qti"."__text_tso7kvy6dv", "qti"."__text_ifp42a6zk6", "qti"."__text_7mulu52tr6", "qti"."__text_ieskz75v7g", "qti"."__text_popyschjwc", "qti"."__text_betq2bg2bg", "qti"."__text_qyq7zjychy", "qti"."__text_httzcaefcn", "qti"."__text_mvg26oprvk", "qti"."__text_f3hdif3553", "qti"."__text_ojm4wya66v", "qti"."__text_pftpnuhm3d", "qti"."__text_i67gmkzdk7", "qti"."__text_gjl5q4ofup", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_uia6zcss44", "qti"."__text_r5xluaej3z", "qti"."__text_ottycep7en" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

COMMENT ON DOMAIN "qti"."__text_gjl5q4ofup" IS 'text pattern c4ea03e2b4a5bf750fd3cdad78df6b1da5798ad0f03ec1b76bf38480b2d1b116';

COMMENT ON FUNCTION "qti"."__law_node_kind_alternatives_vfnu4bvxbc"() IS 'function of law alternatives of Node.kind';

COMMENT ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_uc3ag4rrj5"() IS 'function of law alternatives of UsageTypedValue.baseType';

COMMENT ON FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_hqqhqefitz"() IS 'function of law capacity of CsmLabelledGuid(id) over CsmGuid(labelledGuid) within 1..1';

COMMENT ON FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_rgy45odzq3"() IS 'function of law capacity of CsmMetadata(id) over CsmSetOfGuids(metadata) within 1..*';

COMMENT ON FUNCTION "qti"."__law_csm_set_capacity_csm_metadata_cbtwoqvm6k"() IS 'function of law capacity of CsmSet(id) over CsmMetadata(set) within 1..*';

COMMENT ON FUNCTION "qti"."__law_csm_set_of_guids_capacity_csm_labelled_guid_xefxiggzw4"() IS 'function of law capacity of CsmSetOfGuids(id) over CsmLabelledGuid(setOfGuids) within 1..*';

COMMENT ON FUNCTION "qti"."__law_node_kind_cp_metadata_manifest_capacity_csm_2gudtvojmu"() IS 'function of law capacity of Node(id) where kind = cp:metadata.manifest over CsmSet(host) within 0..1';

COMMENT ON FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_zbucedeagc"() IS 'function of law capacity of Node(id) where kind = cp:metadata.resource over CsmSet(host) within 0..1';

COMMENT ON FUNCTION "qti"."__law_statistic_capacity_target_object_74bvumeusq"() IS 'function of law capacity of Statistic(id) over TargetObject(statistic) within 1..*';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_oxlzku67eo"() IS 'function of law capacity of Statistic(id) where kind = categorized over UsageMapping(statistic) within 1..1';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_ordinary_capacity_usage_value_3onwnnq2vt"() IS 'function of law capacity of Statistic(id) where kind = ordinary over UsageValue(statistic) within 1..1';

COMMENT ON FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_cfz25f6okz"() IS 'function of law capacity of UsageMapping(id) over UsageMapEntry(mapping) within 1..*';

COMMENT ON FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_cgqxhyrzys"() IS 'function of law Document(id) where root = usagedata in UsageData(document), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_sfypheif7e"() IS 'function of law Statistic(id) where kind = categorized in CategorizedStatisticArm(id), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_ordinary_in_ordinary_statistic_yh5mxxnwqs"() IS 'function of law Statistic(id) where kind = ordinary in OrdinaryStatisticArm(id), a mirrors half';

COMMENT ON CONSTRAINT "__categorized_statistic_arm_pk_h7q3aym2ry" ON "qti"."categorized_statistic_arm" IS 'primary key of CategorizedStatisticArm';

COMMENT ON CONSTRAINT "__csm_case_item_uri_pk_r33uv2vnpu" ON "qti"."csm_case_item_uri" IS 'primary key of CsmCaseItemUri';

COMMENT ON CONSTRAINT "__csm_case_item_uri_key_labelled_guid_oc7lijtbnj" ON "qti"."csm_case_item_uri" IS 'key CsmCaseItemUri(labelledGuid)';

COMMENT ON CONSTRAINT "__csm_guid_pk_tntqoz5kks" ON "qti"."csm_guid" IS 'primary key of CsmGuid';

COMMENT ON CONSTRAINT "__csm_guid_key_labelled_guid_au6oxmpret" ON "qti"."csm_guid" IS 'key CsmGuid(labelledGuid)';

COMMENT ON CONSTRAINT "__csm_label_pk_cbfqww2dti" ON "qti"."csm_label" IS 'primary key of CsmLabel';

COMMENT ON CONSTRAINT "__csm_label_key_labelled_guid_nxm46w3naf" ON "qti"."csm_label" IS 'key CsmLabel(labelledGuid)';

COMMENT ON CONSTRAINT "__csm_labelled_guid_pk_4vbzo6kpar" ON "qti"."csm_labelled_guid" IS 'primary key of CsmLabelledGuid';

COMMENT ON CONSTRAINT "__csm_metadata_pk_fmjai3sx4g" ON "qti"."csm_metadata" IS 'primary key of CsmMetadata';

COMMENT ON CONSTRAINT "__csm_metadata_provider_id_pk_wzmprxwdsd" ON "qti"."csm_metadata_provider_id" IS 'primary key of CsmMetadataProviderId';

COMMENT ON CONSTRAINT "__csm_set_pk_4i6g33ufcr" ON "qti"."csm_set" IS 'primary key of CsmSet';

COMMENT ON CONSTRAINT "__csm_set_of_guids_pk_b2mr24fnze" ON "qti"."csm_set_of_guids" IS 'primary key of CsmSetOfGuids';

COMMENT ON CONSTRAINT "__csm_set_of_guids_region_pk_atzpym3yi7" ON "qti"."csm_set_of_guids_region" IS 'primary key of CsmSetOfGuidsRegion';

COMMENT ON CONSTRAINT "__csm_set_of_guids_version_pk_bkjdrvyale" ON "qti"."csm_set_of_guids_version" IS 'primary key of CsmSetOfGuidsVersion';

COMMENT ON CONSTRAINT "__csm_set_resource_label_pk_vncnpqfiee" ON "qti"."csm_set_resource_label" IS 'primary key of CsmSetResourceLabel';

COMMENT ON CONSTRAINT "__csm_set_resource_part_id_pk_3gup3c6juq" ON "qti"."csm_set_resource_part_id" IS 'primary key of CsmSetResourcePartId';

COMMENT ON CONSTRAINT "__declared_default_value_pk_eaeooi7rfq" ON "qti"."declared_default_value" IS 'primary key of DeclaredDefaultValue';

COMMENT ON CONSTRAINT "__ordinary_statistic_arm_pk_2atydtxqda" ON "qti"."ordinary_statistic_arm" IS 'primary key of OrdinaryStatisticArm';

COMMENT ON CONSTRAINT "__statistic_pk_2oijxhvzcy" ON "qti"."statistic" IS 'primary key of Statistic';

COMMENT ON CONSTRAINT "__statistic_key_id_kind_gigitdywst" ON "qti"."statistic" IS 'key Statistic(id, kind)';

COMMENT ON CONSTRAINT "__statistic_case_count_pk_6bm5s5d2s5" ON "qti"."statistic_case_count" IS 'primary key of StatisticCaseCount';

COMMENT ON CONSTRAINT "__statistic_glossary_pk_2tcpbpbqth" ON "qti"."statistic_glossary" IS 'primary key of StatisticGlossary';

COMMENT ON CONSTRAINT "__statistic_last_updated_pk_h3evptcv4z" ON "qti"."statistic_last_updated" IS 'primary key of StatisticLastUpdated';

COMMENT ON CONSTRAINT "__statistic_std_deviation_pk_bhlxmss4jd" ON "qti"."statistic_std_deviation" IS 'primary key of StatisticStdDeviation';

COMMENT ON CONSTRAINT "__statistic_std_error_pk_ztdamkayka" ON "qti"."statistic_std_error" IS 'primary key of StatisticStdError';

COMMENT ON CONSTRAINT "__target_object_pk_ei76x42qsw" ON "qti"."target_object" IS 'primary key of TargetObject';

COMMENT ON CONSTRAINT "__target_object_object_type_pk_2vn67xv5wf" ON "qti"."target_object_object_type" IS 'primary key of TargetObjectObjectType';

COMMENT ON CONSTRAINT "__target_object_part_identifier_pk_voidrtx4no" ON "qti"."target_object_part_identifier" IS 'primary key of TargetObjectPartIdentifier';

COMMENT ON CONSTRAINT "__usage_data_pk_eqdhp2h65o" ON "qti"."usage_data" IS 'primary key of UsageData';

COMMENT ON CONSTRAINT "__usage_data_key_document_afw2h62l5f" ON "qti"."usage_data" IS 'key UsageData(document)';

COMMENT ON CONSTRAINT "__usage_data_glossary_pk_is4opab36m" ON "qti"."usage_data_glossary" IS 'primary key of UsageDataGlossary';

COMMENT ON CONSTRAINT "__usage_map_entry_pk_ohtxe2v3xe" ON "qti"."usage_map_entry" IS 'primary key of UsageMapEntry';

COMMENT ON CONSTRAINT "__usage_map_entry_case_sensitive_pk_2dhqvfbfnq" ON "qti"."usage_map_entry_case_sensitive" IS 'primary key of UsageMapEntryCaseSensitive';

COMMENT ON CONSTRAINT "__usage_mapping_pk_fjex3ha54i" ON "qti"."usage_mapping" IS 'primary key of UsageMapping';

COMMENT ON CONSTRAINT "__usage_mapping_key_statistic_ml26jyw5me" ON "qti"."usage_mapping" IS 'key UsageMapping(statistic)';

COMMENT ON CONSTRAINT "__usage_mapping_lower_bound_pk_545vfbex4f" ON "qti"."usage_mapping_lower_bound" IS 'primary key of UsageMappingLowerBound';

COMMENT ON CONSTRAINT "__usage_mapping_upper_bound_pk_cfj37xex6z" ON "qti"."usage_mapping_upper_bound" IS 'primary key of UsageMappingUpperBound';

COMMENT ON CONSTRAINT "__usage_typed_value_pk_co4ojdjfxi" ON "qti"."usage_typed_value" IS 'primary key of UsageTypedValue';

COMMENT ON CONSTRAINT "__usage_typed_value_key_id_base_type_n242bzi26w" ON "qti"."usage_typed_value" IS 'key UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_boolean_pk_goxiaczxth" ON "qti"."usage_typed_value_boolean" IS 'primary key of UsageTypedValueBoolean';

COMMENT ON CONSTRAINT "__usage_typed_value_directed_pair_pk_rdxysa6ezx" ON "qti"."usage_typed_value_directed_pair" IS 'primary key of UsageTypedValueDirectedPair';

COMMENT ON CONSTRAINT "__usage_typed_value_duration_pk_iknzbe3zpy" ON "qti"."usage_typed_value_duration" IS 'primary key of UsageTypedValueDuration';

COMMENT ON CONSTRAINT "__usage_typed_value_file_pk_jvdl27ylne" ON "qti"."usage_typed_value_file" IS 'primary key of UsageTypedValueFile';

COMMENT ON CONSTRAINT "__usage_typed_value_float_pk_zkonlclfg7" ON "qti"."usage_typed_value_float" IS 'primary key of UsageTypedValueFloat';

COMMENT ON CONSTRAINT "__usage_typed_value_identifier_pk_dhkfebawe7" ON "qti"."usage_typed_value_identifier" IS 'primary key of UsageTypedValueIdentifier';

COMMENT ON CONSTRAINT "__usage_typed_value_integer_pk_ijoddnaeqm" ON "qti"."usage_typed_value_integer" IS 'primary key of UsageTypedValueInteger';

COMMENT ON CONSTRAINT "__usage_typed_value_pair_pk_eiy2hub3jo" ON "qti"."usage_typed_value_pair" IS 'primary key of UsageTypedValuePair';

COMMENT ON CONSTRAINT "__usage_typed_value_point_pk_uqgzdqkv3s" ON "qti"."usage_typed_value_point" IS 'primary key of UsageTypedValuePoint';

COMMENT ON CONSTRAINT "__usage_typed_value_string_pk_sbvusmwwrs" ON "qti"."usage_typed_value_string" IS 'primary key of UsageTypedValueString';

COMMENT ON CONSTRAINT "__usage_typed_value_uri_pk_7gc52aqoiu" ON "qti"."usage_typed_value_uri" IS 'primary key of UsageTypedValueUri';

COMMENT ON CONSTRAINT "__usage_value_pk_i2ykr2qbnf" ON "qti"."usage_value" IS 'primary key of UsageValue';

COMMENT ON CONSTRAINT "__usage_value_key_statistic_6izaekkxsa" ON "qti"."usage_value" IS 'key UsageValue(statistic)';

COMMENT ON CONSTRAINT "__usage_value_key_id_value_34zlji3jcu" ON "qti"."usage_value" IS 'key UsageValue(id, value)';

COMMENT ON CONSTRAINT "__usage_value_base_type_pk_v6447uyhax" ON "qti"."usage_value_base_type" IS 'primary key of UsageValueBaseType';

COMMENT ON CONSTRAINT "__usage_value_base_type_key_id_base_type_cmqbeas3nz" ON "qti"."usage_value_base_type" IS 'key UsageValueBaseType(id, baseType)';

COMMENT ON CONSTRAINT "__usage_value_field_identifier_pk_o2efcppipi" ON "qti"."usage_value_field_identifier" IS 'primary key of UsageValueFieldIdentifier';

COMMENT ON COLUMN "qti"."categorized_statistic_arm"."__tag_kind_ud_categorized_statistic_6idrz3enis" IS 'tag Node.kind = ud:categorizedStatistic';

COMMENT ON COLUMN "qti"."categorized_statistic_arm"."__tag_kind_categorized_mbhnwjzukq" IS 'tag Statistic.kind = categorized';

COMMENT ON COLUMN "qti"."csm_case_item_uri"."__tag_kind_csmd_case_item_uri_lxp27cu62q" IS 'tag Node.kind = csmd:caseItemURI';

COMMENT ON COLUMN "qti"."csm_guid"."__tag_kind_csmd_guid_zslp2vpfy4" IS 'tag Node.kind = csmd:GUID';

COMMENT ON COLUMN "qti"."csm_label"."__tag_kind_csmd_label_fz6gvoerne" IS 'tag Node.kind = csmd:label';

COMMENT ON COLUMN "qti"."csm_labelled_guid"."__tag_kind_csmd_labelled_guid_xvmt4w5scu" IS 'tag Node.kind = csmd:labelledGUID';

COMMENT ON COLUMN "qti"."csm_metadata"."__tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu" IS 'tag Node.kind = csmd:curriculumStandardsMetadata';

COMMENT ON COLUMN "qti"."csm_set"."__tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl" IS 'tag Node.kind = csmd:curriculumStandardsMetadataSet';

COMMENT ON COLUMN "qti"."csm_set_of_guids"."__tag_kind_csmd_set_of_gui_ds_wsrxqslv22" IS 'tag Node.kind = csmd:setOfGUIDs';

COMMENT ON COLUMN "qti"."ordinary_statistic_arm"."__tag_kind_ud_ordinary_statistic_eakzbvyu36" IS 'tag Node.kind = ud:ordinaryStatistic';

COMMENT ON COLUMN "qti"."ordinary_statistic_arm"."__tag_kind_ordinary_nxdawqnzxk" IS 'tag Statistic.kind = ordinary';

COMMENT ON COLUMN "qti"."target_object"."__tag_kind_ud_target_object_x2bagozuf2" IS 'tag Node.kind = ud:targetObject';

COMMENT ON COLUMN "qti"."usage_data"."__tag_root_usagedata_kjac3nie2g" IS 'tag Document.root = usagedata';

COMMENT ON COLUMN "qti"."usage_data"."__tag_kind_ud_usage_data_xzkq4jszsr" IS 'tag Node.kind = ud:usageData';

COMMENT ON COLUMN "qti"."usage_map_entry"."__tag_kind_ud_map_entry_e3so66labc" IS 'tag Node.kind = ud:mapEntry';

COMMENT ON COLUMN "qti"."usage_mapping"."__tag_kind_ud_mapping_nl4fsdrhrc" IS 'tag Node.kind = ud:mapping';

COMMENT ON COLUMN "qti"."usage_typed_value_boolean"."__tag_base_type_boolean_spkprt4ifj" IS 'tag UsageTypedValue.baseType = boolean';

COMMENT ON COLUMN "qti"."usage_typed_value_directed_pair"."__tag_base_type_directed_pair_6ydufsu7xt" IS 'tag UsageTypedValue.baseType = directedPair';

COMMENT ON COLUMN "qti"."usage_typed_value_duration"."__tag_base_type_duration_74urvab32r" IS 'tag UsageTypedValue.baseType = duration';

COMMENT ON COLUMN "qti"."usage_typed_value_file"."__tag_base_type_file_v6agbrnksv" IS 'tag UsageTypedValue.baseType = file';

COMMENT ON COLUMN "qti"."usage_typed_value_float"."__tag_base_type_float_vh6x7mgon6" IS 'tag UsageTypedValue.baseType = float';

COMMENT ON COLUMN "qti"."usage_typed_value_identifier"."__tag_base_type_identifier_6sg34ylgx7" IS 'tag UsageTypedValue.baseType = identifier';

COMMENT ON COLUMN "qti"."usage_typed_value_integer"."__tag_base_type_integer_yiuetnhqbm" IS 'tag UsageTypedValue.baseType = integer';

COMMENT ON COLUMN "qti"."usage_typed_value_pair"."__tag_base_type_pair_h5mswwpdzq" IS 'tag UsageTypedValue.baseType = pair';

COMMENT ON COLUMN "qti"."usage_typed_value_point"."__tag_base_type_point_whzxkpcubn" IS 'tag UsageTypedValue.baseType = point';

COMMENT ON COLUMN "qti"."usage_typed_value_string"."__tag_base_type_string_ufr3c7ewnb" IS 'tag UsageTypedValue.baseType = string';

COMMENT ON COLUMN "qti"."usage_typed_value_uri"."__tag_base_type_uri_4pugbs6w66" IS 'tag UsageTypedValue.baseType = uri';

COMMENT ON COLUMN "qti"."usage_value"."__tag_kind_ud_value_7zu72u4s4m" IS 'tag Node.kind = ud:value';

COMMENT ON CONSTRAINT "__categorized_statistic_arm_fk_id_tag_kind_xmbqtsqu6q" ON "qti"."categorized_statistic_arm" IS 'foreign key CategorizedStatisticArm(id, __tag_kind_categorized_mbhnwjzukq) to Statistic(id, kind)';

COMMENT ON CONSTRAINT "__categorized_statistic_arm_fk_id_tag_kind_ud_jylibsfa4q" ON "qti"."categorized_statistic_arm" IS 'foreign key CategorizedStatisticArm(id, __tag_kind_ud_categorized_statistic_6idrz3enis) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_case_item_uri_fk_id_tag_kind_csmd_case_item_i6ewe5kn7k" ON "qti"."csm_case_item_uri" IS 'foreign key CsmCaseItemUri(id, __tag_kind_csmd_case_item_uri_lxp27cu62q) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_case_item_uri_fk_id_labelled_guid_fwmtpxw3u5" ON "qti"."csm_case_item_uri" IS 'foreign key CsmCaseItemUri(id, labelledGuid) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__csm_case_item_uri_fk_labelled_guid_nzrvzpcidd" ON "qti"."csm_case_item_uri" IS 'foreign key CsmCaseItemUri(labelledGuid) to CsmLabelledGuid(id)';

COMMENT ON CONSTRAINT "__csm_guid_fk_id_tag_kind_csmd_guid_zslp_2_vpfy_4_nwkt6gtnpi" ON "qti"."csm_guid" IS 'foreign key CsmGuid(id, __tag_kind_csmd_guid_zslp2vpfy4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_guid_fk_id_labelled_guid_oaaq4osnd4" ON "qti"."csm_guid" IS 'foreign key CsmGuid(id, labelledGuid) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__csm_guid_fk_labelled_guid_5yqbw56ujc" ON "qti"."csm_guid" IS 'foreign key CsmGuid(labelledGuid) to CsmLabelledGuid(id)';

COMMENT ON CONSTRAINT "__csm_label_fk_id_tag_kind_csmd_label_fz_6_gvoerne_7gcay67gr5" ON "qti"."csm_label" IS 'foreign key CsmLabel(id, __tag_kind_csmd_label_fz6gvoerne) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_label_fk_id_labelled_guid_6l5lljoiac" ON "qti"."csm_label" IS 'foreign key CsmLabel(id, labelledGuid) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__csm_label_fk_labelled_guid_hown6ftcvg" ON "qti"."csm_label" IS 'foreign key CsmLabel(labelledGuid) to CsmLabelledGuid(id)';

COMMENT ON CONSTRAINT "__csm_labelled_guid_fk_id_tag_kind_csmd_labelled_5gragyazhx" ON "qti"."csm_labelled_guid" IS 'foreign key CsmLabelledGuid(id, __tag_kind_csmd_labelled_guid_xvmt4w5scu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_labelled_guid_fk_id_set_of_guids_fyca6j7pe4" ON "qti"."csm_labelled_guid" IS 'foreign key CsmLabelledGuid(id, setOfGuids) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__csm_labelled_guid_fk_set_of_guids_gdhcsqzbjr" ON "qti"."csm_labelled_guid" IS 'foreign key CsmLabelledGuid(setOfGuids) to CsmSetOfGuids(id)';

COMMENT ON CONSTRAINT "__csm_metadata_fk_id_tag_kind_csmd_curriculum_rp6lbinb7h" ON "qti"."csm_metadata" IS 'foreign key CsmMetadata(id, __tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_metadata_fk_id_set_y3tcs7o6ng" ON "qti"."csm_metadata" IS 'foreign key CsmMetadata(id, set) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__csm_metadata_fk_set_l7csoijnrc" ON "qti"."csm_metadata" IS 'foreign key CsmMetadata(set) to CsmSet(id)';

COMMENT ON CONSTRAINT "__csm_metadata_provider_id_fk_node_wf5ryn5udk" ON "qti"."csm_metadata_provider_id" IS 'foreign key CsmMetadataProviderId(node) to CsmMetadata(id)';

COMMENT ON CONSTRAINT "__csm_set_fk_id_tag_kind_csmd_curriculum_standards_kx5n6ykiwt" ON "qti"."csm_set" IS 'foreign key CsmSet(id, __tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_set_fk_id_host_4hmsoh7xah" ON "qti"."csm_set" IS 'foreign key CsmSet(id, host) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__csm_set_of_guids_fk_id_tag_kind_csmd_set_of_gui_ds_ajy6f5qrwt" ON "qti"."csm_set_of_guids" IS 'foreign key CsmSetOfGuids(id, __tag_kind_csmd_set_of_gui_ds_wsrxqslv22) to Node(id, kind)';

COMMENT ON CONSTRAINT "__csm_set_of_guids_fk_id_metadata_uzbadimt7q" ON "qti"."csm_set_of_guids" IS 'foreign key CsmSetOfGuids(id, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__csm_set_of_guids_fk_metadata_h4nbya5u2v" ON "qti"."csm_set_of_guids" IS 'foreign key CsmSetOfGuids(metadata) to CsmMetadata(id)';

COMMENT ON CONSTRAINT "__csm_set_of_guids_region_fk_node_4bagvupzr4" ON "qti"."csm_set_of_guids_region" IS 'foreign key CsmSetOfGuidsRegion(node) to CsmSetOfGuids(id)';

COMMENT ON CONSTRAINT "__csm_set_of_guids_version_fk_node_q2tuoj34tt" ON "qti"."csm_set_of_guids_version" IS 'foreign key CsmSetOfGuidsVersion(node) to CsmSetOfGuids(id)';

COMMENT ON CONSTRAINT "__csm_set_resource_label_fk_node_adhanmu3bb" ON "qti"."csm_set_resource_label" IS 'foreign key CsmSetResourceLabel(node) to CsmSet(id)';

COMMENT ON CONSTRAINT "__csm_set_resource_part_id_fk_node_pdnb6d7hps" ON "qti"."csm_set_resource_part_id" IS 'foreign key CsmSetResourcePartId(node) to CsmSet(id)';

COMMENT ON CONSTRAINT "__declared_default_value_fk_node_sc62hbnaee" ON "qti"."declared_default_value" IS 'foreign key DeclaredDefaultValue(node) to UsageMapping(id)';

COMMENT ON CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ordinary_dilt5z26qb" ON "qti"."ordinary_statistic_arm" IS 'foreign key OrdinaryStatisticArm(id, __tag_kind_ordinary_nxdawqnzxk) to Statistic(id, kind)';

COMMENT ON CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ud_ordinary_zseoy5wvrj" ON "qti"."ordinary_statistic_arm" IS 'foreign key OrdinaryStatisticArm(id, __tag_kind_ud_ordinary_statistic_eakzbvyu36) to Node(id, kind)';

COMMENT ON CONSTRAINT "__statistic_fk_id_usage_data_position_pmfnjsi4aj" ON "qti"."statistic" IS 'foreign key Statistic(id, usageData, position) to Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__statistic_fk_usage_data_nwoajmad6i" ON "qti"."statistic" IS 'foreign key Statistic(usageData) to UsageData(id)';

COMMENT ON CONSTRAINT "__statistic_case_count_fk_node_pvxufr7h5c" ON "qti"."statistic_case_count" IS 'foreign key StatisticCaseCount(node) to Statistic(id)';

COMMENT ON CONSTRAINT "__statistic_glossary_fk_node_7nzjz7ttzn" ON "qti"."statistic_glossary" IS 'foreign key StatisticGlossary(node) to Statistic(id)';

COMMENT ON CONSTRAINT "__statistic_last_updated_fk_node_qrhiuxql3v" ON "qti"."statistic_last_updated" IS 'foreign key StatisticLastUpdated(node) to Statistic(id)';

COMMENT ON CONSTRAINT "__statistic_std_deviation_fk_node_7zxcnqmijw" ON "qti"."statistic_std_deviation" IS 'foreign key StatisticStdDeviation(node) to Statistic(id)';

COMMENT ON CONSTRAINT "__statistic_std_error_fk_node_ku6rxsvhg2" ON "qti"."statistic_std_error" IS 'foreign key StatisticStdError(node) to Statistic(id)';

COMMENT ON CONSTRAINT "__target_object_fk_id_tag_kind_ud_target_object_x_2_arc7hkfmij" ON "qti"."target_object" IS 'foreign key TargetObject(id, __tag_kind_ud_target_object_x2bagozuf2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__target_object_fk_id_statistic_position_vyq6q4dl7z" ON "qti"."target_object" IS 'foreign key TargetObject(id, statistic, position) to Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__target_object_fk_statistic_ydn64n4rjx" ON "qti"."target_object" IS 'foreign key TargetObject(statistic) to Statistic(id)';

COMMENT ON CONSTRAINT "__target_object_object_type_fk_node_whzj65dcmc" ON "qti"."target_object_object_type" IS 'foreign key TargetObjectObjectType(node) to TargetObject(id)';

COMMENT ON CONSTRAINT "__target_object_part_identifier_fk_node_jtw7qkfdkl" ON "qti"."target_object_part_identifier" IS 'foreign key TargetObjectPartIdentifier(node) to TargetObject(id)';

COMMENT ON CONSTRAINT "__usage_data_fk_document_tag_root_usagedata_kjac_3_3yy4v3yjfw" ON "qti"."usage_data" IS 'foreign key UsageData(document, __tag_root_usagedata_kjac3nie2g) to Document(id, root)';

COMMENT ON CONSTRAINT "__usage_data_fk_id_tag_kind_ud_usage_data_xzkq_4_mlglt3k4yv" ON "qti"."usage_data" IS 'foreign key UsageData(id, __tag_kind_ud_usage_data_xzkq4jszsr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__usage_data_fk_id_document_twpu2pvfe2" ON "qti"."usage_data" IS 'foreign key UsageData(id, document) to TreeRoot(node, tree)';

COMMENT ON CONSTRAINT "__usage_data_glossary_fk_node_j7hz4j2c25" ON "qti"."usage_data_glossary" IS 'foreign key UsageDataGlossary(node) to UsageData(id)';

COMMENT ON CONSTRAINT "__usage_map_entry_fk_id_tag_kind_ud_map_entry_e_3_so_fnhcgcwa2p" ON "qti"."usage_map_entry" IS 'foreign key UsageMapEntry(id, __tag_kind_ud_map_entry_e3so66labc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__usage_map_entry_fk_id_mapping_position_pi57v4cipv" ON "qti"."usage_map_entry" IS 'foreign key UsageMapEntry(id, mapping, position) to Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__usage_map_entry_fk_mapping_lptlqa5gyp" ON "qti"."usage_map_entry" IS 'foreign key UsageMapEntry(mapping) to UsageMapping(id)';

COMMENT ON CONSTRAINT "__usage_map_entry_case_sensitive_fk_node_a7var5u5qn" ON "qti"."usage_map_entry_case_sensitive" IS 'foreign key UsageMapEntryCaseSensitive(node) to UsageMapEntry(id)';

COMMENT ON CONSTRAINT "__usage_mapping_fk_id_tag_kind_ud_mapping_nl_4_jppxeru7v7" ON "qti"."usage_mapping" IS 'foreign key UsageMapping(id, __tag_kind_ud_mapping_nl4fsdrhrc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__usage_mapping_fk_id_statistic_gtwrdya3qz" ON "qti"."usage_mapping" IS 'foreign key UsageMapping(id, statistic) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__usage_mapping_lower_bound_fk_node_3itc26e3f5" ON "qti"."usage_mapping_lower_bound" IS 'foreign key UsageMappingLowerBound(node) to UsageMapping(id)';

COMMENT ON CONSTRAINT "__usage_mapping_upper_bound_fk_node_ldmos5mii4" ON "qti"."usage_mapping_upper_bound" IS 'foreign key UsageMappingUpperBound(node) to UsageMapping(id)';

COMMENT ON CONSTRAINT "__usage_typed_value_fk_id_uu2uyhgqsy" ON "qti"."usage_typed_value" IS 'foreign key UsageTypedValue(id) to UsageValueBaseType(id)';

COMMENT ON CONSTRAINT "__usage_typed_value_fk_id_base_type_zuxw6by5wn" ON "qti"."usage_typed_value" IS 'foreign key UsageTypedValue(id, baseType) to UsageValueBaseType(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_fk_id_value_tr2d2dqibn" ON "qti"."usage_typed_value" IS 'foreign key UsageTypedValue(id, value) to UsageValue(id, value)';

COMMENT ON CONSTRAINT "__usage_typed_value_boolean_fk_id_tag_base_type_tqwdn5p2wh" ON "qti"."usage_typed_value_boolean" IS 'foreign key UsageTypedValueBoolean(id, __tag_base_type_boolean_spkprt4ifj) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_directed_pair_fk_id_tag_base_bchux5z64z" ON "qti"."usage_typed_value_directed_pair" IS 'foreign key UsageTypedValueDirectedPair(id, __tag_base_type_directed_pair_6ydufsu7xt) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_duration_fk_id_tag_base_type_rzbhw32hn5" ON "qti"."usage_typed_value_duration" IS 'foreign key UsageTypedValueDuration(id, __tag_base_type_duration_74urvab32r) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_file_fk_id_tag_base_type_file_v_xfjvrhb7ri" ON "qti"."usage_typed_value_file" IS 'foreign key UsageTypedValueFile(id, __tag_base_type_file_v6agbrnksv) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_float_fk_id_tag_base_type_float_emezkpqu56" ON "qti"."usage_typed_value_float" IS 'foreign key UsageTypedValueFloat(id, __tag_base_type_float_vh6x7mgon6) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_identifier_fk_id_tag_base_type_6fq5ir4ajo" ON "qti"."usage_typed_value_identifier" IS 'foreign key UsageTypedValueIdentifier(id, __tag_base_type_identifier_6sg34ylgx7) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_integer_fk_id_tag_base_type_b2r4e3dhf4" ON "qti"."usage_typed_value_integer" IS 'foreign key UsageTypedValueInteger(id, __tag_base_type_integer_yiuetnhqbm) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_pair_fk_id_tag_base_type_pair_h_uaze3kxylj" ON "qti"."usage_typed_value_pair" IS 'foreign key UsageTypedValuePair(id, __tag_base_type_pair_h5mswwpdzq) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_point_fk_id_tag_base_type_point_3omhonedtf" ON "qti"."usage_typed_value_point" IS 'foreign key UsageTypedValuePoint(id, __tag_base_type_point_whzxkpcubn) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_string_fk_id_tag_base_type_knofdg2zac" ON "qti"."usage_typed_value_string" IS 'foreign key UsageTypedValueString(id, __tag_base_type_string_ufr3c7ewnb) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_typed_value_uri_fk_id_tag_base_type_uri_4_qsesxo5oey" ON "qti"."usage_typed_value_uri" IS 'foreign key UsageTypedValueUri(id, __tag_base_type_uri_4pugbs6w66) to UsageTypedValue(id, baseType)';

COMMENT ON CONSTRAINT "__usage_value_fk_id_tag_kind_ud_value_7_zu_72_u_4_s_4hinav4ri5" ON "qti"."usage_value" IS 'foreign key UsageValue(id, __tag_kind_ud_value_7zu72u4s4m) to Node(id, kind)';

COMMENT ON CONSTRAINT "__usage_value_fk_id_statistic_a4hdimdyxe" ON "qti"."usage_value" IS 'foreign key UsageValue(id, statistic) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__usage_value_base_type_fk_id_y5x74dm56h" ON "qti"."usage_value_base_type" IS 'foreign key UsageValueBaseType(id) to UsageTypedValue(id)';

COMMENT ON CONSTRAINT "__usage_value_base_type_fk_id_hev5rwn234" ON "qti"."usage_value_base_type" IS 'foreign key UsageValueBaseType(id) to UsageValue(id)';

COMMENT ON CONSTRAINT "__usage_value_field_identifier_fk_id_eew5qxaz6q" ON "qti"."usage_value_field_identifier" IS 'foreign key UsageValueFieldIdentifier(id) to UsageValue(id)';

COMMENT ON INDEX "qti"."__csm_guid_key_labelled_guid_jq2qkjitxd" IS 'unique index CsmGuid(labelledGuid)';

COMMENT ON INDEX "qti"."__csm_labelled_guid_ix_set_of_guids_lays2gya5y" IS 'btree index CsmLabelledGuid(setOfGuids)';

COMMENT ON INDEX "qti"."__csm_metadata_ix_set_rck25qjlcy" IS 'btree index CsmMetadata(set)';

COMMENT ON INDEX "qti"."__csm_set_ix_host_drqp6qqwbo" IS 'btree index CsmSet(host)';

COMMENT ON INDEX "qti"."__csm_set_of_guids_ix_metadata_fesdddgqyo" IS 'btree index CsmSetOfGuids(metadata)';

COMMENT ON INDEX "qti"."__statistic_ix_usage_data_qsqkjb3h57" IS 'btree index Statistic(usageData)';

COMMENT ON INDEX "qti"."__target_object_ix_statistic_kklaigmtdy" IS 'btree index TargetObject(statistic)';

COMMENT ON INDEX "qti"."__usage_map_entry_ix_mapping_omtvpx4lh7" IS 'btree index UsageMapEntry(mapping)';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vleugtkftj" ON "qti"."access_for_all_resource" IS 'trigger of law alternatives of Node.kind on AccessForAllResource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5skm7kkgib" ON "qti"."assessment_item" IS 'trigger of law alternatives of Node.kind on AssessmentItem';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ajxrlesyqa" ON "qti"."categorized_statistic_arm" IS 'trigger of law alternatives of Node.kind on CategorizedStatisticArm';

COMMENT ON TRIGGER "__law_statistic_kind_categorized_in_categorized_2fgm3jzl2i" ON "qti"."categorized_statistic_arm" IS 'trigger of law Statistic(id) where kind = categorized in CategorizedStatisticArm(id), a mirrors half on CategorizedStatisticArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_upkyeydjz7" ON "qti"."choice_interaction" IS 'trigger of law alternatives of Node.kind on ChoiceInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_py43thbsit" ON "qti"."comment" IS 'trigger of law alternatives of Node.kind on Comment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ikfqexnafy" ON "qti"."correct_response_arm" IS 'trigger of law alternatives of Node.kind on CorrectResponseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bvqyhi6fp6" ON "qti"."csm_case_item_uri" IS 'trigger of law alternatives of Node.kind on CsmCaseItemUri';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ygclwcp7jz" ON "qti"."csm_guid" IS 'trigger of law alternatives of Node.kind on CsmGuid';

COMMENT ON TRIGGER "__law_csm_labelled_guid_capacity_csm_guid_3v66x7wst4" ON "qti"."csm_guid" IS 'trigger of law capacity of CsmLabelledGuid(id) over CsmGuid(labelledGuid) within 1..1 on CsmGuid';

COMMENT ON TRIGGER "__law_node_kind_alternatives_isxitibhvv" ON "qti"."csm_label" IS 'trigger of law alternatives of Node.kind on CsmLabel';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j546j45m54" ON "qti"."csm_labelled_guid" IS 'trigger of law alternatives of Node.kind on CsmLabelledGuid';

COMMENT ON TRIGGER "__law_csm_labelled_guid_capacity_csm_guid_34jwgxvw6h" ON "qti"."csm_labelled_guid" IS 'trigger of law capacity of CsmLabelledGuid(id) over CsmGuid(labelledGuid) within 1..1 on CsmLabelledGuid';

COMMENT ON TRIGGER "__law_csm_set_of_guids_capacity_csm_labelled_guid_m2bwacbfwn" ON "qti"."csm_labelled_guid" IS 'trigger of law capacity of CsmSetOfGuids(id) over CsmLabelledGuid(setOfGuids) within 1..* on CsmLabelledGuid';

COMMENT ON TRIGGER "__law_node_kind_alternatives_jgu2b3ds36" ON "qti"."csm_metadata" IS 'trigger of law alternatives of Node.kind on CsmMetadata';

COMMENT ON TRIGGER "__law_csm_metadata_capacity_csm_set_of_guids_ayqfd6zeq7" ON "qti"."csm_metadata" IS 'trigger of law capacity of CsmMetadata(id) over CsmSetOfGuids(metadata) within 1..* on CsmMetadata';

COMMENT ON TRIGGER "__law_csm_set_capacity_csm_metadata_pvtu2rqnnf" ON "qti"."csm_metadata" IS 'trigger of law capacity of CsmSet(id) over CsmMetadata(set) within 1..* on CsmMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cvzeekqezf" ON "qti"."csm_set" IS 'trigger of law alternatives of Node.kind on CsmSet';

COMMENT ON TRIGGER "__law_csm_set_capacity_csm_metadata_2e5aojxlfg" ON "qti"."csm_set" IS 'trigger of law capacity of CsmSet(id) over CsmMetadata(set) within 1..* on CsmSet';

COMMENT ON TRIGGER "__law_node_kind_cp_metadata_manifest_capacity_csm_cpgyjqmjbq" ON "qti"."csm_set" IS 'trigger of law capacity of Node(id) where kind = cp:metadata.manifest over CsmSet(host) within 0..1 on CsmSet';

COMMENT ON TRIGGER "__law_node_kind_cp_metadata_resource_capacity_csm_ib2pd7otc6" ON "qti"."csm_set" IS 'trigger of law capacity of Node(id) where kind = cp:metadata.resource over CsmSet(host) within 0..1 on CsmSet';

COMMENT ON TRIGGER "__law_node_kind_alternatives_lknday5far" ON "qti"."csm_set_of_guids" IS 'trigger of law alternatives of Node.kind on CsmSetOfGuids';

COMMENT ON TRIGGER "__law_csm_metadata_capacity_csm_set_of_guids_szjiqwuovm" ON "qti"."csm_set_of_guids" IS 'trigger of law capacity of CsmMetadata(id) over CsmSetOfGuids(metadata) within 1..* on CsmSetOfGuids';

COMMENT ON TRIGGER "__law_csm_set_of_guids_capacity_csm_labelled_guid_oihkjptw3g" ON "qti"."csm_set_of_guids" IS 'trigger of law capacity of CsmSetOfGuids(id) over CsmLabelledGuid(setOfGuids) within 1..* on CsmSetOfGuids';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5vhdpgz25" ON "qti"."declared_value" IS 'trigger of law alternatives of Node.kind on DeclaredValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ssrxqpoval" ON "qti"."default_value_arm" IS 'trigger of law alternatives of Node.kind on DefaultValueArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6td2gbd75c" ON "qti"."dependency" IS 'trigger of law alternatives of Node.kind on Dependency';

COMMENT ON TRIGGER "__law_document_root_usagedata_in_usage_data_kvqjkcrq2t" ON "qti"."document" IS 'trigger of law Document(id) where root = usagedata in UsageData(document), a mirrors half on Document';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_tbjeddkuni" ON "qti"."file_metadata" IS 'trigger of law alternatives of Node.kind on FileMetadata';

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

COMMENT ON TRIGGER "__law_node_kind_cp_metadata_manifest_capacity_csm_yqljsdph5x" ON "qti"."node" IS 'trigger of law capacity of Node(id) where kind = cp:metadata.manifest over CsmSet(host) within 0..1 on Node';

COMMENT ON TRIGGER "__law_node_kind_cp_metadata_resource_capacity_csm_tvs6n56pcw" ON "qti"."node" IS 'trigger of law capacity of Node(id) where kind = cp:metadata.resource over CsmSet(host) within 0..1 on Node';

COMMENT ON TRIGGER "__law_node_kind_alternatives_d2tsggz5gn" ON "qti"."ordinary_statistic_arm" IS 'trigger of law alternatives of Node.kind on OrdinaryStatisticArm';

COMMENT ON TRIGGER "__law_statistic_kind_ordinary_in_ordinary_statistic_vhqjmcizy2" ON "qti"."ordinary_statistic_arm" IS 'trigger of law Statistic(id) where kind = ordinary in OrdinaryStatisticArm(id), a mirrors half on OrdinaryStatisticArm';

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

COMMENT ON TRIGGER "__law_statistic_capacity_target_object_ybxtmjx7im" ON "qti"."statistic" IS 'trigger of law capacity of Statistic(id) over TargetObject(statistic) within 1..* on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_categorized_capacity_usage_s7xvqrkii7" ON "qti"."statistic" IS 'trigger of law capacity of Statistic(id) where kind = categorized over UsageMapping(statistic) within 1..1 on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_ordinary_capacity_usage_value_crlbzwchwi" ON "qti"."statistic" IS 'trigger of law capacity of Statistic(id) where kind = ordinary over UsageValue(statistic) within 1..1 on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_categorized_in_categorized_ndyk4nqx7d" ON "qti"."statistic" IS 'trigger of law Statistic(id) where kind = categorized in CategorizedStatisticArm(id), a mirrors half on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_ordinary_in_ordinary_statistic_5vv5p2ugx4" ON "qti"."statistic" IS 'trigger of law Statistic(id) where kind = ordinary in OrdinaryStatisticArm(id), a mirrors half on Statistic';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mezsfabltu" ON "qti"."target_object" IS 'trigger of law alternatives of Node.kind on TargetObject';

COMMENT ON TRIGGER "__law_statistic_capacity_target_object_eiitglm36v" ON "qti"."target_object" IS 'trigger of law capacity of Statistic(id) over TargetObject(statistic) within 1..* on TargetObject';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dhvs325itr" ON "qti"."text_node" IS 'trigger of law alternatives of Node.kind on TextNode';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kf644b357n" ON "qti"."usage_data" IS 'trigger of law alternatives of Node.kind on UsageData';

COMMENT ON TRIGGER "__law_document_root_usagedata_in_usage_data_niakln7c6h" ON "qti"."usage_data" IS 'trigger of law Document(id) where root = usagedata in UsageData(document), a mirrors half on UsageData';

COMMENT ON TRIGGER "__law_node_kind_alternatives_y7bjvg3b2c" ON "qti"."usage_map_entry" IS 'trigger of law alternatives of Node.kind on UsageMapEntry';

COMMENT ON TRIGGER "__law_usage_mapping_capacity_usage_map_entry_vc5veq5kfg" ON "qti"."usage_map_entry" IS 'trigger of law capacity of UsageMapping(id) over UsageMapEntry(mapping) within 1..* on UsageMapEntry';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dcxwpreqvx" ON "qti"."usage_mapping" IS 'trigger of law alternatives of Node.kind on UsageMapping';

COMMENT ON TRIGGER "__law_statistic_kind_categorized_capacity_usage_ybxodga5vn" ON "qti"."usage_mapping" IS 'trigger of law capacity of Statistic(id) where kind = categorized over UsageMapping(statistic) within 1..1 on UsageMapping';

COMMENT ON TRIGGER "__law_usage_mapping_capacity_usage_map_entry_2zvagskyfp" ON "qti"."usage_mapping" IS 'trigger of law capacity of UsageMapping(id) over UsageMapEntry(mapping) within 1..* on UsageMapping';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_3fpd3s5cwp" ON "qti"."usage_typed_value" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValue';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_yiisbv76nn" ON "qti"."usage_typed_value_boolean" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueBoolean';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_nlzzahvzes" ON "qti"."usage_typed_value_directed_pair" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueDirectedPair';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_gn2njtwgnq" ON "qti"."usage_typed_value_duration" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueDuration';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_7qzj45ebb3" ON "qti"."usage_typed_value_file" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueFile';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_km73eguj7f" ON "qti"."usage_typed_value_float" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueFloat';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_utqd4ncso7" ON "qti"."usage_typed_value_identifier" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueIdentifier';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_5zftyhella" ON "qti"."usage_typed_value_integer" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueInteger';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_a3qnijf5xk" ON "qti"."usage_typed_value_pair" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValuePair';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_g6mvqh4k6r" ON "qti"."usage_typed_value_point" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValuePoint';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_n27xljpsb3" ON "qti"."usage_typed_value_string" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueString';

COMMENT ON TRIGGER "__law_usage_typed_value_base_type_alternatives_32vxvbfd6r" ON "qti"."usage_typed_value_uri" IS 'trigger of law alternatives of UsageTypedValue.baseType on UsageTypedValueUri';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zk2hwvrcbp" ON "qti"."usage_value" IS 'trigger of law alternatives of Node.kind on UsageValue';

COMMENT ON TRIGGER "__law_statistic_kind_ordinary_capacity_usage_value_7kerdmoo6h" ON "qti"."usage_value" IS 'trigger of law capacity of Statistic(id) where kind = ordinary over UsageValue(statistic) within 1..1 on UsageValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tr4wev6nbi" ON "qti"."variant" IS 'trigger of law alternatives of Node.kind on Variant';

COMMENT ON TRIGGER "__law_node_kind_alternatives_r4pd3dasye" ON "qti"."variant_metadata" IS 'trigger of law alternatives of Node.kind on VariantMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qra75t5mkw" ON "qti"."ws" IS 'trigger of law alternatives of Node.kind on Ws';
