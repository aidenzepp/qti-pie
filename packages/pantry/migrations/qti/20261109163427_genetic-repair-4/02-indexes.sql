CREATE INDEX "__placed_reference_type_ix_declaration_base_type_qtq3ujs2d5" ON "qti"."placed_reference_type" USING btree ("declaration", "base_type");

CREATE INDEX "__placed_reference_type_ix_declaration_cardinality_5bj3coekou" ON "qti"."placed_reference_type" USING btree ("declaration", "cardinality");

CREATE INDEX "__placed_reference_type_ix_node_parent_kind_rtzq6qftfl" ON "qti"."placed_reference_type" USING btree ("node", "parent_kind");
