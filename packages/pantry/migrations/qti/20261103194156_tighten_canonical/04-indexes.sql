-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__graphic_order_interaction_key_id_max_choices_n_56wqkqd4dr";

CREATE UNIQUE INDEX CONCURRENTLY "__graphic_order_interaction_key_id_max_choices_n_56wqkqd4dr" ON "qti"."graphic_order_interaction" USING btree ("id", "max_choices_n");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__graphic_order_interaction_key_id_min_choices_n_nnxo4cdqlf";

CREATE UNIQUE INDEX CONCURRENTLY "__graphic_order_interaction_key_id_min_choices_n_nnxo4cdqlf" ON "qti"."graphic_order_interaction" USING btree ("id", "min_choices_n");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__manifest_metadata_key_id_manifest_7d6i2gp74r";

CREATE UNIQUE INDEX CONCURRENTLY "__manifest_metadata_key_id_manifest_7d6i2gp74r" ON "qti"."manifest_metadata" USING btree ("id", "manifest");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__order_interaction_key_id_max_choices_n_rcuzyeukiw";

CREATE UNIQUE INDEX CONCURRENTLY "__order_interaction_key_id_max_choices_n_rcuzyeukiw" ON "qti"."order_interaction" USING btree ("id", "max_choices_n");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__order_interaction_key_id_min_choices_n_nhg3azb62y";

CREATE UNIQUE INDEX CONCURRENTLY "__order_interaction_key_id_min_choices_n_nhg3azb62y" ON "qti"."order_interaction" USING btree ("id", "min_choices_n");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__manifest_schema_version_ix_package_version_33bobfqced";

CREATE INDEX CONCURRENTLY "__manifest_schema_version_ix_package_version_33bobfqced" ON "qti"."manifest_schema_version" USING btree ("package", "version");
