/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { createHash } from "node:crypto";
import path from "node:path";
import { Config, Effect, FileSystem, Match, Option, Schema, Stream } from "effect";
import type { PlatformError } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

/**
 * The version of this module's own extraction code, one of the four inputs of every fixture's hash.
 *
 * A fix-forward of the materializer that changes what any directory holds bumps it, so the
 * corrected directories appear beside the old ones under new names instead of replacing them.
 */
export const FIXTURES_VERSION = "1" as const;

/**
 * A string edit applied to one file of a freshly extracted package, as plain data.
 *
 * An edit is part of a fixture's hash, so it stays `JSON.stringify`-able. A file is read as
 * latin1, so ASCII and single-byte text round-trips byte for byte, and is written back as
 * latin1 unless an `EncodeUtf16` edit names it. Edits of one file apply in list order.
 *
 * - `ReplaceText` replaces the one occurrence of `search` in `file` with `replacement`.
 * - `InsertAfterLine` inserts `text` as a new line after the 1-based line `line` of `file`, ended
 *   with the terminator that line has (`\r\n` or `\n`).
 * - `EncodeUtf16` writes `file` as a byte order mark `FF FE` followed by its text as UTF-16 little
 *   endian. The text is the latin1 reading of the extracted bytes, so the file must be ASCII: a
 *   multi-byte UTF-8 character would be encoded as its separate bytes, not as one character.
 */
export type TextEdit =
  | {
      readonly _tag: "ReplaceText";
      readonly file: string;
      readonly search: string;
      readonly replacement: string;
    }
  | {
      readonly _tag: "InsertAfterLine";
      readonly file: string;
      readonly line: number;
      readonly text: string;
    }
  | { readonly _tag: "EncodeUtf16"; readonly file: string };

/**
 * Where an `addFile` edit takes the new file's bytes from.
 *
 * - `{ zip, path }` is the entry `path` of the examples tarball's zip member `zip` (a tarball path
 *   ending `.zip`, so a file of another package).
 * - `{ member }` is a loose, non-zip tarball member.
 * - `{ text }` is a hand-written file, written as UTF-8.
 */
export type FileSource =
  | { readonly zip: string; readonly path: string }
  | { readonly member: string }
  | { readonly text: string };

/**
 * An edit of the package's file set, as plain data.
 *
 * - `addFile` writes `source` to `path`, making its directories.
 * - `copyFile` copies the package's file `from` to `to`, making its directories.
 * - `deleteFile` removes `path`.
 */
export type FileEdit =
  | { readonly _tag: "addFile"; readonly path: string; readonly source: FileSource }
  | { readonly _tag: "copyFile"; readonly from: string; readonly to: string }
  | { readonly _tag: "deleteFile"; readonly path: string };

/**
 * One edit of a fixture: a {@link TextEdit} of one file's text or a {@link FileEdit} of the file
 * set.
 *
 * A spec's file edits apply first, in list order, so a text edit can name a file an `addFile` or
 * `copyFile` made; its text edits then apply file by file, as {@link TextEdit} says.
 */
export type Edit = TextEdit | FileEdit;

/**
 * A fixture's whole definition: what it is called, the tarball member it comes from and the edits
 * applied to the extracted copy. Its directory is named by a hash of exactly these three values and
 * the module version.
 */
export interface FixtureSpec {
  readonly name: string;
  readonly member: string;
  readonly edits: readonly Edit[];
}

/**
 * The failure of the examples tarball as a source, never of a test's own assertion.
 *
 * `missing` is a tarball that is not at the configured path, `tar` and `unzip` are a non-zero exit
 * of that command, with its standard error as the `detail`.
 */
export class ExamplesError extends Schema.TaggedError<ExamplesError>()("ExamplesError", {
  detail: Schema.String,
  step: Schema.Literals(["tar", "unzip", "missing"]),
}) {
  /**
   * The step that failed and why, in one line.
   */
  override get message(): string {
    return `${this.step}: ${this.detail}`;
  }
}

/**
 * Compute the hex sha256 that names a fixture's directory.
 *
 * Every input is an argument, so the hash cannot depend on anything but the spec and the version a
 * caller names. The module itself always passes {@link FIXTURES_VERSION}.
 *
 * @param spec - The fixture's name, tarball member and edit list.
 * @param version - The extraction code's version.
 * @returns The 64 lower-case hex digits of the sha256 of `JSON.stringify([name, member, edits,
 *   version])`.
 */
export const transformHash = (spec: FixtureSpec, version: string): string =>
  createHash("sha256")
    .update(JSON.stringify([spec.name, spec.member, spec.edits, version]))
    .digest("hex");

/**
 * Shorten {@link transformHash} to the 12 digits that go into a directory name.
 *
 * @param spec - The fixture's name, tarball member and edit list.
 * @returns The first 12 hex digits of the hash under {@link FIXTURES_VERSION}.
 */
export const hash12 = (spec: FixtureSpec): string =>
  transformHash(spec, FIXTURES_VERSION).slice(0, 12);

/**
 * The names `materialize` accepts: `simple`, its seven variants and the eleven hand-broken
 * packages, each the same package with the edits of its row in the spec table.
 */
export const fixtureNames = [
  "simple",
  "doctype",
  "latin1",
  "external",
  "utf16",
  "windows-1252",
  "padded-attributes",
  "padded-text",
  "undeclared-response",
  "choice-in-prompt",
  "two-values-single",
  "bad-identifier-value",
  "padded-identifier-value",
  "choice-bounds",
  "identifier-mismatch",
  "title-mismatch",
  "body-empty",
  "comment-in-element",
  "bad-template-uri",
] as const;

/**
 * One of {@link fixtureNames}.
 */
export type FixtureName = (typeof fixtureNames)[number];

/**
 * The tarball member `simple` and every variant of it are extracted from.
 */
const simpleMember = "qtiv3-examples/packaging/simple/simple.zip";

/**
 * Build a `ReplaceText` edit of one file.
 *
 * @param file - The file the edit names, relative to the package directory.
 * @param search - The text to replace, which must occur exactly once when the edit applies.
 * @param replacement - The text that takes its place.
 * @returns The edit as plain data.
 */
const replaceIn = (file: string, search: string, replacement: string): Edit => ({
  _tag: "ReplaceText",
  file,
  replacement,
  search,
});

/**
 * Build the `ReplaceText` edit of `choice.xml`'s encoding declaration.
 *
 * @param label - The encoding label the declaration names instead of `UTF-8`.
 * @returns The edit as plain data.
 */
const declareEncoding = (label: string): Edit =>
  replaceIn("choice.xml", 'encoding="UTF-8"', `encoding="${label}"`);

/**
 * Build the `ReplaceText` edit that appends a character to the sentence on `choice.xml`'s line 15,
 * so the character lands inside the item body's first paragraph.
 *
 * @param character - The character to insert after `picture.`.
 * @returns The edit as plain data.
 */
const afterPicture = (character: string): Edit =>
  replaceIn("choice.xml", "in the picture.</p>", `in the picture.${character}</p>`);

/**
 * The prompt of `choice.xml`'s interaction, which `doctype` and `external` extend with an entity
 * reference.
 */
const prompt = "<qti-prompt>What does it say?</qti-prompt>";

/**
 * The last word of `choice.xml`'s `alt` text with the quote that closes the attribute, which
 * `latin1` and `external` replace.
 */
const altEnding = 'LUGGAGE UNATTENDED"';

/**
 * The item body's children of `choice.xml` (its lines 15 to 24), from the first paragraph to the
 * end of the interaction, as the CRLF text the file holds.
 */
const bodyChildren = [
  "<p>Look at the text in the picture.</p>",
  "        <p>",
  '            <img src="images/sign.png" alt="NEVER LEAVE LUGGAGE UNATTENDED"/>',
  "        </p>",
  '        <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
  "            <qti-prompt>What does it say?</qti-prompt>",
  '            <qti-simple-choice identifier="ChoiceA">You must stay with your luggage at all times.</qti-simple-choice>',
  '            <qti-simple-choice identifier="ChoiceB">Do not let someone else look after your luggage.</qti-simple-choice>',
  '            <qti-simple-choice identifier="ChoiceC">Remember your luggage when you leave.</qti-simple-choice>',
  "        </qti-choice-interaction>",
].join("\r\n");

/**
 * The first choice of `choice.xml`, which `choice-in-prompt` moves into the prompt.
 */
const firstChoice =
  '<qti-simple-choice identifier="ChoiceA">You must stay with your luggage at all times.</qti-simple-choice>';

/**
 * The spec table: one row per {@link FixtureName}, so adding a name without its row does not
 * compile.
 *
 * Every variant is `simple` with string edits to its `choice.xml` (and, for `padded-text`, its
 * manifest), each written for the CRLF text of the original:
 *
 * - `doctype` declares a general entity and an `ATTLIST` default for `adaptive`, drops the attribute
 *   from the root and uses the entity in the prompt.
 * - `latin1` declares ISO-8859-1 and holds the byte 0x85 and a character reference to U+20AC.
 * - `external` declares an external subset that is never written and refers to `&undeclared;` in the
 *   prompt and the `alt` text.
 * - `utf16` declares UTF-16 and is written as a byte order mark and UTF-16 little endian.
 * - `windows-1252` declares that label and holds the byte 0x80, the euro there.
 * - `padded-attributes` is valid QTI whose seven `collapse`-type attribute values each carry one
 *   leading and one trailing space, with a tab character reference in a `replace`-type and a
 *   `preserve`-type attribute.
 * - `padded-text` is valid QTI whose manifest `collapse` leaf carries spaces and whose item gains a
 *   `replace` leaf holding a tab and a line feed.
 *
 * The eleven hand-broken packages each break one rule of the import guards and are otherwise
 * `simple`:
 *
 * - `undeclared-response` points the interaction at `RESP`, which no declaration names.
 * - `choice-in-prompt` moves the first choice inside the prompt.
 * - `two-values-single` gives the single-cardinality default value a second `qti-value`.
 * - `bad-identifier-value` reads `Choice A` where an identifier is due, and `padded-identifier-value`
 *   reads `ChoiceA`, which only the identifier pattern refuses.
 * - `choice-bounds` adds `min-choices="2"` beside `max-choices="1"`.
 * - `identifier-mismatch` and `title-mismatch` make the manifest's resource metadata disagree with
 *   the item (`choice2`, `Unattended Luggage 2`).
 * - `body-empty` replaces the item body's children with whitespace.
 * - `comment-in-element` puts a comment inside the first paragraph and a processing instruction
 *   inside `img`, which becomes `<img ...><?pi d?></img>`.
 * - `bad-template-uri` reads `a%zz` as the response-processing template, an invalid URI.
 */
const specs: Record<FixtureName, FixtureSpec> = {
  "bad-identifier-value": {
    edits: [
      replaceIn("choice.xml", "<qti-value>ChoiceA</qti-value>", "<qti-value>Choice A</qti-value>"),
    ],
    member: simpleMember,
    name: "bad-identifier-value",
  },
  "bad-template-uri": {
    edits: [
      replaceIn(
        "choice.xml",
        'template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"',
        'template="a%zz"',
      ),
    ],
    member: simpleMember,
    name: "bad-template-uri",
  },
  "body-empty": {
    edits: [replaceIn("choice.xml", bodyChildren, " ")],
    member: simpleMember,
    name: "body-empty",
  },
  "choice-bounds": {
    edits: [replaceIn("choice.xml", 'max-choices="1"', 'min-choices="2" max-choices="1"')],
    member: simpleMember,
    name: "choice-bounds",
  },
  "choice-in-prompt": {
    edits: [
      replaceIn(
        "choice.xml",
        `</qti-prompt>\r\n            ${firstChoice}`,
        `${firstChoice}</qti-prompt>`,
      ),
    ],
    member: simpleMember,
    name: "choice-in-prompt",
  },
  "comment-in-element": {
    edits: [
      replaceIn(
        "choice.xml",
        "<p>Look at the text in the picture.</p>",
        "<p>Look at <!-- c -->the text in the picture.</p>",
      ),
      replaceIn(
        "choice.xml",
        'alt="NEVER LEAVE LUGGAGE UNATTENDED"/>',
        'alt="NEVER LEAVE LUGGAGE UNATTENDED"><?pi d?></img>',
      ),
    ],
    member: simpleMember,
    name: "comment-in-element",
  },
  doctype: {
    edits: [
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 1,
        text: '<!DOCTYPE qti-assessment-item [<!ENTITY org "1EdTech &amp; friends"><!ATTLIST qti-assessment-item adaptive CDATA "false">]>',
      },
      replaceIn("choice.xml", ' adaptive="false"', ""),
      replaceIn("choice.xml", prompt, "<qti-prompt>What does it say? &org;</qti-prompt>"),
    ],
    member: simpleMember,
    name: "doctype",
  },
  external: {
    edits: [
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 1,
        text: '<!DOCTYPE qti-assessment-item SYSTEM "item.dtd">',
      },
      replaceIn("choice.xml", prompt, "<qti-prompt>What does it say? &undeclared;</qti-prompt>"),
      replaceIn("choice.xml", altEnding, 'LUGGAGE &undeclared;"'),
    ],
    member: simpleMember,
    name: "external",
  },
  "identifier-mismatch": {
    edits: [
      replaceIn(
        "imsmanifest.xml",
        "<imsmd:entry>choice</imsmd:entry>",
        "<imsmd:entry>choice2</imsmd:entry>",
      ),
    ],
    member: simpleMember,
    name: "identifier-mismatch",
  },
  latin1: {
    edits: [
      declareEncoding("ISO-8859-1"),
      afterPicture("\u0085"),
      replaceIn("choice.xml", altEnding, 'LUGGAGE &#x20AC;"'),
    ],
    member: simpleMember,
    name: "latin1",
  },
  "padded-attributes": {
    edits: [
      replaceIn("choice.xml", 'identifier="choice"', 'identifier=" choice "'),
      replaceIn("choice.xml", 'adaptive="false"', 'adaptive=" false "'),
      replaceIn("choice.xml", 'src="images/sign.png"', 'src=" images/sign.png "'),
      replaceIn("choice.xml", 'response-identifier="RESPONSE"', 'response-identifier=" RESPONSE "'),
      replaceIn("choice.xml", 'max-choices="1"', 'max-choices=" 1 "'),
      replaceIn("choice.xml", 'identifier="ChoiceA"', 'identifier=" ChoiceA "'),
      replaceIn(
        "choice.xml",
        'template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"',
        'template=" https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml "',
      ),
      replaceIn("choice.xml", 'title="Unattended Luggage"', 'title="Unattended&#9;Luggage"'),
      replaceIn(
        "choice.xml",
        'alt="NEVER LEAVE LUGGAGE UNATTENDED"',
        'alt="NEVER&#9;LEAVE LUGGAGE UNATTENDED"',
      ),
    ],
    member: simpleMember,
    name: "padded-attributes",
  },
  "padded-identifier-value": {
    edits: [
      replaceIn("choice.xml", "<qti-value>ChoiceA</qti-value>", "<qti-value> ChoiceA </qti-value>"),
    ],
    member: simpleMember,
    name: "padded-identifier-value",
  },
  "padded-text": {
    edits: [
      replaceIn(
        "imsmanifest.xml",
        "<imsqti:timeDependent>false</imsqti:timeDependent>",
        "<imsqti:timeDependent> false </imsqti:timeDependent>",
      ),
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 13,
        text: '<qti-outcome-declaration identifier="NOTE" cardinality="single" base-type="string"><qti-default-value><qti-value>a&#9;b&#10;c</qti-value></qti-default-value></qti-outcome-declaration>',
      },
    ],
    member: simpleMember,
    name: "padded-text",
  },
  simple: { edits: [], member: simpleMember, name: "simple" },
  "title-mismatch": {
    edits: [
      replaceIn(
        "imsmanifest.xml",
        "<imsmd:string>Unattended Luggage</imsmd:string>",
        "<imsmd:string>Unattended Luggage 2</imsmd:string>",
      ),
    ],
    member: simpleMember,
    name: "title-mismatch",
  },
  "two-values-single": {
    edits: [
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 11,
        text: "<qti-value>1</qti-value>",
      },
    ],
    member: simpleMember,
    name: "two-values-single",
  },
  "undeclared-response": {
    edits: [
      replaceIn(
        "choice.xml",
        '<qti-choice-interaction response-identifier="RESPONSE"',
        '<qti-choice-interaction response-identifier="RESP"',
      ),
    ],
    member: simpleMember,
    name: "undeclared-response",
  },
  utf16: {
    edits: [declareEncoding("UTF-16"), { _tag: "EncodeUtf16", file: "choice.xml" }],
    member: simpleMember,
    name: "utf16",
  },
  "windows-1252": {
    edits: [declareEncoding("windows-1252"), afterPicture("\u0080")],
    member: simpleMember,
    name: "windows-1252",
  },
};

/**
 * Look up the spec a fixture name stands for.
 *
 * @param name - A fixture name.
 * @returns Its spec, the same value every call.
 */
export const specOf = (name: FixtureName): FixtureSpec => specs[name];

/**
 * The four packages the importer refuses (a manifest outside the supported QTI 3 subset), which
 * the importer's tests still read, and which the package's `globalSetup` materializes once.
 */
export type RefusedPackage = "metaData" | "lti" | "CAT_Test01_Adaptive_EchoAdapt" | "sample_pci";

/**
 * Every package `materializePackage` accepts: the {@link RefusedPackage} base set, and `usageData`,
 * the published package whose usage-data documents the importer refuses.
 *
 * `usageData` stays out of {@link RefusedPackage} because that type is the `globalSetup` base set,
 * which a test pins to five keys.
 */
export type NamedPackage = RefusedPackage | "usageData";

/**
 * The tarball member of each {@link NamedPackage}.
 */
const refusedMembers: Record<NamedPackage, string> = {
  CAT_Test01_Adaptive_EchoAdapt: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip",
  lti: "qtiv3-examples/packaging/lti/lti.zip",
  metaData: "qtiv3-examples/packaging/metaData/metaData.zip",
  sample_pci: "qtiv3-examples/PCI/sample_pci.zip",
  usageData: "qtiv3-examples/packaging/usageData/usageData.zip",
};

/**
 * The tarball member of each zip {@link materializeCorpus} lists (28 of the tarball's 29 zips, the
 * QTI 2.2 archive left out), keyed by the zip's file name without `.zip`.
 */
const zipMembers = {
  BBQsTest: "qtiv3-examples/packaging/BBQsTest/BBQsTest.zip",
  BPIG_22April: "QTI3_BPIG_Examples/BPIG_22April.zip",
  BegGuide_March2025: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip",
  CASE: "qtiv3-examples/packaging/CASE/CASE.zip",
  CASEWithOutcome: "qtiv3-examples/packaging/CASEWithOutcome/CASEWithOutcome.zip",
  CAT_Test01_Adaptive_EchoAdapt: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip",
  basicFeedbackTest: "qtiv3-examples/packaging/basicFeedbackTest/basicFeedbackTest.zip",
  ccPackage: "qtiv3-examples/packaging/ccPackage/ccPackage.zip",
  englishBasicLevelV2: "qtiv3-examples/packaging/englishBasicLevelV2/englishBasicLevelV2.zip",
  englishHighLevelV2: "qtiv3-examples/packaging/englishHighLevelV2/englishHighLevelV2.zip",
  externalMetadata: "qtiv3-examples/packaging/externalMetadata/externalMetadata.zip",
  feedbackTest: "qtiv3-examples/packaging/feedbackTest/feedbackTest.zip",
  interactionMixSaxonyV3:
    "qtiv3-examples/packaging/interactionMixSaxonyV3/interactionMixSaxonyV3.zip",
  items: "qtiv3-examples/packaging/items/items.zip",
  lti: "qtiv3-examples/packaging/lti/lti.zip",
  maxfiles: "qtiv3-examples/packaging/maxfiles/maxfiles.zip",
  metaData: "qtiv3-examples/packaging/metaData/metaData.zip",
  pci_item_examples: "qtiv3-examples/packaging/pci/pci_item_examples.zip",
  pci_simple_example: "qtiv3-examples/packaging/pci-simple/pci_simple_example.zip",
  sample_pci: "qtiv3-examples/PCI/sample_pci.zip",
  "shared-vocabulary-imsmanifest":
    "qtiv3-examples/items/shared-vocabulary/shared-vocabulary-imsmanifest.zip",
  sharedMedia: "qtiv3-examples/packaging/sharedMedia/sharedMedia.zip",
  sharedStimulus: "qtiv3-examples/packaging/sharedStimulus/sharedStimulus.zip",
  simple: "qtiv3-examples/packaging/simple/simple.zip",
  svg: "qtiv3-examples/packaging/svg/svg.zip",
  testWithLti: "qtiv3-examples/packaging/testWithLti/testWithLti.zip",
  test_package_minfiles: "qtiv3-examples/packaging/test_package_minfiles/test_package_minfiles.zip",
  usageData: "qtiv3-examples/packaging/usageData/usageData.zip",
} as const;

/**
 * The name of one zip of the corpus, the key of its row in the table of members.
 */
export type ZipName = keyof typeof zipMembers;

/**
 * The one zip of the tarball the corpus leaves out: a QTI 2.2 items archive, not a QTI 3 package.
 */
const corpusExcludedMember = "qtiv2p2-examples/items/items.zip";

/**
 * The root every fixture directory lives under, relative to the test runner's working directory
 * (`packages/qti`) unless the environment gives an absolute path.
 */
const fixturesRoot = Config.NonEmptyString("GR8DES_QTI_FIXTURES").pipe(
  Config.withDefault("work/fixtures"),
);

/**
 * The examples tarball, read from `GR8DES_QTI_EXAMPLES`, or else from the shared cache under
 * `HOME`.
 */
export const examplesTarball = Effect.gen(function* examplesTarball() {
  const configured = yield* Config.option(Config.NonEmptyString("GR8DES_QTI_EXAMPLES"));

  if (Option.isSome(configured)) {
    return configured.value;
  }

  const home = yield* Config.NonEmptyString("HOME");

  return `${home}/.cache/gr8des/qti3-examples/qti-examples-0a92fbb.tar.gz`;
});

/**
 * Collect a byte stream into text.
 *
 * @param bytes - A process's output stream.
 * @returns The whole stream decoded as UTF-8.
 */
const collect = (bytes: Stream.Stream<Uint8Array, PlatformError.PlatformError>) =>
  Stream.mkString(Stream.decodeText(bytes));

/**
 * Run `tar` or `unzip` to completion and return what it wrote to standard output.
 *
 * @param step - The command to run, which names the failure when it exits non-zero.
 * @param args - The command's arguments.
 * @returns The standard output, or an {@link ExamplesError} carrying the exit code and standard
 *   error.
 */
const run = Effect.fn("fixtures.run")(function* run(
  step: "tar" | "unzip",
  args: readonly string[],
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const result = yield* Effect.scoped(
    Effect.gen(function* collectOutput() {
      const handle = yield* spawner.spawn(ChildProcess.make(step, args, { stdin: "ignore" }));

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: collect(handle.stderr),
          stdout: collect(handle.stdout),
        },
        { concurrency: "unbounded" },
      );
    }),
  );

  if (result.code !== ChildProcessSpawner.ExitCode(0)) {
    return yield* new ExamplesError({
      detail: `\`${step} ${args.join(" ")}\` exited ${result.code}: ${result.stderr.trim()}`,
      step,
    });
  }

  return result.stdout;
});

/**
 * List the tarball: its one top directory and every member under it.
 *
 * @param tarball - The path of the examples tarball.
 * @returns `top`, the tarball's single top-level directory, and `members`, every entry under it
 *   as a path relative to `top` (directories end in `/`), or an {@link ExamplesError}.
 */
const listTarball = Effect.fn("fixtures.listTarball")(function* listTarball(tarball: string) {
  const fs = yield* FileSystem.FileSystem;

  if (!(yield* fs.exists(tarball))) {
    return yield* new ExamplesError({
      detail: `the examples tarball is not at ${tarball}; fetch qti-examples-0a92fbb.tar.gz into ~/.cache/gr8des/qti3-examples/ or point GR8DES_QTI_EXAMPLES at it`,
      step: "missing",
    });
  }

  const entries = (yield* run("tar", ["-tzf", tarball])).split("\n").filter((line) => line !== "");
  const top = (entries[0] ?? "").replace(/\/$/u, "");
  const members = entries
    .filter((entry) => entry.startsWith(`${top}/`))
    .map((entry) => entry.slice(top.length + 1))
    .filter((member) => member !== "");

  return { members, top };
});

/**
 * Delete every Finder metadata file the extraction left in a package directory.
 *
 * @param pkg - The extracted package directory.
 * @returns Completes once no `.DS_Store` remains anywhere under `pkg`.
 */
const removeFinderMetadata = Effect.fn("fixtures.removeFinderMetadata")(
  function* removeFinderMetadata(pkg: string) {
    const fs = yield* FileSystem.FileSystem;
    const entries = yield* fs.readDirectory(pkg, { recursive: true });

    yield* Effect.forEach(
      entries.filter((entry) => entry === ".DS_Store" || entry.endsWith("/.DS_Store")),
      (entry) => fs.remove(`${pkg}/${entry}`),
      { discard: true },
    );
  },
);

/**
 * Replace the one occurrence of a string in text.
 *
 * @param text - The file's text.
 * @param edit - The edit naming `search` and `replacement`.
 * @returns `text` with `search` replaced; throws when `search` does not occur exactly once.
 */
const replaceOnce = (text: string, edit: Extract<TextEdit, { _tag: "ReplaceText" }>): string => {
  const first = text.indexOf(edit.search);
  const occurrences = text.split(edit.search).length - 1;

  if (first === -1 || occurrences !== 1) {
    throw new Error(
      `edit of ${edit.file}: ${JSON.stringify(edit.search)} occurs ${occurrences} times, and must occur exactly once; give the search enough surrounding text to be unique`,
    );
  }

  return text.slice(0, first) + edit.replacement + text.slice(first + edit.search.length);
};

/**
 * Insert a line after a numbered line of text.
 *
 * @param text - The file's text.
 * @param edit - The edit naming the 1-based `line` and the `text` to insert.
 * @returns `text` with the new line after line `line`; throws when `text` has no such line.
 */
const insertAfterLine = (
  text: string,
  edit: Extract<TextEdit, { _tag: "InsertAfterLine" }>,
): string => {
  let end = -1;

  for (let seen = 0; seen < edit.line; seen += 1) {
    end = text.indexOf("\n", end + 1);

    if (end === -1) {
      throw new Error(
        `edit of ${edit.file}: there is no line ${edit.line} to insert after, and the text ends a line with a line feed only after its first ${seen}`,
      );
    }
  }

  const terminator = text[end - 1] === "\r" ? "\r\n" : "\n";

  return text.slice(0, end + 1) + edit.text + terminator + text.slice(end + 1);
};

/**
 * Apply one edit to a file's text.
 *
 * @param text - The file's text.
 * @param edit - The edit to apply.
 * @returns The edited text; an `EncodeUtf16` edit leaves the text as it is, because it only changes
 *   how the bytes are written.
 */
const applyEdit = (text: string, edit: TextEdit): string =>
  Match.value(edit).pipe(
    Match.tag("ReplaceText", (replace) => replaceOnce(text, replace)),
    Match.tag("InsertAfterLine", (insert) => insertAfterLine(text, insert)),
    Match.tag("EncodeUtf16", () => text),
    Match.exhaustive,
  );

/**
 * Apply the edits that name one file to that file's bytes.
 *
 * The text is read as latin1 and written as latin1, so the bytes an edit does not touch survive
 * exactly. This is pure so a test can read each edit's effect without a tarball.
 *
 * @param original - The file's bytes as extracted.
 * @param edits - The edits that name this file, in order.
 * @returns The edited bytes. Throws, a defect, when an edit does not apply (a search that does not
 *   occur exactly once, a line that does not exist) or the text holds a character latin1 cannot
 *   write.
 */
export const editBytes = (original: Uint8Array, edits: readonly TextEdit[]): Uint8Array => {
  let text = Buffer.from(original).toString("latin1");

  for (const edit of edits) {
    text = applyEdit(text, edit);
  }

  if (edits.some((edit) => edit._tag === "EncodeUtf16")) {
    return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);
  }

  if (/[\u{100}-\u{10FFFF}]/u.test(text)) {
    throw new Error(
      "an edit put a character above U+00FF into a file written as latin1; write it as a character reference, or add an EncodeUtf16 edit",
    );
  }

  return Buffer.from(text, "latin1");
};

/**
 * Whether an edit changes one file's text, as opposed to the package's file set.
 *
 * @param edit - Any edit.
 * @returns `true` for a {@link TextEdit}.
 */
const isTextEdit = (edit: Edit): edit is TextEdit =>
  edit._tag === "ReplaceText" || edit._tag === "InsertAfterLine" || edit._tag === "EncodeUtf16";

/**
 * Apply a spec's text edits to the files they name, inside an extracted package directory.
 *
 * @param pkg - The extracted package directory.
 * @param edits - The spec's text edits.
 * @returns Completes once every named file has been rewritten once.
 */
const applyTextEdits = Effect.fn("fixtures.applyTextEdits")(function* applyTextEdits(
  pkg: string,
  edits: readonly TextEdit[],
) {
  const fs = yield* FileSystem.FileSystem;

  yield* Effect.forEach(
    new Set(edits.map((edit) => edit.file)),
    (file) =>
      Effect.gen(function* rewrite() {
        const original = yield* fs.readFile(`${pkg}/${file}`);

        yield* fs.writeFile(
          `${pkg}/${file}`,
          editBytes(
            original,
            edits.filter((edit) => edit.file === file),
          ),
        );
      }),
    { discard: true },
  );
});

/**
 * Extract one tarball member, as a file, into a directory.
 *
 * @param tarball - The examples tarball.
 * @param top - The tarball's top-level directory.
 * @param member - The member's path below `top`.
 * @param into - The directory the member lands in, as `<into>/<member>`.
 * @returns Completes once the file exists.
 */
const extractMember = Effect.fn("fixtures.extractMember")(function* extractMember(
  tarball: string,
  top: string,
  member: string,
  into: string,
) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(into, { recursive: true });
  yield* run("tar", ["-xzf", tarball, "-C", into, "--strip-components", "1", `${top}/${member}`]);
});

/**
 * Write one file of a package, making its directories.
 *
 * @param file - The file's path.
 * @param bytes - The bytes to write.
 * @returns Completes once the file exists.
 */
const writeInto = Effect.fn("fixtures.writeInto")(function* writeInto(
  file: string,
  bytes: Uint8Array,
) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(path.dirname(file), { recursive: true });
  yield* fs.writeFile(file, bytes);
});

/**
 * Apply one file-set edit inside an extracted package directory.
 *
 * @param pkg - The extracted package directory.
 * @param tmp - The build's temporary directory, where a source's tarball member is extracted.
 * @param tarball - The examples tarball.
 * @param top - The tarball's top-level directory.
 * @param index - The edit's place in the list, which names its scratch directory.
 * @param edit - The edit.
 * @returns Completes once the package holds the edit's result.
 */
const applyFileEdit = Effect.fn("fixtures.applyFileEdit")(function* applyFileEdit(
  pkg: string,
  tmp: string,
  tarball: string,
  top: string,
  index: number,
  edit: FileEdit,
) {
  const fs = yield* FileSystem.FileSystem;

  if (edit._tag === "deleteFile") {
    return yield* fs.remove(`${pkg}/${edit.path}`);
  }

  if (edit._tag === "copyFile") {
    yield* fs.makeDirectory(path.dirname(`${pkg}/${edit.to}`), { recursive: true });

    return yield* fs.copyFile(`${pkg}/${edit.from}`, `${pkg}/${edit.to}`);
  }

  const { source } = edit;
  const scratch = `${tmp}/edit-${index}`;

  if ("text" in source) {
    return yield* writeInto(`${pkg}/${edit.path}`, new TextEncoder().encode(source.text));
  }

  if ("member" in source) {
    yield* extractMember(tarball, top, source.member, scratch);

    return yield* writeInto(
      `${pkg}/${edit.path}`,
      yield* fs.readFile(`${scratch}/${source.member}`),
    );
  }

  yield* extractMember(tarball, top, source.zip, scratch);
  yield* run("unzip", [
    "-q",
    "-o",
    `${scratch}/${source.zip}`,
    source.path,
    "-d",
    `${scratch}/zip`,
  ]);

  return yield* writeInto(
    `${pkg}/${edit.path}`,
    yield* fs.readFile(`${scratch}/zip/${source.path}`),
  );
});

/**
 * Extract and derive a spec's package into `<tmp>/pkg`.
 *
 * The recipe is `tar` of the one member, then `unzip` of it when it is a zip (a loose member is
 * placed as `<tmp>/pkg/<basename>` instead), deletion of `.DS_Store`, the spec's file edits in list
 * order, then its text edits, all inside the temporary directory so nothing is visible under the
 * root yet.
 *
 * @param spec - The fixture's spec.
 * @param tarball - The examples tarball.
 * @param tmp - The fresh temporary directory to work in.
 * @returns Completes once `<tmp>/pkg` holds the finished package.
 */
const build = Effect.fn("fixtures.build")(function* build(
  spec: FixtureSpec,
  tarball: string,
  tmp: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const { top } = yield* listTarball(tarball);

  yield* extractMember(tarball, top, spec.member, `${tmp}/src`);

  if (spec.member.endsWith(".zip")) {
    yield* run("unzip", ["-q", "-o", `${tmp}/src/${spec.member}`, "-d", `${tmp}/pkg`]);
  } else {
    yield* fs.makeDirectory(`${tmp}/pkg`);
    yield* fs.copyFile(
      `${tmp}/src/${spec.member}`,
      `${tmp}/pkg/${spec.member.slice(spec.member.lastIndexOf("/") + 1)}`,
    );
  }

  yield* removeFinderMetadata(`${tmp}/pkg`);
  yield* Effect.forEach(
    spec.edits.filter((edit): edit is FileEdit => !isTextEdit(edit)),
    (edit, index) => applyFileEdit(`${tmp}/pkg`, tmp, tarball, top, index, edit),
    { discard: true },
  );
  yield* applyTextEdits(`${tmp}/pkg`, spec.edits.filter(isTextEdit));
});

/**
 * Return a materialized path, making it first when it is absent.
 *
 * A materialized path is immutable and appears only by one `rename`:
 *
 * - A present target is returned and nothing is written.
 * - An absent target is built in a fresh `<root>/.tmp-<random>/`, then `<tmp>/pkg` is `rename`d into
 *   place as the target. The loser of two concurrent builds sees its `rename` fail, because the
 *   target appeared in the meantime. `ENOTEMPTY`, what macOS answers for a rename onto a non-empty
 *   directory, reaches Effect as reason `Unknown` rather than `AlreadyExists`, so the failure is
 *   not told apart by its reason: whenever the target exists after a failed `rename` the build lost
 *   the race, and returns the target.
 * - The temporary directory is removed when the build ends, whichever way it ends.
 *
 * Nothing under the root is written outside a `.tmp-*` directory, and there is no marker, lock or
 * sweeper: the name holds the hash of the transform, so a changed transform is a new directory.
 *
 * @param entry - The name of the directory under the root.
 * @param make - Builds the result into `<tmp>/pkg`, given the examples tarball and `tmp`.
 * @returns `<root>/<entry>`.
 */
const materializeInto = Effect.fn("fixtures.materializeInto")(function* materializeInto<E, R>(
  entry: string,
  make: (tarball: string, tmp: string) => Effect.Effect<void, E, R>,
) {
  const fs = yield* FileSystem.FileSystem;
  const root = yield* Effect.orDie(fixturesRoot);
  const target = `${root}/${entry}`;

  if (yield* fs.exists(target)) {
    return target;
  }

  const tarball = yield* Effect.orDie(examplesTarball);

  yield* fs.makeDirectory(root, { recursive: true });
  yield* Effect.gen(function* buildAndRename() {
    const tmp = yield* fs.makeTempDirectoryScoped({ directory: root, prefix: ".tmp-" });

    yield* make(tarball, tmp);
    yield* fs
      .rename(`${tmp}/pkg`, target)
      .pipe(
        Effect.catch((error) =>
          fs
            .exists(target)
            .pipe(Effect.flatMap((present) => (present ? Effect.void : Effect.fail(error)))),
        ),
      );
  }).pipe(Effect.scoped);

  return target;
});

/**
 * Return a spec's materialized directory, making it first when it is absent.
 *
 * @param spec - The fixture's spec.
 * @returns The directory `<root>/<name>-<hash12>`, built as {@link materializeInto} says.
 */
export const materializeSpec = (spec: FixtureSpec) =>
  materializeInto(`${spec.name}-${hash12(spec)}`, (tarball, tmp) => build(spec, tarball, tmp));

/**
 * Materialize a named fixture and return its directory.
 *
 * @param name - One of {@link fixtureNames}.
 * @returns `<root>/<name>-<hash12(specOf(name))>`, extracted on first use and never rewritten.
 */
export const materialize = (
  name: FixtureName,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => materializeSpec(specOf(name));

/**
 * Materialize one of the {@link NamedPackage}s the importer refuses.
 *
 * @param pkg - The package's name.
 * @returns `<root>/<pkg>-<hash12>`, a no-edit spec over the package's tarball member.
 */
export const materializePackage = (
  pkg: NamedPackage,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => materializeSpec({ edits: [], member: refusedMembers[pkg], name: pkg });

/**
 * Materialize every package of the examples tarball.
 *
 * The corpus is each zip of the tarball but {@link corpusExcludedMember}, listed from the tarball,
 * each a no-edit spec named by the zip's file name without `.zip`.
 *
 * @returns Each package's name and directory, in tarball order.
 */
export const materializeCorpus = Effect.fn("fixtures.materializeCorpus")(
  function* materializeCorpus() {
    const tarball = yield* Effect.orDie(examplesTarball);
    const { members } = yield* listTarball(tarball);

    return yield* Effect.forEach(
      members.filter((member) => member.endsWith(".zip") && member !== corpusExcludedMember),
      (member) => {
        const name = member.slice(member.lastIndexOf("/") + 1, -".zip".length);

        return materializeSpec({ edits: [], member, name }).pipe(
          Effect.map((dir) => ({ dir, name })),
        );
      },
      { concurrency: 4 },
    );
  },
);

/**
 * Materialize one corpus zip as a file, without extracting it.
 *
 * The member is extracted by `tar` into a temporary directory and `rename`d into place as built,
 * so the file is byte for byte the tarball's member.
 *
 * @param name - The zip's name, the file name of its tarball member without `.zip`.
 * @returns The file `<root>/<name>.zip-<hash12>/<name>.zip`, extracted on first use and never
 *   rewritten. The hash is {@link transformHash} of `{ name: "zip", member, edits: [] }`.
 */
export const materializeZip = (
  name: ZipName,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => {
  const member = zipMembers[name];

  return materializeInto(
    `${name}.zip-${hash12({ edits: [], member, name: "zip" })}`,
    Effect.fn("fixtures.buildZip")(function* buildZip(tarball, tmp) {
      const fs = yield* FileSystem.FileSystem;
      const { top } = yield* listTarball(tarball);

      yield* extractMember(tarball, top, member, `${tmp}/src`);
      yield* fs.makeDirectory(`${tmp}/pkg`);
      yield* fs.rename(`${tmp}/src/${member}`, `${tmp}/pkg/${name}.zip`);
    }),
  ).pipe(Effect.map((dir) => `${dir}/${name}.zip`));
};
