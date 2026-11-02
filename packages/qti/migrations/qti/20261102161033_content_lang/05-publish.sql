DROP TRIGGER "__law_lom_language_owner_resource_in_resource_lom_7xxurk7goe" ON "qti"."lom_language";

DROP TRIGGER "__law_lom_language_owner_resource_in_resource_lom_ppwv6rby2g" ON "qti"."resource_lom_language_set";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."ancestry", "qti"."attribute_name", "qti"."base_type", "qti"."bound", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."idref_attribute", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."printed_variable_attr", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."tool_shape", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."yes_no" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_osqmo2ktsg", "qti"."__text_i67gmkzdk7", "qti"."__text_t27tgfubfq", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_ffwr4dbfx2", "qti"."__text_ocl2hjarfs", "qti"."__text_uc3mvgolsg", "qti"."__text_dqq6r4bdbe", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_tq7gq2jmkl", "qti"."__text_wu54ry3yoe", "qti"."__text_oct7jwkpoj", "qti"."__text_oy4m3tqgfd", "qti"."__text_fictzx37my", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xs56r6cx4y", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_6gan25pdor", "qti"."__text_yakcqa4zli", "qti"."__text_dwt2qnsttp", "qti"."__text_x5wrjyn3pc", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_awt4t5kosa", "qti"."__text_hawigbfw6m", "qti"."__text_gubl3xpcnx", "qti"."__text_a4spx6pjqw", "qti"."__text_5zvd6hcv2x", "qti"."__text_djykoynpls", "qti"."__text_72jqunyi7z", "qti"."__text_5lyuoloiou", "qti"."__text_bvx3fqniye", "qti"."__text_dbdfklalek", "qti"."__text_k3z6naurdo", "qti"."__text_tdupg63xcv", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_oy6p76tbqw", "qti"."__text_ojm4wya66v", "qti"."__text_acxfo763jg", "qti"."__text_tmjud3n2tg", "qti"."__text_o3dskk7ctt", "qti"."__text_rhdrzkabze", "qti"."__text_o3e7dedzyv", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_wjqnoy6t2y", "qti"."__text_tyjqwtj7ky", "qti"."__text_fgbxwprcwx", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_exm3fkarq3", "qti"."__text_6uwfpnix5n", "qti"."__text_kcydnvglpj", "qti"."__text_gm4clqaaza", "qti"."__text_saolosnhkp" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."acronym", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associate_interaction", "qti__author"."associate_max_associations", "qti__author"."associate_min_associations", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct_response_arm", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_include_boundary", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_track_kind", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."dt", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_associations", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_max_associations", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_associations", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices", "qti__author"."graphic_order_min_choices_n", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_choices", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_choices", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_choices", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_choices", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."kbd", "qti__author"."label", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_associations", "qti__author"."match_max_selections_message", "qti__author"."match_min_associations", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_max_choices", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."pre", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."ruby", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."select_point_interaction", "qti__author"."select_point_max_choices", "qti__author"."select_point_min_choices", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."string_binding", "qti__author"."strong", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_inline", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable_ref", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."ws" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."a" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."a_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."abbr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."acronym" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."address" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associate_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associate_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associate_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_format" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_min_strings" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_inline_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_required" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_associate_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_gap_match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_boundary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_fixed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_required" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_param_variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_position_object_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_base" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_delimiter" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_mapping_indicator" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_power_form" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_slider_step_label" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_block_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_inline_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_text_entry_base" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dependency" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."details" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."details_open" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dfn" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."div" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dl" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."drawing_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."edge" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."em" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_count_attempt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_length" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_lines" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_max_strings" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_pattern_mask" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_patternmask_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_placeholder_text" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_inline" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_outcome_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."figcaption" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."figure" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_content" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_text" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_text_match_min" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_choices_container_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_max_choices_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_min_choices_n" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext_owner" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hr" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."html_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."i" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_height" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."img_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_prompt" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_body" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_body_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_both" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_version" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."kbd" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."label" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_lower_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_upper_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_first_column_header" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_group" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."match_min_associations" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_coords" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_max_plays" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."media_min_plays" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback_title" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object_height" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ol" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."operand" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_choices_container_width" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_max_choices_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_max_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_min_choices_n" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_min_selections_message" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."order_orientation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."organizations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."p" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."package" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."package_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."param" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."param_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pi" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."picture" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_center_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_min_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."position_object_stage" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pre" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_field" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_format" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_index" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_var_ref" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rb" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_field" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_general" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_language_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_titled" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_metadata" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resources" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_item" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rp" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rtc" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rubric_block" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ruby" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."samp" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."select_point_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."select_point_max_choices" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."select_point_min_choices" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."string_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."strong" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_media" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."sub" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."summary" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."sup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."table" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."table_summary" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_content_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_declaration_arm" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_inline" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tt" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ul" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."upload_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."upload_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."var" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" FROM "qti__author";

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

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON TYPE "qti"."ancestry", "qti"."attribute_name", "qti"."base_type", "qti"."bound", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."idref_attribute", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."printed_variable_attr", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."tool_shape", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."yes_no" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__text_osqmo2ktsg", "qti"."__text_i67gmkzdk7", "qti"."__text_t27tgfubfq", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_ffwr4dbfx2", "qti"."__text_ocl2hjarfs", "qti"."__text_uc3mvgolsg", "qti"."__text_dqq6r4bdbe", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_tq7gq2jmkl", "qti"."__text_wu54ry3yoe", "qti"."__text_oct7jwkpoj", "qti"."__text_oy4m3tqgfd", "qti"."__text_fictzx37my", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xs56r6cx4y", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_6gan25pdor", "qti"."__text_yakcqa4zli", "qti"."__text_dwt2qnsttp", "qti"."__text_x5wrjyn3pc", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_awt4t5kosa", "qti"."__text_hawigbfw6m", "qti"."__text_gubl3xpcnx", "qti"."__text_a4spx6pjqw", "qti"."__text_5zvd6hcv2x", "qti"."__text_djykoynpls", "qti"."__text_72jqunyi7z", "qti"."__text_5lyuoloiou", "qti"."__text_bvx3fqniye", "qti"."__text_dbdfklalek", "qti"."__text_k3z6naurdo", "qti"."__text_tdupg63xcv", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_oy6p76tbqw", "qti"."__text_ojm4wya66v", "qti"."__text_acxfo763jg", "qti"."__text_tmjud3n2tg", "qti"."__text_o3dskk7ctt", "qti"."__text_rhdrzkabze", "qti"."__text_o3e7dedzyv", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_wjqnoy6t2y", "qti"."__text_tyjqwtj7ky", "qti"."__text_fgbxwprcwx", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_exm3fkarq3", "qti"."__text_6uwfpnix5n", "qti"."__text_kcydnvglpj", "qti"."__text_gm4clqaaza", "qti"."__text_saolosnhkp" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."acronym", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associate_interaction", "qti__author"."associate_max_associations", "qti__author"."associate_min_associations", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct_response_arm", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_include_boundary", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_track_kind", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."dt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_associations", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_max_associations", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_associations", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices", "qti__author"."graphic_order_min_choices_n", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_choices", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_choices", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_choices", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_choices", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."kbd", "qti__author"."label", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_associations", "qti__author"."match_max_selections_message", "qti__author"."match_min_associations", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_max_choices", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."pre", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."ruby", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."select_point_interaction", "qti__author"."select_point_max_choices", "qti__author"."select_point_min_choices", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."string_binding", "qti__author"."strong", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_inline", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable_ref", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."ws" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."a" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."a_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."abbr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."acronym" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."address" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associate_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associate_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associate_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_idref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_lexical" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."built_in_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."caption" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."catalog_info" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."correct_response_arm" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_area_mapping_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_format" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_extended_text_min_strings" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_feedback_inline_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_match_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_gap_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_associate_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_graphic_gap_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hotspot_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_hottext_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_include_boundary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_map_entry_case_sensitive" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_mapping_default_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_match_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_math_variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_media_loop" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_param_variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_position_object_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_delimiter" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_mapping_indicator" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_printed_variable_power_form" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_slider_step_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_inline_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_text_entry_base" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_track_kind" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."default_value_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dependency" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."details" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."details_open" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dfn" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."div" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dl" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."drawing_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."edge" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."em" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_count_attempt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."end_attempt_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."entity_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_length" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_expected_lines" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_max_strings" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_pattern_mask" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_patternmask_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."extended_text_placeholder_text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_inline" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_outcome_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."figcaption" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."figure" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_content" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_match_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_text_match_min" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_associate_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_choices_container_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_gap_match_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_max_choices_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."graphic_order_min_choices_n" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext_owner" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hr" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."html_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."i" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_height" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_longdesc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."img_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inline_choice_prompt" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_body" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_body_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_both" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_tool_version" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."kbd" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."label" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_lower_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_upper_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_first_column_header" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_group" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."match_min_associations" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_coords" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_max_plays" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."media_min_plays" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."modal_feedback_title" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object_height" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ol" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."operand" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_choices_container_width" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_max_choices_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_max_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_min_choices_n" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_min_selections_message" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."order_orientation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."organizations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."outcome_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."p" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."package" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."package_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."param" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."param_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."picture" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_center_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."position_object_stage" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pre" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_field" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_format" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_index" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_var_ref" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rb" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_field" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_general" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_identified" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_language_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_titled" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_metadata" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resources" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_declaration_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_item" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."response_processing_template_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rp" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rtc" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rubric_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ruby" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."samp" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."schema_location" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."select_point_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."select_point_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."select_point_min_choices" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."string_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."strong" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_media" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stylesheet_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sub" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."summary" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."table" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."table_summary" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_content_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_declaration_arm" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_inline" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tt" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ul" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."upload_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."upload_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set_interpretation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."var" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ws" TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) TO "qti__author";

DROP INDEX "qti"."__lom_language_ix_lom_value_owner_resource_443joikvtf";

DROP FUNCTION "qti"."__law_lom_language_owner_resource_in_resource_lom_nrlhaonldh"();

COMMENT ON FUNCTION "qti"."__law_lom_language_owner_resource_parent_kind_lom_k2phyohjlh"() IS 'function of law LomLanguage(lom, value) where owner = resource, parentKind = lom:general in ResourceLomLanguageSet(lom, value)';

COMMENT ON CONSTRAINT "__lom_language_fk_id_parent_kind_avtlxpj6rc" ON "qti"."lom_language" IS 'foreign key LomLanguage(id, parentKind) to Edge(child, parentKind)';

COMMENT ON INDEX "qti"."__lom_language_ix_lom_value_owner_resource_parent_bbl5vba5nx" IS 'btree index LomLanguage(lom, value) where owner = resource, parentKind = lom:general';

COMMENT ON TRIGGER "__law_lom_language_owner_resource_parent_kind_lom_jivg74t5if" ON "qti"."lom_language" IS 'trigger of law LomLanguage(lom, value) where owner = resource, parentKind = lom:general in ResourceLomLanguageSet(lom, value) on LomLanguage';

COMMENT ON TRIGGER "__law_lom_language_owner_resource_parent_kind_lom_soveytar6m" ON "qti"."resource_lom_language_set" IS 'trigger of law LomLanguage(lom, value) where owner = resource, parentKind = lom:general in ResourceLomLanguageSet(lom, value) on ResourceLomLanguageSet';
