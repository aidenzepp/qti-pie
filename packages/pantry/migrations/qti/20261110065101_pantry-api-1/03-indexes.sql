-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_rmoe3heakj";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_rmoe3heakj" ON "qti"."attribute" USING btree ("__node_kvvtz4aokl");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_name_vdtl6ykgf4";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_name_vdtl6ykgf4" ON "qti"."attribute" USING btree ("__node_tkkghc6lkk", "__name_olkikci4cm");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_53cd4wzjhe";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_53cd4wzjhe" ON "qti"."attribute" USING btree ("__node_k7q6ze3fvq");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_z3fpxb33wr";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_z3fpxb33wr" ON "qti"."attribute" USING btree ("__node_h7ktnl7tci");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_j3nl2tgoep";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_j3nl2tgoep" ON "qti"."attribute" USING btree ("__node_tblig6omlm");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_xtyjppptnf";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_xtyjppptnf" ON "qti"."attribute" USING btree ("__node_ienld3knlc");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_j5k5x63vk5";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_j5k5x63vk5" ON "qti"."attribute" USING btree ("__node_tsiudobb4f");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_cyiabcbfjg";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_cyiabcbfjg" ON "qti"."attribute" USING btree ("__node_aqtwqbqjlb");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_key_node_tsbrtp3osw";

CREATE UNIQUE INDEX CONCURRENTLY "__attribute_key_node_tsbrtp3osw" ON "qti"."attribute" USING btree ("__node_yp7qmbepyb");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_ix_node_33_s_7_pmc_6_eu_bjyanxc6as";

CREATE INDEX CONCURRENTLY "__attribute_ix_node_33_s_7_pmc_6_eu_bjyanxc6as" ON "qti"."attribute" USING btree ("__node_33s7pmc6eu");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_ix_node_45_br_23_k_7_lt_thwjoquopl";

CREATE INDEX CONCURRENTLY "__attribute_ix_node_45_br_23_k_7_lt_thwjoquopl" ON "qti"."attribute" USING btree ("__node_45br23k7lt");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_ix_node_6_qw_4_z_7_l_7_sv_3evoy7v43q";

CREATE INDEX CONCURRENTLY "__attribute_ix_node_6_qw_4_z_7_l_7_sv_3evoy7v43q" ON "qti"."attribute" USING btree ("__node_6qw4z7l7sv");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_ix_node_7_iuvvf_6_ijd_767bkvdhgt";

CREATE INDEX CONCURRENTLY "__attribute_ix_node_7_iuvvf_6_ijd_767bkvdhgt" ON "qti"."attribute" USING btree ("__node_7iuvvf6ijd");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_ix_node_qfrusbccpg_m6oxpykpwf";

CREATE INDEX CONCURRENTLY "__attribute_ix_node_qfrusbccpg_m6oxpykpwf" ON "qti"."attribute" USING btree ("__node_qfrusbccpg");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_ix_node_vakq_25_d_2_th_dq3p5mlkpj";

CREATE INDEX CONCURRENTLY "__attribute_ix_node_vakq_25_d_2_th_dq3p5mlkpj" ON "qti"."attribute" USING btree ("__node_vakq25d2th");
