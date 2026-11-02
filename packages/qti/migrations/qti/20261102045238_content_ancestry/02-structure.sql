DROP POLICY "qti__author" ON "qti"."tree_root";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."edge";

DROP VIEW "qti__author"."tree_root";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."edge";

ALTER TABLE "qti"."edge" ADD COLUMN "child_ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."edge" ALTER COLUMN "child_ancestry" DROP DEFAULT;

ALTER TABLE "qti"."edge" ADD COLUMN "parent_ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."edge" ALTER COLUMN "parent_ancestry" DROP DEFAULT;

ALTER TABLE "qti"."node" ADD COLUMN "ancestry" "qti"."ancestry" DEFAULT 'root' NOT NULL;
ALTER TABLE "qti"."node" ALTER COLUMN "ancestry" DROP DEFAULT;

ALTER TABLE "qti"."tree_root" ADD COLUMN "__tag_ancestry_root_7ltbltwcre" "qti"."ancestry" GENERATED ALWAYS AS ('root'::"qti"."ancestry") STORED NOT NULL;

CREATE VIEW "qti__author"."edge" ("child", "child_ancestry", "child_kind", "parent", "parent_ancestry", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_ancestry", "r1"."child_kind", "r1"."parent", "r1"."parent_ancestry", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."tree_root" ("node", "tree") AS
SELECT "r1"."node", "r1"."tree"
FROM "qti"."tree_root" AS "r1";

GRANT SELECT ON TABLE "qti__author"."tree_root" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."tree_root" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
