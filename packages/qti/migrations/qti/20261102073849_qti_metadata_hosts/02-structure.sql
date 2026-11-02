DROP POLICY "qti__author" ON "qti"."resource_metadata";

DROP POLICY "qti__author" ON "qti"."resource_lom";

DROP POLICY "qti__author" ON "qti"."resource";

DROP POLICY "qti__author" ON "qti"."qti_metadata";

DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."external_lom";

DROP POLICY "qti__author" ON "qti"."edge";

DROP VIEW "qti__author"."resource_metadata";

DROP VIEW "qti__author"."resource_lom";

DROP VIEW "qti__author"."resource";

DROP VIEW "qti__author"."qti_metadata";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."external_lom";

DROP VIEW "qti__author"."edge";

ALTER TABLE "qti"."qti_metadata" DROP CONSTRAINT "__qti_metadata_fk_resource_y2rrzblzav";

ALTER TABLE "qti"."qti_metadata" DROP CONSTRAINT "__qti_metadata_key_resource_rnqab2cujf";

ALTER TABLE "qti"."qti_metadata" ADD COLUMN "host" "qti"."qti_metadata_host" DEFAULT 'metadata'::"qti"."qti_metadata_host" NOT NULL;
ALTER TABLE "qti"."qti_metadata" ALTER COLUMN "host" DROP DEFAULT;

ALTER TABLE "qti"."qti_metadata" ADD COLUMN "package" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."qti_metadata" ALTER COLUMN "package" DROP DEFAULT;

ALTER TABLE "qti"."qti_metadata" ALTER COLUMN "resource" TYPE "qti"."__text_rhdrzkabze" USING 'x'::"qti"."__text_rhdrzkabze";

CREATE TABLE "qti"."qti_metadata_in_external_lom" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__qti_metadata_in_external_lom_pk_wr7moirehy" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qti_metadata_in_metadata" (
  "id" uuid NOT NULL,
  "metadata" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  "resource_node" uuid NOT NULL,
  CONSTRAINT "__qti_metadata_in_metadata_pk_6n7gq32ruf" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."qti_metadata_in_resource_lom" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  "package" uuid NOT NULL,
  "resource" "qti"."__text_rhdrzkabze" NOT NULL,
  CONSTRAINT "__qti_metadata_in_resource_lom_pk_bc5j6sb4j4" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD COLUMN "__tag_host_external_lom_zuf64srpbg" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('externalLom'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD COLUMN "__tag_host_metadata_knpb2q2kry" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('metadata'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD COLUMN "__tag_host_resource_lom_vu3w7ocz2u" "qti"."qti_metadata_host" GENERATED ALWAYS AS ('resourceLom'::"qti"."qti_metadata_host") STORED NOT NULL;

ALTER TABLE "qti"."qti_metadata_in_external_lom" ADD CONSTRAINT "__qti_metadata_in_external_lom_fk_id_lom_r3vzadspmn" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_id_metadata_amwofuqajo" FOREIGN KEY ("id", "metadata") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_metadata" ADD CONSTRAINT "__qti_metadata_in_metadata_fk_resource_node_package_bwtvi3p7ra" FOREIGN KEY ("resource_node", "package", "resource") REFERENCES "qti"."resource" ("id", "package", "identifier") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."qti_metadata_in_resource_lom" ADD CONSTRAINT "__qti_metadata_in_resource_lom_fk_id_lom_66wahx7d6l" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_external_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_metadata"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."qti_metadata_in_resource_lom"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."external_lom" ("document", "lom", "package", "resource") AS
SELECT "r1"."document", "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."external_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."external_lom" TO "qti__author";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata" ("host", "id", "package", "resource") AS
SELECT "r1"."host", "r1"."id", "r1"."package", "r1"."resource"
FROM "qti"."qti_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata_in_external_lom" ("id", "lom", "package", "resource") AS
SELECT "r1"."id", "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."qti_metadata_in_external_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata_in_external_lom" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata_in_metadata" ("id", "metadata", "package", "resource", "resource_node") AS
SELECT "r1"."id", "r1"."metadata", "r1"."package", "r1"."resource", "r1"."resource_node"
FROM "qti"."qti_metadata_in_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata_in_metadata" TO "qti__author";

CREATE VIEW "qti__author"."qti_metadata_in_resource_lom" ("id", "lom", "package", "resource") AS
SELECT "r1"."id", "r1"."lom", "r1"."package", "r1"."resource"
FROM "qti"."qti_metadata_in_resource_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."qti_metadata_in_resource_lom" TO "qti__author";

CREATE VIEW "qti__author"."resource" ("id", "identifier", "package", "type", "version") AS
SELECT "r1"."id", "r1"."identifier", "r1"."package", "r1"."type", "r1"."version"
FROM "qti"."resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource" TO "qti__author";

CREATE VIEW "qti__author"."resource_lom" ("lom", "metadata", "package", "resource", "type") AS
SELECT "r1"."lom", "r1"."metadata", "r1"."package", "r1"."resource", "r1"."type"
FROM "qti"."resource_lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_lom" TO "qti__author";

CREATE VIEW "qti__author"."resource_metadata" ("id", "resource") AS
SELECT "r1"."id", "r1"."resource"
FROM "qti"."resource_metadata" AS "r1";

GRANT SELECT ON TABLE "qti__author"."resource_metadata" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."external_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata_in_external_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata_in_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."qti_metadata_in_resource_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."resource_metadata" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
