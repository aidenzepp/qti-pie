-- grizzle: no-transaction

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'htmlId';

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'itemBody';

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'printedVariable';

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'contextDeclaration';
