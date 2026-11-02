DROP POLICY "qti__author" ON "qti"."track_label";

DROP POLICY "qti__author" ON "qti"."track";

DROP POLICY "qti__author" ON "qti"."mapping";

DROP POLICY "qti__author" ON "qti"."area_mapping";

DROP VIEW "qti__author"."track_label";

DROP VIEW "qti__author"."track";

DROP VIEW "qti__author"."mapping";

DROP VIEW "qti__author"."area_mapping";


CREATE TABLE "qti"."declared_area_mapping_default_value" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_area_mapping_default_value_pk_w2oayrb4x4" PRIMARY KEY ("node")
);


CREATE TABLE "qti"."declared_mapping_default_value" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_mapping_default_value_pk_46yyn7x6np" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."declared_area_mapping_default_value" ADD CONSTRAINT "__declared_area_mapping_default_value_fk_node_ztftp5ed66" FOREIGN KEY ("node") REFERENCES "qti"."area_mapping" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_mapping_default_value" ADD CONSTRAINT "__declared_mapping_default_value_fk_node_odiqgp3tz7" FOREIGN KEY ("node") REFERENCES "qti"."mapping" ("id") DEFERRABLE INITIALLY DEFERRED;


CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_area_mapping_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();


CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_mapping_default_value"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."area_mapping" ("declaration", "default_value", "document", "id") AS
SELECT "r1"."declaration", "r1"."default_value", "r1"."document", "r1"."id"
FROM "qti"."area_mapping" AS "r1";

GRANT SELECT ON TABLE "qti__author"."area_mapping" TO "qti__author";

CREATE VIEW "qti__author"."declared_area_mapping_default_value" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_area_mapping_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_area_mapping_default_value" TO "qti__author";

CREATE VIEW "qti__author"."declared_mapping_default_value" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_mapping_default_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_mapping_default_value" TO "qti__author";

CREATE VIEW "qti__author"."mapping" ("base_type", "declaration", "default_value", "document", "id") AS
SELECT "r1"."base_type", "r1"."declaration", "r1"."default_value", "r1"."document", "r1"."id"
FROM "qti"."mapping" AS "r1";

GRANT SELECT ON TABLE "qti__author"."mapping" TO "qti__author";

CREATE VIEW "qti__author"."track" ("id", "kind", "src") AS
SELECT "r1"."id", "r1"."kind", "r1"."src"
FROM "qti"."track" AS "r1";

GRANT SELECT ON TABLE "qti__author"."track" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."area_mapping" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_area_mapping_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_mapping_default_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."mapping" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."track" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
