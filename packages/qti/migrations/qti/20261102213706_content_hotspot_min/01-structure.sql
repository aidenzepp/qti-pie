DROP POLICY "qti__author" ON "qti"."associable_hotspot";

DROP VIEW "qti__author"."associable_hotspot";

CREATE TABLE "qti"."associable_hotspot_match_min" (
  "node" uuid NOT NULL,
  "value" "qti"."__text_clza6vokfo" NOT NULL,
  CONSTRAINT "__associable_hotspot_match_min_pk_fk3v5ypkng" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."associable_hotspot_match_min" ADD CONSTRAINT "__associable_hotspot_match_min_fk_node_zpvavojw5b" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."associable_hotspot_match_min"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."associable_hotspot" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n", "parent_kind", "shape") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape"
FROM "qti"."associable_hotspot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot" TO "qti__author";

CREATE VIEW "qti__author"."associable_hotspot_match_min" ("node", "value") AS
SELECT "r1"."node", "r1"."value"
FROM "qti"."associable_hotspot_match_min" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot_match_min" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."associable_hotspot" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."associable_hotspot_match_min" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
