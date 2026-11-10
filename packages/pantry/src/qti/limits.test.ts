/**
 * The key-text bounds against grizzle's own representability rule, `keyTextBytes(fields)`, which
 * measures a key's B-tree entry as the schema's compilation does: each bound is the UTF-8 bytes it
 * leaves beside its widest key's other fields. That each index of the composed `Qti` holds its
 * bounded text representably is the compilation's own proof, never restated here: grizzle refuses
 * an index whose entry can pass PostgreSQL's limit (`UnrepresentableKey`, `laws/model/plan.ts`
 * `plannedEntry` of the vendored engine) wherever it compiles `Qti`. And the regex bound,
 * `regexTextBytes`, against grizzle's refusal, in an installation's compile, of `Compute.matches`
 * in a query one byte past it.
 */
import { keyTextBytes, str, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { OpenLocal } from "#pantry/qti/attributes.ts";
import {
  keyTextBytes as keyTextBound,
  localNameBytes,
  namespaceBytes,
  prefixBytes,
  regexTextBytes,
  utf8Length,
  widestTextKey,
} from "#pantry/qti/limits.ts";
import { grizzleCheck, writtenConfig } from "#pantry/test/grizzle-check.ts";

/**
 * Any text, line ends included: the language a probe of a byte bound cuts.
 */
const anyText = str.regex("^.*$", "su");

/**
 * The configuration of an installation of a probe schema: a root holding one relation whose text
 * field takes `bytes` as its byte bound over `Attribute.lexical`'s pattern, and a level above it
 * whose check reads a derived relation over that field with `Compute.matches`. That check is a rule
 * over a query, whose violation query grizzle checks where it writes the installation's
 * (`laws/model/violations.ts` `theoryViolations` of the vendored engine), so the compile refuses
 * the match unless the field's type bounds it within the most PostgreSQL's regular expressions
 * read (`scalar/compute/lower.ts` `regexReadable`). Its migrations folder does not exist, so
 * `grizzle check` drafts the probe from the empty snapshot, as a first `grizzle generate` would.
 *
 * @param bytes - The field's byte bound.
 * @returns The configuration's source, given its folder.
 */
const probeConfig =
  (bytes: number) =>
  (directory: string): string =>
    `import {
  check,
  Compute,
  defineConfig,
  derived,
  query,
  relation,
  schema,
  str,
  uuid,
  v,
} from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { connectionServices, migrationConnection } from "#pantry/db/connection.ts";
import { charsPattern } from "#pantry/qti/node.ts";

const Held = relation("Held", { id: uuid, lexical: str.bytes(${String(bytes)}, str.regex(charsPattern)) }, ["id"]);
const Root = schema("Probe", { Held }, []);
const Read = derived(
  "Read",
  query(Root).rule((r) => {
    const { id, lexical } = v(Held, "h");

    return r.match(Held, { id, lexical }).find({ id, lexical });
  }),
);

const connection = await Effect.runPromise(
  migrationConnection.pipe(Effect.provide(connectionServices)),
);

export default defineConfig({
  connection: () => connection,
  logins: [],
  migrations: ${JSON.stringify(`${directory}/migrations`)},
  schemas: [
    schema.extend(Root, "Level", { Read }, [
      check("Matched", Read, (h) => h.not(Compute.matches(h.lexical, Compute.pattern("^d")))),
    ]),
  ],
});
`;

/**
 * Run `grizzle check` over the probe installation at one byte bound, and list its lines about the
 * probe's top level and the ones where it refuses to compile it.
 *
 * @param bytes - The field's byte bound.
 * @returns The check's exit code, its output, its lines naming the level `Level`, and its lines
 *   naming a compile refusal.
 */
const probeChecked = (bytes: number) =>
  Effect.scoped(
    Effect.gen(function* probe() {
      const file = yield* writtenConfig(`limits-regex-${String(bytes)}`, probeConfig(bytes));
      const { code, output } = yield* grizzleCheck(file);

      const lines = output.split("\n");

      return {
        code,
        level: lines.filter((line) => line.startsWith("Level: ")),
        output,
        refused: lines.filter((line) => line.includes("does not compile")),
      };
    }),
  );

describe("qti/limits.ts", () => {
  it("states each bound as the UTF-8 bytes grizzle's keyTextBytes leaves beside its widest key's other fields", () => {
    // Oracle: grizzle's own rule (`keyTextBytes`, public/text.ts of the vendored engine), the
    // measure the schema's compilation refuses an entry by, read over each kind's widest key: the
    // key text beside `widestTextKey`, the namespace name beside a uuid and the local name's own
    // type, `OpenAttributeName(node, uri, local)`, and the prefix beside a uuid, `Namespace(node,
    // prefix)`; the local name and the namespace name share their entry evenly.
    assert.strictEqual(keyTextBound, keyTextBytes(widestTextKey));
    assert.strictEqual(namespaceBytes, keyTextBytes([uuid, OpenLocal]));
    assert.strictEqual(prefixBytes, keyTextBytes([uuid]));
    assert.isAtLeast(namespaceBytes, localNameBytes);
    assert.isBelow(
      keyTextBytes([uuid, str.bytes(localNameBytes + 1, anyText)]),
      localNameBytes + 1,
    );
    assert.deepStrictEqual(
      { keyTextBound, localNameBytes, namespaceBytes, prefixBytes },
      { keyTextBound: 2587, localNameBytes: 1329, namespaceBytes: 1329, prefixBytes: 2665 },
    );
  });

  it.effect(
    "states the regex bound as the most bytes grizzle lets a query match, its installation's compile refusing one byte past it",
    () =>
      Effect.gen(function* regexBound() {
        // Oracle: grizzle's own refusal (`regexReadable`, `scalar/compute/lower.ts` of the vendored
        // engine, over its unexported `regexTextMaxBytes`, `core/limits.ts`), which since grizzle
        // b9f100ac the installation's compile raises where it checks a rule over a query's
        // violation query, not `lawsOf`; probes B1 and B6 of research 009144af. Bound: the bound
        // and one byte past it, the two configurations alike but for the field's byte bound. What
        // is asserted is the refusal `grizzle check` states, "does not compile", and the reason it
        // names, the compile error's tag at the probe's check, never the message.
        assert.strictEqual(regexTextBytes, 268_435_454);

        const [at, past] = yield* Effect.all(
          [probeChecked(regexTextBytes), probeChecked(regexTextBytes + 1)],
          { concurrency: 2 },
        );
        for (const run of [at, past]) {
          assert.isTrue(
            run.code === 0 || run.code === 1,
            `grizzle check exited ${String(run.code)}:\n${run.output}`,
          );
          assert.isNotEmpty(run.level, `grizzle check printed no Level line:\n${run.output}`);
        }

        assert.deepStrictEqual(at.refused, [], `at the bound, it compiles:\n${at.output}`);
        assert.isNotEmpty(
          past.refused,
          `one byte past it, grizzle refuses to compile the installation:\n${past.output}`,
        );
        assert.isTrue(
          past.refused.every((line) => line.includes("UnsupportedOperation at check Matched")),
          `one byte past it, the refusal is the probe's check, an unsupported operation:\n${past.output}`,
        );
      }),
  );

  it("counts a text's bytes as UTF-8 does: one to four bytes a code point", () => {
    // Oracle: the specification as a checker, RFC 3629 §3's table of byte sequences.
    // Bound: the first and last code point of each of the four lengths.
    for (const [text, bytes] of [
      ["\u{0}", 1],
      ["\u{7F}", 1],
      ["\u{80}", 2],
      ["\u{7FF}", 2],
      ["\u{800}", 3],
      ["\u{FFFF}", 3],
      ["\u{10000}", 4],
      ["\u{10FFFF}", 4],
    ] as const) {
      assert.strictEqual(utf8Length(text), bytes, text);
    }
  });
});
