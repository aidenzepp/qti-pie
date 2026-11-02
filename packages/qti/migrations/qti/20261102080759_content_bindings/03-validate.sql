ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_key_tree_adaptive_uq2v6gcy6w" UNIQUE USING INDEX "__assessment_item_key_tree_adaptive_uq2v6gcy6w";

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_key_node_cardinality_5dkui4iiaq" UNIQUE USING INDEX "__typed_binding_key_node_cardinality_5dkui4iiaq";

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "adaptive_feedback";

ALTER TABLE "qti"."gap_match_binding" ADD CONSTRAINT "__gap_match_binding_fk_node_cardinality_cnq3pufch4" FOREIGN KEY ("node", "cardinality") REFERENCES "qti"."typed_binding" ("node", "cardinality") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."gap_match_binding" VALIDATE CONSTRAINT "__gap_match_binding_fk_node_cardinality_cnq3pufch4";

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_document_adaptive_7gj3j45p4n" FOREIGN KEY ("document", "adaptive") REFERENCES "qti"."assessment_item" ("tree", "adaptive") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "__interaction_binding_fk_document_adaptive_7gj3j45p4n";

ALTER TABLE "qti"."interaction_binding" VALIDATE CONSTRAINT "__interaction_binding_fk_node_ancestry_gxhxoppump";

ALTER TABLE "qti"."record_binding" VALIDATE CONSTRAINT "__record_binding_fk_interaction_kind_lxuzwecsd5";
