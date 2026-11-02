ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_key_id_package_resource_flponjq52v" UNIQUE USING INDEX "__document_key_id_package_resource_flponjq52v";

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_key_id_root_paefqkk7oi" UNIQUE USING INDEX "__document_key_id_root_paefqkk7oi";

ALTER TABLE "qti"."document_identifier" ADD CONSTRAINT "__document_identifier_key_document_value_gsikqhluke" UNIQUE USING INDEX "__document_identifier_key_document_value_gsikqhluke";

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_key_child_parent_kind_jv6mposiie" UNIQUE USING INDEX "__edge_key_child_parent_kind_jv6mposiie";

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_key_id_package_vf5ojq22ku" UNIQUE USING INDEX "__file_key_id_package_vf5ojq22ku";

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_key_id_lom_position_o2ij2ew774" UNIQUE USING INDEX "__lom_identifier_key_id_lom_position_o2ij2ew774";

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_key_identifier_apspsz6soo" UNIQUE USING INDEX "__lom_identifier_entry_key_identifier_apspsz6soo";

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx" UNIQUE USING INDEX "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx";

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_key_id_identifier_udumz3ewib" UNIQUE USING INDEX "__package_key_id_identifier_udumz3ewib";

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_key_id_host_fyvjheokoi" UNIQUE USING INDEX "__qti_metadata_key_id_host_fyvjheokoi";

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_key_id_package_resource_p622xz2moc" UNIQUE USING INDEX "__qti_metadata_key_id_package_resource_p622xz2moc";

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_key_package_resource_dwel7fxdsx" UNIQUE USING INDEX "__qti_metadata_key_package_resource_dwel7fxdsx";

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_key_id_package_identifier_jx53gsgn4j" UNIQUE USING INDEX "__resource_key_id_package_identifier_jx53gsgn4j";

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_key_lom_package_resource_fcuxpt7bmm" UNIQUE USING INDEX "__resource_lom_key_lom_package_resource_fcuxpt7bmm";

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_key_id_resource_o7kyjomlg6" UNIQUE USING INDEX "__resource_metadata_key_id_resource_o7kyjomlg6";

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_key_node_tree_7hmixcsgnx" UNIQUE USING INDEX "__tree_root_key_node_tree_7hmixcsgnx";

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_key_tree_node_p4ufjrhbsm" UNIQUE USING INDEX "__tree_root_key_tree_node_p4ufjrhbsm";

ALTER TABLE "qti"."lom_value" VALIDATE CONSTRAINT "lom_learning_resource_type";

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_document_tag_root_external_lom_dv_4373pl62ni" FOREIGN KEY ("document", "__tag_root_external_lom_dv2arbt3fq") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."external_lom" VALIDATE CONSTRAINT "__external_lom_fk_document_tag_root_external_lom_dv_4373pl62ni";

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_document_package_resource_34e33j4gxl" FOREIGN KEY ("document", "package", "resource") REFERENCES "qti"."document" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."external_lom" VALIDATE CONSTRAINT "__external_lom_fk_document_package_resource_34e33j4gxl";

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_document_lxir53wny7" FOREIGN KEY ("lom", "document") REFERENCES "qti"."tree_root" ("node", "tree") NOT VALID;

ALTER TABLE "qti"."external_lom" VALIDATE CONSTRAINT "__external_lom_fk_lom_document_lxir53wny7";

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_file_package_n7bbywq43y" FOREIGN KEY ("file", "package") REFERENCES "qti"."file" ("id", "package") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."file_lom" VALIDATE CONSTRAINT "__file_lom_fk_file_package_n7bbywq43y";

ALTER TABLE "qti"."lom_identifier" VALIDATE CONSTRAINT "__lom_identifier_fk_id_parent_position_rhykptsoqt";

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_identifier_lom_position_e55vucjji4" FOREIGN KEY ("identifier", "lom", "position") REFERENCES "qti"."lom_identifier" ("id", "lom", "position") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_identifier_catalog" VALIDATE CONSTRAINT "__lom_identifier_catalog_fk_identifier_lom_position_e55vucjji4";

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_identifier_lom_position_lfmicwzfum" FOREIGN KEY ("identifier", "lom", "position") REFERENCES "qti"."lom_identifier" ("id", "lom", "position") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_identifier_entry" VALIDATE CONSTRAINT "__lom_identifier_entry_fk_identifier_lom_position_lfmicwzfum";

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_identifier_lom_position_hgxmp4e6eg" FOREIGN KEY ("identifier", "lom", "position", "collapsed") REFERENCES "qti"."lom_identifier_entry" ("identifier", "lom", "position", "collapsed") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_object_identifier" VALIDATE CONSTRAINT "__lom_object_identifier_fk_identifier_lom_position_hgxmp4e6eg";

ALTER TABLE "qti"."lom_value" ADD CONSTRAINT "__lom_value_fk_id_parent_kind_k3ati6fakb" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_value" VALIDATE CONSTRAINT "__lom_value_fk_id_parent_kind_k3ati6fakb";

ALTER TABLE "qti"."manifest_id_of_manifest" ADD CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj" FOREIGN KEY ("package", "id") REFERENCES "qti"."package" ("id", "identifier") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."manifest_id_of_manifest" VALIDATE CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj";

ALTER TABLE "qti"."manifest_lom" VALIDATE CONSTRAINT "__manifest_lom_fk_lom_package_a6edccbozn";

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_tag_root_outcomes_5_63a3qgu7b2" FOREIGN KEY ("document", "__tag_root_outcomes_5xb23aywsn") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."outcome_document" VALIDATE CONSTRAINT "__outcome_document_fk_document_tag_root_outcomes_5_63a3qgu7b2";

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_declaration_qtmk3xxqen" FOREIGN KEY ("document", "declaration") REFERENCES "qti"."tree_root" ("tree", "node") NOT VALID;

ALTER TABLE "qti"."outcome_document" VALIDATE CONSTRAINT "__outcome_document_fk_document_declaration_qtmk3xxqen";

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_identifier_v5jocpx7r5" FOREIGN KEY ("document", "identifier") REFERENCES "qti"."document_identifier" ("document", "value") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."outcome_document" VALIDATE CONSTRAINT "__outcome_document_fk_document_identifier_v5jocpx7r5";

ALTER TABLE "qti"."package" VALIDATE CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc";

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_tag_host_5nxw2e6ygd" FOREIGN KEY ("id", "__tag_host_external_lom_zuf64srpbg") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_external_lom" VALIDATE CONSTRAINT "__qti_metadata_in_external_lom_fk_id_tag_host_5nxw2e6ygd";

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_package_45ujtyda4c" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_external_lom" VALIDATE CONSTRAINT "__qti_metadata_in_external_lom_fk_id_package_45ujtyda4c";

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_tag_host_metadata_st4rwzhkuc" FOREIGN KEY ("id", "__tag_host_metadata_knpb2q2kry") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_id_tag_host_metadata_st4rwzhkuc";

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_package_resource_wjxdq6kefq" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_id_package_resource_wjxdq6kefq";

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_metadata_resource_node_j5b44sxf4o" FOREIGN KEY ("metadata", "resource_node") REFERENCES "qti"."resource_metadata" ("id", "resource") NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_metadata_resource_node_j5b44sxf4o";

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_resource_node_package_bwtvi3p7ra" FOREIGN KEY ("resource_node", "package", "resource") REFERENCES "qti"."resource" ("id", "package", "identifier") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_resource_node_package_bwtvi3p7ra";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_tag_host_pymrpdifeo" FOREIGN KEY ("id", "__tag_host_resource_lom_vu3w7ocz2u") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_tag_host_pymrpdifeo";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_package_gmcsikj4sm" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_package_gmcsikj4sm";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_lom_package_56adstemff" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_lom_package_56adstemff";

ALTER TABLE "qti"."resource" VALIDATE CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv";

ALTER TABLE "qti"."resource_lom" VALIDATE CONSTRAINT "__resource_lom_fk_lom_package_z2mqb4ohk3";

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_document_tag_root_usagedata_kjac_3_3yy4v3yjfw" FOREIGN KEY ("document", "__tag_root_usagedata_kjac3nie2g") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."usage_data" VALIDATE CONSTRAINT "__usage_data_fk_document_tag_root_usagedata_kjac_3_3yy4v3yjfw";

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_id_document_twpu2pvfe2" FOREIGN KEY ("id", "document") REFERENCES "qti"."tree_root" ("node", "tree") NOT VALID;

ALTER TABLE "qti"."usage_data" VALIDATE CONSTRAINT "__usage_data_fk_id_document_twpu2pvfe2";

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu" FOREIGN KEY ("resource", "package", "resource_identifier") REFERENCES "qti"."resource" ("id", "package", "identifier") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."variant" VALIDATE CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu";
