/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The package stage's copy guards: the facts about a package's reference rows that no statement can
 * state over stored rows, judged over the rows an import built before any of them is written (spec
 * 4.4, 4.5, 4.6, 4.9 and 4.10, rows 9, 12, 36, 48 and 50).
 *
 * The importer writes both sides of each from one source, so a breach reaches these guards only
 * through rows built by hand.
 */
import type { Fact } from "@bjornpagen/grizzle";
import { Effect, Option, Schema } from "effect";
import { typedValues } from "#pantry/schema/attribute-homes.ts";
import { resolvePackageReference } from "#pantry/import/package-reference.ts";
import { reachOf } from "#pantry/import/reach.ts";
import type { Reach, StructureDocument } from "#pantry/import/reach.ts";
import { Rows } from "#pantry/import/tree.ts";
import { prefixedReadings } from "#pantry/processing/prefixed.ts";
import { NodeXmlBase } from "#pantry/schema/attributes.ts";
import { Document } from "#pantry/schema/document.ts";
import { ExpressionSectionIdentifier, SectionIdentifierTarget } from "#pantry/schema/expression.ts";
import {
  FeedbackBlock,
  FeedbackInline,
  ModalFeedback,
  TemplateFeedbackBlock,
} from "#pantry/schema/feedback.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as reference from "#pantry/schema/reference.ts";
import { ItemStimulusRef } from "#pantry/schema/stimulus.ts";
import { PrintedVariable, PrintedVariableIndex } from "#pantry/schema/template.ts";
import * as content from "#pantry/schema/test/content.ts";
import {
  ItemRef,
  SectionRef,
  TestDocument,
  TestIdentifier,
  TestReach,
} from "#pantry/schema/test/structure.ts";

/**
 * A reference copy guard refused the rows.
 *
 * `rule` names the guard and `detail` the first row that broke it.
 */
export class ReferenceGuardRefusal extends Schema.TaggedError<ReferenceGuardRefusal>()(
  "ReferenceGuardRefusal",
  {
    detail: Schema.String,
    rule: Schema.Literals(["resolution-copy", "reach-copy", "prefixed-copy", "section-copy"]),
  },
) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The reference rows break ${this.rule}: ${this.detail}`;
  }
}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = ReferenceGuardRefusal | undefined;

const refuse = (rule: ReferenceGuardRefusal["rule"], detail: string): ReferenceGuardRefusal =>
  new ReferenceGuardRefusal({ detail, rule });

const quoted = (text: string): string => JSON.stringify(text);

/**
 * The plain text of a branded column.
 */
const text = (value: string): string => value;

/**
 * What every check reads: the rows, the documents by id, the tree each node is in, and the
 * closure `reachOf` gives over the stored structure rows (none when the section refs cycle, which
 * the package stage refuses as `section-ref-cycle` before the guards run).
 */
interface Context {
  readonly closure: Reach | undefined;
  readonly documents: ReadonlyMap<string, Fact<typeof Document>>;
  readonly rows: Rows;
  readonly trees: ReadonlyMap<string, string>;
}

/**
 * The tests that reach `document`: a test document reaches itself, a section document is reached by
 * each test the closure says, and any other document by none.
 */
const reaching = (context: Context, document: string): readonly string[] => {
  const root = context.documents.get(document)?.root;
  if (root === "test") {
    return [document];
  }

  return root === "section"
    ? (context.closure?.reachedBy ?? [])
        .filter((reached) => reached.document === document)
        .map((reached) => reached.test)
    : [];
};

/**
 * The `xml:base` values in force at `node`, outermost first: the node's own and each ancestor's.
 */
const baseChain = (rows: Rows): ((node: string) => readonly string[]) => {
  const parents = new Map<string, string>(
    Rows.of(rows, Edge).map((edge) => [edge.child, edge.parent]),
  );
  const bases = new Map<string, string>(
    Rows.of(rows, NodeXmlBase).map((row) => [row.node, text(row.value)]),
  );

  return (node) => {
    const chain: string[] = [];
    const seen = new Set<string>();
    for (
      let at: string | undefined = node;
      at !== undefined && !seen.has(at);
      at = parents.get(at)
    ) {
      seen.add(at);

      const base = bases.get(at);
      if (base !== undefined) {
        chain.push(base);
      }
    }

    return chain.toReversed();
  };
};

/**
 * The URL of each candidate of a `srcset` value, in order: a candidate is a run of non-space
 * characters, with any commas that end it dropped, then an optional descriptor up to the next comma
 * outside parentheses.
 */
const srcsetUrls = (value: string): readonly string[] => {
  const urls: string[] = [];
  let at = 0;
  while (at < value.length) {
    while (at < value.length && /[\s,]/u.test(value.charAt(at))) {
      at += 1;
    }

    const start = at;
    while (at < value.length && !/\s/u.test(value.charAt(at))) {
      at += 1;
    }

    if (at > start) {
      const url = value.slice(start, at);
      urls.push(url.replace(/,+$/u, ""));
      if (!url.endsWith(",")) {
        let depth = 0;
        while (at < value.length && (depth > 0 || value.charAt(at) !== ",")) {
          depth += value.charAt(at) === "(" ? 1 : 0;
          depth -= value.charAt(at) === ")" && depth > 0 ? 1 : 0;
          at += 1;
        }
      }
    }
  }

  return urls;
};

/**
 * The in-package URI attributes of a QTI document by element kind (spec 4.6's census).
 */
const fileAttributes: ReadonlyMap<string, readonly string[]> = new Map([
  ["a", ["href"]],
  ["audio", ["src"]],
  ["blockquote", ["cite"]],
  ["img", ["src", "longdesc"]],
  ["object", ["data"]],
  ["q", ["cite"]],
  ["qti-adaptive-engine-ref", ["href"]],
  ["qti-adaptive-settings-ref", ["href"]],
  ["qti-metadata-ref", ["href"]],
  ["qti-stylesheet", ["href"]],
  ["qti-usagedata-ref", ["href"]],
  ["source", ["src", "srcset"]],
  ["track", ["src"]],
  ["video", ["src", "poster"]],
  ["xi:include", ["href"]],
]);

/**
 * The in-package path a reference value resolves to against `document`, none when the value names
 * no file of the package or the document is not among the rows.
 */
const resolved = (
  context: Context,
  chain: (node: string) => readonly string[],
  value: string,
  document: string,
  node: string,
): string | undefined => {
  const path = context.documents.get(document)?.path;
  if (path === undefined) {
    return undefined;
  }

  const result = resolvePackageReference(value, text(path), chain(node));

  return result._tag === "InPackage" ? result.path : undefined;
};

/**
 * One kind of reference whose `href` a resolution row restates: each reference, and the path its
 * resolution row holds, by the reference's id.
 */
interface Resolved {
  readonly name: string;
  readonly paths: ReadonlyMap<string, string>;
  readonly refs: readonly {
    readonly document: string;
    readonly href: string;
    readonly id: string;
  }[];
}

/**
 * `resolution-copy` for the three reference kinds: a resolution's `path` is the `href` resolved
 * against its document, and an `href` that resolves in the package has a resolution.
 */
const refResolutions = (context: Context, chain: (node: string) => readonly string[]): Finding => {
  const { rows } = context;
  const sets: readonly Resolved[] = [
    {
      name: "ItemRefResolution",
      paths: new Map(
        Rows.of(rows, reference.ItemRefResolution).map((row) => [row.itemRef, text(row.path)]),
      ),
      refs: Rows.of(rows, ItemRef),
    },
    {
      name: "SectionRefResolution",
      paths: new Map(
        Rows.of(rows, reference.SectionRefResolution).map((row) => [
          row.sectionRef,
          text(row.path),
        ]),
      ),
      refs: Rows.of(rows, SectionRef),
    },
    {
      name: "StimulusRefResolution",
      paths: new Map(
        Rows.of(rows, reference.StimulusRefResolution).map((row) => [
          row.stimulusRef,
          text(row.path),
        ]),
      ),
      refs: Rows.of(rows, ItemStimulusRef),
    },
  ];
  for (const { name, paths, refs } of sets) {
    for (const ref of refs) {
      const expected = resolved(context, chain, text(ref.href), ref.document, ref.id);
      const stored = paths.get(ref.id);
      if (stored !== expected && !(stored === undefined && name === "ItemRefResolution")) {
        return refuse(
          "resolution-copy",
          expected === undefined
            ? `${name} ${ref.id} holds the path ${quoted(stored ?? "")}, but its href ${quoted(text(ref.href))} names no file of the package; remove the row.`
            : `${name} ${ref.id} holds ${stored === undefined ? "no row" : `the path ${quoted(stored)}`}, but its href ${quoted(text(ref.href))} resolves to ${quoted(expected)}; write that path.`,
        );
      }
    }
  }

  return undefined;
};

/**
 * `resolution-copy` for the file references: each row's `path` is the value its attribute holds,
 * resolved against its document, and each in-package value of a census attribute has a row.
 */
const fileResolutions = (context: Context, chain: (node: string) => readonly string[]): Finding => {
  const { rows } = context;
  const value = typedValues(rows);
  const stored = Rows.of(rows, reference.AttributeFileReference);
  for (const row of stored) {
    const written = value(row.node, row.kind, row.attribute);
    const candidates =
      row.attribute === "srcset" && written !== undefined ? srcsetUrls(written) : [written];
    const candidate = candidates[Number(row.position)];
    const expected =
      candidate === undefined
        ? undefined
        : resolved(context, chain, candidate, row.document, row.node);
    if (expected !== text(row.path)) {
      return refuse(
        "resolution-copy",
        `AttributeFileReference ${row.node} ${row.attribute} position ${row.position} holds the path ${quoted(text(row.path))}, but its value ${quoted(candidate ?? "")} ${expected === undefined ? "names no file of the package; remove the row" : `resolves to ${quoted(expected)}; write that path`}.`,
      );
    }
  }

  const keys = new Set(stored.map((row) => `${row.node}\n${row.attribute}\n${row.position}`));
  for (const node of Rows.of(rows, Node)) {
    for (const attribute of fileAttributes.get(node.kind) ?? []) {
      const written = value(node.id, node.kind, attribute);
      const candidates =
        attribute === "srcset" && written !== undefined ? srcsetUrls(written) : [written];
      for (const [position, candidate] of candidates.entries()) {
        const path =
          candidate === undefined
            ? undefined
            : resolved(context, chain, candidate, node.tree, node.id);
        if (path !== undefined && !keys.has(`${node.id}\n${attribute}\n${position}`)) {
          return refuse(
            "resolution-copy",
            `The ${attribute} ${quoted(candidate ?? "")} of ${node.kind} ${node.id} names the package file ${quoted(path)} and has no AttributeFileReference row; write one.`,
          );
        }
      }
    }
  }

  return undefined;
};

/**
 * `resolution-copy` (spec 4.5, 4.6; rows 9 and 36): every resolution's and
 * `AttributeFileReference`'s `path` is {@link resolvePackageReference}'s resolution of the value
 * against its document's path and `xml:base` chain, and no in-package value lacks a row.
 */
const resolutionCopy = (context: Context): Finding => {
  const chain = baseChain(context.rows);

  return refResolutions(context, chain) ?? fileResolutions(context, chain);
};

/**
 * The structure documents of `root` the stored rows hold: each one's holders, and the section
 * documents its section refs resolve to.
 */
const structureOf = (context: Context, root: "section" | "test"): readonly StructureDocument[] => {
  const { rows } = context;
  const targets = new Map(
    Rows.of(rows, reference.SectionRefResolution).map((row) => [row.sectionRef, row.document]),
  );

  return [...context.documents.values()]
    .filter((document) => document.root === root)
    .map((document) => ({
      document: document.id,
      holders: Rows.of(rows, TestIdentifier)
        .filter((row) => row.scope === document.id)
        .map((row) => ({
          holder: row.holder,
          holderKind: row.holderKind,
          identifier: text(row.identifier),
        })),
      sectionRefs: Rows.of(rows, SectionRef)
        .filter((ref) => ref.document === document.id && targets.has(ref.id))
        .map((ref) => ({ document: targets.get(ref.id) ?? "", holder: ref.id })),
    }));
};

/**
 * The first difference between the expected entries and the stored ones, each by key with the
 * value it should hold, or nothing when they are the same set.
 */
const difference = (
  expected: ReadonlyMap<string, string>,
  stored: ReadonlyMap<string, string>,
): { readonly key: string; readonly kind: "extra" | "missing" | "differs" } | undefined => {
  for (const [key, value] of expected) {
    if (!stored.has(key)) {
      return { key, kind: "missing" };
    }

    if (stored.get(key) !== value) {
      return { key, kind: "differs" };
    }
  }

  const extra = [...stored.keys()].find((key) => !expected.has(key));

  return extra === undefined ? undefined : { key: extra, kind: "extra" };
};

/**
 * What is wrong with a `TestReach` row, by how it differs from the closure.
 */
const holderFault = {
  differs:
    "written with another kind or identifier than the holder has; copy them from its TestIdentifier row",
  extra: "not among the holders the test reaches; remove it",
  missing: "missing; the test reaches that holder, so write the row",
} as const;

/**
 * `reach-copy` of `TestReach` and `TestDocument`: each is exactly the closure `reachOf` computes
 * over the stored structure rows.
 */
const closureCopy = (context: Context): Finding => {
  const { closure, rows } = context;
  if (closure === undefined) {
    return undefined;
  }

  const holders = difference(
    new Map(
      closure.reach.map((held) => [
        `${held.test}\n${held.holder}`,
        `${held.holderKind} ${held.identifier}`,
      ]),
    ),
    new Map(
      Rows.of(rows, TestReach).map((row) => [
        `${row.test}\n${row.holder}`,
        `${row.holderKind} ${text(row.identifier)}`,
      ]),
    ),
  );
  if (holders !== undefined) {
    const [test = "", holder = ""] = holders.key.split("\n");

    return refuse(
      "reach-copy",
      `TestReach for test ${test} and holder ${holder} is ${holderFault[holders.kind]}.`,
    );
  }

  const documents = difference(
    new Map(closure.documents.map((reached) => [`${reached.test}\n${reached.document}`, ""])),
    new Map(Rows.of(rows, TestDocument).map((row) => [`${row.test}\n${row.document}`, ""])),
  );
  if (documents !== undefined) {
    const [test = "", document = ""] = documents.key.split("\n");

    return refuse(
      "reach-copy",
      `TestDocument for test ${test} and document ${document} is ${documents.kind === "extra" ? "a document the test does not reach; remove it" : "missing; the test reaches that document, so write the row"}.`,
    );
  }

  return undefined;
};

/**
 * One family of per-test rows: the things that own one row per reaching test, by key and the
 * document that holds them, and the stored rows, by the owner's key and the test.
 */
interface Family {
  readonly name: string;
  readonly owners: readonly {
    readonly document: string;
    readonly key: string;
    readonly tests?: readonly string[];
  }[];
  readonly stored: readonly { readonly key: string; readonly test: string }[];
}

/**
 * `reach-copy` of one family: each owner has a row for every test that reaches its document and for
 * no other.
 */
const perTest = (context: Context, family: Family): Finding => {
  const held = Map.groupBy(family.stored, (row) => row.key);
  for (const owner of family.owners) {
    const expected = new Set(owner.tests ?? reaching(context, owner.document));
    const tests = new Set((held.get(owner.key) ?? []).map((row) => row.test));
    const missing = [...expected].find((test) => !tests.has(test));
    if (missing !== undefined) {
      return refuse(
        "reach-copy",
        `${family.name} ${owner.key.replace("\n", " ")} has no row for test ${missing}, which reaches its document ${owner.document}; write one.`,
      );
    }

    const extra = [...tests].find((test) => !expected.has(test));
    if (extra !== undefined) {
      return refuse(
        "reach-copy",
        `${family.name} ${owner.key.replace("\n", " ")} has a row for test ${extra}, which does not reach its document ${owner.document}; remove it.`,
      );
    }
  }

  return undefined;
};

/**
 * Whether a printed variable's `base` or `index` spelling is an integer, as opposed to a variable
 * name.
 */
const isInteger = (spelling: string): boolean => /^[+-]?[0-9]+$/u.test(spelling);

/**
 * The per-test families of spec 4.9 and 4.10, read from the rows: the owners are the references,
 * expressions and bound nodes whose document a test reaches.
 */
const families = (context: Context): readonly Family[] => {
  const { rows, trees } = context;
  const inSection = (node: string): boolean =>
    context.documents.get(trees.get(node) ?? "")?.root === "section";
  const document = (node: string): string => trees.get(node) ?? "";
  const itemArms = [
    ...Rows.of(rows, processing.ItemVariableRef),
    ...Rows.of(rows, processing.ItemInstanceVariableRef),
  ];
  const resolvedAs = (target: string) =>
    [
      ...Map.groupBy(
        Rows.of(rows, processing.SectionVariableResolution).filter((row) => row.target === target),
        (row) => row.ref,
      ),
    ].map(([key, resolutions]) => ({
      document: resolutions[0]?.document ?? "",
      key,
      tests: resolutions.map((row) => row.test),
    }));
  const feedback = [
    ...Rows.of(rows, FeedbackBlock),
    ...Rows.of(rows, FeedbackInline),
    ...Rows.of(rows, ModalFeedback),
    ...Rows.of(rows, TemplateFeedbackBlock),
  ].filter((row) => inSection(row.id));
  const printed = Rows.of(rows, PrintedVariable).filter((row) => inSection(row.id));
  const indexes = new Map(
    Rows.of(rows, PrintedVariableIndex).map((row) => [row.node, text(row.value)]),
  );
  const variables = printed.flatMap((row) => [
    ...(isInteger(text(row.base)) ? [] : [{ attribute: "base", id: row.id }]),
    ...(indexes.has(row.id) && !isInteger(indexes.get(row.id) ?? "")
      ? [{ attribute: "index", id: row.id }]
      : []),
  ]);

  return [
    {
      name: "SectionVariableResolution",
      owners: Rows.of(rows, processing.SectionVariableRef).map((row) => ({
        document: row.document,
        key: row.id,
      })),
      stored: Rows.of(rows, processing.SectionVariableResolution).map((row) => ({
        key: row.ref,
        test: row.test,
      })),
    },
    {
      name: "PrefixedVariableSource",
      owners: itemArms.map((row) => ({ document: row.document, key: row.id })),
      stored: Rows.of(rows, processing.PrefixedVariableSource)
        .filter((row) => row.refKind !== "sectionVariable")
        .map((row) => ({ key: row.ref, test: row.test })),
    },
    {
      name: "SectionDurationTarget",
      owners: Rows.of(rows, processing.SectionDurationRef).map((row) => ({
        document: row.document,
        key: row.id,
      })),
      stored: Rows.of(rows, processing.SectionDurationTarget)
        .filter((row) => row.refKind !== "sectionVariable")
        .map((row) => ({ key: row.ref, test: row.test })),
    },
    {
      name: "SectionIdentifierTarget",
      owners: Rows.of(rows, ExpressionSectionIdentifier).map((row) => ({
        document: document(row.node),
        key: row.node,
      })),
      stored: Rows.of(rows, SectionIdentifierTarget).map((row) => ({
        key: row.node,
        test: row.test,
      })),
    },
    {
      name: "SectionFeedbackOutcomeRef",
      owners: feedback.map((row) => ({ document: document(row.id), key: row.id })),
      stored: Rows.of(rows, content.SectionFeedbackOutcomeRef).map((row) => ({
        key: row.node,
        test: row.test,
      })),
    },
    {
      name: "SectionPrintedVariableRef",
      owners: printed.map((row) => ({ document: document(row.id), key: row.id })),
      stored: Rows.of(rows, content.SectionPrintedVariableRef).map((row) => ({
        key: row.node,
        test: row.test,
      })),
    },
    {
      name: "SectionPrintedVariableVarRef",
      owners: variables.map((row) => ({
        document: document(row.id),
        key: `${row.id}\n${row.attribute}`,
      })),
      stored: Rows.of(rows, content.SectionPrintedVariableVarRef).map((row) => ({
        key: `${row.node}\n${row.attribute}`,
        test: row.test,
      })),
    },
    {
      name: "PrefixedVariableSource of a section variable resolved as prefixed",
      owners: resolvedAs("prefixed"),
      stored: Rows.of(rows, processing.PrefixedVariableSource)
        .filter((row) => row.refKind === "sectionVariable")
        .map((row) => ({ key: row.ref, test: row.test })),
    },
    {
      name: "SectionDurationTarget of a section variable resolved as a duration",
      owners: resolvedAs("duration"),
      stored: Rows.of(rows, processing.SectionDurationTarget)
        .filter((row) => row.refKind === "sectionVariable")
        .map((row) => ({ key: row.ref, test: row.test })),
    },
  ];
};

/**
 * `reach-copy` (spec 4.4, 4.9 and 4.10; row 12): `TestReach` and `TestDocument` are the closure
 * over the stored structure rows, and each per-test row exists once for every test that reaches
 * its document and for no other.
 */
const reachCopy = (context: Context): Finding => {
  if (context.closure === undefined) {
    return undefined;
  }

  const found = closureCopy(context);
  if (found !== undefined) {
    return found;
  }

  for (const family of families(context)) {
    const refused = perTest(context, family);
    if (refused !== undefined) {
      return refused;
    }
  }

  return undefined;
};

/**
 * The name a per-test source holds for `(ref, test)`, from the arm its `source` names: a declared
 * or mapped variable's name, or a built-in's handle.
 */
const sourceNames = (rows: Rows): ReadonlyMap<string, string> =>
  new Map([
    ...Rows.of(rows, processing.PrefixedDeclared).map((row): [string, string] => [
      `${row.ref}\n${row.test}`,
      text(row.variable),
    ]),
    ...Rows.of(rows, processing.PrefixedMapped).map((row): [string, string] => [
      `${row.ref}\n${row.test}`,
      text(row.variable),
    ]),
    ...Rows.of(rows, processing.PrefixedBuiltIn).map((row): [string, string] => [
      `${row.ref}\n${row.test}`,
      row.builtIn,
    ]),
  ]);

/**
 * `prefixed-copy` (spec 4.9; row 48): in a test document, a per-test source's variable name is its
 * reference arm's `variable`.
 */
const prefixedCopy = (context: Context): Finding => {
  const { rows } = context;
  const names = sourceNames(rows);
  const variables = new Map([
    ...Rows.of(rows, processing.ItemVariableRef).map((row): [string, string] => [
      row.id,
      text(row.variable),
    ]),
    ...Rows.of(rows, processing.ItemInstanceVariableRef).map((row): [string, string] => [
      row.id,
      text(row.variable),
    ]),
  ]);
  for (const hub of Rows.of(rows, processing.PrefixedVariableSource)) {
    const written = variables.get(hub.ref);
    const name = names.get(`${hub.ref}\n${hub.test}`);
    if (
      hub.refKind !== "sectionVariable" &&
      written !== undefined &&
      name !== undefined &&
      name !== written
    ) {
      return refuse(
        "prefixed-copy",
        `PrefixedVariableSource ${hub.ref} for test ${hub.test} names the variable ${quoted(name)} through its ${hub.source} source, but the reference writes ${quoted(written)}; copy the written name.`,
      );
    }
  }

  return undefined;
};

/**
 * `section-copy` of the hub and the duration target: in a section document, their `prefix` and
 * source name are one of the readings `prefixedReadings` gives for the `sectionVariable`
 * reference's identifier.
 */
const prefixCopy = (context: Context): Finding => {
  const { rows } = context;
  const names = sourceNames(rows);
  const identifiers = new Map<string, string>(
    Rows.of(rows, processing.SectionVariableRef).map((row) => [row.id, text(row.identifier)]),
  );
  const readings = (ref: string) => prefixedReadings(identifiers.get(ref) ?? "");
  for (const hub of Rows.of(rows, processing.PrefixedVariableSource)) {
    const name = names.get(`${hub.ref}\n${hub.test}`);
    if (
      hub.refKind === "sectionVariable" &&
      identifiers.has(hub.ref) &&
      name !== undefined &&
      !readings(hub.ref).some(
        (reading) => reading.prefix === text(hub.prefix) && reading.variable === name,
      )
    ) {
      return refuse(
        "section-copy",
        `PrefixedVariableSource ${hub.ref} for test ${hub.test} has the prefix ${quoted(text(hub.prefix))} and the variable ${quoted(name)}, which are no reading of the identifier ${quoted(identifiers.get(hub.ref) ?? "")}; copy a split of the identifier as written.`,
      );
    }
  }

  for (const target of Rows.of(rows, processing.SectionDurationTarget)) {
    if (
      target.refKind === "sectionVariable" &&
      identifiers.has(target.ref) &&
      !readings(target.ref).some(
        (reading) => reading.prefix === text(target.prefix) && reading.variable === "duration",
      )
    ) {
      return refuse(
        "section-copy",
        `SectionDurationTarget ${target.ref} for test ${target.test} has the prefix ${quoted(text(target.prefix))}, which is no reading of the identifier ${quoted(identifiers.get(target.ref) ?? "")} as a duration; copy the prefix of the identifier as written.`,
      );
    }
  }

  return undefined;
};

/**
 * `section-copy` of the binding twins: a twin's `identifier` is the spelling its node holds.
 */
const twinCopy = (context: Context): Finding => {
  const { rows } = context;
  const outcomes = new Map(
    [
      ...Rows.of(rows, FeedbackBlock),
      ...Rows.of(rows, FeedbackInline),
      ...Rows.of(rows, ModalFeedback),
      ...Rows.of(rows, TemplateFeedbackBlock),
    ].map((row) => [row.id, text(row.outcomeIdentifier)]),
  );
  const printed = new Map(Rows.of(rows, PrintedVariable).map((row) => [row.id, row]));
  const indexes = new Map(
    Rows.of(rows, PrintedVariableIndex).map((row) => [row.node, text(row.value)]),
  );
  const checks = [
    ...Rows.of(rows, content.SectionFeedbackOutcomeRef).map((row) => ({
      held: text(row.identifier),
      name: `SectionFeedbackOutcomeRef ${row.node} for test ${row.test}`,
      spelling: outcomes.get(row.node),
      where: "outcomeIdentifier",
    })),
    ...Rows.of(rows, content.SectionPrintedVariableRef).map((row) => ({
      held: text(row.identifier),
      name: `SectionPrintedVariableRef ${row.node} for test ${row.test}`,
      spelling: printed.has(row.node) ? text(printed.get(row.node)?.identifier ?? "") : undefined,
      where: "identifier",
    })),
    ...Rows.of(rows, content.SectionPrintedVariableVarRef).map((row) => ({
      held: text(row.identifier),
      name: `SectionPrintedVariableVarRef ${row.node} ${row.attribute} for test ${row.test}`,
      spelling: row.attribute === "base" ? printed.get(row.node)?.base : indexes.get(row.node),
      where: row.attribute,
    })),
  ];
  const broken = checks.find(
    (check) => check.spelling === undefined || check.held !== text(check.spelling),
  );

  return broken === undefined
    ? undefined
    : refuse(
        "section-copy",
        `${broken.name} holds ${quoted(broken.held)}, but its node's ${broken.where} is ${broken.spelling === undefined ? "not written" : quoted(text(broken.spelling))}; copy the spelling the node holds.`,
      );
};

/**
 * `section-copy` (spec 4.9 and 4.10; row 50): a section document's per-test rows restate the
 * spelling they resolve.
 */
const sectionCopy = (context: Context): Finding => prefixCopy(context) ?? twinCopy(context);

/**
 * Refuse reference rows that break one of the four copies no statement can state: that a
 * resolution's path is its value resolved, that the reach and every per-test row are complete and
 * exact, that a test document's per-test source names the variable as written, and that a section
 * document's per-test rows restate the spelling they resolve.
 *
 * The first refusal found, in that order, is the failure. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link ReferenceGuardRefusal}
 *   otherwise.
 */
export const referenceGuards = Effect.fn("referenceGuards")(function* referenceGuards(
  rows: Rows,
): Effect.fn.Return<void, ReferenceGuardRefusal> {
  const documents = new Map(Rows.of(rows, Document).map((row) => [row.id, row]));
  const base = {
    documents,
    rows,
    trees: new Map(Rows.of(rows, Node).map((row) => [row.id, row.tree])),
  };
  const draft: Context = { ...base, closure: undefined };
  const closure = Option.getOrUndefined(
    yield* Effect.option(
      reachOf({ sections: structureOf(draft, "section"), tests: structureOf(draft, "test") }),
    ),
  );
  const context: Context = { ...base, closure };
  const found =
    resolutionCopy(context) ?? reachCopy(context) ?? prefixedCopy(context) ?? sectionCopy(context);
  if (found !== undefined) {
    yield* found;
  }
});
