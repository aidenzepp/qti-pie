CREATE TYPE "qti"."statistic_kind" AS ENUM ('ordinary', 'categorized');

CREATE TYPE "qti"."target_object_type" AS ENUM ('test', 'testpart', 'section', 'item', 'outcome', 'interaction', 'choice');

CREATE DOMAIN "qti"."__text_gjl5q4ofup" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[0-9]{4}\-(?:0[1-9]|1[0-2])\-(?:0[1-9]|[12][0-9]|3[01])\Z'::text) IS TRUE);
