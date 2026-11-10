import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace, walk } from "#plate/document/source.ts";
import type { SourceDocument } from "#plate/document/source.ts";
import { configure, decodeRedacted, encodeRedacted, open, redact, render } from "#plate/index.ts";
import type { Accepted, Configuration, Element, Node, Verdict } from "#plate/index.ts";
import type { BodyAttribute, BodyNode, Item } from "#plate/model/item.ts";
import { attribute } from "#plate/test/accessibility.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The item instance token every render here passes, so the id an authored `id="grid"` renders as
 * is `q1--grid`.
 */
const instance = "q1";

/**
 * The location the fixture is opened under, which a refusal would carry.
 */
const location = "items/aria-full.xml";

/**
 * The fixture, an item whose body holds every ARIA state and property the schema declares on
 * item-body HTML, and a single Choice.
 */
const fixturePath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "fixtures",
  "m5",
  "items",
  "aria-full.xml",
);

/**
 * The attributes that name another element by its `id`, which the body walk rewrites to the
 * target's rendered id: the eight ARIA ones the schema declares as ID references.
 */
const referenceNames: ReadonlySet<string> = new Set([
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
]);

/**
 * ARIA's spelling of the shortcut attribute, which the schema declares on every non-empty element
 * and the body walk writes on every element.
 */
const keyShortcuts = "aria-keyshortcuts";

/**
 * The schema's spelling of the shortcut attribute on the empty elements, which the body walk writes
 * as {@link keyShortcuts}.
 */
const keyShortcutsMisspelt = "aria-keyshorts";

/**
 * Read the fixture as text.
 */
const fixtureText = Effect.tryPromise(() => readFile(fixturePath, "utf-8"));

/**
 * Give the ARIA attributes the schema declares on an element of the item body, by name.
 *
 * @param element The element's local name in the QTI namespace.
 * @returns Every attribute in no namespace whose name starts with `aria-`, in the order the tables
 *   list them.
 */
const declaredAria = (element: string): readonly string[] =>
  (tables.elements[element]?.attributes ?? [])
    .filter((declaration) => declaration.namespace === "" && declaration.local.startsWith("aria-"))
    .map((declaration) => declaration.local);

/**
 * Give the values of the `role` attribute the schema declares on an element of the item body.
 *
 * @param element The element's local name in the QTI namespace.
 * @returns The enumeration's values, in the order the tables list them.
 */
const declaredRoles = (element: string): readonly string[] => {
  const declaration = (tables.elements[element]?.attributes ?? []).find(
    (candidate) => candidate.namespace === "" && candidate.local === "role",
  );

  return declaration?.type.kind === "enumeration"
    ? declaration.type.values
    : assert.fail(`the tables declare no enumerated role on ${element}`);
};

/**
 * Open a document's text and take the accepted item the verdict holds.
 *
 * @param xml The document's text.
 * @returns The accepted item; the test fails when the verdict does not accept an item.
 */
const acceptText = Effect.fnUntraced(function* acceptText(xml: string) {
  const verdict: Verdict = yield* open(location, new TextEncoder().encode(xml));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(
      `${location} is ${verdict.verdict}${
        verdict.verdict === "refused"
          ? `: ${verdict.refusals.map((refusal) => refusal.rule).join(", ")}`
          : ""
      }, not accepted`,
    ),
  );
});

/**
 * Open the fixture.
 *
 * @returns The accepted fixture and its source, which holds the values as the author wrote them.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  const xml = yield* fixtureText;
  const accepted: Accepted = yield* acceptText(xml);
  const source: SourceDocument = yield* readSource(location, new TextEncoder().encode(xml));

  return { accepted, source };
});

/**
 * Parse one emitted HTML fragment into its single root element.
 *
 * @param html The fragment.
 * @returns Its root element.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);
  assert.lengthOf(rest, 0, "the fragment has one root");

  return root?.kind === "element" ? root : assert.fail("the fragment's root is not an element");
};

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Find the element of a render by its `id`.
 *
 * @param root The render's root element.
 * @param id The id as rendered, instance scope included.
 * @returns The element; the test fails when the render holds none.
 */
const byId = (root: Element, id: string): Element =>
  elementsOf([root]).find((element) => attribute(element, "id") === id) ??
  assert.fail(`the render holds no element with the id ${id}`);

/**
 * Give the id an author's `id` renders as under {@link instance}.
 *
 * @param id The id as the author wrote it.
 * @returns The rendered id: the instance, an empty segment and the id, joined by `-`.
 */
const renderedId = (id: string): string => `${instance}--${id}`;

/**
 * Give the value an ID reference renders as: each of its ids scoped by the instance, joined by one
 * space.
 *
 * @param value The attribute's value as the author wrote it.
 * @returns The value as rendered.
 */
const renderedReferences = (value: string): string =>
  value
    .split(" ")
    .map((id) => renderedId(id))
    .join(" ");

/**
 * Render an accepted item as a host does: redacted, then rendered under one instance token.
 *
 * @param accepted The accepted item.
 * @returns The redacted item, the configuration, the HTML and its root element.
 */
const renderAccepted = Effect.fnUntraced(function* renderAccepted(accepted: Accepted) {
  const configuration: Configuration = yield* configure({});
  const redacted = redact(accepted);
  const rendered = yield* Effect.fromResult(render(redacted, configuration, { instance }));

  return { configuration, html: rendered.html, redacted, root: rootOf(rendered.html) };
});

/**
 * Open the fixture and render it.
 *
 * @returns What {@link renderAccepted} gives for the accepted fixture, and the fixture's source.
 */
const renderFixture = Effect.fnUntraced(function* renderFixture() {
  const { accepted, source } = yield* acceptFixture();

  return { ...(yield* renderAccepted(accepted)), accepted, source };
});

/**
 * An element of the fixture's source that carries ARIA states, properties or a role, with them as
 * the author wrote them.
 */
interface Authored {
  readonly id: string;
  readonly values: ReadonlyMap<string, string>;
}

/**
 * Collect the elements of the fixture's source that carry an `aria-*` attribute or a `role`, so the
 * rendered element is found by its `id`.
 *
 * @param source The fixture's source document.
 * @returns Each such element's `id` and its ARIA attributes and role as written; the test fails on
 *   an element that carries one and has no `id`.
 */
const authoredIn = (source: SourceDocument): readonly Authored[] =>
  [...walk(source)].flatMap(({ element }): readonly Authored[] => {
    if (element.namespace !== qtiNamespace) {
      return [];
    }

    const own = new Map(
      element.attributes
        .filter((candidate) => candidate.namespace === "")
        .map((candidate) => [candidate.local, candidate.value] as const),
    );
    const values = new Map(
      [...own].filter(([name]) => name.startsWith("aria-") || name === "role"),
    );
    const id = own.get("id");

    if (values.size === 0) {
      return [];
    }

    return id === undefined
      ? assert.fail(`a ${element.local} of the fixture carries ARIA and has no id`)
      : [{ id, values }];
  });

/**
 * Edit the attributes of the body element with one authored `id`, anywhere in a body.
 *
 * @param body The body's nodes.
 * @param id The authored `id` of the element to edit.
 * @param edit Gives the element's new attributes from its current ones.
 * @returns The body with that element's attributes replaced.
 */
const editElement = (
  body: readonly BodyNode[],
  id: string,
  edit: (attributes: readonly BodyAttribute[]) => readonly BodyAttribute[],
): readonly BodyNode[] =>
  body.map((node) =>
    node.kind === "element"
      ? {
          ...node,
          attributes: node.attributes.some(
            (candidate) => candidate.name === "id" && candidate.value === id,
          )
            ? edit(node.attributes)
            : node.attributes,
          children: editElement(node.children, id, edit),
        }
      : node,
  );

/**
 * Build a variant of the fixture's item by hand, since `check` refuses a document the walk should
 * never meet: the one named seam, `acceptForTest`, secures nothing.
 *
 * @param item The fixture's item.
 * @param id The authored `id` of the element to edit.
 * @param edit Gives the element's new attributes from its current ones.
 * @returns The item, accepted as it stands, with that element's attributes replaced.
 */
const variantOf = (
  item: Item,
  id: string,
  edit: (attributes: readonly BodyAttribute[]) => readonly BodyAttribute[],
): Accepted => acceptForTest({ ...item, body: editElement(item.body, id, edit) });

describe("ARIA Full over the body walk", () => {
  it.effect(
    "[A-2b] every declared aria state and property on body HTML reaches the rendered HTML",
    () =>
      Effect.gen(function* everyState() {
        const { root, source } = yield* renderFixture();
        const declared = declaredAria("div");
        const names = declared.filter((name) => name !== keyShortcuts);
        const authored = authoredIn(source);

        assert.lengthOf(declared, 46, "the schema declares 46 aria states and properties");
        assert.lengthOf(names, 45, "45 of them are not the shortcut attribute");

        for (const name of names) {
          const holders = authored.filter((element) => element.values.has(name));

          assert.isAbove(holders.length, 0, `the fixture writes ${name}`);

          for (const holder of holders) {
            const value = holder.values.get(name) ?? assert.fail(`${holder.id} lost ${name}`);

            assert.strictEqual(
              attribute(byId(root, renderedId(holder.id)), name),
              referenceNames.has(name) ? renderedReferences(value) : value,
              `${name} on ${holder.id}`,
            );
          }
        }
      }),
  );

  it.effect("[A-2b] each ID reference names its target's rendered id", () =>
    Effect.gen(function* eachReference() {
      const { root } = yield* renderFixture();
      const ids = new Set(elementsOf([root]).flatMap((element) => attribute(element, "id") ?? []));
      const relations = byId(root, renderedId("relations"));
      const colours = byId(root, renderedId("colours"));
      const expected: readonly (readonly [Element, string, string])[] = [
        [relations, "aria-controls", "q1--results q1--volume"],
        [relations, "aria-owns", "q1--owned"],
        [relations, "aria-flowto", "q1--notes"],
        [relations, "aria-details", "q1--details"],
        [relations, "aria-errormessage", "q1--problem"],
        [colours, "aria-activedescendant", "q1--colour-green"],
      ];

      for (const [element, name, value] of expected) {
        assert.strictEqual(attribute(element, name), value, `${name} on ${element.tag}`);

        for (const target of value.split(" ")) {
          assert.isTrue(ids.has(target), `${name} names ${target}, which the render holds`);
        }
      }
    }),
  );

  it.effect("[A-2b] a two-id reference list is scoped id by id", () =>
    Effect.gen(function* twoIds() {
      const { root } = yield* renderFixture();
      const controls = attribute(byId(root, renderedId("relations")), "aria-controls") ?? "";
      const targets = controls.split(" ");

      assert.deepStrictEqual(targets, [renderedId("results"), renderedId("volume")]);
      assert.strictEqual(controls, `${renderedId("results")} ${renderedId("volume")}`);

      for (const target of targets) {
        assert.strictEqual(byId(root, target).tag, target.endsWith("results") ? "div" : "span");
      }
    }),
  );

  it.effect(
    "[A-2b] an ID reference naming no element of the item is refused at open, so the body walk never sees one",
    () =>
      Effect.gen(function* dangling() {
        const text = yield* fixtureText;
        const xml = text
          .replace('aria-details="details"', 'aria-details="nowhere"')
          .replace('aria-flowto="notes"', 'aria-flowto="elsewhere"');
        const verdict: Verdict = yield* open(location, new TextEncoder().encode(xml));
        const refusals = verdict.verdict === "refused" ? verdict.refusals : [];

        assert.notStrictEqual(xml, text, "the variant differs from the fixture");
        assert.strictEqual(verdict.verdict, "refused");
        assert.isTrue(Option.isNone(acceptedItem(verdict)), "no accepted item reaches redact");
        assert.deepStrictEqual(
          refusals
            .map(
              (refusal) =>
                `${refusal.rule} ${refusal.detail["check"] ?? ""} reading ${refusal.detail["reading"] ?? ""}: ${refusal.detail["attribute"] ?? ""}="${refusal.detail["value"] ?? ""}"`,
            )
            .toSorted(),
          [
            'attribute-type idref-target reading 156: aria-details="nowhere"',
            'attribute-type idref-target reading 156: aria-flowto="elsewhere"',
          ],
        );
      }),
  );

  it.effect("[A-2b] aria-keyshorts on an empty element is written aria-keyshortcuts", () =>
    Effect.gen(function* keyShorts() {
      const { html, root } = yield* renderFixture();
      const picture = byId(root, renderedId("shortcut"));

      assert.isTrue(
        declaredAria("img").includes(keyShortcutsMisspelt),
        "the schema declares the misspelling on the empty img",
      );
      assert.isFalse(
        declaredAria("img").includes(keyShortcuts),
        "and not ARIA's spelling beside it",
      );
      assert.strictEqual(picture.tag, "img");
      assert.strictEqual(attribute(picture, keyShortcuts), "Alt+Shift+P");
      assert.isUndefined(attribute(picture, keyShortcutsMisspelt));
      assert.strictEqual(
        attribute(byId(root, renderedId("status")), keyShortcuts),
        "Control+Shift+K",
        "a non-empty element keeps ARIA's spelling as written",
      );
      assert.notInclude(html, keyShortcutsMisspelt);
    }),
  );

  it.effect("[A-2b] every role value of the schema's enumeration reaches the HTML", () =>
    Effect.gen(function* everyRole() {
      const roles = declaredRoles("span");
      const spans = roles.map((role) => `<span role="${role}">${role}</span>`).join(" ");
      const accepted = yield* acceptText(
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="m5-aria-roles" title="ARIA roles" adaptive="false" time-dependent="false">
  <qti-item-body>
    <p>${spans}</p>
  </qti-item-body>
</qti-assessment-item>`,
      );
      const { root } = yield* renderAccepted(accepted);
      const rendered = elementsOf([root]).flatMap((element) =>
        element.tag === "span" ? (attribute(element, "role") ?? []) : [],
      );

      assert.isAbove(roles.length, 0, "the schema enumerates roles");
      assert.deepStrictEqual(rendered, roles);
    }),
  );

  it.effect("[A-2b] the grid's counts and indexes reach the HTML as authored", () =>
    Effect.gen(function* grid() {
      const { root } = yield* renderFixture();
      const state = (id: string, names: readonly string[]): readonly (string | undefined)[] =>
        names.map((name) => attribute(byId(root, renderedId(id)), name));
      const cellNames = [
        "role",
        "aria-colindex",
        "aria-rowindex",
        "aria-colspan",
        "aria-rowspan",
        "aria-selected",
      ] as const;

      assert.deepStrictEqual(state("results", ["role", "aria-colcount", "aria-rowcount"]), [
        "grid",
        "6",
        "12",
      ]);
      assert.deepStrictEqual(state("results-row", ["role", "aria-rowindex"]), ["row", "3"]);
      assert.deepStrictEqual(state("results-west", cellNames), [
        "gridcell",
        "2",
        "3",
        "2",
        "1",
        "true",
      ]);
      assert.deepStrictEqual(state("results-east", cellNames), [
        "gridcell",
        "5",
        "4",
        "1",
        "2",
        "false",
      ]);
    }),
  );

  it.effect("[A-2b] the slider's value attributes reach the HTML", () =>
    Effect.gen(function* slider() {
      const { root } = yield* renderFixture();
      const volume = byId(root, renderedId("volume"));

      assert.strictEqual(volume.tag, "span");
      assert.deepStrictEqual(
        ["role", "aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-valuetext"].map((name) =>
          attribute(volume, name),
        ),
        ["slider", "-20", "40", "12.5", "Twelve and a half decibels"],
      );
    }),
  );

  it.effect("[A-2b] the redacted value round-trips the ARIA attributes", () =>
    Effect.gen(function* roundTrip() {
      const { configuration, html, redacted } = yield* renderFixture();
      const encoded = yield* Effect.fromResult(encodeRedacted(redacted));
      const decoded = yield* Effect.fromResult(decodeRedacted(encoded));
      const text = JSON.stringify(encoded);
      const parsed: unknown = JSON.parse(text);
      const stored = yield* Effect.fromResult(decodeRedacted(parsed));

      for (const copy of [decoded, stored]) {
        const again = yield* Effect.fromResult(render(copy, configuration, { instance }));

        assert.strictEqual(again.html, html);
      }
    }),
  );

  it.effect(
    "[A-2b] an aria attribute the schema does not declare on the element is never written",
    () =>
      Effect.gen(function* undeclared() {
        const { accepted } = yield* acceptFixture();
        const variant = variantOf(accepted.item, "relations", (attributes) => [
          ...attributes,
          { name: "aria-bogus", value: "x" },
          { name: keyShortcutsMisspelt, value: "Alt+K" },
        ]);
        const { html, root } = yield* renderAccepted(variant);
        const relations = byId(root, renderedId("relations"));

        assert.isFalse(
          declaredAria("div").includes("aria-bogus") ||
            declaredAria("div").includes(keyShortcutsMisspelt),
          "the schema declares neither on a div",
        );
        assert.strictEqual(attribute(relations, "aria-details"), renderedId("details"));
        assert.isUndefined(attribute(relations, "aria-bogus"));
        assert.isUndefined(attribute(relations, keyShortcutsMisspelt));
        assert.isUndefined(attribute(relations, keyShortcuts));
        assert.notInclude(html, "aria-bogus");
        assert.notInclude(html, keyShortcutsMisspelt);
      }),
  );
});
