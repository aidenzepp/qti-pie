REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."ancestry", "qti"."aria_autocomplete_value", "qti"."aria_current_value", "qti"."aria_invalid_value", "qti"."aria_live_value", "qti"."aria_orientation_value", "qti"."aria_role_value", "qti"."aria_sort_value", "qti"."aria_tristate", "qti"."aria_true_false_undefined", "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."boolean_literal", "qti"."bound", "qti"."branch_exit", "qti"."branch_target", "qti"."built_in", "qti"."cell_align", "qti"."cell_scope", "qti"."cell_valign", "qti"."cp_schema", "qti"."cross_origin", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."external_scored", "qti"."id_holder", "qti"."idref_attribute", "qti"."item_ref_target", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."math_constant_name", "qti"."math_operator_name", "qti"."media_autoplay", "qti"."media_controls", "qti"."media_loop", "qti"."media_muted", "qti"."media_preload", "qti"."misc_kind", "qti"."namespace_policy", "qti"."navigation_mode", "qti"."node_kind", "qti"."orientation", "qti"."param_valuetype", "qti"."placement", "qti"."prefixed_source", "qti"."printed_variable_attr", "qti"."process_contents", "qti"."qmd_feedback_type_value", "qti"."qmd_interaction_type_value", "qti"."qmd_scoring_mode_value", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."rounding_mode", "qti"."schema_namespace", "qti"."schema_set", "qti"."schema_version", "qti"."section_variable_target", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."statistic_kind", "qti"."stats_operator_name", "qti"."structure_holder", "qti"."submission_mode", "qti"."suppress_tts_mode", "qti"."target_object_type", "qti"."test_feedback_access", "qti"."text_direction", "qti"."text_format", "qti"."tolerance_mode", "qti"."tool_shape", "qti"."track_default_value", "qti"."track_kind", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."x_include_parse_value", "qti"."xlink_actuate_value", "qti"."xlink_show_value", "qti"."xlink_type_value", "qti"."xml_space", "qti"."xs_boolean", "qti"."yes_no" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."access_mode", "qti"."access_mode_adapted", "qti"."adaptive_ref_href", "qti"."adaptive_ref_identifier", "qti"."aria_integer", "qti"."aria_positive_integer", "qti"."case_item_uri", "qti"."category_list", "qti"."choice_count", "qti"."choice_identifier", "qti"."citation_uri", "qti"."class_list", "qti"."container_width", "qti"."content_language", "qti"."content_media_type", "qti"."custom_operator_class_name", "qti"."custom_operator_definition_uri", "qti"."declared_directed_pair_value", "qti"."declared_duration_value", "qti"."declared_float_value", "qti"."declared_identifier_value", "qti"."declared_integer_value", "qti"."declared_pair_value", "qti"."declared_point_value", "qti"."declared_uri_value", "qti"."drd_adaptation_uri", "qti"."embed_source_uri", "qti"."expected_length", "qti"."expected_lines", "qti"."expression_coords", "qti"."expression_integer_or_variable", "qti"."file_media_type", "qti"."glossary_uri", "qti"."hyperlink_uri", "qti"."id_reference", "qti"."interpolation_default_directed_pair_value", "qti"."interpolation_default_duration_value", "qti"."interpolation_default_float_value", "qti"."interpolation_default_identifier_value", "qti"."interpolation_default_integer_value", "qti"."interpolation_default_pair_value", "qti"."interpolation_default_point_value", "qti"."interpolation_default_uri_value", "qti"."interpolation_source_value", "qti"."interpolation_target_directed_pair_value", "qti"."interpolation_target_duration_value", "qti"."interpolation_target_float_value", "qti"."interpolation_target_identifier_value", "qti"."interpolation_target_integer_value", "qti"."interpolation_target_pair_value", "qti"."interpolation_target_point_value", "qti"."interpolation_target_uri_value", "qti"."item_ref_href", "qti"."lang_string_language", "qti"."literal_directed_pair_value", "qti"."literal_duration_value", "qti"."literal_float_value", "qti"."literal_identifier_value", "qti"."literal_integer_value", "qti"."literal_pair_value", "qti"."literal_point_value", "qti"."literal_uri_value", "qti"."lom_token", "qti"."lom_vocabulary_source", "qti"."lom_vocabulary_value", "qti"."long_description_uri", "qti"."long_interpretation_uri", "qti"."manifest_identifier", "qti"."map_key_directed_pair_value", "qti"."map_key_duration_value", "qti"."map_key_float_value", "qti"."map_key_identifier_value", "qti"."map_key_integer_value", "qti"."map_key_pair_value", "qti"."map_key_point_value", "qti"."map_key_uri_value", "qti"."mapped_variable_name", "qti"."mapping_score", "qti"."match_default_directed_pair_value", "qti"."match_default_duration_value", "qti"."match_default_float_value", "qti"."match_default_identifier_value", "qti"."match_default_integer_value", "qti"."match_default_pair_value", "qti"."match_default_point_value", "qti"."match_default_uri_value", "qti"."match_group_list", "qti"."match_source_value", "qti"."match_target_directed_pair_value", "qti"."match_target_duration_value", "qti"."match_target_float_value", "qti"."match_target_identifier_value", "qti"."match_target_integer_value", "qti"."match_target_pair_value", "qti"."match_target_point_value", "qti"."match_target_uri_value", "qti"."media_rect_coords", "qti"."namespace_prefix", "qti"."namespace_uri", "qti"."outcome_scale_value", "qti"."package_path", "qti"."pi_target", "qti"."printed_variable_integer_or_variable", "qti"."record_field_identifier", "qti"."rect_coords", "qti"."resource_entry_href", "qti"."section_ref_href", "qti"."shape_coords", "qti"."show_hide_identifier", "qti"."slider_bound", "qti"."statistic_context_uri", "qti"."statistic_measure", "qti"."statistic_name", "qti"."stimulus_ref_href", "qti"."stimulus_ref_identifier", "qti"."string_count", "qti"."stylesheet_uri", "qti"."table_span", "qti"."template_location_uri", "qti"."template_parameter_name", "qti"."template_uri", "qti"."test_structure_identifier", "qti"."time_limit_seconds", "qti"."tool_name", "qti"."tool_vendor", "qti"."tool_version", "qti"."track_language", "qti"."usage_case_count", "qti"."usage_directed_pair_value", "qti"."usage_duration_value", "qti"."usage_field_identifier", "qti"."usage_float_value", "qti"."usage_identifier_value", "qti"."usage_integer_value", "qti"."usage_mapping_score", "qti"."usage_pair_value", "qti"."usage_part_identifier", "qti"."usage_point_value", "qti"."usage_uri_value", "qti"."usage_value_token", "qti"."variable_reference", "qti"."weight_reference", "qti"."weight_value", "qti"."x_include_uri", "qti"."xlink_arcrole_uri", "qti"."xlink_href_uri", "qti"."xlink_label_name", "qti"."xlink_role_uri", "qti"."xml_base_uri", "qti"."xml_entity_name", "qti"."xml_local_name", "qti"."__text_osqmo2ktsg", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_oy4m3tqgfd", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_xarz6cej2e", "qti"."__text_xs56r6cx4y", "qti"."__text_ieskz75v7g", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_awt4t5kosa", "qti"."__text_vtz3bnghkc", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_5lyuoloiou", "qti"."__text_bvx3fqniye", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_acxfo763jg", "qti"."__text_tmjud3n2tg", "qti"."__text_gjl5q4ofup", "qti"."__text_rhdrzkabze", "qti"."__text_o3e7dedzyv", "qti"."__text_ukaaxf45sk", "qti"."__text_tyjqwtj7ky", "qti"."__text_fgbxwprcwx", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_hv3bw3mdte", "qti"."__text_kcydnvglpj", "qti"."__text_wuvwyowttn", "qti"."__text_gm4clqaaza", "qti"."__text_saolosnhkp" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."access_for_all_resource", "qti__author"."acronym", "qti__author"."adaptive_engine_ref", "qti__author"."adaptive_selection", "qti__author"."adaptive_settings_ref", "qti__author"."address", "qti__author"."and", "qti__author"."any_n", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."assessment_section", "qti__author"."assessment_stimulus", "qti__author"."assessment_test", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."attribute_entity_reference", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."branch_rule", "qti__author"."branch_rule_exit", "qti__author"."branch_rule_target", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."container_size", "qti__author"."contains", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_allow_comment", "qti__author"."declared_allow_late_submission", "qti__author"."declared_allow_review", "qti__author"."declared_allow_skipping", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_default_value", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_item_ref_fixed", "qti__author"."declared_item_ref_required", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_order_shuffle", "qti__author"."declared_ordering_shuffle", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_rounding_mode", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_section_fixed", "qti__author"."declared_section_keep_together", "qti__author"."declared_section_required", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_feedback", "qti__author"."declared_show_hide", "qti__author"."declared_show_solution", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_substring", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_tolerance_mode", "qti__author"."declared_track_kind", "qti__author"."declared_validate_responses", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."declared_with_replacement", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."divide", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."dt", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_rounded_figures_ref", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."field_value", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."gcd", "qti__author"."global_attribute", "qti__author"."global_element", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices_n", "qti__author"."gt", "qti__author"."gte", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."index_n_ref", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_instance_spelling", "qti__author"."item_instance_variable_ref", "qti__author"."item_ref", "qti__author"."item_ref_category", "qti__author"."item_ref_document", "qti__author"."item_ref_lti", "qti__author"."item_ref_resolution", "qti__author"."item_session_control", "qti__author"."item_session_max_attempts", "qti__author"."item_stimulus_ref", "qti__author"."item_stimulus_ref_title", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."item_variable_ref", "qti__author"."kbd", "qti__author"."label", "qti__author"."lcm", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_selections_message", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."member", "qti__author"."metadata_ref", "qti__author"."min", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."no_namespace_schema_location", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."or", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."ordered", "qti__author"."ordering", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."power", "qti__author"."pre", "qti__author"."pre_condition", "qti__author"."prefixed_built_in", "qti__author"."prefixed_declared", "qti__author"."prefixed_mapped", "qti__author"."prefixed_variable_source", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."product", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."rb", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."repeat_number_repeats_ref", "qti__author"."required_child", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."root_schema_set", "qti__author"."round", "qti__author"."round_to", "qti__author"."round_to_figures_ref", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."section_duration_ref", "qti__author"."section_duration_target", "qti__author"."section_feedback_outcome_ref", "qti__author"."section_identifier_target", "qti__author"."section_printed_variable_ref", "qti__author"."section_printed_variable_var_ref", "qti__author"."section_ref", "qti__author"."section_ref_resolution", "qti__author"."section_variable_duration", "qti__author"."section_variable_prefixed", "qti__author"."section_variable_resolution", "qti__author"."select_point_interaction", "qti__author"."selection", "qti__author"."selection_bounded", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."stimulus_body", "qti__author"."stimulus_ref_resolution", "qti__author"."string_binding", "qti__author"."string_match", "qti__author"."strong", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_default", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_feedback_block", "qti__author"."template_if_arm", "qti__author"."template_inline", "qti__author"."template_processing", "qti__author"."test_document", "qti__author"."test_feedback", "qti__author"."test_feedback_content_body", "qti__author"."test_feedback_title", "qti__author"."test_identifier", "qti__author"."test_part", "qti__author"."test_part_title", "qti__author"."test_reach", "qti__author"."test_rubric_block", "qti__author"."test_rubric_block_use", "qti__author"."test_rubric_content_body", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."time_limit_max", "qti__author"."time_limit_min", "qti__author"."time_limits", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."tt", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_data_ref", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."weight", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer", "qti__author"."xsi_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."a" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."a_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."abbr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."acronym" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."adaptive_engine_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."adaptive_selection" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."adaptive_settings_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."address" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."and" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."any_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_map_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping_lower_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping_upper_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_activedescendant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_atomic" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_autocomplete" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_busy" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_checked" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_colcount" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_colindex" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_colspan" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_controls" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_current" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_describedby" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_details" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_disabled" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_errormessage" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_expanded" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_flowto" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_haspopup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_hidden" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_invalid" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_keyshortcuts" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_keyshorts" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_labelledby" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_level" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_live" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_modal" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_multiline" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_multiselectable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_owns" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_placeholder" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_posinset" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_pressed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_readonly" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_relevant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_required" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_role" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_roledescription" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_rowcount" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_rowindex" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_rowspan" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_selected" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_setsize" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_sort" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuemax" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuemin" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuenow" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuetext" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."article" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aside" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_section" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_stimulus" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_test" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_match_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associate_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_file_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_spelling" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_autoplay" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_controls" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_crossorigin" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_loop" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_mediagroup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_muted" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_preload" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."audio_src" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."b" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."bdi" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."bdo" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."bdo_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."big" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."blockquote" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."blockquote_cite" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."br" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule_exit" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."caption" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."catalog_info" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."categorized_statistic_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_template_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cite" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."code" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."col" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."col_span" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."colgroup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."colgroup_span" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."comment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."companion_materials_info" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."container_size" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."contains" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."content_body_feedback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."content_body_modal" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."content_body_rubric" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."content_body_rubric_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."content_body_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."context_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."context_declaration_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."coords" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."coords_circle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."coords_default" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."coords_ellipse" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."coords_poly" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."coords_rect" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."correct" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator_class" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."custom_operator_definition" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dd" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_comment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_late_submission" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_review" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_skipping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_area_mapping_default_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associable_hotspot_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_default_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_format" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_min_strings" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_inline_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_img_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_required" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_text_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_associate_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_gap_match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_choice_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_boundary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_lower_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_upper_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_required" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_item_ref_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_item_ref_required" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_map_entry_case_sensitive" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_mapping_default_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_math_variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_media_loop" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_order_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_ordering_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_param_variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_position_object_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_delimiter" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_mapping_indicator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_power_form" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_rounding_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_rubric_template_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_rubric_template_inline_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_section_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_section_keep_together" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_section_required" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_feedback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_solution" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_slider_step_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_substring" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_feedback_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_inline_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_text_entry_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_tolerance_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_track_kind" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_validate_responses" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_valuetype" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_with_replacement" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."default" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."delete" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dependency" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."details" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."details_open" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dfn" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."div" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."divide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dl" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_xml_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drawing_interaction" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."duration_gte" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."duration_lt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."edge" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."em" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_count_attempt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."equal" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."equal_rounded" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."equal_rounded_figures_ref" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_length" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_lines" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_max_strings" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_pattern_mask" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_patternmask_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_placeholder_text" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."external_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."fallback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_inline" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_outcome_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."field_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."figcaption" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."figure" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_content" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."footer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."foreign_attribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."foreign_element" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_img" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_left" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_match_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_object_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_top" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_choices_container_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_text" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_text_match_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gcd" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_choices_container_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_max_choices_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_min_choices_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gte" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."h_1" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."h_2" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."h_3" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."h_4" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."h_5" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."h_6" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."header" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."headers_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_choice_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_owner" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."html_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."i" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_height" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."index" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."index_n_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_prompt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inside" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."integer_divide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."integer_modulus" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."integer_to_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interaction_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."is_null" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_body" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_body_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_instance_spelling" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_instance_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_category" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_lti" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_resolution" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_session_control" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_session_max_attempts" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_stimulus_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_stimulus_ref_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_both" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."kbd" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lcm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."li" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lookup_outcome_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lte" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_manifest" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_of_variant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_schema_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_xml_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_response" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_response_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_lower_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_upper_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_first_column_header" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_group" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_boolean" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_uri" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_constant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_operator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."max" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_coords" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_max_plays" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_min_plays" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."member" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."metadata_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."multiple" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."namespace_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."nav" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."no_namespace_schema_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_catalog_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_class" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_dir" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_suppress_tts" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_space" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."not" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."null" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_correct" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_incorrect" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_presented" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_responded" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."number_selected" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object_height" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ol" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."operand" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."or" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_choices_container_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_max_choices_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_min_choices_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ordered" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ordering" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ordinary_statistic_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."organizations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_condition_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_document" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."param" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."param_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pattern_match" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pi" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."picture" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_center_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_stage" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."power" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pre" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pre_condition" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_built_in" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_declared" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_mapped" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_variable_source" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_field" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_format" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_index" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_var_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."product" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."prompt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."q" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."q_cite" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_external_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."qti_metadata_in_resource_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_float_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_integer_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."random_integer_step" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rb" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_field" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."repeat" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."repeat_number_repeats_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."required_child" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_general" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_language_set" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."round_to_figures_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rp" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rtc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rubric_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rubric_template_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rubric_template_inline" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ruby" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rule_operand" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."samp" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_duration_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_duration_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_outcome_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_identifier_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_variable_var_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_ref_resolution" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_declared" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_duration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_prefixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_resolution" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."select_point_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."selection" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."selection_bounded" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_correct_response" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_default_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_outcome_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."set_template_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_match_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_match_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice_template_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."simple_match_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."slider_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."slider_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."slider_reverse" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."slider_step" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."small" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."source" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."source_media" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."source_sizes" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."source_srcset" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."source_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."span" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."standard_template_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_case_count" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_glossary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_last_updated" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_deviation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_error" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stats_operator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stimulus_body" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stimulus_ref_resolution" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."string_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."string_match" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."strong" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."structure_child" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_media" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."sub" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."substring" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."subtract" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."sum" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."summary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."sup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."table" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."table_summary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."target_object" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."target_object_object_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."target_object_part_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tbody" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td_abbr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td_align" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td_axis" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td_colspan" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td_rowspan" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td_scope" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."td_valign" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_condition_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_constraint" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_content_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_default" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_else_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_else_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_feedback_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_inline" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_parameter_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_processing" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_feedback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_feedback_content_body" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_feedback_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_part" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_part_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_reach" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_rubric_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_rubric_block_use" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_rubric_content_body" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_variables" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_variables_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_expected_length" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_format" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_pattern_mask" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_patternmask_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_placeholder_text" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tfoot" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th_abbr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th_align" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th_axis" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th_colspan" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th_rowspan" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th_scope" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."th_valign" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."thead" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."time_limit_max" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."time_limit_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."time_limits" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."track" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."track_default" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."track_srclang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_doctype" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_export_charset" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_misc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_root" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_encoding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_standalone" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."truncate" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ul" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."upload_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."upload_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_data" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_data_glossary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_data_ref" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."var" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_weight_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variant" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variant_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_autoplay" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_controls" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_crossorigin" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_height" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_loop" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_mediagroup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_muted" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_poster" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_preload" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_src" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."video_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."weight" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ws" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_encoding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_parse" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_xpointer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_actuate" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_arcrole" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_from" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_role" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_show" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_to" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xlink_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xsi_nil" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xsi_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xsi_type_attribute" FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"("pg_catalog"."text", "pg_catalog"."text", "pg_catalog"."text") FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."ancestry", "qti"."aria_autocomplete_value", "qti"."aria_current_value", "qti"."aria_invalid_value", "qti"."aria_live_value", "qti"."aria_orientation_value", "qti"."aria_role_value", "qti"."aria_sort_value", "qti"."aria_tristate", "qti"."aria_true_false_undefined", "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."boolean_literal", "qti"."bound", "qti"."branch_exit", "qti"."branch_target", "qti"."built_in", "qti"."cell_align", "qti"."cell_scope", "qti"."cell_valign", "qti"."cp_schema", "qti"."cross_origin", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."external_scored", "qti"."id_holder", "qti"."idref_attribute", "qti"."item_ref_target", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."math_constant_name", "qti"."math_operator_name", "qti"."mathml_boolean_value", "qti"."mathml_closure_value", "qti"."mathml_columnalignstyle_value", "qti"."mathml_dir_value", "qti"."mathml_display_value", "qti"."mathml_edge_value", "qti"."mathml_fontstyle_value", "qti"."mathml_fontweight_value", "qti"."mathml_form_value", "qti"."mathml_group_alignment_value", "qti"."mathml_indentalign_line_value", "qti"."mathml_indentalign_value", "qti"."mathml_infixlinebreakstyle_value", "qti"."mathml_linebreak_value", "qti"."mathml_linebreakstyle_value", "qti"."mathml_linestyle_value", "qti"."mathml_location_value", "qti"."mathml_longdivstyle_value", "qti"."mathml_mathvariant_value", "qti"."mathml_mspace_linebreak_value", "qti"."mathml_occurrence_value", "qti"."mathml_order_value", "qti"."mathml_overflow_value", "qti"."mathml_side_value", "qti"."mathml_value_type", "qti"."mathml_verticalalign_value", "qti"."media_autoplay", "qti"."media_controls", "qti"."media_loop", "qti"."media_muted", "qti"."media_preload", "qti"."misc_kind", "qti"."namespace_policy", "qti"."navigation_mode", "qti"."node_kind", "qti"."orientation", "qti"."param_valuetype", "qti"."placement", "qti"."prefixed_source", "qti"."printed_variable_attr", "qti"."process_contents", "qti"."qmd_feedback_type_value", "qti"."qmd_interaction_type_value", "qti"."qmd_scoring_mode_value", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."rounding_mode", "qti"."schema_namespace", "qti"."schema_set", "qti"."schema_version", "qti"."section_variable_target", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."statistic_kind", "qti"."stats_operator_name", "qti"."structure_holder", "qti"."submission_mode", "qti"."suppress_tts_mode", "qti"."target_object_type", "qti"."test_feedback_access", "qti"."text_direction", "qti"."text_format", "qti"."tolerance_mode", "qti"."tool_shape", "qti"."track_default_value", "qti"."track_kind", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."x_include_parse_value", "qti"."xlink_actuate_value", "qti"."xlink_show_value", "qti"."xlink_type_value", "qti"."xml_space", "qti"."xs_boolean", "qti"."yes_no" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."access_mode", "qti"."access_mode_adapted", "qti"."adaptive_ref_href", "qti"."adaptive_ref_identifier", "qti"."aria_integer", "qti"."aria_positive_integer", "qti"."case_item_uri", "qti"."category_list", "qti"."choice_count", "qti"."choice_identifier", "qti"."citation_uri", "qti"."class_list", "qti"."container_width", "qti"."content_language", "qti"."content_media_type", "qti"."custom_operator_class_name", "qti"."custom_operator_definition_uri", "qti"."declared_directed_pair_value", "qti"."declared_duration_value", "qti"."declared_float_value", "qti"."declared_identifier_value", "qti"."declared_integer_value", "qti"."declared_pair_value", "qti"."declared_point_value", "qti"."declared_uri_value", "qti"."drd_adaptation_uri", "qti"."embed_source_uri", "qti"."expected_length", "qti"."expected_lines", "qti"."expression_coords", "qti"."expression_integer_or_variable", "qti"."file_media_type", "qti"."glossary_uri", "qti"."hyperlink_uri", "qti"."id_reference", "qti"."interpolation_default_directed_pair_value", "qti"."interpolation_default_duration_value", "qti"."interpolation_default_float_value", "qti"."interpolation_default_identifier_value", "qti"."interpolation_default_integer_value", "qti"."interpolation_default_pair_value", "qti"."interpolation_default_point_value", "qti"."interpolation_default_uri_value", "qti"."interpolation_source_value", "qti"."interpolation_target_directed_pair_value", "qti"."interpolation_target_duration_value", "qti"."interpolation_target_float_value", "qti"."interpolation_target_identifier_value", "qti"."interpolation_target_integer_value", "qti"."interpolation_target_pair_value", "qti"."interpolation_target_point_value", "qti"."interpolation_target_uri_value", "qti"."item_ref_href", "qti"."lang_string_language", "qti"."literal_directed_pair_value", "qti"."literal_duration_value", "qti"."literal_float_value", "qti"."literal_identifier_value", "qti"."literal_integer_value", "qti"."literal_pair_value", "qti"."literal_point_value", "qti"."literal_uri_value", "qti"."lom_token", "qti"."lom_vocabulary_source", "qti"."lom_vocabulary_value", "qti"."long_description_uri", "qti"."long_interpretation_uri", "qti"."manifest_identifier", "qti"."map_key_directed_pair_value", "qti"."map_key_duration_value", "qti"."map_key_float_value", "qti"."map_key_identifier_value", "qti"."map_key_integer_value", "qti"."map_key_pair_value", "qti"."map_key_point_value", "qti"."map_key_uri_value", "qti"."mapped_variable_name", "qti"."mapping_score", "qti"."match_default_directed_pair_value", "qti"."match_default_duration_value", "qti"."match_default_float_value", "qti"."match_default_identifier_value", "qti"."match_default_integer_value", "qti"."match_default_pair_value", "qti"."match_default_point_value", "qti"."match_default_uri_value", "qti"."match_group_list", "qti"."match_source_value", "qti"."match_target_directed_pair_value", "qti"."match_target_duration_value", "qti"."match_target_float_value", "qti"."match_target_identifier_value", "qti"."match_target_integer_value", "qti"."match_target_pair_value", "qti"."match_target_point_value", "qti"."match_target_uri_value", "qti"."mathml_base_value", "qti"."mathml_cbytes_value", "qti"."mathml_cd_value", "qti"."mathml_cdgroup_value", "qti"."mathml_definition_url_value", "qti"."mathml_index_value", "qti"."mathml_name_value", "qti"."mathml_nargs_value", "qti"."mathml_position_value", "qti"."mathml_scriptlevel_value", "qti"."mathml_selection_value", "qti"."mathml_shift_value", "qti"."mathml_span_value", "qti"."mathml_src_value", "qti"."media_rect_coords", "qti"."namespace_prefix", "qti"."namespace_uri", "qti"."outcome_scale_value", "qti"."package_path", "qti"."pi_target", "qti"."printed_variable_integer_or_variable", "qti"."record_field_identifier", "qti"."rect_coords", "qti"."resource_entry_href", "qti"."section_ref_href", "qti"."shape_coords", "qti"."show_hide_identifier", "qti"."slider_bound", "qti"."statistic_context_uri", "qti"."statistic_measure", "qti"."statistic_name", "qti"."stimulus_ref_href", "qti"."stimulus_ref_identifier", "qti"."string_count", "qti"."stylesheet_uri", "qti"."table_span", "qti"."template_location_uri", "qti"."template_parameter_name", "qti"."template_uri", "qti"."test_structure_identifier", "qti"."time_limit_seconds", "qti"."tool_name", "qti"."tool_vendor", "qti"."tool_version", "qti"."track_language", "qti"."usage_case_count", "qti"."usage_directed_pair_value", "qti"."usage_duration_value", "qti"."usage_field_identifier", "qti"."usage_float_value", "qti"."usage_identifier_value", "qti"."usage_integer_value", "qti"."usage_mapping_score", "qti"."usage_pair_value", "qti"."usage_part_identifier", "qti"."usage_point_value", "qti"."usage_uri_value", "qti"."usage_value_token", "qti"."variable_reference", "qti"."weight_reference", "qti"."weight_value", "qti"."x_include_uri", "qti"."xlink_arcrole_uri", "qti"."xlink_href_uri", "qti"."xlink_label_name", "qti"."xlink_role_uri", "qti"."xml_base_uri", "qti"."xml_entity_name", "qti"."xml_local_name", "qti"."__text_osqmo2ktsg", "qti"."__text_fywgikzrwf", "qti"."__text_i7djrwbb7n", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_xusnuddb4k", "qti"."__text_ottycep7en", "qti"."__text_jfksd4nu5r", "qti"."__text_oxgrhofw2c", "qti"."__text_oy4m3tqgfd", "qti"."__text_7dlsmkhhat", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_jruckr5nmf", "qti"."__text_623scqhhre", "qti"."__text_64ulvvuteh", "qti"."__text_xarz6cej2e", "qti"."__text_x4ovwk3uop", "qti"."__text_xs56r6cx4y", "qti"."__text_ieskz75v7g", "qti"."__text_oc36elqfmy", "qti"."__text_o4z6v6eurt", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_okcvipkynh", "qti"."__text_nx57zic2sr", "qti"."__text_awt4t5kosa", "qti"."__text_j6r7doraiw", "qti"."__text_vrj3u337cv", "qti"."__text_vtz3bnghkc", "qti"."__text_sa4c4ywp5v", "qti"."__text_6ifjn7x3qm", "qti"."__text_vpd3gbdfhl", "qti"."__text_lsy6pxooea", "qti"."__text_5lyuoloiou", "qti"."__text_bvx3fqniye", "qti"."__text_7mihpbbens", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_r5z7lvpd56", "qti"."__text_raisrajgpi", "qti"."__text_hubjq5m7kx", "qti"."__text_cfvofy6jst", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_yyhgrftqjx", "qti"."__text_acxfo763jg", "qti"."__text_tmjud3n2tg", "qti"."__text_gjl5q4ofup", "qti"."__text_rhdrzkabze", "qti"."__text_o3e7dedzyv", "qti"."__text_ukaaxf45sk", "qti"."__text_tyjqwtj7ky", "qti"."__text_fgbxwprcwx", "qti"."__text_vwyq7r3dau", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_mlv3bwkpew", "qti"."__text_hv3bw3mdte", "qti"."__text_kcydnvglpj", "qti"."__text_wuvwyowttn", "qti"."__text_gm4clqaaza", "qti"."__text_saolosnhkp", "qti"."__text_q57lslnkle" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."access_for_all_resource", "qti__author"."acronym", "qti__author"."adaptive_engine_ref", "qti__author"."adaptive_selection", "qti__author"."adaptive_settings_ref", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."and", "qti__author"."any_n", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."assessment_section", "qti__author"."assessment_stimulus", "qti__author"."assessment_test", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_exclusion", "qti__author"."attribute_file_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."attribute_spelling", "qti__author"."attribute_wildcard", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."branch_rule", "qti__author"."branch_rule_exit", "qti__author"."branch_rule_target", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."container_size", "qti__author"."contains", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_allow_comment", "qti__author"."declared_allow_late_submission", "qti__author"."declared_allow_review", "qti__author"."declared_allow_skipping", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_default_value", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_item_ref_fixed", "qti__author"."declared_item_ref_required", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_order_shuffle", "qti__author"."declared_ordering_shuffle", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_section_fixed", "qti__author"."declared_section_keep_together", "qti__author"."declared_section_required", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_feedback", "qti__author"."declared_show_hide", "qti__author"."declared_show_solution", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_substring", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_tolerance_mode", "qti__author"."declared_track_kind", "qti__author"."declared_validate_responses", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."declared_with_replacement", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."divide", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."document_xml_id", "qti__author"."drawing_interaction", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."dt", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_rounded_figures_ref", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."field_value", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."footer", "qti__author"."foreign_attribute", "qti__author"."foreign_element", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."gcd", "qti__author"."global_attribute", "qti__author"."global_element", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices_n", "qti__author"."gt", "qti__author"."gte", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."index_n_ref", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_instance_spelling", "qti__author"."item_instance_variable_ref", "qti__author"."item_ref", "qti__author"."item_ref_category", "qti__author"."item_ref_document", "qti__author"."item_ref_lti", "qti__author"."item_ref_resolution", "qti__author"."item_session_control", "qti__author"."item_session_max_attempts", "qti__author"."item_stimulus_ref", "qti__author"."item_stimulus_ref_title", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."item_variable_ref", "qti__author"."kbd", "qti__author"."label", "qti__author"."lcm", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."manifest_xml_id", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_selections_message", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."mathml_abs", "qti__author"."mathml_align", "qti__author"."mathml_alignmentscope", "qti__author"."mathml_altimg_valign", "qti__author"."mathml_and", "qti__author"."mathml_annotation", "qti__author"."mathml_annotation_xml", "qti__author"."mathml_apply", "qti__author"."mathml_approx", "qti__author"."mathml_arccos", "qti__author"."mathml_arccosh", "qti__author"."mathml_arccot", "qti__author"."mathml_arccoth", "qti__author"."mathml_arccsc", "qti__author"."mathml_arccsch", "qti__author"."mathml_arcsec", "qti__author"."mathml_arcsech", "qti__author"."mathml_arcsin", "qti__author"."mathml_arcsinh", "qti__author"."mathml_arctan", "qti__author"."mathml_arctanh", "qti__author"."mathml_arg", "qti__author"."mathml_attribute_type", "qti__author"."mathml_background", "qti__author"."mathml_base", "qti__author"."mathml_bind", "qti__author"."mathml_boolean", "qti__author"."mathml_bvar", "qti__author"."mathml_card", "qti__author"."mathml_cartesianproduct", "qti__author"."mathml_cbytes", "qti__author"."mathml_cd", "qti__author"."mathml_cdgroup", "qti__author"."mathml_ceiling", "qti__author"."mathml_cerror", "qti__author"."mathml_character", "qti__author"."mathml_charspacing", "qti__author"."mathml_ci", "qti__author"."mathml_class", "qti__author"."mathml_closure", "qti__author"."mathml_cn", "qti__author"."mathml_codomain", "qti__author"."mathml_color", "qti__author"."mathml_columnalign", "qti__author"."mathml_columnalignstyle", "qti__author"."mathml_columnwidth", "qti__author"."mathml_complexes", "qti__author"."mathml_compose", "qti__author"."mathml_condition", "qti__author"."mathml_conjugate", "qti__author"."mathml_cos", "qti__author"."mathml_cosh", "qti__author"."mathml_cot", "qti__author"."mathml_coth", "qti__author"."mathml_crossout", "qti__author"."mathml_cs", "qti__author"."mathml_csc", "qti__author"."mathml_csch", "qti__author"."mathml_csymbol", "qti__author"."mathml_curl", "qti__author"."mathml_declare", "qti__author"."mathml_definition_url", "qti__author"."mathml_degree", "qti__author"."mathml_determinant", "qti__author"."mathml_diff", "qti__author"."mathml_dir", "qti__author"."mathml_display", "qti__author"."mathml_divergence", "qti__author"."mathml_divide", "qti__author"."mathml_domain", "qti__author"."mathml_domainofapplication", "qti__author"."mathml_edge", "qti__author"."mathml_embed_source", "qti__author"."mathml_emptyset", "qti__author"."mathml_eq", "qti__author"."mathml_equivalent", "qti__author"."mathml_eulergamma", "qti__author"."mathml_exists", "qti__author"."mathml_exp", "qti__author"."mathml_exponentiale", "qti__author"."mathml_factorial", "qti__author"."mathml_factorof", "qti__author"."mathml_false", "qti__author"."mathml_floor", "qti__author"."mathml_fn", "qti__author"."mathml_fontstyle", "qti__author"."mathml_fontweight", "qti__author"."mathml_forall", "qti__author"."mathml_form", "qti__author"."mathml_framespacing", "qti__author"."mathml_gcd", "qti__author"."mathml_geq", "qti__author"."mathml_grad", "qti__author"."mathml_group_alignment", "qti__author"."mathml_group_alignment_list", "qti__author"."mathml_group_alignment_list_list", "qti__author"."mathml_gt", "qti__author"."mathml_href", "qti__author"."mathml_ident", "qti__author"."mathml_image", "qti__author"."mathml_imaginary", "qti__author"."mathml_imaginaryi", "qti__author"."mathml_implies", "qti__author"."mathml_in", "qti__author"."mathml_indentalign", "qti__author"."mathml_indentalign_line", "qti__author"."mathml_indentshift_line", "qti__author"."mathml_index", "qti__author"."mathml_infinity", "qti__author"."mathml_infixlinebreakstyle", "qti__author"."mathml_int", "qti__author"."mathml_integers", "qti__author"."mathml_intersect", "qti__author"."mathml_interval", "qti__author"."mathml_inverse", "qti__author"."mathml_lambda", "qti__author"."mathml_laplacian", "qti__author"."mathml_lcm", "qti__author"."mathml_length", "qti__author"."mathml_length_list", "qti__author"."mathml_leq", "qti__author"."mathml_limit", "qti__author"."mathml_line_thickness", "qti__author"."mathml_linebreak", "qti__author"."mathml_linebreakstyle", "qti__author"."mathml_linestyle", "qti__author"."mathml_linestyle_list", "qti__author"."mathml_list", "qti__author"."mathml_ln", "qti__author"."mathml_location", "qti__author"."mathml_log", "qti__author"."mathml_logbase", "qti__author"."mathml_longdivstyle", "qti__author"."mathml_lowlimit", "qti__author"."mathml_lt", "qti__author"."mathml_maction", "qti__author"."mathml_maligngroup", "qti__author"."mathml_malignmark", "qti__author"."mathml_math", "qti__author"."mathml_mathsize", "qti__author"."mathml_mathvariant", "qti__author"."mathml_matrix", "qti__author"."mathml_matrixrow", "qti__author"."mathml_max", "qti__author"."mathml_maxsize", "qti__author"."mathml_mean", "qti__author"."mathml_median", "qti__author"."mathml_menclose", "qti__author"."mathml_merror", "qti__author"."mathml_mfenced", "qti__author"."mathml_mfrac", "qti__author"."mathml_mglyph", "qti__author"."mathml_mi", "qti__author"."mathml_min", "qti__author"."mathml_minus", "qti__author"."mathml_mlabeledtr", "qti__author"."mathml_mlongdiv", "qti__author"."mathml_mmultiscripts", "qti__author"."mathml_mn", "qti__author"."mathml_mo", "qti__author"."mathml_mode", "qti__author"."mathml_moment", "qti__author"."mathml_momentabout", "qti__author"."mathml_mover", "qti__author"."mathml_mpadded", "qti__author"."mathml_mpadded_length", "qti__author"."mathml_mphantom", "qti__author"."mathml_mprescripts", "qti__author"."mathml_mroot", "qti__author"."mathml_mrow", "qti__author"."mathml_ms", "qti__author"."mathml_mscarries", "qti__author"."mathml_mscarry", "qti__author"."mathml_msgroup", "qti__author"."mathml_msline", "qti__author"."mathml_mspace", "qti__author"."mathml_mspace_linebreak", "qti__author"."mathml_msqrt", "qti__author"."mathml_msrow", "qti__author"."mathml_mstack", "qti__author"."mathml_mstyle", "qti__author"."mathml_msub", "qti__author"."mathml_msubsup", "qti__author"."mathml_msup", "qti__author"."mathml_mtable", "qti__author"."mathml_mtd", "qti__author"."mathml_mtext", "qti__author"."mathml_mtr", "qti__author"."mathml_munder", "qti__author"."mathml_munderover", "qti__author"."mathml_name", "qti__author"."mathml_nargs", "qti__author"."mathml_naturalnumbers", "qti__author"."mathml_neq", "qti__author"."mathml_none", "qti__author"."mathml_not", "qti__author"."mathml_notanumber", "qti__author"."mathml_notin", "qti__author"."mathml_notprsubset", "qti__author"."mathml_notsubset", "qti__author"."mathml_number", "qti__author"."mathml_occurrence", "qti__author"."mathml_or", "qti__author"."mathml_order", "qti__author"."mathml_otherwise", "qti__author"."mathml_outerproduct", "qti__author"."mathml_overflow", "qti__author"."mathml_partialdiff", "qti__author"."mathml_pi", "qti__author"."mathml_piece", "qti__author"."mathml_piecewise", "qti__author"."mathml_plus", "qti__author"."mathml_position", "qti__author"."mathml_power", "qti__author"."mathml_primes", "qti__author"."mathml_product", "qti__author"."mathml_prsubset", "qti__author"."mathml_quotient", "qti__author"."mathml_rationals", "qti__author"."mathml_real", "qti__author"."mathml_reals", "qti__author"."mathml_reln", "qti__author"."mathml_rem", "qti__author"."mathml_root", "qti__author"."mathml_rowalign", "qti__author"."mathml_scalarproduct", "qti__author"."mathml_scriptlevel", "qti__author"."mathml_sdev", "qti__author"."mathml_sec", "qti__author"."mathml_sech", "qti__author"."mathml_selection", "qti__author"."mathml_selector", "qti__author"."mathml_semantics", "qti__author"."mathml_semantics_ci", "qti__author"."mathml_sep", "qti__author"."mathml_set", "qti__author"."mathml_setdiff", "qti__author"."mathml_share", "qti__author"."mathml_shift", "qti__author"."mathml_side", "qti__author"."mathml_sin", "qti__author"."mathml_sinh", "qti__author"."mathml_span", "qti__author"."mathml_src", "qti__author"."mathml_string", "qti__author"."mathml_subset", "qti__author"."mathml_sum", "qti__author"."mathml_table_width", "qti__author"."mathml_tan", "qti__author"."mathml_tanh", "qti__author"."mathml_tendsto", "qti__author"."mathml_times", "qti__author"."mathml_transpose", "qti__author"."mathml_true", "qti__author"."mathml_union", "qti__author"."mathml_unsigned_integer", "qti__author"."mathml_uplimit", "qti__author"."mathml_variance", "qti__author"."mathml_vector", "qti__author"."mathml_vectorproduct", "qti__author"."mathml_verticalalign", "qti__author"."mathml_xor", "qti__author"."max", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."member", "qti__author"."metadata_ref", "qti__author"."min", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."no_namespace_schema_location", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."node_xml_space", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."ordered", "qti__author"."ordering", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."power", "qti__author"."pre", "qti__author"."pre_condition", "qti__author"."prefixed_built_in", "qti__author"."prefixed_declared", "qti__author"."prefixed_mapped", "qti__author"."prefixed_variable_source", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."product", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."repeat_number_repeats_ref", "qti__author"."required_child", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."root_schema_set", "qti__author"."round", "qti__author"."round_to", "qti__author"."round_to_figures_ref", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."rule_operand", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."section_duration_ref", "qti__author"."section_duration_target", "qti__author"."section_feedback_outcome_ref", "qti__author"."section_identifier_target", "qti__author"."section_printed_variable_ref", "qti__author"."section_printed_variable_var_ref", "qti__author"."section_ref", "qti__author"."section_ref_resolution", "qti__author"."section_variable_declared", "qti__author"."section_variable_duration", "qti__author"."section_variable_prefixed", "qti__author"."section_variable_ref", "qti__author"."section_variable_resolution", "qti__author"."select_point_interaction", "qti__author"."selection", "qti__author"."selection_bounded", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."stimulus_body", "qti__author"."stimulus_ref_resolution", "qti__author"."string_binding", "qti__author"."string_match", "qti__author"."strong", "qti__author"."structure_child", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_default", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_feedback_block", "qti__author"."template_if_arm", "qti__author"."template_inline", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_document", "qti__author"."test_feedback", "qti__author"."test_feedback_content_body", "qti__author"."test_feedback_title", "qti__author"."test_identifier", "qti__author"."test_part", "qti__author"."test_part_title", "qti__author"."test_reach", "qti__author"."test_rubric_block", "qti__author"."test_rubric_block_use", "qti__author"."test_rubric_content_body", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."time_limit_max", "qti__author"."time_limit_min", "qti__author"."time_limits", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_data_ref", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."weight", "qti__author"."wildcard_exclusion", "qti__author"."wildcard_host", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer", "qti__author"."xlink_actuate", "qti__author"."xlink_arcrole", "qti__author"."xlink_from", "qti__author"."xlink_href", "qti__author"."xlink_label", "qti__author"."xlink_role", "qti__author"."xlink_show", "qti__author"."xlink_title", "qti__author"."xlink_to", "qti__author"."xlink_type", "qti__author"."xsi_nil", "qti__author"."xsi_type", "qti__author"."xsi_type_attribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."a" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."a_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."abbr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."acronym" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."adaptive_engine_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."adaptive_selection" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."adaptive_settings_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."address" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."and" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."any_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."area_map_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping_lower_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping_upper_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_activedescendant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_atomic" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_autocomplete" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_busy" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_checked" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_colcount" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_colindex" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_colspan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_controls" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_current" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_describedby" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_details" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_disabled" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_errormessage" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_expanded" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_flowto" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_haspopup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_hidden" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_invalid" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_keyshortcuts" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_keyshorts" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_labelledby" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_level" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_live" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_modal" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_multiline" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_multiselectable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_owns" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_placeholder" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_posinset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_pressed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_readonly" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_relevant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_role" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_roledescription" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_rowcount" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_rowindex" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_rowspan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_selected" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_setsize" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_sort" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuemax" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuemin" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuenow" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_valuetext" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."article" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aside" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_item_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_section" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_stimulus" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_test" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_match_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associate_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_file_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_idref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_spelling" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_autoplay" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_controls" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_crossorigin" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_loop" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_mediagroup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_muted" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_preload" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."audio_src" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."b" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."bdi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."bdo" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."bdo_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."big" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."blockquote" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."blockquote_cite" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."br" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule_exit" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."caption" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."catalog_info" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."categorized_statistic_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_template_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."cite" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."code" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."col" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."col_span" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."colgroup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."colgroup_span" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."comment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."companion_materials_info" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."container_size" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."contains" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."content_body_feedback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."content_body_modal" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."content_body_rubric" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."content_body_rubric_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."content_body_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."context_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."context_declaration_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."coords" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."coords_circle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."coords_default" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."coords_ellipse" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."coords_poly" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."coords_rect" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dd" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_comment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_late_submission" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_review" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_allow_skipping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_area_mapping_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associable_hotspot_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_format" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_min_strings" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_inline_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_img_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_text_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_associate_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_gap_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_choice_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_boundary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_lower_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_upper_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_item_ref_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_item_ref_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_map_entry_case_sensitive" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_mapping_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_math_variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_media_loop" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_order_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_ordering_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_param_variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_position_object_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_delimiter" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_mapping_indicator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_power_form" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_rounding_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_rubric_template_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_rubric_template_inline_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_section_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_section_keep_together" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_section_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_feedback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_solution" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_slider_step_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_substring" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_feedback_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_inline_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_text_entry_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_tolerance_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_track_kind" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_validate_responses" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_valuetype" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_with_replacement" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."default" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."delete" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dependency" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."details" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."details_open" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dfn" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."div" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."divide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dl" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_xml_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drawing_interaction" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."duration_gte" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."duration_lt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."edge" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."em" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_count_attempt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."equal" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."equal_rounded" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."equal_rounded_figures_ref" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_length" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_lines" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_max_strings" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_pattern_mask" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_patternmask_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_placeholder_text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."external_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."fallback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_inline" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_outcome_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."field_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."figcaption" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."figure" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_content" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."footer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."foreign_attribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."foreign_element" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_img" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_left" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_match_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_object_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_img_top" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_choices_container_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_text_match_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gcd" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_choices_container_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_max_choices_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_min_choices_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gte" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."h_1" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."h_2" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."h_3" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."h_4" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."h_5" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."h_6" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."header" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."headers_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_choice_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_owner" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."html_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."i" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_height" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."index" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."index_n_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_prompt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inside" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."integer_divide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."integer_modulus" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."integer_to_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interaction_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_default_value_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interpolation_table_entry_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."is_null" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_body" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_body_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_instance_spelling" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_instance_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_category" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_lti" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_resolution" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_session_control" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_session_max_attempts" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_stimulus_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_stimulus_ref_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_both" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."kbd" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lcm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."li" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_xml_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_entry_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_response" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_response_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_lower_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_upper_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_first_column_header" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_group" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_default_value_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_table_entry_uri" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_constant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_operator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_abs" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_align" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_alignmentscope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_altimg_valign" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_and" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_annotation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_annotation_xml" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_apply" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_approx" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arccos" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arccosh" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arccot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arccoth" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arccsc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arccsch" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arcsec" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arcsech" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arcsin" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arcsinh" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arctan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arctanh" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_arg" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_background" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_bind" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_boolean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_bvar" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_card" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cartesianproduct" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cbytes" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cd" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cdgroup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_ceiling" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cerror" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_character" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_charspacing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_ci" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_class" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_closure" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cn" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_codomain" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_color" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_columnalign" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_columnalignstyle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_columnwidth" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_complexes" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_compose" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_condition" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_conjugate" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cos" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cosh" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_coth" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_crossout" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_cs" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_csc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_csch" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_csymbol" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_curl" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_declare" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_definition_url" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_degree" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_determinant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_diff" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_dir" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_display" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_divergence" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_divide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_domain" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_domainofapplication" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_edge" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_embed_source" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_emptyset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_eq" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_equivalent" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_eulergamma" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_exists" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_exp" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_exponentiale" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_factorial" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_factorof" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_false" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_floor" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_fn" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_fontstyle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_fontweight" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_forall" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_form" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_framespacing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_gcd" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_geq" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_grad" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_group_alignment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_group_alignment_list" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_group_alignment_list_list" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_gt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_ident" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_image" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_imaginary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_imaginaryi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_implies" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_in" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_indentalign" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_indentalign_line" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_indentshift_line" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_index" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_infinity" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_infixlinebreakstyle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_int" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_integers" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_intersect" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_interval" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_inverse" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_lambda" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_laplacian" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_lcm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_length" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_length_list" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_leq" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_limit" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_line_thickness" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_linebreak" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_linebreakstyle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_linestyle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_linestyle_list" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_list" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_ln" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_log" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_logbase" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_longdivstyle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_lowlimit" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_lt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_maction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_maligngroup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_malignmark" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_math" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mathsize" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mathvariant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_matrix" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_matrixrow" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_max" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_maxsize" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mean" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_median" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_menclose" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_merror" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mfenced" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mfrac" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mglyph" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_minus" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mlabeledtr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mlongdiv" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mmultiscripts" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mn" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mo" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_moment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_momentabout" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mover" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mpadded" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mpadded_length" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mphantom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mprescripts" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mroot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mrow" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_ms" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mscarries" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mscarry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_msgroup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_msline" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mspace" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mspace_linebreak" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_msqrt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_msrow" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mstack" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mstyle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_msub" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_msubsup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_msup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mtable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mtd" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mtext" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_mtr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_munder" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_munderover" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_nargs" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_naturalnumbers" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_neq" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_none" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_not" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_notanumber" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_notin" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_notprsubset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_notsubset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_number" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_occurrence" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_or" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_order" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_otherwise" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_outerproduct" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_overflow" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_partialdiff" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_pi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_piece" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_piecewise" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_plus" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_position" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_power" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_primes" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_product" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_prsubset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_quotient" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_rationals" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_real" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_reals" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_reln" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_rem" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_root" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_rowalign" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_scalarproduct" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_scriptlevel" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_sdev" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_sec" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_sech" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_selection" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_selector" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_semantics" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_semantics_ci" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_sep" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_setdiff" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_share" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_shift" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_side" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_sin" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_sinh" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_span" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_src" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_subset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_sum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_table_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_tan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_tanh" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_tendsto" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_times" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_transpose" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_true" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_union" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_unsigned_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_uplimit" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_variance" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_vector" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_vectorproduct" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_verticalalign" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mathml_xor" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."max" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_coords" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_max_plays" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_min_plays" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."member" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."metadata_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."multiple" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."namespace_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."nav" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."no_namespace_schema_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_catalog_idref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_class" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_dir" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_suppress_tts" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_space" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."not" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."null" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_correct" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_incorrect" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_presented" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_responded" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."number_selected" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object_height" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ol" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."operand" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."or" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_choices_container_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_max_choices_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_min_choices_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ordered" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ordering" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."param" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."param_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pattern_match" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."picture" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_center_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_stage" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."power" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pre" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pre_condition" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_built_in" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_declared" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_mapped" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."prefixed_variable_source" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_field" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_format" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_index" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_var_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."product" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."prompt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."q" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."q_cite" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."qti_label" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rb" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_field" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."repeat" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."repeat_number_repeats_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."required_child" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_general" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_language_set" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."round_to_figures_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rp" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rtc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rubric_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rubric_template_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rubric_template_inline" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ruby" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rule_operand" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."samp" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_duration_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_duration_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_outcome_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_identifier_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_variable_var_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_ref_resolution" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_declared" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_duration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_prefixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_variable_resolution" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."select_point_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."selection" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."selection_bounded" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_correct_response" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_outcome_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."set_template_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_match_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_match_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_associable_choice_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_choice_template_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."simple_match_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."slider_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."slider_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."slider_reverse" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."slider_step" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."small" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."source" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."source_media" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."source_sizes" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."source_srcset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."source_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."span" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."standard_template_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_case_count" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_glossary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_last_updated" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_deviation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_std_error" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stats_operator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stimulus_body" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stimulus_ref_resolution" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."string_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."string_match" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."strong" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."structure_child" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_media" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sub" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."substring" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."subtract" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."summary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."table" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."table_summary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object_object_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."target_object_part_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tbody" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td_abbr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td_align" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td_axis" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td_colspan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td_rowspan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td_scope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."td_valign" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_condition_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_constraint" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_content_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_default" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_else_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_else_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_feedback_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_if_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_inline" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_parameter_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_processing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_feedback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_feedback_content_body" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_feedback_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_part" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_part_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_reach" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_rubric_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_rubric_block_use" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_rubric_content_body" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_variables" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_variables_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_expected_length" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_format" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_pattern_mask" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_patternmask_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_entry_placeholder_text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_node" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tfoot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th_abbr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th_align" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th_axis" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th_colspan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th_rowspan" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th_scope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."th_valign" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."thead" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."time_limit_max" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."time_limit_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."time_limits" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."track" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."track_default" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."track_srclang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_doctype" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_export_charset" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_misc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_root" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_encoding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_standalone" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tree_xml_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."truncate" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ul" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."upload_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."upload_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_data" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_data_glossary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_data_ref" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."var" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_weight_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variant_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_autoplay" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_controls" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_crossorigin" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_height" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_loop" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_mediagroup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_muted" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_poster" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_preload" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_src" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."video_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."weight" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ws" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_encoding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_parse" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."x_include_xpointer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_actuate" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_arcrole" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_from" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_role" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_show" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_to" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xlink_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xsi_nil" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xsi_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xsi_type_attribute" TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__refuse"("pg_catalog"."text", "pg_catalog"."text", "pg_catalog"."text") TO "qti__author";

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."a", "qti"."a_type", "qti"."abbr", "qti"."access_for_all_resource", "qti"."acronym", "qti"."adaptive_engine_ref", "qti"."adaptive_selection", "qti"."adaptive_settings_ref", "qti"."address", "qti"."admission", "qti"."ancestry_step", "qti"."and", "qti"."any_n", "qti"."area_map_entry", "qti"."area_mapping", "qti"."area_mapping_lower_bound", "qti"."area_mapping_upper_bound", "qti"."aria_activedescendant", "qti"."aria_atomic", "qti"."aria_autocomplete", "qti"."aria_busy", "qti"."aria_checked", "qti"."aria_colcount", "qti"."aria_colindex", "qti"."aria_colspan", "qti"."aria_controls", "qti"."aria_current", "qti"."aria_describedby", "qti"."aria_details", "qti"."aria_disabled", "qti"."aria_errormessage", "qti"."aria_expanded", "qti"."aria_flowto", "qti"."aria_haspopup", "qti"."aria_hidden", "qti"."aria_invalid", "qti"."aria_keyshortcuts", "qti"."aria_keyshorts", "qti"."aria_label", "qti"."aria_labelledby", "qti"."aria_level", "qti"."aria_live", "qti"."aria_modal", "qti"."aria_multiline", "qti"."aria_multiselectable", "qti"."aria_orientation", "qti"."aria_owns", "qti"."aria_placeholder", "qti"."aria_posinset", "qti"."aria_pressed", "qti"."aria_readonly", "qti"."aria_relevant", "qti"."aria_required", "qti"."aria_role", "qti"."aria_roledescription", "qti"."aria_rowcount", "qti"."aria_rowindex", "qti"."aria_rowspan", "qti"."aria_selected", "qti"."aria_setsize", "qti"."aria_sort", "qti"."aria_valuemax", "qti"."aria_valuemin", "qti"."aria_valuenow", "qti"."aria_valuetext", "qti"."article", "qti"."aside", "qti"."assessment_item", "qti"."assessment_item_label", "qti"."assessment_section", "qti"."assessment_stimulus", "qti"."assessment_test", "qti"."associable_hotspot", "qti"."associable_hotspot_label", "qti"."associable_hotspot_match_min", "qti"."associate_interaction", "qti"."attribute_admission", "qti"."attribute_entity_reference", "qti"."attribute_exclusion", "qti"."attribute_file_reference", "qti"."attribute_idref", "qti"."attribute_lexical", "qti"."attribute_spelling", "qti"."attribute_wildcard", "qti"."audio", "qti"."audio_autoplay", "qti"."audio_controls", "qti"."audio_crossorigin", "qti"."audio_loop", "qti"."audio_mediagroup", "qti"."audio_muted", "qti"."audio_preload", "qti"."audio_src", "qti"."b", "qti"."bdi", "qti"."bdo", "qti"."bdo_title", "qti"."big", "qti"."binding_fit", "qti"."blockquote", "qti"."blockquote_cite", "qti"."br", "qti"."branch_rule", "qti"."branch_rule_exit", "qti"."branch_rule_target", "qti"."built_in_ref", "qti"."caption", "qti"."catalog_info", "qti"."categorized_statistic_arm", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."choice_template_ref", "qti"."cite", "qti"."code", "qti"."col", "qti"."col_span", "qti"."colgroup", "qti"."colgroup_span", "qti"."comment", "qti"."companion_materials_info", "qti"."container_size", "qti"."contains", "qti"."content_body_feedback", "qti"."content_body_modal", "qti"."content_body_rubric", "qti"."content_body_rubric_template", "qti"."content_body_template", "qti"."context_declaration_arm", "qti"."context_declaration_id", "qti"."coords", "qti"."coords_circle", "qti"."coords_default", "qti"."coords_ellipse", "qti"."coords_poly", "qti"."coords_rect", "qti"."correct", "qti"."correct_response_arm", "qti"."csm_case_item_uri", "qti"."csm_guid", "qti"."csm_label", "qti"."csm_labelled_guid", "qti"."csm_metadata", "qti"."csm_metadata_provider_id", "qti"."csm_set", "qti"."csm_set_of_guids", "qti"."csm_set_of_guids_region", "qti"."csm_set_of_guids_version", "qti"."csm_set_resource_label", "qti"."csm_set_resource_part_id", "qti"."custom_operator", "qti"."custom_operator_class", "qti"."custom_operator_definition", "qti"."dd", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_allow_comment", "qti"."declared_allow_late_submission", "qti"."declared_allow_review", "qti"."declared_allow_skipping", "qti"."declared_area_mapping_default_value", "qti"."declared_associable_hotspot_show_hide", "qti"."declared_associate_max_associations", "qti"."declared_associate_min_associations", "qti"."declared_associate_shuffle", "qti"."declared_default_value", "qti"."declared_extended_text_base", "qti"."declared_extended_text_format", "qti"."declared_extended_text_min_strings", "qti"."declared_feedback_block_show_hide", "qti"."declared_feedback_inline_show_hide", "qti"."declared_fixed", "qti"."declared_gap_img_show_hide", "qti"."declared_gap_match_max_associations", "qti"."declared_gap_match_shuffle", "qti"."declared_gap_required", "qti"."declared_gap_show_hide", "qti"."declared_gap_text_show_hide", "qti"."declared_graphic_associate_max_associations", "qti"."declared_graphic_gap_match_max_associations", "qti"."declared_hotspot_choice_show_hide", "qti"."declared_hotspot_max_choices", "qti"."declared_hotspot_min_choices", "qti"."declared_hottext_max_choices", "qti"."declared_hottext_min_choices", "qti"."declared_hottext_show_hide", "qti"."declared_include_boundary", "qti"."declared_include_lower_bound", "qti"."declared_include_upper_bound", "qti"."declared_inline_choice_fixed", "qti"."declared_inline_choice_min_choices", "qti"."declared_inline_choice_required", "qti"."declared_inline_choice_show_hide", "qti"."declared_inline_choice_shuffle", "qti"."declared_item_ref_fixed", "qti"."declared_item_ref_required", "qti"."declared_map_entry_case_sensitive", "qti"."declared_mapping_default_value", "qti"."declared_match_max_associations", "qti"."declared_match_min_associations", "qti"."declared_match_shuffle", "qti"."declared_math_variable", "qti"."declared_max_choices", "qti"."declared_media_loop", "qti"."declared_min_choices", "qti"."declared_order_shuffle", "qti"."declared_ordering_shuffle", "qti"."declared_orientation", "qti"."declared_param_variable", "qti"."declared_position_object_max_choices", "qti"."declared_printed_variable_base", "qti"."declared_printed_variable_delimiter", "qti"."declared_printed_variable_mapping_indicator", "qti"."declared_printed_variable_power_form", "qti"."declared_ref", "qti"."declared_rounding_mode", "qti"."declared_rubric_template_block_show_hide", "qti"."declared_rubric_template_inline_show_hide", "qti"."declared_section_fixed", "qti"."declared_section_keep_together", "qti"."declared_section_required", "qti"."declared_select_point_max_choices", "qti"."declared_select_point_min_choices", "qti"."declared_show_feedback", "qti"."declared_show_hide", "qti"."declared_show_solution", "qti"."declared_shuffle", "qti"."declared_slider_step_label", "qti"."declared_substring", "qti"."declared_template_block_show_hide", "qti"."declared_template_feedback_block_show_hide", "qti"."declared_template_inline_show_hide", "qti"."declared_text_entry_base", "qti"."declared_tolerance_mode", "qti"."declared_track_kind", "qti"."declared_validate_responses", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."declared_valuetype", "qti"."declared_with_replacement", "qti"."default", "qti"."default_value_arm", "qti"."delete", "qti"."dependency", "qti"."details", "qti"."details_open", "qti"."dfn", "qti"."div", "qti"."divide", "qti"."dl", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_lang", "qti"."document_title", "qti"."document_xml_id", "qti"."drawing_interaction", "qti"."drd_access_mode", "qti"."drd_access_mode_adapted", "qti"."drd_adaptation_detail", "qti"."drd_adaptation_media_type", "qti"."drd_adaptation_type", "qti"."drd_api_interoperable", "qti"."drd_at_interoperable", "qti"."drd_control_flexibility", "qti"."drd_display_transformability", "qti"."drd_educational_complexity_of_adaptation", "qti"."drd_educational_level_of_adaptation", "qti"."drd_has_adaptation", "qti"."drd_hazard", "qti"."drd_is_adaptation_of", "qti"."drd_is_full_adaptation_of", "qti"."drd_is_partial_adaptation_of", "qti"."drd_language_of_adaptation", "qti"."dt", "qti"."duration_gte", "qti"."duration_lt", "qti"."edge", "qti"."em", "qti"."end_attempt_count_attempt", "qti"."end_attempt_interaction", "qti"."entity_reference", "qti"."equal", "qti"."equal_rounded", "qti"."equal_rounded_figures_ref", "qti"."equal_tolerance", "qti"."exit_response", "qti"."exit_template", "qti"."exit_test", "qti"."expression", "qti"."expression_exclude_category", "qti"."expression_include_category", "qti"."expression_max", "qti"."expression_section_identifier", "qti"."expression_weight_identifier", "qti"."extended_text_expected_length", "qti"."extended_text_expected_lines", "qti"."extended_text_interaction", "qti"."extended_text_max_strings", "qti"."extended_text_pattern_mask", "qti"."extended_text_patternmask_message", "qti"."extended_text_placeholder_text", "qti"."external_lom", "qti"."fallback", "qti"."feedback_block", "qti"."feedback_inline", "qti"."feedback_outcome_ref", "qti"."field_value", "qti"."figcaption", "qti"."figure", "qti"."file", "qti"."file_content", "qti"."file_lom", "qti"."file_metadata", "qti"."footer", "qti"."foreign_attribute", "qti"."foreign_element", "qti"."gap", "qti"."gap_img", "qti"."gap_img_left", "qti"."gap_img_match_min", "qti"."gap_img_object_label", "qti"."gap_img_top", "qti"."gap_match_binding", "qti"."gap_match_choices_container_width", "qti"."gap_match_interaction", "qti"."gap_match_max_selections_message", "qti"."gap_match_min_associations", "qti"."gap_match_min_selections_message", "qti"."gap_text", "qti"."gap_text_match_min", "qti"."gcd", "qti"."global_attribute", "qti"."global_element", "qti"."graphic_associate_interaction", "qti"."graphic_associate_min_associations", "qti"."graphic_gap_match_choices_container_width", "qti"."graphic_gap_match_interaction", "qti"."graphic_gap_match_max_selections_message", "qti"."graphic_gap_match_min_associations", "qti"."graphic_gap_match_min_selections_message", "qti"."graphic_order_interaction", "qti"."graphic_order_max_choices_n", "qti"."graphic_order_min_choices_n", "qti"."gt", "qti"."gte", "qti"."h_1", "qti"."h_2", "qti"."h_3", "qti"."h_4", "qti"."h_5", "qti"."h_6", "qti"."header", "qti"."headers_target", "qti"."hotspot_choice", "qti"."hotspot_choice_label", "qti"."hotspot_interaction", "qti"."hotspot_max_selections_message", "qti"."hotspot_min_selections_message", "qti"."hottext", "qti"."hottext_interaction", "qti"."hottext_max_selections_message", "qti"."hottext_min_selections_message", "qti"."hottext_owner", "qti"."hr", "qti"."html_id", "qti"."i", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."index", "qti"."index_n_ref", "qti"."inline_choice", "qti"."inline_choice_interaction", "qti"."inline_choice_min_selections_message", "qti"."inline_choice_prompt", "qti"."inside", "qti"."integer_divide", "qti"."integer_modulus", "qti"."integer_to_float", "qti"."interaction_binding", "qti"."interpolation_table", "qti"."interpolation_table_default_value", "qti"."interpolation_table_default_value_boolean", "qti"."interpolation_table_default_value_directed_pair", "qti"."interpolation_table_default_value_duration", "qti"."interpolation_table_default_value_file", "qti"."interpolation_table_default_value_float", "qti"."interpolation_table_default_value_identifier", "qti"."interpolation_table_default_value_integer", "qti"."interpolation_table_default_value_pair", "qti"."interpolation_table_default_value_point", "qti"."interpolation_table_default_value_string", "qti"."interpolation_table_default_value_uri", "qti"."interpolation_table_entry", "qti"."interpolation_table_entry_boolean", "qti"."interpolation_table_entry_directed_pair", "qti"."interpolation_table_entry_duration", "qti"."interpolation_table_entry_file", "qti"."interpolation_table_entry_float", "qti"."interpolation_table_entry_identifier", "qti"."interpolation_table_entry_integer", "qti"."interpolation_table_entry_pair", "qti"."interpolation_table_entry_point", "qti"."interpolation_table_entry_string", "qti"."interpolation_table_entry_uri", "qti"."is_null", "qti"."item_body", "qti"."item_body_id", "qti"."item_instance_spelling", "qti"."item_instance_variable_ref", "qti"."item_ref", "qti"."item_ref_category", "qti"."item_ref_document", "qti"."item_ref_lti", "qti"."item_ref_resolution", "qti"."item_session_control", "qti"."item_session_max_attempts", "qti"."item_stimulus_ref", "qti"."item_stimulus_ref_title", "qti"."item_tool", "qti"."item_tool_both", "qti"."item_tool_name", "qti"."item_tool_version", "qti"."item_variable_ref", "qti"."kbd", "qti"."label", "qti"."lcm", "qti"."li", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_annotation", "qti"."lom_classification", "qti"."lom_context", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_difficulty", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_educational", "qti"."lom_entity", "qti"."lom_entry_lang_string", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_id", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_intended_end_user_role", "qti"."lom_interactivity_level", "qti"."lom_interactivity_type", "qti"."lom_keyword", "qti"."lom_kind", "qti"."lom_language", "qti"."lom_learning_resource_type", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_purpose", "qti"."lom_relation", "qti"."lom_requirement", "qti"."lom_resource", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_semantic_density", "qti"."lom_size", "qti"."lom_source", "qti"."lom_source_lang_string", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_taxon", "qti"."lom_taxon_path", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_typical_age_range", "qti"."lom_typical_learning_time", "qti"."lom_value", "qti"."lom_version", "qti"."lookup_outcome_value", "qti"."lt", "qti"."lte", "qti"."manifest", "qti"."manifest_id", "qti"."manifest_id_of_manifest", "qti"."manifest_id_of_resource", "qti"."manifest_id_of_variant", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."manifest_xml_id", "qti"."map_entry", "qti"."map_entry_boolean", "qti"."map_entry_directed_pair", "qti"."map_entry_duration", "qti"."map_entry_file", "qti"."map_entry_float", "qti"."map_entry_identifier", "qti"."map_entry_integer", "qti"."map_entry_pair", "qti"."map_entry_point", "qti"."map_entry_string", "qti"."map_entry_uri", "qti"."map_response", "qti"."map_response_point", "qti"."mappable_base_type", "qti"."mapping", "qti"."mapping_lower_bound", "qti"."mapping_upper_bound", "qti"."match", "qti"."match_first_column_header", "qti"."match_group", "qti"."match_interaction", "qti"."match_max_selections_message", "qti"."match_min_selections_message", "qti"."match_table", "qti"."match_table_default_value", "qti"."match_table_default_value_boolean", "qti"."match_table_default_value_directed_pair", "qti"."match_table_default_value_duration", "qti"."match_table_default_value_file", "qti"."match_table_default_value_float", "qti"."match_table_default_value_identifier", "qti"."match_table_default_value_integer", "qti"."match_table_default_value_pair", "qti"."match_table_default_value_point", "qti"."match_table_default_value_string", "qti"."match_table_default_value_uri", "qti"."match_table_entry", "qti"."match_table_entry_boolean", "qti"."match_table_entry_directed_pair", "qti"."match_table_entry_duration", "qti"."match_table_entry_file", "qti"."match_table_entry_float", "qti"."match_table_entry_identifier", "qti"."match_table_entry_integer", "qti"."match_table_entry_pair", "qti"."match_table_entry_point", "qti"."match_table_entry_string", "qti"."match_table_entry_uri", "qti"."math_constant", "qti"."math_operator", "qti"."mathml_abs", "qti"."mathml_align", "qti"."mathml_alignmentscope", "qti"."mathml_altimg_valign", "qti"."mathml_and", "qti"."mathml_annotation", "qti"."mathml_annotation_xml", "qti"."mathml_apply", "qti"."mathml_approx", "qti"."mathml_arccos", "qti"."mathml_arccosh", "qti"."mathml_arccot", "qti"."mathml_arccoth", "qti"."mathml_arccsc", "qti"."mathml_arccsch", "qti"."mathml_arcsec", "qti"."mathml_arcsech", "qti"."mathml_arcsin", "qti"."mathml_arcsinh", "qti"."mathml_arctan", "qti"."mathml_arctanh", "qti"."mathml_arg", "qti"."mathml_attribute_type", "qti"."mathml_background", "qti"."mathml_base", "qti"."mathml_bind", "qti"."mathml_boolean", "qti"."mathml_bvar", "qti"."mathml_card", "qti"."mathml_cartesianproduct", "qti"."mathml_cbytes", "qti"."mathml_cd", "qti"."mathml_cdgroup", "qti"."mathml_ceiling", "qti"."mathml_cerror", "qti"."mathml_character", "qti"."mathml_charspacing", "qti"."mathml_ci", "qti"."mathml_class", "qti"."mathml_closure", "qti"."mathml_cn", "qti"."mathml_codomain", "qti"."mathml_color", "qti"."mathml_columnalign", "qti"."mathml_columnalignstyle", "qti"."mathml_columnwidth", "qti"."mathml_complexes", "qti"."mathml_compose", "qti"."mathml_condition", "qti"."mathml_conjugate", "qti"."mathml_cos", "qti"."mathml_cosh", "qti"."mathml_cot", "qti"."mathml_coth", "qti"."mathml_crossout", "qti"."mathml_cs", "qti"."mathml_csc", "qti"."mathml_csch", "qti"."mathml_csymbol", "qti"."mathml_curl", "qti"."mathml_declare", "qti"."mathml_definition_url", "qti"."mathml_degree", "qti"."mathml_determinant", "qti"."mathml_diff", "qti"."mathml_dir", "qti"."mathml_display", "qti"."mathml_divergence", "qti"."mathml_divide", "qti"."mathml_domain", "qti"."mathml_domainofapplication", "qti"."mathml_edge", "qti"."mathml_embed_source", "qti"."mathml_emptyset", "qti"."mathml_eq", "qti"."mathml_equivalent", "qti"."mathml_eulergamma", "qti"."mathml_exists", "qti"."mathml_exp", "qti"."mathml_exponentiale", "qti"."mathml_factorial", "qti"."mathml_factorof", "qti"."mathml_false", "qti"."mathml_floor", "qti"."mathml_fn", "qti"."mathml_fontstyle", "qti"."mathml_fontweight", "qti"."mathml_forall", "qti"."mathml_form", "qti"."mathml_framespacing", "qti"."mathml_gcd", "qti"."mathml_geq", "qti"."mathml_grad", "qti"."mathml_group_alignment", "qti"."mathml_group_alignment_list", "qti"."mathml_group_alignment_list_list", "qti"."mathml_gt", "qti"."mathml_href", "qti"."mathml_ident", "qti"."mathml_image", "qti"."mathml_imaginary", "qti"."mathml_imaginaryi", "qti"."mathml_implies", "qti"."mathml_in", "qti"."mathml_indentalign", "qti"."mathml_indentalign_line", "qti"."mathml_indentshift_line", "qti"."mathml_index", "qti"."mathml_infinity", "qti"."mathml_infixlinebreakstyle", "qti"."mathml_int", "qti"."mathml_integers", "qti"."mathml_intersect", "qti"."mathml_interval", "qti"."mathml_inverse", "qti"."mathml_lambda", "qti"."mathml_laplacian", "qti"."mathml_lcm", "qti"."mathml_length", "qti"."mathml_length_list", "qti"."mathml_leq", "qti"."mathml_limit", "qti"."mathml_line_thickness", "qti"."mathml_linebreak", "qti"."mathml_linebreakstyle", "qti"."mathml_linestyle", "qti"."mathml_linestyle_list", "qti"."mathml_list", "qti"."mathml_ln", "qti"."mathml_location", "qti"."mathml_log", "qti"."mathml_logbase", "qti"."mathml_longdivstyle", "qti"."mathml_lowlimit", "qti"."mathml_lt", "qti"."mathml_maction", "qti"."mathml_maligngroup", "qti"."mathml_malignmark", "qti"."mathml_math", "qti"."mathml_mathsize", "qti"."mathml_mathvariant", "qti"."mathml_matrix", "qti"."mathml_matrixrow", "qti"."mathml_max", "qti"."mathml_maxsize", "qti"."mathml_mean", "qti"."mathml_median", "qti"."mathml_menclose", "qti"."mathml_merror", "qti"."mathml_mfenced", "qti"."mathml_mfrac", "qti"."mathml_mglyph", "qti"."mathml_mi", "qti"."mathml_min", "qti"."mathml_minus", "qti"."mathml_mlabeledtr", "qti"."mathml_mlongdiv", "qti"."mathml_mmultiscripts", "qti"."mathml_mn", "qti"."mathml_mo", "qti"."mathml_mode", "qti"."mathml_moment", "qti"."mathml_momentabout", "qti"."mathml_mover", "qti"."mathml_mpadded", "qti"."mathml_mpadded_length", "qti"."mathml_mphantom", "qti"."mathml_mprescripts", "qti"."mathml_mroot", "qti"."mathml_mrow", "qti"."mathml_ms", "qti"."mathml_mscarries", "qti"."mathml_mscarry", "qti"."mathml_msgroup", "qti"."mathml_msline", "qti"."mathml_mspace", "qti"."mathml_mspace_linebreak", "qti"."mathml_msqrt", "qti"."mathml_msrow", "qti"."mathml_mstack", "qti"."mathml_mstyle", "qti"."mathml_msub", "qti"."mathml_msubsup", "qti"."mathml_msup", "qti"."mathml_mtable", "qti"."mathml_mtd", "qti"."mathml_mtext", "qti"."mathml_mtr", "qti"."mathml_munder", "qti"."mathml_munderover", "qti"."mathml_name", "qti"."mathml_nargs", "qti"."mathml_naturalnumbers", "qti"."mathml_neq", "qti"."mathml_none", "qti"."mathml_not", "qti"."mathml_notanumber", "qti"."mathml_notin", "qti"."mathml_notprsubset", "qti"."mathml_notsubset", "qti"."mathml_number", "qti"."mathml_occurrence", "qti"."mathml_or", "qti"."mathml_order", "qti"."mathml_otherwise", "qti"."mathml_outerproduct", "qti"."mathml_overflow", "qti"."mathml_partialdiff", "qti"."mathml_pi", "qti"."mathml_piece", "qti"."mathml_piecewise", "qti"."mathml_plus", "qti"."mathml_position", "qti"."mathml_power", "qti"."mathml_primes", "qti"."mathml_product", "qti"."mathml_prsubset", "qti"."mathml_quotient", "qti"."mathml_rationals", "qti"."mathml_real", "qti"."mathml_reals", "qti"."mathml_reln", "qti"."mathml_rem", "qti"."mathml_root", "qti"."mathml_rowalign", "qti"."mathml_scalarproduct", "qti"."mathml_scriptlevel", "qti"."mathml_sdev", "qti"."mathml_sec", "qti"."mathml_sech", "qti"."mathml_selection", "qti"."mathml_selector", "qti"."mathml_semantics", "qti"."mathml_semantics_ci", "qti"."mathml_sep", "qti"."mathml_set", "qti"."mathml_setdiff", "qti"."mathml_share", "qti"."mathml_shift", "qti"."mathml_side", "qti"."mathml_sin", "qti"."mathml_sinh", "qti"."mathml_span", "qti"."mathml_src", "qti"."mathml_string", "qti"."mathml_subset", "qti"."mathml_sum", "qti"."mathml_table_width", "qti"."mathml_tan", "qti"."mathml_tanh", "qti"."mathml_tendsto", "qti"."mathml_times", "qti"."mathml_transpose", "qti"."mathml_true", "qti"."mathml_union", "qti"."mathml_unsigned_integer", "qti"."mathml_uplimit", "qti"."mathml_variance", "qti"."mathml_vector", "qti"."mathml_vectorproduct", "qti"."mathml_verticalalign", "qti"."mathml_xor", "qti"."max", "qti"."media_coords", "qti"."media_interaction", "qti"."media_max_plays", "qti"."media_min_plays", "qti"."member", "qti"."metadata_ref", "qti"."min", "qti"."modal_feedback", "qti"."modal_feedback_title", "qti"."multiple", "qti"."namespace_declaration", "qti"."nav", "qti"."no_namespace_schema_location", "qti"."node", "qti"."node_catalog_idref", "qti"."node_class", "qti"."node_dir", "qti"."node_label", "qti"."node_lang", "qti"."node_suppress_tts", "qti"."node_xml_base", "qti"."node_xml_lang", "qti"."node_xml_space", "qti"."not", "qti"."null", "qti"."number_correct", "qti"."number_incorrect", "qti"."number_presented", "qti"."number_responded", "qti"."number_selected", "qti"."object", "qti"."object_height", "qti"."object_width", "qti"."ol", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."operator_arity_unbounded", "qti"."or", "qti"."order_choices_container_width", "qti"."order_interaction", "qti"."order_max_choices_n", "qti"."order_max_selections_message", "qti"."order_min_choices_n", "qti"."order_min_selections_message", "qti"."order_orientation", "qti"."ordered", "qti"."ordering", "qti"."ordinary_statistic_arm", "qti"."organizations", "qti"."outcome_condition_arm", "qti"."outcome_declaration_arm", "qti"."outcome_document", "qti"."outcome_else_arm", "qti"."outcome_else_if_arm", "qti"."outcome_if_arm", "qti"."outcome_maximum_arm", "qti"."outcome_min_max", "qti"."outcome_minimum_arm", "qti"."outcome_processing", "qti"."outcome_processing_fragment", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."param", "qti"."param_type", "qti"."pattern_match", "qti"."pi", "qti"."picture", "qti"."position_object_center_point", "qti"."position_object_interaction", "qti"."position_object_min_choices", "qti"."position_object_stage", "qti"."power", "qti"."pre", "qti"."pre_condition", "qti"."prefixed_built_in", "qti"."prefixed_declared", "qti"."prefixed_mapped", "qti"."prefixed_variable_source", "qti"."printed_variable", "qti"."printed_variable_field", "qti"."printed_variable_format", "qti"."printed_variable_id", "qti"."printed_variable_index", "qti"."printed_variable_ref", "qti"."printed_variable_var_ref", "qti"."product", "qti"."prompt", "qti"."q", "qti"."q_cite", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_label", "qti"."qti_metadata", "qti"."qti_metadata_in_external_lom", "qti"."qti_metadata_in_metadata", "qti"."qti_metadata_in_resource_lom", "qti"."random", "qti"."random_float", "qti"."random_float_min", "qti"."random_integer", "qti"."random_integer_min", "qti"."random_integer_step", "qti"."rb", "qti"."record_binding", "qti"."record_binding_fit", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."repeat", "qti"."repeat_number_repeats_ref", "qti"."required_child", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_general", "qti"."resource_lom_identified", "qti"."resource_lom_language_set", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_condition_arm", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_else_arm", "qti"."response_else_if_arm", "qti"."response_if_arm", "qti"."response_processing", "qti"."response_processing_fragment", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."root_schema_set", "qti"."round", "qti"."round_to", "qti"."round_to_figures_ref", "qti"."rp", "qti"."rt", "qti"."rtc", "qti"."rubric_block", "qti"."rubric_template_block", "qti"."rubric_template_inline", "qti"."ruby", "qti"."rule_operand", "qti"."samp", "qti"."schema_location", "qti"."section", "qti"."section_duration_ref", "qti"."section_duration_target", "qti"."section_feedback_outcome_ref", "qti"."section_identifier_target", "qti"."section_printed_variable_ref", "qti"."section_printed_variable_var_ref", "qti"."section_ref", "qti"."section_ref_resolution", "qti"."section_variable_declared", "qti"."section_variable_duration", "qti"."section_variable_prefixed", "qti"."section_variable_ref", "qti"."section_variable_resolution", "qti"."select_point_interaction", "qti"."selection", "qti"."selection_bounded", "qti"."set_correct_response", "qti"."set_default_value", "qti"."set_outcome_value", "qti"."set_template_value", "qti"."simple_associable_choice", "qti"."simple_associable_choice_fixed", "qti"."simple_associable_choice_match_min", "qti"."simple_associable_choice_match_set", "qti"."simple_associable_choice_show_hide", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."simple_match_set", "qti"."slider_interaction", "qti"."slider_orientation", "qti"."slider_reverse", "qti"."slider_step", "qti"."small", "qti"."source", "qti"."source_media", "qti"."source_sizes", "qti"."source_srcset", "qti"."source_type", "qti"."span", "qti"."standard_template_reference", "qti"."statistic", "qti"."statistic_case_count", "qti"."statistic_glossary", "qti"."statistic_last_updated", "qti"."statistic_std_deviation", "qti"."statistic_std_error", "qti"."stats_operator", "qti"."stimulus_body", "qti"."stimulus_ref_resolution", "qti"."string_binding", "qti"."string_match", "qti"."strong", "qti"."structure_child", "qti"."stylesheet", "qti"."stylesheet_media", "qti"."stylesheet_title", "qti"."sub", "qti"."substring", "qti"."subtract", "qti"."sum", "qti"."summary", "qti"."sup", "qti"."table", "qti"."table_summary", "qti"."target_object", "qti"."target_object_object_type", "qti"."target_object_part_identifier", "qti"."tbody", "qti"."td", "qti"."td_abbr", "qti"."td_align", "qti"."td_axis", "qti"."td_colspan", "qti"."td_rowspan", "qti"."td_scope", "qti"."td_valign", "qti"."template", "qti"."template_block", "qti"."template_condition_arm", "qti"."template_constraint", "qti"."template_content_ref", "qti"."template_declaration_arm", "qti"."template_default", "qti"."template_else_arm", "qti"."template_else_if_arm", "qti"."template_feedback_block", "qti"."template_if_arm", "qti"."template_inline", "qti"."template_parameter_ref", "qti"."template_processing", "qti"."test_document", "qti"."test_feedback", "qti"."test_feedback_content_body", "qti"."test_feedback_title", "qti"."test_identifier", "qti"."test_part", "qti"."test_part_title", "qti"."test_reach", "qti"."test_rubric_block", "qti"."test_rubric_block_use", "qti"."test_rubric_content_body", "qti"."test_variables", "qti"."test_variables_base_type", "qti"."text_entry_expected_length", "qti"."text_entry_format", "qti"."text_entry_interaction", "qti"."text_entry_pattern_mask", "qti"."text_entry_patternmask_message", "qti"."text_entry_placeholder_text", "qti"."text_node", "qti"."tfoot", "qti"."th", "qti"."th_abbr", "qti"."th_align", "qti"."th_axis", "qti"."th_colspan", "qti"."th_rowspan", "qti"."th_scope", "qti"."th_valign", "qti"."thead", "qti"."time_limit_max", "qti"."time_limit_min", "qti"."time_limits", "qti"."tr", "qti"."track", "qti"."track_default", "qti"."track_srclang", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."truncate", "qti"."tt", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."ul", "qti"."upload_interaction", "qti"."upload_type", "qti"."usage_data", "qti"."usage_data_glossary", "qti"."usage_data_ref", "qti"."usage_map_entry", "qti"."usage_map_entry_case_sensitive", "qti"."usage_mapping", "qti"."usage_mapping_lower_bound", "qti"."usage_mapping_upper_bound", "qti"."usage_typed_value", "qti"."usage_typed_value_boolean", "qti"."usage_typed_value_directed_pair", "qti"."usage_typed_value_duration", "qti"."usage_typed_value_file", "qti"."usage_typed_value_float", "qti"."usage_typed_value_identifier", "qti"."usage_typed_value_integer", "qti"."usage_typed_value_pair", "qti"."usage_typed_value_point", "qti"."usage_typed_value_string", "qti"."usage_typed_value_uri", "qti"."usage_value", "qti"."usage_value_base_type", "qti"."usage_value_field_identifier", "qti"."value_set", "qti"."value_set_interpretation", "qti"."var", "qti"."variable", "qti"."variable_mapping", "qti"."variable_ref", "qti"."variable_weight_identifier", "qti"."variant", "qti"."variant_metadata", "qti"."video", "qti"."video_autoplay", "qti"."video_controls", "qti"."video_crossorigin", "qti"."video_height", "qti"."video_loop", "qti"."video_mediagroup", "qti"."video_muted", "qti"."video_poster", "qti"."video_preload", "qti"."video_src", "qti"."video_width", "qti"."weight", "qti"."wildcard_exclusion", "qti"."wildcard_host", "qti"."ws", "qti"."x_include", "qti"."x_include_accept", "qti"."x_include_accept_language", "qti"."x_include_encoding", "qti"."x_include_href", "qti"."x_include_parse", "qti"."x_include_xpointer", "qti"."xlink_actuate", "qti"."xlink_arcrole", "qti"."xlink_from", "qti"."xlink_href", "qti"."xlink_label", "qti"."xlink_role", "qti"."xlink_show", "qti"."xlink_title", "qti"."xlink_to", "qti"."xlink_type", "qti"."xsi_nil", "qti"."xsi_type", "qti"."xsi_type_attribute", "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."access_for_all_resource", "qti__author"."acronym", "qti__author"."adaptive_engine_ref", "qti__author"."adaptive_selection", "qti__author"."adaptive_settings_ref", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."and", "qti__author"."any_n", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."assessment_section", "qti__author"."assessment_stimulus", "qti__author"."assessment_test", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_exclusion", "qti__author"."attribute_file_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."attribute_spelling", "qti__author"."attribute_wildcard", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."branch_rule", "qti__author"."branch_rule_exit", "qti__author"."branch_rule_target", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."container_size", "qti__author"."contains", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_allow_comment", "qti__author"."declared_allow_late_submission", "qti__author"."declared_allow_review", "qti__author"."declared_allow_skipping", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_default_value", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_item_ref_fixed", "qti__author"."declared_item_ref_required", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_order_shuffle", "qti__author"."declared_ordering_shuffle", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_section_fixed", "qti__author"."declared_section_keep_together", "qti__author"."declared_section_required", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_feedback", "qti__author"."declared_show_hide", "qti__author"."declared_show_solution", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_substring", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_tolerance_mode", "qti__author"."declared_track_kind", "qti__author"."declared_validate_responses", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."declared_with_replacement", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."divide", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."document_xml_id", "qti__author"."drawing_interaction", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."dt", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_rounded_figures_ref", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."field_value", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."footer", "qti__author"."foreign_attribute", "qti__author"."foreign_element", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."gcd", "qti__author"."global_attribute", "qti__author"."global_element", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices_n", "qti__author"."gt", "qti__author"."gte", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."index_n_ref", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_instance_spelling", "qti__author"."item_instance_variable_ref", "qti__author"."item_ref", "qti__author"."item_ref_category", "qti__author"."item_ref_document", "qti__author"."item_ref_lti", "qti__author"."item_ref_resolution", "qti__author"."item_session_control", "qti__author"."item_session_max_attempts", "qti__author"."item_stimulus_ref", "qti__author"."item_stimulus_ref_title", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."item_variable_ref", "qti__author"."kbd", "qti__author"."label", "qti__author"."lcm", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."manifest_xml_id", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_selections_message", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."mathml_abs", "qti__author"."mathml_align", "qti__author"."mathml_alignmentscope", "qti__author"."mathml_altimg_valign", "qti__author"."mathml_and", "qti__author"."mathml_annotation", "qti__author"."mathml_annotation_xml", "qti__author"."mathml_apply", "qti__author"."mathml_approx", "qti__author"."mathml_arccos", "qti__author"."mathml_arccosh", "qti__author"."mathml_arccot", "qti__author"."mathml_arccoth", "qti__author"."mathml_arccsc", "qti__author"."mathml_arccsch", "qti__author"."mathml_arcsec", "qti__author"."mathml_arcsech", "qti__author"."mathml_arcsin", "qti__author"."mathml_arcsinh", "qti__author"."mathml_arctan", "qti__author"."mathml_arctanh", "qti__author"."mathml_arg", "qti__author"."mathml_attribute_type", "qti__author"."mathml_background", "qti__author"."mathml_base", "qti__author"."mathml_bind", "qti__author"."mathml_boolean", "qti__author"."mathml_bvar", "qti__author"."mathml_card", "qti__author"."mathml_cartesianproduct", "qti__author"."mathml_cbytes", "qti__author"."mathml_cd", "qti__author"."mathml_cdgroup", "qti__author"."mathml_ceiling", "qti__author"."mathml_cerror", "qti__author"."mathml_character", "qti__author"."mathml_charspacing", "qti__author"."mathml_ci", "qti__author"."mathml_class", "qti__author"."mathml_closure", "qti__author"."mathml_cn", "qti__author"."mathml_codomain", "qti__author"."mathml_color", "qti__author"."mathml_columnalign", "qti__author"."mathml_columnalignstyle", "qti__author"."mathml_columnwidth", "qti__author"."mathml_complexes", "qti__author"."mathml_compose", "qti__author"."mathml_condition", "qti__author"."mathml_conjugate", "qti__author"."mathml_cos", "qti__author"."mathml_cosh", "qti__author"."mathml_cot", "qti__author"."mathml_coth", "qti__author"."mathml_crossout", "qti__author"."mathml_cs", "qti__author"."mathml_csc", "qti__author"."mathml_csch", "qti__author"."mathml_csymbol", "qti__author"."mathml_curl", "qti__author"."mathml_declare", "qti__author"."mathml_definition_url", "qti__author"."mathml_degree", "qti__author"."mathml_determinant", "qti__author"."mathml_diff", "qti__author"."mathml_dir", "qti__author"."mathml_display", "qti__author"."mathml_divergence", "qti__author"."mathml_divide", "qti__author"."mathml_domain", "qti__author"."mathml_domainofapplication", "qti__author"."mathml_edge", "qti__author"."mathml_embed_source", "qti__author"."mathml_emptyset", "qti__author"."mathml_eq", "qti__author"."mathml_equivalent", "qti__author"."mathml_eulergamma", "qti__author"."mathml_exists", "qti__author"."mathml_exp", "qti__author"."mathml_exponentiale", "qti__author"."mathml_factorial", "qti__author"."mathml_factorof", "qti__author"."mathml_false", "qti__author"."mathml_floor", "qti__author"."mathml_fn", "qti__author"."mathml_fontstyle", "qti__author"."mathml_fontweight", "qti__author"."mathml_forall", "qti__author"."mathml_form", "qti__author"."mathml_framespacing", "qti__author"."mathml_gcd", "qti__author"."mathml_geq", "qti__author"."mathml_grad", "qti__author"."mathml_group_alignment", "qti__author"."mathml_group_alignment_list", "qti__author"."mathml_group_alignment_list_list", "qti__author"."mathml_gt", "qti__author"."mathml_href", "qti__author"."mathml_ident", "qti__author"."mathml_image", "qti__author"."mathml_imaginary", "qti__author"."mathml_imaginaryi", "qti__author"."mathml_implies", "qti__author"."mathml_in", "qti__author"."mathml_indentalign", "qti__author"."mathml_indentalign_line", "qti__author"."mathml_indentshift_line", "qti__author"."mathml_index", "qti__author"."mathml_infinity", "qti__author"."mathml_infixlinebreakstyle", "qti__author"."mathml_int", "qti__author"."mathml_integers", "qti__author"."mathml_intersect", "qti__author"."mathml_interval", "qti__author"."mathml_inverse", "qti__author"."mathml_lambda", "qti__author"."mathml_laplacian", "qti__author"."mathml_lcm", "qti__author"."mathml_length", "qti__author"."mathml_length_list", "qti__author"."mathml_leq", "qti__author"."mathml_limit", "qti__author"."mathml_line_thickness", "qti__author"."mathml_linebreak", "qti__author"."mathml_linebreakstyle", "qti__author"."mathml_linestyle", "qti__author"."mathml_linestyle_list", "qti__author"."mathml_list", "qti__author"."mathml_ln", "qti__author"."mathml_location", "qti__author"."mathml_log", "qti__author"."mathml_logbase", "qti__author"."mathml_longdivstyle", "qti__author"."mathml_lowlimit", "qti__author"."mathml_lt", "qti__author"."mathml_maction", "qti__author"."mathml_maligngroup", "qti__author"."mathml_malignmark", "qti__author"."mathml_math", "qti__author"."mathml_mathsize", "qti__author"."mathml_mathvariant", "qti__author"."mathml_matrix", "qti__author"."mathml_matrixrow", "qti__author"."mathml_max", "qti__author"."mathml_maxsize", "qti__author"."mathml_mean", "qti__author"."mathml_median", "qti__author"."mathml_menclose", "qti__author"."mathml_merror", "qti__author"."mathml_mfenced", "qti__author"."mathml_mfrac", "qti__author"."mathml_mglyph", "qti__author"."mathml_mi", "qti__author"."mathml_min", "qti__author"."mathml_minus", "qti__author"."mathml_mlabeledtr", "qti__author"."mathml_mlongdiv", "qti__author"."mathml_mmultiscripts", "qti__author"."mathml_mn", "qti__author"."mathml_mo", "qti__author"."mathml_mode", "qti__author"."mathml_moment", "qti__author"."mathml_momentabout", "qti__author"."mathml_mover", "qti__author"."mathml_mpadded", "qti__author"."mathml_mpadded_length", "qti__author"."mathml_mphantom", "qti__author"."mathml_mprescripts", "qti__author"."mathml_mroot", "qti__author"."mathml_mrow", "qti__author"."mathml_ms", "qti__author"."mathml_mscarries", "qti__author"."mathml_mscarry", "qti__author"."mathml_msgroup", "qti__author"."mathml_msline", "qti__author"."mathml_mspace", "qti__author"."mathml_mspace_linebreak", "qti__author"."mathml_msqrt", "qti__author"."mathml_msrow", "qti__author"."mathml_mstack", "qti__author"."mathml_mstyle", "qti__author"."mathml_msub", "qti__author"."mathml_msubsup", "qti__author"."mathml_msup", "qti__author"."mathml_mtable", "qti__author"."mathml_mtd", "qti__author"."mathml_mtext", "qti__author"."mathml_mtr", "qti__author"."mathml_munder", "qti__author"."mathml_munderover", "qti__author"."mathml_name", "qti__author"."mathml_nargs", "qti__author"."mathml_naturalnumbers", "qti__author"."mathml_neq", "qti__author"."mathml_none", "qti__author"."mathml_not", "qti__author"."mathml_notanumber", "qti__author"."mathml_notin", "qti__author"."mathml_notprsubset", "qti__author"."mathml_notsubset", "qti__author"."mathml_number", "qti__author"."mathml_occurrence", "qti__author"."mathml_or", "qti__author"."mathml_order", "qti__author"."mathml_otherwise", "qti__author"."mathml_outerproduct", "qti__author"."mathml_overflow", "qti__author"."mathml_partialdiff", "qti__author"."mathml_pi", "qti__author"."mathml_piece", "qti__author"."mathml_piecewise", "qti__author"."mathml_plus", "qti__author"."mathml_position", "qti__author"."mathml_power", "qti__author"."mathml_primes", "qti__author"."mathml_product", "qti__author"."mathml_prsubset", "qti__author"."mathml_quotient", "qti__author"."mathml_rationals", "qti__author"."mathml_real", "qti__author"."mathml_reals", "qti__author"."mathml_reln", "qti__author"."mathml_rem", "qti__author"."mathml_root", "qti__author"."mathml_rowalign", "qti__author"."mathml_scalarproduct", "qti__author"."mathml_scriptlevel", "qti__author"."mathml_sdev", "qti__author"."mathml_sec", "qti__author"."mathml_sech", "qti__author"."mathml_selection", "qti__author"."mathml_selector", "qti__author"."mathml_semantics", "qti__author"."mathml_semantics_ci", "qti__author"."mathml_sep", "qti__author"."mathml_set", "qti__author"."mathml_setdiff", "qti__author"."mathml_share", "qti__author"."mathml_shift", "qti__author"."mathml_side", "qti__author"."mathml_sin", "qti__author"."mathml_sinh", "qti__author"."mathml_span", "qti__author"."mathml_src", "qti__author"."mathml_string", "qti__author"."mathml_subset", "qti__author"."mathml_sum", "qti__author"."mathml_table_width", "qti__author"."mathml_tan", "qti__author"."mathml_tanh", "qti__author"."mathml_tendsto", "qti__author"."mathml_times", "qti__author"."mathml_transpose", "qti__author"."mathml_true", "qti__author"."mathml_union", "qti__author"."mathml_unsigned_integer", "qti__author"."mathml_uplimit", "qti__author"."mathml_variance", "qti__author"."mathml_vector", "qti__author"."mathml_vectorproduct", "qti__author"."mathml_verticalalign", "qti__author"."mathml_xor", "qti__author"."max", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."member", "qti__author"."metadata_ref", "qti__author"."min", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."no_namespace_schema_location", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."node_xml_space", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."ordered", "qti__author"."ordering", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."power", "qti__author"."pre", "qti__author"."pre_condition", "qti__author"."prefixed_built_in", "qti__author"."prefixed_declared", "qti__author"."prefixed_mapped", "qti__author"."prefixed_variable_source", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."product", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."repeat_number_repeats_ref", "qti__author"."required_child", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."root_schema_set", "qti__author"."round", "qti__author"."round_to", "qti__author"."round_to_figures_ref", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."rule_operand", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."section_duration_ref", "qti__author"."section_duration_target", "qti__author"."section_feedback_outcome_ref", "qti__author"."section_identifier_target", "qti__author"."section_printed_variable_ref", "qti__author"."section_printed_variable_var_ref", "qti__author"."section_ref", "qti__author"."section_ref_resolution", "qti__author"."section_variable_declared", "qti__author"."section_variable_duration", "qti__author"."section_variable_prefixed", "qti__author"."section_variable_ref", "qti__author"."section_variable_resolution", "qti__author"."select_point_interaction", "qti__author"."selection", "qti__author"."selection_bounded", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."stimulus_body", "qti__author"."stimulus_ref_resolution", "qti__author"."string_binding", "qti__author"."string_match", "qti__author"."strong", "qti__author"."structure_child", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_default", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_feedback_block", "qti__author"."template_if_arm", "qti__author"."template_inline", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_document", "qti__author"."test_feedback", "qti__author"."test_feedback_content_body", "qti__author"."test_feedback_title", "qti__author"."test_identifier", "qti__author"."test_part", "qti__author"."test_part_title", "qti__author"."test_reach", "qti__author"."test_rubric_block", "qti__author"."test_rubric_block_use", "qti__author"."test_rubric_content_body", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."time_limit_max", "qti__author"."time_limit_min", "qti__author"."time_limits", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_data_ref", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."weight", "qti__author"."wildcard_exclusion", "qti__author"."wildcard_host", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer", "qti__author"."xlink_actuate", "qti__author"."xlink_arcrole", "qti__author"."xlink_from", "qti__author"."xlink_href", "qti__author"."xlink_label", "qti__author"."xlink_role", "qti__author"."xlink_show", "qti__author"."xlink_title", "qti__author"."xlink_to", "qti__author"."xlink_type", "qti__author"."xsi_nil", "qti__author"."xsi_type", "qti__author"."xsi_type_attribute" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."ancestry", "qti"."aria_autocomplete_value", "qti"."aria_current_value", "qti"."aria_invalid_value", "qti"."aria_live_value", "qti"."aria_orientation_value", "qti"."aria_role_value", "qti"."aria_sort_value", "qti"."aria_tristate", "qti"."aria_true_false_undefined", "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."boolean_literal", "qti"."bound", "qti"."branch_exit", "qti"."branch_target", "qti"."built_in", "qti"."cell_align", "qti"."cell_scope", "qti"."cell_valign", "qti"."cp_schema", "qti"."cross_origin", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."external_scored", "qti"."id_holder", "qti"."idref_attribute", "qti"."item_ref_target", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."math_constant_name", "qti"."math_operator_name", "qti"."mathml_boolean_value", "qti"."mathml_closure_value", "qti"."mathml_columnalignstyle_value", "qti"."mathml_dir_value", "qti"."mathml_display_value", "qti"."mathml_edge_value", "qti"."mathml_fontstyle_value", "qti"."mathml_fontweight_value", "qti"."mathml_form_value", "qti"."mathml_group_alignment_value", "qti"."mathml_indentalign_line_value", "qti"."mathml_indentalign_value", "qti"."mathml_infixlinebreakstyle_value", "qti"."mathml_linebreak_value", "qti"."mathml_linebreakstyle_value", "qti"."mathml_linestyle_value", "qti"."mathml_location_value", "qti"."mathml_longdivstyle_value", "qti"."mathml_mathvariant_value", "qti"."mathml_mspace_linebreak_value", "qti"."mathml_occurrence_value", "qti"."mathml_order_value", "qti"."mathml_overflow_value", "qti"."mathml_side_value", "qti"."mathml_value_type", "qti"."mathml_verticalalign_value", "qti"."media_autoplay", "qti"."media_controls", "qti"."media_loop", "qti"."media_muted", "qti"."media_preload", "qti"."misc_kind", "qti"."namespace_policy", "qti"."navigation_mode", "qti"."node_kind", "qti"."orientation", "qti"."param_valuetype", "qti"."placement", "qti"."prefixed_source", "qti"."printed_variable_attr", "qti"."process_contents", "qti"."qmd_feedback_type_value", "qti"."qmd_interaction_type_value", "qti"."qmd_scoring_mode_value", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."rounding_mode", "qti"."schema_namespace", "qti"."schema_set", "qti"."schema_version", "qti"."section_variable_target", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."statistic_kind", "qti"."stats_operator_name", "qti"."structure_holder", "qti"."submission_mode", "qti"."suppress_tts_mode", "qti"."target_object_type", "qti"."test_feedback_access", "qti"."text_direction", "qti"."text_format", "qti"."tolerance_mode", "qti"."tool_shape", "qti"."track_default_value", "qti"."track_kind", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."x_include_parse_value", "qti"."xlink_actuate_value", "qti"."xlink_show_value", "qti"."xlink_type_value", "qti"."xml_space", "qti"."xs_boolean", "qti"."yes_no" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_tmjud3n2tg", "qti"."__text_saolosnhkp", "qti"."__text_fgbxwprcwx", "qti"."__text_rhdrzkabze", "qti"."__text_raisrajgpi", "qti"."__text_kqeswaav46", "qti"."__text_hv3bw3mdte", "qti"."__text_bvx3fqniye", "qti"."__text_gm4clqaaza", "qti"."__text_acxfo763jg", "qti"."__text_5lyuoloiou", "qti"."__text_tyjqwtj7ky", "qti"."__text_o3e7dedzyv", "qti"."__text_2dix7luqoi", "qti"."__text_sa4c4ywp5v", "qti"."__text_2rz6hgcvt2", "qti"."__text_4adkkv4wal", "qti"."__text_xarz6cej2e", "qti"."__text_lsy6pxooea", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ukaaxf45sk", "qti"."__text_vtz3bnghkc", "qti"."__text_xs56r6cx4y", "qti"."__text_tso7kvy6dv", "qti"."__text_httzcaefcn", "qti"."__text_7mulu52tr6", "qti"."__text_osqmo2ktsg", "qti"."__text_ieskz75v7g", "qti"."__text_yyhgrftqjx", "qti"."__text_x4ovwk3uop", "qti"."__text_nx57zic2sr", "qti"."__text_oc36elqfmy", "qti"."__text_hubjq5m7kx", "qti"."__text_j6r7doraiw", "qti"."__text_jfksd4nu5r", "qti"."__text_vpd3gbdfhl", "qti"."__text_r5z7lvpd56", "qti"."__text_623scqhhre", "qti"."__text_q57lslnkle", "qti"."__text_cfvofy6jst", "qti"."__text_oxgrhofw2c", "qti"."__text_vwyq7r3dau", "qti"."__text_jruckr5nmf", "qti"."__text_xusnuddb4k", "qti"."__text_i7djrwbb7n", "qti"."__text_fywgikzrwf", "qti"."__text_o4z6v6eurt", "qti"."__text_6ifjn7x3qm", "qti"."__text_7mihpbbens", "qti"."__text_vrj3u337cv", "qti"."__text_7dlsmkhhat", "qti"."__text_okcvipkynh", "qti"."__text_64ulvvuteh", "qti"."__text_mlv3bwkpew", "qti"."__text_h4r6alp6hk", "qti"."__text_awt4t5kosa", "qti"."__text_wuvwyowttn", "qti"."__text_kcydnvglpj", "qti"."__text_gjl5q4ofup", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_r5xluaej3z", "qti"."__text_oy4m3tqgfd", "qti"."__text_ottycep7en", "qti"."access_mode", "qti"."access_mode_adapted", "qti"."adaptive_ref_href", "qti"."adaptive_ref_identifier", "qti"."aria_integer", "qti"."aria_positive_integer", "qti"."case_item_uri", "qti"."category_list", "qti"."choice_count", "qti"."choice_identifier", "qti"."citation_uri", "qti"."class_list", "qti"."container_width", "qti"."content_language", "qti"."content_media_type", "qti"."custom_operator_class_name", "qti"."custom_operator_definition_uri", "qti"."declared_directed_pair_value", "qti"."declared_duration_value", "qti"."declared_float_value", "qti"."declared_identifier_value", "qti"."declared_integer_value", "qti"."declared_pair_value", "qti"."declared_point_value", "qti"."declared_uri_value", "qti"."drd_adaptation_uri", "qti"."embed_source_uri", "qti"."expected_length", "qti"."expected_lines", "qti"."expression_coords", "qti"."expression_integer_or_variable", "qti"."file_media_type", "qti"."glossary_uri", "qti"."hyperlink_uri", "qti"."id_reference", "qti"."interpolation_default_directed_pair_value", "qti"."interpolation_default_duration_value", "qti"."interpolation_default_float_value", "qti"."interpolation_default_identifier_value", "qti"."interpolation_default_integer_value", "qti"."interpolation_default_pair_value", "qti"."interpolation_default_point_value", "qti"."interpolation_default_uri_value", "qti"."interpolation_source_value", "qti"."interpolation_target_directed_pair_value", "qti"."interpolation_target_duration_value", "qti"."interpolation_target_float_value", "qti"."interpolation_target_identifier_value", "qti"."interpolation_target_integer_value", "qti"."interpolation_target_pair_value", "qti"."interpolation_target_point_value", "qti"."interpolation_target_uri_value", "qti"."item_ref_href", "qti"."lang_string_language", "qti"."literal_directed_pair_value", "qti"."literal_duration_value", "qti"."literal_float_value", "qti"."literal_identifier_value", "qti"."literal_integer_value", "qti"."literal_pair_value", "qti"."literal_point_value", "qti"."literal_uri_value", "qti"."lom_token", "qti"."lom_vocabulary_source", "qti"."lom_vocabulary_value", "qti"."long_description_uri", "qti"."long_interpretation_uri", "qti"."manifest_identifier", "qti"."map_key_directed_pair_value", "qti"."map_key_duration_value", "qti"."map_key_float_value", "qti"."map_key_identifier_value", "qti"."map_key_integer_value", "qti"."map_key_pair_value", "qti"."map_key_point_value", "qti"."map_key_uri_value", "qti"."mapped_variable_name", "qti"."mapping_score", "qti"."match_default_directed_pair_value", "qti"."match_default_duration_value", "qti"."match_default_float_value", "qti"."match_default_identifier_value", "qti"."match_default_integer_value", "qti"."match_default_pair_value", "qti"."match_default_point_value", "qti"."match_default_uri_value", "qti"."match_group_list", "qti"."match_source_value", "qti"."match_target_directed_pair_value", "qti"."match_target_duration_value", "qti"."match_target_float_value", "qti"."match_target_identifier_value", "qti"."match_target_integer_value", "qti"."match_target_pair_value", "qti"."match_target_point_value", "qti"."match_target_uri_value", "qti"."mathml_base_value", "qti"."mathml_cbytes_value", "qti"."mathml_cd_value", "qti"."mathml_cdgroup_value", "qti"."mathml_definition_url_value", "qti"."mathml_index_value", "qti"."mathml_name_value", "qti"."mathml_nargs_value", "qti"."mathml_position_value", "qti"."mathml_scriptlevel_value", "qti"."mathml_selection_value", "qti"."mathml_shift_value", "qti"."mathml_span_value", "qti"."mathml_src_value", "qti"."media_rect_coords", "qti"."namespace_prefix", "qti"."namespace_uri", "qti"."outcome_scale_value", "qti"."package_path", "qti"."pi_target", "qti"."printed_variable_integer_or_variable", "qti"."record_field_identifier", "qti"."rect_coords", "qti"."resource_entry_href", "qti"."section_ref_href", "qti"."shape_coords", "qti"."show_hide_identifier", "qti"."slider_bound", "qti"."statistic_context_uri", "qti"."statistic_measure", "qti"."statistic_name", "qti"."stimulus_ref_href", "qti"."stimulus_ref_identifier", "qti"."string_count", "qti"."stylesheet_uri", "qti"."table_span", "qti"."template_location_uri", "qti"."template_parameter_name", "qti"."template_uri", "qti"."test_structure_identifier", "qti"."time_limit_seconds", "qti"."tool_name", "qti"."tool_vendor", "qti"."tool_version", "qti"."track_language", "qti"."usage_case_count", "qti"."usage_directed_pair_value", "qti"."usage_duration_value", "qti"."usage_field_identifier", "qti"."usage_float_value", "qti"."usage_identifier_value", "qti"."usage_integer_value", "qti"."usage_mapping_score", "qti"."usage_pair_value", "qti"."usage_part_identifier", "qti"."usage_point_value", "qti"."usage_uri_value", "qti"."usage_value_token", "qti"."variable_reference", "qti"."weight_reference", "qti"."weight_value", "qti"."x_include_uri", "qti"."xlink_arcrole_uri", "qti"."xlink_href_uri", "qti"."xlink_label_name", "qti"."xlink_role_uri", "qti"."xml_base_uri", "qti"."xml_entity_name", "qti"."xml_local_name" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

COMMENT ON DOMAIN "qti"."__text_fywgikzrwf" IS 'text pattern 007c6ff4faa07a47e87ee30741600aad8c92cb6c9f4ee16ae959390a61dc3712';

COMMENT ON DOMAIN "qti"."__text_i7djrwbb7n" IS 'text pattern 14ed94e6fe177a51a169958906abf934a3c74f0f681a1199ea52794faf88df2f';

COMMENT ON DOMAIN "qti"."__text_xusnuddb4k" IS 'text pattern 23a8e6b1941c76aada601d6bbf9515d562c2d71a328d385fd783a29262b81345';

COMMENT ON DOMAIN "qti"."__text_jfksd4nu5r" IS 'text pattern 2ebf08ee9768997d75fcd54757739f65f1887a5538f5e4b4c6dbef757e586693';

COMMENT ON DOMAIN "qti"."__text_oxgrhofw2c" IS 'text pattern 3488ef57431d01c406f12db735331e7badc878d728c3876e14b12dbbc7e39cca';

COMMENT ON DOMAIN "qti"."__text_7dlsmkhhat" IS 'text pattern 40069117edaaad50646f30d1ee18dc4b16070d2bb97910f4de58994ca2388441';

COMMENT ON DOMAIN "qti"."__text_jruckr5nmf" IS 'text pattern 4abbb241778c0bfc93cae07756c9cbfff1bbd13178fee90dffd97cb779b996cd';

COMMENT ON DOMAIN "qti"."__text_623scqhhre" IS 'text pattern 4b8aee528dde5f0b85052964215471138f09ceb41fed3b2f5affd10b564a608f';

COMMENT ON DOMAIN "qti"."__text_64ulvvuteh" IS 'text pattern 4c90fc688e89d9f737f81323a38d766a241e2ca7313b5580de7d07f4fc99fcfd';

COMMENT ON DOMAIN "qti"."__text_x4ovwk3uop" IS 'text pattern 5701cab7fbc51bb2bfa524ba4a6ab338c1c48822f60b0b011ad102aa7d202be7';

COMMENT ON DOMAIN "qti"."__text_oc36elqfmy" IS 'text pattern 5c2ff63d84b9e18680c03df10fc9b675b7dc5d8f52642604eb8d1410439d5244';

COMMENT ON DOMAIN "qti"."__text_o4z6v6eurt" IS 'text pattern 663be21bff6aa96bf2744437685d2e3c05697de4df756db6403f900e99dd92c6';

COMMENT ON DOMAIN "qti"."__text_okcvipkynh" IS 'text pattern 78e1c93ab8a6f3bdc2c248b5453005089c40e9d2c670b325cbc43261cbfc040a';

COMMENT ON DOMAIN "qti"."__text_nx57zic2sr" IS 'text pattern 7b5440389686bf8f5777572309dccc5b9262a20381a4a88156ca985f5eb57632';

COMMENT ON DOMAIN "qti"."__text_j6r7doraiw" IS 'text pattern 84dcc0d00c39e92e95d95380e563d39904fe62b2457de8d732990ba4600320d1';

COMMENT ON DOMAIN "qti"."__text_vrj3u337cv" IS 'text pattern 87583cfd3d4f17a5b8185a3572a773bbe50f5f81521903e869664fc9f0bba2e2';

COMMENT ON DOMAIN "qti"."__text_6ifjn7x3qm" IS 'text pattern 938bbbd5913bce121ccd7d8c995e9227c6d868464618329d932768d0cae4f8f7';

COMMENT ON DOMAIN "qti"."__text_vpd3gbdfhl" IS 'text pattern 93de6f237b0d78873a4a6ae75c1f75f1a496a171c71608a56497ca0de7187b2a';

COMMENT ON DOMAIN "qti"."__text_7mihpbbens" IS 'text pattern 9cb0270f02c30135741698064f024dab7cd8e2a915d946bddaa32ed0c2f440c8';

COMMENT ON DOMAIN "qti"."__text_r5z7lvpd56" IS 'text pattern b245e69f17d1907b0ec4c923bdbe455f7fd0dd9a78e8a0fdbdf430a1c0a63a5a';

COMMENT ON DOMAIN "qti"."__text_hubjq5m7kx" IS 'text pattern b76de8716cd535b522106da4d6a71f08a85ece4466dc996aaaf554971655ee85';

COMMENT ON DOMAIN "qti"."__text_cfvofy6jst" IS 'text pattern ba6316d23f566ce4ce16e2d62233ba526bbc6f819c8159eb3aec698b120f01f2';

COMMENT ON DOMAIN "qti"."__text_yyhgrftqjx" IS 'text pattern c33b088350ffa749d9a3f586b9dc50e20037210754e023e83c179d03f5c59983';

COMMENT ON DOMAIN "qti"."__text_vwyq7r3dau" IS 'text pattern e6bfbe14f638b9380f4c36af949fe4ec119f926cf1ef5723b28ee508cdf18dd4';

COMMENT ON DOMAIN "qti"."__text_mlv3bwkpew" IS 'text pattern f44ed9621bba8104564512a4f047b3c6204c647ff50f65e6356c0c7ef8290a5d';

COMMENT ON DOMAIN "qti"."__text_q57lslnkle" IS 'text pattern fcbaa75164d3a3364548090e0d008edec3f2ea548e049c0affcd53e45ff0844a';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_abs_in_mathml_abs_wnimfmf5xj"() IS 'function of law Node(id) where kind = m:abs in MathmlAbs(id), a mirrors half on MathmlAbs for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_abs_in_mathml_abs_phhfgd3rlf"() IS 'function of law Node(id) where kind = m:abs in MathmlAbs(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_and_in_mathml_and_efc7zb43jj"() IS 'function of law Node(id) where kind = m:and in MathmlAnd(id), a mirrors half on MathmlAnd for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_and_in_mathml_and_hexokgyiv3"() IS 'function of law Node(id) where kind = m:and in MathmlAnd(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_annotation_in_mathml_annotation_gfrncqy3wp"() IS 'function of law Node(id) where kind = m:annotation in MathmlAnnotation(id), a mirrors half on MathmlAnnotation for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_annotation_in_mathml_annotation_wmbdxmkskd"() IS 'function of law Node(id) where kind = m:annotation in MathmlAnnotation(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_annotation_xml_in_mathml_vd6t7c7dzt"() IS 'function of law Node(id) where kind = m:annotation-xml in MathmlAnnotationXml(id), a mirrors half on MathmlAnnotationXml for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_annotation_xml_in_mathml_7ucbb6vgja"() IS 'function of law Node(id) where kind = m:annotation-xml in MathmlAnnotationXml(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_apply_in_mathml_apply_mmpuv5omwz"() IS 'function of law Node(id) where kind = m:apply in MathmlApply(id), a mirrors half on MathmlApply for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_apply_in_mathml_apply_uxzqzbcauc"() IS 'function of law Node(id) where kind = m:apply in MathmlApply(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_approx_in_mathml_approx_jyzn7e4nbs"() IS 'function of law Node(id) where kind = m:approx in MathmlApprox(id), a mirrors half on MathmlApprox for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_approx_in_mathml_approx_l5epo5bvic"() IS 'function of law Node(id) where kind = m:approx in MathmlApprox(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccos_in_mathml_arccos_7o47a6qudc"() IS 'function of law Node(id) where kind = m:arccos in MathmlArccos(id), a mirrors half on MathmlArccos for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccos_in_mathml_arccos_6qljhtq5oi"() IS 'function of law Node(id) where kind = m:arccos in MathmlArccos(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccosh_in_mathml_arccosh_zrh5rvct36"() IS 'function of law Node(id) where kind = m:arccosh in MathmlArccosh(id), a mirrors half on MathmlArccosh for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccosh_in_mathml_arccosh_5ps6gazwdh"() IS 'function of law Node(id) where kind = m:arccosh in MathmlArccosh(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccot_in_mathml_arccot_7kocm2baq5"() IS 'function of law Node(id) where kind = m:arccot in MathmlArccot(id), a mirrors half on MathmlArccot for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccot_in_mathml_arccot_mj57dg36zq"() IS 'function of law Node(id) where kind = m:arccot in MathmlArccot(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccoth_in_mathml_arccoth_zdbpmniwzo"() IS 'function of law Node(id) where kind = m:arccoth in MathmlArccoth(id), a mirrors half on MathmlArccoth for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccoth_in_mathml_arccoth_yvzrjzk6bq"() IS 'function of law Node(id) where kind = m:arccoth in MathmlArccoth(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccsc_in_mathml_arccsc_yp3bvacetd"() IS 'function of law Node(id) where kind = m:arccsc in MathmlArccsc(id), a mirrors half on MathmlArccsc for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccsc_in_mathml_arccsc_3o2wmioa2z"() IS 'function of law Node(id) where kind = m:arccsc in MathmlArccsc(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccsch_in_mathml_arccsch_k62lxmbcvp"() IS 'function of law Node(id) where kind = m:arccsch in MathmlArccsch(id), a mirrors half on MathmlArccsch for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arccsch_in_mathml_arccsch_a6ggxupzrt"() IS 'function of law Node(id) where kind = m:arccsch in MathmlArccsch(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsec_in_mathml_arcsec_ypo6vngd6k"() IS 'function of law Node(id) where kind = m:arcsec in MathmlArcsec(id), a mirrors half on MathmlArcsec for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsec_in_mathml_arcsec_jbw7bmiz5p"() IS 'function of law Node(id) where kind = m:arcsec in MathmlArcsec(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsech_in_mathml_arcsech_ihkmywlsig"() IS 'function of law Node(id) where kind = m:arcsech in MathmlArcsech(id), a mirrors half on MathmlArcsech for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsech_in_mathml_arcsech_vnflck6nix"() IS 'function of law Node(id) where kind = m:arcsech in MathmlArcsech(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsin_in_mathml_arcsin_zrxhi4nzi2"() IS 'function of law Node(id) where kind = m:arcsin in MathmlArcsin(id), a mirrors half on MathmlArcsin for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsin_in_mathml_arcsin_zkgq3y7uk4"() IS 'function of law Node(id) where kind = m:arcsin in MathmlArcsin(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsinh_in_mathml_arcsinh_bpxss7ig4q"() IS 'function of law Node(id) where kind = m:arcsinh in MathmlArcsinh(id), a mirrors half on MathmlArcsinh for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arcsinh_in_mathml_arcsinh_abqutofrj5"() IS 'function of law Node(id) where kind = m:arcsinh in MathmlArcsinh(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arctan_in_mathml_arctan_mditeplqp5"() IS 'function of law Node(id) where kind = m:arctan in MathmlArctan(id), a mirrors half on MathmlArctan for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arctan_in_mathml_arctan_r4j4un7ab6"() IS 'function of law Node(id) where kind = m:arctan in MathmlArctan(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arctanh_in_mathml_arctanh_zun3goqorf"() IS 'function of law Node(id) where kind = m:arctanh in MathmlArctanh(id), a mirrors half on MathmlArctanh for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arctanh_in_mathml_arctanh_z6jujoyvoy"() IS 'function of law Node(id) where kind = m:arctanh in MathmlArctanh(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arg_in_mathml_arg_ogsn4dhkpk"() IS 'function of law Node(id) where kind = m:arg in MathmlArg(id), a mirrors half on MathmlArg for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_arg_in_mathml_arg_gh7xe4znob"() IS 'function of law Node(id) where kind = m:arg in MathmlArg(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_bind_in_mathml_bind_b3cp66clgl"() IS 'function of law Node(id) where kind = m:bind in MathmlBind(id), a mirrors half on MathmlBind for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_bind_in_mathml_bind_der4iuxloo"() IS 'function of law Node(id) where kind = m:bind in MathmlBind(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_bvar_in_mathml_bvar_itzpqdl4ns"() IS 'function of law Node(id) where kind = m:bvar in MathmlBvar(id), a mirrors half on MathmlBvar for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_bvar_in_mathml_bvar_7h72ztoqh3"() IS 'function of law Node(id) where kind = m:bvar in MathmlBvar(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_card_in_mathml_card_n4ngb5rtns"() IS 'function of law Node(id) where kind = m:card in MathmlCard(id), a mirrors half on MathmlCard for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_card_in_mathml_card_mv6xwnapzs"() IS 'function of law Node(id) where kind = m:card in MathmlCard(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cartesianproduct_in_mathml_c53rrlpbrf"() IS 'function of law Node(id) where kind = m:cartesianproduct in MathmlCartesianproduct(id), a mirrors half on MathmlCartesianproduct for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cartesianproduct_in_mathml_mww3s7qvyq"() IS 'function of law Node(id) where kind = m:cartesianproduct in MathmlCartesianproduct(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cbytes_in_mathml_cbytes_44pwfydvav"() IS 'function of law Node(id) where kind = m:cbytes in MathmlCbytes(id), a mirrors half on MathmlCbytes for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cbytes_in_mathml_cbytes_auxmcysj33"() IS 'function of law Node(id) where kind = m:cbytes in MathmlCbytes(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ceiling_in_mathml_ceiling_myph62kdnp"() IS 'function of law Node(id) where kind = m:ceiling in MathmlCeiling(id), a mirrors half on MathmlCeiling for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ceiling_in_mathml_ceiling_6pgdsed2bj"() IS 'function of law Node(id) where kind = m:ceiling in MathmlCeiling(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cerror_in_mathml_cerror_bmyriovgw5"() IS 'function of law Node(id) where kind = m:cerror in MathmlCerror(id), a mirrors half on MathmlCerror for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cerror_in_mathml_cerror_riqxliqbwi"() IS 'function of law Node(id) where kind = m:cerror in MathmlCerror(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ci_in_mathml_ci_7wnevhlra5"() IS 'function of law Node(id) where kind = m:ci in MathmlCi(id), a mirrors half on MathmlCi for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ci_in_mathml_ci_ex5vhxqr6x"() IS 'function of law Node(id) where kind = m:ci in MathmlCi(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cn_in_mathml_cn_7zdakkkubi"() IS 'function of law Node(id) where kind = m:cn in MathmlCn(id), a mirrors half on MathmlCn for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cn_in_mathml_cn_zsd6vj5udu"() IS 'function of law Node(id) where kind = m:cn in MathmlCn(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_codomain_in_mathml_codomain_7534bkqyqg"() IS 'function of law Node(id) where kind = m:codomain in MathmlCodomain(id), a mirrors half on MathmlCodomain for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_codomain_in_mathml_codomain_jjwbrvsswe"() IS 'function of law Node(id) where kind = m:codomain in MathmlCodomain(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_complexes_in_mathml_complexes_smxvjooxlg"() IS 'function of law Node(id) where kind = m:complexes in MathmlComplexes(id), a mirrors half on MathmlComplexes for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_complexes_in_mathml_complexes_2gprbalrfe"() IS 'function of law Node(id) where kind = m:complexes in MathmlComplexes(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_compose_in_mathml_compose_ofuqi4pfrv"() IS 'function of law Node(id) where kind = m:compose in MathmlCompose(id), a mirrors half on MathmlCompose for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_compose_in_mathml_compose_jp6xalntsr"() IS 'function of law Node(id) where kind = m:compose in MathmlCompose(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_condition_in_mathml_condition_bkmskarigv"() IS 'function of law Node(id) where kind = m:condition in MathmlCondition(id), a mirrors half on MathmlCondition for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_condition_in_mathml_condition_qiyepccvft"() IS 'function of law Node(id) where kind = m:condition in MathmlCondition(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_conjugate_in_mathml_conjugate_2qaomdorgp"() IS 'function of law Node(id) where kind = m:conjugate in MathmlConjugate(id), a mirrors half on MathmlConjugate for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_conjugate_in_mathml_conjugate_nqpf2ymo5m"() IS 'function of law Node(id) where kind = m:conjugate in MathmlConjugate(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cos_in_mathml_cos_gyezavw3dv"() IS 'function of law Node(id) where kind = m:cos in MathmlCos(id), a mirrors half on MathmlCos for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cos_in_mathml_cos_54dyvj7yc6"() IS 'function of law Node(id) where kind = m:cos in MathmlCos(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cosh_in_mathml_cosh_vij6ivcizn"() IS 'function of law Node(id) where kind = m:cosh in MathmlCosh(id), a mirrors half on MathmlCosh for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cosh_in_mathml_cosh_g4ddlr3q3u"() IS 'function of law Node(id) where kind = m:cosh in MathmlCosh(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cot_in_mathml_cot_bm7vikofod"() IS 'function of law Node(id) where kind = m:cot in MathmlCot(id), a mirrors half on MathmlCot for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cot_in_mathml_cot_p66nrcwn7z"() IS 'function of law Node(id) where kind = m:cot in MathmlCot(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_coth_in_mathml_coth_o7gkb3toz7"() IS 'function of law Node(id) where kind = m:coth in MathmlCoth(id), a mirrors half on MathmlCoth for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_coth_in_mathml_coth_lxi33mmhoa"() IS 'function of law Node(id) where kind = m:coth in MathmlCoth(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cs_in_mathml_cs_hxledmgqbw"() IS 'function of law Node(id) where kind = m:cs in MathmlCs(id), a mirrors half on MathmlCs for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_cs_in_mathml_cs_nscn4tn6cr"() IS 'function of law Node(id) where kind = m:cs in MathmlCs(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_csc_in_mathml_csc_6d5ujiyag3"() IS 'function of law Node(id) where kind = m:csc in MathmlCsc(id), a mirrors half on MathmlCsc for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_csc_in_mathml_csc_dwzfgnd6ia"() IS 'function of law Node(id) where kind = m:csc in MathmlCsc(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_csch_in_mathml_csch_hqpjnljdsj"() IS 'function of law Node(id) where kind = m:csch in MathmlCsch(id), a mirrors half on MathmlCsch for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_csch_in_mathml_csch_zlcslou4jf"() IS 'function of law Node(id) where kind = m:csch in MathmlCsch(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_csymbol_in_mathml_csymbol_pnszy6ogw6"() IS 'function of law Node(id) where kind = m:csymbol in MathmlCsymbol(id), a mirrors half on MathmlCsymbol for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_csymbol_in_mathml_csymbol_dauoyyuvhp"() IS 'function of law Node(id) where kind = m:csymbol in MathmlCsymbol(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_curl_in_mathml_curl_gqs3jf33wk"() IS 'function of law Node(id) where kind = m:curl in MathmlCurl(id), a mirrors half on MathmlCurl for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_curl_in_mathml_curl_353eht56n5"() IS 'function of law Node(id) where kind = m:curl in MathmlCurl(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_declare_in_mathml_declare_xc23sm7f3q"() IS 'function of law Node(id) where kind = m:declare in MathmlDeclare(id), a mirrors half on MathmlDeclare for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_declare_in_mathml_declare_aklpjcb34q"() IS 'function of law Node(id) where kind = m:declare in MathmlDeclare(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_degree_in_mathml_degree_veflbklmfp"() IS 'function of law Node(id) where kind = m:degree in MathmlDegree(id), a mirrors half on MathmlDegree for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_degree_in_mathml_degree_vczza7lkyi"() IS 'function of law Node(id) where kind = m:degree in MathmlDegree(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_determinant_in_mathml_determinant_7dsbieuskc"() IS 'function of law Node(id) where kind = m:determinant in MathmlDeterminant(id), a mirrors half on MathmlDeterminant for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_determinant_in_mathml_determinant_zvepqi6zyw"() IS 'function of law Node(id) where kind = m:determinant in MathmlDeterminant(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_diff_in_mathml_diff_x2egxb7rq7"() IS 'function of law Node(id) where kind = m:diff in MathmlDiff(id), a mirrors half on MathmlDiff for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_diff_in_mathml_diff_pdndggndcg"() IS 'function of law Node(id) where kind = m:diff in MathmlDiff(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_divergence_in_mathml_divergence_uehhaasz4p"() IS 'function of law Node(id) where kind = m:divergence in MathmlDivergence(id), a mirrors half on MathmlDivergence for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_divergence_in_mathml_divergence_gi5ywod6ss"() IS 'function of law Node(id) where kind = m:divergence in MathmlDivergence(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_divide_in_mathml_divide_t6i7rr3buf"() IS 'function of law Node(id) where kind = m:divide in MathmlDivide(id), a mirrors half on MathmlDivide for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_divide_in_mathml_divide_7tnpyalfyl"() IS 'function of law Node(id) where kind = m:divide in MathmlDivide(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_domain_in_mathml_domain_qf7wn2mvjc"() IS 'function of law Node(id) where kind = m:domain in MathmlDomain(id), a mirrors half on MathmlDomain for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_domain_in_mathml_domain_2is4ywqll3"() IS 'function of law Node(id) where kind = m:domain in MathmlDomain(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_domainofapplication_in_mathml_zhhlyjdicf"() IS 'function of law Node(id) where kind = m:domainofapplication in MathmlDomainofapplication(id), a mirrors half on MathmlDomainofapplication for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_domainofapplication_in_mathml_kcky6mwg23"() IS 'function of law Node(id) where kind = m:domainofapplication in MathmlDomainofapplication(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_emptyset_in_mathml_emptyset_fxhqduiaa6"() IS 'function of law Node(id) where kind = m:emptyset in MathmlEmptyset(id), a mirrors half on MathmlEmptyset for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_emptyset_in_mathml_emptyset_rjz5v2zkuz"() IS 'function of law Node(id) where kind = m:emptyset in MathmlEmptyset(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_eq_in_mathml_eq_xdn3po5v4i"() IS 'function of law Node(id) where kind = m:eq in MathmlEq(id), a mirrors half on MathmlEq for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_eq_in_mathml_eq_olksvifh5q"() IS 'function of law Node(id) where kind = m:eq in MathmlEq(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_equivalent_in_mathml_equivalent_tn2mtrymp5"() IS 'function of law Node(id) where kind = m:equivalent in MathmlEquivalent(id), a mirrors half on MathmlEquivalent for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_equivalent_in_mathml_equivalent_gr4vugdern"() IS 'function of law Node(id) where kind = m:equivalent in MathmlEquivalent(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_eulergamma_in_mathml_eulergamma_r3w5sagkq3"() IS 'function of law Node(id) where kind = m:eulergamma in MathmlEulergamma(id), a mirrors half on MathmlEulergamma for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_eulergamma_in_mathml_eulergamma_3mz5tgfxvf"() IS 'function of law Node(id) where kind = m:eulergamma in MathmlEulergamma(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_exists_in_mathml_exists_zjcuggsn3t"() IS 'function of law Node(id) where kind = m:exists in MathmlExists(id), a mirrors half on MathmlExists for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_exists_in_mathml_exists_yuz54owcko"() IS 'function of law Node(id) where kind = m:exists in MathmlExists(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_exp_in_mathml_exp_7spjr4loir"() IS 'function of law Node(id) where kind = m:exp in MathmlExp(id), a mirrors half on MathmlExp for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_exp_in_mathml_exp_mldl5fvysi"() IS 'function of law Node(id) where kind = m:exp in MathmlExp(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_exponentiale_in_mathml_isodzrqry5"() IS 'function of law Node(id) where kind = m:exponentiale in MathmlExponentiale(id), a mirrors half on MathmlExponentiale for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_exponentiale_in_mathml_vw3j43xg2j"() IS 'function of law Node(id) where kind = m:exponentiale in MathmlExponentiale(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_factorial_in_mathml_factorial_j5rkj6np6u"() IS 'function of law Node(id) where kind = m:factorial in MathmlFactorial(id), a mirrors half on MathmlFactorial for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_factorial_in_mathml_factorial_lxfrzeymqy"() IS 'function of law Node(id) where kind = m:factorial in MathmlFactorial(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_factorof_in_mathml_factorof_v4hwgkxebb"() IS 'function of law Node(id) where kind = m:factorof in MathmlFactorof(id), a mirrors half on MathmlFactorof for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_factorof_in_mathml_factorof_kxa3sn23ma"() IS 'function of law Node(id) where kind = m:factorof in MathmlFactorof(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_false_in_mathml_false_joyqxrgywh"() IS 'function of law Node(id) where kind = m:false in MathmlFalse(id), a mirrors half on MathmlFalse for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_false_in_mathml_false_mg56nfidv5"() IS 'function of law Node(id) where kind = m:false in MathmlFalse(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_floor_in_mathml_floor_d73lil7vyo"() IS 'function of law Node(id) where kind = m:floor in MathmlFloor(id), a mirrors half on MathmlFloor for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_floor_in_mathml_floor_c6wmh2uizd"() IS 'function of law Node(id) where kind = m:floor in MathmlFloor(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_fn_in_mathml_fn_5jgrnzipxp"() IS 'function of law Node(id) where kind = m:fn in MathmlFn(id), a mirrors half on MathmlFn for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_fn_in_mathml_fn_wq2kumq2nk"() IS 'function of law Node(id) where kind = m:fn in MathmlFn(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_forall_in_mathml_forall_qxnschavih"() IS 'function of law Node(id) where kind = m:forall in MathmlForall(id), a mirrors half on MathmlForall for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_forall_in_mathml_forall_l6zn2raig3"() IS 'function of law Node(id) where kind = m:forall in MathmlForall(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_gcd_in_mathml_gcd_aqj5kkwg7c"() IS 'function of law Node(id) where kind = m:gcd in MathmlGcd(id), a mirrors half on MathmlGcd for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_gcd_in_mathml_gcd_2youskt7g7"() IS 'function of law Node(id) where kind = m:gcd in MathmlGcd(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_geq_in_mathml_geq_kan53xjlgr"() IS 'function of law Node(id) where kind = m:geq in MathmlGeq(id), a mirrors half on MathmlGeq for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_geq_in_mathml_geq_ufbmk5jbit"() IS 'function of law Node(id) where kind = m:geq in MathmlGeq(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_grad_in_mathml_grad_6trvj3bjhh"() IS 'function of law Node(id) where kind = m:grad in MathmlGrad(id), a mirrors half on MathmlGrad for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_grad_in_mathml_grad_qmzj5jwcpa"() IS 'function of law Node(id) where kind = m:grad in MathmlGrad(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_gt_in_mathml_gt_aupwkz5p34"() IS 'function of law Node(id) where kind = m:gt in MathmlGt(id), a mirrors half on MathmlGt for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_gt_in_mathml_gt_iw4wwjwdjf"() IS 'function of law Node(id) where kind = m:gt in MathmlGt(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ident_in_mathml_ident_lp7vovnjgl"() IS 'function of law Node(id) where kind = m:ident in MathmlIdent(id), a mirrors half on MathmlIdent for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ident_in_mathml_ident_7ql7x335gh"() IS 'function of law Node(id) where kind = m:ident in MathmlIdent(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_image_in_mathml_image_472apkrzye"() IS 'function of law Node(id) where kind = m:image in MathmlImage(id), a mirrors half on MathmlImage for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_image_in_mathml_image_bbzeshseij"() IS 'function of law Node(id) where kind = m:image in MathmlImage(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_imaginary_in_mathml_imaginary_5e6cpuugd3"() IS 'function of law Node(id) where kind = m:imaginary in MathmlImaginary(id), a mirrors half on MathmlImaginary for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_imaginary_in_mathml_imaginary_e65yh4jmxu"() IS 'function of law Node(id) where kind = m:imaginary in MathmlImaginary(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_imaginaryi_in_mathml_imaginaryi_rovg6xaeoy"() IS 'function of law Node(id) where kind = m:imaginaryi in MathmlImaginaryi(id), a mirrors half on MathmlImaginaryi for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_imaginaryi_in_mathml_imaginaryi_m4qiii5izw"() IS 'function of law Node(id) where kind = m:imaginaryi in MathmlImaginaryi(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_implies_in_mathml_implies_yjvi7beost"() IS 'function of law Node(id) where kind = m:implies in MathmlImplies(id), a mirrors half on MathmlImplies for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_implies_in_mathml_implies_t2i3yao2f4"() IS 'function of law Node(id) where kind = m:implies in MathmlImplies(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_in_in_mathml_in_uedxv2ryym"() IS 'function of law Node(id) where kind = m:in in MathmlIn(id), a mirrors half on MathmlIn for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_in_in_mathml_in_4bbx5gaclf"() IS 'function of law Node(id) where kind = m:in in MathmlIn(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_infinity_in_mathml_infinity_3vo7wv4cod"() IS 'function of law Node(id) where kind = m:infinity in MathmlInfinity(id), a mirrors half on MathmlInfinity for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_infinity_in_mathml_infinity_hal3pvt2hh"() IS 'function of law Node(id) where kind = m:infinity in MathmlInfinity(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_int_in_mathml_int_krlnnipuib"() IS 'function of law Node(id) where kind = m:int in MathmlInt(id), a mirrors half on MathmlInt for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_int_in_mathml_int_fkdaninkvn"() IS 'function of law Node(id) where kind = m:int in MathmlInt(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_integers_in_mathml_integers_yr255urfaj"() IS 'function of law Node(id) where kind = m:integers in MathmlIntegers(id), a mirrors half on MathmlIntegers for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_integers_in_mathml_integers_e2evlmnqqf"() IS 'function of law Node(id) where kind = m:integers in MathmlIntegers(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_intersect_in_mathml_intersect_3sn3ocrzkj"() IS 'function of law Node(id) where kind = m:intersect in MathmlIntersect(id), a mirrors half on MathmlIntersect for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_intersect_in_mathml_intersect_nrwt5smatf"() IS 'function of law Node(id) where kind = m:intersect in MathmlIntersect(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_interval_in_mathml_interval_mqef7z7q36"() IS 'function of law Node(id) where kind = m:interval in MathmlInterval(id), a mirrors half on MathmlInterval for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_interval_in_mathml_interval_sfmcoqbgkg"() IS 'function of law Node(id) where kind = m:interval in MathmlInterval(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_inverse_in_mathml_inverse_q6ncxnypqc"() IS 'function of law Node(id) where kind = m:inverse in MathmlInverse(id), a mirrors half on MathmlInverse for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_inverse_in_mathml_inverse_xxfbwc3j3j"() IS 'function of law Node(id) where kind = m:inverse in MathmlInverse(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lambda_in_mathml_lambda_oabktaalg6"() IS 'function of law Node(id) where kind = m:lambda in MathmlLambda(id), a mirrors half on MathmlLambda for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lambda_in_mathml_lambda_usbjzwgb7r"() IS 'function of law Node(id) where kind = m:lambda in MathmlLambda(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_laplacian_in_mathml_laplacian_whylxbrgw2"() IS 'function of law Node(id) where kind = m:laplacian in MathmlLaplacian(id), a mirrors half on MathmlLaplacian for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_laplacian_in_mathml_laplacian_shyk6xiq6g"() IS 'function of law Node(id) where kind = m:laplacian in MathmlLaplacian(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lcm_in_mathml_lcm_w3ulbi5zx6"() IS 'function of law Node(id) where kind = m:lcm in MathmlLcm(id), a mirrors half on MathmlLcm for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lcm_in_mathml_lcm_dgl4dkkjll"() IS 'function of law Node(id) where kind = m:lcm in MathmlLcm(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_leq_in_mathml_leq_gp5kftaujc"() IS 'function of law Node(id) where kind = m:leq in MathmlLeq(id), a mirrors half on MathmlLeq for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_leq_in_mathml_leq_r6iv2z4ll5"() IS 'function of law Node(id) where kind = m:leq in MathmlLeq(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_limit_in_mathml_limit_3jk7eatey7"() IS 'function of law Node(id) where kind = m:limit in MathmlLimit(id), a mirrors half on MathmlLimit for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_limit_in_mathml_limit_faoi46hwol"() IS 'function of law Node(id) where kind = m:limit in MathmlLimit(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_list_in_mathml_list_iibrw7rujb"() IS 'function of law Node(id) where kind = m:list in MathmlList(id), a mirrors half on MathmlList for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_list_in_mathml_list_5yl4bur2em"() IS 'function of law Node(id) where kind = m:list in MathmlList(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ln_in_mathml_ln_bj64c4obxh"() IS 'function of law Node(id) where kind = m:ln in MathmlLn(id), a mirrors half on MathmlLn for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ln_in_mathml_ln_uw3rtkpakp"() IS 'function of law Node(id) where kind = m:ln in MathmlLn(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_log_in_mathml_log_3d4q5bz2ew"() IS 'function of law Node(id) where kind = m:log in MathmlLog(id), a mirrors half on MathmlLog for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_log_in_mathml_log_lgqopoohyt"() IS 'function of law Node(id) where kind = m:log in MathmlLog(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_logbase_in_mathml_logbase_lk36i6yokq"() IS 'function of law Node(id) where kind = m:logbase in MathmlLogbase(id), a mirrors half on MathmlLogbase for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_logbase_in_mathml_logbase_z5g2gva25m"() IS 'function of law Node(id) where kind = m:logbase in MathmlLogbase(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lowlimit_in_mathml_lowlimit_pzbffbvjjr"() IS 'function of law Node(id) where kind = m:lowlimit in MathmlLowlimit(id), a mirrors half on MathmlLowlimit for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lowlimit_in_mathml_lowlimit_icvwl2ozve"() IS 'function of law Node(id) where kind = m:lowlimit in MathmlLowlimit(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lt_in_mathml_lt_5ire5mfg2s"() IS 'function of law Node(id) where kind = m:lt in MathmlLt(id), a mirrors half on MathmlLt for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_lt_in_mathml_lt_awbdmopv5s"() IS 'function of law Node(id) where kind = m:lt in MathmlLt(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_maction_in_mathml_maction_5p7fyz4pfb"() IS 'function of law Node(id) where kind = m:maction in MathmlMaction(id), a mirrors half on MathmlMaction for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_maction_in_mathml_maction_tjjtfr535y"() IS 'function of law Node(id) where kind = m:maction in MathmlMaction(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_maligngroup_in_mathml_maligngroup_fsjda2fnqz"() IS 'function of law Node(id) where kind = m:maligngroup in MathmlMaligngroup(id), a mirrors half on MathmlMaligngroup for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_maligngroup_in_mathml_maligngroup_npnc5mall3"() IS 'function of law Node(id) where kind = m:maligngroup in MathmlMaligngroup(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_malignmark_in_mathml_malignmark_bsuddsv6bg"() IS 'function of law Node(id) where kind = m:malignmark in MathmlMalignmark(id), a mirrors half on MathmlMalignmark for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_malignmark_in_mathml_malignmark_vgz6iqirv2"() IS 'function of law Node(id) where kind = m:malignmark in MathmlMalignmark(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_math_in_mathml_math_u2h7akjvxq"() IS 'function of law Node(id) where kind = m:math in MathmlMath(id), a mirrors half on MathmlMath for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_math_in_mathml_math_obodinsa5k"() IS 'function of law Node(id) where kind = m:math in MathmlMath(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_matrix_in_mathml_matrix_cuoasli4zl"() IS 'function of law Node(id) where kind = m:matrix in MathmlMatrix(id), a mirrors half on MathmlMatrix for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_matrix_in_mathml_matrix_54eh7c5dwg"() IS 'function of law Node(id) where kind = m:matrix in MathmlMatrix(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_matrixrow_in_mathml_matrixrow_d7dxbqae6v"() IS 'function of law Node(id) where kind = m:matrixrow in MathmlMatrixrow(id), a mirrors half on MathmlMatrixrow for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_matrixrow_in_mathml_matrixrow_n57ugpfgiq"() IS 'function of law Node(id) where kind = m:matrixrow in MathmlMatrixrow(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_max_in_mathml_max_3mtsxi7pan"() IS 'function of law Node(id) where kind = m:max in MathmlMax(id), a mirrors half on MathmlMax for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_max_in_mathml_max_eqf7xhuou5"() IS 'function of law Node(id) where kind = m:max in MathmlMax(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mean_in_mathml_mean_3wxndqsn7l"() IS 'function of law Node(id) where kind = m:mean in MathmlMean(id), a mirrors half on MathmlMean for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mean_in_mathml_mean_vcb4zolujn"() IS 'function of law Node(id) where kind = m:mean in MathmlMean(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_median_in_mathml_median_t2drbks4nd"() IS 'function of law Node(id) where kind = m:median in MathmlMedian(id), a mirrors half on MathmlMedian for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_median_in_mathml_median_if7vt6orkx"() IS 'function of law Node(id) where kind = m:median in MathmlMedian(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_menclose_in_mathml_menclose_zamvfp2v2c"() IS 'function of law Node(id) where kind = m:menclose in MathmlMenclose(id), a mirrors half on MathmlMenclose for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_menclose_in_mathml_menclose_yxntilhedy"() IS 'function of law Node(id) where kind = m:menclose in MathmlMenclose(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_merror_in_mathml_merror_cjaev63awf"() IS 'function of law Node(id) where kind = m:merror in MathmlMerror(id), a mirrors half on MathmlMerror for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_merror_in_mathml_merror_r62upw5fp4"() IS 'function of law Node(id) where kind = m:merror in MathmlMerror(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mfenced_in_mathml_mfenced_fhuma2mc5c"() IS 'function of law Node(id) where kind = m:mfenced in MathmlMfenced(id), a mirrors half on MathmlMfenced for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mfenced_in_mathml_mfenced_q4sy2k5yxr"() IS 'function of law Node(id) where kind = m:mfenced in MathmlMfenced(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mfrac_in_mathml_mfrac_cbghxo46av"() IS 'function of law Node(id) where kind = m:mfrac in MathmlMfrac(id), a mirrors half on MathmlMfrac for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mfrac_in_mathml_mfrac_hvfufowfod"() IS 'function of law Node(id) where kind = m:mfrac in MathmlMfrac(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mglyph_in_mathml_mglyph_mdhsu3keh7"() IS 'function of law Node(id) where kind = m:mglyph in MathmlMglyph(id), a mirrors half on MathmlMglyph for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mglyph_in_mathml_mglyph_s5otue6mij"() IS 'function of law Node(id) where kind = m:mglyph in MathmlMglyph(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mi_in_mathml_mi_bb6u2t2a6j"() IS 'function of law Node(id) where kind = m:mi in MathmlMi(id), a mirrors half on MathmlMi for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mi_in_mathml_mi_32yrosbvwg"() IS 'function of law Node(id) where kind = m:mi in MathmlMi(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_min_in_mathml_min_p77c75hsc2"() IS 'function of law Node(id) where kind = m:min in MathmlMin(id), a mirrors half on MathmlMin for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_min_in_mathml_min_dlqqrjkjva"() IS 'function of law Node(id) where kind = m:min in MathmlMin(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_minus_in_mathml_minus_q3ta4gkyfw"() IS 'function of law Node(id) where kind = m:minus in MathmlMinus(id), a mirrors half on MathmlMinus for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_minus_in_mathml_minus_6qgrby5zqa"() IS 'function of law Node(id) where kind = m:minus in MathmlMinus(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mlabeledtr_in_mathml_mlabeledtr_xkeolggvfn"() IS 'function of law Node(id) where kind = m:mlabeledtr in MathmlMlabeledtr(id), a mirrors half on MathmlMlabeledtr for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mlabeledtr_in_mathml_mlabeledtr_en7xhcgunb"() IS 'function of law Node(id) where kind = m:mlabeledtr in MathmlMlabeledtr(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mlongdiv_in_mathml_mlongdiv_zyjmsqfywc"() IS 'function of law Node(id) where kind = m:mlongdiv in MathmlMlongdiv(id), a mirrors half on MathmlMlongdiv for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mlongdiv_in_mathml_mlongdiv_v3xcpzioo3"() IS 'function of law Node(id) where kind = m:mlongdiv in MathmlMlongdiv(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mmultiscripts_in_mathml_iuah7oupgu"() IS 'function of law Node(id) where kind = m:mmultiscripts in MathmlMmultiscripts(id), a mirrors half on MathmlMmultiscripts for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mmultiscripts_in_mathml_izx2q4vfzy"() IS 'function of law Node(id) where kind = m:mmultiscripts in MathmlMmultiscripts(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mn_in_mathml_mn_rp5mwkiadr"() IS 'function of law Node(id) where kind = m:mn in MathmlMn(id), a mirrors half on MathmlMn for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mn_in_mathml_mn_4dwgkp6cux"() IS 'function of law Node(id) where kind = m:mn in MathmlMn(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mo_in_mathml_mo_tjbosjo7lc"() IS 'function of law Node(id) where kind = m:mo in MathmlMo(id), a mirrors half on MathmlMo for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mo_in_mathml_mo_yszbtuisud"() IS 'function of law Node(id) where kind = m:mo in MathmlMo(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mode_in_mathml_mode_h3v3zjrx7q"() IS 'function of law Node(id) where kind = m:mode in MathmlMode(id), a mirrors half on MathmlMode for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mode_in_mathml_mode_2gnd3nvzvq"() IS 'function of law Node(id) where kind = m:mode in MathmlMode(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_moment_in_mathml_moment_g2ey42j6dd"() IS 'function of law Node(id) where kind = m:moment in MathmlMoment(id), a mirrors half on MathmlMoment for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_moment_in_mathml_moment_pau5amouli"() IS 'function of law Node(id) where kind = m:moment in MathmlMoment(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_momentabout_in_mathml_momentabout_hj4pbp6mwo"() IS 'function of law Node(id) where kind = m:momentabout in MathmlMomentabout(id), a mirrors half on MathmlMomentabout for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_momentabout_in_mathml_momentabout_bysthmhqf4"() IS 'function of law Node(id) where kind = m:momentabout in MathmlMomentabout(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mover_in_mathml_mover_aesonm3pic"() IS 'function of law Node(id) where kind = m:mover in MathmlMover(id), a mirrors half on MathmlMover for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mover_in_mathml_mover_6qlffx44hy"() IS 'function of law Node(id) where kind = m:mover in MathmlMover(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mpadded_in_mathml_mpadded_7fhmq246jm"() IS 'function of law Node(id) where kind = m:mpadded in MathmlMpadded(id), a mirrors half on MathmlMpadded for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mpadded_in_mathml_mpadded_briy5mtqoi"() IS 'function of law Node(id) where kind = m:mpadded in MathmlMpadded(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mphantom_in_mathml_mphantom_qrxts2nnn6"() IS 'function of law Node(id) where kind = m:mphantom in MathmlMphantom(id), a mirrors half on MathmlMphantom for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mphantom_in_mathml_mphantom_a66tpqpj3i"() IS 'function of law Node(id) where kind = m:mphantom in MathmlMphantom(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mprescripts_in_mathml_mprescripts_33o7jp4khg"() IS 'function of law Node(id) where kind = m:mprescripts in MathmlMprescripts(id), a mirrors half on MathmlMprescripts for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mprescripts_in_mathml_mprescripts_25e7wsusni"() IS 'function of law Node(id) where kind = m:mprescripts in MathmlMprescripts(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mroot_in_mathml_mroot_arcxi5lk5n"() IS 'function of law Node(id) where kind = m:mroot in MathmlMroot(id), a mirrors half on MathmlMroot for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mroot_in_mathml_mroot_faqjvfp53a"() IS 'function of law Node(id) where kind = m:mroot in MathmlMroot(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mrow_in_mathml_mrow_jexcgvuied"() IS 'function of law Node(id) where kind = m:mrow in MathmlMrow(id), a mirrors half on MathmlMrow for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mrow_in_mathml_mrow_g2pi36y3bh"() IS 'function of law Node(id) where kind = m:mrow in MathmlMrow(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ms_in_mathml_ms_hppyclz4je"() IS 'function of law Node(id) where kind = m:ms in MathmlMs(id), a mirrors half on MathmlMs for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_ms_in_mathml_ms_k4om5tyaud"() IS 'function of law Node(id) where kind = m:ms in MathmlMs(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mscarries_in_mathml_mscarries_rmz5vdkd5g"() IS 'function of law Node(id) where kind = m:mscarries in MathmlMscarries(id), a mirrors half on MathmlMscarries for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mscarries_in_mathml_mscarries_lhmoa24nfv"() IS 'function of law Node(id) where kind = m:mscarries in MathmlMscarries(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mscarry_in_mathml_mscarry_gtjmo2jha4"() IS 'function of law Node(id) where kind = m:mscarry in MathmlMscarry(id), a mirrors half on MathmlMscarry for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mscarry_in_mathml_mscarry_zoqjjhcd3n"() IS 'function of law Node(id) where kind = m:mscarry in MathmlMscarry(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msgroup_in_mathml_msgroup_t43n7ondkj"() IS 'function of law Node(id) where kind = m:msgroup in MathmlMsgroup(id), a mirrors half on MathmlMsgroup for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msgroup_in_mathml_msgroup_ev7r3we7ew"() IS 'function of law Node(id) where kind = m:msgroup in MathmlMsgroup(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msline_in_mathml_msline_y7u7acnhy3"() IS 'function of law Node(id) where kind = m:msline in MathmlMsline(id), a mirrors half on MathmlMsline for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msline_in_mathml_msline_qlcgvjxw4p"() IS 'function of law Node(id) where kind = m:msline in MathmlMsline(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mspace_in_mathml_mspace_umo6z2dwww"() IS 'function of law Node(id) where kind = m:mspace in MathmlMspace(id), a mirrors half on MathmlMspace for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mspace_in_mathml_mspace_5hnbreex4j"() IS 'function of law Node(id) where kind = m:mspace in MathmlMspace(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msqrt_in_mathml_msqrt_ctjmepgn36"() IS 'function of law Node(id) where kind = m:msqrt in MathmlMsqrt(id), a mirrors half on MathmlMsqrt for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msqrt_in_mathml_msqrt_ufvpwhhnuv"() IS 'function of law Node(id) where kind = m:msqrt in MathmlMsqrt(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msrow_in_mathml_msrow_rh675fzawm"() IS 'function of law Node(id) where kind = m:msrow in MathmlMsrow(id), a mirrors half on MathmlMsrow for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msrow_in_mathml_msrow_5c56i74tsn"() IS 'function of law Node(id) where kind = m:msrow in MathmlMsrow(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mstack_in_mathml_mstack_ziq7h5v37s"() IS 'function of law Node(id) where kind = m:mstack in MathmlMstack(id), a mirrors half on MathmlMstack for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mstack_in_mathml_mstack_dzchprw2vr"() IS 'function of law Node(id) where kind = m:mstack in MathmlMstack(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mstyle_in_mathml_mstyle_p2l5mlpegd"() IS 'function of law Node(id) where kind = m:mstyle in MathmlMstyle(id), a mirrors half on MathmlMstyle for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mstyle_in_mathml_mstyle_wln62isqcn"() IS 'function of law Node(id) where kind = m:mstyle in MathmlMstyle(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msub_in_mathml_msub_kplzyy2xrc"() IS 'function of law Node(id) where kind = m:msub in MathmlMsub(id), a mirrors half on MathmlMsub for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msub_in_mathml_msub_j4tlbsfbff"() IS 'function of law Node(id) where kind = m:msub in MathmlMsub(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msubsup_in_mathml_msubsup_kcjcdebspn"() IS 'function of law Node(id) where kind = m:msubsup in MathmlMsubsup(id), a mirrors half on MathmlMsubsup for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msubsup_in_mathml_msubsup_ifmaddgdqv"() IS 'function of law Node(id) where kind = m:msubsup in MathmlMsubsup(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msup_in_mathml_msup_sozelo2uvv"() IS 'function of law Node(id) where kind = m:msup in MathmlMsup(id), a mirrors half on MathmlMsup for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_msup_in_mathml_msup_ntvrtegwa5"() IS 'function of law Node(id) where kind = m:msup in MathmlMsup(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtable_in_mathml_mtable_daz6n47k5d"() IS 'function of law Node(id) where kind = m:mtable in MathmlMtable(id), a mirrors half on MathmlMtable for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtable_in_mathml_mtable_q7cnfpgbcw"() IS 'function of law Node(id) where kind = m:mtable in MathmlMtable(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtd_in_mathml_mtd_vcxs5k6k2d"() IS 'function of law Node(id) where kind = m:mtd in MathmlMtd(id), a mirrors half on MathmlMtd for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtd_in_mathml_mtd_4zlfqdppoj"() IS 'function of law Node(id) where kind = m:mtd in MathmlMtd(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtext_in_mathml_mtext_zwctomstk2"() IS 'function of law Node(id) where kind = m:mtext in MathmlMtext(id), a mirrors half on MathmlMtext for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtext_in_mathml_mtext_w2lvecvjaj"() IS 'function of law Node(id) where kind = m:mtext in MathmlMtext(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtr_in_mathml_mtr_vf2bercycr"() IS 'function of law Node(id) where kind = m:mtr in MathmlMtr(id), a mirrors half on MathmlMtr for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_mtr_in_mathml_mtr_gtuceiswpr"() IS 'function of law Node(id) where kind = m:mtr in MathmlMtr(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_munder_in_mathml_munder_dnoujxgfn7"() IS 'function of law Node(id) where kind = m:munder in MathmlMunder(id), a mirrors half on MathmlMunder for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_munder_in_mathml_munder_ece7jptqws"() IS 'function of law Node(id) where kind = m:munder in MathmlMunder(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_munderover_in_mathml_munderover_ytxsfu6uwi"() IS 'function of law Node(id) where kind = m:munderover in MathmlMunderover(id), a mirrors half on MathmlMunderover for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_munderover_in_mathml_munderover_alhxuilnma"() IS 'function of law Node(id) where kind = m:munderover in MathmlMunderover(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_naturalnumbers_in_mathml_7oh6zpwcwb"() IS 'function of law Node(id) where kind = m:naturalnumbers in MathmlNaturalnumbers(id), a mirrors half on MathmlNaturalnumbers for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_naturalnumbers_in_mathml_j3fq7pe5eh"() IS 'function of law Node(id) where kind = m:naturalnumbers in MathmlNaturalnumbers(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_neq_in_mathml_neq_nboszhesn2"() IS 'function of law Node(id) where kind = m:neq in MathmlNeq(id), a mirrors half on MathmlNeq for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_neq_in_mathml_neq_gsqmzmdknp"() IS 'function of law Node(id) where kind = m:neq in MathmlNeq(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_none_in_mathml_none_y2gb54fqe7"() IS 'function of law Node(id) where kind = m:none in MathmlNone(id), a mirrors half on MathmlNone for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_none_in_mathml_none_6re2ihviak"() IS 'function of law Node(id) where kind = m:none in MathmlNone(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_not_in_mathml_not_bxcugey6hk"() IS 'function of law Node(id) where kind = m:not in MathmlNot(id), a mirrors half on MathmlNot for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_not_in_mathml_not_cq3hyetw65"() IS 'function of law Node(id) where kind = m:not in MathmlNot(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notanumber_in_mathml_notanumber_3vcih4bsk5"() IS 'function of law Node(id) where kind = m:notanumber in MathmlNotanumber(id), a mirrors half on MathmlNotanumber for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notanumber_in_mathml_notanumber_munqhxfztg"() IS 'function of law Node(id) where kind = m:notanumber in MathmlNotanumber(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notin_in_mathml_notin_3745b73s3t"() IS 'function of law Node(id) where kind = m:notin in MathmlNotin(id), a mirrors half on MathmlNotin for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notin_in_mathml_notin_jpfqmy4lm2"() IS 'function of law Node(id) where kind = m:notin in MathmlNotin(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notprsubset_in_mathml_notprsubset_4s2l35vn5w"() IS 'function of law Node(id) where kind = m:notprsubset in MathmlNotprsubset(id), a mirrors half on MathmlNotprsubset for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notprsubset_in_mathml_notprsubset_czql5ureah"() IS 'function of law Node(id) where kind = m:notprsubset in MathmlNotprsubset(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notsubset_in_mathml_notsubset_yxfxnh5hoh"() IS 'function of law Node(id) where kind = m:notsubset in MathmlNotsubset(id), a mirrors half on MathmlNotsubset for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_notsubset_in_mathml_notsubset_fgxedog355"() IS 'function of law Node(id) where kind = m:notsubset in MathmlNotsubset(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_or_in_mathml_or_jcq4xfmlys"() IS 'function of law Node(id) where kind = m:or in MathmlOr(id), a mirrors half on MathmlOr for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_or_in_mathml_or_f5lttkjww5"() IS 'function of law Node(id) where kind = m:or in MathmlOr(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_otherwise_in_mathml_otherwise_ygnui7i3kk"() IS 'function of law Node(id) where kind = m:otherwise in MathmlOtherwise(id), a mirrors half on MathmlOtherwise for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_otherwise_in_mathml_otherwise_dcqilfk7qz"() IS 'function of law Node(id) where kind = m:otherwise in MathmlOtherwise(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_outerproduct_in_mathml_6nf2s55yxo"() IS 'function of law Node(id) where kind = m:outerproduct in MathmlOuterproduct(id), a mirrors half on MathmlOuterproduct for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_outerproduct_in_mathml_oo253aeuvk"() IS 'function of law Node(id) where kind = m:outerproduct in MathmlOuterproduct(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_partialdiff_in_mathml_partialdiff_vvhuany5xj"() IS 'function of law Node(id) where kind = m:partialdiff in MathmlPartialdiff(id), a mirrors half on MathmlPartialdiff for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_partialdiff_in_mathml_partialdiff_bm3qblser2"() IS 'function of law Node(id) where kind = m:partialdiff in MathmlPartialdiff(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_pi_in_mathml_pi_raxzpdbba2"() IS 'function of law Node(id) where kind = m:pi in MathmlPi(id), a mirrors half on MathmlPi for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_pi_in_mathml_pi_65p3y6lerg"() IS 'function of law Node(id) where kind = m:pi in MathmlPi(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_piece_in_mathml_piece_frryjpcpul"() IS 'function of law Node(id) where kind = m:piece in MathmlPiece(id), a mirrors half on MathmlPiece for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_piece_in_mathml_piece_hn6arljdjn"() IS 'function of law Node(id) where kind = m:piece in MathmlPiece(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_piecewise_in_mathml_piecewise_zsontadwjs"() IS 'function of law Node(id) where kind = m:piecewise in MathmlPiecewise(id), a mirrors half on MathmlPiecewise for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_piecewise_in_mathml_piecewise_nexy4bjf6j"() IS 'function of law Node(id) where kind = m:piecewise in MathmlPiecewise(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_plus_in_mathml_plus_juvjazif7a"() IS 'function of law Node(id) where kind = m:plus in MathmlPlus(id), a mirrors half on MathmlPlus for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_plus_in_mathml_plus_pvsrte6ycd"() IS 'function of law Node(id) where kind = m:plus in MathmlPlus(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_power_in_mathml_power_y7aavgy3hy"() IS 'function of law Node(id) where kind = m:power in MathmlPower(id), a mirrors half on MathmlPower for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_power_in_mathml_power_3ni4caw2fe"() IS 'function of law Node(id) where kind = m:power in MathmlPower(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_primes_in_mathml_primes_pljbxdvwux"() IS 'function of law Node(id) where kind = m:primes in MathmlPrimes(id), a mirrors half on MathmlPrimes for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_primes_in_mathml_primes_dysksvevw4"() IS 'function of law Node(id) where kind = m:primes in MathmlPrimes(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_product_in_mathml_product_zhczjxkoio"() IS 'function of law Node(id) where kind = m:product in MathmlProduct(id), a mirrors half on MathmlProduct for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_product_in_mathml_product_z5awnscvui"() IS 'function of law Node(id) where kind = m:product in MathmlProduct(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_prsubset_in_mathml_prsubset_yxj2bqviv4"() IS 'function of law Node(id) where kind = m:prsubset in MathmlPrsubset(id), a mirrors half on MathmlPrsubset for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_prsubset_in_mathml_prsubset_lw475gf56v"() IS 'function of law Node(id) where kind = m:prsubset in MathmlPrsubset(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_quotient_in_mathml_quotient_rhuieadwgn"() IS 'function of law Node(id) where kind = m:quotient in MathmlQuotient(id), a mirrors half on MathmlQuotient for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_quotient_in_mathml_quotient_mkthd6kzxj"() IS 'function of law Node(id) where kind = m:quotient in MathmlQuotient(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_rationals_in_mathml_rationals_midpgvo5lj"() IS 'function of law Node(id) where kind = m:rationals in MathmlRationals(id), a mirrors half on MathmlRationals for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_rationals_in_mathml_rationals_whmxigw2kc"() IS 'function of law Node(id) where kind = m:rationals in MathmlRationals(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_real_in_mathml_real_j262wpkslq"() IS 'function of law Node(id) where kind = m:real in MathmlReal(id), a mirrors half on MathmlReal for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_real_in_mathml_real_6kjgkzhx4v"() IS 'function of law Node(id) where kind = m:real in MathmlReal(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_reals_in_mathml_reals_5fnr5bmsao"() IS 'function of law Node(id) where kind = m:reals in MathmlReals(id), a mirrors half on MathmlReals for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_reals_in_mathml_reals_er5eeiirzn"() IS 'function of law Node(id) where kind = m:reals in MathmlReals(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_reln_in_mathml_reln_yvuongfcjn"() IS 'function of law Node(id) where kind = m:reln in MathmlReln(id), a mirrors half on MathmlReln for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_reln_in_mathml_reln_qqvxzlhrtv"() IS 'function of law Node(id) where kind = m:reln in MathmlReln(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_rem_in_mathml_rem_akh5k5vhfy"() IS 'function of law Node(id) where kind = m:rem in MathmlRem(id), a mirrors half on MathmlRem for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_rem_in_mathml_rem_rk2ynvxdlo"() IS 'function of law Node(id) where kind = m:rem in MathmlRem(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_root_in_mathml_root_dnlule6sl3"() IS 'function of law Node(id) where kind = m:root in MathmlRoot(id), a mirrors half on MathmlRoot for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_root_in_mathml_root_pty3kmf6xv"() IS 'function of law Node(id) where kind = m:root in MathmlRoot(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_scalarproduct_in_mathml_asybccbju2"() IS 'function of law Node(id) where kind = m:scalarproduct in MathmlScalarproduct(id), a mirrors half on MathmlScalarproduct for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_scalarproduct_in_mathml_yucda3df45"() IS 'function of law Node(id) where kind = m:scalarproduct in MathmlScalarproduct(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sdev_in_mathml_sdev_bzpos3hrrx"() IS 'function of law Node(id) where kind = m:sdev in MathmlSdev(id), a mirrors half on MathmlSdev for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sdev_in_mathml_sdev_mcoec7rgrr"() IS 'function of law Node(id) where kind = m:sdev in MathmlSdev(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sec_in_mathml_sec_wovhp4dhi4"() IS 'function of law Node(id) where kind = m:sec in MathmlSec(id), a mirrors half on MathmlSec for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sec_in_mathml_sec_wjibaabwz3"() IS 'function of law Node(id) where kind = m:sec in MathmlSec(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sech_in_mathml_sech_4nzlmiusf7"() IS 'function of law Node(id) where kind = m:sech in MathmlSech(id), a mirrors half on MathmlSech for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sech_in_mathml_sech_cuck26up6i"() IS 'function of law Node(id) where kind = m:sech in MathmlSech(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_selector_in_mathml_selector_d6h4yl5j7b"() IS 'function of law Node(id) where kind = m:selector in MathmlSelector(id), a mirrors half on MathmlSelector for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_selector_in_mathml_selector_33jmtwwkkw"() IS 'function of law Node(id) where kind = m:selector in MathmlSelector(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_semantics_in_mathml_semantics_2wswee5z4p"() IS 'function of law Node(id) where kind = m:semantics in MathmlSemantics(id), a mirrors half on MathmlSemantics for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_semantics_in_mathml_semantics_uw7ua4vjlk"() IS 'function of law Node(id) where kind = m:semantics in MathmlSemantics(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_semantics_ci_in_mathml_semantics_t3rbr66yoi"() IS 'function of law Node(id) where kind = m:semantics.ci in MathmlSemanticsCi(id), a mirrors half on MathmlSemanticsCi for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_semantics_ci_in_mathml_semantics_6qlimevt5l"() IS 'function of law Node(id) where kind = m:semantics.ci in MathmlSemanticsCi(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sep_in_mathml_sep_2icorayjm4"() IS 'function of law Node(id) where kind = m:sep in MathmlSep(id), a mirrors half on MathmlSep for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sep_in_mathml_sep_qil4hid7yr"() IS 'function of law Node(id) where kind = m:sep in MathmlSep(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_set_in_mathml_set_674mlq7zem"() IS 'function of law Node(id) where kind = m:set in MathmlSet(id), a mirrors half on MathmlSet for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_set_in_mathml_set_smiaohrqtz"() IS 'function of law Node(id) where kind = m:set in MathmlSet(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_setdiff_in_mathml_setdiff_bvteqdyn7m"() IS 'function of law Node(id) where kind = m:setdiff in MathmlSetdiff(id), a mirrors half on MathmlSetdiff for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_setdiff_in_mathml_setdiff_2qbbkyra6n"() IS 'function of law Node(id) where kind = m:setdiff in MathmlSetdiff(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_share_in_mathml_share_g6z2f5f7ow"() IS 'function of law Node(id) where kind = m:share in MathmlShare(id), a mirrors half on MathmlShare for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_share_in_mathml_share_paiqihgza6"() IS 'function of law Node(id) where kind = m:share in MathmlShare(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sin_in_mathml_sin_xm4k56dxxm"() IS 'function of law Node(id) where kind = m:sin in MathmlSin(id), a mirrors half on MathmlSin for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sin_in_mathml_sin_cbnbahkcfa"() IS 'function of law Node(id) where kind = m:sin in MathmlSin(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sinh_in_mathml_sinh_opej4ft525"() IS 'function of law Node(id) where kind = m:sinh in MathmlSinh(id), a mirrors half on MathmlSinh for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sinh_in_mathml_sinh_lan7og56ab"() IS 'function of law Node(id) where kind = m:sinh in MathmlSinh(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_subset_in_mathml_subset_ljottgaz3x"() IS 'function of law Node(id) where kind = m:subset in MathmlSubset(id), a mirrors half on MathmlSubset for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_subset_in_mathml_subset_acrmuwdntj"() IS 'function of law Node(id) where kind = m:subset in MathmlSubset(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sum_in_mathml_sum_gtxsjoxjh3"() IS 'function of law Node(id) where kind = m:sum in MathmlSum(id), a mirrors half on MathmlSum for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_sum_in_mathml_sum_wfwjfytubu"() IS 'function of law Node(id) where kind = m:sum in MathmlSum(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_tan_in_mathml_tan_mix7foi6rn"() IS 'function of law Node(id) where kind = m:tan in MathmlTan(id), a mirrors half on MathmlTan for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_tan_in_mathml_tan_o2aw5q4sge"() IS 'function of law Node(id) where kind = m:tan in MathmlTan(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_tanh_in_mathml_tanh_fxqb66qkv4"() IS 'function of law Node(id) where kind = m:tanh in MathmlTanh(id), a mirrors half on MathmlTanh for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_tanh_in_mathml_tanh_tcwubx4lzi"() IS 'function of law Node(id) where kind = m:tanh in MathmlTanh(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_tendsto_in_mathml_tendsto_bioy3ufnyp"() IS 'function of law Node(id) where kind = m:tendsto in MathmlTendsto(id), a mirrors half on MathmlTendsto for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_tendsto_in_mathml_tendsto_b65ilxtnxe"() IS 'function of law Node(id) where kind = m:tendsto in MathmlTendsto(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_times_in_mathml_times_sdx2e22mbi"() IS 'function of law Node(id) where kind = m:times in MathmlTimes(id), a mirrors half on MathmlTimes for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_times_in_mathml_times_hxnu2abnz6"() IS 'function of law Node(id) where kind = m:times in MathmlTimes(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_transpose_in_mathml_transpose_xcrpozhuni"() IS 'function of law Node(id) where kind = m:transpose in MathmlTranspose(id), a mirrors half on MathmlTranspose for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_transpose_in_mathml_transpose_24phqlmpd3"() IS 'function of law Node(id) where kind = m:transpose in MathmlTranspose(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_true_in_mathml_true_g5nzippgrm"() IS 'function of law Node(id) where kind = m:true in MathmlTrue(id), a mirrors half on MathmlTrue for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_true_in_mathml_true_xf4oo4rkjf"() IS 'function of law Node(id) where kind = m:true in MathmlTrue(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_union_in_mathml_union_asjpuabtj5"() IS 'function of law Node(id) where kind = m:union in MathmlUnion(id), a mirrors half on MathmlUnion for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_union_in_mathml_union_377ivek72d"() IS 'function of law Node(id) where kind = m:union in MathmlUnion(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_uplimit_in_mathml_uplimit_efu7xyf3gp"() IS 'function of law Node(id) where kind = m:uplimit in MathmlUplimit(id), a mirrors half on MathmlUplimit for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_uplimit_in_mathml_uplimit_vzmfckvo6f"() IS 'function of law Node(id) where kind = m:uplimit in MathmlUplimit(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_variance_in_mathml_variance_x6skorio2a"() IS 'function of law Node(id) where kind = m:variance in MathmlVariance(id), a mirrors half on MathmlVariance for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_variance_in_mathml_variance_p5ksgee3xz"() IS 'function of law Node(id) where kind = m:variance in MathmlVariance(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_vector_in_mathml_vector_asbbvp7mpz"() IS 'function of law Node(id) where kind = m:vector in MathmlVector(id), a mirrors half on MathmlVector for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_vector_in_mathml_vector_gwgvbyf7cr"() IS 'function of law Node(id) where kind = m:vector in MathmlVector(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_vectorproduct_in_mathml_ltcjxjmhpk"() IS 'function of law Node(id) where kind = m:vectorproduct in MathmlVectorproduct(id), a mirrors half on MathmlVectorproduct for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_vectorproduct_in_mathml_cz3xw2gj6j"() IS 'function of law Node(id) where kind = m:vectorproduct in MathmlVectorproduct(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_xor_in_mathml_xor_guqc7z6i7r"() IS 'function of law Node(id) where kind = m:xor in MathmlXor(id), a mirrors half on MathmlXor for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_m_xor_in_mathml_xor_chlepwlhbp"() IS 'function of law Node(id) where kind = m:xor in MathmlXor(id), a mirrors half on Node for INSERT';

COMMENT ON CONSTRAINT "__mathml_abs_pk_hucciljvuc" ON "qti"."mathml_abs" IS 'primary key of MathmlAbs';

COMMENT ON CONSTRAINT "__mathml_align_pk_spbopkk52a" ON "qti"."mathml_align" IS 'primary key of MathmlAlign';

COMMENT ON CONSTRAINT "__mathml_alignmentscope_pk_5j2m2tmwew" ON "qti"."mathml_alignmentscope" IS 'primary key of MathmlAlignmentscope';

COMMENT ON CONSTRAINT "__mathml_altimg_valign_pk_tax7b3pgih" ON "qti"."mathml_altimg_valign" IS 'primary key of MathmlAltimgValign';

COMMENT ON CONSTRAINT "__mathml_and_pk_jw73inpo2q" ON "qti"."mathml_and" IS 'primary key of MathmlAnd';

COMMENT ON CONSTRAINT "__mathml_annotation_pk_a3jfd4zfby" ON "qti"."mathml_annotation" IS 'primary key of MathmlAnnotation';

COMMENT ON CONSTRAINT "__mathml_annotation_xml_pk_ogvjkq4svq" ON "qti"."mathml_annotation_xml" IS 'primary key of MathmlAnnotationXml';

COMMENT ON CONSTRAINT "__mathml_apply_pk_iat6cuzsil" ON "qti"."mathml_apply" IS 'primary key of MathmlApply';

COMMENT ON CONSTRAINT "__mathml_approx_pk_hovflobftx" ON "qti"."mathml_approx" IS 'primary key of MathmlApprox';

COMMENT ON CONSTRAINT "__mathml_arccos_pk_sly43ohb7m" ON "qti"."mathml_arccos" IS 'primary key of MathmlArccos';

COMMENT ON CONSTRAINT "__mathml_arccosh_pk_jqsf2d64fv" ON "qti"."mathml_arccosh" IS 'primary key of MathmlArccosh';

COMMENT ON CONSTRAINT "__mathml_arccot_pk_knncr72cc4" ON "qti"."mathml_arccot" IS 'primary key of MathmlArccot';

COMMENT ON CONSTRAINT "__mathml_arccoth_pk_gv3aywi3iv" ON "qti"."mathml_arccoth" IS 'primary key of MathmlArccoth';

COMMENT ON CONSTRAINT "__mathml_arccsc_pk_24nym44toy" ON "qti"."mathml_arccsc" IS 'primary key of MathmlArccsc';

COMMENT ON CONSTRAINT "__mathml_arccsch_pk_lax3m2rfbr" ON "qti"."mathml_arccsch" IS 'primary key of MathmlArccsch';

COMMENT ON CONSTRAINT "__mathml_arcsec_pk_jh5btryosu" ON "qti"."mathml_arcsec" IS 'primary key of MathmlArcsec';

COMMENT ON CONSTRAINT "__mathml_arcsech_pk_ekhim2vpkd" ON "qti"."mathml_arcsech" IS 'primary key of MathmlArcsech';

COMMENT ON CONSTRAINT "__mathml_arcsin_pk_aqgu6b6h43" ON "qti"."mathml_arcsin" IS 'primary key of MathmlArcsin';

COMMENT ON CONSTRAINT "__mathml_arcsinh_pk_s3gqyp5agb" ON "qti"."mathml_arcsinh" IS 'primary key of MathmlArcsinh';

COMMENT ON CONSTRAINT "__mathml_arctan_pk_iptuzawglm" ON "qti"."mathml_arctan" IS 'primary key of MathmlArctan';

COMMENT ON CONSTRAINT "__mathml_arctanh_pk_zthpcoz4y4" ON "qti"."mathml_arctanh" IS 'primary key of MathmlArctanh';

COMMENT ON CONSTRAINT "__mathml_arg_pk_5uyd3aiuis" ON "qti"."mathml_arg" IS 'primary key of MathmlArg';

COMMENT ON CONSTRAINT "__mathml_attribute_type_pk_qramxa4xpj" ON "qti"."mathml_attribute_type" IS 'primary key of MathmlAttributeType';

COMMENT ON CONSTRAINT "__mathml_attribute_type_key_kind_attribute_type_7hrobtsfzc" ON "qti"."mathml_attribute_type" IS 'key MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_background_pk_imcdsrfklf" ON "qti"."mathml_background" IS 'primary key of MathmlBackground';

COMMENT ON CONSTRAINT "__mathml_base_pk_4ax76ycale" ON "qti"."mathml_base" IS 'primary key of MathmlBase';

COMMENT ON CONSTRAINT "__mathml_bind_pk_lmtfs5wdtu" ON "qti"."mathml_bind" IS 'primary key of MathmlBind';

COMMENT ON CONSTRAINT "__mathml_boolean_pk_kv4tcarlxh" ON "qti"."mathml_boolean" IS 'primary key of MathmlBoolean';

COMMENT ON CONSTRAINT "__mathml_bvar_pk_kumvcg7aju" ON "qti"."mathml_bvar" IS 'primary key of MathmlBvar';

COMMENT ON CONSTRAINT "__mathml_card_pk_zmc4sn4gxs" ON "qti"."mathml_card" IS 'primary key of MathmlCard';

COMMENT ON CONSTRAINT "__mathml_cartesianproduct_pk_6s3ohgwkgj" ON "qti"."mathml_cartesianproduct" IS 'primary key of MathmlCartesianproduct';

COMMENT ON CONSTRAINT "__mathml_cbytes_pk_7nxaln5ng7" ON "qti"."mathml_cbytes" IS 'primary key of MathmlCbytes';

COMMENT ON CONSTRAINT "__mathml_cd_pk_sdihilsfdh" ON "qti"."mathml_cd" IS 'primary key of MathmlCd';

COMMENT ON CONSTRAINT "__mathml_cdgroup_pk_aluzdh3npv" ON "qti"."mathml_cdgroup" IS 'primary key of MathmlCdgroup';

COMMENT ON CONSTRAINT "__mathml_ceiling_pk_hmidbysivh" ON "qti"."mathml_ceiling" IS 'primary key of MathmlCeiling';

COMMENT ON CONSTRAINT "__mathml_cerror_pk_6askhivtn7" ON "qti"."mathml_cerror" IS 'primary key of MathmlCerror';

COMMENT ON CONSTRAINT "__mathml_character_pk_b3v2xnmkzt" ON "qti"."mathml_character" IS 'primary key of MathmlCharacter';

COMMENT ON CONSTRAINT "__mathml_charspacing_pk_podn6vduyc" ON "qti"."mathml_charspacing" IS 'primary key of MathmlCharspacing';

COMMENT ON CONSTRAINT "__mathml_ci_pk_7roiopxpf6" ON "qti"."mathml_ci" IS 'primary key of MathmlCi';

COMMENT ON CONSTRAINT "__mathml_class_pk_bsc5hnyg5a" ON "qti"."mathml_class" IS 'primary key of MathmlClass';

COMMENT ON CONSTRAINT "__mathml_closure_pk_76hriwrusy" ON "qti"."mathml_closure" IS 'primary key of MathmlClosure';

COMMENT ON CONSTRAINT "__mathml_cn_pk_dpnd5m3p2l" ON "qti"."mathml_cn" IS 'primary key of MathmlCn';

COMMENT ON CONSTRAINT "__mathml_codomain_pk_z4gtnssadn" ON "qti"."mathml_codomain" IS 'primary key of MathmlCodomain';

COMMENT ON CONSTRAINT "__mathml_color_pk_67shwpy7wl" ON "qti"."mathml_color" IS 'primary key of MathmlColor';

COMMENT ON CONSTRAINT "__mathml_columnalign_pk_qlgqmrqn3u" ON "qti"."mathml_columnalign" IS 'primary key of MathmlColumnalign';

COMMENT ON CONSTRAINT "__mathml_columnalignstyle_pk_e4qssz7eet" ON "qti"."mathml_columnalignstyle" IS 'primary key of MathmlColumnalignstyle';

COMMENT ON CONSTRAINT "__mathml_columnwidth_pk_2j3htaciiw" ON "qti"."mathml_columnwidth" IS 'primary key of MathmlColumnwidth';

COMMENT ON CONSTRAINT "__mathml_complexes_pk_msb6yntcdy" ON "qti"."mathml_complexes" IS 'primary key of MathmlComplexes';

COMMENT ON CONSTRAINT "__mathml_compose_pk_ghfnq2barf" ON "qti"."mathml_compose" IS 'primary key of MathmlCompose';

COMMENT ON CONSTRAINT "__mathml_condition_pk_nrr7zlirub" ON "qti"."mathml_condition" IS 'primary key of MathmlCondition';

COMMENT ON CONSTRAINT "__mathml_conjugate_pk_bshl6xva2p" ON "qti"."mathml_conjugate" IS 'primary key of MathmlConjugate';

COMMENT ON CONSTRAINT "__mathml_cos_pk_iyrbokgosb" ON "qti"."mathml_cos" IS 'primary key of MathmlCos';

COMMENT ON CONSTRAINT "__mathml_cosh_pk_ib7ukmk4li" ON "qti"."mathml_cosh" IS 'primary key of MathmlCosh';

COMMENT ON CONSTRAINT "__mathml_cot_pk_qgbilnxxlu" ON "qti"."mathml_cot" IS 'primary key of MathmlCot';

COMMENT ON CONSTRAINT "__mathml_coth_pk_fvgrpgocoi" ON "qti"."mathml_coth" IS 'primary key of MathmlCoth';

COMMENT ON CONSTRAINT "__mathml_crossout_pk_zkej6oxrlo" ON "qti"."mathml_crossout" IS 'primary key of MathmlCrossout';

COMMENT ON CONSTRAINT "__mathml_cs_pk_2zrmiwvcnx" ON "qti"."mathml_cs" IS 'primary key of MathmlCs';

COMMENT ON CONSTRAINT "__mathml_csc_pk_kzznwsh7id" ON "qti"."mathml_csc" IS 'primary key of MathmlCsc';

COMMENT ON CONSTRAINT "__mathml_csch_pk_3wqgytx7vm" ON "qti"."mathml_csch" IS 'primary key of MathmlCsch';

COMMENT ON CONSTRAINT "__mathml_csymbol_pk_4imvku3es7" ON "qti"."mathml_csymbol" IS 'primary key of MathmlCsymbol';

COMMENT ON CONSTRAINT "__mathml_curl_pk_hyvbirlnq6" ON "qti"."mathml_curl" IS 'primary key of MathmlCurl';

COMMENT ON CONSTRAINT "__mathml_declare_pk_jujqpwrdbs" ON "qti"."mathml_declare" IS 'primary key of MathmlDeclare';

COMMENT ON CONSTRAINT "__mathml_definition_url_pk_5wmyknzran" ON "qti"."mathml_definition_url" IS 'primary key of MathmlDefinitionUrl';

COMMENT ON CONSTRAINT "__mathml_degree_pk_y6s7c257dc" ON "qti"."mathml_degree" IS 'primary key of MathmlDegree';

COMMENT ON CONSTRAINT "__mathml_determinant_pk_f3zr2ei6qf" ON "qti"."mathml_determinant" IS 'primary key of MathmlDeterminant';

COMMENT ON CONSTRAINT "__mathml_diff_pk_ary5aecagc" ON "qti"."mathml_diff" IS 'primary key of MathmlDiff';

COMMENT ON CONSTRAINT "__mathml_dir_pk_4qgmqg5mr4" ON "qti"."mathml_dir" IS 'primary key of MathmlDir';

COMMENT ON CONSTRAINT "__mathml_display_pk_ba5nhocjjd" ON "qti"."mathml_display" IS 'primary key of MathmlDisplay';

COMMENT ON CONSTRAINT "__mathml_divergence_pk_7sqtzr4lqv" ON "qti"."mathml_divergence" IS 'primary key of MathmlDivergence';

COMMENT ON CONSTRAINT "__mathml_divide_pk_tbgykakero" ON "qti"."mathml_divide" IS 'primary key of MathmlDivide';

COMMENT ON CONSTRAINT "__mathml_domain_pk_7vtb3xlksn" ON "qti"."mathml_domain" IS 'primary key of MathmlDomain';

COMMENT ON CONSTRAINT "__mathml_domainofapplication_pk_lwgqgp6oyv" ON "qti"."mathml_domainofapplication" IS 'primary key of MathmlDomainofapplication';

COMMENT ON CONSTRAINT "__mathml_edge_pk_bjprodcabk" ON "qti"."mathml_edge" IS 'primary key of MathmlEdge';

COMMENT ON CONSTRAINT "__mathml_embed_source_pk_zryrs25yto" ON "qti"."mathml_embed_source" IS 'primary key of MathmlEmbedSource';

COMMENT ON CONSTRAINT "__mathml_emptyset_pk_s4p74irf4w" ON "qti"."mathml_emptyset" IS 'primary key of MathmlEmptyset';

COMMENT ON CONSTRAINT "__mathml_eq_pk_fe33v5ncuy" ON "qti"."mathml_eq" IS 'primary key of MathmlEq';

COMMENT ON CONSTRAINT "__mathml_equivalent_pk_6pand4s3xk" ON "qti"."mathml_equivalent" IS 'primary key of MathmlEquivalent';

COMMENT ON CONSTRAINT "__mathml_eulergamma_pk_srfpk4myeb" ON "qti"."mathml_eulergamma" IS 'primary key of MathmlEulergamma';

COMMENT ON CONSTRAINT "__mathml_exists_pk_wiuqp3gl6c" ON "qti"."mathml_exists" IS 'primary key of MathmlExists';

COMMENT ON CONSTRAINT "__mathml_exp_pk_7dewuzpzyh" ON "qti"."mathml_exp" IS 'primary key of MathmlExp';

COMMENT ON CONSTRAINT "__mathml_exponentiale_pk_gxxf2gdgwq" ON "qti"."mathml_exponentiale" IS 'primary key of MathmlExponentiale';

COMMENT ON CONSTRAINT "__mathml_factorial_pk_dwumhafn75" ON "qti"."mathml_factorial" IS 'primary key of MathmlFactorial';

COMMENT ON CONSTRAINT "__mathml_factorof_pk_pg4uscss2n" ON "qti"."mathml_factorof" IS 'primary key of MathmlFactorof';

COMMENT ON CONSTRAINT "__mathml_false_pk_nivtqisyho" ON "qti"."mathml_false" IS 'primary key of MathmlFalse';

COMMENT ON CONSTRAINT "__mathml_floor_pk_lwm5jxi6mh" ON "qti"."mathml_floor" IS 'primary key of MathmlFloor';

COMMENT ON CONSTRAINT "__mathml_fn_pk_xezahxuedc" ON "qti"."mathml_fn" IS 'primary key of MathmlFn';

COMMENT ON CONSTRAINT "__mathml_fontstyle_pk_lev4zd4qbo" ON "qti"."mathml_fontstyle" IS 'primary key of MathmlFontstyle';

COMMENT ON CONSTRAINT "__mathml_fontweight_pk_rlk3zhriht" ON "qti"."mathml_fontweight" IS 'primary key of MathmlFontweight';

COMMENT ON CONSTRAINT "__mathml_forall_pk_4qscrs67e7" ON "qti"."mathml_forall" IS 'primary key of MathmlForall';

COMMENT ON CONSTRAINT "__mathml_form_pk_v5wf6u64cz" ON "qti"."mathml_form" IS 'primary key of MathmlForm';

COMMENT ON CONSTRAINT "__mathml_framespacing_pk_7cbxah5wgr" ON "qti"."mathml_framespacing" IS 'primary key of MathmlFramespacing';

COMMENT ON CONSTRAINT "__mathml_gcd_pk_vd3bfxpjbn" ON "qti"."mathml_gcd" IS 'primary key of MathmlGcd';

COMMENT ON CONSTRAINT "__mathml_geq_pk_2224hapba4" ON "qti"."mathml_geq" IS 'primary key of MathmlGeq';

COMMENT ON CONSTRAINT "__mathml_grad_pk_n5apm6mpgd" ON "qti"."mathml_grad" IS 'primary key of MathmlGrad';

COMMENT ON CONSTRAINT "__mathml_group_alignment_pk_pvlhrt6av4" ON "qti"."mathml_group_alignment" IS 'primary key of MathmlGroupAlignment';

COMMENT ON CONSTRAINT "__mathml_group_alignment_list_pk_lzytwsbxtd" ON "qti"."mathml_group_alignment_list" IS 'primary key of MathmlGroupAlignmentList';

COMMENT ON CONSTRAINT "__mathml_group_alignment_list_list_pk_l6rk3bl5ze" ON "qti"."mathml_group_alignment_list_list" IS 'primary key of MathmlGroupAlignmentListList';

COMMENT ON CONSTRAINT "__mathml_gt_pk_iv5fhserov" ON "qti"."mathml_gt" IS 'primary key of MathmlGt';

COMMENT ON CONSTRAINT "__mathml_href_pk_rij2xe3ac6" ON "qti"."mathml_href" IS 'primary key of MathmlHref';

COMMENT ON CONSTRAINT "__mathml_ident_pk_5bqydltnjw" ON "qti"."mathml_ident" IS 'primary key of MathmlIdent';

COMMENT ON CONSTRAINT "__mathml_image_pk_lmpcrtxzyf" ON "qti"."mathml_image" IS 'primary key of MathmlImage';

COMMENT ON CONSTRAINT "__mathml_imaginary_pk_6ee3kp6p6y" ON "qti"."mathml_imaginary" IS 'primary key of MathmlImaginary';

COMMENT ON CONSTRAINT "__mathml_imaginaryi_pk_sjtxqngldt" ON "qti"."mathml_imaginaryi" IS 'primary key of MathmlImaginaryi';

COMMENT ON CONSTRAINT "__mathml_implies_pk_wcuyghyz7v" ON "qti"."mathml_implies" IS 'primary key of MathmlImplies';

COMMENT ON CONSTRAINT "__mathml_in_pk_2caccif6tt" ON "qti"."mathml_in" IS 'primary key of MathmlIn';

COMMENT ON CONSTRAINT "__mathml_indentalign_pk_jcyhcxinvm" ON "qti"."mathml_indentalign" IS 'primary key of MathmlIndentalign';

COMMENT ON CONSTRAINT "__mathml_indentalign_line_pk_ifrhss5ifz" ON "qti"."mathml_indentalign_line" IS 'primary key of MathmlIndentalignLine';

COMMENT ON CONSTRAINT "__mathml_indentshift_line_pk_fhqs7kzhxl" ON "qti"."mathml_indentshift_line" IS 'primary key of MathmlIndentshiftLine';

COMMENT ON CONSTRAINT "__mathml_index_pk_xeqono4wex" ON "qti"."mathml_index" IS 'primary key of MathmlIndex';

COMMENT ON CONSTRAINT "__mathml_infinity_pk_lapxeb7hrx" ON "qti"."mathml_infinity" IS 'primary key of MathmlInfinity';

COMMENT ON CONSTRAINT "__mathml_infixlinebreakstyle_pk_rl3rfbiesh" ON "qti"."mathml_infixlinebreakstyle" IS 'primary key of MathmlInfixlinebreakstyle';

COMMENT ON CONSTRAINT "__mathml_int_pk_wphi7wuvhb" ON "qti"."mathml_int" IS 'primary key of MathmlInt';

COMMENT ON CONSTRAINT "__mathml_integers_pk_4qvf55h2j5" ON "qti"."mathml_integers" IS 'primary key of MathmlIntegers';

COMMENT ON CONSTRAINT "__mathml_intersect_pk_tsrhfksty3" ON "qti"."mathml_intersect" IS 'primary key of MathmlIntersect';

COMMENT ON CONSTRAINT "__mathml_interval_pk_tj2lduq6mb" ON "qti"."mathml_interval" IS 'primary key of MathmlInterval';

COMMENT ON CONSTRAINT "__mathml_inverse_pk_sfstgvcadu" ON "qti"."mathml_inverse" IS 'primary key of MathmlInverse';

COMMENT ON CONSTRAINT "__mathml_lambda_pk_nadngvdxhz" ON "qti"."mathml_lambda" IS 'primary key of MathmlLambda';

COMMENT ON CONSTRAINT "__mathml_laplacian_pk_me5wgce7qb" ON "qti"."mathml_laplacian" IS 'primary key of MathmlLaplacian';

COMMENT ON CONSTRAINT "__mathml_lcm_pk_pzzpykjtun" ON "qti"."mathml_lcm" IS 'primary key of MathmlLcm';

COMMENT ON CONSTRAINT "__mathml_length_pk_ih2ulimeee" ON "qti"."mathml_length" IS 'primary key of MathmlLength';

COMMENT ON CONSTRAINT "__mathml_length_list_pk_k56ycdddpd" ON "qti"."mathml_length_list" IS 'primary key of MathmlLengthList';

COMMENT ON CONSTRAINT "__mathml_leq_pk_hgo3uq5s6o" ON "qti"."mathml_leq" IS 'primary key of MathmlLeq';

COMMENT ON CONSTRAINT "__mathml_limit_pk_f3sswpzlrp" ON "qti"."mathml_limit" IS 'primary key of MathmlLimit';

COMMENT ON CONSTRAINT "__mathml_line_thickness_pk_wg2hacvqxj" ON "qti"."mathml_line_thickness" IS 'primary key of MathmlLineThickness';

COMMENT ON CONSTRAINT "__mathml_linebreak_pk_2wn2b2nfk5" ON "qti"."mathml_linebreak" IS 'primary key of MathmlLinebreak';

COMMENT ON CONSTRAINT "__mathml_linebreakstyle_pk_dnrkmzlndr" ON "qti"."mathml_linebreakstyle" IS 'primary key of MathmlLinebreakstyle';

COMMENT ON CONSTRAINT "__mathml_linestyle_pk_lw7x4rsxx6" ON "qti"."mathml_linestyle" IS 'primary key of MathmlLinestyle';

COMMENT ON CONSTRAINT "__mathml_linestyle_list_pk_cvihfotmbq" ON "qti"."mathml_linestyle_list" IS 'primary key of MathmlLinestyleList';

COMMENT ON CONSTRAINT "__mathml_list_pk_s4rsre3tuu" ON "qti"."mathml_list" IS 'primary key of MathmlList';

COMMENT ON CONSTRAINT "__mathml_ln_pk_hwmnitfyy2" ON "qti"."mathml_ln" IS 'primary key of MathmlLn';

COMMENT ON CONSTRAINT "__mathml_location_pk_zid6mwzl4l" ON "qti"."mathml_location" IS 'primary key of MathmlLocation';

COMMENT ON CONSTRAINT "__mathml_log_pk_jk6drbwm25" ON "qti"."mathml_log" IS 'primary key of MathmlLog';

COMMENT ON CONSTRAINT "__mathml_logbase_pk_st4e3wlusv" ON "qti"."mathml_logbase" IS 'primary key of MathmlLogbase';

COMMENT ON CONSTRAINT "__mathml_longdivstyle_pk_c62quk5tx5" ON "qti"."mathml_longdivstyle" IS 'primary key of MathmlLongdivstyle';

COMMENT ON CONSTRAINT "__mathml_lowlimit_pk_4lzynrjor5" ON "qti"."mathml_lowlimit" IS 'primary key of MathmlLowlimit';

COMMENT ON CONSTRAINT "__mathml_lt_pk_tsrdgcpid4" ON "qti"."mathml_lt" IS 'primary key of MathmlLt';

COMMENT ON CONSTRAINT "__mathml_maction_pk_sv7moxq64w" ON "qti"."mathml_maction" IS 'primary key of MathmlMaction';

COMMENT ON CONSTRAINT "__mathml_maligngroup_pk_z7y7sdtbou" ON "qti"."mathml_maligngroup" IS 'primary key of MathmlMaligngroup';

COMMENT ON CONSTRAINT "__mathml_malignmark_pk_llh4wjpbys" ON "qti"."mathml_malignmark" IS 'primary key of MathmlMalignmark';

COMMENT ON CONSTRAINT "__mathml_math_pk_6ndspf45bj" ON "qti"."mathml_math" IS 'primary key of MathmlMath';

COMMENT ON CONSTRAINT "__mathml_mathsize_pk_xnvckgrtcm" ON "qti"."mathml_mathsize" IS 'primary key of MathmlMathsize';

COMMENT ON CONSTRAINT "__mathml_mathvariant_pk_pap3seq5ll" ON "qti"."mathml_mathvariant" IS 'primary key of MathmlMathvariant';

COMMENT ON CONSTRAINT "__mathml_matrix_pk_jkafef3yce" ON "qti"."mathml_matrix" IS 'primary key of MathmlMatrix';

COMMENT ON CONSTRAINT "__mathml_matrixrow_pk_ws7xvp33ds" ON "qti"."mathml_matrixrow" IS 'primary key of MathmlMatrixrow';

COMMENT ON CONSTRAINT "__mathml_max_pk_uswcbzgsc4" ON "qti"."mathml_max" IS 'primary key of MathmlMax';

COMMENT ON CONSTRAINT "__mathml_maxsize_pk_2jngq56a5g" ON "qti"."mathml_maxsize" IS 'primary key of MathmlMaxsize';

COMMENT ON CONSTRAINT "__mathml_mean_pk_2um5ska26t" ON "qti"."mathml_mean" IS 'primary key of MathmlMean';

COMMENT ON CONSTRAINT "__mathml_median_pk_7rmns54xzb" ON "qti"."mathml_median" IS 'primary key of MathmlMedian';

COMMENT ON CONSTRAINT "__mathml_menclose_pk_cbyw4rpe7m" ON "qti"."mathml_menclose" IS 'primary key of MathmlMenclose';

COMMENT ON CONSTRAINT "__mathml_merror_pk_wj4dgt6bdu" ON "qti"."mathml_merror" IS 'primary key of MathmlMerror';

COMMENT ON CONSTRAINT "__mathml_mfenced_pk_vs6hkdapk3" ON "qti"."mathml_mfenced" IS 'primary key of MathmlMfenced';

COMMENT ON CONSTRAINT "__mathml_mfrac_pk_ngogii2rh2" ON "qti"."mathml_mfrac" IS 'primary key of MathmlMfrac';

COMMENT ON CONSTRAINT "__mathml_mglyph_pk_w3423ldx7b" ON "qti"."mathml_mglyph" IS 'primary key of MathmlMglyph';

COMMENT ON CONSTRAINT "__mathml_mi_pk_dj67agdwvi" ON "qti"."mathml_mi" IS 'primary key of MathmlMi';

COMMENT ON CONSTRAINT "__mathml_min_pk_fdbsl432kc" ON "qti"."mathml_min" IS 'primary key of MathmlMin';

COMMENT ON CONSTRAINT "__mathml_minus_pk_ilnyhxamsb" ON "qti"."mathml_minus" IS 'primary key of MathmlMinus';

COMMENT ON CONSTRAINT "__mathml_mlabeledtr_pk_fxkbfct7gc" ON "qti"."mathml_mlabeledtr" IS 'primary key of MathmlMlabeledtr';

COMMENT ON CONSTRAINT "__mathml_mlongdiv_pk_vj4adgeja6" ON "qti"."mathml_mlongdiv" IS 'primary key of MathmlMlongdiv';

COMMENT ON CONSTRAINT "__mathml_mmultiscripts_pk_pmnb6xiitc" ON "qti"."mathml_mmultiscripts" IS 'primary key of MathmlMmultiscripts';

COMMENT ON CONSTRAINT "__mathml_mn_pk_hubxp2rcoz" ON "qti"."mathml_mn" IS 'primary key of MathmlMn';

COMMENT ON CONSTRAINT "__mathml_mo_pk_zdqzlywwia" ON "qti"."mathml_mo" IS 'primary key of MathmlMo';

COMMENT ON CONSTRAINT "__mathml_mode_pk_oqoi6cl6f3" ON "qti"."mathml_mode" IS 'primary key of MathmlMode';

COMMENT ON CONSTRAINT "__mathml_moment_pk_fhoadrgmlw" ON "qti"."mathml_moment" IS 'primary key of MathmlMoment';

COMMENT ON CONSTRAINT "__mathml_momentabout_pk_fpbmpmufdt" ON "qti"."mathml_momentabout" IS 'primary key of MathmlMomentabout';

COMMENT ON CONSTRAINT "__mathml_mover_pk_2akw5uzgqy" ON "qti"."mathml_mover" IS 'primary key of MathmlMover';

COMMENT ON CONSTRAINT "__mathml_mpadded_pk_p7hxm56itk" ON "qti"."mathml_mpadded" IS 'primary key of MathmlMpadded';

COMMENT ON CONSTRAINT "__mathml_mpadded_length_pk_shec52pc2m" ON "qti"."mathml_mpadded_length" IS 'primary key of MathmlMpaddedLength';

COMMENT ON CONSTRAINT "__mathml_mphantom_pk_v3xkr7ih4a" ON "qti"."mathml_mphantom" IS 'primary key of MathmlMphantom';

COMMENT ON CONSTRAINT "__mathml_mprescripts_pk_xmvsfxpa3b" ON "qti"."mathml_mprescripts" IS 'primary key of MathmlMprescripts';

COMMENT ON CONSTRAINT "__mathml_mroot_pk_5oaf67cx3e" ON "qti"."mathml_mroot" IS 'primary key of MathmlMroot';

COMMENT ON CONSTRAINT "__mathml_mrow_pk_zkclylutru" ON "qti"."mathml_mrow" IS 'primary key of MathmlMrow';

COMMENT ON CONSTRAINT "__mathml_ms_pk_24mblluiud" ON "qti"."mathml_ms" IS 'primary key of MathmlMs';

COMMENT ON CONSTRAINT "__mathml_mscarries_pk_vo6z7ekh65" ON "qti"."mathml_mscarries" IS 'primary key of MathmlMscarries';

COMMENT ON CONSTRAINT "__mathml_mscarry_pk_il2an5yjbp" ON "qti"."mathml_mscarry" IS 'primary key of MathmlMscarry';

COMMENT ON CONSTRAINT "__mathml_msgroup_pk_4dgrr4uivs" ON "qti"."mathml_msgroup" IS 'primary key of MathmlMsgroup';

COMMENT ON CONSTRAINT "__mathml_msline_pk_z2ec6cszl2" ON "qti"."mathml_msline" IS 'primary key of MathmlMsline';

COMMENT ON CONSTRAINT "__mathml_mspace_pk_ofshuqznhw" ON "qti"."mathml_mspace" IS 'primary key of MathmlMspace';

COMMENT ON CONSTRAINT "__mathml_mspace_linebreak_pk_aewqpgnex7" ON "qti"."mathml_mspace_linebreak" IS 'primary key of MathmlMspaceLinebreak';

COMMENT ON CONSTRAINT "__mathml_msqrt_pk_fbdhvsansm" ON "qti"."mathml_msqrt" IS 'primary key of MathmlMsqrt';

COMMENT ON CONSTRAINT "__mathml_msrow_pk_wgbgeayybx" ON "qti"."mathml_msrow" IS 'primary key of MathmlMsrow';

COMMENT ON CONSTRAINT "__mathml_mstack_pk_tn422snrrf" ON "qti"."mathml_mstack" IS 'primary key of MathmlMstack';

COMMENT ON CONSTRAINT "__mathml_mstyle_pk_alf4czhnhl" ON "qti"."mathml_mstyle" IS 'primary key of MathmlMstyle';

COMMENT ON CONSTRAINT "__mathml_msub_pk_w4ch2psuev" ON "qti"."mathml_msub" IS 'primary key of MathmlMsub';

COMMENT ON CONSTRAINT "__mathml_msubsup_pk_tnugc2fkfn" ON "qti"."mathml_msubsup" IS 'primary key of MathmlMsubsup';

COMMENT ON CONSTRAINT "__mathml_msup_pk_j3mybqwnte" ON "qti"."mathml_msup" IS 'primary key of MathmlMsup';

COMMENT ON CONSTRAINT "__mathml_mtable_pk_lmswlnvgad" ON "qti"."mathml_mtable" IS 'primary key of MathmlMtable';

COMMENT ON CONSTRAINT "__mathml_mtd_pk_ejqhfxjflw" ON "qti"."mathml_mtd" IS 'primary key of MathmlMtd';

COMMENT ON CONSTRAINT "__mathml_mtext_pk_emehgah3gk" ON "qti"."mathml_mtext" IS 'primary key of MathmlMtext';

COMMENT ON CONSTRAINT "__mathml_mtr_pk_6zq6li53in" ON "qti"."mathml_mtr" IS 'primary key of MathmlMtr';

COMMENT ON CONSTRAINT "__mathml_munder_pk_zfr5ikfrcm" ON "qti"."mathml_munder" IS 'primary key of MathmlMunder';

COMMENT ON CONSTRAINT "__mathml_munderover_pk_3gqwqo5bwv" ON "qti"."mathml_munderover" IS 'primary key of MathmlMunderover';

COMMENT ON CONSTRAINT "__mathml_name_pk_yurbr2qi3b" ON "qti"."mathml_name" IS 'primary key of MathmlName';

COMMENT ON CONSTRAINT "__mathml_nargs_pk_tqbtaq4xjt" ON "qti"."mathml_nargs" IS 'primary key of MathmlNargs';

COMMENT ON CONSTRAINT "__mathml_naturalnumbers_pk_gepeubh6pd" ON "qti"."mathml_naturalnumbers" IS 'primary key of MathmlNaturalnumbers';

COMMENT ON CONSTRAINT "__mathml_neq_pk_wg7ikknfqi" ON "qti"."mathml_neq" IS 'primary key of MathmlNeq';

COMMENT ON CONSTRAINT "__mathml_none_pk_i4bfuonw6t" ON "qti"."mathml_none" IS 'primary key of MathmlNone';

COMMENT ON CONSTRAINT "__mathml_not_pk_cjauwdxwyy" ON "qti"."mathml_not" IS 'primary key of MathmlNot';

COMMENT ON CONSTRAINT "__mathml_notanumber_pk_ac7bxenbbv" ON "qti"."mathml_notanumber" IS 'primary key of MathmlNotanumber';

COMMENT ON CONSTRAINT "__mathml_notin_pk_ip23npzov7" ON "qti"."mathml_notin" IS 'primary key of MathmlNotin';

COMMENT ON CONSTRAINT "__mathml_notprsubset_pk_xxbik5oww4" ON "qti"."mathml_notprsubset" IS 'primary key of MathmlNotprsubset';

COMMENT ON CONSTRAINT "__mathml_notsubset_pk_ambcjzkxsm" ON "qti"."mathml_notsubset" IS 'primary key of MathmlNotsubset';

COMMENT ON CONSTRAINT "__mathml_number_pk_4ixs2asj5j" ON "qti"."mathml_number" IS 'primary key of MathmlNumber';

COMMENT ON CONSTRAINT "__mathml_occurrence_pk_keux2e5n4v" ON "qti"."mathml_occurrence" IS 'primary key of MathmlOccurrence';

COMMENT ON CONSTRAINT "__mathml_or_pk_odhs6xzs65" ON "qti"."mathml_or" IS 'primary key of MathmlOr';

COMMENT ON CONSTRAINT "__mathml_order_pk_ahbjyfcwav" ON "qti"."mathml_order" IS 'primary key of MathmlOrder';

COMMENT ON CONSTRAINT "__mathml_otherwise_pk_42k4ua6764" ON "qti"."mathml_otherwise" IS 'primary key of MathmlOtherwise';

COMMENT ON CONSTRAINT "__mathml_outerproduct_pk_32ihez7dtr" ON "qti"."mathml_outerproduct" IS 'primary key of MathmlOuterproduct';

COMMENT ON CONSTRAINT "__mathml_overflow_pk_yj5w6delaf" ON "qti"."mathml_overflow" IS 'primary key of MathmlOverflow';

COMMENT ON CONSTRAINT "__mathml_partialdiff_pk_4c725jz6tm" ON "qti"."mathml_partialdiff" IS 'primary key of MathmlPartialdiff';

COMMENT ON CONSTRAINT "__mathml_pi_pk_lkphvhzqm4" ON "qti"."mathml_pi" IS 'primary key of MathmlPi';

COMMENT ON CONSTRAINT "__mathml_piece_pk_jhi4z5vfaj" ON "qti"."mathml_piece" IS 'primary key of MathmlPiece';

COMMENT ON CONSTRAINT "__mathml_piecewise_pk_bws2kbta6a" ON "qti"."mathml_piecewise" IS 'primary key of MathmlPiecewise';

COMMENT ON CONSTRAINT "__mathml_plus_pk_qmu4a3yce2" ON "qti"."mathml_plus" IS 'primary key of MathmlPlus';

COMMENT ON CONSTRAINT "__mathml_position_pk_pcmt7uozpj" ON "qti"."mathml_position" IS 'primary key of MathmlPosition';

COMMENT ON CONSTRAINT "__mathml_power_pk_bdzmzcyksw" ON "qti"."mathml_power" IS 'primary key of MathmlPower';

COMMENT ON CONSTRAINT "__mathml_primes_pk_3vwk53txtl" ON "qti"."mathml_primes" IS 'primary key of MathmlPrimes';

COMMENT ON CONSTRAINT "__mathml_product_pk_2ysqywxodg" ON "qti"."mathml_product" IS 'primary key of MathmlProduct';

COMMENT ON CONSTRAINT "__mathml_prsubset_pk_v4ekn7vc5v" ON "qti"."mathml_prsubset" IS 'primary key of MathmlPrsubset';

COMMENT ON CONSTRAINT "__mathml_quotient_pk_ckngifwgk2" ON "qti"."mathml_quotient" IS 'primary key of MathmlQuotient';

COMMENT ON CONSTRAINT "__mathml_rationals_pk_2zgm3diqhf" ON "qti"."mathml_rationals" IS 'primary key of MathmlRationals';

COMMENT ON CONSTRAINT "__mathml_real_pk_gh6gthzfhz" ON "qti"."mathml_real" IS 'primary key of MathmlReal';

COMMENT ON CONSTRAINT "__mathml_reals_pk_33dhipsot2" ON "qti"."mathml_reals" IS 'primary key of MathmlReals';

COMMENT ON CONSTRAINT "__mathml_reln_pk_hhmpay7biq" ON "qti"."mathml_reln" IS 'primary key of MathmlReln';

COMMENT ON CONSTRAINT "__mathml_rem_pk_michkixgqe" ON "qti"."mathml_rem" IS 'primary key of MathmlRem';

COMMENT ON CONSTRAINT "__mathml_root_pk_qesh5gl6as" ON "qti"."mathml_root" IS 'primary key of MathmlRoot';

COMMENT ON CONSTRAINT "__mathml_rowalign_pk_am3tfhq6kv" ON "qti"."mathml_rowalign" IS 'primary key of MathmlRowalign';

COMMENT ON CONSTRAINT "__mathml_scalarproduct_pk_qrkhbhsldx" ON "qti"."mathml_scalarproduct" IS 'primary key of MathmlScalarproduct';

COMMENT ON CONSTRAINT "__mathml_scriptlevel_pk_gstmxit44p" ON "qti"."mathml_scriptlevel" IS 'primary key of MathmlScriptlevel';

COMMENT ON CONSTRAINT "__mathml_sdev_pk_olds5doftj" ON "qti"."mathml_sdev" IS 'primary key of MathmlSdev';

COMMENT ON CONSTRAINT "__mathml_sec_pk_vvtnum3p6i" ON "qti"."mathml_sec" IS 'primary key of MathmlSec';

COMMENT ON CONSTRAINT "__mathml_sech_pk_zqwswxkqac" ON "qti"."mathml_sech" IS 'primary key of MathmlSech';

COMMENT ON CONSTRAINT "__mathml_selection_pk_4irhvtro54" ON "qti"."mathml_selection" IS 'primary key of MathmlSelection';

COMMENT ON CONSTRAINT "__mathml_selector_pk_znomsndex3" ON "qti"."mathml_selector" IS 'primary key of MathmlSelector';

COMMENT ON CONSTRAINT "__mathml_semantics_pk_22lxzdwdcv" ON "qti"."mathml_semantics" IS 'primary key of MathmlSemantics';

COMMENT ON CONSTRAINT "__mathml_semantics_ci_pk_dz2u2svnkw" ON "qti"."mathml_semantics_ci" IS 'primary key of MathmlSemanticsCi';

COMMENT ON CONSTRAINT "__mathml_sep_pk_oxs7uhqvii" ON "qti"."mathml_sep" IS 'primary key of MathmlSep';

COMMENT ON CONSTRAINT "__mathml_set_pk_np327z4b4w" ON "qti"."mathml_set" IS 'primary key of MathmlSet';

COMMENT ON CONSTRAINT "__mathml_setdiff_pk_buas5z7kvp" ON "qti"."mathml_setdiff" IS 'primary key of MathmlSetdiff';

COMMENT ON CONSTRAINT "__mathml_share_pk_qeqnt2zsce" ON "qti"."mathml_share" IS 'primary key of MathmlShare';

COMMENT ON CONSTRAINT "__mathml_shift_pk_sltmrwz3yh" ON "qti"."mathml_shift" IS 'primary key of MathmlShift';

COMMENT ON CONSTRAINT "__mathml_side_pk_5ujknwlvcu" ON "qti"."mathml_side" IS 'primary key of MathmlSide';

COMMENT ON CONSTRAINT "__mathml_sin_pk_5uwylz5et4" ON "qti"."mathml_sin" IS 'primary key of MathmlSin';

COMMENT ON CONSTRAINT "__mathml_sinh_pk_mi4u76twwx" ON "qti"."mathml_sinh" IS 'primary key of MathmlSinh';

COMMENT ON CONSTRAINT "__mathml_span_pk_iulnubivfa" ON "qti"."mathml_span" IS 'primary key of MathmlSpan';

COMMENT ON CONSTRAINT "__mathml_src_pk_ww6r4kokvj" ON "qti"."mathml_src" IS 'primary key of MathmlSrc';

COMMENT ON CONSTRAINT "__mathml_string_pk_wgbza2ry76" ON "qti"."mathml_string" IS 'primary key of MathmlString';

COMMENT ON CONSTRAINT "__mathml_subset_pk_igstholb2c" ON "qti"."mathml_subset" IS 'primary key of MathmlSubset';

COMMENT ON CONSTRAINT "__mathml_sum_pk_ghqoxzuz23" ON "qti"."mathml_sum" IS 'primary key of MathmlSum';

COMMENT ON CONSTRAINT "__mathml_table_width_pk_54aeobjlmf" ON "qti"."mathml_table_width" IS 'primary key of MathmlTableWidth';

COMMENT ON CONSTRAINT "__mathml_tan_pk_tlqz4tip3u" ON "qti"."mathml_tan" IS 'primary key of MathmlTan';

COMMENT ON CONSTRAINT "__mathml_tanh_pk_xhtodkw23e" ON "qti"."mathml_tanh" IS 'primary key of MathmlTanh';

COMMENT ON CONSTRAINT "__mathml_tendsto_pk_pcrc6gn4rm" ON "qti"."mathml_tendsto" IS 'primary key of MathmlTendsto';

COMMENT ON CONSTRAINT "__mathml_times_pk_vrt7m653al" ON "qti"."mathml_times" IS 'primary key of MathmlTimes';

COMMENT ON CONSTRAINT "__mathml_transpose_pk_xsvprlzone" ON "qti"."mathml_transpose" IS 'primary key of MathmlTranspose';

COMMENT ON CONSTRAINT "__mathml_true_pk_5zwekabkun" ON "qti"."mathml_true" IS 'primary key of MathmlTrue';

COMMENT ON CONSTRAINT "__mathml_union_pk_4kksxl2qot" ON "qti"."mathml_union" IS 'primary key of MathmlUnion';

COMMENT ON CONSTRAINT "__mathml_unsigned_integer_pk_35uxbmwnpm" ON "qti"."mathml_unsigned_integer" IS 'primary key of MathmlUnsignedInteger';

COMMENT ON CONSTRAINT "__mathml_uplimit_pk_vbjna7eati" ON "qti"."mathml_uplimit" IS 'primary key of MathmlUplimit';

COMMENT ON CONSTRAINT "__mathml_variance_pk_zfdbnlxeic" ON "qti"."mathml_variance" IS 'primary key of MathmlVariance';

COMMENT ON CONSTRAINT "__mathml_vector_pk_xg6bz7i7ip" ON "qti"."mathml_vector" IS 'primary key of MathmlVector';

COMMENT ON CONSTRAINT "__mathml_vectorproduct_pk_xdk2c6tmjr" ON "qti"."mathml_vectorproduct" IS 'primary key of MathmlVectorproduct';

COMMENT ON CONSTRAINT "__mathml_verticalalign_pk_53tk5zcmwj" ON "qti"."mathml_verticalalign" IS 'primary key of MathmlVerticalalign';

COMMENT ON CONSTRAINT "__mathml_xor_pk_2xwqxxiu6f" ON "qti"."mathml_xor" IS 'primary key of MathmlXor';

COMMENT ON COLUMN "qti"."mathml_abs"."__tag_kind_m_abs_5ggr4en2fg" IS 'tag Node.kind = m:abs';

COMMENT ON COLUMN "qti"."mathml_align"."__tag_type_align_rz4q2q2vpi" IS 'tag MathmlAttributeType.type = align';

COMMENT ON COLUMN "qti"."mathml_alignmentscope"."__tag_type_alignmentscope_ksiai53b3c" IS 'tag MathmlAttributeType.type = alignmentscope';

COMMENT ON COLUMN "qti"."mathml_altimg_valign"."__tag_type_altimg_valign_4g6yyfcca6" IS 'tag MathmlAttributeType.type = altimg-valign';

COMMENT ON COLUMN "qti"."mathml_and"."__tag_kind_m_and_eisrasbaaj" IS 'tag Node.kind = m:and';

COMMENT ON COLUMN "qti"."mathml_annotation"."__tag_kind_m_annotation_ze5ecrwj65" IS 'tag Node.kind = m:annotation';

COMMENT ON COLUMN "qti"."mathml_annotation_xml"."__tag_kind_m_annotation_xml_wd6za7y2z6" IS 'tag Node.kind = m:annotation-xml';

COMMENT ON COLUMN "qti"."mathml_apply"."__tag_kind_m_apply_bengchb6nb" IS 'tag Node.kind = m:apply';

COMMENT ON COLUMN "qti"."mathml_approx"."__tag_kind_m_approx_ybgbzwajac" IS 'tag Node.kind = m:approx';

COMMENT ON COLUMN "qti"."mathml_arccos"."__tag_kind_m_arccos_ytmvopxit3" IS 'tag Node.kind = m:arccos';

COMMENT ON COLUMN "qti"."mathml_arccosh"."__tag_kind_m_arccosh_cnra4q6n4l" IS 'tag Node.kind = m:arccosh';

COMMENT ON COLUMN "qti"."mathml_arccot"."__tag_kind_m_arccot_63he22ouqq" IS 'tag Node.kind = m:arccot';

COMMENT ON COLUMN "qti"."mathml_arccoth"."__tag_kind_m_arccoth_3luoi3xwu7" IS 'tag Node.kind = m:arccoth';

COMMENT ON COLUMN "qti"."mathml_arccsc"."__tag_kind_m_arccsc_rnbrap3tp7" IS 'tag Node.kind = m:arccsc';

COMMENT ON COLUMN "qti"."mathml_arccsch"."__tag_kind_m_arccsch_rmwi7hbeqe" IS 'tag Node.kind = m:arccsch';

COMMENT ON COLUMN "qti"."mathml_arcsec"."__tag_kind_m_arcsec_psxegloodo" IS 'tag Node.kind = m:arcsec';

COMMENT ON COLUMN "qti"."mathml_arcsech"."__tag_kind_m_arcsech_i6dbeh5zx5" IS 'tag Node.kind = m:arcsech';

COMMENT ON COLUMN "qti"."mathml_arcsin"."__tag_kind_m_arcsin_ctwb3wrgwt" IS 'tag Node.kind = m:arcsin';

COMMENT ON COLUMN "qti"."mathml_arcsinh"."__tag_kind_m_arcsinh_3dysnvaqqn" IS 'tag Node.kind = m:arcsinh';

COMMENT ON COLUMN "qti"."mathml_arctan"."__tag_kind_m_arctan_soi2gc3vnc" IS 'tag Node.kind = m:arctan';

COMMENT ON COLUMN "qti"."mathml_arctanh"."__tag_kind_m_arctanh_zaaffkrj3r" IS 'tag Node.kind = m:arctanh';

COMMENT ON COLUMN "qti"."mathml_arg"."__tag_kind_m_arg_7stlghlgbd" IS 'tag Node.kind = m:arg';

COMMENT ON COLUMN "qti"."mathml_background"."__tag_type_background_azuiwrri3s" IS 'tag MathmlAttributeType.type = background';

COMMENT ON COLUMN "qti"."mathml_base"."__tag_type_base_ssbqmyk7xw" IS 'tag MathmlAttributeType.type = base';

COMMENT ON COLUMN "qti"."mathml_bind"."__tag_kind_m_bind_bqadgfn5un" IS 'tag Node.kind = m:bind';

COMMENT ON COLUMN "qti"."mathml_boolean"."__tag_type_boolean_ovtjlq2nwu" IS 'tag MathmlAttributeType.type = boolean';

COMMENT ON COLUMN "qti"."mathml_bvar"."__tag_kind_m_bvar_zt42o25tfs" IS 'tag Node.kind = m:bvar';

COMMENT ON COLUMN "qti"."mathml_card"."__tag_kind_m_card_til5kekpth" IS 'tag Node.kind = m:card';

COMMENT ON COLUMN "qti"."mathml_cartesianproduct"."__tag_kind_m_cartesianproduct_drgcnkhoeu" IS 'tag Node.kind = m:cartesianproduct';

COMMENT ON COLUMN "qti"."mathml_cbytes"."__tag_kind_m_cbytes_feg57xr5pi" IS 'tag Node.kind = m:cbytes';

COMMENT ON COLUMN "qti"."mathml_cd"."__tag_type_cd_asogh6i35g" IS 'tag MathmlAttributeType.type = cd';

COMMENT ON COLUMN "qti"."mathml_cdgroup"."__tag_type_cdgroup_swev5xcnud" IS 'tag MathmlAttributeType.type = cdgroup';

COMMENT ON COLUMN "qti"."mathml_ceiling"."__tag_kind_m_ceiling_tvv3pqo4kc" IS 'tag Node.kind = m:ceiling';

COMMENT ON COLUMN "qti"."mathml_cerror"."__tag_kind_m_cerror_solhxcpqpl" IS 'tag Node.kind = m:cerror';

COMMENT ON COLUMN "qti"."mathml_character"."__tag_type_character_kcgxmhefxo" IS 'tag MathmlAttributeType.type = character';

COMMENT ON COLUMN "qti"."mathml_charspacing"."__tag_type_charspacing_3o6btzcp65" IS 'tag MathmlAttributeType.type = charspacing';

COMMENT ON COLUMN "qti"."mathml_ci"."__tag_kind_m_ci_kcbsfo2k3x" IS 'tag Node.kind = m:ci';

COMMENT ON COLUMN "qti"."mathml_class"."__tag_type_class_uhlcorrx6k" IS 'tag MathmlAttributeType.type = class';

COMMENT ON COLUMN "qti"."mathml_closure"."__tag_type_closure_ojw7a4ueed" IS 'tag MathmlAttributeType.type = closure';

COMMENT ON COLUMN "qti"."mathml_cn"."__tag_kind_m_cn_nm5smoaq3e" IS 'tag Node.kind = m:cn';

COMMENT ON COLUMN "qti"."mathml_codomain"."__tag_kind_m_codomain_isect7ufnh" IS 'tag Node.kind = m:codomain';

COMMENT ON COLUMN "qti"."mathml_color"."__tag_type_color_xo6xrxwyju" IS 'tag MathmlAttributeType.type = color';

COMMENT ON COLUMN "qti"."mathml_columnalign"."__tag_type_columnalign_gm65bdikjd" IS 'tag MathmlAttributeType.type = columnalign';

COMMENT ON COLUMN "qti"."mathml_columnalignstyle"."__tag_type_columnalignstyle_llipaw2n3g" IS 'tag MathmlAttributeType.type = columnalignstyle';

COMMENT ON COLUMN "qti"."mathml_columnwidth"."__tag_type_columnwidth_2ohzautbjs" IS 'tag MathmlAttributeType.type = columnwidth';

COMMENT ON COLUMN "qti"."mathml_complexes"."__tag_kind_m_complexes_mpuqcbf6mf" IS 'tag Node.kind = m:complexes';

COMMENT ON COLUMN "qti"."mathml_compose"."__tag_kind_m_compose_iirxxezxih" IS 'tag Node.kind = m:compose';

COMMENT ON COLUMN "qti"."mathml_condition"."__tag_kind_m_condition_kxzfowxslw" IS 'tag Node.kind = m:condition';

COMMENT ON COLUMN "qti"."mathml_conjugate"."__tag_kind_m_conjugate_ikcpb4fov7" IS 'tag Node.kind = m:conjugate';

COMMENT ON COLUMN "qti"."mathml_cos"."__tag_kind_m_cos_bm6qwenqd5" IS 'tag Node.kind = m:cos';

COMMENT ON COLUMN "qti"."mathml_cosh"."__tag_kind_m_cosh_p3nqsbayow" IS 'tag Node.kind = m:cosh';

COMMENT ON COLUMN "qti"."mathml_cot"."__tag_kind_m_cot_5mkoifjifu" IS 'tag Node.kind = m:cot';

COMMENT ON COLUMN "qti"."mathml_coth"."__tag_kind_m_coth_czjsavr4hx" IS 'tag Node.kind = m:coth';

COMMENT ON COLUMN "qti"."mathml_crossout"."__tag_type_crossout_ayzqk3upcx" IS 'tag MathmlAttributeType.type = crossout';

COMMENT ON COLUMN "qti"."mathml_cs"."__tag_kind_m_cs_7lhn577snb" IS 'tag Node.kind = m:cs';

COMMENT ON COLUMN "qti"."mathml_csc"."__tag_kind_m_csc_euk34eaz5r" IS 'tag Node.kind = m:csc';

COMMENT ON COLUMN "qti"."mathml_csch"."__tag_kind_m_csch_pp6ieubxgw" IS 'tag Node.kind = m:csch';

COMMENT ON COLUMN "qti"."mathml_csymbol"."__tag_kind_m_csymbol_poho6k6bbq" IS 'tag Node.kind = m:csymbol';

COMMENT ON COLUMN "qti"."mathml_curl"."__tag_kind_m_curl_iuyimyhcei" IS 'tag Node.kind = m:curl';

COMMENT ON COLUMN "qti"."mathml_declare"."__tag_kind_m_declare_du6gfazyqy" IS 'tag Node.kind = m:declare';

COMMENT ON COLUMN "qti"."mathml_definition_url"."__tag_type_definition_url_mm24nzp6au" IS 'tag MathmlAttributeType.type = definition-url';

COMMENT ON COLUMN "qti"."mathml_degree"."__tag_kind_m_degree_gdpkq3qbuh" IS 'tag Node.kind = m:degree';

COMMENT ON COLUMN "qti"."mathml_determinant"."__tag_kind_m_determinant_ho2trt5jwg" IS 'tag Node.kind = m:determinant';

COMMENT ON COLUMN "qti"."mathml_diff"."__tag_kind_m_diff_qwzgjscjjh" IS 'tag Node.kind = m:diff';

COMMENT ON COLUMN "qti"."mathml_dir"."__tag_type_dir_56vobbgcmu" IS 'tag MathmlAttributeType.type = dir';

COMMENT ON COLUMN "qti"."mathml_display"."__tag_type_display_q4wgbtruhu" IS 'tag MathmlAttributeType.type = display';

COMMENT ON COLUMN "qti"."mathml_divergence"."__tag_kind_m_divergence_lf7s2l7csn" IS 'tag Node.kind = m:divergence';

COMMENT ON COLUMN "qti"."mathml_divide"."__tag_kind_m_divide_hljq3bljki" IS 'tag Node.kind = m:divide';

COMMENT ON COLUMN "qti"."mathml_domain"."__tag_kind_m_domain_f636fecyb3" IS 'tag Node.kind = m:domain';

COMMENT ON COLUMN "qti"."mathml_domainofapplication"."__tag_kind_m_domainofapplication_p32lmqyvju" IS 'tag Node.kind = m:domainofapplication';

COMMENT ON COLUMN "qti"."mathml_edge"."__tag_type_edge_iuoelrniia" IS 'tag MathmlAttributeType.type = edge';

COMMENT ON COLUMN "qti"."mathml_embed_source"."__tag_type_embed_source_n7fs6bfobb" IS 'tag MathmlAttributeType.type = embed-source';

COMMENT ON COLUMN "qti"."mathml_emptyset"."__tag_kind_m_emptyset_tgxutwjcbv" IS 'tag Node.kind = m:emptyset';

COMMENT ON COLUMN "qti"."mathml_eq"."__tag_kind_m_eq_zt2uyo5zmx" IS 'tag Node.kind = m:eq';

COMMENT ON COLUMN "qti"."mathml_equivalent"."__tag_kind_m_equivalent_chw7c3l2pg" IS 'tag Node.kind = m:equivalent';

COMMENT ON COLUMN "qti"."mathml_eulergamma"."__tag_kind_m_eulergamma_7vwknmgaz3" IS 'tag Node.kind = m:eulergamma';

COMMENT ON COLUMN "qti"."mathml_exists"."__tag_kind_m_exists_26megfczw3" IS 'tag Node.kind = m:exists';

COMMENT ON COLUMN "qti"."mathml_exp"."__tag_kind_m_exp_hp5qgqr6mo" IS 'tag Node.kind = m:exp';

COMMENT ON COLUMN "qti"."mathml_exponentiale"."__tag_kind_m_exponentiale_n3bg467okv" IS 'tag Node.kind = m:exponentiale';

COMMENT ON COLUMN "qti"."mathml_factorial"."__tag_kind_m_factorial_luq3tna6il" IS 'tag Node.kind = m:factorial';

COMMENT ON COLUMN "qti"."mathml_factorof"."__tag_kind_m_factorof_7mkqtxhp6r" IS 'tag Node.kind = m:factorof';

COMMENT ON COLUMN "qti"."mathml_false"."__tag_kind_m_false_2lwwbihgiq" IS 'tag Node.kind = m:false';

COMMENT ON COLUMN "qti"."mathml_floor"."__tag_kind_m_floor_ldoeltb3g2" IS 'tag Node.kind = m:floor';

COMMENT ON COLUMN "qti"."mathml_fn"."__tag_kind_m_fn_4bvdfdhf5b" IS 'tag Node.kind = m:fn';

COMMENT ON COLUMN "qti"."mathml_fontstyle"."__tag_type_fontstyle_phcqb3bvk2" IS 'tag MathmlAttributeType.type = fontstyle';

COMMENT ON COLUMN "qti"."mathml_fontweight"."__tag_type_fontweight_uinmbdi34f" IS 'tag MathmlAttributeType.type = fontweight';

COMMENT ON COLUMN "qti"."mathml_forall"."__tag_kind_m_forall_ef26ntzivb" IS 'tag Node.kind = m:forall';

COMMENT ON COLUMN "qti"."mathml_form"."__tag_type_form_gdgsyoa7tz" IS 'tag MathmlAttributeType.type = form';

COMMENT ON COLUMN "qti"."mathml_framespacing"."__tag_type_framespacing_npn4kimxhg" IS 'tag MathmlAttributeType.type = framespacing';

COMMENT ON COLUMN "qti"."mathml_gcd"."__tag_kind_m_gcd_xa57vvjg5a" IS 'tag Node.kind = m:gcd';

COMMENT ON COLUMN "qti"."mathml_geq"."__tag_kind_m_geq_n5wokg4gqv" IS 'tag Node.kind = m:geq';

COMMENT ON COLUMN "qti"."mathml_grad"."__tag_kind_m_grad_6q4ynpcv7x" IS 'tag Node.kind = m:grad';

COMMENT ON COLUMN "qti"."mathml_group_alignment"."__tag_type_group_alignment_pqo7age7u2" IS 'tag MathmlAttributeType.type = group-alignment';

COMMENT ON COLUMN "qti"."mathml_group_alignment_list"."__tag_type_group_alignment_list_uuhrki2oda" IS 'tag MathmlAttributeType.type = group-alignment-list';

COMMENT ON COLUMN "qti"."mathml_group_alignment_list_list"."__tag_type_group_alignment_list_list_qianckw2my" IS 'tag MathmlAttributeType.type = group-alignment-list-list';

COMMENT ON COLUMN "qti"."mathml_gt"."__tag_kind_m_gt_jthh6lobdq" IS 'tag Node.kind = m:gt';

COMMENT ON COLUMN "qti"."mathml_href"."__tag_type_href_yzb73hqcyn" IS 'tag MathmlAttributeType.type = href';

COMMENT ON COLUMN "qti"."mathml_ident"."__tag_kind_m_ident_hirfnzkvy7" IS 'tag Node.kind = m:ident';

COMMENT ON COLUMN "qti"."mathml_image"."__tag_kind_m_image_ytpk7tcvqx" IS 'tag Node.kind = m:image';

COMMENT ON COLUMN "qti"."mathml_imaginary"."__tag_kind_m_imaginary_xoprhipe34" IS 'tag Node.kind = m:imaginary';

COMMENT ON COLUMN "qti"."mathml_imaginaryi"."__tag_kind_m_imaginaryi_baxxqzk6iy" IS 'tag Node.kind = m:imaginaryi';

COMMENT ON COLUMN "qti"."mathml_implies"."__tag_kind_m_implies_lq7yrzde2h" IS 'tag Node.kind = m:implies';

COMMENT ON COLUMN "qti"."mathml_in"."__tag_kind_m_in_r3eoy4iycj" IS 'tag Node.kind = m:in';

COMMENT ON COLUMN "qti"."mathml_indentalign"."__tag_type_indentalign_j5iv5corng" IS 'tag MathmlAttributeType.type = indentalign';

COMMENT ON COLUMN "qti"."mathml_indentalign_line"."__tag_type_indentalign_line_qkwuxxgavh" IS 'tag MathmlAttributeType.type = indentalign-line';

COMMENT ON COLUMN "qti"."mathml_indentshift_line"."__tag_type_indentshift_line_cuy5tnfbaq" IS 'tag MathmlAttributeType.type = indentshift-line';

COMMENT ON COLUMN "qti"."mathml_index"."__tag_type_index_h3u3yjrhy5" IS 'tag MathmlAttributeType.type = index';

COMMENT ON COLUMN "qti"."mathml_infinity"."__tag_kind_m_infinity_ylqzdwkaro" IS 'tag Node.kind = m:infinity';

COMMENT ON COLUMN "qti"."mathml_infixlinebreakstyle"."__tag_type_infixlinebreakstyle_bfpwwvm7sn" IS 'tag MathmlAttributeType.type = infixlinebreakstyle';

COMMENT ON COLUMN "qti"."mathml_int"."__tag_kind_m_int_eacj64es7a" IS 'tag Node.kind = m:int';

COMMENT ON COLUMN "qti"."mathml_integers"."__tag_kind_m_integers_ynhsls5pt2" IS 'tag Node.kind = m:integers';

COMMENT ON COLUMN "qti"."mathml_intersect"."__tag_kind_m_intersect_2t6lpqnkyo" IS 'tag Node.kind = m:intersect';

COMMENT ON COLUMN "qti"."mathml_interval"."__tag_kind_m_interval_c4ld6f4f6d" IS 'tag Node.kind = m:interval';

COMMENT ON COLUMN "qti"."mathml_inverse"."__tag_kind_m_inverse_jjpt2lp3pd" IS 'tag Node.kind = m:inverse';

COMMENT ON COLUMN "qti"."mathml_lambda"."__tag_kind_m_lambda_v5k6arscmx" IS 'tag Node.kind = m:lambda';

COMMENT ON COLUMN "qti"."mathml_laplacian"."__tag_kind_m_laplacian_4tx6pg3cdf" IS 'tag Node.kind = m:laplacian';

COMMENT ON COLUMN "qti"."mathml_lcm"."__tag_kind_m_lcm_66u5rutbgm" IS 'tag Node.kind = m:lcm';

COMMENT ON COLUMN "qti"."mathml_length"."__tag_type_length_3ryxkrjjhb" IS 'tag MathmlAttributeType.type = length';

COMMENT ON COLUMN "qti"."mathml_length_list"."__tag_type_length_list_dngtcn7r6m" IS 'tag MathmlAttributeType.type = length-list';

COMMENT ON COLUMN "qti"."mathml_leq"."__tag_kind_m_leq_b7euz5pala" IS 'tag Node.kind = m:leq';

COMMENT ON COLUMN "qti"."mathml_limit"."__tag_kind_m_limit_l2u2dzwokn" IS 'tag Node.kind = m:limit';

COMMENT ON COLUMN "qti"."mathml_line_thickness"."__tag_type_line_thickness_wchmxjoakj" IS 'tag MathmlAttributeType.type = line-thickness';

COMMENT ON COLUMN "qti"."mathml_linebreak"."__tag_type_linebreak_w6lunataa2" IS 'tag MathmlAttributeType.type = linebreak';

COMMENT ON COLUMN "qti"."mathml_linebreakstyle"."__tag_type_linebreakstyle_llwvaljtbh" IS 'tag MathmlAttributeType.type = linebreakstyle';

COMMENT ON COLUMN "qti"."mathml_linestyle"."__tag_type_linestyle_epwcv3z4sm" IS 'tag MathmlAttributeType.type = linestyle';

COMMENT ON COLUMN "qti"."mathml_linestyle_list"."__tag_type_linestyle_list_rb27ousd5c" IS 'tag MathmlAttributeType.type = linestyle-list';

COMMENT ON COLUMN "qti"."mathml_list"."__tag_kind_m_list_ididamd2sx" IS 'tag Node.kind = m:list';

COMMENT ON COLUMN "qti"."mathml_ln"."__tag_kind_m_ln_ffmsmo2m36" IS 'tag Node.kind = m:ln';

COMMENT ON COLUMN "qti"."mathml_location"."__tag_type_location_kr5ll5xiqo" IS 'tag MathmlAttributeType.type = location';

COMMENT ON COLUMN "qti"."mathml_log"."__tag_kind_m_log_3dqvvrgdqn" IS 'tag Node.kind = m:log';

COMMENT ON COLUMN "qti"."mathml_logbase"."__tag_kind_m_logbase_iwvpr4ym5u" IS 'tag Node.kind = m:logbase';

COMMENT ON COLUMN "qti"."mathml_longdivstyle"."__tag_type_longdivstyle_x6uaaro43p" IS 'tag MathmlAttributeType.type = longdivstyle';

COMMENT ON COLUMN "qti"."mathml_lowlimit"."__tag_kind_m_lowlimit_2pfspebfal" IS 'tag Node.kind = m:lowlimit';

COMMENT ON COLUMN "qti"."mathml_lt"."__tag_kind_m_lt_vgxgnlpcov" IS 'tag Node.kind = m:lt';

COMMENT ON COLUMN "qti"."mathml_maction"."__tag_kind_m_maction_y36nfqlpyh" IS 'tag Node.kind = m:maction';

COMMENT ON COLUMN "qti"."mathml_maligngroup"."__tag_kind_m_maligngroup_wampytcaou" IS 'tag Node.kind = m:maligngroup';

COMMENT ON COLUMN "qti"."mathml_malignmark"."__tag_kind_m_malignmark_nz76twvsrf" IS 'tag Node.kind = m:malignmark';

COMMENT ON COLUMN "qti"."mathml_math"."__tag_kind_m_math_dtmrz3gcfd" IS 'tag Node.kind = m:math';

COMMENT ON COLUMN "qti"."mathml_mathsize"."__tag_type_mathsize_grkbgzyt3i" IS 'tag MathmlAttributeType.type = mathsize';

COMMENT ON COLUMN "qti"."mathml_mathvariant"."__tag_type_mathvariant_g4idzs45uj" IS 'tag MathmlAttributeType.type = mathvariant';

COMMENT ON COLUMN "qti"."mathml_matrix"."__tag_kind_m_matrix_mnfvdmlrs2" IS 'tag Node.kind = m:matrix';

COMMENT ON COLUMN "qti"."mathml_matrixrow"."__tag_kind_m_matrixrow_uhamsripkq" IS 'tag Node.kind = m:matrixrow';

COMMENT ON COLUMN "qti"."mathml_max"."__tag_kind_m_max_cr2qia23nv" IS 'tag Node.kind = m:max';

COMMENT ON COLUMN "qti"."mathml_maxsize"."__tag_type_maxsize_562tlh7e4a" IS 'tag MathmlAttributeType.type = maxsize';

COMMENT ON COLUMN "qti"."mathml_mean"."__tag_kind_m_mean_e72hycklnh" IS 'tag Node.kind = m:mean';

COMMENT ON COLUMN "qti"."mathml_median"."__tag_kind_m_median_fornyqw6hp" IS 'tag Node.kind = m:median';

COMMENT ON COLUMN "qti"."mathml_menclose"."__tag_kind_m_menclose_jsw5qoccrd" IS 'tag Node.kind = m:menclose';

COMMENT ON COLUMN "qti"."mathml_merror"."__tag_kind_m_merror_nhqlhek76i" IS 'tag Node.kind = m:merror';

COMMENT ON COLUMN "qti"."mathml_mfenced"."__tag_kind_m_mfenced_oo5qjasnee" IS 'tag Node.kind = m:mfenced';

COMMENT ON COLUMN "qti"."mathml_mfrac"."__tag_kind_m_mfrac_vmplftveia" IS 'tag Node.kind = m:mfrac';

COMMENT ON COLUMN "qti"."mathml_mglyph"."__tag_kind_m_mglyph_24iju5mdym" IS 'tag Node.kind = m:mglyph';

COMMENT ON COLUMN "qti"."mathml_mi"."__tag_kind_m_mi_p7i7slzmp4" IS 'tag Node.kind = m:mi';

COMMENT ON COLUMN "qti"."mathml_min"."__tag_kind_m_min_ptzeah4ns2" IS 'tag Node.kind = m:min';

COMMENT ON COLUMN "qti"."mathml_minus"."__tag_kind_m_minus_hcem3twfsv" IS 'tag Node.kind = m:minus';

COMMENT ON COLUMN "qti"."mathml_mlabeledtr"."__tag_kind_m_mlabeledtr_j5pxrv3x2d" IS 'tag Node.kind = m:mlabeledtr';

COMMENT ON COLUMN "qti"."mathml_mlongdiv"."__tag_kind_m_mlongdiv_22mypvxzfm" IS 'tag Node.kind = m:mlongdiv';

COMMENT ON COLUMN "qti"."mathml_mmultiscripts"."__tag_kind_m_mmultiscripts_inoxa5l6ol" IS 'tag Node.kind = m:mmultiscripts';

COMMENT ON COLUMN "qti"."mathml_mn"."__tag_kind_m_mn_2penr6noah" IS 'tag Node.kind = m:mn';

COMMENT ON COLUMN "qti"."mathml_mo"."__tag_kind_m_mo_izsuukhwhz" IS 'tag Node.kind = m:mo';

COMMENT ON COLUMN "qti"."mathml_mode"."__tag_kind_m_mode_f2wxgo6k7y" IS 'tag Node.kind = m:mode';

COMMENT ON COLUMN "qti"."mathml_moment"."__tag_kind_m_moment_r3exfc4eqr" IS 'tag Node.kind = m:moment';

COMMENT ON COLUMN "qti"."mathml_momentabout"."__tag_kind_m_momentabout_jpx6cayxgs" IS 'tag Node.kind = m:momentabout';

COMMENT ON COLUMN "qti"."mathml_mover"."__tag_kind_m_mover_2sodqbv35q" IS 'tag Node.kind = m:mover';

COMMENT ON COLUMN "qti"."mathml_mpadded"."__tag_kind_m_mpadded_3vz5xdkeiw" IS 'tag Node.kind = m:mpadded';

COMMENT ON COLUMN "qti"."mathml_mpadded_length"."__tag_type_mpadded_length_h2bjgoqjt5" IS 'tag MathmlAttributeType.type = mpadded-length';

COMMENT ON COLUMN "qti"."mathml_mphantom"."__tag_kind_m_mphantom_q5jic2y66l" IS 'tag Node.kind = m:mphantom';

COMMENT ON COLUMN "qti"."mathml_mprescripts"."__tag_kind_m_mprescripts_uf33moyqvt" IS 'tag Node.kind = m:mprescripts';

COMMENT ON COLUMN "qti"."mathml_mroot"."__tag_kind_m_mroot_qn2422dmq4" IS 'tag Node.kind = m:mroot';

COMMENT ON COLUMN "qti"."mathml_mrow"."__tag_kind_m_mrow_cytyvwkgdf" IS 'tag Node.kind = m:mrow';

COMMENT ON COLUMN "qti"."mathml_ms"."__tag_kind_m_ms_pdgylwa6dz" IS 'tag Node.kind = m:ms';

COMMENT ON COLUMN "qti"."mathml_mscarries"."__tag_kind_m_mscarries_vkanwmtzz4" IS 'tag Node.kind = m:mscarries';

COMMENT ON COLUMN "qti"."mathml_mscarry"."__tag_kind_m_mscarry_ajupuy2i2b" IS 'tag Node.kind = m:mscarry';

COMMENT ON COLUMN "qti"."mathml_msgroup"."__tag_kind_m_msgroup_gc5kcdhb3n" IS 'tag Node.kind = m:msgroup';

COMMENT ON COLUMN "qti"."mathml_msline"."__tag_kind_m_msline_3vuunvoaru" IS 'tag Node.kind = m:msline';

COMMENT ON COLUMN "qti"."mathml_mspace"."__tag_kind_m_mspace_su7akczkbj" IS 'tag Node.kind = m:mspace';

COMMENT ON COLUMN "qti"."mathml_mspace_linebreak"."__tag_type_mspace_linebreak_2ttbtg2pof" IS 'tag MathmlAttributeType.type = mspace-linebreak';

COMMENT ON COLUMN "qti"."mathml_msqrt"."__tag_kind_m_msqrt_7jzntxzyfy" IS 'tag Node.kind = m:msqrt';

COMMENT ON COLUMN "qti"."mathml_msrow"."__tag_kind_m_msrow_j7ltxdt2up" IS 'tag Node.kind = m:msrow';

COMMENT ON COLUMN "qti"."mathml_mstack"."__tag_kind_m_mstack_gkm7obfda2" IS 'tag Node.kind = m:mstack';

COMMENT ON COLUMN "qti"."mathml_mstyle"."__tag_kind_m_mstyle_zxd3ckdwex" IS 'tag Node.kind = m:mstyle';

COMMENT ON COLUMN "qti"."mathml_msub"."__tag_kind_m_msub_fjwntq3ri6" IS 'tag Node.kind = m:msub';

COMMENT ON COLUMN "qti"."mathml_msubsup"."__tag_kind_m_msubsup_m3aq3rdyeg" IS 'tag Node.kind = m:msubsup';

COMMENT ON COLUMN "qti"."mathml_msup"."__tag_kind_m_msup_kwgtpz276e" IS 'tag Node.kind = m:msup';

COMMENT ON COLUMN "qti"."mathml_mtable"."__tag_kind_m_mtable_ddkzxi42to" IS 'tag Node.kind = m:mtable';

COMMENT ON COLUMN "qti"."mathml_mtd"."__tag_kind_m_mtd_zh62fovndd" IS 'tag Node.kind = m:mtd';

COMMENT ON COLUMN "qti"."mathml_mtext"."__tag_kind_m_mtext_gjyzedp263" IS 'tag Node.kind = m:mtext';

COMMENT ON COLUMN "qti"."mathml_mtr"."__tag_kind_m_mtr_tiryvttk6j" IS 'tag Node.kind = m:mtr';

COMMENT ON COLUMN "qti"."mathml_munder"."__tag_kind_m_munder_xjdj25enzu" IS 'tag Node.kind = m:munder';

COMMENT ON COLUMN "qti"."mathml_munderover"."__tag_kind_m_munderover_7rxt37agxh" IS 'tag Node.kind = m:munderover';

COMMENT ON COLUMN "qti"."mathml_name"."__tag_type_name_g4vf3tlvtw" IS 'tag MathmlAttributeType.type = name';

COMMENT ON COLUMN "qti"."mathml_nargs"."__tag_type_nargs_ygqc7vdqpk" IS 'tag MathmlAttributeType.type = nargs';

COMMENT ON COLUMN "qti"."mathml_naturalnumbers"."__tag_kind_m_naturalnumbers_4si2qmk4bt" IS 'tag Node.kind = m:naturalnumbers';

COMMENT ON COLUMN "qti"."mathml_neq"."__tag_kind_m_neq_sfxeauet33" IS 'tag Node.kind = m:neq';

COMMENT ON COLUMN "qti"."mathml_none"."__tag_kind_m_none_txrqdn7o6t" IS 'tag Node.kind = m:none';

COMMENT ON COLUMN "qti"."mathml_not"."__tag_kind_m_not_jf3l6qjxrd" IS 'tag Node.kind = m:not';

COMMENT ON COLUMN "qti"."mathml_notanumber"."__tag_kind_m_notanumber_zucyyudpwj" IS 'tag Node.kind = m:notanumber';

COMMENT ON COLUMN "qti"."mathml_notin"."__tag_kind_m_notin_gjm5pzhaib" IS 'tag Node.kind = m:notin';

COMMENT ON COLUMN "qti"."mathml_notprsubset"."__tag_kind_m_notprsubset_mdvhlxpocq" IS 'tag Node.kind = m:notprsubset';

COMMENT ON COLUMN "qti"."mathml_notsubset"."__tag_kind_m_notsubset_hyskqhass5" IS 'tag Node.kind = m:notsubset';

COMMENT ON COLUMN "qti"."mathml_number"."__tag_type_number_su5a7mhmov" IS 'tag MathmlAttributeType.type = number';

COMMENT ON COLUMN "qti"."mathml_occurrence"."__tag_type_occurrence_poownjlqsd" IS 'tag MathmlAttributeType.type = occurrence';

COMMENT ON COLUMN "qti"."mathml_or"."__tag_kind_m_or_kw7pzhxnad" IS 'tag Node.kind = m:or';

COMMENT ON COLUMN "qti"."mathml_order"."__tag_type_order_7gyulwkonz" IS 'tag MathmlAttributeType.type = order';

COMMENT ON COLUMN "qti"."mathml_otherwise"."__tag_kind_m_otherwise_a6zs5hnn2a" IS 'tag Node.kind = m:otherwise';

COMMENT ON COLUMN "qti"."mathml_outerproduct"."__tag_kind_m_outerproduct_p4a4z6sd6m" IS 'tag Node.kind = m:outerproduct';

COMMENT ON COLUMN "qti"."mathml_overflow"."__tag_type_overflow_fijx4zdoiz" IS 'tag MathmlAttributeType.type = overflow';

COMMENT ON COLUMN "qti"."mathml_partialdiff"."__tag_kind_m_partialdiff_6ypsxmfpsd" IS 'tag Node.kind = m:partialdiff';

COMMENT ON COLUMN "qti"."mathml_pi"."__tag_kind_m_pi_xvsqr7saep" IS 'tag Node.kind = m:pi';

COMMENT ON COLUMN "qti"."mathml_piece"."__tag_kind_m_piece_k2ohxrzecs" IS 'tag Node.kind = m:piece';

COMMENT ON COLUMN "qti"."mathml_piecewise"."__tag_kind_m_piecewise_hi4sytbaqh" IS 'tag Node.kind = m:piecewise';

COMMENT ON COLUMN "qti"."mathml_plus"."__tag_kind_m_plus_4dxeflazpt" IS 'tag Node.kind = m:plus';

COMMENT ON COLUMN "qti"."mathml_position"."__tag_type_position_ti5jyzvjus" IS 'tag MathmlAttributeType.type = position';

COMMENT ON COLUMN "qti"."mathml_power"."__tag_kind_m_power_6k56p2r42x" IS 'tag Node.kind = m:power';

COMMENT ON COLUMN "qti"."mathml_primes"."__tag_kind_m_primes_tai2obwnjd" IS 'tag Node.kind = m:primes';

COMMENT ON COLUMN "qti"."mathml_product"."__tag_kind_m_product_x3cdvrs3g2" IS 'tag Node.kind = m:product';

COMMENT ON COLUMN "qti"."mathml_prsubset"."__tag_kind_m_prsubset_4gfelkzi7e" IS 'tag Node.kind = m:prsubset';

COMMENT ON COLUMN "qti"."mathml_quotient"."__tag_kind_m_quotient_s2o75pem36" IS 'tag Node.kind = m:quotient';

COMMENT ON COLUMN "qti"."mathml_rationals"."__tag_kind_m_rationals_2m5enf2oj2" IS 'tag Node.kind = m:rationals';

COMMENT ON COLUMN "qti"."mathml_real"."__tag_kind_m_real_junglpuyjh" IS 'tag Node.kind = m:real';

COMMENT ON COLUMN "qti"."mathml_reals"."__tag_kind_m_reals_sltmlx6eyd" IS 'tag Node.kind = m:reals';

COMMENT ON COLUMN "qti"."mathml_reln"."__tag_kind_m_reln_bxlrw6pjny" IS 'tag Node.kind = m:reln';

COMMENT ON COLUMN "qti"."mathml_rem"."__tag_kind_m_rem_hk2fhxi3j3" IS 'tag Node.kind = m:rem';

COMMENT ON COLUMN "qti"."mathml_root"."__tag_kind_m_root_k3d4oyajlo" IS 'tag Node.kind = m:root';

COMMENT ON COLUMN "qti"."mathml_rowalign"."__tag_type_rowalign_3qkoukbb5i" IS 'tag MathmlAttributeType.type = rowalign';

COMMENT ON COLUMN "qti"."mathml_scalarproduct"."__tag_kind_m_scalarproduct_ztm5elappz" IS 'tag Node.kind = m:scalarproduct';

COMMENT ON COLUMN "qti"."mathml_scriptlevel"."__tag_type_scriptlevel_lus7qdlwus" IS 'tag MathmlAttributeType.type = scriptlevel';

COMMENT ON COLUMN "qti"."mathml_sdev"."__tag_kind_m_sdev_ipab3uglwf" IS 'tag Node.kind = m:sdev';

COMMENT ON COLUMN "qti"."mathml_sec"."__tag_kind_m_sec_6pbevmi5vg" IS 'tag Node.kind = m:sec';

COMMENT ON COLUMN "qti"."mathml_sech"."__tag_kind_m_sech_bsdecxac2s" IS 'tag Node.kind = m:sech';

COMMENT ON COLUMN "qti"."mathml_selection"."__tag_type_selection_jwgsaywsyr" IS 'tag MathmlAttributeType.type = selection';

COMMENT ON COLUMN "qti"."mathml_selector"."__tag_kind_m_selector_id2twbxgz4" IS 'tag Node.kind = m:selector';

COMMENT ON COLUMN "qti"."mathml_semantics"."__tag_kind_m_semantics_hcelfkqiux" IS 'tag Node.kind = m:semantics';

COMMENT ON COLUMN "qti"."mathml_semantics_ci"."__tag_kind_m_semantics_ci_kfs5kl2pxo" IS 'tag Node.kind = m:semantics.ci';

COMMENT ON COLUMN "qti"."mathml_sep"."__tag_kind_m_sep_kkvavsjqnh" IS 'tag Node.kind = m:sep';

COMMENT ON COLUMN "qti"."mathml_set"."__tag_kind_m_set_y2qu2mnt3k" IS 'tag Node.kind = m:set';

COMMENT ON COLUMN "qti"."mathml_setdiff"."__tag_kind_m_setdiff_6ak6jezs3j" IS 'tag Node.kind = m:setdiff';

COMMENT ON COLUMN "qti"."mathml_share"."__tag_kind_m_share_6yal6dljfx" IS 'tag Node.kind = m:share';

COMMENT ON COLUMN "qti"."mathml_shift"."__tag_type_shift_apyvsvz66t" IS 'tag MathmlAttributeType.type = shift';

COMMENT ON COLUMN "qti"."mathml_side"."__tag_type_side_q47iymixud" IS 'tag MathmlAttributeType.type = side';

COMMENT ON COLUMN "qti"."mathml_sin"."__tag_kind_m_sin_5vyjm4llew" IS 'tag Node.kind = m:sin';

COMMENT ON COLUMN "qti"."mathml_sinh"."__tag_kind_m_sinh_a5mwypfwvy" IS 'tag Node.kind = m:sinh';

COMMENT ON COLUMN "qti"."mathml_span"."__tag_type_span_oltex6sebj" IS 'tag MathmlAttributeType.type = span';

COMMENT ON COLUMN "qti"."mathml_src"."__tag_type_src_lxnlnbl4zv" IS 'tag MathmlAttributeType.type = src';

COMMENT ON COLUMN "qti"."mathml_string"."__tag_type_string_in2ni326mz" IS 'tag MathmlAttributeType.type = string';

COMMENT ON COLUMN "qti"."mathml_subset"."__tag_kind_m_subset_jwykfgzkcc" IS 'tag Node.kind = m:subset';

COMMENT ON COLUMN "qti"."mathml_sum"."__tag_kind_m_sum_eygixfvnhj" IS 'tag Node.kind = m:sum';

COMMENT ON COLUMN "qti"."mathml_table_width"."__tag_type_table_width_pplztankwm" IS 'tag MathmlAttributeType.type = table-width';

COMMENT ON COLUMN "qti"."mathml_tan"."__tag_kind_m_tan_ccevpfe55o" IS 'tag Node.kind = m:tan';

COMMENT ON COLUMN "qti"."mathml_tanh"."__tag_kind_m_tanh_th7rxeblxr" IS 'tag Node.kind = m:tanh';

COMMENT ON COLUMN "qti"."mathml_tendsto"."__tag_kind_m_tendsto_v6sdqp7osp" IS 'tag Node.kind = m:tendsto';

COMMENT ON COLUMN "qti"."mathml_times"."__tag_kind_m_times_xfa335sssc" IS 'tag Node.kind = m:times';

COMMENT ON COLUMN "qti"."mathml_transpose"."__tag_kind_m_transpose_vim66kqtck" IS 'tag Node.kind = m:transpose';

COMMENT ON COLUMN "qti"."mathml_true"."__tag_kind_m_true_ggyj63hsze" IS 'tag Node.kind = m:true';

COMMENT ON COLUMN "qti"."mathml_union"."__tag_kind_m_union_6kcpnf2mlo" IS 'tag Node.kind = m:union';

COMMENT ON COLUMN "qti"."mathml_unsigned_integer"."__tag_type_unsigned_integer_gnblpmuiy3" IS 'tag MathmlAttributeType.type = unsigned-integer';

COMMENT ON COLUMN "qti"."mathml_uplimit"."__tag_kind_m_uplimit_6whdpi7iqh" IS 'tag Node.kind = m:uplimit';

COMMENT ON COLUMN "qti"."mathml_variance"."__tag_kind_m_variance_ugqyybctnb" IS 'tag Node.kind = m:variance';

COMMENT ON COLUMN "qti"."mathml_vector"."__tag_kind_m_vector_o7zppitxuw" IS 'tag Node.kind = m:vector';

COMMENT ON COLUMN "qti"."mathml_vectorproduct"."__tag_kind_m_vectorproduct_l2jltqqlem" IS 'tag Node.kind = m:vectorproduct';

COMMENT ON COLUMN "qti"."mathml_verticalalign"."__tag_type_verticalalign_l4kt5q657l" IS 'tag MathmlAttributeType.type = verticalalign';

COMMENT ON COLUMN "qti"."mathml_xor"."__tag_kind_m_xor_raim3zhwns" IS 'tag Node.kind = m:xor';

COMMENT ON CONSTRAINT "__mathml_abs_fk_id_tag_kind_m_abs_5_ggr_4_en_2_fg_4lbjouslfi" ON "qti"."mathml_abs" IS 'foreign key MathmlAbs(id, __tag_kind_m_abs_5ggr4en2fg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_align_fk_kind_attribute_tag_type_align_rz_4_fkuwguty6o" ON "qti"."mathml_align" IS 'foreign key MathmlAlign(kind, attribute, __tag_type_align_rz4q2q2vpi) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_align_fk_node_kind_ao4jbqomjm" ON "qti"."mathml_align" IS 'foreign key MathmlAlign(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_alignmentscope_fk_kind_attribute_tag_type_7kf4orxk3i" ON "qti"."mathml_alignmentscope" IS 'foreign key MathmlAlignmentscope(kind, attribute, __tag_type_alignmentscope_ksiai53b3c) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_alignmentscope_fk_node_kind_mthv5o2xhe" ON "qti"."mathml_alignmentscope" IS 'foreign key MathmlAlignmentscope(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_altimg_valign_fk_kind_attribute_tag_type_ifi43kl3am" ON "qti"."mathml_altimg_valign" IS 'foreign key MathmlAltimgValign(kind, attribute, __tag_type_altimg_valign_4g6yyfcca6) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_altimg_valign_fk_node_kind_gvqw3acsxy" ON "qti"."mathml_altimg_valign" IS 'foreign key MathmlAltimgValign(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_and_fk_id_tag_kind_m_and_eisrasbaaj_pbiigtr6lm" ON "qti"."mathml_and" IS 'foreign key MathmlAnd(id, __tag_kind_m_and_eisrasbaaj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_annotation_fk_id_tag_kind_m_annotation_ze_5_wk724xgyzm" ON "qti"."mathml_annotation" IS 'foreign key MathmlAnnotation(id, __tag_kind_m_annotation_ze5ecrwj65) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_annotation_xml_fk_id_tag_kind_m_annotation_f746em2qky" ON "qti"."mathml_annotation_xml" IS 'foreign key MathmlAnnotationXml(id, __tag_kind_m_annotation_xml_wd6za7y2z6) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_apply_fk_id_tag_kind_m_apply_bengchb_6_nb_6rutusltw6" ON "qti"."mathml_apply" IS 'foreign key MathmlApply(id, __tag_kind_m_apply_bengchb6nb) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_approx_fk_id_tag_kind_m_approx_ybgbzwajac_d5awmjfx2g" ON "qti"."mathml_approx" IS 'foreign key MathmlApprox(id, __tag_kind_m_approx_ybgbzwajac) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arccos_fk_id_tag_kind_m_arccos_ytmvopxit_3_jefuepx4bx" ON "qti"."mathml_arccos" IS 'foreign key MathmlArccos(id, __tag_kind_m_arccos_ytmvopxit3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arccosh_fk_id_tag_kind_m_arccosh_cnra_4_q_6_t7vgxjjvl5" ON "qti"."mathml_arccosh" IS 'foreign key MathmlArccosh(id, __tag_kind_m_arccosh_cnra4q6n4l) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arccot_fk_id_tag_kind_m_arccot_63_he_22_7jvezuk4fm" ON "qti"."mathml_arccot" IS 'foreign key MathmlArccot(id, __tag_kind_m_arccot_63he22ouqq) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arccoth_fk_id_tag_kind_m_arccoth_3_luoi_3_2yvquj6iiw" ON "qti"."mathml_arccoth" IS 'foreign key MathmlArccoth(id, __tag_kind_m_arccoth_3luoi3xwu7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arccsc_fk_id_tag_kind_m_arccsc_rnbrap_3_tp_t6bxkukuuz" ON "qti"."mathml_arccsc" IS 'foreign key MathmlArccsc(id, __tag_kind_m_arccsc_rnbrap3tp7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arccsch_fk_id_tag_kind_m_arccsch_rmwi_7_kps5uzllwn" ON "qti"."mathml_arccsch" IS 'foreign key MathmlArccsch(id, __tag_kind_m_arccsch_rmwi7hbeqe) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arcsec_fk_id_tag_kind_m_arcsec_psxegloodo_nl7llpz3rz" ON "qti"."mathml_arcsec" IS 'foreign key MathmlArcsec(id, __tag_kind_m_arcsec_psxegloodo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arcsech_fk_id_tag_kind_m_arcsech_i_6_dbeh_5_drifsm2k7a" ON "qti"."mathml_arcsech" IS 'foreign key MathmlArcsech(id, __tag_kind_m_arcsech_i6dbeh5zx5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arcsin_fk_id_tag_kind_m_arcsin_ctwb_3_wrgwt_cv2qaggnw6" ON "qti"."mathml_arcsin" IS 'foreign key MathmlArcsin(id, __tag_kind_m_arcsin_ctwb3wrgwt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arcsinh_fk_id_tag_kind_m_arcsinh_3_b6fb3fwy4h" ON "qti"."mathml_arcsinh" IS 'foreign key MathmlArcsinh(id, __tag_kind_m_arcsinh_3dysnvaqqn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arctan_fk_id_tag_kind_m_arctan_soi_2_gc_3_xrevisk2eu" ON "qti"."mathml_arctan" IS 'foreign key MathmlArctan(id, __tag_kind_m_arctan_soi2gc3vnc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arctanh_fk_id_tag_kind_m_arctanh_zaaffkrj_3_sewuzdx4tv" ON "qti"."mathml_arctanh" IS 'foreign key MathmlArctanh(id, __tag_kind_m_arctanh_zaaffkrj3r) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_arg_fk_id_tag_kind_m_arg_7_stlghlgbd_ycllxvvwoc" ON "qti"."mathml_arg" IS 'foreign key MathmlArg(id, __tag_kind_m_arg_7stlghlgbd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_attribute_type_fk_kind_attribute_ltoui223al" ON "qti"."mathml_attribute_type" IS 'foreign key MathmlAttributeType(kind, attribute) to AttributeAdmission(kind, attribute)';

COMMENT ON CONSTRAINT "__mathml_background_fk_kind_attribute_tag_type_h2l4hx27v7" ON "qti"."mathml_background" IS 'foreign key MathmlBackground(kind, attribute, __tag_type_background_azuiwrri3s) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_background_fk_node_kind_5lavjv6suf" ON "qti"."mathml_background" IS 'foreign key MathmlBackground(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_base_fk_kind_attribute_tag_type_base_2qp7upchqs" ON "qti"."mathml_base" IS 'foreign key MathmlBase(kind, attribute, __tag_type_base_ssbqmyk7xw) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_base_fk_node_kind_uvbija4irl" ON "qti"."mathml_base" IS 'foreign key MathmlBase(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_bind_fk_id_tag_kind_m_bind_bqadgfn_5_un_dtvis5c2uv" ON "qti"."mathml_bind" IS 'foreign key MathmlBind(id, __tag_kind_m_bind_bqadgfn5un) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_boolean_fk_kind_attribute_tag_type_boolean_d7dv2gdsjx" ON "qti"."mathml_boolean" IS 'foreign key MathmlBoolean(kind, attribute, __tag_type_boolean_ovtjlq2nwu) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_boolean_fk_node_kind_ei7fjgsr5v" ON "qti"."mathml_boolean" IS 'foreign key MathmlBoolean(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_bvar_fk_id_tag_kind_m_bvar_zt_42_o_25_tfs_zygggnuuct" ON "qti"."mathml_bvar" IS 'foreign key MathmlBvar(id, __tag_kind_m_bvar_zt42o25tfs) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_card_fk_id_tag_kind_m_card_til_5_kekpth_mifeqm4qjq" ON "qti"."mathml_card" IS 'foreign key MathmlCard(id, __tag_kind_m_card_til5kekpth) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cartesianproduct_fk_id_tag_kind_m_4szbpju44w" ON "qti"."mathml_cartesianproduct" IS 'foreign key MathmlCartesianproduct(id, __tag_kind_m_cartesianproduct_drgcnkhoeu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cbytes_fk_id_tag_kind_m_cbytes_feg_57_xr_5_vsw43de5q5" ON "qti"."mathml_cbytes" IS 'foreign key MathmlCbytes(id, __tag_kind_m_cbytes_feg57xr5pi) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cd_fk_kind_attribute_tag_type_cd_asogh_6_i_sfdrvslico" ON "qti"."mathml_cd" IS 'foreign key MathmlCd(kind, attribute, __tag_type_cd_asogh6i35g) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_cd_fk_node_kind_h2ksrvxxlu" ON "qti"."mathml_cd" IS 'foreign key MathmlCd(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cdgroup_fk_kind_attribute_tag_type_cdgroup_43mdridalg" ON "qti"."mathml_cdgroup" IS 'foreign key MathmlCdgroup(kind, attribute, __tag_type_cdgroup_swev5xcnud) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_cdgroup_fk_node_kind_uutf6aosbz" ON "qti"."mathml_cdgroup" IS 'foreign key MathmlCdgroup(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_ceiling_fk_id_tag_kind_m_ceiling_tvv_3_pqo_oqgjplblwq" ON "qti"."mathml_ceiling" IS 'foreign key MathmlCeiling(id, __tag_kind_m_ceiling_tvv3pqo4kc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cerror_fk_id_tag_kind_m_cerror_solhxcpqpl_g5oqy7g4k2" ON "qti"."mathml_cerror" IS 'foreign key MathmlCerror(id, __tag_kind_m_cerror_solhxcpqpl) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_character_fk_kind_attribute_tag_type_cgbe2h3eyf" ON "qti"."mathml_character" IS 'foreign key MathmlCharacter(kind, attribute, __tag_type_character_kcgxmhefxo) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_character_fk_node_kind_nfwn5v4d5l" ON "qti"."mathml_character" IS 'foreign key MathmlCharacter(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_charspacing_fk_kind_attribute_tag_type_iarkgg2wly" ON "qti"."mathml_charspacing" IS 'foreign key MathmlCharspacing(kind, attribute, __tag_type_charspacing_3o6btzcp65) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_charspacing_fk_node_kind_lsgsnlwwos" ON "qti"."mathml_charspacing" IS 'foreign key MathmlCharspacing(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_ci_fk_id_tag_kind_m_ci_kcbsfo_2_k_3_x_rjmydrw7vi" ON "qti"."mathml_ci" IS 'foreign key MathmlCi(id, __tag_kind_m_ci_kcbsfo2k3x) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_class_fk_kind_attribute_tag_type_class_lpapzzy6ql" ON "qti"."mathml_class" IS 'foreign key MathmlClass(kind, attribute, __tag_type_class_uhlcorrx6k) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_class_fk_node_kind_pdnh7z6gxu" ON "qti"."mathml_class" IS 'foreign key MathmlClass(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_closure_fk_kind_attribute_tag_type_closure_os5blpxusd" ON "qti"."mathml_closure" IS 'foreign key MathmlClosure(kind, attribute, __tag_type_closure_ojw7a4ueed) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_closure_fk_node_kind_2ww4wadcdx" ON "qti"."mathml_closure" IS 'foreign key MathmlClosure(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cn_fk_id_tag_kind_m_cn_nm_5_smoaq_3_e_waizgsshof" ON "qti"."mathml_cn" IS 'foreign key MathmlCn(id, __tag_kind_m_cn_nm5smoaq3e) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_codomain_fk_id_tag_kind_m_codomain_isect_7_3uvuqrpjpi" ON "qti"."mathml_codomain" IS 'foreign key MathmlCodomain(id, __tag_kind_m_codomain_isect7ufnh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_color_fk_kind_attribute_tag_type_color_xo_6_y6urggkcpb" ON "qti"."mathml_color" IS 'foreign key MathmlColor(kind, attribute, __tag_type_color_xo6xrxwyju) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_color_fk_node_kind_ybngyltvys" ON "qti"."mathml_color" IS 'foreign key MathmlColor(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_columnalign_fk_kind_attribute_tag_type_ftcs5afipe" ON "qti"."mathml_columnalign" IS 'foreign key MathmlColumnalign(kind, attribute, __tag_type_columnalign_gm65bdikjd) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_columnalign_fk_node_kind_spzxs27qx5" ON "qti"."mathml_columnalign" IS 'foreign key MathmlColumnalign(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_columnalignstyle_fk_kind_attribute_tag_type_r5su6jpyti" ON "qti"."mathml_columnalignstyle" IS 'foreign key MathmlColumnalignstyle(kind, attribute, __tag_type_columnalignstyle_llipaw2n3g) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_columnalignstyle_fk_node_kind_lz6c6hjzpw" ON "qti"."mathml_columnalignstyle" IS 'foreign key MathmlColumnalignstyle(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_columnwidth_fk_kind_attribute_tag_type_blgmyvy4hy" ON "qti"."mathml_columnwidth" IS 'foreign key MathmlColumnwidth(kind, attribute, __tag_type_columnwidth_2ohzautbjs) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_columnwidth_fk_node_kind_fqekboclj7" ON "qti"."mathml_columnwidth" IS 'foreign key MathmlColumnwidth(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_complexes_fk_id_tag_kind_m_complexes_b5l2dg6otu" ON "qti"."mathml_complexes" IS 'foreign key MathmlComplexes(id, __tag_kind_m_complexes_mpuqcbf6mf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_compose_fk_id_tag_kind_m_compose_iirxxezxih_bpzvii65ok" ON "qti"."mathml_compose" IS 'foreign key MathmlCompose(id, __tag_kind_m_compose_iirxxezxih) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_condition_fk_id_tag_kind_m_condition_vtetfd7vru" ON "qti"."mathml_condition" IS 'foreign key MathmlCondition(id, __tag_kind_m_condition_kxzfowxslw) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_conjugate_fk_id_tag_kind_m_conjugate_ikcpb_p7hqyj6bfy" ON "qti"."mathml_conjugate" IS 'foreign key MathmlConjugate(id, __tag_kind_m_conjugate_ikcpb4fov7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cos_fk_id_tag_kind_m_cos_bm_6_qwenqd_5_bidh5ryrlp" ON "qti"."mathml_cos" IS 'foreign key MathmlCos(id, __tag_kind_m_cos_bm6qwenqd5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cosh_fk_id_tag_kind_m_cosh_p_3_nqsbayow_cn3tw3wel3" ON "qti"."mathml_cosh" IS 'foreign key MathmlCosh(id, __tag_kind_m_cosh_p3nqsbayow) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cot_fk_id_tag_kind_m_cot_5_mkoifjifu_thtbmcax3p" ON "qti"."mathml_cot" IS 'foreign key MathmlCot(id, __tag_kind_m_cot_5mkoifjifu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_coth_fk_id_tag_kind_m_coth_czjsavr_4_hx_prokexw44j" ON "qti"."mathml_coth" IS 'foreign key MathmlCoth(id, __tag_kind_m_coth_czjsavr4hx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_crossout_fk_kind_attribute_tag_type_n6e55e4pe7" ON "qti"."mathml_crossout" IS 'foreign key MathmlCrossout(kind, attribute, __tag_type_crossout_ayzqk3upcx) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_crossout_fk_node_kind_e5paxrjqxu" ON "qti"."mathml_crossout" IS 'foreign key MathmlCrossout(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_cs_fk_id_tag_kind_m_cs_7_lhn_577_snb_3jxs5owsbk" ON "qti"."mathml_cs" IS 'foreign key MathmlCs(id, __tag_kind_m_cs_7lhn577snb) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_csc_fk_id_tag_kind_m_csc_euk_34_eaz_5_r_laoeexj47a" ON "qti"."mathml_csc" IS 'foreign key MathmlCsc(id, __tag_kind_m_csc_euk34eaz5r) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_csch_fk_id_tag_kind_m_csch_pp_6_ieubxgw_vltklzlo6w" ON "qti"."mathml_csch" IS 'foreign key MathmlCsch(id, __tag_kind_m_csch_pp6ieubxgw) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_csymbol_fk_id_tag_kind_m_csymbol_poho_6_k_6_c3gv3gevmm" ON "qti"."mathml_csymbol" IS 'foreign key MathmlCsymbol(id, __tag_kind_m_csymbol_poho6k6bbq) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_curl_fk_id_tag_kind_m_curl_iuyimyhcei_njbbkitsbd" ON "qti"."mathml_curl" IS 'foreign key MathmlCurl(id, __tag_kind_m_curl_iuyimyhcei) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_declare_fk_id_tag_kind_m_declare_du_6_mqjef6m4nx" ON "qti"."mathml_declare" IS 'foreign key MathmlDeclare(id, __tag_kind_m_declare_du6gfazyqy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_definition_url_fk_kind_attribute_tag_type_667lglkc4e" ON "qti"."mathml_definition_url" IS 'foreign key MathmlDefinitionUrl(kind, attribute, __tag_type_definition_url_mm24nzp6au) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_definition_url_fk_node_kind_syhw5pongw" ON "qti"."mathml_definition_url" IS 'foreign key MathmlDefinitionUrl(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_degree_fk_id_tag_kind_m_degree_gdpkq_3_qbuh_jlolnhkpnv" ON "qti"."mathml_degree" IS 'foreign key MathmlDegree(id, __tag_kind_m_degree_gdpkq3qbuh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_determinant_fk_id_tag_kind_m_determinant_ho_g5sfoy4onl" ON "qti"."mathml_determinant" IS 'foreign key MathmlDeterminant(id, __tag_kind_m_determinant_ho2trt5jwg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_diff_fk_id_tag_kind_m_diff_qwzgjscjjh_db6djj5lc5" ON "qti"."mathml_diff" IS 'foreign key MathmlDiff(id, __tag_kind_m_diff_qwzgjscjjh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_dir_fk_kind_attribute_tag_type_dir_56_5nz3gfsdb5" ON "qti"."mathml_dir" IS 'foreign key MathmlDir(kind, attribute, __tag_type_dir_56vobbgcmu) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_dir_fk_node_kind_rdl7xjkwrd" ON "qti"."mathml_dir" IS 'foreign key MathmlDir(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_display_fk_kind_attribute_tag_type_display_5vcxgu6itr" ON "qti"."mathml_display" IS 'foreign key MathmlDisplay(kind, attribute, __tag_type_display_q4wgbtruhu) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_display_fk_node_kind_isbrlylczt" ON "qti"."mathml_display" IS 'foreign key MathmlDisplay(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_divergence_fk_id_tag_kind_m_divergence_lf_7_rephmcheow" ON "qti"."mathml_divergence" IS 'foreign key MathmlDivergence(id, __tag_kind_m_divergence_lf7s2l7csn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_divide_fk_id_tag_kind_m_divide_hljq_3_bljki_7qd3ykyfke" ON "qti"."mathml_divide" IS 'foreign key MathmlDivide(id, __tag_kind_m_divide_hljq3bljki) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_domain_fk_id_tag_kind_m_domain_f_636_fecyb_wmdbd4eos3" ON "qti"."mathml_domain" IS 'foreign key MathmlDomain(id, __tag_kind_m_domain_f636fecyb3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_domainofapplication_fk_id_tag_kind_m_cc7ybatqhc" ON "qti"."mathml_domainofapplication" IS 'foreign key MathmlDomainofapplication(id, __tag_kind_m_domainofapplication_p32lmqyvju) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_edge_fk_kind_attribute_tag_type_edge_jmuqtvx7of" ON "qti"."mathml_edge" IS 'foreign key MathmlEdge(kind, attribute, __tag_type_edge_iuoelrniia) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_edge_fk_node_kind_ockotj2udv" ON "qti"."mathml_edge" IS 'foreign key MathmlEdge(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_embed_source_fk_kind_attribute_tag_type_53rem3desg" ON "qti"."mathml_embed_source" IS 'foreign key MathmlEmbedSource(kind, attribute, __tag_type_embed_source_n7fs6bfobb) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_embed_source_fk_node_kind_bqd4uagn3a" ON "qti"."mathml_embed_source" IS 'foreign key MathmlEmbedSource(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_emptyset_fk_id_tag_kind_m_emptyset_al53elckcx" ON "qti"."mathml_emptyset" IS 'foreign key MathmlEmptyset(id, __tag_kind_m_emptyset_tgxutwjcbv) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_eq_fk_id_tag_kind_m_eq_zt_2_uyo_5_zmx_443aq3opvz" ON "qti"."mathml_eq" IS 'foreign key MathmlEq(id, __tag_kind_m_eq_zt2uyo5zmx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_equivalent_fk_id_tag_kind_m_equivalent_chw_o6p24v4ftr" ON "qti"."mathml_equivalent" IS 'foreign key MathmlEquivalent(id, __tag_kind_m_equivalent_chw7c3l2pg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_eulergamma_fk_id_tag_kind_m_eulergamma_7_t4ih2jklx2" ON "qti"."mathml_eulergamma" IS 'foreign key MathmlEulergamma(id, __tag_kind_m_eulergamma_7vwknmgaz3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_exists_fk_id_tag_kind_m_exists_26_megfczw_3_ht4z3m6z3s" ON "qti"."mathml_exists" IS 'foreign key MathmlExists(id, __tag_kind_m_exists_26megfczw3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_exp_fk_id_tag_kind_m_exp_hp_5_qgqr_6_mo_pb2txph7zu" ON "qti"."mathml_exp" IS 'foreign key MathmlExp(id, __tag_kind_m_exp_hp5qgqr6mo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_exponentiale_fk_id_tag_kind_m_exponentiale_3kh44loljn" ON "qti"."mathml_exponentiale" IS 'foreign key MathmlExponentiale(id, __tag_kind_m_exponentiale_n3bg467okv) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_factorial_fk_id_tag_kind_m_factorial_luq_3_4s42qqrg3d" ON "qti"."mathml_factorial" IS 'foreign key MathmlFactorial(id, __tag_kind_m_factorial_luq3tna6il) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_factorof_fk_id_tag_kind_m_factorof_7_zjnxd23gy6" ON "qti"."mathml_factorof" IS 'foreign key MathmlFactorof(id, __tag_kind_m_factorof_7mkqtxhp6r) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_false_fk_id_tag_kind_m_false_2_lwwbihgiq_btsi2utrz5" ON "qti"."mathml_false" IS 'foreign key MathmlFalse(id, __tag_kind_m_false_2lwwbihgiq) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_floor_fk_id_tag_kind_m_floor_ldoeltb_3_g_2_7zgwnudboi" ON "qti"."mathml_floor" IS 'foreign key MathmlFloor(id, __tag_kind_m_floor_ldoeltb3g2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_fn_fk_id_tag_kind_m_fn_4_bvdfdhf_5_b_4qbfozkric" ON "qti"."mathml_fn" IS 'foreign key MathmlFn(id, __tag_kind_m_fn_4bvdfdhf5b) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_fontstyle_fk_kind_attribute_tag_type_hx5o7vpyna" ON "qti"."mathml_fontstyle" IS 'foreign key MathmlFontstyle(kind, attribute, __tag_type_fontstyle_phcqb3bvk2) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_fontstyle_fk_node_kind_hufkghtzzm" ON "qti"."mathml_fontstyle" IS 'foreign key MathmlFontstyle(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_fontweight_fk_kind_attribute_tag_type_h6piorbjoo" ON "qti"."mathml_fontweight" IS 'foreign key MathmlFontweight(kind, attribute, __tag_type_fontweight_uinmbdi34f) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_fontweight_fk_node_kind_2pb4ssfylm" ON "qti"."mathml_fontweight" IS 'foreign key MathmlFontweight(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_forall_fk_id_tag_kind_m_forall_ef_26_ntzivb_a3xxliz6oc" ON "qti"."mathml_forall" IS 'foreign key MathmlForall(id, __tag_kind_m_forall_ef26ntzivb) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_form_fk_kind_attribute_tag_type_form_4j33w5dbrj" ON "qti"."mathml_form" IS 'foreign key MathmlForm(kind, attribute, __tag_type_form_gdgsyoa7tz) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_form_fk_node_kind_5jojixnnqy" ON "qti"."mathml_form" IS 'foreign key MathmlForm(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_framespacing_fk_kind_attribute_tag_type_3tl3hbytkx" ON "qti"."mathml_framespacing" IS 'foreign key MathmlFramespacing(kind, attribute, __tag_type_framespacing_npn4kimxhg) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_framespacing_fk_node_kind_jfzexcnu2a" ON "qti"."mathml_framespacing" IS 'foreign key MathmlFramespacing(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_gcd_fk_id_tag_kind_m_gcd_xa_57_vvjg_5_a_theqnyqhtq" ON "qti"."mathml_gcd" IS 'foreign key MathmlGcd(id, __tag_kind_m_gcd_xa57vvjg5a) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_geq_fk_id_tag_kind_m_geq_n_5_wokg_4_gqv_t4zxz5powx" ON "qti"."mathml_geq" IS 'foreign key MathmlGeq(id, __tag_kind_m_geq_n5wokg4gqv) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_grad_fk_id_tag_kind_m_grad_6_q_4_ynpcv_7_x_h2obrgzlq3" ON "qti"."mathml_grad" IS 'foreign key MathmlGrad(id, __tag_kind_m_grad_6q4ynpcv7x) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_group_alignment_fk_kind_attribute_tag_type_kvbtgsmbq4" ON "qti"."mathml_group_alignment" IS 'foreign key MathmlGroupAlignment(kind, attribute, __tag_type_group_alignment_pqo7age7u2) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_group_alignment_fk_node_kind_4fhz63arux" ON "qti"."mathml_group_alignment" IS 'foreign key MathmlGroupAlignment(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_group_alignment_list_fk_kind_attribute_tag_isw35peiy6" ON "qti"."mathml_group_alignment_list" IS 'foreign key MathmlGroupAlignmentList(kind, attribute, __tag_type_group_alignment_list_uuhrki2oda) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_group_alignment_list_fk_node_kind_5zi36wuvdk" ON "qti"."mathml_group_alignment_list" IS 'foreign key MathmlGroupAlignmentList(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_group_alignment_list_list_fk_kind_attribute_lhjq7ggj5z" ON "qti"."mathml_group_alignment_list_list" IS 'foreign key MathmlGroupAlignmentListList(kind, attribute, __tag_type_group_alignment_list_list_qianckw2my) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_group_alignment_list_list_fk_node_kind_g7abqq3an2" ON "qti"."mathml_group_alignment_list_list" IS 'foreign key MathmlGroupAlignmentListList(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_gt_fk_id_tag_kind_m_gt_jthh_6_lobdq_or2tvjr2sx" ON "qti"."mathml_gt" IS 'foreign key MathmlGt(id, __tag_kind_m_gt_jthh6lobdq) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_href_fk_kind_attribute_tag_type_href_yzb_73_4uw4xsmuxj" ON "qti"."mathml_href" IS 'foreign key MathmlHref(kind, attribute, __tag_type_href_yzb73hqcyn) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_href_fk_node_kind_oej35z7kza" ON "qti"."mathml_href" IS 'foreign key MathmlHref(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_ident_fk_id_tag_kind_m_ident_hirfnzkvy_7_aebmzgf7yh" ON "qti"."mathml_ident" IS 'foreign key MathmlIdent(id, __tag_kind_m_ident_hirfnzkvy7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_image_fk_id_tag_kind_m_image_ytpk_7_tcvqx_q2i3o7fkyw" ON "qti"."mathml_image" IS 'foreign key MathmlImage(id, __tag_kind_m_image_ytpk7tcvqx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_imaginary_fk_id_tag_kind_m_imaginary_2zb3z5o33d" ON "qti"."mathml_imaginary" IS 'foreign key MathmlImaginary(id, __tag_kind_m_imaginary_xoprhipe34) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_imaginaryi_fk_id_tag_kind_m_imaginaryi_ycyecj4sps" ON "qti"."mathml_imaginaryi" IS 'foreign key MathmlImaginaryi(id, __tag_kind_m_imaginaryi_baxxqzk6iy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_implies_fk_id_tag_kind_m_implies_lq_7_yrzde_n6p5rrguvk" ON "qti"."mathml_implies" IS 'foreign key MathmlImplies(id, __tag_kind_m_implies_lq7yrzde2h) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_in_fk_id_tag_kind_m_in_r_3_eoy_4_iycj_jlzm5hvqbm" ON "qti"."mathml_in" IS 'foreign key MathmlIn(id, __tag_kind_m_in_r3eoy4iycj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_indentalign_fk_kind_attribute_tag_type_dlfhl4k64c" ON "qti"."mathml_indentalign" IS 'foreign key MathmlIndentalign(kind, attribute, __tag_type_indentalign_j5iv5corng) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_indentalign_fk_node_kind_vkxwqrcexh" ON "qti"."mathml_indentalign" IS 'foreign key MathmlIndentalign(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_indentalign_line_fk_kind_attribute_tag_type_vleiq2azkf" ON "qti"."mathml_indentalign_line" IS 'foreign key MathmlIndentalignLine(kind, attribute, __tag_type_indentalign_line_qkwuxxgavh) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_indentalign_line_fk_node_kind_6tzr75we6g" ON "qti"."mathml_indentalign_line" IS 'foreign key MathmlIndentalignLine(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_indentshift_line_fk_kind_attribute_tag_type_kp5hhsrj4f" ON "qti"."mathml_indentshift_line" IS 'foreign key MathmlIndentshiftLine(kind, attribute, __tag_type_indentshift_line_cuy5tnfbaq) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_indentshift_line_fk_node_kind_6i3at4zcld" ON "qti"."mathml_indentshift_line" IS 'foreign key MathmlIndentshiftLine(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_index_fk_kind_attribute_tag_type_index_h_3_gdgdc2lv2t" ON "qti"."mathml_index" IS 'foreign key MathmlIndex(kind, attribute, __tag_type_index_h3u3yjrhy5) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_index_fk_node_kind_42lsqr5ru4" ON "qti"."mathml_index" IS 'foreign key MathmlIndex(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_infinity_fk_id_tag_kind_m_infinity_dkhf3au5ws" ON "qti"."mathml_infinity" IS 'foreign key MathmlInfinity(id, __tag_kind_m_infinity_ylqzdwkaro) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_infixlinebreakstyle_fk_kind_attribute_tag_2mitpkmqjm" ON "qti"."mathml_infixlinebreakstyle" IS 'foreign key MathmlInfixlinebreakstyle(kind, attribute, __tag_type_infixlinebreakstyle_bfpwwvm7sn) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_infixlinebreakstyle_fk_node_kind_c2s3iwviqv" ON "qti"."mathml_infixlinebreakstyle" IS 'foreign key MathmlInfixlinebreakstyle(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_int_fk_id_tag_kind_m_int_eacj_64_es_7_a_rcx5l4vss4" ON "qti"."mathml_int" IS 'foreign key MathmlInt(id, __tag_kind_m_int_eacj64es7a) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_integers_fk_id_tag_kind_m_integers_ynhsls_5_dk5gnglvbe" ON "qti"."mathml_integers" IS 'foreign key MathmlIntegers(id, __tag_kind_m_integers_ynhsls5pt2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_intersect_fk_id_tag_kind_m_intersect_2_t_6_tijpynanif" ON "qti"."mathml_intersect" IS 'foreign key MathmlIntersect(id, __tag_kind_m_intersect_2t6lpqnkyo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_interval_fk_id_tag_kind_m_interval_c_4_ld_6_xd37mqalbj" ON "qti"."mathml_interval" IS 'foreign key MathmlInterval(id, __tag_kind_m_interval_c4ld6f4f6d) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_inverse_fk_id_tag_kind_m_inverse_jjpt_2_lp_hqcgxc577i" ON "qti"."mathml_inverse" IS 'foreign key MathmlInverse(id, __tag_kind_m_inverse_jjpt2lp3pd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_lambda_fk_id_tag_kind_m_lambda_v_5_k_6_mszoju4aoe" ON "qti"."mathml_lambda" IS 'foreign key MathmlLambda(id, __tag_kind_m_lambda_v5k6arscmx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_laplacian_fk_id_tag_kind_m_laplacian_4_tx_6_bqmtns5skw" ON "qti"."mathml_laplacian" IS 'foreign key MathmlLaplacian(id, __tag_kind_m_laplacian_4tx6pg3cdf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_lcm_fk_id_tag_kind_m_lcm_66_u_5_rutbgm_z7fm5naof5" ON "qti"."mathml_lcm" IS 'foreign key MathmlLcm(id, __tag_kind_m_lcm_66u5rutbgm) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_length_fk_kind_attribute_tag_type_length_3_ykqevyabwv" ON "qti"."mathml_length" IS 'foreign key MathmlLength(kind, attribute, __tag_type_length_3ryxkrjjhb) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_length_fk_node_kind_z7qdemqs2c" ON "qti"."mathml_length" IS 'foreign key MathmlLength(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_length_list_fk_kind_attribute_tag_type_7kb743eisb" ON "qti"."mathml_length_list" IS 'foreign key MathmlLengthList(kind, attribute, __tag_type_length_list_dngtcn7r6m) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_length_list_fk_node_kind_vybs4zixkc" ON "qti"."mathml_length_list" IS 'foreign key MathmlLengthList(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_leq_fk_id_tag_kind_m_leq_b_7_euz_5_pala_lnt57chfyq" ON "qti"."mathml_leq" IS 'foreign key MathmlLeq(id, __tag_kind_m_leq_b7euz5pala) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_limit_fk_id_tag_kind_m_limit_l_2_u_2_dzwokn_iwzba2itpu" ON "qti"."mathml_limit" IS 'foreign key MathmlLimit(id, __tag_kind_m_limit_l2u2dzwokn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_line_thickness_fk_kind_attribute_tag_type_fnq6uvl7ff" ON "qti"."mathml_line_thickness" IS 'foreign key MathmlLineThickness(kind, attribute, __tag_type_line_thickness_wchmxjoakj) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_line_thickness_fk_node_kind_oe3c4rh3ml" ON "qti"."mathml_line_thickness" IS 'foreign key MathmlLineThickness(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_linebreak_fk_kind_attribute_tag_type_l32eitr3mg" ON "qti"."mathml_linebreak" IS 'foreign key MathmlLinebreak(kind, attribute, __tag_type_linebreak_w6lunataa2) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_linebreak_fk_node_kind_7mqbizecgv" ON "qti"."mathml_linebreak" IS 'foreign key MathmlLinebreak(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_linebreakstyle_fk_kind_attribute_tag_type_tsr7ltsahd" ON "qti"."mathml_linebreakstyle" IS 'foreign key MathmlLinebreakstyle(kind, attribute, __tag_type_linebreakstyle_llwvaljtbh) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_linebreakstyle_fk_node_kind_7i3aapil4p" ON "qti"."mathml_linebreakstyle" IS 'foreign key MathmlLinebreakstyle(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_linestyle_fk_kind_attribute_tag_type_k6envmuams" ON "qti"."mathml_linestyle" IS 'foreign key MathmlLinestyle(kind, attribute, __tag_type_linestyle_epwcv3z4sm) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_linestyle_fk_node_kind_opjmsz3q5p" ON "qti"."mathml_linestyle" IS 'foreign key MathmlLinestyle(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_linestyle_list_fk_kind_attribute_tag_type_wii7rpdg5e" ON "qti"."mathml_linestyle_list" IS 'foreign key MathmlLinestyleList(kind, attribute, __tag_type_linestyle_list_rb27ousd5c) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_linestyle_list_fk_node_kind_rlfewpffcp" ON "qti"."mathml_linestyle_list" IS 'foreign key MathmlLinestyleList(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_list_fk_id_tag_kind_m_list_ididamd_2_sx_sg4lan6fmt" ON "qti"."mathml_list" IS 'foreign key MathmlList(id, __tag_kind_m_list_ididamd2sx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_ln_fk_id_tag_kind_m_ln_ffmsmo_2_m_36_vhus4a7kcw" ON "qti"."mathml_ln" IS 'foreign key MathmlLn(id, __tag_kind_m_ln_ffmsmo2m36) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_location_fk_kind_attribute_tag_type_rgiit4fdw7" ON "qti"."mathml_location" IS 'foreign key MathmlLocation(kind, attribute, __tag_type_location_kr5ll5xiqo) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_location_fk_node_kind_ujzoqvivbu" ON "qti"."mathml_location" IS 'foreign key MathmlLocation(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_log_fk_id_tag_kind_m_log_3_dqvvrgdqn_af5n3hwgt3" ON "qti"."mathml_log" IS 'foreign key MathmlLog(id, __tag_kind_m_log_3dqvvrgdqn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_logbase_fk_id_tag_kind_m_logbase_iwvpr_4_ym_pchomqut4n" ON "qti"."mathml_logbase" IS 'foreign key MathmlLogbase(id, __tag_kind_m_logbase_iwvpr4ym5u) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_longdivstyle_fk_kind_attribute_tag_type_3c2aumnvca" ON "qti"."mathml_longdivstyle" IS 'foreign key MathmlLongdivstyle(kind, attribute, __tag_type_longdivstyle_x6uaaro43p) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_longdivstyle_fk_node_kind_4yxb3csx2f" ON "qti"."mathml_longdivstyle" IS 'foreign key MathmlLongdivstyle(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_lowlimit_fk_id_tag_kind_m_lowlimit_2_it5m3i4c4b" ON "qti"."mathml_lowlimit" IS 'foreign key MathmlLowlimit(id, __tag_kind_m_lowlimit_2pfspebfal) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_lt_fk_id_tag_kind_m_lt_vgxgnlpcov_z6unnkmizj" ON "qti"."mathml_lt" IS 'foreign key MathmlLt(id, __tag_kind_m_lt_vgxgnlpcov) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_maction_fk_id_tag_kind_m_maction_y_36_3pbp2yv3lb" ON "qti"."mathml_maction" IS 'foreign key MathmlMaction(id, __tag_kind_m_maction_y36nfqlpyh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_maligngroup_fk_id_tag_kind_m_maligngroup_275viqmpwv" ON "qti"."mathml_maligngroup" IS 'foreign key MathmlMaligngroup(id, __tag_kind_m_maligngroup_wampytcaou) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_malignmark_fk_id_tag_kind_m_malignmark_nz_hfmmfmvoii" ON "qti"."mathml_malignmark" IS 'foreign key MathmlMalignmark(id, __tag_kind_m_malignmark_nz76twvsrf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_math_fk_id_tag_kind_m_math_dtmrz_3_gcfd_phb3477eeq" ON "qti"."mathml_math" IS 'foreign key MathmlMath(id, __tag_kind_m_math_dtmrz3gcfd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mathsize_fk_kind_attribute_tag_type_awx2rw4rnx" ON "qti"."mathml_mathsize" IS 'foreign key MathmlMathsize(kind, attribute, __tag_type_mathsize_grkbgzyt3i) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_mathsize_fk_node_kind_absyeauc6p" ON "qti"."mathml_mathsize" IS 'foreign key MathmlMathsize(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mathvariant_fk_kind_attribute_tag_type_4yq3o3c6uh" ON "qti"."mathml_mathvariant" IS 'foreign key MathmlMathvariant(kind, attribute, __tag_type_mathvariant_g4idzs45uj) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_mathvariant_fk_node_kind_catgrezkeo" ON "qti"."mathml_mathvariant" IS 'foreign key MathmlMathvariant(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_matrix_fk_id_tag_kind_m_matrix_mnfvdmlrs_2_jyqfcyxvro" ON "qti"."mathml_matrix" IS 'foreign key MathmlMatrix(id, __tag_kind_m_matrix_mnfvdmlrs2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_matrixrow_fk_id_tag_kind_m_matrixrow_2omt43owvi" ON "qti"."mathml_matrixrow" IS 'foreign key MathmlMatrixrow(id, __tag_kind_m_matrixrow_uhamsripkq) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_max_fk_id_tag_kind_m_max_cr_2_qia_23_nv_gh7naayo66" ON "qti"."mathml_max" IS 'foreign key MathmlMax(id, __tag_kind_m_max_cr2qia23nv) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_maxsize_fk_kind_attribute_tag_type_maxsize_kw2nrfcw5f" ON "qti"."mathml_maxsize" IS 'foreign key MathmlMaxsize(kind, attribute, __tag_type_maxsize_562tlh7e4a) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_maxsize_fk_node_kind_z5nxhi6gup" ON "qti"."mathml_maxsize" IS 'foreign key MathmlMaxsize(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mean_fk_id_tag_kind_m_mean_e_72_hycklnh_tzruj5ntxj" ON "qti"."mathml_mean" IS 'foreign key MathmlMean(id, __tag_kind_m_mean_e72hycklnh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_median_fk_id_tag_kind_m_median_fornyqw_6_hp_l46k2aeduq" ON "qti"."mathml_median" IS 'foreign key MathmlMedian(id, __tag_kind_m_median_fornyqw6hp) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_menclose_fk_id_tag_kind_m_menclose_jsw_5_whvaoitiaw" ON "qti"."mathml_menclose" IS 'foreign key MathmlMenclose(id, __tag_kind_m_menclose_jsw5qoccrd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_merror_fk_id_tag_kind_m_merror_nhqlhek_76_i_hhqefdo5f2" ON "qti"."mathml_merror" IS 'foreign key MathmlMerror(id, __tag_kind_m_merror_nhqlhek76i) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mfenced_fk_id_tag_kind_m_mfenced_oo_5_jinni4f7jn" ON "qti"."mathml_mfenced" IS 'foreign key MathmlMfenced(id, __tag_kind_m_mfenced_oo5qjasnee) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mfrac_fk_id_tag_kind_m_mfrac_vmplftveia_pizckennqt" ON "qti"."mathml_mfrac" IS 'foreign key MathmlMfrac(id, __tag_kind_m_mfrac_vmplftveia) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mglyph_fk_id_tag_kind_m_mglyph_24_iju_5_rtmrwopnwl" ON "qti"."mathml_mglyph" IS 'foreign key MathmlMglyph(id, __tag_kind_m_mglyph_24iju5mdym) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mi_fk_id_tag_kind_m_mi_p_7_i_7_slzmp_4_d3u74arjsp" ON "qti"."mathml_mi" IS 'foreign key MathmlMi(id, __tag_kind_m_mi_p7i7slzmp4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_min_fk_id_tag_kind_m_min_ptzeah_4_ns_2_5wdb7h4x7z" ON "qti"."mathml_min" IS 'foreign key MathmlMin(id, __tag_kind_m_min_ptzeah4ns2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_minus_fk_id_tag_kind_m_minus_hcem_3_twfsv_7tnk5txuo5" ON "qti"."mathml_minus" IS 'foreign key MathmlMinus(id, __tag_kind_m_minus_hcem3twfsv) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mlabeledtr_fk_id_tag_kind_m_mlabeledtr_j_5_n3txezzmy3" ON "qti"."mathml_mlabeledtr" IS 'foreign key MathmlMlabeledtr(id, __tag_kind_m_mlabeledtr_j5pxrv3x2d) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mlongdiv_fk_id_tag_kind_m_mlongdiv_22_cw7qetmmy2" ON "qti"."mathml_mlongdiv" IS 'foreign key MathmlMlongdiv(id, __tag_kind_m_mlongdiv_22mypvxzfm) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mmultiscripts_fk_id_tag_kind_m_abpuvkdv6e" ON "qti"."mathml_mmultiscripts" IS 'foreign key MathmlMmultiscripts(id, __tag_kind_m_mmultiscripts_inoxa5l6ol) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mn_fk_id_tag_kind_m_mn_2_penr_6_noah_jyl2imcrkq" ON "qti"."mathml_mn" IS 'foreign key MathmlMn(id, __tag_kind_m_mn_2penr6noah) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mo_fk_id_tag_kind_m_mo_izsuukhwhz_wvtzcl3r62" ON "qti"."mathml_mo" IS 'foreign key MathmlMo(id, __tag_kind_m_mo_izsuukhwhz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mode_fk_id_tag_kind_m_mode_f_2_wxgo_6_k_7_y_bhu6eoqd4h" ON "qti"."mathml_mode" IS 'foreign key MathmlMode(id, __tag_kind_m_mode_f2wxgo6k7y) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_moment_fk_id_tag_kind_m_moment_r_3_exfc_4_4xlbat6qns" ON "qti"."mathml_moment" IS 'foreign key MathmlMoment(id, __tag_kind_m_moment_r3exfc4eqr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_momentabout_fk_id_tag_kind_m_momentabout_2zgq3j2vli" ON "qti"."mathml_momentabout" IS 'foreign key MathmlMomentabout(id, __tag_kind_m_momentabout_jpx6cayxgs) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mover_fk_id_tag_kind_m_mover_2_sodqbv_35_q_pjbope7mvb" ON "qti"."mathml_mover" IS 'foreign key MathmlMover(id, __tag_kind_m_mover_2sodqbv35q) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mpadded_fk_id_tag_kind_m_mpadded_3_vz_5_brutze7s6s" ON "qti"."mathml_mpadded" IS 'foreign key MathmlMpadded(id, __tag_kind_m_mpadded_3vz5xdkeiw) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mpadded_length_fk_kind_attribute_tag_type_yirqwf3fhz" ON "qti"."mathml_mpadded_length" IS 'foreign key MathmlMpaddedLength(kind, attribute, __tag_type_mpadded_length_h2bjgoqjt5) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_mpadded_length_fk_node_kind_4o5bftaluy" ON "qti"."mathml_mpadded_length" IS 'foreign key MathmlMpaddedLength(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mphantom_fk_id_tag_kind_m_mphantom_q_5_jic_djybnu3mdi" ON "qti"."mathml_mphantom" IS 'foreign key MathmlMphantom(id, __tag_kind_m_mphantom_q5jic2y66l) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mprescripts_fk_id_tag_kind_m_mprescripts_uf_25vooc27he" ON "qti"."mathml_mprescripts" IS 'foreign key MathmlMprescripts(id, __tag_kind_m_mprescripts_uf33moyqvt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mroot_fk_id_tag_kind_m_mroot_qn_2422_dmq_4_uzmnd3fqum" ON "qti"."mathml_mroot" IS 'foreign key MathmlMroot(id, __tag_kind_m_mroot_qn2422dmq4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mrow_fk_id_tag_kind_m_mrow_cytyvwkgdf_eiwwdyoyge" ON "qti"."mathml_mrow" IS 'foreign key MathmlMrow(id, __tag_kind_m_mrow_cytyvwkgdf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_ms_fk_id_tag_kind_m_ms_pdgylwa_6_dz_iqyuktfjis" ON "qti"."mathml_ms" IS 'foreign key MathmlMs(id, __tag_kind_m_ms_pdgylwa6dz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mscarries_fk_id_tag_kind_m_mscarries_fc5wqmwok5" ON "qti"."mathml_mscarries" IS 'foreign key MathmlMscarries(id, __tag_kind_m_mscarries_vkanwmtzz4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mscarry_fk_id_tag_kind_m_mscarry_ajupuy_2_i_oiurgy7qd2" ON "qti"."mathml_mscarry" IS 'foreign key MathmlMscarry(id, __tag_kind_m_mscarry_ajupuy2i2b) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_msgroup_fk_id_tag_kind_m_msgroup_gc_5_kcdhb_ijxztgbzjd" ON "qti"."mathml_msgroup" IS 'foreign key MathmlMsgroup(id, __tag_kind_m_msgroup_gc5kcdhb3n) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_msline_fk_id_tag_kind_m_msline_3_vuunvoaru_nt7jjl4v6f" ON "qti"."mathml_msline" IS 'foreign key MathmlMsline(id, __tag_kind_m_msline_3vuunvoaru) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mspace_fk_id_tag_kind_m_mspace_su_7_akczkbj_buz6mku4oc" ON "qti"."mathml_mspace" IS 'foreign key MathmlMspace(id, __tag_kind_m_mspace_su7akczkbj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mspace_linebreak_fk_kind_attribute_tag_type_5fl4oxiscs" ON "qti"."mathml_mspace_linebreak" IS 'foreign key MathmlMspaceLinebreak(kind, attribute, __tag_type_mspace_linebreak_2ttbtg2pof) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_mspace_linebreak_fk_node_kind_7c76w7u4yy" ON "qti"."mathml_mspace_linebreak" IS 'foreign key MathmlMspaceLinebreak(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_msqrt_fk_id_tag_kind_m_msqrt_7_jzntxzyfy_mxcfie2z3r" ON "qti"."mathml_msqrt" IS 'foreign key MathmlMsqrt(id, __tag_kind_m_msqrt_7jzntxzyfy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_msrow_fk_id_tag_kind_m_msrow_j_7_ltxdt_2_up_2bkxhcofv5" ON "qti"."mathml_msrow" IS 'foreign key MathmlMsrow(id, __tag_kind_m_msrow_j7ltxdt2up) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mstack_fk_id_tag_kind_m_mstack_gkm_7_obfda_7rf5ox74m6" ON "qti"."mathml_mstack" IS 'foreign key MathmlMstack(id, __tag_kind_m_mstack_gkm7obfda2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mstyle_fk_id_tag_kind_m_mstyle_zxd_3_ckdwex_kzc6ldsr6c" ON "qti"."mathml_mstyle" IS 'foreign key MathmlMstyle(id, __tag_kind_m_mstyle_zxd3ckdwex) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_msub_fk_id_tag_kind_m_msub_fjwntq_3_ri_6_equyw54o7p" ON "qti"."mathml_msub" IS 'foreign key MathmlMsub(id, __tag_kind_m_msub_fjwntq3ri6) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_msubsup_fk_id_tag_kind_m_msubsup_m_3_aq_3_sfset6eiba" ON "qti"."mathml_msubsup" IS 'foreign key MathmlMsubsup(id, __tag_kind_m_msubsup_m3aq3rdyeg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_msup_fk_id_tag_kind_m_msup_kwgtpz_276_e_h2qyu7dy7m" ON "qti"."mathml_msup" IS 'foreign key MathmlMsup(id, __tag_kind_m_msup_kwgtpz276e) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mtable_fk_id_tag_kind_m_mtable_ddkzxi_42_to_cu5lmstryf" ON "qti"."mathml_mtable" IS 'foreign key MathmlMtable(id, __tag_kind_m_mtable_ddkzxi42to) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mtd_fk_id_tag_kind_m_mtd_zh_62_fovndd_2aq4a5xdeq" ON "qti"."mathml_mtd" IS 'foreign key MathmlMtd(id, __tag_kind_m_mtd_zh62fovndd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mtext_fk_id_tag_kind_m_mtext_gjyzedp_263_6qxna2hwxt" ON "qti"."mathml_mtext" IS 'foreign key MathmlMtext(id, __tag_kind_m_mtext_gjyzedp263) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_mtr_fk_id_tag_kind_m_mtr_tiryvttk_6_j_f63xmckwl3" ON "qti"."mathml_mtr" IS 'foreign key MathmlMtr(id, __tag_kind_m_mtr_tiryvttk6j) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_munder_fk_id_tag_kind_m_munder_xjdj_25_enzu_bhlwxrxaux" ON "qti"."mathml_munder" IS 'foreign key MathmlMunder(id, __tag_kind_m_munder_xjdj25enzu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_munderover_fk_id_tag_kind_m_munderover_7_zhqp5n2as2" ON "qti"."mathml_munderover" IS 'foreign key MathmlMunderover(id, __tag_kind_m_munderover_7rxt37agxh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_name_fk_kind_attribute_tag_type_name_g_4_vf_vew53x5kny" ON "qti"."mathml_name" IS 'foreign key MathmlName(kind, attribute, __tag_type_name_g4vf3tlvtw) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_name_fk_node_kind_b6didf5wq7" ON "qti"."mathml_name" IS 'foreign key MathmlName(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_nargs_fk_kind_attribute_tag_type_nargs_ygqc_3o3x5gutue" ON "qti"."mathml_nargs" IS 'foreign key MathmlNargs(kind, attribute, __tag_type_nargs_ygqc7vdqpk) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_nargs_fk_node_kind_xy4dqwp2cy" ON "qti"."mathml_nargs" IS 'foreign key MathmlNargs(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_naturalnumbers_fk_id_tag_kind_m_e3eofvyx4v" ON "qti"."mathml_naturalnumbers" IS 'foreign key MathmlNaturalnumbers(id, __tag_kind_m_naturalnumbers_4si2qmk4bt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_neq_fk_id_tag_kind_m_neq_sfxeauet_33_fja4dthw6m" ON "qti"."mathml_neq" IS 'foreign key MathmlNeq(id, __tag_kind_m_neq_sfxeauet33) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_none_fk_id_tag_kind_m_none_txrqdn_7_o_6_t_p6uxms7ijp" ON "qti"."mathml_none" IS 'foreign key MathmlNone(id, __tag_kind_m_none_txrqdn7o6t) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_not_fk_id_tag_kind_m_not_jf_3_l_6_qjxrd_t4d4tdvuub" ON "qti"."mathml_not" IS 'foreign key MathmlNot(id, __tag_kind_m_not_jf3l6qjxrd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_notanumber_fk_id_tag_kind_m_notanumber_v4ealmqq7r" ON "qti"."mathml_notanumber" IS 'foreign key MathmlNotanumber(id, __tag_kind_m_notanumber_zucyyudpwj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_notin_fk_id_tag_kind_m_notin_gjm_5_pzhaib_faj6qf6cn2" ON "qti"."mathml_notin" IS 'foreign key MathmlNotin(id, __tag_kind_m_notin_gjm5pzhaib) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_notprsubset_fk_id_tag_kind_m_notprsubset_jvmpi3um4w" ON "qti"."mathml_notprsubset" IS 'foreign key MathmlNotprsubset(id, __tag_kind_m_notprsubset_mdvhlxpocq) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_notsubset_fk_id_tag_kind_m_notsubset_7t2afbwukl" ON "qti"."mathml_notsubset" IS 'foreign key MathmlNotsubset(id, __tag_kind_m_notsubset_hyskqhass5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_number_fk_kind_attribute_tag_type_number_su_6awrod3heg" ON "qti"."mathml_number" IS 'foreign key MathmlNumber(kind, attribute, __tag_type_number_su5a7mhmov) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_number_fk_node_kind_ihu2amieuq" ON "qti"."mathml_number" IS 'foreign key MathmlNumber(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_occurrence_fk_kind_attribute_tag_type_4njw7f5ope" ON "qti"."mathml_occurrence" IS 'foreign key MathmlOccurrence(kind, attribute, __tag_type_occurrence_poownjlqsd) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_occurrence_fk_node_kind_63afdyz7ei" ON "qti"."mathml_occurrence" IS 'foreign key MathmlOccurrence(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_or_fk_id_tag_kind_m_or_kw_7_pzhxnad_gofyty2vkv" ON "qti"."mathml_or" IS 'foreign key MathmlOr(id, __tag_kind_m_or_kw7pzhxnad) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_order_fk_kind_attribute_tag_type_order_7_zpmizwz6n3" ON "qti"."mathml_order" IS 'foreign key MathmlOrder(kind, attribute, __tag_type_order_7gyulwkonz) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_order_fk_node_kind_24wxiilca5" ON "qti"."mathml_order" IS 'foreign key MathmlOrder(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_otherwise_fk_id_tag_kind_m_otherwise_a_6_zs_pkcpqdmfzi" ON "qti"."mathml_otherwise" IS 'foreign key MathmlOtherwise(id, __tag_kind_m_otherwise_a6zs5hnn2a) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_outerproduct_fk_id_tag_kind_m_outerproduct_rw6h3tj6yz" ON "qti"."mathml_outerproduct" IS 'foreign key MathmlOuterproduct(id, __tag_kind_m_outerproduct_p4a4z6sd6m) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_overflow_fk_kind_attribute_tag_type_dkknu7rdyg" ON "qti"."mathml_overflow" IS 'foreign key MathmlOverflow(kind, attribute, __tag_type_overflow_fijx4zdoiz) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_overflow_fk_node_kind_hfzsoxmekj" ON "qti"."mathml_overflow" IS 'foreign key MathmlOverflow(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_partialdiff_fk_id_tag_kind_m_partialdiff_6_eonlqq5xdc" ON "qti"."mathml_partialdiff" IS 'foreign key MathmlPartialdiff(id, __tag_kind_m_partialdiff_6ypsxmfpsd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_pi_fk_id_tag_kind_m_pi_xvsqr_7_saep_4gj62u5lsz" ON "qti"."mathml_pi" IS 'foreign key MathmlPi(id, __tag_kind_m_pi_xvsqr7saep) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_piece_fk_id_tag_kind_m_piece_k_2_ohxrzecs_ilp4jibyab" ON "qti"."mathml_piece" IS 'foreign key MathmlPiece(id, __tag_kind_m_piece_k2ohxrzecs) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_piecewise_fk_id_tag_kind_m_piecewise_hi_4_zmwp5dw3if" ON "qti"."mathml_piecewise" IS 'foreign key MathmlPiecewise(id, __tag_kind_m_piecewise_hi4sytbaqh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_plus_fk_id_tag_kind_m_plus_4_dxeflazpt_ptk3wz6jj3" ON "qti"."mathml_plus" IS 'foreign key MathmlPlus(id, __tag_kind_m_plus_4dxeflazpt) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_position_fk_kind_attribute_tag_type_smo5ka47n6" ON "qti"."mathml_position" IS 'foreign key MathmlPosition(kind, attribute, __tag_type_position_ti5jyzvjus) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_position_fk_node_kind_635mz3qo4f" ON "qti"."mathml_position" IS 'foreign key MathmlPosition(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_power_fk_id_tag_kind_m_power_6_k_56_p_2_r_6k5g4pwbmh" ON "qti"."mathml_power" IS 'foreign key MathmlPower(id, __tag_kind_m_power_6k56p2r42x) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_primes_fk_id_tag_kind_m_primes_tai_2_obwnjd_dlntmdu62b" ON "qti"."mathml_primes" IS 'foreign key MathmlPrimes(id, __tag_kind_m_primes_tai2obwnjd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_product_fk_id_tag_kind_m_product_x_3_cdvrs_xgonvta3hn" ON "qti"."mathml_product" IS 'foreign key MathmlProduct(id, __tag_kind_m_product_x3cdvrs3g2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_prsubset_fk_id_tag_kind_m_prsubset_4_mbldpfpume" ON "qti"."mathml_prsubset" IS 'foreign key MathmlPrsubset(id, __tag_kind_m_prsubset_4gfelkzi7e) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_quotient_fk_id_tag_kind_m_quotient_s_2_o_75_l6cdkfrabm" ON "qti"."mathml_quotient" IS 'foreign key MathmlQuotient(id, __tag_kind_m_quotient_s2o75pem36) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_rationals_fk_id_tag_kind_m_rationals_2_m_5_suadpycepb" ON "qti"."mathml_rationals" IS 'foreign key MathmlRationals(id, __tag_kind_m_rationals_2m5enf2oj2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_real_fk_id_tag_kind_m_real_junglpuyjh_asltjdfhfc" ON "qti"."mathml_real" IS 'foreign key MathmlReal(id, __tag_kind_m_real_junglpuyjh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_reals_fk_id_tag_kind_m_reals_sltmlx_6_eyd_h2gwyezrib" ON "qti"."mathml_reals" IS 'foreign key MathmlReals(id, __tag_kind_m_reals_sltmlx6eyd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_reln_fk_id_tag_kind_m_reln_bxlrw_6_pjny_m2lqhg7ijq" ON "qti"."mathml_reln" IS 'foreign key MathmlReln(id, __tag_kind_m_reln_bxlrw6pjny) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_rem_fk_id_tag_kind_m_rem_hk_2_fhxi_3_j_3_zfd4shfdm6" ON "qti"."mathml_rem" IS 'foreign key MathmlRem(id, __tag_kind_m_rem_hk2fhxi3j3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_root_fk_id_tag_kind_m_root_k_3_d_4_oyajlo_pdri45x2xl" ON "qti"."mathml_root" IS 'foreign key MathmlRoot(id, __tag_kind_m_root_k3d4oyajlo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_rowalign_fk_kind_attribute_tag_type_2tjjrym6ou" ON "qti"."mathml_rowalign" IS 'foreign key MathmlRowalign(kind, attribute, __tag_type_rowalign_3qkoukbb5i) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_rowalign_fk_node_kind_kzfochmz5a" ON "qti"."mathml_rowalign" IS 'foreign key MathmlRowalign(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_scalarproduct_fk_id_tag_kind_m_4tef7odvvy" ON "qti"."mathml_scalarproduct" IS 'foreign key MathmlScalarproduct(id, __tag_kind_m_scalarproduct_ztm5elappz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_scriptlevel_fk_kind_attribute_tag_type_laffyv7vad" ON "qti"."mathml_scriptlevel" IS 'foreign key MathmlScriptlevel(kind, attribute, __tag_type_scriptlevel_lus7qdlwus) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_scriptlevel_fk_node_kind_prhopg2p3o" ON "qti"."mathml_scriptlevel" IS 'foreign key MathmlScriptlevel(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_sdev_fk_id_tag_kind_m_sdev_ipab_3_uglwf_uxg66zee6z" ON "qti"."mathml_sdev" IS 'foreign key MathmlSdev(id, __tag_kind_m_sdev_ipab3uglwf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_sec_fk_id_tag_kind_m_sec_6_pbevmi_5_vg_mrrv7rmn3b" ON "qti"."mathml_sec" IS 'foreign key MathmlSec(id, __tag_kind_m_sec_6pbevmi5vg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_sech_fk_id_tag_kind_m_sech_bsdecxac_2_s_gjge77nyaq" ON "qti"."mathml_sech" IS 'foreign key MathmlSech(id, __tag_kind_m_sech_bsdecxac2s) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_selection_fk_kind_attribute_tag_type_7fpk3jpamc" ON "qti"."mathml_selection" IS 'foreign key MathmlSelection(kind, attribute, __tag_type_selection_jwgsaywsyr) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_selection_fk_node_kind_wo5vwckloq" ON "qti"."mathml_selection" IS 'foreign key MathmlSelection(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_selector_fk_id_tag_kind_m_selector_id_2_i7cexf5rui" ON "qti"."mathml_selector" IS 'foreign key MathmlSelector(id, __tag_kind_m_selector_id2twbxgz4) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_semantics_fk_id_tag_kind_m_semantics_avfswv4khd" ON "qti"."mathml_semantics" IS 'foreign key MathmlSemantics(id, __tag_kind_m_semantics_hcelfkqiux) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_semantics_ci_fk_id_tag_kind_m_semantics_ci_cxu3mvjsqt" ON "qti"."mathml_semantics_ci" IS 'foreign key MathmlSemanticsCi(id, __tag_kind_m_semantics_ci_kfs5kl2pxo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_sep_fk_id_tag_kind_m_sep_kkvavsjqnh_yoajcwhwbp" ON "qti"."mathml_sep" IS 'foreign key MathmlSep(id, __tag_kind_m_sep_kkvavsjqnh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_set_fk_id_tag_kind_m_set_y_2_qu_2_mnt_3_k_hebacnkxg5" ON "qti"."mathml_set" IS 'foreign key MathmlSet(id, __tag_kind_m_set_y2qu2mnt3k) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_setdiff_fk_id_tag_kind_m_setdiff_6_ak_6_zk5ch6clcw" ON "qti"."mathml_setdiff" IS 'foreign key MathmlSetdiff(id, __tag_kind_m_setdiff_6ak6jezs3j) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_share_fk_id_tag_kind_m_share_6_yal_6_dljfx_2toymchqpm" ON "qti"."mathml_share" IS 'foreign key MathmlShare(id, __tag_kind_m_share_6yal6dljfx) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_shift_fk_kind_attribute_tag_type_shift_ccjga4uxit" ON "qti"."mathml_shift" IS 'foreign key MathmlShift(kind, attribute, __tag_type_shift_apyvsvz66t) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_shift_fk_node_kind_rofoummufm" ON "qti"."mathml_shift" IS 'foreign key MathmlShift(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_side_fk_kind_attribute_tag_type_side_q_47_mxs7uv4h3r" ON "qti"."mathml_side" IS 'foreign key MathmlSide(kind, attribute, __tag_type_side_q47iymixud) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_side_fk_node_kind_ha3xnzizi7" ON "qti"."mathml_side" IS 'foreign key MathmlSide(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_sin_fk_id_tag_kind_m_sin_5_vyjm_4_llew_66vwninxqf" ON "qti"."mathml_sin" IS 'foreign key MathmlSin(id, __tag_kind_m_sin_5vyjm4llew) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_sinh_fk_id_tag_kind_m_sinh_a_5_mwypfwvy_dwpd77bqmm" ON "qti"."mathml_sinh" IS 'foreign key MathmlSinh(id, __tag_kind_m_sinh_a5mwypfwvy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_span_fk_kind_attribute_tag_type_span_oltex_kd7yawchxj" ON "qti"."mathml_span" IS 'foreign key MathmlSpan(kind, attribute, __tag_type_span_oltex6sebj) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_span_fk_node_kind_owkbvjbmxw" ON "qti"."mathml_span" IS 'foreign key MathmlSpan(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_src_fk_kind_attribute_tag_type_src_lxnlnbl_dg7jlsfqki" ON "qti"."mathml_src" IS 'foreign key MathmlSrc(kind, attribute, __tag_type_src_lxnlnbl4zv) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_src_fk_node_kind_usyc7eqibb" ON "qti"."mathml_src" IS 'foreign key MathmlSrc(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_string_fk_kind_attribute_tag_type_string_in_n2jlvww42l" ON "qti"."mathml_string" IS 'foreign key MathmlString(kind, attribute, __tag_type_string_in2ni326mz) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_string_fk_node_kind_kkugfd7ypr" ON "qti"."mathml_string" IS 'foreign key MathmlString(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_subset_fk_id_tag_kind_m_subset_jwykfgzkcc_nqstjvysj7" ON "qti"."mathml_subset" IS 'foreign key MathmlSubset(id, __tag_kind_m_subset_jwykfgzkcc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_sum_fk_id_tag_kind_m_sum_eygixfvnhj_hj67qhjr5y" ON "qti"."mathml_sum" IS 'foreign key MathmlSum(id, __tag_kind_m_sum_eygixfvnhj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_table_width_fk_kind_attribute_tag_type_dow3tvqcus" ON "qti"."mathml_table_width" IS 'foreign key MathmlTableWidth(kind, attribute, __tag_type_table_width_pplztankwm) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_table_width_fk_node_kind_7lvioffw6k" ON "qti"."mathml_table_width" IS 'foreign key MathmlTableWidth(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_tan_fk_id_tag_kind_m_tan_ccevpfe_55_o_hr2efv7zbo" ON "qti"."mathml_tan" IS 'foreign key MathmlTan(id, __tag_kind_m_tan_ccevpfe55o) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_tanh_fk_id_tag_kind_m_tanh_th_7_rxeblxr_mvq4uwflto" ON "qti"."mathml_tanh" IS 'foreign key MathmlTanh(id, __tag_kind_m_tanh_th7rxeblxr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_tendsto_fk_id_tag_kind_m_tendsto_v_6_sdqp_7_v4uikrvays" ON "qti"."mathml_tendsto" IS 'foreign key MathmlTendsto(id, __tag_kind_m_tendsto_v6sdqp7osp) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_times_fk_id_tag_kind_m_times_xfa_335_sssc_5slv6nrjqg" ON "qti"."mathml_times" IS 'foreign key MathmlTimes(id, __tag_kind_m_times_xfa335sssc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_transpose_fk_id_tag_kind_m_transpose_vim_66_m6fizc2my5" ON "qti"."mathml_transpose" IS 'foreign key MathmlTranspose(id, __tag_kind_m_transpose_vim66kqtck) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_true_fk_id_tag_kind_m_true_ggyj_63_hsze_djg7fp6elu" ON "qti"."mathml_true" IS 'foreign key MathmlTrue(id, __tag_kind_m_true_ggyj63hsze) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_union_fk_id_tag_kind_m_union_6_kcpnf_2_mlo_hjmqto24wu" ON "qti"."mathml_union" IS 'foreign key MathmlUnion(id, __tag_kind_m_union_6kcpnf2mlo) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_unsigned_integer_fk_kind_attribute_tag_type_2w25zon65i" ON "qti"."mathml_unsigned_integer" IS 'foreign key MathmlUnsignedInteger(kind, attribute, __tag_type_unsigned_integer_gnblpmuiy3) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_unsigned_integer_fk_node_kind_iu6q7vq2gr" ON "qti"."mathml_unsigned_integer" IS 'foreign key MathmlUnsignedInteger(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_uplimit_fk_id_tag_kind_m_uplimit_6_whdpi_7_c5xchm7faz" ON "qti"."mathml_uplimit" IS 'foreign key MathmlUplimit(id, __tag_kind_m_uplimit_6whdpi7iqh) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_variance_fk_id_tag_kind_m_variance_rqsni7uymf" ON "qti"."mathml_variance" IS 'foreign key MathmlVariance(id, __tag_kind_m_variance_ugqyybctnb) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_vector_fk_id_tag_kind_m_vector_o_7_zppitxuw_xpsrugc6e5" ON "qti"."mathml_vector" IS 'foreign key MathmlVector(id, __tag_kind_m_vector_o7zppitxuw) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_vectorproduct_fk_id_tag_kind_m_izzwzwjjm3" ON "qti"."mathml_vectorproduct" IS 'foreign key MathmlVectorproduct(id, __tag_kind_m_vectorproduct_l2jltqqlem) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_verticalalign_fk_kind_attribute_tag_type_qbm676r5df" ON "qti"."mathml_verticalalign" IS 'foreign key MathmlVerticalalign(kind, attribute, __tag_type_verticalalign_l4kt5q657l) to MathmlAttributeType(kind, attribute, type)';

COMMENT ON CONSTRAINT "__mathml_verticalalign_fk_node_kind_tfxd3gnwo5" ON "qti"."mathml_verticalalign" IS 'foreign key MathmlVerticalalign(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__mathml_xor_fk_id_tag_kind_m_xor_raim_3_zhwns_ufuef4ljb5" ON "qti"."mathml_xor" IS 'foreign key MathmlXor(id, __tag_kind_m_xor_raim3zhwns) to Node(id, kind)';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_m_degree_sphp3lfvsi" IS 'unique index Edge(parent) where childKind = m:degree';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_m_mprescripts_mk4gi3qd5k" IS 'unique index Edge(parent) where childKind = m:mprescripts';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_m_otherwise_6log7xkv36" IS 'unique index Edge(parent) where childKind = m:otherwise';

COMMENT ON INDEX "qti"."__mathml_align_ix_kind_attribute_e2ez6qaa3d" IS 'btree index MathmlAlign(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_align_ix_node_kind_54wtkvioje" IS 'btree index MathmlAlign(node, kind)';

COMMENT ON INDEX "qti"."__mathml_alignmentscope_ix_kind_attribute_eahnys4qok" IS 'btree index MathmlAlignmentscope(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_alignmentscope_ix_node_kind_hufxbqvbli" IS 'btree index MathmlAlignmentscope(node, kind)';

COMMENT ON INDEX "qti"."__mathml_altimg_valign_ix_kind_attribute_2w3zgzc2kz" IS 'btree index MathmlAltimgValign(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_altimg_valign_ix_node_kind_yxpe5v6txr" IS 'btree index MathmlAltimgValign(node, kind)';

COMMENT ON INDEX "qti"."__mathml_background_ix_kind_attribute_jpy4g3gtaa" IS 'btree index MathmlBackground(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_background_ix_node_kind_occidtaoup" IS 'btree index MathmlBackground(node, kind)';

COMMENT ON INDEX "qti"."__mathml_base_ix_kind_attribute_jg5engxalw" IS 'btree index MathmlBase(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_base_ix_node_kind_ziga35m6mi" IS 'btree index MathmlBase(node, kind)';

COMMENT ON INDEX "qti"."__mathml_boolean_ix_kind_attribute_ofhnz7x4wy" IS 'btree index MathmlBoolean(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_boolean_ix_node_kind_zz2pyenrjf" IS 'btree index MathmlBoolean(node, kind)';

COMMENT ON INDEX "qti"."__mathml_cd_ix_kind_attribute_lafzxkxegg" IS 'btree index MathmlCd(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_cd_ix_node_kind_jcvfuhivf3" IS 'btree index MathmlCd(node, kind)';

COMMENT ON INDEX "qti"."__mathml_cdgroup_ix_kind_attribute_ir5ph33u7e" IS 'btree index MathmlCdgroup(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_cdgroup_ix_node_kind_n4wzxngzyb" IS 'btree index MathmlCdgroup(node, kind)';

COMMENT ON INDEX "qti"."__mathml_character_ix_kind_attribute_tr2jd6f5oi" IS 'btree index MathmlCharacter(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_character_ix_node_kind_hvc6kmgfdw" IS 'btree index MathmlCharacter(node, kind)';

COMMENT ON INDEX "qti"."__mathml_charspacing_ix_kind_attribute_iulacthrnw" IS 'btree index MathmlCharspacing(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_charspacing_ix_node_kind_pmjnbejnx5" IS 'btree index MathmlCharspacing(node, kind)';

COMMENT ON INDEX "qti"."__mathml_class_ix_kind_attribute_ahmh2qjkzr" IS 'btree index MathmlClass(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_class_ix_node_kind_krvvffy7zp" IS 'btree index MathmlClass(node, kind)';

COMMENT ON INDEX "qti"."__mathml_closure_ix_kind_attribute_zkvc2kw5lj" IS 'btree index MathmlClosure(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_closure_ix_node_kind_ck7hk5ct43" IS 'btree index MathmlClosure(node, kind)';

COMMENT ON INDEX "qti"."__mathml_color_ix_kind_attribute_2nthrzymdj" IS 'btree index MathmlColor(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_color_ix_node_kind_4r6tq6gm6z" IS 'btree index MathmlColor(node, kind)';

COMMENT ON INDEX "qti"."__mathml_columnalign_ix_kind_attribute_wzitwkzool" IS 'btree index MathmlColumnalign(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_columnalign_ix_node_kind_pxrda3q7pe" IS 'btree index MathmlColumnalign(node, kind)';

COMMENT ON INDEX "qti"."__mathml_columnalignstyle_ix_kind_attribute_cf62wag5nk" IS 'btree index MathmlColumnalignstyle(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_columnalignstyle_ix_node_kind_xtl4omof4y" IS 'btree index MathmlColumnalignstyle(node, kind)';

COMMENT ON INDEX "qti"."__mathml_columnwidth_ix_kind_attribute_56yznckjb5" IS 'btree index MathmlColumnwidth(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_columnwidth_ix_node_kind_obdpfgal3g" IS 'btree index MathmlColumnwidth(node, kind)';

COMMENT ON INDEX "qti"."__mathml_crossout_ix_kind_attribute_u4lz6z43nk" IS 'btree index MathmlCrossout(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_crossout_ix_node_kind_l6yf636c3l" IS 'btree index MathmlCrossout(node, kind)';

COMMENT ON INDEX "qti"."__mathml_definition_url_ix_kind_attribute_2vcuo4bjxt" IS 'btree index MathmlDefinitionUrl(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_definition_url_ix_node_kind_72k5mbtjq3" IS 'btree index MathmlDefinitionUrl(node, kind)';

COMMENT ON INDEX "qti"."__mathml_dir_ix_kind_attribute_ver65aw2qs" IS 'btree index MathmlDir(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_dir_ix_node_kind_ty4isadqg3" IS 'btree index MathmlDir(node, kind)';

COMMENT ON INDEX "qti"."__mathml_display_ix_kind_attribute_djdzyg3w4j" IS 'btree index MathmlDisplay(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_display_ix_node_kind_tfvhg2oajb" IS 'btree index MathmlDisplay(node, kind)';

COMMENT ON INDEX "qti"."__mathml_edge_ix_kind_attribute_i6acbv5etq" IS 'btree index MathmlEdge(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_edge_ix_node_kind_hmka5fhiz6" IS 'btree index MathmlEdge(node, kind)';

COMMENT ON INDEX "qti"."__mathml_embed_source_ix_kind_attribute_udmbinewtp" IS 'btree index MathmlEmbedSource(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_embed_source_ix_node_kind_w53bewsb2i" IS 'btree index MathmlEmbedSource(node, kind)';

COMMENT ON INDEX "qti"."__mathml_fontstyle_ix_kind_attribute_fkkbunjw5f" IS 'btree index MathmlFontstyle(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_fontstyle_ix_node_kind_dxpjixem4n" IS 'btree index MathmlFontstyle(node, kind)';

COMMENT ON INDEX "qti"."__mathml_fontweight_ix_kind_attribute_2w3lf4e32z" IS 'btree index MathmlFontweight(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_fontweight_ix_node_kind_coz6ui4iz7" IS 'btree index MathmlFontweight(node, kind)';

COMMENT ON INDEX "qti"."__mathml_form_ix_kind_attribute_2orbuoboup" IS 'btree index MathmlForm(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_form_ix_node_kind_5v6qlnfyff" IS 'btree index MathmlForm(node, kind)';

COMMENT ON INDEX "qti"."__mathml_framespacing_ix_kind_attribute_chsinst7zr" IS 'btree index MathmlFramespacing(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_framespacing_ix_node_kind_vnwc6cvwns" IS 'btree index MathmlFramespacing(node, kind)';

COMMENT ON INDEX "qti"."__mathml_group_alignment_ix_kind_attribute_wsspy7hzrr" IS 'btree index MathmlGroupAlignment(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_group_alignment_ix_node_kind_7uzlwe4bif" IS 'btree index MathmlGroupAlignment(node, kind)';

COMMENT ON INDEX "qti"."__mathml_group_alignment_list_ix_kind_attribute_cnq4tkakqx" IS 'btree index MathmlGroupAlignmentList(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_group_alignment_list_ix_node_kind_4grboalitp" IS 'btree index MathmlGroupAlignmentList(node, kind)';

COMMENT ON INDEX "qti"."__mathml_group_alignment_list_list_ix_kind_attribute_dfxlpfxfef" IS 'btree index MathmlGroupAlignmentListList(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_group_alignment_list_list_ix_node_kind_gbdatiw75p" IS 'btree index MathmlGroupAlignmentListList(node, kind)';

COMMENT ON INDEX "qti"."__mathml_href_ix_kind_attribute_m6jx6apuzi" IS 'btree index MathmlHref(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_href_ix_node_kind_nbs5rp6f5f" IS 'btree index MathmlHref(node, kind)';

COMMENT ON INDEX "qti"."__mathml_indentalign_ix_kind_attribute_uscao7kzg4" IS 'btree index MathmlIndentalign(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_indentalign_ix_node_kind_2uwn3hyy5y" IS 'btree index MathmlIndentalign(node, kind)';

COMMENT ON INDEX "qti"."__mathml_indentalign_line_ix_kind_attribute_us6jtiqoly" IS 'btree index MathmlIndentalignLine(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_indentalign_line_ix_node_kind_zymbmsdy3m" IS 'btree index MathmlIndentalignLine(node, kind)';

COMMENT ON INDEX "qti"."__mathml_indentshift_line_ix_kind_attribute_cudgnpomzj" IS 'btree index MathmlIndentshiftLine(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_indentshift_line_ix_node_kind_fihtz5xwph" IS 'btree index MathmlIndentshiftLine(node, kind)';

COMMENT ON INDEX "qti"."__mathml_index_ix_kind_attribute_gzmqnojzsg" IS 'btree index MathmlIndex(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_index_ix_node_kind_dquz2vez3b" IS 'btree index MathmlIndex(node, kind)';

COMMENT ON INDEX "qti"."__mathml_infixlinebreakstyle_ix_kind_attribute_e5ishipmbo" IS 'btree index MathmlInfixlinebreakstyle(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_infixlinebreakstyle_ix_node_kind_obd6xb4kz2" IS 'btree index MathmlInfixlinebreakstyle(node, kind)';

COMMENT ON INDEX "qti"."__mathml_length_ix_kind_attribute_2ilpnbqalz" IS 'btree index MathmlLength(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_length_ix_node_kind_rydrbb276g" IS 'btree index MathmlLength(node, kind)';

COMMENT ON INDEX "qti"."__mathml_length_list_ix_kind_attribute_wukwe6ldw6" IS 'btree index MathmlLengthList(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_length_list_ix_node_kind_5p4fa5j7tf" IS 'btree index MathmlLengthList(node, kind)';

COMMENT ON INDEX "qti"."__mathml_line_thickness_ix_kind_attribute_4djr2pyljx" IS 'btree index MathmlLineThickness(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_line_thickness_ix_node_kind_u3a3nuxwmw" IS 'btree index MathmlLineThickness(node, kind)';

COMMENT ON INDEX "qti"."__mathml_linebreak_ix_kind_attribute_pc7hiqndsl" IS 'btree index MathmlLinebreak(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_linebreak_ix_node_kind_3op65yifyh" IS 'btree index MathmlLinebreak(node, kind)';

COMMENT ON INDEX "qti"."__mathml_linebreakstyle_ix_kind_attribute_urmwfzeysb" IS 'btree index MathmlLinebreakstyle(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_linebreakstyle_ix_node_kind_t2zpd5l5by" IS 'btree index MathmlLinebreakstyle(node, kind)';

COMMENT ON INDEX "qti"."__mathml_linestyle_ix_kind_attribute_dk62adcdsz" IS 'btree index MathmlLinestyle(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_linestyle_ix_node_kind_ecswhhjezr" IS 'btree index MathmlLinestyle(node, kind)';

COMMENT ON INDEX "qti"."__mathml_linestyle_list_ix_kind_attribute_w2zd3lcy3x" IS 'btree index MathmlLinestyleList(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_linestyle_list_ix_node_kind_ncdgz6x7qq" IS 'btree index MathmlLinestyleList(node, kind)';

COMMENT ON INDEX "qti"."__mathml_location_ix_kind_attribute_u2fctxxjvn" IS 'btree index MathmlLocation(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_location_ix_node_kind_fpfmf5pff3" IS 'btree index MathmlLocation(node, kind)';

COMMENT ON INDEX "qti"."__mathml_longdivstyle_ix_kind_attribute_j236fqulva" IS 'btree index MathmlLongdivstyle(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_longdivstyle_ix_node_kind_sq7hhbadv3" IS 'btree index MathmlLongdivstyle(node, kind)';

COMMENT ON INDEX "qti"."__mathml_mathsize_ix_kind_attribute_6ezg6ytpfs" IS 'btree index MathmlMathsize(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_mathsize_ix_node_kind_ouc7kpub3d" IS 'btree index MathmlMathsize(node, kind)';

COMMENT ON INDEX "qti"."__mathml_mathvariant_ix_kind_attribute_inmtpam3lb" IS 'btree index MathmlMathvariant(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_mathvariant_ix_node_kind_iko27krads" IS 'btree index MathmlMathvariant(node, kind)';

COMMENT ON INDEX "qti"."__mathml_maxsize_ix_kind_attribute_p4sofjioa7" IS 'btree index MathmlMaxsize(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_maxsize_ix_node_kind_2bxe2dok67" IS 'btree index MathmlMaxsize(node, kind)';

COMMENT ON INDEX "qti"."__mathml_mpadded_length_ix_kind_attribute_edil76txxl" IS 'btree index MathmlMpaddedLength(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_mpadded_length_ix_node_kind_ww6njde7p4" IS 'btree index MathmlMpaddedLength(node, kind)';

COMMENT ON INDEX "qti"."__mathml_mspace_linebreak_ix_kind_attribute_j7f2eob3tj" IS 'btree index MathmlMspaceLinebreak(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_mspace_linebreak_ix_node_kind_jki3tq7y63" IS 'btree index MathmlMspaceLinebreak(node, kind)';

COMMENT ON INDEX "qti"."__mathml_name_ix_kind_attribute_xc2ql2rhql" IS 'btree index MathmlName(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_name_ix_node_kind_lfx3vkvtge" IS 'btree index MathmlName(node, kind)';

COMMENT ON INDEX "qti"."__mathml_nargs_ix_kind_attribute_6axgmuh4ou" IS 'btree index MathmlNargs(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_nargs_ix_node_kind_glvbimcifl" IS 'btree index MathmlNargs(node, kind)';

COMMENT ON INDEX "qti"."__mathml_number_ix_kind_attribute_xgdplwcqzg" IS 'btree index MathmlNumber(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_number_ix_node_kind_6x5w4pp3ns" IS 'btree index MathmlNumber(node, kind)';

COMMENT ON INDEX "qti"."__mathml_occurrence_ix_kind_attribute_h7dqhkw3lv" IS 'btree index MathmlOccurrence(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_occurrence_ix_node_kind_q5mccefhmx" IS 'btree index MathmlOccurrence(node, kind)';

COMMENT ON INDEX "qti"."__mathml_order_ix_kind_attribute_bymejycdho" IS 'btree index MathmlOrder(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_order_ix_node_kind_t2o74gqedn" IS 'btree index MathmlOrder(node, kind)';

COMMENT ON INDEX "qti"."__mathml_overflow_ix_kind_attribute_tfjqf3bqaw" IS 'btree index MathmlOverflow(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_overflow_ix_node_kind_2uw3zilbbi" IS 'btree index MathmlOverflow(node, kind)';

COMMENT ON INDEX "qti"."__mathml_position_ix_kind_attribute_6nk33yoffl" IS 'btree index MathmlPosition(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_position_ix_node_kind_raw52ac7to" IS 'btree index MathmlPosition(node, kind)';

COMMENT ON INDEX "qti"."__mathml_rowalign_ix_kind_attribute_wbp7chcswq" IS 'btree index MathmlRowalign(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_rowalign_ix_node_kind_ilafpjfq2u" IS 'btree index MathmlRowalign(node, kind)';

COMMENT ON INDEX "qti"."__mathml_scriptlevel_ix_kind_attribute_vpfr3ntjfs" IS 'btree index MathmlScriptlevel(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_scriptlevel_ix_node_kind_jsygqj5ikq" IS 'btree index MathmlScriptlevel(node, kind)';

COMMENT ON INDEX "qti"."__mathml_selection_ix_kind_attribute_nnq3f4l4uo" IS 'btree index MathmlSelection(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_selection_ix_node_kind_yd3roh2q2y" IS 'btree index MathmlSelection(node, kind)';

COMMENT ON INDEX "qti"."__mathml_shift_ix_kind_attribute_i7eixzr2j3" IS 'btree index MathmlShift(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_shift_ix_node_kind_o5mptt52dz" IS 'btree index MathmlShift(node, kind)';

COMMENT ON INDEX "qti"."__mathml_side_ix_kind_attribute_xs7vua2xwn" IS 'btree index MathmlSide(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_side_ix_node_kind_yatejmcmna" IS 'btree index MathmlSide(node, kind)';

COMMENT ON INDEX "qti"."__mathml_span_ix_kind_attribute_h5aedwgzx2" IS 'btree index MathmlSpan(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_span_ix_node_kind_reytv4zl6w" IS 'btree index MathmlSpan(node, kind)';

COMMENT ON INDEX "qti"."__mathml_src_ix_kind_attribute_ufte5lemc6" IS 'btree index MathmlSrc(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_src_ix_node_kind_6i5vll37y4" IS 'btree index MathmlSrc(node, kind)';

COMMENT ON INDEX "qti"."__mathml_string_ix_kind_attribute_zfdusvtvdv" IS 'btree index MathmlString(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_string_ix_node_kind_gdi675uszt" IS 'btree index MathmlString(node, kind)';

COMMENT ON INDEX "qti"."__mathml_table_width_ix_kind_attribute_y53b6pvz5j" IS 'btree index MathmlTableWidth(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_table_width_ix_node_kind_jxogk5p3xz" IS 'btree index MathmlTableWidth(node, kind)';

COMMENT ON INDEX "qti"."__mathml_unsigned_integer_ix_kind_attribute_budp2cddlk" IS 'btree index MathmlUnsignedInteger(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_unsigned_integer_ix_node_kind_rsr44fczt6" IS 'btree index MathmlUnsignedInteger(node, kind)';

COMMENT ON INDEX "qti"."__mathml_verticalalign_ix_kind_attribute_rl6ouhogwm" IS 'btree index MathmlVerticalalign(kind, attribute)';

COMMENT ON INDEX "qti"."__mathml_verticalalign_ix_node_kind_2muxx75s7b" IS 'btree index MathmlVerticalalign(node, kind)';

COMMENT ON TRIGGER "__law_node_kind_m_abs_in_mathml_abs_ioukizozp5" ON "qti"."mathml_abs" IS 'trigger of law Node(id) where kind = m:abs in MathmlAbs(id), a mirrors half on MathmlAbs for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_and_in_mathml_and_64uhciodhq" ON "qti"."mathml_and" IS 'trigger of law Node(id) where kind = m:and in MathmlAnd(id), a mirrors half on MathmlAnd for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_annotation_in_mathml_annotation_cunxlu4vy2" ON "qti"."mathml_annotation" IS 'trigger of law Node(id) where kind = m:annotation in MathmlAnnotation(id), a mirrors half on MathmlAnnotation for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_annotation_xml_in_mathml_pqakoblvk6" ON "qti"."mathml_annotation_xml" IS 'trigger of law Node(id) where kind = m:annotation-xml in MathmlAnnotationXml(id), a mirrors half on MathmlAnnotationXml for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_apply_in_mathml_apply_sxpbpt3em7" ON "qti"."mathml_apply" IS 'trigger of law Node(id) where kind = m:apply in MathmlApply(id), a mirrors half on MathmlApply for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_approx_in_mathml_approx_qhmyr53xit" ON "qti"."mathml_approx" IS 'trigger of law Node(id) where kind = m:approx in MathmlApprox(id), a mirrors half on MathmlApprox for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arccos_in_mathml_arccos_cvhz2cczy7" ON "qti"."mathml_arccos" IS 'trigger of law Node(id) where kind = m:arccos in MathmlArccos(id), a mirrors half on MathmlArccos for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arccosh_in_mathml_arccosh_5ityf2mfcb" ON "qti"."mathml_arccosh" IS 'trigger of law Node(id) where kind = m:arccosh in MathmlArccosh(id), a mirrors half on MathmlArccosh for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arccot_in_mathml_arccot_xs2c45oemc" ON "qti"."mathml_arccot" IS 'trigger of law Node(id) where kind = m:arccot in MathmlArccot(id), a mirrors half on MathmlArccot for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arccoth_in_mathml_arccoth_v5h5oish47" ON "qti"."mathml_arccoth" IS 'trigger of law Node(id) where kind = m:arccoth in MathmlArccoth(id), a mirrors half on MathmlArccoth for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arccsc_in_mathml_arccsc_z2hk5n3k7m" ON "qti"."mathml_arccsc" IS 'trigger of law Node(id) where kind = m:arccsc in MathmlArccsc(id), a mirrors half on MathmlArccsc for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arccsch_in_mathml_arccsch_5okgo7fjll" ON "qti"."mathml_arccsch" IS 'trigger of law Node(id) where kind = m:arccsch in MathmlArccsch(id), a mirrors half on MathmlArccsch for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arcsec_in_mathml_arcsec_vq6ucdfb45" ON "qti"."mathml_arcsec" IS 'trigger of law Node(id) where kind = m:arcsec in MathmlArcsec(id), a mirrors half on MathmlArcsec for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arcsech_in_mathml_arcsech_c45hlsigam" ON "qti"."mathml_arcsech" IS 'trigger of law Node(id) where kind = m:arcsech in MathmlArcsech(id), a mirrors half on MathmlArcsech for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arcsin_in_mathml_arcsin_vlksnkyvsi" ON "qti"."mathml_arcsin" IS 'trigger of law Node(id) where kind = m:arcsin in MathmlArcsin(id), a mirrors half on MathmlArcsin for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arcsinh_in_mathml_arcsinh_prx5bsn6k6" ON "qti"."mathml_arcsinh" IS 'trigger of law Node(id) where kind = m:arcsinh in MathmlArcsinh(id), a mirrors half on MathmlArcsinh for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arctan_in_mathml_arctan_zt665zx7fc" ON "qti"."mathml_arctan" IS 'trigger of law Node(id) where kind = m:arctan in MathmlArctan(id), a mirrors half on MathmlArctan for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arctanh_in_mathml_arctanh_4yw66ssghy" ON "qti"."mathml_arctanh" IS 'trigger of law Node(id) where kind = m:arctanh in MathmlArctanh(id), a mirrors half on MathmlArctanh for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_arg_in_mathml_arg_rod65i4d5y" ON "qti"."mathml_arg" IS 'trigger of law Node(id) where kind = m:arg in MathmlArg(id), a mirrors half on MathmlArg for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_bind_in_mathml_bind_pmqgfd4tpk" ON "qti"."mathml_bind" IS 'trigger of law Node(id) where kind = m:bind in MathmlBind(id), a mirrors half on MathmlBind for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_bvar_in_mathml_bvar_yxq2aibvd3" ON "qti"."mathml_bvar" IS 'trigger of law Node(id) where kind = m:bvar in MathmlBvar(id), a mirrors half on MathmlBvar for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_card_in_mathml_card_ff44h3jndz" ON "qti"."mathml_card" IS 'trigger of law Node(id) where kind = m:card in MathmlCard(id), a mirrors half on MathmlCard for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cartesianproduct_in_mathml_dq57tovrst" ON "qti"."mathml_cartesianproduct" IS 'trigger of law Node(id) where kind = m:cartesianproduct in MathmlCartesianproduct(id), a mirrors half on MathmlCartesianproduct for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cbytes_in_mathml_cbytes_cqvdykw63n" ON "qti"."mathml_cbytes" IS 'trigger of law Node(id) where kind = m:cbytes in MathmlCbytes(id), a mirrors half on MathmlCbytes for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_ceiling_in_mathml_ceiling_t3i7pebrp2" ON "qti"."mathml_ceiling" IS 'trigger of law Node(id) where kind = m:ceiling in MathmlCeiling(id), a mirrors half on MathmlCeiling for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cerror_in_mathml_cerror_npgv7exagb" ON "qti"."mathml_cerror" IS 'trigger of law Node(id) where kind = m:cerror in MathmlCerror(id), a mirrors half on MathmlCerror for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_ci_in_mathml_ci_6obqj636jw" ON "qti"."mathml_ci" IS 'trigger of law Node(id) where kind = m:ci in MathmlCi(id), a mirrors half on MathmlCi for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cn_in_mathml_cn_bpsfgi6exi" ON "qti"."mathml_cn" IS 'trigger of law Node(id) where kind = m:cn in MathmlCn(id), a mirrors half on MathmlCn for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_codomain_in_mathml_codomain_rcgsrx45km" ON "qti"."mathml_codomain" IS 'trigger of law Node(id) where kind = m:codomain in MathmlCodomain(id), a mirrors half on MathmlCodomain for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_complexes_in_mathml_complexes_hzejj4jdqx" ON "qti"."mathml_complexes" IS 'trigger of law Node(id) where kind = m:complexes in MathmlComplexes(id), a mirrors half on MathmlComplexes for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_compose_in_mathml_compose_fiockawutc" ON "qti"."mathml_compose" IS 'trigger of law Node(id) where kind = m:compose in MathmlCompose(id), a mirrors half on MathmlCompose for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_condition_in_mathml_condition_o6uo2ezu7b" ON "qti"."mathml_condition" IS 'trigger of law Node(id) where kind = m:condition in MathmlCondition(id), a mirrors half on MathmlCondition for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_conjugate_in_mathml_conjugate_iw3cfxmtmq" ON "qti"."mathml_conjugate" IS 'trigger of law Node(id) where kind = m:conjugate in MathmlConjugate(id), a mirrors half on MathmlConjugate for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cos_in_mathml_cos_gw6k5tfpqx" ON "qti"."mathml_cos" IS 'trigger of law Node(id) where kind = m:cos in MathmlCos(id), a mirrors half on MathmlCos for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cosh_in_mathml_cosh_gbydooe4ig" ON "qti"."mathml_cosh" IS 'trigger of law Node(id) where kind = m:cosh in MathmlCosh(id), a mirrors half on MathmlCosh for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cot_in_mathml_cot_jkwxs6sjqm" ON "qti"."mathml_cot" IS 'trigger of law Node(id) where kind = m:cot in MathmlCot(id), a mirrors half on MathmlCot for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_coth_in_mathml_coth_ssy3jdnzky" ON "qti"."mathml_coth" IS 'trigger of law Node(id) where kind = m:coth in MathmlCoth(id), a mirrors half on MathmlCoth for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_cs_in_mathml_cs_yroq6wrtqq" ON "qti"."mathml_cs" IS 'trigger of law Node(id) where kind = m:cs in MathmlCs(id), a mirrors half on MathmlCs for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_csc_in_mathml_csc_laoi4z2y34" ON "qti"."mathml_csc" IS 'trigger of law Node(id) where kind = m:csc in MathmlCsc(id), a mirrors half on MathmlCsc for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_csch_in_mathml_csch_h5fjlnufey" ON "qti"."mathml_csch" IS 'trigger of law Node(id) where kind = m:csch in MathmlCsch(id), a mirrors half on MathmlCsch for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_csymbol_in_mathml_csymbol_gwd4arnjxj" ON "qti"."mathml_csymbol" IS 'trigger of law Node(id) where kind = m:csymbol in MathmlCsymbol(id), a mirrors half on MathmlCsymbol for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_curl_in_mathml_curl_djt27ktd4v" ON "qti"."mathml_curl" IS 'trigger of law Node(id) where kind = m:curl in MathmlCurl(id), a mirrors half on MathmlCurl for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_declare_in_mathml_declare_gtee24l43o" ON "qti"."mathml_declare" IS 'trigger of law Node(id) where kind = m:declare in MathmlDeclare(id), a mirrors half on MathmlDeclare for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_degree_in_mathml_degree_paokkrb2hd" ON "qti"."mathml_degree" IS 'trigger of law Node(id) where kind = m:degree in MathmlDegree(id), a mirrors half on MathmlDegree for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_determinant_in_mathml_determinant_cppcgvrkzd" ON "qti"."mathml_determinant" IS 'trigger of law Node(id) where kind = m:determinant in MathmlDeterminant(id), a mirrors half on MathmlDeterminant for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_diff_in_mathml_diff_niocjl7dpr" ON "qti"."mathml_diff" IS 'trigger of law Node(id) where kind = m:diff in MathmlDiff(id), a mirrors half on MathmlDiff for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_divergence_in_mathml_divergence_6kmzlv5kth" ON "qti"."mathml_divergence" IS 'trigger of law Node(id) where kind = m:divergence in MathmlDivergence(id), a mirrors half on MathmlDivergence for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_divide_in_mathml_divide_4rtszlxvhl" ON "qti"."mathml_divide" IS 'trigger of law Node(id) where kind = m:divide in MathmlDivide(id), a mirrors half on MathmlDivide for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_domain_in_mathml_domain_cb65perzxt" ON "qti"."mathml_domain" IS 'trigger of law Node(id) where kind = m:domain in MathmlDomain(id), a mirrors half on MathmlDomain for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_domainofapplication_in_mathml_5i67ukdp2a" ON "qti"."mathml_domainofapplication" IS 'trigger of law Node(id) where kind = m:domainofapplication in MathmlDomainofapplication(id), a mirrors half on MathmlDomainofapplication for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_emptyset_in_mathml_emptyset_tjprv6mkuy" ON "qti"."mathml_emptyset" IS 'trigger of law Node(id) where kind = m:emptyset in MathmlEmptyset(id), a mirrors half on MathmlEmptyset for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_eq_in_mathml_eq_qt5atv4vxl" ON "qti"."mathml_eq" IS 'trigger of law Node(id) where kind = m:eq in MathmlEq(id), a mirrors half on MathmlEq for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_equivalent_in_mathml_equivalent_ap6vyhfhnm" ON "qti"."mathml_equivalent" IS 'trigger of law Node(id) where kind = m:equivalent in MathmlEquivalent(id), a mirrors half on MathmlEquivalent for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_eulergamma_in_mathml_eulergamma_o7c3nwx65q" ON "qti"."mathml_eulergamma" IS 'trigger of law Node(id) where kind = m:eulergamma in MathmlEulergamma(id), a mirrors half on MathmlEulergamma for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_exists_in_mathml_exists_3enpjhtrf4" ON "qti"."mathml_exists" IS 'trigger of law Node(id) where kind = m:exists in MathmlExists(id), a mirrors half on MathmlExists for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_exp_in_mathml_exp_l64keyfefp" ON "qti"."mathml_exp" IS 'trigger of law Node(id) where kind = m:exp in MathmlExp(id), a mirrors half on MathmlExp for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_exponentiale_in_mathml_u6jovnxai4" ON "qti"."mathml_exponentiale" IS 'trigger of law Node(id) where kind = m:exponentiale in MathmlExponentiale(id), a mirrors half on MathmlExponentiale for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_factorial_in_mathml_factorial_cdur3ihlla" ON "qti"."mathml_factorial" IS 'trigger of law Node(id) where kind = m:factorial in MathmlFactorial(id), a mirrors half on MathmlFactorial for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_factorof_in_mathml_factorof_o3fcuctrtm" ON "qti"."mathml_factorof" IS 'trigger of law Node(id) where kind = m:factorof in MathmlFactorof(id), a mirrors half on MathmlFactorof for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_false_in_mathml_false_36tlvbkcq6" ON "qti"."mathml_false" IS 'trigger of law Node(id) where kind = m:false in MathmlFalse(id), a mirrors half on MathmlFalse for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_floor_in_mathml_floor_ug2kyzc2px" ON "qti"."mathml_floor" IS 'trigger of law Node(id) where kind = m:floor in MathmlFloor(id), a mirrors half on MathmlFloor for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_fn_in_mathml_fn_4l2f7y2m7t" ON "qti"."mathml_fn" IS 'trigger of law Node(id) where kind = m:fn in MathmlFn(id), a mirrors half on MathmlFn for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_forall_in_mathml_forall_lx6b4s4b5n" ON "qti"."mathml_forall" IS 'trigger of law Node(id) where kind = m:forall in MathmlForall(id), a mirrors half on MathmlForall for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_gcd_in_mathml_gcd_3iovkdoupf" ON "qti"."mathml_gcd" IS 'trigger of law Node(id) where kind = m:gcd in MathmlGcd(id), a mirrors half on MathmlGcd for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_geq_in_mathml_geq_ab3so5j7bl" ON "qti"."mathml_geq" IS 'trigger of law Node(id) where kind = m:geq in MathmlGeq(id), a mirrors half on MathmlGeq for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_grad_in_mathml_grad_to7jsolola" ON "qti"."mathml_grad" IS 'trigger of law Node(id) where kind = m:grad in MathmlGrad(id), a mirrors half on MathmlGrad for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_gt_in_mathml_gt_h4qy2xs3rp" ON "qti"."mathml_gt" IS 'trigger of law Node(id) where kind = m:gt in MathmlGt(id), a mirrors half on MathmlGt for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_ident_in_mathml_ident_afkkxkpwop" ON "qti"."mathml_ident" IS 'trigger of law Node(id) where kind = m:ident in MathmlIdent(id), a mirrors half on MathmlIdent for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_image_in_mathml_image_343uadmrrj" ON "qti"."mathml_image" IS 'trigger of law Node(id) where kind = m:image in MathmlImage(id), a mirrors half on MathmlImage for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_imaginary_in_mathml_imaginary_om3w4tqdpi" ON "qti"."mathml_imaginary" IS 'trigger of law Node(id) where kind = m:imaginary in MathmlImaginary(id), a mirrors half on MathmlImaginary for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_imaginaryi_in_mathml_imaginaryi_rf5xdlubla" ON "qti"."mathml_imaginaryi" IS 'trigger of law Node(id) where kind = m:imaginaryi in MathmlImaginaryi(id), a mirrors half on MathmlImaginaryi for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_implies_in_mathml_implies_ysf7qa7euy" ON "qti"."mathml_implies" IS 'trigger of law Node(id) where kind = m:implies in MathmlImplies(id), a mirrors half on MathmlImplies for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_in_in_mathml_in_yb22w4s3dz" ON "qti"."mathml_in" IS 'trigger of law Node(id) where kind = m:in in MathmlIn(id), a mirrors half on MathmlIn for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_infinity_in_mathml_infinity_vhapecys2q" ON "qti"."mathml_infinity" IS 'trigger of law Node(id) where kind = m:infinity in MathmlInfinity(id), a mirrors half on MathmlInfinity for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_int_in_mathml_int_ejuinyarvd" ON "qti"."mathml_int" IS 'trigger of law Node(id) where kind = m:int in MathmlInt(id), a mirrors half on MathmlInt for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_integers_in_mathml_integers_ihfc35xi5x" ON "qti"."mathml_integers" IS 'trigger of law Node(id) where kind = m:integers in MathmlIntegers(id), a mirrors half on MathmlIntegers for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_intersect_in_mathml_intersect_kmwpxskwaq" ON "qti"."mathml_intersect" IS 'trigger of law Node(id) where kind = m:intersect in MathmlIntersect(id), a mirrors half on MathmlIntersect for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_interval_in_mathml_interval_5eqbau5phm" ON "qti"."mathml_interval" IS 'trigger of law Node(id) where kind = m:interval in MathmlInterval(id), a mirrors half on MathmlInterval for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_inverse_in_mathml_inverse_b7qcddnm43" ON "qti"."mathml_inverse" IS 'trigger of law Node(id) where kind = m:inverse in MathmlInverse(id), a mirrors half on MathmlInverse for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_lambda_in_mathml_lambda_4p3xupet6v" ON "qti"."mathml_lambda" IS 'trigger of law Node(id) where kind = m:lambda in MathmlLambda(id), a mirrors half on MathmlLambda for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_laplacian_in_mathml_laplacian_wmjp7jfmhn" ON "qti"."mathml_laplacian" IS 'trigger of law Node(id) where kind = m:laplacian in MathmlLaplacian(id), a mirrors half on MathmlLaplacian for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_lcm_in_mathml_lcm_qtoxbqndzh" ON "qti"."mathml_lcm" IS 'trigger of law Node(id) where kind = m:lcm in MathmlLcm(id), a mirrors half on MathmlLcm for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_leq_in_mathml_leq_didwja2r72" ON "qti"."mathml_leq" IS 'trigger of law Node(id) where kind = m:leq in MathmlLeq(id), a mirrors half on MathmlLeq for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_limit_in_mathml_limit_eydedmzhjp" ON "qti"."mathml_limit" IS 'trigger of law Node(id) where kind = m:limit in MathmlLimit(id), a mirrors half on MathmlLimit for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_list_in_mathml_list_xenjcqfdba" ON "qti"."mathml_list" IS 'trigger of law Node(id) where kind = m:list in MathmlList(id), a mirrors half on MathmlList for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_ln_in_mathml_ln_l6kuh5m5mm" ON "qti"."mathml_ln" IS 'trigger of law Node(id) where kind = m:ln in MathmlLn(id), a mirrors half on MathmlLn for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_log_in_mathml_log_qn7lxxul6g" ON "qti"."mathml_log" IS 'trigger of law Node(id) where kind = m:log in MathmlLog(id), a mirrors half on MathmlLog for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_logbase_in_mathml_logbase_usa73lbscg" ON "qti"."mathml_logbase" IS 'trigger of law Node(id) where kind = m:logbase in MathmlLogbase(id), a mirrors half on MathmlLogbase for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_lowlimit_in_mathml_lowlimit_7tucnmnmpw" ON "qti"."mathml_lowlimit" IS 'trigger of law Node(id) where kind = m:lowlimit in MathmlLowlimit(id), a mirrors half on MathmlLowlimit for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_lt_in_mathml_lt_c4orccdluq" ON "qti"."mathml_lt" IS 'trigger of law Node(id) where kind = m:lt in MathmlLt(id), a mirrors half on MathmlLt for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_maction_in_mathml_maction_mo7n7s5d7m" ON "qti"."mathml_maction" IS 'trigger of law Node(id) where kind = m:maction in MathmlMaction(id), a mirrors half on MathmlMaction for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_maligngroup_in_mathml_maligngroup_cakh5ifw4d" ON "qti"."mathml_maligngroup" IS 'trigger of law Node(id) where kind = m:maligngroup in MathmlMaligngroup(id), a mirrors half on MathmlMaligngroup for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_malignmark_in_mathml_malignmark_gpayw7k6g5" ON "qti"."mathml_malignmark" IS 'trigger of law Node(id) where kind = m:malignmark in MathmlMalignmark(id), a mirrors half on MathmlMalignmark for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_math_in_mathml_math_qobsfl5xqd" ON "qti"."mathml_math" IS 'trigger of law Node(id) where kind = m:math in MathmlMath(id), a mirrors half on MathmlMath for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_matrix_in_mathml_matrix_ddisl7namz" ON "qti"."mathml_matrix" IS 'trigger of law Node(id) where kind = m:matrix in MathmlMatrix(id), a mirrors half on MathmlMatrix for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_matrixrow_in_mathml_matrixrow_w3rxuxjgdr" ON "qti"."mathml_matrixrow" IS 'trigger of law Node(id) where kind = m:matrixrow in MathmlMatrixrow(id), a mirrors half on MathmlMatrixrow for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_max_in_mathml_max_lg6mfxntad" ON "qti"."mathml_max" IS 'trigger of law Node(id) where kind = m:max in MathmlMax(id), a mirrors half on MathmlMax for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mean_in_mathml_mean_zqr6kwpbl2" ON "qti"."mathml_mean" IS 'trigger of law Node(id) where kind = m:mean in MathmlMean(id), a mirrors half on MathmlMean for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_median_in_mathml_median_qhudmjkmuw" ON "qti"."mathml_median" IS 'trigger of law Node(id) where kind = m:median in MathmlMedian(id), a mirrors half on MathmlMedian for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_menclose_in_mathml_menclose_lxyndxfnr7" ON "qti"."mathml_menclose" IS 'trigger of law Node(id) where kind = m:menclose in MathmlMenclose(id), a mirrors half on MathmlMenclose for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_merror_in_mathml_merror_ga35cxwl5s" ON "qti"."mathml_merror" IS 'trigger of law Node(id) where kind = m:merror in MathmlMerror(id), a mirrors half on MathmlMerror for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mfenced_in_mathml_mfenced_xnzt3u234h" ON "qti"."mathml_mfenced" IS 'trigger of law Node(id) where kind = m:mfenced in MathmlMfenced(id), a mirrors half on MathmlMfenced for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mfrac_in_mathml_mfrac_oansf2ynbj" ON "qti"."mathml_mfrac" IS 'trigger of law Node(id) where kind = m:mfrac in MathmlMfrac(id), a mirrors half on MathmlMfrac for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mglyph_in_mathml_mglyph_s5u6nw2nzs" ON "qti"."mathml_mglyph" IS 'trigger of law Node(id) where kind = m:mglyph in MathmlMglyph(id), a mirrors half on MathmlMglyph for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mi_in_mathml_mi_3ngppp7qsm" ON "qti"."mathml_mi" IS 'trigger of law Node(id) where kind = m:mi in MathmlMi(id), a mirrors half on MathmlMi for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_min_in_mathml_min_kv62js7hcy" ON "qti"."mathml_min" IS 'trigger of law Node(id) where kind = m:min in MathmlMin(id), a mirrors half on MathmlMin for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_minus_in_mathml_minus_gmwmvhketw" ON "qti"."mathml_minus" IS 'trigger of law Node(id) where kind = m:minus in MathmlMinus(id), a mirrors half on MathmlMinus for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mlabeledtr_in_mathml_mlabeledtr_iq6sfoivss" ON "qti"."mathml_mlabeledtr" IS 'trigger of law Node(id) where kind = m:mlabeledtr in MathmlMlabeledtr(id), a mirrors half on MathmlMlabeledtr for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mlongdiv_in_mathml_mlongdiv_563xwqtemo" ON "qti"."mathml_mlongdiv" IS 'trigger of law Node(id) where kind = m:mlongdiv in MathmlMlongdiv(id), a mirrors half on MathmlMlongdiv for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mmultiscripts_in_mathml_draaicfyc3" ON "qti"."mathml_mmultiscripts" IS 'trigger of law Node(id) where kind = m:mmultiscripts in MathmlMmultiscripts(id), a mirrors half on MathmlMmultiscripts for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mn_in_mathml_mn_da4i5ghw3g" ON "qti"."mathml_mn" IS 'trigger of law Node(id) where kind = m:mn in MathmlMn(id), a mirrors half on MathmlMn for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mo_in_mathml_mo_hve7a5wupq" ON "qti"."mathml_mo" IS 'trigger of law Node(id) where kind = m:mo in MathmlMo(id), a mirrors half on MathmlMo for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mode_in_mathml_mode_uxopmft43k" ON "qti"."mathml_mode" IS 'trigger of law Node(id) where kind = m:mode in MathmlMode(id), a mirrors half on MathmlMode for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_moment_in_mathml_moment_oo2puppx6r" ON "qti"."mathml_moment" IS 'trigger of law Node(id) where kind = m:moment in MathmlMoment(id), a mirrors half on MathmlMoment for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_momentabout_in_mathml_momentabout_evzxuwk43m" ON "qti"."mathml_momentabout" IS 'trigger of law Node(id) where kind = m:momentabout in MathmlMomentabout(id), a mirrors half on MathmlMomentabout for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mover_in_mathml_mover_hrjj4dgwf3" ON "qti"."mathml_mover" IS 'trigger of law Node(id) where kind = m:mover in MathmlMover(id), a mirrors half on MathmlMover for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mpadded_in_mathml_mpadded_zyp5tj7m4l" ON "qti"."mathml_mpadded" IS 'trigger of law Node(id) where kind = m:mpadded in MathmlMpadded(id), a mirrors half on MathmlMpadded for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mphantom_in_mathml_mphantom_r3bdasoonv" ON "qti"."mathml_mphantom" IS 'trigger of law Node(id) where kind = m:mphantom in MathmlMphantom(id), a mirrors half on MathmlMphantom for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mprescripts_in_mathml_mprescripts_bu7j2hjdlj" ON "qti"."mathml_mprescripts" IS 'trigger of law Node(id) where kind = m:mprescripts in MathmlMprescripts(id), a mirrors half on MathmlMprescripts for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mroot_in_mathml_mroot_u7hyiuogkw" ON "qti"."mathml_mroot" IS 'trigger of law Node(id) where kind = m:mroot in MathmlMroot(id), a mirrors half on MathmlMroot for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mrow_in_mathml_mrow_mbz2iyxvtg" ON "qti"."mathml_mrow" IS 'trigger of law Node(id) where kind = m:mrow in MathmlMrow(id), a mirrors half on MathmlMrow for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_ms_in_mathml_ms_mkws7hzd6f" ON "qti"."mathml_ms" IS 'trigger of law Node(id) where kind = m:ms in MathmlMs(id), a mirrors half on MathmlMs for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mscarries_in_mathml_mscarries_3lngx7kj6f" ON "qti"."mathml_mscarries" IS 'trigger of law Node(id) where kind = m:mscarries in MathmlMscarries(id), a mirrors half on MathmlMscarries for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mscarry_in_mathml_mscarry_rivxvzlxl2" ON "qti"."mathml_mscarry" IS 'trigger of law Node(id) where kind = m:mscarry in MathmlMscarry(id), a mirrors half on MathmlMscarry for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_msgroup_in_mathml_msgroup_6nf3eff3rr" ON "qti"."mathml_msgroup" IS 'trigger of law Node(id) where kind = m:msgroup in MathmlMsgroup(id), a mirrors half on MathmlMsgroup for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_msline_in_mathml_msline_qard5obmup" ON "qti"."mathml_msline" IS 'trigger of law Node(id) where kind = m:msline in MathmlMsline(id), a mirrors half on MathmlMsline for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mspace_in_mathml_mspace_nd2ymnybow" ON "qti"."mathml_mspace" IS 'trigger of law Node(id) where kind = m:mspace in MathmlMspace(id), a mirrors half on MathmlMspace for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_msqrt_in_mathml_msqrt_jqa3xy7lf5" ON "qti"."mathml_msqrt" IS 'trigger of law Node(id) where kind = m:msqrt in MathmlMsqrt(id), a mirrors half on MathmlMsqrt for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_msrow_in_mathml_msrow_zcbj4routp" ON "qti"."mathml_msrow" IS 'trigger of law Node(id) where kind = m:msrow in MathmlMsrow(id), a mirrors half on MathmlMsrow for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mstack_in_mathml_mstack_yhd6sl2nqf" ON "qti"."mathml_mstack" IS 'trigger of law Node(id) where kind = m:mstack in MathmlMstack(id), a mirrors half on MathmlMstack for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mstyle_in_mathml_mstyle_xhvpjm7c2h" ON "qti"."mathml_mstyle" IS 'trigger of law Node(id) where kind = m:mstyle in MathmlMstyle(id), a mirrors half on MathmlMstyle for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_msub_in_mathml_msub_qoixdymdrh" ON "qti"."mathml_msub" IS 'trigger of law Node(id) where kind = m:msub in MathmlMsub(id), a mirrors half on MathmlMsub for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_msubsup_in_mathml_msubsup_k6467lqvmu" ON "qti"."mathml_msubsup" IS 'trigger of law Node(id) where kind = m:msubsup in MathmlMsubsup(id), a mirrors half on MathmlMsubsup for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_msup_in_mathml_msup_gflw3feqop" ON "qti"."mathml_msup" IS 'trigger of law Node(id) where kind = m:msup in MathmlMsup(id), a mirrors half on MathmlMsup for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mtable_in_mathml_mtable_mvbaladgsy" ON "qti"."mathml_mtable" IS 'trigger of law Node(id) where kind = m:mtable in MathmlMtable(id), a mirrors half on MathmlMtable for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mtd_in_mathml_mtd_cqzqri7kko" ON "qti"."mathml_mtd" IS 'trigger of law Node(id) where kind = m:mtd in MathmlMtd(id), a mirrors half on MathmlMtd for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mtext_in_mathml_mtext_bfusqrzycw" ON "qti"."mathml_mtext" IS 'trigger of law Node(id) where kind = m:mtext in MathmlMtext(id), a mirrors half on MathmlMtext for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_mtr_in_mathml_mtr_nm6lhqeu5h" ON "qti"."mathml_mtr" IS 'trigger of law Node(id) where kind = m:mtr in MathmlMtr(id), a mirrors half on MathmlMtr for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_munder_in_mathml_munder_dxfo3ex7un" ON "qti"."mathml_munder" IS 'trigger of law Node(id) where kind = m:munder in MathmlMunder(id), a mirrors half on MathmlMunder for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_munderover_in_mathml_munderover_hvwujzzw6q" ON "qti"."mathml_munderover" IS 'trigger of law Node(id) where kind = m:munderover in MathmlMunderover(id), a mirrors half on MathmlMunderover for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_naturalnumbers_in_mathml_n2luotfgvn" ON "qti"."mathml_naturalnumbers" IS 'trigger of law Node(id) where kind = m:naturalnumbers in MathmlNaturalnumbers(id), a mirrors half on MathmlNaturalnumbers for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_neq_in_mathml_neq_2n2py6skqk" ON "qti"."mathml_neq" IS 'trigger of law Node(id) where kind = m:neq in MathmlNeq(id), a mirrors half on MathmlNeq for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_none_in_mathml_none_loe4yj74ep" ON "qti"."mathml_none" IS 'trigger of law Node(id) where kind = m:none in MathmlNone(id), a mirrors half on MathmlNone for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_not_in_mathml_not_hamtcbot6a" ON "qti"."mathml_not" IS 'trigger of law Node(id) where kind = m:not in MathmlNot(id), a mirrors half on MathmlNot for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_notanumber_in_mathml_notanumber_y2n6z5qr6m" ON "qti"."mathml_notanumber" IS 'trigger of law Node(id) where kind = m:notanumber in MathmlNotanumber(id), a mirrors half on MathmlNotanumber for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_notin_in_mathml_notin_bvvbc7ybkw" ON "qti"."mathml_notin" IS 'trigger of law Node(id) where kind = m:notin in MathmlNotin(id), a mirrors half on MathmlNotin for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_notprsubset_in_mathml_notprsubset_qkjsp357pq" ON "qti"."mathml_notprsubset" IS 'trigger of law Node(id) where kind = m:notprsubset in MathmlNotprsubset(id), a mirrors half on MathmlNotprsubset for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_notsubset_in_mathml_notsubset_kwkhcwkps5" ON "qti"."mathml_notsubset" IS 'trigger of law Node(id) where kind = m:notsubset in MathmlNotsubset(id), a mirrors half on MathmlNotsubset for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_or_in_mathml_or_7rg27qqof7" ON "qti"."mathml_or" IS 'trigger of law Node(id) where kind = m:or in MathmlOr(id), a mirrors half on MathmlOr for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_otherwise_in_mathml_otherwise_r3msvq3n4o" ON "qti"."mathml_otherwise" IS 'trigger of law Node(id) where kind = m:otherwise in MathmlOtherwise(id), a mirrors half on MathmlOtherwise for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_outerproduct_in_mathml_6b45zoxgul" ON "qti"."mathml_outerproduct" IS 'trigger of law Node(id) where kind = m:outerproduct in MathmlOuterproduct(id), a mirrors half on MathmlOuterproduct for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_partialdiff_in_mathml_partialdiff_jhzqcmjl3l" ON "qti"."mathml_partialdiff" IS 'trigger of law Node(id) where kind = m:partialdiff in MathmlPartialdiff(id), a mirrors half on MathmlPartialdiff for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_pi_in_mathml_pi_4nk6rsklar" ON "qti"."mathml_pi" IS 'trigger of law Node(id) where kind = m:pi in MathmlPi(id), a mirrors half on MathmlPi for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_piece_in_mathml_piece_a3qwzz7qau" ON "qti"."mathml_piece" IS 'trigger of law Node(id) where kind = m:piece in MathmlPiece(id), a mirrors half on MathmlPiece for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_piecewise_in_mathml_piecewise_lwcrokdb5y" ON "qti"."mathml_piecewise" IS 'trigger of law Node(id) where kind = m:piecewise in MathmlPiecewise(id), a mirrors half on MathmlPiecewise for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_plus_in_mathml_plus_nlj4osz5l4" ON "qti"."mathml_plus" IS 'trigger of law Node(id) where kind = m:plus in MathmlPlus(id), a mirrors half on MathmlPlus for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_power_in_mathml_power_diu2ijxtk5" ON "qti"."mathml_power" IS 'trigger of law Node(id) where kind = m:power in MathmlPower(id), a mirrors half on MathmlPower for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_primes_in_mathml_primes_tfwsc2tdmt" ON "qti"."mathml_primes" IS 'trigger of law Node(id) where kind = m:primes in MathmlPrimes(id), a mirrors half on MathmlPrimes for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_product_in_mathml_product_ptjno6jfnl" ON "qti"."mathml_product" IS 'trigger of law Node(id) where kind = m:product in MathmlProduct(id), a mirrors half on MathmlProduct for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_prsubset_in_mathml_prsubset_oqecueuut6" ON "qti"."mathml_prsubset" IS 'trigger of law Node(id) where kind = m:prsubset in MathmlPrsubset(id), a mirrors half on MathmlPrsubset for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_quotient_in_mathml_quotient_yq5ffidupr" ON "qti"."mathml_quotient" IS 'trigger of law Node(id) where kind = m:quotient in MathmlQuotient(id), a mirrors half on MathmlQuotient for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_rationals_in_mathml_rationals_tnptpqmebz" ON "qti"."mathml_rationals" IS 'trigger of law Node(id) where kind = m:rationals in MathmlRationals(id), a mirrors half on MathmlRationals for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_real_in_mathml_real_zosaaamqdl" ON "qti"."mathml_real" IS 'trigger of law Node(id) where kind = m:real in MathmlReal(id), a mirrors half on MathmlReal for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_reals_in_mathml_reals_32oxr5a64h" ON "qti"."mathml_reals" IS 'trigger of law Node(id) where kind = m:reals in MathmlReals(id), a mirrors half on MathmlReals for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_reln_in_mathml_reln_assqghjf2m" ON "qti"."mathml_reln" IS 'trigger of law Node(id) where kind = m:reln in MathmlReln(id), a mirrors half on MathmlReln for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_rem_in_mathml_rem_yym77crgy4" ON "qti"."mathml_rem" IS 'trigger of law Node(id) where kind = m:rem in MathmlRem(id), a mirrors half on MathmlRem for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_root_in_mathml_root_7zeoljzuf3" ON "qti"."mathml_root" IS 'trigger of law Node(id) where kind = m:root in MathmlRoot(id), a mirrors half on MathmlRoot for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_scalarproduct_in_mathml_giemlbzfit" ON "qti"."mathml_scalarproduct" IS 'trigger of law Node(id) where kind = m:scalarproduct in MathmlScalarproduct(id), a mirrors half on MathmlScalarproduct for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_sdev_in_mathml_sdev_5m5w6ce5qd" ON "qti"."mathml_sdev" IS 'trigger of law Node(id) where kind = m:sdev in MathmlSdev(id), a mirrors half on MathmlSdev for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_sec_in_mathml_sec_lxvral3mq3" ON "qti"."mathml_sec" IS 'trigger of law Node(id) where kind = m:sec in MathmlSec(id), a mirrors half on MathmlSec for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_sech_in_mathml_sech_vnc3bqyps7" ON "qti"."mathml_sech" IS 'trigger of law Node(id) where kind = m:sech in MathmlSech(id), a mirrors half on MathmlSech for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_selector_in_mathml_selector_kevsx2rgtl" ON "qti"."mathml_selector" IS 'trigger of law Node(id) where kind = m:selector in MathmlSelector(id), a mirrors half on MathmlSelector for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_semantics_in_mathml_semantics_jqk57olqbv" ON "qti"."mathml_semantics" IS 'trigger of law Node(id) where kind = m:semantics in MathmlSemantics(id), a mirrors half on MathmlSemantics for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_semantics_ci_in_mathml_semantics_gv6rmm3rgj" ON "qti"."mathml_semantics_ci" IS 'trigger of law Node(id) where kind = m:semantics.ci in MathmlSemanticsCi(id), a mirrors half on MathmlSemanticsCi for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_sep_in_mathml_sep_etpgayl5yz" ON "qti"."mathml_sep" IS 'trigger of law Node(id) where kind = m:sep in MathmlSep(id), a mirrors half on MathmlSep for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_set_in_mathml_set_pgksmedavw" ON "qti"."mathml_set" IS 'trigger of law Node(id) where kind = m:set in MathmlSet(id), a mirrors half on MathmlSet for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_setdiff_in_mathml_setdiff_34ki5uuzvt" ON "qti"."mathml_setdiff" IS 'trigger of law Node(id) where kind = m:setdiff in MathmlSetdiff(id), a mirrors half on MathmlSetdiff for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_share_in_mathml_share_srixus5y5w" ON "qti"."mathml_share" IS 'trigger of law Node(id) where kind = m:share in MathmlShare(id), a mirrors half on MathmlShare for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_sin_in_mathml_sin_4u3vfpvc33" ON "qti"."mathml_sin" IS 'trigger of law Node(id) where kind = m:sin in MathmlSin(id), a mirrors half on MathmlSin for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_sinh_in_mathml_sinh_dhj2yubnvu" ON "qti"."mathml_sinh" IS 'trigger of law Node(id) where kind = m:sinh in MathmlSinh(id), a mirrors half on MathmlSinh for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_subset_in_mathml_subset_cgswqrrny6" ON "qti"."mathml_subset" IS 'trigger of law Node(id) where kind = m:subset in MathmlSubset(id), a mirrors half on MathmlSubset for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_sum_in_mathml_sum_gsywdbpicp" ON "qti"."mathml_sum" IS 'trigger of law Node(id) where kind = m:sum in MathmlSum(id), a mirrors half on MathmlSum for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_tan_in_mathml_tan_75bmecgm3k" ON "qti"."mathml_tan" IS 'trigger of law Node(id) where kind = m:tan in MathmlTan(id), a mirrors half on MathmlTan for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_tanh_in_mathml_tanh_4krvdn225m" ON "qti"."mathml_tanh" IS 'trigger of law Node(id) where kind = m:tanh in MathmlTanh(id), a mirrors half on MathmlTanh for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_tendsto_in_mathml_tendsto_stxevbtxiv" ON "qti"."mathml_tendsto" IS 'trigger of law Node(id) where kind = m:tendsto in MathmlTendsto(id), a mirrors half on MathmlTendsto for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_times_in_mathml_times_lbb46ddb54" ON "qti"."mathml_times" IS 'trigger of law Node(id) where kind = m:times in MathmlTimes(id), a mirrors half on MathmlTimes for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_transpose_in_mathml_transpose_2zrkfgnk2j" ON "qti"."mathml_transpose" IS 'trigger of law Node(id) where kind = m:transpose in MathmlTranspose(id), a mirrors half on MathmlTranspose for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_true_in_mathml_true_zqv35r7y5q" ON "qti"."mathml_true" IS 'trigger of law Node(id) where kind = m:true in MathmlTrue(id), a mirrors half on MathmlTrue for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_union_in_mathml_union_xs4envc77d" ON "qti"."mathml_union" IS 'trigger of law Node(id) where kind = m:union in MathmlUnion(id), a mirrors half on MathmlUnion for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_uplimit_in_mathml_uplimit_r4syz5j7zd" ON "qti"."mathml_uplimit" IS 'trigger of law Node(id) where kind = m:uplimit in MathmlUplimit(id), a mirrors half on MathmlUplimit for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_variance_in_mathml_variance_56pdan2zqq" ON "qti"."mathml_variance" IS 'trigger of law Node(id) where kind = m:variance in MathmlVariance(id), a mirrors half on MathmlVariance for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_vector_in_mathml_vector_n6ba2fp7xg" ON "qti"."mathml_vector" IS 'trigger of law Node(id) where kind = m:vector in MathmlVector(id), a mirrors half on MathmlVector for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_vectorproduct_in_mathml_dz2i2rufpo" ON "qti"."mathml_vectorproduct" IS 'trigger of law Node(id) where kind = m:vectorproduct in MathmlVectorproduct(id), a mirrors half on MathmlVectorproduct for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_xor_in_mathml_xor_wj4muciuez" ON "qti"."mathml_xor" IS 'trigger of law Node(id) where kind = m:xor in MathmlXor(id), a mirrors half on MathmlXor for DELETE';

COMMENT ON TRIGGER "__law_node_kind_m_abs_in_mathml_abs_jycvtkz6b6" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:abs in MathmlAbs(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_and_in_mathml_and_4jwmn7qcsh" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:and in MathmlAnd(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_annotation_in_mathml_annotation_3fin2xuabw" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:annotation in MathmlAnnotation(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_annotation_xml_in_mathml_spzos5o3pz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:annotation-xml in MathmlAnnotationXml(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_apply_in_mathml_apply_5y6dbensrn" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:apply in MathmlApply(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_approx_in_mathml_approx_4qjn2w677q" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:approx in MathmlApprox(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arccos_in_mathml_arccos_beceskpa3d" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arccos in MathmlArccos(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arccosh_in_mathml_arccosh_szw6z6rius" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arccosh in MathmlArccosh(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arccot_in_mathml_arccot_kw54kfch2j" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arccot in MathmlArccot(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arccoth_in_mathml_arccoth_w7fhhwxanc" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arccoth in MathmlArccoth(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arccsc_in_mathml_arccsc_gwdzvthuum" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arccsc in MathmlArccsc(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arccsch_in_mathml_arccsch_v37ij6wqjy" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arccsch in MathmlArccsch(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arcsec_in_mathml_arcsec_qmpclscxww" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arcsec in MathmlArcsec(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arcsech_in_mathml_arcsech_4vqfuolzsh" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arcsech in MathmlArcsech(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arcsin_in_mathml_arcsin_yscshu5zbd" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arcsin in MathmlArcsin(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arcsinh_in_mathml_arcsinh_lj5airt7gv" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arcsinh in MathmlArcsinh(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arctan_in_mathml_arctan_oj3j43osa5" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arctan in MathmlArctan(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arctanh_in_mathml_arctanh_tjy3rvklba" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arctanh in MathmlArctanh(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_arg_in_mathml_arg_nzsdfrhsng" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:arg in MathmlArg(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_bind_in_mathml_bind_cynf73bna5" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:bind in MathmlBind(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_bvar_in_mathml_bvar_v3vgmjghgc" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:bvar in MathmlBvar(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_card_in_mathml_card_txyqzo3ero" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:card in MathmlCard(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cartesianproduct_in_mathml_v5dskwarxl" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cartesianproduct in MathmlCartesianproduct(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cbytes_in_mathml_cbytes_uwkixsezbc" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cbytes in MathmlCbytes(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_ceiling_in_mathml_ceiling_3r5i7vpmej" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:ceiling in MathmlCeiling(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cerror_in_mathml_cerror_satkfmlklc" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cerror in MathmlCerror(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_ci_in_mathml_ci_pqerpo6zo3" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:ci in MathmlCi(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cn_in_mathml_cn_usc3q2hw3z" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cn in MathmlCn(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_codomain_in_mathml_codomain_u2lbcpa6dy" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:codomain in MathmlCodomain(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_complexes_in_mathml_complexes_zwcpygr6aq" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:complexes in MathmlComplexes(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_compose_in_mathml_compose_5ts7vwphrz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:compose in MathmlCompose(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_condition_in_mathml_condition_tzz3ygfice" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:condition in MathmlCondition(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_conjugate_in_mathml_conjugate_fwaczfudcj" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:conjugate in MathmlConjugate(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cos_in_mathml_cos_dwxflgi4or" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cos in MathmlCos(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cosh_in_mathml_cosh_rjzjomhls5" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cosh in MathmlCosh(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cot_in_mathml_cot_7xssplflrw" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cot in MathmlCot(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_coth_in_mathml_coth_7bhmlply66" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:coth in MathmlCoth(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_cs_in_mathml_cs_szogprmcow" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:cs in MathmlCs(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_csc_in_mathml_csc_u5tlztlhs4" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:csc in MathmlCsc(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_csch_in_mathml_csch_u7754xvxi3" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:csch in MathmlCsch(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_csymbol_in_mathml_csymbol_lfp4o6dkrj" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:csymbol in MathmlCsymbol(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_curl_in_mathml_curl_f3g2lehq7s" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:curl in MathmlCurl(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_declare_in_mathml_declare_5i3y3asq36" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:declare in MathmlDeclare(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_degree_in_mathml_degree_efuuzciyiu" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:degree in MathmlDegree(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_determinant_in_mathml_determinant_53bzbbl5fb" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:determinant in MathmlDeterminant(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_diff_in_mathml_diff_6d7yg33xhd" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:diff in MathmlDiff(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_divergence_in_mathml_divergence_xb2vvvjoa4" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:divergence in MathmlDivergence(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_divide_in_mathml_divide_eaduoe2t3u" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:divide in MathmlDivide(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_domain_in_mathml_domain_4xsu2jnydm" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:domain in MathmlDomain(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_domainofapplication_in_mathml_z7ypr4mj2z" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:domainofapplication in MathmlDomainofapplication(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_emptyset_in_mathml_emptyset_yvc63d62vd" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:emptyset in MathmlEmptyset(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_eq_in_mathml_eq_a4aqjpwlop" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:eq in MathmlEq(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_equivalent_in_mathml_equivalent_sv5wm2pkok" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:equivalent in MathmlEquivalent(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_eulergamma_in_mathml_eulergamma_xcc7yno47h" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:eulergamma in MathmlEulergamma(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_exists_in_mathml_exists_e67bloei6a" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:exists in MathmlExists(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_exp_in_mathml_exp_kjdtswdn2f" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:exp in MathmlExp(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_exponentiale_in_mathml_yjkzvhpbm2" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:exponentiale in MathmlExponentiale(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_factorial_in_mathml_factorial_cuymkqdc3t" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:factorial in MathmlFactorial(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_factorof_in_mathml_factorof_wk4p57hhgq" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:factorof in MathmlFactorof(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_false_in_mathml_false_5b4j6e7bcx" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:false in MathmlFalse(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_floor_in_mathml_floor_ow4kopihco" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:floor in MathmlFloor(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_fn_in_mathml_fn_npomi2syvy" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:fn in MathmlFn(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_forall_in_mathml_forall_ehtigax5ww" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:forall in MathmlForall(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_gcd_in_mathml_gcd_w2naoalil4" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:gcd in MathmlGcd(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_geq_in_mathml_geq_52gaolg4ht" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:geq in MathmlGeq(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_grad_in_mathml_grad_6g62i7hm3d" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:grad in MathmlGrad(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_gt_in_mathml_gt_zcekm2qlvn" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:gt in MathmlGt(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_ident_in_mathml_ident_2rslaagjib" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:ident in MathmlIdent(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_image_in_mathml_image_yk5v66xzfk" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:image in MathmlImage(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_imaginary_in_mathml_imaginary_yurtqo3746" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:imaginary in MathmlImaginary(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_imaginaryi_in_mathml_imaginaryi_d6fka7i42h" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:imaginaryi in MathmlImaginaryi(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_implies_in_mathml_implies_vfcakwdxjm" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:implies in MathmlImplies(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_in_in_mathml_in_h2lphpq2kw" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:in in MathmlIn(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_infinity_in_mathml_infinity_maozdgxcn6" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:infinity in MathmlInfinity(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_int_in_mathml_int_oayijoyn3k" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:int in MathmlInt(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_integers_in_mathml_integers_iac6j3splk" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:integers in MathmlIntegers(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_intersect_in_mathml_intersect_qkudxud2dz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:intersect in MathmlIntersect(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_interval_in_mathml_interval_v4e7wv45hb" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:interval in MathmlInterval(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_inverse_in_mathml_inverse_4ho2kp5i7p" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:inverse in MathmlInverse(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_lambda_in_mathml_lambda_n4awhcczfc" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:lambda in MathmlLambda(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_laplacian_in_mathml_laplacian_nyttlunbpx" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:laplacian in MathmlLaplacian(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_lcm_in_mathml_lcm_73fvsq5ll2" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:lcm in MathmlLcm(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_leq_in_mathml_leq_2repmrvtcd" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:leq in MathmlLeq(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_limit_in_mathml_limit_o5uw6orrrn" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:limit in MathmlLimit(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_list_in_mathml_list_k34yf42qam" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:list in MathmlList(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_ln_in_mathml_ln_si42vjpz7i" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:ln in MathmlLn(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_log_in_mathml_log_sgzew6h2sm" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:log in MathmlLog(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_logbase_in_mathml_logbase_nzgwqiu7k7" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:logbase in MathmlLogbase(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_lowlimit_in_mathml_lowlimit_jkujaufiqn" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:lowlimit in MathmlLowlimit(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_lt_in_mathml_lt_iks2linrt6" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:lt in MathmlLt(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_maction_in_mathml_maction_n5hd5wz7ge" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:maction in MathmlMaction(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_maligngroup_in_mathml_maligngroup_a27l5cfvyr" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:maligngroup in MathmlMaligngroup(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_malignmark_in_mathml_malignmark_t4jdjcrtjr" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:malignmark in MathmlMalignmark(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_math_in_mathml_math_a5hy2fbnsp" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:math in MathmlMath(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_matrix_in_mathml_matrix_7bt5n22r6m" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:matrix in MathmlMatrix(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_matrixrow_in_mathml_matrixrow_skiajds2zv" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:matrixrow in MathmlMatrixrow(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_max_in_mathml_max_cjafpq27wv" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:max in MathmlMax(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mean_in_mathml_mean_azq5jwuc3e" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mean in MathmlMean(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_median_in_mathml_median_l5wgfhd6kf" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:median in MathmlMedian(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_menclose_in_mathml_menclose_dq54l5r4xa" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:menclose in MathmlMenclose(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_merror_in_mathml_merror_qmghqld6mz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:merror in MathmlMerror(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mfenced_in_mathml_mfenced_nxvlygb2se" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mfenced in MathmlMfenced(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mfrac_in_mathml_mfrac_enqgpyy4o3" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mfrac in MathmlMfrac(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mglyph_in_mathml_mglyph_nzisnat6v7" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mglyph in MathmlMglyph(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mi_in_mathml_mi_ilk5giwi3d" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mi in MathmlMi(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_min_in_mathml_min_7a7q3h6nto" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:min in MathmlMin(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_minus_in_mathml_minus_agxysd4afl" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:minus in MathmlMinus(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mlabeledtr_in_mathml_mlabeledtr_f3uc3voh3u" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mlabeledtr in MathmlMlabeledtr(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mlongdiv_in_mathml_mlongdiv_csx3ss2hm7" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mlongdiv in MathmlMlongdiv(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mmultiscripts_in_mathml_uimb3kmx2y" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mmultiscripts in MathmlMmultiscripts(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mn_in_mathml_mn_xhw4xngorh" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mn in MathmlMn(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mo_in_mathml_mo_nypb44c3ea" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mo in MathmlMo(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mode_in_mathml_mode_fxbnpjnb4u" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mode in MathmlMode(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_moment_in_mathml_moment_zivnhxrgwm" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:moment in MathmlMoment(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_momentabout_in_mathml_momentabout_o4s3gosuud" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:momentabout in MathmlMomentabout(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mover_in_mathml_mover_wecef3a723" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mover in MathmlMover(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mpadded_in_mathml_mpadded_syvyornonz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mpadded in MathmlMpadded(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mphantom_in_mathml_mphantom_nbw2plq3cq" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mphantom in MathmlMphantom(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mprescripts_in_mathml_mprescripts_oo5ecx2jyg" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mprescripts in MathmlMprescripts(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mroot_in_mathml_mroot_6wutz6hiti" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mroot in MathmlMroot(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mrow_in_mathml_mrow_gd25mrxoda" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mrow in MathmlMrow(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_ms_in_mathml_ms_erojspn2zn" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:ms in MathmlMs(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mscarries_in_mathml_mscarries_5tg2cfdazc" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mscarries in MathmlMscarries(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mscarry_in_mathml_mscarry_zxbbf7iruf" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mscarry in MathmlMscarry(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_msgroup_in_mathml_msgroup_p3nt4b7gmg" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:msgroup in MathmlMsgroup(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_msline_in_mathml_msline_s2w5leoujz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:msline in MathmlMsline(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mspace_in_mathml_mspace_gchlwt6k6g" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mspace in MathmlMspace(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_msqrt_in_mathml_msqrt_v3udsi46ov" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:msqrt in MathmlMsqrt(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_msrow_in_mathml_msrow_qkdt2cmlqt" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:msrow in MathmlMsrow(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mstack_in_mathml_mstack_wi62a22q75" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mstack in MathmlMstack(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mstyle_in_mathml_mstyle_abzkohpjsd" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mstyle in MathmlMstyle(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_msub_in_mathml_msub_ryat2d3yu2" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:msub in MathmlMsub(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_msubsup_in_mathml_msubsup_hqhtyjvxlw" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:msubsup in MathmlMsubsup(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_msup_in_mathml_msup_zabrsi3yfu" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:msup in MathmlMsup(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mtable_in_mathml_mtable_2hsgnhnq3o" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mtable in MathmlMtable(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mtd_in_mathml_mtd_fkctjzom2e" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mtd in MathmlMtd(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mtext_in_mathml_mtext_if5pxzlcxi" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mtext in MathmlMtext(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_mtr_in_mathml_mtr_6t7e6nathe" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:mtr in MathmlMtr(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_munder_in_mathml_munder_xvdp6cqia3" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:munder in MathmlMunder(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_munderover_in_mathml_munderover_lz4yhimo3u" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:munderover in MathmlMunderover(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_naturalnumbers_in_mathml_z5qe4olrav" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:naturalnumbers in MathmlNaturalnumbers(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_neq_in_mathml_neq_r5huazylxt" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:neq in MathmlNeq(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_none_in_mathml_none_z2mv5tpysp" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:none in MathmlNone(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_not_in_mathml_not_bvq6kpqqq5" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:not in MathmlNot(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_notanumber_in_mathml_notanumber_tyvd7nlse7" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:notanumber in MathmlNotanumber(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_notin_in_mathml_notin_hmloeoi6ol" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:notin in MathmlNotin(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_notprsubset_in_mathml_notprsubset_x7alocbmld" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:notprsubset in MathmlNotprsubset(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_notsubset_in_mathml_notsubset_tj6zkgivl7" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:notsubset in MathmlNotsubset(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_or_in_mathml_or_t3hrh7dkwl" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:or in MathmlOr(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_otherwise_in_mathml_otherwise_mrxl2fpwmv" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:otherwise in MathmlOtherwise(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_outerproduct_in_mathml_gfwh6fefzz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:outerproduct in MathmlOuterproduct(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_partialdiff_in_mathml_partialdiff_zwligwjc5k" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:partialdiff in MathmlPartialdiff(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_pi_in_mathml_pi_5ef6ftffhf" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:pi in MathmlPi(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_piece_in_mathml_piece_r2ppszlmm2" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:piece in MathmlPiece(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_piecewise_in_mathml_piecewise_vv3tt7ds74" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:piecewise in MathmlPiecewise(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_plus_in_mathml_plus_fgtagtqjzt" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:plus in MathmlPlus(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_power_in_mathml_power_mx5gwchidt" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:power in MathmlPower(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_primes_in_mathml_primes_zj24ronmy7" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:primes in MathmlPrimes(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_product_in_mathml_product_64bnifhkrf" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:product in MathmlProduct(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_prsubset_in_mathml_prsubset_rwiqhxgnif" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:prsubset in MathmlPrsubset(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_quotient_in_mathml_quotient_tu7llr5qku" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:quotient in MathmlQuotient(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_rationals_in_mathml_rationals_nacptlyswk" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:rationals in MathmlRationals(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_real_in_mathml_real_zryknqwdbu" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:real in MathmlReal(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_reals_in_mathml_reals_4hnwgdnala" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:reals in MathmlReals(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_reln_in_mathml_reln_fu336ttmmh" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:reln in MathmlReln(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_rem_in_mathml_rem_7ih4gj3bzx" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:rem in MathmlRem(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_root_in_mathml_root_b3qa4pb4da" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:root in MathmlRoot(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_scalarproduct_in_mathml_xn7m5wcbqs" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:scalarproduct in MathmlScalarproduct(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_sdev_in_mathml_sdev_zjmicdewmo" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:sdev in MathmlSdev(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_sec_in_mathml_sec_buwedsjvno" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:sec in MathmlSec(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_sech_in_mathml_sech_3u7ac5htpl" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:sech in MathmlSech(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_selector_in_mathml_selector_l6w7ivkfrs" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:selector in MathmlSelector(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_semantics_in_mathml_semantics_xpt7qp5ygp" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:semantics in MathmlSemantics(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_semantics_ci_in_mathml_semantics_wotaf6q7vi" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:semantics.ci in MathmlSemanticsCi(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_sep_in_mathml_sep_dlp2btwelr" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:sep in MathmlSep(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_set_in_mathml_set_qytyt3wm64" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:set in MathmlSet(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_setdiff_in_mathml_setdiff_amreiyurlr" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:setdiff in MathmlSetdiff(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_share_in_mathml_share_mkmxko2jch" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:share in MathmlShare(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_sin_in_mathml_sin_cwahizupiz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:sin in MathmlSin(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_sinh_in_mathml_sinh_7d5y2h5mrp" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:sinh in MathmlSinh(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_subset_in_mathml_subset_vv6sgl34ae" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:subset in MathmlSubset(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_sum_in_mathml_sum_oktb665hu5" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:sum in MathmlSum(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_tan_in_mathml_tan_27mqkv7kbf" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:tan in MathmlTan(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_tanh_in_mathml_tanh_vicqnmm7xq" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:tanh in MathmlTanh(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_tendsto_in_mathml_tendsto_hvhvv4hfs7" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:tendsto in MathmlTendsto(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_times_in_mathml_times_gvmkyjbbcj" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:times in MathmlTimes(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_transpose_in_mathml_transpose_5wtzn3xf6o" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:transpose in MathmlTranspose(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_true_in_mathml_true_chvlndtmt6" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:true in MathmlTrue(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_union_in_mathml_union_fijcz5lnki" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:union in MathmlUnion(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_uplimit_in_mathml_uplimit_buncns6ipy" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:uplimit in MathmlUplimit(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_variance_in_mathml_variance_hfyib3p65k" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:variance in MathmlVariance(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_vector_in_mathml_vector_owgkl6n25d" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:vector in MathmlVector(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_vectorproduct_in_mathml_xorg3sfw54" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:vectorproduct in MathmlVectorproduct(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_m_xor_in_mathml_xor_hzbleebjdz" ON "qti"."node" IS 'trigger of law Node(id) where kind = m:xor in MathmlXor(id), a mirrors half on Node for INSERT';
