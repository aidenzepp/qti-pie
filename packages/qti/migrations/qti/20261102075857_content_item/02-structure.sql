DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."lom_language";

DROP POLICY "qti__author" ON "qti"."lom";

DROP POLICY "qti__author" ON "qti"."assessment_item";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."lom_language";

DROP VIEW "qti__author"."lom";

DROP VIEW "qti__author"."assessment_item";

ALTER TABLE "qti"."assessment_item" ADD COLUMN "tree" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;
ALTER TABLE "qti"."assessment_item" ALTER COLUMN "tree" DROP DEFAULT;

CREATE TABLE "qti"."assessment_item_label" (
  "node" uuid NOT NULL,
  "tree" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "version" "qti"."schema_version" NOT NULL,
  CONSTRAINT "__assessment_item_label_pk_vqcepo52hu" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."item_tool" (
  "shape" "qti"."tool_shape" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_pk_gya4gminyx" PRIMARY KEY ("tree"),
  CONSTRAINT "__item_tool_key_tree_shape_sxpyh5o4hw" UNIQUE ("tree", "shape")
);

CREATE TABLE "qti"."item_tool_both" (
  "tool_name" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tool_version" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_both_pk_nldegtbsdk" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."item_tool_name" (
  "tool_name" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_name_pk_gnib6ywzt6" PRIMARY KEY ("tree")
);

CREATE TABLE "qti"."item_tool_version" (
  "tool_version" "qti"."__text_pftpnuhm3d" NOT NULL,
  "tree" uuid NOT NULL,
  CONSTRAINT "__item_tool_version_pk_45jqniwisg" PRIMARY KEY ("tree")
);

ALTER TABLE "qti"."lom_language" ADD COLUMN "owner" "qti"."lom_owner" DEFAULT 'manifest' NOT NULL;
ALTER TABLE "qti"."lom_language" ALTER COLUMN "owner" DROP DEFAULT;

ALTER TABLE "qti"."item_tool_both" ADD COLUMN "__tag_shape_both_w7wtd5psrj" "qti"."tool_shape" GENERATED ALWAYS AS ('both'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_name" ADD COLUMN "__tag_shape_name_only_ovf2oodbcw" "qti"."tool_shape" GENERATED ALWAYS AS ('nameOnly'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."item_tool_version" ADD COLUMN "__tag_shape_version_only_xss26qzv7y" "qti"."tool_shape" GENERATED ALWAYS AS ('versionOnly'::"qti"."tool_shape") STORED NOT NULL;

ALTER TABLE "qti"."assessment_item" ADD CONSTRAINT "__assessment_item_fk_id_tree_iolxqdwgug" FOREIGN KEY ("id", "tree") REFERENCES "qti"."node" ("id", "tree") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."item_tool_both" ADD CONSTRAINT "__item_tool_both_fk_tree_tag_shape_both_w_7_wtd_5_hro47hekai" FOREIGN KEY ("tree", "__tag_shape_both_w7wtd5psrj") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_name" ADD CONSTRAINT "__item_tool_name_fk_tree_tag_shape_name_only_ovf_2_t3wpm3j4r2" FOREIGN KEY ("tree", "__tag_shape_name_only_ovf2oodbcw") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."item_tool_version" ADD CONSTRAINT "__item_tool_version_fk_tree_tag_shape_version_only_2qxy4xgqmi" FOREIGN KEY ("tree", "__tag_shape_version_only_xss26qzv7y") REFERENCES "qti"."item_tool" ("tree", "shape") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_language" ADD CONSTRAINT "__lom_language_fk_lom_owner_n4lsd3gxmo" FOREIGN KEY ("lom", "owner") REFERENCES "qti"."lom" ("id", "owner") DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."assessment_item_label"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool_both"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool_name"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."item_tool_version"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."assessment_item" ("adaptive", "id", "time_dependent", "tree") AS
SELECT "r1"."adaptive", "r1"."id", "r1"."time_dependent", "r1"."tree"
FROM "qti"."assessment_item" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item" TO "qti__author";

CREATE VIEW "qti__author"."assessment_item_label" ("node", "tree", "value", "version") AS
SELECT "r1"."node", "r1"."tree", "r1"."value", "r1"."version"
FROM "qti"."assessment_item_label" AS "r1";

GRANT SELECT ON TABLE "qti__author"."assessment_item_label" TO "qti__author";

CREATE VIEW "qti__author"."item_tool" ("shape", "tree") AS
SELECT "r1"."shape", "r1"."tree"
FROM "qti"."item_tool" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool" TO "qti__author";

CREATE VIEW "qti__author"."item_tool_both" ("tool_name", "tool_version", "tree") AS
SELECT "r1"."tool_name", "r1"."tool_version", "r1"."tree"
FROM "qti"."item_tool_both" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool_both" TO "qti__author";

CREATE VIEW "qti__author"."item_tool_name" ("tool_name", "tree") AS
SELECT "r1"."tool_name", "r1"."tree"
FROM "qti"."item_tool_name" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool_name" TO "qti__author";

CREATE VIEW "qti__author"."item_tool_version" ("tool_version", "tree") AS
SELECT "r1"."tool_version", "r1"."tree"
FROM "qti"."item_tool_version" AS "r1";

GRANT SELECT ON TABLE "qti__author"."item_tool_version" TO "qti__author";

CREATE VIEW "qti__author"."lom" ("id", "owner", "package") AS
SELECT "r1"."id", "r1"."owner", "r1"."package"
FROM "qti"."lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom" TO "qti__author";

CREATE VIEW "qti__author"."lom_language" ("id", "lom", "owner", "position", "value") AS
SELECT "r1"."id", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value"
FROM "qti"."lom_language" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_language" TO "qti__author";

CREATE VIEW "qti__author"."node" ("ancestry", "id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."assessment_item" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."assessment_item_label" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool_both" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool_name" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."item_tool_version" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_language" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
