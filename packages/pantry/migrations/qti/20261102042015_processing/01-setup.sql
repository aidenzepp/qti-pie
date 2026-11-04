-- grizzle: no-transaction

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'min' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'max' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'class' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'definition' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'tolerance-mode' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'tolerance' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'include-lower-bound' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'include-upper-bound' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'rounding-mode' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'figures' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'n' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'shape' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'coords' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'name' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'section-identifier' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'include-category' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'exclude-category' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'outcome-identifier' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'weight-identifier' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'pattern' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'step' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'number-repeats' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'case-sensitive' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'substring' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'variable-identifier' BEFORE 'src';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'parse';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'xpointer';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'encoding';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'accept';

ALTER TYPE "qti"."attribute_name" ADD VALUE IF NOT EXISTS 'accept-language';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-and' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-any-n' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-base-value' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-container-size' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-contains' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-correct' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-custom-operator' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-default' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-delete' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-divide' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-duration-gte' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-duration-lt' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-equal' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-equal-rounded' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-field-value' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-gcd' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-gt' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-gte' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-index' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-inside' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-integer-divide' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-integer-modulus' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-integer-to-float' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-is-null' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-lcm' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-lt' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-lte' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-map-response' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-map-response-point' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-match' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-math-constant' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-math-operator' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-max' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-member' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-min' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-multiple' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-not' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-null' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-number-correct' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-number-incorrect' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-number-presented' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-number-responded' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-number-selected' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-or' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-ordered' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-maximum' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-minimum' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-pattern-match' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-power' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-product' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-random' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-random-float' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-random-integer' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-repeat' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-round' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-round-to' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-stats-operator' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-string-match' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-substring' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-subtract' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-sum' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-test-variables' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-truncate' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-variable' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-response-condition' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-response-if' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-response-else-if' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-response-else' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-set-outcome-value' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-lookup-outcome-value' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-exit-response' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-response-processing-fragment' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-processing' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-condition' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-if' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-else-if' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-else' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-exit-test' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-outcome-processing-fragment' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-processing' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-condition' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-if' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-else-if' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-else' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-set-template-value' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-set-default-value' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-set-correct-response' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-template-constraint' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'qti-exit-template' BEFORE 'p';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'xi:include';

ALTER TYPE "qti"."node_kind" ADD VALUE IF NOT EXISTS 'xi:fallback';
