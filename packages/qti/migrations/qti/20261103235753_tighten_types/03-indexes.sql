-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__dependency_ix_package_resource_k7yvrhb5p6";

CREATE INDEX CONCURRENTLY "__dependency_ix_package_resource_k7yvrhb5p6" ON "qti"."dependency" USING btree ("package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__dependency_ix_package_target_irvksks4il";

CREATE INDEX CONCURRENTLY "__dependency_ix_package_target_irvksks4il" ON "qti"."dependency" USING btree ("package", "target");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_lang_ix_package_resource_document_vc2q2ihc24";

CREATE INDEX CONCURRENTLY "__document_lang_ix_package_resource_document_vc2q2ihc24" ON "qti"."document_lang" USING btree ("package", "resource", "document");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_lang_ix_package_resource_value_lom_hn7ro3mopn";

CREATE INDEX CONCURRENTLY "__document_lang_ix_package_resource_value_lom_hn7ro3mopn" ON "qti"."document_lang" USING btree ("package", "resource", "value") WHERE "lom_general" = 'yes'::"qti"."yes_no";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__file_ix_package_href_vgnf3xnans";

CREATE INDEX CONCURRENTLY "__file_ix_package_href_vgnf3xnans" ON "qti"."file" USING btree ("package", "href");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__interaction_binding_ix_document_adaptive_7q2wud3r7r";

CREATE INDEX CONCURRENTLY "__interaction_binding_ix_document_adaptive_7q2wud3r7r" ON "qti"."interaction_binding" USING btree ("document", "adaptive");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_object_identifier_ix_package_resource_fvyo7vsxtk";

CREATE INDEX CONCURRENTLY "__lom_object_identifier_ix_package_resource_fvyo7vsxtk" ON "qti"."lom_object_identifier" USING btree ("package", "resource", "collapsed");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_object_title_ix_package_resource_collapsed_mctzzsj7mu";

CREATE INDEX CONCURRENTLY "__lom_object_title_ix_package_resource_collapsed_mctzzsj7mu" ON "qti"."lom_object_title" USING btree ("package", "resource", "collapsed");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_in_external_lom_ix_lom_package_igzmxxzys3";

CREATE INDEX CONCURRENTLY "__qti_metadata_in_external_lom_ix_lom_package_igzmxxzys3" ON "qti"."qti_metadata_in_external_lom" USING btree ("lom", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_in_metadata_ix_resource_node_package_sqn7arpodr";

CREATE INDEX CONCURRENTLY "__qti_metadata_in_metadata_ix_resource_node_package_sqn7arpodr" ON "qti"."qti_metadata_in_metadata" USING btree ("resource_node", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_in_resource_lom_ix_lom_package_vuv2yeucnd";

CREATE INDEX CONCURRENTLY "__qti_metadata_in_resource_lom_ix_lom_package_vuv2yeucnd" ON "qti"."qti_metadata_in_resource_lom" USING btree ("lom", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_lom_language_set_ix_lom_package_resource_5wtdxnaszm";

CREATE INDEX CONCURRENTLY "__resource_lom_language_set_ix_lom_package_resource_5wtdxnaszm" ON "qti"."resource_lom_language_set" USING btree ("lom", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__variant_ix_package_identifierref_cgd3uzvweq";

CREATE INDEX CONCURRENTLY "__variant_ix_package_identifierref_cgd3uzvweq" ON "qti"."variant" USING btree ("package", "identifierref");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__variant_ix_resource_package_resource_identifier_3mcke6ybyd";

CREATE INDEX CONCURRENTLY "__variant_ix_resource_package_resource_identifier_3mcke6ybyd" ON "qti"."variant" USING btree ("resource", "package", "resource_identifier");
