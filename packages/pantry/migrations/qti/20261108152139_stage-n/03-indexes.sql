CREATE INDEX "__assembled_catalog_ix_owner_p3p4p7vpsa" ON "qti"."assembled_catalog" USING btree ("owner");

CREATE INDEX "__catalog_scope_ix_parent_pa_7_sxt_3_mut_scope_2_utzs75brpa" ON "qti"."catalog_scope" USING btree ("__parent_pa7sxt3mut", "__scope_2edhtd3orc");

CREATE INDEX "__catalog_target_ix_document_jwyigkitch_id_chqpn_6_virq3gqkdw" ON "qti"."catalog_target" USING btree ("__document_jwyigkitch", "__id_chqpn6jlrw");

CREATE INDEX "__catalog_target_ix_document_sba_7_m_53_uwz_4cupqxhlxv" ON "qti"."catalog_target" USING btree ("__document_sba7m53uwz", "__placements_umab3ec74p");

CREATE INDEX "__catalog_target_ix_document_assembled_mi42q2s6ku" ON "qti"."catalog_target" USING btree ("document", "assembled");

CREATE INDEX "__cn_count_ix_node_4_zs_7_f_4_hetq_type_lexical_mw_5_32kwnnitcd" ON "qti"."cn_count" USING btree ("__node_4zs7f4hetq", "__type_lexical_mw5gnzkqdv");

CREATE INDEX "__mapping_item_ref_ix_node_o_7_qeabbnno_7lsprznsl3" ON "qti"."mapping_item_ref" USING btree ("__node_o7qeabbnno");

CREATE INDEX "__mapping_item_ref_type_ix_node_pgr_2_c_2_ubor_2phdcz7o5o" ON "qti"."mapping_item_ref_type" USING btree ("__node_pgr2c2ubor");

CREATE INDEX "__mapping_item_ref_type_ix_item_ref_type_pzprkmab2a" ON "qti"."mapping_item_ref_type" USING btree ("item_ref", "type");

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

CREATE INDEX "__placed_catalog_ref_ix_assembly_id_pc7cqhzymb" ON "qti"."placed_catalog_ref" USING btree ("assembly", "id");

CREATE INDEX "__placed_math_rank_ix_instance_boc_7_dpt_43_h_parent_bzfvxvh44o" ON "qti"."placed_math_rank" USING btree ("__instance_boc7dpt43h", "__parent_hwejryg34m", "__parent_rank_djgpmhcqav");

CREATE INDEX "__placed_math_rank_ix_instance_document_assembly_mpzhzz7n5s" ON "qti"."placed_math_rank" USING btree ("instance", "document", "assembly");

CREATE INDEX "__placed_math_rank_ix_node_document_kind_parent_vo6tu2lpod" ON "qti"."placed_math_rank" USING btree ("node", "document", "kind", "parent");

CREATE INDEX "__placed_share_target_ix_assembly_id_target_target_izyo3xwaoi" ON "qti"."placed_share_target" USING btree ("assembly", "id", "target", "target_copy");

CREATE INDEX "__placed_share_target_ix_instance_document_assembly_gx7rfghoh3" ON "qti"."placed_share_target" USING btree ("instance", "document", "assembly", "assembly_kind");

CREATE INDEX "__placed_share_target_ix_target_instance_target_y7tchqidv3" ON "qti"."placed_share_target" USING btree ("target_instance", "target", "target_rank");

CREATE INDEX "__placed_share_target_ix_target_instance_target_d2oyu5er3k" ON "qti"."placed_share_target" USING btree ("target_instance", "target_document", "assembly");

CREATE INDEX "__section_template_ref_cardinality_ix_declaration_cv634bqtnj" ON "qti"."section_template_ref_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__share_fragment_ix_document_sba_7_m_53_uwz_cdvfxla47d" ON "qti"."share_fragment" USING btree ("__document_sba7m53uwz", "__placements_umab3ec74p");

CREATE INDEX "__share_fragment_ix_node_eixsmyfnul_document_slbxn5gade" ON "qti"."share_fragment" USING btree ("__node_eixsmyfnul", "__document_jwyigkitch", "__id_chqpn6jlrw");

CREATE INDEX "__share_fragment_ix_document_assembled_xmwggb7idu" ON "qti"."share_fragment" USING btree ("document", "assembled");

CREATE INDEX "__share_fragment_ix_document_id_y5gmd6qmc6" ON "qti"."share_fragment" USING btree ("document", "id");

CREATE INDEX "__share_target_ix_document_id_target_6to7sthh77" ON "qti"."share_target" USING btree ("document", "id", "target");

CREATE INDEX "__share_target_ix_target_target_rank_x5lykbzyp2" ON "qti"."share_target" USING btree ("target", "target_rank");

CREATE INDEX "__template_ref_cardinality_ix_declaration_fddrgrvvjq" ON "qti"."template_ref_cardinality" USING btree ("declaration", "cardinality");

CREATE INDEX "__text_reference_path_ix_document_package_fj2vzkfhas" ON "qti"."text_reference_path" USING btree ("document", "package");

CREATE INDEX "__text_reference_path_ix_package_path_mhawtr43cb" ON "qti"."text_reference_path" USING btree ("package", "path");
