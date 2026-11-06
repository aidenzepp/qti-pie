-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_key_id_package_s65zceexft";

CREATE UNIQUE INDEX CONCURRENTLY "__document_key_id_package_s65zceexft" ON "qti"."document" USING btree ("id", "package");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_key_package_path_id_root_uefqwcznjn";

CREATE UNIQUE INDEX CONCURRENTLY "__document_key_package_path_id_root_uefqwcznjn" ON "qti"."document" USING btree ("package", "path", "id", "root");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__tree_key_id_root_xobalzbvek";

CREATE UNIQUE INDEX CONCURRENTLY "__tree_key_id_root_xobalzbvek" ON "qti"."tree" USING btree ("id", "root");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__variable_ref_key_id_document_qvmavfpldp";

CREATE UNIQUE INDEX CONCURRENTLY "__variable_ref_key_id_document_qvmavfpldp" ON "qti"."variable_ref" USING btree ("id", "document");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__variable_ref_key_id_document_kind_sqkjkdlrd4";

CREATE UNIQUE INDEX CONCURRENTLY "__variable_ref_key_id_document_kind_sqkjkdlrd4" ON "qti"."variable_ref" USING btree ("id", "document", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_adaptive_engine_ref_ed3qneoy7l";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_adaptive_engine_ref_ed3qneoy7l" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-adaptive-engine-ref'::"qti"."node_kind" AND "parent_kind" = 'qti-adaptive-selection'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_adaptive_selection_vhzws63pm6";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_adaptive_selection_vhzws63pm6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-adaptive-selection'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-section'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_adaptive_settings_avfgcpgpqy";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_adaptive_settings_avfgcpgpqy" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-adaptive-settings-ref'::"qti"."node_kind" AND "parent_kind" = 'qti-adaptive-selection'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_content_body_test_cfxli3u5nd";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_content_body_test_cfxli3u5nd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-content-body.testFeedback'::"qti"."node_kind" AND "parent_kind" = 'qti-test-feedback'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_content_body_test_3xzjhtdflh";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_content_body_test_3xzjhtdflh" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-content-body.testRubric'::"qti"."node_kind" AND "parent_kind" = 'qti-rubric-block.test'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_item_session_t6yxuph25o";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_item_session_t6yxuph25o" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-item-session-control'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-item-ref'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_item_session_zf4ruka3xr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_item_session_zf4ruka3xr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-item-session-control'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-section'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_item_session_l3euvnzdao";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_item_session_l3euvnzdao" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-item-session-control'::"qti"."node_kind" AND "parent_kind" = 'qti-test-part'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_metadata_ref_parent_nl7qlq3xin";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_metadata_ref_parent_nl7qlq3xin" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-metadata-ref'::"qti"."node_kind" AND "parent_kind" = 'qti-adaptive-selection'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_ordering_parent_xxpybj5ldg";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_ordering_parent_xxpybj5ldg" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-ordering'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-section'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_outcome_processing_mejtffy45c";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_outcome_processing_mejtffy45c" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-outcome-processing'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-test'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_selection_parent_nfzawkbl7h";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_selection_parent_nfzawkbl7h" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-selection'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-section'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_stimulus_body_3ee5ghky5n";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_stimulus_body_3ee5ghky5n" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-stimulus-body'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-stimulus'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_z6y3ahhfb3";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_time_limits_parent_z6y3ahhfb3" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-time-limits'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-item-ref'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_tovmyn7ugg";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_time_limits_parent_tovmyn7ugg" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-time-limits'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-section'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_th7fnj7q2s";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_time_limits_parent_th7fnj7q2s" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-time-limits'::"qti"."node_kind" AND "parent_kind" = 'qti-assessment-test'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_time_limits_parent_s7iuydj4ez";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_time_limits_parent_s7iuydj4ez" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-time-limits'::"qti"."node_kind" AND "parent_kind" = 'qti-test-part'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_qti_usagedata_ref_r7ttxsaugl";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_qti_usagedata_ref_r7ttxsaugl" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'qti-usagedata-ref'::"qti"."node_kind" AND "parent_kind" = 'qti-adaptive-selection'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__assessment_item_label_ix_tree_root_qgbzvdnhrb";

CREATE INDEX CONCURRENTLY "__assessment_item_label_ix_tree_root_qgbzvdnhrb" ON "qti"."assessment_item_label" USING btree ("tree", "root");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_xml_lang_ix_tree_value_root_kind_test_sexcekmchw";

CREATE INDEX CONCURRENTLY "__node_xml_lang_ix_tree_value_root_kind_test_sexcekmchw" ON "qti"."node_xml_lang" USING btree ("tree", "value") WHERE "root_kind" = 'test'::"qti"."root_kind";
