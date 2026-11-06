ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_kind_root_kind_auj5lu77u6" UNIQUE USING INDEX "__node_key_id_kind_root_kind_auj5lu77u6";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_prefix_root_kind_wttm3ae6s7" UNIQUE USING INDEX "__node_key_id_prefix_root_kind_wttm3ae6s7";

ALTER TABLE "qti"."foreign_attribute" ADD CONSTRAINT "__foreign_attribute_fk_node_kind_root_kind_mtavdgip4g" FOREIGN KEY ("node", "kind", "root_kind") REFERENCES "qti"."node" ("id", "kind", "root_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."foreign_attribute" VALIDATE CONSTRAINT "__foreign_attribute_fk_node_kind_root_kind_mtavdgip4g";

ALTER TABLE "qti"."foreign_element" ADD CONSTRAINT "__foreign_element_fk_id_prefix_root_kind_j4abj352de" FOREIGN KEY ("id", "prefix", "root_kind") REFERENCES "qti"."node" ("id", "prefix", "root_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."foreign_element" VALIDATE CONSTRAINT "__foreign_element_fk_id_prefix_root_kind_j4abj352de";
