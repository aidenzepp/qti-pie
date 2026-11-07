/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the encoding labels (`UTF-8`, `UTF-16`, `US-ASCII`) as crust's charset table spells them. */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { element, int } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Effect, Exit, Formatter, Option, Result } from "effect";
import { exportCharset } from "@qti-pie/crust/charset.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { toXmlDocument, unshred } from "#pantry/model/unshred.ts";
import { attributePrefixOf } from "#pantry/model/xdm.ts";
import type { XdmChild, XdmDocument } from "#pantry/model/xdm.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import {
  asiNamespace,
  cpNamespace,
  xlinkNamespace,
  xsiNamespace,
} from "#pantry/vocab/namespaces.ts";
import {
  caseHang,
  closedElements,
  editElement,
  searchTimeout,
  xdmDocument,
} from "#pantry/test/gen/xdm.ts";

/**
 * The composed grammar every property draws its trees over, and reads and writes them through.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The grammar shred reads through, projected once.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The names unshred writes under, projected once.
 */
const names = namesOf(grammar);

/**
 * The trees every property is checked over: the one generator's, over the composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * Write a tree and read it back through crust and shred.
 *
 * @param document - The tree.
 * @returns The tree shred reads from the bytes unshred writes.
 */
const roundTrip = (document: XdmDocument<Composed>) =>
  Effect.gen(function* writeAndRead() {
    const read = yield* Effect.orDie(readXml(yield* unshred(document, names)));

    return yield* shred(read, document.version, shredGrammar);
  });

/**
 * A run of character data as its text says it is: text when it holds a character that is not
 * whitespace, whitespace otherwise.
 *
 * @param value - The run's characters.
 * @returns The run.
 */
const runOf = (value: string): XdmChild<Composed> =>
  /^[ \t\r\n]+$/u.test(value) ? { _tag: "ws", value } : { _tag: "text", value };

/**
 * List the code points of a text.
 *
 * @param text - The text.
 * @returns Its code points, in order.
 */
const points = (text: string): readonly number[] =>
  Array.from(text, (character) => character.codePointAt(0) ?? 0);

/**
 * The code points of every character a tree writes where no character reference reaches: its
 * comments, processing instructions, doctype and names.
 *
 * @param document - The tree.
 * @returns The code points.
 */
const unreferencedPoints = (document: XdmDocument<Composed>): readonly number[] => {
  const found: number[] = [...Option.match(document.doctype, { onNone: () => [], onSome: points })];
  const stack: (XdmChild<Composed> | XdmDocument<Composed>["prolog"][number])[] = [
    ...document.prolog,
    document.root,
    ...document.epilog,
  ];
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    switch (node._tag) {
      case "comment": {
        found.push(...points(node.value));
        break;
      }
      case "pi": {
        found.push(...points(node.target), ...points(node.data));
        break;
      }
      case "element":
      case "foreign-element":
      case "no-namespace-element":
      case "own-namespace-element": {
        const { local } = node._tag === "element" ? names.element(node.kind) : node.name;
        found.push(...points(local), ...points(node.prefix));
        for (const { name } of node.attributes) {
          found.push(
            ...points(name._tag === "closed" ? names.attribute(name.handle).local : name.local),
            ...points(attributePrefixOf(name)),
          );
        }

        stack.push(...node.children);
        break;
      }
      case "text":
      case "ws":
      case "entityRef": {
        break;
      }
      default: {
        return node satisfies never;
      }
    }
  }

  return found;
};

describe("unshred", { timeout: searchTimeout }, () => {
  it.effect(
    "writes adjacent runs of character data as one, so a run split in two reads back whole, a ]]> across the split included",
    (ctx) =>
      // Oracle: a metamorphic relation, the round trip: a tree whose run is split in two writes the
      // bytes the unsplit tree reads back from, since the XDM keeps one run per stretch.
      // Bound: the generator's drawn bounds, one run split a case.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<"split" | "split across ]]>">(["split", "split across ]]>"], {
              cases: 400,
              sense: notesOnly,
            }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "the round trip: a run split in two reads back as the unsplit tree",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/unshred-split-runs",
          },
          ({ document, model }, c) =>
            Effect.gen(function* splitRuns() {
              const owners = closedElements(model);
              if (!Arr.isReadonlyArrayNonEmpty(owners)) {
                assert.fail("a generated tree has a root element");
              }

              const target = c.draw(element(owners));
              const run = c.draw(element(["t]]>x", "a b", " \n\t", "]]>"] as const));
              let split: Option.Option<readonly [XdmChild<Composed>, XdmChild<Composed>]> =
                Option.none();
              const whole = editElement(document, target, (owner) => {
                const at = owner.children.findIndex(({ _tag }) => _tag === "text" || _tag === "ws");
                const found = owner.children[at];
                const value = found !== undefined && "value" in found ? found.value : run;
                const cut = c.draw(int(1, Math.max(1, value.length - 1)));
                split = Option.some([runOf(value.slice(0, cut)), runOf(value.slice(cut))]);
                c.note(
                  value.slice(Math.max(0, cut - 2), cut + 2).includes("]]>")
                    ? "split across ]]>"
                    : "split",
                );

                return found === undefined &&
                  !owner.children.some(({ _tag }) => _tag === "text" || _tag === "ws")
                  ? { ...owner, children: [...owner.children, runOf(value)] }
                  : owner;
              });
              const edited = editElement(whole, target, (owner) =>
                Option.match(split, {
                  onNone: () => owner,
                  onSome: (parts) => {
                    const at = owner.children.findIndex(
                      ({ _tag }) => _tag === "text" || _tag === "ws",
                    );

                    return {
                      ...owner,
                      children: [
                        ...owner.children.slice(0, at),
                        ...parts,
                        ...owner.children.slice(at + 1),
                      ],
                    };
                  },
                }),
              );

              assert.deepStrictEqual(yield* roundTrip(edited), whole);
            }),
        ),
      ),
  );

  /**
   * The labels a tree is written in, each read back by crust as written: a BOM-led `UTF-16BE` or
   * `UTF-16LE` reads back as `UTF-16`, crust's label for the BOM family, so neither round-trips its
   * charset.
   */
  const labels = ["UTF-8", "UTF-16", "ISO-8859-1", "US-ASCII"] as const;

  it.effect(
    "writes a tree in the export label crust decides, its declaration naming that label, and reads back as the tree in it",
    (ctx) =>
      // Oracle: a universal one, the round trip, with the export label crust's `exportCharset`
      // decides: the tree reads back with the export label as its charset and its declaration's
      // encoding, and as it was otherwise.
      // Bound: the generator's drawn bounds, every label of a single-byte, an ASCII and both UTF
      // encoder classes.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<(typeof labels)[number] | "relabelled">([...labels, "relabelled"], {
              cases: 400,
              sense: notesOnly,
            }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "the round trip, in the export label crust's exportCharset decides",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/unshred-charsets",
          },
          ({ document }, c) =>
            Effect.gen(function* charsets() {
              const label = c.draw(element(labels));
              c.note(label);

              const written = {
                encoding: Option.some<string>(label),
                standalone: Option.none(),
                version: "1.0" as const,
              };
              const labelled = { ...document, charset: label, declaration: Option.some(written) };
              const decided = exportCharset(label, toXmlDocument(labelled, names));
              if (decided !== label) {
                c.note("relabelled");
              }

              const back = yield* roundTrip({ ...labelled, exportCharset: decided });

              assert.deepStrictEqual(back, {
                ...labelled,
                charset: decided,
                declaration: Option.some({ ...written, encoding: Option.some(decided) }),
                exportCharset: decided,
              });
            }),
        ),
      ),
  );

  /**
   * The labels a tree is forced into, each with the highest code point its encoder writes, none
   * for a label crust has no encoder for.
   */
  const forced = [
    ["US-ASCII", Option.some(0x7f)],
    ["ISO-8859-1", Option.some(0xff)],
    ["windows-1252", Option.none()],
  ] as const;

  it.effect(
    "fails with crust's EncodeError exactly when the label has no encoder, or a comment, instruction, doctype or name holds a character it cannot carry",
    (ctx) =>
      // Oracle: the specification as a checker: a character reference writes any character of
      // text and attribute values, and none of a comment, a processing instruction, the doctype or
      // a name, so those must fit the label's encoder.
      // Bound: the generator's drawn bounds, a label of each encoder class forced on the tree.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<"written" | "refused">(["written", "refused"], {
              cases: 400,
              sense: notesOnly,
            }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "a character reference carries any character of text or an attribute value, and a comment, instruction, doctype or name must fit the label's encoder",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/unshred-encode-error",
          },
          ({ document }, c) =>
            Effect.gen(function* encodeErrors() {
              const [label, highest] = c.draw(element(forced));
              const unreferenced = Math.max(0, ...unreferencedPoints(document));
              const fits = Option.exists(highest, (limit) => unreferenced <= limit);
              const exit = yield* Effect.exit(
                unshred({ ...document, charset: label, exportCharset: label }, names),
              );
              c.note(Exit.isSuccess(exit) ? "written" : "refused");

              assert.strictEqual(Exit.isSuccess(exit), fits);
            }),
        ),
      ),
  );
});

/**
 * The documents spec reading 47's byte fidelity is proved on, each written as crust writes it
 * (its namespace declarations before its attributes, no CDATA, nothing after the root element), so
 * a round trip that keeps every prefix gives back its bytes, each with its version:
 *
 * - An item whose `xsi:schemaLocation` is written `zs:` on the root and `i:` below it, beside
 *   `xml:lang`;
 * - A test whose `qti-selection` holds a foreign element under its `lax` wildcard, with an attribute
 *   in the element's own namespace and one in another, each under its own prefix, and an `xsi:type`
 *   written `t:`;
 * - A manifest whose LOM title carries XLink's `type` and `href` written `xl:` and its `title`
 *   written `xlink:`, the closed names of XLink's globals on a kind of the content-packaging set.
 */
const prefixed = (version: Composed["version"]) => ({
  item: `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="${asiNamespace}" xmlns:zs="${xsiNamespace}" zs:schemaLocation="${asiNamespace} https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="i" title="t" adaptive="false" time-dependent="false" xml:lang="en"><qti-item-body><p xmlns:i="${xsiNamespace}" i:schemaLocation="urn:a b">a</p></qti-item-body></qti-assessment-item>`,
  manifest: `<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="${cpNamespace}" xmlns:xl="${xlinkNamespace}" xmlns:xlink="${xlinkNamespace}" xmlns:lom="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion><lom:lom><lom:general><lom:title xl:type="simple" xl:href="a.xml" xlink:title="T"><lom:string language="en">T</lom:string></lom:title></lom:general></lom:lom></metadata><organizations/><resources/></manifest>`,
  test: `<qti-assessment-test xmlns="${asiNamespace}" xmlns:f="urn:f" xmlns:g="urn:g" xmlns:t="${xsiNamespace}" identifier="t" title="t"><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s" title="s" visible="true"><qti-selection select="1"><f:x f:a="1" g:b="2"><f:y t:type="f:T"/></f:x></qti-selection><qti-assessment-item-ref identifier="i" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
});

describe("the attribute prefix (spec reading 47, C54)", () => {
  it.effect(
    "writes every fixture back byte for byte, each attribute under the prefix it was written with: xsi: under zs:, i: and t:, xlink: under xl: and xlink:, and each open name under its own",
    () =>
      // Oracle: a universal one, the round trip on bytes, which spec reading 47 makes the contract
      // for a document written as crust writes it; the handle's own prefix (`xsi:`, `xlink:`) would
      // write zs:schemaLocation as xsi:schemaLocation, with xsi bound nowhere.
      // Bound: the 3 fixtures in the 2 versions, 6 documents, exhausted.
      Effect.gen(function* bytes() {
        let compared = 0;
        for (const version of schemaVersions) {
          for (const [name, text] of Object.entries(prefixed(version))) {
            const read = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
            const tree = yield* shred(read, version, shredGrammar);
            compared += 1;

            assert.strictEqual(
              new TextDecoder().decode(yield* unshred(tree, names)),
              text,
              `${name} in ${version}`,
            );
          }
        }

        assert.strictEqual(compared, 6);
      }),
  );
});
