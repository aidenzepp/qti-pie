ALTER TABLE "qti"."assembled_id" ADD CONSTRAINT "__assembled_id_key_assembly_id_owner_ujce7hrdm7" UNIQUE USING INDEX "__assembled_id_key_assembly_id_owner_ujce7hrdm7";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_id_open_name_governs_kind_name_udfzv7fjm5" UNIQUE USING INDEX "__attribute_key_node_id_open_name_governs_kind_name_udfzv7fjm5";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_rmoe3heakj" UNIQUE USING INDEX "__attribute_key_node_rmoe3heakj";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_name_lur3pupati" UNIQUE USING INDEX "__attribute_key_node_name_lur3pupati";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_ezrr5xs2wh" UNIQUE USING INDEX "__attribute_key_node_ezrr5xs2wh";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_z3fpxb33wr" UNIQUE USING INDEX "__attribute_key_node_z3fpxb33wr";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_j3nl2tgoep" UNIQUE USING INDEX "__attribute_key_node_j3nl2tgoep";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_j5k5x63vk5" UNIQUE USING INDEX "__attribute_key_node_j5k5x63vk5";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_tsbrtp3osw" UNIQUE USING INDEX "__attribute_key_node_tsbrtp3osw";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_3gwlsgbzky" UNIQUE USING INDEX "__attribute_key_node_3gwlsgbzky";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_c6surz4m55" UNIQUE USING INDEX "__attribute_key_node_c6surz4m55";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_77bmalp47s" UNIQUE USING INDEX "__attribute_key_node_77bmalp47s";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_2zna26wugb" UNIQUE USING INDEX "__attribute_key_node_2zna26wugb";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_uuivyleqbm" UNIQUE USING INDEX "__attribute_key_node_uuivyleqbm";

ALTER TABLE "qti"."declaration" ADD CONSTRAINT "__declaration_key_node_parent_kind_3o2lalckgi" UNIQUE USING INDEX "__declaration_key_node_parent_kind_3o2lalckgi";

ALTER TABLE "qti"."expression_attribute" ADD CONSTRAINT "__expression_attribute_key_node_attribute_written_sqs5cpgyqi" UNIQUE USING INDEX "__expression_attribute_key_node_attribute_written_sqs5cpgyqi";

ALTER TABLE "qti"."expression_attribute" ADD CONSTRAINT "__expression_attribute_key_node_written_attribute_gmblqwrdel" UNIQUE USING INDEX "__expression_attribute_key_node_written_attribute_gmblqwrdel";

ALTER TABLE "qti"."expression_attribute" ADD CONSTRAINT "__expression_attribute_key_node_emltek4plt" UNIQUE USING INDEX "__expression_attribute_key_node_emltek4plt";

ALTER TABLE "qti"."expression_attribute" ADD CONSTRAINT "__expression_attribute_key_node_s4lcb7r25q" UNIQUE USING INDEX "__expression_attribute_key_node_s4lcb7r25q";

ALTER TABLE "qti"."instance" ADD CONSTRAINT "__instance_key_id_document_assembly_wqqiitvjwd" UNIQUE USING INDEX "__instance_key_id_document_assembly_wqqiitvjwd";

ALTER TABLE "qti"."interaction" ADD CONSTRAINT "__interaction_key_node_module_forms_i7sufvfcmf" UNIQUE USING INDEX "__interaction_key_node_module_forms_i7sufvfcmf";

ALTER TABLE "qti"."map_key" ADD CONSTRAINT "__map_key_key_node_case_text_3a5vudl54f" UNIQUE USING INDEX "__map_key_key_node_case_text_3a5vudl54f";

ALTER TABLE "qti"."map_key" ADD CONSTRAINT "__map_key_key_node_euxthmmamh" UNIQUE USING INDEX "__map_key_key_node_euxthmmamh";

ALTER TABLE "qti"."map_key_type" ADD CONSTRAINT "__map_key_type_key_node_base_type_ya2jqubgrb" UNIQUE USING INDEX "__map_key_type_key_node_base_type_ya2jqubgrb";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_document_kind_parent_abf25mzj2n" UNIQUE USING INDEX "__node_key_id_document_kind_parent_abf25mzj2n";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_parent_kind_bcix5a5ymv" UNIQUE USING INDEX "__node_key_id_parent_kind_bcix5a5ymv";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_parent_kind_cy4qhoyaol" UNIQUE USING INDEX "__node_key_id_parent_kind_cy4qhoyaol";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_vuxeuhz6wl" UNIQUE USING INDEX "__node_key_id_vuxeuhz6wl";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_kind_ge47i2ygoj" UNIQUE USING INDEX "__node_key_id_kind_ge47i2ygoj";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_kind_qlw5xvtx32" UNIQUE USING INDEX "__node_key_id_kind_qlw5xvtx32";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_parent_kind_vjnqmkdkwf" UNIQUE USING INDEX "__node_key_parent_kind_vjnqmkdkwf";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_parent_n6ugjuynxn" UNIQUE USING INDEX "__node_key_parent_n6ugjuynxn";

ALTER TABLE "qti"."placed_idref" ADD CONSTRAINT "__placed_idref_key_instance_id_document_assembly_4v7dioxhgu" UNIQUE USING INDEX "__placed_idref_key_instance_id_document_assembly_4v7dioxhgu";

ALTER TABLE "qti"."placed_xml_lang" ADD CONSTRAINT "__placed_xml_lang_key_instance_node_54e5cx3n65" UNIQUE USING INDEX "__placed_xml_lang_key_instance_node_54e5cx3n65";

ALTER TABLE "qti"."reading" ADD CONSTRAINT "__reading_key_assembly_node_attribute_fl3364kuzj" UNIQUE USING INDEX "__reading_key_assembly_node_attribute_fl3364kuzj";

ALTER TABLE "qti"."reading" ADD CONSTRAINT "__reading_key_assembly_node_attribute_kind_4uz6oovfmo" UNIQUE USING INDEX "__reading_key_assembly_node_attribute_kind_4uz6oovfmo";

ALTER TABLE "qti"."reference" ADD CONSTRAINT "__reference_key_node_name_scope_chd2zywqnq" UNIQUE USING INDEX "__reference_key_node_name_scope_chd2zywqnq";

ALTER TABLE "qti"."reference" ADD CONSTRAINT "__reference_key_node_3jgv6f5ia4" UNIQUE USING INDEX "__reference_key_node_3jgv6f5ia4";

ALTER TABLE "qti"."section_template_ref_declaration" ADD CONSTRAINT "__section_template_ref_declaration_key_instance_node_emy7juxcxe" UNIQUE USING INDEX "__section_template_ref_declaration_key_instance_node_emy7juxcxe";

ALTER TABLE "qti"."template_ref_declaration" ADD CONSTRAINT "__template_ref_declaration_key_node_attribute_5yhuqmcbse" UNIQUE USING INDEX "__template_ref_declaration_key_node_attribute_5yhuqmcbse";

ALTER TABLE "qti"."test_document" ADD CONSTRAINT "__test_document_key_node_instances_k4obic4tsn" UNIQUE USING INDEX "__test_document_key_node_instances_k4obic4tsn";

ALTER TABLE "qti"."usage_value" ADD CONSTRAINT "__usage_value_key_node_base_type_lexical_o4cwubtrum" UNIQUE USING INDEX "__usage_value_key_node_base_type_lexical_o4cwubtrum";

ALTER TABLE "qti"."variable_mapping" ADD CONSTRAINT "__variable_mapping_key_node_parent_hibsagkd2k" UNIQUE USING INDEX "__variable_mapping_key_node_parent_hibsagkd2k";

ALTER TABLE "qti"."xml_lang" ADD CONSTRAINT "__xml_lang_key_node_document_lang_scope_locn5q2jix" UNIQUE USING INDEX "__xml_lang_key_node_document_lang_scope_locn5q2jix";

ALTER TABLE "qti"."xml_lang" ADD CONSTRAINT "__xml_lang_key_node_764mfogklt" UNIQUE USING INDEX "__xml_lang_key_node_764mfogklt";

ALTER DOMAIN "qti"."content_model" VALIDATE CONSTRAINT "check";

ALTER DOMAIN "qti"."shared_model" VALIDATE CONSTRAINT "check";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "double_value";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "value_domain";

ALTER TABLE "qti"."declaration_name" VALIDATE CONSTRAINT "reserved_type";

ALTER TABLE "qti"."double_value" VALIDATE CONSTRAINT "double_bound";

ALTER TABLE "qti"."expression_attribute" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."expression_attribute" VALIDATE CONSTRAINT "weighted_base";

ALTER TABLE "qti"."interaction" VALIDATE CONSTRAINT "custom_interaction_version";

ALTER TABLE "qti"."interaction" VALIDATE CONSTRAINT "pci_module_source";

ALTER TABLE "qti"."map_key" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "n_5_admitted";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "n_5_follow";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "n_7_last";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_check_node_children_concat_fold_jdz4qsgrly";

ALTER TABLE "qti"."open_attribute_name" VALIDATE CONSTRAINT "al_4_data_name";

ALTER TABLE "qti"."open_attribute_name" VALIDATE CONSTRAINT "al_4_declared_data_name";

ALTER TABLE "qti"."placed_variable_ref" VALIDATE CONSTRAINT "mapped_response";

ALTER TABLE "qti"."placed_variable_ref" VALIDATE CONSTRAINT "variable_declared";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "prefixed_reference";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "reference_type";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "variable_declared";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_check_reading_form_kind_form_found_named_mu7as7u35r";

ALTER TABLE "qti"."variable_ref" VALIDATE CONSTRAINT "mapped_response";

ALTER TABLE "qti"."variable_ref" VALIDATE CONSTRAINT "variable_declared";

ALTER TABLE "qti"."assembled_catalog" ADD CONSTRAINT "__assembled_catalog_fk_assembly_id_owner_ekec2zy4ps" FOREIGN KEY ("assembly", "id", "owner") REFERENCES "qti"."assembled_id" ("assembly", "id", "owner") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."assembled_catalog" VALIDATE CONSTRAINT "__assembled_catalog_fk_assembly_id_owner_ekec2zy4ps";

ALTER TABLE "qti"."assembled_lang" VALIDATE CONSTRAINT "__assembled_lang_fk_assembly_lang_pred_carriers_5r6dfhjw6u";

ALTER TABLE "qti"."assembled_reference" ADD CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_oitw7yxsm2" FOREIGN KEY ("__assembly_eavgo22inf", "__node_zhqd2beld3", "__attribute_2nqioyibuz") REFERENCES "qti"."reading" ("__assembly_sggtw6cwda", "__node_ngapbvqkdw", "__attribute_dn7csff7gp") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."assembled_reference" VALIDATE CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_oitw7yxsm2";

ALTER TABLE "qti"."assembled_reference" ADD CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_wvtn6n63rg" FOREIGN KEY ("__assembly_beyjdapot4", "__node_6kc5b2t3fi", "__attribute_m23x7bmxe6", "__kind_3ljxypfz46") REFERENCES "qti"."reading" ("__assembly_sggtw6cwda", "__node_ngapbvqkdw", "__attribute_dn7csff7gp", "__kind_jpu2chchxq") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."assembled_reference" VALIDATE CONSTRAINT "__assembled_reference_fk_assembly_node_attribute_wvtn6n63rg";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_document_lexical_b56655356a";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_cfe5nxthbz";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_name_lexical_mgnenhufg5";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_document_lexical_gyd44qmtvi";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_document_lexical_n3fq766zy6";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_document_ug3se24mbh";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_zedikqrucf";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_tag_selection_written_oopputu4ww";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_noy2h3xyxk";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_fk_node_lexical_5tchtzrw5z" FOREIGN KEY ("__node_su53cqvokz", "__lexical_ddgdebuzct") REFERENCES "qti"."map_key" ("node", "case_text") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_5tchtzrw5z";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_tag_element_false_fwdow2gkzv";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_o7iocxhk7i";

ALTER TABLE "qti"."body_xml_lang" ADD CONSTRAINT "__body_xml_lang_fk_node_p2byvzuucl" FOREIGN KEY ("node") REFERENCES "qti"."xml_lang" ("__node_nt6ftizred") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."body_xml_lang" VALIDATE CONSTRAINT "__body_xml_lang_fk_node_p2byvzuucl";

ALTER TABLE "qti"."card_support" ADD CONSTRAINT "__card_support_fk_node_2tzodyozy6" FOREIGN KEY ("node") REFERENCES "qti"."attribute" ("__node_52tvzova3k") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."card_support" VALIDATE CONSTRAINT "__card_support_fk_node_2tzodyozy6";

ALTER TABLE "qti"."catalog_id" ADD CONSTRAINT "__catalog_id_fk_node_kf3go6qa4s" FOREIGN KEY ("node") REFERENCES "qti"."attribute" ("__node_tsiudobb4f") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."catalog_id" VALIDATE CONSTRAINT "__catalog_id_fk_node_kf3go6qa4s";

ALTER TABLE "qti"."catalog_ref" ADD CONSTRAINT "__catalog_ref_fk_node_zmkvtdbt2z" FOREIGN KEY ("node") REFERENCES "qti"."attribute" ("__node_kvvtz4aokl") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."catalog_ref" VALIDATE CONSTRAINT "__catalog_ref_fk_node_zmkvtdbt2z";

ALTER TABLE "qti"."catalog_target" ADD CONSTRAINT "__catalog_target_fk_document_placements_flylpuclcc" FOREIGN KEY ("__document_sba7m53uwz", "__placements_umab3ec74p") REFERENCES "qti"."test_document" ("node", "instances") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."catalog_target" VALIDATE CONSTRAINT "__catalog_target_fk_document_placements_flylpuclcc";

ALTER TABLE "qti"."cn_attribute" ADD CONSTRAINT "__cn_attribute_fk_node_name_fplssc7kn4" FOREIGN KEY ("node", "name") REFERENCES "qti"."attribute" ("__node_v4zoanxsju", "__name_vvkts6omjc") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."cn_attribute" VALIDATE CONSTRAINT "__cn_attribute_fk_node_name_fplssc7kn4";

ALTER TABLE "qti"."declaration" VALIDATE CONSTRAINT "__declaration_fk_parent_parent_kind_sdetvssoyz";

ALTER TABLE "qti"."declaration_identifier" ADD CONSTRAINT "__declaration_identifier_fk_node_parent_kind_3dscbdoq46" FOREIGN KEY ("node", "parent_kind") REFERENCES "qti"."declaration" ("node", "parent_kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."declaration_identifier" VALIDATE CONSTRAINT "__declaration_identifier_fk_node_parent_kind_3dscbdoq46";

ALTER TABLE "qti"."declaration_identifier" VALIDATE CONSTRAINT "__declaration_identifier_fk_node_tag_base_type_float_vs52isv4wp";

ALTER TABLE "qti"."declaration_identifier" VALIDATE CONSTRAINT "__declaration_identifier_fk_node_tag_base_type_float_3cka6y7gbd";

ALTER TABLE "qti"."declaration_name" ADD CONSTRAINT "__declaration_name_fk_node_parent_kind_k3m4af6di6" FOREIGN KEY ("node", "parent_kind") REFERENCES "qti"."declaration" ("node", "parent_kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."declaration_name" VALIDATE CONSTRAINT "__declaration_name_fk_node_parent_kind_k3m4af6di6";

ALTER TABLE "qti"."default_entry" ADD CONSTRAINT "__default_entry_fk_node_vkxcobelp3" FOREIGN KEY ("node") REFERENCES "qti"."attribute" ("__node_yp7qmbepyb") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."default_entry" VALIDATE CONSTRAINT "__default_entry_fk_node_vkxcobelp3";

ALTER TABLE "qti"."document_id" ADD CONSTRAINT "__document_id_fk_node_3lqobcjlo4" FOREIGN KEY ("__node_tpei2g34n6") REFERENCES "qti"."attribute" ("__node_h7ktnl7tci") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."document_id" VALIDATE CONSTRAINT "__document_id_fk_node_3lqobcjlo4";

ALTER TABLE "qti"."document_lang" VALIDATE CONSTRAINT "__document_lang_fk_document_lang_pred_carriers_lsfzp5pr7j";

ALTER TABLE "qti"."expression" VALIDATE CONSTRAINT "__expression_fk_node_tag_attribute_weight_identifier_xha6ehimx5";

ALTER TABLE "qti"."expression_attribute" ADD CONSTRAINT "__expression_attribute_fk_node_tag_attribute_weight_3bbn7mwuvv" FOREIGN KEY ("__node_zjgiyb7nr7", "__tag_attribute_weight_identifier_fovwq7tv75", "__tag_written_true_o2njtfwmyo") REFERENCES "qti"."expression_attribute" ("node", "attribute", "written") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."expression_attribute" VALIDATE CONSTRAINT "__expression_attribute_fk_node_tag_attribute_weight_3bbn7mwuvv";

ALTER TABLE "qti"."expression_attribute" ADD CONSTRAINT "__expression_attribute_fk_node_written_tag_attribute_xlnzrhw46c" FOREIGN KEY ("__node_j2c273zmua", "__written_xr2xcpx7cp", "__tag_attribute_weight_identifier_fovwq7tv75") REFERENCES "qti"."expression_attribute" ("node", "written", "attribute") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."expression_attribute" VALIDATE CONSTRAINT "__expression_attribute_fk_node_written_tag_attribute_xlnzrhw46c";

ALTER TABLE "qti"."idref_target" VALIDATE CONSTRAINT "__idref_target_fk_document_copy_idref_targets_pslze4v7in";

ALTER TABLE "qti"."interaction" VALIDATE CONSTRAINT "__interaction_fk_node_pred_module_forms_vvfps6m5vs";

ALTER TABLE "qti"."map_key" ADD CONSTRAINT "__map_key_fk_node_wy7ookj3zp" FOREIGN KEY ("__node_rkykeekqwq") REFERENCES "qti"."attribute" ("__node_su53cqvokz") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."map_key" VALIDATE CONSTRAINT "__map_key_fk_node_wy7ookj3zp";

ALTER TABLE "qti"."map_key" ADD CONSTRAINT "__map_key_fk_node_tag_base_type_string_ogbc2e2kqg" FOREIGN KEY ("__node_ytvjqsvok4", "__tag_base_type_string_du6v7sbmlk") REFERENCES "qti"."map_key_type" ("node", "base_type") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."map_key" VALIDATE CONSTRAINT "__map_key_fk_node_tag_base_type_string_ogbc2e2kqg";

ALTER TABLE "qti"."map_key_type" ADD CONSTRAINT "__map_key_type_fk_node_6aevd6gybc" FOREIGN KEY ("__node_tspabsizer") REFERENCES "qti"."map_key" ("__node_kupzut65fd") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."map_key_type" VALIDATE CONSTRAINT "__map_key_type_fk_node_6aevd6gybc";

ALTER TABLE "qti"."mapping_item_ref" ADD CONSTRAINT "__mapping_item_ref_fk_node_item_ref_kdh4hh5idh" FOREIGN KEY ("node", "item_ref") REFERENCES "qti"."variable_mapping" ("node", "parent") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."mapping_item_ref" VALIDATE CONSTRAINT "__mapping_item_ref_fk_node_item_ref_kdh4hh5idh";

ALTER TABLE "qti"."math_action" ADD CONSTRAINT "__math_action_fk_node_qcsceuvnc3" FOREIGN KEY ("__node_ftdvsxxkkg") REFERENCES "qti"."attribute" ("__node_zxxp2534g5") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."math_action" VALIDATE CONSTRAINT "__math_action_fk_node_qcsceuvnc3";

ALTER TABLE "qti"."math_apply" ADD CONSTRAINT "__math_apply_fk_node_operator_2t5hgnyaic" FOREIGN KEY ("node", "operator") REFERENCES "qti"."node" ("__parent_uzfw6kuely", "__kind_pfg4bqow25") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."math_apply" VALIDATE CONSTRAINT "__math_apply_fk_node_operator_2t5hgnyaic";

ALTER TABLE "qti"."math_apply" ADD CONSTRAINT "__math_apply_fk_node_tag_kind_m_apply_ppxr3wftcz" FOREIGN KEY ("node", "__tag_kind_m_apply_pjtmhvv7wn") REFERENCES "qti"."node" ("__id_akgrikbcwo", "kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."math_apply" VALIDATE CONSTRAINT "__math_apply_fk_node_tag_kind_m_apply_ppxr3wftcz";

ALTER TABLE "qti"."math_argument" ADD CONSTRAINT "__math_argument_fk_node_tag_parent_kind_m_apply_r4xstjnki4" FOREIGN KEY ("node", "__tag_parent_kind_m_apply_d3jbpwaalp") REFERENCES "qti"."node" ("__id_cd2i27c3ms", "parent_kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."math_argument" VALIDATE CONSTRAINT "__math_argument_fk_node_tag_parent_kind_m_apply_r4xstjnki4";

ALTER TABLE "qti"."math_dir" ADD CONSTRAINT "__math_dir_fk_node_x7yczixfhq" FOREIGN KEY ("node") REFERENCES "qti"."attribute" ("__node_goabodzugo") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."math_dir" VALIDATE CONSTRAINT "__math_dir_fk_node_x7yczixfhq";

ALTER TABLE "qti"."math_qualifier" ADD CONSTRAINT "__math_qualifier_fk_node_tag_parent_kind_m_apply_qbbhmacqwe" FOREIGN KEY ("node", "__tag_parent_kind_m_apply_d3jbpwaalp") REFERENCES "qti"."node" ("__id_d2goefw6wb", "parent_kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."math_qualifier" VALIDATE CONSTRAINT "__math_qualifier_fk_node_tag_parent_kind_m_apply_qbbhmacqwe";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_id_xx53jcfjcy";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_id_document_kind_string_value_peehqrhge6";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_id_ddbzxqmz62";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_id_gdi67hamfj";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_id_kriaqbxe47";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_id_xunu72fw35";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_id_tag_kind_m_mtd_r3mva5sold";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_parent_tag_element_true_czbaqk52xc";

ALTER TABLE "qti"."open_attribute_name" ADD CONSTRAINT "__open_attribute_name_fk_node_attribute_copy_open_6ya2qnodj3" FOREIGN KEY ("node", "attribute", "__copy_open_name_i6if6bjmli", "governs", "kind", "class", "version") REFERENCES "qti"."attribute" ("node", "id", "open_name", "governs", "kind", "name", "version") MATCH SIMPLE ON UPDATE CASCADE NOT VALID;

ALTER TABLE "qti"."open_attribute_name" VALIDATE CONSTRAINT "__open_attribute_name_fk_node_attribute_copy_open_6ya2qnodj3";

ALTER TABLE "qti"."pci_module_form" ADD CONSTRAINT "__pci_module_form_fk_node_copy_module_forms_hyzhzhubtz" FOREIGN KEY ("node", "__copy_module_forms_5aweist2be") REFERENCES "qti"."interaction" ("node", "module_forms") MATCH SIMPLE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."pci_module_form" VALIDATE CONSTRAINT "__pci_module_form_fk_node_copy_module_forms_hyzhzhubtz";

ALTER TABLE "qti"."pci_module_form" ADD CONSTRAINT "__pci_module_form_fk_node_elxhx3pi6z" FOREIGN KEY ("__node_zkko65kuex") REFERENCES "qti"."attribute" ("__node_uyp7pedfw2") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."pci_module_form" VALIDATE CONSTRAINT "__pci_module_form_fk_node_elxhx3pi6z";

ALTER TABLE "qti"."pci_module_form" ADD CONSTRAINT "__pci_module_form_fk_node_avd6eyu2u7" FOREIGN KEY ("__node_itpy7ns7w5") REFERENCES "qti"."node" ("__parent_gvsacnek5z") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."pci_module_form" VALIDATE CONSTRAINT "__pci_module_form_fk_node_avd6eyu2u7";

ALTER TABLE "qti"."placed_body_xml_lang" ADD CONSTRAINT "__placed_body_xml_lang_fk_instance_node_dwel37os6u" FOREIGN KEY ("instance", "node") REFERENCES "qti"."placed_xml_lang" ("__instance_ryj3b3mgaw", "__node_nt6ftizred") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_body_xml_lang" VALIDATE CONSTRAINT "__placed_body_xml_lang_fk_instance_node_dwel37os6u";

ALTER TABLE "qti"."placed_catalog_ref" ADD CONSTRAINT "__placed_catalog_ref_fk_instance_id_document_c5tzckbrbm" FOREIGN KEY ("instance", "id", "document", "assembly") REFERENCES "qti"."placed_idref" ("instance", "id", "document", "assembly") MATCH SIMPLE NOT VALID;

ALTER TABLE "qti"."placed_catalog_ref" VALIDATE CONSTRAINT "__placed_catalog_ref_fk_instance_id_document_c5tzckbrbm";

ALTER TABLE "qti"."placed_math_rank" ADD CONSTRAINT "__placed_math_rank_fk_instance_document_assembly_jj2jhykves" FOREIGN KEY ("instance", "document", "assembly") REFERENCES "qti"."instance" ("id", "document", "assembly") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_math_rank" VALIDATE CONSTRAINT "__placed_math_rank_fk_instance_document_assembly_jj2jhykves";

ALTER TABLE "qti"."placed_math_rank" ADD CONSTRAINT "__placed_math_rank_fk_node_document_kind_parent_cops42i4ni" FOREIGN KEY ("node", "document", "kind", "parent") REFERENCES "qti"."node" ("id", "document", "kind", "parent") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_math_rank" VALIDATE CONSTRAINT "__placed_math_rank_fk_node_document_kind_parent_cops42i4ni";

ALTER TABLE "qti"."placed_share_target" ADD CONSTRAINT "__placed_share_target_fk_target_instance_target_uf3tu72yh7" FOREIGN KEY ("target_instance", "target_document", "assembly") REFERENCES "qti"."instance" ("id", "document", "assembly") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_share_target" VALIDATE CONSTRAINT "__placed_share_target_fk_target_instance_target_uf3tu72yh7";

ALTER TABLE "qti"."placed_xml_lang" ADD CONSTRAINT "__placed_xml_lang_fk_node_document_lang_scope_usvewkklvj" FOREIGN KEY ("node", "document", "lang", "scope") REFERENCES "qti"."xml_lang" ("node", "document", "lang", "scope") MATCH SIMPLE NOT VALID;

ALTER TABLE "qti"."placed_xml_lang" VALIDATE CONSTRAINT "__placed_xml_lang_fk_node_document_lang_scope_usvewkklvj";

ALTER TABLE "qti"."placed_xml_lang" VALIDATE CONSTRAINT "__placed_xml_lang_fk_instance_node_assembly_document_ngziov7szs";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_fk_assembly_node_attribute_form_split_5z2i4pl53a";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_fk_declaration_tag_mapping_qti_mapping_rgn2oifcf2";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_fk_declaration_tag_area_mapping_qti_area_kgjvft4gwc";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_fk_declaration_tag_value_base_integer_o4r7hakx4e";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_fk_declaration_tag_value_base_float_kdnnjf22ew";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_fk_declaration_tag_value_base_string_ki6oqeu7kd";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "__reading_fk_named_variable_declaration_declaration_egbkzlfbow";

ALTER TABLE "qti"."section_template_ref_cardinality" ADD CONSTRAINT "__section_template_ref_cardinality_fk_instance_node_wp7c4tiwlx" FOREIGN KEY ("instance", "node", "attribute", "declaration", "kind") REFERENCES "qti"."section_template_ref_declaration" ("instance", "node", "attribute", "declaration", "kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."section_template_ref_cardinality" VALIDATE CONSTRAINT "__section_template_ref_cardinality_fk_instance_node_wp7c4tiwlx";

ALTER TABLE "qti"."section_template_ref_declaration" VALIDATE CONSTRAINT "__section_template_ref_declaration_fk_declaration_pkz37wpknq";

ALTER TABLE "qti"."section_template_ref_declaration" VALIDATE CONSTRAINT "__section_template_ref_declaration_fk_instance_node_begdji7bis";

ALTER TABLE "qti"."share_fragment" ADD CONSTRAINT "__share_fragment_fk_node_a2epxbrkcq" FOREIGN KEY ("node") REFERENCES "qti"."attribute" ("__node_tblig6omlm") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."share_fragment" VALIDATE CONSTRAINT "__share_fragment_fk_node_a2epxbrkcq";

ALTER TABLE "qti"."share_fragment" ADD CONSTRAINT "__share_fragment_fk_document_placements_4xrqglfqls" FOREIGN KEY ("__document_sba7m53uwz", "__placements_umab3ec74p") REFERENCES "qti"."test_document" ("node", "instances") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."share_fragment" VALIDATE CONSTRAINT "__share_fragment_fk_document_placements_4xrqglfqls";

ALTER TABLE "qti"."site" VALIDATE CONSTRAINT "__site_fk_node_kind_fbxz4p6yn5";

ALTER TABLE "qti"."site" ADD CONSTRAINT "__site_fk_node_tag_name_href_tag_scope_external_uffcwup4ja" FOREIGN KEY ("__node_hy2rqw4ikb", "__tag_name_href_rc6np66dc4", "__tag_scope_external_4ewa3hwoox") REFERENCES "qti"."reference" ("node", "name", "scope") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."site" VALIDATE CONSTRAINT "__site_fk_node_tag_name_href_tag_scope_external_uffcwup4ja";

ALTER TABLE "qti"."template_ref_cardinality" ADD CONSTRAINT "__template_ref_cardinality_fk_node_attribute_fhyj6rqodx" FOREIGN KEY ("node", "attribute", "declaration", "kind") REFERENCES "qti"."template_ref_declaration" ("node", "attribute", "declaration", "kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."template_ref_cardinality" VALIDATE CONSTRAINT "__template_ref_cardinality_fk_node_attribute_fhyj6rqodx";

ALTER TABLE "qti"."template_ref_declaration" VALIDATE CONSTRAINT "__template_ref_declaration_fk_declaration_tag_base_4jmg5cd6ew";

ALTER TABLE "qti"."template_ref_declaration" VALIDATE CONSTRAINT "__template_ref_declaration_fk_node_attribute_xnwucalmzd";

ALTER TABLE "qti"."text_reference" ADD CONSTRAINT "__text_reference_fk_node_ta5caojw4y" FOREIGN KEY ("node") REFERENCES "qti"."node" ("__id_gzljvgjbwk") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."text_reference" VALIDATE CONSTRAINT "__text_reference_fk_node_ta5caojw4y";

ALTER TABLE "qti"."usage_value" VALIDATE CONSTRAINT "__usage_value_fk_node_base_type_lexical_j6pbqzueup";

ALTER TABLE "qti"."usage_value" ADD CONSTRAINT "__usage_value_fk_node_tag_kind_ud_value_bcoztbgkku" FOREIGN KEY ("node", "__tag_kind_ud_value_b2yl5o5lx3") REFERENCES "qti"."node" ("__id_riubp6fpbe", "kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."usage_value" VALIDATE CONSTRAINT "__usage_value_fk_node_tag_kind_ud_value_bcoztbgkku";

ALTER TABLE "qti"."usage_value" VALIDATE CONSTRAINT "__usage_value_fk_node_base_type_lexical_fqf2vzux2a";

ALTER TABLE "qti"."usage_value_base_type" ADD CONSTRAINT "__usage_value_base_type_fk_node_base_type_lexical_jlzez3fjqg" FOREIGN KEY ("node", "base_type_lexical") REFERENCES "qti"."usage_value" ("__node_uazzjek2gb", "__base_type_lexical_ch24no2osx") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."usage_value_base_type" VALIDATE CONSTRAINT "__usage_value_base_type_fk_node_base_type_lexical_jlzez3fjqg";

ALTER TABLE "qti"."variable_mapping" VALIDATE CONSTRAINT "__variable_mapping_fk_node_parent_sghjsfuygb";

ALTER TABLE "qti"."xml_lang" VALIDATE CONSTRAINT "__xml_lang_fk_node_scope_foagqp4tlw";

ALTER TABLE "qti"."xml_lang" VALIDATE CONSTRAINT "__xml_lang_fk_node_document_lang_olhyjuqwrv";
