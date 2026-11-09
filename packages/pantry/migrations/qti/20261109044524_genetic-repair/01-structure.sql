DROP VIEW "qti__author"."test_document";

DROP VIEW "qti__author"."site_target";

DROP VIEW "qti__author"."resource_href";

DROP VIEW "qti__author"."resource";

DROP VIEW "qti__author"."reference_path";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."item_ref_target";

DROP VIEW "qti__author"."instance";

DROP VIEW "qti__author"."inclusion";

DROP VIEW "qti__author"."idref_target";

DROP VIEW "qti__author"."id_binding";

DROP VIEW "qti__author"."document_id";

DROP VIEW "qti__author"."attribute";

ALTER TABLE "qti"."document_id" ADD COLUMN "admitted" boolean DEFAULT true NOT NULL;
-- An ID is admitted exactly where the grammar admits the element that carries it where it stands
-- (ChildGrammar, the node's own admission test). "N5 admitted" holds of every stored node, so this
-- leaves every stored row true.
UPDATE "qti"."document_id" AS "d"
SET "admitted" = ("pg_catalog"."substring"("qti"."__constant_gbvdw5papk"(), ("n"."version" * 644 + "n"."parent_kind") * 644 + "n"."kind" + 1, 1)::integer = 1)
FROM "qti"."node" AS "n"
WHERE "n"."id" = "d"."node";
ALTER TABLE "qti"."document_id" ALTER COLUMN "admitted" DROP DEFAULT;

ALTER TABLE "qti"."id_binding" ADD COLUMN "admitted" boolean DEFAULT true NOT NULL;
-- A binding is admitted as its IDs are (the containment DocumentId(document, id, owner, admitted)
-- into IdBinding).
UPDATE "qti"."id_binding" AS "b"
SET "admitted" = "d"."admitted"
FROM (SELECT "document", "id", "owner", "pg_catalog"."bool_and"("admitted") AS "admitted" FROM "qti"."document_id" GROUP BY "document", "id", "owner") AS "d"
WHERE "d"."document" = "b"."document" AND "d"."id" = "b"."id" AND "d"."owner" = "b"."owner";
ALTER TABLE "qti"."id_binding" ALTER COLUMN "admitted" DROP DEFAULT;

ALTER TABLE "qti"."inclusion" ADD COLUMN "places" boolean DEFAULT true NOT NULL;
-- An include places its target exactly where it may stand for the target's root (IncludeRoot), the
-- predicate the new "e_1_derived" CHECK states. "Include root" holds of every stored inclusion, so
-- this leaves every stored row true.
UPDATE "qti"."inclusion"
SET "places" = (("pg_catalog"."bit_count"("pg_catalog"."set_bit"(X'00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'::"qti"."__node_kind_bits_644_kcdmigfwqm", "root"::integer, 1) & (~ "pg_catalog"."substring"("qti"."__constant_w4tawmrghr"(), ("version" * 78 + "include_parent") * 644 + 1, 644)::"qti"."__node_kind_bits_644_kcdmigfwqm")) = 0::bigint));
ALTER TABLE "qti"."inclusion" ALTER COLUMN "places" DROP DEFAULT;

CREATE TABLE "qti"."item_ref_href" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."__text_pwaizaq6lx" NOT NULL,
  "targets" "qti"."__domain_gfw43vigph" NOT NULL,
  CONSTRAINT "__item_ref_href_pk_gic6tz4yai" PRIMARY KEY ("node"),
  CONSTRAINT "__item_ref_href_key_node_targets_zb4ttsu4vy" UNIQUE NULLS DISTINCT ("node", "targets")
);

-- Every stored item ref that writes an href has its ItemRefTarget ("Item ref target" before this
-- migration), so each has its ItemRefHref: the target's package and path, and one target.
INSERT INTO "qti"."item_ref_href" ("node", "package", "path", "targets")
SELECT "node", "package", "path", 1::bigint FROM "qti"."item_ref_target";

ALTER TABLE "qti"."site_target" ADD COLUMN "places" boolean DEFAULT true NOT NULL;
-- A section ref places its target; an include places it as its Inclusion does. With every stored
-- inclusion placing, the fold TestDocument.sites draws over placing sites equals the count it held
-- before, which Validate's foreign key over it proves.
UPDATE "qti"."site_target" AS "s"
SET "places" = "i"."places"
FROM "qti"."inclusion" AS "i"
WHERE "i"."node" = "s"."node";
ALTER TABLE "qti"."site_target" ALTER COLUMN "places" DROP DEFAULT;

ALTER TABLE "qti"."test_document" ADD COLUMN "targets" "qti"."__domain_gfw43vigph" DEFAULT 0::bigint NOT NULL;

CREATE TABLE "qti"."unread_type_href" (
  "node" "pg_catalog"."uuid" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."__text_pwaizaq6lx" NOT NULL,
  "type_lexical" "qti"."__text_pwaizaq6lx" NOT NULL,
  CONSTRAINT "__unread_type_href_pk_de5lmpzrd5" PRIMARY KEY ("node"),
  CONSTRAINT "e_1_derived" CHECK ((NOT "type_lexical" ~ '\A(?:extension|imslti\_xmlv1p1|imsltia\_xmlv1p0|imsqti\_fragment\_xmlv3p0|imsqti\_item\_xmlv3p0|imsqti\_outcomes\_xmlv3p0|imsqti\_resprocessing\_xmlv3p0|imsqti\_rptemplate\_xmlv3p0|imsqti\_section\_xmlv3p0|imsqti\_stimulus\_xmlv3p0|imsqti\_test\_xmlv3p0|imsbasiclti\_xmlv1p3|pls|qtiusagedata\/xml|resourceextmetadata\/xml|resourcemetadata\/xml|webcontent|associatedcontent\/learning\-application\-resource|controlfile|css2|css3)\Z'::"pg_catalog"."text" AND "type_lexical" <> ''::"pg_catalog"."text") IS TRUE)
);

CREATE TABLE "qti"."unread_type_path" (
  "names" "qti"."__domain_gfw43vigph" NOT NULL,
  "package" "pg_catalog"."uuid" NOT NULL,
  "path" "qti"."__text_pwaizaq6lx" NOT NULL,
  CONSTRAINT "__unread_type_path_pk_krcrzcqvvc" PRIMARY KEY ("package", "path"),
  CONSTRAINT "e_1_derived" CHECK (("names" > 0::bigint) IS TRUE),
  CONSTRAINT "__unread_type_path_key_package_path_names_4s5fzpvfen" UNIQUE NULLS DISTINCT ("package", "path", "names")
);

ALTER TABLE "qti"."document_id" ADD COLUMN "__document_7pfajdbgba" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "admitted" = true THEN "document" END) STORED;

ALTER TABLE "qti"."document_id" ADD COLUMN "__node_4ck2w6ow6d" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "admitted" = false THEN "node" END) STORED;

ALTER TABLE "qti"."document_id" ADD COLUMN "__node_3olzulnuu3" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "admitted" = true THEN "node" END) STORED;

ALTER TABLE "qti"."id_binding" ADD COLUMN "__document_7pfajdbgba" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "admitted" = true THEN "document" END) STORED;

ALTER TABLE "qti"."id_binding" ADD COLUMN "__id_phjuaybmt3" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" GENERATED ALWAYS AS (CASE WHEN "admitted" = true THEN "id" END) STORED;

ALTER TABLE "qti"."instance" ADD COLUMN "__tag_places_true_fsuzemt64t" boolean GENERATED ALWAYS AS (true) STORED NOT NULL;

ALTER TABLE "qti"."item_ref_href" ADD COLUMN "__tag_kind_qti_assessment_item_ref_7dgpuznkbf" smallint GENERATED ALWAYS AS (109::smallint) STORED NOT NULL;

ALTER TABLE "qti"."item_ref_href" ADD COLUMN "__tag_name_href_uly3pfxknv" smallint GENERATED ALWAYS AS (103::smallint) STORED NOT NULL;

ALTER TABLE "qti"."item_ref_href" ADD COLUMN "__package_adrverkxjo" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "targets" = 0::bigint THEN "package" END) STORED;

ALTER TABLE "qti"."item_ref_href" ADD COLUMN "__path_ngniuv3apr" "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" GENERATED ALWAYS AS (CASE WHEN "targets" = 0::bigint THEN "path" END) STORED;

ALTER TABLE "qti"."item_ref_href" ADD COLUMN "__pred_targets_c5nt4iqzuc" bigint GENERATED ALWAYS AS (CASE WHEN "targets" > 0::bigint THEN "targets"::numeric - (1::bigint)::numeric END) STORED;

ALTER TABLE "qti"."item_ref_target" ADD COLUMN "__copy_targets_acqc7ivxh4" bigint DEFAULT 0::bigint NOT NULL;

ALTER TABLE "qti"."item_ref_target" ADD COLUMN "__index_targets_4bfzj4widk" bigint DEFAULT 0::bigint NOT NULL;

ALTER TABLE "qti"."item_ref_target" ADD COLUMN "__predecessor_targets_vb2ate2sxf" bigint GENERATED ALWAYS AS (CASE WHEN "__index_targets_4bfzj4widk" > 0::bigint THEN "__index_targets_4bfzj4widk"::numeric - (1::bigint)::numeric END) STORED;

ALTER TABLE "qti"."node" ADD COLUMN "__document_3cbls6hfyp" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "pg_catalog"."substring"("qti"."__constant_gbvdw5papk"(), ("version" * 644 + "parent_kind") * 644 + "kind" + 1, 1)::integer = 1 THEN "document" END) STORED;

ALTER TABLE "qti"."node" ADD COLUMN "__id_vefq5vxxrm" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN NOT "pg_catalog"."substring"("qti"."__constant_gbvdw5papk"(), ("version" * 644 + "parent_kind") * 644 + "kind" + 1, 1)::integer = 1 THEN "id" END) STORED;

ALTER TABLE "qti"."node" ADD COLUMN "__id_tyor4vdw5d" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN "pg_catalog"."substring"("qti"."__constant_gbvdw5papk"(), ("version" * 644 + "parent_kind") * 644 + "kind" + 1, 1)::integer = 1 THEN "id" END) STORED;

ALTER TABLE "qti"."resource_href" ADD COLUMN "__node_bsayaavrlz" "pg_catalog"."uuid" GENERATED ALWAYS AS (CASE WHEN NOT "type_lexical" ~ '\A(?:extension|imslti\_xmlv1p1|imsltia\_xmlv1p0|imsqti\_fragment\_xmlv3p0|imsqti\_item\_xmlv3p0|imsqti\_outcomes\_xmlv3p0|imsqti\_resprocessing\_xmlv3p0|imsqti\_rptemplate\_xmlv3p0|imsqti\_section\_xmlv3p0|imsqti\_stimulus\_xmlv3p0|imsqti\_test\_xmlv3p0|imsbasiclti\_xmlv1p3|pls|qtiusagedata\/xml|resourceextmetadata\/xml|resourcemetadata\/xml|webcontent|associatedcontent\/learning\-application\-resource|controlfile|css2|css3)\Z'::"pg_catalog"."text" AND "type_lexical" <> ''::"pg_catalog"."text" THEN "node" END) STORED;

ALTER TABLE "qti"."site_target" ADD COLUMN "__after_targets_0_uzk4mcxzw5" bigint DEFAULT 0::bigint NOT NULL;

ALTER TABLE "qti"."site_target" ADD COLUMN "__before_targets_0_fmlpvwa3pv" bigint DEFAULT 0::bigint NOT NULL;

ALTER TABLE "qti"."site_target" ADD COLUMN "__copy_targets_3sjjwdmfq5" bigint DEFAULT 0::bigint NOT NULL;

ALTER TABLE "qti"."site_target" ADD COLUMN "__index_targets_dhwvwcvgsf" bigint DEFAULT 0::bigint NOT NULL;

ALTER TABLE "qti"."site_target" ADD COLUMN "__predecessor_targets_luepn467by" bigint GENERATED ALWAYS AS (CASE WHEN "__index_targets_dhwvwcvgsf" > 0::bigint THEN "__index_targets_dhwvwcvgsf"::numeric - (1::bigint)::numeric END) STORED;

ALTER TABLE "qti"."test_document" ADD COLUMN "__pred_targets_c5nt4iqzuc" bigint GENERATED ALWAYS AS (CASE WHEN "targets" > 0::bigint THEN "targets"::numeric - (1::bigint)::numeric END) STORED;

ALTER TABLE "qti"."unread_type_href" ADD COLUMN "__copy_names_bd77hksaq7" bigint NOT NULL;

ALTER TABLE "qti"."unread_type_href" ADD COLUMN "__index_names_6ktqyedpys" bigint NOT NULL;

ALTER TABLE "qti"."unread_type_href" ADD COLUMN "__predecessor_names_6cflv6fqva" bigint GENERATED ALWAYS AS (CASE WHEN "__index_names_6ktqyedpys" > 0::bigint THEN "__index_names_6ktqyedpys"::numeric - (1::bigint)::numeric END) STORED;

ALTER TABLE "qti"."unread_type_path" ADD COLUMN "__pred_names_bbnnt7wrn7" bigint GENERATED ALWAYS AS (CASE WHEN "names" > 0::bigint THEN "names"::numeric - (1::bigint)::numeric END) STORED;

ALTER TABLE "qti"."unread_type_href" ADD CONSTRAINT "__unread_type_href_key_package_path_index_names_poqti4ilbr" UNIQUE NULLS DISTINCT ("package", "path", "__index_names_6ktqyedpys");

ALTER TABLE "qti"."unread_type_href" ADD CONSTRAINT "__unread_type_href_check_unread_type_href_counted_c2kqri6dmd" CHECK (("__index_names_6ktqyedpys" >= 0::bigint AND "__index_names_6ktqyedpys" < "__copy_names_bd77hksaq7") IS TRUE);

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_ref_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."unread_type_href"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."unread_type_path"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

UPDATE "qti"."item_ref_target" AS "t"
SET "__index_targets_4bfzj4widk" = "b"."__i", "__copy_targets_acqc7ivxh4" = "b"."__n"
FROM (SELECT "node" AS "node", "pg_catalog"."row_number"() OVER (PARTITION BY "node" ORDER BY "node") - 1::bigint AS "__i", "pg_catalog"."count"(*) OVER (PARTITION BY "node") AS "__n" FROM "qti"."item_ref_target" AS "m") AS "b"
WHERE "t"."node" = "b"."node";

UPDATE "qti"."site_target" AS "t"
SET "__index_targets_dhwvwcvgsf" = "b"."__i", "__copy_targets_3sjjwdmfq5" = "b"."__n", "__before_targets_0_fmlpvwa3pv" = "b"."__before_0_0", "__after_targets_0_uzk4mcxzw5" = "b"."__after_0_0"
FROM (SELECT "node" AS "node", "document" AS "document", "__i" AS "__i", "__n" AS "__n", "__x_0" AS "__x_0", "__after_0_0" AS "__after_0_0", "pg_catalog"."lag"("__after_0_0", 1, 0::bigint) OVER (PARTITION BY "document" ORDER BY "__i") AS "__before_0_0" FROM (SELECT "node" AS "node", "document" AS "document", "__i" AS "__i", "__n" AS "__n", "__x_0" AS "__x_0", ("pg_catalog"."sum"("__x_0") OVER (PARTITION BY "document" ORDER BY "__i" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::bigint AS "__after_0_0" FROM (SELECT "node" AS "node", "document" AS "document", "pg_catalog"."row_number"() OVER (PARTITION BY "document" ORDER BY "node") - 1::bigint AS "__i", "pg_catalog"."count"(*) OVER (PARTITION BY "document") AS "__n", CASE WHEN "places" = true THEN 1::numeric ELSE 0::numeric END AS "__x_0" FROM "qti"."site_target" AS "m") AS "l1") AS "l2") AS "b"
WHERE "t"."node" = "b"."node";

UPDATE "qti"."test_document" AS "t"
SET "targets" = "m"."__copy_targets_3sjjwdmfq5"
FROM "qti"."site_target" AS "m"
WHERE "t"."node" = "m"."document" AND "m"."__index_targets_dhwvwcvgsf" = "m"."__copy_targets_3sjjwdmfq5" - 1::bigint;

ALTER TABLE "qti"."test_document" ALTER COLUMN "targets" DROP DEFAULT;

ALTER TABLE "qti"."item_ref_target"
  ALTER COLUMN "__copy_targets_acqc7ivxh4" DROP DEFAULT,
  ALTER COLUMN "__index_targets_4bfzj4widk" DROP DEFAULT;

ALTER TABLE "qti"."site_target"
  ALTER COLUMN "__after_targets_0_uzk4mcxzw5" DROP DEFAULT,
  ALTER COLUMN "__before_targets_0_fmlpvwa3pv" DROP DEFAULT,
  ALTER COLUMN "__copy_targets_3sjjwdmfq5" DROP DEFAULT,
  ALTER COLUMN "__index_targets_dhwvwcvgsf" DROP DEFAULT;

ALTER TABLE "qti"."inclusion"
  DROP CONSTRAINT "e_1_derived",
  ADD CONSTRAINT "e_1_derived" CHECK ((("parent_kind" IN (223::smallint, 224::smallint, 225::smallint, 226::smallint, 227::smallint, 228::smallint, 230::smallint, 233::smallint, 236::smallint, 237::smallint, 238::smallint, 241::smallint, 243::smallint, 244::smallint, 246::smallint, 247::smallint, 248::smallint, 250::smallint, 251::smallint, 252::smallint, 253::smallint, 254::smallint, 255::smallint, 256::smallint, 257::smallint, 259::smallint, 261::smallint, 262::smallint, 263::smallint, 264::smallint, 265::smallint, 267::smallint, 269::smallint, 270::smallint, 152::smallint, 171::smallint, 199::smallint, 202::smallint, 208::smallint, 219::smallint, 220::smallint, 14::smallint, 119::smallint, 153::smallint, 11::smallint, 129::smallint, 162::smallint, 184::smallint, 95::smallint, 161::smallint, 175::smallint, 174::smallint, 173::smallint, 271::smallint, 179::smallint, 134::smallint, 192::smallint, 191::smallint, 190::smallint, 304::smallint, 197::smallint, 114::smallint, 143::smallint, 111::smallint, 15::smallint, 201::smallint, 277::smallint, 278::smallint, 279::smallint, 281::smallint, 282::smallint, 283::smallint, 285::smallint, 288::smallint, 291::smallint, 295::smallint, 297::smallint) AND ("pg_catalog"."bit_count"("pg_catalog"."set_bit"(X'00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'::"qti"."__node_kind_bits_644_kcdmigfwqm", "root"::integer, 1) & (~ "pg_catalog"."substring"("qti"."__constant_w4tawmrghr"(), ("version" * 78 + "include_parent") * 644 + 1, 644)::"qti"."__node_kind_bits_644_kcdmigfwqm")) = 0::bigint) = true AND "splices" = true OR (NOT "parent_kind" IN (223::smallint, 224::smallint, 225::smallint, 226::smallint, 227::smallint, 228::smallint, 230::smallint, 233::smallint, 236::smallint, 237::smallint, 238::smallint, 241::smallint, 243::smallint, 244::smallint, 246::smallint, 247::smallint, 248::smallint, 250::smallint, 251::smallint, 252::smallint, 253::smallint, 254::smallint, 255::smallint, 256::smallint, 257::smallint, 259::smallint, 261::smallint, 262::smallint, 263::smallint, 264::smallint, 265::smallint, 267::smallint, 269::smallint, 270::smallint, 152::smallint, 171::smallint, 199::smallint, 202::smallint, 208::smallint, 219::smallint, 220::smallint, 14::smallint, 119::smallint, 153::smallint, 11::smallint, 129::smallint, 162::smallint, 184::smallint, 95::smallint, 161::smallint, 175::smallint, 174::smallint, 173::smallint, 271::smallint, 179::smallint, 134::smallint, 192::smallint, 191::smallint, 190::smallint, 304::smallint, 197::smallint, 114::smallint, 143::smallint, 111::smallint, 15::smallint, 201::smallint, 277::smallint, 278::smallint, 279::smallint, 281::smallint, 282::smallint, 283::smallint, 285::smallint, 288::smallint, 291::smallint, 295::smallint, 297::smallint) OR NOT ("pg_catalog"."bit_count"("pg_catalog"."set_bit"(X'00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'::"qti"."__node_kind_bits_644_kcdmigfwqm", "root"::integer, 1) & (~ "pg_catalog"."substring"("qti"."__constant_w4tawmrghr"(), ("version" * 78 + "include_parent") * 644 + 1, 644)::"qti"."__node_kind_bits_644_kcdmigfwqm")) = 0::bigint) = true) AND "splices" = false) AND (NOT ("pg_catalog"."bit_count"("pg_catalog"."set_bit"(X'00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'::"qti"."__node_kind_bits_644_kcdmigfwqm", "root"::integer, 1) & (~ "pg_catalog"."substring"("qti"."__constant_w4tawmrghr"(), ("version" * 78 + "include_parent") * 644 + 1, 644)::"qti"."__node_kind_bits_644_kcdmigfwqm")) = 0::bigint) = true AND "places" = false OR ("pg_catalog"."bit_count"("pg_catalog"."set_bit"(X'00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'::"qti"."__node_kind_bits_644_kcdmigfwqm", "root"::integer, 1) & (~ "pg_catalog"."substring"("qti"."__constant_w4tawmrghr"(), ("version" * 78 + "include_parent") * 644 + 1, 644)::"qti"."__node_kind_bits_644_kcdmigfwqm")) = 0::bigint) = true AND "places" = true) AND (NULLIF("pg_catalog"."substring"("qti"."__constant_eo4djco6b4"(), "include_parent" * 10 + 1, 10)::integer, 0) - 1)::smallint = "parent_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."item_ref_target" ADD CONSTRAINT "__item_ref_target_check_item_ref_target_counted_item_sn7sol4uot" CHECK (("__index_targets_4bfzj4widk" >= 0::bigint AND "__index_targets_4bfzj4widk" < "__copy_targets_acqc7ivxh4") IS TRUE) NOT VALID;

ALTER TABLE "qti"."site_target"
  DROP CONSTRAINT "e_1_derived",
  ADD CONSTRAINT "e_1_derived" CHECK (("places" = true AND "splices" = false OR "kind" = 642::smallint) IS TRUE) NOT VALID;

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_check_site_target_counted_test_lcmbcunhdj" CHECK (("__index_targets_dhwvwcvgsf" >= 0::bigint AND "__index_targets_dhwvwcvgsf" < "__copy_targets_3sjjwdmfq5") IS TRUE) NOT VALID;

ALTER TABLE "qti"."site_target" ADD CONSTRAINT "__site_target_check_test_document_targets_count_fold_kq7fihbeoj" CHECK ((("__index_targets_dhwvwcvgsf" > 0::bigint OR "__before_targets_0_fmlpvwa3pv" = 0::bigint) AND CASE WHEN "places" = true THEN "__after_targets_0_uzk4mcxzw5"::numeric = "__before_targets_0_fmlpvwa3pv"::numeric + (1::bigint)::numeric ELSE "__after_targets_0_uzk4mcxzw5" = "__before_targets_0_fmlpvwa3pv" END) IS TRUE) NOT VALID;

ALTER TABLE "qti"."test_document" ADD CONSTRAINT "__test_document_check_test_document_targets_count_axud4pinz2" CHECK (("targets" > 0::bigint OR "sites" = 0::bigint) IS TRUE) NOT VALID;

ALTER TABLE "qti"."attribute" ADD CONSTRAINT "__attribute_fk_node_nu2sz322f5" FOREIGN KEY ("__node_z57wfvavlb") REFERENCES "qti"."item_ref_href" ("node") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_ref_href" ADD CONSTRAINT "__item_ref_href_fk_node_package_path_tag_name_href_2kw3eaprte" FOREIGN KEY ("node", "package", "path", "__tag_name_href_uly3pfxknv") REFERENCES "qti"."reference_path" ("node", "package", "path", "name") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref_href" ADD CONSTRAINT "__item_ref_href_fk_node_tag_kind_qti_assessment_item_ifa6ig36c2" FOREIGN KEY ("node", "__tag_kind_qti_assessment_item_ref_7dgpuznkbf") REFERENCES "qti"."node" ("id", "kind") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref_href" ADD CONSTRAINT "__item_ref_href_fk_package_path_kr7t3bri5e" FOREIGN KEY ("__package_adrverkxjo", "__path_ngniuv3apr") REFERENCES "qti"."unread_type_path" ("package", "path") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_ref_target" ADD CONSTRAINT "__item_ref_target_fk_node_copy_targets_ln5fobuske" FOREIGN KEY ("node", "__copy_targets_acqc7ivxh4") REFERENCES "qti"."item_ref_href" ("node", "targets") MATCH SIMPLE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."resource_href" ADD CONSTRAINT "__resource_href_fk_node_kv3zocm3jr" FOREIGN KEY ("__node_bsayaavrlz") REFERENCES "qti"."unread_type_href" ("node") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."unread_type_href" ADD CONSTRAINT "__unread_type_href_fk_node_package_type_lexical_ukutjbkxbx" FOREIGN KEY ("node", "package", "type_lexical") REFERENCES "qti"."resource" ("node", "package", "type_lexical") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."unread_type_href" ADD CONSTRAINT "__unread_type_href_fk_package_path_copy_names_2nqtpzsvje" FOREIGN KEY ("package", "path", "__copy_names_bd77hksaq7") REFERENCES "qti"."unread_type_path" ("package", "path", "names") MATCH SIMPLE ON UPDATE CASCADE;

ALTER TABLE "qti"."unread_type_href" ADD CONSTRAINT "__unread_type_href_fk_package_path_predecessor_names_tpztwrqxx2" FOREIGN KEY ("package", "path", "__predecessor_names_6cflv6fqva") REFERENCES "qti"."unread_type_href" ("package", "path", "__index_names_6ktqyedpys") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."unread_type_path" ADD CONSTRAINT "__unread_type_path_fk_package_path_pred_names_j2iyglxqs6" FOREIGN KEY ("package", "path", "__pred_names_bbnnt7wrn7") REFERENCES "qti"."unread_type_href" ("package", "path", "__index_names_6ktqyedpys") MATCH SIMPLE DEFERRABLE INITIALLY DEFERRED;

CREATE VIEW "qti__author"."attribute" ("at", "attrs_after", "attrs_was", "document", "document_type", "document_type_name", "double_value", "entities", "governs", "governs_name", "id", "idref_text", "idrefs", "kind", "kind_name", "lexical", "name", "name_name", "node", "open_name", "prefix", "slot", "version", "version_name") AS
SELECT "r1"."at", "r1"."attrs_after", "r1"."attrs_was", "r1"."document", "r1"."document_type", ("qti"."__resource_type_names_iatibe6omc"())["r1"."document_type" + 1]::"pg_catalog"."text", "r1"."double_value", "r1"."entities", "r1"."governs", ("qti"."__type_name_names_nykiaxxd3n"())["r1"."governs" + 1]::"pg_catalog"."text", "r1"."id", "r1"."idref_text", "r1"."idrefs", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."lexical", "r1"."name", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."name" + 1]::"pg_catalog"."text", "r1"."node", "r1"."open_name", "r1"."prefix", "r1"."slot", "r1"."version", ("qti"."__schema_version_names_p2hfvbhu24"())["r1"."version" + 1]::"pg_catalog"."text"
FROM "qti"."attribute" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute" TO "qti__author";

CREATE VIEW "qti__author"."document_id" ("admitted", "after", "before", "document", "id", "lexical", "node", "owner") AS
SELECT "r1"."admitted", "r1"."after", "r1"."before", "r1"."document", "r1"."id", "r1"."lexical", "r1"."node", "r1"."owner"
FROM "qti"."document_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."document_id" TO "qti__author";

CREATE VIEW "qti__author"."id_binding" ("admitted", "carriers", "document", "id", "owner") AS
SELECT "r1"."admitted", "r1"."carriers", "r1"."document", "r1"."id", "r1"."owner"
FROM "qti"."id_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."id_binding" TO "qti__author";

CREATE VIEW "qti__author"."idref_target" ("assembled", "document", "id") AS
SELECT "r1"."assembled", "r1"."document", "r1"."id"
FROM "qti"."idref_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."idref_target" TO "qti__author";

CREATE VIEW "qti__author"."inclusion" ("include_parent", "include_parent_name", "node", "parent_kind", "parent_kind_name", "places", "root", "root_name", "splices", "version", "version_name") AS
SELECT "r1"."include_parent", ("qti"."__include_parent_names_fixlnrxa4e"())["r1"."include_parent" + 1]::"pg_catalog"."text", "r1"."node", "r1"."parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_kind" + 1]::"pg_catalog"."text", "r1"."places", "r1"."root", ("qti"."__node_kind_names_ulbko553n7"())["r1"."root" + 1]::"pg_catalog"."text", "r1"."splices", "r1"."version", ("qti"."__schema_version_names_p2hfvbhu24"())["r1"."version" + 1]::"pg_catalog"."text"
FROM "qti"."inclusion" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inclusion" TO "qti__author";

CREATE VIEW "qti__author"."instance" ("assembly", "assembly_kind", "assembly_kind_name", "at", "bindings", "children", "choices", "document", "end", "hottexts", "id", "idref_targets", "ids", "langs", "mixes", "names", "parent", "parent_document", "parent_mixes", "parent_part", "parent_replaced", "part", "replaced", "root_kind", "root_kind_name", "rules", "site", "site_loose_chain", "site_mixes", "site_part", "site_replaced", "site_start", "start", "variables") AS
SELECT "r1"."assembly", "r1"."assembly_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."assembly_kind" + 1]::"pg_catalog"."text", "r1"."at", "r1"."bindings", "r1"."children", "r1"."choices", "r1"."document", "r1"."end", "r1"."hottexts", "r1"."id", "r1"."idref_targets", "r1"."ids", "r1"."langs", "r1"."mixes", "r1"."names", "r1"."parent", "r1"."parent_document", "r1"."parent_mixes", "r1"."parent_part", "r1"."parent_replaced", "r1"."part", "r1"."replaced", "r1"."root_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."root_kind" + 1]::"pg_catalog"."text", "r1"."rules", "r1"."site", "r1"."site_loose_chain", "r1"."site_mixes", "r1"."site_part", "r1"."site_replaced", "r1"."site_start", "r1"."start", "r1"."variables"
FROM "qti"."instance" AS "r1";

GRANT SELECT ON TABLE "qti__author"."instance" TO "qti__author";

CREATE VIEW "qti__author"."item_ref_href" ("node", "package", "path", "targets") AS
SELECT "r1"."node", "r1"."package", "r1"."path", "r1"."targets"
FROM "qti"."item_ref_href" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_ref_href" TO "qti__author";

CREATE VIEW "qti__author"."item_ref_target" ("node", "package", "path", "type", "type_name") AS
SELECT "r1"."node", "r1"."package", "r1"."path", "r1"."type", ("qti"."__resource_type_names_iatibe6omc"())["r1"."type" + 1]::"pg_catalog"."text"
FROM "qti"."item_ref_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_ref_target" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "at", "attributes", "attrs", "barred_children", "chars", "chars_after", "chars_was", "children", "counted_children", "document", "document_type", "document_type_name", "double_value", "element_children", "elements", "elements_was", "end", "first", "governs", "governs_name", "id", "kind", "kind_name", "last", "last_state", "last_state_name", "namespaces", "nearest", "nearest_kind", "nearest_kind_name", "parent", "parent_ancestry", "parent_governs", "parent_governs_name", "parent_kind", "parent_kind_name", "parent_nearest", "parent_nearest_kind", "parent_nearest_kind_name", "parent_parent_kind", "parent_parent_kind_name", "prefix", "start", "state", "state_name", "string_value", "version", "version_name", "was", "was_name") AS
SELECT "r1"."ancestry", "r1"."at", "r1"."attributes", "r1"."attrs", "r1"."barred_children", "r1"."chars", "r1"."chars_after", "r1"."chars_was", "r1"."children", "r1"."counted_children", "r1"."document", "r1"."document_type", ("qti"."__resource_type_names_iatibe6omc"())["r1"."document_type" + 1]::"pg_catalog"."text", "r1"."double_value", "r1"."element_children", "r1"."elements", "r1"."elements_was", "r1"."end", "r1"."first", "r1"."governs", ("qti"."__type_name_names_nykiaxxd3n"())["r1"."governs" + 1]::"pg_catalog"."text", "r1"."id", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."last", "r1"."last_state", ("qti"."__position_names_sglcn7ygpg"())["r1"."last_state" + 1]::"pg_catalog"."text", "r1"."namespaces", "r1"."nearest", "r1"."nearest_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."nearest_kind" + 1]::"pg_catalog"."text", "r1"."parent", "r1"."parent_ancestry", "r1"."parent_governs", ("qti"."__type_name_names_nykiaxxd3n"())["r1"."parent_governs" + 1]::"pg_catalog"."text", "r1"."parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_kind" + 1]::"pg_catalog"."text", "r1"."parent_nearest", "r1"."parent_nearest_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_nearest_kind" + 1]::"pg_catalog"."text", "r1"."parent_parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_parent_kind" + 1]::"pg_catalog"."text", "r1"."prefix", "r1"."start", "r1"."state", ("qti"."__position_names_sglcn7ygpg"())["r1"."state" + 1]::"pg_catalog"."text", "r1"."string_value", "r1"."version", ("qti"."__schema_version_names_p2hfvbhu24"())["r1"."version" + 1]::"pg_catalog"."text", "r1"."was", ("qti"."__position_names_sglcn7ygpg"())["r1"."was" + 1]::"pg_catalog"."text"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."reference_path" ("document", "kind", "kind_name", "name", "name_name", "node", "package", "path") AS
SELECT "r1"."document", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."name", ("qti"."__attribute_name_names_q6tmzcty4e"())["r1"."name" + 1]::"pg_catalog"."text", "r1"."node", "r1"."package", "r1"."path"
FROM "qti"."reference_path" AS "r1";

GRANT SELECT ON TABLE "qti__author"."reference_path" TO "qti__author";

CREATE VIEW "qti__author"."resource" ("document", "kind", "kind_name", "nearest", "node", "package", "parent", "start", "type_lexical", "version", "version_name") AS
SELECT "r1"."document", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."nearest", "r1"."node", "r1"."package", "r1"."parent", "r1"."start", "r1"."type_lexical", "r1"."version", ("qti"."__schema_version_names_p2hfvbhu24"())["r1"."version" + 1]::"pg_catalog"."text"
FROM "qti"."resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource" TO "qti__author";

CREATE VIEW "qti__author"."resource_href" ("href", "node", "package", "path", "scope", "scope_name", "type_lexical") AS
SELECT "r1"."href", "r1"."node", "r1"."package", "r1"."path", "r1"."scope", ("qti"."__href_scope_names_y4pbuo4f5q"())["r1"."scope" + 1]::"pg_catalog"."text", "r1"."type_lexical"
FROM "qti"."resource_href" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_href" TO "qti__author";

CREATE VIEW "qti__author"."site_target" ("ancestry", "document", "kind", "kind_name", "nearest", "nearest_kind", "nearest_kind_name", "node", "package", "parent_kind", "parent_kind_name", "path", "places", "splices", "target", "target_nearest", "target_nearest_kind", "target_nearest_kind_name", "target_root", "target_root_name", "version", "version_name") AS
SELECT "r1"."ancestry", "r1"."document", "r1"."kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."kind" + 1]::"pg_catalog"."text", "r1"."nearest", "r1"."nearest_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."nearest_kind" + 1]::"pg_catalog"."text", "r1"."node", "r1"."package", "r1"."parent_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."parent_kind" + 1]::"pg_catalog"."text", "r1"."path", "r1"."places", "r1"."splices", "r1"."target", "r1"."target_nearest", "r1"."target_nearest_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."target_nearest_kind" + 1]::"pg_catalog"."text", "r1"."target_root", ("qti"."__node_kind_names_ulbko553n7"())["r1"."target_root" + 1]::"pg_catalog"."text", "r1"."version", ("qti"."__schema_version_names_p2hfvbhu24"())["r1"."version" + 1]::"pg_catalog"."text"
FROM "qti"."site_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."site_target" TO "qti__author";

CREATE VIEW "qti__author"."test_document" ("instances", "names", "node", "package", "path", "root_kind", "root_kind_name", "rules", "sites", "targets") AS
SELECT "r1"."instances", "r1"."names", "r1"."node", "r1"."package", "r1"."path", "r1"."root_kind", ("qti"."__node_kind_names_ulbko553n7"())["r1"."root_kind" + 1]::"pg_catalog"."text", "r1"."rules", "r1"."sites", "r1"."targets"
FROM "qti"."test_document" AS "r1";

GRANT SELECT ON TABLE "qti__author"."test_document" TO "qti__author";

CREATE VIEW "qti__author"."unread_type_href" ("node", "package", "path", "type_lexical") AS
SELECT "r1"."node", "r1"."package", "r1"."path", "r1"."type_lexical"
FROM "qti"."unread_type_href" AS "r1";

GRANT SELECT ON TABLE "qti__author"."unread_type_href" TO "qti__author";

CREATE VIEW "qti__author"."unread_type_path" ("names", "package", "path") AS
SELECT "r1"."names", "r1"."package", "r1"."path"
FROM "qti"."unread_type_path" AS "r1";

GRANT SELECT ON TABLE "qti__author"."unread_type_path" TO "qti__author";
