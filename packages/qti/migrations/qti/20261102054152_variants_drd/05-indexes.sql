-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__package_key_id_identifier_udumz3ewib";

CREATE UNIQUE INDEX CONCURRENTLY "__package_key_id_identifier_udumz3ewib" ON "qti"."package" USING btree ("id", "identifier");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_key_id_package_identifier_jx53gsgn4j";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_key_id_package_identifier_jx53gsgn4j" ON "qti"."resource" USING btree ("id", "package", "identifier");
