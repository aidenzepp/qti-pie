/**
 * The XDM round trip over the corpus (plan Q4.02): every XML entry of every corpus package, read by
 * crust, shredded through the composed grammar, flattened to rows, assembled back and unshredded to
 * bytes, then compared with the entry it was read from.
 *
 * Today's export writes a stored file back as its bytes, and a document's tree through crust's
 * writer in its export label, with the declaration naming that label (`src/export/package.ts`);
 * `src/export/compare.ts` holds a written tree to canonical equality. So an entry passes in one of
 * two ways:
 *
 * - **byte-identical:** the bytes out are the entry's bytes;
 * - **canonical-equal:** the bytes out are the export bytes of the tree crust read, after what the
 *   XDM does not record (`src/model/unshred.ts`: a CDATA section is plain text, a stretch of
 *   character data is one run, and namespace declarations come before the attributes), and the
 *   canonical forms agree, crust's `canonicalize` and the `xmllint` oracle's. Canonical XML erases
 *   both crust's writer and those erasures, so these are the bytes that legitimately differ, and
 *   the byte check keeps what canonical XML hides, such as attribute order, from passing.
 *
 * Anything else fails with its causes. An entry crust does not read, or that shred refuses at the
 * codec (`not-qti3`, `unmodeled-vocabulary`), is not shredded and is only counted. The run is gated
 * on `GR8DES_CORPUS=1` and opens no database. It logs one line per entry and the counts, which
 * vitest shows for a passing run under `--disableConsoleIntercept`; a failing run's assertion lists
 * every failed entry with its causes.
 */
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option, Result } from "effect";
import type { PlatformError } from "effect";
import type { ChildProcessSpawner } from "effect/process";
import { composed } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import type { NotQti3, ShredGrammar } from "#pantry/model/shred.ts";
import { unshred } from "#pantry/model/unshred.ts";
import type { XdmNames } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, XdmDocument } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { settings } from "#pantry/test/settings.ts";
import { xmllintC14n } from "#pantry/xml/oracle.ts";
import type { OracleError, OracleUnavailable } from "#pantry/xml/oracle.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { exportCharset } from "@qti-pie/crust/charset.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import type { EncodeError } from "@qti-pie/crust/errors.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Attribute, Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 134.8 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The corpus this test reads: the 28 packages `materializeCorpus` lists from the pinned examples
 * tarball, which hold 380 entries whose names end `.xml`. Both are pinned so that a run over a
 * missing or different corpus fails rather than passing over fewer entries.
 */
const corpus = { entries: 380, packages: 28 } as const;

/**
 * The namespace of the content package's elements, which a manifest's `schemaversion` is in.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The namespace name every namespace declaration's attribute is in, as crust's reader resolves it.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * Where the bytes out are written for the oracle to read: a scoped directory under the package's
 * `work/`, removed when the run ends.
 */
const scratchRoot = path.resolve(import.meta.dirname, "..", "..", "work", "roundtrip-corpus");

/**
 * The composed grammar as shred reads a document through it, and its names as unshred writes the
 * tree back under: the model's one projection of it (`#pantry/model/composed.ts`).
 */
const composedGrammar = Effect.map(Effect.fromResult(composed()), (grammar) => ({
  grammar: shredGrammarOf(grammar),
  names: namesOf(grammar),
}));

/**
 * Find an element's children in the content package's namespace with a local name.
 *
 * @param element - The parent.
 * @param local - The local name.
 * @returns The children, in document order.
 */
const childrenNamed = (element: Element, local: string): readonly Element[] =>
  element.children.filter(
    (child): child is Element =>
      child.kind === "element" && child.namespace === cpNamespace && child.local === local,
  );

/**
 * Find the schema version a package declares, as today's manifest reader finds it: the text of
 * the first `metadata/schemaversion` under a content package `manifest` root.
 *
 * @param files - The package's entries.
 * @returns The version as written, or none when the manifest does not read or declares none.
 */
const declaredVersion = Effect.fnUntraced(function* declaredVersion(
  files: readonly PackageFile[],
): Effect.fn.Return<Option.Option<string>> {
  const manifest = files.find(({ kind }) => kind === "manifest") ?? assert.fail("no manifest");
  const read = yield* Effect.option(readXml(manifest.bytes));

  return read.pipe(
    Option.flatMap(({ root }) =>
      root.namespace === cpNamespace && root.local === "manifest"
        ? Option.fromNullishOr(
            childrenNamed(root, "metadata")
              .flatMap((metadata) => childrenNamed(metadata, "schemaversion"))
              .map((found) =>
                found.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
              )
              .at(0),
          )
        : Option.none(),
    ),
  );
});

/**
 * Give the node numbered `index` a uuid that spells its number.
 *
 * @param index - The node's number in document order.
 * @returns A uuid whose last group is the number in hexadecimal.
 */
const idOf = (index: number): NodeId =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

/**
 * Whether an attribute is a namespace declaration.
 *
 * @param attribute - The attribute as crust read it.
 * @returns Whether it is in the `xmlns` namespace.
 */
const isDeclaration = (attribute: Attribute): boolean => attribute.namespace === xmlnsNamespace;

/**
 * Join each stretch of character data into one plain-text run and drop the empty runs, as the XDM
 * keeps character data.
 *
 * @param children - An element's children as crust read them.
 * @returns The children with every two adjacent runs joined, no run marked CDATA, and no empty run.
 */
const joinedRuns = (children: readonly Child[]): readonly Child[] => {
  const joined: Child[] = [];
  for (const child of children) {
    const last = joined.at(-1);
    if (child.kind !== "text") {
      joined.push(child);
    } else if (last?.kind === "text") {
      joined[joined.length - 1] = { ...last, value: last.value + child.value };
    } else {
      joined.push({ ...child, cdata: false });
    }
  }

  return joined.filter((child) => child.kind !== "text" || child.value !== "");
};

/**
 * Erase from an element and its subtree what the XDM does not record.
 *
 * @param element - The element as crust read it.
 * @returns The element with its namespace declarations before its other attributes, each group in
 *   source order, and its character data as {@link joinedRuns} keeps it, all the way down.
 */
const erasedElement = (element: Element): Element => ({
  ...element,
  attributes: [
    ...element.attributes.filter(isDeclaration),
    ...element.attributes.filter((attribute) => !isDeclaration(attribute)),
  ],
  children: joinedRuns(element.children).map((child) =>
    child.kind === "element" ? erasedElement(child) : child,
  ),
});

/**
 * The XDM's erasures a document's bytes can differ by, in report order.
 *
 * `cdata` is a CDATA section, written back as escaped text; `namespace order` is a namespace
 * declaration after another attribute, written back before the attributes; `runs` is two adjacent
 * runs of character data or an empty one, written back as one run.
 */
const erasures = ["cdata", "namespace order", "runs"] as const;

/**
 * One of {@link erasures}.
 */
type Erasure = (typeof erasures)[number];

/**
 * Why a canonical-equal entry's bytes out may differ from its bytes, in report order: `writer` when
 * crust's writer does not write the tree as read back as its bytes, as today's export writes every
 * tree; `charset` when the entry is exported in another label than it was read under; and each
 * erasure the tree is subject to.
 */
const reasons = ["writer", "charset", ...erasures] as const;

/**
 * One of {@link reasons}.
 */
type Reason = (typeof reasons)[number];

/**
 * Whether a reason is one of the XDM's erasures, rather than crust's writer or the export label.
 *
 * @param reason - The reason.
 * @returns Whether {@link erasures} holds it.
 */
const isErasure = (reason: Reason): boolean => erasures.some((erasure) => erasure === reason);

/**
 * Name the erasures a document's tree is subject to.
 *
 * @param root - The root element as crust read it.
 * @returns Each erasure some element below the root, the root included, is subject to.
 */
const erasuresIn = (root: Element): ReadonlySet<Erasure> => {
  const found = new Set<Erasure>();
  const stack = [root];
  for (let element = stack.pop(); element !== undefined; element = stack.pop()) {
    const firstOther = element.attributes.findIndex((attribute) => !isDeclaration(attribute));
    if (firstOther !== -1 && element.attributes.slice(firstOther).some(isDeclaration)) {
      found.add("namespace order");
    }

    for (const [at, child] of element.children.entries()) {
      if (child.kind === "element") {
        stack.push(child);
      } else if (child.kind === "text") {
        if (child.cdata) {
          found.add("cdata");
        }

        if (child.value === "" || element.children[at + 1]?.kind === "text") {
          found.add("runs");
        }
      }
    }
  }

  return found;
};

/**
 * Encode a document as today's export writes a tree: in the label `exportCharset` decides from the
 * label it was read under, its XML declaration naming that label when it differs.
 *
 * @param doc - The document.
 * @returns Its export bytes, or crust's `EncodeError`.
 */
const exportBytes = (doc: XmlDocument): Effect.Effect<Uint8Array, EncodeError> => {
  const label = exportCharset(doc.charset, doc);

  return encode(
    label === doc.charset
      ? doc
      : {
          ...doc,
          declaration: doc.declaration.pipe(
            Option.map((declaration) => ({ ...declaration, encoding: Option.some(label) })),
          ),
        },
    label,
  );
};

/**
 * Find the first offset at which two byte strings differ.
 *
 * @param left - One byte string.
 * @param right - The other.
 * @returns The first index where they differ, the shorter length when one is a prefix of the
 *   other, or none when they are equal.
 */
const firstDifference = (left: Uint8Array, right: Uint8Array): Option.Option<number> => {
  const shared = Math.min(left.length, right.length);
  for (let offset = 0; offset < shared; offset += 1) {
    if (left[offset] !== right[offset]) {
      return Option.some(offset);
    }
  }

  return left.length === right.length ? Option.none() : Option.some(shared);
};

/**
 * Show the bytes around an offset as text, for a report line.
 *
 * @param bytes - The byte string.
 * @param offset - The offset the excerpt starts at.
 * @returns Up to 40 bytes from the offset, decoded as UTF-8 and quoted.
 */
const excerpt = (bytes: Uint8Array, offset: number): string =>
  JSON.stringify(new TextDecoder().decode(bytes.subarray(offset, offset + 40)));

/**
 * Say where two byte strings differ, for a report line.
 *
 * @param expected - The bytes the comparison expects.
 * @param actual - The bytes it got.
 * @param names - What the two are called in the report.
 * @param names.actual - The name of `actual`.
 * @param names.expected - The name of `expected`.
 * @returns The first differing offset with both excerpts from it, or none when they are equal.
 */
const differenceOf = (
  expected: Uint8Array,
  actual: Uint8Array,
  names: { readonly actual: string; readonly expected: string },
): Option.Option<string> =>
  Option.map(
    firstDifference(expected, actual),
    (offset) =>
      `at byte ${offset}: ${names.expected} ${excerpt(expected, offset)}, ${names.actual} ${excerpt(actual, offset)}`,
  );

/**
 * Whether an element or anything below it holds an entity reference, in content or in an
 * attribute value.
 *
 * @param element - The element to search.
 * @returns Whether one is found.
 */
const holdsReference = (element: Element): boolean =>
  element.attributes.some((attribute) => attribute.references.length > 0) ||
  element.children.some((child) =>
    child.kind === "entityRef" ? true : child.kind === "element" && holdsReference(child),
  );

/**
 * What the `xmllint` oracle says of the canonical forms of an entry and its bytes out.
 *
 * It does not apply where it cannot see what the entry holds: an entity reference, which it
 * expands where crust keeps it (`src/export/compare.ts`), or an entry it refuses, as C14N refuses a
 * relative namespace URI (`src/xml/canonical.corpus.test.ts`).
 */
type OracleVerdict =
  | { readonly _tag: "agrees" }
  | { readonly _tag: "differs"; readonly detail: string }
  | { readonly _tag: "inapplicable"; readonly reason: string };

/**
 * Keep the oracle's refusal of a file as a value, beside the canonical form it gives every other.
 *
 * @param error - The refusal.
 * @returns The refusal as a failed result.
 */
const asRefusal = (error: OracleError): Effect.Effect<Result.Result<never, OracleError>> =>
  Effect.succeed(Result.fail(error));

/**
 * Ask the oracle whether an entry and its bytes out have one canonical form.
 *
 * @param entry - The entry.
 * @param entry.doc - The entry as crust read it.
 * @param entry.file - The entry's file on disk.
 * @param out - The bytes out.
 * @param scratch - A file the bytes out are written to for the oracle.
 * @returns The oracle's verdict. Fails only when `xmllint` does not start or the scratch file
 *   cannot be written, which says nothing about the entry.
 */
const oracleOf = Effect.fnUntraced(function* oracleOf(
  entry: { readonly doc: XmlDocument; readonly file: string },
  out: Uint8Array,
  scratch: string,
): Effect.fn.Return<
  OracleVerdict,
  OracleUnavailable | PlatformError.PlatformError,
  ChildProcessSpawner.ChildProcessSpawner | FileSystem.FileSystem
> {
  if (holdsReference(entry.doc.root)) {
    return { _tag: "inapplicable", reason: "the entry holds an entity reference" };
  }

  const source = yield* xmllintC14n(entry.file).pipe(
    Effect.map(Result.succeed),
    Effect.catchTag("OracleError", asRefusal),
  );
  if (Result.isFailure(source)) {
    return { _tag: "inapplicable", reason: `xmllint refuses the entry: ${source.failure.message}` };
  }

  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFile(scratch, out);

  const written = yield* xmllintC14n(scratch).pipe(
    Effect.map(Result.succeed),
    Effect.catchTag("OracleError", asRefusal),
  );
  if (Result.isFailure(written)) {
    return { _tag: "differs", detail: `xmllint refuses the bytes out: ${written.failure.message}` };
  }

  return Option.match(
    differenceOf(source.success, written.success, { actual: "out", expected: "read" }),
    {
      onNone: (): OracleVerdict => ({ _tag: "agrees" }),
      onSome: (detail): OracleVerdict => ({ _tag: "differs", detail }),
    },
  );
});

/**
 * What the round trip did with one XML entry.
 *
 * `unread` is an entry crust's reader refuses, and `refused` one shred refuses at the codec, with
 * the rule and its message; neither is shredded. A shredded entry is `byte-identical`,
 * `canonical-equal` with where its bytes first differ, why they may, and the oracle's verdict, or
 * `failed` with every cause.
 */
type Outcome =
  | { readonly _tag: "byte-identical" }
  | {
      readonly _tag: "canonical-equal";
      readonly at: string;
      readonly because: readonly Reason[];
      readonly oracle: Exclude<OracleVerdict, { readonly _tag: "differs" }>;
    }
  | { readonly _tag: "failed"; readonly causes: readonly string[] }
  | {
      readonly _tag: "refused";
      readonly message: string;
      readonly rule: "not-qti3" | "unmodeled-vocabulary";
    }
  | { readonly _tag: "unread"; readonly message: string };

/**
 * A shredded entry, with what its round trip is compared against.
 */
interface Shredded {
  /**
   * The entry's bytes, as the package holds them.
   */
  readonly bytes: Uint8Array;
  /**
   * The entry as crust read it.
   */
  readonly doc: XmlDocument;
  /**
   * The entry's file on disk, for the oracle.
   */
  readonly file: string;
  readonly tree: XdmDocument<Composed>;
}

/**
 * Round-trip a shredded entry through flatten, assemble and unshred, and judge the bytes out.
 *
 * @param entry - The shredded entry.
 * @param names - The names unshred writes the tree under.
 * @param scratch - A file the bytes out are written to for the oracle.
 * @returns `byte-identical`, `canonical-equal` or `failed`, as {@link Outcome} says. Fails only as
 *   {@link oracleOf} does.
 */
const roundTrip = Effect.fn("roundtrip.corpus.roundTrip")(function* roundTrip(
  entry: Shredded,
  names: XdmNames<Composed>,
  scratch: string,
): Effect.fn.Return<
  Outcome,
  OracleUnavailable | PlatformError.PlatformError,
  ChildProcessSpawner.ChildProcessSpawner | FileSystem.FileSystem
> {
  const { bytes, doc, tree } = entry;
  const assembled = assemble(flatten(tree, idOf));
  if (Result.isFailure(assembled)) {
    return {
      _tag: "failed",
      causes: [`assemble refuses the rows flatten writes: ${assembled.failure.message}`],
    };
  }

  const causes: string[] = isDeepStrictEqual(assembled.success, tree)
    ? []
    : ["assemble does not give back the tree flatten wrote"];
  const unshredded = yield* Effect.result(unshred(assembled.success, names));
  if (Result.isFailure(unshredded)) {
    return { _tag: "failed", causes: [...causes, `unshred: ${unshredded.failure.message}`] };
  }

  const out = unshredded.success;
  const at = differenceOf(bytes, out, { actual: "out", expected: "read" });
  if (Option.isNone(at)) {
    return causes.length === 0 ? { _tag: "byte-identical" } : { _tag: "failed", causes };
  }

  const expected = yield* Effect.result(exportBytes({ ...doc, root: erasedElement(doc.root) }));
  if (Result.isFailure(expected)) {
    causes.push(`the tree as read has no export bytes: ${expected.failure.message}`);
  } else {
    for (const detail of Option.toArray(
      differenceOf(expected.success, out, { actual: "out", expected: "export" }),
    )) {
      causes.push(`the bytes out are not the export bytes of the erased tree, ${detail}`);
    }
  }

  const reread = yield* Effect.result(readXml(out));
  if (Result.isFailure(reread)) {
    causes.push(`the bytes out do not read back: ${reread.failure.message}`);
  } else {
    for (const detail of Option.toArray(
      differenceOf(canonicalize(doc), canonicalize(reread.success), {
        actual: "out",
        expected: "read",
      }),
    )) {
      causes.push(`crust's canonical forms differ ${detail}`);
    }
  }

  const oracle = yield* oracleOf(entry, out, scratch);
  if (oracle._tag === "differs") {
    causes.push(`the oracle's canonical forms differ: ${oracle.detail}`);
  }

  if (causes.length > 0 || oracle._tag === "differs") {
    return { _tag: "failed", causes };
  }

  const asRead = yield* Effect.option(exportBytes(doc));
  const erased = erasuresIn(doc.root);
  const holds: Readonly<Record<Reason, boolean>> = {
    cdata: erased.has("cdata"),
    charset: exportCharset(doc.charset, doc) !== doc.charset,
    "namespace order": erased.has("namespace order"),
    runs: erased.has("runs"),
    writer: !Option.exists(asRead, (written) => Option.isNone(firstDifference(bytes, written))),
  };

  return {
    _tag: "canonical-equal",
    at: at.value,
    because: reasons.filter((reason) => holds[reason]),
    oracle,
  };
});

/**
 * Round-trip one entry of a package: read it, shred it in the package's version, and judge the
 * bytes out.
 *
 * @param file - The entry, its path ending `.xml`.
 * @param context - Where the entry is read and written.
 * @param context.dir - The package directory the entry is in.
 * @param context.grammar - The grammar shred reads it through.
 * @param context.names - The names unshred writes its tree under.
 * @param context.scratch - A file the bytes out are written to for the oracle.
 * @param context.version - The package's decoded schema version, or why it has none.
 * @returns The entry's outcome; a defect of the round trip is the entry's failure, so one entry
 *   cannot hide the others. Fails only as {@link oracleOf} does.
 */
const entryOutcome = Effect.fnUntraced(function* entryOutcome(
  file: PackageFile,
  context: {
    readonly dir: string;
    readonly grammar: ShredGrammar<Composed>;
    readonly names: XdmNames<Composed>;
    readonly scratch: string;
    readonly version: Result.Result<Composed["version"], NotQti3>;
  },
): Effect.fn.Return<
  Outcome,
  OracleUnavailable | PlatformError.PlatformError,
  ChildProcessSpawner.ChildProcessSpawner | FileSystem.FileSystem
> {
  const { grammar, names, scratch, version } = context;
  const doc = yield* Effect.result(readXml(file.bytes));
  if (Result.isFailure(doc)) {
    return { _tag: "unread", message: doc.failure.message };
  }

  if (Result.isFailure(version)) {
    return { _tag: "refused", message: version.failure.message, rule: "not-qti3" };
  }

  const tree = yield* Effect.result(shred(doc.success, version.success, grammar));
  if (Result.isFailure(tree)) {
    return {
      _tag: "refused",
      message: tree.failure.message,
      rule: tree.failure._tag === "NotQti3" ? "not-qti3" : "unmodeled-vocabulary",
    };
  }

  const shredded = {
    bytes: file.bytes,
    doc: doc.success,
    file: path.join(context.dir, file.path),
    tree: tree.success,
  };

  return yield* roundTrip(shredded, names, scratch).pipe(
    Effect.catchDefect((defect) =>
      Effect.succeed<Outcome>({
        _tag: "failed",
        causes: [`defect: ${defect instanceof Error ? defect.message : JSON.stringify(defect)}`],
      }),
    ),
  );
});

/**
 * Spell what the oracle said, for a report line.
 *
 * @param verdict - The oracle's verdict.
 * @returns `xmllint agrees`, `xmllint differs` or why it does not apply.
 */
const oracleLine = (verdict: OracleVerdict): string => {
  switch (verdict._tag) {
    case "agrees": {
      return "xmllint agrees";
    }
    case "differs": {
      return `xmllint differs: ${verdict.detail}`;
    }
    case "inapplicable": {
      return `xmllint does not apply: ${verdict.reason}`;
    }
    default: {
      return verdict satisfies never;
    }
  }
};

/**
 * Spell an outcome as the text of its entry's report line.
 *
 * @param outcome - The outcome.
 * @returns Its tag, then what it records.
 */
const outcomeLine = (outcome: Outcome): string => {
  switch (outcome._tag) {
    case "byte-identical": {
      return "byte-identical";
    }
    case "canonical-equal": {
      return `canonical-equal (${outcome.because.join(", ")}; ${oracleLine(outcome.oracle)}) ${outcome.at}`;
    }
    case "failed": {
      return `failed: ${outcome.causes.join("; ")}`;
    }
    case "refused": {
      return `refused ${outcome.rule}: ${outcome.message}`;
    }
    case "unread": {
      return `unread: ${outcome.message}`;
    }
    default: {
      return outcome satisfies never;
    }
  }
};

/**
 * One XML entry of the corpus and what the round trip did with it.
 */
interface Report {
  /**
   * The entry as `<package>/<path>`.
   */
  readonly entry: string;
  readonly outcome: Outcome;
}

/**
 * Spell the counts of a run, one line each.
 *
 * @param reports - Every entry's report.
 * @returns The lines: the entries not read, refused by rule, and shredded; of those, the
 *   byte-identical, the canonical-equal with how many equal the export bytes of the tree as read,
 *   how many each reason applies to and the oracle's verdicts, and the failed.
 */
const summaryOf = (reports: readonly Report[]): readonly string[] => {
  const outcomes = reports.map(({ outcome }) => outcome);
  const tagged = (tag: Outcome["_tag"]): number =>
    outcomes.filter((outcome) => outcome._tag === tag).length;
  const equal = outcomes.flatMap((outcome) =>
    outcome._tag === "canonical-equal" ? [outcome] : [],
  );
  const verdicts = [...new Set(equal.map(({ oracle }) => oracleLine(oracle)))].toSorted();
  const refusedBy = (rule: Extract<Outcome, { _tag: "refused" }>["rule"]): number =>
    outcomes.filter((outcome) => outcome._tag === "refused" && outcome.rule === rule).length;

  return [
    `xml entries: ${outcomes.length}`,
    `not read: ${tagged("unread")}`,
    `refused not-qti3: ${refusedBy("not-qti3")}`,
    `refused unmodeled-vocabulary: ${refusedBy("unmodeled-vocabulary")}`,
    `shredded: ${tagged("byte-identical") + equal.length + tagged("failed")}`,
    `  byte-identical: ${tagged("byte-identical")}`,
    `  canonical-equal only: ${equal.length}`,
    `    equal to the export bytes of the tree as read: ${equal.filter(({ because }) => !because.some(isErasure)).length}`,
    ...reasons.map(
      (reason) =>
        `    ${reason}: ${equal.filter(({ because }) => because.includes(reason)).length}`,
    ),
    ...verdicts.map(
      (verdict) =>
        `    ${verdict}: ${equal.filter(({ oracle }) => oracleLine(oracle) === verdict).length}`,
    ),
    `  failed: ${tagged("failed")}`,
  ];
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "the XDM round trip over the corpus",
  (it) => {
    it.effect.skipIf(!settings.corpusRequested)(
      "gives back every shredded XML entry byte for byte, or as the export bytes of its erased tree with its canonical form",
      () =>
        Effect.gen(function* corpusRoundTrip() {
          const fs = yield* FileSystem.FileSystem;
          const { grammar, names } = yield* composedGrammar;
          const packages = yield* materializeCorpus();
          yield* fs.makeDirectory(scratchRoot, { recursive: true });

          const scratchDir = yield* fs.makeTempDirectoryScoped({
            directory: scratchRoot,
            prefix: ".tmp-",
          });
          const scratch = path.join(scratchDir, "out.xml");
          const reports: Report[] = [];
          for (const { dir, name } of packages) {
            const files = yield* readPackage(dir);
            const version = versionOf(schemaVersions, yield* declaredVersion(files));
            for (const file of files.filter((entry) => entry.path.endsWith(".xml"))) {
              reports.push({
                entry: `${name}/${file.path}`,
                outcome: yield* entryOutcome(file, { dir, grammar, names, scratch, version }),
              });
            }
          }

          const lines = reports.map(({ entry, outcome }) => `${entry}: ${outcomeLine(outcome)}`);
          for (const line of [...lines, ...summaryOf(reports)]) {
            console.log(line);
          }

          assert.strictEqual(packages.length, corpus.packages);
          assert.strictEqual(reports.length, corpus.entries);
          assert.isTrue(
            reports.some(
              ({ outcome }) =>
                outcome._tag === "byte-identical" || outcome._tag === "canonical-equal",
            ),
            "no entry round-trips",
          );
          assert.deepStrictEqual(
            reports.flatMap(({ entry, outcome }) =>
              outcome._tag === "failed" ? [`${entry}: ${outcome.causes.join("; ")}`] : [],
            ),
            [],
          );
        }).pipe(Effect.scoped),
      { timeout: testTimeoutMs },
    );
  },
);
