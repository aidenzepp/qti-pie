ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_key_id_lom_position_o2ij2ew774" UNIQUE USING INDEX "__lom_identifier_key_id_lom_position_o2ij2ew774";

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_key_identifier_apspsz6soo" UNIQUE USING INDEX "__lom_identifier_entry_key_identifier_apspsz6soo";

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx" UNIQUE USING INDEX "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx";

ALTER TABLE "qti"."lom_identifier" VALIDATE CONSTRAINT "__lom_identifier_fk_id_parent_position_rhykptsoqt";

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_identifier_lom_position_e55vucjji4" FOREIGN KEY ("identifier", "lom", "position") REFERENCES "qti"."lom_identifier" ("id", "lom", "position") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_identifier_catalog" VALIDATE CONSTRAINT "__lom_identifier_catalog_fk_identifier_lom_position_e55vucjji4";

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_identifier_lom_position_lfmicwzfum" FOREIGN KEY ("identifier", "lom", "position") REFERENCES "qti"."lom_identifier" ("id", "lom", "position") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_identifier_entry" VALIDATE CONSTRAINT "__lom_identifier_entry_fk_identifier_lom_position_lfmicwzfum";

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_identifier_lom_position_hgxmp4e6eg" FOREIGN KEY ("identifier", "lom", "position", "collapsed") REFERENCES "qti"."lom_identifier_entry" ("identifier", "lom", "position", "collapsed") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_object_identifier" VALIDATE CONSTRAINT "__lom_object_identifier_fk_identifier_lom_position_hgxmp4e6eg";
