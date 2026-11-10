/**
 * The law oracle's reference and package laws over whole packages (plan S3, readings 102 and 103,
 * under Aiden's ruling of 2026-11-06 that an href is percent-decoded before it is resolved): each
 * example the plan and the ruling name, an item in `items/` whose body holds one reference, with
 * the nearest valid package beside each refused one.
 *
 * Each case is one item with one edit of its body, its manifest listing exactly the files the case
 * holds, so the case's verdict is its edit's: every other law holds.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf, shownBreach, verdictOf } from "#pantry/test/oracle.ts";
import type { Judgment, LawName, OracleRule } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Escape a text for an XML attribute value.
 *
 * @param text - The text.
 * @returns It, with `&`, `<` and `"` escaped.
 */
const attributeText = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

/**
 * Write the manifest of a package of one item, `items/i.xml`, its resource listing the item and
 * each other file, every file href written as given; under a resource `xml:base`, which the cases
 * set to `items/`, the item's hrefs are written relative to it.
 *
 * @param fileHrefs - The other files' hrefs, each a `cp:file`.
 * @param resourceBase - The resource's `xml:base`, or none.
 * @returns The manifest's text.
 */
const manifestOf = (fileHrefs: readonly string[], resourceBase?: string): string => {
  const item = resourceBase === undefined ? "items/i.xml" : "i.xml";

  return `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="${item}"${
    resourceBase === undefined ? "" : ` xml:base="${attributeText(resourceBase)}"`
  }><file href="${item}"/>${fileHrefs
    .map((href) => `<file href="${attributeText(href)}"/>`)
    .join("")}</resource></resources>
</manifest>`;
};

/**
 * One package of the cases: the item's body, the entries beside the item and the manifest, the
 * manifest's file hrefs for them, and the law and rule it is refused under, or none for a package
 * every law holds of.
 */
interface HrefCase {
  readonly body: string;
  readonly entries: readonly string[];
  readonly files?: readonly string[];
  readonly name: string;
  readonly refused?: { readonly law: LawName; readonly rule: OracleRule };
  readonly resourceBase?: string;
}

/**
 * Write a case's package: the manifest, the item and each entry, as `readEntries` reads one.
 *
 * @param input - The case.
 * @returns The package's entries.
 */
const packageOf = (input: HrefCase): readonly PackageFile[] =>
  [
    { path: "imsmanifest.xml", text: manifestOf(input.files ?? input.entries, input.resourceBase) },
    {
      path: "items/i.xml",
      text: `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body>${input.body}</qti-item-body></qti-assessment-item>`,
    },
    ...input.entries.map((path) => ({ path, text: "x" })),
  ].map(({ path, text }): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));

/**
 * Write a judgment for an assertion's message: its verdict, or its breaches line by line.
 *
 * @param judgment - The judgment.
 * @returns The text.
 */
const shown = (judgment: Judgment): string =>
  judgment._tag === "Judged"
    ? judgment.breaches.map((breach) => shownBreach(breach, grammar)).join("\n")
    : `the codec refused the package: ${judgment.rule}, ${judgment.detail}`;

/**
 * An image of a source path, as the cases write one.
 *
 * @param src - The `src`.
 * @param base - The image's `xml:base`, or none.
 * @returns The body.
 */
const image = (src: string, base?: string): string =>
  `<p><img src="${attributeText(src)}" alt="a"${base === undefined ? "" : ` xml:base="${attributeText(base)}"`}/></p>`;

/**
 * The cases: plan S3's list and Aiden's ruling, each refused one beside its nearest valid package.
 */
const cases: readonly HrefCase[] = [
  {
    body: image("images/../images/sign.png"),
    entries: ["items/images/sign.png"],
    name: "a dot segment after a plain one, naming the entry it resolves to",
  },
  {
    body: image("sign.png", "images/"),
    entries: ["items/images/sign.png"],
    name: "an img whose xml:base is a directory",
  },
  {
    body: image("my sign.png"),
    entries: ["items/my sign.png"],
    name: "a literal space naming the entry with a space",
  },
  {
    body: image("my%20sign.png"),
    entries: ["items/my sign.png"],
    name: "a percent-encoded space naming the entry with a space",
  },
  {
    body: image("my%20sign.png"),
    entries: ["items/my sign.png"],
    files: ["items/my%20sign.png"],
    name: "a manifest href percent-encoded too",
  },
  {
    body: image("../../a.png"),
    entries: [],
    name: "a climb above the package root, external",
  },
  {
    body: image("a/./b.png"),
    entries: ["items/a/b.png"],
    name: "a ./ segment inside a path",
  },
  {
    body: image("a/b/.."),
    entries: ["items/a/b.png"],
    name: "a trailing .. naming a directory",
    refused: { law: "File exists", rule: "file-exists" },
  },
  {
    body: image("a.png", "http://x/"),
    entries: [],
    name: "an xml:base with a scheme making its scope external",
  },
  {
    body: image("missing.png"),
    entries: ["items/other.png"],
    name: "a path naming no entry",
    refused: { law: "File exists", rule: "file-exists" },
  },
  {
    body: image("a%2Fb.png"),
    entries: ["items/a/b.png"],
    name: "an encoded slash, a stated limit",
    refused: { law: "Href form", rule: "href-form" },
  },
  {
    body: image("a%FF.png"),
    entries: ["items/a.png"],
    name: "octets that are no UTF-8, a stated limit",
    refused: { law: "Href form", rule: "href-form" },
  },
  {
    body: image("a\\b.png"),
    entries: ["items/a/b.png"],
    name: "a backslash, a stated limit",
    refused: { law: "Href form", rule: "href-form" },
  },
  {
    body: `<p><picture><source srcset="a.png 1x"/><img src="a.png" alt="a"/></picture></p>`,
    entries: ["items/a.png"],
    name: "a srcset with a descriptor, a stated limit",
    refused: { law: "Href form", rule: "href-form" },
  },
  {
    body: image("../c.png"),
    entries: ["c.png"],
    files: ["../c.png"],
    name: "a manifest file href under a resource's climbing xml:base",
    resourceBase: "items/",
  },
];

describe("test/oracle.ts, hrefs resolved at import (RV-P)", () => {
  for (const input of cases) {
    it.effect(`${input.refused === undefined ? "accepts" : "refuses"} ${input.name}`, () =>
      // Oracle: the specification as a checker, RFC 3986 §5.2 with §2.1's decoding as reading 102
      // reads it, and IMS Content Packaging 1.2's InterchangePackage (b) and (d) and Base class.
      Effect.gen(function* judged() {
        const judgment = yield* judge(packageOf(input), grammar, laws);

        assert.deepStrictEqual(
          verdictOf(judgment),
          input.refused === undefined
            ? { verdict: "accepted" }
            : { rule: input.refused.rule, verdict: "refused" },
          shown(judgment),
        );
        if (input.refused !== undefined && judgment._tag === "Judged") {
          assert.include(
            judgment.breaches.map(({ law }) => law),
            input.refused.law,
            shown(judgment),
          );
        }
      }),
    );
  }
});
