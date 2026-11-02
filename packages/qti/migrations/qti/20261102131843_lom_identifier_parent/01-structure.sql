DROP POLICY "qti__author" ON "qti"."lom_object_identifier";

DROP POLICY "qti__author" ON "qti"."lom_identifier_entry";

DROP POLICY "qti__author" ON "qti"."lom_identifier_catalog";

DROP POLICY "qti__author" ON "qti"."lom_identifier";

DROP POLICY "qti__author" ON "qti"."edge";

DROP VIEW "qti__author"."lom_object_identifier";

DROP VIEW "qti__author"."lom_identifier_entry";

DROP VIEW "qti__author"."lom_identifier_catalog";

DROP VIEW "qti__author"."lom_identifier";

DROP VIEW "qti__author"."edge";

ALTER TABLE "qti"."lom_identifier" ADD COLUMN "parent" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."lom_identifier" ALTER COLUMN "parent" DROP DEFAULT;

ALTER TABLE "qti"."lom_object_identifier" ADD COLUMN "identifier" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."lom_object_identifier" ALTER COLUMN "identifier" DROP DEFAULT;

ALTER TABLE "qti"."lom_identifier" ADD CONSTRAINT "__lom_identifier_fk_id_parent_position_rhykptsoqt" FOREIGN KEY ("id", "parent", "position") REFERENCES "qti"."edge" ("child", "parent", "position") DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."lom_identifier" ("id", "lom", "owner", "parent", "position") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent", "r1"."position"
FROM "qti"."lom_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_identifier" TO "qti__author";

CREATE VIEW "qti__author"."lom_identifier_catalog" ("collapsed", "id", "identifier", "lom", "owner", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."identifier", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_identifier_catalog" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_identifier_catalog" TO "qti__author";

CREATE VIEW "qti__author"."lom_identifier_entry" ("collapsed", "id", "identifier", "lom", "owner", "position", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."identifier", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_identifier_entry" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_identifier_entry" TO "qti__author";

CREATE VIEW "qti__author"."lom_object_identifier" ("collapsed", "identifier", "lom", "package", "position", "resource", "type") AS
SELECT "r1"."collapsed", "r1"."identifier", "r1"."lom", "r1"."package", "r1"."position", "r1"."resource", "r1"."type"
FROM "qti"."lom_object_identifier" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_object_identifier" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier_catalog" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_identifier_entry" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_object_identifier" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
