CREATE UNIQUE INDEX "__lom_general_title_key_lom_jlcfowoam5" ON "qti"."lom_general_title" USING btree ("lom");

CREATE UNIQUE INDEX "__manifest_metadata_key_manifest_2ntkwgdgmn" ON "qti"."manifest_metadata" USING btree ("manifest");

CREATE UNIQUE INDEX "__manifest_schema_key_metadata_qazxuynlsp" ON "qti"."manifest_schema" USING btree ("metadata");

CREATE UNIQUE INDEX "__manifest_schema_version_key_metadata_f6e5tc2dqq" ON "qti"."manifest_schema_version" USING btree ("metadata");

CREATE UNIQUE INDEX "__organizations_key_manifest_myqunp6c5p" ON "qti"."organizations" USING btree ("manifest");

CREATE UNIQUE INDEX "__resources_key_manifest_v3e3achdnh" ON "qti"."resources" USING btree ("manifest");

CREATE INDEX "__attribute_lexical_ix_node_kind_hwyadhp4if" ON "qti"."attribute_lexical" USING btree ("node", "kind");

CREATE INDEX "__declared_ref_ix_document_identifier_4nsnfmfyel" ON "qti"."declared_ref" USING btree ("document", "identifier");

CREATE INDEX "__declared_value_ix_value_set_base_type_zitbtn6nwa" ON "qti"."declared_value" USING btree ("value_set", "base_type");

CREATE INDEX "__declared_value_ix_value_set_shape_zegpafstry" ON "qti"."declared_value" USING btree ("value_set", "shape");

CREATE INDEX "__dependency_ix_package_resource_k7yvrhb5p6" ON "qti"."dependency" USING btree ("package", "resource");

CREATE INDEX "__dependency_ix_package_target_irvksks4il" ON "qti"."dependency" USING btree ("package", "target");

CREATE INDEX "__document_ix_package_version_2zrptn52fq" ON "qti"."document" USING btree ("package", "version");

CREATE INDEX "__document_ix_resource_type_root_krtmo7mbrt" ON "qti"."document" USING btree ("resource_type", "root");

CREATE INDEX "__edge_ix_parent_tree_version_parent_kind_rncqfqwmf2" ON "qti"."edge" USING btree ("parent", "tree", "version", "parent_kind");

CREATE INDEX "__edge_ix_version_parent_kind_child_kind_2tg4zz3a7o" ON "qti"."edge" USING btree ("version", "parent_kind", "child_kind");

CREATE INDEX "__file_ix_package_href_vgnf3xnans" ON "qti"."file" USING btree ("package", "href");

CREATE INDEX "__file_ix_resource_3lt2t6uxt3" ON "qti"."file" USING btree ("resource");

CREATE INDEX "__lom_aggregation_level_ix_lom_crtqoeboje" ON "qti"."lom_aggregation_level" USING btree ("lom");

CREATE INDEX "__lom_contribute_ix_lom_wom4wgkdxk" ON "qti"."lom_contribute" USING btree ("lom");

CREATE INDEX "__lom_copyright_and_other_restrictions_ix_lom_sfpdyjfpb2" ON "qti"."lom_copyright_and_other_restrictions" USING btree ("lom");

CREATE INDEX "__lom_cost_ix_lom_xhsvj33rgy" ON "qti"."lom_cost" USING btree ("lom");

CREATE INDEX "__lom_coverage_ix_lom_txnrszdfo3" ON "qti"."lom_coverage" USING btree ("lom");

CREATE INDEX "__lom_date_ix_lom_aqs5sp5tv7" ON "qti"."lom_date" USING btree ("lom");

CREATE INDEX "__lom_date_time_ix_lom_n4aroup2ei" ON "qti"."lom_date_time" USING btree ("lom");

CREATE INDEX "__lom_description_ix_lom_vnyonuegvg" ON "qti"."lom_description" USING btree ("lom");

CREATE INDEX "__lom_duration_ix_lom_pheyxyu47i" ON "qti"."lom_duration" USING btree ("lom");

CREATE INDEX "__lom_duration_string_ix_lom_ktf56bgpmh" ON "qti"."lom_duration_string" USING btree ("lom");

CREATE INDEX "__lom_entity_ix_lom_n2l5ake4in" ON "qti"."lom_entity" USING btree ("lom");

CREATE INDEX "__lom_format_ix_lom_7qax32efgp" ON "qti"."lom_format" USING btree ("lom");

CREATE INDEX "__lom_identifier_ix_lom_owner_wzkf734f4v" ON "qti"."lom_identifier" USING btree ("lom", "owner");

CREATE INDEX "__lom_identifier_catalog_ix_lom_owner_ucyua7radl" ON "qti"."lom_identifier_catalog" USING btree ("lom", "owner");

CREATE INDEX "__lom_identifier_catalog_ix_lom_position_wgnkpa3owk" ON "qti"."lom_identifier_catalog" USING btree ("lom", "position");

CREATE INDEX "__lom_identifier_entry_ix_lom_owner_su645mpz6h" ON "qti"."lom_identifier_entry" USING btree ("lom", "owner");

CREATE INDEX "__lom_installation_remarks_ix_lom_qjvmsukpm5" ON "qti"."lom_installation_remarks" USING btree ("lom");

CREATE INDEX "__lom_keyword_ix_lom_gu2t5sxzd7" ON "qti"."lom_keyword" USING btree ("lom");

CREATE INDEX "__lom_language_ix_lom_r6g2pzfink" ON "qti"."lom_language" USING btree ("lom");

CREATE INDEX "__lom_location_ix_lom_ha5vcr722n" ON "qti"."lom_location" USING btree ("lom");

CREATE INDEX "__lom_maximum_version_ix_lom_sxkgn27yw5" ON "qti"."lom_maximum_version" USING btree ("lom");

CREATE INDEX "__lom_metadataschema_ix_lom_fxwgialmzq" ON "qti"."lom_metadataschema" USING btree ("lom");

CREATE INDEX "__lom_minimum_version_ix_lom_fnuw2hzfka" ON "qti"."lom_minimum_version" USING btree ("lom");

CREATE INDEX "__lom_name_ix_lom_j3tsm6s3w7" ON "qti"."lom_name" USING btree ("lom");

CREATE INDEX "__lom_object_identifier_ix_package_resource_fvyo7vsxtk" ON "qti"."lom_object_identifier" USING btree ("package", "resource", "collapsed");

CREATE INDEX "__lom_object_title_ix_package_resource_collapsed_mctzzsj7mu" ON "qti"."lom_object_title" USING btree ("package", "resource", "collapsed");

CREATE INDEX "__lom_or_composite_ix_lom_y24ycko4jv" ON "qti"."lom_or_composite" USING btree ("lom");

CREATE INDEX "__lom_other_platform_requirements_ix_lom_lz5kv6b6lf" ON "qti"."lom_other_platform_requirements" USING btree ("lom");

CREATE INDEX "__lom_requirement_ix_lom_d3iex7gu7u" ON "qti"."lom_requirement" USING btree ("lom");

CREATE INDEX "__lom_role_ix_lom_bsi3n32r2b" ON "qti"."lom_role" USING btree ("lom");

CREATE INDEX "__lom_size_ix_lom_6itjjvkq3e" ON "qti"."lom_size" USING btree ("lom");

CREATE INDEX "__lom_status_ix_lom_emiyxi6m22" ON "qti"."lom_status" USING btree ("lom");

CREATE INDEX "__lom_structure_ix_lom_6u7wnpggrk" ON "qti"."lom_structure" USING btree ("lom");

CREATE INDEX "__lom_title_ix_lom_owner_zggm6lanqk" ON "qti"."lom_title" USING btree ("lom", "owner");

CREATE INDEX "__lom_type_ix_lom_6y3cbtt2b6" ON "qti"."lom_type" USING btree ("lom");

CREATE INDEX "__lom_version_ix_lom_5vgccnw4wo" ON "qti"."lom_version" USING btree ("lom");

CREATE INDEX "__manifest_lom_ix_metadata_x76b6ms7vy" ON "qti"."manifest_lom" USING btree ("metadata");

CREATE INDEX "__node_ix_tree_version_root_kind_midgktllgy" ON "qti"."node" USING btree ("tree", "version", "root_kind");

CREATE INDEX "__qti_metadata_ix_metadata_pxk5ddkomg" ON "qti"."qti_metadata" USING btree ("metadata");

CREATE INDEX "__resource_ix_package_version_wqz6pkayka" ON "qti"."resource" USING btree ("package", "version");

CREATE INDEX "__resource_ix_version_type_5nf4p4seqz" ON "qti"."resource" USING btree ("version", "type");

CREATE INDEX "__resource_lom_ix_metadata_vavjihmzwx" ON "qti"."resource_lom" USING btree ("metadata");

CREATE INDEX "__typed_binding_ix_document_response_identifier_base_ywuawwudab" ON "qti"."typed_binding" USING btree ("document", "response_identifier", "base_type", "cardinality");

CREATE INDEX "__typed_binding_ix_interaction_kind_base_type_f63zbhy6nz" ON "qti"."typed_binding" USING btree ("interaction_kind", "base_type", "cardinality");

CREATE INDEX "__typed_value_set_ix_declaration_base_type_zpsvrx2gkw" ON "qti"."typed_value_set" USING btree ("declaration", "base_type", "cardinality");

CREATE INDEX "__value_set_ix_declaration_shape_2ttql7vose" ON "qti"."value_set" USING btree ("declaration", "shape");
