-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__reference_ix_node_6_rmfntt_35_j_erkaurnkvr";

CREATE INDEX CONCURRENTLY "__reference_ix_node_6_rmfntt_35_j_erkaurnkvr" ON "qti"."reference" USING btree ("__node_6rmfntt35j");
