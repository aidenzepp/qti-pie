ALTER DOMAIN "qti"."__text_gubl3xpcnx" VALIDATE CONSTRAINT "check";

ALTER TABLE "qti"."aria_role" VALIDATE CONSTRAINT "aria_role_h_1";

ALTER TABLE "qti"."audio_autoplay" VALIDATE CONSTRAINT "audio_autoplay_by_version";

ALTER TABLE "qti"."audio_controls" VALIDATE CONSTRAINT "audio_controls_by_version";

ALTER TABLE "qti"."audio_loop" VALIDATE CONSTRAINT "audio_loop_by_version";

ALTER TABLE "qti"."audio_muted" VALIDATE CONSTRAINT "audio_muted_by_version";

ALTER TABLE "qti"."dependency" VALIDATE CONSTRAINT "dependency_not_self";

ALTER TABLE "qti"."equal_rounded" VALIDATE CONSTRAINT "equal_rounded_figures";

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "adaptive_feedback";

ALTER TABLE "qti"."lom_value" VALIDATE CONSTRAINT "lom_learning_resource_type";

ALTER TABLE "qti"."node_dir" VALIDATE CONSTRAINT "bdo_dir_not_auto";

ALTER TABLE "qti"."round_to" VALIDATE CONSTRAINT "round_to_figures";

ALTER TABLE "qti"."track_default" VALIDATE CONSTRAINT "track_default_by_version";

ALTER TABLE "qti"."variant" VALIDATE CONSTRAINT "variant_not_self";

ALTER TABLE "qti"."video_autoplay" VALIDATE CONSTRAINT "video_autoplay_by_version";

ALTER TABLE "qti"."video_controls" VALIDATE CONSTRAINT "video_controls_by_version";

ALTER TABLE "qti"."video_loop" VALIDATE CONSTRAINT "video_loop_by_version";

ALTER TABLE "qti"."video_muted" VALIDATE CONSTRAINT "video_muted_by_version";

ALTER TABLE "qti"."dependency" VALIDATE CONSTRAINT "__dependency_fk_package_resource_mszunxanb6";

ALTER TABLE "qti"."dependency" VALIDATE CONSTRAINT "__dependency_fk_package_target_bi3d2qvhiq";

ALTER TABLE "qti"."document" VALIDATE CONSTRAINT "__document_fk_package_path_4tuuhnqkls";

ALTER TABLE "qti"."document" VALIDATE CONSTRAINT "__document_fk_package_resource_7mq3hcy5mi";

ALTER TABLE "qti"."document" VALIDATE CONSTRAINT "__document_fk_package_resource_resource_type_ysuyluweu3";

ALTER TABLE "qti"."document_identifier" VALIDATE CONSTRAINT "__document_identifier_fk_document_package_resource_jwndwc6bku";

ALTER TABLE "qti"."document_lang" VALIDATE CONSTRAINT "__document_lang_fk_document_package_resource_lbo3acms5b";

ALTER TABLE "qti"."document_title" VALIDATE CONSTRAINT "__document_title_fk_document_package_resource_root_jhvo3sglgq";

ALTER TABLE "qti"."equal_tolerance" VALIDATE CONSTRAINT "__equal_tolerance_fk_node_tolerance_mode_zggqkxh66v";

ALTER TABLE "qti"."external_lom" VALIDATE CONSTRAINT "__external_lom_fk_document_package_resource_34e33j4gxl";

ALTER TABLE "qti"."file" VALIDATE CONSTRAINT "__file_fk_package_href_ycd4s7qtk3";

ALTER TABLE "qti"."file_content" VALIDATE CONSTRAINT "__file_content_fk_package_path_nfk4i2vf5j";

ALTER TABLE "qti"."hottext_owner" VALIDATE CONSTRAINT "__hottext_owner_fk_node_identifier_czroxsucmu";

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "__interaction_binding_fk_document_adaptive_7gj3j45p4n";

ALTER TABLE "qti"."lom_object_identifier" VALIDATE CONSTRAINT "__lom_object_identifier_fk_lom_package_resource_type_z7kymlx7md";

ALTER TABLE "qti"."lom_object_identifier" VALIDATE CONSTRAINT "__lom_object_identifier_fk_package_resource_ggz2gyu5bk";

ALTER TABLE "qti"."lom_object_title" VALIDATE CONSTRAINT "__lom_object_title_fk_lom_package_resource_type_rjk5h4sxdc";

ALTER TABLE "qti"."lom_object_title" VALIDATE CONSTRAINT "__lom_object_title_fk_package_resource_collapsed_4eqo3tv4fi";

ALTER TABLE "qti"."manifest_id_of_manifest" VALIDATE CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj";

ALTER TABLE "qti"."manifest_id_of_manifest" VALIDATE CONSTRAINT "__manifest_id_of_manifest_fk_package_id_tag_holder_hcdzuklnac";

ALTER TABLE "qti"."manifest_id_of_resource" VALIDATE CONSTRAINT "__manifest_id_of_resource_fk_package_id_moulqn3fj4";

ALTER TABLE "qti"."manifest_id_of_resource" VALIDATE CONSTRAINT "__manifest_id_of_resource_fk_package_id_tag_holder_zdlxck3tn7";

ALTER TABLE "qti"."manifest_id_of_variant" VALIDATE CONSTRAINT "__manifest_id_of_variant_fk_package_id_huvjqiu33v";

ALTER TABLE "qti"."manifest_id_of_variant" VALIDATE CONSTRAINT "__manifest_id_of_variant_fk_package_id_tag_holder_jf7shcoyrs";

ALTER TABLE "qti"."package" VALIDATE CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc";

ALTER TABLE "qti"."qti_metadata_in_external_lom" VALIDATE CONSTRAINT "__qti_metadata_in_external_lom_fk_id_package_45ujtyda4c";

ALTER TABLE "qti"."qti_metadata_in_external_lom" VALIDATE CONSTRAINT "__qti_metadata_in_external_lom_fk_lom_package_iml635ey3w";

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_id_package_resource_wjxdq6kefq";

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_resource_node_package_bwtvi3p7ra";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_package_gmcsikj4sm";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_lom_package_56adstemff";

ALTER TABLE "qti"."resource" VALIDATE CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv";

ALTER TABLE "qti"."resource_lom" VALIDATE CONSTRAINT "__resource_lom_fk_package_resource_type_cfijxypydp";

ALTER TABLE "qti"."resource_lom_general" VALIDATE CONSTRAINT "__resource_lom_general_fk_lom_package_resource_xkjtdlbhgo";

ALTER TABLE "qti"."resource_lom_identified" VALIDATE CONSTRAINT "__resource_lom_identified_fk_lom_package_resource_zy2pnxrsq6";

ALTER TABLE "qti"."resource_lom_language_set" VALIDATE CONSTRAINT "__resource_lom_language_set_fk_lom_package_resource_outjuw2j4n";

ALTER TABLE "qti"."resource_lom_titled" VALIDATE CONSTRAINT "__resource_lom_titled_fk_lom_package_resource_type_j6w2vbwkpm";

ALTER TABLE "qti"."variant" VALIDATE CONSTRAINT "__variant_fk_package_identifier_ffjrlehepf";

ALTER TABLE "qti"."variant" VALIDATE CONSTRAINT "__variant_fk_package_identifierref_zujo3dkru3";

ALTER TABLE "qti"."variant" VALIDATE CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu";
