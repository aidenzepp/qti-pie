DROP POLICY "qti__author" ON "qti"."lom_value";

DROP VIEW "qti__author"."lom_value";

ALTER TABLE "qti"."lom_value" ADD COLUMN "parent_kind" "qti"."node_kind" DEFAULT 'lom:status'::"qti"."node_kind" NOT NULL;
ALTER TABLE "qti"."lom_value" ALTER COLUMN "parent_kind" DROP DEFAULT;

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."lom_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
