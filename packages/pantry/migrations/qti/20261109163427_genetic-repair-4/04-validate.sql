ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_parent_kind_7wd5nidp2e" UNIQUE USING INDEX "__node_key_id_parent_kind_7wd5nidp2e";

ALTER TABLE "qti"."placed_variable_ref_declaration" ADD CONSTRAINT "__placed_variable_ref_declaration_key_instance_node_v4aamrq6mp" UNIQUE USING INDEX "__placed_variable_ref_declaration_key_instance_node_v4aamrq6mp";

ALTER TABLE "qti"."reading" VALIDATE CONSTRAINT "reference_type";

ALTER TABLE "qti"."placed_reference_type" ADD CONSTRAINT "__placed_reference_type_fk_instance_node_attribute_ap6khnlq5s" FOREIGN KEY ("instance", "node", "attribute", "kind", "declaration") REFERENCES "qti"."placed_variable_ref_declaration" ("instance", "node", "attribute", "kind", "declaration") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_reference_type" VALIDATE CONSTRAINT "__placed_reference_type_fk_instance_node_attribute_ap6khnlq5s";

ALTER TABLE "qti"."placed_reference_type" ADD CONSTRAINT "__placed_reference_type_fk_node_parent_kind_ca6h5ups56" FOREIGN KEY ("node", "parent_kind") REFERENCES "qti"."node" ("id", "parent_kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_reference_type" VALIDATE CONSTRAINT "__placed_reference_type_fk_node_parent_kind_ca6h5ups56";

ALTER TABLE "qti"."placed_variable_ref_declaration" VALIDATE CONSTRAINT "__placed_variable_ref_declaration_fk_declaration_tag_kb2nnityho";

ALTER TABLE "qti"."placed_variable_ref_declaration" VALIDATE CONSTRAINT "__placed_variable_ref_declaration_fk_declaration_tag_d6u2v7tdbc";
