# Valid processing fixtures

Four hand-written trees that together use every M3 kind: table A's 64 expression kinds, table B's 26 rule and processing kinds (`qti-response-processing` included), `xi:include` and `xi:fallback` (`docs/goals/qti/phase-3.md` 3.3). No corpus bytes are copied. `response.xml`, `outcome.xml` and `template.xml` validate against `imsqti_asiv3p0p1_v1p0.xsd`; `response-mapped.xml` validates except `qti-match-table-entry/@target-value`, which the XSD wrongly restricts to base-type names (GOAL.md open question 4.1 settles it as a value of the outcome's base-type).

Below, per file, the M3 kinds it carries (the census `p3-11` asserts), then the kinds of the union.

## response.xml

An item over `simple`'s declarations and body kinds, importable on M0 plus M3: every expression kind that needs no mapping, no lookup table and not the outcome language, a response condition with `if`, two `else-if` and an `else`, `qti-exit-response`, a fragment and an `xi:include` whose `xi:fallback` holds the text `fallback`.

64 kinds:

`qti-and` `qti-any-n` `qti-base-value` `qti-container-size` `qti-contains` `qti-correct` `qti-custom-operator` `qti-default` `qti-delete` `qti-divide` `qti-duration-gte` `qti-duration-lt` `qti-equal` `qti-equal-rounded` `qti-exit-response` `qti-field-value` `qti-gcd` `qti-gt` `qti-gte` `qti-index` `qti-inside` `qti-integer-divide` `qti-integer-modulus` `qti-integer-to-float` `qti-is-null` `qti-lcm` `qti-lt` `qti-lte` `qti-match` `qti-math-constant` `qti-math-operator` `qti-max` `qti-member` `qti-min` `qti-multiple` `qti-not` `qti-null` `qti-or` `qti-ordered` `qti-pattern-match` `qti-power` `qti-product` `qti-random` `qti-random-float` `qti-random-integer` `qti-repeat` `qti-response-condition` `qti-response-else` `qti-response-else-if` `qti-response-if` `qti-response-processing` `qti-response-processing-fragment` `qti-round` `qti-round-to` `qti-set-outcome-value` `qti-stats-operator` `qti-string-match` `qti-substring` `qti-subtract` `qti-sum` `qti-truncate` `qti-variable` `xi:fallback` `xi:include`

## response-mapped.xml

An item whose declarations carry `qti-mapping`, `qti-area-mapping`, `qti-match-table` and `qti-interpolation-table`; processing uses `qti-map-response`, `qti-map-response-point` and `qti-lookup-outcome-value`.

8 kinds:

`qti-lookup-outcome-value` `qti-map-response` `qti-map-response-point` `qti-response-processing` `qti-round` `qti-set-outcome-value` `qti-sum` `qti-variable`

## outcome.xml

A bare `qti-outcome-processing` root (no item) with the eight outcome-only expressions, an outcome condition, `qti-exit-test` and a fragment. Typed under a test environment holding `TOTAL` and `MAXTOTAL` (float single), `COUNT` (integer single) and `PASSED` (boolean single).

22 kinds:

`qti-base-value` `qti-exit-test` `qti-gte` `qti-lt` `qti-min` `qti-number-correct` `qti-number-incorrect` `qti-number-presented` `qti-number-responded` `qti-number-selected` `qti-outcome-condition` `qti-outcome-else` `qti-outcome-else-if` `qti-outcome-if` `qti-outcome-maximum` `qti-outcome-minimum` `qti-outcome-processing` `qti-outcome-processing-fragment` `qti-set-outcome-value` `qti-sum` `qti-test-variables` `qti-variable`

## template.xml

An item with template and context declarations (one `param-variable`) and template processing: a template condition, a constraint, a `qti-random-integer` with `max="N"`, `qti-set-template-value`, `qti-set-default-value`, `qti-set-correct-response` and `qti-exit-template`.

19 kinds:

`qti-base-value` `qti-context-declaration` `qti-exit-template` `qti-gt` `qti-integer-to-float` `qti-is-null` `qti-random-integer` `qti-set-correct-response` `qti-set-default-value` `qti-set-template-value` `qti-sum` `qti-template-condition` `qti-template-constraint` `qti-template-declaration` `qti-template-else` `qti-template-else-if` `qti-template-if` `qti-template-processing` `qti-variable`

## Union

92 of 92 required kinds (64 expression, 26 rule and processing, `xi:include`, `xi:fallback`).
