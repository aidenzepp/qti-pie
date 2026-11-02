ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_key_tree_y2u4xlyz4l" UNIQUE USING INDEX "__assessment_item_key_tree_y2u4xlyz4l";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_tree_version_jtzq7sjwu7" UNIQUE USING INDEX "__node_key_id_tree_version_jtzq7sjwu7";

ALTER TABLE "qti"."assessment_item" VALIDATE CONSTRAINT "__assessment_item_fk_id_tree_iolxqdwgug";

ALTER TABLE "qti"."assessment_item_label" ADD CONSTRAINT "__assessment_item_label_fk_node_tree_version_22qexjbdet" FOREIGN KEY ("node", "tree", "version") REFERENCES "qti"."node" ("id", "tree", "version") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."assessment_item_label" VALIDATE CONSTRAINT "__assessment_item_label_fk_node_tree_version_22qexjbdet";

ALTER TABLE "qti"."item_tool" ADD CONSTRAINT "__item_tool_fk_tree_awvhaigtwv" FOREIGN KEY ("tree") REFERENCES "qti"."assessment_item" ("tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_tool" VALIDATE CONSTRAINT "__item_tool_fk_tree_awvhaigtwv";

ALTER TABLE "qti"."lom_language" VALIDATE CONSTRAINT "__lom_language_fk_lom_owner_n4lsd3gxmo";
