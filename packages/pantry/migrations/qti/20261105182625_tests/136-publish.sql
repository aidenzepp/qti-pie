DROP TRIGGER "__law_assessment_item_label_version_3_0_1_in_item_cllyb2fohc" ON "qti"."assessment_item_label";

DROP TRIGGER "__law_assessment_item_label_version_3_0_1_in_item_zlf2rpuma2" ON "qti"."item_tool_both";

ALTER TABLE "qti"."item_tool" DROP CONSTRAINT "__item_tool_fk_tree_awvhaigtwv";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."ancestry", "qti"."aria_autocomplete_value", "qti"."aria_current_value", "qti"."aria_invalid_value", "qti"."aria_live_value", "qti"."aria_orientation_value", "qti"."aria_role_value", "qti"."aria_sort_value", "qti"."aria_tristate", "qti"."aria_true_false_undefined", "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."boolean_literal", "qti"."bound", "qti"."built_in", "qti"."cell_align", "qti"."cell_scope", "qti"."cell_valign", "qti"."cp_schema", "qti"."cross_origin", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."external_scored", "qti"."id_holder", "qti"."idref_attribute", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."math_constant_name", "qti"."math_operator_name", "qti"."media_autoplay", "qti"."media_controls", "qti"."media_loop", "qti"."media_muted", "qti"."media_preload", "qti"."misc_kind", "qti"."node_kind", "qti"."orientation", "qti"."param_valuetype", "qti"."placement", "qti"."printed_variable_attr", "qti"."qmd_feedback_type_value", "qti"."qmd_interaction_type_value", "qti"."qmd_scoring_mode_value", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."rounding_mode", "qti"."schema_version", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."statistic_kind", "qti"."stats_operator_name", "qti"."suppress_tts_mode", "qti"."target_object_type", "qti"."text_direction", "qti"."text_format", "qti"."tolerance_mode", "qti"."tool_shape", "qti"."track_default_value", "qti"."track_kind", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."x_include_parse_value", "qti"."xs_boolean", "qti"."yes_no" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."access_mode", "qti"."access_mode_adapted", "qti"."aria_integer", "qti"."aria_positive_integer", "qti"."case_item_uri", "qti"."category_list", "qti"."choice_count", "qti"."choice_identifier", "qti"."citation_uri", "qti"."class_list", "qti"."container_width", "qti"."content_language", "qti"."content_media_type", "qti"."custom_operator_class_name", "qti"."custom_operator_definition_uri", "qti"."declared_directed_pair_value", "qti"."declared_duration_value", "qti"."declared_float_value", "qti"."declared_identifier_value", "qti"."declared_integer_value", "qti"."declared_pair_value", "qti"."declared_point_value", "qti"."declared_uri_value", "qti"."drd_adaptation_uri", "qti"."embed_source_uri", "qti"."expected_length", "qti"."expected_lines", "qti"."expression_coords", "qti"."expression_integer_or_variable", "qti"."file_media_type", "qti"."glossary_uri", "qti"."hyperlink_uri", "qti"."id_reference", "qti"."interpolation_default_directed_pair_value", "qti"."interpolation_default_duration_value", "qti"."interpolation_default_float_value", "qti"."interpolation_default_identifier_value", "qti"."interpolation_default_integer_value", "qti"."interpolation_default_pair_value", "qti"."interpolation_default_point_value", "qti"."interpolation_default_uri_value", "qti"."interpolation_source_value", "qti"."interpolation_target_directed_pair_value", "qti"."interpolation_target_duration_value", "qti"."interpolation_target_float_value", "qti"."interpolation_target_identifier_value", "qti"."interpolation_target_integer_value", "qti"."interpolation_target_pair_value", "qti"."interpolation_target_point_value", "qti"."interpolation_target_uri_value", "qti"."lang_string_language", "qti"."literal_directed_pair_value", "qti"."literal_duration_value", "qti"."literal_float_value", "qti"."literal_identifier_value", "qti"."literal_integer_value", "qti"."literal_pair_value", "qti"."literal_point_value", "qti"."literal_uri_value", "qti"."lom_token", "qti"."lom_vocabulary_source", "qti"."lom_vocabulary_value", "qti"."long_description_uri", "qti"."long_interpretation_uri", "qti"."manifest_identifier", "qti"."map_key_directed_pair_value", "qti"."map_key_duration_value", "qti"."map_key_float_value", "qti"."map_key_identifier_value", "qti"."map_key_integer_value", "qti"."map_key_pair_value", "qti"."map_key_point_value", "qti"."map_key_uri_value", "qti"."mapping_score", "qti"."match_default_directed_pair_value", "qti"."match_default_duration_value", "qti"."match_default_float_value", "qti"."match_default_identifier_value", "qti"."match_default_integer_value", "qti"."match_default_pair_value", "qti"."match_default_point_value", "qti"."match_default_uri_value", "qti"."match_group_list", "qti"."match_source_value", "qti"."match_target_directed_pair_value", "qti"."match_target_duration_value", "qti"."match_target_float_value", "qti"."match_target_identifier_value", "qti"."match_target_integer_value", "qti"."match_target_pair_value", "qti"."match_target_point_value", "qti"."match_target_uri_value", "qti"."media_rect_coords", "qti"."namespace_prefix", "qti"."namespace_uri", "qti"."outcome_scale_value", "qti"."package_path", "qti"."pi_target", "qti"."printed_variable_integer_or_variable", "qti"."record_field_identifier", "qti"."rect_coords", "qti"."resource_entry_href", "qti"."section_reference", "qti"."shape_coords", "qti"."show_hide_identifier", "qti"."statistic_context_uri", "qti"."statistic_measure", "qti"."statistic_name", "qti"."string_count", "qti"."stylesheet_uri", "qti"."table_span", "qti"."template_location_uri", "qti"."template_parameter_name", "qti"."template_uri", "qti"."tool_name", "qti"."tool_vendor", "qti"."tool_version", "qti"."track_language", "qti"."usage_case_count", "qti"."usage_directed_pair_value", "qti"."usage_duration_value", "qti"."usage_field_identifier", "qti"."usage_float_value", "qti"."usage_identifier_value", "qti"."usage_integer_value", "qti"."usage_mapping_score", "qti"."usage_pair_value", "qti"."usage_part_identifier", "qti"."usage_point_value", "qti"."usage_uri_value", "qti"."usage_value_token", "qti"."variable_reference", "qti"."weight_reference", "qti"."x_include_uri", "qti"."xml_base_uri", "qti"."xml_entity_name", "qti"."__text_osqmo2ktsg", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_tq7gq2jmkl", "qti"."__text_oy4m3tqgfd", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_xarz6cej2e", "qti"."__text_xs56r6cx4y", "qti"."__text_ieskz75v7g", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_awt4t5kosa", "qti"."__text_vtz3bnghkc", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_5lyuoloiou", "qti"."__text_bvx3fqniye", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_acxfo763jg", "qti"."__text_tmjud3n2tg", "qti"."__text_gjl5q4ofup", "qti"."__text_rhdrzkabze", "qti"."__text_o3e7dedzyv", "qti"."__text_ukaaxf45sk", "qti"."__text_tyjqwtj7ky", "qti"."__text_fgbxwprcwx", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_hv3bw3mdte", "qti"."__text_kcydnvglpj", "qti"."__text_wuvwyowttn", "qti"."__text_gm4clqaaza", "qti"."__text_saolosnhkp" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."access_for_all_resource", "qti__author"."acronym", "qti__author"."address", "qti__author"."and", "qti__author"."any_n", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."article", "qti__author"."aside", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."attribute_entity_reference", "qti__author"."attribute_idref", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."container_size", "qti__author"."contains", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."dd", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_default_value", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_order_shuffle", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_rounding_mode", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_substring", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_tolerance_mode", "qti__author"."declared_track_kind", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."divide", "qti__author"."dl", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."dt", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_rounded_figures_ref", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."field_value", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."gcd", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices_n", "qti__author"."gt", "qti__author"."gte", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."index_n_ref", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."kbd", "qti__author"."label", "qti__author"."lcm", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_selections_message", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."member", "qti__author"."min", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."or", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."ordered", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."param", "qti__author"."param_type", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."power", "qti__author"."pre", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."product", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."rb", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."repeat_number_repeats_ref", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."round_to_figures_ref", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."select_point_interaction", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."string_binding", "qti__author"."string_match", "qti__author"."strong", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_feedback_block", "qti__author"."template_if_arm", "qti__author"."template_inline", "qti__author"."template_processing", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."tt", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_xpointer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."a" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."a_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."abbr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."access_for_all_resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."acronym" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_match_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associate_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_slider_step_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_substring" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_feedback_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_inline_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_text_entry_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_tolerance_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_track_kind" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_both" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_version" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."multiple" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."namespace_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."nav" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_catalog_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_class" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_dir" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_suppress_tts" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_lang" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."select_point_interaction" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."string_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."string_match" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."strong" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_else_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_else_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_feedback_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_if_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_inline" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_parameter_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_processing" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ws" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_accept_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_encoding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_parse" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."x_include_xpointer" FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"("pg_catalog"."text", "pg_catalog"."text", "pg_catalog"."text") FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."ancestry", "qti"."aria_autocomplete_value", "qti"."aria_current_value", "qti"."aria_invalid_value", "qti"."aria_live_value", "qti"."aria_orientation_value", "qti"."aria_role_value", "qti"."aria_sort_value", "qti"."aria_tristate", "qti"."aria_true_false_undefined", "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."boolean_literal", "qti"."bound", "qti"."branch_exit", "qti"."branch_target", "qti"."built_in", "qti"."cell_align", "qti"."cell_scope", "qti"."cell_valign", "qti"."cp_schema", "qti"."cross_origin", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."external_scored", "qti"."id_holder", "qti"."idref_attribute", "qti"."item_ref_target", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."math_constant_name", "qti"."math_operator_name", "qti"."media_autoplay", "qti"."media_controls", "qti"."media_loop", "qti"."media_muted", "qti"."media_preload", "qti"."misc_kind", "qti"."navigation_mode", "qti"."node_kind", "qti"."orientation", "qti"."param_valuetype", "qti"."placement", "qti"."prefixed_source", "qti"."printed_variable_attr", "qti"."qmd_feedback_type_value", "qti"."qmd_interaction_type_value", "qti"."qmd_scoring_mode_value", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."rounding_mode", "qti"."schema_version", "qti"."section_variable_target", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."statistic_kind", "qti"."stats_operator_name", "qti"."structure_holder", "qti"."submission_mode", "qti"."suppress_tts_mode", "qti"."target_object_type", "qti"."test_feedback_access", "qti"."text_direction", "qti"."text_format", "qti"."tolerance_mode", "qti"."tool_shape", "qti"."track_default_value", "qti"."track_kind", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."x_include_parse_value", "qti"."xs_boolean", "qti"."yes_no" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."access_mode", "qti"."access_mode_adapted", "qti"."adaptive_ref_href", "qti"."adaptive_ref_identifier", "qti"."aria_integer", "qti"."aria_positive_integer", "qti"."case_item_uri", "qti"."category_list", "qti"."choice_count", "qti"."choice_identifier", "qti"."citation_uri", "qti"."class_list", "qti"."container_width", "qti"."content_language", "qti"."content_media_type", "qti"."custom_operator_class_name", "qti"."custom_operator_definition_uri", "qti"."declared_directed_pair_value", "qti"."declared_duration_value", "qti"."declared_float_value", "qti"."declared_identifier_value", "qti"."declared_integer_value", "qti"."declared_pair_value", "qti"."declared_point_value", "qti"."declared_uri_value", "qti"."drd_adaptation_uri", "qti"."embed_source_uri", "qti"."expected_length", "qti"."expected_lines", "qti"."expression_coords", "qti"."expression_integer_or_variable", "qti"."file_media_type", "qti"."glossary_uri", "qti"."hyperlink_uri", "qti"."id_reference", "qti"."interpolation_default_directed_pair_value", "qti"."interpolation_default_duration_value", "qti"."interpolation_default_float_value", "qti"."interpolation_default_identifier_value", "qti"."interpolation_default_integer_value", "qti"."interpolation_default_pair_value", "qti"."interpolation_default_point_value", "qti"."interpolation_default_uri_value", "qti"."interpolation_source_value", "qti"."interpolation_target_directed_pair_value", "qti"."interpolation_target_duration_value", "qti"."interpolation_target_float_value", "qti"."interpolation_target_identifier_value", "qti"."interpolation_target_integer_value", "qti"."interpolation_target_pair_value", "qti"."interpolation_target_point_value", "qti"."interpolation_target_uri_value", "qti"."item_ref_href", "qti"."lang_string_language", "qti"."literal_directed_pair_value", "qti"."literal_duration_value", "qti"."literal_float_value", "qti"."literal_identifier_value", "qti"."literal_integer_value", "qti"."literal_pair_value", "qti"."literal_point_value", "qti"."literal_uri_value", "qti"."lom_token", "qti"."lom_vocabulary_source", "qti"."lom_vocabulary_value", "qti"."long_description_uri", "qti"."long_interpretation_uri", "qti"."manifest_identifier", "qti"."map_key_directed_pair_value", "qti"."map_key_duration_value", "qti"."map_key_float_value", "qti"."map_key_identifier_value", "qti"."map_key_integer_value", "qti"."map_key_pair_value", "qti"."map_key_point_value", "qti"."map_key_uri_value", "qti"."mapped_variable_name", "qti"."mapping_score", "qti"."match_default_directed_pair_value", "qti"."match_default_duration_value", "qti"."match_default_float_value", "qti"."match_default_identifier_value", "qti"."match_default_integer_value", "qti"."match_default_pair_value", "qti"."match_default_point_value", "qti"."match_default_uri_value", "qti"."match_group_list", "qti"."match_source_value", "qti"."match_target_directed_pair_value", "qti"."match_target_duration_value", "qti"."match_target_float_value", "qti"."match_target_identifier_value", "qti"."match_target_integer_value", "qti"."match_target_pair_value", "qti"."match_target_point_value", "qti"."match_target_uri_value", "qti"."media_rect_coords", "qti"."namespace_prefix", "qti"."namespace_uri", "qti"."outcome_scale_value", "qti"."package_path", "qti"."pi_target", "qti"."printed_variable_integer_or_variable", "qti"."record_field_identifier", "qti"."rect_coords", "qti"."resource_entry_href", "qti"."section_ref_href", "qti"."section_reference", "qti"."shape_coords", "qti"."show_hide_identifier", "qti"."slider_bound", "qti"."statistic_context_uri", "qti"."statistic_measure", "qti"."statistic_name", "qti"."stimulus_ref_href", "qti"."stimulus_ref_identifier", "qti"."string_count", "qti"."stylesheet_uri", "qti"."table_span", "qti"."template_location_uri", "qti"."template_parameter_name", "qti"."template_uri", "qti"."test_structure_identifier", "qti"."time_limit_seconds", "qti"."tool_name", "qti"."tool_vendor", "qti"."tool_version", "qti"."track_language", "qti"."usage_case_count", "qti"."usage_directed_pair_value", "qti"."usage_duration_value", "qti"."usage_field_identifier", "qti"."usage_float_value", "qti"."usage_identifier_value", "qti"."usage_integer_value", "qti"."usage_mapping_score", "qti"."usage_pair_value", "qti"."usage_part_identifier", "qti"."usage_point_value", "qti"."usage_uri_value", "qti"."usage_value_token", "qti"."variable_reference", "qti"."weight_reference", "qti"."weight_value", "qti"."x_include_uri", "qti"."xml_base_uri", "qti"."xml_entity_name", "qti"."__text_osqmo2ktsg", "qti"."__text_4adkkv4wal", "qti"."__text_7mulu52tr6", "qti"."__text_ottycep7en", "qti"."__text_tq7gq2jmkl", "qti"."__text_oy4m3tqgfd", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_xarz6cej2e", "qti"."__text_xs56r6cx4y", "qti"."__text_ieskz75v7g", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_awt4t5kosa", "qti"."__text_vtz3bnghkc", "qti"."__text_sa4c4ywp5v", "qti"."__text_lsy6pxooea", "qti"."__text_5lyuoloiou", "qti"."__text_bvx3fqniye", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_acxfo763jg", "qti"."__text_tmjud3n2tg", "qti"."__text_gjl5q4ofup", "qti"."__text_rhdrzkabze", "qti"."__text_o3e7dedzyv", "qti"."__text_ukaaxf45sk", "qti"."__text_tyjqwtj7ky", "qti"."__text_fgbxwprcwx", "qti"."__text_2rz6hgcvt2", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_hv3bw3mdte", "qti"."__text_kcydnvglpj", "qti"."__text_wuvwyowttn", "qti"."__text_gm4clqaaza", "qti"."__text_saolosnhkp" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."access_for_all_resource", "qti__author"."acronym", "qti__author"."adaptive_engine_ref", "qti__author"."adaptive_selection", "qti__author"."adaptive_settings_ref", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."and", "qti__author"."any_n", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."assessment_section", "qti__author"."assessment_stimulus", "qti__author"."assessment_test", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_file_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."attribute_spelling", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."branch_rule", "qti__author"."branch_rule_exit", "qti__author"."branch_rule_target", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."container_size", "qti__author"."contains", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_allow_comment", "qti__author"."declared_allow_late_submission", "qti__author"."declared_allow_review", "qti__author"."declared_allow_skipping", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_default_value", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_item_ref_fixed", "qti__author"."declared_item_ref_required", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_order_shuffle", "qti__author"."declared_ordering_shuffle", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_section_fixed", "qti__author"."declared_section_keep_together", "qti__author"."declared_section_required", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_feedback", "qti__author"."declared_show_hide", "qti__author"."declared_show_solution", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_substring", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_tolerance_mode", "qti__author"."declared_track_kind", "qti__author"."declared_validate_responses", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."declared_with_replacement", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."divide", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."dt", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_rounded_figures_ref", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."field_value", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."gcd", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices_n", "qti__author"."gt", "qti__author"."gte", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."index_n_ref", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_instance_spelling", "qti__author"."item_instance_variable_ref", "qti__author"."item_ref", "qti__author"."item_ref_category", "qti__author"."item_ref_document", "qti__author"."item_ref_lti", "qti__author"."item_ref_resolution", "qti__author"."item_session_control", "qti__author"."item_session_max_attempts", "qti__author"."item_stimulus_ref", "qti__author"."item_stimulus_ref_title", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."item_variable_ref", "qti__author"."kbd", "qti__author"."label", "qti__author"."lcm", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_selections_message", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."member", "qti__author"."metadata_ref", "qti__author"."min", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."ordered", "qti__author"."ordering", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."power", "qti__author"."pre", "qti__author"."pre_condition", "qti__author"."prefixed_built_in", "qti__author"."prefixed_declared", "qti__author"."prefixed_mapped", "qti__author"."prefixed_variable_source", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."product", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."repeat_number_repeats_ref", "qti__author"."required_child", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."round_to_figures_ref", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."rule_operand", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."section_duration_ref", "qti__author"."section_duration_target", "qti__author"."section_feedback_outcome_ref", "qti__author"."section_identifier_target", "qti__author"."section_printed_variable_ref", "qti__author"."section_printed_variable_var_ref", "qti__author"."section_ref", "qti__author"."section_ref_resolution", "qti__author"."section_variable_declared", "qti__author"."section_variable_duration", "qti__author"."section_variable_prefixed", "qti__author"."section_variable_ref", "qti__author"."section_variable_resolution", "qti__author"."select_point_interaction", "qti__author"."selection", "qti__author"."selection_bounded", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."stimulus_body", "qti__author"."stimulus_ref_resolution", "qti__author"."string_binding", "qti__author"."string_match", "qti__author"."strong", "qti__author"."structure_child", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_default", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_feedback_block", "qti__author"."template_if_arm", "qti__author"."template_inline", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_document", "qti__author"."test_feedback", "qti__author"."test_feedback_content_body", "qti__author"."test_feedback_title", "qti__author"."test_identifier", "qti__author"."test_part", "qti__author"."test_part_title", "qti__author"."test_reach", "qti__author"."test_rubric_block", "qti__author"."test_rubric_block_use", "qti__author"."test_rubric_content_body", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."tests_hold", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."time_limit_max", "qti__author"."time_limit_min", "qti__author"."time_limits", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_data_ref", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."weight", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_catalog_idref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_class" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_dir" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_suppress_tts" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node_xml_lang" TO "qti__author";

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

GRANT EXECUTE ON FUNCTION "qti"."__refuse"("pg_catalog"."text", "pg_catalog"."text", "pg_catalog"."text") TO "qti__author";

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."a", "qti"."a_type", "qti"."abbr", "qti"."access_for_all_resource", "qti"."acronym", "qti"."adaptive_engine_ref", "qti"."adaptive_selection", "qti"."adaptive_settings_ref", "qti"."address", "qti"."admission", "qti"."ancestry_step", "qti"."and", "qti"."any_n", "qti"."area_map_entry", "qti"."area_mapping", "qti"."area_mapping_lower_bound", "qti"."area_mapping_upper_bound", "qti"."aria_activedescendant", "qti"."aria_atomic", "qti"."aria_autocomplete", "qti"."aria_busy", "qti"."aria_checked", "qti"."aria_colcount", "qti"."aria_colindex", "qti"."aria_colspan", "qti"."aria_controls", "qti"."aria_current", "qti"."aria_describedby", "qti"."aria_details", "qti"."aria_disabled", "qti"."aria_errormessage", "qti"."aria_expanded", "qti"."aria_flowto", "qti"."aria_haspopup", "qti"."aria_hidden", "qti"."aria_invalid", "qti"."aria_keyshortcuts", "qti"."aria_keyshorts", "qti"."aria_label", "qti"."aria_labelledby", "qti"."aria_level", "qti"."aria_live", "qti"."aria_modal", "qti"."aria_multiline", "qti"."aria_multiselectable", "qti"."aria_orientation", "qti"."aria_owns", "qti"."aria_placeholder", "qti"."aria_posinset", "qti"."aria_pressed", "qti"."aria_readonly", "qti"."aria_relevant", "qti"."aria_required", "qti"."aria_role", "qti"."aria_roledescription", "qti"."aria_rowcount", "qti"."aria_rowindex", "qti"."aria_rowspan", "qti"."aria_selected", "qti"."aria_setsize", "qti"."aria_sort", "qti"."aria_valuemax", "qti"."aria_valuemin", "qti"."aria_valuenow", "qti"."aria_valuetext", "qti"."article", "qti"."aside", "qti"."assessment_item", "qti"."assessment_item_label", "qti"."assessment_section", "qti"."assessment_stimulus", "qti"."assessment_test", "qti"."associable_hotspot", "qti"."associable_hotspot_label", "qti"."associable_hotspot_match_min", "qti"."associate_interaction", "qti"."attribute_admission", "qti"."attribute_entity_reference", "qti"."attribute_file_reference", "qti"."attribute_idref", "qti"."attribute_lexical", "qti"."attribute_spelling", "qti"."audio", "qti"."audio_autoplay", "qti"."audio_controls", "qti"."audio_crossorigin", "qti"."audio_loop", "qti"."audio_mediagroup", "qti"."audio_muted", "qti"."audio_preload", "qti"."audio_src", "qti"."b", "qti"."bdi", "qti"."bdo", "qti"."bdo_title", "qti"."big", "qti"."binding_fit", "qti"."blockquote", "qti"."blockquote_cite", "qti"."br", "qti"."branch_rule", "qti"."branch_rule_exit", "qti"."branch_rule_target", "qti"."built_in_ref", "qti"."caption", "qti"."catalog_info", "qti"."categorized_statistic_arm", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."choice_template_ref", "qti"."cite", "qti"."code", "qti"."col", "qti"."col_span", "qti"."colgroup", "qti"."colgroup_span", "qti"."comment", "qti"."companion_materials_info", "qti"."container_size", "qti"."contains", "qti"."content_body_feedback", "qti"."content_body_modal", "qti"."content_body_rubric", "qti"."content_body_rubric_template", "qti"."content_body_template", "qti"."context_declaration_arm", "qti"."context_declaration_id", "qti"."coords", "qti"."coords_circle", "qti"."coords_default", "qti"."coords_ellipse", "qti"."coords_poly", "qti"."coords_rect", "qti"."correct", "qti"."correct_response_arm", "qti"."csm_case_item_uri", "qti"."csm_guid", "qti"."csm_label", "qti"."csm_labelled_guid", "qti"."csm_metadata", "qti"."csm_metadata_provider_id", "qti"."csm_set", "qti"."csm_set_of_guids", "qti"."csm_set_of_guids_region", "qti"."csm_set_of_guids_version", "qti"."csm_set_resource_label", "qti"."csm_set_resource_part_id", "qti"."custom_operator", "qti"."custom_operator_class", "qti"."custom_operator_definition", "qti"."dd", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_allow_comment", "qti"."declared_allow_late_submission", "qti"."declared_allow_review", "qti"."declared_allow_skipping", "qti"."declared_area_mapping_default_value", "qti"."declared_associable_hotspot_show_hide", "qti"."declared_associate_max_associations", "qti"."declared_associate_min_associations", "qti"."declared_associate_shuffle", "qti"."declared_default_value", "qti"."declared_extended_text_base", "qti"."declared_extended_text_format", "qti"."declared_extended_text_min_strings", "qti"."declared_feedback_block_show_hide", "qti"."declared_feedback_inline_show_hide", "qti"."declared_fixed", "qti"."declared_gap_img_show_hide", "qti"."declared_gap_match_max_associations", "qti"."declared_gap_match_shuffle", "qti"."declared_gap_required", "qti"."declared_gap_show_hide", "qti"."declared_gap_text_show_hide", "qti"."declared_graphic_associate_max_associations", "qti"."declared_graphic_gap_match_max_associations", "qti"."declared_hotspot_choice_show_hide", "qti"."declared_hotspot_max_choices", "qti"."declared_hotspot_min_choices", "qti"."declared_hottext_max_choices", "qti"."declared_hottext_min_choices", "qti"."declared_hottext_show_hide", "qti"."declared_include_boundary", "qti"."declared_include_lower_bound", "qti"."declared_include_upper_bound", "qti"."declared_inline_choice_fixed", "qti"."declared_inline_choice_min_choices", "qti"."declared_inline_choice_required", "qti"."declared_inline_choice_show_hide", "qti"."declared_inline_choice_shuffle", "qti"."declared_item_ref_fixed", "qti"."declared_item_ref_required", "qti"."declared_map_entry_case_sensitive", "qti"."declared_mapping_default_value", "qti"."declared_match_max_associations", "qti"."declared_match_min_associations", "qti"."declared_match_shuffle", "qti"."declared_math_variable", "qti"."declared_max_choices", "qti"."declared_media_loop", "qti"."declared_min_choices", "qti"."declared_order_shuffle", "qti"."declared_ordering_shuffle", "qti"."declared_orientation", "qti"."declared_param_variable", "qti"."declared_position_object_max_choices", "qti"."declared_printed_variable_base", "qti"."declared_printed_variable_delimiter", "qti"."declared_printed_variable_mapping_indicator", "qti"."declared_printed_variable_power_form", "qti"."declared_ref", "qti"."declared_rounding_mode", "qti"."declared_rubric_template_block_show_hide", "qti"."declared_rubric_template_inline_show_hide", "qti"."declared_section_fixed", "qti"."declared_section_keep_together", "qti"."declared_section_required", "qti"."declared_select_point_max_choices", "qti"."declared_select_point_min_choices", "qti"."declared_show_feedback", "qti"."declared_show_hide", "qti"."declared_show_solution", "qti"."declared_shuffle", "qti"."declared_slider_step_label", "qti"."declared_substring", "qti"."declared_template_block_show_hide", "qti"."declared_template_feedback_block_show_hide", "qti"."declared_template_inline_show_hide", "qti"."declared_text_entry_base", "qti"."declared_tolerance_mode", "qti"."declared_track_kind", "qti"."declared_validate_responses", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."declared_valuetype", "qti"."declared_with_replacement", "qti"."default", "qti"."default_value_arm", "qti"."delete", "qti"."dependency", "qti"."details", "qti"."details_open", "qti"."dfn", "qti"."div", "qti"."divide", "qti"."dl", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_lang", "qti"."document_title", "qti"."drawing_interaction", "qti"."drd_access_mode", "qti"."drd_access_mode_adapted", "qti"."drd_adaptation_detail", "qti"."drd_adaptation_media_type", "qti"."drd_adaptation_type", "qti"."drd_api_interoperable", "qti"."drd_at_interoperable", "qti"."drd_control_flexibility", "qti"."drd_display_transformability", "qti"."drd_educational_complexity_of_adaptation", "qti"."drd_educational_level_of_adaptation", "qti"."drd_has_adaptation", "qti"."drd_hazard", "qti"."drd_is_adaptation_of", "qti"."drd_is_full_adaptation_of", "qti"."drd_is_partial_adaptation_of", "qti"."drd_language_of_adaptation", "qti"."dt", "qti"."duration_gte", "qti"."duration_lt", "qti"."edge", "qti"."em", "qti"."end_attempt_count_attempt", "qti"."end_attempt_interaction", "qti"."entity_reference", "qti"."equal", "qti"."equal_rounded", "qti"."equal_rounded_figures_ref", "qti"."equal_tolerance", "qti"."exit_response", "qti"."exit_template", "qti"."exit_test", "qti"."expression", "qti"."expression_exclude_category", "qti"."expression_include_category", "qti"."expression_max", "qti"."expression_section_identifier", "qti"."expression_weight_identifier", "qti"."extended_text_expected_length", "qti"."extended_text_expected_lines", "qti"."extended_text_interaction", "qti"."extended_text_max_strings", "qti"."extended_text_pattern_mask", "qti"."extended_text_patternmask_message", "qti"."extended_text_placeholder_text", "qti"."external_lom", "qti"."fallback", "qti"."feedback_block", "qti"."feedback_inline", "qti"."feedback_outcome_ref", "qti"."field_value", "qti"."figcaption", "qti"."figure", "qti"."file", "qti"."file_content", "qti"."file_lom", "qti"."file_metadata", "qti"."footer", "qti"."gap", "qti"."gap_img", "qti"."gap_img_left", "qti"."gap_img_match_min", "qti"."gap_img_object_label", "qti"."gap_img_top", "qti"."gap_match_binding", "qti"."gap_match_choices_container_width", "qti"."gap_match_interaction", "qti"."gap_match_max_selections_message", "qti"."gap_match_min_associations", "qti"."gap_match_min_selections_message", "qti"."gap_text", "qti"."gap_text_match_min", "qti"."gcd", "qti"."graphic_associate_interaction", "qti"."graphic_associate_min_associations", "qti"."graphic_gap_match_choices_container_width", "qti"."graphic_gap_match_interaction", "qti"."graphic_gap_match_max_selections_message", "qti"."graphic_gap_match_min_associations", "qti"."graphic_gap_match_min_selections_message", "qti"."graphic_order_interaction", "qti"."graphic_order_max_choices_n", "qti"."graphic_order_min_choices_n", "qti"."gt", "qti"."gte", "qti"."h_1", "qti"."h_2", "qti"."h_3", "qti"."h_4", "qti"."h_5", "qti"."h_6", "qti"."header", "qti"."headers_target", "qti"."hotspot_choice", "qti"."hotspot_choice_label", "qti"."hotspot_interaction", "qti"."hotspot_max_selections_message", "qti"."hotspot_min_selections_message", "qti"."hottext", "qti"."hottext_interaction", "qti"."hottext_max_selections_message", "qti"."hottext_min_selections_message", "qti"."hottext_owner", "qti"."hr", "qti"."html_id", "qti"."i", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."index", "qti"."index_n_ref", "qti"."inline_choice", "qti"."inline_choice_interaction", "qti"."inline_choice_min_selections_message", "qti"."inline_choice_prompt", "qti"."inside", "qti"."integer_divide", "qti"."integer_modulus", "qti"."integer_to_float", "qti"."interaction_binding", "qti"."interpolation_table", "qti"."interpolation_table_default_value", "qti"."interpolation_table_default_value_boolean", "qti"."interpolation_table_default_value_directed_pair", "qti"."interpolation_table_default_value_duration", "qti"."interpolation_table_default_value_file", "qti"."interpolation_table_default_value_float", "qti"."interpolation_table_default_value_identifier", "qti"."interpolation_table_default_value_integer", "qti"."interpolation_table_default_value_pair", "qti"."interpolation_table_default_value_point", "qti"."interpolation_table_default_value_string", "qti"."interpolation_table_default_value_uri", "qti"."interpolation_table_entry", "qti"."interpolation_table_entry_boolean", "qti"."interpolation_table_entry_directed_pair", "qti"."interpolation_table_entry_duration", "qti"."interpolation_table_entry_file", "qti"."interpolation_table_entry_float", "qti"."interpolation_table_entry_identifier", "qti"."interpolation_table_entry_integer", "qti"."interpolation_table_entry_pair", "qti"."interpolation_table_entry_point", "qti"."interpolation_table_entry_string", "qti"."interpolation_table_entry_uri", "qti"."is_null", "qti"."item_body", "qti"."item_body_id", "qti"."item_instance_spelling", "qti"."item_instance_variable_ref", "qti"."item_ref", "qti"."item_ref_category", "qti"."item_ref_document", "qti"."item_ref_lti", "qti"."item_ref_resolution", "qti"."item_session_control", "qti"."item_session_max_attempts", "qti"."item_stimulus_ref", "qti"."item_stimulus_ref_title", "qti"."item_tool", "qti"."item_tool_both", "qti"."item_tool_name", "qti"."item_tool_version", "qti"."item_variable_ref", "qti"."kbd", "qti"."label", "qti"."lcm", "qti"."li", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_annotation", "qti"."lom_classification", "qti"."lom_context", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_difficulty", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_educational", "qti"."lom_entity", "qti"."lom_entry_lang_string", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_id", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_intended_end_user_role", "qti"."lom_interactivity_level", "qti"."lom_interactivity_type", "qti"."lom_keyword", "qti"."lom_kind", "qti"."lom_language", "qti"."lom_learning_resource_type", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_purpose", "qti"."lom_relation", "qti"."lom_requirement", "qti"."lom_resource", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_semantic_density", "qti"."lom_size", "qti"."lom_source", "qti"."lom_source_lang_string", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_taxon", "qti"."lom_taxon_path", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_typical_age_range", "qti"."lom_typical_learning_time", "qti"."lom_value", "qti"."lom_version", "qti"."lookup_outcome_value", "qti"."lt", "qti"."lte", "qti"."manifest", "qti"."manifest_id", "qti"."manifest_id_of_manifest", "qti"."manifest_id_of_resource", "qti"."manifest_id_of_variant", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."map_entry", "qti"."map_entry_boolean", "qti"."map_entry_directed_pair", "qti"."map_entry_duration", "qti"."map_entry_file", "qti"."map_entry_float", "qti"."map_entry_identifier", "qti"."map_entry_integer", "qti"."map_entry_pair", "qti"."map_entry_point", "qti"."map_entry_string", "qti"."map_entry_uri", "qti"."map_response", "qti"."map_response_point", "qti"."mappable_base_type", "qti"."mapping", "qti"."mapping_lower_bound", "qti"."mapping_upper_bound", "qti"."match", "qti"."match_first_column_header", "qti"."match_group", "qti"."match_interaction", "qti"."match_max_selections_message", "qti"."match_min_selections_message", "qti"."match_table", "qti"."match_table_default_value", "qti"."match_table_default_value_boolean", "qti"."match_table_default_value_directed_pair", "qti"."match_table_default_value_duration", "qti"."match_table_default_value_file", "qti"."match_table_default_value_float", "qti"."match_table_default_value_identifier", "qti"."match_table_default_value_integer", "qti"."match_table_default_value_pair", "qti"."match_table_default_value_point", "qti"."match_table_default_value_string", "qti"."match_table_default_value_uri", "qti"."match_table_entry", "qti"."match_table_entry_boolean", "qti"."match_table_entry_directed_pair", "qti"."match_table_entry_duration", "qti"."match_table_entry_file", "qti"."match_table_entry_float", "qti"."match_table_entry_identifier", "qti"."match_table_entry_integer", "qti"."match_table_entry_pair", "qti"."match_table_entry_point", "qti"."match_table_entry_string", "qti"."match_table_entry_uri", "qti"."math_constant", "qti"."math_operator", "qti"."max", "qti"."media_coords", "qti"."media_interaction", "qti"."media_max_plays", "qti"."media_min_plays", "qti"."member", "qti"."metadata_ref", "qti"."min", "qti"."modal_feedback", "qti"."modal_feedback_title", "qti"."multiple", "qti"."namespace_declaration", "qti"."nav", "qti"."node", "qti"."node_catalog_idref", "qti"."node_class", "qti"."node_dir", "qti"."node_label", "qti"."node_lang", "qti"."node_suppress_tts", "qti"."node_xml_base", "qti"."node_xml_lang", "qti"."not", "qti"."null", "qti"."number_correct", "qti"."number_incorrect", "qti"."number_presented", "qti"."number_responded", "qti"."number_selected", "qti"."object", "qti"."object_height", "qti"."object_width", "qti"."ol", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."operator_arity_unbounded", "qti"."or", "qti"."order_choices_container_width", "qti"."order_interaction", "qti"."order_max_choices_n", "qti"."order_max_selections_message", "qti"."order_min_choices_n", "qti"."order_min_selections_message", "qti"."order_orientation", "qti"."ordered", "qti"."ordering", "qti"."ordinary_statistic_arm", "qti"."organizations", "qti"."outcome_condition_arm", "qti"."outcome_declaration_arm", "qti"."outcome_document", "qti"."outcome_else_arm", "qti"."outcome_else_if_arm", "qti"."outcome_if_arm", "qti"."outcome_maximum_arm", "qti"."outcome_min_max", "qti"."outcome_minimum_arm", "qti"."outcome_processing", "qti"."outcome_processing_fragment", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."param", "qti"."param_type", "qti"."pattern_match", "qti"."pi", "qti"."picture", "qti"."position_object_center_point", "qti"."position_object_interaction", "qti"."position_object_min_choices", "qti"."position_object_stage", "qti"."power", "qti"."pre", "qti"."pre_condition", "qti"."prefixed_built_in", "qti"."prefixed_declared", "qti"."prefixed_mapped", "qti"."prefixed_variable_source", "qti"."printed_variable", "qti"."printed_variable_field", "qti"."printed_variable_format", "qti"."printed_variable_id", "qti"."printed_variable_index", "qti"."printed_variable_ref", "qti"."printed_variable_var_ref", "qti"."product", "qti"."prompt", "qti"."q", "qti"."q_cite", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_label", "qti"."qti_metadata", "qti"."qti_metadata_in_external_lom", "qti"."qti_metadata_in_metadata", "qti"."qti_metadata_in_resource_lom", "qti"."random", "qti"."random_float", "qti"."random_float_min", "qti"."random_integer", "qti"."random_integer_min", "qti"."random_integer_step", "qti"."rb", "qti"."record_binding", "qti"."record_binding_fit", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."repeat", "qti"."repeat_number_repeats_ref", "qti"."required_child", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_general", "qti"."resource_lom_identified", "qti"."resource_lom_language_set", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_condition_arm", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_else_arm", "qti"."response_else_if_arm", "qti"."response_if_arm", "qti"."response_processing", "qti"."response_processing_fragment", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."round", "qti"."round_to", "qti"."round_to_figures_ref", "qti"."rp", "qti"."rt", "qti"."rtc", "qti"."rubric_block", "qti"."rubric_template_block", "qti"."rubric_template_inline", "qti"."ruby", "qti"."rule_operand", "qti"."samp", "qti"."schema_location", "qti"."section", "qti"."section_duration_ref", "qti"."section_duration_target", "qti"."section_feedback_outcome_ref", "qti"."section_identifier_target", "qti"."section_printed_variable_ref", "qti"."section_printed_variable_var_ref", "qti"."section_ref", "qti"."section_ref_resolution", "qti"."section_variable_declared", "qti"."section_variable_duration", "qti"."section_variable_prefixed", "qti"."section_variable_ref", "qti"."section_variable_resolution", "qti"."select_point_interaction", "qti"."selection", "qti"."selection_bounded", "qti"."set_correct_response", "qti"."set_default_value", "qti"."set_outcome_value", "qti"."set_template_value", "qti"."simple_associable_choice", "qti"."simple_associable_choice_fixed", "qti"."simple_associable_choice_match_min", "qti"."simple_associable_choice_match_set", "qti"."simple_associable_choice_show_hide", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."simple_match_set", "qti"."slider_interaction", "qti"."slider_orientation", "qti"."slider_reverse", "qti"."slider_step", "qti"."small", "qti"."source", "qti"."source_media", "qti"."source_sizes", "qti"."source_srcset", "qti"."source_type", "qti"."span", "qti"."standard_template_reference", "qti"."statistic", "qti"."statistic_case_count", "qti"."statistic_glossary", "qti"."statistic_last_updated", "qti"."statistic_std_deviation", "qti"."statistic_std_error", "qti"."stats_operator", "qti"."stimulus_body", "qti"."stimulus_ref_resolution", "qti"."string_binding", "qti"."string_match", "qti"."strong", "qti"."structure_child", "qti"."stylesheet", "qti"."stylesheet_media", "qti"."stylesheet_title", "qti"."sub", "qti"."substring", "qti"."subtract", "qti"."sum", "qti"."summary", "qti"."sup", "qti"."table", "qti"."table_summary", "qti"."target_object", "qti"."target_object_object_type", "qti"."target_object_part_identifier", "qti"."tbody", "qti"."td", "qti"."td_abbr", "qti"."td_align", "qti"."td_axis", "qti"."td_colspan", "qti"."td_rowspan", "qti"."td_scope", "qti"."td_valign", "qti"."template", "qti"."template_block", "qti"."template_condition_arm", "qti"."template_constraint", "qti"."template_content_ref", "qti"."template_declaration_arm", "qti"."template_default", "qti"."template_else_arm", "qti"."template_else_if_arm", "qti"."template_feedback_block", "qti"."template_if_arm", "qti"."template_inline", "qti"."template_parameter_ref", "qti"."template_processing", "qti"."test_document", "qti"."test_feedback", "qti"."test_feedback_content_body", "qti"."test_feedback_title", "qti"."test_identifier", "qti"."test_part", "qti"."test_part_title", "qti"."test_reach", "qti"."test_rubric_block", "qti"."test_rubric_block_use", "qti"."test_rubric_content_body", "qti"."test_variables", "qti"."test_variables_base_type", "qti"."tests_hold", "qti"."text_entry_expected_length", "qti"."text_entry_format", "qti"."text_entry_interaction", "qti"."text_entry_pattern_mask", "qti"."text_entry_patternmask_message", "qti"."text_entry_placeholder_text", "qti"."text_node", "qti"."tfoot", "qti"."th", "qti"."th_abbr", "qti"."th_align", "qti"."th_axis", "qti"."th_colspan", "qti"."th_rowspan", "qti"."th_scope", "qti"."th_valign", "qti"."thead", "qti"."time_limit_max", "qti"."time_limit_min", "qti"."time_limits", "qti"."tr", "qti"."track", "qti"."track_default", "qti"."track_srclang", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."truncate", "qti"."tt", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."ul", "qti"."upload_interaction", "qti"."upload_type", "qti"."usage_data", "qti"."usage_data_glossary", "qti"."usage_data_ref", "qti"."usage_map_entry", "qti"."usage_map_entry_case_sensitive", "qti"."usage_mapping", "qti"."usage_mapping_lower_bound", "qti"."usage_mapping_upper_bound", "qti"."usage_typed_value", "qti"."usage_typed_value_boolean", "qti"."usage_typed_value_directed_pair", "qti"."usage_typed_value_duration", "qti"."usage_typed_value_file", "qti"."usage_typed_value_float", "qti"."usage_typed_value_identifier", "qti"."usage_typed_value_integer", "qti"."usage_typed_value_pair", "qti"."usage_typed_value_point", "qti"."usage_typed_value_string", "qti"."usage_typed_value_uri", "qti"."usage_value", "qti"."usage_value_base_type", "qti"."usage_value_field_identifier", "qti"."value_set", "qti"."value_set_interpretation", "qti"."var", "qti"."variable", "qti"."variable_mapping", "qti"."variable_ref", "qti"."variable_weight_identifier", "qti"."variant", "qti"."variant_metadata", "qti"."video", "qti"."video_autoplay", "qti"."video_controls", "qti"."video_crossorigin", "qti"."video_height", "qti"."video_loop", "qti"."video_mediagroup", "qti"."video_muted", "qti"."video_poster", "qti"."video_preload", "qti"."video_src", "qti"."video_width", "qti"."weight", "qti"."ws", "qti"."x_include", "qti"."x_include_accept", "qti"."x_include_accept_language", "qti"."x_include_encoding", "qti"."x_include_href", "qti"."x_include_parse", "qti"."x_include_xpointer", "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."access_for_all_resource", "qti__author"."acronym", "qti__author"."adaptive_engine_ref", "qti__author"."adaptive_selection", "qti__author"."adaptive_settings_ref", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."and", "qti__author"."any_n", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."assessment_section", "qti__author"."assessment_stimulus", "qti__author"."assessment_test", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_file_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."attribute_spelling", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."branch_rule", "qti__author"."branch_rule_exit", "qti__author"."branch_rule_target", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."categorized_statistic_arm", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."container_size", "qti__author"."contains", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct", "qti__author"."correct_response_arm", "qti__author"."csm_case_item_uri", "qti__author"."csm_guid", "qti__author"."csm_label", "qti__author"."csm_labelled_guid", "qti__author"."csm_metadata", "qti__author"."csm_metadata_provider_id", "qti__author"."csm_set", "qti__author"."csm_set_of_guids", "qti__author"."csm_set_of_guids_region", "qti__author"."csm_set_of_guids_version", "qti__author"."csm_set_resource_label", "qti__author"."csm_set_resource_part_id", "qti__author"."custom_operator", "qti__author"."custom_operator_class", "qti__author"."custom_operator_definition", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_allow_comment", "qti__author"."declared_allow_late_submission", "qti__author"."declared_allow_review", "qti__author"."declared_allow_skipping", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_default_value", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_include_lower_bound", "qti__author"."declared_include_upper_bound", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_item_ref_fixed", "qti__author"."declared_item_ref_required", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_order_shuffle", "qti__author"."declared_ordering_shuffle", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_rounding_mode", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_section_fixed", "qti__author"."declared_section_keep_together", "qti__author"."declared_section_required", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_feedback", "qti__author"."declared_show_hide", "qti__author"."declared_show_solution", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_substring", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_tolerance_mode", "qti__author"."declared_track_kind", "qti__author"."declared_validate_responses", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."declared_with_replacement", "qti__author"."default", "qti__author"."default_value_arm", "qti__author"."delete", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."divide", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."drd_access_mode", "qti__author"."drd_access_mode_adapted", "qti__author"."drd_adaptation_detail", "qti__author"."drd_adaptation_media_type", "qti__author"."drd_adaptation_type", "qti__author"."drd_api_interoperable", "qti__author"."drd_at_interoperable", "qti__author"."drd_control_flexibility", "qti__author"."drd_display_transformability", "qti__author"."drd_educational_complexity_of_adaptation", "qti__author"."drd_educational_level_of_adaptation", "qti__author"."drd_has_adaptation", "qti__author"."drd_hazard", "qti__author"."drd_is_adaptation_of", "qti__author"."drd_is_full_adaptation_of", "qti__author"."drd_is_partial_adaptation_of", "qti__author"."drd_language_of_adaptation", "qti__author"."dt", "qti__author"."duration_gte", "qti__author"."duration_lt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."equal", "qti__author"."equal_rounded", "qti__author"."equal_rounded_figures_ref", "qti__author"."equal_tolerance", "qti__author"."exit_response", "qti__author"."exit_template", "qti__author"."exit_test", "qti__author"."expression", "qti__author"."expression_exclude_category", "qti__author"."expression_include_category", "qti__author"."expression_max", "qti__author"."expression_section_identifier", "qti__author"."expression_weight_identifier", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."external_lom", "qti__author"."fallback", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."field_value", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."file_lom", "qti__author"."file_metadata", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."gcd", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices_n", "qti__author"."gt", "qti__author"."gte", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."index", "qti__author"."index_n_ref", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."inside", "qti__author"."integer_divide", "qti__author"."integer_modulus", "qti__author"."integer_to_float", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."is_null", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_instance_spelling", "qti__author"."item_instance_variable_ref", "qti__author"."item_ref", "qti__author"."item_ref_category", "qti__author"."item_ref_document", "qti__author"."item_ref_lti", "qti__author"."item_ref_resolution", "qti__author"."item_session_control", "qti__author"."item_session_max_attempts", "qti__author"."item_stimulus_ref", "qti__author"."item_stimulus_ref_title", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."item_variable_ref", "qti__author"."kbd", "qti__author"."label", "qti__author"."lcm", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_annotation", "qti__author"."lom_classification", "qti__author"."lom_context", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_difficulty", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_educational", "qti__author"."lom_entity", "qti__author"."lom_entry_lang_string", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_id", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_intended_end_user_role", "qti__author"."lom_interactivity_level", "qti__author"."lom_interactivity_type", "qti__author"."lom_keyword", "qti__author"."lom_kind", "qti__author"."lom_language", "qti__author"."lom_learning_resource_type", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_purpose", "qti__author"."lom_relation", "qti__author"."lom_requirement", "qti__author"."lom_resource", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_semantic_density", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_source_lang_string", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_taxon", "qti__author"."lom_taxon_path", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_typical_age_range", "qti__author"."lom_typical_learning_time", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."lookup_outcome_value", "qti__author"."lt", "qti__author"."lte", "qti__author"."manifest", "qti__author"."manifest_id", "qti__author"."manifest_id_of_manifest", "qti__author"."manifest_id_of_resource", "qti__author"."manifest_id_of_variant", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."map_response", "qti__author"."map_response_point", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_selections_message", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."math_constant", "qti__author"."math_operator", "qti__author"."max", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."member", "qti__author"."metadata_ref", "qti__author"."min", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."multiple", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."not", "qti__author"."null", "qti__author"."number_correct", "qti__author"."number_incorrect", "qti__author"."number_presented", "qti__author"."number_responded", "qti__author"."number_selected", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."operator_arity_unbounded", "qti__author"."or", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."ordered", "qti__author"."ordering", "qti__author"."ordinary_statistic_arm", "qti__author"."organizations", "qti__author"."outcome_condition_arm", "qti__author"."outcome_declaration_arm", "qti__author"."outcome_document", "qti__author"."outcome_else_arm", "qti__author"."outcome_else_if_arm", "qti__author"."outcome_if_arm", "qti__author"."outcome_maximum_arm", "qti__author"."outcome_min_max", "qti__author"."outcome_minimum_arm", "qti__author"."outcome_processing", "qti__author"."outcome_processing_fragment", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pattern_match", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."power", "qti__author"."pre", "qti__author"."pre_condition", "qti__author"."prefixed_built_in", "qti__author"."prefixed_declared", "qti__author"."prefixed_mapped", "qti__author"."prefixed_variable_source", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."product", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."qti_metadata_in_external_lom", "qti__author"."qti_metadata_in_metadata", "qti__author"."qti_metadata_in_resource_lom", "qti__author"."random", "qti__author"."random_float", "qti__author"."random_float_min", "qti__author"."random_integer", "qti__author"."random_integer_min", "qti__author"."random_integer_step", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."repeat", "qti__author"."repeat_number_repeats_ref", "qti__author"."required_child", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_condition_arm", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_else_arm", "qti__author"."response_else_if_arm", "qti__author"."response_if_arm", "qti__author"."response_processing", "qti__author"."response_processing_fragment", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."round", "qti__author"."round_to", "qti__author"."round_to_figures_ref", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."rule_operand", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."section_duration_ref", "qti__author"."section_duration_target", "qti__author"."section_feedback_outcome_ref", "qti__author"."section_identifier_target", "qti__author"."section_printed_variable_ref", "qti__author"."section_printed_variable_var_ref", "qti__author"."section_ref", "qti__author"."section_ref_resolution", "qti__author"."section_variable_declared", "qti__author"."section_variable_duration", "qti__author"."section_variable_prefixed", "qti__author"."section_variable_ref", "qti__author"."section_variable_resolution", "qti__author"."select_point_interaction", "qti__author"."selection", "qti__author"."selection_bounded", "qti__author"."set_correct_response", "qti__author"."set_default_value", "qti__author"."set_outcome_value", "qti__author"."set_template_value", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."statistic", "qti__author"."statistic_case_count", "qti__author"."statistic_glossary", "qti__author"."statistic_last_updated", "qti__author"."statistic_std_deviation", "qti__author"."statistic_std_error", "qti__author"."stats_operator", "qti__author"."stimulus_body", "qti__author"."stimulus_ref_resolution", "qti__author"."string_binding", "qti__author"."string_match", "qti__author"."strong", "qti__author"."structure_child", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."substring", "qti__author"."subtract", "qti__author"."sum", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."target_object", "qti__author"."target_object_object_type", "qti__author"."target_object_part_identifier", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_condition_arm", "qti__author"."template_constraint", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_default", "qti__author"."template_else_arm", "qti__author"."template_else_if_arm", "qti__author"."template_feedback_block", "qti__author"."template_if_arm", "qti__author"."template_inline", "qti__author"."template_parameter_ref", "qti__author"."template_processing", "qti__author"."test_document", "qti__author"."test_feedback", "qti__author"."test_feedback_content_body", "qti__author"."test_feedback_title", "qti__author"."test_identifier", "qti__author"."test_part", "qti__author"."test_part_title", "qti__author"."test_reach", "qti__author"."test_rubric_block", "qti__author"."test_rubric_block_use", "qti__author"."test_rubric_content_body", "qti__author"."test_variables", "qti__author"."test_variables_base_type", "qti__author"."tests_hold", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."time_limit_max", "qti__author"."time_limit_min", "qti__author"."time_limits", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."truncate", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."usage_data", "qti__author"."usage_data_glossary", "qti__author"."usage_data_ref", "qti__author"."usage_map_entry", "qti__author"."usage_map_entry_case_sensitive", "qti__author"."usage_mapping", "qti__author"."usage_mapping_lower_bound", "qti__author"."usage_mapping_upper_bound", "qti__author"."usage_typed_value", "qti__author"."usage_typed_value_boolean", "qti__author"."usage_typed_value_directed_pair", "qti__author"."usage_typed_value_duration", "qti__author"."usage_typed_value_file", "qti__author"."usage_typed_value_float", "qti__author"."usage_typed_value_identifier", "qti__author"."usage_typed_value_integer", "qti__author"."usage_typed_value_pair", "qti__author"."usage_typed_value_point", "qti__author"."usage_typed_value_string", "qti__author"."usage_typed_value_uri", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."usage_value_field_identifier", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_weight_identifier", "qti__author"."variant", "qti__author"."variant_metadata", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."weight", "qti__author"."ws", "qti__author"."x_include", "qti__author"."x_include_accept", "qti__author"."x_include_accept_language", "qti__author"."x_include_encoding", "qti__author"."x_include_href", "qti__author"."x_include_parse", "qti__author"."x_include_xpointer" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."ancestry", "qti"."aria_autocomplete_value", "qti"."aria_current_value", "qti"."aria_invalid_value", "qti"."aria_live_value", "qti"."aria_orientation_value", "qti"."aria_role_value", "qti"."aria_sort_value", "qti"."aria_tristate", "qti"."aria_true_false_undefined", "qti"."arity_bound", "qti"."attribute_name", "qti"."base_type", "qti"."boolean_literal", "qti"."bound", "qti"."branch_exit", "qti"."branch_target", "qti"."built_in", "qti"."cell_align", "qti"."cell_scope", "qti"."cell_valign", "qti"."cp_schema", "qti"."cross_origin", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."external_scored", "qti"."id_holder", "qti"."idref_attribute", "qti"."item_ref_target", "qti"."lom_owner", "qti"."manifest_id_holder", "qti"."math_constant_name", "qti"."math_operator_name", "qti"."media_autoplay", "qti"."media_controls", "qti"."media_loop", "qti"."media_muted", "qti"."media_preload", "qti"."misc_kind", "qti"."navigation_mode", "qti"."node_kind", "qti"."orientation", "qti"."param_valuetype", "qti"."placement", "qti"."prefixed_source", "qti"."printed_variable_attr", "qti"."qmd_feedback_type_value", "qti"."qmd_interaction_type_value", "qti"."qmd_scoring_mode_value", "qti"."qti_metadata_host", "qti"."ref_kind", "qti"."ref_or_literal", "qti"."root_kind", "qti"."rounding_mode", "qti"."schema_version", "qti"."section_variable_target", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."statistic_kind", "qti"."stats_operator_name", "qti"."structure_holder", "qti"."submission_mode", "qti"."suppress_tts_mode", "qti"."target_object_type", "qti"."test_feedback_access", "qti"."text_direction", "qti"."text_format", "qti"."tolerance_mode", "qti"."tool_shape", "qti"."track_default_value", "qti"."track_kind", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."x_include_parse_value", "qti"."xs_boolean", "qti"."yes_no" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_tmjud3n2tg", "qti"."__text_saolosnhkp", "qti"."__text_fgbxwprcwx", "qti"."__text_rhdrzkabze", "qti"."__text_raisrajgpi", "qti"."__text_kqeswaav46", "qti"."__text_hv3bw3mdte", "qti"."__text_bvx3fqniye", "qti"."__text_gm4clqaaza", "qti"."__text_acxfo763jg", "qti"."__text_5lyuoloiou", "qti"."__text_tyjqwtj7ky", "qti"."__text_o3e7dedzyv", "qti"."__text_2dix7luqoi", "qti"."__text_sa4c4ywp5v", "qti"."__text_2rz6hgcvt2", "qti"."__text_4adkkv4wal", "qti"."__text_xarz6cej2e", "qti"."__text_lsy6pxooea", "qti"."__text_d46tbgbbco", "qti"."__text_3zzmpysrx3", "qti"."__text_ukaaxf45sk", "qti"."__text_vtz3bnghkc", "qti"."__text_xs56r6cx4y", "qti"."__text_tso7kvy6dv", "qti"."__text_7mulu52tr6", "qti"."__text_osqmo2ktsg", "qti"."__text_ieskz75v7g", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_awt4t5kosa", "qti"."__text_wuvwyowttn", "qti"."__text_kcydnvglpj", "qti"."__text_gjl5q4ofup", "qti"."__text_tq7gq2jmkl", "qti"."__text_hmmood6ekl", "qti"."__text_wyfa622e2r", "qti"."__text_r5xluaej3z", "qti"."__text_oy4m3tqgfd", "qti"."__text_ottycep7en", "qti"."access_mode", "qti"."access_mode_adapted", "qti"."adaptive_ref_href", "qti"."adaptive_ref_identifier", "qti"."aria_integer", "qti"."aria_positive_integer", "qti"."case_item_uri", "qti"."category_list", "qti"."choice_count", "qti"."choice_identifier", "qti"."citation_uri", "qti"."class_list", "qti"."container_width", "qti"."content_language", "qti"."content_media_type", "qti"."custom_operator_class_name", "qti"."custom_operator_definition_uri", "qti"."declared_directed_pair_value", "qti"."declared_duration_value", "qti"."declared_float_value", "qti"."declared_identifier_value", "qti"."declared_integer_value", "qti"."declared_pair_value", "qti"."declared_point_value", "qti"."declared_uri_value", "qti"."drd_adaptation_uri", "qti"."embed_source_uri", "qti"."expected_length", "qti"."expected_lines", "qti"."expression_coords", "qti"."expression_integer_or_variable", "qti"."file_media_type", "qti"."glossary_uri", "qti"."hyperlink_uri", "qti"."id_reference", "qti"."interpolation_default_directed_pair_value", "qti"."interpolation_default_duration_value", "qti"."interpolation_default_float_value", "qti"."interpolation_default_identifier_value", "qti"."interpolation_default_integer_value", "qti"."interpolation_default_pair_value", "qti"."interpolation_default_point_value", "qti"."interpolation_default_uri_value", "qti"."interpolation_source_value", "qti"."interpolation_target_directed_pair_value", "qti"."interpolation_target_duration_value", "qti"."interpolation_target_float_value", "qti"."interpolation_target_identifier_value", "qti"."interpolation_target_integer_value", "qti"."interpolation_target_pair_value", "qti"."interpolation_target_point_value", "qti"."interpolation_target_uri_value", "qti"."item_ref_href", "qti"."lang_string_language", "qti"."literal_directed_pair_value", "qti"."literal_duration_value", "qti"."literal_float_value", "qti"."literal_identifier_value", "qti"."literal_integer_value", "qti"."literal_pair_value", "qti"."literal_point_value", "qti"."literal_uri_value", "qti"."lom_token", "qti"."lom_vocabulary_source", "qti"."lom_vocabulary_value", "qti"."long_description_uri", "qti"."long_interpretation_uri", "qti"."manifest_identifier", "qti"."map_key_directed_pair_value", "qti"."map_key_duration_value", "qti"."map_key_float_value", "qti"."map_key_identifier_value", "qti"."map_key_integer_value", "qti"."map_key_pair_value", "qti"."map_key_point_value", "qti"."map_key_uri_value", "qti"."mapped_variable_name", "qti"."mapping_score", "qti"."match_default_directed_pair_value", "qti"."match_default_duration_value", "qti"."match_default_float_value", "qti"."match_default_identifier_value", "qti"."match_default_integer_value", "qti"."match_default_pair_value", "qti"."match_default_point_value", "qti"."match_default_uri_value", "qti"."match_group_list", "qti"."match_source_value", "qti"."match_target_directed_pair_value", "qti"."match_target_duration_value", "qti"."match_target_float_value", "qti"."match_target_identifier_value", "qti"."match_target_integer_value", "qti"."match_target_pair_value", "qti"."match_target_point_value", "qti"."match_target_uri_value", "qti"."media_rect_coords", "qti"."namespace_prefix", "qti"."namespace_uri", "qti"."outcome_scale_value", "qti"."package_path", "qti"."pi_target", "qti"."printed_variable_integer_or_variable", "qti"."record_field_identifier", "qti"."rect_coords", "qti"."resource_entry_href", "qti"."section_ref_href", "qti"."section_reference", "qti"."shape_coords", "qti"."show_hide_identifier", "qti"."slider_bound", "qti"."statistic_context_uri", "qti"."statistic_measure", "qti"."statistic_name", "qti"."stimulus_ref_href", "qti"."stimulus_ref_identifier", "qti"."string_count", "qti"."stylesheet_uri", "qti"."table_span", "qti"."template_location_uri", "qti"."template_parameter_name", "qti"."template_uri", "qti"."test_structure_identifier", "qti"."time_limit_seconds", "qti"."tool_name", "qti"."tool_vendor", "qti"."tool_version", "qti"."track_language", "qti"."usage_case_count", "qti"."usage_directed_pair_value", "qti"."usage_duration_value", "qti"."usage_field_identifier", "qti"."usage_float_value", "qti"."usage_identifier_value", "qti"."usage_integer_value", "qti"."usage_mapping_score", "qti"."usage_pair_value", "qti"."usage_part_identifier", "qti"."usage_point_value", "qti"."usage_uri_value", "qti"."usage_value_token", "qti"."variable_reference", "qti"."weight_reference", "qti"."weight_value", "qti"."x_include_uri", "qti"."xml_base_uri", "qti"."xml_entity_name" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

DROP INDEX "qti"."__assessment_item_label_ix_tree_version_3_0_1_zi234o6hj7";

DROP FUNCTION "qti"."__law_assessment_item_label_version_3_0_1_in_item_jtaz4fhg5w"();

DROP FUNCTION "qti"."__law_assessment_item_label_version_3_0_1_in_item_q5kbqqkswi"();

COMMENT ON FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_w5btnavp2f"() IS 'function of law alternatives of BranchRule.targetKind on BranchRule for INSERT';

COMMENT ON FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_zrlelgzkal"() IS 'function of law alternatives of BranchRule.targetKind on BranchRuleExit for DELETE';

COMMENT ON FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_ek3u5y7odt"() IS 'function of law alternatives of BranchRule.targetKind on BranchRuleTarget for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_xs2wsedckb"() IS 'function of law alternatives of ItemRefResolution.targetKind on ItemRefDocument for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_cbwph6v6jl"() IS 'function of law alternatives of ItemRefResolution.targetKind on ItemRefLti for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_ref_resolution_target_kind_alternatives_6jqcb57r2t"() IS 'function of law alternatives of ItemRefResolution.targetKind on ItemRefResolution for INSERT';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_5pwxhqygbt"() IS 'function of law alternatives of PrefixedVariableSource.source on PrefixedBuiltIn for DELETE';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_gnzdoiib4j"() IS 'function of law alternatives of PrefixedVariableSource.source on PrefixedDeclared for DELETE';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_os34htb5mq"() IS 'function of law alternatives of PrefixedVariableSource.source on PrefixedMapped for DELETE';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_hmh4jvvvxt"() IS 'function of law alternatives of PrefixedVariableSource.source on PrefixedVariableSource for INSERT';

COMMENT ON FUNCTION "qti"."__law_section_variable_resolution_target_elkn5ajqjg"() IS 'function of law alternatives of SectionVariableResolution.target on SectionVariableDeclared for DELETE';

COMMENT ON FUNCTION "qti"."__law_section_variable_resolution_target_2bjklu2dlu"() IS 'function of law alternatives of SectionVariableResolution.target on SectionVariableDuration for DELETE';

COMMENT ON FUNCTION "qti"."__law_section_variable_resolution_target_jkoolfkvim"() IS 'function of law alternatives of SectionVariableResolution.target on SectionVariablePrefixed for DELETE';

COMMENT ON FUNCTION "qti"."__law_section_variable_resolution_target_kf3vmsx4tg"() IS 'function of law alternatives of SectionVariableResolution.target on SectionVariableResolution for INSERT';

COMMENT ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_azxxvv3rvr"() IS 'function of law alternatives of VariableRef.kind on ItemInstanceVariableRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_vq6atunf3c"() IS 'function of law alternatives of VariableRef.kind on ItemVariableRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_o4kmgjzkcg"() IS 'function of law alternatives of VariableRef.kind on SectionDurationRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_aqsuim3inz"() IS 'function of law alternatives of VariableRef.kind on SectionVariableRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_slztlbyb4t"() IS 'function of law alternatives of VariableRef.kind on VariableRef for INSERT';

COMMENT ON FUNCTION "qti"."__law_adaptive_selection_capacity_edge_eupo27bqtx"() IS 'function of law capacity of AdaptiveSelection(id) over Edge(parent) where childKind = qti-adaptive-engine-ref, parentKind = qti-adaptive-selection within 1..1 on AdaptiveSelection for INSERT';

COMMENT ON FUNCTION "qti"."__law_adaptive_selection_capacity_edge_k4alq5wzzb"() IS 'function of law capacity of AdaptiveSelection(id) over Edge(parent) where childKind = qti-adaptive-engine-ref, parentKind = qti-adaptive-selection within 1..1 on Edge for DELETE';

COMMENT ON FUNCTION "qti"."__law_assessment_section_capacity_structure_child_jtmmvp7x2b"() IS 'function of law capacity of AssessmentSection(id) over StructureChild(parent) within 1..* on AssessmentSection for INSERT';

COMMENT ON FUNCTION "qti"."__law_assessment_section_capacity_structure_child_w22jwatiqr"() IS 'function of law capacity of AssessmentSection(id) over StructureChild(parent) within 1..* on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_assessment_stimulus_capacity_edge_tyk5qfwbw3"() IS 'function of law capacity of AssessmentStimulus(id) over Edge(parent) where childKind = qti-stimulus-body, parentKind = qti-assessment-stimulus within 1..1 on AssessmentStimulus for INSERT';

COMMENT ON FUNCTION "qti"."__law_assessment_stimulus_capacity_edge_qpvx72sc5i"() IS 'function of law capacity of AssessmentStimulus(id) over Edge(parent) where childKind = qti-stimulus-body, parentKind = qti-assessment-stimulus within 1..1 on Edge for DELETE';

COMMENT ON FUNCTION "qti"."__law_assessment_test_capacity_edge_salnexcef5"() IS 'function of law capacity of AssessmentTest(id) over Edge(parent) where childKind = qti-test-part, parentKind = qti-assessment-test within 1..* on AssessmentTest for INSERT';

COMMENT ON FUNCTION "qti"."__law_assessment_test_capacity_edge_7sugw2fmy2"() IS 'function of law capacity of AssessmentTest(id) over Edge(parent) where childKind = qti-test-part, parentKind = qti-assessment-test within 1..* on Edge for DELETE';

COMMENT ON FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_test_xmlv_6sf7trivwg"() IS 'function of law capacity of ResourceLomIdentified(lom) where type = "imsqti_test_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on LomObjectIdentifier for DELETE';

COMMENT ON FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_test_xmlv_m73pegt4gn"() IS 'function of law capacity of ResourceLomIdentified(lom) where type = "imsqti_test_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on LomObjectIdentifier for INSERT';

COMMENT ON FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_test_xmlv_2y7q4m5awk"() IS 'function of law capacity of ResourceLomIdentified(lom) where type = "imsqti_test_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on ResourceLomIdentified for INSERT';

COMMENT ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_z4szzkksqs"() IS 'function of law capacity of ResourceLomTitled(lom) where type = "imsqti_test_xmlv3p0" over LomObjectTitle(lom) within 1..1 on LomObjectTitle for DELETE';

COMMENT ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_xwwfjwmxk7"() IS 'function of law capacity of ResourceLomTitled(lom) where type = "imsqti_test_xmlv3p0" over LomObjectTitle(lom) within 1..1 on LomObjectTitle for INSERT';

COMMENT ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_msrdj2utt4"() IS 'function of law capacity of ResourceLomTitled(lom) where type = "imsqti_test_xmlv3p0" over LomObjectTitle(lom) within 1..1 on ResourceLomTitled for INSERT';

COMMENT ON FUNCTION "qti"."__law_selection_capacity_required_child_h2nhzvq4ny"() IS 'function of law capacity of Selection(section) over RequiredChild(parent) within 0..select on RequiredChild for INSERT';

COMMENT ON FUNCTION "qti"."__law_selection_capacity_required_child_y37j4hebkc"() IS 'function of law capacity of Selection(section) over RequiredChild(parent) within 0..select on Selection for INSERT';

COMMENT ON FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_bb2epfvo6t"() IS 'function of law capacity of SelectionBounded(section) over StructureChild(parent) within select..* on SelectionBounded for INSERT';

COMMENT ON FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_h7wmvouzqm"() IS 'function of law capacity of SelectionBounded(section) over StructureChild(parent) within select..* on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_v4w427lsks"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaActivedescendant(node) where kind = qti-stimulus-body within 0..0 on AriaActivedescendant for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_4w2q5wnnte"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaActivedescendant(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_dse7b335y6"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAtomic(node) where kind = qti-stimulus-body within 0..0 on AriaAtomic for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_tqspycno2n"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAtomic(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_daoiilp2xo"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAutocomplete(node) where kind = qti-stimulus-body within 0..0 on AriaAutocomplete for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_7leechv2ne"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAutocomplete(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_busy_n4fxtlzoks"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaBusy(node) where kind = qti-stimulus-body within 0..0 on AriaBusy for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_busy_pyhgsgcd7p"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaBusy(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_nksjgzycgo"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaChecked(node) where kind = qti-stimulus-body within 0..0 on AriaChecked for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_bwjvqmpjgk"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaChecked(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ttfpeovtip"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColcount(node) where kind = qti-stimulus-body within 0..0 on AriaColcount for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_tnimppntw4"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColcount(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_noxsfwp5ew"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColindex(node) where kind = qti-stimulus-body within 0..0 on AriaColindex for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_rrp3ubhqyr"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColindex(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_34h6aai743"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColspan(node) where kind = qti-stimulus-body within 0..0 on AriaColspan for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_xmvx3upbkx"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColspan(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_iii6elvwdz"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaControls(node) where kind = qti-stimulus-body within 0..0 on AriaControls for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_r3wvamou2h"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaControls(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_4muaq2rhtq"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaCurrent(node) where kind = qti-stimulus-body within 0..0 on AriaCurrent for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ahadvmzbt5"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaCurrent(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_5apme4yf2u"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDescribedby(node) where kind = qti-stimulus-body within 0..0 on AriaDescribedby for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ywlkksqcec"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDescribedby(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_npqfpse4hm"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDetails(node) where kind = qti-stimulus-body within 0..0 on AriaDetails for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_qtirwouwky"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDetails(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_usz56utt3w"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDisabled(node) where kind = qti-stimulus-body within 0..0 on AriaDisabled for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_dgaiw2alc6"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDisabled(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_hfmzxrsxjp"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaErrormessage(node) where kind = qti-stimulus-body within 0..0 on AriaErrormessage for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_h3t4vt4djo"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaErrormessage(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_3dylggb2ba"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaExpanded(node) where kind = qti-stimulus-body within 0..0 on AriaExpanded for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_qtdx3h7pgu"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaExpanded(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_4wt67ii4ak"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaFlowto(node) where kind = qti-stimulus-body within 0..0 on AriaFlowto for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_527otdmbdu"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaFlowto(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_n45a4uhgrw"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHaspopup(node) where kind = qti-stimulus-body within 0..0 on AriaHaspopup for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_e3o6suzaem"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHaspopup(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_2yfkufzkpl"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHidden(node) where kind = qti-stimulus-body within 0..0 on AriaHidden for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_xbrj2nrlnb"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHidden(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ngyut3cm3i"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaInvalid(node) where kind = qti-stimulus-body within 0..0 on AriaInvalid for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_imemfzxkqy"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaInvalid(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_wz5ds45wgk"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshortcuts(node) where kind = qti-stimulus-body within 0..0 on AriaKeyshortcuts for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_6bi4fp3slr"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshortcuts(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_74kvc3wjah"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshorts(node) where kind = qti-stimulus-body within 0..0 on AriaKeyshorts for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_4czlgybnex"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshorts(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_z4n6t7s625"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabel(node) where kind = qti-stimulus-body within 0..0 on AriaLabel for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_gegzdqwitp"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabel(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_pvuszqzigf"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabelledby(node) where kind = qti-stimulus-body within 0..0 on AriaLabelledby for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_qiri7r2k6u"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabelledby(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_nnrruiu3hq"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLevel(node) where kind = qti-stimulus-body within 0..0 on AriaLevel for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_disfp7o65h"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLevel(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_live_6yevhlez2k"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLive(node) where kind = qti-stimulus-body within 0..0 on AriaLive for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_live_kyr4l6iqaa"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLive(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_lxj4xa2jil"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaModal(node) where kind = qti-stimulus-body within 0..0 on AriaModal for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_vhh2iedspk"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaModal(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_msnqxxyb33"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiline(node) where kind = qti-stimulus-body within 0..0 on AriaMultiline for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ncxmovjbxl"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiline(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_wxse3a4mow"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiselectable(node) where kind = qti-stimulus-body within 0..0 on AriaMultiselectable for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_vs2q6nlz4h"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiselectable(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_qo26ygsdma"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOrientation(node) where kind = qti-stimulus-body within 0..0 on AriaOrientation for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_haoqlv4ikt"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOrientation(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_owns_gr66ojuszw"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOwns(node) where kind = qti-stimulus-body within 0..0 on AriaOwns for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_owns_oqd5arrtay"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOwns(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_2xwkxzl2em"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPlaceholder(node) where kind = qti-stimulus-body within 0..0 on AriaPlaceholder for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_wukxfx4cpc"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPlaceholder(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_fzendszlsl"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPosinset(node) where kind = qti-stimulus-body within 0..0 on AriaPosinset for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_kt7jsn2hsa"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPosinset(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_2wfoq6ydlq"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPressed(node) where kind = qti-stimulus-body within 0..0 on AriaPressed for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_tem67gox56"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPressed(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_74gtlwqbmz"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaReadonly(node) where kind = qti-stimulus-body within 0..0 on AriaReadonly for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_b37g4rrkc6"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaReadonly(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ivklroaceo"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRelevant(node) where kind = qti-stimulus-body within 0..0 on AriaRelevant for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_wr4md6n5cd"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRelevant(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ajf44d3ev3"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRequired(node) where kind = qti-stimulus-body within 0..0 on AriaRequired for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_6cef2rvea4"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRequired(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_role_mvrvygce6o"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRole(node) where kind = qti-stimulus-body within 0..0 on AriaRole for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_role_rizdaqcsip"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRole(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_xne6kp6q2o"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRoledescription(node) where kind = qti-stimulus-body within 0..0 on AriaRoledescription for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_4zl5hsfacm"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRoledescription(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_lcbztamud5"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowcount(node) where kind = qti-stimulus-body within 0..0 on AriaRowcount for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_fbr5zdufjv"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowcount(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_lijmpy5d4f"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowindex(node) where kind = qti-stimulus-body within 0..0 on AriaRowindex for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_cdleen6xtm"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowindex(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_fkcg6jwpex"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowspan(node) where kind = qti-stimulus-body within 0..0 on AriaRowspan for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_4r7ajtqain"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowspan(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_hezmglkazc"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSelected(node) where kind = qti-stimulus-body within 0..0 on AriaSelected for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_wh7d6oelxe"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSelected(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_jo2kruexbw"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSetsize(node) where kind = qti-stimulus-body within 0..0 on AriaSetsize for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_upbnnzijgk"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSetsize(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_sort_gp4sbutoxp"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSort(node) where kind = qti-stimulus-body within 0..0 on AriaSort for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_sort_grmddtgmwi"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSort(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_illews3ko6"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemax(node) where kind = qti-stimulus-body within 0..0 on AriaValuemax for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_o4o2qvnl6s"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemax(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_ikxibi57kh"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemin(node) where kind = qti-stimulus-body within 0..0 on AriaValuemin for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_x6ffp4tw7h"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemin(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_vi6tnnezgf"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuenow(node) where kind = qti-stimulus-body within 0..0 on AriaValuenow for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_xeclafgayj"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuenow(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_rxxf6fc3xg"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuetext(node) where kind = qti-stimulus-body within 0..0 on AriaValuetext for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_aria_phks2cp6wo"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuetext(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_gqtmow3sqf"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over HtmlId(node) where kind = qti-stimulus-body within 0..0 on HtmlId for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_ol2udjfo3x"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over HtmlId(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_rwav2hzj5b"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeCatalogIdref(node) where kind = qti-stimulus-body within 0..0 on NodeCatalogIdref for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_6v5zqroyb3"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeCatalogIdref(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_zxp2i2qo6k"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeClass(node) where kind = qti-stimulus-body within 0..0 on NodeClass for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_bqdpupwh2y"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeClass(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_dir_dhh7s7v772"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeDir(node) where kind = qti-stimulus-body within 0..0 on NodeDir for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_dir_bo5roh2e5m"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeDir(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_6kawmwufdj"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLabel(node) where kind = qti-stimulus-body within 0..0 on NodeLabel for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_fj6xmtqh3z"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLabel(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_lang_bd6cbcnbxz"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLang(node) where kind = qti-stimulus-body within 0..0 on NodeLang for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_lang_offcr6t3u6"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLang(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_tn3prtlvme"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeSuppressTts(node) where kind = qti-stimulus-body within 0..0 on NodeSuppressTts for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_relluknd2i"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeSuppressTts(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_xml_3fjryxng4c"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlBase(node) where kind = qti-stimulus-body within 0..0 on NodeXmlBase for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_xml_hh7zzjivln"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlBase(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_xml_vtlxezcwji"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlLang(node) where kind = qti-stimulus-body within 0..0 on NodeXmlLang for INSERT';

COMMENT ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_xml_sot2kf3zdw"() IS 'function of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlLang(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON FUNCTION "qti"."__law_test_part_capacity_structure_child_5k6hpcpayk"() IS 'function of law capacity of TestPart(id) over StructureChild(parent) within 1..* on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_test_part_capacity_structure_child_hewaxi3pyv"() IS 'function of law capacity of TestPart(id) over StructureChild(parent) within 1..* on TestPart for INSERT';

COMMENT ON FUNCTION "qti"."__law_test_rubric_block_capacity_edge_ectvou3a7g"() IS 'function of law capacity of TestRubricBlock(id) over Edge(parent) where childKind = qti-content-body.testRubric, parentKind = qti-rubric-block.test within 1..1 on Edge for DELETE';

COMMENT ON FUNCTION "qti"."__law_test_rubric_block_capacity_edge_pwh7a7a4zn"() IS 'function of law capacity of TestRubricBlock(id) over Edge(parent) where childKind = qti-content-body.testRubric, parentKind = qti-rubric-block.test within 1..1 on TestRubricBlock for INSERT';

COMMENT ON FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_lcntbn6q3c"() IS 'function of law capacity of XInclude(id) over XIncludeXpointer(node) within 0..0 on XInclude for INSERT';

COMMENT ON FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_m6ypamvu5f"() IS 'function of law capacity of XInclude(id) over XIncludeXpointer(node) within 0..0 on XIncludeXpointer for INSERT';

COMMENT ON FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_pr55plqugw"() IS 'function of law AssessmentItemLabel(tree) where root = item, version = 3.0.1 in ItemToolBoth(tree) on AssessmentItemLabel for INSERT';

COMMENT ON FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_vdb5do75or"() IS 'function of law AssessmentItemLabel(tree) where root = item, version = 3.0.1 in ItemToolBoth(tree) on ItemToolBoth for DELETE';

COMMENT ON FUNCTION "qti"."__law_assessment_section_required_1_in_required_zrlikmlvwi"() IS 'function of law AssessmentSection(id) where required = 1 in RequiredChild(child) on AssessmentSection for INSERT';

COMMENT ON FUNCTION "qti"."__law_assessment_section_required_1_in_required_nqyoqfqaex"() IS 'function of law AssessmentSection(id) where required = 1 in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_assessment_section_required_true_in_required_yjlncyvhpd"() IS 'function of law AssessmentSection(id) where required = true in RequiredChild(child) on AssessmentSection for INSERT';

COMMENT ON FUNCTION "qti"."__law_assessment_section_required_true_in_required_bmtyxub4en"() IS 'function of law AssessmentSection(id) where required = true in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_branch_rule_owner_kind_item_ref_in_item_ref_q7clds2vgd"() IS 'function of law BranchRule(owner) where ownerKind = itemRef in ItemRef(id) on BranchRule for INSERT';

COMMENT ON FUNCTION "qti"."__law_branch_rule_owner_kind_item_ref_in_item_ref_oe5drukkbb"() IS 'function of law BranchRule(owner) where ownerKind = itemRef in ItemRef(id) on ItemRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_7k2cssptls"() IS 'function of law BranchRule(owner) where ownerKind = part in TestPart(id) on BranchRule for INSERT';

COMMENT ON FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_xrk4rstawu"() IS 'function of law BranchRule(owner) where ownerKind = part in TestPart(id) on TestPart for DELETE';

COMMENT ON FUNCTION "qti"."__law_branch_rule_owner_kind_section_in_assessment_tmrgsavujn"() IS 'function of law BranchRule(owner) where ownerKind = section in AssessmentSection(id) on AssessmentSection for DELETE';

COMMENT ON FUNCTION "qti"."__law_branch_rule_owner_kind_section_in_assessment_g3btbpl2qi"() IS 'function of law BranchRule(owner) where ownerKind = section in AssessmentSection(id) on BranchRule for INSERT';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_item_ref_parent_xl7lhgyvqk"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-item-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_item_ref_parent_xuynswcjpk"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-item-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_yghtdzvqom"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_bcv7ifmfu5"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_hfsn3g56po"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-test-part in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_yi7vq7kwds"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-test-part in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_ref_nghpoxcm3j"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_ref_d23on33kfq"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_ref_fsss3jzqpe"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-test-part in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_ref_pxwv5obzwe"() IS 'function of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-test-part in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_xi_include_parent_kind_qti_ng4a7ba2vj"() IS 'function of law Edge(child, parent) where childKind = xi:include, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON FUNCTION "qti"."__law_edge_child_kind_xi_include_parent_kind_qti_tyqccwdqi2"() IS 'function of law Edge(child, parent) where childKind = xi:include, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_oaolbulyaz"() IS 'function of law ItemInstanceVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on ItemInstanceVariableRef for INSERT';

COMMENT ON FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_r7t5xavw7y"() IS 'function of law ItemInstanceVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on PrefixedVariableSource for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_ref_required_1_in_required_child_343bfmwepc"() IS 'function of law ItemRef(id) where required = 1 in RequiredChild(child) on ItemRef for INSERT';

COMMENT ON FUNCTION "qti"."__law_item_ref_required_1_in_required_child_ilbdfubyci"() IS 'function of law ItemRef(id) where required = 1 in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_ref_required_true_in_required_child_ntscar6a2o"() IS 'function of law ItemRef(id) where required = true in RequiredChild(child) on ItemRef for INSERT';

COMMENT ON FUNCTION "qti"."__law_item_ref_required_true_in_required_child_glq6jjcue7"() IS 'function of law ItemRef(id) where required = true in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_nq2atjerr6"() IS 'function of law ItemTool(tree) where root = item in AssessmentItem(tree) on AssessmentItem for DELETE';

COMMENT ON FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_syzwweq3av"() IS 'function of law ItemTool(tree) where root = item in AssessmentItem(tree) on ItemTool for INSERT';

COMMENT ON FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_thwk3pmmmi"() IS 'function of law ItemVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on ItemVariableRef for INSERT';

COMMENT ON FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_jksxo5aanm"() IS 'function of law ItemVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on PrefixedVariableSource for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bd6josusiu"() IS 'function of law NodeXmlLang(tree, value) where rootKind = test in DocumentLang(document, value) on DocumentLang for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bnwoqkqv52"() IS 'function of law NodeXmlLang(tree, value) where rootKind = test in DocumentLang(document, value) on NodeXmlLang for INSERT';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_item_xgglbwqkxx"() IS 'function of law PrefixedVariableSource(ref, prefix) where refKind = itemInstanceVariable in ItemInstanceVariableRef(id, prefix) on ItemInstanceVariableRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_item_qlsaq5fxuc"() IS 'function of law PrefixedVariableSource(ref, prefix) where refKind = itemInstanceVariable in ItemInstanceVariableRef(id, prefix) on PrefixedVariableSource for INSERT';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_item_yh6gvcmoo4"() IS 'function of law PrefixedVariableSource(ref, prefix) where refKind = itemVariable in ItemVariableRef(id, prefix) on ItemVariableRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_item_qlia5yh3j4"() IS 'function of law PrefixedVariableSource(ref, prefix) where refKind = itemVariable in ItemVariableRef(id, prefix) on PrefixedVariableSource for INSERT';

COMMENT ON FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_4jeyzgkbal"() IS 'function of law SectionDurationRef(id, document) where root = test in SectionDurationTarget(ref, test) on SectionDurationRef for INSERT';

COMMENT ON FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_w4zmtgadq3"() IS 'function of law SectionDurationRef(id, document) where root = test in SectionDurationTarget(ref, test) on SectionDurationTarget for DELETE';

COMMENT ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_3xs4mtudd5"() IS 'function of law SectionDurationTarget(ref, document, prefix) where refKind = sectionDuration in SectionDurationRef(id, document, prefix) on SectionDurationRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_ppo6ygqm2b"() IS 'function of law SectionDurationTarget(ref, document, prefix) where refKind = sectionDuration in SectionDurationRef(id, document, prefix) on SectionDurationTarget for INSERT';

COMMENT ON FUNCTION "qti"."__law_selection_with_replacement_0_in_selection_dyqwodibgz"() IS 'function of law Selection(section) where withReplacement = 0 in SelectionBounded(section) on Selection for INSERT';

COMMENT ON FUNCTION "qti"."__law_selection_with_replacement_0_in_selection_5kgj6hvszk"() IS 'function of law Selection(section) where withReplacement = 0 in SelectionBounded(section) on SelectionBounded for DELETE';

COMMENT ON FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_5mai563ruj"() IS 'function of law Selection(section) where withReplacement = false in SelectionBounded(section) on Selection for INSERT';

COMMENT ON FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_oxzf6h6avu"() IS 'function of law Selection(section) where withReplacement = false in SelectionBounded(section) on SelectionBounded for DELETE';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_piebqdloyh"() IS 'function of law TestIdentifier(holder) where holderKind = itemRef in ItemRef(id) on ItemRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_uinkslxwrw"() IS 'function of law TestIdentifier(holder) where holderKind = itemRef in ItemRef(id) on TestIdentifier for INSERT';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_lzm5dhjavd"() IS 'function of law TestIdentifier(holder) where holderKind = part in TestPart(id) on TestIdentifier for INSERT';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_ugowcjjitf"() IS 'function of law TestIdentifier(holder) where holderKind = part in TestPart(id) on TestPart for DELETE';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_section_in_fdu4ef4ias"() IS 'function of law TestIdentifier(holder) where holderKind = section in AssessmentSection(id) on AssessmentSection for DELETE';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_section_in_s7psacdylz"() IS 'function of law TestIdentifier(holder) where holderKind = section in AssessmentSection(id) on TestIdentifier for INSERT';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_section_ref_in_pvlrbdz7vf"() IS 'function of law TestIdentifier(holder) where holderKind = sectionRef in SectionRef(id) on SectionRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_test_identifier_holder_kind_section_ref_in_biqevwhn3i"() IS 'function of law TestIdentifier(holder) where holderKind = sectionRef in SectionRef(id) on TestIdentifier for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_adaptive_engine_ref_in_adaptive_ritdyfr5dc"() IS 'function of law Node(id) where kind = qti-adaptive-engine-ref in AdaptiveEngineRef(id), a mirrors half on AdaptiveEngineRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_adaptive_engine_ref_in_adaptive_uoqgfk6uku"() IS 'function of law Node(id) where kind = qti-adaptive-engine-ref in AdaptiveEngineRef(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_adaptive_selection_in_adaptive_43lz7xn4ih"() IS 'function of law Node(id) where kind = qti-adaptive-selection in AdaptiveSelection(id), a mirrors half on AdaptiveSelection for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_adaptive_selection_in_adaptive_fv5swzmw6o"() IS 'function of law Node(id) where kind = qti-adaptive-selection in AdaptiveSelection(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_adaptive_settings_ref_in_pxc3dvpxqe"() IS 'function of law Node(id) where kind = qti-adaptive-settings-ref in AdaptiveSettingsRef(id), a mirrors half on AdaptiveSettingsRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_adaptive_settings_ref_in_xxvphnkw5y"() IS 'function of law Node(id) where kind = qti-adaptive-settings-ref in AdaptiveSettingsRef(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_item_ref_in_item_ref_d5j5bovmws"() IS 'function of law Node(id) where kind = qti-assessment-item-ref in ItemRef(id), a mirrors half on ItemRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_item_ref_in_item_ref_lbuiknqgxg"() IS 'function of law Node(id) where kind = qti-assessment-item-ref in ItemRef(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_section_in_assessment_biji4yh7hc"() IS 'function of law Node(id) where kind = qti-assessment-section in AssessmentSection(id), a mirrors half on AssessmentSection for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_section_in_assessment_zgw3euejad"() IS 'function of law Node(id) where kind = qti-assessment-section in AssessmentSection(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_section_ref_in_5w6azz5rez"() IS 'function of law Node(id) where kind = qti-assessment-section-ref in SectionRef(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_section_ref_in_yrmlpgq5he"() IS 'function of law Node(id) where kind = qti-assessment-section-ref in SectionRef(id), a mirrors half on SectionRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_stimulus_in_q4hdyr3scz"() IS 'function of law Node(id) where kind = qti-assessment-stimulus in AssessmentStimulus(id), a mirrors half on AssessmentStimulus for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_stimulus_in_g6dtnpnuci"() IS 'function of law Node(id) where kind = qti-assessment-stimulus in AssessmentStimulus(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_stimulus_ref_in_item_i4kst6kdnr"() IS 'function of law Node(id) where kind = qti-assessment-stimulus-ref in ItemStimulusRef(id), a mirrors half on ItemStimulusRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_stimulus_ref_in_item_dbkqb4st2t"() IS 'function of law Node(id) where kind = qti-assessment-stimulus-ref in ItemStimulusRef(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_test_in_assessment_56enquztwx"() IS 'function of law Node(id) where kind = qti-assessment-test in AssessmentTest(id), a mirrors half on AssessmentTest for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_assessment_test_in_assessment_aohjcwjchz"() IS 'function of law Node(id) where kind = qti-assessment-test in AssessmentTest(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_branch_rule_in_branch_rule_55kh6pyj5w"() IS 'function of law Node(id) where kind = qti-branch-rule in BranchRule(id), a mirrors half on BranchRule for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_branch_rule_in_branch_rule_qr6ab5f6rt"() IS 'function of law Node(id) where kind = qti-branch-rule in BranchRule(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_content_body_test_feedback_in_y3pp7k62ay"() IS 'function of law Node(id) where kind = qti-content-body.testFeedback in TestFeedbackContentBody(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_content_body_test_feedback_in_7y26pulyho"() IS 'function of law Node(id) where kind = qti-content-body.testFeedback in TestFeedbackContentBody(id), a mirrors half on TestFeedbackContentBody for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_content_body_test_rubric_in_test_qhixv4v7wn"() IS 'function of law Node(id) where kind = qti-content-body.testRubric in TestRubricContentBody(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_content_body_test_rubric_in_test_pvseprfbwo"() IS 'function of law Node(id) where kind = qti-content-body.testRubric in TestRubricContentBody(id), a mirrors half on TestRubricContentBody for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_item_session_control_in_item_qujp5cjyiu"() IS 'function of law Node(id) where kind = qti-item-session-control in ItemSessionControl(id), a mirrors half on ItemSessionControl for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_item_session_control_in_item_n7nkw7qm55"() IS 'function of law Node(id) where kind = qti-item-session-control in ItemSessionControl(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_metadata_ref_in_metadata_ref_27pw6kgn6b"() IS 'function of law Node(id) where kind = qti-metadata-ref in MetadataRef(id), a mirrors half on MetadataRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_metadata_ref_in_metadata_ref_cb6jmxdefy"() IS 'function of law Node(id) where kind = qti-metadata-ref in MetadataRef(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_ordering_in_ordering_enjme4tuiz"() IS 'function of law Node(id) where kind = qti-ordering in Ordering(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_ordering_in_ordering_ff7aj4xlpl"() IS 'function of law Node(id) where kind = qti-ordering in Ordering(id), a mirrors half on Ordering for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_pre_condition_in_pre_condition_hggrjfj4lu"() IS 'function of law Node(id) where kind = qti-pre-condition in PreCondition(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_pre_condition_in_pre_condition_ucjf3gss6m"() IS 'function of law Node(id) where kind = qti-pre-condition in PreCondition(id), a mirrors half on PreCondition for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_rubric_block_test_in_test_rubric_uivoekk6vk"() IS 'function of law Node(id) where kind = qti-rubric-block.test in TestRubricBlock(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_rubric_block_test_in_test_rubric_kojgmeev4f"() IS 'function of law Node(id) where kind = qti-rubric-block.test in TestRubricBlock(id), a mirrors half on TestRubricBlock for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_selection_in_selection_sjmce6uzuv"() IS 'function of law Node(id) where kind = qti-selection in Selection(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_selection_in_selection_boxa36boop"() IS 'function of law Node(id) where kind = qti-selection in Selection(id), a mirrors half on Selection for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_stimulus_body_in_stimulus_body_lpqngarqzg"() IS 'function of law Node(id) where kind = qti-stimulus-body in StimulusBody(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_stimulus_body_in_stimulus_body_cr6bv4h5k5"() IS 'function of law Node(id) where kind = qti-stimulus-body in StimulusBody(id), a mirrors half on StimulusBody for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_template_default_in_template_tijbwnz6e2"() IS 'function of law Node(id) where kind = qti-template-default in TemplateDefault(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_template_default_in_template_c4f3l3h6ab"() IS 'function of law Node(id) where kind = qti-template-default in TemplateDefault(id), a mirrors half on TemplateDefault for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_test_feedback_in_test_feedback_bf3mk3udf5"() IS 'function of law Node(id) where kind = qti-test-feedback in TestFeedback(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_test_feedback_in_test_feedback_ej4ag35mue"() IS 'function of law Node(id) where kind = qti-test-feedback in TestFeedback(id), a mirrors half on TestFeedback for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_test_part_in_test_part_2lmozzr7qo"() IS 'function of law Node(id) where kind = qti-test-part in TestPart(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_test_part_in_test_part_qqxksuxydp"() IS 'function of law Node(id) where kind = qti-test-part in TestPart(id), a mirrors half on TestPart for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_time_limits_in_time_limits_2xsrgkrasv"() IS 'function of law Node(id) where kind = qti-time-limits in TimeLimits(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_time_limits_in_time_limits_b544pgbeey"() IS 'function of law Node(id) where kind = qti-time-limits in TimeLimits(id), a mirrors half on TimeLimits for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_usagedata_ref_in_usage_data_ref_uedt5j2n7r"() IS 'function of law Node(id) where kind = qti-usagedata-ref in UsageDataRef(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_usagedata_ref_in_usage_data_ref_mfuxmsuj52"() IS 'function of law Node(id) where kind = qti-usagedata-ref in UsageDataRef(id), a mirrors half on UsageDataRef for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_variable_mapping_in_variable_xgbuh2td22"() IS 'function of law Node(id) where kind = qti-variable-mapping in VariableMapping(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_variable_mapping_in_variable_cc44bx6qvg"() IS 'function of law Node(id) where kind = qti-variable-mapping in VariableMapping(id), a mirrors half on VariableMapping for DELETE';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_weight_in_weight_wjrbphp3jm"() IS 'function of law Node(id) where kind = qti-weight in Weight(id), a mirrors half on Node for INSERT';

COMMENT ON FUNCTION "qti"."__law_node_kind_qti_weight_in_weight_7zpefcwdvn"() IS 'function of law Node(id) where kind = qti-weight in Weight(id), a mirrors half on Weight for DELETE';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_xcecxexewu"() IS 'function of law PrefixedVariableSource(ref, test) where refKind = sectionVariable in SectionVariablePrefixed(ref, test), a mirrors half on PrefixedVariableSource for INSERT';

COMMENT ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_ddm6omh3fc"() IS 'function of law PrefixedVariableSource(ref, test) where refKind = sectionVariable in SectionVariablePrefixed(ref, test), a mirrors half on SectionVariablePrefixed for DELETE';

COMMENT ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_5i443wtidx"() IS 'function of law SectionDurationTarget(ref, test) where refKind = sectionVariable in SectionVariableDuration(ref, test), a mirrors half on SectionDurationTarget for INSERT';

COMMENT ON FUNCTION "qti"."__law_section_duration_target_ref_kind_section_dts7omyyed"() IS 'function of law SectionDurationTarget(ref, test) where refKind = sectionVariable in SectionVariableDuration(ref, test), a mirrors half on SectionVariableDuration for DELETE';

COMMENT ON CONSTRAINT "__adaptive_engine_ref_pk_5flj4nu6qs" ON "qti"."adaptive_engine_ref" IS 'primary key of AdaptiveEngineRef';

COMMENT ON CONSTRAINT "__adaptive_selection_pk_x342t7yey3" ON "qti"."adaptive_selection" IS 'primary key of AdaptiveSelection';

COMMENT ON CONSTRAINT "__adaptive_settings_ref_pk_uhkyv6yefd" ON "qti"."adaptive_settings_ref" IS 'primary key of AdaptiveSettingsRef';

COMMENT ON CONSTRAINT "__assessment_section_pk_ilhdvngzfi" ON "qti"."assessment_section" IS 'primary key of AssessmentSection';

COMMENT ON CONSTRAINT "__assessment_stimulus_pk_nv7fugfvgl" ON "qti"."assessment_stimulus" IS 'primary key of AssessmentStimulus';

COMMENT ON CONSTRAINT "__assessment_test_pk_p3ddtwwgjg" ON "qti"."assessment_test" IS 'primary key of AssessmentTest';

COMMENT ON CONSTRAINT "__attribute_file_reference_pk_3iujzlflq2" ON "qti"."attribute_file_reference" IS 'primary key of AttributeFileReference';

COMMENT ON CONSTRAINT "__branch_rule_pk_ee2mk7zphv" ON "qti"."branch_rule" IS 'primary key of BranchRule';

COMMENT ON CONSTRAINT "__branch_rule_key_id_owner_kind_4tcfegx7uq" ON "qti"."branch_rule" IS 'key BranchRule(id, ownerKind)';

COMMENT ON CONSTRAINT "__branch_rule_key_id_document_7wqsykdfyt" ON "qti"."branch_rule" IS 'key BranchRule(id, document)';

COMMENT ON CONSTRAINT "__branch_rule_key_id_target_kind_ud2n56dtwn" ON "qti"."branch_rule" IS 'key BranchRule(id, targetKind)';

COMMENT ON CONSTRAINT "__branch_rule_exit_pk_c5dpg3n42c" ON "qti"."branch_rule_exit" IS 'primary key of BranchRuleExit';

COMMENT ON CONSTRAINT "__branch_rule_target_pk_rmslmfdder" ON "qti"."branch_rule_target" IS 'primary key of BranchRuleTarget';

COMMENT ON CONSTRAINT "__declared_allow_comment_pk_fd2vvufu2a" ON "qti"."declared_allow_comment" IS 'primary key of DeclaredAllowComment';

COMMENT ON CONSTRAINT "__declared_allow_late_submission_pk_p4avvo66j7" ON "qti"."declared_allow_late_submission" IS 'primary key of DeclaredAllowLateSubmission';

COMMENT ON CONSTRAINT "__declared_allow_review_pk_gsadhotvy2" ON "qti"."declared_allow_review" IS 'primary key of DeclaredAllowReview';

COMMENT ON CONSTRAINT "__declared_allow_skipping_pk_cfodezuoh5" ON "qti"."declared_allow_skipping" IS 'primary key of DeclaredAllowSkipping';

COMMENT ON CONSTRAINT "__declared_item_ref_fixed_pk_2rxinlz7zf" ON "qti"."declared_item_ref_fixed" IS 'primary key of DeclaredItemRefFixed';

COMMENT ON CONSTRAINT "__declared_item_ref_required_pk_5ofua5f2vn" ON "qti"."declared_item_ref_required" IS 'primary key of DeclaredItemRefRequired';

COMMENT ON CONSTRAINT "__declared_ordering_shuffle_pk_f7ydape5bs" ON "qti"."declared_ordering_shuffle" IS 'primary key of DeclaredOrderingShuffle';

COMMENT ON CONSTRAINT "__declared_section_fixed_pk_qgubwqh3az" ON "qti"."declared_section_fixed" IS 'primary key of DeclaredSectionFixed';

COMMENT ON CONSTRAINT "__declared_section_keep_together_pk_wups6kcxac" ON "qti"."declared_section_keep_together" IS 'primary key of DeclaredSectionKeepTogether';

COMMENT ON CONSTRAINT "__declared_section_required_pk_6x5az6ztcw" ON "qti"."declared_section_required" IS 'primary key of DeclaredSectionRequired';

COMMENT ON CONSTRAINT "__declared_show_feedback_pk_7qjafqffe3" ON "qti"."declared_show_feedback" IS 'primary key of DeclaredShowFeedback';

COMMENT ON CONSTRAINT "__declared_show_solution_pk_r6pdvzfkoq" ON "qti"."declared_show_solution" IS 'primary key of DeclaredShowSolution';

COMMENT ON CONSTRAINT "__declared_validate_responses_pk_tpp6dmk2ni" ON "qti"."declared_validate_responses" IS 'primary key of DeclaredValidateResponses';

COMMENT ON CONSTRAINT "__declared_with_replacement_pk_hwe6yn36mr" ON "qti"."declared_with_replacement" IS 'primary key of DeclaredWithReplacement';

COMMENT ON CONSTRAINT "__document_key_id_package_s65zceexft" ON "qti"."document" IS 'key Document(id, package)';

COMMENT ON CONSTRAINT "__document_key_package_path_id_root_uefqwcznjn" ON "qti"."document" IS 'key Document(package, path, id, root)';

COMMENT ON CONSTRAINT "__item_instance_spelling_pk_qu7v2ohy24" ON "qti"."item_instance_spelling" IS 'primary key of ItemInstanceSpelling';

COMMENT ON CONSTRAINT "__item_instance_variable_ref_pk_3xh5omm42u" ON "qti"."item_instance_variable_ref" IS 'primary key of ItemInstanceVariableRef';

COMMENT ON CONSTRAINT "__item_ref_pk_w6hvuhcfny" ON "qti"."item_ref" IS 'primary key of ItemRef';

COMMENT ON CONSTRAINT "__item_ref_category_pk_qo44w672sc" ON "qti"."item_ref_category" IS 'primary key of ItemRefCategory';

COMMENT ON CONSTRAINT "__item_ref_document_pk_ylsc7bhhax" ON "qti"."item_ref_document" IS 'primary key of ItemRefDocument';

COMMENT ON CONSTRAINT "__item_ref_document_key_item_ref_document_4h5jz7gpdk" ON "qti"."item_ref_document" IS 'key ItemRefDocument(itemRef, document)';

COMMENT ON CONSTRAINT "__item_ref_lti_pk_52of3cel44" ON "qti"."item_ref_lti" IS 'primary key of ItemRefLti';

COMMENT ON CONSTRAINT "__item_ref_resolution_pk_ijrm7rvkka" ON "qti"."item_ref_resolution" IS 'primary key of ItemRefResolution';

COMMENT ON CONSTRAINT "__item_ref_resolution_key_item_ref_target_kind_somrtnmqk6" ON "qti"."item_ref_resolution" IS 'key ItemRefResolution(itemRef, targetKind)';

COMMENT ON CONSTRAINT "__item_session_control_pk_nbur6y7vcd" ON "qti"."item_session_control" IS 'primary key of ItemSessionControl';

COMMENT ON CONSTRAINT "__item_session_max_attempts_pk_xacph2l5cm" ON "qti"."item_session_max_attempts" IS 'primary key of ItemSessionMaxAttempts';

COMMENT ON CONSTRAINT "__item_stimulus_ref_pk_mp2mwyljzk" ON "qti"."item_stimulus_ref" IS 'primary key of ItemStimulusRef';

COMMENT ON CONSTRAINT "__item_stimulus_ref_key_document_identifier_35hgelcdwa" ON "qti"."item_stimulus_ref" IS 'key ItemStimulusRef(document, identifier)';

COMMENT ON CONSTRAINT "__item_stimulus_ref_title_pk_ratovulq3i" ON "qti"."item_stimulus_ref_title" IS 'primary key of ItemStimulusRefTitle';

COMMENT ON CONSTRAINT "__item_variable_ref_pk_njgtpujv2f" ON "qti"."item_variable_ref" IS 'primary key of ItemVariableRef';

COMMENT ON CONSTRAINT "__metadata_ref_pk_imiuigdq6q" ON "qti"."metadata_ref" IS 'primary key of MetadataRef';

COMMENT ON CONSTRAINT "__ordering_pk_44ka4uv5td" ON "qti"."ordering" IS 'primary key of Ordering';

COMMENT ON CONSTRAINT "__pre_condition_pk_jgg2ycaenq" ON "qti"."pre_condition" IS 'primary key of PreCondition';

COMMENT ON CONSTRAINT "__prefixed_built_in_pk_ovjejkbjyn" ON "qti"."prefixed_built_in" IS 'primary key of PrefixedBuiltIn';

COMMENT ON CONSTRAINT "__prefixed_declared_pk_fsrr5duoxo" ON "qti"."prefixed_declared" IS 'primary key of PrefixedDeclared';

COMMENT ON CONSTRAINT "__prefixed_mapped_pk_bvkuuujh5y" ON "qti"."prefixed_mapped" IS 'primary key of PrefixedMapped';

COMMENT ON CONSTRAINT "__prefixed_variable_source_pk_36jygg4j3t" ON "qti"."prefixed_variable_source" IS 'primary key of PrefixedVariableSource';

COMMENT ON CONSTRAINT "__prefixed_variable_source_key_ref_test_item_uhyl75fsrh" ON "qti"."prefixed_variable_source" IS 'key PrefixedVariableSource(ref, test, itemDocument)';

COMMENT ON CONSTRAINT "__prefixed_variable_source_key_ref_test_item_ref_eehqzlfvbd" ON "qti"."prefixed_variable_source" IS 'key PrefixedVariableSource(ref, test, itemRef)';

COMMENT ON CONSTRAINT "__prefixed_variable_source_key_ref_test_source_hf43cbuvqp" ON "qti"."prefixed_variable_source" IS 'key PrefixedVariableSource(ref, test, source)';

COMMENT ON CONSTRAINT "__prefixed_variable_source_key_ref_test_ref_kind_g2cr4ejczo" ON "qti"."prefixed_variable_source" IS 'key PrefixedVariableSource(ref, test, refKind)';

COMMENT ON CONSTRAINT "__required_child_pk_cujcsefy6i" ON "qti"."required_child" IS 'primary key of RequiredChild';

COMMENT ON CONSTRAINT "__section_duration_ref_pk_6zjzevf72d" ON "qti"."section_duration_ref" IS 'primary key of SectionDurationRef';

COMMENT ON CONSTRAINT "__section_duration_target_pk_fbxzlpnzz6" ON "qti"."section_duration_target" IS 'primary key of SectionDurationTarget';

COMMENT ON CONSTRAINT "__section_duration_target_key_ref_test_ref_kind_2lnypik4z7" ON "qti"."section_duration_target" IS 'key SectionDurationTarget(ref, test, refKind)';

COMMENT ON CONSTRAINT "__section_feedback_outcome_ref_pk_ow4js4b7wa" ON "qti"."section_feedback_outcome_ref" IS 'primary key of SectionFeedbackOutcomeRef';

COMMENT ON CONSTRAINT "__section_identifier_target_pk_4c4bz2q43g" ON "qti"."section_identifier_target" IS 'primary key of SectionIdentifierTarget';

COMMENT ON CONSTRAINT "__section_printed_variable_ref_pk_luwlztqnox" ON "qti"."section_printed_variable_ref" IS 'primary key of SectionPrintedVariableRef';

COMMENT ON CONSTRAINT "__section_printed_variable_var_ref_pk_nje3waouaf" ON "qti"."section_printed_variable_var_ref" IS 'primary key of SectionPrintedVariableVarRef';

COMMENT ON CONSTRAINT "__section_ref_pk_jzoxzjo4g7" ON "qti"."section_ref" IS 'primary key of SectionRef';

COMMENT ON CONSTRAINT "__section_ref_resolution_pk_oxwwutqgux" ON "qti"."section_ref_resolution" IS 'primary key of SectionRefResolution';

COMMENT ON CONSTRAINT "__section_variable_declared_pk_vb6ton4lie" ON "qti"."section_variable_declared" IS 'primary key of SectionVariableDeclared';

COMMENT ON CONSTRAINT "__section_variable_duration_pk_c2hxdf22ce" ON "qti"."section_variable_duration" IS 'primary key of SectionVariableDuration';

COMMENT ON CONSTRAINT "__section_variable_prefixed_pk_i7usuhylm2" ON "qti"."section_variable_prefixed" IS 'primary key of SectionVariablePrefixed';

COMMENT ON CONSTRAINT "__section_variable_ref_pk_nxo7577xz5" ON "qti"."section_variable_ref" IS 'primary key of SectionVariableRef';

COMMENT ON CONSTRAINT "__section_variable_ref_key_id_document_2fw6audat2" ON "qti"."section_variable_ref" IS 'key SectionVariableRef(id, document)';

COMMENT ON CONSTRAINT "__section_variable_ref_key_id_identifier_referrer_delp4ztd3t" ON "qti"."section_variable_ref" IS 'key SectionVariableRef(id, identifier, referrerKind)';

COMMENT ON CONSTRAINT "__section_variable_resolution_pk_klacthyx35" ON "qti"."section_variable_resolution" IS 'primary key of SectionVariableResolution';

COMMENT ON CONSTRAINT "__section_variable_resolution_key_ref_test_target_gt6iqskdzl" ON "qti"."section_variable_resolution" IS 'key SectionVariableResolution(ref, test, target)';

COMMENT ON CONSTRAINT "__selection_pk_7kinlubjfd" ON "qti"."selection" IS 'primary key of Selection';

COMMENT ON CONSTRAINT "__selection_key_section_l33vlzy3jd" ON "qti"."selection" IS 'key Selection(section)';

COMMENT ON CONSTRAINT "__selection_key_section_select_with_replacement_op3ucqpswj" ON "qti"."selection" IS 'key Selection(section, select, withReplacement)';

COMMENT ON CONSTRAINT "__selection_bounded_pk_hsuptdknon" ON "qti"."selection_bounded" IS 'primary key of SelectionBounded';

COMMENT ON CONSTRAINT "__stimulus_body_pk_4tkmqh7b42" ON "qti"."stimulus_body" IS 'primary key of StimulusBody';

COMMENT ON CONSTRAINT "__stimulus_ref_resolution_pk_pfagqolr7w" ON "qti"."stimulus_ref_resolution" IS 'primary key of StimulusRefResolution';

COMMENT ON CONSTRAINT "__structure_child_pk_qo52ahr3at" ON "qti"."structure_child" IS 'primary key of StructureChild';

COMMENT ON CONSTRAINT "__structure_child_key_child_parent_phgplnzs26" ON "qti"."structure_child" IS 'key StructureChild(child, parent)';

COMMENT ON CONSTRAINT "__template_default_pk_iqt4z54xsd" ON "qti"."template_default" IS 'primary key of TemplateDefault';

COMMENT ON CONSTRAINT "__test_document_pk_vo4n4a7gyn" ON "qti"."test_document" IS 'primary key of TestDocument';

COMMENT ON CONSTRAINT "__test_feedback_pk_s53bngtfbl" ON "qti"."test_feedback" IS 'primary key of TestFeedback';

COMMENT ON CONSTRAINT "__test_feedback_content_body_pk_a4e7lro7tj" ON "qti"."test_feedback_content_body" IS 'primary key of TestFeedbackContentBody';

COMMENT ON CONSTRAINT "__test_feedback_title_pk_wgb5wktgm2" ON "qti"."test_feedback_title" IS 'primary key of TestFeedbackTitle';

COMMENT ON CONSTRAINT "__test_identifier_pk_jdeul322bd" ON "qti"."test_identifier" IS 'primary key of TestIdentifier';

COMMENT ON CONSTRAINT "__test_identifier_key_scope_identifier_26d2ecbygl" ON "qti"."test_identifier" IS 'key TestIdentifier(scope, identifier)';

COMMENT ON CONSTRAINT "__test_identifier_key_holder_identifier_holder_kind_5razf2ej3m" ON "qti"."test_identifier" IS 'key TestIdentifier(holder, identifier, holderKind)';

COMMENT ON CONSTRAINT "__test_identifier_key_holder_scope_identifier_holder_k45eynn5fa" ON "qti"."test_identifier" IS 'key TestIdentifier(holder, scope, identifier, holderKind)';

COMMENT ON CONSTRAINT "__test_identifier_key_scope_identifier_holder_kind_b6ykpk77a2" ON "qti"."test_identifier" IS 'key TestIdentifier(scope, identifier, holderKind)';

COMMENT ON CONSTRAINT "__test_part_pk_i7s6pcqhin" ON "qti"."test_part" IS 'primary key of TestPart';

COMMENT ON CONSTRAINT "__test_part_title_pk_ke3qn3yv23" ON "qti"."test_part_title" IS 'primary key of TestPartTitle';

COMMENT ON CONSTRAINT "__test_reach_pk_3wreqqiiy4" ON "qti"."test_reach" IS 'primary key of TestReach';

COMMENT ON CONSTRAINT "__test_reach_key_test_identifier_eyslhe3bx2" ON "qti"."test_reach" IS 'key TestReach(test, identifier)';

COMMENT ON CONSTRAINT "__test_reach_key_test_identifier_holder_kind_3vcxpnaxxf" ON "qti"."test_reach" IS 'key TestReach(test, identifier, holderKind)';

COMMENT ON CONSTRAINT "__test_reach_key_test_identifier_holder_holder_kind_h524glzpon" ON "qti"."test_reach" IS 'key TestReach(test, identifier, holder, holderKind)';

COMMENT ON CONSTRAINT "__test_rubric_block_pk_kp256ppswm" ON "qti"."test_rubric_block" IS 'primary key of TestRubricBlock';

COMMENT ON CONSTRAINT "__test_rubric_block_use_pk_bzdtkpwmla" ON "qti"."test_rubric_block_use" IS 'primary key of TestRubricBlockUse';

COMMENT ON CONSTRAINT "__test_rubric_content_body_pk_q23lxpc2gs" ON "qti"."test_rubric_content_body" IS 'primary key of TestRubricContentBody';

COMMENT ON CONSTRAINT "__tests_hold_pk_n6235zezsv" ON "qti"."tests_hold" IS 'primary key of TestsHold';

COMMENT ON CONSTRAINT "__time_limit_max_pk_eg7rte4emn" ON "qti"."time_limit_max" IS 'primary key of TimeLimitMax';

COMMENT ON CONSTRAINT "__time_limit_min_pk_yxqtkm4k3e" ON "qti"."time_limit_min" IS 'primary key of TimeLimitMin';

COMMENT ON CONSTRAINT "__time_limits_pk_233hp6xdum" ON "qti"."time_limits" IS 'primary key of TimeLimits';

COMMENT ON CONSTRAINT "__tree_key_id_root_xobalzbvek" ON "qti"."tree" IS 'key Tree(id, root)';

COMMENT ON CONSTRAINT "__usage_data_ref_pk_6bp2ejo3w4" ON "qti"."usage_data_ref" IS 'primary key of UsageDataRef';

COMMENT ON CONSTRAINT "__variable_mapping_pk_6whxnfgvwi" ON "qti"."variable_mapping" IS 'primary key of VariableMapping';

COMMENT ON CONSTRAINT "__variable_mapping_key_item_ref_target_c6yqodtijd" ON "qti"."variable_mapping" IS 'key VariableMapping(itemRef, target)';

COMMENT ON CONSTRAINT "__variable_ref_key_id_document_qvmavfpldp" ON "qti"."variable_ref" IS 'key VariableRef(id, document)';

COMMENT ON CONSTRAINT "__variable_ref_key_id_document_kind_sqkjkdlrd4" ON "qti"."variable_ref" IS 'key VariableRef(id, document, kind)';

COMMENT ON CONSTRAINT "__weight_pk_p77rl634io" ON "qti"."weight" IS 'primary key of Weight';

COMMENT ON COLUMN "qti"."adaptive_engine_ref"."__tag_kind_qti_adaptive_engine_ref_qzxlqmeeko" IS 'tag Node.kind = qti-adaptive-engine-ref';

COMMENT ON COLUMN "qti"."adaptive_selection"."__tag_kind_qti_adaptive_selection_kekye7hasu" IS 'tag Node.kind = qti-adaptive-selection';

COMMENT ON COLUMN "qti"."adaptive_settings_ref"."__tag_kind_qti_adaptive_settings_ref_dq6tuiwszr" IS 'tag Node.kind = qti-adaptive-settings-ref';

COMMENT ON COLUMN "qti"."assessment_section"."__tag_kind_qti_assessment_section_wauaiptqxk" IS 'tag Node.kind = qti-assessment-section';

COMMENT ON COLUMN "qti"."assessment_section"."__tag_holder_kind_section_ejkpupg2zz" IS 'tag TestIdentifier.holderKind = section';

COMMENT ON COLUMN "qti"."assessment_stimulus"."__tag_kind_qti_assessment_stimulus_rdg5it6jdz" IS 'tag Node.kind = qti-assessment-stimulus';

COMMENT ON COLUMN "qti"."assessment_test"."__tag_kind_qti_assessment_test_2ltodxnrpy" IS 'tag Node.kind = qti-assessment-test';

COMMENT ON COLUMN "qti"."branch_rule"."__tag_kind_qti_branch_rule_bnu6rjryqc" IS 'tag Node.kind = qti-branch-rule';

COMMENT ON COLUMN "qti"."branch_rule_exit"."__tag_target_kind_exit_aicxomz3hh" IS 'tag BranchRule.targetKind = exit';

COMMENT ON COLUMN "qti"."branch_rule_target"."__tag_target_kind_ref_seeentthk7" IS 'tag BranchRule.targetKind = ref';

COMMENT ON COLUMN "qti"."item_instance_variable_ref"."__tag_kind_item_instance_variable_qcrtkmyrc5" IS 'tag VariableRef.kind = itemInstanceVariable';

COMMENT ON COLUMN "qti"."item_ref"."__tag_kind_qti_assessment_item_ref_hps2s36don" IS 'tag Node.kind = qti-assessment-item-ref';

COMMENT ON COLUMN "qti"."item_ref"."__tag_holder_kind_item_ref_kytin3i6mz" IS 'tag TestIdentifier.holderKind = itemRef';

COMMENT ON COLUMN "qti"."item_ref_document"."__tag_root_item_wlk5is6qw7" IS 'tag Document.root = item';

COMMENT ON COLUMN "qti"."item_ref_document"."__tag_target_kind_item_fgwqiexuve" IS 'tag ItemRefResolution.targetKind = item';

COMMENT ON COLUMN "qti"."item_ref_lti"."__tag_target_kind_lti_ahi4eitc7u" IS 'tag ItemRefResolution.targetKind = lti';

COMMENT ON COLUMN "qti"."item_session_control"."__tag_kind_qti_item_session_control_ypl7kurks7" IS 'tag Node.kind = qti-item-session-control';

COMMENT ON COLUMN "qti"."item_stimulus_ref"."__tag_kind_qti_assessment_stimulus_ref_jw5j27wnfb" IS 'tag Node.kind = qti-assessment-stimulus-ref';

COMMENT ON COLUMN "qti"."item_variable_ref"."__tag_kind_item_variable_5wfcxwh5gq" IS 'tag VariableRef.kind = itemVariable';

COMMENT ON COLUMN "qti"."metadata_ref"."__tag_kind_qti_metadata_ref_2foxgesdiw" IS 'tag Node.kind = qti-metadata-ref';

COMMENT ON COLUMN "qti"."ordering"."__tag_kind_qti_ordering_ezmnthie6z" IS 'tag Node.kind = qti-ordering';

COMMENT ON COLUMN "qti"."pre_condition"."__tag_kind_qti_pre_condition_mirfvuo5br" IS 'tag Node.kind = qti-pre-condition';

COMMENT ON COLUMN "qti"."prefixed_built_in"."__tag_source_built_in_win2m4ydys" IS 'tag PrefixedVariableSource.source = builtIn';

COMMENT ON COLUMN "qti"."prefixed_declared"."__tag_source_declared_sdgzhu26kd" IS 'tag PrefixedVariableSource.source = declared';

COMMENT ON COLUMN "qti"."prefixed_mapped"."__tag_source_mapped_p7vxvhg6f7" IS 'tag PrefixedVariableSource.source = mapped';

COMMENT ON COLUMN "qti"."prefixed_variable_source"."__tag_holder_kind_item_ref_47sb5enwfv" IS 'tag TestReach.holderKind = itemRef';

COMMENT ON COLUMN "qti"."section_duration_ref"."__tag_kind_section_duration_db6nf7nxso" IS 'tag VariableRef.kind = sectionDuration';

COMMENT ON COLUMN "qti"."section_feedback_outcome_ref"."__tag_kind_outcome_glkysklooj" IS 'tag Declaration.kind = outcome';

COMMENT ON COLUMN "qti"."section_ref"."__tag_kind_qti_assessment_section_ref_uewqzx3v4v" IS 'tag Node.kind = qti-assessment-section-ref';

COMMENT ON COLUMN "qti"."section_ref"."__tag_holder_kind_section_ref_fcqoid3ohb" IS 'tag TestIdentifier.holderKind = sectionRef';

COMMENT ON COLUMN "qti"."section_ref_resolution"."__tag_root_section_pd2d4gcywn" IS 'tag Document.root = section';

COMMENT ON COLUMN "qti"."section_variable_declared"."__tag_target_declared_ilhuctesh5" IS 'tag SectionVariableResolution.target = declared';

COMMENT ON COLUMN "qti"."section_variable_duration"."__tag_ref_kind_section_variable_jo65257ny5" IS 'tag SectionDurationTarget.refKind = sectionVariable';

COMMENT ON COLUMN "qti"."section_variable_duration"."__tag_target_duration_l44yrac3hq" IS 'tag SectionVariableResolution.target = duration';

COMMENT ON COLUMN "qti"."section_variable_prefixed"."__tag_ref_kind_section_variable_lyjzdtqixu" IS 'tag PrefixedVariableSource.refKind = sectionVariable';

COMMENT ON COLUMN "qti"."section_variable_prefixed"."__tag_target_prefixed_gqdv7vjzm6" IS 'tag SectionVariableResolution.target = prefixed';

COMMENT ON COLUMN "qti"."section_variable_ref"."__tag_kind_section_variable_xx6oynyexh" IS 'tag VariableRef.kind = sectionVariable';

COMMENT ON COLUMN "qti"."selection"."__tag_kind_qti_selection_lyq6lq42ud" IS 'tag Node.kind = qti-selection';

COMMENT ON COLUMN "qti"."stimulus_body"."__tag_kind_qti_stimulus_body_lhe3p2vmfc" IS 'tag Node.kind = qti-stimulus-body';

COMMENT ON COLUMN "qti"."stimulus_ref_resolution"."__tag_root_stimulus_fnlqquajeh" IS 'tag Document.root = stimulus';

COMMENT ON COLUMN "qti"."template_default"."__tag_kind_template_6mdj2h4ofc" IS 'tag Declaration.kind = template';

COMMENT ON COLUMN "qti"."template_default"."__tag_kind_qti_template_default_h5uiey2hdf" IS 'tag Node.kind = qti-template-default';

COMMENT ON COLUMN "qti"."test_document"."__tag_root_test_sfpw7z7lis" IS 'tag Document.root = test';

COMMENT ON COLUMN "qti"."test_feedback"."__tag_kind_qti_test_feedback_oicqmodm6p" IS 'tag Node.kind = qti-test-feedback';

COMMENT ON COLUMN "qti"."test_feedback_content_body"."__tag_kind_qti_content_body_test_feedback_62lcd5o5q3" IS 'tag Node.kind = qti-content-body.testFeedback';

COMMENT ON COLUMN "qti"."test_part"."__tag_kind_qti_test_part_ewahlzefvg" IS 'tag Node.kind = qti-test-part';

COMMENT ON COLUMN "qti"."test_part"."__tag_holder_kind_part_e5bqbqbrvc" IS 'tag TestIdentifier.holderKind = part';

COMMENT ON COLUMN "qti"."test_rubric_block"."__tag_kind_qti_rubric_block_test_qk6ijn65fj" IS 'tag Node.kind = qti-rubric-block.test';

COMMENT ON COLUMN "qti"."test_rubric_content_body"."__tag_kind_qti_content_body_test_rubric_jaxkcc3se5" IS 'tag Node.kind = qti-content-body.testRubric';

COMMENT ON COLUMN "qti"."time_limits"."__tag_kind_qti_time_limits_343jhkovjf" IS 'tag Node.kind = qti-time-limits';

COMMENT ON COLUMN "qti"."usage_data_ref"."__tag_kind_qti_usagedata_ref_75tpeijppj" IS 'tag Node.kind = qti-usagedata-ref';

COMMENT ON COLUMN "qti"."variable_mapping"."__tag_kind_outcome_glkysklooj" IS 'tag Declaration.kind = outcome';

COMMENT ON COLUMN "qti"."variable_mapping"."__tag_kind_qti_variable_mapping_scg2kyf6y2" IS 'tag Node.kind = qti-variable-mapping';

COMMENT ON COLUMN "qti"."weight"."__tag_kind_qti_weight_ecqobu7wca" IS 'tag Node.kind = qti-weight';

COMMENT ON CONSTRAINT "__adaptive_engine_ref_fk_id_tag_kind_qti_adaptive_itu6wcu3f7" ON "qti"."adaptive_engine_ref" IS 'foreign key AdaptiveEngineRef(id, __tag_kind_qti_adaptive_engine_ref_qzxlqmeeko) to Node(id, kind)';

COMMENT ON CONSTRAINT "__adaptive_selection_fk_id_tag_kind_qti_adaptive_x7infxtnhf" ON "qti"."adaptive_selection" IS 'foreign key AdaptiveSelection(id, __tag_kind_qti_adaptive_selection_kekye7hasu) to Node(id, kind)';

COMMENT ON CONSTRAINT "__adaptive_settings_ref_fk_id_tag_kind_qti_adaptive_ahxc5xtbyu" ON "qti"."adaptive_settings_ref" IS 'foreign key AdaptiveSettingsRef(id, __tag_kind_qti_adaptive_settings_ref_dq6tuiwszr) to Node(id, kind)';

COMMENT ON CONSTRAINT "__assessment_item_label_fk_tree_root_6dwmowvztk" ON "qti"."assessment_item_label" IS 'foreign key AssessmentItemLabel(tree, root) to Tree(id, root)';

COMMENT ON CONSTRAINT "__assessment_section_fk_id_tag_kind_qti_assessment_utckduyvsh" ON "qti"."assessment_section" IS 'foreign key AssessmentSection(id, __tag_kind_qti_assessment_section_wauaiptqxk) to Node(id, kind)';

COMMENT ON CONSTRAINT "__assessment_section_fk_id_document_httqfmaptl" ON "qti"."assessment_section" IS 'foreign key AssessmentSection(id, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__assessment_section_fk_id_document_identifier_tag_ydr455cp3q" ON "qti"."assessment_section" IS 'foreign key AssessmentSection(id, document, identifier, __tag_holder_kind_section_ejkpupg2zz) to TestIdentifier(holder, scope, identifier, holderKind)';

COMMENT ON CONSTRAINT "__assessment_stimulus_fk_id_tag_kind_qti_assessment_fmerbs7eo7" ON "qti"."assessment_stimulus" IS 'foreign key AssessmentStimulus(id, __tag_kind_qti_assessment_stimulus_rdg5it6jdz) to Node(id, kind)';

COMMENT ON CONSTRAINT "__assessment_test_fk_id_tag_kind_qti_assessment_test_kts4yg2awt" ON "qti"."assessment_test" IS 'foreign key AssessmentTest(id, __tag_kind_qti_assessment_test_2ltodxnrpy) to Node(id, kind)';

COMMENT ON CONSTRAINT "__attribute_file_reference_fk_document_package_hpgjc7q5wa" ON "qti"."attribute_file_reference" IS 'foreign key AttributeFileReference(document, package) to Document(id, package)';

COMMENT ON CONSTRAINT "__attribute_file_reference_fk_kind_attribute_rrl75v754m" ON "qti"."attribute_file_reference" IS 'foreign key AttributeFileReference(kind, attribute) to AttributeAdmission(kind, attribute)';

COMMENT ON CONSTRAINT "__attribute_file_reference_fk_node_document_no23h3mfut" ON "qti"."attribute_file_reference" IS 'foreign key AttributeFileReference(node, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__attribute_file_reference_fk_node_kind_cptdkge57n" ON "qti"."attribute_file_reference" IS 'foreign key AttributeFileReference(node, kind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__attribute_file_reference_fk_package_path_nybmfllbek" ON "qti"."attribute_file_reference" IS 'foreign key AttributeFileReference(package, path) to PackageEntry(package, path)';

COMMENT ON CONSTRAINT "__branch_rule_fk_id_bn7l3fw6el" ON "qti"."branch_rule" IS 'foreign key BranchRule(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__branch_rule_fk_id_tag_kind_qti_branch_rule_bnu_6_sakenq6bg4" ON "qti"."branch_rule" IS 'foreign key BranchRule(id, __tag_kind_qti_branch_rule_bnu6rjryqc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__branch_rule_fk_id_owner_hjbeidqyxp" ON "qti"."branch_rule" IS 'foreign key BranchRule(id, owner) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__branch_rule_exit_fk_rule_tag_target_kind_exit_bwzbbwta6r" ON "qti"."branch_rule_exit" IS 'foreign key BranchRuleExit(rule, __tag_target_kind_exit_aicxomz3hh) to BranchRule(id, targetKind)';

COMMENT ON CONSTRAINT "__branch_rule_target_fk_rule_tag_target_kind_ref_42wjbqiwbv" ON "qti"."branch_rule_target" IS 'foreign key BranchRuleTarget(rule, __tag_target_kind_ref_seeentthk7) to BranchRule(id, targetKind)';

COMMENT ON CONSTRAINT "__branch_rule_target_fk_rule_owner_kind_btvohroljt" ON "qti"."branch_rule_target" IS 'foreign key BranchRuleTarget(rule, ownerKind) to BranchRule(id, ownerKind)';

COMMENT ON CONSTRAINT "__branch_rule_target_fk_rule_scope_32r2xsdtsf" ON "qti"."branch_rule_target" IS 'foreign key BranchRuleTarget(rule, scope) to BranchRule(id, document)';

COMMENT ON CONSTRAINT "__branch_rule_target_fk_scope_identifier_holder_kind_q3isplk5rx" ON "qti"."branch_rule_target" IS 'foreign key BranchRuleTarget(scope, identifier, holderKind) to TestIdentifier(scope, identifier, holderKind)';

COMMENT ON CONSTRAINT "__declared_allow_comment_fk_node_cbwqtxoecp" ON "qti"."declared_allow_comment" IS 'foreign key DeclaredAllowComment(node) to ItemSessionControl(id)';

COMMENT ON CONSTRAINT "__declared_allow_late_submission_fk_node_hztpw6rg4p" ON "qti"."declared_allow_late_submission" IS 'foreign key DeclaredAllowLateSubmission(node) to TimeLimits(id)';

COMMENT ON CONSTRAINT "__declared_allow_review_fk_node_cxkzsahn5n" ON "qti"."declared_allow_review" IS 'foreign key DeclaredAllowReview(node) to ItemSessionControl(id)';

COMMENT ON CONSTRAINT "__declared_allow_skipping_fk_node_rscyfgfgvb" ON "qti"."declared_allow_skipping" IS 'foreign key DeclaredAllowSkipping(node) to ItemSessionControl(id)';

COMMENT ON CONSTRAINT "__declared_ordering_shuffle_fk_node_5lby2wpyyk" ON "qti"."declared_ordering_shuffle" IS 'foreign key DeclaredOrderingShuffle(node) to Ordering(id)';

COMMENT ON CONSTRAINT "__declared_show_feedback_fk_node_cmksuceqam" ON "qti"."declared_show_feedback" IS 'foreign key DeclaredShowFeedback(node) to ItemSessionControl(id)';

COMMENT ON CONSTRAINT "__declared_show_solution_fk_node_4byy4o6ma5" ON "qti"."declared_show_solution" IS 'foreign key DeclaredShowSolution(node) to ItemSessionControl(id)';

COMMENT ON CONSTRAINT "__declared_validate_responses_fk_node_gou62skqks" ON "qti"."declared_validate_responses" IS 'foreign key DeclaredValidateResponses(node) to ItemSessionControl(id)';

COMMENT ON CONSTRAINT "__declared_with_replacement_fk_node_7l4dagvl63" ON "qti"."declared_with_replacement" IS 'foreign key DeclaredWithReplacement(node) to Selection(id)';

COMMENT ON CONSTRAINT "__item_instance_spelling_fk_ref_cwg5en7npj" ON "qti"."item_instance_spelling" IS 'foreign key ItemInstanceSpelling(ref) to ItemInstanceVariableRef(id)';

COMMENT ON CONSTRAINT "__item_instance_variable_ref_fk_document_root_ofvjezmesk" ON "qti"."item_instance_variable_ref" IS 'foreign key ItemInstanceVariableRef(document, root) to Document(id, root)';

COMMENT ON CONSTRAINT "__item_instance_variable_ref_fk_id_tag_kind_item_nujqm3tjbc" ON "qti"."item_instance_variable_ref" IS 'foreign key ItemInstanceVariableRef(id, __tag_kind_item_instance_variable_qcrtkmyrc5) to VariableRef(id, kind)';

COMMENT ON CONSTRAINT "__item_instance_variable_ref_fk_id_document_xt5obcyyex" ON "qti"."item_instance_variable_ref" IS 'foreign key ItemInstanceVariableRef(id, document) to VariableRef(id, document)';

COMMENT ON CONSTRAINT "__item_ref_fk_id_d7cytkspkn" ON "qti"."item_ref" IS 'foreign key ItemRef(id) to ItemRefResolution(itemRef)';

COMMENT ON CONSTRAINT "__item_ref_fk_id_tag_kind_qti_assessment_item_ref_dqx2o4etdf" ON "qti"."item_ref" IS 'foreign key ItemRef(id, __tag_kind_qti_assessment_item_ref_hps2s36don) to Node(id, kind)';

COMMENT ON CONSTRAINT "__item_ref_fk_id_document_6rdgeo5bbx" ON "qti"."item_ref" IS 'foreign key ItemRef(id, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__item_ref_fk_id_document_identifier_tag_holder_kind_vrjcbdmcoo" ON "qti"."item_ref" IS 'foreign key ItemRef(id, document, identifier, __tag_holder_kind_item_ref_kytin3i6mz) to TestIdentifier(holder, scope, identifier, holderKind)';

COMMENT ON CONSTRAINT "__item_ref_category_fk_node_arprgxmzyp" ON "qti"."item_ref_category" IS 'foreign key ItemRefCategory(node) to ItemRef(id)';

COMMENT ON CONSTRAINT "__item_ref_document_fk_item_ref_tag_target_kind_item_r2rztuxeyy" ON "qti"."item_ref_document" IS 'foreign key ItemRefDocument(itemRef, __tag_target_kind_item_fgwqiexuve) to ItemRefResolution(itemRef, targetKind)';

COMMENT ON CONSTRAINT "__item_ref_document_fk_package_path_document_tag_g7fzwy3wnr" ON "qti"."item_ref_document" IS 'foreign key ItemRefDocument(package, path, document, __tag_root_item_wlk5is6qw7) to Document(package, path, id, root)';

COMMENT ON CONSTRAINT "__item_ref_lti_fk_item_ref_tag_target_kind_lti_ahi_4_wsjdzoiany" ON "qti"."item_ref_lti" IS 'foreign key ItemRefLti(itemRef, __tag_target_kind_lti_ahi4eitc7u) to ItemRefResolution(itemRef, targetKind)';

COMMENT ON CONSTRAINT "__item_ref_lti_fk_package_resource_type_i5xl5wl6m4" ON "qti"."item_ref_lti" IS 'foreign key ItemRefLti(package, resource, type) to Resource(package, identifier, type)';

COMMENT ON CONSTRAINT "__item_session_control_fk_id_tag_kind_qti_item_ocprl5zirn" ON "qti"."item_session_control" IS 'foreign key ItemSessionControl(id, __tag_kind_qti_item_session_control_ypl7kurks7) to Node(id, kind)';

COMMENT ON CONSTRAINT "__item_session_max_attempts_fk_node_fbrvpbaohd" ON "qti"."item_session_max_attempts" IS 'foreign key ItemSessionMaxAttempts(node) to ItemSessionControl(id)';

COMMENT ON CONSTRAINT "__item_stimulus_ref_fk_id_7unmkj5azf" ON "qti"."item_stimulus_ref" IS 'foreign key ItemStimulusRef(id) to StimulusRefResolution(stimulusRef)';

COMMENT ON CONSTRAINT "__item_stimulus_ref_fk_id_tag_kind_qti_assessment_3aoqf5icsk" ON "qti"."item_stimulus_ref" IS 'foreign key ItemStimulusRef(id, __tag_kind_qti_assessment_stimulus_ref_jw5j27wnfb) to Node(id, kind)';

COMMENT ON CONSTRAINT "__item_stimulus_ref_fk_id_document_q5h5dslt5n" ON "qti"."item_stimulus_ref" IS 'foreign key ItemStimulusRef(id, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__item_stimulus_ref_title_fk_node_xdnfokhyi4" ON "qti"."item_stimulus_ref_title" IS 'foreign key ItemStimulusRefTitle(node) to ItemStimulusRef(id)';

COMMENT ON CONSTRAINT "__item_tool_fk_tree_root_rm5pqjt3eq" ON "qti"."item_tool" IS 'foreign key ItemTool(tree, root) to Tree(id, root)';

COMMENT ON CONSTRAINT "__item_variable_ref_fk_document_root_mc5exrqoht" ON "qti"."item_variable_ref" IS 'foreign key ItemVariableRef(document, root) to Document(id, root)';

COMMENT ON CONSTRAINT "__item_variable_ref_fk_id_tag_kind_item_variable_5_65d3gig4kc" ON "qti"."item_variable_ref" IS 'foreign key ItemVariableRef(id, __tag_kind_item_variable_5wfcxwh5gq) to VariableRef(id, kind)';

COMMENT ON CONSTRAINT "__item_variable_ref_fk_id_document_msbj54vwcn" ON "qti"."item_variable_ref" IS 'foreign key ItemVariableRef(id, document) to VariableRef(id, document)';

COMMENT ON CONSTRAINT "__metadata_ref_fk_id_tag_kind_qti_metadata_ref_2_v7dzo3iobx" ON "qti"."metadata_ref" IS 'foreign key MetadataRef(id, __tag_kind_qti_metadata_ref_2foxgesdiw) to Node(id, kind)';

COMMENT ON CONSTRAINT "__ordering_fk_id_tag_kind_qti_ordering_ezmnthie_6_z_3nt4l6bph5" ON "qti"."ordering" IS 'foreign key Ordering(id, __tag_kind_qti_ordering_ezmnthie6z) to Node(id, kind)';

COMMENT ON CONSTRAINT "__pre_condition_fk_id_owt7wt3snh" ON "qti"."pre_condition" IS 'foreign key PreCondition(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__pre_condition_fk_id_tag_kind_qti_pre_condition_zgpcmrgbyr" ON "qti"."pre_condition" IS 'foreign key PreCondition(id, __tag_kind_qti_pre_condition_mirfvuo5br) to Node(id, kind)';

COMMENT ON CONSTRAINT "__prefixed_built_in_fk_ref_test_5qr25gph2w" ON "qti"."prefixed_built_in" IS 'foreign key PrefixedBuiltIn(ref, test) to PrefixedVariableSource(ref, test)';

COMMENT ON CONSTRAINT "__prefixed_built_in_fk_ref_test_tag_source_built_in_qq66q4pxo2" ON "qti"."prefixed_built_in" IS 'foreign key PrefixedBuiltIn(ref, test, __tag_source_built_in_win2m4ydys) to PrefixedVariableSource(ref, test, source)';

COMMENT ON CONSTRAINT "__prefixed_declared_fk_item_document_variable_inwyfa7obs" ON "qti"."prefixed_declared" IS 'foreign key PrefixedDeclared(itemDocument, variable) to Declaration(document, identifier)';

COMMENT ON CONSTRAINT "__prefixed_declared_fk_ref_test_tag_source_declared_c4jbs5vof6" ON "qti"."prefixed_declared" IS 'foreign key PrefixedDeclared(ref, test, __tag_source_declared_sdgzhu26kd) to PrefixedVariableSource(ref, test, source)';

COMMENT ON CONSTRAINT "__prefixed_declared_fk_ref_test_item_document_xrdhmouvzq" ON "qti"."prefixed_declared" IS 'foreign key PrefixedDeclared(ref, test, itemDocument) to PrefixedVariableSource(ref, test, itemDocument)';

COMMENT ON CONSTRAINT "__prefixed_mapped_fk_item_ref_variable_pgztzkshez" ON "qti"."prefixed_mapped" IS 'foreign key PrefixedMapped(itemRef, variable) to VariableMapping(itemRef, target)';

COMMENT ON CONSTRAINT "__prefixed_mapped_fk_ref_test_tag_source_mapped_p_7_ue3ctruhxf" ON "qti"."prefixed_mapped" IS 'foreign key PrefixedMapped(ref, test, __tag_source_mapped_p7vxvhg6f7) to PrefixedVariableSource(ref, test, source)';

COMMENT ON CONSTRAINT "__prefixed_mapped_fk_ref_test_item_ref_nq7ufyzjbw" ON "qti"."prefixed_mapped" IS 'foreign key PrefixedMapped(ref, test, itemRef) to PrefixedVariableSource(ref, test, itemRef)';

COMMENT ON CONSTRAINT "__prefixed_variable_source_fk_item_ref_item_document_47qdqtw7xs" ON "qti"."prefixed_variable_source" IS 'foreign key PrefixedVariableSource(itemRef, itemDocument) to ItemRefDocument(itemRef, document)';

COMMENT ON CONSTRAINT "__prefixed_variable_source_fk_ref_document_ref_kind_czgwgrhkow" ON "qti"."prefixed_variable_source" IS 'foreign key PrefixedVariableSource(ref, document, refKind) to VariableRef(id, document, kind)';

COMMENT ON CONSTRAINT "__prefixed_variable_source_fk_test_document_ii5ueod7q7" ON "qti"."prefixed_variable_source" IS 'foreign key PrefixedVariableSource(test, document) to TestDocument(test, document)';

COMMENT ON CONSTRAINT "__prefixed_variable_source_fk_test_prefix_item_ref_uijmttt2yl" ON "qti"."prefixed_variable_source" IS 'foreign key PrefixedVariableSource(test, prefix, itemRef, __tag_holder_kind_item_ref_47sb5enwfv) to TestReach(test, identifier, holder, holderKind)';

COMMENT ON CONSTRAINT "__required_child_fk_child_parent_alzlotpv3e" ON "qti"."required_child" IS 'foreign key RequiredChild(child, parent) to StructureChild(child, parent)';

COMMENT ON CONSTRAINT "__section_duration_ref_fk_document_root_ozx3nmy5tv" ON "qti"."section_duration_ref" IS 'foreign key SectionDurationRef(document, root) to Document(id, root)';

COMMENT ON CONSTRAINT "__section_duration_ref_fk_id_tag_kind_section_2vxs2i35tq" ON "qti"."section_duration_ref" IS 'foreign key SectionDurationRef(id, __tag_kind_section_duration_db6nf7nxso) to VariableRef(id, kind)';

COMMENT ON CONSTRAINT "__section_duration_ref_fk_id_document_66a5gknmm2" ON "qti"."section_duration_ref" IS 'foreign key SectionDurationRef(id, document) to VariableRef(id, document)';

COMMENT ON CONSTRAINT "__section_duration_target_fk_ref_document_ref_kind_qd42khjdia" ON "qti"."section_duration_target" IS 'foreign key SectionDurationTarget(ref, document, refKind) to VariableRef(id, document, kind)';

COMMENT ON CONSTRAINT "__section_duration_target_fk_test_document_fj2fdcto24" ON "qti"."section_duration_target" IS 'foreign key SectionDurationTarget(test, document) to TestDocument(test, document)';

COMMENT ON CONSTRAINT "__section_duration_target_fk_test_prefix_holder_c32getcrfh" ON "qti"."section_duration_target" IS 'foreign key SectionDurationTarget(test, prefix, holder, holderKind) to TestReach(test, identifier, holder, holderKind)';

COMMENT ON CONSTRAINT "__section_feedback_outcome_ref_fk_node_document_ylrb4cqrsu" ON "qti"."section_feedback_outcome_ref" IS 'foreign key SectionFeedbackOutcomeRef(node, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__section_feedback_outcome_ref_fk_test_document_xtcs3bivmt" ON "qti"."section_feedback_outcome_ref" IS 'foreign key SectionFeedbackOutcomeRef(test, document) to TestDocument(test, document)';

COMMENT ON CONSTRAINT "__section_feedback_outcome_ref_fk_test_identifier_xri4lfor3m" ON "qti"."section_feedback_outcome_ref" IS 'foreign key SectionFeedbackOutcomeRef(test, identifier, __tag_kind_outcome_glkysklooj) to Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__section_feedback_outcome_ref_fk_test_identifier_wfoetpeafk" ON "qti"."section_feedback_outcome_ref" IS 'foreign key SectionFeedbackOutcomeRef(test, identifier, baseType, cardinality) to TypedDeclaration(document, identifier, baseType, cardinality)';

COMMENT ON CONSTRAINT "__section_identifier_target_fk_node_document_dugrmkicjj" ON "qti"."section_identifier_target" IS 'foreign key SectionIdentifierTarget(node, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__section_identifier_target_fk_test_document_bolwbicr3l" ON "qti"."section_identifier_target" IS 'foreign key SectionIdentifierTarget(test, document) to TestDocument(test, document)';

COMMENT ON CONSTRAINT "__section_identifier_target_fk_test_identifier_jrjh43vn62" ON "qti"."section_identifier_target" IS 'foreign key SectionIdentifierTarget(test, identifier, holderKind) to TestReach(test, identifier, holderKind)';

COMMENT ON CONSTRAINT "__section_printed_variable_ref_fk_node_ipcvguop2i" ON "qti"."section_printed_variable_ref" IS 'foreign key SectionPrintedVariableRef(node) to PrintedVariable(id)';

COMMENT ON CONSTRAINT "__section_printed_variable_ref_fk_node_document_xhginqlb26" ON "qti"."section_printed_variable_ref" IS 'foreign key SectionPrintedVariableRef(node, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__section_printed_variable_ref_fk_test_document_agvttrxzgm" ON "qti"."section_printed_variable_ref" IS 'foreign key SectionPrintedVariableRef(test, document) to TestDocument(test, document)';

COMMENT ON CONSTRAINT "__section_printed_variable_ref_fk_test_identifier_owktrww3x7" ON "qti"."section_printed_variable_ref" IS 'foreign key SectionPrintedVariableRef(test, identifier, kind) to Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__section_printed_variable_var_ref_fk_node_fjcsnvi34g" ON "qti"."section_printed_variable_var_ref" IS 'foreign key SectionPrintedVariableVarRef(node) to PrintedVariable(id)';

COMMENT ON CONSTRAINT "__section_printed_variable_var_ref_fk_node_document_7ickzlz2r7" ON "qti"."section_printed_variable_var_ref" IS 'foreign key SectionPrintedVariableVarRef(node, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__section_printed_variable_var_ref_fk_test_document_mifjsz7qjp" ON "qti"."section_printed_variable_var_ref" IS 'foreign key SectionPrintedVariableVarRef(test, document) to TestDocument(test, document)';

COMMENT ON CONSTRAINT "__section_printed_variable_var_ref_fk_test_tttvns47ev" ON "qti"."section_printed_variable_var_ref" IS 'foreign key SectionPrintedVariableVarRef(test, identifier, baseType, cardinality) to TypedDeclaration(document, identifier, baseType, cardinality)';

COMMENT ON CONSTRAINT "__section_printed_variable_var_ref_fk_test_s7lbionwp2" ON "qti"."section_printed_variable_var_ref" IS 'foreign key SectionPrintedVariableVarRef(test, identifier, kind) to Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__section_ref_fk_id_wz4ambuxob" ON "qti"."section_ref" IS 'foreign key SectionRef(id) to SectionRefResolution(sectionRef)';

COMMENT ON CONSTRAINT "__section_ref_fk_id_tag_kind_qti_assessment_section_zgxbrsf7nw" ON "qti"."section_ref" IS 'foreign key SectionRef(id, __tag_kind_qti_assessment_section_ref_uewqzx3v4v) to Node(id, kind)';

COMMENT ON CONSTRAINT "__section_ref_fk_id_document_lmg7xvoguq" ON "qti"."section_ref" IS 'foreign key SectionRef(id, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__section_ref_fk_id_document_identifier_tag_holder_kkyzqvky7c" ON "qti"."section_ref" IS 'foreign key SectionRef(id, document, identifier, __tag_holder_kind_section_ref_fcqoid3ohb) to TestIdentifier(holder, scope, identifier, holderKind)';

COMMENT ON CONSTRAINT "__section_ref_resolution_fk_package_path_document_oopepaskg4" ON "qti"."section_ref_resolution" IS 'foreign key SectionRefResolution(package, path, document, __tag_root_section_pd2d4gcywn) to Document(package, path, id, root)';

COMMENT ON CONSTRAINT "__section_variable_declared_fk_ref_identifier_lamzsq7muy" ON "qti"."section_variable_declared" IS 'foreign key SectionVariableDeclared(ref, identifier, referrerKind) to SectionVariableRef(id, identifier, referrerKind)';

COMMENT ON CONSTRAINT "__section_variable_declared_fk_ref_test_tag_target_3k4i5t4xob" ON "qti"."section_variable_declared" IS 'foreign key SectionVariableDeclared(ref, test, __tag_target_declared_ilhuctesh5) to SectionVariableResolution(ref, test, target)';

COMMENT ON CONSTRAINT "__section_variable_declared_fk_test_identifier_vcwswlwcpv" ON "qti"."section_variable_declared" IS 'foreign key SectionVariableDeclared(test, identifier, declarationKind) to Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__section_variable_duration_fk_ref_test_tag_ref_kind_b4gpjjltdu" ON "qti"."section_variable_duration" IS 'foreign key SectionVariableDuration(ref, test, __tag_ref_kind_section_variable_jo65257ny5) to SectionDurationTarget(ref, test, refKind)';

COMMENT ON CONSTRAINT "__section_variable_duration_fk_ref_test_tag_target_jbcviedghu" ON "qti"."section_variable_duration" IS 'foreign key SectionVariableDuration(ref, test, __tag_target_duration_l44yrac3hq) to SectionVariableResolution(ref, test, target)';

COMMENT ON CONSTRAINT "__section_variable_prefixed_fk_ref_test_tag_ref_kind_exbsmf64i6" ON "qti"."section_variable_prefixed" IS 'foreign key SectionVariablePrefixed(ref, test, __tag_ref_kind_section_variable_lyjzdtqixu) to PrefixedVariableSource(ref, test, refKind)';

COMMENT ON CONSTRAINT "__section_variable_prefixed_fk_ref_test_tag_target_ap7loacchy" ON "qti"."section_variable_prefixed" IS 'foreign key SectionVariablePrefixed(ref, test, __tag_target_prefixed_gqdv7vjzm6) to SectionVariableResolution(ref, test, target)';

COMMENT ON CONSTRAINT "__section_variable_ref_fk_document_root_asneowfexm" ON "qti"."section_variable_ref" IS 'foreign key SectionVariableRef(document, root) to Document(id, root)';

COMMENT ON CONSTRAINT "__section_variable_ref_fk_id_tag_kind_section_a7yksf5q6v" ON "qti"."section_variable_ref" IS 'foreign key SectionVariableRef(id, __tag_kind_section_variable_xx6oynyexh) to VariableRef(id, kind)';

COMMENT ON CONSTRAINT "__section_variable_ref_fk_id_document_irnnkqvd6a" ON "qti"."section_variable_ref" IS 'foreign key SectionVariableRef(id, document) to VariableRef(id, document)';

COMMENT ON CONSTRAINT "__section_variable_ref_fk_id_referrer_kind_yiq5q7mez5" ON "qti"."section_variable_ref" IS 'foreign key SectionVariableRef(id, referrerKind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__section_variable_resolution_fk_ref_document_2umbbm7wrj" ON "qti"."section_variable_resolution" IS 'foreign key SectionVariableResolution(ref, document) to SectionVariableRef(id, document)';

COMMENT ON CONSTRAINT "__section_variable_resolution_fk_test_document_5pp6l25ag4" ON "qti"."section_variable_resolution" IS 'foreign key SectionVariableResolution(test, document) to TestDocument(test, document)';

COMMENT ON CONSTRAINT "__selection_fk_id_tag_kind_qti_selection_lyq_6_lq_42_jjiiax7hc5" ON "qti"."selection" IS 'foreign key Selection(id, __tag_kind_qti_selection_lyq6lq42ud) to Node(id, kind)';

COMMENT ON CONSTRAINT "__selection_fk_id_section_pz3na2tp7y" ON "qti"."selection" IS 'foreign key Selection(id, section) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__selection_fk_section_u4rh3bzq6c" ON "qti"."selection" IS 'foreign key Selection(section) to AssessmentSection(id)';

COMMENT ON CONSTRAINT "__selection_bounded_fk_section_select_with_hnuiz5gkum" ON "qti"."selection_bounded" IS 'foreign key SelectionBounded(section, select, withReplacement) to Selection(section, select, withReplacement)';

COMMENT ON CONSTRAINT "__stimulus_body_fk_id_tag_kind_qti_stimulus_body_lhe_gm4xfjlslf" ON "qti"."stimulus_body" IS 'foreign key StimulusBody(id, __tag_kind_qti_stimulus_body_lhe3p2vmfc) to Node(id, kind)';

COMMENT ON CONSTRAINT "__stimulus_body_fk_id_version_ylbpeoq5n5" ON "qti"."stimulus_body" IS 'foreign key StimulusBody(id, version) to Node(id, version)';

COMMENT ON CONSTRAINT "__stimulus_ref_resolution_fk_package_path_document_y2m5ujbqj2" ON "qti"."stimulus_ref_resolution" IS 'foreign key StimulusRefResolution(package, path, document, __tag_root_stimulus_fnlqquajeh) to Document(package, path, id, root)';

COMMENT ON CONSTRAINT "__structure_child_fk_child_parent_cvhb6trpmu" ON "qti"."structure_child" IS 'foreign key StructureChild(child, parent) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__template_default_fk_id_t7ffdpkm46" ON "qti"."template_default" IS 'foreign key TemplateDefault(id) to RuleOperand(rule)';

COMMENT ON CONSTRAINT "__template_default_fk_id_tag_kind_qti_template_t2svvto6z2" ON "qti"."template_default" IS 'foreign key TemplateDefault(id, __tag_kind_qti_template_default_h5uiey2hdf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_default_fk_id_item_ref_ijysjrlgao" ON "qti"."template_default" IS 'foreign key TemplateDefault(id, itemRef) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__template_default_fk_item_document_template_egkt75syoy" ON "qti"."template_default" IS 'foreign key TemplateDefault(itemDocument, templateIdentifier, __tag_kind_template_6mdj2h4ofc) to Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__template_default_fk_item_ref_item_document_5co3ssudik" ON "qti"."template_default" IS 'foreign key TemplateDefault(itemRef, itemDocument) to ItemRefDocument(itemRef, document)';

COMMENT ON CONSTRAINT "__test_document_fk_document_5gtbrbaa5d" ON "qti"."test_document" IS 'foreign key TestDocument(document) to Document(id)';

COMMENT ON CONSTRAINT "__test_document_fk_test_tag_root_test_sfpw_7_z_7_lis_yexgdj4pib" ON "qti"."test_document" IS 'foreign key TestDocument(test, __tag_root_test_sfpw7z7lis) to Document(id, root)';

COMMENT ON CONSTRAINT "__test_feedback_fk_id_tag_kind_qti_test_feedback_hrn5bkzlzb" ON "qti"."test_feedback" IS 'foreign key TestFeedback(id, __tag_kind_qti_test_feedback_oicqmodm6p) to Node(id, kind)';

COMMENT ON CONSTRAINT "__test_feedback_content_body_fk_id_tag_kind_qti_uz4ffaszwu" ON "qti"."test_feedback_content_body" IS 'foreign key TestFeedbackContentBody(id, __tag_kind_qti_content_body_test_feedback_62lcd5o5q3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__test_feedback_title_fk_node_cj4xxgqkn4" ON "qti"."test_feedback_title" IS 'foreign key TestFeedbackTitle(node) to TestFeedback(id)';

COMMENT ON CONSTRAINT "__test_part_fk_id_tag_kind_qti_test_part_ewahlzefvg_kbu5u3bo55" ON "qti"."test_part" IS 'foreign key TestPart(id, __tag_kind_qti_test_part_ewahlzefvg) to Node(id, kind)';

COMMENT ON CONSTRAINT "__test_part_fk_id_document_n3waf5laig" ON "qti"."test_part" IS 'foreign key TestPart(id, document) to Node(id, tree)';

COMMENT ON CONSTRAINT "__test_part_fk_id_document_identifier_tag_holder_oome6y2g52" ON "qti"."test_part" IS 'foreign key TestPart(id, document, identifier, __tag_holder_kind_part_e5bqbqbrvc) to TestIdentifier(holder, scope, identifier, holderKind)';

COMMENT ON CONSTRAINT "__test_part_title_fk_node_olhvteatof" ON "qti"."test_part_title" IS 'foreign key TestPartTitle(node) to TestPart(id)';

COMMENT ON CONSTRAINT "__test_reach_fk_holder_identifier_holder_kind_tv3jcjxydp" ON "qti"."test_reach" IS 'foreign key TestReach(holder, identifier, holderKind) to TestIdentifier(holder, identifier, holderKind)';

COMMENT ON CONSTRAINT "__test_rubric_block_fk_id_tag_kind_qti_rubric_block_vjcs4juji4" ON "qti"."test_rubric_block" IS 'foreign key TestRubricBlock(id, __tag_kind_qti_rubric_block_test_qk6ijn65fj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__test_rubric_block_use_fk_node_q3vbz7g4am" ON "qti"."test_rubric_block_use" IS 'foreign key TestRubricBlockUse(node) to TestRubricBlock(id)';

COMMENT ON CONSTRAINT "__test_rubric_content_body_fk_id_tag_kind_qti_ko637gmlcz" ON "qti"."test_rubric_content_body" IS 'foreign key TestRubricContentBody(id, __tag_kind_qti_content_body_test_rubric_jaxkcc3se5) to Node(id, kind)';

COMMENT ON CONSTRAINT "__time_limit_max_fk_node_sgmt3cdkee" ON "qti"."time_limit_max" IS 'foreign key TimeLimitMax(node) to TimeLimits(id)';

COMMENT ON CONSTRAINT "__time_limit_min_fk_node_bcc3u7h7nk" ON "qti"."time_limit_min" IS 'foreign key TimeLimitMin(node) to TimeLimits(id)';

COMMENT ON CONSTRAINT "__time_limits_fk_id_tag_kind_qti_time_limits_343_i2hwirr264" ON "qti"."time_limits" IS 'foreign key TimeLimits(id, __tag_kind_qti_time_limits_343jhkovjf) to Node(id, kind)';

COMMENT ON CONSTRAINT "__usage_data_ref_fk_id_tag_kind_qti_usagedata_ref_75_rntj2zbghz" ON "qti"."usage_data_ref" IS 'foreign key UsageDataRef(id, __tag_kind_qti_usagedata_ref_75tpeijppj) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variable_mapping_fk_id_tag_kind_qti_variable_mydywv4uw5" ON "qti"."variable_mapping" IS 'foreign key VariableMapping(id, __tag_kind_qti_variable_mapping_scg2kyf6y2) to Node(id, kind)';

COMMENT ON CONSTRAINT "__variable_mapping_fk_id_item_ref_o2cql24jmm" ON "qti"."variable_mapping" IS 'foreign key VariableMapping(id, itemRef) to Edge(child, parent)';

COMMENT ON CONSTRAINT "__variable_mapping_fk_item_document_source_tag_kind_n2qdj5qwnp" ON "qti"."variable_mapping" IS 'foreign key VariableMapping(itemDocument, source, __tag_kind_outcome_glkysklooj) to Declaration(document, identifier, kind)';

COMMENT ON CONSTRAINT "__variable_mapping_fk_item_ref_item_document_bngrwytn7a" ON "qti"."variable_mapping" IS 'foreign key VariableMapping(itemRef, itemDocument) to ItemRefDocument(itemRef, document)';

COMMENT ON CONSTRAINT "__weight_fk_id_tag_kind_qti_weight_ecqobu_7_wca_23ddr7l3si" ON "qti"."weight" IS 'foreign key Weight(id, __tag_kind_qti_weight_ecqobu7wca) to Node(id, kind)';

COMMENT ON CONSTRAINT "__weight_fk_id_item_ref_bkjvnjywlp" ON "qti"."weight" IS 'foreign key Weight(id, itemRef) to Edge(child, parent)';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_adaptive_engine_ref_ed3qneoy7l" IS 'unique index Edge(parent) where childKind = qti-adaptive-engine-ref, parentKind = qti-adaptive-selection';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_adaptive_selection_vhzws63pm6" IS 'unique index Edge(parent) where childKind = qti-adaptive-selection, parentKind = qti-assessment-section';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_adaptive_settings_avfgcpgpqy" IS 'unique index Edge(parent) where childKind = qti-adaptive-settings-ref, parentKind = qti-adaptive-selection';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_content_body_test_cfxli3u5nd" IS 'unique index Edge(parent) where childKind = qti-content-body.testFeedback, parentKind = qti-test-feedback';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_content_body_test_3xzjhtdflh" IS 'unique index Edge(parent) where childKind = qti-content-body.testRubric, parentKind = qti-rubric-block.test';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_item_session_t6yxuph25o" IS 'unique index Edge(parent) where childKind = qti-item-session-control, parentKind = qti-assessment-item-ref';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_item_session_zf4ruka3xr" IS 'unique index Edge(parent) where childKind = qti-item-session-control, parentKind = qti-assessment-section';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_item_session_l3euvnzdao" IS 'unique index Edge(parent) where childKind = qti-item-session-control, parentKind = qti-test-part';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_metadata_ref_parent_nl7qlq3xin" IS 'unique index Edge(parent) where childKind = qti-metadata-ref, parentKind = qti-adaptive-selection';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_ordering_parent_xxpybj5ldg" IS 'unique index Edge(parent) where childKind = qti-ordering, parentKind = qti-assessment-section';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_outcome_processing_mejtffy45c" IS 'unique index Edge(parent) where childKind = qti-outcome-processing, parentKind = qti-assessment-test';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_selection_parent_nfzawkbl7h" IS 'unique index Edge(parent) where childKind = qti-selection, parentKind = qti-assessment-section';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_stimulus_body_3ee5ghky5n" IS 'unique index Edge(parent) where childKind = qti-stimulus-body, parentKind = qti-assessment-stimulus';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_z6y3ahhfb3" IS 'unique index Edge(parent) where childKind = qti-time-limits, parentKind = qti-assessment-item-ref';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_tovmyn7ugg" IS 'unique index Edge(parent) where childKind = qti-time-limits, parentKind = qti-assessment-section';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_th7fnj7q2s" IS 'unique index Edge(parent) where childKind = qti-time-limits, parentKind = qti-assessment-test';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_s7iuydj4ez" IS 'unique index Edge(parent) where childKind = qti-time-limits, parentKind = qti-test-part';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_qti_usagedata_ref_r7ttxsaugl" IS 'unique index Edge(parent) where childKind = qti-usagedata-ref, parentKind = qti-adaptive-selection';

COMMENT ON INDEX "qti"."__assessment_item_label_ix_tree_root_qgbzvdnhrb" IS 'btree index AssessmentItemLabel(tree, root)';

COMMENT ON INDEX "qti"."__attribute_file_reference_ix_document_package_xqjfmjx3fk" IS 'btree index AttributeFileReference(document, package)';

COMMENT ON INDEX "qti"."__attribute_file_reference_ix_kind_attribute_nor5wfnits" IS 'btree index AttributeFileReference(kind, attribute)';

COMMENT ON INDEX "qti"."__attribute_file_reference_ix_node_document_ea3spa7qs5" IS 'btree index AttributeFileReference(node, document)';

COMMENT ON INDEX "qti"."__attribute_file_reference_ix_node_kind_pgf43eid2f" IS 'btree index AttributeFileReference(node, kind)';

COMMENT ON INDEX "qti"."__attribute_file_reference_ix_package_path_rk3bsveubk" IS 'btree index AttributeFileReference(package, path)';

COMMENT ON INDEX "qti"."__branch_rule_ix_owner_owner_kind_item_ref_7gsisg5fta" IS 'btree index BranchRule(owner) where ownerKind = itemRef';

COMMENT ON INDEX "qti"."__branch_rule_ix_owner_owner_kind_part_gpsj4nncy6" IS 'btree index BranchRule(owner) where ownerKind = part';

COMMENT ON INDEX "qti"."__branch_rule_ix_owner_owner_kind_section_uchby3vxqa" IS 'btree index BranchRule(owner) where ownerKind = section';

COMMENT ON INDEX "qti"."__branch_rule_target_ix_scope_identifier_holder_kind_5rxvgeh7a7" IS 'btree index BranchRuleTarget(scope, identifier, holderKind)';

COMMENT ON INDEX "qti"."__item_instance_variable_ref_ix_document_root_i3vut24eoj" IS 'btree index ItemInstanceVariableRef(document, root)';

COMMENT ON INDEX "qti"."__item_ref_document_ix_package_path_document_tu47evbzrd" IS 'btree index ItemRefDocument(package, path, document)';

COMMENT ON INDEX "qti"."__item_ref_lti_ix_package_resource_type_3dfjpcfox6" IS 'btree index ItemRefLti(package, resource, type)';

COMMENT ON INDEX "qti"."__item_variable_ref_ix_document_root_fr4hivhfgo" IS 'btree index ItemVariableRef(document, root)';

COMMENT ON INDEX "qti"."__node_xml_lang_ix_tree_value_root_kind_test_sexcekmchw" IS 'btree index NodeXmlLang(tree, value) where rootKind = test';

COMMENT ON INDEX "qti"."__prefixed_declared_ix_item_document_variable_kd6n5exnii" IS 'btree index PrefixedDeclared(itemDocument, variable)';

COMMENT ON INDEX "qti"."__prefixed_mapped_ix_item_ref_variable_jaimn6vqc5" IS 'btree index PrefixedMapped(itemRef, variable)';

COMMENT ON INDEX "qti"."__prefixed_variable_source_ix_item_ref_item_document_2d3j5kxclt" IS 'btree index PrefixedVariableSource(itemRef, itemDocument)';

COMMENT ON INDEX "qti"."__prefixed_variable_source_ix_ref_document_ref_kind_er3hrlxzcg" IS 'btree index PrefixedVariableSource(ref, document, refKind)';

COMMENT ON INDEX "qti"."__prefixed_variable_source_ix_ref_prefix_ref_kind_epgkpxgbmf" IS 'btree index PrefixedVariableSource(ref, prefix) where refKind = itemInstanceVariable';

COMMENT ON INDEX "qti"."__prefixed_variable_source_ix_ref_prefix_ref_kind_ydu5xkvfh4" IS 'btree index PrefixedVariableSource(ref, prefix) where refKind = itemVariable';

COMMENT ON INDEX "qti"."__prefixed_variable_source_ix_test_document_wyur2w6qaj" IS 'btree index PrefixedVariableSource(test, document)';

COMMENT ON INDEX "qti"."__prefixed_variable_source_ix_test_prefix_item_ref_cx5zdn323i" IS 'btree index PrefixedVariableSource(test, prefix, itemRef)';

COMMENT ON INDEX "qti"."__required_child_ix_parent_ha3sthq6ck" IS 'btree index RequiredChild(parent)';

COMMENT ON INDEX "qti"."__section_duration_ref_ix_document_root_mowdor6fsj" IS 'btree index SectionDurationRef(document, root)';

COMMENT ON INDEX "qti"."__section_duration_target_ix_ref_document_prefix_ref_z2os4vz6tf" IS 'btree index SectionDurationTarget(ref, document, prefix) where refKind = sectionDuration';

COMMENT ON INDEX "qti"."__section_duration_target_ix_ref_document_ref_kind_u2jcz6fkdu" IS 'btree index SectionDurationTarget(ref, document, refKind)';

COMMENT ON INDEX "qti"."__section_duration_target_ix_test_document_aoezj4mdjk" IS 'btree index SectionDurationTarget(test, document)';

COMMENT ON INDEX "qti"."__section_duration_target_ix_test_prefix_holder_ighcamapej" IS 'btree index SectionDurationTarget(test, prefix, holder, holderKind)';

COMMENT ON INDEX "qti"."__section_feedback_outcome_ref_ix_node_document_2rbti3qtvq" IS 'btree index SectionFeedbackOutcomeRef(node, document)';

COMMENT ON INDEX "qti"."__section_feedback_outcome_ref_ix_test_document_3bo4sifs67" IS 'btree index SectionFeedbackOutcomeRef(test, document)';

COMMENT ON INDEX "qti"."__section_feedback_outcome_ref_ix_test_identifier_xlbzontcma" IS 'btree index SectionFeedbackOutcomeRef(test, identifier, baseType, cardinality)';

COMMENT ON INDEX "qti"."__section_identifier_target_ix_node_document_vjq5gwjmci" IS 'btree index SectionIdentifierTarget(node, document)';

COMMENT ON INDEX "qti"."__section_identifier_target_ix_test_document_j72pzqh3zr" IS 'btree index SectionIdentifierTarget(test, document)';

COMMENT ON INDEX "qti"."__section_identifier_target_ix_test_identifier_ztvictc2kw" IS 'btree index SectionIdentifierTarget(test, identifier, holderKind)';

COMMENT ON INDEX "qti"."__section_printed_variable_ref_ix_node_document_xshgjt7y5g" IS 'btree index SectionPrintedVariableRef(node, document)';

COMMENT ON INDEX "qti"."__section_printed_variable_ref_ix_test_document_qsyg4tkf7v" IS 'btree index SectionPrintedVariableRef(test, document)';

COMMENT ON INDEX "qti"."__section_printed_variable_ref_ix_test_identifier_4lxox3cb7t" IS 'btree index SectionPrintedVariableRef(test, identifier, kind)';

COMMENT ON INDEX "qti"."__section_printed_variable_var_ref_ix_node_document_7bilc3oegr" IS 'btree index SectionPrintedVariableVarRef(node, document)';

COMMENT ON INDEX "qti"."__section_printed_variable_var_ref_ix_test_document_ukgf3tvlt3" IS 'btree index SectionPrintedVariableVarRef(test, document)';

COMMENT ON INDEX "qti"."__section_printed_variable_var_ref_ix_test_zn7yzvfndz" IS 'btree index SectionPrintedVariableVarRef(test, identifier, baseType, cardinality)';

COMMENT ON INDEX "qti"."__section_printed_variable_var_ref_ix_test_vcxdcevmbm" IS 'btree index SectionPrintedVariableVarRef(test, identifier, kind)';

COMMENT ON INDEX "qti"."__section_ref_resolution_ix_package_path_document_qxkcx25v5s" IS 'btree index SectionRefResolution(package, path, document)';

COMMENT ON INDEX "qti"."__section_variable_declared_ix_ref_identifier_jves4xn4qp" IS 'btree index SectionVariableDeclared(ref, identifier, referrerKind)';

COMMENT ON INDEX "qti"."__section_variable_declared_ix_test_identifier_jstfondmin" IS 'btree index SectionVariableDeclared(test, identifier, declarationKind)';

COMMENT ON INDEX "qti"."__section_variable_ref_ix_document_root_fbv3ajznut" IS 'btree index SectionVariableRef(document, root)';

COMMENT ON INDEX "qti"."__section_variable_resolution_ix_ref_document_mx3p5rvxtq" IS 'btree index SectionVariableResolution(ref, document)';

COMMENT ON INDEX "qti"."__section_variable_resolution_ix_test_document_ls2rcciplu" IS 'btree index SectionVariableResolution(test, document)';

COMMENT ON INDEX "qti"."__stimulus_ref_resolution_ix_package_path_document_2l4r2v7qqk" IS 'btree index StimulusRefResolution(package, path, document)';

COMMENT ON INDEX "qti"."__structure_child_ix_parent_gg6he43n57" IS 'btree index StructureChild(parent)';

COMMENT ON INDEX "qti"."__template_default_ix_item_document_template_3q36k36wlr" IS 'btree index TemplateDefault(itemDocument, templateIdentifier)';

COMMENT ON INDEX "qti"."__template_default_ix_item_ref_item_document_bywsokisj7" IS 'btree index TemplateDefault(itemRef, itemDocument)';

COMMENT ON INDEX "qti"."__test_document_ix_document_pjcxx332km" IS 'btree index TestDocument(document)';

COMMENT ON INDEX "qti"."__test_reach_ix_holder_identifier_holder_kind_4zb2iau4lk" IS 'btree index TestReach(holder, identifier, holderKind)';

COMMENT ON INDEX "qti"."__variable_mapping_ix_item_document_source_t42n3arlmz" IS 'btree index VariableMapping(itemDocument, source)';

COMMENT ON INDEX "qti"."__variable_mapping_ix_item_ref_item_document_id2btkbw6z" IS 'btree index VariableMapping(itemRef, itemDocument)';

COMMENT ON TRIGGER "__law_node_kind_qti_adaptive_engine_ref_in_adaptive_23ljx24bzg" ON "qti"."adaptive_engine_ref" IS 'trigger of law Node(id) where kind = qti-adaptive-engine-ref in AdaptiveEngineRef(id), a mirrors half on AdaptiveEngineRef for DELETE';

COMMENT ON TRIGGER "__law_adaptive_selection_capacity_edge_bnmmpet3mi" ON "qti"."adaptive_selection" IS 'trigger of law capacity of AdaptiveSelection(id) over Edge(parent) where childKind = qti-adaptive-engine-ref, parentKind = qti-adaptive-selection within 1..1 on AdaptiveSelection for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_adaptive_selection_in_adaptive_apleeguoil" ON "qti"."adaptive_selection" IS 'trigger of law Node(id) where kind = qti-adaptive-selection in AdaptiveSelection(id), a mirrors half on AdaptiveSelection for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_adaptive_settings_ref_in_ympwnuhzr3" ON "qti"."adaptive_settings_ref" IS 'trigger of law Node(id) where kind = qti-adaptive-settings-ref in AdaptiveSettingsRef(id), a mirrors half on AdaptiveSettingsRef for DELETE';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_6ugqhr4qpj" ON "qti"."aria_activedescendant" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaActivedescendant(node) where kind = qti-stimulus-body within 0..0 on AriaActivedescendant for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_lihgdsoozw" ON "qti"."aria_atomic" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAtomic(node) where kind = qti-stimulus-body within 0..0 on AriaAtomic for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_76yun7errw" ON "qti"."aria_autocomplete" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAutocomplete(node) where kind = qti-stimulus-body within 0..0 on AriaAutocomplete for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_busy_3jwyxrvjzd" ON "qti"."aria_busy" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaBusy(node) where kind = qti-stimulus-body within 0..0 on AriaBusy for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_hlcrhsgois" ON "qti"."aria_checked" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaChecked(node) where kind = qti-stimulus-body within 0..0 on AriaChecked for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_qxs6dirujw" ON "qti"."aria_colcount" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColcount(node) where kind = qti-stimulus-body within 0..0 on AriaColcount for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_36ltgc22ut" ON "qti"."aria_colindex" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColindex(node) where kind = qti-stimulus-body within 0..0 on AriaColindex for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_d2fc4i3fz4" ON "qti"."aria_colspan" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColspan(node) where kind = qti-stimulus-body within 0..0 on AriaColspan for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_i3p7bxzjq6" ON "qti"."aria_controls" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaControls(node) where kind = qti-stimulus-body within 0..0 on AriaControls for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_izytegnmfn" ON "qti"."aria_current" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaCurrent(node) where kind = qti-stimulus-body within 0..0 on AriaCurrent for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_6nwq24uhyy" ON "qti"."aria_describedby" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDescribedby(node) where kind = qti-stimulus-body within 0..0 on AriaDescribedby for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_zwzaqs2t6w" ON "qti"."aria_details" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDetails(node) where kind = qti-stimulus-body within 0..0 on AriaDetails for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_gtmg6x6zlj" ON "qti"."aria_disabled" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDisabled(node) where kind = qti-stimulus-body within 0..0 on AriaDisabled for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_dv7gpf5lyu" ON "qti"."aria_errormessage" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaErrormessage(node) where kind = qti-stimulus-body within 0..0 on AriaErrormessage for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_mzxyg7z3ep" ON "qti"."aria_expanded" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaExpanded(node) where kind = qti-stimulus-body within 0..0 on AriaExpanded for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_jd3fqz4pbb" ON "qti"."aria_flowto" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaFlowto(node) where kind = qti-stimulus-body within 0..0 on AriaFlowto for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_4qlarata4f" ON "qti"."aria_haspopup" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHaspopup(node) where kind = qti-stimulus-body within 0..0 on AriaHaspopup for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_uko3lhxs3g" ON "qti"."aria_hidden" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHidden(node) where kind = qti-stimulus-body within 0..0 on AriaHidden for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_yvstt4issc" ON "qti"."aria_invalid" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaInvalid(node) where kind = qti-stimulus-body within 0..0 on AriaInvalid for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_nemlbpvaxa" ON "qti"."aria_keyshortcuts" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshortcuts(node) where kind = qti-stimulus-body within 0..0 on AriaKeyshortcuts for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_u3fgixagui" ON "qti"."aria_keyshorts" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshorts(node) where kind = qti-stimulus-body within 0..0 on AriaKeyshorts for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_sm5fkiq7h4" ON "qti"."aria_label" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabel(node) where kind = qti-stimulus-body within 0..0 on AriaLabel for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_js2n7zwbe3" ON "qti"."aria_labelledby" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabelledby(node) where kind = qti-stimulus-body within 0..0 on AriaLabelledby for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_5ddcucpfdy" ON "qti"."aria_level" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLevel(node) where kind = qti-stimulus-body within 0..0 on AriaLevel for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_live_u4x6wz2q7o" ON "qti"."aria_live" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLive(node) where kind = qti-stimulus-body within 0..0 on AriaLive for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_posowvctuq" ON "qti"."aria_modal" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaModal(node) where kind = qti-stimulus-body within 0..0 on AriaModal for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_ais6cs3gf6" ON "qti"."aria_multiline" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiline(node) where kind = qti-stimulus-body within 0..0 on AriaMultiline for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_eb2ogvergu" ON "qti"."aria_multiselectable" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiselectable(node) where kind = qti-stimulus-body within 0..0 on AriaMultiselectable for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_sm2efn4bqq" ON "qti"."aria_orientation" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOrientation(node) where kind = qti-stimulus-body within 0..0 on AriaOrientation for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_owns_kvhfaddb5e" ON "qti"."aria_owns" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOwns(node) where kind = qti-stimulus-body within 0..0 on AriaOwns for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_ibavb5sjnw" ON "qti"."aria_placeholder" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPlaceholder(node) where kind = qti-stimulus-body within 0..0 on AriaPlaceholder for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_llbdqdnvdl" ON "qti"."aria_posinset" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPosinset(node) where kind = qti-stimulus-body within 0..0 on AriaPosinset for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_vjlmacr4b3" ON "qti"."aria_pressed" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPressed(node) where kind = qti-stimulus-body within 0..0 on AriaPressed for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_zm3ns4po2b" ON "qti"."aria_readonly" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaReadonly(node) where kind = qti-stimulus-body within 0..0 on AriaReadonly for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_v7yecmub6a" ON "qti"."aria_relevant" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRelevant(node) where kind = qti-stimulus-body within 0..0 on AriaRelevant for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_rj3pyxiqhv" ON "qti"."aria_required" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRequired(node) where kind = qti-stimulus-body within 0..0 on AriaRequired for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_role_t3otinecv3" ON "qti"."aria_role" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRole(node) where kind = qti-stimulus-body within 0..0 on AriaRole for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_qgnwq7rnam" ON "qti"."aria_roledescription" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRoledescription(node) where kind = qti-stimulus-body within 0..0 on AriaRoledescription for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_4xl2ennbu5" ON "qti"."aria_rowcount" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowcount(node) where kind = qti-stimulus-body within 0..0 on AriaRowcount for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_c6ncmdfnn3" ON "qti"."aria_rowindex" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowindex(node) where kind = qti-stimulus-body within 0..0 on AriaRowindex for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_s22hmnno4a" ON "qti"."aria_rowspan" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowspan(node) where kind = qti-stimulus-body within 0..0 on AriaRowspan for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_bxrpyl5okj" ON "qti"."aria_selected" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSelected(node) where kind = qti-stimulus-body within 0..0 on AriaSelected for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_4552mbim5v" ON "qti"."aria_setsize" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSetsize(node) where kind = qti-stimulus-body within 0..0 on AriaSetsize for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_sort_omxq47gq7i" ON "qti"."aria_sort" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSort(node) where kind = qti-stimulus-body within 0..0 on AriaSort for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_m3gopevodc" ON "qti"."aria_valuemax" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemax(node) where kind = qti-stimulus-body within 0..0 on AriaValuemax for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_2mznbdmoqg" ON "qti"."aria_valuemin" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemin(node) where kind = qti-stimulus-body within 0..0 on AriaValuemin for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_3nm4hz5cr7" ON "qti"."aria_valuenow" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuenow(node) where kind = qti-stimulus-body within 0..0 on AriaValuenow for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_bxdto465ia" ON "qti"."aria_valuetext" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuetext(node) where kind = qti-stimulus-body within 0..0 on AriaValuetext for INSERT';

COMMENT ON TRIGGER "__law_item_tool_root_item_in_assessment_item_7fsoz3n36f" ON "qti"."assessment_item" IS 'trigger of law ItemTool(tree) where root = item in AssessmentItem(tree) on AssessmentItem for DELETE';

COMMENT ON TRIGGER "__law_assessment_item_label_root_item_version_3_0_1_kowlhsvifo" ON "qti"."assessment_item_label" IS 'trigger of law AssessmentItemLabel(tree) where root = item, version = 3.0.1 in ItemToolBoth(tree) on AssessmentItemLabel for INSERT';

COMMENT ON TRIGGER "__law_assessment_section_capacity_structure_child_k6js2xbtnj" ON "qti"."assessment_section" IS 'trigger of law capacity of AssessmentSection(id) over StructureChild(parent) within 1..* on AssessmentSection for INSERT';

COMMENT ON TRIGGER "__law_assessment_section_required_1_in_required_74ylj7rsnv" ON "qti"."assessment_section" IS 'trigger of law AssessmentSection(id) where required = 1 in RequiredChild(child) on AssessmentSection for INSERT';

COMMENT ON TRIGGER "__law_assessment_section_required_true_in_required_yvfhey6jkn" ON "qti"."assessment_section" IS 'trigger of law AssessmentSection(id) where required = true in RequiredChild(child) on AssessmentSection for INSERT';

COMMENT ON TRIGGER "__law_branch_rule_owner_kind_section_in_assessment_feq77u2nur" ON "qti"."assessment_section" IS 'trigger of law BranchRule(owner) where ownerKind = section in AssessmentSection(id) on AssessmentSection for DELETE';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_section_in_igq4vaka7f" ON "qti"."assessment_section" IS 'trigger of law TestIdentifier(holder) where holderKind = section in AssessmentSection(id) on AssessmentSection for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_section_in_assessment_tjxckxifnd" ON "qti"."assessment_section" IS 'trigger of law Node(id) where kind = qti-assessment-section in AssessmentSection(id), a mirrors half on AssessmentSection for DELETE';

COMMENT ON TRIGGER "__law_assessment_stimulus_capacity_edge_o6ptclyhzg" ON "qti"."assessment_stimulus" IS 'trigger of law capacity of AssessmentStimulus(id) over Edge(parent) where childKind = qti-stimulus-body, parentKind = qti-assessment-stimulus within 1..1 on AssessmentStimulus for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_stimulus_in_jo6xt6a2h4" ON "qti"."assessment_stimulus" IS 'trigger of law Node(id) where kind = qti-assessment-stimulus in AssessmentStimulus(id), a mirrors half on AssessmentStimulus for DELETE';

COMMENT ON TRIGGER "__law_assessment_test_capacity_edge_kcn3h53o7l" ON "qti"."assessment_test" IS 'trigger of law capacity of AssessmentTest(id) over Edge(parent) where childKind = qti-test-part, parentKind = qti-assessment-test within 1..* on AssessmentTest for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_test_in_assessment_djge65rszk" ON "qti"."assessment_test" IS 'trigger of law Node(id) where kind = qti-assessment-test in AssessmentTest(id), a mirrors half on AssessmentTest for DELETE';

COMMENT ON TRIGGER "__law_branch_rule_target_kind_alternatives_uglhwxg2o7" ON "qti"."branch_rule" IS 'trigger of law alternatives of BranchRule.targetKind on BranchRule for INSERT';

COMMENT ON TRIGGER "__law_branch_rule_owner_kind_item_ref_in_item_ref_kafz6d6xyw" ON "qti"."branch_rule" IS 'trigger of law BranchRule(owner) where ownerKind = itemRef in ItemRef(id) on BranchRule for INSERT';

COMMENT ON TRIGGER "__law_branch_rule_owner_kind_part_in_test_part_smlo4k3r6m" ON "qti"."branch_rule" IS 'trigger of law BranchRule(owner) where ownerKind = part in TestPart(id) on BranchRule for INSERT';

COMMENT ON TRIGGER "__law_branch_rule_owner_kind_section_in_assessment_o3jtpi5uff" ON "qti"."branch_rule" IS 'trigger of law BranchRule(owner) where ownerKind = section in AssessmentSection(id) on BranchRule for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_branch_rule_in_branch_rule_3jvy65m5bg" ON "qti"."branch_rule" IS 'trigger of law Node(id) where kind = qti-branch-rule in BranchRule(id), a mirrors half on BranchRule for DELETE';

COMMENT ON TRIGGER "__law_branch_rule_target_kind_alternatives_rnbsq2uong" ON "qti"."branch_rule_exit" IS 'trigger of law alternatives of BranchRule.targetKind on BranchRuleExit for DELETE';

COMMENT ON TRIGGER "__law_branch_rule_target_kind_alternatives_yvuprqiwsj" ON "qti"."branch_rule_target" IS 'trigger of law alternatives of BranchRule.targetKind on BranchRuleTarget for DELETE';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_meoeap5rbu" ON "qti"."built_in_ref" IS 'trigger of law alternatives of VariableRef.kind on BuiltInRef for DELETE';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_53tslbo6zi" ON "qti"."declared_ref" IS 'trigger of law alternatives of VariableRef.kind on DeclaredRef for DELETE';

COMMENT ON TRIGGER "__law_node_xml_lang_root_kind_test_in_document_lang_43gyyaa6as" ON "qti"."document_lang" IS 'trigger of law NodeXmlLang(tree, value) where rootKind = test in DocumentLang(document, value) on DocumentLang for DELETE';

COMMENT ON TRIGGER "__law_adaptive_selection_capacity_edge_btmukodhe6" ON "qti"."edge" IS 'trigger of law capacity of AdaptiveSelection(id) over Edge(parent) where childKind = qti-adaptive-engine-ref, parentKind = qti-adaptive-selection within 1..1 on Edge for DELETE';

COMMENT ON TRIGGER "__law_assessment_stimulus_capacity_edge_flcofme5bv" ON "qti"."edge" IS 'trigger of law capacity of AssessmentStimulus(id) over Edge(parent) where childKind = qti-stimulus-body, parentKind = qti-assessment-stimulus within 1..1 on Edge for DELETE';

COMMENT ON TRIGGER "__law_assessment_test_capacity_edge_xz4xnpdhzz" ON "qti"."edge" IS 'trigger of law capacity of AssessmentTest(id) over Edge(parent) where childKind = qti-test-part, parentKind = qti-assessment-test within 1..* on Edge for DELETE';

COMMENT ON TRIGGER "__law_test_rubric_block_capacity_edge_m4a5uoc2az" ON "qti"."edge" IS 'trigger of law capacity of TestRubricBlock(id) over Edge(parent) where childKind = qti-content-body.testRubric, parentKind = qti-rubric-block.test within 1..1 on Edge for DELETE';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_item_ref_parent_57bna3me3h" ON "qti"."edge" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-item-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_parent_wzrusg2goz" ON "qti"."edge" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_parent_2b6rlnhbbw" ON "qti"."edge" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-test-part in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_ref_oms32ar4nq" ON "qti"."edge" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_ref_62kvqjnebj" ON "qti"."edge" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-test-part in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON TRIGGER "__law_edge_child_kind_xi_include_parent_kind_qti_ji45qdhi5x" ON "qti"."edge" IS 'trigger of law Edge(child, parent) where childKind = xi:include, parentKind = qti-assessment-section in StructureChild(child, parent) on Edge for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_html_id_gzgf73euob" ON "qti"."html_id" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over HtmlId(node) where kind = qti-stimulus-body within 0..0 on HtmlId for INSERT';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_xv2ihge6mu" ON "qti"."item_instance_variable_ref" IS 'trigger of law alternatives of VariableRef.kind on ItemInstanceVariableRef for DELETE';

COMMENT ON TRIGGER "__law_item_instance_variable_ref_root_test_in_tetfyu2347" ON "qti"."item_instance_variable_ref" IS 'trigger of law ItemInstanceVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on ItemInstanceVariableRef for INSERT';

COMMENT ON TRIGGER "__law_prefixed_variable_source_ref_kind_item_d7l4p6s2hk" ON "qti"."item_instance_variable_ref" IS 'trigger of law PrefixedVariableSource(ref, prefix) where refKind = itemInstanceVariable in ItemInstanceVariableRef(id, prefix) on ItemInstanceVariableRef for DELETE';

COMMENT ON TRIGGER "__law_branch_rule_owner_kind_item_ref_in_item_ref_4frjcy6zzz" ON "qti"."item_ref" IS 'trigger of law BranchRule(owner) where ownerKind = itemRef in ItemRef(id) on ItemRef for DELETE';

COMMENT ON TRIGGER "__law_item_ref_required_1_in_required_child_u5aczonuz5" ON "qti"."item_ref" IS 'trigger of law ItemRef(id) where required = 1 in RequiredChild(child) on ItemRef for INSERT';

COMMENT ON TRIGGER "__law_item_ref_required_true_in_required_child_wot4b4wcm4" ON "qti"."item_ref" IS 'trigger of law ItemRef(id) where required = true in RequiredChild(child) on ItemRef for INSERT';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_item_ref_in_item_d6crvfx4vc" ON "qti"."item_ref" IS 'trigger of law TestIdentifier(holder) where holderKind = itemRef in ItemRef(id) on ItemRef for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_item_ref_in_item_ref_7ju25atoi6" ON "qti"."item_ref" IS 'trigger of law Node(id) where kind = qti-assessment-item-ref in ItemRef(id), a mirrors half on ItemRef for DELETE';

COMMENT ON TRIGGER "__law_item_ref_resolution_target_kind_alternatives_4u3o6zdms5" ON "qti"."item_ref_document" IS 'trigger of law alternatives of ItemRefResolution.targetKind on ItemRefDocument for DELETE';

COMMENT ON TRIGGER "__law_item_ref_resolution_target_kind_alternatives_wdpfilq2hj" ON "qti"."item_ref_lti" IS 'trigger of law alternatives of ItemRefResolution.targetKind on ItemRefLti for DELETE';

COMMENT ON TRIGGER "__law_item_ref_resolution_target_kind_alternatives_bafmpu3c6z" ON "qti"."item_ref_resolution" IS 'trigger of law alternatives of ItemRefResolution.targetKind on ItemRefResolution for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_item_session_control_in_item_7akfqnkjdc" ON "qti"."item_session_control" IS 'trigger of law Node(id) where kind = qti-item-session-control in ItemSessionControl(id), a mirrors half on ItemSessionControl for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_stimulus_ref_in_item_kmlodmcbtz" ON "qti"."item_stimulus_ref" IS 'trigger of law Node(id) where kind = qti-assessment-stimulus-ref in ItemStimulusRef(id), a mirrors half on ItemStimulusRef for DELETE';

COMMENT ON TRIGGER "__law_item_tool_root_item_in_assessment_item_stpxseeguy" ON "qti"."item_tool" IS 'trigger of law ItemTool(tree) where root = item in AssessmentItem(tree) on ItemTool for INSERT';

COMMENT ON TRIGGER "__law_assessment_item_label_root_item_version_3_0_1_z6rn2kkbdp" ON "qti"."item_tool_both" IS 'trigger of law AssessmentItemLabel(tree) where root = item, version = 3.0.1 in ItemToolBoth(tree) on ItemToolBoth for DELETE';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_rldwvxs6t2" ON "qti"."item_variable_ref" IS 'trigger of law alternatives of VariableRef.kind on ItemVariableRef for DELETE';

COMMENT ON TRIGGER "__law_item_variable_ref_root_test_in_prefixed_zmkztlut6c" ON "qti"."item_variable_ref" IS 'trigger of law ItemVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on ItemVariableRef for INSERT';

COMMENT ON TRIGGER "__law_prefixed_variable_source_ref_kind_item_qwro6o5ky3" ON "qti"."item_variable_ref" IS 'trigger of law PrefixedVariableSource(ref, prefix) where refKind = itemVariable in ItemVariableRef(id, prefix) on ItemVariableRef for DELETE';

COMMENT ON TRIGGER "__law_resource_lom_identified_type_imsqti_test_xmlv_n2nwgugbda" ON "qti"."lom_object_identifier" IS 'trigger of law capacity of ResourceLomIdentified(lom) where type = "imsqti_test_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on LomObjectIdentifier for DELETE';

COMMENT ON TRIGGER "__law_resource_lom_identified_type_imsqti_test_xmlv_ndiyqsljts" ON "qti"."lom_object_identifier" IS 'trigger of law capacity of ResourceLomIdentified(lom) where type = "imsqti_test_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on LomObjectIdentifier for INSERT';

COMMENT ON TRIGGER "__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_6hip4laip7" ON "qti"."lom_object_title" IS 'trigger of law capacity of ResourceLomTitled(lom) where type = "imsqti_test_xmlv3p0" over LomObjectTitle(lom) within 1..1 on LomObjectTitle for DELETE';

COMMENT ON TRIGGER "__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_lpa6jlu6oy" ON "qti"."lom_object_title" IS 'trigger of law capacity of ResourceLomTitled(lom) where type = "imsqti_test_xmlv3p0" over LomObjectTitle(lom) within 1..1 on LomObjectTitle for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_metadata_ref_in_metadata_ref_naqihnq5cn" ON "qti"."metadata_ref" IS 'trigger of law Node(id) where kind = qti-metadata-ref in MetadataRef(id), a mirrors half on MetadataRef for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_adaptive_engine_ref_in_adaptive_ayxffnd2wx" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-adaptive-engine-ref in AdaptiveEngineRef(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_adaptive_selection_in_adaptive_kzkekuaaqv" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-adaptive-selection in AdaptiveSelection(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_adaptive_settings_ref_in_fpiypwgerm" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-adaptive-settings-ref in AdaptiveSettingsRef(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_item_ref_in_item_ref_vro6ozj6pm" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-assessment-item-ref in ItemRef(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_section_in_assessment_2v6r652ipb" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-assessment-section in AssessmentSection(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_section_ref_in_3ivjfkxcio" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-assessment-section-ref in SectionRef(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_stimulus_in_ilobb7d6je" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-assessment-stimulus in AssessmentStimulus(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_stimulus_ref_in_item_f5kgbpbqhp" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-assessment-stimulus-ref in ItemStimulusRef(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_test_in_assessment_63bngddyby" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-assessment-test in AssessmentTest(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_branch_rule_in_branch_rule_db6iz4rdqr" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-branch-rule in BranchRule(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_content_body_test_feedback_in_guhx2zlkjp" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-content-body.testFeedback in TestFeedbackContentBody(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_content_body_test_rubric_in_test_a7nviek77c" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-content-body.testRubric in TestRubricContentBody(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_item_session_control_in_item_z2xb3ldhey" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-item-session-control in ItemSessionControl(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_metadata_ref_in_metadata_ref_k2e2qhwrbc" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-metadata-ref in MetadataRef(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_ordering_in_ordering_iszi4n5mnb" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-ordering in Ordering(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_pre_condition_in_pre_condition_ohyhhkypy3" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-pre-condition in PreCondition(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_rubric_block_test_in_test_rubric_54u6tsshqj" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-rubric-block.test in TestRubricBlock(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_selection_in_selection_hnrf2jtzn5" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-selection in Selection(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_stimulus_body_in_stimulus_body_witsdjrct3" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-stimulus-body in StimulusBody(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_template_default_in_template_bmk7xqqerw" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-template-default in TemplateDefault(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_test_feedback_in_test_feedback_ay7crs5xop" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-test-feedback in TestFeedback(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_test_part_in_test_part_63pawkn2hd" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-test-part in TestPart(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_time_limits_in_time_limits_f3pi5pcrdw" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-time-limits in TimeLimits(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_usagedata_ref_in_usage_data_ref_63xq6f3v27" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-usagedata-ref in UsageDataRef(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_variable_mapping_in_variable_aksx6xkozu" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-variable-mapping in VariableMapping(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_weight_in_weight_ukscj2ynig" ON "qti"."node" IS 'trigger of law Node(id) where kind = qti-weight in Weight(id), a mirrors half on Node for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_ng5fr3yxvp" ON "qti"."node_catalog_idref" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeCatalogIdref(node) where kind = qti-stimulus-body within 0..0 on NodeCatalogIdref for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_jefkxma4n6" ON "qti"."node_class" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeClass(node) where kind = qti-stimulus-body within 0..0 on NodeClass for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_dir_pyikstgmwc" ON "qti"."node_dir" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeDir(node) where kind = qti-stimulus-body within 0..0 on NodeDir for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_meg5g66blf" ON "qti"."node_label" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLabel(node) where kind = qti-stimulus-body within 0..0 on NodeLabel for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_lang_4rs5ym77ud" ON "qti"."node_lang" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLang(node) where kind = qti-stimulus-body within 0..0 on NodeLang for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_p5oladyfoa" ON "qti"."node_suppress_tts" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeSuppressTts(node) where kind = qti-stimulus-body within 0..0 on NodeSuppressTts for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_xml_ouekjndb7b" ON "qti"."node_xml_base" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlBase(node) where kind = qti-stimulus-body within 0..0 on NodeXmlBase for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_xml_qg3r35o5m3" ON "qti"."node_xml_lang" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlLang(node) where kind = qti-stimulus-body within 0..0 on NodeXmlLang for INSERT';

COMMENT ON TRIGGER "__law_node_xml_lang_root_kind_test_in_document_lang_k7v3f22dti" ON "qti"."node_xml_lang" IS 'trigger of law NodeXmlLang(tree, value) where rootKind = test in DocumentLang(document, value) on NodeXmlLang for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_ordering_in_ordering_yrqlwyf6sb" ON "qti"."ordering" IS 'trigger of law Node(id) where kind = qti-ordering in Ordering(id), a mirrors half on Ordering for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_pre_condition_in_pre_condition_mxvr62gtzc" ON "qti"."pre_condition" IS 'trigger of law Node(id) where kind = qti-pre-condition in PreCondition(id), a mirrors half on PreCondition for DELETE';

COMMENT ON TRIGGER "__law_prefixed_variable_source_source_alternatives_oznt3yzgbd" ON "qti"."prefixed_built_in" IS 'trigger of law alternatives of PrefixedVariableSource.source on PrefixedBuiltIn for DELETE';

COMMENT ON TRIGGER "__law_prefixed_variable_source_source_alternatives_ggj2uujort" ON "qti"."prefixed_declared" IS 'trigger of law alternatives of PrefixedVariableSource.source on PrefixedDeclared for DELETE';

COMMENT ON TRIGGER "__law_prefixed_variable_source_source_alternatives_vxo42ufy2m" ON "qti"."prefixed_mapped" IS 'trigger of law alternatives of PrefixedVariableSource.source on PrefixedMapped for DELETE';

COMMENT ON TRIGGER "__law_prefixed_variable_source_source_alternatives_h2d5l2i3c3" ON "qti"."prefixed_variable_source" IS 'trigger of law alternatives of PrefixedVariableSource.source on PrefixedVariableSource for INSERT';

COMMENT ON TRIGGER "__law_item_instance_variable_ref_root_test_in_34qki7klgh" ON "qti"."prefixed_variable_source" IS 'trigger of law ItemInstanceVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on PrefixedVariableSource for DELETE';

COMMENT ON TRIGGER "__law_item_variable_ref_root_test_in_prefixed_5jev6v5h5d" ON "qti"."prefixed_variable_source" IS 'trigger of law ItemVariableRef(id, document) where root = test in PrefixedVariableSource(ref, test) on PrefixedVariableSource for DELETE';

COMMENT ON TRIGGER "__law_prefixed_variable_source_ref_kind_item_qec2y7utzd" ON "qti"."prefixed_variable_source" IS 'trigger of law PrefixedVariableSource(ref, prefix) where refKind = itemInstanceVariable in ItemInstanceVariableRef(id, prefix) on PrefixedVariableSource for INSERT';

COMMENT ON TRIGGER "__law_prefixed_variable_source_ref_kind_item_5n53qr5ea5" ON "qti"."prefixed_variable_source" IS 'trigger of law PrefixedVariableSource(ref, prefix) where refKind = itemVariable in ItemVariableRef(id, prefix) on PrefixedVariableSource for INSERT';

COMMENT ON TRIGGER "__law_prefixed_variable_source_ref_kind_section_7afdxnlc63" ON "qti"."prefixed_variable_source" IS 'trigger of law PrefixedVariableSource(ref, test) where refKind = sectionVariable in SectionVariablePrefixed(ref, test), a mirrors half on PrefixedVariableSource for INSERT';

COMMENT ON TRIGGER "__law_selection_capacity_required_child_r5t4ypw5sg" ON "qti"."required_child" IS 'trigger of law capacity of Selection(section) over RequiredChild(parent) within 0..select on RequiredChild for INSERT';

COMMENT ON TRIGGER "__law_assessment_section_required_1_in_required_er5tgyiqrb" ON "qti"."required_child" IS 'trigger of law AssessmentSection(id) where required = 1 in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON TRIGGER "__law_assessment_section_required_true_in_required_q2iuchsuwe" ON "qti"."required_child" IS 'trigger of law AssessmentSection(id) where required = true in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON TRIGGER "__law_item_ref_required_1_in_required_child_wcfjyvhjrz" ON "qti"."required_child" IS 'trigger of law ItemRef(id) where required = 1 in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON TRIGGER "__law_item_ref_required_true_in_required_child_evtnimj6nr" ON "qti"."required_child" IS 'trigger of law ItemRef(id) where required = true in RequiredChild(child) on RequiredChild for DELETE';

COMMENT ON TRIGGER "__law_resource_lom_identified_type_imsqti_test_xmlv_gpoudzq2uw" ON "qti"."resource_lom_identified" IS 'trigger of law capacity of ResourceLomIdentified(lom) where type = "imsqti_test_xmlv3p0" over LomObjectIdentifier(lom) within 1..1 on ResourceLomIdentified for INSERT';

COMMENT ON TRIGGER "__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_k5iyw27oj4" ON "qti"."resource_lom_titled" IS 'trigger of law capacity of ResourceLomTitled(lom) where type = "imsqti_test_xmlv3p0" over LomObjectTitle(lom) within 1..1 on ResourceLomTitled for INSERT';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_vuofxkclut" ON "qti"."section_duration_ref" IS 'trigger of law alternatives of VariableRef.kind on SectionDurationRef for DELETE';

COMMENT ON TRIGGER "__law_section_duration_ref_root_test_in_section_ntx333wqcw" ON "qti"."section_duration_ref" IS 'trigger of law SectionDurationRef(id, document) where root = test in SectionDurationTarget(ref, test) on SectionDurationRef for INSERT';

COMMENT ON TRIGGER "__law_section_duration_target_ref_kind_section_g2lolbwn4q" ON "qti"."section_duration_ref" IS 'trigger of law SectionDurationTarget(ref, document, prefix) where refKind = sectionDuration in SectionDurationRef(id, document, prefix) on SectionDurationRef for DELETE';

COMMENT ON TRIGGER "__law_section_duration_ref_root_test_in_section_4xxuotlte7" ON "qti"."section_duration_target" IS 'trigger of law SectionDurationRef(id, document) where root = test in SectionDurationTarget(ref, test) on SectionDurationTarget for DELETE';

COMMENT ON TRIGGER "__law_section_duration_target_ref_kind_section_wzsvv3oafk" ON "qti"."section_duration_target" IS 'trigger of law SectionDurationTarget(ref, document, prefix) where refKind = sectionDuration in SectionDurationRef(id, document, prefix) on SectionDurationTarget for INSERT';

COMMENT ON TRIGGER "__law_section_duration_target_ref_kind_section_daityxdksk" ON "qti"."section_duration_target" IS 'trigger of law SectionDurationTarget(ref, test) where refKind = sectionVariable in SectionVariableDuration(ref, test), a mirrors half on SectionDurationTarget for INSERT';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_section_ref_in_kb3buxnn67" ON "qti"."section_ref" IS 'trigger of law TestIdentifier(holder) where holderKind = sectionRef in SectionRef(id) on SectionRef for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_assessment_section_ref_in_apbdo2czji" ON "qti"."section_ref" IS 'trigger of law Node(id) where kind = qti-assessment-section-ref in SectionRef(id), a mirrors half on SectionRef for DELETE';

COMMENT ON TRIGGER "__law_section_variable_resolution_target_uihluapwj3" ON "qti"."section_variable_declared" IS 'trigger of law alternatives of SectionVariableResolution.target on SectionVariableDeclared for DELETE';

COMMENT ON TRIGGER "__law_section_variable_resolution_target_voo6de6564" ON "qti"."section_variable_duration" IS 'trigger of law alternatives of SectionVariableResolution.target on SectionVariableDuration for DELETE';

COMMENT ON TRIGGER "__law_section_duration_target_ref_kind_section_v43mud2bog" ON "qti"."section_variable_duration" IS 'trigger of law SectionDurationTarget(ref, test) where refKind = sectionVariable in SectionVariableDuration(ref, test), a mirrors half on SectionVariableDuration for DELETE';

COMMENT ON TRIGGER "__law_section_variable_resolution_target_ihelv6wfyt" ON "qti"."section_variable_prefixed" IS 'trigger of law alternatives of SectionVariableResolution.target on SectionVariablePrefixed for DELETE';

COMMENT ON TRIGGER "__law_prefixed_variable_source_ref_kind_section_walvvtgovg" ON "qti"."section_variable_prefixed" IS 'trigger of law PrefixedVariableSource(ref, test) where refKind = sectionVariable in SectionVariablePrefixed(ref, test), a mirrors half on SectionVariablePrefixed for DELETE';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_pvolbauumr" ON "qti"."section_variable_ref" IS 'trigger of law alternatives of VariableRef.kind on SectionVariableRef for DELETE';

COMMENT ON TRIGGER "__law_section_variable_resolution_target_4khnhllrto" ON "qti"."section_variable_resolution" IS 'trigger of law alternatives of SectionVariableResolution.target on SectionVariableResolution for INSERT';

COMMENT ON TRIGGER "__law_selection_capacity_required_child_pu26uvthcx" ON "qti"."selection" IS 'trigger of law capacity of Selection(section) over RequiredChild(parent) within 0..select on Selection for INSERT';

COMMENT ON TRIGGER "__law_selection_with_replacement_0_in_selection_hhfqgf64lp" ON "qti"."selection" IS 'trigger of law Selection(section) where withReplacement = 0 in SelectionBounded(section) on Selection for INSERT';

COMMENT ON TRIGGER "__law_selection_with_replacement_false_in_selection_tvqqstvzyb" ON "qti"."selection" IS 'trigger of law Selection(section) where withReplacement = false in SelectionBounded(section) on Selection for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_selection_in_selection_h6cdo6v4lv" ON "qti"."selection" IS 'trigger of law Node(id) where kind = qti-selection in Selection(id), a mirrors half on Selection for DELETE';

COMMENT ON TRIGGER "__law_selection_bounded_capacity_structure_child_v3z2p6jbkl" ON "qti"."selection_bounded" IS 'trigger of law capacity of SelectionBounded(section) over StructureChild(parent) within select..* on SelectionBounded for INSERT';

COMMENT ON TRIGGER "__law_selection_with_replacement_0_in_selection_xqewv4od5b" ON "qti"."selection_bounded" IS 'trigger of law Selection(section) where withReplacement = 0 in SelectionBounded(section) on SelectionBounded for DELETE';

COMMENT ON TRIGGER "__law_selection_with_replacement_false_in_selection_gsyfbommwy" ON "qti"."selection_bounded" IS 'trigger of law Selection(section) where withReplacement = false in SelectionBounded(section) on SelectionBounded for DELETE';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_mdsttn2cd3" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaActivedescendant(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_tcsdblogtv" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAtomic(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_g5qmfqit7u" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaAutocomplete(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_busy_nb4wcf5onh" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaBusy(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_xnwbzep7kg" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaChecked(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_d3cbagpgql" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColcount(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_6j4y3qf3qr" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColindex(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_ad2kkopkha" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaColspan(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_q4rwa2vub6" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaControls(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_za77a4sxi5" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaCurrent(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_k5mqumlcwn" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDescribedby(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_ksaccetsgw" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDetails(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_lyarzbpjy5" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaDisabled(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_l22c7mefen" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaErrormessage(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_rp27gxrktb" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaExpanded(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_biu56664t5" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaFlowto(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_clkxgozflr" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHaspopup(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_u6traqjq6n" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaHidden(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_gikjsyb6yo" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaInvalid(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_26zmbgcsuh" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshortcuts(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_dfanss4ohx" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaKeyshorts(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_ierk5mz4h6" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabel(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_ulhhr7m6of" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLabelledby(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_gna6azwynd" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLevel(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_live_5gh7a5tl6o" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaLive(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_gj75xafpos" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaModal(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_shvgpr3esr" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiline(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_sfcbqbbvsh" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaMultiselectable(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_e4ucuilbkp" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOrientation(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_owns_nnz5orxt5q" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaOwns(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_lvuyxsbv2f" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPlaceholder(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_v4clli4k5j" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPosinset(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_gnsm2p7vb5" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaPressed(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_dpnftweiqy" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaReadonly(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_bohsnyqfq4" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRelevant(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_rzwxge7o25" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRequired(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_role_igd5hqpno7" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRole(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_c5o7v36lfo" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRoledescription(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_eqwg52nx5n" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowcount(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_ir6hact263" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowindex(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_iobew5x5th" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaRowspan(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_z5ohrrtejf" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSelected(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_74byaq67no" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSetsize(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_sort_qv2swfp3yz" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaSort(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_jxzs22rmkj" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemax(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_bfpdcbrvvj" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuemin(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_fyysmtvhh5" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuenow(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_aria_c3kfhpdxzk" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over AriaValuetext(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_html_id_ab7f5ifzr4" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over HtmlId(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_wpka6apjsp" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeCatalogIdref(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_dp7wop4zij" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeClass(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_dir_zuaq7li334" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeDir(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_v25t7nty35" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLabel(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_lang_rcbzdm36dl" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeLang(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_23adm7ov64" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeSuppressTts(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_xml_la7cujp2f6" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlBase(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_xml_ttd642pm5w" ON "qti"."stimulus_body" IS 'trigger of law capacity of StimulusBody(id) where version = 3.0.0 over NodeXmlLang(node) where kind = qti-stimulus-body within 0..0 on StimulusBody for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_stimulus_body_in_stimulus_body_pgjwgoszvc" ON "qti"."stimulus_body" IS 'trigger of law Node(id) where kind = qti-stimulus-body in StimulusBody(id), a mirrors half on StimulusBody for DELETE';

COMMENT ON TRIGGER "__law_assessment_section_capacity_structure_child_ktiadppip5" ON "qti"."structure_child" IS 'trigger of law capacity of AssessmentSection(id) over StructureChild(parent) within 1..* on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_selection_bounded_capacity_structure_child_2x7nvjrv65" ON "qti"."structure_child" IS 'trigger of law capacity of SelectionBounded(section) over StructureChild(parent) within select..* on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_test_part_capacity_structure_child_bzcgy4xhcv" ON "qti"."structure_child" IS 'trigger of law capacity of TestPart(id) over StructureChild(parent) within 1..* on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_item_ref_parent_fw3nw4fhbo" ON "qti"."structure_child" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-item-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_parent_6qu2gi6izf" ON "qti"."structure_child" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_parent_csdpmaxlqv" ON "qti"."structure_child" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section, parentKind = qti-test-part in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_ref_rm662hytot" ON "qti"."structure_child" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_edge_child_kind_qti_assessment_section_ref_bmsg6ni6jn" ON "qti"."structure_child" IS 'trigger of law Edge(child, parent) where childKind = qti-assessment-section-ref, parentKind = qti-test-part in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_edge_child_kind_xi_include_parent_kind_qti_id6stzct25" ON "qti"."structure_child" IS 'trigger of law Edge(child, parent) where childKind = xi:include, parentKind = qti-assessment-section in StructureChild(child, parent) on StructureChild for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_template_default_in_template_ime2vgs5mu" ON "qti"."template_default" IS 'trigger of law Node(id) where kind = qti-template-default in TemplateDefault(id), a mirrors half on TemplateDefault for DELETE';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_okxnwzk6zu" ON "qti"."template_parameter_ref" IS 'trigger of law alternatives of VariableRef.kind on TemplateParameterRef for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_test_feedback_in_test_feedback_uwgpkwxsvs" ON "qti"."test_feedback" IS 'trigger of law Node(id) where kind = qti-test-feedback in TestFeedback(id), a mirrors half on TestFeedback for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_content_body_test_feedback_in_7x6kdedebk" ON "qti"."test_feedback_content_body" IS 'trigger of law Node(id) where kind = qti-content-body.testFeedback in TestFeedbackContentBody(id), a mirrors half on TestFeedbackContentBody for DELETE';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_item_ref_in_item_c54jh4vgaa" ON "qti"."test_identifier" IS 'trigger of law TestIdentifier(holder) where holderKind = itemRef in ItemRef(id) on TestIdentifier for INSERT';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_part_in_test_part_vbesroqe6o" ON "qti"."test_identifier" IS 'trigger of law TestIdentifier(holder) where holderKind = part in TestPart(id) on TestIdentifier for INSERT';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_section_in_iiqfsu5qfu" ON "qti"."test_identifier" IS 'trigger of law TestIdentifier(holder) where holderKind = section in AssessmentSection(id) on TestIdentifier for INSERT';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_section_ref_in_4qu4i2yd5n" ON "qti"."test_identifier" IS 'trigger of law TestIdentifier(holder) where holderKind = sectionRef in SectionRef(id) on TestIdentifier for INSERT';

COMMENT ON TRIGGER "__law_test_part_capacity_structure_child_duut6bjvtv" ON "qti"."test_part" IS 'trigger of law capacity of TestPart(id) over StructureChild(parent) within 1..* on TestPart for INSERT';

COMMENT ON TRIGGER "__law_branch_rule_owner_kind_part_in_test_part_qtvv73qqba" ON "qti"."test_part" IS 'trigger of law BranchRule(owner) where ownerKind = part in TestPart(id) on TestPart for DELETE';

COMMENT ON TRIGGER "__law_test_identifier_holder_kind_part_in_test_part_chrufdfrtk" ON "qti"."test_part" IS 'trigger of law TestIdentifier(holder) where holderKind = part in TestPart(id) on TestPart for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_test_part_in_test_part_qoovtw75yc" ON "qti"."test_part" IS 'trigger of law Node(id) where kind = qti-test-part in TestPart(id), a mirrors half on TestPart for DELETE';

COMMENT ON TRIGGER "__law_test_rubric_block_capacity_edge_3vabswvyor" ON "qti"."test_rubric_block" IS 'trigger of law capacity of TestRubricBlock(id) over Edge(parent) where childKind = qti-content-body.testRubric, parentKind = qti-rubric-block.test within 1..1 on TestRubricBlock for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_rubric_block_test_in_test_rubric_tmo43tjo7n" ON "qti"."test_rubric_block" IS 'trigger of law Node(id) where kind = qti-rubric-block.test in TestRubricBlock(id), a mirrors half on TestRubricBlock for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_content_body_test_rubric_in_test_foicv6eccx" ON "qti"."test_rubric_content_body" IS 'trigger of law Node(id) where kind = qti-content-body.testRubric in TestRubricContentBody(id), a mirrors half on TestRubricContentBody for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_time_limits_in_time_limits_hywyjo4sex" ON "qti"."time_limits" IS 'trigger of law Node(id) where kind = qti-time-limits in TimeLimits(id), a mirrors half on TimeLimits for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_usagedata_ref_in_usage_data_ref_alveywefhj" ON "qti"."usage_data_ref" IS 'trigger of law Node(id) where kind = qti-usagedata-ref in UsageDataRef(id), a mirrors half on UsageDataRef for DELETE';

COMMENT ON TRIGGER "__law_node_kind_qti_variable_mapping_in_variable_qlmq2pouoj" ON "qti"."variable_mapping" IS 'trigger of law Node(id) where kind = qti-variable-mapping in VariableMapping(id), a mirrors half on VariableMapping for DELETE';

COMMENT ON TRIGGER "__law_variable_ref_kind_alternatives_u6jd2qfcar" ON "qti"."variable_ref" IS 'trigger of law alternatives of VariableRef.kind on VariableRef for INSERT';

COMMENT ON TRIGGER "__law_node_kind_qti_weight_in_weight_jum746shb3" ON "qti"."weight" IS 'trigger of law Node(id) where kind = qti-weight in Weight(id), a mirrors half on Weight for DELETE';

COMMENT ON TRIGGER "__law_x_include_capacity_x_include_xpointer_bstiviaw2u" ON "qti"."x_include" IS 'trigger of law capacity of XInclude(id) over XIncludeXpointer(node) within 0..0 on XInclude for INSERT';

COMMENT ON TRIGGER "__law_x_include_capacity_x_include_xpointer_ofjxkl43om" ON "qti"."x_include_xpointer" IS 'trigger of law capacity of XInclude(id) over XIncludeXpointer(node) within 0..0 on XIncludeXpointer for INSERT';
