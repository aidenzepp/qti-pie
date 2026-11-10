/**
 * A declaration of every cardinality, a record's included, its `base-type` unwritten, written as a
 * type its referrer fits or written as one it does not, named by each kind of content reference,
 * binding and mapping a declaration's base type reaches, held two ways: the law oracle's verdict
 * and the import's rows, judged on the host by the schema's own statements.
 *
 * A record has no base type ("Variables with record cardinality have no base-type", information
 * model tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3). Before, the import wrote a record's base type
 * as `none`, a `BaseType` handle no lexical form spells, and `declarationRef` copied it into every
 * row that names the declaration: the content references, the bindings, the mappings and lookup
 * tables, a value set and its values, and the expression references (lane NIL's audit, B12). The
 * laws then judged a record by that sentinel: `MappableBaseType` refused it as a base type no
 * mapping holds, and `Typed_value` passed its values as `none`'s, every text.
 *
 * Now a declaration's base type is `DeclarationBaseType`'s alone, a row only where it writes one,
 * every row that names the declaration copies its count of them (`baseTypes`), and each row that
 * reads a base type copies it from the typed row (`BindingBaseType`, `MappingBaseType`,
 * `MapKeyType`, `LookupValueType`, `TypedValue`), so only where it is. A law about a record's
 * whole value judges its cardinality, as the specification states it; one over a base type judges
 * the typed row, and a variable of no base type that is no record is Declaration base type's alone
 * (the orchestrator's ruling of 2026-11-06: one cause is refused under one rule).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { lawNameOf, ruleOfLaws } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/test/qti.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge as judgeHost } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/judged-laws.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";

/**
 * The oracle's tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * Every law the host judges, read once.
 */
const hostLaws = judgedLaws(Qti);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The cardinalities a declaration may write, a record's included.
 */
const cardinalities = ["single", "multiple", "ordered", "record"] as const;

/**
 * A declaration's `base-type`: unwritten, written as a type its referrer fits, or written as one it
 * does not.
 */
const baseTypeStates = ["unwritten", "fitting", "misfitting"] as const;

/**
 * One way a declaration is named: the declaration kind it must be, the base types that fit and do
 * not fit it, and the XML that names it, inside the item body or inside the declaration.
 */
interface Referrer {
  readonly body: string;
  readonly fitting: string;
  readonly inner: string;
  readonly kind:
    | "qti-outcome-declaration"
    | "qti-response-declaration"
    | "qti-template-declaration";
  readonly misfitting: string;
  readonly name: string;
}

/**
 * The referrers: a feedback element's and a printed variable's outcome, a template inline's
 * template (the content references); a text entry's response and string identifiers (the
 * bindings); and a response's mapping and area mapping and an outcome's match table (the tables).
 */
const referrers: readonly Referrer[] = [
  {
    body: `<p><qti-feedback-inline outcome-identifier="X" identifier="A" show-hide="show">f</qti-feedback-inline></p>`,
    fitting: "identifier",
    inner: "",
    kind: "qti-outcome-declaration",
    misfitting: "float",
    name: "feedback",
  },
  {
    body: `<p><qti-printed-variable identifier="X"/></p>`,
    fitting: "float",
    inner: "",
    kind: "qti-outcome-declaration",
    misfitting: "string",
    name: "printed variable",
  },
  {
    body: `<p><qti-template-inline template-identifier="X" identifier="T" show-hide="show">t</qti-template-inline></p>`,
    fitting: "integer",
    inner: "",
    kind: "qti-template-declaration",
    misfitting: "string",
    name: "template inline",
  },
  {
    body: `<p><qti-text-entry-interaction response-identifier="X"/></p>`,
    fitting: "string",
    inner: "",
    kind: "qti-response-declaration",
    misfitting: "identifier",
    name: "response identifier",
  },
  {
    body: `<p><qti-text-entry-interaction response-identifier="R" string-identifier="X"/></p>`,
    fitting: "string",
    inner: "",
    kind: "qti-response-declaration",
    misfitting: "integer",
    name: "string identifier",
  },
  {
    body: "<p>Hi</p>",
    fitting: "identifier",
    inner: `<qti-mapping default-value="0"><qti-map-entry map-key="a" mapped-value="1"/></qti-mapping>`,
    kind: "qti-response-declaration",
    misfitting: "file",
    name: "mapping",
  },
  {
    body: "<p>Hi</p>",
    fitting: "point",
    inner: `<qti-area-mapping default-value="0"><qti-area-map-entry shape="circle" coords="1,1,1" mapped-value="1"/></qti-area-mapping>`,
    kind: "qti-response-declaration",
    misfitting: "identifier",
    name: "area mapping",
  },
  {
    body: "<p>Hi</p>",
    fitting: "integer",
    inner: `<qti-match-table default-value="1"><qti-match-table-entry source-value="1" target-value="1"/></qti-match-table>`,
    kind: "qti-outcome-declaration",
    misfitting: "identifier",
    name: "match table",
  },
];

/**
 * One case of the box: a referrer, its declaration's cardinality and its base type's state.
 */
interface Case {
  readonly baseType: (typeof baseTypeStates)[number];
  readonly cardinality: (typeof cardinalities)[number];
  readonly referrer: Referrer;
}

/**
 * Every case: 8 referrers × 4 cardinalities × 3 base type states, 96 in all.
 */
const cases: readonly Case[] = referrers.flatMap((referrer) =>
  cardinalities.flatMap((cardinality) =>
    baseTypeStates.map((baseType): Case => ({ baseType, cardinality, referrer })),
  ),
);

/**
 * The base type a case's declaration writes, none where it writes none.
 *
 * @param drawn - The case.
 * @returns The base type.
 */
const writtenOf = (drawn: Case): Option.Option<string> => {
  switch (drawn.baseType) {
    case "unwritten": {
      return Option.none();
    }
    case "fitting": {
      return Option.some(drawn.referrer.fitting);
    }
    case "misfitting": {
      return Option.some(drawn.referrer.misfitting);
    }
    default: {
      return drawn.baseType satisfies never;
    }
  }
};

/**
 * Write a case's package: an item whose declaration `X` the referrer names, a single string
 * response `R` beside it for the string identifier's response identifier, and the manifest that
 * lists it, each file's text encoded as UTF-8.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: Case): PackageEntries => {
  const baseType = Option.match(writtenOf(drawn), {
    onNone: () => "",
    onSome: (written) => ` base-type="${written}"`,
  });
  const declaration = `<${drawn.referrer.kind} identifier="X" cardinality="${drawn.cardinality}"${baseType}>${drawn.referrer.inner}</${drawn.referrer.kind}>`;
  const response = `<qti-response-declaration identifier="R" cardinality="single" base-type="string"/>`;

  return new Map(
    Object.entries({
      "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false">${response}${declaration}<qti-item-body>${drawn.referrer.body}</qti-item-body></qti-assessment-item>`,
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );
};

/**
 * The base types each typed relation holds: a declaration's own, and each row's that reads it.
 */
interface TypedRows {
  readonly BindingBaseType: readonly string[];
  readonly DeclarationBaseType: readonly string[];
  readonly LookupValueType: readonly string[];
  readonly MapKeyType: readonly string[];
  readonly MappingBaseType: readonly string[];
}

/**
 * The rows that copy a declaration's base type, each the typed row of one that reads it: each
 * relation's base types, by the relation.
 *
 * @param inputs - The import's rows.
 * @returns The base types each typed relation holds.
 */
const typedRowsOf = (inputs: PackageInputs): TypedRows => ({
  BindingBaseType: [...inputs.BindingBaseType.values()].map(({ baseType }) => baseType),
  DeclarationBaseType: [...inputs.DeclarationBaseType.values()].map(({ baseType }) => baseType),
  LookupValueType: [...inputs.LookupValueType.values()].map(({ baseType }) => baseType),
  MapKeyType: [...inputs.MapKeyType.values()].map(({ baseType }) => baseType),
  MappingBaseType: [...inputs.MappingBaseType.values()].map(({ baseType }) => baseType),
});

/**
 * The typed rows a case's declaration `X` has, by the specification: its `DeclarationBaseType`
 * exactly where it writes a base type, and each row that reads it, beside it: the response `R`'s
 * string type, and a binding's, a mapping's, a map key's and a lookup value's, each where its
 * declaration has a base type, a record's having none.
 *
 * @param drawn - The case.
 * @returns The base types each typed relation holds.
 */
const expectedTypedRowsOf = (drawn: Case): TypedRows => {
  const written = Option.toArray(writtenOf(drawn));
  const { name } = drawn.referrer;

  return {
    BindingBaseType: [
      ...(name === "string identifier" ? ["string"] : []),
      ...(name === "response identifier" || name === "string identifier" ? written : []),
    ],
    DeclarationBaseType: ["string", ...written],
    LookupValueType: name === "match table" ? [...written, ...written] : [],
    MapKeyType: name === "mapping" ? written : [],
    MappingBaseType: name === "mapping" ? written : [],
  };
};

/**
 * Sort each relation's base types, so two holdings compare as sets of rows by relation.
 *
 * @param held - The base types each relation holds.
 * @returns The same, each list sorted.
 */
const sortedOf = (held: TypedRows): TypedRows => ({
  BindingBaseType: held.BindingBaseType.toSorted(),
  DeclarationBaseType: held.DeclarationBaseType.toSorted(),
  LookupValueType: held.LookupValueType.toSorted(),
  MapKeyType: held.MapKeyType.toSorted(),
  MappingBaseType: held.MappingBaseType.toSorted(),
});

/**
 * Name the situation a case reaches: accepted, refused under one law, or under several; and
 * whether its declaration is a record.
 *
 * @param raised - The laws the oracle names.
 * @param drawn - The case.
 * @returns The situations.
 */
const situationsOf = (
  raised: ReadonlySet<string>,
  drawn: Case,
): readonly ("accepted" | "alone" | "record" | "several")[] => {
  const record = drawn.cardinality === "record" ? (["record"] as const) : [];
  if (raised.size === 0) {
    return ["accepted", ...record];
  }

  return [raised.size === 1 ? "alone" : "several", ...record];
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "a declaration of every cardinality, a record's included",
  (it) => {
    it.effect(
      "copies its base type only where it has one, and the law oracle and the import's rows give one verdict over each reference, binding and table",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, which reads each declaration's
        // `base-type` itself (`typedValueOf`), against the import's rows judged on the host by
        // the schema's statements; and the specification by hand for which typed rows exist
        // (information model tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3: a record has no
        // base-type). Bound: 8 referrers (a feedback's, a printed variable's and a template
        // inline's references, a text entry's response and string identifiers, a mapping, an
        // area mapping and a match table) × 4 cardinalities × an unwritten, a fitting and a
        // misfitting base type, 96 packages, exhausted.
        searched(
          ctx,
          exhaust(
            {
              box: "a declaration of each cardinality and base type state, named by each reference, binding and table",
              caseHang: Duration.minutes(2),
              coverage: requiredInSpace<"accepted" | "alone" | "record" | "several">([
                "accepted",
                "alone",
                "record",
                "several",
              ]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => Formatter.format(cases[at]),
              oracle: {
                kind: "second-implementation",
                name: "the law oracle, beside the specification's typed rows by hand",
              },
              suite: "test/record-declarations",
            },
            (at, c) =>
              Effect.scoped(
                Effect.gen(function* oneCase() {
                  const drawn = cases[at];
                  assert.isDefined(drawn, `no case ${String(at)}`);
                  if (drawn === undefined) {
                    return;
                  }

                  const label = `${drawn.referrer.name} ${drawn.cardinality} ${drawn.baseType}`;
                  const entries = packageOf(drawn);
                  const judgment = yield* judge(filesOf(entries), grammar, laws);
                  assert.strictEqual(judgment._tag, "Judged", `${label}: the codec refuses it`);

                  const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
                  const oracleLaws = new Set<string>(breaches.map(({ law }) => law));
                  c.noteAll(situationsOf(oracleLaws, drawn));

                  const { inputs } = yield* readProgram(yield* scopedPackage(entries));
                  assert.deepStrictEqual(
                    sortedOf(typedRowsOf(inputs)),
                    sortedOf(expectedTypedRowsOf(drawn)),
                    `${label}: the typed rows`,
                  );

                  const { broken } = judgeHost(hostRowsOf(inputs), hostLaws);
                  const hostNames = new Set(
                    broken.map(({ law }) =>
                      Option.getOrElse(lawNameOf(law), () => Formatter.format(law)),
                    ),
                  );
                  const shown =
                    broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law";
                  assert.sameMembers(
                    [...hostNames],
                    [...oracleLaws],
                    `${label}: the import's rows break ${shown}; the law oracle:\n${breaches.map((breach) => `  ${shownBreach(breach, grammar)}`).join("\n")}`,
                  );

                  const brokenLaws = broken.map(({ law }) => law);
                  const rule = Arr.isReadonlyArrayNonEmpty(brokenLaws)
                    ? ruleOfLaws(brokenLaws)
                    : Option.none();
                  const rules = breaches.map(({ law }) => ruleOf(law));
                  assert.isTrue(
                    Option.match(rule, {
                      onNone: () => rules.length === 0,
                      onSome: (named) => rules.includes(named),
                    }),
                    `${label}: the import's refusal names ${Option.getOrElse(rule, () => "none")}, the law oracle ${rules.join(", ") || "none"}`,
                  );
                }),
              ),
          ),
        ),
      600_000,
    );
  },
);
