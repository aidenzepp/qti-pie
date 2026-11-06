-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_m_degree_sphp3lfvsi";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_m_degree_sphp3lfvsi" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'm:degree'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_m_mprescripts_mk4gi3qd5k";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_m_mprescripts_mk4gi3qd5k" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'm:mprescripts'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_m_otherwise_6log7xkv36";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_m_otherwise_6log7xkv36" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'm:otherwise'::"qti"."node_kind";
