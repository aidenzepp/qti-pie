import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { advance } from "#plate/session/advance.ts";
import { itemView, startTest } from "#plate/session/start.ts";
import type { ItemView } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * An item whose response processing sets `FEEDBACK` to `correct` when `RESPONSE` is `true`. Its
 * body holds a feedback inline that `hide` shows until then, and it holds a modal feedback that
 * `show` shows after.
 */
const itemXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="fb" title="Feedback" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>true</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="true">True</qti-simple-choice>
      <qti-simple-choice identifier="false">False</qti-simple-choice>
    </qti-choice-interaction>
    <p><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="correct" show-hide="hide">[before]</qti-feedback-inline></p>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">correct</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="correct" show-hide="show"><qti-content-body>[modal]</qti-content-body></qti-modal-feedback>
</qti-assessment-item>`;

/**
 * A linear test of three refs to {@link itemXml}, each submitted on its own: `shown` allows feedback
 * after its last attempt, `hidden` keeps `show-feedback`'s default, false, and `retry` keeps that
 * default too but allows two attempts.
 */
const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="t" title="Feedback test">
  <qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">
    <qti-assessment-section identifier="S" title="S" visible="true">
      <qti-assessment-item-ref identifier="shown" href="fb.xml">
        <qti-item-session-control show-feedback="true"/>
      </qti-assessment-item-ref>
      <qti-assessment-item-ref identifier="hidden" href="fb.xml"/>
      <qti-assessment-item-ref identifier="retry" href="fb.xml">
        <qti-item-session-control max-attempts="2"/>
      </qti-assessment-item-ref>
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`;

/**
 * The answer that sets `FEEDBACK` to `correct`.
 */
const right = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "true" }],
  },
} as const;

/**
 * Open the item and the test.
 *
 * @returns The test and the item each ref names, by ref.
 */
const delivery = Effect.gen(function* openDelivery() {
  const encoder = new TextEncoder();
  const item = Option.getOrElse(acceptedItem(yield* open("fb.xml", encoder.encode(itemXml))), () =>
    assert.fail("the item is not accepted"),
  );
  const verdict = yield* open("test.xml", encoder.encode(testXml));
  const test: AcceptedTest =
    verdict.kind === "test" &&
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported")
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict}`);
  const items = new Map<string, Accepted>([
    ["hidden", item],
    ["retry", item],
    ["shown", item],
  ]);

  return { items, test };
});

/**
 * Render an item of a session as a host does, from its view's `page`.
 *
 * @param items The items, by ref.
 * @param view The item's view.
 * @returns The item's HTML.
 */
const pageOf = (items: ReadonlyMap<string, Accepted>, view: ItemView): string => {
  const document = items.get(view.ref) ?? assert.fail(`no item for the ref ${view.ref}`);

  return Result.getOrThrow(
    render(redact(document, view.page, view.configuration), view.configuration, {
      disabled: view.disabled,
      instance: view.instance,
      values: view.values,
    }),
  ).html;
};

describe("an item view's page in a test (ItemSessionControl show-feedback, 7.19.2 and 7.19.3)", () => {
  it.effect(
    "[S-1] [I-10] shows a closed item's feedback only under show-feedback, an open item's always, and keeps the record whatever the page shows",
    () =>
      Effect.gen(function* showFeedback() {
        const { items, test } = yield* delivery;
        const configuration = yield* configure({});
        const now = new Date("2026-11-09T12:00:00.000Z");
        const step = (session: Parameters<typeof advance>[2], intent: "next" | "submit-item") =>
          Result.getOrThrow(
            advance(
              test,
              items,
              session,
              intent === "next"
                ? { intent: { kind: "next" } }
                : { intent: { kind: "submit-item" }, responses: right },
              configuration,
              { now },
            ),
          );
        const view = (session: Parameters<typeof advance>[2], n: number) =>
          Result.getOrThrow(itemView(test, session, configuration, n));

        const started = Result.getOrThrow(
          startTest(test, items, configuration, { instance: "sitting", now, seed: "s" }),
        );
        const before = view(started, 1);
        assert.strictEqual(before.page.attempt, "none");
        assert.include(pageOf(items, before), "[before]");
        assert.notInclude(pageOf(items, before), "[modal]");

        // `shown`: closed after its one attempt, and show-feedback lets its feedback show.
        const first = step(started, "submit-item");
        const shown = view(first, 1);
        assert.isTrue(shown.disabled);
        assert.strictEqual(shown.page.attempt, "submitted");
        assert.include(pageOf(items, shown), "[modal]");
        assert.notInclude(pageOf(items, shown), "[before]");

        // `hidden`: closed after its one attempt, and show-feedback's default, false, keeps its
        // page the body as the attempt started, with no modal feedback, while its record keeps the
        // outcome processing set.
        const second = step(step(first, "next"), "submit-item");
        const hidden = view(second, 2);
        assert.isTrue(hidden.disabled);
        assert.strictEqual(hidden.record.attempt, "submitted");
        assert.deepStrictEqual(hidden.record.outcomes["FEEDBACK"]?.values, [
          { baseType: "identifier", value: "correct" },
        ]);
        assert.strictEqual(hidden.page.attempt, "none");
        assert.include(pageOf(items, hidden), "[before]");
        assert.notInclude(pageOf(items, hidden), "[modal]");

        // `retry`: open after its first of two attempts, so show-feedback, which governs only the
        // time after the last attempt, does not hide the feedback the first attempt set.
        const third = step(step(second, "next"), "submit-item");
        const retry = view(third, 3);
        assert.isFalse(retry.disabled);
        assert.strictEqual(retry.page.attempt, "submitted");
        assert.include(pageOf(items, retry), "[modal]");
      }),
  );
});
