DROP POLICY "qti__author" ON "qti"."tree_root";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."document";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."tree_root";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."document";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."admission";

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

CREATE TABLE "qti"."ordinary_statistic_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__ordinary_statistic_arm_pk_2atydtxqda" PRIMARY KEY ("id")
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

ALTER TABLE "qti"."categorized_statistic_arm" ADD COLUMN "__tag_kind_ud_categorized_statistic_6idrz3enis" "qti"."node_kind" GENERATED ALWAYS AS ('ud:categorizedStatistic'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."categorized_statistic_arm" ADD COLUMN "__tag_kind_categorized_mbhnwjzukq" "qti"."statistic_kind" GENERATED ALWAYS AS ('categorized'::"qti"."statistic_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_case_item_uri" ADD COLUMN "__tag_kind_csmd_case_item_uri_lxp27cu62q" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:caseItemURI'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_guid" ADD COLUMN "__tag_kind_csmd_guid_zslp2vpfy4" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:GUID'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_label" ADD COLUMN "__tag_kind_csmd_label_fz6gvoerne" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:label'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_labelled_guid" ADD COLUMN "__tag_kind_csmd_labelled_guid_xvmt4w5scu" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:labelledGUID'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_metadata" ADD COLUMN "__tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:curriculumStandardsMetadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_set" ADD COLUMN "__tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:curriculumStandardsMetadataSet'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_set_of_guids" ADD COLUMN "__tag_kind_csmd_set_of_gui_ds_wsrxqslv22" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:setOfGUIDs'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD COLUMN "__tag_kind_ud_ordinary_statistic_eakzbvyu36" "qti"."node_kind" GENERATED ALWAYS AS ('ud:ordinaryStatistic'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD COLUMN "__tag_kind_ordinary_nxdawqnzxk" "qti"."statistic_kind" GENERATED ALWAYS AS ('ordinary'::"qti"."statistic_kind") STORED NOT NULL;

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

ALTER TABLE "qti"."ordinary_statistic_arm" ADD CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ordinary_dilt5z26qb" FOREIGN KEY ("id", "__tag_kind_ordinary_nxdawqnzxk") REFERENCES "qti"."statistic" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ud_ordinary_zseoy5wvrj" FOREIGN KEY ("id", "__tag_kind_ud_ordinary_statistic_eakzbvyu36") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_document_tag_root_usagedata_kjac_3_3yy4v3yjfw" FOREIGN KEY ("document", "__tag_root_usagedata_kjac3nie2g") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_id_tag_kind_ud_usage_data_xzkq_4_mlglt3k4yv" FOREIGN KEY ("id", "__tag_kind_ud_usage_data_xzkq4jszsr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_id_document_twpu2pvfe2" FOREIGN KEY ("id", "document") REFERENCES "qti"."tree_root" ("node", "tree");

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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ordinary_statistic_arm"
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

CREATE VIEW "qti__author"."categorized_statistic_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."categorized_statistic_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."categorized_statistic_arm" TO "qti__author";

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

CREATE VIEW "qti__author"."declared_default_value" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_default_value" TO "qti__author";

CREATE VIEW "qti__author"."document" ("id", "package", "path", "resource", "resource_type", "root", "version") AS
SELECT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version"
FROM "qti"."document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."expression" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

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

CREATE VIEW "qti__author"."ordinary_statistic_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."ordinary_statistic_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ordinary_statistic_arm" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

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

CREATE POLICY "qti__author" ON "qti"."declared_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ordinary_statistic_arm" AS PERMISSIVE FOR ALL TO "qti__author"
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
