DROP POLICY "qti__author" ON "qti"."interaction_binding";

DROP VIEW "qti__author"."interaction_binding";

ALTER TABLE "qti"."interaction_binding"
  DROP CONSTRAINT "adaptive_feedback",
  ADD CONSTRAINT "adaptive_feedback" CHECK ((NOT "ancestry" IN ('fb'::"qti"."ancestry", 'fb.modal'::"qti"."ancestry", 'fb.rubric'::"qti"."ancestry", 'fb.tmpl'::"qti"."ancestry", 'fb.int'::"qti"."ancestry", 'fb.htx'::"qti"."ancestry", 'fb.modal.tmpl'::"qti"."ancestry", 'fb.modal.htx'::"qti"."ancestry", 'fb.rubric.tmpl'::"qti"."ancestry", 'fb.rubric.htx'::"qti"."ancestry", 'fb.tmpl.int'::"qti"."ancestry", 'fb.tmpl.htx'::"qti"."ancestry", 'fb.int.gap'::"qti"."ancestry", 'fb.int.choice'::"qti"."ancestry", 'fb.int.htx'::"qti"."ancestry", 'fb.modal.tmpl.htx'::"qti"."ancestry", 'fb.rubric.tmpl.htx'::"qti"."ancestry", 'fb.tmpl.int.gap'::"qti"."ancestry", 'fb.tmpl.int.choice'::"qti"."ancestry", 'fb.tmpl.int.htx'::"qti"."ancestry", 'fb.int.gap.choice'::"qti"."ancestry", 'fb.int.gap.htx'::"qti"."ancestry", 'fb.int.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice'::"qti"."ancestry", 'fb.tmpl.int.gap.htx'::"qti"."ancestry", 'fb.tmpl.int.choice.htx'::"qti"."ancestry", 'fb.int.gap.choice.htx'::"qti"."ancestry", 'fb.tmpl.int.gap.choice.htx'::"qti"."ancestry") OR "adaptive" IN ('true'::text, '1'::text)) IS TRUE) NOT VALID;

CREATE VIEW "qti__author"."interaction_binding" ("adaptive", "ancestry", "document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."adaptive", "r1"."ancestry", "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."interaction_binding" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
