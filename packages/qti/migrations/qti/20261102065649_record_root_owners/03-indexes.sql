CREATE INDEX "__external_lom_ix_document_6suac5xlnl" ON "qti"."external_lom" USING btree ("document");

CREATE INDEX "__file_lom_ix_file_package_tupff3zwrm" ON "qti"."file_lom" USING btree ("file", "package");

CREATE INDEX "__file_lom_ix_metadata_file_4oyrln4yqx" ON "qti"."file_lom" USING btree ("metadata", "file");

CREATE INDEX "__outcome_document_ix_declaration_54e3jmecvg" ON "qti"."outcome_document" USING btree ("declaration");
