-- grizzle: no-transaction

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'resourceLabel' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'resourcePartId' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'providerId' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'region' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'version' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'glossary' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'caseCount' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'context' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'lastUpdated' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'stdDeviation' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'stdError' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'objectType' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'partIdentifier' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'baseType' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'fieldIdentifier' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'defaultValue' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'lowerBound' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'upperBound' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'caseSensitive' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'mapKey' BEFORE 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'mappedValue' BEFORE 'parse';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'cp:metadata.file' BEFORE 'lom:lom';

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

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'cpx:variant' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'cpx:metadata' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:accessForAllResource' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:accessMode' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:accessModeAdapted' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:adaptationType' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:atInteroperable' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:controlFlexibility' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:displayTransformability' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:educationalComplexityOfAdaptation' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:hasAdaptation' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:hazard' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:isAdaptationOf' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:languageOfAdaptation' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:adaptationDetail' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:adaptationMediaType' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:apiInteroperable' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:educationalLevelOfAdaptation' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:isFullAdaptationOf' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'drd:isPartialAdaptationOf' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:curriculumStandardsMetadataSet' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:curriculumStandardsMetadata' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:setOfGUIDs' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:labelledGUID' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:label' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:caseItemURI' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'csmd:GUID' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:usageData' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:ordinaryStatistic' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:categorizedStatistic' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:targetObject' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:value' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:mapping' BEFORE 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ud:mapEntry' BEFORE 'xi:include';

ALTER TYPE "qti"."root_kind" ADD VALUE IF NOT EXISTS 'externalLom';
