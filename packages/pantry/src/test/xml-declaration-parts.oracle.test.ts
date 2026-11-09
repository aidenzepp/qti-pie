/* oxlint-disable unicorn/text-encoding-identifier-case -- The cases carry XML encoding labels (`UTF-8`) as documents spell them. */
/**
 * A document's XML declaration, each part written or not, held three ways: the specification by
 * hand (`expectedOf`), the law oracle's verdict, and the import's rows, read for which rows exist,
 * judged on the host by the schema's own statements, and written back by the export.
 *
 * XML 1.0 §2.8 makes the declaration optional and its encoding and standalone parts optional within
 * it (`XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'`), and a value that may be
 * missing is a row of its own relation, written only where it is (AGENTS.md, Schema intent).
 * Before, the `Document` row held `none` for an unwritten declaration's version and standalone and
 * `""` for an unwritten encoding, and its readers read them back as "unwritten". Now `XmlDecl`,
 * `EncodingDecl` and `SdDecl` (`#pantry/qti/chardata.ts`) each hold a row exactly where the
 * document writes the part, and the export writes back exactly what was written.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { ImportProgram } from "#pantry/import/program.ts";

import { assemble } from "#pantry/model/assemble.ts";
import { namesOf } from "#pantry/model/composed.ts";
import { unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge as judgeHost, judgedLaws } from "#pantry/test/host-judge.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf, shownBreach } from "#pantry/test/oracle.ts";
import type { Judgment } from "#pantry/test/oracle.ts";

/**
 * The oracle's tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * Every law the host judges, read once.
 */
const hostLaws = judgedLaws(Qti);

/**
 * The names the export writes under.
 */
const names = namesOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The document that carries the case's declaration.
 */
const itemPath = "item.xml";

/**
 * The encoding labels the box writes: UTF-8 in two spellings (XML 1.0 §4.3.3: encoding names are
 * matched case-insensitively), ISO-8859-1 by its name and an alias, US-ASCII, each of which the
 * writer encodes, so the document is written back in the label it was read under; windows-1252,
 * which the reader decodes and the writer does not, so the document is written back in UTF-8,
 * relabelled; and `none`, an `EncName` that names no encoding the reader can process.
 */
const labels = ["UTF-8", "utf-8", "ISO-8859-1", "latin1", "US-ASCII", "windows-1252", "none"];

/**
 * The labels the reader decodes and the writer does not encode, which the export writes back as
 * UTF-8 (`#pantry/model/unshred.ts`, `unshred`).
 */
const relabelled: ReadonlySet<string> = new Set(["windows-1252"]);

/**
 * The labels that name no encoding the reader can process.
 */
const unprocessable: ReadonlySet<string> = new Set(["none"]);

/**
 * One case: whether the document writes a version, and the encoding and standalone it writes, each
 * none where unwritten. A document that writes none of the three writes no declaration.
 */
interface Case {
  readonly encoding: Option.Option<string>;
  readonly standalone: Option.Option<"no" | "yes">;
  readonly version: boolean;
}

/**
 * Every case: a version written or not, by an encoding unwritten or each label, by a standalone
 * unwritten, `yes` or `no`: 2 × 8 × 3, 48 in all.
 */
const cases: readonly Case[] = [true, false].flatMap((version) =>
  [Option.none<string>(), ...labels.map((label) => Option.some(label))].flatMap((encoding) =>
    [Option.none<"no" | "yes">(), Option.some("yes" as const), Option.some("no" as const)].map(
      (standalone): Case => ({ encoding, standalone, version }),
    ),
  ),
);

/**
 * Whether a case writes a declaration at all: any of its three parts.
 *
 * @param drawn - The case.
 * @returns Whether it writes `<?xml`.
 */
const declares = (drawn: Case): boolean =>
  drawn.version || Option.isSome(drawn.encoding) || Option.isSome(drawn.standalone);

/**
 * Write a case's declaration as the writer spells one: its parts in the order XML 1.0 §2.8 gives
 * them, each double-quoted, then a line feed; nothing where the case writes none.
 *
 * @param drawn - The case.
 * @returns The declaration's text.
 */
const declarationOf = (drawn: Case): string => {
  if (!declares(drawn)) {
    return "";
  }

  const parts = [
    ...(drawn.version ? ['version="1.0"'] : []),
    ...drawn.encoding.pipe(
      Option.map((label) => `encoding="${label}"`),
      Option.toArray,
    ),
    ...drawn.standalone.pipe(
      Option.map((value) => `standalone="${value}"`),
      Option.toArray,
    ),
  ];

  return `<?xml ${parts.join(" ")}?>\n`;
};

/**
 * The item's text after its declaration, as the writer spells it.
 */
const itemBody = `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body><p>Hi</p></qti-item-body></qti-assessment-item>`;

/**
 * Write a case's package: the item, its declaration the case's, and the manifest that lists it,
 * with no declaration, each file's text encoded as UTF-8, which every label of the box reads alike
 * since the text is ASCII.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: Case): PackageEntries =>
  new Map(
    Object.entries({
      "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="${itemPath}"><file href="${itemPath}"/></resource></resources></manifest>`,
      [itemPath]: `${declarationOf(drawn)}${itemBody}`,
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * What the specification says of a case: refused under a rule, or accepted with a declaration's
 * rows.
 *
 * - A declaration that writes no version is no `XMLDecl` (XML 1.0 §2.8: `VersionInfo` is not
 *   optional), so the document is not well-formed, a fatal error (§1.2): refused under
 *   `well-formedness`.
 * - An encoding the processor cannot process is a fatal error (§4.3.3: "It is a fatal error ... if an
 *   XML processor encounters an entity with an encoding that it is unable to process"): refused
 *   under `reader-refusal`, crust's `unsupported-encoding`.
 * - Otherwise the package is lawful, and its rows are an `XmlDecl` row where it writes a declaration,
 *   and an `EncodingDecl` and an `SdDecl` row where the declaration writes each part, each holding
 *   the part as written.
 */
type Expected =
  | { readonly _tag: "refused"; readonly rule: "reader-refusal" | "well-formedness" }
  | {
      readonly _tag: "accepted";
      readonly encoding: readonly string[];
      readonly standalone: readonly string[];
      readonly version: readonly string[];
    };

/**
 * Say what the specification says of a case, by hand.
 *
 * @param drawn - The case.
 * @returns The verdict, and an accepted case's rows.
 */
const expectedOf = (drawn: Case): Expected => {
  if (declares(drawn) && !drawn.version) {
    return { _tag: "refused", rule: "well-formedness" };
  }

  if (Option.exists(drawn.encoding, (label) => unprocessable.has(label))) {
    return { _tag: "refused", rule: "reader-refusal" };
  }

  return {
    _tag: "accepted",
    encoding: Option.toArray(drawn.encoding),
    standalone: Option.toArray(drawn.standalone),
    version: drawn.version ? ["1.0"] : [],
  };
};

/**
 * Write the item back from the import's rows, as the export writes a scanned document: its tree's
 * own rows, under the ids the import wrote it under, with the `Document` row and the declaration's
 * rows the import wrote in place of the tree's, assembled and written by `unshred`.
 *
 * @param program - The import's program.
 * @param program.documents - Its documents under their ids.
 * @param program.inputs - Its rows.
 * @returns The item's bytes as the export writes them.
 */
const exportedItem = ({ documents, inputs }: ImportProgram) =>
  Effect.gen(function* exportItem() {
    const placed = documents.find(({ listed }) => listed.path === itemPath);
    if (placed === undefined) {
      assert.fail("the import lists no item document");
    }

    const tree = flatten(placed.listed.tree, placed.ids.idOf);
    const self = tree.document.node;
    const document = inputs.Document.get(self);
    if (document === undefined) {
      assert.fail("the import wrote no Document row of the item");
    }

    const owned = <Row extends { readonly node: string }>(rows: ReadonlyMap<string, Row>) =>
      [...rows.values()].filter(({ node }) => node === self);
    const assembled = yield* Effect.fromResult(
      assemble({
        ...tree,
        document: { charset: document.charset, exportCharset: document.exportCharset, node: self },
        encodingDecls: owned(inputs.EncodingDecl).map(({ encoding, node }) => ({
          encoding,
          node,
        })),
        sdDecls: owned(inputs.SdDecl).map(({ node, standalone }) => ({ node, standalone })),
        xmlDecls: owned(inputs.XmlDecl).map(({ node, version }) => ({ node, version })),
      }),
    );

    return yield* unshred(assembled, names);
  });

/**
 * Hold an accepted case's rows to what its declaration writes: each part's row exists exactly where
 * the part is written, holding it as written, on the item's document node.
 *
 * @param expected - The case's rows by hand.
 * @param inputs - The import's rows.
 * @param label - The case, for a failure's message.
 */
const assertRows = (
  expected: Extract<Expected, { readonly _tag: "accepted" }>,
  inputs: ImportProgram["inputs"],
  label: string,
): void => {
  const item = [...inputs.Document.values()].filter(({ path }) => path === itemPath);
  const nodes = item.map(({ node }) => node);
  assert.lengthOf(nodes, 1, `${label}: the item's Document row`);

  const at = (count: readonly string[]) => count.map(() => nodes[0]);

  assert.deepStrictEqual(
    [...inputs.XmlDecl.values()].map(({ version }) => version),
    expected.version,
    `${label}: XmlDecl`,
  );
  assert.deepStrictEqual(
    [...inputs.XmlDecl.values()].map(({ node }) => node),
    at(expected.version),
    `${label}: XmlDecl's node`,
  );
  assert.deepStrictEqual(
    [...inputs.EncodingDecl.values()].map(({ encoding }) => encoding),
    expected.encoding,
    `${label}: EncodingDecl`,
  );
  assert.deepStrictEqual(
    [...inputs.EncodingDecl.values()].map(({ node }) => node),
    at(expected.encoding),
    `${label}: EncodingDecl's node`,
  );
  assert.deepStrictEqual(
    [...inputs.SdDecl.values()].map(({ standalone }) => standalone),
    expected.standalone,
    `${label}: SdDecl`,
  );
  assert.deepStrictEqual(
    [...inputs.SdDecl.values()].map(({ node }) => node),
    at(expected.standalone),
    `${label}: SdDecl's node`,
  );
};

/**
 * Hold an accepted case three ways: the law oracle finds no breach, the import's rows hold each
 * part exactly where written and break no law on the host, and the export writes the item back
 * exactly, renamed to UTF-8 where the writer cannot encode the label it was read under.
 *
 * @param drawn - The case.
 * @param expected - Its rows by hand.
 * @param entries - Its package.
 * @param judgment - The law oracle's verdict on the package.
 * @param read - The import's program, or its refusal.
 * @param c - The case's notes.
 * @param c.note - Notes a situation the case reaches.
 * @returns Nothing; fails the test where any of the three departs from the specification.
 */
const heldAccepted = (
  drawn: Case,
  expected: Extract<Expected, { readonly _tag: "accepted" }>,
  entries: PackageEntries,
  judgment: Judgment,
  read: Result.Result<ImportProgram, unknown>,
  c: { readonly note: (situation: Situation) => void },
) =>
  Effect.gen(function* acceptedCase() {
    const label = Formatter.format(drawn);
    c.note(expected.version.length > 0 ? "declaration" : "no declaration");
    if (expected.encoding.length > 0) {
      c.note("encoding");
    }

    if (expected.standalone.length > 0) {
      c.note("standalone");
    }

    assert.strictEqual(judgment._tag, "Judged", `${label}: the law oracle refuses it`);
    assert.deepStrictEqual(
      judgment._tag === "Judged"
        ? judgment.breaches.map((breach) => shownBreach(breach, grammar))
        : [],
      [],
      `${label}: the law oracle`,
    );
    if (Result.isFailure(read)) {
      assert.fail(`${label}: the import refuses it: ${String(read.failure)}`);
    }

    const program = read.success;
    assertRows(expected, program.inputs, label);

    const { broken } = judgeHost(hostRowsOf(program.inputs), hostLaws);
    assert.deepStrictEqual(
      broken.map(({ law }) => Formatter.format(law)),
      [],
      `${label}: the import's rows`,
    );

    const written = entries.get(itemPath);
    if (written === undefined) {
      assert.fail(`${label}: the package holds no item`);
    }

    const text = new TextDecoder().decode(written);
    const swapped = drawn.encoding.pipe(Option.filter((held) => relabelled.has(held)));
    const back = Option.match(swapped, {
      onNone: () => text,
      onSome: (held) => {
        c.note("relabelled");

        return text.replace(`encoding="${held}"`, 'encoding="UTF-8"');
      },
    });
    const exported = yield* exportedItem(program);
    assert.strictEqual(new TextDecoder().decode(exported), back, `${label}: the export's text`);
    assert.deepStrictEqual(
      [...exported],
      [...new TextEncoder().encode(back)],
      `${label}: the export's bytes`,
    );
  });

/**
 * A situation the box must reach.
 */
type Situation =
  | "no declaration"
  | "declaration"
  | "encoding"
  | "standalone"
  | "relabelled"
  | "reader-refusal"
  | "well-formedness";

layer(NodeServices.layer, { excludeTestServices: true })("a document's XML declaration", (it) => {
  it.effect(
    "has a row of each part exactly where written, the law oracle and the import give one verdict, and the export writes it back exactly",
    (ctx) =>
      // Oracle: the specification as a checker by hand (`expectedOf`): XML 1.0 §2.8 (XMLDecl,
      // VersionInfo, EncodingDecl, SDDecl) and §4.3.3, and the export's relabelling of a label the
      // writer cannot encode (`unshred`). Bound: a version written or not, by an encoding
      // unwritten or each of seven labels, by a standalone unwritten, yes or no: 48 packages,
      // exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "an item's XML declaration: its version written or not, its encoding unwritten or each label, its standalone unwritten, yes or no",
            caseHang: Duration.minutes(2),
            coverage: requiredInSpace<Situation>([
              "no declaration",
              "declaration",
              "encoding",
              "standalone",
              "relabelled",
              "reader-refusal",
              "well-formedness",
            ]),
            generator: int(0, cases.length - 1),
            limit: cases.length,
            literal: (at) => Formatter.format(cases[at]),
            oracle: {
              kind: "specification",
              name: "XML 1.0 §2.8 and §4.3.3, by hand",
            },
            suite: "test/xml-declaration-parts",
          },
          (at, c) =>
            Effect.scoped(
              Effect.gen(function* oneCase() {
                const drawn = cases[at];
                if (drawn === undefined) {
                  assert.fail(`no case ${String(at)}`);
                }

                const label = Formatter.format(drawn);
                const expected = expectedOf(drawn);
                const entries = packageOf(drawn);
                const judgment = yield* judge(filesOf(entries), grammar, laws);
                const read = yield* Effect.result(readProgram(yield* scopedPackage(entries)));
                if (expected._tag === "refused") {
                  c.note(expected.rule);
                  assert.deepStrictEqual(
                    judgment._tag === "CodecRefusal" ? judgment.rule : judgment._tag,
                    expected.rule,
                    `${label}: the law oracle`,
                  );
                  assert.deepStrictEqual(
                    Result.isFailure(read) && read.failure._tag === "ImportRefused"
                      ? read.failure.rules.join("|")
                      : "read",
                    expected.rule,
                    `${label}: the import`,
                  );
                } else {
                  yield* heldAccepted(drawn, expected, entries, judgment, read, c);
                }
              }),
            ),
        ),
      ),
  );
});
