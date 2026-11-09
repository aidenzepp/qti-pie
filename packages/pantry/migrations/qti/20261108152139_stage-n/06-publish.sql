SELECT "r1"."c1"::"qti"."__domain_gfw43vigph" AS "value"
FROM (VALUES (67::bigint), (7::bigint), (6::bigint), (69::bigint), (64::bigint), (70::bigint), (63::bigint), (60::bigint), (62::bigint), (61::bigint), (4::bigint), (5::bigint), (0::bigint), (21::bigint), (66::bigint), (18::bigint), (19::bigint), (14::bigint), (9::bigint), (17::bigint), (108::bigint), (20::bigint), (30::bigint), (25::bigint), (48::bigint), (27::bigint), (36::bigint), (110::bigint), (34::bigint), (16::bigint), (15::bigint), (65::bigint), (3::bigint), (12::bigint), (10::bigint), (11::bigint), (51::bigint), (74::bigint), (68::bigint), (71::bigint), (73::bigint), (8::bigint), (59::bigint), (13::bigint), (2::bigint), (1::bigint), (9223372036854775807::bigint), (28::bigint), (52::bigint), (96::bigint), (41::bigint), (97::bigint), (119::bigint), (56::bigint), (33::bigint), (121::bigint), (193::bigint), (306::bigint), (181::bigint), (117::bigint), (22::bigint), (92::bigint), (72::bigint), (45::bigint), (46::bigint), (31::bigint), (75::bigint), (50::bigint), (44::bigint), (29::bigint), (32::bigint)) AS "r1"("c1");

ALTER TABLE "qti"."xml_lang" DROP CONSTRAINT "__xml_lang_fk_document_lang_predecessor_carriers_lnzq5azioq";

ALTER TABLE "qti"."xml_lang" DROP CONSTRAINT "__xml_lang_fk_document_lang_copy_carriers_bhhzcojzi3";

ALTER TABLE "qti"."variable_mapping" DROP CONSTRAINT "__variable_mapping_fk_node_mdxvmevhuc";

ALTER TABLE "qti"."usage_value" DROP CONSTRAINT "__usage_value_fk_node_7b5n43piu2";

ALTER TABLE "qti"."site" DROP CONSTRAINT "__site_fk_node_kind_eqwitxgnr5";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_fk_named_variable_declaration_declaration_pnxboz4ljw";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_fk_declaration_tag_value_base_string_s73pzx7f7q";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_fk_declaration_tag_value_base_float_deai6w6tvv";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_fk_declaration_tag_value_base_integer_fdqktytcgc";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_fk_assembly_node_attribute_form_split_5ezcmu5stm";

ALTER TABLE "qti"."placed_xml_lang" DROP CONSTRAINT "__placed_xml_lang_fk_node_document_lang_2bufdouprd";

ALTER TABLE "qti"."placed_xml_lang" DROP CONSTRAINT "__placed_xml_lang_fk_assembly_lang_predecessor_oy3ce5dh5n";

ALTER TABLE "qti"."placed_xml_lang" DROP CONSTRAINT "__placed_xml_lang_fk_assembly_lang_copy_carriers_pzxtpshs2c";

ALTER TABLE "qti"."open_attribute_name" DROP CONSTRAINT "__open_attribute_name_fk_node_attribute_copy_open_mt3enuiuif";

ALTER TABLE "qti"."document_lang" DROP CONSTRAINT "__document_lang_fk_document_lang_pred_carriers_vqwqswn5hm";

ALTER TABLE "qti"."declaration_identifier" DROP CONSTRAINT "__declaration_identifier_fk_node_tag_base_type_float_ndw6sn2vz3";

ALTER TABLE "qti"."declaration_identifier" DROP CONSTRAINT "__declaration_identifier_fk_node_tag_base_type_float_ty5llbxyka";

ALTER TABLE "qti"."attribute" DROP CONSTRAINT "__attribute_fk_node_lexical_67fp77j4kc";

ALTER TABLE "qti"."assembled_reference" DROP CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_mxtmucsreg";

ALTER TABLE "qti"."assembled_reference" DROP CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_en73gfwkcy";

ALTER TABLE "qti"."assembled_lang" DROP CONSTRAINT "__assembled_lang_fk_assembly_lang_pred_carriers_44tbj24pdh";

ALTER TABLE "qti"."xml_lang" DROP CONSTRAINT "__xml_lang_check_xml_lang_counted_document_lang_uwnb5y36r3";

ALTER TABLE "qti"."usage_value" DROP CONSTRAINT "usage_typed_value";

ALTER TABLE "qti"."usage_value" DROP CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_check_reading_form_kind_form_number_ypoeobnpdw";

ALTER TABLE "qti"."placed_xml_lang" DROP CONSTRAINT "__placed_xml_lang_check_placed_xml_lang_counted_yfsb4jl5tz";

ALTER TABLE "qti"."node" DROP CONSTRAINT "__node_check_node_children_concat_fold_mvrosu2txh";

ALTER TABLE "qti"."xml_lang" DROP CONSTRAINT "__xml_lang_key_document_lang_index_carriers_lrprz7m27i";

ALTER TABLE "qti"."usage_value" DROP CONSTRAINT "__usage_value_key_node_base_type_lexical_zvc3uclqve";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_key_assembly_node_attribute_kind_53zhel5qei";

ALTER TABLE "qti"."reading" DROP CONSTRAINT "__reading_key_assembly_node_attribute_q5ipurbl3b";

ALTER TABLE "qti"."placed_xml_lang" DROP CONSTRAINT "__placed_xml_lang_key_assembly_lang_index_carriers_dfdnkw43pv";

ALTER TABLE "qti"."attribute" DROP CONSTRAINT "__attribute_key_node_id_open_name_kind_name_td4lputblr";

REVOKE USAGE ON SCHEMA "qti", "qti__author" FROM "qti__author";

REVOKE USAGE ON DOMAIN "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."__flag_bits_12_i4uhexylc4", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."__domain_gfw43vigph", "qti"."attribute_model", "qti"."attribute_name", "qti"."attribute_slot", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."position", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."value_cardinality", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_xj3zno7u3h", "qti"."__text_7nkeqry66t", "qti"."__text_c6iptmtj2x", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_gke7uypkov", "qti"."__text_htajwmyatt", "qti"."__text_mqbstvk5ay", "qti"."__text_d7mwmflg4k", "qti"."__text_l7nqeazg5h", "qti"."__text_k5kwygzatl", "qti"."__text_7dfilirtp3", "qti"."__text_xisvziygi3", "qti"."__text_7j6kgluyjp", "qti"."__text_xey6ryorh5", "qti"."__text_n4nva7wrgk", "qti"."__text_pwaizaq6lx", "qti"."__text_psn65t7m7e", "qti"."__text_hdc6mvcrgm", "qti"."__text_23rzixl3a2", "qti"."__text_mpc5fvfrbl", "qti"."__text_qvake6vbfh", "qti"."__text_zij47sgley", "qti"."__text_piekqyt5fn", "qti"."__text_fgve4r33vj", "qti"."__text_5xaumrdzw7", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__text_6kufndem2v", "qti"."__text_3adwbksayk" FROM "qti__author";

REVOKE SELECT ON TABLE "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_name", "qti__author"."assessment_object", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."cell_headers", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document_generals", "qti__author"."encoding_decl", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."inclusion", "qti__author"."instance_name", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_lookup", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_reference", "qti__author"."placed_variable_ref_declaration", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."area_mapping_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_element" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_range" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."aria_value" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."bound_variable" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_resolution" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_rule" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_shuffle" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."branch_target" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."cell_headers" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_interaction" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."choice_variable_name" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_lookup" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mapping_source_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mastery_ceiling" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mastery_floor" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."mastery_value" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."pi" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_base_type" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_cardinality" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_binding_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_choice" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_general_lang" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_hottext" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_id" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."placed_reference" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."section_template_ref_declaration" FROM "qti__author";

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

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."template_ref_declaration" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_document" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_flag" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_reference" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."test_token" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_double_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."text_idref" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tolerance" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."tolerance_token" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_href" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."typed_value" FROM "qti__author";

REVOKE SELECT, INSERT, DELETE ON TABLE "qti"."usage_value" FROM "qti__author";

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

REVOKE EXECUTE ON FUNCTION "qti"."__constant_uij2fonltq"(), "qti"."__constant_bkqh2friwv"(), "qti"."__constant_funrvkv7qk"(), "qti"."__constant_eo4djco6b4"(), "qti"."__constant_sx2lr4try3"(), "qti"."__constant_u7eltifwnk"(), "qti"."__constant_7v2rmkfszl"(), "qti"."__constant_waek7atehx"(), "qti"."__constant_nhyhb5mvr7"(), "qti"."__constant_ibiapjhixk"(), "qti"."__constant_cc6vlqxc5e"(), "qti"."__constant_milnmhezry"(), "qti"."__constant_caimmsgsgb"(), "qti"."__constant_houcq2agm5"(), "qti"."__constant_2ydzf24l25"(), "qti"."__constant_m6cittd2yd"(), "qti"."__constant_hmibfx5gyk"(), "qti"."__constant_ncvuf24xxr"(), "qti"."__constant_f33slecxe4"(), "qti"."__constant_7cotpgn6zy"(), "qti"."__constant_wzcsm5lgek"(), "qti"."__constant_npu4wt2fbp"(), "qti"."__constant_yegly32ojt"(), "qti"."__constant_sxoibajylj"(), "qti"."__constant_gnajygigus"(), "qti"."__constant_3t4qepe5jn"(), "qti"."__constant_ct2vnrdq7e"(), "qti"."__constant_xjuxnqukjv"(), "qti"."__constant_auiifvfmod"(), "qti"."__constant_4okg7vcxht"(), "qti"."__constant_bnroidxvkl"(), "qti"."__constant_42zaiy3pw4"(), "qti"."__constant_whaydjeagy"(), "qti"."__constant_nzkmx3la3e"(), "qti"."__constant_2n7f7dydeh"(), "qti"."__constant_lt7r7r6eus"(), "qti"."__constant_sqmzlmgx7q"(), "qti"."__constant_7ayqtsnyfr"(), "qti"."__constant_se63hpre26"(), "qti"."__constant_xicwkndytl"(), "qti"."__constant_kpxfwusb6s"(), "qti"."__constant_sj4gtqwjvu"(), "qti"."__constant_qlb2jx4hhv"(), "qti"."__constant_oxqzj66dwj"(), "qti"."__constant_hhiy5ilipq"(), "qti"."__constant_hgt3yp5vit"(), "qti"."__constant_exnqxdg5si"(), "qti"."__constant_wrlwssqvsp"(), "qti"."__constant_y2o5adjpe7"(), "qti"."__constant_cfiqfp3qe2"(), "qti"."__constant_fgsupcpxgj"(), "qti"."__constant_wymj3qcfkk"(), "qti"."__constant_samvsv5x3m"(), "qti"."__constant_ibvgt6pxwh"(), "qti"."__constant_732rchrtop"(), "qti"."__constant_6pgyw625sv"(), "qti"."__constant_qvvxi5pvxk"(), "qti"."__constant_rto362yzie"(), "qti"."__constant_2orzvrv6ut"(), "qti"."__constant_h5f56cbmgk"(), "qti"."__constant_47ksumromp"(), "qti"."__constant_5pcz6dyjzi"(), "qti"."__constant_cy4erml7fi"(), "qti"."__constant_3lx4yzmo77"(), "qti"."__constant_6f44bj6f5z"(), "qti"."__constant_ter3l763yp"(), "qti"."__constant_ftz6h5paqe"(), "qti"."__constant_qrfq2g4hkz"(), "qti"."__constant_5r3at22xvz"(), "qti"."__constant_zqmhcyzcur"(), "qti"."__constant_aprps52eby"(), "qti"."__constant_cfm6vm5h63"(), "qti"."__constant_k3fjlwxuwn"(), "qti"."__constant_iz4l44v4pt"(), "qti"."__constant_xvmgsamjvy"(), "qti"."__constant_bxvzcve5q4"(), "qti"."__constant_p4pvfhuaqm"(), "qti"."__constant_gf6he576t3"(), "qti"."__constant_iksi4cbdex"(), "qti"."__constant_jgtq6vvihi"(), "qti"."__constant_fsmfviu65m"(), "qti"."__constant_kb2tdexlqu"(), "qti"."__constant_wvuca46fcu"(), "qti"."__constant_nfgjamc5xd"(), "qti"."__constant_dj7xbg6izu"(), "qti"."__constant_ho6c7gpjo3"(), "qti"."__constant_hidw3w3e7r"(), "qti"."__constant_ejkw66w2je"(), "qti"."__constant_sl65lnozn2"(), "qti"."__constant_66i4fjuv6n"(), "qti"."__constant_vjkzvvaevx"(), "qti"."__constant_dtmq6bir7l"(), "qti"."__constant_uwvfzil5rh"(), "qti"."__constant_eizgu7rgqp"(), "qti"."__constant_fccrluys3c"(), "qti"."__constant_w4tawmrghr"(), "qti"."__constant_hh7nvhrixk"(), "qti"."__constant_gazfxeallk"(), "qti"."__constant_7puc5uc6kh"(), "qti"."__constant_wekhard5xm"(), "qti"."__constant_6iey4mkmde"(), "qti"."__constant_3fecx3moff"(), "qti"."__constant_zkhfdh2gmj"(), "qti"."__constant_wozychch32"(), "qti"."__constant_zaaxobzkyx"(), "qti"."__constant_6l2ttocydo"(), "qti"."__constant_levw2mwpwa"(), "qti"."__constant_ql3gyxgbvc"(), "qti"."__constant_3bgu23uy42"(), "qti"."__constant_uynctp5wdx"(), "qti"."__constant_sjctib2m6a"(), "qti"."__constant_uav4xy4p5a"(), "qti"."__constant_dc7u4pz4ga"(), "qti"."__constant_nccth24rmg"(), "qti"."__constant_wn244xqmvq"(), "qti"."__constant_rwijlqnagg"(), "qti"."__constant_n4gntw4ty5"(), "qti"."__constant_ojybanodcv"(), "qti"."__constant_zkaa5w3gb2"(), "qti"."__attribute_model_names_d7ufmii6j2"(), "qti"."__attribute_name_names_q6tmzcty4e"(), "qti"."__attribute_slot_names_4r5l4mp24z"(), "qti"."__base_type_names_ok3nu5nck4"(), "qti"."__bound_facet_names_b7dbsbn4iu"(), "qti"."__bound_zero_names_2iyjgurtgw"(), "qti"."__built_in_names_qkzs4cgupe"(), "qti"."__cardinality_names_kqiairsoqa"(), "qti"."__content_model_names_okcie4kvo2"(), "qti"."__declaration_kind_names_o62wpad2p7"(), "qti"."__domain_primitive_names_2yihitx2to"(), "qti"."__flag_names_dttyznb5cw"(), "qti"."__governor_names_d7jfyla3na"(), "qti"."__href_scope_names_y4pbuo4f5q"(), "qti"."__identity_names_rrxxe77wjj"(), "qti"."__include_parent_names_fixlnrxa4e"(), "qti"."__language_names_pvmtywwssv"(), "qti"."__node_kind_names_ulbko553n7"(), "qti"."__position_names_sglcn7ygpg"(), "qti"."__reading_form_names_tbdimwd3yh"(), "qti"."__reading_source_names_d5b4pcfzkz"(), "qti"."__reference_form_names_ktgko5k4l4"(), "qti"."__reference_resolution_names_3knvypuotm"(), "qti"."__reference_role_names_ce5jhrrzsl"(), "qti"."__reference_spelling_names_gocqpuf7tl"(), "qti"."__referenced_table_names_ynujnwu6bv"(), "qti"."__resource_type_names_iatibe6omc"(), "qti"."__rounding_holds_names_6j2zaayymp"(), "qti"."__rp_template_names_tkkjkmwhuf"(), "qti"."__schema_version_names_p2hfvbhu24"(), "qti"."__shared_model_names_dxfaeabdhc"(), "qti"."__type_name_names_nykiaxxd3n"(), "qti"."__use_names_vmbq6fav2t"(), "qti"."__value_base_names_pjzlcpdwvv"(), "qti"."__value_cardinality_names_wzwznoycgf"(), "qti"."__value_domain_names_tb7etzpdol"(), "qti"."__xml_standalone_names_psf7bszcug"(), "qti"."__attribute_name_live_7ot3c4gfh5"(), "qti"."__attribute_slot_live_g5haf24jp3"(), "qti"."__flag_live_egdpt3c4t6"(), "qti"."__node_kind_live_rds6vphboo"(), "qti"."__position_live_uvhnssun3f"(), "qti"."__value_base_live_trk5bm7ra5"(), "qti"."__value_cardinality_live_qbccqbzssx"() FROM "qti__author";

GRANT USAGE ON SCHEMA "qti", "qti__author" TO "qti__author";

GRANT USAGE ON DOMAIN "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."__flag_bits_12_i4uhexylc4", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."__domain_gfw43vigph", "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."attribute_slot", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."position", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."value_cardinality", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_xj3zno7u3h", "qti"."__text_7nkeqry66t", "qti"."__text_c6iptmtj2x", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_gke7uypkov", "qti"."__text_htajwmyatt", "qti"."__text_mqbstvk5ay", "qti"."__text_d7mwmflg4k", "qti"."__text_l7nqeazg5h", "qti"."__text_k5kwygzatl", "qti"."__text_7dfilirtp3", "qti"."__text_xisvziygi3", "qti"."__text_7j6kgluyjp", "qti"."__text_xey6ryorh5", "qti"."__text_n4nva7wrgk", "qti"."__text_pwaizaq6lx", "qti"."__text_psn65t7m7e", "qti"."__text_hdc6mvcrgm", "qti"."__text_23rzixl3a2", "qti"."__text_mpc5fvfrbl", "qti"."__text_qvake6vbfh", "qti"."__text_zij47sgley", "qti"."__text_piekqyt5fn", "qti"."__text_fgve4r33vj", "qti"."__text_5xaumrdzw7", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__text_6kufndem2v", "qti"."__text_3adwbksayk" TO "qti__author";

GRANT SELECT ON TABLE "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_identifier", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_id", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."id_binding", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."idref_target", "qti__author"."inclusion", "qti__author"."instance", "qti__author"."instance_name", "qti__author"."interaction", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."item_ref_target", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."node", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site", "qti__author"."site_path", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_document", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" TO "qti__author";

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

GRANT EXECUTE ON FUNCTION "qti"."__constant_uij2fonltq"(), "qti"."__constant_bkqh2friwv"(), "qti"."__constant_eo4djco6b4"(), "qti"."__constant_sx2lr4try3"(), "qti"."__constant_u7eltifwnk"(), "qti"."__constant_7v2rmkfszl"(), "qti"."__constant_waek7atehx"(), "qti"."__constant_nhyhb5mvr7"(), "qti"."__constant_ibiapjhixk"(), "qti"."__constant_cc6vlqxc5e"(), "qti"."__constant_milnmhezry"(), "qti"."__constant_caimmsgsgb"(), "qti"."__constant_2ydzf24l25"(), "qti"."__constant_m6cittd2yd"(), "qti"."__constant_cowgjzeorq"(), "qti"."__constant_hmibfx5gyk"(), "qti"."__constant_wm5pnshcyf"(), "qti"."__constant_ncvuf24xxr"(), "qti"."__constant_ykvwltiwpp"(), "qti"."__constant_f33slecxe4"(), "qti"."__constant_wzcsm5lgek"(), "qti"."__constant_npu4wt2fbp"(), "qti"."__constant_yegly32ojt"(), "qti"."__constant_gnajygigus"(), "qti"."__constant_3t4qepe5jn"(), "qti"."__constant_5kz6ofzblb"(), "qti"."__constant_ct2vnrdq7e"(), "qti"."__constant_xjuxnqukjv"(), "qti"."__constant_eqtu3e3bf7"(), "qti"."__constant_4okg7vcxht"(), "qti"."__constant_bnroidxvkl"(), "qti"."__constant_42zaiy3pw4"(), "qti"."__constant_whaydjeagy"(), "qti"."__constant_nzkmx3la3e"(), "qti"."__constant_lt7r7r6eus"(), "qti"."__constant_qkqwephi2j"(), "qti"."__constant_sqmzlmgx7q"(), "qti"."__constant_7ayqtsnyfr"(), "qti"."__constant_oazju5gsln"(), "qti"."__constant_kpxfwusb6s"(), "qti"."__constant_sj4gtqwjvu"(), "qti"."__constant_inwmcukoes"(), "qti"."__constant_qlb2jx4hhv"(), "qti"."__constant_m7gdtnppww"(), "qti"."__constant_exnqxdg5si"(), "qti"."__constant_wrlwssqvsp"(), "qti"."__constant_dhxmsn4rkd"(), "qti"."__constant_5vczbwx7y7"(), "qti"."__constant_p5oxaznp4j"(), "qti"."__constant_fgsupcpxgj"(), "qti"."__constant_samvsv5x3m"(), "qti"."__constant_ibvgt6pxwh"(), "qti"."__constant_6pgyw625sv"(), "qti"."__constant_qvvxi5pvxk"(), "qti"."__constant_2orzvrv6ut"(), "qti"."__constant_h5f56cbmgk"(), "qti"."__constant_wvtqnkiky3"(), "qti"."__constant_47ksumromp"(), "qti"."__constant_5pcz6dyjzi"(), "qti"."__constant_cy4erml7fi"(), "qti"."__constant_3lx4yzmo77"(), "qti"."__constant_6f44bj6f5z"(), "qti"."__constant_ter3l763yp"(), "qti"."__constant_ftz6h5paqe"(), "qti"."__constant_przq27rlwm"(), "qti"."__constant_qrfq2g4hkz"(), "qti"."__constant_ogqwerfjhc"(), "qti"."__constant_2spvsmpumv"(), "qti"."__constant_5r3at22xvz"(), "qti"."__constant_zqmhcyzcur"(), "qti"."__constant_aprps52eby"(), "qti"."__constant_ahddjwrhv5"(), "qti"."__constant_k3fjlwxuwn"(), "qti"."__constant_iz4l44v4pt"(), "qti"."__constant_ctf72alvlj"(), "qti"."__constant_xvmgsamjvy"(), "qti"."__constant_bxvzcve5q4"(), "qti"."__constant_jl3vjp3onh"(), "qti"."__constant_5qe5tzd65n"(), "qti"."__constant_p4pvfhuaqm"(), "qti"."__constant_lliww2nzpo"(), "qti"."__constant_adakh3kbth"(), "qti"."__constant_gf6he576t3"(), "qti"."__constant_iksi4cbdex"(), "qti"."__constant_jgtq6vvihi"(), "qti"."__constant_fsmfviu65m"(), "qti"."__constant_kb2tdexlqu"(), "qti"."__constant_wvuca46fcu"(), "qti"."__constant_nfgjamc5xd"(), "qti"."__constant_dj7xbg6izu"(), "qti"."__constant_ho6c7gpjo3"(), "qti"."__constant_ma2si6ukdt"(), "qti"."__constant_ejkw66w2je"(), "qti"."__constant_sl65lnozn2"(), "qti"."__constant_66i4fjuv6n"(), "qti"."__constant_vjkzvvaevx"(), "qti"."__constant_otpfpakmgn"(), "qti"."__constant_sszsm5lf66"(), "qti"."__constant_p2xwmlesaa"(), "qti"."__constant_uwvfzil5rh"(), "qti"."__constant_eizgu7rgqp"(), "qti"."__constant_fccrluys3c"(), "qti"."__constant_w4tawmrghr"(), "qti"."__constant_hh7nvhrixk"(), "qti"."__constant_j6uos7o7iw"(), "qti"."__constant_gazfxeallk"(), "qti"."__constant_7puc5uc6kh"(), "qti"."__constant_wekhard5xm"(), "qti"."__constant_6iey4mkmde"(), "qti"."__constant_3fecx3moff"(), "qti"."__constant_zkhfdh2gmj"(), "qti"."__constant_wozychch32"(), "qti"."__constant_zaaxobzkyx"(), "qti"."__constant_is5pk7lyfr"(), "qti"."__constant_gbvdw5papk"(), "qti"."__constant_6l2ttocydo"(), "qti"."__constant_levw2mwpwa"(), "qti"."__constant_mzggfsj72d"(), "qti"."__constant_ql3gyxgbvc"(), "qti"."__constant_4v2z57igsj"(), "qti"."__constant_sn5ucr2eat"(), "qti"."__constant_3bgu23uy42"(), "qti"."__constant_uynctp5wdx"(), "qti"."__constant_sjctib2m6a"(), "qti"."__constant_uav4xy4p5a"(), "qti"."__constant_folbw276p3"(), "qti"."__constant_dc7u4pz4ga"(), "qti"."__constant_nccth24rmg"(), "qti"."__constant_wn244xqmvq"(), "qti"."__constant_rwijlqnagg"(), "qti"."__constant_n4gntw4ty5"(), "qti"."__constant_aiwrmlshlf"(), "qti"."__constant_g3bd4eyobi"(), "qti"."__constant_zkaa5w3gb2"(), "qti"."__align_direction_names_vluq7iazdg"(), "qti"."__align_state_names_ffk37slxn3"(), "qti"."__attribute_model_names_d7ufmii6j2"(), "qti"."__attribute_name_names_q6tmzcty4e"(), "qti"."__attribute_slot_names_4r5l4mp24z"(), "qti"."__base_type_names_ok3nu5nck4"(), "qti"."__bound_facet_names_b7dbsbn4iu"(), "qti"."__bound_zero_names_2iyjgurtgw"(), "qti"."__built_in_names_qkzs4cgupe"(), "qti"."__cardinality_names_kqiairsoqa"(), "qti"."__cn_base_names_2wtzhyubck"(), "qti"."__cn_part_names_6db2fcgfhy"(), "qti"."__cn_part_form_names_te7u7jycdu"(), "qti"."__cn_type_names_wmjelllvhg"(), "qti"."__content_model_names_elvi5jdup4"(), "qti"."__declaration_kind_names_o62wpad2p7"(), "qti"."__domain_primitive_names_2yihitx2to"(), "qti"."__flag_names_dttyznb5cw"(), "qti"."__governor_names_d7jfyla3na"(), "qti"."__href_scope_names_y4pbuo4f5q"(), "qti"."__identity_names_rrxxe77wjj"(), "qti"."__include_parent_names_fixlnrxa4e"(), "qti"."__language_names_pvmtywwssv"(), "qti"."__node_kind_names_ulbko553n7"(), "qti"."__position_names_sglcn7ygpg"(), "qti"."__reading_form_names_tbdimwd3yh"(), "qti"."__reading_source_names_d5b4pcfzkz"(), "qti"."__reference_form_names_ktgko5k4l4"(), "qti"."__reference_resolution_names_3knvypuotm"(), "qti"."__reference_role_names_ce5jhrrzsl"(), "qti"."__reference_spelling_names_gocqpuf7tl"(), "qti"."__referenced_table_names_ynujnwu6bv"(), "qti"."__resource_type_names_iatibe6omc"(), "qti"."__rounding_holds_names_6j2zaayymp"(), "qti"."__rp_template_names_tkkjkmwhuf"(), "qti"."__schema_version_names_p2hfvbhu24"(), "qti"."__shared_model_names_3ekiicw54j"(), "qti"."__type_name_names_nykiaxxd3n"(), "qti"."__use_names_vmbq6fav2t"(), "qti"."__value_base_names_pjzlcpdwvv"(), "qti"."__value_cardinality_names_wzwznoycgf"(), "qti"."__value_domain_names_tb7etzpdol"(), "qti"."__xml_standalone_names_psf7bszcug"(), "qti"."__attribute_name_live_7ot3c4gfh5"(), "qti"."__attribute_slot_live_g5haf24jp3"(), "qti"."__flag_live_egdpt3c4t6"(), "qti"."__node_kind_live_rds6vphboo"(), "qti"."__position_live_uvhnssun3f"(), "qti"."__value_base_live_trk5bm7ra5"(), "qti"."__value_cardinality_live_qbccqbzssx"() TO "qti__author";

REVOKE ALL ON SCHEMA "qti", "qti__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti"."area_mapping", "qti"."area_mapping_cardinality", "qti"."aria_element", "qti"."aria_range", "qti"."aria_value", "qti"."assembled_catalog", "qti"."assembled_id", "qti"."assembled_lang", "qti"."assembled_name", "qti"."assembled_reference", "qti"."assessment_object", "qti"."attribute", "qti"."attribute_entity", "qti"."binding", "qti"."binding_base_type", "qti"."binding_cardinality", "qti"."binding_declaration", "qti"."binding_name", "qti"."body_xml_lang", "qti"."bound_variable", "qti"."branch_resolution", "qti"."branch_rule", "qti"."branch_shuffle", "qti"."branch_target", "qti"."card_support", "qti"."catalog_id", "qti"."catalog_ref", "qti"."catalog_scope", "qti"."catalog_target", "qti"."cell_headers", "qti"."cell_leaf", "qti"."choice", "qti"."choice_interaction", "qti"."choice_variable_name", "qti"."cn_attribute", "qti"."cn_count", "qti"."cn_part_text", "qti"."cn_slot", "qti"."comment", "qti"."context_ref", "qti"."context_ref_declaration", "qti"."count_bound", "qti"."count_range", "qti"."declaration", "qti"."declaration_base_type", "qti"."declaration_cardinality", "qti"."declaration_identifier", "qti"."declaration_name", "qti"."declaration_table", "qti"."default_entry", "qti"."dependency", "qti"."dependency_target", "qti"."doctype", "qti"."document", "qti"."document_generals", "qti"."document_id", "qti"."document_lang", "qti"."double_value", "qti"."encoding_decl", "qti"."entry", "qti"."expression", "qti"."expression_attribute", "qti"."feedback_ref", "qti"."feedback_ref_cardinality", "qti"."feedback_ref_declaration", "qti"."field_value", "qti"."file", "qti"."file_href", "qti"."fragment_value", "qti"."general_lang", "qti"."general_named", "qti"."general_object", "qti"."header_token", "qti"."held_type", "qti"."hotspot", "qti"."hottext", "qti"."id_binding", "qti"."identity_text", "qti"."idref", "qti"."idref_target", "qti"."inclusion", "qti"."instance", "qti"."instance_name", "qti"."interaction", "qti"."interaction_attribute", "qti"."item_mode", "qti"."item_ref_document", "qti"."item_ref_target", "qti"."label_use", "qti"."least_count", "qti"."literal", "qti"."literal_typed", "qti"."lom_entry", "qti"."lom_general", "qti"."lom_language", "qti"."lom_object", "qti"."lom_object_identifier", "qti"."lom_object_title", "qti"."lom_record", "qti"."lom_resource", "qti"."lom_resource_type", "qti"."lom_resource_type_source", "qti"."lom_string", "qti"."lom_string_language", "qti"."lom_title", "qti"."lom_title_string", "qti"."lookup_table", "qti"."lookup_table_cardinality", "qti"."lookup_value", "qti"."lookup_value_type", "qti"."manifest_id", "qti"."manifest_id_space", "qti"."map_key", "qti"."map_key_directed_pair", "qti"."map_key_float", "qti"."map_key_integer", "qti"."map_key_pair", "qti"."map_key_point", "qti"."map_key_type", "qti"."mapping", "qti"."mapping_base_type", "qti"."mapping_cardinality", "qti"."mapping_item_ref", "qti"."mapping_item_ref_type", "qti"."mapping_lookup", "qti"."mapping_source_declaration", "qti"."mastery_ceiling", "qti"."mastery_floor", "qti"."mastery_value", "qti"."math_action", "qti"."math_align_group", "qti"."math_align_scope", "qti"."math_apply", "qti"."math_argument", "qti"."math_cell", "qti"."math_cn", "qti"."math_dir", "qti"."math_qualifier", "qti"."math_rank", "qti"."most_count", "qti"."name_lookup", "qti"."named", "qti"."named_href", "qti"."namespace", "qti"."node", "qti"."normal_maximum", "qti"."normal_minimum", "qti"."object_identifier", "qti"."object_lang", "qti"."object_title", "qti"."open_attribute_name", "qti"."open_element_name", "qti"."operand", "qti"."package", "qti"."pci_module_form", "qti"."pi", "qti"."placed_binding", "qti"."placed_binding_base_type", "qti"."placed_binding_cardinality", "qti"."placed_binding_declaration", "qti"."placed_body_xml_lang", "qti"."placed_catalog_ref", "qti"."placed_choice", "qti"."placed_document", "qti"."placed_general_lang", "qti"."placed_hottext", "qti"."placed_id", "qti"."placed_idref", "qti"."placed_math_rank", "qti"."placed_reference", "qti"."placed_share_target", "qti"."placed_variable_ref", "qti"."placed_variable_ref_declaration", "qti"."placed_xml_lang", "qti"."printed_variable_ref", "qti"."printed_variable_ref_declaration", "qti"."processing", "qti"."processing_template", "qti"."quotation", "qti"."reading", "qti"."reading_cardinality", "qti"."record_field", "qti"."record_field_name", "qti"."reference", "qti"."reference_document", "qti"."reference_path", "qti"."reference_segment", "qti"."referring_document", "qti"."resource", "qti"."resource_file", "qti"."resource_href", "qti"."resource_id", "qti"."resource_lom_general", "qti"."resource_lom_language_set", "qti"."resource_typed", "qti"."rounding", "qti"."rounding_figures", "qti"."rounding_mode", "qti"."rounding_mode_figures", "qti"."sd_decl", "qti"."section", "qti"."section_context_name", "qti"."section_context_ref", "qti"."section_context_ref_declaration", "qti"."section_feedback_name", "qti"."section_feedback_ref", "qti"."section_feedback_ref_cardinality", "qti"."section_feedback_ref_declaration", "qti"."section_identifier", "qti"."section_member", "qti"."section_ordering", "qti"."section_printed_name", "qti"."section_printed_ref", "qti"."section_printed_ref_declaration", "qti"."section_scope", "qti"."section_selection", "qti"."section_template_name", "qti"."section_template_ref", "qti"."section_template_ref_cardinality", "qti"."section_template_ref_declaration", "qti"."share_fragment", "qti"."share_target", "qti"."site", "qti"."site_path", "qti"."site_target", "qti"."slider", "qti"."ssml_attribute", "qti"."ssml_scope", "qti"."statistic_date", "qti"."stimulus_ref", "qti"."table_header", "qti"."table_scope", "qti"."template_default", "qti"."template_default_cardinality", "qti"."template_default_target", "qti"."template_ref", "qti"."template_ref_cardinality", "qti"."template_ref_declaration", "qti"."test_document", "qti"."test_flag", "qti"."test_reference", "qti"."test_token", "qti"."text_double_value", "qti"."text_idref", "qti"."text_reference", "qti"."text_reference_path", "qti"."tolerance", "qti"."tolerance_token", "qti"."typed_href", "qti"."typed_value", "qti"."usage_base_type", "qti"."usage_value", "qti"."usage_value_base_type", "qti"."value", "qti"."value_base_type", "qti"."value_set", "qti"."value_set_cardinality", "qti"."variable_lookup", "qti"."variable_mapping", "qti"."variable_ref", "qti"."variable_ref_cardinality", "qti"."variable_ref_declaration", "qti"."xml_decl", "qti"."xml_lang", "qti__author"."area_mapping", "qti__author"."area_mapping_cardinality", "qti__author"."aria_element", "qti__author"."aria_range", "qti__author"."aria_value", "qti__author"."assembled_catalog", "qti__author"."assembled_id", "qti__author"."assembled_lang", "qti__author"."assembled_name", "qti__author"."assembled_reference", "qti__author"."assessment_object", "qti__author"."attribute", "qti__author"."attribute_entity", "qti__author"."binding", "qti__author"."binding_base_type", "qti__author"."binding_cardinality", "qti__author"."binding_declaration", "qti__author"."binding_name", "qti__author"."body_xml_lang", "qti__author"."bound_variable", "qti__author"."branch_resolution", "qti__author"."branch_rule", "qti__author"."branch_shuffle", "qti__author"."branch_target", "qti__author"."card_support", "qti__author"."catalog_id", "qti__author"."catalog_ref", "qti__author"."catalog_scope", "qti__author"."catalog_target", "qti__author"."cell_headers", "qti__author"."cell_leaf", "qti__author"."choice", "qti__author"."choice_interaction", "qti__author"."choice_variable_name", "qti__author"."cn_attribute", "qti__author"."cn_count", "qti__author"."cn_part_text", "qti__author"."cn_slot", "qti__author"."comment", "qti__author"."context_ref", "qti__author"."context_ref_declaration", "qti__author"."count_bound", "qti__author"."count_range", "qti__author"."declaration", "qti__author"."declaration_base_type", "qti__author"."declaration_cardinality", "qti__author"."declaration_identifier", "qti__author"."declaration_name", "qti__author"."declaration_table", "qti__author"."default_entry", "qti__author"."dependency", "qti__author"."dependency_target", "qti__author"."doctype", "qti__author"."document", "qti__author"."document_generals", "qti__author"."document_id", "qti__author"."document_lang", "qti__author"."double_value", "qti__author"."encoding_decl", "qti__author"."entry", "qti__author"."expression", "qti__author"."expression_attribute", "qti__author"."feedback_ref", "qti__author"."feedback_ref_cardinality", "qti__author"."feedback_ref_declaration", "qti__author"."field_value", "qti__author"."file", "qti__author"."file_href", "qti__author"."fragment_value", "qti__author"."general_lang", "qti__author"."general_named", "qti__author"."general_object", "qti__author"."header_token", "qti__author"."held_type", "qti__author"."hotspot", "qti__author"."hottext", "qti__author"."id_binding", "qti__author"."identity_text", "qti__author"."idref", "qti__author"."idref_target", "qti__author"."inclusion", "qti__author"."instance", "qti__author"."instance_name", "qti__author"."interaction", "qti__author"."interaction_attribute", "qti__author"."item_mode", "qti__author"."item_ref_document", "qti__author"."item_ref_target", "qti__author"."label_use", "qti__author"."least_count", "qti__author"."literal", "qti__author"."literal_typed", "qti__author"."lom_entry", "qti__author"."lom_general", "qti__author"."lom_language", "qti__author"."lom_object", "qti__author"."lom_object_identifier", "qti__author"."lom_object_title", "qti__author"."lom_record", "qti__author"."lom_resource", "qti__author"."lom_resource_type", "qti__author"."lom_resource_type_source", "qti__author"."lom_string", "qti__author"."lom_string_language", "qti__author"."lom_title", "qti__author"."lom_title_string", "qti__author"."lookup_table", "qti__author"."lookup_table_cardinality", "qti__author"."lookup_value", "qti__author"."lookup_value_type", "qti__author"."manifest_id", "qti__author"."manifest_id_space", "qti__author"."map_key", "qti__author"."map_key_directed_pair", "qti__author"."map_key_float", "qti__author"."map_key_integer", "qti__author"."map_key_pair", "qti__author"."map_key_point", "qti__author"."map_key_type", "qti__author"."mapping", "qti__author"."mapping_base_type", "qti__author"."mapping_cardinality", "qti__author"."mapping_item_ref", "qti__author"."mapping_item_ref_type", "qti__author"."mapping_lookup", "qti__author"."mapping_source_declaration", "qti__author"."mastery_ceiling", "qti__author"."mastery_floor", "qti__author"."mastery_value", "qti__author"."math_action", "qti__author"."math_align_group", "qti__author"."math_align_scope", "qti__author"."math_apply", "qti__author"."math_argument", "qti__author"."math_cell", "qti__author"."math_cn", "qti__author"."math_dir", "qti__author"."math_qualifier", "qti__author"."math_rank", "qti__author"."most_count", "qti__author"."name_lookup", "qti__author"."named", "qti__author"."named_href", "qti__author"."namespace", "qti__author"."node", "qti__author"."normal_maximum", "qti__author"."normal_minimum", "qti__author"."object_identifier", "qti__author"."object_lang", "qti__author"."object_title", "qti__author"."open_attribute_name", "qti__author"."open_element_name", "qti__author"."operand", "qti__author"."package", "qti__author"."pci_module_form", "qti__author"."pi", "qti__author"."placed_binding", "qti__author"."placed_binding_base_type", "qti__author"."placed_binding_cardinality", "qti__author"."placed_binding_declaration", "qti__author"."placed_body_xml_lang", "qti__author"."placed_catalog_ref", "qti__author"."placed_choice", "qti__author"."placed_document", "qti__author"."placed_general_lang", "qti__author"."placed_hottext", "qti__author"."placed_id", "qti__author"."placed_idref", "qti__author"."placed_math_rank", "qti__author"."placed_reference", "qti__author"."placed_share_target", "qti__author"."placed_variable_ref", "qti__author"."placed_variable_ref_declaration", "qti__author"."placed_xml_lang", "qti__author"."printed_variable_ref", "qti__author"."printed_variable_ref_declaration", "qti__author"."processing", "qti__author"."processing_template", "qti__author"."quotation", "qti__author"."reading", "qti__author"."reading_cardinality", "qti__author"."record_field", "qti__author"."record_field_name", "qti__author"."reference", "qti__author"."reference_document", "qti__author"."reference_path", "qti__author"."reference_segment", "qti__author"."referring_document", "qti__author"."resource", "qti__author"."resource_file", "qti__author"."resource_href", "qti__author"."resource_id", "qti__author"."resource_lom_general", "qti__author"."resource_lom_language_set", "qti__author"."resource_typed", "qti__author"."rounding", "qti__author"."rounding_figures", "qti__author"."rounding_mode", "qti__author"."rounding_mode_figures", "qti__author"."sd_decl", "qti__author"."section", "qti__author"."section_context_name", "qti__author"."section_context_ref", "qti__author"."section_context_ref_declaration", "qti__author"."section_feedback_name", "qti__author"."section_feedback_ref", "qti__author"."section_feedback_ref_cardinality", "qti__author"."section_feedback_ref_declaration", "qti__author"."section_identifier", "qti__author"."section_member", "qti__author"."section_ordering", "qti__author"."section_printed_name", "qti__author"."section_printed_ref", "qti__author"."section_printed_ref_declaration", "qti__author"."section_scope", "qti__author"."section_selection", "qti__author"."section_template_name", "qti__author"."section_template_ref", "qti__author"."section_template_ref_cardinality", "qti__author"."section_template_ref_declaration", "qti__author"."share_fragment", "qti__author"."share_target", "qti__author"."site", "qti__author"."site_path", "qti__author"."site_target", "qti__author"."slider", "qti__author"."ssml_attribute", "qti__author"."ssml_scope", "qti__author"."statistic_date", "qti__author"."stimulus_ref", "qti__author"."table_header", "qti__author"."table_scope", "qti__author"."template_default", "qti__author"."template_default_cardinality", "qti__author"."template_default_target", "qti__author"."template_ref", "qti__author"."template_ref_cardinality", "qti__author"."template_ref_declaration", "qti__author"."test_document", "qti__author"."test_flag", "qti__author"."test_reference", "qti__author"."test_token", "qti__author"."text_double_value", "qti__author"."text_idref", "qti__author"."text_reference", "qti__author"."text_reference_path", "qti__author"."tolerance", "qti__author"."tolerance_token", "qti__author"."typed_href", "qti__author"."typed_value", "qti__author"."usage_base_type", "qti__author"."usage_value", "qti__author"."usage_value_base_type", "qti__author"."value", "qti__author"."value_base_type", "qti__author"."value_set", "qti__author"."value_set_cardinality", "qti__author"."variable_lookup", "qti__author"."variable_mapping", "qti__author"."variable_ref", "qti__author"."variable_ref_cardinality", "qti__author"."variable_ref_declaration", "qti__author"."xml_decl", "qti__author"."xml_lang" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti"."align_direction", "qti"."align_state", "qti"."attribute_model", "qti"."attribute_name", "qti"."__attribute_name_bits_416_thr6i6sipt", "qti"."attribute_slot", "qti"."__attribute_slot_bits_112_aecznthxg5", "qti"."base_type", "qti"."bound_facet", "qti"."bound_zero", "qti"."built_in", "qti"."cardinality", "qti"."cn_base", "qti"."cn_part", "qti"."cn_part_form", "qti"."cn_type", "qti"."content_model", "qti"."declaration_kind", "qti"."domain_primitive", "qti"."flag", "qti"."__flag_bits_12_i4uhexylc4", "qti"."governor", "qti"."href_scope", "qti"."identity", "qti"."include_parent", "qti"."language", "qti"."node_kind", "qti"."__node_kind_bits_644_kcdmigfwqm", "qti"."position", "qti"."__position_bits_308_gsnowf36kr", "qti"."reading_form", "qti"."reading_source", "qti"."reference_form", "qti"."reference_resolution", "qti"."reference_role", "qti"."reference_spelling", "qti"."referenced_table", "qti"."resource_type", "qti"."rounding_holds", "qti"."rp_template", "qti"."schema_version", "qti"."shared_model", "qti"."type_name", "qti"."use", "qti"."value_base", "qti"."__value_base_bits_16_7t6pwwxbsh", "qti"."value_cardinality", "qti"."__value_cardinality_bits_8_mma4mwhphy", "qti"."value_domain", "qti"."xml_standalone", "qti"."__text_pwaizaq6lx", "qti"."__text_c6iptmtj2x", "qti"."__text_5xaumrdzw7", "qti"."__text_xj3zno7u3h", "qti"."__text_7j6kgluyjp", "qti"."__text_7dfilirtp3", "qti"."__text_l7nqeazg5h", "qti"."__text_xey6ryorh5", "qti"."__text_ca4i7j77gp", "qti"."__text_qhjydx3ufb", "qti"."__text_7nkeqry66t", "qti"."__text_6kufndem2v", "qti"."__text_htajwmyatt", "qti"."__text_qvake6vbfh", "qti"."__text_n4nva7wrgk", "qti"."__text_hdc6mvcrgm", "qti"."__text_zij47sgley", "qti"."__text_gke7uypkov", "qti"."__text_d7mwmflg4k", "qti"."__text_piekqyt5fn", "qti"."__text_mpc5fvfrbl", "qti"."__text_fgve4r33vj", "qti"."__text_23rzixl3a2", "qti"."__text_3adwbksayk", "qti"."__text_k5kwygzatl", "qti"."__text_mqbstvk5ay", "qti"."__text_xisvziygi3", "qti"."__text_psn65t7m7e", "qti"."__text_3dlgl63rv6", "qti"."__text_aezrarw5qb", "qti"."__domain_gfw43vigph" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

DROP INDEX "qti"."__site_ix_node_b_42646_p_2_al_kind_spdt_2_q_7_edi_277xz3ge7u";

DROP INDEX "qti"."__reading_ix_named_nrv_4_n_3_nskd_variable_n_2_k_6_wckcjtp2qe";

DROP INDEX "qti"."__reading_ix_declaration_pizwecikp_5_jfky4pxdj4";

DROP INDEX "qti"."__reading_ix_declaration_jfamupczkd_uvza7qry4f";

DROP INDEX "qti"."__reading_ix_declaration_3_ql_4_rb_2_vkm_kepmtu5dhg";

DROP INDEX "qti"."__reading_ix_assembly_gqnat_57_wp_4_node_ixvvbhmp_6_6xy5e67vzp";

DROP INDEX "qti"."__placed_xml_lang_ix_node_document_lang_t7esja6gaa";

DROP INDEX "qti"."__declaration_identifier_ix_node_z_6_xuk_7_itel_3bbjfpaz5i";

DROP INDEX "qti"."__declaration_identifier_ix_node_uwzvnmekar_towfqfvdmp";

DROP INDEX "qti"."__attribute_ix_node_mz_4_jvdrujv_imi5yesybm";

DROP INDEX "qti"."__assembled_reference_ix_assembly_dnj_4_uerdi_4_node_podbscxw43";

ALTER TABLE "qti"."xml_lang" DROP COLUMN "__predecessor_carriers_rxup7pxfqi";

ALTER TABLE "qti"."xml_lang" DROP COLUMN "__index_carriers_dlfy2lyk5b";

ALTER TABLE "qti"."xml_lang" DROP COLUMN "__copy_carriers_tdlr6yqgq5";

ALTER TABLE "qti"."site" DROP COLUMN "__node_b42646p2al";

ALTER TABLE "qti"."site" DROP COLUMN "__kind_spdt2q7edi";

ALTER TABLE "qti"."reading" DROP COLUMN "__variable_n2k6ghxyfp";

ALTER TABLE "qti"."reading" DROP COLUMN "__split_l227qb5hge";

ALTER TABLE "qti"."reading" DROP COLUMN "__node_2s4xhychqf";

ALTER TABLE "qti"."reading" DROP COLUMN "__node_ixvvbhmp6c";

ALTER TABLE "qti"."reading" DROP COLUMN "__named_nrv4n3nskd";

ALTER TABLE "qti"."reading" DROP COLUMN "__kind_ascctyfsjd";

ALTER TABLE "qti"."reading" DROP COLUMN "__form_5x36vxrwo4";

ALTER TABLE "qti"."reading" DROP COLUMN "__declaration_kind_uwgyhqnmnf";

ALTER TABLE "qti"."reading" DROP COLUMN "__declaration_4coqakkdpt";

ALTER TABLE "qti"."reading" DROP COLUMN "__declaration_jfamupczkd";

ALTER TABLE "qti"."reading" DROP COLUMN "__declaration_pizwecikp5";

ALTER TABLE "qti"."reading" DROP COLUMN "__declaration_3ql4rb2vkm";

ALTER TABLE "qti"."reading" DROP COLUMN "__decl_cardinalities_d5wqktcwmq";

ALTER TABLE "qti"."reading" DROP COLUMN "__decl_base_types_odj5qxgexu";

ALTER TABLE "qti"."reading" DROP COLUMN "__attribute_dyqmhlbea5";

ALTER TABLE "qti"."reading" DROP COLUMN "__attribute_76qutbnsg4";

ALTER TABLE "qti"."reading" DROP COLUMN "__assembly_q3v2k6t2si";

ALTER TABLE "qti"."reading" DROP COLUMN "__assembly_gqnat57wp4";

ALTER TABLE "qti"."placed_xml_lang" DROP COLUMN "__predecessor_carriers_x4pilwe7xf";

ALTER TABLE "qti"."placed_xml_lang" DROP COLUMN "__index_carriers_djehtv3qov";

ALTER TABLE "qti"."placed_xml_lang" DROP COLUMN "__copy_carriers_ja6eizim4j";

ALTER TABLE "qti"."declaration_identifier" DROP COLUMN "__node_uwzvnmekar";

ALTER TABLE "qti"."declaration_identifier" DROP COLUMN "__node_z6xuk7itel";

ALTER TABLE "qti"."attribute" DROP COLUMN "__node_mz4jvdrujv";

ALTER TABLE "qti"."attribute" DROP COLUMN "__lexical_pfgrln2h3v";

ALTER TABLE "qti"."assembled_reference" DROP COLUMN "__node_ofsz4apvw5";

ALTER TABLE "qti"."assembled_reference" DROP COLUMN "__attribute_ooa2yqs7zw";

ALTER TABLE "qti"."assembled_reference" DROP COLUMN "__assembly_dnj4uerdi4";

ALTER TABLE "qti"."usage_value" DROP COLUMN "base_type";

DROP FUNCTION "qti"."__shared_model_names_dxfaeabdhc"() RESTRICT;

DROP FUNCTION "qti"."__content_model_names_okcie4kvo2"() RESTRICT;

DROP FUNCTION "qti"."__constant_ojybanodcv"() RESTRICT;

DROP FUNCTION "qti"."__constant_dtmq6bir7l"() RESTRICT;

DROP FUNCTION "qti"."__constant_hidw3w3e7r"() RESTRICT;

DROP FUNCTION "qti"."__constant_cfm6vm5h63"() RESTRICT;

DROP FUNCTION "qti"."__constant_rto362yzie"() RESTRICT;

DROP FUNCTION "qti"."__constant_732rchrtop"() RESTRICT;

DROP FUNCTION "qti"."__constant_wymj3qcfkk"() RESTRICT;

DROP FUNCTION "qti"."__constant_cfiqfp3qe2"() RESTRICT;

DROP FUNCTION "qti"."__constant_y2o5adjpe7"() RESTRICT;

DROP FUNCTION "qti"."__constant_hgt3yp5vit"() RESTRICT;

DROP FUNCTION "qti"."__constant_hhiy5ilipq"() RESTRICT;

DROP FUNCTION "qti"."__constant_oxqzj66dwj"() RESTRICT;

DROP FUNCTION "qti"."__constant_xicwkndytl"() RESTRICT;

DROP FUNCTION "qti"."__constant_se63hpre26"() RESTRICT;

DROP FUNCTION "qti"."__constant_2n7f7dydeh"() RESTRICT;

DROP FUNCTION "qti"."__constant_auiifvfmod"() RESTRICT;

DROP FUNCTION "qti"."__constant_sxoibajylj"() RESTRICT;

DROP FUNCTION "qti"."__constant_7cotpgn6zy"() RESTRICT;

DROP FUNCTION "qti"."__constant_houcq2agm5"() RESTRICT;

DROP FUNCTION "qti"."__constant_funrvkv7qk"() RESTRICT;

COMMENT ON FUNCTION "qti"."__constant_cowgjzeorq"() IS 'closed constant 1deef208678714d136d539af9ebc9baa8dbdaaa7edf9cf9b19a5059110a12b53';

COMMENT ON FUNCTION "qti"."__constant_wm5pnshcyf"() IS 'closed constant 1ff1d3b23a2bbf4b2faf6787a992b29a42038eb1ef5df7e8239f956f668abddf';

COMMENT ON FUNCTION "qti"."__constant_ykvwltiwpp"() IS 'closed constant 220871b6e15e191afe9252924891dc5c6983a6702c110ebf07e2c4e033b4e99a';

COMMENT ON FUNCTION "qti"."__constant_5kz6ofzblb"() IS 'closed constant 2fa490d142fd0dbc400a06d2b057481ef9b62d88d6b0f842db89d2803fb1383d';

COMMENT ON FUNCTION "qti"."__constant_eqtu3e3bf7"() IS 'closed constant 3cbfaad3b01578593cef53f29e00892e2ccc89587d77c4064ed31de0df61d58b';

COMMENT ON FUNCTION "qti"."__constant_qkqwephi2j"() IS 'closed constant 4c66d9a44bca0d321856548d1bd6c87cf89a0ab858a6b2c734ca135bd51d8e35';

COMMENT ON FUNCTION "qti"."__constant_oazju5gsln"() IS 'closed constant 59f776d753b9f5b07fc6088f6a6fb2901b8d7c987fdb041ebb07b729e985fb56';

COMMENT ON FUNCTION "qti"."__constant_inwmcukoes"() IS 'closed constant 5ec2aeb708816afe0dc8a8ad940667c33997453628ef1a3ebaa100f7929f5042';

COMMENT ON FUNCTION "qti"."__constant_m7gdtnppww"() IS 'closed constant 6632d3dae890f76c0773e03eb0d831bee3aa3938e19b1f30d9d99a5139df6ef7';

COMMENT ON FUNCTION "qti"."__constant_dhxmsn4rkd"() IS 'closed constant 6c3a5c3d703f72f2cf4241b6be4d035c331fcc43001223a836fb0d927ef63b3f';

COMMENT ON FUNCTION "qti"."__constant_5vczbwx7y7"() IS 'closed constant 6e35937efed8032155018853dc7f5c53cb9c96828fb662c161baa64ff1e98672';

COMMENT ON FUNCTION "qti"."__constant_p5oxaznp4j"() IS 'closed constant 6ff9bf00dba5639ec40a08fd8f03f7f8ab81a675d459327b9b9e62e845839820';

COMMENT ON FUNCTION "qti"."__constant_wvtqnkiky3"() IS 'closed constant 803152adc6b78f7b248c5e6df4bfd8657b6801bb74db4e80f89ad5f068c5302a';

COMMENT ON FUNCTION "qti"."__constant_przq27rlwm"() IS 'closed constant 89980182a1f432e8830aa47c7990bef5f10d02a25013207b1402b80138e76909';

COMMENT ON FUNCTION "qti"."__constant_ogqwerfjhc"() IS 'closed constant 8e42b9bcace6aeba85ead10fac6760860574e07b04134965a72f9a6dd70db3a2';

COMMENT ON FUNCTION "qti"."__constant_2spvsmpumv"() IS 'closed constant 8f51a867be7ea77dffe62b83e521459f31488535c53efde595a65cd01e7271c7';

COMMENT ON FUNCTION "qti"."__constant_ahddjwrhv5"() IS 'closed constant 9512e3484e0766c142c6c91f57c0414ec8b3544dc62d0f209f214ef5bbcb331d';

COMMENT ON FUNCTION "qti"."__constant_ctf72alvlj"() IS 'closed constant 9f2d5a9b2b81c006773adb39aa4510893d0139f4bb22084d88acfaae2b9caf03';

COMMENT ON FUNCTION "qti"."__constant_jl3vjp3onh"() IS 'closed constant a68b71bc6adff2f1d487856354d93aa2cbd52a066ce35d9c8a5d7d77e059f075';

COMMENT ON FUNCTION "qti"."__constant_5qe5tzd65n"() IS 'closed constant a6c2b00a875fa7ef94c88bf39b5bdf1065c2c608cb6da14602ad25f7bd157432';

COMMENT ON FUNCTION "qti"."__constant_lliww2nzpo"() IS 'closed constant acc6d3b7284f2ecda21cfd95c3369643a10bef86c01c267407853a03138fd919';

COMMENT ON FUNCTION "qti"."__constant_adakh3kbth"() IS 'closed constant adffa4153ca1574b828fd09c9b72dbd5381995f0490c89d1ce3c4ef24fb7c53c';

COMMENT ON FUNCTION "qti"."__constant_ma2si6ukdt"() IS 'closed constant bcd9be53a7fccc76e6c34941d4823ec7e9d1ec61ec873a78ab3e92d0d57c69f5';

COMMENT ON FUNCTION "qti"."__constant_otpfpakmgn"() IS 'closed constant c67472010ae41a755f6f221630a80b4f9a9012b4d12ffd14ce5ed1022d39a7c5';

COMMENT ON FUNCTION "qti"."__constant_sszsm5lf66"() IS 'closed constant c9366cf83208a3a667f159301da6cec5738a8fa8576fb29ca34c157adc945d08';

COMMENT ON FUNCTION "qti"."__constant_p2xwmlesaa"() IS 'closed constant c938b4d49f7ba43e3bdaf836afc988239f51adfa4bf046dceb265b3501ac689a';

COMMENT ON FUNCTION "qti"."__constant_j6uos7o7iw"() IS 'closed constant cf0154fad9c597440c2680e01337f5d5bfdf42c17e736ccb67f162ea9ce38773';

COMMENT ON FUNCTION "qti"."__constant_is5pk7lyfr"() IS 'closed constant e324725954e1483fa0804182061a0eaa2c65ad86f0a65720b059275fdcb7f903';

COMMENT ON FUNCTION "qti"."__constant_gbvdw5papk"() IS 'closed constant e60f9b5af0a1247dad6bc3241e58ab5651dafd48a23b2b16fd4f6fbb999b9f42';

COMMENT ON FUNCTION "qti"."__constant_mzggfsj72d"() IS 'closed constant e953a4dde7bd0e9bf98168991e39915c451dc7dcd6ff7d9b8e64dbb6d28af5f6';

COMMENT ON FUNCTION "qti"."__constant_4v2z57igsj"() IS 'closed constant eb1dfa758b6a00c18669704c4bc72f6530de28fdc50a5ff0af1c19b0782b30ee';

COMMENT ON FUNCTION "qti"."__constant_sn5ucr2eat"() IS 'closed constant ed54e2792d5451d5cb268f01cec4ab76e5706d6ee3a67a58d556961dbe30bc22';

COMMENT ON FUNCTION "qti"."__constant_folbw276p3"() IS 'closed constant f1956b6e8c6647999526cd53577b6e89ae5a973c905d210a3771009277470473';

COMMENT ON FUNCTION "qti"."__constant_aiwrmlshlf"() IS 'closed constant fb348a1fa4d801d5ead2f8a6c694ac6f13fb28aa0423f3564818fc596b602fc9';

COMMENT ON FUNCTION "qti"."__constant_g3bd4eyobi"() IS 'closed constant fe9524b333b0036b59980e3f662598ffcc00e40e94d620cf2c69515b83c90a7e';

COMMENT ON FUNCTION "qti"."__align_direction_names_vluq7iazdg"() IS 'names of roster AlignDirection (f1225cd89024c5cb863ad785334474c4ffdded7dfc588c8793a81955573ff517)';

COMMENT ON FUNCTION "qti"."__align_state_names_ffk37slxn3"() IS 'names of roster AlignState (64ba2d3e322a2e0f980c4bf6ca918acdcd69033e4e532a6f7be3f63f5494ec50)';

COMMENT ON FUNCTION "qti"."__cn_base_names_2wtzhyubck"() IS 'names of roster CnBase (a81912f62610358c82215ad222eba411a4324ca88cc4912ddcc2a89721228005)';

COMMENT ON FUNCTION "qti"."__cn_part_names_6db2fcgfhy"() IS 'names of roster CnPart (1147da0120ff722c37c16d517e029fd86049e095a53b00565425beb5c39f8c24)';

COMMENT ON FUNCTION "qti"."__cn_part_form_names_te7u7jycdu"() IS 'names of roster CnPartForm (909cc3d253201ff25886c704075d3cf11cc36c43493ccf592ac4e067a93f2d98)';

COMMENT ON FUNCTION "qti"."__cn_type_names_wmjelllvhg"() IS 'names of roster CnType (38d189d4b09434b6b92b62f1ac697d738a44bbdc421a4896df034c9820eaabfa)';

COMMENT ON FUNCTION "qti"."__content_model_names_elvi5jdup4"() IS 'names of roster ContentModel (bc4f4c6e0f2ce87dd7bc991113d4f57fc8bacd32ef564e49bf6091401c01cf98)';

COMMENT ON FUNCTION "qti"."__shared_model_names_3ekiicw54j"() IS 'names of roster SharedModel (78014f6e5c83321d39d79f219ea6070677e23257ff8459ff420569d36cf5c01e)';

COMMENT ON CONSTRAINT "__assembled_catalog_pk_b5tgxmgzjo" ON "qti"."assembled_catalog" IS 'primary key of AssembledCatalog';

COMMENT ON CONSTRAINT "__assembled_id_key_assembly_id_owner_ujce7hrdm7" ON "qti"."assembled_id" IS 'key AssembledId(assembly, id, owner)';

COMMENT ON CONSTRAINT "__attribute_key_node_id_open_name_governs_kind_name_udfzv7fjm5" ON "qti"."attribute" IS 'key Attribute(node, id, openName, governs, kind, name, version)';

COMMENT ON CONSTRAINT "__body_xml_lang_pk_zzjcyx27yq" ON "qti"."body_xml_lang" IS 'primary key of BodyXmlLang';

COMMENT ON CONSTRAINT "__body_xml_lang_key_node_document_lang_7kxlkdx3g6" ON "qti"."body_xml_lang" IS 'key BodyXmlLang(node, document, lang)';

COMMENT ON CONSTRAINT "__card_support_pk_lcsvtp6qes" ON "qti"."card_support" IS 'primary key of CardSupport';

COMMENT ON CONSTRAINT "__card_support_key_catalog_support_nvxiq7dafd" ON "qti"."card_support" IS 'key CardSupport(catalog, support)';

COMMENT ON CONSTRAINT "__card_support_key_node_lexical_txokfs5vwt" ON "qti"."card_support" IS 'key CardSupport(node, lexical)';

COMMENT ON CONSTRAINT "__catalog_id_pk_6linalpnqr" ON "qti"."catalog_id" IS 'primary key of CatalogId';

COMMENT ON CONSTRAINT "__catalog_id_key_document_id_n5tjppofgc" ON "qti"."catalog_id" IS 'key CatalogId(document, id)';

COMMENT ON CONSTRAINT "__catalog_id_key_node_document_qxvfrujse7" ON "qti"."catalog_id" IS 'key CatalogId(node, document)';

COMMENT ON CONSTRAINT "__catalog_ref_pk_dpc3bm7nzq" ON "qti"."catalog_ref" IS 'primary key of CatalogRef';

COMMENT ON CONSTRAINT "__catalog_ref_key_node_document_lexical_crklsjtsgg" ON "qti"."catalog_ref" IS 'key CatalogRef(node, document, lexical)';

COMMENT ON CONSTRAINT "__catalog_scope_pk_kb6w3u5zbp" ON "qti"."catalog_scope" IS 'primary key of CatalogScope';

COMMENT ON CONSTRAINT "__catalog_scope_key_node_scope_uvan4ng3hz" ON "qti"."catalog_scope" IS 'key CatalogScope(node, scope)';

COMMENT ON CONSTRAINT "__catalog_target_pk_bismj7atmk" ON "qti"."catalog_target" IS 'primary key of CatalogTarget';

COMMENT ON CONSTRAINT "__catalog_target_key_document_id_carriers_3pcawtumff" ON "qti"."catalog_target" IS 'key CatalogTarget(document, id, carriers)';

COMMENT ON CONSTRAINT "__catalog_target_key_document_id_placements_3jboyyuixd" ON "qti"."catalog_target" IS 'key CatalogTarget(document, id, placements)';

COMMENT ON CONSTRAINT "__cell_leaf_pk_kwsf55gwhy" ON "qti"."cell_leaf" IS 'primary key of CellLeaf';

COMMENT ON CONSTRAINT "__cell_leaf_key_node_i33i63uycb" ON "qti"."cell_leaf" IS 'key CellLeaf(node)';

COMMENT ON CONSTRAINT "__cell_leaf_key_cell_at_start_after_3bjj36unx6" ON "qti"."cell_leaf" IS 'key CellLeaf(cell, at, startAfter)';

COMMENT ON CONSTRAINT "__cell_leaf_check_math_cell_leaves_max_fold_pgxt4ejcrw" ON "qti"."cell_leaf" IS 'check of CellLeaf for law max fold over fin(MathCell, leaves) of CellLeaf(cell, start, startWas, startAfter) into MathCell(node, lastStart)';

COMMENT ON CONSTRAINT "__cn_attribute_pk_uahvc6us4g" ON "qti"."cn_attribute" IS 'primary key of CnAttribute';

COMMENT ON CONSTRAINT "__cn_attribute_key_node_name_lexical_cu7muqqogb" ON "qti"."cn_attribute" IS 'key CnAttribute(node, name, lexical)';

COMMENT ON CONSTRAINT "__cn_attribute_key_node_lexical_name_otulbj64mf" ON "qti"."cn_attribute" IS 'key CnAttribute(node, lexical, name)';

COMMENT ON CONSTRAINT "__cn_count_pk_5n2ubteh2s" ON "qti"."cn_count" IS 'primary key of CnCount';

COMMENT ON CONSTRAINT "__cn_count_check_cn_count_in_cn_parts_cwyirxrado" ON "qti"."cn_count" IS 'check of CnCount for law CnCount(type, parts) in CnParts(type, parts)';

COMMENT ON CONSTRAINT "__cn_count_key_node_parts_type_z2xrtl67aq" ON "qti"."cn_count" IS 'key CnCount(node, parts, type)';

COMMENT ON CONSTRAINT "__cn_count_key_node_type_a37agg6m2w" ON "qti"."cn_count" IS 'key CnCount(node, type)';

COMMENT ON CONSTRAINT "__cn_part_text_pk_2mlmvkaywv" ON "qti"."cn_part_text" IS 'primary key of CnPartText';

COMMENT ON CONSTRAINT "__cn_part_text_check_cn_part_text_in_cn_form_skp5v7ovmz" ON "qti"."cn_part_text" IS 'check of CnPartText for law CnPartText(type, part, form) in CnForm(type, part, form)';

COMMENT ON CONSTRAINT "__cn_slot_pk_tkl6mzsgtu" ON "qti"."cn_slot" IS 'primary key of CnSlot';

COMMENT ON CONSTRAINT "__cn_slot_check_cn_slot_in_cn_form_sx4ohhn6rj" ON "qti"."cn_slot" IS 'check of CnSlot for law CnSlot(type, part, form) in CnForm(type, part, form)';

COMMENT ON CONSTRAINT "__declaration_key_node_parent_kind_3o2lalckgi" ON "qti"."declaration" IS 'key Declaration(node, parentKind)';

COMMENT ON CONSTRAINT "__default_entry_pk_r6qigbitbp" ON "qti"."default_entry" IS 'primary key of DefaultEntry';

COMMENT ON CONSTRAINT "__default_entry_key_card_4cvksca7p6" ON "qti"."default_entry" IS 'key DefaultEntry(card)';

COMMENT ON CONSTRAINT "__default_entry_key_node_lexical_bxsdknknx6" ON "qti"."default_entry" IS 'key DefaultEntry(node, lexical)';

COMMENT ON CONSTRAINT "__expression_attribute_key_node_attribute_written_sqs5cpgyqi" ON "qti"."expression_attribute" IS 'key ExpressionAttribute(node, attribute, written)';

COMMENT ON CONSTRAINT "__expression_attribute_key_node_written_attribute_gmblqwrdel" ON "qti"."expression_attribute" IS 'key ExpressionAttribute(node, written, attribute)';

COMMENT ON CONSTRAINT "__instance_key_id_document_assembly_wqqiitvjwd" ON "qti"."instance" IS 'key Instance(id, document, assembly)';

COMMENT ON CONSTRAINT "__interaction_key_node_module_forms_i7sufvfcmf" ON "qti"."interaction" IS 'key Interaction(node, moduleForms)';

COMMENT ON CONSTRAINT "__map_key_key_node_case_text_3a5vudl54f" ON "qti"."map_key" IS 'key MapKey(node, caseText)';

COMMENT ON CONSTRAINT "__map_key_type_key_node_base_type_ya2jqubgrb" ON "qti"."map_key_type" IS 'key MapKeyType(node, baseType)';

COMMENT ON CONSTRAINT "__mapping_item_ref_pk_sh6q5lyrad" ON "qti"."mapping_item_ref" IS 'primary key of MappingItemRef';

COMMENT ON CONSTRAINT "__mapping_item_ref_key_node_types_item_ref_ccbtpzo7fa" ON "qti"."mapping_item_ref" IS 'key MappingItemRef(node, types, itemRef)';

COMMENT ON CONSTRAINT "__mapping_item_ref_key_node_item_ref_5ttfelwawp" ON "qti"."mapping_item_ref" IS 'key MappingItemRef(node, itemRef)';

COMMENT ON CONSTRAINT "__mapping_item_ref_type_pk_6pqtwxh5qj" ON "qti"."mapping_item_ref_type" IS 'primary key of MappingItemRefType';

COMMENT ON CONSTRAINT "__math_action_pk_4jdvklv2ii" ON "qti"."math_action" IS 'primary key of MathAction';

COMMENT ON CONSTRAINT "__math_action_key_node_selection_lexical_selection_2bp7tohjvq" ON "qti"."math_action" IS 'key MathAction(node, selectionLexical, selectionWritten)';

COMMENT ON CONSTRAINT "__math_action_key_node_selection_4jlq2hbkn7" ON "qti"."math_action" IS 'key MathAction(node, selection)';

COMMENT ON CONSTRAINT "__math_align_group_pk_tgvbkr7qje" ON "qti"."math_align_group" IS 'primary key of MathAlignGroup';

COMMENT ON CONSTRAINT "__math_align_group_key_node_cell_a2gvizvb4a" ON "qti"."math_align_group" IS 'key MathAlignGroup(node, cell)';

COMMENT ON CONSTRAINT "__math_align_scope_pk_sxnaufx3ho" ON "qti"."math_align_scope" IS 'primary key of MathAlignScope';

COMMENT ON CONSTRAINT "__math_align_scope_key_node_cell_mzs6a6hlnb" ON "qti"."math_align_scope" IS 'key MathAlignScope(node, cell)';

COMMENT ON CONSTRAINT "__math_align_scope_key_node_kind_state_unsdqiyrtv" ON "qti"."math_align_scope" IS 'key MathAlignScope(node, kind, state)';

COMMENT ON CONSTRAINT "__math_align_scope_key_node_cell_passes_kind_own_r56zgsjtit" ON "qti"."math_align_scope" IS 'key MathAlignScope(node, cell, passes, kind, own)';

COMMENT ON CONSTRAINT "__math_align_scope_key_node_kind_qp5snwaq5a" ON "qti"."math_align_scope" IS 'key MathAlignScope(node, kind)';

COMMENT ON CONSTRAINT "__math_apply_pk_2firl5nro2" ON "qti"."math_apply" IS 'primary key of MathApply';

COMMENT ON CONSTRAINT "__math_apply_key_node_owned_operator_4ey4x3yydt" ON "qti"."math_apply" IS 'key MathApply(node, owned, operator)';

COMMENT ON CONSTRAINT "__math_apply_key_node_arguments_xioh7kizol" ON "qti"."math_apply" IS 'key MathApply(node, arguments)';

COMMENT ON CONSTRAINT "__math_argument_pk_yojef4m6bw" ON "qti"."math_argument" IS 'primary key of MathArgument';

COMMENT ON CONSTRAINT "__math_cell_pk_flybwottgz" ON "qti"."math_cell" IS 'primary key of MathCell';

COMMENT ON CONSTRAINT "__math_cell_check_math_cell_leaves_max_fold_wzxagxwtzy" ON "qti"."math_cell" IS 'check of MathCell for law max fold over fin(MathCell, leaves) of CellLeaf(cell, start, startWas, startAfter) into MathCell(node, lastStart)';

COMMENT ON CONSTRAINT "__math_cell_key_node_leaves_groups_fpntxu2khw" ON "qti"."math_cell" IS 'key MathCell(node, leaves, groups)';

COMMENT ON CONSTRAINT "__math_cell_key_node_groups_iaj75lps25" ON "qti"."math_cell" IS 'key MathCell(node, groups)';

COMMENT ON CONSTRAINT "__math_cn_pk_3nrusqjv2o" ON "qti"."math_cn" IS 'primary key of MathCn';

COMMENT ON CONSTRAINT "__math_cn_key_node_parts_base_type_j7woidsbec" ON "qti"."math_cn" IS 'key MathCn(node, parts, base, type)';

COMMENT ON CONSTRAINT "__math_cn_check_math_cn_in_cn_parts_ela4pkxt26" ON "qti"."math_cn" IS 'check of MathCn for law MathCn(type, parts) in CnParts(type, parts)';

COMMENT ON CONSTRAINT "__math_dir_pk_6awysd6ztt" ON "qti"."math_dir" IS 'primary key of MathDir';

COMMENT ON CONSTRAINT "__math_dir_key_node_lexical_6osns6ccwp" ON "qti"."math_dir" IS 'key MathDir(node, lexical)';

COMMENT ON CONSTRAINT "__math_qualifier_pk_uwee2mfb3e" ON "qti"."math_qualifier" IS 'primary key of MathQualifier';

COMMENT ON CONSTRAINT "__math_qualifier_check_math_qualifier_in_head_whkr27tsub" ON "qti"."math_qualifier" IS 'check of MathQualifier for law MathQualifier(head, kind) in HeadQualifier(head, qualifier)';

COMMENT ON CONSTRAINT "__math_qualifier_check_math_qualifier_in_math_head_ughu3kbeui" ON "qti"."math_qualifier" IS 'check of MathQualifier for law MathQualifier(head) in MathHeadOperator(kind)';

COMMENT ON CONSTRAINT "__math_rank_pk_bu6eyoohob" ON "qti"."math_rank" IS 'primary key of MathRank';

COMMENT ON CONSTRAINT "__math_rank_key_node_rank_pwzdhba4h6" ON "qti"."math_rank" IS 'key MathRank(node, rank)';

COMMENT ON CONSTRAINT "__node_check_node_children_concat_fold_jdz4qsgrly" ON "qti"."node" IS 'check of Node for law concat fold over fin(Node, children) of Node(parent, chars, charsWas, charsAfter) where {"args":[{"arg":{"field":"parentKind","kind":"field"},"kind":"in","values":["lom:entry","lom:language","qti-base-value","qti-resource-icon","qti-value","ud:value"]},{"args":[{"arg":{"arg":{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"parentGoverns","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"domain","kind":"closedAt","relation":"TextDomain"},"kind":"in","values":["xs:anySimpleType","xs:normalizedString"]},"kind":"not"},{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"parentKind","kind":"field"},{"field":"parentGoverns","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"kind":"closedHas","relation":"TextDomain"}],"kind":"and"},{"args":[{"arg":{"field":"parentKind","kind":"field"},"kind":"in","values":["lom:source","lom:value"]},{"kind":"compare","left":{"field":"parentParentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"lom:learningResourceType"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"lom:string"}},{"kind":"compare","left":{"field":"parentParentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"lom:title"}}],"kind":"and"}],"kind":"or"} and {"kind":"compare","left":{"field":"start","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}} into Node(id, stringValue)';

COMMENT ON CONSTRAINT "__node_key_id_document_kind_parent_abf25mzj2n" ON "qti"."node" IS 'key Node(id, document, kind, parent)';

COMMENT ON CONSTRAINT "__pci_module_form_pk_jb4ydiyesl" ON "qti"."pci_module_form" IS 'primary key of PciModuleForm';

COMMENT ON CONSTRAINT "__placed_body_xml_lang_pk_ierbxublm5" ON "qti"."placed_body_xml_lang" IS 'primary key of PlacedBodyXmlLang';

COMMENT ON CONSTRAINT "__placed_body_xml_lang_key_instance_node_assembly_ceonqg4lrf" ON "qti"."placed_body_xml_lang" IS 'key PlacedBodyXmlLang(instance, node, assembly, document, lang)';

COMMENT ON CONSTRAINT "__placed_catalog_ref_pk_xglkpi7dzd" ON "qti"."placed_catalog_ref" IS 'primary key of PlacedCatalogRef';

COMMENT ON CONSTRAINT "__placed_idref_key_instance_id_document_assembly_4v7dioxhgu" ON "qti"."placed_idref" IS 'key PlacedIdref(instance, id, document, assembly)';

COMMENT ON CONSTRAINT "__placed_math_rank_pk_w247vuqyov" ON "qti"."placed_math_rank" IS 'primary key of PlacedMathRank';

COMMENT ON CONSTRAINT "__placed_math_rank_key_instance_node_rank_s45d3ipsdo" ON "qti"."placed_math_rank" IS 'key PlacedMathRank(instance, node, rank)';

COMMENT ON CONSTRAINT "__placed_share_target_pk_r6i6tlbske" ON "qti"."placed_share_target" IS 'primary key of PlacedShareTarget';

COMMENT ON CONSTRAINT "__reading_check_reading_form_kind_form_found_named_mu7as7u35r" ON "qti"."reading" IS 'check of Reading for law Reading(kind, attribute, declarationKind) where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}} in ReferenceDeclaration(kind, attribute, declaration)';

COMMENT ON CONSTRAINT "__reference_key_node_name_scope_chd2zywqnq" ON "qti"."reference" IS 'key Reference(node, name, scope)';

COMMENT ON CONSTRAINT "__section_template_ref_cardinality_pk_h6zg6g4bi5" ON "qti"."section_template_ref_cardinality" IS 'primary key of SectionTemplateRefCardinality';

COMMENT ON CONSTRAINT "__section_template_ref_declaration_key_instance_node_emy7juxcxe" ON "qti"."section_template_ref_declaration" IS 'key SectionTemplateRefDeclaration(instance, node, attribute, declaration, kind)';

COMMENT ON CONSTRAINT "__share_fragment_pk_w7lv43thb6" ON "qti"."share_fragment" IS 'primary key of ShareFragment';

COMMENT ON CONSTRAINT "__share_fragment_key_node_document_src_piiuo4ss54" ON "qti"."share_fragment" IS 'key ShareFragment(node, document, src)';

COMMENT ON CONSTRAINT "__share_fragment_key_node_placements_document_id_f5edkk7ljk" ON "qti"."share_fragment" IS 'key ShareFragment(node, placements, document, id)';

COMMENT ON CONSTRAINT "__share_fragment_key_node_document_id_assembled_4zqjjwu6hh" ON "qti"."share_fragment" IS 'key ShareFragment(node, document, id, assembled)';

COMMENT ON CONSTRAINT "__share_target_pk_tap2cz4xh5" ON "qti"."share_target" IS 'primary key of ShareTarget';

COMMENT ON CONSTRAINT "__share_target_key_node_document_id_xxpy44hjsu" ON "qti"."share_target" IS 'key ShareTarget(node, document, id)';

COMMENT ON CONSTRAINT "__template_ref_cardinality_pk_unarffgw2k" ON "qti"."template_ref_cardinality" IS 'primary key of TemplateRefCardinality';

COMMENT ON CONSTRAINT "__template_ref_declaration_key_node_attribute_5yhuqmcbse" ON "qti"."template_ref_declaration" IS 'key TemplateRefDeclaration(node, attribute, declaration, kind)';

COMMENT ON CONSTRAINT "__test_document_key_node_instances_k4obic4tsn" ON "qti"."test_document" IS 'key TestDocument(node, instances)';

COMMENT ON CONSTRAINT "__text_reference_pk_47h6xjfe7g" ON "qti"."text_reference" IS 'primary key of TextReference';

COMMENT ON CONSTRAINT "__text_reference_key_node_document_kind_lexical_z3nmpha32k" ON "qti"."text_reference" IS 'key TextReference(node, document, kind, lexical)';

COMMENT ON CONSTRAINT "__text_reference_key_node_document_kind_scope_4k7jius2tf" ON "qti"."text_reference" IS 'key TextReference(node, document, kind, scope)';

COMMENT ON CONSTRAINT "__text_reference_path_pk_aurefmdcbf" ON "qti"."text_reference_path" IS 'primary key of TextReferencePath';

COMMENT ON CONSTRAINT "__text_reference_path_key_node_document_kind_nuvfa5cgo4" ON "qti"."text_reference_path" IS 'key TextReferencePath(node, document, kind)';

COMMENT ON CONSTRAINT "__usage_base_type_pk_jljhyurjfg" ON "qti"."usage_base_type" IS 'primary key of UsageBaseType';

COMMENT ON CONSTRAINT "__usage_base_type_key_node_lexical_iovwcjcyu3" ON "qti"."usage_base_type" IS 'key UsageBaseType(node, lexical)';

COMMENT ON CONSTRAINT "__usage_value_base_type_pk_v6447uyhax" ON "qti"."usage_value_base_type" IS 'primary key of UsageValueBaseType';

COMMENT ON CONSTRAINT "__usage_value_base_type_key_node_base_type_lexical_32bif22hzr" ON "qti"."usage_value_base_type" IS 'key UsageValueBaseType(node, baseTypeLexical)';

COMMENT ON CONSTRAINT "__variable_mapping_key_node_parent_hibsagkd2k" ON "qti"."variable_mapping" IS 'key VariableMapping(node, parent)';

COMMENT ON CONSTRAINT "__xml_lang_key_node_document_lang_scope_locn5q2jix" ON "qti"."xml_lang" IS 'key XmlLang(node, document, lang, scope)';

COMMENT ON COLUMN "qti"."assembled_reference"."__assembly_eavgo22inf" IS 'assembly where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"} and {"kind":"compare","left":{"args":[{"field":"kind","kind":"field"},{"field":"attribute","kind":"field"}],"field":"spelling","kind":"closedAt","relation":"VariableReference"},"op":"eq","right":{"kind":"literal","value":"bare"}} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}';

COMMENT ON COLUMN "qti"."assembled_reference"."__attribute_2nqioyibuz" IS 'attribute where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"} and {"kind":"compare","left":{"args":[{"field":"kind","kind":"field"},{"field":"attribute","kind":"field"}],"field":"spelling","kind":"closedAt","relation":"VariableReference"},"op":"eq","right":{"kind":"literal","value":"bare"}} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}';

COMMENT ON COLUMN "qti"."assembled_reference"."__node_zhqd2beld3" IS 'node where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"} and {"kind":"compare","left":{"args":[{"field":"kind","kind":"field"},{"field":"attribute","kind":"field"}],"field":"spelling","kind":"closedAt","relation":"VariableReference"},"op":"eq","right":{"kind":"literal","value":"bare"}} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}';

COMMENT ON COLUMN "qti"."attribute"."__tag_selection_written_true_3nkngi2qwy" IS 'tag MathAction.selectionWritten = true';

COMMENT ON COLUMN "qti"."attribute"."__tag_element_false_tmi7wtieyv" IS 'tag PciModuleForm.element = false';

COMMENT ON COLUMN "qti"."attribute"."__document_ca4zebqilc" IS 'document where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}}';

COMMENT ON COLUMN "qti"."attribute"."__document_gowteik7ae" IS 'document where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"}';

COMMENT ON COLUMN "qti"."attribute"."__document_lbcvi7754s" IS 'document where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}}';

COMMENT ON COLUMN "qti"."attribute"."__document_wqjsyg4ltz" IS 'document where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-catalog"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"id"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_dsb5j2pdbm" IS 'lexical where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_re7iphd5q7" IS 'lexical where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["ud:value"]} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"baseType"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_2stynqcvvt" IS 'lexical where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_igziiuvglk" IS 'lexical where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_cunus2zs73" IS 'lexical where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_lhmbaka5ng" IS 'lexical where {"args":[{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"1"}},{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"true"}}],"kind":"or"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"default"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_xdw2o32cnm" IS 'lexical where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"selection"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_f4h2j36v7n" IS 'lexical where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"support"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_ddgdebuzct" IS 'lexical where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"case-sensitive"}}';

COMMENT ON COLUMN "qti"."attribute"."__lexical_wjwjuhdzyz" IS 'lexical where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"dir"}}';

COMMENT ON COLUMN "qti"."attribute"."__name_vvkts6omjc" IS 'name where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_kvvtz4aokl" IS 'node where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_v4zoanxsju" IS 'node where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_k7rqu5upsz" IS 'node where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"}';

COMMENT ON COLUMN "qti"."attribute"."__node_h7ktnl7tci" IS 'node where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"}';

COMMENT ON COLUMN "qti"."attribute"."__node_tblig6omlm" IS 'node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_tsiudobb4f" IS 'node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-catalog"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"id"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_yp7qmbepyb" IS 'node where {"args":[{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"1"}},{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"true"}}],"kind":"or"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"default"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_zxxp2534g5" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"selection"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_52tvzova3k" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"support"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_su53cqvokz" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"case-sensitive"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_uyp7pedfw2" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"module"}}';

COMMENT ON COLUMN "qti"."attribute"."__node_goabodzugo" IS 'node where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"dir"}}';

COMMENT ON COLUMN "qti"."body_xml_lang"."__copy_carriers_tdlr6yqgq5" IS 'the owner''s count of the family DocumentLang.carriers';

COMMENT ON COLUMN "qti"."body_xml_lang"."__index_carriers_dlfy2lyk5b" IS 'the index of the family DocumentLang.carriers';

COMMENT ON COLUMN "qti"."body_xml_lang"."__predecessor_carriers_rxup7pxfqi" IS 'the predecessor of the index of the family DocumentLang.carriers';

COMMENT ON COLUMN "qti"."catalog_ref"."__copy_carriers_yhfoozudvt" IS 'the owner''s count of the family CatalogTarget.carriers';

COMMENT ON COLUMN "qti"."catalog_ref"."__index_carriers_27spxthvw6" IS 'the index of the family CatalogTarget.carriers';

COMMENT ON COLUMN "qti"."catalog_ref"."__predecessor_carriers_huqrct7eim" IS 'the predecessor of the index of the family CatalogTarget.carriers';

COMMENT ON COLUMN "qti"."catalog_scope"."__parent_pa7sxt3mut" IS 'parent where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-catalog-info"}}';

COMMENT ON COLUMN "qti"."catalog_scope"."__scope_2edhtd3orc" IS 'scope where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-catalog-info"}}';

COMMENT ON COLUMN "qti"."catalog_target"."__document_jwyigkitch" IS 'document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."catalog_target"."__document_sba7m53uwz" IS 'document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."catalog_target"."__id_chqpn6jlrw" IS 'id where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."catalog_target"."__placements_umab3ec74p" IS 'placements where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."catalog_target"."__pred_carriers_5eaxdkd6g3" IS 'pred(carriers)';

COMMENT ON COLUMN "qti"."catalog_target"."__pred_placements_wtijf47h4h" IS 'pred(placements)';

COMMENT ON COLUMN "qti"."cell_leaf"."__tag_element_children_0_kpm373f3aa" IS 'tag MathAlignScope.elementChildren = 0';

COMMENT ON COLUMN "qti"."cell_leaf"."__copy_leaves_xpo4zl4zff" IS 'the owner''s count of the family MathCell.leaves';

COMMENT ON COLUMN "qti"."cell_leaf"."__pred_at_xktcobhsti" IS 'pred(at)';

COMMENT ON COLUMN "qti"."cn_count"."__tag_name_type_hg2ugkuqxm" IS 'tag CnAttribute.name = type';

COMMENT ON COLUMN "qti"."cn_count"."__tag_kind_m_cn_vaaa4rk3mj" IS 'tag Node.kind = m:cn';

COMMENT ON COLUMN "qti"."cn_count"."__node_4zs7f4hetq" IS 'node where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."cn_count"."__type_lexical_mw5gnzkqdv" IS 'typeLexical where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."cn_count"."__pred_parts_32uebfen7t" IS 'pred(parts)';

COMMENT ON COLUMN "qti"."cn_part_text"."__copy_parts_urvm2tdscg" IS 'the owner''s count of the family MathCn.parts';

COMMENT ON COLUMN "qti"."cn_part_text"."__index_parts_7qce3kqy2n" IS 'the index of the family MathCn.parts';

COMMENT ON COLUMN "qti"."cn_part_text"."__predecessor_parts_suujsgbjfx" IS 'the predecessor of the index of the family MathCn.parts';

COMMENT ON COLUMN "qti"."cn_slot"."__copy_parts_b4mxlmuhpq" IS 'the owner''s count of the family CnCount.parts';

COMMENT ON COLUMN "qti"."cn_slot"."__index_parts_lw2ccsvvvn" IS 'the index of the family CnCount.parts';

COMMENT ON COLUMN "qti"."cn_slot"."__predecessor_parts_dswemsbp6i" IS 'the predecessor of the index of the family CnCount.parts';

COMMENT ON COLUMN "qti"."declaration_identifier"."__node_fkiarxhsad" IS 'node where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-outcome-declaration"}} and {"kind":"compare","left":{"field":"identifier","kind":"field"},"op":"eq","right":{"kind":"literal","value":"MAXSCORE"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-assessment-test"}}';

COMMENT ON COLUMN "qti"."declaration_identifier"."__node_zfo6tymqbh" IS 'node where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-outcome-declaration"}} and {"kind":"compare","left":{"field":"identifier","kind":"field"},"op":"eq","right":{"kind":"literal","value":"SCORE"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-assessment-test"}}';

COMMENT ON COLUMN "qti"."expression"."__tag_attribute_weight_identifier_fovwq7tv75" IS 'tag ExpressionAttribute.attribute = weight-identifier';

COMMENT ON COLUMN "qti"."expression"."__node_yijjz6u7vd" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-test-variables"}}';

COMMENT ON COLUMN "qti"."expression_attribute"."__tag_attribute_weight_identifier_fovwq7tv75" IS 'tag ExpressionAttribute.attribute = weight-identifier';

COMMENT ON COLUMN "qti"."expression_attribute"."__tag_written_true_o2njtfwmyo" IS 'tag ExpressionAttribute.written = true';

COMMENT ON COLUMN "qti"."expression_attribute"."__node_zjgiyb7nr7" IS 'node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"base-type"}} and {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"float"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."expression_attribute"."__node_j2c273zmua" IS 'node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"base-type"}} and {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unknown"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."expression_attribute"."__node_gyptgprpk7" IS 'node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"weight-identifier"}}';

COMMENT ON COLUMN "qti"."expression_attribute"."__node_l66firaakd" IS 'node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"weight-identifier"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."expression_attribute"."__written_xr2xcpx7cp" IS 'written where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"base-type"}} and {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unknown"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."interaction"."__pred_module_forms_c2s5pqvqs7" IS 'pred(moduleForms)';

COMMENT ON COLUMN "qti"."map_key"."__tag_base_type_string_du6v7sbmlk" IS 'tag MapKeyType.baseType = string';

COMMENT ON COLUMN "qti"."map_key"."__node_kupzut65fd" IS 'node where {"args":[{"arg":{"args":[{"field":"caseText","kind":"field"}],"fn":"collapse","kind":"compute"},"kind":"in","values":["1","true"]},{"kind":"compare","left":{"field":"folded","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"or"}';

COMMENT ON COLUMN "qti"."map_key"."__node_rkykeekqwq" IS 'node where {"kind":"compare","left":{"field":"caseText","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."map_key"."__node_ytvjqsvok4" IS 'node where {"kind":"compare","left":{"field":"folded","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."map_key_type"."__node_tspabsizer" IS 'node where {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"string"}}';

COMMENT ON COLUMN "qti"."mapping_item_ref"."__node_o7qeabbnno" IS 'node where {"kind":"compare","left":{"field":"types","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}}';

COMMENT ON COLUMN "qti"."mapping_item_ref"."__pred_types_pbybotuh5v" IS 'pred(types)';

COMMENT ON COLUMN "qti"."mapping_item_ref_type"."__copy_types_xlvbmph5fc" IS 'the owner''s count of the family MappingItemRef.types';

COMMENT ON COLUMN "qti"."mapping_item_ref_type"."__index_types_aw3mgxkdiz" IS 'the index of the family MappingItemRef.types';

COMMENT ON COLUMN "qti"."mapping_item_ref_type"."__predecessor_types_s27btss2gs" IS 'the predecessor of the index of the family MappingItemRef.types';

COMMENT ON COLUMN "qti"."mapping_item_ref_type"."__node_pgr2c2ubor" IS 'node where {"arg":{"arg":{"field":"type","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},"kind":"not"}';

COMMENT ON COLUMN "qti"."math_action"."__tag_kind_m_maction_d3xejeqvif" IS 'tag Node.kind = m:maction';

COMMENT ON COLUMN "qti"."math_action"."__node_ftdvsxxkkg" IS 'node where {"kind":"compare","left":{"field":"selectionWritten","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."math_align_group"."__tag_kind_m_maligngroup_fhvidvtaep" IS 'tag MathAlignScope.kind = m:maligngroup';

COMMENT ON COLUMN "qti"."math_align_group"."__tag_state_open_hbfhgrpnnf" IS 'tag MathAlignScope.state = open';

COMMENT ON COLUMN "qti"."math_align_group"."__copy_groups_vbcd7hbcvu" IS 'the owner''s count of the family MathCell.groups';

COMMENT ON COLUMN "qti"."math_align_group"."__index_groups_u2sce2eotp" IS 'the index of the family MathCell.groups';

COMMENT ON COLUMN "qti"."math_align_group"."__predecessor_groups_rirvccr7hx" IS 'the predecessor of the index of the family MathCell.groups';

COMMENT ON COLUMN "qti"."math_align_scope"."__tag_kind_m_mtd_xa35mctuma" IS 'tag Node.kind = m:mtd';

COMMENT ON COLUMN "qti"."math_align_scope"."__cell_crzb77exj4" IS 'cell where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maligngroup"}} and {"kind":"compare","left":{"field":"state","kind":"field"},"op":"eq","right":{"kind":"literal","value":"open"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__cell_despuko6mc" IS 'cell where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__chosen_nwrwqehg4j" IS 'chosen where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__dir_lexical_h6z4ucsu6w" IS 'dirLexical where {"kind":"compare","left":{"field":"dirLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__inherited_4f5vs6h5cr" IS 'inherited where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__node_i5vkip2st6" IS 'node where {"kind":"compare","left":{"field":"dirLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__node_2cng4arpih" IS 'node where {"kind":"compare","left":{"field":"elementChildren","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__node_5sroalr7ba" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maligngroup"}} and {"kind":"compare","left":{"field":"state","kind":"field"},"op":"eq","right":{"kind":"literal","value":"open"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__node_x3mdbcdhup" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__node_permaeflu7" IS 'node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__parent_ofh2oegku5" IS 'parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__parent_bj6k3aos7e" IS 'parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__parent_kind_bupdqhkd5a" IS 'parentKind where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_align_scope"."__received_nl6nb5uaz7" IS 'received where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."math_apply"."__tag_kind_m_apply_pjtmhvv7wn" IS 'tag Node.kind = m:apply';

COMMENT ON COLUMN "qti"."math_apply"."__pred_arguments_xhws45g4kd" IS 'pred(arguments)';

COMMENT ON COLUMN "qti"."math_apply"."__pred_owned_mqgcknrwyp" IS 'pred(owned)';

COMMENT ON COLUMN "qti"."math_argument"."__tag_parent_kind_m_apply_d3jbpwaalp" IS 'tag Node.parentKind = m:apply';

COMMENT ON COLUMN "qti"."math_argument"."__copy_arguments_uj2bmewrky" IS 'the owner''s count of the family MathApply.arguments';

COMMENT ON COLUMN "qti"."math_argument"."__index_arguments_4nb46l7gun" IS 'the index of the family MathApply.arguments';

COMMENT ON COLUMN "qti"."math_argument"."__predecessor_arguments_zvdmfwxlcr" IS 'the predecessor of the index of the family MathApply.arguments';

COMMENT ON COLUMN "qti"."math_cell"."__tag_kind_m_mtd_xa35mctuma" IS 'tag Node.kind = m:mtd';

COMMENT ON COLUMN "qti"."math_cell"."__pred_groups_vcil4lo3j4" IS 'pred(groups)';

COMMENT ON COLUMN "qti"."math_cell"."__pred_leaves_oeq7eporgz" IS 'pred(leaves)';

COMMENT ON COLUMN "qti"."math_cn"."__tag_name_base_waay562dod" IS 'tag CnAttribute.name = base';

COMMENT ON COLUMN "qti"."math_cn"."__tag_name_type_hg2ugkuqxm" IS 'tag CnAttribute.name = type';

COMMENT ON COLUMN "qti"."math_cn"."__tag_kind_m_cn_vaaa4rk3mj" IS 'tag Node.kind = m:cn';

COMMENT ON COLUMN "qti"."math_cn"."__base_lexical_dhzsou5d52" IS 'baseLexical where {"kind":"compare","left":{"field":"baseLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."math_cn"."__node_3zqnpj6o5d" IS 'node where {"kind":"compare","left":{"field":"baseLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."math_cn"."__node_4zs7f4hetq" IS 'node where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."math_cn"."__type_lexical_mw5gnzkqdv" IS 'typeLexical where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}';

COMMENT ON COLUMN "qti"."math_cn"."__pred_parts_32uebfen7t" IS 'pred(parts)';

COMMENT ON COLUMN "qti"."math_qualifier"."__tag_parent_kind_m_apply_d3jbpwaalp" IS 'tag Node.parentKind = m:apply';

COMMENT ON COLUMN "qti"."math_qualifier"."__copy_owned_pcyebi7enq" IS 'the owner''s count of the family MathApply.owned';

COMMENT ON COLUMN "qti"."math_qualifier"."__index_owned_ag5tpjjvcc" IS 'the index of the family MathApply.owned';

COMMENT ON COLUMN "qti"."math_qualifier"."__predecessor_owned_5kjlepfpyt" IS 'the predecessor of the index of the family MathApply.owned';

COMMENT ON COLUMN "qti"."math_rank"."__parent_hwejryg34m" IS 'parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}';

COMMENT ON COLUMN "qti"."math_rank"."__parent_rank_djgpmhcqav" IS 'parentRank where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}';

COMMENT ON COLUMN "qti"."node"."__tag_kind_m_mtd_732qdbsle4" IS 'tag MathAlignScope.kind = m:mtd';

COMMENT ON COLUMN "qti"."node"."__tag_element_true_7b46swo4dc" IS 'tag PciModuleForm.element = true';

COMMENT ON COLUMN "qti"."node"."__document_o4t6y5btiu" IS 'document where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}';

COMMENT ON COLUMN "qti"."node"."__id_cd2i27c3ms" IS 'id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:bvar","m:condition","m:degree","m:domainofapplication","m:interval","m:logbase","m:lowlimit","m:momentabout","m:uplimit"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}}';

COMMENT ON COLUMN "qti"."node"."__id_33kgwoi4ec" IS 'id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:bvar","m:condition","m:degree","m:domainofapplication","m:interval","m:logbase","m:lowlimit","m:momentabout","m:uplimit"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}';

COMMENT ON COLUMN "qti"."node"."__id_d2goefw6wb" IS 'id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:degree","m:logbase","m:momentabout"]} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}}';

COMMENT ON COLUMN "qti"."node"."__id_gzljvgjbwk" IS 'id where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}';

COMMENT ON COLUMN "qti"."node"."__id_riubp6fpbe" IS 'id where {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"baseType"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}} and {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"fieldIdentifier"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."node"."__id_lpqd3za4po" IS 'id where {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"baseType"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}} and {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"fieldIdentifier"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"ud:value"}}';

COMMENT ON COLUMN "qti"."node"."__id_akgrikbcwo" IS 'id where {"kind":"compare","left":{"field":"elementChildren","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}}';

COMMENT ON COLUMN "qti"."node"."__id_4kyfqj6js7" IS 'id where {"kind":"compare","left":{"field":"elementChildren","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}';

COMMENT ON COLUMN "qti"."node"."__id_tw4vam75we" IS 'id where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}}';

COMMENT ON COLUMN "qti"."node"."__id_hdt6eyj25k" IS 'id where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:mtd"}}';

COMMENT ON COLUMN "qti"."node"."__kind_pfg4bqow25" IS 'kind where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}';

COMMENT ON COLUMN "qti"."node"."__kind_7plboq7zdr" IS 'kind where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}';

COMMENT ON COLUMN "qti"."node"."__parent_uzfw6kuely" IS 'parent where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}';

COMMENT ON COLUMN "qti"."node"."__parent_gvsacnek5z" IS 'parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-interaction-modules"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}}';

COMMENT ON COLUMN "qti"."node"."__string_value_x4ajhh2wfo" IS 'stringValue where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}';

COMMENT ON COLUMN "qti"."pci_module_form"."__copy_module_forms_5aweist2be" IS 'the owner''s count of the family Interaction.moduleForms';

COMMENT ON COLUMN "qti"."pci_module_form"."__index_module_forms_tbhslenhvx" IS 'the index of the family Interaction.moduleForms';

COMMENT ON COLUMN "qti"."pci_module_form"."__predecessor_module_forms_mifsudh6mn" IS 'the predecessor of the index of the family Interaction.moduleForms';

COMMENT ON COLUMN "qti"."pci_module_form"."__node_zkko65kuex" IS 'node where {"kind":"compare","left":{"field":"element","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."pci_module_form"."__node_itpy7ns7w5" IS 'node where {"kind":"compare","left":{"field":"element","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."placed_body_xml_lang"."__copy_carriers_ja6eizim4j" IS 'the owner''s count of the family AssembledLang.carriers';

COMMENT ON COLUMN "qti"."placed_body_xml_lang"."__index_carriers_djehtv3qov" IS 'the index of the family AssembledLang.carriers';

COMMENT ON COLUMN "qti"."placed_body_xml_lang"."__predecessor_carriers_x4pilwe7xf" IS 'the predecessor of the index of the family AssembledLang.carriers';

COMMENT ON COLUMN "qti"."placed_catalog_ref"."__copy_placements_yndviqra42" IS 'the owner''s count of the family CatalogTarget.placements';

COMMENT ON COLUMN "qti"."placed_catalog_ref"."__index_placements_j4sbj3jpk7" IS 'the index of the family CatalogTarget.placements';

COMMENT ON COLUMN "qti"."placed_catalog_ref"."__predecessor_placements_awjfun24c7" IS 'the predecessor of the index of the family CatalogTarget.placements';

COMMENT ON COLUMN "qti"."placed_math_rank"."__instance_boc7dpt43h" IS 'instance where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}';

COMMENT ON COLUMN "qti"."placed_math_rank"."__parent_hwejryg34m" IS 'parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}';

COMMENT ON COLUMN "qti"."placed_math_rank"."__parent_rank_djgpmhcqav" IS 'parentRank where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}';

COMMENT ON COLUMN "qti"."placed_share_target"."__copy_placements_urtweklhhh" IS 'the owner''s count of the family ShareFragment.placements';

COMMENT ON COLUMN "qti"."placed_share_target"."__index_placements_k2ruhluxe3" IS 'the index of the family ShareFragment.placements';

COMMENT ON COLUMN "qti"."placed_share_target"."__predecessor_placements_4lbkx6femv" IS 'the predecessor of the index of the family ShareFragment.placements';

COMMENT ON COLUMN "qti"."placed_xml_lang"."__assembly_f6kopeudwe" IS 'assembly where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON COLUMN "qti"."placed_xml_lang"."__document_wcj2k6zcql" IS 'document where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON COLUMN "qti"."placed_xml_lang"."__instance_ryj3b3mgaw" IS 'instance where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON COLUMN "qti"."placed_xml_lang"."__lang_vq3kvaagyw" IS 'lang where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON COLUMN "qti"."placed_xml_lang"."__node_nt6ftizred" IS 'node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON COLUMN "qti"."reading"."__tag_area_mapping_qti_area_mapping_wt62csr7ml" IS 'tag DeclarationTable.areaMapping = qti-area-mapping';

COMMENT ON COLUMN "qti"."reading"."__tag_mapping_qti_mapping_7jrdswnrkn" IS 'tag DeclarationTable.mapping = qti-mapping';

COMMENT ON COLUMN "qti"."reading"."__assembly_brf3sbdwa3" IS 'assembly where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__assembly_sggtw6cwda" IS 'assembly where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__attribute_szn64gmkfk" IS 'attribute where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__attribute_dn7csff7gp" IS 'attribute where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__decl_base_types_5x4gxdsycq" IS 'declBaseTypes where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}';

COMMENT ON COLUMN "qti"."reading"."__decl_cardinalities_vvydu3gy53" IS 'declCardinalities where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}';

COMMENT ON COLUMN "qti"."reading"."__declaration_3mv65pwvgk" IS 'declaration where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}';

COMMENT ON COLUMN "qti"."reading"."__declaration_pucv7vcefe" IS 'declaration where {"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-response-declaration"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-response"}} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}';

COMMENT ON COLUMN "qti"."reading"."__declaration_rppsrhr5i4" IS 'declaration where {"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-response-declaration"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-response-point"}} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}';

COMMENT ON COLUMN "qti"."reading"."__declaration_iyg4qzi7lx" IS 'declaration where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"args":[{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"figures"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-equal-rounded"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"figures"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-round-to"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"max"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-any-n"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"max"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-integer"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"min"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-any-n"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"min"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-integer"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"n"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-index"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"number-repeats"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-repeat"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"step"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-integer"}}],"kind":"and"}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declBaseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__declaration_wt7jbmsmtl" IS 'declaration where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"args":[{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"max"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-float"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"min"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-float"}}],"kind":"and"}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declBaseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__declaration_pnhwgyt6uo" IS 'declaration where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"pattern"}} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declBaseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-pattern-match"}}';

COMMENT ON COLUMN "qti"."reading"."__declaration_kind_x26izueojr" IS 'declarationKind where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}';

COMMENT ON COLUMN "qti"."reading"."__form_zd4qqbgfsu" IS 'form where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__kind_jpu2chchxq" IS 'kind where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__named_wkt6teogcz" IS 'named where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}';

COMMENT ON COLUMN "qti"."reading"."__node_vdwnogher6" IS 'node where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__node_ngapbvqkdw" IS 'node where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__split_pb3ut3hart" IS 'split where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}';

COMMENT ON COLUMN "qti"."reading"."__variable_2uaihkdfhu" IS 'variable where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}';

COMMENT ON COLUMN "qti"."reference"."__node_scx2hiwvjr" IS 'node where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"href"}} and {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"external"}}';

COMMENT ON COLUMN "qti"."section_template_ref_declaration"."__tag_base_type_identifier_344qgtpk3l" IS 'tag DeclarationBaseType.baseType = identifier';

COMMENT ON COLUMN "qti"."section_template_ref_declaration"."__attribute_z7y72kybyf" IS 'attribute where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}';

COMMENT ON COLUMN "qti"."section_template_ref_declaration"."__declaration_6cfggqpwok" IS 'declaration where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-template-variable"}}';

COMMENT ON COLUMN "qti"."section_template_ref_declaration"."__instance_o2mj6jp54p" IS 'instance where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}';

COMMENT ON COLUMN "qti"."section_template_ref_declaration"."__node_wmg2sk5kn2" IS 'node where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}';

COMMENT ON COLUMN "qti"."share_fragment"."__document_jwyigkitch" IS 'document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."share_fragment"."__document_sba7m53uwz" IS 'document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."share_fragment"."__id_chqpn6jlrw" IS 'id where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."share_fragment"."__node_eixsmyfnul" IS 'node where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}';

COMMENT ON COLUMN "qti"."share_fragment"."__placements_umab3ec74p" IS 'placements where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."share_fragment"."__pred_placements_wtijf47h4h" IS 'pred(placements)';

COMMENT ON COLUMN "qti"."share_target"."__tag_assembled_false_ozaww7oasa" IS 'tag ShareFragment.assembled = false';

COMMENT ON COLUMN "qti"."site"."__tag_name_href_rc6np66dc4" IS 'tag Reference.name = href';

COMMENT ON COLUMN "qti"."site"."__tag_scope_external_4ewa3hwoox" IS 'tag Reference.scope = external';

COMMENT ON COLUMN "qti"."site"."__kind_xumnxfryga" IS 'kind where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"xi:include"}}';

COMMENT ON COLUMN "qti"."site"."__node_4btbiqcyve" IS 'node where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"xi:include"}}';

COMMENT ON COLUMN "qti"."site"."__node_hy2rqw4ikb" IS 'node where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}';

COMMENT ON COLUMN "qti"."template_ref_declaration"."__tag_base_type_identifier_344qgtpk3l" IS 'tag DeclarationBaseType.baseType = identifier';

COMMENT ON COLUMN "qti"."template_ref_declaration"."__attribute_z7y72kybyf" IS 'attribute where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}';

COMMENT ON COLUMN "qti"."template_ref_declaration"."__declaration_6cfggqpwok" IS 'declaration where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-template-variable"}}';

COMMENT ON COLUMN "qti"."template_ref_declaration"."__node_wmg2sk5kn2" IS 'node where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}';

COMMENT ON COLUMN "qti"."text_reference"."__document_5cau2dspow" IS 'document where {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"entry"}}';

COMMENT ON COLUMN "qti"."text_reference"."__kind_3plysbbxy5" IS 'kind where {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"entry"}}';

COMMENT ON COLUMN "qti"."text_reference"."__node_rx3smqszrv" IS 'node where {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"entry"}}';

COMMENT ON COLUMN "qti"."text_reference_path"."__tag_scope_entry_3uoeqhx6qk" IS 'tag TextReference.scope = entry';

COMMENT ON COLUMN "qti"."usage_value"."__tag_kind_ud_value_b2yl5o5lx3" IS 'tag Node.kind = ud:value';

COMMENT ON COLUMN "qti"."usage_value"."__base_type_lexical_ch24no2osx" IS 'baseTypeLexical where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]}';

COMMENT ON COLUMN "qti"."usage_value"."__node_uazzjek2gb" IS 'node where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]}';

COMMENT ON COLUMN "qti"."xml_lang"."__document_wcj2k6zcql" IS 'document where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON COLUMN "qti"."xml_lang"."__lang_vq3kvaagyw" IS 'lang where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON COLUMN "qti"."xml_lang"."__node_nt6ftizred" IS 'node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}';

COMMENT ON CONSTRAINT "__attribute_key_node_rmoe3heakj" ON "qti"."attribute" IS 'key Attribute(node where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_name_lur3pupati" ON "qti"."attribute" IS 'key Attribute(node where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}, name where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_ezrr5xs2wh" ON "qti"."attribute" IS 'key Attribute(node where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"})';

COMMENT ON CONSTRAINT "__attribute_key_node_z3fpxb33wr" ON "qti"."attribute" IS 'key Attribute(node where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"})';

COMMENT ON CONSTRAINT "__attribute_key_node_j3nl2tgoep" ON "qti"."attribute" IS 'key Attribute(node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_j5k5x63vk5" ON "qti"."attribute" IS 'key Attribute(node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-catalog"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"id"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_tsbrtp3osw" ON "qti"."attribute" IS 'key Attribute(node where {"args":[{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"1"}},{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"true"}}],"kind":"or"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"default"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_3gwlsgbzky" ON "qti"."attribute" IS 'key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"selection"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_c6surz4m55" ON "qti"."attribute" IS 'key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"support"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_77bmalp47s" ON "qti"."attribute" IS 'key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"case-sensitive"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_2zna26wugb" ON "qti"."attribute" IS 'key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"module"}})';

COMMENT ON CONSTRAINT "__attribute_key_node_uuivyleqbm" ON "qti"."attribute" IS 'key Attribute(node where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"dir"}})';

COMMENT ON CONSTRAINT "__body_xml_lang_key_document_lang_index_carriers_2c3xaqaesy" ON "qti"."body_xml_lang" IS 'key BodyXmlLang(document, lang, the index of the family DocumentLang.carriers)';

COMMENT ON CONSTRAINT "__catalog_ref_key_document_token_index_carriers_oxjeu2knwj" ON "qti"."catalog_ref" IS 'key CatalogRef(document, token, the index of the family CatalogTarget.carriers)';

COMMENT ON CONSTRAINT "__cn_part_text_key_node_index_parts_55infb65el" ON "qti"."cn_part_text" IS 'key CnPartText(node, the index of the family MathCn.parts)';

COMMENT ON CONSTRAINT "__cn_slot_key_node_index_parts_s327dt6gcg" ON "qti"."cn_slot" IS 'key CnSlot(node, the index of the family CnCount.parts)';

COMMENT ON CONSTRAINT "__expression_attribute_key_node_emltek4plt" ON "qti"."expression_attribute" IS 'key ExpressionAttribute(node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"weight-identifier"}})';

COMMENT ON CONSTRAINT "__expression_attribute_key_node_s4lcb7r25q" ON "qti"."expression_attribute" IS 'key ExpressionAttribute(node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"weight-identifier"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}})';

COMMENT ON CONSTRAINT "__map_key_key_node_euxthmmamh" ON "qti"."map_key" IS 'key MapKey(node where {"args":[{"arg":{"args":[{"field":"caseText","kind":"field"}],"fn":"collapse","kind":"compute"},"kind":"in","values":["1","true"]},{"kind":"compare","left":{"field":"folded","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"or"})';

COMMENT ON CONSTRAINT "__mapping_item_ref_type_key_node_index_types_ky3zixsxla" ON "qti"."mapping_item_ref_type" IS 'key MappingItemRefType(node, the index of the family MappingItemRef.types)';

COMMENT ON CONSTRAINT "__math_align_group_key_cell_index_groups_k6z3373rev" ON "qti"."math_align_group" IS 'key MathAlignGroup(cell, the index of the family MathCell.groups)';

COMMENT ON CONSTRAINT "__math_align_scope_key_node_cell_element_children_25ok6cyfso" ON "qti"."math_align_scope" IS 'key MathAlignScope(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, cell where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, elementChildren)';

COMMENT ON CONSTRAINT "__math_argument_key_parent_index_arguments_7tvavwrkx4" ON "qti"."math_argument" IS 'key MathArgument(parent, the index of the family MathApply.arguments)';

COMMENT ON CONSTRAINT "__math_qualifier_key_parent_index_owned_xajpz5cojd" ON "qti"."math_qualifier" IS 'key MathQualifier(parent, the index of the family MathApply.owned)';

COMMENT ON CONSTRAINT "__node_key_id_parent_kind_bcix5a5ymv" ON "qti"."node" IS 'key Node(id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:bvar","m:condition","m:degree","m:domainofapplication","m:interval","m:logbase","m:lowlimit","m:momentabout","m:uplimit"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}}, parentKind)';

COMMENT ON CONSTRAINT "__node_key_id_parent_kind_cy4qhoyaol" ON "qti"."node" IS 'key Node(id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:degree","m:logbase","m:momentabout"]} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}}, parentKind)';

COMMENT ON CONSTRAINT "__node_key_id_vuxeuhz6wl" ON "qti"."node" IS 'key Node(id where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]})';

COMMENT ON CONSTRAINT "__node_key_id_kind_ge47i2ygoj" ON "qti"."node" IS 'key Node(id where {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"baseType"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}} and {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"fieldIdentifier"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}}, kind)';

COMMENT ON CONSTRAINT "__node_key_id_kind_qlw5xvtx32" ON "qti"."node" IS 'key Node(id where {"kind":"compare","left":{"field":"elementChildren","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}}, kind)';

COMMENT ON CONSTRAINT "__node_key_parent_kind_vjnqmkdkwf" ON "qti"."node" IS 'key Node(parent where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}, kind where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}})';

COMMENT ON CONSTRAINT "__node_key_parent_n6ugjuynxn" ON "qti"."node" IS 'key Node(parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-interaction-modules"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}})';

COMMENT ON CONSTRAINT "__pci_module_form_key_node_index_module_forms_kenqhn3tdh" ON "qti"."pci_module_form" IS 'key PciModuleForm(node, the index of the family Interaction.moduleForms)';

COMMENT ON CONSTRAINT "__pci_module_form_key_node_nrpdftegvy" ON "qti"."pci_module_form" IS 'key PciModuleForm(node where {"kind":"compare","left":{"field":"element","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}})';

COMMENT ON CONSTRAINT "__pci_module_form_key_node_splfudugs3" ON "qti"."pci_module_form" IS 'key PciModuleForm(node where {"kind":"compare","left":{"field":"element","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}})';

COMMENT ON CONSTRAINT "__placed_body_xml_lang_key_assembly_lang_index_v66hyc3wfy" ON "qti"."placed_body_xml_lang" IS 'key PlacedBodyXmlLang(assembly, lang, the index of the family AssembledLang.carriers)';

COMMENT ON CONSTRAINT "__placed_catalog_ref_key_document_id_index_iswbldjobt" ON "qti"."placed_catalog_ref" IS 'key PlacedCatalogRef(document, id, the index of the family CatalogTarget.placements)';

COMMENT ON CONSTRAINT "__placed_share_target_key_node_index_placements_3icgczeljm" ON "qti"."placed_share_target" IS 'key PlacedShareTarget(node, the index of the family ShareFragment.placements)';

COMMENT ON CONSTRAINT "__placed_xml_lang_key_instance_node_54e5cx3n65" ON "qti"."placed_xml_lang" IS 'key PlacedXmlLang(instance where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}})';

COMMENT ON CONSTRAINT "__reading_key_assembly_node_attribute_fl3364kuzj" ON "qti"."reading" IS 'key Reading(assembly where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, node where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, attribute where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}})';

COMMENT ON CONSTRAINT "__reading_key_assembly_node_attribute_kind_4uz6oovfmo" ON "qti"."reading" IS 'key Reading(assembly where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, node where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, attribute where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, kind where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}})';

COMMENT ON CONSTRAINT "__reference_key_node_3jgv6f5ia4" ON "qti"."reference" IS 'key Reference(node where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"href"}} and {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"external"}})';

COMMENT ON CONSTRAINT "__text_reference_key_node_crsbkqx6xo" ON "qti"."text_reference" IS 'key TextReference(node where {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"entry"}})';

COMMENT ON CONSTRAINT "__usage_value_key_node_base_type_lexical_o4cwubtrum" ON "qti"."usage_value" IS 'key UsageValue(node where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]}, baseTypeLexical where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]})';

COMMENT ON CONSTRAINT "__xml_lang_key_node_764mfogklt" ON "qti"."xml_lang" IS 'key XmlLang(node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}})';

COMMENT ON CONSTRAINT "__body_xml_lang_check_body_xml_lang_counted_document_7uz655ja2x" ON "qti"."body_xml_lang" IS 'check of BodyXmlLang for law counted BodyXmlLang(document, lang) in fin(DocumentLang, carriers)';

COMMENT ON CONSTRAINT "__catalog_ref_check_catalog_ref_counted_catalog_cafuo6yk4k" ON "qti"."catalog_ref" IS 'check of CatalogRef for law counted CatalogRef(document, token) in fin(CatalogTarget, carriers)';

COMMENT ON CONSTRAINT "__cell_leaf_check_cell_leaf_ordered_math_cell_leaves_jh2rpirr2u" ON "qti"."cell_leaf" IS 'check of CellLeaf for law ordered CellLeaf(cell, at) in fin(MathCell, leaves)';

COMMENT ON CONSTRAINT "__cn_part_text_check_cn_part_text_counted_math_cn_rczhlqv7bo" ON "qti"."cn_part_text" IS 'check of CnPartText for law counted CnPartText(node) in fin(MathCn, parts)';

COMMENT ON CONSTRAINT "__cn_slot_check_cn_slot_counted_cn_count_parts_or3h2bklda" ON "qti"."cn_slot" IS 'check of CnSlot for law counted CnSlot(node) in fin(CnCount, parts)';

COMMENT ON CONSTRAINT "__mapping_item_ref_type_check_mapping_item_ref_type_3um7bivbxr" ON "qti"."mapping_item_ref_type" IS 'check of MappingItemRefType for law counted MappingItemRefType(node) in fin(MappingItemRef, types)';

COMMENT ON CONSTRAINT "__math_align_group_check_math_align_group_counted_2bwxfv5hv7" ON "qti"."math_align_group" IS 'check of MathAlignGroup for law counted MathAlignGroup(cell) in fin(MathCell, groups)';

COMMENT ON CONSTRAINT "__math_argument_check_math_argument_counted_math_2z2tysp7hf" ON "qti"."math_argument" IS 'check of MathArgument for law counted MathArgument(parent) in fin(MathApply, arguments)';

COMMENT ON CONSTRAINT "__math_qualifier_check_math_qualifier_counted_math_wwx2nb44en" ON "qti"."math_qualifier" IS 'check of MathQualifier for law counted MathQualifier(parent) in fin(MathApply, owned)';

COMMENT ON CONSTRAINT "__pci_module_form_check_pci_module_form_counted_jknj5oskoa" ON "qti"."pci_module_form" IS 'check of PciModuleForm for law counted PciModuleForm(node) in fin(Interaction, moduleForms)';

COMMENT ON CONSTRAINT "__placed_body_xml_lang_check_placed_body_xml_lang_5jqhk6gttk" ON "qti"."placed_body_xml_lang" IS 'check of PlacedBodyXmlLang for law counted PlacedBodyXmlLang(assembly, lang) in fin(AssembledLang, carriers)';

COMMENT ON CONSTRAINT "__placed_catalog_ref_check_placed_catalog_ref_krdhkztrgr" ON "qti"."placed_catalog_ref" IS 'check of PlacedCatalogRef for law counted PlacedCatalogRef(document, id) in fin(CatalogTarget, placements)';

COMMENT ON CONSTRAINT "__placed_share_target_check_placed_share_target_uarziaecww" ON "qti"."placed_share_target" IS 'check of PlacedShareTarget for law counted PlacedShareTarget(node) in fin(ShareFragment, placements)';

COMMENT ON CONSTRAINT "__assembled_catalog_fk_assembly_id_owner_ekec2zy4ps" ON "qti"."assembled_catalog" IS 'foreign key AssembledCatalog(assembly, id, owner) to AssembledId(assembly, id, owner)';

COMMENT ON CONSTRAINT "__assembled_catalog_fk_owner_5yszz2m3jg" ON "qti"."assembled_catalog" IS 'foreign key AssembledCatalog(owner) to CatalogId(node)';

COMMENT ON CONSTRAINT "__assembled_lang_fk_assembly_lang_pred_carriers_5r6dfhjw6u" ON "qti"."assembled_lang" IS 'foreign key AssembledLang(assembly, lang, pred(carriers)) to PlacedBodyXmlLang(assembly, lang, the index of the family AssembledLang.carriers)';

COMMENT ON CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_oitw7yxsm2" ON "qti"."assembled_reference" IS 'foreign key AssembledReference(assembly where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"} and {"kind":"compare","left":{"args":[{"field":"kind","kind":"field"},{"field":"attribute","kind":"field"}],"field":"spelling","kind":"closedAt","relation":"VariableReference"},"op":"eq","right":{"kind":"literal","value":"bare"}} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}, node where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"} and {"kind":"compare","left":{"args":[{"field":"kind","kind":"field"},{"field":"attribute","kind":"field"}],"field":"spelling","kind":"closedAt","relation":"VariableReference"},"op":"eq","right":{"kind":"literal","value":"bare"}} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}, attribute where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"} and {"kind":"compare","left":{"args":[{"field":"kind","kind":"field"},{"field":"attribute","kind":"field"}],"field":"spelling","kind":"closedAt","relation":"VariableReference"},"op":"eq","right":{"kind":"literal","value":"bare"}} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}) to Reading(assembly where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, node where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, attribute where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}})';

COMMENT ON CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_wvtn6n63rg" ON "qti"."assembled_reference" IS 'foreign key AssembledReference(assembly where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}, node where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}, attribute where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}, kind where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]} and {"kind":"compare","left":{"field":"role","kind":"field"},"op":"eq","right":{"kind":"literal","value":"variable"}}) to Reading(assembly where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, node where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, attribute where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, kind where {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}})';

COMMENT ON CONSTRAINT "__attribute_fk_node_document_lexical_b56655356a" ON "qti"."attribute" IS 'foreign key Attribute(node where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}}, document where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}}, lexical where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}}) to CatalogRef(node, document, lexical)';

COMMENT ON CONSTRAINT "__attribute_fk_node_lexical_cfe5nxthbz" ON "qti"."attribute" IS 'foreign key Attribute(node where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["ud:value"]} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"baseType"}}, lexical where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["ud:value"]} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"baseType"}}) to UsageBaseType(node, lexical)';

COMMENT ON CONSTRAINT "__attribute_fk_node_name_lexical_mgnenhufg5" ON "qti"."attribute" IS 'foreign key Attribute(node where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}, name where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}, lexical where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}) to CnAttribute(node, name, lexical)';

COMMENT ON CONSTRAINT "__attribute_fk_node_document_lexical_gyd44qmtvi" ON "qti"."attribute" IS 'foreign key Attribute(node where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"}, document where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"}, lexical where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"}) to DocumentId(node, document, lexical)';

COMMENT ON CONSTRAINT "__attribute_fk_node_document_lexical_n3fq766zy6" ON "qti"."attribute" IS 'foreign key Attribute(node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}}, document where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}}, lexical where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}}) to ShareFragment(node, document, src)';

COMMENT ON CONSTRAINT "__attribute_fk_node_document_ug3se24mbh" ON "qti"."attribute" IS 'foreign key Attribute(node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-catalog"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"id"}}, document where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-catalog"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"id"}}) to CatalogId(node, document)';

COMMENT ON CONSTRAINT "__attribute_fk_node_lexical_zedikqrucf" ON "qti"."attribute" IS 'foreign key Attribute(node where {"args":[{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"1"}},{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"true"}}],"kind":"or"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"default"}}, lexical where {"args":[{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"1"}},{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"true"}}],"kind":"or"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"default"}}) to DefaultEntry(node, lexical)';

COMMENT ON CONSTRAINT "__attribute_fk_node_lexical_tag_selection_written_oopputu4ww" ON "qti"."attribute" IS 'foreign key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"selection"}}, lexical where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"selection"}}, tag MathAction.selectionWritten = true) to MathAction(node, selectionLexical, selectionWritten)';

COMMENT ON CONSTRAINT "__attribute_fk_node_lexical_noy2h3xyxk" ON "qti"."attribute" IS 'foreign key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"support"}}, lexical where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"support"}}) to CardSupport(node, lexical)';

COMMENT ON CONSTRAINT "__attribute_fk_node_lexical_5tchtzrw5z" ON "qti"."attribute" IS 'foreign key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"case-sensitive"}}, lexical where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"case-sensitive"}}) to MapKey(node, caseText)';

COMMENT ON CONSTRAINT "__attribute_fk_node_tag_element_false_fwdow2gkzv" ON "qti"."attribute" IS 'foreign key Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"module"}}, tag PciModuleForm.element = false) to PciModuleForm(node, element)';

COMMENT ON CONSTRAINT "__attribute_fk_node_lexical_o7iocxhk7i" ON "qti"."attribute" IS 'foreign key Attribute(node where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"dir"}}, lexical where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"dir"}}) to MathDir(node, lexical)';

COMMENT ON CONSTRAINT "__body_xml_lang_fk_document_lang_copy_carriers_fgsaypr7ky" ON "qti"."body_xml_lang" IS 'foreign key BodyXmlLang(document, lang, the owner''s count of the family DocumentLang.carriers) to DocumentLang(document, lang, carriers)';

COMMENT ON CONSTRAINT "__body_xml_lang_fk_document_lang_predecessor_kes6tiuvcv" ON "qti"."body_xml_lang" IS 'foreign key BodyXmlLang(document, lang, the predecessor of the index of the family DocumentLang.carriers) to BodyXmlLang(document, lang, the index of the family DocumentLang.carriers)';

COMMENT ON CONSTRAINT "__body_xml_lang_fk_node_p2byvzuucl" ON "qti"."body_xml_lang" IS 'foreign key BodyXmlLang(node) to XmlLang(node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}})';

COMMENT ON CONSTRAINT "__card_support_fk_node_2tzodyozy6" ON "qti"."card_support" IS 'foreign key CardSupport(node) to Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"support"}})';

COMMENT ON CONSTRAINT "__card_support_fk_node_document_kind_start_nearest_6wd7fjyybd" ON "qti"."card_support" IS 'foreign key CardSupport(node, document, kind, start, nearest, version, catalog) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__catalog_id_fk_node_kf3go6qa4s" ON "qti"."catalog_id" IS 'foreign key CatalogId(node) to Attribute(node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-catalog"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"id"}})';

COMMENT ON CONSTRAINT "__catalog_id_fk_node_document_id_owner_4v7yantsxo" ON "qti"."catalog_id" IS 'foreign key CatalogId(node, document, id, owner) to DocumentId(node, document, id, owner)';

COMMENT ON CONSTRAINT "__catalog_ref_fk_document_token_copy_carriers_bxevpkrem7" ON "qti"."catalog_ref" IS 'foreign key CatalogRef(document, token, the owner''s count of the family CatalogTarget.carriers) to CatalogTarget(document, id, carriers)';

COMMENT ON CONSTRAINT "__catalog_ref_fk_document_token_predecessor_carriers_m5isvjpdf2" ON "qti"."catalog_ref" IS 'foreign key CatalogRef(document, token, the predecessor of the index of the family CatalogTarget.carriers) to CatalogRef(document, token, the index of the family CatalogTarget.carriers)';

COMMENT ON CONSTRAINT "__catalog_ref_fk_node_zmkvtdbt2z" ON "qti"."catalog_ref" IS 'foreign key CatalogRef(node) to Attribute(node where {"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["IDREF","IDREFS"]} and {"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"ne","right":{"kind":"literal","value":""}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"data-catalog-idref"}})';

COMMENT ON CONSTRAINT "__catalog_scope_fk_node_document_kind_start_nearest_kidkhgmdkn" ON "qti"."catalog_scope" IS 'foreign key CatalogScope(node, document, kind, start, nearest, version, parent) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__catalog_scope_fk_parent_scope_27pvvrmsuk" ON "qti"."catalog_scope" IS 'foreign key CatalogScope(parent where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-catalog-info"}}, scope where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-catalog-info"}}) to CatalogScope(node, scope)';

COMMENT ON CONSTRAINT "__catalog_target_fk_document_assembled_svpeqilcut" ON "qti"."catalog_target" IS 'foreign key CatalogTarget(document, assembled) to Document(node, assembled)';

COMMENT ON CONSTRAINT "__catalog_target_fk_document_id_pred_carriers_tcpv4fo6np" ON "qti"."catalog_target" IS 'foreign key CatalogTarget(document, id, pred(carriers)) to CatalogRef(document, token, the index of the family CatalogTarget.carriers)';

COMMENT ON CONSTRAINT "__catalog_target_fk_document_id_pred_placements_ojtjobkxh5" ON "qti"."catalog_target" IS 'foreign key CatalogTarget(document, id, pred(placements)) to PlacedCatalogRef(document, id, the index of the family CatalogTarget.placements)';

COMMENT ON CONSTRAINT "__catalog_target_fk_document_id_ogf6h7fc5r" ON "qti"."catalog_target" IS 'foreign key CatalogTarget(document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}, id where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}) to CatalogId(document, id)';

COMMENT ON CONSTRAINT "__catalog_target_fk_document_placements_flylpuclcc" ON "qti"."catalog_target" IS 'foreign key CatalogTarget(document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}, placements where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}) to TestDocument(node, instances)';

COMMENT ON CONSTRAINT "__cell_leaf_fk_cell_copy_leaves_groups_cv35pjribv" ON "qti"."cell_leaf" IS 'foreign key CellLeaf(cell, the owner''s count of the family MathCell.leaves, groups) to MathCell(node, leaves, groups)';

COMMENT ON CONSTRAINT "__cell_leaf_fk_cell_pred_at_start_was_yoa25lqkhu" ON "qti"."cell_leaf" IS 'foreign key CellLeaf(cell, pred(at), startWas) to CellLeaf(cell, at, startAfter)';

COMMENT ON CONSTRAINT "__cell_leaf_fk_node_cell_tag_element_children_0_hzblzfrx3z" ON "qti"."cell_leaf" IS 'foreign key CellLeaf(node, cell, tag MathAlignScope.elementChildren = 0) to MathAlignScope(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, cell where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, elementChildren)';

COMMENT ON CONSTRAINT "__cell_leaf_fk_node_document_kind_start_nearest_6hrxyjqhym" ON "qti"."cell_leaf" IS 'foreign key CellLeaf(node, document, kind, start, nearest, version, parent) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__cn_attribute_fk_node_name_fplssc7kn4" ON "qti"."cn_attribute" IS 'foreign key CnAttribute(node, name) to Attribute(node where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}}, name where {"arg":{"field":"name","kind":"field"},"kind":"in","values":["base","type"]} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:cn"}})';

COMMENT ON CONSTRAINT "__cn_count_fk_node_tag_kind_m_cn_dgcj2thke3" ON "qti"."cn_count" IS 'foreign key CnCount(node, tag Node.kind = m:cn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__cn_count_fk_node_pred_parts_dan34ckzy4" ON "qti"."cn_count" IS 'foreign key CnCount(node, pred(parts)) to CnSlot(node, the index of the family CnCount.parts)';

COMMENT ON CONSTRAINT "__cn_count_fk_node_type_lexical_tag_name_type_y4qtgpy3dl" ON "qti"."cn_count" IS 'foreign key CnCount(node where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}, typeLexical where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}, tag CnAttribute.name = type) to CnAttribute(node, lexical, name)';

COMMENT ON CONSTRAINT "__cn_part_text_fk_node_copy_parts_base_type_3s7bdcqh5p" ON "qti"."cn_part_text" IS 'foreign key CnPartText(node, the owner''s count of the family MathCn.parts, base, type) to MathCn(node, parts, base, type)';

COMMENT ON CONSTRAINT "__cn_part_text_fk_node_predecessor_parts_otxr6eueju" ON "qti"."cn_part_text" IS 'foreign key CnPartText(node, the predecessor of the index of the family MathCn.parts) to CnPartText(node, the index of the family MathCn.parts)';

COMMENT ON CONSTRAINT "__cn_slot_fk_node_copy_parts_type_ngqx34jml5" ON "qti"."cn_slot" IS 'foreign key CnSlot(node, the owner''s count of the family CnCount.parts, type) to CnCount(node, parts, type)';

COMMENT ON CONSTRAINT "__cn_slot_fk_node_predecessor_parts_nijdpjnsvu" ON "qti"."cn_slot" IS 'foreign key CnSlot(node, the predecessor of the index of the family CnCount.parts) to CnSlot(node, the index of the family CnCount.parts)';

COMMENT ON CONSTRAINT "__declaration_fk_parent_parent_kind_sdetvssoyz" ON "qti"."declaration" IS 'foreign key Declaration(parent, parentKind) to Node(id, kind)';

COMMENT ON CONSTRAINT "__declaration_identifier_fk_node_parent_kind_3dscbdoq46" ON "qti"."declaration_identifier" IS 'foreign key DeclarationIdentifier(node, parentKind) to Declaration(node, parentKind)';

COMMENT ON CONSTRAINT "__declaration_identifier_fk_node_tag_base_type_float_vs52isv4wp" ON "qti"."declaration_identifier" IS 'foreign key DeclarationIdentifier(node where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-outcome-declaration"}} and {"kind":"compare","left":{"field":"identifier","kind":"field"},"op":"eq","right":{"kind":"literal","value":"MAXSCORE"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-assessment-test"}}, tag DeclarationBaseType.baseType = float) to DeclarationBaseType(node, baseType)';

COMMENT ON CONSTRAINT "__declaration_identifier_fk_node_tag_base_type_float_3cka6y7gbd" ON "qti"."declaration_identifier" IS 'foreign key DeclarationIdentifier(node where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-outcome-declaration"}} and {"kind":"compare","left":{"field":"identifier","kind":"field"},"op":"eq","right":{"kind":"literal","value":"SCORE"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-assessment-test"}}, tag DeclarationBaseType.baseType = float) to DeclarationBaseType(node, baseType)';

COMMENT ON CONSTRAINT "__declaration_name_fk_node_parent_kind_k3m4af6di6" ON "qti"."declaration_name" IS 'foreign key DeclarationName(node, parentKind) to Declaration(node, parentKind)';

COMMENT ON CONSTRAINT "__default_entry_fk_node_vkxcobelp3" ON "qti"."default_entry" IS 'foreign key DefaultEntry(node) to Attribute(node where {"args":[{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"1"}},{"kind":"compare","left":{"args":[{"field":"lexical","kind":"field"}],"fn":"collapse","kind":"compute"},"op":"eq","right":{"kind":"literal","value":"true"}}],"kind":"or"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-card-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"default"}})';

COMMENT ON CONSTRAINT "__default_entry_fk_node_document_kind_start_nearest_tjzq6q7xnp" ON "qti"."default_entry" IS 'foreign key DefaultEntry(node, document, kind, start, nearest, version, card) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__document_id_fk_node_3lqobcjlo4" ON "qti"."document_id" IS 'foreign key DocumentId(node where {"kind":"compare","left":{"field":"node","kind":"field"},"op":"eq","right":{"field":"owner","kind":"field"}}) to Attribute(node where {"args":[{"args":[{"arg":{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"field":"identity","kind":"closedAt","relation":"ValueIdentity"},"kind":"in","values":["ID"]},{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"field":"name","kind":"field"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"field":"domain","kind":"closedAt","relation":"AttributeGrammar"}],"kind":"closedHas","relation":"ValueIdentity"}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-context-declaration"}},{"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}}],"kind":"and"}],"kind":"or"} and {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^[\\t\\n\\r ]*(?:[A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3][\\-.0-9A-Z_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u02D0\\u02D1\\u0300-\\u0345\\u0360\\u0361\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0483-\\u0486\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0640-\\u0652\\u0660-\\u0669\\u0670-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5-\\u06E8\\u06EA-\\u06ED\\u06F0-\\u06F9\\u0901-\\u0903\\u0905-\\u0939\\u093C-\\u094D\\u0951-\\u0954\\u0958-\\u0963\\u0966-\\u096F\\u0981-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A02\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A74\\u0A81-\\u0A83\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE0\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3C-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B66-\\u0B6F\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0BE7-\\u0BEF\\u0C01-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C60\\u0C61\\u0C66-\\u0C6F\\u0C82\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0\\u0CE1\\u0CE6-\\u0CEF\\u0D02\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D60\\u0D61\\u0D66-\\u0D6F\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F69\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u20D0-\\u20DC\\u20E1\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3005\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3041-\\u3094\\u3099\\u309A\\u309D\\u309E\\u30A1-\\u30FA\\u30FC-\\u30FE\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3]*)[\\t\\n\\r ]*$"}],"fn":"matches","kind":"compute"})';

COMMENT ON CONSTRAINT "__document_lang_fk_document_lang_pred_carriers_lsfzp5pr7j" ON "qti"."document_lang" IS 'foreign key DocumentLang(document, lang, pred(carriers)) to BodyXmlLang(document, lang, the index of the family DocumentLang.carriers)';

COMMENT ON CONSTRAINT "__expression_fk_node_tag_attribute_weight_identifier_xha6ehimx5" ON "qti"."expression" IS 'foreign key Expression(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-test-variables"}}, tag ExpressionAttribute.attribute = weight-identifier) to ExpressionAttribute(node, attribute)';

COMMENT ON CONSTRAINT "__expression_attribute_fk_node_tag_attribute_weight_3bbn7mwuvv" ON "qti"."expression_attribute" IS 'foreign key ExpressionAttribute(node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"base-type"}} and {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"float"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}, tag ExpressionAttribute.attribute = weight-identifier, tag ExpressionAttribute.written = true) to ExpressionAttribute(node, attribute, written)';

COMMENT ON CONSTRAINT "__expression_attribute_fk_node_written_tag_attribute_xlnzrhw46c" ON "qti"."expression_attribute" IS 'foreign key ExpressionAttribute(node where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"base-type"}} and {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unknown"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}, written where {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"base-type"}} and {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unknown"}} and {"kind":"compare","left":{"field":"written","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}, tag ExpressionAttribute.attribute = weight-identifier) to ExpressionAttribute(node, written, attribute)';

COMMENT ON CONSTRAINT "__idref_target_fk_document_copy_idref_targets_pslze4v7in" ON "qti"."idref_target" IS 'foreign key IdrefTarget(document, the owner''s count of the family Document.idrefTargets, assembled) to Document(node, idrefTargets, assembled)';

COMMENT ON CONSTRAINT "__interaction_fk_node_pred_module_forms_vvfps6m5vs" ON "qti"."interaction" IS 'foreign key Interaction(node, pred(moduleForms)) to PciModuleForm(node, the index of the family Interaction.moduleForms)';

COMMENT ON CONSTRAINT "__map_key_fk_node_wy7ookj3zp" ON "qti"."map_key" IS 'foreign key MapKey(node where {"kind":"compare","left":{"field":"caseText","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}) to Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-entry"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"case-sensitive"}})';

COMMENT ON CONSTRAINT "__map_key_fk_node_tag_base_type_string_ogbc2e2kqg" ON "qti"."map_key" IS 'foreign key MapKey(node where {"kind":"compare","left":{"field":"folded","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}, tag MapKeyType.baseType = string) to MapKeyType(node, baseType)';

COMMENT ON CONSTRAINT "__map_key_type_fk_node_6aevd6gybc" ON "qti"."map_key_type" IS 'foreign key MapKeyType(node where {"kind":"compare","left":{"field":"baseType","kind":"field"},"op":"eq","right":{"kind":"literal","value":"string"}}) to MapKey(node where {"args":[{"arg":{"args":[{"field":"caseText","kind":"field"}],"fn":"collapse","kind":"compute"},"kind":"in","values":["1","true"]},{"kind":"compare","left":{"field":"folded","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"or"})';

COMMENT ON CONSTRAINT "__mapping_item_ref_fk_node_item_ref_kdh4hh5idh" ON "qti"."mapping_item_ref" IS 'foreign key MappingItemRef(node, itemRef) to VariableMapping(node, parent)';

COMMENT ON CONSTRAINT "__mapping_item_ref_fk_node_pred_types_4qikxvvfjd" ON "qti"."mapping_item_ref" IS 'foreign key MappingItemRef(node, pred(types)) to MappingItemRefType(node, the index of the family MappingItemRef.types)';

COMMENT ON CONSTRAINT "__mapping_item_ref_fk_node_44jf3bd4kv" ON "qti"."mapping_item_ref" IS 'foreign key MappingItemRef(node where {"kind":"compare","left":{"field":"types","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}}) to MappingSourceDeclaration(node)';

COMMENT ON CONSTRAINT "__mapping_item_ref_type_fk_item_ref_type_rk6dkgqyty" ON "qti"."mapping_item_ref_type" IS 'foreign key MappingItemRefType(itemRef, type) to ItemRefTarget(node, type)';

COMMENT ON CONSTRAINT "__mapping_item_ref_type_fk_node_copy_types_item_ref_sj6kjtkfsk" ON "qti"."mapping_item_ref_type" IS 'foreign key MappingItemRefType(node, the owner''s count of the family MappingItemRef.types, itemRef) to MappingItemRef(node, types, itemRef)';

COMMENT ON CONSTRAINT "__mapping_item_ref_type_fk_node_predecessor_types_5f5rza25gi" ON "qti"."mapping_item_ref_type" IS 'foreign key MappingItemRefType(node, the predecessor of the index of the family MappingItemRef.types) to MappingItemRefType(node, the index of the family MappingItemRef.types)';

COMMENT ON CONSTRAINT "__mapping_item_ref_type_fk_node_qwfte5hz7f" ON "qti"."mapping_item_ref_type" IS 'foreign key MappingItemRefType(node where {"arg":{"arg":{"field":"type","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},"kind":"not"}) to MappingSourceDeclaration(node)';

COMMENT ON CONSTRAINT "__math_action_fk_node_elements_element_children_75g6uypt27" ON "qti"."math_action" IS 'foreign key MathAction(node, elements, elementChildren) to Node(id, elements, elementChildren)';

COMMENT ON CONSTRAINT "__math_action_fk_node_tag_kind_m_maction_bse3y3zneq" ON "qti"."math_action" IS 'foreign key MathAction(node, tag Node.kind = m:maction) to Node(id, kind)';

COMMENT ON CONSTRAINT "__math_action_fk_node_qcsceuvnc3" ON "qti"."math_action" IS 'foreign key MathAction(node where {"kind":"compare","left":{"field":"selectionWritten","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}) to Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"selection"}})';

COMMENT ON CONSTRAINT "__math_align_group_fk_cell_copy_groups_qdcdewar35" ON "qti"."math_align_group" IS 'foreign key MathAlignGroup(cell, the owner''s count of the family MathCell.groups) to MathCell(node, groups)';

COMMENT ON CONSTRAINT "__math_align_group_fk_cell_predecessor_groups_txapyab7ky" ON "qti"."math_align_group" IS 'foreign key MathAlignGroup(cell, the predecessor of the index of the family MathCell.groups) to MathAlignGroup(cell, the index of the family MathCell.groups)';

COMMENT ON CONSTRAINT "__math_align_group_fk_node_cell_hrvj2cek2h" ON "qti"."math_align_group" IS 'foreign key MathAlignGroup(node, cell) to MathAlignScope(node, cell)';

COMMENT ON CONSTRAINT "__math_align_group_fk_node_tag_kind_m_maligngroup_xuyva3ew4v" ON "qti"."math_align_group" IS 'foreign key MathAlignGroup(node, tag MathAlignScope.kind = m:maligngroup, tag MathAlignScope.state = open) to MathAlignScope(node, kind, state)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_node_document_kind_start_6xrkulhxz6" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(node, document, kind, start, nearest, version, parent) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_node_elements_element_children_v2lzlw5g2e" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(node, elements, elementChildren) to Node(id, elements, elementChildren)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_node_dir_lexical_irzy7clva2" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(node where {"kind":"compare","left":{"field":"dirLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}, dirLexical where {"kind":"compare","left":{"field":"dirLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}) to MathDir(node, lexical)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_node_dg6zzrbijv" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(node where {"kind":"compare","left":{"field":"elementChildren","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:0"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}) to CellLeaf(node)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_node_cell_pjjpknuypt" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maligngroup"}} and {"kind":"compare","left":{"field":"state","kind":"field"},"op":"eq","right":{"kind":"literal","value":"open"}}, cell where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maligngroup"}} and {"kind":"compare","left":{"field":"state","kind":"field"},"op":"eq","right":{"kind":"literal","value":"open"}}) to MathAlignGroup(node, cell)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_node_tag_kind_m_mtd_kqn5didktq" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:mtd"}}, tag Node.kind = m:mtd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_parent_cell_received_parent_ran2qliciz" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, cell where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, received where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, parentKind where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}, inherited where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}}) to MathAlignScope(node, cell, passes, kind, own)';

COMMENT ON CONSTRAINT "__math_align_scope_fk_parent_chosen_hcyh75uekm" ON "qti"."math_align_scope" IS 'foreign key MathAlignScope(parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}}, chosen where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:mtd"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}}) to MathAction(node, selection)';

COMMENT ON CONSTRAINT "__math_apply_fk_node_document_kind_start_nearest_btuhu2ytan" ON "qti"."math_apply" IS 'foreign key MathApply(node, document, kind, start, nearest, version, parent) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__math_apply_fk_node_elements_element_children_gmue6ywvhs" ON "qti"."math_apply" IS 'foreign key MathApply(node, elements, elementChildren) to Node(id, elements, elementChildren)';

COMMENT ON CONSTRAINT "__math_apply_fk_node_operator_2t5hgnyaic" ON "qti"."math_apply" IS 'foreign key MathApply(node, operator) to Node(parent where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}, kind where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}})';

COMMENT ON CONSTRAINT "__math_apply_fk_node_tag_kind_m_apply_ppxr3wftcz" ON "qti"."math_apply" IS 'foreign key MathApply(node, tag Node.kind = m:apply) to Node(id where {"kind":"compare","left":{"field":"elementChildren","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}}, kind)';

COMMENT ON CONSTRAINT "__math_apply_fk_node_pred_arguments_ptukl45d6h" ON "qti"."math_apply" IS 'foreign key MathApply(node, pred(arguments)) to MathArgument(parent, the index of the family MathApply.arguments)';

COMMENT ON CONSTRAINT "__math_apply_fk_node_pred_owned_tmi6hngkj4" ON "qti"."math_apply" IS 'foreign key MathApply(node, pred(owned)) to MathQualifier(parent, the index of the family MathApply.owned)';

COMMENT ON CONSTRAINT "__math_argument_fk_node_document_kind_start_nearest_ooj6catlae" ON "qti"."math_argument" IS 'foreign key MathArgument(node, document, kind, start, nearest, version, parent) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__math_argument_fk_node_tag_parent_kind_m_apply_r4xstjnki4" ON "qti"."math_argument" IS 'foreign key MathArgument(node, tag Node.parentKind = m:apply) to Node(id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:bvar","m:condition","m:degree","m:domainofapplication","m:interval","m:logbase","m:lowlimit","m:momentabout","m:uplimit"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}}, parentKind)';

COMMENT ON CONSTRAINT "__math_argument_fk_parent_copy_arguments_xhyp4jfctf" ON "qti"."math_argument" IS 'foreign key MathArgument(parent, the owner''s count of the family MathApply.arguments) to MathApply(node, arguments)';

COMMENT ON CONSTRAINT "__math_argument_fk_parent_predecessor_arguments_7ob7dek3qu" ON "qti"."math_argument" IS 'foreign key MathArgument(parent, the predecessor of the index of the family MathApply.arguments) to MathArgument(parent, the index of the family MathApply.arguments)';

COMMENT ON CONSTRAINT "__math_cell_fk_node_tag_kind_m_mtd_a4j5agf7vn" ON "qti"."math_cell" IS 'foreign key MathCell(node, tag Node.kind = m:mtd) to Node(id, kind)';

COMMENT ON CONSTRAINT "__math_cell_fk_node_pred_groups_tjwta7waho" ON "qti"."math_cell" IS 'foreign key MathCell(node, pred(groups)) to MathAlignGroup(cell, the index of the family MathCell.groups)';

COMMENT ON CONSTRAINT "__math_cell_fk_node_pred_leaves_last_start_cwy64vl2xb" ON "qti"."math_cell" IS 'foreign key MathCell(node, pred(leaves), lastStart) to CellLeaf(cell, at, startAfter)';

COMMENT ON CONSTRAINT "__math_cn_fk_node_type_qekjshdq4p" ON "qti"."math_cn" IS 'foreign key MathCn(node, type) to CnCount(node, type)';

COMMENT ON CONSTRAINT "__math_cn_fk_node_tag_kind_m_cn_o2zsp4fwgi" ON "qti"."math_cn" IS 'foreign key MathCn(node, tag Node.kind = m:cn) to Node(id, kind)';

COMMENT ON CONSTRAINT "__math_cn_fk_node_pred_parts_fpgi5v324u" ON "qti"."math_cn" IS 'foreign key MathCn(node, pred(parts)) to CnPartText(node, the index of the family MathCn.parts)';

COMMENT ON CONSTRAINT "__math_cn_fk_node_base_lexical_tag_name_base_3iztbgywjo" ON "qti"."math_cn" IS 'foreign key MathCn(node where {"kind":"compare","left":{"field":"baseLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}, baseLexical where {"kind":"compare","left":{"field":"baseLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}, tag CnAttribute.name = base) to CnAttribute(node, lexical, name)';

COMMENT ON CONSTRAINT "__math_cn_fk_node_type_lexical_tag_name_type_bu3mdjozzc" ON "qti"."math_cn" IS 'foreign key MathCn(node where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}, typeLexical where {"kind":"compare","left":{"field":"typeLexical","kind":"field"},"op":"ne","right":{"kind":"literal","value":""}}, tag CnAttribute.name = type) to CnAttribute(node, lexical, name)';

COMMENT ON CONSTRAINT "__math_dir_fk_node_x7yczixfhq" ON "qti"."math_dir" IS 'foreign key MathDir(node) to Attribute(node where {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"dir"}})';

COMMENT ON CONSTRAINT "__math_qualifier_fk_node_document_kind_start_nearest_ljmc7exiru" ON "qti"."math_qualifier" IS 'foreign key MathQualifier(node, document, kind, start, nearest, version, parent) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__math_qualifier_fk_node_tag_parent_kind_m_apply_qbbhmacqwe" ON "qti"."math_qualifier" IS 'foreign key MathQualifier(node, tag Node.parentKind = m:apply) to Node(id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:degree","m:logbase","m:momentabout"]} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}}, parentKind)';

COMMENT ON CONSTRAINT "__math_qualifier_fk_parent_copy_owned_head_52oxeo4au5" ON "qti"."math_qualifier" IS 'foreign key MathQualifier(parent, the owner''s count of the family MathApply.owned, head) to MathApply(node, owned, operator)';

COMMENT ON CONSTRAINT "__math_qualifier_fk_parent_predecessor_owned_4jflcvyyis" ON "qti"."math_qualifier" IS 'foreign key MathQualifier(parent, the predecessor of the index of the family MathApply.owned) to MathQualifier(parent, the index of the family MathApply.owned)';

COMMENT ON CONSTRAINT "__math_rank_fk_node_document_kind_start_nearest_zjnugabnps" ON "qti"."math_rank" IS 'foreign key MathRank(node, document, kind, start, nearest, version, parent) to Node(id, document, kind, start, nearest, version, parent)';

COMMENT ON CONSTRAINT "__math_rank_fk_parent_parent_rank_z2xzhgf3iz" ON "qti"."math_rank" IS 'foreign key MathRank(parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}, parentRank where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}) to MathRank(node, rank)';

COMMENT ON CONSTRAINT "__node_fk_id_xx53jcfjcy" ON "qti"."node" IS 'foreign key Node(id where {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["comment","doctype","document","entityRef","pi","text","ws"]},"kind":"not"} and {"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["m:bvar","m:condition","m:degree","m:domainofapplication","m:interval","m:logbase","m:lowlimit","m:momentabout","m:uplimit"]},"kind":"not"} and {"kind":"compare","left":{"field":"elements","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}) to MathArgument(node)';

COMMENT ON CONSTRAINT "__node_fk_id_document_kind_string_value_peehqrhge6" ON "qti"."node" IS 'foreign key Node(id where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}, document where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}, kind where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}, stringValue where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]}) to TextReference(node, document, kind, lexical)';

COMMENT ON CONSTRAINT "__node_fk_id_ddbzxqmz62" ON "qti"."node" IS 'foreign key Node(id where {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"baseType"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}} and {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"fieldIdentifier"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"ud:value"}}) to UsageValue(node)';

COMMENT ON CONSTRAINT "__node_fk_id_gdi67hamfj" ON "qti"."node" IS 'foreign key Node(id where {"kind":"compare","left":{"field":"elementChildren","kind":"field"},"op":"gt","right":{"kind":"literal","value":"~n:0"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:apply"}}) to MathApply(node)';

COMMENT ON CONSTRAINT "__node_fk_id_kriaqbxe47" ON "qti"."node" IS 'foreign key Node(id where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:maction"}}) to MathAction(node)';

COMMENT ON CONSTRAINT "__node_fk_id_xunu72fw35" ON "qti"."node" IS 'foreign key Node(id where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:mtd"}}) to MathCell(node)';

COMMENT ON CONSTRAINT "__node_fk_id_tag_kind_m_mtd_r3mva5sold" ON "qti"."node" IS 'foreign key Node(id where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:mtd"}}, tag MathAlignScope.kind = m:mtd) to MathAlignScope(node, kind)';

COMMENT ON CONSTRAINT "__node_fk_parent_tag_element_true_czbaqk52xc" ON "qti"."node" IS 'foreign key Node(parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-interaction-modules"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}}, tag PciModuleForm.element = true) to PciModuleForm(node, element)';

COMMENT ON CONSTRAINT "__open_attribute_name_fk_node_attribute_copy_open_6ya2qnodj3" ON "qti"."open_attribute_name" IS 'foreign key OpenAttributeName(node, attribute, the owner''s count of the family Attribute.openName, governs, kind, class, version) to Attribute(node, id, openName, governs, kind, name, version)';

COMMENT ON CONSTRAINT "__pci_module_form_fk_node_copy_module_forms_hyzhzhubtz" ON "qti"."pci_module_form" IS 'foreign key PciModuleForm(node, the owner''s count of the family Interaction.moduleForms) to Interaction(node, moduleForms)';

COMMENT ON CONSTRAINT "__pci_module_form_fk_node_predecessor_module_forms_ciktywn7tb" ON "qti"."pci_module_form" IS 'foreign key PciModuleForm(node, the predecessor of the index of the family Interaction.moduleForms) to PciModuleForm(node, the index of the family Interaction.moduleForms)';

COMMENT ON CONSTRAINT "__pci_module_form_fk_node_elxhx3pi6z" ON "qti"."pci_module_form" IS 'foreign key PciModuleForm(node where {"kind":"compare","left":{"field":"element","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}) to Attribute(node where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"module"}})';

COMMENT ON CONSTRAINT "__pci_module_form_fk_node_avd6eyu2u7" ON "qti"."pci_module_form" IS 'foreign key PciModuleForm(node where {"kind":"compare","left":{"field":"element","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}) to Node(parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-interaction-modules"}} and {"kind":"compare","left":{"field":"parentKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-portable-custom-interaction"}})';

COMMENT ON CONSTRAINT "__placed_body_xml_lang_fk_assembly_lang_copy_m7afchi7bf" ON "qti"."placed_body_xml_lang" IS 'foreign key PlacedBodyXmlLang(assembly, lang, the owner''s count of the family AssembledLang.carriers) to AssembledLang(assembly, lang, carriers)';

COMMENT ON CONSTRAINT "__placed_body_xml_lang_fk_assembly_lang_predecessor_46m7vk5xc3" ON "qti"."placed_body_xml_lang" IS 'foreign key PlacedBodyXmlLang(assembly, lang, the predecessor of the index of the family AssembledLang.carriers) to PlacedBodyXmlLang(assembly, lang, the index of the family AssembledLang.carriers)';

COMMENT ON CONSTRAINT "__placed_body_xml_lang_fk_instance_node_dwel37os6u" ON "qti"."placed_body_xml_lang" IS 'foreign key PlacedBodyXmlLang(instance, node) to PlacedXmlLang(instance where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}})';

COMMENT ON CONSTRAINT "__placed_catalog_ref_fk_assembly_id_37e4lkjmp7" ON "qti"."placed_catalog_ref" IS 'foreign key PlacedCatalogRef(assembly, id) to AssembledCatalog(assembly, id)';

COMMENT ON CONSTRAINT "__placed_catalog_ref_fk_document_id_copy_placements_l7cm3whuya" ON "qti"."placed_catalog_ref" IS 'foreign key PlacedCatalogRef(document, id, the owner''s count of the family CatalogTarget.placements) to CatalogTarget(document, id, placements)';

COMMENT ON CONSTRAINT "__placed_catalog_ref_fk_document_id_predecessor_67xz446p74" ON "qti"."placed_catalog_ref" IS 'foreign key PlacedCatalogRef(document, id, the predecessor of the index of the family CatalogTarget.placements) to PlacedCatalogRef(document, id, the index of the family CatalogTarget.placements)';

COMMENT ON CONSTRAINT "__placed_catalog_ref_fk_instance_id_document_c5tzckbrbm" ON "qti"."placed_catalog_ref" IS 'foreign key PlacedCatalogRef(instance, id, document, assembly) to PlacedIdref(instance, id, document, assembly)';

COMMENT ON CONSTRAINT "__placed_math_rank_fk_instance_document_assembly_jj2jhykves" ON "qti"."placed_math_rank" IS 'foreign key PlacedMathRank(instance, document, assembly) to Instance(id, document, assembly)';

COMMENT ON CONSTRAINT "__placed_math_rank_fk_node_document_kind_parent_cops42i4ni" ON "qti"."placed_math_rank" IS 'foreign key PlacedMathRank(node, document, kind, parent) to Node(id, document, kind, parent)';

COMMENT ON CONSTRAINT "__placed_math_rank_fk_instance_parent_parent_rank_6p4wd2b3cm" ON "qti"."placed_math_rank" IS 'foreign key PlacedMathRank(instance where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}, parent where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}, parentRank where {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"m:math"}} and {"kind":"compare","left":{"field":"node","kind":"field"},"op":"ne","right":{"field":"parent","kind":"field"}}) to PlacedMathRank(instance, node, rank)';

COMMENT ON CONSTRAINT "__placed_share_target_fk_assembly_id_target_target_ubqrapx5uo" ON "qti"."placed_share_target" IS 'foreign key PlacedShareTarget(assembly, id, target, targetCopy) to AssembledId(assembly, id, owner, copy)';

COMMENT ON CONSTRAINT "__placed_share_target_fk_instance_document_assembly_zd6ctfvhbw" ON "qti"."placed_share_target" IS 'foreign key PlacedShareTarget(instance, document, assembly, assemblyKind) to Instance(id, document, assembly, assemblyKind)';

COMMENT ON CONSTRAINT "__placed_share_target_fk_instance_node_share_rank_xdo4clhitp" ON "qti"."placed_share_target" IS 'foreign key PlacedShareTarget(instance, node, shareRank) to PlacedMathRank(instance, node, rank)';

COMMENT ON CONSTRAINT "__placed_share_target_fk_node_copy_placements_pdxfr3yqin" ON "qti"."placed_share_target" IS 'foreign key PlacedShareTarget(node, the owner''s count of the family ShareFragment.placements, document, id) to ShareFragment(node, placements, document, id)';

COMMENT ON CONSTRAINT "__placed_share_target_fk_node_predecessor_placements_lo2sk2iwlx" ON "qti"."placed_share_target" IS 'foreign key PlacedShareTarget(node, the predecessor of the index of the family ShareFragment.placements) to PlacedShareTarget(node, the index of the family ShareFragment.placements)';

COMMENT ON CONSTRAINT "__placed_share_target_fk_target_instance_target_4vhua4a5gx" ON "qti"."placed_share_target" IS 'foreign key PlacedShareTarget(targetInstance, target, targetRank) to PlacedMathRank(instance, node, rank)';

COMMENT ON CONSTRAINT "__placed_share_target_fk_target_instance_target_uf3tu72yh7" ON "qti"."placed_share_target" IS 'foreign key PlacedShareTarget(targetInstance, targetDocument, assembly) to Instance(id, document, assembly)';

COMMENT ON CONSTRAINT "__placed_xml_lang_fk_node_document_lang_scope_usvewkklvj" ON "qti"."placed_xml_lang" IS 'foreign key PlacedXmlLang(node, document, lang, scope) to XmlLang(node, document, lang, scope)';

COMMENT ON CONSTRAINT "__placed_xml_lang_fk_instance_node_assembly_document_ngziov7szs" ON "qti"."placed_xml_lang" IS 'foreign key PlacedXmlLang(instance where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, assembly where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, document where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, lang where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}) to PlacedBodyXmlLang(instance, node, assembly, document, lang)';

COMMENT ON CONSTRAINT "__reading_fk_assembly_node_attribute_form_split_5z2i4pl53a" ON "qti"."reading" IS 'foreign key Reading(assembly where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, node where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, attribute where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, form where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, split where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declCardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}) to ReadingCardinality(assembly, node, attribute, form, split)';

COMMENT ON CONSTRAINT "__reading_fk_declaration_tag_mapping_qti_mapping_rgn2oifcf2" ON "qti"."reading" IS 'foreign key Reading(declaration where {"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-response-declaration"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-response"}} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}, tag DeclarationTable.mapping = qti-mapping) to DeclarationTable(declaration, mapping)';

COMMENT ON CONSTRAINT "__reading_fk_declaration_tag_area_mapping_qti_area_kgjvft4gwc" ON "qti"."reading" IS 'foreign key Reading(declaration where {"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declarationKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-response-declaration"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-map-response-point"}} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}, tag DeclarationTable.areaMapping = qti-area-mapping) to DeclarationTable(declaration, areaMapping)';

COMMENT ON CONSTRAINT "__reading_fk_declaration_tag_value_base_integer_o4r7hakx4e" ON "qti"."reading" IS 'foreign key Reading(declaration where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"args":[{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"figures"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-equal-rounded"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"figures"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-round-to"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"max"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-any-n"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"max"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-integer"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"min"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-any-n"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"min"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-integer"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"n"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-index"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"number-repeats"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-repeat"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"step"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-integer"}}],"kind":"and"}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declBaseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, tag DeclarationBaseType.valueBase = integer) to DeclarationBaseType(node, valueBase)';

COMMENT ON CONSTRAINT "__reading_fk_declaration_tag_value_base_float_kdnnjf22ew" ON "qti"."reading" IS 'foreign key Reading(declaration where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"args":[{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"max"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-float"}}],"kind":"and"},{"args":[{"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"min"}},{"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-random-float"}}],"kind":"and"}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declBaseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}}, tag DeclarationBaseType.valueBase = float) to DeclarationBaseType(node, valueBase)';

COMMENT ON CONSTRAINT "__reading_fk_declaration_tag_value_base_string_ki6oqeu7kd" ON "qti"."reading" IS 'foreign key Reading(declaration where {"arg":{"field":"source","kind":"field"},"kind":"in","values":["declared","mapped"]} and {"args":[{"arg":{"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-lookup-outcome-value","qti-set-correct-response","qti-set-default-value","qti-set-outcome-value","qti-set-template-value"]},"kind":"not"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"eq","right":{"kind":"literal","value":"unsplit"}}],"kind":"or"} and {"args":[{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},{"kind":"compare","left":{"field":"source","kind":"field"},"op":"ne","right":{"kind":"literal","value":"none"}}],"kind":"or"} and {"args":[{"args":[{"args":[{"field":"number","kind":"field"},{"kind":"literal","value":"^[0-9]*[1-9][0-9]*$"}],"fn":"matches","kind":"compute"},{"kind":"compare","left":{"field":"replaced","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}],"kind":"and"},{"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"numbered"}}],"kind":"or"} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"eq","right":{"kind":"literal","value":"pattern"}} and {"kind":"compare","left":{"field":"attribute","kind":"field"},"op":"ne","right":{"kind":"literal","value":"identifier"}} and {"kind":"compare","left":{"field":"declBaseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"form","kind":"field"},"op":"ne","right":{"kind":"literal","value":"name"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-pattern-match"}}, tag DeclarationBaseType.valueBase = string) to DeclarationBaseType(node, valueBase)';

COMMENT ON CONSTRAINT "__reading_fk_named_variable_declaration_declaration_egbkzlfbow" ON "qti"."reading" IS 'foreign key Reading(named where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}, variable where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}, declaration where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}, declarationKind where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}, declCardinalities where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}, declBaseTypes where {"arg":{"args":[{"arg":{"field":"resourceType","kind":"field"},"kind":"in","values":["imsbasiclti_xmlv1p3","imslti_xmlv1p1","imsltia_xmlv1p0"]},{"args":[{"arg":{"field":"form","kind":"field"},"kind":"in","values":["numbered","split"]},{"kind":"compare","left":{"field":"found","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}},{"kind":"compare","left":{"field":"namedKind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"qti-assessment-item-ref"}}],"kind":"and"}],"kind":"and"},"kind":"not"} and {"kind":"compare","left":{"field":"source","kind":"field"},"op":"eq","right":{"kind":"literal","value":"mapped"}}) to MappingSourceDeclaration(itemRef, target, declaration, declarationKind, declCardinalities, declBaseTypes)';

COMMENT ON CONSTRAINT "__section_template_ref_cardinality_fk_declaration_jk4nx42et6" ON "qti"."section_template_ref_cardinality" IS 'foreign key SectionTemplateRefCardinality(declaration, cardinality) to DeclarationCardinality(node, cardinality)';

COMMENT ON CONSTRAINT "__section_template_ref_cardinality_fk_instance_node_wp7c4tiwlx" ON "qti"."section_template_ref_cardinality" IS 'foreign key SectionTemplateRefCardinality(instance, node, attribute, declaration, kind) to SectionTemplateRefDeclaration(instance, node, attribute, declaration, kind)';

COMMENT ON CONSTRAINT "__section_template_ref_declaration_fk_declaration_pkz37wpknq" ON "qti"."section_template_ref_declaration" IS 'foreign key SectionTemplateRefDeclaration(declaration where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-template-variable"}}, tag DeclarationBaseType.baseType = identifier) to DeclarationBaseType(node, baseType)';

COMMENT ON CONSTRAINT "__section_template_ref_declaration_fk_instance_node_begdji7bis" ON "qti"."section_template_ref_declaration" IS 'foreign key SectionTemplateRefDeclaration(instance where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}, node where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}, attribute where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}) to SectionTemplateRefCardinality(instance, node, attribute)';

COMMENT ON CONSTRAINT "__share_fragment_fk_document_assembled_pzjm5qqr6w" ON "qti"."share_fragment" IS 'foreign key ShareFragment(document, assembled) to Document(node, assembled)';

COMMENT ON CONSTRAINT "__share_fragment_fk_document_id_dfmgoyiabg" ON "qti"."share_fragment" IS 'foreign key ShareFragment(document, id) to IdrefTarget(document, id)';

COMMENT ON CONSTRAINT "__share_fragment_fk_node_a2epxbrkcq" ON "qti"."share_fragment" IS 'foreign key ShareFragment(node) to Attribute(node where {"args":[{"field":"lexical","kind":"field"},{"kind":"literal","value":"^#.+$"}],"fn":"matches","kind":"compute"} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"m:share"}} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"src"}})';

COMMENT ON CONSTRAINT "__share_fragment_fk_node_pred_placements_3og4hr2jia" ON "qti"."share_fragment" IS 'foreign key ShareFragment(node, pred(placements)) to PlacedShareTarget(node, the index of the family ShareFragment.placements)';

COMMENT ON CONSTRAINT "__share_fragment_fk_document_placements_4xrqglfqls" ON "qti"."share_fragment" IS 'foreign key ShareFragment(document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}, placements where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}) to TestDocument(node, instances)';

COMMENT ON CONSTRAINT "__share_fragment_fk_node_document_id_dqe35isltx" ON "qti"."share_fragment" IS 'foreign key ShareFragment(node where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}, document where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}, id where {"kind":"compare","left":{"field":"assembled","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}}) to ShareTarget(node, document, id)';

COMMENT ON CONSTRAINT "__share_target_fk_document_id_target_lhlrnny7wi" ON "qti"."share_target" IS 'foreign key ShareTarget(document, id, target) to IdBinding(document, id, owner)';

COMMENT ON CONSTRAINT "__share_target_fk_node_document_id_tag_assembled_72ilh23hsz" ON "qti"."share_target" IS 'foreign key ShareTarget(node, document, id, tag ShareFragment.assembled = false) to ShareFragment(node, document, id, assembled)';

COMMENT ON CONSTRAINT "__share_target_fk_node_share_rank_qhjui2y3g6" ON "qti"."share_target" IS 'foreign key ShareTarget(node, shareRank) to MathRank(node, rank)';

COMMENT ON CONSTRAINT "__share_target_fk_target_target_rank_jncpyp3epi" ON "qti"."share_target" IS 'foreign key ShareTarget(target, targetRank) to MathRank(node, rank)';

COMMENT ON CONSTRAINT "__site_fk_node_kind_fbxz4p6yn5" ON "qti"."site" IS 'foreign key Site(node where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"xi:include"}}, kind where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":false}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"eq","right":{"kind":"literal","value":"xi:include"}}) to SitePath(node, kind)';

COMMENT ON CONSTRAINT "__site_fk_node_tag_name_href_tag_scope_external_uffcwup4ja" ON "qti"."site" IS 'foreign key Site(node where {"kind":"compare","left":{"field":"external","kind":"field"},"op":"eq","right":{"kind":"literal","value":true}}, tag Reference.name = href, tag Reference.scope = external) to Reference(node, name, scope)';

COMMENT ON CONSTRAINT "__template_ref_cardinality_fk_declaration_43crswlfq6" ON "qti"."template_ref_cardinality" IS 'foreign key TemplateRefCardinality(declaration, cardinality) to DeclarationCardinality(node, cardinality)';

COMMENT ON CONSTRAINT "__template_ref_cardinality_fk_node_attribute_fhyj6rqodx" ON "qti"."template_ref_cardinality" IS 'foreign key TemplateRefCardinality(node, attribute, declaration, kind) to TemplateRefDeclaration(node, attribute, declaration, kind)';

COMMENT ON CONSTRAINT "__template_ref_declaration_fk_declaration_tag_base_4jmg5cd6ew" ON "qti"."template_ref_declaration" IS 'foreign key TemplateRefDeclaration(declaration where {"kind":"compare","left":{"field":"baseTypes","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}} and {"kind":"compare","left":{"field":"kind","kind":"field"},"op":"ne","right":{"kind":"literal","value":"qti-template-variable"}}, tag DeclarationBaseType.baseType = identifier) to DeclarationBaseType(node, baseType)';

COMMENT ON CONSTRAINT "__template_ref_declaration_fk_node_attribute_xnwucalmzd" ON "qti"."template_ref_declaration" IS 'foreign key TemplateRefDeclaration(node where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}, attribute where {"kind":"compare","left":{"field":"cardinalities","kind":"field"},"op":"eq","right":{"kind":"literal","value":"~n:1"}}) to TemplateRefCardinality(node, attribute)';

COMMENT ON CONSTRAINT "__text_reference_fk_node_ta5caojw4y" ON "qti"."text_reference" IS 'foreign key TextReference(node) to Node(id where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["qti-file-href.card","qti-resource-icon"]})';

COMMENT ON CONSTRAINT "__text_reference_fk_node_document_kind_b36g4mgxok" ON "qti"."text_reference" IS 'foreign key TextReference(node where {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"entry"}}, document where {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"entry"}}, kind where {"kind":"compare","left":{"field":"scope","kind":"field"},"op":"eq","right":{"kind":"literal","value":"entry"}}) to TextReferencePath(node, document, kind)';

COMMENT ON CONSTRAINT "__text_reference_path_fk_document_package_iztrd27ux5" ON "qti"."text_reference_path" IS 'foreign key TextReferencePath(document, package) to Document(node, package)';

COMMENT ON CONSTRAINT "__text_reference_path_fk_node_document_kind_tag_ymzlntcrzt" ON "qti"."text_reference_path" IS 'foreign key TextReferencePath(node, document, kind, tag TextReference.scope = entry) to TextReference(node, document, kind, scope)';

COMMENT ON CONSTRAINT "__text_reference_path_fk_package_path_qrchdfsvxr" ON "qti"."text_reference_path" IS 'foreign key TextReferencePath(package, path) to Entry(package, path)';

COMMENT ON CONSTRAINT "__usage_base_type_fk_node_wtyompbkib" ON "qti"."usage_base_type" IS 'foreign key UsageBaseType(node) to Attribute(node where {"arg":{"field":"kind","kind":"field"},"kind":"in","values":["ud:value"]} and {"kind":"compare","left":{"field":"name","kind":"field"},"op":"eq","right":{"kind":"literal","value":"baseType"}})';

COMMENT ON CONSTRAINT "__usage_value_fk_node_base_type_lexical_j6pbqzueup" ON "qti"."usage_value" IS 'foreign key UsageValue(node, baseTypeLexical) to UsageBaseType(node, lexical)';

COMMENT ON CONSTRAINT "__usage_value_fk_node_tag_kind_ud_value_bcoztbgkku" ON "qti"."usage_value" IS 'foreign key UsageValue(node, tag Node.kind = ud:value) to Node(id where {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"baseType"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}} and {"kind":"compare","left":{"args":[{"args":[{"args":[{"args":[{"field":"version","kind":"field"},{"args":[{"field":"version","kind":"field"},{"field":"kind","kind":"field"},{"field":"governs","kind":"field"}],"field":"governor","kind":"closedAt","relation":"GoverningOf"}],"field":"model","kind":"closedAt","relation":"AttributeModelOf"},{"kind":"literal","value":"fieldIdentifier"}],"field":"slot","kind":"closedAt","relation":"AttributeSlotOf"}],"fn":"singleton","kind":"compute"},{"field":"attrs","kind":"field"}],"fn":"subset","kind":"compute"},"op":"eq","right":{"kind":"literal","value":true}}, kind)';

COMMENT ON CONSTRAINT "__usage_value_fk_node_base_type_lexical_fqf2vzux2a" ON "qti"."usage_value" IS 'foreign key UsageValue(node where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]}, baseTypeLexical where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]}) to UsageValueBaseType(node, baseTypeLexical)';

COMMENT ON CONSTRAINT "__usage_value_base_type_fk_node_base_type_lexical_jlzez3fjqg" ON "qti"."usage_value_base_type" IS 'foreign key UsageValueBaseType(node, baseTypeLexical) to UsageValue(node where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]}, baseTypeLexical where {"arg":{"field":"baseTypeLexical","kind":"field"},"kind":"in","values":["boolean","directedPair","duration","file","float","identifier","integer","pair","point","string","uri"]})';

COMMENT ON CONSTRAINT "__usage_value_base_type_fk_node_text_7dytd7r24y" ON "qti"."usage_value_base_type" IS 'foreign key UsageValueBaseType(node, text) to Node(id, stringValue)';

COMMENT ON CONSTRAINT "__variable_mapping_fk_node_parent_sghjsfuygb" ON "qti"."variable_mapping" IS 'foreign key VariableMapping(node, parent) to MappingItemRef(node, itemRef)';

COMMENT ON CONSTRAINT "__xml_lang_fk_node_scope_foagqp4tlw" ON "qti"."xml_lang" IS 'foreign key XmlLang(node, scope) to CatalogScope(node, scope)';

COMMENT ON CONSTRAINT "__xml_lang_fk_node_document_lang_olhyjuqwrv" ON "qti"."xml_lang" IS 'foreign key XmlLang(node where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, document where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}, lang where {"kind":"compare","left":{"field":"document","kind":"field"},"op":"eq","right":{"field":"scope","kind":"field"}}) to BodyXmlLang(node, document, lang)';

COMMENT ON INDEX "qti"."__assembled_catalog_ix_owner_p3p4p7vpsa" IS 'btree index AssembledCatalog(owner)';

COMMENT ON INDEX "qti"."__assembled_reference_ix_assembly_eavgo_22_inf_node_2rzu2tcgme" IS 'btree index AssembledReference(__assembly_eavgo22inf, __node_zhqd2beld3, __attribute_2nqioyibuz)';

COMMENT ON INDEX "qti"."__catalog_scope_ix_parent_pa_7_sxt_3_mut_scope_2_utzs75brpa" IS 'btree index CatalogScope(__parent_pa7sxt3mut, __scope_2edhtd3orc)';

COMMENT ON INDEX "qti"."__catalog_target_ix_document_jwyigkitch_id_chqpn_6_virq3gqkdw" IS 'btree index CatalogTarget(__document_jwyigkitch, __id_chqpn6jlrw)';

COMMENT ON INDEX "qti"."__catalog_target_ix_document_sba_7_m_53_uwz_4cupqxhlxv" IS 'btree index CatalogTarget(__document_sba7m53uwz, __placements_umab3ec74p)';

COMMENT ON INDEX "qti"."__catalog_target_ix_document_assembled_mi42q2s6ku" IS 'btree index CatalogTarget(document, assembled)';

COMMENT ON INDEX "qti"."__cn_count_ix_node_4_zs_7_f_4_hetq_type_lexical_mw_5_32kwnnitcd" IS 'btree index CnCount(__node_4zs7f4hetq, __type_lexical_mw5gnzkqdv)';

COMMENT ON INDEX "qti"."__declaration_ix_parent_parent_kind_yvnpvak3wm" IS 'btree index Declaration(parent, parentKind)';

COMMENT ON INDEX "qti"."__declaration_identifier_ix_node_fkiarxhsad_2dkbo35y25" IS 'btree index DeclarationIdentifier(__node_fkiarxhsad)';

COMMENT ON INDEX "qti"."__declaration_identifier_ix_node_zfo_6_tymqbh_mmxgem64gu" IS 'btree index DeclarationIdentifier(__node_zfo6tymqbh)';

COMMENT ON INDEX "qti"."__expression_ix_node_yijjz_6_u_7_vd_u2vk2mapci" IS 'btree index Expression(__node_yijjz6u7vd)';

COMMENT ON INDEX "qti"."__expression_attribute_ix_node_j_2_c_273_zmua_6irf2xy6o3" IS 'btree index ExpressionAttribute(__node_j2c273zmua, __written_xr2xcpx7cp)';

COMMENT ON INDEX "qti"."__expression_attribute_ix_node_zjgiyb_7_nr_7_3xewekacwn" IS 'btree index ExpressionAttribute(__node_zjgiyb7nr7)';

COMMENT ON INDEX "qti"."__map_key_ix_node_rkykeekqwq_3fsflivgwg" IS 'btree index MapKey(__node_rkykeekqwq)';

COMMENT ON INDEX "qti"."__map_key_ix_node_ytvjqsvok_4_3b4rrtddkp" IS 'btree index MapKey(__node_ytvjqsvok4)';

COMMENT ON INDEX "qti"."__map_key_type_ix_node_tspabsizer_bxj3mcnjkq" IS 'btree index MapKeyType(__node_tspabsizer)';

COMMENT ON INDEX "qti"."__mapping_item_ref_ix_node_o_7_qeabbnno_7lsprznsl3" IS 'btree index MappingItemRef(__node_o7qeabbnno)';

COMMENT ON INDEX "qti"."__mapping_item_ref_type_ix_node_pgr_2_c_2_ubor_2phdcz7o5o" IS 'btree index MappingItemRefType(__node_pgr2c2ubor)';

COMMENT ON INDEX "qti"."__mapping_item_ref_type_ix_item_ref_type_pzprkmab2a" IS 'btree index MappingItemRefType(itemRef, type)';

COMMENT ON INDEX "qti"."__math_action_ix_node_ftdvsxxkkg_zkkakvjgqu" IS 'btree index MathAction(__node_ftdvsxxkkg)';

COMMENT ON INDEX "qti"."__math_align_scope_ix_node_2_cng_4_arpih_mmrhoiqhjk" IS 'btree index MathAlignScope(__node_2cng4arpih)';

COMMENT ON INDEX "qti"."__math_align_scope_ix_node_5_sroalr_7_ba_cell_crzb_yvcuj6zxfk" IS 'btree index MathAlignScope(__node_5sroalr7ba, __cell_crzb77exj4)';

COMMENT ON INDEX "qti"."__math_align_scope_ix_node_i_5_vkip_2_st_6_dir_mellqolgaz" IS 'btree index MathAlignScope(__node_i5vkip2st6, __dir_lexical_h6z4ucsu6w)';

COMMENT ON INDEX "qti"."__math_align_scope_ix_node_x_3_mdbcdhup_efi73o4ghn" IS 'btree index MathAlignScope(__node_x3mdbcdhup)';

COMMENT ON INDEX "qti"."__math_align_scope_ix_parent_bj_6_k_3_aos_7_e_chosen_6koelug4xi" IS 'btree index MathAlignScope(__parent_bj6k3aos7e, __chosen_nwrwqehg4j)';

COMMENT ON INDEX "qti"."__math_align_scope_ix_parent_ofh_2_oegku_5_cell_odosvatxqe" IS 'btree index MathAlignScope(__parent_ofh2oegku5, __cell_despuko6mc, __received_nl6nb5uaz7, __parent_kind_bupdqhkd5a, __inherited_4f5vs6h5cr)';

COMMENT ON INDEX "qti"."__math_cn_ix_node_3_zqnpj_6_o_5_d_base_lexical_sbr55swfug" IS 'btree index MathCn(__node_3zqnpj6o5d, __base_lexical_dhzsou5d52)';

COMMENT ON INDEX "qti"."__math_cn_ix_node_4_zs_7_f_4_hetq_type_lexical_mw_5_xzzqy3zlyr" IS 'btree index MathCn(__node_4zs7f4hetq, __type_lexical_mw5gnzkqdv)';

COMMENT ON INDEX "qti"."__math_rank_ix_parent_hwejryg_34_m_parent_rank_vbozqp2pxf" IS 'btree index MathRank(__parent_hwejryg34m, __parent_rank_djgpmhcqav)';

COMMENT ON INDEX "qti"."__node_ix_id_33_kgwoi_4_ec_ojslxjumzu" IS 'btree index Node(__id_33kgwoi4ec)';

COMMENT ON INDEX "qti"."__node_ix_id_4_kyfqj_6_js_7_h5y5njhzbp" IS 'btree index Node(__id_4kyfqj6js7)';

COMMENT ON INDEX "qti"."__node_ix_id_hdt_6_eyj_25_k_qrxya73myb" IS 'btree index Node(__id_hdt6eyj25k)';

COMMENT ON INDEX "qti"."__node_ix_id_lpqd_3_za_4_po_bqqgtjitsc" IS 'btree index Node(__id_lpqd3za4po)';

COMMENT ON INDEX "qti"."__node_ix_id_tw_4_vam_75_we_5kcd7y5t2c" IS 'btree index Node(__id_tw4vam75we)';

COMMENT ON INDEX "qti"."__placed_catalog_ref_ix_assembly_id_pc7cqhzymb" IS 'btree index PlacedCatalogRef(assembly, id)';

COMMENT ON INDEX "qti"."__placed_math_rank_ix_instance_boc_7_dpt_43_h_parent_bzfvxvh44o" IS 'btree index PlacedMathRank(__instance_boc7dpt43h, __parent_hwejryg34m, __parent_rank_djgpmhcqav)';

COMMENT ON INDEX "qti"."__placed_math_rank_ix_instance_document_assembly_mpzhzz7n5s" IS 'btree index PlacedMathRank(instance, document, assembly)';

COMMENT ON INDEX "qti"."__placed_math_rank_ix_node_document_kind_parent_vo6tu2lpod" IS 'btree index PlacedMathRank(node, document, kind, parent)';

COMMENT ON INDEX "qti"."__placed_share_target_ix_assembly_id_target_target_izyo3xwaoi" IS 'btree index PlacedShareTarget(assembly, id, target, targetCopy)';

COMMENT ON INDEX "qti"."__placed_share_target_ix_instance_document_assembly_gx7rfghoh3" IS 'btree index PlacedShareTarget(instance, document, assembly, assemblyKind)';

COMMENT ON INDEX "qti"."__placed_share_target_ix_target_instance_target_y7tchqidv3" IS 'btree index PlacedShareTarget(targetInstance, target, targetRank)';

COMMENT ON INDEX "qti"."__placed_share_target_ix_target_instance_target_d2oyu5er3k" IS 'btree index PlacedShareTarget(targetInstance, targetDocument, assembly)';

COMMENT ON INDEX "qti"."__placed_xml_lang_ix_node_document_lang_scope_3xyzhgioqj" IS 'btree index PlacedXmlLang(node, document, lang, scope)';

COMMENT ON INDEX "qti"."__reading_ix_assembly_brf_3_sbdwa_3_node_vdwnogher_6_ujw2fqpkhv" IS 'btree index Reading(__assembly_brf3sbdwa3, __node_vdwnogher6, __attribute_szn64gmkfk, __form_zd4qqbgfsu, __split_pb3ut3hart)';

COMMENT ON INDEX "qti"."__reading_ix_declaration_iyg_4_qzi_7_lx_l25loxzi52" IS 'btree index Reading(__declaration_iyg4qzi7lx)';

COMMENT ON INDEX "qti"."__reading_ix_declaration_pnhwgyt_6_uo_afvw2thxyx" IS 'btree index Reading(__declaration_pnhwgyt6uo)';

COMMENT ON INDEX "qti"."__reading_ix_declaration_pucv_7_vcefe_m7m42sfr2x" IS 'btree index Reading(__declaration_pucv7vcefe)';

COMMENT ON INDEX "qti"."__reading_ix_declaration_rppsrhr_5_i_4_xtsbr5wfhl" IS 'btree index Reading(__declaration_rppsrhr5i4)';

COMMENT ON INDEX "qti"."__reading_ix_declaration_wt_7_jbmsmtl_gwvvc3qx4n" IS 'btree index Reading(__declaration_wt7jbmsmtl)';

COMMENT ON INDEX "qti"."__reading_ix_named_wkt_6_teogcz_variable_2_uaihkdfhu_gywpfki2c7" IS 'btree index Reading(__named_wkt6teogcz, __variable_2uaihkdfhu, __declaration_3mv65pwvgk, __declaration_kind_x26izueojr, __decl_cardinalities_vvydu3gy53, __decl_base_types_5x4gxdsycq)';

COMMENT ON INDEX "qti"."__section_template_ref_cardinality_ix_declaration_cv634bqtnj" IS 'btree index SectionTemplateRefCardinality(declaration, cardinality)';

COMMENT ON INDEX "qti"."__section_template_ref_declaration_ix_declaration_6_4tlaqjre5z" IS 'btree index SectionTemplateRefDeclaration(__declaration_6cfggqpwok)';

COMMENT ON INDEX "qti"."__section_template_ref_declaration_ix_instance_o_2_uml3nm4f2g" IS 'btree index SectionTemplateRefDeclaration(__instance_o2mj6jp54p, __node_wmg2sk5kn2, __attribute_z7y72kybyf)';

COMMENT ON INDEX "qti"."__share_fragment_ix_document_sba_7_m_53_uwz_cdvfxla47d" IS 'btree index ShareFragment(__document_sba7m53uwz, __placements_umab3ec74p)';

COMMENT ON INDEX "qti"."__share_fragment_ix_node_eixsmyfnul_document_slbxn5gade" IS 'btree index ShareFragment(__node_eixsmyfnul, __document_jwyigkitch, __id_chqpn6jlrw)';

COMMENT ON INDEX "qti"."__share_fragment_ix_document_assembled_xmwggb7idu" IS 'btree index ShareFragment(document, assembled)';

COMMENT ON INDEX "qti"."__share_fragment_ix_document_id_y5gmd6qmc6" IS 'btree index ShareFragment(document, id)';

COMMENT ON INDEX "qti"."__share_target_ix_document_id_target_6to7sthh77" IS 'btree index ShareTarget(document, id, target)';

COMMENT ON INDEX "qti"."__share_target_ix_target_target_rank_x5lykbzyp2" IS 'btree index ShareTarget(target, targetRank)';

COMMENT ON INDEX "qti"."__site_ix_node_4_btbiqcyve_kind_xumnxfryga_ezlmik6afr" IS 'btree index Site(__node_4btbiqcyve, __kind_xumnxfryga)';

COMMENT ON INDEX "qti"."__site_ix_node_hy_2_rqw_4_ikb_llk6oesco2" IS 'btree index Site(__node_hy2rqw4ikb)';

COMMENT ON INDEX "qti"."__template_ref_cardinality_ix_declaration_fddrgrvvjq" IS 'btree index TemplateRefCardinality(declaration, cardinality)';

COMMENT ON INDEX "qti"."__template_ref_declaration_ix_declaration_6_2zqj6yz37a" IS 'btree index TemplateRefDeclaration(__declaration_6cfggqpwok)';

COMMENT ON INDEX "qti"."__template_ref_declaration_ix_node_wmg_2_sk_5_kn_2_c7f5qt5pse" IS 'btree index TemplateRefDeclaration(__node_wmg2sk5kn2, __attribute_z7y72kybyf)';

COMMENT ON INDEX "qti"."__text_reference_path_ix_document_package_fj2vzkfhas" IS 'btree index TextReferencePath(document, package)';

COMMENT ON INDEX "qti"."__text_reference_path_ix_package_path_mhawtr43cb" IS 'btree index TextReferencePath(package, path)';
