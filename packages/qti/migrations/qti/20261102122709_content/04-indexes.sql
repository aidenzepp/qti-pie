-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__document_key_id_package_resource_flponjq52v";

CREATE UNIQUE INDEX CONCURRENTLY "__document_key_id_package_resource_flponjq52v" ON "qti"."document" USING btree ("id", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_child_parent_kind_jv6mposiie";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_child_parent_kind_jv6mposiie" ON "qti"."edge" USING btree ("child", "parent_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__html_id_key_document_id_kind_mqib2r43zi";

CREATE UNIQUE INDEX CONCURRENTLY "__html_id_key_document_id_kind_mqib2r43zi" ON "qti"."html_id" USING btree ("document", "id", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_key_id_tree_root_kind_dm7x2qc7ni";

CREATE UNIQUE INDEX CONCURRENTLY "__node_key_id_tree_root_kind_dm7x2qc7ni" ON "qti"."node" USING btree ("id", "tree", "root_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__resource_lom_key_lom_package_resource_fcuxpt7bmm";

CREATE UNIQUE INDEX CONCURRENTLY "__resource_lom_key_lom_package_resource_fcuxpt7bmm" ON "qti"."resource_lom" USING btree ("lom", "package", "resource");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__typed_declaration_key_id_base_type_t4fk2utvgg";

CREATE UNIQUE INDEX CONCURRENTLY "__typed_declaration_key_id_base_type_t4fk2utvgg" ON "qti"."typed_declaration" USING btree ("id", "base_type");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__typed_declaration_key_id_cardinality_kanzf7btjn";

CREATE UNIQUE INDEX CONCURRENTLY "__typed_declaration_key_id_cardinality_kanzf7btjn" ON "qti"."typed_declaration" USING btree ("id", "cardinality");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_caption_g4632cnutx";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_caption_g4632cnutx" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'caption'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_img_hizgmsur3h";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_img_hizgmsur3h" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'img'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_summary_gcdnyfgmod";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_summary_gcdnyfgmod" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'summary'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_tfoot_iuhmcz3spr";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_tfoot_iuhmcz3spr" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'tfoot'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_thead_d6l4jyggvu";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_thead_d6l4jyggvu" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'thead'::"qti"."node_kind";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__attribute_lexical_ix_kind_attribute_7hgb4uv7ab";

CREATE INDEX CONCURRENTLY "__attribute_lexical_ix_kind_attribute_7hgb4uv7ab" ON "qti"."attribute_lexical" USING btree ("kind", "attribute");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_ix_parent_ancestry_parent_kind_child_ancestry_krp7hvveq7";

CREATE INDEX CONCURRENTLY "__edge_ix_parent_ancestry_parent_kind_child_ancestry_krp7hvveq7" ON "qti"."edge" USING btree ("parent_ancestry", "parent_kind", "child_ancestry");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__html_id_ix_kind_attribute_wdlnfjpdyi";

CREATE INDEX CONCURRENTLY "__html_id_ix_kind_attribute_wdlnfjpdyi" ON "qti"."html_id" USING btree ("kind", "attribute");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__lom_language_ix_lom_value_owner_resource_443joikvtf";

CREATE INDEX CONCURRENTLY "__lom_language_ix_lom_value_owner_resource_443joikvtf" ON "qti"."lom_language" USING btree ("lom", "value") WHERE "owner" = 'resource'::"qti"."lom_owner";

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__node_ix_ancestry_kind_zxfhf2mtks";

CREATE INDEX CONCURRENTLY "__node_ix_ancestry_kind_zxfhf2mtks" ON "qti"."node" USING btree ("ancestry", "kind");
