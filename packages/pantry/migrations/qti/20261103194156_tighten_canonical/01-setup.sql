CREATE DOMAIN "qti"."__text_hv3bw3mdte" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:\-?0[0-9]+|\+[0-9]+|\-0)\Z'::text) IS TRUE);
