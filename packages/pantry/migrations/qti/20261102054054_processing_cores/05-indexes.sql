-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_key_id_kind_sk6fycocte";

CREATE UNIQUE INDEX CONCURRENTLY "__expression_key_id_kind_sk6fycocte" ON "qti"."expression" USING btree ("id", "kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__operator_arity_key_kind_min_wbdijs2cgl";

CREATE UNIQUE INDEX CONCURRENTLY "__operator_arity_key_kind_min_wbdijs2cgl" ON "qti"."operator_arity" USING btree ("kind", "min");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__operator_arity_max_key_kind_max_wfwrc2fedl";

CREATE UNIQUE INDEX CONCURRENTLY "__operator_arity_max_key_kind_max_wfwrc2fedl" ON "qti"."operator_arity_max" USING btree ("kind", "max");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__declared_ref_ix_document_identifier_declaration_gk7oqzwmhi";

CREATE INDEX CONCURRENTLY "__declared_ref_ix_document_identifier_declaration_gk7oqzwmhi" ON "qti"."declared_ref" USING btree ("document", "identifier", "declaration_kind");

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__expression_ix_kind_min_rnzmnukj6j";

CREATE INDEX CONCURRENTLY "__expression_ix_kind_min_rnzmnukj6j" ON "qti"."expression" USING btree ("kind", "min");
