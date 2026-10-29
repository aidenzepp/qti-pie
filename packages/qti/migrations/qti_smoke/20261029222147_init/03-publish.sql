CREATE ROLE "qti_smoke__author" NOLOGIN;

CREATE ROLE "qti_smoke__author_app" LOGIN NOINHERIT;

CREATE SCHEMA "qti_smoke__author";

CREATE VIEW "qti_smoke__author"."choice" ("identifier", "item", "text") AS
SELECT "r1"."identifier", "r1"."item", "r1"."text"
FROM "qti_smoke"."choice" AS "r1";

CREATE VIEW "qti_smoke__author"."item" ("id", "identifier", "title") AS
SELECT "r1"."id", "r1"."identifier", "r1"."title"
FROM "qti_smoke"."item" AS "r1";

CREATE POLICY "qti_smoke__author" ON "qti_smoke"."choice" AS PERMISSIVE FOR ALL TO "qti_smoke__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti_smoke__author" ON "qti_smoke"."item" AS PERMISSIVE FOR ALL TO "qti_smoke__author"
  USING (true)
  WITH CHECK (true);

GRANT "qti_smoke__author" TO "qti_smoke__author_app" WITH INHERIT FALSE, SET TRUE;

GRANT USAGE ON SCHEMA "qti_smoke", "qti_smoke__author" TO "qti_smoke__author";

GRANT USAGE ON DOMAIN "qti_smoke"."__text_r77ayjndhc", "qti_smoke"."__text_brtrtkmo4t" TO "qti_smoke__author";

GRANT SELECT ON TABLE "qti_smoke__author"."choice", "qti_smoke__author"."item" TO "qti_smoke__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti_smoke"."choice" TO "qti_smoke__author";

GRANT SELECT, INSERT, DELETE ON TABLE "qti_smoke"."item" TO "qti_smoke__author";

GRANT EXECUTE ON FUNCTION "qti_smoke"."__refuse"(text, text, text) TO "qti_smoke__author";

GRANT USAGE ON SCHEMA "qti_smoke" TO "qti_smoke__author_app";

GRANT EXECUTE ON FUNCTION "qti_smoke"."__snapshot_guard"(text) TO "qti_smoke__author_app";

GRANT SELECT ON TABLE "qti_smoke"."__ledger" TO "qti_smoke__author_app";

ALTER ROLE "qti_smoke__author_app" SET jit = 'off';

ALTER ROLE "qti_smoke__author_app" SET extra_float_digits = '1';

ALTER ROLE "qti_smoke__author_app" SET lc_monetary = 'C.UTF-8';

ALTER ROLE "qti_smoke__author_app" SET lc_numeric = 'C.UTF-8';

ALTER ROLE "qti_smoke__author_app" SET lc_time = 'C.UTF-8';

ALTER ROLE "qti_smoke__author_app" SET lc_messages = 'C.UTF-8';

REVOKE ALL ON SCHEMA "qti_smoke", "qti_smoke__author" FROM PUBLIC;

REVOKE ALL ON TABLE "qti_smoke"."choice", "qti_smoke"."item", "qti_smoke__author"."choice", "qti_smoke__author"."item" FROM PUBLIC;

REVOKE ALL ON DOMAIN "qti_smoke"."__text_brtrtkmo4t", "qti_smoke"."__text_r77ayjndhc" FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti_smoke" REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "qti_smoke" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC;

COMMENT ON DOMAIN "qti_smoke"."__text_r77ayjndhc" IS 'text pattern 44d236a00457661138f4e300a633222b92fa96d1fd597c1b7408beca8b8c6ba8';

COMMENT ON DOMAIN "qti_smoke"."__text_brtrtkmo4t" IS 'text pattern 99d381d7b98c0bfb4dd05fc885fd024ed845ee22aacb53413abdd32af3576c78';

COMMENT ON CONSTRAINT "__choice_pk_lpz37hc34u" ON "qti_smoke"."choice" IS 'primary key of Choice';

COMMENT ON CONSTRAINT "__item_pk_ai4obgmq4k" ON "qti_smoke"."item" IS 'primary key of Item';

COMMENT ON CONSTRAINT "__choice_fk_item_zg5zap2rmr" ON "qti_smoke"."choice" IS 'foreign key Choice(item) to Item(id)';
