DROP POLICY "qti__author" ON "qti"."order_interaction";

DROP VIEW "qti__author"."order_interaction";

CREATE TABLE "qti"."declared_order_shuffle" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_order_shuffle_pk_k3oqlqq4qv" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."declared_order_shuffle" ADD CONSTRAINT "__declared_order_shuffle_fk_node_m2jpcwf6ud" FOREIGN KEY ("node") REFERENCES "qti"."order_interaction" ("id") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_order_shuffle"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."declared_order_shuffle" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_order_shuffle" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_order_shuffle" TO "qti__author";

CREATE VIEW "qti__author"."order_interaction" ("id", "max_bound", "max_choices_n", "min_choices_n", "response_identifier", "root_kind", "shuffle") AS
SELECT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle"
FROM "qti"."order_interaction" AS "r1";

GRANT SELECT ON TABLE "qti__author"."order_interaction" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."declared_order_shuffle" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."order_interaction" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
