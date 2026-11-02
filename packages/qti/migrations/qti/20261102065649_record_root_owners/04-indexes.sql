-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_key_id_package_resource_flponjq52v";

CREATE UNIQUE INDEX CONCURRENTLY "__document_key_id_package_resource_flponjq52v" ON "qti"."document" USING btree ("id", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_key_id_root_paefqkk7oi";

CREATE UNIQUE INDEX CONCURRENTLY "__document_key_id_root_paefqkk7oi" ON "qti"."document" USING btree ("id", "root");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_identifier_key_document_value_gsikqhluke";

CREATE UNIQUE INDEX CONCURRENTLY "__document_identifier_key_document_value_gsikqhluke" ON "qti"."document_identifier" USING btree ("document", "value");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__file_key_id_package_vf5ojq22ku";

CREATE UNIQUE INDEX CONCURRENTLY "__file_key_id_package_vf5ojq22ku" ON "qti"."file" USING btree ("id", "package");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__tree_root_key_node_tree_7hmixcsgnx";

CREATE UNIQUE INDEX CONCURRENTLY "__tree_root_key_node_tree_7hmixcsgnx" ON "qti"."tree_root" USING btree ("node", "tree");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__tree_root_key_tree_node_p4ufjrhbsm";

CREATE UNIQUE INDEX CONCURRENTLY "__tree_root_key_tree_node_p4ufjrhbsm" ON "qti"."tree_root" USING btree ("tree", "node");
