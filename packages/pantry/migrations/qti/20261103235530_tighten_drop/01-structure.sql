DROP POLICY "qti__author" ON "qti"."round_to";

DROP POLICY "qti__author" ON "qti"."repeat";

DROP POLICY "qti__author" ON "qti"."index";

DROP POLICY "qti__author" ON "qti"."equal_rounded";

DROP VIEW "qti__author"."round_to";

DROP VIEW "qti__author"."repeat";

DROP VIEW "qti__author"."index";

DROP VIEW "qti__author"."equal_rounded";

ALTER TABLE "qti"."equal_rounded" ADD CONSTRAINT "equal_rounded_figures_ref_zero" CHECK (("figures_kind" = 'literal'::"qti"."ref_or_literal" OR "figures_value" = 0::bigint) IS TRUE) NOT VALID;

ALTER TABLE "qti"."index" ADD CONSTRAINT "index_n_ref_zero" CHECK (("n_kind" = 'literal'::"qti"."ref_or_literal" OR "n_value" = 0::bigint) IS TRUE) NOT VALID;

ALTER TABLE "qti"."repeat" ADD CONSTRAINT "repeat_number_repeats_ref_zero" CHECK (("number_repeats_kind" = 'literal'::"qti"."ref_or_literal" OR "number_repeats_value" = 0::bigint) IS TRUE) NOT VALID;

ALTER TABLE "qti"."round_to" ADD CONSTRAINT "round_to_figures_ref_zero" CHECK (("figures_kind" = 'literal'::"qti"."ref_or_literal" OR "figures_value" = 0::bigint) IS TRUE) NOT VALID;

CREATE VIEW "qti__author"."equal_rounded" ("figures_kind", "figures_value", "id", "rounding_mode") AS
SELECT "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode"
FROM "qti"."equal_rounded" AS "r1";

GRANT SELECT ON TABLE "qti__author"."equal_rounded" TO "qti__author";

CREATE VIEW "qti__author"."index" ("id", "n_kind", "n_value") AS
SELECT "r1"."id", "r1"."n_kind", "r1"."n_value"
FROM "qti"."index" AS "r1";

GRANT SELECT ON TABLE "qti__author"."index" TO "qti__author";

CREATE VIEW "qti__author"."repeat" ("id", "number_repeats_kind", "number_repeats_value") AS
SELECT "r1"."id", "r1"."number_repeats_kind", "r1"."number_repeats_value"
FROM "qti"."repeat" AS "r1";

GRANT SELECT ON TABLE "qti__author"."repeat" TO "qti__author";

CREATE VIEW "qti__author"."round_to" ("figures_kind", "figures_value", "id", "rounding_mode") AS
SELECT "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode"
FROM "qti"."round_to" AS "r1";

GRANT SELECT ON TABLE "qti__author"."round_to" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."equal_rounded" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."index" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."repeat" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."round_to" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
