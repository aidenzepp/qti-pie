REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_celz4obcnh", "qti"."__text_uc3mvgolsg", "qti"."__text_gemmttam7z", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_hvweswafjf", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_ibaizj6fv3", "qti"."__text_gubl3xpcnx", "qti"."__text_mmzgy7vcfw", "qti"."__text_vtz3bnghkc", "qti"."__text_djykoynpls", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_ojm4wya66v", "qti"."__text_u3q4acbjwm", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_2hoxdcszyn", "qti"."__text_6uwfpnix5n", "qti"."__text_vwnl4b5fqr", "qti"."__text_wuvwyowttn" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."admission", "qti__author"."and", "qti__author"."any_n", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."container_size", "qti__author"."contains", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_substring", "qti__author"."declared_tolerance_mode", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."divide", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."fallback", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_content", "qti__author"."gcd", "qti__author"."gt", "qti__author"."gte", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."lcm", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."match", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."member", "qti__author"."min", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."ordered", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."power", "qti__author"."product", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."rule_operand", "qti__author"."schema_location", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."stats_operator", "qti__author"."string_match", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_if_arm", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" FROM "qti__author";

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

GRANT USAGE ON TYPE "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."schema_version", "qti"."standard_template", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_i67gmkzdk7", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_celz4obcnh", "qti"."__text_uc3mvgolsg", "qti"."__text_gemmttam7z", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_hvweswafjf", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_yakcqa4zli", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_ibaizj6fv3", "qti"."__text_gubl3xpcnx", "qti"."__text_mmzgy7vcfw", "qti"."__text_vtz3bnghkc", "qti"."__text_djykoynpls", "qti"."__text_k3z6naurdo", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_ojm4wya66v", "qti"."__text_u3q4acbjwm", "qti"."__text_popyschjwc", "qti"."__text_rhdrzkabze", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_tyjqwtj7ky", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_2hoxdcszyn", "qti"."__text_6uwfpnix5n", "qti"."__text_vwnl4b5fqr", "qti"."__text_wuvwyowttn" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."admission", "qti__author"."and", "qti__author"."any_n", "qti__author"."assessment_item", "qti__author"."attribute_entity_reference", "qti__author"."attribute_lexical", "qti__author"."binding_fit", "qti__author"."built_in_ref", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."comment", "qti__author"."container_size", "qti__author"."contains", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_fixed", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_max_choices", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_substring", "qti__author"."declared_tolerance_mode", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."divide", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_title", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."fallback", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_content", "qti__author"."gcd", "qti__author"."gt", "qti__author"."gte", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."lcm", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."match", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."member", "qti__author"."min", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."node", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."ordered", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."power", "qti__author"."product", "qti__author"."prompt", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_metadata", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."record_binding", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."rule_operand", "qti__author"."schema_location", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."standard_template_reference", "qti__author"."stats_operator", "qti__author"."string_match", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_if_arm", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_node", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."variable", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_max" TO "qti__author";

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
