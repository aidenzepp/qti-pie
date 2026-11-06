DROP POLICY "qti__author" ON "qti"."section_identifier_target";

DROP POLICY "qti__author" ON "qti"."expression_section_identifier";

DROP VIEW "qti__author"."tests_hold";

DROP VIEW "qti__author"."section_identifier_target";

DROP VIEW "qti__author"."expression_section_identifier";

ALTER TABLE "qti"."expression_section_identifier" ALTER COLUMN "value" TYPE "qti"."test_structure_identifier" USING "value"::"qti"."test_structure_identifier";

CREATE VIEW "qti__author"."expression_section_identifier" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."expression_section_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression_section_identifier" TO "qti__author";

CREATE VIEW "qti__author"."section_identifier_target" ("document", "holder_kind", "identifier", "node", "test") AS
SELECT "r1"."document", "r1"."holder_kind", "r1"."identifier", "r1"."node", "r1"."test"
FROM "qti"."section_identifier_target" AS "r1";

GRANT SELECT ON TABLE "qti__author"."section_identifier_target" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."expression_section_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."section_identifier_target" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
