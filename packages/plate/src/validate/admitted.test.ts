import { readdirSync, readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
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
 * Documents that exercise what securing does, each by name: a plain item; E3 removing and marking
 * an `onclick` that only a wildcard admits; the URL pass dropping a `javascript:` href; and valid
 * `xsi:type`s, under which the type's table governs E3 (AD-9).
 */
const securedDocuments: ReadonlyMap<string, Uint8Array> = new Map([
  ["plain.xml", itemOf("<p>Hi</p>")],
  ["e3.xml", itemOf('<p class="lead" onclick="alert(1)">Hi</p>')],
  ["url.xml", itemOf('<p><a href="javascript:x">Go</a>.</p>')],
  [
    "xsi-type.xml",
    itemOf(
      '<p xsi:type="q:HTMLTextDType" onclick="alert(1)">Hi</p>',
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
    const e3 = securedDocuments.get("e3.xml");
    assert.isDefined(e3, "the e3 document is defined");

    const source = Effect.runSync(readSource("e3.xml", e3));

    assert.deepStrictEqual(checkAdmitted(source, securingTables), check(source, tables));

    // The plant: securing tables in which p declares onclick keep it, where open removes it.
    const { p } = securingTables.elements;
    assert.isDefined(p, "the securing tables hold p");

    const planted: SecuringTables = {
      ...securingTables,
      elements: {
        ...securingTables.elements,
        p: {
          ...p,
          attributes: [...p.attributes, { local: "onclick", namespace: "", use: "optional" }],
        },
      },
    };
    assert.notDeepEqual(checkAdmitted(source, planted), check(source, tables));
  });
});
