import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Array as Arr, Context, Effect, FileSystem, Layer, Option, Order, Result } from "effect";
import { Digest } from "effect/crypto";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { settings } from "#pantry/test/settings.ts";
import {
  attributeOf,
  attributeWildcardsOf,
  firstXs,
  hostsOf,
  loadSchema,
  loadSchemaSet,
  mathmlKindsOf,
  mathmlReadingsOf,
  mathmlSource,
} from "#pantry/vocab/derive/derive.ts";
import type { MathmlReading, SchemaSet, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";
import { mathmlInventory } from "#pantry/vocab/inventory/mathml.ts";
import {
  admission,
  asiMathName,
  attributes,
  gaps,
  kinds,
  mathHostRows,
  namespace,
  pendingHosts,
  registry,
  simpleContent,
  wildcardContent,
  wildcards,
} from "#pantry/vocab/mathml.ts";
import type { MathmlKind } from "#pantry/vocab/mathml.ts";
import { openNameOf } from "#pantry/vocab/open.ts";

/**
 * The kinds files of today's composition, in `node.ts`'s composition order: the roster the MathML
 * kinds and attribute names are appended to.
 */
const composition = [generic, asi, html, cp, lom, qmd, cpx, drd, csmd, ud, xi] as const;

/**
 * The kinds today's roster holds.
 */
const composedKinds: ReadonlySet<string> = new Set(
  composition.flatMap((vocabulary) => vocabulary.kinds),
);

/**
 * The inventory entry of a MathML kind, failing the test when the leaf has none.
 *
 * @param kind - The kind.
 * @returns Its entry.
 */
const entryOf = (kind: MathmlKind) =>
  Option.getOrElse(Option.fromNullishOr(mathmlInventory[kind]), () =>
    assert.fail(`the MathML leaf has no entry ${kind}`),
  );

/**
 * The attribute names today's roster holds.
 */
const roster: ReadonlySet<string> = new Set(
  composition.flatMap((vocabulary) => vocabulary.attributes),
);

/**
 * The character kinds, which the generic vocabulary declares and no element is.
 */
const characterKinds: ReadonlySet<string> = new Set(generic.kinds);

/**
 * The MathML the 28 corpus packages use, surveyed on 2026-11-05 over every XML file of every zip
 * the corpus witness reads, and re-measured by the `GR8DES_CORPUS=1` test below: each element's
 * local name, each attribute as (element, attribute), each MathML parent and child, and each
 * parent of `math`.
 */
const corpus = {
  attributes: [
    ["annotation", "encoding"],
    ["math", "alttext"],
    ["math", "display"],
    ["math", "id"],
    ["math", "overflow"],
    ["mfenced", "close"],
    ["mfenced", "open"],
    ["mo", "class"],
    ["mtd", "columnalign"],
  ],
  children: [
    ["math", "mfrac"],
    ["math", "mi"],
    ["math", "mrow"],
    ["math", "mstyle"],
    ["math", "semantics"],
    ["mfenced", "mi"],
    ["mfenced", "mn"],
    ["mfenced", "mrow"],
    ["mfrac", "mi"],
    ["mfrac", "mrow"],
    ["mrow", "mfenced"],
    ["mrow", "mfrac"],
    ["mrow", "mi"],
    ["mrow", "mn"],
    ["mrow", "mo"],
    ["mrow", "mrow"],
    ["mrow", "msqrt"],
    ["mrow", "msub"],
    ["mrow", "msup"],
    ["msqrt", "mn"],
    ["mstyle", "mrow"],
    ["msub", "mi"],
    ["msup", "mi"],
    ["msup", "mn"],
    ["msup", "mrow"],
    ["mtable", "mtr"],
    ["mtd", "mfenced"],
    ["mtd", "mfrac"],
    ["mtd", "mi"],
    ["mtd", "mn"],
    ["mtd", "mo"],
    ["mtd", "mrow"],
    ["mtd", "msup"],
    ["mtr", "mtd"],
    ["semantics", "annotation"],
    ["semantics", "mfrac"],
    ["semantics", "mrow"],
    ["semantics", "mtable"],
  ],
  elements: [
    "annotation",
    "math",
    "mfenced",
    "mfrac",
    "mi",
    "mn",
    "mo",
    "mrow",
    "msqrt",
    "mstyle",
    "msub",
    "msup",
    "mtable",
    "mtd",
    "mtr",
    "semantics",
  ],
  hosts: [
    "div",
    "p",
    "qti-content-body",
    "qti-feedback-inline",
    "qti-inline-choice",
    "qti-prompt",
    "qti-simple-associable-choice",
    "qti-simple-choice",
  ],
} as const;

/**
 * Whether a MathML kind is admitted under a parent in both schema versions.
 *
 * @param parent - The parent kind.
 * @param child - The child kind.
 * @returns Whether both versions hold the row.
 */
const admitted = (parent: string, child: string): boolean =>
  (["3.0.0", "3.0.1"] as const).every((version) =>
    admission.some(
      (row) => row.parent === parent && row.child === child && row.version === version,
    ),
  );

/**
 * The kinds a MathML kind admits under one version, in row order.
 *
 * @param parent - The parent kind.
 * @returns Its children under 3.0.1.
 */
const childrenOf = (parent: MathmlKind): readonly string[] =>
  admission
    .filter((row) => row.parent === parent && row.version === "3.0.1")
    .map((row) => row.child);

/**
 * Resolve an element of the MathML namespace to its kind through the registry.
 *
 * @param local - The element's local name.
 * @returns The kind whose registry row names it, or `None`.
 */
const resolveKind = (local: string): Option.Option<MathmlKind> =>
  Arr.findFirst(
    kinds,
    (kind) => registry[kind].namespace === namespace && registry[kind].local === local,
  );

describe("vocab/mathml.ts", () => {
  it("lists 193 kinds, each its inventory entry's element prefixed m:", () => {
    assert.strictEqual(kinds.length, 193);
    assert.strictEqual(new Set(kinds).size, 193);
    assert.deepStrictEqual(Arr.sort(kinds, Order.String), Object.keys(mathmlInventory));

    for (const kind of kinds) {
      const entry = entryOf(kind);

      assert.strictEqual(entry.handle, kind);
      assert.strictEqual(`m:${entry.element}`, kind);
      assert.isFalse(composedKinds.has(kind));
    }
  });

  it("introduces the 111 of its 129 attribute names today's roster lacks, in first appearance", () => {
    const names = Arr.dedupe(
      kinds.flatMap((kind) => entryOf(kind).attributes.map((row) => row.name)),
    );

    assert.strictEqual(names.length, 129);
    assert.deepStrictEqual(
      names.filter((name) => !roster.has(name)),
      [...attributes],
    );
    assert.strictEqual(attributes.length, 111);
    assert.deepStrictEqual(
      names.filter((name) => roster.has(name)),
      [
        "align",
        "dir",
        "height",
        "open",
        "rowspan",
        "valign",
        "width",
        "id",
        "class",
        "href",
        "name",
        "encoding",
        "src",
        "alt",
        "index",
        "type",
        "scope",
        "base",
      ],
    );
  });

  it("gives each kind its local name, the MathML namespace and its entry's attribute names", () => {
    for (const kind of kinds) {
      assert.deepStrictEqual(registry[kind], {
        attributes: Arr.dedupe(entryOf(kind).attributes.map((row) => row.name)),
        local: kind.slice("m:".length),
        namespace,
        parent: Option.none(),
      });
    }
  });

  it("admits each kind's element children and its content type's character kinds, in both versions", () => {
    const keys = admission.map((row) => `${row.version} ${row.parent} ${row.child}`);

    assert.strictEqual(new Set(keys).size, keys.length);

    for (const kind of kinds) {
      const entry = entryOf(kind);

      for (const child of entry.children) {
        assert.isTrue(admitted(kind, child.name), `${child.name} under ${kind}`);
      }

      for (const child of childrenOf(kind)) {
        assert.isTrue(
          characterKinds.has(child) || kinds.some((known) => known === child),
          `${child} under ${kind} is a MathML or character kind`,
        );
      }
    }

    assert.deepStrictEqual(childrenOf("m:cbytes"), ["text", "ws", "entityRef", "comment", "pi"]);
    assert.deepStrictEqual(childrenOf("m:annotation-xml"), ["ws", "comment", "pi"]);
    assert.deepStrictEqual(childrenOf("m:plus"), ["comment", "pi"]);
    assert.deepStrictEqual(childrenOf("m:mi"), [
      "m:mglyph",
      "m:malignmark",
      "text",
      "ws",
      "entityRef",
      "comment",
      "pi",
    ]);
    assert.deepStrictEqual(childrenOf("m:mtr"), ["m:mtd", "ws", "comment", "pi"]);
  });

  it("admits m:math under the 63 hosts of today's composition, in both versions", () => {
    const rows = mathHostRows(inventory);
    const hosts = Arr.dedupe(rows.map((row) => row.parent));

    assert.strictEqual(hosts.length, 63);
    assert.strictEqual(rows.length, 126);
    for (const host of hosts) {
      assert.isTrue(admitted(host, "m:math"), host);
    }

    assert.deepStrictEqual(
      Object.values(inventory)
        .filter((entry) => entry.children.some((child) => child.name === asiMathName))
        .map((entry) => entry.handle),
      hosts,
    );
  });

  it("resolves the 16 MathML elements, 9 attributes and every placement the corpus uses", () => {
    for (const local of corpus.elements) {
      assert.isTrue(Option.isSome(resolveKind(local)), local);
    }

    for (const [element, name] of corpus.attributes) {
      const kind = Option.getOrThrow(resolveKind(element));

      assert.include(registry[kind].attributes, name, `${name} on ${kind}`);
    }

    for (const [parent, child] of corpus.children) {
      assert.isTrue(admitted(`m:${parent}`, `m:${child}`), `${child} under ${parent}`);
    }

    for (const host of corpus.hosts) {
      const hostKinds = composition.flatMap((vocabulary) =>
        Object.entries(vocabulary.registry).flatMap(([kind, row]) =>
          row.local === host ? [kind] : [],
        ),
      );

      assert.isAbove(hostKinds.length, 0, host);
      for (const kind of hostKinds) {
        assert.isTrue(admitted(kind, "m:math"), `m:math under ${kind}`);
      }
    }
  });

  it("states the attribute wildcard of 182 elements, which open.ts reads as foreign names", () => {
    const [statement] = wildcards;
    const unstated = kinds
      .map((kind) => kind.slice("m:".length))
      .filter((local) => !statement.elements.includes(local));

    assert.strictEqual(statement.elements.length, 182);
    assert.deepStrictEqual(statement.elements, Arr.sort(statement.elements, Order.String));
    assert.deepStrictEqual(Arr.sort(unstated, Order.String), [
      "condition",
      "declare",
      "degree",
      "domainofapplication",
      "fn",
      "logbase",
      "lowlimit",
      "momentabout",
      "reln",
      "sep",
      "uplimit",
    ]);

    const element = { local: "mi", namespace };
    const wildcard = Option.some(statement.wildcard);

    assert.deepStrictEqual(
      openNameOf(element, wildcard, {
        local: "speech",
        namespace: "urn:example:speech",
        prefix: "s",
        qname: "s:speech",
      }),
      Result.succeed({ _tag: "foreign", local: "speech", prefix: "s", uri: "urn:example:speech" }),
    );
    assert.isTrue(
      Result.isFailure(
        openNameOf(element, wildcard, {
          local: "speech",
          namespace: "",
          prefix: "",
          qname: "speech",
        }),
      ),
    );
  });

  it("records the rules D4 and D12 leave unstated", () => {
    assert.include(gaps.order.decision, "D4");
    assert.include(gaps.relaxng.decision, "D12");
    assert.deepStrictEqual(Object.keys(gaps), [
      "annotation-xml",
      "attribute-values",
      "order",
      "relaxng",
      "semantics-context",
    ]);
  });
});

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when all the
 * pinned XSDs are present. Any other failure of the check fails the file's load.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, for the hook that reads the MathML schema and the ASI 3.0.1 XSD.
 *
 * The ASI XSD is 18 MB and takes most of it: derive.test.ts measured 2.7 to 3.0 s for all 14 pinned
 * files on 2026-11-05 under load. The budget is that suite's, 20 s.
 */
const schemasHookTimeoutMs = 20_000;

/**
 * The pinned XSDs this suite reads, once: the MathML schema through its includes, its readings,
 * and the ASI 3.0.1 schema.
 */
class Schemas extends Context.Service<
  Schemas,
  {
    readonly asi301: XsdSchema;
    readonly mathml: SchemaSet;
    readonly readings: readonly MathmlReading[];
  }
>()("vocab/mathml.test/Schemas") {}

/**
 * Read the MathML schema and the ASI 3.0.1 schema through their pins.
 */
const SchemasLayer = Layer.effect(
  Schemas,
  Effect.gen(function* readSchemas() {
    const mathml = yield* loadSchemaSet(mathmlSource);

    return Schemas.of({
      asi301: yield* loadSchema("imsqti_asiv3p0p1_v1p0.xsd"),
      mathml,
      readings: yield* Effect.fromResult(mathmlReadingsOf(mathml)),
    });
  }),
).pipe(Layer.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)));

if (Option.isSome(absence)) {
  it("checks the MathML vocabulary against the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/mathml.ts against the pinned XSDs", () => {
  layer(SchemasLayer, { timeout: schemasHookTimeoutMs })("from the cache", (cached) => {
    cached.effect("lists the kinds in the order of the XSD's documents", () =>
      Effect.gen(function* order() {
        const { mathml } = yield* Schemas;
        const parts = yield* Effect.fromResult(mathmlKindsOf(mathml));

        assert.deepStrictEqual(
          parts.flatMap(({ names }) => names.map((name) => `m:${name}`)),
          [...kinds],
        );
      }),
    );

    cached.effect("has simple content and element-wildcard content exactly where listed", () =>
      Effect.gen(function* content() {
        const { readings } = yield* Schemas;

        assert.deepStrictEqual(
          readings
            .filter(({ complexType }) => Option.isSome(firstXs(complexType, "simpleContent")))
            .map(({ entry }) => entry.handle),
          [...simpleContent],
        );
        assert.deepStrictEqual(
          readings.filter(({ entry }) => entry.wildcard).map(({ entry }) => entry.handle),
          [...wildcardContent],
        );
      }),
    );

    cached.effect("states the attribute wildcard the XSD gives, on the elements it gives it", () =>
      Effect.gen(function* wildcardStatement() {
        const { mathml, readings } = yield* Schemas;
        const holders: string[] = [];

        for (const { complexType, entry } of readings) {
          const held = yield* Effect.fromResult(attributeWildcardsOf(mathml.schema, complexType));

          for (const wildcard of held) {
            assert.deepStrictEqual(
              [attributeOf(wildcard, "namespace"), attributeOf(wildcard, "processContents")],
              [Option.some("##other"), Option.some("skip")],
            );
          }

          if (held.length > 0) {
            holders.push(entry.element);
          }
        }

        assert.deepStrictEqual(wildcards[0].elements, Arr.sort(holders, Order.String));
      }),
    );

    cached.effect("admits m:math under the XSD's 61 hosts in 34 types, five of them pending", () =>
      Effect.gen(function* hosts() {
        const { asi301 } = yield* Schemas;
        const found = yield* Effect.fromResult(hostsOf(asi301, asiMathName));
        const entries = Object.values(inventory);
        const matched = found.flatMap((host) =>
          entries.filter((entry) => entry.element === host.element && entry.type === host.type),
        );
        const pending = found.filter(
          (host) =>
            !entries.some((entry) => entry.element === host.element && entry.type === host.type),
        );

        assert.strictEqual(new Set(found.map((host) => host.element)).size, 61);
        assert.strictEqual(new Set(found.map((host) => host.type)).size, 34);
        assert.deepStrictEqual(
          Arr.sort(
            matched.map((entry) => entry.handle),
            Order.String,
          ),
          Arr.sort(Arr.dedupe(mathHostRows(inventory).map((row) => row.parent)), Order.String),
        );
        assert.deepStrictEqual(
          pending.toSorted((left, right) =>
            `${left.element} ${left.type}` < `${right.element} ${right.type}` ? -1 : 1,
          ),
          [...pendingHosts],
        );
      }),
    );
  });
});

/**
 * The MathML a document uses: its MathML elements' local names, their (element, attribute) pairs,
 * the (parent, child) pairs of MathML elements, and the parents of `math`.
 */
interface Usage {
  readonly attributes: Set<string>;
  readonly children: Set<string>;
  readonly elements: Set<string>;
  readonly hosts: Set<string>;
}

/**
 * Sort names in code-point order.
 *
 * @param values - The names.
 * @returns Them, sorted.
 */
const sorted = (values: Iterable<string>): readonly string[] => Arr.sort(values, Order.String);

/**
 * Record the MathML an element's subtree uses, without recursion.
 *
 * @param root - The subtree's root.
 * @param usage - The sets to add to.
 * @returns Nothing; the sets hold the subtree's MathML.
 */
const collectUsage = (root: Element, usage: Usage): void => {
  const pending: Element[] = [root];

  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const parent = next;

    for (const child of parent.children) {
      if (child.kind === "element") {
        pending.push(child);
        if (child.namespace === namespace) {
          if (parent.namespace === namespace) {
            usage.children.add(`${parent.local} ${child.local}`);
          } else if (child.local === "math") {
            usage.hosts.add(parent.local);
          }
        }
      }
    }

    if (parent.namespace === namespace) {
      usage.elements.add(parent.local);
      for (const attribute of parent.attributes) {
        if (attribute.namespace !== "http://www.w3.org/2000/xmlns/") {
          usage.attributes.add(`${parent.local} ${attribute.qname}`);
        }
      }
    }
  }
};

layer(NodeServices.layer)("vocab/mathml.ts over the corpus", (corpusIt) => {
  corpusIt.effect.skipIf(!settings.corpusRequested)(
    "finds exactly the MathML the survey lists in the corpus packages",
    () =>
      Effect.gen(function* survey() {
        const fs = yield* FileSystem.FileSystem;
        const usage: Usage = {
          attributes: new Set(),
          children: new Set(),
          elements: new Set(),
          hosts: new Set(),
        };

        for (const { dir } of yield* materializeCorpus()) {
          const files = (yield* fs.readDirectory(dir, { recursive: true })).filter((file) =>
            file.endsWith(".xml"),
          );

          for (const file of files) {
            const document = yield* fs
              .readFile(`${dir}/${file}`)
              .pipe(Effect.flatMap(readXml), Effect.option);

            if (Option.isSome(document)) {
              collectUsage(document.value.root, usage);
            }
          }
        }

        assert.deepStrictEqual(sorted(usage.elements), [...corpus.elements]);
        assert.deepStrictEqual(
          sorted(usage.attributes),
          corpus.attributes.map(([element, name]) => `${element} ${name}`),
        );
        assert.deepStrictEqual(
          sorted(usage.children),
          corpus.children.map(([parent, child]) => `${parent} ${child}`),
        );
        assert.deepStrictEqual(sorted(usage.hosts), [...corpus.hosts]);
      }),
    { timeout: 600_000 },
  );
});
