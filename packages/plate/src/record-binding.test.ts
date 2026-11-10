import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { readSource } from "#plate/document/read.ts";
import type { SourceElement } from "#plate/document/source.ts";
import {
  checkResponses,
  configure,
  decode,
  entryName,
  open,
  partition,
  postings,
  redact,
  render,
  restore,
  results,
  score,
} from "#plate/index.ts";
import type {
  Accepted,
  Element,
  Entry,
  Node,
  RecordValue,
  Rendered,
  ResponseValue,
  StoredRecord,
} from "#plate/index.ts";
import { attribute } from "#plate/test/accessibility.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The instance token every render here passes, as an author with a stable token would.
 */
const instance = "measure";

/**
 * A hand-built item whose Text Entry is bound to the record response `NUMBER`, which declares no
 * default and no correct response, and whose response processing sets the float `SCORE` to the
 * record's `floatValue` field.
 */
const measuredXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="measured"',
  ' title="Measured" adaptive="false" time-dependent="false" xml:lang="en">',
  '<qti-response-declaration identifier="NUMBER" cardinality="record"/>',
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
  "<qti-default-value><qti-value>0</qti-value></qti-default-value>",
  "</qti-outcome-declaration>",
  "<qti-item-body><p>The length in metres is ",
  '<qti-text-entry-interaction response-identifier="NUMBER"/>.</p></qti-item-body>',
  "<qti-response-processing>",
  '<qti-set-outcome-value identifier="SCORE">',
  '<qti-field-value field-identifier="floatValue"><qti-variable identifier="NUMBER"/></qti-field-value>',
  "</qti-set-outcome-value>",
  "</qti-response-processing>",
  "</qti-assessment-item>",
].join("");

/**
 * The text the candidate types: a number with a space on each side and a trailing zero, which a
 * record keeps as typed and reads as two decimal places and three significant figures.
 */
const typed = " 1.50 ";

/**
 * Open the hand-built item as a host opens a document it read from storage, and require an
 * accepting verdict.
 *
 * @returns The accepted item.
 */
const openMeasured = Effect.fnUntraced(function* openMeasured() {
  const verdict = yield* open("items/measured.xml", new TextEncoder().encode(measuredXml));

  return Option.getOrElse(acceptedItem(verdict), (): Accepted =>
    assert.fail(`the item is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Require a result to succeed.
 *
 * @param result The result.
 * @param what What gave it, for a failure's message.
 * @returns Its success.
 */
const ok = <A, E>(result: Result.Result<A, E>, what: string): A =>
  Result.getOrElse(result, (failure) => assert.fail(`${what} failed: ${String(failure)}`));

/**
 * List the elements of a tree in document order, each before its descendants.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsIn = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsIn(node.children)] : []));

/**
 * Give the Controls a render holds for `NUMBER`, the elements that post under its entry name.
 *
 * @param rendered The render.
 * @returns The Controls, in the order the HTML emits them.
 */
const numberControls = (rendered: Rendered): readonly Element[] =>
  elementsIn(parseHtml(rendered.html)).filter(
    (element) => attribute(element, "name") === entryName(instance, "NUMBER"),
  );

/**
 * Give a record's fields by identifier, so two records compare without their field order, which a
 * record does not count.
 *
 * @param record The record.
 * @returns Each field's value, by its identifier.
 */
const fieldsOf = <V>(record: {
  readonly fields: readonly { readonly identifier: string; readonly value: V }[];
}): Readonly<Record<string, V>> =>
  Object.fromEntries(record.fields.map((field) => [field.identifier, field.value]));

/**
 * Give an element's children of one local name, in any namespace.
 *
 * @param element The element.
 * @param local The children's local name.
 * @returns Those children, in order.
 */
const childrenCalled = (element: SourceElement, local: string): readonly SourceElement[] =>
  element.children.flatMap((child) =>
    child.kind === "element" && child.local === local ? [child] : [],
  );

/**
 * Give an element's attributes in no namespace, by name.
 *
 * @param element The element.
 * @returns Its unprefixed attributes.
 */
const attributesIn = (element: SourceElement): Readonly<Record<string, string>> =>
  Object.fromEntries(
    element.attributes.flatMap((entry) =>
      entry.namespace === "" ? [[entry.local, entry.value] as const] : [],
    ),
  );

/**
 * Read one variable of the item result a results document holds for `measured`.
 *
 * @param xml The results document's text.
 * @param kind The variable's element, `responseVariable` or `outcomeVariable`.
 * @param identifier The variable's identifier.
 * @returns The variable's attributes, and each `value` of its candidate response or its outcome as
 *   its attributes and its text, ordered by field identifier.
 */
const variableIn = Effect.fnUntraced(function* variableIn(
  xml: string,
  kind: "outcomeVariable" | "responseVariable",
  identifier: string,
) {
  const { root } = yield* readSource("result.xml", new TextEncoder().encode(xml));
  const variable =
    childrenCalled(root, "itemResult")
      .filter((result) => attributesIn(result)["identifier"] === "measured")
      .flatMap((result) => childrenCalled(result, kind))
      .find((entry) => attributesIn(entry)["identifier"] === identifier) ??
    assert.fail(`the item result holds no ${kind} ${identifier}`);
  const holders =
    kind === "responseVariable" ? childrenCalled(variable, "candidateResponse") : [variable];
  const values = holders
    .flatMap((holder) => childrenCalled(holder, "value"))
    .map(
      (value) =>
        [
          attributesIn(value),
          value.children.map((child) => (child.kind === "text" ? child.text : "")).join(""),
        ] as const,
    )
    .toSorted(([left], [right]) =>
      (left["fieldIdentifier"] ?? "").localeCompare(right["fieldIdentifier"] ?? ""),
    );

  return { attributes: attributesIn(variable), values };
});

/**
 * The fields `decode` gives a record binding for the typed text, each its single: the text as
 * typed, and the number it reads as with its digit counts. It has no `integerValue`, since it has
 * fractional digits, and no `exponent`.
 */
const typedFields: RecordValue["fields"] = [
  { identifier: "stringValue", value: { baseType: "string", value: typed } },
  { identifier: "floatValue", value: { baseType: "float", value: 1.5 } },
  { identifier: "leftDigits", value: { baseType: "integer", value: 1n } },
  { identifier: "rightDigits", value: { baseType: "integer", value: 2n } },
  { identifier: "ndp", value: { baseType: "integer", value: 2n } },
  { identifier: "nsf", value: { baseType: "integer", value: 3n } },
];

/**
 * The same fields as the stored record writes them: each integer as its decimal digits.
 */
const storedFields: StoredRecord["records"][string]["fields"] = [
  { identifier: "stringValue", value: { baseType: "string", value: typed } },
  { identifier: "floatValue", value: { baseType: "float", value: 1.5 } },
  { identifier: "leftDigits", value: { baseType: "integer", value: "1" } },
  { identifier: "rightDigits", value: { baseType: "integer", value: "2" } },
  { identifier: "ndp", value: { baseType: "integer", value: "2" } },
  { identifier: "nsf", value: { baseType: "integer", value: "3" } },
];

describe("a record answer from post to results", () => {
  it.effect(
    "[Q-20] posts a record answer end to end: the Text Entry shows the string control, the post decodes to its fields, SCORE takes its floatValue, the stored record and the control shown again keep the text as typed, and results write each field",
    () =>
      Effect.gen(function* postsRecordAnswer() {
        const configuration = yield* configure({});
        const accepted = yield* openMeasured();
        const redacted = redact(accepted);

        assert.deepStrictEqual(accepted.item.unsupported, []);
        assert.deepStrictEqual(redacted.notices, []);

        const first = numberControls(
          ok(render(redacted, configuration, { instance }), "the first render"),
        );
        assert.deepStrictEqual(
          first.map((control) => [control.tag, attribute(control, "type")]),
          [["input", "text"]],
        );

        const entries: readonly Entry[] = [[entryName(instance, "NUMBER"), typed]];
        const { own } = partition(entries, instance);
        const posts = postings(redacted, instance);
        assert.deepStrictEqual(
          posts.map(({ binding, identifier }) => [identifier, binding.cardinality]),
          [["NUMBER", "record"]],
        );

        const responses: Readonly<Record<string, ResponseValue>> = Object.fromEntries(
          posts.map(({ binding, identifier, options }) => [
            identifier,
            ok(decode(own, binding, options), `decoding ${identifier}`),
          ]),
        );
        const posted = responses["NUMBER"];
        const decoded =
          posted?.cardinality === "record"
            ? posted
            : assert.fail("the post does not decode NUMBER to a record");
        assert.deepStrictEqual(fieldsOf(decoded), fieldsOf({ fields: typedFields }));
        assert.deepStrictEqual(checkResponses(accepted, responses, configuration), []);

        const stored = ok(score(accepted, responses), "score");
        assert.deepStrictEqual(stored.outcomes["SCORE"], {
          baseType: "float",
          cardinality: "single",
          values: [{ baseType: "float", value: 1.5 }],
        });
        assert.notProperty(stored.responses, "NUMBER");
        assert.deepStrictEqual(
          fieldsOf(stored.records["NUMBER"] ?? assert.fail("the stored record holds no NUMBER")),
          fieldsOf({ fields: storedFields }),
        );

        const restored = ok(restore(accepted, stored), "restore");
        const shownAgain = numberControls(
          ok(
            render(redacted, configuration, { instance, values: restored.values }),
            "the render of the restored values",
          ),
        );
        assert.deepStrictEqual(
          shownAgain.map((control) => attribute(control, "value")),
          [typed],
        );

        const written = ok(
          results({
            context: {},
            datestamp: new Date("2026-11-08T09:00:00.000Z"),
            document: accepted,
            kind: "item",
            record: stored,
          }),
          "results",
        );
        const response = yield* variableIn(written, "responseVariable", "NUMBER");
        assert.strictEqual(response.attributes["cardinality"], "record");
        assert.notProperty(response.attributes, "baseType");
        assert.deepStrictEqual(response.values, [
          [{ baseType: "float", fieldIdentifier: "floatValue" }, "1.5"],
          [{ baseType: "integer", fieldIdentifier: "leftDigits" }, "1"],
          [{ baseType: "integer", fieldIdentifier: "ndp" }, "2"],
          [{ baseType: "integer", fieldIdentifier: "nsf" }, "3"],
          [{ baseType: "integer", fieldIdentifier: "rightDigits" }, "2"],
          [{ baseType: "string", fieldIdentifier: "stringValue" }, typed],
        ]);
        assert.deepStrictEqual(
          (yield* variableIn(written, "outcomeVariable", "SCORE")).values.map(([, text]) => text),
          ["1.5"],
        );
      }),
  );
});
