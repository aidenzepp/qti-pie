ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_ancestry_fsdnbaszzt" UNIQUE USING INDEX "__node_key_id_ancestry_fsdnbaszzt";

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_tree_ancestry_zuqtimnsjh" UNIQUE USING INDEX "__node_key_id_tree_ancestry_zuqtimnsjh";

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_child_child_ancestry_5lghcs4zbj" FOREIGN KEY ("child", "child_ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."edge" VALIDATE CONSTRAINT "__edge_fk_child_child_ancestry_5lghcs4zbj";

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_parent_parent_ancestry_6rwshsalfn" FOREIGN KEY ("parent", "parent_ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."edge" VALIDATE CONSTRAINT "__edge_fk_parent_parent_ancestry_6rwshsalfn";

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_fk_node_tree_tag_ancestry_root_7_7simyjgiqk" FOREIGN KEY ("node", "tree", "__tag_ancestry_root_7ltbltwcre") REFERENCES "qti"."node" ("id", "tree", "ancestry") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."tree_root" VALIDATE CONSTRAINT "__tree_root_fk_node_tree_tag_ancestry_root_7_7simyjgiqk";
