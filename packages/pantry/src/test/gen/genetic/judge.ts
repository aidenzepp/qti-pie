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
 *   text the oracle finds past its bound in a field of a relation the import writes, no fold's end,
 *   is in that field's rows.
 */
import { Cause, Effect, Exit, FileSystem, Option, Result } from "effect";
import type { Path, PlatformError } from "effect";
import type { Law } from "@bjornpagen/grizzle";
import { admissionOf } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { noType } from "#pantry/grammar/xsi.ts";
import { readProgram } from "#pantry/import/program.ts";
import { ImportRefused, lawIdentity, refusalOfLaws } from "#pantry/import/refusal.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { kindNamer } from "#pantry/test/gen/genetic/corpus.ts";
import type { Judgment } from "#pantry/test/gen/genetic/engine.ts";
import { entriesOf } from "#pantry/test/gen/genetic/genome.ts";
import type { Genome } from "#pantry/test/gen/genetic/genome.ts";
import { hostVerdictOf } from "#pantry/test/gen/genetic/host-laws.ts";
import type { HostVerdict } from "#pantry/test/gen/genetic/host-laws.ts";
import type { Noise } from "#pantry/test/gen/genetic/noise.ts";
import { writePackage } from "#pantry/test/gen/every-relation.ts";
import { keyCopies } from "#pantry/test/key-copies.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { facetsBroken, judge, ruleOf } from "#pantry/test/oracle.ts";
import type { Breach, Judgment as OracleJudgment, Laws } from "#pantry/test/oracle.ts";

/**
 * One way the import and the oracle disagree on a package:
 *
 * - `oracle-died`, `import-died`: a side failed to judge at all;
 * - `codec-rule`: both refuse before any row, under two rules;
 * - `codec-import-only`: the import refuses before any row under a rule the oracle does not name;
 * - `codec-oracle-only`: the oracle's codec refuses, and the import builds every row;
 * - `import-only-law`: the import's rows break a law the oracle says the package meets;
 * - `oracle-only-law`: the oracle raises a law the import's rows were judged to hold;
 * - `dangling-uuid`: a row names a uuid the program did not mint;
 * - `noise-moved`: a side's verdict moved when the package took a noise no law reads
 *   (`#pantry/test/gen/genetic/noise.ts`);
 * - `lone-refusal`: the oracle breaks one law alone, and the refusal the import names over the laws
 *   its rows break (`refusalOfLaws`, as the database's outcome names it) is under another rule than
 *   that law's, or carries another witness than the outcome's.
 */
export type Disagreement =
  | {
      readonly importRule: string;
      readonly kind: "lone-refusal";
      readonly law: string;
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
  | { readonly field: string; readonly kind: "dangling-uuid" }
  | { readonly importRule: string; readonly kind: "codec-rule"; readonly oracleRule: string }
  | {
      readonly importRule: string;
      readonly kind: "codec-import-only";
      readonly oracleRules: string;
    }
  | { readonly kind: "codec-oracle-only"; readonly oracleRule: string }
  | {
      readonly kind: "import-only-law";
      readonly law: string;
      readonly rule: string;
      readonly witness: string;
    }
  | {
      readonly keys: string;
      readonly kind: "oracle-only-law";
      readonly law: string;
      readonly rule: string;
    };

/**
 * Key a disagreement by its class: its kind and the law or rules it names, and for a law the
 * import's rows break the statement that broke it (one law, `E1 derived` above all, is stated by
 * many statements, each its own writer), never its witness, so a run keeps one candidate per
 * class.
 *
 * @param disagreement - The disagreement.
 * @returns Its signature.
 */
export const signatureOf = (disagreement: Disagreement): string => {
  switch (disagreement.kind) {
    case "import-died":
    case "oracle-died": {
      return `${disagreement.kind}: ${disagreement.detail.split("\n")[0]?.slice(0, 120) ?? ""}`;
    }
    case "dangling-uuid": {
      return `${disagreement.kind}: ${disagreement.field.split(" = ")[0] ?? ""}`;
    }
    case "codec-rule": {
      return `${disagreement.kind}: import ${disagreement.importRule}, oracle ${disagreement.oracleRule}`;
    }
    case "codec-import-only": {
      return `${disagreement.kind}: ${disagreement.importRule}`;
    }
    case "codec-oracle-only": {
      return `${disagreement.kind}: ${disagreement.oracleRule}`;
    }
    case "import-only-law": {
      return `${disagreement.kind}: ${disagreement.law}, ${disagreement.witness.split(": ")[0] ?? ""}`;
    }
    case "oracle-only-law": {
      return `${disagreement.kind}: ${disagreement.law}`;
    }
    case "noise-moved": {
      return `${disagreement.kind}: the ${disagreement.side}'s verdict under ${disagreement.noise}`;
    }
    case "lone-refusal": {
      return `${disagreement.kind}: ${disagreement.law} named ${disagreement.importRule}, witness ${disagreement.witness}`;
    }
    default: {
      return disagreement satisfies never;
    }
  }
};

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
      return `dangling-uuid: the import writes ${disagreement.field}, an id it never minted`;
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
        ? { kind: "refused", rule: failure.value.rule }
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
  const { governs = noType, kind = "", lexical = "", name = "", version = "3.0.0" } = breach.keys;
  const admitted = schemaVersions.find((held) => held === version) ?? "3.0.0";
  const handle = Option.getOrUndefined(
    Option.map(
      admissionOf(grammar.attributes, { governs, kind, name, version: admitted }),
      ({ domain }) => domain,
    ),
  );
  const domain = grammar.attributes.domains.find((held) => held.handle === handle);
  const broken =
    domain === undefined ? [] : facetsBroken(domain, lexical).map(({ facet }) => facet);

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
          ([law, witness]): Feature => `i:${lawTable[law].rule} @ ${witness.split(" ")[0] ?? ""}`,
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
 * The `keyText` fields a fold of the document tree fills, an owner's end the database computes and
 * the import never writes: a key text the oracle bounds there has no row of the import to be in.
 */
const foldFields: ReadonlySet<string> = new Set(
  keyCopies.flatMap((copy) => (copy.by === "fold" ? [copy.field] : [])),
);

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
  const importOnly = [...host.broken].flatMap(([law, witness]): readonly Disagreement[] =>
    raised.has(law) ? [] : [{ kind: "import-only-law", law, rule: lawTable[law].rule, witness }],
  );
  const overLong: readonly Disagreement[] =
    host.overLong.size > 0 && !raised.has("Key text bound")
      ? [
          {
            kind: "import-only-law",
            law: "Key text bound",
            rule: "key-text-bound",
            witness: `a text past ${[...host.overLong].join(", ")}'s bound`,
          },
        ]
      : [];
  const shown = new Set<string>();
  const oracleOnly = breaches.flatMap((breach): readonly Disagreement[] => {
    const field = breach.keys["field"] ?? "";
    const bound = breach.law === "Key text bound";
    const held = bound
      ? host.written.has(field.split(".")[0] ?? "") &&
        !foldFields.has(field) &&
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
    ...host.dangling.map((field): Disagreement => ({ field, kind: "dangling-uuid" })),
    ...importOnly,
    ...overLong,
    ...oracleOnly,
  ];
};

/**
 * The witness a refusal of a law over no key's rows carries: PostgreSQL names a foreign key's, a
 * check's and a domain's violating row by none.
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
 * rows break laws on the host, and `refusalOfLaws` names the refusal over them and the lone law
 * (which the database breaks too, by a statement the host may not evaluate, so it stands as its
 * check, named by the law) as it names the database's outcome. Its rule must be the lone law's,
 * and its witness the outcome's: a rule some other broken law ranks before in precedence is a
 * refusal the oracle does not predict.
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
  const laws = [
    { kind: "check", name: lone.replaceAll(" ", "_"), relation: "Node" } satisfies Law,
    ...host.brokenLaws,
  ] as const;

  return Result.match(refusalOfLaws(laws, unreported, grammar), {
    onFailure: (unowned): readonly Disagreement[] => [
      {
        importRule: "none",
        kind: "lone-refusal",
        law: lone,
        laws: unowned.laws.join("; "),
        rule,
        witness: "none",
      },
    ],
    onSuccess: (refused): readonly Disagreement[] =>
      refused.rule === rule && witnessOf(refused) === unreported.kind
        ? []
        : [
            {
              importRule: refused.rule,
              kind: "lone-refusal",
              law: lone,
              laws: laws.map(lawIdentity).join("; "),
              rule,
              witness: witnessOf(refused),
            },
          ],
  });
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
    ...dangling.map((field) => field.split(" = ")[0] ?? ""),
  ];

  return { import: `built ${laws.toSorted().join(", ")}`, oracle: ofOracle };
};

/**
 * Judge one candidate both ways and compare.
 *
 * @param genome - The candidate.
 * @param bench - The bench.
 * @param index - The candidate's number in its run, which names its scratch directory.
 * @returns The judgment: the features both sides showed, every disagreement, and each side's
 *   verdict for the metamorphic relation.
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

  return {
    disagreements: [...died, ...codecDisagreements(oracle, side), ...rows],
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
