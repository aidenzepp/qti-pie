-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_key_id_package_resource_flponjq52v";

CREATE UNIQUE INDEX CONCURRENTLY "__document_key_id_package_resource_flponjq52v" ON "qti"."document" USING btree ("id", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_key_id_root_paefqkk7oi";

CREATE UNIQUE INDEX CONCURRENTLY "__document_key_id_root_paefqkk7oi" ON "qti"."document" USING btree ("id", "root");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_identifier_key_document_value_gsikqhluke";

CREATE UNIQUE INDEX CONCURRENTLY "__document_identifier_key_document_value_gsikqhluke" ON "qti"."document_identifier" USING btree ("document", "value");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_child_parent_kind_jv6mposiie";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_child_parent_kind_jv6mposiie" ON "qti"."edge" USING btree ("child", "parent_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__file_key_id_package_vf5ojq22ku";

CREATE UNIQUE INDEX CONCURRENTLY "__file_key_id_package_vf5ojq22ku" ON "qti"."file" USING btree ("id", "package");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_key_id_lom_position_o2ij2ew774";

CREATE UNIQUE INDEX CONCURRENTLY "__lom_identifier_key_id_lom_position_o2ij2ew774" ON "qti"."lom_identifier" USING btree ("id", "lom", "position");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_entry_key_identifier_apspsz6soo";

CREATE UNIQUE INDEX CONCURRENTLY "__lom_identifier_entry_key_identifier_apspsz6soo" ON "qti"."lom_identifier_entry" USING btree ("identifier");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx";

CREATE UNIQUE INDEX CONCURRENTLY "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx" ON "qti"."lom_identifier_entry" USING btree ("identifier", "lom", "position", "collapsed");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__package_key_id_identifier_udumz3ewib";

CREATE UNIQUE INDEX CONCURRENTLY "__package_key_id_identifier_udumz3ewib" ON "qti"."package" USING btree ("id", "identifier");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_key_id_host_fyvjheokoi";

CREATE UNIQUE INDEX CONCURRENTLY "__qti_metadata_key_id_host_fyvjheokoi" ON "qti"."qti_metadata" USING btree ("id", "host");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_key_id_package_resource_p622xz2moc";

CREATE UNIQUE INDEX CONCURRENTLY "__qti_metadata_key_id_package_resource_p622xz2moc" ON "qti"."qti_metadata" USING btree ("id", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__qti_metadata_key_package_resource_dwel7fxdsx";

CREATE UNIQUE INDEX CONCURRENTLY "__qti_metadata_key_package_resource_dwel7fxdsx" ON "qti"."qti_metadata" USING btree ("package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_key_id_package_identifier_jx53gsgn4j";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_key_id_package_identifier_jx53gsgn4j" ON "qti"."resource" USING btree ("id", "package", "identifier");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_lom_key_lom_package_resource_fcuxpt7bmm";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_lom_key_lom_package_resource_fcuxpt7bmm" ON "qti"."resource_lom" USING btree ("lom", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_metadata_key_id_resource_o7kyjomlg6";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_metadata_key_id_resource_o7kyjomlg6" ON "qti"."resource_metadata" USING btree ("id", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__tree_root_key_node_tree_7hmixcsgnx";

CREATE UNIQUE INDEX CONCURRENTLY "__tree_root_key_node_tree_7hmixcsgnx" ON "qti"."tree_root" USING btree ("node", "tree");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__tree_root_key_tree_node_p4ufjrhbsm";

CREATE UNIQUE INDEX CONCURRENTLY "__tree_root_key_tree_node_p4ufjrhbsm" ON "qti"."tree_root" USING btree ("tree", "node");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_aggregation_level_pweycamvch";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_aggregation_level_pweycamvch" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:aggregationLevel'::"qti"."node_kind" AND "parent_kind" = 'lom:general'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_catalog_parent_kind_ihaqxzmtrd";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_catalog_parent_kind_ihaqxzmtrd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:catalog'::"qti"."node_kind" AND "parent_kind" = 'lom:identifier'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_copyright_and_other_p233qj7pri";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_copyright_and_other_p233qj7pri" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:copyrightAndOtherRestrictions'::"qti"."node_kind" AND "parent_kind" = 'lom:rights'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_cost_parent_kind_af6v6li57c";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_cost_parent_kind_af6v6li57c" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:cost'::"qti"."node_kind" AND "parent_kind" = 'lom:rights'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_date_parent_kind_r74x2wu3c2";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_date_parent_kind_r74x2wu3c2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:date'::"qti"."node_kind" AND "parent_kind" = 'lom:annotation'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_date_parent_kind_nk2btnwjoi";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_date_parent_kind_nk2btnwjoi" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:date'::"qti"."node_kind" AND "parent_kind" = 'lom:contribute'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_date_time_parent_5cwanrcm62";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_date_time_parent_5cwanrcm62" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:dateTime'::"qti"."node_kind" AND "parent_kind" = 'lom:date'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_parent_p5d45av6gv";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_parent_p5d45av6gv" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:annotation'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_parent_tonc6pa4gh";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_parent_tonc6pa4gh" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:classification'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_parent_qlchudgs7g";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_parent_qlchudgs7g" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:date'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_parent_onjtnyxfgj";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_parent_onjtnyxfgj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:duration'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_parent_mjvnn2zhhe";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_parent_mjvnn2zhhe" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_parent_abwqbc32an";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_parent_abwqbc32an" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:rights'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_parent_vctc3yh7ww";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_parent_vctc3yh7ww" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind" AND "parent_kind" = 'lom:typicalLearningTime'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_difficulty_parent_ypebn2m2r2";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_difficulty_parent_ypebn2m2r2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:difficulty'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_duration_string_bdhvfggytr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_duration_string_bdhvfggytr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:duration.string'::"qti"."node_kind" AND "parent_kind" = 'lom:duration'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_duration_string_3rmbkk6got";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_duration_string_3rmbkk6got" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:duration.string'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_duration_string_ota3hs72wc";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_duration_string_ota3hs72wc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:duration.string'::"qti"."node_kind" AND "parent_kind" = 'lom:typicalLearningTime'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_entity_parent_kind_j4qh3ik7ma";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_entity_parent_kind_j4qh3ik7ma" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entity'::"qti"."node_kind" AND "parent_kind" = 'lom:annotation'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_entry_parent_kind_f7rw5vnlx4";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_entry_parent_kind_f7rw5vnlx4" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entry'::"qti"."node_kind" AND "parent_kind" = 'lom:identifier'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_entry_lang_string_mngsvnwj6v";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_entry_lang_string_mngsvnwj6v" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entry.langString'::"qti"."node_kind" AND "parent_kind" = 'lom:taxon'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_id_parent_kind_lom_2o3h7xqgww";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_id_parent_kind_lom_2o3h7xqgww" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:id'::"qti"."node_kind" AND "parent_kind" = 'lom:taxon'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_installation_szanhbe2zd";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_installation_szanhbe2zd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:installationRemarks'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_interactivity_level_3y7t5gxwja";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_interactivity_level_3y7t5gxwja" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:interactivityLevel'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_interactivity_type_75q5hnjgzp";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_interactivity_type_75q5hnjgzp" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:interactivityType'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_kind_parent_kind_7ve4be5ow2";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_kind_parent_kind_7ve4be5ow2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:kind'::"qti"."node_kind" AND "parent_kind" = 'lom:relation'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_language_parent_3mtge7ue5g";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_language_parent_3mtge7ue5g" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:language'::"qti"."node_kind" AND "parent_kind" = 'lom:metaMetadata'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_life_cycle_parent_vukxgkrvox";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_life_cycle_parent_vukxgkrvox" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:lifeCycle'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_maximum_version_q7xgrixbfj";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_maximum_version_q7xgrixbfj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:maximumVersion'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_meta_metadata_yipr7akta6";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_meta_metadata_yipr7akta6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:metaMetadata'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_minimum_version_bxc5vwhtck";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_minimum_version_bxc5vwhtck" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:minimumVersion'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_name_parent_kind_sqqohkrzcy";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_name_parent_kind_sqqohkrzcy" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:name'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_other_platform_gfzk3nb2ct";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_other_platform_gfzk3nb2ct" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:otherPlatformRequirements'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_purpose_parent_kind_46txoh3ocq";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_purpose_parent_kind_46txoh3ocq" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:purpose'::"qti"."node_kind" AND "parent_kind" = 'lom:classification'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_resource_parent_h3gaifq6dl";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_resource_parent_h3gaifq6dl" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:resource'::"qti"."node_kind" AND "parent_kind" = 'lom:relation'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_rights_parent_kind_ipzub5affx";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_rights_parent_kind_ipzub5affx" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:rights'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_role_parent_kind_l273misho2";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_role_parent_kind_l273misho2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:role'::"qti"."node_kind" AND "parent_kind" = 'lom:contribute'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_semantic_density_fs7svl3vzw";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_semantic_density_fs7svl3vzw" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:semanticDensity'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_size_parent_kind_hdawmmdkn2";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_size_parent_kind_hdawmmdkn2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:size'::"qti"."node_kind" AND "parent_kind" = 'lom:technical'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_yk4lm5usaa";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_yk4lm5usaa" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:aggregationLevel'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_skubndd32t";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_skubndd32t" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:context'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_b3tz7m5lih";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_b3tz7m5lih" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:copyrightAndOtherRestrictions'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_pgrn26lvfo";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_pgrn26lvfo" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:cost'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_63t53wy5yc";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_63t53wy5yc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:difficulty'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_6ysi7tdsqh";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_6ysi7tdsqh" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:intendedEndUserRole'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_hbwalfxhfq";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_hbwalfxhfq" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityLevel'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_hubo6jdliy";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_hubo6jdliy" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityType'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_elpfq5xmej";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_elpfq5xmej" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:kind'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_vv6pznchmv";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_vv6pznchmv" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:learningResourceType'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_gvswwoy3ue";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_gvswwoy3ue" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:name'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_6p5ozz64il";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_6p5ozz64il" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:purpose'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_d77hhuipt6";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_d77hhuipt6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:role'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_qh5iwtbz5n";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_qh5iwtbz5n" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:semanticDensity'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_5peedbfzqz";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_5peedbfzqz" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:status'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_dbnxo7bt77";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_dbnxo7bt77" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:structure'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_parent_kind_dxdjhiv4sd";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_parent_kind_dxdjhiv4sd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind" AND "parent_kind" = 'lom:type'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_lang_string_tvvsuzuapb";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_lang_string_tvvsuzuapb" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source.langString'::"qti"."node_kind" AND "parent_kind" = 'lom:taxonPath'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_status_parent_kind_wiuxo6wrny";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_status_parent_kind_wiuxo6wrny" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:status'::"qti"."node_kind" AND "parent_kind" = 'lom:lifeCycle'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_structure_parent_oipzxxpd6x";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_structure_parent_oipzxxpd6x" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:structure'::"qti"."node_kind" AND "parent_kind" = 'lom:general'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_technical_parent_etbtjwceww";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_technical_parent_etbtjwceww" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:technical'::"qti"."node_kind" AND "parent_kind" = 'lom:lom'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_type_parent_kind_pwtiuys23k";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_type_parent_kind_pwtiuys23k" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:type'::"qti"."node_kind" AND "parent_kind" = 'lom:orComposite'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_typical_learning_72dhi53t3t";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_typical_learning_72dhi53t3t" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:typicalLearningTime'::"qti"."node_kind" AND "parent_kind" = 'lom:educational'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_l3b3lvg3ty";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_l3b3lvg3ty" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:aggregationLevel'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_u3hj3qop5p";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_u3hj3qop5p" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:context'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_7vr3zrkeou";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_7vr3zrkeou" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:copyrightAndOtherRestrictions'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_f7f6hypjzi";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_f7f6hypjzi" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:cost'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_onsdqcjdls";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_onsdqcjdls" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:difficulty'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_hsr7kfafwc";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_hsr7kfafwc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:intendedEndUserRole'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_qtw5y7hph6";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_qtw5y7hph6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityLevel'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_vpxnkuqqlj";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_vpxnkuqqlj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:interactivityType'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_2kp6zijtjb";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_2kp6zijtjb" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:kind'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_mu34r7b5ny";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_mu34r7b5ny" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:learningResourceType'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_6v4trdflof";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_6v4trdflof" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:name'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_gavffjmso6";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_gavffjmso6" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:purpose'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_sdefgq3p2w";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_sdefgq3p2w" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:role'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_bd5ocmckqj";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_bd5ocmckqj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:semanticDensity'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_buahxvyalm";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_buahxvyalm" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:status'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_7lakol36rx";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_7lakol36rx" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:structure'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_parent_kind_zsx2h5fepw";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_parent_kind_zsx2h5fepw" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind" AND "parent_kind" = 'lom:type'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_version_parent_kind_pie6nez72p";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_version_parent_kind_pie6nez72p" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:version'::"qti"."node_kind" AND "parent_kind" = 'lom:lifeCycle'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_identifier_catalog_ix_identifier_lom_position_qdd3e3w32x";

CREATE INDEX CONCURRENTLY "__lom_identifier_catalog_ix_identifier_lom_position_qdd3e3w32x" ON "qti"."lom_identifier_catalog" USING btree ("identifier", "lom", "position");
