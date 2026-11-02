DROP POLICY "qti__author" ON "qti"."inline_choice";

DROP POLICY "qti__author" ON "qti"."hottext_owner";

DROP POLICY "qti__author" ON "qti"."hottext";

DROP POLICY "qti__author" ON "qti"."hotspot_choice";

DROP POLICY "qti__author" ON "qti"."gap_text";

DROP POLICY "qti__author" ON "qti"."gap_img";

DROP POLICY "qti__author" ON "qti"."gap";

DROP POLICY "qti__author" ON "qti"."associable_hotspot";

DROP VIEW "qti__author"."inline_choice";

DROP VIEW "qti__author"."hottext_owner";

DROP VIEW "qti__author"."hottext";

DROP VIEW "qti__author"."hotspot_choice";

DROP VIEW "qti__author"."gap_text";

DROP VIEW "qti__author"."gap_img";

DROP VIEW "qti__author"."gap";

DROP VIEW "qti__author"."associable_hotspot";

ALTER TABLE "qti"."associable_hotspot" ADD COLUMN "show_hide" "qti"."__text_i67gmkzdk7" DEFAULT 'show' NOT NULL;
ALTER TABLE "qti"."associable_hotspot" ALTER COLUMN "show_hide" DROP DEFAULT;

CREATE TABLE "qti"."declared_associable_hotspot_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_associable_hotspot_show_hide_pk_lv5px2ljkx" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_img_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_img_show_hide_pk_rnyjq43x4l" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_show_hide_pk_7ijnzmslzd" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_gap_text_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_gap_text_show_hide_pk_iglqx3fd3k" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hotspot_choice_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hotspot_choice_show_hide_pk_hds765eicl" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_hottext_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_hottext_show_hide_pk_3zlccbyr75" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."declared_inline_choice_show_hide" (
  "node" uuid NOT NULL,
  CONSTRAINT "__declared_inline_choice_show_hide_pk_djhoznfi2b" PRIMARY KEY ("node")
);

ALTER TABLE "qti"."gap" ADD COLUMN "show_hide" "qti"."__text_i67gmkzdk7" DEFAULT 'show' NOT NULL;
ALTER TABLE "qti"."gap" ALTER COLUMN "show_hide" DROP DEFAULT;

ALTER TABLE "qti"."gap_img" ADD COLUMN "show_hide" "qti"."__text_i67gmkzdk7" DEFAULT 'show' NOT NULL;
ALTER TABLE "qti"."gap_img" ALTER COLUMN "show_hide" DROP DEFAULT;

ALTER TABLE "qti"."gap_text" ADD COLUMN "show_hide" "qti"."__text_i67gmkzdk7" DEFAULT 'show' NOT NULL;
ALTER TABLE "qti"."gap_text" ALTER COLUMN "show_hide" DROP DEFAULT;

ALTER TABLE "qti"."hotspot_choice" ADD COLUMN "show_hide" "qti"."__text_i67gmkzdk7" DEFAULT 'show' NOT NULL;
ALTER TABLE "qti"."hotspot_choice" ALTER COLUMN "show_hide" DROP DEFAULT;

ALTER TABLE "qti"."hottext" ADD COLUMN "show_hide" "qti"."__text_i67gmkzdk7" DEFAULT 'show' NOT NULL;
ALTER TABLE "qti"."hottext" ALTER COLUMN "show_hide" DROP DEFAULT;

ALTER TABLE "qti"."inline_choice" ADD COLUMN "show_hide" "qti"."__text_i67gmkzdk7" DEFAULT 'show' NOT NULL;
ALTER TABLE "qti"."inline_choice" ALTER COLUMN "show_hide" DROP DEFAULT;

ALTER TABLE "qti"."declared_associable_hotspot_show_hide" ADD CONSTRAINT "__declared_associable_hotspot_show_hide_fk_node_lb6mfj3ep3" FOREIGN KEY ("node") REFERENCES "qti"."associable_hotspot" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_img_show_hide" ADD CONSTRAINT "__declared_gap_img_show_hide_fk_node_cefuh7fnws" FOREIGN KEY ("node") REFERENCES "qti"."gap_img" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_show_hide" ADD CONSTRAINT "__declared_gap_show_hide_fk_node_55ztek7idw" FOREIGN KEY ("node") REFERENCES "qti"."gap" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_gap_text_show_hide" ADD CONSTRAINT "__declared_gap_text_show_hide_fk_node_63pbqwqbg3" FOREIGN KEY ("node") REFERENCES "qti"."gap_text" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hotspot_choice_show_hide" ADD CONSTRAINT "__declared_hotspot_choice_show_hide_fk_node_u5faanpqjc" FOREIGN KEY ("node") REFERENCES "qti"."hotspot_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_hottext_show_hide" ADD CONSTRAINT "__declared_hottext_show_hide_fk_node_hw32ph4vhn" FOREIGN KEY ("node") REFERENCES "qti"."hottext" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."declared_inline_choice_show_hide" ADD CONSTRAINT "__declared_inline_choice_show_hide_fk_node_5z2sw4vu2g" FOREIGN KEY ("node") REFERENCES "qti"."inline_choice" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."hottext_owner" DROP CONSTRAINT "__hottext_owner_fk_node_identifier_czroxsucmu";

ALTER TABLE "qti"."hottext_owner" ADD CONSTRAINT "__hottext_owner_fk_node_identifier_czroxsucmu" FOREIGN KEY ("node", "identifier") REFERENCES "qti"."hottext" ("id", "identifier") DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_associable_hotspot_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_img_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_gap_text_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hotspot_choice_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_hottext_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."declared_inline_choice_show_hide"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."associable_hotspot" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n", "parent_kind", "shape", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape", "r1"."show_hide"
FROM "qti"."associable_hotspot" AS "r1";

GRANT SELECT ON TABLE "qti__author"."associable_hotspot" TO "qti__author";

CREATE VIEW "qti__author"."declared_associable_hotspot_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_associable_hotspot_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_associable_hotspot_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_img_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_img_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_img_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_gap_text_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_gap_text_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_gap_text_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_hotspot_choice_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hotspot_choice_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hotspot_choice_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_hottext_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_hottext_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_hottext_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."declared_inline_choice_show_hide" ("node") AS
SELECT "r1"."node"
FROM "qti"."declared_inline_choice_show_hide" AS "r1";

GRANT SELECT ON TABLE "qti__author"."declared_inline_choice_show_hide" TO "qti__author";

CREATE VIEW "qti__author"."gap" ("id", "identifier", "interaction", "required", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."required", "r1"."show_hide"
FROM "qti"."gap" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap" TO "qti__author";

CREATE VIEW "qti__author"."gap_img" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."show_hide"
FROM "qti"."gap_img" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_img" TO "qti__author";

CREATE VIEW "qti__author"."gap_text" ("id", "identifier", "interaction", "match_max", "match_max_n", "match_min_n", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."show_hide"
FROM "qti"."gap_text" AS "r1";

GRANT SELECT ON TABLE "qti__author"."gap_text" TO "qti__author";

CREATE VIEW "qti__author"."hotspot_choice" ("id", "identifier", "interaction", "shape", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."shape", "r1"."show_hide"
FROM "qti"."hotspot_choice" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hotspot_choice" TO "qti__author";

CREATE VIEW "qti__author"."hottext" ("id", "identifier", "show_hide") AS
SELECT "r1"."id", "r1"."identifier", "r1"."show_hide"
FROM "qti"."hottext" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext" TO "qti__author";

CREATE VIEW "qti__author"."hottext_owner" ("identifier", "interaction", "node") AS
SELECT "r1"."identifier", "r1"."interaction", "r1"."node"
FROM "qti"."hottext_owner" AS "r1";

GRANT SELECT ON TABLE "qti__author"."hottext_owner" TO "qti__author";

CREATE VIEW "qti__author"."inline_choice" ("fixed", "id", "identifier", "interaction", "show_hide") AS
SELECT "r1"."fixed", "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."show_hide"
FROM "qti"."inline_choice" AS "r1";

GRANT SELECT ON TABLE "qti__author"."inline_choice" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."associable_hotspot" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_associable_hotspot_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_img_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_gap_text_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hotspot_choice_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_hottext_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."declared_inline_choice_show_hide" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_img" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."gap_text" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hotspot_choice" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."hottext_owner" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."inline_choice" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
