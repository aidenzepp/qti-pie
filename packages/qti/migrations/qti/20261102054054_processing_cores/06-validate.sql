ALTER TABLE "qti"."expression" ADD CONSTRAINT "__expression_key_id_kind_sk6fycocte" UNIQUE USING INDEX "__expression_key_id_kind_sk6fycocte";

ALTER TABLE "qti"."operator_arity" ADD CONSTRAINT "__operator_arity_key_kind_min_wbdijs2cgl" UNIQUE USING INDEX "__operator_arity_key_kind_min_wbdijs2cgl";

ALTER TABLE "qti"."operator_arity_max" ADD CONSTRAINT "__operator_arity_max_key_kind_max_wfwrc2fedl" UNIQUE USING INDEX "__operator_arity_max_key_kind_max_wfwrc2fedl";

ALTER TABLE "qti"."built_in_ref" VALIDATE CONSTRAINT "built_in_ref_kind";

ALTER TABLE "qti"."declared_ref" VALIDATE CONSTRAINT "declared_ref_kind";

ALTER TABLE "qti"."outcome_min_max" VALIDATE CONSTRAINT "outcome_min_max_kind";

ALTER TABLE "qti"."rule_operand" VALIDATE CONSTRAINT "rule_operand_kind";

ALTER TABLE "qti"."built_in_ref" VALIDATE CONSTRAINT "__built_in_ref_fk_id_referrer_kind_twy2vn4yhi";

ALTER TABLE "qti"."declared_ref" VALIDATE CONSTRAINT "__declared_ref_fk_document_identifier_declaration_6mv3afxrwr";

ALTER TABLE "qti"."declared_ref" VALIDATE CONSTRAINT "__declared_ref_fk_id_referrer_kind_ym5jvsd3mo";

ALTER TABLE "qti"."expression" ADD CONSTRAINT "__expression_fk_kind_min_tziv42ghun" FOREIGN KEY ("kind", "min") REFERENCES "qti"."operator_arity" ("kind", "min") NOT VALID;

ALTER TABLE "qti"."expression" VALIDATE CONSTRAINT "__expression_fk_kind_min_tziv42ghun";

ALTER TABLE "qti"."expression_max" ADD CONSTRAINT "__expression_max_fk_id_kind_kkbcmmc3uq" FOREIGN KEY ("id", "kind") REFERENCES "qti"."expression" ("id", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."expression_max" VALIDATE CONSTRAINT "__expression_max_fk_id_kind_kkbcmmc3uq";

ALTER TABLE "qti"."expression_max" ADD CONSTRAINT "__expression_max_fk_kind_max_uy2tdzwnk2" FOREIGN KEY ("kind", "max") REFERENCES "qti"."operator_arity_max" ("kind", "max") NOT VALID;

ALTER TABLE "qti"."expression_max" VALIDATE CONSTRAINT "__expression_max_fk_kind_max_uy2tdzwnk2";

ALTER TABLE "qti"."operand" VALIDATE CONSTRAINT "__operand_fk_child_expression_position_4gzu3ccf2u";
