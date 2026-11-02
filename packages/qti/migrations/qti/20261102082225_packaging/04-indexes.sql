CREATE UNIQUE INDEX "__csm_guid_key_labelled_guid_jq2qkjitxd" ON "qti"."csm_guid" USING btree ("labelled_guid");

CREATE INDEX "__csm_labelled_guid_ix_set_of_guids_lays2gya5y" ON "qti"."csm_labelled_guid" USING btree ("set_of_guids");

CREATE INDEX "__csm_metadata_ix_set_rck25qjlcy" ON "qti"."csm_metadata" USING btree ("set");

CREATE INDEX "__csm_set_ix_host_drqp6qqwbo" ON "qti"."csm_set" USING btree ("host");

CREATE INDEX "__csm_set_of_guids_ix_metadata_fesdddgqyo" ON "qti"."csm_set_of_guids" USING btree ("metadata");

CREATE INDEX "__statistic_ix_usage_data_qsqkjb3h57" ON "qti"."statistic" USING btree ("usage_data");

CREATE INDEX "__target_object_ix_statistic_kklaigmtdy" ON "qti"."target_object" USING btree ("statistic");

CREATE INDEX "__usage_map_entry_ix_mapping_omtvpx4lh7" ON "qti"."usage_map_entry" USING btree ("mapping");
