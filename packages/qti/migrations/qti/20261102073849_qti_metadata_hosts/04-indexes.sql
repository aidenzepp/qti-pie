-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__external_lom_key_lom_package_resource_tjboenutnb";

CREATE UNIQUE INDEX CONCURRENTLY "__external_lom_key_lom_package_resource_tjboenutnb" ON "qti"."external_lom" USING btree ("lom", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_key_id_host_fyvjheokoi";

CREATE UNIQUE INDEX CONCURRENTLY "__qti_metadata_key_id_host_fyvjheokoi" ON "qti"."qti_metadata" USING btree ("id", "host");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_key_id_package_resource_p622xz2moc";

CREATE UNIQUE INDEX CONCURRENTLY "__qti_metadata_key_id_package_resource_p622xz2moc" ON "qti"."qti_metadata" USING btree ("id", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_key_package_resource_dwel7fxdsx";

CREATE UNIQUE INDEX CONCURRENTLY "__qti_metadata_key_package_resource_dwel7fxdsx" ON "qti"."qti_metadata" USING btree ("package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_lom_key_lom_package_resource_fcuxpt7bmm";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_lom_key_lom_package_resource_fcuxpt7bmm" ON "qti"."resource_lom" USING btree ("lom", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_metadata_key_id_resource_o7kyjomlg6";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_metadata_key_id_resource_o7kyjomlg6" ON "qti"."resource_metadata" USING btree ("id", "resource");
