ALTER TABLE "qti"."graphic_order_interaction" ADD CONSTRAINT "__graphic_order_interaction_key_id_max_choices_n_56wqkqd4dr" UNIQUE USING INDEX "__graphic_order_interaction_key_id_max_choices_n_56wqkqd4dr";

ALTER TABLE "qti"."graphic_order_interaction" ADD CONSTRAINT "__graphic_order_interaction_key_id_min_choices_n_nnxo4cdqlf" UNIQUE USING INDEX "__graphic_order_interaction_key_id_min_choices_n_nnxo4cdqlf";

ALTER TABLE "qti"."manifest_metadata" ADD CONSTRAINT "__manifest_metadata_key_id_manifest_7d6i2gp74r" UNIQUE USING INDEX "__manifest_metadata_key_id_manifest_7d6i2gp74r";

ALTER TABLE "qti"."order_interaction" ADD CONSTRAINT "__order_interaction_key_id_max_choices_n_rcuzyeukiw" UNIQUE USING INDEX "__order_interaction_key_id_max_choices_n_rcuzyeukiw";

ALTER TABLE "qti"."order_interaction" ADD CONSTRAINT "__order_interaction_key_id_min_choices_n_nhg3azb62y" UNIQUE USING INDEX "__order_interaction_key_id_min_choices_n_nhg3azb62y";

ALTER TABLE "qti"."graphic_order_min_choices_n" VALIDATE CONSTRAINT "graphic_order_min_choices_positive";

ALTER TABLE "qti"."order_min_choices_n" VALIDATE CONSTRAINT "order_min_choices_positive";

ALTER TABLE "qti"."graphic_order_max_choices_n" ADD CONSTRAINT "__graphic_order_max_choices_n_fk_node_value_o4n2djgsvx" FOREIGN KEY ("node", "value") REFERENCES "qti"."graphic_order_interaction" ("id", "max_choices_n") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."graphic_order_max_choices_n" VALIDATE CONSTRAINT "__graphic_order_max_choices_n_fk_node_value_o4n2djgsvx";

ALTER TABLE "qti"."graphic_order_min_choices_n" ADD CONSTRAINT "__graphic_order_min_choices_n_fk_node_value_42larqhgl3" FOREIGN KEY ("node", "value") REFERENCES "qti"."graphic_order_interaction" ("id", "min_choices_n") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."graphic_order_min_choices_n" VALIDATE CONSTRAINT "__graphic_order_min_choices_n_fk_node_value_42larqhgl3";

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_metadata_package_5yymt7fk7p" FOREIGN KEY ("metadata", "package") REFERENCES "qti"."manifest_metadata" ("id", "manifest") NOT VALID;

ALTER TABLE "qti"."manifest_schema_version" VALIDATE CONSTRAINT "__manifest_schema_version_fk_metadata_package_5yymt7fk7p";

ALTER TABLE "qti"."manifest_schema_version" VALIDATE CONSTRAINT "__manifest_schema_version_fk_package_version_sb3opk7jv2";

ALTER TABLE "qti"."order_max_choices_n" ADD CONSTRAINT "__order_max_choices_n_fk_node_value_5wtfbuf7it" FOREIGN KEY ("node", "value") REFERENCES "qti"."order_interaction" ("id", "max_choices_n") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."order_max_choices_n" VALIDATE CONSTRAINT "__order_max_choices_n_fk_node_value_5wtfbuf7it";

ALTER TABLE "qti"."order_min_choices_n" ADD CONSTRAINT "__order_min_choices_n_fk_node_value_qxku76qbit" FOREIGN KEY ("node", "value") REFERENCES "qti"."order_interaction" ("id", "min_choices_n") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."order_min_choices_n" VALIDATE CONSTRAINT "__order_min_choices_n_fk_node_value_qxku76qbit";
