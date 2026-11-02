CREATE INDEX "__qti_metadata_in_external_lom_ix_lom_package_igzmxxzys3" ON "qti"."qti_metadata_in_external_lom" USING btree ("lom", "package", "resource");

CREATE INDEX "__qti_metadata_in_metadata_ix_metadata_resource_node_cppdgmygnk" ON "qti"."qti_metadata_in_metadata" USING btree ("metadata", "resource_node");

CREATE INDEX "__qti_metadata_in_metadata_ix_resource_node_package_sqn7arpodr" ON "qti"."qti_metadata_in_metadata" USING btree ("resource_node", "package", "resource");

CREATE INDEX "__qti_metadata_in_resource_lom_ix_lom_package_vuv2yeucnd" ON "qti"."qti_metadata_in_resource_lom" USING btree ("lom", "package", "resource");
