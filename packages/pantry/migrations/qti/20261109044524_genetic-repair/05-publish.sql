ALTER TABLE "qti"."test_document" DROP CONSTRAINT "__test_document_fk_node_pred_sites_7abk5yodfe";

ALTER TABLE "qti"."site_target" DROP CONSTRAINT "__site_target_fk_document_predecessor_sites_wqrlg4xl4x";

ALTER TABLE "qti"."site_target" DROP CONSTRAINT "__site_target_fk_document_copy_sites_gsuw7ch3uc";

ALTER TABLE "qti"."instance" DROP CONSTRAINT "__instance_fk_site_document_io5u5bpp6h";

ALTER TABLE "qti"."inclusion" DROP CONSTRAINT "__inclusion_fk_node_parent_kind_root_splices_version_4kznlatgit";

ALTER TABLE "qti"."idref_target" DROP CONSTRAINT "__idref_target_fk_document_id_zv4jnaerat";

ALTER TABLE "qti"."document_id" DROP CONSTRAINT "__document_id_fk_document_id_owner_copy_carriers_qnibdt5hi4";

ALTER TABLE "qti"."attribute" DROP CONSTRAINT "__attribute_fk_node_4ctvltlsph";

ALTER TABLE "qti"."site_target" DROP CONSTRAINT "__site_target_check_site_target_counted_test_7flxxq2yrf";

ALTER TABLE "qti"."test_document" DROP CONSTRAINT "__test_document_key_node_sites_kb2re7yywi";

ALTER TABLE "qti"."site_target" DROP CONSTRAINT "__site_target_key_node_target_7ydrccmq3v";

ALTER TABLE "qti"."site_target" DROP CONSTRAINT "__site_target_key_node_parent_kind_target_root_kjlmvs6thn";

ALTER TABLE "qti"."site_target" DROP CONSTRAINT "__site_target_key_document_index_sites_4ddy6mbxg6";

ALTER TABLE "qti"."id_binding" DROP CONSTRAINT "__id_binding_key_document_id_owner_carriers_p4dswlbb47";

ALTER TABLE "qti"."id_binding" DROP CONSTRAINT "__id_binding_key_document_id_eia52xosro";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."__flag_bits_12_i4uhexylc4", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."__domain_gfw43vigph", "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."attribute_slot", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."position", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."value_cardinality", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_xj3zno7u3h", "qti"."__text_7nkeqry66t", "qti"."__text_c6iptmtj2x", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_gke7uypkov", "qti"."__text_htajwmyatt", "qti"."__text_mqbstvk5ay", "qti"."__text_d7mwmflg4k", "qti"."__text_l7nqeazg5h", "qti"."__text_k5kwygzatl", "qti"."__text_7dfilirtp3", "qti"."__text_xisvziygi3", "qti"."__text_7j6kgluyjp", "qti"."__text_xey6ryorh5", "qti"."__text_n4nva7wrgk", "qti"."__text_pwaizaq6lx", "qti"."__text_psn65t7m7e", "qti"."__text_hdc6mvcrgm", "qti"."__text_23rzixl3a2", "qti"."__text_mpc5fvfrbl", "qti"."__text_qvake6vbfh", "qti"."__text_zij47sgley", "qti"."__text_piekqyt5fn", "qti"."__text_fgve4r33vj", "qti"."__text_5xaumrdzw7", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__text_6kufndem2v", "qti"."__text_3adwbksayk" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_identifier", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."gap_interaction", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."instance_name", "qti__author"."interaction", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource_file", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site", "qti__author"."site_path", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_element" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_range" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assembled_catalog" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assembled_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assembled_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assembled_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assembled_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."assessment_object" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."binding_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."binding_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."binding_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."binding_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."body_xml_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."bound_variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_resolution" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."card_support" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."catalog_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."catalog_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."catalog_scope" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."catalog_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cell_headers" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cell_leaf" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_variable_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cn_attribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cn_count" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cn_part_text" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cn_slot" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."comment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."context_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."context_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."count_bound" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."count_range" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."declaration_table" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."default_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dependency" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."dependency_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."doctype" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_generals" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."document_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."double_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."encoding_decl" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."expression_attribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_ref_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."feedback_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."field_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."file_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."fragment_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."gap_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."general_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."general_named" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."general_object" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."header_token" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."held_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hotspot" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."hottext" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."id_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."identity_text" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."idref_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."inclusion" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."instance" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."instance_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."interaction_attribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."label_use" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."least_count" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."literal_typed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_entry" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_general" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_object" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_record" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource_type_source" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_string_language" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lom_title_string" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lookup_table" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lookup_table_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lookup_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."lookup_value_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_space" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_key" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_key_directed_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_key_float" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_key_integer" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_key_pair" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_key_point" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."map_key_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_item_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_item_ref_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_lookup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_source_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mastery_ceiling" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mastery_floor" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mastery_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_action" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_align_group" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_align_scope" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_apply" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_argument" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_cell" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_cn" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_dir" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_qualifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."math_rank" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."most_count" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."name_lookup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."named" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."named_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."namespace" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."node" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."normal_maximum" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."normal_minimum" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."object_title" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."open_attribute_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."open_element_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."operand" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."package" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pci_module_form" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pi" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_body_xml_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_catalog_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_general_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_hottext" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_math_rank" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_share_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_variable_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_xml_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."processing" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."processing_template" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."quotation" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."reading" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."reading_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_field" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."record_field_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."reference_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."reference_path" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."reference_segment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."referring_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_file" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_general" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_language_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."resource_typed" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rounding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rounding_figures" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rounding_mode" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."rounding_mode_figures" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."sd_decl" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_context_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_context_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_context_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_ref_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_identifier" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_member" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_ordering" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_scope" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_selection" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_template_name" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_template_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_template_ref_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_template_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."share_fragment" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."share_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."site" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."site_path" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."site_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."slider" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ssml_attribute" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."ssml_scope" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."statistic_date" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."stimulus_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."table_header" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."table_scope" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_default" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_default_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_default_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_ref_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_flag" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_token" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_double_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_reference_path" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tolerance" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tolerance_token" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_value_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."value_set_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_lookup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xml_decl" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."xml_lang" FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"("pg_catalog"."text", "pg_catalog"."text", "pg_catalog"."text") FROM "qti__author";

REVOKE EXECUTE ON FUNCTION "qti"."__constant_uij2fonltq"(), "qti"."__constant_bkqh2friwv"(), "qti"."__constant_eo4djco6b4"(), "qti"."__constant_sx2lr4try3"(), "qti"."__constant_u7eltifwnk"(), "qti"."__constant_7v2rmkfszl"(), "qti"."__constant_waek7atehx"(), "qti"."__constant_nhyhb5mvr7"(), "qti"."__constant_ibiapjhixk"(), "qti"."__constant_cc6vlqxc5e"(), "qti"."__constant_milnmhezry"(), "qti"."__constant_caimmsgsgb"(), "qti"."__constant_2ydzf24l25"(), "qti"."__constant_m6cittd2yd"(), "qti"."__constant_cowgjzeorq"(), "qti"."__constant_hmibfx5gyk"(), "qti"."__constant_wm5pnshcyf"(), "qti"."__constant_ncvuf24xxr"(), "qti"."__constant_ykvwltiwpp"(), "qti"."__constant_f33slecxe4"(), "qti"."__constant_wzcsm5lgek"(), "qti"."__constant_npu4wt2fbp"(), "qti"."__constant_yegly32ojt"(), "qti"."__constant_gnajygigus"(), "qti"."__constant_3t4qepe5jn"(), "qti"."__constant_5kz6ofzblb"(), "qti"."__constant_ct2vnrdq7e"(), "qti"."__constant_xjuxnqukjv"(), "qti"."__constant_5ykzxdvynm"(), "qti"."__constant_eqtu3e3bf7"(), "qti"."__constant_4okg7vcxht"(), "qti"."__constant_bnroidxvkl"(), "qti"."__constant_cvrzwozguy"(), "qti"."__constant_42zaiy3pw4"(), "qti"."__constant_whaydjeagy"(), "qti"."__constant_nzkmx3la3e"(), "qti"."__constant_lt7r7r6eus"(), "qti"."__constant_qkqwephi2j"(), "qti"."__constant_sqmzlmgx7q"(), "qti"."__constant_7ayqtsnyfr"(), "qti"."__constant_oazju5gsln"(), "qti"."__constant_kpxfwusb6s"(), "qti"."__constant_sj4gtqwjvu"(), "qti"."__constant_inwmcukoes"(), "qti"."__constant_qlb2jx4hhv"(), "qti"."__constant_m7gdtnppww"(), "qti"."__constant_qclwnol5oy"(), "qti"."__constant_exnqxdg5si"(), "qti"."__constant_wrlwssqvsp"(), "qti"."__constant_dhxmsn4rkd"(), "qti"."__constant_5vczbwx7y7"(), "qti"."__constant_p5oxaznp4j"(), "qti"."__constant_fgsupcpxgj"(), "qti"."__constant_samvsv5x3m"(), "qti"."__constant_ibvgt6pxwh"(), "qti"."__constant_6pgyw625sv"(), "qti"."__constant_qvvxi5pvxk"(), "qti"."__constant_2orzvrv6ut"(), "qti"."__constant_h5f56cbmgk"(), "qti"."__constant_wvtqnkiky3"(), "qti"."__constant_47ksumromp"(), "qti"."__constant_kos3rnuvei"(), "qti"."__constant_5pcz6dyjzi"(), "qti"."__constant_cy4erml7fi"(), "qti"."__constant_3lx4yzmo77"(), "qti"."__constant_6f44bj6f5z"(), "qti"."__constant_ter3l763yp"(), "qti"."__constant_ftz6h5paqe"(), "qti"."__constant_przq27rlwm"(), "qti"."__constant_qrfq2g4hkz"(), "qti"."__constant_ogqwerfjhc"(), "qti"."__constant_2spvsmpumv"(), "qti"."__constant_5r3at22xvz"(), "qti"."__constant_zqmhcyzcur"(), "qti"."__constant_aprps52eby"(), "qti"."__constant_ahddjwrhv5"(), "qti"."__constant_k3fjlwxuwn"(), "qti"."__constant_iz4l44v4pt"(), "qti"."__constant_ctf72alvlj"(), "qti"."__constant_xvmgsamjvy"(), "qti"."__constant_bxvzcve5q4"(), "qti"."__constant_jl3vjp3onh"(), "qti"."__constant_5qe5tzd65n"(), "qti"."__constant_p4pvfhuaqm"(), "qti"."__constant_lliww2nzpo"(), "qti"."__constant_adakh3kbth"(), "qti"."__constant_dqbnkda3gg"(), "qti"."__constant_gf6he576t3"(), "qti"."__constant_iksi4cbdex"(), "qti"."__constant_jgtq6vvihi"(), "qti"."__constant_fsmfviu65m"(), "qti"."__constant_kb2tdexlqu"(), "qti"."__constant_wvuca46fcu"(), "qti"."__constant_nfgjamc5xd"(), "qti"."__constant_dj7xbg6izu"(), "qti"."__constant_ho6c7gpjo3"(), "qti"."__constant_ma2si6ukdt"(), "qti"."__constant_ejkw66w2je"(), "qti"."__constant_sl65lnozn2"(), "qti"."__constant_66i4fjuv6n"(), "qti"."__constant_vjkzvvaevx"(), "qti"."__constant_otpfpakmgn"(), "qti"."__constant_sszsm5lf66"(), "qti"."__constant_p2xwmlesaa"(), "qti"."__constant_uwvfzil5rh"(), "qti"."__constant_eizgu7rgqp"(), "qti"."__constant_fccrluys3c"(), "qti"."__constant_w4tawmrghr"(), "qti"."__constant_hh7nvhrixk"(), "qti"."__constant_j6uos7o7iw"(), "qti"."__constant_gazfxeallk"(), "qti"."__constant_7puc5uc6kh"(), "qti"."__constant_wekhard5xm"(), "qti"."__constant_ajahbtka65"(), "qti"."__constant_6iey4mkmde"(), "qti"."__constant_3fecx3moff"(), "qti"."__constant_zkhfdh2gmj"(), "qti"."__constant_wozychch32"(), "qti"."__constant_is5pk7lyfr"(), "qti"."__constant_gbvdw5papk"(), "qti"."__constant_6l2ttocydo"(), "qti"."__constant_levw2mwpwa"(), "qti"."__constant_lnl5n26s3i"(), "qti"."__constant_mzggfsj72d"(), "qti"."__constant_4v2z57igsj"(), "qti"."__constant_sn5ucr2eat"(), "qti"."__constant_3bgu23uy42"(), "qti"."__constant_uynctp5wdx"(), "qti"."__constant_sjctib2m6a"(), "qti"."__constant_uav4xy4p5a"(), "qti"."__constant_folbw276p3"(), "qti"."__constant_dc7u4pz4ga"(), "qti"."__constant_nccth24rmg"(), "qti"."__constant_wn244xqmvq"(), "qti"."__constant_rwijlqnagg"(), "qti"."__constant_n4gntw4ty5"(), "qti"."__constant_aiwrmlshlf"(), "qti"."__constant_g3bd4eyobi"(), "qti"."__constant_zkaa5w3gb2"(), "qti"."__align_direction_names_vluq7iazdg"(), "qti"."__align_state_names_ffk37slxn3"(), "qti"."__attribute_model_names_d7ufmii6j2"(), "qti"."__attribute_name_names_q6tmzcty4e"(), "qti"."__attribute_slot_names_4r5l4mp24z"(), "qti"."__base_type_names_ok3nu5nck4"(), "qti"."__bound_facet_names_b7dbsbn4iu"(), "qti"."__bound_zero_names_2iyjgurtgw"(), "qti"."__built_in_names_qkzs4cgupe"(), "qti"."__cardinality_names_kqiairsoqa"(), "qti"."__cn_base_names_2wtzhyubck"(), "qti"."__cn_part_names_6db2fcgfhy"(), "qti"."__cn_part_form_names_te7u7jycdu"(), "qti"."__cn_type_names_wmjelllvhg"(), "qti"."__content_model_names_elvi5jdup4"(), "qti"."__declaration_kind_names_o62wpad2p7"(), "qti"."__domain_primitive_names_2yihitx2to"(), "qti"."__flag_names_dttyznb5cw"(), "qti"."__governor_names_d7jfyla3na"(), "qti"."__href_scope_names_y4pbuo4f5q"(), "qti"."__identity_names_rrxxe77wjj"(), "qti"."__include_parent_names_fixlnrxa4e"(), "qti"."__language_names_pvmtywwssv"(), "qti"."__node_kind_names_ulbko553n7"(), "qti"."__position_names_sglcn7ygpg"(), "qti"."__reading_form_names_tbdimwd3yh"(), "qti"."__reading_source_names_d5b4pcfzkz"(), "qti"."__reference_form_names_ktgko5k4l4"(), "qti"."__reference_resolution_names_3knvypuotm"(), "qti"."__reference_role_names_ce5jhrrzsl"(), "qti"."__reference_spelling_names_gocqpuf7tl"(), "qti"."__referenced_table_names_ynujnwu6bv"(), "qti"."__resource_type_names_iatibe6omc"(), "qti"."__rounding_holds_names_6j2zaayymp"(), "qti"."__rp_template_names_tkkjkmwhuf"(), "qti"."__schema_version_names_p2hfvbhu24"(), "qti"."__shared_model_names_3ekiicw54j"(), "qti"."__type_name_names_nykiaxxd3n"(), "qti"."__use_names_vmbq6fav2t"(), "qti"."__value_base_names_pjzlcpdwvv"(), "qti"."__value_cardinality_names_wzwznoycgf"(), "qti"."__value_domain_names_tb7etzpdol"(), "qti"."__xml_standalone_names_psf7bszcug"(), "qti"."__attribute_name_live_7ot3c4gfh5"(), "qti"."__attribute_slot_live_g5haf24jp3"(), "qti"."__flag_live_egdpt3c4t6"(), "qti"."__node_kind_live_rds6vphboo"(), "qti"."__position_live_uvhnssun3f"(), "qti"."__value_base_live_trk5bm7ra5"(), "qti"."__value_cardinality_live_qbccqbzssx"() FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."__flag_bits_12_i4uhexylc4", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."__domain_gfw43vigph", "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."attribute_slot", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."position", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."value_cardinality", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_xj3zno7u3h", "qti"."__text_7nkeqry66t", "qti"."__text_c6iptmtj2x", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_gke7uypkov", "qti"."__text_htajwmyatt", "qti"."__text_mqbstvk5ay", "qti"."__text_d7mwmflg4k", "qti"."__text_l7nqeazg5h", "qti"."__text_k5kwygzatl", "qti"."__text_7dfilirtp3", "qti"."__text_xisvziygi3", "qti"."__text_7j6kgluyjp", "qti"."__text_xey6ryorh5", "qti"."__text_n4nva7wrgk", "qti"."__text_pwaizaq6lx", "qti"."__text_psn65t7m7e", "qti"."__text_hdc6mvcrgm", "qti"."__text_23rzixl3a2", "qti"."__text_mpc5fvfrbl", "qti"."__text_qvake6vbfh", "qti"."__text_zij47sgley", "qti"."__text_piekqyt5fn", "qti"."__text_fgve4r33vj", "qti"."__text_5xaumrdzw7", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__text_6kufndem2v", "qti"."__text_3adwbksayk" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_identifier", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_id", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."gap_interaction", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."id_binding", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."idref_target", "qti__author"."inclusion", "qti__author"."instance", "qti__author"."instance_name", "qti__author"."interaction", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."item_ref_href", "qti__author"."item_ref_target", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."node", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site", "qti__author"."site_path", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_document", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."unread_type_href", "qti__author"."unread_type_path", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_element" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_range" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."aria_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assembled_catalog" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assembled_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assembled_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assembled_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assembled_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."assessment_object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."attribute_entity" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."binding_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."binding_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."binding_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."binding_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."body_xml_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."bound_variable" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."branch_resolution" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."branch_shuffle" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."branch_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."card_support" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."catalog_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."catalog_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."catalog_scope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."catalog_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."cell_headers" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."cell_leaf" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."choice_variable_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."cn_attribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."cn_count" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."cn_part_text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."cn_slot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."comment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."context_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."context_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."count_bound" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."count_range" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."declaration_table" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."default_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dependency" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."dependency_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."doctype" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_generals" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."document_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."double_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."encoding_decl" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."expression_attribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_ref_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."feedback_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."field_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."file_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."fragment_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."gap_interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."general_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."general_named" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."general_object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."header_token" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."held_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hotspot" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."hottext" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."id_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."identity_text" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."idref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."idref_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."inclusion" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."instance" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."instance_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interaction" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."interaction_attribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."item_ref_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."label_use" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."least_count" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."literal_typed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_entry" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_general" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_object" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_object_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_record" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_resource_type_source" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_string_language" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lom_title_string" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lookup_table" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lookup_table_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lookup_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."lookup_value_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."manifest_id_space" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_key" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_key_directed_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_key_float" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_key_integer" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_key_pair" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_key_point" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."map_key_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_item_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_item_ref_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_lookup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mapping_source_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mastery_ceiling" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mastery_floor" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."mastery_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_action" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_align_group" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_align_scope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_apply" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_argument" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_cell" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_cn" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_dir" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_qualifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."math_rank" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."most_count" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."name_lookup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."named" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."named_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."namespace" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."node" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."normal_maximum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."normal_minimum" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."object_title" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."open_attribute_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."open_element_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."operand" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."package" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pci_module_form" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."pi" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_body_xml_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_catalog_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_choice" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_general_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_hottext" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_idref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_math_rank" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_share_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_variable_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."placed_xml_lang" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."printed_variable_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."processing" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."processing_template" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."quotation" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."reading" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."reading_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_field" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."record_field_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."reference_document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."reference_path" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."reference_segment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."referring_document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_file" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_id" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_general" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_lom_language_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."resource_typed" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rounding" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rounding_figures" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rounding_mode" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."rounding_mode_figures" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."sd_decl" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_context_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_context_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_context_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_ref_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_feedback_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_identifier" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_member" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_ordering" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_printed_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_scope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_selection" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_template_name" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_template_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_template_ref_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."section_template_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."share_fragment" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."share_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."site" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."site_path" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."site_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."slider" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ssml_attribute" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."ssml_scope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."statistic_date" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."stimulus_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."table_header" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."table_scope" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_default" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_default_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_default_target" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_ref_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."template_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_document" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_flag" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."test_token" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_double_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_idref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_reference" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."text_reference_path" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tolerance" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."tolerance_token" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."typed_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."unread_type_href" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."unread_type_path" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."usage_value_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_base_type" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."value_set_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_lookup" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_mapping" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref_cardinality" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."variable_ref_declaration" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xml_decl" TO "qti__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti"."xml_lang" TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__refuse"("pg_catalog"."text", "pg_catalog"."text", "pg_catalog"."text") TO "qti__author";

GRANT EXECUTE ON FUNCTION "qti"."__constant_uij2fonltq"(), "qti"."__constant_bkqh2friwv"(), "qti"."__constant_eo4djco6b4"(), "qti"."__constant_sx2lr4try3"(), "qti"."__constant_u7eltifwnk"(), "qti"."__constant_7v2rmkfszl"(), "qti"."__constant_waek7atehx"(), "qti"."__constant_nhyhb5mvr7"(), "qti"."__constant_ibiapjhixk"(), "qti"."__constant_cc6vlqxc5e"(), "qti"."__constant_milnmhezry"(), "qti"."__constant_caimmsgsgb"(), "qti"."__constant_2ydzf24l25"(), "qti"."__constant_m6cittd2yd"(), "qti"."__constant_cowgjzeorq"(), "qti"."__constant_hmibfx5gyk"(), "qti"."__constant_wm5pnshcyf"(), "qti"."__constant_ncvuf24xxr"(), "qti"."__constant_ykvwltiwpp"(), "qti"."__constant_f33slecxe4"(), "qti"."__constant_wzcsm5lgek"(), "qti"."__constant_npu4wt2fbp"(), "qti"."__constant_yegly32ojt"(), "qti"."__constant_gnajygigus"(), "qti"."__constant_3t4qepe5jn"(), "qti"."__constant_5kz6ofzblb"(), "qti"."__constant_ct2vnrdq7e"(), "qti"."__constant_xjuxnqukjv"(), "qti"."__constant_5ykzxdvynm"(), "qti"."__constant_eqtu3e3bf7"(), "qti"."__constant_4okg7vcxht"(), "qti"."__constant_bnroidxvkl"(), "qti"."__constant_cvrzwozguy"(), "qti"."__constant_42zaiy3pw4"(), "qti"."__constant_whaydjeagy"(), "qti"."__constant_nzkmx3la3e"(), "qti"."__constant_lt7r7r6eus"(), "qti"."__constant_qkqwephi2j"(), "qti"."__constant_sqmzlmgx7q"(), "qti"."__constant_7ayqtsnyfr"(), "qti"."__constant_oazju5gsln"(), "qti"."__constant_kpxfwusb6s"(), "qti"."__constant_sj4gtqwjvu"(), "qti"."__constant_inwmcukoes"(), "qti"."__constant_qlb2jx4hhv"(), "qti"."__constant_m7gdtnppww"(), "qti"."__constant_qclwnol5oy"(), "qti"."__constant_exnqxdg5si"(), "qti"."__constant_wrlwssqvsp"(), "qti"."__constant_dhxmsn4rkd"(), "qti"."__constant_5vczbwx7y7"(), "qti"."__constant_p5oxaznp4j"(), "qti"."__constant_fgsupcpxgj"(), "qti"."__constant_samvsv5x3m"(), "qti"."__constant_ibvgt6pxwh"(), "qti"."__constant_6pgyw625sv"(), "qti"."__constant_qvvxi5pvxk"(), "qti"."__constant_2orzvrv6ut"(), "qti"."__constant_h5f56cbmgk"(), "qti"."__constant_wvtqnkiky3"(), "qti"."__constant_47ksumromp"(), "qti"."__constant_kos3rnuvei"(), "qti"."__constant_5pcz6dyjzi"(), "qti"."__constant_cy4erml7fi"(), "qti"."__constant_3lx4yzmo77"(), "qti"."__constant_6f44bj6f5z"(), "qti"."__constant_ter3l763yp"(), "qti"."__constant_ftz6h5paqe"(), "qti"."__constant_przq27rlwm"(), "qti"."__constant_qrfq2g4hkz"(), "qti"."__constant_ogqwerfjhc"(), "qti"."__constant_2spvsmpumv"(), "qti"."__constant_5r3at22xvz"(), "qti"."__constant_zqmhcyzcur"(), "qti"."__constant_aprps52eby"(), "qti"."__constant_ahddjwrhv5"(), "qti"."__constant_k3fjlwxuwn"(), "qti"."__constant_iz4l44v4pt"(), "qti"."__constant_ctf72alvlj"(), "qti"."__constant_xvmgsamjvy"(), "qti"."__constant_bxvzcve5q4"(), "qti"."__constant_jl3vjp3onh"(), "qti"."__constant_5qe5tzd65n"(), "qti"."__constant_p4pvfhuaqm"(), "qti"."__constant_lliww2nzpo"(), "qti"."__constant_adakh3kbth"(), "qti"."__constant_dqbnkda3gg"(), "qti"."__constant_gf6he576t3"(), "qti"."__constant_iksi4cbdex"(), "qti"."__constant_jgtq6vvihi"(), "qti"."__constant_fsmfviu65m"(), "qti"."__constant_kb2tdexlqu"(), "qti"."__constant_wvuca46fcu"(), "qti"."__constant_nfgjamc5xd"(), "qti"."__constant_dj7xbg6izu"(), "qti"."__constant_ho6c7gpjo3"(), "qti"."__constant_ma2si6ukdt"(), "qti"."__constant_ejkw66w2je"(), "qti"."__constant_sl65lnozn2"(), "qti"."__constant_66i4fjuv6n"(), "qti"."__constant_vjkzvvaevx"(), "qti"."__constant_otpfpakmgn"(), "qti"."__constant_sszsm5lf66"(), "qti"."__constant_p2xwmlesaa"(), "qti"."__constant_uwvfzil5rh"(), "qti"."__constant_eizgu7rgqp"(), "qti"."__constant_fccrluys3c"(), "qti"."__constant_w4tawmrghr"(), "qti"."__constant_hh7nvhrixk"(), "qti"."__constant_j6uos7o7iw"(), "qti"."__constant_gazfxeallk"(), "qti"."__constant_7puc5uc6kh"(), "qti"."__constant_wekhard5xm"(), "qti"."__constant_ajahbtka65"(), "qti"."__constant_6iey4mkmde"(), "qti"."__constant_3fecx3moff"(), "qti"."__constant_zkhfdh2gmj"(), "qti"."__constant_wozychch32"(), "qti"."__constant_is5pk7lyfr"(), "qti"."__constant_gbvdw5papk"(), "qti"."__constant_6l2ttocydo"(), "qti"."__constant_levw2mwpwa"(), "qti"."__constant_lnl5n26s3i"(), "qti"."__constant_mzggfsj72d"(), "qti"."__constant_4v2z57igsj"(), "qti"."__constant_sn5ucr2eat"(), "qti"."__constant_3bgu23uy42"(), "qti"."__constant_uynctp5wdx"(), "qti"."__constant_sjctib2m6a"(), "qti"."__constant_uav4xy4p5a"(), "qti"."__constant_folbw276p3"(), "qti"."__constant_dc7u4pz4ga"(), "qti"."__constant_nccth24rmg"(), "qti"."__constant_wn244xqmvq"(), "qti"."__constant_rwijlqnagg"(), "qti"."__constant_n4gntw4ty5"(), "qti"."__constant_aiwrmlshlf"(), "qti"."__constant_g3bd4eyobi"(), "qti"."__constant_zkaa5w3gb2"(), "qti"."__align_direction_names_vluq7iazdg"(), "qti"."__align_state_names_ffk37slxn3"(), "qti"."__attribute_model_names_d7ufmii6j2"(), "qti"."__attribute_name_names_q6tmzcty4e"(), "qti"."__attribute_slot_names_4r5l4mp24z"(), "qti"."__base_type_names_ok3nu5nck4"(), "qti"."__bound_facet_names_b7dbsbn4iu"(), "qti"."__bound_zero_names_2iyjgurtgw"(), "qti"."__built_in_names_qkzs4cgupe"(), "qti"."__cardinality_names_kqiairsoqa"(), "qti"."__cn_base_names_2wtzhyubck"(), "qti"."__cn_part_names_6db2fcgfhy"(), "qti"."__cn_part_form_names_te7u7jycdu"(), "qti"."__cn_type_names_wmjelllvhg"(), "qti"."__content_model_names_elvi5jdup4"(), "qti"."__declaration_kind_names_o62wpad2p7"(), "qti"."__domain_primitive_names_2yihitx2to"(), "qti"."__flag_names_dttyznb5cw"(), "qti"."__governor_names_d7jfyla3na"(), "qti"."__href_scope_names_y4pbuo4f5q"(), "qti"."__identity_names_rrxxe77wjj"(), "qti"."__include_parent_names_fixlnrxa4e"(), "qti"."__language_names_pvmtywwssv"(), "qti"."__node_kind_names_ulbko553n7"(), "qti"."__position_names_sglcn7ygpg"(), "qti"."__reading_form_names_tbdimwd3yh"(), "qti"."__reading_source_names_d5b4pcfzkz"(), "qti"."__reference_form_names_ktgko5k4l4"(), "qti"."__reference_resolution_names_3knvypuotm"(), "qti"."__reference_role_names_ce5jhrrzsl"(), "qti"."__reference_spelling_names_gocqpuf7tl"(), "qti"."__referenced_table_names_ynujnwu6bv"(), "qti"."__resource_type_names_iatibe6omc"(), "qti"."__rounding_holds_names_6j2zaayymp"(), "qti"."__rp_template_names_tkkjkmwhuf"(), "qti"."__schema_version_names_p2hfvbhu24"(), "qti"."__shared_model_names_3ekiicw54j"(), "qti"."__type_name_names_nykiaxxd3n"(), "qti"."__use_names_vmbq6fav2t"(), "qti"."__value_base_names_pjzlcpdwvv"(), "qti"."__value_cardinality_names_wzwznoycgf"(), "qti"."__value_domain_names_tb7etzpdol"(), "qti"."__xml_standalone_names_psf7bszcug"(), "qti"."__attribute_name_live_7ot3c4gfh5"(), "qti"."__attribute_slot_live_g5haf24jp3"(), "qti"."__flag_live_egdpt3c4t6"(), "qti"."__node_kind_live_rds6vphboo"(), "qti"."__position_live_uvhnssun3f"(), "qti"."__value_base_live_trk5bm7ra5"(), "qti"."__value_cardinality_live_qbccqbzssx"() TO "qti__author";

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."area_mapping", "qti"."area_mapping_cardinality", "qti"."aria_element", "qti"."aria_range", "qti"."aria_value", "qti"."assembled_catalog", "qti"."assembled_id", "qti"."assembled_lang", "qti"."assembled_name", "qti"."assembled_reference", "qti"."assessment_object", "qti"."attribute", "qti"."attribute_entity", "qti"."binding", "qti"."binding_base_type", "qti"."binding_cardinality", "qti"."binding_declaration", "qti"."binding_name", "qti"."body_xml_lang", "qti"."bound_variable", "qti"."branch_resolution", "qti"."branch_rule", "qti"."branch_shuffle", "qti"."branch_target", "qti"."card_support", "qti"."catalog_id", "qti"."catalog_ref", "qti"."catalog_scope", "qti"."catalog_target", "qti"."cell_headers", "qti"."cell_leaf", "qti"."choice", "qti"."choice_interaction", "qti"."choice_variable_name", "qti"."cn_attribute", "qti"."cn_count", "qti"."cn_part_text", "qti"."cn_slot", "qti"."comment", "qti"."context_ref", "qti"."context_ref_declaration", "qti"."count_bound", "qti"."count_range", "qti"."declaration", "qti"."declaration_base_type", "qti"."declaration_cardinality", "qti"."declaration_identifier", "qti"."declaration_name", "qti"."declaration_table", "qti"."default_entry", "qti"."dependency", "qti"."dependency_target", "qti"."doctype", "qti"."document", "qti"."document_generals", "qti"."document_id", "qti"."document_lang", "qti"."double_value", "qti"."encoding_decl", "qti"."entry", "qti"."expression", "qti"."expression_attribute", "qti"."feedback_ref", "qti"."feedback_ref_cardinality", "qti"."feedback_ref_declaration", "qti"."field_value", "qti"."file", "qti"."file_href", "qti"."fragment_value", "qti"."gap_interaction", "qti"."general_lang", "qti"."general_named", "qti"."general_object", "qti"."header_token", "qti"."held_type", "qti"."hotspot", "qti"."hottext", "qti"."id_binding", "qti"."identity_text", "qti"."idref", "qti"."idref_target", "qti"."inclusion", "qti"."instance", "qti"."instance_name", "qti"."interaction", "qti"."interaction_attribute", "qti"."item_mode", "qti"."item_ref_document", "qti"."item_ref_href", "qti"."item_ref_target", "qti"."label_use", "qti"."least_count", "qti"."literal", "qti"."literal_typed", "qti"."lom_entry", "qti"."lom_general", "qti"."lom_language", "qti"."lom_object", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_record", "qti"."lom_resource", "qti"."lom_resource_type", "qti"."lom_resource_type_source", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_title", "qti"."lom_title_string", "qti"."lookup_table", "qti"."lookup_table_cardinality", "qti"."lookup_value", "qti"."lookup_value_type", "qti"."manifest_id", "qti"."manifest_id_space", "qti"."map_key", "qti"."map_key_directed_pair", "qti"."map_key_float", "qti"."map_key_integer", "qti"."map_key_pair", "qti"."map_key_point", "qti"."map_key_type", "qti"."mapping", "qti"."mapping_base_type", "qti"."mapping_cardinality", "qti"."mapping_item_ref", "qti"."mapping_item_ref_type", "qti"."mapping_lookup", "qti"."mapping_source_declaration", "qti"."mastery_ceiling", "qti"."mastery_floor", "qti"."mastery_value", "qti"."math_action", "qti"."math_align_group", "qti"."math_align_scope", "qti"."math_apply", "qti"."math_argument", "qti"."math_cell", "qti"."math_cn", "qti"."math_dir", "qti"."math_qualifier", "qti"."math_rank", "qti"."most_count", "qti"."name_lookup", "qti"."named", "qti"."named_href", "qti"."namespace", "qti"."node", "qti"."normal_maximum", "qti"."normal_minimum", "qti"."object_identifier", "qti"."object_lang", "qti"."object_title", "qti"."open_attribute_name", "qti"."open_element_name", "qti"."operand", "qti"."package", "qti"."pci_module_form", "qti"."pi", "qti"."placed_binding", "qti"."placed_binding_base_type", "qti"."placed_binding_cardinality", "qti"."placed_binding_declaration", "qti"."placed_body_xml_lang", "qti"."placed_catalog_ref", "qti"."placed_choice", "qti"."placed_document", "qti"."placed_general_lang", "qti"."placed_hottext", "qti"."placed_id", "qti"."placed_idref", "qti"."placed_math_rank", "qti"."placed_reference", "qti"."placed_share_target", "qti"."placed_variable_ref", "qti"."placed_variable_ref_declaration", "qti"."placed_xml_lang", "qti"."printed_variable_ref", "qti"."printed_variable_ref_declaration", "qti"."processing", "qti"."processing_template", "qti"."quotation", "qti"."reading", "qti"."reading_cardinality", "qti"."record_field", "qti"."record_field_name", "qti"."reference", "qti"."reference_document", "qti"."reference_path", "qti"."reference_segment", "qti"."referring_document", "qti"."resource", "qti"."resource_file", "qti"."resource_href", "qti"."resource_id", "qti"."resource_lom_general", "qti"."resource_lom_language_set", "qti"."resource_typed", "qti"."rounding", "qti"."rounding_figures", "qti"."rounding_mode", "qti"."rounding_mode_figures", "qti"."sd_decl", "qti"."section", "qti"."section_context_name", "qti"."section_context_ref", "qti"."section_context_ref_declaration", "qti"."section_feedback_name", "qti"."section_feedback_ref", "qti"."section_feedback_ref_cardinality", "qti"."section_feedback_ref_declaration", "qti"."section_identifier", "qti"."section_member", "qti"."section_ordering", "qti"."section_printed_name", "qti"."section_printed_ref", "qti"."section_printed_ref_declaration", "qti"."section_scope", "qti"."section_selection", "qti"."section_template_name", "qti"."section_template_ref", "qti"."section_template_ref_cardinality", "qti"."section_template_ref_declaration", "qti"."share_fragment", "qti"."share_target", "qti"."site", "qti"."site_path", "qti"."site_target", "qti"."slider", "qti"."ssml_attribute", "qti"."ssml_scope", "qti"."statistic_date", "qti"."stimulus_ref", "qti"."table_header", "qti"."table_scope", "qti"."template_default", "qti"."template_default_cardinality", "qti"."template_default_target", "qti"."template_ref", "qti"."template_ref_cardinality", "qti"."template_ref_declaration", "qti"."test_document", "qti"."test_flag", "qti"."test_reference", "qti"."test_token", "qti"."text_double_value", "qti"."text_idref", "qti"."text_reference", "qti"."text_reference_path", "qti"."tolerance", "qti"."tolerance_token", "qti"."typed_href", "qti"."typed_value", "qti"."unread_type_href", "qti"."unread_type_path", "qti"."usage_base_type", "qti"."usage_value", "qti"."usage_value_base_type", "qti"."value", "qti"."value_base_type", "qti"."value_set", "qti"."value_set_cardinality", "qti"."variable_lookup", "qti"."variable_mapping", "qti"."variable_ref", "qti"."variable_ref_cardinality", "qti"."variable_ref_declaration", "qti"."xml_decl", "qti"."xml_lang", "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_identifier", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_id", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."gap_interaction", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."id_binding", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."idref_target", "qti__author"."inclusion", "qti__author"."instance", "qti__author"."instance_name", "qti__author"."interaction", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."item_ref_href", "qti__author"."item_ref_target", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."node", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site", "qti__author"."site_path", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_document", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."unread_type_href", "qti__author"."unread_type_path", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."__attribute_name_bits_416_thr6i6sipt", "qti"."attribute_slot", "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."__flag_bits_12_i4uhexylc4", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."__node_kind_bits_644_kcdmigfwqm", "qti"."position", "qti"."__position_bits_308_gsnowf36kr", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."value_cardinality", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_pwaizaq6lx", "qti"."__text_c6iptmtj2x", "qti"."__text_5xaumrdzw7", "qti"."__text_xj3zno7u3h", "qti"."__text_7j6kgluyjp", "qti"."__text_7dfilirtp3", "qti"."__text_l7nqeazg5h", "qti"."__text_xey6ryorh5", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_7nkeqry66t", "qti"."__text_6kufndem2v", "qti"."__text_htajwmyatt", "qti"."__text_qvake6vbfh", "qti"."__text_n4nva7wrgk", "qti"."__text_hdc6mvcrgm", "qti"."__text_zij47sgley", "qti"."__text_gke7uypkov", "qti"."__text_d7mwmflg4k", "qti"."__text_piekqyt5fn", "qti"."__text_mpc5fvfrbl", "qti"."__text_fgve4r33vj", "qti"."__text_23rzixl3a2", "qti"."__text_3adwbksayk", "qti"."__text_k5kwygzatl", "qti"."__text_mqbstvk5ay", "qti"."__text_xisvziygi3", "qti"."__text_psn65t7m7e", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__domain_gfw43vigph" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

ALTER TABLE "qti"."test_document" DROP COLUMN "__pred_sites_62entkrpk5";

ALTER TABLE "qti"."site_target" DROP COLUMN "__predecessor_sites_llb2m5ae7c";

ALTER TABLE "qti"."site_target" DROP COLUMN "__index_sites_ehadpoyrnv";

ALTER TABLE "qti"."site_target" DROP COLUMN "__copy_sites_nyxjgjnrfd";

COMMENT ON CONSTRAINT "__id_binding_key_document_id_owner_carriers_admitted_inddtnd2mu" ON "qti"."id_binding" IS 'key IdBinding(document, id, owner, carriers, admitted)';

COMMENT ON CONSTRAINT "__item_ref_href_pk_gic6tz4yai" ON "qti"."item_ref_href" IS 'primary key of ItemRefHref';

COMMENT ON CONSTRAINT "__item_ref_href_key_node_targets_zb4ttsu4vy" ON "qti"."item_ref_href" IS 'key ItemRefHref(node, targets)';

COMMENT ON CONSTRAINT "__resource_href_key_node_package_path_nzbzmdfqem" ON "qti"."resource_href" IS 'key ResourceHref(node, package, path)';

COMMENT ON CONSTRAINT "__site_target_key_node_parent_kind_places_target_o2sl5j6mjr" ON "qti"."site_target" IS 'key SiteTarget(node, parentKind, places, targetRoot, splices, version)';

COMMENT ON CONSTRAINT "__site_target_key_node_target_places_3fxneelujg" ON "qti"."site_target" IS 'key SiteTarget(node, target, places)';

COMMENT ON CONSTRAINT "__test_document_check_test_document_targets_count_axud4pinz2" ON "qti"."test_document" IS 'check of TestDocument for law count fold over fin(TestDocument, targets) of SiteTarget(document) where {"kind":"compare","left":{"field":"places","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}} into TestDocument(node, sites)';

COMMENT ON CONSTRAINT "__test_document_key_node_targets_qmxh2nyfxk" ON "qti"."test_document" IS 'key TestDocument(node, targets)';

COMMENT ON CONSTRAINT "__unread_type_href_pk_de5lmpzrd5" ON "qti"."unread_type_href" IS 'primary key of UnreadTypeHref';

COMMENT ON CONSTRAINT "__unread_type_path_pk_krcrzcqvvc" ON "qti"."unread_type_path" IS 'primary key of UnreadTypePath';

COMMENT ON CONSTRAINT "__unread_type_path_key_package_path_names_4s5fzpvfen" ON "qti"."unread_type_path" IS 'key UnreadTypePath(package, path, names)';

COMMENT ON COLUMN "qti"."document_id"."__document_7pfajdbgba" IS 'document where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."document_id"."__node_4ck2w6ow6d" IS 'node where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."document_id"."__node_3olzulnuu3" IS 'node where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."id_binding"."__document_7pfajdbgba" IS 'document where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."id_binding"."__id_phjuaybmt3" IS 'id where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."instance"."__tag_places_true_fsuzemt64t" IS 'tag SiteTarget.places = true';

COMMENT ON COLUMN "qti"."item_ref_href"."__tag_kind_qti_assessment_item_ref_7dgpuznkbf" IS 'tag Node.kind = qti-assessment-item-ref';

COMMENT ON COLUMN "qti"."item_ref_href"."__tag_name_href_uly3pfxknv" IS 'tag ReferencePath.name = href';

COMMENT ON COLUMN "qti"."item_ref_href"."__package_adrverkxjo" IS 'package where {"kind":"compare","left":{"field":"targets","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}}';

COMMENT ON COLUMN "qti"."item_ref_href"."__path_ngniuv3apr" IS 'path where {"kind":"compare","left":{"field":"targets","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}}';

COMMENT ON COLUMN "qti"."item_ref_href"."__pred_targets_c5nt4iqzuc" IS 'pred(targets)';

COMMENT ON COLUMN "qti"."item_ref_target"."__copy_targets_acqc7ivxh4" IS 'the owner''s count of the family ItemRefHref.targets';

COMMENT ON COLUMN "qti"."item_ref_target"."__index_targets_4bfzj4widk" IS 'the index of the family ItemRefHref.targets';

COMMENT ON COLUMN "qti"."item_ref_target"."__predecessor_targets_vb2ate2sxf" IS 'the predecessor of the index of the family ItemRefHref.targets';

COMMENT ON COLUMN "qti"."node"."__document_3cbls6hfyp" IS 'document where {"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"}';

COMMENT ON COLUMN "qti"."node"."__id_vefq5vxxrm" IS 'id where {"arg":{"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"},"kind":"not"}';

COMMENT ON COLUMN "qti"."node"."__id_tyor4vdw5d" IS 'id where {"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"}';

COMMENT ON COLUMN "qti"."resource_href"."__node_bsayaavrlz" IS 'node where {"arg":{"args":[{"field":"typeLexical","kind":"field"},{"kind":"literal","value":"^(?:imsqti_test_xmlv3p0|imsqti_section_xmlv3p0|imsqti_item_xmlv3p0|imsqti_resprocessing_xmlv3p0|imsqti_outcomes_xmlv3p0|imsqti_stimulus_xmlv3p0|imsqti_fragment_xmlv3p0|imsqti_rptemplate_xmlv3p0|associatedcontent/learning-application-resource|webcontent|imsbasiclti_xmlv1p3|controlfile|resourcemetadata/xml|resourceextmetadata/xml|qtiusagedata/xml|pls|css2|css3|extension|imslti_xmlv1p1|imsltia_xmlv1p0)$"}],"fn":"matches","kind":"compute"},"kind":"not"} and {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."site_target"."__after_targets_0_uzk4mcxzw5" IS 'the accumulator after plane 0 of the fold __test_document_targets_count_fold_6lkbv46gdx over the family TestDocument.targets';

COMMENT ON COLUMN "qti"."site_target"."__before_targets_0_fmlpvwa3pv" IS 'the accumulator before plane 0 of the fold __test_document_targets_count_fold_6lkbv46gdx over the family TestDocument.targets';

COMMENT ON COLUMN "qti"."site_target"."__copy_targets_3sjjwdmfq5" IS 'the owner''s count of the family TestDocument.targets';

COMMENT ON COLUMN "qti"."site_target"."__index_targets_dhwvwcvgsf" IS 'the index of the family TestDocument.targets';

COMMENT ON COLUMN "qti"."site_target"."__predecessor_targets_luepn467by" IS 'the predecessor of the index of the family TestDocument.targets';

COMMENT ON COLUMN "qti"."test_document"."__pred_targets_c5nt4iqzuc" IS 'pred(targets)';

COMMENT ON COLUMN "qti"."unread_type_href"."__copy_names_bd77hksaq7" IS 'the owner''s count of the family UnreadTypePath.names';

COMMENT ON COLUMN "qti"."unread_type_href"."__index_names_6ktqyedpys" IS 'the index of the family UnreadTypePath.names';

COMMENT ON COLUMN "qti"."unread_type_href"."__predecessor_names_6cflv6fqva" IS 'the predecessor of the index of the family UnreadTypePath.names';

COMMENT ON COLUMN "qti"."unread_type_path"."__pred_names_bbnnt7wrn7" IS 'pred(names)';

COMMENT ON CONSTRAINT "__id_binding_key_document_id_llzafs6ajp" ON "qti"."id_binding" IS 'key IdBinding(document where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}, id where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}})';

COMMENT ON CONSTRAINT "__item_ref_target_key_node_index_targets_q2zfwgtqx3" ON "qti"."item_ref_target" IS 'key ItemRefTarget(node, the index of the family ItemRefHref.targets)';

COMMENT ON CONSTRAINT "__node_key_id_iyvasuyphs" ON "qti"."node" IS 'key Node(id where {"arg":{"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"},"kind":"not"})';

COMMENT ON CONSTRAINT "__node_key_id_document_5tagtjbgoj" ON "qti"."node" IS 'key Node(id where {"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"}, document where {"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"})';

COMMENT ON CONSTRAINT "__site_target_key_document_index_targets_ca4f46xghj" ON "qti"."site_target" IS 'key SiteTarget(document, the index of the family TestDocument.targets)';

COMMENT ON CONSTRAINT "__site_target_key_document_index_targets_after_ahi4znzcjo" ON "qti"."site_target" IS 'key SiteTarget(document, the index of the family TestDocument.targets, the accumulator after plane 0 of the fold __test_document_targets_count_fold_6lkbv46gdx over the family TestDocument.targets)';

COMMENT ON CONSTRAINT "__unread_type_href_key_package_path_index_names_poqti4ilbr" ON "qti"."unread_type_href" IS 'key UnreadTypeHref(package, path, the index of the family UnreadTypePath.names)';

COMMENT ON CONSTRAINT "__item_ref_target_check_item_ref_target_counted_item_sn7sol4uot" ON "qti"."item_ref_target" IS 'check of ItemRefTarget for law counted ItemRefTarget(node) in fin(ItemRefHref, targets)';

COMMENT ON CONSTRAINT "__site_target_check_site_target_counted_test_lcmbcunhdj" ON "qti"."site_target" IS 'check of SiteTarget for law counted SiteTarget(document) in fin(TestDocument, targets)';

COMMENT ON CONSTRAINT "__site_target_check_test_document_targets_count_fold_kq7fihbeoj" ON "qti"."site_target" IS 'check of SiteTarget for law count fold over fin(TestDocument, targets) of SiteTarget(document) where {"kind":"compare","left":{"field":"places","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}} into TestDocument(node, sites)';

COMMENT ON CONSTRAINT "__unread_type_href_check_unread_type_href_counted_c2kqri6dmd" ON "qti"."unread_type_href" IS 'check of UnreadTypeHref for law counted UnreadTypeHref(package, path) in fin(UnreadTypePath, names)';

COMMENT ON CONSTRAINT "__attribute_fk_node_nu2sz322f5" ON "qti"."attribute" IS 'foreign key Attribute(node where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-assessment-item-ref"]} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"href"}}) to ItemRefHref(node)';

COMMENT ON CONSTRAINT "__document_id_fk_document_id_owner_copy_carriers_whgpsohdfl" ON "qti"."document_id" IS 'foreign key DocumentId(document, id, owner, the owner''s count of the family IdBinding.carriers, admitted) to IdBinding(document, id, owner, carriers, admitted)';

COMMENT ON CONSTRAINT "__document_id_fk_node_aw4mq3fcil" ON "qti"."document_id" IS 'foreign key DocumentId(node where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}) to Node(id where {"arg":{"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"},"kind":"not"})';

COMMENT ON CONSTRAINT "__document_id_fk_node_document_xqhqcztrjz" ON "qti"."document_id" IS 'foreign key DocumentId(node where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}, document where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}) to Node(id where {"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"}, document where {"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"kind","kind":"field"}],"kind":"closedHas","relation":"ChildGrammar"})';

COMMENT ON CONSTRAINT "__idref_target_fk_document_id_eirp6y4xx3" ON "qti"."idref_target" IS 'foreign key IdrefTarget(document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}, id where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}) to IdBinding(document where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}, id where {"kind":"compare","left":{"field":"admitted","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}})';

COMMENT ON CONSTRAINT "__inclusion_fk_node_parent_kind_places_root_splices_io4c4fmo5z" ON "qti"."inclusion" IS 'foreign key Inclusion(node, parentKind, places, root, splices, version) to SiteTarget(node, parentKind, places, targetRoot, splices, version)';

COMMENT ON CONSTRAINT "__instance_fk_site_document_tag_places_true_4c4r57c3bc" ON "qti"."instance" IS 'foreign key Instance(site where {"kind":"compare","left":{"field":"start","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}}, document where {"kind":"compare","left":{"field":"start","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}}, tag SiteTarget.places = true) to SiteTarget(node, target, places)';

COMMENT ON CONSTRAINT "__item_ref_href_fk_node_package_path_tag_name_href_2kw3eaprte" ON "qti"."item_ref_href" IS 'foreign key ItemRefHref(node, package, path, tag ReferencePath.name = href) to ReferencePath(node, package, path, name)';

COMMENT ON CONSTRAINT "__item_ref_href_fk_node_tag_kind_qti_assessment_item_ifa6ig36c2" ON "qti"."item_ref_href" IS 'foreign key ItemRefHref(node, tag Node.kind = qti-assessment-item-ref) to Node(id, kind)';

COMMENT ON CONSTRAINT "__item_ref_href_fk_node_pred_targets_thca2qpw5g" ON "qti"."item_ref_href" IS 'foreign key ItemRefHref(node, pred(targets)) to ItemRefTarget(node, the index of the family ItemRefHref.targets)';

COMMENT ON CONSTRAINT "__item_ref_href_fk_package_path_kr7t3bri5e" ON "qti"."item_ref_href" IS 'foreign key ItemRefHref(package where {"kind":"compare","left":{"field":"targets","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}}, path where {"kind":"compare","left":{"field":"targets","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}}) to UnreadTypePath(package, path)';

COMMENT ON CONSTRAINT "__item_ref_target_fk_node_copy_targets_ln5fobuske" ON "qti"."item_ref_target" IS 'foreign key ItemRefTarget(node, the owner''s count of the family ItemRefHref.targets) to ItemRefHref(node, targets)';

COMMENT ON CONSTRAINT "__item_ref_target_fk_node_predecessor_targets_lhswdxhi37" ON "qti"."item_ref_target" IS 'foreign key ItemRefTarget(node, the predecessor of the index of the family ItemRefHref.targets) to ItemRefTarget(node, the index of the family ItemRefHref.targets)';

COMMENT ON CONSTRAINT "__resource_href_fk_node_kv3zocm3jr" ON "qti"."resource_href" IS 'foreign key ResourceHref(node where {"arg":{"args":[{"field":"typeLexical","kind":"field"},{"kind":"literal","value":"^(?:imsqti_test_xmlv3p0|imsqti_section_xmlv3p0|imsqti_item_xmlv3p0|imsqti_resprocessing_xmlv3p0|imsqti_outcomes_xmlv3p0|imsqti_stimulus_xmlv3p0|imsqti_fragment_xmlv3p0|imsqti_rptemplate_xmlv3p0|associatedcontent/learning-application-resource|webcontent|imsbasiclti_xmlv1p3|controlfile|resourcemetadata/xml|resourceextmetadata/xml|qtiusagedata/xml|pls|css2|css3|extension|imslti_xmlv1p1|imsltia_xmlv1p0)$"}],"fn":"matches","kind":"compute"},"kind":"not"} and {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}) to UnreadTypeHref(node)';

COMMENT ON CONSTRAINT "__site_target_fk_document_copy_targets_sbyhpzmwn2" ON "qti"."site_target" IS 'foreign key SiteTarget(document, the owner''s count of the family TestDocument.targets) to TestDocument(node, targets)';

COMMENT ON CONSTRAINT "__site_target_fk_document_predecessor_targets_before_i4lqey67vn" ON "qti"."site_target" IS 'foreign key SiteTarget(document, the predecessor of the index of the family TestDocument.targets, the accumulator before plane 0 of the fold __test_document_targets_count_fold_6lkbv46gdx over the family TestDocument.targets) to SiteTarget(document, the index of the family TestDocument.targets, the accumulator after plane 0 of the fold __test_document_targets_count_fold_6lkbv46gdx over the family TestDocument.targets)';

COMMENT ON CONSTRAINT "__test_document_fk_node_pred_targets_sites_3qptivb5vp" ON "qti"."test_document" IS 'foreign key TestDocument(node, pred(targets), sites) to SiteTarget(document, the index of the family TestDocument.targets, the accumulator after plane 0 of the fold __test_document_targets_count_fold_6lkbv46gdx over the family TestDocument.targets)';

COMMENT ON CONSTRAINT "__unread_type_href_fk_node_package_path_jbja6jml3m" ON "qti"."unread_type_href" IS 'foreign key UnreadTypeHref(node, package, path) to ResourceHref(node, package, path)';

COMMENT ON CONSTRAINT "__unread_type_href_fk_node_package_type_lexical_ukutjbkxbx" ON "qti"."unread_type_href" IS 'foreign key UnreadTypeHref(node, package, typeLexical) to Resource(node, package, typeLexical)';

COMMENT ON CONSTRAINT "__unread_type_href_fk_package_path_copy_names_2nqtpzsvje" ON "qti"."unread_type_href" IS 'foreign key UnreadTypeHref(package, path, the owner''s count of the family UnreadTypePath.names) to UnreadTypePath(package, path, names)';

COMMENT ON CONSTRAINT "__unread_type_href_fk_package_path_predecessor_names_tpztwrqxx2" ON "qti"."unread_type_href" IS 'foreign key UnreadTypeHref(package, path, the predecessor of the index of the family UnreadTypePath.names) to UnreadTypeHref(package, path, the index of the family UnreadTypePath.names)';

COMMENT ON CONSTRAINT "__unread_type_path_fk_package_path_pred_names_j2iyglxqs6" ON "qti"."unread_type_path" IS 'foreign key UnreadTypePath(package, path, pred(names)) to UnreadTypeHref(package, path, the index of the family UnreadTypePath.names)';

COMMENT ON INDEX "qti"."__document_id_ix_node_3_olzulnuu_3_document_7_hyy45w5uxu" IS 'btree index DocumentId(__node_3olzulnuu3, __document_7pfajdbgba)';

COMMENT ON INDEX "qti"."__document_id_ix_node_4_ck_2_w_6_ow_6_d_2idckzhju3" IS 'btree index DocumentId(__node_4ck2w6ow6d)';

COMMENT ON INDEX "qti"."__item_ref_href_ix_package_adrverkxjo_path_ngniuv_3_vjadm723op" IS 'btree index ItemRefHref(__package_adrverkxjo, __path_ngniuv3apr)';

COMMENT ON INDEX "qti"."__resource_href_ix_node_bsayaavrlz_7qm5cf5e6w" IS 'btree index ResourceHref(__node_bsayaavrlz)';
