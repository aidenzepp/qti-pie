/**
 * Match (Q-13): its model node, parts, parse, redaction, render and response validation, on the
 * module shape the interaction-module contract states.
 *
 * No reading of `docs/spec-readings.md` binds the Match interaction itself; the module keeps to
 * the QTI 3 information model as the ASI XSD writes it (`MatchInteractionDType`,
 * `SimpleMatchSetDType`, `SimpleAssociableChoiceDType`): a `qti-match-interaction` is a prompt
 * interaction holding exactly two `qti-simple-match-set`s, the first the sources and the second
 * the targets, bound to a `directedPair` response of `single` or `multiple` cardinality, and a
 * pair joins a choice of the first set to one of the second. `max-associations` defaults to 1 and
 * `min-associations` to 0, as the XSD declares them, and 0 is no limit, as the gap-match module
 * reads the same attribute (proposed reading there, for the operator). A `match-max` is required on
 * each choice and 0 is no limit; `match-min` defaults to 0; `match-group` lists the identifiers a
 * choice may pair with, any when absent.
 *
 * {@link matchModule}'s render emits APG's table of checkboxes for a match: a `div` Root that is
 * `role="group"`, named by its Prompt through `aria-labelledby` (or by the author's names when
 * there is no Prompt); the Prompt; and a native `table`, named by the Prompt the same way, whose
 * head row holds the Corner (`data-first-column-header`'s text) and one ColumnHeader per target,
 * and whose body holds one row per source: its RowHeader, then one Cell per target holding one
 * native checkbox Control whose `value` is the directed pair `"<source> <target>"`. Every header
 * is a `th` with `scope` (WCAG 1.3.1), each Control's accessible name joins its row's and its
 * column's text, "Trowel with Gardener" (4.1.2), and the DOM order is the presented order (1.3.2).
 * The checkboxes are the wire (decision D2): the form posts one entry per checked cell under the
 * host's entry name, and no script is needed. The runtime polish is issue m3d-12, which reads
 * `data-max-associations` on the Root and `data-match-max` on each header.
 *
 * {@link matchModule}'s `validate` checks a value the caller decoded, in two tiers: tier (a)
 * always, tier (b) only under `validateResponses` (D5). The strings it adds are English and live
 * here (D7).
 *
 * @module
 */
import { Option, Result, pipe } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { h, text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId, splitTokens } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  ParseContext,
  PartSpec,
  ReaderKit,
  RedactKit,
} from "#plate/interactions/contract.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, Unsupported } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Match part in the part table.
 */
const owner = "match-interaction";

/**
 * Match's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-13";

/**
 * The QTI element Match is read from, which its notice names.
 */
const element = "qti-match-interaction";

/**
 * The QTI element of one set of a Match: the first holds the sources, the second the targets.
 */
const setTag = "qti-simple-match-set";

/**
 * The QTI element of one choice of either set.
 */
const choiceTag = "qti-simple-associable-choice";

/**
 * The separator of the parts of a shuffle's key, as `choiceOrder` in `#plate/payload.ts` keys a
 * Choice's: the seed, the instance, the response and the set, which no identifier or token holds.
 */
const keySeparator = "\u001F";

/**
 * A Match part, by the key its row and its host override go by.
 */
type MatchPart =
  | "cell"
  | "columnHeader"
  | "control"
  | "corner"
  | "prompt"
  | "root"
  | "rowHeader"
  | "table";

/**
 * The rows of the Match parts, each part once: the Root and the Prompt are flow containers (the
 * Root a group the Prompt names); the Table, the Corner, the headers and the Cell are the table's
 * own elements, whose class the part table has no name for, so a replacement may return any
 * element and the module's tests hold the table structure; the Control a native input whose
 * `type` stays `checkbox`. `merged` lists every attribute the connect function computes beyond
 * the `data-slot` marker and the Root state (`data-mode`, `data-disabled`), which a replacement
 * may not override.
 */
const parts = {
  cell: {
    defaults: {},
    element: "td",
    listOwner: false,
    merged: ["data-source", "data-target"],
    tagClass: "any",
  },
  columnHeader: {
    defaults: {},
    element: "th",
    listOwner: false,
    merged: ["data-identifier", "data-match-group", "data-match-max", "id", "scope"],
    tagClass: "any",
  },
  control: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "checked",
      "disabled",
      "aria-label",
      "aria-invalid",
      "aria-describedby",
      "autofocus",
    ],
    tagClass: "native-input",
  },
  corner: {
    defaults: {},
    element: "th",
    listOwner: false,
    merged: ["scope"],
    tagClass: "any",
  },
  prompt: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: ["id"],
    tagClass: "prompt",
  },
  root: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [
      "aria-describedby",
      "aria-label",
      "aria-labelledby",
      "class",
      "data-max-associations",
      "role",
    ],
    tagClass: "flow-container",
  },
  rowHeader: {
    defaults: {},
    element: "th",
    listOwner: false,
    merged: ["data-identifier", "data-match-group", "data-match-max", "id", "scope"],
    tagClass: "any",
  },
  table: {
    defaults: {},
    element: "table",
    listOwner: false,
    merged: ["aria-labelledby"],
    tagClass: "any",
  },
} as const satisfies { readonly [Q in MatchPart]: PartSpec };

/**
 * The module's owner and parts, which {@link partRow} derives each part's row from.
 */
const table = { owner, parts } as const;

/**
 * The row of every Match part, which no placement changes.
 */
const rows = {
  cell: partRow(table, "cell"),
  columnHeader: partRow(table, "columnHeader"),
  control: partRow(table, "control"),
  corner: partRow(table, "corner"),
  prompt: partRow(table, "prompt"),
  root: partRow(table, "root"),
  rowHeader: partRow(table, "rowHeader"),
  table: partRow(table, "table"),
} satisfies { readonly [Q in MatchPart]: PartRow };

/**
 * One `qti-simple-associable-choice` of a Match: a source when it sits in the first set, a target
 * when in the second.
 */
export interface MatchChoice {
  /**
   * The choice's content as the body walk read it.
   */
  readonly content: readonly BodyNode[];
  /**
   * `fixed`: the choice keeps its document position when the Match shuffles its set.
   */
  readonly fixed: boolean;
  readonly identifier: string;
  /**
   * `match-group`: the choices of the other set this choice may pair with, none when absent, which
   * means any.
   */
  readonly matchGroup: Option.Option<readonly string[]>;
  /**
   * `match-max`: the most pairs this choice may be in; 0 is no limit.
   */
  readonly matchMax: bigint;
  /**
   * `match-min`, 0 when absent: the fewest pairs this choice must be in for a valid response.
   */
  readonly matchMin: bigint;
}

/**
 * A `qti-match-interaction` (Q-13): its Prompt, its two sets of choices, and the limits and
 * messages it declares, bound to a `directedPair` response of `single` or `multiple` cardinality:
 * each pair is a source and the target it is matched with.
 */
export interface MatchInteraction extends ModuleInteraction<"match"> {
  /**
   * The bound response's cardinality: `multiple`, or `single` for an interaction that takes one
   * pair.
   */
  readonly cardinality: "multiple" | "single";
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * `data-first-column-header`: the text of the table's top-left header cell, none when absent.
   */
  readonly firstColumnHeader: Option.Option<string>;
  /**
   * `max-associations`, 1 when absent (the default the ASI XSD gives it): the most pairs a response
   * may hold; 0 is no limit.
   */
  readonly maxAssociations: bigint;
  /**
   * The author's replacements for the messages of the two bounds, `data-max-selections-message` and
   * `data-min-selections-message`.
   */
  readonly messages: {
    readonly max: Option.Option<string>;
    readonly min: Option.Option<string>;
  };
  /**
   * `min-associations`, 0 when absent: the fewest pairs a valid response holds.
   */
  readonly minAssociations: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  /**
   * `shuffle`: each set is presented in an order keyed by the seed, the instance, the response and
   * the set.
   */
  readonly shuffle: boolean;
  /**
   * The first set's choices, the sources of every pair, in document order.
   */
  readonly sources: readonly MatchChoice[];
  /**
   * The second set's choices, the targets of every pair, in document order.
   */
  readonly targets: readonly MatchChoice[];
}

/**
 * One choice as the page may know it: its content and what the render and the runtime read of its
 * limits.
 */
export interface MatchPayloadChoice {
  readonly content: readonly PayloadNode[];
  readonly identifier: string;
  /**
   * The choices of the other set it may pair with, none listed when it may pair with any.
   */
  readonly matchGroup: readonly string[];
  readonly matchMax: bigint;
}

/**
 * A Match as the page may know it: its Prompt, its sources and targets each in presented order,
 * the name its Controls post under, and the pairs to show. It holds no correct response.
 */
export interface MatchPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  /**
   * Whether the first Control takes `autofocus`.
   */
  readonly autofocus: boolean;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly firstColumnHeader: Option.Option<string>;
  /**
   * The name every Control posts under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  /**
   * `max-associations` as the Root carries it for the runtime; 0 is no limit.
   */
  readonly maxAssociations: bigint;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The pairs to show checked, each as posted, `<source> <target>`: the strings posted when the
   * view has messages, else the view's value.
   */
  readonly restore: readonly string[];
  readonly sources: readonly MatchPayloadChoice[];
  readonly targets: readonly MatchPayloadChoice[];
}

/**
 * The JSON form of a choice in a redacted body, with no path: its counts as decimal digits and
 * each `Option` an optional key.
 */
interface MatchChoiceJson {
  readonly content: SchemaKit["BodyNodes"]["Encoded"];
  readonly fixed: boolean;
  readonly identifier: string;
  readonly matchGroup?: readonly string[];
  readonly matchMax: string;
  readonly matchMin: string;
}

/**
 * The JSON form of a Match in a redacted body: its counts as decimal digits, each `Option` an
 * optional key, and no path.
 */
export interface MatchJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: "multiple" | "single";
  readonly class: string;
  readonly firstColumnHeader?: string;
  readonly kind: "match";
  readonly maxAssociations: string;
  readonly messages: { readonly max?: string; readonly min?: string };
  readonly minAssociations: string;
  readonly prompt?: SchemaKit["BodyNodes"]["Encoded"];
  readonly response: string;
  readonly shuffle: boolean;
  readonly sources: readonly MatchChoiceJson[];
  readonly targets: readonly MatchChoiceJson[];
}

/**
 * The attributes of every part of one Match, computed once by {@link connect}: one entry per
 * target for the column headers, per source for the row headers, and per source then per target,
 * row by row, for the cells and the controls.
 */
interface MatchConnected {
  readonly cell: readonly Attributes[];
  readonly columnHeader: readonly Attributes[];
  readonly control: readonly Attributes[];
  readonly corner: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
  readonly rowHeader: readonly Attributes[];
  readonly table: Attributes;
}

/**
 * Give one set's choices in the order a render presents them: document order, or with `shuffle`
 * the order `shuffleOrder` draws under the key `<seed>\u001F<instance>\u001F<response>\u001F<set>`,
 * where an absent seed is the empty string, each fixed choice at its document position. The two
 * sets take different suffixes, so they shuffle independently. The same interaction, seed and
 * instance always give the same order, so `sequence` reports the order `render` presents.
 *
 * @param interaction The Match: its response and its `shuffle`.
 * @param set Which set, and its choices in document order.
 * @param seed The configuration's `seed`, none when it has none.
 * @param instance The item instance key the interaction is rendered under.
 * @returns The set's choices, in presented order.
 */
const presented = (
  interaction: Pick<MatchInteraction, "response" | "shuffle">,
  set: { readonly choices: readonly MatchChoice[]; readonly name: "sources" | "targets" },
  seed: Option.Option<string>,
  instance: string,
): readonly MatchChoice[] =>
  interaction.shuffle
    ? shuffleOrder(
        [Option.getOrElse(seed, () => ""), instance, interaction.response, set.name].join(
          keySeparator,
        ),
        set.choices.map((choice) => choice.fixed),
      ).flatMap((index) => set.choices[index] ?? [])
    : set.choices;

/**
 * Split a posted pair into its source and its target, as a `directedPair` is written: two
 * identifiers separated by white space.
 *
 * @param pair The pair as posted.
 * @returns The two sides, none for a text that is not two identifiers.
 */
const sidesOf = (pair: string): Option.Option<readonly [string, string]> => {
  const [source, target, ...rest] = splitTokens(pair);

  return source === undefined || target === undefined || rest.length > 0
    ? Option.none()
    : Option.some([source, target] as const);
};

/**
 * Write a pair as a Control posts it: the source, one space, the target.
 *
 * @param source The source's identifier.
 * @param target The target's identifier.
 * @returns The pair's wire form.
 */
const pairOf = (source: string, target: string): string => `${source} ${target}`;

/**
 * Collapse runs of ASCII whitespace to one space and trim the ends.
 *
 * @param value The text.
 * @returns The collapsed text.
 */
const collapse = (value: string): string =>
  value.replaceAll(/[\t\n\f\r ]+/gu, " ").replaceAll(/^ | $/gu, "");

/**
 * Collect the text of some payload nodes: every text node, at any depth, as written.
 *
 * @param nodes The nodes.
 * @returns The text, concatenated.
 */
const textIn = (nodes: readonly PayloadNode[]): string =>
  nodes
    .map((node) => {
      if (node.kind === "text") {
        return node.text;
      }

      return node.kind === "element" ? textIn(node.children) : "";
    })
    .join("");

/**
 * Give the text a header's choice is named by in a Control's name: its content's text, collapsed;
 * for a choice with none, "Choice n of count", `n` its presented position in its set.
 *
 * @param choice The choice.
 * @param position The choice's position `n`, from 1, among the `count` choices of its set.
 * @param count How many choices the set has.
 * @param locale The locale of the renderer's own text.
 * @returns The text.
 */
const headerText = (
  choice: MatchPayloadChoice,
  position: number,
  count: number,
  locale: Locale,
): string => {
  const written = collapse(textIn(choice.content));

  return written === ""
    ? message(locale, "choiceOf", { count: numeral(locale, count), n: numeral(locale, position) })
    : written;
};

/**
 * Name the group when the Prompt does not: the author's `aria-label`, as written unless it is
 * blank, and `aria-labelledby` with each id scoped by the instance; the group is `role="group"`
 * only when something names it.
 *
 * @param interaction The Match's payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @returns The naming attributes, none when the author gave neither.
 */
const authorsName = (interaction: MatchPayload, instance: string): Attributes => {
  const label = interaction.ariaLabel.pipe(
    Option.filter((written) => trimXmlSpace(written) !== ""),
  );
  const labelledby = interaction.ariaLabelledby.pipe(
    Option.flatMap((ids) => authoredIdrefs(instance, ids)),
  );

  return {
    ...Option.match(label, {
      onNone: () => ({}),
      onSome: (written) => ({ "aria-label": written }),
    }),
    ...Option.match(labelledby, {
      onNone: () => ({}),
      onSome: (ids) => ({ "aria-labelledby": ids }),
    }),
    ...when(Option.isSome(label) || Option.isSome(labelledby), { role: "group" }),
  };
};

/**
 * Give the attributes of one header, a RowHeader or a ColumnHeader: its identifier, its
 * `match-max`, its `match-group` when it names one, its id and its `scope`.
 *
 * @param choice The header's choice.
 * @param row The header's row.
 * @param id The header's id.
 * @param scope `row` for a source, `col` for a target.
 * @returns The attributes.
 */
const headerProps = (
  choice: MatchPayloadChoice,
  row: PartRow,
  id: string,
  scope: "col" | "row",
): Attributes => ({
  "data-identifier": choice.identifier,
  ...when(choice.matchGroup.length > 0, { "data-match-group": choice.matchGroup.join(" ") }),
  "data-match-max": String(choice.matchMax),
  "data-slot": row.slot,
  id,
  scope,
});

/**
 * Compute every attribute of every part of one Match: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, and `data-max-associations`, which the runtime reads. It is
 *   `role="group"`, named by the Prompt through `aria-labelledby` → the Prompt's id, and the
 *   author's names are not written; with no Prompt, by the author's `aria-label` and
 *   `aria-labelledby`; with neither, the group stays unnamed and carries no role.
 *   `aria-describedby` → the message ids when the response has a message.
 * - Prompt: the marker and its id. Table: the marker, and `aria-labelledby` → the Prompt's id when
 *   there is a Prompt, so the table is named as the group is.
 * - Corner: the marker and `scope="col"`: it heads the column of row headers.
 * - ColumnHeader, one for each target in presented order, and RowHeader, one for each source:
 *   {@link headerProps}, `scope="col"` and `scope="row"`.
 * - Cell, one for each source then each target, row by row: the marker, its source and its target.
 * - Control, one in each Cell: `type="checkbox"`, its id, the payload's `formName`, the pair
 *   `"<source> <target>"` as `value`; `checked` when the restore holds the pair; `disabled` when
 *   finished or not answering (review and solution); `aria-invalid` and `aria-describedby` → the
 *   message ids when the response has a message; `autofocus` on the first when the payload says;
 *   and `aria-label` "<row> with <column>", the two headers' texts ({@link headerText}), so the
 *   name of each checkbox says which pair it makes (WCAG 4.1.2).
 *
 * Every id is `scopedId(instance, response, part, index)`.
 *
 * @param interaction The Match's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connect = (interaction: MatchPayload, payload: Payload, locale: Locale): MatchConnected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);
  const invalid = messageIds.length > 0;
  const editable = payload.mode === "answering" && !payload.finished;
  const restored = new Set(
    interaction.restore.flatMap((pair) =>
      Option.toArray(Option.map(sidesOf(pair), ([source, target]) => pairOf(source, target))),
    ),
  );
  const rowText = interaction.sources.map((source, index) =>
    headerText(source, index + 1, interaction.sources.length, locale),
  );
  const columnText = interaction.targets.map((target, index) =>
    headerText(target, index + 1, interaction.targets.length, locale),
  );
  const cells = interaction.sources.flatMap((source, row) =>
    interaction.targets.map((target, column) => ({ column, row, source, target })),
  );

  return {
    cell: cells.map(({ source, target }) => ({
      "data-slot": rows.cell.slot,
      "data-source": source.identifier,
      "data-target": target.identifier,
    })),
    columnHeader: interaction.targets.map((target, index) =>
      headerProps(
        target,
        rows.columnHeader,
        scopedId(instance, interaction.response, "column", index),
        "col",
      ),
    ),
    control: cells.map(({ column, row, source, target }, index) => ({
      "aria-label": `${rowText[row] ?? ""} with ${columnText[column] ?? ""}`,
      ...when(invalid, { "aria-describedby": messageIds.join(" "), "aria-invalid": "true" }),
      ...when(interaction.autofocus && index === 0, { autofocus: true }),
      ...when(restored.has(pairOf(source.identifier, target.identifier)), { checked: true }),
      "data-slot": rows.control.slot,
      ...when(!editable, { disabled: true }),
      id: scopedId(instance, interaction.response, "control", index),
      name: interaction.formName,
      type: "checkbox",
      value: pairOf(source.identifier, target.identifier),
    })),
    corner: { "data-slot": rows.corner.slot, scope: "col" },
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...Option.match(interaction.prompt, {
        onNone: () => authorsName(interaction, instance),
        onSome: () => ({ "aria-labelledby": promptId, role: "group" }),
      }),
      ...when(invalid, { "aria-describedby": messageIds.join(" ") }),
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      "data-max-associations": String(interaction.maxAssociations),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
    },
    rowHeader: interaction.sources.map((source, index) =>
      headerProps(
        source,
        rows.rowHeader,
        scopedId(instance, interaction.response, "row", index),
        "row",
      ),
    ),
    table: {
      ...when(Option.isSome(interaction.prompt), { "aria-labelledby": promptId }),
      "data-slot": rows.table.slot,
    },
  };
};

/**
 * Render a Match: a `div` Root holding the Prompt, when there is one, and the Table: a `thead` row
 * of the Corner and the ColumnHeaders, and a `tbody` of one row per source, its RowHeader then one
 * Cell per target holding its Control.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Prompt and each choice's content go through {@link emitNodes}, as the body's do,
 * with the heading shift, ids and URLs of the body. The `thead`, `tbody` and `tr` elements are the
 * table's own structure, not parts: a host styles them through the Table.
 *
 * @param interaction The Match's payload.
 * @param payload The payload of the whole render, which gives the instance and `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Match Root, or {@link PartSwapRefused} when a replacement breaks the swap
 * invariant.
 * @throws {NestedInteractionDefect} When the Prompt or a choice's content holds an interaction,
 *   which QTI's schema admits nowhere there.
 */
const renderMatch = (
  interaction: MatchPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connect(interaction, payload, state.locale);
  const replacement = (part: MatchPart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));
  const contentOf = (choice: MatchPayloadChoice): Result.Result<readonly Node[], PartSwapRefused> =>
    emitNodes(choice.content, payload, state, nestedInteraction(owner));

  return Result.gen(function* matchRoot() {
    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitNodes(content, payload, state, nestedInteraction(owner)), (nodes) =>
            applyPart(rows.prompt, props.prompt, nodes, replacement("prompt")),
          ),
        ),
      ),
    );
    const corner = yield* applyPart(
      rows.corner,
      props.corner,
      Option.match(interaction.firstColumnHeader, {
        onNone: (): readonly Node[] => [],
        onSome: (header): readonly Node[] => [text(header)],
      }),
      replacement("corner"),
    );
    const columns = yield* pipe(
      interaction.targets.map((target, index) =>
        Result.flatMap(contentOf(target), (nodes) =>
          applyPart(
            rows.columnHeader,
            props.columnHeader[index] ?? {},
            nodes,
            replacement("columnHeader"),
          ),
        ),
      ),
      Result.all,
    );
    const body = yield* pipe(
      interaction.sources.map((source, row) =>
        Result.gen(function* matchRow() {
          const header = yield* Result.flatMap(contentOf(source), (nodes) =>
            applyPart(rows.rowHeader, props.rowHeader[row] ?? {}, nodes, replacement("rowHeader")),
          );
          const cells = yield* pipe(
            interaction.targets.map((_, column) => {
              const index = row * interaction.targets.length + column;

              return Result.flatMap(
                applyPart(rows.control, props.control[index] ?? {}, [], replacement("control")),
                (control) =>
                  applyPart(rows.cell, props.cell[index] ?? {}, [control], replacement("cell")),
              );
            }),
            Result.all,
          );

          return h("tr", {}, [header, ...cells]);
        }),
      ),
      Result.all,
    );
    const matrix = yield* applyPart(
      rows.table,
      props.table,
      [h("thead", {}, [h("tr", {}, [corner, ...columns])]), h("tbody", {}, body)],
      replacement("table"),
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), matrix],
      replacement("root"),
    );
  });
};

/**
 * Read one `qti-simple-associable-choice` into its choice: its identifier, its limits and its
 * content as the body walk reads it. A `template-identifier` the choice carries is recorded as a
 * mark: plate shows no choice by a template value here.
 *
 * @param read The reader kit.
 * @param choice The choice element.
 * @returns The choice, or a refusal.
 */
const readChoice = (read: ReaderKit, choice: SourceElement): Result.Result<MatchChoice, Refusal> =>
  Result.gen(function* readMatchChoice() {
    read.markElement(choice);
    if (Option.isSome(read.valueOf(choice, "template-identifier"))) {
      read.mark(choice, "template-identifier");
    }

    const matchMax = yield* read.countAttribute(choice, "match-max");
    const matchMin = yield* read.countAttribute(choice, "match-min");

    return {
      content: yield* read.nodes(choice),
      fixed: yield* read.xsBoolean(choice, "fixed", false),
      identifier: yield* read.identifierAttribute(choice, "identifier"),
      matchGroup: Option.map(read.valueOf(choice, "match-group"), splitTokens),
      matchMax: Option.getOrElse(matchMax, () => 0n),
      matchMin: Option.getOrElse(matchMin, () => 0n),
    };
  });

/**
 * Read one `qti-simple-match-set` into its choices, in document order.
 *
 * @param read The reader kit.
 * @param set The set element.
 * @returns Its choices, or a refusal.
 */
const readSet = (
  read: ReaderKit,
  set: SourceElement,
): Result.Result<readonly MatchChoice[], Refusal> =>
  Result.gen(function* readMatchSet() {
    read.markElement(set);

    const choices: MatchChoice[] = [];

    for (const child of read.childrenNamed(set, choiceTag)) {
      choices.push(yield* readChoice(read, child));
    }

    return choices;
  });

/**
 * Read a `qti-match-interaction` as {@link matchModule} renders it, through the kit.
 *
 * The response must be declared (`undeclared-response` otherwise, as the shipped kinds refuse),
 * of base type `directedPair` and cardinality `single` or `multiple`; a declaration outside that
 * is the notice `base-type="…"` or `cardinality="…"`. The Prompt and each choice's content are
 * read by the body walk. The first `qti-simple-match-set` gives the sources and the second the
 * targets; the structure validator holds the count at two, so a missing set reads as no choices.
 * A `template-identifier` on a choice is recorded as a mark.
 *
 * @param source The interaction's source element.
 * @param context The element's path, its notice and the reader kit.
 * @returns The model node, its notice, or a refusal.
 */
const parse = (
  source: SourceElement,
  context: ParseContext,
): Result.Result<MatchInteraction | Unsupported, Refusal> =>
  Result.gen(function* readMatch() {
    const { read } = context;
    const written = yield* read.requiredAttribute(source, "response-identifier");
    const response = read.identifierOf(written.value);
    const { bound } = read;

    if (Option.isNone(bound)) {
      return yield* Result.fail(
        read.refusal("undeclared-response", attributePath(context.path, written), { response }),
      );
    }

    const declaration = bound.value;
    const declared = Option.getOrUndefined(declaration.cardinality);
    const writtenOf = (name: string) =>
      Option.getOrElse(read.valueOf(declaration.element, name), () => "");

    if (declared !== "multiple" && declared !== "single") {
      return yield* context.notice(`cardinality="${writtenOf("cardinality")}"`);
    }

    if (!Option.contains(declaration.baseType, "directedPair")) {
      return yield* context.notice(`base-type="${writtenOf("base-type")}"`);
    }

    read.markElement(source);

    const maxAssociations = yield* read.countAttribute(source, "max-associations");
    const minAssociations = yield* read.countAttribute(source, "min-associations");
    const shuffle = yield* read.xsBoolean(source, "shuffle", false);
    const prompt = yield* read.content(source, "qti-prompt");
    const [first, second] = read.childrenNamed(source, setTag);
    const sources = first === undefined ? [] : yield* readSet(read, first);
    const targets = second === undefined ? [] : yield* readSet(read, second);

    return {
      ariaLabel: read.valueOf(source, "aria-label"),
      ariaLabelledby: read.valueOf(source, "aria-labelledby"),
      cardinality: declared,
      class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
      firstColumnHeader: read.valueOf(source, "data-first-column-header"),
      kind: "match",
      maxAssociations: Option.getOrElse(maxAssociations, () => 1n),
      messages: {
        max: read.valueOf(source, "data-max-selections-message"),
        min: read.valueOf(source, "data-min-selections-message"),
      },
      minAssociations: Option.getOrElse(minAssociations, () => 0n),
      path: context.path,
      prompt,
      response,
      shuffle,
      sources,
      targets,
    };
  });

/**
 * Count how often each identifier occurs, in order of first occurrence.
 *
 * @param identifiers The identifiers, with repeats.
 * @returns Each identifier with its count.
 */
const countsOf = (identifiers: readonly string[]): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();

  for (const identifier of identifiers) {
    counts.set(identifier, (counts.get(identifier) ?? 0) + 1);
  }

  return counts;
};

/**
 * Give the choices of the other set a choice may pair with.
 *
 * @param choice The choice, none for an identifier that names no choice.
 * @returns Its `match-group`, empty when it names none, which means any.
 */
const groupOf = (choice: MatchChoice | undefined): readonly string[] =>
  choice === undefined ? [] : Option.getOrElse(choice.matchGroup, (): readonly string[] => []);

/**
 * Write "match" or "matches" for a count, in English: this module's own strings stay in it.
 *
 * @param count The count.
 * @returns The noun that agrees with it.
 */
const matchNoun = (count: bigint): string => (count === 1n ? "match" : "matches");

/**
 * Give the messages for the choices of one set whose pairs break their `match-max` (tier a) or
 * their `match-min` (tier b), each naming the choice.
 *
 * @param choices The set's choices.
 * @param counts How many pairs each identifier is in.
 * @param bound Which bound is checked.
 * @param locale The locale the count is written in.
 * @returns One message text per choice at fault.
 */
const perChoice = (
  choices: readonly MatchChoice[],
  counts: ReadonlyMap<string, number>,
  bound: "max" | "min",
  locale: Locale,
): readonly string[] =>
  choices.flatMap((choice) => {
    const count = BigInt(counts.get(choice.identifier) ?? 0);

    if (bound === "max") {
      return choice.matchMax > 0n && count > choice.matchMax
        ? [
            `Match ${choice.identifier} with at most ${numeral(locale, choice.matchMax)} ${matchNoun(choice.matchMax)}.`,
          ]
        : [];
    }

    return count < choice.matchMin
      ? [
          `Match ${choice.identifier} with at least ${numeral(locale, choice.matchMin)} ${matchNoun(choice.matchMin)}.`,
        ]
      : [];
  });

/**
 * Check a Match's response, which the caller decoded, in two tiers.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * Controls and the binding a `directedPair` response travels under, and passes the value, or the
 * {@link Malformed} `decode` gave; the entry name stays the caller's, while the messages and the
 * author's overrides stay here.
 *
 * - A {@link Malformed} input: `atMost` 1 when a single response was posted more than once, else
 *   `unknownChoice`.
 * - Tier (a), always: a pair whose source names no choice of the first set or whose target names none
 *   of the second (`unknownChoice`, so a pair written backwards is refused); a pair posted twice; a
 *   choice of either set in more pairs than its `match-max` (0 is no limit); a pair of two known
 *   choices outside the `match-group` of either; and `max-associations` above 0 capping the pairs
 *   (`atMost`).
 * - Tier (b), only under `validateResponses`: fewer pairs than `min-associations` (`atLeast`), and a
 *   choice of either set in fewer pairs than its `match-min`.
 *
 * The author's `data-max-selections-message` and `data-min-selections-message` replace the
 * renderer's text for `atMost` and `atLeast`. The messages of the other limits are this module's,
 * in English, and each names the choice or the pair at fault.
 *
 * @param interaction The Match.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validate = (
  interaction: MatchInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const say = (words: string): ValidationMessage => ({
    response: interaction.response,
    text: words,
  });
  const tooMany = (n: bigint) =>
    say(
      Option.getOrElse(interaction.messages.max, () =>
        message(locale, "atMost", { n: numeral(locale, n) }),
      ),
    );
  const tooFew = (n: bigint) =>
    say(
      Option.getOrElse(interaction.messages.min, () =>
        message(locale, "atLeast", { n: numeral(locale, n) }),
      ),
    );

  if (input instanceof Malformed) {
    return [input.reason === "single-many" ? tooMany(1n) : say(message(locale, "unknownChoice"))];
  }

  const pairs = input.values.flatMap((single) =>
    single.baseType === "directedPair" ? [single.value] : [],
  );
  const sources = new Map(interaction.sources.map((choice) => [choice.identifier, choice]));
  const targets = new Map(interaction.targets.map((choice) => [choice.identifier, choice]));
  const perSource = countsOf(pairs.map(([source]) => source));
  const perTarget = countsOf(pairs.map(([, target]) => target));
  const repeated = [...countsOf(pairs.map(([source, target]) => pairOf(source, target)))]
    .filter(([, count]) => count > 1)
    .map(([pair]) => pair);
  const known = pairs.filter(([source, target]) => sources.has(source) && targets.has(target));
  const outside = known.filter(([source, target]) => {
    const sourceGroup = groupOf(sources.get(source));
    const targetGroup = groupOf(targets.get(target));

    return (
      (sourceGroup.length > 0 && !sourceGroup.includes(target)) ||
      (targetGroup.length > 0 && !targetGroup.includes(source))
    );
  });
  const tierA = [
    ...(known.length < pairs.length ? [say(message(locale, "unknownChoice"))] : []),
    ...repeated.map((pair) => say(`Make the match ${pair} once.`)),
    ...perChoice(interaction.sources, perSource, "max", locale).map(say),
    ...perChoice(interaction.targets, perTarget, "max", locale).map(say),
    ...[...new Set(outside.map(([source, target]) => pairOf(source, target)))].map((pair) => {
      const [source = "", target = ""] = pair.split(" ");
      const group = groupOf(sources.get(source));
      const allowed = group.length > 0 ? group : groupOf(targets.get(target));

      return say(
        `${source} cannot be matched with ${target}; match it with one of ${allowed.join(", ")} instead.`,
      );
    }),
    ...(interaction.maxAssociations > 0n && BigInt(pairs.length) > interaction.maxAssociations
      ? [tooMany(interaction.maxAssociations)]
      : []),
  ];

  if (!configuration.validateResponses) {
    return tierA;
  }

  return [
    ...tierA,
    ...(BigInt(pairs.length) < interaction.minAssociations
      ? [tooFew(interaction.minAssociations)]
      : []),
    ...perChoice(interaction.sources, perSource, "min", locale).map(say),
    ...perChoice(interaction.targets, perTarget, "min", locale).map(say),
  ];
};

/**
 * Copy one set's choices into the payload, in presented order.
 *
 * @param choices The set's choices, in presented order.
 * @param kit The payload's copy of body nodes.
 * @returns The payload choices.
 */
const redactSet = (
  choices: readonly MatchChoice[],
  kit: RedactKit,
): readonly MatchPayloadChoice[] =>
  choices.map((choice) => ({
    content: kit.nodes(choice.content),
    identifier: choice.identifier,
    matchGroup: Option.getOrElse(choice.matchGroup, () => []),
    matchMax: choice.matchMax,
  }));

/**
 * Give the regions of one set's choices: each choice's content, with its identifier.
 *
 * @param choices The set's choices.
 * @returns The regions, in document order.
 */
const regionsOf = (choices: readonly MatchChoice[]): readonly OwnRegion[] =>
  choices.map((choice) => ({
    choice: Option.some(choice.identifier),
    nodes: choice.content,
    part: "choice",
    written: "nodes",
  }));

/**
 * Rebuild one set's choices with each one's content replaced.
 *
 * @param choices The set's choices.
 * @param contents The replacement contents, one per choice in order.
 * @returns The choices with their new content.
 */
const replaceSet = (
  choices: readonly MatchChoice[],
  contents: readonly (readonly BodyNode[])[],
): readonly MatchChoice[] =>
  choices.map((choice, index) => ({ ...choice, content: contents[index] ?? choice.content }));

/**
 * The type of {@link matchModule}.
 */
type MatchModule = InteractionModule<"match", MatchInteraction, MatchPayload, MatchPart, MatchJson>;

/**
 * The Match module (Q-13): the interaction module of the kind `match`, which reads, renders, binds
 * and validates `qti-match-interaction`.
 */
export const matchModule: MatchModule = {
  /**
   * The one response Match binds, which `postings` reads: its `directedPair`s are posted as text
   * with no number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Match's connect function, {@link connect}, as the record of parts the contract names.
   */
  connect: (interaction, payload, locale) => ({ ...connect(interaction, payload, locale) }),
  /**
   * The payload nodes the render writes as content: the Prompt, each target's content, then each
   * source's, in the order the table writes them.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.targets.flatMap((target) => target.content),
    ...interaction.sources.flatMap((source) => source.content),
  ],
  /**
   * One Control for each cell: a source times a target.
   */
  controls: (interaction) => interaction.sources.length * interaction.targets.length,
  element,
  feature,
  /**
   * True: the module reads, renders, binds and validates `qti-match-interaction`.
   */
  implemented: true,
  kind: "match",
  /**
   * The NULL of the `directedPair` response Match binds, of the cardinality it declares.
   */
  nullValue: (interaction) => nullOf("directedPair", interaction.cardinality),
  owner,
  parse,
  parts,
  /**
   * The codec of a Match in a redacted body: every field of the model node but its path.
   */
  payloadSchema: ({ BodyNodes, Count, NoPath, OptionalText, Schema }) => {
    const Choice = Schema.Struct({
      content: BodyNodes,
      fixed: Schema.Boolean,
      identifier: Schema.String,
      matchGroup: Schema.OptionFromOptionalKey(Schema.Array(Schema.String)),
      matchMax: Count,
      matchMin: Count,
    });

    return Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      cardinality: Schema.Literals(["multiple", "single"]),
      class: Schema.String,
      firstColumnHeader: OptionalText,
      kind: Schema.Literal("match"),
      maxAssociations: Count,
      messages: Schema.Struct({ max: OptionalText, min: OptionalText }),
      minAssociations: Count,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      shuffle: Schema.Boolean,
      sources: Schema.Array(Choice),
      targets: Schema.Array(Choice),
    });
  },
  /**
   * Copy the Match into its payload node: its content through the kit, each set in the order the
   * seed and the instance present it, and the pairs the view shows, as posted when the view holds
   * a refused post.
   */
  redact: (interaction, kit) => {
    const posted = kit.posted(interaction.response);
    const shown = kit.shown(interaction.response).map(format);

    return {
      ariaLabel: interaction.ariaLabel,
      ariaLabelledby: interaction.ariaLabelledby,
      autofocus: kit.autofocus,
      class: interaction.class,
      firstColumnHeader: interaction.firstColumnHeader,
      formName: kit.formName(interaction.response),
      maxAssociations: interaction.maxAssociations,
      prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
      response: interaction.response,
      restore: Option.getOrElse(posted, () => shown),
      sources: redactSet(
        presented(
          interaction,
          { choices: interaction.sources, name: "sources" },
          kit.seed,
          kit.instance,
        ),
        kit,
      ),
      targets: redactSet(
        presented(
          interaction,
          { choices: interaction.targets, name: "targets" },
          kit.seed,
          kit.instance,
        ),
        kit,
      ),
    };
  },
  /**
   * The regions of the node's own content, in document order: its Prompt, each source's content,
   * then each target's.
   */
  regions: (interaction) => [
    ...Option.match(interaction.prompt, {
      onNone: (): readonly OwnRegion[] => [],
      onSome: (nodes): readonly OwnRegion[] => [
        { choice: Option.none(), nodes, part: "prompt", written: "nodes" },
      ],
    }),
    ...regionsOf(interaction.sources),
    ...regionsOf(interaction.targets),
  ],
  render: renderMatch,
  /**
   * Rebuild the node with each region's content replaced, in the order `regions` gives them.
   */
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const after = Option.isSome(interaction.prompt) ? rest : contents;

    return {
      ...interaction,
      prompt: interaction.prompt.pipe(Option.map((nodes) => first ?? nodes)),
      sources: replaceSet(interaction.sources, after),
      targets: replaceSet(interaction.targets, after.slice(interaction.sources.length)),
    };
  },
  /**
   * The value Match shows for a stored response: the stored pairs themselves, each checked in the
   * cell of its source and its target.
   */
  restore: (_interaction, stored) => stored,
  /**
   * The order Match's choices were presented in, the sources then the targets, as the identifiers
   * separated by spaces; none without `shuffle`.
   */
  sequence: (interaction, seed, instance) =>
    interaction.shuffle
      ? Option.some(
          [
            ...presented(
              interaction,
              { choices: interaction.sources, name: "sources" },
              seed,
              instance,
            ),
            ...presented(
              interaction,
              { choices: interaction.targets, name: "targets" },
              seed,
              instance,
            ),
          ]
            .map((choice) => choice.identifier)
            .join(" "),
        )
      : Option.none(),
  /**
   * The value Match shows for the correct response: the correct pairs themselves.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: each Control is named by its row's and its column's text, so the renderer names none in
   * Q10's sense.
   */
  unnamed: () => false,
  validate,
};
