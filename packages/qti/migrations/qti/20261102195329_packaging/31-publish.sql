ALTER TABLE "qti"."qti_metadata" DROP CONSTRAINT "__qti_metadata_fk_metadata_tag_kind_cp_metadata_qzc3ba74y7";

ALTER TABLE "qti"."qti_metadata" DROP CONSTRAINT "__qti_metadata_fk_id_metadata_sjj6dojrsg";

ALTER TABLE "qti"."lom_object_identifier" DROP CONSTRAINT "__lom_object_identifier_fk_lom_position_collapsed_jelttyi4kl";

ALTER TABLE "qti"."lom_identifier_entry" DROP CONSTRAINT "__lom_identifier_entry_fk_lom_position_egoqmumcjs";

ALTER TABLE "qti"."lom_identifier_catalog" DROP CONSTRAINT "__lom_identifier_catalog_fk_lom_position_pa3s54vugg";

ALTER TABLE "qti"."lom_identifier" DROP CONSTRAINT "__lom_identifier_fk_id_position_nbqr2amaal";

ALTER TABLE "qti"."lom" DROP CONSTRAINT "__lom_fk_id_package_d6xf5t5xkg";

ALTER TABLE "qti"."lom_identifier_entry" DROP CONSTRAINT "__lom_identifier_entry_key_lom_position_collapsed_gj4fwidr7p";

ALTER TABLE "qti"."lom_identifier_entry" DROP CONSTRAINT "__lom_identifier_entry_key_lom_position_w4f2vsovly";

ALTER TABLE "qti"."lom_identifier" DROP CONSTRAINT "__lom_identifier_key_lom_position_i5jf554z7n";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_celz4obcnh", "qti"."__text_uc3mvgolsg", "qti"."__text_gemmttam7z", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_hvweswafjf", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_ibaizj6fv3", "qti"."__text_gubl3xpcnx", "qti"."__text_mmzgy7vcfw", "qti"."__text_vtz3bnghkc", "qti"."__text_djykoynpls", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_ojm4wya66v", "qti"."__text_u3q4acbjwm", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_2hoxdcszyn", "qti"."__text_6uwfpnix5n", "qti"."__text_vwnl4b5fqr", "qti"."__text_wuvwyowttn" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."and", "qti__author"."any_n", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."container_size", "qti__author"."contains", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_rounding_mode", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_substring", "qti__author"."declared_tolerance_mode", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."divide", "qti__author"."document_id", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."fallback", "qti__author"."field_value", "qti__author"."file_content", "qti__author"."gcd", "qti__author"."gt", "qti__author"."gte", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."lcm", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."match", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."member", "qti__author"."min", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."operand", "qti__author"."or", "qti__author"."ordered", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package_entry", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."power", "qti__author"."product", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."resource_href", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."round", "qti__author"."round_to", "qti__author"."schema_location", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."stats_operator", "qti__author"."string_match", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_if_arm", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_node", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable", "qti__author"."variable_ref", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."and" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."any_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."comment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."container_size" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."contains" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."correct" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator_class" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator_definition" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_lower_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_upper_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_rounding_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_substring" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_tolerance_mode" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."default" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."delete" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dependency" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."divide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."duration_gte" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."duration_lt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."edge" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."equal" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."equal_rounded" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."equal_tolerance" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."exit_response" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."exit_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."exit_test" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression_exclude_category" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression_include_category" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression_max" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression_section_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression_weight_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."fallback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."field_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_content" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gcd" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gte" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_height" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."index" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inside" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."integer_divide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."integer_modulus" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."integer_to_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interaction_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."is_null" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_body" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lcm" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lookup_outcome_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lte" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_response" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_response_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_constant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_operator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."max" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."member" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."multiple" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."namespace_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."not" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."null" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_correct" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_incorrect" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_presented" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_responded" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_selected" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."operand" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."or" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ordered" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."organizations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_condition_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_else_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_else_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_maximum_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_min_max" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_minimum_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_processing" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_processing_fragment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."p" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."package" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."package_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pattern_match" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pi" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."power" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."product" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_float_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_integer_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_integer_step" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_field" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."repeat" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_titled" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resources" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_condition_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_else_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_else_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_fragment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_item" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."round" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."round_to" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rule_operand" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_correct_response" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_default_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_outcome_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_template_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice_template_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."standard_template_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stats_operator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."string_match" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."substring" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."subtract" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."sum" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_condition_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_constraint" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_else_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_else_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_parameter_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_processing" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_variables" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_variables_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_doctype" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_export_charset" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_misc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_root" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_encoding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_standalone" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."truncate" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_weight_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ws" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_encoding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_parse" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_xpointer" FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."statistic_kind", "qti"."target_object_type", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_celz4obcnh", "qti"."__text_uc3mvgolsg", "qti"."__text_gemmttam7z", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_hvweswafjf", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xarz6cej2e", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_4f3dzz6i4f", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_ibaizj6fv3", "qti"."__text_gubl3xpcnx", "qti"."__text_mmzgy7vcfw", "qti"."__text_vtz3bnghkc", "qti"."__text_djykoynpls", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ojm4wya66v", "qti"."__text_gjl5q4ofup", "qti"."__text_u3q4acbjwm", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_ukaaxf45sk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_2hoxdcszyn", "qti"."__text_6uwfpnix5n", "qti"."__text_vwnl4b5fqr", "qti"."__text_wuvwyowttn" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."and", "qti__author"."any_n", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."container_size", "qti__author"."contains", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_default_value", "qti__author"."declared_fixed", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_substring", "qti__author"."declared_tolerance_mode", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."divide", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."gcd", "qti__author"."gt", "qti__author"."gte", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."lcm", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."match", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."member", "qti__author"."min", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."ordered", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."power", "qti__author"."product", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."rule_operand", "qti__author"."schema_location", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."string_match", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_if_arm", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."and" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."any_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."categorized_statistic_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."comment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."container_size" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."contains" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."correct" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_default_value" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_max" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_section_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_weight_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."external_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."fallback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."field_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_content" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_metadata" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lookup_outcome_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lte" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_manifest" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_variant" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ordinary_statistic_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."organizations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_condition_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_document" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_external_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_resource_lom" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_case_count" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_glossary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_last_updated" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_deviation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_error" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stats_operator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."string_match" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."substring" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."subtract" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object_object_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object_part_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_condition_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_constraint" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_else_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_else_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_parameter_ref" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_weight_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant_metadata" TO "qti__author";

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

REVOKE ALL ON TABLE "qti"."access_for_all_resource", "qti"."admission", "qti"."and", "qti"."any_n", "qti"."assessment_item", "qti"."attribute_entity_reference", "qti"."attribute_lexical", "qti"."binding_fit", "qti"."built_in_ref", "qti"."categorized_statistic_arm", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."comment", "qti"."container_size", "qti"."contains", "qti"."correct", "qti"."correct_response_arm", "qti"."csm_case_item_uri", "qti"."csm_guid", "qti"."csm_label", "qti"."csm_labelled_guid", "qti"."csm_metadata", "qti"."csm_metadata_provider_id", "qti"."csm_set", "qti"."csm_set_of_guids", "qti"."csm_set_of_guids_region", "qti"."csm_set_of_guids_version", "qti"."csm_set_resource_label", "qti"."csm_set_resource_part_id", "qti"."custom_operator", "qti"."custom_operator_class", "qti"."custom_operator_definition", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_default_value", "qti"."declared_fixed", "qti"."declared_include_lower_bound", "qti"."declared_include_upper_bound", "qti"."declared_max_choices", "qti"."declared_min_choices", "qti"."declared_orientation", "qti"."declared_ref", "qti"."declared_rounding_mode", "qti"."declared_show_hide", "qti"."declared_shuffle", "qti"."declared_substring", "qti"."declared_tolerance_mode", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."default", "qti"."default_value_arm", "qti"."delete", "qti"."dependency", "qti"."divide", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_title", "qti"."drd_access_mode", "qti"."drd_access_mode_adapted", "qti"."drd_adaptation_detail", "qti"."drd_adaptation_media_type", "qti"."drd_adaptation_type", "qti"."drd_api_interoperable", "qti"."drd_at_interoperable", "qti"."drd_control_flexibility", "qti"."drd_display_transformability", "qti"."drd_educational_complexity_of_adaptation", "qti"."drd_educational_level_of_adaptation", "qti"."drd_has_adaptation", "qti"."drd_hazard", "qti"."drd_is_adaptation_of", "qti"."drd_is_full_adaptation_of", "qti"."drd_is_partial_adaptation_of", "qti"."drd_language_of_adaptation", "qti"."duration_gte", "qti"."duration_lt", "qti"."edge", "qti"."entity_reference", "qti"."equal", "qti"."equal_rounded", "qti"."equal_tolerance", "qti"."exit_response", "qti"."exit_template", "qti"."exit_test", "qti"."expression", "qti"."expression_exclude_category", "qti"."expression_include_category", "qti"."expression_max", "qti"."expression_section_identifier", "qti"."expression_weight_identifier", "qti"."external_lom", "qti"."fallback", "qti"."field_value", "qti"."file", "qti"."file_content", "qti"."file_lom", "qti"."file_metadata", "qti"."gcd", "qti"."gt", "qti"."gte", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."index", "qti"."inside", "qti"."integer_divide", "qti"."integer_modulus", "qti"."integer_to_float", "qti"."interaction_binding", "qti"."is_null", "qti"."item_body", "qti"."lcm", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_annotation", "qti"."lom_classification", "qti"."lom_context", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_difficulty", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_educational", "qti"."lom_entity", "qti"."lom_entry_lang_string", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_id", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_intended_end_user_role", "qti"."lom_interactivity_level", "qti"."lom_interactivity_type", "qti"."lom_keyword", "qti"."lom_kind", "qti"."lom_language", "qti"."lom_learning_resource_type", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_purpose", "qti"."lom_relation", "qti"."lom_requirement", "qti"."lom_resource", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_semantic_density", "qti"."lom_size", "qti"."lom_source", "qti"."lom_source_lang_string", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_taxon", "qti"."lom_taxon_path", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_typical_age_range", "qti"."lom_typical_learning_time", "qti"."lom_value", "qti"."lom_version", "qti"."lookup_outcome_value", "qti"."lt", "qti"."lte", "qti"."manifest", "qti"."manifest_id", "qti"."manifest_id_of_manifest", "qti"."manifest_id_of_resource", "qti"."manifest_id_of_variant", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."map_response", "qti"."map_response_point", "qti"."match", "qti"."math_constant", "qti"."math_operator", "qti"."max", "qti"."member", "qti"."min", "qti"."multiple", "qti"."namespace_declaration", "qti"."node", "qti"."not", "qti"."null", "qti"."number_correct", "qti"."number_incorrect", "qti"."number_presented", "qti"."number_responded", "qti"."number_selected", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."operator_arity_unbounded", "qti"."or", "qti"."ordered", "qti"."ordinary_statistic_arm", "qti"."organizations", "qti"."outcome_condition_arm", "qti"."outcome_declaration_arm", "qti"."outcome_document", "qti"."outcome_else_arm", "qti"."outcome_else_if_arm", "qti"."outcome_if_arm", "qti"."outcome_maximum_arm", "qti"."outcome_min_max", "qti"."outcome_minimum_arm", "qti"."outcome_processing", "qti"."outcome_processing_fragment", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."pattern_match", "qti"."pi", "qti"."power", "qti"."product", "qti"."prompt", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_metadata", "qti"."qti_metadata_in_external_lom", "qti"."qti_metadata_in_metadata", "qti"."qti_metadata_in_resource_lom", "qti"."random", "qti"."random_float", "qti"."random_float_min", "qti"."random_integer", "qti"."random_integer_min", "qti"."random_integer_step", "qti"."record_binding", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."repeat", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_identified", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_condition_arm", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_else_arm", "qti"."response_else_if_arm", "qti"."response_if_arm", "qti"."response_processing", "qti"."response_processing_fragment", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."round", "qti"."round_to", "qti"."rule_operand", "qti"."schema_location", "qti"."set_correct_response", "qti"."set_default_value", "qti"."set_outcome_value", "qti"."set_template_value", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."standard_template_reference", "qti"."statistic", "qti"."statistic_case_count", "qti"."statistic_glossary", "qti"."statistic_last_updated", "qti"."statistic_std_deviation", "qti"."statistic_std_error", "qti"."stats_operator", "qti"."string_match", "qti"."substring", "qti"."subtract", "qti"."sum", "qti"."target_object", "qti"."target_object_object_type", "qti"."target_object_part_identifier", "qti"."template_condition_arm", "qti"."template_constraint", "qti"."template_else_arm", "qti"."template_else_if_arm", "qti"."template_if_arm", "qti"."template_parameter_ref", "qti"."template_processing", "qti"."test_variables", "qti"."test_variables_base_type", "qti"."text_node", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."truncate", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."usage_data", "qti"."usage_data_glossary", "qti"."usage_map_entry", "qti"."usage_map_entry_case_sensitive", "qti"."usage_mapping", "qti"."usage_mapping_lower_bound", "qti"."usage_mapping_upper_bound", "qti"."usage_typed_value", "qti"."usage_typed_value_boolean", "qti"."usage_typed_value_directed_pair", "qti"."usage_typed_value_duration", "qti"."usage_typed_value_file", "qti"."usage_typed_value_float", "qti"."usage_typed_value_identifier", "qti"."usage_typed_value_integer", "qti"."usage_typed_value_pair", "qti"."usage_typed_value_point", "qti"."usage_typed_value_string", "qti"."usage_typed_value_uri", "qti"."usage_value", "qti"."usage_value_base_type", "qti"."usage_value_field_identifier", "qti"."value_set", "qti"."value_set_interpretation", "qti"."variable", "qti"."variable_ref", "qti"."variable_weight_identifier", "qti"."variant", "qti"."variant_metadata", "qti"."ws", "qti"."x_include", "qti"."x_include_accept", "qti"."x_include_accept_language", "qti"."x_include_encoding", "qti"."x_include_href", "qti"."x_include_parse", "qti"."x_include_xpointer", "qti__author"."access_for_all_resource", "qti__author"."admission", "qti__author"."and", "qti__author"."any_n", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."container_size", "qti__author"."contains", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_default_value", "qti__author"."declared_fixed", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_substring", "qti__author"."declared_tolerance_mode", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."divide", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."gcd", "qti__author"."gt", "qti__author"."gte", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."lcm", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."match", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."member", "qti__author"."min", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."ordered", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."power", "qti__author"."product", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."rule_operand", "qti__author"."schema_location", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."string_match", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_if_arm", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."statistic_kind", "qti"."target_object_type", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_djykoynpls", "qti"."__text_cz7v66q3ce", "qti"."__text_raisrajgpi", "qti"."__text_rhdrzkabze", "qti"."__text_kqeswaav46", "qti"."__text_clza6vokfo", "qti"."__text_yakcqa4zli", "qti"."__text_k3z6naurdo", "qti"."__text_6uwfpnix5n", "qti"."__text_jld3q663or", "qti"."__text_f63vbnbw4t", "qti"."__text_d72l462ftm", "qti"."__text_qtkbmkpj6l", "qti"."__text_7grqskvjta", "qti"."__text_c34ec7mxid", "qti"."__text_tyjqwtj7ky", "qti"."__text_2dix7luqoi", "qti"."__text_4f3dzz6i4f", "qti"."__text_sa4c4ywp5v", "qti"."__text_2rz6hgcvt2", "qti"."__text_4adkkv4wal", "qti"."__text_xarz6cej2e", "qti"."__text_lsy6pxooea", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ukaaxf45sk", "qti"."__text_celz4obcnh", "qti"."__text_hvweswafjf", "qti"."__text_vtz3bnghkc", "qti"."__text_uc3mvgolsg", "qti"."__text_tso7kvy6dv", "qti"."__text_ifp42a6zk6", "qti"."__text_7mulu52tr6", "qti"."__text_gubl3xpcnx", "qti"."__text_2hoxdcszyn", "qti"."__text_ieskz75v7g", "qti"."__text_popyschjwc", "qti"."__text_betq2bg2bg", "qti"."__text_qyq7zjychy", "qti"."__text_ibaizj6fv3", "qti"."__text_u3q4acbjwm", "qti"."__text_httzcaefcn", "qti"."__text_mvg26oprvk", "qti"."__text_f3hdif3553", "qti"."__text_ojm4wya66v", "qti"."__text_pftpnuhm3d", "qti"."__text_wuvwyowttn", "qti"."__text_i67gmkzdk7", "qti"."__text_gjl5q4ofup", "qti"."__text_mmzgy7vcfw", "qti"."__text_gemmttam7z", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_uia6zcss44", "qti"."__text_r5xluaej3z", "qti"."__text_ottycep7en", "qti"."__text_vwnl4b5fqr" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

DROP INDEX "qti"."__qti_metadata_ix_metadata_pxk5ddkomg";

DROP INDEX "qti"."__lom_identifier_catalog_ix_lom_position_wgnkpa3owk";

ALTER TABLE "qti"."qti_metadata" DROP COLUMN "__tag_kind_cp_metadata_resource_scp7neoqwd";

-- grizzle: data loss: the statement below drops the field "qti"."qti_metadata"."metadata" with its values; the candidate rename of "qti"."qti_metadata"."metadata" to "host", or the candidate rename of "qti"."qti_metadata"."metadata" to "package" carries them instead.
-- To drop it with its values, uncomment the statement below; to keep them, choose a candidate rename that carries them and leave the statement commented. grizzle never decides a loss for you.
ALTER TABLE "qti"."qti_metadata" DROP COLUMN "metadata";

COMMENT ON DOMAIN "qti"."__text_4adkkv4wal" IS 'text pattern 17d13e84935acd5517a0ee39b738838fd5a3baeefc6548245ceff8382bee8ecd';

COMMENT ON DOMAIN "qti"."__text_xarz6cej2e" IS 'text pattern 56d2afc74476eeb75322323a34b164a1b1e2ed2a3147d8bef4db1ddb2115ffc9';

COMMENT ON DOMAIN "qti"."__text_4f3dzz6i4f" IS 'text pattern 6c2d1be35dd0906e4f02fc31c0c3e290335fb7a662002f8266fd530ba9f5b5cf';

COMMENT ON DOMAIN "qti"."__text_sa4c4ywp5v" IS 'text pattern 90ce6171956d556f50871e036b47c2e07e54d8596408457b9790a7129be7dabb';

COMMENT ON DOMAIN "qti"."__text_lsy6pxooea" IS 'text pattern 93e4e5ef0da0e7d97452f38155c3e0edff2cdd74fcb75276970f5e934da9508f';

COMMENT ON DOMAIN "qti"."__text_d46tbgbbco" IS 'text pattern bfed332c6cc1252a21a4fcdaff955a3990e205d763a03e20040a9e63dc1ee24c';

COMMENT ON DOMAIN "qti"."__text_3zzmpysrx3" IS 'text pattern c14feedd3aeccaab6526afd03d4f9813d8e890119d5814e931a0c55d63593310';

COMMENT ON DOMAIN "qti"."__text_gjl5q4ofup" IS 'text pattern c4ea03e2b4a5bf750fd3cdad78df6b1da5798ad0f03ec1b76bf38480b2d1b116';

COMMENT ON DOMAIN "qti"."__text_ukaaxf45sk" IS 'text pattern d3264bc6c0e69a9f9671c10acd5a47dd40d7b6e45106fed0de1e45e5f5c37331';

COMMENT ON DOMAIN "qti"."__text_2rz6hgcvt2" IS 'text pattern ee812d879d96b9563c7632fd883386f52d77277cc65c60d548043670e669d466';

COMMENT ON FUNCTION "qti"."__law_lom_owner_alternatives_qipk6s5rsl"() IS 'function of law alternatives of Lom.owner';

COMMENT ON FUNCTION "qti"."__law_manifest_id_holder_alternatives_tiszhipwr2"() IS 'function of law alternatives of ManifestId.holder';

COMMENT ON FUNCTION "qti"."__law_node_kind_alternatives_vfnu4bvxbc"() IS 'function of law alternatives of Node.kind';

COMMENT ON FUNCTION "qti"."__law_qti_metadata_host_alternatives_5lkzkhiyot"() IS 'function of law alternatives of QtiMetadata.host';

COMMENT ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_uc3ag4rrj5"() IS 'function of law alternatives of UsageTypedValue.baseType';

COMMENT ON FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_hqqhqefitz"() IS 'function of law capacity of CsmLabelledGuid(id) over CsmGuid(labelledGuid) within 1..1';

COMMENT ON FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_rgy45odzq3"() IS 'function of law capacity of CsmMetadata(id) over CsmSetOfGuids(metadata) within 1..*';

COMMENT ON FUNCTION "qti"."__law_csm_set_capacity_csm_metadata_cbtwoqvm6k"() IS 'function of law capacity of CsmSet(id) over CsmMetadata(set) within 1..*';

COMMENT ON FUNCTION "qti"."__law_csm_set_of_guids_capacity_csm_labelled_guid_xefxiggzw4"() IS 'function of law capacity of CsmSetOfGuids(id) over CsmLabelledGuid(setOfGuids) within 1..*';

COMMENT ON FUNCTION "qti"."__law_document_root_external_lom_capacity_document_smvb7s6n3s"() IS 'function of law capacity of Document(id) where root = externalLom over DocumentIdentifier(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_document_root_external_lom_capacity_document_nu4fgnvqk2"() IS 'function of law capacity of Document(id) where root = externalLom over DocumentTitle(document) within 0..0';

COMMENT ON FUNCTION "qti"."__law_node_kind_cp_metadata_manifest_capacity_csm_2gudtvojmu"() IS 'function of law capacity of Node(id) where kind = cp:metadata.manifest over CsmSet(host) within 0..1';

COMMENT ON FUNCTION "qti"."__law_node_kind_cp_metadata_resource_capacity_csm_zbucedeagc"() IS 'function of law capacity of Node(id) where kind = cp:metadata.resource over CsmSet(host) within 0..1';

COMMENT ON FUNCTION "qti"."__law_statistic_capacity_target_object_74bvumeusq"() IS 'function of law capacity of Statistic(id) over TargetObject(statistic) within 1..*';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_oxlzku67eo"() IS 'function of law capacity of Statistic(id) where kind = categorized over UsageMapping(statistic) within 1..1';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_ordinary_capacity_usage_value_3onwnnq2vt"() IS 'function of law capacity of Statistic(id) where kind = ordinary over UsageValue(statistic) within 1..1';

COMMENT ON FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_cfz25f6okz"() IS 'function of law capacity of UsageMapping(id) over UsageMapEntry(mapping) within 1..*';

COMMENT ON FUNCTION "qti"."__law_variant_capacity_variant_metadata_lmpypa4kyp"() IS 'function of law capacity of Variant(id) over VariantMetadata(variant) within 1..1';

COMMENT ON FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_sz5fyljxxa"() IS 'function of law capacity of VariantMetadata(id) over AccessForAllResource(metadata) within 1..1';

COMMENT ON FUNCTION "qti"."__law_document_root_external_lom_in_external_lom_gvblvfioav"() IS 'function of law Document(id) where root = externalLom in ExternalLom(document), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_document_root_outcomes_in_outcome_document_v56u3gvs7f"() IS 'function of law Document(id) where root = outcomes in OutcomeDocument(document), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_cgqxhyrzys"() IS 'function of law Document(id) where root = usagedata in UsageData(document), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_sfypheif7e"() IS 'function of law Statistic(id) where kind = categorized in CategorizedStatisticArm(id), a mirrors half';

COMMENT ON FUNCTION "qti"."__law_statistic_kind_ordinary_in_ordinary_statistic_yh5mxxnwqs"() IS 'function of law Statistic(id) where kind = ordinary in OrdinaryStatisticArm(id), a mirrors half';

COMMENT ON CONSTRAINT "__access_for_all_resource_pk_kr5wpjf4ev" ON "qti"."access_for_all_resource" IS 'primary key of AccessForAllResource';

COMMENT ON CONSTRAINT "__access_for_all_resource_key_metadata_eocm4jdfj5" ON "qti"."access_for_all_resource" IS 'key AccessForAllResource(metadata)';

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

COMMENT ON CONSTRAINT "__document_key_id_package_resource_flponjq52v" ON "qti"."document" IS 'key Document(id, package, resource)';

COMMENT ON CONSTRAINT "__document_key_id_root_paefqkk7oi" ON "qti"."document" IS 'key Document(id, root)';

COMMENT ON CONSTRAINT "__document_identifier_key_document_value_gsikqhluke" ON "qti"."document_identifier" IS 'key DocumentIdentifier(document, value)';

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

COMMENT ON CONSTRAINT "__edge_key_child_parent_kind_jv6mposiie" ON "qti"."edge" IS 'key Edge(child, parentKind)';

COMMENT ON CONSTRAINT "__external_lom_pk_hhxtaxx7kt" ON "qti"."external_lom" IS 'primary key of ExternalLom';

COMMENT ON CONSTRAINT "__external_lom_key_package_resource_hxwjkfkaj7" ON "qti"."external_lom" IS 'key ExternalLom(package, resource)';

COMMENT ON CONSTRAINT "__external_lom_key_lom_package_resource_tjboenutnb" ON "qti"."external_lom" IS 'key ExternalLom(lom, package, resource)';

COMMENT ON CONSTRAINT "__file_key_id_package_vf5ojq22ku" ON "qti"."file" IS 'key File(id, package)';

COMMENT ON CONSTRAINT "__file_lom_pk_gj2z5oqrlb" ON "qti"."file_lom" IS 'primary key of FileLom';

COMMENT ON CONSTRAINT "__file_metadata_pk_3xst2gux4o" ON "qti"."file_metadata" IS 'primary key of FileMetadata';

COMMENT ON CONSTRAINT "__file_metadata_key_file_tm4sdkskv6" ON "qti"."file_metadata" IS 'key FileMetadata(file)';

COMMENT ON CONSTRAINT "__file_metadata_key_id_file_pbbxismiu4" ON "qti"."file_metadata" IS 'key FileMetadata(id, file)';

COMMENT ON CONSTRAINT "__lom_annotation_pk_pahdalsdmw" ON "qti"."lom_annotation" IS 'primary key of LomAnnotation';

COMMENT ON CONSTRAINT "__lom_classification_pk_sv4svz23wo" ON "qti"."lom_classification" IS 'primary key of LomClassification';

COMMENT ON CONSTRAINT "__lom_context_pk_d3q5q7l6tv" ON "qti"."lom_context" IS 'primary key of LomContext';

COMMENT ON CONSTRAINT "__lom_difficulty_pk_izmwy4nlak" ON "qti"."lom_difficulty" IS 'primary key of LomDifficulty';

COMMENT ON CONSTRAINT "__lom_educational_pk_obnzvqdy6m" ON "qti"."lom_educational" IS 'primary key of LomEducational';

COMMENT ON CONSTRAINT "__lom_entry_lang_string_pk_ieu73vzaj3" ON "qti"."lom_entry_lang_string" IS 'primary key of LomEntryLangString';

COMMENT ON CONSTRAINT "__lom_id_pk_m3vjr77vsc" ON "qti"."lom_id" IS 'primary key of LomId';

COMMENT ON CONSTRAINT "__lom_identifier_key_id_lom_position_o2ij2ew774" ON "qti"."lom_identifier" IS 'key LomIdentifier(id, lom, position)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_key_identifier_apspsz6soo" ON "qti"."lom_identifier_entry" IS 'key LomIdentifierEntry(identifier)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx" ON "qti"."lom_identifier_entry" IS 'key LomIdentifierEntry(identifier, lom, position, collapsed)';

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

COMMENT ON CONSTRAINT "__manifest_id_pk_qzrdp24pyf" ON "qti"."manifest_id" IS 'primary key of ManifestId';

COMMENT ON CONSTRAINT "__manifest_id_key_package_id_holder_3bmpkpiao7" ON "qti"."manifest_id" IS 'key ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__manifest_id_of_manifest_pk_hll6ulewxl" ON "qti"."manifest_id_of_manifest" IS 'primary key of ManifestIdOfManifest';

COMMENT ON CONSTRAINT "__manifest_id_of_resource_pk_neqjtae66j" ON "qti"."manifest_id_of_resource" IS 'primary key of ManifestIdOfResource';

COMMENT ON CONSTRAINT "__manifest_id_of_variant_pk_mgmrbimez5" ON "qti"."manifest_id_of_variant" IS 'primary key of ManifestIdOfVariant';

COMMENT ON CONSTRAINT "__ordinary_statistic_arm_pk_2atydtxqda" ON "qti"."ordinary_statistic_arm" IS 'primary key of OrdinaryStatisticArm';

COMMENT ON CONSTRAINT "__outcome_document_pk_rmlhdozvqn" ON "qti"."outcome_document" IS 'primary key of OutcomeDocument';

COMMENT ON CONSTRAINT "__package_key_id_identifier_udumz3ewib" ON "qti"."package" IS 'key Package(id, identifier)';

COMMENT ON CONSTRAINT "__qti_metadata_key_package_resource_dwel7fxdsx" ON "qti"."qti_metadata" IS 'key QtiMetadata(package, resource)';

COMMENT ON CONSTRAINT "__qti_metadata_key_id_host_fyvjheokoi" ON "qti"."qti_metadata" IS 'key QtiMetadata(id, host)';

COMMENT ON CONSTRAINT "__qti_metadata_key_id_package_resource_p622xz2moc" ON "qti"."qti_metadata" IS 'key QtiMetadata(id, package, resource)';

COMMENT ON CONSTRAINT "__qti_metadata_in_external_lom_pk_wr7moirehy" ON "qti"."qti_metadata_in_external_lom" IS 'primary key of QtiMetadataInExternalLom';

COMMENT ON CONSTRAINT "__qti_metadata_in_metadata_pk_6n7gq32ruf" ON "qti"."qti_metadata_in_metadata" IS 'primary key of QtiMetadataInMetadata';

COMMENT ON CONSTRAINT "__qti_metadata_in_resource_lom_pk_bc5j6sb4j4" ON "qti"."qti_metadata_in_resource_lom" IS 'primary key of QtiMetadataInResourceLom';

COMMENT ON CONSTRAINT "__resource_key_id_package_identifier_jx53gsgn4j" ON "qti"."resource" IS 'key Resource(id, package, identifier)';

COMMENT ON CONSTRAINT "__resource_lom_key_lom_package_resource_fcuxpt7bmm" ON "qti"."resource_lom" IS 'key ResourceLom(lom, package, resource)';

COMMENT ON CONSTRAINT "__resource_metadata_key_id_resource_o7kyjomlg6" ON "qti"."resource_metadata" IS 'key ResourceMetadata(id, resource)';

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

COMMENT ON CONSTRAINT "__tree_root_key_tree_node_p4ufjrhbsm" ON "qti"."tree_root" IS 'key TreeRoot(tree, node)';

COMMENT ON CONSTRAINT "__tree_root_key_node_tree_7hmixcsgnx" ON "qti"."tree_root" IS 'key TreeRoot(node, tree)';

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

COMMENT ON CONSTRAINT "__variant_pk_2v76wn4lby" ON "qti"."variant" IS 'primary key of Variant';

COMMENT ON CONSTRAINT "__variant_key_package_identifier_ydffbrgs2g" ON "qti"."variant" IS 'key Variant(package, identifier)';

COMMENT ON CONSTRAINT "__variant_metadata_pk_vsyvrlpnm2" ON "qti"."variant_metadata" IS 'primary key of VariantMetadata';

COMMENT ON CONSTRAINT "__variant_metadata_key_variant_7uhcph353w" ON "qti"."variant_metadata" IS 'key VariantMetadata(variant)';

COMMENT ON COLUMN "qti"."access_for_all_resource"."__tag_kind_drd_access_for_all_resource_dcvrnrucvz" IS 'tag Node.kind = drd:accessForAllResource';

COMMENT ON COLUMN "qti"."categorized_statistic_arm"."__tag_kind_ud_categorized_statistic_6idrz3enis" IS 'tag Node.kind = ud:categorizedStatistic';

COMMENT ON COLUMN "qti"."categorized_statistic_arm"."__tag_kind_categorized_mbhnwjzukq" IS 'tag Statistic.kind = categorized';

COMMENT ON COLUMN "qti"."csm_case_item_uri"."__tag_kind_csmd_case_item_uri_lxp27cu62q" IS 'tag Node.kind = csmd:caseItemURI';

COMMENT ON COLUMN "qti"."csm_guid"."__tag_kind_csmd_guid_zslp2vpfy4" IS 'tag Node.kind = csmd:GUID';

COMMENT ON COLUMN "qti"."csm_label"."__tag_kind_csmd_label_fz6gvoerne" IS 'tag Node.kind = csmd:label';

COMMENT ON COLUMN "qti"."csm_labelled_guid"."__tag_kind_csmd_labelled_guid_xvmt4w5scu" IS 'tag Node.kind = csmd:labelledGUID';

COMMENT ON COLUMN "qti"."csm_metadata"."__tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu" IS 'tag Node.kind = csmd:curriculumStandardsMetadata';

COMMENT ON COLUMN "qti"."csm_set"."__tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl" IS 'tag Node.kind = csmd:curriculumStandardsMetadataSet';

COMMENT ON COLUMN "qti"."csm_set_of_guids"."__tag_kind_csmd_set_of_gui_ds_wsrxqslv22" IS 'tag Node.kind = csmd:setOfGUIDs';

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

COMMENT ON COLUMN "qti"."external_lom"."__tag_root_external_lom_dv2arbt3fq" IS 'tag Document.root = externalLom';

COMMENT ON COLUMN "qti"."external_lom"."__tag_owner_external_yt3hiwiixf" IS 'tag Lom.owner = external';

COMMENT ON COLUMN "qti"."file_lom"."__tag_owner_file_gyehcaynyu" IS 'tag Lom.owner = file';

COMMENT ON COLUMN "qti"."file_metadata"."__tag_kind_cp_metadata_file_ec5cdzv4wr" IS 'tag Node.kind = cp:metadata.file';

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

COMMENT ON COLUMN "qti"."manifest_id_of_manifest"."__tag_holder_manifest_7wghkxashe" IS 'tag ManifestId.holder = manifest';

COMMENT ON COLUMN "qti"."manifest_id_of_resource"."__tag_holder_resource_3lbxhuqadk" IS 'tag ManifestId.holder = resource';

COMMENT ON COLUMN "qti"."manifest_id_of_variant"."__tag_holder_variant_yyymqmlpge" IS 'tag ManifestId.holder = variant';

COMMENT ON COLUMN "qti"."ordinary_statistic_arm"."__tag_kind_ud_ordinary_statistic_eakzbvyu36" IS 'tag Node.kind = ud:ordinaryStatistic';

COMMENT ON COLUMN "qti"."ordinary_statistic_arm"."__tag_kind_ordinary_nxdawqnzxk" IS 'tag Statistic.kind = ordinary';

COMMENT ON COLUMN "qti"."outcome_document"."__tag_root_outcomes_5xb23aywsn" IS 'tag Document.root = outcomes';

COMMENT ON COLUMN "qti"."qti_metadata_in_external_lom"."__tag_host_external_lom_zuf64srpbg" IS 'tag QtiMetadata.host = externalLom';

COMMENT ON COLUMN "qti"."qti_metadata_in_metadata"."__tag_host_metadata_knpb2q2kry" IS 'tag QtiMetadata.host = metadata';

COMMENT ON COLUMN "qti"."qti_metadata_in_resource_lom"."__tag_host_resource_lom_vu3w7ocz2u" IS 'tag QtiMetadata.host = resourceLom';

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

COMMENT ON COLUMN "qti"."variant"."__tag_kind_cpx_variant_zd5caenuzr" IS 'tag Node.kind = cpx:variant';

COMMENT ON COLUMN "qti"."variant_metadata"."__tag_kind_cpx_metadata_etdkl37kij" IS 'tag Node.kind = cpx:metadata';

COMMENT ON CONSTRAINT "__access_for_all_resource_fk_id_tag_kind_drd_access_tfbg7eqeci" ON "qti"."access_for_all_resource" IS 'foreign key AccessForAllResource(id, __tag_kind_drd_access_for_all_resource_dcvrnrucvz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__access_for_all_resource_fk_id_metadata_xfrhrrhkhp" ON "qti"."access_for_all_resource" IS 'foreign key AccessForAllResource(id, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__access_for_all_resource_fk_metadata_zxw7a2wvbn" ON "qti"."access_for_all_resource" IS 'foreign key AccessForAllResource(metadata) to VariantMetadata(id)';

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

COMMENT ON CONSTRAINT "__external_lom_fk_document_tag_root_external_lom_dv_4373pl62ni" ON "qti"."external_lom" IS 'foreign key ExternalLom(document, __tag_root_external_lom_dv2arbt3fq) to Document(id, root)';

COMMENT ON CONSTRAINT "__external_lom_fk_document_package_resource_34e33j4gxl" ON "qti"."external_lom" IS 'foreign key ExternalLom(document, package, resource) to Document(id, package, resource)';

COMMENT ON CONSTRAINT "__external_lom_fk_lom_tag_owner_external_yt_3_po4evf3fs2" ON "qti"."external_lom" IS 'foreign key ExternalLom(lom, __tag_owner_external_yt3hiwiixf) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__external_lom_fk_lom_document_lxir53wny7" ON "qti"."external_lom" IS 'foreign key ExternalLom(lom, document) to TreeRoot(node, tree)';

COMMENT ON CONSTRAINT "__external_lom_fk_lom_package_5kjzf5zk6j" ON "qti"."external_lom" IS 'foreign key ExternalLom(lom, package) to Lom(id, package)';

COMMENT ON CONSTRAINT "__file_lom_fk_file_package_n7bbywq43y" ON "qti"."file_lom" IS 'foreign key FileLom(file, package) to File(id, package)';

COMMENT ON CONSTRAINT "__file_lom_fk_lom_tag_owner_file_gyehcaynyu_wwsmm2yqrr" ON "qti"."file_lom" IS 'foreign key FileLom(lom, __tag_owner_file_gyehcaynyu) to Lom(id, owner)';

COMMENT ON CONSTRAINT "__file_lom_fk_lom_metadata_4fdumrj4ds" ON "qti"."file_lom" IS 'foreign key FileLom(lom, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__file_lom_fk_lom_package_3awnniv4xf" ON "qti"."file_lom" IS 'foreign key FileLom(lom, package) to Lom(id, package)';

COMMENT ON CONSTRAINT "__file_lom_fk_lom_package_jdvawz4chd" ON "qti"."file_lom" IS 'foreign key FileLom(lom, package) to Node(id, tree)';

COMMENT ON CONSTRAINT "__file_lom_fk_metadata_file_6pywi74w2y" ON "qti"."file_lom" IS 'foreign key FileLom(metadata, file) to FileMetadata(id, file)';

COMMENT ON CONSTRAINT "__file_metadata_fk_file_5wy6mgwjgi" ON "qti"."file_metadata" IS 'foreign key FileMetadata(file) to File(id)';

COMMENT ON CONSTRAINT "__file_metadata_fk_id_tag_kind_cp_metadata_file_ec_5_jjpl4lfsb7" ON "qti"."file_metadata" IS 'foreign key FileMetadata(id, __tag_kind_cp_metadata_file_ec5cdzv4wr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__file_metadata_fk_id_file_6z66x37ioo" ON "qti"."file_metadata" IS 'foreign key FileMetadata(id, file) to Edge(child, parent)';

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

COMMENT ON CONSTRAINT "__lom_identifier_fk_id_parent_position_rhykptsoqt" ON "qti"."lom_identifier" IS 'foreign key LomIdentifier(id, parent, position) to Edge(child, parent, position)';

COMMENT ON CONSTRAINT "__lom_identifier_catalog_fk_identifier_lom_position_e55vucjji4" ON "qti"."lom_identifier_catalog" IS 'foreign key LomIdentifierCatalog(identifier, lom, position) to LomIdentifier(id, lom, position)';

COMMENT ON CONSTRAINT "__lom_identifier_entry_fk_identifier_lom_position_lfmicwzfum" ON "qti"."lom_identifier_entry" IS 'foreign key LomIdentifierEntry(identifier, lom, position) to LomIdentifier(id, lom, position)';

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

COMMENT ON CONSTRAINT "__lom_object_identifier_fk_identifier_lom_position_hgxmp4e6eg" ON "qti"."lom_object_identifier" IS 'foreign key LomObjectIdentifier(identifier, lom, position, collapsed) to LomIdentifierEntry(identifier, lom, position, collapsed)';

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

COMMENT ON CONSTRAINT "__manifest_id_fk_package_yrywtozstf" ON "qti"."manifest_id" IS 'foreign key ManifestId(package) to Package(id)';

COMMENT ON CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj" ON "qti"."manifest_id_of_manifest" IS 'foreign key ManifestIdOfManifest(package, id) to Package(id, identifier)';

COMMENT ON CONSTRAINT "__manifest_id_of_manifest_fk_package_id_tag_holder_hcdzuklnac" ON "qti"."manifest_id_of_manifest" IS 'foreign key ManifestIdOfManifest(package, id, __tag_holder_manifest_7wghkxashe) to ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__manifest_id_of_resource_fk_package_id_moulqn3fj4" ON "qti"."manifest_id_of_resource" IS 'foreign key ManifestIdOfResource(package, id) to Resource(package, identifier)';

COMMENT ON CONSTRAINT "__manifest_id_of_resource_fk_package_id_tag_holder_zdlxck3tn7" ON "qti"."manifest_id_of_resource" IS 'foreign key ManifestIdOfResource(package, id, __tag_holder_resource_3lbxhuqadk) to ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__manifest_id_of_variant_fk_package_id_huvjqiu33v" ON "qti"."manifest_id_of_variant" IS 'foreign key ManifestIdOfVariant(package, id) to Variant(package, identifier)';

COMMENT ON CONSTRAINT "__manifest_id_of_variant_fk_package_id_tag_holder_jf7shcoyrs" ON "qti"."manifest_id_of_variant" IS 'foreign key ManifestIdOfVariant(package, id, __tag_holder_variant_yyymqmlpge) to ManifestId(package, id, holder)';

COMMENT ON CONSTRAINT "__manifest_lom_fk_lom_package_a6edccbozn" ON "qti"."manifest_lom" IS 'foreign key ManifestLom(lom, package) to Node(id, tree)';

COMMENT ON CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ordinary_dilt5z26qb" ON "qti"."ordinary_statistic_arm" IS 'foreign key OrdinaryStatisticArm(id, __tag_kind_ordinary_nxdawqnzxk) to Statistic(id, kind)';

COMMENT ON CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ud_ordinary_zseoy5wvrj" ON "qti"."ordinary_statistic_arm" IS 'foreign key OrdinaryStatisticArm(id, __tag_kind_ud_ordinary_statistic_eakzbvyu36) to Node(id, kind)';

COMMENT ON CONSTRAINT "__outcome_document_fk_declaration_lvjuav56en" ON "qti"."outcome_document" IS 'foreign key OutcomeDocument(declaration) to OutcomeDeclarationArm(id)';

COMMENT ON CONSTRAINT "__outcome_document_fk_declaration_document_d6q5lquv7z" ON "qti"."outcome_document" IS 'foreign key OutcomeDocument(declaration, document, identifier) to Declaration(id, document, identifier)';

COMMENT ON CONSTRAINT "__outcome_document_fk_document_tag_root_outcomes_5_63a3qgu7b2" ON "qti"."outcome_document" IS 'foreign key OutcomeDocument(document, __tag_root_outcomes_5xb23aywsn) to Document(id, root)';

COMMENT ON CONSTRAINT "__outcome_document_fk_document_declaration_qtmk3xxqen" ON "qti"."outcome_document" IS 'foreign key OutcomeDocument(document, declaration) to TreeRoot(tree, node)';

COMMENT ON CONSTRAINT "__outcome_document_fk_document_identifier_v5jocpx7r5" ON "qti"."outcome_document" IS 'foreign key OutcomeDocument(document, identifier) to DocumentIdentifier(document, value)';

COMMENT ON CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc" ON "qti"."package" IS 'foreign key Package(id, identifier) to ManifestIdOfManifest(package, id)';

COMMENT ON CONSTRAINT "__qti_metadata_in_external_lom_fk_id_tag_host_5nxw2e6ygd" ON "qti"."qti_metadata_in_external_lom" IS 'foreign key QtiMetadataInExternalLom(id, __tag_host_external_lom_zuf64srpbg) to QtiMetadata(id, host)';

COMMENT ON CONSTRAINT "__qti_metadata_in_external_lom_fk_id_lom_r3vzadspmn" ON "qti"."qti_metadata_in_external_lom" IS 'foreign key QtiMetadataInExternalLom(id, lom) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qti_metadata_in_external_lom_fk_id_package_45ujtyda4c" ON "qti"."qti_metadata_in_external_lom" IS 'foreign key QtiMetadataInExternalLom(id, package, resource) to QtiMetadata(id, package, resource)';

COMMENT ON CONSTRAINT "__qti_metadata_in_external_lom_fk_lom_package_iml635ey3w" ON "qti"."qti_metadata_in_external_lom" IS 'foreign key QtiMetadataInExternalLom(lom, package, resource) to ExternalLom(lom, package, resource)';

COMMENT ON CONSTRAINT "__qti_metadata_in_metadata_fk_id_tag_host_metadata_st4rwzhkuc" ON "qti"."qti_metadata_in_metadata" IS 'foreign key QtiMetadataInMetadata(id, __tag_host_metadata_knpb2q2kry) to QtiMetadata(id, host)';

COMMENT ON CONSTRAINT "__qti_metadata_in_metadata_fk_id_metadata_amwofuqajo" ON "qti"."qti_metadata_in_metadata" IS 'foreign key QtiMetadataInMetadata(id, metadata) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qti_metadata_in_metadata_fk_id_package_resource_wjxdq6kefq" ON "qti"."qti_metadata_in_metadata" IS 'foreign key QtiMetadataInMetadata(id, package, resource) to QtiMetadata(id, package, resource)';

COMMENT ON CONSTRAINT "__qti_metadata_in_metadata_fk_metadata_resource_node_j5b44sxf4o" ON "qti"."qti_metadata_in_metadata" IS 'foreign key QtiMetadataInMetadata(metadata, resourceNode) to ResourceMetadata(id, resource)';

COMMENT ON CONSTRAINT "__qti_metadata_in_metadata_fk_resource_node_package_bwtvi3p7ra" ON "qti"."qti_metadata_in_metadata" IS 'foreign key QtiMetadataInMetadata(resourceNode, package, resource) to Resource(id, package, identifier)';

COMMENT ON CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_tag_host_pymrpdifeo" ON "qti"."qti_metadata_in_resource_lom" IS 'foreign key QtiMetadataInResourceLom(id, __tag_host_resource_lom_vu3w7ocz2u) to QtiMetadata(id, host)';

COMMENT ON CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_lom_66wahx7d6l" ON "qti"."qti_metadata_in_resource_lom" IS 'foreign key QtiMetadataInResourceLom(id, lom) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_package_gmcsikj4sm" ON "qti"."qti_metadata_in_resource_lom" IS 'foreign key QtiMetadataInResourceLom(id, package, resource) to QtiMetadata(id, package, resource)';

COMMENT ON CONSTRAINT "__qti_metadata_in_resource_lom_fk_lom_package_56adstemff" ON "qti"."qti_metadata_in_resource_lom" IS 'foreign key QtiMetadataInResourceLom(lom, package, resource) to ResourceLom(lom, package, resource)';

COMMENT ON CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv" ON "qti"."resource" IS 'foreign key Resource(package, identifier) to ManifestIdOfResource(package, id)';

COMMENT ON CONSTRAINT "__resource_lom_fk_lom_package_z2mqb4ohk3" ON "qti"."resource_lom" IS 'foreign key ResourceLom(lom, package) to Node(id, tree)';

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

COMMENT ON CONSTRAINT "__variant_fk_id_tag_kind_cpx_variant_zd_5_caenuzr_jtims4ygfy" ON "qti"."variant" IS 'foreign key Variant(id, __tag_kind_cpx_variant_zd5caenuzr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variant_fk_id_resource_tfxcbdkpma" ON "qti"."variant" IS 'foreign key Variant(id, resource) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__variant_fk_package_identifier_ffjrlehepf" ON "qti"."variant" IS 'foreign key Variant(package, identifier) to ManifestIdOfVariant(package, id)';

COMMENT ON CONSTRAINT "__variant_fk_package_identifierref_zujo3dkru3" ON "qti"."variant" IS 'foreign key Variant(package, identifierref) to Resource(package, identifier)';

COMMENT ON CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu" ON "qti"."variant" IS 'foreign key Variant(resource, package, resourceIdentifier) to Resource(id, package, identifier)';

COMMENT ON CONSTRAINT "__variant_metadata_fk_id_tag_kind_cpx_metadata_etdkl_qkdqmccwxj" ON "qti"."variant_metadata" IS 'foreign key VariantMetadata(id, __tag_kind_cpx_metadata_etdkl37kij) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variant_metadata_fk_id_variant_cm4y6w45jw" ON "qti"."variant_metadata" IS 'foreign key VariantMetadata(id, variant) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__variant_metadata_fk_variant_ddw6cifzji" ON "qti"."variant_metadata" IS 'foreign key VariantMetadata(variant) to Variant(id)';

COMMENT ON INDEX "qti"."__access_for_all_resource_key_metadata_ltyeuwg5av" IS 'unique index AccessForAllResource(metadata)';

COMMENT ON INDEX "qti"."__csm_guid_key_labelled_guid_jq2qkjitxd" IS 'unique index CsmGuid(labelledGuid)';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_aggregation_level_pweycamvch" IS 'unique index Edge(parent) where childKind = lom:aggregationLevel, parentKind = lom:general';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_catalog_parent_kind_ihaqxzmtrd" IS 'unique index Edge(parent) where childKind = lom:catalog, parentKind = lom:identifier';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_copyright_and_other_p233qj7pri" IS 'unique index Edge(parent) where childKind = lom:copyrightAndOtherRestrictions, parentKind = lom:rights';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_cost_parent_kind_af6v6li57c" IS 'unique index Edge(parent) where childKind = lom:cost, parentKind = lom:rights';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_date_parent_kind_r74x2wu3c2" IS 'unique index Edge(parent) where childKind = lom:date, parentKind = lom:annotation';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_date_parent_kind_nk2btnwjoi" IS 'unique index Edge(parent) where childKind = lom:date, parentKind = lom:contribute';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_date_time_parent_5cwanrcm62" IS 'unique index Edge(parent) where childKind = lom:dateTime, parentKind = lom:date';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_description_parent_p5d45av6gv" IS 'unique index Edge(parent) where childKind = lom:description, parentKind = lom:annotation';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_description_parent_tonc6pa4gh" IS 'unique index Edge(parent) where childKind = lom:description, parentKind = lom:classification';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_description_parent_qlchudgs7g" IS 'unique index Edge(parent) where childKind = lom:description, parentKind = lom:date';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_description_parent_onjtnyxfgj" IS 'unique index Edge(parent) where childKind = lom:description, parentKind = lom:duration';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_description_parent_mjvnn2zhhe" IS 'unique index Edge(parent) where childKind = lom:description, parentKind = lom:educational';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_description_parent_abwqbc32an" IS 'unique index Edge(parent) where childKind = lom:description, parentKind = lom:rights';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_description_parent_vctc3yh7ww" IS 'unique index Edge(parent) where childKind = lom:description, parentKind = lom:typicalLearningTime';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_difficulty_parent_ypebn2m2r2" IS 'unique index Edge(parent) where childKind = lom:difficulty, parentKind = lom:educational';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_duration_string_bdhvfggytr" IS 'unique index Edge(parent) where childKind = lom:duration.string, parentKind = lom:duration';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_duration_string_3rmbkk6got" IS 'unique index Edge(parent) where childKind = lom:duration.string, parentKind = lom:technical';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_duration_string_ota3hs72wc" IS 'unique index Edge(parent) where childKind = lom:duration.string, parentKind = lom:typicalLearningTime';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_entity_parent_kind_j4qh3ik7ma" IS 'unique index Edge(parent) where childKind = lom:entity, parentKind = lom:annotation';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_entry_parent_kind_f7rw5vnlx4" IS 'unique index Edge(parent) where childKind = lom:entry, parentKind = lom:identifier';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_entry_lang_string_mngsvnwj6v" IS 'unique index Edge(parent) where childKind = lom:entry.langString, parentKind = lom:taxon';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_id_parent_kind_lom_2o3h7xqgww" IS 'unique index Edge(parent) where childKind = lom:id, parentKind = lom:taxon';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_installation_szanhbe2zd" IS 'unique index Edge(parent) where childKind = lom:installationRemarks, parentKind = lom:technical';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_interactivity_level_3y7t5gxwja" IS 'unique index Edge(parent) where childKind = lom:interactivityLevel, parentKind = lom:educational';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_interactivity_type_75q5hnjgzp" IS 'unique index Edge(parent) where childKind = lom:interactivityType, parentKind = lom:educational';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_kind_parent_kind_7ve4be5ow2" IS 'unique index Edge(parent) where childKind = lom:kind, parentKind = lom:relation';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_language_parent_3mtge7ue5g" IS 'unique index Edge(parent) where childKind = lom:language, parentKind = lom:metaMetadata';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_life_cycle_parent_vukxgkrvox" IS 'unique index Edge(parent) where childKind = lom:lifeCycle, parentKind = lom:lom';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_maximum_version_q7xgrixbfj" IS 'unique index Edge(parent) where childKind = lom:maximumVersion, parentKind = lom:orComposite';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_meta_metadata_yipr7akta6" IS 'unique index Edge(parent) where childKind = lom:metaMetadata, parentKind = lom:lom';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_minimum_version_bxc5vwhtck" IS 'unique index Edge(parent) where childKind = lom:minimumVersion, parentKind = lom:orComposite';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_name_parent_kind_sqqohkrzcy" IS 'unique index Edge(parent) where childKind = lom:name, parentKind = lom:orComposite';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_other_platform_gfzk3nb2ct" IS 'unique index Edge(parent) where childKind = lom:otherPlatformRequirements, parentKind = lom:technical';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_purpose_parent_kind_46txoh3ocq" IS 'unique index Edge(parent) where childKind = lom:purpose, parentKind = lom:classification';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_resource_parent_h3gaifq6dl" IS 'unique index Edge(parent) where childKind = lom:resource, parentKind = lom:relation';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_rights_parent_kind_ipzub5affx" IS 'unique index Edge(parent) where childKind = lom:rights, parentKind = lom:lom';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_role_parent_kind_l273misho2" IS 'unique index Edge(parent) where childKind = lom:role, parentKind = lom:contribute';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_semantic_density_fs7svl3vzw" IS 'unique index Edge(parent) where childKind = lom:semanticDensity, parentKind = lom:educational';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_size_parent_kind_hdawmmdkn2" IS 'unique index Edge(parent) where childKind = lom:size, parentKind = lom:technical';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_yk4lm5usaa" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:aggregationLevel';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_skubndd32t" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:context';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_b3tz7m5lih" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:copyrightAndOtherRestrictions';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_pgrn26lvfo" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:cost';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_63t53wy5yc" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:difficulty';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_6ysi7tdsqh" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:intendedEndUserRole';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_hbwalfxhfq" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:interactivityLevel';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_hubo6jdliy" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:interactivityType';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_elpfq5xmej" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:kind';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_vv6pznchmv" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:learningResourceType';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_gvswwoy3ue" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:name';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_6p5ozz64il" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:purpose';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_d77hhuipt6" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:role';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_qh5iwtbz5n" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:semanticDensity';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_5peedbfzqz" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:status';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_dbnxo7bt77" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:structure';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_dxdjhiv4sd" IS 'unique index Edge(parent) where childKind = lom:source, parentKind = lom:type';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_source_lang_string_tvvsuzuapb" IS 'unique index Edge(parent) where childKind = lom:source.langString, parentKind = lom:taxonPath';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_status_parent_kind_wiuxo6wrny" IS 'unique index Edge(parent) where childKind = lom:status, parentKind = lom:lifeCycle';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_structure_parent_oipzxxpd6x" IS 'unique index Edge(parent) where childKind = lom:structure, parentKind = lom:general';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_technical_parent_etbtjwceww" IS 'unique index Edge(parent) where childKind = lom:technical, parentKind = lom:lom';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_type_parent_kind_pwtiuys23k" IS 'unique index Edge(parent) where childKind = lom:type, parentKind = lom:orComposite';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_typical_learning_72dhi53t3t" IS 'unique index Edge(parent) where childKind = lom:typicalLearningTime, parentKind = lom:educational';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_l3b3lvg3ty" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:aggregationLevel';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_u3hj3qop5p" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:context';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_7vr3zrkeou" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:copyrightAndOtherRestrictions';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_f7f6hypjzi" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:cost';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_onsdqcjdls" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:difficulty';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_hsr7kfafwc" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:intendedEndUserRole';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_qtw5y7hph6" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:interactivityLevel';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_vpxnkuqqlj" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:interactivityType';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_2kp6zijtjb" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:kind';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_mu34r7b5ny" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:learningResourceType';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_6v4trdflof" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:name';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_gavffjmso6" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:purpose';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_sdefgq3p2w" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:role';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_bd5ocmckqj" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:semanticDensity';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_buahxvyalm" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:status';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_7lakol36rx" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:structure';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_zsx2h5fepw" IS 'unique index Edge(parent) where childKind = lom:value, parentKind = lom:type';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_lom_version_parent_kind_pie6nez72p" IS 'unique index Edge(parent) where childKind = lom:version, parentKind = lom:lifeCycle';

COMMENT ON INDEX "qti"."__variant_metadata_key_variant_ythetc2gkq" IS 'unique index VariantMetadata(variant)';

COMMENT ON INDEX "qti"."__csm_labelled_guid_ix_set_of_guids_lays2gya5y" IS 'btree index CsmLabelledGuid(setOfGuids)';

COMMENT ON INDEX "qti"."__csm_metadata_ix_set_rck25qjlcy" IS 'btree index CsmMetadata(set)';

COMMENT ON INDEX "qti"."__csm_set_ix_host_drqp6qqwbo" IS 'btree index CsmSet(host)';

COMMENT ON INDEX "qti"."__csm_set_of_guids_ix_metadata_fesdddgqyo" IS 'btree index CsmSetOfGuids(metadata)';

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

COMMENT ON INDEX "qti"."__external_lom_ix_document_6suac5xlnl" IS 'btree index ExternalLom(document)';

COMMENT ON INDEX "qti"."__file_lom_ix_file_package_tupff3zwrm" IS 'btree index FileLom(file, package)';

COMMENT ON INDEX "qti"."__file_lom_ix_metadata_file_4oyrln4yqx" IS 'btree index FileLom(metadata, file)';

COMMENT ON INDEX "qti"."__lom_annotation_ix_lom_e2eimfmnfc" IS 'btree index LomAnnotation(lom)';

COMMENT ON INDEX "qti"."__lom_classification_ix_lom_c74wuapevs" IS 'btree index LomClassification(lom)';

COMMENT ON INDEX "qti"."__lom_context_ix_lom_7mcdhp6zav" IS 'btree index LomContext(lom)';

COMMENT ON INDEX "qti"."__lom_difficulty_ix_lom_h6zzds2vp5" IS 'btree index LomDifficulty(lom)';

COMMENT ON INDEX "qti"."__lom_educational_ix_lom_capn5cdki5" IS 'btree index LomEducational(lom)';

COMMENT ON INDEX "qti"."__lom_entry_lang_string_ix_lom_rjgjkdwiep" IS 'btree index LomEntryLangString(lom)';

COMMENT ON INDEX "qti"."__lom_identifier_catalog_ix_identifier_lom_position_qdd3e3w32x" IS 'btree index LomIdentifierCatalog(identifier, lom, position)';

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

COMMENT ON INDEX "qti"."__outcome_document_ix_declaration_54e3jmecvg" IS 'btree index OutcomeDocument(declaration)';

COMMENT ON INDEX "qti"."__qti_metadata_in_external_lom_ix_lom_package_igzmxxzys3" IS 'btree index QtiMetadataInExternalLom(lom, package, resource)';

COMMENT ON INDEX "qti"."__qti_metadata_in_metadata_ix_metadata_resource_node_cppdgmygnk" IS 'btree index QtiMetadataInMetadata(metadata, resourceNode)';

COMMENT ON INDEX "qti"."__qti_metadata_in_metadata_ix_resource_node_package_sqn7arpodr" IS 'btree index QtiMetadataInMetadata(resourceNode, package, resource)';

COMMENT ON INDEX "qti"."__qti_metadata_in_resource_lom_ix_lom_package_vuv2yeucnd" IS 'btree index QtiMetadataInResourceLom(lom, package, resource)';

COMMENT ON INDEX "qti"."__statistic_ix_usage_data_qsqkjb3h57" IS 'btree index Statistic(usageData)';

COMMENT ON INDEX "qti"."__target_object_ix_statistic_kklaigmtdy" IS 'btree index TargetObject(statistic)';

COMMENT ON INDEX "qti"."__usage_map_entry_ix_mapping_omtvpx4lh7" IS 'btree index UsageMapEntry(mapping)';

COMMENT ON INDEX "qti"."__variant_ix_package_identifierref_cgd3uzvweq" IS 'btree index Variant(package, identifierref)';

COMMENT ON INDEX "qti"."__variant_ix_resource_package_resource_identifier_3mcke6ybyd" IS 'btree index Variant(resource, package, resourceIdentifier)';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vleugtkftj" ON "qti"."access_for_all_resource" IS 'trigger of law alternatives of Node.kind on AccessForAllResource';

COMMENT ON TRIGGER "__law_variant_metadata_capacity_access_for_all_odo6ya6gbr" ON "qti"."access_for_all_resource" IS 'trigger of law capacity of VariantMetadata(id) over AccessForAllResource(metadata) within 1..1 on AccessForAllResource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_37mn75zlv6" ON "qti"."and" IS 'trigger of law alternatives of Node.kind on And';

COMMENT ON TRIGGER "__law_node_kind_alternatives_enkrobv7su" ON "qti"."any_n" IS 'trigger of law alternatives of Node.kind on AnyN';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5skm7kkgib" ON "qti"."assessment_item" IS 'trigger of law alternatives of Node.kind on AssessmentItem';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ajxrlesyqa" ON "qti"."categorized_statistic_arm" IS 'trigger of law alternatives of Node.kind on CategorizedStatisticArm';

COMMENT ON TRIGGER "__law_statistic_kind_categorized_in_categorized_2fgm3jzl2i" ON "qti"."categorized_statistic_arm" IS 'trigger of law Statistic(id) where kind = categorized in CategorizedStatisticArm(id), a mirrors half on CategorizedStatisticArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_upkyeydjz7" ON "qti"."choice_interaction" IS 'trigger of law alternatives of Node.kind on ChoiceInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_py43thbsit" ON "qti"."comment" IS 'trigger of law alternatives of Node.kind on Comment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zusrsittei" ON "qti"."container_size" IS 'trigger of law alternatives of Node.kind on ContainerSize';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fcn4ljer3c" ON "qti"."contains" IS 'trigger of law alternatives of Node.kind on Contains';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6yhav47k3n" ON "qti"."correct" IS 'trigger of law alternatives of Node.kind on Correct';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_xfck4aqqou" ON "qti"."custom_operator" IS 'trigger of law alternatives of Node.kind on CustomOperator';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5vhdpgz25" ON "qti"."declared_value" IS 'trigger of law alternatives of Node.kind on DeclaredValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_a2g6hsjz3y" ON "qti"."default" IS 'trigger of law alternatives of Node.kind on Default';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ssrxqpoval" ON "qti"."default_value_arm" IS 'trigger of law alternatives of Node.kind on DefaultValueArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_62wn4o7qqc" ON "qti"."delete" IS 'trigger of law alternatives of Node.kind on Delete';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6td2gbd75c" ON "qti"."dependency" IS 'trigger of law alternatives of Node.kind on Dependency';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ub225oyu52" ON "qti"."divide" IS 'trigger of law alternatives of Node.kind on Divide';

COMMENT ON TRIGGER "__law_document_root_external_lom_capacity_document_6p7ik5hwnf" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = externalLom over DocumentIdentifier(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_external_lom_capacity_document_kaigralq7p" ON "qti"."document" IS 'trigger of law capacity of Document(id) where root = externalLom over DocumentTitle(document) within 0..0 on Document';

COMMENT ON TRIGGER "__law_document_root_external_lom_in_external_lom_756kuwljsv" ON "qti"."document" IS 'trigger of law Document(id) where root = externalLom in ExternalLom(document), a mirrors half on Document';

COMMENT ON TRIGGER "__law_document_root_outcomes_in_outcome_document_m6utdgn3c7" ON "qti"."document" IS 'trigger of law Document(id) where root = outcomes in OutcomeDocument(document), a mirrors half on Document';

COMMENT ON TRIGGER "__law_document_root_usagedata_in_usage_data_kvqjkcrq2t" ON "qti"."document" IS 'trigger of law Document(id) where root = usagedata in UsageData(document), a mirrors half on Document';

COMMENT ON TRIGGER "__law_document_root_external_lom_capacity_document_l7uga33rtu" ON "qti"."document_identifier" IS 'trigger of law capacity of Document(id) where root = externalLom over DocumentIdentifier(document) within 0..0 on DocumentIdentifier';

COMMENT ON TRIGGER "__law_document_root_external_lom_capacity_document_5f2txngazw" ON "qti"."document_title" IS 'trigger of law capacity of Document(id) where root = externalLom over DocumentTitle(document) within 0..0 on DocumentTitle';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_xetkscpi64" ON "qti"."duration_gte" IS 'trigger of law alternatives of Node.kind on DurationGte';

COMMENT ON TRIGGER "__law_node_kind_alternatives_a725iairvb" ON "qti"."duration_lt" IS 'trigger of law alternatives of Node.kind on DurationLt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xuefsrgzju" ON "qti"."entity_reference" IS 'trigger of law alternatives of Node.kind on EntityReference';

COMMENT ON TRIGGER "__law_node_kind_alternatives_42jl7ga7vq" ON "qti"."equal" IS 'trigger of law alternatives of Node.kind on Equal';

COMMENT ON TRIGGER "__law_node_kind_alternatives_d2v2qogal2" ON "qti"."equal_rounded" IS 'trigger of law alternatives of Node.kind on EqualRounded';

COMMENT ON TRIGGER "__law_node_kind_alternatives_jvfc675pvw" ON "qti"."exit_response" IS 'trigger of law alternatives of Node.kind on ExitResponse';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5q6jhxxrz" ON "qti"."exit_template" IS 'trigger of law alternatives of Node.kind on ExitTemplate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2llobzpqtx" ON "qti"."exit_test" IS 'trigger of law alternatives of Node.kind on ExitTest';

COMMENT ON TRIGGER "__law_lom_owner_alternatives_kw4mqbhqz5" ON "qti"."external_lom" IS 'trigger of law alternatives of Lom.owner on ExternalLom';

COMMENT ON TRIGGER "__law_document_root_external_lom_in_external_lom_23wuoxot44" ON "qti"."external_lom" IS 'trigger of law Document(id) where root = externalLom in ExternalLom(document), a mirrors half on ExternalLom';

COMMENT ON TRIGGER "__law_node_kind_alternatives_gn5vugm5uh" ON "qti"."fallback" IS 'trigger of law alternatives of Node.kind on Fallback';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bljunbv6a4" ON "qti"."field_value" IS 'trigger of law alternatives of Node.kind on FieldValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oxdcy2a5y4" ON "qti"."file" IS 'trigger of law alternatives of Node.kind on File';

COMMENT ON TRIGGER "__law_lom_owner_alternatives_63dl7omt3t" ON "qti"."file_lom" IS 'trigger of law alternatives of Lom.owner on FileLom';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tbjeddkuni" ON "qti"."file_metadata" IS 'trigger of law alternatives of Node.kind on FileMetadata';

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

COMMENT ON TRIGGER "__law_lom_owner_alternatives_aikkcw5eu4" ON "qti"."lom" IS 'trigger of law alternatives of Lom.owner on Lom';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_jawlfyawy3" ON "qti"."lookup_outcome_value" IS 'trigger of law alternatives of Node.kind on LookupOutcomeValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dyx73lsfkj" ON "qti"."lt" IS 'trigger of law alternatives of Node.kind on Lt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cm5ghdvymu" ON "qti"."lte" IS 'trigger of law alternatives of Node.kind on Lte';

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_n3trdmevxd" ON "qti"."manifest_id" IS 'trigger of law alternatives of ManifestId.holder on ManifestId';

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_5ovauixwzl" ON "qti"."manifest_id_of_manifest" IS 'trigger of law alternatives of ManifestId.holder on ManifestIdOfManifest';

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_ughu4aiuxc" ON "qti"."manifest_id_of_resource" IS 'trigger of law alternatives of ManifestId.holder on ManifestIdOfResource';

COMMENT ON TRIGGER "__law_manifest_id_holder_alternatives_tdhldo4cny" ON "qti"."manifest_id_of_variant" IS 'trigger of law alternatives of ManifestId.holder on ManifestIdOfVariant';

COMMENT ON TRIGGER "__law_lom_owner_alternatives_as4icxtbgu" ON "qti"."manifest_lom" IS 'trigger of law alternatives of Lom.owner on ManifestLom';

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

COMMENT ON TRIGGER "__law_node_kind_cp_metadata_manifest_capacity_csm_yqljsdph5x" ON "qti"."node" IS 'trigger of law capacity of Node(id) where kind = cp:metadata.manifest over CsmSet(host) within 0..1 on Node';

COMMENT ON TRIGGER "__law_node_kind_cp_metadata_resource_capacity_csm_tvs6n56pcw" ON "qti"."node" IS 'trigger of law capacity of Node(id) where kind = cp:metadata.resource over CsmSet(host) within 0..1 on Node';

COMMENT ON TRIGGER "__law_node_kind_alternatives_yvsiznlbf3" ON "qti"."not" IS 'trigger of law alternatives of Node.kind on Not';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4ged6socq3" ON "qti"."null" IS 'trigger of law alternatives of Node.kind on Null';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bizaob5zum" ON "qti"."number_correct" IS 'trigger of law alternatives of Node.kind on NumberCorrect';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xm2tvblysw" ON "qti"."number_incorrect" IS 'trigger of law alternatives of Node.kind on NumberIncorrect';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fdsa37gu2r" ON "qti"."number_presented" IS 'trigger of law alternatives of Node.kind on NumberPresented';

COMMENT ON TRIGGER "__law_node_kind_alternatives_uqp5526nsp" ON "qti"."number_responded" IS 'trigger of law alternatives of Node.kind on NumberResponded';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vztuzzvdxa" ON "qti"."number_selected" IS 'trigger of law alternatives of Node.kind on NumberSelected';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zpcbcbgfyt" ON "qti"."or" IS 'trigger of law alternatives of Node.kind on Or';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pixiy5rev2" ON "qti"."ordered" IS 'trigger of law alternatives of Node.kind on Ordered';

COMMENT ON TRIGGER "__law_node_kind_alternatives_d2tsggz5gn" ON "qti"."ordinary_statistic_arm" IS 'trigger of law alternatives of Node.kind on OrdinaryStatisticArm';

COMMENT ON TRIGGER "__law_statistic_kind_ordinary_in_ordinary_statistic_vhqjmcizy2" ON "qti"."ordinary_statistic_arm" IS 'trigger of law Statistic(id) where kind = ordinary in OrdinaryStatisticArm(id), a mirrors half on OrdinaryStatisticArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bv75ttdv6d" ON "qti"."organizations" IS 'trigger of law alternatives of Node.kind on Organizations';

COMMENT ON TRIGGER "__law_node_kind_alternatives_gfvnndzdfi" ON "qti"."outcome_condition_arm" IS 'trigger of law alternatives of Node.kind on OutcomeConditionArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qhu3dxqvfw" ON "qti"."outcome_declaration_arm" IS 'trigger of law alternatives of Node.kind on OutcomeDeclarationArm';

COMMENT ON TRIGGER "__law_document_root_outcomes_in_outcome_document_5tmwwcph3h" ON "qti"."outcome_document" IS 'trigger of law Document(id) where root = outcomes in OutcomeDocument(document), a mirrors half on OutcomeDocument';

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

COMMENT ON TRIGGER "__law_qti_metadata_host_alternatives_vrtq4biqag" ON "qti"."qti_metadata" IS 'trigger of law alternatives of QtiMetadata.host on QtiMetadata';

COMMENT ON TRIGGER "__law_qti_metadata_host_alternatives_kdobdfkfsz" ON "qti"."qti_metadata_in_external_lom" IS 'trigger of law alternatives of QtiMetadata.host on QtiMetadataInExternalLom';

COMMENT ON TRIGGER "__law_qti_metadata_host_alternatives_eov34qayi3" ON "qti"."qti_metadata_in_metadata" IS 'trigger of law alternatives of QtiMetadata.host on QtiMetadataInMetadata';

COMMENT ON TRIGGER "__law_qti_metadata_host_alternatives_t7ylgbp3v4" ON "qti"."qti_metadata_in_resource_lom" IS 'trigger of law alternatives of QtiMetadata.host on QtiMetadataInResourceLom';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vhit6soubo" ON "qti"."random" IS 'trigger of law alternatives of Node.kind on Random';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oslb6utu36" ON "qti"."random_float" IS 'trigger of law alternatives of Node.kind on RandomFloat';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wowrdjb74h" ON "qti"."random_integer" IS 'trigger of law alternatives of Node.kind on RandomInteger';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sshvgjxpzu" ON "qti"."repeat" IS 'trigger of law alternatives of Node.kind on Repeat';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j53oleenel" ON "qti"."resource" IS 'trigger of law alternatives of Node.kind on Resource';

COMMENT ON TRIGGER "__law_lom_owner_alternatives_boamltns5u" ON "qti"."resource_lom" IS 'trigger of law alternatives of Lom.owner on ResourceLom';

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

COMMENT ON TRIGGER "__law_statistic_capacity_target_object_ybxtmjx7im" ON "qti"."statistic" IS 'trigger of law capacity of Statistic(id) over TargetObject(statistic) within 1..* on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_categorized_capacity_usage_s7xvqrkii7" ON "qti"."statistic" IS 'trigger of law capacity of Statistic(id) where kind = categorized over UsageMapping(statistic) within 1..1 on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_ordinary_capacity_usage_value_crlbzwchwi" ON "qti"."statistic" IS 'trigger of law capacity of Statistic(id) where kind = ordinary over UsageValue(statistic) within 1..1 on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_categorized_in_categorized_ndyk4nqx7d" ON "qti"."statistic" IS 'trigger of law Statistic(id) where kind = categorized in CategorizedStatisticArm(id), a mirrors half on Statistic';

COMMENT ON TRIGGER "__law_statistic_kind_ordinary_in_ordinary_statistic_5vv5p2ugx4" ON "qti"."statistic" IS 'trigger of law Statistic(id) where kind = ordinary in OrdinaryStatisticArm(id), a mirrors half on Statistic';

COMMENT ON TRIGGER "__law_node_kind_alternatives_smnwa6u5cu" ON "qti"."stats_operator" IS 'trigger of law alternatives of Node.kind on StatsOperator';

COMMENT ON TRIGGER "__law_node_kind_alternatives_frv6y4ptvd" ON "qti"."string_match" IS 'trigger of law alternatives of Node.kind on StringMatch';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2lwrhumony" ON "qti"."substring" IS 'trigger of law alternatives of Node.kind on Substring';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7psbud4cz2" ON "qti"."subtract" IS 'trigger of law alternatives of Node.kind on Subtract';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bl2t2knygh" ON "qti"."sum" IS 'trigger of law alternatives of Node.kind on Sum';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mezsfabltu" ON "qti"."target_object" IS 'trigger of law alternatives of Node.kind on TargetObject';

COMMENT ON TRIGGER "__law_statistic_capacity_target_object_eiitglm36v" ON "qti"."target_object" IS 'trigger of law capacity of Statistic(id) over TargetObject(statistic) within 1..* on TargetObject';

COMMENT ON TRIGGER "__law_node_kind_alternatives_gngplvjki7" ON "qti"."template_condition_arm" IS 'trigger of law alternatives of Node.kind on TemplateConditionArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5fdgy2jheo" ON "qti"."template_constraint" IS 'trigger of law alternatives of Node.kind on TemplateConstraint';

COMMENT ON TRIGGER "__law_node_kind_alternatives_y6lrwlh2rd" ON "qti"."template_else_arm" IS 'trigger of law alternatives of Node.kind on TemplateElseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ho4ol55qrl" ON "qti"."template_else_if_arm" IS 'trigger of law alternatives of Node.kind on TemplateElseIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_i5wd6p3avp" ON "qti"."template_if_arm" IS 'trigger of law alternatives of Node.kind on TemplateIfArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7xb37ile3r" ON "qti"."template_processing" IS 'trigger of law alternatives of Node.kind on TemplateProcessing';

COMMENT ON TRIGGER "__law_node_kind_alternatives_w5lbqmj6id" ON "qti"."test_variables" IS 'trigger of law alternatives of Node.kind on TestVariables';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dhvs325itr" ON "qti"."text_node" IS 'trigger of law alternatives of Node.kind on TextNode';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4qidad7cp6" ON "qti"."truncate" IS 'trigger of law alternatives of Node.kind on Truncate';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_z7pc5podx4" ON "qti"."variable" IS 'trigger of law alternatives of Node.kind on Variable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tr4wev6nbi" ON "qti"."variant" IS 'trigger of law alternatives of Node.kind on Variant';

COMMENT ON TRIGGER "__law_variant_capacity_variant_metadata_nzsbmxh54i" ON "qti"."variant" IS 'trigger of law capacity of Variant(id) over VariantMetadata(variant) within 1..1 on Variant';

COMMENT ON TRIGGER "__law_node_kind_alternatives_r4pd3dasye" ON "qti"."variant_metadata" IS 'trigger of law alternatives of Node.kind on VariantMetadata';

COMMENT ON TRIGGER "__law_variant_capacity_variant_metadata_orngzoitpp" ON "qti"."variant_metadata" IS 'trigger of law capacity of Variant(id) over VariantMetadata(variant) within 1..1 on VariantMetadata';

COMMENT ON TRIGGER "__law_variant_metadata_capacity_access_for_all_yd4rirjjle" ON "qti"."variant_metadata" IS 'trigger of law capacity of VariantMetadata(id) over AccessForAllResource(metadata) within 1..1 on VariantMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qra75t5mkw" ON "qti"."ws" IS 'trigger of law alternatives of Node.kind on Ws';

COMMENT ON TRIGGER "__law_node_kind_alternatives_yod7eg5ohq" ON "qti"."x_include" IS 'trigger of law alternatives of Node.kind on XInclude';
