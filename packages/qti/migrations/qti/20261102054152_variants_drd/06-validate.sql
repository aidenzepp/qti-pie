ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_key_id_identifier_udumz3ewib" UNIQUE USING INDEX "__package_key_id_identifier_udumz3ewib";

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_key_id_package_identifier_jx53gsgn4j" UNIQUE USING INDEX "__resource_key_id_package_identifier_jx53gsgn4j";

ALTER TABLE "qti"."manifest_id_of_manifest" ADD CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj" FOREIGN KEY ("package", "id") REFERENCES "qti"."package" ("id", "identifier") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."manifest_id_of_manifest" VALIDATE CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj";

ALTER TABLE "qti"."package" VALIDATE CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc";

ALTER TABLE "qti"."resource" VALIDATE CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv";

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu" FOREIGN KEY ("resource", "package", "resource_identifier") REFERENCES "qti"."resource" ("id", "package", "identifier") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."variant" VALIDATE CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu";
