-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_kind_root_kind_auj5lu77u6";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_kind_root_kind_auj5lu77u6" ON "qti"."node" USING btree ("id", "kind", "root_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_prefix_root_kind_wttm3ae6s7";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_prefix_root_kind_wttm3ae6s7" ON "qti"."node" USING btree ("id", "prefix", "root_kind");
