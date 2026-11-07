CREATE INDEX "__aria_element_ix_node_cthk_6_qaxgo_iivi4cpljk" ON "qti"."aria_element" USING btree ("__node_cthk6qaxgo");

CREATE INDEX "__assembled_lang_ix_assembly_zztvlf_4_xug_generals_ybeduh5upi" ON "qti"."assembled_lang" USING btree ("__assembly_zztvlf4xug", "__generals_pdunagxmfe");

CREATE INDEX "__assembled_reference_ix_assembly_beyjdapot_4_node_6_iplpehrqnd" ON "qti"."assembled_reference" USING btree ("__assembly_beyjdapot4", "__node_6kc5b2t3fi", "__attribute_m23x7bmxe6", "__kind_3ljxypfz46");

CREATE INDEX "__assembled_reference_ix_assembly_dnj_4_uerdi_4_node_podbscxw43" ON "qti"."assembled_reference" USING btree ("__assembly_dnj4uerdi4", "__node_ofsz4apvw5", "__attribute_ooa2yqs7zw");

CREATE INDEX "__assembled_reference_ix_node_attribute_document_izcuteb6lm" ON "qti"."assembled_reference" USING btree ("node", "attribute", "document", "identifier", "kind", "role", "root_kind");

CREATE INDEX "__assessment_object_ix_node_6_wcvqzkni_5_lang_tag_z_pk47o6cfgu" ON "qti"."assessment_object" USING btree ("__node_6wcvqzkni5", "__lang_tag_z26nh6ety2");

CREATE INDEX "__attribute_ix_node_6_piwdwr_2_vb_nar3y3mfn6" ON "qti"."attribute" USING btree ("__node_6piwdwr2vb");

CREATE INDEX "__attribute_ix_node_6_qw_4_z_7_l_7_sv_3evoy7v43q" ON "qti"."attribute" USING btree ("__node_6qw4z7l7sv");

CREATE INDEX "__attribute_ix_node_7_iuvvf_6_ijd_767bkvdhgt" ON "qti"."attribute" USING btree ("__node_7iuvvf6ijd");

CREATE INDEX "__attribute_ix_node_iz_4_wh_6_p_7_bb_zjmlxwu56b" ON "qti"."attribute" USING btree ("__node_iz4wh6p7bb");

CREATE INDEX "__attribute_ix_node_mz_4_jvdrujv_imi5yesybm" ON "qti"."attribute" USING btree ("__node_mz4jvdrujv");

CREATE INDEX "__attribute_ix_node_vakq_25_d_2_th_dq3p5mlkpj" ON "qti"."attribute" USING btree ("__node_vakq25d2th");

CREATE INDEX "__binding_declaration_ix_node_6_hhkc_3_nqmt_kind_wpz_rfgek7meu3" ON "qti"."binding_declaration" USING btree ("__node_6hhkc3nqmt", "__kind_wpz27h2czt");

CREATE INDEX "__binding_declaration_ix_node_7_ferm_5_v_3_gc_g2syf7lsms" ON "qti"."binding_declaration" USING btree ("__node_7ferm5v3gc");

CREATE INDEX "__binding_declaration_ix_node_gfaeb_4_prff_mosts_56hhno3yjq" ON "qti"."binding_declaration" USING btree ("__node_gfaeb4prff", "__mosts_tsxccemewe");

CREATE INDEX "__binding_declaration_ix_declaration_document_bo7igokpag" ON "qti"."binding_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__bound_variable_ix_node_nqyr_3_apalb_boea2xstsg" ON "qti"."bound_variable" USING btree ("__node_nqyr3apalb");

CREATE INDEX "__bound_variable_ix_document_adaptive_n6kfnh6nqx" ON "qti"."bound_variable" USING btree ("document", "adaptive");

CREATE INDEX "__branch_resolution_ix_document_rule_target_o65cskhrhn" ON "qti"."branch_resolution" USING btree ("document", "rule", "target");

CREATE INDEX "__branch_resolution_ix_instance_owner_owner_end_frru5ois7z" ON "qti"."branch_resolution" USING btree ("instance", "owner", "owner_end", "owner_part", "owner_start");

CREATE INDEX "__branch_resolution_ix_rule_owner_owner_kind_bguf26cweg" ON "qti"."branch_resolution" USING btree ("rule", "owner", "owner_kind");

CREATE INDEX "__branch_rule_ix_parent_parent_kind_j2bown3swy" ON "qti"."branch_rule" USING btree ("parent", "parent_kind");

CREATE INDEX "__branch_shuffle_ix_branch_branch_parent_an7r7tpk7w" ON "qti"."branch_shuffle" USING btree ("branch", "branch_parent");

CREATE INDEX "__branch_shuffle_ix_target_instance_branch_branch_nfredzu3eh" ON "qti"."branch_shuffle" USING btree ("target_instance", "branch", "branch_end", "branch_part", "branch_start");

CREATE INDEX "__branch_shuffle_ix_target_instance_common_assembly_dgxpax6voq" ON "qti"."branch_shuffle" USING btree ("target_instance", "common", "assembly", "common_end", "common_kind", "common_mixes", "common_part", "common_replaced", "common_start");

CREATE INDEX "__branch_target_ix_target_instance_target_instance_kyjd4x3wcm" ON "qti"."branch_target" USING btree ("target_instance", "target_instance_end", "target_instance_start");

CREATE INDEX "__branch_target_ix_target_instance_target_node_p6tjjvgrye" ON "qti"."branch_target" USING btree ("target_instance", "target_node", "assembly", "target_end", "target_kind", "target_mixes", "target_part", "target_replaced", "target_start");

CREATE INDEX "__branch_target_ix_target_instance_target_node_t6as4jtpvh" ON "qti"."branch_target" USING btree ("target_instance", "target_node", "target");

CREATE INDEX "__branch_target_ix_via_via_end_via_parent_via_site_roktrf5czs" ON "qti"."branch_target" USING btree ("via", "via_end", "via_parent", "via_site_start", "via_start");

CREATE INDEX "__choice_ix_node_gfaeb_4_prff_hqakbxexks" ON "qti"."choice" USING btree ("__node_gfaeb4prff");

CREATE INDEX "__choice_variable_name_ix_document_root_kind_7it7boess2" ON "qti"."choice_variable_name" USING btree ("document", "root_kind");

CREATE INDEX "__context_ref_ix_node_55_rq_6_xvhgt_attribute_ofb6ulzvpb" ON "qti"."context_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__context_ref_declaration_ix_declaration_document_jbdp6q6ajr" ON "qti"."context_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__count_bound_ix_node_hees_5_ytmaq_wvdcxve7s4" ON "qti"."count_bound" USING btree ("__node_hees5ytmaq");

CREATE INDEX "__count_bound_ix_node_oryuiniu_46_y75przpimy" ON "qti"."count_bound" USING btree ("__node_oryuiniu46");

CREATE INDEX "__count_bound_ix_node_oxfetlrikr_choices_figr_66_ekxcciuje7" ON "qti"."count_bound" USING btree ("__node_oxfetlrikr", "__choices_figr66khyk");

CREATE INDEX "__count_bound_ix_node_tq_76_jy_5_o_5_h_min_name_pq_4_cfzc3z4y7c" ON "qti"."count_bound" USING btree ("__node_tq76jy5o5h", "__min_name_pq4iyemtqh");

CREATE INDEX "__count_bound_ix_node_uyvwkuoluo_max_name_perr_4_n6ow3yqmjw" ON "qti"."count_bound" USING btree ("__node_uyvwkuoluo", "__max_name_perr4lpmuf");

CREATE INDEX "__count_bound_ix_node_wdev_3_ncr_3_a_4r36oaddlg" ON "qti"."count_bound" USING btree ("__node_wdev3ncr3a");

CREATE INDEX "__declaration_ix_node_kuknox_4_dci_base_type_jmtyhi_sasn7hrdgt" ON "qti"."declaration" USING btree ("__node_kuknox4dci", "__base_type_jmtyhi5b7n");

CREATE INDEX "__declaration_ix_node_mp_2_o_432_mbm_nw4kkjnz4t" ON "qti"."declaration" USING btree ("__node_mp2o432mbm");

CREATE INDEX "__declaration_ix_node_ss_2_nzqf_54_f_isvhdhhzrg" ON "qti"."declaration" USING btree ("__node_ss2nzqf54f");

CREATE INDEX "__declaration_ix_node_ucda_4_beqaz_qhkin6wqsw" ON "qti"."declaration" USING btree ("__node_ucda4beqaz");

CREATE INDEX "__dependency_ix_resource_package_txdc5xfn7z" ON "qti"."dependency" USING btree ("resource", "package");

CREATE INDEX "__dependency_target_ix_package_ref_target_2iifdwtrng" ON "qti"."dependency_target" USING btree ("package", "ref", "target");

CREATE INDEX "__document_ix_node_5_zotaizsb_2_qbvrbvdbck" ON "qti"."document" USING btree ("__node_5zotaizsb2");

CREATE INDEX "__document_ix_node_ejjgk_3_z_2_mi_hqve44he6v" ON "qti"."document" USING btree ("__node_ejjgk3z2mi");

CREATE INDEX "__document_ix_node_nv_676_cv_335_qde4grdoez" ON "qti"."document" USING btree ("__node_nv676cv335");

CREATE INDEX "__document_ix_package_vkukekqhil_path_wawqt_33_xsc_rgf5fewhpu" ON "qti"."document" USING btree ("__package_vkukekqhil", "__path_wawqt33xsc", "__resource_type_jl3dzs2kez");

CREATE INDEX "__document_id_ix_node_5_h_62_ntbykp_ypjeldmeko" ON "qti"."document_id" USING btree ("__node_5h62ntbykp");

CREATE INDEX "__document_id_ix_node_tpei_2_g_34_n_6_nw552oiicy" ON "qti"."document_id" USING btree ("__node_tpei2g34n6");

CREATE INDEX "__document_lang_ix_document_juyvfcb_7_ad_generals_xnnbzpp52u" ON "qti"."document_lang" USING btree ("__document_juyvfcb7ad", "__generals_pdunagxmfe");

CREATE INDEX "__entry_ix_package_sm_22_xuinlg_path_fceociruej_jddz344rfe" ON "qti"."entry" USING btree ("__package_sm22xuinlg", "__path_fceociruej");

CREATE INDEX "__expression_ix_node_oay_5_lzx_65_r_2zpayqdtdx" ON "qti"."expression" USING btree ("__node_oay5lzx65r");

CREATE INDEX "__expression_ix_node_qtmjx_7_wiji_gsqvolgjmv" ON "qti"."expression" USING btree ("__node_qtmjx7wiji");

CREATE INDEX "__expression_ix_node_uquzqs_6_gxs_4qbk5c4rhs" ON "qti"."expression" USING btree ("__node_uquzqs6gxs");

CREATE INDEX "__expression_ix_parent_6_yrq_7_ihsir_language_ww_4_k_hjdnxi3gs2" ON "qti"."expression" USING btree ("__parent_6yrq7ihsir", "__language_ww4k4vlpds");

CREATE INDEX "__expression_ix_parent_kdf_7_bvwd_3_e_base_type_qjae_eh74k4om4f" ON "qti"."expression" USING btree ("__parent_kdf7bvwd3e", "__base_type_qjae6hkszc", "__cardinality_2aht7nrcom");

CREATE INDEX "__expression_ix_parent_u_2_j_436_zloh_language_x_4_r_lkp5oxijq6" ON "qti"."expression" USING btree ("__parent_u2j436zloh", "__language_x4r7vlpnyw");

CREATE INDEX "__expression_ix_parent_parent_kind_v7wq5auyht" ON "qti"."expression" USING btree ("parent", "parent_kind");

CREATE INDEX "__expression_attribute_ix_node_cmhaiwbl_5_v_bxuaecq22l" ON "qti"."expression_attribute" USING btree ("__node_cmhaiwbl5v", "__attribute_2r6eaz6bn7");

CREATE INDEX "__expression_attribute_ix_node_parent_kind_language_gsd2wfc7iw" ON "qti"."expression_attribute" USING btree ("node", "parent", "kind", "language", "base_type", "cardinality");

CREATE INDEX "__feedback_ref_ix_node_55_rq_6_xvhgt_attribute_albw6cn7sl" ON "qti"."feedback_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__feedback_ref_declaration_ix_declaration_document_ck2ki4xyxz" ON "qti"."feedback_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__file_ix_package_a_66_fvayvxi_path_mzwjzn_5_rcd_243ov6udky" ON "qti"."file" USING btree ("__package_a66fvayvxi", "__path_mzwjzn5rcd");

CREATE INDEX "__file_ix_resource_package_44pfqjhrww" ON "qti"."file" USING btree ("resource", "package");

CREATE INDEX "__general_lang_ix_general_document_fp6l52nwpe" ON "qti"."general_lang" USING btree ("general", "document");

CREATE INDEX "__general_lang_ix_general_value_22hnwmcxp2" ON "qti"."general_lang" USING btree ("general", "value");

CREATE INDEX "__general_named_ix_general_f_24_tz_5_nizf_record_5_oj6wjyvok6" ON "qti"."general_named" USING btree ("__general_f24tz5nizf", "__record_5sk7vx3x55");

CREATE INDEX "__general_named_ix_record_named_jpdbjuasav" ON "qti"."general_named" USING btree ("record", "named");

CREATE INDEX "__general_object_ix_record_document_hgobdbf752" ON "qti"."general_object" USING btree ("record", "document");

CREATE INDEX "__header_token_ix_table_token_j56qzf73hw" ON "qti"."header_token" USING btree ("table", "token");

CREATE INDEX "__hotspot_ix_parent_parent_elements_parent_element_yskzk4io4w" ON "qti"."hotspot" USING btree ("parent", "parent_elements", "parent_element_children");

CREATE INDEX "__hotspot_ix_parent_parent_kind_4ibz24texs" ON "qti"."hotspot" USING btree ("parent", "parent_kind");

CREATE INDEX "__hottext_ix_nearest_hwydxjcozk_nearest_kind_lghm_4_gpyxgcucbu" ON "qti"."hottext" USING btree ("__nearest_hwydxjcozk", "__nearest_kind_lghm4fk3hv");

CREATE INDEX "__idref_ix_document_token_adbkwp6bpx" ON "qti"."idref" USING btree ("document", "token");

CREATE INDEX "__idref_target_ix_document_jwyigkitch_id_chqpn_6_obmkxnsyyy" ON "qti"."idref_target" USING btree ("__document_jwyigkitch", "__id_chqpn6jlrw");

CREATE INDEX "__instance_ix_document_o_6_kvqfj_3_ih_bindings_5_fgw_yur5vinnj2" ON "qti"."instance" USING btree ("__document_o6kvqfj3ih", "__bindings_5fgw5mpsmp", "__langs_sby525kjel", "__variables_yieglk3t57");

CREATE INDEX "__instance_ix_document_rhvczgk_64_o_names_y_5_jy_2_spup5ono3j" ON "qti"."instance" USING btree ("__document_rhvczgk64o", "__names_y5jy2qvfjk");

CREATE INDEX "__instance_ix_document_rhvczgk_64_o_rules_ifltb_6_bfu3kdnc4f" ON "qti"."instance" USING btree ("__document_rhvczgk64o", "__rules_ifltb6mctd");

CREATE INDEX "__instance_ix_id_c_2_gditcxq_7_document_gmto_4_z_7_i2sqkraafs" ON "qti"."instance" USING btree ("__id_c2gditcxq7", "__document_gmto4z7tys", "__assembly_3igckutdzu", "__assembly_kind_ca6s4q5hbx");

CREATE INDEX "__instance_ix_id_krjnew_3_njl_assembly_dsuo_3_atnoz_s45aolpkfz" ON "qti"."instance" USING btree ("__id_krjnew3njl", "__assembly_dsuo3atnoz", "__assembly_kind_4ayori4n47", "__document_hkqd3hdfxl");

CREATE INDEX "__instance_ix_parent_document_rwupqx_3_wr_4_site_hdx_u33charzd5" ON "qti"."instance" USING btree ("__parent_document_rwupqx3wr4", "__site_hdx6niaggk", "__site_loose_chain_auzbyxsd6l", "__site_mixes_3a6cfv2jw2", "__site_part_robpllbu4o", "__site_replaced_wek36iyig7", "__site_start_xdxepuvnp7");

CREATE INDEX "__instance_ix_site_hdx_6_niaggk_document_iu_7_n_6_pecn4qx7js" ON "qti"."instance" USING btree ("__site_hdx6niaggk", "__document_iu7n6ahln3");

CREATE INDEX "__instance_ix_document_ids_idref_targets_choices_yaskm27ja3" ON "qti"."instance" USING btree ("document", "ids", "idref_targets", "choices", "hottexts");

CREATE INDEX "__instance_name_ix_document_node_identifier_6jlosqls2y" ON "qti"."instance_name" USING btree ("document", "node", "identifier");

CREATE INDEX "__instance_name_ix_node_end_kind_named_loose_chain_mxebuuxbon" ON "qti"."instance_name" USING btree ("node", "end", "kind", "named_loose_chain", "named_mixes", "named_part", "named_replaced", "start");

CREATE INDEX "__interaction_ix_node_gfaeb_4_prff_on3ekn3rtn" ON "qti"."interaction" USING btree ("__node_gfaeb4prff");

CREATE INDEX "__interaction_attribute_ix_node_2_q_2_oae_7_puk_76ppcqtnu5" ON "qti"."interaction_attribute" USING btree ("__node_2q2oae7puk", "__value_oxrxhywfi2");

CREATE INDEX "__interaction_attribute_ix_node_4_sdr_4_z_4_uk_4_xiomxb7m3s" ON "qti"."interaction_attribute" USING btree ("__node_4sdr4z4uk4", "__name_x2aucoa64q", "__kind_456qikcgha", "__document_wwleenfkxb", "__value_dkwqpcuznd");

CREATE INDEX "__interaction_attribute_ix_node_b_4_cysfcqdk_value_xpvzzqzb6h" ON "qti"."interaction_attribute" USING btree ("__node_b4cysfcqdk", "__value_efvhlmam3z");

CREATE INDEX "__interaction_attribute_ix_node_dfhz_6_dgkds_name_2_uxbeafm4xj" ON "qti"."interaction_attribute" USING btree ("__node_dfhz6dgkds", "__name_2g7bkdjtwl", "__kind_teqpxqcv7n", "__document_kefywyspw6", "__root_kind_2a27psohyb", "__value_3u6ov5n4s6");

CREATE INDEX "__interaction_attribute_ix_node_flbilkbnpr_value_sdrihhtt6q" ON "qti"."interaction_attribute" USING btree ("__node_flbilkbnpr", "__value_mdalpmjeoc");

CREATE INDEX "__interaction_attribute_ix_node_h_2_pd_4_crnor_name_4ixn5bstnq" ON "qti"."interaction_attribute" USING btree ("__node_h2pd4crnor", "__name_dedat2iga6", "__value_b2dcpkspbl");

CREATE INDEX "__interaction_attribute_ix_node_j_7_kkly_36_i_5_name_gvpcvdtqta" ON "qti"."interaction_attribute" USING btree ("__node_j7kkly36i5", "__name_abegcpcfbo", "__kind_pl2fkn5cnz", "__document_adgif4vjwc", "__value_orhsjpvixb");

CREATE INDEX "__interaction_attribute_ix_node_jtydmgg_6_nc_name_hei2juggao" ON "qti"."interaction_attribute" USING btree ("__node_jtydmgg6nc", "__name_ntn7qofp4y", "__kind_nfa36xovze", "__document_q2tps5dvfq", "__value_ct2tqxnafs");

CREATE INDEX "__interaction_attribute_ix_node_nh_35_tvp_7_et_value_hjzauklvvm" ON "qti"."interaction_attribute" USING btree ("__node_nh35tvp7et", "__value_rrtdtetll6");

CREATE INDEX "__interaction_attribute_ix_node_ocpnzhggsu_name_3_uo_u6ldht2ezm" ON "qti"."interaction_attribute" USING btree ("__node_ocpnzhggsu", "__name_3uo72f6kw4", "__kind_fbj4jha3yk", "__document_dzpju7pnfw", "__root_kind_ubbie4ds6n", "__value_jmfaawhlxd");

CREATE INDEX "__interaction_attribute_ix_node_ozxio_6_e_2_u_5_4nyxw274vf" ON "qti"."interaction_attribute" USING btree ("__node_ozxio6e2u5", "__value_bxzxkt6uvs");

CREATE INDEX "__interaction_attribute_ix_node_padbue_3_zvo_name_64_yem4rbpm3k" ON "qti"."interaction_attribute" USING btree ("__node_padbue3zvo", "__name_64kjos2b75", "__kind_2l4uhszbdi", "__document_o5amvkxi7u", "__value_dn24zfiou4");

CREATE INDEX "__interaction_attribute_ix_node_t_777_luyk_3_g_name_2veecz6vt4" ON "qti"."interaction_attribute" USING btree ("__node_t777luyk3g", "__name_limigk44w6", "__kind_bcfvh5xx6m", "__document_egzcabyxvz", "__value_kb5rjfmgxs");

CREATE INDEX "__interaction_attribute_ix_node_tbq_7_mvy_7_hj_name_kwjepnbdat" ON "qti"."interaction_attribute" USING btree ("__node_tbq7mvy7hj", "__name_7sg2on63h6", "__kind_oqssngwejq", "__document_gfjmj2jpph", "__root_kind_nb26w2yfbv", "__value_ogpaod77i3");

CREATE INDEX "__interaction_attribute_ix_node_tqbtbiuzf_7_name_2ujed4sbwk" ON "qti"."interaction_attribute" USING btree ("__node_tqbtbiuzf7", "__name_xhdwpelzd7", "__kind_wr763w6z46", "__document_wx3aj22fri", "__value_aqa3fl4va4");

CREATE INDEX "__interaction_attribute_ix_node_uuxlnvvdom_name_4_w_grusornmgx" ON "qti"."interaction_attribute" USING btree ("__node_uuxlnvvdom", "__name_4w2o46ykat", "__kind_ydtwfyasxn", "__document_cro4kuimnk", "__root_kind_a2frxb5zfs", "__value_kg73het3zn");

CREATE INDEX "__interaction_attribute_ix_document_root_kind_fyhxu2mcle" ON "qti"."interaction_attribute" USING btree ("document", "root_kind");

CREATE INDEX "__item_mode_ix_document_gfqaer_5_w_2_f_xg25r6slqs" ON "qti"."item_mode" USING btree ("__document_gfqaer5w2f");

CREATE INDEX "__item_ref_document_ix_document_package_path_shtyge55dk" ON "qti"."item_ref_document" USING btree ("document", "package", "path");

CREATE INDEX "__item_ref_target_ix_package_path_type_5edpacmhmd" ON "qti"."item_ref_target" USING btree ("package", "path", "type");

CREATE INDEX "__label_use_ix_document_h_55_jb_4_nosx_4zh43rsle7" ON "qti"."label_use" USING btree ("__document_h55jb4nosx");

CREATE INDEX "__label_use_ix_document_root_kind_d7n36nygky" ON "qti"."label_use" USING btree ("document", "root_kind");

CREATE INDEX "__least_count_ix_node_tq_76_jy_5_o_5_h_min_name_pq_4_y4fjvyu23q" ON "qti"."least_count" USING btree ("__node_tq76jy5o5h", "__min_name_pq4iyemtqh", "__least_4gxcnzzzun");

CREATE INDEX "__lom_entry_ix_holder_parent_kfyljtvgqx_named_ocapo_c4erjekyiz" ON "qti"."lom_entry" USING btree ("__holder_parent_kfyljtvgqx", "__named_ocapo4zbvy");

CREATE INDEX "__lom_entry_ix_holder_parent_qdla_3_hvjza_73bey2ksrc" ON "qti"."lom_entry" USING btree ("__holder_parent_qdla3hvjza");

CREATE INDEX "__lom_entry_ix_holder_document_holder_kind_holder_nk23z3ns55" ON "qti"."lom_entry" USING btree ("holder", "document", "holder_kind", "holder_start", "nearest", "version", "holder_parent");

CREATE INDEX "__lom_entry_ix_parent_document_identifier_kind_hvrx7ylnlb" ON "qti"."lom_entry" USING btree ("parent", "document", "identifier_kind", "identifier_start", "nearest", "version", "holder");

CREATE INDEX "__lom_general_ix_node_j_26_rtrceou_owner_parent_v_5_gzlkq5h377" ON "qti"."lom_general" USING btree ("__node_j26rtrceou", "__owner_parent_v5upyxkd5f");

CREATE INDEX "__lom_general_ix_parent_owner_owner_parent_65adid7ts7" ON "qti"."lom_general" USING btree ("parent", "owner", "owner_parent");

CREATE INDEX "__lom_object_ix_package_path_document_frfnkmirfz" ON "qti"."lom_object" USING btree ("package", "path", "document");

CREATE INDEX "__lom_object_ix_resource_package_path_type_rbtrkgelon" ON "qti"."lom_object" USING btree ("resource", "package", "path", "type");

CREATE INDEX "__lom_object_identifier_ix_document_identifier_3rxurux3wz" ON "qti"."lom_object_identifier" USING btree ("document", "identifier");

CREATE INDEX "__lom_object_title_ix_document_object_lang_on7ykreu5b" ON "qti"."lom_object_title" USING btree ("document", "object_lang");

CREATE INDEX "__lom_object_title_ix_document_title_c27mpplush" ON "qti"."lom_object_title" USING btree ("document", "title");

CREATE INDEX "__lom_object_title_ix_string_string_language_nwkcioklem" ON "qti"."lom_object_title" USING btree ("string", "string_language");

CREATE INDEX "__lom_record_ix_node_uylg_5_h_7_nr_5_named_quw_3_gqg_ikiliml3c6" ON "qti"."lom_record" USING btree ("__node_uylg5h7nr5", "__named_quw3gqg6g5", "__owner_parent_jocfpemvgh");

CREATE INDEX "__lom_record_ix_owner_parent_v_5_upyxkd_5_f_named_2_7a6t4hd2ih" ON "qti"."lom_record" USING btree ("__owner_parent_v5upyxkd5f", "__named_2elp6yjc6y");

CREATE INDEX "__lom_record_ix_parent_document_owner_owner_start_3e5gpkmcp5" ON "qti"."lom_record" USING btree ("parent", "document", "owner", "owner_start", "nearest", "version", "owner_parent");

CREATE INDEX "__lom_resource_ix_node_uylg_5_h_7_nr_5_named_quw_3_jelkqwgkj6" ON "qti"."lom_resource" USING btree ("__node_uylg5h7nr5", "__named_quw3gqg6g5");

CREATE INDEX "__lom_resource_type_ix_node_dzmkpyu_5_uh_xlkqyn3rx3" ON "qti"."lom_resource_type" USING btree ("__node_dzmkpyu5uh");

CREATE INDEX "__lom_string_ix_node_najnjopqcl_language_tag_nc2dsa2rkl" ON "qti"."lom_string" USING btree ("__node_najnjopqcl", "__language_tag_kebbbhfmz4");

CREATE INDEX "__lom_title_ix_record_5_sk_7_vx_3_x_55_elnrd27dse" ON "qti"."lom_title" USING btree ("__record_5sk7vx3x55");

CREATE INDEX "__lom_title_ix_parent_document_general_kind_general_zvgct36clm" ON "qti"."lom_title" USING btree ("parent", "document", "general_kind", "general_start", "nearest", "version", "record");

CREATE INDEX "__lom_title_ix_record_named_azq7bk3jyx" ON "qti"."lom_title" USING btree ("record", "named");

CREATE INDEX "__lom_title_string_ix_parent_record_rceskft3ck" ON "qti"."lom_title_string" USING btree ("parent", "record");

CREATE INDEX "__lookup_table_ix_declaration_2_lvqlmsloq_fzhjn6ccml" ON "qti"."lookup_table" USING btree ("__declaration_2lvqlmsloq");

CREATE INDEX "__lookup_table_ix_declaration_3_pd_2_vxtld_5_blhv6xwg7q" ON "qti"."lookup_table" USING btree ("__declaration_3pd2vxtld5");

CREATE INDEX "__lookup_value_ix_node_iqtxzzsjue_base_type_cyz_5_76y7tzzf5w" ON "qti"."lookup_value" USING btree ("__node_iqtxzzsjue", "__base_type_cyz5isoh5z");

CREATE INDEX "__lookup_value_ix_parent_pewwtbkfib_base_type_twgd_5_6gtnoezzgu" ON "qti"."lookup_value" USING btree ("__parent_pewwtbkfib", "__base_type_twgd5upc66");

CREATE INDEX "__manifest_id_space_ix_package_5_ngwirsjrz_kxyjishfex" ON "qti"."manifest_id_space" USING btree ("__package_5ngwirsjrz", "__identifier_aeqb2xho4a");

CREATE INDEX "__manifest_id_space_ix_package_srcfwxd_3_vo_4ya7dzzwfb" ON "qti"."manifest_id_space" USING btree ("__package_srcfwxd3vo", "__identifier_6zkottivdn");

CREATE INDEX "__map_key_ix_node_6_lk_2_adbt_6_a_mapping_tkk_6_ijh_aqx5zgtmyr" ON "qti"."map_key" USING btree ("__node_6lk2adbt6a", "__mapping_tkk6ijh6ed", "__key_bf5xu2ffqp");

CREATE INDEX "__map_key_ix_node_ebvkcq_3_dgn_mapping_vir_5_nmmkdk_3euaxh5cnb" ON "qti"."map_key" USING btree ("__node_ebvkcq3dgn", "__mapping_vir5nmmkdk", "__key_7ig3nflr2e");

CREATE INDEX "__map_key_ix_node_eieh_3_eucve_mapping_ouqgh_2_kna_7_mm6hikjbp2" ON "qti"."map_key" USING btree ("__node_eieh3eucve", "__mapping_ouqgh2kna7", "__key_4mqdmzyt6y");

CREATE INDEX "__map_key_ix_node_eqoqfegnub_mapping_3_txucoorev_key_5yoq427ftm" ON "qti"."map_key" USING btree ("__node_eqoqfegnub", "__mapping_3txucoorev", "__key_rx226v6a7b");

CREATE INDEX "__map_key_ix_node_pvsn_4_l_2_dx_5_mapping_y_7_szfvlz3cuk" ON "qti"."map_key" USING btree ("__node_pvsn4l2dx5", "__mapping_y7shykwugo", "__key_uazpfi6m3q");

CREATE INDEX "__map_key_ix_mapping_base_type_gdnaq3ufjw" ON "qti"."map_key" USING btree ("mapping", "base_type");

CREATE INDEX "__mapping_source_declaration_ix_declaration_item_uqy35mwu7k" ON "qti"."mapping_source_declaration" USING btree ("declaration", "item_document", "source", "declaration_kind", "decl_base_type", "decl_cardinality");

CREATE INDEX "__mapping_source_declaration_ix_item_document_target_pcfndc2rtd" ON "qti"."mapping_source_declaration" USING btree ("item_document", "target", "target_declared");

CREATE INDEX "__mapping_source_declaration_ix_item_ref_item_6r7kblgpwe" ON "qti"."mapping_source_declaration" USING btree ("item_ref", "item_document");

CREATE INDEX "__most_count_ix_node_uyvwkuoluo_max_name_perr_4_zoblsng4ar" ON "qti"."most_count" USING btree ("__node_uyvwkuoluo", "__max_name_perr4lpmuf", "__most_gdqaao6iy4");

CREATE INDEX "__name_lookup_ix_assembly_nu_2_ggq_7_tnl_name_viaaky_dpe42454s5" ON "qti"."name_lookup" USING btree ("__assembly_nu2ggq7tnl", "__name_viaaky6xuf", "__node_utrygbl66o", "__placements_yafzwo6qto");

CREATE INDEX "__name_lookup_ix_instance_t_7_r_3_n_54_jv_2_node_25zgx7upse" ON "qti"."name_lookup" USING btree ("__instance_t7r3n54jv2", "__node_utrygbl66o", "__assembly_nu2ggq7tnl", "__replaced_yi62d33oxu");

CREATE INDEX "__name_lookup_ix_node_6_gzlfewm_3_x_resource_type_4i356vvhdv" ON "qti"."name_lookup" USING btree ("__node_6gzlfewm3x", "__resource_type_uhqjiczjeq");

CREATE INDEX "__name_lookup_ix_node_thfa_4_gfsui_item_document_5_wis2cozbwj" ON "qti"."name_lookup" USING btree ("__node_thfa4gfsui", "__item_document_5xqzpkafzu");

CREATE INDEX "__name_lookup_ix_node_utrygbl_66_o_kind_yfbaqym_63_k_2yknche5zs" ON "qti"."name_lookup" USING btree ("__node_utrygbl66o", "__kind_yfbaqym63k");

CREATE INDEX "__named_ix_node_4_f_5_xcfmhbc_part_4_gtxaphjyp_p6wr2egvhs" ON "qti"."named" USING btree ("__node_4f5xcfmhbc", "__part_4gtxaphjyp", "__replaced_cn7cl6rjxv", "__mixes_byc4olsxrq", "__loose_chain_ajn7kudydp");

CREATE INDEX "__named_ix_parent_vipwpcgcs_7_part_4_cq_4_qtivnd_aoesrvjgd7" ON "qti"."named" USING btree ("__parent_vipwpcgcs7", "__part_4cq4qtivnd", "__replaced_xc4ckx6v2e");

CREATE INDEX "__named_ix_parent_parent_kind_3665qr2rm7" ON "qti"."named" USING btree ("parent", "parent_kind");

CREATE INDEX "__node_ix_document_jlx_2_xep_5_af_kind_3_zonnawsqb_pgvugnbbe4" ON "qti"."node" USING btree ("__document_jlx2xep5af", "__kind_3zonnawsqb");

CREATE INDEX "__node_ix_id_2_ecax_7_r_3_ho_bfjukv7bjf" ON "qti"."node" USING btree ("__id_2ecax7r3ho");

CREATE INDEX "__node_ix_id_3_pophosnyx_na3p2sdaca" ON "qti"."node" USING btree ("__id_3pophosnyx");

CREATE INDEX "__node_ix_id_4_p_3_x_6_fs_6_ds_string_value_au_6_fy_catsvvezob" ON "qti"."node" USING btree ("__id_4p3x6fs6ds", "__string_value_au6fy6olpt");

CREATE INDEX "__node_ix_id_4_vxvcu_7_dk_3_ihwlxgelr7" ON "qti"."node" USING btree ("__id_4vxvcu7dk3");

CREATE INDEX "__node_ix_id_aejnsmuu_6_s_zynyxypog5" ON "qti"."node" USING btree ("__id_aejnsmuu6s");

CREATE INDEX "__node_ix_id_apujacx_2_gd_hleehmvdyg" ON "qti"."node" USING btree ("__id_apujacx2gd");

CREATE INDEX "__node_ix_id_buqmbkuqrp_3l33y67exd" ON "qti"."node" USING btree ("__id_buqmbkuqrp");

CREATE INDEX "__node_ix_id_fh_4_h_2_bqbbf_7kgc2fhw2x" ON "qti"."node" USING btree ("__id_fh4h2bqbbf");

CREATE INDEX "__node_ix_id_gb_2_nnvx_2_kq_ocguajr7cg" ON "qti"."node" USING btree ("__id_gb2nnvx2kq");

CREATE INDEX "__node_ix_id_gq_6_uzbosmd_lbbldzbt2l" ON "qti"."node" USING btree ("__id_gq6uzbosmd");

CREATE INDEX "__node_ix_id_ixxzr_33747_dha3padnfb" ON "qti"."node" USING btree ("__id_ixxzr33747");

CREATE INDEX "__node_ix_id_jqcli_57_r_6_e_bldsko2j2o" ON "qti"."node" USING btree ("__id_jqcli57r6e");

CREATE INDEX "__node_ix_id_krhskfntdz_dna4tap7x5" ON "qti"."node" USING btree ("__id_krhskfntdz");

CREATE INDEX "__node_ix_id_laqeu_7_frlh_cy5xxe72iy" ON "qti"."node" USING btree ("__id_laqeu7frlh");

CREATE INDEX "__node_ix_id_lsekb_7_odow_o6wkiwwwkl" ON "qti"."node" USING btree ("__id_lsekb7odow");

CREATE INDEX "__node_ix_id_nvk_6_qhdomt_3pcqs3cpc7" ON "qti"."node" USING btree ("__id_nvk6qhdomt");

CREATE INDEX "__node_ix_id_orae_3_kwywm_boahc6pavr" ON "qti"."node" USING btree ("__id_orae3kwywm");

CREATE INDEX "__node_ix_id_q_3_fkvdlrzq_vldm573gsy" ON "qti"."node" USING btree ("__id_q3fkvdlrzq");

CREATE INDEX "__node_ix_id_rbrnmh_2_xkm_73o3wfx6yz" ON "qti"."node" USING btree ("__id_rbrnmh2xkm");

CREATE INDEX "__node_ix_id_tht_2_ejquu_7_v6y5s6u3as" ON "qti"."node" USING btree ("__id_tht2ejquu7");

CREATE INDEX "__node_ix_id_v_3_yvnypwaj_sz2qes5tv3" ON "qti"."node" USING btree ("__id_v3yvnypwaj");

CREATE INDEX "__node_ix_id_xxjhviby_37_2hf4xzjzjl" ON "qti"."node" USING btree ("__id_xxjhviby37");

CREATE INDEX "__node_ix_id_xzp_4_ngpydi_77offtplxc" ON "qti"."node" USING btree ("__id_xzp4ngpydi");

CREATE INDEX "__node_ix_id_yjlplxiyyf_vy5l3o5vwk" ON "qti"."node" USING btree ("__id_yjlplxiyyf");

CREATE INDEX "__node_ix_id_zvbpmu_7_yp_2_7lilutusav" ON "qti"."node" USING btree ("__id_zvbpmu7yp2");

CREATE INDEX "__node_ix_document_start_id_fjfijlv7gg" ON "qti"."node" USING btree ("document", "start", "id");

CREATE INDEX "__normal_minimum_ix_node_cmhaiwbl_5_v_3fnrsivv7a" ON "qti"."normal_minimum" USING btree ("__node_cmhaiwbl5v");

CREATE INDEX "__open_attribute_name_ix_node_xyk_6_f_5_hny_4_ytdu4qply5" ON "qti"."open_attribute_name" USING btree ("__node_xyk6f5hny4", "__element_namespace_a7msmtijer");

CREATE INDEX "__open_element_name_ix_parent_beba_3_avbja_parent_xrpkgh2egm" ON "qti"."open_element_name" USING btree ("__parent_beba3avbja", "__parent_namespace_4hhnuwl5pd");

CREATE INDEX "__open_element_name_ix_parent_parent_kind_6p3wnbjbjh" ON "qti"."open_element_name" USING btree ("parent", "parent_kind");

CREATE INDEX "__placed_binding_ix_node_nqyr_3_apalb_ymanobq2y7" ON "qti"."placed_binding" USING btree ("__node_nqyr3apalb");

CREATE INDEX "__placed_binding_ix_assembly_adaptive_b5l6dykr6c" ON "qti"."placed_binding" USING btree ("assembly", "adaptive");

CREATE INDEX "__placed_binding_ix_instance_document_assembly_s5h7r2ocec" ON "qti"."placed_binding" USING btree ("instance", "document", "assembly");

CREATE INDEX "__placed_binding_ix_node_attribute_document_kind_lxjppajjyw" ON "qti"."placed_binding" USING btree ("node", "attribute", "document", "kind", "identifier");

CREATE INDEX "__placed_binding_declaration_ix_node_6_hhkc_3_nqmt_ff56uxlvmg" ON "qti"."placed_binding_declaration" USING btree ("__node_6hhkc3nqmt", "__kind_wpz27h2czt");

CREATE INDEX "__placed_binding_declaration_ix_node_7_ferm_5_v_3_gc_6dihb6wcry" ON "qti"."placed_binding_declaration" USING btree ("__node_7ferm5v3gc");

CREATE INDEX "__placed_binding_declaration_ix_node_gfaeb_4_prff_wgfw7jocps" ON "qti"."placed_binding_declaration" USING btree ("__node_gfaeb4prff", "__mosts_tsxccemewe");

CREATE INDEX "__placed_binding_declaration_ix_declaration_assembly_k7uproog5g" ON "qti"."placed_binding_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__placed_choice_ix_node_document_kind_identifier_lczatqkq3c" ON "qti"."placed_choice" USING btree ("node", "document", "kind", "identifier");

CREATE INDEX "__placed_document_ix_document_references_milg3e5rdy" ON "qti"."placed_document" USING btree ("document", "references");

CREATE INDEX "__placed_general_lang_ix_general_assembly_a4z3trxg5m" ON "qti"."placed_general_lang" USING btree ("general", "assembly");

CREATE INDEX "__placed_general_lang_ix_general_value_cvbiqoenbg" ON "qti"."placed_general_lang" USING btree ("general", "value");

CREATE INDEX "__placed_hottext_ix_node_document_identifier_yknhmmfjnp" ON "qti"."placed_hottext" USING btree ("node", "document", "identifier");

CREATE INDEX "__placed_id_ix_node_document_id_owner_e5wohffk7l" ON "qti"."placed_id" USING btree ("node", "document", "id", "owner");

CREATE INDEX "__placed_idref_ix_assembly_id_vpaeczqcjl" ON "qti"."placed_idref" USING btree ("assembly", "id");

CREATE INDEX "__placed_idref_ix_document_id_q6tmlasbt7" ON "qti"."placed_idref" USING btree ("document", "id");

CREATE INDEX "__placed_reference_ix_document_node_attribute_vo3wdryb65" ON "qti"."placed_reference" USING btree ("document", "node", "attribute");

CREATE INDEX "__placed_variable_ref_ix_assembly_6_phjob_5_n_63_wa46h4f2uw" ON "qti"."placed_variable_ref" USING btree ("__assembly_6phjob5n63", "__identifier_gciilot66p");

CREATE INDEX "__placed_variable_ref_ix_declaration_vv_4_djfec_7_b_o4hj6cj25b" ON "qti"."placed_variable_ref" USING btree ("__declaration_vv4djfec7b", "__assembly_zrqriy6rho", "__identifier_rtiybbmuyb", "__declaration_kind_zlpyj2lbew", "__decl_base_type_bzibtgzpmh", "__decl_cardinality_riuw5wlf3u");

CREATE INDEX "__placed_variable_ref_ix_assembly_root_kind_wtjndqcygw" ON "qti"."placed_variable_ref" USING btree ("assembly", "root_kind");

CREATE INDEX "__placed_variable_ref_ix_node_attribute_document_gz2i4fauh7" ON "qti"."placed_variable_ref" USING btree ("node", "attribute", "document", "identifier", "kind");

CREATE INDEX "__placed_xml_lang_ix_node_document_lang_t7esja6gaa" ON "qti"."placed_xml_lang" USING btree ("node", "document", "lang");

CREATE INDEX "__printed_variable_ref_ix_node_55_rq_6_xvhgt_rawuabmper" ON "qti"."printed_variable_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__printed_variable_ref_declaration_ix_declaration_kiezihsr3g" ON "qti"."printed_variable_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__processing_ix_parent_wsm_6_mff_5_fw_language_ysbx4c7aly" ON "qti"."processing" USING btree ("__parent_wsm6mff5fw", "__language_zyvgaanajc");

CREATE INDEX "__processing_ix_parent_parent_kind_nv5y7kjfju" ON "qti"."processing" USING btree ("parent", "parent_kind");

CREATE INDEX "__quotation_ix_node_tosbz_6_k_545_first_at_fbk_365_i_jfy22j4oy7" ON "qti"."quotation" USING btree ("__node_tosbz6k545", "__first_at_fbk365i4gm", "__first_saeggpwji4");

CREATE INDEX "__quotation_ix_parent_iam_5_ypvehw_next_at_3toimnhfa7" ON "qti"."quotation" USING btree ("__parent_iam5ypvehw", "__next_at_axnykqptgp", "__after_opywcrlnpf");

CREATE INDEX "__quotation_ix_parent_pred_at_xktcobhsti_before_hkzsuqd34g" ON "qti"."quotation" USING btree ("parent", "__pred_at_xktcobhsti", "before");

CREATE INDEX "__quotation_ix_parent_parent_at_siblings_gqac4eotfl" ON "qti"."quotation" USING btree ("parent", "parent_at", "siblings");

CREATE INDEX "__reading_ix_assembly_4_bfahshcjz_node_oowzks_6_eia_3bnba2cpoy" ON "qti"."reading" USING btree ("__assembly_4bfahshcjz", "__node_oowzks6eia", "__attribute_pl3ahb6rmg", "__split_cigfxqb6ra", "__scope_rldc2qc6u4");

CREATE INDEX "__reading_ix_assembly_ngcwftk_6_ei_node_lqn_4_xsjsuw_lb7hq5tbvs" ON "qti"."reading" USING btree ("__assembly_ngcwftk6ei", "__node_lqn4xsjsuw", "__attribute_2ypfef2xpc", "__split_klwvffihyw", "__number_qt3q5hnqas");

CREATE INDEX "__reading_ix_assembly_qclpwci_4_vn_scope_lf_7_o_7_glk6qspx3k" ON "qti"."reading" USING btree ("__assembly_qclpwci4vn", "__scope_lf7o7zjvbd", "__found_hl3qu3o4n6", "__named_qj4e6jlkm3", "__named_kind_mzegqfo2hg", "__placements_ntfzv5zagj", "__replaced_dhmof6txf7", "__resource_type_6wiviefl5b", "__lookup_document_7dc42dmtoj");

CREATE INDEX "__reading_ix_lookup_document_hs_4_ynirohn_variable_7_6sgwndou7y" ON "qti"."reading" USING btree ("__lookup_document_hs4ynirohn", "__variable_7e4faseoax", "__declaration_x2enltxbgk", "__declaration_kind_m5wlkzay7b", "__decl_base_type_ggb4ecicas", "__decl_cardinality_zyfwpn7xu6");

CREATE INDEX "__reading_ix_lookup_document_xaolx_6_jsle_variable_a76frw2ouy" ON "qti"."reading" USING btree ("__lookup_document_xaolx6jsle", "__variable_dtk7kirw66", "__declared_x4dv4rhpro");

CREATE INDEX "__reading_ix_named_nrv_4_n_3_nskd_variable_n_2_k_6_uu5xpuqvyk" ON "qti"."reading" USING btree ("__named_nrv4n3nskd", "__variable_n2k6ghxyfp", "__declaration_4coqakkdpt", "__declaration_kind_uwgyhqnmnf", "__decl_base_type_owoj55adk3", "__decl_cardinality_5kh7eaever");

CREATE INDEX "__reading_ix_named_txunndfjvq_variable_re_6_uebxim_4_e44qfcqa4p" ON "qti"."reading" USING btree ("__named_txunndfjvq", "__variable_re6uebxim4", "__mapped_z2jeciiv27");

CREATE INDEX "__record_field_ix_node_wxxryfwey_4_identifier_3umdnrvr4z" ON "qti"."record_field" USING btree ("__node_wxxryfwey4", "__identifier_lexical_2ike7gtw3p");

CREATE INDEX "__reference_path_ix_package_7_t_2_ctw_5_cbp_path_ao_ji3zvkr7e6" ON "qti"."reference_path" USING btree ("__package_7t2ctw5cbp", "__path_ao7rtnqc22");

CREATE INDEX "__reference_path_ix_document_package_ft7vjozed2" ON "qti"."reference_path" USING btree ("document", "package");

CREATE INDEX "__reference_path_ix_package_path_3negrpmqjv" ON "qti"."reference_path" USING btree ("package", "path");

CREATE INDEX "__resource_ix_node_ypb_7_qf_2_gry_cyo3jsl7dx" ON "qti"."resource" USING btree ("__node_ypb7qf2gry");

CREATE INDEX "__resource_ix_document_package_4v6ha45foo" ON "qti"."resource" USING btree ("document", "package");

CREATE INDEX "__resource_href_ix_node_ypb_7_qf_2_gry_b22xwn3nfo" ON "qti"."resource_href" USING btree ("__node_ypb7qf2gry");

CREATE INDEX "__rounding_ix_node_bb_4_ru_6_chas_xc52xxnxi6" ON "qti"."rounding" USING btree ("__node_bb4ru6chas");

CREATE INDEX "__rounding_ix_node_n_3_wznir_2_nw_b735ps3dez" ON "qti"."rounding" USING btree ("__node_n3wznir2nw");

CREATE INDEX "__section_ix_node_bxkmiz_7_ib_7_jvlcsbo6z5" ON "qti"."section" USING btree ("__node_bxkmiz7ib7");

CREATE INDEX "__section_ix_node_sfmmgf_7_sef_ffvqzam2lv" ON "qti"."section" USING btree ("__node_sfmmgf7sef");

CREATE INDEX "__section_ix_node_unjwgyq_4_jc_4zypjeiuz7" ON "qti"."section" USING btree ("__node_unjwgyq4jc");

CREATE INDEX "__section_ix_parent_zqp_2_kyzm_2_y_part_kpnf_72_dr_2_7ch3he55d7" ON "qti"."section" USING btree ("__parent_zqp2kyzm2y", "__part_kpnf72dr2e", "__replaced_icpgimu5lm", "__parent_mixes_zz36usjkro", "__parent_loose_chain_3w4mtgnsow");

CREATE INDEX "__section_ix_parent_parent_kind_tqlgl3axou" ON "qti"."section" USING btree ("parent", "parent_kind");

CREATE INDEX "__section_context_ref_ix_instance_qrmqdmq_4_b_2_node_clrwmdx4pa" ON "qti"."section_context_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_context_ref_ix_node_attribute_kind_qvzegje45p" ON "qti"."section_context_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_context_ref_declaration_ix_declaration_qx7mfvcskd" ON "qti"."section_context_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__section_feedback_ref_ix_instance_qrmqdmq_4_b_2_yunftoluak" ON "qti"."section_feedback_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_feedback_ref_ix_node_attribute_kind_ozyrzpd4s3" ON "qti"."section_feedback_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_feedback_ref_declaration_ix_declaration_dga2suwu7l" ON "qti"."section_feedback_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__section_identifier_ix_node_a_2_cp_5_ppi_33_yngytm7d4l" ON "qti"."section_identifier" USING btree ("__node_a2cp5ppi33", "__attribute_kvvribbpob");

CREATE INDEX "__section_identifier_ix_document_root_kind_g3l2niacdw" ON "qti"."section_identifier" USING btree ("document", "root_kind");

CREATE INDEX "__section_ordering_ix_node_sfmmgf_7_sef_q43fvqvfz2" ON "qti"."section_ordering" USING btree ("__node_sfmmgf7sef");

CREATE INDEX "__section_printed_ref_ix_instance_qrmqdmq_4_b_2_node_xtdegqajaj" ON "qti"."section_printed_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_printed_ref_ix_node_attribute_kind_nbntrpexzz" ON "qti"."section_printed_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_printed_ref_declaration_ix_declaration_jeogxziqcp" ON "qti"."section_printed_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__section_scope_ix_document_feedbacks_prints_e6yhseqktg" ON "qti"."section_scope" USING btree ("document", "feedbacks", "prints", "templates", "contexts");

CREATE INDEX "__section_selection_ix_node_bxkmiz_7_ib_7_ocw4cy3zlg" ON "qti"."section_selection" USING btree ("__node_bxkmiz7ib7");

CREATE INDEX "__section_template_ref_ix_instance_qrmqdmq_4_b_2_5knnemc4lt" ON "qti"."section_template_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_template_ref_ix_node_attribute_kind_qitpjrt4b5" ON "qti"."section_template_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_template_ref_declaration_ix_declaration_mtuytnk7zn" ON "qti"."section_template_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__site_ix_node_b_42646_p_2_al_kind_spdt_2_q_7_edi_277xz3ge7u" ON "qti"."site" USING btree ("__node_b42646p2al", "__kind_spdt2q7edi");

CREATE INDEX "__site_ix_node_csw_7_mjednz_cttlprwr4k" ON "qti"."site" USING btree ("__node_csw7mjednz");

CREATE INDEX "__site_ix_parent_zqp_2_kyzm_2_y_part_kpnf_72_dr_2_e_vrycxhweuq" ON "qti"."site" USING btree ("__parent_zqp2kyzm2y", "__part_kpnf72dr2e", "__replaced_icpgimu5lm", "__parent_mixes_zz36usjkro", "__parent_loose_chain_3w4mtgnsow");

CREATE INDEX "__site_path_ix_node_4_l_4_rxqy_5_ka_nbjnsmulwu" ON "qti"."site_path" USING btree ("__node_4l4rxqy5ka");

CREATE INDEX "__site_path_ix_package_4_u_77_hcfcfr_path_hvkgesn_5_r3qwiyei6q" ON "qti"."site_path" USING btree ("__package_4u77hcfcfr", "__path_hvkgesn5nq");

CREATE INDEX "__site_path_ix_package_osevq_7_lhy_5_path_vpc_2_zw_6_z6zgxduhhc" ON "qti"."site_path" USING btree ("__package_osevq7lhy5", "__path_vpc2zw6qyf");

CREATE INDEX "__site_target_ix_node_b_42646_p_2_al_73vhyyzw5g" ON "qti"."site_target" USING btree ("__node_b42646p2al");

CREATE INDEX "__site_target_ix_package_oln_4_z_5_vtzj_path_b_6_vqso424awa" ON "qti"."site_target" USING btree ("__package_oln4z5vtzj", "__path_b6icxxemyg", "__target_we7h2bkk7n");

CREATE INDEX "__site_target_ix_package_path_target_target_root_gkkyeqczct" ON "qti"."site_target" USING btree ("package", "path", "target", "target_root", "target_nearest", "target_nearest_kind");

CREATE INDEX "__ssml_attribute_ix_fragment_i_4_kjb_4_h_6_ys_refers_4owtnnaqtn" ON "qti"."ssml_attribute" USING btree ("__fragment_i4kjb4h6ys", "__refers_2eg5hrxumc", "__value_3jvhmvrsu5");

CREATE INDEX "__ssml_attribute_ix_node_h_3_pswpwibx_refers_po_3_l_yf5ooah4t4" ON "qti"."ssml_attribute" USING btree ("__node_h3pswpwibx", "__refers_po3l65zlgz", "__value_ja4a6kvsmy");

CREATE INDEX "__ssml_attribute_ix_node_fragment_q7zcxi63jj" ON "qti"."ssml_attribute" USING btree ("node", "fragment");

CREATE INDEX "__ssml_scope_ix_parent_o_57_yro_4_pps_fragment_yno_7_jwsafodnwp" ON "qti"."ssml_scope" USING btree ("__parent_o57yro4pps", "__fragment_yno7yzkdtd");

CREATE INDEX "__table_scope_ix_parent_lek_23_hkosw_table_4_rai_3_b_u22amyjsqn" ON "qti"."table_scope" USING btree ("__parent_lek23hkosw", "__table_4rai3b23ec");

CREATE INDEX "__template_default_target_ix_declaration_item_je3vk4tiju" ON "qti"."template_default_target" USING btree ("declaration", "item_document", "template", "declaration_kind", "decl_base_type", "decl_cardinality");

CREATE INDEX "__template_default_target_ix_item_ref_item_document_ny6h5uzu6j" ON "qti"."template_default_target" USING btree ("item_ref", "item_document");

CREATE INDEX "__template_ref_ix_node_55_rq_6_xvhgt_attribute_7jv6gqn6ms" ON "qti"."template_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__template_ref_declaration_ix_declaration_document_bsvtwu5ogl" ON "qti"."template_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__test_flag_ix_node_2_mdqieju_4_t_u3qwtmv43a" ON "qti"."test_flag" USING btree ("__node_2mdqieju4t");

CREATE INDEX "__test_flag_ix_node_agrnt_4_oxfj_value_b_2_u_3_pnmj_fh2fyk37ua" ON "qti"."test_flag" USING btree ("__node_agrnt4oxfj", "__value_b2u3pnmj35");

CREATE INDEX "__test_flag_ix_node_gmu_2_rwiqtm_xbk5gzzuum" ON "qti"."test_flag" USING btree ("__node_gmu2rwiqtm");

CREATE INDEX "__test_flag_ix_node_jbxopjiwnp_value_ktkpmvehm_4_x7utshxb5k" ON "qti"."test_flag" USING btree ("__node_jbxopjiwnp", "__value_ktkpmvehm4");

CREATE INDEX "__test_flag_ix_node_lcua_5_jzlyq_osuevcpr4r" ON "qti"."test_flag" USING btree ("__node_lcua5jzlyq");

CREATE INDEX "__test_flag_ix_node_lp_3_xxymaae_value_6_qw_7_vodyxw_ttii24aran" ON "qti"."test_flag" USING btree ("__node_lp3xxymaae", "__value_6qw7vodyxw");

CREATE INDEX "__test_flag_ix_node_kind_parent_kind_oxjx2mn4cq" ON "qti"."test_flag" USING btree ("node", "kind", "parent_kind");

CREATE INDEX "__test_reference_ix_node_pqzmng_5_ral_attribute_q_4_yrgk6s5254" ON "qti"."test_reference" USING btree ("__node_pqzmng5ral", "__attribute_q4ygdkhqsr", "__document_32pdz3ss3x", "__identifier_wwb2o2siqd", "__kind_egjg3og5oj", "__root_kind_3dwgqohzhk");

CREATE INDEX "__test_reference_ix_node_z_5_sz_4_ltt_7_q_attribute_jbrvboh7cc" ON "qti"."test_reference" USING btree ("__node_z5sz4ltt7q", "__attribute_sirmk7mkrc", "__document_mxzv7urj63", "__identifier_wmxmzpfbae", "__kind_4gx7mayacx", "__root_kind_4h7extdk2j");

CREATE INDEX "__test_token_ix_node_a_3_rnnkv_3_n_2_bzwbw7odlj" ON "qti"."test_token" USING btree ("__node_a3rnnkv3n2");

CREATE INDEX "__test_token_ix_node_b_5_hrtsniob_3cyb2sgyd4" ON "qti"."test_token" USING btree ("__node_b5hrtsniob");

CREATE INDEX "__test_token_ix_node_cxuhc_4_dycy_35d4tppcsl" ON "qti"."test_token" USING btree ("__node_cxuhc4dycy");

CREATE INDEX "__test_token_ix_node_fhyljg_3_ztm_rh65lv2f3s" ON "qti"."test_token" USING btree ("__node_fhyljg3ztm");

CREATE INDEX "__test_token_ix_node_l_7_omvxv_2_od_tskzgdxw2x" ON "qti"."test_token" USING btree ("__node_l7omvxv2od");

CREATE INDEX "__text_idref_ix_document_token_r43v6t4zvp" ON "qti"."text_idref" USING btree ("document", "token");

CREATE INDEX "__typed_href_ix_package_tydw_4_wv_6_km_path_kcbijnm_gest4ish2j" ON "qti"."typed_href" USING btree ("__package_tydw4wv6km", "__path_kcbijnm36h", "__type_izv7wmxts7");

CREATE INDEX "__value_ix_parent_base_type_cardinality_crhdj4hb5x" ON "qti"."value" USING btree ("parent", "base_type", "cardinality");

CREATE INDEX "__value_set_ix_parent_document_identifier_345mkgysll" ON "qti"."value_set" USING btree ("parent", "document", "identifier", "declaration_kind", "base_type", "cardinality");

CREATE INDEX "__variable_lookup_ix_declaration_54_lynhf_2_mc_ky6m5bu6pf" ON "qti"."variable_lookup" USING btree ("__declaration_54lynhf2mc", "__document_a7dto3wdyu", "__name_mna6bezkk7", "__declaration_kind_bx742rwsvz", "__base_type_c7k6bkm3dt", "__cardinality_h4nr7pa5es");

CREATE INDEX "__variable_ref_ix_declaration_6_uaduioa_2_e_table_3_ech56z5jw3" ON "qti"."variable_ref" USING btree ("__declaration_6uaduioa2e", "__table_3mu3imoeog");

CREATE INDEX "__variable_ref_ix_declaration_r_3_uou_6_tayl_table_2_4do2idk4ei" ON "qti"."variable_ref" USING btree ("__declaration_r3uou6tayl", "__table_2ykeatkczx");

CREATE INDEX "__variable_ref_ix_declaration_vv_4_djfec_7_b_tx46kjijmm" ON "qti"."variable_ref" USING btree ("__declaration_vv4djfec7b", "__document_3xfgzzvuf3", "__identifier_rtiybbmuyb", "__declaration_kind_zlpyj2lbew", "__decl_base_type_bzibtgzpmh", "__decl_cardinality_riuw5wlf3u");

CREATE INDEX "__variable_ref_ix_declaration_xbiw_7_t_4_u_6_g_table_n7zxpe2w2n" ON "qti"."variable_ref" USING btree ("__declaration_xbiw7t4u6g", "__table_v433ynbs4w");

CREATE INDEX "__variable_ref_ix_document_ynmze_2_dqwf_identifier_3zg5pqwz2b" ON "qti"."variable_ref" USING btree ("__document_ynmze2dqwf", "__identifier_gciilot66p");

CREATE INDEX "__variable_ref_ix_node_a_2_cp_5_ppi_33_attribute_k57kmi67dy" ON "qti"."variable_ref" USING btree ("__node_a2cp5ppi33", "__attribute_kvvribbpob");

CREATE INDEX "__variable_ref_ix_node_ept_2_xsrq_7_v_parent_ute_33_bc7uvcfnfz" ON "qti"."variable_ref" USING btree ("__node_ept2xsrq7v", "__parent_ute33fgrzx", "__kind_3skb4abdy2", "__language_g4fbnc6kzm", "__element_base_s2ys2dkumh", "__element_cardinality_kv7fsfl2bu");

CREATE INDEX "__variable_ref_ix_node_w_3_q_3_f_46_jo_2_language_ylud6vetn2" ON "qti"."variable_ref" USING btree ("__node_w3q3f46jo2", "__language_hdk63u5nao");

CREATE STATISTICS "qti"."__attribute_entity_stats_attribute_node_ydjs6qqmch" (ndistinct, dependencies, mcv) ON "attribute", "node" FROM "qti"."attribute_entity";

CREATE STATISTICS "qti"."__open_attribute_name_stats_attribute_node_nitlmx7dbm" (ndistinct, dependencies, mcv) ON "attribute", "node" FROM "qti"."open_attribute_name";
