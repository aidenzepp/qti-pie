ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_key_id_package_resource_flponjq52v" UNIQUE USING INDEX "__document_key_id_package_resource_flponjq52v";

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_key_id_root_paefqkk7oi" UNIQUE USING INDEX "__document_key_id_root_paefqkk7oi";

ALTER TABLE "qti"."document_identifier" ADD CONSTRAINT "__document_identifier_key_document_value_gsikqhluke" UNIQUE USING INDEX "__document_identifier_key_document_value_gsikqhluke";

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_key_id_package_vf5ojq22ku" UNIQUE USING INDEX "__file_key_id_package_vf5ojq22ku";

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_key_node_tree_7hmixcsgnx" UNIQUE USING INDEX "__tree_root_key_node_tree_7hmixcsgnx";

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_key_tree_node_p4ufjrhbsm" UNIQUE USING INDEX "__tree_root_key_tree_node_p4ufjrhbsm";

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_document_tag_root_external_lom_dv_4373pl62ni" FOREIGN KEY ("document", "__tag_root_external_lom_dv2arbt3fq") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."external_lom" VALIDATE CONSTRAINT "__external_lom_fk_document_tag_root_external_lom_dv_4373pl62ni";

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_document_package_resource_34e33j4gxl" FOREIGN KEY ("document", "package", "resource") REFERENCES "qti"."document" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."external_lom" VALIDATE CONSTRAINT "__external_lom_fk_document_package_resource_34e33j4gxl";

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_document_lxir53wny7" FOREIGN KEY ("lom", "document") REFERENCES "qti"."tree_root" ("node", "tree") NOT VALID;

ALTER TABLE "qti"."external_lom" VALIDATE CONSTRAINT "__external_lom_fk_lom_document_lxir53wny7";

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_file_package_n7bbywq43y" FOREIGN KEY ("file", "package") REFERENCES "qti"."file" ("id", "package") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."file_lom" VALIDATE CONSTRAINT "__file_lom_fk_file_package_n7bbywq43y";

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_tag_root_outcomes_5_63a3qgu7b2" FOREIGN KEY ("document", "__tag_root_outcomes_5xb23aywsn") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."outcome_document" VALIDATE CONSTRAINT "__outcome_document_fk_document_tag_root_outcomes_5_63a3qgu7b2";

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_declaration_qtmk3xxqen" FOREIGN KEY ("document", "declaration") REFERENCES "qti"."tree_root" ("tree", "node") NOT VALID;

ALTER TABLE "qti"."outcome_document" VALIDATE CONSTRAINT "__outcome_document_fk_document_declaration_qtmk3xxqen";

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_identifier_v5jocpx7r5" FOREIGN KEY ("document", "identifier") REFERENCES "qti"."document_identifier" ("document", "value") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."outcome_document" VALIDATE CONSTRAINT "__outcome_document_fk_document_identifier_v5jocpx7r5";
