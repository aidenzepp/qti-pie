CREATE TYPE "qti"."ref_or_literal" AS ENUM ('literal', 'ref');

CREATE DOMAIN "qti"."__text_celz4obcnh" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('absolute'::text, 'exact'::text, 'relative'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_uc3mvgolsg" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}(?: [A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255})*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_gemmttam7z" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('boolean'::text, 'directedPair'::text, 'duration'::text, 'file'::text, 'float'::text, 'identifier'::text, 'integer'::text, 'pair'::text, 'point'::text, 'string'::text, 'uri'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_hvweswafjf" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('decimalPlaces'::text, 'significantFigures'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_ibaizj6fv3" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('e'::text, 'pi'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_gubl3xpcnx" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:[0-9]+\%?\,){2}(?:(?:[0-9]+\%?\,){2})+[0-9]+\%?\,[0-9]+\%?|(?:[0-9]+\%?\,){2}[0-9]+\%?|(?:[0-9]+\%?\,){3}[0-9]+\%?)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_mmzgy7vcfw" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('mean'::text, 'popSD'::text, 'popVariance'::text, 'sampleSD'::text, 'sampleVariance'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_vtz3bnghkc" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:[\+\-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][\+\-]?[0-9]+)?|\-?INF|[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}|NaN)(?: (?:[\+\-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][\+\-]?[0-9]+)?|\-?INF|[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}|NaN))*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_djykoynpls" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\+\-]?[0-9]+|[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255})\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_u3q4acbjwm" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('abs'::text, 'acos'::text, 'acot'::text, 'acsc'::text, 'asec'::text, 'asin'::text, 'atan'::text, 'atan2'::text, 'ceil'::text, 'cos'::text, 'cosh'::text, 'cot'::text, 'coth'::text, 'csc'::text, 'csch'::text, 'exp'::text, 'floor'::text, 'ln'::text, 'log'::text, 'sec'::text, 'sech'::text, 'signum'::text, 'sin'::text, 'sinh'::text, 'tan'::text, 'tanh'::text, 'toDegrees'::text, 'toRadians'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_2hoxdcszyn" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('circle'::text, 'default'::text, 'ellipse'::text, 'poly'::text, 'rect'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_vwnl4b5fqr" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('text'::text, 'xml'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_wuvwyowttn" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\+\-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][\+\-]?[0-9]+)?|\-?INF|[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}|NaN)\Z'::text) IS TRUE);
