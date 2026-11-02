DROP POLICY "qti__author" ON "qti"."resource";

DROP POLICY "qti__author" ON "qti"."package";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."edge";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."resource";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."package";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."admission";

CREATE TABLE "qti"."access_for_all_resource" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  CONSTRAINT "__access_for_all_resource_pk_kr5wpjf4ev" PRIMARY KEY ("id"),
  CONSTRAINT "__access_for_all_resource_key_metadata_eocm4jdfj5" UNIQUE ("metadata")
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

ALTER TABLE "qti"."manifest_id_of_manifest" ADD COLUMN "__tag_holder_manifest_7wghkxashe" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('manifest'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_resource" ADD COLUMN "__tag_holder_resource_3lbxhuqadk" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('resource'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_variant" ADD COLUMN "__tag_holder_variant_yyymqmlpge" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('variant'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."variant" ADD COLUMN "__tag_kind_cpx_variant_zd5caenuzr" "qti"."node_kind" GENERATED ALWAYS AS ('cpx:variant'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variant_metadata" ADD COLUMN "__tag_kind_cpx_metadata_etdkl37kij" "qti"."node_kind" GENERATED ALWAYS AS ('cpx:metadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_id_tag_kind_drd_access_tfbg7eqeci" FOREIGN KEY ("id", "__tag_kind_drd_access_for_all_resource_dcvrnrucvz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_id_metadata_xfrhrrhkhp" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_metadata_zxw7a2wvbn" FOREIGN KEY ("metadata") REFERENCES "qti"."variant_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."manifest_id" ADD CONSTRAINT "__manifest_id_fk_package_yrywtozstf" FOREIGN KEY ("package") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_manifest" ADD CONSTRAINT "__manifest_id_of_manifest_fk_package_id_tag_holder_hcdzuklnac" FOREIGN KEY ("package", "id", "__tag_holder_manifest_7wghkxashe") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_resource" ADD CONSTRAINT "__manifest_id_of_resource_fk_package_id_moulqn3fj4" FOREIGN KEY ("package", "id") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_resource" ADD CONSTRAINT "__manifest_id_of_resource_fk_package_id_tag_holder_zdlxck3tn7" FOREIGN KEY ("package", "id", "__tag_holder_resource_3lbxhuqadk") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_variant" ADD CONSTRAINT "__manifest_id_of_variant_fk_package_id_huvjqiu33v" FOREIGN KEY ("package", "id") REFERENCES "qti"."variant" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_variant" ADD CONSTRAINT "__manifest_id_of_variant_fk_package_id_tag_holder_jf7shcoyrs" FOREIGN KEY ("package", "id", "__tag_holder_variant_yyymqmlpge") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc" FOREIGN KEY ("id", "identifier") REFERENCES "qti"."manifest_id_of_manifest" ("package", "id") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv" FOREIGN KEY ("package", "identifier") REFERENCES "qti"."manifest_id_of_resource" ("package", "id") DEFERRABLE INITIALLY DEFERRED NOT VALID;

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

CREATE VIEW "qti__author"."expression" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

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

CREATE VIEW "qti__author"."package" ("id", "identifier", "schemaversion") AS
SELECT "r1"."id", "r1"."identifier", "r1"."schemaversion"
FROM "qti"."package" AS "r1";

GRANT SELECT ON TABLE "qti__author"."package" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."resource" ("id", "identifier", "package", "type", "version") AS
SELECT "r1"."id", "r1"."identifier", "r1"."package", "r1"."type", "r1"."version"
FROM "qti"."resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

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

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."package" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variant_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
