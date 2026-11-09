-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__choice_key_node_kind_tid3vkbmg6";

CREATE UNIQUE INDEX CONCURRENTLY "__choice_key_node_kind_tid3vkbmg6" ON "qti"."choice" USING btree ("node", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__choice_interaction_key_node_interaction_lkjg3yj2vm";

CREATE UNIQUE INDEX CONCURRENTLY "__choice_interaction_key_node_interaction_lkjg3yj2vm" ON "qti"."choice_interaction" USING btree ("node", "interaction");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__interaction_key_node_gaps_ifbiyhopan";

CREATE UNIQUE INDEX CONCURRENTLY "__interaction_key_node_gaps_ifbiyhopan" ON "qti"."interaction" USING btree ("node", "gaps");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__binding_cardinality_ix_node_gaps_eluuu3gpyj";

CREATE INDEX CONCURRENTLY "__binding_cardinality_ix_node_gaps_eluuu3gpyj" ON "qti"."binding_cardinality" USING btree ("node", "gaps");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__choice_ix_node_zseimxjpkj_r6ugl4psth";

CREATE INDEX CONCURRENTLY "__choice_ix_node_zseimxjpkj_r6ugl4psth" ON "qti"."choice" USING btree ("__node_zseimxjpkj");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__placed_binding_cardinality_ix_node_gaps_gddkeypr4m";

CREATE INDEX CONCURRENTLY "__placed_binding_cardinality_ix_node_gaps_gddkeypr4m" ON "qti"."placed_binding_cardinality" USING btree ("node", "gaps");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__site_ix_node_ivjo_2_r_5_kcj_qcullefqon";

CREATE INDEX CONCURRENTLY "__site_ix_node_ivjo_2_r_5_kcj_qcullefqon" ON "qti"."site" USING btree ("__node_ivjo2r5kcj");
