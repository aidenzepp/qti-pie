ALTER TABLE "qti"."equal_rounded" ADD CONSTRAINT "__equal_rounded_key_id_figures_kind_5daytp3gkx" UNIQUE USING INDEX "__equal_rounded_key_id_figures_kind_5daytp3gkx";

ALTER TABLE "qti"."index" ADD CONSTRAINT "__index_key_id_n_kind_azdqp2nm22" UNIQUE USING INDEX "__index_key_id_n_kind_azdqp2nm22";

ALTER TABLE "qti"."repeat" ADD CONSTRAINT "__repeat_key_id_number_repeats_kind_fgy42qpbe4" UNIQUE USING INDEX "__repeat_key_id_number_repeats_kind_fgy42qpbe4";

ALTER TABLE "qti"."round_to" ADD CONSTRAINT "__round_to_key_id_figures_kind_t7oyey7upw" UNIQUE USING INDEX "__round_to_key_id_figures_kind_t7oyey7upw";

ALTER TABLE "qti"."equal_rounded_figures_ref" ADD CONSTRAINT "__equal_rounded_figures_ref_fk_node_tag_figures_kind_43hvbtqdem" FOREIGN KEY ("node", "__tag_figures_kind_ref_zxnonbgyte") REFERENCES "qti"."equal_rounded" ("id", "figures_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."equal_rounded_figures_ref" VALIDATE CONSTRAINT "__equal_rounded_figures_ref_fk_node_tag_figures_kind_43hvbtqdem";

ALTER TABLE "qti"."index_n_ref" ADD CONSTRAINT "__index_n_ref_fk_node_tag_n_kind_ref_ffmcx_5_ok_6_w_x3vf2vhlpt" FOREIGN KEY ("node", "__tag_n_kind_ref_ffmcx5ok6w") REFERENCES "qti"."index" ("id", "n_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."index_n_ref" VALIDATE CONSTRAINT "__index_n_ref_fk_node_tag_n_kind_ref_ffmcx_5_ok_6_w_x3vf2vhlpt";

ALTER TABLE "qti"."repeat_number_repeats_ref" ADD CONSTRAINT "__repeat_number_repeats_ref_fk_node_tag_number_lemraeidse" FOREIGN KEY ("node", "__tag_number_repeats_kind_ref_juikk35ua4") REFERENCES "qti"."repeat" ("id", "number_repeats_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."repeat_number_repeats_ref" VALIDATE CONSTRAINT "__repeat_number_repeats_ref_fk_node_tag_number_lemraeidse";

ALTER TABLE "qti"."round_to_figures_ref" ADD CONSTRAINT "__round_to_figures_ref_fk_node_tag_figures_kind_ref_3zjkoitfhf" FOREIGN KEY ("node", "__tag_figures_kind_ref_r6zofyzy4o") REFERENCES "qti"."round_to" ("id", "figures_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."round_to_figures_ref" VALIDATE CONSTRAINT "__round_to_figures_ref_fk_node_tag_figures_kind_ref_3zjkoitfhf";
