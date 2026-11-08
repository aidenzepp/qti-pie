# Guard fixtures

Four hand-written items, each derived from `../valid/response.xml` or `../valid/template.xml`. Each is well-formed; `padded-processing.xml` is valid QTI, the other three break one processing rule (`docs/goals/qti/phase-3.md` 4.10), each a law of the document layer now: P5 is AL3, P28 N7's `Last`, P30 N5's `Follow`. `../verdicts.tsv` records each rule; the expression laws accept all four.

| File                            | What it holds                                                                                                                     | Expected                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `padded-processing.xml`         | Campaign decision 19's class witnesses: exactly four attributes whose value as read differs from its `whiteSpace`-processed value | accepted                                                               |
| `missing-identifier.xml`        | a `qti-correct` with no `identifier`                                                                                              | P5: a required attribute absent, refused by the builder before any row |
| `empty-template-processing.xml` | a `qti-template-processing` with no rule (declarations copied from `../valid/template.xml`)                                       | P28                                                                    |
| `else-before-if.xml`            | a `qti-response-condition` whose `qti-response-else` precedes its `qti-response-if`                                               | P30                                                                    |

## padded-processing.xml

Collapse and mixed-union witnesses, each attribute's lexical form kept as written and read by its processed value:

- `qti-correct identifier=" R "`: read as `R`.
- `qti-equal tolerance="0.5  1"` with `tolerance-mode="absolute"`: two spaces collapse to one, read as `0.5 1`.
- `qti-string-match case-sensitive=" true"`: read as `true`.
- `qti-equal-rounded figures=" 3"` with `rounding-mode="significantFigures"`: the mixed union collapses to a number, read as `3`.

Preserve witness (read as written): `qti-pattern-match pattern=" a"`.

Every other value is unpadded. The `replace` class (`coords`) has no valid padded witness, because `CoordsDType` admits no space; its witness is `p3-33`'s refusal.
