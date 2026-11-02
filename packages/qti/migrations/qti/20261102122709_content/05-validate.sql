ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_key_id_package_resource_flponjq52v" UNIQUE USING INDEX "__document_key_id_package_resource_flponjq52v";

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_key_child_parent_kind_jv6mposiie" UNIQUE USING INDEX "__edge_key_child_parent_kind_jv6mposiie";

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_key_document_id_kind_mqib2r43zi" UNIQUE USING INDEX "__html_id_key_document_id_kind_mqib2r43zi";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_tree_root_kind_dm7x2qc7ni" UNIQUE USING INDEX "__node_key_id_tree_root_kind_dm7x2qc7ni";

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_key_lom_package_resource_fcuxpt7bmm" UNIQUE USING INDEX "__resource_lom_key_lom_package_resource_fcuxpt7bmm";

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_key_id_base_type_t4fk2utvgg" UNIQUE USING INDEX "__typed_declaration_key_id_base_type_t4fk2utvgg";

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_key_id_cardinality_kanzf7btjn" UNIQUE USING INDEX "__typed_declaration_key_id_cardinality_kanzf7btjn";

ALTER TABLE "qti"."html_id" VALIDATE CONSTRAINT "html_id_attribute";

ALTER TABLE "qti"."area_mapping" ADD CONSTRAINT "__area_mapping_fk_declaration_tag_base_type_point_t_nfqlbbrrel" FOREIGN KEY ("declaration", "__tag_base_type_point_t72vrgkw7u") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."area_mapping" VALIDATE CONSTRAINT "__area_mapping_fk_declaration_tag_base_type_point_t_nfqlbbrrel";

ALTER TABLE "qti"."associable_hotspot" ADD CONSTRAINT "__associable_hotspot_fk_id_parent_kind_dgxqwosap2" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."associable_hotspot" VALIDATE CONSTRAINT "__associable_hotspot_fk_id_parent_kind_dgxqwosap2";

ALTER TABLE "qti"."attribute_lexical" VALIDATE CONSTRAINT "__attribute_lexical_fk_kind_attribute_njhegw4vhu";

ALTER TABLE "qti"."document_lang" ADD CONSTRAINT "__document_lang_fk_document_package_resource_lbo3acms5b" FOREIGN KEY ("document", "package", "resource") REFERENCES "qti"."document" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."document_lang" VALIDATE CONSTRAINT "__document_lang_fk_document_package_resource_lbo3acms5b";

ALTER TABLE "qti"."edge" VALIDATE CONSTRAINT "__edge_fk_parent_ancestry_parent_kind_child_ancestry_3a4njwadrv";

ALTER TABLE "qti"."headers_target" ADD CONSTRAINT "__headers_target_fk_document_target_tag_kind_th_c7wmmvrvqc" FOREIGN KEY ("document", "target", "__tag_kind_th_wpezcjlql2") REFERENCES "qti"."html_id" ("document", "id", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."headers_target" VALIDATE CONSTRAINT "__headers_target_fk_document_target_tag_kind_th_c7wmmvrvqc";

ALTER TABLE "qti"."html_id" VALIDATE CONSTRAINT "__html_id_fk_kind_attribute_7yhgrjvv32";

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_tag_cardinality_23mmjy5chx" FOREIGN KEY ("declaration", "__tag_cardinality_single_b63ah65un6") REFERENCES "qti"."typed_declaration" ("id", "cardinality") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."interpolation_table" VALIDATE CONSTRAINT "__interpolation_table_fk_declaration_tag_cardinality_23mmjy5chx";

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_base_type_yl3o3v6xal" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."interpolation_table" VALIDATE CONSTRAINT "__interpolation_table_fk_declaration_base_type_yl3o3v6xal";

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_declaration_base_type_m4w4lsqkuv" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."mapping" VALIDATE CONSTRAINT "__mapping_fk_declaration_base_type_m4w4lsqkuv";

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_tag_cardinality_single_oihcqdanzo" FOREIGN KEY ("declaration", "__tag_cardinality_single_b63ah65un6") REFERENCES "qti"."typed_declaration" ("id", "cardinality") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."match_table" VALIDATE CONSTRAINT "__match_table_fk_declaration_tag_cardinality_single_oihcqdanzo";

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_base_type_dzx2yxytuu" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."match_table" VALIDATE CONSTRAINT "__match_table_fk_declaration_base_type_dzx2yxytuu";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_ancestry_kind_hndoexzrnu";

ALTER TABLE "qti"."node_label" ADD CONSTRAINT "__node_label_fk_node_tree_root_kind_3p43n6wrno" FOREIGN KEY ("node", "tree", "root_kind") REFERENCES "qti"."node" ("id", "tree", "root_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."node_label" VALIDATE CONSTRAINT "__node_label_fk_node_tree_root_kind_3p43n6wrno";

ALTER TABLE "qti"."node_xml_lang" ADD CONSTRAINT "__node_xml_lang_fk_node_tree_root_kind_vaogyjcme3" FOREIGN KEY ("node", "tree", "root_kind") REFERENCES "qti"."node" ("id", "tree", "root_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."node_xml_lang" VALIDATE CONSTRAINT "__node_xml_lang_fk_node_tree_root_kind_vaogyjcme3";

ALTER TABLE "qti"."resource_lom_general" ADD CONSTRAINT "__resource_lom_general_fk_lom_package_resource_xkjtdlbhgo" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."resource_lom_general" VALIDATE CONSTRAINT "__resource_lom_general_fk_lom_package_resource_xkjtdlbhgo";

ALTER TABLE "qti"."resource_lom_language_set" ADD CONSTRAINT "__resource_lom_language_set_fk_lom_package_resource_outjuw2j4n" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."resource_lom_language_set" VALIDATE CONSTRAINT "__resource_lom_language_set_fk_lom_package_resource_outjuw2j4n";

ALTER TABLE "qti"."source" ADD CONSTRAINT "__source_fk_id_parent_kind_pk5mr3sixt" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."source" VALIDATE CONSTRAINT "__source_fk_id_parent_kind_pk5mr3sixt";
