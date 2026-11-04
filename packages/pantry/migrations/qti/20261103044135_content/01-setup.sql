-- grizzle: no-transaction

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'htmlId';

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'itemBody';

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'printedVariable';

ALTER TYPE "qti"."id_holder" ADD VALUE IF NOT EXISTS 'contextDeclaration';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-area-map-entry' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-area-mapping' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-associable-hotspot' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-associate-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-catalog-info' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-companion-materials-info' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-content-body.feedback' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-content-body.modal' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-content-body.rubric' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-content-body.rubricTemplate' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-content-body.template' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-context-declaration' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-drawing-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-end-attempt-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-extended-text-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-feedback-block' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-feedback-block.template' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-feedback-inline' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-gap' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-gap-img' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-gap-match-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-gap-text' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-graphic-associate-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-graphic-gap-match-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-graphic-order-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-hotspot-choice' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-hotspot-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-hottext' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-hottext-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-inline-choice' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-inline-choice-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-interpolation-table' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-interpolation-table-entry' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-label' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-map-entry' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-mapping' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-match-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-match-table' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-match-table-entry' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-media-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-modal-feedback' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-order-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-position-object-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-position-object-stage' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-printed-variable' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-rubric-block' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-select-point-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-simple-associable-choice' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-simple-match-set' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-slider-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-stylesheet' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-block' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-block.rubric' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-declaration' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-inline' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-inline.rubric' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-text-entry-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-upload-interaction' BEFORE 'qti-and';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'a' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'abbr' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'acronym' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'address' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'article' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'aside' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'audio' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'b' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'bdi' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'bdo' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'big' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'blockquote' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'br' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'caption' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'cite' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'code' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'col' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'colgroup' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'dd' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'details' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'dfn' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'div' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'dl' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'dt' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'em' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'figcaption' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'figure' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'footer' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'h1' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'h2' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'h3' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'h4' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'h5' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'h6' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'header' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'hr' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'i' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'kbd' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'label' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'li' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'nav' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'object' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ol' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'param' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'picture' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'pre' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'q' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'rb' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'rp' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'rt' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'rtc' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ruby' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'samp' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'section' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'small' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'source' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'span' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'strong' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'sub' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'summary' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'sup' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'table' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'tbody' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'td' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'template' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'tfoot' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'th' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'thead' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'tr' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'track' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'tt' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'ul' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'var' BEFORE 'cp:manifest';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'video' BEFORE 'cp:manifest';
