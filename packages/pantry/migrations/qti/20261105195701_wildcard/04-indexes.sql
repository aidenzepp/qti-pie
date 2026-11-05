CREATE INDEX "__document_xml_id_ix_kind_attribute_t5cmc5hfcs" ON "qti"."document_xml_id" USING btree ("kind", "attribute");

CREATE INDEX "__foreign_attribute_ix_kind_process_bu3ygcm7sz" ON "qti"."foreign_attribute" USING btree ("kind", "process");

CREATE INDEX "__foreign_attribute_ix_node_kind_root_kind_kdmutywn3s" ON "qti"."foreign_attribute" USING btree ("node", "kind", "root_kind");

CREATE INDEX "__foreign_attribute_ix_root_kind_schema_set_xtabyn737r" ON "qti"."foreign_attribute" USING btree ("root_kind", "schema_set");

CREATE INDEX "__foreign_element_ix_root_kind_schema_set_7etry73gop" ON "qti"."foreign_element" USING btree ("root_kind", "schema_set");

CREATE INDEX "__manifest_xml_id_ix_kind_attribute_nld4t5yayc" ON "qti"."manifest_xml_id" USING btree ("kind", "attribute");

CREATE INDEX "__node_xml_space_ix_kind_attribute_tcj33a4y4l" ON "qti"."node_xml_space" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_actuate_ix_kind_attribute_mkfo7mqdfc" ON "qti"."xlink_actuate" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_arcrole_ix_kind_attribute_xsliyvzjzz" ON "qti"."xlink_arcrole" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_from_ix_kind_attribute_opnvugm72s" ON "qti"."xlink_from" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_href_ix_kind_attribute_ykol4giu5u" ON "qti"."xlink_href" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_label_ix_kind_attribute_bbdew4q4z6" ON "qti"."xlink_label" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_role_ix_kind_attribute_nuncp2i27n" ON "qti"."xlink_role" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_show_ix_kind_attribute_5a34hydlnt" ON "qti"."xlink_show" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_title_ix_kind_attribute_lcf3baayiy" ON "qti"."xlink_title" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_to_ix_kind_attribute_kmfgwyrsfr" ON "qti"."xlink_to" USING btree ("kind", "attribute");

CREATE INDEX "__xlink_type_ix_kind_attribute_zk34gj6sqa" ON "qti"."xlink_type" USING btree ("kind", "attribute");

CREATE INDEX "__xsi_type_attribute_ix_node_kind_5vvxpze6vq" ON "qti"."xsi_type_attribute" USING btree ("node", "kind");
