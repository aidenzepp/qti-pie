/**
 * Companion Materials (I-13): the item's `qti-companion-materials-info`, read into the item model
 * and listed after the item body, each material also written as data attributes a host reads to
 * supply the tool (issue m5-07).
 *
 * The element names what a candidate may use with the item: calculators, rules, protractors,
 * digital materials (files of the package) and physical materials. A delivery system provides what
 * is listed alongside the item; how it does so is at its discretion, a listed calculator type or
 * protractor must be provided, and no material has a scoring meaning. Plate builds no tool: it
 * lists the materials and writes what the host needs to supply each.
 *
 * The item root's walk dispatches the element to {@link companionMaterialsModule}'s `parse`, which
 * reads the five kinds of child the XSD gives it, each zero or more, in document order, and ignores
 * the extension elements of other namespaces after them: the verdict judges such an island for
 * itself (`checkIsland` in `#plate/content/modules.ts`), and the module neither lists nor marks any
 * element it does not read. The names are read as the XSD and the information model spell them, in
 * lowercase: `scientific`, `qti-rule-system-si`, `qti-increment-us` ("Companion-material names are
 * lowercase.", reading 12, which sets aside the implementation guide's `Scientific` and
 * `qti-rule-system-SI`).
 *
 * The page's place for the list is after the body, where the content seam writes every item-placed
 * node, before the item's live region. The list is an `aside` named by `aria-label` and by a
 * visible heading it points to with `aria-labelledby`. The heading's id is one fixed value, since
 * the content seam hands a module's `render` no instance token to scope an id with: two items of
 * one page repeat it, which names the same text twice. A place before the body, and an id scoped by
 * the instance, are a later seam's.
 *
 * The strings the module adds, the list's label and the calculator's name, are English and live
 * here (decision D7).
 *
 * @module
 */
import { Option, Result } from "effect";
import type { ItemContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ReaderKit } from "#plate/interactions/contract.ts";
import { classifyUrl, formatUrl } from "#plate/model/url.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
import type { EmitState } from "#plate/payload.ts";

/**
 * The QTI element Companion Materials is read from.
 */
const element = "qti-companion-materials-info";

/**
 * The list's label, which names the `aside` and is the text of its visible heading (decision D7).
 */
const listLabel = "Materials you may use";

/**
 * The id of the visible heading the `aside`'s `aria-labelledby` names. It is not scoped by the
 * instance, because a module's `render` is given none (issue m5-07).
 */
const headingId = "companion-materials-heading";

/**
 * One measuring increment of a rule or a protractor: its value as written, a decimal, and its
 * `unit` as written (`Millimeter`, `Centimeter`, `Meter`, `Kilometer`, `Inch`, `Foot`, `Yard`,
 * `Mile`, `Radian`, `Degree`, `Minute` or `Second`).
 */
export interface MaterialIncrement {
  readonly unit: string;
  readonly value: string;
}

/**
 * The measuring system a rule or a protractor is marked in: `si`, from `qti-rule-system-si` and
 * `qti-increment-si`, or `us`, from `qti-rule-system-us` and `qti-increment-us`.
 */
export type MaterialSystem = "si" | "us";

/**
 * What a rule or a protractor measures with: its system, its increments, and for a rule the
 * minimum length it must have, each as written.
 */
export interface MaterialScale {
  readonly major: Option.Option<MaterialIncrement>;
  readonly minimumLength: Option.Option<string>;
  readonly minor: Option.Option<MaterialIncrement>;
  readonly system: MaterialSystem;
}

/**
 * A file the item names, an `ItemFileInfoDType` as a `qti-calculator-info` or a
 * `qti-digital-material` writes it: the href of its `qti-file-href` as written, a file of the
 * package, its `qti-resource-icon`, its `label` and its `mime-type`.
 */
export interface MaterialFile {
  readonly href: string;
  readonly icon: Option.Option<string>;
  readonly label: Option.Option<string>;
  readonly mimeType: Option.Option<string>;
}

/**
 * A `qti-calculator`: the `qti-calculator-type` as written (`basic`, `standard`, `scientific` or
 * `graphing`), its description, and the file that tells how to use it when the item has one.
 */
export interface CalculatorMaterial {
  readonly calculatorType: string;
  readonly description: string;
  readonly info: Option.Option<MaterialFile>;
  readonly kind: "calculator";
}

/**
 * A `qti-rule`: its description and, when it writes a system, its scale.
 */
export interface RuleMaterial {
  readonly description: string;
  readonly kind: "rule";
  readonly scale: Option.Option<MaterialScale>;
}

/**
 * A `qti-protractor`: its description and, when it writes a system, its scale, which holds no
 * minimum length.
 */
export interface ProtractorMaterial {
  readonly description: string;
  readonly kind: "protractor";
  readonly scale: Option.Option<MaterialScale>;
}

/**
 * A `qti-digital-material` that names its file.
 */
export interface DigitalMaterial {
  readonly file: MaterialFile;
  readonly kind: "digital";
}

/**
 * A `qti-physical-material`: the text that says what the candidate may bring.
 */
export interface PhysicalMaterial {
  readonly kind: "physical";
  readonly text: string;
}

/**
 * One material the item lists.
 */
export type Material =
  | CalculatorMaterial
  | DigitalMaterial
  | PhysicalMaterial
  | ProtractorMaterial
  | RuleMaterial;

/**
 * The model node of `qti-companion-materials-info`, and its payload node: the materials in
 * document order, which the XSD fixes as calculators, then rules, protractors, digital materials
 * and physical materials. The page may know all of it, so `copy` is the identity.
 */
export interface CompanionMaterialsNode {
  readonly materials: readonly Material[];
}

/**
 * The JSON form of {@link MaterialIncrement}.
 */
export interface MaterialIncrementJson {
  readonly unit: string;
  readonly value: string;
}

/**
 * The JSON form of {@link MaterialScale}: each optional member an optional key, absent when none.
 */
export interface MaterialScaleJson {
  readonly major?: MaterialIncrementJson;
  readonly minimumLength?: string;
  readonly minor?: MaterialIncrementJson;
  readonly system: MaterialSystem;
}

/**
 * The JSON form of {@link MaterialFile}: each optional member an optional key, absent when none.
 */
export interface MaterialFileJson {
  readonly href: string;
  readonly icon?: string;
  readonly label?: string;
  readonly mimeType?: string;
}

/**
 * The JSON form of {@link Material}, a union on `kind`.
 */
export type MaterialJson =
  | {
      readonly calculatorType: string;
      readonly description: string;
      readonly info?: MaterialFileJson;
      readonly kind: "calculator";
    }
  | {
      readonly description: string;
      readonly kind: "protractor";
      readonly scale?: MaterialScaleJson;
    }
  | { readonly description: string; readonly kind: "rule"; readonly scale?: MaterialScaleJson }
  | { readonly file: MaterialFileJson; readonly kind: "digital" }
  | { readonly kind: "physical"; readonly text: string };

/**
 * The JSON form of {@link CompanionMaterialsNode}.
 */
export interface CompanionMaterialsJson {
  readonly materials: readonly MaterialJson[];
}

/**
 * Read the trimmed text of an element's first QTI child of one name.
 *
 * @param read The reader kit.
 * @param parent The element.
 * @param local The child's local name.
 * @returns The child's text without its outer XML whitespace, none when the element has no such
 *   child.
 */
const childText = (read: ReaderKit, parent: SourceElement, local: string): Option.Option<string> =>
  Option.map(Option.fromUndefinedOr(read.childrenNamed(parent, local)[0]), (child) =>
    trimXmlSpace(read.textOf(child)),
  );

/**
 * Read the `qti-description` of a calculator, a rule or a protractor.
 *
 * @param read The reader kit.
 * @param parent The material.
 * @returns The description, the empty string when the material has none.
 */
const descriptionOf = (read: ReaderKit, parent: SourceElement): string =>
  Option.getOrElse(childText(read, parent, "qti-description"), () => "");

/**
 * Read an optional attribute without its outer XML whitespace, none when it is absent or blank.
 *
 * @param read The reader kit.
 * @param source The element.
 * @param name The attribute's name.
 * @returns The trimmed value.
 */
const attributeText = (
  read: ReaderKit,
  source: SourceElement,
  name: string,
): Option.Option<string> =>
  Option.filter(Option.map(read.valueOf(source, name), trimXmlSpace), (value) => value !== "");

/**
 * Read one increment: the first child of one name, its value and its `unit`.
 *
 * @param read The reader kit.
 * @param parent The rule's system or the protractor's increment element.
 * @param local The increment's local name, `qti-minor-increment` or `qti-major-increment`.
 * @returns The increment, none when the parent has no such child.
 */
const incrementOf = (
  read: ReaderKit,
  parent: SourceElement,
  local: string,
): Option.Option<MaterialIncrement> =>
  Option.map(Option.fromUndefinedOr(read.childrenNamed(parent, local)[0]), (increment) => ({
    unit: Option.getOrElse(attributeText(read, increment, "unit"), () => ""),
    value: trimXmlSpace(read.textOf(increment)),
  }));

/**
 * Read the scale of a rule or a protractor: the first of its two system elements the material
 * holds, `si` before `us`.
 *
 * @param read The reader kit.
 * @param parent The rule or the protractor.
 * @param names The local names of the system elements, by system.
 * @returns The scale, none when the material holds neither system element.
 */
const scaleOf = (
  read: ReaderKit,
  parent: SourceElement,
  names: Readonly<Record<MaterialSystem, string>>,
): Option.Option<MaterialScale> => {
  const systems: readonly MaterialSystem[] = ["si", "us"];
  const held = systems.flatMap((system) =>
    read
      .childrenNamed(parent, names[system])
      .slice(0, 1)
      .map((holder) => ({ holder, system })),
  );

  return Option.map(Option.fromUndefinedOr(held[0]), ({ holder, system }) => ({
    major: incrementOf(read, holder, "qti-major-increment"),
    minimumLength: childText(read, holder, "qti-minimum-length"),
    minor: incrementOf(read, holder, "qti-minor-increment"),
    system,
  }));
};

/**
 * Read a file info, an `ItemFileInfoDType`.
 *
 * @param read The reader kit.
 * @param source The `qti-calculator-info` or `qti-digital-material`.
 * @returns The file, none when the element names no `qti-file-href`, which the XSD requires: with
 *   no file there is nothing to link.
 */
const fileOf = (read: ReaderKit, source: SourceElement): Option.Option<MaterialFile> =>
  Option.map(childText(read, source, "qti-file-href"), (href) => ({
    href,
    icon: Option.filter(childText(read, source, "qti-resource-icon"), (icon) => icon !== ""),
    label: attributeText(read, source, "label"),
    mimeType: attributeText(read, source, "mime-type"),
  }));

/**
 * Read one child of the element as the material it gives.
 *
 * @param read The reader kit.
 * @param child The child, an element of the QTI namespace.
 * @returns The material, none for a child that is not one of the five kinds, or that names nothing
 *   to list.
 */
const materialOf = (read: ReaderKit, child: SourceElement): Option.Option<Material> => {
  switch (child.local) {
    case "qti-calculator": {
      return Option.some({
        calculatorType: Option.getOrElse(childText(read, child, "qti-calculator-type"), () => ""),
        description: descriptionOf(read, child),
        info: Option.flatMap(
          Option.fromUndefinedOr(read.childrenNamed(child, "qti-calculator-info")[0]),
          (info) => fileOf(read, info),
        ),
        kind: "calculator",
      });
    }

    case "qti-digital-material": {
      return Option.map(fileOf(read, child), (file) => ({ file, kind: "digital" }));
    }

    case "qti-physical-material": {
      return Option.some({ kind: "physical", text: trimXmlSpace(read.textOf(child)) });
    }

    case "qti-protractor": {
      return Option.some({
        description: descriptionOf(read, child),
        kind: "protractor",
        scale: scaleOf(read, child, { si: "qti-increment-si", us: "qti-increment-us" }),
      });
    }

    case "qti-rule": {
      return Option.some({
        description: descriptionOf(read, child),
        kind: "rule",
        scale: scaleOf(read, child, { si: "qti-rule-system-si", us: "qti-rule-system-us" }),
      });
    }

    default: {
      return Option.none();
    }
  }
};

/**
 * Read the element's materials, in document order. A child that is not one of the five kinds, an
 * extension element of another namespace among them, gives none.
 *
 * @param read The reader kit.
 * @param source The `qti-companion-materials-info`.
 * @returns The materials.
 */
const materialsOf = (read: ReaderKit, source: SourceElement): readonly Material[] =>
  read
    .elementsOf(source)
    .filter((child) => read.isQti(child))
    .flatMap((child) => Option.toArray(materialOf(read, child)));

/**
 * Name a calculator by its type: the type with a capital letter, then "calculator".
 *
 * @param calculatorType The type as written.
 * @returns The name, such as `Scientific calculator`.
 */
const calculatorName = (calculatorType: string): string =>
  [calculatorType.charAt(0).toUpperCase() + calculatorType.slice(1), "calculator"]
    .filter((word) => word !== "")
    .join(" ");

/**
 * Write one increment as its value and its unit.
 *
 * @param increment The increment.
 * @returns The value, then the unit when there is one, such as `1 Millimeter`.
 */
const incrementText = (increment: MaterialIncrement): string =>
  [increment.value, increment.unit].filter((part) => part !== "").join(" ");

/**
 * Write what a scale measures with, as the phrases a list item reads: the minimum length, then the
 * minor and the major increment, each when the material writes it.
 *
 * @param scale The scale, none when the material writes no system.
 * @returns The phrases, none for a material with no scale.
 */
const scalePhrases = (scale: Option.Option<MaterialScale>): readonly string[] =>
  Option.match(scale, {
    onNone: () => [],
    onSome: ({ major, minimumLength, minor }) => [
      ...minimumLength.pipe(
        Option.map((length) => `minimum length ${length}`),
        Option.toArray,
      ),
      ...minor.pipe(
        Option.map((value) => `minor increment ${incrementText(value)}`),
        Option.toArray,
      ),
      ...major.pipe(
        Option.map((value) => `major increment ${incrementText(value)}`),
        Option.toArray,
      ),
    ],
  });

/**
 * Write a rule's or a protractor's text: its description, then its scale's phrases in brackets.
 *
 * @param description The description.
 * @param scale The scale, none when the material writes no system.
 * @returns The text.
 */
const scaledText = (description: string, scale: Option.Option<MaterialScale>): string => {
  const phrases = scalePhrases(scale).join(", ");

  if (phrases === "") {
    return description;
  }

  return description === "" ? phrases : `${description} (${phrases})`;
};

/**
 * Write one increment as the two data attributes a host reads.
 *
 * @param name `minor` or `major`.
 * @param increment The increment, none when the material writes none.
 * @returns `data-<name>-increment` and `data-<name>-unit`, none for an absent increment.
 */
const incrementAttributes = (
  name: "major" | "minor",
  increment: Option.Option<MaterialIncrement>,
): Attributes =>
  Option.match(increment, {
    onNone: () => ({}),
    onSome: ({ unit, value }) => ({
      [`data-${name}-increment`]: value,
      [`data-${name}-unit`]: unit,
    }),
  });

/**
 * Write a scale as the data attributes a host reads: `data-system`, and each of the minimum length
 * and the increments the material writes.
 *
 * @param scale The scale, none when the material writes no system.
 * @returns The attributes, none for a material with no scale.
 */
const scaleAttributes = (scale: Option.Option<MaterialScale>): Attributes =>
  Option.match(scale, {
    onNone: () => ({}),
    onSome: ({ major, minimumLength, minor, system }) => ({
      ...incrementAttributes("major", major),
      ...Option.match(minimumLength, {
        onNone: () => ({}),
        onSome: (length) => ({ "data-minimum-length": length }),
      }),
      ...incrementAttributes("minor", minor),
      "data-system": system,
    }),
  });

/**
 * Name a file for a link that has no label: the last segment of its href.
 *
 * @param href The href as written.
 * @returns The segment after the last `/`, the whole href when that is empty.
 */
const fileName = (href: string): string => {
  const name = href.slice(href.lastIndexOf("/") + 1);

  return name === "" ? href : name;
};

/**
 * Write a file as a link: its text the label, or the file's name when it has none; its `href` the
 * path resolved against the asset base as the emitter resolves a body `a`'s; its `type` the
 * `mime-type`; and its icon, when it writes one the URL policy keeps, an `img` with `alt=""` before
 * the text, since the text names the file and the icon only decorates it (WCAG 1.1.1). A value the
 * policy drops, one that leaves the package or whose scheme is not `http` or `https`, and a
 * same-page fragment, which names no file, is written with no `href`, so the text alone names the
 * file.
 *
 * @param file The file.
 * @param state The emit state, which gives the asset base.
 * @returns The link.
 */
const fileLink = (file: MaterialFile, state: EmitState): Element => {
  const url = classifyUrl("link", file.href);
  const href: Attributes =
    url.kind === "package" || url.kind === "remote"
      ? { href: formatUrl(url, state.assetBase) }
      : {};
  const type: Attributes = Option.match(file.mimeType, {
    onNone: () => ({}),
    onSome: (mimeType) => ({ type: mimeType }),
  });
  const icon: readonly Node[] = Option.match(file.icon, {
    onNone: () => [],
    onSome: (source) => {
      const kept = classifyUrl("resource", source);

      return kept.kind === "package" || kept.kind === "remote"
        ? [h("img", { alt: "", src: formatUrl(kept, state.assetBase) })]
        : [];
    },
  });
  const label = Option.getOrElse(file.label, () => fileName(file.href));

  return h("a", { ...href, ...type }, [...icon, text(label)]);
};

/**
 * Write one material as a list item: `data-material` its kind, the data attributes a host reads to
 * supply it, and its text.
 *
 * @param material The material.
 * @param state The emit state.
 * @returns The list item.
 */
const materialItem = (material: Material, state: EmitState): Element => {
  switch (material.kind) {
    case "calculator": {
      const name = calculatorName(material.calculatorType);
      const described = material.description === "" ? name : `${name}: ${material.description}`;
      const info = Option.match(material.info, {
        onNone: (): readonly Node[] => [],
        onSome: (file): readonly Node[] => [text(" "), fileLink(file, state)],
      });

      const attributes: Attributes =
        material.calculatorType === ""
          ? { "data-material": "calculator" }
          : { "data-calculator-type": material.calculatorType, "data-material": "calculator" };

      return h("li", attributes, [text(described), ...info]);
    }

    case "digital": {
      return h("li", { "data-material": "digital" }, [fileLink(material.file, state)]);
    }

    case "physical": {
      return h("li", { "data-material": "physical" }, [text(material.text)]);
    }

    case "protractor": {
      return h("li", { ...scaleAttributes(material.scale), "data-material": "protractor" }, [
        text(scaledText(material.description, material.scale)),
      ]);
    }

    case "rule": {
      return h("li", { ...scaleAttributes(material.scale), "data-material": "rule" }, [
        text(scaledText(material.description, material.scale)),
      ]);
    }

    default: {
      return material satisfies never;
    }
  }
};

/**
 * Write the list: the part table's `companion-materials` root, an `aside` carrying `data-slot`,
 * its accessible name as `aria-label` and as a visible heading at the configuration's
 * `headingLevel` that `aria-labelledby` names, then a `ul` of one item per material in document
 * order, through the embedder's replacement for the root when there is one.
 *
 * @param node The payload node.
 * @param state The emit state, which gives the heading level, the asset base and the part
 *   overrides.
 * @returns The list's root, or the refusal of a replacement that breaks the swap invariant.
 */
const renderList = (
  node: CompanionMaterialsNode,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const row = rowFor("companion-materials", "root");
  const heading = h(`h${state.headingLevel}`, { id: headingId }, [text(listLabel)]);
  const list = h(
    "ul",
    {},
    node.materials.map((material) => materialItem(material, state)),
  );

  return applyPart(
    row,
    { "aria-label": listLabel, "aria-labelledby": headingId, "data-slot": row.slot },
    [heading, list],
    Option.getOrUndefined(state.parts.replacementFor("companion-materials", "root")),
  );
};

/**
 * The Companion Materials module (I-13), landed by issue m5-07: it reads the item's
 * `qti-companion-materials-info`, keeps the materials the page may know, and lists them after the
 * item body with the data attributes a host reads to supply each tool. It reads the names as the
 * XSD spells them, in lowercase ("Companion-material names are lowercase.", reading 12), and
 * writes a calculator's type and a rule's system as it read them. The page places and names the
 * list as the head of this file states.
 */
export const companionMaterialsModule: ItemContentModule<
  typeof element,
  CompanionMaterialsNode,
  CompanionMaterialsNode,
  CompanionMaterialsJson
> = {
  /**
   * No content through the kit: every string the list writes is a text node of its own, so the
   * heading shift counts none.
   */
  content: () => [],
  /**
   * Copy the node as it is: nothing in it is hidden from the page.
   */
  copy: (node) => node,
  element,
  feature: ["I-13"],
  implemented: true,
  namespace: qtiNamespace,
  /**
   * Read the materials the element lists, and record no mark: a child the module does not read,
   * an extension element of another namespace, is ignored.
   */
  parse: (source, context) =>
    Result.succeed(Option.some({ materials: materialsOf(context.read, source) })),
  /**
   * The node's codec: each material by its `kind`, each optional member an optional key.
   */
  payloadSchema: ({ Schema }) => {
    const Increment = Schema.Struct({ unit: Schema.String, value: Schema.String });
    const Scale = Schema.Struct({
      major: Schema.OptionFromOptionalKey(Increment),
      minimumLength: Schema.OptionFromOptionalKey(Schema.String),
      minor: Schema.OptionFromOptionalKey(Increment),
      system: Schema.Literals(["si", "us"]),
    });
    const File = Schema.Struct({
      href: Schema.String,
      icon: Schema.OptionFromOptionalKey(Schema.String),
      label: Schema.OptionFromOptionalKey(Schema.String),
      mimeType: Schema.OptionFromOptionalKey(Schema.String),
    });

    return Schema.Struct({
      materials: Schema.Array(
        Schema.Union([
          Schema.Struct({
            calculatorType: Schema.String,
            description: Schema.String,
            info: Schema.OptionFromOptionalKey(File),
            kind: Schema.Literal("calculator"),
          }),
          Schema.Struct({
            description: Schema.String,
            kind: Schema.Literal("rule"),
            scale: Schema.OptionFromOptionalKey(Scale),
          }),
          Schema.Struct({
            description: Schema.String,
            kind: Schema.Literal("protractor"),
            scale: Schema.OptionFromOptionalKey(Scale),
          }),
          Schema.Struct({ file: File, kind: Schema.Literal("digital") }),
          Schema.Struct({ kind: Schema.Literal("physical"), text: Schema.String }),
        ]),
      ),
    });
  },
  placement: "item",
  /**
   * Keep the node when it lists a material, and none otherwise: the list of nothing is no list.
   */
  redact: (node) => (node.materials.length === 0 ? Option.none() : Option.some(node)),
  /**
   * Write the list ({@link renderList}).
   */
  render: renderList,
};
