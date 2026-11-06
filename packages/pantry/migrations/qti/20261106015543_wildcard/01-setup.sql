-- grizzle: no-transaction

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xml:space' BEFORE 'data-qti-suppress-tts';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xml:id' BEFORE 'data-qti-suppress-tts';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:type';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:href';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:role';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:arcrole';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:title';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:show';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:actuate';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:label';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:from';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xlink:to';

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'xmlId';

ALTER TYPE "qti"."manifest_id_holder" ADD VALUE IF NOT EXISTS 'xmlId';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'foreign';
