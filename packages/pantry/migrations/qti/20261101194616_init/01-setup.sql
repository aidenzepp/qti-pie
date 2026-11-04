DO $$BEGIN PERFORM pg_catalog.pg_advisory_xact_lock(7385900293::int8); EXECUTE format('ALTER DATABASE %I SET default_transaction_isolation = %L'::text, current_database(), 'serializable'::text); END$$;

CREATE SCHEMA "qti";

CREATE TYPE "qti"."attribute_name" AS ENUM ('identifier', 'title', 'adaptive', 'time-dependent', 'cardinality', 'base-type', 'view', 'interpretation', 'long-interpretation', 'normal-maximum', 'normal-minimum', 'mastery-value', 'external-scored', 'variable-identifier-ref', 'field-identifier', 'response-identifier', 'shuffle', 'max-choices', 'min-choices', 'orientation', 'data-min-selections-message', 'data-max-selections-message', 'fixed', 'template-identifier', 'show-hide', 'template', 'template-location', 'src', 'alt', 'longdesc', 'height', 'width', 'type', 'href', 'identifierref', 'language');

CREATE TYPE "qti"."base_type" AS ENUM ('boolean', 'integer', 'float', 'string', 'identifier', 'uri', 'duration', 'point', 'pair', 'directedPair', 'file');

CREATE TYPE "qti"."built_in" AS ENUM ('completionStatus', 'numAttempts', 'duration', 'QTI_CONTEXT');

CREATE TYPE "qti"."declaration_kind" AS ENUM ('context', 'response', 'outcome', 'template');

CREATE TYPE "qti"."declaration_shape" AS ENUM ('typed', 'record');

CREATE TYPE "qti"."entry_kind" AS ENUM ('manifest', 'file');

CREATE TYPE "qti"."id_holder" AS ENUM ('responseDeclaration');

CREATE TYPE "qti"."lom_owner" AS ENUM ('manifest', 'resource', 'file', 'external');

CREATE TYPE "qti"."misc_kind" AS ENUM ('comment', 'pi');

CREATE TYPE "qti"."node_kind" AS ENUM ('text', 'ws', 'comment', 'pi', 'entityRef', 'qti-assessment-item', 'qti-response-declaration', 'qti-outcome-declaration', 'qti-correct-response', 'qti-default-value', 'qti-value', 'qti-item-body', 'qti-choice-interaction', 'qti-prompt', 'qti-simple-choice', 'qti-response-processing', 'p', 'img', 'cp:manifest', 'cp:metadata.manifest', 'cp:metadata.resource', 'cp:schema', 'cp:schemaversion', 'cp:organizations', 'cp:resources', 'cp:resource', 'cp:file', 'cp:dependency', 'lom:lom', 'lom:general', 'lom:identifier', 'lom:catalog', 'lom:entry', 'lom:title', 'lom:string', 'lom:language', 'lom:description', 'lom:keyword', 'lom:coverage', 'lom:structure', 'lom:aggregationLevel', 'lom:source', 'lom:value', 'lom:lifeCycle', 'lom:version', 'lom:status', 'lom:contribute', 'lom:role', 'lom:entity', 'lom:date', 'lom:dateTime', 'lom:metaMetadata', 'lom:metadataschema', 'lom:technical', 'lom:format', 'lom:size', 'lom:location', 'lom:requirement', 'lom:orComposite', 'lom:type', 'lom:name', 'lom:minimumVersion', 'lom:maximumVersion', 'lom:installationRemarks', 'lom:otherPlatformRequirements', 'lom:duration', 'lom:duration.string', 'lom:rights', 'lom:cost', 'lom:copyrightAndOtherRestrictions', 'qmd:qtiMetadata', 'qmd:itemTemplate', 'qmd:timeDependent', 'qmd:composite', 'qmd:interactionType', 'qmd:portableCustomInteractionContext', 'qmd:customTypeIdentifier', 'qmd:interactionKind', 'qmd:feedbackType', 'qmd:solutionAvailable', 'qmd:scoringMode', 'qmd:toolName', 'qmd:toolVersion', 'qmd:toolVendor');

CREATE TYPE "qti"."placement" AS ENUM ('prolog', 'epilog');

CREATE TYPE "qti"."ref_kind" AS ENUM ('declared', 'builtIn', 'itemVariable', 'itemInstanceVariable', 'sectionDuration');

CREATE TYPE "qti"."root_kind" AS ENUM ('item', 'test', 'section', 'stimulus', 'rptemplate', 'outcomes', 'usagedata', 'manifest');

CREATE TYPE "qti"."schema_version" AS ENUM ('3.0.0', '3.0.1');

CREATE TYPE "qti"."standard_template" AS ENUM ('match_correct', 'map_response', 'map_response_point', 'CC2_match', 'CC2_match_basic', 'CC2_map_response');

CREATE TYPE "qti"."tree_kind" AS ENUM ('document', 'manifest');

CREATE TYPE "qti"."typed_cardinality" AS ENUM ('single', 'multiple', 'ordered');

CREATE TYPE "qti"."value_role" AS ENUM ('default', 'correct');

CREATE DOMAIN "qti"."__text_i67gmkzdk7" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('hide'::text, 'show'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_f63vbnbw4t" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('false'::text, 'true'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_pftpnuhm3d" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0001-\U0010FFFF]{0,255}[\u0001-\U0010FFFF]?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_7mulu52tr6" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[0-9]+\%?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_ottycep7en" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]+\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_c34ec7mxid" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:[\u0001-\.0-\U0010FFFF]{3,80}|[\u0001-\-0-\U0010FFFF][\u0001-\.0-\U0010FFFF]|\.[\u0001-\-0-\U0010FFFF]|[\u0001-\.0-\U0010FFFF])(?:\/(?:[\u0001-\.0-\U0010FFFF]{3,80}|[\u0001-\-0-\U0010FFFF][\u0001-\.0-\U0010FFFF]|\.[\u0001-\-0-\U0010FFFF]|[\u0001-\.0-\U0010FFFF])){0,7}|[A-Za-z][\+\-\.0-9A-Za-z]{0,31}\:[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF]{0,255})\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_betq2bg2bg" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('QTI Item'::text, 'QTI Item Bank'::text, 'QTI Object Bank'::text, 'QTI Package'::text, 'QTI Section'::text, 'QTI Test'::text, 'QTI Test Bank'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_kqeswaav46" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\u0001-\U0010FFFF]*[\u0009\u000A\u000D ]{2}[\u0001-\U0010FFFF]*|[\u0001-\U0010FFFF]*[\u0009\u000A\u000D ]|[\u0001-\U0010FFFF]*[\u0009\u000A\u000D][\u0001-\U0010FFFF]*|[\u0009\u000A\u000D ][\u0001-\U0010FFFF]*)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_2dix7luqoi" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF](?: ?[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF]){0,255})?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_7grqskvjta" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\+\-]?[0-9]+ [\+\-]?[0-9]+\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_cz7v66q3ce" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('0'::text, '1'::text, 'false'::text, 'true'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_qtkbmkpj6l" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\+\-]?[0-9]+\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_f3hdif3553" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('associateInteraction'::text, 'choiceInteraction'::text, 'customInteraction'::text, 'drawingInteraction'::text, 'endAttemptInteraction'::text, 'extendedTextInteraction'::text, 'gapMatchInteraction'::text, 'graphicAssociateInteraction'::text, 'graphicGapMatchInteraction'::text, 'graphicOrderInteraction'::text, 'hotspotInteraction'::text, 'hottextInteraction'::text, 'inlineChoiceInteraction'::text, 'matchInteraction'::text, 'mediaInteraction'::text, 'orderInteraction'::text, 'portableCustomInteraction'::text, 'positionObjectInteraction'::text, 'selectPointInteraction'::text, 'sliderInteraction'::text, 'textEntryInteraction'::text, 'uploadInteraction'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_jld3q663or" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\+\-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][\+\-]?[0-9]+)?|\-?INF|NaN)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_uia6zcss44" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('no'::text, 'yes'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_ieskz75v7g" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF]+(?: [\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF]+)*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_yakcqa4zli" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('horizontal'::text, 'vertical'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_r5xluaej3z" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A1\.[0-9]+\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_hmmood6ekl" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0001-\U0010FFFF]*[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF][\u0001-\U0010FFFF]*\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_d72l462ftm" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255} [A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_k3z6naurdo" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>\@-Z\\\^-\U0010FFFF])+(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|[A-Za-z][\+\-\.0-9A-Za-z]*\:(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?)?)?(?:\?(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-Z\\\^-\U0010FFFF])*)?(?:\#(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\U0010FFFF])*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_tso7kvy6dv" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\+\/-9A-Za-z]{4})*(?:[\+\/-9A-Za-z]{2}\=\=|[\+\/-9A-Za-z]{3}\=)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_wyfa622e2r" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[A-Za-z][\-\.0-9A-Z\_a-z]{0,63}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_raisrajgpi" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}\:)?[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_ojm4wya66v" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('externalmachine'::text, 'human'::text, 'responseprocessing'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_popyschjwc" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[A-Za-z]{1,8}(?:\-[0-9A-Za-z]{1,8})*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_rhdrzkabze" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_mvg26oprvk" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('adaptive'::text, 'nonadaptive'::text, 'none'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_clza6vokfo" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\+?[0-9]+\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_qyq7zjychy" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('3.0.0'::text, '3.0.1'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_tyjqwtj7ky" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\-\/-9\_a-z]{1,80}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_ifp42a6zk6" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\.0-\U0010FFFF]{1,127}\/[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF]{1,255}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_httzcaefcn" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255})?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_6uwfpnix5n" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('externalMachine'::text, 'human'::text)) IS TRUE);

CREATE OR REPLACE FUNCTION "qti"."__refuse"("state" text, "constraint_name" text, "detail" text) RETURNS boolean
LANGUAGE plpgsql VOLATILE PARALLEL SAFE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
BEGIN
  RAISE EXCEPTION 'grizzle refused the statement'
    USING ERRCODE = "state",
          CONSTRAINT = "constraint_name",
          DETAIL = "detail";
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__refuse"(text, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__require_serializable"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
BEGIN
  IF current_setting('transaction_isolation'::text) <> 'serializable'::text THEN
    RAISE EXCEPTION 'a write to a grizzle table requires SERIALIZABLE'
      USING ERRCODE = 'invalid_transaction_state'::text,
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            HINT = 'write at SERIALIZABLE'::text;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__require_serializable"() FROM PUBLIC;

CREATE TABLE "qti"."__ledger" (
  "folder" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "ordinal" integer NOT NULL,
  "file" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "source" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "target" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "files" integer NOT NULL,
  "digest" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__ledger_pk" PRIMARY KEY ("folder", "ordinal"),
  CONSTRAINT "__ledger_ordinal_check" CHECK (("ordinal" >= 0) IS TRUE),
  CONSTRAINT "__ledger_files_check" CHECK (("files" >= 0) IS TRUE)
);

REVOKE ALL ON TABLE "qti"."__ledger" FROM PUBLIC;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."__ledger"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE OR REPLACE FUNCTION "qti"."__snapshot_guard"("fingerprint" text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "qti"."__ledger" AS "r1" WHERE "r1"."ordinal" = 0 AND "r1"."files" <> (SELECT count(*) FROM "qti"."__ledger" AS "r2" WHERE "r2"."folder" = "r1"."folder" AND "r2"."ordinal" <> 0)) THEN
    RAISE EXCEPTION 'a grizzle migration of this schema is running or stopped part-way'
      USING ERRCODE = '55Z02'::text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "qti"."__ledger" AS "r3" WHERE "r3"."ordinal" = 0 AND "r3"."target" = "fingerprint" AND NOT EXISTS (SELECT 1 FROM "qti"."__ledger" AS "r4" WHERE "r4"."ordinal" = 0 AND "r4"."folder" > "r3"."folder")) THEN
    RAISE EXCEPTION 'the latest grizzle migration of this schema is not the snapshot of this Db'
      USING ERRCODE = '55Z01'::text;
  END IF;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__snapshot_guard"(text) FROM PUBLIC;
