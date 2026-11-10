/**
 * The core differential, judged on the host: one package read by the law oracle
 * (`#pantry/test/oracle.ts` `judge`, the independent implementation) and by the import's own reader
 * (`#pantry/import/program.ts` `readProgram`: its refusal, or the rows it would write), and every
 * way the two disagree, each a bug of one side.
 *
 * The contract, and nothing stronger (the verdict, the rule set and the laws of the rows, never an
 * order or a message):
 *
 * - **Totality.** Neither side dies: `readProgram` refuses or builds, the oracle judges.
 * - **The codec.** The import refuses before any row exactly when the oracle names a rule it refuses
 *   under: where the oracle's codec refuses, the import's codec refuses under the same rule; where
 *   the oracle reads every document, an import refusal must be under a rule the oracle's breaches
 *   name.
 * - **The rows hold what the oracle says the package meets.** Every law the import's rows break on
 *   the host (`#pantry/test/gen/genetic/host-laws.ts`) is a law the oracle raises, a key text past
 *   its bound included, and no row names a uuid the program did not mint.
 * - **The oracle raises only what the rows break.** A law the oracle raises whose every statement the
 *   host evaluated over the rows, and found held, is a law the database would not raise; and a key
 *   text the oracle finds past its bound in a field of a relation the import writes, no field the
 *   database fills, is in that field's rows.
 */
import {
  Array as Arr,
  Cause,
  Effect,
  Equivalence,
  Exit,
  FileSystem,
  Formatter,
  Option,
} from "effect";
import type { Path, PlatformError } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { admissionOf } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { readProgram } from "#pantry/import/program.ts";
import { refusalOf } from "#pantry/import/refusal.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { kindNamer } from "#pantry/test/gen/genetic/corpus.ts";
import type { Judgment } from "#pantry/test/gen/genetic/engine.ts";
import {
  attributeValue,
  elementsOf,
  entriesOf,
  manifestPath,
  resolvedPath,
} from "#pantry/test/gen/genetic/genome.ts";
import type { Genome } from "#pantry/test/gen/genetic/genome.ts";
import { hostVerdictOf } from "#pantry/test/gen/genetic/host-laws.ts";
import type { HostVerdict } from "#pantry/test/gen/genetic/host-laws.ts";
import { fixed } from "#pantry/test/gen/genetic/known.ts";
import type { Noise } from "#pantry/test/gen/genetic/noise.ts";
import { writePackage } from "#pantry/test/gen/every-relation.ts";
import { filledKeyTextFields, keyCopies } from "#pantry/test/key-copies.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { boundBroken, judge, ruleOf } from "#pantry/test/oracle.ts";
import type { Breach, LawName, Judgment as OracleJudgment, Laws } from "#pantry/test/oracle.ts";
import { ImportRefused } from "#pantry/import/rules.ts";
import { refusedOf } from "#pantry/test/law-names.ts";

/**
 * One way the import and the oracle disagree on a package:
 *
 * - `oracle-died`, `import-died`: a side failed to judge at all;
 * - `codec-rule`: both refuse before any row, under two rules;
 * - `codec-import-only`: the import refuses before any row under a rule the oracle does not name;
 * - `codec-oracle-only`: the oracle's codec refuses, and the import builds every row;
 * - `import-only-law`: the import's rows break a law the oracle says the package meets: by its name,
 *   the first law of it they break (`broken`, as an `invariant-rejected` outcome names it), and its
 *   witness;
 * - `oracle-only-law`: the oracle raises a law the import's rows were judged to hold;
 * - `dangling-uuid`: a row names a uuid the program did not mint;
 * - `noise-moved`: a side's verdict moved when the package took a noise no law reads
 *   (`#pantry/test/gen/genetic/noise.ts`);
 * - `lone-refusal`: the oracle breaks one law alone, and the most specific rule of the refusal the
 *   import names over the laws its rows break (`refusalOf`, as the database's outcome names it) is
 *   another rule than that law's, or the refusal carries another witness than the outcome's.
 *
 * Any of them may carry the stated limit its package falls under ({@link limitOf}), which
 * {@link signatureOf} keys it by where its plain signature is a fixed entry's.
 */
export type Disagreement = (
  | {
      readonly importRule: string;
      readonly kind: "lone-refusal";
      readonly law: LawName;
      readonly laws: string;
      readonly rule: string;
      readonly witness: string;
    }
  | {
      readonly after: string;
      readonly before: string;
      readonly kind: "noise-moved";
      readonly noise: Noise;
      readonly salt: number;
      readonly side: "import" | "oracle";
    }
  | { readonly detail: string; readonly kind: "import-died" | "oracle-died" }
  | {
      readonly field: string;
      readonly kind: "dangling-uuid";
      readonly relation: string;
      readonly value: string;
    }
  | { readonly importRule: string; readonly kind: "codec-rule"; readonly oracleRule: string }
  | {
      readonly importRule: string;
      readonly kind: "codec-import-only";
      readonly oracleRules: string;
    }
  | { readonly kind: "codec-oracle-only"; readonly oracleRule: string }
  | {
      readonly broken: Law;
      readonly kind: "import-only-law";
      readonly law: string;
      readonly rule: string;
      readonly witness: string;
    }
  | {
      readonly keys: string;
      readonly kind: "oracle-only-law";
      readonly law: LawName;
      readonly rule: string;
    }
) & { readonly limit?: Limit };

/**
 * A limit a package can fall under ({@link limitOf}): a stated limit of spec reading 1, refused on
 * both sides by a law the oracle raises or a shape the package manifest writes, or an oracle defect
 * deferred to the issue the limit names.
 */
export type Limit =
  | "a forbidden ancestor"
  | "a record file whose root is a cp:manifest"
  | "a resource href the oracle reads unresolved (#65)"
  | "an inclusion cycle"
  | "content outside xi:fallback (#66)"
  | "xml:base on a cp:resource";

/**
 * The namespace of IMS Content Packaging's elements, a package manifest's and a record file's.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The XML namespace, which `xml:base` is in.
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The namespace of IEEE LOM's elements, a resource's metadata record's.
 */
const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

/**
 * The namespace of XInclude's elements, `xi:include` and `xi:fallback`.
 */
const xincludeNamespace = "http://www.w3.org/2001/XInclude";

/**
 * Tell whether an element is a Content Packaging element of a local name.
 *
 * @param element - The element.
 * @param local - The local name, such as `manifest` or `resource`.
 * @returns Whether it is that `cp:` element.
 */
const isCp = (element: Element, local: string): boolean =>
  element.namespace === cpNamespace && element.local === local;

/**
 * Write an href in normal form (RFC 3986 §6.2.2): each percent-escape of an unreserved character or
 * a space decoded, and each `.` segment dropped.
 *
 * @param href - The href as written.
 * @returns Its normal form.
 */
const normalHref = (href: string): string =>
  href
    .replaceAll(/%(?<hex>[0-9A-Fa-f]{2})/gu, (written, hex: string) => {
      const decoded = String.fromCodePoint(Number.parseInt(hex, 16));

      return /^[\w .~-]$/u.test(decoded) ? decoded : written;
    })
    .split("/")
    .filter((segment) => segment !== ".")
    .join("/");

/**
 * Tell whether a `cp:resource`'s own `cp:metadata` holds a LOM `general` title, the record the
 * title law reads.
 *
 * @param resource - The `cp:resource`.
 * @returns Whether its metadata holds a LOM title.
 */
const lomTitled = (resource: Element): boolean =>
  resource.children.some(
    (metadata) =>
      metadata.kind === "element" &&
      isCp(metadata, "metadata") &&
      elementsOf(metadata).some(
        ({ element, parent }) =>
          element.namespace === lomNamespace &&
          element.local === "title" &&
          parent?.namespace === lomNamespace &&
          parent.local === "general",
      ),
  );

/**
 * Name the stated limit a package falls under: the first of these, in this order, that holds.
 *
 * 1. `a record file whose root is a cp:manifest`: the oracle raises "RootOfType" at a document whose
 *    root is a `cp:manifest` and which the package manifest lists as `resourcemetadata/xml`
 *    (decision 449);
 * 2. `a forbidden ancestor`: the oracle raises "N5 admitted" (decision 452's kin);
 * 3. `an inclusion cycle`: the oracle raises "Inclusion cycle" (decision 451's kin);
 * 4. `xml:base on a cp:resource`: the package manifest writes `xml:base` on a `cp:resource` (reading
 *    1's family I);
 * 5. `a resource href the oracle reads unresolved (#65)`: a `cp:resource` whose own `cp:metadata`
 *    holds a LOM `general` title has an href, its query and fragment aside, that is not in normal
 *    form (a `.` segment, or a percent-escape of an unreserved character or a space, RFC 3986
 *    §6.2.2) and whose normal form names a document of the package; the oracle's title law matches
 *    the raw href to a document's path, so it reads no object for the record (decision 469);
 * 6. `content outside xi:fallback (#66)`: an `xi:include` whose href, in normal form, names a document
 *    of the package holds an element child that is no `xi:fallback`, which reading 118 assesses
 *    laxly and the law oracle ignores (decision 469).
 *
 * A class under one of the first four is refused on both sides by the law that names it, so its
 * rows' laws decide no verdict. The last two are oracle defects their issues defer, so a fixed
 * cause they would hide stays keyed plain wherever neither holds.
 *
 * @param breaches - The oracle's breaches, none where it did not judge every law.
 * @param genome - The package.
 * @returns The limit, none where the package falls under none of the six.
 */
export const limitOf = (breaches: readonly Breach[], genome: Genome): Option.Option<Limit> => {
  const manifest = genome.find(({ path }) => path === manifestPath);
  const resources =
    manifest?.body.kind === "xml"
      ? elementsOf(manifest.body.doc.root).flatMap(({ element }) =>
          isCp(element, "resource") ? [element] : [],
        )
      : [];
  const recordFile = (path: string): boolean => {
    const document = genome.find((entry) => entry.path === path);

    return (
      document?.body.kind === "xml" &&
      isCp(document.body.doc.root, "manifest") &&
      resources.some(
        (resource) =>
          attributeValue(resource, "type") === "resourcemetadata/xml" &&
          resolvedPath(manifestPath, attributeValue(resource, "href") ?? "") === path,
      )
    );
  };
  const raised = (law: string): boolean => breaches.some((breach) => breach.law === law);
  const names = (from: string, href: string): boolean =>
    genome.some(({ path }) => path === resolvedPath(from, normalHref(href)));
  const unresolvedHref = (resource: Element): boolean => {
    const href = (attributeValue(resource, "href") ?? "").replace(/[?#].*$/su, "");

    return lomTitled(resource) && normalHref(href) !== href && names(manifestPath, href);
  };
  const outsideFallback = (path: string, include: Element): boolean =>
    include.namespace === xincludeNamespace &&
    include.local === "include" &&
    names(path, attributeValue(include, "href") ?? "") &&
    include.children.some(
      (child) =>
        child.kind === "element" &&
        !(child.namespace === xincludeNamespace && child.local === "fallback"),
    );
  const tests: readonly (readonly [Limit, () => boolean])[] = [
    [
      "a record file whose root is a cp:manifest",
      () =>
        breaches.some(
          (breach) => breach.law === "RootOfType" && recordFile(breach.keys["path"] ?? ""),
        ),
    ],
    ["a forbidden ancestor", () => raised("N5 admitted")],
    ["an inclusion cycle", () => raised("Inclusion cycle")],
    [
      "xml:base on a cp:resource",
      () =>
        resources.some((resource) =>
          resource.attributes.some(
            ({ local, namespace }) => namespace === xmlNamespace && local === "base",
          ),
        ),
    ],
    ["a resource href the oracle reads unresolved (#65)", () => resources.some(unresolvedHref)],
    [
      "content outside xi:fallback (#66)",
      () =>
        genome.some(
          ({ body, path }) =>
            body.kind === "xml" &&
            elementsOf(body.doc.root).some(({ element }) => outsideFallback(path, element)),
        ),
    ],
  ];

  return Option.map(Option.fromUndefinedOr(tests.find(([, holds]) => holds())), ([limit]) => limit);
};

/**
 * A class of disagreement, which a run keeps one candidate of and the known table records an entry
 * of (`#pantry/test/gen/genetic/known.ts`): a disagreement's kind and the law or the rules it
 * names, never its witness.
 *
 * - `import-only-law`: grizzle's law the rows break, as an `invariant-rejected` outcome names it, its
 *   selections included, so two statements of one law name (`E1 derived` above all, stated by many
 *   statements, each its own writer) are two classes, and so are two that differ by their
 *   selections alone;
 * - `oracle-only-law`: the law the oracle raises, by its name;
 * - `lone-refusal`: the lone law, the rule the import named and its witness;
 * - `dangling-uuid`: the uuid field;
 * - The codec's: the rules each side refused under;
 * - `noise-moved`: the side and the noise;
 * - `import-died`, `oracle-died`: the first line of how the side died, cut to 120 characters.
 *
 * Any of them may carry the stated limit its disagreement carries ({@link limitOf}): a class under
 * a limit is another class than its plain one.
 */
export type Signature = (
  | {
      readonly importRule: string;
      readonly kind: "lone-refusal";
      readonly law: LawName;
      readonly witness: string;
    }
  | { readonly detail: string; readonly kind: "import-died" | "oracle-died" }
  | { readonly field: string; readonly kind: "dangling-uuid"; readonly relation: string }
  | { readonly importRule: string; readonly kind: "codec-import-only" }
  | { readonly importRule: string; readonly kind: "codec-rule"; readonly oracleRule: string }
  | { readonly kind: "codec-oracle-only"; readonly oracleRule: string }
  | { readonly kind: "import-only-law"; readonly law: Law }
  | { readonly kind: "noise-moved"; readonly noise: Noise; readonly side: "import" | "oracle" }
  | { readonly kind: "oracle-only-law"; readonly law: LawName }
) & { readonly limit?: Limit };

/**
 * Key a disagreement by its class without its stated limit, as {@link signatureOf} does.
 *
 * @param disagreement - The disagreement.
 * @returns Its plain signature.
 */
const plainSignatureOf = (disagreement: Disagreement): Signature => {
  switch (disagreement.kind) {
    case "import-died":
    case "oracle-died": {
      return {
        detail: disagreement.detail.split("\n")[0]?.slice(0, 120) ?? "",
        kind: disagreement.kind,
      };
    }
    case "dangling-uuid": {
      return {
        field: disagreement.field,
        kind: disagreement.kind,
        relation: disagreement.relation,
      };
    }
    case "codec-rule": {
      return {
        importRule: disagreement.importRule,
        kind: disagreement.kind,
        oracleRule: disagreement.oracleRule,
      };
    }
    case "codec-import-only": {
      return { importRule: disagreement.importRule, kind: disagreement.kind };
    }
    case "codec-oracle-only": {
      return { kind: disagreement.kind, oracleRule: disagreement.oracleRule };
    }
    case "import-only-law": {
      return { kind: disagreement.kind, law: disagreement.broken };
    }
    case "oracle-only-law": {
      return { kind: disagreement.kind, law: disagreement.law };
    }
    case "noise-moved": {
      return { kind: disagreement.kind, noise: disagreement.noise, side: disagreement.side };
    }
    case "lone-refusal": {
      return {
        importRule: disagreement.importRule,
        kind: disagreement.kind,
        law: disagreement.law,
        witness: disagreement.witness,
      };
    }
    default: {
      return disagreement satisfies never;
    }
  }
};

/**
 * Key a disagreement by its class ({@link Signature}).
 *
 * A disagreement that carries a stated limit ({@link limitOf}) is keyed by its plain signature and
 * the limit. `judgeOne` gives it one only where its plain signature is a class of
 * `#pantry/test/gen/genetic/known.ts` `fixed`, so no signature sits in both tables: a known class
 * under a limit is recorded apart, and the fixed entry keeps guarding the cause it closed, which
 * shows again under its plain signature wherever no limit holds.
 *
 * @param disagreement - The disagreement.
 * @returns Its signature.
 */
export const signatureOf = (disagreement: Disagreement): Signature => {
  const plain = plainSignatureOf(disagreement);

  return disagreement.limit === undefined ? plain : { ...plain, limit: disagreement.limit };
};

/**
 * Whether two signatures are one class: two of `import-only-law` when grizzle's `sameLaw` holds
 * them one law (as `#pantry/import/refusal.ts` `lawNameOf` matches a law to the one `Qti` states)
 * and they carry one stated limit or none, two of any other kind when their kind and every field,
 * the limit included, are the same.
 *
 * @param left - A signature.
 * @param right - Another.
 * @returns Whether they are one class.
 */
export const sameSignature: Equivalence.Equivalence<Signature> = (left, right) =>
  left.kind === "import-only-law" || right.kind === "import-only-law"
    ? left.kind === "import-only-law" &&
      right.kind === "import-only-law" &&
      left.limit === right.limit &&
      (left.law === right.law || sameLaw(left.law, right.law))
    : Equivalence.Record(Equivalence.strictEqual<unknown>())(left, right);

/**
 * Whether a disagreement is of a class one of `signatures` records.
 *
 * @param signatures - The classes recorded.
 * @param disagreement - The disagreement.
 * @returns Whether its class is among them.
 */
export const recordsClassOf = (
  signatures: readonly Signature[],
  disagreement: Disagreement,
): boolean => {
  const signature = signatureOf(disagreement);

  return signatures.some((recorded) => sameSignature(recorded, signature));
};

/**
 * Whether a disagreement is of a class one of `signatures` records, under any stated limit or
 * under none: its plain signature is recorded. A fixed entry's cause shows again under a limit too.
 *
 * @param signatures - The plain classes recorded.
 * @param disagreement - The disagreement.
 * @returns Whether its plain class is among them.
 */
export const recordsPlainClassOf = (
  signatures: readonly Signature[],
  disagreement: Disagreement,
): boolean => {
  const signature = plainSignatureOf(disagreement);

  return signatures.some((recorded) => sameSignature(recorded, signature));
};

/**
 * Write a signature as a report line without its stated limit, as {@link shownSignature} does.
 *
 * @param signature - The signature.
 * @returns The line.
 */
const shownPlainSignature = (signature: Signature): string => {
  switch (signature.kind) {
    case "import-died":
    case "oracle-died": {
      return `${signature.kind}: ${signature.detail}`;
    }
    case "dangling-uuid": {
      return `${signature.kind}: ${signature.relation}.${signature.field}`;
    }
    case "codec-rule": {
      return `${signature.kind}: import ${signature.importRule}, oracle ${signature.oracleRule}`;
    }
    case "codec-import-only": {
      return `${signature.kind}: ${signature.importRule}`;
    }
    case "codec-oracle-only": {
      return `${signature.kind}: ${signature.oracleRule}`;
    }
    case "import-only-law": {
      return `${signature.kind}: ${Formatter.format(signature.law)}`;
    }
    case "oracle-only-law": {
      return `${signature.kind}: ${signature.law}`;
    }
    case "noise-moved": {
      return `${signature.kind}: the ${signature.side}'s verdict under ${signature.noise}`;
    }
    case "lone-refusal": {
      return `${signature.kind}: ${signature.law} named ${signature.importRule}, witness ${signature.witness}`;
    }
    default: {
      return signature satisfies never;
    }
  }
};

/**
 * Write a signature as a report line: its kind, then the law, the rules or the field it names, a
 * law in full as grizzle names it, its selections included, and the stated limit it is under, if
 * any.
 *
 * @param signature - The signature.
 * @returns The line.
 */
export const shownSignature = (signature: Signature): string =>
  signature.limit === undefined
    ? shownPlainSignature(signature)
    : `${shownPlainSignature(signature)} (under ${signature.limit})`;

/**
 * Write a disagreement as a report line: its class, then what each side said.
 *
 * @param disagreement - The disagreement.
 * @returns The line.
 */
export const shownDisagreement = (disagreement: Disagreement): string => {
  switch (disagreement.kind) {
    case "import-died":
    case "oracle-died": {
      return `${disagreement.kind}: ${disagreement.detail}`;
    }
    case "dangling-uuid": {
      return `dangling-uuid: the import writes ${disagreement.relation}.${disagreement.field} = ${disagreement.value}, an id it never minted`;
    }
    case "codec-rule": {
      return `codec-rule: the import refuses before any row under ${disagreement.importRule}, the oracle's codec under ${disagreement.oracleRule}`;
    }
    case "codec-import-only": {
      return `codec-import-only: the import refuses before any row under ${disagreement.importRule}; the oracle reads every document and names ${disagreement.oracleRules || "no rule"}`;
    }
    case "codec-oracle-only": {
      return `codec-oracle-only: the oracle's codec refuses under ${disagreement.oracleRule}; the import builds every row`;
    }
    case "import-only-law": {
      return `import-only-law: the import's rows break ${disagreement.law} (${disagreement.rule}), which the oracle does not raise: ${disagreement.witness}`;
    }
    case "oracle-only-law": {
      return `oracle-only-law: the oracle raises ${disagreement.law} (${disagreement.rule}) at ${disagreement.keys}; the import's rows hold it`;
    }
    case "noise-moved": {
      return `noise-moved: under ${disagreement.noise} (salt ${String(disagreement.salt)}), the ${disagreement.side}'s verdict moved from ${disagreement.before} to ${disagreement.after}`;
    }
    case "lone-refusal": {
      return `lone-refusal: the oracle breaks ${disagreement.law} (${disagreement.rule}) alone; the import's refusal over the laws its rows break (${disagreement.laws}) is under ${disagreement.importRule}, witness ${disagreement.witness}`;
    }
    default: {
      return disagreement satisfies never;
    }
  }
};

/**
 * A feature of one judged package, at the grain the search steers by:
 *
 * - `o:` the oracle's side: each law it raises with the element kind it broke at and the root kind of
 *   the document it broke in, its codec's rule, or its acceptance;
 * - `i:` the import's side: each rule its rows break with the stage that found it, its codec's rule,
 *   or its building every row;
 * - `v:` the pair of verdicts.
 */
export type Feature = `${"i" | "o" | "v"}:${string}`;

/**
 * Name a feature's family, the feature set its residual is counted over.
 *
 * @param feature - The feature.
 * @returns `oracle`, `import` or `verdict`.
 */
export const familyOf = (feature: Feature): string => {
  if (feature.startsWith("o:")) {
    return "oracle";
  }

  return feature.startsWith("i:") ? "import" : "verdict";
};

/**
 * What a judge reads beside the package: the grammar, the oracle's law tables, and the scratch
 * directory each candidate's package is written under for the import's reader.
 */
export interface Bench {
  readonly directory: string;
  readonly grammar: ComposedGrammar;
  readonly laws: Laws;
}

/**
 * What the law oracle did with a package: died, refused it in its codec, or judged every law over
 * its rows.
 */
type OracleSide =
  | { readonly breaches: readonly Breach[]; readonly kind: "judged" }
  | { readonly detail: string; readonly kind: "died" }
  | { readonly kind: "codec"; readonly rule: string };

/**
 * What the import's host path did with a package: died, refused it before any row, or built every
 * row, which the host judged.
 */
type ImportSide =
  | { readonly detail: string; readonly kind: "died" }
  | { readonly host: HostVerdict; readonly kind: "built" }
  | { readonly kind: "refused"; readonly rule: string };

/**
 * A mint of one candidate's ids, and the ids it drew.
 */
interface Mint {
  readonly mint: () => NodeId;
  readonly minted: ReadonlySet<string>;
}

/**
 * Mint the ids of one candidate's program in order, as `1000000n-0000-4000-8000-000000000000`
 * numbered from 1, recording each, so the program is the same on every run and its rows can be
 * held to the ids it drew.
 *
 * @returns The mint.
 */
const mintOf = (): Mint => {
  const minted = new Set<string>();
  let next = 0;

  return {
    mint: (): NodeId => {
      next += 1;
      const id: NodeId = `${(0x10_00_00_00 + next).toString(16)}-0000-4000-8000-000000000000`;
      minted.add(id);

      return id;
    },
    minted,
  };
};

/**
 * Name the element kind and the document a breach broke at: the last step of its node path, and
 * the root kind of its document.
 *
 * @param breach - The breach.
 * @param roots - Each document's root kind, by path.
 * @returns The feature's place, as `kind in root`.
 */
const placeOf = (breach: Breach, roots: ReadonlyMap<string, string>): string => {
  const steps = (breach.keys["node"] ?? "").split("/").filter((step) => step !== "");
  const kind = (steps.at(-1) ?? "package").replace(/\[\d+\]$/u, "");
  const root = breach.document === "" ? "package" : (roots.get(breach.document) ?? "?");

  return `${kind} in ${root}`;
};

/**
 * Each side's verdict on one package as the metamorphic relation compares it: the oracle's codec
 * rule, or the laws it raises; the import's codec rule, or the laws its rows break with the bound
 * and the uuids they name.
 */
export interface Summary {
  readonly import: string;
  readonly oracle: string;
}

/**
 * A candidate's judgment, with each side's verdict for the metamorphic relation.
 */
export type Judged = Judgment<Feature, Disagreement> & { readonly summary: Summary };

/**
 * Read the oracle's side of a package.
 *
 * @param exit - The oracle's judgment, or how it died.
 * @returns The side.
 */
const oracleSideOf = (exit: Exit.Exit<OracleJudgment>): OracleSide => {
  if (Exit.isFailure(exit)) {
    return { detail: Cause.pretty(exit.cause), kind: "died" };
  }

  return exit.value._tag === "CodecRefusal"
    ? { kind: "codec", rule: exit.value.rule }
    : { breaches: exit.value.breaches, kind: "judged" };
};

/**
 * Read the import's side of a package.
 *
 * @param exit - The program `readProgram` built, or its refusal or death.
 * @param minted - The ids its program drew.
 * @returns The side.
 */
const importSideOf = (
  exit: Exit.Exit<{ readonly inputs: PackageInputs }, { readonly _tag: string }>,
  minted: ReadonlySet<string>,
): ImportSide =>
  Exit.match(exit, {
    onFailure: (cause): ImportSide => {
      const failure = Cause.findErrorOption(cause);

      return Option.isSome(failure) && failure.value instanceof ImportRefused
        ? { kind: "refused", rule: failure.value.rules.join("|") }
        : { detail: Cause.pretty(cause), kind: "died" };
    },
    onSuccess: (program): ImportSide => ({
      host: hostVerdictOf(program.inputs, minted),
      kind: "built",
    }),
  });

/**
 * Name the arm of its domain a value-domain breach broke, the feature the search's domain coverage
 * counts: the attribute's domain and the facets its value lies outside, or its pattern (or
 * enumeration) where it breaks no facet.
 *
 * @param breach - A value-domain breach.
 * @param grammar - The composed grammar.
 * @returns The feature, `o:value domain arm <domain> <facets or pattern>`.
 */
const domainArmOf = (breach: Breach, grammar: ComposedGrammar): Feature => {
  const { kind = "", lexical = "", name = "", version = "3.0.0" } = breach.keys;
  const governs = Option.fromNullishOr(breach.keys["governs"]);
  const admitted = schemaVersions.find((held) => held === version) ?? "3.0.0";
  const handle = Option.getOrUndefined(
    Option.map(
      admissionOf(grammar.attributes, { governs, kind, name, version: admitted }),
      ({ domain }) => domain,
    ),
  );
  const domain = grammar.attributes.domains.find((held) => held.handle === handle);
  const broken =
    domain === undefined
      ? []
      : Option.toArray(boundBroken(domain, lexical)).map(({ facet }) => facet);

  return `o:value domain arm ${handle ?? "?"} ${broken.length === 0 ? "pattern" : broken.join(" ")}`;
};

/**
 * Name the law a package breaks alone, the feature the per-law isolation search steers by
 * (the history's 5.1): one breach set, of one law.
 *
 * @param breaches - The oracle's breaches.
 * @returns `o:alone <law>`, none where the breaches name no law or more than one.
 */
const aloneOf = (breaches: readonly Breach[]): readonly Feature[] => {
  const laws = [...new Set(breaches.map(({ law }) => law))];

  return laws.length === 1 ? [`o:alone ${laws[0] ?? ""}`] : [];
};

/**
 * List the features of the oracle's side.
 *
 * @param oracle - The oracle's side.
 * @param roots - Each document's root kind, by path.
 * @param grammar - The composed grammar, which types each attribute.
 * @returns The features.
 */
const oracleFeatures = (
  oracle: OracleSide,
  roots: ReadonlyMap<string, string>,
  grammar: ComposedGrammar,
): Feature[] => {
  switch (oracle.kind) {
    case "died": {
      return ["o:died"];
    }
    case "codec": {
      return [`o:codec ${oracle.rule}`];
    }
    case "judged": {
      return oracle.breaches.length === 0
        ? ["o:accepted"]
        : [
            ...oracle.breaches.flatMap((breach): readonly Feature[] => [
              `o:${breach.law} @ ${placeOf(breach, roots)}`,
              ...(breach.law === "value domain" ? [domainArmOf(breach, grammar)] : []),
            ]),
            ...aloneOf(oracle.breaches),
          ];
    }
    default: {
      return oracle satisfies never;
    }
  }
};

/**
 * List the features of the import's side: its codec's rule, or each rule its rows break with the
 * stage that found it.
 *
 * @param side - The import's side.
 * @returns The features.
 */
const importFeatures = (side: ImportSide): Feature[] => {
  switch (side.kind) {
    case "died": {
      return ["i:died"];
    }
    case "refused": {
      return [`i:${side.rule} @ codec`];
    }
    case "built": {
      return [
        "i:built",
        ...[...side.host.broken].map(
          ([law, { witness }]): Feature =>
            `i:${lawTable[law].rule} @ ${witness.split(" ")[0] ?? ""}`,
        ),
        ...(side.host.overLong.size > 0 ? ["i:key-text-bound @ bound" as const] : []),
        ...(side.host.dangling.length > 0 ? ["i:dangling @ uuid" as const] : []),
      ];
    }
    default: {
      return side satisfies never;
    }
  }
};

/**
 * Name the pair of verdicts, the `v:` feature.
 *
 * @param oracle - The oracle's side.
 * @param side - The import's side.
 * @returns The feature.
 */
const verdictFeature = (oracle: OracleSide, side: ImportSide): Feature => {
  if (oracle.kind !== "judged") {
    return `v:${oracle.kind}/${side.kind}`;
  }

  return `v:${oracle.breaches.length === 0 ? "accepted" : "refused"}/${side.kind}`;
};

/**
 * Compare what the two sides refused before any row.
 *
 * @param oracle - The oracle's side.
 * @param side - The import's side.
 * @returns The codec's disagreements.
 */
const codecDisagreements = (oracle: OracleSide, side: ImportSide): readonly Disagreement[] => {
  if (side.kind === "built") {
    return oracle.kind === "codec" ? [{ kind: "codec-oracle-only", oracleRule: oracle.rule }] : [];
  }

  if (side.kind === "died") {
    return [];
  }

  if (oracle.kind === "codec") {
    return oracle.rule === side.rule
      ? []
      : [{ importRule: side.rule, kind: "codec-rule", oracleRule: oracle.rule }];
  }

  const rules = new Set<string>(
    oracle.kind === "judged" ? oracle.breaches.map(({ law }) => ruleOf(law)) : [],
  );

  return oracle.kind === "judged" && !rules.has(side.rule)
    ? [
        {
          importRule: side.rule,
          kind: "codec-import-only",
          oracleRules: [...rules].toSorted().join(", "),
        },
      ]
    : [];
};

/**
 * The `keyText` fields the database fills and the import never writes: an owner's end a fold of the
 * document tree computes, and every accumulator's or generated field's of type `keyText`, such as
 * `Attribute.idrefText`. A key text the oracle bounds there has no row of the import to be in, so
 * no field the database fills is held on the host.
 */
const filledFields: ReadonlySet<string> = new Set([
  ...keyCopies.flatMap((copy) => (copy.by === "fold" ? [copy.field] : [])),
  ...filledKeyTextFields,
]);

/**
 * Compare the laws the import's rows break on the host with the laws the oracle raises: each law
 * the rows break that the oracle does not raise, each law the oracle raises whose statements the
 * rows were judged to hold, a key text past its bound on one side alone, and each uuid the rows
 * name that the program did not mint.
 *
 * @param breaches - The oracle's breaches.
 * @param host - The host's verdict over the import's rows.
 * @returns The rows' disagreements.
 */
const rowDisagreements = (
  breaches: readonly Breach[],
  host: HostVerdict,
): readonly Disagreement[] => {
  const raised = new Set<string>(breaches.map(({ law }) => law));
  const importOnly = [...host.broken].flatMap(
    ([law, { law: broken, witness }]): readonly Disagreement[] =>
      raised.has(law)
        ? []
        : [{ broken, kind: "import-only-law", law, rule: lawTable[law].rule, witness }],
  );
  const overLong: readonly Disagreement[] = raised.has("Key text bound")
    ? []
    : Option.match(Arr.head([...host.overLong.values()]), {
        onNone: () => [],
        onSome: (broken) => [
          {
            broken,
            kind: "import-only-law",
            law: "Key text bound",
            rule: "key-text-bound",
            witness: `a text past ${[...host.overLong.keys()].join(", ")}'s bound`,
          },
        ],
      });
  const shown = new Set<string>();
  const oracleOnly = breaches.flatMap((breach): readonly Disagreement[] => {
    const field = breach.keys["field"] ?? "";
    const bound = breach.law === "Key text bound";
    const held = bound
      ? host.written.has(field.split(".")[0] ?? "") &&
        !filledFields.has(field) &&
        !host.overLong.has(field)
      : host.held.has(breach.law);
    const key = bound ? `${breach.law} ${field}` : breach.law;
    if (!held || shown.has(key)) {
      return [];
    }

    shown.add(key);

    return [
      {
        keys: `${breach.document} ${Object.entries(breach.keys)
          .map(([name, value]) => `${name}=${value}`)
          .join(" ")}`,
        kind: "oracle-only-law",
        law: breach.law,
        rule: ruleOf(breach.law),
      },
    ];
  });

  return [
    ...host.dangling.map(({ field, relation, value }): Disagreement => ({
      field,
      kind: "dangling-uuid",
      relation,
      value,
    })),
    ...importOnly,
    ...overLong,
    ...oracleOnly,
  ];
};

/**
 * The witness the host's refusal is built under: the judge holds its rule to the oracle's, and
 * names no row.
 */
const unreported = { kind: "unreported" } as const;

/**
 * Read a refusal's witness kind: the database's, or `none` for a refusal made before the database.
 *
 * @param refused - The refusal.
 * @returns Its witness kind, or `none`.
 */
const witnessOf = (refused: ImportRefused): string =>
  refused.origin._tag === "Database" ? refused.origin.witness : "none";

/**
 * Judge the refusal the import names for a package whose oracle breaks one law alone: the import's
 * rows break laws on the host, and `refusalOf` names the refusal over them and the lone law (which
 * the database breaks too, by a statement the host may not evaluate, so it stands as its check,
 * named by the law) as it names the database's outcome. The most specific of its rules, by the
 * precedence it lists them in, must be the lone law's, and its witness the outcome's: a rule some
 * other broken law ranks before in precedence is a refusal the oracle does not predict. The import
 * no longer singles out one rule, so this models the ruling it made before, until the class goes
 * with the host judge.
 *
 * @param breaches - The oracle's breaches.
 * @param host - The host's verdict over the import's rows.
 * @param grammar - The installed grammar's rows an explanation reads.
 * @returns The disagreement, none where the oracle breaks other than one law or the rows break
 *   none.
 */
const loneRefusal = (
  breaches: readonly Breach[],
  host: HostVerdict,
  grammar: ComposedGrammar,
): readonly Disagreement[] => {
  const [lone, ...others] = [...new Set(breaches.map(({ law }) => law))];
  if (lone === undefined || others.length > 0 || host.brokenLaws.length === 0) {
    return [];
  }

  const rule = ruleOf(lone);
  const planted = {
    kind: "check",
    name: lone.replaceAll(" ", "_"),
    relation: "Node",
  } satisfies Law;
  const laws = [planted, ...host.brokenLaws] as const;
  const refused = refusalOf(
    {
      kind: "every",
      laws: [refusedOf(planted), ...host.brokenLaws.map((law) => refusedOf(law))],
    },
    unreported,
    grammar,
  );
  const importRule = Option.getOrElse(Arr.head(refused.rules), () => "none");

  return importRule === rule && witnessOf(refused) === unreported.kind
    ? []
    : [
        {
          importRule,
          kind: "lone-refusal",
          law: lone,
          laws: laws.map((law) => Formatter.format(law)).join("; "),
          rule,
          witness: witnessOf(refused),
        },
      ];
};

/**
 * Write each side's verdict for the metamorphic relation.
 *
 * @param oracle - The oracle's side.
 * @param side - The import's side.
 * @returns The summary.
 */
const summaryOf = (oracle: OracleSide, side: ImportSide): Summary => {
  const ofOracle =
    oracle.kind === "judged"
      ? `laws ${[...new Set(oracle.breaches.map(({ law }) => law))].toSorted().join(", ")}`
      : `${oracle.kind} ${oracle.kind === "codec" ? oracle.rule : ""}`;
  if (side.kind !== "built") {
    return { import: side.kind === "refused" ? `refused ${side.rule}` : "died", oracle: ofOracle };
  }

  const { broken, dangling, overLong } = side.host;
  const laws = [
    ...broken.keys(),
    ...(overLong.size > 0 ? ["key text bound"] : []),
    ...dangling.map(({ field, relation }) => `${relation}.${field}`),
  ];

  return { import: `built ${laws.toSorted().join(", ")}`, oracle: ofOracle };
};

/**
 * Whether a plain signature is a fixed entry's class, a cause a fix closed: a disagreement of one
 * carries its stated limit, where it has one.
 *
 * @param signature - The plain signature.
 * @returns Whether a fixed entry records it.
 */
const fixedClass = (signature: Signature): boolean =>
  fixed.some((entry) => sameSignature(entry.signature, signature));

/**
 * Judge one candidate both ways and compare.
 *
 * @param genome - The candidate.
 * @param bench - The bench.
 * @param index - The candidate's number in its run, which names its scratch directory.
 * @returns The judgment: the features both sides showed, every disagreement (one whose plain
 *   signature is a fixed entry's carrying the stated limit the package falls under), and each
 *   side's verdict for the metamorphic relation.
 */
export const judgeOne = Effect.fnUntraced(function* judgeOne(
  genome: Genome,
  bench: Bench,
  index: number,
): Effect.fn.Return<Judged, PlatformError.PlatformError, FileSystem.FileSystem | Path.Path> {
  const fs = yield* FileSystem.FileSystem;
  const entries = yield* Effect.orDie(entriesOf(genome));
  const kindOf = kindNamer(bench.grammar);
  const roots = new Map(
    genome.flatMap(({ body, path }) =>
      body.kind === "xml" ? [[path, kindOf(body.doc.root)] as const] : [],
    ),
  );
  const oracle = oracleSideOf(
    yield* Effect.exit(judge(filesOf(entries), bench.grammar, bench.laws)),
  );
  const dir = `${bench.directory}/c${String(index)}`;
  yield* writePackage(entries, dir);

  const { mint, minted } = mintOf();
  const read = yield* Effect.exit(readProgram(dir, mint));
  yield* fs.remove(dir, { recursive: true });

  const side = importSideOf(read, minted);
  const died: readonly Disagreement[] = [
    ...(oracle.kind === "died" ? [{ detail: oracle.detail, kind: "oracle-died" as const }] : []),
    ...(side.kind === "died" ? [{ detail: side.detail, kind: "import-died" as const }] : []),
  ];
  const rows =
    side.kind === "built" && oracle.kind === "judged"
      ? [
          ...rowDisagreements(oracle.breaches, side.host),
          ...loneRefusal(oracle.breaches, side.host, bench.grammar),
        ]
      : [];

  const limit = limitOf(oracle.kind === "judged" ? oracle.breaches : [], genome);
  const limited = (disagreement: Disagreement): Disagreement =>
    Option.match(limit, {
      onNone: () => disagreement,
      onSome: (under) =>
        fixedClass(signatureOf(disagreement)) ? { ...disagreement, limit: under } : disagreement,
    });

  return {
    disagreements: [...died, ...codecDisagreements(oracle, side), ...rows].map(limited),
    features: new Set([
      ...oracleFeatures(oracle, roots, bench.grammar),
      ...importFeatures(side),
      verdictFeature(oracle, side),
    ]),
    summary: summaryOf(oracle, side),
  };
});

/**
 * Judge a package and its noised copy, and report each side whose verdict the noise moved.
 *
 * @param judged - The package's judgment.
 * @param twin - The noised copy's judgment.
 * @param noise - The noise.
 * @param salt - The noise's salt.
 * @returns The disagreements, one per side that moved.
 */
export const movedBy = (
  judged: Judged,
  twin: Judged,
  noise: Noise,
  salt: number,
): readonly Disagreement[] =>
  (["oracle", "import"] as const).flatMap((side): readonly Disagreement[] =>
    judged.summary[side] === twin.summary[side]
      ? []
      : [
          {
            after: twin.summary[side],
            before: judged.summary[side],
            kind: "noise-moved",
            noise,
            salt,
            side,
          },
        ],
  );
