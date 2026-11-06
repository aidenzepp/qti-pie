DROP POLICY "qti__author" ON "qti"."x_include_parse";

DROP POLICY "qti__author" ON "qti"."variable_ref";

DROP POLICY "qti__author" ON "qti"."typed_declaration";

DROP POLICY "qti__author" ON "qti"."tree";

DROP POLICY "qti__author" ON "qti"."slider_interaction";

DROP POLICY "qti__author" ON "qti"."rule_operand";

DROP POLICY "qti__author" ON "qti"."resource";

DROP POLICY "qti__author" ON "qti"."printed_variable";

DROP POLICY "qti__author" ON "qti"."package_entry";

DROP POLICY "qti__author" ON "qti"."node_label";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."item_tool";

DROP POLICY "qti__author" ON "qti"."interaction_binding";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."document";

DROP POLICY "qti__author" ON "qti"."declaration";

DROP POLICY "qti__author" ON "qti"."assessment_item_label";

DROP POLICY "qti__author" ON "qti"."assessment_item";

DROP VIEW "qti__author"."x_include_parse";

DROP VIEW "qti__author"."variable_ref";

DROP VIEW "qti__author"."typed_declaration";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."tree";

DROP VIEW "qti__author"."template_parameter_ref";

DROP VIEW "qti__author"."source";

DROP VIEW "qti__author"."slider_interaction";

DROP VIEW "qti__author"."rule_operand";

DROP VIEW "qti__author"."resource";

DROP VIEW "qti__author"."record_binding_fit";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."printed_variable";

DROP VIEW "qti__author"."package_entry";

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

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."lom_language";

DROP VIEW "qti__author"."item_tool";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."html_id";

DROP VIEW "qti__author"."expression_max";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."document";

DROP VIEW "qti__author"."declared_ref";

DROP VIEW "qti__author"."declaration";

DROP VIEW "qti__author"."coords";

DROP VIEW "qti__author"."built_in_ref";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_spelling";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."attribute_admission";

DROP VIEW "qti__author"."associable_hotspot";

DROP VIEW "qti__author"."assessment_item_label";

DROP VIEW "qti__author"."assessment_item";

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

CREATE TABLE "qti"."adaptive_engine_ref" (
  "href" "qti"."adaptive_ref_href" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."adaptive_ref_identifier" NOT NULL,
  CONSTRAINT "__adaptive_engine_ref_pk_5flj4nu6qs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."adaptive_selection" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__adaptive_selection_pk_x342t7yey3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."adaptive_settings_ref" (
  "href" "qti"."adaptive_ref_href" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."adaptive_ref_identifier" NOT NULL,
  CONSTRAINT "__adaptive_settings_ref_pk_uhkyv6yefd" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."assessment_item_label" ADD COLUMN "root" "qti"."root_kind" DEFAULT 'item' NOT NULL;
ALTER TABLE "qti"."assessment_item_label" ALTER COLUMN "root" DROP DEFAULT;

CREATE TABLE "qti"."assessment_section" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "fixed" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  "keep_together" "qti"."xs_boolean" NOT NULL,
  "required" "qti"."xs_boolean" NOT NULL,
  "title" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "visible" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__assessment_section_pk_ilhdvngzfi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."assessment_stimulus" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__assessment_stimulus_pk_nv7fugfvgl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."assessment_test" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__assessment_test_pk_p3ddtwwgjg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."attribute_file_reference" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__attribute_file_reference_pk_3iujzlflq2" PRIMARY KEY ("node", "attribute", "position")
);

CREATE TABLE "qti"."branch_rule" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "owner_kind" "qti"."structure_holder" NOT NULL,
  "target_kind" "qti"."branch_target" NOT NULL,
  CONSTRAINT "__branch_rule_pk_ee2mk7zphv" PRIMARY KEY ("id"),
  CONSTRAINT "__branch_rule_key_id_owner_kind_4tcfegx7uq" UNIQUE ("id", "owner_kind"),
  CONSTRAINT "__branch_rule_key_id_document_7wqsykdfyt" UNIQUE ("id", "document"),
  CONSTRAINT "__branch_rule_key_id_target_kind_ud2n56dtwn" UNIQUE ("id", "target_kind")
);

CREATE TABLE "qti"."branch_rule_exit" (
  "exit" "qti"."branch_exit" NOT NULL,
  "rule" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__branch_rule_exit_pk_c5dpg3n42c" PRIMARY KEY ("rule")
);

CREATE TABLE "qti"."branch_rule_target" (
  "holder_kind" "qti"."structure_holder" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  "owner_kind" "qti"."structure_holder" NOT NULL,
  "rule" "pg_catalog"."uuid" NOT NULL,
  "scope" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__branch_rule_target_pk_rmslmfdder" PRIMARY KEY ("rule"),
  CONSTRAINT "branch_target_kind" CHECK (("holder_kind" = 'part'::"qti"."structure_holder" AND "owner_kind" = 'part'::"qti"."structure_holder" OR "holder_kind" <> 'part'::"qti"."structure_holder" AND "owner_kind" <> 'part'::"qti"."structure_holder") IS TRUE)
);

CREATE TABLE "qti"."declared_allow_comment" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_allow_comment_pk_fd2vvufu2a" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_allow_late_submission" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_allow_late_submission_pk_p4avvo66j7" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_allow_review" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_allow_review_pk_gsadhotvy2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_allow_skipping" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_allow_skipping_pk_cfodezuoh5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_item_ref_fixed" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_item_ref_fixed_pk_2rxinlz7zf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_item_ref_required" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_item_ref_required_pk_5ofua5f2vn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_ordering_shuffle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_ordering_shuffle_pk_f7ydape5bs" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_section_fixed" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_section_fixed_pk_qgubwqh3az" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_section_keep_together" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_section_keep_together_pk_wups6kcxac" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_section_required" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_section_required_pk_6x5az6ztcw" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_show_feedback" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_show_feedback_pk_7qjafqffe3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_show_solution" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_show_solution_pk_r6pdvzfkoq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_validate_responses" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_validate_responses_pk_tpp6dmk2ni" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_with_replacement" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_with_replacement_pk_hwe6yn36mr" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."item_instance_spelling" (
  "ref" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_hv3bw3mdte" NOT NULL,
  CONSTRAINT "__item_instance_spelling_pk_qu7v2ohy24" PRIMARY KEY ("ref")
);

CREATE TABLE "qti"."item_instance_variable_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "instance" bigint NOT NULL,
  "prefix" "qti"."test_structure_identifier" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "variable" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__item_instance_variable_ref_pk_3xh5omm42u" PRIMARY KEY ("id"),
  CONSTRAINT "item_instance_positive" CHECK (("instance" >= 1::bigint) IS TRUE),
  CONSTRAINT "item_instance_variable_root" CHECK (("root" = 'test'::"qti"."root_kind") IS TRUE)
);

CREATE TABLE "qti"."item_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "fixed" "qti"."xs_boolean" NOT NULL,
  "href" "qti"."item_ref_href" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  "required" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__item_ref_pk_w6hvuhcfny" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."item_ref_category" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."category_list" NOT NULL,
  CONSTRAINT "__item_ref_category_pk_qo44w672sc" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."item_ref_document" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  CONSTRAINT "__item_ref_document_pk_ylsc7bhhax" PRIMARY KEY ("item_ref"),
  CONSTRAINT "__item_ref_document_key_item_ref_document_4h5jz7gpdk" UNIQUE ("item_ref", "document")
);

CREATE TABLE "qti"."item_ref_lti" (
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__item_ref_lti_pk_52of3cel44" PRIMARY KEY ("item_ref"),
  CONSTRAINT "item_ref_lti_type" CHECK (("type" IN ('imsbasiclti_xmlv1p3'::"pg_catalog"."text", 'imslti_xmlv1p1'::"pg_catalog"."text", 'imsltia_xmlv1p0'::"pg_catalog"."text")) IS TRUE)
);

CREATE TABLE "qti"."item_ref_resolution" (
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  "target_kind" "qti"."item_ref_target" NOT NULL,
  CONSTRAINT "__item_ref_resolution_pk_ijrm7rvkka" PRIMARY KEY ("item_ref"),
  CONSTRAINT "__item_ref_resolution_key_item_ref_target_kind_somrtnmqk6" UNIQUE ("item_ref", "target_kind")
);

CREATE TABLE "qti"."item_session_control" (
  "allow_comment" "qti"."xs_boolean" NOT NULL,
  "allow_review" "qti"."xs_boolean" NOT NULL,
  "allow_skipping" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "show_feedback" "qti"."xs_boolean" NOT NULL,
  "show_solution" "qti"."xs_boolean" NOT NULL,
  "validate_responses" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__item_session_control_pk_nbur6y7vcd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."item_session_max_attempts" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__item_session_max_attempts_pk_xacph2l5cm" PRIMARY KEY ("node"),
  CONSTRAINT "max_attempts_int" CHECK (("value" >= (-2147483648)::bigint AND "value" <= 2147483647::bigint) IS TRUE)
);

CREATE TABLE "qti"."item_stimulus_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "href" "qti"."stimulus_ref_href" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."stimulus_ref_identifier" NOT NULL,
  CONSTRAINT "__item_stimulus_ref_pk_mp2mwyljzk" PRIMARY KEY ("id"),
  CONSTRAINT "__item_stimulus_ref_key_document_identifier_35hgelcdwa" UNIQUE ("document", "identifier")
);

CREATE TABLE "qti"."item_stimulus_ref_title" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__item_stimulus_ref_title_pk_ratovulq3i" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."item_tool" ADD COLUMN "root" "qti"."root_kind" DEFAULT 'item' NOT NULL;
ALTER TABLE "qti"."item_tool" ALTER COLUMN "root" DROP DEFAULT;

CREATE TABLE "qti"."item_variable_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."test_structure_identifier" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "variable" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__item_variable_ref_pk_njgtpujv2f" PRIMARY KEY ("id"),
  CONSTRAINT "item_variable_root" CHECK (("root" = 'test'::"qti"."root_kind") IS TRUE)
);

CREATE TABLE "qti"."metadata_ref" (
  "href" "qti"."adaptive_ref_href" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."adaptive_ref_identifier" NOT NULL,
  CONSTRAINT "__metadata_ref_pk_imiuigdq6q" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."ordering" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "shuffle" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__ordering_pk_44ka4uv5td" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."pre_condition" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__pre_condition_pk_jgg2ycaenq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."prefixed_built_in" (
  "built_in" "qti"."built_in" NOT NULL,
  "ref" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__prefixed_built_in_pk_ovjejkbjyn" PRIMARY KEY ("ref", "test"),
  CONSTRAINT "prefixed_built_in_name" CHECK (("built_in" IN ('duration'::"qti"."built_in", 'numAttempts'::"qti"."built_in", 'completionStatus'::"qti"."built_in")) IS TRUE)
);

CREATE TABLE "qti"."prefixed_declared" (
  "item_document" "pg_catalog"."uuid" NOT NULL,
  "ref" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  "variable" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__prefixed_declared_pk_fsrr5duoxo" PRIMARY KEY ("ref", "test")
);

CREATE TABLE "qti"."prefixed_mapped" (
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "ref" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  "variable" "qti"."mapped_variable_name" NOT NULL,
  CONSTRAINT "__prefixed_mapped_pk_bvkuuujh5y" PRIMARY KEY ("ref", "test")
);

CREATE TABLE "qti"."prefixed_variable_source" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "item_document" "pg_catalog"."uuid" NOT NULL,
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."test_structure_identifier" NOT NULL,
  "ref" "pg_catalog"."uuid" NOT NULL,
  "ref_kind" "qti"."ref_kind" NOT NULL,
  "source" "qti"."prefixed_source" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__prefixed_variable_source_pk_36jygg4j3t" PRIMARY KEY ("ref", "test"),
  CONSTRAINT "prefixed_variable_source_kind" CHECK (("ref_kind" IN ('itemVariable'::"qti"."ref_kind", 'itemInstanceVariable'::"qti"."ref_kind", 'sectionVariable'::"qti"."ref_kind")) IS TRUE),
  CONSTRAINT "__prefixed_variable_source_key_ref_test_item_uhyl75fsrh" UNIQUE ("ref", "test", "item_document"),
  CONSTRAINT "__prefixed_variable_source_key_ref_test_item_ref_eehqzlfvbd" UNIQUE ("ref", "test", "item_ref"),
  CONSTRAINT "__prefixed_variable_source_key_ref_test_source_hf43cbuvqp" UNIQUE ("ref", "test", "source"),
  CONSTRAINT "__prefixed_variable_source_key_ref_test_ref_kind_g2cr4ejczo" UNIQUE ("ref", "test", "ref_kind")
);

CREATE TABLE "qti"."required_child" (
  "child" "pg_catalog"."uuid" NOT NULL,
  "parent" "pg_catalog"."uuid" NOT NULL,
  "required" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__required_child_pk_cujcsefy6i" PRIMARY KEY ("child"),
  CONSTRAINT "required_child_required" CHECK (("required" IN ('true'::"qti"."xs_boolean", '1'::"qti"."xs_boolean")) IS TRUE)
);

CREATE TABLE "qti"."section_duration_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."test_structure_identifier" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__section_duration_ref_pk_6zjzevf72d" PRIMARY KEY ("id"),
  CONSTRAINT "section_duration_root" CHECK (("root" = 'test'::"qti"."root_kind") IS TRUE)
);

CREATE TABLE "qti"."section_duration_target" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "holder" "pg_catalog"."uuid" NOT NULL,
  "holder_kind" "qti"."structure_holder" NOT NULL,
  "prefix" "qti"."test_structure_identifier" NOT NULL,
  "ref" "pg_catalog"."uuid" NOT NULL,
  "ref_kind" "qti"."ref_kind" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_duration_target_pk_fbxzlpnzz6" PRIMARY KEY ("ref", "test"),
  CONSTRAINT "section_duration_target_holder" CHECK (("holder_kind" IN ('part'::"qti"."structure_holder", 'section'::"qti"."structure_holder")) IS TRUE),
  CONSTRAINT "section_duration_target_kind" CHECK (("ref_kind" IN ('sectionDuration'::"qti"."ref_kind", 'sectionVariable'::"qti"."ref_kind")) IS TRUE),
  CONSTRAINT "__section_duration_target_key_ref_test_ref_kind_2lnypik4z7" UNIQUE ("ref", "test", "ref_kind")
);

CREATE TABLE "qti"."section_feedback_outcome_ref" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_feedback_outcome_ref_pk_ow4js4b7wa" PRIMARY KEY ("node", "test"),
  CONSTRAINT "section_feedback_outcome_ref_type" CHECK (("cardinality" IN ('single'::"qti"."typed_cardinality", 'multiple'::"qti"."typed_cardinality") AND "base_type" = 'identifier'::"qti"."base_type") IS TRUE)
);

CREATE TABLE "qti"."section_identifier_target" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "holder_kind" "qti"."structure_holder" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_identifier_target_pk_4c4bz2q43g" PRIMARY KEY ("node", "test"),
  CONSTRAINT "section_identifier_target_holder_kind" CHECK (("holder_kind" = 'section'::"qti"."structure_holder" OR "holder_kind" = 'sectionRef'::"qti"."structure_holder") IS TRUE)
);

CREATE TABLE "qti"."section_printed_variable_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_printed_variable_ref_pk_luwlztqnox" PRIMARY KEY ("node", "test"),
  CONSTRAINT "section_printed_variable_ref_kind" CHECK (("kind" IN ('outcome'::"qti"."declaration_kind", 'template'::"qti"."declaration_kind")) IS TRUE)
);

CREATE TABLE "qti"."section_printed_variable_var_ref" (
  "attribute" "qti"."printed_variable_attr" NOT NULL,
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_printed_variable_var_ref_pk_nje3waouaf" PRIMARY KEY ("node", "attribute", "test"),
  CONSTRAINT "section_printed_variable_var_ref_type" CHECK (("kind" IN ('outcome'::"qti"."declaration_kind", 'template'::"qti"."declaration_kind") AND "base_type" = 'integer'::"qti"."base_type" AND "cardinality" = 'single'::"qti"."typed_cardinality") IS TRUE)
);

CREATE TABLE "qti"."section_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "href" "qti"."section_ref_href" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  CONSTRAINT "__section_ref_pk_jzoxzjo4g7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."section_ref_resolution" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  "section_ref" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_ref_resolution_pk_oxwwutqgux" PRIMARY KEY ("section_ref")
);

CREATE TABLE "qti"."section_variable_declared" (
  "declaration_kind" "qti"."declaration_kind" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "ref" "pg_catalog"."uuid" NOT NULL,
  "referrer_kind" "qti"."node_kind" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_variable_declared_pk_vb6ton4lie" PRIMARY KEY ("ref", "test"),
  CONSTRAINT "section_variable_declared_kind" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind") OR "declaration_kind" IN ('response'::"qti"."declaration_kind", 'outcome'::"qti"."declaration_kind") AND "referrer_kind" = 'qti-set-default-value'::"qti"."node_kind" OR "referrer_kind" IN ('qti-correct'::"qti"."node_kind", 'qti-map-response'::"qti"."node_kind", 'qti-map-response-point'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind") AND "declaration_kind" = 'response'::"qti"."declaration_kind" OR "referrer_kind" IN ('qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind") AND "declaration_kind" = 'outcome'::"qti"."declaration_kind" OR "declaration_kind" = 'template'::"qti"."declaration_kind" AND "referrer_kind" = 'qti-set-template-value'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."section_variable_duration" (
  "ref" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_variable_duration_pk_c2hxdf22ce" PRIMARY KEY ("ref", "test")
);

CREATE TABLE "qti"."section_variable_prefixed" (
  "ref" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_variable_prefixed_pk_i7usuhylm2" PRIMARY KEY ("ref", "test")
);

CREATE TABLE "qti"."section_variable_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "referrer_kind" "qti"."node_kind" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__section_variable_ref_pk_nxo7577xz5" PRIMARY KEY ("id"),
  CONSTRAINT "section_variable_referrer" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind", 'qti-correct'::"qti"."node_kind", 'qti-map-response'::"qti"."node_kind", 'qti-map-response-point'::"qti"."node_kind")) IS TRUE),
  CONSTRAINT "section_variable_root" CHECK (("root" = 'section'::"qti"."root_kind") IS TRUE),
  CONSTRAINT "__section_variable_ref_key_id_document_2fw6audat2" UNIQUE ("id", "document"),
  CONSTRAINT "__section_variable_ref_key_id_identifier_referrer_delp4ztd3t" UNIQUE ("id", "identifier", "referrer_kind")
);

CREATE TABLE "qti"."section_variable_resolution" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "ref" "pg_catalog"."uuid" NOT NULL,
  "target" "qti"."section_variable_target" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_variable_resolution_pk_klacthyx35" PRIMARY KEY ("ref", "test"),
  CONSTRAINT "__section_variable_resolution_key_ref_test_target_gt6iqskdzl" UNIQUE ("ref", "test", "target")
);

CREATE TABLE "qti"."selection" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "section" "pg_catalog"."uuid" NOT NULL,
  "select" bigint NOT NULL,
  "with_replacement" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__selection_pk_7kinlubjfd" PRIMARY KEY ("id"),
  CONSTRAINT "__selection_key_section_l33vlzy3jd" UNIQUE ("section"),
  CONSTRAINT "selection_select_int" CHECK (("select" >= (-2147483648)::bigint AND "select" <= 2147483647::bigint) IS TRUE),
  CONSTRAINT "__selection_key_section_select_with_replacement_op3ucqpswj" UNIQUE ("section", "select", "with_replacement")
);

CREATE TABLE "qti"."selection_bounded" (
  "section" "pg_catalog"."uuid" NOT NULL,
  "select" bigint NOT NULL,
  "with_replacement" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__selection_bounded_pk_hsuptdknon" PRIMARY KEY ("section"),
  CONSTRAINT "selection_bounded_without_replacement" CHECK (("with_replacement" = '0'::"qti"."xs_boolean" OR "with_replacement" = 'false'::"qti"."xs_boolean") IS TRUE)
);

ALTER TABLE "qti"."slider_interaction" ALTER COLUMN "lower_bound" TYPE "qti"."slider_bound" USING "lower_bound"::"qti"."slider_bound";

ALTER TABLE "qti"."slider_interaction" ALTER COLUMN "upper_bound" TYPE "qti"."slider_bound" USING "upper_bound"::"qti"."slider_bound";

CREATE TABLE "qti"."stimulus_body" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__stimulus_body_pk_4tkmqh7b42" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."stimulus_ref_resolution" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  "stimulus_ref" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__stimulus_ref_resolution_pk_pfagqolr7w" PRIMARY KEY ("stimulus_ref")
);

CREATE TABLE "qti"."structure_child" (
  "child" "pg_catalog"."uuid" NOT NULL,
  "child_kind" "qti"."node_kind" NOT NULL,
  "parent" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__structure_child_pk_qo52ahr3at" PRIMARY KEY ("child"),
  CONSTRAINT "__structure_child_key_child_parent_phgplnzs26" UNIQUE ("child", "parent")
);

CREATE TABLE "qti"."template_default" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "item_document" "pg_catalog"."uuid" NOT NULL,
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "template_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__template_default_pk_iqt4z54xsd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."test_document" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__test_document_pk_vo4n4a7gyn" PRIMARY KEY ("test", "document")
);

CREATE TABLE "qti"."test_feedback" (
  "access" "qti"."test_feedback_access" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "outcome_identifier" "qti"."variable_reference" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__test_feedback_pk_s53bngtfbl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."test_feedback_content_body" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__test_feedback_content_body_pk_a4e7lro7tj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."test_feedback_title" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__test_feedback_title_pk_wgb5wktgm2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."test_identifier" (
  "holder" "pg_catalog"."uuid" NOT NULL,
  "holder_kind" "qti"."structure_holder" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  "scope" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__test_identifier_pk_jdeul322bd" PRIMARY KEY ("holder"),
  CONSTRAINT "__test_identifier_key_scope_identifier_26d2ecbygl" UNIQUE ("scope", "identifier"),
  CONSTRAINT "__test_identifier_key_holder_identifier_holder_kind_5razf2ej3m" UNIQUE ("holder", "identifier", "holder_kind"),
  CONSTRAINT "__test_identifier_key_holder_scope_identifier_holder_k45eynn5fa" UNIQUE ("holder", "scope", "identifier", "holder_kind"),
  CONSTRAINT "__test_identifier_key_scope_identifier_holder_kind_b6ykpk77a2" UNIQUE ("scope", "identifier", "holder_kind")
);

CREATE TABLE "qti"."test_part" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  "navigation_mode" "qti"."navigation_mode" NOT NULL,
  "submission_mode" "qti"."submission_mode" NOT NULL,
  CONSTRAINT "__test_part_pk_i7s6pcqhin" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."test_part_title" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__test_part_title_pk_ke3qn3yv23" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."test_reach" (
  "holder" "pg_catalog"."uuid" NOT NULL,
  "holder_kind" "qti"."structure_holder" NOT NULL,
  "identifier" "qti"."test_structure_identifier" NOT NULL,
  "test" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__test_reach_pk_3wreqqiiy4" PRIMARY KEY ("test", "holder"),
  CONSTRAINT "__test_reach_key_test_identifier_eyslhe3bx2" UNIQUE ("test", "identifier"),
  CONSTRAINT "__test_reach_key_test_identifier_holder_kind_3vcxpnaxxf" UNIQUE ("test", "identifier", "holder_kind"),
  CONSTRAINT "__test_reach_key_test_identifier_holder_holder_kind_h524glzpon" UNIQUE ("test", "identifier", "holder", "holder_kind")
);

CREATE TABLE "qti"."test_rubric_block" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "view" "qti"."__text_5lyuoloiou" NOT NULL,
  CONSTRAINT "__test_rubric_block_pk_kp256ppswm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."test_rubric_block_use" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_kcydnvglpj" NOT NULL,
  CONSTRAINT "__test_rubric_block_use_pk_bzdtkpwmla" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."test_rubric_content_body" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__test_rubric_content_body_pk_q23lxpc2gs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."tests_hold" (
  "bound" "qti"."__text_tq7gq2jmkl" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tests_hold_pk_n6235zezsv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."time_limit_max" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."time_limit_seconds" NOT NULL,
  CONSTRAINT "__time_limit_max_pk_eg7rte4emn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."time_limit_min" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."time_limit_seconds" NOT NULL,
  CONSTRAINT "__time_limit_min_pk_yxqtkm4k3e" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."time_limits" (
  "allow_late_submission" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__time_limits_pk_233hp6xdum" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_data_ref" (
  "href" "qti"."adaptive_ref_href" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."adaptive_ref_identifier" NOT NULL,
  CONSTRAINT "__usage_data_ref_pk_6bp2ejo3w4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."variable_mapping" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "item_document" "pg_catalog"."uuid" NOT NULL,
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "source" "qti"."__text_rhdrzkabze" NOT NULL,
  "target" "qti"."mapped_variable_name" NOT NULL,
  CONSTRAINT "__variable_mapping_pk_6whxnfgvwi" PRIMARY KEY ("id"),
  CONSTRAINT "__variable_mapping_key_item_ref_target_c6yqodtijd" UNIQUE ("item_ref", "target")
);

CREATE TABLE "qti"."weight" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."weight_reference" NOT NULL,
  "item_ref" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."weight_value" NOT NULL,
  CONSTRAINT "__weight_pk_p77rl634io" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."adaptive_engine_ref" ADD COLUMN "__tag_kind_qti_adaptive_engine_ref_qzxlqmeeko" "qti"."node_kind" GENERATED ALWAYS AS ('qti-adaptive-engine-ref'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."adaptive_selection" ADD COLUMN "__tag_kind_qti_adaptive_selection_kekye7hasu" "qti"."node_kind" GENERATED ALWAYS AS ('qti-adaptive-selection'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."adaptive_settings_ref" ADD COLUMN "__tag_kind_qti_adaptive_settings_ref_dq6tuiwszr" "qti"."node_kind" GENERATED ALWAYS AS ('qti-adaptive-settings-ref'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."assessment_section" ADD COLUMN "__tag_kind_qti_assessment_section_wauaiptqxk" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-section'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."assessment_section" ADD COLUMN "__tag_holder_kind_section_ejkpupg2zz" "qti"."structure_holder" GENERATED ALWAYS AS ('section'::"qti"."structure_holder") STORED NOT NULL;

ALTER TABLE "qti"."assessment_stimulus" ADD COLUMN "__tag_kind_qti_assessment_stimulus_rdg5it6jdz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-stimulus'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."assessment_test" ADD COLUMN "__tag_kind_qti_assessment_test_2ltodxnrpy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-test'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."branch_rule" ADD COLUMN "__tag_kind_qti_branch_rule_bnu6rjryqc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-branch-rule'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."branch_rule_exit" ADD COLUMN "__tag_target_kind_exit_aicxomz3hh" "qti"."branch_target" GENERATED ALWAYS AS ('exit'::"qti"."branch_target") STORED NOT NULL;

ALTER TABLE "qti"."branch_rule_target" ADD COLUMN "__tag_target_kind_ref_seeentthk7" "qti"."branch_target" GENERATED ALWAYS AS ('ref'::"qti"."branch_target") STORED NOT NULL;

ALTER TABLE "qti"."item_instance_variable_ref" ADD COLUMN "__tag_kind_item_instance_variable_qcrtkmyrc5" "qti"."ref_kind" GENERATED ALWAYS AS ('itemInstanceVariable'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_ref" ADD COLUMN "__tag_kind_qti_assessment_item_ref_hps2s36don" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-item-ref'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_ref" ADD COLUMN "__tag_holder_kind_item_ref_kytin3i6mz" "qti"."structure_holder" GENERATED ALWAYS AS ('itemRef'::"qti"."structure_holder") STORED NOT NULL;

ALTER TABLE "qti"."item_ref_document" ADD COLUMN "__tag_root_item_wlk5is6qw7" "qti"."root_kind" GENERATED ALWAYS AS ('item'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_ref_document" ADD COLUMN "__tag_target_kind_item_fgwqiexuve" "qti"."item_ref_target" GENERATED ALWAYS AS ('item'::"qti"."item_ref_target") STORED NOT NULL;

ALTER TABLE "qti"."item_ref_lti" ADD COLUMN "__tag_target_kind_lti_ahi4eitc7u" "qti"."item_ref_target" GENERATED ALWAYS AS ('lti'::"qti"."item_ref_target") STORED NOT NULL;

ALTER TABLE "qti"."item_session_control" ADD COLUMN "__tag_kind_qti_item_session_control_ypl7kurks7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-item-session-control'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_stimulus_ref" ADD COLUMN "__tag_kind_qti_assessment_stimulus_ref_jw5j27wnfb" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-stimulus-ref'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_variable_ref" ADD COLUMN "__tag_kind_item_variable_5wfcxwh5gq" "qti"."ref_kind" GENERATED ALWAYS AS ('itemVariable'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."metadata_ref" ADD COLUMN "__tag_kind_qti_metadata_ref_2foxgesdiw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-metadata-ref'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordering" ADD COLUMN "__tag_kind_qti_ordering_ezmnthie6z" "qti"."node_kind" GENERATED ALWAYS AS ('qti-ordering'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."pre_condition" ADD COLUMN "__tag_kind_qti_pre_condition_mirfvuo5br" "qti"."node_kind" GENERATED ALWAYS AS ('qti-pre-condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."prefixed_built_in" ADD COLUMN "__tag_source_built_in_win2m4ydys" "qti"."prefixed_source" GENERATED ALWAYS AS ('builtIn'::"qti"."prefixed_source") STORED NOT NULL;

ALTER TABLE "qti"."prefixed_declared" ADD COLUMN "__tag_source_declared_sdgzhu26kd" "qti"."prefixed_source" GENERATED ALWAYS AS ('declared'::"qti"."prefixed_source") STORED NOT NULL;

ALTER TABLE "qti"."prefixed_mapped" ADD COLUMN "__tag_source_mapped_p7vxvhg6f7" "qti"."prefixed_source" GENERATED ALWAYS AS ('mapped'::"qti"."prefixed_source") STORED NOT NULL;

ALTER TABLE "qti"."prefixed_variable_source" ADD COLUMN "__tag_holder_kind_item_ref_47sb5enwfv" "qti"."structure_holder" GENERATED ALWAYS AS ('itemRef'::"qti"."structure_holder") STORED NOT NULL;

ALTER TABLE "qti"."section_duration_ref" ADD COLUMN "__tag_kind_section_duration_db6nf7nxso" "qti"."ref_kind" GENERATED ALWAYS AS ('sectionDuration'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."section_feedback_outcome_ref" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."section_ref" ADD COLUMN "__tag_kind_qti_assessment_section_ref_uewqzx3v4v" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-section-ref'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."section_ref" ADD COLUMN "__tag_holder_kind_section_ref_fcqoid3ohb" "qti"."structure_holder" GENERATED ALWAYS AS ('sectionRef'::"qti"."structure_holder") STORED NOT NULL;

ALTER TABLE "qti"."section_ref_resolution" ADD COLUMN "__tag_root_section_pd2d4gcywn" "qti"."root_kind" GENERATED ALWAYS AS ('section'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."section_variable_declared" ADD COLUMN "__tag_target_declared_ilhuctesh5" "qti"."section_variable_target" GENERATED ALWAYS AS ('declared'::"qti"."section_variable_target") STORED NOT NULL;

ALTER TABLE "qti"."section_variable_duration" ADD COLUMN "__tag_ref_kind_section_variable_jo65257ny5" "qti"."ref_kind" GENERATED ALWAYS AS ('sectionVariable'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."section_variable_duration" ADD COLUMN "__tag_target_duration_l44yrac3hq" "qti"."section_variable_target" GENERATED ALWAYS AS ('duration'::"qti"."section_variable_target") STORED NOT NULL;

ALTER TABLE "qti"."section_variable_prefixed" ADD COLUMN "__tag_ref_kind_section_variable_lyjzdtqixu" "qti"."ref_kind" GENERATED ALWAYS AS ('sectionVariable'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."section_variable_prefixed" ADD COLUMN "__tag_target_prefixed_gqdv7vjzm6" "qti"."section_variable_target" GENERATED ALWAYS AS ('prefixed'::"qti"."section_variable_target") STORED NOT NULL;

ALTER TABLE "qti"."section_variable_ref" ADD COLUMN "__tag_kind_section_variable_xx6oynyexh" "qti"."ref_kind" GENERATED ALWAYS AS ('sectionVariable'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."selection" ADD COLUMN "__tag_kind_qti_selection_lyq6lq42ud" "qti"."node_kind" GENERATED ALWAYS AS ('qti-selection'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."stimulus_body" ADD COLUMN "__tag_kind_qti_stimulus_body_lhe3p2vmfc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-stimulus-body'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."stimulus_ref_resolution" ADD COLUMN "__tag_root_stimulus_fnlqquajeh" "qti"."root_kind" GENERATED ALWAYS AS ('stimulus'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_default" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_default" ADD COLUMN "__tag_kind_qti_template_default_h5uiey2hdf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-default'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_document" ADD COLUMN "__tag_root_test_sfpw7z7lis" "qti"."root_kind" GENERATED ALWAYS AS ('test'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_feedback" ADD COLUMN "__tag_kind_qti_test_feedback_oicqmodm6p" "qti"."node_kind" GENERATED ALWAYS AS ('qti-test-feedback'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_feedback_content_body" ADD COLUMN "__tag_kind_qti_content_body_test_feedback_62lcd5o5q3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-content-body.testFeedback'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_part" ADD COLUMN "__tag_kind_qti_test_part_ewahlzefvg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-test-part'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_part" ADD COLUMN "__tag_holder_kind_part_e5bqbqbrvc" "qti"."structure_holder" GENERATED ALWAYS AS ('part'::"qti"."structure_holder") STORED NOT NULL;

ALTER TABLE "qti"."test_rubric_block" ADD COLUMN "__tag_kind_qti_rubric_block_test_qk6ijn65fj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-rubric-block.test'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_rubric_content_body" ADD COLUMN "__tag_kind_qti_content_body_test_rubric_jaxkcc3se5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-content-body.testRubric'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."time_limits" ADD COLUMN "__tag_kind_qti_time_limits_343jhkovjf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-time-limits'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_data_ref" ADD COLUMN "__tag_kind_qti_usagedata_ref_75tpeijppj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-usagedata-ref'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variable_mapping" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."variable_mapping" ADD COLUMN "__tag_kind_qti_variable_mapping_scg2kyf6y2" "qti"."node_kind" GENERATED ALWAYS AS ('qti-variable-mapping'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."weight" ADD COLUMN "__tag_kind_qti_weight_ecqobu7wca" "qti"."node_kind" GENERATED ALWAYS AS ('qti-weight'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."assessment_item_label" ADD CONSTRAINT "assessment_item_label_root" CHECK (("root" = 'item'::"qti"."root_kind" OR "root" = 'stimulus'::"qti"."root_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."interaction_binding"
  DROP CONSTRAINT "adaptive_feedback",
  ADD CONSTRAINT "adaptive_feedback" CHECK ((NOT "ancestry" IN ('fb'::"qti"."ancestry", 'fb.modal'::"qti"."ancestry", 'fb.rubric'::"qti"."ancestry", 'fb.tmpl'::"qti"."ancestry", 'fb.int'::"qti"."ancestry", 'fb.htx'::"qti"."ancestry", 'fb.testfb'::"qti"."ancestry", 'fb.modal.tmpl'::"qti"."ancestry", 'fb.modal.htx'::"qti"."ancestry", 'fb.rubric.tmpl'::"qti"."ancestry", 'fb.rubric.htx'::"qti"."ancestry", 'fb.tmpl.int'::"qti"."ancestry", 'fb.tmpl.htx'::"qti"."ancestry", 'fb.int.gap'::"qti"."ancestry", 'fb.int.choice'::"qti"."ancestry", 'fb.int.htx'::"qti"."ancestry", 'fb.htx.testfb'::"qti"."ancestry", 'fb.modal.tmpl.htx'::"qti"."ancestry", 'fb.rubric.tmpl.htx'::"qti"."ancestry", 'fb.tmpl.int.gap'::"qti"."ancestry", 'fb.tmpl.int.choice'::"qti"."ancestry", 'fb.tmpl.int.htx'::"qti"."ancestry", 'fb.int.gap.choice'::"qti"."ancestry", 'fb.int.gap.htx'::"qti"."ancestry", 'fb.int.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice'::"qti"."ancestry", 'fb.tmpl.int.gap.htx'::"qti"."ancestry", 'fb.tmpl.int.choice.htx'::"qti"."ancestry", 'fb.int.gap.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice.htx'::"qti"."ancestry") OR "adaptive" IN ('true'::"qti"."xs_boolean", '1'::"qti"."xs_boolean")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."item_tool" ADD CONSTRAINT "item_tool_root" CHECK (("root" = 'item'::"qti"."root_kind" OR "root" = 'stimulus'::"qti"."root_kind" OR "root" = 'test'::"qti"."root_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."node_label"
  DROP CONSTRAINT "node_label_not_root",
  ADD CONSTRAINT "node_label_not_root" CHECK (("kind" <> 'qti-assessment-item'::"qti"."node_kind" AND "kind" <> 'qti-assessment-stimulus'::"qti"."node_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."rule_operand"
  DROP CONSTRAINT "rule_operand_kind",
  ADD CONSTRAINT "rule_operand_kind" CHECK (("rule_kind" IN ('qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind", 'qti-set-template-value'::"qti"."node_kind", 'qti-set-default-value'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind", 'qti-template-constraint'::"qti"."node_kind", 'qti-response-if'::"qti"."node_kind", 'qti-response-else-if'::"qti"."node_kind", 'qti-outcome-if'::"qti"."node_kind", 'qti-outcome-else-if'::"qti"."node_kind", 'qti-template-if'::"qti"."node_kind", 'qti-template-else-if'::"qti"."node_kind", 'qti-pre-condition'::"qti"."node_kind", 'qti-branch-rule'::"qti"."node_kind", 'qti-template-default'::"qti"."node_kind")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."x_include_parse" ADD CONSTRAINT "x_include_parse_xml" CHECK (("value" = 'xml'::"qti"."x_include_parse_value") IS TRUE) NOT VALID;

ALTER TABLE "qti"."adaptive_engine_ref" ADD CONSTRAINT "__adaptive_engine_ref_fk_id_tag_kind_qti_adaptive_itu6wcu3f7" FOREIGN KEY ("id", "__tag_kind_qti_adaptive_engine_ref_qzxlqmeeko") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."adaptive_selection" ADD CONSTRAINT "__adaptive_selection_fk_id_tag_kind_qti_adaptive_x7infxtnhf" FOREIGN KEY ("id", "__tag_kind_qti_adaptive_selection_kekye7hasu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."adaptive_settings_ref" ADD CONSTRAINT "__adaptive_settings_ref_fk_id_tag_kind_qti_adaptive_ahxc5xtbyu" FOREIGN KEY ("id", "__tag_kind_qti_adaptive_settings_ref_dq6tuiwszr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_section" ADD CONSTRAINT "__assessment_section_fk_id_tag_kind_qti_assessment_utckduyvsh" FOREIGN KEY ("id", "__tag_kind_qti_assessment_section_wauaiptqxk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_section" ADD CONSTRAINT "__assessment_section_fk_id_document_httqfmaptl" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_section" ADD CONSTRAINT "__assessment_section_fk_id_document_identifier_tag_ydr455cp3q" FOREIGN KEY ("id", "document", "identifier", "__tag_holder_kind_section_ejkpupg2zz") REFERENCES "qti"."test_identifier" ("holder", "scope", "identifier", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_stimulus" ADD CONSTRAINT "__assessment_stimulus_fk_id_tag_kind_qti_assessment_fmerbs7eo7" FOREIGN KEY ("id", "__tag_kind_qti_assessment_stimulus_rdg5it6jdz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_test" ADD CONSTRAINT "__assessment_test_fk_id_tag_kind_qti_assessment_test_kts4yg2awt" FOREIGN KEY ("id", "__tag_kind_qti_assessment_test_2ltodxnrpy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_file_reference" ADD CONSTRAINT "__attribute_file_reference_fk_kind_attribute_rrl75v754m" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."attribute_file_reference" ADD CONSTRAINT "__attribute_file_reference_fk_node_document_no23h3mfut" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_file_reference" ADD CONSTRAINT "__attribute_file_reference_fk_node_kind_cptdkge57n" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_file_reference" ADD CONSTRAINT "__attribute_file_reference_fk_package_path_nybmfllbek" FOREIGN KEY ("package", "path") REFERENCES "qti"."package_entry" ("package", "path") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule" ADD CONSTRAINT "__branch_rule_fk_id_bn7l3fw6el" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule" ADD CONSTRAINT "__branch_rule_fk_id_tag_kind_qti_branch_rule_bnu_6_sakenq6bg4" FOREIGN KEY ("id", "__tag_kind_qti_branch_rule_bnu6rjryqc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule" ADD CONSTRAINT "__branch_rule_fk_id_owner_hjbeidqyxp" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule_exit" ADD CONSTRAINT "__branch_rule_exit_fk_rule_tag_target_kind_exit_bwzbbwta6r" FOREIGN KEY ("rule", "__tag_target_kind_exit_aicxomz3hh") REFERENCES "qti"."branch_rule" ("id", "target_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule_target" ADD CONSTRAINT "__branch_rule_target_fk_rule_tag_target_kind_ref_42wjbqiwbv" FOREIGN KEY ("rule", "__tag_target_kind_ref_seeentthk7") REFERENCES "qti"."branch_rule" ("id", "target_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule_target" ADD CONSTRAINT "__branch_rule_target_fk_rule_owner_kind_btvohroljt" FOREIGN KEY ("rule", "owner_kind") REFERENCES "qti"."branch_rule" ("id", "owner_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule_target" ADD CONSTRAINT "__branch_rule_target_fk_rule_scope_32r2xsdtsf" FOREIGN KEY ("rule", "scope") REFERENCES "qti"."branch_rule" ("id", "document") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."branch_rule_target" ADD CONSTRAINT "__branch_rule_target_fk_scope_identifier_holder_kind_q3isplk5rx" FOREIGN KEY ("scope", "identifier", "holder_kind") REFERENCES "qti"."test_identifier" ("scope", "identifier", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_allow_comment" ADD CONSTRAINT "__declared_allow_comment_fk_node_cbwqtxoecp" FOREIGN KEY ("node") REFERENCES "qti"."item_session_control" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_allow_late_submission" ADD CONSTRAINT "__declared_allow_late_submission_fk_node_hztpw6rg4p" FOREIGN KEY ("node") REFERENCES "qti"."time_limits" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_allow_review" ADD CONSTRAINT "__declared_allow_review_fk_node_cxkzsahn5n" FOREIGN KEY ("node") REFERENCES "qti"."item_session_control" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_allow_skipping" ADD CONSTRAINT "__declared_allow_skipping_fk_node_rscyfgfgvb" FOREIGN KEY ("node") REFERENCES "qti"."item_session_control" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_ordering_shuffle" ADD CONSTRAINT "__declared_ordering_shuffle_fk_node_5lby2wpyyk" FOREIGN KEY ("node") REFERENCES "qti"."ordering" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_show_feedback" ADD CONSTRAINT "__declared_show_feedback_fk_node_cmksuceqam" FOREIGN KEY ("node") REFERENCES "qti"."item_session_control" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_show_solution" ADD CONSTRAINT "__declared_show_solution_fk_node_4byy4o6ma5" FOREIGN KEY ("node") REFERENCES "qti"."item_session_control" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_validate_responses" ADD CONSTRAINT "__declared_validate_responses_fk_node_gou62skqks" FOREIGN KEY ("node") REFERENCES "qti"."item_session_control" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_with_replacement" ADD CONSTRAINT "__declared_with_replacement_fk_node_7l4dagvl63" FOREIGN KEY ("node") REFERENCES "qti"."selection" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_instance_spelling" ADD CONSTRAINT "__item_instance_spelling_fk_ref_cwg5en7npj" FOREIGN KEY ("ref") REFERENCES "qti"."item_instance_variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_instance_variable_ref" ADD CONSTRAINT "__item_instance_variable_ref_fk_document_root_ofvjezmesk" FOREIGN KEY ("document", "root") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_instance_variable_ref" ADD CONSTRAINT "__item_instance_variable_ref_fk_id_tag_kind_item_nujqm3tjbc" FOREIGN KEY ("id", "__tag_kind_item_instance_variable_qcrtkmyrc5") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref" ADD CONSTRAINT "__item_ref_fk_id_d7cytkspkn" FOREIGN KEY ("id") REFERENCES "qti"."item_ref_resolution" ("item_ref") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref" ADD CONSTRAINT "__item_ref_fk_id_tag_kind_qti_assessment_item_ref_dqx2o4etdf" FOREIGN KEY ("id", "__tag_kind_qti_assessment_item_ref_hps2s36don") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref" ADD CONSTRAINT "__item_ref_fk_id_document_6rdgeo5bbx" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref" ADD CONSTRAINT "__item_ref_fk_id_document_identifier_tag_holder_kind_vrjcbdmcoo" FOREIGN KEY ("id", "document", "identifier", "__tag_holder_kind_item_ref_kytin3i6mz") REFERENCES "qti"."test_identifier" ("holder", "scope", "identifier", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref_category" ADD CONSTRAINT "__item_ref_category_fk_node_arprgxmzyp" FOREIGN KEY ("node") REFERENCES "qti"."item_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref_document" ADD CONSTRAINT "__item_ref_document_fk_item_ref_tag_target_kind_item_r2rztuxeyy" FOREIGN KEY ("item_ref", "__tag_target_kind_item_fgwqiexuve") REFERENCES "qti"."item_ref_resolution" ("item_ref", "target_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref_lti" ADD CONSTRAINT "__item_ref_lti_fk_item_ref_tag_target_kind_lti_ahi_4_wsjdzoiany" FOREIGN KEY ("item_ref", "__tag_target_kind_lti_ahi4eitc7u") REFERENCES "qti"."item_ref_resolution" ("item_ref", "target_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref_lti" ADD CONSTRAINT "__item_ref_lti_fk_package_resource_type_i5xl5wl6m4" FOREIGN KEY ("package", "resource", "type") REFERENCES "qti"."resource" ("package", "identifier", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_session_control" ADD CONSTRAINT "__item_session_control_fk_id_tag_kind_qti_item_ocprl5zirn" FOREIGN KEY ("id", "__tag_kind_qti_item_session_control_ypl7kurks7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_session_max_attempts" ADD CONSTRAINT "__item_session_max_attempts_fk_node_fbrvpbaohd" FOREIGN KEY ("node") REFERENCES "qti"."item_session_control" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_stimulus_ref" ADD CONSTRAINT "__item_stimulus_ref_fk_id_7unmkj5azf" FOREIGN KEY ("id") REFERENCES "qti"."stimulus_ref_resolution" ("stimulus_ref") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_stimulus_ref" ADD CONSTRAINT "__item_stimulus_ref_fk_id_tag_kind_qti_assessment_3aoqf5icsk" FOREIGN KEY ("id", "__tag_kind_qti_assessment_stimulus_ref_jw5j27wnfb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_stimulus_ref" ADD CONSTRAINT "__item_stimulus_ref_fk_id_document_q5h5dslt5n" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_stimulus_ref_title" ADD CONSTRAINT "__item_stimulus_ref_title_fk_node_xdnfokhyi4" FOREIGN KEY ("node") REFERENCES "qti"."item_stimulus_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_variable_ref" ADD CONSTRAINT "__item_variable_ref_fk_document_root_mc5exrqoht" FOREIGN KEY ("document", "root") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_variable_ref" ADD CONSTRAINT "__item_variable_ref_fk_id_tag_kind_item_variable_5_65d3gig4kc" FOREIGN KEY ("id", "__tag_kind_item_variable_5wfcxwh5gq") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."metadata_ref" ADD CONSTRAINT "__metadata_ref_fk_id_tag_kind_qti_metadata_ref_2_v7dzo3iobx" FOREIGN KEY ("id", "__tag_kind_qti_metadata_ref_2foxgesdiw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordering" ADD CONSTRAINT "__ordering_fk_id_tag_kind_qti_ordering_ezmnthie_6_z_3nt4l6bph5" FOREIGN KEY ("id", "__tag_kind_qti_ordering_ezmnthie6z") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pre_condition" ADD CONSTRAINT "__pre_condition_fk_id_owt7wt3snh" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pre_condition" ADD CONSTRAINT "__pre_condition_fk_id_tag_kind_qti_pre_condition_zgpcmrgbyr" FOREIGN KEY ("id", "__tag_kind_qti_pre_condition_mirfvuo5br") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_built_in" ADD CONSTRAINT "__prefixed_built_in_fk_ref_test_5qr25gph2w" FOREIGN KEY ("ref", "test") REFERENCES "qti"."prefixed_variable_source" ("ref", "test") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_built_in" ADD CONSTRAINT "__prefixed_built_in_fk_ref_test_tag_source_built_in_qq66q4pxo2" FOREIGN KEY ("ref", "test", "__tag_source_built_in_win2m4ydys") REFERENCES "qti"."prefixed_variable_source" ("ref", "test", "source") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_declared" ADD CONSTRAINT "__prefixed_declared_fk_item_document_variable_inwyfa7obs" FOREIGN KEY ("item_document", "variable") REFERENCES "qti"."declaration" ("document", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_declared" ADD CONSTRAINT "__prefixed_declared_fk_ref_test_tag_source_declared_c4jbs5vof6" FOREIGN KEY ("ref", "test", "__tag_source_declared_sdgzhu26kd") REFERENCES "qti"."prefixed_variable_source" ("ref", "test", "source") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_declared" ADD CONSTRAINT "__prefixed_declared_fk_ref_test_item_document_xrdhmouvzq" FOREIGN KEY ("ref", "test", "item_document") REFERENCES "qti"."prefixed_variable_source" ("ref", "test", "item_document") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_mapped" ADD CONSTRAINT "__prefixed_mapped_fk_item_ref_variable_pgztzkshez" FOREIGN KEY ("item_ref", "variable") REFERENCES "qti"."variable_mapping" ("item_ref", "target") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_mapped" ADD CONSTRAINT "__prefixed_mapped_fk_ref_test_tag_source_mapped_p_7_ue3ctruhxf" FOREIGN KEY ("ref", "test", "__tag_source_mapped_p7vxvhg6f7") REFERENCES "qti"."prefixed_variable_source" ("ref", "test", "source") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_mapped" ADD CONSTRAINT "__prefixed_mapped_fk_ref_test_item_ref_nq7ufyzjbw" FOREIGN KEY ("ref", "test", "item_ref") REFERENCES "qti"."prefixed_variable_source" ("ref", "test", "item_ref") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_variable_source" ADD CONSTRAINT "__prefixed_variable_source_fk_item_ref_item_document_47qdqtw7xs" FOREIGN KEY ("item_ref", "item_document") REFERENCES "qti"."item_ref_document" ("item_ref", "document") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prefixed_variable_source" ADD CONSTRAINT "__prefixed_variable_source_fk_test_document_ii5ueod7q7" FOREIGN KEY ("test", "document") REFERENCES "qti"."test_document" ("test", "document");

ALTER TABLE "qti"."prefixed_variable_source" ADD CONSTRAINT "__prefixed_variable_source_fk_test_prefix_item_ref_uijmttt2yl" FOREIGN KEY ("test", "prefix", "item_ref", "__tag_holder_kind_item_ref_47sb5enwfv") REFERENCES "qti"."test_reach" ("test", "identifier", "holder", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."required_child" ADD CONSTRAINT "__required_child_fk_child_parent_alzlotpv3e" FOREIGN KEY ("child", "parent") REFERENCES "qti"."structure_child" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_duration_ref" ADD CONSTRAINT "__section_duration_ref_fk_document_root_ozx3nmy5tv" FOREIGN KEY ("document", "root") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_duration_ref" ADD CONSTRAINT "__section_duration_ref_fk_id_tag_kind_section_2vxs2i35tq" FOREIGN KEY ("id", "__tag_kind_section_duration_db6nf7nxso") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_duration_target" ADD CONSTRAINT "__section_duration_target_fk_test_document_fj2fdcto24" FOREIGN KEY ("test", "document") REFERENCES "qti"."test_document" ("test", "document");

ALTER TABLE "qti"."section_duration_target" ADD CONSTRAINT "__section_duration_target_fk_test_prefix_holder_c32getcrfh" FOREIGN KEY ("test", "prefix", "holder", "holder_kind") REFERENCES "qti"."test_reach" ("test", "identifier", "holder", "holder_kind");

ALTER TABLE "qti"."section_feedback_outcome_ref" ADD CONSTRAINT "__section_feedback_outcome_ref_fk_node_document_ylrb4cqrsu" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_feedback_outcome_ref" ADD CONSTRAINT "__section_feedback_outcome_ref_fk_test_document_xtcs3bivmt" FOREIGN KEY ("test", "document") REFERENCES "qti"."test_document" ("test", "document");

ALTER TABLE "qti"."section_feedback_outcome_ref" ADD CONSTRAINT "__section_feedback_outcome_ref_fk_test_identifier_xri4lfor3m" FOREIGN KEY ("test", "identifier", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_feedback_outcome_ref" ADD CONSTRAINT "__section_feedback_outcome_ref_fk_test_identifier_wfoetpeafk" FOREIGN KEY ("test", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_identifier_target" ADD CONSTRAINT "__section_identifier_target_fk_node_document_dugrmkicjj" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_identifier_target" ADD CONSTRAINT "__section_identifier_target_fk_test_document_bolwbicr3l" FOREIGN KEY ("test", "document") REFERENCES "qti"."test_document" ("test", "document");

ALTER TABLE "qti"."section_identifier_target" ADD CONSTRAINT "__section_identifier_target_fk_test_identifier_jrjh43vn62" FOREIGN KEY ("test", "identifier", "holder_kind") REFERENCES "qti"."test_reach" ("test", "identifier", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_printed_variable_ref" ADD CONSTRAINT "__section_printed_variable_ref_fk_node_ipcvguop2i" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_printed_variable_ref" ADD CONSTRAINT "__section_printed_variable_ref_fk_node_document_xhginqlb26" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_printed_variable_ref" ADD CONSTRAINT "__section_printed_variable_ref_fk_test_document_agvttrxzgm" FOREIGN KEY ("test", "document") REFERENCES "qti"."test_document" ("test", "document");

ALTER TABLE "qti"."section_printed_variable_ref" ADD CONSTRAINT "__section_printed_variable_ref_fk_test_identifier_owktrww3x7" FOREIGN KEY ("test", "identifier", "kind") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_printed_variable_var_ref" ADD CONSTRAINT "__section_printed_variable_var_ref_fk_node_fjcsnvi34g" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_printed_variable_var_ref" ADD CONSTRAINT "__section_printed_variable_var_ref_fk_node_document_7ickzlz2r7" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_printed_variable_var_ref" ADD CONSTRAINT "__section_printed_variable_var_ref_fk_test_document_mifjsz7qjp" FOREIGN KEY ("test", "document") REFERENCES "qti"."test_document" ("test", "document");

ALTER TABLE "qti"."section_printed_variable_var_ref" ADD CONSTRAINT "__section_printed_variable_var_ref_fk_test_tttvns47ev" FOREIGN KEY ("test", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_printed_variable_var_ref" ADD CONSTRAINT "__section_printed_variable_var_ref_fk_test_s7lbionwp2" FOREIGN KEY ("test", "identifier", "kind") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_ref" ADD CONSTRAINT "__section_ref_fk_id_wz4ambuxob" FOREIGN KEY ("id") REFERENCES "qti"."section_ref_resolution" ("section_ref") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_ref" ADD CONSTRAINT "__section_ref_fk_id_tag_kind_qti_assessment_section_zgxbrsf7nw" FOREIGN KEY ("id", "__tag_kind_qti_assessment_section_ref_uewqzx3v4v") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_ref" ADD CONSTRAINT "__section_ref_fk_id_document_lmg7xvoguq" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_ref" ADD CONSTRAINT "__section_ref_fk_id_document_identifier_tag_holder_kkyzqvky7c" FOREIGN KEY ("id", "document", "identifier", "__tag_holder_kind_section_ref_fcqoid3ohb") REFERENCES "qti"."test_identifier" ("holder", "scope", "identifier", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_declared" ADD CONSTRAINT "__section_variable_declared_fk_ref_identifier_lamzsq7muy" FOREIGN KEY ("ref", "identifier", "referrer_kind") REFERENCES "qti"."section_variable_ref" ("id", "identifier", "referrer_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_declared" ADD CONSTRAINT "__section_variable_declared_fk_ref_test_tag_target_3k4i5t4xob" FOREIGN KEY ("ref", "test", "__tag_target_declared_ilhuctesh5") REFERENCES "qti"."section_variable_resolution" ("ref", "test", "target") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_declared" ADD CONSTRAINT "__section_variable_declared_fk_test_identifier_vcwswlwcpv" FOREIGN KEY ("test", "identifier", "declaration_kind") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_duration" ADD CONSTRAINT "__section_variable_duration_fk_ref_test_tag_ref_kind_b4gpjjltdu" FOREIGN KEY ("ref", "test", "__tag_ref_kind_section_variable_jo65257ny5") REFERENCES "qti"."section_duration_target" ("ref", "test", "ref_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_duration" ADD CONSTRAINT "__section_variable_duration_fk_ref_test_tag_target_jbcviedghu" FOREIGN KEY ("ref", "test", "__tag_target_duration_l44yrac3hq") REFERENCES "qti"."section_variable_resolution" ("ref", "test", "target") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_prefixed" ADD CONSTRAINT "__section_variable_prefixed_fk_ref_test_tag_ref_kind_exbsmf64i6" FOREIGN KEY ("ref", "test", "__tag_ref_kind_section_variable_lyjzdtqixu") REFERENCES "qti"."prefixed_variable_source" ("ref", "test", "ref_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_prefixed" ADD CONSTRAINT "__section_variable_prefixed_fk_ref_test_tag_target_ap7loacchy" FOREIGN KEY ("ref", "test", "__tag_target_prefixed_gqdv7vjzm6") REFERENCES "qti"."section_variable_resolution" ("ref", "test", "target") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_ref" ADD CONSTRAINT "__section_variable_ref_fk_document_root_asneowfexm" FOREIGN KEY ("document", "root") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_ref" ADD CONSTRAINT "__section_variable_ref_fk_id_tag_kind_section_a7yksf5q6v" FOREIGN KEY ("id", "__tag_kind_section_variable_xx6oynyexh") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_ref" ADD CONSTRAINT "__section_variable_ref_fk_id_referrer_kind_yiq5q7mez5" FOREIGN KEY ("id", "referrer_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_resolution" ADD CONSTRAINT "__section_variable_resolution_fk_ref_document_2umbbm7wrj" FOREIGN KEY ("ref", "document") REFERENCES "qti"."section_variable_ref" ("id", "document") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section_variable_resolution" ADD CONSTRAINT "__section_variable_resolution_fk_test_document_5pp6l25ag4" FOREIGN KEY ("test", "document") REFERENCES "qti"."test_document" ("test", "document");

ALTER TABLE "qti"."selection" ADD CONSTRAINT "__selection_fk_id_tag_kind_qti_selection_lyq_6_lq_42_jjiiax7hc5" FOREIGN KEY ("id", "__tag_kind_qti_selection_lyq6lq42ud") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."selection" ADD CONSTRAINT "__selection_fk_id_section_pz3na2tp7y" FOREIGN KEY ("id", "section") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."selection" ADD CONSTRAINT "__selection_fk_section_u4rh3bzq6c" FOREIGN KEY ("section") REFERENCES "qti"."assessment_section" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."selection_bounded" ADD CONSTRAINT "__selection_bounded_fk_section_select_with_hnuiz5gkum" FOREIGN KEY ("section", "select", "with_replacement") REFERENCES "qti"."selection" ("section", "select", "with_replacement") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stimulus_body" ADD CONSTRAINT "__stimulus_body_fk_id_tag_kind_qti_stimulus_body_lhe_gm4xfjlslf" FOREIGN KEY ("id", "__tag_kind_qti_stimulus_body_lhe3p2vmfc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stimulus_body" ADD CONSTRAINT "__stimulus_body_fk_id_version_ylbpeoq5n5" FOREIGN KEY ("id", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."structure_child" ADD CONSTRAINT "__structure_child_fk_child_parent_cvhb6trpmu" FOREIGN KEY ("child", "parent") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_default" ADD CONSTRAINT "__template_default_fk_id_t7ffdpkm46" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_default" ADD CONSTRAINT "__template_default_fk_id_tag_kind_qti_template_t2svvto6z2" FOREIGN KEY ("id", "__tag_kind_qti_template_default_h5uiey2hdf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_default" ADD CONSTRAINT "__template_default_fk_id_item_ref_ijysjrlgao" FOREIGN KEY ("id", "item_ref") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_default" ADD CONSTRAINT "__template_default_fk_item_document_template_egkt75syoy" FOREIGN KEY ("item_document", "template_identifier", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_default" ADD CONSTRAINT "__template_default_fk_item_ref_item_document_5co3ssudik" FOREIGN KEY ("item_ref", "item_document") REFERENCES "qti"."item_ref_document" ("item_ref", "document") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_document" ADD CONSTRAINT "__test_document_fk_document_5gtbrbaa5d" FOREIGN KEY ("document") REFERENCES "qti"."document" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_document" ADD CONSTRAINT "__test_document_fk_test_tag_root_test_sfpw_7_z_7_lis_yexgdj4pib" FOREIGN KEY ("test", "__tag_root_test_sfpw7z7lis") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_feedback" ADD CONSTRAINT "__test_feedback_fk_id_tag_kind_qti_test_feedback_hrn5bkzlzb" FOREIGN KEY ("id", "__tag_kind_qti_test_feedback_oicqmodm6p") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_feedback_content_body" ADD CONSTRAINT "__test_feedback_content_body_fk_id_tag_kind_qti_uz4ffaszwu" FOREIGN KEY ("id", "__tag_kind_qti_content_body_test_feedback_62lcd5o5q3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_feedback_title" ADD CONSTRAINT "__test_feedback_title_fk_node_cj4xxgqkn4" FOREIGN KEY ("node") REFERENCES "qti"."test_feedback" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_part" ADD CONSTRAINT "__test_part_fk_id_tag_kind_qti_test_part_ewahlzefvg_kbu5u3bo55" FOREIGN KEY ("id", "__tag_kind_qti_test_part_ewahlzefvg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_part" ADD CONSTRAINT "__test_part_fk_id_document_n3waf5laig" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_part" ADD CONSTRAINT "__test_part_fk_id_document_identifier_tag_holder_oome6y2g52" FOREIGN KEY ("id", "document", "identifier", "__tag_holder_kind_part_e5bqbqbrvc") REFERENCES "qti"."test_identifier" ("holder", "scope", "identifier", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_part_title" ADD CONSTRAINT "__test_part_title_fk_node_olhvteatof" FOREIGN KEY ("node") REFERENCES "qti"."test_part" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_reach" ADD CONSTRAINT "__test_reach_fk_holder_identifier_holder_kind_tv3jcjxydp" FOREIGN KEY ("holder", "identifier", "holder_kind") REFERENCES "qti"."test_identifier" ("holder", "identifier", "holder_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_rubric_block" ADD CONSTRAINT "__test_rubric_block_fk_id_tag_kind_qti_rubric_block_vjcs4juji4" FOREIGN KEY ("id", "__tag_kind_qti_rubric_block_test_qk6ijn65fj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_rubric_block_use" ADD CONSTRAINT "__test_rubric_block_use_fk_node_q3vbz7g4am" FOREIGN KEY ("node") REFERENCES "qti"."test_rubric_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_rubric_content_body" ADD CONSTRAINT "__test_rubric_content_body_fk_id_tag_kind_qti_ko637gmlcz" FOREIGN KEY ("id", "__tag_kind_qti_content_body_test_rubric_jaxkcc3se5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."time_limit_max" ADD CONSTRAINT "__time_limit_max_fk_node_sgmt3cdkee" FOREIGN KEY ("node") REFERENCES "qti"."time_limits" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."time_limit_min" ADD CONSTRAINT "__time_limit_min_fk_node_bcc3u7h7nk" FOREIGN KEY ("node") REFERENCES "qti"."time_limits" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."time_limits" ADD CONSTRAINT "__time_limits_fk_id_tag_kind_qti_time_limits_343_i2hwirr264" FOREIGN KEY ("id", "__tag_kind_qti_time_limits_343jhkovjf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data_ref" ADD CONSTRAINT "__usage_data_ref_fk_id_tag_kind_qti_usagedata_ref_75_rntj2zbghz" FOREIGN KEY ("id", "__tag_kind_qti_usagedata_ref_75tpeijppj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_mapping" ADD CONSTRAINT "__variable_mapping_fk_id_tag_kind_qti_variable_mydywv4uw5" FOREIGN KEY ("id", "__tag_kind_qti_variable_mapping_scg2kyf6y2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_mapping" ADD CONSTRAINT "__variable_mapping_fk_id_item_ref_o2cql24jmm" FOREIGN KEY ("id", "item_ref") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_mapping" ADD CONSTRAINT "__variable_mapping_fk_item_document_source_tag_kind_n2qdj5qwnp" FOREIGN KEY ("item_document", "source", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_mapping" ADD CONSTRAINT "__variable_mapping_fk_item_ref_item_document_bngrwytn7a" FOREIGN KEY ("item_ref", "item_document") REFERENCES "qti"."item_ref_document" ("item_ref", "document") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."weight" ADD CONSTRAINT "__weight_fk_id_tag_kind_qti_weight_ecqobu_7_wca_23ddr7l3si" FOREIGN KEY ("id", "__tag_kind_qti_weight_ecqobu7wca") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."weight" ADD CONSTRAINT "__weight_fk_id_item_ref_bkjvnjywlp" FOREIGN KEY ("id", "item_ref") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."adaptive_engine_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."adaptive_selection"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."adaptive_settings_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."assessment_section"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."assessment_stimulus"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."assessment_test"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_file_reference"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."branch_rule"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."branch_rule_exit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."branch_rule_target"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_allow_comment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_allow_late_submission"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_allow_review"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_allow_skipping"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_item_ref_fixed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_item_ref_required"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_ordering_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_section_fixed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_section_keep_together"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_section_required"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_show_feedback"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_show_solution"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_validate_responses"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_with_replacement"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_instance_spelling"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_instance_variable_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_ref_category"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_ref_document"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_ref_lti"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_ref_resolution"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_session_control"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_session_max_attempts"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_stimulus_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_stimulus_ref_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_variable_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."metadata_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ordering"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."pre_condition"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."prefixed_built_in"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."prefixed_declared"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."prefixed_mapped"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."prefixed_variable_source"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."required_child"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_duration_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_duration_target"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_feedback_outcome_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_identifier_target"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_printed_variable_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_printed_variable_var_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_ref_resolution"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_variable_declared"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_variable_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_variable_prefixed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_variable_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section_variable_resolution"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."selection"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."selection_bounded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."stimulus_body"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."stimulus_ref_resolution"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."structure_child"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_default"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_document"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_feedback"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_feedback_content_body"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_feedback_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_part"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_part_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_reach"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_rubric_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_rubric_block_use"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_rubric_content_body"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tests_hold"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."time_limit_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."time_limit_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."time_limits"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_data_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variable_mapping"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."weight"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."adaptive_engine_ref" ("href", "id", "identifier") AS
SELECT "r1"."href", "r1"."id", "r1"."identifier"
FROM "qti"."adaptive_engine_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."adaptive_engine_ref" TO "qti__author";

CREATE VIEW "qti__author"."adaptive_selection" ("id") AS
SELECT "r1"."id"
FROM "qti"."adaptive_selection" AS "r1";

GRANT SELECT ON TABLE "qti__author"."adaptive_selection" TO "qti__author";

CREATE VIEW "qti__author"."adaptive_settings_ref" ("href", "id", "identifier") AS
SELECT "r1"."href", "r1"."id", "r1"."identifier"
FROM "qti"."adaptive_settings_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."adaptive_settings_ref" TO "qti__author";

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

CREATE VIEW "qti__author"."assessment_item" ("adaptive", "id", "time_dependent", "tree") AS
SELECT "r1"."adaptive", "r1"."id", "r1"."time_dependent", "r1"."tree"
FROM "qti"."assessment_item" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item" TO "qti__author";

CREATE VIEW "qti__author"."assessment_item_label" ("node", "root", "tree", "value", "version") AS
SELECT "r1"."node", "r1"."root", "r1"."tree", "r1"."value", "r1"."version"
FROM "qti"."assessment_item_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item_label" TO "qti__author";

CREATE VIEW "qti__author"."assessment_section" ("document", "fixed", "id", "identifier", "keep_together", "required", "title", "visible") AS
SELECT "r1"."document", "r1"."fixed", "r1"."id", "r1"."identifier", "r1"."keep_together", "r1"."required", "r1"."title", "r1"."visible"
FROM "qti"."assessment_section" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_section" TO "qti__author";

CREATE VIEW "qti__author"."assessment_stimulus" ("id") AS
SELECT "r1"."id"
FROM "qti"."assessment_stimulus" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_stimulus" TO "qti__author";

CREATE VIEW "qti__author"."assessment_test" ("id") AS
SELECT "r1"."id"
FROM "qti"."assessment_test" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_test" TO "qti__author";

CREATE VIEW "qti__author"."associable_hotspot" ("id", "identifier", "interaction", "match_max_n", "match_min_n", "parent_kind", "shape", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape", "r1"."show_hide"
FROM "qti"."associable_hotspot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot" TO "qti__author";

CREATE VIEW "qti__author"."attribute_admission" ("attribute", "kind") AS
SELECT "r1"."attribute", "r1"."kind"
FROM "qti"."attribute_admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_admission" TO "qti__author";

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

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."branch_rule" ("document", "id", "owner", "owner_kind", "target_kind") AS
SELECT "r1"."document", "r1"."id", "r1"."owner", "r1"."owner_kind", "r1"."target_kind"
FROM "qti"."branch_rule" AS "r1";

GRANT SELECT ON TABLE "qti__author"."branch_rule" TO "qti__author";

CREATE VIEW "qti__author"."branch_rule_exit" ("exit", "rule") AS
SELECT "r1"."exit", "r1"."rule"
FROM "qti"."branch_rule_exit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."branch_rule_exit" TO "qti__author";

CREATE VIEW "qti__author"."branch_rule_target" ("holder_kind", "identifier", "owner_kind", "rule", "scope") AS
SELECT "r1"."holder_kind", "r1"."identifier", "r1"."owner_kind", "r1"."rule", "r1"."scope"
FROM "qti"."branch_rule_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."branch_rule_target" TO "qti__author";

CREATE VIEW "qti__author"."built_in_ref" ("id", "name", "referrer_kind") AS
SELECT "r1"."id", "r1"."name", "r1"."referrer_kind"
FROM "qti"."built_in_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."built_in_ref" TO "qti__author";

CREATE VIEW "qti__author"."coords" ("node", "owner_kind", "shape", "value") AS
SELECT "r1"."node", "r1"."owner_kind", "r1"."shape", "r1"."value"
FROM "qti"."coords" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords" TO "qti__author";

CREATE VIEW "qti__author"."declaration" ("document", "id", "identifier", "kind", "shape") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape"
FROM "qti"."declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration" TO "qti__author";

CREATE VIEW "qti__author"."declared_allow_comment" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_allow_comment" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_allow_comment" TO "qti__author";

CREATE VIEW "qti__author"."declared_allow_late_submission" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_allow_late_submission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_allow_late_submission" TO "qti__author";

CREATE VIEW "qti__author"."declared_allow_review" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_allow_review" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_allow_review" TO "qti__author";

CREATE VIEW "qti__author"."declared_allow_skipping" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_allow_skipping" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_allow_skipping" TO "qti__author";

CREATE VIEW "qti__author"."declared_item_ref_fixed" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_item_ref_fixed" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_item_ref_fixed" TO "qti__author";

CREATE VIEW "qti__author"."declared_item_ref_required" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_item_ref_required" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_item_ref_required" TO "qti__author";

CREATE VIEW "qti__author"."declared_ordering_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_ordering_shuffle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_ordering_shuffle" TO "qti__author";

CREATE VIEW "qti__author"."declared_ref" ("declaration_kind", "document", "id", "identifier", "referrer_kind") AS
SELECT "r1"."declaration_kind", "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind"
FROM "qti"."declared_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_ref" TO "qti__author";

CREATE VIEW "qti__author"."declared_section_fixed" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_section_fixed" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_section_fixed" TO "qti__author";

CREATE VIEW "qti__author"."declared_section_keep_together" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_section_keep_together" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_section_keep_together" TO "qti__author";

CREATE VIEW "qti__author"."declared_section_required" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_section_required" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_section_required" TO "qti__author";

CREATE VIEW "qti__author"."declared_show_feedback" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_show_feedback" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_show_feedback" TO "qti__author";

CREATE VIEW "qti__author"."declared_show_solution" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_show_solution" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_show_solution" TO "qti__author";

CREATE VIEW "qti__author"."declared_validate_responses" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_validate_responses" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_validate_responses" TO "qti__author";

CREATE VIEW "qti__author"."declared_with_replacement" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_with_replacement" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_with_replacement" TO "qti__author";

CREATE VIEW "qti__author"."document" ("id", "package", "path", "resource", "resource_type", "root", "version") AS
SELECT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version"
FROM "qti"."document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document" TO "qti__author";

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

CREATE VIEW "qti__author"."html_id" ("attribute", "document", "id", "kind", "node") AS
SELECT "r1"."attribute", "r1"."document", "r1"."id", "r1"."kind", "r1"."node"
FROM "qti"."html_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."html_id" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("adaptive", "ancestry", "document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."adaptive", "r1"."ancestry", "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."item_instance_spelling" ("ref", "value") AS
SELECT "r1"."ref", "r1"."value"
FROM "qti"."item_instance_spelling" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_instance_spelling" TO "qti__author";

CREATE VIEW "qti__author"."item_instance_variable_ref" ("document", "id", "instance", "prefix", "root", "variable") AS
SELECT "r1"."document", "r1"."id", "r1"."instance", "r1"."prefix", "r1"."root", "r1"."variable"
FROM "qti"."item_instance_variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_instance_variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."item_ref" ("document", "fixed", "href", "id", "identifier", "required") AS
SELECT "r1"."document", "r1"."fixed", "r1"."href", "r1"."id", "r1"."identifier", "r1"."required"
FROM "qti"."item_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_ref" TO "qti__author";

CREATE VIEW "qti__author"."item_ref_category" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."item_ref_category" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_ref_category" TO "qti__author";

CREATE VIEW "qti__author"."item_ref_document" ("document", "item_ref", "package", "path") AS
SELECT "r1"."document", "r1"."item_ref", "r1"."package", "r1"."path"
FROM "qti"."item_ref_document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_ref_document" TO "qti__author";

CREATE VIEW "qti__author"."item_ref_lti" ("item_ref", "package", "resource", "type") AS
SELECT "r1"."item_ref", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."item_ref_lti" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_ref_lti" TO "qti__author";

CREATE VIEW "qti__author"."item_ref_resolution" ("item_ref", "package", "path", "target_kind") AS
SELECT "r1"."item_ref", "r1"."package", "r1"."path", "r1"."target_kind"
FROM "qti"."item_ref_resolution" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_ref_resolution" TO "qti__author";

CREATE VIEW "qti__author"."item_session_control" ("allow_comment", "allow_review", "allow_skipping", "id", "show_feedback", "show_solution", "validate_responses") AS
SELECT "r1"."allow_comment", "r1"."allow_review", "r1"."allow_skipping", "r1"."id", "r1"."show_feedback", "r1"."show_solution", "r1"."validate_responses"
FROM "qti"."item_session_control" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_session_control" TO "qti__author";

CREATE VIEW "qti__author"."item_session_max_attempts" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."item_session_max_attempts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_session_max_attempts" TO "qti__author";

CREATE VIEW "qti__author"."item_stimulus_ref" ("document", "href", "id", "identifier") AS
SELECT "r1"."document", "r1"."href", "r1"."id", "r1"."identifier"
FROM "qti"."item_stimulus_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_stimulus_ref" TO "qti__author";

CREATE VIEW "qti__author"."item_stimulus_ref_title" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."item_stimulus_ref_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_stimulus_ref_title" TO "qti__author";

CREATE VIEW "qti__author"."item_tool" ("root", "shape", "tree") AS
SELECT "r1"."root", "r1"."shape", "r1"."tree"
FROM "qti"."item_tool" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool" TO "qti__author";

CREATE VIEW "qti__author"."item_variable_ref" ("document", "id", "prefix", "root", "variable") AS
SELECT "r1"."document", "r1"."id", "r1"."prefix", "r1"."root", "r1"."variable"
FROM "qti"."item_variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."lom_language" ("id", "lom", "owner", "parent_kind", "position", "value") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent_kind", "r1"."position", "r1"."value"
FROM "qti"."lom_language" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_language" TO "qti__author";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

CREATE VIEW "qti__author"."metadata_ref" ("href", "id", "identifier") AS
SELECT "r1"."href", "r1"."id", "r1"."identifier"
FROM "qti"."metadata_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."metadata_ref" TO "qti__author";

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

CREATE VIEW "qti__author"."ordering" ("id", "shuffle") AS
SELECT "r1"."id", "r1"."shuffle"
FROM "qti"."ordering" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ordering" TO "qti__author";

CREATE VIEW "qti__author"."outcome_min_max" ("id", "kind", "outcome_identifier") AS
SELECT "r1"."id", "r1"."kind", "r1"."outcome_identifier"
FROM "qti"."outcome_min_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_min_max" TO "qti__author";

CREATE VIEW "qti__author"."package_entry" ("kind", "package", "path") AS
SELECT "r1"."kind", "r1"."package", "r1"."path"
FROM "qti"."package_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."package_entry" TO "qti__author";

CREATE VIEW "qti__author"."pre_condition" ("id") AS
SELECT "r1"."id"
FROM "qti"."pre_condition" AS "r1";

GRANT SELECT ON TABLE "qti__author"."pre_condition" TO "qti__author";

CREATE VIEW "qti__author"."prefixed_built_in" ("built_in", "ref", "test") AS
SELECT "r1"."built_in", "r1"."ref", "r1"."test"
FROM "qti"."prefixed_built_in" AS "r1";

GRANT SELECT ON TABLE "qti__author"."prefixed_built_in" TO "qti__author";

CREATE VIEW "qti__author"."prefixed_declared" ("item_document", "ref", "test", "variable") AS
SELECT "r1"."item_document", "r1"."ref", "r1"."test", "r1"."variable"
FROM "qti"."prefixed_declared" AS "r1";

GRANT SELECT ON TABLE "qti__author"."prefixed_declared" TO "qti__author";

CREATE VIEW "qti__author"."prefixed_mapped" ("item_ref", "ref", "test", "variable") AS
SELECT "r1"."item_ref", "r1"."ref", "r1"."test", "r1"."variable"
FROM "qti"."prefixed_mapped" AS "r1";

GRANT SELECT ON TABLE "qti__author"."prefixed_mapped" TO "qti__author";

CREATE VIEW "qti__author"."prefixed_variable_source" ("document", "item_document", "item_ref", "prefix", "ref", "ref_kind", "source", "test") AS
SELECT "r1"."document", "r1"."item_document", "r1"."item_ref", "r1"."prefix", "r1"."ref", "r1"."ref_kind", "r1"."source", "r1"."test"
FROM "qti"."prefixed_variable_source" AS "r1";

GRANT SELECT ON TABLE "qti__author"."prefixed_variable_source" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable" ("base", "delimiter", "id", "identifier", "mapping_indicator", "power_form") AS
SELECT "r1"."base", "r1"."delimiter", "r1"."id", "r1"."identifier", "r1"."mapping_indicator", "r1"."power_form"
FROM "qti"."printed_variable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."record_binding_fit" ("interaction_kind") AS
SELECT "r1"."interaction_kind"
FROM "qti"."record_binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."required_child" ("child", "parent", "required") AS
SELECT "r1"."child", "r1"."parent", "r1"."required"
FROM "qti"."required_child" AS "r1";

GRANT SELECT ON TABLE "qti__author"."required_child" TO "qti__author";

CREATE VIEW "qti__author"."resource" ("id", "identifier", "package", "type", "version") AS
SELECT "r1"."id", "r1"."identifier", "r1"."package", "r1"."type", "r1"."version"
FROM "qti"."resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource" TO "qti__author";

CREATE VIEW "qti__author"."rule_operand" ("child", "position", "rule", "rule_kind") AS
SELECT "r1"."child", "r1"."position", "r1"."rule", "r1"."rule_kind"
FROM "qti"."rule_operand" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rule_operand" TO "qti__author";

CREATE VIEW "qti__author"."section_duration_ref" ("document", "id", "prefix", "root") AS
SELECT "r1"."document", "r1"."id", "r1"."prefix", "r1"."root"
FROM "qti"."section_duration_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_duration_ref" TO "qti__author";

CREATE VIEW "qti__author"."section_duration_target" ("document", "holder", "holder_kind", "prefix", "ref", "ref_kind", "test") AS
SELECT "r1"."document", "r1"."holder", "r1"."holder_kind", "r1"."prefix", "r1"."ref", "r1"."ref_kind", "r1"."test"
FROM "qti"."section_duration_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_duration_target" TO "qti__author";

CREATE VIEW "qti__author"."section_feedback_outcome_ref" ("base_type", "cardinality", "document", "identifier", "node", "test") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."identifier", "r1"."node", "r1"."test"
FROM "qti"."section_feedback_outcome_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_feedback_outcome_ref" TO "qti__author";

CREATE VIEW "qti__author"."section_identifier_target" ("document", "holder_kind", "identifier", "node", "test") AS
SELECT "r1"."document", "r1"."holder_kind", "r1"."identifier", "r1"."node", "r1"."test"
FROM "qti"."section_identifier_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_identifier_target" TO "qti__author";

CREATE VIEW "qti__author"."section_printed_variable_ref" ("document", "identifier", "kind", "node", "test") AS
SELECT "r1"."document", "r1"."identifier", "r1"."kind", "r1"."node", "r1"."test"
FROM "qti"."section_printed_variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_printed_variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."section_printed_variable_var_ref" ("attribute", "base_type", "cardinality", "document", "identifier", "kind", "node", "test") AS
SELECT "r1"."attribute", "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."identifier", "r1"."kind", "r1"."node", "r1"."test"
FROM "qti"."section_printed_variable_var_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_printed_variable_var_ref" TO "qti__author";

CREATE VIEW "qti__author"."section_ref" ("document", "href", "id", "identifier") AS
SELECT "r1"."document", "r1"."href", "r1"."id", "r1"."identifier"
FROM "qti"."section_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_ref" TO "qti__author";

CREATE VIEW "qti__author"."section_ref_resolution" ("document", "package", "path", "section_ref") AS
SELECT "r1"."document", "r1"."package", "r1"."path", "r1"."section_ref"
FROM "qti"."section_ref_resolution" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_ref_resolution" TO "qti__author";

CREATE VIEW "qti__author"."section_variable_declared" ("declaration_kind", "identifier", "ref", "referrer_kind", "test") AS
SELECT "r1"."declaration_kind", "r1"."identifier", "r1"."ref", "r1"."referrer_kind", "r1"."test"
FROM "qti"."section_variable_declared" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_variable_declared" TO "qti__author";

CREATE VIEW "qti__author"."section_variable_duration" ("ref", "test") AS
SELECT "r1"."ref", "r1"."test"
FROM "qti"."section_variable_duration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_variable_duration" TO "qti__author";

CREATE VIEW "qti__author"."section_variable_prefixed" ("ref", "test") AS
SELECT "r1"."ref", "r1"."test"
FROM "qti"."section_variable_prefixed" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_variable_prefixed" TO "qti__author";

CREATE VIEW "qti__author"."section_variable_ref" ("document", "id", "identifier", "referrer_kind", "root") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind", "r1"."root"
FROM "qti"."section_variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."section_variable_resolution" ("document", "ref", "target", "test") AS
SELECT "r1"."document", "r1"."ref", "r1"."target", "r1"."test"
FROM "qti"."section_variable_resolution" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_variable_resolution" TO "qti__author";

CREATE VIEW "qti__author"."selection" ("id", "section", "select", "with_replacement") AS
SELECT "r1"."id", "r1"."section", "r1"."select", "r1"."with_replacement"
FROM "qti"."selection" AS "r1";

GRANT SELECT ON TABLE "qti__author"."selection" TO "qti__author";

CREATE VIEW "qti__author"."selection_bounded" ("section", "select", "with_replacement") AS
SELECT "r1"."section", "r1"."select", "r1"."with_replacement"
FROM "qti"."selection_bounded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."selection_bounded" TO "qti__author";

CREATE VIEW "qti__author"."slider_interaction" ("id", "lower_bound", "response_identifier", "root_kind", "step_label", "upper_bound") AS
SELECT "r1"."id", "r1"."lower_bound", "r1"."response_identifier", "r1"."root_kind", "r1"."step_label", "r1"."upper_bound"
FROM "qti"."slider_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."slider_interaction" TO "qti__author";

CREATE VIEW "qti__author"."source" ("id", "parent_kind", "src") AS
SELECT "r1"."id", "r1"."parent_kind", "r1"."src"
FROM "qti"."source" AS "r1";

GRANT SELECT ON TABLE "qti__author"."source" TO "qti__author";

CREATE VIEW "qti__author"."stimulus_body" ("id", "version") AS
SELECT "r1"."id", "r1"."version"
FROM "qti"."stimulus_body" AS "r1";

GRANT SELECT ON TABLE "qti__author"."stimulus_body" TO "qti__author";

CREATE VIEW "qti__author"."stimulus_ref_resolution" ("document", "package", "path", "stimulus_ref") AS
SELECT "r1"."document", "r1"."package", "r1"."path", "r1"."stimulus_ref"
FROM "qti"."stimulus_ref_resolution" AS "r1";

GRANT SELECT ON TABLE "qti__author"."stimulus_ref_resolution" TO "qti__author";

CREATE VIEW "qti__author"."structure_child" ("child", "child_kind", "parent") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent"
FROM "qti"."structure_child" AS "r1";

GRANT SELECT ON TABLE "qti__author"."structure_child" TO "qti__author";

CREATE VIEW "qti__author"."template_default" ("id", "item_document", "item_ref", "template_identifier") AS
SELECT "r1"."id", "r1"."item_document", "r1"."item_ref", "r1"."template_identifier"
FROM "qti"."template_default" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_default" TO "qti__author";

CREATE VIEW "qti__author"."template_parameter_ref" ("document", "id", "identifier", "referrer_kind", "root_kind") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind", "r1"."root_kind"
FROM "qti"."template_parameter_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_parameter_ref" TO "qti__author";

CREATE VIEW "qti__author"."test_document" ("document", "test") AS
SELECT "r1"."document", "r1"."test"
FROM "qti"."test_document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_document" TO "qti__author";

CREATE VIEW "qti__author"."test_feedback" ("access", "id", "identifier", "outcome_identifier", "show_hide") AS
SELECT "r1"."access", "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide"
FROM "qti"."test_feedback" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_feedback" TO "qti__author";

CREATE VIEW "qti__author"."test_feedback_content_body" ("id") AS
SELECT "r1"."id"
FROM "qti"."test_feedback_content_body" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_feedback_content_body" TO "qti__author";

CREATE VIEW "qti__author"."test_feedback_title" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."test_feedback_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_feedback_title" TO "qti__author";

CREATE VIEW "qti__author"."test_identifier" ("holder", "holder_kind", "identifier", "scope") AS
SELECT "r1"."holder", "r1"."holder_kind", "r1"."identifier", "r1"."scope"
FROM "qti"."test_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_identifier" TO "qti__author";

CREATE VIEW "qti__author"."test_part" ("document", "id", "identifier", "navigation_mode", "submission_mode") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."navigation_mode", "r1"."submission_mode"
FROM "qti"."test_part" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_part" TO "qti__author";

CREATE VIEW "qti__author"."test_part_title" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."test_part_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_part_title" TO "qti__author";

CREATE VIEW "qti__author"."test_reach" ("holder", "holder_kind", "identifier", "test") AS
SELECT "r1"."holder", "r1"."holder_kind", "r1"."identifier", "r1"."test"
FROM "qti"."test_reach" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_reach" TO "qti__author";

CREATE VIEW "qti__author"."test_rubric_block" ("id", "view") AS
SELECT "r1"."id", "r1"."view"
FROM "qti"."test_rubric_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_rubric_block" TO "qti__author";

CREATE VIEW "qti__author"."test_rubric_block_use" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."test_rubric_block_use" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_rubric_block_use" TO "qti__author";

CREATE VIEW "qti__author"."test_rubric_content_body" ("id") AS
SELECT "r1"."id"
FROM "qti"."test_rubric_content_body" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_rubric_content_body" TO "qti__author";

CREATE VIEW "qti__author"."tests_hold" ("bound", "id") AS
SELECT "r1"."bound", "r1"."id"
FROM "qti"."tests_hold" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tests_hold" TO "qti__author";

CREATE VIEW "qti__author"."time_limit_max" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."time_limit_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."time_limit_max" TO "qti__author";

CREATE VIEW "qti__author"."time_limit_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."time_limit_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."time_limit_min" TO "qti__author";

CREATE VIEW "qti__author"."time_limits" ("allow_late_submission", "id") AS
SELECT "r1"."allow_late_submission", "r1"."id"
FROM "qti"."time_limits" AS "r1";

GRANT SELECT ON TABLE "qti__author"."time_limits" TO "qti__author";

CREATE VIEW "qti__author"."tree" ("charset", "id", "kind", "root", "version") AS
SELECT "r1"."charset", "r1"."id", "r1"."kind", "r1"."root", "r1"."version"
FROM "qti"."tree" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tree" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE VIEW "qti__author"."typed_declaration" ("base_type", "cardinality", "document", "id", "identifier", "kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind"
FROM "qti"."typed_declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_declaration" TO "qti__author";

CREATE VIEW "qti__author"."usage_data_ref" ("href", "id", "identifier") AS
SELECT "r1"."href", "r1"."id", "r1"."identifier"
FROM "qti"."usage_data_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."usage_data_ref" TO "qti__author";

CREATE VIEW "qti__author"."variable_mapping" ("id", "item_document", "item_ref", "source", "target") AS
SELECT "r1"."id", "r1"."item_document", "r1"."item_ref", "r1"."source", "r1"."target"
FROM "qti"."variable_mapping" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variable_mapping" TO "qti__author";

CREATE VIEW "qti__author"."variable_ref" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."weight" ("id", "identifier", "item_ref", "value") AS
SELECT "r1"."id", "r1"."identifier", "r1"."item_ref", "r1"."value"
FROM "qti"."weight" AS "r1";

GRANT SELECT ON TABLE "qti__author"."weight" TO "qti__author";

CREATE VIEW "qti__author"."x_include_parse" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."x_include_parse" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include_parse" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."adaptive_engine_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."adaptive_selection" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."adaptive_settings_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_item" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_item_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_section" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_stimulus" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_test" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."attribute_file_reference" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."branch_rule" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."branch_rule_exit" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."branch_rule_target" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_allow_comment" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_allow_late_submission" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_allow_review" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_allow_skipping" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_item_ref_fixed" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_item_ref_required" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_ordering_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_section_fixed" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_section_keep_together" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_section_required" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_show_feedback" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_show_solution" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_validate_responses" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_with_replacement" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interaction_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_instance_spelling" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_instance_variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_ref_category" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_ref_document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_ref_lti" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_ref_resolution" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_session_control" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_session_max_attempts" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_stimulus_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_stimulus_ref_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."metadata_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ordering" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."package_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."pre_condition" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."prefixed_built_in" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."prefixed_declared" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."prefixed_mapped" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."prefixed_variable_source" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."required_child" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rule_operand" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_duration_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_duration_target" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_feedback_outcome_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_identifier_target" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_printed_variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_printed_variable_var_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_ref_resolution" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_variable_declared" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_variable_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_variable_prefixed" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_variable_resolution" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."selection" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."selection_bounded" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."slider_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."stimulus_body" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."stimulus_ref_resolution" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."structure_child" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_default" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_feedback" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_feedback_content_body" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_feedback_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_part" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_part_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_reach" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_rubric_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_rubric_block_use" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_rubric_content_body" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."time_limit_max" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."time_limit_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."time_limits" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."usage_data_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variable_mapping" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."weight" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include_parse" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
