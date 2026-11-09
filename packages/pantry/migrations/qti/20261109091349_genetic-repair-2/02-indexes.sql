-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_xtyjppptnf";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_xtyjppptnf" ON "qti"."attribute" USING btree ("__node_ienld3knlc");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__dependency_key_node_lexical_4z3dmo5v37";

CREATE UNIQUE INDEX CONCURRENTLY "__dependency_key_node_lexical_4z3dmo5v37" ON "qti"."dependency" USING btree ("node", "lexical");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__manifest_id_key_node_lexical_f6fcfc24vi";

CREATE UNIQUE INDEX CONCURRENTLY "__manifest_id_key_node_lexical_f6fcfc24vi" ON "qti"."manifest_id" USING btree ("node", "lexical");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_id_key_node_lexical_hd5iwhn37m";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_id_key_node_lexical_hd5iwhn37m" ON "qti"."resource_id" USING btree ("node", "lexical");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_ix_node_qfrusbccpg_m6oxpykpwf";

CREATE INDEX CONCURRENTLY "__attribute_ix_node_qfrusbccpg_m6oxpykpwf" ON "qti"."attribute" USING btree ("__node_qfrusbccpg");
