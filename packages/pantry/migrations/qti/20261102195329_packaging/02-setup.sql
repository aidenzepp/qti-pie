CREATE TYPE "qti"."manifest_id_holder" AS ENUM ('manifest', 'resource', 'variant');

CREATE TYPE "qti"."qti_metadata_host" AS ENUM ('metadata', 'resourceLom', 'externalLom');

CREATE TYPE "qti"."statistic_kind" AS ENUM ('ordinary', 'categorized');

CREATE TYPE "qti"."target_object_type" AS ENUM ('test', 'testpart', 'section', 'item', 'outcome', 'interaction', 'choice');

CREATE DOMAIN "qti"."__text_4adkkv4wal" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[ \.0-9A-Z\_a-z\|]+|e\-book|highContrast|haptic|longDescription|signLanguage|transcript|alternativeText|audioDescription|captions)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_xarz6cej2e" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[ \.0-9A-Z\_a-z\|]+|iAccessible2|AndroidAccessibility|ARIA|AT\-SPI|ATK|BlackberryAccessibility|JavaAccessibility|MSAA|MacOSXAccessibility|UIAutomation)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_4f3dzz6i4f" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[ \.0-9A-Z\_a-z\|]+|itemSize|olfactory|orientation|position|textual|textOnImage|tactile|visual|auditory|colour)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_sa4c4ywp5v" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:enhanced|ext\:[ \.0-9A-Z\_a-z\|]+|realTime|recorded|symbolic|synthesized|verbatim)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_lsy6pxooea" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[ \.0-9A-Z\_a-z\|]+|fullKeyboardControl|fullMouseControl)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_d46tbgbbco" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[ \.0-9A-Z\_a-z\|]+|fontFace|fontSize|fontWeight|foregroundColour|highlightPresentation|letterSpacing|lineHeight|layout|structurePresentation|wordSpacing|backgroundColour|cursorPresentation)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_3zzmpysrx3" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:enriched|ext\:[ \.0-9A-Z\_a-z\|]+|simplified)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_gjl5q4ofup" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[0-9]{4}\-(?:0[1-9]|1[0-2])\-(?:0[1-9]|[12][0-9]|3[01])\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_ukaaxf45sk" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[ \.0-9A-Z\_a-z\|]+|flashing|motionSimulation|olfactoryHazard|sound)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_2rz6hgcvt2" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[ \.0-9A-Z\_a-z\|]+|ChemML|Daisy|EPUB3|LIT|LaTeX|MathML|Nemeth|NIMAS|OEBPS|PDF|braille)\Z'::text) IS TRUE);
