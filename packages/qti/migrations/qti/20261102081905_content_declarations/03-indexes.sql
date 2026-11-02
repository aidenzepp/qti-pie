-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_version_6vx4nbp4ed";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_version_6vx4nbp4ed" ON "qti"."node" USING btree ("id", "version");
