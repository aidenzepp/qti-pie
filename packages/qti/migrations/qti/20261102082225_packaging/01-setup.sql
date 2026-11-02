-- grizzle: no-transaction

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'resourceLabel';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'resourcePartId';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'providerId';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'region';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'version';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'glossary';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'caseCount';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'context';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'lastUpdated';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'name';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'stdDeviation';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'stdError';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'objectType';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'partIdentifier';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'baseType';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'fieldIdentifier';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'defaultValue';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'lowerBound';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'upperBound';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'caseSensitive';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'mapKey';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'mappedValue';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:curriculumStandardsMetadataSet';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:curriculumStandardsMetadata';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:setOfGUIDs';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:labelledGUID';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:label';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:caseItemURI';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:GUID';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:usageData';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:ordinaryStatistic';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:categorizedStatistic';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:targetObject';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:value';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:mapping';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:mapEntry';
