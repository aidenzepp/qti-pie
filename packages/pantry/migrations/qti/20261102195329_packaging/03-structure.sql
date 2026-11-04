DROP POLICY "qti__author" ON "qti"."tree_root";

DROP POLICY "qti__author" ON "qti"."resource_metadata";

DROP POLICY "qti__author" ON "qti"."resource_lom";

DROP POLICY "qti__author" ON "qti"."resource";

DROP POLICY "qti__author" ON "qti"."qti_metadata";

DROP POLICY "qti__author" ON "qti"."package";

DROP POLICY "qti__author" ON "qti"."outcome_declaration_arm";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."manifest_lom";

DROP POLICY "qti__author" ON "qti"."lom_value";

DROP POLICY "qti__author" ON "qti"."lom_object_identifier";

DROP POLICY "qti__author" ON "qti"."lom_identifier_entry";

DROP POLICY "qti__author" ON "qti"."lom_identifier_catalog";

DROP POLICY "qti__author" ON "qti"."lom_identifier";

DROP POLICY "qti__author" ON "qti"."lom";

DROP POLICY "qti__author" ON "qti"."file";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."document_identifier";

DROP POLICY "qti__author" ON "qti"."document";

DROP POLICY "qti__author" ON "qti"."declaration";

DROP VIEW "qti__author"."variable_weight_identifier";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."tree_root";

DROP VIEW "qti__author"."tree";

DROP VIEW "qti__author"."template_parameter_ref";

DROP VIEW "qti__author"."rule_operand";

DROP VIEW "qti__author"."root_of_type";

DROP VIEW "qti__author"."response_processing";

DROP VIEW "qti__author"."resource_metadata";

DROP VIEW "qti__author"."resource_lom";

DROP VIEW "qti__author"."resource";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."qti_metadata";

DROP VIEW "qti__author"."package";

DROP VIEW "qti__author"."outcome_min_max";

DROP VIEW "qti__author"."outcome_declaration_arm";

DROP VIEW "qti__author"."operator_arity_unbounded";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."manifest_lom";

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."lom_object_identifier";

DROP VIEW "qti__author"."lom_identifier_entry";

DROP VIEW "qti__author"."lom_identifier_catalog";

DROP VIEW "qti__author"."lom_identifier";

DROP VIEW "qti__author"."lom";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."file";

DROP VIEW "qti__author"."expression_max";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."document_title";

DROP VIEW "qti__author"."document_identifier";

DROP VIEW "qti__author"."document";

DROP VIEW "qti__author"."declared_ref";

DROP VIEW "qti__author"."declaration";

DROP VIEW "qti__author"."choice_interaction";

DROP VIEW "qti__author"."built_in_ref";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."admission";

ALTER TABLE "qti"."qti_metadata" DROP CONSTRAINT "__qti_metadata_fk_resource_y2rrzblzav";

ALTER TABLE "qti"."qti_metadata" DROP CONSTRAINT "__qti_metadata_key_resource_rnqab2cujf";

CREATE TABLE "qti"."access_for_all_resource" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  CONSTRAINT "__access_for_all_resource_pk_kr5wpjf4ev" PRIMARY KEY ("id"),
  CONSTRAINT "__access_for_all_resource_key_metadata_eocm4jdfj5" UNIQUE ("metadata")
);

CREATE TABLE "qti"."categorized_statistic_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__categorized_statistic_arm_pk_h7q3aym2ry" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_case_item_uri" (
  "id" uuid NOT NULL,
  "labelled_guid" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__csm_case_item_uri_pk_r33uv2vnpu" PRIMARY KEY ("id"),
  CONSTRAINT "__csm_case_item_uri_key_labelled_guid_oc7lijtbnj" UNIQUE ("labelled_guid")
);

CREATE TABLE "qti"."csm_guid" (
  "id" uuid NOT NULL,
  "labelled_guid" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_guid_pk_tntqoz5kks" PRIMARY KEY ("id"),
  CONSTRAINT "__csm_guid_key_labelled_guid_au6oxmpret" UNIQUE ("labelled_guid")
);

CREATE TABLE "qti"."csm_label" (
  "id" uuid NOT NULL,
  "labelled_guid" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_label_pk_cbfqww2dti" PRIMARY KEY ("id"),
  CONSTRAINT "__csm_label_key_labelled_guid_nxm46w3naf" UNIQUE ("labelled_guid")
);

CREATE TABLE "qti"."csm_labelled_guid" (
  "id" uuid NOT NULL,
  "set_of_guids" uuid NOT NULL,
  CONSTRAINT "__csm_labelled_guid_pk_4vbzo6kpar" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_metadata" (
  "id" uuid NOT NULL,
  "set" uuid NOT NULL,
  CONSTRAINT "__csm_metadata_pk_fmjai3sx4g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_metadata_provider_id" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_metadata_provider_id_pk_wzmprxwdsd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set" (
  "host" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__csm_set_pk_4i6g33ufcr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_set_of_guids" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  CONSTRAINT "__csm_set_of_guids_pk_b2mr24fnze" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_set_of_guids_region" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_of_guids_region_pk_atzpym3yi7" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set_of_guids_version" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_of_guids_version_pk_bkjdrvyale" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set_resource_label" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_resource_label_pk_vncnpqfiee" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set_resource_part_id" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_resource_part_id_pk_3gup3c6juq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_default_value" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_default_value_pk_eaeooi7rfq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."drd_access_mode" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_4f3dzz6i4f" NOT NULL,
  CONSTRAINT "__drd_access_mode_pk_eab4ksn3t5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_access_mode_adapted" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_4f3dzz6i4f" NOT NULL,
  CONSTRAINT "__drd_access_mode_adapted_pk_egxqwzwqtu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_adaptation_detail" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_sa4c4ywp5v" NOT NULL,
  CONSTRAINT "__drd_adaptation_detail_pk_jaiktkxtd5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_adaptation_media_type" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_2rz6hgcvt2" NOT NULL,
  CONSTRAINT "__drd_adaptation_media_type_pk_laoj4yvrwz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_adaptation_type" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_4adkkv4wal" NOT NULL,
  CONSTRAINT "__drd_adaptation_type_pk_hfpnvjly2m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_api_interoperable" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_xarz6cej2e" NOT NULL,
  CONSTRAINT "__drd_api_interoperable_pk_piemed6yeo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_at_interoperable" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__drd_at_interoperable_pk_d3v7xsw5ur" PRIMARY KEY ("id"),
  CONSTRAINT "__drd_at_interoperable_key_owner_p2miwggcue" UNIQUE ("owner")
);

CREATE TABLE "qti"."drd_control_flexibility" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_lsy6pxooea" NOT NULL,
  CONSTRAINT "__drd_control_flexibility_pk_4khcglwnjo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_display_transformability" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_d46tbgbbco" NOT NULL,
  CONSTRAINT "__drd_display_transformability_pk_slrde5ougf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_educational_complexity_of_adaptation" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_3zzmpysrx3" NOT NULL,
  CONSTRAINT "__drd_educational_complexity_of_adaptation_pk_5wijuzqco5" PRIMARY KEY ("id"),
  CONSTRAINT "__drd_educational_complexity_of_adaptation_key_owner_2a7j3lt6az" UNIQUE ("owner")
);

CREATE TABLE "qti"."drd_educational_level_of_adaptation" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__drd_educational_level_of_adaptation_pk_7plz4utccw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_has_adaptation" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__drd_has_adaptation_pk_verlwmupji" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_hazard" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_ukaaxf45sk" NOT NULL,
  CONSTRAINT "__drd_hazard_pk_3uqy5jjtai" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_is_adaptation_of" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__drd_is_adaptation_of_pk_q5eggfejhg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_is_full_adaptation_of" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__drd_is_full_adaptation_of_pk_h5i46jurdg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_is_partial_adaptation_of" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__drd_is_partial_adaptation_of_pk_h26cxdkvet" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_language_of_adaptation" (
  "id" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__drd_language_of_adaptation_pk_rotg7tsgr6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."external_lom" (
  "document" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__external_lom_pk_hhxtaxx7kt" PRIMARY KEY ("lom"),
  CONSTRAINT "__external_lom_key_package_resource_hxwjkfkaj7" UNIQUE ("package", "resource"),
  CONSTRAINT "__external_lom_key_lom_package_resource_tjboenutnb" UNIQUE ("lom", "package", "resource")
);

CREATE TABLE "qti"."file_lom" (
  "file" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__file_lom_pk_gj2z5oqrlb" PRIMARY KEY ("lom")
);

CREATE TABLE "qti"."file_metadata" (
  "file" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__file_metadata_pk_3xst2gux4o" PRIMARY KEY ("id"),
  CONSTRAINT "__file_metadata_key_file_tm4sdkskv6" UNIQUE ("file"),
  CONSTRAINT "__file_metadata_key_id_file_pbbxismiu4" UNIQUE ("id", "file")
);

CREATE TABLE "qti"."lom_annotation" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_annotation_pk_pahdalsdmw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_classification" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_classification_pk_sv4svz23wo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_context" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_context_pk_d3q5q7l6tv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_difficulty" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_difficulty_pk_izmwy4nlak" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_educational" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_educational_pk_obnzvqdy6m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_entry_lang_string" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_entry_lang_string_pk_ieu73vzaj3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_id" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_id_pk_m3vjr77vsc" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."lom_identifier" ADD COLUMN "parent" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."lom_identifier" ALTER COLUMN "parent" DROP DEFAULT;

CREATE TABLE "qti"."lom_intended_end_user_role" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_intended_end_user_role_pk_4ns4gxzj42" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_interactivity_level" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_interactivity_level_pk_smnf62qv23" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_interactivity_type" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_interactivity_type_pk_bs5vquvjc5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_kind" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_kind_pk_lvae7tdas3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_learning_resource_type" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_learning_resource_type_pk_nmjempx6wc" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."lom_object_identifier" ADD COLUMN "identifier" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."lom_object_identifier" ALTER COLUMN "identifier" DROP DEFAULT;

CREATE TABLE "qti"."lom_purpose" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_purpose_pk_icp6pnpvro" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_relation" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_relation_pk_gm4jfwfabn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_resource" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_resource_pk_jcjprudbpj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_semantic_density" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_semantic_density_pk_le3a5envz3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_source_lang_string" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_source_lang_string_pk_6aokne5mpu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_taxon" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_taxon_pk_23daz4igko" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_taxon_path" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_taxon_path_pk_22rkrrz3j6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_typical_age_range" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_typical_age_range_pk_3xmo44huiz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_typical_learning_time" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_typical_learning_time_pk_a3dl6vpcbh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."manifest_id" (
  "holder" "qti"."manifest_id_holder" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__manifest_id_pk_qzrdp24pyf" PRIMARY KEY ("package", "id"),
  CONSTRAINT "__manifest_id_key_package_id_holder_3bmpkpiao7" UNIQUE ("package", "id", "holder")
);

CREATE TABLE "qti"."manifest_id_of_manifest" (
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__manifest_id_of_manifest_pk_hll6ulewxl" PRIMARY KEY ("package", "id")
);

CREATE TABLE "qti"."manifest_id_of_resource" (
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__manifest_id_of_resource_pk_neqjtae66j" PRIMARY KEY ("package", "id")
);

CREATE TABLE "qti"."manifest_id_of_variant" (
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__manifest_id_of_variant_pk_mgmrbimez5" PRIMARY KEY ("package", "id")
);

CREATE TABLE "qti"."ordinary_statistic_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__ordinary_statistic_arm_pk_2atydtxqda" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_document" (
  "declaration" uuid NOT NULL,
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__outcome_document_pk_rmlhdozvqn" PRIMARY KEY ("document")
);


ALTER TABLE "qti"."qti_metadata" ADD COLUMN "host" "qti"."qti_metadata_host" DEFAULT 'metadata'::"qti"."qti_metadata_host" NOT NULL;
ALTER TABLE "qti"."qti_metadata" ALTER COLUMN "host" DROP DEFAULT;


ALTER TABLE "qti"."qti_metadata" ADD COLUMN "package" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."qti_metadata" ALTER COLUMN "package" DROP DEFAULT;

ALTER TABLE "qti"."qti_metadata" ALTER COLUMN "resource" TYPE "qti"."__text_rhdrzkabze" USING 'x'::"qti"."__text_rhdrzkabze";

CREATE TABLE "qti"."qti_metadata_in_external_lom" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__qti_metadata_in_external_lom_pk_wr7moirehy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qti_metadata_in_metadata" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "resource_node" uuid NOT NULL,
  CONSTRAINT "__qti_metadata_in_metadata_pk_6n7gq32ruf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qti_metadata_in_resource_lom" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__qti_metadata_in_resource_lom_pk_bc5j6sb4j4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."statistic" (
  "context" "qti"."__text_k3z6naurdo" NOT NULL,
  "id" uuid NOT NULL,
  "kind" "qti"."statistic_kind" NOT NULL,
  "name" "qti"."__text_rhdrzkabze" NOT NULL,
  "position" bigint NOT NULL,
  "usage_data" uuid NOT NULL,
  CONSTRAINT "__statistic_pk_2oijxhvzcy" PRIMARY KEY ("id"),
  CONSTRAINT "__statistic_key_id_kind_gigitdywst" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."statistic_case_count" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__statistic_case_count_pk_6bm5s5d2s5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_glossary" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__statistic_glossary_pk_2tcpbpbqth" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_last_updated" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_gjl5q4ofup" NOT NULL,
  CONSTRAINT "__statistic_last_updated_pk_h3evptcv4z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_std_deviation" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__statistic_std_deviation_pk_bhlxmss4jd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_std_error" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__statistic_std_error_pk_ztdamkayka" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."target_object" (
  "id" uuid NOT NULL,
  "identifier" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "position" bigint NOT NULL,
  "statistic" uuid NOT NULL,
  CONSTRAINT "__target_object_pk_ei76x42qsw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."target_object_object_type" (
  "node" uuid NOT NULL,
  "value" "qti"."target_object_type" NOT NULL,
  CONSTRAINT "__target_object_object_type_pk_2vn67xv5wf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."target_object_part_identifier" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__target_object_part_identifier_pk_voidrtx4no" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_data" (
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__usage_data_pk_eqdhp2h65o" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_data_key_document_afw2h62l5f" UNIQUE ("document")
);

CREATE TABLE "qti"."usage_data_glossary" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__usage_data_glossary_pk_is4opab36m" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_map_entry" (
  "id" uuid NOT NULL,
  "map_key" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "mapped_value" "qti"."__text_jld3q663or" NOT NULL,
  "mapping" uuid NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__usage_map_entry_pk_ohtxe2v3xe" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_map_entry_case_sensitive" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__usage_map_entry_case_sensitive_pk_2dhqvfbfnq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_mapping" (
  "default_value" "qti"."__text_jld3q663or" NOT NULL,
  "id" uuid NOT NULL,
  "statistic" uuid NOT NULL,
  CONSTRAINT "__usage_mapping_pk_fjex3ha54i" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_mapping_key_statistic_ml26jyw5me" UNIQUE ("statistic")
);

CREATE TABLE "qti"."usage_mapping_lower_bound" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__usage_mapping_lower_bound_pk_545vfbex4f" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_mapping_upper_bound" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__usage_mapping_upper_bound_pk_cfj37xex6z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_typed_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_typed_value_pk_co4ojdjfxi" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_typed_value_key_id_base_type_n242bzi26w" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."usage_typed_value_boolean" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__usage_typed_value_boolean_pk_goxiaczxth" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_directed_pair" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__usage_typed_value_directed_pair_pk_rdxysa6ezx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_duration" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__usage_typed_value_duration_pk_iknzbe3zpy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_file" (
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_typed_value_file_pk_jvdl27ylne" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_float" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__usage_typed_value_float_pk_zkonlclfg7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_identifier" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__usage_typed_value_identifier_pk_dhkfebawe7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_integer" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__usage_typed_value_integer_pk_ijoddnaeqm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_pair" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__usage_typed_value_pair_pk_eiy2hub3jo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_point" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__usage_typed_value_point_pk_uqgzdqkv3s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_string" (
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_typed_value_string_pk_sbvusmwwrs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_uri" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__usage_typed_value_uri_pk_7gc52aqoiu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_value" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "statistic" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_value_pk_i2ykr2qbnf" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_value_key_statistic_6izaekkxsa" UNIQUE ("statistic"),
  CONSTRAINT "__usage_value_key_id_value_34zlji3jcu" UNIQUE ("id", "value")
);

CREATE TABLE "qti"."usage_value_base_type" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__usage_value_base_type_pk_v6447uyhax" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_value_base_type_key_id_base_type_cmqbeas3nz" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."usage_value_field_identifier" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__usage_value_field_identifier_pk_o2efcppipi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."variant" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "identifierref" "qti"."__text_rhdrzkabze" NOT NULL,
  "package" uuid NOT NULL,
  "resource" uuid NOT NULL,
  "resource_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__variant_pk_2v76wn4lby" PRIMARY KEY ("id"),
  CONSTRAINT "__variant_key_package_identifier_ydffbrgs2g" UNIQUE ("package", "identifier"),
  CONSTRAINT "variant_not_self" CHECK (("identifierref" <> "resource_identifier") IS TRUE)
);

CREATE TABLE "qti"."variant_metadata" (
  "id" uuid NOT NULL,
  "variant" uuid NOT NULL,
  CONSTRAINT "__variant_metadata_pk_vsyvrlpnm2" PRIMARY KEY ("id"),
  CONSTRAINT "__variant_metadata_key_variant_7uhcph353w" UNIQUE ("variant")
);

ALTER TABLE "qti"."access_for_all_resource" ADD COLUMN "__tag_kind_drd_access_for_all_resource_dcvrnrucvz" "qti"."node_kind" GENERATED ALWAYS AS ('drd:accessForAllResource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."categorized_statistic_arm" ADD COLUMN "__tag_kind_ud_categorized_statistic_6idrz3enis" "qti"."node_kind" GENERATED ALWAYS AS ('ud:categorizedStatistic'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."categorized_statistic_arm" ADD COLUMN "__tag_kind_categorized_mbhnwjzukq" "qti"."statistic_kind" GENERATED ALWAYS AS ('categorized'::"qti"."statistic_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_case_item_uri" ADD COLUMN "__tag_kind_csmd_case_item_uri_lxp27cu62q" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:caseItemURI'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_guid" ADD COLUMN "__tag_kind_csmd_guid_zslp2vpfy4" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:GUID'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_label" ADD COLUMN "__tag_kind_csmd_label_fz6gvoerne" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:label'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_labelled_guid" ADD COLUMN "__tag_kind_csmd_labelled_guid_xvmt4w5scu" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:labelledGUID'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_metadata" ADD COLUMN "__tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:curriculumStandardsMetadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_set" ADD COLUMN "__tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:curriculumStandardsMetadataSet'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_set_of_guids" ADD COLUMN "__tag_kind_csmd_set_of_gui_ds_wsrxqslv22" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:setOfGUIDs'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_access_mode" ADD COLUMN "__tag_kind_drd_access_mode_njghsaxgib" "qti"."node_kind" GENERATED ALWAYS AS ('drd:accessMode'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD COLUMN "__tag_kind_drd_access_mode_adapted_6n47kwzvq4" "qti"."node_kind" GENERATED ALWAYS AS ('drd:accessModeAdapted'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_adaptation_detail" ADD COLUMN "__tag_kind_drd_adaptation_detail_q4chm2z7fd" "qti"."node_kind" GENERATED ALWAYS AS ('drd:adaptationDetail'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD COLUMN "__tag_kind_drd_adaptation_media_type_ms4x34iisf" "qti"."node_kind" GENERATED ALWAYS AS ('drd:adaptationMediaType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_adaptation_type" ADD COLUMN "__tag_kind_drd_adaptation_type_cr4axc6ol7" "qti"."node_kind" GENERATED ALWAYS AS ('drd:adaptationType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_api_interoperable" ADD COLUMN "__tag_kind_drd_api_interoperable_qnxbi5kb5p" "qti"."node_kind" GENERATED ALWAYS AS ('drd:apiInteroperable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_at_interoperable" ADD COLUMN "__tag_kind_drd_at_interoperable_zjkivbnkxx" "qti"."node_kind" GENERATED ALWAYS AS ('drd:atInteroperable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_control_flexibility" ADD COLUMN "__tag_kind_drd_control_flexibility_ogpln6c34g" "qti"."node_kind" GENERATED ALWAYS AS ('drd:controlFlexibility'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_display_transformability" ADD COLUMN "__tag_kind_drd_display_transformability_hlcmwybrbn" "qti"."node_kind" GENERATED ALWAYS AS ('drd:displayTransformability'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD COLUMN "__tag_kind_drd_educational_complexity_of_adaptation_mfzwmr74m2" "qti"."node_kind" GENERATED ALWAYS AS ('drd:educationalComplexityOfAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD COLUMN "__tag_kind_drd_educational_level_of_adaptation_ezcznxqajt" "qti"."node_kind" GENERATED ALWAYS AS ('drd:educationalLevelOfAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_has_adaptation" ADD COLUMN "__tag_kind_drd_has_adaptation_4x7nx53hok" "qti"."node_kind" GENERATED ALWAYS AS ('drd:hasAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_hazard" ADD COLUMN "__tag_kind_drd_hazard_3n5ihtfyij" "qti"."node_kind" GENERATED ALWAYS AS ('drd:hazard'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD COLUMN "__tag_kind_drd_is_adaptation_of_viq3qn3bmy" "qti"."node_kind" GENERATED ALWAYS AS ('drd:isAdaptationOf'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD COLUMN "__tag_kind_drd_is_full_adaptation_of_tvwox3ztrp" "qti"."node_kind" GENERATED ALWAYS AS ('drd:isFullAdaptationOf'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD COLUMN "__tag_kind_drd_is_partial_adaptation_of_5ojegjo7cp" "qti"."node_kind" GENERATED ALWAYS AS ('drd:isPartialAdaptationOf'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD COLUMN "__tag_kind_drd_language_of_adaptation_p3eiulmmnm" "qti"."node_kind" GENERATED ALWAYS AS ('drd:languageOfAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."external_lom" ADD COLUMN "__tag_root_external_lom_dv2arbt3fq" "qti"."root_kind" GENERATED ALWAYS AS ('externalLom'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."external_lom" ADD COLUMN "__tag_owner_external_yt3hiwiixf" "qti"."lom_owner" GENERATED ALWAYS AS ('external'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."file_lom" ADD COLUMN "__tag_owner_file_gyehcaynyu" "qti"."lom_owner" GENERATED ALWAYS AS ('file'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."file_metadata" ADD COLUMN "__tag_kind_cp_metadata_file_ec5cdzv4wr" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.file'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_annotation" ADD COLUMN "__tag_kind_lom_annotation_wmk4msekhm" "qti"."node_kind" GENERATED ALWAYS AS ('lom:annotation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_classification" ADD COLUMN "__tag_kind_lom_classification_s33zb3ydxx" "qti"."node_kind" GENERATED ALWAYS AS ('lom:classification'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_context" ADD COLUMN "__tag_kind_lom_context_unp6fhu2i5" "qti"."node_kind" GENERATED ALWAYS AS ('lom:context'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_difficulty" ADD COLUMN "__tag_kind_lom_difficulty_u6oh2pluob" "qti"."node_kind" GENERATED ALWAYS AS ('lom:difficulty'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_educational" ADD COLUMN "__tag_kind_lom_educational_bfejue5lpc" "qti"."node_kind" GENERATED ALWAYS AS ('lom:educational'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_entry_lang_string" ADD COLUMN "__tag_kind_lom_entry_lang_string_yr7dyefaw7" "qti"."node_kind" GENERATED ALWAYS AS ('lom:entry.langString'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_id" ADD COLUMN "__tag_kind_lom_id_qophyddse4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:id'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD COLUMN "__tag_kind_lom_intended_end_user_role_fu7zxsgpuk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:intendedEndUserRole'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_interactivity_level" ADD COLUMN "__tag_kind_lom_interactivity_level_42hqjwr3eg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:interactivityLevel'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_interactivity_type" ADD COLUMN "__tag_kind_lom_interactivity_type_mx3pzoaf7t" "qti"."node_kind" GENERATED ALWAYS AS ('lom:interactivityType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_kind" ADD COLUMN "__tag_kind_lom_kind_xuf2kkwyr4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:kind'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_learning_resource_type" ADD COLUMN "__tag_kind_lom_learning_resource_type_mm2kxi35r2" "qti"."node_kind" GENERATED ALWAYS AS ('lom:learningResourceType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_purpose" ADD COLUMN "__tag_kind_lom_purpose_qtsfpmrlct" "qti"."node_kind" GENERATED ALWAYS AS ('lom:purpose'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_relation" ADD COLUMN "__tag_kind_lom_relation_adpqqvr6or" "qti"."node_kind" GENERATED ALWAYS AS ('lom:relation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_resource" ADD COLUMN "__tag_kind_lom_resource_jgqpmzi3u4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_semantic_density" ADD COLUMN "__tag_kind_lom_semantic_density_uqmekskg64" "qti"."node_kind" GENERATED ALWAYS AS ('lom:semanticDensity'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_source_lang_string" ADD COLUMN "__tag_kind_lom_source_lang_string_3blfwn3hhk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:source.langString'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_taxon" ADD COLUMN "__tag_kind_lom_taxon_2gykitonjg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:taxon'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_taxon_path" ADD COLUMN "__tag_kind_lom_taxon_path_ifvs3xty7l" "qti"."node_kind" GENERATED ALWAYS AS ('lom:taxonPath'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_typical_age_range" ADD COLUMN "__tag_kind_lom_typical_age_range_b2nwhfufjs" "qti"."node_kind" GENERATED ALWAYS AS ('lom:typicalAgeRange'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_typical_learning_time" ADD COLUMN "__tag_kind_lom_typical_learning_time_jvgzdwqqg4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:typicalLearningTime'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_manifest" ADD COLUMN "__tag_holder_manifest_7wghkxashe" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('manifest'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_resource" ADD COLUMN "__tag_holder_resource_3lbxhuqadk" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('resource'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_variant" ADD COLUMN "__tag_holder_variant_yyymqmlpge" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('variant'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD COLUMN "__tag_kind_ud_ordinary_statistic_eakzbvyu36" "qti"."node_kind" GENERATED ALWAYS AS ('ud:ordinaryStatistic'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD COLUMN "__tag_kind_ordinary_nxdawqnzxk" "qti"."statistic_kind" GENERATED ALWAYS AS ('ordinary'::"qti"."statistic_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_document" ADD COLUMN "__tag_root_outcomes_5xb23aywsn" "qti"."root_kind" GENERATED ALWAYS AS ('outcomes'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD COLUMN "__tag_host_external_lom_zuf64srpbg" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('externalLom'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD COLUMN "__tag_host_metadata_knpb2q2kry" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('metadata'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD COLUMN "__tag_host_resource_lom_vu3w7ocz2u" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('resourceLom'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."target_object" ADD COLUMN "__tag_kind_ud_target_object_x2bagozuf2" "qti"."node_kind" GENERATED ALWAYS AS ('ud:targetObject'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_data" ADD COLUMN "__tag_root_usagedata_kjac3nie2g" "qti"."root_kind" GENERATED ALWAYS AS ('usagedata'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_data" ADD COLUMN "__tag_kind_ud_usage_data_xzkq4jszsr" "qti"."node_kind" GENERATED ALWAYS AS ('ud:usageData'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_map_entry" ADD COLUMN "__tag_kind_ud_map_entry_e3so66labc" "qti"."node_kind" GENERATED ALWAYS AS ('ud:mapEntry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_mapping" ADD COLUMN "__tag_kind_ud_mapping_nl4fsdrhrc" "qti"."node_kind" GENERATED ALWAYS AS ('ud:mapping'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_boolean" ADD COLUMN "__tag_base_type_boolean_spkprt4ifj" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_6ydufsu7xt" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_duration" ADD COLUMN "__tag_base_type_duration_74urvab32r" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_file" ADD COLUMN "__tag_base_type_file_v6agbrnksv" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_float" ADD COLUMN "__tag_base_type_float_vh6x7mgon6" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_identifier" ADD COLUMN "__tag_base_type_identifier_6sg34ylgx7" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_integer" ADD COLUMN "__tag_base_type_integer_yiuetnhqbm" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_pair" ADD COLUMN "__tag_base_type_pair_h5mswwpdzq" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_point" ADD COLUMN "__tag_base_type_point_whzxkpcubn" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_string" ADD COLUMN "__tag_base_type_string_ufr3c7ewnb" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_uri" ADD COLUMN "__tag_base_type_uri_4pugbs6w66" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_value" ADD COLUMN "__tag_kind_ud_value_7zu72u4s4m" "qti"."node_kind" GENERATED ALWAYS AS ('ud:value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variant" ADD COLUMN "__tag_kind_cpx_variant_zd5caenuzr" "qti"."node_kind" GENERATED ALWAYS AS ('cpx:variant'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variant_metadata" ADD COLUMN "__tag_kind_cpx_metadata_etdkl37kij" "qti"."node_kind" GENERATED ALWAYS AS ('cpx:metadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_value" ADD CONSTRAINT "lom_learning_resource_type" CHECK ((NOT "collapsed" IN ('self assessment'::text, 'exam'::text) OR "parent_kind" <> 'lom:learningResourceType'::"qti"."node_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_id_tag_kind_drd_access_tfbg7eqeci" FOREIGN KEY ("id", "__tag_kind_drd_access_for_all_resource_dcvrnrucvz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_id_metadata_xfrhrrhkhp" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_metadata_zxw7a2wvbn" FOREIGN KEY ("metadata") REFERENCES "qti"."variant_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."categorized_statistic_arm" ADD CONSTRAINT "__categorized_statistic_arm_fk_id_tag_kind_xmbqtsqu6q" FOREIGN KEY ("id", "__tag_kind_categorized_mbhnwjzukq") REFERENCES "qti"."statistic" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."categorized_statistic_arm" ADD CONSTRAINT "__categorized_statistic_arm_fk_id_tag_kind_ud_jylibsfa4q" FOREIGN KEY ("id", "__tag_kind_ud_categorized_statistic_6idrz3enis") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_case_item_uri" ADD CONSTRAINT "__csm_case_item_uri_fk_id_tag_kind_csmd_case_item_i6ewe5kn7k" FOREIGN KEY ("id", "__tag_kind_csmd_case_item_uri_lxp27cu62q") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_case_item_uri" ADD CONSTRAINT "__csm_case_item_uri_fk_id_labelled_guid_fwmtpxw3u5" FOREIGN KEY ("id", "labelled_guid") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_case_item_uri" ADD CONSTRAINT "__csm_case_item_uri_fk_labelled_guid_nzrvzpcidd" FOREIGN KEY ("labelled_guid") REFERENCES "qti"."csm_labelled_guid" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_guid" ADD CONSTRAINT "__csm_guid_fk_id_tag_kind_csmd_guid_zslp_2_vpfy_4_nwkt6gtnpi" FOREIGN KEY ("id", "__tag_kind_csmd_guid_zslp2vpfy4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_guid" ADD CONSTRAINT "__csm_guid_fk_id_labelled_guid_oaaq4osnd4" FOREIGN KEY ("id", "labelled_guid") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_guid" ADD CONSTRAINT "__csm_guid_fk_labelled_guid_5yqbw56ujc" FOREIGN KEY ("labelled_guid") REFERENCES "qti"."csm_labelled_guid" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_label" ADD CONSTRAINT "__csm_label_fk_id_tag_kind_csmd_label_fz_6_gvoerne_7gcay67gr5" FOREIGN KEY ("id", "__tag_kind_csmd_label_fz6gvoerne") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_label" ADD CONSTRAINT "__csm_label_fk_id_labelled_guid_6l5lljoiac" FOREIGN KEY ("id", "labelled_guid") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_label" ADD CONSTRAINT "__csm_label_fk_labelled_guid_hown6ftcvg" FOREIGN KEY ("labelled_guid") REFERENCES "qti"."csm_labelled_guid" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_labelled_guid" ADD CONSTRAINT "__csm_labelled_guid_fk_id_tag_kind_csmd_labelled_5gragyazhx" FOREIGN KEY ("id", "__tag_kind_csmd_labelled_guid_xvmt4w5scu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_labelled_guid" ADD CONSTRAINT "__csm_labelled_guid_fk_id_set_of_guids_fyca6j7pe4" FOREIGN KEY ("id", "set_of_guids") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_labelled_guid" ADD CONSTRAINT "__csm_labelled_guid_fk_set_of_guids_gdhcsqzbjr" FOREIGN KEY ("set_of_guids") REFERENCES "qti"."csm_set_of_guids" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata" ADD CONSTRAINT "__csm_metadata_fk_id_tag_kind_csmd_curriculum_rp6lbinb7h" FOREIGN KEY ("id", "__tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata" ADD CONSTRAINT "__csm_metadata_fk_id_set_y3tcs7o6ng" FOREIGN KEY ("id", "set") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata" ADD CONSTRAINT "__csm_metadata_fk_set_l7csoijnrc" FOREIGN KEY ("set") REFERENCES "qti"."csm_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata_provider_id" ADD CONSTRAINT "__csm_metadata_provider_id_fk_node_wf5ryn5udk" FOREIGN KEY ("node") REFERENCES "qti"."csm_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set" ADD CONSTRAINT "__csm_set_fk_id_tag_kind_csmd_curriculum_standards_kx5n6ykiwt" FOREIGN KEY ("id", "__tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set" ADD CONSTRAINT "__csm_set_fk_id_host_4hmsoh7xah" FOREIGN KEY ("id", "host") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids" ADD CONSTRAINT "__csm_set_of_guids_fk_id_tag_kind_csmd_set_of_gui_ds_ajy6f5qrwt" FOREIGN KEY ("id", "__tag_kind_csmd_set_of_gui_ds_wsrxqslv22") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids" ADD CONSTRAINT "__csm_set_of_guids_fk_id_metadata_uzbadimt7q" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids" ADD CONSTRAINT "__csm_set_of_guids_fk_metadata_h4nbya5u2v" FOREIGN KEY ("metadata") REFERENCES "qti"."csm_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids_region" ADD CONSTRAINT "__csm_set_of_guids_region_fk_node_4bagvupzr4" FOREIGN KEY ("node") REFERENCES "qti"."csm_set_of_guids" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids_version" ADD CONSTRAINT "__csm_set_of_guids_version_fk_node_q2tuoj34tt" FOREIGN KEY ("node") REFERENCES "qti"."csm_set_of_guids" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_resource_label" ADD CONSTRAINT "__csm_set_resource_label_fk_node_adhanmu3bb" FOREIGN KEY ("node") REFERENCES "qti"."csm_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_resource_part_id" ADD CONSTRAINT "__csm_set_resource_part_id_fk_node_pdnb6d7hps" FOREIGN KEY ("node") REFERENCES "qti"."csm_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_default_value" ADD CONSTRAINT "__declared_default_value_fk_node_sc62hbnaee" FOREIGN KEY ("node") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode" ADD CONSTRAINT "__drd_access_mode_fk_id_tag_kind_drd_access_mode_vuxjxmmlzw" FOREIGN KEY ("id", "__tag_kind_drd_access_mode_njghsaxgib") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode" ADD CONSTRAINT "__drd_access_mode_fk_id_owner_rn7ubxr6fm" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode" ADD CONSTRAINT "__drd_access_mode_fk_owner_jzvejnp7gm" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD CONSTRAINT "__drd_access_mode_adapted_fk_id_tag_kind_drd_access_7vr72hwvgw" FOREIGN KEY ("id", "__tag_kind_drd_access_mode_adapted_6n47kwzvq4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD CONSTRAINT "__drd_access_mode_adapted_fk_id_owner_an2mivqfcv" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD CONSTRAINT "__drd_access_mode_adapted_fk_owner_wbdqipwa67" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_detail" ADD CONSTRAINT "__drd_adaptation_detail_fk_id_tag_kind_drd_exjqq7blbz" FOREIGN KEY ("id", "__tag_kind_drd_adaptation_detail_q4chm2z7fd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_detail" ADD CONSTRAINT "__drd_adaptation_detail_fk_id_owner_lrm72yi2bp" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_detail" ADD CONSTRAINT "__drd_adaptation_detail_fk_owner_p6k6ryibwf" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD CONSTRAINT "__drd_adaptation_media_type_fk_id_tag_kind_drd_b576jcpkfd" FOREIGN KEY ("id", "__tag_kind_drd_adaptation_media_type_ms4x34iisf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD CONSTRAINT "__drd_adaptation_media_type_fk_id_owner_flyzlynmlg" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD CONSTRAINT "__drd_adaptation_media_type_fk_owner_ofx2n4dzrq" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_type" ADD CONSTRAINT "__drd_adaptation_type_fk_id_tag_kind_drd_adaptation_mkwzx225pn" FOREIGN KEY ("id", "__tag_kind_drd_adaptation_type_cr4axc6ol7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_type" ADD CONSTRAINT "__drd_adaptation_type_fk_id_owner_lvvmww4mmu" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_type" ADD CONSTRAINT "__drd_adaptation_type_fk_owner_3oowyhvioq" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_api_interoperable" ADD CONSTRAINT "__drd_api_interoperable_fk_id_tag_kind_drd_api_ir7glc237l" FOREIGN KEY ("id", "__tag_kind_drd_api_interoperable_qnxbi5kb5p") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_api_interoperable" ADD CONSTRAINT "__drd_api_interoperable_fk_id_owner_cxjwz34g42" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_api_interoperable" ADD CONSTRAINT "__drd_api_interoperable_fk_owner_yqohhnuw6p" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_at_interoperable" ADD CONSTRAINT "__drd_at_interoperable_fk_id_tag_kind_drd_at_mjka4ackmf" FOREIGN KEY ("id", "__tag_kind_drd_at_interoperable_zjkivbnkxx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_at_interoperable" ADD CONSTRAINT "__drd_at_interoperable_fk_id_owner_hk2hm45sxf" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_at_interoperable" ADD CONSTRAINT "__drd_at_interoperable_fk_owner_e52xbcn3hb" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_control_flexibility" ADD CONSTRAINT "__drd_control_flexibility_fk_id_tag_kind_drd_control_vfpbix2kua" FOREIGN KEY ("id", "__tag_kind_drd_control_flexibility_ogpln6c34g") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_control_flexibility" ADD CONSTRAINT "__drd_control_flexibility_fk_id_owner_5hrfwrw7en" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_control_flexibility" ADD CONSTRAINT "__drd_control_flexibility_fk_owner_pcgv3lf3mm" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_display_transformability" ADD CONSTRAINT "__drd_display_transformability_fk_id_tag_kind_drd_jybpwfkthu" FOREIGN KEY ("id", "__tag_kind_drd_display_transformability_hlcmwybrbn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_display_transformability" ADD CONSTRAINT "__drd_display_transformability_fk_id_owner_wlolwxvc5z" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_display_transformability" ADD CONSTRAINT "__drd_display_transformability_fk_owner_7vr6dpp3m4" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_id_tag_iditd5uyhp" FOREIGN KEY ("id", "__tag_kind_drd_educational_complexity_of_adaptation_mfzwmr74m2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_id_ewfvtarag3" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_owner_sw4eaoxuwe" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD CONSTRAINT "__drd_educational_level_of_adaptation_fk_id_tag_kind_m5jrqt3fve" FOREIGN KEY ("id", "__tag_kind_drd_educational_level_of_adaptation_ezcznxqajt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD CONSTRAINT "__drd_educational_level_of_adaptation_fk_id_owner_smy723fsu5" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD CONSTRAINT "__drd_educational_level_of_adaptation_fk_owner_r5kgg27jjw" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_has_adaptation" ADD CONSTRAINT "__drd_has_adaptation_fk_id_tag_kind_drd_has_36m2bsoxuy" FOREIGN KEY ("id", "__tag_kind_drd_has_adaptation_4x7nx53hok") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_has_adaptation" ADD CONSTRAINT "__drd_has_adaptation_fk_id_owner_fin43w3cci" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_has_adaptation" ADD CONSTRAINT "__drd_has_adaptation_fk_owner_4uklqawtxz" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_hazard" ADD CONSTRAINT "__drd_hazard_fk_id_tag_kind_drd_hazard_3_n_5_ihtfyij_dantc7k2rm" FOREIGN KEY ("id", "__tag_kind_drd_hazard_3n5ihtfyij") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_hazard" ADD CONSTRAINT "__drd_hazard_fk_id_owner_fw6qwjvuan" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_hazard" ADD CONSTRAINT "__drd_hazard_fk_owner_j66pae5hpj" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD CONSTRAINT "__drd_is_adaptation_of_fk_id_tag_kind_drd_is_op6hhr7uxb" FOREIGN KEY ("id", "__tag_kind_drd_is_adaptation_of_viq3qn3bmy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD CONSTRAINT "__drd_is_adaptation_of_fk_id_owner_k3kokwweg7" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD CONSTRAINT "__drd_is_adaptation_of_fk_owner_2jbu57gyfx" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD CONSTRAINT "__drd_is_full_adaptation_of_fk_id_tag_kind_drd_is_oigemsrwkx" FOREIGN KEY ("id", "__tag_kind_drd_is_full_adaptation_of_tvwox3ztrp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD CONSTRAINT "__drd_is_full_adaptation_of_fk_id_owner_m77kbgb332" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD CONSTRAINT "__drd_is_full_adaptation_of_fk_owner_uulxxpv45w" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD CONSTRAINT "__drd_is_partial_adaptation_of_fk_id_tag_kind_drd_is_ct2d4bsqnu" FOREIGN KEY ("id", "__tag_kind_drd_is_partial_adaptation_of_5ojegjo7cp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD CONSTRAINT "__drd_is_partial_adaptation_of_fk_id_owner_vpnno7y2hr" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD CONSTRAINT "__drd_is_partial_adaptation_of_fk_owner_aq2gyhxpjy" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD CONSTRAINT "__drd_language_of_adaptation_fk_id_tag_kind_drd_e7yff3ecq2" FOREIGN KEY ("id", "__tag_kind_drd_language_of_adaptation_p3eiulmmnm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD CONSTRAINT "__drd_language_of_adaptation_fk_id_owner_quhzgdhsum" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD CONSTRAINT "__drd_language_of_adaptation_fk_owner_izhddtm3go" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_tag_owner_external_yt_3_po4evf3fs2" FOREIGN KEY ("lom", "__tag_owner_external_yt3hiwiixf") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_package_5kjzf5zk6j" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_tag_owner_file_gyehcaynyu_wwsmm2yqrr" FOREIGN KEY ("lom", "__tag_owner_file_gyehcaynyu") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_metadata_4fdumrj4ds" FOREIGN KEY ("lom", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_package_3awnniv4xf" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_package_jdvawz4chd" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_metadata_file_6pywi74w2y" FOREIGN KEY ("metadata", "file") REFERENCES "qti"."file_metadata" ("id", "file");

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_file_5wy6mgwjgi" FOREIGN KEY ("file") REFERENCES "qti"."file" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_id_tag_kind_cp_metadata_file_ec_5_jjpl4lfsb7" FOREIGN KEY ("id", "__tag_kind_cp_metadata_file_ec5cdzv4wr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_id_file_6z66x37ioo" FOREIGN KEY ("id", "file") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_id_tag_kind_lom_annotation_wmk_4_lavkjljdee" FOREIGN KEY ("id", "__tag_kind_lom_annotation_wmk4msekhm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_id_lom_fvl6yckn7w" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_lom_zekvm5wtoq" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_id_tag_kind_lom_2chxdeo54b" FOREIGN KEY ("id", "__tag_kind_lom_classification_s33zb3ydxx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_id_lom_lbzjzocrka" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_lom_oe4atcfgdx" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_context" ADD CONSTRAINT "__lom_context_fk_id_tag_kind_lom_context_unp_6_fhu_2_uutdmnxs3j" FOREIGN KEY ("id", "__tag_kind_lom_context_unp6fhu2i5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_context" ADD CONSTRAINT "__lom_context_fk_lom_y2fvbzxfmp" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_difficulty" ADD CONSTRAINT "__lom_difficulty_fk_id_tag_kind_lom_difficulty_u_6_f6wuieia5v" FOREIGN KEY ("id", "__tag_kind_lom_difficulty_u6oh2pluob") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_difficulty" ADD CONSTRAINT "__lom_difficulty_fk_lom_qtl7zjkhp4" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_id_tag_kind_lom_educational_u2hj6zfswu" FOREIGN KEY ("id", "__tag_kind_lom_educational_bfejue5lpc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_id_lom_lkprbuhw2p" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_lom_cwyavg2yop" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entry_lang_string" ADD CONSTRAINT "__lom_entry_lang_string_fk_id_tag_kind_lom_entry_gmkubnhnma" FOREIGN KEY ("id", "__tag_kind_lom_entry_lang_string_yr7dyefaw7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entry_lang_string" ADD CONSTRAINT "__lom_entry_lang_string_fk_lom_t3jwxa4puv" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_id" ADD CONSTRAINT "__lom_id_fk_id_tag_kind_lom_id_qophyddse_4_dn4cdvz5zw" FOREIGN KEY ("id", "__tag_kind_lom_id_qophyddse4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_id_parent_position_rhykptsoqt" FOREIGN KEY ("id", "parent", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD CONSTRAINT "__lom_intended_end_user_role_fk_id_tag_kind_lom_egpc75apis" FOREIGN KEY ("id", "__tag_kind_lom_intended_end_user_role_fu7zxsgpuk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD CONSTRAINT "__lom_intended_end_user_role_fk_lom_ktfhs6wv7t" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_level" ADD CONSTRAINT "__lom_interactivity_level_fk_id_tag_kind_lom_aiamt7iwqo" FOREIGN KEY ("id", "__tag_kind_lom_interactivity_level_42hqjwr3eg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_level" ADD CONSTRAINT "__lom_interactivity_level_fk_lom_sbe3wkv47z" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_type" ADD CONSTRAINT "__lom_interactivity_type_fk_id_tag_kind_lom_r22zgwluzg" FOREIGN KEY ("id", "__tag_kind_lom_interactivity_type_mx3pzoaf7t") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_type" ADD CONSTRAINT "__lom_interactivity_type_fk_lom_ttjit342cz" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_kind" ADD CONSTRAINT "__lom_kind_fk_id_tag_kind_lom_kind_xuf_2_kkwyr_4_zz5lccb55i" FOREIGN KEY ("id", "__tag_kind_lom_kind_xuf2kkwyr4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_kind" ADD CONSTRAINT "__lom_kind_fk_lom_x5v72f33di" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_learning_resource_type" ADD CONSTRAINT "__lom_learning_resource_type_fk_id_tag_kind_lom_7uw7egcsk5" FOREIGN KEY ("id", "__tag_kind_lom_learning_resource_type_mm2kxi35r2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_learning_resource_type" ADD CONSTRAINT "__lom_learning_resource_type_fk_lom_u64xh2vyxm" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_purpose" ADD CONSTRAINT "__lom_purpose_fk_id_tag_kind_lom_purpose_qtsfpmrlct_nobdk2jbas" FOREIGN KEY ("id", "__tag_kind_lom_purpose_qtsfpmrlct") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_purpose" ADD CONSTRAINT "__lom_purpose_fk_lom_xy4taailou" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_id_tag_kind_lom_relation_adpqqvr_6_6cfiwwa7tj" FOREIGN KEY ("id", "__tag_kind_lom_relation_adpqqvr6or") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_id_lom_zmkhto22ty" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_lom_gmpdl7y72h" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_resource" ADD CONSTRAINT "__lom_resource_fk_id_tag_kind_lom_resource_jgqpmzi_3_6qi7ptxdfc" FOREIGN KEY ("id", "__tag_kind_lom_resource_jgqpmzi3u4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_resource" ADD CONSTRAINT "__lom_resource_fk_lom_jmhhitoiys" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_semantic_density" ADD CONSTRAINT "__lom_semantic_density_fk_id_tag_kind_lom_semantic_4fn5sxcuig" FOREIGN KEY ("id", "__tag_kind_lom_semantic_density_uqmekskg64") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_semantic_density" ADD CONSTRAINT "__lom_semantic_density_fk_lom_dxydczl7vk" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source_lang_string" ADD CONSTRAINT "__lom_source_lang_string_fk_id_tag_kind_lom_source_r7qdlilqsg" FOREIGN KEY ("id", "__tag_kind_lom_source_lang_string_3blfwn3hhk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source_lang_string" ADD CONSTRAINT "__lom_source_lang_string_fk_lom_z7zml3al6y" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon" ADD CONSTRAINT "__lom_taxon_fk_id_tag_kind_lom_taxon_2_gykitonjg_zavitntcvd" FOREIGN KEY ("id", "__tag_kind_lom_taxon_2gykitonjg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon" ADD CONSTRAINT "__lom_taxon_fk_lom_5mvtruica4" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon_path" ADD CONSTRAINT "__lom_taxon_path_fk_id_tag_kind_lom_taxon_path_ifvs_tq7eupudq3" FOREIGN KEY ("id", "__tag_kind_lom_taxon_path_ifvs3xty7l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon_path" ADD CONSTRAINT "__lom_taxon_path_fk_lom_k3h74twnz6" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_age_range" ADD CONSTRAINT "__lom_typical_age_range_fk_id_tag_kind_lom_typical_ioa2kacvy3" FOREIGN KEY ("id", "__tag_kind_lom_typical_age_range_b2nwhfufjs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_age_range" ADD CONSTRAINT "__lom_typical_age_range_fk_lom_mvwf7dmhci" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_learning_time" ADD CONSTRAINT "__lom_typical_learning_time_fk_id_tag_kind_lom_43cggo65yx" FOREIGN KEY ("id", "__tag_kind_lom_typical_learning_time_jvgzdwqqg4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_learning_time" ADD CONSTRAINT "__lom_typical_learning_time_fk_lom_rybcun2wt3" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id" ADD CONSTRAINT "__manifest_id_fk_package_yrywtozstf" FOREIGN KEY ("package") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_manifest" ADD CONSTRAINT "__manifest_id_of_manifest_fk_package_id_tag_holder_hcdzuklnac" FOREIGN KEY ("package", "id", "__tag_holder_manifest_7wghkxashe") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_resource" ADD CONSTRAINT "__manifest_id_of_resource_fk_package_id_moulqn3fj4" FOREIGN KEY ("package", "id") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_resource" ADD CONSTRAINT "__manifest_id_of_resource_fk_package_id_tag_holder_zdlxck3tn7" FOREIGN KEY ("package", "id", "__tag_holder_resource_3lbxhuqadk") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_variant" ADD CONSTRAINT "__manifest_id_of_variant_fk_package_id_huvjqiu33v" FOREIGN KEY ("package", "id") REFERENCES "qti"."variant" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_variant" ADD CONSTRAINT "__manifest_id_of_variant_fk_package_id_tag_holder_jf7shcoyrs" FOREIGN KEY ("package", "id", "__tag_holder_variant_yyymqmlpge") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_package_a6edccbozn" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ordinary_dilt5z26qb" FOREIGN KEY ("id", "__tag_kind_ordinary_nxdawqnzxk") REFERENCES "qti"."statistic" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ud_ordinary_zseoy5wvrj" FOREIGN KEY ("id", "__tag_kind_ud_ordinary_statistic_eakzbvyu36") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_declaration_lvjuav56en" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_declaration_document_d6q5lquv7z" FOREIGN KEY ("declaration", "document", "identifier") REFERENCES "qti"."declaration" ("id", "document", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc" FOREIGN KEY ("id", "identifier") REFERENCES "qti"."manifest_id_of_manifest" ("package", "id") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_lom_r3vzadspmn" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_lom_package_iml635ey3w" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."external_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_metadata_amwofuqajo" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_lom_66wahx7d6l" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv" FOREIGN KEY ("package", "identifier") REFERENCES "qti"."manifest_id_of_resource" ("package", "id") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_package_z2mqb4ohk3" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."statistic" ADD CONSTRAINT "__statistic_fk_id_usage_data_position_pmfnjsi4aj" FOREIGN KEY ("id", "usage_data", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic" ADD CONSTRAINT "__statistic_fk_usage_data_nwoajmad6i" FOREIGN KEY ("usage_data") REFERENCES "qti"."usage_data" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_case_count" ADD CONSTRAINT "__statistic_case_count_fk_node_pvxufr7h5c" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_glossary" ADD CONSTRAINT "__statistic_glossary_fk_node_7nzjz7ttzn" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_last_updated" ADD CONSTRAINT "__statistic_last_updated_fk_node_qrhiuxql3v" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_std_deviation" ADD CONSTRAINT "__statistic_std_deviation_fk_node_7zxcnqmijw" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_std_error" ADD CONSTRAINT "__statistic_std_error_fk_node_ku6rxsvhg2" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object" ADD CONSTRAINT "__target_object_fk_id_tag_kind_ud_target_object_x_2_arc7hkfmij" FOREIGN KEY ("id", "__tag_kind_ud_target_object_x2bagozuf2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object" ADD CONSTRAINT "__target_object_fk_id_statistic_position_vyq6q4dl7z" FOREIGN KEY ("id", "statistic", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object" ADD CONSTRAINT "__target_object_fk_statistic_ydn64n4rjx" FOREIGN KEY ("statistic") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object_object_type" ADD CONSTRAINT "__target_object_object_type_fk_node_whzj65dcmc" FOREIGN KEY ("node") REFERENCES "qti"."target_object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object_part_identifier" ADD CONSTRAINT "__target_object_part_identifier_fk_node_jtw7qkfdkl" FOREIGN KEY ("node") REFERENCES "qti"."target_object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_id_tag_kind_ud_usage_data_xzkq_4_mlglt3k4yv" FOREIGN KEY ("id", "__tag_kind_ud_usage_data_xzkq4jszsr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data_glossary" ADD CONSTRAINT "__usage_data_glossary_fk_node_j7hz4j2c25" FOREIGN KEY ("node") REFERENCES "qti"."usage_data" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry" ADD CONSTRAINT "__usage_map_entry_fk_id_tag_kind_ud_map_entry_e_3_so_fnhcgcwa2p" FOREIGN KEY ("id", "__tag_kind_ud_map_entry_e3so66labc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry" ADD CONSTRAINT "__usage_map_entry_fk_id_mapping_position_pi57v4cipv" FOREIGN KEY ("id", "mapping", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry" ADD CONSTRAINT "__usage_map_entry_fk_mapping_lptlqa5gyp" FOREIGN KEY ("mapping") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry_case_sensitive" ADD CONSTRAINT "__usage_map_entry_case_sensitive_fk_node_a7var5u5qn" FOREIGN KEY ("node") REFERENCES "qti"."usage_map_entry" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping" ADD CONSTRAINT "__usage_mapping_fk_id_tag_kind_ud_mapping_nl_4_jppxeru7v7" FOREIGN KEY ("id", "__tag_kind_ud_mapping_nl4fsdrhrc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping" ADD CONSTRAINT "__usage_mapping_fk_id_statistic_gtwrdya3qz" FOREIGN KEY ("id", "statistic") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping_lower_bound" ADD CONSTRAINT "__usage_mapping_lower_bound_fk_node_3itc26e3f5" FOREIGN KEY ("node") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping_upper_bound" ADD CONSTRAINT "__usage_mapping_upper_bound_fk_node_ldmos5mii4" FOREIGN KEY ("node") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value" ADD CONSTRAINT "__usage_typed_value_fk_id_uu2uyhgqsy" FOREIGN KEY ("id") REFERENCES "qti"."usage_value_base_type" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value" ADD CONSTRAINT "__usage_typed_value_fk_id_base_type_zuxw6by5wn" FOREIGN KEY ("id", "base_type") REFERENCES "qti"."usage_value_base_type" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value" ADD CONSTRAINT "__usage_typed_value_fk_id_value_tr2d2dqibn" FOREIGN KEY ("id", "value") REFERENCES "qti"."usage_value" ("id", "value") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_boolean" ADD CONSTRAINT "__usage_typed_value_boolean_fk_id_tag_base_type_tqwdn5p2wh" FOREIGN KEY ("id", "__tag_base_type_boolean_spkprt4ifj") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_directed_pair" ADD CONSTRAINT "__usage_typed_value_directed_pair_fk_id_tag_base_bchux5z64z" FOREIGN KEY ("id", "__tag_base_type_directed_pair_6ydufsu7xt") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_duration" ADD CONSTRAINT "__usage_typed_value_duration_fk_id_tag_base_type_rzbhw32hn5" FOREIGN KEY ("id", "__tag_base_type_duration_74urvab32r") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_file" ADD CONSTRAINT "__usage_typed_value_file_fk_id_tag_base_type_file_v_xfjvrhb7ri" FOREIGN KEY ("id", "__tag_base_type_file_v6agbrnksv") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_float" ADD CONSTRAINT "__usage_typed_value_float_fk_id_tag_base_type_float_emezkpqu56" FOREIGN KEY ("id", "__tag_base_type_float_vh6x7mgon6") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_identifier" ADD CONSTRAINT "__usage_typed_value_identifier_fk_id_tag_base_type_6fq5ir4ajo" FOREIGN KEY ("id", "__tag_base_type_identifier_6sg34ylgx7") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_integer" ADD CONSTRAINT "__usage_typed_value_integer_fk_id_tag_base_type_b2r4e3dhf4" FOREIGN KEY ("id", "__tag_base_type_integer_yiuetnhqbm") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_pair" ADD CONSTRAINT "__usage_typed_value_pair_fk_id_tag_base_type_pair_h_uaze3kxylj" FOREIGN KEY ("id", "__tag_base_type_pair_h5mswwpdzq") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_point" ADD CONSTRAINT "__usage_typed_value_point_fk_id_tag_base_type_point_3omhonedtf" FOREIGN KEY ("id", "__tag_base_type_point_whzxkpcubn") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_string" ADD CONSTRAINT "__usage_typed_value_string_fk_id_tag_base_type_knofdg2zac" FOREIGN KEY ("id", "__tag_base_type_string_ufr3c7ewnb") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_uri" ADD CONSTRAINT "__usage_typed_value_uri_fk_id_tag_base_type_uri_4_qsesxo5oey" FOREIGN KEY ("id", "__tag_base_type_uri_4pugbs6w66") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value" ADD CONSTRAINT "__usage_value_fk_id_tag_kind_ud_value_7_zu_72_u_4_s_4hinav4ri5" FOREIGN KEY ("id", "__tag_kind_ud_value_7zu72u4s4m") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value" ADD CONSTRAINT "__usage_value_fk_id_statistic_a4hdimdyxe" FOREIGN KEY ("id", "statistic") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value_base_type" ADD CONSTRAINT "__usage_value_base_type_fk_id_y5x74dm56h" FOREIGN KEY ("id") REFERENCES "qti"."usage_typed_value" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value_base_type" ADD CONSTRAINT "__usage_value_base_type_fk_id_hev5rwn234" FOREIGN KEY ("id") REFERENCES "qti"."usage_value" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value_field_identifier" ADD CONSTRAINT "__usage_value_field_identifier_fk_id_eew5qxaz6q" FOREIGN KEY ("id") REFERENCES "qti"."usage_value" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_id_tag_kind_cpx_variant_zd_5_caenuzr_jtims4ygfy" FOREIGN KEY ("id", "__tag_kind_cpx_variant_zd5caenuzr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_id_resource_tfxcbdkpma" FOREIGN KEY ("id", "resource") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_package_identifier_ffjrlehepf" FOREIGN KEY ("package", "identifier") REFERENCES "qti"."manifest_id_of_variant" ("package", "id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_package_identifierref_zujo3dkru3" FOREIGN KEY ("package", "identifierref") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant_metadata" ADD CONSTRAINT "__variant_metadata_fk_id_tag_kind_cpx_metadata_etdkl_qkdqmccwxj" FOREIGN KEY ("id", "__tag_kind_cpx_metadata_etdkl37kij") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant_metadata" ADD CONSTRAINT "__variant_metadata_fk_id_variant_cm4y6w45jw" FOREIGN KEY ("id", "variant") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant_metadata" ADD CONSTRAINT "__variant_metadata_fk_variant_ddw6cifzji" FOREIGN KEY ("variant") REFERENCES "qti"."variant" ("id") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."access_for_all_resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."categorized_statistic_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_case_item_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_guid"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_labelled_guid"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_metadata_provider_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_of_guids"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_of_guids_region"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_of_guids_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_resource_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_resource_part_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_access_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_access_mode_adapted"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_adaptation_detail"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_adaptation_media_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_adaptation_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_api_interoperable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_at_interoperable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_control_flexibility"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_display_transformability"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_educational_complexity_of_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_educational_level_of_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_has_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_hazard"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_is_adaptation_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_is_full_adaptation_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_is_partial_adaptation_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_language_of_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."external_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_annotation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_classification"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_context"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_difficulty"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_educational"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_entry_lang_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_intended_end_user_role"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_interactivity_level"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_interactivity_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_kind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_learning_resource_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_purpose"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_relation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_semantic_density"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_source_lang_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_taxon"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_taxon_path"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_typical_age_range"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_typical_learning_time"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id_of_manifest"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id_of_resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id_of_variant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ordinary_statistic_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_document"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_external_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_resource_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_case_count"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_glossary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_last_updated"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_std_deviation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_std_error"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."target_object"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."target_object_object_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."target_object_part_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_data"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_data_glossary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_map_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_map_entry_case_sensitive"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_mapping"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_mapping_lower_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_mapping_upper_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_value_base_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_value_field_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variant_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."access_for_all_resource" ("id", "metadata") AS
SELECT "r1"."id", "r1"."metadata"
FROM "qti"."access_for_all_resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."access_for_all_resource" TO "qti__author";

CREATE VIEW "qti__author"."admission" ("child", "parent", "version") AS
SELECT "r1"."child", "r1"."parent", "r1"."version"
FROM "qti"."admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."admission" TO "qti__author";

CREATE VIEW "qti__author"."attribute_lexical" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_lexical" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_lexical" TO "qti__author";

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."built_in_ref" ("id", "name", "referrer_kind") AS
SELECT "r1"."id", "r1"."name", "r1"."referrer_kind"
FROM "qti"."built_in_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."built_in_ref" TO "qti__author";

CREATE VIEW "qti__author"."categorized_statistic_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."categorized_statistic_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."categorized_statistic_arm" TO "qti__author";

CREATE VIEW "qti__author"."choice_interaction" ("id", "max_choices", "max_choices_n", "min_choices", "min_choices_n", "orientation", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_choices", "r1"."max_choices_n", "r1"."min_choices", "r1"."min_choices_n", "r1"."orientation", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."choice_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."choice_interaction" TO "qti__author";

CREATE VIEW "qti__author"."csm_case_item_uri" ("id", "labelled_guid", "value") AS
SELECT "r1"."id", "r1"."labelled_guid", "r1"."value"
FROM "qti"."csm_case_item_uri" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_case_item_uri" TO "qti__author";

CREATE VIEW "qti__author"."csm_guid" ("id", "labelled_guid", "value") AS
SELECT "r1"."id", "r1"."labelled_guid", "r1"."value"
FROM "qti"."csm_guid" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_guid" TO "qti__author";

CREATE VIEW "qti__author"."csm_label" ("id", "labelled_guid", "value") AS
SELECT "r1"."id", "r1"."labelled_guid", "r1"."value"
FROM "qti"."csm_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_label" TO "qti__author";

CREATE VIEW "qti__author"."csm_labelled_guid" ("id", "set_of_guids") AS
SELECT "r1"."id", "r1"."set_of_guids"
FROM "qti"."csm_labelled_guid" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_labelled_guid" TO "qti__author";

CREATE VIEW "qti__author"."csm_metadata" ("id", "set") AS
SELECT "r1"."id", "r1"."set"
FROM "qti"."csm_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_metadata" TO "qti__author";

CREATE VIEW "qti__author"."csm_metadata_provider_id" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."csm_metadata_provider_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_metadata_provider_id" TO "qti__author";

CREATE VIEW "qti__author"."csm_set" ("host", "id") AS
SELECT "r1"."host", "r1"."id"
FROM "qti"."csm_set" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_set" TO "qti__author";

CREATE VIEW "qti__author"."csm_set_of_guids" ("id", "metadata") AS
SELECT "r1"."id", "r1"."metadata"
FROM "qti"."csm_set_of_guids" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_set_of_guids" TO "qti__author";

CREATE VIEW "qti__author"."csm_set_of_guids_region" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."csm_set_of_guids_region" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_set_of_guids_region" TO "qti__author";

CREATE VIEW "qti__author"."csm_set_of_guids_version" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."csm_set_of_guids_version" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_set_of_guids_version" TO "qti__author";

CREATE VIEW "qti__author"."csm_set_resource_label" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."csm_set_resource_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_set_resource_label" TO "qti__author";

CREATE VIEW "qti__author"."csm_set_resource_part_id" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."csm_set_resource_part_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."csm_set_resource_part_id" TO "qti__author";

CREATE VIEW "qti__author"."declaration" ("document", "id", "identifier", "kind", "shape") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape"
FROM "qti"."declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration" TO "qti__author";

CREATE VIEW "qti__author"."declared_default_value" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_default_value" TO "qti__author";

CREATE VIEW "qti__author"."declared_ref" ("declaration_kind", "document", "id", "identifier", "referrer_kind") AS
SELECT "r1"."declaration_kind", "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind"
FROM "qti"."declared_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_ref" TO "qti__author";

CREATE VIEW "qti__author"."document" ("id", "package", "path", "resource", "resource_type", "root", "version") AS
SELECT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version"
FROM "qti"."document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document" TO "qti__author";

CREATE VIEW "qti__author"."document_identifier" ("document", "package", "resource", "root", "value") AS
SELECT "r1"."document", "r1"."package", "r1"."resource", "r1"."root", "r1"."value"
FROM "qti"."document_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_identifier" TO "qti__author";

CREATE VIEW "qti__author"."document_title" ("collapsed", "document", "package", "resource", "root", "value") AS
SELECT "r1"."collapsed", "r1"."document", "r1"."package", "r1"."resource", "r1"."root", "r1"."value"
FROM "qti"."document_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_title" TO "qti__author";

CREATE VIEW "qti__author"."drd_access_mode" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_access_mode" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_access_mode" TO "qti__author";

CREATE VIEW "qti__author"."drd_access_mode_adapted" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_access_mode_adapted" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_access_mode_adapted" TO "qti__author";

CREATE VIEW "qti__author"."drd_adaptation_detail" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_adaptation_detail" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_adaptation_detail" TO "qti__author";

CREATE VIEW "qti__author"."drd_adaptation_media_type" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_adaptation_media_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_adaptation_media_type" TO "qti__author";

CREATE VIEW "qti__author"."drd_adaptation_type" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_adaptation_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_adaptation_type" TO "qti__author";

CREATE VIEW "qti__author"."drd_api_interoperable" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_api_interoperable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_api_interoperable" TO "qti__author";

CREATE VIEW "qti__author"."drd_at_interoperable" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_at_interoperable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_at_interoperable" TO "qti__author";

CREATE VIEW "qti__author"."drd_control_flexibility" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_control_flexibility" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_control_flexibility" TO "qti__author";

CREATE VIEW "qti__author"."drd_display_transformability" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_display_transformability" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_display_transformability" TO "qti__author";

CREATE VIEW "qti__author"."drd_educational_complexity_of_adaptation" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_educational_complexity_of_adaptation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_educational_complexity_of_adaptation" TO "qti__author";

CREATE VIEW "qti__author"."drd_educational_level_of_adaptation" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_educational_level_of_adaptation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_educational_level_of_adaptation" TO "qti__author";

CREATE VIEW "qti__author"."drd_has_adaptation" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_has_adaptation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_has_adaptation" TO "qti__author";

CREATE VIEW "qti__author"."drd_hazard" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_hazard" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_hazard" TO "qti__author";

CREATE VIEW "qti__author"."drd_is_adaptation_of" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_is_adaptation_of" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_is_adaptation_of" TO "qti__author";

CREATE VIEW "qti__author"."drd_is_full_adaptation_of" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_is_full_adaptation_of" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_is_full_adaptation_of" TO "qti__author";

CREATE VIEW "qti__author"."drd_is_partial_adaptation_of" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_is_partial_adaptation_of" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_is_partial_adaptation_of" TO "qti__author";

CREATE VIEW "qti__author"."drd_language_of_adaptation" ("id", "owner", "value") AS
SELECT "r1"."id", "r1"."owner", "r1"."value"
FROM "qti"."drd_language_of_adaptation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drd_language_of_adaptation" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."expression" ("bounded", "document", "id", "kind", "min") AS
SELECT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."expression_max" ("id", "kind", "max") AS
SELECT "r1"."id", "r1"."kind", "r1"."max"
FROM "qti"."expression_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_max" TO "qti__author";

CREATE VIEW "qti__author"."external_lom" ("document", "lom", "package", "resource") AS
SELECT "r1"."document", "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."external_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."external_lom" TO "qti__author";

CREATE VIEW "qti__author"."file" ("href", "id", "package", "position", "resource") AS
SELECT "r1"."href", "r1"."id", "r1"."package", "r1"."position", "r1"."resource"
FROM "qti"."file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."file" TO "qti__author";

CREATE VIEW "qti__author"."file_lom" ("file", "lom", "metadata", "package") AS
SELECT "r1"."file", "r1"."lom", "r1"."metadata", "r1"."package"
FROM "qti"."file_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."file_lom" TO "qti__author";

CREATE VIEW "qti__author"."file_metadata" ("file", "id") AS
SELECT "r1"."file", "r1"."id"
FROM "qti"."file_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."file_metadata" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."lom" ("id", "owner", "package") AS
SELECT "r1"."id", "r1"."owner", "r1"."package"
FROM "qti"."lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom" TO "qti__author";

CREATE VIEW "qti__author"."lom_annotation" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_annotation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_annotation" TO "qti__author";

CREATE VIEW "qti__author"."lom_classification" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_classification" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_classification" TO "qti__author";

CREATE VIEW "qti__author"."lom_context" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_context" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_context" TO "qti__author";

CREATE VIEW "qti__author"."lom_difficulty" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_difficulty" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_difficulty" TO "qti__author";

CREATE VIEW "qti__author"."lom_educational" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_educational" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_educational" TO "qti__author";

CREATE VIEW "qti__author"."lom_entry_lang_string" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_entry_lang_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_entry_lang_string" TO "qti__author";

CREATE VIEW "qti__author"."lom_id" ("collapsed", "id", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."value"
FROM "qti"."lom_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_id" TO "qti__author";

CREATE VIEW "qti__author"."lom_identifier" ("id", "lom", "owner", "parent", "position") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent", "r1"."position"
FROM "qti"."lom_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_identifier" TO "qti__author";

CREATE VIEW "qti__author"."lom_identifier_catalog" ("collapsed", "id", "identifier", "lom", "owner", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."identifier", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_identifier_catalog" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_identifier_catalog" TO "qti__author";

CREATE VIEW "qti__author"."lom_identifier_entry" ("collapsed", "id", "identifier", "lom", "owner", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."identifier", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_identifier_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_identifier_entry" TO "qti__author";

CREATE VIEW "qti__author"."lom_intended_end_user_role" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_intended_end_user_role" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_intended_end_user_role" TO "qti__author";

CREATE VIEW "qti__author"."lom_interactivity_level" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_interactivity_level" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_interactivity_level" TO "qti__author";

CREATE VIEW "qti__author"."lom_interactivity_type" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_interactivity_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_interactivity_type" TO "qti__author";

CREATE VIEW "qti__author"."lom_kind" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_kind" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_kind" TO "qti__author";

CREATE VIEW "qti__author"."lom_learning_resource_type" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_learning_resource_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_learning_resource_type" TO "qti__author";

CREATE VIEW "qti__author"."lom_object_identifier" ("collapsed", "identifier", "lom", "package", "position", "resource", "type") AS
SELECT "r1"."collapsed", "r1"."identifier", "r1"."lom", "r1"."package", "r1"."position", "r1"."resource", "r1"."type"
FROM "qti"."lom_object_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_object_identifier" TO "qti__author";

CREATE VIEW "qti__author"."lom_purpose" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_purpose" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_purpose" TO "qti__author";

CREATE VIEW "qti__author"."lom_relation" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_relation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_relation" TO "qti__author";

CREATE VIEW "qti__author"."lom_resource" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_resource" TO "qti__author";

CREATE VIEW "qti__author"."lom_semantic_density" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_semantic_density" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_semantic_density" TO "qti__author";

CREATE VIEW "qti__author"."lom_source_lang_string" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_source_lang_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_source_lang_string" TO "qti__author";

CREATE VIEW "qti__author"."lom_taxon" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_taxon" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_taxon" TO "qti__author";

CREATE VIEW "qti__author"."lom_taxon_path" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_taxon_path" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_taxon_path" TO "qti__author";

CREATE VIEW "qti__author"."lom_typical_age_range" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_typical_age_range" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_typical_age_range" TO "qti__author";

CREATE VIEW "qti__author"."lom_typical_learning_time" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_typical_learning_time" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_typical_learning_time" TO "qti__author";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

CREATE VIEW "qti__author"."manifest_id" ("holder", "id", "package") AS
SELECT "r1"."holder", "r1"."id", "r1"."package"
FROM "qti"."manifest_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_id" TO "qti__author";

CREATE VIEW "qti__author"."manifest_id_of_manifest" ("id", "package") AS
SELECT "r1"."id", "r1"."package"
FROM "qti"."manifest_id_of_manifest" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_id_of_manifest" TO "qti__author";

CREATE VIEW "qti__author"."manifest_id_of_resource" ("id", "package") AS
SELECT "r1"."id", "r1"."package"
FROM "qti"."manifest_id_of_resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_id_of_resource" TO "qti__author";

CREATE VIEW "qti__author"."manifest_id_of_variant" ("id", "package") AS
SELECT "r1"."id", "r1"."package"
FROM "qti"."manifest_id_of_variant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_id_of_variant" TO "qti__author";

CREATE VIEW "qti__author"."manifest_lom" ("lom", "metadata", "package") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package"
FROM "qti"."manifest_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_lom" TO "qti__author";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity" ("kind", "min") AS
SELECT "r1"."kind", "r1"."min"
FROM "qti"."operator_arity" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_max" ("kind", "max") AS
SELECT "r1"."kind", "r1"."max"
FROM "qti"."operator_arity_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_max" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_unbounded" ("kind") AS
SELECT "r1"."kind"
FROM "qti"."operator_arity_unbounded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_unbounded" TO "qti__author";

CREATE VIEW "qti__author"."ordinary_statistic_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."ordinary_statistic_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ordinary_statistic_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_declaration_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_declaration_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_declaration_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_document" ("declaration", "document", "identifier") AS
SELECT "r1"."declaration", "r1"."document", "r1"."identifier"
FROM "qti"."outcome_document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_document" TO "qti__author";

CREATE VIEW "qti__author"."outcome_min_max" ("id", "kind", "outcome_identifier") AS
SELECT "r1"."id", "r1"."kind", "r1"."outcome_identifier"
FROM "qti"."outcome_min_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_min_max" TO "qti__author";

CREATE VIEW "qti__author"."package" ("id", "identifier", "schemaversion") AS
SELECT "r1"."id", "r1"."identifier", "r1"."schemaversion"
FROM "qti"."package" AS "r1";

GRANT SELECT ON TABLE "qti__author"."package" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata" ("host", "id", "package", "resource") AS
SELECT "r1"."host", "r1"."id", "r1"."package", "r1"."resource"
FROM "qti"."qti_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata_in_external_lom" ("id", "lom", "package", "resource") AS
SELECT "r1"."id", "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."qti_metadata_in_external_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata_in_external_lom" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata_in_metadata" ("id", "metadata", "package", "resource", "resource_node") AS
SELECT "r1"."id", "r1"."metadata", "r1"."package", "r1"."resource", "r1"."resource_node"
FROM "qti"."qti_metadata_in_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata_in_metadata" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata_in_resource_lom" ("id", "lom", "package", "resource") AS
SELECT "r1"."id", "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."qti_metadata_in_resource_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata_in_resource_lom" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."resource" ("id", "identifier", "package", "type", "version") AS
SELECT "r1"."id", "r1"."identifier", "r1"."package", "r1"."type", "r1"."version"
FROM "qti"."resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource" TO "qti__author";

CREATE VIEW "qti__author"."resource_lom" ("lom", "metadata", "package", "resource", "type") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."resource_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_lom" TO "qti__author";

CREATE VIEW "qti__author"."resource_metadata" ("id", "resource") AS
SELECT "r1"."id", "r1"."resource"
FROM "qti"."resource_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_metadata" TO "qti__author";

CREATE VIEW "qti__author"."response_processing" ("id", "root_kind") AS
SELECT "r1"."id", "r1"."root_kind"
FROM "qti"."response_processing" AS "r1";

GRANT SELECT ON TABLE "qti__author"."response_processing" TO "qti__author";

CREATE VIEW "qti__author"."root_of_type" ("root", "type") AS
SELECT "r1"."root", "r1"."type"
FROM "qti"."root_of_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."root_of_type" TO "qti__author";

CREATE VIEW "qti__author"."rule_operand" ("child", "position", "rule", "rule_kind") AS
SELECT "r1"."child", "r1"."position", "r1"."rule", "r1"."rule_kind"
FROM "qti"."rule_operand" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rule_operand" TO "qti__author";

CREATE VIEW "qti__author"."statistic" ("context", "id", "kind", "name", "position", "usage_data") AS
SELECT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data"
FROM "qti"."statistic" AS "r1";

GRANT SELECT ON TABLE "qti__author"."statistic" TO "qti__author";

CREATE VIEW "qti__author"."statistic_case_count" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."statistic_case_count" AS "r1";

GRANT SELECT ON TABLE "qti__author"."statistic_case_count" TO "qti__author";

CREATE VIEW "qti__author"."statistic_glossary" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."statistic_glossary" AS "r1";

GRANT SELECT ON TABLE "qti__author"."statistic_glossary" TO "qti__author";

CREATE VIEW "qti__author"."statistic_last_updated" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."statistic_last_updated" AS "r1";

GRANT SELECT ON TABLE "qti__author"."statistic_last_updated" TO "qti__author";

CREATE VIEW "qti__author"."statistic_std_deviation" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."statistic_std_deviation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."statistic_std_deviation" TO "qti__author";

CREATE VIEW "qti__author"."statistic_std_error" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."statistic_std_error" AS "r1";

GRANT SELECT ON TABLE "qti__author"."statistic_std_error" TO "qti__author";

CREATE VIEW "qti__author"."target_object" ("id", "identifier", "position", "statistic") AS
SELECT "r1"."id", "r1"."identifier", "r1"."position", "r1"."statistic"
FROM "qti"."target_object" AS "r1";

GRANT SELECT ON TABLE "qti__author"."target_object" TO "qti__author";

CREATE VIEW "qti__author"."target_object_object_type" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."target_object_object_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."target_object_object_type" TO "qti__author";

CREATE VIEW "qti__author"."target_object_part_identifier" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."target_object_part_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."target_object_part_identifier" TO "qti__author";

CREATE VIEW "qti__author"."template_parameter_ref" ("document", "id", "identifier", "referrer_kind", "root_kind") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind", "r1"."root_kind"
FROM "qti"."template_parameter_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_parameter_ref" TO "qti__author";

CREATE VIEW "qti__author"."tree" ("charset", "id", "kind", "root", "version") AS
SELECT "r1"."charset", "r1"."id", "r1"."kind", "r1"."root", "r1"."version"
FROM "qti"."tree" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tree" TO "qti__author";

CREATE VIEW "qti__author"."tree_root" ("node", "tree") AS
SELECT "r1"."node", "r1"."tree"
FROM "qti"."tree_root" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tree_root" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE VIEW "qti__author"."usage_data" ("document", "id") AS
SELECT "r1"."document", "r1"."id"
FROM "qti"."usage_data" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_data" TO "qti__author";

CREATE VIEW "qti__author"."usage_data_glossary" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."usage_data_glossary" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_data_glossary" TO "qti__author";

CREATE VIEW "qti__author"."usage_map_entry" ("id", "map_key", "mapped_value", "mapping", "position") AS
SELECT "r1"."id", "r1"."map_key", "r1"."mapped_value", "r1"."mapping", "r1"."position"
FROM "qti"."usage_map_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_map_entry" TO "qti__author";

CREATE VIEW "qti__author"."usage_map_entry_case_sensitive" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."usage_map_entry_case_sensitive" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_map_entry_case_sensitive" TO "qti__author";

CREATE VIEW "qti__author"."usage_mapping" ("default_value", "id", "statistic") AS
SELECT "r1"."default_value", "r1"."id", "r1"."statistic"
FROM "qti"."usage_mapping" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_mapping" TO "qti__author";

CREATE VIEW "qti__author"."usage_mapping_lower_bound" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."usage_mapping_lower_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_mapping_lower_bound" TO "qti__author";

CREATE VIEW "qti__author"."usage_mapping_upper_bound" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."usage_mapping_upper_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_mapping_upper_bound" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value" ("base_type", "id", "value") AS
SELECT "r1"."base_type", "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_boolean" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_boolean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_boolean" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_directed_pair" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_directed_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_directed_pair" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_duration" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_duration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_duration" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_file" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_file" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_float" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_float" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_identifier" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_identifier" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_integer" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_integer" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_pair" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_pair" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_point" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_point" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_string" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_string" TO "qti__author";

CREATE VIEW "qti__author"."usage_typed_value_uri" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_typed_value_uri" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_typed_value_uri" TO "qti__author";

CREATE VIEW "qti__author"."usage_value" ("collapsed", "id", "statistic", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."statistic", "r1"."value"
FROM "qti"."usage_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_value" TO "qti__author";

CREATE VIEW "qti__author"."usage_value_base_type" ("base_type", "id") AS
SELECT "r1"."base_type", "r1"."id"
FROM "qti"."usage_value_base_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_value_base_type" TO "qti__author";

CREATE VIEW "qti__author"."usage_value_field_identifier" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."usage_value_field_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_value_field_identifier" TO "qti__author";

CREATE VIEW "qti__author"."variable_weight_identifier" ("node", "root_kind", "value") AS
SELECT "r1"."node", "r1"."root_kind", "r1"."value"
FROM "qti"."variable_weight_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variable_weight_identifier" TO "qti__author";

CREATE VIEW "qti__author"."variant" ("id", "identifier", "identifierref", "package", "resource", "resource_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."identifierref", "r1"."package", "r1"."resource", "r1"."resource_identifier"
FROM "qti"."variant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variant" TO "qti__author";

CREATE VIEW "qti__author"."variant_metadata" ("id", "variant") AS
SELECT "r1"."id", "r1"."variant"
FROM "qti"."variant_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variant_metadata" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."access_for_all_resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."categorized_statistic_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_case_item_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_guid" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_labelled_guid" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_metadata_provider_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_set_of_guids" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_set_of_guids_region" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_set_of_guids_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_set_resource_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."csm_set_resource_part_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_access_mode" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_access_mode_adapted" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_adaptation_detail" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_adaptation_media_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_adaptation_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_api_interoperable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_at_interoperable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_control_flexibility" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_display_transformability" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_educational_complexity_of_adaptation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_educational_level_of_adaptation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_has_adaptation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_hazard" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_is_adaptation_of" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_is_full_adaptation_of" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_is_partial_adaptation_of" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drd_language_of_adaptation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."external_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."file_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_annotation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_classification" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_context" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_difficulty" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_educational" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_entry_lang_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier_catalog" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_intended_end_user_role" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_interactivity_level" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_interactivity_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_kind" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_learning_resource_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_object_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_purpose" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_relation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_semantic_density" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_source_lang_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_taxon" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_taxon_path" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_typical_age_range" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_typical_learning_time" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_id_of_manifest" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_id_of_resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_id_of_variant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ordinary_statistic_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."package" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata_in_external_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata_in_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata_in_resource_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."statistic" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."statistic_case_count" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."statistic_glossary" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."statistic_last_updated" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."statistic_std_deviation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."statistic_std_error" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."target_object" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."target_object_object_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."target_object_part_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_root" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_data" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_data_glossary" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_map_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_map_entry_case_sensitive" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_mapping" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_mapping_lower_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_mapping_upper_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_typed_value_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_value_base_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_value_field_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variant_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
