/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-hotspot-choice` and names an area's geometry, not a structure. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { encodeRedacted } from "#plate/codec/redacted.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { partForSlot } from "#plate/emit/parts.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import {
  checkResponses,
  configure,
  open,
  postings,
  redact,
  render,
  score,
  solution,
} from "#plate/index.ts";
import type { Accepted, Configuration, Redacted, Value } from "#plate/index.ts";
import type { Single } from "#plate/model/values.ts";
import { checkTree, nameOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedItem, unsupportedFeatures } from "#plate/validate/verdict.ts";

/**
 * The item instance every render here runs under.
 */
const instance = "q1";

/**
 * The identifier of the response both fixtures bind.
 */
const response = "RESPONSE";

/**
 * The directory of the area's fixtures.
 */
const fixtures = path.resolve(import.meta.dirname, "..", "..", "fixtures", "m3d", "items");

/**
 * Open one fixture of `fixtures/m3d/items` through `open` and give its accepted document.
 *
 * @param file The fixture's file name.
 * @returns The accepted document, failing the test when `open` refuses it.
 */
const accept = Effect.fnUntraced(function* accept(file: string) {
  const verdict = yield* open(`m3d/items/${file}`, readFileSync(path.join(fixtures, file)));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${file} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open an item written here through `open` and give its accepted document.
 *
 * @param body The `qti-item-body` content and the declarations before it, as XML.
 * @returns The accepted document, failing the test when `open` refuses it.
 */
const acceptXml = Effect.fnUntraced(function* acceptXml(body: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="written" title="Written" adaptive="false" time-dependent="false">
${body}
</qti-assessment-item>`;
  const verdict = yield* open("m3d/items/written.xml", new TextEncoder().encode(xml));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the written item is ${verdict.verdict}: ${JSON.stringify(verdict)}`),
  );
});

/**
 * Construct an identifier value of a cardinality.
 *
 * @param cardinality The cardinality.
 * @param identifiers The members.
 * @returns The value.
 */
const identifiers = (cardinality: "multiple" | "single", ...members: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality,
  values: members.map((value) => ({ baseType: "identifier", value })),
});

/**
 * Render a redacted item and parse its HTML back into the emitter's tree.
 *
 * @param redacted The redacted item.
 * @param configuration The configuration.
 * @param options What the host passes `render` beyond the instance.
 * @returns The item's root element.
 */
const renderTree = (
  redacted: Redacted,
  configuration: Configuration,
  options: Omit<Parameters<typeof render>[2] & object, "instance"> = {},
): Element => {
  const { html } = Result.getOrThrow(render(redacted, configuration, { instance, ...options }));
  const [root] = parseHtml(html);

  return root?.kind === "element" ? root : assert.fail("the render gives no root element");
};

/**
 * List an element and every element below it, in document order.
 *
 * @param element The subtree's root.
 * @returns The elements, `element` first.
 */
const elementsIn = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child) => (child.kind === "element" ? elementsIn(child) : [])),
];

/**
 * Read the Hotspot part an element is, by its `data-slot` marker through the part table.
 *
 * @param node The node.
 * @returns The part key, or none when the node is no Hotspot part.
 */
const partOf = (node: Node): Option.Option<string> => {
  if (node.kind !== "element") {
    return Option.none();
  }

  const slot = node.attrs["data-slot"];

  return slot === undefined || slot === true
    ? Option.none()
    : partForSlot(slot).pipe(
        Option.filter((found) => found.interaction === "hotspot-interaction"),
        Option.map((found) => found.part),
      );
};

/**
 * Find the elements of a tree that are one Hotspot part, in document order.
 *
 * @param tree The tree.
 * @param part The part key.
 * @returns The part's elements.
 */
const partsIn = (tree: Element, part: string): readonly Element[] =>
  elementsIn(tree).filter((element) => Option.contains(partOf(element), part));

/**
 * Give the one element of a part, failing the test otherwise.
 *
 * @param tree The tree.
 * @param part The part key.
 * @returns The part's element.
 */
const onlyPart = (tree: Element, part: string): Element => {
  const found = partsIn(tree, part);
  const [only] = found;

  return found.length === 1 && only !== undefined
    ? only
    : assert.fail(`the tree holds ${found.length} ${part} parts, not one`);
};

/**
 * Give the one shape element an outline holds, with its attributes but the marker.
 *
 * @param outline The outline part.
 * @returns The shape's tag and attributes.
 */
const shapeOf = (outline: Element): { readonly attrs: Attributes; readonly tag: string } => {
  const shapes = outline.children.filter((child) => child.kind === "element");
  const [shape] = shapes;

  return shapes.length === 1 && shape !== undefined
    ? { attrs: shape.attrs, tag: shape.tag }
    : assert.fail(`the outline holds ${shapes.length} elements, not one shape`);
};

/**
 * Read which Controls of a tree are checked, by their values in document order.
 *
 * @param tree The tree.
 * @returns The checked Controls' values.
 */
const checkedIn = (tree: Element): readonly string[] =>
  partsIn(tree, "control")
    .filter((control) => control.attrs["checked"] !== undefined)
    .map((control) => String(control.attrs["value"]));

/**
 * Read the values of a tree's Controls, in document order.
 *
 * @param tree The tree.
 * @returns The values.
 */
const valuesIn = (tree: Element): readonly (string | true | undefined)[] =>
  partsIn(tree, "control").map((control) => control.attrs["value"]);

/**
 * Render both fixtures while answering, with nothing restored.
 *
 * @param file The fixture's file name.
 * @returns The accepted document and the rendered tree.
 */
const rendered = Effect.fnUntraced(function* rendered(file: string) {
  const accepted = yield* accept(file);
  const configuration = yield* configure({});

  return { accepted, tree: renderTree(redact(accepted), configuration) };
});

/**
 * A written item of three hotspots over the fixtures' image, bound to a multiple identifier
 * response: the second an `ellipse` of three coordinates, too few for its shape (the XSD's
 * `CoordsDType` admits no fewer than three, so a `circle` of two never reaches the model), and the
 * third a `circle` of four, one more than its shape reads.
 */
const shortCircle = `
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <qti-hotspot-interaction response-identifier="RESPONSE" max-choices="0">
      <img src="images/hotspot-map.svg" alt="Four plots of a garden" width="400" height="300"/>
      <qti-hotspot-choice identifier="A" shape="rect" coords="40,40,160,120" hotspot-label="The square plot"/>
      <qti-hotspot-choice identifier="B" shape="ellipse" coords="300,90,50" hotspot-label="The round plot"/>
      <qti-hotspot-choice identifier="C" shape="circle" coords="140,220,40,99" hotspot-label="The oval plot"/>
    </qti-hotspot-interaction>
  </qti-item-body>`;

/**
 * A written item whose hotspot `B` is shown only while the template variable `SHOWN` names it;
 * `SHOWN` defaults to `A`, and the item has no template processing.
 */
const templated = `
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"/>
  <qti-template-declaration identifier="SHOWN" cardinality="single" base-type="identifier">
    <qti-default-value><qti-value>A</qti-value></qti-default-value>
  </qti-template-declaration>
  <qti-item-body>
    <qti-hotspot-interaction response-identifier="RESPONSE" max-choices="0">
      <img src="images/hotspot-map.svg" alt="Four plots of a garden" width="400" height="300"/>
      <qti-hotspot-choice identifier="A" shape="rect" coords="40,40,160,120" hotspot-label="The square plot"/>
      <qti-hotspot-choice identifier="B" shape="circle" coords="300,90,50" hotspot-label="The round plot" template-identifier="SHOWN" show-hide="show"/>
      <qti-hotspot-choice identifier="C" shape="poly" coords="60,260,140,180,220,260" hotspot-label="The triangular plot"/>
    </qti-hotspot-interaction>
  </qti-item-body>`;

describe("the Hotspot module", () => {
  it.effect("[Q-10] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* opened() {
      for (const file of ["hotspot.xml", "hotspot-single.xml"]) {
        const verdict = yield* open(`m3d/items/${file}`, readFileSync(path.join(fixtures, file)));

        assert.isTrue(Option.isSome(acceptedItem(verdict)), `${file}: ${verdict.verdict}`);
        assert.strictEqual(verdict.verdict, "accepted", file);
        assert.deepStrictEqual(unsupportedFeatures(verdict), [], file);
      }
    }),
  );

  it.effect(
    "[Q-10] render emits the root, prompt, image, choices and one control per hotspot with data-slot markers",
    () =>
      Effect.gen(function* structure() {
        const { tree } = yield* rendered("hotspot.xml");
        const root = onlyPart(tree, "root");
        const controls = partsIn(tree, "control");

        assert.strictEqual(root.attrs["data-slot"], "hotspot-interaction");
        assert.strictEqual(root.tag, "fieldset");
        assert.strictEqual(onlyPart(tree, "prompt").tag, "qti-prompt");
        assert.strictEqual(root.attrs["aria-labelledby"], onlyPart(tree, "prompt").attrs["id"]);
        assert.lengthOf(partsIn(tree, "image"), 1);
        assert.lengthOf(partsIn(tree, "choices"), 1);
        assert.lengthOf(partsIn(tree, "choice"), 4);
        assert.lengthOf(controls, 4);
        assert.deepStrictEqual(
          controls.map((control) => [control.tag, control.attrs["type"], control.attrs["value"]]),
          [
            ["input", "checkbox", "A"],
            ["input", "checkbox", "B"],
            ["input", "checkbox", "C"],
            ["input", "checkbox", "D"],
          ],
        );
        assert.isTrue(
          elementsIn(tree).some((element) => element.tag === "img"),
          "the author's image renders",
        );
        assert.notInclude(
          elementsIn(tree).map((element) => element.tag),
          "qti-hotspot-choice",
        );
      }),
  );

  it.effect("[Q-10] a single response renders radio buttons sharing one name", () =>
    Effect.gen(function* single() {
      const { tree } = yield* rendered("hotspot-single.xml");
      const controls = partsIn(tree, "control");

      assert.lengthOf(controls, 3);
      for (const control of controls) {
        assert.strictEqual(control.attrs["type"], "radio");
        assert.strictEqual(control.attrs["name"], entryName(instance, response));
      }
    }),
  );

  it.effect(
    "[Q-10] each control is named by its hotspot-label, and a hotspot with none by its position",
    () =>
      Effect.gen(function* names() {
        const multiple = yield* rendered("hotspot.xml");
        const single = yield* rendered("hotspot-single.xml");

        assert.deepStrictEqual(
          partsIn(multiple.tree, "control").map((control) => nameOf(control, multiple.tree)),
          ["The square plot", "The round plot", "The triangular plot", "Elsewhere in the garden"],
        );
        assert.deepStrictEqual(
          partsIn(single.tree, "control").map((control) => nameOf(control, single.tree)),
          ["The square plot", "Area 2 of 3", "The triangular plot"],
        );
      }),
  );

  it.effect(
    "[Q-10] a restored response checks its controls and the solution mode checks the correct ones",
    () =>
      Effect.gen(function* restored() {
        const accepted = yield* accept("hotspot.xml");
        const configuration = yield* configure({});
        const stored = renderTree(redact(accepted), configuration, {
          values: { [response]: identifiers("multiple", "B", "D") },
        });
        const correct = solution(accepted);
        const solved = renderTree(redact(accepted), configuration, {
          mode: "solution",
          values: correct,
        });

        assert.deepStrictEqual(checkedIn(stored), ["B", "D"]);
        assert.deepStrictEqual(correct, { [response]: identifiers("multiple", "B", "D") });
        assert.deepStrictEqual(checkedIn(solved), ["B", "D"]);
        for (const control of partsIn(solved, "control")) {
          assert.isDefined(control.attrs["disabled"]);
        }
      }),
  );

  it.effect(
    "[Q-10] the outline of each shape is placed from its coords, the rect's corners in either order",
    () =>
      Effect.gen(function* outlines() {
        const multiple = yield* rendered("hotspot.xml");
        const single = yield* rendered("hotspot-single.xml");
        const [leftTop, round, triangle, everywhere] = partsIn(multiple.tree, "outline").map(
          shapeOf,
        );
        const [rightBottom] = partsIn(single.tree, "outline").map(shapeOf);
        const hit = { "pointer-events": "visiblePainted" };
        const rect = { ...hit, height: "80", width: "120", x: "40", y: "40" };

        assert.deepStrictEqual(leftTop, {
          attrs: { ...rect, "data-shape": "rect" },
          tag: "rect",
        });
        assert.deepStrictEqual(rightBottom, leftTop);
        assert.deepStrictEqual(round, {
          attrs: { ...hit, cx: "300", cy: "90", "data-shape": "circle", r: "50" },
          tag: "circle",
        });
        assert.deepStrictEqual(triangle, {
          attrs: { ...hit, "data-shape": "poly", points: "60,260 140,180 220,260" },
          tag: "polygon",
        });
        assert.deepStrictEqual(everywhere, {
          attrs: {
            "data-shape": "default",
            fill: "none",
            height: "100%",
            "pointer-events": "none",
            width: "100%",
            x: "0",
            y: "0",
          },
          tag: "rect",
        });
        for (const outline of partsIn(multiple.tree, "outline")) {
          assert.strictEqual(outline.tag, "svg");
          assert.strictEqual(outline.attrs["aria-hidden"], "true");
          assert.strictEqual(outline.attrs["viewBox"], "0 0 400 300");
        }
      }),
  );

  it.effect("[Q-10] an area with too few coords has a control and a label but no outline", () =>
    Effect.gen(function* tooFew() {
      const accepted = yield* acceptXml(shortCircle);
      const tree = renderTree(redact(accepted), yield* configure({}));
      const choices = partsIn(tree, "choice");

      assert.lengthOf(choices, 3);
      assert.deepStrictEqual(
        choices.map((choice) => [
          partsIn(choice, "control").length,
          partsIn(choice, "label").length,
          partsIn(choice, "outline").length,
        ]),
        [
          [1, 1, 1],
          [1, 1, 0],
          [1, 1, 1],
        ],
      );
      assert.strictEqual(nameOf(partsIn(tree, "control")[1] ?? tree, tree), "The round plot");
      assert.deepStrictEqual(shapeOf(partsIn(tree, "outline")[1] ?? tree), {
        attrs: {
          cx: "140",
          cy: "220",
          "data-shape": "circle",
          "pointer-events": "visiblePainted",
          r: "40",
        },
        tag: "circle",
      });
    }),
  );

  it.effect(
    "[Q-10] postings binds the response as identifier and decode reads the checked controls",
    () =>
      Effect.gen(function* posted() {
        const accepted = yield* accept("hotspot.xml");
        const [posting, ...rest] = postings(redact(accepted), instance);
        const name = entryName(instance, response);

        assert.lengthOf(rest, 0);
        assert.isDefined(posting);
        if (posting === undefined) {
          return;
        }

        assert.strictEqual(posting.identifier, response);
        assert.deepStrictEqual(posting.binding, {
          baseType: "identifier",
          cardinality: "multiple",
          name,
        });
        assert.deepStrictEqual(
          decode(
            [
              [name, "B"],
              [name, "D"],
            ],
            posting.binding,
            posting.options,
          ),
          Result.succeed(identifiers("multiple", "B", "D")),
        );
      }),
  );

  it.effect(
    "[Q-10] checkResponses: above max-choices is refused; below min-choices only under validateResponses",
    () =>
      Effect.gen(function* validated() {
        const accepted = yield* accept("hotspot.xml");
        const lenient = yield* configure({});
        const strict = yield* configure({ validateResponses: true });
        const three = identifiers("multiple", "A", "B", "C");
        const none = identifiers("multiple");

        assert.deepStrictEqual(checkResponses(accepted, { [response]: three }, lenient), [
          { response, text: "Pick at most two plots." },
        ]);
        assert.deepStrictEqual(checkResponses(accepted, { [response]: none }, lenient), []);
        assert.deepStrictEqual(checkResponses(accepted, { [response]: none }, strict), [
          { response, text: "Pick at least one plot." },
        ]);
        assert.deepStrictEqual(
          checkResponses(accepted, { [response]: identifiers("multiple", "B", "D") }, strict),
          [],
        );
        assert.lengthOf(
          checkResponses(accepted, { [response]: identifiers("multiple", "Z") }, lenient),
          1,
        );
      }),
  );

  it.effect(
    "[Q-10] score with the correct identifiers gives the maximum and a wrong one scores below it",
    () =>
      Effect.gen(function* scored() {
        const accepted = yield* accept("hotspot.xml");
        const scoreOf = (value: Value): readonly Single["value"][] =>
          Result.getOrThrow(score(accepted, { [response]: value })).outcomes["SCORE"]?.values.map(
            (single) => single.value,
          ) ?? [];

        assert.notInclude(
          accepted.unsupported.map((entry) => entry.feature),
          "qti-hotspot-interaction",
          "the item is scored with its interaction rendered, not as a notice",
        );
        assert.deepStrictEqual(scoreOf(identifiers("multiple", "B", "D")), [2]);
        assert.deepStrictEqual(scoreOf(identifiers("multiple", "A", "B")), [1]);
        assert.deepStrictEqual(scoreOf(identifiers("multiple", "A", "C")), [0]);
      }),
  );

  it.effect("[Q-10] a hotspot a template hides is not rendered", () =>
    Effect.gen(function* hidden() {
      const accepted = yield* acceptXml(templated);
      const configuration = yield* configure({});
      const byDefault = renderTree(redact(accepted), configuration);
      const shown = renderTree(
        redact(accepted, { outcomes: {}, templates: { SHOWN: identifiers("single", "B") } }),
        configuration,
      );

      assert.deepStrictEqual(valuesIn(byDefault), ["A", "C"]);
      assert.deepStrictEqual(valuesIn(shown), ["A", "B", "C"]);
      assert.lengthOf(
        checkResponses(accepted, { [response]: identifiers("multiple", "B") }, configuration),
        1,
      );
    }),
  );

  it.effect("[Q-10] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* accessible() {
      for (const file of ["hotspot.xml", "hotspot-single.xml"]) {
        const accepted = yield* accept(file);
        const configuration = yield* configure({});
        const redacted = redact(accepted);
        const { html } = Result.getOrThrow(render(redacted, configuration, { instance }));
        const tree = renderTree(redacted, configuration);
        const restored = renderTree(redacted, configuration, {
          values: { [response]: identifiers("multiple", "B") },
        });

        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), [], file);
        assert.deepStrictEqual(checkTree(restored, { baseLevel: 2 }), [], file);
        assert.isTrue(roundTrips(tree), file);
        assert.include(html, 'data-slot="hotspot-interaction"');
      }
    }),
  );

  it.effect("[Q-10] redact's copy holds no correct response", () =>
    Effect.gen(function* redacted() {
      const accepted: Accepted = yield* accept("hotspot.xml");
      const json = Result.getOrThrow(encodeRedacted(redact(accepted)));
      const written = JSON.stringify(json);

      for (const secret of [
        "correct",
        "correctResponse",
        "mapping",
        "processing",
        "defaultValue",
      ]) {
        assert.notInclude(written, `"${secret}":`, secret);
      }
      assert.deepStrictEqual(json.responses, [
        { baseType: "identifier", cardinality: "multiple", identifier: response },
      ]);
      assert.isTrue(
        json.body.some((node) => node.kind === "hotspot"),
        "the redacted body holds the Hotspot's payload node",
      );
    }),
  );
});
