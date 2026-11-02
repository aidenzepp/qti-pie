ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_key_lom_package_resource_tjboenutnb" UNIQUE USING INDEX "__external_lom_key_lom_package_resource_tjboenutnb";

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_key_id_host_fyvjheokoi" UNIQUE USING INDEX "__qti_metadata_key_id_host_fyvjheokoi";

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_key_id_package_resource_p622xz2moc" UNIQUE USING INDEX "__qti_metadata_key_id_package_resource_p622xz2moc";

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_key_package_resource_dwel7fxdsx" UNIQUE USING INDEX "__qti_metadata_key_package_resource_dwel7fxdsx";

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_key_lom_package_resource_fcuxpt7bmm" UNIQUE USING INDEX "__resource_lom_key_lom_package_resource_fcuxpt7bmm";

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_key_id_resource_o7kyjomlg6" UNIQUE USING INDEX "__resource_metadata_key_id_resource_o7kyjomlg6";

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_tag_host_5nxw2e6ygd" FOREIGN KEY ("id", "__tag_host_external_lom_zuf64srpbg") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_external_lom" VALIDATE CONSTRAINT "__qti_metadata_in_external_lom_fk_id_tag_host_5nxw2e6ygd";

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_package_45ujtyda4c" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_external_lom" VALIDATE CONSTRAINT "__qti_metadata_in_external_lom_fk_id_package_45ujtyda4c";

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_lom_package_iml635ey3w" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."external_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_external_lom" VALIDATE CONSTRAINT "__qti_metadata_in_external_lom_fk_lom_package_iml635ey3w";

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_tag_host_metadata_st4rwzhkuc" FOREIGN KEY ("id", "__tag_host_metadata_knpb2q2kry") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_id_tag_host_metadata_st4rwzhkuc";

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_package_resource_wjxdq6kefq" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_id_package_resource_wjxdq6kefq";

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_metadata_resource_node_j5b44sxf4o" FOREIGN KEY ("metadata", "resource_node") REFERENCES "qti"."resource_metadata" ("id", "resource") NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_metadata" VALIDATE CONSTRAINT "__qti_metadata_in_metadata_fk_metadata_resource_node_j5b44sxf4o";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_tag_host_pymrpdifeo" FOREIGN KEY ("id", "__tag_host_resource_lom_vu3w7ocz2u") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_tag_host_pymrpdifeo";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_package_gmcsikj4sm" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_package_gmcsikj4sm";

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_lom_package_56adstemff" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" VALIDATE CONSTRAINT "__qti_metadata_in_resource_lom_fk_lom_package_56adstemff";
