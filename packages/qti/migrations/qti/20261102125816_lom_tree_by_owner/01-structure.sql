DROP POLICY "qti__author" ON "qti"."resource_lom";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."manifest_lom";

DROP POLICY "qti__author" ON "qti"."lom";

DROP POLICY "qti__author" ON "qti"."file_lom";

DROP VIEW "qti__author"."resource_lom";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."manifest_lom";

DROP VIEW "qti__author"."lom";

DROP VIEW "qti__author"."file_lom";

ALTER TABLE "qti"."file_lom" ADD CONSTRAINT "__file_lom_fk_lom_package_jdvawz4chd" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."manifest_lom" ADD CONSTRAINT "__manifest_lom_fk_lom_package_a6edccbozn" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."resource_lom" ADD CONSTRAINT "__resource_lom_fk_lom_package_z2mqb4ohk3" FOREIGN KEY ("lom", "package") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE VIEW "qti__author"."file_lom" ("file", "lom", "metadata", "package") AS
SELECT "r1"."file", "r1"."lom", "r1"."metadata", "r1"."package"
FROM "qti"."file_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."file_lom" TO "qti__author";

CREATE VIEW "qti__author"."lom" ("id", "owner", "package") AS
SELECT "r1"."id", "r1"."owner", "r1"."package"
FROM "qti"."lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom" TO "qti__author";

CREATE VIEW "qti__author"."manifest_lom" ("lom", "metadata", "package") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package"
FROM "qti"."manifest_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."manifest_lom" TO "qti__author";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."resource_lom" ("lom", "metadata", "package", "resource", "type") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."resource_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_lom" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."file_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."manifest_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
