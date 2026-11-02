ALTER TABLE "qti"."template_inline" DROP CONSTRAINT "__template_inline_fk_id_tag_kind_qti_template_inline_p4fak2qa4m";

ALTER TABLE "qti"."template_block" DROP CONSTRAINT "__template_block_fk_id_tag_kind_qti_template_block_m5kfeif7pi";

ALTER TABLE "qti"."feedback_block" DROP CONSTRAINT "__feedback_block_fk_id_tag_kind_qti_feedback_block_cl6okoirts";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON TYPE "qti"."ancestry", "qti"."attribute_name", "qti"."base_type", "qti"."bound", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."idref_attribute", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."placement", "qti"."printed_variable_attr", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."tool_shape", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."yes_no" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__text_osqmo2ktsg", "qti"."__text_i67gmkzdk7", "qti"."__text_t27tgfubfq", "qti"."__text_f63vbnbw4t", "qti"."__text_pftpnuhm3d", "qti"."__text_7mulu52tr6", "qti"."__text_ffwr4dbfx2", "qti"."__text_ocl2hjarfs", "qti"."__text_uc3mvgolsg", "qti"."__text_dqq6r4bdbe", "qti"."__text_ottycep7en", "qti"."__text_c34ec7mxid", "qti"."__text_tq7gq2jmkl", "qti"."__text_wu54ry3yoe", "qti"."__text_oct7jwkpoj", "qti"."__text_oy4m3tqgfd", "qti"."__text_fictzx37my", "qti"."__text_betq2bg2bg", "qti"."__text_kqeswaav46", "qti"."__text_2dix7luqoi", "qti"."__text_7grqskvjta", "qti"."__text_cz7v66q3ce", "qti"."__text_qtkbmkpj6l", "qti"."__text_f3hdif3553", "qti"."__text_jld3q663or", "qti"."__text_xs56r6cx4y", "qti"."__text_uia6zcss44", "qti"."__text_ieskz75v7g", "qti"."__text_6gan25pdor", "qti"."__text_yakcqa4zli", "qti"."__text_dwt2qnsttp", "qti"."__text_x5wrjyn3pc", "qti"."__text_r5xluaej3z", "qti"."__text_hmmood6ekl", "qti"."__text_d72l462ftm", "qti"."__text_awt4t5kosa", "qti"."__text_hawigbfw6m", "qti"."__text_gubl3xpcnx", "qti"."__text_a4spx6pjqw", "qti"."__text_5zvd6hcv2x", "qti"."__text_djykoynpls", "qti"."__text_72jqunyi7z", "qti"."__text_5lyuoloiou", "qti"."__text_bvx3fqniye", "qti"."__text_dbdfklalek", "qti"."__text_k3z6naurdo", "qti"."__text_tdupg63xcv", "qti"."__text_tso7kvy6dv", "qti"."__text_wyfa622e2r", "qti"."__text_raisrajgpi", "qti"."__text_oy6p76tbqw", "qti"."__text_ojm4wya66v", "qti"."__text_acxfo763jg", "qti"."__text_tmjud3n2tg", "qti"."__text_o3dskk7ctt", "qti"."__text_rhdrzkabze", "qti"."__text_o3e7dedzyv", "qti"."__text_mvg26oprvk", "qti"."__text_clza6vokfo", "qti"."__text_qyq7zjychy", "qti"."__text_wjqnoy6t2y", "qti"."__text_tyjqwtj7ky", "qti"."__text_fgbxwprcwx", "qti"."__text_ifp42a6zk6", "qti"."__text_httzcaefcn", "qti"."__text_h4r6alp6hk", "qti"."__text_exm3fkarq3", "qti"."__text_6uwfpnix5n", "qti"."__text_kcydnvglpj", "qti"."__text_gm4clqaaza", "qti"."__text_saolosnhkp" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."acronym", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."associate_max_associations", "qti__author"."associate_min_associations", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct_response_arm", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_track_kind", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."dt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_associations", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_max_associations", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_associations", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices", "qti__author"."graphic_order_min_choices_n", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_choices", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_choices", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_choices", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_choices", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."kbd", "qti__author"."label", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_associations", "qti__author"."match_max_selections_message", "qti__author"."match_min_associations", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_max_choices", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."pre", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."ruby", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."select_point_interaction", "qti__author"."select_point_max_choices", "qti__author"."select_point_min_choices", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."string_binding", "qti__author"."strong", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable_ref", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."ws" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_match_min" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associable_hotspot_show_hide" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_max_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_min_associations" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_shuffle" FROM "qti__author";

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

GRANT SELECT ON TABLE "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."acronym", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."associate_max_associations", "qti__author"."associate_min_associations", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct_response_arm", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_track_kind", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."dt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_associations", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_max_associations", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_associations", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices", "qti__author"."graphic_order_min_choices_n", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_choices", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_choices", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_choices", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_choices", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."kbd", "qti__author"."label", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_associations", "qti__author"."match_max_selections_message", "qti__author"."match_min_associations", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_max_choices", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."pre", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."select_point_interaction", "qti__author"."select_point_max_choices", "qti__author"."select_point_min_choices", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."string_binding", "qti__author"."strong", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_feedback_block", "qti__author"."template_inline", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable_ref", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."ws" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."associable_hotspot_match_min" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associable_hotspot_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_max_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_min_associations" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_associate_shuffle" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_fixed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_required" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_inline_choice_show_hide" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_rubric_template_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_rubric_template_inline_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_max_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_select_point_min_choices" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_slider_step_label" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_block_show_hide" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declared_template_feedback_block_show_hide" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rubric_template_block" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rubric_template_inline" TO "qti__author";

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

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_feedback_block" TO "qti__author";

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

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."a", "qti"."a_type", "qti"."abbr", "qti"."acronym", "qti"."address", "qti"."admission", "qti"."ancestry_step", "qti"."area_map_entry", "qti"."area_mapping", "qti"."area_mapping_lower_bound", "qti"."area_mapping_upper_bound", "qti"."aria_activedescendant", "qti"."aria_atomic", "qti"."aria_autocomplete", "qti"."aria_busy", "qti"."aria_checked", "qti"."aria_colcount", "qti"."aria_colindex", "qti"."aria_colspan", "qti"."aria_controls", "qti"."aria_current", "qti"."aria_describedby", "qti"."aria_details", "qti"."aria_disabled", "qti"."aria_errormessage", "qti"."aria_expanded", "qti"."aria_flowto", "qti"."aria_haspopup", "qti"."aria_hidden", "qti"."aria_invalid", "qti"."aria_keyshortcuts", "qti"."aria_keyshorts", "qti"."aria_label", "qti"."aria_labelledby", "qti"."aria_level", "qti"."aria_live", "qti"."aria_modal", "qti"."aria_multiline", "qti"."aria_multiselectable", "qti"."aria_orientation", "qti"."aria_owns", "qti"."aria_placeholder", "qti"."aria_posinset", "qti"."aria_pressed", "qti"."aria_readonly", "qti"."aria_relevant", "qti"."aria_required", "qti"."aria_role", "qti"."aria_roledescription", "qti"."aria_rowcount", "qti"."aria_rowindex", "qti"."aria_rowspan", "qti"."aria_selected", "qti"."aria_setsize", "qti"."aria_sort", "qti"."aria_valuemax", "qti"."aria_valuemin", "qti"."aria_valuenow", "qti"."aria_valuetext", "qti"."article", "qti"."aside", "qti"."assessment_item", "qti"."assessment_item_label", "qti"."associable_hotspot", "qti"."associable_hotspot_label", "qti"."associable_hotspot_match_min", "qti"."associate_interaction", "qti"."associate_max_associations", "qti"."associate_min_associations", "qti"."attribute_admission", "qti"."attribute_entity_reference", "qti"."attribute_idref", "qti"."attribute_lexical", "qti"."audio", "qti"."audio_autoplay", "qti"."audio_controls", "qti"."audio_crossorigin", "qti"."audio_loop", "qti"."audio_mediagroup", "qti"."audio_muted", "qti"."audio_preload", "qti"."audio_src", "qti"."b", "qti"."bdi", "qti"."bdo", "qti"."bdo_title", "qti"."big", "qti"."binding_fit", "qti"."blockquote", "qti"."blockquote_cite", "qti"."br", "qti"."built_in_ref", "qti"."caption", "qti"."catalog_info", "qti"."choice_interaction", "qti"."choice_interaction_max_selections_message", "qti"."choice_interaction_min_selections_message", "qti"."choice_template_ref", "qti"."cite", "qti"."code", "qti"."col", "qti"."col_span", "qti"."colgroup", "qti"."colgroup_span", "qti"."comment", "qti"."companion_materials_info", "qti"."content_body_feedback", "qti"."content_body_modal", "qti"."content_body_rubric", "qti"."content_body_rubric_template", "qti"."content_body_template", "qti"."context_declaration_arm", "qti"."context_declaration_id", "qti"."coords", "qti"."coords_circle", "qti"."coords_default", "qti"."coords_ellipse", "qti"."coords_poly", "qti"."coords_rect", "qti"."correct_response_arm", "qti"."dd", "qti"."declaration", "qti"."declaration_external_scored", "qti"."declaration_interpretation", "qti"."declaration_long_interpretation", "qti"."declaration_mastery_value", "qti"."declaration_normal_maximum", "qti"."declaration_normal_minimum", "qti"."declaration_variable_identifier_ref", "qti"."declaration_view", "qti"."declared_adaptive", "qti"."declared_area_mapping_default_value", "qti"."declared_associable_hotspot_show_hide", "qti"."declared_associate_max_associations", "qti"."declared_associate_min_associations", "qti"."declared_associate_shuffle", "qti"."declared_extended_text_base", "qti"."declared_extended_text_format", "qti"."declared_extended_text_min_strings", "qti"."declared_feedback_block_show_hide", "qti"."declared_feedback_inline_show_hide", "qti"."declared_fixed", "qti"."declared_gap_img_show_hide", "qti"."declared_gap_match_max_associations", "qti"."declared_gap_match_shuffle", "qti"."declared_gap_required", "qti"."declared_gap_show_hide", "qti"."declared_gap_text_show_hide", "qti"."declared_graphic_associate_max_associations", "qti"."declared_graphic_gap_match_max_associations", "qti"."declared_hotspot_choice_show_hide", "qti"."declared_hotspot_max_choices", "qti"."declared_hotspot_min_choices", "qti"."declared_hottext_max_choices", "qti"."declared_hottext_min_choices", "qti"."declared_hottext_show_hide", "qti"."declared_include_boundary", "qti"."declared_inline_choice_fixed", "qti"."declared_inline_choice_min_choices", "qti"."declared_inline_choice_required", "qti"."declared_inline_choice_show_hide", "qti"."declared_inline_choice_shuffle", "qti"."declared_map_entry_case_sensitive", "qti"."declared_mapping_default_value", "qti"."declared_match_max_associations", "qti"."declared_match_min_associations", "qti"."declared_match_shuffle", "qti"."declared_math_variable", "qti"."declared_max_choices", "qti"."declared_media_loop", "qti"."declared_min_choices", "qti"."declared_orientation", "qti"."declared_param_variable", "qti"."declared_position_object_max_choices", "qti"."declared_printed_variable_base", "qti"."declared_printed_variable_delimiter", "qti"."declared_printed_variable_mapping_indicator", "qti"."declared_printed_variable_power_form", "qti"."declared_ref", "qti"."declared_rubric_template_block_show_hide", "qti"."declared_rubric_template_inline_show_hide", "qti"."declared_select_point_max_choices", "qti"."declared_select_point_min_choices", "qti"."declared_show_hide", "qti"."declared_shuffle", "qti"."declared_slider_step_label", "qti"."declared_template_block_show_hide", "qti"."declared_template_feedback_block_show_hide", "qti"."declared_template_inline_show_hide", "qti"."declared_text_entry_base", "qti"."declared_track_kind", "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri", "qti"."declared_valuetype", "qti"."default_value_arm", "qti"."dependency", "qti"."details", "qti"."details_open", "qti"."dfn", "qti"."div", "qti"."dl", "qti"."document", "qti"."document_id", "qti"."document_identifier", "qti"."document_lang", "qti"."document_title", "qti"."drawing_interaction", "qti"."dt", "qti"."edge", "qti"."em", "qti"."end_attempt_count_attempt", "qti"."end_attempt_interaction", "qti"."entity_reference", "qti"."expression", "qti"."extended_text_expected_length", "qti"."extended_text_expected_lines", "qti"."extended_text_interaction", "qti"."extended_text_max_strings", "qti"."extended_text_pattern_mask", "qti"."extended_text_patternmask_message", "qti"."extended_text_placeholder_text", "qti"."feedback_block", "qti"."feedback_inline", "qti"."feedback_outcome_ref", "qti"."figcaption", "qti"."figure", "qti"."file", "qti"."file_content", "qti"."footer", "qti"."gap", "qti"."gap_img", "qti"."gap_img_left", "qti"."gap_img_match_min", "qti"."gap_img_object_label", "qti"."gap_img_top", "qti"."gap_match_binding", "qti"."gap_match_choices_container_width", "qti"."gap_match_interaction", "qti"."gap_match_max_associations", "qti"."gap_match_max_selections_message", "qti"."gap_match_min_associations", "qti"."gap_match_min_selections_message", "qti"."gap_text", "qti"."gap_text_match_min", "qti"."graphic_associate_interaction", "qti"."graphic_associate_max_associations", "qti"."graphic_associate_min_associations", "qti"."graphic_gap_match_choices_container_width", "qti"."graphic_gap_match_interaction", "qti"."graphic_gap_match_max_associations", "qti"."graphic_gap_match_max_selections_message", "qti"."graphic_gap_match_min_associations", "qti"."graphic_gap_match_min_selections_message", "qti"."graphic_order_interaction", "qti"."graphic_order_max_choices", "qti"."graphic_order_max_choices_n", "qti"."graphic_order_min_choices", "qti"."graphic_order_min_choices_n", "qti"."h_1", "qti"."h_2", "qti"."h_3", "qti"."h_4", "qti"."h_5", "qti"."h_6", "qti"."header", "qti"."headers_target", "qti"."hotspot_choice", "qti"."hotspot_choice_label", "qti"."hotspot_interaction", "qti"."hotspot_max_choices", "qti"."hotspot_max_selections_message", "qti"."hotspot_min_choices", "qti"."hotspot_min_selections_message", "qti"."hottext", "qti"."hottext_interaction", "qti"."hottext_max_choices", "qti"."hottext_max_selections_message", "qti"."hottext_min_choices", "qti"."hottext_min_selections_message", "qti"."hottext_owner", "qti"."hr", "qti"."html_id", "qti"."i", "qti"."img", "qti"."img_height", "qti"."img_longdesc", "qti"."img_width", "qti"."inline_choice", "qti"."inline_choice_interaction", "qti"."inline_choice_min_selections_message", "qti"."inline_choice_prompt", "qti"."interaction_binding", "qti"."interpolation_table", "qti"."interpolation_table_default_value", "qti"."interpolation_table_default_value_boolean", "qti"."interpolation_table_default_value_directed_pair", "qti"."interpolation_table_default_value_duration", "qti"."interpolation_table_default_value_file", "qti"."interpolation_table_default_value_float", "qti"."interpolation_table_default_value_identifier", "qti"."interpolation_table_default_value_integer", "qti"."interpolation_table_default_value_pair", "qti"."interpolation_table_default_value_point", "qti"."interpolation_table_default_value_string", "qti"."interpolation_table_default_value_uri", "qti"."interpolation_table_entry", "qti"."interpolation_table_entry_boolean", "qti"."interpolation_table_entry_directed_pair", "qti"."interpolation_table_entry_duration", "qti"."interpolation_table_entry_file", "qti"."interpolation_table_entry_float", "qti"."interpolation_table_entry_identifier", "qti"."interpolation_table_entry_integer", "qti"."interpolation_table_entry_pair", "qti"."interpolation_table_entry_point", "qti"."interpolation_table_entry_string", "qti"."interpolation_table_entry_uri", "qti"."item_body", "qti"."item_body_id", "qti"."item_tool", "qti"."item_tool_both", "qti"."item_tool_name", "qti"."item_tool_version", "qti"."kbd", "qti"."label", "qti"."li", "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri", "qti"."lom", "qti"."lom_aggregation_level", "qti"."lom_contribute", "qti"."lom_copyright_and_other_restrictions", "qti"."lom_cost", "qti"."lom_coverage", "qti"."lom_date", "qti"."lom_date_time", "qti"."lom_description", "qti"."lom_duration", "qti"."lom_duration_string", "qti"."lom_entity", "qti"."lom_format", "qti"."lom_general", "qti"."lom_general_title", "qti"."lom_identifier", "qti"."lom_identifier_catalog", "qti"."lom_identifier_entry", "qti"."lom_installation_remarks", "qti"."lom_keyword", "qti"."lom_language", "qti"."lom_life_cycle", "qti"."lom_location", "qti"."lom_maximum_version", "qti"."lom_meta_metadata", "qti"."lom_metadataschema", "qti"."lom_minimum_version", "qti"."lom_name", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_or_composite", "qti"."lom_other_platform_requirements", "qti"."lom_requirement", "qti"."lom_rights", "qti"."lom_role", "qti"."lom_size", "qti"."lom_source", "qti"."lom_status", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_structure", "qti"."lom_technical", "qti"."lom_title", "qti"."lom_type", "qti"."lom_value", "qti"."lom_version", "qti"."manifest", "qti"."manifest_lom", "qti"."manifest_metadata", "qti"."manifest_schema", "qti"."manifest_schema_version", "qti"."map_entry", "qti"."map_entry_boolean", "qti"."map_entry_directed_pair", "qti"."map_entry_duration", "qti"."map_entry_file", "qti"."map_entry_float", "qti"."map_entry_identifier", "qti"."map_entry_integer", "qti"."map_entry_pair", "qti"."map_entry_point", "qti"."map_entry_string", "qti"."map_entry_uri", "qti"."mappable_base_type", "qti"."mapping", "qti"."mapping_lower_bound", "qti"."mapping_upper_bound", "qti"."match_first_column_header", "qti"."match_group", "qti"."match_interaction", "qti"."match_max_associations", "qti"."match_max_selections_message", "qti"."match_min_associations", "qti"."match_min_selections_message", "qti"."match_table", "qti"."match_table_default_value", "qti"."match_table_default_value_boolean", "qti"."match_table_default_value_directed_pair", "qti"."match_table_default_value_duration", "qti"."match_table_default_value_file", "qti"."match_table_default_value_float", "qti"."match_table_default_value_identifier", "qti"."match_table_default_value_integer", "qti"."match_table_default_value_pair", "qti"."match_table_default_value_point", "qti"."match_table_default_value_string", "qti"."match_table_default_value_uri", "qti"."match_table_entry", "qti"."match_table_entry_boolean", "qti"."match_table_entry_directed_pair", "qti"."match_table_entry_duration", "qti"."match_table_entry_file", "qti"."match_table_entry_float", "qti"."match_table_entry_identifier", "qti"."match_table_entry_integer", "qti"."match_table_entry_pair", "qti"."match_table_entry_point", "qti"."match_table_entry_string", "qti"."match_table_entry_uri", "qti"."media_coords", "qti"."media_interaction", "qti"."media_max_plays", "qti"."media_min_plays", "qti"."modal_feedback", "qti"."modal_feedback_title", "qti"."namespace_declaration", "qti"."nav", "qti"."node", "qti"."node_catalog_idref", "qti"."node_class", "qti"."node_dir", "qti"."node_label", "qti"."node_lang", "qti"."node_suppress_tts", "qti"."node_xml_base", "qti"."node_xml_lang", "qti"."object", "qti"."object_height", "qti"."object_width", "qti"."ol", "qti"."operand", "qti"."operator_arity", "qti"."operator_arity_max", "qti"."order_choices_container_width", "qti"."order_interaction", "qti"."order_max_choices", "qti"."order_max_choices_n", "qti"."order_max_selections_message", "qti"."order_min_choices", "qti"."order_min_choices_n", "qti"."order_min_selections_message", "qti"."order_orientation", "qti"."organizations", "qti"."outcome_declaration_arm", "qti"."p", "qti"."package", "qti"."package_entry", "qti"."param", "qti"."param_type", "qti"."pi", "qti"."picture", "qti"."position_object_center_point", "qti"."position_object_interaction", "qti"."position_object_max_choices", "qti"."position_object_min_choices", "qti"."position_object_stage", "qti"."pre", "qti"."printed_variable", "qti"."printed_variable_field", "qti"."printed_variable_format", "qti"."printed_variable_id", "qti"."printed_variable_index", "qti"."printed_variable_ref", "qti"."printed_variable_var_ref", "qti"."prompt", "qti"."q", "qti"."q_cite", "qti"."qmd_composite", "qti"."qmd_custom_type_identifier", "qti"."qmd_feedback_type", "qti"."qmd_interaction_kind", "qti"."qmd_interaction_type", "qti"."qmd_item_template", "qti"."qmd_portable_custom_interaction_context", "qti"."qmd_scoring_mode", "qti"."qmd_solution_available", "qti"."qmd_time_dependent", "qti"."qmd_tool_name", "qti"."qmd_tool_vendor", "qti"."qmd_tool_version", "qti"."qti_label", "qti"."qti_metadata", "qti"."rb", "qti"."record_binding", "qti"."record_binding_fit", "qti"."record_declaration", "qti"."record_field", "qti"."record_value_set", "qti"."resource", "qti"."resource_href", "qti"."resource_lom", "qti"."resource_lom_general", "qti"."resource_lom_identified", "qti"."resource_lom_language_set", "qti"."resource_lom_titled", "qti"."resource_metadata", "qti"."resource_type_of", "qti"."resources", "qti"."response_declaration_arm", "qti"."response_declaration_id", "qti"."response_processing", "qti"."response_processing_item", "qti"."response_processing_template", "qti"."response_processing_template_location", "qti"."root_of_type", "qti"."rp", "qti"."rt", "qti"."rtc", "qti"."rubric_block", "qti"."rubric_template_block", "qti"."rubric_template_inline", "qti"."ruby", "qti"."samp", "qti"."schema_location", "qti"."section", "qti"."select_point_interaction", "qti"."select_point_max_choices", "qti"."select_point_min_choices", "qti"."simple_associable_choice", "qti"."simple_associable_choice_fixed", "qti"."simple_associable_choice_match_min", "qti"."simple_associable_choice_match_set", "qti"."simple_associable_choice_show_hide", "qti"."simple_choice", "qti"."simple_choice_template_identifier", "qti"."simple_match_set", "qti"."slider_interaction", "qti"."slider_orientation", "qti"."slider_reverse", "qti"."slider_step", "qti"."small", "qti"."source", "qti"."source_media", "qti"."source_sizes", "qti"."source_srcset", "qti"."source_type", "qti"."span", "qti"."standard_template_reference", "qti"."string_binding", "qti"."strong", "qti"."stylesheet", "qti"."stylesheet_media", "qti"."stylesheet_title", "qti"."sub", "qti"."summary", "qti"."sup", "qti"."table", "qti"."table_summary", "qti"."tbody", "qti"."td", "qti"."td_abbr", "qti"."td_align", "qti"."td_axis", "qti"."td_colspan", "qti"."td_rowspan", "qti"."td_scope", "qti"."td_valign", "qti"."template", "qti"."template_block", "qti"."template_content_ref", "qti"."template_declaration_arm", "qti"."template_feedback_block", "qti"."template_inline", "qti"."text_entry_expected_length", "qti"."text_entry_format", "qti"."text_entry_interaction", "qti"."text_entry_pattern_mask", "qti"."text_entry_patternmask_message", "qti"."text_entry_placeholder_text", "qti"."text_node", "qti"."tfoot", "qti"."th", "qti"."th_abbr", "qti"."th_align", "qti"."th_axis", "qti"."th_colspan", "qti"."th_rowspan", "qti"."th_scope", "qti"."th_valign", "qti"."thead", "qti"."tr", "qti"."track", "qti"."track_default", "qti"."track_srclang", "qti"."tree", "qti"."tree_doctype", "qti"."tree_export_charset", "qti"."tree_misc", "qti"."tree_root", "qti"."tree_xml_encoding", "qti"."tree_xml_standalone", "qti"."tree_xml_version", "qti"."tt", "qti"."typed_binding", "qti"."typed_declaration", "qti"."typed_value_set", "qti"."ul", "qti"."upload_interaction", "qti"."upload_type", "qti"."value_set", "qti"."value_set_interpretation", "qti"."var", "qti"."variable_ref", "qti"."video", "qti"."video_autoplay", "qti"."video_controls", "qti"."video_crossorigin", "qti"."video_height", "qti"."video_loop", "qti"."video_mediagroup", "qti"."video_muted", "qti"."video_poster", "qti"."video_preload", "qti"."video_src", "qti"."video_width", "qti"."ws", "qti__author"."a", "qti__author"."a_type", "qti__author"."abbr", "qti__author"."acronym", "qti__author"."address", "qti__author"."admission", "qti__author"."ancestry_step", "qti__author"."area_map_entry", "qti__author"."area_mapping", "qti__author"."area_mapping_lower_bound", "qti__author"."area_mapping_upper_bound", "qti__author"."aria_activedescendant", "qti__author"."aria_atomic", "qti__author"."aria_autocomplete", "qti__author"."aria_busy", "qti__author"."aria_checked", "qti__author"."aria_colcount", "qti__author"."aria_colindex", "qti__author"."aria_colspan", "qti__author"."aria_controls", "qti__author"."aria_current", "qti__author"."aria_describedby", "qti__author"."aria_details", "qti__author"."aria_disabled", "qti__author"."aria_errormessage", "qti__author"."aria_expanded", "qti__author"."aria_flowto", "qti__author"."aria_haspopup", "qti__author"."aria_hidden", "qti__author"."aria_invalid", "qti__author"."aria_keyshortcuts", "qti__author"."aria_keyshorts", "qti__author"."aria_label", "qti__author"."aria_labelledby", "qti__author"."aria_level", "qti__author"."aria_live", "qti__author"."aria_modal", "qti__author"."aria_multiline", "qti__author"."aria_multiselectable", "qti__author"."aria_orientation", "qti__author"."aria_owns", "qti__author"."aria_placeholder", "qti__author"."aria_posinset", "qti__author"."aria_pressed", "qti__author"."aria_readonly", "qti__author"."aria_relevant", "qti__author"."aria_required", "qti__author"."aria_role", "qti__author"."aria_roledescription", "qti__author"."aria_rowcount", "qti__author"."aria_rowindex", "qti__author"."aria_rowspan", "qti__author"."aria_selected", "qti__author"."aria_setsize", "qti__author"."aria_sort", "qti__author"."aria_valuemax", "qti__author"."aria_valuemin", "qti__author"."aria_valuenow", "qti__author"."aria_valuetext", "qti__author"."article", "qti__author"."aside", "qti__author"."assessment_item", "qti__author"."assessment_item_label", "qti__author"."associable_hotspot", "qti__author"."associable_hotspot_label", "qti__author"."associable_hotspot_match_min", "qti__author"."associate_interaction", "qti__author"."associate_max_associations", "qti__author"."associate_min_associations", "qti__author"."attribute_admission", "qti__author"."attribute_entity_reference", "qti__author"."attribute_idref", "qti__author"."attribute_lexical", "qti__author"."audio", "qti__author"."audio_autoplay", "qti__author"."audio_controls", "qti__author"."audio_crossorigin", "qti__author"."audio_loop", "qti__author"."audio_mediagroup", "qti__author"."audio_muted", "qti__author"."audio_preload", "qti__author"."audio_src", "qti__author"."b", "qti__author"."bdi", "qti__author"."bdo", "qti__author"."bdo_title", "qti__author"."big", "qti__author"."binding_fit", "qti__author"."blockquote", "qti__author"."blockquote_cite", "qti__author"."br", "qti__author"."built_in_ref", "qti__author"."caption", "qti__author"."catalog_info", "qti__author"."choice_interaction", "qti__author"."choice_interaction_max_selections_message", "qti__author"."choice_interaction_min_selections_message", "qti__author"."choice_template_ref", "qti__author"."cite", "qti__author"."code", "qti__author"."col", "qti__author"."col_span", "qti__author"."colgroup", "qti__author"."colgroup_span", "qti__author"."comment", "qti__author"."companion_materials_info", "qti__author"."content_body_feedback", "qti__author"."content_body_modal", "qti__author"."content_body_rubric", "qti__author"."content_body_rubric_template", "qti__author"."content_body_template", "qti__author"."context_declaration_arm", "qti__author"."context_declaration_id", "qti__author"."coords", "qti__author"."coords_circle", "qti__author"."coords_default", "qti__author"."coords_ellipse", "qti__author"."coords_poly", "qti__author"."coords_rect", "qti__author"."correct_response_arm", "qti__author"."dd", "qti__author"."declaration", "qti__author"."declaration_external_scored", "qti__author"."declaration_interpretation", "qti__author"."declaration_long_interpretation", "qti__author"."declaration_mastery_value", "qti__author"."declaration_normal_maximum", "qti__author"."declaration_normal_minimum", "qti__author"."declaration_variable_identifier_ref", "qti__author"."declaration_view", "qti__author"."declared_adaptive", "qti__author"."declared_area_mapping_default_value", "qti__author"."declared_associable_hotspot_show_hide", "qti__author"."declared_associate_max_associations", "qti__author"."declared_associate_min_associations", "qti__author"."declared_associate_shuffle", "qti__author"."declared_extended_text_base", "qti__author"."declared_extended_text_format", "qti__author"."declared_extended_text_min_strings", "qti__author"."declared_feedback_block_show_hide", "qti__author"."declared_feedback_inline_show_hide", "qti__author"."declared_fixed", "qti__author"."declared_gap_img_show_hide", "qti__author"."declared_gap_match_max_associations", "qti__author"."declared_gap_match_shuffle", "qti__author"."declared_gap_required", "qti__author"."declared_gap_show_hide", "qti__author"."declared_gap_text_show_hide", "qti__author"."declared_graphic_associate_max_associations", "qti__author"."declared_graphic_gap_match_max_associations", "qti__author"."declared_hotspot_choice_show_hide", "qti__author"."declared_hotspot_max_choices", "qti__author"."declared_hotspot_min_choices", "qti__author"."declared_hottext_max_choices", "qti__author"."declared_hottext_min_choices", "qti__author"."declared_hottext_show_hide", "qti__author"."declared_include_boundary", "qti__author"."declared_inline_choice_fixed", "qti__author"."declared_inline_choice_min_choices", "qti__author"."declared_inline_choice_required", "qti__author"."declared_inline_choice_show_hide", "qti__author"."declared_inline_choice_shuffle", "qti__author"."declared_map_entry_case_sensitive", "qti__author"."declared_mapping_default_value", "qti__author"."declared_match_max_associations", "qti__author"."declared_match_min_associations", "qti__author"."declared_match_shuffle", "qti__author"."declared_math_variable", "qti__author"."declared_max_choices", "qti__author"."declared_media_loop", "qti__author"."declared_min_choices", "qti__author"."declared_orientation", "qti__author"."declared_param_variable", "qti__author"."declared_position_object_max_choices", "qti__author"."declared_printed_variable_base", "qti__author"."declared_printed_variable_delimiter", "qti__author"."declared_printed_variable_mapping_indicator", "qti__author"."declared_printed_variable_power_form", "qti__author"."declared_ref", "qti__author"."declared_rubric_template_block_show_hide", "qti__author"."declared_rubric_template_inline_show_hide", "qti__author"."declared_select_point_max_choices", "qti__author"."declared_select_point_min_choices", "qti__author"."declared_show_hide", "qti__author"."declared_shuffle", "qti__author"."declared_slider_step_label", "qti__author"."declared_template_block_show_hide", "qti__author"."declared_template_feedback_block_show_hide", "qti__author"."declared_template_inline_show_hide", "qti__author"."declared_text_entry_base", "qti__author"."declared_track_kind", "qti__author"."declared_value", "qti__author"."declared_value_boolean", "qti__author"."declared_value_directed_pair", "qti__author"."declared_value_duration", "qti__author"."declared_value_file", "qti__author"."declared_value_float", "qti__author"."declared_value_identifier", "qti__author"."declared_value_integer", "qti__author"."declared_value_pair", "qti__author"."declared_value_point", "qti__author"."declared_value_string", "qti__author"."declared_value_uri", "qti__author"."declared_valuetype", "qti__author"."default_value_arm", "qti__author"."dependency", "qti__author"."details", "qti__author"."details_open", "qti__author"."dfn", "qti__author"."div", "qti__author"."dl", "qti__author"."document", "qti__author"."document_id", "qti__author"."document_identifier", "qti__author"."document_lang", "qti__author"."document_title", "qti__author"."drawing_interaction", "qti__author"."dt", "qti__author"."edge", "qti__author"."em", "qti__author"."end_attempt_count_attempt", "qti__author"."end_attempt_interaction", "qti__author"."entity_reference", "qti__author"."expression", "qti__author"."extended_text_expected_length", "qti__author"."extended_text_expected_lines", "qti__author"."extended_text_interaction", "qti__author"."extended_text_max_strings", "qti__author"."extended_text_pattern_mask", "qti__author"."extended_text_patternmask_message", "qti__author"."extended_text_placeholder_text", "qti__author"."feedback_block", "qti__author"."feedback_inline", "qti__author"."feedback_outcome_ref", "qti__author"."figcaption", "qti__author"."figure", "qti__author"."file", "qti__author"."file_content", "qti__author"."footer", "qti__author"."gap", "qti__author"."gap_img", "qti__author"."gap_img_left", "qti__author"."gap_img_match_min", "qti__author"."gap_img_object_label", "qti__author"."gap_img_top", "qti__author"."gap_match_binding", "qti__author"."gap_match_choices_container_width", "qti__author"."gap_match_interaction", "qti__author"."gap_match_max_associations", "qti__author"."gap_match_max_selections_message", "qti__author"."gap_match_min_associations", "qti__author"."gap_match_min_selections_message", "qti__author"."gap_text", "qti__author"."gap_text_match_min", "qti__author"."graphic_associate_interaction", "qti__author"."graphic_associate_max_associations", "qti__author"."graphic_associate_min_associations", "qti__author"."graphic_gap_match_choices_container_width", "qti__author"."graphic_gap_match_interaction", "qti__author"."graphic_gap_match_max_associations", "qti__author"."graphic_gap_match_max_selections_message", "qti__author"."graphic_gap_match_min_associations", "qti__author"."graphic_gap_match_min_selections_message", "qti__author"."graphic_order_interaction", "qti__author"."graphic_order_max_choices", "qti__author"."graphic_order_max_choices_n", "qti__author"."graphic_order_min_choices", "qti__author"."graphic_order_min_choices_n", "qti__author"."h_1", "qti__author"."h_2", "qti__author"."h_3", "qti__author"."h_4", "qti__author"."h_5", "qti__author"."h_6", "qti__author"."header", "qti__author"."headers_target", "qti__author"."hotspot_choice", "qti__author"."hotspot_choice_label", "qti__author"."hotspot_interaction", "qti__author"."hotspot_max_choices", "qti__author"."hotspot_max_selections_message", "qti__author"."hotspot_min_choices", "qti__author"."hotspot_min_selections_message", "qti__author"."hottext", "qti__author"."hottext_interaction", "qti__author"."hottext_max_choices", "qti__author"."hottext_max_selections_message", "qti__author"."hottext_min_choices", "qti__author"."hottext_min_selections_message", "qti__author"."hottext_owner", "qti__author"."hr", "qti__author"."html_id", "qti__author"."i", "qti__author"."img", "qti__author"."img_height", "qti__author"."img_longdesc", "qti__author"."img_width", "qti__author"."inline_choice", "qti__author"."inline_choice_interaction", "qti__author"."inline_choice_min_selections_message", "qti__author"."inline_choice_prompt", "qti__author"."interaction_binding", "qti__author"."interpolation_table", "qti__author"."interpolation_table_default_value", "qti__author"."interpolation_table_default_value_boolean", "qti__author"."interpolation_table_default_value_directed_pair", "qti__author"."interpolation_table_default_value_duration", "qti__author"."interpolation_table_default_value_file", "qti__author"."interpolation_table_default_value_float", "qti__author"."interpolation_table_default_value_identifier", "qti__author"."interpolation_table_default_value_integer", "qti__author"."interpolation_table_default_value_pair", "qti__author"."interpolation_table_default_value_point", "qti__author"."interpolation_table_default_value_string", "qti__author"."interpolation_table_default_value_uri", "qti__author"."interpolation_table_entry", "qti__author"."interpolation_table_entry_boolean", "qti__author"."interpolation_table_entry_directed_pair", "qti__author"."interpolation_table_entry_duration", "qti__author"."interpolation_table_entry_file", "qti__author"."interpolation_table_entry_float", "qti__author"."interpolation_table_entry_identifier", "qti__author"."interpolation_table_entry_integer", "qti__author"."interpolation_table_entry_pair", "qti__author"."interpolation_table_entry_point", "qti__author"."interpolation_table_entry_string", "qti__author"."interpolation_table_entry_uri", "qti__author"."item_body", "qti__author"."item_body_id", "qti__author"."item_tool", "qti__author"."item_tool_both", "qti__author"."item_tool_name", "qti__author"."item_tool_version", "qti__author"."kbd", "qti__author"."label", "qti__author"."li", "qti__author"."literal", "qti__author"."literal_boolean", "qti__author"."literal_directed_pair", "qti__author"."literal_duration", "qti__author"."literal_file", "qti__author"."literal_float", "qti__author"."literal_identifier", "qti__author"."literal_integer", "qti__author"."literal_pair", "qti__author"."literal_point", "qti__author"."literal_string", "qti__author"."literal_uri", "qti__author"."lom", "qti__author"."lom_aggregation_level", "qti__author"."lom_contribute", "qti__author"."lom_copyright_and_other_restrictions", "qti__author"."lom_cost", "qti__author"."lom_coverage", "qti__author"."lom_date", "qti__author"."lom_date_time", "qti__author"."lom_description", "qti__author"."lom_duration", "qti__author"."lom_duration_string", "qti__author"."lom_entity", "qti__author"."lom_format", "qti__author"."lom_general", "qti__author"."lom_general_title", "qti__author"."lom_identifier", "qti__author"."lom_identifier_catalog", "qti__author"."lom_identifier_entry", "qti__author"."lom_installation_remarks", "qti__author"."lom_keyword", "qti__author"."lom_language", "qti__author"."lom_life_cycle", "qti__author"."lom_location", "qti__author"."lom_maximum_version", "qti__author"."lom_meta_metadata", "qti__author"."lom_metadataschema", "qti__author"."lom_minimum_version", "qti__author"."lom_name", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_or_composite", "qti__author"."lom_other_platform_requirements", "qti__author"."lom_requirement", "qti__author"."lom_rights", "qti__author"."lom_role", "qti__author"."lom_size", "qti__author"."lom_source", "qti__author"."lom_status", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_structure", "qti__author"."lom_technical", "qti__author"."lom_title", "qti__author"."lom_type", "qti__author"."lom_value", "qti__author"."lom_version", "qti__author"."manifest", "qti__author"."manifest_lom", "qti__author"."manifest_metadata", "qti__author"."manifest_schema", "qti__author"."manifest_schema_version", "qti__author"."map_entry", "qti__author"."map_entry_boolean", "qti__author"."map_entry_directed_pair", "qti__author"."map_entry_duration", "qti__author"."map_entry_file", "qti__author"."map_entry_float", "qti__author"."map_entry_identifier", "qti__author"."map_entry_integer", "qti__author"."map_entry_pair", "qti__author"."map_entry_point", "qti__author"."map_entry_string", "qti__author"."map_entry_uri", "qti__author"."mappable_base_type", "qti__author"."mapping", "qti__author"."mapping_lower_bound", "qti__author"."mapping_upper_bound", "qti__author"."match_first_column_header", "qti__author"."match_group", "qti__author"."match_interaction", "qti__author"."match_max_associations", "qti__author"."match_max_selections_message", "qti__author"."match_min_associations", "qti__author"."match_min_selections_message", "qti__author"."match_table", "qti__author"."match_table_default_value", "qti__author"."match_table_default_value_boolean", "qti__author"."match_table_default_value_directed_pair", "qti__author"."match_table_default_value_duration", "qti__author"."match_table_default_value_file", "qti__author"."match_table_default_value_float", "qti__author"."match_table_default_value_identifier", "qti__author"."match_table_default_value_integer", "qti__author"."match_table_default_value_pair", "qti__author"."match_table_default_value_point", "qti__author"."match_table_default_value_string", "qti__author"."match_table_default_value_uri", "qti__author"."match_table_entry", "qti__author"."match_table_entry_boolean", "qti__author"."match_table_entry_directed_pair", "qti__author"."match_table_entry_duration", "qti__author"."match_table_entry_file", "qti__author"."match_table_entry_float", "qti__author"."match_table_entry_identifier", "qti__author"."match_table_entry_integer", "qti__author"."match_table_entry_pair", "qti__author"."match_table_entry_point", "qti__author"."match_table_entry_string", "qti__author"."match_table_entry_uri", "qti__author"."media_coords", "qti__author"."media_interaction", "qti__author"."media_max_plays", "qti__author"."media_min_plays", "qti__author"."modal_feedback", "qti__author"."modal_feedback_title", "qti__author"."namespace_declaration", "qti__author"."nav", "qti__author"."node", "qti__author"."node_catalog_idref", "qti__author"."node_class", "qti__author"."node_dir", "qti__author"."node_label", "qti__author"."node_lang", "qti__author"."node_suppress_tts", "qti__author"."node_xml_base", "qti__author"."node_xml_lang", "qti__author"."object", "qti__author"."object_height", "qti__author"."object_width", "qti__author"."ol", "qti__author"."operand", "qti__author"."operator_arity", "qti__author"."operator_arity_max", "qti__author"."order_choices_container_width", "qti__author"."order_interaction", "qti__author"."order_max_choices", "qti__author"."order_max_choices_n", "qti__author"."order_max_selections_message", "qti__author"."order_min_choices", "qti__author"."order_min_choices_n", "qti__author"."order_min_selections_message", "qti__author"."order_orientation", "qti__author"."organizations", "qti__author"."outcome_declaration_arm", "qti__author"."p", "qti__author"."package", "qti__author"."package_entry", "qti__author"."param", "qti__author"."param_type", "qti__author"."pi", "qti__author"."picture", "qti__author"."position_object_center_point", "qti__author"."position_object_interaction", "qti__author"."position_object_max_choices", "qti__author"."position_object_min_choices", "qti__author"."position_object_stage", "qti__author"."pre", "qti__author"."printed_variable", "qti__author"."printed_variable_field", "qti__author"."printed_variable_format", "qti__author"."printed_variable_id", "qti__author"."printed_variable_index", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_var_ref", "qti__author"."prompt", "qti__author"."q", "qti__author"."q_cite", "qti__author"."qmd_composite", "qti__author"."qmd_custom_type_identifier", "qti__author"."qmd_feedback_type", "qti__author"."qmd_interaction_kind", "qti__author"."qmd_interaction_type", "qti__author"."qmd_item_template", "qti__author"."qmd_portable_custom_interaction_context", "qti__author"."qmd_scoring_mode", "qti__author"."qmd_solution_available", "qti__author"."qmd_time_dependent", "qti__author"."qmd_tool_name", "qti__author"."qmd_tool_vendor", "qti__author"."qmd_tool_version", "qti__author"."qti_label", "qti__author"."qti_metadata", "qti__author"."rb", "qti__author"."record_binding", "qti__author"."record_binding_fit", "qti__author"."record_declaration", "qti__author"."record_field", "qti__author"."record_value_set", "qti__author"."resource", "qti__author"."resource_href", "qti__author"."resource_lom", "qti__author"."resource_lom_general", "qti__author"."resource_lom_identified", "qti__author"."resource_lom_language_set", "qti__author"."resource_lom_titled", "qti__author"."resource_metadata", "qti__author"."resource_type_of", "qti__author"."resources", "qti__author"."response_declaration_arm", "qti__author"."response_declaration_id", "qti__author"."response_processing", "qti__author"."response_processing_item", "qti__author"."response_processing_template", "qti__author"."response_processing_template_location", "qti__author"."root_of_type", "qti__author"."rp", "qti__author"."rt", "qti__author"."rtc", "qti__author"."rubric_block", "qti__author"."rubric_template_block", "qti__author"."rubric_template_inline", "qti__author"."ruby", "qti__author"."samp", "qti__author"."schema_location", "qti__author"."section", "qti__author"."select_point_interaction", "qti__author"."select_point_max_choices", "qti__author"."select_point_min_choices", "qti__author"."simple_associable_choice", "qti__author"."simple_associable_choice_fixed", "qti__author"."simple_associable_choice_match_min", "qti__author"."simple_associable_choice_match_set", "qti__author"."simple_associable_choice_show_hide", "qti__author"."simple_choice", "qti__author"."simple_choice_template_identifier", "qti__author"."simple_match_set", "qti__author"."slider_interaction", "qti__author"."slider_orientation", "qti__author"."slider_reverse", "qti__author"."slider_step", "qti__author"."small", "qti__author"."source", "qti__author"."source_media", "qti__author"."source_sizes", "qti__author"."source_srcset", "qti__author"."source_type", "qti__author"."span", "qti__author"."standard_template_reference", "qti__author"."string_binding", "qti__author"."strong", "qti__author"."stylesheet", "qti__author"."stylesheet_media", "qti__author"."stylesheet_title", "qti__author"."sub", "qti__author"."summary", "qti__author"."sup", "qti__author"."table", "qti__author"."table_summary", "qti__author"."tbody", "qti__author"."td", "qti__author"."td_abbr", "qti__author"."td_align", "qti__author"."td_axis", "qti__author"."td_colspan", "qti__author"."td_rowspan", "qti__author"."td_scope", "qti__author"."td_valign", "qti__author"."template", "qti__author"."template_block", "qti__author"."template_content_ref", "qti__author"."template_declaration_arm", "qti__author"."template_feedback_block", "qti__author"."template_inline", "qti__author"."text_entry_expected_length", "qti__author"."text_entry_format", "qti__author"."text_entry_interaction", "qti__author"."text_entry_pattern_mask", "qti__author"."text_entry_patternmask_message", "qti__author"."text_entry_placeholder_text", "qti__author"."text_node", "qti__author"."tfoot", "qti__author"."th", "qti__author"."th_abbr", "qti__author"."th_align", "qti__author"."th_axis", "qti__author"."th_colspan", "qti__author"."th_rowspan", "qti__author"."th_scope", "qti__author"."th_valign", "qti__author"."thead", "qti__author"."tr", "qti__author"."track", "qti__author"."track_default", "qti__author"."track_srclang", "qti__author"."tree", "qti__author"."tree_doctype", "qti__author"."tree_export_charset", "qti__author"."tree_misc", "qti__author"."tree_root", "qti__author"."tree_xml_encoding", "qti__author"."tree_xml_standalone", "qti__author"."tree_xml_version", "qti__author"."tt", "qti__author"."typed_binding", "qti__author"."typed_declaration", "qti__author"."typed_value_set", "qti__author"."ul", "qti__author"."upload_interaction", "qti__author"."upload_type", "qti__author"."value_set", "qti__author"."value_set_interpretation", "qti__author"."var", "qti__author"."variable_ref", "qti__author"."video", "qti__author"."video_autoplay", "qti__author"."video_controls", "qti__author"."video_crossorigin", "qti__author"."video_height", "qti__author"."video_loop", "qti__author"."video_mediagroup", "qti__author"."video_muted", "qti__author"."video_poster", "qti__author"."video_preload", "qti__author"."video_src", "qti__author"."video_width", "qti__author"."ws" FROM PUBLIC;

REVOKE ALL ON TYPE "qti"."ancestry", "qti"."attribute_name", "qti"."base_type", "qti"."bound", "qti"."built_in", "qti"."declaration_kind", "qti"."declaration_shape", "qti"."entry_kind", "qti"."id_holder", "qti"."idref_attribute", "qti"."lom_owner", "qti"."misc_kind", "qti"."node_kind", "qti"."orientation", "qti"."placement", "qti"."printed_variable_attr", "qti"."ref_kind", "qti"."root_kind", "qti"."schema_version", "qti"."shape", "qti"."show_hide", "qti"."standard_template", "qti"."tool_shape", "qti"."tree_kind", "qti"."typed_cardinality", "qti"."value_role", "qti"."yes_no" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."__text_k3z6naurdo", "qti"."__text_ifp42a6zk6", "qti"."__text_jld3q663or", "qti"."__text_rhdrzkabze", "qti"."__text_cz7v66q3ce", "qti"."__text_ffwr4dbfx2", "qti"."__text_exm3fkarq3", "qti"."__text_qtkbmkpj6l", "qti"."__text_tmjud3n2tg", "qti"."__text_fictzx37my", "qti"."__text_oct7jwkpoj", "qti"."__text_6gan25pdor", "qti"."__text_t27tgfubfq", "qti"."__text_wu54ry3yoe", "qti"."__text_yakcqa4zli", "qti"."__text_saolosnhkp", "qti"."__text_x5wrjyn3pc", "qti"."__text_dwt2qnsttp", "qti"."__text_fgbxwprcwx", "qti"."__text_clza6vokfo", "qti"."__text_i67gmkzdk7", "qti"."__text_raisrajgpi", "qti"."__text_kqeswaav46", "qti"."__text_dqq6r4bdbe", "qti"."__text_72jqunyi7z", "qti"."__text_gubl3xpcnx", "qti"."__text_bvx3fqniye", "qti"."__text_a4spx6pjqw", "qti"."__text_gm4clqaaza", "qti"."__text_6uwfpnix5n", "qti"."__text_acxfo763jg", "qti"."__text_f63vbnbw4t", "qti"."__text_d72l462ftm", "qti"."__text_7grqskvjta", "qti"."__text_c34ec7mxid", "qti"."__text_tyjqwtj7ky", "qti"."__text_o3e7dedzyv", "qti"."__text_2dix7luqoi", "qti"."__text_xs56r6cx4y", "qti"."__text_tdupg63xcv", "qti"."__text_tso7kvy6dv", "qti"."__text_7mulu52tr6", "qti"."__text_pftpnuhm3d", "qti"."__text_ieskz75v7g", "qti"."__text_osqmo2ktsg", "qti"."__text_betq2bg2bg", "qti"."__text_qyq7zjychy", "qti"."__text_uc3mvgolsg", "qti"."__text_httzcaefcn", "qti"."__text_o3dskk7ctt", "qti"."__text_hawigbfw6m", "qti"."__text_5zvd6hcv2x", "qti"."__text_h4r6alp6hk", "qti"."__text_djykoynpls", "qti"."__text_awt4t5kosa", "qti"."__text_mvg26oprvk", "qti"."__text_f3hdif3553", "qti"."__text_ojm4wya66v", "qti"."__text_kcydnvglpj", "qti"."__text_5lyuoloiou", "qti"."__text_tq7gq2jmkl", "qti"."__text_oy6p76tbqw", "qti"."__text_wjqnoy6t2y", "qti"."__text_ocl2hjarfs", "qti"."__text_hmmood6ekl", "qti"."__text_dbdfklalek", "qti"."__text_wyfa622e2r", "qti"."__text_uia6zcss44", "qti"."__text_r5xluaej3z", "qti"."__text_oy4m3tqgfd", "qti"."__text_ottycep7en" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

ALTER TABLE "qti"."template_inline" DROP COLUMN "__tag_kind_qti_template_inline_rubric_o5ok5velix";

ALTER TABLE "qti"."template_block" DROP COLUMN "__tag_kind_qti_template_block_rubric_si2cxyuet3";

ALTER TABLE "qti"."feedback_block" DROP COLUMN "__tag_kind_qti_feedback_block_template_koyzwlsapg";

COMMENT ON FUNCTION "qti"."__law_node_kind_alternatives_vfnu4bvxbc"() IS 'function of law alternatives of Node.kind';

COMMENT ON CONSTRAINT "__declared_rubric_template_block_show_hide_pk_tqinnfq34p" ON "qti"."declared_rubric_template_block_show_hide" IS 'primary key of DeclaredRubricTemplateBlockShowHide';

COMMENT ON CONSTRAINT "__declared_rubric_template_inline_show_hide_pk_yqpebrml7t" ON "qti"."declared_rubric_template_inline_show_hide" IS 'primary key of DeclaredRubricTemplateInlineShowHide';

COMMENT ON CONSTRAINT "__declared_template_feedback_block_show_hide_pk_iyminu7tvz" ON "qti"."declared_template_feedback_block_show_hide" IS 'primary key of DeclaredTemplateFeedbackBlockShowHide';

COMMENT ON CONSTRAINT "__rubric_template_block_pk_2spkmf6x3o" ON "qti"."rubric_template_block" IS 'primary key of RubricTemplateBlock';

COMMENT ON CONSTRAINT "__rubric_template_inline_pk_t5tzr7x7yx" ON "qti"."rubric_template_inline" IS 'primary key of RubricTemplateInline';

COMMENT ON CONSTRAINT "__template_feedback_block_pk_4wuud44jqr" ON "qti"."template_feedback_block" IS 'primary key of TemplateFeedbackBlock';

COMMENT ON COLUMN "qti"."rubric_template_block"."__tag_kind_qti_template_block_rubric_si2cxyuet3" IS 'tag Node.kind = qti-template-block.rubric';

COMMENT ON COLUMN "qti"."rubric_template_inline"."__tag_kind_qti_template_inline_rubric_o5ok5velix" IS 'tag Node.kind = qti-template-inline.rubric';

COMMENT ON COLUMN "qti"."template_feedback_block"."__tag_kind_qti_feedback_block_template_koyzwlsapg" IS 'tag Node.kind = qti-feedback-block.template';

COMMENT ON CONSTRAINT "__declared_rubric_template_block_show_hide_fk_node_nhhdywdoss" ON "qti"."declared_rubric_template_block_show_hide" IS 'foreign key DeclaredRubricTemplateBlockShowHide(node) to RubricTemplateBlock(id)';

COMMENT ON CONSTRAINT "__declared_rubric_template_inline_show_hide_fk_node_sbphi5cue2" ON "qti"."declared_rubric_template_inline_show_hide" IS 'foreign key DeclaredRubricTemplateInlineShowHide(node) to RubricTemplateInline(id)';

COMMENT ON CONSTRAINT "__declared_template_feedback_block_show_hide_fk_node_pb6ahfblff" ON "qti"."declared_template_feedback_block_show_hide" IS 'foreign key DeclaredTemplateFeedbackBlockShowHide(node) to TemplateFeedbackBlock(id)';

COMMENT ON CONSTRAINT "__rubric_template_block_fk_id_tag_kind_qti_template_7ndolb2xld" ON "qti"."rubric_template_block" IS 'foreign key RubricTemplateBlock(id, __tag_kind_qti_template_block_rubric_si2cxyuet3) to Node(id, kind)';

COMMENT ON CONSTRAINT "__rubric_template_inline_fk_id_tag_kind_qti_template_xc64dw3wwd" ON "qti"."rubric_template_inline" IS 'foreign key RubricTemplateInline(id, __tag_kind_qti_template_inline_rubric_o5ok5velix) to Node(id, kind)';

COMMENT ON CONSTRAINT "__template_feedback_block_fk_id_tag_kind_qti_i3ukwhqmkc" ON "qti"."template_feedback_block" IS 'foreign key TemplateFeedbackBlock(id, __tag_kind_qti_feedback_block_template_koyzwlsapg) to Node(id, kind)';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mfwqgo35yz" ON "qti"."a" IS 'trigger of law alternatives of Node.kind on A';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dahk64cgbp" ON "qti"."abbr" IS 'trigger of law alternatives of Node.kind on Abbr';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dprrafs63x" ON "qti"."acronym" IS 'trigger of law alternatives of Node.kind on Acronym';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3lfkt76rny" ON "qti"."address" IS 'trigger of law alternatives of Node.kind on Address';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6l5v3qqz4y" ON "qti"."area_map_entry" IS 'trigger of law alternatives of Node.kind on AreaMapEntry';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qvjnsqsg4j" ON "qti"."area_mapping" IS 'trigger of law alternatives of Node.kind on AreaMapping';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5juqufekjw" ON "qti"."article" IS 'trigger of law alternatives of Node.kind on Article';

COMMENT ON TRIGGER "__law_node_kind_alternatives_52573xguvc" ON "qti"."aside" IS 'trigger of law alternatives of Node.kind on Aside';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5skm7kkgib" ON "qti"."assessment_item" IS 'trigger of law alternatives of Node.kind on AssessmentItem';

COMMENT ON TRIGGER "__law_node_kind_alternatives_lvn44nghhn" ON "qti"."associable_hotspot" IS 'trigger of law alternatives of Node.kind on AssociableHotspot';

COMMENT ON TRIGGER "__law_node_kind_alternatives_i22v62krc3" ON "qti"."associate_interaction" IS 'trigger of law alternatives of Node.kind on AssociateInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_5ubhtl7le3" ON "qti"."audio" IS 'trigger of law alternatives of Node.kind on Audio';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ezt4s2ylke" ON "qti"."b" IS 'trigger of law alternatives of Node.kind on B';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4wthtlnrlp" ON "qti"."bdi" IS 'trigger of law alternatives of Node.kind on Bdi';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2da4lzt67v" ON "qti"."bdo" IS 'trigger of law alternatives of Node.kind on Bdo';

COMMENT ON TRIGGER "__law_node_kind_alternatives_khujt5gf2m" ON "qti"."big" IS 'trigger of law alternatives of Node.kind on Big';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kfdr2hoq46" ON "qti"."blockquote" IS 'trigger of law alternatives of Node.kind on Blockquote';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rglnpd7is3" ON "qti"."br" IS 'trigger of law alternatives of Node.kind on Br';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kijunmq6bd" ON "qti"."caption" IS 'trigger of law alternatives of Node.kind on Caption';

COMMENT ON TRIGGER "__law_node_kind_alternatives_px3kxcm3l6" ON "qti"."catalog_info" IS 'trigger of law alternatives of Node.kind on CatalogInfo';

COMMENT ON TRIGGER "__law_node_kind_alternatives_upkyeydjz7" ON "qti"."choice_interaction" IS 'trigger of law alternatives of Node.kind on ChoiceInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4ux26xterz" ON "qti"."cite" IS 'trigger of law alternatives of Node.kind on Cite';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xnp3p4xjdl" ON "qti"."code" IS 'trigger of law alternatives of Node.kind on Code';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fnyn2w2j2t" ON "qti"."col" IS 'trigger of law alternatives of Node.kind on Col';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rkgy7zinkp" ON "qti"."colgroup" IS 'trigger of law alternatives of Node.kind on Colgroup';

COMMENT ON TRIGGER "__law_node_kind_alternatives_py43thbsit" ON "qti"."comment" IS 'trigger of law alternatives of Node.kind on Comment';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4ny2zrur4o" ON "qti"."companion_materials_info" IS 'trigger of law alternatives of Node.kind on CompanionMaterialsInfo';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pydlyecs5i" ON "qti"."content_body_feedback" IS 'trigger of law alternatives of Node.kind on ContentBodyFeedback';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2jicalupps" ON "qti"."content_body_modal" IS 'trigger of law alternatives of Node.kind on ContentBodyModal';

COMMENT ON TRIGGER "__law_node_kind_alternatives_jwb5mem5vj" ON "qti"."content_body_rubric" IS 'trigger of law alternatives of Node.kind on ContentBodyRubric';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3mugsa2fpf" ON "qti"."content_body_rubric_template" IS 'trigger of law alternatives of Node.kind on ContentBodyRubricTemplate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mpnoftuxsl" ON "qti"."content_body_template" IS 'trigger of law alternatives of Node.kind on ContentBodyTemplate';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pdzhqrw7r4" ON "qti"."context_declaration_arm" IS 'trigger of law alternatives of Node.kind on ContextDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ikfqexnafy" ON "qti"."correct_response_arm" IS 'trigger of law alternatives of Node.kind on CorrectResponseArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j6fbzowkq3" ON "qti"."dd" IS 'trigger of law alternatives of Node.kind on Dd';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j5vhdpgz25" ON "qti"."declared_value" IS 'trigger of law alternatives of Node.kind on DeclaredValue';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ssrxqpoval" ON "qti"."default_value_arm" IS 'trigger of law alternatives of Node.kind on DefaultValueArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6td2gbd75c" ON "qti"."dependency" IS 'trigger of law alternatives of Node.kind on Dependency';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zuglb7o7ch" ON "qti"."details" IS 'trigger of law alternatives of Node.kind on Details';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fepjngdx54" ON "qti"."dfn" IS 'trigger of law alternatives of Node.kind on Dfn';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4omdb7jor6" ON "qti"."div" IS 'trigger of law alternatives of Node.kind on Div';

COMMENT ON TRIGGER "__law_node_kind_alternatives_7lfkzblwim" ON "qti"."dl" IS 'trigger of law alternatives of Node.kind on Dl';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4lmku7m6xx" ON "qti"."drawing_interaction" IS 'trigger of law alternatives of Node.kind on DrawingInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sowl3vz4tj" ON "qti"."dt" IS 'trigger of law alternatives of Node.kind on Dt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_q2voepnagh" ON "qti"."em" IS 'trigger of law alternatives of Node.kind on Em';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xabjz6rxc5" ON "qti"."end_attempt_interaction" IS 'trigger of law alternatives of Node.kind on EndAttemptInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xuefsrgzju" ON "qti"."entity_reference" IS 'trigger of law alternatives of Node.kind on EntityReference';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ulfic3gp4z" ON "qti"."extended_text_interaction" IS 'trigger of law alternatives of Node.kind on ExtendedTextInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2phauuabe5" ON "qti"."feedback_block" IS 'trigger of law alternatives of Node.kind on FeedbackBlock';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vq6etghihd" ON "qti"."feedback_inline" IS 'trigger of law alternatives of Node.kind on FeedbackInline';

COMMENT ON TRIGGER "__law_node_kind_alternatives_t5higodlva" ON "qti"."figcaption" IS 'trigger of law alternatives of Node.kind on Figcaption';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rzd4qlvhw2" ON "qti"."figure" IS 'trigger of law alternatives of Node.kind on Figure';

COMMENT ON TRIGGER "__law_node_kind_alternatives_oxdcy2a5y4" ON "qti"."file" IS 'trigger of law alternatives of Node.kind on File';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nsgsfxbvlt" ON "qti"."footer" IS 'trigger of law alternatives of Node.kind on Footer';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dfdq24x5fc" ON "qti"."gap" IS 'trigger of law alternatives of Node.kind on Gap';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cc5c2evdsu" ON "qti"."gap_img" IS 'trigger of law alternatives of Node.kind on GapImg';

COMMENT ON TRIGGER "__law_node_kind_alternatives_yzmht6ru6z" ON "qti"."gap_match_interaction" IS 'trigger of law alternatives of Node.kind on GapMatchInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_pbcuyg2zuy" ON "qti"."gap_text" IS 'trigger of law alternatives of Node.kind on GapText';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zlq52wirh5" ON "qti"."graphic_associate_interaction" IS 'trigger of law alternatives of Node.kind on GraphicAssociateInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_klschzb2jk" ON "qti"."graphic_gap_match_interaction" IS 'trigger of law alternatives of Node.kind on GraphicGapMatchInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cbugp3f3mo" ON "qti"."graphic_order_interaction" IS 'trigger of law alternatives of Node.kind on GraphicOrderInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3vuqbxd6xk" ON "qti"."h_1" IS 'trigger of law alternatives of Node.kind on H1';

COMMENT ON TRIGGER "__law_node_kind_alternatives_szzg33s43w" ON "qti"."h_2" IS 'trigger of law alternatives of Node.kind on H2';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ltotm7ninx" ON "qti"."h_3" IS 'trigger of law alternatives of Node.kind on H3';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bcar6rxe6x" ON "qti"."h_4" IS 'trigger of law alternatives of Node.kind on H4';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rqupo474ml" ON "qti"."h_5" IS 'trigger of law alternatives of Node.kind on H5';

COMMENT ON TRIGGER "__law_node_kind_alternatives_phdccombfz" ON "qti"."h_6" IS 'trigger of law alternatives of Node.kind on H6';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vrg423e22k" ON "qti"."header" IS 'trigger of law alternatives of Node.kind on Header';

COMMENT ON TRIGGER "__law_node_kind_alternatives_w2hx4mom5v" ON "qti"."hotspot_choice" IS 'trigger of law alternatives of Node.kind on HotspotChoice';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3n26scgsf7" ON "qti"."hotspot_interaction" IS 'trigger of law alternatives of Node.kind on HotspotInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rbwmtcglsb" ON "qti"."hottext" IS 'trigger of law alternatives of Node.kind on Hottext';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dwljj6cdvq" ON "qti"."hottext_interaction" IS 'trigger of law alternatives of Node.kind on HottextInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_o7bslxyosb" ON "qti"."hr" IS 'trigger of law alternatives of Node.kind on Hr';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ohxyeu4g22" ON "qti"."i" IS 'trigger of law alternatives of Node.kind on I';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qi3e3sk75r" ON "qti"."img" IS 'trigger of law alternatives of Node.kind on Img';

COMMENT ON TRIGGER "__law_node_kind_alternatives_c6pd2uuy3b" ON "qti"."inline_choice" IS 'trigger of law alternatives of Node.kind on InlineChoice';

COMMENT ON TRIGGER "__law_node_kind_alternatives_s7vwudxxt7" ON "qti"."inline_choice_interaction" IS 'trigger of law alternatives of Node.kind on InlineChoiceInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_2j2w7npw2e" ON "qti"."interpolation_table" IS 'trigger of law alternatives of Node.kind on InterpolationTable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_omzxbfatrt" ON "qti"."interpolation_table_entry" IS 'trigger of law alternatives of Node.kind on InterpolationTableEntry';

COMMENT ON TRIGGER "__law_node_kind_alternatives_smgee6gejq" ON "qti"."item_body" IS 'trigger of law alternatives of Node.kind on ItemBody';

COMMENT ON TRIGGER "__law_node_kind_alternatives_y6tu4in5na" ON "qti"."kbd" IS 'trigger of law alternatives of Node.kind on Kbd';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3gro5bg32e" ON "qti"."label" IS 'trigger of law alternatives of Node.kind on Label';

COMMENT ON TRIGGER "__law_node_kind_alternatives_efhbn2hlam" ON "qti"."li" IS 'trigger of law alternatives of Node.kind on Li';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_ipuymtixeh" ON "qti"."manifest_metadata" IS 'trigger of law alternatives of Node.kind on ManifestMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_k3727kgr4f" ON "qti"."manifest_schema" IS 'trigger of law alternatives of Node.kind on ManifestSchema';

COMMENT ON TRIGGER "__law_node_kind_alternatives_edwin77ceo" ON "qti"."manifest_schema_version" IS 'trigger of law alternatives of Node.kind on ManifestSchemaVersion';

COMMENT ON TRIGGER "__law_node_kind_alternatives_h76gi2fmnb" ON "qti"."map_entry" IS 'trigger of law alternatives of Node.kind on MapEntry';

COMMENT ON TRIGGER "__law_node_kind_alternatives_focrc4jdi3" ON "qti"."mapping" IS 'trigger of law alternatives of Node.kind on Mapping';

COMMENT ON TRIGGER "__law_node_kind_alternatives_w36cq6o2wh" ON "qti"."match_interaction" IS 'trigger of law alternatives of Node.kind on MatchInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3xcwi5nyu4" ON "qti"."match_table" IS 'trigger of law alternatives of Node.kind on MatchTable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_uruwbaxaum" ON "qti"."match_table_entry" IS 'trigger of law alternatives of Node.kind on MatchTableEntry';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nji7hlir6n" ON "qti"."media_interaction" IS 'trigger of law alternatives of Node.kind on MediaInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fz3efypcif" ON "qti"."modal_feedback" IS 'trigger of law alternatives of Node.kind on ModalFeedback';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xpyeb4sumz" ON "qti"."nav" IS 'trigger of law alternatives of Node.kind on Nav';

COMMENT ON TRIGGER "__law_node_kind_alternatives_sv4lck5ue6" ON "qti"."node" IS 'trigger of law alternatives of Node.kind on Node';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bj7ysj6eag" ON "qti"."object" IS 'trigger of law alternatives of Node.kind on Object';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ytytg2qxs2" ON "qti"."ol" IS 'trigger of law alternatives of Node.kind on Ol';

COMMENT ON TRIGGER "__law_node_kind_alternatives_khgetusg5p" ON "qti"."order_interaction" IS 'trigger of law alternatives of Node.kind on OrderInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_bv75ttdv6d" ON "qti"."organizations" IS 'trigger of law alternatives of Node.kind on Organizations';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qhu3dxqvfw" ON "qti"."outcome_declaration_arm" IS 'trigger of law alternatives of Node.kind on OutcomeDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3psrbuzkn3" ON "qti"."p" IS 'trigger of law alternatives of Node.kind on P';

COMMENT ON TRIGGER "__law_node_kind_alternatives_nmhjri6454" ON "qti"."package" IS 'trigger of law alternatives of Node.kind on Package';

COMMENT ON TRIGGER "__law_node_kind_alternatives_stchkpaprr" ON "qti"."param" IS 'trigger of law alternatives of Node.kind on Param';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rsadoosbdw" ON "qti"."pi" IS 'trigger of law alternatives of Node.kind on Pi';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4xo2s4egkm" ON "qti"."picture" IS 'trigger of law alternatives of Node.kind on Picture';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ia7ep5qjgv" ON "qti"."position_object_interaction" IS 'trigger of law alternatives of Node.kind on PositionObjectInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vz7grulogp" ON "qti"."position_object_stage" IS 'trigger of law alternatives of Node.kind on PositionObjectStage';

COMMENT ON TRIGGER "__law_node_kind_alternatives_lxvtawunk5" ON "qti"."pre" IS 'trigger of law alternatives of Node.kind on Pre';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xq7okdcvwu" ON "qti"."printed_variable" IS 'trigger of law alternatives of Node.kind on PrintedVariable';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mhdzlnjncv" ON "qti"."prompt" IS 'trigger of law alternatives of Node.kind on Prompt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_hwdhogd5be" ON "qti"."q" IS 'trigger of law alternatives of Node.kind on Q';

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

COMMENT ON TRIGGER "__law_node_kind_alternatives_5c44li6glx" ON "qti"."qti_label" IS 'trigger of law alternatives of Node.kind on QtiLabel';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cp525k7f3z" ON "qti"."qti_metadata" IS 'trigger of law alternatives of Node.kind on QtiMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qubgbrwopq" ON "qti"."rb" IS 'trigger of law alternatives of Node.kind on Rb';

COMMENT ON TRIGGER "__law_node_kind_alternatives_j53oleenel" ON "qti"."resource" IS 'trigger of law alternatives of Node.kind on Resource';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rzmuape27g" ON "qti"."resource_metadata" IS 'trigger of law alternatives of Node.kind on ResourceMetadata';

COMMENT ON TRIGGER "__law_node_kind_alternatives_rqsqvzbn2g" ON "qti"."resources" IS 'trigger of law alternatives of Node.kind on Resources';

COMMENT ON TRIGGER "__law_node_kind_alternatives_p5egrc7ys2" ON "qti"."response_declaration_arm" IS 'trigger of law alternatives of Node.kind on ResponseDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ob7fyfvlkb" ON "qti"."response_processing" IS 'trigger of law alternatives of Node.kind on ResponseProcessing';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ctmf57tcos" ON "qti"."rp" IS 'trigger of law alternatives of Node.kind on Rp';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cyh2lgf4he" ON "qti"."rt" IS 'trigger of law alternatives of Node.kind on Rt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xuetsrhman" ON "qti"."rtc" IS 'trigger of law alternatives of Node.kind on Rtc';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tpswhfxsvm" ON "qti"."rubric_block" IS 'trigger of law alternatives of Node.kind on RubricBlock';

COMMENT ON TRIGGER "__law_node_kind_alternatives_24s3qx6w3t" ON "qti"."rubric_template_block" IS 'trigger of law alternatives of Node.kind on RubricTemplateBlock';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mrnbaoahlz" ON "qti"."rubric_template_inline" IS 'trigger of law alternatives of Node.kind on RubricTemplateInline';

COMMENT ON TRIGGER "__law_node_kind_alternatives_iarfqmgqlu" ON "qti"."ruby" IS 'trigger of law alternatives of Node.kind on Ruby';

COMMENT ON TRIGGER "__law_node_kind_alternatives_fir65btwtq" ON "qti"."samp" IS 'trigger of law alternatives of Node.kind on Samp';

COMMENT ON TRIGGER "__law_node_kind_alternatives_6powpnbiur" ON "qti"."section" IS 'trigger of law alternatives of Node.kind on Section';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mz4je7iozm" ON "qti"."select_point_interaction" IS 'trigger of law alternatives of Node.kind on SelectPointInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_eepfjdx3zz" ON "qti"."simple_associable_choice" IS 'trigger of law alternatives of Node.kind on SimpleAssociableChoice';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mp3irnnixf" ON "qti"."simple_choice" IS 'trigger of law alternatives of Node.kind on SimpleChoice';

COMMENT ON TRIGGER "__law_node_kind_alternatives_om4zxddect" ON "qti"."simple_match_set" IS 'trigger of law alternatives of Node.kind on SimpleMatchSet';

COMMENT ON TRIGGER "__law_node_kind_alternatives_b2t22mzfvr" ON "qti"."slider_interaction" IS 'trigger of law alternatives of Node.kind on SliderInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4aec6vjmxd" ON "qti"."small" IS 'trigger of law alternatives of Node.kind on Small';

COMMENT ON TRIGGER "__law_node_kind_alternatives_iu6r4ifacj" ON "qti"."source" IS 'trigger of law alternatives of Node.kind on Source';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4od25taqot" ON "qti"."span" IS 'trigger of law alternatives of Node.kind on Span';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wimc6zqmwl" ON "qti"."strong" IS 'trigger of law alternatives of Node.kind on Strong';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ksnbtmvnxd" ON "qti"."stylesheet" IS 'trigger of law alternatives of Node.kind on Stylesheet';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4w7uy6xk35" ON "qti"."sub" IS 'trigger of law alternatives of Node.kind on Sub';

COMMENT ON TRIGGER "__law_node_kind_alternatives_d6fmhzyia6" ON "qti"."summary" IS 'trigger of law alternatives of Node.kind on Summary';

COMMENT ON TRIGGER "__law_node_kind_alternatives_4tu72455jw" ON "qti"."sup" IS 'trigger of law alternatives of Node.kind on Sup';

COMMENT ON TRIGGER "__law_node_kind_alternatives_p7kxt4fkgy" ON "qti"."table" IS 'trigger of law alternatives of Node.kind on Table';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cvujlkvwsq" ON "qti"."tbody" IS 'trigger of law alternatives of Node.kind on Tbody';

COMMENT ON TRIGGER "__law_node_kind_alternatives_kzjdteohzl" ON "qti"."td" IS 'trigger of law alternatives of Node.kind on Td';

COMMENT ON TRIGGER "__law_node_kind_alternatives_3f37blh3qz" ON "qti"."template" IS 'trigger of law alternatives of Node.kind on Template';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qdaxorp7md" ON "qti"."template_block" IS 'trigger of law alternatives of Node.kind on TemplateBlock';

COMMENT ON TRIGGER "__law_node_kind_alternatives_ued7jrvvgw" ON "qti"."template_declaration_arm" IS 'trigger of law alternatives of Node.kind on TemplateDeclarationArm';

COMMENT ON TRIGGER "__law_node_kind_alternatives_erdqga7gw3" ON "qti"."template_feedback_block" IS 'trigger of law alternatives of Node.kind on TemplateFeedbackBlock';

COMMENT ON TRIGGER "__law_node_kind_alternatives_mjp4qcj3b4" ON "qti"."template_inline" IS 'trigger of law alternatives of Node.kind on TemplateInline';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zrbdul7e2l" ON "qti"."text_entry_interaction" IS 'trigger of law alternatives of Node.kind on TextEntryInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_dhvs325itr" ON "qti"."text_node" IS 'trigger of law alternatives of Node.kind on TextNode';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xy52dgvobx" ON "qti"."tfoot" IS 'trigger of law alternatives of Node.kind on Tfoot';

COMMENT ON TRIGGER "__law_node_kind_alternatives_cdgzn2ermk" ON "qti"."th" IS 'trigger of law alternatives of Node.kind on Th';

COMMENT ON TRIGGER "__law_node_kind_alternatives_wk7jfkcgzu" ON "qti"."thead" IS 'trigger of law alternatives of Node.kind on Thead';

COMMENT ON TRIGGER "__law_node_kind_alternatives_es2f4ayf6g" ON "qti"."tr" IS 'trigger of law alternatives of Node.kind on Tr';

COMMENT ON TRIGGER "__law_node_kind_alternatives_zi7dju55a4" ON "qti"."track" IS 'trigger of law alternatives of Node.kind on Track';

COMMENT ON TRIGGER "__law_node_kind_alternatives_xrtah5ra3u" ON "qti"."tt" IS 'trigger of law alternatives of Node.kind on Tt';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qwaqqqyatb" ON "qti"."ul" IS 'trigger of law alternatives of Node.kind on Ul';

COMMENT ON TRIGGER "__law_node_kind_alternatives_naaf3vzo3a" ON "qti"."upload_interaction" IS 'trigger of law alternatives of Node.kind on UploadInteraction';

COMMENT ON TRIGGER "__law_node_kind_alternatives_vtz5u7zi4j" ON "qti"."var" IS 'trigger of law alternatives of Node.kind on Var';

COMMENT ON TRIGGER "__law_node_kind_alternatives_tapwxdfcng" ON "qti"."video" IS 'trigger of law alternatives of Node.kind on Video';

COMMENT ON TRIGGER "__law_node_kind_alternatives_qra75t5mkw" ON "qti"."ws" IS 'trigger of law alternatives of Node.kind on Ws';
