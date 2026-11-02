CREATE UNIQUE INDEX "__access_for_all_resource_key_metadata_ltyeuwg5av" ON "qti"."access_for_all_resource" USING btree ("metadata");

CREATE UNIQUE INDEX "__csm_guid_key_labelled_guid_jq2qkjitxd" ON "qti"."csm_guid" USING btree ("labelled_guid");

CREATE UNIQUE INDEX "__variant_metadata_key_variant_ythetc2gkq" ON "qti"."variant_metadata" USING btree ("variant");

CREATE INDEX "__csm_labelled_guid_ix_set_of_guids_lays2gya5y" ON "qti"."csm_labelled_guid" USING btree ("set_of_guids");

CREATE INDEX "__csm_metadata_ix_set_rck25qjlcy" ON "qti"."csm_metadata" USING btree ("set");

CREATE INDEX "__csm_set_ix_host_drqp6qqwbo" ON "qti"."csm_set" USING btree ("host");

CREATE INDEX "__csm_set_of_guids_ix_metadata_fesdddgqyo" ON "qti"."csm_set_of_guids" USING btree ("metadata");

CREATE INDEX "__drd_access_mode_ix_owner_nafahrej5h" ON "qti"."drd_access_mode" USING btree ("owner");

CREATE INDEX "__drd_access_mode_adapted_ix_owner_i27o64enej" ON "qti"."drd_access_mode_adapted" USING btree ("owner");

CREATE INDEX "__drd_adaptation_detail_ix_owner_36p5ul4zxq" ON "qti"."drd_adaptation_detail" USING btree ("owner");

CREATE INDEX "__drd_adaptation_media_type_ix_owner_jfqysxuqek" ON "qti"."drd_adaptation_media_type" USING btree ("owner");

CREATE INDEX "__drd_adaptation_type_ix_owner_p5qnadkbqx" ON "qti"."drd_adaptation_type" USING btree ("owner");

CREATE INDEX "__drd_api_interoperable_ix_owner_ydwgzfpay4" ON "qti"."drd_api_interoperable" USING btree ("owner");

CREATE INDEX "__drd_control_flexibility_ix_owner_aytmj32cw5" ON "qti"."drd_control_flexibility" USING btree ("owner");

CREATE INDEX "__drd_display_transformability_ix_owner_xuwg6wzl2h" ON "qti"."drd_display_transformability" USING btree ("owner");

CREATE INDEX "__drd_educational_level_of_adaptation_ix_owner_l2degszvbf" ON "qti"."drd_educational_level_of_adaptation" USING btree ("owner");

CREATE INDEX "__drd_has_adaptation_ix_owner_z7aoreiwl4" ON "qti"."drd_has_adaptation" USING btree ("owner");

CREATE INDEX "__drd_hazard_ix_owner_k6ix5wgkdh" ON "qti"."drd_hazard" USING btree ("owner");

CREATE INDEX "__drd_is_adaptation_of_ix_owner_5ulfafssre" ON "qti"."drd_is_adaptation_of" USING btree ("owner");

CREATE INDEX "__drd_is_full_adaptation_of_ix_owner_2z6xfb26ad" ON "qti"."drd_is_full_adaptation_of" USING btree ("owner");

CREATE INDEX "__drd_is_partial_adaptation_of_ix_owner_vy2fsymohn" ON "qti"."drd_is_partial_adaptation_of" USING btree ("owner");

CREATE INDEX "__drd_language_of_adaptation_ix_owner_7kx4y32tgl" ON "qti"."drd_language_of_adaptation" USING btree ("owner");

CREATE INDEX "__external_lom_ix_document_6suac5xlnl" ON "qti"."external_lom" USING btree ("document");

CREATE INDEX "__file_lom_ix_file_package_tupff3zwrm" ON "qti"."file_lom" USING btree ("file", "package");

CREATE INDEX "__file_lom_ix_metadata_file_4oyrln4yqx" ON "qti"."file_lom" USING btree ("metadata", "file");

CREATE INDEX "__lom_annotation_ix_lom_e2eimfmnfc" ON "qti"."lom_annotation" USING btree ("lom");

CREATE INDEX "__lom_classification_ix_lom_c74wuapevs" ON "qti"."lom_classification" USING btree ("lom");

CREATE INDEX "__lom_context_ix_lom_7mcdhp6zav" ON "qti"."lom_context" USING btree ("lom");

CREATE INDEX "__lom_difficulty_ix_lom_h6zzds2vp5" ON "qti"."lom_difficulty" USING btree ("lom");

CREATE INDEX "__lom_educational_ix_lom_capn5cdki5" ON "qti"."lom_educational" USING btree ("lom");

CREATE INDEX "__lom_entry_lang_string_ix_lom_rjgjkdwiep" ON "qti"."lom_entry_lang_string" USING btree ("lom");

CREATE INDEX "__lom_intended_end_user_role_ix_lom_gt2d4jzpsr" ON "qti"."lom_intended_end_user_role" USING btree ("lom");

CREATE INDEX "__lom_interactivity_level_ix_lom_up36fuwjat" ON "qti"."lom_interactivity_level" USING btree ("lom");

CREATE INDEX "__lom_interactivity_type_ix_lom_4uqluzxxew" ON "qti"."lom_interactivity_type" USING btree ("lom");

CREATE INDEX "__lom_kind_ix_lom_gmrpylwpku" ON "qti"."lom_kind" USING btree ("lom");

CREATE INDEX "__lom_learning_resource_type_ix_lom_2vhkaf4fwj" ON "qti"."lom_learning_resource_type" USING btree ("lom");

CREATE INDEX "__lom_purpose_ix_lom_s255xvv4jg" ON "qti"."lom_purpose" USING btree ("lom");

CREATE INDEX "__lom_relation_ix_lom_euclmi77pp" ON "qti"."lom_relation" USING btree ("lom");

CREATE INDEX "__lom_resource_ix_lom_w6xzhkqagp" ON "qti"."lom_resource" USING btree ("lom");

CREATE INDEX "__lom_semantic_density_ix_lom_qxdpkf2jc2" ON "qti"."lom_semantic_density" USING btree ("lom");

CREATE INDEX "__lom_source_lang_string_ix_lom_m7onpvx5h7" ON "qti"."lom_source_lang_string" USING btree ("lom");

CREATE INDEX "__lom_taxon_ix_lom_cvrvpisqtw" ON "qti"."lom_taxon" USING btree ("lom");

CREATE INDEX "__lom_taxon_path_ix_lom_u5esjg4mdm" ON "qti"."lom_taxon_path" USING btree ("lom");

CREATE INDEX "__lom_typical_age_range_ix_lom_xd346hbqwo" ON "qti"."lom_typical_age_range" USING btree ("lom");

CREATE INDEX "__lom_typical_learning_time_ix_lom_6i456qniqn" ON "qti"."lom_typical_learning_time" USING btree ("lom");

CREATE INDEX "__outcome_document_ix_declaration_54e3jmecvg" ON "qti"."outcome_document" USING btree ("declaration");

CREATE INDEX "__qti_metadata_in_external_lom_ix_lom_package_igzmxxzys3" ON "qti"."qti_metadata_in_external_lom" USING btree ("lom", "package", "resource");

CREATE INDEX "__qti_metadata_in_metadata_ix_metadata_resource_node_cppdgmygnk" ON "qti"."qti_metadata_in_metadata" USING btree ("metadata", "resource_node");

CREATE INDEX "__qti_metadata_in_metadata_ix_resource_node_package_sqn7arpodr" ON "qti"."qti_metadata_in_metadata" USING btree ("resource_node", "package", "resource");

CREATE INDEX "__qti_metadata_in_resource_lom_ix_lom_package_vuv2yeucnd" ON "qti"."qti_metadata_in_resource_lom" USING btree ("lom", "package", "resource");

CREATE INDEX "__statistic_ix_usage_data_qsqkjb3h57" ON "qti"."statistic" USING btree ("usage_data");

CREATE INDEX "__target_object_ix_statistic_kklaigmtdy" ON "qti"."target_object" USING btree ("statistic");

CREATE INDEX "__usage_map_entry_ix_mapping_omtvpx4lh7" ON "qti"."usage_map_entry" USING btree ("mapping");

CREATE INDEX "__variant_ix_package_identifierref_cgd3uzvweq" ON "qti"."variant" USING btree ("package", "identifierref");

CREATE INDEX "__variant_ix_resource_package_resource_identifier_3mcke6ybyd" ON "qti"."variant" USING btree ("resource", "package", "resource_identifier");
