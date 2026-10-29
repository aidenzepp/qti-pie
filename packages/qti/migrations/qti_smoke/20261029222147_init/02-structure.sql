CREATE TABLE "qti_smoke"."choice" (
  "identifier" "qti_smoke"."__text_brtrtkmo4t" NOT NULL,
  "item" uuid NOT NULL,
  "text" "qti_smoke"."__text_r77ayjndhc" NOT NULL,
  CONSTRAINT "__choice_pk_lpz37hc34u" PRIMARY KEY ("item", "identifier")
);

CREATE TABLE "qti_smoke"."item" (
  "id" uuid NOT NULL,
  "identifier" "qti_smoke"."__text_brtrtkmo4t" NOT NULL,
  "title" "qti_smoke"."__text_r77ayjndhc" NOT NULL,
  CONSTRAINT "__item_pk_ai4obgmq4k" PRIMARY KEY ("id")
);

ALTER TABLE "qti_smoke"."choice" ADD CONSTRAINT "__choice_fk_item_zg5zap2rmr" FOREIGN KEY ("item") REFERENCES "qti_smoke"."item" ("id") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti_smoke"."choice"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti_smoke"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti_smoke"."item"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti_smoke"."__require_serializable"();
