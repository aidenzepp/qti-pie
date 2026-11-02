-- grizzle: no-transaction

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'cp:metadata.file' BEFORE 'lom:lom';

ALTER TYPE "qti"."root_kind" ADD VALUE IF NOT EXISTS 'externalLom';
