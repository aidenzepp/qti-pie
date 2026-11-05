/**
 * The wildcard model's database rules, by direct ChangeSet (spec W14), and the `xsi` content's
 * round trip through the database. It runs on the merge lease only; without one every case is
 * skipped.
 *
 * The bin 1 rules are W5, W8, W9 and W10. W1, W2, W3, W6 and W7 pair a seeded namespace with an
 * author's text, which grizzle cannot compile, so they are the importer's wildcard guard and
 * `import/guards/wildcard.test.ts` refuses them. Each negative alters the rows an accepted fixture
 * builds in one place and asserts `invariant-rejected` naming the law and the rule `ruleOfLaw`
 * gives it; each fixture's unaltered rows commit beside them, so every refusal is its alteration's.
 * The controls that commit mark the edge of a rule: what the database admits and the importer, or
 * the reader, refuses.
 */
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option, Predicate, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { changeSetOf, importPackage, readRows, retrySchedule } from "#pantry/import/package.ts";
import { isMappedLaw, refusalOfLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw, Rule } from "#pantry/import/refusal.ts";
import type { Rows } from "#pantry/import/tree.ts";
import { DocumentId, DocumentXmlId } from "#pantry/schema/document.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import {
  Node,
  NoNamespaceSchemaLocation,
  XsiNil,
  XsiType,
  XsiTypeAttribute,
} from "#pantry/schema/node.ts";
import { ManifestId, ManifestXmlId } from "#pantry/schema/package.ts";
import { cutItem, materialize, materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureName, FixtureSpec } from "#pantry/test/fixtures.ts";
import { rowsOf } from "#pantry/test/rows.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The directory the round trip's export is written under: the package's gitignored `work/`.
 */
const exportRoot = `${import.meta.dirname}/../../work/export/foreign-xsi`;

/**
 * The XML Schema instance namespace, where the `xsi` attributes live.
 */
const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows of a package, a mutable copy per relation, which an alteration edits in place
 * before the rows are applied.
 */
type Draft = Map<AnyRelation, Row[]>;

/**
 * A row from the entries of an importer fact, whose fields are all text or bigints.
 */
const rowOf = (entries: readonly (readonly [string, unknown])[]): Row =>
  Object.fromEntries(
    entries.map(([field, value]): [string, string | bigint] => [
      field,
      Predicate.isString(value) || Predicate.isBigInt(value)
        ? value
        : assert.fail(`${field} is neither text nor a bigint`),
    ]),
  );

/**
 * The editable copy of the rows an importer built.
 */
const draftOf = (rows: Rows): Draft =>
  new Map(
    [...rows].map(([relation, facts]) => [
      relation,
      facts.map((fact) => rowOf(Object.entries(fact))),
    ]),
  );

/**
 * The editable rows of `relation`, an empty list when the draft has none.
 */
const of = (draft: Draft, relation: AnyRelation): Row[] => {
  const found = draft.get(relation);
  if (found !== undefined) {
    return found;
  }

  const created: Row[] = [];
  draft.set(relation, created);

  return created;
};

/**
 * A text field of a row.
 */
const text = (row: Row, field: string): string => {
  const value = row[field];

  return Predicate.isString(value) ? value : assert.fail(`${field} is not text`);
};

/**
 * The first row of `relation` that `where` accepts, which the test expects to exist.
 */
const find = (draft: Draft, relation: AnyRelation, where: (row: Row) => boolean): Row => {
  const found = of(draft, relation).find(where);
  assert.isDefined(found, relation.name);

  return found ?? {};
};

/**
 * The id of the first node of `kind`.
 */
const idOf = (draft: Draft, kind: string): string =>
  text(
    find(draft, Node, (row) => text(row, "kind") === kind),
    "id",
  );

/**
 * The id of the foreign element called `local` in `namespace`.
 */
const foreignId = (draft: Draft, local: string, namespace: string): string =>
  text(
    find(draft, ForeignElement, (row) => row["local"] === local && row["namespace"] === namespace),
    "id",
  );

/**
 * The foreign attribute `local` of the node `node`.
 */
const attributeOf = (draft: Draft, node: string, local: string): Row =>
  find(draft, ForeignAttribute, (row) => row["node"] === node && row["local"] === local);

/**
 * Set the prefix of the node `id`, the copy of a foreign element's prefix that `Node` holds.
 */
const setNodePrefix = (draft: Draft, id: string, prefix: string): void => {
  find(draft, Node, (row) => row["id"] === id)["prefix"] = prefix;
};

/**
 * The mathassess namespace of `operator-foreign-content`'s extension.
 */
const mathassess = "http://mathassess.qtitools.org/xsd/mathassess";

/**
 * Apply the draft through the author role, retrying a transient failure.
 */
const applyDraft = (draft: Draft) =>
  Effect.gen(function* applyChanges() {
    const db = yield* Db.open(AuthorApp.roles.author, {});

    return yield* db
      .apply(changeSetOf(draft), {})
      .pipe(Effect.retry({ schedule: retrySchedule, while: (e) => e._tag === "TransientFailure" }));
  });

/**
 * The rows a fixture's import builds, anew for each test so that no two applies share an identity.
 */
const fixtureRows = (name: FixtureName) =>
  Effect.gen(function* rowsOfFixture() {
    const { rows } = yield* readRows(yield* materialize(name));

    return draftOf(rows);
  });

/**
 * A law as a structural string: its kind and the relations and fields it names, never a message.
 */
const lawOf = (law: ImportLaw): string => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return `${law.kind} ${law.relation}(${law.fields.join(",")})`;
  }

  if (law.kind === "check") {
    return `check ${law.relation}.${law.name}`;
  }

  if (law.kind === "contained") {
    return `contained ${law.from.relation}(${law.from.fields.join(",")}) into ${law.to.relation}(${law.to.fields.join(",")})`;
  }

  return law.kind;
};

/**
 * One alteration of an accepted fixture's rows, the law it breaks and the rule the map names for
 * it. `laws` lists the laws that may refuse it when a duplicate breaks the keys of two relations at
 * once; the one grizzle reports is logged. `mapped` is false for the one law `ruleOfLaw` sorts by
 * its kind alone.
 */
interface Negative {
  readonly alter: (draft: Draft) => void;
  readonly base: FixtureName;
  readonly laws: readonly string[];
  readonly mapped?: boolean;
  readonly name: string;
  readonly rule: Rule;
}

/**
 * The containment W5 states: a foreign attribute's kind and processing are an attribute wildcard
 * host's.
 */
const wildcardHost =
  "contained ForeignAttribute(kind,process) into AttributeWildcard(host,process)";

/**
 * The bin 1 rules of the wildcard model, each broken in one place. Every copy of an altered field
 * is altered with it, so a refusal by another statement is a finding.
 */
const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      const bound = idOf(draft, "qti-base-value");
      const template = attributeOf(draft, foreignId(draft, "extension", mathassess), "k");

      of(draft, ForeignAttribute).push({
        ...template,
        kind: "qti-base-value",
        local: "w5",
        node: bound,
      });
    },
    base: "operator-foreign-content",
    laws: [wildcardHost],
    name: "W5: a foreign attribute on a node whose kind has no attribute wildcard is refused",
    rule: "wildcard-attribute",
  },
  {
    alter: (draft) => {
      attributeOf(draft, foreignId(draft, "extension", mathassess), "k")["process"] = "skip";
    },
    base: "operator-foreign-content",
    laws: [wildcardHost],
    name: "W5: a foreign attribute processed otherwise than its host's wildcard is refused",
    rule: "wildcard-attribute",
  },
  {
    alter: (draft) => {
      const element = find(draft, ForeignElement, (row) => row["local"] === "foo");

      assert.strictEqual(element["namespace"], "");
      element["prefix"] = "x";
      setNodePrefix(draft, text(element, "id"), "x");
    },
    base: "operator-foreign-content",
    laws: ["check ForeignElement.ForeignUnqualifiedUnprefixed"],
    name: "W8: a foreign element in no namespace that carries a prefix is refused",
    rule: "wildcard-attribute",
  },
  {
    alter: (draft) => {
      attributeOf(draft, foreignId(draft, "extension", mathassess), "plain")["prefix"] = "q";
    },
    base: "operator-foreign-content",
    laws: ["check ForeignAttribute.ForeignAttributePrefix"],
    name: "W8: an unqualified foreign attribute that carries a prefix is refused",
    rule: "wildcard-attribute",
  },
  {
    alter: (draft) => {
      attributeOf(draft, foreignId(draft, "extension", mathassess), "k")["prefix"] = "";
    },
    base: "operator-foreign-content",
    laws: ["check ForeignAttribute.ForeignAttributePrefix"],
    name: "W8: a qualified foreign attribute that carries no prefix is refused",
    rule: "wildcard-attribute",
  },
  {
    alter: (draft) => {
      const template = attributeOf(draft, foreignId(draft, "extension", mathassess), "k");

      of(draft, ForeignAttribute).push({ ...template, value: "again" });
    },
    base: "operator-foreign-content",
    laws: ["primaryKey ForeignAttribute(node,prefix,local)"],
    mapped: false,
    name: "W9: two foreign attributes of one qualified name on a node are refused by the key",
    rule: "document-key",
  },
  {
    alter: (draft) => {
      const holder = find(draft, DocumentXmlId, () => true);
      const other = foreignId(draft, "inner", mathassess);

      of(draft, DocumentId).push({
        document: text(holder, "document"),
        holder: "xmlId",
        id: text(holder, "id"),
      });
      of(draft, DocumentXmlId).push({ ...holder, node: other });
    },
    base: "operator-foreign-content",
    laws: ["primaryKey DocumentId(document,id)", "primaryKey DocumentXmlId(document,id)"],
    name: "W10: an xml:id that another element of the item's xs:ID space holds is refused",
    rule: "document-key",
  },
  {
    alter: (draft) => {
      const holder = find(draft, ManifestXmlId, () => true);
      const taken = text(
        find(draft, ManifestId, (row) => row["holder"] === "resource"),
        "id",
      );

      holder["id"] = taken;
      find(draft, ManifestId, (row) => row["holder"] === "xmlId")["id"] = taken;
    },
    base: "lom-wildcard",
    laws: ["primaryKey ManifestId(package,id)", "primaryKey ManifestXmlId(package,id)"],
    name: "W10: an xml:id equal to a resource's identifier in the manifest is refused",
    rule: "manifest-id-holder",
  },
  {
    alter: (draft) => {
      of(draft, XsiNil).push({
        kind: "qti-custom-operator",
        node: idOf(draft, "qti-custom-operator"),
        prefix: "xsi",
        value: "true",
      });
    },
    base: "operator-foreign-content",
    laws: ["check XsiNil.XsiNilUndeclared"],
    name: "an xsi:nil on an element a kind declares is refused",
    rule: "xsi-nil",
  },
  {
    alter: (draft) => {
      const node = idOf(draft, "qti-custom-operator");

      of(draft, XsiTypeAttribute).push({
        kind: "qti-custom-operator",
        local: "k",
        namespace: "",
        node,
        prefix: "",
        value: "1",
      });
    },
    base: "operator-foreign-content",
    laws: ["contained XsiTypeAttribute(node) into XsiType(node)"],
    name: "an attribute a derived xsi:type adds, on a node with no xsi:type, is refused",
    rule: "xsi-type",
  },
  {
    alter: (draft) => {
      const node = foreignId(draft, "extension", mathassess);

      of(draft, XsiType).push({ node, prefix: "xsi", value: "ma:T" });
      of(draft, XsiTypeAttribute).push({
        kind: "foreign",
        local: "k",
        namespace: "",
        node,
        prefix: "x",
        value: "1",
      });
    },
    base: "operator-foreign-content",
    laws: ["check XsiTypeAttribute.XsiTypeAttributePrefix"],
    name: "an attribute a derived xsi:type adds, in no namespace under a prefix, is refused",
    rule: "xsi-type",
  },
];

/**
 * One alteration the database admits: a row the importer or the reader would judge, or that the
 * schema states no law about. Each is the control of a rule above.
 */
interface Control {
  readonly alter: (draft: Draft) => void;
  readonly base: FixtureName;
  readonly name: string;
}

/**
 * The `xsi` attribute `local` as a foreign attribute row on `node`, copied from the extension's
 * `ma:k`.
 */
const xsiAttribute = (draft: Draft, node: string, local: string) => ({
  ...attributeOf(draft, foreignId(draft, "extension", mathassess), "k"),
  local,
  namespace: xsiNamespace,
  node,
  prefix: "xsi",
});

/**
 * The alterations that commit.
 */
const controls: readonly Control[] = [
  {
    alter: (draft) => {
      const node = foreignId(draft, "extension", mathassess);

      of(draft, ForeignAttribute).push(xsiAttribute(draft, node, "foo"));
    },
    base: "operator-foreign-content",
    name: "xsi:foo stored as a foreign attribute on a foreign element commits",
  },
  {
    alter: (draft) => {
      const node = foreignId(draft, "extension", mathassess);

      of(draft, ForeignAttribute).push({
        ...attributeOf(draft, node, "k"),
        prefix: "mb",
      });
    },
    base: "operator-foreign-content",
    name: "W9: one expanded name under two prefixes commits, for the reader refuses it, not the key",
  },
  {
    alter: (draft) => {
      const node = foreignId(draft, "extension", mathassess);

      of(draft, XsiNil).push({ kind: "foreign", node, prefix: "xsi", value: "true" });
    },
    base: "operator-foreign-content",
    name: "an xsi:nil on a foreign element commits",
  },
  {
    alter: (draft) => {
      of(draft, XsiType).push(
        { node: foreignId(draft, "extension", mathassess), prefix: "xsi", value: "ma:T" },
        { node: idOf(draft, "qti-base-value"), prefix: "xsi", value: "qti:T" },
      );
    },
    base: "operator-foreign-content",
    name: "an xsi:type on a foreign element, naming a type no schema resolves, and on a QTI element commits",
  },
  {
    alter: (draft) => {
      of(draft, NoNamespaceSchemaLocation).push(
        { node: foreignId(draft, "extension", mathassess), prefix: "xsi", value: "a.xsd" },
        { node: idOf(draft, "qti-assessment-item"), prefix: "xsi", value: "b.xsd" },
      );
    },
    base: "operator-foreign-content",
    name: "an xsi:noNamespaceSchemaLocation on a foreign element and on the root commits",
  },
  {
    alter: (draft) => {
      const node = foreignId(draft, "extension", mathassess);

      of(draft, XsiType).push({ node, prefix: "xsi", value: "ma:T" });
      of(draft, XsiTypeAttribute).push(
        { kind: "foreign", local: "k", namespace: "", node, prefix: "", value: "1" },
        { kind: "foreign", local: "k", namespace: mathassess, node, prefix: "ma", value: "2" },
      );
    },
    base: "operator-foreign-content",
    name: "attributes a derived xsi:type adds, on the node that carries the xsi:type, commit",
  },
];

/**
 * The fixtures whose unaltered rows are the controls of the negatives. `lom-wildcard` also holds
 * two foreign `xml:id` attributes of one value in an `externalLom` record, where the `lom` set
 * declares no `xs:ID` to hold them.
 */
const bases: readonly FixtureName[] = ["operator-foreign-content", "lom-wildcard"];

/**
 * An item with every `xsi` attribute: `xsi:noNamespaceSchemaLocation` on the root, a `qti-null`
 * whose `xsi:type` names `MapEntryDType` with the two attributes that type requires, and a custom
 * operator with `xsi:foo` and a foreign `ma:ext` with `xsi:foo`, `xsi:type` and `xsi:nil`.
 */
const xsiItem = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
  ' xmlns:qti="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
  ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ma="urn:test:ma"',
  ' xsi:noNamespaceSchemaLocation="root.xsd" identifier="xsi" title="xsi"',
  ' adaptive="false" time-dependent="false">',
  '<qti-outcome-declaration identifier="S" cardinality="single" base-type="integer"/>',
  "<qti-item-body><p>x</p></qti-item-body>",
  "<qti-response-processing>",
  '<qti-set-outcome-value identifier="S"><qti-null xsi:type="qti:MapEntryDType" map-key="a" mapped-value="1"/></qti-set-outcome-value>',
  '<qti-set-outcome-value identifier="S"><qti-custom-operator class="x" xsi:foo="1"><qti-base-value base-type="integer">1</qti-base-value><ma:ext xsi:foo="1" xsi:type="ma:T" xsi:nil="true"/></qti-custom-operator></qti-set-outcome-value>',
  "</qti-response-processing>",
  "</qti-assessment-item>",
  "",
].join("");

/**
 * The path of the item inside its package.
 */
const xsiItemPath = "xsi-round-trip/item.xml";

/**
 * The package of `xsiItem`: the 3.0.1 package of one item the cut makes, with the item written
 * into it first.
 */
const xsiPackage = (): FixtureSpec => {
  const cut = cutItem("xsi-round-trip", "BPIG_22April", xsiItemPath, "3.0.1");

  return {
    ...cut,
    edits: [{ _tag: "addFile", path: xsiItemPath, source: { text: xsiItem } }, ...cut.edits],
  };
};

/**
 * An accepted apply's answer: the rows added to each relation.
 */
const Accepted = Schema.Struct({ kind: Schema.Literal("accepted") });

const decodeAccepted = Schema.decodeUnknownOption(Accepted);

describe.skipIf(!hasLease)(
  "schema/foreign.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the bin 1 rules of the wildcard model, by direct ChangeSet", (it) => {
      for (const negative of negatives) {
        it.effect(negative.name, () =>
          Effect.gen(function* refusedByLaw() {
            const draft = yield* fixtureRows(negative.base);
            negative.alter(draft);

            const outcome = yield* applyDraft(draft);

            assert.strictEqual(
              outcome.kind,
              "invariant-rejected",
              `${negative.name}: ${outcome.kind}`,
            );

            if (outcome.kind === "invariant-rejected") {
              const law: ImportLaw = outcome.law;

              yield* Effect.log(`${negative.name}: ${lawOf(law)}`);

              assert.include(negative.laws, lawOf(law), negative.name);
              assert.strictEqual(ruleOfLaw(law), negative.rule, lawOf(law));
              assert.strictEqual(
                refusalOfLaw(law, outcome.witness).rule,
                negative.rule,
                lawOf(law),
              );
              assert.strictEqual(isMappedLaw(law), negative.mapped ?? true, lawOf(law));
            }
          }),
        );
      }

      for (const base of bases) {
        it.effect(`${base}'s unaltered rows are accepted, so each refusal above is its own`, () =>
          Effect.gen(function* unalteredAccepted() {
            const outcome = yield* applyDraft(yield* fixtureRows(base));

            assert.strictEqual(outcome.kind, "accepted");
          }),
        );
      }

      it.effect(
        "lom-wildcard holds two foreign xml:id attributes of one value, and they commit",
        () =>
          Effect.gen(function* duplicateInLom() {
            const draft = yield* fixtureRows("lom-wildcard");
            const ids = of(draft, ForeignAttribute).filter(
              (row) => row["local"] === "id" && row["schemaSet"] === "lom",
            );

            assert.strictEqual(ids.length, 2);
            assert.strictEqual(ids[0]?.["value"], ids[1]?.["value"]);
            assert.strictEqual((yield* applyDraft(draft)).kind, "accepted");
          }),
      );

      for (const control of controls) {
        it.effect(control.name, () =>
          Effect.gen(function* committed() {
            const draft = yield* fixtureRows(control.base);
            control.alter(draft);

            const outcome = yield* applyDraft(draft);

            assert.strictEqual(
              outcome.kind,
              "accepted",
              `${control.name}: ${outcome.kind} ${outcome.kind === "invariant-rejected" ? lawOf(outcome.law) : ""}`,
            );
          }),
        );
      }
    });

    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the round trip of the xsi attributes through the database", (it) => {
      it.effect(
        "an item with every xsi attribute is accepted, read back by value and canonical-equal",
        () =>
          Effect.gen(function* xsiRoundTrip() {
            const fs = yield* FileSystem.FileSystem;
            const source = yield* materializeSpec(xsiPackage());
            const accepted = { value: false };
            const id = yield* importPackage(source, {
              wrapApply: (apply) =>
                apply.pipe(
                  Effect.tap((outcome) =>
                    Option.match(decodeAccepted(outcome), {
                      onNone: () => Effect.void,
                      onSome: () =>
                        Effect.sync(() => {
                          accepted.value = true;
                        }),
                    }),
                  ),
                ),
            });

            assert.isTrue(accepted.value, "the apply was not accepted");

            yield* fs.remove(exportRoot, { force: true, recursive: true });
            yield* fs.makeDirectory(exportRoot, { recursive: true });
            yield* exportPackage(id, exportRoot);

            const report = yield* comparePackage(source, exportRoot);

            assert.strictEqual(
              report.filter((item) => item.outcome.kind === "differs").length,
              0,
              renderReport(report),
            );
            assert.strictEqual(
              report.find((item) => item.path === xsiItemPath)?.outcome.kind,
              "canonical-equal",
              renderReport(report),
            );

            const attributes = yield* rowsOf(id, XsiTypeAttribute);
            const types = yield* rowsOf(id, XsiType);
            const nils = yield* rowsOf(id, XsiNil);
            const locations = yield* rowsOf(id, NoNamespaceSchemaLocation);
            const foreign = yield* rowsOf(id, ForeignAttribute);

            assert.deepStrictEqual(
              attributes
                .map((r) => `${r.kind}|${r.prefix}|${r.local}|${r.namespace}|${r.value}`)
                .toSorted(),
              ["qti-null||map-key||a", "qti-null||mapped-value||1"],
            );
            assert.deepStrictEqual(types.map((r) => `${r.prefix}|${r.value}`).toSorted(), [
              "xsi|ma:T",
              "xsi|qti:MapEntryDType",
            ]);
            assert.deepStrictEqual(
              nils.map((r) => `${r.kind}|${r.prefix}|${r.value}`),
              ["foreign|xsi|true"],
            );
            assert.deepStrictEqual(
              locations.map((r) => `${r.prefix}|${r.value}`),
              ["xsi|root.xsd"],
            );
            assert.deepStrictEqual(
              foreign
                .filter((r) => r.namespace === xsiNamespace)
                .map((r) => `${r.kind}|${r.prefix}|${r.local}|${r.value}`)
                .toSorted(),
              ["foreign|xsi|foo|1", "qti-custom-operator|xsi|foo|1"],
            );
          }),
      );
    });
  },
);
