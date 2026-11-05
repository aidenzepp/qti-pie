CREATE INDEX "__attribute_file_reference_ix_document_package_xqjfmjx3fk" ON "qti"."attribute_file_reference" USING btree ("document", "package");

CREATE INDEX "__attribute_file_reference_ix_kind_attribute_nor5wfnits" ON "qti"."attribute_file_reference" USING btree ("kind", "attribute");

CREATE INDEX "__attribute_file_reference_ix_node_document_ea3spa7qs5" ON "qti"."attribute_file_reference" USING btree ("node", "document");

CREATE INDEX "__attribute_file_reference_ix_node_kind_pgf43eid2f" ON "qti"."attribute_file_reference" USING btree ("node", "kind");

CREATE INDEX "__attribute_file_reference_ix_package_path_rk3bsveubk" ON "qti"."attribute_file_reference" USING btree ("package", "path");

CREATE INDEX "__branch_rule_ix_owner_owner_kind_item_ref_7gsisg5fta" ON "qti"."branch_rule" USING btree ("owner") WHERE "owner_kind" = 'itemRef'::"qti"."structure_holder";

CREATE INDEX "__branch_rule_ix_owner_owner_kind_part_gpsj4nncy6" ON "qti"."branch_rule" USING btree ("owner") WHERE "owner_kind" = 'part'::"qti"."structure_holder";

CREATE INDEX "__branch_rule_ix_owner_owner_kind_section_uchby3vxqa" ON "qti"."branch_rule" USING btree ("owner") WHERE "owner_kind" = 'section'::"qti"."structure_holder";

CREATE INDEX "__branch_rule_target_ix_scope_identifier_holder_kind_5rxvgeh7a7" ON "qti"."branch_rule_target" USING btree ("scope", "identifier", "holder_kind");

CREATE INDEX "__item_instance_variable_ref_ix_document_root_i3vut24eoj" ON "qti"."item_instance_variable_ref" USING btree ("document", "root");

CREATE INDEX "__item_ref_document_ix_package_path_document_tu47evbzrd" ON "qti"."item_ref_document" USING btree ("package", "path", "document");

CREATE INDEX "__item_ref_lti_ix_package_resource_type_3dfjpcfox6" ON "qti"."item_ref_lti" USING btree ("package", "resource", "type");

CREATE INDEX "__item_variable_ref_ix_document_root_fr4hivhfgo" ON "qti"."item_variable_ref" USING btree ("document", "root");

CREATE INDEX "__prefixed_declared_ix_item_document_variable_kd6n5exnii" ON "qti"."prefixed_declared" USING btree ("item_document", "variable");

CREATE INDEX "__prefixed_mapped_ix_item_ref_variable_jaimn6vqc5" ON "qti"."prefixed_mapped" USING btree ("item_ref", "variable");

CREATE INDEX "__prefixed_variable_source_ix_item_ref_item_document_2d3j5kxclt" ON "qti"."prefixed_variable_source" USING btree ("item_ref", "item_document");

CREATE INDEX "__prefixed_variable_source_ix_ref_document_ref_kind_er3hrlxzcg" ON "qti"."prefixed_variable_source" USING btree ("ref", "document", "ref_kind");

CREATE INDEX "__prefixed_variable_source_ix_ref_prefix_ref_kind_epgkpxgbmf" ON "qti"."prefixed_variable_source" USING btree ("ref", "prefix") WHERE "ref_kind" = 'itemInstanceVariable'::"qti"."ref_kind";

CREATE INDEX "__prefixed_variable_source_ix_ref_prefix_ref_kind_ydu5xkvfh4" ON "qti"."prefixed_variable_source" USING btree ("ref", "prefix") WHERE "ref_kind" = 'itemVariable'::"qti"."ref_kind";

CREATE INDEX "__prefixed_variable_source_ix_test_document_wyur2w6qaj" ON "qti"."prefixed_variable_source" USING btree ("test", "document");

CREATE INDEX "__prefixed_variable_source_ix_test_prefix_item_ref_cx5zdn323i" ON "qti"."prefixed_variable_source" USING btree ("test", "prefix", "item_ref");

CREATE INDEX "__required_child_ix_parent_ha3sthq6ck" ON "qti"."required_child" USING btree ("parent");

CREATE INDEX "__section_duration_ref_ix_document_root_mowdor6fsj" ON "qti"."section_duration_ref" USING btree ("document", "root");

CREATE INDEX "__section_duration_target_ix_ref_document_prefix_ref_z2os4vz6tf" ON "qti"."section_duration_target" USING btree ("ref", "document", "prefix") WHERE "ref_kind" = 'sectionDuration'::"qti"."ref_kind";

CREATE INDEX "__section_duration_target_ix_ref_document_ref_kind_u2jcz6fkdu" ON "qti"."section_duration_target" USING btree ("ref", "document", "ref_kind");

CREATE INDEX "__section_duration_target_ix_test_document_aoezj4mdjk" ON "qti"."section_duration_target" USING btree ("test", "document");

CREATE INDEX "__section_duration_target_ix_test_prefix_holder_ighcamapej" ON "qti"."section_duration_target" USING btree ("test", "prefix", "holder", "holder_kind");

CREATE INDEX "__section_feedback_outcome_ref_ix_node_document_2rbti3qtvq" ON "qti"."section_feedback_outcome_ref" USING btree ("node", "document");

CREATE INDEX "__section_feedback_outcome_ref_ix_test_document_3bo4sifs67" ON "qti"."section_feedback_outcome_ref" USING btree ("test", "document");

CREATE INDEX "__section_feedback_outcome_ref_ix_test_identifier_xlbzontcma" ON "qti"."section_feedback_outcome_ref" USING btree ("test", "identifier", "base_type", "cardinality");

CREATE INDEX "__section_identifier_target_ix_node_document_vjq5gwjmci" ON "qti"."section_identifier_target" USING btree ("node", "document");

CREATE INDEX "__section_identifier_target_ix_test_document_j72pzqh3zr" ON "qti"."section_identifier_target" USING btree ("test", "document");

CREATE INDEX "__section_identifier_target_ix_test_identifier_ztvictc2kw" ON "qti"."section_identifier_target" USING btree ("test", "identifier", "holder_kind");

CREATE INDEX "__section_printed_variable_ref_ix_node_document_xshgjt7y5g" ON "qti"."section_printed_variable_ref" USING btree ("node", "document");

CREATE INDEX "__section_printed_variable_ref_ix_test_document_qsyg4tkf7v" ON "qti"."section_printed_variable_ref" USING btree ("test", "document");

CREATE INDEX "__section_printed_variable_ref_ix_test_identifier_4lxox3cb7t" ON "qti"."section_printed_variable_ref" USING btree ("test", "identifier", "kind");

CREATE INDEX "__section_printed_variable_var_ref_ix_node_document_7bilc3oegr" ON "qti"."section_printed_variable_var_ref" USING btree ("node", "document");

CREATE INDEX "__section_printed_variable_var_ref_ix_test_document_ukgf3tvlt3" ON "qti"."section_printed_variable_var_ref" USING btree ("test", "document");

CREATE INDEX "__section_printed_variable_var_ref_ix_test_zn7yzvfndz" ON "qti"."section_printed_variable_var_ref" USING btree ("test", "identifier", "base_type", "cardinality");

CREATE INDEX "__section_printed_variable_var_ref_ix_test_vcxdcevmbm" ON "qti"."section_printed_variable_var_ref" USING btree ("test", "identifier", "kind");

CREATE INDEX "__section_ref_resolution_ix_package_path_document_qxkcx25v5s" ON "qti"."section_ref_resolution" USING btree ("package", "path", "document");

CREATE INDEX "__section_variable_declared_ix_ref_identifier_jves4xn4qp" ON "qti"."section_variable_declared" USING btree ("ref", "identifier", "referrer_kind");

CREATE INDEX "__section_variable_declared_ix_test_identifier_jstfondmin" ON "qti"."section_variable_declared" USING btree ("test", "identifier", "declaration_kind");

CREATE INDEX "__section_variable_ref_ix_document_root_fbv3ajznut" ON "qti"."section_variable_ref" USING btree ("document", "root");

CREATE INDEX "__section_variable_resolution_ix_ref_document_mx3p5rvxtq" ON "qti"."section_variable_resolution" USING btree ("ref", "document");

CREATE INDEX "__section_variable_resolution_ix_test_document_ls2rcciplu" ON "qti"."section_variable_resolution" USING btree ("test", "document");

CREATE INDEX "__stimulus_ref_resolution_ix_package_path_document_2l4r2v7qqk" ON "qti"."stimulus_ref_resolution" USING btree ("package", "path", "document");

CREATE INDEX "__structure_child_ix_parent_gg6he43n57" ON "qti"."structure_child" USING btree ("parent");

CREATE INDEX "__template_default_ix_item_document_template_3q36k36wlr" ON "qti"."template_default" USING btree ("item_document", "template_identifier");

CREATE INDEX "__template_default_ix_item_ref_item_document_bywsokisj7" ON "qti"."template_default" USING btree ("item_ref", "item_document");

CREATE INDEX "__test_document_ix_document_pjcxx332km" ON "qti"."test_document" USING btree ("document");

CREATE INDEX "__test_reach_ix_holder_identifier_holder_kind_4zb2iau4lk" ON "qti"."test_reach" USING btree ("holder", "identifier", "holder_kind");

CREATE INDEX "__variable_mapping_ix_item_document_source_t42n3arlmz" ON "qti"."variable_mapping" USING btree ("item_document", "source");

CREATE INDEX "__variable_mapping_ix_item_ref_item_document_id2btkbw6z" ON "qti"."variable_mapping" USING btree ("item_ref", "item_document");
