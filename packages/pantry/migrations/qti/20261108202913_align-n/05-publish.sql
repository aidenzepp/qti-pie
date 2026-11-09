ALTER TABLE "qti"."site" DROP CONSTRAINT "__site_fk_node_n4grbpvk55";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."__flag_bits_12_i4uhexylc4", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."__domain_gfw43vigph", "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."attribute_slot", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."position", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."value_cardinality", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_xj3zno7u3h", "qti"."__text_7nkeqry66t", "qti"."__text_c6iptmtj2x", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_gke7uypkov", "qti"."__text_htajwmyatt", "qti"."__text_mqbstvk5ay", "qti"."__text_d7mwmflg4k", "qti"."__text_l7nqeazg5h", "qti"."__text_k5kwygzatl", "qti"."__text_7dfilirtp3", "qti"."__text_xisvziygi3", "qti"."__text_7j6kgluyjp", "qti"."__text_xey6ryorh5", "qti"."__text_n4nva7wrgk", "qti"."__text_pwaizaq6lx", "qti"."__text_psn65t7m7e", "qti"."__text_hdc6mvcrgm", "qti"."__text_23rzixl3a2", "qti"."__text_mpc5fvfrbl", "qti"."__text_qvake6vbfh", "qti"."__text_zij47sgley", "qti"."__text_piekqyt5fn", "qti"."__text_fgve4r33vj", "qti"."__text_5xaumrdzw7", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__text_6kufndem2v", "qti"."__text_3adwbksayk" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_id", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."id_binding", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."idref_target", "qti__author"."inclusion", "qti__author"."instance", "qti__author"."instance_name", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."item_ref_target", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_document", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" FROM "qti__author";

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

REVOKE EXECUTE ON FUNCTION "qti"."__constant_uij2fonltq"(), "qti"."__constant_bkqh2friwv"(), "qti"."__constant_eo4djco6b4"(), "qti"."__constant_sx2lr4try3"(), "qti"."__constant_u7eltifwnk"(), "qti"."__constant_7v2rmkfszl"(), "qti"."__constant_waek7atehx"(), "qti"."__constant_nhyhb5mvr7"(), "qti"."__constant_ibiapjhixk"(), "qti"."__constant_cc6vlqxc5e"(), "qti"."__constant_milnmhezry"(), "qti"."__constant_caimmsgsgb"(), "qti"."__constant_2ydzf24l25"(), "qti"."__constant_m6cittd2yd"(), "qti"."__constant_cowgjzeorq"(), "qti"."__constant_hmibfx5gyk"(), "qti"."__constant_wm5pnshcyf"(), "qti"."__constant_ncvuf24xxr"(), "qti"."__constant_ykvwltiwpp"(), "qti"."__constant_f33slecxe4"(), "qti"."__constant_wzcsm5lgek"(), "qti"."__constant_npu4wt2fbp"(), "qti"."__constant_yegly32ojt"(), "qti"."__constant_gnajygigus"(), "qti"."__constant_3t4qepe5jn"(), "qti"."__constant_5kz6ofzblb"(), "qti"."__constant_ct2vnrdq7e"(), "qti"."__constant_xjuxnqukjv"(), "qti"."__constant_eqtu3e3bf7"(), "qti"."__constant_4okg7vcxht"(), "qti"."__constant_bnroidxvkl"(), "qti"."__constant_42zaiy3pw4"(), "qti"."__constant_whaydjeagy"(), "qti"."__constant_nzkmx3la3e"(), "qti"."__constant_lt7r7r6eus"(), "qti"."__constant_qkqwephi2j"(), "qti"."__constant_sqmzlmgx7q"(), "qti"."__constant_7ayqtsnyfr"(), "qti"."__constant_oazju5gsln"(), "qti"."__constant_kpxfwusb6s"(), "qti"."__constant_sj4gtqwjvu"(), "qti"."__constant_inwmcukoes"(), "qti"."__constant_qlb2jx4hhv"(), "qti"."__constant_m7gdtnppww"(), "qti"."__constant_exnqxdg5si"(), "qti"."__constant_wrlwssqvsp"(), "qti"."__constant_dhxmsn4rkd"(), "qti"."__constant_5vczbwx7y7"(), "qti"."__constant_p5oxaznp4j"(), "qti"."__constant_fgsupcpxgj"(), "qti"."__constant_samvsv5x3m"(), "qti"."__constant_ibvgt6pxwh"(), "qti"."__constant_6pgyw625sv"(), "qti"."__constant_qvvxi5pvxk"(), "qti"."__constant_2orzvrv6ut"(), "qti"."__constant_h5f56cbmgk"(), "qti"."__constant_wvtqnkiky3"(), "qti"."__constant_47ksumromp"(), "qti"."__constant_5pcz6dyjzi"(), "qti"."__constant_cy4erml7fi"(), "qti"."__constant_3lx4yzmo77"(), "qti"."__constant_6f44bj6f5z"(), "qti"."__constant_ter3l763yp"(), "qti"."__constant_ftz6h5paqe"(), "qti"."__constant_przq27rlwm"(), "qti"."__constant_qrfq2g4hkz"(), "qti"."__constant_ogqwerfjhc"(), "qti"."__constant_2spvsmpumv"(), "qti"."__constant_5r3at22xvz"(), "qti"."__constant_zqmhcyzcur"(), "qti"."__constant_aprps52eby"(), "qti"."__constant_ahddjwrhv5"(), "qti"."__constant_k3fjlwxuwn"(), "qti"."__constant_iz4l44v4pt"(), "qti"."__constant_ctf72alvlj"(), "qti"."__constant_xvmgsamjvy"(), "qti"."__constant_bxvzcve5q4"(), "qti"."__constant_jl3vjp3onh"(), "qti"."__constant_5qe5tzd65n"(), "qti"."__constant_p4pvfhuaqm"(), "qti"."__constant_lliww2nzpo"(), "qti"."__constant_adakh3kbth"(), "qti"."__constant_gf6he576t3"(), "qti"."__constant_iksi4cbdex"(), "qti"."__constant_jgtq6vvihi"(), "qti"."__constant_fsmfviu65m"(), "qti"."__constant_kb2tdexlqu"(), "qti"."__constant_wvuca46fcu"(), "qti"."__constant_nfgjamc5xd"(), "qti"."__constant_dj7xbg6izu"(), "qti"."__constant_ho6c7gpjo3"(), "qti"."__constant_ma2si6ukdt"(), "qti"."__constant_ejkw66w2je"(), "qti"."__constant_sl65lnozn2"(), "qti"."__constant_66i4fjuv6n"(), "qti"."__constant_vjkzvvaevx"(), "qti"."__constant_otpfpakmgn"(), "qti"."__constant_sszsm5lf66"(), "qti"."__constant_p2xwmlesaa"(), "qti"."__constant_uwvfzil5rh"(), "qti"."__constant_eizgu7rgqp"(), "qti"."__constant_fccrluys3c"(), "qti"."__constant_w4tawmrghr"(), "qti"."__constant_hh7nvhrixk"(), "qti"."__constant_j6uos7o7iw"(), "qti"."__constant_gazfxeallk"(), "qti"."__constant_7puc5uc6kh"(), "qti"."__constant_wekhard5xm"(), "qti"."__constant_6iey4mkmde"(), "qti"."__constant_3fecx3moff"(), "qti"."__constant_zkhfdh2gmj"(), "qti"."__constant_wozychch32"(), "qti"."__constant_zaaxobzkyx"(), "qti"."__constant_is5pk7lyfr"(), "qti"."__constant_gbvdw5papk"(), "qti"."__constant_6l2ttocydo"(), "qti"."__constant_levw2mwpwa"(), "qti"."__constant_mzggfsj72d"(), "qti"."__constant_ql3gyxgbvc"(), "qti"."__constant_4v2z57igsj"(), "qti"."__constant_sn5ucr2eat"(), "qti"."__constant_3bgu23uy42"(), "qti"."__constant_uynctp5wdx"(), "qti"."__constant_sjctib2m6a"(), "qti"."__constant_uav4xy4p5a"(), "qti"."__constant_folbw276p3"(), "qti"."__constant_dc7u4pz4ga"(), "qti"."__constant_nccth24rmg"(), "qti"."__constant_wn244xqmvq"(), "qti"."__constant_rwijlqnagg"(), "qti"."__constant_n4gntw4ty5"(), "qti"."__constant_aiwrmlshlf"(), "qti"."__constant_g3bd4eyobi"(), "qti"."__constant_zkaa5w3gb2"(), "qti"."__align_direction_names_vluq7iazdg"(), "qti"."__align_state_names_ffk37slxn3"(), "qti"."__attribute_model_names_d7ufmii6j2"(), "qti"."__attribute_name_names_q6tmzcty4e"(), "qti"."__attribute_slot_names_4r5l4mp24z"(), "qti"."__base_type_names_ok3nu5nck4"(), "qti"."__bound_facet_names_b7dbsbn4iu"(), "qti"."__bound_zero_names_2iyjgurtgw"(), "qti"."__built_in_names_qkzs4cgupe"(), "qti"."__cardinality_names_kqiairsoqa"(), "qti"."__cn_base_names_2wtzhyubck"(), "qti"."__cn_part_names_6db2fcgfhy"(), "qti"."__cn_part_form_names_te7u7jycdu"(), "qti"."__cn_type_names_wmjelllvhg"(), "qti"."__content_model_names_elvi5jdup4"(), "qti"."__declaration_kind_names_o62wpad2p7"(), "qti"."__domain_primitive_names_2yihitx2to"(), "qti"."__flag_names_dttyznb5cw"(), "qti"."__governor_names_d7jfyla3na"(), "qti"."__href_scope_names_y4pbuo4f5q"(), "qti"."__identity_names_rrxxe77wjj"(), "qti"."__include_parent_names_fixlnrxa4e"(), "qti"."__language_names_pvmtywwssv"(), "qti"."__node_kind_names_ulbko553n7"(), "qti"."__position_names_sglcn7ygpg"(), "qti"."__reading_form_names_tbdimwd3yh"(), "qti"."__reading_source_names_d5b4pcfzkz"(), "qti"."__reference_form_names_ktgko5k4l4"(), "qti"."__reference_resolution_names_3knvypuotm"(), "qti"."__reference_role_names_ce5jhrrzsl"(), "qti"."__reference_spelling_names_gocqpuf7tl"(), "qti"."__referenced_table_names_ynujnwu6bv"(), "qti"."__resource_type_names_iatibe6omc"(), "qti"."__rounding_holds_names_6j2zaayymp"(), "qti"."__rp_template_names_tkkjkmwhuf"(), "qti"."__schema_version_names_p2hfvbhu24"(), "qti"."__shared_model_names_3ekiicw54j"(), "qti"."__type_name_names_nykiaxxd3n"(), "qti"."__use_names_vmbq6fav2t"(), "qti"."__value_base_names_pjzlcpdwvv"(), "qti"."__value_cardinality_names_wzwznoycgf"(), "qti"."__value_domain_names_tb7etzpdol"(), "qti"."__xml_standalone_names_psf7bszcug"(), "qti"."__attribute_name_live_7ot3c4gfh5"(), "qti"."__attribute_slot_live_g5haf24jp3"(), "qti"."__flag_live_egdpt3c4t6"(), "qti"."__node_kind_live_rds6vphboo"(), "qti"."__position_live_uvhnssun3f"(), "qti"."__value_base_live_trk5bm7ra5"(), "qti"."__value_cardinality_live_qbccqbzssx"() FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."__flag_bits_12_i4uhexylc4", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."__domain_gfw43vigph", "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."attribute_slot", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."position", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."value_cardinality", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_xj3zno7u3h", "qti"."__text_7nkeqry66t", "qti"."__text_c6iptmtj2x", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_gke7uypkov", "qti"."__text_htajwmyatt", "qti"."__text_mqbstvk5ay", "qti"."__text_d7mwmflg4k", "qti"."__text_l7nqeazg5h", "qti"."__text_k5kwygzatl", "qti"."__text_7dfilirtp3", "qti"."__text_xisvziygi3", "qti"."__text_7j6kgluyjp", "qti"."__text_xey6ryorh5", "qti"."__text_n4nva7wrgk", "qti"."__text_pwaizaq6lx", "qti"."__text_psn65t7m7e", "qti"."__text_hdc6mvcrgm", "qti"."__text_23rzixl3a2", "qti"."__text_mpc5fvfrbl", "qti"."__text_qvake6vbfh", "qti"."__text_zij47sgley", "qti"."__text_piekqyt5fn", "qti"."__text_fgve4r33vj", "qti"."__text_5xaumrdzw7", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__text_6kufndem2v", "qti"."__text_3adwbksayk" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_identifier", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_id", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."gap_interaction", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."id_binding", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."idref_target", "qti__author"."inclusion", "qti__author"."instance", "qti__author"."instance_name", "qti__author"."interaction", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."item_ref_target", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."node", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site", "qti__author"."site_path", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_document", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" TO "qti__author";

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

GRANT EXECUTE ON FUNCTION "qti"."__constant_uij2fonltq"(), "qti"."__constant_bkqh2friwv"(), "qti"."__constant_eo4djco6b4"(), "qti"."__constant_sx2lr4try3"(), "qti"."__constant_u7eltifwnk"(), "qti"."__constant_7v2rmkfszl"(), "qti"."__constant_waek7atehx"(), "qti"."__constant_nhyhb5mvr7"(), "qti"."__constant_ibiapjhixk"(), "qti"."__constant_cc6vlqxc5e"(), "qti"."__constant_milnmhezry"(), "qti"."__constant_caimmsgsgb"(), "qti"."__constant_2ydzf24l25"(), "qti"."__constant_m6cittd2yd"(), "qti"."__constant_cowgjzeorq"(), "qti"."__constant_hmibfx5gyk"(), "qti"."__constant_wm5pnshcyf"(), "qti"."__constant_ncvuf24xxr"(), "qti"."__constant_ykvwltiwpp"(), "qti"."__constant_f33slecxe4"(), "qti"."__constant_wzcsm5lgek"(), "qti"."__constant_npu4wt2fbp"(), "qti"."__constant_yegly32ojt"(), "qti"."__constant_gnajygigus"(), "qti"."__constant_3t4qepe5jn"(), "qti"."__constant_5kz6ofzblb"(), "qti"."__constant_ct2vnrdq7e"(), "qti"."__constant_xjuxnqukjv"(), "qti"."__constant_5ykzxdvynm"(), "qti"."__constant_eqtu3e3bf7"(), "qti"."__constant_4okg7vcxht"(), "qti"."__constant_bnroidxvkl"(), "qti"."__constant_42zaiy3pw4"(), "qti"."__constant_whaydjeagy"(), "qti"."__constant_nzkmx3la3e"(), "qti"."__constant_lt7r7r6eus"(), "qti"."__constant_qkqwephi2j"(), "qti"."__constant_sqmzlmgx7q"(), "qti"."__constant_7ayqtsnyfr"(), "qti"."__constant_oazju5gsln"(), "qti"."__constant_kpxfwusb6s"(), "qti"."__constant_sj4gtqwjvu"(), "qti"."__constant_inwmcukoes"(), "qti"."__constant_qlb2jx4hhv"(), "qti"."__constant_m7gdtnppww"(), "qti"."__constant_exnqxdg5si"(), "qti"."__constant_wrlwssqvsp"(), "qti"."__constant_dhxmsn4rkd"(), "qti"."__constant_5vczbwx7y7"(), "qti"."__constant_p5oxaznp4j"(), "qti"."__constant_fgsupcpxgj"(), "qti"."__constant_samvsv5x3m"(), "qti"."__constant_ibvgt6pxwh"(), "qti"."__constant_6pgyw625sv"(), "qti"."__constant_qvvxi5pvxk"(), "qti"."__constant_2orzvrv6ut"(), "qti"."__constant_h5f56cbmgk"(), "qti"."__constant_wvtqnkiky3"(), "qti"."__constant_47ksumromp"(), "qti"."__constant_5pcz6dyjzi"(), "qti"."__constant_cy4erml7fi"(), "qti"."__constant_3lx4yzmo77"(), "qti"."__constant_6f44bj6f5z"(), "qti"."__constant_ter3l763yp"(), "qti"."__constant_ftz6h5paqe"(), "qti"."__constant_przq27rlwm"(), "qti"."__constant_qrfq2g4hkz"(), "qti"."__constant_ogqwerfjhc"(), "qti"."__constant_2spvsmpumv"(), "qti"."__constant_5r3at22xvz"(), "qti"."__constant_zqmhcyzcur"(), "qti"."__constant_aprps52eby"(), "qti"."__constant_ahddjwrhv5"(), "qti"."__constant_k3fjlwxuwn"(), "qti"."__constant_iz4l44v4pt"(), "qti"."__constant_ctf72alvlj"(), "qti"."__constant_xvmgsamjvy"(), "qti"."__constant_bxvzcve5q4"(), "qti"."__constant_jl3vjp3onh"(), "qti"."__constant_5qe5tzd65n"(), "qti"."__constant_p4pvfhuaqm"(), "qti"."__constant_lliww2nzpo"(), "qti"."__constant_adakh3kbth"(), "qti"."__constant_gf6he576t3"(), "qti"."__constant_iksi4cbdex"(), "qti"."__constant_jgtq6vvihi"(), "qti"."__constant_fsmfviu65m"(), "qti"."__constant_kb2tdexlqu"(), "qti"."__constant_wvuca46fcu"(), "qti"."__constant_nfgjamc5xd"(), "qti"."__constant_dj7xbg6izu"(), "qti"."__constant_ho6c7gpjo3"(), "qti"."__constant_ma2si6ukdt"(), "qti"."__constant_ejkw66w2je"(), "qti"."__constant_sl65lnozn2"(), "qti"."__constant_66i4fjuv6n"(), "qti"."__constant_vjkzvvaevx"(), "qti"."__constant_otpfpakmgn"(), "qti"."__constant_sszsm5lf66"(), "qti"."__constant_p2xwmlesaa"(), "qti"."__constant_uwvfzil5rh"(), "qti"."__constant_eizgu7rgqp"(), "qti"."__constant_fccrluys3c"(), "qti"."__constant_w4tawmrghr"(), "qti"."__constant_hh7nvhrixk"(), "qti"."__constant_j6uos7o7iw"(), "qti"."__constant_gazfxeallk"(), "qti"."__constant_7puc5uc6kh"(), "qti"."__constant_wekhard5xm"(), "qti"."__constant_6iey4mkmde"(), "qti"."__constant_3fecx3moff"(), "qti"."__constant_zkhfdh2gmj"(), "qti"."__constant_wozychch32"(), "qti"."__constant_is5pk7lyfr"(), "qti"."__constant_gbvdw5papk"(), "qti"."__constant_6l2ttocydo"(), "qti"."__constant_levw2mwpwa"(), "qti"."__constant_mzggfsj72d"(), "qti"."__constant_ql3gyxgbvc"(), "qti"."__constant_4v2z57igsj"(), "qti"."__constant_sn5ucr2eat"(), "qti"."__constant_3bgu23uy42"(), "qti"."__constant_uynctp5wdx"(), "qti"."__constant_sjctib2m6a"(), "qti"."__constant_uav4xy4p5a"(), "qti"."__constant_folbw276p3"(), "qti"."__constant_dc7u4pz4ga"(), "qti"."__constant_nccth24rmg"(), "qti"."__constant_wn244xqmvq"(), "qti"."__constant_rwijlqnagg"(), "qti"."__constant_n4gntw4ty5"(), "qti"."__constant_aiwrmlshlf"(), "qti"."__constant_g3bd4eyobi"(), "qti"."__constant_zkaa5w3gb2"(), "qti"."__align_direction_names_vluq7iazdg"(), "qti"."__align_state_names_ffk37slxn3"(), "qti"."__attribute_model_names_d7ufmii6j2"(), "qti"."__attribute_name_names_q6tmzcty4e"(), "qti"."__attribute_slot_names_4r5l4mp24z"(), "qti"."__base_type_names_ok3nu5nck4"(), "qti"."__bound_facet_names_b7dbsbn4iu"(), "qti"."__bound_zero_names_2iyjgurtgw"(), "qti"."__built_in_names_qkzs4cgupe"(), "qti"."__cardinality_names_kqiairsoqa"(), "qti"."__cn_base_names_2wtzhyubck"(), "qti"."__cn_part_names_6db2fcgfhy"(), "qti"."__cn_part_form_names_te7u7jycdu"(), "qti"."__cn_type_names_wmjelllvhg"(), "qti"."__content_model_names_elvi5jdup4"(), "qti"."__declaration_kind_names_o62wpad2p7"(), "qti"."__domain_primitive_names_2yihitx2to"(), "qti"."__flag_names_dttyznb5cw"(), "qti"."__governor_names_d7jfyla3na"(), "qti"."__href_scope_names_y4pbuo4f5q"(), "qti"."__identity_names_rrxxe77wjj"(), "qti"."__include_parent_names_fixlnrxa4e"(), "qti"."__language_names_pvmtywwssv"(), "qti"."__node_kind_names_ulbko553n7"(), "qti"."__position_names_sglcn7ygpg"(), "qti"."__reading_form_names_tbdimwd3yh"(), "qti"."__reading_source_names_d5b4pcfzkz"(), "qti"."__reference_form_names_ktgko5k4l4"(), "qti"."__reference_resolution_names_3knvypuotm"(), "qti"."__reference_role_names_ce5jhrrzsl"(), "qti"."__reference_spelling_names_gocqpuf7tl"(), "qti"."__referenced_table_names_ynujnwu6bv"(), "qti"."__resource_type_names_iatibe6omc"(), "qti"."__rounding_holds_names_6j2zaayymp"(), "qti"."__rp_template_names_tkkjkmwhuf"(), "qti"."__schema_version_names_p2hfvbhu24"(), "qti"."__shared_model_names_3ekiicw54j"(), "qti"."__type_name_names_nykiaxxd3n"(), "qti"."__use_names_vmbq6fav2t"(), "qti"."__value_base_names_pjzlcpdwvv"(), "qti"."__value_cardinality_names_wzwznoycgf"(), "qti"."__value_domain_names_tb7etzpdol"(), "qti"."__xml_standalone_names_psf7bszcug"(), "qti"."__attribute_name_live_7ot3c4gfh5"(), "qti"."__attribute_slot_live_g5haf24jp3"(), "qti"."__flag_live_egdpt3c4t6"(), "qti"."__node_kind_live_rds6vphboo"(), "qti"."__position_live_uvhnssun3f"(), "qti"."__value_base_live_trk5bm7ra5"(), "qti"."__value_cardinality_live_qbccqbzssx"() TO "qti__author";

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."area_mapping", "qti"."area_mapping_cardinality", "qti"."aria_element", "qti"."aria_range", "qti"."aria_value", "qti"."assembled_catalog", "qti"."assembled_id", "qti"."assembled_lang", "qti"."assembled_name", "qti"."assembled_reference", "qti"."assessment_object", "qti"."attribute", "qti"."attribute_entity", "qti"."binding", "qti"."binding_base_type", "qti"."binding_cardinality", "qti"."binding_declaration", "qti"."binding_name", "qti"."body_xml_lang", "qti"."bound_variable", "qti"."branch_resolution", "qti"."branch_rule", "qti"."branch_shuffle", "qti"."branch_target", "qti"."card_support", "qti"."catalog_id", "qti"."catalog_ref", "qti"."catalog_scope", "qti"."catalog_target", "qti"."cell_headers", "qti"."cell_leaf", "qti"."choice", "qti"."choice_interaction", "qti"."choice_variable_name", "qti"."cn_attribute", "qti"."cn_count", "qti"."cn_part_text", "qti"."cn_slot", "qti"."comment", "qti"."context_ref", "qti"."context_ref_declaration", "qti"."count_bound", "qti"."count_range", "qti"."declaration", "qti"."declaration_base_type", "qti"."declaration_cardinality", "qti"."declaration_identifier", "qti"."declaration_name", "qti"."declaration_table", "qti"."default_entry", "qti"."dependency", "qti"."dependency_target", "qti"."doctype", "qti"."document", "qti"."document_generals", "qti"."document_id", "qti"."document_lang", "qti"."double_value", "qti"."encoding_decl", "qti"."entry", "qti"."expression", "qti"."expression_attribute", "qti"."feedback_ref", "qti"."feedback_ref_cardinality", "qti"."feedback_ref_declaration", "qti"."field_value", "qti"."file", "qti"."file_href", "qti"."fragment_value", "qti"."gap_interaction", "qti"."general_lang", "qti"."general_named", "qti"."general_object", "qti"."header_token", "qti"."held_type", "qti"."hotspot", "qti"."hottext", "qti"."id_binding", "qti"."identity_text", "qti"."idref", "qti"."idref_target", "qti"."inclusion", "qti"."instance", "qti"."instance_name", "qti"."interaction", "qti"."interaction_attribute", "qti"."item_mode", "qti"."item_ref_document", "qti"."item_ref_target", "qti"."label_use", "qti"."least_count", "qti"."literal", "qti"."literal_typed", "qti"."lom_entry", "qti"."lom_general", "qti"."lom_language", "qti"."lom_object", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_record", "qti"."lom_resource", "qti"."lom_resource_type", "qti"."lom_resource_type_source", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_title", "qti"."lom_title_string", "qti"."lookup_table", "qti"."lookup_table_cardinality", "qti"."lookup_value", "qti"."lookup_value_type", "qti"."manifest_id", "qti"."manifest_id_space", "qti"."map_key", "qti"."map_key_directed_pair", "qti"."map_key_float", "qti"."map_key_integer", "qti"."map_key_pair", "qti"."map_key_point", "qti"."map_key_type", "qti"."mapping", "qti"."mapping_base_type", "qti"."mapping_cardinality", "qti"."mapping_item_ref", "qti"."mapping_item_ref_type", "qti"."mapping_lookup", "qti"."mapping_source_declaration", "qti"."mastery_ceiling", "qti"."mastery_floor", "qti"."mastery_value", "qti"."math_action", "qti"."math_align_group", "qti"."math_align_scope", "qti"."math_apply", "qti"."math_argument", "qti"."math_cell", "qti"."math_cn", "qti"."math_dir", "qti"."math_qualifier", "qti"."math_rank", "qti"."most_count", "qti"."name_lookup", "qti"."named", "qti"."named_href", "qti"."namespace", "qti"."node", "qti"."normal_maximum", "qti"."normal_minimum", "qti"."object_identifier", "qti"."object_lang", "qti"."object_title", "qti"."open_attribute_name", "qti"."open_element_name", "qti"."operand", "qti"."package", "qti"."pci_module_form", "qti"."pi", "qti"."placed_binding", "qti"."placed_binding_base_type", "qti"."placed_binding_cardinality", "qti"."placed_binding_declaration", "qti"."placed_body_xml_lang", "qti"."placed_catalog_ref", "qti"."placed_choice", "qti"."placed_document", "qti"."placed_general_lang", "qti"."placed_hottext", "qti"."placed_id", "qti"."placed_idref", "qti"."placed_math_rank", "qti"."placed_reference", "qti"."placed_share_target", "qti"."placed_variable_ref", "qti"."placed_variable_ref_declaration", "qti"."placed_xml_lang", "qti"."printed_variable_ref", "qti"."printed_variable_ref_declaration", "qti"."processing", "qti"."processing_template", "qti"."quotation", "qti"."reading", "qti"."reading_cardinality", "qti"."record_field", "qti"."record_field_name", "qti"."reference", "qti"."reference_document", "qti"."reference_path", "qti"."reference_segment", "qti"."referring_document", "qti"."resource", "qti"."resource_file", "qti"."resource_href", "qti"."resource_id", "qti"."resource_lom_general", "qti"."resource_lom_language_set", "qti"."resource_typed", "qti"."rounding", "qti"."rounding_figures", "qti"."rounding_mode", "qti"."rounding_mode_figures", "qti"."sd_decl", "qti"."section", "qti"."section_context_name", "qti"."section_context_ref", "qti"."section_context_ref_declaration", "qti"."section_feedback_name", "qti"."section_feedback_ref", "qti"."section_feedback_ref_cardinality", "qti"."section_feedback_ref_declaration", "qti"."section_identifier", "qti"."section_member", "qti"."section_ordering", "qti"."section_printed_name", "qti"."section_printed_ref", "qti"."section_printed_ref_declaration", "qti"."section_scope", "qti"."section_selection", "qti"."section_template_name", "qti"."section_template_ref", "qti"."section_template_ref_cardinality", "qti"."section_template_ref_declaration", "qti"."share_fragment", "qti"."share_target", "qti"."site", "qti"."site_path", "qti"."site_target", "qti"."slider", "qti"."ssml_attribute", "qti"."ssml_scope", "qti"."statistic_date", "qti"."stimulus_ref", "qti"."table_header", "qti"."table_scope", "qti"."template_default", "qti"."template_default_cardinality", "qti"."template_default_target", "qti"."template_ref", "qti"."template_ref_cardinality", "qti"."template_ref_declaration", "qti"."test_document", "qti"."test_flag", "qti"."test_reference", "qti"."test_token", "qti"."text_double_value", "qti"."text_idref", "qti"."text_reference", "qti"."text_reference_path", "qti"."tolerance", "qti"."tolerance_token", "qti"."typed_href", "qti"."typed_value", "qti"."usage_base_type", "qti"."usage_value", "qti"."usage_value_base_type", "qti"."value", "qti"."value_base_type", "qti"."value_set", "qti"."value_set_cardinality", "qti"."variable_lookup", "qti"."variable_mapping", "qti"."variable_ref", "qti"."variable_ref_cardinality", "qti"."variable_ref_declaration", "qti"."xml_decl", "qti"."xml_lang", "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_identifier", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_id", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."gap_interaction", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."id_binding", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."idref_target", "qti__author"."inclusion", "qti__author"."instance", "qti__author"."instance_name", "qti__author"."interaction", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."item_ref_target", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."node", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site", "qti__author"."site_path", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_document", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."__attribute_name_bits_416_thr6i6sipt", "qti"."attribute_slot", "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."__flag_bits_12_i4uhexylc4", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."__node_kind_bits_644_kcdmigfwqm", "qti"."position", "qti"."__position_bits_308_gsnowf36kr", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."value_cardinality", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_pwaizaq6lx", "qti"."__text_c6iptmtj2x", "qti"."__text_5xaumrdzw7", "qti"."__text_xj3zno7u3h", "qti"."__text_7j6kgluyjp", "qti"."__text_7dfilirtp3", "qti"."__text_l7nqeazg5h", "qti"."__text_xey6ryorh5", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_7nkeqry66t", "qti"."__text_6kufndem2v", "qti"."__text_htajwmyatt", "qti"."__text_qvake6vbfh", "qti"."__text_n4nva7wrgk", "qti"."__text_hdc6mvcrgm", "qti"."__text_zij47sgley", "qti"."__text_gke7uypkov", "qti"."__text_d7mwmflg4k", "qti"."__text_piekqyt5fn", "qti"."__text_mpc5fvfrbl", "qti"."__text_fgve4r33vj", "qti"."__text_23rzixl3a2", "qti"."__text_3adwbksayk", "qti"."__text_k5kwygzatl", "qti"."__text_mqbstvk5ay", "qti"."__text_xisvziygi3", "qti"."__text_psn65t7m7e", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__domain_gfw43vigph" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

DROP INDEX "qti"."__site_ix_node_csw_7_mjednz_cttlprwr4k";

ALTER TABLE "qti"."site" DROP COLUMN "__node_csw7mjednz";

DROP FUNCTION "qti"."__constant_zaaxobzkyx"() RESTRICT;

COMMENT ON FUNCTION "qti"."__constant_5ykzxdvynm"() IS 'closed constant 3a729e456c0bdb7ae314c98b155ff622805402e48173f5d2fca939c35ee352dd';

COMMENT ON CONSTRAINT "__choice_key_node_kind_tid3vkbmg6" ON "qti"."choice" IS 'key Choice(node, kind)';

COMMENT ON CONSTRAINT "__choice_interaction_key_node_interaction_lkjg3yj2vm" ON "qti"."choice_interaction" IS 'key ChoiceInteraction(node, interaction)';

COMMENT ON CONSTRAINT "__gap_interaction_pk_ddeilaek4w" ON "qti"."gap_interaction" IS 'primary key of GapInteraction';

COMMENT ON CONSTRAINT "__interaction_key_node_gaps_ifbiyhopan" ON "qti"."interaction" IS 'key Interaction(node, gaps)';

COMMENT ON COLUMN "qti"."choice"."__node_zseimxjpkj" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-gap"}}';

COMMENT ON COLUMN "qti"."gap_interaction"."__tag_kind_qti_gap_baeu5x2oxw" IS 'tag Choice.kind = qti-gap';

COMMENT ON COLUMN "qti"."gap_interaction"."__copy_gaps_c4fz6tnntk" IS 'the owner''s count of the family Interaction.gaps';

COMMENT ON COLUMN "qti"."gap_interaction"."__index_gaps_2gptltxoml" IS 'the index of the family Interaction.gaps';

COMMENT ON COLUMN "qti"."gap_interaction"."__predecessor_gaps_affttpxmpt" IS 'the predecessor of the index of the family Interaction.gaps';

COMMENT ON COLUMN "qti"."interaction"."__pred_gaps_eoqczpbhjr" IS 'pred(gaps)';

COMMENT ON COLUMN "qti"."site"."__node_ivjo2r5kcj" IS 'node where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-section-ref"}}';

COMMENT ON CONSTRAINT "__gap_interaction_key_interaction_index_gaps_7w7be5brqj" ON "qti"."gap_interaction" IS 'key GapInteraction(interaction, the index of the family Interaction.gaps)';

COMMENT ON CONSTRAINT "__gap_interaction_check_gap_interaction_counted_4i4dola6mi" ON "qti"."gap_interaction" IS 'check of GapInteraction for law counted GapInteraction(interaction) in fin(Interaction, gaps)';

COMMENT ON CONSTRAINT "__binding_cardinality_fk_node_gaps_i5bmzuqj7l" ON "qti"."binding_cardinality" IS 'foreign key BindingCardinality(node, gaps) to Interaction(node, gaps)';

COMMENT ON CONSTRAINT "__choice_fk_node_rjik7irfe4" ON "qti"."choice" IS 'foreign key Choice(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-gap"}}) to GapInteraction(node)';

COMMENT ON CONSTRAINT "__gap_interaction_fk_interaction_copy_gaps_cenkgsun2m" ON "qti"."gap_interaction" IS 'foreign key GapInteraction(interaction, the owner''s count of the family Interaction.gaps) to Interaction(node, gaps)';

COMMENT ON CONSTRAINT "__gap_interaction_fk_interaction_predecessor_gaps_arrpbh6oos" ON "qti"."gap_interaction" IS 'foreign key GapInteraction(interaction, the predecessor of the index of the family Interaction.gaps) to GapInteraction(interaction, the index of the family Interaction.gaps)';

COMMENT ON CONSTRAINT "__gap_interaction_fk_node_interaction_gnaeijqjip" ON "qti"."gap_interaction" IS 'foreign key GapInteraction(node, interaction) to ChoiceInteraction(node, interaction)';

COMMENT ON CONSTRAINT "__gap_interaction_fk_node_tag_kind_qti_gap_c7iujzxnhg" ON "qti"."gap_interaction" IS 'foreign key GapInteraction(node, tag Choice.kind = qti-gap) to Choice(node, kind)';

COMMENT ON CONSTRAINT "__interaction_fk_node_pred_gaps_qs54memcqv" ON "qti"."interaction" IS 'foreign key Interaction(node, pred(gaps)) to GapInteraction(interaction, the index of the family Interaction.gaps)';

COMMENT ON CONSTRAINT "__placed_binding_cardinality_fk_node_gaps_qwmi5za7le" ON "qti"."placed_binding_cardinality" IS 'foreign key PlacedBindingCardinality(node, gaps) to Interaction(node, gaps)';

COMMENT ON CONSTRAINT "__site_fk_node_onholp6yx7" ON "qti"."site" IS 'foreign key Site(node where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-section-ref"}}) to SitePath(node)';

COMMENT ON INDEX "qti"."__binding_cardinality_ix_node_gaps_eluuu3gpyj" IS 'btree index BindingCardinality(node, gaps)';

COMMENT ON INDEX "qti"."__choice_ix_node_zseimxjpkj_r6ugl4psth" IS 'btree index Choice(__node_zseimxjpkj)';

COMMENT ON INDEX "qti"."__placed_binding_cardinality_ix_node_gaps_gddkeypr4m" IS 'btree index PlacedBindingCardinality(node, gaps)';

COMMENT ON INDEX "qti"."__site_ix_node_ivjo_2_r_5_kcj_qcullefqon" IS 'btree index Site(__node_ivjo2r5kcj)';
