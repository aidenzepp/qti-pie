-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__id_binding_key_document_id_owner_carriers_admitted_inddtnd2mu";

CREATE UNIQUE INDEX CONCURRENTLY "__id_binding_key_document_id_owner_carriers_admitted_inddtnd2mu" ON "qti"."id_binding" USING btree ("document", "id", "owner", "carriers", "admitted");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__id_binding_key_document_id_llzafs6ajp";

CREATE UNIQUE INDEX CONCURRENTLY "__id_binding_key_document_id_llzafs6ajp" ON "qti"."id_binding" USING btree ("__document_7pfajdbgba", "__id_phjuaybmt3");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__item_ref_target_key_node_index_targets_q2zfwgtqx3";

CREATE UNIQUE INDEX CONCURRENTLY "__item_ref_target_key_node_index_targets_q2zfwgtqx3" ON "qti"."item_ref_target" USING btree ("node", "__index_targets_4bfzj4widk");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_iyvasuyphs";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_iyvasuyphs" ON "qti"."node" USING btree ("__id_vefq5vxxrm");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_document_5tagtjbgoj";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_document_5tagtjbgoj" ON "qti"."node" USING btree ("__id_tyor4vdw5d", "__document_3cbls6hfyp");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_href_key_node_package_path_nzbzmdfqem";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_href_key_node_package_path_nzbzmdfqem" ON "qti"."resource_href" USING btree ("node", "package", "path");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__site_target_key_document_index_targets_ca4f46xghj";

CREATE UNIQUE INDEX CONCURRENTLY "__site_target_key_document_index_targets_ca4f46xghj" ON "qti"."site_target" USING btree ("document", "__index_targets_dhwvwcvgsf");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__site_target_key_document_index_targets_after_ahi4znzcjo";

CREATE UNIQUE INDEX CONCURRENTLY "__site_target_key_document_index_targets_after_ahi4znzcjo" ON "qti"."site_target" USING btree ("document", "__index_targets_dhwvwcvgsf", "__after_targets_0_uzk4mcxzw5");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__site_target_key_node_parent_kind_places_target_o2sl5j6mjr";

CREATE UNIQUE INDEX CONCURRENTLY "__site_target_key_node_parent_kind_places_target_o2sl5j6mjr" ON "qti"."site_target" USING btree ("node", "parent_kind", "places", "target_root", "splices", "version");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__site_target_key_node_target_places_3fxneelujg";

CREATE UNIQUE INDEX CONCURRENTLY "__site_target_key_node_target_places_3fxneelujg" ON "qti"."site_target" USING btree ("node", "target", "places");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__test_document_key_node_targets_qmxh2nyfxk";

CREATE UNIQUE INDEX CONCURRENTLY "__test_document_key_node_targets_qmxh2nyfxk" ON "qti"."test_document" USING btree ("node", "targets");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_id_ix_node_3_olzulnuu_3_document_7_hyy45w5uxu";

CREATE INDEX CONCURRENTLY "__document_id_ix_node_3_olzulnuu_3_document_7_hyy45w5uxu" ON "qti"."document_id" USING btree ("__node_3olzulnuu3", "__document_7pfajdbgba");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_id_ix_node_4_ck_2_w_6_ow_6_d_2idckzhju3";

CREATE INDEX CONCURRENTLY "__document_id_ix_node_4_ck_2_w_6_ow_6_d_2idckzhju3" ON "qti"."document_id" USING btree ("__node_4ck2w6ow6d");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_href_ix_node_bsayaavrlz_7qm5cf5e6w";

CREATE INDEX CONCURRENTLY "__resource_href_ix_node_bsayaavrlz_7qm5cf5e6w" ON "qti"."resource_href" USING btree ("__node_bsayaavrlz");
