-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_language_ix_lom_value_owner_resource_parent_bbl5vba5nx";

CREATE INDEX CONCURRENTLY "__lom_language_ix_lom_value_owner_resource_parent_bbl5vba5nx" ON "qti"."lom_language" USING btree ("lom", "value") WHERE "owner" = 'resource'::"qti"."lom_owner" AND "parent_kind" = 'lom:general'::"qti"."node_kind";
