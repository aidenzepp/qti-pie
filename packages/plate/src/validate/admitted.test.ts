import { readdirSync, readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import { readSource } from "#plate/document/read.ts";
import { openCorpus } from "#plate/test/sweep.ts";
import { openAdmitted } from "#plate/validate/admitted.ts";
import { open } from "#plate/validate/open.ts";
import { securingTables } from "#plate/validate/securing-tables.ts";
import { tables } from "#plate/validate/tables.ts";
import { check, checkAdmitted } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";
import type { SecuringTables } from "#plate/validate/xsd.ts";

/**
 * Opening and comparing every corpus member twice nears vitest's 5 s default under load.
 */
const corpusTimeoutMs = 120_000;

/**
 * An item whose body holds the given markup.
 *
 * @param body The item body's content.
 * @param root Extra attributes of the root, as XML, each after a space.
 * @param itemBody Extra attributes of the item body, as XML, each after a space.
 * @returns The item's bytes.
 */
const itemOf = (body: string, root = "", itemBody = ""): Uint8Array =>
  new TextEncoder().encode(
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="I" adaptive="false" time-dependent="false"${root}><qti-item-body${itemBody}>${body}</qti-item-body></qti-assessment-item>`,
  );

/**
 * The namespace of the `onclick` {@link e3Item} carries, one the QTI XSD declares nothing in.
 */
const foreign = "urn:example:other";

/**
 * An item whose response processing sets `SCORE` through a `qti-custom-operator` carrying an
 * `onclick` in {@link foreign}, which only the operator's `##other` attribute wildcard admits. The
 * Schematron's extension lists do not cover the operator, so `open` accepts the attribute there and
 * E3 removes and marks it, where on a body element the lists cover, such as `p`, `open` refuses any
 * undeclared attribute but a `data-` one (reading 90, E10).
 */
const e3Item: Uint8Array = new TextEncoder().encode(
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="I" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p class="lead">Hi</p></qti-item-body><qti-response-processing><qti-set-outcome-value identifier="SCORE"><qti-custom-operator xmlns:x="${foreign}" class="org.example.Half" x:onclick="alert(1)"><qti-base-value base-type="float">1</qti-base-value></qti-custom-operator></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`,
);

/**
 * Documents that exercise what securing does, each by name: a plain item; E3 removing and marking
 * an `onclick` that only a wildcard the extension lists do not cover admits; the URL pass dropping
 * a `javascript:` href; and valid `xsi:type`s, under which the type's table governs the walk and
 * E3 (AD-9).
 */
const securedDocuments: ReadonlyMap<string, Uint8Array> = new Map([
  ["plain.xml", itemOf("<p>Hi</p>")],
  ["e3.xml", e3Item],
  ["url.xml", itemOf('<p><a href="javascript:x">Go</a>.</p>')],
  [
    "xsi-type.xml",
    itemOf(
      '<p xsi:type="q:HTMLTextDType" class="lead">Hi</p>',
      ' xmlns:q="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="q:AssessmentItemDType"',
      ' xsi:type="q:ItemBodyDType"',
    ),
  ],
]);

/**
 * The fixture documents, items and a test, by name.
 */
const fixtureDocuments: ReadonlyMap<string, Uint8Array> = new Map(
  [
    ...readdirSync(new URL("../../fixtures/m2/items/", import.meta.url)).map(
      (file) => `items/${file}`,
    ),
    "test.xml",
  ].map((file) => [file, readFileSync(new URL(`../../fixtures/m2/${file}`, import.meta.url))]),
);

/**
 * Report whether a verdict accepts its document.
 *
 * @param verdict The verdict.
 * @returns Whether it is `accepted` or `accepted-with-unsupported`.
 */
const accepts = (verdict: Verdict): boolean =>
  verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported";

/**
 * Hold `openAdmitted` to `open` on one document `open` accepts: the two verdicts are equal.
 *
 * @param location The document's location.
 * @param bytes Its bytes.
 */
const sameAsOpen = (location: string, bytes: Uint8Array): void => {
  const opened = Effect.runSync(open(location, bytes));

  assert.isTrue(accepts(opened), `open accepts ${location}`);
  assert.deepStrictEqual(Effect.runSync(openAdmitted(location, bytes)), opened, location);
};

describe("validate/admitted.ts", () => {
  it("gives open's verdict on every document open accepts that securing changes: E3, a dropped URL and xsi:type", () => {
    for (const [location, bytes] of securedDocuments) {
      sameAsOpen(location, bytes);
    }
  });

  it("gives open's verdict on every fixture item and test", () => {
    assert.isAbove(fixtureDocuments.size, 1);
    for (const [location, bytes] of fixtureDocuments) {
      sameAsOpen(location, bytes);
    }
  });

  it.effect(
    "gives open's verdict on every corpus member open accepts",
    () =>
      Effect.gen(function* corpusSame() {
        const members = yield* openCorpus;
        const accepted = members.flatMap(({ bytes, location, verdict }) =>
          Exit.isSuccess(verdict) && accepts(verdict.value) ? [{ bytes, location, verdict }] : [],
        );

        assert.isAbove(accepted.length, 0);
        for (const { bytes, location, verdict } of accepted) {
          const admitted = yield* openAdmitted(location, bytes);

          assert.deepStrictEqual(Exit.succeed(admitted), verdict, location);
        }
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it("removes and marks the onclick E3 removes, by the securing tables' declared names", () => {
    const source = Effect.runSync(readSource("e3.xml", e3Item));
    const checked = check(source, tables, Option.none());

    assert.deepStrictEqual(
      checked.verdict === "accepted-with-unsupported"
        ? checked.accepted.unsupported.filter((mark) => mark.feature.startsWith("attribute:"))
        : [],
      [
        {
          feature: `attribute:{${foreign}}onclick`,
          path: "qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-custom-operator",
          shown: "mark",
        },
      ],
    );
    assert.deepStrictEqual(checkAdmitted(source, securingTables, Option.none()), checked);

    // The plant: securing tables in which qti-custom-operator declares onclick keep it, where open
    // removes it.
    const operator = securingTables.elements["qti-custom-operator"];
    assert.isDefined(operator, "the securing tables hold qti-custom-operator");

    const planted: SecuringTables = {
      ...securingTables,
      elements: {
        ...securingTables.elements,
        "qti-custom-operator": {
          ...operator,
          attributes: [
            ...operator.attributes,
            { local: "onclick", namespace: foreign, use: "optional" },
          ],
        },
      },
    };
    assert.notDeepEqual(checkAdmitted(source, planted, Option.none()), checked);
  });
});
