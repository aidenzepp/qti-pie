CREATE INDEX "__area_mapping_ix_declaration_oxp_5_hcydih_vedmgldn3z" ON "qti"."area_mapping" USING btree ("__declaration_oxp5hcydih");

CREATE INDEX "__area_mapping_ix_node_wmg_2_sk_5_kn_2_d4e2zlky7r" ON "qti"."area_mapping" USING btree ("__node_wmg2sk5kn2");

CREATE INDEX "__area_mapping_cardinality_ix_declaration_mj7ekfg6cn" ON "qti"."area_mapping_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__aria_element_ix_node_cthk_6_qaxgo_iivi4cpljk" ON "qti"."aria_element" USING btree ("__node_cthk6qaxgo");

CREATE INDEX "__assembled_catalog_ix_owner_p3p4p7vpsa" ON "qti"."assembled_catalog" USING btree ("owner");

CREATE INDEX "__assembled_lang_ix_value_assembly_pi6slcodeb" ON "qti"."assembled_lang" USING btree ("value", "assembly");

CREATE INDEX "__assembled_reference_ix_assembly_beyjdapot_4_node_6_iplpehrqnd" ON "qti"."assembled_reference" USING btree ("__assembly_beyjdapot4", "__node_6kc5b2t3fi", "__attribute_m23x7bmxe6", "__kind_3ljxypfz46");

CREATE INDEX "__assembled_reference_ix_assembly_eavgo_22_inf_node_2rzu2tcgme" ON "qti"."assembled_reference" USING btree ("__assembly_eavgo22inf", "__node_zhqd2beld3", "__attribute_2nqioyibuz");

CREATE INDEX "__assembled_reference_ix_node_attribute_document_izcuteb6lm" ON "qti"."assembled_reference" USING btree ("node", "attribute", "document", "identifier", "kind", "role", "root_kind");

CREATE INDEX "__attribute_ix_node_33_s_7_pmc_6_eu_bjyanxc6as" ON "qti"."attribute" USING btree ("__node_33s7pmc6eu");

CREATE INDEX "__attribute_ix_node_45_br_23_k_7_lt_thwjoquopl" ON "qti"."attribute" USING btree ("__node_45br23k7lt");

CREATE INDEX "__attribute_ix_node_5_cbiu_5_becx_hefyc7skol" ON "qti"."attribute" USING btree ("__node_5cbiu5becx");

CREATE INDEX "__attribute_ix_node_6_piwdwr_2_vb_nar3y3mfn6" ON "qti"."attribute" USING btree ("__node_6piwdwr2vb");

CREATE INDEX "__attribute_ix_node_6_qw_4_z_7_l_7_sv_3evoy7v43q" ON "qti"."attribute" USING btree ("__node_6qw4z7l7sv");

CREATE INDEX "__attribute_ix_node_7_iuvvf_6_ijd_767bkvdhgt" ON "qti"."attribute" USING btree ("__node_7iuvvf6ijd");

CREATE INDEX "__attribute_ix_node_aqtwqbqjlb_document_ge_3_mktvjzq_5okbatcijq" ON "qti"."attribute" USING btree ("__node_aqtwqbqjlb", "__document_ge3mktvjzq");

CREATE INDEX "__attribute_ix_node_eddcgu_2_sqo_7qnv72nwmj" ON "qti"."attribute" USING btree ("__node_eddcgu2sqo");

CREATE INDEX "__attribute_ix_node_lv_6_ndxfese_hqogrz7dqi" ON "qti"."attribute" USING btree ("__node_lv6ndxfese");

CREATE INDEX "__attribute_ix_node_pqt_5_dq_44_gn_bendpktvxe" ON "qti"."attribute" USING btree ("__node_pqt5dq44gn");

CREATE INDEX "__attribute_ix_node_qfrusbccpg_m6oxpykpwf" ON "qti"."attribute" USING btree ("__node_qfrusbccpg");

CREATE INDEX "__attribute_ix_node_vakq_25_d_2_th_dq3p5mlkpj" ON "qti"."attribute" USING btree ("__node_vakq25d2th");

CREATE INDEX "__attribute_ix_node_w_5_o_5_vamebp_xeqsclfn5z" ON "qti"."attribute" USING btree ("__node_w5o5vamebp");

CREATE INDEX "__attribute_ix_node_xqtdk_6_xram_pgpzgcjfbk" ON "qti"."attribute" USING btree ("__node_xqtdk6xram");

CREATE INDEX "__attribute_ix_node_z_57_wfvavlb_5i3673cxj6" ON "qti"."attribute" USING btree ("__node_z57wfvavlb");

CREATE INDEX "__attribute_ix_node_document_type_kind_name_tgxyehpray" ON "qti"."attribute" USING btree ("node", "document_type", "kind", "name");

CREATE INDEX "__binding_base_type_ix_declaration_base_type_4zc3lphpxg" ON "qti"."binding_base_type" USING btree ("declaration", "base_type");

CREATE INDEX "__binding_cardinality_ix_node_6_hhkc_3_nqmt_kind_wpz_ev57ji5rfr" ON "qti"."binding_cardinality" USING btree ("__node_6hhkc3nqmt", "__kind_wpz27h2czt");

CREATE INDEX "__binding_cardinality_ix_node_7_ferm_5_v_3_gc_e7ik32llt6" ON "qti"."binding_cardinality" USING btree ("__node_7ferm5v3gc");

CREATE INDEX "__binding_cardinality_ix_node_gfaeb_4_prff_mosts_wvdmubaosd" ON "qti"."binding_cardinality" USING btree ("__node_gfaeb4prff", "__mosts_tsxccemewe");

CREATE INDEX "__binding_cardinality_ix_node_qoaju_6_itui_attribute_kee4zadbrq" ON "qti"."binding_cardinality" USING btree ("__node_qoaju6itui", "__attribute_cy3lzlyym2");

CREATE INDEX "__binding_cardinality_ix_declaration_cardinality_u6gcit52jj" ON "qti"."binding_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__binding_cardinality_ix_node_gaps_eluuu3gpyj" ON "qti"."binding_cardinality" USING btree ("node", "gaps");

CREATE INDEX "__binding_declaration_ix_node_wmg_2_sk_5_kn_2_oxrcgbwcsg" ON "qti"."binding_declaration" USING btree ("__node_wmg2sk5kn2", "__attribute_z7y72kybyf");

CREATE INDEX "__binding_declaration_ix_declaration_document_dfvm65nzig" ON "qti"."binding_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_types", "cardinalities");

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

CREATE INDEX "__catalog_scope_ix_parent_pa_7_sxt_3_mut_scope_2_utzs75brpa" ON "qti"."catalog_scope" USING btree ("__parent_pa7sxt3mut", "__scope_2edhtd3orc");

CREATE INDEX "__catalog_target_ix_document_jwyigkitch_id_chqpn_6_virq3gqkdw" ON "qti"."catalog_target" USING btree ("__document_jwyigkitch", "__id_chqpn6jlrw");

CREATE INDEX "__catalog_target_ix_document_sba_7_m_53_uwz_4cupqxhlxv" ON "qti"."catalog_target" USING btree ("__document_sba7m53uwz", "__placements_umab3ec74p");

CREATE INDEX "__catalog_target_ix_document_assembled_mi42q2s6ku" ON "qti"."catalog_target" USING btree ("document", "assembled");

CREATE INDEX "__choice_ix_node_gfaeb_4_prff_hqakbxexks" ON "qti"."choice" USING btree ("__node_gfaeb4prff");

CREATE INDEX "__choice_ix_node_zseimxjpkj_r6ugl4psth" ON "qti"."choice" USING btree ("__node_zseimxjpkj");

CREATE INDEX "__choice_variable_name_ix_document_root_kind_7it7boess2" ON "qti"."choice_variable_name" USING btree ("document", "root_kind");

CREATE INDEX "__cn_count_ix_node_4_zs_7_f_4_hetq_type_lexical_mw_5_32kwnnitcd" ON "qti"."cn_count" USING btree ("__node_4zs7f4hetq", "__type_lexical_mw5gnzkqdv");

CREATE INDEX "__context_ref_ix_node_55_rq_6_xvhgt_attribute_ofb6ulzvpb" ON "qti"."context_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__context_ref_declaration_ix_declaration_document_fusrxxpjpu" ON "qti"."context_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__count_bound_ix_node_hees_5_ytmaq_wvdcxve7s4" ON "qti"."count_bound" USING btree ("__node_hees5ytmaq");

CREATE INDEX "__count_bound_ix_node_oryuiniu_46_y75przpimy" ON "qti"."count_bound" USING btree ("__node_oryuiniu46");

CREATE INDEX "__count_bound_ix_node_oxfetlrikr_choices_figr_66_ekxcciuje7" ON "qti"."count_bound" USING btree ("__node_oxfetlrikr", "__choices_figr66khyk");

CREATE INDEX "__count_bound_ix_node_tq_76_jy_5_o_5_h_min_name_pq_4_cfzc3z4y7c" ON "qti"."count_bound" USING btree ("__node_tq76jy5o5h", "__min_name_pq4iyemtqh");

CREATE INDEX "__count_bound_ix_node_uyvwkuoluo_max_name_perr_4_n6ow3yqmjw" ON "qti"."count_bound" USING btree ("__node_uyvwkuoluo", "__max_name_perr4lpmuf");

CREATE INDEX "__count_bound_ix_node_wdev_3_ncr_3_a_4r36oaddlg" ON "qti"."count_bound" USING btree ("__node_wdev3ncr3a");

CREATE INDEX "__data_ssml_property_ix_member_name_node_4gvmx7e2x7" ON "qti"."data_ssml_property" USING btree ("member", "name", "node");

CREATE INDEX "__data_ssml_property_ix_node_member_member_name_6aeoou4yyx" ON "qti"."data_ssml_property" USING btree ("node", "member", "member_name");

CREATE INDEX "__declaration_ix_node_mp_2_o_432_mbm_nw4kkjnz4t" ON "qti"."declaration" USING btree ("__node_mp2o432mbm");

CREATE INDEX "__declaration_ix_node_ss_2_nzqf_54_f_isvhdhhzrg" ON "qti"."declaration" USING btree ("__node_ss2nzqf54f");

CREATE INDEX "__declaration_ix_node_ucda_4_beqaz_qhkin6wqsw" ON "qti"."declaration" USING btree ("__node_ucda4beqaz");

CREATE INDEX "__declaration_ix_parent_parent_kind_yvnpvak3wm" ON "qti"."declaration" USING btree ("parent", "parent_kind");

CREATE INDEX "__declaration_cardinality_ix_node_3_jl_2_jotxlg_64i5jzaqbr" ON "qti"."declaration_cardinality" USING btree ("__node_3jl2jotxlg");

CREATE INDEX "__declaration_cardinality_ix_node_ub_54_j_5_vlil_ruyyz7ugk6" ON "qti"."declaration_cardinality" USING btree ("__node_ub54j5vlil");

CREATE INDEX "__declaration_identifier_ix_node_fkiarxhsad_2dkbo35y25" ON "qti"."declaration_identifier" USING btree ("__node_fkiarxhsad");

CREATE INDEX "__declaration_identifier_ix_node_kjsigse_5_lq_cr4nfkunzy" ON "qti"."declaration_identifier" USING btree ("__node_kjsigse5lq");

CREATE INDEX "__declaration_identifier_ix_node_wmg_2_sk_5_kn_2_yw7idbxny2" ON "qti"."declaration_identifier" USING btree ("__node_wmg2sk5kn2");

CREATE INDEX "__declaration_identifier_ix_node_zfo_6_tymqbh_mmxgem64gu" ON "qti"."declaration_identifier" USING btree ("__node_zfo6tymqbh");

CREATE INDEX "__declaration_identifier_ix_identifier_q2wgv3dsez" ON "qti"."declaration_identifier" USING btree ("identifier");

CREATE INDEX "__dependency_ix_resource_package_txdc5xfn7z" ON "qti"."dependency" USING btree ("resource", "package");

CREATE INDEX "__dependency_target_ix_package_ref_target_2iifdwtrng" ON "qti"."dependency_target" USING btree ("package", "ref", "target");

CREATE INDEX "__document_ix_node_5_zotaizsb_2_qbvrbvdbck" ON "qti"."document" USING btree ("__node_5zotaizsb2");

CREATE INDEX "__document_ix_node_ejjgk_3_z_2_mi_hqve44he6v" ON "qti"."document" USING btree ("__node_ejjgk3z2mi");

CREATE INDEX "__document_ix_node_nv_676_cv_335_qde4grdoez" ON "qti"."document" USING btree ("__node_nv676cv335");

CREATE INDEX "__document_ix_node_qgqgjeibc_3_d6c4d5vx2p" ON "qti"."document" USING btree ("__node_qgqgjeibc3");

CREATE INDEX "__document_id_ix_node_3_olzulnuu_3_document_7_hyy45w5uxu" ON "qti"."document_id" USING btree ("__node_3olzulnuu3", "__document_7pfajdbgba");

CREATE INDEX "__document_id_ix_node_4_ck_2_w_6_ow_6_d_2idckzhju3" ON "qti"."document_id" USING btree ("__node_4ck2w6ow6d");

CREATE INDEX "__document_id_ix_node_5_h_62_ntbykp_ypjeldmeko" ON "qti"."document_id" USING btree ("__node_5h62ntbykp");

CREATE INDEX "__document_id_ix_node_tpei_2_g_34_n_6_nw552oiicy" ON "qti"."document_id" USING btree ("__node_tpei2g34n6");

CREATE INDEX "__document_lang_ix_value_document_3ix6z75dq6" ON "qti"."document_lang" USING btree ("value", "document");

CREATE INDEX "__entry_ix_package_sm_22_xuinlg_path_fceociruej_jddz344rfe" ON "qti"."entry" USING btree ("__package_sm22xuinlg", "__path_fceociruej");

CREATE INDEX "__expression_ix_node_oay_5_lzx_65_r_2zpayqdtdx" ON "qti"."expression" USING btree ("__node_oay5lzx65r");

CREATE INDEX "__expression_ix_node_qtmjx_7_wiji_gsqvolgjmv" ON "qti"."expression" USING btree ("__node_qtmjx7wiji");

CREATE INDEX "__expression_ix_node_uquzqs_6_gxs_4qbk5c4rhs" ON "qti"."expression" USING btree ("__node_uquzqs6gxs");

CREATE INDEX "__expression_ix_node_yijjz_6_u_7_vd_u2vk2mapci" ON "qti"."expression" USING btree ("__node_yijjz6u7vd");

CREATE INDEX "__expression_ix_parent_6_yrq_7_ihsir_language_ww_4_k_hjdnxi3gs2" ON "qti"."expression" USING btree ("__parent_6yrq7ihsir", "__language_ww4k4vlpds");

CREATE INDEX "__expression_ix_parent_u_2_j_436_zloh_language_x_4_r_lkp5oxijq6" ON "qti"."expression" USING btree ("__parent_u2j436zloh", "__language_x4r7vlpnyw");

CREATE INDEX "__expression_ix_parent_parent_kind_v7wq5auyht" ON "qti"."expression" USING btree ("parent", "parent_kind");

CREATE INDEX "__expression_attribute_ix_node_cmhaiwbl_5_v_bxuaecq22l" ON "qti"."expression_attribute" USING btree ("__node_cmhaiwbl5v", "__attribute_2r6eaz6bn7");

CREATE INDEX "__expression_attribute_ix_node_j_2_c_273_zmua_6irf2xy6o3" ON "qti"."expression_attribute" USING btree ("__node_j2c273zmua", "__written_xr2xcpx7cp");

CREATE INDEX "__expression_attribute_ix_node_zjgiyb_7_nr_7_3xewekacwn" ON "qti"."expression_attribute" USING btree ("__node_zjgiyb7nr7");

CREATE INDEX "__expression_attribute_ix_node_parent_kind_language_gsd2wfc7iw" ON "qti"."expression_attribute" USING btree ("node", "parent", "kind", "language", "base_type", "cardinality");

CREATE INDEX "__feedback_ref_ix_node_55_rq_6_xvhgt_attribute_albw6cn7sl" ON "qti"."feedback_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__feedback_ref_cardinality_ix_declaration_qi4mbp53rc" ON "qti"."feedback_ref_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__feedback_ref_declaration_ix_declaration_oxp_5_zxje2stn6h" ON "qti"."feedback_ref_declaration" USING btree ("__declaration_oxp5hcydih");

CREATE INDEX "__feedback_ref_declaration_ix_node_wmg_2_sk_5_kn_2_2qblhsq3q6" ON "qti"."feedback_ref_declaration" USING btree ("__node_wmg2sk5kn2", "__attribute_z7y72kybyf");

CREATE INDEX "__feedback_ref_declaration_ix_declaration_document_vb2goupay2" ON "qti"."feedback_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__field_value_ix_declaration_cardinality_qkn6kyul4d" ON "qti"."field_value" USING btree ("declaration", "cardinality");

CREATE INDEX "__file_ix_package_a_66_fvayvxi_path_mzwjzn_5_rcd_243ov6udky" ON "qti"."file" USING btree ("__package_a66fvayvxi", "__path_mzwjzn5rcd");

CREATE INDEX "__file_ix_resource_package_44pfqjhrww" ON "qti"."file" USING btree ("resource", "package");

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

CREATE INDEX "__instance_name_ix_assembly_kind_node_replaced_bjyj2ibksd" ON "qti"."instance_name" USING btree ("assembly", "kind", "node", "replaced");

CREATE INDEX "__instance_name_ix_document_node_identifier_6jlosqls2y" ON "qti"."instance_name" USING btree ("document", "node", "identifier");

CREATE INDEX "__instance_name_ix_node_end_kind_named_loose_chain_mxebuuxbon" ON "qti"."instance_name" USING btree ("node", "end", "kind", "named_loose_chain", "named_mixes", "named_part", "named_replaced", "start");

CREATE INDEX "__interaction_ix_node_gfaeb_4_prff_on3ekn3rtn" ON "qti"."interaction" USING btree ("__node_gfaeb4prff");

CREATE INDEX "__interaction_attribute_ix_node_2_q_2_oae_7_puk_76ppcqtnu5" ON "qti"."interaction_attribute" USING btree ("__node_2q2oae7puk", "__value_oxrxhywfi2");

CREATE INDEX "__interaction_attribute_ix_node_4_at_4_wfkern_name_twwj3fyzmw" ON "qti"."interaction_attribute" USING btree ("__node_4at4wfkern", "__name_vzryoee3ut", "__kind_ed7oeoudui", "__document_ix6yxy75ql", "__value_q5lemkgscl");

CREATE INDEX "__interaction_attribute_ix_node_5_rnstc_7_apz_name_kwmatbi4c6" ON "qti"."interaction_attribute" USING btree ("__node_5rnstc7apz", "__name_no64onddxb", "__kind_hwhvhdxdjm", "__document_snyszvnx4d", "__root_kind_vartdewc6w", "__value_o4tjm6whhr");

CREATE INDEX "__interaction_attribute_ix_node_aj_26_yviopr_name_u_daziusbsih" ON "qti"."interaction_attribute" USING btree ("__node_aj26yviopr", "__name_u6ybtgxgsp", "__kind_ibqfxn7i7v", "__document_ygdlccx6m3", "__root_kind_4vzntorelb", "__value_ixz6x6c64k");

CREATE INDEX "__interaction_attribute_ix_node_b_4_cysfcqdk_value_xpvzzqzb6h" ON "qti"."interaction_attribute" USING btree ("__node_b4cysfcqdk", "__value_efvhlmam3z");

CREATE INDEX "__interaction_attribute_ix_node_d_7_p_2_xd_6_rh_4_ydfktixt2q" ON "qti"."interaction_attribute" USING btree ("__node_d7p2xd6rh4", "__name_zcrch6phvd", "__kind_5iuibxv2ol", "__document_vgr5pccquo", "__root_kind_aaded7k5qn", "__value_riqyqxspqz");

CREATE INDEX "__interaction_attribute_ix_node_e_24_icy_3_uhs_name_xzzx5cr7nv" ON "qti"."interaction_attribute" USING btree ("__node_e24icy3uhs", "__name_n3b7rzkrbm", "__kind_j5bpy3wkru", "__document_xibqoud3kq", "__value_mbyo4punxj");

CREATE INDEX "__interaction_attribute_ix_node_flbilkbnpr_value_sdrihhtt6q" ON "qti"."interaction_attribute" USING btree ("__node_flbilkbnpr", "__value_mdalpmjeoc");

CREATE INDEX "__interaction_attribute_ix_node_h_2_pd_4_crnor_name_4ixn5bstnq" ON "qti"."interaction_attribute" USING btree ("__node_h2pd4crnor", "__name_dedat2iga6", "__value_b2dcpkspbl");

CREATE INDEX "__interaction_attribute_ix_node_jmnuqwzkql_name_bd_g33afayxr4" ON "qti"."interaction_attribute" USING btree ("__node_jmnuqwzkql", "__name_bd463qcqrt", "__kind_oqzbk5hwei", "__document_kfnvsfsqsx", "__value_4loueoylry");

CREATE INDEX "__interaction_attribute_ix_node_n_7_p_26_mkpml_name_bxq4z7yov4" ON "qti"."interaction_attribute" USING btree ("__node_n7p26mkpml", "__name_scbhqankcb", "__kind_jerstzwuth", "__document_euhbokeuav", "__root_kind_s6liv4avuo", "__value_bfy4m3anjw");

CREATE INDEX "__interaction_attribute_ix_node_nh_35_tvp_7_et_value_hjzauklvvm" ON "qti"."interaction_attribute" USING btree ("__node_nh35tvp7et", "__value_rrtdtetll6");

CREATE INDEX "__interaction_attribute_ix_node_ozxio_6_e_2_u_5_4nyxw274vf" ON "qti"."interaction_attribute" USING btree ("__node_ozxio6e2u5", "__value_bxzxkt6uvs");

CREATE INDEX "__interaction_attribute_ix_node_qqd_5_dzuvzr_name_5_k4nfjgs7j6" ON "qti"."interaction_attribute" USING btree ("__node_qqd5dzuvzr", "__name_5wq4vyfecf", "__kind_q4nrosw625", "__document_nzgj2cfpmq", "__value_qwxk2zt4qd");

CREATE INDEX "__interaction_attribute_ix_node_qvf_73_cei_27_name_ii5gz3bcmh" ON "qti"."interaction_attribute" USING btree ("__node_qvf73cei27", "__name_xuiwruunzz", "__kind_fn6bmn2ulk", "__document_iv5jcjfpsr", "__value_655a7gpb2g");

CREATE INDEX "__interaction_attribute_ix_node_wv_6_u_4_xry_3_f_2c5cvlbpnd" ON "qti"."interaction_attribute" USING btree ("__node_wv6u4xry3f", "__name_6i5icgme7c", "__kind_dfv5mgbpu2", "__document_em4uq5ffwf", "__value_3g4q57ndkm");

CREATE INDEX "__interaction_attribute_ix_document_root_kind_fyhxu2mcle" ON "qti"."interaction_attribute" USING btree ("document", "root_kind");

CREATE INDEX "__item_mode_ix_document_gfqaer_5_w_2_f_xg25r6slqs" ON "qti"."item_mode" USING btree ("__document_gfqaer5w2f");

CREATE INDEX "__item_ref_document_ix_document_package_path_shtyge55dk" ON "qti"."item_ref_document" USING btree ("document", "package", "path");

CREATE INDEX "__item_ref_href_ix_targets_package_path_uudhkobwy7" ON "qti"."item_ref_href" USING btree ("targets", "package", "path");

CREATE INDEX "__item_ref_target_ix_node_thuesrvpoz_package_7_mhuni2s22d" ON "qti"."item_ref_target" USING btree ("__node_thuesrvpoz", "__package_7yrgppd6sa", "__path_s25m4iaxsn");

CREATE INDEX "__item_ref_target_ix_package_path_type_5edpacmhmd" ON "qti"."item_ref_target" USING btree ("package", "path", "type");

CREATE INDEX "__label_use_ix_document_h_55_jb_4_nosx_4zh43rsle7" ON "qti"."label_use" USING btree ("__document_h55jb4nosx");

CREATE INDEX "__label_use_ix_document_root_kind_d7n36nygky" ON "qti"."label_use" USING btree ("document", "root_kind");

CREATE INDEX "__least_count_ix_node_tq_76_jy_5_o_5_h_min_name_pq_4_y4fjvyu23q" ON "qti"."least_count" USING btree ("__node_tq76jy5o5h", "__min_name_pq4iyemtqh", "__least_4gxcnzzzun");

CREATE INDEX "__lom_entry_ix_holder_parent_document_identifier_hm5zycuw2h" ON "qti"."lom_entry" USING btree ("holder", "parent", "document", "identifier_kind", "identifier_start", "nearest", "version");

CREATE INDEX "__lom_entry_ix_token_holder_3zze63nsju" ON "qti"."lom_entry" USING btree ("token", "holder");

CREATE INDEX "__lom_general_ix_parent_y7zzxkzmn2" ON "qti"."lom_general" USING btree ("parent");

CREATE INDEX "__lom_record_ix_owner_owner_parent_parent_document_fb6kqxecve" ON "qti"."lom_record" USING btree ("owner", "owner_parent", "parent", "document", "owner_start", "nearest", "version");

CREATE INDEX "__lom_resource_type_ix_node_dzmkpyu_5_uh_xlkqyn3rx3" ON "qti"."lom_resource_type" USING btree ("__node_dzmkpyu5uh");

CREATE INDEX "__lom_string_ix_node_najnjopqcl_language_tag_nc2dsa2rkl" ON "qti"."lom_string" USING btree ("__node_najnjopqcl", "__language_tag_kebbbhfmz4");

CREATE INDEX "__lom_title_ix_parent_cj76adladb" ON "qti"."lom_title" USING btree ("parent");

CREATE INDEX "__lom_title_string_ix_parent_text_value_24llahfogj" ON "qti"."lom_title_string" USING btree ("parent", "text_value");

CREATE INDEX "__lom_title_string_ix_text_value_pg2pwvq5ah" ON "qti"."lom_title_string" USING btree ("text_value");

CREATE INDEX "__lookup_table_ix_node_wmg_2_sk_5_kn_2_bpzluuiwrg" ON "qti"."lookup_table" USING btree ("__node_wmg2sk5kn2");

CREATE INDEX "__lookup_table_cardinality_ix_declaration_5crpcwujja" ON "qti"."lookup_table_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__lookup_value_ix_node_iqtxzzsjue_base_types_ng3mryewgn" ON "qti"."lookup_value" USING btree ("__node_iqtxzzsjue", "__base_types_thiugiegui", "__declaration_zjpvjgtoaa");

CREATE INDEX "__lookup_value_ix_node_qoaju_6_itui_z5dvdvjxx6" ON "qti"."lookup_value" USING btree ("__node_qoaju6itui");

CREATE INDEX "__lookup_value_ix_parent_pewwtbkfib_base_types_goa_2_yy5hnznqyq" ON "qti"."lookup_value" USING btree ("__parent_pewwtbkfib", "__base_types_goa2xo6h2n", "__declaration_ezx2427h26");

CREATE INDEX "__lookup_value_type_ix_declaration_base_type_mycheohzbv" ON "qti"."lookup_value_type" USING btree ("declaration", "base_type");

CREATE INDEX "__manifest_id_space_ix_package_f_5_hzcifi_53_eu6anscino" ON "qti"."manifest_id_space" USING btree ("__package_f5hzcifi53", "__identifier_cei2qn2t7s");

CREATE INDEX "__manifest_id_space_ix_package_srcfwxd_3_vo_4ya7dzzwfb" ON "qti"."manifest_id_space" USING btree ("__package_srcfwxd3vo", "__identifier_6zkottivdn");

CREATE INDEX "__map_key_ix_node_qoaju_6_itui_b6axafuyu5" ON "qti"."map_key" USING btree ("__node_qoaju6itui");

CREATE INDEX "__map_key_ix_node_rkykeekqwq_3fsflivgwg" ON "qti"."map_key" USING btree ("__node_rkykeekqwq");

CREATE INDEX "__map_key_ix_node_ytvjqsvok_4_3b4rrtddkp" ON "qti"."map_key" USING btree ("__node_ytvjqsvok4");

CREATE INDEX "__map_key_ix_mapping_base_types_7s6fe7e3uk" ON "qti"."map_key" USING btree ("mapping", "base_types");

CREATE INDEX "__map_key_items_ix_mapping_ordered_g2mbwmphv3" ON "qti"."map_key_items" USING btree ("mapping", "ordered");

CREATE INDEX "__map_key_items_ix_mapping_unordered_7n3efglzvm" ON "qti"."map_key_items" USING btree ("mapping", "unordered");

CREATE INDEX "__map_key_type_ix_node_tspabsizer_bxj3mcnjkq" ON "qti"."map_key_type" USING btree ("__node_tspabsizer");

CREATE INDEX "__map_key_type_ix_base_type_mapping_kdf4georz2" ON "qti"."map_key_type" USING btree ("base_type", "mapping");

CREATE INDEX "__mapping_ix_node_qoaju_6_itui_ekxlzzr4vt" ON "qti"."mapping" USING btree ("__node_qoaju6itui");

CREATE INDEX "__mapping_ix_node_wmg_2_sk_5_kn_2_xel2ctprgm" ON "qti"."mapping" USING btree ("__node_wmg2sk5kn2");

CREATE INDEX "__mapping_base_type_ix_declaration_base_type_v357kb536w" ON "qti"."mapping_base_type" USING btree ("declaration", "base_type");

CREATE INDEX "__mapping_cardinality_ix_declaration_cardinality_o4c57wxhpu" ON "qti"."mapping_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__mapping_item_ref_ix_node_o_7_qeabbnno_7lsprznsl3" ON "qti"."mapping_item_ref" USING btree ("__node_o7qeabbnno");

CREATE INDEX "__mapping_item_ref_type_ix_node_pgr_2_c_2_ubor_2phdcz7o5o" ON "qti"."mapping_item_ref_type" USING btree ("__node_pgr2c2ubor");

CREATE INDEX "__mapping_item_ref_type_ix_item_ref_type_pzprkmab2a" ON "qti"."mapping_item_ref_type" USING btree ("item_ref", "type");

CREATE INDEX "__mapping_source_declaration_ix_declaration_item_6qj3nwzai2" ON "qti"."mapping_source_declaration" USING btree ("declaration", "item_document", "source", "declaration_kind", "decl_base_types", "decl_cardinalities");

CREATE INDEX "__mapping_source_declaration_ix_item_document_target_f6wg5lru3m" ON "qti"."mapping_source_declaration" USING btree ("item_document", "target");

CREATE INDEX "__mapping_source_declaration_ix_item_ref_item_6r7kblgpwe" ON "qti"."mapping_source_declaration" USING btree ("item_ref", "item_document");

CREATE INDEX "__math_action_ix_node_ftdvsxxkkg_zkkakvjgqu" ON "qti"."math_action" USING btree ("__node_ftdvsxxkkg");

CREATE INDEX "__math_align_scope_ix_node_2_cng_4_arpih_mmrhoiqhjk" ON "qti"."math_align_scope" USING btree ("__node_2cng4arpih");

CREATE INDEX "__math_align_scope_ix_node_5_sroalr_7_ba_cell_crzb_yvcuj6zxfk" ON "qti"."math_align_scope" USING btree ("__node_5sroalr7ba", "__cell_crzb77exj4");

CREATE INDEX "__math_align_scope_ix_node_i_5_vkip_2_st_6_dir_mellqolgaz" ON "qti"."math_align_scope" USING btree ("__node_i5vkip2st6", "__dir_lexical_h6z4ucsu6w");

CREATE INDEX "__math_align_scope_ix_node_x_3_mdbcdhup_efi73o4ghn" ON "qti"."math_align_scope" USING btree ("__node_x3mdbcdhup");

CREATE INDEX "__math_align_scope_ix_parent_bj_6_k_3_aos_7_e_chosen_6koelug4xi" ON "qti"."math_align_scope" USING btree ("__parent_bj6k3aos7e", "__chosen_nwrwqehg4j");

CREATE INDEX "__math_align_scope_ix_parent_ofh_2_oegku_5_cell_odosvatxqe" ON "qti"."math_align_scope" USING btree ("__parent_ofh2oegku5", "__cell_despuko6mc", "__received_nl6nb5uaz7", "__parent_kind_bupdqhkd5a", "__inherited_4f5vs6h5cr");

CREATE INDEX "__math_cn_ix_node_3_zqnpj_6_o_5_d_base_lexical_sbr55swfug" ON "qti"."math_cn" USING btree ("__node_3zqnpj6o5d", "__base_lexical_dhzsou5d52");

CREATE INDEX "__math_cn_ix_node_4_zs_7_f_4_hetq_type_lexical_mw_5_xzzqy3zlyr" ON "qti"."math_cn" USING btree ("__node_4zs7f4hetq", "__type_lexical_mw5gnzkqdv");

CREATE INDEX "__math_rank_ix_parent_hwejryg_34_m_parent_rank_vbozqp2pxf" ON "qti"."math_rank" USING btree ("__parent_hwejryg34m", "__parent_rank_djgpmhcqav");

CREATE INDEX "__most_count_ix_node_uyvwkuoluo_max_name_perr_4_zoblsng4ar" ON "qti"."most_count" USING btree ("__node_uyvwkuoluo", "__max_name_perr4lpmuf", "__most_gdqaao6iy4");

CREATE INDEX "__named_ix_node_4_f_5_xcfmhbc_part_4_gtxaphjyp_p6wr2egvhs" ON "qti"."named" USING btree ("__node_4f5xcfmhbc", "__part_4gtxaphjyp", "__replaced_cn7cl6rjxv", "__mixes_byc4olsxrq", "__loose_chain_ajn7kudydp");

CREATE INDEX "__named_ix_parent_vipwpcgcs_7_part_4_cq_4_qtivnd_aoesrvjgd7" ON "qti"."named" USING btree ("__parent_vipwpcgcs7", "__part_4cq4qtivnd", "__replaced_xc4ckx6v2e");

CREATE INDEX "__named_ix_parent_parent_kind_3665qr2rm7" ON "qti"."named" USING btree ("parent", "parent_kind");

CREATE INDEX "__node_ix_document_jlx_2_xep_5_af_kind_3_zonnawsqb_pgvugnbbe4" ON "qti"."node" USING btree ("__document_jlx2xep5af", "__kind_3zonnawsqb");

CREATE INDEX "__node_ix_id_2_ecax_7_r_3_ho_bfjukv7bjf" ON "qti"."node" USING btree ("__id_2ecax7r3ho");

CREATE INDEX "__node_ix_id_2_sa_7_ei_5_zyl_ervqviuc6w" ON "qti"."node" USING btree ("__id_2sa7ei5zyl");

CREATE INDEX "__node_ix_id_33_kgwoi_4_ec_ojslxjumzu" ON "qti"."node" USING btree ("__id_33kgwoi4ec");

CREATE INDEX "__node_ix_id_46_tfv_6_spbo_hgwe7bdbsp" ON "qti"."node" USING btree ("__id_46tfv6spbo");

CREATE INDEX "__node_ix_id_4_fp_7_viwvjp_fhcj5uzovg" ON "qti"."node" USING btree ("__id_4fp7viwvjp");

CREATE INDEX "__node_ix_id_4_kyfqj_6_js_7_h5y5njhzbp" ON "qti"."node" USING btree ("__id_4kyfqj6js7");

CREATE INDEX "__node_ix_id_4_p_3_x_6_fs_6_ds_string_value_au_6_fy_catsvvezob" ON "qti"."node" USING btree ("__id_4p3x6fs6ds", "__string_value_au6fy6olpt");

CREATE INDEX "__node_ix_id_4_vxvcu_7_dk_3_ihwlxgelr7" ON "qti"."node" USING btree ("__id_4vxvcu7dk3");

CREATE INDEX "__node_ix_id_aejnsmuu_6_s_zynyxypog5" ON "qti"."node" USING btree ("__id_aejnsmuu6s");

CREATE INDEX "__node_ix_id_apujacx_2_gd_hleehmvdyg" ON "qti"."node" USING btree ("__id_apujacx2gd");

CREATE INDEX "__node_ix_id_bghas_3_ujed_m3navgatoc" ON "qti"."node" USING btree ("__id_bghas3ujed");

CREATE INDEX "__node_ix_id_buqmbkuqrp_3l33y67exd" ON "qti"."node" USING btree ("__id_buqmbkuqrp");

CREATE INDEX "__node_ix_id_d_7_bnzrx_6_s_4_parent_nega_7_gzl_7_u_i4ok6pqon7" ON "qti"."node" USING btree ("__id_d7bnzrx6s4", "__parent_nega7gzl7u", "__string_value_vxgni3ywe7");

CREATE INDEX "__node_ix_id_dlldehzzx_5_tofufm2qcr" ON "qti"."node" USING btree ("__id_dlldehzzx5");

CREATE INDEX "__node_ix_id_fh_4_h_2_bqbbf_7kgc2fhw2x" ON "qti"."node" USING btree ("__id_fh4h2bqbbf");

CREATE INDEX "__node_ix_id_fxsmrdbafd_parent_j_2_bpgu_2_cmv_string_kdttkro3wo" ON "qti"."node" USING btree ("__id_fxsmrdbafd", "__parent_j2bpgu2cmv", "__string_value_st2tbmdq6p");

CREATE INDEX "__node_ix_id_gq_6_uzbosmd_lbbldzbt2l" ON "qti"."node" USING btree ("__id_gq6uzbosmd");

CREATE INDEX "__node_ix_id_h_3_sirmwbhr_sdpzsaqlul" ON "qti"."node" USING btree ("__id_h3sirmwbhr");

CREATE INDEX "__node_ix_id_hdt_6_eyj_25_k_qrxya73myb" ON "qti"."node" USING btree ("__id_hdt6eyj25k");

CREATE INDEX "__node_ix_id_ixxzr_33747_dha3padnfb" ON "qti"."node" USING btree ("__id_ixxzr33747");

CREATE INDEX "__node_ix_id_j_5_nn_7_krqpg_document_pbft_2_kftgd_hm2q552hbs" ON "qti"."node" USING btree ("__id_j5nn7krqpg", "__document_pbft2kftgd", "__parent_y26tlfqvtg", "__string_value_mzt2b2quuj");

CREATE INDEX "__node_ix_id_jc_6_vfm_2_n_22_string_value_jbv_6_mmx_2ogwaicb2b" ON "qti"."node" USING btree ("__id_jc6vfm2n22", "__string_value_jbv6mmx2wd");

CREATE INDEX "__node_ix_id_jqcli_57_r_6_e_bldsko2j2o" ON "qti"."node" USING btree ("__id_jqcli57r6e");

CREATE INDEX "__node_ix_id_laqeu_7_frlh_cy5xxe72iy" ON "qti"."node" USING btree ("__id_laqeu7frlh");

CREATE INDEX "__node_ix_id_lqxlri_2_euy_string_value_vgoifjqt_7_p_mo34tq2ncz" ON "qti"."node" USING btree ("__id_lqxlri2euy", "__string_value_vgoifjqt7p");

CREATE INDEX "__node_ix_id_lsekb_7_odow_o6wkiwwwkl" ON "qti"."node" USING btree ("__id_lsekb7odow");

CREATE INDEX "__node_ix_id_nvk_6_qhdomt_3pcqs3cpc7" ON "qti"."node" USING btree ("__id_nvk6qhdomt");

CREATE INDEX "__node_ix_id_okrh_2_pyfc_7_parent_er_7_bsmdz_2_i_pyzpzwws3d" ON "qti"."node" USING btree ("__id_okrh2pyfc7", "__parent_er7bsmdz2i", "__string_value_w5fvqit5qr");

CREATE INDEX "__node_ix_id_orae_3_kwywm_boahc6pavr" ON "qti"."node" USING btree ("__id_orae3kwywm");

CREATE INDEX "__node_ix_id_q_3_fkvdlrzq_vldm573gsy" ON "qti"."node" USING btree ("__id_q3fkvdlrzq");

CREATE INDEX "__node_ix_id_rbrnmh_2_xkm_73o3wfx6yz" ON "qti"."node" USING btree ("__id_rbrnmh2xkm");

CREATE INDEX "__node_ix_id_rpd_3_elauv_4_j3peuc2tu7" ON "qti"."node" USING btree ("__id_rpd3elauv4");

CREATE INDEX "__node_ix_id_shysbno_63_f_ehtzojrq55" ON "qti"."node" USING btree ("__id_shysbno63f");

CREATE INDEX "__node_ix_id_tw_4_vam_75_we_5kcd7y5t2c" ON "qti"."node" USING btree ("__id_tw4vam75we");

CREATE INDEX "__node_ix_id_v_3_yvnypwaj_sz2qes5tv3" ON "qti"."node" USING btree ("__id_v3yvnypwaj");

CREATE INDEX "__node_ix_id_xxjhviby_37_2hf4xzjzjl" ON "qti"."node" USING btree ("__id_xxjhviby37");

CREATE INDEX "__node_ix_id_xzp_4_ngpydi_77offtplxc" ON "qti"."node" USING btree ("__id_xzp4ngpydi");

CREATE INDEX "__node_ix_id_zvbpmu_7_yp_2_7lilutusav" ON "qti"."node" USING btree ("__id_zvbpmu7yp2");

CREATE INDEX "__node_ix_document_start_id_fjfijlv7gg" ON "qti"."node" USING btree ("document", "start", "id");

CREATE INDEX "__normal_minimum_ix_node_cmhaiwbl_5_v_3fnrsivv7a" ON "qti"."normal_minimum" USING btree ("__node_cmhaiwbl5v");

CREATE INDEX "__object_identifier_ix_identifier_lalkbhxwcs" ON "qti"."object_identifier" USING btree ("identifier");

CREATE INDEX "__object_title_ix_title_value_solmwj6u6t" ON "qti"."object_title" USING btree ("title_value");

CREATE INDEX "__open_attribute_name_ix_node_xyk_6_f_5_hny_4_ytdu4qply5" ON "qti"."open_attribute_name" USING btree ("__node_xyk6f5hny4", "__element_namespace_a7msmtijer");

CREATE INDEX "__open_element_name_ix_node_dnhfkvuye_3_p3amxegryk" ON "qti"."open_element_name" USING btree ("__node_dnhfkvuye3");

CREATE INDEX "__open_element_name_ix_parent_beba_3_avbja_parent_xrpkgh2egm" ON "qti"."open_element_name" USING btree ("__parent_beba3avbja", "__parent_namespace_4hhnuwl5pd");

CREATE INDEX "__open_element_name_ix_parent_parent_kind_6p3wnbjbjh" ON "qti"."open_element_name" USING btree ("parent", "parent_kind");

CREATE INDEX "__pci_module_form_ix_node_itpy_7_ns_7_w_5_t2fzjjgic5" ON "qti"."pci_module_form" USING btree ("__node_itpy7ns7w5");

CREATE INDEX "__pci_module_form_ix_node_zkko_65_kuex_elv36nmskz" ON "qti"."pci_module_form" USING btree ("__node_zkko65kuex");

CREATE INDEX "__placed_binding_ix_node_nqyr_3_apalb_ymanobq2y7" ON "qti"."placed_binding" USING btree ("__node_nqyr3apalb");

CREATE INDEX "__placed_binding_ix_assembly_adaptive_b5l6dykr6c" ON "qti"."placed_binding" USING btree ("assembly", "adaptive");

CREATE INDEX "__placed_binding_ix_instance_document_assembly_s5h7r2ocec" ON "qti"."placed_binding" USING btree ("instance", "document", "assembly");

CREATE INDEX "__placed_binding_ix_node_attribute_document_kind_lxjppajjyw" ON "qti"."placed_binding" USING btree ("node", "attribute", "document", "kind", "identifier");

CREATE INDEX "__placed_binding_base_type_ix_declaration_base_type_ujoyzx5e3d" ON "qti"."placed_binding_base_type" USING btree ("declaration", "base_type");

CREATE INDEX "__placed_binding_cardinality_ix_instance_43_ypvsngtt_ahfyiscy7o" ON "qti"."placed_binding_cardinality" USING btree ("__instance_43ypvsngtt", "__node_qoaju6itui", "__attribute_cy3lzlyym2");

CREATE INDEX "__placed_binding_cardinality_ix_node_6_hhkc_3_nqmt_p2rippynvu" ON "qti"."placed_binding_cardinality" USING btree ("__node_6hhkc3nqmt", "__kind_wpz27h2czt");

CREATE INDEX "__placed_binding_cardinality_ix_node_7_ferm_5_v_3_gc_rwuqebho5v" ON "qti"."placed_binding_cardinality" USING btree ("__node_7ferm5v3gc");

CREATE INDEX "__placed_binding_cardinality_ix_node_gfaeb_4_prff_vaf35t6liu" ON "qti"."placed_binding_cardinality" USING btree ("__node_gfaeb4prff", "__mosts_tsxccemewe");

CREATE INDEX "__placed_binding_cardinality_ix_declaration_4dwuoqq5kb" ON "qti"."placed_binding_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__placed_binding_cardinality_ix_node_gaps_gddkeypr4m" ON "qti"."placed_binding_cardinality" USING btree ("node", "gaps");

CREATE INDEX "__placed_binding_declaration_ix_instance_o_2_mj_6_jp_kkc36eye4l" ON "qti"."placed_binding_declaration" USING btree ("__instance_o2mj6jp54p", "__node_wmg2sk5kn2", "__attribute_z7y72kybyf");

CREATE INDEX "__placed_binding_declaration_ix_declaration_assembly_2addaspu2x" ON "qti"."placed_binding_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__placed_catalog_ref_ix_assembly_id_pc7cqhzymb" ON "qti"."placed_catalog_ref" USING btree ("assembly", "id");

CREATE INDEX "__placed_choice_ix_node_document_kind_identifier_lczatqkq3c" ON "qti"."placed_choice" USING btree ("node", "document", "kind", "identifier");

CREATE INDEX "__placed_document_ix_document_references_milg3e5rdy" ON "qti"."placed_document" USING btree ("document", "references");

CREATE INDEX "__placed_hottext_ix_node_document_identifier_yknhmmfjnp" ON "qti"."placed_hottext" USING btree ("node", "document", "identifier");

CREATE INDEX "__placed_id_ix_node_document_id_owner_e5wohffk7l" ON "qti"."placed_id" USING btree ("node", "document", "id", "owner");

CREATE INDEX "__placed_idref_ix_assembly_id_vpaeczqcjl" ON "qti"."placed_idref" USING btree ("assembly", "id");

CREATE INDEX "__placed_idref_ix_document_id_q6tmlasbt7" ON "qti"."placed_idref" USING btree ("document", "id");

CREATE INDEX "__placed_math_rank_ix_instance_boc_7_dpt_43_h_parent_bzfvxvh44o" ON "qti"."placed_math_rank" USING btree ("__instance_boc7dpt43h", "__parent_hwejryg34m", "__parent_rank_djgpmhcqav");

CREATE INDEX "__placed_math_rank_ix_instance_document_assembly_mpzhzz7n5s" ON "qti"."placed_math_rank" USING btree ("instance", "document", "assembly");

CREATE INDEX "__placed_math_rank_ix_node_document_kind_parent_vo6tu2lpod" ON "qti"."placed_math_rank" USING btree ("node", "document", "kind", "parent");

CREATE INDEX "__placed_reference_ix_document_node_attribute_vo3wdryb65" ON "qti"."placed_reference" USING btree ("document", "node", "attribute");

CREATE INDEX "__placed_share_target_ix_assembly_id_target_target_izyo3xwaoi" ON "qti"."placed_share_target" USING btree ("assembly", "id", "target", "target_copy");

CREATE INDEX "__placed_share_target_ix_instance_document_assembly_gx7rfghoh3" ON "qti"."placed_share_target" USING btree ("instance", "document", "assembly", "assembly_kind");

CREATE INDEX "__placed_share_target_ix_target_instance_target_y7tchqidv3" ON "qti"."placed_share_target" USING btree ("target_instance", "target", "target_rank");

CREATE INDEX "__placed_share_target_ix_target_instance_target_d2oyu5er3k" ON "qti"."placed_share_target" USING btree ("target_instance", "target_document", "assembly");

CREATE INDEX "__placed_variable_ref_ix_instance_n_5_ohc_4_oypz_vdka6ilemq" ON "qti"."placed_variable_ref" USING btree ("__instance_n5ohc4oypz", "__node_uxuuifp4t7", "__attribute_r3bfjzxqlg");

CREATE INDEX "__placed_variable_ref_ix_assembly_identifier_nzdg4ajijy" ON "qti"."placed_variable_ref" USING btree ("assembly", "identifier");

CREATE INDEX "__placed_variable_ref_ix_assembly_root_kind_wtjndqcygw" ON "qti"."placed_variable_ref" USING btree ("assembly", "root_kind");

CREATE INDEX "__placed_variable_ref_ix_node_attribute_document_gz2i4fauh7" ON "qti"."placed_variable_ref" USING btree ("node", "attribute", "document", "identifier", "kind");

CREATE INDEX "__placed_variable_ref_declaration_ix_declaration_ven6cno7wf" ON "qti"."placed_variable_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "decl_base_types", "decl_cardinalities");

CREATE INDEX "__placed_xml_lang_ix_node_document_lang_scope_3xyzhgioqj" ON "qti"."placed_xml_lang" USING btree ("node", "document", "lang", "scope");

CREATE INDEX "__printed_variable_ref_ix_node_55_rq_6_xvhgt_rawuabmper" ON "qti"."printed_variable_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__printed_variable_ref_declaration_ix_declaration_va4lzrrc3d" ON "qti"."printed_variable_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__processing_ix_parent_wsm_6_mff_5_fw_language_ysbx4c7aly" ON "qti"."processing" USING btree ("__parent_wsm6mff5fw", "__language_zyvgaanajc");

CREATE INDEX "__processing_ix_parent_parent_kind_nv5y7kjfju" ON "qti"."processing" USING btree ("parent", "parent_kind");

CREATE INDEX "__quotation_ix_node_tosbz_6_k_545_first_at_fbk_365_i_jfy22j4oy7" ON "qti"."quotation" USING btree ("__node_tosbz6k545", "__first_at_fbk365i4gm", "__first_saeggpwji4");

CREATE INDEX "__quotation_ix_parent_iam_5_ypvehw_next_at_3toimnhfa7" ON "qti"."quotation" USING btree ("__parent_iam5ypvehw", "__next_at_axnykqptgp", "__after_opywcrlnpf");

CREATE INDEX "__quotation_ix_parent_pred_at_xktcobhsti_before_hkzsuqd34g" ON "qti"."quotation" USING btree ("parent", "__pred_at_xktcobhsti", "before");

CREATE INDEX "__quotation_ix_parent_parent_at_siblings_gqac4eotfl" ON "qti"."quotation" USING btree ("parent", "parent_at", "siblings");

CREATE INDEX "__reading_ix_assembly_4_bfahshcjz_node_oowzks_6_eia_3bnba2cpoy" ON "qti"."reading" USING btree ("__assembly_4bfahshcjz", "__node_oowzks6eia", "__attribute_pl3ahb6rmg", "__split_cigfxqb6ra", "__scope_rldc2qc6u4");

CREATE INDEX "__reading_ix_assembly_6_em_4_ektx_6_u_node_bp_6_ecnpd34545" ON "qti"."reading" USING btree ("__assembly_6em4ektx6u", "__node_bp6vedotva", "__attribute_ndgwbfpcdi", "__form_tqkkrxlxne", "__split_bifcu7k4it");

CREATE INDEX "__reading_ix_assembly_ngcwftk_6_ei_node_lqn_4_xsjsuw_lb7hq5tbvs" ON "qti"."reading" USING btree ("__assembly_ngcwftk6ei", "__node_lqn4xsjsuw", "__attribute_2ypfef2xpc", "__split_klwvffihyw", "__number_qt3q5hnqas");

CREATE INDEX "__reading_ix_assembly_swqio_3_e_6_qa_node_gmthmsff_3_mxkpdtcegm" ON "qti"."reading" USING btree ("__assembly_swqio3e6qa", "__node_gmthmsff3q", "__attribute_ylynjrd6gt", "__form_dirsuoz6mi", "__split_lvhup22aw7", "__named_czfcpbdnzo");

CREATE INDEX "__reading_ix_assembly_form_source_jtkislj3ne" ON "qti"."reading" USING btree ("assembly", "form", "source");

CREATE INDEX "__reading_ix_assembly_form_variable_l2bvs54pzn" ON "qti"."reading" USING btree ("assembly", "form", "variable");

CREATE INDEX "__reading_ix_assembly_found_named_named_kind_o2kvu7cbvr" ON "qti"."reading" USING btree ("assembly", "found", "named", "named_kind", "replaced", "placements", "scope");

CREATE INDEX "__reading_ix_form_found_named_named_kind_variable_ry7g2zdmtq" ON "qti"."reading" USING btree ("form", "found", "named", "named_kind", "variable");

CREATE INDEX "__reading_ix_form_found_named_kind_variable_edvnj4r7bo" ON "qti"."reading" USING btree ("form", "found", "named_kind", "variable");

CREATE INDEX "__reading_cardinality_ix_declaration_decl_zp7xcfaxuu" ON "qti"."reading_cardinality" USING btree ("declaration", "decl_cardinality");

CREATE INDEX "__reading_declaration_ix_assembly_k_2_akboys_45_node_wmy7g65syk" ON "qti"."reading_declaration" USING btree ("__assembly_k2akboys45", "__node_uil6od5i76", "__attribute_5iljhx7ndq", "__form_rs3xtjqw6s", "__split_4pnlupb6im");

CREATE INDEX "__reading_declaration_ix_declaration_3_dbdmjjanz_uj57od7obf" ON "qti"."reading_declaration" USING btree ("__declaration_3dbdmjjanz");

CREATE INDEX "__reading_declaration_ix_declaration_5_lf_3_iby_3_sx_hedvfeaean" ON "qti"."reading_declaration" USING btree ("__declaration_5lf3iby3sx");

CREATE INDEX "__reading_declaration_ix_declaration_j_37_ztisjuk_bwwqrswqn7" ON "qti"."reading_declaration" USING btree ("__declaration_j37ztisjuk");

CREATE INDEX "__reading_declaration_ix_declaration_mi_2_vc_4_x_57_3ei4lii33d" ON "qti"."reading_declaration" USING btree ("__declaration_mi2vc4x57b");

CREATE INDEX "__reading_declaration_ix_declaration_xmp_4_zkj_36_s_hk3mh6q2oq" ON "qti"."reading_declaration" USING btree ("__declaration_xmp4zkj36s");

CREATE INDEX "__reading_declaration_ix_named_nrv_4_n_3_nskd_qkep5dnjtn" ON "qti"."reading_declaration" USING btree ("__named_nrv4n3nskd", "__variable_n2k6ghxyfp", "__declaration_4coqakkdpt", "__declaration_kind_uwgyhqnmnf", "__decl_cardinalities_d5wqktcwmq", "__decl_base_types_odj5qxgexu");

CREATE INDEX "__reading_declaration_ix_decl_base_types_decl_oczbzqphdw" ON "qti"."reading_declaration" USING btree ("decl_base_types", "decl_cardinalities", "declaration", "declaration_kind", "form", "source", "assembly");

CREATE INDEX "__record_field_ix_node_ivazk_4_ulfo_identifier_e6hjpr4hds" ON "qti"."record_field" USING btree ("__node_ivazk4ulfo", "__identifier_lexical_dewsflk2g3");

CREATE INDEX "__reference_ix_node_6_rmfntt_35_j_erkaurnkvr" ON "qti"."reference" USING btree ("__node_6rmfntt35j");

CREATE INDEX "__reference_ix_node_rx_3_smqszrv_name_55_zdbs_4_rpu_jcrxk2llay" ON "qti"."reference" USING btree ("__node_rx3smqszrv", "__name_55zdbs4rpu", "__document_5cau2dspow", "__kind_3plysbbxy5");

CREATE INDEX "__reference_path_ix_package_7_t_2_ctw_5_cbp_path_ao_ji3zvkr7e6" ON "qti"."reference_path" USING btree ("__package_7t2ctw5cbp", "__path_ao7rtnqc22");

CREATE INDEX "__reference_path_ix_document_package_ft7vjozed2" ON "qti"."reference_path" USING btree ("document", "package");

CREATE INDEX "__reference_path_ix_package_path_3negrpmqjv" ON "qti"."reference_path" USING btree ("package", "path");

CREATE INDEX "__resource_ix_document_package_4v6ha45foo" ON "qti"."resource" USING btree ("document", "package");

CREATE INDEX "__resource_href_ix_package_path_abu2xsqi5y" ON "qti"."resource_href" USING btree ("package", "path");

CREATE INDEX "__resource_typed_ix_package_type_omgjswfary" ON "qti"."resource_typed" USING btree ("package", "type");

CREATE INDEX "__rounding_ix_node_bb_4_ru_6_chas_xc52xxnxi6" ON "qti"."rounding" USING btree ("__node_bb4ru6chas");

CREATE INDEX "__rounding_ix_node_n_3_wznir_2_nw_b735ps3dez" ON "qti"."rounding" USING btree ("__node_n3wznir2nw");

CREATE INDEX "__section_ix_node_bxkmiz_7_ib_7_jvlcsbo6z5" ON "qti"."section" USING btree ("__node_bxkmiz7ib7");

CREATE INDEX "__section_ix_node_g_7_y_6_datuly_xpy6bwfbjg" ON "qti"."section" USING btree ("__node_g7y6datuly");

CREATE INDEX "__section_ix_node_sfmmgf_7_sef_ffvqzam2lv" ON "qti"."section" USING btree ("__node_sfmmgf7sef");

CREATE INDEX "__section_ix_node_unjwgyq_4_jc_4zypjeiuz7" ON "qti"."section" USING btree ("__node_unjwgyq4jc");

CREATE INDEX "__section_ix_parent_zqp_2_kyzm_2_y_part_kpnf_72_dr_2_7ch3he55d7" ON "qti"."section" USING btree ("__parent_zqp2kyzm2y", "__part_kpnf72dr2e", "__replaced_icpgimu5lm", "__parent_mixes_zz36usjkro", "__parent_loose_chain_3w4mtgnsow");

CREATE INDEX "__section_ix_parent_parent_kind_tqlgl3axou" ON "qti"."section" USING btree ("parent", "parent_kind");

CREATE INDEX "__section_context_ref_ix_instance_qrmqdmq_4_b_2_node_clrwmdx4pa" ON "qti"."section_context_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_context_ref_ix_node_attribute_kind_qvzegje45p" ON "qti"."section_context_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_context_ref_declaration_ix_declaration_bc7sope34j" ON "qti"."section_context_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__section_feedback_ref_ix_instance_qrmqdmq_4_b_2_yunftoluak" ON "qti"."section_feedback_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_feedback_ref_ix_node_attribute_kind_ozyrzpd4s3" ON "qti"."section_feedback_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_feedback_ref_cardinality_ix_declaration_27dcc5aezn" ON "qti"."section_feedback_ref_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__section_feedback_ref_declaration_ix_declaration_n3zrwiypwy" ON "qti"."section_feedback_ref_declaration" USING btree ("__declaration_oxp5hcydih");

CREATE INDEX "__section_feedback_ref_declaration_ix_instance_o_2_ar2yc4poby" ON "qti"."section_feedback_ref_declaration" USING btree ("__instance_o2mj6jp54p", "__node_wmg2sk5kn2", "__attribute_z7y72kybyf");

CREATE INDEX "__section_feedback_ref_declaration_ix_declaration_yesvgbdqbv" ON "qti"."section_feedback_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__section_identifier_ix_node_a_2_cp_5_ppi_33_yngytm7d4l" ON "qti"."section_identifier" USING btree ("__node_a2cp5ppi33", "__attribute_kvvribbpob");

CREATE INDEX "__section_identifier_ix_document_root_kind_g3l2niacdw" ON "qti"."section_identifier" USING btree ("document", "root_kind");

CREATE INDEX "__section_member_ix_node_hf_7_blfijbr_abaq6dgm6h" ON "qti"."section_member" USING btree ("__node_hf7blfijbr");

CREATE INDEX "__section_ordering_ix_node_sfmmgf_7_sef_q43fvqvfz2" ON "qti"."section_ordering" USING btree ("__node_sfmmgf7sef");

CREATE INDEX "__section_printed_ref_ix_instance_qrmqdmq_4_b_2_node_xtdegqajaj" ON "qti"."section_printed_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_printed_ref_ix_node_attribute_kind_nbntrpexzz" ON "qti"."section_printed_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_printed_ref_declaration_ix_declaration_hqluim5xvc" ON "qti"."section_printed_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__section_scope_ix_document_feedbacks_prints_e6yhseqktg" ON "qti"."section_scope" USING btree ("document", "feedbacks", "prints", "templates", "contexts");

CREATE INDEX "__section_selection_ix_node_bxkmiz_7_ib_7_ocw4cy3zlg" ON "qti"."section_selection" USING btree ("__node_bxkmiz7ib7");

CREATE INDEX "__section_template_ref_ix_instance_qrmqdmq_4_b_2_5knnemc4lt" ON "qti"."section_template_ref" USING btree ("__instance_qrmqdmq4b2", "__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__section_template_ref_ix_node_attribute_kind_qitpjrt4b5" ON "qti"."section_template_ref" USING btree ("node", "attribute", "kind", "document", "identifier");

CREATE INDEX "__section_template_ref_cardinality_ix_declaration_cv634bqtnj" ON "qti"."section_template_ref_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__section_template_ref_declaration_ix_declaration_6_4tlaqjre5z" ON "qti"."section_template_ref_declaration" USING btree ("__declaration_6cfggqpwok");

CREATE INDEX "__section_template_ref_declaration_ix_instance_o_2_uml3nm4f2g" ON "qti"."section_template_ref_declaration" USING btree ("__instance_o2mj6jp54p", "__node_wmg2sk5kn2", "__attribute_z7y72kybyf");

CREATE INDEX "__section_template_ref_declaration_ix_declaration_eniodpekco" ON "qti"."section_template_ref_declaration" USING btree ("declaration", "assembly", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__share_fragment_ix_document_sba_7_m_53_uwz_cdvfxla47d" ON "qti"."share_fragment" USING btree ("__document_sba7m53uwz", "__placements_umab3ec74p");

CREATE INDEX "__share_fragment_ix_node_eixsmyfnul_document_slbxn5gade" ON "qti"."share_fragment" USING btree ("__node_eixsmyfnul", "__document_jwyigkitch", "__id_chqpn6jlrw");

CREATE INDEX "__share_fragment_ix_document_assembled_xmwggb7idu" ON "qti"."share_fragment" USING btree ("document", "assembled");

CREATE INDEX "__share_fragment_ix_document_id_y5gmd6qmc6" ON "qti"."share_fragment" USING btree ("document", "id");

CREATE INDEX "__share_target_ix_document_id_target_6to7sthh77" ON "qti"."share_target" USING btree ("document", "id", "target");

CREATE INDEX "__share_target_ix_target_target_rank_x5lykbzyp2" ON "qti"."share_target" USING btree ("target", "target_rank");

CREATE INDEX "__site_ix_node_4_btbiqcyve_kind_xumnxfryga_ezlmik6afr" ON "qti"."site" USING btree ("__node_4btbiqcyve", "__kind_xumnxfryga");

CREATE INDEX "__site_ix_node_hy_2_rqw_4_ikb_llk6oesco2" ON "qti"."site" USING btree ("__node_hy2rqw4ikb");

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

CREATE INDEX "__template_default_cardinality_ix_declaration_decl_wqwatraiet" ON "qti"."template_default_cardinality" USING btree ("declaration", "decl_cardinality");

CREATE INDEX "__template_default_target_ix_declaration_3_nsnittm_3y6h2urrnk" ON "qti"."template_default_target" USING btree ("__declaration_3nsnittm72", "__held_base_b3s6virptb");

CREATE INDEX "__template_default_target_ix_node_oddiidz_45_q_vuad4mqtqt" ON "qti"."template_default_target" USING btree ("__node_oddiidz45q");

CREATE INDEX "__template_default_target_ix_declaration_item_kdgu2nkhua" ON "qti"."template_default_target" USING btree ("declaration", "item_document", "template", "declaration_kind", "decl_base_types", "decl_cardinalities");

CREATE INDEX "__template_default_target_ix_item_ref_item_document_ny6h5uzu6j" ON "qti"."template_default_target" USING btree ("item_ref", "item_document");

CREATE INDEX "__template_ref_ix_node_55_rq_6_xvhgt_attribute_7jv6gqn6ms" ON "qti"."template_ref" USING btree ("__node_55rq6xvhgt", "__attribute_hfyfakg5bn");

CREATE INDEX "__template_ref_cardinality_ix_declaration_fddrgrvvjq" ON "qti"."template_ref_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__template_ref_declaration_ix_declaration_6_2zqj6yz37a" ON "qti"."template_ref_declaration" USING btree ("__declaration_6cfggqpwok");

CREATE INDEX "__template_ref_declaration_ix_node_wmg_2_sk_5_kn_2_c7f5qt5pse" ON "qti"."template_ref_declaration" USING btree ("__node_wmg2sk5kn2", "__attribute_z7y72kybyf");

CREATE INDEX "__template_ref_declaration_ix_declaration_document_ym7oyn6ayj" ON "qti"."template_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "base_types", "cardinalities");

CREATE INDEX "__test_flag_ix_node_2_mdqieju_4_t_u3qwtmv43a" ON "qti"."test_flag" USING btree ("__node_2mdqieju4t");

CREATE INDEX "__test_flag_ix_node_agrnt_4_oxfj_value_b_2_u_3_pnmj_fh2fyk37ua" ON "qti"."test_flag" USING btree ("__node_agrnt4oxfj", "__value_b2u3pnmj35");

CREATE INDEX "__test_flag_ix_node_gmu_2_rwiqtm_xbk5gzzuum" ON "qti"."test_flag" USING btree ("__node_gmu2rwiqtm");

CREATE INDEX "__test_flag_ix_node_hrmsw_5_h_6_x_3_eiptz7por4" ON "qti"."test_flag" USING btree ("__node_hrmsw5h6x3");

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

CREATE INDEX "__text_reference_ix_node_rx_3_smqszrv_document_5_cau_m4tt5whv7z" ON "qti"."text_reference" USING btree ("__node_rx3smqszrv", "__document_5cau2dspow", "__kind_3plysbbxy5");

CREATE INDEX "__text_reference_path_ix_document_package_fj2vzkfhas" ON "qti"."text_reference_path" USING btree ("document", "package");

CREATE INDEX "__text_reference_path_ix_package_path_mhawtr43cb" ON "qti"."text_reference_path" USING btree ("package", "path");

CREATE INDEX "__typed_value_ix_declaration_base_type_wcvi77nmqz" ON "qti"."typed_value" USING btree ("declaration", "base_type");

CREATE INDEX "__typed_value_ix_declaration_cardinality_vqkwinouls" ON "qti"."typed_value" USING btree ("declaration", "cardinality");

CREATE INDEX "__value_ix_node_qlzux_26_h_3_u_3geqgrisfy" ON "qti"."value" USING btree ("__node_qlzux26h3u");

CREATE INDEX "__value_ix_parent_cardinalities_base_types_wcfmn2aym2" ON "qti"."value" USING btree ("parent", "cardinalities", "base_types", "declaration");

CREATE INDEX "__value_base_type_ix_node_wmg_2_sk_5_kn_2_hit2tn3vwd" ON "qti"."value_base_type" USING btree ("__node_wmg2sk5kn2");

CREATE INDEX "__value_set_ix_node_wmg_2_sk_5_kn_2_kkn3z56ovn" ON "qti"."value_set" USING btree ("__node_wmg2sk5kn2");

CREATE INDEX "__value_set_ix_parent_document_declaration_kind_3smdmld2n4" ON "qti"."value_set" USING btree ("parent", "document", "declaration_kind", "cardinalities", "base_types");

CREATE INDEX "__value_set_cardinality_ix_declaration_cardinality_zautzur7ay" ON "qti"."value_set_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__variable_ref_ix_node_a_2_cp_5_ppi_33_attribute_k57kmi67dy" ON "qti"."variable_ref" USING btree ("__node_a2cp5ppi33", "__attribute_kvvribbpob");

CREATE INDEX "__variable_ref_ix_node_ept_2_xsrq_7_v_parent_ute_33_bc7uvcfnfz" ON "qti"."variable_ref" USING btree ("__node_ept2xsrq7v", "__parent_ute33fgrzx", "__kind_3skb4abdy2", "__language_g4fbnc6kzm", "__element_base_s2ys2dkumh", "__element_cardinality_kv7fsfl2bu");

CREATE INDEX "__variable_ref_ix_node_uxuuifp_4_t_7_attribute_r_3_hbrsbajasi" ON "qti"."variable_ref" USING btree ("__node_uxuuifp4t7", "__attribute_r3bfjzxqlg");

CREATE INDEX "__variable_ref_ix_node_w_3_q_3_f_46_jo_2_language_ylud6vetn2" ON "qti"."variable_ref" USING btree ("__node_w3q3f46jo2", "__language_hdk63u5nao");

CREATE INDEX "__variable_ref_ix_document_identifier_diaxydqt43" ON "qti"."variable_ref" USING btree ("document", "identifier");

CREATE INDEX "__variable_ref_cardinality_ix_declaration_decl_vqnwx3s5w5" ON "qti"."variable_ref_cardinality" USING btree ("declaration", "decl_cardinality");

CREATE INDEX "__variable_ref_declaration_ix_declaration_6_bft_2_h_gubkmuwa3c" ON "qti"."variable_ref_declaration" USING btree ("__declaration_6bft2h4jzn", "__base_type_py5nl74fdb");

CREATE INDEX "__variable_ref_declaration_ix_node_dbjifphqpa_wgv2ubislc" ON "qti"."variable_ref_declaration" USING btree ("__node_dbjifphqpa", "__attribute_65tahrtdal");

CREATE INDEX "__variable_ref_declaration_ix_node_oddiidz_45_q_ot4udtmgqn" ON "qti"."variable_ref_declaration" USING btree ("__node_oddiidz45q", "__attribute_a67kws7zuj");

CREATE INDEX "__variable_ref_declaration_ix_node_zcbidp_54_qt_mrrpc2az4x" ON "qti"."variable_ref_declaration" USING btree ("__node_zcbidp54qt", "__attribute_tlxaefzruf");

CREATE INDEX "__variable_ref_declaration_ix_declaration_document_ypeet4bdps" ON "qti"."variable_ref_declaration" USING btree ("declaration", "document", "identifier", "declaration_kind", "decl_base_types", "decl_cardinalities");

CREATE INDEX "__variable_ref_table_ix_declaration_64_rmrn_7_lb_4_vuehoremtx" ON "qti"."variable_ref_table" USING btree ("__declaration_64rmrn7lb4");

CREATE INDEX "__variable_ref_table_ix_declaration_7_oil_3_wdbvb_7kjdd4bqbr" ON "qti"."variable_ref_table" USING btree ("__declaration_7oil3wdbvb");

CREATE INDEX "__variable_ref_table_ix_declaration_ilbk_4_ibhk_7_wfkc6rgeie" ON "qti"."variable_ref_table" USING btree ("__declaration_ilbk4ibhk7");

CREATE INDEX "__variable_ref_table_ix_declaration_jdfygrbjce_o6fgh34myr" ON "qti"."variable_ref_table" USING btree ("__declaration_jdfygrbjce");

CREATE STATISTICS "qti"."__attribute_entity_stats_attribute_node_ydjs6qqmch" (ndistinct, dependencies, mcv) ON "attribute", "node" FROM "qti"."attribute_entity";

CREATE STATISTICS "qti"."__open_attribute_name_stats_attribute_node_nitlmx7dbm" (ndistinct, dependencies, mcv) ON "attribute", "node" FROM "qti"."open_attribute_name";
