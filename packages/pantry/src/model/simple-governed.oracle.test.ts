/**
 * An element a simple type governs by its `xsi:type` holds text of that type alone (reading 60: "a
 * simple type it names governs its text and is checked"), on foreign content: every built-in
 * simple type, its text valid, its text invalid and an element child, on a foreign element and on
 * an ASI element read as foreign content beneath one, in both versions.
 *
 * Oracle: the specification turned into a checker. XML Schema 1.0 Part 1, §3.3.4, Element Locally
 * Valid (Type), clause 3.1: an element a simple type governs has no element child (3.1.2) and its
 * text is valid for the type (3.1.3), so the law oracle refuses an invalid text under `TextDomain`
 * and an element child under `Foreign simple content`, and reads a valid text with neither. Which
 * texts are valid is the type's domain's (`lexical.oracle.test.ts` holds each domain to xmllint);
 * this guard holds that the check is made, on every built-in and in both contexts.
 *
 * Bound: every built-in simple type each version's `TypeText` holds, exhausted, × {valid text,
 * invalid text, element child} × {foreign element, ASI element under a foreign one, foreign element
 * whose `xs` prefix the root binds to another namespace and it rebinds} × the two versions. The
 * rebound context is the shape GEN-B's search found before 5cdc88e7, where the codec read the
 * root's binding of the prefix: the nearest declaration must win. A valid text is the first of the
 * domain's own samples it accepts; an invalid one the first of a fixed list of candidates it
 * refuses, none for a type every string is a value of. The foreign content stands in an SSML
 * `mark`'s `##other` `lax` wildcard in an item's companion materials. Kept: the shapes GEN-B's XSD
 * search reported (`xs:unsignedShort` with `x&`, `xs:anyURI` with an element child, `xs:float` on a
 * `qti-prompt`), which HEAD already refused.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { expandedNameOf } from "#pantry/grammar/xsi.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import {
  accepts,
  drawnOf,
  escaped,
  familiesOf,
  familyTable,
} from "#pantry/test/lexical-harness.ts";
import { documentBreaches, lawsOf } from "#pantry/test/oracle.ts";
import { asiNamespace, xsiNamespace, xsNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 11.1 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 300_000;

/**
 * The composed grammar and its laws.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The law oracle's tables.
 */
const laws = lawsOf(grammar);

/**
 * The texts tried as a type's invalid text, the first its domain refuses taken.
 */
const invalidCandidates = [
  "x&",
  "nope",
  "-",
  "1 2 3 x",
  "",
  "😀",
  "<",
  "a:b:c",
  "1e",
  "%zz",
] as const;

/**
 * The three things a governed element holds.
 */
const holdings = ["valid", "invalid", "element"] as const;

/**
 * Where the governed element stands.
 */
const contexts = ["foreign", "local", "rebound"] as const;

/**
 * Write the item a case reads.
 *
 * @param type - The built-in's local name.
 * @param context - Where the governed element stands.
 * @param content - What it holds, as written.
 * @param target - An ID the item's body declares, which an `xs:IDREF` text names; none for none.
 * @returns The item's text.
 */
const itemOf = (
  type: string,
  context: (typeof contexts)[number],
  content: string,
  target: Option.Option<string>,
): string => {
  const typed = `xmlns:xsi="${xsiNamespace}" xmlns:xs="${xsNamespace}" xsi:type="xs:${type}"`;
  const governed =
    context === "local"
      ? `<x:f xmlns:x="urn:x"><qti-prompt ${typed}>${content}</qti-prompt></x:f>`
      : `<x:f xmlns:x="urn:x" ${typed}>${content}</x:f>`;
  // The root binds the type's prefix to a namespace of no type, and the governed element rebinds
  // it to XML Schema's: the nearest declaration binds it (Namespaces in XML 1.0, §6.1).
  const outer = context === "rebound" ? ` xmlns:xs="urn:qti-pie:no-types"` : "";

  return `<qti-assessment-item xmlns="${asiNamespace}"${outer} identifier="i" title="t" time-dependent="false" adaptive="false"><qti-companion-materials-info><ssml:mark xmlns:ssml="http://www.w3.org/2001/10/synthesis" name="m">${governed}</ssml:mark></qti-companion-materials-info><qti-item-body><p${Option.match(target, { onNone: () => "", onSome: (id) => ` id="${id}"` })}>x</p></qti-item-body></qti-assessment-item>`;
};

/**
 * Judge an item in a version by the codec and the law oracle.
 *
 * @param text - The item.
 * @param version - The version.
 * @returns The laws it breaks, or the codec's refusal.
 */
const judged = Effect.fn("test.judged")(function* judgedItem(
  text: string,
  version: SchemaVersion,
): Effect.fn.Return<{ readonly codec: Option.Option<string>; readonly laws: readonly string[] }> {
  const read = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
  const tree = yield* Effect.result(shred(read, version, shredGrammarOf(grammar)));
  if (Result.isFailure(tree)) {
    return { codec: Option.some(tree.failure.message), laws: [] };
  }

  const rows = fold(tree.success, idOf, foldGrammarOf(grammar));
  if (Result.isFailure(rows)) {
    return { codec: Option.some(String(rows.failure)), laws: [] };
  }

  return {
    codec: Option.none(),
    laws: documentBreaches("doc.xml", rows.success, laws).map(({ law }) => law),
  };
});

describe("a simple xsi:type on foreign content", () => {
  it.effect(
    "refuses an invalid text and an element child, and reads a valid text, under every built-in simple type, foreign and local, in both versions",
    () =>
      Effect.gen(function* everyBuiltIn() {
        const domains = new Map(
          grammar.attributes.domains.map((domain) => [domain.handle, domain]),
        );
        const wrong: string[] = [];
        const unchecked: string[] = [];
        let cases = 0;
        for (const version of schemaVersions) {
          const builtIns = grammar.attributes.typeText.rows.filter(
            (row) =>
              row.version === version &&
              Option.exists(
                expandedNameOf(row.governs),
                ({ namespace }) => namespace === xsNamespace,
              ),
          );
          for (const row of builtIns) {
            const domain = domains.get(row.domain);
            const type = Option.getOrThrow(expandedNameOf(row.governs)).local;
            if (domain === undefined) {
              unchecked.push(`${version} ${row.governs}: no domain`);
              continue;
            }

            const valid = [
              ...drawnOf(domain),
              ...familiesOf(domain, Option.none()).flatMap((name) => familyTable.get(name) ?? []),
            ].find((value) => value !== "" && accepts(domain, value));
            const invalid = invalidCandidates.find((value) => !accepts(domain, value));
            const content = {
              element: Option.some(`<x:g xmlns:x="urn:x"/>`),
              invalid: Option.map(Option.fromUndefinedOr(invalid), escaped),
              valid: Option.map(Option.fromUndefinedOr(valid), escaped),
            };
            for (const holding of holdings) {
              for (const context of contexts) {
                const written = content[holding];
                if (Option.isNone(written)) {
                  unchecked.push(`${version} ${row.governs} ${holding} ${context}: no such text`);
                  continue;
                }

                // An IDREF's valid text names an ID the document declares (XML Schema 1.0 Part 1,
                // §3.3.4 and the ID/IDREF table): the body declares the one it names.
                const target =
                  holding === "valid" &&
                  Option.exists(domain.identity, (identity) => identity !== "ID")
                    ? Option.fromUndefinedOr(valid?.split(/\s+/u)[0])
                    : Option.none();
                const { codec, laws: broken } = yield* judged(
                  itemOf(type, context, written.value, target),
                  version,
                );
                cases += 1;
                const ok = {
                  element: broken.includes("Foreign simple content"),
                  invalid: broken.includes("TextDomain"),
                  valid: Option.isNone(codec) && broken.length === 0,
                }[holding];
                if (!ok) {
                  wrong.push(
                    `${version} xs:${type} ${holding} ${context} ${JSON.stringify(written.value)}: ${Option.getOrElse(codec, () => `breaks ${broken.join(", ") || "nothing"}`)}`,
                  );
                }
              }
            }
          }
        }

        assert.isAbove(cases, 0, "some built-in was read");
        assert.deepStrictEqual(
          wrong,
          [],
          "every governed text is checked, and an element child refused",
        );
        assert.deepStrictEqual(
          unchecked.filter(
            (line) => !/ invalid (?:foreign|local|rebound): no such text$/u.test(line),
          ),
          ["3.0.0 xs:NOTATION: no domain", "3.0.1 xs:NOTATION: no domain"],
          "every built-in but xs:NOTATION, whose value space no pinned XSD fills (§3.2.19), has a domain and a valid text",
        );
      }),
    { timeout: testTimeoutMs },
  );
});
