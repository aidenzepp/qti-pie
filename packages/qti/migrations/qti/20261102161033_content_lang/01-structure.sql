DROP POLICY "qti__author" ON "qti"."lom_language";

DROP POLICY "qti__author" ON "qti"."edge";

DROP VIEW "qti__author"."lom_language";

DROP VIEW "qti__author"."edge";

ALTER TABLE "qti"."lom_language" ADD COLUMN "parent_kind" "qti"."node_kind" DEFAULT 'lom:general' NOT NULL;
ALTER TABLE "qti"."lom_language" ALTER COLUMN "parent_kind" DROP DEFAULT;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_id_parent_kind_avtlxpj6rc" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE VIEW "qti__author"."edge" ("child", "child_ancestry", "child_kind", "parent", "parent_ancestry", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_ancestry", "r1"."child_kind", "r1"."parent", "r1"."parent_ancestry", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."lom_language" ("id", "lom", "owner", "parent_kind", "position", "value") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent_kind", "r1"."position", "r1"."value"
FROM "qti"."lom_language" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_language" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_language" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
