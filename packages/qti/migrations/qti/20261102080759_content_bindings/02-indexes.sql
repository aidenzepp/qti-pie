-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__assessment_item_key_tree_adaptive_uq2v6gcy6w";

CREATE UNIQUE INDEX CONCURRENTLY "__assessment_item_key_tree_adaptive_uq2v6gcy6w" ON "qti"."assessment_item" USING btree ("tree", "adaptive");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__typed_binding_key_node_cardinality_5dkui4iiaq";

CREATE UNIQUE INDEX CONCURRENTLY "__typed_binding_key_node_cardinality_5dkui4iiaq" ON "qti"."typed_binding" USING btree ("node", "cardinality");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__interaction_binding_ix_document_adaptive_7q2wud3r7r";

CREATE INDEX CONCURRENTLY "__interaction_binding_ix_document_adaptive_7q2wud3r7r" ON "qti"."interaction_binding" USING btree ("document", "adaptive");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__record_binding_ix_interaction_kind_hc4ijcqlmb";

CREATE INDEX CONCURRENTLY "__record_binding_ix_interaction_kind_hc4ijcqlmb" ON "qti"."record_binding" USING btree ("interaction_kind");
