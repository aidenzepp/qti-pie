DROP POLICY "qti__author" ON "qti"."round_to";

DROP POLICY "qti__author" ON "qti"."repeat";

DROP POLICY "qti__author" ON "qti"."index";

DROP POLICY "qti__author" ON "qti"."equal_rounded";

DROP VIEW "qti__author"."round_to";

DROP VIEW "qti__author"."repeat";

DROP VIEW "qti__author"."index";

DROP VIEW "qti__author"."equal_rounded";

CREATE TABLE "qti"."equal_rounded_figures_ref" (
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__equal_rounded_figures_ref_pk_lrh6x3lixv" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."index_n_ref" (
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__index_n_ref_pk_6lh3ogtevn" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."repeat_number_repeats_ref" (
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__repeat_number_repeats_ref_pk_njoppu25ma" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."round_to_figures_ref" (
  "identifier" "qti"."__text_rhdrzkabze" NOT NULL,
  "node" uuid NOT NULL,
  CONSTRAINT "__round_to_figures_ref_pk_tjv2uh5ong" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."equal_rounded_figures_ref" ADD COLUMN "__tag_figures_kind_ref_zxnonbgyte" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

ALTER TABLE "qti"."index_n_ref" ADD COLUMN "__tag_n_kind_ref_ffmcx5ok6w" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

ALTER TABLE "qti"."repeat_number_repeats_ref" ADD COLUMN "__tag_number_repeats_kind_ref_juikk35ua4" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

ALTER TABLE "qti"."round_to_figures_ref" ADD COLUMN "__tag_figures_kind_ref_r6zofyzy4o" "qti"."ref_or_literal" GENERATED ALWAYS AS ('ref'::"qti"."ref_or_literal") STORED NOT NULL;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."equal_rounded_figures_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."index_n_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."repeat_number_repeats_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."round_to_figures_ref"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."equal_rounded" ("figures_kind", "figures_value", "id", "rounding_mode") AS
SELECT "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode"
FROM "qti"."equal_rounded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."equal_rounded" TO "qti__author";

CREATE VIEW "qti__author"."equal_rounded_figures_ref" ("identifier", "node") AS
SELECT "r1"."identifier", "r1"."node"
FROM "qti"."equal_rounded_figures_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."equal_rounded_figures_ref" TO "qti__author";

CREATE VIEW "qti__author"."index" ("id", "n_kind", "n_value") AS
SELECT "r1"."id", "r1"."n_kind", "r1"."n_value"
FROM "qti"."index" AS "r1";

GRANT SELECT ON TABLE "qti__author"."index" TO "qti__author";

CREATE VIEW "qti__author"."index_n_ref" ("identifier", "node") AS
SELECT "r1"."identifier", "r1"."node"
FROM "qti"."index_n_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."index_n_ref" TO "qti__author";

CREATE VIEW "qti__author"."repeat" ("id", "number_repeats_kind", "number_repeats_value") AS
SELECT "r1"."id", "r1"."number_repeats_kind", "r1"."number_repeats_value"
FROM "qti"."repeat" AS "r1";

GRANT SELECT ON TABLE "qti__author"."repeat" TO "qti__author";

CREATE VIEW "qti__author"."repeat_number_repeats_ref" ("identifier", "node") AS
SELECT "r1"."identifier", "r1"."node"
FROM "qti"."repeat_number_repeats_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."repeat_number_repeats_ref" TO "qti__author";

CREATE VIEW "qti__author"."round_to" ("figures_kind", "figures_value", "id", "rounding_mode") AS
SELECT "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode"
FROM "qti"."round_to" AS "r1";

GRANT SELECT ON TABLE "qti__author"."round_to" TO "qti__author";

CREATE VIEW "qti__author"."round_to_figures_ref" ("identifier", "node") AS
SELECT "r1"."identifier", "r1"."node"
FROM "qti"."round_to_figures_ref" AS "r1";

GRANT SELECT ON TABLE "qti__author"."round_to_figures_ref" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."equal_rounded" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."equal_rounded_figures_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."index" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."index_n_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."repeat" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."repeat_number_repeats_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."round_to" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."round_to_figures_ref" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
