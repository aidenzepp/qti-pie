ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_key_id_package_s65zceexft" UNIQUE USING INDEX "__document_key_id_package_s65zceexft";

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_key_package_path_id_root_uefqwcznjn" UNIQUE USING INDEX "__document_key_package_path_id_root_uefqwcznjn";

ALTER TABLE "qti"."tree" ADD CONSTRAINT "__tree_key_id_root_xobalzbvek" UNIQUE USING INDEX "__tree_key_id_root_xobalzbvek";

ALTER TABLE "qti"."variable_ref" ADD CONSTRAINT "__variable_ref_key_id_document_qvmavfpldp" UNIQUE USING INDEX "__variable_ref_key_id_document_qvmavfpldp";

ALTER TABLE "qti"."variable_ref" ADD CONSTRAINT "__variable_ref_key_id_document_kind_sqkjkdlrd4" UNIQUE USING INDEX "__variable_ref_key_id_document_kind_sqkjkdlrd4";

ALTER TABLE "qti"."assessment_item_label" VALIDATE CONSTRAINT "assessment_item_label_root";

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "adaptive_feedback";

ALTER TABLE "qti"."item_tool" VALIDATE CONSTRAINT "item_tool_root";

ALTER TABLE "qti"."node_label" VALIDATE CONSTRAINT "node_label_not_root";

ALTER TABLE "qti"."rule_operand" VALIDATE CONSTRAINT "rule_operand_kind";

ALTER TABLE "qti"."x_include_parse" VALIDATE CONSTRAINT "x_include_parse_xml";

ALTER TABLE "qti"."assessment_item_label" ADD CONSTRAINT "__assessment_item_label_fk_tree_root_6dwmowvztk" FOREIGN KEY ("tree", "root") REFERENCES "qti"."tree" ("id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."assessment_item_label" VALIDATE CONSTRAINT "__assessment_item_label_fk_tree_root_6dwmowvztk";

ALTER TABLE "qti"."attribute_file_reference" ADD CONSTRAINT "__attribute_file_reference_fk_document_package_hpgjc7q5wa" FOREIGN KEY ("document", "package") REFERENCES "qti"."document" ("id", "package") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."attribute_file_reference" VALIDATE CONSTRAINT "__attribute_file_reference_fk_document_package_hpgjc7q5wa";

ALTER TABLE "qti"."item_instance_variable_ref" ADD CONSTRAINT "__item_instance_variable_ref_fk_id_document_xt5obcyyex" FOREIGN KEY ("id", "document") REFERENCES "qti"."variable_ref" ("id", "document") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_instance_variable_ref" VALIDATE CONSTRAINT "__item_instance_variable_ref_fk_id_document_xt5obcyyex";

ALTER TABLE "qti"."item_ref_document" ADD CONSTRAINT "__item_ref_document_fk_package_path_document_tag_g7fzwy3wnr" FOREIGN KEY ("package", "path", "document", "__tag_root_item_wlk5is6qw7") REFERENCES "qti"."document" ("package", "path", "id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_ref_document" VALIDATE CONSTRAINT "__item_ref_document_fk_package_path_document_tag_g7fzwy3wnr";

ALTER TABLE "qti"."item_tool" ADD CONSTRAINT "__item_tool_fk_tree_root_rm5pqjt3eq" FOREIGN KEY ("tree", "root") REFERENCES "qti"."tree" ("id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_tool" VALIDATE CONSTRAINT "__item_tool_fk_tree_root_rm5pqjt3eq";

ALTER TABLE "qti"."item_variable_ref" ADD CONSTRAINT "__item_variable_ref_fk_id_document_msbj54vwcn" FOREIGN KEY ("id", "document") REFERENCES "qti"."variable_ref" ("id", "document") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_variable_ref" VALIDATE CONSTRAINT "__item_variable_ref_fk_id_document_msbj54vwcn";

ALTER TABLE "qti"."prefixed_variable_source" ADD CONSTRAINT "__prefixed_variable_source_fk_ref_document_ref_kind_czgwgrhkow" FOREIGN KEY ("ref", "document", "ref_kind") REFERENCES "qti"."variable_ref" ("id", "document", "kind") NOT VALID;

ALTER TABLE "qti"."prefixed_variable_source" VALIDATE CONSTRAINT "__prefixed_variable_source_fk_ref_document_ref_kind_czgwgrhkow";

ALTER TABLE "qti"."section_duration_ref" ADD CONSTRAINT "__section_duration_ref_fk_id_document_66a5gknmm2" FOREIGN KEY ("id", "document") REFERENCES "qti"."variable_ref" ("id", "document") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."section_duration_ref" VALIDATE CONSTRAINT "__section_duration_ref_fk_id_document_66a5gknmm2";

ALTER TABLE "qti"."section_duration_target" ADD CONSTRAINT "__section_duration_target_fk_ref_document_ref_kind_qd42khjdia" FOREIGN KEY ("ref", "document", "ref_kind") REFERENCES "qti"."variable_ref" ("id", "document", "kind") NOT VALID;

ALTER TABLE "qti"."section_duration_target" VALIDATE CONSTRAINT "__section_duration_target_fk_ref_document_ref_kind_qd42khjdia";

ALTER TABLE "qti"."section_ref_resolution" ADD CONSTRAINT "__section_ref_resolution_fk_package_path_document_oopepaskg4" FOREIGN KEY ("package", "path", "document", "__tag_root_section_pd2d4gcywn") REFERENCES "qti"."document" ("package", "path", "id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."section_ref_resolution" VALIDATE CONSTRAINT "__section_ref_resolution_fk_package_path_document_oopepaskg4";

ALTER TABLE "qti"."section_variable_ref" ADD CONSTRAINT "__section_variable_ref_fk_id_document_irnnkqvd6a" FOREIGN KEY ("id", "document") REFERENCES "qti"."variable_ref" ("id", "document") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."section_variable_ref" VALIDATE CONSTRAINT "__section_variable_ref_fk_id_document_irnnkqvd6a";

ALTER TABLE "qti"."stimulus_ref_resolution" ADD CONSTRAINT "__stimulus_ref_resolution_fk_package_path_document_y2m5ujbqj2" FOREIGN KEY ("package", "path", "document", "__tag_root_stimulus_fnlqquajeh") REFERENCES "qti"."document" ("package", "path", "id", "root") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."stimulus_ref_resolution" VALIDATE CONSTRAINT "__stimulus_ref_resolution_fk_package_path_document_y2m5ujbqj2";
