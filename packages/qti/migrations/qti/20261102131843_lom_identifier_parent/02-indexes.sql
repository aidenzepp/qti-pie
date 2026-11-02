-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_key_id_lom_position_o2ij2ew774";

CREATE UNIQUE INDEX CONCURRENTLY "__lom_identifier_key_id_lom_position_o2ij2ew774" ON "qti"."lom_identifier" USING btree ("id", "lom", "position");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_entry_key_identifier_apspsz6soo";

CREATE UNIQUE INDEX CONCURRENTLY "__lom_identifier_entry_key_identifier_apspsz6soo" ON "qti"."lom_identifier_entry" USING btree ("identifier");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx";

CREATE UNIQUE INDEX CONCURRENTLY "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx" ON "qti"."lom_identifier_entry" USING btree ("identifier", "lom", "position", "collapsed");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_catalog_ix_identifier_lom_position_qdd3e3w32x";

CREATE INDEX CONCURRENTLY "__lom_identifier_catalog_ix_identifier_lom_position_qdd3e3w32x" ON "qti"."lom_identifier_catalog" USING btree ("identifier", "lom", "position");
