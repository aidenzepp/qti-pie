ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_key_id_version_6vx4nbp4ed" UNIQUE USING INDEX "__node_key_id_version_6vx4nbp4ed";

ALTER TABLE "qti"."typed_declaration" VALIDATE CONSTRAINT "reserved_outcome_types";

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_version_xq447tijbf" FOREIGN KEY ("id", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."context_declaration_arm" VALIDATE CONSTRAINT "__context_declaration_arm_fk_id_version_xq447tijbf";

ALTER TABLE "qti"."context_declaration_id" VALIDATE CONSTRAINT "__context_declaration_id_fk_document_id_tag_holder_3ovlvjpr5t";

ALTER TABLE "qti"."html_id" VALIDATE CONSTRAINT "__html_id_fk_document_id_tag_holder_html_id_rvco_6_j_4xxrdxqzag";

ALTER TABLE "qti"."item_body_id" VALIDATE CONSTRAINT "__item_body_id_fk_document_id_tag_holder_item_body_qbqnxl7tow";

ALTER TABLE "qti"."printed_variable_id" VALIDATE CONSTRAINT "__printed_variable_id_fk_document_id_tag_holder_m4vrflia5s";

ALTER TABLE "qti"."typed_declaration" VALIDATE CONSTRAINT "__typed_declaration_fk_id_kind_wxilruvjz2";
