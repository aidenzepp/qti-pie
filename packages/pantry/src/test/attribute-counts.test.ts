/**
 * An SSML `meta` carries exactly one of `name` and `http-equiv` (spec reading 41), and a `voice` or
 * a `prosody` at least one attribute fragment removal keeps (spec reading 43): "AL5 attribute
 * count". The law oracle (`#pantry/test/oracle.ts`) and the schema's own statement over the
 * import's rows (`AL5_attribute_count`, `#pantry/qti/attributes.ts`) must give each case below one
 * verdict, refusing the five that break the count under `attribute-count`.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Option } from "effect";
import { lawNameOf, rulesOf } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws } from "#pantry/test/host-judge.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { withItem } from "#pantry/test/probe.ts";

const laws = judgedLaws(Qti);

/**
 * The base item with one SSML `speak` fragment after its paragraph, holding `content`.
 *
 * @param content - The fragment's content.
 * @returns The base package with the item edited.
 */
const withSpeech = (content: string) =>
  withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one.</p><p><ssml:speak xmlns:ssml="http://www.w3.org/2001/10/synthesis" version="1.1" xml:lang="en">${content}</ssml:speak></p>`,
  );

/**
 * The cases of `laws.oracle.test.ts` for readings 41 and 43: each with whether both judges accept
 * it.
 */
const cases: readonly {
  readonly accepted: boolean;
  readonly files: ReturnType<typeof withSpeech>;
  readonly name: string;
}[] = [
  {
    accepted: false,
    files: withSpeech(`<ssml:meta name="seeAlso" http-equiv="Cache-Control" content="x"/>hi`),
    name: "a meta with both name and http-equiv",
  },
  {
    accepted: false,
    files: withSpeech(`<ssml:meta content="x"/>hi`),
    name: "a meta with neither",
  },
  { accepted: false, files: withSpeech(`<ssml:voice>hi</ssml:voice>`), name: "a bare voice" },
  {
    accepted: false,
    files: withSpeech(`<ssml:prosody>hi</ssml:prosody>`),
    name: "a bare prosody",
  },
  {
    accepted: false,
    files: withSpeech(`<ssml:voice xmlns:f="urn:f" f:x="1">hi</ssml:voice>`),
    name: "a voice whose one attribute fragment removal drops",
  },
  {
    accepted: true,
    files: withSpeech(`<ssml:meta name="seeAlso" content="x"/>hi`),
    name: "a meta with name",
  },
  {
    accepted: true,
    files: withSpeech(`<ssml:meta http-equiv="Cache-Control" content="no-cache"/>hi`),
    name: "a meta with http-equiv",
  },
  {
    accepted: true,
    files: withSpeech(`<ssml:voice gender="female">hi</ssml:voice>`),
    name: "a voice with an SSML attribute",
  },
  {
    accepted: true,
    files: withSpeech(`<ssml:voice xml:lang="en">hi</ssml:voice>`),
    name: "a voice with only xml:lang",
  },
  {
    accepted: true,
    files: withSpeech(`<ssml:prosody rate="slow">hi</ssml:prosody>`),
    name: "a prosody with rate",
  },
];

layer(NodeServices.layer, { excludeTestServices: true })("an SSML attribute count", (it) => {
  it.effect("refuses under AL5 in the law oracle and the import's rows alike", () =>
    Effect.gen(function* run() {
      for (const { accepted, files, name } of cases) {
        const verdict = yield* Effect.scoped(
          Effect.gen(function* oneCase() {
            const dir = yield* scopedPackage(
              new Map(
                Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)]),
              ),
            );
            const oracle = yield* oracleVerdict(yield* readPackage(dir));
            const program = yield* readProgram(dir);
            const { broken } = judge(hostRowsOf(program.inputs), laws);
            const brokenLaws = broken.map(({ law }) => law);
            const [first, ...rest] = brokenLaws;

            return {
              al5: brokenLaws.some((law) => Option.contains(lawNameOf(law), "AL5 attribute count")),
              host:
                first === undefined
                  ? "accepted"
                  : Option.getOrElse(Arr.head(rulesOf([first, ...rest])), () => "unnamed"),
              oracle: oracle.kind === "accepted" ? new Set(["accepted"]) : oracle.rules,
            };
          }),
        );
        assert.strictEqual(verdict.oracle.has("accepted"), accepted, `${name}: the law oracle`);
        assert.strictEqual(verdict.host === "accepted", accepted, `${name}: the import's rows`);
        if (!accepted) {
          assert.isTrue(verdict.oracle.has("attribute-count"), `${name}: the oracle's rule`);
          assert.isTrue(verdict.al5, `${name}: AL5 among the import's broken laws`);
          assert.strictEqual(verdict.host, "attribute-count", `${name}: the import's rule`);
        }
      }
    }),
  );
});
