-- grizzle: no-transaction

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:educational' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:interactivityType' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:learningResourceType' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:interactivityLevel' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:semanticDensity' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:intendedEndUserRole' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:context' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:typicalAgeRange' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:difficulty' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:typicalLearningTime' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:classification' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:purpose' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:taxonPath' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:source.langString' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:taxon' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:id' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:entry.langString' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:relation' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:kind' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:resource' BEFORE 'qmd:qtiMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'lom:annotation' BEFORE 'qmd:qtiMetadata';
