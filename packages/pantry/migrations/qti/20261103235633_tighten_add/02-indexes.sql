-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__equal_rounded_key_id_figures_kind_5daytp3gkx";

CREATE UNIQUE INDEX CONCURRENTLY "__equal_rounded_key_id_figures_kind_5daytp3gkx" ON "qti"."equal_rounded" USING btree ("id", "figures_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__index_key_id_n_kind_azdqp2nm22";

CREATE UNIQUE INDEX CONCURRENTLY "__index_key_id_n_kind_azdqp2nm22" ON "qti"."index" USING btree ("id", "n_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__repeat_key_id_number_repeats_kind_fgy42qpbe4";

CREATE UNIQUE INDEX CONCURRENTLY "__repeat_key_id_number_repeats_kind_fgy42qpbe4" ON "qti"."repeat" USING btree ("id", "number_repeats_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__round_to_key_id_figures_kind_t7oyey7upw";

CREATE UNIQUE INDEX CONCURRENTLY "__round_to_key_id_figures_kind_t7oyey7upw" ON "qti"."round_to" USING btree ("id", "figures_kind");
