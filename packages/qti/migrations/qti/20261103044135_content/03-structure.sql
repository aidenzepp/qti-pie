DROP POLICY "qti__author" ON "qti"."typed_declaration";

DROP POLICY "qti__author" ON "qti"."typed_binding";

DROP POLICY "qti__author" ON "qti"."tree_root";

DROP POLICY "qti__author" ON "qti"."resource_lom";

DROP POLICY "qti__author" ON "qti"."record_binding";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."lom_string_language";

DROP POLICY "qti__author" ON "qti"."lom_language";

DROP POLICY "qti__author" ON "qti"."lom_general";

DROP POLICY "qti__author" ON "qti"."lom";

DROP POLICY "qti__author" ON "qti"."interaction_binding";

DROP POLICY "qti__author" ON "qti"."edge";

DROP POLICY "qti__author" ON "qti"."document_id";

DROP POLICY "qti__author" ON "qti"."document";

DROP POLICY "qti__author" ON "qti"."declaration_normal_maximum";

DROP POLICY "qti__author" ON "qti"."declaration";

DROP POLICY "qti__author" ON "qti"."attribute_lexical";

DROP POLICY "qti__author" ON "qti"."assessment_item";

DROP VIEW "qti__author"."typed_declaration";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."tree_root";

DROP VIEW "qti__author"."template_parameter_ref";

DROP VIEW "qti__author"."rule_operand";

DROP VIEW "qti__author"."resource_lom";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."outcome_min_max";

DROP VIEW "qti__author"."operator_arity_unbounded";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."lom_string_language";

DROP VIEW "qti__author"."lom_language";

DROP VIEW "qti__author"."lom_general";

DROP VIEW "qti__author"."lom";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."inside";

DROP VIEW "qti__author"."expression_max";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."document_id";

DROP VIEW "qti__author"."document";

DROP VIEW "qti__author"."declared_ref";

DROP VIEW "qti__author"."declaration_normal_maximum";

DROP VIEW "qti__author"."declaration";

DROP VIEW "qti__author"."built_in_ref";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."assessment_item";

DROP VIEW "qti__author"."admission";


CREATE TYPE "qti"."__rebuild_attribute_name_f4a5lptb3a" AS ENUM ('identifier', 'title', 'adaptive', 'time-dependent', 'cardinality', 'base-type', 'view', 'interpretation', 'long-interpretation', 'normal-maximum', 'normal-minimum', 'mastery-value', 'external-scored', 'variable-identifier-ref', 'field-identifier', 'response-identifier', 'shuffle', 'max-choices', 'min-choices', 'orientation', 'data-min-selections-message', 'data-max-selections-message', 'fixed', 'template-identifier', 'show-hide', 'template', 'template-location', 'label', 'xml:lang', 'tool-name', 'tool-version', 'id', 'class', 'dir', 'data-catalog-idref', 'role', 'aria-controls', 'aria-describedby', 'aria-flowto', 'aria-label', 'aria-labelledby', 'aria-level', 'aria-live', 'aria-orientation', 'aria-owns', 'aria-hidden', 'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy', 'aria-checked', 'aria-disabled', 'aria-expanded', 'aria-haspopup', 'aria-invalid', 'aria-multiline', 'aria-multiselectable', 'aria-posinset', 'aria-pressed', 'aria-readonly', 'aria-relevant', 'aria-required', 'aria-selected', 'aria-setsize', 'aria-sort', 'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext', 'aria-modal', 'aria-current', 'aria-placeholder', 'aria-colcount', 'aria-rowcount', 'aria-colindex', 'aria-rowindex', 'aria-colspan', 'aria-rowspan', 'aria-keyshortcuts', 'aria-roledescription', 'aria-errormessage', 'aria-details', 'lang', 'xml:base', 'data-qti-suppress-tts', 'shape', 'coords', 'mapped-value', 'lower-bound', 'upper-bound', 'default-value', 'aria-keyshorts', 'match-group', 'hotspot-label', 'match-max', 'match-min', 'max-associations', 'min-associations', 'count-attempt', 'base', 'string-identifier', 'expected-length', 'pattern-mask', 'placeholder-text', 'max-strings', 'min-strings', 'expected-lines', 'format', 'data-patternmask-message', 'data-ssml', 'outcome-identifier', 'required', 'object-label', 'top', 'left', 'data-choices-container-width', 'data-prompt', 'source-value', 'include-boundary', 'target-value', 'map-key', 'case-sensitive', 'data-first-column-header', 'autostart', 'min-plays', 'max-plays', 'loop', 'center-point', 'index', 'power-form', 'field', 'delimiter', 'mapping-indicator', 'use', 'step', 'step-label', 'reverse', 'media', 'param-variable', 'math-variable', 'min', 'max', 'definition', 'tolerance-mode', 'tolerance', 'include-lower-bound', 'include-upper-bound', 'rounding-mode', 'figures', 'n', 'name', 'section-identifier', 'include-category', 'exclude-category', 'weight-identifier', 'pattern', 'number-repeats', 'substring', 'variable-identifier', 'src', 'alt', 'longdesc', 'height', 'width', 'crossorigin', 'preload', 'autoplay', 'mediagroup', 'muted', 'controls', 'cite', 'span', 'open', 'data', 'value', 'valuetype', 'srcset', 'sizes', 'summary', 'headers', 'scope', 'abbr', 'axis', 'rowspan', 'colspan', 'align', 'valign', 'kind', 'srclang', 'default', 'poster', 'type', 'href', 'identifierref', 'language', 'resourceLabel', 'resourcePartId', 'providerId', 'region', 'version', 'glossary', 'caseCount', 'context', 'lastUpdated', 'stdDeviation', 'stdError', 'objectType', 'partIdentifier', 'baseType', 'fieldIdentifier', 'defaultValue', 'lowerBound', 'upperBound', 'caseSensitive', 'mapKey', 'mappedValue', 'parse', 'xpointer', 'encoding', 'accept', 'accept-language');

ALTER TABLE "qti"."attribute_lexical" ALTER COLUMN "attribute" TYPE "qti"."__rebuild_attribute_name_f4a5lptb3a" USING ("attribute"::text)::"qti"."__rebuild_attribute_name_f4a5lptb3a";

DROP TYPE "qti"."attribute_name";

ALTER TYPE "qti"."__rebuild_attribute_name_f4a5lptb3a" RENAME TO "attribute_name";

GRANT USAGE ON TYPE "qti"."attribute_name" TO "qti__author";

REVOKE ALL ON TYPE "qti"."attribute_name" FROM PUBLIC;

ALTER DOMAIN "qti"."__text_gubl3xpcnx" DROP CONSTRAINT "check";

ALTER DOMAIN "qti"."__text_gubl3xpcnx" ADD CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[0-9]+\%?(?:\,[0-9]+\%?){2}(?:\,[0-9]+\%?)?|[0-9]+\%?(?:\,[0-9]+\%?){5}(?:\,[0-9]+\%?\,[0-9]+\%?)*)\Z'::text) IS TRUE) NOT VALID;

CREATE TABLE "qti"."a" (
  "href" "qti"."__text_k3z6naurdo" NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__a_pk_lfg4c2sp42" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."a_type" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_ifp42a6zk6" NOT NULL,
  CONSTRAINT "__a_type_pk_iqwmrqx6na" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."abbr" (
  "id" uuid NOT NULL,
  CONSTRAINT "__abbr_pk_r7nedg3rrq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."acronym" (
  "id" uuid NOT NULL,
  CONSTRAINT "__acronym_pk_lhlrt2mjg5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."address" (
  "id" uuid NOT NULL,
  CONSTRAINT "__address_pk_qq6oupzxag" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."ancestry_step" (
  "ancestry" "qti"."ancestry" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "next" "qti"."ancestry" NOT NULL,
  CONSTRAINT "__ancestry_step_pk_dn3hkkd6ij" PRIMARY KEY ("ancestry", "kind"),
  CONSTRAINT "__ancestry_step_key_ancestry_kind_next_oij7jw4whi" UNIQUE ("ancestry", "kind", "next")
);

CREATE TABLE "qti"."area_map_entry" (
  "area_mapping" uuid NOT NULL,
  "id" uuid NOT NULL,
  "mapped_value" "qti"."__text_jld3q663or" NOT NULL,
  "position" bigint NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  CONSTRAINT "__area_map_entry_pk_k7yntsfltr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."area_mapping" (
  "declaration" uuid NOT NULL,
  "default_value" "qti"."__text_jld3q663or" NOT NULL,
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__area_mapping_pk_5ntlzf6y73" PRIMARY KEY ("id"),
  CONSTRAINT "__area_mapping_key_declaration_vogb53l5ke" UNIQUE ("declaration")
);

CREATE TABLE "qti"."area_mapping_lower_bound" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__area_mapping_lower_bound_pk_k35cvvbwvx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."area_mapping_upper_bound" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__area_mapping_upper_bound_pk_5ibp7h5p5p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."aria_activedescendant" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__aria_activedescendant_pk_dgvl276ics" PRIMARY KEY ("node"),
  CONSTRAINT "aria_activedescendant_attribute" CHECK (("attribute" = 'aria-activedescendant'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_atomic" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_atomic_pk_zra45fne37" PRIMARY KEY ("node"),
  CONSTRAINT "aria_atomic_attribute" CHECK (("attribute" = 'aria-atomic'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_autocomplete" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_ffwr4dbfx2" NOT NULL,
  CONSTRAINT "__aria_autocomplete_pk_io5khqs24e" PRIMARY KEY ("node"),
  CONSTRAINT "aria_autocomplete_attribute" CHECK (("attribute" = 'aria-autocomplete'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_busy" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_busy_pk_x535cdzgvw" PRIMARY KEY ("node"),
  CONSTRAINT "aria_busy_attribute" CHECK (("attribute" = 'aria-busy'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_checked" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_exm3fkarq3" NOT NULL,
  CONSTRAINT "__aria_checked_pk_ormiljzy5i" PRIMARY KEY ("node"),
  CONSTRAINT "aria_checked_attribute" CHECK (("attribute" = 'aria-checked'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_colcount" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__aria_colcount_pk_fuegp276vy" PRIMARY KEY ("node"),
  CONSTRAINT "aria_colcount_attribute" CHECK (("attribute" = 'aria-colcount'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_colindex" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__aria_colindex_pk_4n6wg2rqfi" PRIMARY KEY ("node"),
  CONSTRAINT "aria_colindex_attribute" CHECK (("attribute" = 'aria-colindex'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_colspan" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__aria_colspan_pk_3acfgqy7hc" PRIMARY KEY ("node"),
  CONSTRAINT "aria_colspan_attribute" CHECK (("attribute" = 'aria-colspan'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_controls" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_controls_pk_omxk6upyo6" PRIMARY KEY ("node"),
  CONSTRAINT "aria_controls_attribute" CHECK (("attribute" = 'aria-controls'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_current" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_fictzx37my" NOT NULL,
  CONSTRAINT "__aria_current_pk_iitvxrfs7v" PRIMARY KEY ("node"),
  CONSTRAINT "aria_current_attribute" CHECK (("attribute" = 'aria-current'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_describedby" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_describedby_pk_mra26scdr4" PRIMARY KEY ("node"),
  CONSTRAINT "aria_describedby_attribute" CHECK (("attribute" = 'aria-describedby'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_details" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__aria_details_pk_nomndkae4i" PRIMARY KEY ("node"),
  CONSTRAINT "aria_details_attribute" CHECK (("attribute" = 'aria-details'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_disabled" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_disabled_pk_tj4vwoqb2l" PRIMARY KEY ("node"),
  CONSTRAINT "aria_disabled_attribute" CHECK (("attribute" = 'aria-disabled'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_errormessage" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__aria_errormessage_pk_ydysodujj3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_errormessage_attribute" CHECK (("attribute" = 'aria-errormessage'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_expanded" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_oct7jwkpoj" NOT NULL,
  CONSTRAINT "__aria_expanded_pk_cdvp2uzfxs" PRIMARY KEY ("node"),
  CONSTRAINT "aria_expanded_attribute" CHECK (("attribute" = 'aria-expanded'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_flowto" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_flowto_pk_r6ksuaf2pw" PRIMARY KEY ("node"),
  CONSTRAINT "aria_flowto_attribute" CHECK (("attribute" = 'aria-flowto'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_haspopup" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_haspopup_pk_uxv4eoa6gq" PRIMARY KEY ("node"),
  CONSTRAINT "aria_haspopup_attribute" CHECK (("attribute" = 'aria-haspopup'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_hidden" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_hidden_pk_ko3wcsn3z2" PRIMARY KEY ("node"),
  CONSTRAINT "aria_hidden_attribute" CHECK (("attribute" = 'aria-hidden'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_invalid" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_6gan25pdor" NOT NULL,
  CONSTRAINT "__aria_invalid_pk_q5nega572h" PRIMARY KEY ("node"),
  CONSTRAINT "aria_invalid_attribute" CHECK (("attribute" = 'aria-invalid'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_keyshortcuts" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_keyshortcuts_pk_zrpommjxnx" PRIMARY KEY ("node"),
  CONSTRAINT "aria_keyshortcuts_attribute" CHECK (("attribute" = 'aria-keyshortcuts'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_keyshorts" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_keyshorts_pk_lbhzg36hsx" PRIMARY KEY ("node"),
  CONSTRAINT "aria_keyshorts_attribute" CHECK (("attribute" = 'aria-keyshorts'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_label" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_label_pk_ltzyptfie4" PRIMARY KEY ("node"),
  CONSTRAINT "aria_label_attribute" CHECK (("attribute" = 'aria-label'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_labelledby" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_labelledby_pk_pvgzlokbe5" PRIMARY KEY ("node"),
  CONSTRAINT "aria_labelledby_attribute" CHECK (("attribute" = 'aria-labelledby'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_level" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__aria_level_pk_s4y3tfhzuh" PRIMARY KEY ("node"),
  CONSTRAINT "aria_level_attribute" CHECK (("attribute" = 'aria-level'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_live" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_wu54ry3yoe" NOT NULL,
  CONSTRAINT "__aria_live_pk_7uy6sif62w" PRIMARY KEY ("node"),
  CONSTRAINT "aria_live_attribute" CHECK (("attribute" = 'aria-live'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_modal" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_modal_pk_lkrdh5w4tk" PRIMARY KEY ("node"),
  CONSTRAINT "aria_modal_attribute" CHECK (("attribute" = 'aria-modal'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_multiline" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_multiline_pk_svzywriv5w" PRIMARY KEY ("node"),
  CONSTRAINT "aria_multiline_attribute" CHECK (("attribute" = 'aria-multiline'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_multiselectable" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_multiselectable_pk_dmu6w3xdm5" PRIMARY KEY ("node"),
  CONSTRAINT "aria_multiselectable_attribute" CHECK (("attribute" = 'aria-multiselectable'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_orientation" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_yakcqa4zli" NOT NULL,
  CONSTRAINT "__aria_orientation_pk_s7fxv5bpy5" PRIMARY KEY ("node"),
  CONSTRAINT "aria_orientation_attribute" CHECK (("attribute" = 'aria-orientation'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_owns" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_tmjud3n2tg" NOT NULL,
  CONSTRAINT "__aria_owns_pk_bcuuoeksr3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_owns_attribute" CHECK (("attribute" = 'aria-owns'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_placeholder" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_placeholder_pk_glj4pyfuv2" PRIMARY KEY ("node"),
  CONSTRAINT "aria_placeholder_attribute" CHECK (("attribute" = 'aria-placeholder'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_posinset" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__aria_posinset_pk_btgt6c42wd" PRIMARY KEY ("node"),
  CONSTRAINT "aria_posinset_attribute" CHECK (("attribute" = 'aria-posinset'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_pressed" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_exm3fkarq3" NOT NULL,
  CONSTRAINT "__aria_pressed_pk_6v3fhabpq3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_pressed_attribute" CHECK (("attribute" = 'aria-pressed'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_readonly" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_readonly_pk_rhlczb3n3l" PRIMARY KEY ("node"),
  CONSTRAINT "aria_readonly_attribute" CHECK (("attribute" = 'aria-readonly'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_relevant" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_saolosnhkp" NOT NULL,
  CONSTRAINT "__aria_relevant_pk_yjcn7uhdcg" PRIMARY KEY ("node"),
  CONSTRAINT "aria_relevant_attribute" CHECK (("attribute" = 'aria-relevant'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_required" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__aria_required_pk_ah5s6lqmx7" PRIMARY KEY ("node"),
  CONSTRAINT "aria_required_attribute" CHECK (("attribute" = 'aria-required'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_role" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_x5wrjyn3pc" NOT NULL,
  CONSTRAINT "__aria_role_pk_pxdikk54jm" PRIMARY KEY ("node"),
  CONSTRAINT "aria_role_attribute" CHECK (("attribute" = 'role'::"qti"."attribute_name") IS TRUE),
  CONSTRAINT "aria_role_h_1" CHECK (("value" IN ('heading'::text, 'tab'::text, 'presentation'::text) OR "kind" <> 'h1'::"qti"."node_kind") IS TRUE),
  CONSTRAINT "aria_role_not_source" CHECK (("kind" <> 'source'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."aria_roledescription" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_roledescription_pk_l734vcmgp3" PRIMARY KEY ("node"),
  CONSTRAINT "aria_roledescription_attribute" CHECK (("attribute" = 'aria-roledescription'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_rowcount" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__aria_rowcount_pk_qoec2qzljq" PRIMARY KEY ("node"),
  CONSTRAINT "aria_rowcount_attribute" CHECK (("attribute" = 'aria-rowcount'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_rowindex" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__aria_rowindex_pk_n5gvluwjz7" PRIMARY KEY ("node"),
  CONSTRAINT "aria_rowindex_attribute" CHECK (("attribute" = 'aria-rowindex'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_rowspan" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__aria_rowspan_pk_kko2gufryf" PRIMARY KEY ("node"),
  CONSTRAINT "aria_rowspan_attribute" CHECK (("attribute" = 'aria-rowspan'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_selected" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_oct7jwkpoj" NOT NULL,
  CONSTRAINT "__aria_selected_pk_5hcbwbanao" PRIMARY KEY ("node"),
  CONSTRAINT "aria_selected_attribute" CHECK (("attribute" = 'aria-selected'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_setsize" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__aria_setsize_pk_w5q72eekou" PRIMARY KEY ("node"),
  CONSTRAINT "aria_setsize_attribute" CHECK (("attribute" = 'aria-setsize'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_sort" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_dwt2qnsttp" NOT NULL,
  CONSTRAINT "__aria_sort_pk_mtze6beddy" PRIMARY KEY ("node"),
  CONSTRAINT "aria_sort_attribute" CHECK (("attribute" = 'aria-sort'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuemax" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_fgbxwprcwx" NOT NULL,
  CONSTRAINT "__aria_valuemax_pk_fuvhhtxhhd" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuemax_attribute" CHECK (("attribute" = 'aria-valuemax'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuemin" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_fgbxwprcwx" NOT NULL,
  CONSTRAINT "__aria_valuemin_pk_gcsdfao6ll" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuemin_attribute" CHECK (("attribute" = 'aria-valuemin'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuenow" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_fgbxwprcwx" NOT NULL,
  CONSTRAINT "__aria_valuenow_pk_fbdvxecqpz" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuenow_attribute" CHECK (("attribute" = 'aria-valuenow'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."aria_valuetext" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__aria_valuetext_pk_72kxmz7pe2" PRIMARY KEY ("node"),
  CONSTRAINT "aria_valuetext_attribute" CHECK (("attribute" = 'aria-valuetext'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."article" (
  "id" uuid NOT NULL,
  CONSTRAINT "__article_pk_3etfz7zemf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."aside" (
  "id" uuid NOT NULL,
  CONSTRAINT "__aside_pk_5dxnxm5kux" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."assessment_item" ADD COLUMN "tree" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."assessment_item" ALTER COLUMN "tree" DROP DEFAULT;

CREATE TABLE "qti"."assessment_item_label" (
  "node" uuid NOT NULL,
  "tree" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__assessment_item_label_pk_vqcepo52hu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."associable_hotspot" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "match_max" "qti"."__text_clza6vokfo" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__associable_hotspot_pk_oqmxwv2qg7" PRIMARY KEY ("id"),
  CONSTRAINT "__associable_hotspot_key_interaction_identifier_t2m7xj76o6" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "associable_hotspot_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE),
  CONSTRAINT "no_default_hotspot_in_graphic_gap_match" CHECK (("parent_kind" <> 'qti-graphic-gap-match-interaction'::"qti"."node_kind" OR "shape" <> 'default'::"qti"."shape") IS TRUE)
);

CREATE TABLE "qti"."associable_hotspot_label" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__associable_hotspot_label_pk_y6ze6aolox" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."associable_hotspot_match_min" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__associable_hotspot_match_min_pk_fk3v5ypkng" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."associate_interaction" (
  "id" uuid NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__associate_interaction_pk_yxo2ez6yi2" PRIMARY KEY ("id"),
  CONSTRAINT "associate_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."associate_max_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__associate_max_associations_pk_dadpzoa44u" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."associate_min_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__associate_min_associations_pk_4tpfvzx2pg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."attribute_admission" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__attribute_admission_pk_dkxlgipfli" PRIMARY KEY ("kind", "attribute")
);

CREATE TABLE "qti"."attribute_idref" (
  "attribute" "qti"."idref_attribute" NOT NULL,
  "document" uuid NOT NULL,
  "node" uuid NOT NULL,
  "position" bigint NOT NULL,
  "target" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__attribute_idref_pk_5i22dta3dq" PRIMARY KEY ("node", "attribute", "position"),
  CONSTRAINT "__attribute_idref_key_node_attribute_position_target_tdya7c65ru" UNIQUE ("node", "attribute", "position", "target")
);

CREATE TABLE "qti"."audio" (
  "id" uuid NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_pk_qlkyzdwqgr" PRIMARY KEY ("id"),
  CONSTRAINT "__audio_key_id_version_wt7jftsw5l" UNIQUE ("id", "version")
);

CREATE TABLE "qti"."audio_autoplay" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_autoplay_pk_o2pwkyo3fs" PRIMARY KEY ("node"),
  CONSTRAINT "audio_autoplay_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'autoplay'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_controls" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_controls_pk_hbxi3bgbvy" PRIMARY KEY ("node"),
  CONSTRAINT "audio_controls_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'controls'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_crossorigin" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_dqq6r4bdbe" NOT NULL,
  CONSTRAINT "__audio_crossorigin_pk_dnvh2ysnga" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."audio_loop" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_loop_pk_6ysuhkulw7" PRIMARY KEY ("node"),
  CONSTRAINT "audio_loop_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'loop'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_mediagroup" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__audio_mediagroup_pk_de2l7zrr3p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."audio_muted" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__audio_muted_pk_nbjhlyft5o" PRIMARY KEY ("node"),
  CONSTRAINT "audio_muted_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'muted'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."audio_preload" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_72jqunyi7z" NOT NULL,
  CONSTRAINT "__audio_preload_pk_6qwvgzz35c" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."audio_src" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__audio_src_pk_h27xitako6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."b" (
  "id" uuid NOT NULL,
  CONSTRAINT "__b_pk_zbmxagffkg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."bdi" (
  "id" uuid NOT NULL,
  CONSTRAINT "__bdi_pk_gsfpg7yvxr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."bdo" (
  "id" uuid NOT NULL,
  CONSTRAINT "__bdo_pk_mxfajtogju" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."bdo_title" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__bdo_title_pk_hrq6p4ut42" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."big" (
  "id" uuid NOT NULL,
  CONSTRAINT "__big_pk_sxjbd6ilzz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."blockquote" (
  "id" uuid NOT NULL,
  CONSTRAINT "__blockquote_pk_6kfmadmsqt" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."blockquote_cite" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__blockquote_cite_pk_rth3urhdf5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."br" (
  "id" uuid NOT NULL,
  CONSTRAINT "__br_pk_cgia6yjeyu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."caption" (
  "id" uuid NOT NULL,
  CONSTRAINT "__caption_pk_l2gkvn4umb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."catalog_info" (
  "id" uuid NOT NULL,
  CONSTRAINT "__catalog_info_pk_2hbdzkghfb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."choice_template_ref" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__choice_template_ref_pk_zclve6idbx" PRIMARY KEY ("node"),
  CONSTRAINT "choice_template_ref_type" CHECK (("cardinality" IN ('single'::"qti"."typed_cardinality", 'multiple'::"qti"."typed_cardinality") AND "base_type" = 'identifier'::"qti"."base_type") IS TRUE)
);

CREATE TABLE "qti"."cite" (
  "id" uuid NOT NULL,
  CONSTRAINT "__cite_pk_l46lgeg2sc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."code" (
  "id" uuid NOT NULL,
  CONSTRAINT "__code_pk_uiuyavt5xu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."col" (
  "id" uuid NOT NULL,
  CONSTRAINT "__col_pk_z73pp4xtka" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."col_span" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__col_span_pk_xn6ba35f4t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."colgroup" (
  "id" uuid NOT NULL,
  CONSTRAINT "__colgroup_pk_5bdtkcddxv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."colgroup_span" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__colgroup_span_pk_b4khfvwhx4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."companion_materials_info" (
  "id" uuid NOT NULL,
  CONSTRAINT "__companion_materials_info_pk_5b76orjcsv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_feedback" (
  "id" uuid NOT NULL,
  CONSTRAINT "__content_body_feedback_pk_brwieqgroc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_modal" (
  "id" uuid NOT NULL,
  CONSTRAINT "__content_body_modal_pk_edtvfe22z4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_rubric" (
  "id" uuid NOT NULL,
  CONSTRAINT "__content_body_rubric_pk_3ulqq3vzcl" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_rubric_template" (
  "id" uuid NOT NULL,
  CONSTRAINT "__content_body_rubric_template_pk_wefvrqanrh" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."content_body_template" (
  "id" uuid NOT NULL,
  CONSTRAINT "__content_body_template_pk_b4kzg7bvsu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."context_declaration_arm" (
  "id" uuid NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__context_declaration_arm_pk_4w56ikkwxc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."context_declaration_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__context_declaration_id_pk_mgpu5tsgi5" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__context_declaration_id_key_node_6wysjljein" UNIQUE ("node")
);

CREATE TABLE "qti"."coords" (
  "node" uuid NOT NULL,
  "owner_kind" "qti"."node_kind" NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  "value" "qti"."__text_gubl3xpcnx" NOT NULL,
  CONSTRAINT "__coords_pk_zrwwpteuvx" PRIMARY KEY ("node"),
  CONSTRAINT "__coords_key_node_shape_byo4n5vec6" UNIQUE ("node", "shape")
);

CREATE TABLE "qti"."coords_circle" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_bvx3fqniye" NOT NULL,
  CONSTRAINT "__coords_circle_pk_h6icghlpxt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_default" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_gubl3xpcnx" NOT NULL,
  CONSTRAINT "__coords_default_pk_r5uouuzmh2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_ellipse" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_a4spx6pjqw" NOT NULL,
  CONSTRAINT "__coords_ellipse_pk_si4ual7i3q" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_poly" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_gm4clqaaza" NOT NULL,
  CONSTRAINT "__coords_poly_pk_ki4e2cqz3y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."coords_rect" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_a4spx6pjqw" NOT NULL,
  CONSTRAINT "__coords_rect_pk_rbgmyuf5ut" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."dd" (
  "id" uuid NOT NULL,
  CONSTRAINT "__dd_pk_57rz2lepxy" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."declaration_normal_maximum" ALTER COLUMN "value" TYPE "qti"."__text_acxfo763jg" USING "value"::"qti"."__text_acxfo763jg";

CREATE TABLE "qti"."declared_area_mapping_default_value" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_area_mapping_default_value_pk_w2oayrb4x4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associable_hotspot_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_associable_hotspot_show_hide_pk_lv5px2ljkx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associate_max_associations" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_associate_max_associations_pk_idmdia2h4w" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associate_min_associations" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_associate_min_associations_pk_sifeg35ari" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_associate_shuffle" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_associate_shuffle_pk_gudss4f3bs" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_extended_text_base" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_extended_text_base_pk_mw26lik4ug" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_extended_text_format" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_extended_text_format_pk_ervgiyl27g" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_extended_text_min_strings" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_extended_text_min_strings_pk_qcwhp2tw37" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_feedback_block_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_feedback_block_show_hide_pk_ojufccao7d" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_feedback_inline_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_feedback_inline_show_hide_pk_n3vvswfkwh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_img_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_img_show_hide_pk_rnyjq43x4l" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_match_max_associations" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_match_max_associations_pk_e72xwi4wwf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_match_shuffle" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_match_shuffle_pk_l23u6n6elv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_required" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_required_pk_mkysoal6ph" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_show_hide_pk_7ijnzmslzd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_text_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_text_show_hide_pk_iglqx3fd3k" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_graphic_associate_max_associations" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_graphic_associate_max_associations_pk_rn2dath4dc" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_graphic_gap_match_max_associations" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_graphic_gap_match_max_associations_pk_uxpvm3ugdw" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hotspot_choice_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hotspot_choice_show_hide_pk_hds765eicl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hotspot_max_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hotspot_max_choices_pk_hsygzd53z4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hotspot_min_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hotspot_min_choices_pk_xgc4tkxpm4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hottext_max_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hottext_max_choices_pk_u45t2bnusc" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hottext_min_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hottext_min_choices_pk_ejzkqwu63y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hottext_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hottext_show_hide_pk_3zlccbyr75" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_include_boundary" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_include_boundary_pk_tu5lrfjuxh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_fixed" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_inline_choice_fixed_pk_btbzrajbvy" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_min_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_inline_choice_min_choices_pk_nkujpoh6bn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_required" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_inline_choice_required_pk_mgayqbinqm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_inline_choice_show_hide_pk_djhoznfi2b" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_shuffle" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_inline_choice_shuffle_pk_55ryelvcki" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_map_entry_case_sensitive" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_map_entry_case_sensitive_pk_xa2r73zpeo" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_mapping_default_value" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_mapping_default_value_pk_46yyn7x6np" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_match_max_associations" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_match_max_associations_pk_uls4swz7xx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_match_min_associations" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_match_min_associations_pk_wayciectww" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_match_shuffle" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_match_shuffle_pk_lfdnb4p74t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_math_variable" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_math_variable_pk_v4jg5r25qv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_media_loop" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_media_loop_pk_h2mc5lz3hb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_order_shuffle" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_order_shuffle_pk_k3oqlqq4qv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_param_variable" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_param_variable_pk_wlbpejkruf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_position_object_max_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_position_object_max_choices_pk_k4f53wmhew" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_base" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_printed_variable_base_pk_dsofrz72ix" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_delimiter" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_printed_variable_delimiter_pk_hpwmipg5ee" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_mapping_indicator" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_printed_variable_mapping_indicator_pk_twg3b5ng4r" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_printed_variable_power_form" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_printed_variable_power_form_pk_dmvya2a4bz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_rubric_template_block_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_rubric_template_block_show_hide_pk_tqinnfq34p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_rubric_template_inline_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_rubric_template_inline_show_hide_pk_yqpebrml7t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_select_point_max_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_select_point_max_choices_pk_kaavzbffln" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_select_point_min_choices" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_select_point_min_choices_pk_aepkcy7oln" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_slider_step_label" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_slider_step_label_pk_j23pevwqyl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_template_block_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_template_block_show_hide_pk_6jeizopzxe" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_template_feedback_block_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_template_feedback_block_show_hide_pk_iyminu7tvz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_template_inline_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_template_inline_show_hide_pk_lmv7fqhhrt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_text_entry_base" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_text_entry_base_pk_m3ps6xxrdg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_track_kind" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_track_kind_pk_snzeobyocg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_valuetype" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_valuetype_pk_zzyvqsgiam" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."details" (
  "id" uuid NOT NULL,
  CONSTRAINT "__details_pk_kvl3ej3exp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."details_open" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__details_open_pk_7yvpfx5ylb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."dfn" (
  "id" uuid NOT NULL,
  CONSTRAINT "__dfn_pk_2jpfmwypwp" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."div" (
  "id" uuid NOT NULL,
  CONSTRAINT "__div_pk_7n2xm5wtky" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."dl" (
  "id" uuid NOT NULL,
  CONSTRAINT "__dl_pk_7o43hwrbas" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."document_lang" (
  "document" uuid NOT NULL,
  "lom_general" "qti"."yes_no" NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "value" "qti"."__text_o3e7dedzyv" NOT NULL,
  CONSTRAINT "__document_lang_pk_hws7ocndwj" PRIMARY KEY ("document", "value")
);

CREATE TABLE "qti"."drawing_interaction" (
  "id" uuid NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__drawing_interaction_pk_kl3anrxfai" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."dt" (
  "id" uuid NOT NULL,
  CONSTRAINT "__dt_pk_kokfaes5nu" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."edge" ADD COLUMN "child_ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."edge" ALTER COLUMN "child_ancestry" DROP DEFAULT;

ALTER TABLE "qti"."edge" ADD COLUMN "parent_ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."edge" ALTER COLUMN "parent_ancestry" DROP DEFAULT;

CREATE TABLE "qti"."em" (
  "id" uuid NOT NULL,
  CONSTRAINT "__em_pk_tnak7gsvjd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."end_attempt_count_attempt" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__end_attempt_count_attempt_pk_nl5uryx27y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."end_attempt_interaction" (
  "id" uuid NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "title" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__end_attempt_interaction_pk_eow2u4u7ao" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."extended_text_expected_length" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__extended_text_expected_length_pk_f2nz76k6qe" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_expected_lines" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__extended_text_expected_lines_pk_nayyvfzxei" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_interaction" (
  "base" "qti"."__text_xs56r6cx4y" NOT NULL,
  "format" "qti"."__text_tdupg63xcv" NOT NULL,
  "id" uuid NOT NULL,
  "min_strings" "qti"."__text_clza6vokfo" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__extended_text_interaction_pk_jtknc6r23t" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."extended_text_max_strings" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__extended_text_max_strings_pk_64mlu5tmra" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_pattern_mask" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__extended_text_pattern_mask_pk_mvtxvgo25a" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_patternmask_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__extended_text_patternmask_message_pk_p33454j22t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."extended_text_placeholder_text" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__extended_text_placeholder_text_pk_unubra747d" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."feedback_block" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "outcome_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__feedback_block_pk_z55fviztqo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."feedback_inline" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "outcome_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__feedback_inline_pk_3livsuqmrd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."feedback_outcome_ref" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__feedback_outcome_ref_pk_5exg7byhis" PRIMARY KEY ("node"),
  CONSTRAINT "feedback_outcome_ref_type" CHECK (("cardinality" IN ('single'::"qti"."typed_cardinality", 'multiple'::"qti"."typed_cardinality") AND "base_type" = 'identifier'::"qti"."base_type") IS TRUE)
);

CREATE TABLE "qti"."figcaption" (
  "id" uuid NOT NULL,
  CONSTRAINT "__figcaption_pk_7dk6akokef" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."figure" (
  "id" uuid NOT NULL,
  CONSTRAINT "__figure_pk_qhydqu2z5g" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."footer" (
  "id" uuid NOT NULL,
  CONSTRAINT "__footer_pk_vxewfzoijn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."gap" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "required" "qti"."__text_cz7v66q3ce" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__gap_pk_jadaeyhbpp" PRIMARY KEY ("id"),
  CONSTRAINT "__gap_key_interaction_identifier_ftuov7occy" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."gap_img" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "match_max" "qti"."__text_clza6vokfo" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__gap_img_pk_oadpealh6f" PRIMARY KEY ("id"),
  CONSTRAINT "__gap_img_key_interaction_identifier_5qh6wensmu" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "gap_img_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE)
);

CREATE TABLE "qti"."gap_img_left" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_img_left_pk_5kxajyeext" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_img_match_min" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__gap_img_match_min_pk_vsp5xzcl2b" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_img_object_label" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_img_object_label_pk_lx5yzccjdk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_img_top" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_img_top_pk_nd5oyfjo2a" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_binding" (
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__gap_match_binding_pk_5z6qjfwig6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_choices_container_width" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__gap_match_choices_container_width_pk_6rahwnyokh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_interaction" (
  "id" uuid NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__gap_match_interaction_pk_truencyy7v" PRIMARY KEY ("id"),
  CONSTRAINT "gap_match_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."gap_match_max_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__gap_match_max_associations_pk_weka56aw35" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_max_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_match_max_selections_message_pk_w3lzor3p5i" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_min_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__gap_match_min_associations_pk_wxfcfbwm4e" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_match_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__gap_match_min_selections_message_pk_yujqciiewz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."gap_text" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "match_max" "qti"."__text_clza6vokfo" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__gap_text_pk_sshinnml2z" PRIMARY KEY ("id"),
  CONSTRAINT "__gap_text_key_interaction_identifier_i7c52o5n3w" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "gap_text_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE)
);

CREATE TABLE "qti"."gap_text_match_min" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__gap_text_match_min_pk_2vhz2m627z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_associate_interaction" (
  "id" uuid NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__graphic_associate_interaction_pk_tcnmcfa3jf" PRIMARY KEY ("id"),
  CONSTRAINT "graphic_associate_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."graphic_associate_max_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__graphic_associate_max_associations_pk_lx76a5zpqz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_associate_min_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__graphic_associate_min_associations_pk_dmg7krabv6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_choices_container_width" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__graphic_gap_match_choices_container_width_pk_3fyicvih5p" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_interaction" (
  "id" uuid NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__graphic_gap_match_interaction_pk_bh753jolrv" PRIMARY KEY ("id"),
  CONSTRAINT "graphic_gap_match_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."graphic_gap_match_max_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__graphic_gap_match_max_associations_pk_f4f3p3rj3h" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_max_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__graphic_gap_match_max_selections_message_pk_wjitjcfrkh" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_min_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__graphic_gap_match_min_associations_pk_fmrpptxpuf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_gap_match_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__graphic_gap_match_min_selections_message_pk_cyaitmqigf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_order_interaction" (
  "id" uuid NOT NULL,
  "max_bound" "qti"."bound" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__graphic_order_interaction_pk_ed7gbegw3u" PRIMARY KEY ("id"),
  CONSTRAINT "graphic_order_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."graphic_order_max_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__graphic_order_max_choices_pk_ysahg6li2i" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_order_max_choices_n" (
  "node" uuid NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__graphic_order_max_choices_n_pk_xew52gsshr" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_order_min_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__graphic_order_min_choices_pk_mzzxhenc2x" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."graphic_order_min_choices_n" (
  "node" uuid NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__graphic_order_min_choices_n_pk_a2wncg2ho6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."h_1" (
  "id" uuid NOT NULL,
  CONSTRAINT "__h_1_pk_s7nnbct76s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_2" (
  "id" uuid NOT NULL,
  CONSTRAINT "__h_2_pk_dt4etjchyj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_3" (
  "id" uuid NOT NULL,
  CONSTRAINT "__h_3_pk_jb6taxp4np" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_4" (
  "id" uuid NOT NULL,
  CONSTRAINT "__h_4_pk_rjr4shbuuz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_5" (
  "id" uuid NOT NULL,
  CONSTRAINT "__h_5_pk_igexuabhf6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."h_6" (
  "id" uuid NOT NULL,
  CONSTRAINT "__h_6_pk_qnlvoo57ea" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."header" (
  "id" uuid NOT NULL,
  CONSTRAINT "__header_pk_rdky6gfe6r" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."headers_target" (
  "attribute" "qti"."idref_attribute" NOT NULL,
  "document" uuid NOT NULL,
  "node" uuid NOT NULL,
  "position" bigint NOT NULL,
  "target" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__headers_target_pk_ou2q2tyrt6" PRIMARY KEY ("node", "position"),
  CONSTRAINT "headers_target_attribute" CHECK (("attribute" = 'headers'::"qti"."idref_attribute") IS TRUE)
);

CREATE TABLE "qti"."hotspot_choice" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "shape" "qti"."shape" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__hotspot_choice_pk_excxcp6gdy" PRIMARY KEY ("id"),
  CONSTRAINT "__hotspot_choice_key_interaction_identifier_vadzdncytd" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."hotspot_choice_label" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hotspot_choice_label_pk_ncifu5tsjt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hotspot_interaction" (
  "id" uuid NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__hotspot_interaction_pk_y2zx6mmhwq" PRIMARY KEY ("id"),
  CONSTRAINT "hotspot_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."hotspot_max_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__hotspot_max_choices_pk_wg65gk3ibk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hotspot_max_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hotspot_max_selections_message_pk_l7w2klklea" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hotspot_min_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__hotspot_min_choices_pk_luzbwk22jq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hotspot_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hotspot_min_selections_message_pk_4w3snp4zbg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__hottext_pk_g57caygl5o" PRIMARY KEY ("id"),
  CONSTRAINT "__hottext_key_id_identifier_2wuv2ucdex" UNIQUE ("id", "identifier")
);

CREATE TABLE "qti"."hottext_interaction" (
  "id" uuid NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__hottext_interaction_pk_dadrenk2el" PRIMARY KEY ("id"),
  CONSTRAINT "hottext_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."hottext_max_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__hottext_max_choices_pk_u6rmo7yj2x" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext_max_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hottext_max_selections_message_pk_l6glnud2of" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext_min_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__hottext_min_choices_pk_setjscp7q7" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__hottext_min_selections_message_pk_ek3i6p2ogf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."hottext_owner" (
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__hottext_owner_pk_hd3zbwhwt4" PRIMARY KEY ("node"),
  CONSTRAINT "__hottext_owner_key_interaction_identifier_txfolsmyff" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."hr" (
  "id" uuid NOT NULL,
  CONSTRAINT "__hr_pk_new7e5gqql" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."html_id" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__html_id_pk_5qgpxb2xq3" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__html_id_key_node_jvsu27ct75" UNIQUE ("node"),
  CONSTRAINT "html_id_attribute" CHECK (("attribute" = 'id'::"qti"."attribute_name") IS TRUE),
  CONSTRAINT "__html_id_key_document_id_kind_mqib2r43zi" UNIQUE ("document", "id", "kind")
);

CREATE TABLE "qti"."i" (
  "id" uuid NOT NULL,
  CONSTRAINT "__i_pk_wwfkjncyt5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."inline_choice" (
  "fixed" "qti"."__text_cz7v66q3ce" NOT NULL,
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__inline_choice_pk_3bwlb7am3z" PRIMARY KEY ("id"),
  CONSTRAINT "__inline_choice_key_interaction_identifier_evsi6lmbzh" UNIQUE ("interaction", "identifier")
);

CREATE TABLE "qti"."inline_choice_interaction" (
  "id" uuid NOT NULL,
  "min_choices" "qti"."__text_clza6vokfo" NOT NULL,
  "required" "qti"."__text_cz7v66q3ce" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__inline_choice_interaction_pk_r6a7kcnm2x" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."inline_choice_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__inline_choice_min_selections_message_pk_iecb6d6wgx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."inline_choice_prompt" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__inline_choice_prompt_pk_l7ov55lkda" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."interaction_binding" ADD COLUMN "adaptive" "qti"."__text_cz7v66q3ce" DEFAULT 'false' NOT NULL;
ALTER TABLE "qti"."interaction_binding" ALTER COLUMN "adaptive" DROP DEFAULT;

ALTER TABLE "qti"."interaction_binding" ADD COLUMN "ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."interaction_binding" ALTER COLUMN "ancestry" DROP DEFAULT;

CREATE TABLE "qti"."interpolation_table" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" uuid NOT NULL,
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__interpolation_table_pk_67y4gy2vl3" PRIMARY KEY ("id"),
  CONSTRAINT "__interpolation_table_key_declaration_z3qoupdmkc" UNIQUE ("declaration"),
  CONSTRAINT "__interpolation_table_key_id_base_type_kiyufuhdc3" UNIQUE ("id", "base_type"),
  CONSTRAINT "__interpolation_table_key_id_declaration_base_type_ilcrff77rr" UNIQUE ("id", "declaration", "base_type")
);

CREATE TABLE "qti"."interpolation_table_default_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_pk_p64yw3phfc" PRIMARY KEY ("node"),
  CONSTRAINT "__interpolation_table_default_value_key_node_base_s2uewqvfbn" UNIQUE ("node", "base_type")
);

CREATE TABLE "qti"."interpolation_table_default_value_boolean" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_boolean_pk_leclysrmbf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_directed_pair" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_directed_pair_pk_2md4yd5jou" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_duration" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_duration_pk_45w7cz6xz6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_file" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_file_pk_ixtp6jgewb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_float" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_float_pk_wjntdmwfkt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_identifier" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_identifier_pk_6xaj2wkcem" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_integer" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_integer_pk_62kt3asfa6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_pair" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_pair_pk_rjztvteh3s" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_point" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_point_pk_ol3hfoievf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_string" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_string_pk_xaknb2inap" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_default_value_uri" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__interpolation_table_default_value_uri_pk_ustdi3xkxx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."interpolation_table_entry" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" uuid NOT NULL,
  "id" uuid NOT NULL,
  "include_boundary" "qti"."__text_cz7v66q3ce" NOT NULL,
  "position" bigint NOT NULL,
  "source_value" "qti"."__text_jld3q663or" NOT NULL,
  "table" uuid NOT NULL,
  CONSTRAINT "__interpolation_table_entry_pk_rkjraoxw2e" PRIMARY KEY ("id"),
  CONSTRAINT "__interpolation_table_entry_key_id_base_type_dh5agevx46" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."interpolation_table_entry_boolean" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_boolean_pk_fgppuv355x" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_directed_pair" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_directed_pair_pk_ow2bh2qxfu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_duration" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_duration_pk_heivmffdhk" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_file" (
  "id" uuid NOT NULL,
  "target_value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_file_pk_v6iij7abxy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_float" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_float_pk_dzyp45w6f7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_identifier" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_identifier_pk_7bn7aw2vkn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_integer" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_integer_pk_tegso7hxyo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_pair" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_pair_pk_hbgtirkqb2" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_point" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_point_pk_b6asn7d5nq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_string" (
  "id" uuid NOT NULL,
  "target_value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_string_pk_sdtb6f7vnx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."interpolation_table_entry_uri" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__interpolation_table_entry_uri_pk_pzsbq2gzcn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."item_body_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__item_body_id_pk_ibzhodnt2d" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__item_body_id_key_node_hel7ph2kih" UNIQUE ("node")
);

CREATE TABLE "qti"."item_tool" (
  "shape" "qti"."tool_shape" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_pk_gya4gminyx" PRIMARY KEY ("tree"),
  CONSTRAINT "__item_tool_key_tree_shape_sxpyh5o4hw" UNIQUE ("tree", "shape")
);

CREATE TABLE "qti"."item_tool_both" (
  "tool_name" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tool_version" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_both_pk_nldegtbsdk" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."item_tool_name" (
  "tool_name" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_name_pk_gnib6ywzt6" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."item_tool_version" (
  "tool_version" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_version_pk_45jqniwisg" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."kbd" (
  "id" uuid NOT NULL,
  CONSTRAINT "__kbd_pk_4t7uulxl4b" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."label" (
  "id" uuid NOT NULL,
  CONSTRAINT "__label_pk_gp6tjgeyb4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."li" (
  "id" uuid NOT NULL,
  CONSTRAINT "__li_pk_ydmic7uqhs" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."lom_language" ADD COLUMN "owner" "qti"."lom_owner" DEFAULT 'manifest' NOT NULL;
ALTER TABLE "qti"."lom_language" ALTER COLUMN "owner" DROP DEFAULT;

ALTER TABLE "qti"."lom_language" ADD COLUMN "parent_kind" "qti"."node_kind" DEFAULT 'lom:general' NOT NULL;
ALTER TABLE "qti"."lom_language" ALTER COLUMN "parent_kind" DROP DEFAULT;

ALTER TABLE "qti"."lom_language" ALTER COLUMN "value" TYPE "qti"."__text_osqmo2ktsg" USING "value"::"qti"."__text_osqmo2ktsg";

ALTER TABLE "qti"."lom_string_language" ALTER COLUMN "value" TYPE "qti"."__text_osqmo2ktsg" USING "value"::"qti"."__text_osqmo2ktsg";

CREATE TABLE "qti"."map_entry" (
  "base_type" "qti"."base_type" NOT NULL,
  "case_sensitive" "qti"."__text_cz7v66q3ce" NOT NULL,
  "declaration" uuid NOT NULL,
  "id" uuid NOT NULL,
  "mapped_value" "qti"."__text_jld3q663or" NOT NULL,
  "mapping" uuid NOT NULL,
  "position" bigint NOT NULL,
  CONSTRAINT "__map_entry_pk_o4kdajxbdx" PRIMARY KEY ("id"),
  CONSTRAINT "__map_entry_key_id_base_type_sbbzktopwt" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."map_entry_boolean" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__map_entry_boolean_pk_ghzpm363cj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_directed_pair" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__map_entry_directed_pair_pk_rhwnmt6vb7" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_duration" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__map_entry_duration_pk_tssl3snqct" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_file" (
  "id" uuid NOT NULL,
  "map_key" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__map_entry_file_pk_yy2f6xknqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_float" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__map_entry_float_pk_vfjprewvv6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_identifier" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__map_entry_identifier_pk_4a6bgjmsi6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_integer" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__map_entry_integer_pk_jvux6madxj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_pair" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__map_entry_pair_pk_3pp7y7otms" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_point" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__map_entry_point_pk_wf3oy4fiua" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_string" (
  "id" uuid NOT NULL,
  "map_key" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__map_entry_string_pk_d5bkmyxqop" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."map_entry_uri" (
  "id" uuid NOT NULL,
  "map_key" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__map_entry_uri_pk_zufh7rc7pf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."mappable_base_type" (
  "base_type" "qti"."base_type" NOT NULL,
  CONSTRAINT "__mappable_base_type_pk_do2yz57cxw" PRIMARY KEY ("base_type")
);

CREATE TABLE "qti"."mapping" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" uuid NOT NULL,
  "default_value" "qti"."__text_jld3q663or" NOT NULL,
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__mapping_pk_lichj2blf4" PRIMARY KEY ("id"),
  CONSTRAINT "__mapping_key_declaration_v75cz6uboq" UNIQUE ("declaration"),
  CONSTRAINT "__mapping_key_id_declaration_qllmcbosoo" UNIQUE ("id", "declaration")
);

CREATE TABLE "qti"."mapping_lower_bound" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__mapping_lower_bound_pk_yu3vpi7gvy" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."mapping_upper_bound" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__mapping_upper_bound_pk_pupgxtnhsx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_first_column_header" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_first_column_header_pk_svldzuzlzf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_group" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_uc3mvgolsg" NOT NULL,
  CONSTRAINT "__match_group_pk_b7xlgyt6vj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_interaction" (
  "id" uuid NOT NULL,
  "max_associations_n" bigint NOT NULL,
  "min_associations_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__match_interaction_pk_kzajbfb36r" PRIMARY KEY ("id"),
  CONSTRAINT "match_bounds" CHECK (("max_associations_n" = 0::bigint OR "min_associations_n" <= "max_associations_n") IS TRUE)
);

CREATE TABLE "qti"."match_max_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__match_max_associations_pk_4muikr2sas" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_max_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_max_selections_message_pk_hddyoprmax" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_min_associations" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__match_min_associations_pk_mz26ksln7d" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_min_selections_message_pk_njui6gv74s" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" uuid NOT NULL,
  "document" uuid NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "__match_table_pk_u6pxplfh2b" PRIMARY KEY ("id"),
  CONSTRAINT "__match_table_key_declaration_ycwum7vr5c" UNIQUE ("declaration"),
  CONSTRAINT "__match_table_key_id_base_type_f43rhhsg72" UNIQUE ("id", "base_type"),
  CONSTRAINT "__match_table_key_id_declaration_base_type_4ig6tpcsge" UNIQUE ("id", "declaration", "base_type")
);

CREATE TABLE "qti"."match_table_default_value" (
  "base_type" "qti"."base_type" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__match_table_default_value_pk_cpydlc6yco" PRIMARY KEY ("node"),
  CONSTRAINT "__match_table_default_value_key_node_base_type_ixuac7thez" UNIQUE ("node", "base_type")
);

CREATE TABLE "qti"."match_table_default_value_boolean" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__match_table_default_value_boolean_pk_c3yaz4vhew" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_directed_pair" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__match_table_default_value_directed_pair_pk_hmhiuwnyyp" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_duration" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__match_table_default_value_duration_pk_ynqxnj4ads" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_file" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_default_value_file_pk_7xoe2nemiv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_float" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__match_table_default_value_float_pk_hchtcdm4os" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_identifier" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__match_table_default_value_identifier_pk_u56qokdzm3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_integer" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__match_table_default_value_integer_pk_vhcmhuzptm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_pair" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__match_table_default_value_pair_pk_4gje5xsxd3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_point" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__match_table_default_value_point_pk_vukcahs27m" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_string" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_default_value_string_pk_seetft5647" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_default_value_uri" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__match_table_default_value_uri_pk_ke6xxdcl7h" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."match_table_entry" (
  "base_type" "qti"."base_type" NOT NULL,
  "declaration" uuid NOT NULL,
  "id" uuid NOT NULL,
  "position" bigint NOT NULL,
  "source_value" "qti"."__text_jld3q663or" NOT NULL,
  "table" uuid NOT NULL,
  CONSTRAINT "__match_table_entry_pk_jtjn6vj2o2" PRIMARY KEY ("id"),
  CONSTRAINT "__match_table_entry_key_id_base_type_x4qzwkfrmj" UNIQUE ("id", "base_type")
);

CREATE TABLE "qti"."match_table_entry_boolean" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_f63vbnbw4t" NOT NULL,
  CONSTRAINT "__match_table_entry_boolean_pk_65nzkqrl27" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_directed_pair" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__match_table_entry_directed_pair_pk_ohz6lpn5gw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_duration" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__match_table_entry_duration_pk_uamxvtc76c" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_file" (
  "id" uuid NOT NULL,
  "target_value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_entry_file_pk_53efu22wmd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_float" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_jld3q663or" NOT NULL,
  CONSTRAINT "__match_table_entry_float_pk_v2ipzxudfg" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_identifier" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__match_table_entry_identifier_pk_qcwubxkzmx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_integer" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_qtkbmkpj6l" NOT NULL,
  CONSTRAINT "__match_table_entry_integer_pk_mxmibks7e6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_pair" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_d72l462ftm" NOT NULL,
  CONSTRAINT "__match_table_entry_pair_pk_c4ivpkyesy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_point" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_7grqskvjta" NOT NULL,
  CONSTRAINT "__match_table_entry_point_pk_gtqlreih2v" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_string" (
  "id" uuid NOT NULL,
  "target_value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__match_table_entry_string_pk_5ml3tck5lw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."match_table_entry_uri" (
  "id" uuid NOT NULL,
  "target_value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__match_table_entry_uri_pk_dougyrgf3t" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."media_coords" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_a4spx6pjqw" NOT NULL,
  CONSTRAINT "__media_coords_pk_hyulvnkuge" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."media_interaction" (
  "autostart" "qti"."__text_cz7v66q3ce" NOT NULL,
  "id" uuid NOT NULL,
  "loop" "qti"."__text_cz7v66q3ce" NOT NULL,
  "max_plays_n" bigint NOT NULL,
  "min_plays_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__media_interaction_pk_zc6m2idown" PRIMARY KEY ("id"),
  CONSTRAINT "media_plays" CHECK (("max_plays_n" = 0::bigint OR "max_plays_n" >= "min_plays_n") IS TRUE)
);

CREATE TABLE "qti"."media_max_plays" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__media_max_plays_pk_x3qjbctv7r" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."media_min_plays" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__media_min_plays_pk_otgxspth7m" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."modal_feedback" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "outcome_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__modal_feedback_pk_pbw24nbtuf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."modal_feedback_title" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__modal_feedback_title_pk_u37k3u2ro4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."nav" (
  "id" uuid NOT NULL,
  CONSTRAINT "__nav_pk_hmz6zfailf" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."node" ADD COLUMN "ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."node" ALTER COLUMN "ancestry" DROP DEFAULT;

CREATE TABLE "qti"."node_catalog_idref" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "document" uuid NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__node_catalog_idref_pk_rc3gazfvux" PRIMARY KEY ("node"),
  CONSTRAINT "node_catalog_idref_attribute" CHECK (("attribute" = 'data-catalog-idref'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_class" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_ieskz75v7g" NOT NULL,
  CONSTRAINT "__node_class_pk_ojngbanp7o" PRIMARY KEY ("node"),
  CONSTRAINT "node_class_attribute" CHECK (("attribute" = 'class'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_dir" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_o3dskk7ctt" NOT NULL,
  CONSTRAINT "__node_dir_pk_vy3shfk4mm" PRIMARY KEY ("node"),
  CONSTRAINT "bdo_dir_not_auto" CHECK (("kind" <> 'bdo'::"qti"."node_kind" OR "value" <> 'auto'::text) IS TRUE),
  CONSTRAINT "node_dir_attribute" CHECK (("attribute" = 'dir'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_label" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "tree" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__node_label_pk_ul4c3jwnej" PRIMARY KEY ("node"),
  CONSTRAINT "node_label_attribute" CHECK (("attribute" = 'label'::"qti"."attribute_name") IS TRUE),
  CONSTRAINT "node_label_not_root" CHECK (("kind" <> 'qti-assessment-item'::"qti"."node_kind") IS TRUE)
);

CREATE TABLE "qti"."node_lang" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_o3e7dedzyv" NOT NULL,
  CONSTRAINT "__node_lang_pk_cjnbevszok" PRIMARY KEY ("node"),
  CONSTRAINT "node_lang_attribute" CHECK (("attribute" = 'lang'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_suppress_tts" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_hawigbfw6m" NOT NULL,
  CONSTRAINT "__node_suppress_tts_pk_wyuumllrj2" PRIMARY KEY ("node"),
  CONSTRAINT "node_suppress_tts_attribute" CHECK (("attribute" = 'data-qti-suppress-tts'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_xml_base" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__node_xml_base_pk_4zdbjpozg6" PRIMARY KEY ("node"),
  CONSTRAINT "node_xml_base_attribute" CHECK (("attribute" = 'xml:base'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."node_xml_lang" (
  "attribute" "qti"."attribute_name" NOT NULL,
  "kind" "qti"."node_kind" NOT NULL,
  "node" uuid NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "tree" uuid NOT NULL,
  "value" "qti"."__text_o3e7dedzyv" NOT NULL,
  CONSTRAINT "__node_xml_lang_pk_r3adyrsf3j" PRIMARY KEY ("node"),
  CONSTRAINT "node_xml_lang_attribute" CHECK (("attribute" = 'xml:lang'::"qti"."attribute_name") IS TRUE)
);

CREATE TABLE "qti"."object" (
  "data" "qti"."__text_k3z6naurdo" NOT NULL,
  "id" uuid NOT NULL,
  "type" "qti"."__text_ifp42a6zk6" NOT NULL,
  CONSTRAINT "__object_pk_mcbj24pg5k" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."object_height" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__object_height_pk_42aoo26esd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."object_width" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__object_width_pk_q7ou5epbgl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."ol" (
  "id" uuid NOT NULL,
  CONSTRAINT "__ol_pk_5fcuownphv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."order_choices_container_width" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__order_choices_container_width_pk_j6fon4zjzl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_interaction" (
  "id" uuid NOT NULL,
  "max_bound" "qti"."bound" NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "shuffle" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__order_interaction_pk_q6xg3wjegm" PRIMARY KEY ("id"),
  CONSTRAINT "order_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."order_max_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__order_max_choices_pk_gw3wsvt4pu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_max_choices_n" (
  "node" uuid NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__order_max_choices_n_pk_cmmr44seu5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_max_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__order_max_selections_message_pk_vua276fnuf" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_min_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__order_min_choices_pk_w7ugjt7wre" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_min_choices_n" (
  "node" uuid NOT NULL,
  "value" bigint NOT NULL,
  CONSTRAINT "__order_min_choices_n_pk_mxz7gfclkx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_min_selections_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__order_min_selections_message_pk_fphf4sh4dt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."order_orientation" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_yakcqa4zli" NOT NULL,
  CONSTRAINT "__order_orientation_pk_zbe3m4k476" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."param" (
  "id" uuid NOT NULL,
  "name" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "valuetype" "qti"."__text_5zvd6hcv2x" NOT NULL,
  CONSTRAINT "__param_pk_7356wp3t74" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."param_type" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_ifp42a6zk6" NOT NULL,
  CONSTRAINT "__param_type_pk_uwpvwiemux" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."picture" (
  "id" uuid NOT NULL,
  CONSTRAINT "__picture_pk_tqxijhprxy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."position_object_center_point" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_h4r6alp6hk" NOT NULL,
  CONSTRAINT "__position_object_center_point_pk_e27gq5glwj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."position_object_interaction" (
  "id" uuid NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__position_object_interaction_pk_66boholg6x" PRIMARY KEY ("id"),
  CONSTRAINT "position_object_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."position_object_max_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__position_object_max_choices_pk_e3wlry3zkz" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."position_object_min_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__position_object_min_choices_pk_onjhyyrl35" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."position_object_stage" (
  "id" uuid NOT NULL,
  CONSTRAINT "__position_object_stage_pk_6k2maeenqb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."pre" (
  "id" uuid NOT NULL,
  CONSTRAINT "__pre_pk_k4mxtyvwgb" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."printed_variable" (
  "base" "qti"."__text_djykoynpls" NOT NULL,
  "delimiter" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "mapping_indicator" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "power_form" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__printed_variable_pk_zjza3rwjwj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."printed_variable_field" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__printed_variable_field_pk_ru472spcis" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."printed_variable_format" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_awt4t5kosa" NOT NULL,
  CONSTRAINT "__printed_variable_format_pk_e5cr6ooplp" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."printed_variable_id" (
  "document" uuid NOT NULL,
  "id" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__printed_variable_id_pk_uow5oqhfb2" PRIMARY KEY ("document", "id"),
  CONSTRAINT "__printed_variable_id_key_node_dqzglovtb6" UNIQUE ("node")
);

CREATE TABLE "qti"."printed_variable_index" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_djykoynpls" NOT NULL,
  CONSTRAINT "__printed_variable_index_pk_3jz6zoqrjt" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."printed_variable_ref" (
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__printed_variable_ref_pk_4a3jyykasc" PRIMARY KEY ("node"),
  CONSTRAINT "printed_variable_ref_kind" CHECK (("kind" IN ('outcome'::"qti"."declaration_kind", 'template'::"qti"."declaration_kind")) IS TRUE)
);

CREATE TABLE "qti"."printed_variable_var_ref" (
  "attribute" "qti"."printed_variable_attr" NOT NULL,
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "kind" "qti"."declaration_kind" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__printed_variable_var_ref_pk_c74atqjib4" PRIMARY KEY ("node", "attribute"),
  CONSTRAINT "printed_variable_var_ref_type" CHECK (("kind" IN ('outcome'::"qti"."declaration_kind", 'template'::"qti"."declaration_kind") AND "base_type" = 'integer'::"qti"."base_type" AND "cardinality" = 'single'::"qti"."typed_cardinality") IS TRUE)
);

CREATE TABLE "qti"."q" (
  "id" uuid NOT NULL,
  CONSTRAINT "__q_pk_xlyzy6fet4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."q_cite" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_k3z6naurdo" NOT NULL,
  CONSTRAINT "__q_cite_pk_223msu2ij4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."qti_label" (
  "id" uuid NOT NULL,
  CONSTRAINT "__qti_label_pk_qgt6qcvdyq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rb" (
  "id" uuid NOT NULL,
  CONSTRAINT "__rb_pk_q4bbsh73em" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."record_binding_fit" (
  "interaction_kind" "qti"."node_kind" NOT NULL,
  CONSTRAINT "__record_binding_fit_pk_w5zm2vgswj" PRIMARY KEY ("interaction_kind")
);

CREATE TABLE "qti"."resource_lom_general" (
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__resource_lom_general_pk_4gbfhozbtg" PRIMARY KEY ("lom"),
  CONSTRAINT "__resource_lom_general_key_package_resource_fmb6hj3zia" UNIQUE ("package", "resource")
);

CREATE TABLE "qti"."resource_lom_language_set" (
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "value" "qti"."__text_osqmo2ktsg" NOT NULL,
  CONSTRAINT "__resource_lom_language_set_pk_shj4yzlqx6" PRIMARY KEY ("lom", "value"),
  CONSTRAINT "__resource_lom_language_set_key_package_resource_rgsl255stw" UNIQUE ("package", "resource", "value")
);

CREATE TABLE "qti"."rp" (
  "id" uuid NOT NULL,
  CONSTRAINT "__rp_pk_aimimmimmq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rt" (
  "id" uuid NOT NULL,
  CONSTRAINT "__rt_pk_yh6kwgvuby" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rtc" (
  "id" uuid NOT NULL,
  CONSTRAINT "__rtc_pk_7u7w4flucm" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rubric_block" (
  "id" uuid NOT NULL,
  "use" "qti"."__text_kcydnvglpj" NOT NULL,
  "view" "qti"."__text_5lyuoloiou" NOT NULL,
  CONSTRAINT "__rubric_block_pk_cqgektzb52" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rubric_template_block" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__rubric_template_block_pk_2spkmf6x3o" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."rubric_template_inline" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__rubric_template_inline_pk_t5tzr7x7yx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."ruby" (
  "id" uuid NOT NULL,
  CONSTRAINT "__ruby_pk_ihbym6vvoy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."samp" (
  "id" uuid NOT NULL,
  CONSTRAINT "__samp_pk_cykxtsogoo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."section" (
  "id" uuid NOT NULL,
  CONSTRAINT "__section_pk_z4zr6k2j4z" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."select_point_interaction" (
  "id" uuid NOT NULL,
  "max_choices_n" bigint NOT NULL,
  "min_choices_n" bigint NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__select_point_interaction_pk_ryf6o3jzsi" PRIMARY KEY ("id"),
  CONSTRAINT "select_point_choice_bounds" CHECK (("max_choices_n" = 0::bigint OR "min_choices_n" <= "max_choices_n") IS TRUE)
);

CREATE TABLE "qti"."select_point_max_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__select_point_max_choices_pk_ncute6odej" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."select_point_min_choices" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__select_point_min_choices_pk_ltzbormr4j" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_associable_choice" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "interaction" uuid NOT NULL,
  "match_max" "qti"."__text_clza6vokfo" NOT NULL,
  "match_max_n" bigint NOT NULL,
  "match_min_n" bigint NOT NULL,
  CONSTRAINT "__simple_associable_choice_pk_al7tbaciyh" PRIMARY KEY ("id"),
  CONSTRAINT "__simple_associable_choice_key_interaction_3e4ddfehya" UNIQUE ("interaction", "identifier"),
  CONSTRAINT "simple_associable_choice_bounds" CHECK (("match_max_n" = 0::bigint OR "match_max_n" >= "match_min_n") IS TRUE),
  CONSTRAINT "__simple_associable_choice_key_id_interaction_zajgnsnc4k" UNIQUE ("id", "interaction")
);

CREATE TABLE "qti"."simple_associable_choice_fixed" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__simple_associable_choice_fixed_pk_otda3s6yzc" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_associable_choice_match_min" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__simple_associable_choice_match_min_pk_mrx7hf5ard" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_associable_choice_match_set" (
  "interaction" uuid NOT NULL,
  "match_set" uuid NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__simple_associable_choice_match_set_pk_2da2c3u5cl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_associable_choice_show_hide" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__simple_associable_choice_show_hide_pk_6j7rnun3t2" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."simple_match_set" (
  "id" uuid NOT NULL,
  CONSTRAINT "__simple_match_set_pk_6wbzzj4zti" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."slider_interaction" (
  "id" uuid NOT NULL,
  "lower_bound" "qti"."__text_tq7gq2jmkl" NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  "step_label" "qti"."__text_cz7v66q3ce" NOT NULL,
  "upper_bound" "qti"."__text_tq7gq2jmkl" NOT NULL,
  CONSTRAINT "__slider_interaction_pk_trtgcbkiyq" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."slider_orientation" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_yakcqa4zli" NOT NULL,
  CONSTRAINT "__slider_orientation_pk_b6yffcevuk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."slider_reverse" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__slider_reverse_pk_xejdznfvqv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."slider_step" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_acxfo763jg" NOT NULL,
  CONSTRAINT "__slider_step_pk_niqd6ookmn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."small" (
  "id" uuid NOT NULL,
  CONSTRAINT "__small_pk_tc7vyfho3z" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."source" (
  "id" uuid NOT NULL,
  "parent_kind" "qti"."node_kind" NOT NULL,
  "src" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_pk_rlnpuhll37" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."source_media" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_media_pk_hsiggnlzak" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."source_sizes" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_sizes_pk_upwsb556bm" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."source_srcset" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__source_srcset_pk_x3zue5jzvj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."source_type" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_ifp42a6zk6" NOT NULL,
  CONSTRAINT "__source_type_pk_chy3eulfpk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."span" (
  "id" uuid NOT NULL,
  CONSTRAINT "__span_pk_hixy2fbcsc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."string_binding" (
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__string_binding_pk_plk6isv3rb" PRIMARY KEY ("node"),
  CONSTRAINT "__string_binding_key_document_identifier_xeyjihlm73" UNIQUE ("document", "identifier")
);

CREATE TABLE "qti"."strong" (
  "id" uuid NOT NULL,
  CONSTRAINT "__strong_pk_thqpgpemnj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."stylesheet" (
  "href" "qti"."__text_k3z6naurdo" NOT NULL,
  "id" uuid NOT NULL,
  "type" "qti"."__text_ifp42a6zk6" NOT NULL,
  CONSTRAINT "__stylesheet_pk_5vkhjjv37r" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."stylesheet_media" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__stylesheet_media_pk_qw5bik2ean" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."stylesheet_title" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__stylesheet_title_pk_3uxjxbfslg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."sub" (
  "id" uuid NOT NULL,
  CONSTRAINT "__sub_pk_tsjpuejboy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."summary" (
  "id" uuid NOT NULL,
  CONSTRAINT "__summary_pk_rpajkerfah" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."sup" (
  "id" uuid NOT NULL,
  CONSTRAINT "__sup_pk_frze47uv4x" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."table" (
  "id" uuid NOT NULL,
  CONSTRAINT "__table_pk_zrpr6gzk7s" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."table_summary" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__table_summary_pk_hrkauj7n5d" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."tbody" (
  "id" uuid NOT NULL,
  CONSTRAINT "__tbody_pk_wc7xodoiio" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."td" (
  "id" uuid NOT NULL,
  CONSTRAINT "__td_pk_2jyw55d5yr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."td_abbr" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__td_abbr_pk_nyuzne34rw" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_align" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_oy6p76tbqw" NOT NULL,
  CONSTRAINT "__td_align_pk_7f7oa3lxzq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_axis" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__td_axis_pk_ccm7jnxuxe" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_colspan" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__td_colspan_pk_wqi7s3iwct" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_rowspan" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__td_rowspan_pk_x5fgi536su" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_scope" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_wjqnoy6t2y" NOT NULL,
  CONSTRAINT "__td_scope_pk_kdday7nnxa" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."td_valign" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_ocl2hjarfs" NOT NULL,
  CONSTRAINT "__td_valign_pk_vvlb7gthww" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."template" (
  "id" uuid NOT NULL,
  CONSTRAINT "__template_pk_xgiwtohz5u" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_block" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__template_block_pk_4qlrw3bxyi" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_content_ref" (
  "base_type" "qti"."base_type" NOT NULL,
  "cardinality" "qti"."typed_cardinality" NOT NULL,
  "document" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__template_content_ref_pk_2vkn4j32ah" PRIMARY KEY ("node"),
  CONSTRAINT "template_content_ref_type" CHECK (("cardinality" IN ('single'::"qti"."typed_cardinality", 'multiple'::"qti"."typed_cardinality") AND "base_type" = 'identifier'::"qti"."base_type") IS TRUE)
);

CREATE TABLE "qti"."template_declaration_arm" (
  "id" uuid NOT NULL,
  "math_variable" "qti"."__text_cz7v66q3ce" NOT NULL,
  "param_variable" "qti"."__text_cz7v66q3ce" NOT NULL,
  CONSTRAINT "__template_declaration_arm_pk_ekiad5g2nx" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_feedback_block" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "outcome_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."__text_i67gmkzdk7" NOT NULL,
  CONSTRAINT "__template_feedback_block_pk_4wuud44jqr" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."template_inline" (
  "id" uuid NOT NULL,
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "show_hide" "qti"."show_hide" NOT NULL,
  "template_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__template_inline_pk_p3qg43hxvz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."text_entry_expected_length" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__text_entry_expected_length_pk_f53z7x3ss3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_format" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_format_pk_5wceemjq3z" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_interaction" (
  "base" "qti"."__text_xs56r6cx4y" NOT NULL,
  "id" uuid NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__text_entry_interaction_pk_4c2k2repwn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."text_entry_pattern_mask" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_pattern_mask_pk_fcak65viuo" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_patternmask_message" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_patternmask_message_pk_kkvaka53wd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."text_entry_placeholder_text" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__text_entry_placeholder_text_pk_q3cw6blcc7" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."tfoot" (
  "id" uuid NOT NULL,
  CONSTRAINT "__tfoot_pk_4dnzrktqln" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."th" (
  "id" uuid NOT NULL,
  CONSTRAINT "__th_pk_uw2e653afd" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."th_abbr" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__th_abbr_pk_fhu4xjcgf6" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_align" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_oy6p76tbqw" NOT NULL,
  CONSTRAINT "__th_align_pk_egix2hvisj" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_axis" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__th_axis_pk_cot3hl23j5" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_colspan" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__th_colspan_pk_7hlqinqtpu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_rowspan" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_t27tgfubfq" NOT NULL,
  CONSTRAINT "__th_rowspan_pk_u6umuf7fkb" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_scope" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_wjqnoy6t2y" NOT NULL,
  CONSTRAINT "__th_scope_pk_kpt6pqgngg" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."th_valign" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_ocl2hjarfs" NOT NULL,
  CONSTRAINT "__th_valign_pk_2wugry3fwr" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."thead" (
  "id" uuid NOT NULL,
  CONSTRAINT "__thead_pk_eqinaidk6f" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."tr" (
  "id" uuid NOT NULL,
  CONSTRAINT "__tr_pk_r6lilbc7ec" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."track" (
  "id" uuid NOT NULL,
  "kind" "qti"."__text_dbdfklalek" NOT NULL,
  "src" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__track_pk_vqi4hhy75h" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."track_default" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__track_default_pk_tg3uf4jye5" PRIMARY KEY ("node"),
  CONSTRAINT "track_default_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'default'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."track_srclang" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_o3e7dedzyv" NOT NULL,
  CONSTRAINT "__track_srclang_pk_xvp24vvm35" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."tt" (
  "id" uuid NOT NULL,
  CONSTRAINT "__tt_pk_tmvvhmsrkh" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."typed_declaration" ADD COLUMN "kind" "qti"."declaration_kind" DEFAULT 'response' NOT NULL;
ALTER TABLE "qti"."typed_declaration" ALTER COLUMN "kind" DROP DEFAULT;

CREATE TABLE "qti"."ul" (
  "id" uuid NOT NULL,
  CONSTRAINT "__ul_pk_zzyb4snodu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."upload_interaction" (
  "id" uuid NOT NULL,
  "response_identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "root_kind" "qti"."root_kind" NOT NULL,
  CONSTRAINT "__upload_interaction_pk_fyqv5l6bq4" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."upload_type" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_oy4m3tqgfd" NOT NULL,
  CONSTRAINT "__upload_type_pk_3kggtfbrfq" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."var" (
  "id" uuid NOT NULL,
  CONSTRAINT "__var_pk_7vlnptqnkv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."video" (
  "id" uuid NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_pk_p5d5gq5j4y" PRIMARY KEY ("id"),
  CONSTRAINT "__video_key_id_version_65sd4fkbyx" UNIQUE ("id", "version")
);

CREATE TABLE "qti"."video_autoplay" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_autoplay_pk_r2elao64cp" PRIMARY KEY ("node"),
  CONSTRAINT "video_autoplay_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'autoplay'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_controls" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_controls_pk_mdl3aj52kp" PRIMARY KEY ("node"),
  CONSTRAINT "video_controls_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'controls'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_crossorigin" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_dqq6r4bdbe" NOT NULL,
  CONSTRAINT "__video_crossorigin_pk_c3arw7o75g" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_height" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__video_height_pk_ty67tcu4z3" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_loop" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_loop_pk_7cffrvupqb" PRIMARY KEY ("node"),
  CONSTRAINT "video_loop_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'loop'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_mediagroup" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__video_mediagroup_pk_svyg5qrz5y" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_muted" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__video_muted_pk_izxjhayjoe" PRIMARY KEY ("node"),
  CONSTRAINT "video_muted_by_version" CHECK ((("value" IN ('true'::text, 'false'::text, '1'::text, '0'::text) OR "version" <> '3.0.0'::"qti"."schema_version") AND ("value" IN ('true'::text, 'false'::text, 'muted'::text) OR "version" <> '3.0.1'::"qti"."schema_version")) IS TRUE)
);

CREATE TABLE "qti"."video_poster" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__video_poster_pk_ar5e4wlfb4" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_preload" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_72jqunyi7z" NOT NULL,
  CONSTRAINT "__video_preload_pk_p5b37jnj5t" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_src" (
  "node" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__video_src_pk_cuwhl4exxk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."video_width" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_7mulu52tr6" NOT NULL,
  CONSTRAINT "__video_width_pk_exjzuavufg" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."a" ADD COLUMN "__tag_kind_a_nnzx4rhgd5" "qti"."node_kind" GENERATED ALWAYS AS ('a'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."abbr" ADD COLUMN "__tag_kind_abbr_hrjkr2qds6" "qti"."node_kind" GENERATED ALWAYS AS ('abbr'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."acronym" ADD COLUMN "__tag_kind_acronym_vins4r6mib" "qti"."node_kind" GENERATED ALWAYS AS ('acronym'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."address" ADD COLUMN "__tag_kind_address_v7uvpjblbr" "qti"."node_kind" GENERATED ALWAYS AS ('address'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."area_map_entry" ADD COLUMN "__tag_kind_qti_area_map_entry_ipn4oixdsm" "qti"."node_kind" GENERATED ALWAYS AS ('qti-area-map-entry'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."area_mapping" ADD COLUMN "__tag_kind_qti_area_mapping_rozg3o46o7" "qti"."node_kind" GENERATED ALWAYS AS ('qti-area-mapping'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."area_mapping" ADD COLUMN "__tag_base_type_point_t72vrgkw7u" "qti"."base_type" GENERATED ALWAYS AS ('point'::"qti"."base_type") STORED NOT NULL;

ALTER TABLE "qti"."article" ADD COLUMN "__tag_kind_article_q5bbr6phbo" "qti"."node_kind" GENERATED ALWAYS AS ('article'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."aside" ADD COLUMN "__tag_kind_aside_623qjlqyr6" "qti"."node_kind" GENERATED ALWAYS AS ('aside'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."associable_hotspot" ADD COLUMN "__tag_kind_qti_associable_hotspot_s44ub3cnnd" "qti"."node_kind" GENERATED ALWAYS AS ('qti-associable-hotspot'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."associate_interaction" ADD COLUMN "__tag_kind_qti_associate_interaction_mmhr3ccr2w" "qti"."node_kind" GENERATED ALWAYS AS ('qti-associate-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."audio" ADD COLUMN "__tag_kind_audio_ody3p7lpzb" "qti"."node_kind" GENERATED ALWAYS AS ('audio'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."b" ADD COLUMN "__tag_kind_b_eugn3uhkgh" "qti"."node_kind" GENERATED ALWAYS AS ('b'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."bdi" ADD COLUMN "__tag_kind_bdi_bpifxwd52f" "qti"."node_kind" GENERATED ALWAYS AS ('bdi'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."bdo" ADD COLUMN "__tag_kind_bdo_wrzsnb2sme" "qti"."node_kind" GENERATED ALWAYS AS ('bdo'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."big" ADD COLUMN "__tag_kind_big_5cuhs57aze" "qti"."node_kind" GENERATED ALWAYS AS ('big'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."blockquote" ADD COLUMN "__tag_kind_blockquote_pzalnulzij" "qti"."node_kind" GENERATED ALWAYS AS ('blockquote'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."br" ADD COLUMN "__tag_kind_br_e2kqhk7bmv" "qti"."node_kind" GENERATED ALWAYS AS ('br'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."caption" ADD COLUMN "__tag_kind_caption_5ewe5uufgf" "qti"."node_kind" GENERATED ALWAYS AS ('caption'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."catalog_info" ADD COLUMN "__tag_kind_qti_catalog_info_s44bpzmt5j" "qti"."node_kind" GENERATED ALWAYS AS ('qti-catalog-info'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."choice_template_ref" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."cite" ADD COLUMN "__tag_kind_cite_4ll5xji4xt" "qti"."node_kind" GENERATED ALWAYS AS ('cite'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."code" ADD COLUMN "__tag_kind_code_2sjxqe2lm5" "qti"."node_kind" GENERATED ALWAYS AS ('code'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."col" ADD COLUMN "__tag_kind_col_5ijislolfm" "qti"."node_kind" GENERATED ALWAYS AS ('col'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."colgroup" ADD COLUMN "__tag_kind_colgroup_3gqxythtyf" "qti"."node_kind" GENERATED ALWAYS AS ('colgroup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."companion_materials_info" ADD COLUMN "__tag_kind_qti_companion_materials_info_ndsygptfy3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-companion-materials-info'::"qti"."node_kind") STORED NOT NULL;

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

ALTER TABLE "qti"."dd" ADD COLUMN "__tag_kind_dd_fz7u3fe6ih" "qti"."node_kind" GENERATED ALWAYS AS ('dd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."details" ADD COLUMN "__tag_kind_details_mgnz5owncp" "qti"."node_kind" GENERATED ALWAYS AS ('details'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dfn" ADD COLUMN "__tag_kind_dfn_xgpywzxjkn" "qti"."node_kind" GENERATED ALWAYS AS ('dfn'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."div" ADD COLUMN "__tag_kind_div_tqs6ldkv65" "qti"."node_kind" GENERATED ALWAYS AS ('div'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dl" ADD COLUMN "__tag_kind_dl_aw2ei3s2i4" "qti"."node_kind" GENERATED ALWAYS AS ('dl'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."drawing_interaction" ADD COLUMN "__tag_kind_qti_drawing_interaction_i7yf6jyigs" "qti"."node_kind" GENERATED ALWAYS AS ('qti-drawing-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."dt" ADD COLUMN "__tag_kind_dt_se6ui3fyrg" "qti"."node_kind" GENERATED ALWAYS AS ('dt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."em" ADD COLUMN "__tag_kind_em_ooisxn7pss" "qti"."node_kind" GENERATED ALWAYS AS ('em'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."end_attempt_interaction" ADD COLUMN "__tag_kind_qti_end_attempt_interaction_ez7tuuts3e" "qti"."node_kind" GENERATED ALWAYS AS ('qti-end-attempt-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."extended_text_interaction" ADD COLUMN "__tag_kind_qti_extended_text_interaction_a2k2mcqdlw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-extended-text-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."feedback_block" ADD COLUMN "__tag_kind_qti_feedback_block_fzyzb3m667" "qti"."node_kind" GENERATED ALWAYS AS ('qti-feedback-block'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."feedback_inline" ADD COLUMN "__tag_kind_qti_feedback_inline_fxa2ds5jsw" "qti"."node_kind" GENERATED ALWAYS AS ('qti-feedback-inline'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."feedback_outcome_ref" ADD COLUMN "__tag_kind_outcome_glkysklooj" "qti"."declaration_kind" GENERATED ALWAYS AS ('outcome'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."figcaption" ADD COLUMN "__tag_kind_figcaption_kg34hwzy6b" "qti"."node_kind" GENERATED ALWAYS AS ('figcaption'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."figure" ADD COLUMN "__tag_kind_figure_m2nqyu772u" "qti"."node_kind" GENERATED ALWAYS AS ('figure'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."footer" ADD COLUMN "__tag_kind_footer_vxrcx7653b" "qti"."node_kind" GENERATED ALWAYS AS ('footer'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap" ADD COLUMN "__tag_kind_qti_gap_t5z2t37bta" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap_img" ADD COLUMN "__tag_kind_qti_gap_img_cika2xmkoz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap-img'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap_match_interaction" ADD COLUMN "__tag_kind_qti_gap_match_interaction_sa3eog3yil" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap-match-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."gap_text" ADD COLUMN "__tag_kind_qti_gap_text_me5pobfhjy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-gap-text'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."graphic_associate_interaction" ADD COLUMN "__tag_kind_qti_graphic_associate_interaction_cf7kbgfftm" "qti"."node_kind" GENERATED ALWAYS AS ('qti-graphic-associate-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."graphic_gap_match_interaction" ADD COLUMN "__tag_kind_qti_graphic_gap_match_interaction_7hgn4d2ulo" "qti"."node_kind" GENERATED ALWAYS AS ('qti-graphic-gap-match-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."graphic_order_interaction" ADD COLUMN "__tag_kind_qti_graphic_order_interaction_f6g47z3ihc" "qti"."node_kind" GENERATED ALWAYS AS ('qti-graphic-order-interaction'::"qti"."node_kind") STORED NOT NULL;

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

ALTER TABLE "qti"."inline_choice" ADD COLUMN "__tag_kind_qti_inline_choice_vqtv2okj5a" "qti"."node_kind" GENERATED ALWAYS AS ('qti-inline-choice'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."inline_choice_interaction" ADD COLUMN "__tag_kind_qti_inline_choice_interaction_zutl6a477r" "qti"."node_kind" GENERATED ALWAYS AS ('qti-inline-choice-interaction'::"qti"."node_kind") STORED NOT NULL;

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

ALTER TABLE "qti"."item_body_id" ADD COLUMN "__tag_holder_item_body_aqj24xldnt" "qti"."id_holder" GENERATED ALWAYS AS ('itemBody'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_both" ADD COLUMN "__tag_shape_both_w7wtd5psrj" "qti"."tool_shape" GENERATED ALWAYS AS ('both'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_name" ADD COLUMN "__tag_shape_name_only_ovf2oodbcw" "qti"."tool_shape" GENERATED ALWAYS AS ('nameOnly'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_version" ADD COLUMN "__tag_shape_version_only_xss26qzv7y" "qti"."tool_shape" GENERATED ALWAYS AS ('versionOnly'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."kbd" ADD COLUMN "__tag_kind_kbd_dwx2olhbhz" "qti"."node_kind" GENERATED ALWAYS AS ('kbd'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."label" ADD COLUMN "__tag_kind_label_pyyrnslja3" "qti"."node_kind" GENERATED ALWAYS AS ('label'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."li" ADD COLUMN "__tag_kind_li_jjtjuvu2xr" "qti"."node_kind" GENERATED ALWAYS AS ('li'::"qti"."node_kind") STORED NOT NULL;

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

ALTER TABLE "qti"."mapping" ADD COLUMN "__tag_kind_qti_mapping_qs3jyoupmy" "qti"."node_kind" GENERATED ALWAYS AS ('qti-mapping'::"qti"."node_kind") STORED NOT NULL;

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

ALTER TABLE "qti"."media_interaction" ADD COLUMN "__tag_kind_qti_media_interaction_tfi75ox2wv" "qti"."node_kind" GENERATED ALWAYS AS ('qti-media-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."modal_feedback" ADD COLUMN "__tag_kind_qti_modal_feedback_mxux7xznmz" "qti"."node_kind" GENERATED ALWAYS AS ('qti-modal-feedback'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."nav" ADD COLUMN "__tag_kind_nav_cpuuu4v2qr" "qti"."node_kind" GENERATED ALWAYS AS ('nav'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."object" ADD COLUMN "__tag_kind_object_zd2ersk4ce" "qti"."node_kind" GENERATED ALWAYS AS ('object'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ol" ADD COLUMN "__tag_kind_ol_2e4w45eumy" "qti"."node_kind" GENERATED ALWAYS AS ('ol'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."order_interaction" ADD COLUMN "__tag_kind_qti_order_interaction_idcyl5weiu" "qti"."node_kind" GENERATED ALWAYS AS ('qti-order-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."param" ADD COLUMN "__tag_kind_param_ahmia5b7ly" "qti"."node_kind" GENERATED ALWAYS AS ('param'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."picture" ADD COLUMN "__tag_kind_picture_773bajqqhs" "qti"."node_kind" GENERATED ALWAYS AS ('picture'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."position_object_interaction" ADD COLUMN "__tag_kind_qti_position_object_interaction_rge3opb2bo" "qti"."node_kind" GENERATED ALWAYS AS ('qti-position-object-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."position_object_stage" ADD COLUMN "__tag_kind_qti_position_object_stage_opzdehxvaq" "qti"."node_kind" GENERATED ALWAYS AS ('qti-position-object-stage'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."pre" ADD COLUMN "__tag_kind_pre_pindojue2g" "qti"."node_kind" GENERATED ALWAYS AS ('pre'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."printed_variable" ADD COLUMN "__tag_kind_qti_printed_variable_a4wq7cp2a3" "qti"."node_kind" GENERATED ALWAYS AS ('qti-printed-variable'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."printed_variable_id" ADD COLUMN "__tag_holder_printed_variable_s5vwhne3e7" "qti"."id_holder" GENERATED ALWAYS AS ('printedVariable'::"qti"."id_holder") STORED NOT NULL;

ALTER TABLE "qti"."q" ADD COLUMN "__tag_kind_q_v2ut4rkmxv" "qti"."node_kind" GENERATED ALWAYS AS ('q'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."qti_label" ADD COLUMN "__tag_kind_qti_label_li3rglggnp" "qti"."node_kind" GENERATED ALWAYS AS ('qti-label'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."rb" ADD COLUMN "__tag_kind_rb_e2k522kmfe" "qti"."node_kind" GENERATED ALWAYS AS ('rb'::"qti"."node_kind") STORED NOT NULL;

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

ALTER TABLE "qti"."simple_associable_choice" ADD COLUMN "__tag_kind_qti_simple_associable_choice_dlcgsxx2bi" "qti"."node_kind" GENERATED ALWAYS AS ('qti-simple-associable-choice'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."simple_match_set" ADD COLUMN "__tag_kind_qti_simple_match_set_bhwsbmwhks" "qti"."node_kind" GENERATED ALWAYS AS ('qti-simple-match-set'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."slider_interaction" ADD COLUMN "__tag_kind_qti_slider_interaction_mqpv3dtt65" "qti"."node_kind" GENERATED ALWAYS AS ('qti-slider-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."small" ADD COLUMN "__tag_kind_small_gkltegn7kl" "qti"."node_kind" GENERATED ALWAYS AS ('small'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."source" ADD COLUMN "__tag_kind_source_q72etxe3im" "qti"."node_kind" GENERATED ALWAYS AS ('source'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."span" ADD COLUMN "__tag_kind_span_koacretyo2" "qti"."node_kind" GENERATED ALWAYS AS ('span'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."string_binding" ADD COLUMN "__tag_kind_response_h34dku2bqb" "qti"."declaration_kind" GENERATED ALWAYS AS ('response'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."strong" ADD COLUMN "__tag_kind_strong_gxhcapelxs" "qti"."node_kind" GENERATED ALWAYS AS ('strong'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."stylesheet" ADD COLUMN "__tag_kind_qti_stylesheet_zrdvcrjdok" "qti"."node_kind" GENERATED ALWAYS AS ('qti-stylesheet'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."sub" ADD COLUMN "__tag_kind_sub_c5sixq4viw" "qti"."node_kind" GENERATED ALWAYS AS ('sub'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."summary" ADD COLUMN "__tag_kind_summary_4tcbjxb4su" "qti"."node_kind" GENERATED ALWAYS AS ('summary'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."sup" ADD COLUMN "__tag_kind_sup_drhon2pewx" "qti"."node_kind" GENERATED ALWAYS AS ('sup'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."table" ADD COLUMN "__tag_kind_table_o2mr32dc7l" "qti"."node_kind" GENERATED ALWAYS AS ('table'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tbody" ADD COLUMN "__tag_kind_tbody_vnwspgbjg3" "qti"."node_kind" GENERATED ALWAYS AS ('tbody'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."td" ADD COLUMN "__tag_kind_td_uvejqfmwgi" "qti"."node_kind" GENERATED ALWAYS AS ('td'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template" ADD COLUMN "__tag_kind_template_gzmskje5fk" "qti"."node_kind" GENERATED ALWAYS AS ('template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_block" ADD COLUMN "__tag_kind_qti_template_block_vu6txxof7s" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-block'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_content_ref" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_declaration_arm" ADD COLUMN "__tag_kind_template_6mdj2h4ofc" "qti"."declaration_kind" GENERATED ALWAYS AS ('template'::"qti"."declaration_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_declaration_arm" ADD COLUMN "__tag_kind_qti_template_declaration_kfzjha6iro" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-declaration'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_feedback_block" ADD COLUMN "__tag_kind_qti_feedback_block_template_koyzwlsapg" "qti"."node_kind" GENERATED ALWAYS AS ('qti-feedback-block.template'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."template_inline" ADD COLUMN "__tag_kind_qti_template_inline_zkyrmcpqzq" "qti"."node_kind" GENERATED ALWAYS AS ('qti-template-inline'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."text_entry_interaction" ADD COLUMN "__tag_kind_qti_text_entry_interaction_qjak2y2y6n" "qti"."node_kind" GENERATED ALWAYS AS ('qti-text-entry-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tfoot" ADD COLUMN "__tag_kind_tfoot_ryniejmgnp" "qti"."node_kind" GENERATED ALWAYS AS ('tfoot'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."th" ADD COLUMN "__tag_kind_th_obdxlz7qfe" "qti"."node_kind" GENERATED ALWAYS AS ('th'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."thead" ADD COLUMN "__tag_kind_thead_qzvxye75oy" "qti"."node_kind" GENERATED ALWAYS AS ('thead'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tr" ADD COLUMN "__tag_kind_tr_uhvfuvx5js" "qti"."node_kind" GENERATED ALWAYS AS ('tr'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."track" ADD COLUMN "__tag_kind_track_7rs2xjagel" "qti"."node_kind" GENERATED ALWAYS AS ('track'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."tree_root" ADD COLUMN "__tag_ancestry_root_7ltbltwcre" "qti"."ancestry" GENERATED ALWAYS AS ('root'::"qti"."ancestry") STORED NOT NULL;

ALTER TABLE "qti"."tt" ADD COLUMN "__tag_kind_tt_etz3iybkyw" "qti"."node_kind" GENERATED ALWAYS AS ('tt'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."ul" ADD COLUMN "__tag_kind_ul_n7u7vjrkov" "qti"."node_kind" GENERATED ALWAYS AS ('ul'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."upload_interaction" ADD COLUMN "__tag_kind_qti_upload_interaction_cjum6engod" "qti"."node_kind" GENERATED ALWAYS AS ('qti-upload-interaction'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."var" ADD COLUMN "__tag_kind_var_ufngemq3yq" "qti"."node_kind" GENERATED ALWAYS AS ('var'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."video" ADD COLUMN "__tag_kind_video_zsqw625lwf" "qti"."node_kind" GENERATED ALWAYS AS ('video'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."interaction_binding" ADD CONSTRAINT "adaptive_feedback" CHECK ((NOT "ancestry" IN ('fb'::"qti"."ancestry", 'fb.modal'::"qti"."ancestry", 'fb.rubric'::"qti"."ancestry", 'fb.tmpl'::"qti"."ancestry", 'fb.int'::"qti"."ancestry", 'fb.htx'::"qti"."ancestry", 'fb.modal.tmpl'::"qti"."ancestry", 'fb.modal.htx'::"qti"."ancestry", 'fb.rubric.tmpl'::"qti"."ancestry", 'fb.rubric.htx'::"qti"."ancestry", 'fb.tmpl.int'::"qti"."ancestry", 'fb.tmpl.htx'::"qti"."ancestry", 'fb.int.gap'::"qti"."ancestry", 'fb.int.choice'::"qti"."ancestry", 'fb.int.htx'::"qti"."ancestry", 'fb.modal.tmpl.htx'::"qti"."ancestry", 'fb.rubric.tmpl.htx'::"qti"."ancestry", 'fb.tmpl.int.gap'::"qti"."ancestry", 'fb.tmpl.int.choice'::"qti"."ancestry", 'fb.tmpl.int.htx'::"qti"."ancestry", 'fb.int.gap.choice'::"qti"."ancestry", 'fb.int.gap.htx'::"qti"."ancestry", 'fb.int.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice'::"qti"."ancestry", 'fb.tmpl.int.gap.htx'::"qti"."ancestry", 'fb.tmpl.int.choice.htx'::"qti"."ancestry", 'fb.int.gap.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice.htx'::"qti"."ancestry") OR "adaptive" IN ('true'::text, '1'::text)) IS TRUE) NOT VALID;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "reserved_outcome_types" CHECK (((NOT ("identifier" IN ('SCORE'::text, 'MAXSCORE'::text) AND "kind" = 'outcome'::"qti"."declaration_kind") OR "base_type" = 'float'::"qti"."base_type") AND (NOT ("identifier" = 'PASSED'::text AND "kind" = 'outcome'::"qti"."declaration_kind") OR "base_type" = 'boolean'::"qti"."base_type")) IS TRUE) NOT VALID;

ALTER TABLE "qti"."a" ADD CONSTRAINT "__a_fk_id_tag_kind_a_nnzx_4_rhgd_5_7ro66s5nyh" FOREIGN KEY ("id", "__tag_kind_a_nnzx4rhgd5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."a_type" ADD CONSTRAINT "__a_type_fk_node_glqappcarf" FOREIGN KEY ("node") REFERENCES "qti"."a" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."abbr" ADD CONSTRAINT "__abbr_fk_id_tag_kind_abbr_hrjkr_2_qds_6_jpdz7ec4gd" FOREIGN KEY ("id", "__tag_kind_abbr_hrjkr2qds6") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."acronym" ADD CONSTRAINT "__acronym_fk_id_tag_kind_acronym_vins_4_r_6_mib_gt2rapfuja" FOREIGN KEY ("id", "__tag_kind_acronym_vins4r6mib") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."address" ADD CONSTRAINT "__address_fk_id_tag_kind_address_v_7_uvpjblbr_d4ejqwuza2" FOREIGN KEY ("id", "__tag_kind_address_v7uvpjblbr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_map_entry" ADD CONSTRAINT "__area_map_entry_fk_area_mapping_orq4wexwes" FOREIGN KEY ("area_mapping") REFERENCES "qti"."area_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_map_entry" ADD CONSTRAINT "__area_map_entry_fk_id_tag_kind_qti_area_map_entry_tdlgmxnfzq" FOREIGN KEY ("id", "__tag_kind_qti_area_map_entry_ipn4oixdsm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."area_map_entry" ADD CONSTRAINT "__area_map_entry_fk_id_area_mapping_position_els6sss45m" FOREIGN KEY ("id", "area_mapping", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_fk_id_tree_iolxqdwgug" FOREIGN KEY ("id", "tree") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."associable_hotspot" ADD CONSTRAINT "__associable_hotspot_fk_id_tag_kind_qti_associable_cthcl3fsmj" FOREIGN KEY ("id", "__tag_kind_qti_associable_hotspot_s44ub3cnnd") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot" ADD CONSTRAINT "__associable_hotspot_fk_id_interaction_iwxrm453v6" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot" ADD CONSTRAINT "__associable_hotspot_fk_id_parent_kind_dgxqwosap2" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot_label" ADD CONSTRAINT "__associable_hotspot_label_fk_node_563s2juyzs" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associable_hotspot_match_min" ADD CONSTRAINT "__associable_hotspot_match_min_fk_node_zpvavojw5b" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associate_interaction" ADD CONSTRAINT "__associate_interaction_fk_id_tag_kind_qti_associate_e4pnu663qi" FOREIGN KEY ("id", "__tag_kind_qti_associate_interaction_mmhr3ccr2w") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associate_interaction" ADD CONSTRAINT "__associate_interaction_fk_id_root_kind_hqhizy54we" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associate_max_associations" ADD CONSTRAINT "__associate_max_associations_fk_node_o4miasgxtg" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."associate_min_associations" ADD CONSTRAINT "__associate_min_associations_fk_node_7jnngikldg" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_idref" ADD CONSTRAINT "__attribute_idref_fk_document_target_lj3l74altr" FOREIGN KEY ("document", "target") REFERENCES "qti"."document_id" ("document", "id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_idref" ADD CONSTRAINT "__attribute_idref_fk_node_document_3q5cvhw5md" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."attribute_lexical" ADD CONSTRAINT "__attribute_lexical_fk_kind_attribute_njhegw4vhu" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute") NOT VALID;

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

ALTER TABLE "qti"."caption" ADD CONSTRAINT "__caption_fk_id_tag_kind_caption_5_ewe_5_uufgf_px5owdlti7" FOREIGN KEY ("id", "__tag_kind_caption_5ewe5uufgf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."catalog_info" ADD CONSTRAINT "__catalog_info_fk_id_tag_kind_qti_catalog_info_s_44_6frj5ulk2g" FOREIGN KEY ("id", "__tag_kind_qti_catalog_info_s44bpzmt5j") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_template_ref" ADD CONSTRAINT "__choice_template_ref_fk_document_identifier_tag_hdoouwq6lg" FOREIGN KEY ("document", "identifier", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_template_ref" ADD CONSTRAINT "__choice_template_ref_fk_document_identifier_base_4tj3uu54bx" FOREIGN KEY ("document", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."choice_template_ref" ADD CONSTRAINT "__choice_template_ref_fk_node_document_iaop4pgkmj" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."cite" ADD CONSTRAINT "__cite_fk_id_tag_kind_cite_4_ll_5_xji_4_xt_urosrkldpq" FOREIGN KEY ("id", "__tag_kind_cite_4ll5xji4xt") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."code" ADD CONSTRAINT "__code_fk_id_tag_kind_code_2_sjxqe_2_lm_5_ssp7cweetg" FOREIGN KEY ("id", "__tag_kind_code_2sjxqe2lm5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."col" ADD CONSTRAINT "__col_fk_id_tag_kind_col_5_ijislolfm_hsbpzvbp2x" FOREIGN KEY ("id", "__tag_kind_col_5ijislolfm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."col_span" ADD CONSTRAINT "__col_span_fk_node_lffysaeakf" FOREIGN KEY ("node") REFERENCES "qti"."col" ("id");

ALTER TABLE "qti"."colgroup" ADD CONSTRAINT "__colgroup_fk_id_tag_kind_colgroup_3_gqxythtyf_6qtk2zu757" FOREIGN KEY ("id", "__tag_kind_colgroup_3gqxythtyf") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."colgroup_span" ADD CONSTRAINT "__colgroup_span_fk_node_lu3i5lypw6" FOREIGN KEY ("node") REFERENCES "qti"."colgroup" ("id");

ALTER TABLE "qti"."companion_materials_info" ADD CONSTRAINT "__companion_materials_info_fk_id_tag_kind_qti_vs746y6kf3" FOREIGN KEY ("id", "__tag_kind_qti_companion_materials_info_ndsygptfy3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_feedback" ADD CONSTRAINT "__content_body_feedback_fk_id_tag_kind_qti_content_iepat44l52" FOREIGN KEY ("id", "__tag_kind_qti_content_body_feedback_y5ggovqlad") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_modal" ADD CONSTRAINT "__content_body_modal_fk_id_tag_kind_qti_content_body_iib6x3vdv7" FOREIGN KEY ("id", "__tag_kind_qti_content_body_modal_3mvh5kt4vk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_rubric" ADD CONSTRAINT "__content_body_rubric_fk_id_tag_kind_qti_content_e4d7xfwvex" FOREIGN KEY ("id", "__tag_kind_qti_content_body_rubric_a6paqpk4uz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_rubric_template" ADD CONSTRAINT "__content_body_rubric_template_fk_id_tag_kind_qti_g6tveojoqg" FOREIGN KEY ("id", "__tag_kind_qti_content_body_rubric_template_vri73ijlw5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."content_body_template" ADD CONSTRAINT "__content_body_template_fk_id_tag_kind_qti_content_6wivnuut4w" FOREIGN KEY ("id", "__tag_kind_qti_content_body_template_5bgw5mu5a4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_tag_kind_context_ebo_w7jjsjo6yl" FOREIGN KEY ("id", "__tag_kind_context_ebo2ipjj7k") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_arm" ADD CONSTRAINT "__context_declaration_arm_fk_id_tag_kind_qti_context_4rufw6vqkp" FOREIGN KEY ("id", "__tag_kind_qti_context_declaration_ooqez2egyz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_id" ADD CONSTRAINT "__context_declaration_id_fk_document_id_tag_holder_3ovlvjpr5t" FOREIGN KEY ("document", "id", "__tag_holder_context_declaration_i5zus6a3u6") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."context_declaration_id" ADD CONSTRAINT "__context_declaration_id_fk_node_document_5vt3ni7od7" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords" ADD CONSTRAINT "__coords_fk_node_owner_kind_gik5zsycuf" FOREIGN KEY ("node", "owner_kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_circle" ADD CONSTRAINT "__coords_circle_fk_node_tag_shape_circle_of_6_ebmy_3_xvndrn2fxs" FOREIGN KEY ("node", "__tag_shape_circle_of6ebmy3mb") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_default" ADD CONSTRAINT "__coords_default_fk_node_tag_shape_default_3_74ikjyppyf" FOREIGN KEY ("node", "__tag_shape_default_3zivvvfwas") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_ellipse" ADD CONSTRAINT "__coords_ellipse_fk_node_tag_shape_ellipse_lu_2_44sfodcb7i" FOREIGN KEY ("node", "__tag_shape_ellipse_lu2mxwxu6y") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_poly" ADD CONSTRAINT "__coords_poly_fk_node_tag_shape_poly_u_6_dhqqfxgj_4mvarm5l5u" FOREIGN KEY ("node", "__tag_shape_poly_u6dhqqfxgj") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."coords_rect" ADD CONSTRAINT "__coords_rect_fk_node_tag_shape_rect_jgr_525_splx_jivqwgucia" FOREIGN KEY ("node", "__tag_shape_rect_jgr525splx") REFERENCES "qti"."coords" ("node", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dd" ADD CONSTRAINT "__dd_fk_id_tag_kind_dd_fz_7_u_3_fe_6_ih_gcbrq3lfpx" FOREIGN KEY ("id", "__tag_kind_dd_fz7u3fe6ih") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_area_mapping_default_value" ADD CONSTRAINT "__declared_area_mapping_default_value_fk_node_ztftp5ed66" FOREIGN KEY ("node") REFERENCES "qti"."area_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associable_hotspot_show_hide" ADD CONSTRAINT "__declared_associable_hotspot_show_hide_fk_node_lb6mfj3ep3" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associate_max_associations" ADD CONSTRAINT "__declared_associate_max_associations_fk_node_2h5eblsl34" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associate_min_associations" ADD CONSTRAINT "__declared_associate_min_associations_fk_node_n5lihs7cmg" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_associate_shuffle" ADD CONSTRAINT "__declared_associate_shuffle_fk_node_dtdv6jmd45" FOREIGN KEY ("node") REFERENCES "qti"."associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_extended_text_base" ADD CONSTRAINT "__declared_extended_text_base_fk_node_vz32gen3te" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_extended_text_format" ADD CONSTRAINT "__declared_extended_text_format_fk_node_yzofl327pt" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_extended_text_min_strings" ADD CONSTRAINT "__declared_extended_text_min_strings_fk_node_mzvwzk7zj3" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_feedback_block_show_hide" ADD CONSTRAINT "__declared_feedback_block_show_hide_fk_node_vyj5jwhosa" FOREIGN KEY ("node") REFERENCES "qti"."feedback_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_feedback_inline_show_hide" ADD CONSTRAINT "__declared_feedback_inline_show_hide_fk_node_fik74io7ff" FOREIGN KEY ("node") REFERENCES "qti"."feedback_inline" ("id") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."declared_media_loop" ADD CONSTRAINT "__declared_media_loop_fk_node_fmmg6nicbb" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_order_shuffle" ADD CONSTRAINT "__declared_order_shuffle_fk_node_m2jpcwf6ud" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_param_variable" ADD CONSTRAINT "__declared_param_variable_fk_node_f5xg36jh5g" FOREIGN KEY ("node") REFERENCES "qti"."template_declaration_arm" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_position_object_max_choices" ADD CONSTRAINT "__declared_position_object_max_choices_fk_node_z33s4bgg4z" FOREIGN KEY ("node") REFERENCES "qti"."position_object_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_base" ADD CONSTRAINT "__declared_printed_variable_base_fk_node_pt6y33os7o" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_delimiter" ADD CONSTRAINT "__declared_printed_variable_delimiter_fk_node_7d7b5p6trc" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_mapping_indicator" ADD CONSTRAINT "__declared_printed_variable_mapping_indicator_fk_iaepqht5zi" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_printed_variable_power_form" ADD CONSTRAINT "__declared_printed_variable_power_form_fk_node_vp3m6giznm" FOREIGN KEY ("node") REFERENCES "qti"."printed_variable" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_rubric_template_block_show_hide" ADD CONSTRAINT "__declared_rubric_template_block_show_hide_fk_node_nhhdywdoss" FOREIGN KEY ("node") REFERENCES "qti"."rubric_template_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_rubric_template_inline_show_hide" ADD CONSTRAINT "__declared_rubric_template_inline_show_hide_fk_node_sbphi5cue2" FOREIGN KEY ("node") REFERENCES "qti"."rubric_template_inline" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_select_point_max_choices" ADD CONSTRAINT "__declared_select_point_max_choices_fk_node_yo3b6kavsz" FOREIGN KEY ("node") REFERENCES "qti"."select_point_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_select_point_min_choices" ADD CONSTRAINT "__declared_select_point_min_choices_fk_node_dfg5rlttmm" FOREIGN KEY ("node") REFERENCES "qti"."select_point_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_slider_step_label" ADD CONSTRAINT "__declared_slider_step_label_fk_node_2lmfxy6urk" FOREIGN KEY ("node") REFERENCES "qti"."slider_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_template_block_show_hide" ADD CONSTRAINT "__declared_template_block_show_hide_fk_node_ohunq2ls63" FOREIGN KEY ("node") REFERENCES "qti"."template_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_template_feedback_block_show_hide" ADD CONSTRAINT "__declared_template_feedback_block_show_hide_fk_node_pb6ahfblff" FOREIGN KEY ("node") REFERENCES "qti"."template_feedback_block" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_template_inline_show_hide" ADD CONSTRAINT "__declared_template_inline_show_hide_fk_node_hyb4ctezno" FOREIGN KEY ("node") REFERENCES "qti"."template_inline" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_text_entry_base" ADD CONSTRAINT "__declared_text_entry_base_fk_node_unpjkeiten" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_track_kind" ADD CONSTRAINT "__declared_track_kind_fk_node_azutondble" FOREIGN KEY ("node") REFERENCES "qti"."track" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_valuetype" ADD CONSTRAINT "__declared_valuetype_fk_node_oc3xdilugk" FOREIGN KEY ("node") REFERENCES "qti"."param" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."details" ADD CONSTRAINT "__details_fk_id_tag_kind_details_mgnz_5_owncp_vahcpn7oqk" FOREIGN KEY ("id", "__tag_kind_details_mgnz5owncp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."details_open" ADD CONSTRAINT "__details_open_fk_node_sqn6d7jg5p" FOREIGN KEY ("node") REFERENCES "qti"."details" ("id");

ALTER TABLE "qti"."dfn" ADD CONSTRAINT "__dfn_fk_id_tag_kind_dfn_xgpywzxjkn_uytsux3imt" FOREIGN KEY ("id", "__tag_kind_dfn_xgpywzxjkn") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."div" ADD CONSTRAINT "__div_fk_id_tag_kind_div_tqs_6_ldkv_65_ojgf7lwcs4" FOREIGN KEY ("id", "__tag_kind_div_tqs6ldkv65") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dl" ADD CONSTRAINT "__dl_fk_id_tag_kind_dl_aw_2_ei_3_s_2_i_4_5dfgqgnjko" FOREIGN KEY ("id", "__tag_kind_dl_aw2ei3s2i4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."document_lang" ADD CONSTRAINT "__document_lang_fk_document_package_resource_lbo3acms5b" FOREIGN KEY ("document", "package", "resource") REFERENCES "qti"."document" ("id", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drawing_interaction" ADD CONSTRAINT "__drawing_interaction_fk_id_tag_kind_qti_drawing_nql6ucz76p" FOREIGN KEY ("id", "__tag_kind_qti_drawing_interaction_i7yf6jyigs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."drawing_interaction" ADD CONSTRAINT "__drawing_interaction_fk_id_root_kind_uuypn6uh6o" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."dt" ADD CONSTRAINT "__dt_fk_id_tag_kind_dt_se_6_ui_3_fyrg_pbrgxntfxn" FOREIGN KEY ("id", "__tag_kind_dt_se6ui3fyrg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_fk_parent_ancestry_parent_kind_child_ancestry_3a4njwadrv" FOREIGN KEY ("parent_ancestry", "parent_kind", "child_ancestry") REFERENCES "qti"."ancestry_step" ("ancestry", "kind", "next") NOT VALID;

ALTER TABLE "qti"."em" ADD CONSTRAINT "__em_fk_id_tag_kind_em_ooisxn_7_pss_nhdo6z3uzk" FOREIGN KEY ("id", "__tag_kind_em_ooisxn7pss") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."end_attempt_count_attempt" ADD CONSTRAINT "__end_attempt_count_attempt_fk_node_exmvncir27" FOREIGN KEY ("node") REFERENCES "qti"."end_attempt_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."end_attempt_interaction" ADD CONSTRAINT "__end_attempt_interaction_fk_id_tag_kind_qti_end_limopuebx3" FOREIGN KEY ("id", "__tag_kind_qti_end_attempt_interaction_ez7tuuts3e") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."end_attempt_interaction" ADD CONSTRAINT "__end_attempt_interaction_fk_id_root_kind_ibnqo2y2b3" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_expected_length" ADD CONSTRAINT "__extended_text_expected_length_fk_node_r5oob4axwj" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_expected_lines" ADD CONSTRAINT "__extended_text_expected_lines_fk_node_4lez2gf4uu" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_interaction" ADD CONSTRAINT "__extended_text_interaction_fk_id_tag_kind_qti_ltalrkocek" FOREIGN KEY ("id", "__tag_kind_qti_extended_text_interaction_a2k2mcqdlw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_interaction" ADD CONSTRAINT "__extended_text_interaction_fk_id_root_kind_w77r26cfuv" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_max_strings" ADD CONSTRAINT "__extended_text_max_strings_fk_node_no2k5lg6kg" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_pattern_mask" ADD CONSTRAINT "__extended_text_pattern_mask_fk_node_ve2qvzr74x" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_patternmask_message" ADD CONSTRAINT "__extended_text_patternmask_message_fk_node_t2zz65vufb" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."extended_text_placeholder_text" ADD CONSTRAINT "__extended_text_placeholder_text_fk_node_krubrvzqvb" FOREIGN KEY ("node") REFERENCES "qti"."extended_text_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_block" ADD CONSTRAINT "__feedback_block_fk_id_tag_kind_qti_feedback_block_girqpzlz7i" FOREIGN KEY ("id", "__tag_kind_qti_feedback_block_fzyzb3m667") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_inline" ADD CONSTRAINT "__feedback_inline_fk_id_tag_kind_qti_feedback_inline_bln57d3fur" FOREIGN KEY ("id", "__tag_kind_qti_feedback_inline_fxa2ds5jsw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_outcome_ref" ADD CONSTRAINT "__feedback_outcome_ref_fk_document_identifier_tag_3omws2uoqu" FOREIGN KEY ("document", "identifier", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_outcome_ref" ADD CONSTRAINT "__feedback_outcome_ref_fk_document_identifier_base_ydtazhy5ch" FOREIGN KEY ("document", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."feedback_outcome_ref" ADD CONSTRAINT "__feedback_outcome_ref_fk_node_document_tuixbof55g" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."figcaption" ADD CONSTRAINT "__figcaption_fk_id_tag_kind_figcaption_kg_34_hwzy_6_7herqlloj5" FOREIGN KEY ("id", "__tag_kind_figcaption_kg34hwzy6b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."figure" ADD CONSTRAINT "__figure_fk_id_tag_kind_figure_m_2_nqyu_772_u_e3am75oub7" FOREIGN KEY ("id", "__tag_kind_figure_m2nqyu772u") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."footer" ADD CONSTRAINT "__footer_fk_id_tag_kind_footer_vxrcx_7653_b_l4cdrjkqls" FOREIGN KEY ("id", "__tag_kind_footer_vxrcx7653b") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap" ADD CONSTRAINT "__gap_fk_id_tag_kind_qti_gap_t_5_z_2_t_37_bta_gg7fvlkha7" FOREIGN KEY ("id", "__tag_kind_qti_gap_t5z2t37bta") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap" ADD CONSTRAINT "__gap_fk_interaction_iwcvszqyud" FOREIGN KEY ("interaction") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img" ADD CONSTRAINT "__gap_img_fk_id_tag_kind_qti_gap_img_cika_2_xmkoz_hpm74hvjft" FOREIGN KEY ("id", "__tag_kind_qti_gap_img_cika2xmkoz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img" ADD CONSTRAINT "__gap_img_fk_id_interaction_izb3b7orbl" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_left" ADD CONSTRAINT "__gap_img_left_fk_node_afflzljwrr" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_match_min" ADD CONSTRAINT "__gap_img_match_min_fk_node_46viwbbfia" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_object_label" ADD CONSTRAINT "__gap_img_object_label_fk_node_giimnaj2mt" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_img_top" ADD CONSTRAINT "__gap_img_top_fk_node_oh2lzktdlq" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_choices_container_width" ADD CONSTRAINT "__gap_match_choices_container_width_fk_node_fbglf2uyxs" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_interaction" ADD CONSTRAINT "__gap_match_interaction_fk_id_tag_kind_qti_gap_match_ttdrlfv4id" FOREIGN KEY ("id", "__tag_kind_qti_gap_match_interaction_sa3eog3yil") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_interaction" ADD CONSTRAINT "__gap_match_interaction_fk_id_root_kind_nwcelriipx" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_max_associations" ADD CONSTRAINT "__gap_match_max_associations_fk_node_iffuic642p" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_max_selections_message" ADD CONSTRAINT "__gap_match_max_selections_message_fk_node_55mhw3a5a7" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_min_associations" ADD CONSTRAINT "__gap_match_min_associations_fk_node_sqxe7hdupj" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_match_min_selections_message" ADD CONSTRAINT "__gap_match_min_selections_message_fk_node_xyclglemdq" FOREIGN KEY ("node") REFERENCES "qti"."gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_text" ADD CONSTRAINT "__gap_text_fk_id_tag_kind_qti_gap_text_me_5_pobfhjy_3xxo4rssmj" FOREIGN KEY ("id", "__tag_kind_qti_gap_text_me5pobfhjy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_text" ADD CONSTRAINT "__gap_text_fk_id_interaction_vyabtqqbvf" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."gap_text_match_min" ADD CONSTRAINT "__gap_text_match_min_fk_node_bdky5cpf7z" FOREIGN KEY ("node") REFERENCES "qti"."gap_text" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_associate_interaction" ADD CONSTRAINT "__graphic_associate_interaction_fk_id_tag_kind_qti_4j76cxczrn" FOREIGN KEY ("id", "__tag_kind_qti_graphic_associate_interaction_cf7kbgfftm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_associate_interaction" ADD CONSTRAINT "__graphic_associate_interaction_fk_id_root_kind_yfucrzcver" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_associate_max_associations" ADD CONSTRAINT "__graphic_associate_max_associations_fk_node_kuazsvpwj7" FOREIGN KEY ("node") REFERENCES "qti"."graphic_associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_associate_min_associations" ADD CONSTRAINT "__graphic_associate_min_associations_fk_node_zq2k4hyv2w" FOREIGN KEY ("node") REFERENCES "qti"."graphic_associate_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_choices_container_width" ADD CONSTRAINT "__graphic_gap_match_choices_container_width_fk_node_erijou6iqn" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_interaction" ADD CONSTRAINT "__graphic_gap_match_interaction_fk_id_tag_kind_qti_dakbtfduno" FOREIGN KEY ("id", "__tag_kind_qti_graphic_gap_match_interaction_7hgn4d2ulo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_interaction" ADD CONSTRAINT "__graphic_gap_match_interaction_fk_id_root_kind_lukxvyxnqy" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_max_associations" ADD CONSTRAINT "__graphic_gap_match_max_associations_fk_node_vrepm7bdjq" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_max_selections_message" ADD CONSTRAINT "__graphic_gap_match_max_selections_message_fk_node_whb6jfecez" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_min_associations" ADD CONSTRAINT "__graphic_gap_match_min_associations_fk_node_jzncotbevu" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_gap_match_min_selections_message" ADD CONSTRAINT "__graphic_gap_match_min_selections_message_fk_node_tzv5zkekbw" FOREIGN KEY ("node") REFERENCES "qti"."graphic_gap_match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_interaction" ADD CONSTRAINT "__graphic_order_interaction_fk_id_tag_kind_qti_e7cmnucivs" FOREIGN KEY ("id", "__tag_kind_qti_graphic_order_interaction_f6g47z3ihc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_interaction" ADD CONSTRAINT "__graphic_order_interaction_fk_id_root_kind_rcrxsq34ip" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_max_choices" ADD CONSTRAINT "__graphic_order_max_choices_fk_node_334srj5iki" FOREIGN KEY ("node") REFERENCES "qti"."graphic_order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_max_choices_n" ADD CONSTRAINT "__graphic_order_max_choices_n_fk_node_i6smscd3jh" FOREIGN KEY ("node") REFERENCES "qti"."graphic_order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_min_choices" ADD CONSTRAINT "__graphic_order_min_choices_fk_node_zbxu3cfkaz" FOREIGN KEY ("node") REFERENCES "qti"."graphic_order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."graphic_order_min_choices_n" ADD CONSTRAINT "__graphic_order_min_choices_n_fk_node_odwhvbztnk" FOREIGN KEY ("node") REFERENCES "qti"."graphic_order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."hotspot_max_choices" ADD CONSTRAINT "__hotspot_max_choices_fk_node_lk6vflfjh7" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_max_selections_message" ADD CONSTRAINT "__hotspot_max_selections_message_fk_node_xrr6jjqf66" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_min_choices" ADD CONSTRAINT "__hotspot_min_choices_fk_node_dtufnhea2p" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hotspot_min_selections_message" ADD CONSTRAINT "__hotspot_min_selections_message_fk_node_yie6mhe626" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext" ADD CONSTRAINT "__hottext_fk_id_tag_kind_qti_hottext_wysowujcts_lsgzag2ybj" FOREIGN KEY ("id", "__tag_kind_qti_hottext_wysowujcts") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_interaction" ADD CONSTRAINT "__hottext_interaction_fk_id_tag_kind_qti_hottext_kyu6u2mjzs" FOREIGN KEY ("id", "__tag_kind_qti_hottext_interaction_4z6zllelqi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_interaction" ADD CONSTRAINT "__hottext_interaction_fk_id_root_kind_g2puzqhwl3" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_max_choices" ADD CONSTRAINT "__hottext_max_choices_fk_node_upg5th2l6h" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_max_selections_message" ADD CONSTRAINT "__hottext_max_selections_message_fk_node_heu2xs4qjo" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_min_choices" ADD CONSTRAINT "__hottext_min_choices_fk_node_aewvfuj57i" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_min_selections_message" ADD CONSTRAINT "__hottext_min_selections_message_fk_node_7k42a4jxap" FOREIGN KEY ("node") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_owner" ADD CONSTRAINT "__hottext_owner_fk_interaction_nzpm3rpwre" FOREIGN KEY ("interaction") REFERENCES "qti"."hottext_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_owner" ADD CONSTRAINT "__hottext_owner_fk_node_identifier_czroxsucmu" FOREIGN KEY ("node", "identifier") REFERENCES "qti"."hottext" ("id", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hr" ADD CONSTRAINT "__hr_fk_id_tag_kind_hr_ugkqxcyyf_4_zxwnqgibzk" FOREIGN KEY ("id", "__tag_kind_hr_ugkqxcyyf4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_document_id_tag_holder_html_id_rvco_6_j_4xxrdxqzag" FOREIGN KEY ("document", "id", "__tag_holder_html_id_rvco6j7tck") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_kind_attribute_7yhgrjvv32" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."html_id" ADD CONSTRAINT "__html_id_fk_node_document_kind_4jmntfh5as" FOREIGN KEY ("node", "document", "kind") REFERENCES "qti"."node" ("id", "tree", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."i" ADD CONSTRAINT "__i_fk_id_tag_kind_i_5_mff_2_xdi_4_o_qujfu6sdgm" FOREIGN KEY ("id", "__tag_kind_i_5mff2xdi4o") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice" ADD CONSTRAINT "__inline_choice_fk_id_tag_kind_qti_inline_choice_wo2cgmdjt7" FOREIGN KEY ("id", "__tag_kind_qti_inline_choice_vqtv2okj5a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice" ADD CONSTRAINT "__inline_choice_fk_id_interaction_ayou2yhcr7" FOREIGN KEY ("id", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_interaction" ADD CONSTRAINT "__inline_choice_interaction_fk_id_tag_kind_qti_3xws32tdey" FOREIGN KEY ("id", "__tag_kind_qti_inline_choice_interaction_zutl6a477r") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_interaction" ADD CONSTRAINT "__inline_choice_interaction_fk_id_root_kind_l7sl52xtvb" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_min_selections_message" ADD CONSTRAINT "__inline_choice_min_selections_message_fk_node_qepgpzxek4" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."inline_choice_prompt" ADD CONSTRAINT "__inline_choice_prompt_fk_node_cuxcewnfjk" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."interpolation_table" ADD CONSTRAINT "__interpolation_table_fk_declaration_tag_kind_ocwbhs6jjq" FOREIGN KEY ("declaration", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."item_body_id" ADD CONSTRAINT "__item_body_id_fk_document_id_tag_holder_item_body_qbqnxl7tow" FOREIGN KEY ("document", "id", "__tag_holder_item_body_aqj24xldnt") REFERENCES "qti"."document_id" ("document", "id", "holder") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_body_id" ADD CONSTRAINT "__item_body_id_fk_node_document_yub5r24zvj" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_both" ADD CONSTRAINT "__item_tool_both_fk_tree_tag_shape_both_w_7_wtd_5_hro47hekai" FOREIGN KEY ("tree", "__tag_shape_both_w7wtd5psrj") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_name" ADD CONSTRAINT "__item_tool_name_fk_tree_tag_shape_name_only_ovf_2_t3wpm3j4r2" FOREIGN KEY ("tree", "__tag_shape_name_only_ovf2oodbcw") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_version" ADD CONSTRAINT "__item_tool_version_fk_tree_tag_shape_version_only_2qxy4xgqmi" FOREIGN KEY ("tree", "__tag_shape_version_only_xss26qzv7y") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."kbd" ADD CONSTRAINT "__kbd_fk_id_tag_kind_kbd_dwx_2_olhbhz_pta27q3tn6" FOREIGN KEY ("id", "__tag_kind_kbd_dwx2olhbhz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."label" ADD CONSTRAINT "__label_fk_id_tag_kind_label_pyyrnslja_3_gtwux26sm7" FOREIGN KEY ("id", "__tag_kind_label_pyyrnslja3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."li" ADD CONSTRAINT "__li_fk_id_tag_kind_li_jjtjuvu_2_xr_fbrueca7pn" FOREIGN KEY ("id", "__tag_kind_li_jjtjuvu2xr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_id_parent_kind_avtlxpj6rc" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_lom_owner_n4lsd3gxmo" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED NOT VALID;

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

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_base_type_vhdttvawoa" FOREIGN KEY ("base_type") REFERENCES "qti"."mappable_base_type" ("base_type");

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_id_tag_kind_qti_mapping_qs_3_jyoupmy_epxhorf6f6" FOREIGN KEY ("id", "__tag_kind_qti_mapping_qs3jyoupmy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping" ADD CONSTRAINT "__mapping_fk_id_declaration_fqrpmmfhyb" FOREIGN KEY ("id", "declaration") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping_lower_bound" ADD CONSTRAINT "__mapping_lower_bound_fk_node_bu6cethjgk" FOREIGN KEY ("node") REFERENCES "qti"."mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."mapping_upper_bound" ADD CONSTRAINT "__mapping_upper_bound_fk_node_tdf2eguewu" FOREIGN KEY ("node") REFERENCES "qti"."mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_first_column_header" ADD CONSTRAINT "__match_first_column_header_fk_node_5e5mvplbjh" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_interaction" ADD CONSTRAINT "__match_interaction_fk_id_tag_kind_qti_match_6sbelzicus" FOREIGN KEY ("id", "__tag_kind_qti_match_interaction_t55y35p4zv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_interaction" ADD CONSTRAINT "__match_interaction_fk_id_root_kind_gry4tmuzlw" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_max_associations" ADD CONSTRAINT "__match_max_associations_fk_node_eqc7f6gbgk" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_max_selections_message" ADD CONSTRAINT "__match_max_selections_message_fk_node_lfgtlz2all" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_min_associations" ADD CONSTRAINT "__match_min_associations_fk_node_sh444w6mdl" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_min_selections_message" ADD CONSTRAINT "__match_min_selections_message_fk_node_ghfenwvm6u" FOREIGN KEY ("node") REFERENCES "qti"."match_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."match_table" ADD CONSTRAINT "__match_table_fk_declaration_tag_kind_outcome_7j7eigfqnj" FOREIGN KEY ("declaration", "__tag_kind_outcome_glkysklooj") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."media_coords" ADD CONSTRAINT "__media_coords_fk_node_exewz35qm6" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_interaction" ADD CONSTRAINT "__media_interaction_fk_id_tag_kind_qti_media_osagmlb2vb" FOREIGN KEY ("id", "__tag_kind_qti_media_interaction_tfi75ox2wv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_interaction" ADD CONSTRAINT "__media_interaction_fk_id_root_kind_isxeuk3r6z" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_max_plays" ADD CONSTRAINT "__media_max_plays_fk_node_bdehpncf6y" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."media_min_plays" ADD CONSTRAINT "__media_min_plays_fk_node_374ek5f5ar" FOREIGN KEY ("node") REFERENCES "qti"."media_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."modal_feedback" ADD CONSTRAINT "__modal_feedback_fk_id_tag_kind_qti_modal_feedback_3s5rrouyyk" FOREIGN KEY ("id", "__tag_kind_qti_modal_feedback_mxux7xznmz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."modal_feedback_title" ADD CONSTRAINT "__modal_feedback_title_fk_node_s55stk2oly" FOREIGN KEY ("node") REFERENCES "qti"."modal_feedback" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."nav" ADD CONSTRAINT "__nav_fk_id_tag_kind_nav_cpuuu_4_v_2_qr_baaw2tn4vu" FOREIGN KEY ("id", "__tag_kind_nav_cpuuu4v2qr") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node" ADD CONSTRAINT "__node_fk_ancestry_kind_hndoexzrnu" FOREIGN KEY ("ancestry", "kind") REFERENCES "qti"."ancestry_step" ("ancestry", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."node_catalog_idref" ADD CONSTRAINT "__node_catalog_idref_fk_kind_attribute_dmqrqvwjxd" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_catalog_idref" ADD CONSTRAINT "__node_catalog_idref_fk_node_kind_wpv3gn5wez" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_class" ADD CONSTRAINT "__node_class_fk_kind_attribute_estnk5pmc5" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_class" ADD CONSTRAINT "__node_class_fk_node_kind_dlk5gzx3no" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_dir" ADD CONSTRAINT "__node_dir_fk_kind_attribute_lx5ufqn62b" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_dir" ADD CONSTRAINT "__node_dir_fk_node_kind_bitbjqxktu" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_label" ADD CONSTRAINT "__node_label_fk_kind_attribute_lwccn4az4x" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_label" ADD CONSTRAINT "__node_label_fk_node_kind_44rmrx2ncb" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_lang" ADD CONSTRAINT "__node_lang_fk_kind_attribute_qyelp24637" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_lang" ADD CONSTRAINT "__node_lang_fk_node_kind_ev24asjwfe" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_suppress_tts" ADD CONSTRAINT "__node_suppress_tts_fk_kind_attribute_aierekws2n" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_suppress_tts" ADD CONSTRAINT "__node_suppress_tts_fk_node_kind_p6xvmp7box" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_xml_base" ADD CONSTRAINT "__node_xml_base_fk_kind_attribute_biptegyztq" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_xml_base" ADD CONSTRAINT "__node_xml_base_fk_node_kind_y6dxq22qfb" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."node_xml_lang" ADD CONSTRAINT "__node_xml_lang_fk_kind_attribute_orsrgas7dz" FOREIGN KEY ("kind", "attribute") REFERENCES "qti"."attribute_admission" ("kind", "attribute");

ALTER TABLE "qti"."node_xml_lang" ADD CONSTRAINT "__node_xml_lang_fk_node_kind_rfzk7k5hmh" FOREIGN KEY ("node", "kind") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."object" ADD CONSTRAINT "__object_fk_id_tag_kind_object_zd_2_ersk_4_ce_jb26tg7amh" FOREIGN KEY ("id", "__tag_kind_object_zd2ersk4ce") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."object_height" ADD CONSTRAINT "__object_height_fk_node_kbpvy4lutz" FOREIGN KEY ("node") REFERENCES "qti"."object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."object_width" ADD CONSTRAINT "__object_width_fk_node_i5ui5s3x6v" FOREIGN KEY ("node") REFERENCES "qti"."object" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ol" ADD CONSTRAINT "__ol_fk_id_tag_kind_ol_2_e_4_w_45_eumy_7gktmqrx2i" FOREIGN KEY ("id", "__tag_kind_ol_2e4w45eumy") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_choices_container_width" ADD CONSTRAINT "__order_choices_container_width_fk_node_tx5e7fvz5a" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_interaction" ADD CONSTRAINT "__order_interaction_fk_id_tag_kind_qti_order_qtucfuen6g" FOREIGN KEY ("id", "__tag_kind_qti_order_interaction_idcyl5weiu") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_interaction" ADD CONSTRAINT "__order_interaction_fk_id_root_kind_rneeksq4q5" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_max_choices" ADD CONSTRAINT "__order_max_choices_fk_node_e4257pb6lz" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_max_choices_n" ADD CONSTRAINT "__order_max_choices_n_fk_node_pnxaxmo3u5" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_max_selections_message" ADD CONSTRAINT "__order_max_selections_message_fk_node_fq7nosjmlj" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_min_choices" ADD CONSTRAINT "__order_min_choices_fk_node_nlzc6z5a3s" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_min_choices_n" ADD CONSTRAINT "__order_min_choices_n_fk_node_ypztfyrra5" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_min_selections_message" ADD CONSTRAINT "__order_min_selections_message_fk_node_lmkupphtsf" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."order_orientation" ADD CONSTRAINT "__order_orientation_fk_node_pu5bxiuslw" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."param" ADD CONSTRAINT "__param_fk_id_tag_kind_param_ahmia_5_b_7_ly_rcsml4x3b5" FOREIGN KEY ("id", "__tag_kind_param_ahmia5b7ly") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."param_type" ADD CONSTRAINT "__param_type_fk_node_cogiao26ry" FOREIGN KEY ("node") REFERENCES "qti"."param" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."picture" ADD CONSTRAINT "__picture_fk_id_tag_kind_picture_773_bajqqhs_aewxyrcnk5" FOREIGN KEY ("id", "__tag_kind_picture_773bajqqhs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_center_point" ADD CONSTRAINT "__position_object_center_point_fk_node_iovuq7dpck" FOREIGN KEY ("node") REFERENCES "qti"."position_object_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_interaction" ADD CONSTRAINT "__position_object_interaction_fk_id_tag_kind_qti_rn24lyfzfy" FOREIGN KEY ("id", "__tag_kind_qti_position_object_interaction_rge3opb2bo") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_interaction" ADD CONSTRAINT "__position_object_interaction_fk_id_root_kind_3bis25nbzv" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_max_choices" ADD CONSTRAINT "__position_object_max_choices_fk_node_mwfbsu7lka" FOREIGN KEY ("node") REFERENCES "qti"."position_object_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_min_choices" ADD CONSTRAINT "__position_object_min_choices_fk_node_ln32s55ww6" FOREIGN KEY ("node") REFERENCES "qti"."position_object_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."position_object_stage" ADD CONSTRAINT "__position_object_stage_fk_id_tag_kind_qti_position_ntryijnkfm" FOREIGN KEY ("id", "__tag_kind_qti_position_object_stage_opzdehxvaq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."q" ADD CONSTRAINT "__q_fk_id_tag_kind_q_v_2_ut_4_rkmxv_s76xk7gaue" FOREIGN KEY ("id", "__tag_kind_q_v2ut4rkmxv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."q_cite" ADD CONSTRAINT "__q_cite_fk_node_3ahyeo6j66" FOREIGN KEY ("node") REFERENCES "qti"."q" ("id");

ALTER TABLE "qti"."qti_label" ADD CONSTRAINT "__qti_label_fk_id_tag_kind_qti_label_li_3_rglggnp_ulbdkjdcy6" FOREIGN KEY ("id", "__tag_kind_qti_label_li3rglggnp") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rb" ADD CONSTRAINT "__rb_fk_id_tag_kind_rb_e_2_k_522_kmfe_fqnesymrij" FOREIGN KEY ("id", "__tag_kind_rb_e2k522kmfe") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."record_binding" ADD CONSTRAINT "__record_binding_fk_interaction_kind_lxuzwecsd5" FOREIGN KEY ("interaction_kind") REFERENCES "qti"."record_binding_fit" ("interaction_kind") NOT VALID;

ALTER TABLE "qti"."resource_lom_general" ADD CONSTRAINT "__resource_lom_general_fk_lom_fsj2jpxvxw" FOREIGN KEY ("lom") REFERENCES "qti"."lom_general" ("lom") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_general" ADD CONSTRAINT "__resource_lom_general_fk_lom_package_resource_xkjtdlbhgo" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."resource_lom_language_set" ADD CONSTRAINT "__resource_lom_language_set_fk_lom_package_resource_outjuw2j4n" FOREIGN KEY ("lom", "package", "resource") REFERENCES "qti"."resource_lom" ("lom", "package", "resource") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rp" ADD CONSTRAINT "__rp_fk_id_tag_kind_rp_tmr_6_b_4_giiz_t5ek3uxsmd" FOREIGN KEY ("id", "__tag_kind_rp_tmr6b4giiz") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rt" ADD CONSTRAINT "__rt_fk_id_tag_kind_rt_l_6_ufwynexl_5oxispt44y" FOREIGN KEY ("id", "__tag_kind_rt_l6ufwynexl") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rtc" ADD CONSTRAINT "__rtc_fk_id_tag_kind_rtc_2_t_3_ohmvv_2_y_ur5b2mx7xs" FOREIGN KEY ("id", "__tag_kind_rtc_2t3ohmvv2y") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_block" ADD CONSTRAINT "__rubric_block_fk_id_tag_kind_qti_rubric_block_vzconcc7uk" FOREIGN KEY ("id", "__tag_kind_qti_rubric_block_zyzsfdms3v") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_template_block" ADD CONSTRAINT "__rubric_template_block_fk_id_tag_kind_qti_template_7ndolb2xld" FOREIGN KEY ("id", "__tag_kind_qti_template_block_rubric_si2cxyuet3") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."rubric_template_inline" ADD CONSTRAINT "__rubric_template_inline_fk_id_tag_kind_qti_template_xc64dw3wwd" FOREIGN KEY ("id", "__tag_kind_qti_template_inline_rubric_o5ok5velix") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."ruby" ADD CONSTRAINT "__ruby_fk_id_tag_kind_ruby_hoq_7_dhdvio_bt5rpkcqpr" FOREIGN KEY ("id", "__tag_kind_ruby_hoq7dhdvio") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."samp" ADD CONSTRAINT "__samp_fk_id_tag_kind_samp_kjsz_6_s_7_ejv_uhke6sfco2" FOREIGN KEY ("id", "__tag_kind_samp_kjsz6s7ejv") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."section" ADD CONSTRAINT "__section_fk_id_tag_kind_section_taqgypcfv_7_tnkgvp2pul" FOREIGN KEY ("id", "__tag_kind_section_taqgypcfv7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."select_point_interaction" ADD CONSTRAINT "__select_point_interaction_fk_id_tag_kind_qti_select_rrsr2mrulv" FOREIGN KEY ("id", "__tag_kind_qti_select_point_interaction_dmgh3tps3a") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."select_point_interaction" ADD CONSTRAINT "__select_point_interaction_fk_id_root_kind_jhjlaz35f3" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."select_point_max_choices" ADD CONSTRAINT "__select_point_max_choices_fk_node_q7j62yb7dw" FOREIGN KEY ("node") REFERENCES "qti"."select_point_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."select_point_min_choices" ADD CONSTRAINT "__select_point_min_choices_fk_node_yhuv6jd6fs" FOREIGN KEY ("node") REFERENCES "qti"."select_point_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice" ADD CONSTRAINT "__simple_associable_choice_fk_id_tag_kind_qti_simple_452ikmtuv7" FOREIGN KEY ("id", "__tag_kind_qti_simple_associable_choice_dlcgsxx2bi") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_fixed" ADD CONSTRAINT "__simple_associable_choice_fixed_fk_node_h2hu6v6g2o" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_min" ADD CONSTRAINT "__simple_associable_choice_match_min_fk_node_2rk7ky4nrv" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_match_set_qbdpqt2dce" FOREIGN KEY ("match_set") REFERENCES "qti"."simple_match_set" ("id");

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_match_set_v4f7bkkeqy" FOREIGN KEY ("match_set", "interaction") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_node_x3eifhdjwu" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_node_rt5b7omadk" FOREIGN KEY ("node", "interaction") REFERENCES "qti"."simple_associable_choice" ("id", "interaction") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_match_set" ADD CONSTRAINT "__simple_associable_choice_match_set_fk_node_match_4w56n4si2i" FOREIGN KEY ("node", "match_set") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."simple_associable_choice_show_hide" ADD CONSTRAINT "__simple_associable_choice_show_hide_fk_node_svquyfwfx3" FOREIGN KEY ("node") REFERENCES "qti"."simple_associable_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."string_binding" ADD CONSTRAINT "__string_binding_fk_document_identifier_tag_kind_byc4r5o2ko" FOREIGN KEY ("document", "identifier", "__tag_kind_response_h34dku2bqb") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."string_binding" ADD CONSTRAINT "__string_binding_fk_node_document_fh7buc6gf7" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."strong" ADD CONSTRAINT "__strong_fk_id_tag_kind_strong_gxhcapelxs_44mkc75d2j" FOREIGN KEY ("id", "__tag_kind_strong_gxhcapelxs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stylesheet" ADD CONSTRAINT "__stylesheet_fk_id_tag_kind_qti_stylesheet_krvjdq3phl" FOREIGN KEY ("id", "__tag_kind_qti_stylesheet_zrdvcrjdok") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stylesheet_media" ADD CONSTRAINT "__stylesheet_media_fk_node_x4cqiy6cth" FOREIGN KEY ("node") REFERENCES "qti"."stylesheet" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."stylesheet_title" ADD CONSTRAINT "__stylesheet_title_fk_node_3u7nmxzfan" FOREIGN KEY ("node") REFERENCES "qti"."stylesheet" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sub" ADD CONSTRAINT "__sub_fk_id_tag_kind_sub_c_5_sixq_4_viw_wl2tysz6bk" FOREIGN KEY ("id", "__tag_kind_sub_c5sixq4viw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."summary" ADD CONSTRAINT "__summary_fk_id_tag_kind_summary_4_tcbjxb_4_su_olb3anislw" FOREIGN KEY ("id", "__tag_kind_summary_4tcbjxb4su") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."sup" ADD CONSTRAINT "__sup_fk_id_tag_kind_sup_drhon_2_pewx_z263wykbub" FOREIGN KEY ("id", "__tag_kind_sup_drhon2pewx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."table" ADD CONSTRAINT "__table_fk_id_tag_kind_table_o_2_mr_32_dc_7_l_qlzuskyyne" FOREIGN KEY ("id", "__tag_kind_table_o2mr32dc7l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."table_summary" ADD CONSTRAINT "__table_summary_fk_node_ptu5r55ujz" FOREIGN KEY ("node") REFERENCES "qti"."table" ("id");

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

ALTER TABLE "qti"."template_content_ref" ADD CONSTRAINT "__template_content_ref_fk_document_identifier_tag_pqdzt3m4ah" FOREIGN KEY ("document", "identifier", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("document", "identifier", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_content_ref" ADD CONSTRAINT "__template_content_ref_fk_document_identifier_base_fauuwbhust" FOREIGN KEY ("document", "identifier", "base_type", "cardinality") REFERENCES "qti"."typed_declaration" ("document", "identifier", "base_type", "cardinality") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_content_ref" ADD CONSTRAINT "__template_content_ref_fk_node_document_5ogkf5dax5" FOREIGN KEY ("node", "document") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_declaration_arm" ADD CONSTRAINT "__template_declaration_arm_fk_id_tag_kind_qti_7xly7smluk" FOREIGN KEY ("id", "__tag_kind_qti_template_declaration_kfzjha6iro") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_declaration_arm" ADD CONSTRAINT "__template_declaration_arm_fk_id_tag_kind_template_6_oi2ijzf4ae" FOREIGN KEY ("id", "__tag_kind_template_6mdj2h4ofc") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_feedback_block" ADD CONSTRAINT "__template_feedback_block_fk_id_tag_kind_qti_i3ukwhqmkc" FOREIGN KEY ("id", "__tag_kind_qti_feedback_block_template_koyzwlsapg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."template_inline" ADD CONSTRAINT "__template_inline_fk_id_tag_kind_qti_template_inline_ay5hjhse3h" FOREIGN KEY ("id", "__tag_kind_qti_template_inline_zkyrmcpqzq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_expected_length" ADD CONSTRAINT "__text_entry_expected_length_fk_node_a2gmbouglv" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_format" ADD CONSTRAINT "__text_entry_format_fk_node_b7lvzp2pdg" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_interaction" ADD CONSTRAINT "__text_entry_interaction_fk_id_tag_kind_qti_text_6v7aku2pmn" FOREIGN KEY ("id", "__tag_kind_qti_text_entry_interaction_qjak2y2y6n") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_interaction" ADD CONSTRAINT "__text_entry_interaction_fk_id_root_kind_raez4v5ile" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_pattern_mask" ADD CONSTRAINT "__text_entry_pattern_mask_fk_node_hz5tzx5zrs" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_patternmask_message" ADD CONSTRAINT "__text_entry_patternmask_message_fk_node_xl5bre6fww" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."text_entry_placeholder_text" ADD CONSTRAINT "__text_entry_placeholder_text_fk_node_244qxgyp4t" FOREIGN KEY ("node") REFERENCES "qti"."text_entry_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE "qti"."track_srclang" ADD CONSTRAINT "__track_srclang_fk_node_fsf3mxypyl" FOREIGN KEY ("node") REFERENCES "qti"."track" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."tt" ADD CONSTRAINT "__tt_fk_id_tag_kind_tt_etz_3_iybkyw_k5n7k5bnfy" FOREIGN KEY ("id", "__tag_kind_tt_etz3iybkyw") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."typed_declaration" ADD CONSTRAINT "__typed_declaration_fk_id_kind_wxilruvjz2" FOREIGN KEY ("id", "kind") REFERENCES "qti"."declaration" ("id", "kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."ul" ADD CONSTRAINT "__ul_fk_id_tag_kind_ul_n_7_u_7_vjrkov_dbve75m45d" FOREIGN KEY ("id", "__tag_kind_ul_n7u7vjrkov") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."upload_interaction" ADD CONSTRAINT "__upload_interaction_fk_id_tag_kind_qti_upload_n7tncgnpn3" FOREIGN KEY ("id", "__tag_kind_qti_upload_interaction_cjum6engod") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."upload_interaction" ADD CONSTRAINT "__upload_interaction_fk_id_root_kind_jxw57ybghm" FOREIGN KEY ("id", "root_kind") REFERENCES "qti"."node" ("id", "root_kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."upload_type" ADD CONSTRAINT "__upload_type_fk_node_xwkscxadrh" FOREIGN KEY ("node") REFERENCES "qti"."upload_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."var" ADD CONSTRAINT "__var_fk_id_tag_kind_var_ufngemq_3_yq_frpjy6ymvf" FOREIGN KEY ("id", "__tag_kind_var_ufngemq3yq") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."acronym"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."address"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."ancestry_step"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."associate_max_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."associate_min_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_admission"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."attribute_idref"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."blockquote"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."blockquote_cite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."br"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."caption"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."catalog_info"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."companion_materials_info"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dd"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_media_loop"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_order_shuffle"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_slider_step_label"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_track_kind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_valuetype"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dl"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."document_lang"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."drawing_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."dt"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."feedback_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."feedback_inline"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."feedback_outcome_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."figcaption"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."figure"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."gap_match_max_associations"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_associate_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_associate_max_associations"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_gap_match_max_associations"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_order_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_order_max_choices_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_order_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."graphic_order_min_choices_n"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hotspot_min_choices"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."hottext_min_choices"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."li"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_first_column_header"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_group"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_max_associations"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."match_min_associations"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."modal_feedback"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."modal_feedback_title"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."nav"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_choices_container_width"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_max_choices_n"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_max_selections_message"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."order_min_choices"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."param"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."param_type"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."position_object_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."position_object_min_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."position_object_stage"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."q"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."q_cite"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."rb"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."record_binding_fit"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_general"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."resource_lom_language_set"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."samp"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."section"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."select_point_interaction"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."select_point_max_choices"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."select_point_min_choices"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."string_binding"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_content_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_declaration_arm"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_feedback_block"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."template_inline"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."tt"
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
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."var"
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

CREATE VIEW "qti__author"."a" ("href", "id") AS
SELECT "r1"."href", "r1"."id"
FROM "qti"."a" AS "r1";

GRANT SELECT ON TABLE "qti__author"."a" TO "qti__author";

CREATE VIEW "qti__author"."a_type" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."a_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."a_type" TO "qti__author";

CREATE VIEW "qti__author"."abbr" ("id") AS
SELECT "r1"."id"
FROM "qti"."abbr" AS "r1";

GRANT SELECT ON TABLE "qti__author"."abbr" TO "qti__author";

CREATE VIEW "qti__author"."acronym" ("id") AS
SELECT "r1"."id"
FROM "qti"."acronym" AS "r1";

GRANT SELECT ON TABLE "qti__author"."acronym" TO "qti__author";

CREATE VIEW "qti__author"."address" ("id") AS
SELECT "r1"."id"
FROM "qti"."address" AS "r1";

GRANT SELECT ON TABLE "qti__author"."address" TO "qti__author";

CREATE VIEW "qti__author"."admission" ("child", "parent", "version") AS
SELECT "r1"."child", "r1"."parent", "r1"."version"
FROM "qti"."admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."admission" TO "qti__author";

CREATE VIEW "qti__author"."ancestry_step" ("ancestry", "kind", "next") AS
SELECT "r1"."ancestry", "r1"."kind", "r1"."next"
FROM "qti"."ancestry_step" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ancestry_step" TO "qti__author";

CREATE VIEW "qti__author"."area_map_entry" ("area_mapping", "id", "mapped_value", "position", "shape") AS
SELECT "r1"."area_mapping", "r1"."id", "r1"."mapped_value", "r1"."position", "r1"."shape"
FROM "qti"."area_map_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."area_map_entry" TO "qti__author";

CREATE VIEW "qti__author"."area_mapping" ("declaration", "default_value", "document", "id") AS
SELECT "r1"."declaration", "r1"."default_value", "r1"."document", "r1"."id"
FROM "qti"."area_mapping" AS "r1";

GRANT SELECT ON TABLE "qti__author"."area_mapping" TO "qti__author";

CREATE VIEW "qti__author"."area_mapping_lower_bound" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."area_mapping_lower_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."area_mapping_lower_bound" TO "qti__author";

CREATE VIEW "qti__author"."area_mapping_upper_bound" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."area_mapping_upper_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."area_mapping_upper_bound" TO "qti__author";

CREATE VIEW "qti__author"."aria_activedescendant" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_activedescendant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_activedescendant" TO "qti__author";

CREATE VIEW "qti__author"."aria_atomic" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_atomic" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_atomic" TO "qti__author";

CREATE VIEW "qti__author"."aria_autocomplete" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_autocomplete" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_autocomplete" TO "qti__author";

CREATE VIEW "qti__author"."aria_busy" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_busy" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_busy" TO "qti__author";

CREATE VIEW "qti__author"."aria_checked" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_checked" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_checked" TO "qti__author";

CREATE VIEW "qti__author"."aria_colcount" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_colcount" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_colcount" TO "qti__author";

CREATE VIEW "qti__author"."aria_colindex" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_colindex" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_colindex" TO "qti__author";

CREATE VIEW "qti__author"."aria_colspan" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_colspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_colspan" TO "qti__author";

CREATE VIEW "qti__author"."aria_controls" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_controls" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_controls" TO "qti__author";

CREATE VIEW "qti__author"."aria_current" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_current" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_current" TO "qti__author";

CREATE VIEW "qti__author"."aria_describedby" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_describedby" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_describedby" TO "qti__author";

CREATE VIEW "qti__author"."aria_details" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_details" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_details" TO "qti__author";

CREATE VIEW "qti__author"."aria_disabled" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_disabled" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_disabled" TO "qti__author";

CREATE VIEW "qti__author"."aria_errormessage" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_errormessage" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_errormessage" TO "qti__author";

CREATE VIEW "qti__author"."aria_expanded" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_expanded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_expanded" TO "qti__author";

CREATE VIEW "qti__author"."aria_flowto" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_flowto" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_flowto" TO "qti__author";

CREATE VIEW "qti__author"."aria_haspopup" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_haspopup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_haspopup" TO "qti__author";

CREATE VIEW "qti__author"."aria_hidden" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_hidden" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_hidden" TO "qti__author";

CREATE VIEW "qti__author"."aria_invalid" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_invalid" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_invalid" TO "qti__author";

CREATE VIEW "qti__author"."aria_keyshortcuts" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_keyshortcuts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_keyshortcuts" TO "qti__author";

CREATE VIEW "qti__author"."aria_keyshorts" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_keyshorts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_keyshorts" TO "qti__author";

CREATE VIEW "qti__author"."aria_label" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_label" TO "qti__author";

CREATE VIEW "qti__author"."aria_labelledby" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_labelledby" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_labelledby" TO "qti__author";

CREATE VIEW "qti__author"."aria_level" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_level" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_level" TO "qti__author";

CREATE VIEW "qti__author"."aria_live" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_live" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_live" TO "qti__author";

CREATE VIEW "qti__author"."aria_modal" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_modal" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_modal" TO "qti__author";

CREATE VIEW "qti__author"."aria_multiline" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_multiline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_multiline" TO "qti__author";

CREATE VIEW "qti__author"."aria_multiselectable" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_multiselectable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_multiselectable" TO "qti__author";

CREATE VIEW "qti__author"."aria_orientation" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_orientation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_orientation" TO "qti__author";

CREATE VIEW "qti__author"."aria_owns" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_owns" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_owns" TO "qti__author";

CREATE VIEW "qti__author"."aria_placeholder" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_placeholder" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_placeholder" TO "qti__author";

CREATE VIEW "qti__author"."aria_posinset" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_posinset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_posinset" TO "qti__author";

CREATE VIEW "qti__author"."aria_pressed" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_pressed" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_pressed" TO "qti__author";

CREATE VIEW "qti__author"."aria_readonly" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_readonly" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_readonly" TO "qti__author";

CREATE VIEW "qti__author"."aria_relevant" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_relevant" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_relevant" TO "qti__author";

CREATE VIEW "qti__author"."aria_required" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_required" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_required" TO "qti__author";

CREATE VIEW "qti__author"."aria_role" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_role" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_role" TO "qti__author";

CREATE VIEW "qti__author"."aria_roledescription" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_roledescription" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_roledescription" TO "qti__author";

CREATE VIEW "qti__author"."aria_rowcount" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_rowcount" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_rowcount" TO "qti__author";

CREATE VIEW "qti__author"."aria_rowindex" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_rowindex" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_rowindex" TO "qti__author";

CREATE VIEW "qti__author"."aria_rowspan" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_rowspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_rowspan" TO "qti__author";

CREATE VIEW "qti__author"."aria_selected" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_selected" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_selected" TO "qti__author";

CREATE VIEW "qti__author"."aria_setsize" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_setsize" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_setsize" TO "qti__author";

CREATE VIEW "qti__author"."aria_sort" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_sort" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_sort" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuemax" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuemax" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuemax" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuemin" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuemin" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuemin" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuenow" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuenow" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuenow" TO "qti__author";

CREATE VIEW "qti__author"."aria_valuetext" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."aria_valuetext" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aria_valuetext" TO "qti__author";

CREATE VIEW "qti__author"."article" ("id") AS
SELECT "r1"."id"
FROM "qti"."article" AS "r1";

GRANT SELECT ON TABLE "qti__author"."article" TO "qti__author";

CREATE VIEW "qti__author"."aside" ("id") AS
SELECT "r1"."id"
FROM "qti"."aside" AS "r1";

GRANT SELECT ON TABLE "qti__author"."aside" TO "qti__author";

CREATE VIEW "qti__author"."assessment_item" ("adaptive", "id", "time_dependent", "tree") AS
SELECT "r1"."adaptive", "r1"."id", "r1"."time_dependent", "r1"."tree"
FROM "qti"."assessment_item" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item" TO "qti__author";

CREATE VIEW "qti__author"."assessment_item_label" ("node", "tree", "value", "version") AS
SELECT "r1"."node", "r1"."tree", "r1"."value", "r1"."version"
FROM "qti"."assessment_item_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item_label" TO "qti__author";

CREATE VIEW "qti__author"."associable_hotspot" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n", "parent_kind", "shape", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape", "r1"."show_hide"
FROM "qti"."associable_hotspot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot" TO "qti__author";

CREATE VIEW "qti__author"."associable_hotspot_label" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."associable_hotspot_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot_label" TO "qti__author";

CREATE VIEW "qti__author"."associable_hotspot_match_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."associable_hotspot_match_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot_match_min" TO "qti__author";

CREATE VIEW "qti__author"."associate_interaction" ("id", "max_associations_n", "min_associations_n", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."associate_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associate_interaction" TO "qti__author";

CREATE VIEW "qti__author"."associate_max_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."associate_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associate_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."associate_min_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."associate_min_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associate_min_associations" TO "qti__author";

CREATE VIEW "qti__author"."attribute_admission" ("attribute", "kind") AS
SELECT "r1"."attribute", "r1"."kind"
FROM "qti"."attribute_admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_admission" TO "qti__author";

CREATE VIEW "qti__author"."attribute_idref" ("attribute", "document", "node", "position", "target") AS
SELECT "r1"."attribute", "r1"."document", "r1"."node", "r1"."position", "r1"."target"
FROM "qti"."attribute_idref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_idref" TO "qti__author";

CREATE VIEW "qti__author"."attribute_lexical" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_lexical" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_lexical" TO "qti__author";

CREATE VIEW "qti__author"."audio" ("id", "version") AS
SELECT "r1"."id", "r1"."version"
FROM "qti"."audio" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio" TO "qti__author";

CREATE VIEW "qti__author"."audio_autoplay" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."audio_autoplay" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_autoplay" TO "qti__author";

CREATE VIEW "qti__author"."audio_controls" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."audio_controls" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_controls" TO "qti__author";

CREATE VIEW "qti__author"."audio_crossorigin" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."audio_crossorigin" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_crossorigin" TO "qti__author";

CREATE VIEW "qti__author"."audio_loop" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."audio_loop" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_loop" TO "qti__author";

CREATE VIEW "qti__author"."audio_mediagroup" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."audio_mediagroup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_mediagroup" TO "qti__author";

CREATE VIEW "qti__author"."audio_muted" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."audio_muted" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_muted" TO "qti__author";

CREATE VIEW "qti__author"."audio_preload" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."audio_preload" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_preload" TO "qti__author";

CREATE VIEW "qti__author"."audio_src" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."audio_src" AS "r1";

GRANT SELECT ON TABLE "qti__author"."audio_src" TO "qti__author";

CREATE VIEW "qti__author"."b" ("id") AS
SELECT "r1"."id"
FROM "qti"."b" AS "r1";

GRANT SELECT ON TABLE "qti__author"."b" TO "qti__author";

CREATE VIEW "qti__author"."bdi" ("id") AS
SELECT "r1"."id"
FROM "qti"."bdi" AS "r1";

GRANT SELECT ON TABLE "qti__author"."bdi" TO "qti__author";

CREATE VIEW "qti__author"."bdo" ("id") AS
SELECT "r1"."id"
FROM "qti"."bdo" AS "r1";

GRANT SELECT ON TABLE "qti__author"."bdo" TO "qti__author";

CREATE VIEW "qti__author"."bdo_title" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."bdo_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."bdo_title" TO "qti__author";

CREATE VIEW "qti__author"."big" ("id") AS
SELECT "r1"."id"
FROM "qti"."big" AS "r1";

GRANT SELECT ON TABLE "qti__author"."big" TO "qti__author";

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."blockquote" ("id") AS
SELECT "r1"."id"
FROM "qti"."blockquote" AS "r1";

GRANT SELECT ON TABLE "qti__author"."blockquote" TO "qti__author";

CREATE VIEW "qti__author"."blockquote_cite" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."blockquote_cite" AS "r1";

GRANT SELECT ON TABLE "qti__author"."blockquote_cite" TO "qti__author";

CREATE VIEW "qti__author"."br" ("id") AS
SELECT "r1"."id"
FROM "qti"."br" AS "r1";

GRANT SELECT ON TABLE "qti__author"."br" TO "qti__author";

CREATE VIEW "qti__author"."built_in_ref" ("id", "name", "referrer_kind") AS
SELECT "r1"."id", "r1"."name", "r1"."referrer_kind"
FROM "qti"."built_in_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."built_in_ref" TO "qti__author";

CREATE VIEW "qti__author"."caption" ("id") AS
SELECT "r1"."id"
FROM "qti"."caption" AS "r1";

GRANT SELECT ON TABLE "qti__author"."caption" TO "qti__author";

CREATE VIEW "qti__author"."catalog_info" ("id") AS
SELECT "r1"."id"
FROM "qti"."catalog_info" AS "r1";

GRANT SELECT ON TABLE "qti__author"."catalog_info" TO "qti__author";

CREATE VIEW "qti__author"."choice_template_ref" ("base_type", "cardinality", "document", "identifier", "node") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."identifier", "r1"."node"
FROM "qti"."choice_template_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."choice_template_ref" TO "qti__author";

CREATE VIEW "qti__author"."cite" ("id") AS
SELECT "r1"."id"
FROM "qti"."cite" AS "r1";

GRANT SELECT ON TABLE "qti__author"."cite" TO "qti__author";

CREATE VIEW "qti__author"."code" ("id") AS
SELECT "r1"."id"
FROM "qti"."code" AS "r1";

GRANT SELECT ON TABLE "qti__author"."code" TO "qti__author";

CREATE VIEW "qti__author"."col" ("id") AS
SELECT "r1"."id"
FROM "qti"."col" AS "r1";

GRANT SELECT ON TABLE "qti__author"."col" TO "qti__author";

CREATE VIEW "qti__author"."col_span" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."col_span" AS "r1";

GRANT SELECT ON TABLE "qti__author"."col_span" TO "qti__author";

CREATE VIEW "qti__author"."colgroup" ("id") AS
SELECT "r1"."id"
FROM "qti"."colgroup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."colgroup" TO "qti__author";

CREATE VIEW "qti__author"."colgroup_span" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."colgroup_span" AS "r1";

GRANT SELECT ON TABLE "qti__author"."colgroup_span" TO "qti__author";

CREATE VIEW "qti__author"."companion_materials_info" ("id") AS
SELECT "r1"."id"
FROM "qti"."companion_materials_info" AS "r1";

GRANT SELECT ON TABLE "qti__author"."companion_materials_info" TO "qti__author";

CREATE VIEW "qti__author"."content_body_feedback" ("id") AS
SELECT "r1"."id"
FROM "qti"."content_body_feedback" AS "r1";

GRANT SELECT ON TABLE "qti__author"."content_body_feedback" TO "qti__author";

CREATE VIEW "qti__author"."content_body_modal" ("id") AS
SELECT "r1"."id"
FROM "qti"."content_body_modal" AS "r1";

GRANT SELECT ON TABLE "qti__author"."content_body_modal" TO "qti__author";

CREATE VIEW "qti__author"."content_body_rubric" ("id") AS
SELECT "r1"."id"
FROM "qti"."content_body_rubric" AS "r1";

GRANT SELECT ON TABLE "qti__author"."content_body_rubric" TO "qti__author";

CREATE VIEW "qti__author"."content_body_rubric_template" ("id") AS
SELECT "r1"."id"
FROM "qti"."content_body_rubric_template" AS "r1";

GRANT SELECT ON TABLE "qti__author"."content_body_rubric_template" TO "qti__author";

CREATE VIEW "qti__author"."content_body_template" ("id") AS
SELECT "r1"."id"
FROM "qti"."content_body_template" AS "r1";

GRANT SELECT ON TABLE "qti__author"."content_body_template" TO "qti__author";

CREATE VIEW "qti__author"."context_declaration_arm" ("id", "version") AS
SELECT "r1"."id", "r1"."version"
FROM "qti"."context_declaration_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."context_declaration_arm" TO "qti__author";

CREATE VIEW "qti__author"."context_declaration_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."context_declaration_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."context_declaration_id" TO "qti__author";

CREATE VIEW "qti__author"."coords" ("node", "owner_kind", "shape", "value") AS
SELECT "r1"."node", "r1"."owner_kind", "r1"."shape", "r1"."value"
FROM "qti"."coords" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords" TO "qti__author";

CREATE VIEW "qti__author"."coords_circle" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."coords_circle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords_circle" TO "qti__author";

CREATE VIEW "qti__author"."coords_default" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."coords_default" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords_default" TO "qti__author";

CREATE VIEW "qti__author"."coords_ellipse" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."coords_ellipse" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords_ellipse" TO "qti__author";

CREATE VIEW "qti__author"."coords_poly" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."coords_poly" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords_poly" TO "qti__author";

CREATE VIEW "qti__author"."coords_rect" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."coords_rect" AS "r1";

GRANT SELECT ON TABLE "qti__author"."coords_rect" TO "qti__author";

CREATE VIEW "qti__author"."dd" ("id") AS
SELECT "r1"."id"
FROM "qti"."dd" AS "r1";

GRANT SELECT ON TABLE "qti__author"."dd" TO "qti__author";

CREATE VIEW "qti__author"."declaration" ("document", "id", "identifier", "kind", "shape") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape"
FROM "qti"."declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration" TO "qti__author";

CREATE VIEW "qti__author"."declaration_normal_maximum" ("declaration", "value") AS
SELECT "r1"."declaration", "r1"."value"
FROM "qti"."declaration_normal_maximum" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declaration_normal_maximum" TO "qti__author";

CREATE VIEW "qti__author"."declared_area_mapping_default_value" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_area_mapping_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_area_mapping_default_value" TO "qti__author";

CREATE VIEW "qti__author"."declared_associable_hotspot_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_associable_hotspot_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_associable_hotspot_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_associate_max_associations" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_associate_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_associate_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."declared_associate_min_associations" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_associate_min_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_associate_min_associations" TO "qti__author";

CREATE VIEW "qti__author"."declared_associate_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_associate_shuffle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_associate_shuffle" TO "qti__author";

CREATE VIEW "qti__author"."declared_extended_text_base" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_extended_text_base" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_extended_text_base" TO "qti__author";

CREATE VIEW "qti__author"."declared_extended_text_format" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_extended_text_format" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_extended_text_format" TO "qti__author";

CREATE VIEW "qti__author"."declared_extended_text_min_strings" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_extended_text_min_strings" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_extended_text_min_strings" TO "qti__author";

CREATE VIEW "qti__author"."declared_feedback_block_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_feedback_block_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_feedback_block_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_feedback_inline_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_feedback_inline_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_feedback_inline_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_img_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_img_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_img_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_match_max_associations" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_match_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_match_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_match_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_match_shuffle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_match_shuffle" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_required" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_required" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_required" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_text_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_text_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_text_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_graphic_associate_max_associations" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_graphic_associate_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_graphic_associate_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."declared_graphic_gap_match_max_associations" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_graphic_gap_match_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_graphic_gap_match_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."declared_hotspot_choice_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hotspot_choice_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hotspot_choice_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_hotspot_max_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hotspot_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hotspot_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_hotspot_min_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hotspot_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hotspot_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_hottext_max_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hottext_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hottext_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_hottext_min_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hottext_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hottext_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_hottext_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hottext_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hottext_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_include_boundary" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_include_boundary" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_include_boundary" TO "qti__author";

CREATE VIEW "qti__author"."declared_inline_choice_fixed" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_inline_choice_fixed" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_inline_choice_fixed" TO "qti__author";

CREATE VIEW "qti__author"."declared_inline_choice_min_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_inline_choice_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_inline_choice_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_inline_choice_required" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_inline_choice_required" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_inline_choice_required" TO "qti__author";

CREATE VIEW "qti__author"."declared_inline_choice_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_inline_choice_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_inline_choice_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_inline_choice_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_inline_choice_shuffle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_inline_choice_shuffle" TO "qti__author";

CREATE VIEW "qti__author"."declared_map_entry_case_sensitive" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_map_entry_case_sensitive" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_map_entry_case_sensitive" TO "qti__author";

CREATE VIEW "qti__author"."declared_mapping_default_value" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_mapping_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_mapping_default_value" TO "qti__author";

CREATE VIEW "qti__author"."declared_match_max_associations" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_match_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_match_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."declared_match_min_associations" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_match_min_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_match_min_associations" TO "qti__author";

CREATE VIEW "qti__author"."declared_match_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_match_shuffle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_match_shuffle" TO "qti__author";

CREATE VIEW "qti__author"."declared_math_variable" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_math_variable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_math_variable" TO "qti__author";

CREATE VIEW "qti__author"."declared_media_loop" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_media_loop" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_media_loop" TO "qti__author";

CREATE VIEW "qti__author"."declared_order_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_order_shuffle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_order_shuffle" TO "qti__author";

CREATE VIEW "qti__author"."declared_param_variable" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_param_variable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_param_variable" TO "qti__author";

CREATE VIEW "qti__author"."declared_position_object_max_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_position_object_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_position_object_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_printed_variable_base" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_printed_variable_base" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_printed_variable_base" TO "qti__author";

CREATE VIEW "qti__author"."declared_printed_variable_delimiter" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_printed_variable_delimiter" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_printed_variable_delimiter" TO "qti__author";

CREATE VIEW "qti__author"."declared_printed_variable_mapping_indicator" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_printed_variable_mapping_indicator" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_printed_variable_mapping_indicator" TO "qti__author";

CREATE VIEW "qti__author"."declared_printed_variable_power_form" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_printed_variable_power_form" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_printed_variable_power_form" TO "qti__author";

CREATE VIEW "qti__author"."declared_ref" ("declaration_kind", "document", "id", "identifier", "referrer_kind") AS
SELECT "r1"."declaration_kind", "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind"
FROM "qti"."declared_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_ref" TO "qti__author";

CREATE VIEW "qti__author"."declared_rubric_template_block_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_rubric_template_block_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_rubric_template_block_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_rubric_template_inline_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_rubric_template_inline_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_rubric_template_inline_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_select_point_max_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_select_point_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_select_point_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_select_point_min_choices" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_select_point_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_select_point_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."declared_slider_step_label" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_slider_step_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_slider_step_label" TO "qti__author";

CREATE VIEW "qti__author"."declared_template_block_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_template_block_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_template_block_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_template_feedback_block_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_template_feedback_block_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_template_feedback_block_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_template_inline_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_template_inline_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_template_inline_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_text_entry_base" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_text_entry_base" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_text_entry_base" TO "qti__author";

CREATE VIEW "qti__author"."declared_track_kind" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_track_kind" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_track_kind" TO "qti__author";

CREATE VIEW "qti__author"."declared_valuetype" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_valuetype" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_valuetype" TO "qti__author";

CREATE VIEW "qti__author"."details" ("id") AS
SELECT "r1"."id"
FROM "qti"."details" AS "r1";

GRANT SELECT ON TABLE "qti__author"."details" TO "qti__author";

CREATE VIEW "qti__author"."details_open" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."details_open" AS "r1";

GRANT SELECT ON TABLE "qti__author"."details_open" TO "qti__author";

CREATE VIEW "qti__author"."dfn" ("id") AS
SELECT "r1"."id"
FROM "qti"."dfn" AS "r1";

GRANT SELECT ON TABLE "qti__author"."dfn" TO "qti__author";

CREATE VIEW "qti__author"."div" ("id") AS
SELECT "r1"."id"
FROM "qti"."div" AS "r1";

GRANT SELECT ON TABLE "qti__author"."div" TO "qti__author";

CREATE VIEW "qti__author"."dl" ("id") AS
SELECT "r1"."id"
FROM "qti"."dl" AS "r1";

GRANT SELECT ON TABLE "qti__author"."dl" TO "qti__author";

CREATE VIEW "qti__author"."document" ("id", "package", "path", "resource", "resource_type", "root", "version") AS
SELECT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version"
FROM "qti"."document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document" TO "qti__author";

CREATE VIEW "qti__author"."document_id" ("document", "holder", "id") AS
SELECT "r1"."document", "r1"."holder", "r1"."id"
FROM "qti"."document_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_id" TO "qti__author";

CREATE VIEW "qti__author"."document_lang" ("document", "lom_general", "package", "resource", "value") AS
SELECT "r1"."document", "r1"."lom_general", "r1"."package", "r1"."resource", "r1"."value"
FROM "qti"."document_lang" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_lang" TO "qti__author";

CREATE VIEW "qti__author"."drawing_interaction" ("id", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."drawing_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."drawing_interaction" TO "qti__author";

CREATE VIEW "qti__author"."dt" ("id") AS
SELECT "r1"."id"
FROM "qti"."dt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."dt" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_ancestry", "child_kind", "parent", "parent_ancestry", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_ancestry", "r1"."child_kind", "r1"."parent", "r1"."parent_ancestry", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."em" ("id") AS
SELECT "r1"."id"
FROM "qti"."em" AS "r1";

GRANT SELECT ON TABLE "qti__author"."em" TO "qti__author";

CREATE VIEW "qti__author"."end_attempt_count_attempt" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."end_attempt_count_attempt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."end_attempt_count_attempt" TO "qti__author";

CREATE VIEW "qti__author"."end_attempt_interaction" ("id", "response_identifier", "root_kind", "title") AS
SELECT "r1"."id", "r1"."response_identifier", "r1"."root_kind", "r1"."title"
FROM "qti"."end_attempt_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."end_attempt_interaction" TO "qti__author";

CREATE VIEW "qti__author"."expression" ("bounded", "document", "id", "kind", "min") AS
SELECT "r1"."bounded", "r1"."document", "r1"."id", "r1"."kind", "r1"."min"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."expression_max" ("id", "kind", "max") AS
SELECT "r1"."id", "r1"."kind", "r1"."max"
FROM "qti"."expression_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_max" TO "qti__author";

CREATE VIEW "qti__author"."extended_text_expected_length" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."extended_text_expected_length" AS "r1";

GRANT SELECT ON TABLE "qti__author"."extended_text_expected_length" TO "qti__author";

CREATE VIEW "qti__author"."extended_text_expected_lines" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."extended_text_expected_lines" AS "r1";

GRANT SELECT ON TABLE "qti__author"."extended_text_expected_lines" TO "qti__author";

CREATE VIEW "qti__author"."extended_text_interaction" ("base", "format", "id", "min_strings", "response_identifier", "root_kind") AS
SELECT "r1"."base", "r1"."format", "r1"."id", "r1"."min_strings", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."extended_text_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."extended_text_interaction" TO "qti__author";

CREATE VIEW "qti__author"."extended_text_max_strings" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."extended_text_max_strings" AS "r1";

GRANT SELECT ON TABLE "qti__author"."extended_text_max_strings" TO "qti__author";

CREATE VIEW "qti__author"."extended_text_pattern_mask" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."extended_text_pattern_mask" AS "r1";

GRANT SELECT ON TABLE "qti__author"."extended_text_pattern_mask" TO "qti__author";

CREATE VIEW "qti__author"."extended_text_patternmask_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."extended_text_patternmask_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."extended_text_patternmask_message" TO "qti__author";

CREATE VIEW "qti__author"."extended_text_placeholder_text" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."extended_text_placeholder_text" AS "r1";

GRANT SELECT ON TABLE "qti__author"."extended_text_placeholder_text" TO "qti__author";

CREATE VIEW "qti__author"."feedback_block" ("id", "identifier", "outcome_identifier", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide"
FROM "qti"."feedback_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."feedback_block" TO "qti__author";

CREATE VIEW "qti__author"."feedback_inline" ("id", "identifier", "outcome_identifier", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide"
FROM "qti"."feedback_inline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."feedback_inline" TO "qti__author";

CREATE VIEW "qti__author"."feedback_outcome_ref" ("base_type", "cardinality", "document", "identifier", "node") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."identifier", "r1"."node"
FROM "qti"."feedback_outcome_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."feedback_outcome_ref" TO "qti__author";

CREATE VIEW "qti__author"."figcaption" ("id") AS
SELECT "r1"."id"
FROM "qti"."figcaption" AS "r1";

GRANT SELECT ON TABLE "qti__author"."figcaption" TO "qti__author";

CREATE VIEW "qti__author"."figure" ("id") AS
SELECT "r1"."id"
FROM "qti"."figure" AS "r1";

GRANT SELECT ON TABLE "qti__author"."figure" TO "qti__author";

CREATE VIEW "qti__author"."footer" ("id") AS
SELECT "r1"."id"
FROM "qti"."footer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."footer" TO "qti__author";

CREATE VIEW "qti__author"."gap" ("id", "identifier", "interaction", "required", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."required", "r1"."show_hide"
FROM "qti"."gap" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap" TO "qti__author";

CREATE VIEW "qti__author"."gap_img" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."show_hide"
FROM "qti"."gap_img" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_img" TO "qti__author";

CREATE VIEW "qti__author"."gap_img_left" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_img_left" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_img_left" TO "qti__author";

CREATE VIEW "qti__author"."gap_img_match_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_img_match_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_img_match_min" TO "qti__author";

CREATE VIEW "qti__author"."gap_img_object_label" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_img_object_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_img_object_label" TO "qti__author";

CREATE VIEW "qti__author"."gap_img_top" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_img_top" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_img_top" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_binding" ("cardinality", "node") AS
SELECT "r1"."cardinality", "r1"."node"
FROM "qti"."gap_match_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_binding" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_choices_container_width" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_match_choices_container_width" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_choices_container_width" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_interaction" ("id", "max_associations_n", "min_associations_n", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."gap_match_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_interaction" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_max_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_match_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_max_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_match_max_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_max_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_min_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_match_min_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_min_associations" TO "qti__author";

CREATE VIEW "qti__author"."gap_match_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_match_min_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_match_min_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."gap_text" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."show_hide"
FROM "qti"."gap_text" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_text" TO "qti__author";

CREATE VIEW "qti__author"."gap_text_match_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."gap_text_match_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_text_match_min" TO "qti__author";

CREATE VIEW "qti__author"."graphic_associate_interaction" ("id", "max_associations_n", "min_associations_n", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."graphic_associate_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_associate_interaction" TO "qti__author";

CREATE VIEW "qti__author"."graphic_associate_max_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_associate_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_associate_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."graphic_associate_min_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_associate_min_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_associate_min_associations" TO "qti__author";

CREATE VIEW "qti__author"."graphic_gap_match_choices_container_width" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_gap_match_choices_container_width" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_gap_match_choices_container_width" TO "qti__author";

CREATE VIEW "qti__author"."graphic_gap_match_interaction" ("id", "max_associations_n", "min_associations_n", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."graphic_gap_match_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_gap_match_interaction" TO "qti__author";

CREATE VIEW "qti__author"."graphic_gap_match_max_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_gap_match_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_gap_match_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."graphic_gap_match_max_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_gap_match_max_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_gap_match_max_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."graphic_gap_match_min_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_gap_match_min_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_gap_match_min_associations" TO "qti__author";

CREATE VIEW "qti__author"."graphic_gap_match_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_gap_match_min_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_gap_match_min_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."graphic_order_interaction" ("id", "max_bound", "max_choices_n", "min_choices_n", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."graphic_order_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_order_interaction" TO "qti__author";

CREATE VIEW "qti__author"."graphic_order_max_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_order_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_order_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."graphic_order_max_choices_n" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_order_max_choices_n" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_order_max_choices_n" TO "qti__author";

CREATE VIEW "qti__author"."graphic_order_min_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_order_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_order_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."graphic_order_min_choices_n" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."graphic_order_min_choices_n" AS "r1";

GRANT SELECT ON TABLE "qti__author"."graphic_order_min_choices_n" TO "qti__author";

CREATE VIEW "qti__author"."h_1" ("id") AS
SELECT "r1"."id"
FROM "qti"."h_1" AS "r1";

GRANT SELECT ON TABLE "qti__author"."h_1" TO "qti__author";

CREATE VIEW "qti__author"."h_2" ("id") AS
SELECT "r1"."id"
FROM "qti"."h_2" AS "r1";

GRANT SELECT ON TABLE "qti__author"."h_2" TO "qti__author";

CREATE VIEW "qti__author"."h_3" ("id") AS
SELECT "r1"."id"
FROM "qti"."h_3" AS "r1";

GRANT SELECT ON TABLE "qti__author"."h_3" TO "qti__author";

CREATE VIEW "qti__author"."h_4" ("id") AS
SELECT "r1"."id"
FROM "qti"."h_4" AS "r1";

GRANT SELECT ON TABLE "qti__author"."h_4" TO "qti__author";

CREATE VIEW "qti__author"."h_5" ("id") AS
SELECT "r1"."id"
FROM "qti"."h_5" AS "r1";

GRANT SELECT ON TABLE "qti__author"."h_5" TO "qti__author";

CREATE VIEW "qti__author"."h_6" ("id") AS
SELECT "r1"."id"
FROM "qti"."h_6" AS "r1";

GRANT SELECT ON TABLE "qti__author"."h_6" TO "qti__author";

CREATE VIEW "qti__author"."header" ("id") AS
SELECT "r1"."id"
FROM "qti"."header" AS "r1";

GRANT SELECT ON TABLE "qti__author"."header" TO "qti__author";

CREATE VIEW "qti__author"."headers_target" ("attribute", "document", "node", "position", "target") AS
SELECT "r1"."attribute", "r1"."document", "r1"."node", "r1"."position", "r1"."target"
FROM "qti"."headers_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."headers_target" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_choice" ("id", "identifier", "interaction", "shape", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."shape", "r1"."show_hide"
FROM "qti"."hotspot_choice" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_choice" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_choice_label" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hotspot_choice_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_choice_label" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_interaction" ("id", "max_choices_n", "min_choices_n", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."hotspot_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_interaction" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_max_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hotspot_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_max_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hotspot_max_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_max_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_min_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hotspot_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hotspot_min_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_min_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."hottext" ("id", "identifier", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide"
FROM "qti"."hottext" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext" TO "qti__author";

CREATE VIEW "qti__author"."hottext_interaction" ("id", "max_choices_n", "min_choices_n", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."hottext_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext_interaction" TO "qti__author";

CREATE VIEW "qti__author"."hottext_max_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hottext_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."hottext_max_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hottext_max_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext_max_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."hottext_min_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hottext_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."hottext_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."hottext_min_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext_min_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."hottext_owner" ("identifier", "interaction", "node") AS
SELECT "r1"."identifier", "r1"."interaction", "r1"."node"
FROM "qti"."hottext_owner" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext_owner" TO "qti__author";

CREATE VIEW "qti__author"."hr" ("id") AS
SELECT "r1"."id"
FROM "qti"."hr" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hr" TO "qti__author";

CREATE VIEW "qti__author"."html_id" ("attribute", "document", "id", "kind", "node") AS
SELECT "r1"."attribute", "r1"."document", "r1"."id", "r1"."kind", "r1"."node"
FROM "qti"."html_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."html_id" TO "qti__author";

CREATE VIEW "qti__author"."i" ("id") AS
SELECT "r1"."id"
FROM "qti"."i" AS "r1";

GRANT SELECT ON TABLE "qti__author"."i" TO "qti__author";

CREATE VIEW "qti__author"."inline_choice" ("fixed", "id", "identifier", "interaction", "show_hide") AS
SELECT "r1"."fixed", "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."show_hide"
FROM "qti"."inline_choice" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inline_choice" TO "qti__author";

CREATE VIEW "qti__author"."inline_choice_interaction" ("id", "min_choices", "required", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."min_choices", "r1"."required", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."inline_choice_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inline_choice_interaction" TO "qti__author";

CREATE VIEW "qti__author"."inline_choice_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."inline_choice_min_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inline_choice_min_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."inline_choice_prompt" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."inline_choice_prompt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inline_choice_prompt" TO "qti__author";

CREATE VIEW "qti__author"."inside" ("coords", "id", "shape") AS
SELECT "r1"."coords", "r1"."id", "r1"."shape"
FROM "qti"."inside" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inside" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("adaptive", "ancestry", "document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."adaptive", "r1"."ancestry", "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table" ("base_type", "declaration", "document", "id") AS
SELECT "r1"."base_type", "r1"."declaration", "r1"."document", "r1"."id"
FROM "qti"."interpolation_table" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value" ("base_type", "node") AS
SELECT "r1"."base_type", "r1"."node"
FROM "qti"."interpolation_table_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_boolean" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_boolean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_boolean" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_directed_pair" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_directed_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_directed_pair" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_duration" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_duration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_duration" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_file" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_file" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_float" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_float" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_identifier" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_identifier" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_integer" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_integer" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_pair" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_pair" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_point" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_point" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_string" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_string" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_default_value_uri" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."interpolation_table_default_value_uri" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_default_value_uri" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry" ("base_type", "declaration", "id", "include_boundary", "position", "source_value", "table") AS
SELECT "r1"."base_type", "r1"."declaration", "r1"."id", "r1"."include_boundary", "r1"."position", "r1"."source_value", "r1"."table"
FROM "qti"."interpolation_table_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_boolean" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_boolean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_boolean" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_directed_pair" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_directed_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_directed_pair" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_duration" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_duration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_duration" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_file" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_file" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_float" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_float" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_identifier" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_identifier" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_integer" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_integer" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_pair" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_pair" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_point" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_point" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_string" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_string" TO "qti__author";

CREATE VIEW "qti__author"."interpolation_table_entry_uri" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."interpolation_table_entry_uri" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interpolation_table_entry_uri" TO "qti__author";

CREATE VIEW "qti__author"."item_body_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."item_body_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_body_id" TO "qti__author";

CREATE VIEW "qti__author"."item_tool" ("shape", "tree") AS
SELECT "r1"."shape", "r1"."tree"
FROM "qti"."item_tool" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool" TO "qti__author";

CREATE VIEW "qti__author"."item_tool_both" ("tool_name", "tool_version", "tree") AS
SELECT "r1"."tool_name", "r1"."tool_version", "r1"."tree"
FROM "qti"."item_tool_both" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool_both" TO "qti__author";

CREATE VIEW "qti__author"."item_tool_name" ("tool_name", "tree") AS
SELECT "r1"."tool_name", "r1"."tree"
FROM "qti"."item_tool_name" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool_name" TO "qti__author";

CREATE VIEW "qti__author"."item_tool_version" ("tool_version", "tree") AS
SELECT "r1"."tool_version", "r1"."tree"
FROM "qti"."item_tool_version" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool_version" TO "qti__author";

CREATE VIEW "qti__author"."kbd" ("id") AS
SELECT "r1"."id"
FROM "qti"."kbd" AS "r1";

GRANT SELECT ON TABLE "qti__author"."kbd" TO "qti__author";

CREATE VIEW "qti__author"."label" ("id") AS
SELECT "r1"."id"
FROM "qti"."label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."label" TO "qti__author";

CREATE VIEW "qti__author"."li" ("id") AS
SELECT "r1"."id"
FROM "qti"."li" AS "r1";

GRANT SELECT ON TABLE "qti__author"."li" TO "qti__author";

CREATE VIEW "qti__author"."lom" ("id", "owner", "package") AS
SELECT "r1"."id", "r1"."owner", "r1"."package"
FROM "qti"."lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom" TO "qti__author";

CREATE VIEW "qti__author"."lom_general" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_general" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_general" TO "qti__author";

CREATE VIEW "qti__author"."lom_language" ("id", "lom", "owner", "parent_kind", "position", "value") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent_kind", "r1"."position", "r1"."value"
FROM "qti"."lom_language" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_language" TO "qti__author";

CREATE VIEW "qti__author"."lom_string_language" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."lom_string_language" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_string_language" TO "qti__author";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

CREATE VIEW "qti__author"."map_entry" ("base_type", "case_sensitive", "declaration", "id", "mapped_value", "mapping", "position") AS
SELECT "r1"."base_type", "r1"."case_sensitive", "r1"."declaration", "r1"."id", "r1"."mapped_value", "r1"."mapping", "r1"."position"
FROM "qti"."map_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_boolean" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_boolean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_boolean" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_directed_pair" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_directed_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_directed_pair" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_duration" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_duration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_duration" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_file" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_file" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_float" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_float" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_identifier" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_identifier" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_integer" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_integer" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_pair" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_pair" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_point" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_point" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_string" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_string" TO "qti__author";

CREATE VIEW "qti__author"."map_entry_uri" ("id", "map_key") AS
SELECT "r1"."id", "r1"."map_key"
FROM "qti"."map_entry_uri" AS "r1";

GRANT SELECT ON TABLE "qti__author"."map_entry_uri" TO "qti__author";

CREATE VIEW "qti__author"."mappable_base_type" ("base_type") AS
SELECT "r1"."base_type"
FROM "qti"."mappable_base_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mappable_base_type" TO "qti__author";

CREATE VIEW "qti__author"."mapping" ("base_type", "declaration", "default_value", "document", "id") AS
SELECT "r1"."base_type", "r1"."declaration", "r1"."default_value", "r1"."document", "r1"."id"
FROM "qti"."mapping" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mapping" TO "qti__author";

CREATE VIEW "qti__author"."mapping_lower_bound" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."mapping_lower_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mapping_lower_bound" TO "qti__author";

CREATE VIEW "qti__author"."mapping_upper_bound" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."mapping_upper_bound" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mapping_upper_bound" TO "qti__author";

CREATE VIEW "qti__author"."match_first_column_header" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_first_column_header" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_first_column_header" TO "qti__author";

CREATE VIEW "qti__author"."match_group" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_group" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_group" TO "qti__author";

CREATE VIEW "qti__author"."match_interaction" ("id", "max_associations_n", "min_associations_n", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."match_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_interaction" TO "qti__author";

CREATE VIEW "qti__author"."match_max_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_max_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_max_associations" TO "qti__author";

CREATE VIEW "qti__author"."match_max_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_max_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_max_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."match_min_associations" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_min_associations" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_min_associations" TO "qti__author";

CREATE VIEW "qti__author"."match_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_min_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_min_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."match_table" ("base_type", "declaration", "document", "id") AS
SELECT "r1"."base_type", "r1"."declaration", "r1"."document", "r1"."id"
FROM "qti"."match_table" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value" ("base_type", "node") AS
SELECT "r1"."base_type", "r1"."node"
FROM "qti"."match_table_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_boolean" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_boolean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_boolean" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_directed_pair" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_directed_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_directed_pair" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_duration" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_duration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_duration" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_file" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_file" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_float" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_float" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_identifier" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_identifier" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_integer" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_integer" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_pair" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_pair" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_point" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_point" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_string" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_string" TO "qti__author";

CREATE VIEW "qti__author"."match_table_default_value_uri" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."match_table_default_value_uri" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_default_value_uri" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry" ("base_type", "declaration", "id", "position", "source_value", "table") AS
SELECT "r1"."base_type", "r1"."declaration", "r1"."id", "r1"."position", "r1"."source_value", "r1"."table"
FROM "qti"."match_table_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_boolean" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_boolean" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_boolean" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_directed_pair" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_directed_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_directed_pair" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_duration" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_duration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_duration" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_file" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_file" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_file" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_float" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_float" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_float" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_identifier" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_identifier" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_integer" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_integer" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_integer" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_pair" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_pair" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_pair" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_point" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_point" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_string" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_string" TO "qti__author";

CREATE VIEW "qti__author"."match_table_entry_uri" ("id", "target_value") AS
SELECT "r1"."id", "r1"."target_value"
FROM "qti"."match_table_entry_uri" AS "r1";

GRANT SELECT ON TABLE "qti__author"."match_table_entry_uri" TO "qti__author";

CREATE VIEW "qti__author"."media_coords" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."media_coords" AS "r1";

GRANT SELECT ON TABLE "qti__author"."media_coords" TO "qti__author";

CREATE VIEW "qti__author"."media_interaction" ("autostart", "id", "loop", "max_plays_n", "min_plays_n", "response_identifier", "root_kind") AS
SELECT "r1"."autostart", "r1"."id", "r1"."loop", "r1"."max_plays_n", "r1"."min_plays_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."media_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."media_interaction" TO "qti__author";

CREATE VIEW "qti__author"."media_max_plays" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."media_max_plays" AS "r1";

GRANT SELECT ON TABLE "qti__author"."media_max_plays" TO "qti__author";

CREATE VIEW "qti__author"."media_min_plays" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."media_min_plays" AS "r1";

GRANT SELECT ON TABLE "qti__author"."media_min_plays" TO "qti__author";

CREATE VIEW "qti__author"."modal_feedback" ("id", "identifier", "outcome_identifier", "show_hide", "version") AS
SELECT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide", "r1"."version"
FROM "qti"."modal_feedback" AS "r1";

GRANT SELECT ON TABLE "qti__author"."modal_feedback" TO "qti__author";

CREATE VIEW "qti__author"."modal_feedback_title" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."modal_feedback_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."modal_feedback_title" TO "qti__author";

CREATE VIEW "qti__author"."nav" ("id") AS
SELECT "r1"."id"
FROM "qti"."nav" AS "r1";

GRANT SELECT ON TABLE "qti__author"."nav" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."node_catalog_idref" ("attribute", "document", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."document", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_catalog_idref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_catalog_idref" TO "qti__author";

CREATE VIEW "qti__author"."node_class" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_class" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_class" TO "qti__author";

CREATE VIEW "qti__author"."node_dir" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_dir" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_dir" TO "qti__author";

CREATE VIEW "qti__author"."node_label" ("attribute", "kind", "node", "root_kind", "tree", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."root_kind", "r1"."tree", "r1"."value"
FROM "qti"."node_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_label" TO "qti__author";

CREATE VIEW "qti__author"."node_lang" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_lang" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_lang" TO "qti__author";

CREATE VIEW "qti__author"."node_suppress_tts" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_suppress_tts" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_suppress_tts" TO "qti__author";

CREATE VIEW "qti__author"."node_xml_base" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."node_xml_base" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_xml_base" TO "qti__author";

CREATE VIEW "qti__author"."node_xml_lang" ("attribute", "kind", "node", "root_kind", "tree", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."root_kind", "r1"."tree", "r1"."value"
FROM "qti"."node_xml_lang" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node_xml_lang" TO "qti__author";

CREATE VIEW "qti__author"."object" ("data", "id", "type") AS
SELECT "r1"."data", "r1"."id", "r1"."type"
FROM "qti"."object" AS "r1";

GRANT SELECT ON TABLE "qti__author"."object" TO "qti__author";

CREATE VIEW "qti__author"."object_height" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."object_height" AS "r1";

GRANT SELECT ON TABLE "qti__author"."object_height" TO "qti__author";

CREATE VIEW "qti__author"."object_width" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."object_width" AS "r1";

GRANT SELECT ON TABLE "qti__author"."object_width" TO "qti__author";

CREATE VIEW "qti__author"."ol" ("id") AS
SELECT "r1"."id"
FROM "qti"."ol" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ol" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity" ("kind", "min") AS
SELECT "r1"."kind", "r1"."min"
FROM "qti"."operator_arity" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_max" ("kind", "max") AS
SELECT "r1"."kind", "r1"."max"
FROM "qti"."operator_arity_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_max" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_unbounded" ("kind") AS
SELECT "r1"."kind"
FROM "qti"."operator_arity_unbounded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_unbounded" TO "qti__author";

CREATE VIEW "qti__author"."order_choices_container_width" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_choices_container_width" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_choices_container_width" TO "qti__author";

CREATE VIEW "qti__author"."order_interaction" ("id", "max_bound", "max_choices_n", "min_choices_n", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."order_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_interaction" TO "qti__author";

CREATE VIEW "qti__author"."order_max_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."order_max_choices_n" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_max_choices_n" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_max_choices_n" TO "qti__author";

CREATE VIEW "qti__author"."order_max_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_max_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_max_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."order_min_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."order_min_choices_n" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_min_choices_n" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_min_choices_n" TO "qti__author";

CREATE VIEW "qti__author"."order_min_selections_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_min_selections_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_min_selections_message" TO "qti__author";

CREATE VIEW "qti__author"."order_orientation" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."order_orientation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_orientation" TO "qti__author";

CREATE VIEW "qti__author"."outcome_min_max" ("id", "kind", "outcome_identifier") AS
SELECT "r1"."id", "r1"."kind", "r1"."outcome_identifier"
FROM "qti"."outcome_min_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."outcome_min_max" TO "qti__author";

CREATE VIEW "qti__author"."param" ("id", "name", "value", "valuetype") AS
SELECT "r1"."id", "r1"."name", "r1"."value", "r1"."valuetype"
FROM "qti"."param" AS "r1";

GRANT SELECT ON TABLE "qti__author"."param" TO "qti__author";

CREATE VIEW "qti__author"."param_type" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."param_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."param_type" TO "qti__author";

CREATE VIEW "qti__author"."picture" ("id") AS
SELECT "r1"."id"
FROM "qti"."picture" AS "r1";

GRANT SELECT ON TABLE "qti__author"."picture" TO "qti__author";

CREATE VIEW "qti__author"."position_object_center_point" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."position_object_center_point" AS "r1";

GRANT SELECT ON TABLE "qti__author"."position_object_center_point" TO "qti__author";

CREATE VIEW "qti__author"."position_object_interaction" ("id", "max_choices_n", "min_choices_n", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."position_object_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."position_object_interaction" TO "qti__author";

CREATE VIEW "qti__author"."position_object_max_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."position_object_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."position_object_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."position_object_min_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."position_object_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."position_object_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."position_object_stage" ("id") AS
SELECT "r1"."id"
FROM "qti"."position_object_stage" AS "r1";

GRANT SELECT ON TABLE "qti__author"."position_object_stage" TO "qti__author";

CREATE VIEW "qti__author"."pre" ("id") AS
SELECT "r1"."id"
FROM "qti"."pre" AS "r1";

GRANT SELECT ON TABLE "qti__author"."pre" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable" ("base", "delimiter", "id", "identifier", "mapping_indicator", "power_form") AS
SELECT "r1"."base", "r1"."delimiter", "r1"."id", "r1"."identifier", "r1"."mapping_indicator", "r1"."power_form"
FROM "qti"."printed_variable" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable_field" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."printed_variable_field" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable_field" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable_format" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."printed_variable_format" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable_format" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable_id" ("document", "id", "node") AS
SELECT "r1"."document", "r1"."id", "r1"."node"
FROM "qti"."printed_variable_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable_id" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable_index" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."printed_variable_index" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable_index" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable_ref" ("document", "identifier", "kind", "node") AS
SELECT "r1"."document", "r1"."identifier", "r1"."kind", "r1"."node"
FROM "qti"."printed_variable_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable_ref" TO "qti__author";

CREATE VIEW "qti__author"."printed_variable_var_ref" ("attribute", "base_type", "cardinality", "document", "identifier", "kind", "node") AS
SELECT "r1"."attribute", "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."identifier", "r1"."kind", "r1"."node"
FROM "qti"."printed_variable_var_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."printed_variable_var_ref" TO "qti__author";

CREATE VIEW "qti__author"."q" ("id") AS
SELECT "r1"."id"
FROM "qti"."q" AS "r1";

GRANT SELECT ON TABLE "qti__author"."q" TO "qti__author";

CREATE VIEW "qti__author"."q_cite" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."q_cite" AS "r1";

GRANT SELECT ON TABLE "qti__author"."q_cite" TO "qti__author";

CREATE VIEW "qti__author"."qti_label" ("id") AS
SELECT "r1"."id"
FROM "qti"."qti_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_label" TO "qti__author";

CREATE VIEW "qti__author"."rb" ("id") AS
SELECT "r1"."id"
FROM "qti"."rb" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rb" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."record_binding_fit" ("interaction_kind") AS
SELECT "r1"."interaction_kind"
FROM "qti"."record_binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."resource_lom" ("lom", "metadata", "package", "resource", "type") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."resource_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_lom" TO "qti__author";

CREATE VIEW "qti__author"."resource_lom_general" ("lom", "package", "resource") AS
SELECT "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."resource_lom_general" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_lom_general" TO "qti__author";

CREATE VIEW "qti__author"."resource_lom_language_set" ("lom", "package", "resource", "value") AS
SELECT "r1"."lom", "r1"."package", "r1"."resource", "r1"."value"
FROM "qti"."resource_lom_language_set" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_lom_language_set" TO "qti__author";

CREATE VIEW "qti__author"."rp" ("id") AS
SELECT "r1"."id"
FROM "qti"."rp" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rp" TO "qti__author";

CREATE VIEW "qti__author"."rt" ("id") AS
SELECT "r1"."id"
FROM "qti"."rt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rt" TO "qti__author";

CREATE VIEW "qti__author"."rtc" ("id") AS
SELECT "r1"."id"
FROM "qti"."rtc" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rtc" TO "qti__author";

CREATE VIEW "qti__author"."rubric_block" ("id", "use", "view") AS
SELECT "r1"."id", "r1"."use", "r1"."view"
FROM "qti"."rubric_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rubric_block" TO "qti__author";

CREATE VIEW "qti__author"."rubric_template_block" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."rubric_template_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rubric_template_block" TO "qti__author";

CREATE VIEW "qti__author"."rubric_template_inline" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."rubric_template_inline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rubric_template_inline" TO "qti__author";

CREATE VIEW "qti__author"."ruby" ("id") AS
SELECT "r1"."id"
FROM "qti"."ruby" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ruby" TO "qti__author";

CREATE VIEW "qti__author"."rule_operand" ("child", "position", "rule", "rule_kind") AS
SELECT "r1"."child", "r1"."position", "r1"."rule", "r1"."rule_kind"
FROM "qti"."rule_operand" AS "r1";

GRANT SELECT ON TABLE "qti__author"."rule_operand" TO "qti__author";

CREATE VIEW "qti__author"."samp" ("id") AS
SELECT "r1"."id"
FROM "qti"."samp" AS "r1";

GRANT SELECT ON TABLE "qti__author"."samp" TO "qti__author";

CREATE VIEW "qti__author"."section" ("id") AS
SELECT "r1"."id"
FROM "qti"."section" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section" TO "qti__author";

CREATE VIEW "qti__author"."select_point_interaction" ("id", "max_choices_n", "min_choices_n", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."select_point_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."select_point_interaction" TO "qti__author";

CREATE VIEW "qti__author"."select_point_max_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."select_point_max_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."select_point_max_choices" TO "qti__author";

CREATE VIEW "qti__author"."select_point_min_choices" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."select_point_min_choices" AS "r1";

GRANT SELECT ON TABLE "qti__author"."select_point_min_choices" TO "qti__author";

CREATE VIEW "qti__author"."simple_associable_choice" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n"
FROM "qti"."simple_associable_choice" AS "r1";

GRANT SELECT ON TABLE "qti__author"."simple_associable_choice" TO "qti__author";

CREATE VIEW "qti__author"."simple_associable_choice_fixed" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."simple_associable_choice_fixed" AS "r1";

GRANT SELECT ON TABLE "qti__author"."simple_associable_choice_fixed" TO "qti__author";

CREATE VIEW "qti__author"."simple_associable_choice_match_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."simple_associable_choice_match_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."simple_associable_choice_match_min" TO "qti__author";

CREATE VIEW "qti__author"."simple_associable_choice_match_set" ("interaction", "match_set", "node") AS
SELECT "r1"."interaction", "r1"."match_set", "r1"."node"
FROM "qti"."simple_associable_choice_match_set" AS "r1";

GRANT SELECT ON TABLE "qti__author"."simple_associable_choice_match_set" TO "qti__author";

CREATE VIEW "qti__author"."simple_associable_choice_show_hide" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."simple_associable_choice_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."simple_associable_choice_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."simple_match_set" ("id") AS
SELECT "r1"."id"
FROM "qti"."simple_match_set" AS "r1";

GRANT SELECT ON TABLE "qti__author"."simple_match_set" TO "qti__author";

CREATE VIEW "qti__author"."slider_interaction" ("id", "lower_bound", "response_identifier", "root_kind", "step_label", "upper_bound") AS
SELECT "r1"."id", "r1"."lower_bound", "r1"."response_identifier", "r1"."root_kind", "r1"."step_label", "r1"."upper_bound"
FROM "qti"."slider_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."slider_interaction" TO "qti__author";

CREATE VIEW "qti__author"."slider_orientation" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."slider_orientation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."slider_orientation" TO "qti__author";

CREATE VIEW "qti__author"."slider_reverse" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."slider_reverse" AS "r1";

GRANT SELECT ON TABLE "qti__author"."slider_reverse" TO "qti__author";

CREATE VIEW "qti__author"."slider_step" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."slider_step" AS "r1";

GRANT SELECT ON TABLE "qti__author"."slider_step" TO "qti__author";

CREATE VIEW "qti__author"."small" ("id") AS
SELECT "r1"."id"
FROM "qti"."small" AS "r1";

GRANT SELECT ON TABLE "qti__author"."small" TO "qti__author";

CREATE VIEW "qti__author"."source" ("id", "parent_kind", "src") AS
SELECT "r1"."id", "r1"."parent_kind", "r1"."src"
FROM "qti"."source" AS "r1";

GRANT SELECT ON TABLE "qti__author"."source" TO "qti__author";

CREATE VIEW "qti__author"."source_media" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."source_media" AS "r1";

GRANT SELECT ON TABLE "qti__author"."source_media" TO "qti__author";

CREATE VIEW "qti__author"."source_sizes" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."source_sizes" AS "r1";

GRANT SELECT ON TABLE "qti__author"."source_sizes" TO "qti__author";

CREATE VIEW "qti__author"."source_srcset" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."source_srcset" AS "r1";

GRANT SELECT ON TABLE "qti__author"."source_srcset" TO "qti__author";

CREATE VIEW "qti__author"."source_type" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."source_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."source_type" TO "qti__author";

CREATE VIEW "qti__author"."span" ("id") AS
SELECT "r1"."id"
FROM "qti"."span" AS "r1";

GRANT SELECT ON TABLE "qti__author"."span" TO "qti__author";

CREATE VIEW "qti__author"."string_binding" ("document", "identifier", "node") AS
SELECT "r1"."document", "r1"."identifier", "r1"."node"
FROM "qti"."string_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."string_binding" TO "qti__author";

CREATE VIEW "qti__author"."strong" ("id") AS
SELECT "r1"."id"
FROM "qti"."strong" AS "r1";

GRANT SELECT ON TABLE "qti__author"."strong" TO "qti__author";

CREATE VIEW "qti__author"."stylesheet" ("href", "id", "type") AS
SELECT "r1"."href", "r1"."id", "r1"."type"
FROM "qti"."stylesheet" AS "r1";

GRANT SELECT ON TABLE "qti__author"."stylesheet" TO "qti__author";

CREATE VIEW "qti__author"."stylesheet_media" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."stylesheet_media" AS "r1";

GRANT SELECT ON TABLE "qti__author"."stylesheet_media" TO "qti__author";

CREATE VIEW "qti__author"."stylesheet_title" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."stylesheet_title" AS "r1";

GRANT SELECT ON TABLE "qti__author"."stylesheet_title" TO "qti__author";

CREATE VIEW "qti__author"."sub" ("id") AS
SELECT "r1"."id"
FROM "qti"."sub" AS "r1";

GRANT SELECT ON TABLE "qti__author"."sub" TO "qti__author";

CREATE VIEW "qti__author"."summary" ("id") AS
SELECT "r1"."id"
FROM "qti"."summary" AS "r1";

GRANT SELECT ON TABLE "qti__author"."summary" TO "qti__author";

CREATE VIEW "qti__author"."sup" ("id") AS
SELECT "r1"."id"
FROM "qti"."sup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."sup" TO "qti__author";

CREATE VIEW "qti__author"."table" ("id") AS
SELECT "r1"."id"
FROM "qti"."table" AS "r1";

GRANT SELECT ON TABLE "qti__author"."table" TO "qti__author";

CREATE VIEW "qti__author"."table_summary" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."table_summary" AS "r1";

GRANT SELECT ON TABLE "qti__author"."table_summary" TO "qti__author";

CREATE VIEW "qti__author"."tbody" ("id") AS
SELECT "r1"."id"
FROM "qti"."tbody" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tbody" TO "qti__author";

CREATE VIEW "qti__author"."td" ("id") AS
SELECT "r1"."id"
FROM "qti"."td" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td" TO "qti__author";

CREATE VIEW "qti__author"."td_abbr" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."td_abbr" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td_abbr" TO "qti__author";

CREATE VIEW "qti__author"."td_align" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."td_align" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td_align" TO "qti__author";

CREATE VIEW "qti__author"."td_axis" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."td_axis" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td_axis" TO "qti__author";

CREATE VIEW "qti__author"."td_colspan" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."td_colspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td_colspan" TO "qti__author";

CREATE VIEW "qti__author"."td_rowspan" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."td_rowspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td_rowspan" TO "qti__author";

CREATE VIEW "qti__author"."td_scope" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."td_scope" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td_scope" TO "qti__author";

CREATE VIEW "qti__author"."td_valign" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."td_valign" AS "r1";

GRANT SELECT ON TABLE "qti__author"."td_valign" TO "qti__author";

CREATE VIEW "qti__author"."template" ("id") AS
SELECT "r1"."id"
FROM "qti"."template" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template" TO "qti__author";

CREATE VIEW "qti__author"."template_block" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."template_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_block" TO "qti__author";

CREATE VIEW "qti__author"."template_content_ref" ("base_type", "cardinality", "document", "identifier", "node") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."identifier", "r1"."node"
FROM "qti"."template_content_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_content_ref" TO "qti__author";

CREATE VIEW "qti__author"."template_declaration_arm" ("id", "math_variable", "param_variable") AS
SELECT "r1"."id", "r1"."math_variable", "r1"."param_variable"
FROM "qti"."template_declaration_arm" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_declaration_arm" TO "qti__author";

CREATE VIEW "qti__author"."template_feedback_block" ("id", "identifier", "outcome_identifier", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide"
FROM "qti"."template_feedback_block" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_feedback_block" TO "qti__author";

CREATE VIEW "qti__author"."template_inline" ("id", "identifier", "show_hide", "template_identifier") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide", "r1"."template_identifier"
FROM "qti"."template_inline" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_inline" TO "qti__author";

CREATE VIEW "qti__author"."template_parameter_ref" ("document", "id", "identifier", "referrer_kind", "root_kind") AS
SELECT "r1"."document", "r1"."id", "r1"."identifier", "r1"."referrer_kind", "r1"."root_kind"
FROM "qti"."template_parameter_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."template_parameter_ref" TO "qti__author";

CREATE VIEW "qti__author"."text_entry_expected_length" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."text_entry_expected_length" AS "r1";

GRANT SELECT ON TABLE "qti__author"."text_entry_expected_length" TO "qti__author";

CREATE VIEW "qti__author"."text_entry_format" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."text_entry_format" AS "r1";

GRANT SELECT ON TABLE "qti__author"."text_entry_format" TO "qti__author";

CREATE VIEW "qti__author"."text_entry_interaction" ("base", "id", "response_identifier", "root_kind") AS
SELECT "r1"."base", "r1"."id", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."text_entry_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."text_entry_interaction" TO "qti__author";

CREATE VIEW "qti__author"."text_entry_pattern_mask" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."text_entry_pattern_mask" AS "r1";

GRANT SELECT ON TABLE "qti__author"."text_entry_pattern_mask" TO "qti__author";

CREATE VIEW "qti__author"."text_entry_patternmask_message" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."text_entry_patternmask_message" AS "r1";

GRANT SELECT ON TABLE "qti__author"."text_entry_patternmask_message" TO "qti__author";

CREATE VIEW "qti__author"."text_entry_placeholder_text" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."text_entry_placeholder_text" AS "r1";

GRANT SELECT ON TABLE "qti__author"."text_entry_placeholder_text" TO "qti__author";

CREATE VIEW "qti__author"."tfoot" ("id") AS
SELECT "r1"."id"
FROM "qti"."tfoot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tfoot" TO "qti__author";

CREATE VIEW "qti__author"."th" ("id") AS
SELECT "r1"."id"
FROM "qti"."th" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th" TO "qti__author";

CREATE VIEW "qti__author"."th_abbr" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."th_abbr" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th_abbr" TO "qti__author";

CREATE VIEW "qti__author"."th_align" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."th_align" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th_align" TO "qti__author";

CREATE VIEW "qti__author"."th_axis" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."th_axis" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th_axis" TO "qti__author";

CREATE VIEW "qti__author"."th_colspan" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."th_colspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th_colspan" TO "qti__author";

CREATE VIEW "qti__author"."th_rowspan" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."th_rowspan" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th_rowspan" TO "qti__author";

CREATE VIEW "qti__author"."th_scope" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."th_scope" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th_scope" TO "qti__author";

CREATE VIEW "qti__author"."th_valign" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."th_valign" AS "r1";

GRANT SELECT ON TABLE "qti__author"."th_valign" TO "qti__author";

CREATE VIEW "qti__author"."thead" ("id") AS
SELECT "r1"."id"
FROM "qti"."thead" AS "r1";

GRANT SELECT ON TABLE "qti__author"."thead" TO "qti__author";

CREATE VIEW "qti__author"."tr" ("id") AS
SELECT "r1"."id"
FROM "qti"."tr" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tr" TO "qti__author";

CREATE VIEW "qti__author"."track" ("id", "kind", "src") AS
SELECT "r1"."id", "r1"."kind", "r1"."src"
FROM "qti"."track" AS "r1";

GRANT SELECT ON TABLE "qti__author"."track" TO "qti__author";

CREATE VIEW "qti__author"."track_default" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."track_default" AS "r1";

GRANT SELECT ON TABLE "qti__author"."track_default" TO "qti__author";

CREATE VIEW "qti__author"."track_srclang" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."track_srclang" AS "r1";

GRANT SELECT ON TABLE "qti__author"."track_srclang" TO "qti__author";

CREATE VIEW "qti__author"."tree_root" ("node", "tree") AS
SELECT "r1"."node", "r1"."tree"
FROM "qti"."tree_root" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tree_root" TO "qti__author";

CREATE VIEW "qti__author"."tt" ("id") AS
SELECT "r1"."id"
FROM "qti"."tt" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tt" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE VIEW "qti__author"."typed_declaration" ("base_type", "cardinality", "document", "id", "identifier", "kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind"
FROM "qti"."typed_declaration" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_declaration" TO "qti__author";

CREATE VIEW "qti__author"."ul" ("id") AS
SELECT "r1"."id"
FROM "qti"."ul" AS "r1";

GRANT SELECT ON TABLE "qti__author"."ul" TO "qti__author";

CREATE VIEW "qti__author"."upload_interaction" ("id", "response_identifier", "root_kind") AS
SELECT "r1"."id", "r1"."response_identifier", "r1"."root_kind"
FROM "qti"."upload_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."upload_interaction" TO "qti__author";

CREATE VIEW "qti__author"."upload_type" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."upload_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."upload_type" TO "qti__author";

CREATE VIEW "qti__author"."var" ("id") AS
SELECT "r1"."id"
FROM "qti"."var" AS "r1";

GRANT SELECT ON TABLE "qti__author"."var" TO "qti__author";

CREATE VIEW "qti__author"."video" ("id", "version") AS
SELECT "r1"."id", "r1"."version"
FROM "qti"."video" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video" TO "qti__author";

CREATE VIEW "qti__author"."video_autoplay" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."video_autoplay" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_autoplay" TO "qti__author";

CREATE VIEW "qti__author"."video_controls" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."video_controls" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_controls" TO "qti__author";

CREATE VIEW "qti__author"."video_crossorigin" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."video_crossorigin" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_crossorigin" TO "qti__author";

CREATE VIEW "qti__author"."video_height" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."video_height" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_height" TO "qti__author";

CREATE VIEW "qti__author"."video_loop" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."video_loop" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_loop" TO "qti__author";

CREATE VIEW "qti__author"."video_mediagroup" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."video_mediagroup" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_mediagroup" TO "qti__author";

CREATE VIEW "qti__author"."video_muted" ("node", "value", "version") AS
SELECT "r1"."node", "r1"."value", "r1"."version"
FROM "qti"."video_muted" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_muted" TO "qti__author";

CREATE VIEW "qti__author"."video_poster" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."video_poster" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_poster" TO "qti__author";

CREATE VIEW "qti__author"."video_preload" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."video_preload" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_preload" TO "qti__author";

CREATE VIEW "qti__author"."video_src" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."video_src" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_src" TO "qti__author";

CREATE VIEW "qti__author"."video_width" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."video_width" AS "r1";

GRANT SELECT ON TABLE "qti__author"."video_width" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."a" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."a_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."abbr" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."acronym" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."address" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."area_map_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."area_mapping" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."area_mapping_lower_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."area_mapping_upper_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_activedescendant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_atomic" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_autocomplete" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_busy" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_checked" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_colcount" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_colindex" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_colspan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_controls" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_current" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_describedby" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_details" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_disabled" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_errormessage" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_expanded" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_flowto" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_haspopup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_hidden" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_invalid" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_keyshortcuts" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_keyshorts" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_labelledby" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_level" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_live" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_modal" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_multiline" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_multiselectable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_orientation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_owns" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_placeholder" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_posinset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_pressed" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_readonly" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_relevant" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_required" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_role" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_roledescription" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_rowcount" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_rowindex" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_rowspan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_selected" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_setsize" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_sort" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_valuemax" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_valuemin" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_valuenow" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aria_valuetext" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."article" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."aside" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_item" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_item_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."associable_hotspot" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."associable_hotspot_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."associable_hotspot_match_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."associate_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."associate_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."associate_min_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."attribute_idref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."attribute_lexical" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_autoplay" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_controls" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_crossorigin" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_loop" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_mediagroup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_muted" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_preload" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."audio_src" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."b" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."bdi" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."bdo" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."bdo_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."big" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."blockquote" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."blockquote_cite" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."br" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."caption" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."catalog_info" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."choice_template_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."cite" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."code" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."col" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."col_span" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."colgroup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."colgroup_span" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."companion_materials_info" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."content_body_feedback" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."content_body_modal" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."content_body_rubric" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."content_body_rubric_template" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."content_body_template" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."context_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."context_declaration_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."coords" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."coords_circle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."coords_default" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."coords_ellipse" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."coords_poly" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."coords_rect" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."dd" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declaration_normal_maximum" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_area_mapping_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_associable_hotspot_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_associate_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_associate_min_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_associate_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_extended_text_base" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_extended_text_format" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_extended_text_min_strings" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_feedback_block_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_feedback_inline_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_img_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_match_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_match_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_required" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_text_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_graphic_associate_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_graphic_gap_match_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hotspot_choice_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hotspot_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hotspot_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hottext_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hottext_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hottext_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_include_boundary" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_inline_choice_fixed" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_inline_choice_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_inline_choice_required" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_inline_choice_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_inline_choice_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_map_entry_case_sensitive" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_mapping_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_match_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_match_min_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_match_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_math_variable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_media_loop" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_order_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_param_variable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_position_object_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_printed_variable_base" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_printed_variable_delimiter" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_printed_variable_mapping_indicator" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_printed_variable_power_form" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_rubric_template_block_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_rubric_template_inline_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_select_point_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_select_point_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_slider_step_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_template_block_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_template_feedback_block_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_template_inline_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_text_entry_base" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_track_kind" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_valuetype" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."details" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."details_open" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."dfn" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."div" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."dl" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."document_lang" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."drawing_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."dt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."em" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."end_attempt_count_attempt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."end_attempt_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."extended_text_expected_length" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."extended_text_expected_lines" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."extended_text_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."extended_text_max_strings" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."extended_text_pattern_mask" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."extended_text_patternmask_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."extended_text_placeholder_text" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."feedback_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."feedback_inline" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."feedback_outcome_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."figcaption" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."figure" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."footer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_img" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_img_left" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_img_match_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_img_object_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_img_top" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_choices_container_width" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_max_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_min_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_match_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_text" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_text_match_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_associate_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_associate_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_associate_min_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_gap_match_choices_container_width" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_gap_match_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_gap_match_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_gap_match_max_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_gap_match_min_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_gap_match_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_order_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_order_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_order_max_choices_n" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_order_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."graphic_order_min_choices_n" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."h_1" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."h_2" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."h_3" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."h_4" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."h_5" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."h_6" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."header" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."headers_target" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_choice" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_choice_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_max_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext_max_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext_owner" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hr" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."html_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."i" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."inline_choice" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."inline_choice_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."inline_choice_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."inline_choice_prompt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interaction_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_default_value_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."interpolation_table_entry_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_body_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool_both" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool_name" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."kbd" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."li" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_general" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_language" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_string_language" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."map_entry_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mapping" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mapping_lower_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mapping_upper_bound" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_first_column_header" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_group" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_max_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_max_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_min_associations" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_default_value_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_boolean" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_directed_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_duration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_file" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_float" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_integer" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_pair" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."match_table_entry_uri" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."media_coords" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."media_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."media_max_plays" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."media_min_plays" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."modal_feedback" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."modal_feedback_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."nav" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_catalog_idref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_class" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_dir" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_lang" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_suppress_tts" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_xml_base" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node_xml_lang" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."object" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."object_height" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."object_width" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ol" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_choices_container_width" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_max_choices_n" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_max_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_min_choices_n" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_min_selections_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_orientation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."param" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."param_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."picture" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."position_object_center_point" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."position_object_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."position_object_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."position_object_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."position_object_stage" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."pre" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable_field" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable_format" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable_index" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."printed_variable_var_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."q" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."q_cite" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rb" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."record_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom_general" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom_language_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rp" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rtc" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rubric_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rubric_template_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."rubric_template_inline" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ruby" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."samp" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."select_point_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."select_point_max_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."select_point_min_choices" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_associable_choice" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_associable_choice_fixed" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_associable_choice_match_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_associable_choice_match_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_associable_choice_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."simple_match_set" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."slider_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."slider_orientation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."slider_reverse" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."slider_step" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."small" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."source" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."source_media" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."source_sizes" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."source_srcset" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."source_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."span" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."string_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."strong" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."stylesheet" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."stylesheet_media" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."stylesheet_title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."sub" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."summary" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."sup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."table" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."table_summary" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tbody" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td_abbr" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td_align" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td_axis" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td_colspan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td_rowspan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td_scope" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."td_valign" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_content_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_declaration_arm" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_feedback_block" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."template_inline" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."text_entry_expected_length" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."text_entry_format" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."text_entry_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."text_entry_pattern_mask" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."text_entry_patternmask_message" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."text_entry_placeholder_text" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tfoot" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th_abbr" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th_align" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th_axis" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th_colspan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th_rowspan" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th_scope" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."th_valign" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."thead" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tr" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."track" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."track_default" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."track_srclang" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_root" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tt" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."typed_declaration" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."ul" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."upload_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."upload_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."var" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_autoplay" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_controls" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_crossorigin" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_height" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_loop" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_mediagroup" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_muted" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_poster" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_preload" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_src" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."video_width" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
