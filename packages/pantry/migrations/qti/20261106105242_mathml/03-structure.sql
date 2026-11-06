DROP POLICY "qti__author" ON "qti"."node_dir";

DROP POLICY "qti__author" ON "qti"."node_class";

DROP POLICY "qti__author" ON "qti"."node";

DROP VIEW "qti__author"."xsi_type_attribute";

DROP VIEW "qti__author"."xsi_nil";

DROP VIEW "qti__author"."xlink_type";

DROP VIEW "qti__author"."xlink_to";

DROP VIEW "qti__author"."xlink_title";

DROP VIEW "qti__author"."xlink_show";

DROP VIEW "qti__author"."xlink_role";

DROP VIEW "qti__author"."xlink_label";

DROP VIEW "qti__author"."xlink_href";

DROP VIEW "qti__author"."xlink_from";

DROP VIEW "qti__author"."xlink_arcrole";

DROP VIEW "qti__author"."xlink_actuate";

DROP VIEW "qti__author"."wildcard_host";

DROP VIEW "qti__author"."wildcard_exclusion";

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

DROP VIEW "qti__author"."node_xml_space";

DROP VIEW "qti__author"."node_xml_lang";

DROP VIEW "qti__author"."node_xml_base";

DROP VIEW "qti__author"."node_suppress_tts";

DROP VIEW "qti__author"."node_lang";

DROP VIEW "qti__author"."node_label";

DROP VIEW "qti__author"."node_dir";

DROP VIEW "qti__author"."node_class";

DROP VIEW "qti__author"."node_catalog_idref";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."manifest_xml_id";

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."lom_language";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."html_id";

DROP VIEW "qti__author"."headers_target";

DROP VIEW "qti__author"."foreign_element";

DROP VIEW "qti__author"."foreign_attribute";

DROP VIEW "qti__author"."expression_max";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."document_xml_id";

DROP VIEW "qti__author"."declared_ref";

DROP VIEW "qti__author"."coords";

DROP VIEW "qti__author"."built_in_ref";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_wildcard";

DROP VIEW "qti__author"."attribute_spelling";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."attribute_idref";

DROP VIEW "qti__author"."attribute_file_reference";

DROP VIEW "qti__author"."attribute_exclusion";

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

CREATE TABLE "qti"."mathml_abs" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_abs_pk_hucciljvuc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_align" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_yyhgrftqjx" NOT NULL,
  CONSTRAINT "__mathml_align_pk_spbopkk52a" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_alignmentscope" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_x4ovwk3uop" NOT NULL,
  CONSTRAINT "__mathml_alignmentscope_pk_5j2m2tmwew" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_altimg_valign" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_nx57zic2sr" NOT NULL,
  CONSTRAINT "__mathml_altimg_valign_pk_tax7b3pgih" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_and" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_and_pk_jw73inpo2q" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_annotation" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_annotation_pk_a3jfd4zfby" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_annotation_xml" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_annotation_xml_pk_ogvjkq4svq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_apply" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_apply_pk_iat6cuzsil" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_approx" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_approx_pk_hovflobftx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arccos" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arccos_pk_sly43ohb7m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arccosh" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arccosh_pk_jqsf2d64fv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arccot" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arccot_pk_knncr72cc4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arccoth" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arccoth_pk_gv3aywi3iv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arccsc" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arccsc_pk_24nym44toy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arccsch" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arccsch_pk_lax3m2rfbr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arcsec" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arcsec_pk_jh5btryosu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arcsech" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arcsech_pk_ekhim2vpkd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arcsin" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arcsin_pk_aqgu6b6h43" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arcsinh" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arcsinh_pk_s3gqyp5agb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arctan" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arctan_pk_iptuzawglm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arctanh" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arctanh_pk_zthpcoz4y4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_arg" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_arg_pk_5uyd3aiuis" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_attribute_type" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "type" "qti"."mathml_value_type" NOT NULL,
  CONSTRAINT "__mathml_attribute_type_pk_qramxa4xpj" PRIMARY KEY ("kind", "attribute"),
  CONSTRAINT "__mathml_attribute_type_key_kind_attribute_type_7hrobtsfzc" UNIQUE ("kind", "attribute", "type")
);

CREATE TABLE "qti"."mathml_background" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_oc36elqfmy" NOT NULL,
  CONSTRAINT "__mathml_background_pk_imcdsrfklf" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_base" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_base_value" NOT NULL,
  CONSTRAINT "__mathml_base_pk_4ax76ycale" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_bind" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_bind_pk_lmtfs5wdtu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_boolean" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_boolean_value" NOT NULL,
  CONSTRAINT "__mathml_boolean_pk_kv4tcarlxh" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_bvar" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_bvar_pk_kumvcg7aju" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_card" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_card_pk_zmc4sn4gxs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_cartesianproduct" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_cartesianproduct_pk_6s3ohgwkgj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_cbytes" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_cbytes_value" NOT NULL,
  CONSTRAINT "__mathml_cbytes_pk_7nxaln5ng7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_cd" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_cd_value" NOT NULL,
  CONSTRAINT "__mathml_cd_pk_sdihilsfdh" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_cdgroup" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_cdgroup_value" NOT NULL,
  CONSTRAINT "__mathml_cdgroup_pk_aluzdh3npv" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_ceiling" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_ceiling_pk_hmidbysivh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_cerror" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_cerror_pk_6askhivtn7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_character" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_hubjq5m7kx" NOT NULL,
  CONSTRAINT "__mathml_character_pk_b3v2xnmkzt" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_charspacing" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_j6r7doraiw" NOT NULL,
  CONSTRAINT "__mathml_charspacing_pk_podn6vduyc" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_ci" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_ci_pk_7roiopxpf6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_class" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_jfksd4nu5r" NOT NULL,
  CONSTRAINT "__mathml_class_pk_bsc5hnyg5a" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_closure" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_closure_value" NOT NULL,
  CONSTRAINT "__mathml_closure_pk_76hriwrusy" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_cn" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_cn_pk_dpnd5m3p2l" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_codomain" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_codomain_pk_z4gtnssadn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_color" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_vpd3gbdfhl" NOT NULL,
  CONSTRAINT "__mathml_color_pk_67shwpy7wl" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_columnalign" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_r5z7lvpd56" NOT NULL,
  CONSTRAINT "__mathml_columnalign_pk_qlgqmrqn3u" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_columnalignstyle" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_columnalignstyle_value" NOT NULL,
  CONSTRAINT "__mathml_columnalignstyle_pk_e4qssz7eet" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_columnwidth" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_623scqhhre" NOT NULL,
  CONSTRAINT "__mathml_columnwidth_pk_2j3htaciiw" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_complexes" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_complexes_pk_msb6yntcdy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_compose" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_compose_pk_ghfnq2barf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_condition" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_condition_pk_nrr7zlirub" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_conjugate" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_conjugate_pk_bshl6xva2p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_cos" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_cos_pk_iyrbokgosb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_cosh" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_cosh_pk_ib7ukmk4li" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_cot" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_cot_pk_qgbilnxxlu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_coth" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_coth_pk_fvgrpgocoi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_crossout" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_q57lslnkle" NOT NULL,
  CONSTRAINT "__mathml_crossout_pk_zkej6oxrlo" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_cs" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_cs_pk_2zrmiwvcnx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_csc" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_csc_pk_kzznwsh7id" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_csch" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_csch_pk_3wqgytx7vm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_csymbol" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_csymbol_pk_4imvku3es7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_curl" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_curl_pk_hyvbirlnq6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_declare" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_declare_pk_jujqpwrdbs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_definition_url" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_definition_url_value" NOT NULL,
  CONSTRAINT "__mathml_definition_url_pk_5wmyknzran" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_degree" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_degree_pk_y6s7c257dc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_determinant" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_determinant_pk_f3zr2ei6qf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_diff" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_diff_pk_ary5aecagc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_dir" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_dir_value" NOT NULL,
  CONSTRAINT "__mathml_dir_pk_4qgmqg5mr4" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_display" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_display_value" NOT NULL,
  CONSTRAINT "__mathml_display_pk_ba5nhocjjd" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_divergence" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_divergence_pk_7sqtzr4lqv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_divide" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_divide_pk_tbgykakero" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_domain" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_domain_pk_7vtb3xlksn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_domainofapplication" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_domainofapplication_pk_lwgqgp6oyv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_edge" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_edge_value" NOT NULL,
  CONSTRAINT "__mathml_edge_pk_bjprodcabk" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_embed_source" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."embed_source_uri" NOT NULL,
  CONSTRAINT "__mathml_embed_source_pk_zryrs25yto" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_emptyset" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_emptyset_pk_s4p74irf4w" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_eq" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_eq_pk_fe33v5ncuy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_equivalent" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_equivalent_pk_6pand4s3xk" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_eulergamma" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_eulergamma_pk_srfpk4myeb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_exists" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_exists_pk_wiuqp3gl6c" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_exp" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_exp_pk_7dewuzpzyh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_exponentiale" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_exponentiale_pk_gxxf2gdgwq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_factorial" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_factorial_pk_dwumhafn75" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_factorof" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_factorof_pk_pg4uscss2n" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_false" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_false_pk_nivtqisyho" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_floor" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_floor_pk_lwm5jxi6mh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_fn" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_fn_pk_xezahxuedc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_fontstyle" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_fontstyle_value" NOT NULL,
  CONSTRAINT "__mathml_fontstyle_pk_lev4zd4qbo" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_fontweight" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_fontweight_value" NOT NULL,
  CONSTRAINT "__mathml_fontweight_pk_rlk3zhriht" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_forall" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_forall_pk_4qscrs67e7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_form" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_form_value" NOT NULL,
  CONSTRAINT "__mathml_form_pk_v5wf6u64cz" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_framespacing" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_cfvofy6jst" NOT NULL,
  CONSTRAINT "__mathml_framespacing_pk_7cbxah5wgr" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_gcd" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_gcd_pk_vd3bfxpjbn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_geq" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_geq_pk_2224hapba4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_grad" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_grad_pk_n5apm6mpgd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_group_alignment" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_group_alignment_value" NOT NULL,
  CONSTRAINT "__mathml_group_alignment_pk_pvlhrt6av4" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_group_alignment_list" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_oxgrhofw2c" NOT NULL,
  CONSTRAINT "__mathml_group_alignment_list_pk_lzytwsbxtd" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_group_alignment_list_list" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_vwyq7r3dau" NOT NULL,
  CONSTRAINT "__mathml_group_alignment_list_list_pk_l6rk3bl5ze" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_gt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_gt_pk_iv5fhserov" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_href" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."hyperlink_uri" NOT NULL,
  CONSTRAINT "__mathml_href_pk_rij2xe3ac6" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_ident" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_ident_pk_5bqydltnjw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_image" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_image_pk_lmpcrtxzyf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_imaginary" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_imaginary_pk_6ee3kp6p6y" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_imaginaryi" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_imaginaryi_pk_sjtxqngldt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_implies" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_implies_pk_wcuyghyz7v" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_in" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_in_pk_2caccif6tt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_indentalign" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_indentalign_value" NOT NULL,
  CONSTRAINT "__mathml_indentalign_pk_jcyhcxinvm" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_indentalign_line" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_indentalign_line_value" NOT NULL,
  CONSTRAINT "__mathml_indentalign_line_pk_ifrhss5ifz" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_indentshift_line" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_jruckr5nmf" NOT NULL,
  CONSTRAINT "__mathml_indentshift_line_pk_fhqs7kzhxl" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_index" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_index_value" NOT NULL,
  CONSTRAINT "__mathml_index_pk_xeqono4wex" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_infinity" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_infinity_pk_lapxeb7hrx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_infixlinebreakstyle" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_infixlinebreakstyle_value" NOT NULL,
  CONSTRAINT "__mathml_infixlinebreakstyle_pk_rl3rfbiesh" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_int" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_int_pk_wphi7wuvhb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_integers" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_integers_pk_4qvf55h2j5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_intersect" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_intersect_pk_tsrhfksty3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_interval" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_interval_pk_tj2lduq6mb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_inverse" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_inverse_pk_sfstgvcadu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_lambda" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_lambda_pk_nadngvdxhz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_laplacian" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_laplacian_pk_me5wgce7qb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_lcm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_lcm_pk_pzzpykjtun" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_length" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_xusnuddb4k" NOT NULL,
  CONSTRAINT "__mathml_length_pk_ih2ulimeee" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_length_list" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_i7djrwbb7n" NOT NULL,
  CONSTRAINT "__mathml_length_list_pk_k56ycdddpd" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_leq" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_leq_pk_hgo3uq5s6o" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_limit" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_limit_pk_f3sswpzlrp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_line_thickness" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_fywgikzrwf" NOT NULL,
  CONSTRAINT "__mathml_line_thickness_pk_wg2hacvqxj" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_linebreak" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_linebreak_value" NOT NULL,
  CONSTRAINT "__mathml_linebreak_pk_2wn2b2nfk5" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_linebreakstyle" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_linebreakstyle_value" NOT NULL,
  CONSTRAINT "__mathml_linebreakstyle_pk_dnrkmzlndr" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_linestyle" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_linestyle_value" NOT NULL,
  CONSTRAINT "__mathml_linestyle_pk_lw7x4rsxx6" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_linestyle_list" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_o4z6v6eurt" NOT NULL,
  CONSTRAINT "__mathml_linestyle_list_pk_cvihfotmbq" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_list" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_list_pk_s4rsre3tuu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_ln" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_ln_pk_hwmnitfyy2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_location" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_location_value" NOT NULL,
  CONSTRAINT "__mathml_location_pk_zid6mwzl4l" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_log" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_log_pk_jk6drbwm25" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_logbase" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_logbase_pk_st4e3wlusv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_longdivstyle" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_longdivstyle_value" NOT NULL,
  CONSTRAINT "__mathml_longdivstyle_pk_c62quk5tx5" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_lowlimit" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_lowlimit_pk_4lzynrjor5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_lt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_lt_pk_tsrdgcpid4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_maction" (
  "actiontype" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_maction_pk_sv7moxq64w" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_maligngroup" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_maligngroup_pk_z7y7sdtbou" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_malignmark" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_malignmark_pk_llh4wjpbys" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_math" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_math_pk_6ndspf45bj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mathsize" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_6ifjn7x3qm" NOT NULL,
  CONSTRAINT "__mathml_mathsize_pk_xnvckgrtcm" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_mathvariant" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_mathvariant_value" NOT NULL,
  CONSTRAINT "__mathml_mathvariant_pk_pap3seq5ll" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_matrix" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_matrix_pk_jkafef3yce" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_matrixrow" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_matrixrow_pk_ws7xvp33ds" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_max" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_max_pk_uswcbzgsc4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_maxsize" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7mihpbbens" NOT NULL,
  CONSTRAINT "__mathml_maxsize_pk_2jngq56a5g" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_mean" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mean_pk_2um5ska26t" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_median" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_median_pk_7rmns54xzb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_menclose" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_menclose_pk_cbyw4rpe7m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_merror" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_merror_pk_wj4dgt6bdu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mfenced" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mfenced_pk_vs6hkdapk3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mfrac" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mfrac_pk_ngogii2rh2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mglyph" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mglyph_pk_w3423ldx7b" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mi" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mi_pk_dj67agdwvi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_min" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_min_pk_fdbsl432kc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_minus" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_minus_pk_ilnyhxamsb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mlabeledtr" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mlabeledtr_pk_fxkbfct7gc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mlongdiv" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mlongdiv_pk_vj4adgeja6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mmultiscripts" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mmultiscripts_pk_pmnb6xiitc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mn" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mn_pk_hubxp2rcoz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mo" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mo_pk_zdqzlywwia" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mode" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mode_pk_oqoi6cl6f3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_moment" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_moment_pk_fhoadrgmlw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_momentabout" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_momentabout_pk_fpbmpmufdt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mover" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mover_pk_2akw5uzgqy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mpadded" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mpadded_pk_p7hxm56itk" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mpadded_length" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_vrj3u337cv" NOT NULL,
  CONSTRAINT "__mathml_mpadded_length_pk_shec52pc2m" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_mphantom" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mphantom_pk_v3xkr7ih4a" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mprescripts" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mprescripts_pk_xmvsfxpa3b" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mroot" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mroot_pk_5oaf67cx3e" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mrow" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mrow_pk_zkclylutru" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_ms" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_ms_pk_24mblluiud" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mscarries" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mscarries_pk_vo6z7ekh65" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mscarry" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mscarry_pk_il2an5yjbp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_msgroup" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_msgroup_pk_4dgrr4uivs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_msline" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_msline_pk_z2ec6cszl2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mspace" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mspace_pk_ofshuqznhw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mspace_linebreak" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_mspace_linebreak_value" NOT NULL,
  CONSTRAINT "__mathml_mspace_linebreak_pk_aewqpgnex7" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_msqrt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_msqrt_pk_fbdhvsansm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_msrow" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_msrow_pk_wgbgeayybx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mstack" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mstack_pk_tn422snrrf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mstyle" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mstyle_pk_alf4czhnhl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_msub" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_msub_pk_w4ch2psuev" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_msubsup" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_msubsup_pk_tnugc2fkfn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_msup" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_msup_pk_j3mybqwnte" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mtable" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mtable_pk_lmswlnvgad" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mtd" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mtd_pk_ejqhfxjflw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mtext" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mtext_pk_emehgah3gk" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_mtr" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_mtr_pk_6zq6li53in" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_munder" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_munder_pk_zfr5ikfrcm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_munderover" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_munderover_pk_3gqwqo5bwv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_name" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_name_value" NOT NULL,
  CONSTRAINT "__mathml_name_pk_yurbr2qi3b" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_nargs" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_nargs_value" NOT NULL,
  CONSTRAINT "__mathml_nargs_pk_tqbtaq4xjt" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_naturalnumbers" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_naturalnumbers_pk_gepeubh6pd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_neq" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_neq_pk_wg7ikknfqi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_none" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_none_pk_i4bfuonw6t" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_not" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_not_pk_cjauwdxwyy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_notanumber" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_notanumber_pk_ac7bxenbbv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_notin" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_notin_pk_ip23npzov7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_notprsubset" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_notprsubset_pk_xxbik5oww4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_notsubset" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_notsubset_pk_ambcjzkxsm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_number" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7dlsmkhhat" NOT NULL,
  CONSTRAINT "__mathml_number_pk_4ixs2asj5j" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_occurrence" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_occurrence_value" NOT NULL,
  CONSTRAINT "__mathml_occurrence_pk_keux2e5n4v" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_or" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_or_pk_odhs6xzs65" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_order" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_order_value" NOT NULL,
  CONSTRAINT "__mathml_order_pk_ahbjyfcwav" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_otherwise" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_otherwise_pk_42k4ua6764" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_outerproduct" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_outerproduct_pk_32ihez7dtr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_overflow" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_overflow_value" NOT NULL,
  CONSTRAINT "__mathml_overflow_pk_yj5w6delaf" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_partialdiff" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_partialdiff_pk_4c725jz6tm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_pi" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_pi_pk_lkphvhzqm4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_piece" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_piece_pk_jhi4z5vfaj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_piecewise" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_piecewise_pk_bws2kbta6a" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_plus" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_plus_pk_qmu4a3yce2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_position" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_position_value" NOT NULL,
  CONSTRAINT "__mathml_position_pk_pcmt7uozpj" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_power" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_power_pk_bdzmzcyksw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_primes" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_primes_pk_3vwk53txtl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_product" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_product_pk_2ysqywxodg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_prsubset" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_prsubset_pk_v4ekn7vc5v" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_quotient" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_quotient_pk_ckngifwgk2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_rationals" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_rationals_pk_2zgm3diqhf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_real" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_real_pk_gh6gthzfhz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_reals" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_reals_pk_33dhipsot2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_reln" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_reln_pk_hhmpay7biq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_rem" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_rem_pk_michkixgqe" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_root" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_root_pk_qesh5gl6as" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_rowalign" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_okcvipkynh" NOT NULL,
  CONSTRAINT "__mathml_rowalign_pk_am3tfhq6kv" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_scalarproduct" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_scalarproduct_pk_qrkhbhsldx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_scriptlevel" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_scriptlevel_value" NOT NULL,
  CONSTRAINT "__mathml_scriptlevel_pk_gstmxit44p" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_sdev" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_sdev_pk_olds5doftj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_sec" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_sec_pk_vvtnum3p6i" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_sech" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_sech_pk_zqwswxkqac" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_selection" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_selection_value" NOT NULL,
  CONSTRAINT "__mathml_selection_pk_4irhvtro54" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_selector" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_selector_pk_znomsndex3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_semantics" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_semantics_pk_22lxzdwdcv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_semantics_ci" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_semantics_ci_pk_dz2u2svnkw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_sep" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_sep_pk_oxs7uhqvii" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_set" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_set_pk_np327z4b4w" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_setdiff" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_setdiff_pk_buas5z7kvp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_share" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_share_pk_qeqnt2zsce" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_shift" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_shift_value" NOT NULL,
  CONSTRAINT "__mathml_shift_pk_sltmrwz3yh" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_side" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_side_value" NOT NULL,
  CONSTRAINT "__mathml_side_pk_5ujknwlvcu" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_sin" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_sin_pk_5uwylz5et4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_sinh" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_sinh_pk_mi4u76twwx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_span" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_span_value" NOT NULL,
  CONSTRAINT "__mathml_span_pk_iulnubivfa" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_src" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_src_value" NOT NULL,
  CONSTRAINT "__mathml_src_pk_ww6r4kokvj" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_string" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__mathml_string_pk_wgbza2ry76" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_subset" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_subset_pk_igstholb2c" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_sum" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_sum_pk_ghqoxzuz23" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_table_width" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_64ulvvuteh" NOT NULL,
  CONSTRAINT "__mathml_table_width_pk_54aeobjlmf" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_tan" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_tan_pk_tlqz4tip3u" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_tanh" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_tanh_pk_xhtodkw23e" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_tendsto" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_tendsto_pk_pcrc6gn4rm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_times" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_times_pk_vrt7m653al" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_transpose" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_transpose_pk_xsvprlzone" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_true" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_true_pk_5zwekabkun" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_union" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_union_pk_4kksxl2qot" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_unsigned_integer" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_mlv3bwkpew" NOT NULL,
  CONSTRAINT "__mathml_unsigned_integer_pk_35uxbmwnpm" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_uplimit" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_uplimit_pk_vbjna7eati" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_variance" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_variance_pk_zfdbnlxeic" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_vector" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_vector_pk_xg6bz7i7ip" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_vectorproduct" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_vectorproduct_pk_xdk2c6tmjr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mathml_verticalalign" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mathml_verticalalign_value" NOT NULL,
  CONSTRAINT "__mathml_verticalalign_pk_53tk5zcmwj" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."mathml_xor" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mathml_xor_pk_2xwqxxiu6f" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."mathml_abs" ADD COLUMN "__tag_kind_m_abs_5ggr4en2fg" "qti"."node_kind" GENERATED ALWAYS AS ('m:abs'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_align" ADD COLUMN "__tag_type_align_rz4q2q2vpi" "qti"."mathml_value_type" GENERATED ALWAYS AS ('align'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_alignmentscope" ADD COLUMN "__tag_type_alignmentscope_ksiai53b3c" "qti"."mathml_value_type" GENERATED ALWAYS AS ('alignmentscope'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_altimg_valign" ADD COLUMN "__tag_type_altimg_valign_4g6yyfcca6" "qti"."mathml_value_type" GENERATED ALWAYS AS ('altimg-valign'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_and" ADD COLUMN "__tag_kind_m_and_eisrasbaaj" "qti"."node_kind" GENERATED ALWAYS AS ('m:and'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_annotation" ADD COLUMN "__tag_kind_m_annotation_ze5ecrwj65" "qti"."node_kind" GENERATED ALWAYS AS ('m:annotation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_annotation_xml" ADD COLUMN "__tag_kind_m_annotation_xml_wd6za7y2z6" "qti"."node_kind" GENERATED ALWAYS AS ('m:annotation-xml'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_apply" ADD COLUMN "__tag_kind_m_apply_bengchb6nb" "qti"."node_kind" GENERATED ALWAYS AS ('m:apply'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_approx" ADD COLUMN "__tag_kind_m_approx_ybgbzwajac" "qti"."node_kind" GENERATED ALWAYS AS ('m:approx'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arccos" ADD COLUMN "__tag_kind_m_arccos_ytmvopxit3" "qti"."node_kind" GENERATED ALWAYS AS ('m:arccos'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arccosh" ADD COLUMN "__tag_kind_m_arccosh_cnra4q6n4l" "qti"."node_kind" GENERATED ALWAYS AS ('m:arccosh'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arccot" ADD COLUMN "__tag_kind_m_arccot_63he22ouqq" "qti"."node_kind" GENERATED ALWAYS AS ('m:arccot'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arccoth" ADD COLUMN "__tag_kind_m_arccoth_3luoi3xwu7" "qti"."node_kind" GENERATED ALWAYS AS ('m:arccoth'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arccsc" ADD COLUMN "__tag_kind_m_arccsc_rnbrap3tp7" "qti"."node_kind" GENERATED ALWAYS AS ('m:arccsc'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arccsch" ADD COLUMN "__tag_kind_m_arccsch_rmwi7hbeqe" "qti"."node_kind" GENERATED ALWAYS AS ('m:arccsch'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arcsec" ADD COLUMN "__tag_kind_m_arcsec_psxegloodo" "qti"."node_kind" GENERATED ALWAYS AS ('m:arcsec'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arcsech" ADD COLUMN "__tag_kind_m_arcsech_i6dbeh5zx5" "qti"."node_kind" GENERATED ALWAYS AS ('m:arcsech'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arcsin" ADD COLUMN "__tag_kind_m_arcsin_ctwb3wrgwt" "qti"."node_kind" GENERATED ALWAYS AS ('m:arcsin'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arcsinh" ADD COLUMN "__tag_kind_m_arcsinh_3dysnvaqqn" "qti"."node_kind" GENERATED ALWAYS AS ('m:arcsinh'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arctan" ADD COLUMN "__tag_kind_m_arctan_soi2gc3vnc" "qti"."node_kind" GENERATED ALWAYS AS ('m:arctan'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arctanh" ADD COLUMN "__tag_kind_m_arctanh_zaaffkrj3r" "qti"."node_kind" GENERATED ALWAYS AS ('m:arctanh'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_arg" ADD COLUMN "__tag_kind_m_arg_7stlghlgbd" "qti"."node_kind" GENERATED ALWAYS AS ('m:arg'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_background" ADD COLUMN "__tag_type_background_azuiwrri3s" "qti"."mathml_value_type" GENERATED ALWAYS AS ('background'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_base" ADD COLUMN "__tag_type_base_ssbqmyk7xw" "qti"."mathml_value_type" GENERATED ALWAYS AS ('base'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_bind" ADD COLUMN "__tag_kind_m_bind_bqadgfn5un" "qti"."node_kind" GENERATED ALWAYS AS ('m:bind'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_boolean" ADD COLUMN "__tag_type_boolean_ovtjlq2nwu" "qti"."mathml_value_type" GENERATED ALWAYS AS ('boolean'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_bvar" ADD COLUMN "__tag_kind_m_bvar_zt42o25tfs" "qti"."node_kind" GENERATED ALWAYS AS ('m:bvar'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_card" ADD COLUMN "__tag_kind_m_card_til5kekpth" "qti"."node_kind" GENERATED ALWAYS AS ('m:card'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cartesianproduct" ADD COLUMN "__tag_kind_m_cartesianproduct_drgcnkhoeu" "qti"."node_kind" GENERATED ALWAYS AS ('m:cartesianproduct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cbytes" ADD COLUMN "__tag_kind_m_cbytes_feg57xr5pi" "qti"."node_kind" GENERATED ALWAYS AS ('m:cbytes'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cd" ADD COLUMN "__tag_type_cd_asogh6i35g" "qti"."mathml_value_type" GENERATED ALWAYS AS ('cd'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cdgroup" ADD COLUMN "__tag_type_cdgroup_swev5xcnud" "qti"."mathml_value_type" GENERATED ALWAYS AS ('cdgroup'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_ceiling" ADD COLUMN "__tag_kind_m_ceiling_tvv3pqo4kc" "qti"."node_kind" GENERATED ALWAYS AS ('m:ceiling'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cerror" ADD COLUMN "__tag_kind_m_cerror_solhxcpqpl" "qti"."node_kind" GENERATED ALWAYS AS ('m:cerror'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_character" ADD COLUMN "__tag_type_character_kcgxmhefxo" "qti"."mathml_value_type" GENERATED ALWAYS AS ('character'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_charspacing" ADD COLUMN "__tag_type_charspacing_3o6btzcp65" "qti"."mathml_value_type" GENERATED ALWAYS AS ('charspacing'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_ci" ADD COLUMN "__tag_kind_m_ci_kcbsfo2k3x" "qti"."node_kind" GENERATED ALWAYS AS ('m:ci'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_class" ADD COLUMN "__tag_type_class_uhlcorrx6k" "qti"."mathml_value_type" GENERATED ALWAYS AS ('class'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_closure" ADD COLUMN "__tag_type_closure_ojw7a4ueed" "qti"."mathml_value_type" GENERATED ALWAYS AS ('closure'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cn" ADD COLUMN "__tag_kind_m_cn_nm5smoaq3e" "qti"."node_kind" GENERATED ALWAYS AS ('m:cn'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_codomain" ADD COLUMN "__tag_kind_m_codomain_isect7ufnh" "qti"."node_kind" GENERATED ALWAYS AS ('m:codomain'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_color" ADD COLUMN "__tag_type_color_xo6xrxwyju" "qti"."mathml_value_type" GENERATED ALWAYS AS ('color'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_columnalign" ADD COLUMN "__tag_type_columnalign_gm65bdikjd" "qti"."mathml_value_type" GENERATED ALWAYS AS ('columnalign'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_columnalignstyle" ADD COLUMN "__tag_type_columnalignstyle_llipaw2n3g" "qti"."mathml_value_type" GENERATED ALWAYS AS ('columnalignstyle'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_columnwidth" ADD COLUMN "__tag_type_columnwidth_2ohzautbjs" "qti"."mathml_value_type" GENERATED ALWAYS AS ('columnwidth'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_complexes" ADD COLUMN "__tag_kind_m_complexes_mpuqcbf6mf" "qti"."node_kind" GENERATED ALWAYS AS ('m:complexes'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_compose" ADD COLUMN "__tag_kind_m_compose_iirxxezxih" "qti"."node_kind" GENERATED ALWAYS AS ('m:compose'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_condition" ADD COLUMN "__tag_kind_m_condition_kxzfowxslw" "qti"."node_kind" GENERATED ALWAYS AS ('m:condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_conjugate" ADD COLUMN "__tag_kind_m_conjugate_ikcpb4fov7" "qti"."node_kind" GENERATED ALWAYS AS ('m:conjugate'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cos" ADD COLUMN "__tag_kind_m_cos_bm6qwenqd5" "qti"."node_kind" GENERATED ALWAYS AS ('m:cos'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cosh" ADD COLUMN "__tag_kind_m_cosh_p3nqsbayow" "qti"."node_kind" GENERATED ALWAYS AS ('m:cosh'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cot" ADD COLUMN "__tag_kind_m_cot_5mkoifjifu" "qti"."node_kind" GENERATED ALWAYS AS ('m:cot'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_coth" ADD COLUMN "__tag_kind_m_coth_czjsavr4hx" "qti"."node_kind" GENERATED ALWAYS AS ('m:coth'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_crossout" ADD COLUMN "__tag_type_crossout_ayzqk3upcx" "qti"."mathml_value_type" GENERATED ALWAYS AS ('crossout'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_cs" ADD COLUMN "__tag_kind_m_cs_7lhn577snb" "qti"."node_kind" GENERATED ALWAYS AS ('m:cs'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_csc" ADD COLUMN "__tag_kind_m_csc_euk34eaz5r" "qti"."node_kind" GENERATED ALWAYS AS ('m:csc'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_csch" ADD COLUMN "__tag_kind_m_csch_pp6ieubxgw" "qti"."node_kind" GENERATED ALWAYS AS ('m:csch'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_csymbol" ADD COLUMN "__tag_kind_m_csymbol_poho6k6bbq" "qti"."node_kind" GENERATED ALWAYS AS ('m:csymbol'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_curl" ADD COLUMN "__tag_kind_m_curl_iuyimyhcei" "qti"."node_kind" GENERATED ALWAYS AS ('m:curl'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_declare" ADD COLUMN "__tag_kind_m_declare_du6gfazyqy" "qti"."node_kind" GENERATED ALWAYS AS ('m:declare'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_definition_url" ADD COLUMN "__tag_type_definition_url_mm24nzp6au" "qti"."mathml_value_type" GENERATED ALWAYS AS ('definition-url'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_degree" ADD COLUMN "__tag_kind_m_degree_gdpkq3qbuh" "qti"."node_kind" GENERATED ALWAYS AS ('m:degree'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_determinant" ADD COLUMN "__tag_kind_m_determinant_ho2trt5jwg" "qti"."node_kind" GENERATED ALWAYS AS ('m:determinant'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_diff" ADD COLUMN "__tag_kind_m_diff_qwzgjscjjh" "qti"."node_kind" GENERATED ALWAYS AS ('m:diff'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_dir" ADD COLUMN "__tag_type_dir_56vobbgcmu" "qti"."mathml_value_type" GENERATED ALWAYS AS ('dir'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_display" ADD COLUMN "__tag_type_display_q4wgbtruhu" "qti"."mathml_value_type" GENERATED ALWAYS AS ('display'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_divergence" ADD COLUMN "__tag_kind_m_divergence_lf7s2l7csn" "qti"."node_kind" GENERATED ALWAYS AS ('m:divergence'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_divide" ADD COLUMN "__tag_kind_m_divide_hljq3bljki" "qti"."node_kind" GENERATED ALWAYS AS ('m:divide'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_domain" ADD COLUMN "__tag_kind_m_domain_f636fecyb3" "qti"."node_kind" GENERATED ALWAYS AS ('m:domain'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_domainofapplication" ADD COLUMN "__tag_kind_m_domainofapplication_p32lmqyvju" "qti"."node_kind" GENERATED ALWAYS AS ('m:domainofapplication'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_edge" ADD COLUMN "__tag_type_edge_iuoelrniia" "qti"."mathml_value_type" GENERATED ALWAYS AS ('edge'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_embed_source" ADD COLUMN "__tag_type_embed_source_n7fs6bfobb" "qti"."mathml_value_type" GENERATED ALWAYS AS ('embed-source'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_emptyset" ADD COLUMN "__tag_kind_m_emptyset_tgxutwjcbv" "qti"."node_kind" GENERATED ALWAYS AS ('m:emptyset'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_eq" ADD COLUMN "__tag_kind_m_eq_zt2uyo5zmx" "qti"."node_kind" GENERATED ALWAYS AS ('m:eq'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_equivalent" ADD COLUMN "__tag_kind_m_equivalent_chw7c3l2pg" "qti"."node_kind" GENERATED ALWAYS AS ('m:equivalent'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_eulergamma" ADD COLUMN "__tag_kind_m_eulergamma_7vwknmgaz3" "qti"."node_kind" GENERATED ALWAYS AS ('m:eulergamma'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_exists" ADD COLUMN "__tag_kind_m_exists_26megfczw3" "qti"."node_kind" GENERATED ALWAYS AS ('m:exists'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_exp" ADD COLUMN "__tag_kind_m_exp_hp5qgqr6mo" "qti"."node_kind" GENERATED ALWAYS AS ('m:exp'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_exponentiale" ADD COLUMN "__tag_kind_m_exponentiale_n3bg467okv" "qti"."node_kind" GENERATED ALWAYS AS ('m:exponentiale'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_factorial" ADD COLUMN "__tag_kind_m_factorial_luq3tna6il" "qti"."node_kind" GENERATED ALWAYS AS ('m:factorial'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_factorof" ADD COLUMN "__tag_kind_m_factorof_7mkqtxhp6r" "qti"."node_kind" GENERATED ALWAYS AS ('m:factorof'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_false" ADD COLUMN "__tag_kind_m_false_2lwwbihgiq" "qti"."node_kind" GENERATED ALWAYS AS ('m:false'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_floor" ADD COLUMN "__tag_kind_m_floor_ldoeltb3g2" "qti"."node_kind" GENERATED ALWAYS AS ('m:floor'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_fn" ADD COLUMN "__tag_kind_m_fn_4bvdfdhf5b" "qti"."node_kind" GENERATED ALWAYS AS ('m:fn'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_fontstyle" ADD COLUMN "__tag_type_fontstyle_phcqb3bvk2" "qti"."mathml_value_type" GENERATED ALWAYS AS ('fontstyle'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_fontweight" ADD COLUMN "__tag_type_fontweight_uinmbdi34f" "qti"."mathml_value_type" GENERATED ALWAYS AS ('fontweight'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_forall" ADD COLUMN "__tag_kind_m_forall_ef26ntzivb" "qti"."node_kind" GENERATED ALWAYS AS ('m:forall'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_form" ADD COLUMN "__tag_type_form_gdgsyoa7tz" "qti"."mathml_value_type" GENERATED ALWAYS AS ('form'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_framespacing" ADD COLUMN "__tag_type_framespacing_npn4kimxhg" "qti"."mathml_value_type" GENERATED ALWAYS AS ('framespacing'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_gcd" ADD COLUMN "__tag_kind_m_gcd_xa57vvjg5a" "qti"."node_kind" GENERATED ALWAYS AS ('m:gcd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_geq" ADD COLUMN "__tag_kind_m_geq_n5wokg4gqv" "qti"."node_kind" GENERATED ALWAYS AS ('m:geq'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_grad" ADD COLUMN "__tag_kind_m_grad_6q4ynpcv7x" "qti"."node_kind" GENERATED ALWAYS AS ('m:grad'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_group_alignment" ADD COLUMN "__tag_type_group_alignment_pqo7age7u2" "qti"."mathml_value_type" GENERATED ALWAYS AS ('group-alignment'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_group_alignment_list" ADD COLUMN "__tag_type_group_alignment_list_uuhrki2oda" "qti"."mathml_value_type" GENERATED ALWAYS AS ('group-alignment-list'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_group_alignment_list_list" ADD COLUMN "__tag_type_group_alignment_list_list_qianckw2my" "qti"."mathml_value_type" GENERATED ALWAYS AS ('group-alignment-list-list'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_gt" ADD COLUMN "__tag_kind_m_gt_jthh6lobdq" "qti"."node_kind" GENERATED ALWAYS AS ('m:gt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_href" ADD COLUMN "__tag_type_href_yzb73hqcyn" "qti"."mathml_value_type" GENERATED ALWAYS AS ('href'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_ident" ADD COLUMN "__tag_kind_m_ident_hirfnzkvy7" "qti"."node_kind" GENERATED ALWAYS AS ('m:ident'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_image" ADD COLUMN "__tag_kind_m_image_ytpk7tcvqx" "qti"."node_kind" GENERATED ALWAYS AS ('m:image'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_imaginary" ADD COLUMN "__tag_kind_m_imaginary_xoprhipe34" "qti"."node_kind" GENERATED ALWAYS AS ('m:imaginary'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_imaginaryi" ADD COLUMN "__tag_kind_m_imaginaryi_baxxqzk6iy" "qti"."node_kind" GENERATED ALWAYS AS ('m:imaginaryi'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_implies" ADD COLUMN "__tag_kind_m_implies_lq7yrzde2h" "qti"."node_kind" GENERATED ALWAYS AS ('m:implies'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_in" ADD COLUMN "__tag_kind_m_in_r3eoy4iycj" "qti"."node_kind" GENERATED ALWAYS AS ('m:in'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_indentalign" ADD COLUMN "__tag_type_indentalign_j5iv5corng" "qti"."mathml_value_type" GENERATED ALWAYS AS ('indentalign'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_indentalign_line" ADD COLUMN "__tag_type_indentalign_line_qkwuxxgavh" "qti"."mathml_value_type" GENERATED ALWAYS AS ('indentalign-line'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_indentshift_line" ADD COLUMN "__tag_type_indentshift_line_cuy5tnfbaq" "qti"."mathml_value_type" GENERATED ALWAYS AS ('indentshift-line'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_index" ADD COLUMN "__tag_type_index_h3u3yjrhy5" "qti"."mathml_value_type" GENERATED ALWAYS AS ('index'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_infinity" ADD COLUMN "__tag_kind_m_infinity_ylqzdwkaro" "qti"."node_kind" GENERATED ALWAYS AS ('m:infinity'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_infixlinebreakstyle" ADD COLUMN "__tag_type_infixlinebreakstyle_bfpwwvm7sn" "qti"."mathml_value_type" GENERATED ALWAYS AS ('infixlinebreakstyle'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_int" ADD COLUMN "__tag_kind_m_int_eacj64es7a" "qti"."node_kind" GENERATED ALWAYS AS ('m:int'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_integers" ADD COLUMN "__tag_kind_m_integers_ynhsls5pt2" "qti"."node_kind" GENERATED ALWAYS AS ('m:integers'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_intersect" ADD COLUMN "__tag_kind_m_intersect_2t6lpqnkyo" "qti"."node_kind" GENERATED ALWAYS AS ('m:intersect'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_interval" ADD COLUMN "__tag_kind_m_interval_c4ld6f4f6d" "qti"."node_kind" GENERATED ALWAYS AS ('m:interval'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_inverse" ADD COLUMN "__tag_kind_m_inverse_jjpt2lp3pd" "qti"."node_kind" GENERATED ALWAYS AS ('m:inverse'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_lambda" ADD COLUMN "__tag_kind_m_lambda_v5k6arscmx" "qti"."node_kind" GENERATED ALWAYS AS ('m:lambda'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_laplacian" ADD COLUMN "__tag_kind_m_laplacian_4tx6pg3cdf" "qti"."node_kind" GENERATED ALWAYS AS ('m:laplacian'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_lcm" ADD COLUMN "__tag_kind_m_lcm_66u5rutbgm" "qti"."node_kind" GENERATED ALWAYS AS ('m:lcm'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_length" ADD COLUMN "__tag_type_length_3ryxkrjjhb" "qti"."mathml_value_type" GENERATED ALWAYS AS ('length'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_length_list" ADD COLUMN "__tag_type_length_list_dngtcn7r6m" "qti"."mathml_value_type" GENERATED ALWAYS AS ('length-list'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_leq" ADD COLUMN "__tag_kind_m_leq_b7euz5pala" "qti"."node_kind" GENERATED ALWAYS AS ('m:leq'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_limit" ADD COLUMN "__tag_kind_m_limit_l2u2dzwokn" "qti"."node_kind" GENERATED ALWAYS AS ('m:limit'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_line_thickness" ADD COLUMN "__tag_type_line_thickness_wchmxjoakj" "qti"."mathml_value_type" GENERATED ALWAYS AS ('line-thickness'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_linebreak" ADD COLUMN "__tag_type_linebreak_w6lunataa2" "qti"."mathml_value_type" GENERATED ALWAYS AS ('linebreak'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_linebreakstyle" ADD COLUMN "__tag_type_linebreakstyle_llwvaljtbh" "qti"."mathml_value_type" GENERATED ALWAYS AS ('linebreakstyle'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_linestyle" ADD COLUMN "__tag_type_linestyle_epwcv3z4sm" "qti"."mathml_value_type" GENERATED ALWAYS AS ('linestyle'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_linestyle_list" ADD COLUMN "__tag_type_linestyle_list_rb27ousd5c" "qti"."mathml_value_type" GENERATED ALWAYS AS ('linestyle-list'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_list" ADD COLUMN "__tag_kind_m_list_ididamd2sx" "qti"."node_kind" GENERATED ALWAYS AS ('m:list'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_ln" ADD COLUMN "__tag_kind_m_ln_ffmsmo2m36" "qti"."node_kind" GENERATED ALWAYS AS ('m:ln'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_location" ADD COLUMN "__tag_type_location_kr5ll5xiqo" "qti"."mathml_value_type" GENERATED ALWAYS AS ('location'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_log" ADD COLUMN "__tag_kind_m_log_3dqvvrgdqn" "qti"."node_kind" GENERATED ALWAYS AS ('m:log'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_logbase" ADD COLUMN "__tag_kind_m_logbase_iwvpr4ym5u" "qti"."node_kind" GENERATED ALWAYS AS ('m:logbase'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_longdivstyle" ADD COLUMN "__tag_type_longdivstyle_x6uaaro43p" "qti"."mathml_value_type" GENERATED ALWAYS AS ('longdivstyle'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_lowlimit" ADD COLUMN "__tag_kind_m_lowlimit_2pfspebfal" "qti"."node_kind" GENERATED ALWAYS AS ('m:lowlimit'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_lt" ADD COLUMN "__tag_kind_m_lt_vgxgnlpcov" "qti"."node_kind" GENERATED ALWAYS AS ('m:lt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_maction" ADD COLUMN "__tag_kind_m_maction_y36nfqlpyh" "qti"."node_kind" GENERATED ALWAYS AS ('m:maction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_maligngroup" ADD COLUMN "__tag_kind_m_maligngroup_wampytcaou" "qti"."node_kind" GENERATED ALWAYS AS ('m:maligngroup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_malignmark" ADD COLUMN "__tag_kind_m_malignmark_nz76twvsrf" "qti"."node_kind" GENERATED ALWAYS AS ('m:malignmark'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_math" ADD COLUMN "__tag_kind_m_math_dtmrz3gcfd" "qti"."node_kind" GENERATED ALWAYS AS ('m:math'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mathsize" ADD COLUMN "__tag_type_mathsize_grkbgzyt3i" "qti"."mathml_value_type" GENERATED ALWAYS AS ('mathsize'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mathvariant" ADD COLUMN "__tag_type_mathvariant_g4idzs45uj" "qti"."mathml_value_type" GENERATED ALWAYS AS ('mathvariant'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_matrix" ADD COLUMN "__tag_kind_m_matrix_mnfvdmlrs2" "qti"."node_kind" GENERATED ALWAYS AS ('m:matrix'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_matrixrow" ADD COLUMN "__tag_kind_m_matrixrow_uhamsripkq" "qti"."node_kind" GENERATED ALWAYS AS ('m:matrixrow'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_max" ADD COLUMN "__tag_kind_m_max_cr2qia23nv" "qti"."node_kind" GENERATED ALWAYS AS ('m:max'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_maxsize" ADD COLUMN "__tag_type_maxsize_562tlh7e4a" "qti"."mathml_value_type" GENERATED ALWAYS AS ('maxsize'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mean" ADD COLUMN "__tag_kind_m_mean_e72hycklnh" "qti"."node_kind" GENERATED ALWAYS AS ('m:mean'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_median" ADD COLUMN "__tag_kind_m_median_fornyqw6hp" "qti"."node_kind" GENERATED ALWAYS AS ('m:median'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_menclose" ADD COLUMN "__tag_kind_m_menclose_jsw5qoccrd" "qti"."node_kind" GENERATED ALWAYS AS ('m:menclose'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_merror" ADD COLUMN "__tag_kind_m_merror_nhqlhek76i" "qti"."node_kind" GENERATED ALWAYS AS ('m:merror'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mfenced" ADD COLUMN "__tag_kind_m_mfenced_oo5qjasnee" "qti"."node_kind" GENERATED ALWAYS AS ('m:mfenced'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mfrac" ADD COLUMN "__tag_kind_m_mfrac_vmplftveia" "qti"."node_kind" GENERATED ALWAYS AS ('m:mfrac'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mglyph" ADD COLUMN "__tag_kind_m_mglyph_24iju5mdym" "qti"."node_kind" GENERATED ALWAYS AS ('m:mglyph'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mi" ADD COLUMN "__tag_kind_m_mi_p7i7slzmp4" "qti"."node_kind" GENERATED ALWAYS AS ('m:mi'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_min" ADD COLUMN "__tag_kind_m_min_ptzeah4ns2" "qti"."node_kind" GENERATED ALWAYS AS ('m:min'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_minus" ADD COLUMN "__tag_kind_m_minus_hcem3twfsv" "qti"."node_kind" GENERATED ALWAYS AS ('m:minus'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mlabeledtr" ADD COLUMN "__tag_kind_m_mlabeledtr_j5pxrv3x2d" "qti"."node_kind" GENERATED ALWAYS AS ('m:mlabeledtr'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mlongdiv" ADD COLUMN "__tag_kind_m_mlongdiv_22mypvxzfm" "qti"."node_kind" GENERATED ALWAYS AS ('m:mlongdiv'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mmultiscripts" ADD COLUMN "__tag_kind_m_mmultiscripts_inoxa5l6ol" "qti"."node_kind" GENERATED ALWAYS AS ('m:mmultiscripts'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mn" ADD COLUMN "__tag_kind_m_mn_2penr6noah" "qti"."node_kind" GENERATED ALWAYS AS ('m:mn'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mo" ADD COLUMN "__tag_kind_m_mo_izsuukhwhz" "qti"."node_kind" GENERATED ALWAYS AS ('m:mo'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mode" ADD COLUMN "__tag_kind_m_mode_f2wxgo6k7y" "qti"."node_kind" GENERATED ALWAYS AS ('m:mode'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_moment" ADD COLUMN "__tag_kind_m_moment_r3exfc4eqr" "qti"."node_kind" GENERATED ALWAYS AS ('m:moment'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_momentabout" ADD COLUMN "__tag_kind_m_momentabout_jpx6cayxgs" "qti"."node_kind" GENERATED ALWAYS AS ('m:momentabout'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mover" ADD COLUMN "__tag_kind_m_mover_2sodqbv35q" "qti"."node_kind" GENERATED ALWAYS AS ('m:mover'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mpadded" ADD COLUMN "__tag_kind_m_mpadded_3vz5xdkeiw" "qti"."node_kind" GENERATED ALWAYS AS ('m:mpadded'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mpadded_length" ADD COLUMN "__tag_type_mpadded_length_h2bjgoqjt5" "qti"."mathml_value_type" GENERATED ALWAYS AS ('mpadded-length'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mphantom" ADD COLUMN "__tag_kind_m_mphantom_q5jic2y66l" "qti"."node_kind" GENERATED ALWAYS AS ('m:mphantom'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mprescripts" ADD COLUMN "__tag_kind_m_mprescripts_uf33moyqvt" "qti"."node_kind" GENERATED ALWAYS AS ('m:mprescripts'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mroot" ADD COLUMN "__tag_kind_m_mroot_qn2422dmq4" "qti"."node_kind" GENERATED ALWAYS AS ('m:mroot'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mrow" ADD COLUMN "__tag_kind_m_mrow_cytyvwkgdf" "qti"."node_kind" GENERATED ALWAYS AS ('m:mrow'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_ms" ADD COLUMN "__tag_kind_m_ms_pdgylwa6dz" "qti"."node_kind" GENERATED ALWAYS AS ('m:ms'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mscarries" ADD COLUMN "__tag_kind_m_mscarries_vkanwmtzz4" "qti"."node_kind" GENERATED ALWAYS AS ('m:mscarries'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mscarry" ADD COLUMN "__tag_kind_m_mscarry_ajupuy2i2b" "qti"."node_kind" GENERATED ALWAYS AS ('m:mscarry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_msgroup" ADD COLUMN "__tag_kind_m_msgroup_gc5kcdhb3n" "qti"."node_kind" GENERATED ALWAYS AS ('m:msgroup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_msline" ADD COLUMN "__tag_kind_m_msline_3vuunvoaru" "qti"."node_kind" GENERATED ALWAYS AS ('m:msline'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mspace" ADD COLUMN "__tag_kind_m_mspace_su7akczkbj" "qti"."node_kind" GENERATED ALWAYS AS ('m:mspace'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mspace_linebreak" ADD COLUMN "__tag_type_mspace_linebreak_2ttbtg2pof" "qti"."mathml_value_type" GENERATED ALWAYS AS ('mspace-linebreak'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_msqrt" ADD COLUMN "__tag_kind_m_msqrt_7jzntxzyfy" "qti"."node_kind" GENERATED ALWAYS AS ('m:msqrt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_msrow" ADD COLUMN "__tag_kind_m_msrow_j7ltxdt2up" "qti"."node_kind" GENERATED ALWAYS AS ('m:msrow'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mstack" ADD COLUMN "__tag_kind_m_mstack_gkm7obfda2" "qti"."node_kind" GENERATED ALWAYS AS ('m:mstack'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mstyle" ADD COLUMN "__tag_kind_m_mstyle_zxd3ckdwex" "qti"."node_kind" GENERATED ALWAYS AS ('m:mstyle'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_msub" ADD COLUMN "__tag_kind_m_msub_fjwntq3ri6" "qti"."node_kind" GENERATED ALWAYS AS ('m:msub'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_msubsup" ADD COLUMN "__tag_kind_m_msubsup_m3aq3rdyeg" "qti"."node_kind" GENERATED ALWAYS AS ('m:msubsup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_msup" ADD COLUMN "__tag_kind_m_msup_kwgtpz276e" "qti"."node_kind" GENERATED ALWAYS AS ('m:msup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mtable" ADD COLUMN "__tag_kind_m_mtable_ddkzxi42to" "qti"."node_kind" GENERATED ALWAYS AS ('m:mtable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mtd" ADD COLUMN "__tag_kind_m_mtd_zh62fovndd" "qti"."node_kind" GENERATED ALWAYS AS ('m:mtd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mtext" ADD COLUMN "__tag_kind_m_mtext_gjyzedp263" "qti"."node_kind" GENERATED ALWAYS AS ('m:mtext'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_mtr" ADD COLUMN "__tag_kind_m_mtr_tiryvttk6j" "qti"."node_kind" GENERATED ALWAYS AS ('m:mtr'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_munder" ADD COLUMN "__tag_kind_m_munder_xjdj25enzu" "qti"."node_kind" GENERATED ALWAYS AS ('m:munder'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_munderover" ADD COLUMN "__tag_kind_m_munderover_7rxt37agxh" "qti"."node_kind" GENERATED ALWAYS AS ('m:munderover'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_name" ADD COLUMN "__tag_type_name_g4vf3tlvtw" "qti"."mathml_value_type" GENERATED ALWAYS AS ('name'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_nargs" ADD COLUMN "__tag_type_nargs_ygqc7vdqpk" "qti"."mathml_value_type" GENERATED ALWAYS AS ('nargs'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_naturalnumbers" ADD COLUMN "__tag_kind_m_naturalnumbers_4si2qmk4bt" "qti"."node_kind" GENERATED ALWAYS AS ('m:naturalnumbers'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_neq" ADD COLUMN "__tag_kind_m_neq_sfxeauet33" "qti"."node_kind" GENERATED ALWAYS AS ('m:neq'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_none" ADD COLUMN "__tag_kind_m_none_txrqdn7o6t" "qti"."node_kind" GENERATED ALWAYS AS ('m:none'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_not" ADD COLUMN "__tag_kind_m_not_jf3l6qjxrd" "qti"."node_kind" GENERATED ALWAYS AS ('m:not'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_notanumber" ADD COLUMN "__tag_kind_m_notanumber_zucyyudpwj" "qti"."node_kind" GENERATED ALWAYS AS ('m:notanumber'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_notin" ADD COLUMN "__tag_kind_m_notin_gjm5pzhaib" "qti"."node_kind" GENERATED ALWAYS AS ('m:notin'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_notprsubset" ADD COLUMN "__tag_kind_m_notprsubset_mdvhlxpocq" "qti"."node_kind" GENERATED ALWAYS AS ('m:notprsubset'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_notsubset" ADD COLUMN "__tag_kind_m_notsubset_hyskqhass5" "qti"."node_kind" GENERATED ALWAYS AS ('m:notsubset'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_number" ADD COLUMN "__tag_type_number_su5a7mhmov" "qti"."mathml_value_type" GENERATED ALWAYS AS ('number'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_occurrence" ADD COLUMN "__tag_type_occurrence_poownjlqsd" "qti"."mathml_value_type" GENERATED ALWAYS AS ('occurrence'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_or" ADD COLUMN "__tag_kind_m_or_kw7pzhxnad" "qti"."node_kind" GENERATED ALWAYS AS ('m:or'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_order" ADD COLUMN "__tag_type_order_7gyulwkonz" "qti"."mathml_value_type" GENERATED ALWAYS AS ('order'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_otherwise" ADD COLUMN "__tag_kind_m_otherwise_a6zs5hnn2a" "qti"."node_kind" GENERATED ALWAYS AS ('m:otherwise'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_outerproduct" ADD COLUMN "__tag_kind_m_outerproduct_p4a4z6sd6m" "qti"."node_kind" GENERATED ALWAYS AS ('m:outerproduct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_overflow" ADD COLUMN "__tag_type_overflow_fijx4zdoiz" "qti"."mathml_value_type" GENERATED ALWAYS AS ('overflow'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_partialdiff" ADD COLUMN "__tag_kind_m_partialdiff_6ypsxmfpsd" "qti"."node_kind" GENERATED ALWAYS AS ('m:partialdiff'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_pi" ADD COLUMN "__tag_kind_m_pi_xvsqr7saep" "qti"."node_kind" GENERATED ALWAYS AS ('m:pi'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_piece" ADD COLUMN "__tag_kind_m_piece_k2ohxrzecs" "qti"."node_kind" GENERATED ALWAYS AS ('m:piece'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_piecewise" ADD COLUMN "__tag_kind_m_piecewise_hi4sytbaqh" "qti"."node_kind" GENERATED ALWAYS AS ('m:piecewise'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_plus" ADD COLUMN "__tag_kind_m_plus_4dxeflazpt" "qti"."node_kind" GENERATED ALWAYS AS ('m:plus'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_position" ADD COLUMN "__tag_type_position_ti5jyzvjus" "qti"."mathml_value_type" GENERATED ALWAYS AS ('position'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_power" ADD COLUMN "__tag_kind_m_power_6k56p2r42x" "qti"."node_kind" GENERATED ALWAYS AS ('m:power'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_primes" ADD COLUMN "__tag_kind_m_primes_tai2obwnjd" "qti"."node_kind" GENERATED ALWAYS AS ('m:primes'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_product" ADD COLUMN "__tag_kind_m_product_x3cdvrs3g2" "qti"."node_kind" GENERATED ALWAYS AS ('m:product'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_prsubset" ADD COLUMN "__tag_kind_m_prsubset_4gfelkzi7e" "qti"."node_kind" GENERATED ALWAYS AS ('m:prsubset'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_quotient" ADD COLUMN "__tag_kind_m_quotient_s2o75pem36" "qti"."node_kind" GENERATED ALWAYS AS ('m:quotient'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_rationals" ADD COLUMN "__tag_kind_m_rationals_2m5enf2oj2" "qti"."node_kind" GENERATED ALWAYS AS ('m:rationals'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_real" ADD COLUMN "__tag_kind_m_real_junglpuyjh" "qti"."node_kind" GENERATED ALWAYS AS ('m:real'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_reals" ADD COLUMN "__tag_kind_m_reals_sltmlx6eyd" "qti"."node_kind" GENERATED ALWAYS AS ('m:reals'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_reln" ADD COLUMN "__tag_kind_m_reln_bxlrw6pjny" "qti"."node_kind" GENERATED ALWAYS AS ('m:reln'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_rem" ADD COLUMN "__tag_kind_m_rem_hk2fhxi3j3" "qti"."node_kind" GENERATED ALWAYS AS ('m:rem'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_root" ADD COLUMN "__tag_kind_m_root_k3d4oyajlo" "qti"."node_kind" GENERATED ALWAYS AS ('m:root'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_rowalign" ADD COLUMN "__tag_type_rowalign_3qkoukbb5i" "qti"."mathml_value_type" GENERATED ALWAYS AS ('rowalign'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_scalarproduct" ADD COLUMN "__tag_kind_m_scalarproduct_ztm5elappz" "qti"."node_kind" GENERATED ALWAYS AS ('m:scalarproduct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_scriptlevel" ADD COLUMN "__tag_type_scriptlevel_lus7qdlwus" "qti"."mathml_value_type" GENERATED ALWAYS AS ('scriptlevel'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_sdev" ADD COLUMN "__tag_kind_m_sdev_ipab3uglwf" "qti"."node_kind" GENERATED ALWAYS AS ('m:sdev'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_sec" ADD COLUMN "__tag_kind_m_sec_6pbevmi5vg" "qti"."node_kind" GENERATED ALWAYS AS ('m:sec'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_sech" ADD COLUMN "__tag_kind_m_sech_bsdecxac2s" "qti"."node_kind" GENERATED ALWAYS AS ('m:sech'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_selection" ADD COLUMN "__tag_type_selection_jwgsaywsyr" "qti"."mathml_value_type" GENERATED ALWAYS AS ('selection'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_selector" ADD COLUMN "__tag_kind_m_selector_id2twbxgz4" "qti"."node_kind" GENERATED ALWAYS AS ('m:selector'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_semantics" ADD COLUMN "__tag_kind_m_semantics_hcelfkqiux" "qti"."node_kind" GENERATED ALWAYS AS ('m:semantics'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_semantics_ci" ADD COLUMN "__tag_kind_m_semantics_ci_kfs5kl2pxo" "qti"."node_kind" GENERATED ALWAYS AS ('m:semantics.ci'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_sep" ADD COLUMN "__tag_kind_m_sep_kkvavsjqnh" "qti"."node_kind" GENERATED ALWAYS AS ('m:sep'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_set" ADD COLUMN "__tag_kind_m_set_y2qu2mnt3k" "qti"."node_kind" GENERATED ALWAYS AS ('m:set'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_setdiff" ADD COLUMN "__tag_kind_m_setdiff_6ak6jezs3j" "qti"."node_kind" GENERATED ALWAYS AS ('m:setdiff'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_share" ADD COLUMN "__tag_kind_m_share_6yal6dljfx" "qti"."node_kind" GENERATED ALWAYS AS ('m:share'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_shift" ADD COLUMN "__tag_type_shift_apyvsvz66t" "qti"."mathml_value_type" GENERATED ALWAYS AS ('shift'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_side" ADD COLUMN "__tag_type_side_q47iymixud" "qti"."mathml_value_type" GENERATED ALWAYS AS ('side'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_sin" ADD COLUMN "__tag_kind_m_sin_5vyjm4llew" "qti"."node_kind" GENERATED ALWAYS AS ('m:sin'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_sinh" ADD COLUMN "__tag_kind_m_sinh_a5mwypfwvy" "qti"."node_kind" GENERATED ALWAYS AS ('m:sinh'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_span" ADD COLUMN "__tag_type_span_oltex6sebj" "qti"."mathml_value_type" GENERATED ALWAYS AS ('span'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_src" ADD COLUMN "__tag_type_src_lxnlnbl4zv" "qti"."mathml_value_type" GENERATED ALWAYS AS ('src'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_string" ADD COLUMN "__tag_type_string_in2ni326mz" "qti"."mathml_value_type" GENERATED ALWAYS AS ('string'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_subset" ADD COLUMN "__tag_kind_m_subset_jwykfgzkcc" "qti"."node_kind" GENERATED ALWAYS AS ('m:subset'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_sum" ADD COLUMN "__tag_kind_m_sum_eygixfvnhj" "qti"."node_kind" GENERATED ALWAYS AS ('m:sum'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_table_width" ADD COLUMN "__tag_type_table_width_pplztankwm" "qti"."mathml_value_type" GENERATED ALWAYS AS ('table-width'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_tan" ADD COLUMN "__tag_kind_m_tan_ccevpfe55o" "qti"."node_kind" GENERATED ALWAYS AS ('m:tan'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_tanh" ADD COLUMN "__tag_kind_m_tanh_th7rxeblxr" "qti"."node_kind" GENERATED ALWAYS AS ('m:tanh'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_tendsto" ADD COLUMN "__tag_kind_m_tendsto_v6sdqp7osp" "qti"."node_kind" GENERATED ALWAYS AS ('m:tendsto'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_times" ADD COLUMN "__tag_kind_m_times_xfa335sssc" "qti"."node_kind" GENERATED ALWAYS AS ('m:times'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_transpose" ADD COLUMN "__tag_kind_m_transpose_vim66kqtck" "qti"."node_kind" GENERATED ALWAYS AS ('m:transpose'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_true" ADD COLUMN "__tag_kind_m_true_ggyj63hsze" "qti"."node_kind" GENERATED ALWAYS AS ('m:true'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_union" ADD COLUMN "__tag_kind_m_union_6kcpnf2mlo" "qti"."node_kind" GENERATED ALWAYS AS ('m:union'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_unsigned_integer" ADD COLUMN "__tag_type_unsigned_integer_gnblpmuiy3" "qti"."mathml_value_type" GENERATED ALWAYS AS ('unsigned-integer'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_uplimit" ADD COLUMN "__tag_kind_m_uplimit_6whdpi7iqh" "qti"."node_kind" GENERATED ALWAYS AS ('m:uplimit'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_variance" ADD COLUMN "__tag_kind_m_variance_ugqyybctnb" "qti"."node_kind" GENERATED ALWAYS AS ('m:variance'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_vector" ADD COLUMN "__tag_kind_m_vector_o7zppitxuw" "qti"."node_kind" GENERATED ALWAYS AS ('m:vector'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_vectorproduct" ADD COLUMN "__tag_kind_m_vectorproduct_l2jltqqlem" "qti"."node_kind" GENERATED ALWAYS AS ('m:vectorproduct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mathml_verticalalign" ADD COLUMN "__tag_type_verticalalign_l4kt5q657l" "qti"."mathml_value_type" GENERATED ALWAYS AS ('verticalalign'::"qti"."mathml_value_type") STORED NOT NULL;

ALTER TABLE "qti"."mathml_xor" ADD COLUMN "__tag_kind_m_xor_raim3zhwns" "qti"."node_kind" GENERATED ALWAYS AS ('m:xor'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."node_class" ADD CONSTRAINT "node_class_not_mathml" CHECK ((NOT "kind" IN ('m:math'::"qti"."node_kind", 'm:abs'::"qti"."node_kind", 'm:and'::"qti"."node_kind", 'm:annotation'::"qti"."node_kind", 'm:annotation-xml'::"qti"."node_kind", 'm:apply'::"qti"."node_kind", 'm:approx'::"qti"."node_kind", 'm:arccos'::"qti"."node_kind", 'm:arccosh'::"qti"."node_kind", 'm:arccot'::"qti"."node_kind", 'm:arccoth'::"qti"."node_kind", 'm:arccsc'::"qti"."node_kind", 'm:arccsch'::"qti"."node_kind", 'm:arcsec'::"qti"."node_kind", 'm:arcsech'::"qti"."node_kind", 'm:arcsin'::"qti"."node_kind", 'm:arcsinh'::"qti"."node_kind", 'm:arctan'::"qti"."node_kind", 'm:arctanh'::"qti"."node_kind", 'm:arg'::"qti"."node_kind", 'm:bind'::"qti"."node_kind", 'm:bvar'::"qti"."node_kind", 'm:card'::"qti"."node_kind", 'm:cartesianproduct'::"qti"."node_kind", 'm:cbytes'::"qti"."node_kind", 'm:ceiling'::"qti"."node_kind", 'm:cerror'::"qti"."node_kind", 'm:ci'::"qti"."node_kind", 'm:cn'::"qti"."node_kind", 'm:codomain'::"qti"."node_kind", 'm:complexes'::"qti"."node_kind", 'm:compose'::"qti"."node_kind", 'm:conjugate'::"qti"."node_kind", 'm:cos'::"qti"."node_kind", 'm:cosh'::"qti"."node_kind", 'm:cot'::"qti"."node_kind", 'm:coth'::"qti"."node_kind", 'm:cs'::"qti"."node_kind", 'm:csc'::"qti"."node_kind", 'm:csch'::"qti"."node_kind", 'm:csymbol'::"qti"."node_kind", 'm:curl'::"qti"."node_kind", 'm:determinant'::"qti"."node_kind", 'm:diff'::"qti"."node_kind", 'm:divergence'::"qti"."node_kind", 'm:divide'::"qti"."node_kind", 'm:domain'::"qti"."node_kind", 'm:emptyset'::"qti"."node_kind", 'm:eq'::"qti"."node_kind", 'm:equivalent'::"qti"."node_kind", 'm:eulergamma'::"qti"."node_kind", 'm:exists'::"qti"."node_kind", 'm:exp'::"qti"."node_kind", 'm:exponentiale'::"qti"."node_kind", 'm:factorial'::"qti"."node_kind", 'm:factorof'::"qti"."node_kind", 'm:false'::"qti"."node_kind", 'm:floor'::"qti"."node_kind", 'm:forall'::"qti"."node_kind", 'm:gcd'::"qti"."node_kind", 'm:geq'::"qti"."node_kind", 'm:grad'::"qti"."node_kind", 'm:gt'::"qti"."node_kind", 'm:ident'::"qti"."node_kind", 'm:image'::"qti"."node_kind", 'm:imaginary'::"qti"."node_kind", 'm:imaginaryi'::"qti"."node_kind", 'm:implies'::"qti"."node_kind", 'm:in'::"qti"."node_kind", 'm:infinity'::"qti"."node_kind", 'm:int'::"qti"."node_kind", 'm:integers'::"qti"."node_kind", 'm:intersect'::"qti"."node_kind", 'm:interval'::"qti"."node_kind", 'm:inverse'::"qti"."node_kind", 'm:lambda'::"qti"."node_kind", 'm:laplacian'::"qti"."node_kind", 'm:lcm'::"qti"."node_kind", 'm:leq'::"qti"."node_kind", 'm:limit'::"qti"."node_kind", 'm:list'::"qti"."node_kind", 'm:ln'::"qti"."node_kind", 'm:log'::"qti"."node_kind", 'm:lt'::"qti"."node_kind", 'm:maction'::"qti"."node_kind", 'm:maligngroup'::"qti"."node_kind", 'm:malignmark'::"qti"."node_kind", 'm:matrix'::"qti"."node_kind", 'm:matrixrow'::"qti"."node_kind", 'm:max'::"qti"."node_kind", 'm:mean'::"qti"."node_kind", 'm:median'::"qti"."node_kind", 'm:menclose'::"qti"."node_kind", 'm:merror'::"qti"."node_kind", 'm:mfenced'::"qti"."node_kind", 'm:mfrac'::"qti"."node_kind", 'm:mglyph'::"qti"."node_kind", 'm:mi'::"qti"."node_kind", 'm:min'::"qti"."node_kind", 'm:minus'::"qti"."node_kind", 'm:mlabeledtr'::"qti"."node_kind", 'm:mlongdiv'::"qti"."node_kind", 'm:mmultiscripts'::"qti"."node_kind", 'm:mn'::"qti"."node_kind", 'm:mo'::"qti"."node_kind", 'm:mode'::"qti"."node_kind", 'm:moment'::"qti"."node_kind", 'm:mover'::"qti"."node_kind", 'm:mpadded'::"qti"."node_kind", 'm:mphantom'::"qti"."node_kind", 'm:mprescripts'::"qti"."node_kind", 'm:mroot'::"qti"."node_kind", 'm:mrow'::"qti"."node_kind", 'm:ms'::"qti"."node_kind", 'm:mscarries'::"qti"."node_kind", 'm:mscarry'::"qti"."node_kind", 'm:msgroup'::"qti"."node_kind", 'm:msline'::"qti"."node_kind", 'm:mspace'::"qti"."node_kind", 'm:msqrt'::"qti"."node_kind", 'm:msrow'::"qti"."node_kind", 'm:mstack'::"qti"."node_kind", 'm:mstyle'::"qti"."node_kind", 'm:msub'::"qti"."node_kind", 'm:msubsup'::"qti"."node_kind", 'm:msup'::"qti"."node_kind", 'm:mtable'::"qti"."node_kind", 'm:mtd'::"qti"."node_kind", 'm:mtext'::"qti"."node_kind", 'm:mtr'::"qti"."node_kind", 'm:munder'::"qti"."node_kind", 'm:munderover'::"qti"."node_kind", 'm:naturalnumbers'::"qti"."node_kind", 'm:neq'::"qti"."node_kind", 'm:none'::"qti"."node_kind", 'm:not'::"qti"."node_kind", 'm:notanumber'::"qti"."node_kind", 'm:notin'::"qti"."node_kind", 'm:notprsubset'::"qti"."node_kind", 'm:notsubset'::"qti"."node_kind", 'm:or'::"qti"."node_kind", 'm:otherwise'::"qti"."node_kind", 'm:outerproduct'::"qti"."node_kind", 'm:partialdiff'::"qti"."node_kind", 'm:pi'::"qti"."node_kind", 'm:piece'::"qti"."node_kind", 'm:piecewise'::"qti"."node_kind", 'm:plus'::"qti"."node_kind", 'm:power'::"qti"."node_kind", 'm:primes'::"qti"."node_kind", 'm:product'::"qti"."node_kind", 'm:prsubset'::"qti"."node_kind", 'm:quotient'::"qti"."node_kind", 'm:rationals'::"qti"."node_kind", 'm:real'::"qti"."node_kind", 'm:reals'::"qti"."node_kind", 'm:rem'::"qti"."node_kind", 'm:root'::"qti"."node_kind", 'm:scalarproduct'::"qti"."node_kind", 'm:sdev'::"qti"."node_kind", 'm:sec'::"qti"."node_kind", 'm:sech'::"qti"."node_kind", 'm:selector'::"qti"."node_kind", 'm:semantics'::"qti"."node_kind", 'm:semantics.ci'::"qti"."node_kind", 'm:set'::"qti"."node_kind", 'm:setdiff'::"qti"."node_kind", 'm:share'::"qti"."node_kind", 'm:sin'::"qti"."node_kind", 'm:sinh'::"qti"."node_kind", 'm:subset'::"qti"."node_kind", 'm:sum'::"qti"."node_kind", 'm:tan'::"qti"."node_kind", 'm:tanh'::"qti"."node_kind", 'm:tendsto'::"qti"."node_kind", 'm:times'::"qti"."node_kind", 'm:transpose'::"qti"."node_kind", 'm:true'::"qti"."node_kind", 'm:union'::"qti"."node_kind", 'm:variance'::"qti"."node_kind", 'm:vector'::"qti"."node_kind", 'm:vectorproduct'::"qti"."node_kind", 'm:xor'::"qti"."node_kind")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."node_dir" ADD CONSTRAINT "node_dir_not_mathml" CHECK ((NOT "kind" IN ('m:math'::"qti"."node_kind", 'm:mi'::"qti"."node_kind", 'm:mn'::"qti"."node_kind", 'm:mo'::"qti"."node_kind", 'm:mrow'::"qti"."node_kind", 'm:ms'::"qti"."node_kind", 'm:mspace'::"qti"."node_kind", 'm:mstyle'::"qti"."node_kind", 'm:mtext'::"qti"."node_kind")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."mathml_abs" ADD CONSTRAINT "__mathml_abs_fk_id_tag_kind_m_abs_5_ggr_4_en_2_fg_4lbjouslfi" FOREIGN KEY ("id", "__tag_kind_m_abs_5ggr4en2fg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_align" ADD CONSTRAINT "__mathml_align_fk_kind_attribute_tag_type_align_rz_4_fkuwguty6o" FOREIGN KEY ("kind", "attribute", "__tag_type_align_rz4q2q2vpi") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_align" ADD CONSTRAINT "__mathml_align_fk_node_kind_ao4jbqomjm" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_alignmentscope" ADD CONSTRAINT "__mathml_alignmentscope_fk_kind_attribute_tag_type_7kf4orxk3i" FOREIGN KEY ("kind", "attribute", "__tag_type_alignmentscope_ksiai53b3c") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_alignmentscope" ADD CONSTRAINT "__mathml_alignmentscope_fk_node_kind_mthv5o2xhe" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_altimg_valign" ADD CONSTRAINT "__mathml_altimg_valign_fk_kind_attribute_tag_type_ifi43kl3am" FOREIGN KEY ("kind", "attribute", "__tag_type_altimg_valign_4g6yyfcca6") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_altimg_valign" ADD CONSTRAINT "__mathml_altimg_valign_fk_node_kind_gvqw3acsxy" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_and" ADD CONSTRAINT "__mathml_and_fk_id_tag_kind_m_and_eisrasbaaj_pbiigtr6lm" FOREIGN KEY ("id", "__tag_kind_m_and_eisrasbaaj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_annotation" ADD CONSTRAINT "__mathml_annotation_fk_id_tag_kind_m_annotation_ze_5_wk724xgyzm" FOREIGN KEY ("id", "__tag_kind_m_annotation_ze5ecrwj65") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_annotation_xml" ADD CONSTRAINT "__mathml_annotation_xml_fk_id_tag_kind_m_annotation_f746em2qky" FOREIGN KEY ("id", "__tag_kind_m_annotation_xml_wd6za7y2z6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_apply" ADD CONSTRAINT "__mathml_apply_fk_id_tag_kind_m_apply_bengchb_6_nb_6rutusltw6" FOREIGN KEY ("id", "__tag_kind_m_apply_bengchb6nb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_approx" ADD CONSTRAINT "__mathml_approx_fk_id_tag_kind_m_approx_ybgbzwajac_d5awmjfx2g" FOREIGN KEY ("id", "__tag_kind_m_approx_ybgbzwajac") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arccos" ADD CONSTRAINT "__mathml_arccos_fk_id_tag_kind_m_arccos_ytmvopxit_3_jefuepx4bx" FOREIGN KEY ("id", "__tag_kind_m_arccos_ytmvopxit3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arccosh" ADD CONSTRAINT "__mathml_arccosh_fk_id_tag_kind_m_arccosh_cnra_4_q_6_t7vgxjjvl5" FOREIGN KEY ("id", "__tag_kind_m_arccosh_cnra4q6n4l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arccot" ADD CONSTRAINT "__mathml_arccot_fk_id_tag_kind_m_arccot_63_he_22_7jvezuk4fm" FOREIGN KEY ("id", "__tag_kind_m_arccot_63he22ouqq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arccoth" ADD CONSTRAINT "__mathml_arccoth_fk_id_tag_kind_m_arccoth_3_luoi_3_2yvquj6iiw" FOREIGN KEY ("id", "__tag_kind_m_arccoth_3luoi3xwu7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arccsc" ADD CONSTRAINT "__mathml_arccsc_fk_id_tag_kind_m_arccsc_rnbrap_3_tp_t6bxkukuuz" FOREIGN KEY ("id", "__tag_kind_m_arccsc_rnbrap3tp7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arccsch" ADD CONSTRAINT "__mathml_arccsch_fk_id_tag_kind_m_arccsch_rmwi_7_kps5uzllwn" FOREIGN KEY ("id", "__tag_kind_m_arccsch_rmwi7hbeqe") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arcsec" ADD CONSTRAINT "__mathml_arcsec_fk_id_tag_kind_m_arcsec_psxegloodo_nl7llpz3rz" FOREIGN KEY ("id", "__tag_kind_m_arcsec_psxegloodo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arcsech" ADD CONSTRAINT "__mathml_arcsech_fk_id_tag_kind_m_arcsech_i_6_dbeh_5_drifsm2k7a" FOREIGN KEY ("id", "__tag_kind_m_arcsech_i6dbeh5zx5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arcsin" ADD CONSTRAINT "__mathml_arcsin_fk_id_tag_kind_m_arcsin_ctwb_3_wrgwt_cv2qaggnw6" FOREIGN KEY ("id", "__tag_kind_m_arcsin_ctwb3wrgwt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arcsinh" ADD CONSTRAINT "__mathml_arcsinh_fk_id_tag_kind_m_arcsinh_3_b6fb3fwy4h" FOREIGN KEY ("id", "__tag_kind_m_arcsinh_3dysnvaqqn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arctan" ADD CONSTRAINT "__mathml_arctan_fk_id_tag_kind_m_arctan_soi_2_gc_3_xrevisk2eu" FOREIGN KEY ("id", "__tag_kind_m_arctan_soi2gc3vnc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arctanh" ADD CONSTRAINT "__mathml_arctanh_fk_id_tag_kind_m_arctanh_zaaffkrj_3_sewuzdx4tv" FOREIGN KEY ("id", "__tag_kind_m_arctanh_zaaffkrj3r") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_arg" ADD CONSTRAINT "__mathml_arg_fk_id_tag_kind_m_arg_7_stlghlgbd_ycllxvvwoc" FOREIGN KEY ("id", "__tag_kind_m_arg_7stlghlgbd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_attribute_type" ADD CONSTRAINT "__mathml_attribute_type_fk_kind_attribute_ltoui223al" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."mathml_background" ADD CONSTRAINT "__mathml_background_fk_kind_attribute_tag_type_h2l4hx27v7" FOREIGN KEY ("kind", "attribute", "__tag_type_background_azuiwrri3s") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_background" ADD CONSTRAINT "__mathml_background_fk_node_kind_5lavjv6suf" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_base" ADD CONSTRAINT "__mathml_base_fk_kind_attribute_tag_type_base_2qp7upchqs" FOREIGN KEY ("kind", "attribute", "__tag_type_base_ssbqmyk7xw") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_base" ADD CONSTRAINT "__mathml_base_fk_node_kind_uvbija4irl" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_bind" ADD CONSTRAINT "__mathml_bind_fk_id_tag_kind_m_bind_bqadgfn_5_un_dtvis5c2uv" FOREIGN KEY ("id", "__tag_kind_m_bind_bqadgfn5un") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_boolean" ADD CONSTRAINT "__mathml_boolean_fk_kind_attribute_tag_type_boolean_d7dv2gdsjx" FOREIGN KEY ("kind", "attribute", "__tag_type_boolean_ovtjlq2nwu") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_boolean" ADD CONSTRAINT "__mathml_boolean_fk_node_kind_ei7fjgsr5v" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_bvar" ADD CONSTRAINT "__mathml_bvar_fk_id_tag_kind_m_bvar_zt_42_o_25_tfs_zygggnuuct" FOREIGN KEY ("id", "__tag_kind_m_bvar_zt42o25tfs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_card" ADD CONSTRAINT "__mathml_card_fk_id_tag_kind_m_card_til_5_kekpth_mifeqm4qjq" FOREIGN KEY ("id", "__tag_kind_m_card_til5kekpth") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cartesianproduct" ADD CONSTRAINT "__mathml_cartesianproduct_fk_id_tag_kind_m_4szbpju44w" FOREIGN KEY ("id", "__tag_kind_m_cartesianproduct_drgcnkhoeu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cbytes" ADD CONSTRAINT "__mathml_cbytes_fk_id_tag_kind_m_cbytes_feg_57_xr_5_vsw43de5q5" FOREIGN KEY ("id", "__tag_kind_m_cbytes_feg57xr5pi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cd" ADD CONSTRAINT "__mathml_cd_fk_kind_attribute_tag_type_cd_asogh_6_i_sfdrvslico" FOREIGN KEY ("kind", "attribute", "__tag_type_cd_asogh6i35g") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cd" ADD CONSTRAINT "__mathml_cd_fk_node_kind_h2ksrvxxlu" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cdgroup" ADD CONSTRAINT "__mathml_cdgroup_fk_kind_attribute_tag_type_cdgroup_43mdridalg" FOREIGN KEY ("kind", "attribute", "__tag_type_cdgroup_swev5xcnud") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cdgroup" ADD CONSTRAINT "__mathml_cdgroup_fk_node_kind_uutf6aosbz" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_ceiling" ADD CONSTRAINT "__mathml_ceiling_fk_id_tag_kind_m_ceiling_tvv_3_pqo_oqgjplblwq" FOREIGN KEY ("id", "__tag_kind_m_ceiling_tvv3pqo4kc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cerror" ADD CONSTRAINT "__mathml_cerror_fk_id_tag_kind_m_cerror_solhxcpqpl_g5oqy7g4k2" FOREIGN KEY ("id", "__tag_kind_m_cerror_solhxcpqpl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_character" ADD CONSTRAINT "__mathml_character_fk_kind_attribute_tag_type_cgbe2h3eyf" FOREIGN KEY ("kind", "attribute", "__tag_type_character_kcgxmhefxo") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_character" ADD CONSTRAINT "__mathml_character_fk_node_kind_nfwn5v4d5l" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_charspacing" ADD CONSTRAINT "__mathml_charspacing_fk_kind_attribute_tag_type_iarkgg2wly" FOREIGN KEY ("kind", "attribute", "__tag_type_charspacing_3o6btzcp65") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_charspacing" ADD CONSTRAINT "__mathml_charspacing_fk_node_kind_lsgsnlwwos" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_ci" ADD CONSTRAINT "__mathml_ci_fk_id_tag_kind_m_ci_kcbsfo_2_k_3_x_rjmydrw7vi" FOREIGN KEY ("id", "__tag_kind_m_ci_kcbsfo2k3x") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_class" ADD CONSTRAINT "__mathml_class_fk_kind_attribute_tag_type_class_lpapzzy6ql" FOREIGN KEY ("kind", "attribute", "__tag_type_class_uhlcorrx6k") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_class" ADD CONSTRAINT "__mathml_class_fk_node_kind_pdnh7z6gxu" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_closure" ADD CONSTRAINT "__mathml_closure_fk_kind_attribute_tag_type_closure_os5blpxusd" FOREIGN KEY ("kind", "attribute", "__tag_type_closure_ojw7a4ueed") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_closure" ADD CONSTRAINT "__mathml_closure_fk_node_kind_2ww4wadcdx" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cn" ADD CONSTRAINT "__mathml_cn_fk_id_tag_kind_m_cn_nm_5_smoaq_3_e_waizgsshof" FOREIGN KEY ("id", "__tag_kind_m_cn_nm5smoaq3e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_codomain" ADD CONSTRAINT "__mathml_codomain_fk_id_tag_kind_m_codomain_isect_7_3uvuqrpjpi" FOREIGN KEY ("id", "__tag_kind_m_codomain_isect7ufnh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_color" ADD CONSTRAINT "__mathml_color_fk_kind_attribute_tag_type_color_xo_6_y6urggkcpb" FOREIGN KEY ("kind", "attribute", "__tag_type_color_xo6xrxwyju") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_color" ADD CONSTRAINT "__mathml_color_fk_node_kind_ybngyltvys" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_columnalign" ADD CONSTRAINT "__mathml_columnalign_fk_kind_attribute_tag_type_ftcs5afipe" FOREIGN KEY ("kind", "attribute", "__tag_type_columnalign_gm65bdikjd") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_columnalign" ADD CONSTRAINT "__mathml_columnalign_fk_node_kind_spzxs27qx5" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_columnalignstyle" ADD CONSTRAINT "__mathml_columnalignstyle_fk_kind_attribute_tag_type_r5su6jpyti" FOREIGN KEY ("kind", "attribute", "__tag_type_columnalignstyle_llipaw2n3g") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_columnalignstyle" ADD CONSTRAINT "__mathml_columnalignstyle_fk_node_kind_lz6c6hjzpw" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_columnwidth" ADD CONSTRAINT "__mathml_columnwidth_fk_kind_attribute_tag_type_blgmyvy4hy" FOREIGN KEY ("kind", "attribute", "__tag_type_columnwidth_2ohzautbjs") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_columnwidth" ADD CONSTRAINT "__mathml_columnwidth_fk_node_kind_fqekboclj7" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_complexes" ADD CONSTRAINT "__mathml_complexes_fk_id_tag_kind_m_complexes_b5l2dg6otu" FOREIGN KEY ("id", "__tag_kind_m_complexes_mpuqcbf6mf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_compose" ADD CONSTRAINT "__mathml_compose_fk_id_tag_kind_m_compose_iirxxezxih_bpzvii65ok" FOREIGN KEY ("id", "__tag_kind_m_compose_iirxxezxih") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_condition" ADD CONSTRAINT "__mathml_condition_fk_id_tag_kind_m_condition_vtetfd7vru" FOREIGN KEY ("id", "__tag_kind_m_condition_kxzfowxslw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_conjugate" ADD CONSTRAINT "__mathml_conjugate_fk_id_tag_kind_m_conjugate_ikcpb_p7hqyj6bfy" FOREIGN KEY ("id", "__tag_kind_m_conjugate_ikcpb4fov7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cos" ADD CONSTRAINT "__mathml_cos_fk_id_tag_kind_m_cos_bm_6_qwenqd_5_bidh5ryrlp" FOREIGN KEY ("id", "__tag_kind_m_cos_bm6qwenqd5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cosh" ADD CONSTRAINT "__mathml_cosh_fk_id_tag_kind_m_cosh_p_3_nqsbayow_cn3tw3wel3" FOREIGN KEY ("id", "__tag_kind_m_cosh_p3nqsbayow") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cot" ADD CONSTRAINT "__mathml_cot_fk_id_tag_kind_m_cot_5_mkoifjifu_thtbmcax3p" FOREIGN KEY ("id", "__tag_kind_m_cot_5mkoifjifu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_coth" ADD CONSTRAINT "__mathml_coth_fk_id_tag_kind_m_coth_czjsavr_4_hx_prokexw44j" FOREIGN KEY ("id", "__tag_kind_m_coth_czjsavr4hx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_crossout" ADD CONSTRAINT "__mathml_crossout_fk_kind_attribute_tag_type_n6e55e4pe7" FOREIGN KEY ("kind", "attribute", "__tag_type_crossout_ayzqk3upcx") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_crossout" ADD CONSTRAINT "__mathml_crossout_fk_node_kind_e5paxrjqxu" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_cs" ADD CONSTRAINT "__mathml_cs_fk_id_tag_kind_m_cs_7_lhn_577_snb_3jxs5owsbk" FOREIGN KEY ("id", "__tag_kind_m_cs_7lhn577snb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_csc" ADD CONSTRAINT "__mathml_csc_fk_id_tag_kind_m_csc_euk_34_eaz_5_r_laoeexj47a" FOREIGN KEY ("id", "__tag_kind_m_csc_euk34eaz5r") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_csch" ADD CONSTRAINT "__mathml_csch_fk_id_tag_kind_m_csch_pp_6_ieubxgw_vltklzlo6w" FOREIGN KEY ("id", "__tag_kind_m_csch_pp6ieubxgw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_csymbol" ADD CONSTRAINT "__mathml_csymbol_fk_id_tag_kind_m_csymbol_poho_6_k_6_c3gv3gevmm" FOREIGN KEY ("id", "__tag_kind_m_csymbol_poho6k6bbq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_curl" ADD CONSTRAINT "__mathml_curl_fk_id_tag_kind_m_curl_iuyimyhcei_njbbkitsbd" FOREIGN KEY ("id", "__tag_kind_m_curl_iuyimyhcei") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_declare" ADD CONSTRAINT "__mathml_declare_fk_id_tag_kind_m_declare_du_6_mqjef6m4nx" FOREIGN KEY ("id", "__tag_kind_m_declare_du6gfazyqy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_definition_url" ADD CONSTRAINT "__mathml_definition_url_fk_kind_attribute_tag_type_667lglkc4e" FOREIGN KEY ("kind", "attribute", "__tag_type_definition_url_mm24nzp6au") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_definition_url" ADD CONSTRAINT "__mathml_definition_url_fk_node_kind_syhw5pongw" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_degree" ADD CONSTRAINT "__mathml_degree_fk_id_tag_kind_m_degree_gdpkq_3_qbuh_jlolnhkpnv" FOREIGN KEY ("id", "__tag_kind_m_degree_gdpkq3qbuh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_determinant" ADD CONSTRAINT "__mathml_determinant_fk_id_tag_kind_m_determinant_ho_g5sfoy4onl" FOREIGN KEY ("id", "__tag_kind_m_determinant_ho2trt5jwg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_diff" ADD CONSTRAINT "__mathml_diff_fk_id_tag_kind_m_diff_qwzgjscjjh_db6djj5lc5" FOREIGN KEY ("id", "__tag_kind_m_diff_qwzgjscjjh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_dir" ADD CONSTRAINT "__mathml_dir_fk_kind_attribute_tag_type_dir_56_5nz3gfsdb5" FOREIGN KEY ("kind", "attribute", "__tag_type_dir_56vobbgcmu") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_dir" ADD CONSTRAINT "__mathml_dir_fk_node_kind_rdl7xjkwrd" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_display" ADD CONSTRAINT "__mathml_display_fk_kind_attribute_tag_type_display_5vcxgu6itr" FOREIGN KEY ("kind", "attribute", "__tag_type_display_q4wgbtruhu") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_display" ADD CONSTRAINT "__mathml_display_fk_node_kind_isbrlylczt" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_divergence" ADD CONSTRAINT "__mathml_divergence_fk_id_tag_kind_m_divergence_lf_7_rephmcheow" FOREIGN KEY ("id", "__tag_kind_m_divergence_lf7s2l7csn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_divide" ADD CONSTRAINT "__mathml_divide_fk_id_tag_kind_m_divide_hljq_3_bljki_7qd3ykyfke" FOREIGN KEY ("id", "__tag_kind_m_divide_hljq3bljki") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_domain" ADD CONSTRAINT "__mathml_domain_fk_id_tag_kind_m_domain_f_636_fecyb_wmdbd4eos3" FOREIGN KEY ("id", "__tag_kind_m_domain_f636fecyb3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_domainofapplication" ADD CONSTRAINT "__mathml_domainofapplication_fk_id_tag_kind_m_cc7ybatqhc" FOREIGN KEY ("id", "__tag_kind_m_domainofapplication_p32lmqyvju") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_edge" ADD CONSTRAINT "__mathml_edge_fk_kind_attribute_tag_type_edge_jmuqtvx7of" FOREIGN KEY ("kind", "attribute", "__tag_type_edge_iuoelrniia") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_edge" ADD CONSTRAINT "__mathml_edge_fk_node_kind_ockotj2udv" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_embed_source" ADD CONSTRAINT "__mathml_embed_source_fk_kind_attribute_tag_type_53rem3desg" FOREIGN KEY ("kind", "attribute", "__tag_type_embed_source_n7fs6bfobb") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_embed_source" ADD CONSTRAINT "__mathml_embed_source_fk_node_kind_bqd4uagn3a" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_emptyset" ADD CONSTRAINT "__mathml_emptyset_fk_id_tag_kind_m_emptyset_al53elckcx" FOREIGN KEY ("id", "__tag_kind_m_emptyset_tgxutwjcbv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_eq" ADD CONSTRAINT "__mathml_eq_fk_id_tag_kind_m_eq_zt_2_uyo_5_zmx_443aq3opvz" FOREIGN KEY ("id", "__tag_kind_m_eq_zt2uyo5zmx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_equivalent" ADD CONSTRAINT "__mathml_equivalent_fk_id_tag_kind_m_equivalent_chw_o6p24v4ftr" FOREIGN KEY ("id", "__tag_kind_m_equivalent_chw7c3l2pg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_eulergamma" ADD CONSTRAINT "__mathml_eulergamma_fk_id_tag_kind_m_eulergamma_7_t4ih2jklx2" FOREIGN KEY ("id", "__tag_kind_m_eulergamma_7vwknmgaz3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_exists" ADD CONSTRAINT "__mathml_exists_fk_id_tag_kind_m_exists_26_megfczw_3_ht4z3m6z3s" FOREIGN KEY ("id", "__tag_kind_m_exists_26megfczw3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_exp" ADD CONSTRAINT "__mathml_exp_fk_id_tag_kind_m_exp_hp_5_qgqr_6_mo_pb2txph7zu" FOREIGN KEY ("id", "__tag_kind_m_exp_hp5qgqr6mo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_exponentiale" ADD CONSTRAINT "__mathml_exponentiale_fk_id_tag_kind_m_exponentiale_3kh44loljn" FOREIGN KEY ("id", "__tag_kind_m_exponentiale_n3bg467okv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_factorial" ADD CONSTRAINT "__mathml_factorial_fk_id_tag_kind_m_factorial_luq_3_4s42qqrg3d" FOREIGN KEY ("id", "__tag_kind_m_factorial_luq3tna6il") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_factorof" ADD CONSTRAINT "__mathml_factorof_fk_id_tag_kind_m_factorof_7_zjnxd23gy6" FOREIGN KEY ("id", "__tag_kind_m_factorof_7mkqtxhp6r") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_false" ADD CONSTRAINT "__mathml_false_fk_id_tag_kind_m_false_2_lwwbihgiq_btsi2utrz5" FOREIGN KEY ("id", "__tag_kind_m_false_2lwwbihgiq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_floor" ADD CONSTRAINT "__mathml_floor_fk_id_tag_kind_m_floor_ldoeltb_3_g_2_7zgwnudboi" FOREIGN KEY ("id", "__tag_kind_m_floor_ldoeltb3g2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_fn" ADD CONSTRAINT "__mathml_fn_fk_id_tag_kind_m_fn_4_bvdfdhf_5_b_4qbfozkric" FOREIGN KEY ("id", "__tag_kind_m_fn_4bvdfdhf5b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_fontstyle" ADD CONSTRAINT "__mathml_fontstyle_fk_kind_attribute_tag_type_hx5o7vpyna" FOREIGN KEY ("kind", "attribute", "__tag_type_fontstyle_phcqb3bvk2") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_fontstyle" ADD CONSTRAINT "__mathml_fontstyle_fk_node_kind_hufkghtzzm" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_fontweight" ADD CONSTRAINT "__mathml_fontweight_fk_kind_attribute_tag_type_h6piorbjoo" FOREIGN KEY ("kind", "attribute", "__tag_type_fontweight_uinmbdi34f") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_fontweight" ADD CONSTRAINT "__mathml_fontweight_fk_node_kind_2pb4ssfylm" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_forall" ADD CONSTRAINT "__mathml_forall_fk_id_tag_kind_m_forall_ef_26_ntzivb_a3xxliz6oc" FOREIGN KEY ("id", "__tag_kind_m_forall_ef26ntzivb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_form" ADD CONSTRAINT "__mathml_form_fk_kind_attribute_tag_type_form_4j33w5dbrj" FOREIGN KEY ("kind", "attribute", "__tag_type_form_gdgsyoa7tz") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_form" ADD CONSTRAINT "__mathml_form_fk_node_kind_5jojixnnqy" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_framespacing" ADD CONSTRAINT "__mathml_framespacing_fk_kind_attribute_tag_type_3tl3hbytkx" FOREIGN KEY ("kind", "attribute", "__tag_type_framespacing_npn4kimxhg") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_framespacing" ADD CONSTRAINT "__mathml_framespacing_fk_node_kind_jfzexcnu2a" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_gcd" ADD CONSTRAINT "__mathml_gcd_fk_id_tag_kind_m_gcd_xa_57_vvjg_5_a_theqnyqhtq" FOREIGN KEY ("id", "__tag_kind_m_gcd_xa57vvjg5a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_geq" ADD CONSTRAINT "__mathml_geq_fk_id_tag_kind_m_geq_n_5_wokg_4_gqv_t4zxz5powx" FOREIGN KEY ("id", "__tag_kind_m_geq_n5wokg4gqv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_grad" ADD CONSTRAINT "__mathml_grad_fk_id_tag_kind_m_grad_6_q_4_ynpcv_7_x_h2obrgzlq3" FOREIGN KEY ("id", "__tag_kind_m_grad_6q4ynpcv7x") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_group_alignment" ADD CONSTRAINT "__mathml_group_alignment_fk_kind_attribute_tag_type_kvbtgsmbq4" FOREIGN KEY ("kind", "attribute", "__tag_type_group_alignment_pqo7age7u2") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_group_alignment" ADD CONSTRAINT "__mathml_group_alignment_fk_node_kind_4fhz63arux" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_group_alignment_list" ADD CONSTRAINT "__mathml_group_alignment_list_fk_kind_attribute_tag_isw35peiy6" FOREIGN KEY ("kind", "attribute", "__tag_type_group_alignment_list_uuhrki2oda") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_group_alignment_list" ADD CONSTRAINT "__mathml_group_alignment_list_fk_node_kind_5zi36wuvdk" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_group_alignment_list_list" ADD CONSTRAINT "__mathml_group_alignment_list_list_fk_kind_attribute_lhjq7ggj5z" FOREIGN KEY ("kind", "attribute", "__tag_type_group_alignment_list_list_qianckw2my") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_group_alignment_list_list" ADD CONSTRAINT "__mathml_group_alignment_list_list_fk_node_kind_g7abqq3an2" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_gt" ADD CONSTRAINT "__mathml_gt_fk_id_tag_kind_m_gt_jthh_6_lobdq_or2tvjr2sx" FOREIGN KEY ("id", "__tag_kind_m_gt_jthh6lobdq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_href" ADD CONSTRAINT "__mathml_href_fk_kind_attribute_tag_type_href_yzb_73_4uw4xsmuxj" FOREIGN KEY ("kind", "attribute", "__tag_type_href_yzb73hqcyn") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_href" ADD CONSTRAINT "__mathml_href_fk_node_kind_oej35z7kza" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_ident" ADD CONSTRAINT "__mathml_ident_fk_id_tag_kind_m_ident_hirfnzkvy_7_aebmzgf7yh" FOREIGN KEY ("id", "__tag_kind_m_ident_hirfnzkvy7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_image" ADD CONSTRAINT "__mathml_image_fk_id_tag_kind_m_image_ytpk_7_tcvqx_q2i3o7fkyw" FOREIGN KEY ("id", "__tag_kind_m_image_ytpk7tcvqx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_imaginary" ADD CONSTRAINT "__mathml_imaginary_fk_id_tag_kind_m_imaginary_2zb3z5o33d" FOREIGN KEY ("id", "__tag_kind_m_imaginary_xoprhipe34") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_imaginaryi" ADD CONSTRAINT "__mathml_imaginaryi_fk_id_tag_kind_m_imaginaryi_ycyecj4sps" FOREIGN KEY ("id", "__tag_kind_m_imaginaryi_baxxqzk6iy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_implies" ADD CONSTRAINT "__mathml_implies_fk_id_tag_kind_m_implies_lq_7_yrzde_n6p5rrguvk" FOREIGN KEY ("id", "__tag_kind_m_implies_lq7yrzde2h") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_in" ADD CONSTRAINT "__mathml_in_fk_id_tag_kind_m_in_r_3_eoy_4_iycj_jlzm5hvqbm" FOREIGN KEY ("id", "__tag_kind_m_in_r3eoy4iycj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_indentalign" ADD CONSTRAINT "__mathml_indentalign_fk_kind_attribute_tag_type_dlfhl4k64c" FOREIGN KEY ("kind", "attribute", "__tag_type_indentalign_j5iv5corng") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_indentalign" ADD CONSTRAINT "__mathml_indentalign_fk_node_kind_vkxwqrcexh" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_indentalign_line" ADD CONSTRAINT "__mathml_indentalign_line_fk_kind_attribute_tag_type_vleiq2azkf" FOREIGN KEY ("kind", "attribute", "__tag_type_indentalign_line_qkwuxxgavh") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_indentalign_line" ADD CONSTRAINT "__mathml_indentalign_line_fk_node_kind_6tzr75we6g" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_indentshift_line" ADD CONSTRAINT "__mathml_indentshift_line_fk_kind_attribute_tag_type_kp5hhsrj4f" FOREIGN KEY ("kind", "attribute", "__tag_type_indentshift_line_cuy5tnfbaq") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_indentshift_line" ADD CONSTRAINT "__mathml_indentshift_line_fk_node_kind_6i3at4zcld" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_index" ADD CONSTRAINT "__mathml_index_fk_kind_attribute_tag_type_index_h_3_gdgdc2lv2t" FOREIGN KEY ("kind", "attribute", "__tag_type_index_h3u3yjrhy5") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_index" ADD CONSTRAINT "__mathml_index_fk_node_kind_42lsqr5ru4" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_infinity" ADD CONSTRAINT "__mathml_infinity_fk_id_tag_kind_m_infinity_dkhf3au5ws" FOREIGN KEY ("id", "__tag_kind_m_infinity_ylqzdwkaro") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_infixlinebreakstyle" ADD CONSTRAINT "__mathml_infixlinebreakstyle_fk_kind_attribute_tag_2mitpkmqjm" FOREIGN KEY ("kind", "attribute", "__tag_type_infixlinebreakstyle_bfpwwvm7sn") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_infixlinebreakstyle" ADD CONSTRAINT "__mathml_infixlinebreakstyle_fk_node_kind_c2s3iwviqv" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_int" ADD CONSTRAINT "__mathml_int_fk_id_tag_kind_m_int_eacj_64_es_7_a_rcx5l4vss4" FOREIGN KEY ("id", "__tag_kind_m_int_eacj64es7a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_integers" ADD CONSTRAINT "__mathml_integers_fk_id_tag_kind_m_integers_ynhsls_5_dk5gnglvbe" FOREIGN KEY ("id", "__tag_kind_m_integers_ynhsls5pt2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_intersect" ADD CONSTRAINT "__mathml_intersect_fk_id_tag_kind_m_intersect_2_t_6_tijpynanif" FOREIGN KEY ("id", "__tag_kind_m_intersect_2t6lpqnkyo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_interval" ADD CONSTRAINT "__mathml_interval_fk_id_tag_kind_m_interval_c_4_ld_6_xd37mqalbj" FOREIGN KEY ("id", "__tag_kind_m_interval_c4ld6f4f6d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_inverse" ADD CONSTRAINT "__mathml_inverse_fk_id_tag_kind_m_inverse_jjpt_2_lp_hqcgxc577i" FOREIGN KEY ("id", "__tag_kind_m_inverse_jjpt2lp3pd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_lambda" ADD CONSTRAINT "__mathml_lambda_fk_id_tag_kind_m_lambda_v_5_k_6_mszoju4aoe" FOREIGN KEY ("id", "__tag_kind_m_lambda_v5k6arscmx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_laplacian" ADD CONSTRAINT "__mathml_laplacian_fk_id_tag_kind_m_laplacian_4_tx_6_bqmtns5skw" FOREIGN KEY ("id", "__tag_kind_m_laplacian_4tx6pg3cdf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_lcm" ADD CONSTRAINT "__mathml_lcm_fk_id_tag_kind_m_lcm_66_u_5_rutbgm_z7fm5naof5" FOREIGN KEY ("id", "__tag_kind_m_lcm_66u5rutbgm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_length" ADD CONSTRAINT "__mathml_length_fk_kind_attribute_tag_type_length_3_ykqevyabwv" FOREIGN KEY ("kind", "attribute", "__tag_type_length_3ryxkrjjhb") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_length" ADD CONSTRAINT "__mathml_length_fk_node_kind_z7qdemqs2c" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_length_list" ADD CONSTRAINT "__mathml_length_list_fk_kind_attribute_tag_type_7kb743eisb" FOREIGN KEY ("kind", "attribute", "__tag_type_length_list_dngtcn7r6m") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_length_list" ADD CONSTRAINT "__mathml_length_list_fk_node_kind_vybs4zixkc" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_leq" ADD CONSTRAINT "__mathml_leq_fk_id_tag_kind_m_leq_b_7_euz_5_pala_lnt57chfyq" FOREIGN KEY ("id", "__tag_kind_m_leq_b7euz5pala") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_limit" ADD CONSTRAINT "__mathml_limit_fk_id_tag_kind_m_limit_l_2_u_2_dzwokn_iwzba2itpu" FOREIGN KEY ("id", "__tag_kind_m_limit_l2u2dzwokn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_line_thickness" ADD CONSTRAINT "__mathml_line_thickness_fk_kind_attribute_tag_type_fnq6uvl7ff" FOREIGN KEY ("kind", "attribute", "__tag_type_line_thickness_wchmxjoakj") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_line_thickness" ADD CONSTRAINT "__mathml_line_thickness_fk_node_kind_oe3c4rh3ml" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linebreak" ADD CONSTRAINT "__mathml_linebreak_fk_kind_attribute_tag_type_l32eitr3mg" FOREIGN KEY ("kind", "attribute", "__tag_type_linebreak_w6lunataa2") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linebreak" ADD CONSTRAINT "__mathml_linebreak_fk_node_kind_7mqbizecgv" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linebreakstyle" ADD CONSTRAINT "__mathml_linebreakstyle_fk_kind_attribute_tag_type_tsr7ltsahd" FOREIGN KEY ("kind", "attribute", "__tag_type_linebreakstyle_llwvaljtbh") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linebreakstyle" ADD CONSTRAINT "__mathml_linebreakstyle_fk_node_kind_7i3aapil4p" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linestyle" ADD CONSTRAINT "__mathml_linestyle_fk_kind_attribute_tag_type_k6envmuams" FOREIGN KEY ("kind", "attribute", "__tag_type_linestyle_epwcv3z4sm") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linestyle" ADD CONSTRAINT "__mathml_linestyle_fk_node_kind_opjmsz3q5p" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linestyle_list" ADD CONSTRAINT "__mathml_linestyle_list_fk_kind_attribute_tag_type_wii7rpdg5e" FOREIGN KEY ("kind", "attribute", "__tag_type_linestyle_list_rb27ousd5c") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_linestyle_list" ADD CONSTRAINT "__mathml_linestyle_list_fk_node_kind_rlfewpffcp" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_list" ADD CONSTRAINT "__mathml_list_fk_id_tag_kind_m_list_ididamd_2_sx_sg4lan6fmt" FOREIGN KEY ("id", "__tag_kind_m_list_ididamd2sx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_ln" ADD CONSTRAINT "__mathml_ln_fk_id_tag_kind_m_ln_ffmsmo_2_m_36_vhus4a7kcw" FOREIGN KEY ("id", "__tag_kind_m_ln_ffmsmo2m36") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_location" ADD CONSTRAINT "__mathml_location_fk_kind_attribute_tag_type_rgiit4fdw7" FOREIGN KEY ("kind", "attribute", "__tag_type_location_kr5ll5xiqo") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_location" ADD CONSTRAINT "__mathml_location_fk_node_kind_ujzoqvivbu" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_log" ADD CONSTRAINT "__mathml_log_fk_id_tag_kind_m_log_3_dqvvrgdqn_af5n3hwgt3" FOREIGN KEY ("id", "__tag_kind_m_log_3dqvvrgdqn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_logbase" ADD CONSTRAINT "__mathml_logbase_fk_id_tag_kind_m_logbase_iwvpr_4_ym_pchomqut4n" FOREIGN KEY ("id", "__tag_kind_m_logbase_iwvpr4ym5u") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_longdivstyle" ADD CONSTRAINT "__mathml_longdivstyle_fk_kind_attribute_tag_type_3c2aumnvca" FOREIGN KEY ("kind", "attribute", "__tag_type_longdivstyle_x6uaaro43p") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_longdivstyle" ADD CONSTRAINT "__mathml_longdivstyle_fk_node_kind_4yxb3csx2f" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_lowlimit" ADD CONSTRAINT "__mathml_lowlimit_fk_id_tag_kind_m_lowlimit_2_it5m3i4c4b" FOREIGN KEY ("id", "__tag_kind_m_lowlimit_2pfspebfal") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_lt" ADD CONSTRAINT "__mathml_lt_fk_id_tag_kind_m_lt_vgxgnlpcov_z6unnkmizj" FOREIGN KEY ("id", "__tag_kind_m_lt_vgxgnlpcov") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_maction" ADD CONSTRAINT "__mathml_maction_fk_id_tag_kind_m_maction_y_36_3pbp2yv3lb" FOREIGN KEY ("id", "__tag_kind_m_maction_y36nfqlpyh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_maligngroup" ADD CONSTRAINT "__mathml_maligngroup_fk_id_tag_kind_m_maligngroup_275viqmpwv" FOREIGN KEY ("id", "__tag_kind_m_maligngroup_wampytcaou") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_malignmark" ADD CONSTRAINT "__mathml_malignmark_fk_id_tag_kind_m_malignmark_nz_hfmmfmvoii" FOREIGN KEY ("id", "__tag_kind_m_malignmark_nz76twvsrf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_math" ADD CONSTRAINT "__mathml_math_fk_id_tag_kind_m_math_dtmrz_3_gcfd_phb3477eeq" FOREIGN KEY ("id", "__tag_kind_m_math_dtmrz3gcfd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mathsize" ADD CONSTRAINT "__mathml_mathsize_fk_kind_attribute_tag_type_awx2rw4rnx" FOREIGN KEY ("kind", "attribute", "__tag_type_mathsize_grkbgzyt3i") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mathsize" ADD CONSTRAINT "__mathml_mathsize_fk_node_kind_absyeauc6p" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mathvariant" ADD CONSTRAINT "__mathml_mathvariant_fk_kind_attribute_tag_type_4yq3o3c6uh" FOREIGN KEY ("kind", "attribute", "__tag_type_mathvariant_g4idzs45uj") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mathvariant" ADD CONSTRAINT "__mathml_mathvariant_fk_node_kind_catgrezkeo" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_matrix" ADD CONSTRAINT "__mathml_matrix_fk_id_tag_kind_m_matrix_mnfvdmlrs_2_jyqfcyxvro" FOREIGN KEY ("id", "__tag_kind_m_matrix_mnfvdmlrs2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_matrixrow" ADD CONSTRAINT "__mathml_matrixrow_fk_id_tag_kind_m_matrixrow_2omt43owvi" FOREIGN KEY ("id", "__tag_kind_m_matrixrow_uhamsripkq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_max" ADD CONSTRAINT "__mathml_max_fk_id_tag_kind_m_max_cr_2_qia_23_nv_gh7naayo66" FOREIGN KEY ("id", "__tag_kind_m_max_cr2qia23nv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_maxsize" ADD CONSTRAINT "__mathml_maxsize_fk_kind_attribute_tag_type_maxsize_kw2nrfcw5f" FOREIGN KEY ("kind", "attribute", "__tag_type_maxsize_562tlh7e4a") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_maxsize" ADD CONSTRAINT "__mathml_maxsize_fk_node_kind_z5nxhi6gup" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mean" ADD CONSTRAINT "__mathml_mean_fk_id_tag_kind_m_mean_e_72_hycklnh_tzruj5ntxj" FOREIGN KEY ("id", "__tag_kind_m_mean_e72hycklnh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_median" ADD CONSTRAINT "__mathml_median_fk_id_tag_kind_m_median_fornyqw_6_hp_l46k2aeduq" FOREIGN KEY ("id", "__tag_kind_m_median_fornyqw6hp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_menclose" ADD CONSTRAINT "__mathml_menclose_fk_id_tag_kind_m_menclose_jsw_5_whvaoitiaw" FOREIGN KEY ("id", "__tag_kind_m_menclose_jsw5qoccrd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_merror" ADD CONSTRAINT "__mathml_merror_fk_id_tag_kind_m_merror_nhqlhek_76_i_hhqefdo5f2" FOREIGN KEY ("id", "__tag_kind_m_merror_nhqlhek76i") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mfenced" ADD CONSTRAINT "__mathml_mfenced_fk_id_tag_kind_m_mfenced_oo_5_jinni4f7jn" FOREIGN KEY ("id", "__tag_kind_m_mfenced_oo5qjasnee") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mfrac" ADD CONSTRAINT "__mathml_mfrac_fk_id_tag_kind_m_mfrac_vmplftveia_pizckennqt" FOREIGN KEY ("id", "__tag_kind_m_mfrac_vmplftveia") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mglyph" ADD CONSTRAINT "__mathml_mglyph_fk_id_tag_kind_m_mglyph_24_iju_5_rtmrwopnwl" FOREIGN KEY ("id", "__tag_kind_m_mglyph_24iju5mdym") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mi" ADD CONSTRAINT "__mathml_mi_fk_id_tag_kind_m_mi_p_7_i_7_slzmp_4_d3u74arjsp" FOREIGN KEY ("id", "__tag_kind_m_mi_p7i7slzmp4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_min" ADD CONSTRAINT "__mathml_min_fk_id_tag_kind_m_min_ptzeah_4_ns_2_5wdb7h4x7z" FOREIGN KEY ("id", "__tag_kind_m_min_ptzeah4ns2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_minus" ADD CONSTRAINT "__mathml_minus_fk_id_tag_kind_m_minus_hcem_3_twfsv_7tnk5txuo5" FOREIGN KEY ("id", "__tag_kind_m_minus_hcem3twfsv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mlabeledtr" ADD CONSTRAINT "__mathml_mlabeledtr_fk_id_tag_kind_m_mlabeledtr_j_5_n3txezzmy3" FOREIGN KEY ("id", "__tag_kind_m_mlabeledtr_j5pxrv3x2d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mlongdiv" ADD CONSTRAINT "__mathml_mlongdiv_fk_id_tag_kind_m_mlongdiv_22_cw7qetmmy2" FOREIGN KEY ("id", "__tag_kind_m_mlongdiv_22mypvxzfm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mmultiscripts" ADD CONSTRAINT "__mathml_mmultiscripts_fk_id_tag_kind_m_abpuvkdv6e" FOREIGN KEY ("id", "__tag_kind_m_mmultiscripts_inoxa5l6ol") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mn" ADD CONSTRAINT "__mathml_mn_fk_id_tag_kind_m_mn_2_penr_6_noah_jyl2imcrkq" FOREIGN KEY ("id", "__tag_kind_m_mn_2penr6noah") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mo" ADD CONSTRAINT "__mathml_mo_fk_id_tag_kind_m_mo_izsuukhwhz_wvtzcl3r62" FOREIGN KEY ("id", "__tag_kind_m_mo_izsuukhwhz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mode" ADD CONSTRAINT "__mathml_mode_fk_id_tag_kind_m_mode_f_2_wxgo_6_k_7_y_bhu6eoqd4h" FOREIGN KEY ("id", "__tag_kind_m_mode_f2wxgo6k7y") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_moment" ADD CONSTRAINT "__mathml_moment_fk_id_tag_kind_m_moment_r_3_exfc_4_4xlbat6qns" FOREIGN KEY ("id", "__tag_kind_m_moment_r3exfc4eqr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_momentabout" ADD CONSTRAINT "__mathml_momentabout_fk_id_tag_kind_m_momentabout_2zgq3j2vli" FOREIGN KEY ("id", "__tag_kind_m_momentabout_jpx6cayxgs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mover" ADD CONSTRAINT "__mathml_mover_fk_id_tag_kind_m_mover_2_sodqbv_35_q_pjbope7mvb" FOREIGN KEY ("id", "__tag_kind_m_mover_2sodqbv35q") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mpadded" ADD CONSTRAINT "__mathml_mpadded_fk_id_tag_kind_m_mpadded_3_vz_5_brutze7s6s" FOREIGN KEY ("id", "__tag_kind_m_mpadded_3vz5xdkeiw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mpadded_length" ADD CONSTRAINT "__mathml_mpadded_length_fk_kind_attribute_tag_type_yirqwf3fhz" FOREIGN KEY ("kind", "attribute", "__tag_type_mpadded_length_h2bjgoqjt5") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mpadded_length" ADD CONSTRAINT "__mathml_mpadded_length_fk_node_kind_4o5bftaluy" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mphantom" ADD CONSTRAINT "__mathml_mphantom_fk_id_tag_kind_m_mphantom_q_5_jic_djybnu3mdi" FOREIGN KEY ("id", "__tag_kind_m_mphantom_q5jic2y66l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mprescripts" ADD CONSTRAINT "__mathml_mprescripts_fk_id_tag_kind_m_mprescripts_uf_25vooc27he" FOREIGN KEY ("id", "__tag_kind_m_mprescripts_uf33moyqvt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mroot" ADD CONSTRAINT "__mathml_mroot_fk_id_tag_kind_m_mroot_qn_2422_dmq_4_uzmnd3fqum" FOREIGN KEY ("id", "__tag_kind_m_mroot_qn2422dmq4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mrow" ADD CONSTRAINT "__mathml_mrow_fk_id_tag_kind_m_mrow_cytyvwkgdf_eiwwdyoyge" FOREIGN KEY ("id", "__tag_kind_m_mrow_cytyvwkgdf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_ms" ADD CONSTRAINT "__mathml_ms_fk_id_tag_kind_m_ms_pdgylwa_6_dz_iqyuktfjis" FOREIGN KEY ("id", "__tag_kind_m_ms_pdgylwa6dz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mscarries" ADD CONSTRAINT "__mathml_mscarries_fk_id_tag_kind_m_mscarries_fc5wqmwok5" FOREIGN KEY ("id", "__tag_kind_m_mscarries_vkanwmtzz4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mscarry" ADD CONSTRAINT "__mathml_mscarry_fk_id_tag_kind_m_mscarry_ajupuy_2_i_oiurgy7qd2" FOREIGN KEY ("id", "__tag_kind_m_mscarry_ajupuy2i2b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_msgroup" ADD CONSTRAINT "__mathml_msgroup_fk_id_tag_kind_m_msgroup_gc_5_kcdhb_ijxztgbzjd" FOREIGN KEY ("id", "__tag_kind_m_msgroup_gc5kcdhb3n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_msline" ADD CONSTRAINT "__mathml_msline_fk_id_tag_kind_m_msline_3_vuunvoaru_nt7jjl4v6f" FOREIGN KEY ("id", "__tag_kind_m_msline_3vuunvoaru") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mspace" ADD CONSTRAINT "__mathml_mspace_fk_id_tag_kind_m_mspace_su_7_akczkbj_buz6mku4oc" FOREIGN KEY ("id", "__tag_kind_m_mspace_su7akczkbj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mspace_linebreak" ADD CONSTRAINT "__mathml_mspace_linebreak_fk_kind_attribute_tag_type_5fl4oxiscs" FOREIGN KEY ("kind", "attribute", "__tag_type_mspace_linebreak_2ttbtg2pof") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mspace_linebreak" ADD CONSTRAINT "__mathml_mspace_linebreak_fk_node_kind_7c76w7u4yy" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_msqrt" ADD CONSTRAINT "__mathml_msqrt_fk_id_tag_kind_m_msqrt_7_jzntxzyfy_mxcfie2z3r" FOREIGN KEY ("id", "__tag_kind_m_msqrt_7jzntxzyfy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_msrow" ADD CONSTRAINT "__mathml_msrow_fk_id_tag_kind_m_msrow_j_7_ltxdt_2_up_2bkxhcofv5" FOREIGN KEY ("id", "__tag_kind_m_msrow_j7ltxdt2up") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mstack" ADD CONSTRAINT "__mathml_mstack_fk_id_tag_kind_m_mstack_gkm_7_obfda_7rf5ox74m6" FOREIGN KEY ("id", "__tag_kind_m_mstack_gkm7obfda2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mstyle" ADD CONSTRAINT "__mathml_mstyle_fk_id_tag_kind_m_mstyle_zxd_3_ckdwex_kzc6ldsr6c" FOREIGN KEY ("id", "__tag_kind_m_mstyle_zxd3ckdwex") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_msub" ADD CONSTRAINT "__mathml_msub_fk_id_tag_kind_m_msub_fjwntq_3_ri_6_equyw54o7p" FOREIGN KEY ("id", "__tag_kind_m_msub_fjwntq3ri6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_msubsup" ADD CONSTRAINT "__mathml_msubsup_fk_id_tag_kind_m_msubsup_m_3_aq_3_sfset6eiba" FOREIGN KEY ("id", "__tag_kind_m_msubsup_m3aq3rdyeg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_msup" ADD CONSTRAINT "__mathml_msup_fk_id_tag_kind_m_msup_kwgtpz_276_e_h2qyu7dy7m" FOREIGN KEY ("id", "__tag_kind_m_msup_kwgtpz276e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mtable" ADD CONSTRAINT "__mathml_mtable_fk_id_tag_kind_m_mtable_ddkzxi_42_to_cu5lmstryf" FOREIGN KEY ("id", "__tag_kind_m_mtable_ddkzxi42to") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mtd" ADD CONSTRAINT "__mathml_mtd_fk_id_tag_kind_m_mtd_zh_62_fovndd_2aq4a5xdeq" FOREIGN KEY ("id", "__tag_kind_m_mtd_zh62fovndd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mtext" ADD CONSTRAINT "__mathml_mtext_fk_id_tag_kind_m_mtext_gjyzedp_263_6qxna2hwxt" FOREIGN KEY ("id", "__tag_kind_m_mtext_gjyzedp263") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_mtr" ADD CONSTRAINT "__mathml_mtr_fk_id_tag_kind_m_mtr_tiryvttk_6_j_f63xmckwl3" FOREIGN KEY ("id", "__tag_kind_m_mtr_tiryvttk6j") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_munder" ADD CONSTRAINT "__mathml_munder_fk_id_tag_kind_m_munder_xjdj_25_enzu_bhlwxrxaux" FOREIGN KEY ("id", "__tag_kind_m_munder_xjdj25enzu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_munderover" ADD CONSTRAINT "__mathml_munderover_fk_id_tag_kind_m_munderover_7_zhqp5n2as2" FOREIGN KEY ("id", "__tag_kind_m_munderover_7rxt37agxh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_name" ADD CONSTRAINT "__mathml_name_fk_kind_attribute_tag_type_name_g_4_vf_vew53x5kny" FOREIGN KEY ("kind", "attribute", "__tag_type_name_g4vf3tlvtw") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_name" ADD CONSTRAINT "__mathml_name_fk_node_kind_b6didf5wq7" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_nargs" ADD CONSTRAINT "__mathml_nargs_fk_kind_attribute_tag_type_nargs_ygqc_3o3x5gutue" FOREIGN KEY ("kind", "attribute", "__tag_type_nargs_ygqc7vdqpk") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_nargs" ADD CONSTRAINT "__mathml_nargs_fk_node_kind_xy4dqwp2cy" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_naturalnumbers" ADD CONSTRAINT "__mathml_naturalnumbers_fk_id_tag_kind_m_e3eofvyx4v" FOREIGN KEY ("id", "__tag_kind_m_naturalnumbers_4si2qmk4bt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_neq" ADD CONSTRAINT "__mathml_neq_fk_id_tag_kind_m_neq_sfxeauet_33_fja4dthw6m" FOREIGN KEY ("id", "__tag_kind_m_neq_sfxeauet33") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_none" ADD CONSTRAINT "__mathml_none_fk_id_tag_kind_m_none_txrqdn_7_o_6_t_p6uxms7ijp" FOREIGN KEY ("id", "__tag_kind_m_none_txrqdn7o6t") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_not" ADD CONSTRAINT "__mathml_not_fk_id_tag_kind_m_not_jf_3_l_6_qjxrd_t4d4tdvuub" FOREIGN KEY ("id", "__tag_kind_m_not_jf3l6qjxrd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_notanumber" ADD CONSTRAINT "__mathml_notanumber_fk_id_tag_kind_m_notanumber_v4ealmqq7r" FOREIGN KEY ("id", "__tag_kind_m_notanumber_zucyyudpwj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_notin" ADD CONSTRAINT "__mathml_notin_fk_id_tag_kind_m_notin_gjm_5_pzhaib_faj6qf6cn2" FOREIGN KEY ("id", "__tag_kind_m_notin_gjm5pzhaib") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_notprsubset" ADD CONSTRAINT "__mathml_notprsubset_fk_id_tag_kind_m_notprsubset_jvmpi3um4w" FOREIGN KEY ("id", "__tag_kind_m_notprsubset_mdvhlxpocq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_notsubset" ADD CONSTRAINT "__mathml_notsubset_fk_id_tag_kind_m_notsubset_7t2afbwukl" FOREIGN KEY ("id", "__tag_kind_m_notsubset_hyskqhass5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_number" ADD CONSTRAINT "__mathml_number_fk_kind_attribute_tag_type_number_su_6awrod3heg" FOREIGN KEY ("kind", "attribute", "__tag_type_number_su5a7mhmov") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_number" ADD CONSTRAINT "__mathml_number_fk_node_kind_ihu2amieuq" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_occurrence" ADD CONSTRAINT "__mathml_occurrence_fk_kind_attribute_tag_type_4njw7f5ope" FOREIGN KEY ("kind", "attribute", "__tag_type_occurrence_poownjlqsd") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_occurrence" ADD CONSTRAINT "__mathml_occurrence_fk_node_kind_63afdyz7ei" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_or" ADD CONSTRAINT "__mathml_or_fk_id_tag_kind_m_or_kw_7_pzhxnad_gofyty2vkv" FOREIGN KEY ("id", "__tag_kind_m_or_kw7pzhxnad") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_order" ADD CONSTRAINT "__mathml_order_fk_kind_attribute_tag_type_order_7_zpmizwz6n3" FOREIGN KEY ("kind", "attribute", "__tag_type_order_7gyulwkonz") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_order" ADD CONSTRAINT "__mathml_order_fk_node_kind_24wxiilca5" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_otherwise" ADD CONSTRAINT "__mathml_otherwise_fk_id_tag_kind_m_otherwise_a_6_zs_pkcpqdmfzi" FOREIGN KEY ("id", "__tag_kind_m_otherwise_a6zs5hnn2a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_outerproduct" ADD CONSTRAINT "__mathml_outerproduct_fk_id_tag_kind_m_outerproduct_rw6h3tj6yz" FOREIGN KEY ("id", "__tag_kind_m_outerproduct_p4a4z6sd6m") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_overflow" ADD CONSTRAINT "__mathml_overflow_fk_kind_attribute_tag_type_dkknu7rdyg" FOREIGN KEY ("kind", "attribute", "__tag_type_overflow_fijx4zdoiz") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_overflow" ADD CONSTRAINT "__mathml_overflow_fk_node_kind_hfzsoxmekj" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_partialdiff" ADD CONSTRAINT "__mathml_partialdiff_fk_id_tag_kind_m_partialdiff_6_eonlqq5xdc" FOREIGN KEY ("id", "__tag_kind_m_partialdiff_6ypsxmfpsd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_pi" ADD CONSTRAINT "__mathml_pi_fk_id_tag_kind_m_pi_xvsqr_7_saep_4gj62u5lsz" FOREIGN KEY ("id", "__tag_kind_m_pi_xvsqr7saep") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_piece" ADD CONSTRAINT "__mathml_piece_fk_id_tag_kind_m_piece_k_2_ohxrzecs_ilp4jibyab" FOREIGN KEY ("id", "__tag_kind_m_piece_k2ohxrzecs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_piecewise" ADD CONSTRAINT "__mathml_piecewise_fk_id_tag_kind_m_piecewise_hi_4_zmwp5dw3if" FOREIGN KEY ("id", "__tag_kind_m_piecewise_hi4sytbaqh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_plus" ADD CONSTRAINT "__mathml_plus_fk_id_tag_kind_m_plus_4_dxeflazpt_ptk3wz6jj3" FOREIGN KEY ("id", "__tag_kind_m_plus_4dxeflazpt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_position" ADD CONSTRAINT "__mathml_position_fk_kind_attribute_tag_type_smo5ka47n6" FOREIGN KEY ("kind", "attribute", "__tag_type_position_ti5jyzvjus") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_position" ADD CONSTRAINT "__mathml_position_fk_node_kind_635mz3qo4f" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_power" ADD CONSTRAINT "__mathml_power_fk_id_tag_kind_m_power_6_k_56_p_2_r_6k5g4pwbmh" FOREIGN KEY ("id", "__tag_kind_m_power_6k56p2r42x") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_primes" ADD CONSTRAINT "__mathml_primes_fk_id_tag_kind_m_primes_tai_2_obwnjd_dlntmdu62b" FOREIGN KEY ("id", "__tag_kind_m_primes_tai2obwnjd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_product" ADD CONSTRAINT "__mathml_product_fk_id_tag_kind_m_product_x_3_cdvrs_xgonvta3hn" FOREIGN KEY ("id", "__tag_kind_m_product_x3cdvrs3g2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_prsubset" ADD CONSTRAINT "__mathml_prsubset_fk_id_tag_kind_m_prsubset_4_mbldpfpume" FOREIGN KEY ("id", "__tag_kind_m_prsubset_4gfelkzi7e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_quotient" ADD CONSTRAINT "__mathml_quotient_fk_id_tag_kind_m_quotient_s_2_o_75_l6cdkfrabm" FOREIGN KEY ("id", "__tag_kind_m_quotient_s2o75pem36") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_rationals" ADD CONSTRAINT "__mathml_rationals_fk_id_tag_kind_m_rationals_2_m_5_suadpycepb" FOREIGN KEY ("id", "__tag_kind_m_rationals_2m5enf2oj2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_real" ADD CONSTRAINT "__mathml_real_fk_id_tag_kind_m_real_junglpuyjh_asltjdfhfc" FOREIGN KEY ("id", "__tag_kind_m_real_junglpuyjh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_reals" ADD CONSTRAINT "__mathml_reals_fk_id_tag_kind_m_reals_sltmlx_6_eyd_h2gwyezrib" FOREIGN KEY ("id", "__tag_kind_m_reals_sltmlx6eyd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_reln" ADD CONSTRAINT "__mathml_reln_fk_id_tag_kind_m_reln_bxlrw_6_pjny_m2lqhg7ijq" FOREIGN KEY ("id", "__tag_kind_m_reln_bxlrw6pjny") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_rem" ADD CONSTRAINT "__mathml_rem_fk_id_tag_kind_m_rem_hk_2_fhxi_3_j_3_zfd4shfdm6" FOREIGN KEY ("id", "__tag_kind_m_rem_hk2fhxi3j3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_root" ADD CONSTRAINT "__mathml_root_fk_id_tag_kind_m_root_k_3_d_4_oyajlo_pdri45x2xl" FOREIGN KEY ("id", "__tag_kind_m_root_k3d4oyajlo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_rowalign" ADD CONSTRAINT "__mathml_rowalign_fk_kind_attribute_tag_type_2tjjrym6ou" FOREIGN KEY ("kind", "attribute", "__tag_type_rowalign_3qkoukbb5i") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_rowalign" ADD CONSTRAINT "__mathml_rowalign_fk_node_kind_kzfochmz5a" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_scalarproduct" ADD CONSTRAINT "__mathml_scalarproduct_fk_id_tag_kind_m_4tef7odvvy" FOREIGN KEY ("id", "__tag_kind_m_scalarproduct_ztm5elappz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_scriptlevel" ADD CONSTRAINT "__mathml_scriptlevel_fk_kind_attribute_tag_type_laffyv7vad" FOREIGN KEY ("kind", "attribute", "__tag_type_scriptlevel_lus7qdlwus") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_scriptlevel" ADD CONSTRAINT "__mathml_scriptlevel_fk_node_kind_prhopg2p3o" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_sdev" ADD CONSTRAINT "__mathml_sdev_fk_id_tag_kind_m_sdev_ipab_3_uglwf_uxg66zee6z" FOREIGN KEY ("id", "__tag_kind_m_sdev_ipab3uglwf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_sec" ADD CONSTRAINT "__mathml_sec_fk_id_tag_kind_m_sec_6_pbevmi_5_vg_mrrv7rmn3b" FOREIGN KEY ("id", "__tag_kind_m_sec_6pbevmi5vg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_sech" ADD CONSTRAINT "__mathml_sech_fk_id_tag_kind_m_sech_bsdecxac_2_s_gjge77nyaq" FOREIGN KEY ("id", "__tag_kind_m_sech_bsdecxac2s") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_selection" ADD CONSTRAINT "__mathml_selection_fk_kind_attribute_tag_type_7fpk3jpamc" FOREIGN KEY ("kind", "attribute", "__tag_type_selection_jwgsaywsyr") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_selection" ADD CONSTRAINT "__mathml_selection_fk_node_kind_wo5vwckloq" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_selector" ADD CONSTRAINT "__mathml_selector_fk_id_tag_kind_m_selector_id_2_i7cexf5rui" FOREIGN KEY ("id", "__tag_kind_m_selector_id2twbxgz4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_semantics" ADD CONSTRAINT "__mathml_semantics_fk_id_tag_kind_m_semantics_avfswv4khd" FOREIGN KEY ("id", "__tag_kind_m_semantics_hcelfkqiux") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_semantics_ci" ADD CONSTRAINT "__mathml_semantics_ci_fk_id_tag_kind_m_semantics_ci_cxu3mvjsqt" FOREIGN KEY ("id", "__tag_kind_m_semantics_ci_kfs5kl2pxo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_sep" ADD CONSTRAINT "__mathml_sep_fk_id_tag_kind_m_sep_kkvavsjqnh_yoajcwhwbp" FOREIGN KEY ("id", "__tag_kind_m_sep_kkvavsjqnh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_set" ADD CONSTRAINT "__mathml_set_fk_id_tag_kind_m_set_y_2_qu_2_mnt_3_k_hebacnkxg5" FOREIGN KEY ("id", "__tag_kind_m_set_y2qu2mnt3k") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_setdiff" ADD CONSTRAINT "__mathml_setdiff_fk_id_tag_kind_m_setdiff_6_ak_6_zk5ch6clcw" FOREIGN KEY ("id", "__tag_kind_m_setdiff_6ak6jezs3j") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_share" ADD CONSTRAINT "__mathml_share_fk_id_tag_kind_m_share_6_yal_6_dljfx_2toymchqpm" FOREIGN KEY ("id", "__tag_kind_m_share_6yal6dljfx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_shift" ADD CONSTRAINT "__mathml_shift_fk_kind_attribute_tag_type_shift_ccjga4uxit" FOREIGN KEY ("kind", "attribute", "__tag_type_shift_apyvsvz66t") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_shift" ADD CONSTRAINT "__mathml_shift_fk_node_kind_rofoummufm" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_side" ADD CONSTRAINT "__mathml_side_fk_kind_attribute_tag_type_side_q_47_mxs7uv4h3r" FOREIGN KEY ("kind", "attribute", "__tag_type_side_q47iymixud") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_side" ADD CONSTRAINT "__mathml_side_fk_node_kind_ha3xnzizi7" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_sin" ADD CONSTRAINT "__mathml_sin_fk_id_tag_kind_m_sin_5_vyjm_4_llew_66vwninxqf" FOREIGN KEY ("id", "__tag_kind_m_sin_5vyjm4llew") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_sinh" ADD CONSTRAINT "__mathml_sinh_fk_id_tag_kind_m_sinh_a_5_mwypfwvy_dwpd77bqmm" FOREIGN KEY ("id", "__tag_kind_m_sinh_a5mwypfwvy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_span" ADD CONSTRAINT "__mathml_span_fk_kind_attribute_tag_type_span_oltex_kd7yawchxj" FOREIGN KEY ("kind", "attribute", "__tag_type_span_oltex6sebj") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_span" ADD CONSTRAINT "__mathml_span_fk_node_kind_owkbvjbmxw" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_src" ADD CONSTRAINT "__mathml_src_fk_kind_attribute_tag_type_src_lxnlnbl_dg7jlsfqki" FOREIGN KEY ("kind", "attribute", "__tag_type_src_lxnlnbl4zv") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_src" ADD CONSTRAINT "__mathml_src_fk_node_kind_usyc7eqibb" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_string" ADD CONSTRAINT "__mathml_string_fk_kind_attribute_tag_type_string_in_n2jlvww42l" FOREIGN KEY ("kind", "attribute", "__tag_type_string_in2ni326mz") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_string" ADD CONSTRAINT "__mathml_string_fk_node_kind_kkugfd7ypr" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_subset" ADD CONSTRAINT "__mathml_subset_fk_id_tag_kind_m_subset_jwykfgzkcc_nqstjvysj7" FOREIGN KEY ("id", "__tag_kind_m_subset_jwykfgzkcc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_sum" ADD CONSTRAINT "__mathml_sum_fk_id_tag_kind_m_sum_eygixfvnhj_hj67qhjr5y" FOREIGN KEY ("id", "__tag_kind_m_sum_eygixfvnhj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_table_width" ADD CONSTRAINT "__mathml_table_width_fk_kind_attribute_tag_type_dow3tvqcus" FOREIGN KEY ("kind", "attribute", "__tag_type_table_width_pplztankwm") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_table_width" ADD CONSTRAINT "__mathml_table_width_fk_node_kind_7lvioffw6k" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_tan" ADD CONSTRAINT "__mathml_tan_fk_id_tag_kind_m_tan_ccevpfe_55_o_hr2efv7zbo" FOREIGN KEY ("id", "__tag_kind_m_tan_ccevpfe55o") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_tanh" ADD CONSTRAINT "__mathml_tanh_fk_id_tag_kind_m_tanh_th_7_rxeblxr_mvq4uwflto" FOREIGN KEY ("id", "__tag_kind_m_tanh_th7rxeblxr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_tendsto" ADD CONSTRAINT "__mathml_tendsto_fk_id_tag_kind_m_tendsto_v_6_sdqp_7_v4uikrvays" FOREIGN KEY ("id", "__tag_kind_m_tendsto_v6sdqp7osp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_times" ADD CONSTRAINT "__mathml_times_fk_id_tag_kind_m_times_xfa_335_sssc_5slv6nrjqg" FOREIGN KEY ("id", "__tag_kind_m_times_xfa335sssc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_transpose" ADD CONSTRAINT "__mathml_transpose_fk_id_tag_kind_m_transpose_vim_66_m6fizc2my5" FOREIGN KEY ("id", "__tag_kind_m_transpose_vim66kqtck") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_true" ADD CONSTRAINT "__mathml_true_fk_id_tag_kind_m_true_ggyj_63_hsze_djg7fp6elu" FOREIGN KEY ("id", "__tag_kind_m_true_ggyj63hsze") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_union" ADD CONSTRAINT "__mathml_union_fk_id_tag_kind_m_union_6_kcpnf_2_mlo_hjmqto24wu" FOREIGN KEY ("id", "__tag_kind_m_union_6kcpnf2mlo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_unsigned_integer" ADD CONSTRAINT "__mathml_unsigned_integer_fk_kind_attribute_tag_type_2w25zon65i" FOREIGN KEY ("kind", "attribute", "__tag_type_unsigned_integer_gnblpmuiy3") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_unsigned_integer" ADD CONSTRAINT "__mathml_unsigned_integer_fk_node_kind_iu6q7vq2gr" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_uplimit" ADD CONSTRAINT "__mathml_uplimit_fk_id_tag_kind_m_uplimit_6_whdpi_7_c5xchm7faz" FOREIGN KEY ("id", "__tag_kind_m_uplimit_6whdpi7iqh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_variance" ADD CONSTRAINT "__mathml_variance_fk_id_tag_kind_m_variance_rqsni7uymf" FOREIGN KEY ("id", "__tag_kind_m_variance_ugqyybctnb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_vector" ADD CONSTRAINT "__mathml_vector_fk_id_tag_kind_m_vector_o_7_zppitxuw_xpsrugc6e5" FOREIGN KEY ("id", "__tag_kind_m_vector_o7zppitxuw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_vectorproduct" ADD CONSTRAINT "__mathml_vectorproduct_fk_id_tag_kind_m_izzwzwjjm3" FOREIGN KEY ("id", "__tag_kind_m_vectorproduct_l2jltqqlem") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_verticalalign" ADD CONSTRAINT "__mathml_verticalalign_fk_kind_attribute_tag_type_qbm676r5df" FOREIGN KEY ("kind", "attribute", "__tag_type_verticalalign_l4kt5q657l") REFERENCES "qti"."mathml_attribute_type" ("kind", "attribute", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_verticalalign" ADD CONSTRAINT "__mathml_verticalalign_fk_node_kind_tfxd3gnwo5" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mathml_xor" ADD CONSTRAINT "__mathml_xor_fk_id_tag_kind_m_xor_raim_3_zhwns_ufuef4ljb5" FOREIGN KEY ("id", "__tag_kind_m_xor_raim3zhwns") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_abs"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_align"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_alignmentscope"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_altimg_valign"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_and"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_annotation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_annotation_xml"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_apply"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_approx"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arccos"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arccosh"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arccot"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arccoth"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arccsc"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arccsch"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arcsec"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arcsech"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arcsin"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arcsinh"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arctan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arctanh"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_arg"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_attribute_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_background"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_base"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_bind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_bvar"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_card"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cartesianproduct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cbytes"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cd"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cdgroup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_ceiling"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cerror"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_character"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_charspacing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_ci"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_class"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_closure"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cn"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_codomain"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_color"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_columnalign"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_columnalignstyle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_columnwidth"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_complexes"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_compose"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_condition"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_conjugate"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cos"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cosh"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cot"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_coth"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_crossout"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_cs"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_csc"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_csch"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_csymbol"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_curl"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_declare"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_definition_url"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_degree"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_determinant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_diff"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_dir"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_display"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_divergence"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_divide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_domain"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_domainofapplication"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_edge"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_embed_source"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_emptyset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_eq"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_equivalent"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_eulergamma"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_exists"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_exp"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_exponentiale"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_factorial"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_factorof"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_false"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_floor"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_fn"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_fontstyle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_fontweight"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_forall"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_form"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_framespacing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_gcd"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_geq"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_grad"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_group_alignment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_group_alignment_list"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_group_alignment_list_list"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_gt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_ident"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_image"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_imaginary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_imaginaryi"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_implies"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_in"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_indentalign"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_indentalign_line"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_indentshift_line"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_index"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_infinity"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_infixlinebreakstyle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_int"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_integers"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_intersect"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_interval"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_inverse"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_lambda"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_laplacian"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_lcm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_length"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_length_list"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_leq"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_limit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_line_thickness"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_linebreak"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_linebreakstyle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_linestyle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_linestyle_list"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_list"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_ln"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_log"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_logbase"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_longdivstyle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_lowlimit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_lt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_maction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_maligngroup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_malignmark"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_math"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mathsize"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mathvariant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_matrix"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_matrixrow"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_maxsize"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_median"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_menclose"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_merror"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mfenced"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mfrac"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mglyph"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mi"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_minus"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mlabeledtr"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mlongdiv"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mmultiscripts"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mn"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mo"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_moment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_momentabout"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mover"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mpadded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mpadded_length"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mphantom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mprescripts"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mroot"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mrow"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_ms"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mscarries"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mscarry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_msgroup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_msline"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mspace"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mspace_linebreak"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_msqrt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_msrow"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mstack"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mstyle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_msub"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_msubsup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_msup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mtable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mtd"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mtext"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_mtr"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_munder"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_munderover"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_name"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_nargs"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_naturalnumbers"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_neq"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_none"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_not"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_notanumber"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_notin"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_notprsubset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_notsubset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_number"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_occurrence"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_or"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_order"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_otherwise"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_outerproduct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_overflow"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_partialdiff"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_pi"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_piece"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_piecewise"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_plus"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_position"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_power"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_primes"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_product"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_prsubset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_quotient"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_rationals"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_real"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_reals"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_reln"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_rem"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_root"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_rowalign"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_scalarproduct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_scriptlevel"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_sdev"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_sec"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_sech"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_selection"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_selector"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_semantics"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_semantics_ci"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_sep"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_setdiff"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_share"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_shift"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_side"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_sin"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_sinh"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_span"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_src"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_subset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_sum"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_table_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_tan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_tanh"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_tendsto"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_times"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_transpose"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_true"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_union"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_unsigned_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_uplimit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_variance"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_vector"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_vectorproduct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_verticalalign"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mathml_xor"
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

CREATE VIEW "qti__author"."attribute_idref" ("attribute", "document", "node", "position", "target") AS
SELECT "r1"."attribute", "r1"."document", "r1"."node", "r1"."position", "r1"."target"
FROM "qti"."attribute_idref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_idref" TO "qti__author";

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

CREATE VIEW "qti__author"."headers_target" ("attribute", "document", "node", "position", "target") AS
SELECT "r1"."attribute", "r1"."document", "r1"."node", "r1"."position", "r1"."target"
FROM "qti"."headers_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."headers_target" TO "qti__author";

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

CREATE VIEW "qti__author"."manifest_xml_id" ("attribute", "id", "kind", "node", "package") AS
SELECT "r1"."attribute", "r1"."id", "r1"."kind", "r1"."node", "r1"."package"
FROM "qti"."manifest_xml_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_xml_id" TO "qti__author";

CREATE VIEW "qti__author"."mathml_abs" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_abs" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_abs" TO "qti__author";

CREATE VIEW "qti__author"."mathml_align" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_align" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_align" TO "qti__author";

CREATE VIEW "qti__author"."mathml_alignmentscope" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_alignmentscope" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_alignmentscope" TO "qti__author";

CREATE VIEW "qti__author"."mathml_altimg_valign" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_altimg_valign" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_altimg_valign" TO "qti__author";

CREATE VIEW "qti__author"."mathml_and" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_and" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_and" TO "qti__author";

CREATE VIEW "qti__author"."mathml_annotation" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_annotation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_annotation" TO "qti__author";

CREATE VIEW "qti__author"."mathml_annotation_xml" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_annotation_xml" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_annotation_xml" TO "qti__author";

CREATE VIEW "qti__author"."mathml_apply" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_apply" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_apply" TO "qti__author";

CREATE VIEW "qti__author"."mathml_approx" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_approx" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_approx" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arccos" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arccos" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arccos" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arccosh" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arccosh" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arccosh" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arccot" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arccot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arccot" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arccoth" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arccoth" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arccoth" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arccsc" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arccsc" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arccsc" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arccsch" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arccsch" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arccsch" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arcsec" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arcsec" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arcsec" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arcsech" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arcsech" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arcsech" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arcsin" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arcsin" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arcsin" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arcsinh" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arcsinh" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arcsinh" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arctan" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arctan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arctan" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arctanh" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arctanh" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arctanh" TO "qti__author";

CREATE VIEW "qti__author"."mathml_arg" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_arg" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_arg" TO "qti__author";

CREATE VIEW "qti__author"."mathml_attribute_type" ("attribute", "kind", "type") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."type"
FROM "qti"."mathml_attribute_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_attribute_type" TO "qti__author";

CREATE VIEW "qti__author"."mathml_background" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_background" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_background" TO "qti__author";

CREATE VIEW "qti__author"."mathml_base" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_base" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_base" TO "qti__author";

CREATE VIEW "qti__author"."mathml_bind" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_bind" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_bind" TO "qti__author";

CREATE VIEW "qti__author"."mathml_boolean" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_boolean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_boolean" TO "qti__author";

CREATE VIEW "qti__author"."mathml_bvar" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_bvar" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_bvar" TO "qti__author";

CREATE VIEW "qti__author"."mathml_card" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_card" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_card" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cartesianproduct" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_cartesianproduct" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cartesianproduct" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cbytes" ("id", "value") AS
SELECT "r1"."id", "r1"."value"
FROM "qti"."mathml_cbytes" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cbytes" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cd" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_cd" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cd" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cdgroup" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_cdgroup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cdgroup" TO "qti__author";

CREATE VIEW "qti__author"."mathml_ceiling" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_ceiling" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_ceiling" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cerror" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_cerror" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cerror" TO "qti__author";

CREATE VIEW "qti__author"."mathml_character" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_character" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_character" TO "qti__author";

CREATE VIEW "qti__author"."mathml_charspacing" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_charspacing" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_charspacing" TO "qti__author";

CREATE VIEW "qti__author"."mathml_ci" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_ci" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_ci" TO "qti__author";

CREATE VIEW "qti__author"."mathml_class" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_class" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_class" TO "qti__author";

CREATE VIEW "qti__author"."mathml_closure" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_closure" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_closure" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cn" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_cn" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cn" TO "qti__author";

CREATE VIEW "qti__author"."mathml_codomain" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_codomain" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_codomain" TO "qti__author";

CREATE VIEW "qti__author"."mathml_color" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_color" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_color" TO "qti__author";

CREATE VIEW "qti__author"."mathml_columnalign" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_columnalign" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_columnalign" TO "qti__author";

CREATE VIEW "qti__author"."mathml_columnalignstyle" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_columnalignstyle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_columnalignstyle" TO "qti__author";

CREATE VIEW "qti__author"."mathml_columnwidth" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_columnwidth" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_columnwidth" TO "qti__author";

CREATE VIEW "qti__author"."mathml_complexes" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_complexes" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_complexes" TO "qti__author";

CREATE VIEW "qti__author"."mathml_compose" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_compose" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_compose" TO "qti__author";

CREATE VIEW "qti__author"."mathml_condition" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_condition" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_condition" TO "qti__author";

CREATE VIEW "qti__author"."mathml_conjugate" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_conjugate" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_conjugate" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cos" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_cos" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cos" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cosh" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_cosh" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cosh" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cot" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_cot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cot" TO "qti__author";

CREATE VIEW "qti__author"."mathml_coth" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_coth" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_coth" TO "qti__author";

CREATE VIEW "qti__author"."mathml_crossout" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_crossout" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_crossout" TO "qti__author";

CREATE VIEW "qti__author"."mathml_cs" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_cs" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_cs" TO "qti__author";

CREATE VIEW "qti__author"."mathml_csc" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_csc" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_csc" TO "qti__author";

CREATE VIEW "qti__author"."mathml_csch" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_csch" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_csch" TO "qti__author";

CREATE VIEW "qti__author"."mathml_csymbol" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_csymbol" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_csymbol" TO "qti__author";

CREATE VIEW "qti__author"."mathml_curl" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_curl" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_curl" TO "qti__author";

CREATE VIEW "qti__author"."mathml_declare" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_declare" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_declare" TO "qti__author";

CREATE VIEW "qti__author"."mathml_definition_url" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_definition_url" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_definition_url" TO "qti__author";

CREATE VIEW "qti__author"."mathml_degree" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_degree" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_degree" TO "qti__author";

CREATE VIEW "qti__author"."mathml_determinant" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_determinant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_determinant" TO "qti__author";

CREATE VIEW "qti__author"."mathml_diff" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_diff" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_diff" TO "qti__author";

CREATE VIEW "qti__author"."mathml_dir" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_dir" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_dir" TO "qti__author";

CREATE VIEW "qti__author"."mathml_display" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_display" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_display" TO "qti__author";

CREATE VIEW "qti__author"."mathml_divergence" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_divergence" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_divergence" TO "qti__author";

CREATE VIEW "qti__author"."mathml_divide" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_divide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_divide" TO "qti__author";

CREATE VIEW "qti__author"."mathml_domain" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_domain" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_domain" TO "qti__author";

CREATE VIEW "qti__author"."mathml_domainofapplication" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_domainofapplication" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_domainofapplication" TO "qti__author";

CREATE VIEW "qti__author"."mathml_edge" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_edge" TO "qti__author";

CREATE VIEW "qti__author"."mathml_embed_source" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_embed_source" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_embed_source" TO "qti__author";

CREATE VIEW "qti__author"."mathml_emptyset" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_emptyset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_emptyset" TO "qti__author";

CREATE VIEW "qti__author"."mathml_eq" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_eq" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_eq" TO "qti__author";

CREATE VIEW "qti__author"."mathml_equivalent" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_equivalent" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_equivalent" TO "qti__author";

CREATE VIEW "qti__author"."mathml_eulergamma" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_eulergamma" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_eulergamma" TO "qti__author";

CREATE VIEW "qti__author"."mathml_exists" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_exists" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_exists" TO "qti__author";

CREATE VIEW "qti__author"."mathml_exp" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_exp" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_exp" TO "qti__author";

CREATE VIEW "qti__author"."mathml_exponentiale" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_exponentiale" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_exponentiale" TO "qti__author";

CREATE VIEW "qti__author"."mathml_factorial" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_factorial" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_factorial" TO "qti__author";

CREATE VIEW "qti__author"."mathml_factorof" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_factorof" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_factorof" TO "qti__author";

CREATE VIEW "qti__author"."mathml_false" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_false" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_false" TO "qti__author";

CREATE VIEW "qti__author"."mathml_floor" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_floor" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_floor" TO "qti__author";

CREATE VIEW "qti__author"."mathml_fn" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_fn" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_fn" TO "qti__author";

CREATE VIEW "qti__author"."mathml_fontstyle" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_fontstyle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_fontstyle" TO "qti__author";

CREATE VIEW "qti__author"."mathml_fontweight" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_fontweight" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_fontweight" TO "qti__author";

CREATE VIEW "qti__author"."mathml_forall" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_forall" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_forall" TO "qti__author";

CREATE VIEW "qti__author"."mathml_form" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_form" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_form" TO "qti__author";

CREATE VIEW "qti__author"."mathml_framespacing" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_framespacing" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_framespacing" TO "qti__author";

CREATE VIEW "qti__author"."mathml_gcd" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_gcd" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_gcd" TO "qti__author";

CREATE VIEW "qti__author"."mathml_geq" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_geq" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_geq" TO "qti__author";

CREATE VIEW "qti__author"."mathml_grad" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_grad" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_grad" TO "qti__author";

CREATE VIEW "qti__author"."mathml_group_alignment" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_group_alignment" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_group_alignment" TO "qti__author";

CREATE VIEW "qti__author"."mathml_group_alignment_list" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_group_alignment_list" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_group_alignment_list" TO "qti__author";

CREATE VIEW "qti__author"."mathml_group_alignment_list_list" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_group_alignment_list_list" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_group_alignment_list_list" TO "qti__author";

CREATE VIEW "qti__author"."mathml_gt" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_gt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_gt" TO "qti__author";

CREATE VIEW "qti__author"."mathml_href" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_href" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_href" TO "qti__author";

CREATE VIEW "qti__author"."mathml_ident" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_ident" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_ident" TO "qti__author";

CREATE VIEW "qti__author"."mathml_image" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_image" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_image" TO "qti__author";

CREATE VIEW "qti__author"."mathml_imaginary" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_imaginary" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_imaginary" TO "qti__author";

CREATE VIEW "qti__author"."mathml_imaginaryi" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_imaginaryi" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_imaginaryi" TO "qti__author";

CREATE VIEW "qti__author"."mathml_implies" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_implies" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_implies" TO "qti__author";

CREATE VIEW "qti__author"."mathml_in" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_in" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_in" TO "qti__author";

CREATE VIEW "qti__author"."mathml_indentalign" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_indentalign" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_indentalign" TO "qti__author";

CREATE VIEW "qti__author"."mathml_indentalign_line" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_indentalign_line" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_indentalign_line" TO "qti__author";

CREATE VIEW "qti__author"."mathml_indentshift_line" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_indentshift_line" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_indentshift_line" TO "qti__author";

CREATE VIEW "qti__author"."mathml_index" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_index" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_index" TO "qti__author";

CREATE VIEW "qti__author"."mathml_infinity" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_infinity" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_infinity" TO "qti__author";

CREATE VIEW "qti__author"."mathml_infixlinebreakstyle" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_infixlinebreakstyle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_infixlinebreakstyle" TO "qti__author";

CREATE VIEW "qti__author"."mathml_int" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_int" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_int" TO "qti__author";

CREATE VIEW "qti__author"."mathml_integers" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_integers" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_integers" TO "qti__author";

CREATE VIEW "qti__author"."mathml_intersect" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_intersect" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_intersect" TO "qti__author";

CREATE VIEW "qti__author"."mathml_interval" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_interval" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_interval" TO "qti__author";

CREATE VIEW "qti__author"."mathml_inverse" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_inverse" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_inverse" TO "qti__author";

CREATE VIEW "qti__author"."mathml_lambda" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_lambda" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_lambda" TO "qti__author";

CREATE VIEW "qti__author"."mathml_laplacian" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_laplacian" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_laplacian" TO "qti__author";

CREATE VIEW "qti__author"."mathml_lcm" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_lcm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_lcm" TO "qti__author";

CREATE VIEW "qti__author"."mathml_length" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_length" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_length" TO "qti__author";

CREATE VIEW "qti__author"."mathml_length_list" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_length_list" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_length_list" TO "qti__author";

CREATE VIEW "qti__author"."mathml_leq" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_leq" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_leq" TO "qti__author";

CREATE VIEW "qti__author"."mathml_limit" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_limit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_limit" TO "qti__author";

CREATE VIEW "qti__author"."mathml_line_thickness" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_line_thickness" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_line_thickness" TO "qti__author";

CREATE VIEW "qti__author"."mathml_linebreak" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_linebreak" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_linebreak" TO "qti__author";

CREATE VIEW "qti__author"."mathml_linebreakstyle" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_linebreakstyle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_linebreakstyle" TO "qti__author";

CREATE VIEW "qti__author"."mathml_linestyle" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_linestyle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_linestyle" TO "qti__author";

CREATE VIEW "qti__author"."mathml_linestyle_list" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_linestyle_list" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_linestyle_list" TO "qti__author";

CREATE VIEW "qti__author"."mathml_list" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_list" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_list" TO "qti__author";

CREATE VIEW "qti__author"."mathml_ln" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_ln" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_ln" TO "qti__author";

CREATE VIEW "qti__author"."mathml_location" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_location" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_location" TO "qti__author";

CREATE VIEW "qti__author"."mathml_log" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_log" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_log" TO "qti__author";

CREATE VIEW "qti__author"."mathml_logbase" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_logbase" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_logbase" TO "qti__author";

CREATE VIEW "qti__author"."mathml_longdivstyle" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_longdivstyle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_longdivstyle" TO "qti__author";

CREATE VIEW "qti__author"."mathml_lowlimit" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_lowlimit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_lowlimit" TO "qti__author";

CREATE VIEW "qti__author"."mathml_lt" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_lt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_lt" TO "qti__author";

CREATE VIEW "qti__author"."mathml_maction" ("actiontype", "id") AS
SELECT "r1"."actiontype", "r1"."id"
FROM "qti"."mathml_maction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_maction" TO "qti__author";

CREATE VIEW "qti__author"."mathml_maligngroup" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_maligngroup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_maligngroup" TO "qti__author";

CREATE VIEW "qti__author"."mathml_malignmark" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_malignmark" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_malignmark" TO "qti__author";

CREATE VIEW "qti__author"."mathml_math" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_math" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_math" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mathsize" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_mathsize" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mathsize" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mathvariant" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_mathvariant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mathvariant" TO "qti__author";

CREATE VIEW "qti__author"."mathml_matrix" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_matrix" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_matrix" TO "qti__author";

CREATE VIEW "qti__author"."mathml_matrixrow" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_matrixrow" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_matrixrow" TO "qti__author";

CREATE VIEW "qti__author"."mathml_max" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_max" TO "qti__author";

CREATE VIEW "qti__author"."mathml_maxsize" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_maxsize" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_maxsize" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mean" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mean" TO "qti__author";

CREATE VIEW "qti__author"."mathml_median" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_median" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_median" TO "qti__author";

CREATE VIEW "qti__author"."mathml_menclose" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_menclose" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_menclose" TO "qti__author";

CREATE VIEW "qti__author"."mathml_merror" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_merror" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_merror" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mfenced" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mfenced" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mfenced" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mfrac" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mfrac" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mfrac" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mglyph" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mglyph" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mglyph" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mi" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mi" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mi" TO "qti__author";

CREATE VIEW "qti__author"."mathml_min" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_min" TO "qti__author";

CREATE VIEW "qti__author"."mathml_minus" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_minus" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_minus" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mlabeledtr" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mlabeledtr" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mlabeledtr" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mlongdiv" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mlongdiv" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mlongdiv" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mmultiscripts" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mmultiscripts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mmultiscripts" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mn" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mn" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mn" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mo" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mo" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mo" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mode" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mode" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mode" TO "qti__author";

CREATE VIEW "qti__author"."mathml_moment" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_moment" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_moment" TO "qti__author";

CREATE VIEW "qti__author"."mathml_momentabout" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_momentabout" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_momentabout" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mover" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mover" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mover" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mpadded" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mpadded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mpadded" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mpadded_length" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_mpadded_length" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mpadded_length" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mphantom" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mphantom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mphantom" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mprescripts" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mprescripts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mprescripts" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mroot" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mroot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mroot" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mrow" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mrow" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mrow" TO "qti__author";

CREATE VIEW "qti__author"."mathml_ms" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_ms" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_ms" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mscarries" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mscarries" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mscarries" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mscarry" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mscarry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mscarry" TO "qti__author";

CREATE VIEW "qti__author"."mathml_msgroup" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_msgroup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_msgroup" TO "qti__author";

CREATE VIEW "qti__author"."mathml_msline" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_msline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_msline" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mspace" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mspace" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mspace" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mspace_linebreak" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_mspace_linebreak" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mspace_linebreak" TO "qti__author";

CREATE VIEW "qti__author"."mathml_msqrt" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_msqrt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_msqrt" TO "qti__author";

CREATE VIEW "qti__author"."mathml_msrow" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_msrow" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_msrow" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mstack" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mstack" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mstack" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mstyle" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mstyle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mstyle" TO "qti__author";

CREATE VIEW "qti__author"."mathml_msub" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_msub" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_msub" TO "qti__author";

CREATE VIEW "qti__author"."mathml_msubsup" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_msubsup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_msubsup" TO "qti__author";

CREATE VIEW "qti__author"."mathml_msup" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_msup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_msup" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mtable" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mtable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mtable" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mtd" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mtd" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mtd" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mtext" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mtext" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mtext" TO "qti__author";

CREATE VIEW "qti__author"."mathml_mtr" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_mtr" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_mtr" TO "qti__author";

CREATE VIEW "qti__author"."mathml_munder" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_munder" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_munder" TO "qti__author";

CREATE VIEW "qti__author"."mathml_munderover" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_munderover" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_munderover" TO "qti__author";

CREATE VIEW "qti__author"."mathml_name" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_name" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_name" TO "qti__author";

CREATE VIEW "qti__author"."mathml_nargs" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_nargs" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_nargs" TO "qti__author";

CREATE VIEW "qti__author"."mathml_naturalnumbers" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_naturalnumbers" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_naturalnumbers" TO "qti__author";

CREATE VIEW "qti__author"."mathml_neq" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_neq" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_neq" TO "qti__author";

CREATE VIEW "qti__author"."mathml_none" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_none" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_none" TO "qti__author";

CREATE VIEW "qti__author"."mathml_not" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_not" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_not" TO "qti__author";

CREATE VIEW "qti__author"."mathml_notanumber" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_notanumber" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_notanumber" TO "qti__author";

CREATE VIEW "qti__author"."mathml_notin" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_notin" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_notin" TO "qti__author";

CREATE VIEW "qti__author"."mathml_notprsubset" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_notprsubset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_notprsubset" TO "qti__author";

CREATE VIEW "qti__author"."mathml_notsubset" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_notsubset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_notsubset" TO "qti__author";

CREATE VIEW "qti__author"."mathml_number" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_number" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_number" TO "qti__author";

CREATE VIEW "qti__author"."mathml_occurrence" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_occurrence" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_occurrence" TO "qti__author";

CREATE VIEW "qti__author"."mathml_or" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_or" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_or" TO "qti__author";

CREATE VIEW "qti__author"."mathml_order" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_order" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_order" TO "qti__author";

CREATE VIEW "qti__author"."mathml_otherwise" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_otherwise" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_otherwise" TO "qti__author";

CREATE VIEW "qti__author"."mathml_outerproduct" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_outerproduct" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_outerproduct" TO "qti__author";

CREATE VIEW "qti__author"."mathml_overflow" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_overflow" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_overflow" TO "qti__author";

CREATE VIEW "qti__author"."mathml_partialdiff" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_partialdiff" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_partialdiff" TO "qti__author";

CREATE VIEW "qti__author"."mathml_pi" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_pi" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_pi" TO "qti__author";

CREATE VIEW "qti__author"."mathml_piece" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_piece" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_piece" TO "qti__author";

CREATE VIEW "qti__author"."mathml_piecewise" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_piecewise" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_piecewise" TO "qti__author";

CREATE VIEW "qti__author"."mathml_plus" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_plus" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_plus" TO "qti__author";

CREATE VIEW "qti__author"."mathml_position" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_position" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_position" TO "qti__author";

CREATE VIEW "qti__author"."mathml_power" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_power" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_power" TO "qti__author";

CREATE VIEW "qti__author"."mathml_primes" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_primes" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_primes" TO "qti__author";

CREATE VIEW "qti__author"."mathml_product" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_product" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_product" TO "qti__author";

CREATE VIEW "qti__author"."mathml_prsubset" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_prsubset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_prsubset" TO "qti__author";

CREATE VIEW "qti__author"."mathml_quotient" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_quotient" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_quotient" TO "qti__author";

CREATE VIEW "qti__author"."mathml_rationals" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_rationals" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_rationals" TO "qti__author";

CREATE VIEW "qti__author"."mathml_real" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_real" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_real" TO "qti__author";

CREATE VIEW "qti__author"."mathml_reals" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_reals" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_reals" TO "qti__author";

CREATE VIEW "qti__author"."mathml_reln" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_reln" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_reln" TO "qti__author";

CREATE VIEW "qti__author"."mathml_rem" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_rem" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_rem" TO "qti__author";

CREATE VIEW "qti__author"."mathml_root" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_root" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_root" TO "qti__author";

CREATE VIEW "qti__author"."mathml_rowalign" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_rowalign" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_rowalign" TO "qti__author";

CREATE VIEW "qti__author"."mathml_scalarproduct" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_scalarproduct" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_scalarproduct" TO "qti__author";

CREATE VIEW "qti__author"."mathml_scriptlevel" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_scriptlevel" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_scriptlevel" TO "qti__author";

CREATE VIEW "qti__author"."mathml_sdev" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_sdev" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_sdev" TO "qti__author";

CREATE VIEW "qti__author"."mathml_sec" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_sec" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_sec" TO "qti__author";

CREATE VIEW "qti__author"."mathml_sech" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_sech" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_sech" TO "qti__author";

CREATE VIEW "qti__author"."mathml_selection" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_selection" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_selection" TO "qti__author";

CREATE VIEW "qti__author"."mathml_selector" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_selector" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_selector" TO "qti__author";

CREATE VIEW "qti__author"."mathml_semantics" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_semantics" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_semantics" TO "qti__author";

CREATE VIEW "qti__author"."mathml_semantics_ci" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_semantics_ci" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_semantics_ci" TO "qti__author";

CREATE VIEW "qti__author"."mathml_sep" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_sep" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_sep" TO "qti__author";

CREATE VIEW "qti__author"."mathml_set" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_set" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_set" TO "qti__author";

CREATE VIEW "qti__author"."mathml_setdiff" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_setdiff" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_setdiff" TO "qti__author";

CREATE VIEW "qti__author"."mathml_share" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_share" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_share" TO "qti__author";

CREATE VIEW "qti__author"."mathml_shift" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_shift" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_shift" TO "qti__author";

CREATE VIEW "qti__author"."mathml_side" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_side" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_side" TO "qti__author";

CREATE VIEW "qti__author"."mathml_sin" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_sin" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_sin" TO "qti__author";

CREATE VIEW "qti__author"."mathml_sinh" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_sinh" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_sinh" TO "qti__author";

CREATE VIEW "qti__author"."mathml_span" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_span" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_span" TO "qti__author";

CREATE VIEW "qti__author"."mathml_src" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_src" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_src" TO "qti__author";

CREATE VIEW "qti__author"."mathml_string" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_string" TO "qti__author";

CREATE VIEW "qti__author"."mathml_subset" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_subset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_subset" TO "qti__author";

CREATE VIEW "qti__author"."mathml_sum" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_sum" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_sum" TO "qti__author";

CREATE VIEW "qti__author"."mathml_table_width" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_table_width" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_table_width" TO "qti__author";

CREATE VIEW "qti__author"."mathml_tan" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_tan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_tan" TO "qti__author";

CREATE VIEW "qti__author"."mathml_tanh" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_tanh" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_tanh" TO "qti__author";

CREATE VIEW "qti__author"."mathml_tendsto" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_tendsto" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_tendsto" TO "qti__author";

CREATE VIEW "qti__author"."mathml_times" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_times" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_times" TO "qti__author";

CREATE VIEW "qti__author"."mathml_transpose" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_transpose" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_transpose" TO "qti__author";

CREATE VIEW "qti__author"."mathml_true" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_true" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_true" TO "qti__author";

CREATE VIEW "qti__author"."mathml_union" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_union" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_union" TO "qti__author";

CREATE VIEW "qti__author"."mathml_unsigned_integer" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_unsigned_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_unsigned_integer" TO "qti__author";

CREATE VIEW "qti__author"."mathml_uplimit" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_uplimit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_uplimit" TO "qti__author";

CREATE VIEW "qti__author"."mathml_variance" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_variance" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_variance" TO "qti__author";

CREATE VIEW "qti__author"."mathml_vector" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_vector" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_vector" TO "qti__author";

CREATE VIEW "qti__author"."mathml_vectorproduct" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_vectorproduct" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_vectorproduct" TO "qti__author";

CREATE VIEW "qti__author"."mathml_verticalalign" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."mathml_verticalalign" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_verticalalign" TO "qti__author";

CREATE VIEW "qti__author"."mathml_xor" ("id") AS
SELECT "r1"."id"
FROM "qti"."mathml_xor" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mathml_xor" TO "qti__author";

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

CREATE VIEW "qti__author"."xsi_type_attribute" ("kind", "local", "namespace", "node", "prefix", "value") AS
SELECT "r1"."kind", "r1"."local", "r1"."namespace", "r1"."node", "r1"."prefix", "r1"."value"
FROM "qti"."xsi_type_attribute" AS "r1";

GRANT SELECT ON TABLE "qti__author"."xsi_type_attribute" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."mathml_abs" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_align" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_alignmentscope" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_altimg_valign" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_and" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_annotation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_annotation_xml" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_apply" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_approx" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arccos" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arccosh" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arccot" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arccoth" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arccsc" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arccsch" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arcsec" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arcsech" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arcsin" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arcsinh" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arctan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arctanh" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_arg" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_background" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_base" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_bind" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_bvar" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_card" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cartesianproduct" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cbytes" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cd" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cdgroup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_ceiling" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cerror" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_character" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_charspacing" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_ci" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_class" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_closure" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cn" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_codomain" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_color" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_columnalign" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_columnalignstyle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_columnwidth" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_complexes" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_compose" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_condition" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_conjugate" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cos" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cosh" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cot" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_coth" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_crossout" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_cs" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_csc" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_csch" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_csymbol" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_curl" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_declare" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_definition_url" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_degree" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_determinant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_diff" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_dir" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_display" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_divergence" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_divide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_domain" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_domainofapplication" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_embed_source" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_emptyset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_eq" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_equivalent" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_eulergamma" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_exists" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_exp" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_exponentiale" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_factorial" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_factorof" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_false" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_floor" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_fn" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_fontstyle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_fontweight" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_forall" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_form" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_framespacing" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_gcd" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_geq" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_grad" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_group_alignment" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_group_alignment_list" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_group_alignment_list_list" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_gt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_href" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_ident" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_image" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_imaginary" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_imaginaryi" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_implies" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_in" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_indentalign" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_indentalign_line" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_indentshift_line" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_index" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_infinity" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_infixlinebreakstyle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_int" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_integers" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_intersect" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_interval" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_inverse" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_lambda" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_laplacian" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_lcm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_length" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_length_list" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_leq" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_limit" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_line_thickness" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_linebreak" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_linebreakstyle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_linestyle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_linestyle_list" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_list" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_ln" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_location" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_log" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_logbase" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_longdivstyle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_lowlimit" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_lt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_maction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_maligngroup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_malignmark" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_math" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mathsize" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mathvariant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_matrix" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_matrixrow" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_max" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_maxsize" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_median" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_menclose" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_merror" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mfenced" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mfrac" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mglyph" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mi" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_minus" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mlabeledtr" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mlongdiv" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mmultiscripts" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mn" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mo" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mode" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_moment" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_momentabout" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mover" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mpadded" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mpadded_length" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mphantom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mprescripts" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mroot" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mrow" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_ms" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mscarries" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mscarry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_msgroup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_msline" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mspace" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mspace_linebreak" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_msqrt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_msrow" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mstack" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mstyle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_msub" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_msubsup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_msup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mtable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mtd" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mtext" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_mtr" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_munder" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_munderover" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_name" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_nargs" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_naturalnumbers" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_neq" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_none" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_not" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_notanumber" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_notin" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_notprsubset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_notsubset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_number" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_occurrence" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_or" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_order" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_otherwise" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_outerproduct" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_overflow" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_partialdiff" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_pi" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_piece" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_piecewise" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_plus" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_position" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_power" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_primes" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_product" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_prsubset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_quotient" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_rationals" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_real" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_reals" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_reln" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_rem" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_root" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_rowalign" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_scalarproduct" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_scriptlevel" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_sdev" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_sec" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_sech" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_selection" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_selector" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_semantics" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_semantics_ci" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_sep" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_setdiff" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_share" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_shift" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_side" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_sin" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_sinh" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_span" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_src" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_subset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_sum" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_table_width" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_tan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_tanh" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_tendsto" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_times" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_transpose" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_true" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_union" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_unsigned_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_uplimit" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_variance" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_vector" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_vectorproduct" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_verticalalign" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mathml_xor" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_class" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_dir" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
