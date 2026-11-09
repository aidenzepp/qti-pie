/**
 * The free laws of `Node` (Q5.03): its declarations build, its checks are named by the oracle's
 * laws, its write type is the host's fields alone, and its content-order statements (N5) admit
 * exactly the state `stepOf` gives each child, over every family of the installed grammar and
 * over generated documents, and its membership checks test the handle of the node's own `Position`
 * field, as the host judge reads them. PostgreSQL judges the laws themselves in
 * `node.oracle.db.test.ts`.
 */
import {
  bits,
  Bits,
  ChangeSet,
  drawn,
  fin,
  fold as foldOf,
  login,
  Monoid,
  natural,
  on,
  ordered,
  relation,
  role,
  schema,
  uuid,
} from "@bjornpagen/grizzle";
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn as drawnCase, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { element as elementOf, int } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option, Predicate } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { followPairsOf, stepOf } from "#pantry/grammar/content.ts";
import * as install from "#pantry/grammar/install.ts";
import type { SchemaVersion as Version } from "#pantry/grammar/kinds.ts";
import { readProgram } from "#pantry/import/program.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { endsOf, fold } from "#pantry/model/folds.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type { XdmDocument } from "#pantry/model/xdm.ts";
import { ElementType, EndCharacter, Node, nodeLaws } from "#pantry/qti/node.ts";
import { Qti } from "#pantry/qti/own.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { caseHang, featuresOf, idOf, searchTimeout, xdmDocument } from "#pantry/test/gen/xdm.ts";
import type { XdmFeature } from "#pantry/test/gen/xdm.ts";
import { datumText } from "#pantry/test/predicates.ts";
import type { Datum } from "#pantry/test/predicates.ts";
import { hostRowsOf, judgedLaws } from "#pantry/test/host-judge.ts";
import type { HostRow } from "#pantry/test/host-judge.ts";
import { admittedOf } from "#pantry/test/indexes.ts";
import { checkOf, checkValueOf } from "#pantry/test/key-copies.ts";
import { documentBreaches, lawNames, lawsOf, oracleRules, ruleOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";
import { edit, item, itemResource, manifestOf, packageOf } from "#pantry/test/probe.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 86.7 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 420_000;

/**
 * The composed grammar `install.ts` declares its relations from, read once when it loads.
 */
const { grammar } = install;

/**
 * A stand-in for the attribute family (Q5.05's), so `Node`'s `attributes` and `attrs` are named by
 * a family and a fold as the composed schema names them: an ordered family under `Node`, its or
 * fold ending at `attrs`.
 */
const StandInAttribute = relation(
  "StandInAttribute",
  { at: drawn(natural), id: uuid, node: uuid, slot: bits(install.AttributeSlot) },
  ["id"],
);

/**
 * A stand-in for the namespace family (Q5.04's), so `Node`'s `namespaces` is named by a family.
 */
const StandInNamespace = relation(
  "StandInNamespace",
  { at: drawn(natural), id: uuid, node: uuid },
  ["id"],
);

/**
 * The stand-in attribute family.
 */
const standInAttributes = ordered(on(StandInAttribute, "node", "at"), fin(Node, "attributes"));

/**
 * Build a schema of `Node`, the closed relations its statements read, and the two stand-in
 * families, with `nodeLaws` and the families' statements.
 *
 * @returns The schema; building it throws grizzle's `CompileError` for a statement it refuses.
 */
const scratchSchema = () =>
  schema(
    "NodeScratch",
    {
      AnonymousType: install.AnonymousType,
      AttributeSlot: install.AttributeSlot,
      Banned: install.Banned,
      BarredOf: install.BarredOf,
      Capped: install.Capped,
      AdmissionIn: install.AdmissionIn,
      AdmissionMap: install.AdmissionMap,
      ContentModel: install.ContentModel,
      ContentModelOf: install.ContentModelOf,
      CountedOf: install.CountedOf,
      ElementType,
      Enters: install.Enters,
      Flag: install.Flag,
      FollowMember: install.FollowMember,
      FollowSet: install.FollowSet,
      FollowSetOf: install.FollowSetOf,
      GoverningOf: install.GoverningOf,
      Governor: install.Governor,
      KindGovernor: install.KindGovernor,
      ModelPositions: install.ModelPositions,
      Needs: install.Needs,
      Node,
      NodeKind: install.NodeKind,
      Position: install.Position,
      SchemaVersion: install.SchemaVersion,
      SharedModel: install.SharedModel,
      SharedModelOf: install.SharedModelOf,
      SharedPositions: install.SharedPositions,
      StandInAttribute,
      StandInNamespace,
      Symbol: install.Symbol,
      TextDomain: install.TextDomain,
      TypeName: install.TypeName,
      ValueDomain: install.ValueDomain,
      XsiType: install.XsiType,
    },
    [
      ...nodeLaws,
      standInAttributes,
      foldOf(
        standInAttributes,
        Monoid.or,
        on(StandInAttribute, "node", "slot"),
        on(Node, "id", "attrs"),
      ),
      ordered(on(StandInNamespace, "node", "at"), fin(Node, "namespaces")),
    ],
  );

/**
 * The scratch schema, built once for the write type's ChangeSets.
 */
const Scratch = scratchSchema();

/**
 * Spell a check's name as the oracle law it states: its underscores as spaces, the one change a
 * grizzle check name (ASCII letters, digits and underscores) makes to a law name, since no law name
 * holds an underscore.
 *
 * @param name - The check's name.
 * @returns The law name it spells.
 */
const lawOf = (name: string): string => name.replaceAll("_", " ");

/**
 * The oracle laws `nodeLaws` states as named checks. Every other statement is a family, a fold or a
 * containment, which a refusal names by its kind and sides (Q5.17). "E1 derived" is a check on
 * `Node` and one on `ElementType`, each relation's own.
 */
const checkedLaws: readonly LawName[] = [
  "E1 derived",
  "Foreign simple content",
  "N1 sentinel",
  "N5 Follow",
  "N5 admitted",
  "N6 ancestry",
  "N7 Counted",
  "N7 Last",
  "N7 barred by",
  "N8 nearest",
];

/**
 * A uuid for the write type's rows, spelled as `Uuid` holds it.
 */
const someId: Uuid = "00000000-0000-4000-8000-000000000001";

/**
 * The fields the host writes on every node but the root field: a lawful element's values, enough to
 * type a row.
 */
const written = {
  ancestry: Bits.of(install.Flag, []),
  chars: "",
  documentType: "imsqti_item_xmlv3p0",
  first: "",
  governor: "qti-assessment-item",
  id: someId,
  kind: "qti-assessment-item",
  last: "",
  nearest: someId,
  nearestKind: "document",
  prefix: "",
  state: "3",
  version: "3.0.1",
} as const;

describe("Node's declarations", () => {
  it(
    "build into a schema of the closed relations they read, with stand-ins for the attribute and namespace families, and a role and login over it",
    () => {
      // Oracle: grizzle's own admission, which refuses a malformed description, a side over a field
      // the relation lacks and a statement over a relation the schema does not hold when the schema
      // is built. The plan's refusals (two sequences, an axis's naming, a leaving copy) are the
      // compiler's: the scratch `grizzle generate` in the slice report drafts the same schema.
      const built = scratchSchema();
      const author = role(
        built,
        "author",
        { Node, StandInAttribute, StandInNamespace },
        {
          write: ["Node", "StandInAttribute", "StandInNamespace"],
        },
      );

      assert.strictEqual(built.name, "NodeScratch");
      assert.strictEqual(login(built, "scratch_app", [author]).name, "scratch_app");
    },
    testTimeoutMs,
  );

  it("names every check by an oracle law, each mapped to a rule, and states each law once on each relation", () => {
    // Oracle: the specification as a checker, the oracle's law list and its rule map
    // (`#pantry/test/oracle.ts`), which Q5.17's refusals read.
    const checks = nodeLaws.flatMap((statement) =>
      statement.kind === "check"
        ? [{ checked: statement.relation.name, law: lawOf(statement.name) }]
        : [],
    );
    const placed = checks.map(({ checked, law }) => `${checked} ${law}`);

    assert.sameMembers([...new Set(checks.map(({ law }) => law))], [...checkedLaws]);
    assert.strictEqual(new Set(placed).size, placed.length);
    for (const law of checkedLaws) {
      assert.include(lawNames, law);
      assert.include(oracleRules, ruleOf(law));
    }
  });

  it("types a write as the host's fields alone, the root field required on the root and supplied below it, and no field grizzle draws or fills", () => {
    // Oracle: the specification as a checker, the W5 contract's written fields (§C, with `ancestry`,
    // `chars`, `first` and `last`, which the host writes and `E1_derived` proves, `first` and
    // `last` by reading 127; the string value's fold steps `chars` itself), held by the compiler:
    // `satisfies` holds the written fields to exactly this record, a member written without
    // `document` is accepted, and each refusal below is a type error. A member that carries
    // `document` is not one: grizzle checks a nested member's fields by assignability, not for
    // excess keys (the report's finding), so T0 refuses a wrong one in PostgreSQL
    // (`node.oracle.db.test.ts`).
    const fields = {
      ancestry: true,
      chars: true,
      document: true,
      documentType: true,
      first: true,
      governor: true,
      id: true,
      kind: true,
      last: true,
      nearest: true,
      nearestKind: true,
      parent: true,
      prefix: true,
      state: true,
      version: true,
    } as const satisfies Record<keyof Addition<typeof Node>, true>;
    const leaf = { ...written, attributes: [], children: [], namespaces: [] } as const;
    const accepted = ChangeSet.empty(Scratch).insert(Node, [
      { ...leaf, children: [leaf], document: someId, kind: "document", state: "0" },
    ]);
    const refused = () => [
      // @ts-expect-error -- The root names the root field: its own id.
      ChangeSet.empty(Scratch).insert(Node, [{ ...leaf }]),
      // @ts-expect-error -- A slot is drawn by grizzle from the nesting.
      ChangeSet.empty(Scratch).insert(Node, [{ ...leaf, at: 0n, document: someId }]),
      // @ts-expect-error -- The predecessor's state is filled by grizzle along its axis.
      ChangeSet.empty(Scratch).insert(Node, [{ ...leaf, document: someId, was: "0" }]),
      // @ts-expect-error -- The parent is the nesting's, never the caller's.
      ChangeSet.empty(Scratch).insert(Node, [{ ...leaf, document: someId, parent: someId }]),
      // @ts-expect-error -- No field copies a node's characters; the fold steps `chars`.
      ChangeSet.empty(Scratch).insert(Node, [{ ...leaf, document: someId, stringPiece: "x" }]),
    ];

    assert.lengthOf(Object.keys(fields), 15);
    assert.isDefined(accepted);
    assert.isFunction(refused);
  });

  it("types each end of a node's characters as at most one code point, and writes each as the first or last of its characters", () => {
    // Oracle: the specification as a checker, reading 127's ends: `EndCharacter`'s pattern read
    // by JavaScript's engine under grizzle's flags `su` (`.` one code point, a line end among
    // them), and `endsOf` against `Array.from`, which splits a text into its code points.
    // Bound: the empty text, one and two characters, a line end, a surrogate pair alone, at
    // either end and between two letters.
    const end = new RegExp(EndCharacter.patterns[0].source, EndCharacter.patterns[0].flags);
    for (const held of ["", "a", "\n", "é", "😀"]) {
      assert.isTrue(end.test(held), JSON.stringify(held));
    }

    for (const refusedText of ["ab", "\r\n", "😀a", "a😀"]) {
      assert.isFalse(end.test(refusedText), JSON.stringify(refusedText));
    }

    for (const chars of ["", "a", "ab", "😀", "😀a", "a😀", "x😀y", "\t \n", "&e;"]) {
      const points = Array.from(chars, String);

      assert.deepStrictEqual(
        endsOf(chars),
        { first: points[0] ?? "", last: points.at(-1) ?? "" },
        JSON.stringify(chars),
      );
    }
  });
});

/**
 * A key of a family, `<version> <parent>`.
 *
 * @param version - The version.
 * @param parent - The parent's kind.
 * @returns The key.
 */
const familyKey = (version: string, parent: string): string => `${version} ${parent}`;

/**
 * The installed admission maps spelled out as (version, parent, child) → position rows.
 */
const admitted = admittedOf(install.ContentModelOf, install.AdmissionIn);

/**
 * The admission maps' rows as installed (`admittedOf`), by family, each kind's position.
 */
const childGrammar: ReadonlyMap<string, ReadonlyMap<string, string>> = (() => {
  const byFamily = new Map<string, Map<string, string>>();
  for (const { child, parent, position, version } of admitted) {
    const key = familyKey(version, parent);
    byFamily.set(key, (byFamily.get(key) ?? new Map<string, string>()).set(child, position));
  }

  return byFamily;
})();

/**
 * `ContentModelOf`'s rows as installed: each family's content model.
 */
const contentModelOf: ReadonlyMap<string, string> = new Map(
  install.ContentModelOf.rows.map(({ model, parent, version }) => [
    familyKey(version, parent),
    model,
  ]),
);

/**
 * `ModelPositions`'s rows as installed: each model's position count, its start 0 included.
 */
const modelPositions: ReadonlyMap<string, number> = new Map(
  install.ModelPositions.rows.map(({ model, positions }) => [model, Number(positions)]),
);

/**
 * The transitions `FollowSetOf` and `FollowMember` install, each `<model> <from> <to>`.
 */
const transitions = followPairsOf({
  followMember: install.FollowMember,
  followSetOf: install.FollowSetOf,
});

/**
 * The installed transitions as a set of `<model> <from> <to>`.
 */
const follow: ReadonlySet<string> = new Set(
  transitions.map(({ from, model, to }) => `${model} ${from} ${to}`),
);

/**
 * `SharedModelOf`'s rows as installed: each shared family's model. Most families have none.
 */
const sharedModelOf: ReadonlyMap<string, string> = new Map(
  install.SharedModelOf.rows.map(({ model, parent, version }) => [
    familyKey(version, parent),
    model,
  ]),
);

/**
 * `Symbol`'s rows as installed, by `<model> <kind>`: the positions a shared model names the kind
 * at.
 */
const symbol: ReadonlyMap<string, readonly string[]> = (() => {
  const byKind = new Map<string, string[]>();
  for (const { kind, model, position } of install.Symbol.rows) {
    const key = `${model} ${kind}`;
    byKind.set(key, [...(byKind.get(key) ?? []), position]);
  }

  return byKind;
})();

/**
 * The kinds that are no element, as a set.
 */
const nonElements: ReadonlySet<string> = new Set(install.nonElementKinds);

/**
 * List the states `node.ts`'s N5 statements admit for a member: the states `s` with `N5_admitted`
 * and `N5_Follow` true of (version, parent, kind, was, s), read off the installed rows. A
 * positioned member (an element, or character data a particle names) holds its position where
 * `Follow` steps to it, a shared kind each `Symbol` position `Follow` steps to, and other character
 * data its predecessor's state.
 *
 * @param key - The member.
 * @param key.version - Its version.
 * @param key.parent - Its parent's kind.
 * @param key.kind - Its kind.
 * @param was - Its predecessor's state.
 * @returns The admitted states, each once.
 */
const lawfulStates = (
  key: { readonly kind: string; readonly parent: string; readonly version: string },
  was: string,
): readonly string[] => {
  const family = familyKey(key.version, key.parent);
  const position = childGrammar.get(family)?.get(key.kind);
  if (position === undefined) {
    return [];
  }

  const model = contentModelOf.get(family) ?? "";
  const follows = (state: string) => follow.has(`${model} ${was} ${state}`);
  if (position !== "0") {
    return follows(position) ? [position] : [];
  }

  if (nonElements.has(key.kind)) {
    return [was];
  }

  return Option.match(Option.fromUndefinedOr(sharedModelOf.get(family)), {
    onNone: () => [],
    onSome: (shared) => (symbol.get(`${shared} ${key.kind}`) ?? []).filter(follows),
  });
};

/**
 * A family of the installed grammar: a version and a parent kind `ChildGrammar` admits a child
 * under.
 */
interface Family {
  readonly parent: string;
  readonly version: Version;
}

/**
 * Every family whose admission map admits a child, in `ContentModelOf`'s order.
 */
const families: readonly [Family, ...Family[]] = (() => {
  const seen = new Map<string, Family>();
  for (const { parent, version } of admitted) {
    seen.set(familyKey(version, parent), { parent, version });
  }

  const [first, ...rest] = [...seen.values()];
  if (first === undefined) {
    throw new Error("The installed admission maps admit no child, so N5 has no family to judge.");
  }

  return [first, ...rest];
})();

/**
 * What the exhaustion of N5's families notes: a family with a shared model, one with character data
 * a particle names (the doctype, SSML's text), a step no state admits, and character data carrying
 * its predecessor's state.
 */
type StepSituation =
  | "shared family"
  | "positioned character data"
  | "unfollowed step"
  | "carried state";

/**
 * What a search over generated documents notes: the generator's features, character data a
 * particle names, and a shared kind's child.
 */
type DocumentSituation = XdmFeature | "positioned character data" | "shared kind";

/**
 * Fold a generated document, which is total on the documents the generator builds.
 *
 * @param document - The document.
 * @returns Its folded nodes; a defect when the fold refuses it.
 */
const foldedNodes = (document: XdmDocument<Composed>) =>
  Effect.orDie(Effect.fromResult(fold(document, idOf, foldGrammarOf(grammar)))).pipe(
    Effect.map(({ nodes }) => nodes),
  );

/**
 * Read a member's key as the N5 statements read it.
 *
 * @param node - The member's folded row.
 * @returns Its version, parent kind and kind.
 */
const keyOf = (node: FoldedNode<Composed>) => ({
  kind: node.kind,
  parent: node.parentKind,
  version: node.version,
});

describe("N5, content order", { timeout: searchTimeout }, () => {
  it.effect(
    "admits exactly stepOf's state for every child kind of every family from every state",
    (ctx) =>
      // Oracle: a second implementation. `stepOf` steps the composed grammar's automata,
      // keyed by (version, parent); the N5 statements (`lawfulStates`) read `install.ts`'s rows,
      // keyed by content model. They agree exactly when N5_admitted and N5_Follow leave each child
      // one lawful state, the host's, and none where the host has none, which Unique Particle
      // Attribution promises (plan §1.3 N5, C5).
      // Bound: every family ChildGrammar admits a child under (1,276), every state of its model
      // (0 to its position count less 1), every kind it admits: 2,492,424 (family, state, kind)
      // triples at the pinned grammar, 654,636 of them in the 46 families with a shared kind.
      searched(
        ctx,
        exhaust(
          {
            box: "every family, every state of its model, every kind it admits",
            caseHang: "60 seconds",
            coverage: requiredInSpace<StepSituation>([
              "shared family",
              "positioned character data",
              "unfollowed step",
              "carried state",
            ]),
            generator: elementOf(families),
            limit: 2000,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "content.ts stepOf" },
            suite: "qti/node-n5-families",
          },
          ({ parent, version }, c) =>
            Effect.sync(() => {
              const family = familyKey(version, parent);
              const positions = modelPositions.get(contentModelOf.get(family) ?? "") ?? 1;
              if (sharedModelOf.has(family)) {
                c.note("shared family");
              }

              for (const [kind, position] of childGrammar.get(family) ?? []) {
                if (nonElements.has(kind) && position !== "0") {
                  c.note("positioned character data");
                }

                for (let was = 0; was < positions; was += 1) {
                  const lawful = lawfulStates({ kind, parent, version }, String(was));
                  const stepped = stepOf(grammar, { child: kind, parent, version }, was);
                  if (lawful.length === 0) {
                    c.note("unfollowed step");
                  } else if (nonElements.has(kind) && position === "0") {
                    c.note("carried state");
                  }

                  if (
                    lawful.length > 1 ||
                    String(Option.getOrElse(stepped, () => -1)) !== (lawful[0] ?? "-1")
                  ) {
                    assert.fail(
                      `${kind} under ${parent} in ${version} from state ${String(was)}: N5 admits [${lawful.join(", ")}], stepOf gives ${Formatter.format(stepped)}`,
                    );
                  }
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "holds of the state the host's fold writes on every member of a generated document",
    (ctx) =>
      // Oracle: the specification as a checker, the N5 statements of `node.ts` (`lawfulStates`
      // over the installed rows, and the predecessor copy) over the rows `fold` writes through
      // `stepOf`; the brief's split by kind (`¬element ∨ state = was`) is counted beside it,
      // since it refuses the state of every doctype and of SSML's text in `ssml:speak`.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree, 300 runs.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<DocumentSituation>(["doctype", "positioned character data"], {
              cases: 300,
              sense: notesOnly,
            }),
            draw: drawnCase(xdmDocument(grammar)),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "specification", name: "node.ts's N5 statements over install.ts" },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "qti/node-n5-documents",
          },
          ({ document }, c) =>
            Effect.gen(function* hostState() {
              c.noteAll(featuresOf(document));

              const nodes = yield* foldedNodes(document);
              const bySlot = new Map(nodes.map((node) => [`${node.parent} ${node.at}`, node]));
              for (const node of nodes.filter(({ start }) => start > 0n)) {
                const state = String(node.derived.state);
                const position = childGrammar
                  .get(familyKey(node.version, node.parentKind))
                  ?.get(node.kind);
                if (nonElements.has(node.kind) && position !== undefined && position !== "0") {
                  c.note("positioned character data");
                }

                if (!nonElements.has(node.kind) && position === "0") {
                  c.note("shared kind");
                }

                const predecessor = bySlot.get(`${node.parent} ${node.at - 1n}`);

                assert.deepStrictEqual(lawfulStates(keyOf(node), String(node.was)), [state]);
                assert.strictEqual(
                  node.was,
                  node.at === 0n ? 0 : (predecessor?.derived.state ?? Number.NaN),
                );
              }
            }),
        ),
      ),
  );
});

/**
 * The namespace of QTI 3's assessment vocabulary, `qti-ordering`'s own.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write a test whose one section orders the given children, with a foreign namespace bound to `f`.
 *
 * @param children - `qti-ordering`'s content as written.
 * @returns The test's text.
 */
const orderingTest = (children: string): string =>
  `<qti-assessment-test xmlns="${asi}" xmlns:f="urn:f" identifier="t" title="t"><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s" title="s" visible="true"><qti-ordering shuffle="true">${children}</qti-ordering><qti-assessment-item-ref identifier="i" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * The children upstream's spec reading 61 admits in `qti-ordering`'s extension slot, each with the
 * kind it is read as: QTI-named elements no particle of the slot declares (an ASI element and a
 * name of no ASI declaration), an element in no namespace, one in another namespace, and an HTML
 * global of QTI's namespace, which the slot's `##any lax` wildcard reads as its declaration.
 */
const orderingChildren = [
  { kind: "own-namespace-element", xml: "<qti-variable/>" },
  { kind: "own-namespace-element", xml: "<qti-foo/>" },
  { kind: "no-namespace-element", xml: '<foo xmlns=""/>' },
  { kind: "foreign-element", xml: "<f:x/>" },
  { kind: "div", xml: "<div>d</div>" },
] as const;

/**
 * One case of the reading 61 box: a version and `qti-ordering`'s children, as indices into
 * {@link orderingChildren}.
 */
interface OrderingCase {
  readonly children: readonly number[];
  readonly version: Version;
}

/**
 * The reading 61 box: in each version, the empty slot, each child alone, and each ordered pair of
 * children.
 */
const orderingCases: readonly [OrderingCase, ...OrderingCase[]] = (() => {
  const indices = orderingChildren.map((_, at) => at);
  const lists = [
    [],
    ...indices.map((at) => [at]),
    ...indices.flatMap((first) => indices.map((second) => [first, second])),
  ];
  const [first, ...rest] = install.SchemaVersion.handles.flatMap((version) =>
    lists.map((children) => ({ children, version })),
  );
  if (first === undefined) {
    throw new Error("The installed SchemaVersion roster is empty, so reading 61 has no case.");
  }

  return [first, ...rest];
})();

/**
 * The states `FollowSetOf` marks a family may end at, as installed, each `<model> <position>`: the
 * content grammar's `Last`.
 */
const last: ReadonlySet<string> = new Set(
  install.FollowSetOf.rows.filter(({ ends }) => ends).map(({ from, model }) => `${model} ${from}`),
);

/**
 * The oracle's tables over the composed grammar, built once.
 */
const oracleLaws = lawsOf(grammar);

/**
 * What the reading 61 box notes: each class of child it holds, and the empty slot.
 */
type OrderingSituation = "own namespace" | "no namespace" | "foreign" | "global" | "empty";

/**
 * The situation each kind of child notes.
 */
const situationOf: ReadonlyMap<string, OrderingSituation> = new Map([
  ["div", "global"],
  ["foreign-element", "foreign"],
  ["no-namespace-element", "no namespace"],
  ["own-namespace-element", "own namespace"],
]);

describe(
  "upstream's spec reading 61, qti-ordering's extension slot",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "admits QTI-named, no-namespace and foreign elements and the globals there, each child at the state N5 gives it, and ends in Last",
      (ctx) =>
        // Oracle: the specification as a checker, upstream's spec reading 61 restated in
        // `facets.ts` (`qti-ordering`'s content `sequence(any ##any lax *)`): every child below is
        // valid there, so N5 admitted and N5 Follow (`lawfulStates`, over the installed rows) give
        // each child exactly the state the host's fold wrote, `Last` holds the slot's last state, and
        // the host oracle finds no breach of those laws or of the foreign element laws.
        // Bound: each version, the empty slot, each of the five children alone and each of the 25
        // ordered pairs: 62 documents.
        searched(
          ctx,
          exhaust(
            {
              box: "each version, the empty slot, each child alone and each ordered pair",
              caseHang: "60 seconds",
              coverage: requiredInSpace<OrderingSituation>([
                "own namespace",
                "no namespace",
                "foreign",
                "global",
                "empty",
              ]),
              generator: elementOf(orderingCases),
              limit: orderingCases.length,
              literal: Formatter.format,
              oracle: { kind: "specification", name: "upstream's spec reading 61, facets.ts" },
              suite: "qti/node-reading-61",
            },
            ({ children, version }, c) =>
              Effect.gen(function* orderingCase() {
                const chosen = children.flatMap((at) =>
                  Option.toArray(Option.fromNullishOr(orderingChildren[at])),
                );
                const read = yield* Effect.orDie(
                  readXml(
                    new TextEncoder().encode(orderingTest(chosen.map(({ xml }) => xml).join(""))),
                  ),
                );
                const tree = yield* Effect.orDie(shred(read, version, shredGrammarOf(grammar)));
                const rows = yield* Effect.orDie(
                  Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))),
                );
                const ordering = rows.nodes.find(({ kind }) => kind === "qti-ordering");
                assert.isDefined(ordering);

                const held = rows.nodes.filter(({ parent }) => parent === ordering.id);
                if (held.length === 0) {
                  c.note("empty");
                }

                assert.deepStrictEqual(
                  held.map(({ kind }) => kind),
                  chosen.map(({ kind }) => kind),
                );
                for (const node of held) {
                  const situation = situationOf.get(node.kind);
                  if (situation !== undefined) {
                    c.note(situation);
                  }

                  assert.deepStrictEqual(lawfulStates(keyOf(node), String(node.was)), [
                    String(node.derived.state),
                  ]);
                }

                const model = contentModelOf.get(familyKey(version, "qti-ordering")) ?? "";

                assert.isTrue(last.has(`${model} ${String(ordering.childState)}`));
                assert.deepStrictEqual(
                  documentBreaches("test.xml", rows, oracleLaws)
                    .map(({ law }) => law)
                    .filter((law) =>
                      [
                        "N5 admitted",
                        "N5 Follow",
                        "N7 Last",
                        "Foreign element class",
                        "OpenElementName canonical",
                        "Strictly held",
                        "XsiType available",
                      ].includes(law),
                    ),
                  [],
                );
              }),
          ),
        ),
    );
  },
);

/**
 * XML Schema's instance namespace, which `xsi:type` is in.
 */
const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * XML Schema's namespace, its built-in types'.
 */
const xsNamespace = "http://www.w3.org/2001/XMLSchema";

/**
 * Write a test whose one section holds the given content before its item ref, with a foreign
 * namespace bound to `f` and XML Schema's two to `xsi` and `xs`.
 *
 * @param section - The section's content before its item ref.
 * @returns The test's text.
 */
const sectionTest = (section: string): string =>
  `<qti-assessment-test xmlns="${asi}" xmlns:f="urn:f" xmlns:xsi="${xsiNamespace}" xmlns:xs="${xsNamespace}" identifier="t" title="t"><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s" title="s" visible="true">${section}<qti-assessment-item-ref identifier="i" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * A type no element under a QTI parent may name: the first of `TypeAvailable`'s types whose
 * namespaces leave QTI's own out, a type of the content-packaging set (spec reading 81).
 */
const otherSetType =
  install.TypeAvailable.rows.find(({ namespaces }) => !new RegExp(namespaces, "u").test(asi))
    ?.type ?? assert.fail("TypeAvailable holds no type outside QTI's schema set");

/**
 * The laws over foreign elements: the class, the canonical name, simple content, strictness and
 * the available type.
 */
const foreignLaws: ReadonlySet<LawName> = new Set([
  "Foreign element class",
  "Foreign simple content",
  "OpenElementName canonical",
  "Strictly held",
  "XsiType available",
]);

/**
 * Edit the one foreign element of a kind in a document's folded rows, and its name row.
 *
 * @param rows - The rows.
 * @param kind - The element's kind.
 * @param node - The fields of its node to replace.
 * @param name - The fields of its `OpenElementName` row to replace.
 * @returns The edited rows.
 */
const editedForeign = (
  rows: FoldedRows<Composed>,
  kind: string,
  node: Partial<Pick<FoldedNode<Composed>, "governs" | "prefix">>,
  name: { readonly local?: string } = {},
): FoldedRows<Composed> => {
  const target = rows.nodes.find((held) => held.kind === kind);
  assert.isDefined(target, kind);

  return {
    ...rows,
    nodes: rows.nodes.map((held) => (held.id === target.id ? { ...held, ...node } : held)),
    openElementNames: rows.openElementNames.map((held) =>
      held.node === target.id ? { ...held, ...name } : held,
    ),
  };
};

/**
 * Each foreign law's case: a lawful document, and the corruption of it that breaks the law, a
 * second document or an edit of its rows. `node.oracle.db.test.ts` restates the first and the third
 * against PostgreSQL, and `chardata.db.test.ts` the other three's rows.
 */
const foreignCases: readonly {
  readonly corrupt:
    | { readonly _tag: "document"; readonly xml: string }
    | {
        readonly _tag: "edit";
        readonly edit: (rows: FoldedRows<Composed>) => FoldedRows<Composed>;
      };
  readonly law: LawName;
  readonly lawful: string;
}[] = [
  {
    corrupt: {
      _tag: "document",
      xml: sectionTest(
        `<qti-selection select="1"><f:x xsi:type="xs:string">a<f:y/></f:x></qti-selection>`,
      ),
    },
    law: "Foreign simple content",
    lawful: sectionTest(
      `<qti-selection select="1"><f:x xsi:type="xs:string">a</f:x></qti-selection>`,
    ),
  },
  {
    corrupt: {
      _tag: "edit",
      edit: (rows) => editedForeign(rows, "foreign-element", { governs: Option.none() }),
    },
    law: "Strictly held",
    lawful: `<qti-assessment-item xmlns="${asi}" xmlns:f="urn:f" xmlns:xsi="${xsiNamespace}" xmlns:xs="${xsNamespace}" identifier="item" title="Item" time-dependent="false" adaptive="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-companion-materials-info><f:x xsi:type="xs:string"/></qti-companion-materials-info><qti-item-body><p>x</p></qti-item-body></qti-assessment-item>`,
  },
  {
    corrupt: {
      _tag: "edit",
      edit: (rows) => editedForeign(rows, "no-namespace-element", { prefix: "p" }),
    },
    law: "Foreign element class",
    lawful: sectionTest(
      `<qti-ordering shuffle="true"><foo xmlns=""/><qti-variable/></qti-ordering>`,
    ),
  },
  {
    corrupt: {
      _tag: "edit",
      edit: (rows) => editedForeign(rows, "own-namespace-element", {}, { local: "div" }),
    },
    law: "OpenElementName canonical",
    lawful: sectionTest(
      `<qti-ordering shuffle="true"><foo xmlns=""/><qti-variable/></qti-ordering>`,
    ),
  },
  {
    corrupt: {
      _tag: "edit",
      edit: (rows) =>
        editedForeign(rows, "foreign-element", { governs: Option.some(otherSetType) }),
    },
    law: "XsiType available",
    lawful: sectionTest(
      `<qti-selection select="1"><f:x xmlns:q="${asi}" xsi:type="q:IdentifierDType">a1</f:x></qti-selection>`,
    ),
  },
];

/**
 * Shred and fold a document in 3.0.1.
 *
 * @param xml - The document's text.
 * @returns Its folded rows; a defect when it is not read.
 */
const foldedOf = (xml: string) =>
  Effect.gen(function* folded() {
    const read = yield* Effect.orDie(readXml(new TextEncoder().encode(xml)));
    const tree = yield* Effect.orDie(shred(read, "3.0.1", shredGrammarOf(grammar)));

    return yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));
  });

describe("the foreign element laws, by the host oracle", () => {
  it.effect(
    "finds no foreign law broken in each lawful document, and exactly the case's law in its corruption",
    () =>
      // Oracle: the specification as a checker, the host law model (`documentBreaches` of
      // `#pantry/test/oracle.ts`), which predicts PostgreSQL's refusals of `node.ts`'s and
      // `chardata.ts`'s checks: XML Schema 1.0 Part 1 §3.3.4 clause 3.1.2, §3.10.4 clause 2,
      // §3.3.4 clauses 1.1.1 and 1.2, and Namespaces in XML 1.0 §5 and §6.2.
      // Bound: the five laws, one lawful document and one corruption each.
      Effect.gen(function* foreign() {
        for (const { corrupt, law, lawful } of foreignCases) {
          const rows = yield* foldedOf(lawful);
          const broken =
            corrupt._tag === "document" ? yield* foldedOf(corrupt.xml) : corrupt.edit(rows);
          const foreignBreaches = (held: FoldedRows<Composed>) => [
            ...new Set(
              documentBreaches("case.xml", held, oracleLaws)
                .map((breach) => breach.law)
                .filter((name) => foreignLaws.has(name)),
            ),
          ];

          assert.deepStrictEqual(foreignBreaches(rows), [], law);
          assert.deepStrictEqual(foreignBreaches(broken), [law], law);
        }
      }),
  );
});

/**
 * Find a family of the installed grammar whose parent's model admits an element child kind at a
 * position the predicate holds.
 *
 * @param holds - Whether a family's child kind at its position is the one sought.
 * @returns The family, its content model, a state that model steps from, and the kind.
 * @throws {Error} When no family holds such a kind, which no installed grammar lacks.
 */
const familyWith = (holds: (family: Family, kind: string, position: string) => boolean) => {
  for (const at of families) {
    const family = familyKey(at.version, at.parent);
    const model = contentModelOf.get(family) ?? "";
    const kind = [...(childGrammar.get(family) ?? [])].find(
      ([child, position]) => !nonElements.has(child) && holds(at, child, position),
    )?.[0];
    const from = transitions.find((row) => row.model === model)?.from;
    if (kind !== undefined && from !== undefined) {
      return { ...at, from, kind, model };
    }
  }

  throw new Error(
    "No family of the installed grammar holds the element child the membership laws are judged on.",
  );
};

/**
 * A family whose shared model names an element child kind at position 0, for N5 admitted's
 * `Symbol` read and the other checks.
 */
const sharedFamily = familyWith(
  ({ parent, version }, _, position) =>
    position === "0" && sharedModelOf.has(familyKey(version, parent)),
);

/**
 * A family whose parent's model caps a position, for N7 Counted's key over the capped children.
 */
const cappedFamily = familyWith(({ parent, version }) =>
  install.Capped.rows.some((row) => row.parent === parent && row.version === version),
);

/**
 * A law of `node.ts` whose membership reads a node's own `Position` field.
 */
type MembershipLaw = "N5 Follow" | "N5 admitted" | "N7 Counted" | "N7 Last";

/**
 * A membership over a node's own `Position` field: its law, whether a row meets it as the host
 * evaluates the predicate grizzle keeps for it, the field whose handle it tests, and the set it
 * tests the handle in, read off `install.ts`'s rows. Every other field of its row reaches the
 * membership, and each other `Position` field holds the state the family steps from, so a
 * membership of another `Position` field would give one verdict for every handle.
 */
interface Membership {
  readonly field: "lastState" | "state";
  readonly held: ReadonlySet<string>;
  readonly law: MembershipLaw;
  readonly meets: (row: Readonly<Record<string, Datum>>) => boolean;
  readonly row: Readonly<Record<string, Datum>>;
}

/**
 * Read a check of `Node` as the schema states it.
 *
 * @param law - The check's law, its name with spaces for underscores.
 * @returns Whether a row passes it.
 * @throws {Error} When `Qti` states no such check, or states it in a shape the host does not read.
 */
const nodeCheck = (law: MembershipLaw) =>
  Option.getOrThrowWith(
    checkOf(Qti.statements, "Node", law.replaceAll(" ", "_")),
    () => new Error(`Qti states no check ${law} on Node that the host judge reads.`),
  );

/**
 * N7 Counted's key over the capped children, `(parent, state)` of the element members its
 * selection holds, as the host judges it: the one key of `Node` over those two fields.
 */
const cappedKey = (() => {
  const [side, ...more] = judgedLaws(Qti).flatMap((law) =>
    law.kind === "key" &&
    law.side.relation === "Node" &&
    law.side.law.terms.map(({ field }) => field).join(" ") === "parent state"
      ? [law.side]
      : [],
  );
  if (side === undefined || more.length > 0) {
    throw new Error(
      `Qti states ${String(more.length + (side === undefined ? 0 : 1))} keys of Node over (parent, state), and N7 Counted's capped children are the one.`,
    );
  }

  return side;
})();

/**
 * The row of a member element child of a family, every `Position` field the state its model
 * steps from.
 *
 * @param family - The family and its child kind.
 * @returns The row.
 */
const childRow = ({ from, kind, parent, version }: ReturnType<typeof familyWith>) => ({
  kind,
  lastState: from,
  parentKind: parent,
  start: 1n,
  state: from,
  version,
  was: from,
});

/**
 * The four memberships of `node.ts`: N5 Follow's `{state} ⊆ Follow(model, was)` and N5 admitted's
 * `{state} ⊆ Symbol(shared, kind)` for a member element, N7 Counted's capped children,
 * `{state} ⊆ Capped(version, parent)`, and N7 Last's `{lastState} ⊆ Last(model)` for the parent's
 * own row.
 */
const memberships: readonly Membership[] = [
  {
    field: "state",
    held: new Set(
      transitions
        .filter(({ from, model }) => model === sharedFamily.model && from === sharedFamily.from)
        .map(({ to }) => to),
    ),
    law: "N5 Follow",
    meets: nodeCheck("N5 Follow"),
    row: childRow(sharedFamily),
  },
  {
    field: "state",
    held: new Set(
      symbol.get(
        `${sharedModelOf.get(familyKey(sharedFamily.version, sharedFamily.parent)) ?? ""} ${sharedFamily.kind}`,
      ),
    ),
    law: "N5 admitted",
    meets: nodeCheck("N5 admitted"),
    row: childRow(sharedFamily),
  },
  {
    field: "state",
    held: new Set(
      install.Capped.rows
        .filter(
          ({ parent, version }) =>
            parent === cappedFamily.parent && version === cappedFamily.version,
        )
        .map(({ position }) => position),
    ),
    law: "N7 Counted",
    meets: (row) => cappedKey.selection(row) === true,
    row: childRow(cappedFamily),
  },
  {
    field: "lastState",
    held: new Set(
      install.FollowSetOf.rows
        .filter(({ ends, model }) => ends && model === sharedFamily.model)
        .map(({ from }) => from),
    ),
    law: "N7 Last",
    meets: nodeCheck("N7 Last"),
    row: { ...childRow(sharedFamily), kind: sharedFamily.parent },
  },
];

/**
 * What the exhaustion of the memberships notes: each law's verdict on a handle its set holds and
 * on one it does not.
 */
type MembershipSituation = `${MembershipLaw} ${"held" | "not held"}`;

describe("the memberships of a node's own position, by the host judge", () => {
  it.effect(
    "meet a node exactly where the handle of its own Position field is in the tested set, every handle exhausted",
    (ctx) =>
      // Oracle: the specification, the meaning of the diagonal `Compute.singleton` replaced:
      // {h} ⊆ S exactly where h ∈ S, S read off `install.ts`'s rows, over the predicates grizzle
      // keeps for the laws, evaluated on the host (`#pantry/test/key-copies.ts`).
      // Bound: every handle of the Position roster in each of the four memberships.
      searched(
        ctx,
        exhaust(
          {
            box: `every handle of Position, ${install.Position.handles.length}, in each membership`,
            caseHang,
            coverage: requiredInSpace<MembershipSituation>([
              "N5 Follow held",
              "N5 Follow not held",
              "N5 admitted held",
              "N5 admitted not held",
              "N7 Counted held",
              "N7 Counted not held",
              "N7 Last held",
              "N7 Last not held",
            ]),
            generator: int(0, install.Position.handles.length - 1),
            limit: install.Position.handles.length,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "{h} ⊆ S exactly where h ∈ S" },
            suite: "qti/node-memberships",
          },
          (code, c) =>
            Effect.sync(() => {
              const handle = install.Position.handles[code] ?? "";
              for (const { field, held, law, meets, row } of memberships) {
                const expected = held.has(handle);
                c.note(`${law} ${expected ? "held" : "not held"}`);
                assert.strictEqual(
                  meets({ ...row, [field]: handle }),
                  expected,
                  `${law} with ${field} ${handle} in ${Formatter.format(row)}`,
                );
              }
            }),
        ),
      ),
    searchTimeout,
  );
});

/**
 * The two content-order checks of a member, as PostgreSQL holds them: grizzle emits each as
 * `CHECK ((…) IS TRUE)`, so a row passes only where the predicate is true, and a predicate that
 * reads a closed read at a key no row holds, unknown on the host, is refused.
 */
const contentOrderChecks = (["N5 Follow", "N5 admitted"] as const).map((law) => ({
  law,
  value: Option.getOrThrowWith(
    checkValueOf(Qti.statements, "Node", law.replaceAll(" ", "_")),
    () => new Error(`Qti states no check ${law} on Node that the host reads.`),
  ),
}));

/**
 * A package whose item holds character data under a parent the grammar does not admit it under:
 * the name of the fixture it stands for, the parent, the version, and the item's text.
 */
interface UnadmittedText {
  readonly item: string;
  readonly name: string;
  readonly parent: string;
  readonly version: Version;
}

/**
 * The cases, each in both versions: `math-text-in-mfrac` (`fixtures.mathml.ts`), text before an
 * `m:mfrac`'s two arguments, whose model is element-only (MathML 3, §3.2.1: character data only in
 * token elements); and `pci-markup-text` (`fixtures.ts`), text in a PCI's `qti-interaction-markup`.
 */
const unadmittedTexts: readonly UnadmittedText[] = (["3.0.0", "3.0.1"] as const).flatMap(
  (version) => [
    {
      item: edit(
        edit(
          item,
          "<qti-assessment-item xmlns=",
          '<qti-assessment-item xmlns:m="http://www.w3.org/1998/Math/MathML" xmlns=',
        ),
        '<p id="intro">Pick one.</p>',
        '<p id="intro">Pick one.</p><m:math><m:mfrac>text<m:mi>a</m:mi><m:mi>b</m:mi></m:mfrac></m:math>',
      ),
      name: "math-text-in-mfrac",
      parent: "m:mfrac",
      version,
    },
    {
      item: edit(
        item,
        '<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">\n      <qti-simple-choice identifier="A">A</qti-simple-choice>\n      <qti-simple-choice identifier="B">B</qti-simple-choice>\n    </qti-choice-interaction>',
        '<qti-portable-custom-interaction response-identifier="RESPONSE" module="m" custom-interaction-type-identifier="t"><qti-interaction-modules><qti-interaction-module id="m" primary-path="m.js"/></qti-interaction-modules><qti-interaction-markup>Tap</qti-interaction-markup></qti-portable-custom-interaction>',
      ),
      name: "pci-markup-text",
      parent: "qti-interaction-markup",
      version,
    },
  ],
);

/**
 * Spell a member's slot in its family, its parent and its index, as a map key.
 *
 * @param parent - The member's parent.
 * @param at - Its index.
 * @returns The key.
 */
const slot = (parent: Datum | undefined, at: bigint): string =>
  `${datumText(parent)} ${String(at)}`;

/**
 * Give each node its `was`, which grizzle accumulates and the host rows do not hold: its
 * predecessor's state in its parent, `"0"` for the first member (`was: accumulated(…, "0")`, and
 * N5 fold's containment of `was` at `at` in the state at `at - 1`). A member with no
 * predecessor row reads none, which leaves its checks unknown and so refused.
 *
 * @param nodes - The import's `Node` rows.
 * @returns The rows, each with its `was`.
 */
const withWas = (nodes: readonly HostRow[]): readonly HostRow[] => {
  const states = new Map<string, Datum>();
  for (const row of nodes) {
    const { at, state } = row;
    if (Predicate.isBigInt(at) && state !== undefined) {
      states.set(slot(row["parent"], at), state);
    }
  }

  return nodes.map((row) => {
    const { at } = row;
    const was =
      !Predicate.isBigInt(at) || at === 0n ? "0" : states.get(slot(row["parent"], at - 1n));

    return was === undefined ? row : { ...row, was };
  });
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "a member its parent does not admit, by the schema's content-order checks over the import's rows",
  (judging) => {
    for (const { item: text, name, parent, version } of unadmittedTexts) {
      judging.effect(
        `${name} at ${version} breaks N5 admitted alone, N5 Follow true on its text`,
        () =>
          // Oracle: the law oracle (`oracle.ts`, N5 Follow leaves a member with no Admission cell
          // unjudged) and the spec: the text breaks admission and orders nothing.
          Effect.scoped(
            Effect.gen(function* unadmittedText() {
              const files = {
                "imsmanifest.xml": manifestOf(itemResource, version),
                "item.xml": text,
              };
              const dir = yield* scopedPackage(
                new Map(packageOf(files).map(({ bytes, path }) => [path, bytes] as const)),
              );
              const nodes = withWas(hostRowsOf((yield* readProgram(dir)).inputs).get("Node") ?? []);
              const textRow = nodes.find(
                (row) => row["kind"] === "text" && row["parentKind"] === parent,
              );

              assert.isDefined(textRow, `${name}: the import writes a text row under ${parent}`);
              assert.strictEqual(
                contentOrderChecks.find(({ law }) => law === "N5 Follow")?.value(textRow ?? {}),
                true,
                `${name}: N5 Follow on the text under ${parent}`,
              );
              assert.deepStrictEqual(
                contentOrderChecks
                  .filter(({ value }) => nodes.some((row) => value(row) !== true))
                  .map(({ law }) => law),
                ["N5 admitted"],
                name,
              );
            }),
          ),
      );
    }
  },
);
