ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_key_node_xtyjppptnf" UNIQUE USING INDEX "__attribute_key_node_xtyjppptnf";

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_key_node_lexical_4z3dmo5v37" UNIQUE USING INDEX "__dependency_key_node_lexical_4z3dmo5v37";

ALTER TABLE "qti"."manifest_id" ADD CONSTRAINT "__manifest_id_key_node_lexical_f6fcfc24vi" UNIQUE USING INDEX "__manifest_id_key_node_lexical_f6fcfc24vi";

ALTER TABLE "qti"."resource_id" ADD CONSTRAINT "__resource_id_key_node_lexical_hd5iwhn37m" UNIQUE USING INDEX "__resource_id_key_node_lexical_hd5iwhn37m";

ALTER TABLE "qti"."dependency" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."manifest_id" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."resource_id" VALIDATE CONSTRAINT "e_1_derived";

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_26vuh4u2kk";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_fk_node_lexical_r2xdxyora2" FOREIGN KEY ("__node_ienld3knlc", "__lexical_t2ltxeu7yz") REFERENCES "qti"."dependency" ("node", "lexical") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_r2xdxyora2";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_fk_node_lexical_ujbnucfaka" FOREIGN KEY ("__node_y6hua4msde", "__lexical_2rg63xmlgw") REFERENCES "qti"."manifest_id" ("node", "lexical") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_ujbnucfaka";

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_fk_node_lexical_jygi642c57" FOREIGN KEY ("__node_du2ephtoz3", "__lexical_ki37d34yx7") REFERENCES "qti"."resource_id" ("node", "lexical") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."attribute" VALIDATE CONSTRAINT "__attribute_fk_node_lexical_jygi642c57";
