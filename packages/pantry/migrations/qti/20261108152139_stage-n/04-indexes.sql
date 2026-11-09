-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__assembled_id_key_assembly_id_owner_ujce7hrdm7";

CREATE UNIQUE INDEX CONCURRENTLY "__assembled_id_key_assembly_id_owner_ujce7hrdm7" ON "qti"."assembled_id" USING btree ("assembly", "id", "owner");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_id_open_name_governs_kind_name_udfzv7fjm5";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_id_open_name_governs_kind_name_udfzv7fjm5" ON "qti"."attribute" USING btree ("node", "id", "open_name", "governs", "kind", "name", "version");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_rmoe3heakj";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_rmoe3heakj" ON "qti"."attribute" USING btree ("__node_kvvtz4aokl");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_name_lur3pupati";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_name_lur3pupati" ON "qti"."attribute" USING btree ("__node_v4zoanxsju", "__name_vvkts6omjc");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_ezrr5xs2wh";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_ezrr5xs2wh" ON "qti"."attribute" USING btree ("__node_k7rqu5upsz");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_z3fpxb33wr";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_z3fpxb33wr" ON "qti"."attribute" USING btree ("__node_h7ktnl7tci");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_j3nl2tgoep";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_j3nl2tgoep" ON "qti"."attribute" USING btree ("__node_tblig6omlm");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_j5k5x63vk5";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_j5k5x63vk5" ON "qti"."attribute" USING btree ("__node_tsiudobb4f");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_tsbrtp3osw";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_tsbrtp3osw" ON "qti"."attribute" USING btree ("__node_yp7qmbepyb");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_3gwlsgbzky";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_3gwlsgbzky" ON "qti"."attribute" USING btree ("__node_zxxp2534g5");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_c6surz4m55";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_c6surz4m55" ON "qti"."attribute" USING btree ("__node_52tvzova3k");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_77bmalp47s";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_77bmalp47s" ON "qti"."attribute" USING btree ("__node_su53cqvokz");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_2zna26wugb";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_2zna26wugb" ON "qti"."attribute" USING btree ("__node_uyp7pedfw2");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_uuivyleqbm";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_uuivyleqbm" ON "qti"."attribute" USING btree ("__node_goabodzugo");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__declaration_key_node_parent_kind_3o2lalckgi";

CREATE UNIQUE INDEX CONCURRENTLY "__declaration_key_node_parent_kind_3o2lalckgi" ON "qti"."declaration" USING btree ("node", "parent_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_attribute_key_node_attribute_written_sqs5cpgyqi";

CREATE UNIQUE INDEX CONCURRENTLY "__expression_attribute_key_node_attribute_written_sqs5cpgyqi" ON "qti"."expression_attribute" USING btree ("node", "attribute", "written");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_attribute_key_node_written_attribute_gmblqwrdel";

CREATE UNIQUE INDEX CONCURRENTLY "__expression_attribute_key_node_written_attribute_gmblqwrdel" ON "qti"."expression_attribute" USING btree ("node", "written", "attribute");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_attribute_key_node_emltek4plt";

CREATE UNIQUE INDEX CONCURRENTLY "__expression_attribute_key_node_emltek4plt" ON "qti"."expression_attribute" USING btree ("__node_gyptgprpk7");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_attribute_key_node_s4lcb7r25q";

CREATE UNIQUE INDEX CONCURRENTLY "__expression_attribute_key_node_s4lcb7r25q" ON "qti"."expression_attribute" USING btree ("__node_l66firaakd");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__instance_key_id_document_assembly_wqqiitvjwd";

CREATE UNIQUE INDEX CONCURRENTLY "__instance_key_id_document_assembly_wqqiitvjwd" ON "qti"."instance" USING btree ("id", "document", "assembly");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__interaction_key_node_module_forms_i7sufvfcmf";

CREATE UNIQUE INDEX CONCURRENTLY "__interaction_key_node_module_forms_i7sufvfcmf" ON "qti"."interaction" USING btree ("node", "module_forms");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__map_key_key_node_case_text_3a5vudl54f";

CREATE UNIQUE INDEX CONCURRENTLY "__map_key_key_node_case_text_3a5vudl54f" ON "qti"."map_key" USING btree ("node", "case_text");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__map_key_key_node_euxthmmamh";

CREATE UNIQUE INDEX CONCURRENTLY "__map_key_key_node_euxthmmamh" ON "qti"."map_key" USING btree ("__node_kupzut65fd");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__map_key_type_key_node_base_type_ya2jqubgrb";

CREATE UNIQUE INDEX CONCURRENTLY "__map_key_type_key_node_base_type_ya2jqubgrb" ON "qti"."map_key_type" USING btree ("node", "base_type");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_document_kind_parent_abf25mzj2n";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_document_kind_parent_abf25mzj2n" ON "qti"."node" USING btree ("id", "document", "kind", "parent");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_parent_kind_bcix5a5ymv";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_parent_kind_bcix5a5ymv" ON "qti"."node" USING btree ("__id_cd2i27c3ms", "parent_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_parent_kind_cy4qhoyaol";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_parent_kind_cy4qhoyaol" ON "qti"."node" USING btree ("__id_d2goefw6wb", "parent_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_vuxeuhz6wl";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_vuxeuhz6wl" ON "qti"."node" USING btree ("__id_gzljvgjbwk");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_kind_ge47i2ygoj";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_kind_ge47i2ygoj" ON "qti"."node" USING btree ("__id_riubp6fpbe", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_kind_qlw5xvtx32";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_kind_qlw5xvtx32" ON "qti"."node" USING btree ("__id_akgrikbcwo", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_parent_kind_vjnqmkdkwf";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_parent_kind_vjnqmkdkwf" ON "qti"."node" USING btree ("__parent_uzfw6kuely", "__kind_pfg4bqow25");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_parent_n6ugjuynxn";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_parent_n6ugjuynxn" ON "qti"."node" USING btree ("__parent_gvsacnek5z");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__placed_idref_key_instance_id_document_assembly_4v7dioxhgu";

CREATE UNIQUE INDEX CONCURRENTLY "__placed_idref_key_instance_id_document_assembly_4v7dioxhgu" ON "qti"."placed_idref" USING btree ("instance", "id", "document", "assembly");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__placed_xml_lang_key_instance_node_54e5cx3n65";

CREATE UNIQUE INDEX CONCURRENTLY "__placed_xml_lang_key_instance_node_54e5cx3n65" ON "qti"."placed_xml_lang" USING btree ("__instance_ryj3b3mgaw", "__node_nt6ftizred");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_key_assembly_node_attribute_fl3364kuzj";

CREATE UNIQUE INDEX CONCURRENTLY "__reading_key_assembly_node_attribute_fl3364kuzj" ON "qti"."reading" USING btree ("__assembly_sggtw6cwda", "__node_ngapbvqkdw", "__attribute_dn7csff7gp");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_key_assembly_node_attribute_kind_4uz6oovfmo";

CREATE UNIQUE INDEX CONCURRENTLY "__reading_key_assembly_node_attribute_kind_4uz6oovfmo" ON "qti"."reading" USING btree ("__assembly_sggtw6cwda", "__node_ngapbvqkdw", "__attribute_dn7csff7gp", "__kind_jpu2chchxq");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reference_key_node_name_scope_chd2zywqnq";

CREATE UNIQUE INDEX CONCURRENTLY "__reference_key_node_name_scope_chd2zywqnq" ON "qti"."reference" USING btree ("node", "name", "scope");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reference_key_node_3jgv6f5ia4";

CREATE UNIQUE INDEX CONCURRENTLY "__reference_key_node_3jgv6f5ia4" ON "qti"."reference" USING btree ("__node_scx2hiwvjr");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__section_template_ref_declaration_key_instance_node_emy7juxcxe";

CREATE UNIQUE INDEX CONCURRENTLY "__section_template_ref_declaration_key_instance_node_emy7juxcxe" ON "qti"."section_template_ref_declaration" USING btree ("instance", "node", "attribute", "declaration", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__template_ref_declaration_key_node_attribute_5yhuqmcbse";

CREATE UNIQUE INDEX CONCURRENTLY "__template_ref_declaration_key_node_attribute_5yhuqmcbse" ON "qti"."template_ref_declaration" USING btree ("node", "attribute", "declaration", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__test_document_key_node_instances_k4obic4tsn";

CREATE UNIQUE INDEX CONCURRENTLY "__test_document_key_node_instances_k4obic4tsn" ON "qti"."test_document" USING btree ("node", "instances");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__usage_value_key_node_base_type_lexical_o4cwubtrum";

CREATE UNIQUE INDEX CONCURRENTLY "__usage_value_key_node_base_type_lexical_o4cwubtrum" ON "qti"."usage_value" USING btree ("__node_uazzjek2gb", "__base_type_lexical_ch24no2osx");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__variable_mapping_key_node_parent_hibsagkd2k";

CREATE UNIQUE INDEX CONCURRENTLY "__variable_mapping_key_node_parent_hibsagkd2k" ON "qti"."variable_mapping" USING btree ("node", "parent");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__xml_lang_key_node_document_lang_scope_locn5q2jix";

CREATE UNIQUE INDEX CONCURRENTLY "__xml_lang_key_node_document_lang_scope_locn5q2jix" ON "qti"."xml_lang" USING btree ("node", "document", "lang", "scope");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__xml_lang_key_node_764mfogklt";

CREATE UNIQUE INDEX CONCURRENTLY "__xml_lang_key_node_764mfogklt" ON "qti"."xml_lang" USING btree ("__node_nt6ftizred");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__assembled_reference_ix_assembly_eavgo_22_inf_node_2rzu2tcgme";

CREATE INDEX CONCURRENTLY "__assembled_reference_ix_assembly_eavgo_22_inf_node_2rzu2tcgme" ON "qti"."assembled_reference" USING btree ("__assembly_eavgo22inf", "__node_zhqd2beld3", "__attribute_2nqioyibuz");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__declaration_ix_parent_parent_kind_yvnpvak3wm";

CREATE INDEX CONCURRENTLY "__declaration_ix_parent_parent_kind_yvnpvak3wm" ON "qti"."declaration" USING btree ("parent", "parent_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__declaration_identifier_ix_node_fkiarxhsad_2dkbo35y25";

CREATE INDEX CONCURRENTLY "__declaration_identifier_ix_node_fkiarxhsad_2dkbo35y25" ON "qti"."declaration_identifier" USING btree ("__node_fkiarxhsad");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__declaration_identifier_ix_node_zfo_6_tymqbh_mmxgem64gu";

CREATE INDEX CONCURRENTLY "__declaration_identifier_ix_node_zfo_6_tymqbh_mmxgem64gu" ON "qti"."declaration_identifier" USING btree ("__node_zfo6tymqbh");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_ix_node_yijjz_6_u_7_vd_u2vk2mapci";

CREATE INDEX CONCURRENTLY "__expression_ix_node_yijjz_6_u_7_vd_u2vk2mapci" ON "qti"."expression" USING btree ("__node_yijjz6u7vd");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_attribute_ix_node_j_2_c_273_zmua_6irf2xy6o3";

CREATE INDEX CONCURRENTLY "__expression_attribute_ix_node_j_2_c_273_zmua_6irf2xy6o3" ON "qti"."expression_attribute" USING btree ("__node_j2c273zmua", "__written_xr2xcpx7cp");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_attribute_ix_node_zjgiyb_7_nr_7_3xewekacwn";

CREATE INDEX CONCURRENTLY "__expression_attribute_ix_node_zjgiyb_7_nr_7_3xewekacwn" ON "qti"."expression_attribute" USING btree ("__node_zjgiyb7nr7");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__map_key_ix_node_rkykeekqwq_3fsflivgwg";

CREATE INDEX CONCURRENTLY "__map_key_ix_node_rkykeekqwq_3fsflivgwg" ON "qti"."map_key" USING btree ("__node_rkykeekqwq");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__map_key_ix_node_ytvjqsvok_4_3b4rrtddkp";

CREATE INDEX CONCURRENTLY "__map_key_ix_node_ytvjqsvok_4_3b4rrtddkp" ON "qti"."map_key" USING btree ("__node_ytvjqsvok4");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__map_key_type_ix_node_tspabsizer_bxj3mcnjkq";

CREATE INDEX CONCURRENTLY "__map_key_type_ix_node_tspabsizer_bxj3mcnjkq" ON "qti"."map_key_type" USING btree ("__node_tspabsizer");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_ix_id_33_kgwoi_4_ec_ojslxjumzu";

CREATE INDEX CONCURRENTLY "__node_ix_id_33_kgwoi_4_ec_ojslxjumzu" ON "qti"."node" USING btree ("__id_33kgwoi4ec");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_ix_id_4_kyfqj_6_js_7_h5y5njhzbp";

CREATE INDEX CONCURRENTLY "__node_ix_id_4_kyfqj_6_js_7_h5y5njhzbp" ON "qti"."node" USING btree ("__id_4kyfqj6js7");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_ix_id_hdt_6_eyj_25_k_qrxya73myb";

CREATE INDEX CONCURRENTLY "__node_ix_id_hdt_6_eyj_25_k_qrxya73myb" ON "qti"."node" USING btree ("__id_hdt6eyj25k");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_ix_id_lpqd_3_za_4_po_bqqgtjitsc";

CREATE INDEX CONCURRENTLY "__node_ix_id_lpqd_3_za_4_po_bqqgtjitsc" ON "qti"."node" USING btree ("__id_lpqd3za4po");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_ix_id_tw_4_vam_75_we_5kcd7y5t2c";

CREATE INDEX CONCURRENTLY "__node_ix_id_tw_4_vam_75_we_5kcd7y5t2c" ON "qti"."node" USING btree ("__id_tw4vam75we");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__placed_xml_lang_ix_node_document_lang_scope_3xyzhgioqj";

CREATE INDEX CONCURRENTLY "__placed_xml_lang_ix_node_document_lang_scope_3xyzhgioqj" ON "qti"."placed_xml_lang" USING btree ("node", "document", "lang", "scope");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_ix_assembly_brf_3_sbdwa_3_node_vdwnogher_6_ujw2fqpkhv";

CREATE INDEX CONCURRENTLY "__reading_ix_assembly_brf_3_sbdwa_3_node_vdwnogher_6_ujw2fqpkhv" ON "qti"."reading" USING btree ("__assembly_brf3sbdwa3", "__node_vdwnogher6", "__attribute_szn64gmkfk", "__form_zd4qqbgfsu", "__split_pb3ut3hart");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_ix_declaration_iyg_4_qzi_7_lx_l25loxzi52";

CREATE INDEX CONCURRENTLY "__reading_ix_declaration_iyg_4_qzi_7_lx_l25loxzi52" ON "qti"."reading" USING btree ("__declaration_iyg4qzi7lx");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_ix_declaration_pnhwgyt_6_uo_afvw2thxyx";

CREATE INDEX CONCURRENTLY "__reading_ix_declaration_pnhwgyt_6_uo_afvw2thxyx" ON "qti"."reading" USING btree ("__declaration_pnhwgyt6uo");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_ix_declaration_pucv_7_vcefe_m7m42sfr2x";

CREATE INDEX CONCURRENTLY "__reading_ix_declaration_pucv_7_vcefe_m7m42sfr2x" ON "qti"."reading" USING btree ("__declaration_pucv7vcefe");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_ix_declaration_rppsrhr_5_i_4_xtsbr5wfhl";

CREATE INDEX CONCURRENTLY "__reading_ix_declaration_rppsrhr_5_i_4_xtsbr5wfhl" ON "qti"."reading" USING btree ("__declaration_rppsrhr5i4");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_ix_declaration_wt_7_jbmsmtl_gwvvc3qx4n";

CREATE INDEX CONCURRENTLY "__reading_ix_declaration_wt_7_jbmsmtl_gwvvc3qx4n" ON "qti"."reading" USING btree ("__declaration_wt7jbmsmtl");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reading_ix_named_wkt_6_teogcz_variable_2_uaihkdfhu_gywpfki2c7";

CREATE INDEX CONCURRENTLY "__reading_ix_named_wkt_6_teogcz_variable_2_uaihkdfhu_gywpfki2c7" ON "qti"."reading" USING btree ("__named_wkt6teogcz", "__variable_2uaihkdfhu", "__declaration_3mv65pwvgk", "__declaration_kind_x26izueojr", "__decl_cardinalities_vvydu3gy53", "__decl_base_types_5x4gxdsycq");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__section_template_ref_declaration_ix_declaration_6_4tlaqjre5z";

CREATE INDEX CONCURRENTLY "__section_template_ref_declaration_ix_declaration_6_4tlaqjre5z" ON "qti"."section_template_ref_declaration" USING btree ("__declaration_6cfggqpwok");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__section_template_ref_declaration_ix_instance_o_2_uml3nm4f2g";

CREATE INDEX CONCURRENTLY "__section_template_ref_declaration_ix_instance_o_2_uml3nm4f2g" ON "qti"."section_template_ref_declaration" USING btree ("__instance_o2mj6jp54p", "__node_wmg2sk5kn2", "__attribute_z7y72kybyf");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__site_ix_node_4_btbiqcyve_kind_xumnxfryga_ezlmik6afr";

CREATE INDEX CONCURRENTLY "__site_ix_node_4_btbiqcyve_kind_xumnxfryga_ezlmik6afr" ON "qti"."site" USING btree ("__node_4btbiqcyve", "__kind_xumnxfryga");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__site_ix_node_hy_2_rqw_4_ikb_llk6oesco2";

CREATE INDEX CONCURRENTLY "__site_ix_node_hy_2_rqw_4_ikb_llk6oesco2" ON "qti"."site" USING btree ("__node_hy2rqw4ikb");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__template_ref_declaration_ix_declaration_6_2zqj6yz37a";

CREATE INDEX CONCURRENTLY "__template_ref_declaration_ix_declaration_6_2zqj6yz37a" ON "qti"."template_ref_declaration" USING btree ("__declaration_6cfggqpwok");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__template_ref_declaration_ix_node_wmg_2_sk_5_kn_2_c7f5qt5pse";

CREATE INDEX CONCURRENTLY "__template_ref_declaration_ix_node_wmg_2_sk_5_kn_2_c7f5qt5pse" ON "qti"."template_ref_declaration" USING btree ("__node_wmg2sk5kn2", "__attribute_z7y72kybyf");
