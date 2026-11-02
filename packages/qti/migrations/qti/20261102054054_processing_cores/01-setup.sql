-- grizzle: no-transaction

ALTER TYPE "qti"."ref_kind" ADD VALUE IF NOT EXISTS 'templateParameter';
