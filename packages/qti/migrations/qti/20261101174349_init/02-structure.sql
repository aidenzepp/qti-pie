CREATE TABLE "qti"."admission" (
  "child" "qti"."node_kind" NOT NULL,
  "parent" "qti"."node_kind" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__admission_pk_5vjazwledx" PRIMARY KEY ("version", "parent", "child")
);

CREATE TABLE "qti"."assessment_item" (
  "adaptive" "qti"."__text_cz7v66q3ce" NOT NULL,
  "id" uuid NOT NULL,
  "time_dependent" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__assessment_item_pk_5svyn5edkt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."attribute_entity_reference" (
  "attribute" "qti"."__text_raisrajgpi" NOT NULL,
  "name" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  "offset" bigint NOT NULL,
  CONSTRAINT "__attribute_entity_reference_pk_pnly3xqwxa" PRIMARY KEY ("node", "attribute", "offset")
);

CREATE TABLE "qti"."attribute_lexical" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_kqeswaav46" NOT NULL,
  CONSTRAINT "__attribute_lexical_pk_qi53b27egd" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."binding_fit" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "interaction_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__binding_fit_pk_zlfybq6q3o" PRIMARY KEY ("interaction_kind", "base_type", "cardinality")
);

CREATE TABLE "qti"."built_in_ref" (
  "id" uuid NOT NULL,
  "name" "qti"."built_in" NOT NULL,
  CONSTRAINT "__built_in_ref_pk_efu5zp7bth" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."choice_interaction" (
  "id" uuid NOT NULL,
  "max_choices" "qti"."__text_clza6vokfo" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices" "qti"."__text_clza6vokfo" NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "orientation" "qti"."__text_yakcqa4zli" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__choice_interaction_pk_dxmiqmyvgh" PRIMARY KEY ("id"),
  CONSTRAINT "choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."choice_interaction_max_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__choice_interaction_max_selections_message_pk_tlfjnpqllf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."choice_interaction_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__choice_interaction_min_selections_message_pk_buoctmpill" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."comment" (
  "id" uuid NOT NULL,
  "text" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__comment_pk_zalmloung6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."correct_response_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__correct_response_arm_pk_wusr6prctw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declaration" (
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  CONSTRAINT "__declaration_pk_kfs3bogieg" PRIMARY KEY ("id"),
  CONSTRAINT "__declaration_key_document_identifier_nhssflcoha" UNIQUE ("document", "identifier"),
  CONSTRAINT "declaration_not_reserved" CHECK ((NOT "identifier" IN ('completionStatus'::text, 'numAttempts'::text, 'duration'::text)) IS TRUE),
  CONSTRAINT "__declaration_key_id_shape_mu2s257vd4" UNIQUE ("id", "shape"),
  CONSTRAINT "__declaration_key_document_identifier_shape_lzyberz5rq" UNIQUE ("document", "identifier", "shape"),
  CONSTRAINT "__declaration_key_document_identifier_kind_6qqc7ch76r" UNIQUE ("document", "identifier", "kind"),
  CONSTRAINT "__declaration_key_id_document_identifier_q47zggzoeq" UNIQUE ("id", "document", "identifier"),
  CONSTRAINT "__declaration_key_id_kind_dpb6dzt55d" UNIQUE ("id", "kind"),
  CONSTRAINT "__declaration_key_id_document_identifier_kind_mvchic7xpf" UNIQUE ("id", "document", "identifier", "kind")
);

CREATE TABLE "qti"."declaration_external_scored" (
  "declaration" uuid NOT NULL,
  "value" "qti"."__text_6uwfpnix5n" NOT NULL,
  CONSTRAINT "__declaration_external_scored_pk_iucwsc25qw" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_interpretation" (
  "declaration" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__declaration_interpretation_pk_jzan4e33hu" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_long_interpretation" (
  "declaration" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__declaration_long_interpretation_pk_gsj2qzn5ta" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_mastery_value" (
  "declaration" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__declaration_mastery_value_pk_c3ablixaqt" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_normal_maximum" (
  "declaration" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__declaration_normal_maximum_pk_ae4pqmamf6" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_normal_minimum" (
  "declaration" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__declaration_normal_minimum_pk_ktd2c3st7m" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_variable_identifier_ref" (
  "declaration" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__declaration_variable_identifier_ref_pk_6lwgamxhdv" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_view" (
  "declaration" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__declaration_view_pk_6zxyzofraw" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declared_adaptive" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_adaptive_pk_peor3rnexn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_fixed" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_fixed_pk_p223qdk6qz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_max_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_max_choices_pk_kqpg3t3hvl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_min_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_min_choices_pk_wjom3ecba4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_orientation" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_orientation_pk_idge7x3tju" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_ref" (
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__declared_ref_pk_uif5t6o33f" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_show_hide_pk_lvd64jnrrn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_shuffle" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_shuffle_pk_tmz5d3bh2j" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" uuid NOT NULL,
  "position" bigint NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  "value_set" uuid NOT NULL,
  CONSTRAINT "__declared_value_pk_5pcq2npmhm" PRIMARY KEY ("id"),
  CONSTRAINT "__declared_value_key_id_base_type_3dbnrwpq7k" UNIQUE ("id", "base_type"),
  CONSTRAINT "__declared_value_key_id_shape_37ypo3n26u" UNIQUE ("id", "shape")
);

CREATE TABLE "qti"."declared_value_boolean" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__declared_value_boolean_pk_ddj52fqh6d" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_directed_pair" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__declared_value_directed_pair_pk_6wxayfungq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_duration" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__declared_value_duration_pk_35uc6vgqks" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_file" (
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__declared_value_file_pk_mtfyf4xj5n" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_float" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__declared_value_float_pk_jl3zamlr24" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_identifier" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__declared_value_identifier_pk_a74zzqpigw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_integer" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__declared_value_integer_pk_4gbwrvrfsf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_pair" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__declared_value_pair_pk_x7wxicbs2y" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_point" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__declared_value_point_pk_2zrgg3g5eh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_string" (
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__declared_value_string_pk_sf7doe2qrv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_uri" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__declared_value_uri_pk_w6vkr3buaw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."default_value_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__default_value_arm_pk_gsdxrg3f6p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."dependency" (
  "id" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "target" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__dependency_pk_d6a6ko4xiy" PRIMARY KEY ("id"),
  CONSTRAINT "dependency_not_self" CHECK (("resource" <> "target") IS TRUE)
);

CREATE TABLE "qti"."document" (
  "id" uuid NOT NULL,
  "package" uuid NOT NULL,
  "path" "qti"."__text_c34ec7mxid" NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "resource_type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__document_pk_4kx3ps5ktb" PRIMARY KEY ("id"),
  CONSTRAINT "__document_key_package_path_hvs3spxdfn" UNIQUE ("package", "path"),
  CONSTRAINT "__document_key_package_resource_ffl2twv7tp" UNIQUE ("package", "resource"),
  CONSTRAINT "__document_key_id_package_resource_root_nfipbzda3x" UNIQUE ("id", "package", "resource", "root")
);

CREATE TABLE "qti"."document_id" (
  "document" uuid NOT NULL,
  "holder" "qti"."id_holder" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__document_id_pk_x7sxopulh7" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__document_id_key_document_id_holder_lfvlmxo4b4" UNIQUE ("document", "id", "holder")
);

CREATE TABLE "qti"."document_identifier" (
  "document" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__document_identifier_pk_afnsowpxmd" PRIMARY KEY ("document"),
  CONSTRAINT "__document_identifier_key_package_resource_4w3bw3solt" UNIQUE ("package", "resource"),
  CONSTRAINT "__document_identifier_key_package_resource_value_jyew76k7bo" UNIQUE ("package", "resource", "value")
);

CREATE TABLE "qti"."document_title" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "document" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__document_title_pk_aemuz3eyle" PRIMARY KEY ("document"),
  CONSTRAINT "__document_title_key_package_resource_34i3iox4ft" UNIQUE ("package", "resource"),
  CONSTRAINT "__document_title_key_package_resource_collapsed_x734cq6egx" UNIQUE ("package", "resource", "collapsed")
);

CREATE TABLE "qti"."edge" (
  "child" uuid NOT NULL,
  "child_kind" "qti"."node_kind" NOT NULL,
  "parent" uuid NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "position" bigint NOT NULL,
  "tree" uuid NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__edge_pk_7mkowjkaik" PRIMARY KEY ("parent", "position"),
  CONSTRAINT "__edge_key_child_hgvfjbjilm" UNIQUE ("child"),
  CONSTRAINT "__edge_key_child_parent_e22uz7r65h" UNIQUE ("child", "parent"),
  CONSTRAINT "__edge_key_child_position_ycndxvfvdk" UNIQUE ("child", "position"),
  CONSTRAINT "__edge_key_child_parent_position_5nn5z4ycin" UNIQUE ("child", "parent", "position")
);

CREATE TABLE "qti"."entity_reference" (
  "id" uuid NOT NULL,
  "name" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__entity_reference_pk_dmli6ubp5p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."expression" (
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__expression_pk_djkytcc7ot" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."file" (
  "href" "qti"."__text_c34ec7mxid" NOT NULL,
  "id" uuid NOT NULL,
  "package" uuid NOT NULL,
  "position" bigint NOT NULL,
  "resource" uuid NOT NULL,
  CONSTRAINT "__file_pk_i2bjocdyi2" PRIMARY KEY ("id"),
  CONSTRAINT "__file_key_package_resource_position_so6ywuntxa" UNIQUE ("package", "resource", "position")
);

CREATE TABLE "qti"."file_content" (
  "byte_length" bigint NOT NULL,
  "content" "qti"."__text_tso7kvy6dv" NOT NULL,
  "mime_type" "qti"."__text_ifp42a6zk6" NOT NULL,
  "package" uuid NOT NULL,
  "path" "qti"."__text_c34ec7mxid" NOT NULL,
  CONSTRAINT "__file_content_pk_kztaujzbaq" PRIMARY KEY ("package", "path")
);

CREATE TABLE "qti"."img" (
  "alt" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "id" uuid NOT NULL,
  "src" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__img_pk_5crzbdfk6h" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."img_height" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__img_height_pk_wjxjfgsbqi" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."img_longdesc" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__img_longdesc_pk_h464cr4fxi" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."img_width" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__img_width_pk_h4nleda2od" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interaction_binding" (
  "document" uuid NOT NULL,
  "interaction_kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  CONSTRAINT "__interaction_binding_pk_5gb33vv6zw" PRIMARY KEY ("node"),
  CONSTRAINT "__interaction_binding_key_document_response_22rxbgbwhi" UNIQUE ("document", "response_identifier"),
  CONSTRAINT "__interaction_binding_key_node_shape_yhsfpovhkg" UNIQUE ("node", "shape")
);

CREATE TABLE "qti"."item_body" (
  "id" uuid NOT NULL,
  "item" uuid NOT NULL,
  CONSTRAINT "__item_body_pk_6niwnztdcy" PRIMARY KEY ("id"),
  CONSTRAINT "__item_body_key_item_ksx3s2fj7n" UNIQUE ("item")
);

CREATE TABLE "qti"."literal" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__literal_pk_aelubxdbzj" PRIMARY KEY ("id"),
  CONSTRAINT "__literal_key_id_base_type_n6picv5q76" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."literal_boolean" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__literal_boolean_pk_pzorcnr4yz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_directed_pair" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__literal_directed_pair_pk_4awlgrcin7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_duration" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__literal_duration_pk_ogja6w3jzn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_file" (
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__literal_file_pk_ex3xvxhvfs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_float" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__literal_float_pk_rfnv2wul2k" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_identifier" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__literal_identifier_pk_3pbylrgphi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_integer" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__literal_integer_pk_puy5zdh44m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_pair" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__literal_pair_pk_2djc6cp3gc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_point" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__literal_point_pk_f5phugbw7g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_string" (
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__literal_string_pk_7jxwemsry2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_uri" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__literal_uri_pk_fzufg3fltq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom" (
  "id" uuid NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__lom_pk_cfwl65ptfj" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_key_id_owner_2k4rqjrbzk" UNIQUE ("id", "owner"),
  CONSTRAINT "__lom_key_id_package_mwadkm4ng4" UNIQUE ("id", "package")
);

CREATE TABLE "qti"."lom_aggregation_level" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_aggregation_level_pk_s2tympvcri" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_contribute" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "parent" uuid NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__lom_contribute_pk_mumbgx5cgs" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_contribute_key_parent_position_4mn4pfsbrs" UNIQUE ("parent", "position")
);

CREATE TABLE "qti"."lom_copyright_and_other_restrictions" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "rights" uuid NOT NULL,
  CONSTRAINT "__lom_copyright_and_other_restrictions_pk_5pyhbwfpgo" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_copyright_and_other_restrictions_key_rights_7wudgbtm3p" UNIQUE ("rights")
);

CREATE TABLE "qti"."lom_cost" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "rights" uuid NOT NULL,
  CONSTRAINT "__lom_cost_pk_ifg475rcuj" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_cost_key_rights_y6buu3xmcc" UNIQUE ("rights")
);

CREATE TABLE "qti"."lom_coverage" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_coverage_pk_u27robnrhh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_date" (
  "contribute" uuid NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_date_pk_5uwbwivc4y" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_date_key_contribute_5wm3nnpxkr" UNIQUE ("contribute")
);

CREATE TABLE "qti"."lom_date_time" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "date" uuid NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_date_time_pk_cly7hfrljo" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_date_time_key_date_rxpe6aqrb6" UNIQUE ("date")
);

CREATE TABLE "qti"."lom_description" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_description_pk_pd5msgzo2g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_duration" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "technical" uuid NOT NULL,
  CONSTRAINT "__lom_duration_pk_ydmuoijchs" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_duration_key_technical_4cqyvamai2" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_duration_string" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "duration" uuid NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_duration_string_pk_y5fwqaj5mn" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_duration_string_key_duration_dzi5dckpud" UNIQUE ("duration")
);

CREATE TABLE "qti"."lom_entity" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "contribute" uuid NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "position" bigint NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_entity_pk_ck4cxgvlzx" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_entity_key_contribute_position_mwtyzdiqme" UNIQUE ("contribute", "position")
);

CREATE TABLE "qti"."lom_format" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "position" bigint NOT NULL,
  "technical" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_format_pk_jnwntdq52w" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_format_key_technical_position_krheameqai" UNIQUE ("technical", "position")
);

CREATE TABLE "qti"."lom_general" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_general_pk_3nzxyyowxe" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_general_key_lom_7ftwyoy6mr" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_general_title" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  CONSTRAINT "__lom_general_title_pk_s5eey4iqlu" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_general_title_key_lom_nsilkncsee" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_identifier" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__lom_identifier_pk_vfc5s25ym5" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_identifier_key_lom_position_i5jf554z7n" UNIQUE ("lom", "position")
);

CREATE TABLE "qti"."lom_identifier_catalog" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "identifier" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "position" bigint NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_identifier_catalog_pk_plebwsw2uo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_identifier_entry" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "id" uuid NOT NULL,
  "identifier" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "position" bigint NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_identifier_entry_pk_urwvfn3yd6" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_identifier_entry_key_lom_position_w4f2vsovly" UNIQUE ("lom", "position"),
  CONSTRAINT "__lom_identifier_entry_key_lom_position_collapsed_gj4fwidr7p" UNIQUE ("lom", "position", "collapsed")
);

CREATE TABLE "qti"."lom_installation_remarks" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "technical" uuid NOT NULL,
  CONSTRAINT "__lom_installation_remarks_pk_2niiuddo5m" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_installation_remarks_key_technical_hjt52iv2h6" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_keyword" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_keyword_pk_isklyggmvm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_language" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "position" bigint NOT NULL,
  "value" "qti"."__text_popyschjwc" NOT NULL,
  CONSTRAINT "__lom_language_pk_dyuesseefb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_life_cycle" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_life_cycle_pk_atprldcekz" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_life_cycle_key_lom_w22vjmbhh3" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_location" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "position" bigint NOT NULL,
  "technical" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_location_pk_w2bior4ffq" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_location_key_technical_position_2qidj6qt7d" UNIQUE ("technical", "position")
);

CREATE TABLE "qti"."lom_maximum_version" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "or_composite" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_maximum_version_pk_oj36nnjc4h" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_maximum_version_key_or_composite_bahlcymzma" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_meta_metadata" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_meta_metadata_pk_exhl26vrjw" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_meta_metadata_key_lom_zny5hdt5ep" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_metadataschema" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "meta_metadata" uuid NOT NULL,
  "position" bigint NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_metadataschema_pk_kpxnnes2gd" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_metadataschema_key_meta_metadata_position_fekuqgnvzc" UNIQUE ("meta_metadata", "position")
);

CREATE TABLE "qti"."lom_minimum_version" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "or_composite" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_minimum_version_pk_aqxotk3lkv" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_minimum_version_key_or_composite_uahanfchvh" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_name" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "or_composite" uuid NOT NULL,
  CONSTRAINT "__lom_name_pk_jpsvu77jw4" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_name_key_or_composite_ndyhak5cuq" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_object_identifier" (
  "collapsed" "qti"."__text_rhdrzkabze" NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "position" bigint NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__lom_object_identifier_pk_yut5ma3dl7" PRIMARY KEY ("lom")
);

CREATE TABLE "qti"."lom_object_title" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "position" bigint NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__lom_object_title_pk_224q5nl6cj" PRIMARY KEY ("lom")
);

CREATE TABLE "qti"."lom_or_composite" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "position" bigint NOT NULL,
  "requirement" uuid NOT NULL,
  CONSTRAINT "__lom_or_composite_pk_w7azuxggmw" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_or_composite_key_requirement_position_o2o6t3a7fq" UNIQUE ("requirement", "position")
);

CREATE TABLE "qti"."lom_other_platform_requirements" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "technical" uuid NOT NULL,
  CONSTRAINT "__lom_other_platform_requirements_pk_nermqxuz6n" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_other_platform_requirements_key_technical_3yuf3rc5xd" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_requirement" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "position" bigint NOT NULL,
  "technical" uuid NOT NULL,
  CONSTRAINT "__lom_requirement_pk_2ds2omkmqa" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_requirement_key_technical_position_y3rwmrsnzh" UNIQUE ("technical", "position")
);

CREATE TABLE "qti"."lom_rights" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_rights_pk_jf7l6nnzdh" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_rights_key_lom_igi3mirrcx" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_role" (
  "contribute" uuid NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_role_pk_5bktrzsauq" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_role_key_contribute_ehaei34cce" UNIQUE ("contribute")
);

CREATE TABLE "qti"."lom_size" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "technical" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_size_pk_vfewaszzzv" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_size_key_technical_5iy4diylyq" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_source" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_source_pk_hq442or7kb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_status" (
  "id" uuid NOT NULL,
  "life_cycle" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_status_pk_rprhxrcz6w" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_status_key_life_cycle_c3hodmun3m" UNIQUE ("life_cycle")
);

CREATE TABLE "qti"."lom_string" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_string_pk_j6pxaair7j" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_string_key_id_value_collapsed_ewkonewg3e" UNIQUE ("id", "value", "collapsed")
);

CREATE TABLE "qti"."lom_string_language" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_popyschjwc" NOT NULL,
  CONSTRAINT "__lom_string_language_pk_467ufc6ip4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."lom_structure" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_structure_pk_7wbnknpp7i" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_technical" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_technical_pk_72qh5dseuv" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_technical_key_lom_vbphyfmpwb" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_title" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "position" bigint NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_title_pk_6humwubm5t" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_title_key_lom_position_osweencxmz" UNIQUE ("lom", "position"),
  CONSTRAINT "__lom_title_key_lom_position_collapsed_kxw7nki5dn" UNIQUE ("lom", "position", "collapsed")
);

CREATE TABLE "qti"."lom_type" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "or_composite" uuid NOT NULL,
  CONSTRAINT "__lom_type_pk_ih5sl4jgoq" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_type_key_or_composite_wg6m3zavcu" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_value" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_value_pk_uzcm4enckp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_version" (
  "id" uuid NOT NULL,
  "life_cycle" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_version_pk_cf45ruciof" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_version_key_life_cycle_ik4t5dfusg" UNIQUE ("life_cycle")
);

CREATE TABLE "qti"."manifest" (
  "id" uuid NOT NULL,
  CONSTRAINT "__manifest_pk_qjlydhnqtl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."manifest_lom" (
  "lom" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "package" uuid NOT NULL,
  CONSTRAINT "__manifest_lom_pk_gtw6b2jkpd" PRIMARY KEY ("lom"),
  CONSTRAINT "__manifest_lom_key_package_erdswzvc25" UNIQUE ("package")
);

CREATE TABLE "qti"."manifest_metadata" (
  "id" uuid NOT NULL,
  "manifest" uuid NOT NULL,
  CONSTRAINT "__manifest_metadata_pk_o5smotlktf" PRIMARY KEY ("id"),
  CONSTRAINT "__manifest_metadata_key_manifest_vtlsxnvblg" UNIQUE ("manifest")
);

CREATE TABLE "qti"."manifest_schema" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "value" "qti"."__text_betq2bg2bg" NOT NULL,
  CONSTRAINT "__manifest_schema_pk_7olepmmwbb" PRIMARY KEY ("id"),
  CONSTRAINT "__manifest_schema_key_metadata_hkhzp7bnux" UNIQUE ("metadata")
);

CREATE TABLE "qti"."manifest_schema_version" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "value" "qti"."__text_qyq7zjychy" NOT NULL,
  CONSTRAINT "__manifest_schema_version_pk_xrqjnte57i" PRIMARY KEY ("id"),
  CONSTRAINT "__manifest_schema_version_key_metadata_lvlvkimnnz" UNIQUE ("metadata")
);

CREATE TABLE "qti"."namespace_declaration" (
  "node" uuid NOT NULL,
  "position" bigint NOT NULL,
  "prefix" "qti"."__text_httzcaefcn" NOT NULL,
  "uri" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__namespace_declaration_pk_qkfnrroixl" PRIMARY KEY ("node", "position")
);

CREATE TABLE "qti"."node" (
  "id" uuid NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "prefix" "qti"."__text_httzcaefcn" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "tree" uuid NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__node_pk_3sd4cqvxbf" PRIMARY KEY ("id"),
  CONSTRAINT "__node_key_id_tree_version_kind_sjr4jx6soj" UNIQUE ("id", "tree", "version", "kind"),
  CONSTRAINT "__node_key_id_tree_kind_4maffhlb7n" UNIQUE ("id", "tree", "kind"),
  CONSTRAINT "__node_key_id_tree_q3mjcmmvwy" UNIQUE ("id", "tree"),
  CONSTRAINT "__node_key_id_root_kind_bko2kkuujd" UNIQUE ("id", "root_kind"),
  CONSTRAINT "__node_key_id_kind_phk5q5ctpf" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."operand" (
  "child" uuid NOT NULL,
  "expression" uuid NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__operand_pk_kv4v2shmyp" PRIMARY KEY ("expression", "position"),
  CONSTRAINT "__operand_key_child_xhxiir4t3r" UNIQUE ("child")
);

CREATE TABLE "qti"."operator_arity" (
  "kind" "qti"."node_kind" NOT NULL,
  "min" bigint NOT NULL,
  CONSTRAINT "__operator_arity_pk_q24hdn3ki4" PRIMARY KEY ("kind")
);

CREATE TABLE "qti"."operator_arity_max" (
  "kind" "qti"."node_kind" NOT NULL,
  "max" bigint NOT NULL,
  CONSTRAINT "__operator_arity_max_pk_2il4lpb7ts" PRIMARY KEY ("kind")
);

CREATE TABLE "qti"."organizations" (
  "id" uuid NOT NULL,
  "manifest" uuid NOT NULL,
  CONSTRAINT "__organizations_pk_s75qmfyk3u" PRIMARY KEY ("id"),
  CONSTRAINT "__organizations_key_manifest_l2ctxec4pj" UNIQUE ("manifest")
);

CREATE TABLE "qti"."outcome_declaration_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__outcome_declaration_arm_pk_pnkc34gvyg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."p" (
  "id" uuid NOT NULL,
  CONSTRAINT "__p_pk_hx26m6msb5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."package" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "schemaversion" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__package_pk_sg2cyzxgtm" PRIMARY KEY ("id"),
  CONSTRAINT "__package_key_id_schemaversion_2sbnqejonp" UNIQUE ("id", "schemaversion")
);

CREATE TABLE "qti"."package_entry" (
  "kind" "qti"."entry_kind" NOT NULL,
  "package" uuid NOT NULL,
  "path" "qti"."__text_c34ec7mxid" NOT NULL,
  CONSTRAINT "__package_entry_pk_3i35ab5o3w" PRIMARY KEY ("package", "path")
);

CREATE TABLE "qti"."pi" (
  "data" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "id" uuid NOT NULL,
  "target" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__pi_pk_vqm3tcomg6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."prompt" (
  "id" uuid NOT NULL,
  "parent" uuid NOT NULL,
  CONSTRAINT "__prompt_pk_wxy2gmqfd7" PRIMARY KEY ("id"),
  CONSTRAINT "__prompt_key_parent_4f55velenh" UNIQUE ("parent")
);

CREATE TABLE "qti"."qmd_composite" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__qmd_composite_pk_xlqha76w6j" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_composite_key_qti_metadata_lbf64f3xqh" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_custom_type_identifier" (
  "context" uuid NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__qmd_custom_type_identifier_pk_t2e27tuazw" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_custom_type_identifier_key_context_6hcmllgbnf" UNIQUE ("context")
);

CREATE TABLE "qti"."qmd_feedback_type" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_mvg26oprvk" NOT NULL,
  CONSTRAINT "__qmd_feedback_type_pk_n3cozndfbx" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_feedback_type_key_qti_metadata_fbnqiylecc" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_interaction_kind" (
  "context" uuid NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__qmd_interaction_kind_pk_jjituwkg3a" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_interaction_kind_key_context_zgrdm4kzyz" UNIQUE ("context")
);

CREATE TABLE "qti"."qmd_interaction_type" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_f3hdif3553" NOT NULL,
  CONSTRAINT "__qmd_interaction_type_pk_ohm4idltho" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qmd_item_template" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__qmd_item_template_pk_mimqgmhu2u" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_item_template_key_qti_metadata_oew4krly7g" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_portable_custom_interaction_context" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  CONSTRAINT "__qmd_portable_custom_interaction_context_pk_xac34gmcx6" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_portable_custom_interaction_context_key_qti_xhmydb4ask" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_scoring_mode" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_ojm4wya66v" NOT NULL,
  CONSTRAINT "__qmd_scoring_mode_pk_c37sji4e2c" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qmd_solution_available" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__qmd_solution_available_pk_vuhhrrl3yq" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_solution_available_key_qti_metadata_rhehxypx2m" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_time_dependent" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__qmd_time_dependent_pk_totdnpiz57" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_time_dependent_key_qti_metadata_pizyu76fq2" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_tool_name" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_pftpnuhm3d" NOT NULL,
  CONSTRAINT "__qmd_tool_name_pk_eos7lhy5x6" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_tool_name_key_qti_metadata_2mqtwkzgw5" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_tool_vendor" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_pftpnuhm3d" NOT NULL,
  CONSTRAINT "__qmd_tool_vendor_pk_nsbkalhujg" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_tool_vendor_key_qti_metadata_dxe3sypo7i" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_tool_version" (
  "id" uuid NOT NULL,
  "qti_metadata" uuid NOT NULL,
  "value" "qti"."__text_pftpnuhm3d" NOT NULL,
  CONSTRAINT "__qmd_tool_version_pk_3k4ht2nmw5" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_tool_version_key_qti_metadata_rrsckkvtse" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qti_metadata" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "resource" uuid NOT NULL,
  CONSTRAINT "__qti_metadata_pk_s4olys2stl" PRIMARY KEY ("id"),
  CONSTRAINT "__qti_metadata_key_resource_rnqab2cujf" UNIQUE ("resource")
);

CREATE TABLE "qti"."record_binding" (
  "interaction_kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__record_binding_pk_zo6rox5gzm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."record_declaration" (
  "id" uuid NOT NULL,
  CONSTRAINT "__record_declaration_pk_5bmpqtimiy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."record_field" (
  "field_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__record_field_pk_qhg6nv6lbn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."record_value_set" (
  "id" uuid NOT NULL,
  CONSTRAINT "__record_value_set_pk_hw4xyls63o" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."resource" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "package" uuid NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__resource_pk_yrfq7dxmhs" PRIMARY KEY ("id"),
  CONSTRAINT "__resource_key_package_identifier_fsvcnui6cz" UNIQUE ("package", "identifier"),
  CONSTRAINT "__resource_key_package_identifier_type_24kwhezduw" UNIQUE ("package", "identifier", "type"),
  CONSTRAINT "__resource_key_id_package_zmgj4vl2s5" UNIQUE ("id", "package")
);

CREATE TABLE "qti"."resource_href" (
  "href" "qti"."__text_c34ec7mxid" NOT NULL,
  "package" uuid NOT NULL,
  "resource" uuid NOT NULL,
  CONSTRAINT "__resource_href_pk_fzjlywz4ma" PRIMARY KEY ("resource")
);

CREATE TABLE "qti"."resource_lom" (
  "lom" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__resource_lom_pk_cx7m3uevdj" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_key_package_resource_wavh3iq5t3" UNIQUE ("package", "resource"),
  CONSTRAINT "__resource_lom_key_lom_package_resource_type_7gdyikkhg4" UNIQUE ("lom", "package", "resource", "type")
);

CREATE TABLE "qti"."resource_lom_identified" (
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__resource_lom_identified_pk_xrqngnwel5" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_identified_key_lom_package_resource_pfavxom73q" UNIQUE ("lom", "package", "resource", "type")
);

CREATE TABLE "qti"."resource_lom_titled" (
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__resource_lom_titled_pk_txhs6tqqu2" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_titled_key_lom_package_resource_type_qreilk2jjd" UNIQUE ("lom", "package", "resource", "type")
);

CREATE TABLE "qti"."resource_metadata" (
  "id" uuid NOT NULL,
  "resource" uuid NOT NULL,
  CONSTRAINT "__resource_metadata_pk_nb4q7foofw" PRIMARY KEY ("id"),
  CONSTRAINT "__resource_metadata_key_resource_ugm3u666g4" UNIQUE ("resource")
);

CREATE TABLE "qti"."resource_type_of" (
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__resource_type_of_pk_vcggjjciac" PRIMARY KEY ("version", "type")
);

CREATE TABLE "qti"."resources" (
  "id" uuid NOT NULL,
  "manifest" uuid NOT NULL,
  CONSTRAINT "__resources_pk_h7o56gfsbb" PRIMARY KEY ("id"),
  CONSTRAINT "__resources_key_manifest_q7t3wn3azt" UNIQUE ("manifest")
);

CREATE TABLE "qti"."response_declaration_arm" (
  "id" uuid NOT NULL,
  CONSTRAINT "__response_declaration_arm_pk_5hhor6gekm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."response_declaration_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__response_declaration_id_pk_tki7iml5lk" PRIMARY KEY ("document", "id")
);

CREATE TABLE "qti"."response_processing" (
  "id" uuid NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__response_processing_pk_vj24li3bev" PRIMARY KEY ("id"),
  CONSTRAINT "processing_root" CHECK (("root_kind" = 'item'::"qti"."root_kind" OR "root_kind" = 'rptemplate'::"qti"."root_kind") IS TRUE),
  CONSTRAINT "__response_processing_key_id_root_kind_nfaywgrq6y" UNIQUE ("id", "root_kind")
);

CREATE TABLE "qti"."response_processing_item" (
  "id" uuid NOT NULL,
  "item" uuid NOT NULL,
  CONSTRAINT "__response_processing_item_pk_p4n6eptdbw" PRIMARY KEY ("id"),
  CONSTRAINT "__response_processing_item_key_item_g4l5s2zefn" UNIQUE ("item")
);

CREATE TABLE "qti"."response_processing_template" (
  "node" uuid NOT NULL,
  "uri" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__response_processing_template_pk_gpwzrvcd55" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."response_processing_template_location" (
  "node" uuid NOT NULL,
  "uri" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__response_processing_template_location_pk_gq3aqrt7vu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."root_of_type" (
  "root" "qti"."root_kind" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__root_of_type_pk_kdi6c7gguy" PRIMARY KEY ("type"),
  CONSTRAINT "__root_of_type_key_type_root_v4guhvvyrl" UNIQUE ("type", "root")
);

CREATE TABLE "qti"."schema_location" (
  "node" uuid NOT NULL,
  "prefix" "qti"."__text_rhdrzkabze" NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__schema_location_pk_q6ijfxgo2t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_choice" (
  "fixed" "qti"."__text_cz7v66q3ce" NOT NULL,
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__simple_choice_pk_3t5mywknt4" PRIMARY KEY ("id"),
  CONSTRAINT "__simple_choice_key_interaction_identifier_atyd34wpmk" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."simple_choice_template_identifier" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__simple_choice_template_identifier_pk_vhko3seq67" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."standard_template_reference" (
  "node" uuid NOT NULL,
  "template" "qti"."standard_template" NOT NULL,
  CONSTRAINT "__standard_template_reference_pk_cpeprqiikq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_hmmood6ekl" NOT NULL,
  CONSTRAINT "__text_pk_uuxplnj5cm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."tree" (
  "charset" "qti"."__text_wyfa622e2r" NOT NULL,
  "id" uuid NOT NULL,
  "kind" "qti"."tree_kind" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__tree_pk_xcoqlm6nqt" PRIMARY KEY ("id"),
  CONSTRAINT "manifest_root_is_manifest_tree" CHECK (("kind" = 'manifest'::"qti"."tree_kind" OR "root" <> 'manifest'::"qti"."root_kind") IS TRUE),
  CONSTRAINT "manifest_tree_has_manifest_root" CHECK (("kind" <> 'manifest'::"qti"."tree_kind" OR "root" = 'manifest'::"qti"."root_kind") IS TRUE),
  CONSTRAINT "__tree_key_id_version_root_ezbdftzuy4" UNIQUE ("id", "version", "root"),
  CONSTRAINT "__tree_key_id_kind_atw4zjatmg" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."tree_doctype" (
  "text" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__tree_doctype_pk_rih2k4j4qa" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_export_charset" (
  "label" "qti"."__text_wyfa622e2r" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__tree_export_charset_pk_p65tu3cdwm" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_misc" (
  "kind" "qti"."misc_kind" NOT NULL,
  "placement" "qti"."placement" NOT NULL,
  "position" bigint NOT NULL,
  "text" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__tree_misc_pk_y3enpvf5gu" PRIMARY KEY ("tree", "placement", "position")
);

CREATE TABLE "qti"."tree_root" (
  "node" uuid NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__tree_root_pk_qiciwu2u3r" PRIMARY KEY ("tree"),
  CONSTRAINT "__tree_root_key_node_ubg4rtjyq7" UNIQUE ("node")
);

CREATE TABLE "qti"."tree_xml_encoding" (
  "tree" uuid NOT NULL,
  "value" "qti"."__text_wyfa622e2r" NOT NULL,
  CONSTRAINT "__tree_xml_encoding_pk_dj5tvpgs25" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_xml_standalone" (
  "tree" uuid NOT NULL,
  "value" "qti"."__text_uia6zcss44" NOT NULL,
  CONSTRAINT "__tree_xml_standalone_pk_pbqvnzrs6o" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_xml_version" (
  "tree" uuid NOT NULL,
  "value" "qti"."__text_r5xluaej3z" NOT NULL,
  CONSTRAINT "__tree_xml_version_pk_l6mrjnkgaa" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."typed_binding" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" uuid NOT NULL,
  "interaction_kind" "qti"."node_kind" NOT NULL,
  "max_count" bigint NOT NULL,
  "node" uuid NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__typed_binding_pk_axyc57xkgj" PRIMARY KEY ("node"),
  CONSTRAINT "binding_max" CHECK (("cardinality" = 'multiple'::"qti"."typed_cardinality" OR "max_count" = 1::bigint) IS TRUE)
);

CREATE TABLE "qti"."typed_declaration" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__typed_declaration_pk_zcmmxhw3lj" PRIMARY KEY ("id"),
  CONSTRAINT "__typed_declaration_key_document_identifier_ppvxmo2ouu" UNIQUE ("document", "identifier"),
  CONSTRAINT "__typed_declaration_key_id_base_type_cardinality_fd257gl7mq" UNIQUE ("id", "base_type", "cardinality"),
  CONSTRAINT "__typed_declaration_key_document_identifier_base_fx6yo6vuhe" UNIQUE ("document", "identifier", "base_type", "cardinality")
);

CREATE TABLE "qti"."typed_value_set" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "declaration" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__typed_value_set_pk_fsblbpp4do" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."value_set" (
  "declaration" uuid NOT NULL,
  "id" uuid NOT NULL,
  "role" "qti"."value_role" NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  CONSTRAINT "__value_set_pk_aviyvdskxo" PRIMARY KEY ("id"),
  CONSTRAINT "__value_set_key_declaration_role_4stlepfimk" UNIQUE ("declaration", "role"),
  CONSTRAINT "__value_set_key_id_declaration_hkaytoxio7" UNIQUE ("id", "declaration"),
  CONSTRAINT "__value_set_key_id_shape_mgay3c5bmp" UNIQUE ("id", "shape"),
  CONSTRAINT "__value_set_key_id_role_3wmhajx4d2" UNIQUE ("id", "role")
);

CREATE TABLE "qti"."value_set_interpretation" (
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "value_set" uuid NOT NULL,
  CONSTRAINT "__value_set_interpretation_pk_ieijhj5gvd" PRIMARY KEY ("value_set")
);

CREATE TABLE "qti"."variable_ref" (
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  "kind" "qti"."ref_kind" NOT NULL,
  CONSTRAINT "__variable_ref_pk_xysknydg4p" PRIMARY KEY ("id"),
  CONSTRAINT "__variable_ref_key_id_kind_trsdltzwu4" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."ws" (
  "id" uuid NOT NULL,
  "value" "qti"."__text_ottycep7en" NOT NULL,
  CONSTRAINT "__ws_pk_rt3xgtnvrh" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."assessment_item" ADD COLUMN "__tag_kind_qti_assessment_item_lutv7awadt" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-item'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."built_in_ref" ADD COLUMN "__tag_kind_built_in_a5gr6jz3gp" "qti"."ref_kind" GENERATED ALWAYS AS ('builtIn'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."choice_interaction" ADD COLUMN "__tag_kind_qti_choice_interaction_lrhq33h2cc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-choice-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."comment" ADD COLUMN "__tag_kind_comment_nmb7feek53" "qti"."node_kind" GENERATED ALWAYS AS ('comment'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."correct_response_arm" ADD COLUMN "__tag_kind_qti_correct_response_y6bjt74uq7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-correct-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."correct_response_arm" ADD COLUMN "__tag_role_correct_a6k2xxecvb" "qti"."value_role" GENERATED ALWAYS AS ('correct'::"qti"."value_role") STORED NOT NULL;

ALTER TABLE "qti"."declared_ref" ADD COLUMN "__tag_kind_declared_chtay4st64" "qti"."ref_kind" GENERATED ALWAYS AS ('declared'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."declared_value" ADD COLUMN "__tag_kind_qti_value_a22pfhf3za" "qti"."node_kind" GENERATED ALWAYS AS ('qti-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_boolean" ADD COLUMN "__tag_base_type_boolean_kh6dvyf44c" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_v5chnfdlrm" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_duration" ADD COLUMN "__tag_base_type_duration_kk5q7nzzuo" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_file" ADD COLUMN "__tag_base_type_file_pesir3i32k" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_float" ADD COLUMN "__tag_base_type_float_3szfpoo33f" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_identifier" ADD COLUMN "__tag_base_type_identifier_skvmp74o7n" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_integer" ADD COLUMN "__tag_base_type_integer_azuvzqcuvs" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_pair" ADD COLUMN "__tag_base_type_pair_m6e2ivamry" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_point" ADD COLUMN "__tag_base_type_point_c2g2yehgpw" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_string" ADD COLUMN "__tag_base_type_string_hs2lnlklfn" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_uri" ADD COLUMN "__tag_base_type_uri_7nvvazwudq" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."default_value_arm" ADD COLUMN "__tag_kind_qti_default_value_ectibzonfr" "qti"."node_kind" GENERATED ALWAYS AS ('qti-default-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."default_value_arm" ADD COLUMN "__tag_role_default_st3rg3iau2" "qti"."value_role" GENERATED ALWAYS AS ('default'::"qti"."value_role") STORED NOT NULL;

ALTER TABLE "qti"."dependency" ADD COLUMN "__tag_kind_cp_dependency_zkvh26cbdi" "qti"."node_kind" GENERATED ALWAYS AS ('cp:dependency'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."document" ADD COLUMN "__tag_kind_document_3ilsmwej65" "qti"."tree_kind" GENERATED ALWAYS AS ('document'::"qti"."tree_kind") STORED NOT NULL;

ALTER TABLE "qti"."entity_reference" ADD COLUMN "__tag_kind_entity_ref_vjzwdvldjb" "qti"."node_kind" GENERATED ALWAYS AS ('entityRef'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."file" ADD COLUMN "__tag_kind_cp_file_lmc4p5hp74" "qti"."node_kind" GENERATED ALWAYS AS ('cp:file'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."img" ADD COLUMN "__tag_kind_img_i7yel3m6ld" "qti"."node_kind" GENERATED ALWAYS AS ('img'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."interaction_binding" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_body" ADD COLUMN "__tag_kind_qti_item_body_jcju2zecro" "qti"."node_kind" GENERATED ALWAYS AS ('qti-item-body'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."literal_boolean" ADD COLUMN "__tag_base_type_boolean_4735tuf3vg" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_g5lmbdounu" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_duration" ADD COLUMN "__tag_base_type_duration_x4kusayrrj" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_file" ADD COLUMN "__tag_base_type_file_f3nyrmvnuq" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_float" ADD COLUMN "__tag_base_type_float_3yebf7fbld" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_identifier" ADD COLUMN "__tag_base_type_identifier_su3axkpwpi" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_integer" ADD COLUMN "__tag_base_type_integer_42hpi675dm" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_pair" ADD COLUMN "__tag_base_type_pair_j5c4komwfk" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_point" ADD COLUMN "__tag_base_type_point_vrpib4j3ph" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_string" ADD COLUMN "__tag_base_type_string_3acd7sfocx" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_uri" ADD COLUMN "__tag_base_type_uri_dedabn4vho" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."lom" ADD COLUMN "__tag_kind_lom_lom_f6hipyl2uh" "qti"."node_kind" GENERATED ALWAYS AS ('lom:lom'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_aggregation_level" ADD COLUMN "__tag_kind_lom_aggregation_level_nz6q333tpc" "qti"."node_kind" GENERATED ALWAYS AS ('lom:aggregationLevel'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_contribute" ADD COLUMN "__tag_kind_lom_contribute_df2trhtcwa" "qti"."node_kind" GENERATED ALWAYS AS ('lom:contribute'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD COLUMN "__tag_kind_lom_copyright_and_other_restrictions_iumfuc7nd6" "qti"."node_kind" GENERATED ALWAYS AS ('lom:copyrightAndOtherRestrictions'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_cost" ADD COLUMN "__tag_kind_lom_cost_6szqfkzkkf" "qti"."node_kind" GENERATED ALWAYS AS ('lom:cost'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_coverage" ADD COLUMN "__tag_kind_lom_coverage_4gxjudfzzd" "qti"."node_kind" GENERATED ALWAYS AS ('lom:coverage'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_date" ADD COLUMN "__tag_kind_lom_date_w2vdyftvu3" "qti"."node_kind" GENERATED ALWAYS AS ('lom:date'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_date_time" ADD COLUMN "__tag_kind_lom_date_time_rwc33opc6i" "qti"."node_kind" GENERATED ALWAYS AS ('lom:dateTime'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_description" ADD COLUMN "__tag_kind_lom_description_fgwqgc6sgl" "qti"."node_kind" GENERATED ALWAYS AS ('lom:description'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_duration" ADD COLUMN "__tag_kind_lom_duration_iav5iizeai" "qti"."node_kind" GENERATED ALWAYS AS ('lom:duration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_duration_string" ADD COLUMN "__tag_kind_lom_duration_string_ijve2g6fui" "qti"."node_kind" GENERATED ALWAYS AS ('lom:duration.string'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_entity" ADD COLUMN "__tag_kind_lom_entity_ja2pg4zr5e" "qti"."node_kind" GENERATED ALWAYS AS ('lom:entity'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_format" ADD COLUMN "__tag_kind_lom_format_zjeruunvce" "qti"."node_kind" GENERATED ALWAYS AS ('lom:format'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_general" ADD COLUMN "__tag_kind_lom_general_kdtvdmn7oa" "qti"."node_kind" GENERATED ALWAYS AS ('lom:general'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_general_title" ADD COLUMN "__tag_kind_lom_title_acxzzapsiz" "qti"."node_kind" GENERATED ALWAYS AS ('lom:title'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_identifier" ADD COLUMN "__tag_kind_lom_identifier_zhhp3vq26p" "qti"."node_kind" GENERATED ALWAYS AS ('lom:identifier'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_identifier_catalog" ADD COLUMN "__tag_kind_lom_catalog_yeeo53s2uf" "qti"."node_kind" GENERATED ALWAYS AS ('lom:catalog'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_identifier_entry" ADD COLUMN "__tag_kind_lom_entry_z2frivifgf" "qti"."node_kind" GENERATED ALWAYS AS ('lom:entry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_installation_remarks" ADD COLUMN "__tag_kind_lom_installation_remarks_6actui7z3e" "qti"."node_kind" GENERATED ALWAYS AS ('lom:installationRemarks'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_keyword" ADD COLUMN "__tag_kind_lom_keyword_7mdhbpmyak" "qti"."node_kind" GENERATED ALWAYS AS ('lom:keyword'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_language" ADD COLUMN "__tag_kind_lom_language_umo24qkhua" "qti"."node_kind" GENERATED ALWAYS AS ('lom:language'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_life_cycle" ADD COLUMN "__tag_kind_lom_life_cycle_v5zcy35q77" "qti"."node_kind" GENERATED ALWAYS AS ('lom:lifeCycle'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_location" ADD COLUMN "__tag_kind_lom_location_3tcexzxgfh" "qti"."node_kind" GENERATED ALWAYS AS ('lom:location'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_maximum_version" ADD COLUMN "__tag_kind_lom_maximum_version_anah5x464b" "qti"."node_kind" GENERATED ALWAYS AS ('lom:maximumVersion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_meta_metadata" ADD COLUMN "__tag_kind_lom_meta_metadata_z7muqedeoe" "qti"."node_kind" GENERATED ALWAYS AS ('lom:metaMetadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_metadataschema" ADD COLUMN "__tag_kind_lom_metadataschema_kjpxrlzjhx" "qti"."node_kind" GENERATED ALWAYS AS ('lom:metadataschema'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_minimum_version" ADD COLUMN "__tag_kind_lom_minimum_version_prl3rwqtuc" "qti"."node_kind" GENERATED ALWAYS AS ('lom:minimumVersion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_name" ADD COLUMN "__tag_kind_lom_name_ta2c7syhrg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:name'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_or_composite" ADD COLUMN "__tag_kind_lom_or_composite_hivjg4kbyy" "qti"."node_kind" GENERATED ALWAYS AS ('lom:orComposite'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD COLUMN "__tag_kind_lom_other_platform_requirements_u6lzfnmyqi" "qti"."node_kind" GENERATED ALWAYS AS ('lom:otherPlatformRequirements'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_requirement" ADD COLUMN "__tag_kind_lom_requirement_giyfrxir3d" "qti"."node_kind" GENERATED ALWAYS AS ('lom:requirement'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_rights" ADD COLUMN "__tag_kind_lom_rights_2fcs3c7jc3" "qti"."node_kind" GENERATED ALWAYS AS ('lom:rights'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_role" ADD COLUMN "__tag_kind_lom_role_mff47g5aja" "qti"."node_kind" GENERATED ALWAYS AS ('lom:role'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_size" ADD COLUMN "__tag_kind_lom_size_lxvgvtngju" "qti"."node_kind" GENERATED ALWAYS AS ('lom:size'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_source" ADD COLUMN "__tag_kind_lom_source_2h4d2ilrdk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:source'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_status" ADD COLUMN "__tag_kind_lom_status_vvuyk32w3f" "qti"."node_kind" GENERATED ALWAYS AS ('lom:status'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_string" ADD COLUMN "__tag_kind_lom_string_s72bccwbh3" "qti"."node_kind" GENERATED ALWAYS AS ('lom:string'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_structure" ADD COLUMN "__tag_kind_lom_structure_7zyt26pyt6" "qti"."node_kind" GENERATED ALWAYS AS ('lom:structure'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_technical" ADD COLUMN "__tag_kind_lom_technical_yobodngzpk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:technical'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_type" ADD COLUMN "__tag_kind_lom_type_gxwahsvklo" "qti"."node_kind" GENERATED ALWAYS AS ('lom:type'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_value" ADD COLUMN "__tag_kind_lom_value_rhv3macnym" "qti"."node_kind" GENERATED ALWAYS AS ('lom:value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_version" ADD COLUMN "__tag_kind_lom_version_o4inak47bb" "qti"."node_kind" GENERATED ALWAYS AS ('lom:version'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest" ADD COLUMN "__tag_kind_manifest_s7wedmbljj" "qti"."tree_kind" GENERATED ALWAYS AS ('manifest'::"qti"."tree_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_lom" ADD COLUMN "__tag_owner_manifest_rrl26sfdmq" "qti"."lom_owner" GENERATED ALWAYS AS ('manifest'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."manifest_lom" ADD COLUMN "__tag_kind_cp_metadata_manifest_lxlasjebcx" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.manifest'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_metadata" ADD COLUMN "__tag_kind_cp_metadata_manifest_lxlasjebcx" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.manifest'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_schema" ADD COLUMN "__tag_kind_cp_schema_wydqdv7nqu" "qti"."node_kind" GENERATED ALWAYS AS ('cp:schema'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_schema_version" ADD COLUMN "__tag_kind_cp_schemaversion_b5pisyerct" "qti"."node_kind" GENERATED ALWAYS AS ('cp:schemaversion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."organizations" ADD COLUMN "__tag_kind_cp_organizations_io7npeoiga" "qti"."node_kind" GENERATED ALWAYS AS ('cp:organizations'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_declaration_arm" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_declaration_arm" ADD COLUMN "__tag_kind_qti_outcome_declaration_pavxgyuva7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."p" ADD COLUMN "__tag_kind_p_mm76ho4kjx" "qti"."node_kind" GENERATED ALWAYS AS ('p'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."package" ADD COLUMN "__tag_kind_cp_manifest_vqajffgjxd" "qti"."node_kind" GENERATED ALWAYS AS ('cp:manifest'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."pi" ADD COLUMN "__tag_kind_pi_iifj7oyikt" "qti"."node_kind" GENERATED ALWAYS AS ('pi'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."prompt" ADD COLUMN "__tag_kind_qti_prompt_4i6supq76j" "qti"."node_kind" GENERATED ALWAYS AS ('qti-prompt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_composite" ADD COLUMN "__tag_kind_qmd_composite_sp2gjoeow2" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:composite'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_custom_type_identifier" ADD COLUMN "__tag_kind_qmd_custom_type_identifier_6maf4fokd4" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:customTypeIdentifier'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_feedback_type" ADD COLUMN "__tag_kind_qmd_feedback_type_i4afuxmkum" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:feedbackType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_interaction_kind" ADD COLUMN "__tag_kind_qmd_interaction_kind_hqx3cimuzu" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:interactionKind'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_interaction_type" ADD COLUMN "__tag_kind_qmd_interaction_type_yfu5laontj" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:interactionType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_item_template" ADD COLUMN "__tag_kind_qmd_item_template_qed7bxhx4c" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:itemTemplate'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_portable_custom_interaction_context" ADD COLUMN "__tag_kind_qmd_portable_custom_interaction_context_qpozrauewz" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:portableCustomInteractionContext'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_scoring_mode" ADD COLUMN "__tag_kind_qmd_scoring_mode_eautyyrud4" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:scoringMode'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_solution_available" ADD COLUMN "__tag_kind_qmd_solution_available_2phsdzymgo" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:solutionAvailable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_time_dependent" ADD COLUMN "__tag_kind_qmd_time_dependent_kcomlfhb7l" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:timeDependent'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_tool_name" ADD COLUMN "__tag_kind_qmd_tool_name_27iaqneif4" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:toolName'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_tool_vendor" ADD COLUMN "__tag_kind_qmd_tool_vendor_q5oz7iuy5a" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:toolVendor'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_tool_version" ADD COLUMN "__tag_kind_qmd_tool_version_pnqrau5xa6" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:toolVersion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata" ADD COLUMN "__tag_kind_cp_metadata_resource_scp7neoqwd" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata" ADD COLUMN "__tag_kind_qmd_qti_metadata_x6anaifca7" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:qtiMetadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."record_binding" ADD COLUMN "__tag_shape_record_qozhrcs4ym" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."record_declaration" ADD COLUMN "__tag_shape_record_oogx67q33t" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."record_field" ADD COLUMN "__tag_shape_record_3rfzi5mgny" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."record_value_set" ADD COLUMN "__tag_shape_record_lavxfyvieb" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."resource" ADD COLUMN "__tag_kind_cp_resource_42ghp3dst6" "qti"."node_kind" GENERATED ALWAYS AS ('cp:resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."resource_lom" ADD COLUMN "__tag_owner_resource_r2xv4rjzei" "qti"."lom_owner" GENERATED ALWAYS AS ('resource'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."resource_lom" ADD COLUMN "__tag_kind_cp_metadata_resource_scp7neoqwd" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."resource_metadata" ADD COLUMN "__tag_kind_cp_metadata_resource_scp7neoqwd" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."resources" ADD COLUMN "__tag_kind_cp_resources_vfmef7qkml" "qti"."node_kind" GENERATED ALWAYS AS ('cp:resources'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_arm" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_arm" ADD COLUMN "__tag_kind_qti_response_declaration_mnirjlf2bs" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_id" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_id" ADD COLUMN "__tag_holder_response_declaration_bgk6jyj7am" "qti"."id_holder" GENERATED ALWAYS AS ('responseDeclaration'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."response_processing" ADD COLUMN "__tag_kind_qti_response_processing_w7uh2je46r" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-processing'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_processing_item" ADD COLUMN "__tag_root_kind_item_od6jgyppue" "qti"."root_kind" GENERATED ALWAYS AS ('item'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."simple_choice" ADD COLUMN "__tag_kind_qti_simple_choice_z52ayjzccu" "qti"."node_kind" GENERATED ALWAYS AS ('qti-simple-choice'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."text" ADD COLUMN "__tag_kind_text_vrxl6g2xzn" "qti"."node_kind" GENERATED ALWAYS AS ('text'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."typed_binding" ADD COLUMN "__tag_shape_typed_gdmqmo4yqk" "qti"."declaration_shape" GENERATED ALWAYS AS ('typed'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."typed_declaration" ADD COLUMN "__tag_shape_typed_qnenjfvgbj" "qti"."declaration_shape" GENERATED ALWAYS AS ('typed'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."typed_value_set" ADD COLUMN "__tag_shape_typed_atyt4o6rfl" "qti"."declaration_shape" GENERATED ALWAYS AS ('typed'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."ws" ADD COLUMN "__tag_kind_ws_v2rnjnoedh" "qti"."node_kind" GENERATED ALWAYS AS ('ws'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_fk_id_tag_kind_qti_assessment_item_tb6ofvomqn" FOREIGN KEY ("id", "__tag_kind_qti_assessment_item_lutv7awadt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_entity_reference" ADD CONSTRAINT "__attribute_entity_reference_fk_node_dmowipcsds" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_lexical" ADD CONSTRAINT "__attribute_lexical_fk_node_kind_nalamcdh2a" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."built_in_ref" ADD CONSTRAINT "__built_in_ref_fk_id_tag_kind_built_in_a_5_gr_6_jz_3_uxqwbgzpu7" FOREIGN KEY ("id", "__tag_kind_built_in_a5gr6jz3gp") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction" ADD CONSTRAINT "__choice_interaction_fk_id_tag_kind_qti_choice_prxl6btdny" FOREIGN KEY ("id", "__tag_kind_qti_choice_interaction_lrhq33h2cc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction" ADD CONSTRAINT "__choice_interaction_fk_id_root_kind_gl3vcjjab4" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction_max_selections_message" ADD CONSTRAINT "__choice_interaction_max_selections_message_fk_node_ljbdlz5nru" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction_min_selections_message" ADD CONSTRAINT "__choice_interaction_min_selections_message_fk_node_zvytaotb4p" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."comment" ADD CONSTRAINT "__comment_fk_id_tag_kind_comment_nmb_7_feek_53_2tnuqa2fb2" FOREIGN KEY ("id", "__tag_kind_comment_nmb7feek53") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct_response_arm" ADD CONSTRAINT "__correct_response_arm_fk_id_tag_kind_qti_correct_cemzm7tt6m" FOREIGN KEY ("id", "__tag_kind_qti_correct_response_y6bjt74uq7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct_response_arm" ADD CONSTRAINT "__correct_response_arm_fk_id_tag_role_correct_a_6_k_5fsnfymwai" FOREIGN KEY ("id", "__tag_role_correct_a6k2xxecvb") REFERENCES "qti"."value_set" ("id", "role") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declaration" ADD CONSTRAINT "__declaration_fk_id_document_pdsrpobeub" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declaration_external_scored" ADD CONSTRAINT "__declaration_external_scored_fk_declaration_bxmjtnregf" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_interpretation" ADD CONSTRAINT "__declaration_interpretation_fk_declaration_ps6b7rahqa" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_long_interpretation" ADD CONSTRAINT "__declaration_long_interpretation_fk_declaration_6esmkzbmky" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_mastery_value" ADD CONSTRAINT "__declaration_mastery_value_fk_declaration_kznj66n5qv" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_normal_maximum" ADD CONSTRAINT "__declaration_normal_maximum_fk_declaration_ouqrml32ux" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_normal_minimum" ADD CONSTRAINT "__declaration_normal_minimum_fk_declaration_xpeecehvfd" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_variable_identifier_ref" ADD CONSTRAINT "__declaration_variable_identifier_ref_fk_declaration_ynmg2ojbwh" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_view" ADD CONSTRAINT "__declaration_view_fk_declaration_grq4o2auzk" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declared_adaptive" ADD CONSTRAINT "__declared_adaptive_fk_node_2ekpm2as3f" FOREIGN KEY ("node") REFERENCES "qti"."assessment_item" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_fixed" ADD CONSTRAINT "__declared_fixed_fk_node_azddieafgj" FOREIGN KEY ("node") REFERENCES "qti"."simple_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_max_choices" ADD CONSTRAINT "__declared_max_choices_fk_node_y7jlgtncxu" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_min_choices" ADD CONSTRAINT "__declared_min_choices_fk_node_hravvjubmj" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_orientation" ADD CONSTRAINT "__declared_orientation_fk_node_66p7tw6wgw" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "__declared_ref_fk_document_identifier_o4crlxzv7z" FOREIGN KEY ("document", "identifier") REFERENCES "qti"."declaration" ("document", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "__declared_ref_fk_id_tag_kind_declared_chtay_4_st_64_737grlrvxv" FOREIGN KEY ("id", "__tag_kind_declared_chtay4st64") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_show_hide" ADD CONSTRAINT "__declared_show_hide_fk_node_y7io7lazvc" FOREIGN KEY ("node") REFERENCES "qti"."simple_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_shuffle" ADD CONSTRAINT "__declared_shuffle_fk_node_o4rn4edxva" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value" ADD CONSTRAINT "__declared_value_fk_id_tag_kind_qti_value_a_22_pfhf_jauk5xk5xj" FOREIGN KEY ("id", "__tag_kind_qti_value_a22pfhf3za") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value" ADD CONSTRAINT "__declared_value_fk_id_value_set_position_vwygqxfi6l" FOREIGN KEY ("id", "value_set", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value" ADD CONSTRAINT "__declared_value_fk_value_set_shape_xzwb4amgw4" FOREIGN KEY ("value_set", "shape") REFERENCES "qti"."value_set" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_boolean" ADD CONSTRAINT "__declared_value_boolean_fk_id_tag_base_type_boolean_x6nluowxw7" FOREIGN KEY ("id", "__tag_base_type_boolean_kh6dvyf44c") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_directed_pair" ADD CONSTRAINT "__declared_value_directed_pair_fk_id_tag_base_type_s66pkuzt37" FOREIGN KEY ("id", "__tag_base_type_directed_pair_v5chnfdlrm") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_duration" ADD CONSTRAINT "__declared_value_duration_fk_id_tag_base_type_xywa3wenpe" FOREIGN KEY ("id", "__tag_base_type_duration_kk5q7nzzuo") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_file" ADD CONSTRAINT "__declared_value_file_fk_id_tag_base_type_file_pesir_f7ctotkmyo" FOREIGN KEY ("id", "__tag_base_type_file_pesir3i32k") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_float" ADD CONSTRAINT "__declared_value_float_fk_id_tag_base_type_float_3_nh3q3iblhm" FOREIGN KEY ("id", "__tag_base_type_float_3szfpoo33f") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_identifier" ADD CONSTRAINT "__declared_value_identifier_fk_id_tag_base_type_elcr7q4rl7" FOREIGN KEY ("id", "__tag_base_type_identifier_skvmp74o7n") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_integer" ADD CONSTRAINT "__declared_value_integer_fk_id_tag_base_type_integer_pk3kvnfdz4" FOREIGN KEY ("id", "__tag_base_type_integer_azuvzqcuvs") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_pair" ADD CONSTRAINT "__declared_value_pair_fk_id_tag_base_type_pair_m_6_e_hikp7eey3b" FOREIGN KEY ("id", "__tag_base_type_pair_m6e2ivamry") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_point" ADD CONSTRAINT "__declared_value_point_fk_id_tag_base_type_point_c_2_jykv3lgoe2" FOREIGN KEY ("id", "__tag_base_type_point_c2g2yehgpw") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_string" ADD CONSTRAINT "__declared_value_string_fk_id_tag_base_type_string_3jrhsa7n4m" FOREIGN KEY ("id", "__tag_base_type_string_hs2lnlklfn") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_uri" ADD CONSTRAINT "__declared_value_uri_fk_id_tag_base_type_uri_7_62m5ydt7xt" FOREIGN KEY ("id", "__tag_base_type_uri_7nvvazwudq") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default_value_arm" ADD CONSTRAINT "__default_value_arm_fk_id_tag_kind_qti_default_value_xhc5veob6w" FOREIGN KEY ("id", "__tag_kind_qti_default_value_ectibzonfr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default_value_arm" ADD CONSTRAINT "__default_value_arm_fk_id_tag_role_default_st_3_rg_3_lmb42endeu" FOREIGN KEY ("id", "__tag_role_default_st3rg3iau2") REFERENCES "qti"."value_set" ("id", "role") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_id_tag_kind_cp_dependency_zkvh_26_wnnn5r3xed" FOREIGN KEY ("id", "__tag_kind_cp_dependency_zkvh26cbdi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_id_package_cbnscsch6q" FOREIGN KEY ("id", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_package_resource_mszunxanb6" FOREIGN KEY ("package", "resource") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_package_target_bi3d2qvhiq" FOREIGN KEY ("package", "target") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_id_tag_kind_document_3_ilsmwej_65_dazgvbo74c" FOREIGN KEY ("id", "__tag_kind_document_3ilsmwej65") REFERENCES "qti"."tree" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_id_version_root_i36v6ovq5m" FOREIGN KEY ("id", "version", "root") REFERENCES "qti"."tree" ("id", "version", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_path_4tuuhnqkls" FOREIGN KEY ("package", "path") REFERENCES "qti"."package_entry" ("package", "path") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_resource_7mq3hcy5mi" FOREIGN KEY ("package", "resource") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_resource_resource_type_ysuyluweu3" FOREIGN KEY ("package", "resource", "resource_type") REFERENCES "qti"."resource" ("package", "identifier", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_version_eu6wa6vo6k" FOREIGN KEY ("package", "version") REFERENCES "qti"."package" ("id", "schemaversion") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_resource_type_root_5efvxdghx6" FOREIGN KEY ("resource_type", "root") REFERENCES "qti"."root_of_type" ("type", "root");

ALTER TABLE "qti"."document_id" ADD CONSTRAINT "__document_id_fk_document_ufpi2unt5l" FOREIGN KEY ("document") REFERENCES "qti"."document" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_identifier" ADD CONSTRAINT "__document_identifier_fk_document_package_resource_jwndwc6bku" FOREIGN KEY ("document", "package", "resource", "root") REFERENCES "qti"."document" ("id", "package", "resource", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_title" ADD CONSTRAINT "__document_title_fk_document_package_resource_root_jhvo3sglgq" FOREIGN KEY ("document", "package", "resource", "root") REFERENCES "qti"."document" ("id", "package", "resource", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_child_tree_version_child_kind_addtg4tokv" FOREIGN KEY ("child", "tree", "version", "child_kind") REFERENCES "qti"."node" ("id", "tree", "version", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_parent_tree_version_parent_kind_v7ynxlx4m6" FOREIGN KEY ("parent", "tree", "version", "parent_kind") REFERENCES "qti"."node" ("id", "tree", "version", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_version_parent_kind_child_kind_3g237kcsl6" FOREIGN KEY ("version", "parent_kind", "child_kind") REFERENCES "qti"."admission" ("version", "parent", "child");

ALTER TABLE "qti"."entity_reference" ADD CONSTRAINT "__entity_reference_fk_id_tag_kind_entity_ref_dhfdm5v4z3" FOREIGN KEY ("id", "__tag_kind_entity_ref_vjzwdvldjb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression" ADD CONSTRAINT "__expression_fk_id_document_kind_fwcnepbw3e" FOREIGN KEY ("id", "document", "kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_id_tag_kind_cp_file_lmc_4_p_5_hp_74_k5m33baabe" FOREIGN KEY ("id", "__tag_kind_cp_file_lmc4p5hp74") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_id_resource_position_er7we6b2by" FOREIGN KEY ("id", "resource", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_package_href_ycd4s7qtk3" FOREIGN KEY ("package", "href") REFERENCES "qti"."package_entry" ("package", "path") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_resource_package_nkqadixour" FOREIGN KEY ("resource", "package") REFERENCES "qti"."resource" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_content" ADD CONSTRAINT "__file_content_fk_package_path_nfk4i2vf5j" FOREIGN KEY ("package", "path") REFERENCES "qti"."package_entry" ("package", "path") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img" ADD CONSTRAINT "__img_fk_id_tag_kind_img_i_7_yel_3_m_6_ld_jmhphj53q5" FOREIGN KEY ("id", "__tag_kind_img_i7yel3m6ld") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img_height" ADD CONSTRAINT "__img_height_fk_node_ms33zlenv7" FOREIGN KEY ("node") REFERENCES "qti"."img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img_longdesc" ADD CONSTRAINT "__img_longdesc_fk_node_y4lwafy67d" FOREIGN KEY ("node") REFERENCES "qti"."img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img_width" ADD CONSTRAINT "__img_width_fk_node_h2rn2uti4n" FOREIGN KEY ("node") REFERENCES "qti"."img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_document_response_d5b6agd3yq" FOREIGN KEY ("document", "response_identifier", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_document_response_5zpazi3say" FOREIGN KEY ("document", "response_identifier", "shape") REFERENCES "qti"."declaration" ("document", "identifier", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_node_document_interaction_3rgydma4v2" FOREIGN KEY ("node", "document", "interaction_kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body" ADD CONSTRAINT "__item_body_fk_id_tag_kind_qti_item_body_jcju_2_47smepwucf" FOREIGN KEY ("id", "__tag_kind_qti_item_body_jcju2zecro") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body" ADD CONSTRAINT "__item_body_fk_id_item_eyzw7eb2oe" FOREIGN KEY ("id", "item") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal" ADD CONSTRAINT "__literal_fk_id_bejzcmox5h" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_boolean" ADD CONSTRAINT "__literal_boolean_fk_id_tag_base_type_boolean_4735_4myj62jp3d" FOREIGN KEY ("id", "__tag_base_type_boolean_4735tuf3vg") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_directed_pair" ADD CONSTRAINT "__literal_directed_pair_fk_id_tag_base_type_directed_gwg4wthbw7" FOREIGN KEY ("id", "__tag_base_type_directed_pair_g5lmbdounu") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_duration" ADD CONSTRAINT "__literal_duration_fk_id_tag_base_type_duration_x_4_lbgynv7vln" FOREIGN KEY ("id", "__tag_base_type_duration_x4kusayrrj") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_file" ADD CONSTRAINT "__literal_file_fk_id_tag_base_type_file_f_3_nyrmvnuq_gntznale5u" FOREIGN KEY ("id", "__tag_base_type_file_f3nyrmvnuq") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_float" ADD CONSTRAINT "__literal_float_fk_id_tag_base_type_float_3_yebf_7_kv56wpv5vt" FOREIGN KEY ("id", "__tag_base_type_float_3yebf7fbld") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_identifier" ADD CONSTRAINT "__literal_identifier_fk_id_tag_base_type_identifier_r66k3na6ph" FOREIGN KEY ("id", "__tag_base_type_identifier_su3axkpwpi") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_integer" ADD CONSTRAINT "__literal_integer_fk_id_tag_base_type_integer_42_hpi_fhexpvem2f" FOREIGN KEY ("id", "__tag_base_type_integer_42hpi675dm") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_pair" ADD CONSTRAINT "__literal_pair_fk_id_tag_base_type_pair_j_5_c_4_5n2tcec7hs" FOREIGN KEY ("id", "__tag_base_type_pair_j5c4komwfk") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_point" ADD CONSTRAINT "__literal_point_fk_id_tag_base_type_point_vrpib_4_j_mtxacunnh2" FOREIGN KEY ("id", "__tag_base_type_point_vrpib4j3ph") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_string" ADD CONSTRAINT "__literal_string_fk_id_tag_base_type_string_3_acd_7_bsbjfi6uy7" FOREIGN KEY ("id", "__tag_base_type_string_3acd7sfocx") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_uri" ADD CONSTRAINT "__literal_uri_fk_id_tag_base_type_uri_dedabn_4_vho_opebmm36hg" FOREIGN KEY ("id", "__tag_base_type_uri_dedabn4vho") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom" ADD CONSTRAINT "__lom_fk_id_tag_kind_lom_lom_f_6_hipyl_2_uh_bz6un6sdnw" FOREIGN KEY ("id", "__tag_kind_lom_lom_f6hipyl2uh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom" ADD CONSTRAINT "__lom_fk_id_package_d6xf5t5xkg" FOREIGN KEY ("id", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_aggregation_level" ADD CONSTRAINT "__lom_aggregation_level_fk_id_tag_kind_lom_whlaput7np" FOREIGN KEY ("id", "__tag_kind_lom_aggregation_level_nz6q333tpc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_aggregation_level" ADD CONSTRAINT "__lom_aggregation_level_fk_lom_bv6km72pzq" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_id_tag_kind_lom_contribute_df_2_7rpcq7mxt2" FOREIGN KEY ("id", "__tag_kind_lom_contribute_df2trhtcwa") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_id_parent_azdg5nrcbj" FOREIGN KEY ("id", "parent") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_id_position_anrlpze2a6" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_lom_xet4pxcqbo" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD CONSTRAINT "__lom_copyright_and_other_restrictions_fk_id_tag_674dg4oy6o" FOREIGN KEY ("id", "__tag_kind_lom_copyright_and_other_restrictions_iumfuc7nd6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD CONSTRAINT "__lom_copyright_and_other_restrictions_fk_id_rights_t2r4pp36py" FOREIGN KEY ("id", "rights") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD CONSTRAINT "__lom_copyright_and_other_restrictions_fk_lom_2eyn5uf3yv" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_cost" ADD CONSTRAINT "__lom_cost_fk_id_tag_kind_lom_cost_6_szqfkzkkf_23zskd6km7" FOREIGN KEY ("id", "__tag_kind_lom_cost_6szqfkzkkf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_cost" ADD CONSTRAINT "__lom_cost_fk_id_rights_qspq7ohb4b" FOREIGN KEY ("id", "rights") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_cost" ADD CONSTRAINT "__lom_cost_fk_lom_wflrpcbp5c" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_coverage" ADD CONSTRAINT "__lom_coverage_fk_id_tag_kind_lom_coverage_4_eywvbqgq6w" FOREIGN KEY ("id", "__tag_kind_lom_coverage_4gxjudfzzd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_coverage" ADD CONSTRAINT "__lom_coverage_fk_lom_sdgsgwwmry" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date" ADD CONSTRAINT "__lom_date_fk_id_tag_kind_lom_date_w_2_vdyftvu_3_dohk4pi2cr" FOREIGN KEY ("id", "__tag_kind_lom_date_w2vdyftvu3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date" ADD CONSTRAINT "__lom_date_fk_id_contribute_rdgokm4ivk" FOREIGN KEY ("id", "contribute") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date" ADD CONSTRAINT "__lom_date_fk_lom_pg6czotexk" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date_time" ADD CONSTRAINT "__lom_date_time_fk_id_tag_kind_lom_date_time_rwc_33_6hsukamghe" FOREIGN KEY ("id", "__tag_kind_lom_date_time_rwc33opc6i") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date_time" ADD CONSTRAINT "__lom_date_time_fk_id_date_twmqij6thy" FOREIGN KEY ("id", "date") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date_time" ADD CONSTRAINT "__lom_date_time_fk_lom_57lwwhv3j3" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_description" ADD CONSTRAINT "__lom_description_fk_id_tag_kind_lom_description_rf5lxo4ary" FOREIGN KEY ("id", "__tag_kind_lom_description_fgwqgc6sgl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_description" ADD CONSTRAINT "__lom_description_fk_lom_fskniocyns" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration" ADD CONSTRAINT "__lom_duration_fk_id_tag_kind_lom_duration_iav_5_iznkpng5qz" FOREIGN KEY ("id", "__tag_kind_lom_duration_iav5iizeai") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration" ADD CONSTRAINT "__lom_duration_fk_id_technical_na4zhuhr2o" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration" ADD CONSTRAINT "__lom_duration_fk_lom_7mahss6ctn" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration_string" ADD CONSTRAINT "__lom_duration_string_fk_id_tag_kind_lom_duration_xdrnlvqqvg" FOREIGN KEY ("id", "__tag_kind_lom_duration_string_ijve2g6fui") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration_string" ADD CONSTRAINT "__lom_duration_string_fk_id_duration_e4sg3lhowz" FOREIGN KEY ("id", "duration") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration_string" ADD CONSTRAINT "__lom_duration_string_fk_lom_dhbyhlqylo" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_id_tag_kind_lom_entity_ja_2_pg_4_zr_ptcquakojw" FOREIGN KEY ("id", "__tag_kind_lom_entity_ja2pg4zr5e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_id_contribute_r6ecje37rr" FOREIGN KEY ("id", "contribute") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_id_position_tkckn2awlf" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_lom_iku6rztwyh" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_id_tag_kind_lom_format_zjeruunvce_c3w7xdh64r" FOREIGN KEY ("id", "__tag_kind_lom_format_zjeruunvce") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_id_position_xeaahl3cte" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_id_technical_itq4yc3ebb" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_lom_kvxpepk4uj" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general" ADD CONSTRAINT "__lom_general_fk_id_tag_kind_lom_general_kdtvdmn_7_vdkmh6scgo" FOREIGN KEY ("id", "__tag_kind_lom_general_kdtvdmn7oa") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general" ADD CONSTRAINT "__lom_general_fk_lom_si32sc6scb" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general_title" ADD CONSTRAINT "__lom_general_title_fk_id_tag_kind_lom_title_jr4y2w4pqy" FOREIGN KEY ("id", "__tag_kind_lom_title_acxzzapsiz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general_title" ADD CONSTRAINT "__lom_general_title_fk_lom_owner_sufevcrymo" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_id_tag_kind_lom_identifier_zhhp_azlnipzw4a" FOREIGN KEY ("id", "__tag_kind_lom_identifier_zhhp3vq26p") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_id_position_nbqr2amaal" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_lom_owner_7ppq3a6qxr" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_id_tag_kind_lom_catalog_6hfzamzc7d" FOREIGN KEY ("id", "__tag_kind_lom_catalog_yeeo53s2uf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_id_identifier_26rxzb7n44" FOREIGN KEY ("id", "identifier") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_lom_owner_mvqepvvndf" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_lom_position_pa3s54vugg" FOREIGN KEY ("lom", "position") REFERENCES "qti"."lom_identifier" ("lom", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_id_tag_kind_lom_entry_z_2_l75xmxt3kd" FOREIGN KEY ("id", "__tag_kind_lom_entry_z2frivifgf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_id_identifier_pxcobfxgo6" FOREIGN KEY ("id", "identifier") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_lom_owner_yz7zl3s77l" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_lom_position_egoqmumcjs" FOREIGN KEY ("lom", "position") REFERENCES "qti"."lom_identifier" ("lom", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_installation_remarks" ADD CONSTRAINT "__lom_installation_remarks_fk_id_tag_kind_lom_ww27inllwj" FOREIGN KEY ("id", "__tag_kind_lom_installation_remarks_6actui7z3e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_installation_remarks" ADD CONSTRAINT "__lom_installation_remarks_fk_id_technical_g77yyfu5bk" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_installation_remarks" ADD CONSTRAINT "__lom_installation_remarks_fk_lom_i776nbzk4n" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_keyword" ADD CONSTRAINT "__lom_keyword_fk_id_tag_kind_lom_keyword_7_mdhbpmyak_66kpjugviq" FOREIGN KEY ("id", "__tag_kind_lom_keyword_7mdhbpmyak") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_keyword" ADD CONSTRAINT "__lom_keyword_fk_lom_qa3ryhoecq" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_id_tag_kind_lom_language_umo_24_ebp2bvszn4" FOREIGN KEY ("id", "__tag_kind_lom_language_umo24qkhua") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_id_position_7hf5mv3uq6" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_lom_7hxs4cmxlz" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_life_cycle" ADD CONSTRAINT "__lom_life_cycle_fk_id_tag_kind_lom_life_cycle_v_5_k73jlrfy56" FOREIGN KEY ("id", "__tag_kind_lom_life_cycle_v5zcy35q77") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_life_cycle" ADD CONSTRAINT "__lom_life_cycle_fk_lom_yejqs4n4pv" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_id_tag_kind_lom_location_3_4kpuqcn6oz" FOREIGN KEY ("id", "__tag_kind_lom_location_3tcexzxgfh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_id_position_bdje3mxzpc" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_id_technical_4m3blt4uw7" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_lom_4o7q6h3llc" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_maximum_version" ADD CONSTRAINT "__lom_maximum_version_fk_id_tag_kind_lom_maximum_nsm3qgub3j" FOREIGN KEY ("id", "__tag_kind_lom_maximum_version_anah5x464b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_maximum_version" ADD CONSTRAINT "__lom_maximum_version_fk_id_or_composite_3zkqflygdl" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_maximum_version" ADD CONSTRAINT "__lom_maximum_version_fk_lom_rb6t2quj3i" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_meta_metadata" ADD CONSTRAINT "__lom_meta_metadata_fk_id_tag_kind_lom_meta_metadata_globm7frj7" FOREIGN KEY ("id", "__tag_kind_lom_meta_metadata_z7muqedeoe") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_meta_metadata" ADD CONSTRAINT "__lom_meta_metadata_fk_lom_x2hpctp7aw" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_id_tag_kind_lom_ue4jxpqynq" FOREIGN KEY ("id", "__tag_kind_lom_metadataschema_kjpxrlzjhx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_id_meta_metadata_523sbhi6t6" FOREIGN KEY ("id", "meta_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_id_position_n4wwt3fdvx" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_lom_t6kwhxajdg" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_minimum_version" ADD CONSTRAINT "__lom_minimum_version_fk_id_tag_kind_lom_minimum_ucb2ck63ug" FOREIGN KEY ("id", "__tag_kind_lom_minimum_version_prl3rwqtuc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_minimum_version" ADD CONSTRAINT "__lom_minimum_version_fk_id_or_composite_fmhozeoprj" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_minimum_version" ADD CONSTRAINT "__lom_minimum_version_fk_lom_ge6recni3p" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_name" ADD CONSTRAINT "__lom_name_fk_id_tag_kind_lom_name_ta_2_c_7_syhrg_m7vxpjven6" FOREIGN KEY ("id", "__tag_kind_lom_name_ta2c7syhrg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_name" ADD CONSTRAINT "__lom_name_fk_id_or_composite_uldc7fa66v" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_name" ADD CONSTRAINT "__lom_name_fk_lom_rrgxp2dfyn" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_lom_package_resource_type_z7kymlx7md" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom_identified" ("lom", "package", "resource", "type");

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_lom_position_collapsed_jelttyi4kl" FOREIGN KEY ("lom", "position", "collapsed") REFERENCES "qti"."lom_identifier_entry" ("lom", "position", "collapsed") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_package_resource_ggz2gyu5bk" FOREIGN KEY ("package", "resource", "collapsed") REFERENCES "qti"."document_identifier" ("package", "resource", "value") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_title" ADD CONSTRAINT "__lom_object_title_fk_lom_package_resource_type_rjk5h4sxdc" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom_titled" ("lom", "package", "resource", "type");

ALTER TABLE "qti"."lom_object_title" ADD CONSTRAINT "__lom_object_title_fk_lom_position_collapsed_45znyzcxnu" FOREIGN KEY ("lom", "position", "collapsed") REFERENCES "qti"."lom_title" ("lom", "position", "collapsed") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_title" ADD CONSTRAINT "__lom_object_title_fk_package_resource_collapsed_4eqo3tv4fi" FOREIGN KEY ("package", "resource", "collapsed") REFERENCES "qti"."document_title" ("package", "resource", "collapsed") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_id_tag_kind_lom_or_composite_7ce3hso5cy" FOREIGN KEY ("id", "__tag_kind_lom_or_composite_hivjg4kbyy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_id_position_5r4kzrw6am" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_id_requirement_bnqtdcvais" FOREIGN KEY ("id", "requirement") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_lom_wjxfsgy4f2" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD CONSTRAINT "__lom_other_platform_requirements_fk_id_tag_kind_lom_d2uneiz6lx" FOREIGN KEY ("id", "__tag_kind_lom_other_platform_requirements_u6lzfnmyqi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD CONSTRAINT "__lom_other_platform_requirements_fk_id_technical_qazogkhd55" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD CONSTRAINT "__lom_other_platform_requirements_fk_lom_zvqps66ffy" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_id_tag_kind_lom_requirement_nfadn3cyem" FOREIGN KEY ("id", "__tag_kind_lom_requirement_giyfrxir3d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_id_position_vugvji5ewc" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_id_technical_z5utcb23yp" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_lom_micqxebrwb" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_rights" ADD CONSTRAINT "__lom_rights_fk_id_tag_kind_lom_rights_2_fcs_3_c_7_2bx2lvxqbi" FOREIGN KEY ("id", "__tag_kind_lom_rights_2fcs3c7jc3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_rights" ADD CONSTRAINT "__lom_rights_fk_lom_yz7vcplc3r" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_role" ADD CONSTRAINT "__lom_role_fk_id_tag_kind_lom_role_mff_47_g_5_aja_lw24d6m3vn" FOREIGN KEY ("id", "__tag_kind_lom_role_mff47g5aja") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_role" ADD CONSTRAINT "__lom_role_fk_id_contribute_pblcscwxcp" FOREIGN KEY ("id", "contribute") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_role" ADD CONSTRAINT "__lom_role_fk_lom_mhaq6h6hjy" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_size" ADD CONSTRAINT "__lom_size_fk_id_tag_kind_lom_size_lxvgvtngju_7db3jsoefd" FOREIGN KEY ("id", "__tag_kind_lom_size_lxvgvtngju") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_size" ADD CONSTRAINT "__lom_size_fk_id_technical_s3a7qj7jeq" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_size" ADD CONSTRAINT "__lom_size_fk_lom_3slqvedexx" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source" ADD CONSTRAINT "__lom_source_fk_id_tag_kind_lom_source_2_h_4_d_2_oofbgs4mub" FOREIGN KEY ("id", "__tag_kind_lom_source_2h4d2ilrdk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_status" ADD CONSTRAINT "__lom_status_fk_id_tag_kind_lom_status_vvuyk_32_w_3_ehlua2tnpr" FOREIGN KEY ("id", "__tag_kind_lom_status_vvuyk32w3f") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_status" ADD CONSTRAINT "__lom_status_fk_id_life_cycle_u3d4fcmxhx" FOREIGN KEY ("id", "life_cycle") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_status" ADD CONSTRAINT "__lom_status_fk_lom_jdj5c7e4l2" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_string" ADD CONSTRAINT "__lom_string_fk_id_tag_kind_lom_string_s_72_bccwbh_3_is2lj6hc2y" FOREIGN KEY ("id", "__tag_kind_lom_string_s72bccwbh3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_string_language" ADD CONSTRAINT "__lom_string_language_fk_node_56hhggldpq" FOREIGN KEY ("node") REFERENCES "qti"."lom_string" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_structure" ADD CONSTRAINT "__lom_structure_fk_id_tag_kind_lom_structure_7_zyt_pdjqzi3jue" FOREIGN KEY ("id", "__tag_kind_lom_structure_7zyt26pyt6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_structure" ADD CONSTRAINT "__lom_structure_fk_lom_uh7zsbgbgz" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_technical" ADD CONSTRAINT "__lom_technical_fk_id_tag_kind_lom_technical_6zvnm5bwg3" FOREIGN KEY ("id", "__tag_kind_lom_technical_yobodngzpk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_technical" ADD CONSTRAINT "__lom_technical_fk_lom_xvuznblomi" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_title" ADD CONSTRAINT "__lom_title_fk_id_position_e4eoi76yyj" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_title" ADD CONSTRAINT "__lom_title_fk_id_value_collapsed_tbloyxeasb" FOREIGN KEY ("id", "value", "collapsed") REFERENCES "qti"."lom_string" ("id", "value", "collapsed");

ALTER TABLE "qti"."lom_title" ADD CONSTRAINT "__lom_title_fk_lom_owner_jyifashk6t" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_type" ADD CONSTRAINT "__lom_type_fk_id_tag_kind_lom_type_gxwahsvklo_cfzouoexzc" FOREIGN KEY ("id", "__tag_kind_lom_type_gxwahsvklo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_type" ADD CONSTRAINT "__lom_type_fk_id_or_composite_lxutp3jajs" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_type" ADD CONSTRAINT "__lom_type_fk_lom_2amb2kaljt" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_value" ADD CONSTRAINT "__lom_value_fk_id_tag_kind_lom_value_rhv_3_macnym_izneuoby3s" FOREIGN KEY ("id", "__tag_kind_lom_value_rhv3macnym") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_version" ADD CONSTRAINT "__lom_version_fk_id_tag_kind_lom_version_o_4_inak_47_lhuqp5xp4w" FOREIGN KEY ("id", "__tag_kind_lom_version_o4inak47bb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_version" ADD CONSTRAINT "__lom_version_fk_id_life_cycle_ktsfyp4drx" FOREIGN KEY ("id", "life_cycle") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_version" ADD CONSTRAINT "__lom_version_fk_lom_m5ko4nzlsu" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest" ADD CONSTRAINT "__manifest_fk_id_3ausivvy2g" FOREIGN KEY ("id") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest" ADD CONSTRAINT "__manifest_fk_id_tag_kind_manifest_s_7_wedmbljj_ujghxp6a5t" FOREIGN KEY ("id", "__tag_kind_manifest_s7wedmbljj") REFERENCES "qti"."tree" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_tag_owner_manifest_rrl_26_lf5zw3hdgk" FOREIGN KEY ("lom", "__tag_owner_manifest_rrl26sfdmq") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_metadata_exz2q367yy" FOREIGN KEY ("lom", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_package_mqfnkg5gyu" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_metadata_tag_kind_cp_metadata_j5ubrgqjeh" FOREIGN KEY ("metadata", "__tag_kind_cp_metadata_manifest_lxlasjebcx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_metadata" ADD CONSTRAINT "__manifest_metadata_fk_id_tag_kind_cp_metadata_fe72riq7my" FOREIGN KEY ("id", "__tag_kind_cp_metadata_manifest_lxlasjebcx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_metadata" ADD CONSTRAINT "__manifest_metadata_fk_id_manifest_jimqgxh5is" FOREIGN KEY ("id", "manifest") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_metadata" ADD CONSTRAINT "__manifest_metadata_fk_manifest_4jgh6ftqug" FOREIGN KEY ("manifest") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema" ADD CONSTRAINT "__manifest_schema_fk_id_tag_kind_cp_schema_wydqdv_7_palxkyuh46" FOREIGN KEY ("id", "__tag_kind_cp_schema_wydqdv7nqu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema" ADD CONSTRAINT "__manifest_schema_fk_id_metadata_pandrdslwh" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema" ADD CONSTRAINT "__manifest_schema_fk_metadata_fs4pmegkrc" FOREIGN KEY ("metadata") REFERENCES "qti"."manifest_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_id_tag_kind_cp_73wpzhbjjc" FOREIGN KEY ("id", "__tag_kind_cp_schemaversion_b5pisyerct") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_id_metadata_wgpbnfvr2w" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_metadata_qnzzhkogjs" FOREIGN KEY ("metadata") REFERENCES "qti"."manifest_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."namespace_declaration" ADD CONSTRAINT "__namespace_declaration_fk_node_3d3hbes2yn" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_fk_tree_version_root_kind_zpi2yvq4yw" FOREIGN KEY ("tree", "version", "root_kind") REFERENCES "qti"."tree" ("id", "version", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."operand" ADD CONSTRAINT "__operand_fk_child_esvwbv5qvw" FOREIGN KEY ("child") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."operand" ADD CONSTRAINT "__operand_fk_expression_j6slibtu5a" FOREIGN KEY ("expression") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."organizations" ADD CONSTRAINT "__organizations_fk_id_tag_kind_cp_organizations_io_7_db7fzjtwu2" FOREIGN KEY ("id", "__tag_kind_cp_organizations_io7npeoiga") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."organizations" ADD CONSTRAINT "__organizations_fk_id_manifest_tri2qkyb2l" FOREIGN KEY ("id", "manifest") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."organizations" ADD CONSTRAINT "__organizations_fk_manifest_fb7sc7ale2" FOREIGN KEY ("manifest") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_declaration_arm" ADD CONSTRAINT "__outcome_declaration_arm_fk_id_tag_kind_outcome_22chhrzgof" FOREIGN KEY ("id", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_declaration_arm" ADD CONSTRAINT "__outcome_declaration_arm_fk_id_tag_kind_qti_outcome_wgdpfrnmwl" FOREIGN KEY ("id", "__tag_kind_qti_outcome_declaration_pavxgyuva7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."p" ADD CONSTRAINT "__p_fk_id_tag_kind_p_mm_76_ho_4_kjx_btiv6c7hco" FOREIGN KEY ("id", "__tag_kind_p_mm76ho4kjx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_fk_id_qkk3hvg5u6" FOREIGN KEY ("id") REFERENCES "qti"."manifest" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_fk_id_tag_kind_cp_manifest_vqajffgjxd_4fjgrvwawo" FOREIGN KEY ("id", "__tag_kind_cp_manifest_vqajffgjxd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package_entry" ADD CONSTRAINT "__package_entry_fk_package_3f4tbft6yj" FOREIGN KEY ("package") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pi" ADD CONSTRAINT "__pi_fk_id_tag_kind_pi_iifj_7_oyikt_rmzkyimkem" FOREIGN KEY ("id", "__tag_kind_pi_iifj7oyikt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prompt" ADD CONSTRAINT "__prompt_fk_id_tag_kind_qti_prompt_4_i_6_supq_76_j_e3luwmtdtl" FOREIGN KEY ("id", "__tag_kind_qti_prompt_4i6supq76j") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prompt" ADD CONSTRAINT "__prompt_fk_id_parent_yuyejxedmn" FOREIGN KEY ("id", "parent") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_composite" ADD CONSTRAINT "__qmd_composite_fk_id_tag_kind_qmd_composite_sp_2_w7goerpcuq" FOREIGN KEY ("id", "__tag_kind_qmd_composite_sp2gjoeow2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_composite" ADD CONSTRAINT "__qmd_composite_fk_id_qti_metadata_rltqut3omc" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_custom_type_identifier" ADD CONSTRAINT "__qmd_custom_type_identifier_fk_id_tag_kind_qmd_juhianhcwa" FOREIGN KEY ("id", "__tag_kind_qmd_custom_type_identifier_6maf4fokd4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_custom_type_identifier" ADD CONSTRAINT "__qmd_custom_type_identifier_fk_id_context_gba6i6a6uk" FOREIGN KEY ("id", "context") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_feedback_type" ADD CONSTRAINT "__qmd_feedback_type_fk_id_tag_kind_qmd_feedback_type_gqyhcryw34" FOREIGN KEY ("id", "__tag_kind_qmd_feedback_type_i4afuxmkum") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_feedback_type" ADD CONSTRAINT "__qmd_feedback_type_fk_id_qti_metadata_epakzlvve2" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_kind" ADD CONSTRAINT "__qmd_interaction_kind_fk_id_tag_kind_qmd_khrgw6ttuv" FOREIGN KEY ("id", "__tag_kind_qmd_interaction_kind_hqx3cimuzu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_kind" ADD CONSTRAINT "__qmd_interaction_kind_fk_id_context_7jpeebird6" FOREIGN KEY ("id", "context") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_type" ADD CONSTRAINT "__qmd_interaction_type_fk_id_tag_kind_qmd_ry22iea4su" FOREIGN KEY ("id", "__tag_kind_qmd_interaction_type_yfu5laontj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_type" ADD CONSTRAINT "__qmd_interaction_type_fk_id_qti_metadata_ybgt6st54k" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_item_template" ADD CONSTRAINT "__qmd_item_template_fk_id_tag_kind_qmd_item_template_lnwilcyl2j" FOREIGN KEY ("id", "__tag_kind_qmd_item_template_qed7bxhx4c") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_item_template" ADD CONSTRAINT "__qmd_item_template_fk_id_qti_metadata_76urwcvj3t" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_portable_custom_interaction_context" ADD CONSTRAINT "__qmd_portable_custom_interaction_context_fk_id_tag_u27enhz75w" FOREIGN KEY ("id", "__tag_kind_qmd_portable_custom_interaction_context_qpozrauewz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_portable_custom_interaction_context" ADD CONSTRAINT "__qmd_portable_custom_interaction_context_fk_id_qti_tql6iasbh2" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_scoring_mode" ADD CONSTRAINT "__qmd_scoring_mode_fk_id_tag_kind_qmd_scoring_mode_yn3ythnjwy" FOREIGN KEY ("id", "__tag_kind_qmd_scoring_mode_eautyyrud4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_scoring_mode" ADD CONSTRAINT "__qmd_scoring_mode_fk_id_qti_metadata_52k3fctbf2" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_solution_available" ADD CONSTRAINT "__qmd_solution_available_fk_id_tag_kind_qmd_solution_hwti37e5ul" FOREIGN KEY ("id", "__tag_kind_qmd_solution_available_2phsdzymgo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_solution_available" ADD CONSTRAINT "__qmd_solution_available_fk_id_qti_metadata_exg2b4t6mu" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_time_dependent" ADD CONSTRAINT "__qmd_time_dependent_fk_id_tag_kind_qmd_time_5jynlam4no" FOREIGN KEY ("id", "__tag_kind_qmd_time_dependent_kcomlfhb7l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_time_dependent" ADD CONSTRAINT "__qmd_time_dependent_fk_id_qti_metadata_ve4pocydcn" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_name" ADD CONSTRAINT "__qmd_tool_name_fk_id_tag_kind_qmd_tool_name_27_erzxutcz6a" FOREIGN KEY ("id", "__tag_kind_qmd_tool_name_27iaqneif4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_name" ADD CONSTRAINT "__qmd_tool_name_fk_id_qti_metadata_5nme7u6a3p" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_vendor" ADD CONSTRAINT "__qmd_tool_vendor_fk_id_tag_kind_qmd_tool_vendor_q_5_dwa53iimkv" FOREIGN KEY ("id", "__tag_kind_qmd_tool_vendor_q5oz7iuy5a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_vendor" ADD CONSTRAINT "__qmd_tool_vendor_fk_id_qti_metadata_b3kcfvtqeh" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_version" ADD CONSTRAINT "__qmd_tool_version_fk_id_tag_kind_qmd_tool_version_gwzwtlwzze" FOREIGN KEY ("id", "__tag_kind_qmd_tool_version_pnqrau5xa6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_version" ADD CONSTRAINT "__qmd_tool_version_fk_id_qti_metadata_5qhf4jnj4e" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_fk_id_tag_kind_qmd_qti_metadata_x_6_6z2za3iios" FOREIGN KEY ("id", "__tag_kind_qmd_qti_metadata_x6anaifca7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_fk_id_metadata_sjj6dojrsg" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_fk_metadata_tag_kind_cp_metadata_qzc3ba74y7" FOREIGN KEY ("metadata", "__tag_kind_cp_metadata_resource_scp7neoqwd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_fk_resource_y2rrzblzav" FOREIGN KEY ("resource") REFERENCES "qti"."resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_binding" ADD CONSTRAINT "__record_binding_fk_node_tag_shape_record_qozhrcs_4_3ry2ahdbqe" FOREIGN KEY ("node", "__tag_shape_record_qozhrcs4ym") REFERENCES "qti"."interaction_binding" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_declaration" ADD CONSTRAINT "__record_declaration_fk_id_tag_shape_record_oogx_67_xesz66xh77" FOREIGN KEY ("id", "__tag_shape_record_oogx67q33t") REFERENCES "qti"."declaration" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_field" ADD CONSTRAINT "__record_field_fk_id_tag_shape_record_3_rfzi_5_mgny_ubwuszlite" FOREIGN KEY ("id", "__tag_shape_record_3rfzi5mgny") REFERENCES "qti"."declared_value" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_value_set" ADD CONSTRAINT "__record_value_set_fk_id_tag_shape_record_lavxfyvieb_qortsgqn3b" FOREIGN KEY ("id", "__tag_shape_record_lavxfyvieb") REFERENCES "qti"."value_set" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_id_tag_kind_cp_resource_42_ghp_3_dst_6_w3frun75ds" FOREIGN KEY ("id", "__tag_kind_cp_resource_42ghp3dst6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_id_package_lgzh24zzew" FOREIGN KEY ("id", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_package_ibohlw6rop" FOREIGN KEY ("package") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_package_version_cq22wjnaos" FOREIGN KEY ("package", "version") REFERENCES "qti"."package" ("id", "schemaversion") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_version_type_t5numxxnax" FOREIGN KEY ("version", "type") REFERENCES "qti"."resource_type_of" ("version", "type");

ALTER TABLE "qti"."resource_href" ADD CONSTRAINT "__resource_href_fk_resource_package_2n5d27l5ex" FOREIGN KEY ("resource", "package") REFERENCES "qti"."resource" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_tag_owner_resource_r_2_xv_4_ps3p3dlhni" FOREIGN KEY ("lom", "__tag_owner_resource_r2xv4rjzei") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_metadata_tstiovefp3" FOREIGN KEY ("lom", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_package_axqj54t764" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_metadata_tag_kind_cp_metadata_ldfoygvkhx" FOREIGN KEY ("metadata", "__tag_kind_cp_metadata_resource_scp7neoqwd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_package_resource_type_cfijxypydp" FOREIGN KEY ("package", "resource", "type") REFERENCES "qti"."resource" ("package", "identifier", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_identified" ADD CONSTRAINT "__resource_lom_identified_fk_lom_package_resource_zy2pnxrsq6" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom" ("lom", "package", "resource", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_titled" ADD CONSTRAINT "__resource_lom_titled_fk_lom_package_resource_type_j6w2vbwkpm" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom" ("lom", "package", "resource", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_fk_id_tag_kind_cp_metadata_knszm4kknw" FOREIGN KEY ("id", "__tag_kind_cp_metadata_resource_scp7neoqwd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_fk_id_resource_w5ujkigusd" FOREIGN KEY ("id", "resource") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_fk_resource_3dfpd32tkn" FOREIGN KEY ("resource") REFERENCES "qti"."resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resources" ADD CONSTRAINT "__resources_fk_id_tag_kind_cp_resources_vfmef_7_qkml_zg6bbsyilf" FOREIGN KEY ("id", "__tag_kind_cp_resources_vfmef7qkml") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resources" ADD CONSTRAINT "__resources_fk_id_manifest_7jnjdqsavb" FOREIGN KEY ("id", "manifest") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resources" ADD CONSTRAINT "__resources_fk_manifest_2czsykboj3" FOREIGN KEY ("manifest") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_arm" ADD CONSTRAINT "__response_declaration_arm_fk_id_tag_kind_qti_f4xiuadvs7" FOREIGN KEY ("id", "__tag_kind_qti_response_declaration_mnirjlf2bs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_arm" ADD CONSTRAINT "__response_declaration_arm_fk_id_tag_kind_response_h_3liyki26gd" FOREIGN KEY ("id", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_id" ADD CONSTRAINT "__response_declaration_id_fk_document_id_tag_holder_i4txfimhl4" FOREIGN KEY ("document", "id", "__tag_holder_response_declaration_bgk6jyj7am") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_id" ADD CONSTRAINT "__response_declaration_id_fk_node_document_id_tag_4wjysgnaca" FOREIGN KEY ("node", "document", "id", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("id", "document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing" ADD CONSTRAINT "__response_processing_fk_id_tag_kind_qti_response_qon4wlz6ge" FOREIGN KEY ("id", "__tag_kind_qti_response_processing_w7uh2je46r") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing" ADD CONSTRAINT "__response_processing_fk_id_root_kind_5ongdtogaj" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_item" ADD CONSTRAINT "__response_processing_item_fk_id_tag_root_kind_item_nkqao7pvho" FOREIGN KEY ("id", "__tag_root_kind_item_od6jgyppue") REFERENCES "qti"."response_processing" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_item" ADD CONSTRAINT "__response_processing_item_fk_id_item_bsskbx5lby" FOREIGN KEY ("id", "item") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_item" ADD CONSTRAINT "__response_processing_item_fk_item_7c5mz5zc7w" FOREIGN KEY ("item") REFERENCES "qti"."assessment_item" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_template" ADD CONSTRAINT "__response_processing_template_fk_node_b45d5c65om" FOREIGN KEY ("node") REFERENCES "qti"."response_processing" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_template_location" ADD CONSTRAINT "__response_processing_template_location_fk_node_jfjndrc6xk" FOREIGN KEY ("node") REFERENCES "qti"."response_processing" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."schema_location" ADD CONSTRAINT "__schema_location_fk_node_o4jcb2f2aj" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_choice" ADD CONSTRAINT "__simple_choice_fk_id_tag_kind_qti_simple_choice_z_ylt3oa5b4p" FOREIGN KEY ("id", "__tag_kind_qti_simple_choice_z52ayjzccu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_choice" ADD CONSTRAINT "__simple_choice_fk_id_interaction_vf43rkjowe" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_choice_template_identifier" ADD CONSTRAINT "__simple_choice_template_identifier_fk_node_dtixe7cfvf" FOREIGN KEY ("node") REFERENCES "qti"."simple_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."standard_template_reference" ADD CONSTRAINT "__standard_template_reference_fk_node_um7etzu6k3" FOREIGN KEY ("node") REFERENCES "qti"."response_processing_template" ("node") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text" ADD CONSTRAINT "__text_fk_id_tag_kind_text_vrxl_6_g_2_xzn_3b3tvgxovp" FOREIGN KEY ("id", "__tag_kind_text_vrxl6g2xzn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree" ADD CONSTRAINT "__tree_fk_id_ifxa72pndo" FOREIGN KEY ("id") REFERENCES "qti"."tree_root" ("tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_doctype" ADD CONSTRAINT "__tree_doctype_fk_tree_js3v4oc2mb" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_export_charset" ADD CONSTRAINT "__tree_export_charset_fk_tree_6nskdfos2j" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_misc" ADD CONSTRAINT "__tree_misc_fk_tree_7layckvwjj" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_fk_node_tree_grmsgvpo4e" FOREIGN KEY ("node", "tree") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_fk_tree_f56cdfpty2" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_xml_encoding" ADD CONSTRAINT "__tree_xml_encoding_fk_tree_7h2ox5njoy" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_xml_standalone" ADD CONSTRAINT "__tree_xml_standalone_fk_tree_7jbo3bffyy" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_xml_version" ADD CONSTRAINT "__tree_xml_version_fk_tree_jew3d6jxfx" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_fk_document_response_identifier_base_5ucjatxedk" FOREIGN KEY ("document", "response_identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_fk_interaction_kind_base_type_bblgyhj6xh" FOREIGN KEY ("interaction_kind", "base_type", "cardinality") REFERENCES "qti"."binding_fit" ("interaction_kind", "base_type", "cardinality");

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_fk_node_tag_shape_typed_gdmqmo_4_yqk_2bdrcbrgzj" FOREIGN KEY ("node", "__tag_shape_typed_gdmqmo4yqk") REFERENCES "qti"."interaction_binding" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_fk_id_tag_shape_typed_qnenjfvgbj_e6j6tjzg52" FOREIGN KEY ("id", "__tag_shape_typed_qnenjfvgbj") REFERENCES "qti"."declaration" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_fk_id_document_identifier_6d4fics7jb" FOREIGN KEY ("id", "document", "identifier") REFERENCES "qti"."declaration" ("id", "document", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_value_set" ADD CONSTRAINT "__typed_value_set_fk_declaration_base_type_yxpne76buw" FOREIGN KEY ("declaration", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("id", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_value_set" ADD CONSTRAINT "__typed_value_set_fk_id_tag_shape_typed_atyt_4_o_6_gfidjsnbow" FOREIGN KEY ("id", "__tag_shape_typed_atyt4o6rfl") REFERENCES "qti"."value_set" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_value_set" ADD CONSTRAINT "__typed_value_set_fk_id_declaration_wjla6dmxga" FOREIGN KEY ("id", "declaration") REFERENCES "qti"."value_set" ("id", "declaration") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."value_set" ADD CONSTRAINT "__value_set_fk_declaration_shape_hldjke3uzi" FOREIGN KEY ("declaration", "shape") REFERENCES "qti"."declaration" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."value_set" ADD CONSTRAINT "__value_set_fk_id_declaration_5nufpikaia" FOREIGN KEY ("id", "declaration") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."value_set_interpretation" ADD CONSTRAINT "__value_set_interpretation_fk_value_set_5ttk24ay2k" FOREIGN KEY ("value_set") REFERENCES "qti"."value_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_ref" ADD CONSTRAINT "__variable_ref_fk_id_document_jnexkah4is" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ws" ADD CONSTRAINT "__ws_fk_id_tag_kind_ws_v_2_rnjnoedh_z7flyfbov6" FOREIGN KEY ("id", "__tag_kind_ws_v2rnjnoedh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."admission"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."assessment_item"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_entity_reference"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_lexical"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."binding_fit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."built_in_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."choice_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."choice_interaction_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."choice_interaction_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."comment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."correct_response_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_external_scored"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_interpretation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_long_interpretation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_mastery_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_normal_maximum"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_normal_minimum"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_variable_identifier_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_view"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_adaptive"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_fixed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_orientation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."default_value_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dependency"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."edge"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."entity_reference"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_content"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img_height"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img_longdesc"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interaction_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_body"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_aggregation_level"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_contribute"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_copyright_and_other_restrictions"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_cost"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_coverage"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_date"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_date_time"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_description"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_duration_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_entity"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_format"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_general"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_general_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_identifier_catalog"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_identifier_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_installation_remarks"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_keyword"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_language"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_life_cycle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_maximum_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_meta_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_metadataschema"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_minimum_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_name"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_object_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_object_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_or_composite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_other_platform_requirements"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_requirement"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_rights"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_role"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_size"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_source"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_status"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_string_language"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_structure"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_technical"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_schema"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_schema_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."namespace_declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operand"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operator_arity"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operator_arity_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."organizations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."p"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."package"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."package_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."pi"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."prompt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_composite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_custom_type_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_feedback_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_interaction_kind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_interaction_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_item_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_portable_custom_interaction_context"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_scoring_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_solution_available"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_time_dependent"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_tool_name"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_tool_vendor"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_tool_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_field"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_value_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_identified"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_titled"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_type_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resources"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_declaration_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_item"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_template_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."root_of_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."schema_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_choice"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_choice_template_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."standard_template_reference"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_doctype"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_export_charset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_misc"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_root"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_xml_encoding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_xml_standalone"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_xml_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."typed_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."typed_declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."typed_value_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."value_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."value_set_interpretation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variable_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ws"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();
