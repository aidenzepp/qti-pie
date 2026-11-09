ALTER TABLE "qti"."choice" ADD CONSTRAINT "__choice_key_node_kind_tid3vkbmg6" UNIQUE USING INDEX "__choice_key_node_kind_tid3vkbmg6";

ALTER TABLE "qti"."choice_interaction" ADD CONSTRAINT "__choice_interaction_key_node_interaction_lkjg3yj2vm" UNIQUE USING INDEX "__choice_interaction_key_node_interaction_lkjg3yj2vm";

ALTER TABLE "qti"."interaction" ADD CONSTRAINT "__interaction_key_node_gaps_ifbiyhopan" UNIQUE USING INDEX "__interaction_key_node_gaps_ifbiyhopan";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "double_value";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "value_domain";

ALTER TABLE "qti"."binding_cardinality" VALIDATE CONSTRAINT "binding_cardinality";

ALTER TABLE "qti"."choice_variable_name" VALIDATE CONSTRAINT "choice_identifier_key";

ALTER TABLE "qti"."declaration_identifier" VALIDATE CONSTRAINT "declaration_not_reserved";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "double_value";

ALTER TABLE "qti"."node" VALIDATE CONSTRAINT "text_domain";

ALTER TABLE "qti"."placed_binding_cardinality" VALIDATE CONSTRAINT "binding_cardinality";

ALTER TABLE "qti"."site" VALIDATE CONSTRAINT "remote_section_ref";

ALTER TABLE "qti"."binding_cardinality" ADD CONSTRAINT "__binding_cardinality_fk_node_gaps_i5bmzuqj7l" FOREIGN KEY ("node", "gaps") REFERENCES "qti"."interaction" ("node", "gaps") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."binding_cardinality" VALIDATE CONSTRAINT "__binding_cardinality_fk_node_gaps_i5bmzuqj7l";

ALTER TABLE "qti"."choice" VALIDATE CONSTRAINT "__choice_fk_node_rjik7irfe4";

ALTER TABLE "qti"."gap_interaction" ADD CONSTRAINT "__gap_interaction_fk_interaction_copy_gaps_cenkgsun2m" FOREIGN KEY ("interaction", "__copy_gaps_c4fz6tnntk") REFERENCES "qti"."interaction" ("node", "gaps") MATCH SIMPLE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."gap_interaction" VALIDATE CONSTRAINT "__gap_interaction_fk_interaction_copy_gaps_cenkgsun2m";

ALTER TABLE "qti"."gap_interaction" ADD CONSTRAINT "__gap_interaction_fk_node_interaction_gnaeijqjip" FOREIGN KEY ("node", "interaction") REFERENCES "qti"."choice_interaction" ("node", "interaction") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."gap_interaction" VALIDATE CONSTRAINT "__gap_interaction_fk_node_interaction_gnaeijqjip";

ALTER TABLE "qti"."gap_interaction" ADD CONSTRAINT "__gap_interaction_fk_node_tag_kind_qti_gap_c7iujzxnhg" FOREIGN KEY ("node", "__tag_kind_qti_gap_baeu5x2oxw") REFERENCES "qti"."choice" ("node", "kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."gap_interaction" VALIDATE CONSTRAINT "__gap_interaction_fk_node_tag_kind_qti_gap_c7iujzxnhg";

ALTER TABLE "qti"."interaction" VALIDATE CONSTRAINT "__interaction_fk_node_pred_gaps_qs54memcqv";

ALTER TABLE "qti"."placed_binding_cardinality" ADD CONSTRAINT "__placed_binding_cardinality_fk_node_gaps_qwmi5za7le" FOREIGN KEY ("node", "gaps") REFERENCES "qti"."interaction" ("node", "gaps") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."placed_binding_cardinality" VALIDATE CONSTRAINT "__placed_binding_cardinality_fk_node_gaps_qwmi5za7le";

ALTER TABLE "qti"."site" VALIDATE CONSTRAINT "__site_fk_node_onholp6yx7";
