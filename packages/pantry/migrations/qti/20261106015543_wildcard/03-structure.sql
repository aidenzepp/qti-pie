DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."manifest_id";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."document_id";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."template_parameter_ref";

DROP VIEW "qti__author"."structure_child";

DROP VIEW "qti__author"."source";

DROP VIEW "qti__author"."section_variable_ref";

DROP VIEW "qti__author"."section_variable_declared";

DROP VIEW "qti__author"."rule_operand";

DROP VIEW "qti__author"."record_binding_fit";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."outcome_min_max";

DROP VIEW "qti__author"."operator_arity_unbounded";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node_xml_lang";

DROP VIEW "qti__author"."node_xml_base";

DROP VIEW "qti__author"."node_suppress_tts";

DROP VIEW "qti__author"."node_lang";

DROP VIEW "qti__author"."node_label";

DROP VIEW "qti__author"."node_dir";

DROP VIEW "qti__author"."node_class";

DROP VIEW "qti__author"."node_catalog_idref";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."manifest_id";

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."lom_language";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."html_id";

DROP VIEW "qti__author"."expression_max";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."document_id";

DROP VIEW "qti__author"."declared_ref";

DROP VIEW "qti__author"."coords";

DROP VIEW "qti__author"."built_in_ref";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_spelling";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."attribute_file_reference";

DROP VIEW "qti__author"."attribute_admission";

DROP VIEW "qti__author"."associable_hotspot";

DROP VIEW "qti__author"."aria_valuetext";

DROP VIEW "qti__author"."aria_valuenow";

DROP VIEW "qti__author"."aria_valuemin";

DROP VIEW "qti__author"."aria_valuemax";

DROP VIEW "qti__author"."aria_sort";

DROP VIEW "qti__author"."aria_setsize";

DROP VIEW "qti__author"."aria_selected";

DROP VIEW "qti__author"."aria_rowspan";

DROP VIEW "qti__author"."aria_rowindex";

DROP VIEW "qti__author"."aria_rowcount";

DROP VIEW "qti__author"."aria_roledescription";

DROP VIEW "qti__author"."aria_role";

DROP VIEW "qti__author"."aria_required";

DROP VIEW "qti__author"."aria_relevant";

DROP VIEW "qti__author"."aria_readonly";

DROP VIEW "qti__author"."aria_pressed";

DROP VIEW "qti__author"."aria_posinset";

DROP VIEW "qti__author"."aria_placeholder";

DROP VIEW "qti__author"."aria_owns";

DROP VIEW "qti__author"."aria_orientation";

DROP VIEW "qti__author"."aria_multiselectable";

DROP VIEW "qti__author"."aria_multiline";

DROP VIEW "qti__author"."aria_modal";

DROP VIEW "qti__author"."aria_live";

DROP VIEW "qti__author"."aria_level";

DROP VIEW "qti__author"."aria_labelledby";

DROP VIEW "qti__author"."aria_label";

DROP VIEW "qti__author"."aria_keyshorts";

DROP VIEW "qti__author"."aria_keyshortcuts";

DROP VIEW "qti__author"."aria_invalid";

DROP VIEW "qti__author"."aria_hidden";

DROP VIEW "qti__author"."aria_haspopup";

DROP VIEW "qti__author"."aria_flowto";

DROP VIEW "qti__author"."aria_expanded";

DROP VIEW "qti__author"."aria_errormessage";

DROP VIEW "qti__author"."aria_disabled";

DROP VIEW "qti__author"."aria_details";

DROP VIEW "qti__author"."aria_describedby";

DROP VIEW "qti__author"."aria_current";

DROP VIEW "qti__author"."aria_controls";

DROP VIEW "qti__author"."aria_colspan";

DROP VIEW "qti__author"."aria_colindex";

DROP VIEW "qti__author"."aria_colcount";

DROP VIEW "qti__author"."aria_checked";

DROP VIEW "qti__author"."aria_busy";

DROP VIEW "qti__author"."aria_autocomplete";

DROP VIEW "qti__author"."aria_atomic";

DROP VIEW "qti__author"."aria_activedescendant";

DROP VIEW "qti__author"."ancestry_step";

DROP VIEW "qti__author"."admission";

CREATE TABLE "qti"."attribute_exclusion" (
  "host" "qti"."node_kind" NOT NULL,
  "namespace" "qti"."schema_namespace" NOT NULL,
  CONSTRAINT "__attribute_exclusion_pk_x5bpv7u5nu" PRIMARY KEY ("host", "namespace")
);

CREATE TABLE "qti"."attribute_wildcard" (
  "host" "qti"."node_kind" NOT NULL,
  "policy" "qti"."namespace_policy" NOT NULL,
  "process" "qti"."process_contents" NOT NULL,
  "target" "qti"."schema_namespace" NOT NULL,
  CONSTRAINT "__attribute_wildcard_pk_nwcud4hn7n" PRIMARY KEY ("host"),
  CONSTRAINT "__attribute_wildcard_key_host_process_djyzoorso4" UNIQUE ("host", "process")
);

CREATE TABLE "qti"."document_xml_id" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__document_xml_id_pk_t6vtyjcc67" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__document_xml_id_key_node_rkqbnqhchg" UNIQUE ("node"),
  CONSTRAINT "document_xml_id_attribute" CHECK (("attribute" = 'xml:id'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."foreign_attribute" (
  "kind" "qti"."node_kind" NOT NULL,
  "local" "qti"."xml_local_name" NOT NULL,
  "namespace" "qti"."namespace_uri" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."__text_httzcaefcn" NOT NULL,
  "process" "qti"."process_contents" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "schema_set" "qti"."schema_set" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__foreign_attribute_pk_id2hyjswpd" PRIMARY KEY ("node", "prefix", "local"),
  CONSTRAINT "foreign_attribute_prefix" CHECK (("namespace" = ''::"pg_catalog"."text" AND "prefix" = ''::"pg_catalog"."text" OR "namespace" <> ''::"pg_catalog"."text" AND "prefix" <> ''::"pg_catalog"."text") IS TRUE)
);

CREATE TABLE "qti"."foreign_element" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "local" "qti"."xml_local_name" NOT NULL,
  "namespace" "qti"."namespace_uri" NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "prefix" "qti"."__text_httzcaefcn" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "schema_set" "qti"."schema_set" NOT NULL,
  CONSTRAINT "__foreign_element_pk_adbstdxgh2" PRIMARY KEY ("id"),
  CONSTRAINT "foreign_unqualified_unprefixed" CHECK (("namespace" <> ''::"pg_catalog"."text" OR "prefix" = ''::"pg_catalog"."text") IS TRUE)
);

CREATE TABLE "qti"."global_attribute" (
  "local" "qti"."xml_local_name" NOT NULL,
  "namespace" "qti"."schema_namespace" NOT NULL,
  "set" "qti"."schema_set" NOT NULL,
  CONSTRAINT "__global_attribute_pk_nbw7nfebvo" PRIMARY KEY ("set", "namespace", "local")
);

CREATE TABLE "qti"."global_element" (
  "local" "qti"."xml_local_name" NOT NULL,
  "namespace" "qti"."schema_namespace" NOT NULL,
  "set" "qti"."schema_set" NOT NULL,
  CONSTRAINT "__global_element_pk_7b2grrwfxk" PRIMARY KEY ("set", "namespace", "local")
);

CREATE TABLE "qti"."manifest_xml_id" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "id" "qti"."manifest_identifier" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_xml_id_pk_mgwjmdolmi" PRIMARY KEY ("package", "id"),
  CONSTRAINT "__manifest_xml_id_key_node_6d5ah7msbz" UNIQUE ("node"),
  CONSTRAINT "manifest_xml_id_attribute" CHECK (("attribute" = 'xml:id'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."no_namespace_schema_location" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."namespace_prefix" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__no_namespace_schema_location_pk_h7su4xaem2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."node_xml_space" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xml_space" NOT NULL,
  CONSTRAINT "__node_xml_space_pk_fewb54oa3t" PRIMARY KEY ("node"),
  CONSTRAINT "node_xml_space_attribute" CHECK (("attribute" = 'xml:space'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."root_schema_set" (
  "root" "qti"."root_kind" NOT NULL,
  "set" "qti"."schema_set" NOT NULL,
  CONSTRAINT "__root_schema_set_pk_naqug3xsmm" PRIMARY KEY ("root"),
  CONSTRAINT "__root_schema_set_key_root_set_jhabdc4kfs" UNIQUE ("root", "set")
);

CREATE TABLE "qti"."wildcard_exclusion" (
  "host" "qti"."node_kind" NOT NULL,
  "namespace" "qti"."schema_namespace" NOT NULL,
  CONSTRAINT "__wildcard_exclusion_pk_lvp2c5xoz6" PRIMARY KEY ("host", "namespace")
);

CREATE TABLE "qti"."wildcard_host" (
  "host" "qti"."node_kind" NOT NULL,
  "policy" "qti"."namespace_policy" NOT NULL,
  "process" "qti"."process_contents" NOT NULL,
  "target" "qti"."schema_namespace" NOT NULL,
  CONSTRAINT "__wildcard_host_pk_t2evoafsjc" PRIMARY KEY ("host")
);

CREATE TABLE "qti"."xlink_actuate" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_actuate_value" NOT NULL,
  CONSTRAINT "__xlink_actuate_pk_3bgog23cq2" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_actuate_attribute" CHECK (("attribute" = 'xlink:actuate'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_arcrole" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_arcrole_uri" NOT NULL,
  CONSTRAINT "__xlink_arcrole_pk_zbcvammh7y" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_arcrole_attribute" CHECK (("attribute" = 'xlink:arcrole'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_from" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_label_name" NOT NULL,
  CONSTRAINT "__xlink_from_pk_6asx5ev2nd" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_from_attribute" CHECK (("attribute" = 'xlink:from'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_href" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_href_uri" NOT NULL,
  CONSTRAINT "__xlink_href_pk_4yueftl4n6" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_href_attribute" CHECK (("attribute" = 'xlink:href'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_label" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_label_name" NOT NULL,
  CONSTRAINT "__xlink_label_pk_kbbveb7kn6" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_label_attribute" CHECK (("attribute" = 'xlink:label'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_role" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_role_uri" NOT NULL,
  CONSTRAINT "__xlink_role_pk_42lladm76p" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_role_attribute" CHECK (("attribute" = 'xlink:role'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_show" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_show_value" NOT NULL,
  CONSTRAINT "__xlink_show_pk_eqhobspcz7" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_show_attribute" CHECK (("attribute" = 'xlink:show'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_title" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__xlink_title_pk_pydypdz4b4" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_title_attribute" CHECK (("attribute" = 'xlink:title'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_to" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_label_name" NOT NULL,
  CONSTRAINT "__xlink_to_pk_akcsfpa6mk" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_to_attribute" CHECK (("attribute" = 'xlink:to'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xlink_type" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xlink_type_value" NOT NULL,
  CONSTRAINT "__xlink_type_pk_pgqbsbbhc3" PRIMARY KEY ("node"),
  CONSTRAINT "xlink_type_attribute" CHECK (("attribute" = 'xlink:type'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."xsi_nil" (
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."namespace_prefix" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__xsi_nil_pk_zzv5smwd7t" PRIMARY KEY ("node"),
  CONSTRAINT "xsi_nil_undeclared" CHECK (("kind" = 'foreign'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."xsi_type" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."namespace_prefix" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__xsi_type_pk_nq4n2rfyoz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."xsi_type_attribute" (
  "kind" "qti"."node_kind" NOT NULL,
  "local" "qti"."xml_local_name" NOT NULL,
  "namespace" "qti"."namespace_uri" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."__text_httzcaefcn" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__xsi_type_attribute_pk_myommjfpdh" PRIMARY KEY ("node", "prefix", "local"),
  CONSTRAINT "xsi_type_attribute_prefix" CHECK (("namespace" = ''::"pg_catalog"."text" AND "prefix" = ''::"pg_catalog"."text" OR "namespace" <> ''::"pg_catalog"."text" AND "prefix" <> ''::"pg_catalog"."text") IS TRUE)
);

ALTER TABLE "qti"."document_xml_id" ADD COLUMN "__tag_holder_xml_id_z4lhqr6sbg" "qti"."id_holder" GENERATED ALWAYS AS ('xmlId'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."foreign_element" ADD COLUMN "__tag_kind_foreign_qxcdl6bp5c" "qti"."node_kind" GENERATED ALWAYS AS ('foreign'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_xml_id" ADD COLUMN "__tag_holder_xml_id_xxlc7jdjqv" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('xmlId'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."attribute_exclusion" ADD CONSTRAINT "__attribute_exclusion_fk_host_ju6zz3lu5g" FOREIGN KEY ("host") REFERENCES "qti"."attribute_wildcard" ("host") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_xml_id" ADD CONSTRAINT "__document_xml_id_fk_document_id_tag_holder_xml_id_z_u3e4gszgso" FOREIGN KEY ("document", "id", "__tag_holder_xml_id_z4lhqr6sbg") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_xml_id" ADD CONSTRAINT "__document_xml_id_fk_kind_attribute_jo3yrrnok7" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."document_xml_id" ADD CONSTRAINT "__document_xml_id_fk_node_document_kind_n5epautzrb" FOREIGN KEY ("node", "document", "kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."foreign_attribute" ADD CONSTRAINT "__foreign_attribute_fk_kind_process_rmymiaookz" FOREIGN KEY ("kind", "process") REFERENCES "qti"."attribute_wildcard" ("host", "process") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."foreign_attribute" ADD CONSTRAINT "__foreign_attribute_fk_root_kind_schema_set_5whlohft34" FOREIGN KEY ("root_kind", "schema_set") REFERENCES "qti"."root_schema_set" ("root", "set");

ALTER TABLE "qti"."foreign_element" ADD CONSTRAINT "__foreign_element_fk_id_tag_kind_foreign_qxcdl_6_bp_226aqom2jn" FOREIGN KEY ("id", "__tag_kind_foreign_qxcdl6bp5c") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."foreign_element" ADD CONSTRAINT "__foreign_element_fk_id_parent_kind_3rwhbc2b6w" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."foreign_element" ADD CONSTRAINT "__foreign_element_fk_root_kind_schema_set_7d7vahhsjm" FOREIGN KEY ("root_kind", "schema_set") REFERENCES "qti"."root_schema_set" ("root", "set");

ALTER TABLE "qti"."manifest_xml_id" ADD CONSTRAINT "__manifest_xml_id_fk_kind_attribute_af7wwfaumq" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."manifest_xml_id" ADD CONSTRAINT "__manifest_xml_id_fk_node_package_kind_2vjjplkagn" FOREIGN KEY ("node", "package", "kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_xml_id" ADD CONSTRAINT "__manifest_xml_id_fk_package_id_tag_holder_xml_id_3c3fllfqpi" FOREIGN KEY ("package", "id", "__tag_holder_xml_id_xxlc7jdjqv") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."no_namespace_schema_location" ADD CONSTRAINT "__no_namespace_schema_location_fk_node_up3vbfbqyy" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_xml_space" ADD CONSTRAINT "__node_xml_space_fk_kind_attribute_rnaoifq7ok" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_xml_space" ADD CONSTRAINT "__node_xml_space_fk_node_kind_4hqursiyqg" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."wildcard_exclusion" ADD CONSTRAINT "__wildcard_exclusion_fk_host_2oppvcuz43" FOREIGN KEY ("host") REFERENCES "qti"."wildcard_host" ("host") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_actuate" ADD CONSTRAINT "__xlink_actuate_fk_kind_attribute_ewai4im5ln" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_actuate" ADD CONSTRAINT "__xlink_actuate_fk_node_kind_eowcwgl263" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_arcrole" ADD CONSTRAINT "__xlink_arcrole_fk_kind_attribute_ajltq3tvve" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_arcrole" ADD CONSTRAINT "__xlink_arcrole_fk_node_kind_gcxt6qrhyg" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_from" ADD CONSTRAINT "__xlink_from_fk_kind_attribute_f5nxffabpm" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_from" ADD CONSTRAINT "__xlink_from_fk_node_kind_wmglr6srgu" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_href" ADD CONSTRAINT "__xlink_href_fk_kind_attribute_mkh4fvwdxu" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_href" ADD CONSTRAINT "__xlink_href_fk_node_kind_s2rvb2snx2" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_label" ADD CONSTRAINT "__xlink_label_fk_kind_attribute_j4wq2nj3l3" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_label" ADD CONSTRAINT "__xlink_label_fk_node_kind_hl4j2pl2sj" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_role" ADD CONSTRAINT "__xlink_role_fk_kind_attribute_ou4bnwee3g" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_role" ADD CONSTRAINT "__xlink_role_fk_node_kind_jymeymdtvt" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_show" ADD CONSTRAINT "__xlink_show_fk_kind_attribute_wbitotre62" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_show" ADD CONSTRAINT "__xlink_show_fk_node_kind_3jh53fz23l" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_title" ADD CONSTRAINT "__xlink_title_fk_kind_attribute_2xkhemclo5" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_title" ADD CONSTRAINT "__xlink_title_fk_node_kind_jkjqqc5rba" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_to" ADD CONSTRAINT "__xlink_to_fk_kind_attribute_mwoejkbbsi" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_to" ADD CONSTRAINT "__xlink_to_fk_node_kind_hfnu4ioi3k" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xlink_type" ADD CONSTRAINT "__xlink_type_fk_kind_attribute_jmrkcoeo23" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."xlink_type" ADD CONSTRAINT "__xlink_type_fk_node_kind_qdaaeoevup" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xsi_nil" ADD CONSTRAINT "__xsi_nil_fk_node_kind_ndjdd33kfk" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xsi_type" ADD CONSTRAINT "__xsi_type_fk_node_ectavxct3v" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xsi_type_attribute" ADD CONSTRAINT "__xsi_type_attribute_fk_node_ssfn75iolk" FOREIGN KEY ("node") REFERENCES "qti"."xsi_type" ("node") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."xsi_type_attribute" ADD CONSTRAINT "__xsi_type_attribute_fk_node_kind_ty6qtmp36f" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_exclusion"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_wildcard"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_xml_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."foreign_attribute"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."foreign_element"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."global_attribute"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."global_element"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_xml_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."no_namespace_schema_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_xml_space"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."root_schema_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."wildcard_exclusion"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."wildcard_host"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_actuate"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_arcrole"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_from"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_role"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_show"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_to"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xlink_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xsi_nil"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xsi_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."xsi_type_attribute"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."admission" ("child", "parent", "version") AS
SELECT "r1"."child", "r1"."parent", "r1"."version"
FROM "qti"."admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."admission" TO "qti__author";

CREATE VIEW "qti__author"."ancestry_step" ("ancestry", "kind", "next") AS
SELECT "r1"."ancestry", "r1"."kind", "r1"."next"
FROM "qti"."ancestry_step" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ancestry_step" TO "qti__author";

CREATE VIEW "qti__author"."aria_activedescendant" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_activedescendant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_activedescendant" TO "qti__author";

CREATE VIEW "qti__author"."aria_atomic" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_atomic" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_atomic" TO "qti__author";

CREATE VIEW "qti__author"."aria_autocomplete" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_autocomplete" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_autocomplete" TO "qti__author";

CREATE VIEW "qti__author"."aria_busy" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_busy" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_busy" TO "qti__author";

CREATE VIEW "qti__author"."aria_checked" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_checked" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_checked" TO "qti__author";

CREATE VIEW "qti__author"."aria_colcount" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_colcount" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_colcount" TO "qti__author";

CREATE VIEW "qti__author"."aria_colindex" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_colindex" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_colindex" TO "qti__author";

CREATE VIEW "qti__author"."aria_colspan" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_colspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_colspan" TO "qti__author";

CREATE VIEW "qti__author"."aria_controls" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_controls" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_controls" TO "qti__author";

CREATE VIEW "qti__author"."aria_current" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_current" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_current" TO "qti__author";

CREATE VIEW "qti__author"."aria_describedby" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_describedby" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_describedby" TO "qti__author";

CREATE VIEW "qti__author"."aria_details" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_details" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_details" TO "qti__author";

CREATE VIEW "qti__author"."aria_disabled" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_disabled" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_disabled" TO "qti__author";

CREATE VIEW "qti__author"."aria_errormessage" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_errormessage" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_errormessage" TO "qti__author";

CREATE VIEW "qti__author"."aria_expanded" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_expanded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_expanded" TO "qti__author";

CREATE VIEW "qti__author"."aria_flowto" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_flowto" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_flowto" TO "qti__author";

CREATE VIEW "qti__author"."aria_haspopup" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_haspopup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_haspopup" TO "qti__author";

CREATE VIEW "qti__author"."aria_hidden" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_hidden" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_hidden" TO "qti__author";

CREATE VIEW "qti__author"."aria_invalid" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_invalid" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_invalid" TO "qti__author";

CREATE VIEW "qti__author"."aria_keyshortcuts" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_keyshortcuts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_keyshortcuts" TO "qti__author";

CREATE VIEW "qti__author"."aria_keyshorts" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_keyshorts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_keyshorts" TO "qti__author";

CREATE VIEW "qti__author"."aria_label" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_label" TO "qti__author";

CREATE VIEW "qti__author"."aria_labelledby" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_labelledby" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_labelledby" TO "qti__author";

CREATE VIEW "qti__author"."aria_level" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_level" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_level" TO "qti__author";

CREATE VIEW "qti__author"."aria_live" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_live" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_live" TO "qti__author";

CREATE VIEW "qti__author"."aria_modal" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_modal" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_modal" TO "qti__author";

CREATE VIEW "qti__author"."aria_multiline" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_multiline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_multiline" TO "qti__author";

CREATE VIEW "qti__author"."aria_multiselectable" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_multiselectable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_multiselectable" TO "qti__author";

CREATE VIEW "qti__author"."aria_orientation" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_orientation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_orientation" TO "qti__author";

CREATE VIEW "qti__author"."aria_owns" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_owns" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_owns" TO "qti__author";

CREATE VIEW "qti__author"."aria_placeholder" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_placeholder" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_placeholder" TO "qti__author";

CREATE VIEW "qti__author"."aria_posinset" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_posinset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_posinset" TO "qti__author";

CREATE VIEW "qti__author"."aria_pressed" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_pressed" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_pressed" TO "qti__author";

CREATE VIEW "qti__author"."aria_readonly" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_readonly" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_readonly" TO "qti__author";

CREATE VIEW "qti__author"."aria_relevant" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_relevant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_relevant" TO "qti__author";

CREATE VIEW "qti__author"."aria_required" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_required" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_required" TO "qti__author";

CREATE VIEW "qti__author"."aria_role" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_role" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_role" TO "qti__author";

CREATE VIEW "qti__author"."aria_roledescription" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_roledescription" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_roledescription" TO "qti__author";

CREATE VIEW "qti__author"."aria_rowcount" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_rowcount" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_rowcount" TO "qti__author";

CREATE VIEW "qti__author"."aria_rowindex" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_rowindex" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_rowindex" TO "qti__author";

CREATE VIEW "qti__author"."aria_rowspan" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_rowspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_rowspan" TO "qti__author";

CREATE VIEW "qti__author"."aria_selected" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_selected" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_selected" TO "qti__author";

CREATE VIEW "qti__author"."aria_setsize" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_setsize" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_setsize" TO "qti__author";

CREATE VIEW "qti__author"."aria_sort" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_sort" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_sort" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuemax" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuemax" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuemax" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuemin" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuemin" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuemin" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuenow" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuenow" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuenow" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuetext" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuetext" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuetext" TO "qti__author";

CREATE VIEW "qti__author"."associable_hotspot" ("id", "identifier", "interaction", "match_max_n", "match_min_n", "parent_kind", "shape", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape", "r1"."show_hide"
FROM "qti"."associable_hotspot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot" TO "qti__author";

CREATE VIEW "qti__author"."attribute_admission" ("attribute", "kind") AS
SELECT "r1"."attribute", "r1"."kind"
FROM "qti"."attribute_admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_admission" TO "qti__author";

CREATE VIEW "qti__author"."attribute_exclusion" ("host", "namespace") AS
SELECT "r1"."host", "r1"."namespace"
FROM "qti"."attribute_exclusion" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_exclusion" TO "qti__author";

CREATE VIEW "qti__author"."attribute_file_reference" ("attribute", "document", "kind", "node", "package", "path", "position") AS
SELECT "r1"."attribute", "r1"."document", "r1"."kind", "r1"."node", "r1"."package", "r1"."path", "r1"."position"
FROM "qti"."attribute_file_reference" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_file_reference" TO "qti__author";

CREATE VIEW "qti__author"."attribute_lexical" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_lexical" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_lexical" TO "qti__author";

CREATE VIEW "qti__author"."attribute_spelling" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_spelling" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_spelling" TO "qti__author";

CREATE VIEW "qti__author"."attribute_wildcard" ("host", "policy", "process", "target") AS
SELECT "r1"."host", "r1"."policy", "r1"."process", "r1"."target"
FROM "qti"."attribute_wildcard" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_wildcard" TO "qti__author";

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."built_in_ref" ("id", "name", "referrer_kind") AS
SELECT "r1"."id", "r1"."name", "r1"."referrer_kind"
FROM "qti"."built_in_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."built_in_ref" TO "qti__author";

CREATE VIEW "qti__author"."coords" ("node", "owner_kind", "shape", "value") AS
SELECT "r1"."node", "r1"."owner_kind", "r1"."shape", "r1"."value"
FROM "qti"."coords" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords" TO "qti__author";

CREATE VIEW "qti__author"."declared_ref" ("declaration_kind", "document", "id", "identifier", "referrer_kind") AS
SELECT "r1"."declaration_kind", "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind"
FROM "qti"."declared_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_ref" TO "qti__author";

CREATE VIEW "qti__author"."document_id" ("document", "holder", "id") AS
SELECT "r1"."document", "r1"."holder", "r1"."id"
FROM "qti"."document_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_id" TO "qti__author";

CREATE VIEW "qti__author"."document_xml_id" ("attribute", "document", "id", "kind", "node") AS
SELECT "r1"."attribute", "r1"."document", "r1"."id", "r1"."kind", "r1"."node"
FROM "qti"."document_xml_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_xml_id" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_ancestry", "child_kind", "parent", "parent_ancestry", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_ancestry", "r1"."child_kind", "r1"."parent", "r1"."parent_ancestry", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
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

CREATE VIEW "qti__author"."foreign_attribute" ("kind", "local", "namespace", "node", "prefix", "process", "root_kind", "schema_set", "value") AS
SELECT "r1"."kind", "r1"."local", "r1"."namespace", "r1"."node", "r1"."prefix", "r1"."process", "r1"."root_kind", "r1"."schema_set", "r1"."value"
FROM "qti"."foreign_attribute" AS "r1";

GRANT SELECT ON TABLE "qti__author"."foreign_attribute" TO "qti__author";

CREATE VIEW "qti__author"."foreign_element" ("id", "local", "namespace", "parent_kind", "prefix", "root_kind", "schema_set") AS
SELECT "r1"."id", "r1"."local", "r1"."namespace", "r1"."parent_kind", "r1"."prefix", "r1"."root_kind", "r1"."schema_set"
FROM "qti"."foreign_element" AS "r1";

GRANT SELECT ON TABLE "qti__author"."foreign_element" TO "qti__author";

CREATE VIEW "qti__author"."global_attribute" ("local", "namespace", "set") AS
SELECT "r1"."local", "r1"."namespace", "r1"."set"
FROM "qti"."global_attribute" AS "r1";

GRANT SELECT ON TABLE "qti__author"."global_attribute" TO "qti__author";

CREATE VIEW "qti__author"."global_element" ("local", "namespace", "set") AS
SELECT "r1"."local", "r1"."namespace", "r1"."set"
FROM "qti"."global_element" AS "r1";

GRANT SELECT ON TABLE "qti__author"."global_element" TO "qti__author";

CREATE VIEW "qti__author"."html_id" ("attribute", "document", "id", "kind", "node") AS
SELECT "r1"."attribute", "r1"."document", "r1"."id", "r1"."kind", "r1"."node"
FROM "qti"."html_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."html_id" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("adaptive", "ancestry", "document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."adaptive", "r1"."ancestry", "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."lom_language" ("id", "lom", "owner", "parent_kind", "position", "value") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent_kind", "r1"."position", "r1"."value"
FROM "qti"."lom_language" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_language" TO "qti__author";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

CREATE VIEW "qti__author"."manifest_id" ("holder", "id", "package") AS
SELECT "r1"."holder", "r1"."id", "r1"."package"
FROM "qti"."manifest_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_id" TO "qti__author";

CREATE VIEW "qti__author"."manifest_xml_id" ("attribute", "id", "kind", "node", "package") AS
SELECT "r1"."attribute", "r1"."id", "r1"."kind", "r1"."node", "r1"."package"
FROM "qti"."manifest_xml_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_xml_id" TO "qti__author";

CREATE VIEW "qti__author"."no_namespace_schema_location" ("node", "prefix", "value") AS
SELECT "r1"."node", "r1"."prefix", "r1"."value"
FROM "qti"."no_namespace_schema_location" AS "r1";

GRANT SELECT ON TABLE "qti__author"."no_namespace_schema_location" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."node_catalog_idref" ("attribute", "document", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."document", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_catalog_idref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_catalog_idref" TO "qti__author";

CREATE VIEW "qti__author"."node_class" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_class" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_class" TO "qti__author";

CREATE VIEW "qti__author"."node_dir" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_dir" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_dir" TO "qti__author";

CREATE VIEW "qti__author"."node_label" ("attribute", "kind", "node", "root_kind", "tree", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."root_kind", "r1"."tree", "r1"."value"
FROM "qti"."node_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_label" TO "qti__author";

CREATE VIEW "qti__author"."node_lang" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_lang" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_lang" TO "qti__author";

CREATE VIEW "qti__author"."node_suppress_tts" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_suppress_tts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_suppress_tts" TO "qti__author";

CREATE VIEW "qti__author"."node_xml_base" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_xml_base" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_xml_base" TO "qti__author";

CREATE VIEW "qti__author"."node_xml_lang" ("attribute", "kind", "node", "root_kind", "tree", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."root_kind", "r1"."tree", "r1"."value"
FROM "qti"."node_xml_lang" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_xml_lang" TO "qti__author";

CREATE VIEW "qti__author"."node_xml_space" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_xml_space" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_xml_space" TO "qti__author";

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

CREATE VIEW "qti__author"."outcome_min_max" ("id", "kind", "outcome_identifier") AS
SELECT "r1"."id", "r1"."kind", "r1"."outcome_identifier"
FROM "qti"."outcome_min_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_min_max" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."record_binding_fit" ("interaction_kind") AS
SELECT "r1"."interaction_kind"
FROM "qti"."record_binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."root_schema_set" ("root", "set") AS
SELECT "r1"."root", "r1"."set"
FROM "qti"."root_schema_set" AS "r1";

GRANT SELECT ON TABLE "qti__author"."root_schema_set" TO "qti__author";

CREATE VIEW "qti__author"."rule_operand" ("child", "position", "rule", "rule_kind") AS
SELECT "r1"."child", "r1"."position", "r1"."rule", "r1"."rule_kind"
FROM "qti"."rule_operand" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rule_operand" TO "qti__author";

CREATE VIEW "qti__author"."section_variable_declared" ("declaration_kind", "identifier", "ref", "referrer_kind", "test") AS
SELECT "r1"."declaration_kind", "r1"."identifier", "r1"."ref", "r1"."referrer_kind", "r1"."test"
FROM "qti"."section_variable_declared" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_variable_declared" TO "qti__author";

CREATE VIEW "qti__author"."section_variable_ref" ("document", "id", "identifier", "referrer_kind", "root") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind", "r1"."root"
FROM "qti"."section_variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."source" ("id", "parent_kind", "src") AS
SELECT "r1"."id", "r1"."parent_kind", "r1"."src"
FROM "qti"."source" AS "r1";

GRANT SELECT ON TABLE "qti__author"."source" TO "qti__author";

CREATE VIEW "qti__author"."structure_child" ("child", "child_kind", "parent") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent"
FROM "qti"."structure_child" AS "r1";

GRANT SELECT ON TABLE "qti__author"."structure_child" TO "qti__author";

CREATE VIEW "qti__author"."template_parameter_ref" ("document", "id", "identifier", "referrer_kind", "root_kind") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind", "r1"."root_kind"
FROM "qti"."template_parameter_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_parameter_ref" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE VIEW "qti__author"."wildcard_exclusion" ("host", "namespace") AS
SELECT "r1"."host", "r1"."namespace"
FROM "qti"."wildcard_exclusion" AS "r1";

GRANT SELECT ON TABLE "qti__author"."wildcard_exclusion" TO "qti__author";

CREATE VIEW "qti__author"."wildcard_host" ("host", "policy", "process", "target") AS
SELECT "r1"."host", "r1"."policy", "r1"."process", "r1"."target"
FROM "qti"."wildcard_host" AS "r1";

GRANT SELECT ON TABLE "qti__author"."wildcard_host" TO "qti__author";

CREATE VIEW "qti__author"."xlink_actuate" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_actuate" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_actuate" TO "qti__author";

CREATE VIEW "qti__author"."xlink_arcrole" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_arcrole" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_arcrole" TO "qti__author";

CREATE VIEW "qti__author"."xlink_from" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_from" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_from" TO "qti__author";

CREATE VIEW "qti__author"."xlink_href" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_href" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_href" TO "qti__author";

CREATE VIEW "qti__author"."xlink_label" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_label" TO "qti__author";

CREATE VIEW "qti__author"."xlink_role" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_role" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_role" TO "qti__author";

CREATE VIEW "qti__author"."xlink_show" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_show" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_show" TO "qti__author";

CREATE VIEW "qti__author"."xlink_title" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_title" TO "qti__author";

CREATE VIEW "qti__author"."xlink_to" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_to" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_to" TO "qti__author";

CREATE VIEW "qti__author"."xlink_type" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."xlink_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xlink_type" TO "qti__author";

CREATE VIEW "qti__author"."xsi_nil" ("kind", "node", "prefix", "value") AS
SELECT "r1"."kind", "r1"."node", "r1"."prefix", "r1"."value"
FROM "qti"."xsi_nil" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xsi_nil" TO "qti__author";

CREATE VIEW "qti__author"."xsi_type" ("node", "prefix", "value") AS
SELECT "r1"."node", "r1"."prefix", "r1"."value"
FROM "qti"."xsi_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xsi_type" TO "qti__author";

CREATE VIEW "qti__author"."xsi_type_attribute" ("kind", "local", "namespace", "node", "prefix", "value") AS
SELECT "r1"."kind", "r1"."local", "r1"."namespace", "r1"."node", "r1"."prefix", "r1"."value"
FROM "qti"."xsi_type_attribute" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xsi_type_attribute" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."document_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_xml_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."foreign_attribute" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."foreign_element" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_xml_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."no_namespace_schema_location" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_xml_space" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_actuate" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_arcrole" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_from" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_href" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_role" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_show" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_to" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xlink_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xsi_nil" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xsi_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."xsi_type_attribute" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
