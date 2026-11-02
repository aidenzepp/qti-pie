-- grizzle: no-transaction

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'cpx:variant';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'cpx:metadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:accessForAllResource';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:accessMode';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:accessModeAdapted';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:adaptationType';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:atInteroperable';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:controlFlexibility';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:displayTransformability';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:educationalComplexityOfAdaptation';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:hasAdaptation';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:hazard';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:isAdaptationOf';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:languageOfAdaptation';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:adaptationDetail';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:adaptationMediaType';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:apiInteroperable';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:educationalLevelOfAdaptation';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:isFullAdaptationOf';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:isPartialAdaptationOf';
