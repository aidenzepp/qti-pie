-- grizzle: no-transaction

ALTER TYPE "qti"."ancestry" ADD VALUE IF NOT EXISTS 'testfb' BEFORE 'fb.modal';

ALTER TYPE "qti"."ancestry" ADD VALUE IF NOT EXISTS 'fb.testfb' BEFORE 'modal.tmpl';

ALTER TYPE "qti"."ancestry" ADD VALUE IF NOT EXISTS 'htx.testfb' BEFORE 'fb.modal.tmpl';

ALTER TYPE "qti"."ancestry" ADD VALUE IF NOT EXISTS 'fb.htx.testfb' BEFORE 'modal.tmpl.htx';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'access';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'allow-comment';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'allow-late-submission';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'allow-review';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'allow-skipping';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'category';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'keep-together';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'max-attempts';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'max-time';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'min-time';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'navigation-mode';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'select';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'show-feedback';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'show-solution';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'source-identifier';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'submission-mode';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'target';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'target-identifier';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'validate-responses';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'visible';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'with-replacement';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-adaptive-selection';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-assessment-item-ref';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-assessment-section';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-assessment-stimulus';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-assessment-test';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-branch-rule';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-pre-condition';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-ordering';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-selection';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-stimulus-body';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-default';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-test-feedback';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-content-body.testFeedback';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-test-part';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-rubric-block.test';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-content-body.testRubric';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-adaptive-engine-ref';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-adaptive-settings-ref';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-usagedata-ref';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-metadata-ref';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-assessment-section-ref';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-assessment-stimulus-ref';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-item-session-control';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-time-limits';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-variable-mapping';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-weight';

ALTER TYPE "qti"."ref_kind" ADD VALUE IF NOT EXISTS 'sectionVariable';
