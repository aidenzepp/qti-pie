-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__assessment_item_key_tree_y2u4xlyz4l";

CREATE UNIQUE INDEX CONCURRENTLY "__assessment_item_key_tree_y2u4xlyz4l" ON "qti"."assessment_item" USING btree ("tree");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__assessment_item_key_tree_adaptive_uq2v6gcy6w";

CREATE UNIQUE INDEX CONCURRENTLY "__assessment_item_key_tree_adaptive_uq2v6gcy6w" ON "qti"."assessment_item" USING btree ("tree", "adaptive");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_ancestry_fsdnbaszzt";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_ancestry_fsdnbaszzt" ON "qti"."node" USING btree ("id", "ancestry");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_tree_ancestry_zuqtimnsjh";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_tree_ancestry_zuqtimnsjh" ON "qti"."node" USING btree ("id", "tree", "ancestry");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_tree_root_kind_dm7x2qc7ni";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_tree_root_kind_dm7x2qc7ni" ON "qti"."node" USING btree ("id", "tree", "root_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_tree_version_jtzq7sjwu7";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_tree_version_jtzq7sjwu7" ON "qti"."node" USING btree ("id", "tree", "version");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_version_6vx4nbp4ed";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_version_6vx4nbp4ed" ON "qti"."node" USING btree ("id", "version");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__typed_binding_key_node_cardinality_5dkui4iiaq";

CREATE UNIQUE INDEX CONCURRENTLY "__typed_binding_key_node_cardinality_5dkui4iiaq" ON "qti"."typed_binding" USING btree ("node", "cardinality");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__typed_declaration_key_id_base_type_t4fk2utvgg";

CREATE UNIQUE INDEX CONCURRENTLY "__typed_declaration_key_id_base_type_t4fk2utvgg" ON "qti"."typed_declaration" USING btree ("id", "base_type");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__typed_declaration_key_id_cardinality_kanzf7btjn";

CREATE UNIQUE INDEX CONCURRENTLY "__typed_declaration_key_id_cardinality_kanzf7btjn" ON "qti"."typed_declaration" USING btree ("id", "cardinality");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_caption_g4632cnutx";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_caption_g4632cnutx" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'caption'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_img_hizgmsur3h";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_img_hizgmsur3h" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'img'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_summary_gcdnyfgmod";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_summary_gcdnyfgmod" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'summary'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_tfoot_iuhmcz3spr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_tfoot_iuhmcz3spr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'tfoot'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_thead_d6l4jyggvu";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_thead_d6l4jyggvu" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'thead'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_lexical_ix_kind_attribute_7hgb4uv7ab";

CREATE INDEX CONCURRENTLY "__attribute_lexical_ix_kind_attribute_7hgb4uv7ab" ON "qti"."attribute_lexical" USING btree ("kind", "attribute");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_ix_parent_parent_ancestry_olnfr2qkpz";

CREATE INDEX CONCURRENTLY "__edge_ix_parent_parent_ancestry_olnfr2qkpz" ON "qti"."edge" USING btree ("parent", "parent_ancestry");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_ix_parent_ancestry_parent_kind_child_ancestry_krp7hvveq7";

CREATE INDEX CONCURRENTLY "__edge_ix_parent_ancestry_parent_kind_child_ancestry_krp7hvveq7" ON "qti"."edge" USING btree ("parent_ancestry", "parent_kind", "child_ancestry");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__interaction_binding_ix_document_adaptive_7q2wud3r7r";

CREATE INDEX CONCURRENTLY "__interaction_binding_ix_document_adaptive_7q2wud3r7r" ON "qti"."interaction_binding" USING btree ("document", "adaptive");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_language_ix_lom_owner_p6t4fo66ky";

CREATE INDEX CONCURRENTLY "__lom_language_ix_lom_owner_p6t4fo66ky" ON "qti"."lom_language" USING btree ("lom", "owner");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_language_ix_lom_value_owner_resource_parent_bbl5vba5nx";

CREATE INDEX CONCURRENTLY "__lom_language_ix_lom_value_owner_resource_parent_bbl5vba5nx" ON "qti"."lom_language" USING btree ("lom", "value") WHERE "owner" = 'resource'::"qti"."lom_owner" AND "parent_kind" = 'lom:general'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_ix_ancestry_kind_zxfhf2mtks";

CREATE INDEX CONCURRENTLY "__node_ix_ancestry_kind_zxfhf2mtks" ON "qti"."node" USING btree ("ancestry", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__record_binding_ix_interaction_kind_hc4ijcqlmb";

CREATE INDEX CONCURRENTLY "__record_binding_ix_interaction_kind_hc4ijcqlmb" ON "qti"."record_binding" USING btree ("interaction_kind");
