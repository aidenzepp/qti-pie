-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_parent_kind_7wd5nidp2e";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_parent_kind_7wd5nidp2e" ON "qti"."node" USING btree ("id", "parent_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__placed_variable_ref_declaration_key_instance_node_v4aamrq6mp";

CREATE UNIQUE INDEX CONCURRENTLY "__placed_variable_ref_declaration_key_instance_node_v4aamrq6mp" ON "qti"."placed_variable_ref_declaration" USING btree ("instance", "node", "attribute", "kind", "declaration");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__placed_variable_ref_declaration_ix_declaration_r2vnccylrq";

CREATE INDEX CONCURRENTLY "__placed_variable_ref_declaration_ix_declaration_r2vnccylrq" ON "qti"."placed_variable_ref_declaration" USING btree ("__declaration_tjmicd327x");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__placed_variable_ref_declaration_ix_declaration_y_3_zpns6slygz";

CREATE INDEX CONCURRENTLY "__placed_variable_ref_declaration_ix_declaration_y_3_zpns6slygz" ON "qti"."placed_variable_ref_declaration" USING btree ("__declaration_y3rrijdizl");
