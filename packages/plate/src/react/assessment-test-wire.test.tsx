/**
 * The React test-server wire as the contract types it and `assessment-test-provider.tsx` stubs it:
 * a hook called outside an `AssessmentTestProvider` fails with `NoAssessmentTestProvider` naming
 * the hook, `fetchTransport` gives an `AssessmentTestTransport` whose requests fail the way the
 * layer's other stubs fail, and `AssessmentTestServerOptions` carries the host's session naming and
 * clock.
 */
import { assert, describe, expectTypeOf, it, vi } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { encodeRedacted } from "#plate/codec/redacted.ts";
import type { SavedResponsesJson } from "#plate/codec/session.ts";
import { encodeItemView } from "#plate/codec/view.ts";
import type { ItemViewPayloadSchema } from "#plate/codec/view.ts";
import { configure } from "#plate/configuration.ts";
import { encodeIntent, intentName } from "#plate/form/intent.ts";
import type {
  AssessmentTestServerOptions,
  AssessmentTestTransport,
  ItemViewPayload,
  Posted,
} from "#plate/react/contract.tsx";
import {
  fetchTransport,
  NoAssessmentTestProvider,
} from "#plate/react/assessment-test-provider.tsx";
import { redact } from "#plate/render.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

describe("NoAssessmentTestProvider", () => {
  it("is a tagged error whose message names the hook", () => {
    const error = new NoAssessmentTestProvider({ hook: "useCurrentItem" });

    assert.strictEqual(error._tag, "NoAssessmentTestProvider");
    assert.include(error.message, "useCurrentItem");
    assert.include(error.message, "AssessmentTestProvider");
  });
});

describe("fetchTransport", () => {
  it.effect(
    "[m3g-06] fetchTransport sends GET for view and POST with the intent entry for post",
    () =>
      Effect.gen(function* sendsTheWire() {
        const url = "http://plate.test/session";
        const item = [
          '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="wire" title="Wire" adaptive="false" time-dependent="false">',
          '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
          '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
          '<qti-simple-choice identifier="A">Left</qti-simple-choice>',
          '<qti-simple-choice identifier="B">Right</qti-simple-choice>',
          "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
        ].join("");
        const accepted = Option.getOrThrow(
          acceptedItem(yield* open("wire.xml", new TextEncoder().encode(item))),
        );
        const view = encodeItemView({
          configuration: yield* configure({}),
          disabled: false,
          instance: "s1.1",
          navigation: {
            allowed: [{ kind: "next" }],
            count: 2,
            items: [
              { current: true, sequenceIndex: 1, state: "not-answered" },
              { current: false, sequenceIndex: 2, state: "not-answered" },
            ],
            navigation: "nonlinear",
            position: 1,
            submission: "simultaneous",
          },
          redacted: Result.getOrThrow(encodeRedacted(redact(accepted))),
          values: {},
        });
        const sent: Request[] = [];
        const answers = new Map<string, unknown>([
          ["GET", view],
          ["POST", { kind: "view", view }],
        ]);
        const form = new FormData();

        form.append("s1.1.RESPONSE", "B");
        vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
          const request = new Request(input, init);

          sent.push(request);

          return Promise.resolve(Response.json(answers.get(request.method)));
        });

        const transport = fetchTransport(url);
        const viewed = yield* Effect.promise(() => transport.view());
        const posted = yield* Effect.promise(() => transport.post({ kind: "next" }, form));
        const [get, post] = sent;
        const body = yield* Effect.promise(() => post?.formData() ?? assert.fail("no POST"));

        assert.strictEqual(viewed.kind, "view");
        assert.strictEqual(posted.kind, "view");
        assert.strictEqual(sent.length, 2);
        assert.strictEqual(get?.method, "GET");
        assert.strictEqual(get?.url, url);
        assert.strictEqual(post?.method, "POST");
        assert.strictEqual(post?.url, url);
        assert.deepStrictEqual(
          [...body],
          [
            ["s1.1.RESPONSE", "B"],
            [intentName("s1"), encodeIntent({ kind: "next" })],
          ],
        );
      }).pipe(Effect.ensuring(Effect.sync(() => vi.unstubAllGlobals()))),
  );
});

describe("AssessmentTestServerOptions", () => {
  it("names the session from the request and takes the clock", () => {
    expectTypeOf<AssessmentTestServerOptions["sessionOf"]>().toEqualTypeOf<
      (request: Request) => string
    >();
    expectTypeOf<AssessmentTestServerOptions["now"]>().toEqualTypeOf<(() => Date) | undefined>();
  });
});

describe("ItemViewPayload", () => {
  it("[W0-AN.2] ItemViewPayload carries disabled, values and an optional posted", () => {
    expectTypeOf<ItemViewPayload["disabled"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ItemViewPayload["values"]>().toEqualTypeOf<SavedResponsesJson>();
    expectTypeOf<ItemViewPayload["posted"]>().toEqualTypeOf<
      Readonly<Record<string, readonly string[]>> | undefined
    >();
  });

  it("[W0-AN.2] the view codec's Schema type is the contract's ItemViewPayload", () => {
    expectTypeOf<typeof ItemViewPayloadSchema.Type>().toEqualTypeOf<ItemViewPayload>();
  });
});

describe("AssessmentTestTransport", () => {
  it("[W0-AN.2] the transport's view is typed to the wire", () => {
    expectTypeOf<ReturnType<AssessmentTestTransport["view"]>>().toEqualTypeOf<Promise<Posted>>();
  });
});
