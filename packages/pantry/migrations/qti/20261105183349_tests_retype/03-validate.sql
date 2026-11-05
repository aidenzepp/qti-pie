ALTER TABLE "qti"."expression_section_identifier" ADD CONSTRAINT "__expression_section_identifier_key_node_value_qn4jf744nv" UNIQUE USING INDEX "__expression_section_identifier_key_node_value_qn4jf744nv";

ALTER TABLE "qti"."section_identifier_target" ADD CONSTRAINT "__section_identifier_target_fk_node_identifier_c34vtdqsmq" FOREIGN KEY ("node", "identifier") REFERENCES "qti"."expression_section_identifier" ("node", "value") NOT VALID;

ALTER TABLE "qti"."section_identifier_target" VALIDATE CONSTRAINT "__section_identifier_target_fk_node_identifier_c34vtdqsmq";
