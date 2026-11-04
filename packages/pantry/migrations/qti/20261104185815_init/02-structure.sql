CREATE TABLE "qti"."a" (
  "href" "qti"."hyperlink_uri" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__a_pk_lfg4c2sp42" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."a_type" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."content_media_type" NOT NULL,
  CONSTRAINT "__a_type_pk_iqwmrqx6na" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."abbr" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__abbr_pk_r7nedg3rrq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."access_for_all_resource" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__access_for_all_resource_pk_kr5wpjf4ev" PRIMARY KEY ("id"),
  CONSTRAINT "__access_for_all_resource_key_metadata_eocm4jdfj5" UNIQUE ("metadata")
);

CREATE TABLE "qti"."acronym" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__acronym_pk_lhlrt2mjg5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."address" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__address_pk_qq6oupzxag" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."admission" (
  "child" "qti"."node_kind" NOT NULL,
  "parent" "qti"."node_kind" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__admission_pk_5vjazwledx" PRIMARY KEY ("version", "parent", "child")
);

CREATE TABLE "qti"."ancestry_step" (
  "ancestry" "qti"."ancestry" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "next" "qti"."ancestry" NOT NULL,
  CONSTRAINT "__ancestry_step_pk_dn3hkkd6ij" PRIMARY KEY ("ancestry", "kind"),
  CONSTRAINT "__ancestry_step_key_ancestry_kind_next_oij7jw4whi" UNIQUE ("ancestry", "kind", "next")
);

CREATE TABLE "qti"."and" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__and_pk_lce55mvyir" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."any_n" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max" "qti"."expression_integer_or_variable" NOT NULL,
  "min" "qti"."expression_integer_or_variable" NOT NULL,
  CONSTRAINT "__any_n_pk_quebk2zfhq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."area_map_entry" (
  "area_mapping" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "mapped_value" "qti"."mapping_score" NOT NULL,
  "position" bigint NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  CONSTRAINT "__area_map_entry_pk_k7yntsfltr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."area_mapping" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "default_value" "qti"."mapping_score" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__area_mapping_pk_5ntlzf6y73" PRIMARY KEY ("id"),
  CONSTRAINT "__area_mapping_key_declaration_vogb53l5ke" UNIQUE ("declaration")
);

CREATE TABLE "qti"."area_mapping_lower_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mapping_score" NOT NULL,
  CONSTRAINT "__area_mapping_lower_bound_pk_k35cvvbwvx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."area_mapping_upper_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mapping_score" NOT NULL,
  CONSTRAINT "__area_mapping_upper_bound_pk_5ibp7h5p5p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."aria_activedescendant" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."id_reference" NOT NULL,
  CONSTRAINT "__aria_activedescendant_pk_dgvl276ics" PRIMARY KEY ("node"),
  CONSTRAINT "aria_activedescendant_attribute" CHECK (("attribute" = 'aria-activedescendant'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_atomic" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_atomic_pk_zra45fne37" PRIMARY KEY ("node"),
  CONSTRAINT "aria_atomic_attribute" CHECK (("attribute" = 'aria-atomic'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_autocomplete" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_autocomplete_value" NOT NULL,
  CONSTRAINT "__aria_autocomplete_pk_io5khqs24e" PRIMARY KEY ("node"),
  CONSTRAINT "aria_autocomplete_attribute" CHECK (("attribute" = 'aria-autocomplete'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_busy" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_busy_pk_x535cdzgvw" PRIMARY KEY ("node"),
  CONSTRAINT "aria_busy_attribute" CHECK (("attribute" = 'aria-busy'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_checked" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_tristate" NOT NULL,
  CONSTRAINT "__aria_checked_pk_ormiljzy5i" PRIMARY KEY ("node"),
  CONSTRAINT "aria_checked_attribute" CHECK (("attribute" = 'aria-checked'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_colcount" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_integer" NOT NULL,
  CONSTRAINT "__aria_colcount_pk_fuegp276vy" PRIMARY KEY ("node"),
  CONSTRAINT "aria_colcount_attribute" CHECK (("attribute" = 'aria-colcount'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_colindex" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_integer" NOT NULL,
  CONSTRAINT "__aria_colindex_pk_4n6wg2rqfi" PRIMARY KEY ("node"),
  CONSTRAINT "aria_colindex_attribute" CHECK (("attribute" = 'aria-colindex'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_colspan" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_integer" NOT NULL,
  CONSTRAINT "__aria_colspan_pk_3acfgqy7hc" PRIMARY KEY ("node"),
  CONSTRAINT "aria_colspan_attribute" CHECK (("attribute" = 'aria-colspan'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_controls" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_controls_pk_omxk6upyo6" PRIMARY KEY ("node"),
  CONSTRAINT "aria_controls_attribute" CHECK (("attribute" = 'aria-controls'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_current" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_current_value" NOT NULL,
  CONSTRAINT "__aria_current_pk_iitvxrfs7v" PRIMARY KEY ("node"),
  CONSTRAINT "aria_current_attribute" CHECK (("attribute" = 'aria-current'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_describedby" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_describedby_pk_mra26scdr4" PRIMARY KEY ("node"),
  CONSTRAINT "aria_describedby_attribute" CHECK (("attribute" = 'aria-describedby'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_details" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."id_reference" NOT NULL,
  CONSTRAINT "__aria_details_pk_nomndkae4i" PRIMARY KEY ("node"),
  CONSTRAINT "aria_details_attribute" CHECK (("attribute" = 'aria-details'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_disabled" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_disabled_pk_tj4vwoqb2l" PRIMARY KEY ("node"),
  CONSTRAINT "aria_disabled_attribute" CHECK (("attribute" = 'aria-disabled'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_errormessage" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."id_reference" NOT NULL,
  CONSTRAINT "__aria_errormessage_pk_ydysodujj3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_errormessage_attribute" CHECK (("attribute" = 'aria-errormessage'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_expanded" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_true_false_undefined" NOT NULL,
  CONSTRAINT "__aria_expanded_pk_cdvp2uzfxs" PRIMARY KEY ("node"),
  CONSTRAINT "aria_expanded_attribute" CHECK (("attribute" = 'aria-expanded'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_flowto" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_flowto_pk_r6ksuaf2pw" PRIMARY KEY ("node"),
  CONSTRAINT "aria_flowto_attribute" CHECK (("attribute" = 'aria-flowto'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_haspopup" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_haspopup_pk_uxv4eoa6gq" PRIMARY KEY ("node"),
  CONSTRAINT "aria_haspopup_attribute" CHECK (("attribute" = 'aria-haspopup'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_hidden" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_hidden_pk_ko3wcsn3z2" PRIMARY KEY ("node"),
  CONSTRAINT "aria_hidden_attribute" CHECK (("attribute" = 'aria-hidden'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_invalid" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_invalid_value" NOT NULL,
  CONSTRAINT "__aria_invalid_pk_q5nega572h" PRIMARY KEY ("node"),
  CONSTRAINT "aria_invalid_attribute" CHECK (("attribute" = 'aria-invalid'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_keyshortcuts" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_keyshortcuts_pk_zrpommjxnx" PRIMARY KEY ("node"),
  CONSTRAINT "aria_keyshortcuts_attribute" CHECK (("attribute" = 'aria-keyshortcuts'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_keyshorts" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_keyshorts_pk_lbhzg36hsx" PRIMARY KEY ("node"),
  CONSTRAINT "aria_keyshorts_attribute" CHECK (("attribute" = 'aria-keyshorts'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_label" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_label_pk_ltzyptfie4" PRIMARY KEY ("node"),
  CONSTRAINT "aria_label_attribute" CHECK (("attribute" = 'aria-label'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_labelledby" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_labelledby_pk_pvgzlokbe5" PRIMARY KEY ("node"),
  CONSTRAINT "aria_labelledby_attribute" CHECK (("attribute" = 'aria-labelledby'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_level" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_positive_integer" NOT NULL,
  CONSTRAINT "__aria_level_pk_s4y3tfhzuh" PRIMARY KEY ("node"),
  CONSTRAINT "aria_level_attribute" CHECK (("attribute" = 'aria-level'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_live" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_live_value" NOT NULL,
  CONSTRAINT "__aria_live_pk_7uy6sif62w" PRIMARY KEY ("node"),
  CONSTRAINT "aria_live_attribute" CHECK (("attribute" = 'aria-live'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_modal" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_modal_pk_lkrdh5w4tk" PRIMARY KEY ("node"),
  CONSTRAINT "aria_modal_attribute" CHECK (("attribute" = 'aria-modal'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_multiline" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_multiline_pk_svzywriv5w" PRIMARY KEY ("node"),
  CONSTRAINT "aria_multiline_attribute" CHECK (("attribute" = 'aria-multiline'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_multiselectable" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_multiselectable_pk_dmu6w3xdm5" PRIMARY KEY ("node"),
  CONSTRAINT "aria_multiselectable_attribute" CHECK (("attribute" = 'aria-multiselectable'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_orientation" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_orientation_value" NOT NULL,
  CONSTRAINT "__aria_orientation_pk_s7fxv5bpy5" PRIMARY KEY ("node"),
  CONSTRAINT "aria_orientation_attribute" CHECK (("attribute" = 'aria-orientation'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_owns" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_owns_pk_bcuuoeksr3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_owns_attribute" CHECK (("attribute" = 'aria-owns'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_placeholder" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_placeholder_pk_glj4pyfuv2" PRIMARY KEY ("node"),
  CONSTRAINT "aria_placeholder_attribute" CHECK (("attribute" = 'aria-placeholder'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_posinset" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_positive_integer" NOT NULL,
  CONSTRAINT "__aria_posinset_pk_btgt6c42wd" PRIMARY KEY ("node"),
  CONSTRAINT "aria_posinset_attribute" CHECK (("attribute" = 'aria-posinset'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_pressed" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_tristate" NOT NULL,
  CONSTRAINT "__aria_pressed_pk_6v3fhabpq3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_pressed_attribute" CHECK (("attribute" = 'aria-pressed'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_readonly" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_readonly_pk_rhlczb3n3l" PRIMARY KEY ("node"),
  CONSTRAINT "aria_readonly_attribute" CHECK (("attribute" = 'aria-readonly'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_relevant" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_saolosnhkp" NOT NULL,
  CONSTRAINT "__aria_relevant_pk_yjcn7uhdcg" PRIMARY KEY ("node"),
  CONSTRAINT "aria_relevant_attribute" CHECK (("attribute" = 'aria-relevant'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_required" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__aria_required_pk_ah5s6lqmx7" PRIMARY KEY ("node"),
  CONSTRAINT "aria_required_attribute" CHECK (("attribute" = 'aria-required'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_role" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_role_value" NOT NULL,
  CONSTRAINT "__aria_role_pk_pxdikk54jm" PRIMARY KEY ("node"),
  CONSTRAINT "aria_role_attribute" CHECK (("attribute" = 'role'::"qti"."attribute_name") IS TRUE),
  CONSTRAINT "aria_role_h_1" CHECK (("value" IN ('heading'::"qti"."aria_role_value", 'tab'::"qti"."aria_role_value", 'presentation'::"qti"."aria_role_value") OR "kind" <> 'h1'::"qti"."node_kind") IS TRUE),
  CONSTRAINT "aria_role_not_source" CHECK (("kind" <> 'source'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."aria_roledescription" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_roledescription_pk_l734vcmgp3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_roledescription_attribute" CHECK (("attribute" = 'aria-roledescription'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_rowcount" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_integer" NOT NULL,
  CONSTRAINT "__aria_rowcount_pk_qoec2qzljq" PRIMARY KEY ("node"),
  CONSTRAINT "aria_rowcount_attribute" CHECK (("attribute" = 'aria-rowcount'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_rowindex" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_integer" NOT NULL,
  CONSTRAINT "__aria_rowindex_pk_n5gvluwjz7" PRIMARY KEY ("node"),
  CONSTRAINT "aria_rowindex_attribute" CHECK (("attribute" = 'aria-rowindex'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_rowspan" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_integer" NOT NULL,
  CONSTRAINT "__aria_rowspan_pk_kko2gufryf" PRIMARY KEY ("node"),
  CONSTRAINT "aria_rowspan_attribute" CHECK (("attribute" = 'aria-rowspan'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_selected" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_true_false_undefined" NOT NULL,
  CONSTRAINT "__aria_selected_pk_5hcbwbanao" PRIMARY KEY ("node"),
  CONSTRAINT "aria_selected_attribute" CHECK (("attribute" = 'aria-selected'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_setsize" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_integer" NOT NULL,
  CONSTRAINT "__aria_setsize_pk_w5q72eekou" PRIMARY KEY ("node"),
  CONSTRAINT "aria_setsize_attribute" CHECK (("attribute" = 'aria-setsize'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_sort" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."aria_sort_value" NOT NULL,
  CONSTRAINT "__aria_sort_pk_mtze6beddy" PRIMARY KEY ("node"),
  CONSTRAINT "aria_sort_attribute" CHECK (("attribute" = 'aria-sort'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuemax" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_fgbxwprcwx" NOT NULL,
  CONSTRAINT "__aria_valuemax_pk_fuvhhtxhhd" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuemax_attribute" CHECK (("attribute" = 'aria-valuemax'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuemin" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_fgbxwprcwx" NOT NULL,
  CONSTRAINT "__aria_valuemin_pk_gcsdfao6ll" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuemin_attribute" CHECK (("attribute" = 'aria-valuemin'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuenow" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_fgbxwprcwx" NOT NULL,
  CONSTRAINT "__aria_valuenow_pk_fbdvxecqpz" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuenow_attribute" CHECK (("attribute" = 'aria-valuenow'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuetext" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_valuetext_pk_72kxmz7pe2" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuetext_attribute" CHECK (("attribute" = 'aria-valuetext'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."article" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__article_pk_3etfz7zemf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."aside" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__aside_pk_5dxnxm5kux" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."assessment_item" (
  "adaptive" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "time_dependent" "qti"."xs_boolean" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__assessment_item_pk_5svyn5edkt" PRIMARY KEY ("id"),
  CONSTRAINT "__assessment_item_key_tree_y2u4xlyz4l" UNIQUE ("tree"),
  CONSTRAINT "__assessment_item_key_tree_adaptive_uq2v6gcy6w" UNIQUE ("tree", "adaptive")
);

CREATE TABLE "qti"."assessment_item_label" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__assessment_item_label_pk_vqcepo52hu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."associable_hotspot" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__associable_hotspot_pk_oqmxwv2qg7" PRIMARY KEY ("id"),
  CONSTRAINT "__associable_hotspot_key_interaction_identifier_t2m7xj76o6" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "associable_hotspot_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE),
  CONSTRAINT "no_default_hotspot_in_graphic_gap_match" CHECK (("parent_kind" <> 'qti-graphic-gap-match-interaction'::"qti"."node_kind" OR "shape" <> 'default'::"qti"."shape") IS TRUE)
);

CREATE TABLE "qti"."associable_hotspot_label" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__associable_hotspot_label_pk_y6ze6aolox" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."associable_hotspot_match_min" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__associable_hotspot_match_min_pk_fk3v5ypkng" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."associate_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__associate_interaction_pk_yxo2ez6yi2" PRIMARY KEY ("id"),
  CONSTRAINT "associate_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."attribute_admission" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__attribute_admission_pk_dkxlgipfli" PRIMARY KEY ("kind", "attribute")
);

CREATE TABLE "qti"."attribute_entity_reference" (
  "attribute" "qti"."__text_raisrajgpi" NOT NULL,
  "name" "qti"."xml_entity_name" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "offset" bigint NOT NULL,
  CONSTRAINT "__attribute_entity_reference_pk_pnly3xqwxa" PRIMARY KEY ("node", "attribute", "offset")
);

CREATE TABLE "qti"."attribute_idref" (
  "attribute" "qti"."idref_attribute" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "target" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__attribute_idref_pk_5i22dta3dq" PRIMARY KEY ("node", "attribute", "position"),
  CONSTRAINT "__attribute_idref_key_node_attribute_position_target_tdya7c65ru" UNIQUE ("node", "attribute", "position", "target")
);

CREATE TABLE "qti"."attribute_lexical" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_kqeswaav46" NOT NULL,
  CONSTRAINT "__attribute_lexical_pk_qi53b27egd" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."attribute_spelling" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_hv3bw3mdte" NOT NULL,
  CONSTRAINT "__attribute_spelling_pk_rzetxaxqwt" PRIMARY KEY ("node", "attribute")
);

CREATE TABLE "qti"."audio" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_pk_qlkyzdwqgr" PRIMARY KEY ("id"),
  CONSTRAINT "__audio_key_id_version_wt7jftsw5l" UNIQUE ("id", "version")
);

CREATE TABLE "qti"."audio_autoplay" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_autoplay" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_autoplay_pk_o2pwkyo3fs" PRIMARY KEY ("node"),
  CONSTRAINT "audio_autoplay_by_version" CHECK ((("value" IN ('true'::"qti"."media_autoplay", 'false'::"qti"."media_autoplay", '1'::"qti"."media_autoplay", '0'::"qti"."media_autoplay") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_autoplay", 'false'::"qti"."media_autoplay", 'autoplay'::"qti"."media_autoplay") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_controls" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_controls" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_controls_pk_hbxi3bgbvy" PRIMARY KEY ("node"),
  CONSTRAINT "audio_controls_by_version" CHECK ((("value" IN ('true'::"qti"."media_controls", 'false'::"qti"."media_controls", '1'::"qti"."media_controls", '0'::"qti"."media_controls") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_controls", 'false'::"qti"."media_controls", 'controls'::"qti"."media_controls") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_crossorigin" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cross_origin" NOT NULL,
  CONSTRAINT "__audio_crossorigin_pk_dnvh2ysnga" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."audio_loop" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_loop" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_loop_pk_6ysuhkulw7" PRIMARY KEY ("node"),
  CONSTRAINT "audio_loop_by_version" CHECK ((("value" IN ('true'::"qti"."media_loop", 'false'::"qti"."media_loop", '1'::"qti"."media_loop", '0'::"qti"."media_loop") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_loop", 'false'::"qti"."media_loop", 'loop'::"qti"."media_loop") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_mediagroup" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__audio_mediagroup_pk_de2l7zrr3p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."audio_muted" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_muted" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_muted_pk_nbjhlyft5o" PRIMARY KEY ("node"),
  CONSTRAINT "audio_muted_by_version" CHECK ((("value" IN ('true'::"qti"."media_muted", 'false'::"qti"."media_muted", '1'::"qti"."media_muted", '0'::"qti"."media_muted") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_muted", 'false'::"qti"."media_muted", 'muted'::"qti"."media_muted") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_preload" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_preload" NOT NULL,
  CONSTRAINT "__audio_preload_pk_6qwvgzz35c" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."audio_src" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__audio_src_pk_h27xitako6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."b" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__b_pk_zbmxagffkg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."bdi" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__bdi_pk_gsfpg7yvxr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."bdo" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__bdo_pk_mxfajtogju" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."bdo_title" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__bdo_title_pk_hrq6p4ut42" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."big" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__big_pk_sxjbd6ilzz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."binding_fit" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "interaction_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__binding_fit_pk_zlfybq6q3o" PRIMARY KEY ("interaction_kind", "base_type", "cardinality")
);

CREATE TABLE "qti"."blockquote" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__blockquote_pk_6kfmadmsqt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."blockquote_cite" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."citation_uri" NOT NULL,
  CONSTRAINT "__blockquote_cite_pk_rth3urhdf5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."br" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__br_pk_cgia6yjeyu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."built_in_ref" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "name" "qti"."built_in" NOT NULL,
  "referrer_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__built_in_ref_pk_efu5zp7bth" PRIMARY KEY ("id"),
  CONSTRAINT "built_in_ref_kind" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind") OR "name" = 'completionStatus'::"qti"."built_in" AND "referrer_kind" = 'qti-set-outcome-value'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."caption" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__caption_pk_l2gkvn4umb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."catalog_info" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__catalog_info_pk_2hbdzkghfb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."categorized_statistic_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__categorized_statistic_arm_pk_h7q3aym2ry" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."choice_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "orientation" "qti"."orientation" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__choice_interaction_pk_dxmiqmyvgh" PRIMARY KEY ("id"),
  CONSTRAINT "choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."choice_interaction_max_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__choice_interaction_max_selections_message_pk_tlfjnpqllf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."choice_interaction_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__choice_interaction_min_selections_message_pk_buoctmpill" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."choice_template_ref" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__choice_template_ref_pk_zclve6idbx" PRIMARY KEY ("node"),
  CONSTRAINT "choice_template_ref_type" CHECK (("cardinality" IN ('single'::"qti"."typed_cardinality", 'multiple'::"qti"."typed_cardinality") AND "base_type" = 'identifier'::"qti"."base_type") IS TRUE)
);

CREATE TABLE "qti"."cite" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__cite_pk_l46lgeg2sc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."code" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__code_pk_uiuyavt5xu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."col" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__col_pk_z73pp4xtka" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."col_span" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."table_span" NOT NULL,
  CONSTRAINT "__col_span_pk_xn6ba35f4t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."colgroup" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__colgroup_pk_5bdtkcddxv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."colgroup_span" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."table_span" NOT NULL,
  CONSTRAINT "__colgroup_span_pk_b4khfvwhx4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."comment" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "text" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__comment_pk_zalmloung6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."companion_materials_info" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__companion_materials_info_pk_5b76orjcsv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."container_size" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__container_size_pk_xrmvgf377a" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."contains" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__contains_pk_g5zczg6nw5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_feedback" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__content_body_feedback_pk_brwieqgroc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_modal" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__content_body_modal_pk_edtvfe22z4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_rubric" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__content_body_rubric_pk_3ulqq3vzcl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_rubric_template" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__content_body_rubric_template_pk_wefvrqanrh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_template" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__content_body_template_pk_b4kzg7bvsu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."context_declaration_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__context_declaration_arm_pk_4w56ikkwxc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."context_declaration_id" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__context_declaration_id_pk_mgpu5tsgi5" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__context_declaration_id_key_node_6wysjljein" UNIQUE ("node")
);

CREATE TABLE "qti"."coords" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "owner_kind" "qti"."node_kind" NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  "value" "qti"."shape_coords" NOT NULL,
  CONSTRAINT "__coords_pk_zrwwpteuvx" PRIMARY KEY ("node"),
  CONSTRAINT "__coords_key_node_shape_byo4n5vec6" UNIQUE ("node", "shape")
);

CREATE TABLE "qti"."coords_circle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_bvx3fqniye" NOT NULL,
  CONSTRAINT "__coords_circle_pk_h6icghlpxt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_default" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."shape_coords" NOT NULL,
  CONSTRAINT "__coords_default_pk_r5uouuzmh2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_ellipse" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."rect_coords" NOT NULL,
  CONSTRAINT "__coords_ellipse_pk_si4ual7i3q" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_poly" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_gm4clqaaza" NOT NULL,
  CONSTRAINT "__coords_poly_pk_ki4e2cqz3y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_rect" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."rect_coords" NOT NULL,
  CONSTRAINT "__coords_rect_pk_rbgmyuf5ut" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."correct" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__correct_pk_5p7ahf4znz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."correct_response_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__correct_response_arm_pk_wusr6prctw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_case_item_uri" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "labelled_guid" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."case_item_uri" NOT NULL,
  CONSTRAINT "__csm_case_item_uri_pk_r33uv2vnpu" PRIMARY KEY ("id"),
  CONSTRAINT "__csm_case_item_uri_key_labelled_guid_oc7lijtbnj" UNIQUE ("labelled_guid")
);

CREATE TABLE "qti"."csm_guid" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "labelled_guid" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_guid_pk_tntqoz5kks" PRIMARY KEY ("id"),
  CONSTRAINT "__csm_guid_key_labelled_guid_au6oxmpret" UNIQUE ("labelled_guid")
);

CREATE TABLE "qti"."csm_label" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "labelled_guid" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_label_pk_cbfqww2dti" PRIMARY KEY ("id"),
  CONSTRAINT "__csm_label_key_labelled_guid_nxm46w3naf" UNIQUE ("labelled_guid")
);

CREATE TABLE "qti"."csm_labelled_guid" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "set_of_guids" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__csm_labelled_guid_pk_4vbzo6kpar" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_metadata" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "set" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__csm_metadata_pk_fmjai3sx4g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_metadata_provider_id" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_metadata_provider_id_pk_wzmprxwdsd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set" (
  "host" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__csm_set_pk_4i6g33ufcr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_set_of_guids" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__csm_set_of_guids_pk_b2mr24fnze" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."csm_set_of_guids_region" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_of_guids_region_pk_atzpym3yi7" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set_of_guids_version" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_of_guids_version_pk_bkjdrvyale" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set_resource_label" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_resource_label_pk_vncnpqfiee" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."csm_set_resource_part_id" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__csm_set_resource_part_id_pk_3gup3c6juq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."custom_operator" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__custom_operator_pk_gls44jz4e7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."custom_operator_class" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."custom_operator_class_name" NOT NULL,
  CONSTRAINT "__custom_operator_class_pk_j72263baud" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."custom_operator_definition" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."custom_operator_definition_uri" NOT NULL,
  CONSTRAINT "__custom_operator_definition_pk_kgofkkpsq2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."dd" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__dd_pk_57rz2lepxy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declaration" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  CONSTRAINT "__declaration_pk_kfs3bogieg" PRIMARY KEY ("id"),
  CONSTRAINT "__declaration_key_document_identifier_nhssflcoha" UNIQUE ("document", "identifier"),
  CONSTRAINT "declaration_not_reserved" CHECK ((NOT "identifier" IN ('completionStatus'::"pg_catalog"."text", 'numAttempts'::"pg_catalog"."text", 'duration'::"pg_catalog"."text")) IS TRUE),
  CONSTRAINT "__declaration_key_id_document_identifier_q47zggzoeq" UNIQUE ("id", "document", "identifier"),
  CONSTRAINT "__declaration_key_id_shape_mu2s257vd4" UNIQUE ("id", "shape"),
  CONSTRAINT "__declaration_key_id_kind_dpb6dzt55d" UNIQUE ("id", "kind"),
  CONSTRAINT "__declaration_key_document_identifier_kind_6qqc7ch76r" UNIQUE ("document", "identifier", "kind"),
  CONSTRAINT "__declaration_key_document_identifier_shape_lzyberz5rq" UNIQUE ("document", "identifier", "shape"),
  CONSTRAINT "__declaration_key_id_document_identifier_kind_mvchic7xpf" UNIQUE ("id", "document", "identifier", "kind")
);

CREATE TABLE "qti"."declaration_external_scored" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."external_scored" NOT NULL,
  CONSTRAINT "__declaration_external_scored_pk_iucwsc25qw" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_interpretation" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__declaration_interpretation_pk_jzan4e33hu" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_long_interpretation" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."long_interpretation_uri" NOT NULL,
  CONSTRAINT "__declaration_long_interpretation_pk_gsj2qzn5ta" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_mastery_value" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."outcome_scale_value" NOT NULL,
  CONSTRAINT "__declaration_mastery_value_pk_c3ablixaqt" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_normal_maximum" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_acxfo763jg" NOT NULL,
  CONSTRAINT "__declaration_normal_maximum_pk_ae4pqmamf6" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_normal_minimum" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."outcome_scale_value" NOT NULL,
  CONSTRAINT "__declaration_normal_minimum_pk_ktd2c3st7m" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_variable_identifier_ref" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__declaration_variable_identifier_ref_pk_6lwgamxhdv" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declaration_view" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_5lyuoloiou" NOT NULL,
  CONSTRAINT "__declaration_view_pk_6zxyzofraw" PRIMARY KEY ("declaration")
);

CREATE TABLE "qti"."declared_adaptive" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_adaptive_pk_peor3rnexn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_area_mapping_default_value" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_area_mapping_default_value_pk_w2oayrb4x4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associable_hotspot_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_associable_hotspot_show_hide_pk_lv5px2ljkx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associate_max_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_associate_max_associations_pk_idmdia2h4w" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associate_min_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_associate_min_associations_pk_sifeg35ari" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associate_shuffle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_associate_shuffle_pk_gudss4f3bs" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_default_value" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_default_value_pk_eaeooi7rfq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_extended_text_base" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_extended_text_base_pk_mw26lik4ug" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_extended_text_format" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_extended_text_format_pk_ervgiyl27g" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_extended_text_min_strings" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_extended_text_min_strings_pk_qcwhp2tw37" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_feedback_block_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_feedback_block_show_hide_pk_ojufccao7d" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_feedback_inline_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_feedback_inline_show_hide_pk_n3vvswfkwh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_fixed" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_fixed_pk_p223qdk6qz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_img_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_gap_img_show_hide_pk_rnyjq43x4l" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_match_max_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_gap_match_max_associations_pk_e72xwi4wwf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_match_shuffle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_gap_match_shuffle_pk_l23u6n6elv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_required" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_gap_required_pk_mkysoal6ph" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_gap_show_hide_pk_7ijnzmslzd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_text_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_gap_text_show_hide_pk_iglqx3fd3k" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_graphic_associate_max_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_graphic_associate_max_associations_pk_rn2dath4dc" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_graphic_gap_match_max_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_graphic_gap_match_max_associations_pk_uxpvm3ugdw" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hotspot_choice_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_hotspot_choice_show_hide_pk_hds765eicl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hotspot_max_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_hotspot_max_choices_pk_hsygzd53z4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hotspot_min_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_hotspot_min_choices_pk_xgc4tkxpm4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hottext_max_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_hottext_max_choices_pk_u45t2bnusc" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hottext_min_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_hottext_min_choices_pk_ejzkqwu63y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hottext_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_hottext_show_hide_pk_3zlccbyr75" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_include_boundary" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_include_boundary_pk_tu5lrfjuxh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_include_lower_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_include_lower_bound_pk_u5oritomi4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_include_upper_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_include_upper_bound_pk_6rx7uubshf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_fixed" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_inline_choice_fixed_pk_btbzrajbvy" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_min_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_inline_choice_min_choices_pk_nkujpoh6bn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_required" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_inline_choice_required_pk_mgayqbinqm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_inline_choice_show_hide_pk_djhoznfi2b" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_shuffle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_inline_choice_shuffle_pk_55ryelvcki" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_map_entry_case_sensitive" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_map_entry_case_sensitive_pk_xa2r73zpeo" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_mapping_default_value" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_mapping_default_value_pk_46yyn7x6np" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_match_max_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_match_max_associations_pk_uls4swz7xx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_match_min_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_match_min_associations_pk_wayciectww" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_match_shuffle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_match_shuffle_pk_lfdnb4p74t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_math_variable" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_math_variable_pk_v4jg5r25qv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_max_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_max_choices_pk_kqpg3t3hvl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_media_loop" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_media_loop_pk_h2mc5lz3hb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_min_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_min_choices_pk_wjom3ecba4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_order_shuffle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_order_shuffle_pk_k3oqlqq4qv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_orientation" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_orientation_pk_idge7x3tju" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_param_variable" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_param_variable_pk_wlbpejkruf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_position_object_max_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_position_object_max_choices_pk_k4f53wmhew" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_base" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_printed_variable_base_pk_dsofrz72ix" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_delimiter" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_printed_variable_delimiter_pk_hpwmipg5ee" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_mapping_indicator" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_printed_variable_mapping_indicator_pk_twg3b5ng4r" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_power_form" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_printed_variable_power_form_pk_dmvya2a4bz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_ref" (
  "declaration_kind" "qti"."declaration_kind" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "referrer_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__declared_ref_pk_uif5t6o33f" PRIMARY KEY ("id"),
  CONSTRAINT "declared_ref_kind" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind") OR "declaration_kind" IN ('response'::"qti"."declaration_kind", 'outcome'::"qti"."declaration_kind") AND "referrer_kind" = 'qti-set-default-value'::"qti"."node_kind" OR "referrer_kind" IN ('qti-correct'::"qti"."node_kind", 'qti-map-response'::"qti"."node_kind", 'qti-map-response-point'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind") AND "declaration_kind" = 'response'::"qti"."declaration_kind" OR "referrer_kind" IN ('qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind") AND "declaration_kind" = 'outcome'::"qti"."declaration_kind" OR "declaration_kind" = 'template'::"qti"."declaration_kind" AND "referrer_kind" = 'qti-set-template-value'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."declared_rounding_mode" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_rounding_mode_pk_23tqco34ok" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_rubric_template_block_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_rubric_template_block_show_hide_pk_tqinnfq34p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_rubric_template_inline_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_rubric_template_inline_show_hide_pk_yqpebrml7t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_select_point_max_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_select_point_max_choices_pk_kaavzbffln" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_select_point_min_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_select_point_min_choices_pk_aepkcy7oln" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_show_hide_pk_lvd64jnrrn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_shuffle" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_shuffle_pk_tmz5d3bh2j" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_slider_step_label" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_slider_step_label_pk_j23pevwqyl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_substring" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_substring_pk_gfqwlespam" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_template_block_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_template_block_show_hide_pk_6jeizopzxe" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_template_feedback_block_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_template_feedback_block_show_hide_pk_iyminu7tvz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_template_inline_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_template_inline_show_hide_pk_lmv7fqhhrt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_text_entry_base" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_text_entry_base_pk_m3ps6xxrdg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_tolerance_mode" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_tolerance_mode_pk_74cy5zo6cw" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_track_kind" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_track_kind_pk_snzeobyocg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  "value_set" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_value_pk_5pcq2npmhm" PRIMARY KEY ("id"),
  CONSTRAINT "__declared_value_key_id_base_type_3dbnrwpq7k" UNIQUE ("id", "base_type"),
  CONSTRAINT "__declared_value_key_id_shape_37ypo3n26u" UNIQUE ("id", "shape")
);

CREATE TABLE "qti"."declared_value_boolean" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__declared_value_boolean_pk_ddj52fqh6d" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_directed_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_directed_pair_value" NOT NULL,
  CONSTRAINT "__declared_value_directed_pair_pk_6wxayfungq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_duration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_duration_value" NOT NULL,
  CONSTRAINT "__declared_value_duration_pk_35uc6vgqks" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_file" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__declared_value_file_pk_mtfyf4xj5n" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_float_value" NOT NULL,
  CONSTRAINT "__declared_value_float_pk_jl3zamlr24" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_identifier_value" NOT NULL,
  CONSTRAINT "__declared_value_identifier_pk_a74zzqpigw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_integer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_integer_value" NOT NULL,
  CONSTRAINT "__declared_value_integer_pk_4gbwrvrfsf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_pair_value" NOT NULL,
  CONSTRAINT "__declared_value_pair_pk_x7wxicbs2y" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_point" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_point_value" NOT NULL,
  CONSTRAINT "__declared_value_point_pk_2zrgg3g5eh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__declared_value_string_pk_sf7doe2qrv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_value_uri" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."declared_uri_value" NOT NULL,
  CONSTRAINT "__declared_value_uri_pk_w6vkr3buaw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."declared_valuetype" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__declared_valuetype_pk_zzyvqsgiam" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."default" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__default_pk_v2pmuqkicx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."default_value_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__default_value_arm_pk_gsdxrg3f6p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."delete" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__delete_pk_lmo6nithdz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."dependency" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "target" "qti"."manifest_identifier" NOT NULL,
  CONSTRAINT "__dependency_pk_d6a6ko4xiy" PRIMARY KEY ("id"),
  CONSTRAINT "dependency_not_self" CHECK (("resource" <> "target") IS TRUE)
);

CREATE TABLE "qti"."details" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__details_pk_kvl3ej3exp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."details_open" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__details_open_pk_7yvpfx5ylb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."dfn" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__dfn_pk_2jpfmwypwp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."div" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__div_pk_7n2xm5wtky" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."divide" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__divide_pk_lkbryowscx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."dl" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__dl_pk_7o43hwrbas" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."document" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "resource_type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__document_pk_4kx3ps5ktb" PRIMARY KEY ("id"),
  CONSTRAINT "__document_key_package_path_hvs3spxdfn" UNIQUE ("package", "path"),
  CONSTRAINT "__document_key_package_resource_ffl2twv7tp" UNIQUE ("package", "resource"),
  CONSTRAINT "__document_key_id_package_resource_root_nfipbzda3x" UNIQUE ("id", "package", "resource", "root"),
  CONSTRAINT "__document_key_id_package_resource_flponjq52v" UNIQUE ("id", "package", "resource"),
  CONSTRAINT "__document_key_id_root_paefqkk7oi" UNIQUE ("id", "root")
);

CREATE TABLE "qti"."document_id" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "holder" "qti"."id_holder" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__document_id_pk_x7sxopulh7" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__document_id_key_document_id_holder_lfvlmxo4b4" UNIQUE ("document", "id", "holder")
);

CREATE TABLE "qti"."document_identifier" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__document_identifier_pk_afnsowpxmd" PRIMARY KEY ("document"),
  CONSTRAINT "__document_identifier_key_package_resource_4w3bw3solt" UNIQUE ("package", "resource"),
  CONSTRAINT "__document_identifier_key_document_value_gsikqhluke" UNIQUE ("document", "value"),
  CONSTRAINT "__document_identifier_key_package_resource_value_jyew76k7bo" UNIQUE ("package", "resource", "value")
);

CREATE TABLE "qti"."document_lang" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "lom_general" "qti"."yes_no" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "value" "qti"."__text_o3e7dedzyv" NOT NULL,
  CONSTRAINT "__document_lang_pk_hws7ocndwj" PRIMARY KEY ("document", "value")
);

CREATE TABLE "qti"."document_title" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__document_title_pk_aemuz3eyle" PRIMARY KEY ("document"),
  CONSTRAINT "__document_title_key_package_resource_34i3iox4ft" UNIQUE ("package", "resource"),
  CONSTRAINT "__document_title_key_package_resource_collapsed_x734cq6egx" UNIQUE ("package", "resource", "collapsed")
);

CREATE TABLE "qti"."drawing_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__drawing_interaction_pk_kl3anrxfai" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_access_mode" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."access_mode" NOT NULL,
  CONSTRAINT "__drd_access_mode_pk_eab4ksn3t5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_access_mode_adapted" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."access_mode_adapted" NOT NULL,
  CONSTRAINT "__drd_access_mode_adapted_pk_egxqwzwqtu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_adaptation_detail" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_sa4c4ywp5v" NOT NULL,
  CONSTRAINT "__drd_adaptation_detail_pk_jaiktkxtd5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_adaptation_media_type" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_2rz6hgcvt2" NOT NULL,
  CONSTRAINT "__drd_adaptation_media_type_pk_laoj4yvrwz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_adaptation_type" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_4adkkv4wal" NOT NULL,
  CONSTRAINT "__drd_adaptation_type_pk_hfpnvjly2m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_api_interoperable" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_xarz6cej2e" NOT NULL,
  CONSTRAINT "__drd_api_interoperable_pk_piemed6yeo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_at_interoperable" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__drd_at_interoperable_pk_d3v7xsw5ur" PRIMARY KEY ("id"),
  CONSTRAINT "__drd_at_interoperable_key_owner_p2miwggcue" UNIQUE ("owner")
);

CREATE TABLE "qti"."drd_control_flexibility" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_lsy6pxooea" NOT NULL,
  CONSTRAINT "__drd_control_flexibility_pk_4khcglwnjo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_display_transformability" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_d46tbgbbco" NOT NULL,
  CONSTRAINT "__drd_display_transformability_pk_slrde5ougf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_educational_complexity_of_adaptation" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_3zzmpysrx3" NOT NULL,
  CONSTRAINT "__drd_educational_complexity_of_adaptation_pk_5wijuzqco5" PRIMARY KEY ("id"),
  CONSTRAINT "__drd_educational_complexity_of_adaptation_key_owner_2a7j3lt6az" UNIQUE ("owner")
);

CREATE TABLE "qti"."drd_educational_level_of_adaptation" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__drd_educational_level_of_adaptation_pk_7plz4utccw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_has_adaptation" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."drd_adaptation_uri" NOT NULL,
  CONSTRAINT "__drd_has_adaptation_pk_verlwmupji" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_hazard" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_ukaaxf45sk" NOT NULL,
  CONSTRAINT "__drd_hazard_pk_3uqy5jjtai" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_is_adaptation_of" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."drd_adaptation_uri" NOT NULL,
  CONSTRAINT "__drd_is_adaptation_of_pk_q5eggfejhg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_is_full_adaptation_of" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."drd_adaptation_uri" NOT NULL,
  CONSTRAINT "__drd_is_full_adaptation_of_pk_h5i46jurdg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_is_partial_adaptation_of" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."drd_adaptation_uri" NOT NULL,
  CONSTRAINT "__drd_is_partial_adaptation_of_pk_h26cxdkvet" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."drd_language_of_adaptation" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__drd_language_of_adaptation_pk_rotg7tsgr6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."dt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__dt_pk_kokfaes5nu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."duration_gte" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__duration_gte_pk_bi352ynkm5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."duration_lt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__duration_lt_pk_x5qmccsiof" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."edge" (
  "child" "pg_catalog"."uuid" NOT NULL,
  "child_ancestry" "qti"."ancestry" NOT NULL,
  "child_kind" "qti"."node_kind" NOT NULL,
  "parent" "pg_catalog"."uuid" NOT NULL,
  "parent_ancestry" "qti"."ancestry" NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "position" bigint NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__edge_pk_7mkowjkaik" PRIMARY KEY ("parent", "position"),
  CONSTRAINT "__edge_key_child_hgvfjbjilm" UNIQUE ("child"),
  CONSTRAINT "__edge_key_child_parent_position_5nn5z4ycin" UNIQUE ("child", "parent", "position"),
  CONSTRAINT "__edge_key_child_parent_e22uz7r65h" UNIQUE ("child", "parent"),
  CONSTRAINT "__edge_key_child_parent_kind_jv6mposiie" UNIQUE ("child", "parent_kind"),
  CONSTRAINT "__edge_key_child_position_ycndxvfvdk" UNIQUE ("child", "position")
);

CREATE TABLE "qti"."em" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__em_pk_tnak7gsvjd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."end_attempt_count_attempt" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__end_attempt_count_attempt_pk_nl5uryx27y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."end_attempt_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "title" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__end_attempt_interaction_pk_eow2u4u7ao" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."entity_reference" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "name" "qti"."xml_entity_name" NOT NULL,
  CONSTRAINT "__entity_reference_pk_dmli6ubp5p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."equal" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "include_lower_bound" "qti"."xs_boolean" NOT NULL,
  "include_upper_bound" "qti"."xs_boolean" NOT NULL,
  "tolerance_mode" "qti"."tolerance_mode" NOT NULL,
  CONSTRAINT "__equal_pk_u4jsiv4n7p" PRIMARY KEY ("id"),
  CONSTRAINT "__equal_key_id_tolerance_mode_5oe7crwwrv" UNIQUE ("id", "tolerance_mode")
);

CREATE TABLE "qti"."equal_rounded" (
  "figures_kind" "qti"."ref_or_literal" NOT NULL,
  "figures_value" bigint NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "rounding_mode" "qti"."rounding_mode" NOT NULL,
  CONSTRAINT "__equal_rounded_pk_ycg6nkvg3x" PRIMARY KEY ("id"),
  CONSTRAINT "equal_rounded_figures" CHECK (("figures_value" >= 0::bigint AND "rounding_mode" = 'decimalPlaces'::"qti"."rounding_mode" OR "figures_value" >= 1::bigint AND "rounding_mode" = 'significantFigures'::"qti"."rounding_mode" OR "figures_kind" = 'ref'::"qti"."ref_or_literal") IS TRUE),
  CONSTRAINT "equal_rounded_figures_ref_zero" CHECK (("figures_kind" = 'literal'::"qti"."ref_or_literal" OR "figures_value" = 0::bigint) IS TRUE),
  CONSTRAINT "__equal_rounded_key_id_figures_kind_5daytp3gkx" UNIQUE ("id", "figures_kind")
);

CREATE TABLE "qti"."equal_rounded_figures_ref" (
  "identifier" "qti"."variable_reference" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__equal_rounded_figures_ref_pk_lrh6x3lixv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."equal_tolerance" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "tolerance_mode" "qti"."tolerance_mode" NOT NULL,
  "value" "qti"."__text_vtz3bnghkc" NOT NULL,
  CONSTRAINT "__equal_tolerance_pk_cxz24d6cmb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."exit_response" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__exit_response_pk_bwsvjrgab5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."exit_template" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__exit_template_pk_rfggxuggcj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."exit_test" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__exit_test_pk_b2jqs6hf6b" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."expression" (
  "bounded" "qti"."arity_bound" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "min" bigint NOT NULL,
  CONSTRAINT "__expression_pk_djkytcc7ot" PRIMARY KEY ("id"),
  CONSTRAINT "__expression_key_id_kind_sk6fycocte" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."expression_exclude_category" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."category_list" NOT NULL,
  CONSTRAINT "__expression_exclude_category_pk_35alh46qit" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."expression_include_category" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."category_list" NOT NULL,
  CONSTRAINT "__expression_include_category_pk_xasj2jeoni" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."expression_max" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "max" bigint NOT NULL,
  CONSTRAINT "__expression_max_pk_5l6znhgifp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."expression_section_identifier" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."section_reference" NOT NULL,
  CONSTRAINT "__expression_section_identifier_pk_by6zkbxpzz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."expression_weight_identifier" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."weight_reference" NOT NULL,
  CONSTRAINT "__expression_weight_identifier_pk_do5kpjfyyv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_expected_length" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."expected_length" NOT NULL,
  CONSTRAINT "__extended_text_expected_length_pk_f2nz76k6qe" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_expected_lines" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."expected_lines" NOT NULL,
  CONSTRAINT "__extended_text_expected_lines_pk_nayyvfzxei" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_interaction" (
  "base" "qti"."__text_xs56r6cx4y" NOT NULL,
  "format" "qti"."text_format" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "min_strings" "qti"."string_count" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__extended_text_interaction_pk_jtknc6r23t" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."extended_text_max_strings" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."string_count" NOT NULL,
  CONSTRAINT "__extended_text_max_strings_pk_64mlu5tmra" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_pattern_mask" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__extended_text_pattern_mask_pk_mvtxvgo25a" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_patternmask_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__extended_text_patternmask_message_pk_p33454j22t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_placeholder_text" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__extended_text_placeholder_text_pk_unubra747d" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."external_lom" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  CONSTRAINT "__external_lom_pk_hhxtaxx7kt" PRIMARY KEY ("lom"),
  CONSTRAINT "__external_lom_key_package_resource_hxwjkfkaj7" UNIQUE ("package", "resource"),
  CONSTRAINT "__external_lom_key_lom_package_resource_tjboenutnb" UNIQUE ("lom", "package", "resource")
);

CREATE TABLE "qti"."fallback" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__fallback_pk_wb6fgkjy6i" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."feedback_block" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "outcome_identifier" "qti"."variable_reference" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__feedback_block_pk_z55fviztqo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."feedback_inline" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "outcome_identifier" "qti"."variable_reference" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__feedback_inline_pk_3livsuqmrd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."feedback_outcome_ref" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__feedback_outcome_ref_pk_5exg7byhis" PRIMARY KEY ("node"),
  CONSTRAINT "feedback_outcome_ref_type" CHECK (("cardinality" IN ('single'::"qti"."typed_cardinality", 'multiple'::"qti"."typed_cardinality") AND "base_type" = 'identifier'::"qti"."base_type") IS TRUE)
);

CREATE TABLE "qti"."field_value" (
  "field_identifier" "qti"."record_field_identifier" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__field_value_pk_3px6tuekcx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."figcaption" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__figcaption_pk_7dk6akokef" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."figure" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__figure_pk_qhydqu2z5g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."file" (
  "href" "qti"."package_path" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "resource" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__file_pk_i2bjocdyi2" PRIMARY KEY ("id"),
  CONSTRAINT "__file_key_package_resource_position_so6ywuntxa" UNIQUE ("package", "resource", "position"),
  CONSTRAINT "__file_key_id_package_vf5ojq22ku" UNIQUE ("id", "package")
);

CREATE TABLE "qti"."file_content" (
  "byte_length" bigint NOT NULL,
  "content" "qti"."__text_tso7kvy6dv" NOT NULL,
  "mime_type" "qti"."file_media_type" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  CONSTRAINT "__file_content_pk_kztaujzbaq" PRIMARY KEY ("package", "path")
);

CREATE TABLE "qti"."file_lom" (
  "file" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__file_lom_pk_gj2z5oqrlb" PRIMARY KEY ("lom")
);

CREATE TABLE "qti"."file_metadata" (
  "file" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__file_metadata_pk_3xst2gux4o" PRIMARY KEY ("id"),
  CONSTRAINT "__file_metadata_key_file_tm4sdkskv6" UNIQUE ("file"),
  CONSTRAINT "__file_metadata_key_id_file_pbbxismiu4" UNIQUE ("id", "file")
);

CREATE TABLE "qti"."footer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__footer_pk_vxewfzoijn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."gap" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "required" "qti"."xs_boolean" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__gap_pk_jadaeyhbpp" PRIMARY KEY ("id"),
  CONSTRAINT "__gap_key_interaction_identifier_ftuov7occy" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."gap_img" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__gap_img_pk_oadpealh6f" PRIMARY KEY ("id"),
  CONSTRAINT "__gap_img_key_interaction_identifier_5qh6wensmu" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "gap_img_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE)
);

CREATE TABLE "qti"."gap_img_left" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_img_left_pk_5kxajyeext" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_img_match_min" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__gap_img_match_min_pk_vsp5xzcl2b" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_img_object_label" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_img_object_label_pk_lx5yzccjdk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_img_top" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_img_top_pk_nd5oyfjo2a" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_binding" (
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__gap_match_binding_pk_5z6qjfwig6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_choices_container_width" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."container_width" NOT NULL,
  CONSTRAINT "__gap_match_choices_container_width_pk_6rahwnyokh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__gap_match_interaction_pk_truencyy7v" PRIMARY KEY ("id"),
  CONSTRAINT "gap_match_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."gap_match_max_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_match_max_selections_message_pk_w3lzor3p5i" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_min_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__gap_match_min_associations_pk_wxfcfbwm4e" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_match_min_selections_message_pk_yujqciiewz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_text" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__gap_text_pk_sshinnml2z" PRIMARY KEY ("id"),
  CONSTRAINT "__gap_text_key_interaction_identifier_i7c52o5n3w" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "gap_text_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE)
);

CREATE TABLE "qti"."gap_text_match_min" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__gap_text_match_min_pk_2vhz2m627z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gcd" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__gcd_pk_d5prwpqmbl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."graphic_associate_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__graphic_associate_interaction_pk_tcnmcfa3jf" PRIMARY KEY ("id"),
  CONSTRAINT "graphic_associate_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."graphic_associate_min_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__graphic_associate_min_associations_pk_dmg7krabv6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_choices_container_width" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."container_width" NOT NULL,
  CONSTRAINT "__graphic_gap_match_choices_container_width_pk_3fyicvih5p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__graphic_gap_match_interaction_pk_bh753jolrv" PRIMARY KEY ("id"),
  CONSTRAINT "graphic_gap_match_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."graphic_gap_match_max_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__graphic_gap_match_max_selections_message_pk_wjitjcfrkh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_min_associations" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__graphic_gap_match_min_associations_pk_fmrpptxpuf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__graphic_gap_match_min_selections_message_pk_cyaitmqigf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_order_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_bound" "qti"."bound" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__graphic_order_interaction_pk_ed7gbegw3u" PRIMARY KEY ("id"),
  CONSTRAINT "graphic_order_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE),
  CONSTRAINT "__graphic_order_interaction_key_id_max_choices_n_56wqkqd4dr" UNIQUE ("id", "max_choices_n"),
  CONSTRAINT "__graphic_order_interaction_key_id_min_choices_n_nnxo4cdqlf" UNIQUE ("id", "min_choices_n")
);

CREATE TABLE "qti"."graphic_order_max_choices_n" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__graphic_order_max_choices_n_pk_xew52gsshr" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_order_min_choices_n" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__graphic_order_min_choices_n_pk_a2wncg2ho6" PRIMARY KEY ("node"),
  CONSTRAINT "graphic_order_min_choices_positive" CHECK (("value" >= 1::bigint) IS TRUE)
);

CREATE TABLE "qti"."gt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__gt_pk_yf26zc4hjc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."gte" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__gte_pk_xjiyylmyqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_1" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__h_1_pk_s7nnbct76s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_2" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__h_2_pk_dt4etjchyj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_3" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__h_3_pk_jb6taxp4np" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_4" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__h_4_pk_rjr4shbuuz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_5" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__h_5_pk_igexuabhf6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_6" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__h_6_pk_qnlvoo57ea" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."header" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__header_pk_rdky6gfe6r" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."headers_target" (
  "attribute" "qti"."idref_attribute" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "target" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__headers_target_pk_ou2q2tyrt6" PRIMARY KEY ("node", "position"),
  CONSTRAINT "headers_target_attribute" CHECK (("attribute" = 'headers'::"qti"."idref_attribute") IS TRUE)
);

CREATE TABLE "qti"."hotspot_choice" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__hotspot_choice_pk_excxcp6gdy" PRIMARY KEY ("id"),
  CONSTRAINT "__hotspot_choice_key_interaction_identifier_vadzdncytd" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."hotspot_choice_label" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hotspot_choice_label_pk_ncifu5tsjt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hotspot_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__hotspot_interaction_pk_y2zx6mmhwq" PRIMARY KEY ("id"),
  CONSTRAINT "hotspot_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."hotspot_max_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hotspot_max_selections_message_pk_l7w2klklea" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hotspot_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hotspot_min_selections_message_pk_4w3snp4zbg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__hottext_pk_g57caygl5o" PRIMARY KEY ("id"),
  CONSTRAINT "__hottext_key_id_identifier_2wuv2ucdex" UNIQUE ("id", "identifier")
);

CREATE TABLE "qti"."hottext_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__hottext_interaction_pk_dadrenk2el" PRIMARY KEY ("id"),
  CONSTRAINT "hottext_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."hottext_max_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hottext_max_selections_message_pk_l6glnud2of" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hottext_min_selections_message_pk_ek3i6p2ogf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext_owner" (
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__hottext_owner_pk_hd3zbwhwt4" PRIMARY KEY ("node"),
  CONSTRAINT "__hottext_owner_key_interaction_identifier_txfolsmyff" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."hr" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__hr_pk_new7e5gqql" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."html_id" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__html_id_pk_5qgpxb2xq3" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__html_id_key_node_jvsu27ct75" UNIQUE ("node"),
  CONSTRAINT "html_id_attribute" CHECK (("attribute" = 'id'::"qti"."attribute_name") IS TRUE),
  CONSTRAINT "__html_id_key_document_id_kind_mqib2r43zi" UNIQUE ("document", "id", "kind")
);

CREATE TABLE "qti"."i" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__i_pk_wwfkjncyt5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."img" (
  "alt" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "src" "qti"."embed_source_uri" NOT NULL,
  CONSTRAINT "__img_pk_5crzbdfk6h" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."img_height" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__img_height_pk_wjxjfgsbqi" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."img_longdesc" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."long_description_uri" NOT NULL,
  CONSTRAINT "__img_longdesc_pk_h464cr4fxi" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."img_width" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__img_width_pk_h4nleda2od" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."index" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "n_kind" "qti"."ref_or_literal" NOT NULL,
  "n_value" bigint NOT NULL,
  CONSTRAINT "__index_pk_jgklvulh7y" PRIMARY KEY ("id"),
  CONSTRAINT "index_n_ref_zero" CHECK (("n_kind" = 'literal'::"qti"."ref_or_literal" OR "n_value" = 0::bigint) IS TRUE),
  CONSTRAINT "index_positive" CHECK (("n_kind" = 'ref'::"qti"."ref_or_literal" OR "n_value" >= 1::bigint) IS TRUE),
  CONSTRAINT "__index_key_id_n_kind_azdqp2nm22" UNIQUE ("id", "n_kind")
);

CREATE TABLE "qti"."index_n_ref" (
  "identifier" "qti"."variable_reference" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__index_n_ref_pk_6lh3ogtevn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."inline_choice" (
  "fixed" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__inline_choice_pk_3bwlb7am3z" PRIMARY KEY ("id"),
  CONSTRAINT "__inline_choice_key_interaction_identifier_evsi6lmbzh" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."inline_choice_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "min_choices" "qti"."choice_count" NOT NULL,
  "required" "qti"."xs_boolean" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__inline_choice_interaction_pk_r6a7kcnm2x" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."inline_choice_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__inline_choice_min_selections_message_pk_iecb6d6wgx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."inline_choice_prompt" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__inline_choice_prompt_pk_l7ov55lkda" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."inside" (
  "coords" "qti"."expression_coords" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  CONSTRAINT "__inside_pk_atcirtha2w" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."integer_divide" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__integer_divide_pk_zzxu7j5w7f" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."integer_modulus" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__integer_modulus_pk_htpqzwn5ph" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."integer_to_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__integer_to_float_pk_plufh2y2er" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interaction_binding" (
  "adaptive" "qti"."xs_boolean" NOT NULL,
  "ancestry" "qti"."ancestry" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "interaction_kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  CONSTRAINT "__interaction_binding_pk_5gb33vv6zw" PRIMARY KEY ("node"),
  CONSTRAINT "__interaction_binding_key_document_response_22rxbgbwhi" UNIQUE ("document", "response_identifier"),
  CONSTRAINT "adaptive_feedback" CHECK ((NOT "ancestry" IN ('fb'::"qti"."ancestry", 'fb.modal'::"qti"."ancestry", 'fb.rubric'::"qti"."ancestry", 'fb.tmpl'::"qti"."ancestry", 'fb.int'::"qti"."ancestry", 'fb.htx'::"qti"."ancestry", 'fb.modal.tmpl'::"qti"."ancestry", 'fb.modal.htx'::"qti"."ancestry", 'fb.rubric.tmpl'::"qti"."ancestry", 'fb.rubric.htx'::"qti"."ancestry", 'fb.tmpl.int'::"qti"."ancestry", 'fb.tmpl.htx'::"qti"."ancestry", 'fb.int.gap'::"qti"."ancestry", 'fb.int.choice'::"qti"."ancestry", 'fb.int.htx'::"qti"."ancestry", 'fb.modal.tmpl.htx'::"qti"."ancestry", 'fb.rubric.tmpl.htx'::"qti"."ancestry", 'fb.tmpl.int.gap'::"qti"."ancestry", 'fb.tmpl.int.choice'::"qti"."ancestry", 'fb.tmpl.int.htx'::"qti"."ancestry", 'fb.int.gap.choice'::"qti"."ancestry", 'fb.int.gap.htx'::"qti"."ancestry", 'fb.int.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice'::"qti"."ancestry", 'fb.tmpl.int.gap.htx'::"qti"."ancestry", 'fb.tmpl.int.choice.htx'::"qti"."ancestry", 'fb.int.gap.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice.htx'::"qti"."ancestry") OR "adaptive" IN ('true'::"qti"."xs_boolean", '1'::"qti"."xs_boolean")) IS TRUE),
  CONSTRAINT "__interaction_binding_key_node_shape_yhsfpovhkg" UNIQUE ("node", "shape")
);

CREATE TABLE "qti"."interpolation_table" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__interpolation_table_pk_67y4gy2vl3" PRIMARY KEY ("id"),
  CONSTRAINT "__interpolation_table_key_declaration_z3qoupdmkc" UNIQUE ("declaration"),
  CONSTRAINT "__interpolation_table_key_id_base_type_kiyufuhdc3" UNIQUE ("id", "base_type"),
  CONSTRAINT "__interpolation_table_key_id_declaration_base_type_ilcrff77rr" UNIQUE ("id", "declaration", "base_type")
);

CREATE TABLE "qti"."interpolation_table_default_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_pk_p64yw3phfc" PRIMARY KEY ("node"),
  CONSTRAINT "__interpolation_table_default_value_key_node_base_s2uewqvfbn" UNIQUE ("node", "base_type")
);

CREATE TABLE "qti"."interpolation_table_default_value_boolean" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_boolean_pk_leclysrmbf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_directed_pair" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_directed_pair_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_directed_pair_pk_2md4yd5jou" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_duration" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_duration_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_duration_pk_45w7cz6xz6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_file" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_file_pk_ixtp6jgewb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_float" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_float_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_float_pk_wjntdmwfkt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_identifier" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_identifier_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_identifier_pk_6xaj2wkcem" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_integer" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_integer_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_integer_pk_62kt3asfa6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_pair" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_pair_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_pair_pk_rjztvteh3s" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_point" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_point_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_point_pk_ol3hfoievf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_string" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_string_pk_xaknb2inap" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_uri" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."interpolation_default_uri_value" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_uri_pk_ustdi3xkxx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_entry" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "include_boundary" "qti"."xs_boolean" NOT NULL,
  "position" bigint NOT NULL,
  "source_value" "qti"."interpolation_source_value" NOT NULL,
  "table" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_pk_rkjraoxw2e" PRIMARY KEY ("id"),
  CONSTRAINT "__interpolation_table_entry_key_id_base_type_dh5agevx46" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."interpolation_table_entry_boolean" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_boolean_pk_fgppuv355x" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_directed_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_directed_pair_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_directed_pair_pk_ow2bh2qxfu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_duration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_duration_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_duration_pk_heivmffdhk" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_file" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_file_pk_v6iij7abxy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_float_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_float_pk_dzyp45w6f7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_identifier_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_identifier_pk_7bn7aw2vkn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_integer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_integer_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_integer_pk_tegso7hxyo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_pair_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_pair_pk_hbgtirkqb2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_point" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_point_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_point_pk_b6asn7d5nq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_string_pk_sdtb6f7vnx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_uri" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."interpolation_target_uri_value" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_uri_pk_pzsbq2gzcn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."is_null" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__is_null_pk_rztk2ces37" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."item_body" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "item" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__item_body_pk_6niwnztdcy" PRIMARY KEY ("id"),
  CONSTRAINT "__item_body_key_item_ksx3s2fj7n" UNIQUE ("item")
);

CREATE TABLE "qti"."item_body_id" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__item_body_id_pk_ibzhodnt2d" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__item_body_id_key_node_hel7ph2kih" UNIQUE ("node")
);

CREATE TABLE "qti"."item_tool" (
  "shape" "qti"."tool_shape" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__item_tool_pk_gya4gminyx" PRIMARY KEY ("tree"),
  CONSTRAINT "__item_tool_key_tree_shape_sxpyh5o4hw" UNIQUE ("tree", "shape")
);

CREATE TABLE "qti"."item_tool_both" (
  "tool_name" "qti"."tool_name" NOT NULL,
  "tool_version" "qti"."tool_version" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__item_tool_both_pk_nldegtbsdk" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."item_tool_name" (
  "tool_name" "qti"."tool_name" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__item_tool_name_pk_gnib6ywzt6" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."item_tool_version" (
  "tool_version" "qti"."tool_version" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__item_tool_version_pk_45jqniwisg" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."kbd" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__kbd_pk_4t7uulxl4b" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."label" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__label_pk_gp6tjgeyb4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lcm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lcm_pk_a62kmxetqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."li" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__li_pk_ydmic7uqhs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__literal_pk_aelubxdbzj" PRIMARY KEY ("id"),
  CONSTRAINT "__literal_key_id_base_type_n6picv5q76" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."literal_boolean" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__literal_boolean_pk_pzorcnr4yz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_directed_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_directed_pair_value" NOT NULL,
  CONSTRAINT "__literal_directed_pair_pk_4awlgrcin7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_duration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_duration_value" NOT NULL,
  CONSTRAINT "__literal_duration_pk_ogja6w3jzn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_file" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__literal_file_pk_ex3xvxhvfs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_float_value" NOT NULL,
  CONSTRAINT "__literal_float_pk_rfnv2wul2k" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_identifier_value" NOT NULL,
  CONSTRAINT "__literal_identifier_pk_3pbylrgphi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_integer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_integer_value" NOT NULL,
  CONSTRAINT "__literal_integer_pk_puy5zdh44m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_pair_value" NOT NULL,
  CONSTRAINT "__literal_pair_pk_2djc6cp3gc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_point" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_point_value" NOT NULL,
  CONSTRAINT "__literal_point_pk_f5phugbw7g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__literal_string_pk_7jxwemsry2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."literal_uri" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."literal_uri_value" NOT NULL,
  CONSTRAINT "__literal_uri_pk_fzufg3fltq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_pk_cfwl65ptfj" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_key_id_owner_2k4rqjrbzk" UNIQUE ("id", "owner"),
  CONSTRAINT "__lom_key_id_package_mwadkm4ng4" UNIQUE ("id", "package")
);

CREATE TABLE "qti"."lom_aggregation_level" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_aggregation_level_pk_s2tympvcri" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_annotation" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_annotation_pk_pahdalsdmw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_classification" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_classification_pk_sv4svz23wo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_context" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_context_pk_d3q5q7l6tv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_contribute" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "parent" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__lom_contribute_pk_mumbgx5cgs" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_contribute_key_parent_position_4mn4pfsbrs" UNIQUE ("parent", "position")
);

CREATE TABLE "qti"."lom_copyright_and_other_restrictions" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "rights" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_copyright_and_other_restrictions_pk_5pyhbwfpgo" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_copyright_and_other_restrictions_key_rights_7wudgbtm3p" UNIQUE ("rights")
);

CREATE TABLE "qti"."lom_cost" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "rights" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_cost_pk_ifg475rcuj" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_cost_key_rights_y6buu3xmcc" UNIQUE ("rights")
);

CREATE TABLE "qti"."lom_coverage" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_coverage_pk_u27robnrhh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_date" (
  "contribute" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_date_pk_5uwbwivc4y" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_date_key_contribute_5wm3nnpxkr" UNIQUE ("contribute")
);

CREATE TABLE "qti"."lom_date_time" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "date" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_date_time_pk_cly7hfrljo" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_date_time_key_date_rxpe6aqrb6" UNIQUE ("date")
);

CREATE TABLE "qti"."lom_description" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_description_pk_pd5msgzo2g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_difficulty" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_difficulty_pk_izmwy4nlak" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_duration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "technical" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_duration_pk_ydmuoijchs" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_duration_key_technical_4cqyvamai2" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_duration_string" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "duration" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_duration_string_pk_y5fwqaj5mn" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_duration_string_key_duration_dzi5dckpud" UNIQUE ("duration")
);

CREATE TABLE "qti"."lom_educational" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_educational_pk_obnzvqdy6m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_entity" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "contribute" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_entity_pk_ck4cxgvlzx" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_entity_key_contribute_position_mwtyzdiqme" UNIQUE ("contribute", "position")
);

CREATE TABLE "qti"."lom_entry_lang_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_entry_lang_string_pk_ieu73vzaj3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_format" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "technical" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_format_pk_jnwntdq52w" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_format_key_technical_position_krheameqai" UNIQUE ("technical", "position")
);

CREATE TABLE "qti"."lom_general" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_general_pk_3nzxyyowxe" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_general_key_lom_7ftwyoy6mr" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_general_title" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  CONSTRAINT "__lom_general_title_pk_s5eey4iqlu" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_general_title_key_lom_nsilkncsee" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_id" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_id_pk_m3vjr77vsc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "parent" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__lom_identifier_pk_vfc5s25ym5" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_identifier_key_id_lom_position_o2ij2ew774" UNIQUE ("id", "lom", "position")
);

CREATE TABLE "qti"."lom_identifier_catalog" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "position" bigint NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_identifier_catalog_pk_plebwsw2uo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_identifier_entry" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "position" bigint NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_identifier_entry_pk_urwvfn3yd6" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_identifier_entry_key_identifier_apspsz6soo" UNIQUE ("identifier"),
  CONSTRAINT "__lom_identifier_entry_key_identifier_lom_position_nnpjeoa4jx" UNIQUE ("identifier", "lom", "position", "collapsed")
);

CREATE TABLE "qti"."lom_installation_remarks" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "technical" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_installation_remarks_pk_2niiuddo5m" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_installation_remarks_key_technical_hjt52iv2h6" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_intended_end_user_role" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_intended_end_user_role_pk_4ns4gxzj42" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_interactivity_level" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_interactivity_level_pk_smnf62qv23" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_interactivity_type" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_interactivity_type_pk_bs5vquvjc5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_keyword" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_keyword_pk_isklyggmvm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_kind" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_kind_pk_lvae7tdas3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_language" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "position" bigint NOT NULL,
  "value" "qti"."__text_osqmo2ktsg" NOT NULL,
  CONSTRAINT "__lom_language_pk_dyuesseefb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_learning_resource_type" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_learning_resource_type_pk_nmjempx6wc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_life_cycle" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_life_cycle_pk_atprldcekz" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_life_cycle_key_lom_w22vjmbhh3" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_location" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "technical" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_location_pk_w2bior4ffq" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_location_key_technical_position_2qidj6qt7d" UNIQUE ("technical", "position")
);

CREATE TABLE "qti"."lom_maximum_version" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "or_composite" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_maximum_version_pk_oj36nnjc4h" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_maximum_version_key_or_composite_bahlcymzma" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_meta_metadata" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_meta_metadata_pk_exhl26vrjw" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_meta_metadata_key_lom_zny5hdt5ep" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_metadataschema" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "meta_metadata" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_metadataschema_pk_kpxnnes2gd" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_metadataschema_key_meta_metadata_position_fekuqgnvzc" UNIQUE ("meta_metadata", "position")
);

CREATE TABLE "qti"."lom_minimum_version" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "or_composite" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_minimum_version_pk_aqxotk3lkv" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_minimum_version_key_or_composite_uahanfchvh" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_name" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "or_composite" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_name_pk_jpsvu77jw4" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_name_key_or_composite_ndyhak5cuq" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_object_identifier" (
  "collapsed" "qti"."__text_rhdrzkabze" NOT NULL,
  "identifier" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__lom_object_identifier_pk_yut5ma3dl7" PRIMARY KEY ("lom")
);

CREATE TABLE "qti"."lom_object_title" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__lom_object_title_pk_224q5nl6cj" PRIMARY KEY ("lom")
);

CREATE TABLE "qti"."lom_or_composite" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "requirement" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_or_composite_pk_w7azuxggmw" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_or_composite_key_requirement_position_o2o6t3a7fq" UNIQUE ("requirement", "position")
);

CREATE TABLE "qti"."lom_other_platform_requirements" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "technical" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_other_platform_requirements_pk_nermqxuz6n" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_other_platform_requirements_key_technical_3yuf3rc5xd" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_purpose" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_purpose_pk_icp6pnpvro" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_relation" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_relation_pk_gm4jfwfabn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_requirement" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "technical" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_requirement_pk_2ds2omkmqa" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_requirement_key_technical_position_y3rwmrsnzh" UNIQUE ("technical", "position")
);

CREATE TABLE "qti"."lom_resource" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_resource_pk_jcjprudbpj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_rights" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_rights_pk_jf7l6nnzdh" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_rights_key_lom_igi3mirrcx" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_role" (
  "contribute" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_role_pk_5bktrzsauq" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_role_key_contribute_ehaei34cce" UNIQUE ("contribute")
);

CREATE TABLE "qti"."lom_semantic_density" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_semantic_density_pk_le3a5envz3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_size" (
  "collapsed" "qti"."lom_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "technical" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_size_pk_vfewaszzzv" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_size_key_technical_5iy4diylyq" UNIQUE ("technical")
);

CREATE TABLE "qti"."lom_source" (
  "collapsed" "qti"."lom_vocabulary_source" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_source_pk_hq442or7kb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_source_lang_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_source_lang_string_pk_6aokne5mpu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_status" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "life_cycle" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_status_pk_rprhxrcz6w" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_status_key_life_cycle_c3hodmun3m" UNIQUE ("life_cycle")
);

CREATE TABLE "qti"."lom_string" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_string_pk_j6pxaair7j" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_string_key_id_value_collapsed_ewkonewg3e" UNIQUE ("id", "value", "collapsed")
);

CREATE TABLE "qti"."lom_string_language" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."lang_string_language" NOT NULL,
  CONSTRAINT "__lom_string_language_pk_467ufc6ip4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."lom_structure" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_structure_pk_7wbnknpp7i" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_taxon" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_taxon_pk_23daz4igko" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_taxon_path" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_taxon_path_pk_22rkrrz3j6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_technical" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_technical_pk_72qh5dseuv" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_technical_key_lom_vbphyfmpwb" UNIQUE ("lom")
);

CREATE TABLE "qti"."lom_title" (
  "collapsed" "qti"."__text_2dix7luqoi" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "owner" "qti"."lom_owner" NOT NULL,
  "position" bigint NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_title_pk_6humwubm5t" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_title_key_lom_position_osweencxmz" UNIQUE ("lom", "position"),
  CONSTRAINT "__lom_title_key_lom_position_collapsed_kxw7nki5dn" UNIQUE ("lom", "position", "collapsed")
);

CREATE TABLE "qti"."lom_type" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "or_composite" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_type_pk_ih5sl4jgoq" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_type_key_or_composite_wg6m3zavcu" UNIQUE ("or_composite")
);

CREATE TABLE "qti"."lom_typical_age_range" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_typical_age_range_pk_3xmo44huiz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_typical_learning_time" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_typical_learning_time_pk_a3dl6vpcbh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_value" (
  "collapsed" "qti"."lom_vocabulary_value" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_value_pk_uzcm4enckp" PRIMARY KEY ("id"),
  CONSTRAINT "lom_learning_resource_type" CHECK ((NOT "collapsed" IN ('self assessment'::"pg_catalog"."text", 'exam'::"pg_catalog"."text") OR "parent_kind" <> 'lom:learningResourceType'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."lom_version" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "life_cycle" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lom_version_pk_cf45ruciof" PRIMARY KEY ("id"),
  CONSTRAINT "__lom_version_key_life_cycle_ik4t5dfusg" UNIQUE ("life_cycle")
);

CREATE TABLE "qti"."lookup_outcome_value" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lookup_outcome_value_pk_ide6hvpftx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lt_pk_auwosookqt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lte" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__lte_pk_qqbow34kv6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."manifest" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_pk_qjlydhnqtl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."manifest_id" (
  "holder" "qti"."manifest_id_holder" NOT NULL,
  "id" "qti"."manifest_identifier" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_id_pk_qzrdp24pyf" PRIMARY KEY ("package", "id"),
  CONSTRAINT "__manifest_id_key_package_id_holder_3bmpkpiao7" UNIQUE ("package", "id", "holder")
);

CREATE TABLE "qti"."manifest_id_of_manifest" (
  "id" "qti"."manifest_identifier" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_id_of_manifest_pk_hll6ulewxl" PRIMARY KEY ("package", "id")
);

CREATE TABLE "qti"."manifest_id_of_resource" (
  "id" "qti"."manifest_identifier" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_id_of_resource_pk_neqjtae66j" PRIMARY KEY ("package", "id")
);

CREATE TABLE "qti"."manifest_id_of_variant" (
  "id" "qti"."manifest_identifier" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_id_of_variant_pk_mgmrbimez5" PRIMARY KEY ("package", "id")
);

CREATE TABLE "qti"."manifest_lom" (
  "lom" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_lom_pk_gtw6b2jkpd" PRIMARY KEY ("lom"),
  CONSTRAINT "__manifest_lom_key_package_erdswzvc25" UNIQUE ("package")
);

CREATE TABLE "qti"."manifest_metadata" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "manifest" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__manifest_metadata_pk_o5smotlktf" PRIMARY KEY ("id"),
  CONSTRAINT "__manifest_metadata_key_manifest_vtlsxnvblg" UNIQUE ("manifest"),
  CONSTRAINT "__manifest_metadata_key_id_manifest_7d6i2gp74r" UNIQUE ("id", "manifest")
);

CREATE TABLE "qti"."manifest_schema" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cp_schema" NOT NULL,
  CONSTRAINT "__manifest_schema_pk_7olepmmwbb" PRIMARY KEY ("id"),
  CONSTRAINT "__manifest_schema_key_metadata_hkhzp7bnux" UNIQUE ("metadata")
);

CREATE TABLE "qti"."manifest_schema_version" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__manifest_schema_version_pk_xrqjnte57i" PRIMARY KEY ("id"),
  CONSTRAINT "__manifest_schema_version_key_metadata_lvlvkimnnz" UNIQUE ("metadata")
);

CREATE TABLE "qti"."map_entry" (
  "base_type" "qti"."base_type" NOT NULL,
  "case_sensitive" "qti"."xs_boolean" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "mapped_value" "qti"."mapping_score" NOT NULL,
  "mapping" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__map_entry_pk_o4kdajxbdx" PRIMARY KEY ("id"),
  CONSTRAINT "__map_entry_key_id_base_type_sbbzktopwt" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."map_entry_boolean" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__map_entry_boolean_pk_ghzpm363cj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_directed_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_directed_pair_value" NOT NULL,
  CONSTRAINT "__map_entry_directed_pair_pk_rhwnmt6vb7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_duration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_duration_value" NOT NULL,
  CONSTRAINT "__map_entry_duration_pk_tssl3snqct" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_file" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__map_entry_file_pk_yy2f6xknqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_float_value" NOT NULL,
  CONSTRAINT "__map_entry_float_pk_vfjprewvv6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_identifier_value" NOT NULL,
  CONSTRAINT "__map_entry_identifier_pk_4a6bgjmsi6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_integer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_integer_value" NOT NULL,
  CONSTRAINT "__map_entry_integer_pk_jvux6madxj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_pair_value" NOT NULL,
  CONSTRAINT "__map_entry_pair_pk_3pp7y7otms" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_point" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_point_value" NOT NULL,
  CONSTRAINT "__map_entry_point_pk_wf3oy4fiua" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__map_entry_string_pk_d5bkmyxqop" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_uri" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "qti"."map_key_uri_value" NOT NULL,
  CONSTRAINT "__map_entry_uri_pk_zufh7rc7pf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_response" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__map_response_pk_xro657lehh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_response_point" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__map_response_point_pk_sqnqvr2sdx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mappable_base_type" (
  "base_type" "qti"."base_type" NOT NULL,
  CONSTRAINT "__mappable_base_type_pk_do2yz57cxw" PRIMARY KEY ("base_type")
);

CREATE TABLE "qti"."mapping" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "default_value" "qti"."mapping_score" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__mapping_pk_lichj2blf4" PRIMARY KEY ("id"),
  CONSTRAINT "__mapping_key_declaration_v75cz6uboq" UNIQUE ("declaration"),
  CONSTRAINT "__mapping_key_id_declaration_qllmcbosoo" UNIQUE ("id", "declaration")
);

CREATE TABLE "qti"."mapping_lower_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mapping_score" NOT NULL,
  CONSTRAINT "__mapping_lower_bound_pk_yu3vpi7gvy" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."mapping_upper_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."mapping_score" NOT NULL,
  CONSTRAINT "__mapping_upper_bound_pk_pupgxtnhsx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__match_pk_uehnzuwybm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_first_column_header" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_first_column_header_pk_svldzuzlzf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_group" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_group_list" NOT NULL,
  CONSTRAINT "__match_group_pk_b7xlgyt6vj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__match_interaction_pk_kzajbfb36r" PRIMARY KEY ("id"),
  CONSTRAINT "match_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."match_max_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_max_selections_message_pk_hddyoprmax" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_min_selections_message_pk_njui6gv74s" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__match_table_pk_u6pxplfh2b" PRIMARY KEY ("id"),
  CONSTRAINT "__match_table_key_declaration_ycwum7vr5c" UNIQUE ("declaration"),
  CONSTRAINT "__match_table_key_id_base_type_f43rhhsg72" UNIQUE ("id", "base_type"),
  CONSTRAINT "__match_table_key_id_declaration_base_type_4ig6tpcsge" UNIQUE ("id", "declaration", "base_type")
);

CREATE TABLE "qti"."match_table_default_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__match_table_default_value_pk_cpydlc6yco" PRIMARY KEY ("node"),
  CONSTRAINT "__match_table_default_value_key_node_base_type_ixuac7thez" UNIQUE ("node", "base_type")
);

CREATE TABLE "qti"."match_table_default_value_boolean" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__match_table_default_value_boolean_pk_c3yaz4vhew" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_directed_pair" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_directed_pair_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_directed_pair_pk_hmhiuwnyyp" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_duration" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_duration_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_duration_pk_ynqxnj4ads" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_file" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_default_value_file_pk_7xoe2nemiv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_float" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_float_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_float_pk_hchtcdm4os" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_identifier" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_identifier_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_identifier_pk_u56qokdzm3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_integer" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_integer_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_integer_pk_vhcmhuzptm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_pair" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_pair_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_pair_pk_4gje5xsxd3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_point" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_point_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_point_pk_vukcahs27m" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_string" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_default_value_string_pk_seetft5647" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_uri" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."match_default_uri_value" NOT NULL,
  CONSTRAINT "__match_table_default_value_uri_pk_ke6xxdcl7h" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_entry" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "source_value" "qti"."match_source_value" NOT NULL,
  "table" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__match_table_entry_pk_jtjn6vj2o2" PRIMARY KEY ("id"),
  CONSTRAINT "__match_table_entry_key_id_base_type_x4qzwkfrmj" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."match_table_entry_boolean" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__match_table_entry_boolean_pk_65nzkqrl27" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_directed_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_directed_pair_value" NOT NULL,
  CONSTRAINT "__match_table_entry_directed_pair_pk_ohz6lpn5gw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_duration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_duration_value" NOT NULL,
  CONSTRAINT "__match_table_entry_duration_pk_uamxvtc76c" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_file" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_entry_file_pk_53efu22wmd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_float_value" NOT NULL,
  CONSTRAINT "__match_table_entry_float_pk_v2ipzxudfg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_identifier_value" NOT NULL,
  CONSTRAINT "__match_table_entry_identifier_pk_qcwubxkzmx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_integer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_integer_value" NOT NULL,
  CONSTRAINT "__match_table_entry_integer_pk_mxmibks7e6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_pair_value" NOT NULL,
  CONSTRAINT "__match_table_entry_pair_pk_c4ivpkyesy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_point" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_point_value" NOT NULL,
  CONSTRAINT "__match_table_entry_point_pk_gtqlreih2v" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_entry_string_pk_5ml3tck5lw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_uri" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "target_value" "qti"."match_target_uri_value" NOT NULL,
  CONSTRAINT "__match_table_entry_uri_pk_dougyrgf3t" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."math_constant" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "name" "qti"."math_constant_name" NOT NULL,
  CONSTRAINT "__math_constant_pk_wsg3qmfz2p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."math_operator" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "name" "qti"."math_operator_name" NOT NULL,
  CONSTRAINT "__math_operator_pk_nc3i3g73dh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."max" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__max_pk_2pspzdsgps" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."media_coords" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_rect_coords" NOT NULL,
  CONSTRAINT "__media_coords_pk_hyulvnkuge" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."media_interaction" (
  "autostart" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "loop" "qti"."xs_boolean" NOT NULL,
  "max_plays_n" bigint NOT NULL,
  "min_plays_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__media_interaction_pk_zc6m2idown" PRIMARY KEY ("id"),
  CONSTRAINT "media_plays" CHECK (("max_plays_n" = 0::bigint OR "max_plays_n" >= "min_plays_n") IS TRUE)
);

CREATE TABLE "qti"."media_max_plays" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__media_max_plays_pk_x3qjbctv7r" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."media_min_plays" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__media_min_plays_pk_otgxspth7m" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."member" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__member_pk_ce5j5h4dqs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."min" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__min_pk_nkdgt2ynof" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."modal_feedback" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "outcome_identifier" "qti"."variable_reference" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__modal_feedback_pk_pbw24nbtuf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."modal_feedback_title" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__modal_feedback_title_pk_u37k3u2ro4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."multiple" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__multiple_pk_vvs64v475f" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."namespace_declaration" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "prefix" "qti"."__text_httzcaefcn" NOT NULL,
  "uri" "qti"."namespace_uri" NOT NULL,
  CONSTRAINT "__namespace_declaration_pk_qkfnrroixl" PRIMARY KEY ("node", "position")
);

CREATE TABLE "qti"."nav" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__nav_pk_hmz6zfailf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."node" (
  "ancestry" "qti"."ancestry" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "prefix" "qti"."__text_httzcaefcn" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__node_pk_3sd4cqvxbf" PRIMARY KEY ("id"),
  CONSTRAINT "__node_key_id_ancestry_fsdnbaszzt" UNIQUE ("id", "ancestry"),
  CONSTRAINT "__node_key_id_tree_version_kind_sjr4jx6soj" UNIQUE ("id", "tree", "version", "kind"),
  CONSTRAINT "__node_key_id_tree_kind_4maffhlb7n" UNIQUE ("id", "tree", "kind"),
  CONSTRAINT "__node_key_id_tree_q3mjcmmvwy" UNIQUE ("id", "tree"),
  CONSTRAINT "__node_key_id_kind_phk5q5ctpf" UNIQUE ("id", "kind"),
  CONSTRAINT "__node_key_id_root_kind_bko2kkuujd" UNIQUE ("id", "root_kind"),
  CONSTRAINT "__node_key_id_version_6vx4nbp4ed" UNIQUE ("id", "version"),
  CONSTRAINT "__node_key_id_tree_root_kind_dm7x2qc7ni" UNIQUE ("id", "tree", "root_kind"),
  CONSTRAINT "__node_key_id_tree_version_jtzq7sjwu7" UNIQUE ("id", "tree", "version"),
  CONSTRAINT "__node_key_id_tree_ancestry_zuqtimnsjh" UNIQUE ("id", "tree", "ancestry")
);

CREATE TABLE "qti"."node_catalog_idref" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."id_reference" NOT NULL,
  CONSTRAINT "__node_catalog_idref_pk_rc3gazfvux" PRIMARY KEY ("node"),
  CONSTRAINT "node_catalog_idref_attribute" CHECK (("attribute" = 'data-catalog-idref'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_class" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."class_list" NOT NULL,
  CONSTRAINT "__node_class_pk_ojngbanp7o" PRIMARY KEY ("node"),
  CONSTRAINT "node_class_attribute" CHECK (("attribute" = 'class'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_dir" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."text_direction" NOT NULL,
  CONSTRAINT "__node_dir_pk_vy3shfk4mm" PRIMARY KEY ("node"),
  CONSTRAINT "bdo_dir_not_auto" CHECK (("kind" <> 'bdo'::"qti"."node_kind" OR "value" <> 'auto'::"qti"."text_direction") IS TRUE),
  CONSTRAINT "node_dir_attribute" CHECK (("attribute" = 'dir'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_label" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__node_label_pk_ul4c3jwnej" PRIMARY KEY ("node"),
  CONSTRAINT "node_label_attribute" CHECK (("attribute" = 'label'::"qti"."attribute_name") IS TRUE),
  CONSTRAINT "node_label_not_root" CHECK (("kind" <> 'qti-assessment-item'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."node_lang" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."content_language" NOT NULL,
  CONSTRAINT "__node_lang_pk_cjnbevszok" PRIMARY KEY ("node"),
  CONSTRAINT "node_lang_attribute" CHECK (("attribute" = 'lang'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_suppress_tts" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."suppress_tts_mode" NOT NULL,
  CONSTRAINT "__node_suppress_tts_pk_wyuumllrj2" PRIMARY KEY ("node"),
  CONSTRAINT "node_suppress_tts_attribute" CHECK (("attribute" = 'data-qti-suppress-tts'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_xml_base" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xml_base_uri" NOT NULL,
  CONSTRAINT "__node_xml_base_pk_4zdbjpozg6" PRIMARY KEY ("node"),
  CONSTRAINT "node_xml_base_attribute" CHECK (("attribute" = 'xml:base'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_xml_lang" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_o3e7dedzyv" NOT NULL,
  CONSTRAINT "__node_xml_lang_pk_r3adyrsf3j" PRIMARY KEY ("node"),
  CONSTRAINT "node_xml_lang_attribute" CHECK (("attribute" = 'xml:lang'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."not" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__not_pk_bauz5nu6h7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."null" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__null_pk_g63z7msytv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_correct" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__number_correct_pk_qlz7x6yb2w" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_incorrect" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__number_incorrect_pk_zlrq5c77ks" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_presented" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__number_presented_pk_ewjcxpyfdx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_responded" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__number_responded_pk_mojv4byhkl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."number_selected" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__number_selected_pk_cokievddwb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."object" (
  "data" "qti"."embed_source_uri" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "type" "qti"."content_media_type" NOT NULL,
  CONSTRAINT "__object_pk_mcbj24pg5k" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."object_height" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__object_height_pk_42aoo26esd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."object_width" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__object_width_pk_q7ou5epbgl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."ol" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__ol_pk_5fcuownphv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."operand" (
  "child" "pg_catalog"."uuid" NOT NULL,
  "expression" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__operand_pk_kv4v2shmyp" PRIMARY KEY ("expression", "position"),
  CONSTRAINT "__operand_key_child_xhxiir4t3r" UNIQUE ("child")
);

CREATE TABLE "qti"."operator_arity" (
  "kind" "qti"."node_kind" NOT NULL,
  "min" bigint NOT NULL,
  CONSTRAINT "__operator_arity_pk_q24hdn3ki4" PRIMARY KEY ("kind"),
  CONSTRAINT "__operator_arity_key_kind_min_wbdijs2cgl" UNIQUE ("kind", "min")
);

CREATE TABLE "qti"."operator_arity_max" (
  "kind" "qti"."node_kind" NOT NULL,
  "max" bigint NOT NULL,
  CONSTRAINT "__operator_arity_max_pk_2il4lpb7ts" PRIMARY KEY ("kind"),
  CONSTRAINT "__operator_arity_max_key_kind_max_wfwrc2fedl" UNIQUE ("kind", "max")
);

CREATE TABLE "qti"."operator_arity_unbounded" (
  "kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__operator_arity_unbounded_pk_do57zr3u7b" PRIMARY KEY ("kind")
);

CREATE TABLE "qti"."or" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__or_pk_y7duy5pfgu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."order_choices_container_width" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."container_width" NOT NULL,
  CONSTRAINT "__order_choices_container_width_pk_j6fon4zjzl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_bound" "qti"."bound" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__order_interaction_pk_q6xg3wjegm" PRIMARY KEY ("id"),
  CONSTRAINT "order_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE),
  CONSTRAINT "__order_interaction_key_id_max_choices_n_rcuzyeukiw" UNIQUE ("id", "max_choices_n"),
  CONSTRAINT "__order_interaction_key_id_min_choices_n_nhg3azb62y" UNIQUE ("id", "min_choices_n")
);

CREATE TABLE "qti"."order_max_choices_n" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__order_max_choices_n_pk_cmmr44seu5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_max_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__order_max_selections_message_pk_vua276fnuf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_min_choices_n" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__order_min_choices_n_pk_mxz7gfclkx" PRIMARY KEY ("node"),
  CONSTRAINT "order_min_choices_positive" CHECK (("value" >= 1::bigint) IS TRUE)
);

CREATE TABLE "qti"."order_min_selections_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__order_min_selections_message_pk_fphf4sh4dt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_orientation" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."orientation" NOT NULL,
  CONSTRAINT "__order_orientation_pk_zbe3m4k476" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."ordered" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__ordered_pk_bqvukunel4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."ordinary_statistic_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__ordinary_statistic_arm_pk_2atydtxqda" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."organizations" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "manifest" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__organizations_pk_s75qmfyk3u" PRIMARY KEY ("id"),
  CONSTRAINT "__organizations_key_manifest_l2ctxec4pj" UNIQUE ("manifest")
);

CREATE TABLE "qti"."outcome_condition_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_condition_arm_pk_wo3d4slnda" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_declaration_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_declaration_arm_pk_pnkc34gvyg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_document" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__outcome_document_pk_rmlhdozvqn" PRIMARY KEY ("document")
);

CREATE TABLE "qti"."outcome_else_arm" (
  "condition" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_else_arm_pk_yswy2y7e4t" PRIMARY KEY ("id"),
  CONSTRAINT "__outcome_else_arm_key_condition_fz6vete2cx" UNIQUE ("condition")
);

CREATE TABLE "qti"."outcome_else_if_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_else_if_arm_pk_ha426uaa6s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_if_arm" (
  "condition" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_if_arm_pk_lwzvhkiup2" PRIMARY KEY ("id"),
  CONSTRAINT "__outcome_if_arm_key_condition_5tumrsqgpm" UNIQUE ("condition")
);

CREATE TABLE "qti"."outcome_maximum_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_maximum_arm_pk_etovftfrz3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_min_max" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "outcome_identifier" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__outcome_min_max_pk_f23nbtrqiq" PRIMARY KEY ("id"),
  CONSTRAINT "outcome_min_max_kind" CHECK (("kind" IN ('qti-outcome-minimum'::"qti"."node_kind", 'qti-outcome-maximum'::"qti"."node_kind")) IS TRUE)
);

CREATE TABLE "qti"."outcome_minimum_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_minimum_arm_pk_e3w4q2hbek" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_processing" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_processing_pk_xvxv6zwarp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."outcome_processing_fragment" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__outcome_processing_fragment_pk_gvneivp4il" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."p" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__p_pk_hx26m6msb5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."package" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."manifest_identifier" NOT NULL,
  "schemaversion" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__package_pk_sg2cyzxgtm" PRIMARY KEY ("id"),
  CONSTRAINT "__package_key_id_schemaversion_2sbnqejonp" UNIQUE ("id", "schemaversion"),
  CONSTRAINT "__package_key_id_identifier_udumz3ewib" UNIQUE ("id", "identifier")
);

CREATE TABLE "qti"."package_entry" (
  "kind" "qti"."entry_kind" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."package_path" NOT NULL,
  CONSTRAINT "__package_entry_pk_3i35ab5o3w" PRIMARY KEY ("package", "path")
);

CREATE TABLE "qti"."param" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "name" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "valuetype" "qti"."param_valuetype" NOT NULL,
  CONSTRAINT "__param_pk_7356wp3t74" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."param_type" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."content_media_type" NOT NULL,
  CONSTRAINT "__param_type_pk_uwpvwiemux" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."pattern_match" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "pattern" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__pattern_match_pk_enhbe55iiw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."pi" (
  "data" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "target" "qti"."pi_target" NOT NULL,
  CONSTRAINT "__pi_pk_vqm3tcomg6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."picture" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__picture_pk_tqxijhprxy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."position_object_center_point" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_h4r6alp6hk" NOT NULL,
  CONSTRAINT "__position_object_center_point_pk_e27gq5glwj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."position_object_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__position_object_interaction_pk_66boholg6x" PRIMARY KEY ("id"),
  CONSTRAINT "position_object_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."position_object_min_choices" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__position_object_min_choices_pk_onjhyyrl35" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."position_object_stage" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__position_object_stage_pk_6k2maeenqb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."power" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__power_pk_r5lq7qyhym" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."pre" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__pre_pk_k4mxtyvwgb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."printed_variable" (
  "base" "qti"."printed_variable_integer_or_variable" NOT NULL,
  "delimiter" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."variable_reference" NOT NULL,
  "mapping_indicator" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "power_form" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__printed_variable_pk_zjza3rwjwj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."printed_variable_field" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."record_field_identifier" NOT NULL,
  CONSTRAINT "__printed_variable_field_pk_ru472spcis" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."printed_variable_format" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_awt4t5kosa" NOT NULL,
  CONSTRAINT "__printed_variable_format_pk_e5cr6ooplp" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."printed_variable_id" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__printed_variable_id_pk_uow5oqhfb2" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__printed_variable_id_key_node_dqzglovtb6" UNIQUE ("node")
);

CREATE TABLE "qti"."printed_variable_index" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."printed_variable_integer_or_variable" NOT NULL,
  CONSTRAINT "__printed_variable_index_pk_3jz6zoqrjt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."printed_variable_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__printed_variable_ref_pk_4a3jyykasc" PRIMARY KEY ("node"),
  CONSTRAINT "printed_variable_ref_kind" CHECK (("kind" IN ('outcome'::"qti"."declaration_kind", 'template'::"qti"."declaration_kind")) IS TRUE)
);

CREATE TABLE "qti"."printed_variable_var_ref" (
  "attribute" "qti"."printed_variable_attr" NOT NULL,
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__printed_variable_var_ref_pk_c74atqjib4" PRIMARY KEY ("node", "attribute"),
  CONSTRAINT "printed_variable_var_ref_type" CHECK (("kind" IN ('outcome'::"qti"."declaration_kind", 'template'::"qti"."declaration_kind") AND "base_type" = 'integer'::"qti"."base_type" AND "cardinality" = 'single'::"qti"."typed_cardinality") IS TRUE)
);

CREATE TABLE "qti"."product" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__product_pk_6ykszscxwz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."prompt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "parent" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__prompt_pk_wxy2gmqfd7" PRIMARY KEY ("id"),
  CONSTRAINT "__prompt_key_parent_4f55velenh" UNIQUE ("parent")
);

CREATE TABLE "qti"."q" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__q_pk_xlyzy6fet4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."q_cite" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."citation_uri" NOT NULL,
  CONSTRAINT "__q_cite_pk_223msu2ij4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."qmd_composite" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__qmd_composite_pk_xlqha76w6j" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_composite_key_qti_metadata_lbf64f3xqh" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_custom_type_identifier" (
  "context" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__qmd_custom_type_identifier_pk_t2e27tuazw" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_custom_type_identifier_key_context_6hcmllgbnf" UNIQUE ("context")
);

CREATE TABLE "qti"."qmd_feedback_type" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."qmd_feedback_type_value" NOT NULL,
  CONSTRAINT "__qmd_feedback_type_pk_n3cozndfbx" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_feedback_type_key_qti_metadata_fbnqiylecc" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_interaction_kind" (
  "context" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__qmd_interaction_kind_pk_jjituwkg3a" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_interaction_kind_key_context_zgrdm4kzyz" UNIQUE ("context")
);

CREATE TABLE "qti"."qmd_interaction_type" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."qmd_interaction_type_value" NOT NULL,
  CONSTRAINT "__qmd_interaction_type_pk_ohm4idltho" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qmd_item_template" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__qmd_item_template_pk_mimqgmhu2u" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_item_template_key_qti_metadata_oew4krly7g" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_portable_custom_interaction_context" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__qmd_portable_custom_interaction_context_pk_xac34gmcx6" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_portable_custom_interaction_context_key_qti_xhmydb4ask" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_scoring_mode" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."qmd_scoring_mode_value" NOT NULL,
  CONSTRAINT "__qmd_scoring_mode_pk_c37sji4e2c" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qmd_solution_available" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__qmd_solution_available_pk_vuhhrrl3yq" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_solution_available_key_qti_metadata_rhehxypx2m" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_time_dependent" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__qmd_time_dependent_pk_totdnpiz57" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_time_dependent_key_qti_metadata_pizyu76fq2" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_tool_name" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."tool_name" NOT NULL,
  CONSTRAINT "__qmd_tool_name_pk_eos7lhy5x6" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_tool_name_key_qti_metadata_2mqtwkzgw5" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_tool_vendor" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."tool_vendor" NOT NULL,
  CONSTRAINT "__qmd_tool_vendor_pk_nsbkalhujg" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_tool_vendor_key_qti_metadata_dxe3sypo7i" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qmd_tool_version" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "qti_metadata" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."tool_version" NOT NULL,
  CONSTRAINT "__qmd_tool_version_pk_3k4ht2nmw5" PRIMARY KEY ("id"),
  CONSTRAINT "__qmd_tool_version_key_qti_metadata_rrsckkvtse" UNIQUE ("qti_metadata")
);

CREATE TABLE "qti"."qti_label" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__qti_label_pk_qgt6qcvdyq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qti_metadata" (
  "host" "qti"."qti_metadata_host" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  CONSTRAINT "__qti_metadata_pk_s4olys2stl" PRIMARY KEY ("id"),
  CONSTRAINT "__qti_metadata_key_package_resource_dwel7fxdsx" UNIQUE ("package", "resource"),
  CONSTRAINT "__qti_metadata_key_id_host_fyvjheokoi" UNIQUE ("id", "host"),
  CONSTRAINT "__qti_metadata_key_id_package_resource_p622xz2moc" UNIQUE ("id", "package", "resource")
);

CREATE TABLE "qti"."qti_metadata_in_external_lom" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  CONSTRAINT "__qti_metadata_in_external_lom_pk_wr7moirehy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qti_metadata_in_metadata" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "resource_node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__qti_metadata_in_metadata_pk_6n7gq32ruf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qti_metadata_in_resource_lom" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  CONSTRAINT "__qti_metadata_in_resource_lom_pk_bc5j6sb4j4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__random_pk_7rdffnzvjo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max" "qti"."__text_wuvwyowttn" NOT NULL,
  CONSTRAINT "__random_float_pk_7hxcqp7hcb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random_float_min" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_wuvwyowttn" NOT NULL,
  CONSTRAINT "__random_float_min_pk_aej2iktm7e" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."random_integer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max" "qti"."expression_integer_or_variable" NOT NULL,
  CONSTRAINT "__random_integer_pk_7ubdngnlaj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."random_integer_min" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."expression_integer_or_variable" NOT NULL,
  CONSTRAINT "__random_integer_min_pk_5q2fi4dj4p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."random_integer_step" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."expression_integer_or_variable" NOT NULL,
  CONSTRAINT "__random_integer_step_pk_hp6mozrawn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."rb" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__rb_pk_q4bbsh73em" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."record_binding" (
  "interaction_kind" "qti"."node_kind" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__record_binding_pk_zo6rox5gzm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."record_binding_fit" (
  "interaction_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__record_binding_fit_pk_w5zm2vgswj" PRIMARY KEY ("interaction_kind")
);

CREATE TABLE "qti"."record_declaration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__record_declaration_pk_5bmpqtimiy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."record_field" (
  "field_identifier" "qti"."record_field_identifier" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__record_field_pk_qhg6nv6lbn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."record_value_set" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__record_value_set_pk_hw4xyls63o" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."repeat" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "number_repeats_kind" "qti"."ref_or_literal" NOT NULL,
  "number_repeats_value" bigint NOT NULL,
  CONSTRAINT "__repeat_pk_sucagcjref" PRIMARY KEY ("id"),
  CONSTRAINT "repeat_int" CHECK (("number_repeats_value" >= (-2147483648)::bigint AND "number_repeats_value" <= 2147483647::bigint OR "number_repeats_kind" = 'ref'::"qti"."ref_or_literal") IS TRUE),
  CONSTRAINT "repeat_number_repeats_ref_zero" CHECK (("number_repeats_kind" = 'literal'::"qti"."ref_or_literal" OR "number_repeats_value" = 0::bigint) IS TRUE),
  CONSTRAINT "__repeat_key_id_number_repeats_kind_fgy42qpbe4" UNIQUE ("id", "number_repeats_kind")
);

CREATE TABLE "qti"."repeat_number_repeats_ref" (
  "identifier" "qti"."variable_reference" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__repeat_number_repeats_ref_pk_njoppu25ma" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."resource" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."manifest_identifier" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__resource_pk_yrfq7dxmhs" PRIMARY KEY ("id"),
  CONSTRAINT "__resource_key_package_identifier_fsvcnui6cz" UNIQUE ("package", "identifier"),
  CONSTRAINT "__resource_key_package_identifier_type_24kwhezduw" UNIQUE ("package", "identifier", "type"),
  CONSTRAINT "__resource_key_id_package_identifier_jx53gsgn4j" UNIQUE ("id", "package", "identifier"),
  CONSTRAINT "__resource_key_id_package_zmgj4vl2s5" UNIQUE ("id", "package")
);

CREATE TABLE "qti"."resource_href" (
  "href" "qti"."resource_entry_href" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__resource_href_pk_fzjlywz4ma" PRIMARY KEY ("resource")
);

CREATE TABLE "qti"."resource_lom" (
  "lom" "pg_catalog"."uuid" NOT NULL,
  "metadata" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__resource_lom_pk_cx7m3uevdj" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_key_package_resource_wavh3iq5t3" UNIQUE ("package", "resource"),
  CONSTRAINT "__resource_lom_key_lom_package_resource_type_7gdyikkhg4" UNIQUE ("lom", "package", "resource", "type"),
  CONSTRAINT "__resource_lom_key_lom_package_resource_fcuxpt7bmm" UNIQUE ("lom", "package", "resource")
);

CREATE TABLE "qti"."resource_lom_general" (
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  CONSTRAINT "__resource_lom_general_pk_4gbfhozbtg" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_general_key_package_resource_fmb6hj3zia" UNIQUE ("package", "resource")
);

CREATE TABLE "qti"."resource_lom_identified" (
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__resource_lom_identified_pk_xrqngnwel5" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_identified_key_lom_package_resource_pfavxom73q" UNIQUE ("lom", "package", "resource", "type")
);

CREATE TABLE "qti"."resource_lom_language_set" (
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "value" "qti"."__text_osqmo2ktsg" NOT NULL,
  CONSTRAINT "__resource_lom_language_set_pk_shj4yzlqx6" PRIMARY KEY ("lom", "value"),
  CONSTRAINT "__resource_lom_language_set_key_package_resource_rgsl255stw" UNIQUE ("package", "resource", "value")
);

CREATE TABLE "qti"."resource_lom_titled" (
  "lom" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "qti"."manifest_identifier" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__resource_lom_titled_pk_txhs6tqqu2" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_titled_key_lom_package_resource_type_qreilk2jjd" UNIQUE ("lom", "package", "resource", "type")
);

CREATE TABLE "qti"."resource_metadata" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "resource" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__resource_metadata_pk_nb4q7foofw" PRIMARY KEY ("id"),
  CONSTRAINT "__resource_metadata_key_resource_ugm3u666g4" UNIQUE ("resource"),
  CONSTRAINT "__resource_metadata_key_id_resource_o7kyjomlg6" UNIQUE ("id", "resource")
);

CREATE TABLE "qti"."resource_type_of" (
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__resource_type_of_pk_vcggjjciac" PRIMARY KEY ("version", "type")
);

CREATE TABLE "qti"."resources" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "manifest" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__resources_pk_h7o56gfsbb" PRIMARY KEY ("id"),
  CONSTRAINT "__resources_key_manifest_q7t3wn3azt" UNIQUE ("manifest")
);

CREATE TABLE "qti"."response_condition_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_condition_arm_pk_h7ymbdp7g2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."response_declaration_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_declaration_arm_pk_5hhor6gekm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."response_declaration_id" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_declaration_id_pk_tki7iml5lk" PRIMARY KEY ("document", "id")
);

CREATE TABLE "qti"."response_else_arm" (
  "condition" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_else_arm_pk_2tcvw4myw3" PRIMARY KEY ("id"),
  CONSTRAINT "__response_else_arm_key_condition_plufqal34d" UNIQUE ("condition")
);

CREATE TABLE "qti"."response_else_if_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_else_if_arm_pk_tcq6albawo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."response_if_arm" (
  "condition" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_if_arm_pk_my6j3ksjx3" PRIMARY KEY ("id"),
  CONSTRAINT "__response_if_arm_key_condition_jcpht666ni" UNIQUE ("condition")
);

CREATE TABLE "qti"."response_processing" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__response_processing_pk_vj24li3bev" PRIMARY KEY ("id"),
  CONSTRAINT "processing_root" CHECK (("root_kind" = 'item'::"qti"."root_kind" OR "root_kind" = 'rptemplate'::"qti"."root_kind") IS TRUE),
  CONSTRAINT "__response_processing_key_id_root_kind_nfaywgrq6y" UNIQUE ("id", "root_kind")
);

CREATE TABLE "qti"."response_processing_fragment" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_processing_fragment_pk_z4c7albdel" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."response_processing_item" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "item" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__response_processing_item_pk_p4n6eptdbw" PRIMARY KEY ("id"),
  CONSTRAINT "__response_processing_item_key_item_g4l5s2zefn" UNIQUE ("item")
);

CREATE TABLE "qti"."response_processing_template" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "uri" "qti"."template_uri" NOT NULL,
  CONSTRAINT "__response_processing_template_pk_gpwzrvcd55" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."response_processing_template_location" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "uri" "qti"."template_location_uri" NOT NULL,
  CONSTRAINT "__response_processing_template_location_pk_gq3aqrt7vu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."root_of_type" (
  "root" "qti"."root_kind" NOT NULL,
  "type" "qti"."__text_tyjqwtj7ky" NOT NULL,
  CONSTRAINT "__root_of_type_pk_kdi6c7gguy" PRIMARY KEY ("type"),
  CONSTRAINT "__root_of_type_key_type_root_v4guhvvyrl" UNIQUE ("type", "root")
);

CREATE TABLE "qti"."round" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__round_pk_qzw6omft62" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."round_to" (
  "figures_kind" "qti"."ref_or_literal" NOT NULL,
  "figures_value" bigint NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "rounding_mode" "qti"."rounding_mode" NOT NULL,
  CONSTRAINT "__round_to_pk_d45lpqk5n3" PRIMARY KEY ("id"),
  CONSTRAINT "round_to_figures" CHECK (("figures_value" >= 0::bigint AND "rounding_mode" = 'decimalPlaces'::"qti"."rounding_mode" OR "figures_value" >= 1::bigint AND "rounding_mode" = 'significantFigures'::"qti"."rounding_mode" OR "figures_kind" = 'ref'::"qti"."ref_or_literal") IS TRUE),
  CONSTRAINT "round_to_figures_ref_zero" CHECK (("figures_kind" = 'literal'::"qti"."ref_or_literal" OR "figures_value" = 0::bigint) IS TRUE),
  CONSTRAINT "__round_to_key_id_figures_kind_t7oyey7upw" UNIQUE ("id", "figures_kind")
);

CREATE TABLE "qti"."round_to_figures_ref" (
  "identifier" "qti"."variable_reference" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__round_to_figures_ref_pk_tjv2uh5ong" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."rp" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__rp_pk_aimimmimmq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__rt_pk_yh6kwgvuby" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rtc" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__rtc_pk_7u7w4flucm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rubric_block" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "use" "qti"."__text_kcydnvglpj" NOT NULL,
  "view" "qti"."__text_5lyuoloiou" NOT NULL,
  CONSTRAINT "__rubric_block_pk_cqgektzb52" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rubric_template_block" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__rubric_template_block_pk_2spkmf6x3o" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rubric_template_inline" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__rubric_template_inline_pk_t5tzr7x7yx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."ruby" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__ruby_pk_ihbym6vvoy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rule_operand" (
  "child" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  "rule" "pg_catalog"."uuid" NOT NULL,
  "rule_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__rule_operand_pk_jcni7ipc5p" PRIMARY KEY ("rule"),
  CONSTRAINT "__rule_operand_key_child_qloy3wxzn5" UNIQUE ("child"),
  CONSTRAINT "rule_operand_kind" CHECK (("rule_kind" IN ('qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind", 'qti-set-template-value'::"qti"."node_kind", 'qti-set-default-value'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind", 'qti-template-constraint'::"qti"."node_kind", 'qti-response-if'::"qti"."node_kind", 'qti-response-else-if'::"qti"."node_kind", 'qti-outcome-if'::"qti"."node_kind", 'qti-outcome-else-if'::"qti"."node_kind", 'qti-template-if'::"qti"."node_kind", 'qti-template-else-if'::"qti"."node_kind")) IS TRUE)
);

CREATE TABLE "qti"."samp" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__samp_pk_cykxtsogoo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."schema_location" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "prefix" "qti"."namespace_prefix" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__schema_location_pk_q6ijfxgo2t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."section" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__section_pk_z4zr6k2j4z" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."select_point_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__select_point_interaction_pk_ryf6o3jzsi" PRIMARY KEY ("id"),
  CONSTRAINT "select_point_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."set_correct_response" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__set_correct_response_pk_sxqj5x5hy6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."set_default_value" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__set_default_value_pk_v7un4utfsm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."set_outcome_value" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__set_outcome_value_pk_lbvpf5wb5e" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."set_template_value" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__set_template_value_pk_ovr7opqhur" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."simple_associable_choice" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  CONSTRAINT "__simple_associable_choice_pk_al7tbaciyh" PRIMARY KEY ("id"),
  CONSTRAINT "__simple_associable_choice_key_interaction_3e4ddfehya" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "simple_associable_choice_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE),
  CONSTRAINT "__simple_associable_choice_key_id_interaction_zajgnsnc4k" UNIQUE ("id", "interaction")
);

CREATE TABLE "qti"."simple_associable_choice_fixed" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__simple_associable_choice_fixed_pk_otda3s6yzc" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_associable_choice_match_min" (
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__simple_associable_choice_match_min_pk_mrx7hf5ard" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_associable_choice_match_set" (
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "match_set" "pg_catalog"."uuid" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__simple_associable_choice_match_set_pk_2da2c3u5cl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_associable_choice_show_hide" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__simple_associable_choice_show_hide_pk_6j7rnun3t2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_choice" (
  "fixed" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."choice_identifier" NOT NULL,
  "interaction" "pg_catalog"."uuid" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__simple_choice_pk_3t5mywknt4" PRIMARY KEY ("id"),
  CONSTRAINT "__simple_choice_key_interaction_identifier_atyd34wpmk" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."simple_choice_template_identifier" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__simple_choice_template_identifier_pk_vhko3seq67" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_match_set" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__simple_match_set_pk_6wbzzj4zti" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."slider_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "lower_bound" "qti"."__text_tq7gq2jmkl" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "step_label" "qti"."xs_boolean" NOT NULL,
  "upper_bound" "qti"."__text_tq7gq2jmkl" NOT NULL,
  CONSTRAINT "__slider_interaction_pk_trtgcbkiyq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."slider_orientation" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."orientation" NOT NULL,
  CONSTRAINT "__slider_orientation_pk_b6yffcevuk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."slider_reverse" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__slider_reverse_pk_xejdznfvqv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."slider_step" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_acxfo763jg" NOT NULL,
  CONSTRAINT "__slider_step_pk_niqd6ookmn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."small" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__small_pk_tc7vyfho3z" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."source" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "src" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_pk_rlnpuhll37" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."source_media" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_media_pk_hsiggnlzak" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."source_sizes" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_sizes_pk_upwsb556bm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."source_srcset" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_srcset_pk_x3zue5jzvj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."source_type" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."content_media_type" NOT NULL,
  CONSTRAINT "__source_type_pk_chy3eulfpk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."span" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__span_pk_hixy2fbcsc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."standard_template_reference" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "template" "qti"."standard_template" NOT NULL,
  CONSTRAINT "__standard_template_reference_pk_cpeprqiikq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic" (
  "context" "qti"."statistic_context_uri" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."statistic_kind" NOT NULL,
  "name" "qti"."statistic_name" NOT NULL,
  "position" bigint NOT NULL,
  "usage_data" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__statistic_pk_2oijxhvzcy" PRIMARY KEY ("id"),
  CONSTRAINT "__statistic_key_id_kind_gigitdywst" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."statistic_case_count" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_case_count" NOT NULL,
  CONSTRAINT "__statistic_case_count_pk_6bm5s5d2s5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_glossary" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."glossary_uri" NOT NULL,
  CONSTRAINT "__statistic_glossary_pk_2tcpbpbqth" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_last_updated" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_gjl5q4ofup" NOT NULL,
  CONSTRAINT "__statistic_last_updated_pk_h3evptcv4z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_std_deviation" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."statistic_measure" NOT NULL,
  CONSTRAINT "__statistic_std_deviation_pk_bhlxmss4jd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."statistic_std_error" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."statistic_measure" NOT NULL,
  CONSTRAINT "__statistic_std_error_pk_ztdamkayka" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."stats_operator" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "name" "qti"."stats_operator_name" NOT NULL,
  CONSTRAINT "__stats_operator_pk_vb3cdvabdi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."string_binding" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__string_binding_pk_plk6isv3rb" PRIMARY KEY ("node"),
  CONSTRAINT "__string_binding_key_document_identifier_xeyjihlm73" UNIQUE ("document", "identifier")
);

CREATE TABLE "qti"."string_match" (
  "case_sensitive" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "substring" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__string_match_pk_2yrytbiaer" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."strong" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__strong_pk_thqpgpemnj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."stylesheet" (
  "href" "qti"."stylesheet_uri" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "type" "qti"."content_media_type" NOT NULL,
  CONSTRAINT "__stylesheet_pk_5vkhjjv37r" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."stylesheet_media" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__stylesheet_media_pk_qw5bik2ean" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."stylesheet_title" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__stylesheet_title_pk_3uxjxbfslg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."sub" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__sub_pk_tsjpuejboy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."substring" (
  "case_sensitive" "qti"."xs_boolean" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__substring_pk_xyhgl3p6sv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."subtract" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__subtract_pk_3mqph5ppcc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."sum" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__sum_pk_x5uo2a3mdb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."summary" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__summary_pk_rpajkerfah" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."sup" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__sup_pk_frze47uv4x" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."table" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__table_pk_zrpr6gzk7s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."table_summary" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__table_summary_pk_hrkauj7n5d" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."target_object" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "position" bigint NOT NULL,
  "statistic" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__target_object_pk_ei76x42qsw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."target_object_object_type" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."target_object_type" NOT NULL,
  CONSTRAINT "__target_object_object_type_pk_2vn67xv5wf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."target_object_part_identifier" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_part_identifier" NOT NULL,
  CONSTRAINT "__target_object_part_identifier_pk_voidrtx4no" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."tbody" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tbody_pk_wc7xodoiio" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."td" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__td_pk_2jyw55d5yr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."td_abbr" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__td_abbr_pk_nyuzne34rw" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_align" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cell_align" NOT NULL,
  CONSTRAINT "__td_align_pk_7f7oa3lxzq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_axis" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__td_axis_pk_ccm7jnxuxe" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_colspan" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."table_span" NOT NULL,
  CONSTRAINT "__td_colspan_pk_wqi7s3iwct" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_rowspan" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."table_span" NOT NULL,
  CONSTRAINT "__td_rowspan_pk_x5fgi536su" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_scope" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cell_scope" NOT NULL,
  CONSTRAINT "__td_scope_pk_kdday7nnxa" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_valign" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cell_valign" NOT NULL,
  CONSTRAINT "__td_valign_pk_vvlb7gthww" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."template" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_pk_xgiwtohz5u" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_block" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__template_block_pk_4qlrw3bxyi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_condition_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_condition_arm_pk_5if3lwsukp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_constraint" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_constraint_pk_p62ienp6si" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_content_ref" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_content_ref_pk_2vkn4j32ah" PRIMARY KEY ("node"),
  CONSTRAINT "template_content_ref_type" CHECK (("cardinality" IN ('single'::"qti"."typed_cardinality", 'multiple'::"qti"."typed_cardinality") AND "base_type" = 'identifier'::"qti"."base_type") IS TRUE)
);

CREATE TABLE "qti"."template_declaration_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "math_variable" "qti"."xs_boolean" NOT NULL,
  "param_variable" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__template_declaration_arm_pk_ekiad5g2nx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_else_arm" (
  "condition" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_else_arm_pk_piarpc3rde" PRIMARY KEY ("id"),
  CONSTRAINT "__template_else_arm_key_condition_vceem34ndx" UNIQUE ("condition")
);

CREATE TABLE "qti"."template_else_if_arm" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_else_if_arm_pk_ucexwtn32p" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_feedback_block" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "outcome_identifier" "qti"."variable_reference" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  CONSTRAINT "__template_feedback_block_pk_4wuud44jqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_if_arm" (
  "condition" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_if_arm_pk_kgbpihwhko" PRIMARY KEY ("id"),
  CONSTRAINT "__template_if_arm_key_condition_r2j7wjf6gy" UNIQUE ("condition")
);

CREATE TABLE "qti"."template_inline" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."show_hide_identifier" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__template_inline_pk_p3qg43hxvz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_parameter_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."template_parameter_name" NOT NULL,
  "referrer_kind" "qti"."node_kind" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__template_parameter_ref_pk_37vwxe24iq" PRIMARY KEY ("id"),
  CONSTRAINT "template_parameter_referrer" CHECK (("referrer_kind" IN ('qti-variable'::"qti"."node_kind", 'qti-default'::"qti"."node_kind", 'qti-correct'::"qti"."node_kind", 'qti-map-response'::"qti"."node_kind", 'qti-map-response-point'::"qti"."node_kind", 'qti-set-outcome-value'::"qti"."node_kind", 'qti-lookup-outcome-value'::"qti"."node_kind", 'qti-set-template-value'::"qti"."node_kind", 'qti-set-default-value'::"qti"."node_kind", 'qti-set-correct-response'::"qti"."node_kind")) IS TRUE),
  CONSTRAINT "template_parameter_root" CHECK (("root_kind" = 'rptemplate'::"qti"."root_kind") IS TRUE)
);

CREATE TABLE "qti"."template_processing" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "item" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__template_processing_pk_s6nxl6qirh" PRIMARY KEY ("id"),
  CONSTRAINT "__template_processing_key_item_dw4vumlyl4" UNIQUE ("item")
);

CREATE TABLE "qti"."test_variables" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "variable_identifier" "qti"."variable_reference" NOT NULL,
  CONSTRAINT "__test_variables_pk_prmrb6n465" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."test_variables_base_type" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."base_type" NOT NULL,
  CONSTRAINT "__test_variables_base_type_pk_2cymaruanl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_expected_length" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."expected_length" NOT NULL,
  CONSTRAINT "__text_entry_expected_length_pk_f53z7x3ss3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_format" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_format_pk_5wceemjq3z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_interaction" (
  "base" "qti"."__text_xs56r6cx4y" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__text_entry_interaction_pk_4c2k2repwn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."text_entry_pattern_mask" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_pattern_mask_pk_fcak65viuo" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_patternmask_message" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_patternmask_message_pk_kkvaka53wd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_placeholder_text" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_placeholder_text_pk_q3cw6blcc7" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_node" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_hmmood6ekl" NOT NULL,
  CONSTRAINT "__text_node_pk_22tpscvzub" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."tfoot" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tfoot_pk_4dnzrktqln" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."th" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__th_pk_uw2e653afd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."th_abbr" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__th_abbr_pk_fhu4xjcgf6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_align" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cell_align" NOT NULL,
  CONSTRAINT "__th_align_pk_egix2hvisj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_axis" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__th_axis_pk_cot3hl23j5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_colspan" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."table_span" NOT NULL,
  CONSTRAINT "__th_colspan_pk_7hlqinqtpu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_rowspan" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."table_span" NOT NULL,
  CONSTRAINT "__th_rowspan_pk_u6umuf7fkb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_scope" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cell_scope" NOT NULL,
  CONSTRAINT "__th_scope_pk_kpt6pqgngg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_valign" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cell_valign" NOT NULL,
  CONSTRAINT "__th_valign_pk_2wugry3fwr" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."thead" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__thead_pk_eqinaidk6f" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."tr" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tr_pk_r6lilbc7ec" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."track" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."track_kind" NOT NULL,
  "src" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__track_pk_vqi4hhy75h" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."track_default" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."track_default_value" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__track_default_pk_tg3uf4jye5" PRIMARY KEY ("node"),
  CONSTRAINT "track_default_by_version" CHECK ((("value" IN ('true'::"qti"."track_default_value", 'false'::"qti"."track_default_value", '1'::"qti"."track_default_value", '0'::"qti"."track_default_value") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."track_default_value", 'false'::"qti"."track_default_value", 'default'::"qti"."track_default_value") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."track_srclang" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."track_language" NOT NULL,
  CONSTRAINT "__track_srclang_pk_xvp24vvm35" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."tree" (
  "charset" "qti"."__text_wyfa622e2r" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."tree_kind" NOT NULL,
  "root" "qti"."root_kind" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__tree_pk_xcoqlm6nqt" PRIMARY KEY ("id"),
  CONSTRAINT "manifest_root_is_manifest_tree" CHECK (("kind" = 'manifest'::"qti"."tree_kind" OR "root" <> 'manifest'::"qti"."root_kind") IS TRUE),
  CONSTRAINT "manifest_tree_has_manifest_root" CHECK (("kind" <> 'manifest'::"qti"."tree_kind" OR "root" = 'manifest'::"qti"."root_kind") IS TRUE),
  CONSTRAINT "__tree_key_id_version_root_ezbdftzuy4" UNIQUE ("id", "version", "root"),
  CONSTRAINT "__tree_key_id_kind_atw4zjatmg" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."tree_doctype" (
  "text" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tree_doctype_pk_rih2k4j4qa" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_export_charset" (
  "label" "qti"."__text_wyfa622e2r" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tree_export_charset_pk_p65tu3cdwm" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_misc" (
  "kind" "qti"."misc_kind" NOT NULL,
  "placement" "qti"."placement" NOT NULL,
  "position" bigint NOT NULL,
  "text" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tree_misc_pk_y3enpvf5gu" PRIMARY KEY ("tree", "placement", "position")
);

CREATE TABLE "qti"."tree_root" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "tree" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tree_root_pk_qiciwu2u3r" PRIMARY KEY ("tree"),
  CONSTRAINT "__tree_root_key_node_ubg4rtjyq7" UNIQUE ("node"),
  CONSTRAINT "__tree_root_key_tree_node_p4ufjrhbsm" UNIQUE ("tree", "node"),
  CONSTRAINT "__tree_root_key_node_tree_7hmixcsgnx" UNIQUE ("node", "tree")
);

CREATE TABLE "qti"."tree_xml_encoding" (
  "tree" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_wyfa622e2r" NOT NULL,
  CONSTRAINT "__tree_xml_encoding_pk_dj5tvpgs25" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_xml_standalone" (
  "tree" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."yes_no" NOT NULL,
  CONSTRAINT "__tree_xml_standalone_pk_pbqvnzrs6o" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."tree_xml_version" (
  "tree" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_r5xluaej3z" NOT NULL,
  CONSTRAINT "__tree_xml_version_pk_l6mrjnkgaa" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."truncate" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__truncate_pk_jihc6zxq3s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."tt" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__tt_pk_tmvvhmsrkh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."typed_binding" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "interaction_kind" "qti"."node_kind" NOT NULL,
  "max_count" bigint NOT NULL,
  "node" "pg_catalog"."uuid" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__typed_binding_pk_axyc57xkgj" PRIMARY KEY ("node"),
  CONSTRAINT "binding_max" CHECK (("cardinality" = 'multiple'::"qti"."typed_cardinality" OR "max_count" = 1::bigint) IS TRUE),
  CONSTRAINT "__typed_binding_key_node_cardinality_5dkui4iiaq" UNIQUE ("node", "cardinality")
);

CREATE TABLE "qti"."typed_declaration" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  CONSTRAINT "__typed_declaration_pk_zcmmxhw3lj" PRIMARY KEY ("id"),
  CONSTRAINT "__typed_declaration_key_document_identifier_ppvxmo2ouu" UNIQUE ("document", "identifier"),
  CONSTRAINT "reserved_outcome_types" CHECK (((NOT ("identifier" IN ('SCORE'::"pg_catalog"."text", 'MAXSCORE'::"pg_catalog"."text") AND "kind" = 'outcome'::"qti"."declaration_kind") OR "base_type" = 'float'::"qti"."base_type") AND (NOT ("identifier" = 'PASSED'::"pg_catalog"."text" AND "kind" = 'outcome'::"qti"."declaration_kind") OR "base_type" = 'boolean'::"qti"."base_type")) IS TRUE),
  CONSTRAINT "__typed_declaration_key_id_base_type_cardinality_fd257gl7mq" UNIQUE ("id", "base_type", "cardinality"),
  CONSTRAINT "__typed_declaration_key_id_base_type_t4fk2utvgg" UNIQUE ("id", "base_type"),
  CONSTRAINT "__typed_declaration_key_id_cardinality_kanzf7btjn" UNIQUE ("id", "cardinality"),
  CONSTRAINT "__typed_declaration_key_document_identifier_base_fx6yo6vuhe" UNIQUE ("document", "identifier", "base_type", "cardinality")
);

CREATE TABLE "qti"."typed_value_set" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__typed_value_set_pk_fsblbpp4do" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."ul" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__ul_pk_zzyb4snodu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."upload_interaction" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__upload_interaction_pk_fyqv5l6bq4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."upload_type" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_oy4m3tqgfd" NOT NULL,
  CONSTRAINT "__upload_type_pk_3kggtfbrfq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_data" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__usage_data_pk_eqdhp2h65o" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_data_key_document_afw2h62l5f" UNIQUE ("document")
);

CREATE TABLE "qti"."usage_data_glossary" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."glossary_uri" NOT NULL,
  CONSTRAINT "__usage_data_glossary_pk_is4opab36m" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_map_entry" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "map_key" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "mapped_value" "qti"."usage_mapping_score" NOT NULL,
  "mapping" "pg_catalog"."uuid" NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__usage_map_entry_pk_ohtxe2v3xe" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_map_entry_case_sensitive" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."xs_boolean" NOT NULL,
  CONSTRAINT "__usage_map_entry_case_sensitive_pk_2dhqvfbfnq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_mapping" (
  "default_value" "qti"."usage_mapping_score" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "statistic" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__usage_mapping_pk_fjex3ha54i" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_mapping_key_statistic_ml26jyw5me" UNIQUE ("statistic")
);

CREATE TABLE "qti"."usage_mapping_lower_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_mapping_score" NOT NULL,
  CONSTRAINT "__usage_mapping_lower_bound_pk_545vfbex4f" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_mapping_upper_bound" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_mapping_score" NOT NULL,
  CONSTRAINT "__usage_mapping_upper_bound_pk_cfj37xex6z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."usage_typed_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_typed_value_pk_co4ojdjfxi" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_typed_value_key_id_base_type_n242bzi26w" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."usage_typed_value_boolean" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."boolean_literal" NOT NULL,
  CONSTRAINT "__usage_typed_value_boolean_pk_goxiaczxth" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_directed_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_directed_pair_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_directed_pair_pk_rdxysa6ezx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_duration" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_duration_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_duration_pk_iknzbe3zpy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_file" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_typed_value_file_pk_jvdl27ylne" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_float" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_float_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_float_pk_zkonlclfg7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_identifier_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_identifier_pk_dhkfebawe7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_integer" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_integer_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_integer_pk_ijoddnaeqm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_pair" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_pair_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_pair_pk_eiy2hub3jo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_point" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_point_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_point_pk_uqgzdqkv3s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_string" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_typed_value_string_pk_sbvusmwwrs" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_typed_value_uri" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_uri_value" NOT NULL,
  CONSTRAINT "__usage_typed_value_uri_pk_7gc52aqoiu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."usage_value" (
  "collapsed" "qti"."usage_value_token" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "statistic" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__usage_value_pk_i2ykr2qbnf" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_value_key_statistic_6izaekkxsa" UNIQUE ("statistic"),
  CONSTRAINT "__usage_value_key_id_value_34zlji3jcu" UNIQUE ("id", "value")
);

CREATE TABLE "qti"."usage_value_base_type" (
  "base_type" "qti"."base_type" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__usage_value_base_type_pk_v6447uyhax" PRIMARY KEY ("id"),
  CONSTRAINT "__usage_value_base_type_key_id_base_type_cmqbeas3nz" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."usage_value_field_identifier" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."usage_field_identifier" NOT NULL,
  CONSTRAINT "__usage_value_field_identifier_pk_o2efcppipi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."value_set" (
  "declaration" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "role" "qti"."value_role" NOT NULL,
  "shape" "qti"."declaration_shape" NOT NULL,
  CONSTRAINT "__value_set_pk_aviyvdskxo" PRIMARY KEY ("id"),
  CONSTRAINT "__value_set_key_declaration_role_4stlepfimk" UNIQUE ("declaration", "role"),
  CONSTRAINT "__value_set_key_id_declaration_hkaytoxio7" UNIQUE ("id", "declaration"),
  CONSTRAINT "__value_set_key_id_shape_mgay3c5bmp" UNIQUE ("id", "shape"),
  CONSTRAINT "__value_set_key_id_role_3wmhajx4d2" UNIQUE ("id", "role")
);

CREATE TABLE "qti"."value_set_interpretation" (
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "value_set" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__value_set_interpretation_pk_ieijhj5gvd" PRIMARY KEY ("value_set")
);

CREATE TABLE "qti"."var" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__var_pk_7vlnptqnkv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."variable" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__variable_pk_uw2snpik7k" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."variable_ref" (
  "document" "pg_catalog"."uuid" NOT NULL,
  "id" "pg_catalog"."uuid" NOT NULL,
  "kind" "qti"."ref_kind" NOT NULL,
  CONSTRAINT "__variable_ref_pk_xysknydg4p" PRIMARY KEY ("id"),
  CONSTRAINT "__variable_ref_key_id_kind_trsdltzwu4" UNIQUE ("id", "kind")
);

CREATE TABLE "qti"."variable_weight_identifier" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "value" "qti"."weight_reference" NOT NULL,
  CONSTRAINT "__variable_weight_identifier_pk_5cjde2q7ie" PRIMARY KEY ("node"),
  CONSTRAINT "variable_weight_in_test" CHECK (("root_kind" = 'test'::"qti"."root_kind") IS TRUE)
);

CREATE TABLE "qti"."variant" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "identifier" "qti"."manifest_identifier" NOT NULL,
  "identifierref" "qti"."manifest_identifier" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "resource" "pg_catalog"."uuid" NOT NULL,
  "resource_identifier" "qti"."manifest_identifier" NOT NULL,
  CONSTRAINT "__variant_pk_2v76wn4lby" PRIMARY KEY ("id"),
  CONSTRAINT "__variant_key_package_identifier_ydffbrgs2g" UNIQUE ("package", "identifier"),
  CONSTRAINT "variant_not_self" CHECK (("identifierref" <> "resource_identifier") IS TRUE)
);

CREATE TABLE "qti"."variant_metadata" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "variant" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__variant_metadata_pk_vsyvrlpnm2" PRIMARY KEY ("id"),
  CONSTRAINT "__variant_metadata_key_variant_7uhcph353w" UNIQUE ("variant")
);

CREATE TABLE "qti"."video" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_pk_p5d5gq5j4y" PRIMARY KEY ("id"),
  CONSTRAINT "__video_key_id_version_65sd4fkbyx" UNIQUE ("id", "version")
);

CREATE TABLE "qti"."video_autoplay" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_autoplay" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_autoplay_pk_r2elao64cp" PRIMARY KEY ("node"),
  CONSTRAINT "video_autoplay_by_version" CHECK ((("value" IN ('true'::"qti"."media_autoplay", 'false'::"qti"."media_autoplay", '1'::"qti"."media_autoplay", '0'::"qti"."media_autoplay") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_autoplay", 'false'::"qti"."media_autoplay", 'autoplay'::"qti"."media_autoplay") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_controls" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_controls" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_controls_pk_mdl3aj52kp" PRIMARY KEY ("node"),
  CONSTRAINT "video_controls_by_version" CHECK ((("value" IN ('true'::"qti"."media_controls", 'false'::"qti"."media_controls", '1'::"qti"."media_controls", '0'::"qti"."media_controls") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_controls", 'false'::"qti"."media_controls", 'controls'::"qti"."media_controls") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_crossorigin" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."cross_origin" NOT NULL,
  CONSTRAINT "__video_crossorigin_pk_c3arw7o75g" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_height" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__video_height_pk_ty67tcu4z3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_loop" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_loop" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_loop_pk_7cffrvupqb" PRIMARY KEY ("node"),
  CONSTRAINT "video_loop_by_version" CHECK ((("value" IN ('true'::"qti"."media_loop", 'false'::"qti"."media_loop", '1'::"qti"."media_loop", '0'::"qti"."media_loop") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_loop", 'false'::"qti"."media_loop", 'loop'::"qti"."media_loop") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_mediagroup" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__video_mediagroup_pk_svyg5qrz5y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_muted" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_muted" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_muted_pk_izxjhayjoe" PRIMARY KEY ("node"),
  CONSTRAINT "video_muted_by_version" CHECK ((("value" IN ('true'::"qti"."media_muted", 'false'::"qti"."media_muted", '1'::"qti"."media_muted", '0'::"qti"."media_muted") OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::"qti"."media_muted", 'false'::"qti"."media_muted", 'muted'::"qti"."media_muted") OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_poster" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__video_poster_pk_ar5e4wlfb4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_preload" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."media_preload" NOT NULL,
  CONSTRAINT "__video_preload_pk_p5b37jnj5t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_src" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__video_src_pk_cuwhl4exxk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_width" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__video_width_pk_exjzuavufg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."ws" (
  "id" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."__text_ottycep7en" NOT NULL,
  CONSTRAINT "__ws_pk_rt3xgtnvrh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."x_include" (
  "id" "pg_catalog"."uuid" NOT NULL,
  CONSTRAINT "__x_include_pk_pq26xdbsr2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."x_include_accept" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_accept_pk_bbdlyyklyj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_accept_language" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_accept_language_pk_zoi5c6eu5q" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_encoding" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_encoding_pk_ycj6l57qqa" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_href" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."x_include_uri" NOT NULL,
  CONSTRAINT "__x_include_href_pk_tcda3sytvb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_parse" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "qti"."x_include_parse_value" NOT NULL,
  CONSTRAINT "__x_include_parse_pk_sna47bsnxm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."x_include_xpointer" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "value" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__x_include_xpointer_pk_t2wlgmegik" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."a" ADD COLUMN "__tag_kind_a_nnzx4rhgd5" "qti"."node_kind" GENERATED ALWAYS AS ('a'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."abbr" ADD COLUMN "__tag_kind_abbr_hrjkr2qds6" "qti"."node_kind" GENERATED ALWAYS AS ('abbr'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."access_for_all_resource" ADD COLUMN "__tag_kind_drd_access_for_all_resource_dcvrnrucvz" "qti"."node_kind" GENERATED ALWAYS AS ('drd:accessForAllResource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."acronym" ADD COLUMN "__tag_kind_acronym_vins4r6mib" "qti"."node_kind" GENERATED ALWAYS AS ('acronym'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."address" ADD COLUMN "__tag_kind_address_v7uvpjblbr" "qti"."node_kind" GENERATED ALWAYS AS ('address'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."and" ADD COLUMN "__tag_kind_qti_and_hietom4ymf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-and'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."any_n" ADD COLUMN "__tag_kind_qti_any_n_7fjipr6x66" "qti"."node_kind" GENERATED ALWAYS AS ('qti-any-n'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."area_map_entry" ADD COLUMN "__tag_kind_qti_area_map_entry_ipn4oixdsm" "qti"."node_kind" GENERATED ALWAYS AS ('qti-area-map-entry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."area_mapping" ADD COLUMN "__tag_kind_qti_area_mapping_rozg3o46o7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-area-mapping'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."area_mapping" ADD COLUMN "__tag_base_type_point_t72vrgkw7u" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."article" ADD COLUMN "__tag_kind_article_q5bbr6phbo" "qti"."node_kind" GENERATED ALWAYS AS ('article'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."aside" ADD COLUMN "__tag_kind_aside_623qjlqyr6" "qti"."node_kind" GENERATED ALWAYS AS ('aside'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."assessment_item" ADD COLUMN "__tag_kind_qti_assessment_item_lutv7awadt" "qti"."node_kind" GENERATED ALWAYS AS ('qti-assessment-item'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."associable_hotspot" ADD COLUMN "__tag_kind_qti_associable_hotspot_s44ub3cnnd" "qti"."node_kind" GENERATED ALWAYS AS ('qti-associable-hotspot'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."associate_interaction" ADD COLUMN "__tag_kind_qti_associate_interaction_mmhr3ccr2w" "qti"."node_kind" GENERATED ALWAYS AS ('qti-associate-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."audio" ADD COLUMN "__tag_kind_audio_ody3p7lpzb" "qti"."node_kind" GENERATED ALWAYS AS ('audio'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."b" ADD COLUMN "__tag_kind_b_eugn3uhkgh" "qti"."node_kind" GENERATED ALWAYS AS ('b'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."bdi" ADD COLUMN "__tag_kind_bdi_bpifxwd52f" "qti"."node_kind" GENERATED ALWAYS AS ('bdi'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."bdo" ADD COLUMN "__tag_kind_bdo_wrzsnb2sme" "qti"."node_kind" GENERATED ALWAYS AS ('bdo'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."big" ADD COLUMN "__tag_kind_big_5cuhs57aze" "qti"."node_kind" GENERATED ALWAYS AS ('big'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."blockquote" ADD COLUMN "__tag_kind_blockquote_pzalnulzij" "qti"."node_kind" GENERATED ALWAYS AS ('blockquote'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."br" ADD COLUMN "__tag_kind_br_e2kqhk7bmv" "qti"."node_kind" GENERATED ALWAYS AS ('br'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."built_in_ref" ADD COLUMN "__tag_kind_built_in_a5gr6jz3gp" "qti"."ref_kind" GENERATED ALWAYS AS ('builtIn'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."caption" ADD COLUMN "__tag_kind_caption_5ewe5uufgf" "qti"."node_kind" GENERATED ALWAYS AS ('caption'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."catalog_info" ADD COLUMN "__tag_kind_qti_catalog_info_s44bpzmt5j" "qti"."node_kind" GENERATED ALWAYS AS ('qti-catalog-info'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."categorized_statistic_arm" ADD COLUMN "__tag_kind_ud_categorized_statistic_6idrz3enis" "qti"."node_kind" GENERATED ALWAYS AS ('ud:categorizedStatistic'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."categorized_statistic_arm" ADD COLUMN "__tag_kind_categorized_mbhnwjzukq" "qti"."statistic_kind" GENERATED ALWAYS AS ('categorized'::"qti"."statistic_kind") STORED NOT NULL;

ALTER TABLE "qti"."choice_interaction" ADD COLUMN "__tag_kind_qti_choice_interaction_lrhq33h2cc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-choice-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."choice_template_ref" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."cite" ADD COLUMN "__tag_kind_cite_4ll5xji4xt" "qti"."node_kind" GENERATED ALWAYS AS ('cite'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."code" ADD COLUMN "__tag_kind_code_2sjxqe2lm5" "qti"."node_kind" GENERATED ALWAYS AS ('code'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."col" ADD COLUMN "__tag_kind_col_5ijislolfm" "qti"."node_kind" GENERATED ALWAYS AS ('col'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."colgroup" ADD COLUMN "__tag_kind_colgroup_3gqxythtyf" "qti"."node_kind" GENERATED ALWAYS AS ('colgroup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."comment" ADD COLUMN "__tag_kind_comment_nmb7feek53" "qti"."node_kind" GENERATED ALWAYS AS ('comment'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."companion_materials_info" ADD COLUMN "__tag_kind_qti_companion_materials_info_ndsygptfy3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-companion-materials-info'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."container_size" ADD COLUMN "__tag_kind_qti_container_size_ffge7oxu2m" "qti"."node_kind" GENERATED ALWAYS AS ('qti-container-size'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."contains" ADD COLUMN "__tag_kind_qti_contains_ffvmh3ao5n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-contains'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."content_body_feedback" ADD COLUMN "__tag_kind_qti_content_body_feedback_y5ggovqlad" "qti"."node_kind" GENERATED ALWAYS AS ('qti-content-body.feedback'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."content_body_modal" ADD COLUMN "__tag_kind_qti_content_body_modal_3mvh5kt4vk" "qti"."node_kind" GENERATED ALWAYS AS ('qti-content-body.modal'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."content_body_rubric" ADD COLUMN "__tag_kind_qti_content_body_rubric_a6paqpk4uz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-content-body.rubric'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."content_body_rubric_template" ADD COLUMN "__tag_kind_qti_content_body_rubric_template_vri73ijlw5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-content-body.rubricTemplate'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."content_body_template" ADD COLUMN "__tag_kind_qti_content_body_template_5bgw5mu5a4" "qti"."node_kind" GENERATED ALWAYS AS ('qti-content-body.template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."context_declaration_arm" ADD COLUMN "__tag_kind_context_ebo2ipjj7k" "qti"."declaration_kind" GENERATED ALWAYS AS ('context'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."context_declaration_arm" ADD COLUMN "__tag_kind_qti_context_declaration_ooqez2egyz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-context-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."context_declaration_id" ADD COLUMN "__tag_holder_context_declaration_i5zus6a3u6" "qti"."id_holder" GENERATED ALWAYS AS ('contextDeclaration'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."coords_circle" ADD COLUMN "__tag_shape_circle_of6ebmy3mb" "qti"."shape" GENERATED ALWAYS AS ('circle'::"qti"."shape") STORED NOT NULL;

ALTER TABLE "qti"."coords_default" ADD COLUMN "__tag_shape_default_3zivvvfwas" "qti"."shape" GENERATED ALWAYS AS ('default'::"qti"."shape") STORED NOT NULL;

ALTER TABLE "qti"."coords_ellipse" ADD COLUMN "__tag_shape_ellipse_lu2mxwxu6y" "qti"."shape" GENERATED ALWAYS AS ('ellipse'::"qti"."shape") STORED NOT NULL;

ALTER TABLE "qti"."coords_poly" ADD COLUMN "__tag_shape_poly_u6dhqqfxgj" "qti"."shape" GENERATED ALWAYS AS ('poly'::"qti"."shape") STORED NOT NULL;

ALTER TABLE "qti"."coords_rect" ADD COLUMN "__tag_shape_rect_jgr525splx" "qti"."shape" GENERATED ALWAYS AS ('rect'::"qti"."shape") STORED NOT NULL;

ALTER TABLE "qti"."correct" ADD COLUMN "__tag_kind_qti_correct_adce6nmlck" "qti"."node_kind" GENERATED ALWAYS AS ('qti-correct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."correct_response_arm" ADD COLUMN "__tag_kind_qti_correct_response_y6bjt74uq7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-correct-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."correct_response_arm" ADD COLUMN "__tag_role_correct_a6k2xxecvb" "qti"."value_role" GENERATED ALWAYS AS ('correct'::"qti"."value_role") STORED NOT NULL;

ALTER TABLE "qti"."csm_case_item_uri" ADD COLUMN "__tag_kind_csmd_case_item_uri_lxp27cu62q" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:caseItemURI'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_guid" ADD COLUMN "__tag_kind_csmd_guid_zslp2vpfy4" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:GUID'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_label" ADD COLUMN "__tag_kind_csmd_label_fz6gvoerne" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:label'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_labelled_guid" ADD COLUMN "__tag_kind_csmd_labelled_guid_xvmt4w5scu" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:labelledGUID'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_metadata" ADD COLUMN "__tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:curriculumStandardsMetadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_set" ADD COLUMN "__tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:curriculumStandardsMetadataSet'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."csm_set_of_guids" ADD COLUMN "__tag_kind_csmd_set_of_gui_ds_wsrxqslv22" "qti"."node_kind" GENERATED ALWAYS AS ('csmd:setOfGUIDs'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."custom_operator" ADD COLUMN "__tag_kind_qti_custom_operator_hgnfdy7pnw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-custom-operator'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dd" ADD COLUMN "__tag_kind_dd_fz7u3fe6ih" "qti"."node_kind" GENERATED ALWAYS AS ('dd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."declared_ref" ADD COLUMN "__tag_kind_declared_chtay4st64" "qti"."ref_kind" GENERATED ALWAYS AS ('declared'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."declared_value" ADD COLUMN "__tag_kind_qti_value_a22pfhf3za" "qti"."node_kind" GENERATED ALWAYS AS ('qti-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_boolean" ADD COLUMN "__tag_base_type_boolean_kh6dvyf44c" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_v5chnfdlrm" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_duration" ADD COLUMN "__tag_base_type_duration_kk5q7nzzuo" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_file" ADD COLUMN "__tag_base_type_file_pesir3i32k" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_float" ADD COLUMN "__tag_base_type_float_3szfpoo33f" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_identifier" ADD COLUMN "__tag_base_type_identifier_skvmp74o7n" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_integer" ADD COLUMN "__tag_base_type_integer_azuvzqcuvs" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_pair" ADD COLUMN "__tag_base_type_pair_m6e2ivamry" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_point" ADD COLUMN "__tag_base_type_point_c2g2yehgpw" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_string" ADD COLUMN "__tag_base_type_string_hs2lnlklfn" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."declared_value_uri" ADD COLUMN "__tag_base_type_uri_7nvvazwudq" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."default" ADD COLUMN "__tag_kind_qti_default_jhwhuox3of" "qti"."node_kind" GENERATED ALWAYS AS ('qti-default'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."default_value_arm" ADD COLUMN "__tag_kind_qti_default_value_ectibzonfr" "qti"."node_kind" GENERATED ALWAYS AS ('qti-default-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."default_value_arm" ADD COLUMN "__tag_role_default_st3rg3iau2" "qti"."value_role" GENERATED ALWAYS AS ('default'::"qti"."value_role") STORED NOT NULL;

ALTER TABLE "qti"."delete" ADD COLUMN "__tag_kind_qti_delete_w5w6qiomne" "qti"."node_kind" GENERATED ALWAYS AS ('qti-delete'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dependency" ADD COLUMN "__tag_kind_cp_dependency_zkvh26cbdi" "qti"."node_kind" GENERATED ALWAYS AS ('cp:dependency'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."details" ADD COLUMN "__tag_kind_details_mgnz5owncp" "qti"."node_kind" GENERATED ALWAYS AS ('details'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dfn" ADD COLUMN "__tag_kind_dfn_xgpywzxjkn" "qti"."node_kind" GENERATED ALWAYS AS ('dfn'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."div" ADD COLUMN "__tag_kind_div_tqs6ldkv65" "qti"."node_kind" GENERATED ALWAYS AS ('div'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."divide" ADD COLUMN "__tag_kind_qti_divide_dgjmhfkvv3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-divide'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dl" ADD COLUMN "__tag_kind_dl_aw2ei3s2i4" "qti"."node_kind" GENERATED ALWAYS AS ('dl'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."document" ADD COLUMN "__tag_kind_document_3ilsmwej65" "qti"."tree_kind" GENERATED ALWAYS AS ('document'::"qti"."tree_kind") STORED NOT NULL;

ALTER TABLE "qti"."drawing_interaction" ADD COLUMN "__tag_kind_qti_drawing_interaction_i7yf6jyigs" "qti"."node_kind" GENERATED ALWAYS AS ('qti-drawing-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_access_mode" ADD COLUMN "__tag_kind_drd_access_mode_njghsaxgib" "qti"."node_kind" GENERATED ALWAYS AS ('drd:accessMode'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD COLUMN "__tag_kind_drd_access_mode_adapted_6n47kwzvq4" "qti"."node_kind" GENERATED ALWAYS AS ('drd:accessModeAdapted'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_adaptation_detail" ADD COLUMN "__tag_kind_drd_adaptation_detail_q4chm2z7fd" "qti"."node_kind" GENERATED ALWAYS AS ('drd:adaptationDetail'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD COLUMN "__tag_kind_drd_adaptation_media_type_ms4x34iisf" "qti"."node_kind" GENERATED ALWAYS AS ('drd:adaptationMediaType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_adaptation_type" ADD COLUMN "__tag_kind_drd_adaptation_type_cr4axc6ol7" "qti"."node_kind" GENERATED ALWAYS AS ('drd:adaptationType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_api_interoperable" ADD COLUMN "__tag_kind_drd_api_interoperable_qnxbi5kb5p" "qti"."node_kind" GENERATED ALWAYS AS ('drd:apiInteroperable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_at_interoperable" ADD COLUMN "__tag_kind_drd_at_interoperable_zjkivbnkxx" "qti"."node_kind" GENERATED ALWAYS AS ('drd:atInteroperable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_control_flexibility" ADD COLUMN "__tag_kind_drd_control_flexibility_ogpln6c34g" "qti"."node_kind" GENERATED ALWAYS AS ('drd:controlFlexibility'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_display_transformability" ADD COLUMN "__tag_kind_drd_display_transformability_hlcmwybrbn" "qti"."node_kind" GENERATED ALWAYS AS ('drd:displayTransformability'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD COLUMN "__tag_kind_drd_educational_complexity_of_adaptation_mfzwmr74m2" "qti"."node_kind" GENERATED ALWAYS AS ('drd:educationalComplexityOfAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD COLUMN "__tag_kind_drd_educational_level_of_adaptation_ezcznxqajt" "qti"."node_kind" GENERATED ALWAYS AS ('drd:educationalLevelOfAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_has_adaptation" ADD COLUMN "__tag_kind_drd_has_adaptation_4x7nx53hok" "qti"."node_kind" GENERATED ALWAYS AS ('drd:hasAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_hazard" ADD COLUMN "__tag_kind_drd_hazard_3n5ihtfyij" "qti"."node_kind" GENERATED ALWAYS AS ('drd:hazard'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD COLUMN "__tag_kind_drd_is_adaptation_of_viq3qn3bmy" "qti"."node_kind" GENERATED ALWAYS AS ('drd:isAdaptationOf'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD COLUMN "__tag_kind_drd_is_full_adaptation_of_tvwox3ztrp" "qti"."node_kind" GENERATED ALWAYS AS ('drd:isFullAdaptationOf'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD COLUMN "__tag_kind_drd_is_partial_adaptation_of_5ojegjo7cp" "qti"."node_kind" GENERATED ALWAYS AS ('drd:isPartialAdaptationOf'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD COLUMN "__tag_kind_drd_language_of_adaptation_p3eiulmmnm" "qti"."node_kind" GENERATED ALWAYS AS ('drd:languageOfAdaptation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dt" ADD COLUMN "__tag_kind_dt_se6ui3fyrg" "qti"."node_kind" GENERATED ALWAYS AS ('dt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."duration_gte" ADD COLUMN "__tag_kind_qti_duration_gte_lzoivglsok" "qti"."node_kind" GENERATED ALWAYS AS ('qti-duration-gte'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."duration_lt" ADD COLUMN "__tag_kind_qti_duration_lt_xn3larffx7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-duration-lt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."em" ADD COLUMN "__tag_kind_em_ooisxn7pss" "qti"."node_kind" GENERATED ALWAYS AS ('em'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."end_attempt_interaction" ADD COLUMN "__tag_kind_qti_end_attempt_interaction_ez7tuuts3e" "qti"."node_kind" GENERATED ALWAYS AS ('qti-end-attempt-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."entity_reference" ADD COLUMN "__tag_kind_entity_ref_vjzwdvldjb" "qti"."node_kind" GENERATED ALWAYS AS ('entityRef'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."equal" ADD COLUMN "__tag_kind_qti_equal_srgxur27t7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-equal'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."equal_rounded" ADD COLUMN "__tag_kind_qti_equal_rounded_v6objmsi4d" "qti"."node_kind" GENERATED ALWAYS AS ('qti-equal-rounded'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."equal_rounded_figures_ref" ADD COLUMN "__tag_figures_kind_ref_zxnonbgyte" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

ALTER TABLE "qti"."exit_response" ADD COLUMN "__tag_kind_qti_exit_response_7dymabqkc4" "qti"."node_kind" GENERATED ALWAYS AS ('qti-exit-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."exit_template" ADD COLUMN "__tag_kind_qti_exit_template_ifkvvzdxdx" "qti"."node_kind" GENERATED ALWAYS AS ('qti-exit-template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."exit_test" ADD COLUMN "__tag_kind_qti_exit_test_ju554ikqov" "qti"."node_kind" GENERATED ALWAYS AS ('qti-exit-test'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."extended_text_interaction" ADD COLUMN "__tag_kind_qti_extended_text_interaction_a2k2mcqdlw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-extended-text-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."external_lom" ADD COLUMN "__tag_root_external_lom_dv2arbt3fq" "qti"."root_kind" GENERATED ALWAYS AS ('externalLom'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."external_lom" ADD COLUMN "__tag_owner_external_yt3hiwiixf" "qti"."lom_owner" GENERATED ALWAYS AS ('external'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."fallback" ADD COLUMN "__tag_kind_xi_fallback_mi6ozofd6d" "qti"."node_kind" GENERATED ALWAYS AS ('xi:fallback'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."feedback_block" ADD COLUMN "__tag_kind_qti_feedback_block_fzyzb3m667" "qti"."node_kind" GENERATED ALWAYS AS ('qti-feedback-block'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."feedback_inline" ADD COLUMN "__tag_kind_qti_feedback_inline_fxa2ds5jsw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-feedback-inline'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."feedback_outcome_ref" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."field_value" ADD COLUMN "__tag_kind_qti_field_value_2z2wrjjwbo" "qti"."node_kind" GENERATED ALWAYS AS ('qti-field-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."figcaption" ADD COLUMN "__tag_kind_figcaption_kg34hwzy6b" "qti"."node_kind" GENERATED ALWAYS AS ('figcaption'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."figure" ADD COLUMN "__tag_kind_figure_m2nqyu772u" "qti"."node_kind" GENERATED ALWAYS AS ('figure'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."file" ADD COLUMN "__tag_kind_cp_file_lmc4p5hp74" "qti"."node_kind" GENERATED ALWAYS AS ('cp:file'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."file_lom" ADD COLUMN "__tag_owner_file_gyehcaynyu" "qti"."lom_owner" GENERATED ALWAYS AS ('file'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."file_metadata" ADD COLUMN "__tag_kind_cp_metadata_file_ec5cdzv4wr" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.file'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."footer" ADD COLUMN "__tag_kind_footer_vxrcx7653b" "qti"."node_kind" GENERATED ALWAYS AS ('footer'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap" ADD COLUMN "__tag_kind_qti_gap_t5z2t37bta" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap_img" ADD COLUMN "__tag_kind_qti_gap_img_cika2xmkoz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap-img'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap_match_interaction" ADD COLUMN "__tag_kind_qti_gap_match_interaction_sa3eog3yil" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap-match-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap_text" ADD COLUMN "__tag_kind_qti_gap_text_me5pobfhjy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap-text'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gcd" ADD COLUMN "__tag_kind_qti_gcd_fif4dvbbgi" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gcd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."graphic_associate_interaction" ADD COLUMN "__tag_kind_qti_graphic_associate_interaction_cf7kbgfftm" "qti"."node_kind" GENERATED ALWAYS AS ('qti-graphic-associate-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."graphic_gap_match_interaction" ADD COLUMN "__tag_kind_qti_graphic_gap_match_interaction_7hgn4d2ulo" "qti"."node_kind" GENERATED ALWAYS AS ('qti-graphic-gap-match-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."graphic_order_interaction" ADD COLUMN "__tag_kind_qti_graphic_order_interaction_f6g47z3ihc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-graphic-order-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gt" ADD COLUMN "__tag_kind_qti_gt_jyjg6yqgqv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gte" ADD COLUMN "__tag_kind_qti_gte_gurw6edziz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gte'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."h_1" ADD COLUMN "__tag_kind_h_1_6iifpaqhv7" "qti"."node_kind" GENERATED ALWAYS AS ('h1'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."h_2" ADD COLUMN "__tag_kind_h_2_huvmppuekh" "qti"."node_kind" GENERATED ALWAYS AS ('h2'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."h_3" ADD COLUMN "__tag_kind_h_3_wxdunj7d7m" "qti"."node_kind" GENERATED ALWAYS AS ('h3'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."h_4" ADD COLUMN "__tag_kind_h_4_t2jt4irrfn" "qti"."node_kind" GENERATED ALWAYS AS ('h4'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."h_5" ADD COLUMN "__tag_kind_h_5_yoaxpgpdkr" "qti"."node_kind" GENERATED ALWAYS AS ('h5'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."h_6" ADD COLUMN "__tag_kind_h_6_y5ycm7ztvp" "qti"."node_kind" GENERATED ALWAYS AS ('h6'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."header" ADD COLUMN "__tag_kind_header_5lbsjaftbl" "qti"."node_kind" GENERATED ALWAYS AS ('header'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."headers_target" ADD COLUMN "__tag_kind_th_wpezcjlql2" "qti"."node_kind" GENERATED ALWAYS AS ('th'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."hotspot_choice" ADD COLUMN "__tag_kind_qti_hotspot_choice_4h532vhjmn" "qti"."node_kind" GENERATED ALWAYS AS ('qti-hotspot-choice'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."hotspot_interaction" ADD COLUMN "__tag_kind_qti_hotspot_interaction_36p72w7q2z" "qti"."node_kind" GENERATED ALWAYS AS ('qti-hotspot-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."hottext" ADD COLUMN "__tag_kind_qti_hottext_wysowujcts" "qti"."node_kind" GENERATED ALWAYS AS ('qti-hottext'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."hottext_interaction" ADD COLUMN "__tag_kind_qti_hottext_interaction_4z6zllelqi" "qti"."node_kind" GENERATED ALWAYS AS ('qti-hottext-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."hr" ADD COLUMN "__tag_kind_hr_ugkqxcyyf4" "qti"."node_kind" GENERATED ALWAYS AS ('hr'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."html_id" ADD COLUMN "__tag_holder_html_id_rvco6j7tck" "qti"."id_holder" GENERATED ALWAYS AS ('htmlId'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."i" ADD COLUMN "__tag_kind_i_5mff2xdi4o" "qti"."node_kind" GENERATED ALWAYS AS ('i'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."img" ADD COLUMN "__tag_kind_img_i7yel3m6ld" "qti"."node_kind" GENERATED ALWAYS AS ('img'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."index" ADD COLUMN "__tag_kind_qti_index_ekqtqbvpem" "qti"."node_kind" GENERATED ALWAYS AS ('qti-index'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."index_n_ref" ADD COLUMN "__tag_n_kind_ref_ffmcx5ok6w" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

ALTER TABLE "qti"."inline_choice" ADD COLUMN "__tag_kind_qti_inline_choice_vqtv2okj5a" "qti"."node_kind" GENERATED ALWAYS AS ('qti-inline-choice'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."inline_choice_interaction" ADD COLUMN "__tag_kind_qti_inline_choice_interaction_zutl6a477r" "qti"."node_kind" GENERATED ALWAYS AS ('qti-inline-choice-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."inside" ADD COLUMN "__tag_kind_qti_inside_uqwtkeu4d6" "qti"."node_kind" GENERATED ALWAYS AS ('qti-inside'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."integer_divide" ADD COLUMN "__tag_kind_qti_integer_divide_p6arj4ose5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-integer-divide'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."integer_modulus" ADD COLUMN "__tag_kind_qti_integer_modulus_3qu7obkveq" "qti"."node_kind" GENERATED ALWAYS AS ('qti-integer-modulus'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."integer_to_float" ADD COLUMN "__tag_kind_qti_integer_to_float_hdfmecar27" "qti"."node_kind" GENERATED ALWAYS AS ('qti-integer-to-float'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."interaction_binding" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table" ADD COLUMN "__tag_kind_qti_interpolation_table_qttyjwjmqu" "qti"."node_kind" GENERATED ALWAYS AS ('qti-interpolation-table'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table" ADD COLUMN "__tag_cardinality_single_b63ah65un6" "qti"."typed_cardinality" GENERATED ALWAYS AS ('single'::"qti"."typed_cardinality") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_boolean" ADD COLUMN "__tag_base_type_boolean_kmoyqefo5c" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_srbue2pn2g" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_duration" ADD COLUMN "__tag_base_type_duration_wwywzpo3hs" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_file" ADD COLUMN "__tag_base_type_file_nz4mrice3f" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_float" ADD COLUMN "__tag_base_type_float_rpwgeoyaqd" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_identifier" ADD COLUMN "__tag_base_type_identifier_xwwtsnpwy5" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_integer" ADD COLUMN "__tag_base_type_integer_2zz3sqvn6m" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_pair" ADD COLUMN "__tag_base_type_pair_ow7hlz4qcb" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_point" ADD COLUMN "__tag_base_type_point_pxuqylzqar" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_string" ADD COLUMN "__tag_base_type_string_3gby3zbufp" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_default_value_uri" ADD COLUMN "__tag_base_type_uri_qohnv2fqlp" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry" ADD COLUMN "__tag_kind_qti_interpolation_table_entry_pkghxhscxu" "qti"."node_kind" GENERATED ALWAYS AS ('qti-interpolation-table-entry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_boolean" ADD COLUMN "__tag_base_type_boolean_p3337uv44n" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_rtqucqk6ky" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_duration" ADD COLUMN "__tag_base_type_duration_mdopxaqe3i" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_file" ADD COLUMN "__tag_base_type_file_dla4l5kfr4" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_float" ADD COLUMN "__tag_base_type_float_trm5iccdba" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_identifier" ADD COLUMN "__tag_base_type_identifier_exiriy4dvp" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_integer" ADD COLUMN "__tag_base_type_integer_b4eipddhol" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_pair" ADD COLUMN "__tag_base_type_pair_7hx4thzdtk" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_point" ADD COLUMN "__tag_base_type_point_a6dymphvan" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_string" ADD COLUMN "__tag_base_type_string_ubbjkb3enq" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."interpolation_table_entry_uri" ADD COLUMN "__tag_base_type_uri_engx47ongp" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."is_null" ADD COLUMN "__tag_kind_qti_is_null_ibjh6ibqii" "qti"."node_kind" GENERATED ALWAYS AS ('qti-is-null'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_body" ADD COLUMN "__tag_kind_qti_item_body_jcju2zecro" "qti"."node_kind" GENERATED ALWAYS AS ('qti-item-body'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."item_body_id" ADD COLUMN "__tag_holder_item_body_aqj24xldnt" "qti"."id_holder" GENERATED ALWAYS AS ('itemBody'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_both" ADD COLUMN "__tag_shape_both_w7wtd5psrj" "qti"."tool_shape" GENERATED ALWAYS AS ('both'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_name" ADD COLUMN "__tag_shape_name_only_ovf2oodbcw" "qti"."tool_shape" GENERATED ALWAYS AS ('nameOnly'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_version" ADD COLUMN "__tag_shape_version_only_xss26qzv7y" "qti"."tool_shape" GENERATED ALWAYS AS ('versionOnly'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."kbd" ADD COLUMN "__tag_kind_kbd_dwx2olhbhz" "qti"."node_kind" GENERATED ALWAYS AS ('kbd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."label" ADD COLUMN "__tag_kind_label_pyyrnslja3" "qti"."node_kind" GENERATED ALWAYS AS ('label'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lcm" ADD COLUMN "__tag_kind_qti_lcm_e3pbv2j3vf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lcm'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."li" ADD COLUMN "__tag_kind_li_jjtjuvu2xr" "qti"."node_kind" GENERATED ALWAYS AS ('li'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."literal" ADD COLUMN "__tag_kind_qti_base_value_s2tktoudmi" "qti"."node_kind" GENERATED ALWAYS AS ('qti-base-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."literal_boolean" ADD COLUMN "__tag_base_type_boolean_4735tuf3vg" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_g5lmbdounu" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_duration" ADD COLUMN "__tag_base_type_duration_x4kusayrrj" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_file" ADD COLUMN "__tag_base_type_file_f3nyrmvnuq" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_float" ADD COLUMN "__tag_base_type_float_3yebf7fbld" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_identifier" ADD COLUMN "__tag_base_type_identifier_su3axkpwpi" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_integer" ADD COLUMN "__tag_base_type_integer_42hpi675dm" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_pair" ADD COLUMN "__tag_base_type_pair_j5c4komwfk" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_point" ADD COLUMN "__tag_base_type_point_vrpib4j3ph" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_string" ADD COLUMN "__tag_base_type_string_3acd7sfocx" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."literal_uri" ADD COLUMN "__tag_base_type_uri_dedabn4vho" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."lom" ADD COLUMN "__tag_kind_lom_lom_f6hipyl2uh" "qti"."node_kind" GENERATED ALWAYS AS ('lom:lom'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_aggregation_level" ADD COLUMN "__tag_kind_lom_aggregation_level_nz6q333tpc" "qti"."node_kind" GENERATED ALWAYS AS ('lom:aggregationLevel'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_annotation" ADD COLUMN "__tag_kind_lom_annotation_wmk4msekhm" "qti"."node_kind" GENERATED ALWAYS AS ('lom:annotation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_classification" ADD COLUMN "__tag_kind_lom_classification_s33zb3ydxx" "qti"."node_kind" GENERATED ALWAYS AS ('lom:classification'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_context" ADD COLUMN "__tag_kind_lom_context_unp6fhu2i5" "qti"."node_kind" GENERATED ALWAYS AS ('lom:context'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_contribute" ADD COLUMN "__tag_kind_lom_contribute_df2trhtcwa" "qti"."node_kind" GENERATED ALWAYS AS ('lom:contribute'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD COLUMN "__tag_kind_lom_copyright_and_other_restrictions_iumfuc7nd6" "qti"."node_kind" GENERATED ALWAYS AS ('lom:copyrightAndOtherRestrictions'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_cost" ADD COLUMN "__tag_kind_lom_cost_6szqfkzkkf" "qti"."node_kind" GENERATED ALWAYS AS ('lom:cost'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_coverage" ADD COLUMN "__tag_kind_lom_coverage_4gxjudfzzd" "qti"."node_kind" GENERATED ALWAYS AS ('lom:coverage'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_date" ADD COLUMN "__tag_kind_lom_date_w2vdyftvu3" "qti"."node_kind" GENERATED ALWAYS AS ('lom:date'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_date_time" ADD COLUMN "__tag_kind_lom_date_time_rwc33opc6i" "qti"."node_kind" GENERATED ALWAYS AS ('lom:dateTime'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_description" ADD COLUMN "__tag_kind_lom_description_fgwqgc6sgl" "qti"."node_kind" GENERATED ALWAYS AS ('lom:description'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_difficulty" ADD COLUMN "__tag_kind_lom_difficulty_u6oh2pluob" "qti"."node_kind" GENERATED ALWAYS AS ('lom:difficulty'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_duration" ADD COLUMN "__tag_kind_lom_duration_iav5iizeai" "qti"."node_kind" GENERATED ALWAYS AS ('lom:duration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_duration_string" ADD COLUMN "__tag_kind_lom_duration_string_ijve2g6fui" "qti"."node_kind" GENERATED ALWAYS AS ('lom:duration.string'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_educational" ADD COLUMN "__tag_kind_lom_educational_bfejue5lpc" "qti"."node_kind" GENERATED ALWAYS AS ('lom:educational'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_entity" ADD COLUMN "__tag_kind_lom_entity_ja2pg4zr5e" "qti"."node_kind" GENERATED ALWAYS AS ('lom:entity'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_entry_lang_string" ADD COLUMN "__tag_kind_lom_entry_lang_string_yr7dyefaw7" "qti"."node_kind" GENERATED ALWAYS AS ('lom:entry.langString'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_format" ADD COLUMN "__tag_kind_lom_format_zjeruunvce" "qti"."node_kind" GENERATED ALWAYS AS ('lom:format'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_general" ADD COLUMN "__tag_kind_lom_general_kdtvdmn7oa" "qti"."node_kind" GENERATED ALWAYS AS ('lom:general'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_general_title" ADD COLUMN "__tag_kind_lom_title_acxzzapsiz" "qti"."node_kind" GENERATED ALWAYS AS ('lom:title'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_id" ADD COLUMN "__tag_kind_lom_id_qophyddse4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:id'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_identifier" ADD COLUMN "__tag_kind_lom_identifier_zhhp3vq26p" "qti"."node_kind" GENERATED ALWAYS AS ('lom:identifier'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_identifier_catalog" ADD COLUMN "__tag_kind_lom_catalog_yeeo53s2uf" "qti"."node_kind" GENERATED ALWAYS AS ('lom:catalog'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_identifier_entry" ADD COLUMN "__tag_kind_lom_entry_z2frivifgf" "qti"."node_kind" GENERATED ALWAYS AS ('lom:entry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_installation_remarks" ADD COLUMN "__tag_kind_lom_installation_remarks_6actui7z3e" "qti"."node_kind" GENERATED ALWAYS AS ('lom:installationRemarks'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD COLUMN "__tag_kind_lom_intended_end_user_role_fu7zxsgpuk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:intendedEndUserRole'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_interactivity_level" ADD COLUMN "__tag_kind_lom_interactivity_level_42hqjwr3eg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:interactivityLevel'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_interactivity_type" ADD COLUMN "__tag_kind_lom_interactivity_type_mx3pzoaf7t" "qti"."node_kind" GENERATED ALWAYS AS ('lom:interactivityType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_keyword" ADD COLUMN "__tag_kind_lom_keyword_7mdhbpmyak" "qti"."node_kind" GENERATED ALWAYS AS ('lom:keyword'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_kind" ADD COLUMN "__tag_kind_lom_kind_xuf2kkwyr4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:kind'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_language" ADD COLUMN "__tag_kind_lom_language_umo24qkhua" "qti"."node_kind" GENERATED ALWAYS AS ('lom:language'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_learning_resource_type" ADD COLUMN "__tag_kind_lom_learning_resource_type_mm2kxi35r2" "qti"."node_kind" GENERATED ALWAYS AS ('lom:learningResourceType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_life_cycle" ADD COLUMN "__tag_kind_lom_life_cycle_v5zcy35q77" "qti"."node_kind" GENERATED ALWAYS AS ('lom:lifeCycle'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_location" ADD COLUMN "__tag_kind_lom_location_3tcexzxgfh" "qti"."node_kind" GENERATED ALWAYS AS ('lom:location'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_maximum_version" ADD COLUMN "__tag_kind_lom_maximum_version_anah5x464b" "qti"."node_kind" GENERATED ALWAYS AS ('lom:maximumVersion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_meta_metadata" ADD COLUMN "__tag_kind_lom_meta_metadata_z7muqedeoe" "qti"."node_kind" GENERATED ALWAYS AS ('lom:metaMetadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_metadataschema" ADD COLUMN "__tag_kind_lom_metadataschema_kjpxrlzjhx" "qti"."node_kind" GENERATED ALWAYS AS ('lom:metadataschema'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_minimum_version" ADD COLUMN "__tag_kind_lom_minimum_version_prl3rwqtuc" "qti"."node_kind" GENERATED ALWAYS AS ('lom:minimumVersion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_name" ADD COLUMN "__tag_kind_lom_name_ta2c7syhrg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:name'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_or_composite" ADD COLUMN "__tag_kind_lom_or_composite_hivjg4kbyy" "qti"."node_kind" GENERATED ALWAYS AS ('lom:orComposite'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD COLUMN "__tag_kind_lom_other_platform_requirements_u6lzfnmyqi" "qti"."node_kind" GENERATED ALWAYS AS ('lom:otherPlatformRequirements'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_purpose" ADD COLUMN "__tag_kind_lom_purpose_qtsfpmrlct" "qti"."node_kind" GENERATED ALWAYS AS ('lom:purpose'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_relation" ADD COLUMN "__tag_kind_lom_relation_adpqqvr6or" "qti"."node_kind" GENERATED ALWAYS AS ('lom:relation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_requirement" ADD COLUMN "__tag_kind_lom_requirement_giyfrxir3d" "qti"."node_kind" GENERATED ALWAYS AS ('lom:requirement'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_resource" ADD COLUMN "__tag_kind_lom_resource_jgqpmzi3u4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_rights" ADD COLUMN "__tag_kind_lom_rights_2fcs3c7jc3" "qti"."node_kind" GENERATED ALWAYS AS ('lom:rights'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_role" ADD COLUMN "__tag_kind_lom_role_mff47g5aja" "qti"."node_kind" GENERATED ALWAYS AS ('lom:role'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_semantic_density" ADD COLUMN "__tag_kind_lom_semantic_density_uqmekskg64" "qti"."node_kind" GENERATED ALWAYS AS ('lom:semanticDensity'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_size" ADD COLUMN "__tag_kind_lom_size_lxvgvtngju" "qti"."node_kind" GENERATED ALWAYS AS ('lom:size'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_source" ADD COLUMN "__tag_kind_lom_source_2h4d2ilrdk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:source'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_source_lang_string" ADD COLUMN "__tag_kind_lom_source_lang_string_3blfwn3hhk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:source.langString'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_status" ADD COLUMN "__tag_kind_lom_status_vvuyk32w3f" "qti"."node_kind" GENERATED ALWAYS AS ('lom:status'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_string" ADD COLUMN "__tag_kind_lom_string_s72bccwbh3" "qti"."node_kind" GENERATED ALWAYS AS ('lom:string'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_structure" ADD COLUMN "__tag_kind_lom_structure_7zyt26pyt6" "qti"."node_kind" GENERATED ALWAYS AS ('lom:structure'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_taxon" ADD COLUMN "__tag_kind_lom_taxon_2gykitonjg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:taxon'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_taxon_path" ADD COLUMN "__tag_kind_lom_taxon_path_ifvs3xty7l" "qti"."node_kind" GENERATED ALWAYS AS ('lom:taxonPath'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_technical" ADD COLUMN "__tag_kind_lom_technical_yobodngzpk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:technical'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_type" ADD COLUMN "__tag_kind_lom_type_gxwahsvklo" "qti"."node_kind" GENERATED ALWAYS AS ('lom:type'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_typical_age_range" ADD COLUMN "__tag_kind_lom_typical_age_range_b2nwhfufjs" "qti"."node_kind" GENERATED ALWAYS AS ('lom:typicalAgeRange'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_typical_learning_time" ADD COLUMN "__tag_kind_lom_typical_learning_time_jvgzdwqqg4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:typicalLearningTime'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_value" ADD COLUMN "__tag_kind_lom_value_rhv3macnym" "qti"."node_kind" GENERATED ALWAYS AS ('lom:value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_version" ADD COLUMN "__tag_kind_lom_version_o4inak47bb" "qti"."node_kind" GENERATED ALWAYS AS ('lom:version'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lookup_outcome_value" ADD COLUMN "__tag_kind_qti_lookup_outcome_value_upvgllrywv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lookup-outcome-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lt" ADD COLUMN "__tag_kind_qti_lt_mu6hpi7jul" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lte" ADD COLUMN "__tag_kind_qti_lte_rzob7fldtj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-lte'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest" ADD COLUMN "__tag_kind_manifest_s7wedmbljj" "qti"."tree_kind" GENERATED ALWAYS AS ('manifest'::"qti"."tree_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_manifest" ADD COLUMN "__tag_holder_manifest_7wghkxashe" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('manifest'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_resource" ADD COLUMN "__tag_holder_resource_3lbxhuqadk" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('resource'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."manifest_id_of_variant" ADD COLUMN "__tag_holder_variant_yyymqmlpge" "qti"."manifest_id_holder" GENERATED ALWAYS AS ('variant'::"qti"."manifest_id_holder") STORED NOT NULL;

ALTER TABLE "qti"."manifest_lom" ADD COLUMN "__tag_owner_manifest_rrl26sfdmq" "qti"."lom_owner" GENERATED ALWAYS AS ('manifest'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."manifest_lom" ADD COLUMN "__tag_kind_cp_metadata_manifest_lxlasjebcx" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.manifest'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_metadata" ADD COLUMN "__tag_kind_cp_metadata_manifest_lxlasjebcx" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.manifest'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_schema" ADD COLUMN "__tag_kind_cp_schema_wydqdv7nqu" "qti"."node_kind" GENERATED ALWAYS AS ('cp:schema'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."manifest_schema_version" ADD COLUMN "__tag_kind_cp_schemaversion_b5pisyerct" "qti"."node_kind" GENERATED ALWAYS AS ('cp:schemaversion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."map_entry" ADD COLUMN "__tag_kind_qti_map_entry_7jioq4tdgv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-map-entry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_boolean" ADD COLUMN "__tag_base_type_boolean_sz5sfqzghc" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_l5beqw3pbn" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_duration" ADD COLUMN "__tag_base_type_duration_acik5utqq7" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_file" ADD COLUMN "__tag_base_type_file_7nidsr63q6" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_float" ADD COLUMN "__tag_base_type_float_gd7vjzwxn6" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_identifier" ADD COLUMN "__tag_base_type_identifier_sk62dxvgra" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_integer" ADD COLUMN "__tag_base_type_integer_e7bv3rhpqy" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_pair" ADD COLUMN "__tag_base_type_pair_nzskhfheuw" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_point" ADD COLUMN "__tag_base_type_point_7hlqjth2q6" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_string" ADD COLUMN "__tag_base_type_string_dxu45pcf3v" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_entry_uri" ADD COLUMN "__tag_base_type_uri_ac5msyixkz" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."map_response" ADD COLUMN "__tag_kind_qti_map_response_argeupazur" "qti"."node_kind" GENERATED ALWAYS AS ('qti-map-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."map_response_point" ADD COLUMN "__tag_kind_qti_map_response_point_q6t4cnql4v" "qti"."node_kind" GENERATED ALWAYS AS ('qti-map-response-point'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."mapping" ADD COLUMN "__tag_kind_qti_mapping_qs3jyoupmy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-mapping'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."match" ADD COLUMN "__tag_kind_qti_match_lnqs6dxwup" "qti"."node_kind" GENERATED ALWAYS AS ('qti-match'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."match_interaction" ADD COLUMN "__tag_kind_qti_match_interaction_t55y35p4zv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-match-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."match_table" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."match_table" ADD COLUMN "__tag_kind_qti_match_table_lxwkv2knkw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-match-table'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."match_table" ADD COLUMN "__tag_cardinality_single_b63ah65un6" "qti"."typed_cardinality" GENERATED ALWAYS AS ('single'::"qti"."typed_cardinality") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_boolean" ADD COLUMN "__tag_base_type_boolean_3gkthlgi7m" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_g55e7b3zra" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_duration" ADD COLUMN "__tag_base_type_duration_k2dhcjknc7" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_file" ADD COLUMN "__tag_base_type_file_acefaavjzm" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_float" ADD COLUMN "__tag_base_type_float_vlkxjkvexr" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_identifier" ADD COLUMN "__tag_base_type_identifier_llbnmlnkme" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_integer" ADD COLUMN "__tag_base_type_integer_kklrreovhf" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_pair" ADD COLUMN "__tag_base_type_pair_mtidnevkdn" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_point" ADD COLUMN "__tag_base_type_point_m227v77qci" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_string" ADD COLUMN "__tag_base_type_string_ves2pqn2cj" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_default_value_uri" ADD COLUMN "__tag_base_type_uri_mknqhgttit" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry" ADD COLUMN "__tag_kind_qti_match_table_entry_wjydsm3ffv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-match-table-entry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_boolean" ADD COLUMN "__tag_base_type_boolean_u3kn7vrwi7" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_jbwcviweyf" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_duration" ADD COLUMN "__tag_base_type_duration_fey7pwwwht" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_file" ADD COLUMN "__tag_base_type_file_75z2meesum" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_float" ADD COLUMN "__tag_base_type_float_3iarvjcxve" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_identifier" ADD COLUMN "__tag_base_type_identifier_bgwyswav7g" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_integer" ADD COLUMN "__tag_base_type_integer_duiah6gkk3" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_pair" ADD COLUMN "__tag_base_type_pair_obsvzrhgcx" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_point" ADD COLUMN "__tag_base_type_point_tdg256h5s2" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_string" ADD COLUMN "__tag_base_type_string_roz3vktfny" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."match_table_entry_uri" ADD COLUMN "__tag_base_type_uri_qh4veg7gci" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."math_constant" ADD COLUMN "__tag_kind_qti_math_constant_33aeaomua7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-math-constant'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."math_operator" ADD COLUMN "__tag_kind_qti_math_operator_5q3gpyxbee" "qti"."node_kind" GENERATED ALWAYS AS ('qti-math-operator'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."max" ADD COLUMN "__tag_kind_qti_max_k2fgxlddd5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-max'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."media_interaction" ADD COLUMN "__tag_kind_qti_media_interaction_tfi75ox2wv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-media-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."member" ADD COLUMN "__tag_kind_qti_member_wlwyybwmab" "qti"."node_kind" GENERATED ALWAYS AS ('qti-member'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."min" ADD COLUMN "__tag_kind_qti_min_5k4uqv4ded" "qti"."node_kind" GENERATED ALWAYS AS ('qti-min'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."modal_feedback" ADD COLUMN "__tag_kind_qti_modal_feedback_mxux7xznmz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-modal-feedback'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."multiple" ADD COLUMN "__tag_kind_qti_multiple_blwsugoch2" "qti"."node_kind" GENERATED ALWAYS AS ('qti-multiple'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."nav" ADD COLUMN "__tag_kind_nav_cpuuu4v2qr" "qti"."node_kind" GENERATED ALWAYS AS ('nav'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."not" ADD COLUMN "__tag_kind_qti_not_ctn3qliz6a" "qti"."node_kind" GENERATED ALWAYS AS ('qti-not'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."null" ADD COLUMN "__tag_kind_qti_null_sjdltnabyd" "qti"."node_kind" GENERATED ALWAYS AS ('qti-null'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_correct" ADD COLUMN "__tag_kind_qti_number_correct_vgudlj33aa" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-correct'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_incorrect" ADD COLUMN "__tag_kind_qti_number_incorrect_fobw5d7gbp" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-incorrect'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_presented" ADD COLUMN "__tag_kind_qti_number_presented_c4kw7h2vss" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-presented'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_responded" ADD COLUMN "__tag_kind_qti_number_responded_rej7fdtd2o" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-responded'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."number_selected" ADD COLUMN "__tag_kind_qti_number_selected_y5wyghaa7n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-number-selected'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."object" ADD COLUMN "__tag_kind_object_zd2ersk4ce" "qti"."node_kind" GENERATED ALWAYS AS ('object'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ol" ADD COLUMN "__tag_kind_ol_2e4w45eumy" "qti"."node_kind" GENERATED ALWAYS AS ('ol'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."or" ADD COLUMN "__tag_kind_qti_or_2bm3cp5uoy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-or'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."order_interaction" ADD COLUMN "__tag_kind_qti_order_interaction_idcyl5weiu" "qti"."node_kind" GENERATED ALWAYS AS ('qti-order-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordered" ADD COLUMN "__tag_kind_qti_ordered_wujbvdvnaz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-ordered'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD COLUMN "__tag_kind_ud_ordinary_statistic_eakzbvyu36" "qti"."node_kind" GENERATED ALWAYS AS ('ud:ordinaryStatistic'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD COLUMN "__tag_kind_ordinary_nxdawqnzxk" "qti"."statistic_kind" GENERATED ALWAYS AS ('ordinary'::"qti"."statistic_kind") STORED NOT NULL;

ALTER TABLE "qti"."organizations" ADD COLUMN "__tag_kind_cp_organizations_io7npeoiga" "qti"."node_kind" GENERATED ALWAYS AS ('cp:organizations'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_condition_arm" ADD COLUMN "__tag_kind_qti_outcome_condition_3td227dwcr" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_declaration_arm" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_declaration_arm" ADD COLUMN "__tag_kind_qti_outcome_declaration_pavxgyuva7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_document" ADD COLUMN "__tag_root_outcomes_5xb23aywsn" "qti"."root_kind" GENERATED ALWAYS AS ('outcomes'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_else_arm" ADD COLUMN "__tag_kind_qti_outcome_else_7klt3q36ge" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-else'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_else_if_arm" ADD COLUMN "__tag_kind_qti_outcome_else_if_dfe5qckhzt" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-else-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_if_arm" ADD COLUMN "__tag_kind_qti_outcome_if_unq7efyvy3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_maximum_arm" ADD COLUMN "__tag_kind_qti_outcome_maximum_xfo2bco2fs" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-maximum'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_minimum_arm" ADD COLUMN "__tag_kind_qti_outcome_minimum_tdjdlbn6dy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-minimum'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_processing" ADD COLUMN "__tag_kind_qti_outcome_processing_fhxwpg6h24" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-processing'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."outcome_processing_fragment" ADD COLUMN "__tag_kind_qti_outcome_processing_fragment_unfq3d4o7g" "qti"."node_kind" GENERATED ALWAYS AS ('qti-outcome-processing-fragment'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."p" ADD COLUMN "__tag_kind_p_mm76ho4kjx" "qti"."node_kind" GENERATED ALWAYS AS ('p'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."package" ADD COLUMN "__tag_kind_cp_manifest_vqajffgjxd" "qti"."node_kind" GENERATED ALWAYS AS ('cp:manifest'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."param" ADD COLUMN "__tag_kind_param_ahmia5b7ly" "qti"."node_kind" GENERATED ALWAYS AS ('param'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."pattern_match" ADD COLUMN "__tag_kind_qti_pattern_match_fvc7hdtz3d" "qti"."node_kind" GENERATED ALWAYS AS ('qti-pattern-match'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."pi" ADD COLUMN "__tag_kind_pi_iifj7oyikt" "qti"."node_kind" GENERATED ALWAYS AS ('pi'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."picture" ADD COLUMN "__tag_kind_picture_773bajqqhs" "qti"."node_kind" GENERATED ALWAYS AS ('picture'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."position_object_interaction" ADD COLUMN "__tag_kind_qti_position_object_interaction_rge3opb2bo" "qti"."node_kind" GENERATED ALWAYS AS ('qti-position-object-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."position_object_stage" ADD COLUMN "__tag_kind_qti_position_object_stage_opzdehxvaq" "qti"."node_kind" GENERATED ALWAYS AS ('qti-position-object-stage'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."power" ADD COLUMN "__tag_kind_qti_power_kpx2em75ca" "qti"."node_kind" GENERATED ALWAYS AS ('qti-power'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."pre" ADD COLUMN "__tag_kind_pre_pindojue2g" "qti"."node_kind" GENERATED ALWAYS AS ('pre'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."printed_variable" ADD COLUMN "__tag_kind_qti_printed_variable_a4wq7cp2a3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-printed-variable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."printed_variable_id" ADD COLUMN "__tag_holder_printed_variable_s5vwhne3e7" "qti"."id_holder" GENERATED ALWAYS AS ('printedVariable'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."product" ADD COLUMN "__tag_kind_qti_product_hojc6apo2s" "qti"."node_kind" GENERATED ALWAYS AS ('qti-product'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."prompt" ADD COLUMN "__tag_kind_qti_prompt_4i6supq76j" "qti"."node_kind" GENERATED ALWAYS AS ('qti-prompt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."q" ADD COLUMN "__tag_kind_q_v2ut4rkmxv" "qti"."node_kind" GENERATED ALWAYS AS ('q'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_composite" ADD COLUMN "__tag_kind_qmd_composite_sp2gjoeow2" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:composite'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_custom_type_identifier" ADD COLUMN "__tag_kind_qmd_custom_type_identifier_6maf4fokd4" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:customTypeIdentifier'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_feedback_type" ADD COLUMN "__tag_kind_qmd_feedback_type_i4afuxmkum" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:feedbackType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_interaction_kind" ADD COLUMN "__tag_kind_qmd_interaction_kind_hqx3cimuzu" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:interactionKind'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_interaction_type" ADD COLUMN "__tag_kind_qmd_interaction_type_yfu5laontj" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:interactionType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_item_template" ADD COLUMN "__tag_kind_qmd_item_template_qed7bxhx4c" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:itemTemplate'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_portable_custom_interaction_context" ADD COLUMN "__tag_kind_qmd_portable_custom_interaction_context_qpozrauewz" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:portableCustomInteractionContext'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_scoring_mode" ADD COLUMN "__tag_kind_qmd_scoring_mode_eautyyrud4" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:scoringMode'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_solution_available" ADD COLUMN "__tag_kind_qmd_solution_available_2phsdzymgo" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:solutionAvailable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_time_dependent" ADD COLUMN "__tag_kind_qmd_time_dependent_kcomlfhb7l" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:timeDependent'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_tool_name" ADD COLUMN "__tag_kind_qmd_tool_name_27iaqneif4" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:toolName'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_tool_vendor" ADD COLUMN "__tag_kind_qmd_tool_vendor_q5oz7iuy5a" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:toolVendor'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qmd_tool_version" ADD COLUMN "__tag_kind_qmd_tool_version_pnqrau5xa6" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:toolVersion'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qti_label" ADD COLUMN "__tag_kind_qti_label_li3rglggnp" "qti"."node_kind" GENERATED ALWAYS AS ('qti-label'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata" ADD COLUMN "__tag_kind_qmd_qti_metadata_x6anaifca7" "qti"."node_kind" GENERATED ALWAYS AS ('qmd:qtiMetadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD COLUMN "__tag_host_external_lom_zuf64srpbg" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('externalLom'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD COLUMN "__tag_host_metadata_knpb2q2kry" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('metadata'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD COLUMN "__tag_host_resource_lom_vu3w7ocz2u" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('resourceLom'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."random" ADD COLUMN "__tag_kind_qti_random_erxmfosfti" "qti"."node_kind" GENERATED ALWAYS AS ('qti-random'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."random_float" ADD COLUMN "__tag_kind_qti_random_float_y4p3lnm6a4" "qti"."node_kind" GENERATED ALWAYS AS ('qti-random-float'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."random_integer" ADD COLUMN "__tag_kind_qti_random_integer_rbwxdayyl2" "qti"."node_kind" GENERATED ALWAYS AS ('qti-random-integer'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rb" ADD COLUMN "__tag_kind_rb_e2k522kmfe" "qti"."node_kind" GENERATED ALWAYS AS ('rb'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."record_binding" ADD COLUMN "__tag_shape_record_qozhrcs4ym" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."record_declaration" ADD COLUMN "__tag_shape_record_oogx67q33t" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."record_field" ADD COLUMN "__tag_shape_record_3rfzi5mgny" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."record_value_set" ADD COLUMN "__tag_shape_record_lavxfyvieb" "qti"."declaration_shape" GENERATED ALWAYS AS ('record'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."repeat" ADD COLUMN "__tag_kind_qti_repeat_bpcaeiu7tm" "qti"."node_kind" GENERATED ALWAYS AS ('qti-repeat'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."repeat_number_repeats_ref" ADD COLUMN "__tag_number_repeats_kind_ref_juikk35ua4" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

ALTER TABLE "qti"."resource" ADD COLUMN "__tag_kind_cp_resource_42ghp3dst6" "qti"."node_kind" GENERATED ALWAYS AS ('cp:resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."resource_lom" ADD COLUMN "__tag_owner_resource_r2xv4rjzei" "qti"."lom_owner" GENERATED ALWAYS AS ('resource'::"qti"."lom_owner") STORED NOT NULL;

ALTER TABLE "qti"."resource_lom" ADD COLUMN "__tag_kind_cp_metadata_resource_scp7neoqwd" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."resource_metadata" ADD COLUMN "__tag_kind_cp_metadata_resource_scp7neoqwd" "qti"."node_kind" GENERATED ALWAYS AS ('cp:metadata.resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."resources" ADD COLUMN "__tag_kind_cp_resources_vfmef7qkml" "qti"."node_kind" GENERATED ALWAYS AS ('cp:resources'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_condition_arm" ADD COLUMN "__tag_kind_qti_response_condition_gplnrgu2ol" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_arm" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_arm" ADD COLUMN "__tag_kind_qti_response_declaration_mnirjlf2bs" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_id" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_declaration_id" ADD COLUMN "__tag_holder_response_declaration_bgk6jyj7am" "qti"."id_holder" GENERATED ALWAYS AS ('responseDeclaration'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."response_else_arm" ADD COLUMN "__tag_kind_qti_response_else_hxjbbfwd4n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-else'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_else_if_arm" ADD COLUMN "__tag_kind_qti_response_else_if_z5u6rg462x" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-else-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_if_arm" ADD COLUMN "__tag_kind_qti_response_if_vi7uxgsitt" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_processing" ADD COLUMN "__tag_kind_qti_response_processing_w7uh2je46r" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-processing'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_processing_fragment" ADD COLUMN "__tag_kind_qti_response_processing_fragment_ftcfl3v7ub" "qti"."node_kind" GENERATED ALWAYS AS ('qti-response-processing-fragment'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."response_processing_item" ADD COLUMN "__tag_root_kind_item_od6jgyppue" "qti"."root_kind" GENERATED ALWAYS AS ('item'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."round" ADD COLUMN "__tag_kind_qti_round_5eosswhdnh" "qti"."node_kind" GENERATED ALWAYS AS ('qti-round'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."round_to" ADD COLUMN "__tag_kind_qti_round_to_qrylojzgc7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-round-to'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."round_to_figures_ref" ADD COLUMN "__tag_figures_kind_ref_r6zofyzy4o" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

ALTER TABLE "qti"."rp" ADD COLUMN "__tag_kind_rp_tmr6b4giiz" "qti"."node_kind" GENERATED ALWAYS AS ('rp'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rt" ADD COLUMN "__tag_kind_rt_l6ufwynexl" "qti"."node_kind" GENERATED ALWAYS AS ('rt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rtc" ADD COLUMN "__tag_kind_rtc_2t3ohmvv2y" "qti"."node_kind" GENERATED ALWAYS AS ('rtc'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rubric_block" ADD COLUMN "__tag_kind_qti_rubric_block_zyzsfdms3v" "qti"."node_kind" GENERATED ALWAYS AS ('qti-rubric-block'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rubric_template_block" ADD COLUMN "__tag_kind_qti_template_block_rubric_si2cxyuet3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-block.rubric'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rubric_template_inline" ADD COLUMN "__tag_kind_qti_template_inline_rubric_o5ok5velix" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-inline.rubric'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ruby" ADD COLUMN "__tag_kind_ruby_hoq7dhdvio" "qti"."node_kind" GENERATED ALWAYS AS ('ruby'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."samp" ADD COLUMN "__tag_kind_samp_kjsz6s7ejv" "qti"."node_kind" GENERATED ALWAYS AS ('samp'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."section" ADD COLUMN "__tag_kind_section_taqgypcfv7" "qti"."node_kind" GENERATED ALWAYS AS ('section'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."select_point_interaction" ADD COLUMN "__tag_kind_qti_select_point_interaction_dmgh3tps3a" "qti"."node_kind" GENERATED ALWAYS AS ('qti-select-point-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_correct_response" ADD COLUMN "__tag_kind_qti_set_correct_response_p4ucnvbenj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-correct-response'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_default_value" ADD COLUMN "__tag_kind_qti_set_default_value_rj2hosazj5" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-default-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_outcome_value" ADD COLUMN "__tag_kind_qti_set_outcome_value_h6wjpdpvko" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-outcome-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."set_template_value" ADD COLUMN "__tag_kind_qti_set_template_value_nb6cflrq6l" "qti"."node_kind" GENERATED ALWAYS AS ('qti-set-template-value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."simple_associable_choice" ADD COLUMN "__tag_kind_qti_simple_associable_choice_dlcgsxx2bi" "qti"."node_kind" GENERATED ALWAYS AS ('qti-simple-associable-choice'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."simple_choice" ADD COLUMN "__tag_kind_qti_simple_choice_z52ayjzccu" "qti"."node_kind" GENERATED ALWAYS AS ('qti-simple-choice'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."simple_match_set" ADD COLUMN "__tag_kind_qti_simple_match_set_bhwsbmwhks" "qti"."node_kind" GENERATED ALWAYS AS ('qti-simple-match-set'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."slider_interaction" ADD COLUMN "__tag_kind_qti_slider_interaction_mqpv3dtt65" "qti"."node_kind" GENERATED ALWAYS AS ('qti-slider-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."small" ADD COLUMN "__tag_kind_small_gkltegn7kl" "qti"."node_kind" GENERATED ALWAYS AS ('small'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."source" ADD COLUMN "__tag_kind_source_q72etxe3im" "qti"."node_kind" GENERATED ALWAYS AS ('source'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."span" ADD COLUMN "__tag_kind_span_koacretyo2" "qti"."node_kind" GENERATED ALWAYS AS ('span'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."stats_operator" ADD COLUMN "__tag_kind_qti_stats_operator_x5autjgscg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-stats-operator'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."string_binding" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."string_match" ADD COLUMN "__tag_kind_qti_string_match_ymwg654alj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-string-match'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."strong" ADD COLUMN "__tag_kind_strong_gxhcapelxs" "qti"."node_kind" GENERATED ALWAYS AS ('strong'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."stylesheet" ADD COLUMN "__tag_kind_qti_stylesheet_zrdvcrjdok" "qti"."node_kind" GENERATED ALWAYS AS ('qti-stylesheet'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."sub" ADD COLUMN "__tag_kind_sub_c5sixq4viw" "qti"."node_kind" GENERATED ALWAYS AS ('sub'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."substring" ADD COLUMN "__tag_kind_qti_substring_j2vyby2o5h" "qti"."node_kind" GENERATED ALWAYS AS ('qti-substring'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."subtract" ADD COLUMN "__tag_kind_qti_subtract_fn3f5wibuj" "qti"."node_kind" GENERATED ALWAYS AS ('qti-subtract'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."sum" ADD COLUMN "__tag_kind_qti_sum_2bm2f65vor" "qti"."node_kind" GENERATED ALWAYS AS ('qti-sum'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."summary" ADD COLUMN "__tag_kind_summary_4tcbjxb4su" "qti"."node_kind" GENERATED ALWAYS AS ('summary'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."sup" ADD COLUMN "__tag_kind_sup_drhon2pewx" "qti"."node_kind" GENERATED ALWAYS AS ('sup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."table" ADD COLUMN "__tag_kind_table_o2mr32dc7l" "qti"."node_kind" GENERATED ALWAYS AS ('table'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."target_object" ADD COLUMN "__tag_kind_ud_target_object_x2bagozuf2" "qti"."node_kind" GENERATED ALWAYS AS ('ud:targetObject'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tbody" ADD COLUMN "__tag_kind_tbody_vnwspgbjg3" "qti"."node_kind" GENERATED ALWAYS AS ('tbody'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."td" ADD COLUMN "__tag_kind_td_uvejqfmwgi" "qti"."node_kind" GENERATED ALWAYS AS ('td'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template" ADD COLUMN "__tag_kind_template_gzmskje5fk" "qti"."node_kind" GENERATED ALWAYS AS ('template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_block" ADD COLUMN "__tag_kind_qti_template_block_vu6txxof7s" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-block'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_condition_arm" ADD COLUMN "__tag_kind_qti_template_condition_5iedsmf35c" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-condition'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_constraint" ADD COLUMN "__tag_kind_qti_template_constraint_nwjpfefvxc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-constraint'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_content_ref" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_declaration_arm" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_declaration_arm" ADD COLUMN "__tag_kind_qti_template_declaration_kfzjha6iro" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_else_arm" ADD COLUMN "__tag_kind_qti_template_else_td6wimhp7s" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-else'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_else_if_arm" ADD COLUMN "__tag_kind_qti_template_else_if_xkgqxjlgvf" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-else-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_feedback_block" ADD COLUMN "__tag_kind_qti_feedback_block_template_koyzwlsapg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-feedback-block.template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_if_arm" ADD COLUMN "__tag_kind_qti_template_if_kdp2hjyxni" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-if'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_inline" ADD COLUMN "__tag_kind_qti_template_inline_zkyrmcpqzq" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-inline'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_parameter_ref" ADD COLUMN "__tag_kind_template_parameter_izkfu4qd5a" "qti"."ref_kind" GENERATED ALWAYS AS ('templateParameter'::"qti"."ref_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_processing" ADD COLUMN "__tag_kind_qti_template_processing_julsyuopii" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-processing'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."test_variables" ADD COLUMN "__tag_kind_qti_test_variables_ssteaad3nd" "qti"."node_kind" GENERATED ALWAYS AS ('qti-test-variables'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."text_entry_interaction" ADD COLUMN "__tag_kind_qti_text_entry_interaction_qjak2y2y6n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-text-entry-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."text_node" ADD COLUMN "__tag_kind_text_vrxl6g2xzn" "qti"."node_kind" GENERATED ALWAYS AS ('text'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tfoot" ADD COLUMN "__tag_kind_tfoot_ryniejmgnp" "qti"."node_kind" GENERATED ALWAYS AS ('tfoot'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."th" ADD COLUMN "__tag_kind_th_obdxlz7qfe" "qti"."node_kind" GENERATED ALWAYS AS ('th'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."thead" ADD COLUMN "__tag_kind_thead_qzvxye75oy" "qti"."node_kind" GENERATED ALWAYS AS ('thead'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tr" ADD COLUMN "__tag_kind_tr_uhvfuvx5js" "qti"."node_kind" GENERATED ALWAYS AS ('tr'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."track" ADD COLUMN "__tag_kind_track_7rs2xjagel" "qti"."node_kind" GENERATED ALWAYS AS ('track'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tree_root" ADD COLUMN "__tag_ancestry_root_7ltbltwcre" "qti"."ancestry" GENERATED ALWAYS AS ('root'::"qti"."ancestry") STORED NOT NULL;

ALTER TABLE "qti"."truncate" ADD COLUMN "__tag_kind_qti_truncate_vkai3xtk23" "qti"."node_kind" GENERATED ALWAYS AS ('qti-truncate'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tt" ADD COLUMN "__tag_kind_tt_etz3iybkyw" "qti"."node_kind" GENERATED ALWAYS AS ('tt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."typed_binding" ADD COLUMN "__tag_shape_typed_gdmqmo4yqk" "qti"."declaration_shape" GENERATED ALWAYS AS ('typed'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."typed_declaration" ADD COLUMN "__tag_shape_typed_qnenjfvgbj" "qti"."declaration_shape" GENERATED ALWAYS AS ('typed'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."typed_value_set" ADD COLUMN "__tag_shape_typed_atyt4o6rfl" "qti"."declaration_shape" GENERATED ALWAYS AS ('typed'::"qti"."declaration_shape") STORED NOT NULL;

ALTER TABLE "qti"."ul" ADD COLUMN "__tag_kind_ul_n7u7vjrkov" "qti"."node_kind" GENERATED ALWAYS AS ('ul'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."upload_interaction" ADD COLUMN "__tag_kind_qti_upload_interaction_cjum6engod" "qti"."node_kind" GENERATED ALWAYS AS ('qti-upload-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_data" ADD COLUMN "__tag_root_usagedata_kjac3nie2g" "qti"."root_kind" GENERATED ALWAYS AS ('usagedata'::"qti"."root_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_data" ADD COLUMN "__tag_kind_ud_usage_data_xzkq4jszsr" "qti"."node_kind" GENERATED ALWAYS AS ('ud:usageData'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_map_entry" ADD COLUMN "__tag_kind_ud_map_entry_e3so66labc" "qti"."node_kind" GENERATED ALWAYS AS ('ud:mapEntry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_mapping" ADD COLUMN "__tag_kind_ud_mapping_nl4fsdrhrc" "qti"."node_kind" GENERATED ALWAYS AS ('ud:mapping'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_boolean" ADD COLUMN "__tag_base_type_boolean_spkprt4ifj" "qti"."base_type" GENERATED ALWAYS AS ('boolean'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_directed_pair" ADD COLUMN "__tag_base_type_directed_pair_6ydufsu7xt" "qti"."base_type" GENERATED ALWAYS AS ('directedPair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_duration" ADD COLUMN "__tag_base_type_duration_74urvab32r" "qti"."base_type" GENERATED ALWAYS AS ('duration'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_file" ADD COLUMN "__tag_base_type_file_v6agbrnksv" "qti"."base_type" GENERATED ALWAYS AS ('file'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_float" ADD COLUMN "__tag_base_type_float_vh6x7mgon6" "qti"."base_type" GENERATED ALWAYS AS ('float'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_identifier" ADD COLUMN "__tag_base_type_identifier_6sg34ylgx7" "qti"."base_type" GENERATED ALWAYS AS ('identifier'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_integer" ADD COLUMN "__tag_base_type_integer_yiuetnhqbm" "qti"."base_type" GENERATED ALWAYS AS ('integer'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_pair" ADD COLUMN "__tag_base_type_pair_h5mswwpdzq" "qti"."base_type" GENERATED ALWAYS AS ('pair'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_point" ADD COLUMN "__tag_base_type_point_whzxkpcubn" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_string" ADD COLUMN "__tag_base_type_string_ufr3c7ewnb" "qti"."base_type" GENERATED ALWAYS AS ('string'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_typed_value_uri" ADD COLUMN "__tag_base_type_uri_4pugbs6w66" "qti"."base_type" GENERATED ALWAYS AS ('uri'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."usage_value" ADD COLUMN "__tag_kind_ud_value_7zu72u4s4m" "qti"."node_kind" GENERATED ALWAYS AS ('ud:value'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."var" ADD COLUMN "__tag_kind_var_ufngemq3yq" "qti"."node_kind" GENERATED ALWAYS AS ('var'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variable" ADD COLUMN "__tag_kind_qti_variable_obgp52jplg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-variable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variant" ADD COLUMN "__tag_kind_cpx_variant_zd5caenuzr" "qti"."node_kind" GENERATED ALWAYS AS ('cpx:variant'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."variant_metadata" ADD COLUMN "__tag_kind_cpx_metadata_etdkl37kij" "qti"."node_kind" GENERATED ALWAYS AS ('cpx:metadata'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."video" ADD COLUMN "__tag_kind_video_zsqw625lwf" "qti"."node_kind" GENERATED ALWAYS AS ('video'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ws" ADD COLUMN "__tag_kind_ws_v2rnjnoedh" "qti"."node_kind" GENERATED ALWAYS AS ('ws'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."x_include" ADD COLUMN "__tag_kind_xi_include_tnsd6wpc7o" "qti"."node_kind" GENERATED ALWAYS AS ('xi:include'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."a" ADD CONSTRAINT "__a_fk_id_tag_kind_a_nnzx_4_rhgd_5_7ro66s5nyh" FOREIGN KEY ("id", "__tag_kind_a_nnzx4rhgd5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."a_type" ADD CONSTRAINT "__a_type_fk_node_glqappcarf" FOREIGN KEY ("node") REFERENCES "qti"."a" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."abbr" ADD CONSTRAINT "__abbr_fk_id_tag_kind_abbr_hrjkr_2_qds_6_jpdz7ec4gd" FOREIGN KEY ("id", "__tag_kind_abbr_hrjkr2qds6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_id_tag_kind_drd_access_tfbg7eqeci" FOREIGN KEY ("id", "__tag_kind_drd_access_for_all_resource_dcvrnrucvz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_id_metadata_xfrhrrhkhp" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."access_for_all_resource" ADD CONSTRAINT "__access_for_all_resource_fk_metadata_zxw7a2wvbn" FOREIGN KEY ("metadata") REFERENCES "qti"."variant_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."acronym" ADD CONSTRAINT "__acronym_fk_id_tag_kind_acronym_vins_4_r_6_mib_gt2rapfuja" FOREIGN KEY ("id", "__tag_kind_acronym_vins4r6mib") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."address" ADD CONSTRAINT "__address_fk_id_tag_kind_address_v_7_uvpjblbr_d4ejqwuza2" FOREIGN KEY ("id", "__tag_kind_address_v7uvpjblbr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."and" ADD CONSTRAINT "__and_fk_id_roez54kv57" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."and" ADD CONSTRAINT "__and_fk_id_tag_kind_qti_and_hietom_4_ymf_x43hurxfdz" FOREIGN KEY ("id", "__tag_kind_qti_and_hietom4ymf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."any_n" ADD CONSTRAINT "__any_n_fk_id_pvphqpmb6x" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."any_n" ADD CONSTRAINT "__any_n_fk_id_tag_kind_qti_any_n_7_fjipr_6_x_66_5rylr7ljir" FOREIGN KEY ("id", "__tag_kind_qti_any_n_7fjipr6x66") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_map_entry" ADD CONSTRAINT "__area_map_entry_fk_area_mapping_orq4wexwes" FOREIGN KEY ("area_mapping") REFERENCES "qti"."area_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_map_entry" ADD CONSTRAINT "__area_map_entry_fk_id_tag_kind_qti_area_map_entry_tdlgmxnfzq" FOREIGN KEY ("id", "__tag_kind_qti_area_map_entry_ipn4oixdsm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_map_entry" ADD CONSTRAINT "__area_map_entry_fk_id_area_mapping_position_els6sss45m" FOREIGN KEY ("id", "area_mapping", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_mapping" ADD CONSTRAINT "__area_mapping_fk_declaration_tag_base_type_point_t_nfqlbbrrel" FOREIGN KEY ("declaration", "__tag_base_type_point_t72vrgkw7u") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_mapping" ADD CONSTRAINT "__area_mapping_fk_id_tag_kind_qti_area_mapping_rozg_v757xh5soi" FOREIGN KEY ("id", "__tag_kind_qti_area_mapping_rozg3o46o7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_mapping" ADD CONSTRAINT "__area_mapping_fk_id_declaration_4nxqtsvxx3" FOREIGN KEY ("id", "declaration") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_mapping_lower_bound" ADD CONSTRAINT "__area_mapping_lower_bound_fk_node_hcj7cwmjrm" FOREIGN KEY ("node") REFERENCES "qti"."area_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_mapping_upper_bound" ADD CONSTRAINT "__area_mapping_upper_bound_fk_node_dalrnyxq4l" FOREIGN KEY ("node") REFERENCES "qti"."area_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_activedescendant" ADD CONSTRAINT "__aria_activedescendant_fk_kind_attribute_vs2qv7fci4" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_activedescendant" ADD CONSTRAINT "__aria_activedescendant_fk_node_kind_c4iaciwjdi" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_atomic" ADD CONSTRAINT "__aria_atomic_fk_kind_attribute_ibqrehawnv" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_atomic" ADD CONSTRAINT "__aria_atomic_fk_node_kind_b5acp3htoq" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_autocomplete" ADD CONSTRAINT "__aria_autocomplete_fk_kind_attribute_3dst5hrtdh" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_autocomplete" ADD CONSTRAINT "__aria_autocomplete_fk_node_kind_3uxtplqnx2" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_busy" ADD CONSTRAINT "__aria_busy_fk_kind_attribute_sngwvexhz7" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_busy" ADD CONSTRAINT "__aria_busy_fk_node_kind_czv6miatbk" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_checked" ADD CONSTRAINT "__aria_checked_fk_kind_attribute_ostrgevqpf" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_checked" ADD CONSTRAINT "__aria_checked_fk_node_kind_znxxexya4q" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_colcount" ADD CONSTRAINT "__aria_colcount_fk_kind_attribute_q2e2foxsz6" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_colcount" ADD CONSTRAINT "__aria_colcount_fk_node_kind_expmrxfdqv" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_colindex" ADD CONSTRAINT "__aria_colindex_fk_kind_attribute_sb5vxiihti" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_colindex" ADD CONSTRAINT "__aria_colindex_fk_node_kind_sdcr5vc54z" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_colspan" ADD CONSTRAINT "__aria_colspan_fk_kind_attribute_rvejbfmpwr" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_colspan" ADD CONSTRAINT "__aria_colspan_fk_node_kind_m6gj6lxnsf" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_controls" ADD CONSTRAINT "__aria_controls_fk_kind_attribute_zp5owq7byz" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_controls" ADD CONSTRAINT "__aria_controls_fk_node_kind_f4uc2ev6v2" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_current" ADD CONSTRAINT "__aria_current_fk_kind_attribute_m6ve4g772y" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_current" ADD CONSTRAINT "__aria_current_fk_node_kind_ldmygsjewl" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_describedby" ADD CONSTRAINT "__aria_describedby_fk_kind_attribute_ti4co65v4y" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_describedby" ADD CONSTRAINT "__aria_describedby_fk_node_kind_dwh2wsgvrs" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_details" ADD CONSTRAINT "__aria_details_fk_kind_attribute_3ufl6hoszf" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_details" ADD CONSTRAINT "__aria_details_fk_node_kind_tvuogg3e55" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_disabled" ADD CONSTRAINT "__aria_disabled_fk_kind_attribute_52qqjvsjve" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_disabled" ADD CONSTRAINT "__aria_disabled_fk_node_kind_kco4vxhwdz" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_errormessage" ADD CONSTRAINT "__aria_errormessage_fk_kind_attribute_dqpntoclxv" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_errormessage" ADD CONSTRAINT "__aria_errormessage_fk_node_kind_27oxgit3e3" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_expanded" ADD CONSTRAINT "__aria_expanded_fk_kind_attribute_3tu7teufqj" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_expanded" ADD CONSTRAINT "__aria_expanded_fk_node_kind_dj3vsdsodo" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_flowto" ADD CONSTRAINT "__aria_flowto_fk_kind_attribute_uhl74d76xz" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_flowto" ADD CONSTRAINT "__aria_flowto_fk_node_kind_lkaobjqoa7" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_haspopup" ADD CONSTRAINT "__aria_haspopup_fk_kind_attribute_4ptpuvcqp4" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_haspopup" ADD CONSTRAINT "__aria_haspopup_fk_node_kind_r3avubb422" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_hidden" ADD CONSTRAINT "__aria_hidden_fk_kind_attribute_symcmlgnvu" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_hidden" ADD CONSTRAINT "__aria_hidden_fk_node_kind_c2ym56ksjr" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_invalid" ADD CONSTRAINT "__aria_invalid_fk_kind_attribute_xmcnyvypa5" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_invalid" ADD CONSTRAINT "__aria_invalid_fk_node_kind_pssbhlseku" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_keyshortcuts" ADD CONSTRAINT "__aria_keyshortcuts_fk_kind_attribute_pyhihloe7z" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_keyshortcuts" ADD CONSTRAINT "__aria_keyshortcuts_fk_node_kind_n5gqtcgdm7" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_keyshorts" ADD CONSTRAINT "__aria_keyshorts_fk_kind_attribute_7x6cmnnif7" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_keyshorts" ADD CONSTRAINT "__aria_keyshorts_fk_node_kind_t6nwg6shqi" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_label" ADD CONSTRAINT "__aria_label_fk_kind_attribute_c32gt2hd2o" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_label" ADD CONSTRAINT "__aria_label_fk_node_kind_mwqalmv5uf" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_labelledby" ADD CONSTRAINT "__aria_labelledby_fk_kind_attribute_css5epdtgf" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_labelledby" ADD CONSTRAINT "__aria_labelledby_fk_node_kind_2juuy2m5hi" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_level" ADD CONSTRAINT "__aria_level_fk_kind_attribute_36xg5g5nxo" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_level" ADD CONSTRAINT "__aria_level_fk_node_kind_i7uthwwqev" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_live" ADD CONSTRAINT "__aria_live_fk_kind_attribute_qeyljykiy6" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_live" ADD CONSTRAINT "__aria_live_fk_node_kind_hb5c5ojzbp" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_modal" ADD CONSTRAINT "__aria_modal_fk_kind_attribute_knv4ozunww" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_modal" ADD CONSTRAINT "__aria_modal_fk_node_kind_xseli6odnt" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_multiline" ADD CONSTRAINT "__aria_multiline_fk_kind_attribute_kqo4fzinsq" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_multiline" ADD CONSTRAINT "__aria_multiline_fk_node_kind_f4szy2lnq6" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_multiselectable" ADD CONSTRAINT "__aria_multiselectable_fk_kind_attribute_iz44a6fie3" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_multiselectable" ADD CONSTRAINT "__aria_multiselectable_fk_node_kind_vn6qlq72al" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_orientation" ADD CONSTRAINT "__aria_orientation_fk_kind_attribute_ouv7ww2wal" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_orientation" ADD CONSTRAINT "__aria_orientation_fk_node_kind_l66lfjuix3" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_owns" ADD CONSTRAINT "__aria_owns_fk_kind_attribute_sluw4yp6hp" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_owns" ADD CONSTRAINT "__aria_owns_fk_node_kind_mefpghce3g" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_placeholder" ADD CONSTRAINT "__aria_placeholder_fk_kind_attribute_tr5zmh6mmh" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_placeholder" ADD CONSTRAINT "__aria_placeholder_fk_node_kind_dhj5cs6222" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_posinset" ADD CONSTRAINT "__aria_posinset_fk_kind_attribute_5hcyj4dneq" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_posinset" ADD CONSTRAINT "__aria_posinset_fk_node_kind_andqjv6jiy" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_pressed" ADD CONSTRAINT "__aria_pressed_fk_kind_attribute_5c7fg2cumr" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_pressed" ADD CONSTRAINT "__aria_pressed_fk_node_kind_k3hhtfb74s" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_readonly" ADD CONSTRAINT "__aria_readonly_fk_kind_attribute_5uir7pyvaa" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_readonly" ADD CONSTRAINT "__aria_readonly_fk_node_kind_4nkkt4vdgs" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_relevant" ADD CONSTRAINT "__aria_relevant_fk_kind_attribute_xwovns4nzr" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_relevant" ADD CONSTRAINT "__aria_relevant_fk_node_kind_u6mjxs763c" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_required" ADD CONSTRAINT "__aria_required_fk_kind_attribute_3c37yhepzz" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_required" ADD CONSTRAINT "__aria_required_fk_node_kind_cozdeaxpdk" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_role" ADD CONSTRAINT "__aria_role_fk_kind_attribute_f4qooczuxl" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_role" ADD CONSTRAINT "__aria_role_fk_node_kind_jagdqnehkx" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_roledescription" ADD CONSTRAINT "__aria_roledescription_fk_kind_attribute_pbyalxkyue" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_roledescription" ADD CONSTRAINT "__aria_roledescription_fk_node_kind_hzl4gmhkie" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_rowcount" ADD CONSTRAINT "__aria_rowcount_fk_kind_attribute_b5qdkb65k3" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_rowcount" ADD CONSTRAINT "__aria_rowcount_fk_node_kind_3ntxef4uqf" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_rowindex" ADD CONSTRAINT "__aria_rowindex_fk_kind_attribute_5l3zw4katw" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_rowindex" ADD CONSTRAINT "__aria_rowindex_fk_node_kind_ew4duxvcuh" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_rowspan" ADD CONSTRAINT "__aria_rowspan_fk_kind_attribute_ehvuw352wr" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_rowspan" ADD CONSTRAINT "__aria_rowspan_fk_node_kind_7hwlo2u4kn" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_selected" ADD CONSTRAINT "__aria_selected_fk_kind_attribute_bi3uu5enrp" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_selected" ADD CONSTRAINT "__aria_selected_fk_node_kind_oqqwifgwii" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_setsize" ADD CONSTRAINT "__aria_setsize_fk_kind_attribute_h7ebykl2k2" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_setsize" ADD CONSTRAINT "__aria_setsize_fk_node_kind_zywlpsqf76" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_sort" ADD CONSTRAINT "__aria_sort_fk_kind_attribute_q72urmwr5t" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_sort" ADD CONSTRAINT "__aria_sort_fk_node_kind_f5a7nlyrwd" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_valuemax" ADD CONSTRAINT "__aria_valuemax_fk_kind_attribute_czfgfal7bb" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_valuemax" ADD CONSTRAINT "__aria_valuemax_fk_node_kind_upr5ubwywd" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_valuemin" ADD CONSTRAINT "__aria_valuemin_fk_kind_attribute_j7bnuolki5" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_valuemin" ADD CONSTRAINT "__aria_valuemin_fk_node_kind_3oqmntiz6u" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_valuenow" ADD CONSTRAINT "__aria_valuenow_fk_kind_attribute_b24kvdbfhx" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_valuenow" ADD CONSTRAINT "__aria_valuenow_fk_node_kind_4aa34amfdj" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aria_valuetext" ADD CONSTRAINT "__aria_valuetext_fk_kind_attribute_ls52ygpl3k" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."aria_valuetext" ADD CONSTRAINT "__aria_valuetext_fk_node_kind_glgnhz772i" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."article" ADD CONSTRAINT "__article_fk_id_tag_kind_article_q_5_bbr_6_phbo_cxroyptwjr" FOREIGN KEY ("id", "__tag_kind_article_q5bbr6phbo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."aside" ADD CONSTRAINT "__aside_fk_id_tag_kind_aside_623_qjlqyr_6_h3eamhqxdy" FOREIGN KEY ("id", "__tag_kind_aside_623qjlqyr6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_fk_id_tag_kind_qti_assessment_item_tb6ofvomqn" FOREIGN KEY ("id", "__tag_kind_qti_assessment_item_lutv7awadt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_fk_id_tree_iolxqdwgug" FOREIGN KEY ("id", "tree") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."assessment_item_label" ADD CONSTRAINT "__assessment_item_label_fk_node_tree_version_22qexjbdet" FOREIGN KEY ("node", "tree", "version") REFERENCES "qti"."node" ("id", "tree", "version") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot" ADD CONSTRAINT "__associable_hotspot_fk_id_tag_kind_qti_associable_cthcl3fsmj" FOREIGN KEY ("id", "__tag_kind_qti_associable_hotspot_s44ub3cnnd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot" ADD CONSTRAINT "__associable_hotspot_fk_id_interaction_iwxrm453v6" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot" ADD CONSTRAINT "__associable_hotspot_fk_id_parent_kind_dgxqwosap2" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot_label" ADD CONSTRAINT "__associable_hotspot_label_fk_node_563s2juyzs" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot_match_min" ADD CONSTRAINT "__associable_hotspot_match_min_fk_node_zpvavojw5b" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associate_interaction" ADD CONSTRAINT "__associate_interaction_fk_id_tag_kind_qti_associate_e4pnu663qi" FOREIGN KEY ("id", "__tag_kind_qti_associate_interaction_mmhr3ccr2w") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associate_interaction" ADD CONSTRAINT "__associate_interaction_fk_id_root_kind_hqhizy54we" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_entity_reference" ADD CONSTRAINT "__attribute_entity_reference_fk_node_dmowipcsds" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_idref" ADD CONSTRAINT "__attribute_idref_fk_document_target_lj3l74altr" FOREIGN KEY ("document", "target") REFERENCES "qti"."document_id" ("document", "id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_idref" ADD CONSTRAINT "__attribute_idref_fk_node_document_3q5cvhw5md" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_lexical" ADD CONSTRAINT "__attribute_lexical_fk_kind_attribute_njhegw4vhu" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."attribute_lexical" ADD CONSTRAINT "__attribute_lexical_fk_node_kind_nalamcdh2a" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_spelling" ADD CONSTRAINT "__attribute_spelling_fk_kind_attribute_3o3d5n7jh6" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."attribute_spelling" ADD CONSTRAINT "__attribute_spelling_fk_node_kind_t2iysxh3rr" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."audio" ADD CONSTRAINT "__audio_fk_id_tag_kind_audio_ody_3_p_7_lpzb_th62wal5eh" FOREIGN KEY ("id", "__tag_kind_audio_ody3p7lpzb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."audio_autoplay" ADD CONSTRAINT "__audio_autoplay_fk_node_version_fekkno2dyd" FOREIGN KEY ("node", "version") REFERENCES "qti"."audio" ("id", "version");

ALTER TABLE "qti"."audio_controls" ADD CONSTRAINT "__audio_controls_fk_node_version_34kp5m3c24" FOREIGN KEY ("node", "version") REFERENCES "qti"."audio" ("id", "version");

ALTER TABLE "qti"."audio_crossorigin" ADD CONSTRAINT "__audio_crossorigin_fk_node_rli5svoply" FOREIGN KEY ("node") REFERENCES "qti"."audio" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."audio_loop" ADD CONSTRAINT "__audio_loop_fk_node_version_k6wd7yrwpm" FOREIGN KEY ("node", "version") REFERENCES "qti"."audio" ("id", "version");

ALTER TABLE "qti"."audio_mediagroup" ADD CONSTRAINT "__audio_mediagroup_fk_node_ozljlbcf6o" FOREIGN KEY ("node") REFERENCES "qti"."audio" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."audio_muted" ADD CONSTRAINT "__audio_muted_fk_node_version_tnacpke7wn" FOREIGN KEY ("node", "version") REFERENCES "qti"."audio" ("id", "version");

ALTER TABLE "qti"."audio_preload" ADD CONSTRAINT "__audio_preload_fk_node_dwh4jslsat" FOREIGN KEY ("node") REFERENCES "qti"."audio" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."audio_src" ADD CONSTRAINT "__audio_src_fk_node_anu3m2aawv" FOREIGN KEY ("node") REFERENCES "qti"."audio" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."b" ADD CONSTRAINT "__b_fk_id_tag_kind_b_eugn_3_uhkgh_qkgb3ma4cc" FOREIGN KEY ("id", "__tag_kind_b_eugn3uhkgh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."bdi" ADD CONSTRAINT "__bdi_fk_id_tag_kind_bdi_bpifxwd_52_f_nrmbfbfggl" FOREIGN KEY ("id", "__tag_kind_bdi_bpifxwd52f") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."bdo" ADD CONSTRAINT "__bdo_fk_id_tag_kind_bdo_wrzsnb_2_sme_wc77z3s3my" FOREIGN KEY ("id", "__tag_kind_bdo_wrzsnb2sme") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."bdo_title" ADD CONSTRAINT "__bdo_title_fk_node_5yoqnad5n4" FOREIGN KEY ("node") REFERENCES "qti"."bdo" ("id");

ALTER TABLE "qti"."big" ADD CONSTRAINT "__big_fk_id_tag_kind_big_5_cuhs_57_aze_jzkrpjhl54" FOREIGN KEY ("id", "__tag_kind_big_5cuhs57aze") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."blockquote" ADD CONSTRAINT "__blockquote_fk_id_tag_kind_blockquote_pzalnulzij_7z4sbymqmh" FOREIGN KEY ("id", "__tag_kind_blockquote_pzalnulzij") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."blockquote_cite" ADD CONSTRAINT "__blockquote_cite_fk_node_bvr7amnfl6" FOREIGN KEY ("node") REFERENCES "qti"."blockquote" ("id");

ALTER TABLE "qti"."br" ADD CONSTRAINT "__br_fk_id_tag_kind_br_e_2_kqhk_7_bmv_4cjbnwq53f" FOREIGN KEY ("id", "__tag_kind_br_e2kqhk7bmv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."built_in_ref" ADD CONSTRAINT "__built_in_ref_fk_id_tag_kind_built_in_a_5_gr_6_jz_3_uxqwbgzpu7" FOREIGN KEY ("id", "__tag_kind_built_in_a5gr6jz3gp") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."built_in_ref" ADD CONSTRAINT "__built_in_ref_fk_id_referrer_kind_twy2vn4yhi" FOREIGN KEY ("id", "referrer_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."caption" ADD CONSTRAINT "__caption_fk_id_tag_kind_caption_5_ewe_5_uufgf_px5owdlti7" FOREIGN KEY ("id", "__tag_kind_caption_5ewe5uufgf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."catalog_info" ADD CONSTRAINT "__catalog_info_fk_id_tag_kind_qti_catalog_info_s_44_6frj5ulk2g" FOREIGN KEY ("id", "__tag_kind_qti_catalog_info_s44bpzmt5j") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."categorized_statistic_arm" ADD CONSTRAINT "__categorized_statistic_arm_fk_id_tag_kind_xmbqtsqu6q" FOREIGN KEY ("id", "__tag_kind_categorized_mbhnwjzukq") REFERENCES "qti"."statistic" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."categorized_statistic_arm" ADD CONSTRAINT "__categorized_statistic_arm_fk_id_tag_kind_ud_jylibsfa4q" FOREIGN KEY ("id", "__tag_kind_ud_categorized_statistic_6idrz3enis") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction" ADD CONSTRAINT "__choice_interaction_fk_id_tag_kind_qti_choice_prxl6btdny" FOREIGN KEY ("id", "__tag_kind_qti_choice_interaction_lrhq33h2cc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction" ADD CONSTRAINT "__choice_interaction_fk_id_root_kind_gl3vcjjab4" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction_max_selections_message" ADD CONSTRAINT "__choice_interaction_max_selections_message_fk_node_ljbdlz5nru" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_interaction_min_selections_message" ADD CONSTRAINT "__choice_interaction_min_selections_message_fk_node_zvytaotb4p" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_template_ref" ADD CONSTRAINT "__choice_template_ref_fk_document_identifier_tag_hdoouwq6lg" FOREIGN KEY ("document", "identifier", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_template_ref" ADD CONSTRAINT "__choice_template_ref_fk_document_identifier_base_4tj3uu54bx" FOREIGN KEY ("document", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_template_ref" ADD CONSTRAINT "__choice_template_ref_fk_node_document_iaop4pgkmj" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."cite" ADD CONSTRAINT "__cite_fk_id_tag_kind_cite_4_ll_5_xji_4_xt_urosrkldpq" FOREIGN KEY ("id", "__tag_kind_cite_4ll5xji4xt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."code" ADD CONSTRAINT "__code_fk_id_tag_kind_code_2_sjxqe_2_lm_5_ssp7cweetg" FOREIGN KEY ("id", "__tag_kind_code_2sjxqe2lm5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."col" ADD CONSTRAINT "__col_fk_id_tag_kind_col_5_ijislolfm_hsbpzvbp2x" FOREIGN KEY ("id", "__tag_kind_col_5ijislolfm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."col_span" ADD CONSTRAINT "__col_span_fk_node_lffysaeakf" FOREIGN KEY ("node") REFERENCES "qti"."col" ("id");

ALTER TABLE "qti"."colgroup" ADD CONSTRAINT "__colgroup_fk_id_tag_kind_colgroup_3_gqxythtyf_6qtk2zu757" FOREIGN KEY ("id", "__tag_kind_colgroup_3gqxythtyf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."colgroup_span" ADD CONSTRAINT "__colgroup_span_fk_node_lu3i5lypw6" FOREIGN KEY ("node") REFERENCES "qti"."colgroup" ("id");

ALTER TABLE "qti"."comment" ADD CONSTRAINT "__comment_fk_id_tag_kind_comment_nmb_7_feek_53_2tnuqa2fb2" FOREIGN KEY ("id", "__tag_kind_comment_nmb7feek53") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."companion_materials_info" ADD CONSTRAINT "__companion_materials_info_fk_id_tag_kind_qti_vs746y6kf3" FOREIGN KEY ("id", "__tag_kind_qti_companion_materials_info_ndsygptfy3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."container_size" ADD CONSTRAINT "__container_size_fk_id_7px3ii6zuw" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."container_size" ADD CONSTRAINT "__container_size_fk_id_tag_kind_qti_container_size_uqn4djigxs" FOREIGN KEY ("id", "__tag_kind_qti_container_size_ffge7oxu2m") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."contains" ADD CONSTRAINT "__contains_fk_id_zgkj3nkwy5" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."contains" ADD CONSTRAINT "__contains_fk_id_tag_kind_qti_contains_ffvmh_3_ao_5_5gryjokbos" FOREIGN KEY ("id", "__tag_kind_qti_contains_ffvmh3ao5n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_feedback" ADD CONSTRAINT "__content_body_feedback_fk_id_tag_kind_qti_content_iepat44l52" FOREIGN KEY ("id", "__tag_kind_qti_content_body_feedback_y5ggovqlad") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_modal" ADD CONSTRAINT "__content_body_modal_fk_id_tag_kind_qti_content_body_iib6x3vdv7" FOREIGN KEY ("id", "__tag_kind_qti_content_body_modal_3mvh5kt4vk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_rubric" ADD CONSTRAINT "__content_body_rubric_fk_id_tag_kind_qti_content_e4d7xfwvex" FOREIGN KEY ("id", "__tag_kind_qti_content_body_rubric_a6paqpk4uz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_rubric_template" ADD CONSTRAINT "__content_body_rubric_template_fk_id_tag_kind_qti_g6tveojoqg" FOREIGN KEY ("id", "__tag_kind_qti_content_body_rubric_template_vri73ijlw5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_template" ADD CONSTRAINT "__content_body_template_fk_id_tag_kind_qti_content_6wivnuut4w" FOREIGN KEY ("id", "__tag_kind_qti_content_body_template_5bgw5mu5a4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_tag_kind_context_ebo_w7jjsjo6yl" FOREIGN KEY ("id", "__tag_kind_context_ebo2ipjj7k") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_tag_kind_qti_context_4rufw6vqkp" FOREIGN KEY ("id", "__tag_kind_qti_context_declaration_ooqez2egyz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_version_xq447tijbf" FOREIGN KEY ("id", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_id" ADD CONSTRAINT "__context_declaration_id_fk_document_id_tag_holder_3ovlvjpr5t" FOREIGN KEY ("document", "id", "__tag_holder_context_declaration_i5zus6a3u6") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_id" ADD CONSTRAINT "__context_declaration_id_fk_node_document_5vt3ni7od7" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords" ADD CONSTRAINT "__coords_fk_node_owner_kind_gik5zsycuf" FOREIGN KEY ("node", "owner_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_circle" ADD CONSTRAINT "__coords_circle_fk_node_tag_shape_circle_of_6_ebmy_3_xvndrn2fxs" FOREIGN KEY ("node", "__tag_shape_circle_of6ebmy3mb") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_default" ADD CONSTRAINT "__coords_default_fk_node_tag_shape_default_3_74ikjyppyf" FOREIGN KEY ("node", "__tag_shape_default_3zivvvfwas") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_ellipse" ADD CONSTRAINT "__coords_ellipse_fk_node_tag_shape_ellipse_lu_2_44sfodcb7i" FOREIGN KEY ("node", "__tag_shape_ellipse_lu2mxwxu6y") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_poly" ADD CONSTRAINT "__coords_poly_fk_node_tag_shape_poly_u_6_dhqqfxgj_4mvarm5l5u" FOREIGN KEY ("node", "__tag_shape_poly_u6dhqqfxgj") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_rect" ADD CONSTRAINT "__coords_rect_fk_node_tag_shape_rect_jgr_525_splx_jivqwgucia" FOREIGN KEY ("node", "__tag_shape_rect_jgr525splx") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct" ADD CONSTRAINT "__correct_fk_id_xekitpgoxu" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct" ADD CONSTRAINT "__correct_fk_id_yn5ncjb4ja" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct" ADD CONSTRAINT "__correct_fk_id_tag_kind_qti_correct_adce_6_nmlck_4s6bp2abb7" FOREIGN KEY ("id", "__tag_kind_qti_correct_adce6nmlck") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct_response_arm" ADD CONSTRAINT "__correct_response_arm_fk_id_tag_kind_qti_correct_cemzm7tt6m" FOREIGN KEY ("id", "__tag_kind_qti_correct_response_y6bjt74uq7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."correct_response_arm" ADD CONSTRAINT "__correct_response_arm_fk_id_tag_role_correct_a_6_k_5fsnfymwai" FOREIGN KEY ("id", "__tag_role_correct_a6k2xxecvb") REFERENCES "qti"."value_set" ("id", "role") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_case_item_uri" ADD CONSTRAINT "__csm_case_item_uri_fk_id_tag_kind_csmd_case_item_i6ewe5kn7k" FOREIGN KEY ("id", "__tag_kind_csmd_case_item_uri_lxp27cu62q") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_case_item_uri" ADD CONSTRAINT "__csm_case_item_uri_fk_id_labelled_guid_fwmtpxw3u5" FOREIGN KEY ("id", "labelled_guid") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_case_item_uri" ADD CONSTRAINT "__csm_case_item_uri_fk_labelled_guid_nzrvzpcidd" FOREIGN KEY ("labelled_guid") REFERENCES "qti"."csm_labelled_guid" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_guid" ADD CONSTRAINT "__csm_guid_fk_id_tag_kind_csmd_guid_zslp_2_vpfy_4_nwkt6gtnpi" FOREIGN KEY ("id", "__tag_kind_csmd_guid_zslp2vpfy4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_guid" ADD CONSTRAINT "__csm_guid_fk_id_labelled_guid_oaaq4osnd4" FOREIGN KEY ("id", "labelled_guid") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_guid" ADD CONSTRAINT "__csm_guid_fk_labelled_guid_5yqbw56ujc" FOREIGN KEY ("labelled_guid") REFERENCES "qti"."csm_labelled_guid" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_label" ADD CONSTRAINT "__csm_label_fk_id_tag_kind_csmd_label_fz_6_gvoerne_7gcay67gr5" FOREIGN KEY ("id", "__tag_kind_csmd_label_fz6gvoerne") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_label" ADD CONSTRAINT "__csm_label_fk_id_labelled_guid_6l5lljoiac" FOREIGN KEY ("id", "labelled_guid") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_label" ADD CONSTRAINT "__csm_label_fk_labelled_guid_hown6ftcvg" FOREIGN KEY ("labelled_guid") REFERENCES "qti"."csm_labelled_guid" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_labelled_guid" ADD CONSTRAINT "__csm_labelled_guid_fk_id_tag_kind_csmd_labelled_5gragyazhx" FOREIGN KEY ("id", "__tag_kind_csmd_labelled_guid_xvmt4w5scu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_labelled_guid" ADD CONSTRAINT "__csm_labelled_guid_fk_id_set_of_guids_fyca6j7pe4" FOREIGN KEY ("id", "set_of_guids") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_labelled_guid" ADD CONSTRAINT "__csm_labelled_guid_fk_set_of_guids_gdhcsqzbjr" FOREIGN KEY ("set_of_guids") REFERENCES "qti"."csm_set_of_guids" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata" ADD CONSTRAINT "__csm_metadata_fk_id_tag_kind_csmd_curriculum_rp6lbinb7h" FOREIGN KEY ("id", "__tag_kind_csmd_curriculum_standards_metadata_blihnqiuuu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata" ADD CONSTRAINT "__csm_metadata_fk_id_set_y3tcs7o6ng" FOREIGN KEY ("id", "set") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata" ADD CONSTRAINT "__csm_metadata_fk_set_l7csoijnrc" FOREIGN KEY ("set") REFERENCES "qti"."csm_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_metadata_provider_id" ADD CONSTRAINT "__csm_metadata_provider_id_fk_node_wf5ryn5udk" FOREIGN KEY ("node") REFERENCES "qti"."csm_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set" ADD CONSTRAINT "__csm_set_fk_id_tag_kind_csmd_curriculum_standards_kx5n6ykiwt" FOREIGN KEY ("id", "__tag_kind_csmd_curriculum_standards_metadata_set_izclqmb4jl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set" ADD CONSTRAINT "__csm_set_fk_id_host_4hmsoh7xah" FOREIGN KEY ("id", "host") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids" ADD CONSTRAINT "__csm_set_of_guids_fk_id_tag_kind_csmd_set_of_gui_ds_ajy6f5qrwt" FOREIGN KEY ("id", "__tag_kind_csmd_set_of_gui_ds_wsrxqslv22") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids" ADD CONSTRAINT "__csm_set_of_guids_fk_id_metadata_uzbadimt7q" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids" ADD CONSTRAINT "__csm_set_of_guids_fk_metadata_h4nbya5u2v" FOREIGN KEY ("metadata") REFERENCES "qti"."csm_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids_region" ADD CONSTRAINT "__csm_set_of_guids_region_fk_node_4bagvupzr4" FOREIGN KEY ("node") REFERENCES "qti"."csm_set_of_guids" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_of_guids_version" ADD CONSTRAINT "__csm_set_of_guids_version_fk_node_q2tuoj34tt" FOREIGN KEY ("node") REFERENCES "qti"."csm_set_of_guids" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_resource_label" ADD CONSTRAINT "__csm_set_resource_label_fk_node_adhanmu3bb" FOREIGN KEY ("node") REFERENCES "qti"."csm_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."csm_set_resource_part_id" ADD CONSTRAINT "__csm_set_resource_part_id_fk_node_pdnb6d7hps" FOREIGN KEY ("node") REFERENCES "qti"."csm_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."custom_operator" ADD CONSTRAINT "__custom_operator_fk_id_kefw73uwn4" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."custom_operator" ADD CONSTRAINT "__custom_operator_fk_id_tag_kind_qti_custom_operator_lgrzuqjcys" FOREIGN KEY ("id", "__tag_kind_qti_custom_operator_hgnfdy7pnw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."custom_operator_class" ADD CONSTRAINT "__custom_operator_class_fk_node_3dfgstdo7s" FOREIGN KEY ("node") REFERENCES "qti"."custom_operator" ("id");

ALTER TABLE "qti"."custom_operator_definition" ADD CONSTRAINT "__custom_operator_definition_fk_node_dfov4csotl" FOREIGN KEY ("node") REFERENCES "qti"."custom_operator" ("id");

ALTER TABLE "qti"."dd" ADD CONSTRAINT "__dd_fk_id_tag_kind_dd_fz_7_u_3_fe_6_ih_gcbrq3lfpx" FOREIGN KEY ("id", "__tag_kind_dd_fz7u3fe6ih") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declaration" ADD CONSTRAINT "__declaration_fk_id_document_pdsrpobeub" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declaration_external_scored" ADD CONSTRAINT "__declaration_external_scored_fk_declaration_bxmjtnregf" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_interpretation" ADD CONSTRAINT "__declaration_interpretation_fk_declaration_ps6b7rahqa" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_long_interpretation" ADD CONSTRAINT "__declaration_long_interpretation_fk_declaration_6esmkzbmky" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_mastery_value" ADD CONSTRAINT "__declaration_mastery_value_fk_declaration_kznj66n5qv" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_normal_maximum" ADD CONSTRAINT "__declaration_normal_maximum_fk_declaration_ouqrml32ux" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_normal_minimum" ADD CONSTRAINT "__declaration_normal_minimum_fk_declaration_xpeecehvfd" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_variable_identifier_ref" ADD CONSTRAINT "__declaration_variable_identifier_ref_fk_declaration_ynmg2ojbwh" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declaration_view" ADD CONSTRAINT "__declaration_view_fk_declaration_grq4o2auzk" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."declared_adaptive" ADD CONSTRAINT "__declared_adaptive_fk_node_2ekpm2as3f" FOREIGN KEY ("node") REFERENCES "qti"."assessment_item" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_area_mapping_default_value" ADD CONSTRAINT "__declared_area_mapping_default_value_fk_node_ztftp5ed66" FOREIGN KEY ("node") REFERENCES "qti"."area_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associable_hotspot_show_hide" ADD CONSTRAINT "__declared_associable_hotspot_show_hide_fk_node_lb6mfj3ep3" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associate_max_associations" ADD CONSTRAINT "__declared_associate_max_associations_fk_node_2h5eblsl34" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associate_min_associations" ADD CONSTRAINT "__declared_associate_min_associations_fk_node_n5lihs7cmg" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associate_shuffle" ADD CONSTRAINT "__declared_associate_shuffle_fk_node_dtdv6jmd45" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_default_value" ADD CONSTRAINT "__declared_default_value_fk_node_sc62hbnaee" FOREIGN KEY ("node") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_extended_text_base" ADD CONSTRAINT "__declared_extended_text_base_fk_node_vz32gen3te" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_extended_text_format" ADD CONSTRAINT "__declared_extended_text_format_fk_node_yzofl327pt" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_extended_text_min_strings" ADD CONSTRAINT "__declared_extended_text_min_strings_fk_node_mzvwzk7zj3" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_feedback_block_show_hide" ADD CONSTRAINT "__declared_feedback_block_show_hide_fk_node_vyj5jwhosa" FOREIGN KEY ("node") REFERENCES "qti"."feedback_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_feedback_inline_show_hide" ADD CONSTRAINT "__declared_feedback_inline_show_hide_fk_node_fik74io7ff" FOREIGN KEY ("node") REFERENCES "qti"."feedback_inline" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_fixed" ADD CONSTRAINT "__declared_fixed_fk_node_azddieafgj" FOREIGN KEY ("node") REFERENCES "qti"."simple_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_img_show_hide" ADD CONSTRAINT "__declared_gap_img_show_hide_fk_node_cefuh7fnws" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_match_max_associations" ADD CONSTRAINT "__declared_gap_match_max_associations_fk_node_qrrid2uhf7" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_match_shuffle" ADD CONSTRAINT "__declared_gap_match_shuffle_fk_node_ezwihacwjp" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_required" ADD CONSTRAINT "__declared_gap_required_fk_node_6vy5zg3uod" FOREIGN KEY ("node") REFERENCES "qti"."gap" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_show_hide" ADD CONSTRAINT "__declared_gap_show_hide_fk_node_55ztek7idw" FOREIGN KEY ("node") REFERENCES "qti"."gap" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_text_show_hide" ADD CONSTRAINT "__declared_gap_text_show_hide_fk_node_63pbqwqbg3" FOREIGN KEY ("node") REFERENCES "qti"."gap_text" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_graphic_associate_max_associations" ADD CONSTRAINT "__declared_graphic_associate_max_associations_fk_z5vtt3h4mo" FOREIGN KEY ("node") REFERENCES "qti"."graphic_associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_graphic_gap_match_max_associations" ADD CONSTRAINT "__declared_graphic_gap_match_max_associations_fk_zj7lykqfcx" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hotspot_choice_show_hide" ADD CONSTRAINT "__declared_hotspot_choice_show_hide_fk_node_u5faanpqjc" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hotspot_max_choices" ADD CONSTRAINT "__declared_hotspot_max_choices_fk_node_kpzeraq5x5" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hotspot_min_choices" ADD CONSTRAINT "__declared_hotspot_min_choices_fk_node_ew4xj6xmpp" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hottext_max_choices" ADD CONSTRAINT "__declared_hottext_max_choices_fk_node_oxdmrhxv5j" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hottext_min_choices" ADD CONSTRAINT "__declared_hottext_min_choices_fk_node_wbr5lamjaj" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hottext_show_hide" ADD CONSTRAINT "__declared_hottext_show_hide_fk_node_hw32ph4vhn" FOREIGN KEY ("node") REFERENCES "qti"."hottext" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_include_boundary" ADD CONSTRAINT "__declared_include_boundary_fk_node_pbvx26ilv3" FOREIGN KEY ("node") REFERENCES "qti"."interpolation_table_entry" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_include_lower_bound" ADD CONSTRAINT "__declared_include_lower_bound_fk_node_ped2a3xl5q" FOREIGN KEY ("node") REFERENCES "qti"."equal" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_include_upper_bound" ADD CONSTRAINT "__declared_include_upper_bound_fk_node_cxsgi7rsgh" FOREIGN KEY ("node") REFERENCES "qti"."equal" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_inline_choice_fixed" ADD CONSTRAINT "__declared_inline_choice_fixed_fk_node_6zkoeqorjm" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_inline_choice_min_choices" ADD CONSTRAINT "__declared_inline_choice_min_choices_fk_node_v27wdcbt47" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_inline_choice_required" ADD CONSTRAINT "__declared_inline_choice_required_fk_node_nk4ybygkiu" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_inline_choice_show_hide" ADD CONSTRAINT "__declared_inline_choice_show_hide_fk_node_5z2sw4vu2g" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_inline_choice_shuffle" ADD CONSTRAINT "__declared_inline_choice_shuffle_fk_node_wleojwzreq" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_map_entry_case_sensitive" ADD CONSTRAINT "__declared_map_entry_case_sensitive_fk_node_s2ps3444n3" FOREIGN KEY ("node") REFERENCES "qti"."map_entry" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_mapping_default_value" ADD CONSTRAINT "__declared_mapping_default_value_fk_node_odiqgp3tz7" FOREIGN KEY ("node") REFERENCES "qti"."mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_match_max_associations" ADD CONSTRAINT "__declared_match_max_associations_fk_node_xhdvl24qfz" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_match_min_associations" ADD CONSTRAINT "__declared_match_min_associations_fk_node_zmlcmmx764" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_match_shuffle" ADD CONSTRAINT "__declared_match_shuffle_fk_node_3wlwyq6fso" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_math_variable" ADD CONSTRAINT "__declared_math_variable_fk_node_ecbtvvsfvu" FOREIGN KEY ("node") REFERENCES "qti"."template_declaration_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_max_choices" ADD CONSTRAINT "__declared_max_choices_fk_node_y7jlgtncxu" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_media_loop" ADD CONSTRAINT "__declared_media_loop_fk_node_fmmg6nicbb" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_min_choices" ADD CONSTRAINT "__declared_min_choices_fk_node_hravvjubmj" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_order_shuffle" ADD CONSTRAINT "__declared_order_shuffle_fk_node_m2jpcwf6ud" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_orientation" ADD CONSTRAINT "__declared_orientation_fk_node_66p7tw6wgw" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_param_variable" ADD CONSTRAINT "__declared_param_variable_fk_node_f5xg36jh5g" FOREIGN KEY ("node") REFERENCES "qti"."template_declaration_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_position_object_max_choices" ADD CONSTRAINT "__declared_position_object_max_choices_fk_node_z33s4bgg4z" FOREIGN KEY ("node") REFERENCES "qti"."position_object_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_base" ADD CONSTRAINT "__declared_printed_variable_base_fk_node_pt6y33os7o" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_delimiter" ADD CONSTRAINT "__declared_printed_variable_delimiter_fk_node_7d7b5p6trc" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_mapping_indicator" ADD CONSTRAINT "__declared_printed_variable_mapping_indicator_fk_iaepqht5zi" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_power_form" ADD CONSTRAINT "__declared_printed_variable_power_form_fk_node_vp3m6giznm" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "__declared_ref_fk_document_identifier_declaration_6mv3afxrwr" FOREIGN KEY ("document", "identifier", "declaration_kind") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "__declared_ref_fk_id_tag_kind_declared_chtay_4_st_64_737grlrvxv" FOREIGN KEY ("id", "__tag_kind_declared_chtay4st64") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_ref" ADD CONSTRAINT "__declared_ref_fk_id_referrer_kind_ym5jvsd3mo" FOREIGN KEY ("id", "referrer_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_rounding_mode" ADD CONSTRAINT "__declared_rounding_mode_fk_node_up55mfxhaz" FOREIGN KEY ("node") REFERENCES "qti"."equal_rounded" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_rubric_template_block_show_hide" ADD CONSTRAINT "__declared_rubric_template_block_show_hide_fk_node_nhhdywdoss" FOREIGN KEY ("node") REFERENCES "qti"."rubric_template_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_rubric_template_inline_show_hide" ADD CONSTRAINT "__declared_rubric_template_inline_show_hide_fk_node_sbphi5cue2" FOREIGN KEY ("node") REFERENCES "qti"."rubric_template_inline" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_select_point_max_choices" ADD CONSTRAINT "__declared_select_point_max_choices_fk_node_yo3b6kavsz" FOREIGN KEY ("node") REFERENCES "qti"."select_point_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_select_point_min_choices" ADD CONSTRAINT "__declared_select_point_min_choices_fk_node_dfg5rlttmm" FOREIGN KEY ("node") REFERENCES "qti"."select_point_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_show_hide" ADD CONSTRAINT "__declared_show_hide_fk_node_y7io7lazvc" FOREIGN KEY ("node") REFERENCES "qti"."simple_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_shuffle" ADD CONSTRAINT "__declared_shuffle_fk_node_o4rn4edxva" FOREIGN KEY ("node") REFERENCES "qti"."choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_slider_step_label" ADD CONSTRAINT "__declared_slider_step_label_fk_node_2lmfxy6urk" FOREIGN KEY ("node") REFERENCES "qti"."slider_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_substring" ADD CONSTRAINT "__declared_substring_fk_node_dr6edie4bt" FOREIGN KEY ("node") REFERENCES "qti"."string_match" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_template_block_show_hide" ADD CONSTRAINT "__declared_template_block_show_hide_fk_node_ohunq2ls63" FOREIGN KEY ("node") REFERENCES "qti"."template_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_template_feedback_block_show_hide" ADD CONSTRAINT "__declared_template_feedback_block_show_hide_fk_node_pb6ahfblff" FOREIGN KEY ("node") REFERENCES "qti"."template_feedback_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_template_inline_show_hide" ADD CONSTRAINT "__declared_template_inline_show_hide_fk_node_hyb4ctezno" FOREIGN KEY ("node") REFERENCES "qti"."template_inline" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_text_entry_base" ADD CONSTRAINT "__declared_text_entry_base_fk_node_unpjkeiten" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_tolerance_mode" ADD CONSTRAINT "__declared_tolerance_mode_fk_node_nirjmcd4y6" FOREIGN KEY ("node") REFERENCES "qti"."equal" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_track_kind" ADD CONSTRAINT "__declared_track_kind_fk_node_azutondble" FOREIGN KEY ("node") REFERENCES "qti"."track" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value" ADD CONSTRAINT "__declared_value_fk_id_tag_kind_qti_value_a_22_pfhf_jauk5xk5xj" FOREIGN KEY ("id", "__tag_kind_qti_value_a22pfhf3za") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value" ADD CONSTRAINT "__declared_value_fk_id_value_set_position_vwygqxfi6l" FOREIGN KEY ("id", "value_set", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value" ADD CONSTRAINT "__declared_value_fk_value_set_shape_xzwb4amgw4" FOREIGN KEY ("value_set", "shape") REFERENCES "qti"."value_set" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_boolean" ADD CONSTRAINT "__declared_value_boolean_fk_id_tag_base_type_boolean_x6nluowxw7" FOREIGN KEY ("id", "__tag_base_type_boolean_kh6dvyf44c") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_directed_pair" ADD CONSTRAINT "__declared_value_directed_pair_fk_id_tag_base_type_s66pkuzt37" FOREIGN KEY ("id", "__tag_base_type_directed_pair_v5chnfdlrm") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_duration" ADD CONSTRAINT "__declared_value_duration_fk_id_tag_base_type_xywa3wenpe" FOREIGN KEY ("id", "__tag_base_type_duration_kk5q7nzzuo") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_file" ADD CONSTRAINT "__declared_value_file_fk_id_tag_base_type_file_pesir_f7ctotkmyo" FOREIGN KEY ("id", "__tag_base_type_file_pesir3i32k") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_float" ADD CONSTRAINT "__declared_value_float_fk_id_tag_base_type_float_3_nh3q3iblhm" FOREIGN KEY ("id", "__tag_base_type_float_3szfpoo33f") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_identifier" ADD CONSTRAINT "__declared_value_identifier_fk_id_tag_base_type_elcr7q4rl7" FOREIGN KEY ("id", "__tag_base_type_identifier_skvmp74o7n") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_integer" ADD CONSTRAINT "__declared_value_integer_fk_id_tag_base_type_integer_pk3kvnfdz4" FOREIGN KEY ("id", "__tag_base_type_integer_azuvzqcuvs") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_pair" ADD CONSTRAINT "__declared_value_pair_fk_id_tag_base_type_pair_m_6_e_hikp7eey3b" FOREIGN KEY ("id", "__tag_base_type_pair_m6e2ivamry") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_point" ADD CONSTRAINT "__declared_value_point_fk_id_tag_base_type_point_c_2_jykv3lgoe2" FOREIGN KEY ("id", "__tag_base_type_point_c2g2yehgpw") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_string" ADD CONSTRAINT "__declared_value_string_fk_id_tag_base_type_string_3jrhsa7n4m" FOREIGN KEY ("id", "__tag_base_type_string_hs2lnlklfn") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_value_uri" ADD CONSTRAINT "__declared_value_uri_fk_id_tag_base_type_uri_7_62m5ydt7xt" FOREIGN KEY ("id", "__tag_base_type_uri_7nvvazwudq") REFERENCES "qti"."declared_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_valuetype" ADD CONSTRAINT "__declared_valuetype_fk_node_oc3xdilugk" FOREIGN KEY ("node") REFERENCES "qti"."param" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default" ADD CONSTRAINT "__default_fk_id_yae276tuus" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default" ADD CONSTRAINT "__default_fk_id_3w4dzl762a" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default" ADD CONSTRAINT "__default_fk_id_tag_kind_qti_default_jhwhuox_3_of_eoaql2ij27" FOREIGN KEY ("id", "__tag_kind_qti_default_jhwhuox3of") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default_value_arm" ADD CONSTRAINT "__default_value_arm_fk_id_tag_kind_qti_default_value_xhc5veob6w" FOREIGN KEY ("id", "__tag_kind_qti_default_value_ectibzonfr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."default_value_arm" ADD CONSTRAINT "__default_value_arm_fk_id_tag_role_default_st_3_rg_3_lmb42endeu" FOREIGN KEY ("id", "__tag_role_default_st3rg3iau2") REFERENCES "qti"."value_set" ("id", "role") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."delete" ADD CONSTRAINT "__delete_fk_id_guc43fhhuy" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."delete" ADD CONSTRAINT "__delete_fk_id_tag_kind_qti_delete_w_5_w_6_qiomne_ashud7226e" FOREIGN KEY ("id", "__tag_kind_qti_delete_w5w6qiomne") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_id_tag_kind_cp_dependency_zkvh_26_wnnn5r3xed" FOREIGN KEY ("id", "__tag_kind_cp_dependency_zkvh26cbdi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_id_package_cbnscsch6q" FOREIGN KEY ("id", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_package_resource_mszunxanb6" FOREIGN KEY ("package", "resource") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dependency" ADD CONSTRAINT "__dependency_fk_package_target_bi3d2qvhiq" FOREIGN KEY ("package", "target") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."details" ADD CONSTRAINT "__details_fk_id_tag_kind_details_mgnz_5_owncp_vahcpn7oqk" FOREIGN KEY ("id", "__tag_kind_details_mgnz5owncp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."details_open" ADD CONSTRAINT "__details_open_fk_node_sqn6d7jg5p" FOREIGN KEY ("node") REFERENCES "qti"."details" ("id");

ALTER TABLE "qti"."dfn" ADD CONSTRAINT "__dfn_fk_id_tag_kind_dfn_xgpywzxjkn_uytsux3imt" FOREIGN KEY ("id", "__tag_kind_dfn_xgpywzxjkn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."div" ADD CONSTRAINT "__div_fk_id_tag_kind_div_tqs_6_ldkv_65_ojgf7lwcs4" FOREIGN KEY ("id", "__tag_kind_div_tqs6ldkv65") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."divide" ADD CONSTRAINT "__divide_fk_id_5ne4j5abf7" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."divide" ADD CONSTRAINT "__divide_fk_id_tag_kind_qti_divide_dgjmhfkvv_3_pvlvhxtstb" FOREIGN KEY ("id", "__tag_kind_qti_divide_dgjmhfkvv3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dl" ADD CONSTRAINT "__dl_fk_id_tag_kind_dl_aw_2_ei_3_s_2_i_4_5dfgqgnjko" FOREIGN KEY ("id", "__tag_kind_dl_aw2ei3s2i4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_id_tag_kind_document_3_ilsmwej_65_dazgvbo74c" FOREIGN KEY ("id", "__tag_kind_document_3ilsmwej65") REFERENCES "qti"."tree" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_id_version_root_i36v6ovq5m" FOREIGN KEY ("id", "version", "root") REFERENCES "qti"."tree" ("id", "version", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_path_4tuuhnqkls" FOREIGN KEY ("package", "path") REFERENCES "qti"."package_entry" ("package", "path") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_resource_7mq3hcy5mi" FOREIGN KEY ("package", "resource") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_resource_resource_type_ysuyluweu3" FOREIGN KEY ("package", "resource", "resource_type") REFERENCES "qti"."resource" ("package", "identifier", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_package_version_eu6wa6vo6k" FOREIGN KEY ("package", "version") REFERENCES "qti"."package" ("id", "schemaversion") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document" ADD CONSTRAINT "__document_fk_resource_type_root_5efvxdghx6" FOREIGN KEY ("resource_type", "root") REFERENCES "qti"."root_of_type" ("type", "root");

ALTER TABLE "qti"."document_id" ADD CONSTRAINT "__document_id_fk_document_ufpi2unt5l" FOREIGN KEY ("document") REFERENCES "qti"."document" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_identifier" ADD CONSTRAINT "__document_identifier_fk_document_package_resource_jwndwc6bku" FOREIGN KEY ("document", "package", "resource", "root") REFERENCES "qti"."document" ("id", "package", "resource", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_lang" ADD CONSTRAINT "__document_lang_fk_document_package_resource_lbo3acms5b" FOREIGN KEY ("document", "package", "resource") REFERENCES "qti"."document" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_title" ADD CONSTRAINT "__document_title_fk_document_package_resource_root_jhvo3sglgq" FOREIGN KEY ("document", "package", "resource", "root") REFERENCES "qti"."document" ("id", "package", "resource", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drawing_interaction" ADD CONSTRAINT "__drawing_interaction_fk_id_tag_kind_qti_drawing_nql6ucz76p" FOREIGN KEY ("id", "__tag_kind_qti_drawing_interaction_i7yf6jyigs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drawing_interaction" ADD CONSTRAINT "__drawing_interaction_fk_id_root_kind_uuypn6uh6o" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode" ADD CONSTRAINT "__drd_access_mode_fk_id_tag_kind_drd_access_mode_vuxjxmmlzw" FOREIGN KEY ("id", "__tag_kind_drd_access_mode_njghsaxgib") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode" ADD CONSTRAINT "__drd_access_mode_fk_id_owner_rn7ubxr6fm" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode" ADD CONSTRAINT "__drd_access_mode_fk_owner_jzvejnp7gm" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD CONSTRAINT "__drd_access_mode_adapted_fk_id_tag_kind_drd_access_7vr72hwvgw" FOREIGN KEY ("id", "__tag_kind_drd_access_mode_adapted_6n47kwzvq4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD CONSTRAINT "__drd_access_mode_adapted_fk_id_owner_an2mivqfcv" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_access_mode_adapted" ADD CONSTRAINT "__drd_access_mode_adapted_fk_owner_wbdqipwa67" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_detail" ADD CONSTRAINT "__drd_adaptation_detail_fk_id_tag_kind_drd_exjqq7blbz" FOREIGN KEY ("id", "__tag_kind_drd_adaptation_detail_q4chm2z7fd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_detail" ADD CONSTRAINT "__drd_adaptation_detail_fk_id_owner_lrm72yi2bp" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_detail" ADD CONSTRAINT "__drd_adaptation_detail_fk_owner_p6k6ryibwf" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD CONSTRAINT "__drd_adaptation_media_type_fk_id_tag_kind_drd_b576jcpkfd" FOREIGN KEY ("id", "__tag_kind_drd_adaptation_media_type_ms4x34iisf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD CONSTRAINT "__drd_adaptation_media_type_fk_id_owner_flyzlynmlg" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_media_type" ADD CONSTRAINT "__drd_adaptation_media_type_fk_owner_ofx2n4dzrq" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_type" ADD CONSTRAINT "__drd_adaptation_type_fk_id_tag_kind_drd_adaptation_mkwzx225pn" FOREIGN KEY ("id", "__tag_kind_drd_adaptation_type_cr4axc6ol7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_type" ADD CONSTRAINT "__drd_adaptation_type_fk_id_owner_lvvmww4mmu" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_adaptation_type" ADD CONSTRAINT "__drd_adaptation_type_fk_owner_3oowyhvioq" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_api_interoperable" ADD CONSTRAINT "__drd_api_interoperable_fk_id_tag_kind_drd_api_ir7glc237l" FOREIGN KEY ("id", "__tag_kind_drd_api_interoperable_qnxbi5kb5p") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_api_interoperable" ADD CONSTRAINT "__drd_api_interoperable_fk_id_owner_cxjwz34g42" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_api_interoperable" ADD CONSTRAINT "__drd_api_interoperable_fk_owner_yqohhnuw6p" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_at_interoperable" ADD CONSTRAINT "__drd_at_interoperable_fk_id_tag_kind_drd_at_mjka4ackmf" FOREIGN KEY ("id", "__tag_kind_drd_at_interoperable_zjkivbnkxx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_at_interoperable" ADD CONSTRAINT "__drd_at_interoperable_fk_id_owner_hk2hm45sxf" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_at_interoperable" ADD CONSTRAINT "__drd_at_interoperable_fk_owner_e52xbcn3hb" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_control_flexibility" ADD CONSTRAINT "__drd_control_flexibility_fk_id_tag_kind_drd_control_vfpbix2kua" FOREIGN KEY ("id", "__tag_kind_drd_control_flexibility_ogpln6c34g") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_control_flexibility" ADD CONSTRAINT "__drd_control_flexibility_fk_id_owner_5hrfwrw7en" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_control_flexibility" ADD CONSTRAINT "__drd_control_flexibility_fk_owner_pcgv3lf3mm" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_display_transformability" ADD CONSTRAINT "__drd_display_transformability_fk_id_tag_kind_drd_jybpwfkthu" FOREIGN KEY ("id", "__tag_kind_drd_display_transformability_hlcmwybrbn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_display_transformability" ADD CONSTRAINT "__drd_display_transformability_fk_id_owner_wlolwxvc5z" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_display_transformability" ADD CONSTRAINT "__drd_display_transformability_fk_owner_7vr6dpp3m4" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_id_tag_iditd5uyhp" FOREIGN KEY ("id", "__tag_kind_drd_educational_complexity_of_adaptation_mfzwmr74m2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_id_ewfvtarag3" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_complexity_of_adaptation" ADD CONSTRAINT "__drd_educational_complexity_of_adaptation_fk_owner_sw4eaoxuwe" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD CONSTRAINT "__drd_educational_level_of_adaptation_fk_id_tag_kind_m5jrqt3fve" FOREIGN KEY ("id", "__tag_kind_drd_educational_level_of_adaptation_ezcznxqajt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD CONSTRAINT "__drd_educational_level_of_adaptation_fk_id_owner_smy723fsu5" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_educational_level_of_adaptation" ADD CONSTRAINT "__drd_educational_level_of_adaptation_fk_owner_r5kgg27jjw" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_has_adaptation" ADD CONSTRAINT "__drd_has_adaptation_fk_id_tag_kind_drd_has_36m2bsoxuy" FOREIGN KEY ("id", "__tag_kind_drd_has_adaptation_4x7nx53hok") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_has_adaptation" ADD CONSTRAINT "__drd_has_adaptation_fk_id_owner_fin43w3cci" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_has_adaptation" ADD CONSTRAINT "__drd_has_adaptation_fk_owner_4uklqawtxz" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_hazard" ADD CONSTRAINT "__drd_hazard_fk_id_tag_kind_drd_hazard_3_n_5_ihtfyij_dantc7k2rm" FOREIGN KEY ("id", "__tag_kind_drd_hazard_3n5ihtfyij") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_hazard" ADD CONSTRAINT "__drd_hazard_fk_id_owner_fw6qwjvuan" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_hazard" ADD CONSTRAINT "__drd_hazard_fk_owner_j66pae5hpj" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD CONSTRAINT "__drd_is_adaptation_of_fk_id_tag_kind_drd_is_op6hhr7uxb" FOREIGN KEY ("id", "__tag_kind_drd_is_adaptation_of_viq3qn3bmy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD CONSTRAINT "__drd_is_adaptation_of_fk_id_owner_k3kokwweg7" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_adaptation_of" ADD CONSTRAINT "__drd_is_adaptation_of_fk_owner_2jbu57gyfx" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD CONSTRAINT "__drd_is_full_adaptation_of_fk_id_tag_kind_drd_is_oigemsrwkx" FOREIGN KEY ("id", "__tag_kind_drd_is_full_adaptation_of_tvwox3ztrp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD CONSTRAINT "__drd_is_full_adaptation_of_fk_id_owner_m77kbgb332" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_full_adaptation_of" ADD CONSTRAINT "__drd_is_full_adaptation_of_fk_owner_uulxxpv45w" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD CONSTRAINT "__drd_is_partial_adaptation_of_fk_id_tag_kind_drd_is_ct2d4bsqnu" FOREIGN KEY ("id", "__tag_kind_drd_is_partial_adaptation_of_5ojegjo7cp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD CONSTRAINT "__drd_is_partial_adaptation_of_fk_id_owner_vpnno7y2hr" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_is_partial_adaptation_of" ADD CONSTRAINT "__drd_is_partial_adaptation_of_fk_owner_aq2gyhxpjy" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD CONSTRAINT "__drd_language_of_adaptation_fk_id_tag_kind_drd_e7yff3ecq2" FOREIGN KEY ("id", "__tag_kind_drd_language_of_adaptation_p3eiulmmnm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD CONSTRAINT "__drd_language_of_adaptation_fk_id_owner_quhzgdhsum" FOREIGN KEY ("id", "owner") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drd_language_of_adaptation" ADD CONSTRAINT "__drd_language_of_adaptation_fk_owner_izhddtm3go" FOREIGN KEY ("owner") REFERENCES "qti"."access_for_all_resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dt" ADD CONSTRAINT "__dt_fk_id_tag_kind_dt_se_6_ui_3_fyrg_pbrgxntfxn" FOREIGN KEY ("id", "__tag_kind_dt_se6ui3fyrg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_gte" ADD CONSTRAINT "__duration_gte_fk_id_soljtl2ru6" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_gte" ADD CONSTRAINT "__duration_gte_fk_id_tag_kind_qti_duration_gte_x7s7qaqvye" FOREIGN KEY ("id", "__tag_kind_qti_duration_gte_lzoivglsok") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_lt" ADD CONSTRAINT "__duration_lt_fk_id_t4gbten367" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."duration_lt" ADD CONSTRAINT "__duration_lt_fk_id_tag_kind_qti_duration_lt_xn_3_2es53ohito" FOREIGN KEY ("id", "__tag_kind_qti_duration_lt_xn3larffx7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_child_child_ancestry_5lghcs4zbj" FOREIGN KEY ("child", "child_ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_child_tree_version_child_kind_addtg4tokv" FOREIGN KEY ("child", "tree", "version", "child_kind") REFERENCES "qti"."node" ("id", "tree", "version", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_parent_parent_ancestry_6rwshsalfn" FOREIGN KEY ("parent", "parent_ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_parent_tree_version_parent_kind_v7ynxlx4m6" FOREIGN KEY ("parent", "tree", "version", "parent_kind") REFERENCES "qti"."node" ("id", "tree", "version", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_parent_ancestry_parent_kind_child_ancestry_3a4njwadrv" FOREIGN KEY ("parent_ancestry", "parent_kind", "child_ancestry") REFERENCES "qti"."ancestry_step" ("ancestry", "kind", "next");

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_version_parent_kind_child_kind_3g237kcsl6" FOREIGN KEY ("version", "parent_kind", "child_kind") REFERENCES "qti"."admission" ("version", "parent", "child");

ALTER TABLE "qti"."em" ADD CONSTRAINT "__em_fk_id_tag_kind_em_ooisxn_7_pss_nhdo6z3uzk" FOREIGN KEY ("id", "__tag_kind_em_ooisxn7pss") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."end_attempt_count_attempt" ADD CONSTRAINT "__end_attempt_count_attempt_fk_node_exmvncir27" FOREIGN KEY ("node") REFERENCES "qti"."end_attempt_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."end_attempt_interaction" ADD CONSTRAINT "__end_attempt_interaction_fk_id_tag_kind_qti_end_limopuebx3" FOREIGN KEY ("id", "__tag_kind_qti_end_attempt_interaction_ez7tuuts3e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."end_attempt_interaction" ADD CONSTRAINT "__end_attempt_interaction_fk_id_root_kind_ibnqo2y2b3" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."entity_reference" ADD CONSTRAINT "__entity_reference_fk_id_tag_kind_entity_ref_dhfdm5v4z3" FOREIGN KEY ("id", "__tag_kind_entity_ref_vjzwdvldjb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal" ADD CONSTRAINT "__equal_fk_id_avgfouuask" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal" ADD CONSTRAINT "__equal_fk_id_tag_kind_qti_equal_srgxur_27_t_7_ekrupelmig" FOREIGN KEY ("id", "__tag_kind_qti_equal_srgxur27t7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal_rounded" ADD CONSTRAINT "__equal_rounded_fk_id_dm5fy2x5fx" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal_rounded" ADD CONSTRAINT "__equal_rounded_fk_id_tag_kind_qti_equal_rounded_v_6_lmnw7bvxu4" FOREIGN KEY ("id", "__tag_kind_qti_equal_rounded_v6objmsi4d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal_rounded_figures_ref" ADD CONSTRAINT "__equal_rounded_figures_ref_fk_node_tag_figures_kind_43hvbtqdem" FOREIGN KEY ("node", "__tag_figures_kind_ref_zxnonbgyte") REFERENCES "qti"."equal_rounded" ("id", "figures_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."equal_tolerance" ADD CONSTRAINT "__equal_tolerance_fk_node_tolerance_mode_zggqkxh66v" FOREIGN KEY ("node", "tolerance_mode") REFERENCES "qti"."equal" ("id", "tolerance_mode") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."exit_response" ADD CONSTRAINT "__exit_response_fk_id_tag_kind_qti_exit_response_7_aaj7ucbwcy" FOREIGN KEY ("id", "__tag_kind_qti_exit_response_7dymabqkc4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."exit_template" ADD CONSTRAINT "__exit_template_fk_id_tag_kind_qti_exit_template_2ifyz2wilo" FOREIGN KEY ("id", "__tag_kind_qti_exit_template_ifkvvzdxdx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."exit_test" ADD CONSTRAINT "__exit_test_fk_id_tag_kind_qti_exit_test_ju_554_uthcipxi25" FOREIGN KEY ("id", "__tag_kind_qti_exit_test_ju554ikqov") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression" ADD CONSTRAINT "__expression_fk_id_document_kind_fwcnepbw3e" FOREIGN KEY ("id", "document", "kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression" ADD CONSTRAINT "__expression_fk_kind_min_tziv42ghun" FOREIGN KEY ("kind", "min") REFERENCES "qti"."operator_arity" ("kind", "min");

ALTER TABLE "qti"."expression_exclude_category" ADD CONSTRAINT "__expression_exclude_category_fk_node_y63mccgxjm" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_include_category" ADD CONSTRAINT "__expression_include_category_fk_node_bbmn3oh7lp" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_max" ADD CONSTRAINT "__expression_max_fk_id_kind_kkbcmmc3uq" FOREIGN KEY ("id", "kind") REFERENCES "qti"."expression" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_max" ADD CONSTRAINT "__expression_max_fk_kind_max_uy2tdzwnk2" FOREIGN KEY ("kind", "max") REFERENCES "qti"."operator_arity_max" ("kind", "max");

ALTER TABLE "qti"."expression_section_identifier" ADD CONSTRAINT "__expression_section_identifier_fk_node_2vkg2rmdrz" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."expression_weight_identifier" ADD CONSTRAINT "__expression_weight_identifier_fk_node_eo6avloo6c" FOREIGN KEY ("node") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_expected_length" ADD CONSTRAINT "__extended_text_expected_length_fk_node_r5oob4axwj" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_expected_lines" ADD CONSTRAINT "__extended_text_expected_lines_fk_node_4lez2gf4uu" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_interaction" ADD CONSTRAINT "__extended_text_interaction_fk_id_tag_kind_qti_ltalrkocek" FOREIGN KEY ("id", "__tag_kind_qti_extended_text_interaction_a2k2mcqdlw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_interaction" ADD CONSTRAINT "__extended_text_interaction_fk_id_root_kind_w77r26cfuv" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_max_strings" ADD CONSTRAINT "__extended_text_max_strings_fk_node_no2k5lg6kg" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_pattern_mask" ADD CONSTRAINT "__extended_text_pattern_mask_fk_node_ve2qvzr74x" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_patternmask_message" ADD CONSTRAINT "__extended_text_patternmask_message_fk_node_t2zz65vufb" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_placeholder_text" ADD CONSTRAINT "__extended_text_placeholder_text_fk_node_krubrvzqvb" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_document_tag_root_external_lom_dv_4373pl62ni" FOREIGN KEY ("document", "__tag_root_external_lom_dv2arbt3fq") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_document_package_resource_34e33j4gxl" FOREIGN KEY ("document", "package", "resource") REFERENCES "qti"."document" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_tag_owner_external_yt_3_po4evf3fs2" FOREIGN KEY ("lom", "__tag_owner_external_yt3hiwiixf") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_document_lxir53wny7" FOREIGN KEY ("lom", "document") REFERENCES "qti"."tree_root" ("node", "tree");

ALTER TABLE "qti"."external_lom" ADD CONSTRAINT "__external_lom_fk_lom_package_5kjzf5zk6j" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."fallback" ADD CONSTRAINT "__fallback_fk_id_tag_kind_xi_fallback_mi_6_ozofd_6_d_jqjumf2cb3" FOREIGN KEY ("id", "__tag_kind_xi_fallback_mi6ozofd6d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_block" ADD CONSTRAINT "__feedback_block_fk_id_tag_kind_qti_feedback_block_girqpzlz7i" FOREIGN KEY ("id", "__tag_kind_qti_feedback_block_fzyzb3m667") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_inline" ADD CONSTRAINT "__feedback_inline_fk_id_tag_kind_qti_feedback_inline_bln57d3fur" FOREIGN KEY ("id", "__tag_kind_qti_feedback_inline_fxa2ds5jsw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_outcome_ref" ADD CONSTRAINT "__feedback_outcome_ref_fk_document_identifier_tag_3omws2uoqu" FOREIGN KEY ("document", "identifier", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_outcome_ref" ADD CONSTRAINT "__feedback_outcome_ref_fk_document_identifier_base_ydtazhy5ch" FOREIGN KEY ("document", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_outcome_ref" ADD CONSTRAINT "__feedback_outcome_ref_fk_node_document_tuixbof55g" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."field_value" ADD CONSTRAINT "__field_value_fk_id_xy6vy4ozmk" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."field_value" ADD CONSTRAINT "__field_value_fk_id_tag_kind_qti_field_value_2_z_2_noxgq3e3l4" FOREIGN KEY ("id", "__tag_kind_qti_field_value_2z2wrjjwbo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."figcaption" ADD CONSTRAINT "__figcaption_fk_id_tag_kind_figcaption_kg_34_hwzy_6_7herqlloj5" FOREIGN KEY ("id", "__tag_kind_figcaption_kg34hwzy6b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."figure" ADD CONSTRAINT "__figure_fk_id_tag_kind_figure_m_2_nqyu_772_u_e3am75oub7" FOREIGN KEY ("id", "__tag_kind_figure_m2nqyu772u") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_id_tag_kind_cp_file_lmc_4_p_5_hp_74_k5m33baabe" FOREIGN KEY ("id", "__tag_kind_cp_file_lmc4p5hp74") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_id_resource_position_er7we6b2by" FOREIGN KEY ("id", "resource", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_package_href_ycd4s7qtk3" FOREIGN KEY ("package", "href") REFERENCES "qti"."package_entry" ("package", "path") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file" ADD CONSTRAINT "__file_fk_resource_package_nkqadixour" FOREIGN KEY ("resource", "package") REFERENCES "qti"."resource" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_content" ADD CONSTRAINT "__file_content_fk_package_path_nfk4i2vf5j" FOREIGN KEY ("package", "path") REFERENCES "qti"."package_entry" ("package", "path") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_file_package_n7bbywq43y" FOREIGN KEY ("file", "package") REFERENCES "qti"."file" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_tag_owner_file_gyehcaynyu_wwsmm2yqrr" FOREIGN KEY ("lom", "__tag_owner_file_gyehcaynyu") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_metadata_4fdumrj4ds" FOREIGN KEY ("lom", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_package_3awnniv4xf" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_package_jdvawz4chd" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_metadata_file_6pywi74w2y" FOREIGN KEY ("metadata", "file") REFERENCES "qti"."file_metadata" ("id", "file");

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_file_5wy6mgwjgi" FOREIGN KEY ("file") REFERENCES "qti"."file" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_id_tag_kind_cp_metadata_file_ec_5_jjpl4lfsb7" FOREIGN KEY ("id", "__tag_kind_cp_metadata_file_ec5cdzv4wr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."file_metadata" ADD CONSTRAINT "__file_metadata_fk_id_file_6z66x37ioo" FOREIGN KEY ("id", "file") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."footer" ADD CONSTRAINT "__footer_fk_id_tag_kind_footer_vxrcx_7653_b_l4cdrjkqls" FOREIGN KEY ("id", "__tag_kind_footer_vxrcx7653b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap" ADD CONSTRAINT "__gap_fk_id_tag_kind_qti_gap_t_5_z_2_t_37_bta_gg7fvlkha7" FOREIGN KEY ("id", "__tag_kind_qti_gap_t5z2t37bta") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap" ADD CONSTRAINT "__gap_fk_interaction_iwcvszqyud" FOREIGN KEY ("interaction") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img" ADD CONSTRAINT "__gap_img_fk_id_tag_kind_qti_gap_img_cika_2_xmkoz_hpm74hvjft" FOREIGN KEY ("id", "__tag_kind_qti_gap_img_cika2xmkoz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img" ADD CONSTRAINT "__gap_img_fk_id_interaction_izb3b7orbl" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_left" ADD CONSTRAINT "__gap_img_left_fk_node_afflzljwrr" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_match_min" ADD CONSTRAINT "__gap_img_match_min_fk_node_46viwbbfia" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_object_label" ADD CONSTRAINT "__gap_img_object_label_fk_node_giimnaj2mt" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_top" ADD CONSTRAINT "__gap_img_top_fk_node_oh2lzktdlq" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_binding" ADD CONSTRAINT "__gap_match_binding_fk_node_cardinality_cnq3pufch4" FOREIGN KEY ("node", "cardinality") REFERENCES "qti"."typed_binding" ("node", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_choices_container_width" ADD CONSTRAINT "__gap_match_choices_container_width_fk_node_fbglf2uyxs" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_interaction" ADD CONSTRAINT "__gap_match_interaction_fk_id_tag_kind_qti_gap_match_ttdrlfv4id" FOREIGN KEY ("id", "__tag_kind_qti_gap_match_interaction_sa3eog3yil") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_interaction" ADD CONSTRAINT "__gap_match_interaction_fk_id_root_kind_nwcelriipx" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_max_selections_message" ADD CONSTRAINT "__gap_match_max_selections_message_fk_node_55mhw3a5a7" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_min_associations" ADD CONSTRAINT "__gap_match_min_associations_fk_node_sqxe7hdupj" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_min_selections_message" ADD CONSTRAINT "__gap_match_min_selections_message_fk_node_xyclglemdq" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_text" ADD CONSTRAINT "__gap_text_fk_id_tag_kind_qti_gap_text_me_5_pobfhjy_3xxo4rssmj" FOREIGN KEY ("id", "__tag_kind_qti_gap_text_me5pobfhjy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_text" ADD CONSTRAINT "__gap_text_fk_id_interaction_vyabtqqbvf" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_text_match_min" ADD CONSTRAINT "__gap_text_match_min_fk_node_bdky5cpf7z" FOREIGN KEY ("node") REFERENCES "qti"."gap_text" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gcd" ADD CONSTRAINT "__gcd_fk_id_njtn2gkwq5" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gcd" ADD CONSTRAINT "__gcd_fk_id_tag_kind_qti_gcd_fif_4_dvbbgi_ozbhrvoz52" FOREIGN KEY ("id", "__tag_kind_qti_gcd_fif4dvbbgi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_associate_interaction" ADD CONSTRAINT "__graphic_associate_interaction_fk_id_tag_kind_qti_4j76cxczrn" FOREIGN KEY ("id", "__tag_kind_qti_graphic_associate_interaction_cf7kbgfftm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_associate_interaction" ADD CONSTRAINT "__graphic_associate_interaction_fk_id_root_kind_yfucrzcver" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_associate_min_associations" ADD CONSTRAINT "__graphic_associate_min_associations_fk_node_zq2k4hyv2w" FOREIGN KEY ("node") REFERENCES "qti"."graphic_associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_choices_container_width" ADD CONSTRAINT "__graphic_gap_match_choices_container_width_fk_node_erijou6iqn" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_interaction" ADD CONSTRAINT "__graphic_gap_match_interaction_fk_id_tag_kind_qti_dakbtfduno" FOREIGN KEY ("id", "__tag_kind_qti_graphic_gap_match_interaction_7hgn4d2ulo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_interaction" ADD CONSTRAINT "__graphic_gap_match_interaction_fk_id_root_kind_lukxvyxnqy" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_max_selections_message" ADD CONSTRAINT "__graphic_gap_match_max_selections_message_fk_node_whb6jfecez" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_min_associations" ADD CONSTRAINT "__graphic_gap_match_min_associations_fk_node_jzncotbevu" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_min_selections_message" ADD CONSTRAINT "__graphic_gap_match_min_selections_message_fk_node_tzv5zkekbw" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_interaction" ADD CONSTRAINT "__graphic_order_interaction_fk_id_tag_kind_qti_e7cmnucivs" FOREIGN KEY ("id", "__tag_kind_qti_graphic_order_interaction_f6g47z3ihc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_interaction" ADD CONSTRAINT "__graphic_order_interaction_fk_id_root_kind_rcrxsq34ip" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_max_choices_n" ADD CONSTRAINT "__graphic_order_max_choices_n_fk_node_value_o4n2djgsvx" FOREIGN KEY ("node", "value") REFERENCES "qti"."graphic_order_interaction" ("id", "max_choices_n") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_min_choices_n" ADD CONSTRAINT "__graphic_order_min_choices_n_fk_node_value_42larqhgl3" FOREIGN KEY ("node", "value") REFERENCES "qti"."graphic_order_interaction" ("id", "min_choices_n") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gt" ADD CONSTRAINT "__gt_fk_id_zgvlugkn52" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gt" ADD CONSTRAINT "__gt_fk_id_tag_kind_qti_gt_jyjg_6_yqgqv_y4pkalesqo" FOREIGN KEY ("id", "__tag_kind_qti_gt_jyjg6yqgqv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gte" ADD CONSTRAINT "__gte_fk_id_suxk6gqnxf" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gte" ADD CONSTRAINT "__gte_fk_id_tag_kind_qti_gte_gurw_6_edziz_lvdrbzrkmk" FOREIGN KEY ("id", "__tag_kind_qti_gte_gurw6edziz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."h_1" ADD CONSTRAINT "__h_1_fk_id_tag_kind_h_1_6_iifpaqhv_7_jlzrlasw7r" FOREIGN KEY ("id", "__tag_kind_h_1_6iifpaqhv7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."h_2" ADD CONSTRAINT "__h_2_fk_id_tag_kind_h_2_huvmppuekh_s5h54zuvlz" FOREIGN KEY ("id", "__tag_kind_h_2_huvmppuekh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."h_3" ADD CONSTRAINT "__h_3_fk_id_tag_kind_h_3_wxdunj_7_d_7_m_wjovcnjbiw" FOREIGN KEY ("id", "__tag_kind_h_3_wxdunj7d7m") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."h_4" ADD CONSTRAINT "__h_4_fk_id_tag_kind_h_4_t_2_jt_4_irrfn_hmw7utuvqj" FOREIGN KEY ("id", "__tag_kind_h_4_t2jt4irrfn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."h_5" ADD CONSTRAINT "__h_5_fk_id_tag_kind_h_5_yoaxpgpdkr_hu4cg4eu2v" FOREIGN KEY ("id", "__tag_kind_h_5_yoaxpgpdkr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."h_6" ADD CONSTRAINT "__h_6_fk_id_tag_kind_h_6_y_5_ycm_7_ztvp_qwh2qht7ud" FOREIGN KEY ("id", "__tag_kind_h_6_y5ycm7ztvp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."header" ADD CONSTRAINT "__header_fk_id_tag_kind_header_5_lbsjaftbl_4lkih5mmwm" FOREIGN KEY ("id", "__tag_kind_header_5lbsjaftbl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."headers_target" ADD CONSTRAINT "__headers_target_fk_document_target_tag_kind_th_c7wmmvrvqc" FOREIGN KEY ("document", "target", "__tag_kind_th_wpezcjlql2") REFERENCES "qti"."html_id" ("document", "id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."headers_target" ADD CONSTRAINT "__headers_target_fk_node_attribute_position_target_iaogiplbti" FOREIGN KEY ("node", "attribute", "position", "target") REFERENCES "qti"."attribute_idref" ("node", "attribute", "position", "target") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_choice" ADD CONSTRAINT "__hotspot_choice_fk_id_tag_kind_qti_hotspot_choice_4_j4vism2x2z" FOREIGN KEY ("id", "__tag_kind_qti_hotspot_choice_4h532vhjmn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_choice" ADD CONSTRAINT "__hotspot_choice_fk_id_interaction_zb2pyu6z7n" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_choice_label" ADD CONSTRAINT "__hotspot_choice_label_fk_node_kaltextuq6" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_interaction" ADD CONSTRAINT "__hotspot_interaction_fk_id_tag_kind_qti_hotspot_rsyt5lviwa" FOREIGN KEY ("id", "__tag_kind_qti_hotspot_interaction_36p72w7q2z") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_interaction" ADD CONSTRAINT "__hotspot_interaction_fk_id_root_kind_nget63r44p" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_max_selections_message" ADD CONSTRAINT "__hotspot_max_selections_message_fk_node_xrr6jjqf66" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_min_selections_message" ADD CONSTRAINT "__hotspot_min_selections_message_fk_node_yie6mhe626" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext" ADD CONSTRAINT "__hottext_fk_id_tag_kind_qti_hottext_wysowujcts_lsgzag2ybj" FOREIGN KEY ("id", "__tag_kind_qti_hottext_wysowujcts") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_interaction" ADD CONSTRAINT "__hottext_interaction_fk_id_tag_kind_qti_hottext_kyu6u2mjzs" FOREIGN KEY ("id", "__tag_kind_qti_hottext_interaction_4z6zllelqi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_interaction" ADD CONSTRAINT "__hottext_interaction_fk_id_root_kind_g2puzqhwl3" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_max_selections_message" ADD CONSTRAINT "__hottext_max_selections_message_fk_node_heu2xs4qjo" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_min_selections_message" ADD CONSTRAINT "__hottext_min_selections_message_fk_node_7k42a4jxap" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_owner" ADD CONSTRAINT "__hottext_owner_fk_interaction_nzpm3rpwre" FOREIGN KEY ("interaction") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_owner" ADD CONSTRAINT "__hottext_owner_fk_node_identifier_czroxsucmu" FOREIGN KEY ("node", "identifier") REFERENCES "qti"."hottext" ("id", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hr" ADD CONSTRAINT "__hr_fk_id_tag_kind_hr_ugkqxcyyf_4_zxwnqgibzk" FOREIGN KEY ("id", "__tag_kind_hr_ugkqxcyyf4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_document_id_tag_holder_html_id_rvco_6_j_4xxrdxqzag" FOREIGN KEY ("document", "id", "__tag_holder_html_id_rvco6j7tck") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_kind_attribute_7yhgrjvv32" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_node_document_kind_4jmntfh5as" FOREIGN KEY ("node", "document", "kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."i" ADD CONSTRAINT "__i_fk_id_tag_kind_i_5_mff_2_xdi_4_o_qujfu6sdgm" FOREIGN KEY ("id", "__tag_kind_i_5mff2xdi4o") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img" ADD CONSTRAINT "__img_fk_id_tag_kind_img_i_7_yel_3_m_6_ld_jmhphj53q5" FOREIGN KEY ("id", "__tag_kind_img_i7yel3m6ld") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img_height" ADD CONSTRAINT "__img_height_fk_node_ms33zlenv7" FOREIGN KEY ("node") REFERENCES "qti"."img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img_longdesc" ADD CONSTRAINT "__img_longdesc_fk_node_y4lwafy67d" FOREIGN KEY ("node") REFERENCES "qti"."img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."img_width" ADD CONSTRAINT "__img_width_fk_node_h2rn2uti4n" FOREIGN KEY ("node") REFERENCES "qti"."img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."index" ADD CONSTRAINT "__index_fk_id_mhiugan6ac" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."index" ADD CONSTRAINT "__index_fk_id_tag_kind_qti_index_ekqtqbvpem_g3lwhqdjn7" FOREIGN KEY ("id", "__tag_kind_qti_index_ekqtqbvpem") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."index_n_ref" ADD CONSTRAINT "__index_n_ref_fk_node_tag_n_kind_ref_ffmcx_5_ok_6_w_x3vf2vhlpt" FOREIGN KEY ("node", "__tag_n_kind_ref_ffmcx5ok6w") REFERENCES "qti"."index" ("id", "n_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice" ADD CONSTRAINT "__inline_choice_fk_id_tag_kind_qti_inline_choice_wo2cgmdjt7" FOREIGN KEY ("id", "__tag_kind_qti_inline_choice_vqtv2okj5a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice" ADD CONSTRAINT "__inline_choice_fk_id_interaction_ayou2yhcr7" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_interaction" ADD CONSTRAINT "__inline_choice_interaction_fk_id_tag_kind_qti_3xws32tdey" FOREIGN KEY ("id", "__tag_kind_qti_inline_choice_interaction_zutl6a477r") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_interaction" ADD CONSTRAINT "__inline_choice_interaction_fk_id_root_kind_l7sl52xtvb" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_min_selections_message" ADD CONSTRAINT "__inline_choice_min_selections_message_fk_node_qepgpzxek4" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_prompt" ADD CONSTRAINT "__inline_choice_prompt_fk_node_cuxcewnfjk" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inside" ADD CONSTRAINT "__inside_fk_id_r76h3gwgel" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inside" ADD CONSTRAINT "__inside_fk_id_tag_kind_qti_inside_uqwtkeu_4_d_6_ec2775uahe" FOREIGN KEY ("id", "__tag_kind_qti_inside_uqwtkeu4d6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_divide" ADD CONSTRAINT "__integer_divide_fk_id_aapblfmkop" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_divide" ADD CONSTRAINT "__integer_divide_fk_id_tag_kind_qti_integer_divide_p_45aioisyeh" FOREIGN KEY ("id", "__tag_kind_qti_integer_divide_p6arj4ose5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_modulus" ADD CONSTRAINT "__integer_modulus_fk_id_zai577tyu4" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_modulus" ADD CONSTRAINT "__integer_modulus_fk_id_tag_kind_qti_integer_modulus_2gttwvkmmk" FOREIGN KEY ("id", "__tag_kind_qti_integer_modulus_3qu7obkveq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_to_float" ADD CONSTRAINT "__integer_to_float_fk_id_rihzowuazj" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."integer_to_float" ADD CONSTRAINT "__integer_to_float_fk_id_tag_kind_qti_integer_to_r4o33zvjtl" FOREIGN KEY ("id", "__tag_kind_qti_integer_to_float_hdfmecar27") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_document_adaptive_7gj3j45p4n" FOREIGN KEY ("document", "adaptive") REFERENCES "qti"."assessment_item" ("tree", "adaptive") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_document_response_d5b6agd3yq" FOREIGN KEY ("document", "response_identifier", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_document_response_5zpazi3say" FOREIGN KEY ("document", "response_identifier", "shape") REFERENCES "qti"."declaration" ("document", "identifier", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_node_ancestry_gxhxoppump" FOREIGN KEY ("node", "ancestry") REFERENCES "qti"."node" ("id", "ancestry") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "__interaction_binding_fk_node_document_interaction_3rgydma4v2" FOREIGN KEY ("node", "document", "interaction_kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_tag_cardinality_23mmjy5chx" FOREIGN KEY ("declaration", "__tag_cardinality_single_b63ah65un6") REFERENCES "qti"."typed_declaration" ("id", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_tag_kind_ocwbhs6jjq" FOREIGN KEY ("declaration", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_base_type_yl3o3v6xal" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_id_tag_kind_qti_mp3gbdwflu" FOREIGN KEY ("id", "__tag_kind_qti_interpolation_table_qttyjwjmqu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value" ADD CONSTRAINT "__interpolation_table_default_value_fk_node_base_mueoswyhpl" FOREIGN KEY ("node", "base_type") REFERENCES "qti"."interpolation_table" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_boolean" ADD CONSTRAINT "__interpolation_table_default_value_boolean_fk_node_2x2neks7xn" FOREIGN KEY ("node", "__tag_base_type_boolean_kmoyqefo5c") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_directed_pair" ADD CONSTRAINT "__interpolation_table_default_value_directed_pair_fk_rhj7fvx2dx" FOREIGN KEY ("node", "__tag_base_type_directed_pair_srbue2pn2g") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_duration" ADD CONSTRAINT "__interpolation_table_default_value_duration_fk_node_wcztr5vqea" FOREIGN KEY ("node", "__tag_base_type_duration_wwywzpo3hs") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_file" ADD CONSTRAINT "__interpolation_table_default_value_file_fk_node_tag_wjvfz3a6b7" FOREIGN KEY ("node", "__tag_base_type_file_nz4mrice3f") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_float" ADD CONSTRAINT "__interpolation_table_default_value_float_fk_node_k2lf23i46z" FOREIGN KEY ("node", "__tag_base_type_float_rpwgeoyaqd") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_identifier" ADD CONSTRAINT "__interpolation_table_default_value_identifier_fk_rpd5nbvrro" FOREIGN KEY ("node", "__tag_base_type_identifier_xwwtsnpwy5") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_integer" ADD CONSTRAINT "__interpolation_table_default_value_integer_fk_node_3yb7m3imm4" FOREIGN KEY ("node", "__tag_base_type_integer_2zz3sqvn6m") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_pair" ADD CONSTRAINT "__interpolation_table_default_value_pair_fk_node_tag_ydi6dzpnhs" FOREIGN KEY ("node", "__tag_base_type_pair_ow7hlz4qcb") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_point" ADD CONSTRAINT "__interpolation_table_default_value_point_fk_node_kv6565guur" FOREIGN KEY ("node", "__tag_base_type_point_pxuqylzqar") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_string" ADD CONSTRAINT "__interpolation_table_default_value_string_fk_node_2kkphfc7b2" FOREIGN KEY ("node", "__tag_base_type_string_3gby3zbufp") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_default_value_uri" ADD CONSTRAINT "__interpolation_table_default_value_uri_fk_node_tag_44y5vjq27m" FOREIGN KEY ("node", "__tag_base_type_uri_qohnv2fqlp") REFERENCES "qti"."interpolation_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry" ADD CONSTRAINT "__interpolation_table_entry_fk_id_tag_kind_qti_wqskvlxfus" FOREIGN KEY ("id", "__tag_kind_qti_interpolation_table_entry_pkghxhscxu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry" ADD CONSTRAINT "__interpolation_table_entry_fk_id_table_position_7yqc7o25os" FOREIGN KEY ("id", "table", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry" ADD CONSTRAINT "__interpolation_table_entry_fk_table_declaration_nfvys5lx6k" FOREIGN KEY ("table", "declaration", "base_type") REFERENCES "qti"."interpolation_table" ("id", "declaration", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_boolean" ADD CONSTRAINT "__interpolation_table_entry_boolean_fk_id_tag_base_fytflipnc4" FOREIGN KEY ("id", "__tag_base_type_boolean_p3337uv44n") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_directed_pair" ADD CONSTRAINT "__interpolation_table_entry_directed_pair_fk_id_tag_uytcfuxzcm" FOREIGN KEY ("id", "__tag_base_type_directed_pair_rtqucqk6ky") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_duration" ADD CONSTRAINT "__interpolation_table_entry_duration_fk_id_tag_base_r4ybmoaf3t" FOREIGN KEY ("id", "__tag_base_type_duration_mdopxaqe3i") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_file" ADD CONSTRAINT "__interpolation_table_entry_file_fk_id_tag_base_type_rwbzuwyxa3" FOREIGN KEY ("id", "__tag_base_type_file_dla4l5kfr4") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_float" ADD CONSTRAINT "__interpolation_table_entry_float_fk_id_tag_base_hcctdsz7hk" FOREIGN KEY ("id", "__tag_base_type_float_trm5iccdba") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_identifier" ADD CONSTRAINT "__interpolation_table_entry_identifier_fk_id_tag_qjpgbea3ni" FOREIGN KEY ("id", "__tag_base_type_identifier_exiriy4dvp") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_integer" ADD CONSTRAINT "__interpolation_table_entry_integer_fk_id_tag_base_bviyipbtqd" FOREIGN KEY ("id", "__tag_base_type_integer_b4eipddhol") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_pair" ADD CONSTRAINT "__interpolation_table_entry_pair_fk_id_tag_base_type_fcnb5w7vlk" FOREIGN KEY ("id", "__tag_base_type_pair_7hx4thzdtk") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_point" ADD CONSTRAINT "__interpolation_table_entry_point_fk_id_tag_base_qjxxzc5pis" FOREIGN KEY ("id", "__tag_base_type_point_a6dymphvan") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_string" ADD CONSTRAINT "__interpolation_table_entry_string_fk_id_tag_base_v3dwff7gxr" FOREIGN KEY ("id", "__tag_base_type_string_ubbjkb3enq") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table_entry_uri" ADD CONSTRAINT "__interpolation_table_entry_uri_fk_id_tag_base_type_yihxchpl5b" FOREIGN KEY ("id", "__tag_base_type_uri_engx47ongp") REFERENCES "qti"."interpolation_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."is_null" ADD CONSTRAINT "__is_null_fk_id_47fcopwphs" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."is_null" ADD CONSTRAINT "__is_null_fk_id_tag_kind_qti_is_null_ibjh_6_ibqii_l5z6eltsen" FOREIGN KEY ("id", "__tag_kind_qti_is_null_ibjh6ibqii") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body" ADD CONSTRAINT "__item_body_fk_id_tag_kind_qti_item_body_jcju_2_47smepwucf" FOREIGN KEY ("id", "__tag_kind_qti_item_body_jcju2zecro") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body" ADD CONSTRAINT "__item_body_fk_id_item_eyzw7eb2oe" FOREIGN KEY ("id", "item") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body_id" ADD CONSTRAINT "__item_body_id_fk_document_id_tag_holder_item_body_qbqnxl7tow" FOREIGN KEY ("document", "id", "__tag_holder_item_body_aqj24xldnt") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body_id" ADD CONSTRAINT "__item_body_id_fk_node_document_yub5r24zvj" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool" ADD CONSTRAINT "__item_tool_fk_tree_awvhaigtwv" FOREIGN KEY ("tree") REFERENCES "qti"."assessment_item" ("tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_both" ADD CONSTRAINT "__item_tool_both_fk_tree_tag_shape_both_w_7_wtd_5_hro47hekai" FOREIGN KEY ("tree", "__tag_shape_both_w7wtd5psrj") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_name" ADD CONSTRAINT "__item_tool_name_fk_tree_tag_shape_name_only_ovf_2_t3wpm3j4r2" FOREIGN KEY ("tree", "__tag_shape_name_only_ovf2oodbcw") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_version" ADD CONSTRAINT "__item_tool_version_fk_tree_tag_shape_version_only_2qxy4xgqmi" FOREIGN KEY ("tree", "__tag_shape_version_only_xss26qzv7y") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."kbd" ADD CONSTRAINT "__kbd_fk_id_tag_kind_kbd_dwx_2_olhbhz_pta27q3tn6" FOREIGN KEY ("id", "__tag_kind_kbd_dwx2olhbhz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."label" ADD CONSTRAINT "__label_fk_id_tag_kind_label_pyyrnslja_3_gtwux26sm7" FOREIGN KEY ("id", "__tag_kind_label_pyyrnslja3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lcm" ADD CONSTRAINT "__lcm_fk_id_7ozlvyivcj" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lcm" ADD CONSTRAINT "__lcm_fk_id_tag_kind_qti_lcm_e_3_pbv_2_j_3_vf_tgxcqh6nr5" FOREIGN KEY ("id", "__tag_kind_qti_lcm_e3pbv2j3vf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."li" ADD CONSTRAINT "__li_fk_id_tag_kind_li_jjtjuvu_2_xr_fbrueca7pn" FOREIGN KEY ("id", "__tag_kind_li_jjtjuvu2xr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal" ADD CONSTRAINT "__literal_fk_id_bejzcmox5h" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal" ADD CONSTRAINT "__literal_fk_id_tag_kind_qti_base_value_s_2_tktoudmi_ezrzio63ck" FOREIGN KEY ("id", "__tag_kind_qti_base_value_s2tktoudmi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_boolean" ADD CONSTRAINT "__literal_boolean_fk_id_tag_base_type_boolean_4735_4myj62jp3d" FOREIGN KEY ("id", "__tag_base_type_boolean_4735tuf3vg") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_directed_pair" ADD CONSTRAINT "__literal_directed_pair_fk_id_tag_base_type_directed_gwg4wthbw7" FOREIGN KEY ("id", "__tag_base_type_directed_pair_g5lmbdounu") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_duration" ADD CONSTRAINT "__literal_duration_fk_id_tag_base_type_duration_x_4_lbgynv7vln" FOREIGN KEY ("id", "__tag_base_type_duration_x4kusayrrj") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_file" ADD CONSTRAINT "__literal_file_fk_id_tag_base_type_file_f_3_nyrmvnuq_gntznale5u" FOREIGN KEY ("id", "__tag_base_type_file_f3nyrmvnuq") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_float" ADD CONSTRAINT "__literal_float_fk_id_tag_base_type_float_3_yebf_7_kv56wpv5vt" FOREIGN KEY ("id", "__tag_base_type_float_3yebf7fbld") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_identifier" ADD CONSTRAINT "__literal_identifier_fk_id_tag_base_type_identifier_r66k3na6ph" FOREIGN KEY ("id", "__tag_base_type_identifier_su3axkpwpi") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_integer" ADD CONSTRAINT "__literal_integer_fk_id_tag_base_type_integer_42_hpi_fhexpvem2f" FOREIGN KEY ("id", "__tag_base_type_integer_42hpi675dm") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_pair" ADD CONSTRAINT "__literal_pair_fk_id_tag_base_type_pair_j_5_c_4_5n2tcec7hs" FOREIGN KEY ("id", "__tag_base_type_pair_j5c4komwfk") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_point" ADD CONSTRAINT "__literal_point_fk_id_tag_base_type_point_vrpib_4_j_mtxacunnh2" FOREIGN KEY ("id", "__tag_base_type_point_vrpib4j3ph") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_string" ADD CONSTRAINT "__literal_string_fk_id_tag_base_type_string_3_acd_7_bsbjfi6uy7" FOREIGN KEY ("id", "__tag_base_type_string_3acd7sfocx") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."literal_uri" ADD CONSTRAINT "__literal_uri_fk_id_tag_base_type_uri_dedabn_4_vho_opebmm36hg" FOREIGN KEY ("id", "__tag_base_type_uri_dedabn4vho") REFERENCES "qti"."literal" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom" ADD CONSTRAINT "__lom_fk_id_tag_kind_lom_lom_f_6_hipyl_2_uh_bz6un6sdnw" FOREIGN KEY ("id", "__tag_kind_lom_lom_f6hipyl2uh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_aggregation_level" ADD CONSTRAINT "__lom_aggregation_level_fk_id_tag_kind_lom_whlaput7np" FOREIGN KEY ("id", "__tag_kind_lom_aggregation_level_nz6q333tpc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_aggregation_level" ADD CONSTRAINT "__lom_aggregation_level_fk_lom_bv6km72pzq" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_id_tag_kind_lom_annotation_wmk_4_lavkjljdee" FOREIGN KEY ("id", "__tag_kind_lom_annotation_wmk4msekhm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_id_lom_fvl6yckn7w" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_lom_zekvm5wtoq" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_id_tag_kind_lom_2chxdeo54b" FOREIGN KEY ("id", "__tag_kind_lom_classification_s33zb3ydxx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_id_lom_lbzjzocrka" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_lom_oe4atcfgdx" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_context" ADD CONSTRAINT "__lom_context_fk_id_tag_kind_lom_context_unp_6_fhu_2_uutdmnxs3j" FOREIGN KEY ("id", "__tag_kind_lom_context_unp6fhu2i5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_context" ADD CONSTRAINT "__lom_context_fk_lom_y2fvbzxfmp" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_id_tag_kind_lom_contribute_df_2_7rpcq7mxt2" FOREIGN KEY ("id", "__tag_kind_lom_contribute_df2trhtcwa") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_id_parent_azdg5nrcbj" FOREIGN KEY ("id", "parent") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_id_position_anrlpze2a6" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_contribute" ADD CONSTRAINT "__lom_contribute_fk_lom_xet4pxcqbo" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD CONSTRAINT "__lom_copyright_and_other_restrictions_fk_id_tag_674dg4oy6o" FOREIGN KEY ("id", "__tag_kind_lom_copyright_and_other_restrictions_iumfuc7nd6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD CONSTRAINT "__lom_copyright_and_other_restrictions_fk_id_rights_t2r4pp36py" FOREIGN KEY ("id", "rights") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_copyright_and_other_restrictions" ADD CONSTRAINT "__lom_copyright_and_other_restrictions_fk_lom_2eyn5uf3yv" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_cost" ADD CONSTRAINT "__lom_cost_fk_id_tag_kind_lom_cost_6_szqfkzkkf_23zskd6km7" FOREIGN KEY ("id", "__tag_kind_lom_cost_6szqfkzkkf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_cost" ADD CONSTRAINT "__lom_cost_fk_id_rights_qspq7ohb4b" FOREIGN KEY ("id", "rights") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_cost" ADD CONSTRAINT "__lom_cost_fk_lom_wflrpcbp5c" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_coverage" ADD CONSTRAINT "__lom_coverage_fk_id_tag_kind_lom_coverage_4_eywvbqgq6w" FOREIGN KEY ("id", "__tag_kind_lom_coverage_4gxjudfzzd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_coverage" ADD CONSTRAINT "__lom_coverage_fk_lom_sdgsgwwmry" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date" ADD CONSTRAINT "__lom_date_fk_id_tag_kind_lom_date_w_2_vdyftvu_3_dohk4pi2cr" FOREIGN KEY ("id", "__tag_kind_lom_date_w2vdyftvu3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date" ADD CONSTRAINT "__lom_date_fk_id_contribute_rdgokm4ivk" FOREIGN KEY ("id", "contribute") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date" ADD CONSTRAINT "__lom_date_fk_lom_pg6czotexk" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date_time" ADD CONSTRAINT "__lom_date_time_fk_id_tag_kind_lom_date_time_rwc_33_6hsukamghe" FOREIGN KEY ("id", "__tag_kind_lom_date_time_rwc33opc6i") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date_time" ADD CONSTRAINT "__lom_date_time_fk_id_date_twmqij6thy" FOREIGN KEY ("id", "date") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_date_time" ADD CONSTRAINT "__lom_date_time_fk_lom_57lwwhv3j3" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_description" ADD CONSTRAINT "__lom_description_fk_id_tag_kind_lom_description_rf5lxo4ary" FOREIGN KEY ("id", "__tag_kind_lom_description_fgwqgc6sgl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_description" ADD CONSTRAINT "__lom_description_fk_lom_fskniocyns" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_difficulty" ADD CONSTRAINT "__lom_difficulty_fk_id_tag_kind_lom_difficulty_u_6_f6wuieia5v" FOREIGN KEY ("id", "__tag_kind_lom_difficulty_u6oh2pluob") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_difficulty" ADD CONSTRAINT "__lom_difficulty_fk_lom_qtl7zjkhp4" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration" ADD CONSTRAINT "__lom_duration_fk_id_tag_kind_lom_duration_iav_5_iznkpng5qz" FOREIGN KEY ("id", "__tag_kind_lom_duration_iav5iizeai") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration" ADD CONSTRAINT "__lom_duration_fk_id_technical_na4zhuhr2o" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration" ADD CONSTRAINT "__lom_duration_fk_lom_7mahss6ctn" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration_string" ADD CONSTRAINT "__lom_duration_string_fk_id_tag_kind_lom_duration_xdrnlvqqvg" FOREIGN KEY ("id", "__tag_kind_lom_duration_string_ijve2g6fui") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration_string" ADD CONSTRAINT "__lom_duration_string_fk_id_duration_e4sg3lhowz" FOREIGN KEY ("id", "duration") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_duration_string" ADD CONSTRAINT "__lom_duration_string_fk_lom_dhbyhlqylo" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_id_tag_kind_lom_educational_u2hj6zfswu" FOREIGN KEY ("id", "__tag_kind_lom_educational_bfejue5lpc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_id_lom_lkprbuhw2p" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_lom_cwyavg2yop" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_id_tag_kind_lom_entity_ja_2_pg_4_zr_ptcquakojw" FOREIGN KEY ("id", "__tag_kind_lom_entity_ja2pg4zr5e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_id_contribute_r6ecje37rr" FOREIGN KEY ("id", "contribute") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_id_position_tkckn2awlf" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entity" ADD CONSTRAINT "__lom_entity_fk_lom_iku6rztwyh" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entry_lang_string" ADD CONSTRAINT "__lom_entry_lang_string_fk_id_tag_kind_lom_entry_gmkubnhnma" FOREIGN KEY ("id", "__tag_kind_lom_entry_lang_string_yr7dyefaw7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entry_lang_string" ADD CONSTRAINT "__lom_entry_lang_string_fk_lom_t3jwxa4puv" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_id_tag_kind_lom_format_zjeruunvce_c3w7xdh64r" FOREIGN KEY ("id", "__tag_kind_lom_format_zjeruunvce") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_id_position_xeaahl3cte" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_id_technical_itq4yc3ebb" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_format" ADD CONSTRAINT "__lom_format_fk_lom_kvxpepk4uj" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general" ADD CONSTRAINT "__lom_general_fk_id_tag_kind_lom_general_kdtvdmn_7_vdkmh6scgo" FOREIGN KEY ("id", "__tag_kind_lom_general_kdtvdmn7oa") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general" ADD CONSTRAINT "__lom_general_fk_lom_si32sc6scb" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general_title" ADD CONSTRAINT "__lom_general_title_fk_id_tag_kind_lom_title_jr4y2w4pqy" FOREIGN KEY ("id", "__tag_kind_lom_title_acxzzapsiz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_general_title" ADD CONSTRAINT "__lom_general_title_fk_lom_owner_sufevcrymo" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_id" ADD CONSTRAINT "__lom_id_fk_id_tag_kind_lom_id_qophyddse_4_dn4cdvz5zw" FOREIGN KEY ("id", "__tag_kind_lom_id_qophyddse4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_id_tag_kind_lom_identifier_zhhp_azlnipzw4a" FOREIGN KEY ("id", "__tag_kind_lom_identifier_zhhp3vq26p") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_id_parent_position_rhykptsoqt" FOREIGN KEY ("id", "parent", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_lom_owner_7ppq3a6qxr" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_id_tag_kind_lom_catalog_6hfzamzc7d" FOREIGN KEY ("id", "__tag_kind_lom_catalog_yeeo53s2uf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_id_identifier_26rxzb7n44" FOREIGN KEY ("id", "identifier") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_identifier_lom_position_e55vucjji4" FOREIGN KEY ("identifier", "lom", "position") REFERENCES "qti"."lom_identifier" ("id", "lom", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_catalog" ADD CONSTRAINT "__lom_identifier_catalog_fk_lom_owner_mvqepvvndf" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_id_tag_kind_lom_entry_z_2_l75xmxt3kd" FOREIGN KEY ("id", "__tag_kind_lom_entry_z2frivifgf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_id_identifier_pxcobfxgo6" FOREIGN KEY ("id", "identifier") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_identifier_lom_position_lfmicwzfum" FOREIGN KEY ("identifier", "lom", "position") REFERENCES "qti"."lom_identifier" ("id", "lom", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_identifier_entry" ADD CONSTRAINT "__lom_identifier_entry_fk_lom_owner_yz7zl3s77l" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_installation_remarks" ADD CONSTRAINT "__lom_installation_remarks_fk_id_tag_kind_lom_ww27inllwj" FOREIGN KEY ("id", "__tag_kind_lom_installation_remarks_6actui7z3e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_installation_remarks" ADD CONSTRAINT "__lom_installation_remarks_fk_id_technical_g77yyfu5bk" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_installation_remarks" ADD CONSTRAINT "__lom_installation_remarks_fk_lom_i776nbzk4n" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD CONSTRAINT "__lom_intended_end_user_role_fk_id_tag_kind_lom_egpc75apis" FOREIGN KEY ("id", "__tag_kind_lom_intended_end_user_role_fu7zxsgpuk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD CONSTRAINT "__lom_intended_end_user_role_fk_lom_ktfhs6wv7t" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_level" ADD CONSTRAINT "__lom_interactivity_level_fk_id_tag_kind_lom_aiamt7iwqo" FOREIGN KEY ("id", "__tag_kind_lom_interactivity_level_42hqjwr3eg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_level" ADD CONSTRAINT "__lom_interactivity_level_fk_lom_sbe3wkv47z" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_type" ADD CONSTRAINT "__lom_interactivity_type_fk_id_tag_kind_lom_r22zgwluzg" FOREIGN KEY ("id", "__tag_kind_lom_interactivity_type_mx3pzoaf7t") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_type" ADD CONSTRAINT "__lom_interactivity_type_fk_lom_ttjit342cz" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_keyword" ADD CONSTRAINT "__lom_keyword_fk_id_tag_kind_lom_keyword_7_mdhbpmyak_66kpjugviq" FOREIGN KEY ("id", "__tag_kind_lom_keyword_7mdhbpmyak") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_keyword" ADD CONSTRAINT "__lom_keyword_fk_lom_qa3ryhoecq" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_kind" ADD CONSTRAINT "__lom_kind_fk_id_tag_kind_lom_kind_xuf_2_kkwyr_4_zz5lccb55i" FOREIGN KEY ("id", "__tag_kind_lom_kind_xuf2kkwyr4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_kind" ADD CONSTRAINT "__lom_kind_fk_lom_x5v72f33di" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_id_tag_kind_lom_language_umo_24_ebp2bvszn4" FOREIGN KEY ("id", "__tag_kind_lom_language_umo24qkhua") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_id_parent_kind_avtlxpj6rc" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_id_position_7hf5mv3uq6" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_lom_7hxs4cmxlz" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_lom_owner_n4lsd3gxmo" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_learning_resource_type" ADD CONSTRAINT "__lom_learning_resource_type_fk_id_tag_kind_lom_7uw7egcsk5" FOREIGN KEY ("id", "__tag_kind_lom_learning_resource_type_mm2kxi35r2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_learning_resource_type" ADD CONSTRAINT "__lom_learning_resource_type_fk_lom_u64xh2vyxm" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_life_cycle" ADD CONSTRAINT "__lom_life_cycle_fk_id_tag_kind_lom_life_cycle_v_5_k73jlrfy56" FOREIGN KEY ("id", "__tag_kind_lom_life_cycle_v5zcy35q77") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_life_cycle" ADD CONSTRAINT "__lom_life_cycle_fk_lom_yejqs4n4pv" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_id_tag_kind_lom_location_3_4kpuqcn6oz" FOREIGN KEY ("id", "__tag_kind_lom_location_3tcexzxgfh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_id_position_bdje3mxzpc" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_id_technical_4m3blt4uw7" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_location" ADD CONSTRAINT "__lom_location_fk_lom_4o7q6h3llc" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_maximum_version" ADD CONSTRAINT "__lom_maximum_version_fk_id_tag_kind_lom_maximum_nsm3qgub3j" FOREIGN KEY ("id", "__tag_kind_lom_maximum_version_anah5x464b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_maximum_version" ADD CONSTRAINT "__lom_maximum_version_fk_id_or_composite_3zkqflygdl" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_maximum_version" ADD CONSTRAINT "__lom_maximum_version_fk_lom_rb6t2quj3i" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_meta_metadata" ADD CONSTRAINT "__lom_meta_metadata_fk_id_tag_kind_lom_meta_metadata_globm7frj7" FOREIGN KEY ("id", "__tag_kind_lom_meta_metadata_z7muqedeoe") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_meta_metadata" ADD CONSTRAINT "__lom_meta_metadata_fk_lom_x2hpctp7aw" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_id_tag_kind_lom_ue4jxpqynq" FOREIGN KEY ("id", "__tag_kind_lom_metadataschema_kjpxrlzjhx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_id_meta_metadata_523sbhi6t6" FOREIGN KEY ("id", "meta_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_id_position_n4wwt3fdvx" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_metadataschema" ADD CONSTRAINT "__lom_metadataschema_fk_lom_t6kwhxajdg" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_minimum_version" ADD CONSTRAINT "__lom_minimum_version_fk_id_tag_kind_lom_minimum_ucb2ck63ug" FOREIGN KEY ("id", "__tag_kind_lom_minimum_version_prl3rwqtuc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_minimum_version" ADD CONSTRAINT "__lom_minimum_version_fk_id_or_composite_fmhozeoprj" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_minimum_version" ADD CONSTRAINT "__lom_minimum_version_fk_lom_ge6recni3p" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_name" ADD CONSTRAINT "__lom_name_fk_id_tag_kind_lom_name_ta_2_c_7_syhrg_m7vxpjven6" FOREIGN KEY ("id", "__tag_kind_lom_name_ta2c7syhrg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_name" ADD CONSTRAINT "__lom_name_fk_id_or_composite_uldc7fa66v" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_name" ADD CONSTRAINT "__lom_name_fk_lom_rrgxp2dfyn" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_identifier_lom_position_hgxmp4e6eg" FOREIGN KEY ("identifier", "lom", "position", "collapsed") REFERENCES "qti"."lom_identifier_entry" ("identifier", "lom", "position", "collapsed") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_lom_package_resource_type_z7kymlx7md" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom_identified" ("lom", "package", "resource", "type");

ALTER TABLE "qti"."lom_object_identifier" ADD CONSTRAINT "__lom_object_identifier_fk_package_resource_ggz2gyu5bk" FOREIGN KEY ("package", "resource", "collapsed") REFERENCES "qti"."document_identifier" ("package", "resource", "value") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_title" ADD CONSTRAINT "__lom_object_title_fk_lom_package_resource_type_rjk5h4sxdc" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom_titled" ("lom", "package", "resource", "type");

ALTER TABLE "qti"."lom_object_title" ADD CONSTRAINT "__lom_object_title_fk_lom_position_collapsed_45znyzcxnu" FOREIGN KEY ("lom", "position", "collapsed") REFERENCES "qti"."lom_title" ("lom", "position", "collapsed") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_object_title" ADD CONSTRAINT "__lom_object_title_fk_package_resource_collapsed_4eqo3tv4fi" FOREIGN KEY ("package", "resource", "collapsed") REFERENCES "qti"."document_title" ("package", "resource", "collapsed") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_id_tag_kind_lom_or_composite_7ce3hso5cy" FOREIGN KEY ("id", "__tag_kind_lom_or_composite_hivjg4kbyy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_id_position_5r4kzrw6am" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_id_requirement_bnqtdcvais" FOREIGN KEY ("id", "requirement") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_or_composite" ADD CONSTRAINT "__lom_or_composite_fk_lom_wjxfsgy4f2" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD CONSTRAINT "__lom_other_platform_requirements_fk_id_tag_kind_lom_d2uneiz6lx" FOREIGN KEY ("id", "__tag_kind_lom_other_platform_requirements_u6lzfnmyqi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD CONSTRAINT "__lom_other_platform_requirements_fk_id_technical_qazogkhd55" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_other_platform_requirements" ADD CONSTRAINT "__lom_other_platform_requirements_fk_lom_zvqps66ffy" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_purpose" ADD CONSTRAINT "__lom_purpose_fk_id_tag_kind_lom_purpose_qtsfpmrlct_nobdk2jbas" FOREIGN KEY ("id", "__tag_kind_lom_purpose_qtsfpmrlct") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_purpose" ADD CONSTRAINT "__lom_purpose_fk_lom_xy4taailou" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_id_tag_kind_lom_relation_adpqqvr_6_6cfiwwa7tj" FOREIGN KEY ("id", "__tag_kind_lom_relation_adpqqvr6or") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_id_lom_zmkhto22ty" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_lom_gmpdl7y72h" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_id_tag_kind_lom_requirement_nfadn3cyem" FOREIGN KEY ("id", "__tag_kind_lom_requirement_giyfrxir3d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_id_position_vugvji5ewc" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_id_technical_z5utcb23yp" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_requirement" ADD CONSTRAINT "__lom_requirement_fk_lom_micqxebrwb" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_resource" ADD CONSTRAINT "__lom_resource_fk_id_tag_kind_lom_resource_jgqpmzi_3_6qi7ptxdfc" FOREIGN KEY ("id", "__tag_kind_lom_resource_jgqpmzi3u4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_resource" ADD CONSTRAINT "__lom_resource_fk_lom_jmhhitoiys" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_rights" ADD CONSTRAINT "__lom_rights_fk_id_tag_kind_lom_rights_2_fcs_3_c_7_2bx2lvxqbi" FOREIGN KEY ("id", "__tag_kind_lom_rights_2fcs3c7jc3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_rights" ADD CONSTRAINT "__lom_rights_fk_lom_yz7vcplc3r" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_role" ADD CONSTRAINT "__lom_role_fk_id_tag_kind_lom_role_mff_47_g_5_aja_lw24d6m3vn" FOREIGN KEY ("id", "__tag_kind_lom_role_mff47g5aja") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_role" ADD CONSTRAINT "__lom_role_fk_id_contribute_pblcscwxcp" FOREIGN KEY ("id", "contribute") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_role" ADD CONSTRAINT "__lom_role_fk_lom_mhaq6h6hjy" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_semantic_density" ADD CONSTRAINT "__lom_semantic_density_fk_id_tag_kind_lom_semantic_4fn5sxcuig" FOREIGN KEY ("id", "__tag_kind_lom_semantic_density_uqmekskg64") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_semantic_density" ADD CONSTRAINT "__lom_semantic_density_fk_lom_dxydczl7vk" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_size" ADD CONSTRAINT "__lom_size_fk_id_tag_kind_lom_size_lxvgvtngju_7db3jsoefd" FOREIGN KEY ("id", "__tag_kind_lom_size_lxvgvtngju") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_size" ADD CONSTRAINT "__lom_size_fk_id_technical_s3a7qj7jeq" FOREIGN KEY ("id", "technical") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_size" ADD CONSTRAINT "__lom_size_fk_lom_3slqvedexx" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source" ADD CONSTRAINT "__lom_source_fk_id_tag_kind_lom_source_2_h_4_d_2_oofbgs4mub" FOREIGN KEY ("id", "__tag_kind_lom_source_2h4d2ilrdk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source_lang_string" ADD CONSTRAINT "__lom_source_lang_string_fk_id_tag_kind_lom_source_r7qdlilqsg" FOREIGN KEY ("id", "__tag_kind_lom_source_lang_string_3blfwn3hhk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source_lang_string" ADD CONSTRAINT "__lom_source_lang_string_fk_lom_z7zml3al6y" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_status" ADD CONSTRAINT "__lom_status_fk_id_tag_kind_lom_status_vvuyk_32_w_3_ehlua2tnpr" FOREIGN KEY ("id", "__tag_kind_lom_status_vvuyk32w3f") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_status" ADD CONSTRAINT "__lom_status_fk_id_life_cycle_u3d4fcmxhx" FOREIGN KEY ("id", "life_cycle") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_status" ADD CONSTRAINT "__lom_status_fk_lom_jdj5c7e4l2" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_string" ADD CONSTRAINT "__lom_string_fk_id_tag_kind_lom_string_s_72_bccwbh_3_is2lj6hc2y" FOREIGN KEY ("id", "__tag_kind_lom_string_s72bccwbh3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_string_language" ADD CONSTRAINT "__lom_string_language_fk_node_56hhggldpq" FOREIGN KEY ("node") REFERENCES "qti"."lom_string" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_structure" ADD CONSTRAINT "__lom_structure_fk_id_tag_kind_lom_structure_7_zyt_pdjqzi3jue" FOREIGN KEY ("id", "__tag_kind_lom_structure_7zyt26pyt6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_structure" ADD CONSTRAINT "__lom_structure_fk_lom_uh7zsbgbgz" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon" ADD CONSTRAINT "__lom_taxon_fk_id_tag_kind_lom_taxon_2_gykitonjg_zavitntcvd" FOREIGN KEY ("id", "__tag_kind_lom_taxon_2gykitonjg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon" ADD CONSTRAINT "__lom_taxon_fk_lom_5mvtruica4" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon_path" ADD CONSTRAINT "__lom_taxon_path_fk_id_tag_kind_lom_taxon_path_ifvs_tq7eupudq3" FOREIGN KEY ("id", "__tag_kind_lom_taxon_path_ifvs3xty7l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon_path" ADD CONSTRAINT "__lom_taxon_path_fk_lom_k3h74twnz6" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_technical" ADD CONSTRAINT "__lom_technical_fk_id_tag_kind_lom_technical_6zvnm5bwg3" FOREIGN KEY ("id", "__tag_kind_lom_technical_yobodngzpk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_technical" ADD CONSTRAINT "__lom_technical_fk_lom_xvuznblomi" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_title" ADD CONSTRAINT "__lom_title_fk_id_position_e4eoi76yyj" FOREIGN KEY ("id", "position") REFERENCES "qti"."edge" ("child", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_title" ADD CONSTRAINT "__lom_title_fk_id_value_collapsed_tbloyxeasb" FOREIGN KEY ("id", "value", "collapsed") REFERENCES "qti"."lom_string" ("id", "value", "collapsed");

ALTER TABLE "qti"."lom_title" ADD CONSTRAINT "__lom_title_fk_lom_owner_jyifashk6t" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_type" ADD CONSTRAINT "__lom_type_fk_id_tag_kind_lom_type_gxwahsvklo_cfzouoexzc" FOREIGN KEY ("id", "__tag_kind_lom_type_gxwahsvklo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_type" ADD CONSTRAINT "__lom_type_fk_id_or_composite_lxutp3jajs" FOREIGN KEY ("id", "or_composite") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_type" ADD CONSTRAINT "__lom_type_fk_lom_2amb2kaljt" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_age_range" ADD CONSTRAINT "__lom_typical_age_range_fk_id_tag_kind_lom_typical_ioa2kacvy3" FOREIGN KEY ("id", "__tag_kind_lom_typical_age_range_b2nwhfufjs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_age_range" ADD CONSTRAINT "__lom_typical_age_range_fk_lom_mvwf7dmhci" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_learning_time" ADD CONSTRAINT "__lom_typical_learning_time_fk_id_tag_kind_lom_43cggo65yx" FOREIGN KEY ("id", "__tag_kind_lom_typical_learning_time_jvgzdwqqg4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_learning_time" ADD CONSTRAINT "__lom_typical_learning_time_fk_lom_rybcun2wt3" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_value" ADD CONSTRAINT "__lom_value_fk_id_tag_kind_lom_value_rhv_3_macnym_izneuoby3s" FOREIGN KEY ("id", "__tag_kind_lom_value_rhv3macnym") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_value" ADD CONSTRAINT "__lom_value_fk_id_parent_kind_k3ati6fakb" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_version" ADD CONSTRAINT "__lom_version_fk_id_tag_kind_lom_version_o_4_inak_47_lhuqp5xp4w" FOREIGN KEY ("id", "__tag_kind_lom_version_o4inak47bb") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_version" ADD CONSTRAINT "__lom_version_fk_id_life_cycle_ktsfyp4drx" FOREIGN KEY ("id", "life_cycle") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_version" ADD CONSTRAINT "__lom_version_fk_lom_m5ko4nzlsu" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lookup_outcome_value" ADD CONSTRAINT "__lookup_outcome_value_fk_id_oz7cfhuqid" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lookup_outcome_value" ADD CONSTRAINT "__lookup_outcome_value_fk_id_ditaed6wt4" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lookup_outcome_value" ADD CONSTRAINT "__lookup_outcome_value_fk_id_tag_kind_qti_lookup_dfgs5ltobq" FOREIGN KEY ("id", "__tag_kind_qti_lookup_outcome_value_upvgllrywv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lt" ADD CONSTRAINT "__lt_fk_id_inbmmkow27" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lt" ADD CONSTRAINT "__lt_fk_id_tag_kind_qti_lt_mu_6_hpi_7_jul_w3xe35lmuy" FOREIGN KEY ("id", "__tag_kind_qti_lt_mu6hpi7jul") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lte" ADD CONSTRAINT "__lte_fk_id_kyui6hi5of" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lte" ADD CONSTRAINT "__lte_fk_id_tag_kind_qti_lte_rzob_7_fldtj_qois4rus27" FOREIGN KEY ("id", "__tag_kind_qti_lte_rzob7fldtj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest" ADD CONSTRAINT "__manifest_fk_id_3ausivvy2g" FOREIGN KEY ("id") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest" ADD CONSTRAINT "__manifest_fk_id_tag_kind_manifest_s_7_wedmbljj_ujghxp6a5t" FOREIGN KEY ("id", "__tag_kind_manifest_s7wedmbljj") REFERENCES "qti"."tree" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id" ADD CONSTRAINT "__manifest_id_fk_package_yrywtozstf" FOREIGN KEY ("package") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_manifest" ADD CONSTRAINT "__manifest_id_of_manifest_fk_package_id_hk5chehryj" FOREIGN KEY ("package", "id") REFERENCES "qti"."package" ("id", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_manifest" ADD CONSTRAINT "__manifest_id_of_manifest_fk_package_id_tag_holder_hcdzuklnac" FOREIGN KEY ("package", "id", "__tag_holder_manifest_7wghkxashe") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_resource" ADD CONSTRAINT "__manifest_id_of_resource_fk_package_id_moulqn3fj4" FOREIGN KEY ("package", "id") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_resource" ADD CONSTRAINT "__manifest_id_of_resource_fk_package_id_tag_holder_zdlxck3tn7" FOREIGN KEY ("package", "id", "__tag_holder_resource_3lbxhuqadk") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_variant" ADD CONSTRAINT "__manifest_id_of_variant_fk_package_id_huvjqiu33v" FOREIGN KEY ("package", "id") REFERENCES "qti"."variant" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_id_of_variant" ADD CONSTRAINT "__manifest_id_of_variant_fk_package_id_tag_holder_jf7shcoyrs" FOREIGN KEY ("package", "id", "__tag_holder_variant_yyymqmlpge") REFERENCES "qti"."manifest_id" ("package", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_tag_owner_manifest_rrl_26_lf5zw3hdgk" FOREIGN KEY ("lom", "__tag_owner_manifest_rrl26sfdmq") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_metadata_exz2q367yy" FOREIGN KEY ("lom", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_package_mqfnkg5gyu" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_package_a6edccbozn" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_metadata_tag_kind_cp_metadata_j5ubrgqjeh" FOREIGN KEY ("metadata", "__tag_kind_cp_metadata_manifest_lxlasjebcx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_metadata" ADD CONSTRAINT "__manifest_metadata_fk_id_tag_kind_cp_metadata_fe72riq7my" FOREIGN KEY ("id", "__tag_kind_cp_metadata_manifest_lxlasjebcx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_metadata" ADD CONSTRAINT "__manifest_metadata_fk_id_manifest_jimqgxh5is" FOREIGN KEY ("id", "manifest") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_metadata" ADD CONSTRAINT "__manifest_metadata_fk_manifest_4jgh6ftqug" FOREIGN KEY ("manifest") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema" ADD CONSTRAINT "__manifest_schema_fk_id_tag_kind_cp_schema_wydqdv_7_palxkyuh46" FOREIGN KEY ("id", "__tag_kind_cp_schema_wydqdv7nqu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema" ADD CONSTRAINT "__manifest_schema_fk_id_metadata_pandrdslwh" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema" ADD CONSTRAINT "__manifest_schema_fk_metadata_fs4pmegkrc" FOREIGN KEY ("metadata") REFERENCES "qti"."manifest_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_id_tag_kind_cp_73wpzhbjjc" FOREIGN KEY ("id", "__tag_kind_cp_schemaversion_b5pisyerct") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_id_metadata_wgpbnfvr2w" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_metadata_qnzzhkogjs" FOREIGN KEY ("metadata") REFERENCES "qti"."manifest_metadata" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_metadata_package_5yymt7fk7p" FOREIGN KEY ("metadata", "package") REFERENCES "qti"."manifest_metadata" ("id", "manifest");

ALTER TABLE "qti"."manifest_schema_version" ADD CONSTRAINT "__manifest_schema_version_fk_package_version_sb3opk7jv2" FOREIGN KEY ("package", "version") REFERENCES "qti"."package" ("id", "schemaversion") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry" ADD CONSTRAINT "__map_entry_fk_id_tag_kind_qti_map_entry_7_jioq_4_2kzwkcvcdo" FOREIGN KEY ("id", "__tag_kind_qti_map_entry_7jioq4tdgv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry" ADD CONSTRAINT "__map_entry_fk_id_mapping_position_5u23fyig52" FOREIGN KEY ("id", "mapping", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry" ADD CONSTRAINT "__map_entry_fk_mapping_declaration_7cev4xiez7" FOREIGN KEY ("mapping", "declaration") REFERENCES "qti"."mapping" ("id", "declaration") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_boolean" ADD CONSTRAINT "__map_entry_boolean_fk_id_tag_base_type_boolean_sz_5_73er2kod2a" FOREIGN KEY ("id", "__tag_base_type_boolean_sz5sfqzghc") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_directed_pair" ADD CONSTRAINT "__map_entry_directed_pair_fk_id_tag_base_type_jvujg6athl" FOREIGN KEY ("id", "__tag_base_type_directed_pair_l5beqw3pbn") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_duration" ADD CONSTRAINT "__map_entry_duration_fk_id_tag_base_type_duration_mlvdsnd7or" FOREIGN KEY ("id", "__tag_base_type_duration_acik5utqq7") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_file" ADD CONSTRAINT "__map_entry_file_fk_id_tag_base_type_file_7_nidsr_63_vp5lynocbt" FOREIGN KEY ("id", "__tag_base_type_file_7nidsr63q6") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_float" ADD CONSTRAINT "__map_entry_float_fk_id_tag_base_type_float_gd_7_mwlhutnvdi" FOREIGN KEY ("id", "__tag_base_type_float_gd7vjzwxn6") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_identifier" ADD CONSTRAINT "__map_entry_identifier_fk_id_tag_base_type_7pypt3afee" FOREIGN KEY ("id", "__tag_base_type_identifier_sk62dxvgra") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_integer" ADD CONSTRAINT "__map_entry_integer_fk_id_tag_base_type_integer_e_7_kcixevt2qp" FOREIGN KEY ("id", "__tag_base_type_integer_e7bv3rhpqy") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_pair" ADD CONSTRAINT "__map_entry_pair_fk_id_tag_base_type_pair_nzskhfheuw_k6h22wiy27" FOREIGN KEY ("id", "__tag_base_type_pair_nzskhfheuw") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_point" ADD CONSTRAINT "__map_entry_point_fk_id_tag_base_type_point_7_hlqjth_fknsfxv7iz" FOREIGN KEY ("id", "__tag_base_type_point_7hlqjth2q6") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_string" ADD CONSTRAINT "__map_entry_string_fk_id_tag_base_type_string_dxu_45_z6pqov4miv" FOREIGN KEY ("id", "__tag_base_type_string_dxu45pcf3v") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_entry_uri" ADD CONSTRAINT "__map_entry_uri_fk_id_tag_base_type_uri_ac_5_msyixkz_sdbube4xp3" FOREIGN KEY ("id", "__tag_base_type_uri_ac5msyixkz") REFERENCES "qti"."map_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response" ADD CONSTRAINT "__map_response_fk_id_fuhcgjkpzo" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response" ADD CONSTRAINT "__map_response_fk_id_v3lhvp7zwk" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response" ADD CONSTRAINT "__map_response_fk_id_tag_kind_qti_map_response_7kz5oqqvrj" FOREIGN KEY ("id", "__tag_kind_qti_map_response_argeupazur") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response_point" ADD CONSTRAINT "__map_response_point_fk_id_q5hysxtwju" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response_point" ADD CONSTRAINT "__map_response_point_fk_id_rfzddt37sa" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."map_response_point" ADD CONSTRAINT "__map_response_point_fk_id_tag_kind_qti_map_response_pqjmyxmroj" FOREIGN KEY ("id", "__tag_kind_qti_map_response_point_q6t4cnql4v") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_base_type_vhdttvawoa" FOREIGN KEY ("base_type") REFERENCES "qti"."mappable_base_type" ("base_type");

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_declaration_base_type_m4w4lsqkuv" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_id_tag_kind_qti_mapping_qs_3_jyoupmy_epxhorf6f6" FOREIGN KEY ("id", "__tag_kind_qti_mapping_qs3jyoupmy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_id_declaration_fqrpmmfhyb" FOREIGN KEY ("id", "declaration") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping_lower_bound" ADD CONSTRAINT "__mapping_lower_bound_fk_node_bu6cethjgk" FOREIGN KEY ("node") REFERENCES "qti"."mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping_upper_bound" ADD CONSTRAINT "__mapping_upper_bound_fk_node_tdf2eguewu" FOREIGN KEY ("node") REFERENCES "qti"."mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match" ADD CONSTRAINT "__match_fk_id_hvzxeiva7v" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match" ADD CONSTRAINT "__match_fk_id_tag_kind_qti_match_lnqs_6_dxwup_zmwvvpefyc" FOREIGN KEY ("id", "__tag_kind_qti_match_lnqs6dxwup") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_first_column_header" ADD CONSTRAINT "__match_first_column_header_fk_node_5e5mvplbjh" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_interaction" ADD CONSTRAINT "__match_interaction_fk_id_tag_kind_qti_match_6sbelzicus" FOREIGN KEY ("id", "__tag_kind_qti_match_interaction_t55y35p4zv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_interaction" ADD CONSTRAINT "__match_interaction_fk_id_root_kind_gry4tmuzlw" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_max_selections_message" ADD CONSTRAINT "__match_max_selections_message_fk_node_lfgtlz2all" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_min_selections_message" ADD CONSTRAINT "__match_min_selections_message_fk_node_ghfenwvm6u" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_tag_cardinality_single_oihcqdanzo" FOREIGN KEY ("declaration", "__tag_cardinality_single_b63ah65un6") REFERENCES "qti"."typed_declaration" ("id", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_tag_kind_outcome_7j7eigfqnj" FOREIGN KEY ("declaration", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_base_type_dzx2yxytuu" FOREIGN KEY ("declaration", "base_type") REFERENCES "qti"."typed_declaration" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_id_tag_kind_qti_match_table_lxwkv_2_ppjs7bi4sg" FOREIGN KEY ("id", "__tag_kind_qti_match_table_lxwkv2knkw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value" ADD CONSTRAINT "__match_table_default_value_fk_node_base_type_upayvngux7" FOREIGN KEY ("node", "base_type") REFERENCES "qti"."match_table" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_boolean" ADD CONSTRAINT "__match_table_default_value_boolean_fk_node_tag_base_yrtwjjr77m" FOREIGN KEY ("node", "__tag_base_type_boolean_3gkthlgi7m") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_directed_pair" ADD CONSTRAINT "__match_table_default_value_directed_pair_fk_node_b6aubbdhy5" FOREIGN KEY ("node", "__tag_base_type_directed_pair_g55e7b3zra") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_duration" ADD CONSTRAINT "__match_table_default_value_duration_fk_node_tag_tks374ywjz" FOREIGN KEY ("node", "__tag_base_type_duration_k2dhcjknc7") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_file" ADD CONSTRAINT "__match_table_default_value_file_fk_node_tag_base_c5glrfmlnh" FOREIGN KEY ("node", "__tag_base_type_file_acefaavjzm") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_float" ADD CONSTRAINT "__match_table_default_value_float_fk_node_tag_base_nnbknjffn3" FOREIGN KEY ("node", "__tag_base_type_float_vlkxjkvexr") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_identifier" ADD CONSTRAINT "__match_table_default_value_identifier_fk_node_tag_umd754m6lg" FOREIGN KEY ("node", "__tag_base_type_identifier_llbnmlnkme") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_integer" ADD CONSTRAINT "__match_table_default_value_integer_fk_node_tag_base_4ytq3fge3v" FOREIGN KEY ("node", "__tag_base_type_integer_kklrreovhf") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_pair" ADD CONSTRAINT "__match_table_default_value_pair_fk_node_tag_base_l7jjn345tt" FOREIGN KEY ("node", "__tag_base_type_pair_mtidnevkdn") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_point" ADD CONSTRAINT "__match_table_default_value_point_fk_node_tag_base_fiunhbyijn" FOREIGN KEY ("node", "__tag_base_type_point_m227v77qci") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_string" ADD CONSTRAINT "__match_table_default_value_string_fk_node_tag_base_vvilh3ncnt" FOREIGN KEY ("node", "__tag_base_type_string_ves2pqn2cj") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_default_value_uri" ADD CONSTRAINT "__match_table_default_value_uri_fk_node_tag_base_yecdlepdqw" FOREIGN KEY ("node", "__tag_base_type_uri_mknqhgttit") REFERENCES "qti"."match_table_default_value" ("node", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry" ADD CONSTRAINT "__match_table_entry_fk_id_tag_kind_qti_match_table_4qfr4hasly" FOREIGN KEY ("id", "__tag_kind_qti_match_table_entry_wjydsm3ffv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry" ADD CONSTRAINT "__match_table_entry_fk_id_table_position_eyyhu46k3r" FOREIGN KEY ("id", "table", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry" ADD CONSTRAINT "__match_table_entry_fk_table_declaration_base_type_un5vbchw5g" FOREIGN KEY ("table", "declaration", "base_type") REFERENCES "qti"."match_table" ("id", "declaration", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_boolean" ADD CONSTRAINT "__match_table_entry_boolean_fk_id_tag_base_type_tiot4yjrhs" FOREIGN KEY ("id", "__tag_base_type_boolean_u3kn7vrwi7") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_directed_pair" ADD CONSTRAINT "__match_table_entry_directed_pair_fk_id_tag_base_j2hr6b766f" FOREIGN KEY ("id", "__tag_base_type_directed_pair_jbwcviweyf") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_duration" ADD CONSTRAINT "__match_table_entry_duration_fk_id_tag_base_type_pofpsdyzrp" FOREIGN KEY ("id", "__tag_base_type_duration_fey7pwwwht") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_file" ADD CONSTRAINT "__match_table_entry_file_fk_id_tag_base_type_file_75_chhevwe4rn" FOREIGN KEY ("id", "__tag_base_type_file_75z2meesum") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_float" ADD CONSTRAINT "__match_table_entry_float_fk_id_tag_base_type_float_pb4ieazv2o" FOREIGN KEY ("id", "__tag_base_type_float_3iarvjcxve") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_identifier" ADD CONSTRAINT "__match_table_entry_identifier_fk_id_tag_base_type_y5cfmsjvpk" FOREIGN KEY ("id", "__tag_base_type_identifier_bgwyswav7g") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_integer" ADD CONSTRAINT "__match_table_entry_integer_fk_id_tag_base_type_naw52xgkx7" FOREIGN KEY ("id", "__tag_base_type_integer_duiah6gkk3") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_pair" ADD CONSTRAINT "__match_table_entry_pair_fk_id_tag_base_type_pair_dfn6hnnaae" FOREIGN KEY ("id", "__tag_base_type_pair_obsvzrhgcx") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_point" ADD CONSTRAINT "__match_table_entry_point_fk_id_tag_base_type_point_nn63nktyia" FOREIGN KEY ("id", "__tag_base_type_point_tdg256h5s2") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_string" ADD CONSTRAINT "__match_table_entry_string_fk_id_tag_base_type_vgf4nlhxpk" FOREIGN KEY ("id", "__tag_base_type_string_roz3vktfny") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table_entry_uri" ADD CONSTRAINT "__match_table_entry_uri_fk_id_tag_base_type_uri_qh_4_iv2x6c5bt2" FOREIGN KEY ("id", "__tag_base_type_uri_qh4veg7gci") REFERENCES "qti"."match_table_entry" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_constant" ADD CONSTRAINT "__math_constant_fk_id_3if4wk74ff" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_constant" ADD CONSTRAINT "__math_constant_fk_id_tag_kind_qti_math_constant_33_iaucqlqiqv" FOREIGN KEY ("id", "__tag_kind_qti_math_constant_33aeaomua7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_operator" ADD CONSTRAINT "__math_operator_fk_id_3qu4p4udeg" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."math_operator" ADD CONSTRAINT "__math_operator_fk_id_tag_kind_qti_math_operator_5_q_3mbmdzquip" FOREIGN KEY ("id", "__tag_kind_qti_math_operator_5q3gpyxbee") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."max" ADD CONSTRAINT "__max_fk_id_g5zf7brjq6" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."max" ADD CONSTRAINT "__max_fk_id_tag_kind_qti_max_k_2_fgxlddd_5_kfmzhfjbif" FOREIGN KEY ("id", "__tag_kind_qti_max_k2fgxlddd5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_coords" ADD CONSTRAINT "__media_coords_fk_node_exewz35qm6" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_interaction" ADD CONSTRAINT "__media_interaction_fk_id_tag_kind_qti_media_osagmlb2vb" FOREIGN KEY ("id", "__tag_kind_qti_media_interaction_tfi75ox2wv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_interaction" ADD CONSTRAINT "__media_interaction_fk_id_root_kind_isxeuk3r6z" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_max_plays" ADD CONSTRAINT "__media_max_plays_fk_node_bdehpncf6y" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_min_plays" ADD CONSTRAINT "__media_min_plays_fk_node_374ek5f5ar" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."member" ADD CONSTRAINT "__member_fk_id_oojwslvahd" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."member" ADD CONSTRAINT "__member_fk_id_tag_kind_qti_member_wlwyybwmab_tuy6q4dbzl" FOREIGN KEY ("id", "__tag_kind_qti_member_wlwyybwmab") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."min" ADD CONSTRAINT "__min_fk_id_vetagsffvs" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."min" ADD CONSTRAINT "__min_fk_id_tag_kind_qti_min_5_k_4_uqv_4_ded_m7743yrr2x" FOREIGN KEY ("id", "__tag_kind_qti_min_5k4uqv4ded") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."modal_feedback" ADD CONSTRAINT "__modal_feedback_fk_id_tag_kind_qti_modal_feedback_3s5rrouyyk" FOREIGN KEY ("id", "__tag_kind_qti_modal_feedback_mxux7xznmz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."modal_feedback" ADD CONSTRAINT "__modal_feedback_fk_id_version_okclkcbsak" FOREIGN KEY ("id", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."modal_feedback_title" ADD CONSTRAINT "__modal_feedback_title_fk_node_s55stk2oly" FOREIGN KEY ("node") REFERENCES "qti"."modal_feedback" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."multiple" ADD CONSTRAINT "__multiple_fk_id_cxclpn5p2n" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."multiple" ADD CONSTRAINT "__multiple_fk_id_tag_kind_qti_multiple_blwsugoch_2_ph7jucqnpt" FOREIGN KEY ("id", "__tag_kind_qti_multiple_blwsugoch2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."namespace_declaration" ADD CONSTRAINT "__namespace_declaration_fk_node_3d3hbes2yn" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."nav" ADD CONSTRAINT "__nav_fk_id_tag_kind_nav_cpuuu_4_v_2_qr_baaw2tn4vu" FOREIGN KEY ("id", "__tag_kind_nav_cpuuu4v2qr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_fk_ancestry_kind_hndoexzrnu" FOREIGN KEY ("ancestry", "kind") REFERENCES "qti"."ancestry_step" ("ancestry", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_fk_tree_version_root_kind_zpi2yvq4yw" FOREIGN KEY ("tree", "version", "root_kind") REFERENCES "qti"."tree" ("id", "version", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_catalog_idref" ADD CONSTRAINT "__node_catalog_idref_fk_kind_attribute_dmqrqvwjxd" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_catalog_idref" ADD CONSTRAINT "__node_catalog_idref_fk_node_kind_wpv3gn5wez" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_class" ADD CONSTRAINT "__node_class_fk_kind_attribute_estnk5pmc5" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_class" ADD CONSTRAINT "__node_class_fk_node_kind_dlk5gzx3no" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_dir" ADD CONSTRAINT "__node_dir_fk_kind_attribute_lx5ufqn62b" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_dir" ADD CONSTRAINT "__node_dir_fk_node_kind_bitbjqxktu" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_label" ADD CONSTRAINT "__node_label_fk_kind_attribute_lwccn4az4x" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_label" ADD CONSTRAINT "__node_label_fk_node_kind_44rmrx2ncb" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_label" ADD CONSTRAINT "__node_label_fk_node_tree_root_kind_3p43n6wrno" FOREIGN KEY ("node", "tree", "root_kind") REFERENCES "qti"."node" ("id", "tree", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_lang" ADD CONSTRAINT "__node_lang_fk_kind_attribute_qyelp24637" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_lang" ADD CONSTRAINT "__node_lang_fk_node_kind_ev24asjwfe" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_suppress_tts" ADD CONSTRAINT "__node_suppress_tts_fk_kind_attribute_aierekws2n" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_suppress_tts" ADD CONSTRAINT "__node_suppress_tts_fk_node_kind_p6xvmp7box" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_xml_base" ADD CONSTRAINT "__node_xml_base_fk_kind_attribute_biptegyztq" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_xml_base" ADD CONSTRAINT "__node_xml_base_fk_node_kind_y6dxq22qfb" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_xml_lang" ADD CONSTRAINT "__node_xml_lang_fk_kind_attribute_orsrgas7dz" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_xml_lang" ADD CONSTRAINT "__node_xml_lang_fk_node_kind_rfzk7k5hmh" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_xml_lang" ADD CONSTRAINT "__node_xml_lang_fk_node_tree_root_kind_vaogyjcme3" FOREIGN KEY ("node", "tree", "root_kind") REFERENCES "qti"."node" ("id", "tree", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."not" ADD CONSTRAINT "__not_fk_id_cmsiylmljp" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."not" ADD CONSTRAINT "__not_fk_id_tag_kind_qti_not_ctn_3_qliz_6_a_sebxf5zr6o" FOREIGN KEY ("id", "__tag_kind_qti_not_ctn3qliz6a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."null" ADD CONSTRAINT "__null_fk_id_ldxmdadr3e" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."null" ADD CONSTRAINT "__null_fk_id_tag_kind_qti_null_sjdltnabyd_7fti64b735" FOREIGN KEY ("id", "__tag_kind_qti_null_sjdltnabyd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_correct" ADD CONSTRAINT "__number_correct_fk_id_iarcqhrcze" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_correct" ADD CONSTRAINT "__number_correct_fk_id_tag_kind_qti_number_correct_x6ksglx5lo" FOREIGN KEY ("id", "__tag_kind_qti_number_correct_vgudlj33aa") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_incorrect" ADD CONSTRAINT "__number_incorrect_fk_id_j24hcc54zj" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_incorrect" ADD CONSTRAINT "__number_incorrect_fk_id_tag_kind_qti_number_ttjziwrnxm" FOREIGN KEY ("id", "__tag_kind_qti_number_incorrect_fobw5d7gbp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_presented" ADD CONSTRAINT "__number_presented_fk_id_a5x2tt6j5b" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_presented" ADD CONSTRAINT "__number_presented_fk_id_tag_kind_qti_number_onbvhyq2bq" FOREIGN KEY ("id", "__tag_kind_qti_number_presented_c4kw7h2vss") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_responded" ADD CONSTRAINT "__number_responded_fk_id_gfpoethceq" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_responded" ADD CONSTRAINT "__number_responded_fk_id_tag_kind_qti_number_oefmiaomde" FOREIGN KEY ("id", "__tag_kind_qti_number_responded_rej7fdtd2o") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_selected" ADD CONSTRAINT "__number_selected_fk_id_7c23e26pls" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."number_selected" ADD CONSTRAINT "__number_selected_fk_id_tag_kind_qti_number_selected_mungmro26d" FOREIGN KEY ("id", "__tag_kind_qti_number_selected_y5wyghaa7n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."object" ADD CONSTRAINT "__object_fk_id_tag_kind_object_zd_2_ersk_4_ce_jb26tg7amh" FOREIGN KEY ("id", "__tag_kind_object_zd2ersk4ce") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."object_height" ADD CONSTRAINT "__object_height_fk_node_kbpvy4lutz" FOREIGN KEY ("node") REFERENCES "qti"."object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."object_width" ADD CONSTRAINT "__object_width_fk_node_i5ui5s3x6v" FOREIGN KEY ("node") REFERENCES "qti"."object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ol" ADD CONSTRAINT "__ol_fk_id_tag_kind_ol_2_e_4_w_45_eumy_7gktmqrx2i" FOREIGN KEY ("id", "__tag_kind_ol_2e4w45eumy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."operand" ADD CONSTRAINT "__operand_fk_child_esvwbv5qvw" FOREIGN KEY ("child") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."operand" ADD CONSTRAINT "__operand_fk_child_expression_position_4gzu3ccf2u" FOREIGN KEY ("child", "expression", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."operand" ADD CONSTRAINT "__operand_fk_expression_j6slibtu5a" FOREIGN KEY ("expression") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."or" ADD CONSTRAINT "__or_fk_id_tscrqmza5p" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."or" ADD CONSTRAINT "__or_fk_id_tag_kind_qti_or_2_bm_3_cp_5_uoy_b3a2z75he4" FOREIGN KEY ("id", "__tag_kind_qti_or_2bm3cp5uoy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_choices_container_width" ADD CONSTRAINT "__order_choices_container_width_fk_node_tx5e7fvz5a" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_interaction" ADD CONSTRAINT "__order_interaction_fk_id_tag_kind_qti_order_qtucfuen6g" FOREIGN KEY ("id", "__tag_kind_qti_order_interaction_idcyl5weiu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_interaction" ADD CONSTRAINT "__order_interaction_fk_id_root_kind_rneeksq4q5" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_max_choices_n" ADD CONSTRAINT "__order_max_choices_n_fk_node_value_5wtfbuf7it" FOREIGN KEY ("node", "value") REFERENCES "qti"."order_interaction" ("id", "max_choices_n") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_max_selections_message" ADD CONSTRAINT "__order_max_selections_message_fk_node_fq7nosjmlj" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_min_choices_n" ADD CONSTRAINT "__order_min_choices_n_fk_node_value_qxku76qbit" FOREIGN KEY ("node", "value") REFERENCES "qti"."order_interaction" ("id", "min_choices_n") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_min_selections_message" ADD CONSTRAINT "__order_min_selections_message_fk_node_lmkupphtsf" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_orientation" ADD CONSTRAINT "__order_orientation_fk_node_pu5bxiuslw" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordered" ADD CONSTRAINT "__ordered_fk_id_eewdmtzqwd" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordered" ADD CONSTRAINT "__ordered_fk_id_tag_kind_qti_ordered_wujbvdvnaz_djxt4mgw26" FOREIGN KEY ("id", "__tag_kind_qti_ordered_wujbvdvnaz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ordinary_dilt5z26qb" FOREIGN KEY ("id", "__tag_kind_ordinary_nxdawqnzxk") REFERENCES "qti"."statistic" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ordinary_statistic_arm" ADD CONSTRAINT "__ordinary_statistic_arm_fk_id_tag_kind_ud_ordinary_zseoy5wvrj" FOREIGN KEY ("id", "__tag_kind_ud_ordinary_statistic_eakzbvyu36") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."organizations" ADD CONSTRAINT "__organizations_fk_id_tag_kind_cp_organizations_io_7_db7fzjtwu2" FOREIGN KEY ("id", "__tag_kind_cp_organizations_io7npeoiga") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."organizations" ADD CONSTRAINT "__organizations_fk_id_manifest_tri2qkyb2l" FOREIGN KEY ("id", "manifest") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."organizations" ADD CONSTRAINT "__organizations_fk_manifest_fb7sc7ale2" FOREIGN KEY ("manifest") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_condition_arm" ADD CONSTRAINT "__outcome_condition_arm_fk_id_xhrncakxwx" FOREIGN KEY ("id") REFERENCES "qti"."outcome_if_arm" ("condition") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_condition_arm" ADD CONSTRAINT "__outcome_condition_arm_fk_id_tag_kind_qti_outcome_xgomswhii7" FOREIGN KEY ("id", "__tag_kind_qti_outcome_condition_3td227dwcr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_declaration_arm" ADD CONSTRAINT "__outcome_declaration_arm_fk_id_tag_kind_outcome_22chhrzgof" FOREIGN KEY ("id", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_declaration_arm" ADD CONSTRAINT "__outcome_declaration_arm_fk_id_tag_kind_qti_outcome_wgdpfrnmwl" FOREIGN KEY ("id", "__tag_kind_qti_outcome_declaration_pavxgyuva7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_declaration_lvjuav56en" FOREIGN KEY ("declaration") REFERENCES "qti"."outcome_declaration_arm" ("id");

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_declaration_document_d6q5lquv7z" FOREIGN KEY ("declaration", "document", "identifier") REFERENCES "qti"."declaration" ("id", "document", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_tag_root_outcomes_5_63a3qgu7b2" FOREIGN KEY ("document", "__tag_root_outcomes_5xb23aywsn") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_declaration_qtmk3xxqen" FOREIGN KEY ("document", "declaration") REFERENCES "qti"."tree_root" ("tree", "node");

ALTER TABLE "qti"."outcome_document" ADD CONSTRAINT "__outcome_document_fk_document_identifier_v5jocpx7r5" FOREIGN KEY ("document", "identifier") REFERENCES "qti"."document_identifier" ("document", "value") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_arm" ADD CONSTRAINT "__outcome_else_arm_fk_id_tag_kind_qti_outcome_else_7_yutniokik2" FOREIGN KEY ("id", "__tag_kind_qti_outcome_else_7klt3q36ge") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_arm" ADD CONSTRAINT "__outcome_else_arm_fk_id_condition_thr2iy3hbr" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_if_arm" ADD CONSTRAINT "__outcome_else_if_arm_fk_id_4flu66ksyg" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_else_if_arm" ADD CONSTRAINT "__outcome_else_if_arm_fk_id_tag_kind_qti_outcome_a3sb3aax6w" FOREIGN KEY ("id", "__tag_kind_qti_outcome_else_if_dfe5qckhzt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_condition_f4ncbmgu25" FOREIGN KEY ("condition") REFERENCES "qti"."outcome_condition_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_id_4xnfondegy" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_id_tag_kind_qti_outcome_if_unq_7_qjmeehzmtj" FOREIGN KEY ("id", "__tag_kind_qti_outcome_if_unq7efyvy3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_if_arm" ADD CONSTRAINT "__outcome_if_arm_fk_id_condition_loiz5l7s2v" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_maximum_arm" ADD CONSTRAINT "__outcome_maximum_arm_fk_id_vwh4v63gob" FOREIGN KEY ("id") REFERENCES "qti"."outcome_min_max" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_maximum_arm" ADD CONSTRAINT "__outcome_maximum_arm_fk_id_tag_kind_qti_outcome_wvicjkszpx" FOREIGN KEY ("id", "__tag_kind_qti_outcome_maximum_xfo2bco2fs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_min_max" ADD CONSTRAINT "__outcome_min_max_fk_id_g6ayyix4px" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_min_max" ADD CONSTRAINT "__outcome_min_max_fk_id_kind_z432ftoffo" FOREIGN KEY ("id", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_minimum_arm" ADD CONSTRAINT "__outcome_minimum_arm_fk_id_27krwgiz2y" FOREIGN KEY ("id") REFERENCES "qti"."outcome_min_max" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_minimum_arm" ADD CONSTRAINT "__outcome_minimum_arm_fk_id_tag_kind_qti_outcome_5fjyioefaz" FOREIGN KEY ("id", "__tag_kind_qti_outcome_minimum_tdjdlbn6dy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_processing" ADD CONSTRAINT "__outcome_processing_fk_id_tag_kind_qti_outcome_27vrfx42fi" FOREIGN KEY ("id", "__tag_kind_qti_outcome_processing_fhxwpg6h24") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."outcome_processing_fragment" ADD CONSTRAINT "__outcome_processing_fragment_fk_id_tag_kind_qti_j5zojarox7" FOREIGN KEY ("id", "__tag_kind_qti_outcome_processing_fragment_unfq3d4o7g") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."p" ADD CONSTRAINT "__p_fk_id_tag_kind_p_mm_76_ho_4_kjx_btiv6c7hco" FOREIGN KEY ("id", "__tag_kind_p_mm76ho4kjx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_fk_id_qkk3hvg5u6" FOREIGN KEY ("id") REFERENCES "qti"."manifest" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_fk_id_tag_kind_cp_manifest_vqajffgjxd_4fjgrvwawo" FOREIGN KEY ("id", "__tag_kind_cp_manifest_vqajffgjxd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package" ADD CONSTRAINT "__package_fk_id_identifier_m4bs47fzwc" FOREIGN KEY ("id", "identifier") REFERENCES "qti"."manifest_id_of_manifest" ("package", "id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."package_entry" ADD CONSTRAINT "__package_entry_fk_package_3f4tbft6yj" FOREIGN KEY ("package") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."param" ADD CONSTRAINT "__param_fk_id_tag_kind_param_ahmia_5_b_7_ly_rcsml4x3b5" FOREIGN KEY ("id", "__tag_kind_param_ahmia5b7ly") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."param_type" ADD CONSTRAINT "__param_type_fk_node_cogiao26ry" FOREIGN KEY ("node") REFERENCES "qti"."param" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pattern_match" ADD CONSTRAINT "__pattern_match_fk_id_paggty4v4t" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pattern_match" ADD CONSTRAINT "__pattern_match_fk_id_tag_kind_qti_pattern_match_fvc_tgqazw72z4" FOREIGN KEY ("id", "__tag_kind_qti_pattern_match_fvc7hdtz3d") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pi" ADD CONSTRAINT "__pi_fk_id_tag_kind_pi_iifj_7_oyikt_rmzkyimkem" FOREIGN KEY ("id", "__tag_kind_pi_iifj7oyikt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."picture" ADD CONSTRAINT "__picture_fk_id_tag_kind_picture_773_bajqqhs_aewxyrcnk5" FOREIGN KEY ("id", "__tag_kind_picture_773bajqqhs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_center_point" ADD CONSTRAINT "__position_object_center_point_fk_node_iovuq7dpck" FOREIGN KEY ("node") REFERENCES "qti"."position_object_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_interaction" ADD CONSTRAINT "__position_object_interaction_fk_id_tag_kind_qti_rn24lyfzfy" FOREIGN KEY ("id", "__tag_kind_qti_position_object_interaction_rge3opb2bo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_interaction" ADD CONSTRAINT "__position_object_interaction_fk_id_root_kind_3bis25nbzv" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_min_choices" ADD CONSTRAINT "__position_object_min_choices_fk_node_ln32s55ww6" FOREIGN KEY ("node") REFERENCES "qti"."position_object_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_stage" ADD CONSTRAINT "__position_object_stage_fk_id_tag_kind_qti_position_ntryijnkfm" FOREIGN KEY ("id", "__tag_kind_qti_position_object_stage_opzdehxvaq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."power" ADD CONSTRAINT "__power_fk_id_2dz5cm56km" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."power" ADD CONSTRAINT "__power_fk_id_tag_kind_qti_power_kpx_2_em_75_ca_4ojebbslvf" FOREIGN KEY ("id", "__tag_kind_qti_power_kpx2em75ca") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."pre" ADD CONSTRAINT "__pre_fk_id_tag_kind_pre_pindojue_2_g_aikpj4polv" FOREIGN KEY ("id", "__tag_kind_pre_pindojue2g") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable" ADD CONSTRAINT "__printed_variable_fk_id_tag_kind_qti_printed_e2obb2vwki" FOREIGN KEY ("id", "__tag_kind_qti_printed_variable_a4wq7cp2a3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_field" ADD CONSTRAINT "__printed_variable_field_fk_node_hak6vk2eke" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_format" ADD CONSTRAINT "__printed_variable_format_fk_node_jmlkctysz2" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_id" ADD CONSTRAINT "__printed_variable_id_fk_document_id_tag_holder_m4vrflia5s" FOREIGN KEY ("document", "id", "__tag_holder_printed_variable_s5vwhne3e7") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_id" ADD CONSTRAINT "__printed_variable_id_fk_node_document_ner24327p2" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_index" ADD CONSTRAINT "__printed_variable_index_fk_node_nkw4wz6yf5" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_ref" ADD CONSTRAINT "__printed_variable_ref_fk_document_identifier_kind_wlvb6fvymm" FOREIGN KEY ("document", "identifier", "kind") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_ref" ADD CONSTRAINT "__printed_variable_ref_fk_node_kbpnmqwoea" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_ref" ADD CONSTRAINT "__printed_variable_ref_fk_node_document_ngrgcqxhwh" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_var_ref" ADD CONSTRAINT "__printed_variable_var_ref_fk_document_identifier_h6bvjgqwwy" FOREIGN KEY ("document", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_var_ref" ADD CONSTRAINT "__printed_variable_var_ref_fk_document_identifier_jvsdpgox2o" FOREIGN KEY ("document", "identifier", "kind") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_var_ref" ADD CONSTRAINT "__printed_variable_var_ref_fk_node_tqxpe67g2z" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."printed_variable_var_ref" ADD CONSTRAINT "__printed_variable_var_ref_fk_node_document_4qdvj5w4al" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."product" ADD CONSTRAINT "__product_fk_id_jjwyrz7j4o" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."product" ADD CONSTRAINT "__product_fk_id_tag_kind_qti_product_hojc_6_apo_2_s_yloixsjp5u" FOREIGN KEY ("id", "__tag_kind_qti_product_hojc6apo2s") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prompt" ADD CONSTRAINT "__prompt_fk_id_tag_kind_qti_prompt_4_i_6_supq_76_j_e3luwmtdtl" FOREIGN KEY ("id", "__tag_kind_qti_prompt_4i6supq76j") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."prompt" ADD CONSTRAINT "__prompt_fk_id_parent_yuyejxedmn" FOREIGN KEY ("id", "parent") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."q" ADD CONSTRAINT "__q_fk_id_tag_kind_q_v_2_ut_4_rkmxv_s76xk7gaue" FOREIGN KEY ("id", "__tag_kind_q_v2ut4rkmxv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."q_cite" ADD CONSTRAINT "__q_cite_fk_node_3ahyeo6j66" FOREIGN KEY ("node") REFERENCES "qti"."q" ("id");

ALTER TABLE "qti"."qmd_composite" ADD CONSTRAINT "__qmd_composite_fk_id_tag_kind_qmd_composite_sp_2_w7goerpcuq" FOREIGN KEY ("id", "__tag_kind_qmd_composite_sp2gjoeow2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_composite" ADD CONSTRAINT "__qmd_composite_fk_id_qti_metadata_rltqut3omc" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_custom_type_identifier" ADD CONSTRAINT "__qmd_custom_type_identifier_fk_id_tag_kind_qmd_juhianhcwa" FOREIGN KEY ("id", "__tag_kind_qmd_custom_type_identifier_6maf4fokd4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_custom_type_identifier" ADD CONSTRAINT "__qmd_custom_type_identifier_fk_id_context_gba6i6a6uk" FOREIGN KEY ("id", "context") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_feedback_type" ADD CONSTRAINT "__qmd_feedback_type_fk_id_tag_kind_qmd_feedback_type_gqyhcryw34" FOREIGN KEY ("id", "__tag_kind_qmd_feedback_type_i4afuxmkum") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_feedback_type" ADD CONSTRAINT "__qmd_feedback_type_fk_id_qti_metadata_epakzlvve2" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_kind" ADD CONSTRAINT "__qmd_interaction_kind_fk_id_tag_kind_qmd_khrgw6ttuv" FOREIGN KEY ("id", "__tag_kind_qmd_interaction_kind_hqx3cimuzu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_kind" ADD CONSTRAINT "__qmd_interaction_kind_fk_id_context_7jpeebird6" FOREIGN KEY ("id", "context") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_type" ADD CONSTRAINT "__qmd_interaction_type_fk_id_tag_kind_qmd_ry22iea4su" FOREIGN KEY ("id", "__tag_kind_qmd_interaction_type_yfu5laontj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_interaction_type" ADD CONSTRAINT "__qmd_interaction_type_fk_id_qti_metadata_ybgt6st54k" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_item_template" ADD CONSTRAINT "__qmd_item_template_fk_id_tag_kind_qmd_item_template_lnwilcyl2j" FOREIGN KEY ("id", "__tag_kind_qmd_item_template_qed7bxhx4c") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_item_template" ADD CONSTRAINT "__qmd_item_template_fk_id_qti_metadata_76urwcvj3t" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_portable_custom_interaction_context" ADD CONSTRAINT "__qmd_portable_custom_interaction_context_fk_id_tag_u27enhz75w" FOREIGN KEY ("id", "__tag_kind_qmd_portable_custom_interaction_context_qpozrauewz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_portable_custom_interaction_context" ADD CONSTRAINT "__qmd_portable_custom_interaction_context_fk_id_qti_tql6iasbh2" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_scoring_mode" ADD CONSTRAINT "__qmd_scoring_mode_fk_id_tag_kind_qmd_scoring_mode_yn3ythnjwy" FOREIGN KEY ("id", "__tag_kind_qmd_scoring_mode_eautyyrud4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_scoring_mode" ADD CONSTRAINT "__qmd_scoring_mode_fk_id_qti_metadata_52k3fctbf2" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_solution_available" ADD CONSTRAINT "__qmd_solution_available_fk_id_tag_kind_qmd_solution_hwti37e5ul" FOREIGN KEY ("id", "__tag_kind_qmd_solution_available_2phsdzymgo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_solution_available" ADD CONSTRAINT "__qmd_solution_available_fk_id_qti_metadata_exg2b4t6mu" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_time_dependent" ADD CONSTRAINT "__qmd_time_dependent_fk_id_tag_kind_qmd_time_5jynlam4no" FOREIGN KEY ("id", "__tag_kind_qmd_time_dependent_kcomlfhb7l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_time_dependent" ADD CONSTRAINT "__qmd_time_dependent_fk_id_qti_metadata_ve4pocydcn" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_name" ADD CONSTRAINT "__qmd_tool_name_fk_id_tag_kind_qmd_tool_name_27_erzxutcz6a" FOREIGN KEY ("id", "__tag_kind_qmd_tool_name_27iaqneif4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_name" ADD CONSTRAINT "__qmd_tool_name_fk_id_qti_metadata_5nme7u6a3p" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_vendor" ADD CONSTRAINT "__qmd_tool_vendor_fk_id_tag_kind_qmd_tool_vendor_q_5_dwa53iimkv" FOREIGN KEY ("id", "__tag_kind_qmd_tool_vendor_q5oz7iuy5a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_vendor" ADD CONSTRAINT "__qmd_tool_vendor_fk_id_qti_metadata_b3kcfvtqeh" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_version" ADD CONSTRAINT "__qmd_tool_version_fk_id_tag_kind_qmd_tool_version_gwzwtlwzze" FOREIGN KEY ("id", "__tag_kind_qmd_tool_version_pnqrau5xa6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qmd_tool_version" ADD CONSTRAINT "__qmd_tool_version_fk_id_qti_metadata_5qhf4jnj4e" FOREIGN KEY ("id", "qti_metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_label" ADD CONSTRAINT "__qti_label_fk_id_tag_kind_qti_label_li_3_rglggnp_ulbdkjdcy6" FOREIGN KEY ("id", "__tag_kind_qti_label_li3rglggnp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata" ADD CONSTRAINT "__qti_metadata_fk_id_tag_kind_qmd_qti_metadata_x_6_6z2za3iios" FOREIGN KEY ("id", "__tag_kind_qmd_qti_metadata_x6anaifca7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_tag_host_5nxw2e6ygd" FOREIGN KEY ("id", "__tag_host_external_lom_zuf64srpbg") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_lom_r3vzadspmn" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_package_45ujtyda4c" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_lom_package_iml635ey3w" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."external_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_tag_host_metadata_st4rwzhkuc" FOREIGN KEY ("id", "__tag_host_metadata_knpb2q2kry") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_metadata_amwofuqajo" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_package_resource_wjxdq6kefq" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_metadata_resource_node_j5b44sxf4o" FOREIGN KEY ("metadata", "resource_node") REFERENCES "qti"."resource_metadata" ("id", "resource");

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_resource_node_package_bwtvi3p7ra" FOREIGN KEY ("resource_node", "package", "resource") REFERENCES "qti"."resource" ("id", "package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_tag_host_pymrpdifeo" FOREIGN KEY ("id", "__tag_host_resource_lom_vu3w7ocz2u") REFERENCES "qti"."qti_metadata" ("id", "host") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_lom_66wahx7d6l" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_package_gmcsikj4sm" FOREIGN KEY ("id", "package", "resource") REFERENCES "qti"."qti_metadata" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_lom_package_56adstemff" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random" ADD CONSTRAINT "__random_fk_id_y6bzpmjkno" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random" ADD CONSTRAINT "__random_fk_id_tag_kind_qti_random_erxmfosfti_z3obv6o7r4" FOREIGN KEY ("id", "__tag_kind_qti_random_erxmfosfti") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_float" ADD CONSTRAINT "__random_float_fk_id_u2zitqvmnl" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_float" ADD CONSTRAINT "__random_float_fk_id_tag_kind_qti_random_float_y_4_p_5gxzghh6jx" FOREIGN KEY ("id", "__tag_kind_qti_random_float_y4p3lnm6a4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_float_min" ADD CONSTRAINT "__random_float_min_fk_node_4obkovkwuc" FOREIGN KEY ("node") REFERENCES "qti"."random_float" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer" ADD CONSTRAINT "__random_integer_fk_id_puarvo7zql" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer" ADD CONSTRAINT "__random_integer_fk_id_tag_kind_qti_random_integer_hyj5nu26iy" FOREIGN KEY ("id", "__tag_kind_qti_random_integer_rbwxdayyl2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer_min" ADD CONSTRAINT "__random_integer_min_fk_node_p4wuno4r2v" FOREIGN KEY ("node") REFERENCES "qti"."random_integer" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."random_integer_step" ADD CONSTRAINT "__random_integer_step_fk_node_varwgz7e24" FOREIGN KEY ("node") REFERENCES "qti"."random_integer" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rb" ADD CONSTRAINT "__rb_fk_id_tag_kind_rb_e_2_k_522_kmfe_fqnesymrij" FOREIGN KEY ("id", "__tag_kind_rb_e2k522kmfe") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_binding" ADD CONSTRAINT "__record_binding_fk_interaction_kind_lxuzwecsd5" FOREIGN KEY ("interaction_kind") REFERENCES "qti"."record_binding_fit" ("interaction_kind");

ALTER TABLE "qti"."record_binding" ADD CONSTRAINT "__record_binding_fk_node_tag_shape_record_qozhrcs_4_3ry2ahdbqe" FOREIGN KEY ("node", "__tag_shape_record_qozhrcs4ym") REFERENCES "qti"."interaction_binding" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_declaration" ADD CONSTRAINT "__record_declaration_fk_id_tag_shape_record_oogx_67_xesz66xh77" FOREIGN KEY ("id", "__tag_shape_record_oogx67q33t") REFERENCES "qti"."declaration" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_field" ADD CONSTRAINT "__record_field_fk_id_tag_shape_record_3_rfzi_5_mgny_ubwuszlite" FOREIGN KEY ("id", "__tag_shape_record_3rfzi5mgny") REFERENCES "qti"."declared_value" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_value_set" ADD CONSTRAINT "__record_value_set_fk_id_tag_shape_record_lavxfyvieb_qortsgqn3b" FOREIGN KEY ("id", "__tag_shape_record_lavxfyvieb") REFERENCES "qti"."value_set" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."repeat" ADD CONSTRAINT "__repeat_fk_id_chy7zjngpv" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."repeat" ADD CONSTRAINT "__repeat_fk_id_tag_kind_qti_repeat_bpcaeiu_7_tm_paitvwlydr" FOREIGN KEY ("id", "__tag_kind_qti_repeat_bpcaeiu7tm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."repeat_number_repeats_ref" ADD CONSTRAINT "__repeat_number_repeats_ref_fk_node_tag_number_lemraeidse" FOREIGN KEY ("node", "__tag_number_repeats_kind_ref_juikk35ua4") REFERENCES "qti"."repeat" ("id", "number_repeats_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_id_tag_kind_cp_resource_42_ghp_3_dst_6_w3frun75ds" FOREIGN KEY ("id", "__tag_kind_cp_resource_42ghp3dst6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_id_package_lgzh24zzew" FOREIGN KEY ("id", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_package_ibohlw6rop" FOREIGN KEY ("package") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_package_identifier_ge3jkv3anv" FOREIGN KEY ("package", "identifier") REFERENCES "qti"."manifest_id_of_resource" ("package", "id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_package_version_cq22wjnaos" FOREIGN KEY ("package", "version") REFERENCES "qti"."package" ("id", "schemaversion") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource" ADD CONSTRAINT "__resource_fk_version_type_t5numxxnax" FOREIGN KEY ("version", "type") REFERENCES "qti"."resource_type_of" ("version", "type");

ALTER TABLE "qti"."resource_href" ADD CONSTRAINT "__resource_href_fk_resource_package_2n5d27l5ex" FOREIGN KEY ("resource", "package") REFERENCES "qti"."resource" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_tag_owner_resource_r_2_xv_4_ps3p3dlhni" FOREIGN KEY ("lom", "__tag_owner_resource_r2xv4rjzei") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_metadata_tstiovefp3" FOREIGN KEY ("lom", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_package_axqj54t764" FOREIGN KEY ("lom", "package") REFERENCES "qti"."lom" ("id", "package") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_package_z2mqb4ohk3" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_metadata_tag_kind_cp_metadata_ldfoygvkhx" FOREIGN KEY ("metadata", "__tag_kind_cp_metadata_resource_scp7neoqwd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_package_resource_type_cfijxypydp" FOREIGN KEY ("package", "resource", "type") REFERENCES "qti"."resource" ("package", "identifier", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_general" ADD CONSTRAINT "__resource_lom_general_fk_lom_fsj2jpxvxw" FOREIGN KEY ("lom") REFERENCES "qti"."lom_general" ("lom") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_general" ADD CONSTRAINT "__resource_lom_general_fk_lom_package_resource_xkjtdlbhgo" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_identified" ADD CONSTRAINT "__resource_lom_identified_fk_lom_package_resource_zy2pnxrsq6" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom" ("lom", "package", "resource", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_language_set" ADD CONSTRAINT "__resource_lom_language_set_fk_lom_package_resource_outjuw2j4n" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_titled" ADD CONSTRAINT "__resource_lom_titled_fk_lom_package_resource_type_j6w2vbwkpm" FOREIGN KEY ("lom", "package", "resource", "type") REFERENCES "qti"."resource_lom" ("lom", "package", "resource", "type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_fk_id_tag_kind_cp_metadata_knszm4kknw" FOREIGN KEY ("id", "__tag_kind_cp_metadata_resource_scp7neoqwd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_fk_id_resource_w5ujkigusd" FOREIGN KEY ("id", "resource") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_metadata" ADD CONSTRAINT "__resource_metadata_fk_resource_3dfpd32tkn" FOREIGN KEY ("resource") REFERENCES "qti"."resource" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resources" ADD CONSTRAINT "__resources_fk_id_tag_kind_cp_resources_vfmef_7_qkml_zg6bbsyilf" FOREIGN KEY ("id", "__tag_kind_cp_resources_vfmef7qkml") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resources" ADD CONSTRAINT "__resources_fk_id_manifest_7jnjdqsavb" FOREIGN KEY ("id", "manifest") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resources" ADD CONSTRAINT "__resources_fk_manifest_2czsykboj3" FOREIGN KEY ("manifest") REFERENCES "qti"."package" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_condition_arm" ADD CONSTRAINT "__response_condition_arm_fk_id_cqennxujn3" FOREIGN KEY ("id") REFERENCES "qti"."response_if_arm" ("condition") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_condition_arm" ADD CONSTRAINT "__response_condition_arm_fk_id_tag_kind_qti_response_arfysdid6d" FOREIGN KEY ("id", "__tag_kind_qti_response_condition_gplnrgu2ol") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_arm" ADD CONSTRAINT "__response_declaration_arm_fk_id_tag_kind_qti_f4xiuadvs7" FOREIGN KEY ("id", "__tag_kind_qti_response_declaration_mnirjlf2bs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_arm" ADD CONSTRAINT "__response_declaration_arm_fk_id_tag_kind_response_h_3liyki26gd" FOREIGN KEY ("id", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_id" ADD CONSTRAINT "__response_declaration_id_fk_document_id_tag_holder_i4txfimhl4" FOREIGN KEY ("document", "id", "__tag_holder_response_declaration_bgk6jyj7am") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_declaration_id" ADD CONSTRAINT "__response_declaration_id_fk_node_document_id_tag_4wjysgnaca" FOREIGN KEY ("node", "document", "id", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("id", "document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_arm" ADD CONSTRAINT "__response_else_arm_fk_id_tag_kind_qti_response_else_pw5zdqtyat" FOREIGN KEY ("id", "__tag_kind_qti_response_else_hxjbbfwd4n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_arm" ADD CONSTRAINT "__response_else_arm_fk_id_condition_6rv4ogvmus" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_if_arm" ADD CONSTRAINT "__response_else_if_arm_fk_id_x4wstscymw" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_else_if_arm" ADD CONSTRAINT "__response_else_if_arm_fk_id_tag_kind_qti_response_7xqxxbwsg3" FOREIGN KEY ("id", "__tag_kind_qti_response_else_if_z5u6rg462x") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_condition_qwwjbbttwd" FOREIGN KEY ("condition") REFERENCES "qti"."response_condition_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_id_dwfoomqo67" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_id_tag_kind_qti_response_if_vi_nkmvms4df5" FOREIGN KEY ("id", "__tag_kind_qti_response_if_vi7uxgsitt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_if_arm" ADD CONSTRAINT "__response_if_arm_fk_id_condition_zwk5nyeyvf" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing" ADD CONSTRAINT "__response_processing_fk_id_tag_kind_qti_response_qon4wlz6ge" FOREIGN KEY ("id", "__tag_kind_qti_response_processing_w7uh2je46r") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing" ADD CONSTRAINT "__response_processing_fk_id_root_kind_5ongdtogaj" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_fragment" ADD CONSTRAINT "__response_processing_fragment_fk_id_tag_kind_qti_iz4amgqjhf" FOREIGN KEY ("id", "__tag_kind_qti_response_processing_fragment_ftcfl3v7ub") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_item" ADD CONSTRAINT "__response_processing_item_fk_id_tag_root_kind_item_nkqao7pvho" FOREIGN KEY ("id", "__tag_root_kind_item_od6jgyppue") REFERENCES "qti"."response_processing" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_item" ADD CONSTRAINT "__response_processing_item_fk_id_item_bsskbx5lby" FOREIGN KEY ("id", "item") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_item" ADD CONSTRAINT "__response_processing_item_fk_item_7c5mz5zc7w" FOREIGN KEY ("item") REFERENCES "qti"."assessment_item" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_template" ADD CONSTRAINT "__response_processing_template_fk_node_b45d5c65om" FOREIGN KEY ("node") REFERENCES "qti"."response_processing" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."response_processing_template_location" ADD CONSTRAINT "__response_processing_template_location_fk_node_jfjndrc6xk" FOREIGN KEY ("node") REFERENCES "qti"."response_processing" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round" ADD CONSTRAINT "__round_fk_id_f3qoxihsbv" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round" ADD CONSTRAINT "__round_fk_id_tag_kind_qti_round_5_eosswhdnh_slr33gqyno" FOREIGN KEY ("id", "__tag_kind_qti_round_5eosswhdnh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round_to" ADD CONSTRAINT "__round_to_fk_id_6bdnmlefbu" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round_to" ADD CONSTRAINT "__round_to_fk_id_tag_kind_qti_round_to_qrylojzgc_7_nrzxzwtn6v" FOREIGN KEY ("id", "__tag_kind_qti_round_to_qrylojzgc7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."round_to_figures_ref" ADD CONSTRAINT "__round_to_figures_ref_fk_node_tag_figures_kind_ref_3zjkoitfhf" FOREIGN KEY ("node", "__tag_figures_kind_ref_r6zofyzy4o") REFERENCES "qti"."round_to" ("id", "figures_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rp" ADD CONSTRAINT "__rp_fk_id_tag_kind_rp_tmr_6_b_4_giiz_t5ek3uxsmd" FOREIGN KEY ("id", "__tag_kind_rp_tmr6b4giiz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rt" ADD CONSTRAINT "__rt_fk_id_tag_kind_rt_l_6_ufwynexl_5oxispt44y" FOREIGN KEY ("id", "__tag_kind_rt_l6ufwynexl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rtc" ADD CONSTRAINT "__rtc_fk_id_tag_kind_rtc_2_t_3_ohmvv_2_y_ur5b2mx7xs" FOREIGN KEY ("id", "__tag_kind_rtc_2t3ohmvv2y") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_block" ADD CONSTRAINT "__rubric_block_fk_id_tag_kind_qti_rubric_block_vzconcc7uk" FOREIGN KEY ("id", "__tag_kind_qti_rubric_block_zyzsfdms3v") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_template_block" ADD CONSTRAINT "__rubric_template_block_fk_id_tag_kind_qti_template_7ndolb2xld" FOREIGN KEY ("id", "__tag_kind_qti_template_block_rubric_si2cxyuet3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_template_inline" ADD CONSTRAINT "__rubric_template_inline_fk_id_tag_kind_qti_template_xc64dw3wwd" FOREIGN KEY ("id", "__tag_kind_qti_template_inline_rubric_o5ok5velix") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ruby" ADD CONSTRAINT "__ruby_fk_id_tag_kind_ruby_hoq_7_dhdvio_bt5rpkcqpr" FOREIGN KEY ("id", "__tag_kind_ruby_hoq7dhdvio") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rule_operand" ADD CONSTRAINT "__rule_operand_fk_child_7esccijwzc" FOREIGN KEY ("child") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rule_operand" ADD CONSTRAINT "__rule_operand_fk_child_rule_position_5w6a3el2wz" FOREIGN KEY ("child", "rule", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rule_operand" ADD CONSTRAINT "__rule_operand_fk_rule_rule_kind_4l7dbb3x5o" FOREIGN KEY ("rule", "rule_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."samp" ADD CONSTRAINT "__samp_fk_id_tag_kind_samp_kjsz_6_s_7_ejv_uhke6sfco2" FOREIGN KEY ("id", "__tag_kind_samp_kjsz6s7ejv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."schema_location" ADD CONSTRAINT "__schema_location_fk_node_o4jcb2f2aj" FOREIGN KEY ("node") REFERENCES "qti"."node" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section" ADD CONSTRAINT "__section_fk_id_tag_kind_section_taqgypcfv_7_tnkgvp2pul" FOREIGN KEY ("id", "__tag_kind_section_taqgypcfv7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."select_point_interaction" ADD CONSTRAINT "__select_point_interaction_fk_id_tag_kind_qti_select_rrsr2mrulv" FOREIGN KEY ("id", "__tag_kind_qti_select_point_interaction_dmgh3tps3a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."select_point_interaction" ADD CONSTRAINT "__select_point_interaction_fk_id_root_kind_jhjlaz35f3" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_correct_response" ADD CONSTRAINT "__set_correct_response_fk_id_lgg56iessp" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_correct_response" ADD CONSTRAINT "__set_correct_response_fk_id_lplfp6sayy" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_correct_response" ADD CONSTRAINT "__set_correct_response_fk_id_tag_kind_qti_set_ol5qug2p33" FOREIGN KEY ("id", "__tag_kind_qti_set_correct_response_p4ucnvbenj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_default_value" ADD CONSTRAINT "__set_default_value_fk_id_olvhaapdis" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_default_value" ADD CONSTRAINT "__set_default_value_fk_id_asetqp7zu7" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_default_value" ADD CONSTRAINT "__set_default_value_fk_id_tag_kind_qti_set_default_hjxuscwbtz" FOREIGN KEY ("id", "__tag_kind_qti_set_default_value_rj2hosazj5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_outcome_value" ADD CONSTRAINT "__set_outcome_value_fk_id_pfrhyv46y7" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_outcome_value" ADD CONSTRAINT "__set_outcome_value_fk_id_bumawry4vz" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_outcome_value" ADD CONSTRAINT "__set_outcome_value_fk_id_tag_kind_qti_set_outcome_fdk4ivb536" FOREIGN KEY ("id", "__tag_kind_qti_set_outcome_value_h6wjpdpvko") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_template_value" ADD CONSTRAINT "__set_template_value_fk_id_tjdylovby7" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_template_value" ADD CONSTRAINT "__set_template_value_fk_id_tm6uzya2mc" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."set_template_value" ADD CONSTRAINT "__set_template_value_fk_id_tag_kind_qti_set_template_6gjtgeelfk" FOREIGN KEY ("id", "__tag_kind_qti_set_template_value_nb6cflrq6l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice" ADD CONSTRAINT "__simple_associable_choice_fk_id_tag_kind_qti_simple_452ikmtuv7" FOREIGN KEY ("id", "__tag_kind_qti_simple_associable_choice_dlcgsxx2bi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_fixed" ADD CONSTRAINT "__simple_associable_choice_fixed_fk_node_h2hu6v6g2o" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_min" ADD CONSTRAINT "__simple_associable_choice_match_min_fk_node_2rk7ky4nrv" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_match_set_qbdpqt2dce" FOREIGN KEY ("match_set") REFERENCES "qti"."simple_match_set" ("id");

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_match_set_v4f7bkkeqy" FOREIGN KEY ("match_set", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_node_x3eifhdjwu" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_node_rt5b7omadk" FOREIGN KEY ("node", "interaction") REFERENCES "qti"."simple_associable_choice" ("id", "interaction") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_node_match_4w56n4si2i" FOREIGN KEY ("node", "match_set") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_show_hide" ADD CONSTRAINT "__simple_associable_choice_show_hide_fk_node_svquyfwfx3" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_choice" ADD CONSTRAINT "__simple_choice_fk_id_tag_kind_qti_simple_choice_z_ylt3oa5b4p" FOREIGN KEY ("id", "__tag_kind_qti_simple_choice_z52ayjzccu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_choice" ADD CONSTRAINT "__simple_choice_fk_id_interaction_vf43rkjowe" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_choice_template_identifier" ADD CONSTRAINT "__simple_choice_template_identifier_fk_node_dtixe7cfvf" FOREIGN KEY ("node") REFERENCES "qti"."simple_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_match_set" ADD CONSTRAINT "__simple_match_set_fk_id_tag_kind_qti_simple_match_xtjgzju2ui" FOREIGN KEY ("id", "__tag_kind_qti_simple_match_set_bhwsbmwhks") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."slider_interaction" ADD CONSTRAINT "__slider_interaction_fk_id_tag_kind_qti_slider_ymgxryzxlq" FOREIGN KEY ("id", "__tag_kind_qti_slider_interaction_mqpv3dtt65") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."slider_interaction" ADD CONSTRAINT "__slider_interaction_fk_id_root_kind_6lgkoy3pae" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."slider_orientation" ADD CONSTRAINT "__slider_orientation_fk_node_ijgyvdu7mw" FOREIGN KEY ("node") REFERENCES "qti"."slider_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."slider_reverse" ADD CONSTRAINT "__slider_reverse_fk_node_mexyjqbdy4" FOREIGN KEY ("node") REFERENCES "qti"."slider_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."slider_step" ADD CONSTRAINT "__slider_step_fk_node_zjlef5qrbb" FOREIGN KEY ("node") REFERENCES "qti"."slider_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."small" ADD CONSTRAINT "__small_fk_id_tag_kind_small_gkltegn_7_kl_7u37ps2cty" FOREIGN KEY ("id", "__tag_kind_small_gkltegn7kl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."source" ADD CONSTRAINT "__source_fk_id_tag_kind_source_q_72_etxe_3_im_djkv3gisrh" FOREIGN KEY ("id", "__tag_kind_source_q72etxe3im") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."source" ADD CONSTRAINT "__source_fk_id_parent_kind_pk5mr3sixt" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."source_media" ADD CONSTRAINT "__source_media_fk_node_x26ov67kna" FOREIGN KEY ("node") REFERENCES "qti"."source" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."source_sizes" ADD CONSTRAINT "__source_sizes_fk_node_wrkidoxbxe" FOREIGN KEY ("node") REFERENCES "qti"."source" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."source_srcset" ADD CONSTRAINT "__source_srcset_fk_node_fuklzsrmud" FOREIGN KEY ("node") REFERENCES "qti"."source" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."source_type" ADD CONSTRAINT "__source_type_fk_node_mwmjxr4cqr" FOREIGN KEY ("node") REFERENCES "qti"."source" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."span" ADD CONSTRAINT "__span_fk_id_tag_kind_span_koacretyo_2_miuljlernp" FOREIGN KEY ("id", "__tag_kind_span_koacretyo2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."standard_template_reference" ADD CONSTRAINT "__standard_template_reference_fk_node_um7etzu6k3" FOREIGN KEY ("node") REFERENCES "qti"."response_processing_template" ("node") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic" ADD CONSTRAINT "__statistic_fk_id_usage_data_position_pmfnjsi4aj" FOREIGN KEY ("id", "usage_data", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic" ADD CONSTRAINT "__statistic_fk_usage_data_nwoajmad6i" FOREIGN KEY ("usage_data") REFERENCES "qti"."usage_data" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_case_count" ADD CONSTRAINT "__statistic_case_count_fk_node_pvxufr7h5c" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_glossary" ADD CONSTRAINT "__statistic_glossary_fk_node_7nzjz7ttzn" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_last_updated" ADD CONSTRAINT "__statistic_last_updated_fk_node_qrhiuxql3v" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_std_deviation" ADD CONSTRAINT "__statistic_std_deviation_fk_node_7zxcnqmijw" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."statistic_std_error" ADD CONSTRAINT "__statistic_std_error_fk_node_ku6rxsvhg2" FOREIGN KEY ("node") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stats_operator" ADD CONSTRAINT "__stats_operator_fk_id_y5rf4zqbhe" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stats_operator" ADD CONSTRAINT "__stats_operator_fk_id_tag_kind_qti_stats_operator_x_jzxwnal226" FOREIGN KEY ("id", "__tag_kind_qti_stats_operator_x5autjgscg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."string_binding" ADD CONSTRAINT "__string_binding_fk_document_identifier_tag_kind_byc4r5o2ko" FOREIGN KEY ("document", "identifier", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."string_binding" ADD CONSTRAINT "__string_binding_fk_node_document_fh7buc6gf7" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."string_match" ADD CONSTRAINT "__string_match_fk_id_jq2ajvyvkw" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."string_match" ADD CONSTRAINT "__string_match_fk_id_tag_kind_qti_string_match_ymwg_vcyzam6xca" FOREIGN KEY ("id", "__tag_kind_qti_string_match_ymwg654alj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."strong" ADD CONSTRAINT "__strong_fk_id_tag_kind_strong_gxhcapelxs_44mkc75d2j" FOREIGN KEY ("id", "__tag_kind_strong_gxhcapelxs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stylesheet" ADD CONSTRAINT "__stylesheet_fk_id_tag_kind_qti_stylesheet_krvjdq3phl" FOREIGN KEY ("id", "__tag_kind_qti_stylesheet_zrdvcrjdok") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stylesheet_media" ADD CONSTRAINT "__stylesheet_media_fk_node_x4cqiy6cth" FOREIGN KEY ("node") REFERENCES "qti"."stylesheet" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stylesheet_title" ADD CONSTRAINT "__stylesheet_title_fk_node_3u7nmxzfan" FOREIGN KEY ("node") REFERENCES "qti"."stylesheet" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sub" ADD CONSTRAINT "__sub_fk_id_tag_kind_sub_c_5_sixq_4_viw_wl2tysz6bk" FOREIGN KEY ("id", "__tag_kind_sub_c5sixq4viw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."substring" ADD CONSTRAINT "__substring_fk_id_ivk2bfevn6" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."substring" ADD CONSTRAINT "__substring_fk_id_tag_kind_qti_substring_j_2_vyby_2_rgl5brzppm" FOREIGN KEY ("id", "__tag_kind_qti_substring_j2vyby2o5h") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."subtract" ADD CONSTRAINT "__subtract_fk_id_nx6wnhe4si" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."subtract" ADD CONSTRAINT "__subtract_fk_id_tag_kind_qti_subtract_fn_3_f_5_ctuvkqaktb" FOREIGN KEY ("id", "__tag_kind_qti_subtract_fn3f5wibuj") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sum" ADD CONSTRAINT "__sum_fk_id_rx5nfmiks4" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sum" ADD CONSTRAINT "__sum_fk_id_tag_kind_qti_sum_2_bm_2_f_65_vor_oavvrxntuo" FOREIGN KEY ("id", "__tag_kind_qti_sum_2bm2f65vor") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."summary" ADD CONSTRAINT "__summary_fk_id_tag_kind_summary_4_tcbjxb_4_su_olb3anislw" FOREIGN KEY ("id", "__tag_kind_summary_4tcbjxb4su") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sup" ADD CONSTRAINT "__sup_fk_id_tag_kind_sup_drhon_2_pewx_z263wykbub" FOREIGN KEY ("id", "__tag_kind_sup_drhon2pewx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."table" ADD CONSTRAINT "__table_fk_id_tag_kind_table_o_2_mr_32_dc_7_l_qlzuskyyne" FOREIGN KEY ("id", "__tag_kind_table_o2mr32dc7l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."table_summary" ADD CONSTRAINT "__table_summary_fk_node_ptu5r55ujz" FOREIGN KEY ("node") REFERENCES "qti"."table" ("id");

ALTER TABLE "qti"."target_object" ADD CONSTRAINT "__target_object_fk_id_tag_kind_ud_target_object_x_2_arc7hkfmij" FOREIGN KEY ("id", "__tag_kind_ud_target_object_x2bagozuf2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object" ADD CONSTRAINT "__target_object_fk_id_statistic_position_vyq6q4dl7z" FOREIGN KEY ("id", "statistic", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object" ADD CONSTRAINT "__target_object_fk_statistic_ydn64n4rjx" FOREIGN KEY ("statistic") REFERENCES "qti"."statistic" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object_object_type" ADD CONSTRAINT "__target_object_object_type_fk_node_whzj65dcmc" FOREIGN KEY ("node") REFERENCES "qti"."target_object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."target_object_part_identifier" ADD CONSTRAINT "__target_object_part_identifier_fk_node_jtw7qkfdkl" FOREIGN KEY ("node") REFERENCES "qti"."target_object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tbody" ADD CONSTRAINT "__tbody_fk_id_tag_kind_tbody_vnwspgbjg_3_dqsosju3jg" FOREIGN KEY ("id", "__tag_kind_tbody_vnwspgbjg3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."td" ADD CONSTRAINT "__td_fk_id_tag_kind_td_uvejqfmwgi_wi5ykemn3k" FOREIGN KEY ("id", "__tag_kind_td_uvejqfmwgi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."td_abbr" ADD CONSTRAINT "__td_abbr_fk_node_jecionj5kj" FOREIGN KEY ("node") REFERENCES "qti"."td" ("id");

ALTER TABLE "qti"."td_align" ADD CONSTRAINT "__td_align_fk_node_nemz6og4ph" FOREIGN KEY ("node") REFERENCES "qti"."td" ("id");

ALTER TABLE "qti"."td_axis" ADD CONSTRAINT "__td_axis_fk_node_kfrzs7ay4j" FOREIGN KEY ("node") REFERENCES "qti"."td" ("id");

ALTER TABLE "qti"."td_colspan" ADD CONSTRAINT "__td_colspan_fk_node_xfndtecjfs" FOREIGN KEY ("node") REFERENCES "qti"."td" ("id");

ALTER TABLE "qti"."td_rowspan" ADD CONSTRAINT "__td_rowspan_fk_node_4hqcdupkjc" FOREIGN KEY ("node") REFERENCES "qti"."td" ("id");

ALTER TABLE "qti"."td_scope" ADD CONSTRAINT "__td_scope_fk_node_4tkjrnxpjj" FOREIGN KEY ("node") REFERENCES "qti"."td" ("id");

ALTER TABLE "qti"."td_valign" ADD CONSTRAINT "__td_valign_fk_node_5vg6crqftn" FOREIGN KEY ("node") REFERENCES "qti"."td" ("id");

ALTER TABLE "qti"."template" ADD CONSTRAINT "__template_fk_id_tag_kind_template_gzmskje_5_fk_ryvimurum7" FOREIGN KEY ("id", "__tag_kind_template_gzmskje5fk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_block" ADD CONSTRAINT "__template_block_fk_id_tag_kind_qti_template_block_742oiuyjx3" FOREIGN KEY ("id", "__tag_kind_qti_template_block_vu6txxof7s") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_condition_arm" ADD CONSTRAINT "__template_condition_arm_fk_id_z5j4vsryhz" FOREIGN KEY ("id") REFERENCES "qti"."template_if_arm" ("condition") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_condition_arm" ADD CONSTRAINT "__template_condition_arm_fk_id_tag_kind_qti_template_arzqxp5ipa" FOREIGN KEY ("id", "__tag_kind_qti_template_condition_5iedsmf35c") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_constraint" ADD CONSTRAINT "__template_constraint_fk_id_r6c7e632cr" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_constraint" ADD CONSTRAINT "__template_constraint_fk_id_tag_kind_qti_template_tjfrdq7dlv" FOREIGN KEY ("id", "__tag_kind_qti_template_constraint_nwjpfefvxc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_content_ref" ADD CONSTRAINT "__template_content_ref_fk_document_identifier_tag_pqdzt3m4ah" FOREIGN KEY ("document", "identifier", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_content_ref" ADD CONSTRAINT "__template_content_ref_fk_document_identifier_base_fauuwbhust" FOREIGN KEY ("document", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_content_ref" ADD CONSTRAINT "__template_content_ref_fk_node_document_5ogkf5dax5" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_declaration_arm" ADD CONSTRAINT "__template_declaration_arm_fk_id_tag_kind_qti_7xly7smluk" FOREIGN KEY ("id", "__tag_kind_qti_template_declaration_kfzjha6iro") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_declaration_arm" ADD CONSTRAINT "__template_declaration_arm_fk_id_tag_kind_template_6_oi2ijzf4ae" FOREIGN KEY ("id", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_arm" ADD CONSTRAINT "__template_else_arm_fk_id_tag_kind_qti_template_else_jakvytlxkn" FOREIGN KEY ("id", "__tag_kind_qti_template_else_td6wimhp7s") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_arm" ADD CONSTRAINT "__template_else_arm_fk_id_condition_luyzxske2m" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_if_arm" ADD CONSTRAINT "__template_else_if_arm_fk_id_hmxk5riuwv" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_else_if_arm" ADD CONSTRAINT "__template_else_if_arm_fk_id_tag_kind_qti_template_r2fxuxzf72" FOREIGN KEY ("id", "__tag_kind_qti_template_else_if_xkgqxjlgvf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_feedback_block" ADD CONSTRAINT "__template_feedback_block_fk_id_tag_kind_qti_i3ukwhqmkc" FOREIGN KEY ("id", "__tag_kind_qti_feedback_block_template_koyzwlsapg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_condition_4y7sbcvmtj" FOREIGN KEY ("condition") REFERENCES "qti"."template_condition_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_id_gmp35rspej" FOREIGN KEY ("id") REFERENCES "qti"."rule_operand" ("rule") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_id_tag_kind_qti_template_if_kdp_cqqvjgrgzg" FOREIGN KEY ("id", "__tag_kind_qti_template_if_kdp2hjyxni") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_if_arm" ADD CONSTRAINT "__template_if_arm_fk_id_condition_q36sv5r4ug" FOREIGN KEY ("id", "condition") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_inline" ADD CONSTRAINT "__template_inline_fk_id_tag_kind_qti_template_inline_ay5hjhse3h" FOREIGN KEY ("id", "__tag_kind_qti_template_inline_zkyrmcpqzq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_tag_kind_template_4useummycx" FOREIGN KEY ("id", "__tag_kind_template_parameter_izkfu4qd5a") REFERENCES "qti"."variable_ref" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_document_gw45ohjvze" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_referrer_kind_efehhyeyf6" FOREIGN KEY ("id", "referrer_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_parameter_ref" ADD CONSTRAINT "__template_parameter_ref_fk_id_root_kind_u3na5yshqe" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_processing" ADD CONSTRAINT "__template_processing_fk_id_tag_kind_qti_template_ugnev7dg4d" FOREIGN KEY ("id", "__tag_kind_qti_template_processing_julsyuopii") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_processing" ADD CONSTRAINT "__template_processing_fk_id_item_7fu36bhszp" FOREIGN KEY ("id", "item") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_processing" ADD CONSTRAINT "__template_processing_fk_item_b6ae2itijo" FOREIGN KEY ("item") REFERENCES "qti"."assessment_item" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_variables" ADD CONSTRAINT "__test_variables_fk_id_e6yrgko5ch" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_variables" ADD CONSTRAINT "__test_variables_fk_id_tag_kind_qti_test_variables_5pron4hsut" FOREIGN KEY ("id", "__tag_kind_qti_test_variables_ssteaad3nd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."test_variables_base_type" ADD CONSTRAINT "__test_variables_base_type_fk_node_viobp7iox3" FOREIGN KEY ("node") REFERENCES "qti"."test_variables" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_expected_length" ADD CONSTRAINT "__text_entry_expected_length_fk_node_a2gmbouglv" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_format" ADD CONSTRAINT "__text_entry_format_fk_node_b7lvzp2pdg" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_interaction" ADD CONSTRAINT "__text_entry_interaction_fk_id_tag_kind_qti_text_6v7aku2pmn" FOREIGN KEY ("id", "__tag_kind_qti_text_entry_interaction_qjak2y2y6n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_interaction" ADD CONSTRAINT "__text_entry_interaction_fk_id_root_kind_raez4v5ile" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_pattern_mask" ADD CONSTRAINT "__text_entry_pattern_mask_fk_node_hz5tzx5zrs" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_patternmask_message" ADD CONSTRAINT "__text_entry_patternmask_message_fk_node_xl5bre6fww" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_placeholder_text" ADD CONSTRAINT "__text_entry_placeholder_text_fk_node_244qxgyp4t" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_node" ADD CONSTRAINT "__text_node_fk_id_tag_kind_text_vrxl_6_g_2_xzn_i325irtyx3" FOREIGN KEY ("id", "__tag_kind_text_vrxl6g2xzn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tfoot" ADD CONSTRAINT "__tfoot_fk_id_tag_kind_tfoot_ryniejmgnp_fjklh3g7jl" FOREIGN KEY ("id", "__tag_kind_tfoot_ryniejmgnp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."th" ADD CONSTRAINT "__th_fk_id_tag_kind_th_obdxlz_7_qfe_lcfmzu6pkz" FOREIGN KEY ("id", "__tag_kind_th_obdxlz7qfe") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."th_abbr" ADD CONSTRAINT "__th_abbr_fk_node_xnjmxvmorh" FOREIGN KEY ("node") REFERENCES "qti"."th" ("id");

ALTER TABLE "qti"."th_align" ADD CONSTRAINT "__th_align_fk_node_fgzmxnoorx" FOREIGN KEY ("node") REFERENCES "qti"."th" ("id");

ALTER TABLE "qti"."th_axis" ADD CONSTRAINT "__th_axis_fk_node_j4s75bozxd" FOREIGN KEY ("node") REFERENCES "qti"."th" ("id");

ALTER TABLE "qti"."th_colspan" ADD CONSTRAINT "__th_colspan_fk_node_e2mpnqmevh" FOREIGN KEY ("node") REFERENCES "qti"."th" ("id");

ALTER TABLE "qti"."th_rowspan" ADD CONSTRAINT "__th_rowspan_fk_node_ky5ymfle6m" FOREIGN KEY ("node") REFERENCES "qti"."th" ("id");

ALTER TABLE "qti"."th_scope" ADD CONSTRAINT "__th_scope_fk_node_67hk7l7mhe" FOREIGN KEY ("node") REFERENCES "qti"."th" ("id");

ALTER TABLE "qti"."th_valign" ADD CONSTRAINT "__th_valign_fk_node_tlrdvgudn2" FOREIGN KEY ("node") REFERENCES "qti"."th" ("id");

ALTER TABLE "qti"."thead" ADD CONSTRAINT "__thead_fk_id_tag_kind_thead_qzvxye_75_oy_42mmpsnrlj" FOREIGN KEY ("id", "__tag_kind_thead_qzvxye75oy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tr" ADD CONSTRAINT "__tr_fk_id_tag_kind_tr_uhvfuvx_5_js_aosv37e5hs" FOREIGN KEY ("id", "__tag_kind_tr_uhvfuvx5js") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."track" ADD CONSTRAINT "__track_fk_id_tag_kind_track_7_rs_2_xjagel_7md27iwjiw" FOREIGN KEY ("id", "__tag_kind_track_7rs2xjagel") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."track_default" ADD CONSTRAINT "__track_default_fk_node_version_6jcknduqqr" FOREIGN KEY ("node", "version") REFERENCES "qti"."node" ("id", "version") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."track_srclang" ADD CONSTRAINT "__track_srclang_fk_node_fsf3mxypyl" FOREIGN KEY ("node") REFERENCES "qti"."track" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree" ADD CONSTRAINT "__tree_fk_id_ifxa72pndo" FOREIGN KEY ("id") REFERENCES "qti"."tree_root" ("tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_doctype" ADD CONSTRAINT "__tree_doctype_fk_tree_js3v4oc2mb" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_export_charset" ADD CONSTRAINT "__tree_export_charset_fk_tree_6nskdfos2j" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_misc" ADD CONSTRAINT "__tree_misc_fk_tree_7layckvwjj" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_fk_node_tree_tag_ancestry_root_7_7simyjgiqk" FOREIGN KEY ("node", "tree", "__tag_ancestry_root_7ltbltwcre") REFERENCES "qti"."node" ("id", "tree", "ancestry") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_root" ADD CONSTRAINT "__tree_root_fk_tree_f56cdfpty2" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_xml_encoding" ADD CONSTRAINT "__tree_xml_encoding_fk_tree_7h2ox5njoy" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_xml_standalone" ADD CONSTRAINT "__tree_xml_standalone_fk_tree_7jbo3bffyy" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tree_xml_version" ADD CONSTRAINT "__tree_xml_version_fk_tree_jew3d6jxfx" FOREIGN KEY ("tree") REFERENCES "qti"."tree" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."truncate" ADD CONSTRAINT "__truncate_fk_id_7pvxp2mxsf" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."truncate" ADD CONSTRAINT "__truncate_fk_id_tag_kind_qti_truncate_vkai_3_xtk_23_ain5obud4q" FOREIGN KEY ("id", "__tag_kind_qti_truncate_vkai3xtk23") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tt" ADD CONSTRAINT "__tt_fk_id_tag_kind_tt_etz_3_iybkyw_k5n7k5bnfy" FOREIGN KEY ("id", "__tag_kind_tt_etz3iybkyw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_fk_document_response_identifier_base_5ucjatxedk" FOREIGN KEY ("document", "response_identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_fk_interaction_kind_base_type_bblgyhj6xh" FOREIGN KEY ("interaction_kind", "base_type", "cardinality") REFERENCES "qti"."binding_fit" ("interaction_kind", "base_type", "cardinality");

ALTER TABLE "qti"."typed_binding" ADD CONSTRAINT "__typed_binding_fk_node_tag_shape_typed_gdmqmo_4_yqk_2bdrcbrgzj" FOREIGN KEY ("node", "__tag_shape_typed_gdmqmo4yqk") REFERENCES "qti"."interaction_binding" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_fk_id_tag_shape_typed_qnenjfvgbj_e6j6tjzg52" FOREIGN KEY ("id", "__tag_shape_typed_qnenjfvgbj") REFERENCES "qti"."declaration" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_fk_id_document_identifier_6d4fics7jb" FOREIGN KEY ("id", "document", "identifier") REFERENCES "qti"."declaration" ("id", "document", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_fk_id_kind_wxilruvjz2" FOREIGN KEY ("id", "kind") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_value_set" ADD CONSTRAINT "__typed_value_set_fk_declaration_base_type_yxpne76buw" FOREIGN KEY ("declaration", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("id", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_value_set" ADD CONSTRAINT "__typed_value_set_fk_id_tag_shape_typed_atyt_4_o_6_gfidjsnbow" FOREIGN KEY ("id", "__tag_shape_typed_atyt4o6rfl") REFERENCES "qti"."value_set" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_value_set" ADD CONSTRAINT "__typed_value_set_fk_id_declaration_wjla6dmxga" FOREIGN KEY ("id", "declaration") REFERENCES "qti"."value_set" ("id", "declaration") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ul" ADD CONSTRAINT "__ul_fk_id_tag_kind_ul_n_7_u_7_vjrkov_dbve75m45d" FOREIGN KEY ("id", "__tag_kind_ul_n7u7vjrkov") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."upload_interaction" ADD CONSTRAINT "__upload_interaction_fk_id_tag_kind_qti_upload_n7tncgnpn3" FOREIGN KEY ("id", "__tag_kind_qti_upload_interaction_cjum6engod") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."upload_interaction" ADD CONSTRAINT "__upload_interaction_fk_id_root_kind_jxw57ybghm" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."upload_type" ADD CONSTRAINT "__upload_type_fk_node_xwkscxadrh" FOREIGN KEY ("node") REFERENCES "qti"."upload_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_document_tag_root_usagedata_kjac_3_3yy4v3yjfw" FOREIGN KEY ("document", "__tag_root_usagedata_kjac3nie2g") REFERENCES "qti"."document" ("id", "root") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_id_tag_kind_ud_usage_data_xzkq_4_mlglt3k4yv" FOREIGN KEY ("id", "__tag_kind_ud_usage_data_xzkq4jszsr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_data" ADD CONSTRAINT "__usage_data_fk_id_document_twpu2pvfe2" FOREIGN KEY ("id", "document") REFERENCES "qti"."tree_root" ("node", "tree");

ALTER TABLE "qti"."usage_data_glossary" ADD CONSTRAINT "__usage_data_glossary_fk_node_j7hz4j2c25" FOREIGN KEY ("node") REFERENCES "qti"."usage_data" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry" ADD CONSTRAINT "__usage_map_entry_fk_id_tag_kind_ud_map_entry_e_3_so_fnhcgcwa2p" FOREIGN KEY ("id", "__tag_kind_ud_map_entry_e3so66labc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry" ADD CONSTRAINT "__usage_map_entry_fk_id_mapping_position_pi57v4cipv" FOREIGN KEY ("id", "mapping", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry" ADD CONSTRAINT "__usage_map_entry_fk_mapping_lptlqa5gyp" FOREIGN KEY ("mapping") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_map_entry_case_sensitive" ADD CONSTRAINT "__usage_map_entry_case_sensitive_fk_node_a7var5u5qn" FOREIGN KEY ("node") REFERENCES "qti"."usage_map_entry" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping" ADD CONSTRAINT "__usage_mapping_fk_id_tag_kind_ud_mapping_nl_4_jppxeru7v7" FOREIGN KEY ("id", "__tag_kind_ud_mapping_nl4fsdrhrc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping" ADD CONSTRAINT "__usage_mapping_fk_id_statistic_gtwrdya3qz" FOREIGN KEY ("id", "statistic") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping_lower_bound" ADD CONSTRAINT "__usage_mapping_lower_bound_fk_node_3itc26e3f5" FOREIGN KEY ("node") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_mapping_upper_bound" ADD CONSTRAINT "__usage_mapping_upper_bound_fk_node_ldmos5mii4" FOREIGN KEY ("node") REFERENCES "qti"."usage_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value" ADD CONSTRAINT "__usage_typed_value_fk_id_uu2uyhgqsy" FOREIGN KEY ("id") REFERENCES "qti"."usage_value_base_type" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value" ADD CONSTRAINT "__usage_typed_value_fk_id_base_type_zuxw6by5wn" FOREIGN KEY ("id", "base_type") REFERENCES "qti"."usage_value_base_type" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value" ADD CONSTRAINT "__usage_typed_value_fk_id_value_tr2d2dqibn" FOREIGN KEY ("id", "value") REFERENCES "qti"."usage_value" ("id", "value") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_boolean" ADD CONSTRAINT "__usage_typed_value_boolean_fk_id_tag_base_type_tqwdn5p2wh" FOREIGN KEY ("id", "__tag_base_type_boolean_spkprt4ifj") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_directed_pair" ADD CONSTRAINT "__usage_typed_value_directed_pair_fk_id_tag_base_bchux5z64z" FOREIGN KEY ("id", "__tag_base_type_directed_pair_6ydufsu7xt") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_duration" ADD CONSTRAINT "__usage_typed_value_duration_fk_id_tag_base_type_rzbhw32hn5" FOREIGN KEY ("id", "__tag_base_type_duration_74urvab32r") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_file" ADD CONSTRAINT "__usage_typed_value_file_fk_id_tag_base_type_file_v_xfjvrhb7ri" FOREIGN KEY ("id", "__tag_base_type_file_v6agbrnksv") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_float" ADD CONSTRAINT "__usage_typed_value_float_fk_id_tag_base_type_float_emezkpqu56" FOREIGN KEY ("id", "__tag_base_type_float_vh6x7mgon6") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_identifier" ADD CONSTRAINT "__usage_typed_value_identifier_fk_id_tag_base_type_6fq5ir4ajo" FOREIGN KEY ("id", "__tag_base_type_identifier_6sg34ylgx7") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_integer" ADD CONSTRAINT "__usage_typed_value_integer_fk_id_tag_base_type_b2r4e3dhf4" FOREIGN KEY ("id", "__tag_base_type_integer_yiuetnhqbm") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_pair" ADD CONSTRAINT "__usage_typed_value_pair_fk_id_tag_base_type_pair_h_uaze3kxylj" FOREIGN KEY ("id", "__tag_base_type_pair_h5mswwpdzq") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_point" ADD CONSTRAINT "__usage_typed_value_point_fk_id_tag_base_type_point_3omhonedtf" FOREIGN KEY ("id", "__tag_base_type_point_whzxkpcubn") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_string" ADD CONSTRAINT "__usage_typed_value_string_fk_id_tag_base_type_knofdg2zac" FOREIGN KEY ("id", "__tag_base_type_string_ufr3c7ewnb") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_typed_value_uri" ADD CONSTRAINT "__usage_typed_value_uri_fk_id_tag_base_type_uri_4_qsesxo5oey" FOREIGN KEY ("id", "__tag_base_type_uri_4pugbs6w66") REFERENCES "qti"."usage_typed_value" ("id", "base_type") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value" ADD CONSTRAINT "__usage_value_fk_id_tag_kind_ud_value_7_zu_72_u_4_s_4hinav4ri5" FOREIGN KEY ("id", "__tag_kind_ud_value_7zu72u4s4m") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value" ADD CONSTRAINT "__usage_value_fk_id_statistic_a4hdimdyxe" FOREIGN KEY ("id", "statistic") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value_base_type" ADD CONSTRAINT "__usage_value_base_type_fk_id_y5x74dm56h" FOREIGN KEY ("id") REFERENCES "qti"."usage_typed_value" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value_base_type" ADD CONSTRAINT "__usage_value_base_type_fk_id_hev5rwn234" FOREIGN KEY ("id") REFERENCES "qti"."usage_value" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."usage_value_field_identifier" ADD CONSTRAINT "__usage_value_field_identifier_fk_id_eew5qxaz6q" FOREIGN KEY ("id") REFERENCES "qti"."usage_value" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."value_set" ADD CONSTRAINT "__value_set_fk_declaration_shape_hldjke3uzi" FOREIGN KEY ("declaration", "shape") REFERENCES "qti"."declaration" ("id", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."value_set" ADD CONSTRAINT "__value_set_fk_id_declaration_5nufpikaia" FOREIGN KEY ("id", "declaration") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."value_set_interpretation" ADD CONSTRAINT "__value_set_interpretation_fk_value_set_5ttk24ay2k" FOREIGN KEY ("value_set") REFERENCES "qti"."value_set" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."var" ADD CONSTRAINT "__var_fk_id_tag_kind_var_ufngemq_3_yq_frpjy6ymvf" FOREIGN KEY ("id", "__tag_kind_var_ufngemq3yq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable" ADD CONSTRAINT "__variable_fk_id_4qrpe3j6x3" FOREIGN KEY ("id") REFERENCES "qti"."expression" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable" ADD CONSTRAINT "__variable_fk_id_lva6pkmnaw" FOREIGN KEY ("id") REFERENCES "qti"."variable_ref" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable" ADD CONSTRAINT "__variable_fk_id_tag_kind_qti_variable_obgp_52_jplg_fefvglcgp2" FOREIGN KEY ("id", "__tag_kind_qti_variable_obgp52jplg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_ref" ADD CONSTRAINT "__variable_ref_fk_id_document_jnexkah4is" FOREIGN KEY ("id", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variable_weight_identifier" ADD CONSTRAINT "__variable_weight_identifier_fk_node_uxqmpfxmjf" FOREIGN KEY ("node") REFERENCES "qti"."variable" ("id");

ALTER TABLE "qti"."variable_weight_identifier" ADD CONSTRAINT "__variable_weight_identifier_fk_node_root_kind_xvoekdwiqu" FOREIGN KEY ("node", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_id_tag_kind_cpx_variant_zd_5_caenuzr_jtims4ygfy" FOREIGN KEY ("id", "__tag_kind_cpx_variant_zd5caenuzr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_id_resource_tfxcbdkpma" FOREIGN KEY ("id", "resource") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_package_identifier_ffjrlehepf" FOREIGN KEY ("package", "identifier") REFERENCES "qti"."manifest_id_of_variant" ("package", "id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_package_identifierref_zujo3dkru3" FOREIGN KEY ("package", "identifierref") REFERENCES "qti"."resource" ("package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant" ADD CONSTRAINT "__variant_fk_resource_package_resource_identifier_bsaeqyakiu" FOREIGN KEY ("resource", "package", "resource_identifier") REFERENCES "qti"."resource" ("id", "package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant_metadata" ADD CONSTRAINT "__variant_metadata_fk_id_tag_kind_cpx_metadata_etdkl_qkdqmccwxj" FOREIGN KEY ("id", "__tag_kind_cpx_metadata_etdkl37kij") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant_metadata" ADD CONSTRAINT "__variant_metadata_fk_id_variant_cm4y6w45jw" FOREIGN KEY ("id", "variant") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."variant_metadata" ADD CONSTRAINT "__variant_metadata_fk_variant_ddw6cifzji" FOREIGN KEY ("variant") REFERENCES "qti"."variant" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video" ADD CONSTRAINT "__video_fk_id_tag_kind_video_zsqw_625_lwf_ttvf2kmcoe" FOREIGN KEY ("id", "__tag_kind_video_zsqw625lwf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video_autoplay" ADD CONSTRAINT "__video_autoplay_fk_node_version_ch7gga7r6u" FOREIGN KEY ("node", "version") REFERENCES "qti"."video" ("id", "version");

ALTER TABLE "qti"."video_controls" ADD CONSTRAINT "__video_controls_fk_node_version_sezafxn6ti" FOREIGN KEY ("node", "version") REFERENCES "qti"."video" ("id", "version");

ALTER TABLE "qti"."video_crossorigin" ADD CONSTRAINT "__video_crossorigin_fk_node_dfsyjb3o6u" FOREIGN KEY ("node") REFERENCES "qti"."video" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video_height" ADD CONSTRAINT "__video_height_fk_node_vcdzjs2om6" FOREIGN KEY ("node") REFERENCES "qti"."video" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video_loop" ADD CONSTRAINT "__video_loop_fk_node_version_jdvaj52bo7" FOREIGN KEY ("node", "version") REFERENCES "qti"."video" ("id", "version");

ALTER TABLE "qti"."video_mediagroup" ADD CONSTRAINT "__video_mediagroup_fk_node_bub2cqx56f" FOREIGN KEY ("node") REFERENCES "qti"."video" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video_muted" ADD CONSTRAINT "__video_muted_fk_node_version_mo7zefhkey" FOREIGN KEY ("node", "version") REFERENCES "qti"."video" ("id", "version");

ALTER TABLE "qti"."video_poster" ADD CONSTRAINT "__video_poster_fk_node_p54dp4lud4" FOREIGN KEY ("node") REFERENCES "qti"."video" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video_preload" ADD CONSTRAINT "__video_preload_fk_node_lw2c5qgh5s" FOREIGN KEY ("node") REFERENCES "qti"."video" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video_src" ADD CONSTRAINT "__video_src_fk_node_xlsndyqh7p" FOREIGN KEY ("node") REFERENCES "qti"."video" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."video_width" ADD CONSTRAINT "__video_width_fk_node_qjloob4msl" FOREIGN KEY ("node") REFERENCES "qti"."video" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ws" ADD CONSTRAINT "__ws_fk_id_tag_kind_ws_v_2_rnjnoedh_z7flyfbov6" FOREIGN KEY ("id", "__tag_kind_ws_v2rnjnoedh") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."x_include" ADD CONSTRAINT "__x_include_fk_id_tag_kind_xi_include_tnsd_6_wpc_7_o_o3evvlk3on" FOREIGN KEY ("id", "__tag_kind_xi_include_tnsd6wpc7o") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."x_include_accept" ADD CONSTRAINT "__x_include_accept_fk_node_hlrbyjbj4b" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_accept_language" ADD CONSTRAINT "__x_include_accept_language_fk_node_22obtslbu6" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_encoding" ADD CONSTRAINT "__x_include_encoding_fk_node_wr4gpsamg5" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_href" ADD CONSTRAINT "__x_include_href_fk_node_ria6nowp77" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_parse" ADD CONSTRAINT "__x_include_parse_fk_node_boyx4sfcrs" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

ALTER TABLE "qti"."x_include_xpointer" ADD CONSTRAINT "__x_include_xpointer_fk_node_2ugojdzhfl" FOREIGN KEY ("node") REFERENCES "qti"."x_include" ("id");

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."a"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."a_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."abbr"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."access_for_all_resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."acronym"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."address"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."admission"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ancestry_step"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."and"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."any_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."area_map_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."area_mapping"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."area_mapping_lower_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."area_mapping_upper_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_activedescendant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_atomic"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_autocomplete"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_busy"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_checked"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_colcount"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_colindex"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_colspan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_controls"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_current"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_describedby"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_details"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_disabled"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_errormessage"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_expanded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_flowto"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_haspopup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_hidden"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_invalid"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_keyshortcuts"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_keyshorts"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_labelledby"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_level"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_live"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_modal"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_multiline"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_multiselectable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_orientation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_owns"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_placeholder"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_posinset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_pressed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_readonly"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_relevant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_required"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_role"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_roledescription"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_rowcount"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_rowindex"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_rowspan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_selected"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_setsize"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_sort"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_valuemax"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_valuemin"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_valuenow"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aria_valuetext"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."article"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."aside"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."assessment_item"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."assessment_item_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."associable_hotspot"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."associable_hotspot_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."associable_hotspot_match_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."associate_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_admission"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_entity_reference"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_idref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_lexical"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_spelling"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_autoplay"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_controls"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_crossorigin"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_loop"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_mediagroup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_muted"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_preload"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."audio_src"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."b"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."bdi"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."bdo"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."bdo_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."big"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."binding_fit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."blockquote"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."blockquote_cite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."br"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."built_in_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."caption"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."catalog_info"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."categorized_statistic_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."choice_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."choice_interaction_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."choice_interaction_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."choice_template_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."cite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."code"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."col"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."col_span"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."colgroup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."colgroup_span"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."comment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."companion_materials_info"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."container_size"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."contains"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."content_body_feedback"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."content_body_modal"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."content_body_rubric"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."content_body_rubric_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."content_body_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."context_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."context_declaration_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."coords"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."coords_circle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."coords_default"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."coords_ellipse"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."coords_poly"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."coords_rect"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."correct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."correct_response_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_case_item_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_guid"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_labelled_guid"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_metadata_provider_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_of_guids"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_of_guids_region"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_of_guids_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_resource_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."csm_set_resource_part_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."custom_operator"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."custom_operator_class"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."custom_operator_definition"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dd"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_external_scored"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_interpretation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_long_interpretation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_mastery_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_normal_maximum"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_normal_minimum"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_variable_identifier_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declaration_view"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_adaptive"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_area_mapping_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_associable_hotspot_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_associate_max_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_associate_min_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_associate_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_extended_text_base"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_extended_text_format"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_extended_text_min_strings"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_feedback_block_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_feedback_inline_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_fixed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_img_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_match_max_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_match_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_required"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_text_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_graphic_associate_max_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_graphic_gap_match_max_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hotspot_choice_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hotspot_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hotspot_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hottext_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hottext_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hottext_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_include_boundary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_include_lower_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_include_upper_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_inline_choice_fixed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_inline_choice_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_inline_choice_required"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_inline_choice_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_inline_choice_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_map_entry_case_sensitive"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_mapping_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_match_max_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_match_min_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_match_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_math_variable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_media_loop"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_order_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_orientation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_param_variable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_position_object_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_printed_variable_base"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_printed_variable_delimiter"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_printed_variable_mapping_indicator"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_printed_variable_power_form"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_rounding_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_rubric_template_block_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_rubric_template_inline_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_select_point_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_select_point_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_slider_step_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_substring"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_template_block_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_template_feedback_block_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_template_inline_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_text_entry_base"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_tolerance_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_track_kind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_value_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_valuetype"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."default"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."default_value_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."delete"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dependency"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."details"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."details_open"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dfn"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."div"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."divide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dl"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_lang"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drawing_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_access_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_access_mode_adapted"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_adaptation_detail"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_adaptation_media_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_adaptation_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_api_interoperable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_at_interoperable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_control_flexibility"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_display_transformability"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_educational_complexity_of_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_educational_level_of_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_has_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_hazard"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_is_adaptation_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_is_full_adaptation_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_is_partial_adaptation_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drd_language_of_adaptation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."duration_gte"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."duration_lt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."edge"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."em"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."end_attempt_count_attempt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."end_attempt_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."entity_reference"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal_rounded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal_rounded_figures_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal_tolerance"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."exit_response"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."exit_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."exit_test"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_exclude_category"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_include_category"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_section_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."expression_weight_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."extended_text_expected_length"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."extended_text_expected_lines"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."extended_text_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."extended_text_max_strings"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."extended_text_pattern_mask"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."extended_text_patternmask_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."extended_text_placeholder_text"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."external_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."fallback"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."feedback_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."feedback_inline"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."feedback_outcome_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."field_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."figcaption"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."figure"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_content"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."file_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."footer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_img"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_img_left"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_img_match_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_img_object_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_img_top"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_choices_container_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_min_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_text"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_text_match_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gcd"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_associate_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_associate_min_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_gap_match_choices_container_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_gap_match_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_gap_match_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_gap_match_min_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_gap_match_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_order_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_order_max_choices_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_order_min_choices_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gte"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."h_1"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."h_2"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."h_3"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."h_4"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."h_5"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."h_6"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."header"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."headers_target"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_choice"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_choice_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext_owner"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hr"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."html_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."i"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img_height"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img_longdesc"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."img_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."index"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."index_n_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."inline_choice"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."inline_choice_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."inline_choice_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."inline_choice_prompt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."inside"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."integer_divide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."integer_modulus"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."integer_to_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interaction_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_default_value_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."interpolation_table_entry_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."is_null"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_body"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_body_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool_both"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool_name"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."kbd"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lcm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."li"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."literal_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_aggregation_level"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_annotation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_classification"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_context"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_contribute"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_copyright_and_other_restrictions"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_cost"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_coverage"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_date"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_date_time"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_description"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_difficulty"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_duration_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_educational"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_entity"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_entry_lang_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_format"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_general"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_general_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_identifier_catalog"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_identifier_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_installation_remarks"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_intended_end_user_role"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_interactivity_level"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_interactivity_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_keyword"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_kind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_language"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_learning_resource_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_life_cycle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_maximum_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_meta_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_metadataschema"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_minimum_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_name"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_object_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_object_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_or_composite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_other_platform_requirements"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_purpose"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_relation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_requirement"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_rights"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_role"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_semantic_density"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_size"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_source"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_source_lang_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_status"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_string_language"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_structure"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_taxon"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_taxon_path"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_technical"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_typical_age_range"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_typical_learning_time"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lookup_outcome_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lte"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id_of_manifest"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id_of_resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_id_of_variant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_schema"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."manifest_schema_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_entry_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_response"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."map_response_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mappable_base_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mapping"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mapping_lower_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."mapping_upper_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_first_column_header"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_group"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_default_value_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_table_entry_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."math_constant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."math_operator"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."media_coords"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."media_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."media_max_plays"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."media_min_plays"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."member"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."modal_feedback"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."modal_feedback_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."multiple"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."namespace_declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."nav"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_catalog_idref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_class"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_dir"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_lang"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_suppress_tts"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_xml_base"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."node_xml_lang"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."not"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."null"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_correct"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_incorrect"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_presented"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_responded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."number_selected"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."object"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."object_height"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."object_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ol"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operand"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operator_arity"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operator_arity_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."operator_arity_unbounded"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."or"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_choices_container_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_max_choices_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_min_choices_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_min_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_orientation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ordered"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ordinary_statistic_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."organizations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_condition_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_document"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_else_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_else_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_maximum_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_min_max"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_minimum_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_processing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."outcome_processing_fragment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."p"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."package"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."package_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."param"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."param_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."pattern_match"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."pi"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."picture"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."position_object_center_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."position_object_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."position_object_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."position_object_stage"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."power"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."pre"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable_field"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable_format"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable_index"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."printed_variable_var_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."product"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."prompt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."q"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."q_cite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_composite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_custom_type_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_feedback_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_interaction_kind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_interaction_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_item_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_portable_custom_interaction_context"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_scoring_mode"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_solution_available"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_time_dependent"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_tool_name"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_tool_vendor"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qmd_tool_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_external_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_resource_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_float_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_integer_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."random_integer_step"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rb"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_binding_fit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_field"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_value_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."repeat"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."repeat_number_repeats_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_general"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_identified"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_language_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_titled"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_type_of"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resources"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_condition_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_declaration_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_else_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_else_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_fragment"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_item"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."response_processing_template_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."root_of_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."round"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."round_to"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."round_to_figures_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rp"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rtc"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rubric_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rubric_template_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rubric_template_inline"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ruby"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rule_operand"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."samp"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."schema_location"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."select_point_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_correct_response"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_outcome_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."set_template_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_associable_choice"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_associable_choice_fixed"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_associable_choice_match_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_associable_choice_match_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_associable_choice_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_choice"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_choice_template_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."simple_match_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."slider_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."slider_orientation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."slider_reverse"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."slider_step"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."small"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."source"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."source_media"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."source_sizes"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."source_srcset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."source_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."span"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."standard_template_reference"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_case_count"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_glossary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_last_updated"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_std_deviation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."statistic_std_error"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."stats_operator"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."string_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."string_match"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."strong"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."stylesheet"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."stylesheet_media"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."stylesheet_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."sub"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."substring"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."subtract"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."sum"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."summary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."sup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."table"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."table_summary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."target_object"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."target_object_object_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."target_object_part_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tbody"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td_abbr"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td_align"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td_axis"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td_colspan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td_rowspan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td_scope"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."td_valign"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_condition_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_constraint"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_content_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_else_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_else_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_feedback_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_if_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_inline"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_parameter_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_processing"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_variables"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."test_variables_base_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text_entry_expected_length"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text_entry_format"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text_entry_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text_entry_pattern_mask"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text_entry_patternmask_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text_entry_placeholder_text"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."text_node"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tfoot"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th_abbr"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th_align"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th_axis"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th_colspan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th_rowspan"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th_scope"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."th_valign"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."thead"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tr"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."track"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."track_default"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."track_srclang"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_doctype"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_export_charset"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_misc"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_root"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_xml_encoding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_xml_standalone"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tree_xml_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."truncate"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tt"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."typed_binding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."typed_declaration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."typed_value_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ul"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."upload_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."upload_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_data"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_data_glossary"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_map_entry"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_map_entry_case_sensitive"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_mapping"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_mapping_lower_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_mapping_upper_bound"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_boolean"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_directed_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_duration"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_file"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_float"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_integer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_pair"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_point"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_typed_value_uri"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_value_base_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."usage_value_field_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."value_set"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."value_set_interpretation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."var"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variable"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variable_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variable_weight_identifier"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variant"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."variant_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_autoplay"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_controls"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_crossorigin"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_height"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_loop"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_mediagroup"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_muted"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_poster"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_preload"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_src"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."video_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ws"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_accept"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_accept_language"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_encoding"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_parse"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."x_include_xpointer"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();
