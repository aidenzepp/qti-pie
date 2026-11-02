DROP POLICY "qti__author" ON "qti"."variable_ref";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."literal";

DROP POLICY "qti__author" ON "qti"."expression";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."assessment_item";

DROP VIEW "qti__author"."variable_ref";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."literal";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."assessment_item";

DROP VIEW "qti__author"."admission";

CREATE TABLE "qti"."and" (
  "id" uuid NOT NULL,
  CONSTRAINT "__and_pk_lce55mvyir" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."any_n" (
  "id" uuid NOT NULL,
  "max" "qti"."__text_djykoynpls" NOT NULL,
  "min" "qti"."__text_djykoynpls" NOT NULL,
  CONSTRAINT "__any_n_pk_quebk2zfhq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."container_size" (
  "id" uuid NOT NULL,
  CONSTRAINT "__container_size_pk_xrmvgf377a" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."contains" (
  "id" uuid NOT NULL,
  CONSTRAINT "__contains_pk_g5zczg6nw5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."correct" (
  "id" uuid NOT NULL,
  CONSTRAINT "__correct_pk_5p7ahf4znz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."custom_operator" (
  "id" uuid NOT NULL,
  CONSTRAINT "__custom_operator_pk_gls44jz4e7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."custom_operator_class" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__custom_operator_class_pk_j72263baud" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."custom_operator_definition" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__custom_operator_definition_pk_kgofkkpsq2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_include_lower_bound" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_include_lower_bound_pk_u5oritomi4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_include_upper_bound" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_include_upper_bound_pk_6rx7uubshf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_rounding_mode" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_rounding_mode_pk_23tqco34ok" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_substring" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_substring_pk_gfqwlespam" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_tolerance_mode" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_tolerance_mode_pk_74cy5zo6cw" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."default" (
  "id" uuid NOT NULL,
  CONSTRAINT "__default_pk_v2pmuqkicx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."delete" (
  "id" uuid NOT NULL,
  CONSTRAINT "__delete_pk_lmo6nithdz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."divide" (
  "id" uuid NOT NULL,
  CONSTRAINT "__divide_pk_lkbryowscx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."duration_gte" (
  "id" uuid NOT NULL,
  CONSTRAINT "__duration_gte_pk_bi352ynkm5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."duration_lt" (
  "id" uuid NOT NULL,
  CONSTRAINT "__duration_lt_pk_x5qmccsiof" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."equal" (
  "id" uuid NOT NULL,
  "include_lower_bound" "qti"."__text_cz7v66q3ce" NOT NULL,
  "include_upper_bound" "qti"."__text_cz7v66q3ce" NOT NULL,
  "tolerance_mode" "qti"."__text_celz4obcnh" NOT NULL,
  CONSTRAINT "__equal_pk_u4jsiv4n7p" PRIMARY KEY ("id"),
  CONSTRAINT "__equal_key_id_tolerance_mode_5oe7crwwrv" UNIQUE ("id", "tolerance_mode")
);

CREATE TABLE "qti"."equal_rounded" (
  "figures" "qti"."__text_djykoynpls" NOT NULL,
  "figures_kind" "qti"."ref_or_literal" NOT NULL,
  "figures_value" bigint NOT NULL,
  "id" uuid NOT NULL,
  "rounding_mode" "qti"."__text_hvweswafjf" NOT NULL,
  CONSTRAINT "__equal_rounded_pk_ycg6nkvg3x" PRIMARY KEY ("id"),
  CONSTRAINT "equal_rounded_figures" CHECK (("figures_value" >= 0::bigint AND "rounding_mode" = 'decimalPlaces'::text OR "figures_value" >= 1::bigint AND "rounding_mode" = 'significantFigures'::text OR "figures_kind" = 'ref'::"qti"."ref_or_literal") IS TRUE)
);

CREATE TABLE "qti"."equal_tolerance" (
  "node" uuid NOT NULL,
  "tolerance_mode" "qti"."__text_celz4obcnh" NOT NULL,
  "value" "qti"."__text_vtz3bnghkc" NOT NULL,
  CONSTRAINT "__equal_tolerance_pk_cxz24d6cmb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."exit_response" (
  "id" uuid NOT NULL,
  CONSTRAINT "__exit_response_pk_bwsvjrgab5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."exit_template" (
  "id" uuid NOT NULL,
  CONSTRAINT "__exit_template_pk_rfggxuggcj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."exit_test" (
  "id" uuid NOT NULL,
  CONSTRAINT "__exit_test_pk_b2jqs6hf6b" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."expression_exclude_category" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_uc3mvgolsg" NOT NULL,
  CONSTRAINT "__expression_exclude_category_pk_35alh46qit" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."expression_include_category" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_uc3mvgolsg" NOT NULL,
  CONSTRAINT "__expression_include_category_pk_xasj2jeoni" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."expression_section_identifier" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__expression_section_identifier_pk_by6zkbxpzz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."expression_weight_identifier" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__expression_weight_identifier_pk_do5kpjfyyv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."fallback" (
  "id" uuid NOT NULL,
  CONSTRAINT "__fallback_pk_wb6fgkjy6i" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."field_value" (
  "field_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__field_value_pk_3px6tuekcx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."gcd" (
  "id" uuid NOT NULL,
  CONSTRAINT "__gcd_pk_d5prwpqmbl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."gt" (
  "id" uuid NOT NULL,
  CONSTRAINT "__gt_pk_yf26zc4hjc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."gte" (
  "id" uuid NOT NULL,
  CONSTRAINT "__gte_pk_xjiyylmyqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."index" (
  "id" uuid NOT NULL,
  "n" "qti"."__text_djykoynpls" NOT NULL,
  "n_kind" "qti"."ref_or_literal" NOT NULL,
  "n_value" bigint NOT NULL,
  CONSTRAINT "__index_pk_jgklvulh7y" PRIMARY KEY ("id"),
  CONSTRAINT "index_positive" CHECK (("n_kind" = 'ref'::"qti"."ref_or_literal" OR "n_value" >= 1::bigint) IS TRUE)
);

CREATE TABLE "qti"."inside" (
  "coords" "qti"."__text_gubl3xpcnx" NOT NULL,
  "id" uuid NOT NULL,
  "shape" "qti"."__text_2hoxdcszyn" NOT NULL,
  CONSTRAINT "__inside_pk_atcirtha2w" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."integer_divide" (
  "id" uuid NOT NULL,
  CONSTRAINT "__integer_divide_pk_zzxu7j5w7f" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."integer_modulus" (
  "id" uuid NOT NULL,
  CONSTRAINT "__integer_modulus_pk_htpqzwn5ph" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."integer_to_float" (
  "id" uuid NOT NULL,
  CONSTRAINT "__integer_to_float_pk_plufh2y2er" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."is_null" (
  "id" uuid NOT NULL,
  CONSTRAINT "__is_null_pk_rztk2ces37" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lcm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__lcm_pk_a62kmxetqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lookup_outcome_value" (
  "id" uuid NOT NULL,
  CONSTRAINT "__lookup_outcome_value_pk_ide6hvpftx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lt" (
  "id" uuid NOT NULL,
  CONSTRAINT "__lt_pk_auwosookqt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lte" (
  "id" uuid NOT NULL,
  CONSTRAINT "__lte_pk_qqbow34kv6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_response" (
  "id" uuid NOT NULL,
  CONSTRAINT "__map_response_pk_xro657lehh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_response_point" (
  "id" uuid NOT NULL,
  CONSTRAINT "__map_response_point_pk_sqnqvr2sdx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match" (
  "id" uuid NOT NULL,
  CONSTRAINT "__match_pk_uehnzuwybm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."math_constant" (
  "id" uuid NOT NULL,
  "name" "qti"."__text_ibaizj6fv3" NOT NULL,
  CONSTRAINT "__math_constant_pk_wsg3qmfz2p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."math_operator" (
  "id" uuid NOT NULL,
  "name" "qti"."__text_u3q4acbjwm" NOT NULL,
  CONSTRAINT "__math_operator_pk_nc3i3g73dh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."max" (
  "id" uuid NOT NULL,
  CONSTRAINT "__max_pk_2pspzdsgps" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."member" (
  "id" uuid NOT NULL,
  CONSTRAINT "__member_pk_ce5j5h4dqs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."min" (
  "id" uuid NOT NULL,
  CONSTRAINT "__min_pk_nkdgt2ynof" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."multiple" (
  "id" uuid NOT NULL,
  CONSTRAINT "__multiple_pk_vvs64v475f" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."not" (
  "id" uuid NOT NULL,
  CONSTRAINT "__not_pk_bauz5nu6h7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."null" (
  "id" uuid NOT NULL,
  CONSTRAINT "__null_pk_g63z7msytv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_correct" (
  "id" uuid NOT NULL,
  CONSTRAINT "__number_correct_pk_qlz7x6yb2w" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_incorrect" (
  "id" uuid NOT NULL,
  CONSTRAINT "__number_incorrect_pk_zlrq5c77ks" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_presented" (
  "id" uuid NOT NULL,
  CONSTRAINT "__number_presented_pk_ewjcxpyfdx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_responded" (
  "id" uuid NOT NULL,
  CONSTRAINT "__number_responded_pk_mojv4byhkl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_selected" (
  "id" uuid NOT NULL,
  CONSTRAINT "__number_selected_pk_cokievddwb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."or" (
  "id" uuid NOT NULL,
  CONSTRAINT "__or_pk_y7duy5pfgu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."ordered" (
  "id" uuid NOT NULL,
  CONSTRAINT "__ordered_pk_bqvukunel4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_condition_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_condition_arm_pk_wo3d4slnda" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_else_arm" (
  "condition" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_else_arm_pk_yswy2y7e4t" PRIMARY KEY ("id"),
  CONSTRAINT "__outcome_else_arm_key_condition_fz6vete2cx" UNIQUE ("condition")
);

CREATE TABLE "qti"."outcome_else_if_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_else_if_arm_pk_ha426uaa6s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_if_arm" (
  "condition" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_if_arm_pk_lwzvhkiup2" PRIMARY KEY ("id"),
  CONSTRAINT "__outcome_if_arm_key_condition_5tumrsqgpm" UNIQUE ("condition")
);

CREATE TABLE "qti"."outcome_maximum_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_maximum_arm_pk_etovftfrz3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_min_max" (
  "id" uuid NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "outcome_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__outcome_min_max_pk_f23nbtrqiq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_minimum_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_minimum_arm_pk_e3w4q2hbek" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_processing" (
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_processing_pk_xvxv6zwarp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_processing_fragment" (
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_processing_fragment_pk_gvneivp4il" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."pattern_match" (
  "id" uuid NOT NULL,
  "pattern" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__pattern_match_pk_enhbe55iiw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."power" (
  "id" uuid NOT NULL,
  CONSTRAINT "__power_pk_r5lq7qyhym" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."product" (
  "id" uuid NOT NULL,
  CONSTRAINT "__product_pk_6ykszscxwz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random" (
  "id" uuid NOT NULL,
  CONSTRAINT "__random_pk_7rdffnzvjo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random_float" (
  "id" uuid NOT NULL,
  "max" "qti"."__text_wuvwyowttn" NOT NULL,
  CONSTRAINT "__random_float_pk_7hxcqp7hcb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random_float_min" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_wuvwyowttn" NOT NULL,
  CONSTRAINT "__random_float_min_pk_aej2iktm7e" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."random_integer" (
  "id" uuid NOT NULL,
  "max" "qti"."__text_djykoynpls" NOT NULL,
  CONSTRAINT "__random_integer_pk_7ubdngnlaj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random_integer_min" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_djykoynpls" NOT NULL,
  CONSTRAINT "__random_integer_min_pk_5q2fi4dj4p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."random_integer_step" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_djykoynpls" NOT NULL,
  CONSTRAINT "__random_integer_step_pk_hp6mozrawn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."repeat" (
  "id" uuid NOT NULL,
  "number_repeats" "qti"."__text_djykoynpls" NOT NULL,
  "number_repeats_kind" "qti"."ref_or_literal" NOT NULL,
  "number_repeats_value" bigint NOT NULL,
  CONSTRAINT "__repeat_pk_sucagcjref" PRIMARY KEY ("id"),
  CONSTRAINT "repeat_int" CHECK (("number_repeats_value" >= (-2147483648)::bigint AND "number_repeats_value" <= 2147483647::bigint OR "number_repeats_kind" = 'ref'::"qti"."ref_or_literal") IS TRUE)
);

CREATE TABLE "qti"."response_condition_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__response_condition_arm_pk_h7ymbdp7g2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."response_else_arm" (
  "condition" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__response_else_arm_pk_2tcvw4myw3" PRIMARY KEY ("id"),
  CONSTRAINT "__response_else_arm_key_condition_plufqal34d" UNIQUE ("condition")
);

CREATE TABLE "qti"."response_else_if_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__response_else_if_arm_pk_tcq6albawo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."response_if_arm" (
  "condition" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__response_if_arm_pk_my6j3ksjx3" PRIMARY KEY ("id"),
  CONSTRAINT "__response_if_arm_key_condition_jcpht666ni" UNIQUE ("condition")
);

CREATE TABLE "qti"."response_processing_fragment" (
  "id" uuid NOT NULL,
  CONSTRAINT "__response_processing_fragment_pk_z4c7albdel" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."round" (
  "id" uuid NOT NULL,
  CONSTRAINT "__round_pk_qzw6omft62" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."round_to" (
  "figures" "qti"."__text_djykoynpls" NOT NULL,
  "figures_kind" "qti"."ref_or_literal" NOT NULL,
  "figures_value" bigint NOT NULL,
  "id" uuid NOT NULL,
  "rounding_mode" "qti"."__text_hvweswafjf" NOT NULL,
  CONSTRAINT "__round_to_pk_d45lpqk5n3" PRIMARY KEY ("id"),
  CONSTRAINT "round_to_figures" CHECK (("figures_value" >= 0::bigint AND "rounding_mode" = 'decimalPlaces'::text OR "figures_value" >= 1::bigint AND "rounding_mode" = 'significantFigures'::text OR "figures_kind" = 'ref'::"qti"."ref_or_literal") IS TRUE)
);

CREATE TABLE "qti"."rule_operand" (
  "child" uuid NOT NULL,
  "position" bigint NOT NULL,
  "rule" uuid NOT NULL,
  "rule_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__rule_operand_pk_jcni7ipc5p" PRIMARY KEY ("rule"),
  CONSTRAINT "__rule_operand_key_child_qloy3wxzn5" UNIQUE ("child")
);

CREATE TABLE "qti"."set_correct_response" (
  "id" uuid NOT NULL,
  CONSTRAINT "__set_correct_response_pk_sxqj5x5hy6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."set_default_value" (
  "id" uuid NOT NULL,
  CONSTRAINT "__set_default_value_pk_v7un4utfsm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."set_outcome_value" (
  "id" uuid NOT NULL,
  CONSTRAINT "__set_outcome_value_pk_lbvpf5wb5e" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."set_template_value" (
  "id" uuid NOT NULL,
  CONSTRAINT "__set_template_value_pk_ovr7opqhur" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."stats_operator" (
  "id" uuid NOT NULL,
  "name" "qti"."__text_mmzgy7vcfw" NOT NULL,
  CONSTRAINT "__stats_operator_pk_vb3cdvabdi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."string_match" (
  "case_sensitive" "qti"."__text_cz7v66q3ce" NOT NULL,
  "id" uuid NOT NULL,
  "substring" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__string_match_pk_2yrytbiaer" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."substring" (
  "case_sensitive" "qti"."__text_cz7v66q3ce" NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__substring_pk_xyhgl3p6sv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."subtract" (
  "id" uuid NOT NULL,
  CONSTRAINT "__subtract_pk_3mqph5ppcc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."sum" (
  "id" uuid NOT NULL,
  CONSTRAINT "__sum_pk_x5uo2a3mdb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_condition_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__template_condition_arm_pk_5if3lwsukp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_constraint" (
  "id" uuid NOT NULL,
  CONSTRAINT "__template_constraint_pk_p62ienp6si" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_else_arm" (
  "condition" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__template_else_arm_pk_piarpc3rde" PRIMARY KEY ("id"),
  CONSTRAINT "__template_else_arm_key_condition_vceem34ndx" UNIQUE ("condition")
);

CREATE TABLE "qti"."template_else_if_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__template_else_if_arm_pk_ucexwtn32p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_if_arm" (
  "condition" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__template_if_arm_pk_kgbpihwhko" PRIMARY KEY ("id"),
  CONSTRAINT "__template_if_arm_key_condition_r2j7wjf6gy" UNIQUE ("condition")
);

CREATE TABLE "qti"."template_processing" (
  "id" uuid NOT NULL,
  "item" uuid NOT NULL,
  CONSTRAINT "__template_processing_pk_s6nxl6qirh" PRIMARY KEY ("id"),
  CONSTRAINT "__template_processing_key_item_dw4vumlyl4" UNIQUE ("item")
);

CREATE TABLE "qti"."test_variables" (
  "id" uuid NOT NULL,
  "variable_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__test_variables_pk_prmrb6n465" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."test_variables_base_type" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_gemmttam7z" NOT NULL,
  CONSTRAINT "__test_variables_base_type_pk_2cymaruanl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."truncate" (
  "id" uuid NOT NULL,
  CONSTRAINT "__truncate_pk_jihc6zxq3s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."variable" (
  "id" uuid NOT NULL,
  CONSTRAINT "__variable_pk_uw2snpik7k" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."variable_weight_identifier" (
  "node" uuid NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__variable_weight_identifier_pk_5cjde2q7ie" PRIMARY KEY ("node"),
  CONSTRAINT "variable_weight_in_test" CHECK (("root_kind" = 'test'::"qti"."root_kind") IS TRUE)
);

CREATE TABLE "qti"."x_include" (
  "id" uuid NOT NULL,
  CONSTRAINT "__x_include_pk_pq26xdbsr2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."x_include_accept" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_accept_pk_bbdlyyklyj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_accept_language" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_accept_language_pk_zoi5c6eu5q" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_encoding" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_encoding_pk_ycj6l57qqa" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_href" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__x_include_href_pk_tcda3sytvb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_parse" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_vwnl4b5fqr" NOT NULL,
  CONSTRAINT "__x_include_parse_pk_sna47bsnxm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_xpointer" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_xpointer_pk_t2wlgmegik" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."and" ADD COLUMN "__tag_kind_qti_and_hietom4ymf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-and'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."any_n" ADD COLUMN "__tag_kind_qti_any_n_7fjipr6x66" "qti"."node_kind" GENERATED ALWAYS AS ('qti-any-n'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."container_size" ADD COLUMN "__tag_kind_qti_container_size_ffge7oxu2m" "qti"."node_kind" GENERATED ALWAYS AS ('qti-container-size'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."contains" ADD COLUMN "__tag_kind_qti_contains_ffvmh3ao5n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-contains'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."correct" ADD COLUMN "__tag_kind_qti_correct_adce6nmlck" "qti"."node_kind" GENERATED ALWAYS AS ('qti-correct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."custom_operator" ADD COLUMN "__tag_kind_qti_custom_operator_hgnfdy7pnw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-custom-operator'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."default" ADD COLUMN "__tag_kind_qti_default_jhwhuox3of" "qti"."node_kind" GENERATED ALWAYS AS ('qti-default'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."delete" ADD COLUMN "__tag_kind_qti_delete_w5w6qiomne" "qti"."node_kind" GENERATED ALWAYS AS ('qti-delete'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."divide" ADD COLUMN "__tag_kind_qti_divide_dgjmhfkvv3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-divide'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."duration_gte" ADD COLUMN "__tag_kind_qti_duration_gte_lzoivglsok" "qti"."node_kind" GENERATED ALWAYS AS ('qti-duration-gte'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."duration_lt" ADD COLUMN "__tag_kind_qti_duration_lt_xn3larffx7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-duration-lt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."equal" ADD COLUMN "__tag_kind_qti_equal_srgxur27t7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-equal'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."equal_rounded" ADD COLUMN "__tag_kind_qti_equal_rounded_v6objmsi4d" "qti"."node_kind" GENERATED ALWAYS AS ('qti-equal-rounded'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."exit_response" ADD COLUMN "__tag_kind_qti_exit_response_7dymabqkc4" "qti"."node_kind" GENERATED ALWAYS AS ('qti-exit-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."exit_template" ADD COLUMN "__tag_kind_qti_exit_template_ifkvvzdxdx" "qti"."node_kind" GENERATED ALWAYS AS ('qti-exit-template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."exit_test" ADD COLUMN "__tag_kind_qti_exit_test_ju554ikqov" "qti"."node_kind" GENERATED ALWAYS AS ('qti-exit-test'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."fallback" ADD COLUMN "__tag_kind_xi_fallback_mi6ozofd6d" "qti"."node_kind" GENERATED ALWAYS AS ('xi:fallback'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."field_value" ADD COLUMN "__tag_kind_qti_field_value_2z2wrjjwbo" "qti"."node_kind" GENERATED ALWAYS AS ('qti-field-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gcd" ADD COLUMN "__tag_kind_qti_gcd_fif4dvbbgi" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gcd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gt" ADD COLUMN "__tag_kind_qti_gt_jyjg6yqgqv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gte" ADD COLUMN "__tag_kind_qti_gte_gurw6edziz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gte'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."index" ADD COLUMN "__tag_kind_qti_index_ekqtqbvpem" "qti"."node_kind" GENERATED ALWAYS AS ('qti-index'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."inside" ADD COLUMN "__tag_kind_qti_inside_uqwtkeu4d6" "qti"."node_kind" GENERATED ALWAYS AS ('qti-inside'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."integer_divide" ADD COLUMN "__tag_kind_qti_integer_divide_p6arj4ose5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-integer-divide'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."integer_modulus" ADD COLUMN "__tag_kind_qti_integer_modulus_3qu7obkveq" "qti"."node_kind" GENERATED ALWAYS AS ('qti-integer-modulus'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."integer_to_float" ADD COLUMN "__tag_kind_qti_integer_to_float_hdfmecar27" "qti"."node_kind" GENERATED ALWAYS AS ('qti-integer-to-float'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."is_null" ADD COLUMN "__tag_kind_qti_is_null_ibjh6ibqii" "qti"."node_kind" GENERATED ALWAYS AS ('qti-is-null'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lcm" ADD COLUMN "__tag_kind_qti_lcm_e3pbv2j3vf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lcm'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."literal" ADD COLUMN "__tag_kind_qti_base_value_s2tktoudmi" "qti"."node_kind" GENERATED ALWAYS AS ('qti-base-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lookup_outcome_value" ADD COLUMN "__tag_kind_qti_lookup_outcome_value_upvgllrywv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lookup-outcome-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lt" ADD COLUMN "__tag_kind_qti_lt_mu6hpi7jul" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lte" ADD COLUMN "__tag_kind_qti_lte_rzob7fldtj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lte'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."map_response" ADD COLUMN "__tag_kind_qti_map_response_argeupazur" "qti"."node_kind" GENERATED ALWAYS AS ('qti-map-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."map_response_point" ADD COLUMN "__tag_kind_qti_map_response_point_q6t4cnql4v" "qti"."node_kind" GENERATED ALWAYS AS ('qti-map-response-point'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."match" ADD COLUMN "__tag_kind_qti_match_lnqs6dxwup" "qti"."node_kind" GENERATED ALWAYS AS ('qti-match'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."math_constant" ADD COLUMN "__tag_kind_qti_math_constant_33aeaomua7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-math-constant'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."math_operator" ADD COLUMN "__tag_kind_qti_math_operator_5q3gpyxbee" "qti"."node_kind" GENERATED ALWAYS AS ('qti-math-operator'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."max" ADD COLUMN "__tag_kind_qti_max_k2fgxlddd5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-max'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."member" ADD COLUMN "__tag_kind_qti_member_wlwyybwmab" "qti"."node_kind" GENERATED ALWAYS AS ('qti-member'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."min" ADD COLUMN "__tag_kind_qti_min_5k4uqv4ded" "qti"."node_kind" GENERATED ALWAYS AS ('qti-min'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."multiple" ADD COLUMN "__tag_kind_qti_multiple_blwsugoch2" "qti"."node_kind" GENERATED ALWAYS AS ('qti-multiple'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."not" ADD COLUMN "__tag_kind_qti_not_ctn3qliz6a" "qti"."node_kind" GENERATED ALWAYS AS ('qti-not'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."null" ADD COLUMN "__tag_kind_qti_null_sjdltnabyd" "qti"."node_kind" GENERATED ALWAYS AS ('qti-null'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_correct" ADD COLUMN "__tag_kind_qti_number_correct_vgudlj33aa" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-correct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_incorrect" ADD COLUMN "__tag_kind_qti_number_incorrect_fobw5d7gbp" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-incorrect'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_presented" ADD COLUMN "__tag_kind_qti_number_presented_c4kw7h2vss" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-presented'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_responded" ADD COLUMN "__tag_kind_qti_number_responded_rej7fdtd2o" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-responded'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_selected" ADD COLUMN "__tag_kind_qti_number_selected_y5wyghaa7n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-selected'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."or" ADD COLUMN "__tag_kind_qti_or_2bm3cp5uoy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-or'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordered" ADD COLUMN "__tag_kind_qti_ordered_wujbvdvnaz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-ordered'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_condition_arm" ADD COLUMN "__tag_kind_qti_outcome_condition_3td227dwcr" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_else_arm" ADD COLUMN "__tag_kind_qti_outcome_else_7klt3q36ge" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-else'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_else_if_arm" ADD COLUMN "__tag_kind_qti_outcome_else_if_dfe5qckhzt" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-else-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_if_arm" ADD COLUMN "__tag_kind_qti_outcome_if_unq7efyvy3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_maximum_arm" ADD COLUMN "__tag_kind_qti_outcome_maximum_xfo2bco2fs" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-maximum'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_minimum_arm" ADD COLUMN "__tag_kind_qti_outcome_minimum_tdjdlbn6dy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-minimum'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_processing" ADD COLUMN "__tag_kind_qti_outcome_processing_fhxwpg6h24" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-processing'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_processing_fragment" ADD COLUMN "__tag_kind_qti_outcome_processing_fragment_unfq3d4o7g" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-processing-fragment'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."pattern_match" ADD COLUMN "__tag_kind_qti_pattern_match_fvc7hdtz3d" "qti"."node_kind" GENERATED ALWAYS AS ('qti-pattern-match'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."power" ADD COLUMN "__tag_kind_qti_power_kpx2em75ca" "qti"."node_kind" GENERATED ALWAYS AS ('qti-power'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."product" ADD COLUMN "__tag_kind_qti_product_hojc6apo2s" "qti"."node_kind" GENERATED ALWAYS AS ('qti-product'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."random" ADD COLUMN "__tag_kind_qti_random_erxmfosfti" "qti"."node_kind" GENERATED ALWAYS AS ('qti-random'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."random_float" ADD COLUMN "__tag_kind_qti_random_float_y4p3lnm6a4" "qti"."node_kind" GENERATED ALWAYS AS ('qti-random-float'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."random_integer" ADD COLUMN "__tag_kind_qti_random_integer_rbwxdayyl2" "qti"."node_kind" GENERATED ALWAYS AS ('qti-random-integer'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."repeat" ADD COLUMN "__tag_kind_qti_repeat_bpcaeiu7tm" "qti"."node_kind" GENERATED ALWAYS AS ('qti-repeat'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_condition_arm" ADD COLUMN "__tag_kind_qti_response_condition_gplnrgu2ol" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_else_arm" ADD COLUMN "__tag_kind_qti_response_else_hxjbbfwd4n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-else'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_else_if_arm" ADD COLUMN "__tag_kind_qti_response_else_if_z5u6rg462x" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-else-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_if_arm" ADD COLUMN "__tag_kind_qti_response_if_vi7uxgsitt" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_processing_fragment" ADD COLUMN "__tag_kind_qti_response_processing_fragment_ftcfl3v7ub" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-processing-fragment'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."round" ADD COLUMN "__tag_kind_qti_round_5eosswhdnh" "qti"."node_kind" GENERATED ALWAYS AS ('qti-round'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."round_to" ADD COLUMN "__tag_kind_qti_round_to_qrylojzgc7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-round-to'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_correct_response" ADD COLUMN "__tag_kind_qti_set_correct_response_p4ucnvbenj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-correct-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_default_value" ADD COLUMN "__tag_kind_qti_set_default_value_rj2hosazj5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-default-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_outcome_value" ADD COLUMN "__tag_kind_qti_set_outcome_value_h6wjpdpvko" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-outcome-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_template_value" ADD COLUMN "__tag_kind_qti_set_template_value_nb6cflrq6l" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-template-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."stats_operator" ADD COLUMN "__tag_kind_qti_stats_operator_x5autjgscg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-stats-operator'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."string_match" ADD COLUMN "__tag_kind_qti_string_match_ymwg654alj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-string-match'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."substring" ADD COLUMN "__tag_kind_qti_substring_j2vyby2o5h" "qti"."node_kind" GENERATED ALWAYS AS ('qti-substring'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."subtract" ADD COLUMN "__tag_kind_qti_subtract_fn3f5wibuj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-subtract'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."sum" ADD COLUMN "__tag_kind_qti_sum_2bm2f65vor" "qti"."node_kind" GENERATED ALWAYS AS ('qti-sum'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_condition_arm" ADD COLUMN "__tag_kind_qti_template_condition_5iedsmf35c" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_constraint" ADD COLUMN "__tag_kind_qti_template_constraint_nwjpfefvxc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-constraint'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_else_arm" ADD COLUMN "__tag_kind_qti_template_else_td6wimhp7s" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-else'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_else_if_arm" ADD COLUMN "__tag_kind_qti_template_else_if_xkgqxjlgvf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-else-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_if_arm" ADD COLUMN "__tag_kind_qti_template_if_kdp2hjyxni" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_processing" ADD COLUMN "__tag_kind_qti_template_processing_julsyuopii" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-processing'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_variables" ADD COLUMN "__tag_kind_qti_test_variables_ssteaad3nd" "qti"."node_kind" GENERATED ALWAYS AS ('qti-test-variables'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."truncate" ADD COLUMN "__tag_kind_qti_truncate_vkai3xtk23" "qti"."node_kind" GENERATED ALWAYS AS ('qti-truncate'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variable" ADD COLUMN "__tag_kind_qti_variable_obgp52jplg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-variable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."x_include" ADD COLUMN "__tag_kind_xi_include_tnsd6wpc7o" "qti"."node_kind" GENERATED ALWAYS AS ('xi:include'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."and" ADD CONSTRAINT "__and_fk_id_roez54kv57" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."and" ADD CONSTRAINT "__and_fk_id_tag_kind_qti_and_hietom_4_ymf_x43hurxfdz" FOREIGN KEY ("id", "__tag_kind_qti_and_hietom4ymf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."any_n" ADD CONSTRAINT "__any_n_fk_id_pvphqpmb6x" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."any_n" ADD CONSTRAINT "__any_n_fk_id_tag_kind_qti_any_n_7_fjipr_6_x_66_5rylr7ljir" FOREIGN KEY ("id", "__tag_kind_qti_any_n_7fjipr6x66") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."container_size" ADD CONSTRAINT "__container_size_fk_id_7px3ii6zuw" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."container_size" ADD CONSTRAINT "__container_size_fk_id_tag_kind_qti_container_size_uqn4djigxs" FOREIGN KEY ("id", "__tag_kind_qti_container_size_ffge7oxu2m") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."contains" ADD CONSTRAINT "__contains_fk_id_zgkj3nkwy5" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."contains" ADD CONSTRAINT "__contains_fk_id_tag_kind_qti_contains_ffvmh_3_ao_5_5gryjokbos" FOREIGN KEY ("id", "__tag_kind_qti_contains_ffvmh3ao5n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct" ADD CONSTRAINT "__correct_fk_id_xekitpgoxu" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct" ADD CONSTRAINT "__correct_fk_id_yn5ncjb4ja" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct" ADD CONSTRAINT "__correct_fk_id_tag_kind_qti_correct_adce_6_nmlck_4s6bp2abb7" FOREIGN KEY ("id", "__tag_kind_qti_correct_adce6nmlck") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."custom_operator" ADD CONSTRAINT "__custom_operator_fk_id_kefw73uwn4" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."custom_operator" ADD CONSTRAINT "__custom_operator_fk_id_tag_kind_qti_custom_operator_lgrzuqjcys" FOREIGN KEY ("id", "__tag_kind_qti_custom_operator_hgnfdy7pnw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."custom_operator_class" ADD CONSTRAINT "__custom_operator_class_fk_node_3dfgstdo7s" FOREIGN KEY ("node") REFERENCES "qti"."custom_operator" ("id");

ALTER TABLE "qti"."custom_operator_definition" ADD CONSTRAINT "__custom_operator_definition_fk_node_dfov4csotl" FOREIGN KEY ("node") REFERENCES "qti"."custom_operator" ("id");

ALTER TABLE "qti"."declared_include_lower_bound" ADD CONSTRAINT "__declared_include_lower_bound_fk_node_ped2a3xl5q" FOREIGN KEY ("node") REFERENCES "qti"."equal" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_include_upper_bound" ADD CONSTRAINT "__declared_include_upper_bound_fk_node_cxsgi7rsgh" FOREIGN KEY ("node") REFERENCES "qti"."equal" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_rounding_mode" ADD CONSTRAINT "__declared_rounding_mode_fk_node_up55mfxhaz" FOREIGN KEY ("node") REFERENCES "qti"."equal_rounded" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_substring" ADD CONSTRAINT "__declared_substring_fk_node_dr6edie4bt" FOREIGN KEY ("node") REFERENCES "qti"."string_match" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_tolerance_mode" ADD CONSTRAINT "__declared_tolerance_mode_fk_node_nirjmcd4y6" FOREIGN KEY ("node") REFERENCES "qti"."equal" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default" ADD CONSTRAINT "__default_fk_id_yae276tuus" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default" ADD CONSTRAINT "__default_fk_id_3w4dzl762a" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default" ADD CONSTRAINT "__default_fk_id_tag_kind_qti_default_jhwhuox_3_of_eoaql2ij27" FOREIGN KEY ("id", "__tag_kind_qti_default_jhwhuox3of") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."delete" ADD CONSTRAINT "__delete_fk_id_guc43fhhuy" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."delete" ADD CONSTRAINT "__delete_fk_id_tag_kind_qti_delete_w_5_w_6_qiomne_ashud7226e" FOREIGN KEY ("id", "__tag_kind_qti_delete_w5w6qiomne") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."divide" ADD CONSTRAINT "__divide_fk_id_5ne4j5abf7" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."divide" ADD CONSTRAINT "__divide_fk_id_tag_kind_qti_divide_dgjmhfkvv_3_pvlvhxtstb" FOREIGN KEY ("id", "__tag_kind_qti_divide_dgjmhfkvv3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_gte" ADD CONSTRAINT "__duration_gte_fk_id_soljtl2ru6" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_gte" ADD CONSTRAINT "__duration_gte_fk_id_tag_kind_qti_duration_gte_x7s7qaqvye" FOREIGN KEY ("id", "__tag_kind_qti_duration_gte_lzoivglsok") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_lt" ADD CONSTRAINT "__duration_lt_fk_id_t4gbten367" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_lt" ADD CONSTRAINT "__duration_lt_fk_id_tag_kind_qti_duration_lt_xn_3_2es53ohito" FOREIGN KEY ("id", "__tag_kind_qti_duration_lt_xn3larffx7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal" ADD CONSTRAINT "__equal_fk_id_avgfouuask" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal" ADD CONSTRAINT "__equal_fk_id_tag_kind_qti_equal_srgxur_27_t_7_ekrupelmig" FOREIGN KEY ("id", "__tag_kind_qti_equal_srgxur27t7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal_rounded" ADD CONSTRAINT "__equal_rounded_fk_id_dm5fy2x5fx" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal_rounded" ADD CONSTRAINT "__equal_rounded_fk_id_tag_kind_qti_equal_rounded_v_6_lmnw7bvxu4" FOREIGN KEY ("id", "__tag_kind_qti_equal_rounded_v6objmsi4d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal_tolerance" ADD CONSTRAINT "__equal_tolerance_fk_node_tolerance_mode_zggqkxh66v" FOREIGN KEY ("node", "tolerance_mode") REFERENCES "qti"."equal" ("id", "tolerance_mode") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."exit_response" ADD CONSTRAINT "__exit_response_fk_id_tag_kind_qti_exit_response_7_aaj7ucbwcy" FOREIGN KEY ("id", "__tag_kind_qti_exit_response_7dymabqkc4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."exit_template" ADD CONSTRAINT "__exit_template_fk_id_tag_kind_qti_exit_template_2ifyz2wilo" FOREIGN KEY ("id", "__tag_kind_qti_exit_template_ifkvvzdxdx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."exit_test" ADD CONSTRAINT "__exit_test_fk_id_tag_kind_qti_exit_test_ju_554_uthcipxi25" FOREIGN KEY ("id", "__tag_kind_qti_exit_test_ju554ikqov") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_exclude_category" ADD CONSTRAINT "__expression_exclude_category_fk_node_y63mccgxjm" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_include_category" ADD CONSTRAINT "__expression_include_category_fk_node_bbmn3oh7lp" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_section_identifier" ADD CONSTRAINT "__expression_section_identifier_fk_node_2vkg2rmdrz" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_weight_identifier" ADD CONSTRAINT "__expression_weight_identifier_fk_node_eo6avloo6c" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."fallback" ADD CONSTRAINT "__fallback_fk_id_tag_kind_xi_fallback_mi_6_ozofd_6_d_jqjumf2cb3" FOREIGN KEY ("id", "__tag_kind_xi_fallback_mi6ozofd6d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."field_value" ADD CONSTRAINT "__field_value_fk_id_xy6vy4ozmk" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."field_value" ADD CONSTRAINT "__field_value_fk_id_tag_kind_qti_field_value_2_z_2_noxgq3e3l4" FOREIGN KEY ("id", "__tag_kind_qti_field_value_2z2wrjjwbo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gcd" ADD CONSTRAINT "__gcd_fk_id_njtn2gkwq5" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gcd" ADD CONSTRAINT "__gcd_fk_id_tag_kind_qti_gcd_fif_4_dvbbgi_ozbhrvoz52" FOREIGN KEY ("id", "__tag_kind_qti_gcd_fif4dvbbgi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gt" ADD CONSTRAINT "__gt_fk_id_zgvlugkn52" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gt" ADD CONSTRAINT "__gt_fk_id_tag_kind_qti_gt_jyjg_6_yqgqv_y4pkalesqo" FOREIGN KEY ("id", "__tag_kind_qti_gt_jyjg6yqgqv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gte" ADD CONSTRAINT "__gte_fk_id_suxk6gqnxf" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gte" ADD CONSTRAINT "__gte_fk_id_tag_kind_qti_gte_gurw_6_edziz_lvdrbzrkmk" FOREIGN KEY ("id", "__tag_kind_qti_gte_gurw6edziz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."index" ADD CONSTRAINT "__index_fk_id_mhiugan6ac" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."index" ADD CONSTRAINT "__index_fk_id_tag_kind_qti_index_ekqtqbvpem_g3lwhqdjn7" FOREIGN KEY ("id", "__tag_kind_qti_index_ekqtqbvpem") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inside" ADD CONSTRAINT "__inside_fk_id_r76h3gwgel" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inside" ADD CONSTRAINT "__inside_fk_id_tag_kind_qti_inside_uqwtkeu_4_d_6_ec2775uahe" FOREIGN KEY ("id", "__tag_kind_qti_inside_uqwtkeu4d6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_divide" ADD CONSTRAINT "__integer_divide_fk_id_aapblfmkop" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_divide" ADD CONSTRAINT "__integer_divide_fk_id_tag_kind_qti_integer_divide_p_45aioisyeh" FOREIGN KEY ("id", "__tag_kind_qti_integer_divide_p6arj4ose5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_modulus" ADD CONSTRAINT "__integer_modulus_fk_id_zai577tyu4" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_modulus" ADD CONSTRAINT "__integer_modulus_fk_id_tag_kind_qti_integer_modulus_2gttwvkmmk" FOREIGN KEY ("id", "__tag_kind_qti_integer_modulus_3qu7obkveq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_to_float" ADD CONSTRAINT "__integer_to_float_fk_id_rihzowuazj" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_to_float" ADD CONSTRAINT "__integer_to_float_fk_id_tag_kind_qti_integer_to_r4o33zvjtl" FOREIGN KEY ("id", "__tag_kind_qti_integer_to_float_hdfmecar27") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."is_null" ADD CONSTRAINT "__is_null_fk_id_47fcopwphs" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."is_null" ADD CONSTRAINT "__is_null_fk_id_tag_kind_qti_is_null_ibjh_6_ibqii_l5z6eltsen" FOREIGN KEY ("id", "__tag_kind_qti_is_null_ibjh6ibqii") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lcm" ADD CONSTRAINT "__lcm_fk_id_7ozlvyivcj" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lcm" ADD CONSTRAINT "__lcm_fk_id_tag_kind_qti_lcm_e_3_pbv_2_j_3_vf_tgxcqh6nr5" FOREIGN KEY ("id", "__tag_kind_qti_lcm_e3pbv2j3vf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal" ADD CONSTRAINT "__literal_fk_id_tag_kind_qti_base_value_s_2_tktoudmi_ezrzio63ck" FOREIGN KEY ("id", "__tag_kind_qti_base_value_s2tktoudmi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lookup_outcome_value" ADD CONSTRAINT "__lookup_outcome_value_fk_id_oz7cfhuqid" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lookup_outcome_value" ADD CONSTRAINT "__lookup_outcome_value_fk_id_ditaed6wt4" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lookup_outcome_value" ADD CONSTRAINT "__lookup_outcome_value_fk_id_tag_kind_qti_lookup_dfgs5ltobq" FOREIGN KEY ("id", "__tag_kind_qti_lookup_outcome_value_upvgllrywv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lt" ADD CONSTRAINT "__lt_fk_id_inbmmkow27" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lt" ADD CONSTRAINT "__lt_fk_id_tag_kind_qti_lt_mu_6_hpi_7_jul_w3xe35lmuy" FOREIGN KEY ("id", "__tag_kind_qti_lt_mu6hpi7jul") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lte" ADD CONSTRAINT "__lte_fk_id_kyui6hi5of" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lte" ADD CONSTRAINT "__lte_fk_id_tag_kind_qti_lte_rzob_7_fldtj_qois4rus27" FOREIGN KEY ("id", "__tag_kind_qti_lte_rzob7fldtj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response" ADD CONSTRAINT "__map_response_fk_id_fuhcgjkpzo" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response" ADD CONSTRAINT "__map_response_fk_id_v3lhvp7zwk" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response" ADD CONSTRAINT "__map_response_fk_id_tag_kind_qti_map_response_7kz5oqqvrj" FOREIGN KEY ("id", "__tag_kind_qti_map_response_argeupazur") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response_point" ADD CONSTRAINT "__map_response_point_fk_id_q5hysxtwju" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response_point" ADD CONSTRAINT "__map_response_point_fk_id_rfzddt37sa" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response_point" ADD CONSTRAINT "__map_response_point_fk_id_tag_kind_qti_map_response_pqjmyxmroj" FOREIGN KEY ("id", "__tag_kind_qti_map_response_point_q6t4cnql4v") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match" ADD CONSTRAINT "__match_fk_id_hvzxeiva7v" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match" ADD CONSTRAINT "__match_fk_id_tag_kind_qti_match_lnqs_6_dxwup_zmwvvpefyc" FOREIGN KEY ("id", "__tag_kind_qti_match_lnqs6dxwup") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_constant" ADD CONSTRAINT "__math_constant_fk_id_3if4wk74ff" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_constant" ADD CONSTRAINT "__math_constant_fk_id_tag_kind_qti_math_constant_33_iaucqlqiqv" FOREIGN KEY ("id", "__tag_kind_qti_math_constant_33aeaomua7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_operator" ADD CONSTRAINT "__math_operator_fk_id_3qu4p4udeg" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_operator" ADD CONSTRAINT "__math_operator_fk_id_tag_kind_qti_math_operator_5_q_3mbmdzquip" FOREIGN KEY ("id", "__tag_kind_qti_math_operator_5q3gpyxbee") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."max" ADD CONSTRAINT "__max_fk_id_g5zf7brjq6" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."max" ADD CONSTRAINT "__max_fk_id_tag_kind_qti_max_k_2_fgxlddd_5_kfmzhfjbif" FOREIGN KEY ("id", "__tag_kind_qti_max_k2fgxlddd5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."member" ADD CONSTRAINT "__member_fk_id_oojwslvahd" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."member" ADD CONSTRAINT "__member_fk_id_tag_kind_qti_member_wlwyybwmab_tuy6q4dbzl" FOREIGN KEY ("id", "__tag_kind_qti_member_wlwyybwmab") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."min" ADD CONSTRAINT "__min_fk_id_vetagsffvs" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."min" ADD CONSTRAINT "__min_fk_id_tag_kind_qti_min_5_k_4_uqv_4_ded_m7743yrr2x" FOREIGN KEY ("id", "__tag_kind_qti_min_5k4uqv4ded") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."multiple" ADD CONSTRAINT "__multiple_fk_id_cxclpn5p2n" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."multiple" ADD CONSTRAINT "__multiple_fk_id_tag_kind_qti_multiple_blwsugoch_2_ph7jucqnpt" FOREIGN KEY ("id", "__tag_kind_qti_multiple_blwsugoch2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."not" ADD CONSTRAINT "__not_fk_id_cmsiylmljp" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."not" ADD CONSTRAINT "__not_fk_id_tag_kind_qti_not_ctn_3_qliz_6_a_sebxf5zr6o" FOREIGN KEY ("id", "__tag_kind_qti_not_ctn3qliz6a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."null" ADD CONSTRAINT "__null_fk_id_ldxmdadr3e" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."null" ADD CONSTRAINT "__null_fk_id_tag_kind_qti_null_sjdltnabyd_7fti64b735" FOREIGN KEY ("id", "__tag_kind_qti_null_sjdltnabyd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_correct" ADD CONSTRAINT "__number_correct_fk_id_iarcqhrcze" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_correct" ADD CONSTRAINT "__number_correct_fk_id_tag_kind_qti_number_correct_x6ksglx5lo" FOREIGN KEY ("id", "__tag_kind_qti_number_correct_vgudlj33aa") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_incorrect" ADD CONSTRAINT "__number_incorrect_fk_id_j24hcc54zj" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_incorrect" ADD CONSTRAINT "__number_incorrect_fk_id_tag_kind_qti_number_ttjziwrnxm" FOREIGN KEY ("id", "__tag_kind_qti_number_incorrect_fobw5d7gbp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_presented" ADD CONSTRAINT "__number_presented_fk_id_a5x2tt6j5b" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_presented" ADD CONSTRAINT "__number_presented_fk_id_tag_kind_qti_number_onbvhyq2bq" FOREIGN KEY ("id", "__tag_kind_qti_number_presented_c4kw7h2vss") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_responded" ADD CONSTRAINT "__number_responded_fk_id_gfpoethceq" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_responded" ADD CONSTRAINT "__number_responded_fk_id_tag_kind_qti_number_oefmiaomde" FOREIGN KEY ("id", "__tag_kind_qti_number_responded_rej7fdtd2o") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_selected" ADD CONSTRAINT "__number_selected_fk_id_7c23e26pls" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_selected" ADD CONSTRAINT "__number_selected_fk_id_tag_kind_qti_number_selected_mungmro26d" FOREIGN KEY ("id", "__tag_kind_qti_number_selected_y5wyghaa7n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."or" ADD CONSTRAINT "__or_fk_id_tscrqmza5p" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."or" ADD CONSTRAINT "__or_fk_id_tag_kind_qti_or_2_bm_3_cp_5_uoy_b3a2z75he4" FOREIGN KEY ("id", "__tag_kind_qti_or_2bm3cp5uoy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordered" ADD CONSTRAINT "__ordered_fk_id_eewdmtzqwd" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordered" ADD CONSTRAINT "__ordered_fk_id_tag_kind_qti_ordered_wujbvdvnaz_djxt4mgw26" FOREIGN KEY ("id", "__tag_kind_qti_ordered_wujbvdvnaz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_condition_arm" ADD CONSTRAINT "__outcome_condition_arm_fk_id_xhrncakxwx" FOREIGN KEY ("id") REFERENCES "qti"."outcome_if_arm" ("condition") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_condition_arm" ADD CONSTRAINT "__outcome_condition_arm_fk_id_tag_kind_qti_outcome_xgomswhii7" FOREIGN KEY ("id", "__tag_kind_qti_outcome_condition_3td227dwcr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_arm" ADD CONSTRAINT "__outcome_else_arm_fk_id_tag_kind_qti_outcome_else_7_yutniokik2" FOREIGN KEY ("id", "__tag_kind_qti_outcome_else_7klt3q36ge") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_arm" ADD CONSTRAINT "__outcome_else_arm_fk_id_condition_thr2iy3hbr" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_if_arm" ADD CONSTRAINT "__outcome_else_if_arm_fk_id_4flu66ksyg" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_if_arm" ADD CONSTRAINT "__outcome_else_if_arm_fk_id_tag_kind_qti_outcome_a3sb3aax6w" FOREIGN KEY ("id", "__tag_kind_qti_outcome_else_if_dfe5qckhzt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_condition_f4ncbmgu25" FOREIGN KEY ("condition") REFERENCES "qti"."outcome_condition_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_id_4xnfondegy" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_id_tag_kind_qti_outcome_if_unq_7_qjmeehzmtj" FOREIGN KEY ("id", "__tag_kind_qti_outcome_if_unq7efyvy3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_id_condition_loiz5l7s2v" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_maximum_arm" ADD CONSTRAINT "__outcome_maximum_arm_fk_id_vwh4v63gob" FOREIGN KEY ("id") REFERENCES "qti"."outcome_min_max" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_maximum_arm" ADD CONSTRAINT "__outcome_maximum_arm_fk_id_tag_kind_qti_outcome_wvicjkszpx" FOREIGN KEY ("id", "__tag_kind_qti_outcome_maximum_xfo2bco2fs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_min_max" ADD CONSTRAINT "__outcome_min_max_fk_id_g6ayyix4px" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_min_max" ADD CONSTRAINT "__outcome_min_max_fk_id_kind_z432ftoffo" FOREIGN KEY ("id", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_minimum_arm" ADD CONSTRAINT "__outcome_minimum_arm_fk_id_27krwgiz2y" FOREIGN KEY ("id") REFERENCES "qti"."outcome_min_max" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_minimum_arm" ADD CONSTRAINT "__outcome_minimum_arm_fk_id_tag_kind_qti_outcome_5fjyioefaz" FOREIGN KEY ("id", "__tag_kind_qti_outcome_minimum_tdjdlbn6dy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_processing" ADD CONSTRAINT "__outcome_processing_fk_id_tag_kind_qti_outcome_27vrfx42fi" FOREIGN KEY ("id", "__tag_kind_qti_outcome_processing_fhxwpg6h24") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_processing_fragment" ADD CONSTRAINT "__outcome_processing_fragment_fk_id_tag_kind_qti_j5zojarox7" FOREIGN KEY ("id", "__tag_kind_qti_outcome_processing_fragment_unfq3d4o7g") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pattern_match" ADD CONSTRAINT "__pattern_match_fk_id_paggty4v4t" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pattern_match" ADD CONSTRAINT "__pattern_match_fk_id_tag_kind_qti_pattern_match_fvc_tgqazw72z4" FOREIGN KEY ("id", "__tag_kind_qti_pattern_match_fvc7hdtz3d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."power" ADD CONSTRAINT "__power_fk_id_2dz5cm56km" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."power" ADD CONSTRAINT "__power_fk_id_tag_kind_qti_power_kpx_2_em_75_ca_4ojebbslvf" FOREIGN KEY ("id", "__tag_kind_qti_power_kpx2em75ca") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."product" ADD CONSTRAINT "__product_fk_id_jjwyrz7j4o" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."product" ADD CONSTRAINT "__product_fk_id_tag_kind_qti_product_hojc_6_apo_2_s_yloixsjp5u" FOREIGN KEY ("id", "__tag_kind_qti_product_hojc6apo2s") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random" ADD CONSTRAINT "__random_fk_id_y6bzpmjkno" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random" ADD CONSTRAINT "__random_fk_id_tag_kind_qti_random_erxmfosfti_z3obv6o7r4" FOREIGN KEY ("id", "__tag_kind_qti_random_erxmfosfti") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_float" ADD CONSTRAINT "__random_float_fk_id_u2zitqvmnl" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_float" ADD CONSTRAINT "__random_float_fk_id_tag_kind_qti_random_float_y_4_p_5gxzghh6jx" FOREIGN KEY ("id", "__tag_kind_qti_random_float_y4p3lnm6a4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_float_min" ADD CONSTRAINT "__random_float_min_fk_node_4obkovkwuc" FOREIGN KEY ("node") REFERENCES "qti"."random_float" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer" ADD CONSTRAINT "__random_integer_fk_id_puarvo7zql" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer" ADD CONSTRAINT "__random_integer_fk_id_tag_kind_qti_random_integer_hyj5nu26iy" FOREIGN KEY ("id", "__tag_kind_qti_random_integer_rbwxdayyl2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer_min" ADD CONSTRAINT "__random_integer_min_fk_node_p4wuno4r2v" FOREIGN KEY ("node") REFERENCES "qti"."random_integer" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer_step" ADD CONSTRAINT "__random_integer_step_fk_node_varwgz7e24" FOREIGN KEY ("node") REFERENCES "qti"."random_integer" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."repeat" ADD CONSTRAINT "__repeat_fk_id_chy7zjngpv" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."repeat" ADD CONSTRAINT "__repeat_fk_id_tag_kind_qti_repeat_bpcaeiu_7_tm_paitvwlydr" FOREIGN KEY ("id", "__tag_kind_qti_repeat_bpcaeiu7tm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_condition_arm" ADD CONSTRAINT "__response_condition_arm_fk_id_cqennxujn3" FOREIGN KEY ("id") REFERENCES "qti"."response_if_arm" ("condition") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_condition_arm" ADD CONSTRAINT "__response_condition_arm_fk_id_tag_kind_qti_response_arfysdid6d" FOREIGN KEY ("id", "__tag_kind_qti_response_condition_gplnrgu2ol") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_arm" ADD CONSTRAINT "__response_else_arm_fk_id_tag_kind_qti_response_else_pw5zdqtyat" FOREIGN KEY ("id", "__tag_kind_qti_response_else_hxjbbfwd4n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_arm" ADD CONSTRAINT "__response_else_arm_fk_id_condition_6rv4ogvmus" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_if_arm" ADD CONSTRAINT "__response_else_if_arm_fk_id_x4wstscymw" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_if_arm" ADD CONSTRAINT "__response_else_if_arm_fk_id_tag_kind_qti_response_7xqxxbwsg3" FOREIGN KEY ("id", "__tag_kind_qti_response_else_if_z5u6rg462x") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_condition_qwwjbbttwd" FOREIGN KEY ("condition") REFERENCES "qti"."response_condition_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_id_dwfoomqo67" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_id_tag_kind_qti_response_if_vi_nkmvms4df5" FOREIGN KEY ("id", "__tag_kind_qti_response_if_vi7uxgsitt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_id_condition_zwk5nyeyvf" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_fragment" ADD CONSTRAINT "__response_processing_fragment_fk_id_tag_kind_qti_iz4amgqjhf" FOREIGN KEY ("id", "__tag_kind_qti_response_processing_fragment_ftcfl3v7ub") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round" ADD CONSTRAINT "__round_fk_id_f3qoxihsbv" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round" ADD CONSTRAINT "__round_fk_id_tag_kind_qti_round_5_eosswhdnh_slr33gqyno" FOREIGN KEY ("id", "__tag_kind_qti_round_5eosswhdnh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round_to" ADD CONSTRAINT "__round_to_fk_id_6bdnmlefbu" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round_to" ADD CONSTRAINT "__round_to_fk_id_tag_kind_qti_round_to_qrylojzgc_7_nrzxzwtn6v" FOREIGN KEY ("id", "__tag_kind_qti_round_to_qrylojzgc7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rule_operand" ADD CONSTRAINT "__rule_operand_fk_child_7esccijwzc" FOREIGN KEY ("child") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rule_operand" ADD CONSTRAINT "__rule_operand_fk_child_rule_position_5w6a3el2wz" FOREIGN KEY ("child", "rule", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rule_operand" ADD CONSTRAINT "__rule_operand_fk_rule_rule_kind_4l7dbb3x5o" FOREIGN KEY ("rule", "rule_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_correct_response" ADD CONSTRAINT "__set_correct_response_fk_id_lgg56iessp" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_correct_response" ADD CONSTRAINT "__set_correct_response_fk_id_lplfp6sayy" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_correct_response" ADD CONSTRAINT "__set_correct_response_fk_id_tag_kind_qti_set_ol5qug2p33" FOREIGN KEY ("id", "__tag_kind_qti_set_correct_response_p4ucnvbenj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_default_value" ADD CONSTRAINT "__set_default_value_fk_id_olvhaapdis" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_default_value" ADD CONSTRAINT "__set_default_value_fk_id_asetqp7zu7" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_default_value" ADD CONSTRAINT "__set_default_value_fk_id_tag_kind_qti_set_default_hjxuscwbtz" FOREIGN KEY ("id", "__tag_kind_qti_set_default_value_rj2hosazj5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_outcome_value" ADD CONSTRAINT "__set_outcome_value_fk_id_pfrhyv46y7" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_outcome_value" ADD CONSTRAINT "__set_outcome_value_fk_id_bumawry4vz" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_outcome_value" ADD CONSTRAINT "__set_outcome_value_fk_id_tag_kind_qti_set_outcome_fdk4ivb536" FOREIGN KEY ("id", "__tag_kind_qti_set_outcome_value_h6wjpdpvko") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_template_value" ADD CONSTRAINT "__set_template_value_fk_id_tjdylovby7" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_template_value" ADD CONSTRAINT "__set_template_value_fk_id_tm6uzya2mc" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_template_value" ADD CONSTRAINT "__set_template_value_fk_id_tag_kind_qti_set_template_6gjtgeelfk" FOREIGN KEY ("id", "__tag_kind_qti_set_template_value_nb6cflrq6l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stats_operator" ADD CONSTRAINT "__stats_operator_fk_id_y5rf4zqbhe" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stats_operator" ADD CONSTRAINT "__stats_operator_fk_id_tag_kind_qti_stats_operator_x_jzxwnal226" FOREIGN KEY ("id", "__tag_kind_qti_stats_operator_x5autjgscg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."string_match" ADD CONSTRAINT "__string_match_fk_id_jq2ajvyvkw" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."string_match" ADD CONSTRAINT "__string_match_fk_id_tag_kind_qti_string_match_ymwg_vcyzam6xca" FOREIGN KEY ("id", "__tag_kind_qti_string_match_ymwg654alj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."substring" ADD CONSTRAINT "__substring_fk_id_ivk2bfevn6" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."substring" ADD CONSTRAINT "__substring_fk_id_tag_kind_qti_substring_j_2_vyby_2_rgl5brzppm" FOREIGN KEY ("id", "__tag_kind_qti_substring_j2vyby2o5h") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."subtract" ADD CONSTRAINT "__subtract_fk_id_nx6wnhe4si" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."subtract" ADD CONSTRAINT "__subtract_fk_id_tag_kind_qti_subtract_fn_3_f_5_ctuvkqaktb" FOREIGN KEY ("id", "__tag_kind_qti_subtract_fn3f5wibuj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sum" ADD CONSTRAINT "__sum_fk_id_rx5nfmiks4" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sum" ADD CONSTRAINT "__sum_fk_id_tag_kind_qti_sum_2_bm_2_f_65_vor_oavvrxntuo" FOREIGN KEY ("id", "__tag_kind_qti_sum_2bm2f65vor") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_condition_arm" ADD CONSTRAINT "__template_condition_arm_fk_id_z5j4vsryhz" FOREIGN KEY ("id") REFERENCES "qti"."template_if_arm" ("condition") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_condition_arm" ADD CONSTRAINT "__template_condition_arm_fk_id_tag_kind_qti_template_arzqxp5ipa" FOREIGN KEY ("id", "__tag_kind_qti_template_condition_5iedsmf35c") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_constraint" ADD CONSTRAINT "__template_constraint_fk_id_r6c7e632cr" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_constraint" ADD CONSTRAINT "__template_constraint_fk_id_tag_kind_qti_template_tjfrdq7dlv" FOREIGN KEY ("id", "__tag_kind_qti_template_constraint_nwjpfefvxc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_arm" ADD CONSTRAINT "__template_else_arm_fk_id_tag_kind_qti_template_else_jakvytlxkn" FOREIGN KEY ("id", "__tag_kind_qti_template_else_td6wimhp7s") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_arm" ADD CONSTRAINT "__template_else_arm_fk_id_condition_luyzxske2m" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_if_arm" ADD CONSTRAINT "__template_else_if_arm_fk_id_hmxk5riuwv" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_if_arm" ADD CONSTRAINT "__template_else_if_arm_fk_id_tag_kind_qti_template_r2fxuxzf72" FOREIGN KEY ("id", "__tag_kind_qti_template_else_if_xkgqxjlgvf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_condition_4y7sbcvmtj" FOREIGN KEY ("condition") REFERENCES "qti"."template_condition_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_id_gmp35rspej" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_id_tag_kind_qti_template_if_kdp_cqqvjgrgzg" FOREIGN KEY ("id", "__tag_kind_qti_template_if_kdp2hjyxni") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_id_condition_q36sv5r4ug" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_processing" ADD CONSTRAINT "__template_processing_fk_id_tag_kind_qti_template_ugnev7dg4d" FOREIGN KEY ("id", "__tag_kind_qti_template_processing_julsyuopii") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_processing" ADD CONSTRAINT "__template_processing_fk_id_item_7fu36bhszp" FOREIGN KEY ("id", "item") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_processing" ADD CONSTRAINT "__template_processing_fk_item_b6ae2itijo" FOREIGN KEY ("item") REFERENCES "qti"."assessment_item" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_variables" ADD CONSTRAINT "__test_variables_fk_id_e6yrgko5ch" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_variables" ADD CONSTRAINT "__test_variables_fk_id_tag_kind_qti_test_variables_5pron4hsut" FOREIGN KEY ("id", "__tag_kind_qti_test_variables_ssteaad3nd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_variables_base_type" ADD CONSTRAINT "__test_variables_base_type_fk_node_viobp7iox3" FOREIGN KEY ("node") REFERENCES "qti"."test_variables" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."truncate" ADD CONSTRAINT "__truncate_fk_id_7pvxp2mxsf" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."truncate" ADD CONSTRAINT "__truncate_fk_id_tag_kind_qti_truncate_vkai_3_xtk_23_ain5obud4q" FOREIGN KEY ("id", "__tag_kind_qti_truncate_vkai3xtk23") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable" ADD CONSTRAINT "__variable_fk_id_4qrpe3j6x3" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable" ADD CONSTRAINT "__variable_fk_id_lva6pkmnaw" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable" ADD CONSTRAINT "__variable_fk_id_tag_kind_qti_variable_obgp_52_jplg_fefvglcgp2" FOREIGN KEY ("id", "__tag_kind_qti_variable_obgp52jplg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_weight_identifier" ADD CONSTRAINT "__variable_weight_identifier_fk_node_uxqmpfxmjf" FOREIGN KEY ("node") REFERENCES "qti"."variable" ("id");

ALTER TABLE "qti"."variable_weight_identifier" ADD CONSTRAINT "__variable_weight_identifier_fk_node_root_kind_xvoekdwiqu" FOREIGN KEY ("node", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."x_include" ADD CONSTRAINT "__x_include_fk_id_tag_kind_xi_include_tnsd_6_wpc_7_o_o3evvlk3on" FOREIGN KEY ("id", "__tag_kind_xi_include_tnsd6wpc7o") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."x_include_accept" ADD CONSTRAINT "__x_include_accept_fk_node_hlrbyjbj4b" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_accept_language" ADD CONSTRAINT "__x_include_accept_language_fk_node_22obtslbu6" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_encoding" ADD CONSTRAINT "__x_include_encoding_fk_node_wr4gpsamg5" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_href" ADD CONSTRAINT "__x_include_href_fk_node_ria6nowp77" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_parse" ADD CONSTRAINT "__x_include_parse_fk_node_boyx4sfcrs" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_xpointer" ADD CONSTRAINT "__x_include_xpointer_fk_node_2ugojdzhfl" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."and"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."any_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."container_size"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."contains"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."correct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."custom_operator"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."custom_operator_class"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."custom_operator_definition"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_include_lower_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_include_upper_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_rounding_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_substring"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_tolerance_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."default"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."delete"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."divide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."duration_gte"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."duration_lt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal_rounded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal_tolerance"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."exit_response"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."exit_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."exit_test"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_exclude_category"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_include_category"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_section_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_weight_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."fallback"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."field_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gcd"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gte"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."index"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."inside"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."integer_divide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."integer_modulus"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."integer_to_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."is_null"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lcm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lookup_outcome_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lte"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_response"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_response_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."math_constant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."math_operator"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."member"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."multiple"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."not"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."null"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_correct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_incorrect"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_presented"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_responded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_selected"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."or"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ordered"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_condition_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_else_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_else_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_maximum_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_min_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_minimum_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_processing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_processing_fragment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."pattern_match"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."power"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."product"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_float_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_integer_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_integer_step"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."repeat"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_condition_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_else_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_else_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_fragment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."round"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."round_to"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rule_operand"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_correct_response"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_outcome_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_template_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."stats_operator"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."string_match"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."substring"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."subtract"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."sum"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_condition_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_constraint"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_else_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_else_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_processing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_variables"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_variables_base_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."truncate"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variable_weight_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_accept"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_accept_language"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_encoding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_parse"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_xpointer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."admission" ("child", "parent", "version") AS
SELECT "r1"."child", "r1"."parent", "r1"."version"
FROM "qti"."admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."admission" TO "qti__author";

CREATE VIEW "qti__author"."and" ("id") AS
SELECT "r1"."id"
FROM "qti"."and" AS "r1";

GRANT SELECT ON TABLE "qti__author"."and" TO "qti__author";

CREATE VIEW "qti__author"."any_n" ("id", "max", "min") AS
SELECT "r1"."id", "r1"."max", "r1"."min"
FROM "qti"."any_n" AS "r1";

GRANT SELECT ON TABLE "qti__author"."any_n" TO "qti__author";

CREATE VIEW "qti__author"."assessment_item" ("adaptive", "id", "time_dependent") AS
SELECT "r1"."adaptive", "r1"."id", "r1"."time_dependent"
FROM "qti"."assessment_item" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item" TO "qti__author";

CREATE VIEW "qti__author"."attribute_lexical" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_lexical" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_lexical" TO "qti__author";

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."container_size" ("id") AS
SELECT "r1"."id"
FROM "qti"."container_size" AS "r1";

GRANT SELECT ON TABLE "qti__author"."container_size" TO "qti__author";

CREATE VIEW "qti__author"."contains" ("id") AS
SELECT "r1"."id"
FROM "qti"."contains" AS "r1";

GRANT SELECT ON TABLE "qti__author"."contains" TO "qti__author";

CREATE VIEW "qti__author"."correct" ("id") AS
SELECT "r1"."id"
FROM "qti"."correct" AS "r1";

GRANT SELECT ON TABLE "qti__author"."correct" TO "qti__author";

CREATE VIEW "qti__author"."custom_operator" ("id") AS
SELECT "r1"."id"
FROM "qti"."custom_operator" AS "r1";

GRANT SELECT ON TABLE "qti__author"."custom_operator" TO "qti__author";

CREATE VIEW "qti__author"."custom_operator_class" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."custom_operator_class" AS "r1";

GRANT SELECT ON TABLE "qti__author"."custom_operator_class" TO "qti__author";

CREATE VIEW "qti__author"."custom_operator_definition" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."custom_operator_definition" AS "r1";

GRANT SELECT ON TABLE "qti__author"."custom_operator_definition" TO "qti__author";

CREATE VIEW "qti__author"."declared_include_lower_bound" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_include_lower_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_include_lower_bound" TO "qti__author";

CREATE VIEW "qti__author"."declared_include_upper_bound" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_include_upper_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_include_upper_bound" TO "qti__author";

CREATE VIEW "qti__author"."declared_rounding_mode" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_rounding_mode" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_rounding_mode" TO "qti__author";

CREATE VIEW "qti__author"."declared_substring" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_substring" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_substring" TO "qti__author";

CREATE VIEW "qti__author"."declared_tolerance_mode" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_tolerance_mode" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_tolerance_mode" TO "qti__author";

CREATE VIEW "qti__author"."default" ("id") AS
SELECT "r1"."id"
FROM "qti"."default" AS "r1";

GRANT SELECT ON TABLE "qti__author"."default" TO "qti__author";

CREATE VIEW "qti__author"."delete" ("id") AS
SELECT "r1"."id"
FROM "qti"."delete" AS "r1";

GRANT SELECT ON TABLE "qti__author"."delete" TO "qti__author";

CREATE VIEW "qti__author"."divide" ("id") AS
SELECT "r1"."id"
FROM "qti"."divide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."divide" TO "qti__author";

CREATE VIEW "qti__author"."duration_gte" ("id") AS
SELECT "r1"."id"
FROM "qti"."duration_gte" AS "r1";

GRANT SELECT ON TABLE "qti__author"."duration_gte" TO "qti__author";

CREATE VIEW "qti__author"."duration_lt" ("id") AS
SELECT "r1"."id"
FROM "qti"."duration_lt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."duration_lt" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."equal" ("id", "include_lower_bound", "include_upper_bound", "tolerance_mode") AS
SELECT "r1"."id", "r1"."include_lower_bound", "r1"."include_upper_bound", "r1"."tolerance_mode"
FROM "qti"."equal" AS "r1";

GRANT SELECT ON TABLE "qti__author"."equal" TO "qti__author";

CREATE VIEW "qti__author"."equal_rounded" ("figures", "figures_kind", "figures_value", "id", "rounding_mode") AS
SELECT "r1"."figures", "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode"
FROM "qti"."equal_rounded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."equal_rounded" TO "qti__author";

CREATE VIEW "qti__author"."equal_tolerance" ("node", "tolerance_mode", "value") AS
SELECT "r1"."node", "r1"."tolerance_mode", "r1"."value"
FROM "qti"."equal_tolerance" AS "r1";

GRANT SELECT ON TABLE "qti__author"."equal_tolerance" TO "qti__author";

CREATE VIEW "qti__author"."exit_response" ("id") AS
SELECT "r1"."id"
FROM "qti"."exit_response" AS "r1";

GRANT SELECT ON TABLE "qti__author"."exit_response" TO "qti__author";

CREATE VIEW "qti__author"."exit_template" ("id") AS
SELECT "r1"."id"
FROM "qti"."exit_template" AS "r1";

GRANT SELECT ON TABLE "qti__author"."exit_template" TO "qti__author";

CREATE VIEW "qti__author"."exit_test" ("id") AS
SELECT "r1"."id"
FROM "qti"."exit_test" AS "r1";

GRANT SELECT ON TABLE "qti__author"."exit_test" TO "qti__author";

CREATE VIEW "qti__author"."expression" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."expression_exclude_category" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."expression_exclude_category" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_exclude_category" TO "qti__author";

CREATE VIEW "qti__author"."expression_include_category" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."expression_include_category" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_include_category" TO "qti__author";

CREATE VIEW "qti__author"."expression_section_identifier" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."expression_section_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_section_identifier" TO "qti__author";

CREATE VIEW "qti__author"."expression_weight_identifier" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."expression_weight_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_weight_identifier" TO "qti__author";

CREATE VIEW "qti__author"."fallback" ("id") AS
SELECT "r1"."id"
FROM "qti"."fallback" AS "r1";

GRANT SELECT ON TABLE "qti__author"."fallback" TO "qti__author";

CREATE VIEW "qti__author"."field_value" ("field_identifier", "id") AS
SELECT "r1"."field_identifier", "r1"."id"
FROM "qti"."field_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."field_value" TO "qti__author";

CREATE VIEW "qti__author"."gcd" ("id") AS
SELECT "r1"."id"
FROM "qti"."gcd" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gcd" TO "qti__author";

CREATE VIEW "qti__author"."gt" ("id") AS
SELECT "r1"."id"
FROM "qti"."gt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gt" TO "qti__author";

CREATE VIEW "qti__author"."gte" ("id") AS
SELECT "r1"."id"
FROM "qti"."gte" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gte" TO "qti__author";

CREATE VIEW "qti__author"."index" ("id", "n", "n_kind", "n_value") AS
SELECT "r1"."id", "r1"."n", "r1"."n_kind", "r1"."n_value"
FROM "qti"."index" AS "r1";

GRANT SELECT ON TABLE "qti__author"."index" TO "qti__author";

CREATE VIEW "qti__author"."inside" ("coords", "id", "shape") AS
SELECT "r1"."coords", "r1"."id", "r1"."shape"
FROM "qti"."inside" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inside" TO "qti__author";

CREATE VIEW "qti__author"."integer_divide" ("id") AS
SELECT "r1"."id"
FROM "qti"."integer_divide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."integer_divide" TO "qti__author";

CREATE VIEW "qti__author"."integer_modulus" ("id") AS
SELECT "r1"."id"
FROM "qti"."integer_modulus" AS "r1";

GRANT SELECT ON TABLE "qti__author"."integer_modulus" TO "qti__author";

CREATE VIEW "qti__author"."integer_to_float" ("id") AS
SELECT "r1"."id"
FROM "qti"."integer_to_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."integer_to_float" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."is_null" ("id") AS
SELECT "r1"."id"
FROM "qti"."is_null" AS "r1";

GRANT SELECT ON TABLE "qti__author"."is_null" TO "qti__author";

CREATE VIEW "qti__author"."lcm" ("id") AS
SELECT "r1"."id"
FROM "qti"."lcm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lcm" TO "qti__author";

CREATE VIEW "qti__author"."literal" ("base_type", "id") AS
SELECT "r1"."base_type", "r1"."id"
FROM "qti"."literal" AS "r1";

GRANT SELECT ON TABLE "qti__author"."literal" TO "qti__author";

CREATE VIEW "qti__author"."lookup_outcome_value" ("id") AS
SELECT "r1"."id"
FROM "qti"."lookup_outcome_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lookup_outcome_value" TO "qti__author";

CREATE VIEW "qti__author"."lt" ("id") AS
SELECT "r1"."id"
FROM "qti"."lt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lt" TO "qti__author";

CREATE VIEW "qti__author"."lte" ("id") AS
SELECT "r1"."id"
FROM "qti"."lte" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lte" TO "qti__author";

CREATE VIEW "qti__author"."map_response" ("id") AS
SELECT "r1"."id"
FROM "qti"."map_response" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_response" TO "qti__author";

CREATE VIEW "qti__author"."map_response_point" ("id") AS
SELECT "r1"."id"
FROM "qti"."map_response_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_response_point" TO "qti__author";

CREATE VIEW "qti__author"."match" ("id") AS
SELECT "r1"."id"
FROM "qti"."match" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match" TO "qti__author";

CREATE VIEW "qti__author"."math_constant" ("id", "name") AS
SELECT "r1"."id", "r1"."name"
FROM "qti"."math_constant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."math_constant" TO "qti__author";

CREATE VIEW "qti__author"."math_operator" ("id", "name") AS
SELECT "r1"."id", "r1"."name"
FROM "qti"."math_operator" AS "r1";

GRANT SELECT ON TABLE "qti__author"."math_operator" TO "qti__author";

CREATE VIEW "qti__author"."max" ("id") AS
SELECT "r1"."id"
FROM "qti"."max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."max" TO "qti__author";

CREATE VIEW "qti__author"."member" ("id") AS
SELECT "r1"."id"
FROM "qti"."member" AS "r1";

GRANT SELECT ON TABLE "qti__author"."member" TO "qti__author";

CREATE VIEW "qti__author"."min" ("id") AS
SELECT "r1"."id"
FROM "qti"."min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."min" TO "qti__author";

CREATE VIEW "qti__author"."multiple" ("id") AS
SELECT "r1"."id"
FROM "qti"."multiple" AS "r1";

GRANT SELECT ON TABLE "qti__author"."multiple" TO "qti__author";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."not" ("id") AS
SELECT "r1"."id"
FROM "qti"."not" AS "r1";

GRANT SELECT ON TABLE "qti__author"."not" TO "qti__author";

CREATE VIEW "qti__author"."null" ("id") AS
SELECT "r1"."id"
FROM "qti"."null" AS "r1";

GRANT SELECT ON TABLE "qti__author"."null" TO "qti__author";

CREATE VIEW "qti__author"."number_correct" ("id") AS
SELECT "r1"."id"
FROM "qti"."number_correct" AS "r1";

GRANT SELECT ON TABLE "qti__author"."number_correct" TO "qti__author";

CREATE VIEW "qti__author"."number_incorrect" ("id") AS
SELECT "r1"."id"
FROM "qti"."number_incorrect" AS "r1";

GRANT SELECT ON TABLE "qti__author"."number_incorrect" TO "qti__author";

CREATE VIEW "qti__author"."number_presented" ("id") AS
SELECT "r1"."id"
FROM "qti"."number_presented" AS "r1";

GRANT SELECT ON TABLE "qti__author"."number_presented" TO "qti__author";

CREATE VIEW "qti__author"."number_responded" ("id") AS
SELECT "r1"."id"
FROM "qti"."number_responded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."number_responded" TO "qti__author";

CREATE VIEW "qti__author"."number_selected" ("id") AS
SELECT "r1"."id"
FROM "qti"."number_selected" AS "r1";

GRANT SELECT ON TABLE "qti__author"."number_selected" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity" ("kind", "min") AS
SELECT "r1"."kind", "r1"."min"
FROM "qti"."operator_arity" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_max" ("kind", "max") AS
SELECT "r1"."kind", "r1"."max"
FROM "qti"."operator_arity_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_max" TO "qti__author";

CREATE VIEW "qti__author"."or" ("id") AS
SELECT "r1"."id"
FROM "qti"."or" AS "r1";

GRANT SELECT ON TABLE "qti__author"."or" TO "qti__author";

CREATE VIEW "qti__author"."ordered" ("id") AS
SELECT "r1"."id"
FROM "qti"."ordered" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ordered" TO "qti__author";

CREATE VIEW "qti__author"."outcome_condition_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_condition_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_condition_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_else_arm" ("condition", "id") AS
SELECT "r1"."condition", "r1"."id"
FROM "qti"."outcome_else_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_else_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_else_if_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_else_if_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_else_if_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_if_arm" ("condition", "id") AS
SELECT "r1"."condition", "r1"."id"
FROM "qti"."outcome_if_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_if_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_maximum_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_maximum_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_maximum_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_min_max" ("id", "kind", "outcome_identifier") AS
SELECT "r1"."id", "r1"."kind", "r1"."outcome_identifier"
FROM "qti"."outcome_min_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_min_max" TO "qti__author";

CREATE VIEW "qti__author"."outcome_minimum_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_minimum_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_minimum_arm" TO "qti__author";

CREATE VIEW "qti__author"."outcome_processing" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_processing" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_processing" TO "qti__author";

CREATE VIEW "qti__author"."outcome_processing_fragment" ("id") AS
SELECT "r1"."id"
FROM "qti"."outcome_processing_fragment" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_processing_fragment" TO "qti__author";

CREATE VIEW "qti__author"."pattern_match" ("id", "pattern") AS
SELECT "r1"."id", "r1"."pattern"
FROM "qti"."pattern_match" AS "r1";

GRANT SELECT ON TABLE "qti__author"."pattern_match" TO "qti__author";

CREATE VIEW "qti__author"."power" ("id") AS
SELECT "r1"."id"
FROM "qti"."power" AS "r1";

GRANT SELECT ON TABLE "qti__author"."power" TO "qti__author";

CREATE VIEW "qti__author"."product" ("id") AS
SELECT "r1"."id"
FROM "qti"."product" AS "r1";

GRANT SELECT ON TABLE "qti__author"."product" TO "qti__author";

CREATE VIEW "qti__author"."random" ("id") AS
SELECT "r1"."id"
FROM "qti"."random" AS "r1";

GRANT SELECT ON TABLE "qti__author"."random" TO "qti__author";

CREATE VIEW "qti__author"."random_float" ("id", "max") AS
SELECT "r1"."id", "r1"."max"
FROM "qti"."random_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."random_float" TO "qti__author";

CREATE VIEW "qti__author"."random_float_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."random_float_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."random_float_min" TO "qti__author";

CREATE VIEW "qti__author"."random_integer" ("id", "max") AS
SELECT "r1"."id", "r1"."max"
FROM "qti"."random_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."random_integer" TO "qti__author";

CREATE VIEW "qti__author"."random_integer_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."random_integer_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."random_integer_min" TO "qti__author";

CREATE VIEW "qti__author"."random_integer_step" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."random_integer_step" AS "r1";

GRANT SELECT ON TABLE "qti__author"."random_integer_step" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."repeat" ("id", "number_repeats", "number_repeats_kind", "number_repeats_value") AS
SELECT "r1"."id", "r1"."number_repeats", "r1"."number_repeats_kind", "r1"."number_repeats_value"
FROM "qti"."repeat" AS "r1";

GRANT SELECT ON TABLE "qti__author"."repeat" TO "qti__author";

CREATE VIEW "qti__author"."response_condition_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."response_condition_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."response_condition_arm" TO "qti__author";

CREATE VIEW "qti__author"."response_else_arm" ("condition", "id") AS
SELECT "r1"."condition", "r1"."id"
FROM "qti"."response_else_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."response_else_arm" TO "qti__author";

CREATE VIEW "qti__author"."response_else_if_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."response_else_if_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."response_else_if_arm" TO "qti__author";

CREATE VIEW "qti__author"."response_if_arm" ("condition", "id") AS
SELECT "r1"."condition", "r1"."id"
FROM "qti"."response_if_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."response_if_arm" TO "qti__author";

CREATE VIEW "qti__author"."response_processing_fragment" ("id") AS
SELECT "r1"."id"
FROM "qti"."response_processing_fragment" AS "r1";

GRANT SELECT ON TABLE "qti__author"."response_processing_fragment" TO "qti__author";

CREATE VIEW "qti__author"."round" ("id") AS
SELECT "r1"."id"
FROM "qti"."round" AS "r1";

GRANT SELECT ON TABLE "qti__author"."round" TO "qti__author";

CREATE VIEW "qti__author"."round_to" ("figures", "figures_kind", "figures_value", "id", "rounding_mode") AS
SELECT "r1"."figures", "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode"
FROM "qti"."round_to" AS "r1";

GRANT SELECT ON TABLE "qti__author"."round_to" TO "qti__author";

CREATE VIEW "qti__author"."rule_operand" ("child", "position", "rule", "rule_kind") AS
SELECT "r1"."child", "r1"."position", "r1"."rule", "r1"."rule_kind"
FROM "qti"."rule_operand" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rule_operand" TO "qti__author";

CREATE VIEW "qti__author"."set_correct_response" ("id") AS
SELECT "r1"."id"
FROM "qti"."set_correct_response" AS "r1";

GRANT SELECT ON TABLE "qti__author"."set_correct_response" TO "qti__author";

CREATE VIEW "qti__author"."set_default_value" ("id") AS
SELECT "r1"."id"
FROM "qti"."set_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."set_default_value" TO "qti__author";

CREATE VIEW "qti__author"."set_outcome_value" ("id") AS
SELECT "r1"."id"
FROM "qti"."set_outcome_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."set_outcome_value" TO "qti__author";

CREATE VIEW "qti__author"."set_template_value" ("id") AS
SELECT "r1"."id"
FROM "qti"."set_template_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."set_template_value" TO "qti__author";

CREATE VIEW "qti__author"."stats_operator" ("id", "name") AS
SELECT "r1"."id", "r1"."name"
FROM "qti"."stats_operator" AS "r1";

GRANT SELECT ON TABLE "qti__author"."stats_operator" TO "qti__author";

CREATE VIEW "qti__author"."string_match" ("case_sensitive", "id", "substring") AS
SELECT "r1"."case_sensitive", "r1"."id", "r1"."substring"
FROM "qti"."string_match" AS "r1";

GRANT SELECT ON TABLE "qti__author"."string_match" TO "qti__author";

CREATE VIEW "qti__author"."substring" ("case_sensitive", "id") AS
SELECT "r1"."case_sensitive", "r1"."id"
FROM "qti"."substring" AS "r1";

GRANT SELECT ON TABLE "qti__author"."substring" TO "qti__author";

CREATE VIEW "qti__author"."subtract" ("id") AS
SELECT "r1"."id"
FROM "qti"."subtract" AS "r1";

GRANT SELECT ON TABLE "qti__author"."subtract" TO "qti__author";

CREATE VIEW "qti__author"."sum" ("id") AS
SELECT "r1"."id"
FROM "qti"."sum" AS "r1";

GRANT SELECT ON TABLE "qti__author"."sum" TO "qti__author";

CREATE VIEW "qti__author"."template_condition_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."template_condition_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_condition_arm" TO "qti__author";

CREATE VIEW "qti__author"."template_constraint" ("id") AS
SELECT "r1"."id"
FROM "qti"."template_constraint" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_constraint" TO "qti__author";

CREATE VIEW "qti__author"."template_else_arm" ("condition", "id") AS
SELECT "r1"."condition", "r1"."id"
FROM "qti"."template_else_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_else_arm" TO "qti__author";

CREATE VIEW "qti__author"."template_else_if_arm" ("id") AS
SELECT "r1"."id"
FROM "qti"."template_else_if_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_else_if_arm" TO "qti__author";

CREATE VIEW "qti__author"."template_if_arm" ("condition", "id") AS
SELECT "r1"."condition", "r1"."id"
FROM "qti"."template_if_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_if_arm" TO "qti__author";

CREATE VIEW "qti__author"."template_processing" ("id", "item") AS
SELECT "r1"."id", "r1"."item"
FROM "qti"."template_processing" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_processing" TO "qti__author";

CREATE VIEW "qti__author"."test_variables" ("id", "variable_identifier") AS
SELECT "r1"."id", "r1"."variable_identifier"
FROM "qti"."test_variables" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_variables" TO "qti__author";

CREATE VIEW "qti__author"."test_variables_base_type" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."test_variables_base_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_variables_base_type" TO "qti__author";

CREATE VIEW "qti__author"."truncate" ("id") AS
SELECT "r1"."id"
FROM "qti"."truncate" AS "r1";

GRANT SELECT ON TABLE "qti__author"."truncate" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE VIEW "qti__author"."variable" ("id") AS
SELECT "r1"."id"
FROM "qti"."variable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variable" TO "qti__author";

CREATE VIEW "qti__author"."variable_ref" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."variable_weight_identifier" ("node", "root_kind", "value") AS
SELECT "r1"."node", "r1"."root_kind", "r1"."value"
FROM "qti"."variable_weight_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."variable_weight_identifier" TO "qti__author";

CREATE VIEW "qti__author"."x_include" ("id") AS
SELECT "r1"."id"
FROM "qti"."x_include" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include" TO "qti__author";

CREATE VIEW "qti__author"."x_include_accept" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."x_include_accept" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include_accept" TO "qti__author";

CREATE VIEW "qti__author"."x_include_accept_language" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."x_include_accept_language" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include_accept_language" TO "qti__author";

CREATE VIEW "qti__author"."x_include_encoding" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."x_include_encoding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include_encoding" TO "qti__author";

CREATE VIEW "qti__author"."x_include_href" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."x_include_href" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include_href" TO "qti__author";

CREATE VIEW "qti__author"."x_include_parse" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."x_include_parse" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include_parse" TO "qti__author";

CREATE VIEW "qti__author"."x_include_xpointer" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."x_include_xpointer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."x_include_xpointer" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."and" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."any_n" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_item" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."container_size" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."contains" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."correct" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."custom_operator" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."custom_operator_class" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."custom_operator_definition" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_include_lower_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_include_upper_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_rounding_mode" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_substring" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_tolerance_mode" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."default" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."delete" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."divide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."duration_gte" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."duration_lt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."equal" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."equal_rounded" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."equal_tolerance" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."exit_response" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."exit_template" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."exit_test" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression_exclude_category" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression_include_category" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression_section_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."expression_weight_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."fallback" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."field_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gcd" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gte" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."index" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."inside" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."integer_divide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."integer_modulus" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."integer_to_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."is_null" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lcm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."literal" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lookup_outcome_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lte" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_response" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_response_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."math_constant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."math_operator" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."max" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."member" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."multiple" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."not" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."null" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."number_correct" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."number_incorrect" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."number_presented" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."number_responded" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."number_selected" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."or" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ordered" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_condition_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_else_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_else_if_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_if_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_maximum_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_min_max" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_minimum_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_processing" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."outcome_processing_fragment" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."pattern_match" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."power" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."product" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."random" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."random_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."random_float_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."random_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."random_integer_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."random_integer_step" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."repeat" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_condition_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_else_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_else_if_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_if_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."response_processing_fragment" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."round" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."round_to" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rule_operand" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."set_correct_response" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."set_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."set_outcome_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."set_template_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."stats_operator" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."string_match" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."substring" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."subtract" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."sum" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_condition_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_constraint" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_else_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_else_if_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_if_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_processing" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_variables" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."test_variables_base_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."truncate" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."variable_weight_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include_accept" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include_accept_language" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include_encoding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include_href" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include_parse" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."x_include_xpointer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
