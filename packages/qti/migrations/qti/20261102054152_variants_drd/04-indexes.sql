CREATE UNIQUE INDEX "__access_for_all_resource_key_metadata_ltyeuwg5av" ON "qti"."access_for_all_resource" USING btree ("metadata");

CREATE UNIQUE INDEX "__variant_metadata_key_variant_ythetc2gkq" ON "qti"."variant_metadata" USING btree ("variant");

CREATE INDEX "__drd_access_mode_ix_owner_nafahrej5h" ON "qti"."drd_access_mode" USING btree ("owner");

CREATE INDEX "__drd_access_mode_adapted_ix_owner_i27o64enej" ON "qti"."drd_access_mode_adapted" USING btree ("owner");

CREATE INDEX "__drd_adaptation_detail_ix_owner_36p5ul4zxq" ON "qti"."drd_adaptation_detail" USING btree ("owner");

CREATE INDEX "__drd_adaptation_media_type_ix_owner_jfqysxuqek" ON "qti"."drd_adaptation_media_type" USING btree ("owner");

CREATE INDEX "__drd_adaptation_type_ix_owner_p5qnadkbqx" ON "qti"."drd_adaptation_type" USING btree ("owner");

CREATE INDEX "__drd_api_interoperable_ix_owner_ydwgzfpay4" ON "qti"."drd_api_interoperable" USING btree ("owner");

CREATE INDEX "__drd_control_flexibility_ix_owner_aytmj32cw5" ON "qti"."drd_control_flexibility" USING btree ("owner");

CREATE INDEX "__drd_display_transformability_ix_owner_xuwg6wzl2h" ON "qti"."drd_display_transformability" USING btree ("owner");

CREATE INDEX "__drd_educational_level_of_adaptation_ix_owner_l2degszvbf" ON "qti"."drd_educational_level_of_adaptation" USING btree ("owner");

CREATE INDEX "__drd_has_adaptation_ix_owner_z7aoreiwl4" ON "qti"."drd_has_adaptation" USING btree ("owner");

CREATE INDEX "__drd_hazard_ix_owner_k6ix5wgkdh" ON "qti"."drd_hazard" USING btree ("owner");

CREATE INDEX "__drd_is_adaptation_of_ix_owner_5ulfafssre" ON "qti"."drd_is_adaptation_of" USING btree ("owner");

CREATE INDEX "__drd_is_full_adaptation_of_ix_owner_2z6xfb26ad" ON "qti"."drd_is_full_adaptation_of" USING btree ("owner");

CREATE INDEX "__drd_is_partial_adaptation_of_ix_owner_vy2fsymohn" ON "qti"."drd_is_partial_adaptation_of" USING btree ("owner");

CREATE INDEX "__drd_language_of_adaptation_ix_owner_7kx4y32tgl" ON "qti"."drd_language_of_adaptation" USING btree ("owner");

CREATE INDEX "__variant_ix_package_identifierref_cgd3uzvweq" ON "qti"."variant" USING btree ("package", "identifierref");

CREATE INDEX "__variant_ix_resource_package_resource_identifier_3mcke6ybyd" ON "qti"."variant" USING btree ("resource", "package", "resource_identifier");
