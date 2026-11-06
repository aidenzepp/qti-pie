-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_section_identifier_key_node_value_qn4jf744nv";

CREATE UNIQUE INDEX CONCURRENTLY "__expression_section_identifier_key_node_value_qn4jf744nv" ON "qti"."expression_section_identifier" USING btree ("node", "value");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__section_identifier_target_ix_node_identifier_qerb4krdbr";

CREATE INDEX CONCURRENTLY "__section_identifier_target_ix_node_identifier_qerb4krdbr" ON "qti"."section_identifier_target" USING btree ("node", "identifier");
