ALTER TABLE "qti"."id_binding" ADD CONSTRAINT "__id_binding_key_document_id_owner_carriers_admitted_inddtnd2mu" UNIQUE USING INDEX "__id_binding_key_document_id_owner_carriers_admitted_inddtnd2mu";

ALTER TABLE "qti"."id_binding" ADD CONSTRAINT "__id_binding_key_document_id_llzafs6ajp" UNIQUE USING INDEX "__id_binding_key_document_id_llzafs6ajp";

ALTER TABLE "qti"."item_ref_target" ADD CONSTRAINT "__item_ref_target_key_node_index_targets_q2zfwgtqx3" UNIQUE USING INDEX "__item_ref_target_key_node_index_targets_q2zfwgtqx3";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_iyvasuyphs" UNIQUE USING INDEX "__node_key_id_iyvasuyphs";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_document_5tagtjbgoj" UNIQUE USING INDEX "__node_key_id_document_5tagtjbgoj";

ALTER TABLE "qti"."resource_href" ADD CONSTRAINT "__resource_href_key_node_package_path_nzbzmdfqem" UNIQUE USING INDEX "__resource_href_key_node_package_path_nzbzmdfqem";

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_key_document_index_targets_ca4f46xghj" UNIQUE USING INDEX "__site_target_key_document_index_targets_ca4f46xghj";

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_key_document_index_targets_after_ahi4znzcjo" UNIQUE USING INDEX "__site_target_key_document_index_targets_after_ahi4znzcjo";

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_key_node_parent_kind_places_target_o2sl5j6mjr" UNIQUE USING INDEX "__site_target_key_node_parent_kind_places_target_o2sl5j6mjr";

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_key_node_target_places_3fxneelujg" UNIQUE USING INDEX "__site_target_key_node_target_places_3fxneelujg";

ALTER TABLE "qti"."test_document" ADD CONSTRAINT "__test_document_key_node_targets_qmxh2nyfxk" UNIQUE USING INDEX "__test_document_key_node_targets_qmxh2nyfxk";

ALTER TABLE "qti"."inclusion" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."item_ref_target" VALIDATE CONSTRAINT "__item_ref_target_check_item_ref_target_counted_item_sn7sol4uot";

ALTER TABLE "qti"."site_target" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."site_target" VALIDATE CONSTRAINT "__site_target_check_site_target_counted_test_lcmbcunhdj";

ALTER TABLE "qti"."site_target" VALIDATE CONSTRAINT "__site_target_check_test_document_targets_count_fold_kq7fihbeoj";

ALTER TABLE "qti"."test_document" VALIDATE CONSTRAINT "__test_document_check_test_document_targets_count_axud4pinz2";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_nu2sz322f5";

ALTER TABLE "qti"."document_id" ADD CONSTRAINT "__document_id_fk_document_id_owner_copy_carriers_whgpsohdfl" FOREIGN KEY ("document", "id", "owner", "__copy_carriers_7e3eiolc54", "admitted") REFERENCES "qti"."id_binding" ("document", "id", "owner", "carriers", "admitted") MATCH SIMPLE ON UPDATE CASCADE NOT VALID;

ALTER TABLE "qti"."document_id" VALIDATE CONSTRAINT "__document_id_fk_document_id_owner_copy_carriers_whgpsohdfl";

ALTER TABLE "qti"."document_id" ADD CONSTRAINT "__document_id_fk_node_aw4mq3fcil" FOREIGN KEY ("__node_4ck2w6ow6d") REFERENCES "qti"."node" ("__id_vefq5vxxrm") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."document_id" VALIDATE CONSTRAINT "__document_id_fk_node_aw4mq3fcil";

ALTER TABLE "qti"."document_id" ADD CONSTRAINT "__document_id_fk_node_document_xqhqcztrjz" FOREIGN KEY ("__node_3olzulnuu3", "__document_7pfajdbgba") REFERENCES "qti"."node" ("__id_tyor4vdw5d", "__document_3cbls6hfyp") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."document_id" VALIDATE CONSTRAINT "__document_id_fk_node_document_xqhqcztrjz";

ALTER TABLE "qti"."idref_target" ADD CONSTRAINT "__idref_target_fk_document_id_eirp6y4xx3" FOREIGN KEY ("__document_jwyigkitch", "__id_chqpn6jlrw") REFERENCES "qti"."id_binding" ("__document_7pfajdbgba", "__id_phjuaybmt3") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."idref_target" VALIDATE CONSTRAINT "__idref_target_fk_document_id_eirp6y4xx3";

ALTER TABLE "qti"."inclusion" ADD CONSTRAINT "__inclusion_fk_node_parent_kind_places_root_splices_io4c4fmo5z" FOREIGN KEY ("node", "parent_kind", "places", "root", "splices", "version") REFERENCES "qti"."site_target" ("node", "parent_kind", "places", "target_root", "splices", "version") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."inclusion" VALIDATE CONSTRAINT "__inclusion_fk_node_parent_kind_places_root_splices_io4c4fmo5z";

ALTER TABLE "qti"."instance" ADD CONSTRAINT "__instance_fk_site_document_tag_places_true_4c4r57c3bc" FOREIGN KEY ("__site_hdx6niaggk", "__document_iu7n6ahln3", "__tag_places_true_fsuzemt64t") REFERENCES "qti"."site_target" ("node", "target", "places") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."instance" VALIDATE CONSTRAINT "__instance_fk_site_document_tag_places_true_4c4r57c3bc";

ALTER TABLE "qti"."item_ref_href" ADD CONSTRAINT "__item_ref_href_fk_node_pred_targets_thca2qpw5g" FOREIGN KEY ("node", "__pred_targets_c5nt4iqzuc") REFERENCES "qti"."item_ref_target" ("node", "__index_targets_4bfzj4widk") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_ref_href" VALIDATE CONSTRAINT "__item_ref_href_fk_node_pred_targets_thca2qpw5g";

ALTER TABLE "qti"."item_ref_target" VALIDATE CONSTRAINT "__item_ref_target_fk_node_copy_targets_ln5fobuske";

ALTER TABLE "qti"."item_ref_target" ADD CONSTRAINT "__item_ref_target_fk_node_predecessor_targets_lhswdxhi37" FOREIGN KEY ("node", "__predecessor_targets_vb2ate2sxf") REFERENCES "qti"."item_ref_target" ("node", "__index_targets_4bfzj4widk") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_ref_target" VALIDATE CONSTRAINT "__item_ref_target_fk_node_predecessor_targets_lhswdxhi37";

ALTER TABLE "qti"."resource_href" VALIDATE CONSTRAINT "__resource_href_fk_node_kv3zocm3jr";

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_fk_document_copy_targets_sbyhpzmwn2" FOREIGN KEY ("document", "__copy_targets_3sjjwdmfq5") REFERENCES "qti"."test_document" ("node", "targets") MATCH SIMPLE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."site_target" VALIDATE CONSTRAINT "__site_target_fk_document_copy_targets_sbyhpzmwn2";

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_fk_document_predecessor_targets_before_i4lqey67vn" FOREIGN KEY ("document", "__predecessor_targets_luepn467by", "__before_targets_0_fmlpvwa3pv") REFERENCES "qti"."site_target" ("document", "__index_targets_dhwvwcvgsf", "__after_targets_0_uzk4mcxzw5") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."site_target" VALIDATE CONSTRAINT "__site_target_fk_document_predecessor_targets_before_i4lqey67vn";

ALTER TABLE "qti"."test_document" ADD CONSTRAINT "__test_document_fk_node_pred_targets_sites_3qptivb5vp" FOREIGN KEY ("node", "__pred_targets_c5nt4iqzuc", "sites") REFERENCES "qti"."site_target" ("document", "__index_targets_dhwvwcvgsf", "__after_targets_0_uzk4mcxzw5") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."test_document" VALIDATE CONSTRAINT "__test_document_fk_node_pred_targets_sites_3qptivb5vp";

ALTER TABLE "qti"."unread_type_href" ADD CONSTRAINT "__unread_type_href_fk_node_package_path_jbja6jml3m" FOREIGN KEY ("node", "package", "path") REFERENCES "qti"."resource_href" ("node", "package", "path") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."unread_type_href" VALIDATE CONSTRAINT "__unread_type_href_fk_node_package_path_jbja6jml3m";
