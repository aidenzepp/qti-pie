-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_child_parent_kind_jv6mposiie";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_child_parent_kind_jv6mposiie" ON "qti"."edge" USING btree ("child", "parent_kind");
