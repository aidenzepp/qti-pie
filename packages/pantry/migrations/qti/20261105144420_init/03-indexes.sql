CREATE UNIQUE INDEX "__access_for_all_resource_key_metadata_ltyeuwg5av" ON "qti"."access_for_all_resource" USING btree ("metadata");

CREATE UNIQUE INDEX "__csm_guid_key_labelled_guid_jq2qkjitxd" ON "qti"."csm_guid" USING btree ("labelled_guid");

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_caption_g4632cnutx" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'caption'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_img_hizgmsur3h" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'img'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_aggregation_level_pweycamvch" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:aggregationLevel'::"qti"."node_kind" AND "parent_kind" = 'lom:general'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_catalog_parent_kind_ihaqxzmtrd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:catalog'::"qti"."node_kind" AND "parent_kind" = 'lom:identifier'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_copyright_and_other_p233qj7pri" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:copyrightAndOtherRestrictions'::"qti"."node_kind" AND "parent_kind" = 'lom:rights'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_cost_parent_kind_af6v6li57c" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:cost'::"qti"."node_kind" AND "parent_kind" = 'lom:rights'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_date_parent_kind_r74x2wu3c2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:date'::"qti"."node_kind" AND "parent_kind" = 'lom:annotation'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_date_parent_kind_nk2btnwjoi" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:date'::"qti"."node_kind" AND "parent_kind" = 'lom:contribute'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_date_time_parent_5cwanrcm62" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:dateTime'::"qti"."node_kind" AND "parent_kind" = 'lom:date'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_description_parent_p5d45av6gv" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:annotation'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_description_parent_tonc6pa4gh" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:classification'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_description_parent_qlchudgs7g" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:date'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_description_parent_onjtnyxfgj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:duration'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_description_parent_mjvnn2zhhe" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_description_parent_abwqbc32an" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:rights'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_description_parent_vctc3yh7ww" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:typicalLearningTime'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_difficulty_parent_ypebn2m2r2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:difficulty'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_duration_string_bdhvfggytr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:duration.string'::"qti"."node_kind" AND "parent_kind" = 'lom:duration'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_duration_string_3rmbkk6got" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:duration.string'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_duration_string_ota3hs72wc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:duration.string'::"qti"."node_kind" AND "parent_kind" = 'lom:typicalLearningTime'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_entity_parent_kind_j4qh3ik7ma" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entity'::"qti"."node_kind" AND "parent_kind" = 'lom:annotation'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_entry_parent_kind_f7rw5vnlx4" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entry'::"qti"."node_kind" AND "parent_kind" = 'lom:identifier'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_entry_lang_string_mngsvnwj6v" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entry.langString'::"qti"."node_kind" AND "parent_kind" = 'lom:taxon'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_id_parent_kind_lom_2o3h7xqgww" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:id'::"qti"."node_kind" AND "parent_kind" = 'lom:taxon'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_installation_szanhbe2zd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:installationRemarks'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_interactivity_level_3y7t5gxwja" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:interactivityLevel'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_interactivity_type_75q5hnjgzp" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:interactivityType'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_kind_parent_kind_7ve4be5ow2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:kind'::"qti"."node_kind" AND "parent_kind" = 'lom:relation'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_language_parent_3mtge7ue5g" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:language'::"qti"."node_kind" AND "parent_kind" = 'lom:metaMetadata'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_life_cycle_parent_vukxgkrvox" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:lifeCycle'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_maximum_version_q7xgrixbfj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:maximumVersion'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_meta_metadata_yipr7akta6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:metaMetadata'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_minimum_version_bxc5vwhtck" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:minimumVersion'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_name_parent_kind_sqqohkrzcy" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:name'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_other_platform_gfzk3nb2ct" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:otherPlatformRequirements'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_purpose_parent_kind_46txoh3ocq" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:purpose'::"qti"."node_kind" AND "parent_kind" = 'lom:classification'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_resource_parent_h3gaifq6dl" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:resource'::"qti"."node_kind" AND "parent_kind" = 'lom:relation'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_rights_parent_kind_ipzub5affx" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:rights'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_role_parent_kind_l273misho2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:role'::"qti"."node_kind" AND "parent_kind" = 'lom:contribute'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_semantic_density_fs7svl3vzw" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:semanticDensity'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_size_parent_kind_hdawmmdkn2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:size'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_yk4lm5usaa" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:aggregationLevel'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_skubndd32t" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:context'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_b3tz7m5lih" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:copyrightAndOtherRestrictions'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_pgrn26lvfo" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:cost'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_63t53wy5yc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:difficulty'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_6ysi7tdsqh" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:intendedEndUserRole'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_hbwalfxhfq" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityLevel'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_hubo6jdliy" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityType'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_elpfq5xmej" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:kind'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_vv6pznchmv" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:learningResourceType'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_gvswwoy3ue" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:name'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_6p5ozz64il" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:purpose'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_d77hhuipt6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:role'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_qh5iwtbz5n" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:semanticDensity'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_5peedbfzqz" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:status'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_dbnxo7bt77" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:structure'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_parent_kind_dxdjhiv4sd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:type'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_source_lang_string_tvvsuzuapb" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source.langString'::"qti"."node_kind" AND "parent_kind" = 'lom:taxonPath'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_status_parent_kind_wiuxo6wrny" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:status'::"qti"."node_kind" AND "parent_kind" = 'lom:lifeCycle'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_structure_parent_oipzxxpd6x" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:structure'::"qti"."node_kind" AND "parent_kind" = 'lom:general'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_technical_parent_etbtjwceww" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:technical'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_type_parent_kind_pwtiuys23k" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:type'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_typical_learning_72dhi53t3t" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:typicalLearningTime'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_l3b3lvg3ty" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:aggregationLevel'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_u3hj3qop5p" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:context'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_7vr3zrkeou" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:copyrightAndOtherRestrictions'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_f7f6hypjzi" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:cost'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_onsdqcjdls" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:difficulty'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_hsr7kfafwc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:intendedEndUserRole'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_qtw5y7hph6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityLevel'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_vpxnkuqqlj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityType'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_2kp6zijtjb" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:kind'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_mu34r7b5ny" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:learningResourceType'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_6v4trdflof" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:name'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_gavffjmso6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:purpose'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_sdefgq3p2w" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:role'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_bd5ocmckqj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:semanticDensity'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_buahxvyalm" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:status'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_7lakol36rx" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:structure'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_value_parent_kind_zsx2h5fepw" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:type'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_lom_version_parent_kind_pie6nez72p" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:version'::"qti"."node_kind" AND "parent_kind" = 'lom:lifeCycle'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_summary_gcdnyfgmod" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'summary'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_tfoot_iuhmcz3spr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'tfoot'::"qti"."node_kind";

CREATE UNIQUE INDEX "__edge_key_parent_child_kind_thead_d6l4jyggvu" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'thead'::"qti"."node_kind";

CREATE UNIQUE INDEX "__lom_general_title_key_lom_jlcfowoam5" ON "qti"."lom_general_title" USING btree ("lom");

CREATE UNIQUE INDEX "__manifest_metadata_key_manifest_2ntkwgdgmn" ON "qti"."manifest_metadata" USING btree ("manifest");

CREATE UNIQUE INDEX "__manifest_schema_key_metadata_qazxuynlsp" ON "qti"."manifest_schema" USING btree ("metadata");

CREATE UNIQUE INDEX "__manifest_schema_version_key_metadata_f6e5tc2dqq" ON "qti"."manifest_schema_version" USING btree ("metadata");

CREATE UNIQUE INDEX "__organizations_key_manifest_myqunp6c5p" ON "qti"."organizations" USING btree ("manifest");

CREATE UNIQUE INDEX "__resources_key_manifest_v3e3achdnh" ON "qti"."resources" USING btree ("manifest");

CREATE UNIQUE INDEX "__variant_metadata_key_variant_ythetc2gkq" ON "qti"."variant_metadata" USING btree ("variant");

CREATE INDEX "__area_map_entry_ix_area_mapping_bmjhgmjncm" ON "qti"."area_map_entry" USING btree ("area_mapping");

CREATE INDEX "__aria_activedescendant_ix_kind_attribute_g66troqntf" ON "qti"."aria_activedescendant" USING btree ("kind", "attribute");

CREATE INDEX "__aria_atomic_ix_kind_attribute_pal5aoxwhn" ON "qti"."aria_atomic" USING btree ("kind", "attribute");

CREATE INDEX "__aria_autocomplete_ix_kind_attribute_ewbnysgqut" ON "qti"."aria_autocomplete" USING btree ("kind", "attribute");

CREATE INDEX "__aria_busy_ix_kind_attribute_qhvqq6bhvi" ON "qti"."aria_busy" USING btree ("kind", "attribute");

CREATE INDEX "__aria_checked_ix_kind_attribute_filiqb2yjx" ON "qti"."aria_checked" USING btree ("kind", "attribute");

CREATE INDEX "__aria_colcount_ix_kind_attribute_s6q3cayh2i" ON "qti"."aria_colcount" USING btree ("kind", "attribute");

CREATE INDEX "__aria_colindex_ix_kind_attribute_bhu3abvfif" ON "qti"."aria_colindex" USING btree ("kind", "attribute");

CREATE INDEX "__aria_colspan_ix_kind_attribute_wb4uhpsliv" ON "qti"."aria_colspan" USING btree ("kind", "attribute");

CREATE INDEX "__aria_controls_ix_kind_attribute_gvgsnxnj52" ON "qti"."aria_controls" USING btree ("kind", "attribute");

CREATE INDEX "__aria_current_ix_kind_attribute_swuojlwkda" ON "qti"."aria_current" USING btree ("kind", "attribute");

CREATE INDEX "__aria_describedby_ix_kind_attribute_2y7spwi3d5" ON "qti"."aria_describedby" USING btree ("kind", "attribute");

CREATE INDEX "__aria_details_ix_kind_attribute_vvcxjwiyvp" ON "qti"."aria_details" USING btree ("kind", "attribute");

CREATE INDEX "__aria_disabled_ix_kind_attribute_qqgqkxugeh" ON "qti"."aria_disabled" USING btree ("kind", "attribute");

CREATE INDEX "__aria_errormessage_ix_kind_attribute_hkkauejj5u" ON "qti"."aria_errormessage" USING btree ("kind", "attribute");

CREATE INDEX "__aria_expanded_ix_kind_attribute_jzkjzjqxja" ON "qti"."aria_expanded" USING btree ("kind", "attribute");

CREATE INDEX "__aria_flowto_ix_kind_attribute_5j6oryrxhy" ON "qti"."aria_flowto" USING btree ("kind", "attribute");

CREATE INDEX "__aria_haspopup_ix_kind_attribute_ptit6xcs63" ON "qti"."aria_haspopup" USING btree ("kind", "attribute");

CREATE INDEX "__aria_hidden_ix_kind_attribute_45pwqgysxj" ON "qti"."aria_hidden" USING btree ("kind", "attribute");

CREATE INDEX "__aria_invalid_ix_kind_attribute_uefpt62qgj" ON "qti"."aria_invalid" USING btree ("kind", "attribute");

CREATE INDEX "__aria_keyshortcuts_ix_kind_attribute_e7epjxwbvk" ON "qti"."aria_keyshortcuts" USING btree ("kind", "attribute");

CREATE INDEX "__aria_keyshorts_ix_kind_attribute_q5dsa3zoyb" ON "qti"."aria_keyshorts" USING btree ("kind", "attribute");

CREATE INDEX "__aria_label_ix_kind_attribute_e2wcb5n4l6" ON "qti"."aria_label" USING btree ("kind", "attribute");

CREATE INDEX "__aria_labelledby_ix_kind_attribute_ucmimnorkp" ON "qti"."aria_labelledby" USING btree ("kind", "attribute");

CREATE INDEX "__aria_level_ix_kind_attribute_sxtabbqn2t" ON "qti"."aria_level" USING btree ("kind", "attribute");

CREATE INDEX "__aria_live_ix_kind_attribute_klh6rcuvag" ON "qti"."aria_live" USING btree ("kind", "attribute");

CREATE INDEX "__aria_modal_ix_kind_attribute_js7ccnv27d" ON "qti"."aria_modal" USING btree ("kind", "attribute");

CREATE INDEX "__aria_multiline_ix_kind_attribute_fipi27nlhp" ON "qti"."aria_multiline" USING btree ("kind", "attribute");

CREATE INDEX "__aria_multiselectable_ix_kind_attribute_3cgz5jtuhh" ON "qti"."aria_multiselectable" USING btree ("kind", "attribute");

CREATE INDEX "__aria_orientation_ix_kind_attribute_rggr4okuxm" ON "qti"."aria_orientation" USING btree ("kind", "attribute");

CREATE INDEX "__aria_owns_ix_kind_attribute_co2ufd6bzg" ON "qti"."aria_owns" USING btree ("kind", "attribute");

CREATE INDEX "__aria_placeholder_ix_kind_attribute_fu65pecmde" ON "qti"."aria_placeholder" USING btree ("kind", "attribute");

CREATE INDEX "__aria_posinset_ix_kind_attribute_ufh2opvrur" ON "qti"."aria_posinset" USING btree ("kind", "attribute");

CREATE INDEX "__aria_pressed_ix_kind_attribute_5pcst2tq4f" ON "qti"."aria_pressed" USING btree ("kind", "attribute");

CREATE INDEX "__aria_readonly_ix_kind_attribute_3krramru25" ON "qti"."aria_readonly" USING btree ("kind", "attribute");

CREATE INDEX "__aria_relevant_ix_kind_attribute_vairrvqwuc" ON "qti"."aria_relevant" USING btree ("kind", "attribute");

CREATE INDEX "__aria_required_ix_kind_attribute_2apnmaeeyi" ON "qti"."aria_required" USING btree ("kind", "attribute");

CREATE INDEX "__aria_role_ix_kind_attribute_b7yjqnhtc6" ON "qti"."aria_role" USING btree ("kind", "attribute");

CREATE INDEX "__aria_roledescription_ix_kind_attribute_xwzlz4mxww" ON "qti"."aria_roledescription" USING btree ("kind", "attribute");

CREATE INDEX "__aria_rowcount_ix_kind_attribute_uw3h6ep7nb" ON "qti"."aria_rowcount" USING btree ("kind", "attribute");

CREATE INDEX "__aria_rowindex_ix_kind_attribute_fxv4wgokkn" ON "qti"."aria_rowindex" USING btree ("kind", "attribute");

CREATE INDEX "__aria_rowspan_ix_kind_attribute_suvctglepn" ON "qti"."aria_rowspan" USING btree ("kind", "attribute");

CREATE INDEX "__aria_selected_ix_kind_attribute_cttudg4m2p" ON "qti"."aria_selected" USING btree ("kind", "attribute");

CREATE INDEX "__aria_setsize_ix_kind_attribute_nmep3gu5s4" ON "qti"."aria_setsize" USING btree ("kind", "attribute");

CREATE INDEX "__aria_sort_ix_kind_attribute_clttkxahdl" ON "qti"."aria_sort" USING btree ("kind", "attribute");

CREATE INDEX "__aria_valuemax_ix_kind_attribute_bdtkmswh65" ON "qti"."aria_valuemax" USING btree ("kind", "attribute");

CREATE INDEX "__aria_valuemin_ix_kind_attribute_sm5i3duifk" ON "qti"."aria_valuemin" USING btree ("kind", "attribute");

CREATE INDEX "__aria_valuenow_ix_kind_attribute_h3uduxzjzy" ON "qti"."aria_valuenow" USING btree ("kind", "attribute");

CREATE INDEX "__aria_valuetext_ix_kind_attribute_jl2z4twlts" ON "qti"."aria_valuetext" USING btree ("kind", "attribute");

CREATE INDEX "__assessment_item_label_ix_tree_version_3_0_1_zi234o6hj7" ON "qti"."assessment_item_label" USING btree ("tree") WHERE "version" = '3.0.1'::"qti"."schema_version";

CREATE INDEX "__attribute_idref_ix_document_target_hkwfn3q42m" ON "qti"."attribute_idref" USING btree ("document", "target");

CREATE INDEX "__attribute_idref_ix_node_document_lulod2fmdz" ON "qti"."attribute_idref" USING btree ("node", "document");

CREATE INDEX "__attribute_lexical_ix_kind_attribute_7hgb4uv7ab" ON "qti"."attribute_lexical" USING btree ("kind", "attribute");

CREATE INDEX "__attribute_lexical_ix_node_kind_hwyadhp4if" ON "qti"."attribute_lexical" USING btree ("node", "kind");

CREATE INDEX "__attribute_spelling_ix_kind_attribute_ejjohbboes" ON "qti"."attribute_spelling" USING btree ("kind", "attribute");

CREATE INDEX "__attribute_spelling_ix_node_kind_3v2tiehcmc" ON "qti"."attribute_spelling" USING btree ("node", "kind");

CREATE INDEX "__choice_template_ref_ix_document_identifier_base_w7kaqpz2aw" ON "qti"."choice_template_ref" USING btree ("document", "identifier", "base_type", "cardinality");

CREATE INDEX "__csm_labelled_guid_ix_set_of_guids_lays2gya5y" ON "qti"."csm_labelled_guid" USING btree ("set_of_guids");

CREATE INDEX "__csm_metadata_ix_set_rck25qjlcy" ON "qti"."csm_metadata" USING btree ("set");

CREATE INDEX "__csm_set_ix_host_drqp6qqwbo" ON "qti"."csm_set" USING btree ("host");

CREATE INDEX "__csm_set_of_guids_ix_metadata_fesdddgqyo" ON "qti"."csm_set_of_guids" USING btree ("metadata");

CREATE INDEX "__declared_ref_ix_document_identifier_declaration_gk7oqzwmhi" ON "qti"."declared_ref" USING btree ("document", "identifier", "declaration_kind");

CREATE INDEX "__declared_value_ix_value_set_base_type_zitbtn6nwa" ON "qti"."declared_value" USING btree ("value_set", "base_type");

CREATE INDEX "__declared_value_ix_value_set_shape_zegpafstry" ON "qti"."declared_value" USING btree ("value_set", "shape");

CREATE INDEX "__dependency_ix_package_resource_k7yvrhb5p6" ON "qti"."dependency" USING btree ("package", "resource");

CREATE INDEX "__dependency_ix_package_target_irvksks4il" ON "qti"."dependency" USING btree ("package", "target");

CREATE INDEX "__document_ix_package_version_2zrptn52fq" ON "qti"."document" USING btree ("package", "version");

CREATE INDEX "__document_ix_resource_type_root_krtmo7mbrt" ON "qti"."document" USING btree ("resource_type", "root");

CREATE INDEX "__document_lang_ix_package_resource_document_vc2q2ihc24" ON "qti"."document_lang" USING btree ("package", "resource", "document");

CREATE INDEX "__document_lang_ix_package_resource_value_lom_hn7ro3mopn" ON "qti"."document_lang" USING btree ("package", "resource", "value") WHERE "lom_general" = 'yes'::"qti"."yes_no";

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

CREATE INDEX "__edge_ix_parent_parent_ancestry_olnfr2qkpz" ON "qti"."edge" USING btree ("parent", "parent_ancestry");

CREATE INDEX "__edge_ix_parent_tree_version_parent_kind_rncqfqwmf2" ON "qti"."edge" USING btree ("parent", "tree", "version", "parent_kind");

CREATE INDEX "__edge_ix_parent_ancestry_parent_kind_child_ancestry_krp7hvveq7" ON "qti"."edge" USING btree ("parent_ancestry", "parent_kind", "child_ancestry");

CREATE INDEX "__edge_ix_version_parent_kind_child_kind_2tg4zz3a7o" ON "qti"."edge" USING btree ("version", "parent_kind", "child_kind");

CREATE INDEX "__expression_ix_kind_min_rnzmnukj6j" ON "qti"."expression" USING btree ("kind", "min");

CREATE INDEX "__expression_max_ix_kind_max_xtwvhgfvfx" ON "qti"."expression_max" USING btree ("kind", "max");

CREATE INDEX "__external_lom_ix_document_6suac5xlnl" ON "qti"."external_lom" USING btree ("document");

CREATE INDEX "__feedback_outcome_ref_ix_document_identifier_base_5w5tqvjfvf" ON "qti"."feedback_outcome_ref" USING btree ("document", "identifier", "base_type", "cardinality");

CREATE INDEX "__file_ix_package_href_vgnf3xnans" ON "qti"."file" USING btree ("package", "href");

CREATE INDEX "__file_ix_resource_3lt2t6uxt3" ON "qti"."file" USING btree ("resource");

CREATE INDEX "__file_lom_ix_file_package_tupff3zwrm" ON "qti"."file_lom" USING btree ("file", "package");

CREATE INDEX "__file_lom_ix_metadata_file_4oyrln4yqx" ON "qti"."file_lom" USING btree ("metadata", "file");

CREATE INDEX "__headers_target_ix_document_target_ecv5r2tdx3" ON "qti"."headers_target" USING btree ("document", "target");

CREATE INDEX "__html_id_ix_kind_attribute_wdlnfjpdyi" ON "qti"."html_id" USING btree ("kind", "attribute");

CREATE INDEX "__interaction_binding_ix_document_adaptive_7q2wud3r7r" ON "qti"."interaction_binding" USING btree ("document", "adaptive");

CREATE INDEX "__interpolation_table_entry_ix_table_declaration_wgjd7v3me6" ON "qti"."interpolation_table_entry" USING btree ("table", "declaration", "base_type");

CREATE INDEX "__lom_aggregation_level_ix_lom_crtqoeboje" ON "qti"."lom_aggregation_level" USING btree ("lom");

CREATE INDEX "__lom_annotation_ix_lom_e2eimfmnfc" ON "qti"."lom_annotation" USING btree ("lom");

CREATE INDEX "__lom_classification_ix_lom_c74wuapevs" ON "qti"."lom_classification" USING btree ("lom");

CREATE INDEX "__lom_context_ix_lom_7mcdhp6zav" ON "qti"."lom_context" USING btree ("lom");

CREATE INDEX "__lom_contribute_ix_lom_wom4wgkdxk" ON "qti"."lom_contribute" USING btree ("lom");

CREATE INDEX "__lom_copyright_and_other_restrictions_ix_lom_sfpdyjfpb2" ON "qti"."lom_copyright_and_other_restrictions" USING btree ("lom");

CREATE INDEX "__lom_cost_ix_lom_xhsvj33rgy" ON "qti"."lom_cost" USING btree ("lom");

CREATE INDEX "__lom_coverage_ix_lom_txnrszdfo3" ON "qti"."lom_coverage" USING btree ("lom");

CREATE INDEX "__lom_date_ix_lom_aqs5sp5tv7" ON "qti"."lom_date" USING btree ("lom");

CREATE INDEX "__lom_date_time_ix_lom_n4aroup2ei" ON "qti"."lom_date_time" USING btree ("lom");

CREATE INDEX "__lom_description_ix_lom_vnyonuegvg" ON "qti"."lom_description" USING btree ("lom");

CREATE INDEX "__lom_difficulty_ix_lom_h6zzds2vp5" ON "qti"."lom_difficulty" USING btree ("lom");

CREATE INDEX "__lom_duration_ix_lom_pheyxyu47i" ON "qti"."lom_duration" USING btree ("lom");

CREATE INDEX "__lom_duration_string_ix_lom_ktf56bgpmh" ON "qti"."lom_duration_string" USING btree ("lom");

CREATE INDEX "__lom_educational_ix_lom_capn5cdki5" ON "qti"."lom_educational" USING btree ("lom");

CREATE INDEX "__lom_entity_ix_lom_n2l5ake4in" ON "qti"."lom_entity" USING btree ("lom");

CREATE INDEX "__lom_entry_lang_string_ix_lom_rjgjkdwiep" ON "qti"."lom_entry_lang_string" USING btree ("lom");

CREATE INDEX "__lom_format_ix_lom_7qax32efgp" ON "qti"."lom_format" USING btree ("lom");

CREATE INDEX "__lom_identifier_ix_lom_owner_wzkf734f4v" ON "qti"."lom_identifier" USING btree ("lom", "owner");

CREATE INDEX "__lom_identifier_catalog_ix_identifier_lom_position_qdd3e3w32x" ON "qti"."lom_identifier_catalog" USING btree ("identifier", "lom", "position");

CREATE INDEX "__lom_identifier_catalog_ix_lom_owner_ucyua7radl" ON "qti"."lom_identifier_catalog" USING btree ("lom", "owner");

CREATE INDEX "__lom_identifier_entry_ix_lom_owner_su645mpz6h" ON "qti"."lom_identifier_entry" USING btree ("lom", "owner");

CREATE INDEX "__lom_installation_remarks_ix_lom_qjvmsukpm5" ON "qti"."lom_installation_remarks" USING btree ("lom");

CREATE INDEX "__lom_intended_end_user_role_ix_lom_gt2d4jzpsr" ON "qti"."lom_intended_end_user_role" USING btree ("lom");

CREATE INDEX "__lom_interactivity_level_ix_lom_up36fuwjat" ON "qti"."lom_interactivity_level" USING btree ("lom");

CREATE INDEX "__lom_interactivity_type_ix_lom_4uqluzxxew" ON "qti"."lom_interactivity_type" USING btree ("lom");

CREATE INDEX "__lom_keyword_ix_lom_gu2t5sxzd7" ON "qti"."lom_keyword" USING btree ("lom");

CREATE INDEX "__lom_kind_ix_lom_gmrpylwpku" ON "qti"."lom_kind" USING btree ("lom");

CREATE INDEX "__lom_language_ix_lom_owner_p6t4fo66ky" ON "qti"."lom_language" USING btree ("lom", "owner");

CREATE INDEX "__lom_language_ix_lom_value_owner_resource_parent_bbl5vba5nx" ON "qti"."lom_language" USING btree ("lom", "value") WHERE "owner" = 'resource'::"qti"."lom_owner" AND "parent_kind" = 'lom:general'::"qti"."node_kind";

CREATE INDEX "__lom_learning_resource_type_ix_lom_2vhkaf4fwj" ON "qti"."lom_learning_resource_type" USING btree ("lom");

CREATE INDEX "__lom_location_ix_lom_ha5vcr722n" ON "qti"."lom_location" USING btree ("lom");

CREATE INDEX "__lom_maximum_version_ix_lom_sxkgn27yw5" ON "qti"."lom_maximum_version" USING btree ("lom");

CREATE INDEX "__lom_metadataschema_ix_lom_fxwgialmzq" ON "qti"."lom_metadataschema" USING btree ("lom");

CREATE INDEX "__lom_minimum_version_ix_lom_fnuw2hzfka" ON "qti"."lom_minimum_version" USING btree ("lom");

CREATE INDEX "__lom_name_ix_lom_j3tsm6s3w7" ON "qti"."lom_name" USING btree ("lom");

CREATE INDEX "__lom_object_identifier_ix_package_resource_fvyo7vsxtk" ON "qti"."lom_object_identifier" USING btree ("package", "resource", "collapsed");

CREATE INDEX "__lom_object_title_ix_package_resource_collapsed_mctzzsj7mu" ON "qti"."lom_object_title" USING btree ("package", "resource", "collapsed");

CREATE INDEX "__lom_or_composite_ix_lom_y24ycko4jv" ON "qti"."lom_or_composite" USING btree ("lom");

CREATE INDEX "__lom_other_platform_requirements_ix_lom_lz5kv6b6lf" ON "qti"."lom_other_platform_requirements" USING btree ("lom");

CREATE INDEX "__lom_purpose_ix_lom_s255xvv4jg" ON "qti"."lom_purpose" USING btree ("lom");

CREATE INDEX "__lom_relation_ix_lom_euclmi77pp" ON "qti"."lom_relation" USING btree ("lom");

CREATE INDEX "__lom_requirement_ix_lom_d3iex7gu7u" ON "qti"."lom_requirement" USING btree ("lom");

CREATE INDEX "__lom_resource_ix_lom_w6xzhkqagp" ON "qti"."lom_resource" USING btree ("lom");

CREATE INDEX "__lom_role_ix_lom_bsi3n32r2b" ON "qti"."lom_role" USING btree ("lom");

CREATE INDEX "__lom_semantic_density_ix_lom_qxdpkf2jc2" ON "qti"."lom_semantic_density" USING btree ("lom");

CREATE INDEX "__lom_size_ix_lom_6itjjvkq3e" ON "qti"."lom_size" USING btree ("lom");

CREATE INDEX "__lom_source_lang_string_ix_lom_m7onpvx5h7" ON "qti"."lom_source_lang_string" USING btree ("lom");

CREATE INDEX "__lom_status_ix_lom_emiyxi6m22" ON "qti"."lom_status" USING btree ("lom");

CREATE INDEX "__lom_structure_ix_lom_6u7wnpggrk" ON "qti"."lom_structure" USING btree ("lom");

CREATE INDEX "__lom_taxon_ix_lom_cvrvpisqtw" ON "qti"."lom_taxon" USING btree ("lom");

CREATE INDEX "__lom_taxon_path_ix_lom_u5esjg4mdm" ON "qti"."lom_taxon_path" USING btree ("lom");

CREATE INDEX "__lom_title_ix_lom_owner_zggm6lanqk" ON "qti"."lom_title" USING btree ("lom", "owner");

CREATE INDEX "__lom_type_ix_lom_6y3cbtt2b6" ON "qti"."lom_type" USING btree ("lom");

CREATE INDEX "__lom_typical_age_range_ix_lom_xd346hbqwo" ON "qti"."lom_typical_age_range" USING btree ("lom");

CREATE INDEX "__lom_typical_learning_time_ix_lom_6i456qniqn" ON "qti"."lom_typical_learning_time" USING btree ("lom");

CREATE INDEX "__lom_version_ix_lom_5vgccnw4wo" ON "qti"."lom_version" USING btree ("lom");

CREATE INDEX "__manifest_lom_ix_metadata_x76b6ms7vy" ON "qti"."manifest_lom" USING btree ("metadata");

CREATE INDEX "__manifest_schema_version_ix_package_version_33bobfqced" ON "qti"."manifest_schema_version" USING btree ("package", "version");

CREATE INDEX "__map_entry_ix_mapping_declaration_5scjfxi3t6" ON "qti"."map_entry" USING btree ("mapping", "declaration");

CREATE INDEX "__mapping_ix_base_type_clew7r7vqu" ON "qti"."mapping" USING btree ("base_type");

CREATE INDEX "__match_table_entry_ix_table_declaration_base_type_rjsobpcfjd" ON "qti"."match_table_entry" USING btree ("table", "declaration", "base_type");

CREATE INDEX "__node_ix_ancestry_kind_zxfhf2mtks" ON "qti"."node" USING btree ("ancestry", "kind");

CREATE INDEX "__node_ix_tree_version_root_kind_midgktllgy" ON "qti"."node" USING btree ("tree", "version", "root_kind");

CREATE INDEX "__node_catalog_idref_ix_kind_attribute_62iry7g66r" ON "qti"."node_catalog_idref" USING btree ("kind", "attribute");

CREATE INDEX "__node_class_ix_kind_attribute_2zvzmui6ef" ON "qti"."node_class" USING btree ("kind", "attribute");

CREATE INDEX "__node_dir_ix_kind_attribute_a3f2udypx4" ON "qti"."node_dir" USING btree ("kind", "attribute");

CREATE INDEX "__node_label_ix_kind_attribute_5klyi2go2f" ON "qti"."node_label" USING btree ("kind", "attribute");

CREATE INDEX "__node_label_ix_tree_root_kind_item_kjkhdyv6bn" ON "qti"."node_label" USING btree ("tree") WHERE "root_kind" = 'item'::"qti"."root_kind";

CREATE INDEX "__node_lang_ix_kind_attribute_wy33spzvfl" ON "qti"."node_lang" USING btree ("kind", "attribute");

CREATE INDEX "__node_suppress_tts_ix_kind_attribute_e2o7y5ezde" ON "qti"."node_suppress_tts" USING btree ("kind", "attribute");

CREATE INDEX "__node_xml_base_ix_kind_attribute_n3ampxik5i" ON "qti"."node_xml_base" USING btree ("kind", "attribute");

CREATE INDEX "__node_xml_lang_ix_kind_attribute_z6cshkbsg7" ON "qti"."node_xml_lang" USING btree ("kind", "attribute");

CREATE INDEX "__node_xml_lang_ix_tree_value_root_kind_item_is4xqf7pwt" ON "qti"."node_xml_lang" USING btree ("tree", "value") WHERE "root_kind" = 'item'::"qti"."root_kind";

CREATE INDEX "__outcome_document_ix_declaration_54e3jmecvg" ON "qti"."outcome_document" USING btree ("declaration");

CREATE INDEX "__printed_variable_ref_ix_document_identifier_kind_3zmmaph3ux" ON "qti"."printed_variable_ref" USING btree ("document", "identifier", "kind");

CREATE INDEX "__printed_variable_var_ref_ix_document_identifier_gohqg6mh3w" ON "qti"."printed_variable_var_ref" USING btree ("document", "identifier", "base_type", "cardinality");

CREATE INDEX "__printed_variable_var_ref_ix_document_identifier_nbdk2dkgjm" ON "qti"."printed_variable_var_ref" USING btree ("document", "identifier", "kind");

CREATE INDEX "__printed_variable_var_ref_ix_node_document_fh3pliy6zm" ON "qti"."printed_variable_var_ref" USING btree ("node", "document");

CREATE INDEX "__qti_metadata_in_external_lom_ix_lom_package_igzmxxzys3" ON "qti"."qti_metadata_in_external_lom" USING btree ("lom", "package", "resource");

CREATE INDEX "__qti_metadata_in_metadata_ix_metadata_resource_node_cppdgmygnk" ON "qti"."qti_metadata_in_metadata" USING btree ("metadata", "resource_node");

CREATE INDEX "__qti_metadata_in_metadata_ix_resource_node_package_sqn7arpodr" ON "qti"."qti_metadata_in_metadata" USING btree ("resource_node", "package", "resource");

CREATE INDEX "__qti_metadata_in_resource_lom_ix_lom_package_vuv2yeucnd" ON "qti"."qti_metadata_in_resource_lom" USING btree ("lom", "package", "resource");

CREATE INDEX "__record_binding_ix_interaction_kind_hc4ijcqlmb" ON "qti"."record_binding" USING btree ("interaction_kind");

CREATE INDEX "__resource_ix_package_version_wqz6pkayka" ON "qti"."resource" USING btree ("package", "version");

CREATE INDEX "__resource_ix_version_type_5nf4p4seqz" ON "qti"."resource" USING btree ("version", "type");

CREATE INDEX "__resource_lom_ix_metadata_vavjihmzwx" ON "qti"."resource_lom" USING btree ("metadata");

CREATE INDEX "__resource_lom_language_set_ix_lom_package_resource_5wtdxnaszm" ON "qti"."resource_lom_language_set" USING btree ("lom", "package", "resource");

CREATE INDEX "__simple_associable_choice_match_set_ix_match_set_skw3vptkt6" ON "qti"."simple_associable_choice_match_set" USING btree ("match_set", "interaction");

CREATE INDEX "__statistic_ix_usage_data_qsqkjb3h57" ON "qti"."statistic" USING btree ("usage_data");

CREATE INDEX "__target_object_ix_statistic_kklaigmtdy" ON "qti"."target_object" USING btree ("statistic");

CREATE INDEX "__template_content_ref_ix_document_identifier_base_ipkvztpbum" ON "qti"."template_content_ref" USING btree ("document", "identifier", "base_type", "cardinality");

CREATE INDEX "__typed_binding_ix_document_response_identifier_base_ywuawwudab" ON "qti"."typed_binding" USING btree ("document", "response_identifier", "base_type", "cardinality");

CREATE INDEX "__typed_binding_ix_interaction_kind_base_type_f63zbhy6nz" ON "qti"."typed_binding" USING btree ("interaction_kind", "base_type", "cardinality");

CREATE INDEX "__typed_value_set_ix_declaration_base_type_zpsvrx2gkw" ON "qti"."typed_value_set" USING btree ("declaration", "base_type", "cardinality");

CREATE INDEX "__usage_map_entry_ix_mapping_omtvpx4lh7" ON "qti"."usage_map_entry" USING btree ("mapping");

CREATE INDEX "__value_set_ix_declaration_shape_2ttql7vose" ON "qti"."value_set" USING btree ("declaration", "shape");

CREATE INDEX "__variant_ix_package_identifierref_cgd3uzvweq" ON "qti"."variant" USING btree ("package", "identifierref");

CREATE INDEX "__variant_ix_resource_package_resource_identifier_3mcke6ybyd" ON "qti"."variant" USING btree ("resource", "package", "resource_identifier");
