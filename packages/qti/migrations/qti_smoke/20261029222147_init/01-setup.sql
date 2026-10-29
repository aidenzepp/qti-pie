DO $$BEGIN PERFORM pg_catalog.pg_advisory_xact_lock(7385900293::int8); EXECUTE format('ALTER DATABASE %I SET default_transaction_isolation = %L'::text, current_database(), 'serializable'::text); END$$;

CREATE SCHEMA "qti_smoke";

CREATE DOMAIN "qti_smoke"."__text_r77ayjndhc" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0001-\U0010FFFF]{1,200}\Z'::text) IS TRUE);

CREATE DOMAIN "qti_smoke"."__text_brtrtkmo4t" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[A-Z\_a-z][\-\.0-9A-Z\_a-z]{0,63}\Z'::text) IS TRUE);

CREATE OR REPLACE FUNCTION "qti_smoke"."__refuse"("state" text, "constraint_name" text, "detail" text) RETURNS boolean
LANGUAGE plpgsql VOLATILE PARALLEL SAFE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
BEGIN
  RAISE EXCEPTION 'grizzle refused the statement'
    USING ERRCODE = "state",
          CONSTRAINT = "constraint_name",
          DETAIL = "detail";
END
$$;

REVOKE EXECUTE ON FUNCTION "qti_smoke"."__refuse"(text, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti_smoke"."__require_serializable"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
BEGIN
  IF current_setting('transaction_isolation'::text) <> 'serializable'::text THEN
    RAISE EXCEPTION 'a write to a grizzle table requires SERIALIZABLE'
      USING ERRCODE = 'invalid_transaction_state'::text,
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            HINT = 'write at SERIALIZABLE'::text;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti_smoke"."__require_serializable"() FROM PUBLIC;

CREATE TABLE "qti_smoke"."__ledger" (
  "folder" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "ordinal" integer NOT NULL,
  "file" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "source" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "target" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  "files" integer NOT NULL,
  "digest" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__ledger_pk" PRIMARY KEY ("folder", "ordinal"),
  CONSTRAINT "__ledger_ordinal_check" CHECK (("ordinal" >= 0) IS TRUE),
  CONSTRAINT "__ledger_files_check" CHECK (("files" >= 0) IS TRUE)
);

REVOKE ALL ON TABLE "qti_smoke"."__ledger" FROM PUBLIC;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti_smoke"."__ledger"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti_smoke"."__require_serializable"();

CREATE OR REPLACE FUNCTION "qti_smoke"."__snapshot_guard"("fingerprint" text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "qti_smoke"."__ledger" AS "r1" WHERE "r1"."ordinal" = 0 AND "r1"."files" <> (SELECT count(*) FROM "qti_smoke"."__ledger" AS "r2" WHERE "r2"."folder" = "r1"."folder" AND "r2"."ordinal" <> 0)) THEN
    RAISE EXCEPTION 'a grizzle migration of this schema is running or stopped part-way'
      USING ERRCODE = '55Z02'::text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "qti_smoke"."__ledger" AS "r3" WHERE "r3"."ordinal" = 0 AND "r3"."target" = "fingerprint" AND NOT EXISTS (SELECT 1 FROM "qti_smoke"."__ledger" AS "r4" WHERE "r4"."ordinal" = 0 AND "r4"."folder" > "r3"."folder")) THEN
    RAISE EXCEPTION 'the latest grizzle migration of this schema is not the snapshot of this Db'
      USING ERRCODE = '55Z01'::text;
  END IF;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti_smoke"."__snapshot_guard"(text) FROM PUBLIC;
