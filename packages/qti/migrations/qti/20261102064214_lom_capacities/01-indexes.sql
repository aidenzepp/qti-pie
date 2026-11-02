-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_aggregation_level_ohplcz3kw2";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_aggregation_level_ohplcz3kw2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:aggregationLevel'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_catalog_vt4ydkhpmm";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_catalog_vt4ydkhpmm" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:catalog'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_copyright_and_other_evq3hv5lpr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_copyright_and_other_evq3hv5lpr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:copyrightAndOtherRestrictions'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_cost_3d73wng4l4";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_cost_3d73wng4l4" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:cost'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_date_tns45f7k2l";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_date_tns45f7k2l" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:date'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_date_time_e2ucajt2n7";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_date_time_e2ucajt2n7" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:dateTime'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_description_7n64qtk2h2";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_description_7n64qtk2h2" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:description'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_difficulty_52tv7gg6qq";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_difficulty_52tv7gg6qq" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:difficulty'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_duration_string_ahlv7ozo5x";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_duration_string_ahlv7ozo5x" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:duration.string'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_entity_sgjjssgl5q";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_entity_sgjjssgl5q" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entity'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_entry_o3kzako2zt";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_entry_o3kzako2zt" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entry'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_entry_lang_string_j4cvdeowxh";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_entry_lang_string_j4cvdeowxh" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:entry.langString'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_id_dmfynqcxv4";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_id_dmfynqcxv4" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:id'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_installation_3cyhml44el";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_installation_3cyhml44el" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:installationRemarks'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_interactivity_level_v5alwbg5it";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_interactivity_level_v5alwbg5it" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:interactivityLevel'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_interactivity_type_sp3fypdbkr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_interactivity_type_sp3fypdbkr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:interactivityType'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_kind_nukyrk2bwt";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_kind_nukyrk2bwt" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:kind'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_language_376j4h6ako";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_language_376j4h6ako" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:language'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_life_cycle_qy7a3zgsqk";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_life_cycle_qy7a3zgsqk" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:lifeCycle'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_maximum_version_2264xgk7hr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_maximum_version_2264xgk7hr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:maximumVersion'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_meta_metadata_titauoedwd";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_meta_metadata_titauoedwd" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:metaMetadata'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_minimum_version_nlmky2nrqg";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_minimum_version_nlmky2nrqg" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:minimumVersion'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_name_7zssoxoxil";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_name_7zssoxoxil" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:name'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_other_platform_nkzoz7et6q";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_other_platform_nkzoz7et6q" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:otherPlatformRequirements'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_purpose_pna42sjlcc";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_purpose_pna42sjlcc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:purpose'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_resource_7kjpezuvkt";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_resource_7kjpezuvkt" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:resource'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_rights_2h72rlmkao";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_rights_2h72rlmkao" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:rights'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_role_iqmi2l3sxr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_role_iqmi2l3sxr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:role'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_semantic_density_6sxl6u3c6o";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_semantic_density_6sxl6u3c6o" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:semanticDensity'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_size_3cigexemnm";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_size_3cigexemnm" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:size'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_yn4bqtjmzh";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_yn4bqtjmzh" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_source_lang_string_yqnmkfgdbb";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_source_lang_string_yqnmkfgdbb" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:source.langString'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_status_ap6dhbgfdc";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_status_ap6dhbgfdc" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:status'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_structure_nh3ptdzpj4";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_structure_nh3ptdzpj4" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:structure'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_technical_3cbnj6wljn";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_technical_3cbnj6wljn" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:technical'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_type_nwzpmu3ggn";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_type_nwzpmu3ggn" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:type'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_typical_learning_begeqz22si";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_typical_learning_begeqz22si" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:typicalLearningTime'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_value_xaw3y7dghj";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_value_xaw3y7dghj" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:value'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_lom_version_ncq5pojfy3";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_lom_version_ncq5pojfy3" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'lom:version'::"qti"."node_kind";
