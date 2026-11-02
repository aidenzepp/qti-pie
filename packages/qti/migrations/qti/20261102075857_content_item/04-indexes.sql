-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__assessment_item_key_tree_y2u4xlyz4l";

CREATE UNIQUE INDEX CONCURRENTLY "__assessment_item_key_tree_y2u4xlyz4l" ON "qti"."assessment_item" USING btree ("tree");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_tree_version_jtzq7sjwu7";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_tree_version_jtzq7sjwu7" ON "qti"."node" USING btree ("id", "tree", "version");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_language_ix_lom_owner_p6t4fo66ky";

CREATE INDEX CONCURRENTLY "__lom_language_ix_lom_owner_p6t4fo66ky" ON "qti"."lom_language" USING btree ("lom", "owner");
