-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_ancestry_fsdnbaszzt";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_ancestry_fsdnbaszzt" ON "qti"."node" USING btree ("id", "ancestry");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_tree_ancestry_zuqtimnsjh";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_tree_ancestry_zuqtimnsjh" ON "qti"."node" USING btree ("id", "tree", "ancestry");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_ix_parent_parent_ancestry_olnfr2qkpz";

CREATE INDEX CONCURRENTLY "__edge_ix_parent_parent_ancestry_olnfr2qkpz" ON "qti"."edge" USING btree ("parent", "parent_ancestry");
