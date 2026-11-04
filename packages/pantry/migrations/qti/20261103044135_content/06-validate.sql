ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_key_tree_y2u4xlyz4l" UNIQUE USING INDEX "__assessment_item_key_tree_y2u4xlyz4l";

ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_key_tree_adaptive_uq2v6gcy6w" UNIQUE USING INDEX "__assessment_item_key_tree_adaptive_uq2v6gcy6w";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_ancestry_fsdnbaszzt" UNIQUE USING INDEX "__node_key_id_ancestry_fsdnbaszzt";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_tree_ancestry_zuqtimnsjh" UNIQUE USING INDEX "__node_key_id_tree_ancestry_zuqtimnsjh";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_tree_root_kind_dm7x2qc7ni" UNIQUE USING INDEX "__node_key_id_tree_root_kind_dm7x2qc7ni";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_tree_version_jtzq7sjwu7" UNIQUE USING INDEX "__node_key_id_tree_version_jtzq7sjwu7";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_version_6vx4nbp4ed" UNIQUE USING INDEX "__node_key_id_version_6vx4nbp4ed";

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_key_node_cardinality_5dkui4iiaq" UNIQUE USING INDEX "__typed_binding_key_node_cardinality_5dkui4iiaq";

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_key_id_base_type_t4fk2utvgg" UNIQUE USING INDEX "__typed_declaration_key_id_base_type_t4fk2utvgg";

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_key_id_cardinality_kanzf7btjn" UNIQUE USING INDEX "__typed_declaration_key_id_cardinality_kanzf7btjn";

ALTER DOMAIN "qti"."__text_gubl3xpcnx" VALIDATE CONSTRAINT "check";

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "adaptive_feedback";

ALTER TABLE "qti"."typed_declaration" VALIDATE CONSTRAINT "reserved_outcome_types";

ALTER TABLE "qti"."area_mapping" ADD CONSTRAINT "__area_mapping_fk_declaration_tag_base_type_point_t_nfqlbbrrel" FOREIGN KEY ("declaration", "__tag_base_type_point_t72vrgkw7u") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."area_mapping" VALIDATE CONSTRAINT "__area_mapping_fk_declaration_tag_base_type_point_t_nfqlbbrrel";

ALTER TABLE "qti"."assessment_item" VALIDATE CONSTRAINT "__assessment_item_fk_id_tree_iolxqdwgug";

ALTER TABLE "qti"."assessment_item_label" ADD CONSTRAINT "__assessment_item_label_fk_node_tree_version_22qexjbdet" FOREIGN KEY ("node", "tree", "version") REFERENCES "qti"."node" ("id", "tree", "version") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."assessment_item_label" VALIDATE CONSTRAINT "__assessment_item_label_fk_node_tree_version_22qexjbdet";

ALTER TABLE "qti"."attribute_lexical" VALIDATE CONSTRAINT "__attribute_lexical_fk_kind_attribute_njhegw4vhu";

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_version_xq447tijbf" FOREIGN KEY ("id", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."context_declaration_arm" VALIDATE CONSTRAINT "__context_declaration_arm_fk_id_version_xq447tijbf";

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_child_child_ancestry_5lghcs4zbj" FOREIGN KEY ("child", "child_ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."edge" VALIDATE CONSTRAINT "__edge_fk_child_child_ancestry_5lghcs4zbj";

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_parent_parent_ancestry_6rwshsalfn" FOREIGN KEY ("parent", "parent_ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."edge" VALIDATE CONSTRAINT "__edge_fk_parent_parent_ancestry_6rwshsalfn";

ALTER TABLE "qti"."edge" VALIDATE CONSTRAINT "__edge_fk_parent_ancestry_parent_kind_child_ancestry_3a4njwadrv";

ALTER TABLE "qti"."gap_match_binding" ADD CONSTRAINT "__gap_match_binding_fk_node_cardinality_cnq3pufch4" FOREIGN KEY ("node", "cardinality") REFERENCES "qti"."typed_binding" ("node", "cardinality") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."gap_match_binding" VALIDATE CONSTRAINT "__gap_match_binding_fk_node_cardinality_cnq3pufch4";

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_document_adaptive_7gj3j45p4n" FOREIGN KEY ("document", "adaptive") REFERENCES "qti"."assessment_item" ("tree", "adaptive") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "__interaction_binding_fk_document_adaptive_7gj3j45p4n";

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_node_ancestry_gxhxoppump" FOREIGN KEY ("node", "ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "__interaction_binding_fk_node_ancestry_gxhxoppump";

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_tag_cardinality_23mmjy5chx" FOREIGN KEY ("declaration", "__tag_cardinality_single_b63ah65un6") REFERENCES "qti"."typed_declaration" ("id", "cardinality") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."interpolation_table" VALIDATE CONSTRAINT "__interpolation_table_fk_declaration_tag_cardinality_23mmjy5chx";

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_base_type_yl3o3v6xal" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."interpolation_table" VALIDATE CONSTRAINT "__interpolation_table_fk_declaration_base_type_yl3o3v6xal";

ALTER TABLE "qti"."item_tool" ADD CONSTRAINT "__item_tool_fk_tree_awvhaigtwv" FOREIGN KEY ("tree") REFERENCES "qti"."assessment_item" ("tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_tool" VALIDATE CONSTRAINT "__item_tool_fk_tree_awvhaigtwv";

ALTER TABLE "qti"."lom_language" VALIDATE CONSTRAINT "__lom_language_fk_id_parent_kind_avtlxpj6rc";

ALTER TABLE "qti"."lom_language" VALIDATE CONSTRAINT "__lom_language_fk_lom_owner_n4lsd3gxmo";

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_declaration_base_type_m4w4lsqkuv" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."mapping" VALIDATE CONSTRAINT "__mapping_fk_declaration_base_type_m4w4lsqkuv";

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_tag_cardinality_single_oihcqdanzo" FOREIGN KEY ("declaration", "__tag_cardinality_single_b63ah65un6") REFERENCES "qti"."typed_declaration" ("id", "cardinality") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."match_table" VALIDATE CONSTRAINT "__match_table_fk_declaration_tag_cardinality_single_oihcqdanzo";

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_base_type_dzx2yxytuu" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."match_table" VALIDATE CONSTRAINT "__match_table_fk_declaration_base_type_dzx2yxytuu";

ALTER TABLE "qti"."modal_feedback" ADD CONSTRAINT "__modal_feedback_fk_id_version_okclkcbsak" FOREIGN KEY ("id", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."modal_feedback" VALIDATE CONSTRAINT "__modal_feedback_fk_id_version_okclkcbsak";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "__node_fk_ancestry_kind_hndoexzrnu";

ALTER TABLE "qti"."node_label" ADD CONSTRAINT "__node_label_fk_node_tree_root_kind_3p43n6wrno" FOREIGN KEY ("node", "tree", "root_kind") REFERENCES "qti"."node" ("id", "tree", "root_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."node_label" VALIDATE CONSTRAINT "__node_label_fk_node_tree_root_kind_3p43n6wrno";

ALTER TABLE "qti"."node_xml_lang" ADD CONSTRAINT "__node_xml_lang_fk_node_tree_root_kind_vaogyjcme3" FOREIGN KEY ("node", "tree", "root_kind") REFERENCES "qti"."node" ("id", "tree", "root_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."node_xml_lang" VALIDATE CONSTRAINT "__node_xml_lang_fk_node_tree_root_kind_vaogyjcme3";

ALTER TABLE "qti"."record_binding" VALIDATE CONSTRAINT "__record_binding_fk_interaction_kind_lxuzwecsd5";

ALTER TABLE "qti"."track_default" ADD CONSTRAINT "__track_default_fk_node_version_6jcknduqqr" FOREIGN KEY ("node", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."track_default" VALIDATE CONSTRAINT "__track_default_fk_node_version_6jcknduqqr";

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_fk_node_tree_tag_ancestry_root_7_7simyjgiqk" FOREIGN KEY ("node", "tree", "__tag_ancestry_root_7ltbltwcre") REFERENCES "qti"."node" ("id", "tree", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."tree_root" VALIDATE CONSTRAINT "__tree_root_fk_node_tree_tag_ancestry_root_7_7simyjgiqk";

ALTER TABLE "qti"."typed_declaration" VALIDATE CONSTRAINT "__typed_declaration_fk_id_kind_wxilruvjz2";
