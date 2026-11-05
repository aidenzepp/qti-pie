/**
 * Chromium's own accessibility tree, read through the Chrome DevTools Protocol.
 *
 * Playwright reaches an engine's own accessibility tree in Chromium only: its role locators and
 * `ariaSnapshot` are computed by Playwright's injected script, the same code in every engine, and
 * `browserContext.newCDPSession` is "only supported on Chromium-based browsers"
 * (`playwright-core` 1.64.1, `types.d.ts`). Through that session the protocol's `Accessibility`
 * domain answers `getFullAXTree` and `queryAXTree` with the nodes Chromium itself computed: role,
 * name, description and properties such as `checked`, `focused`, `invalid` and `describedby`. In
 * WebKit both readers fail with {@link ChromiumOnly}.
 *
 * The domain is marked experimental, so every answer is decoded with a Schema, and an answer that
 * does not fit is {@link CdpFailed}, never a silent empty tree. Its property list has no position
 * in a set: a test checks "n of N" by structure, as the group's controls in this tree in the
 * presented order, not as a number Chromium reports.
 *
 * Test support: nothing outside `src/test/` and browser test files imports it.
 *
 * @see https://github.com/ChromeDevTools/devtools-protocol/blob/b0d96c6c/pdl/domains/Accessibility.pdl
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import type { CDPSession, Page } from "playwright-core";
import { Effect, Option, Schema } from "effect";
import { engineNames } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";

/**
 * A DOM node an `AXValue` refers to, as the protocol's `AXRelatedNode` gives it: its backend id,
 * the IDREF that named it, if any, and its text alternative in the referring context, if any.
 */
const AxRelatedNodeSchema = Schema.Struct({
  backendDOMNodeId: Schema.Number,
  idref: Schema.optionalKey(Schema.String),
  text: Schema.optionalKey(Schema.String),
});

/**
 * A computed property's value, as the protocol's `AXValue` gives it: its type (`boolean`,
 * `tristate`, `booleanOrUndefined`, `idrefList`, `token` and the others the domain lists), its
 * value when the type carries one, and the DOM nodes it refers to when it is a relation.
 *
 * The protocol types `value` as any; Chromium writes a boolean, a number or a string, and a value
 * of any other shape fails the decode.
 */
const AxValueSchema = Schema.Struct({
  relatedNodes: Schema.optionalKey(Schema.Array(AxRelatedNodeSchema)),
  type: Schema.String,
  value: Schema.optionalKey(Schema.Union([Schema.Boolean, Schema.Number, Schema.String])),
});

/**
 * A computed property's value, as {@link AxValueSchema} decodes the protocol's `AXValue`: a
 * `checked` property is `{ type: "tristate", value: "true" }`, `"false"` or `"mixed"`; `focused`
 * is `{ type: "booleanOrUndefined", value: true }` on the focused node; a relation such as
 * `describedby` lists its targets in `relatedNodes`.
 */
export type AxValue = typeof AxValueSchema.Type;

/**
 * The role, name or description of a node, as the protocol's `AXValue` gives it: a string value,
 * when the node has one.
 */
const AxTextSchema = Schema.Struct({
  type: Schema.String,
  value: Schema.optionalKey(Schema.String),
});

/**
 * A node of the tree as the protocol's `AXNode` gives it, reduced to the fields {@link AxNode}
 * keeps.
 */
const RawAxNodeSchema = Schema.Struct({
  backendDOMNodeId: Schema.optionalKey(Schema.Number),
  childIds: Schema.optionalKey(Schema.Array(Schema.String)),
  description: Schema.optionalKey(AxTextSchema),
  ignored: Schema.Boolean,
  name: Schema.optionalKey(AxTextSchema),
  nodeId: Schema.String,
  properties: Schema.optionalKey(
    Schema.Array(Schema.Struct({ name: Schema.String, value: AxValueSchema })),
  ),
  role: Schema.optionalKey(AxTextSchema),
});

/**
 * The answer of `Accessibility.getFullAXTree` and of `Accessibility.queryAXTree`: a list of nodes.
 */
const AxNodesReply = Schema.Struct({ nodes: Schema.Array(RawAxNodeSchema) });

/**
 * The part of `DOM.getDocument`'s answer {@link axQuery} reads: the document node's backend id,
 * the root `queryAXTree` searches below.
 */
const DocumentReply = Schema.Struct({ root: Schema.Struct({ backendNodeId: Schema.Number }) });

/**
 * A node of Chromium's accessibility tree.
 *
 * `role`, `name` and `description` are the string values Chromium computed, each empty when the
 * node has none. `properties` holds every other property the node carries, by its protocol name
 * (`checked`, `focused`, `invalid`, `describedby` and the rest). `childIds` lists the `nodeId`s
 * of its children in order, and `backendDOMNodeId` names the DOM node it stands for, when it
 * stands for one. An `ignored` node is in the tree but hidden from assistive technology.
 */
export interface AxNode {
  readonly backendDOMNodeId: Option.Option<number>;
  readonly childIds: readonly string[];
  readonly description: string;
  readonly ignored: boolean;
  readonly name: string;
  readonly nodeId: string;
  readonly properties: ReadonlyMap<string, AxValue>;
  readonly role: string;
}

/**
 * The failure of a reader of Chromium's tree asked about a page of another engine, which has no
 * DevTools Protocol session.
 */
export class ChromiumOnly extends Schema.TaggedError<ChromiumOnly>()("ChromiumOnly", {
  engine: Schema.Literals(engineNames),
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Chromium's accessibility tree is read through a DevTools Protocol session, which Playwright opens in Chromium only, not in ${this.engine}. Assert on Playwright's computed tree (getByRole, ariaSnapshot) in ${this.engine}, and read this tree in the chromium describe only.`;
  }
}

/**
 * The failure of a DevTools Protocol call: the session would not open, the call was refused, or
 * its answer did not decode.
 */
export class CdpFailed extends Schema.TaggedError<CdpFailed>()("CdpFailed", {
  method: Schema.String,
  reason: Schema.String,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `The DevTools Protocol call ${this.method} failed: ${this.reason}. The Accessibility domain is experimental, so compare its answer with pdl/domains/Accessibility.pdl for the installed Chromium, and update the decode in src/test/ax-tree.ts to match.`;
  }
}

/**
 * Reduce a decoded protocol node to an {@link AxNode}.
 *
 * @param node The node, as {@link RawAxNodeSchema} decoded it.
 * @returns The node, its absent role, name and description empty and its properties by name.
 */
const toAxNode = (node: typeof RawAxNodeSchema.Type): AxNode => ({
  backendDOMNodeId: Option.fromUndefinedOr(node.backendDOMNodeId),
  childIds: node.childIds ?? [],
  description: node.description?.value ?? "",
  ignored: node.ignored,
  name: node.name?.value ?? "",
  nodeId: node.nodeId,
  properties: new Map((node.properties ?? []).map((property) => [property.name, property.value])),
  role: node.role?.value ?? "",
});

/**
 * Send one DevTools Protocol call and decode its answer.
 *
 * @param method The protocol method, named in a failure.
 * @param reply The Schema the answer must fit.
 * @param call Send the call.
 * @returns The decoded answer; {@link CdpFailed} when the call is refused or the answer does not
 *   fit.
 */
const ask = <S extends Schema.Constraint>(
  method: string,
  reply: S,
  call: () => Promise<object>,
): Effect.Effect<S["Type"], CdpFailed, S["DecodingServices"]> =>
  Effect.tryPromise({
    catch: (cause) =>
      new CdpFailed({ method, reason: cause instanceof Error ? cause.message : String(cause) }),
    try: call,
  }).pipe(
    Effect.flatMap((answer) =>
      Schema.decodeUnknownEffect(reply)(answer).pipe(
        Effect.mapError((schemaError) => new CdpFailed({ method, reason: schemaError.message })),
      ),
    ),
    Effect.withSpan("ax-tree.ask", { attributes: { method } }),
  );

/**
 * Open a DevTools Protocol session on a Chromium page, use it, and detach it however the use
 * ends.
 *
 * @param page The page.
 * @param engine The engine the page runs in; any other than Chromium is refused before a session
 *   is asked for.
 * @param use Use the session.
 * @returns What `use` returns; {@link ChromiumOnly} outside Chromium; {@link CdpFailed} when the
 *   session does not open.
 */
const withSession = <A, R>(
  page: Page,
  engine: EngineName,
  use: (session: CDPSession) => Effect.Effect<A, CdpFailed, R>,
): Effect.Effect<A, CdpFailed | ChromiumOnly, R> =>
  engine === "chromium"
    ? Effect.scoped(
        Effect.acquireRelease(
          Effect.tryPromise({
            catch: (cause) =>
              new CdpFailed({
                method: "newCDPSession",
                reason: cause instanceof Error ? cause.message : String(cause),
              }),
            try: () => page.context().newCDPSession(page),
          }),
          (session) => Effect.ignore(Effect.tryPromise(() => session.detach())),
        ).pipe(Effect.flatMap(use)),
      )
    : Effect.fail(new ChromiumOnly({ engine }));

/**
 * Read the whole of Chromium's accessibility tree for a page's document.
 *
 * @param page The page, open in a context of the engine.
 * @param engine The engine the page runs in.
 * @returns Every node `Accessibility.getFullAXTree` gives, ignored ones included, in the order it
 *   gives them; {@link ChromiumOnly} outside Chromium; {@link CdpFailed} when the session or the
 *   call fails or its answer does not decode.
 */
export const chromiumTree = Effect.fn("chromiumTree")(function* chromiumTree(
  page: Page,
  engine: EngineName,
): Effect.fn.Return<readonly AxNode[], CdpFailed | ChromiumOnly> {
  return yield* withSession(page, engine, (session) =>
    ask("Accessibility.getFullAXTree", AxNodesReply, () =>
      session.send("Accessibility.getFullAXTree", {}),
    ),
  ).pipe(Effect.map((reply) => reply.nodes.map(toAxNode)));
});

/**
 * Find the nodes of Chromium's accessibility tree with a role and a name, below the page's
 * document.
 *
 * @param page The page, open in a context of the engine.
 * @param engine The engine the page runs in.
 * @param query The role and the accessible name to match, each exactly.
 * @param query.name The accessible name.
 * @param query.role The role, as Chromium names it (`group`, `radio`, `textbox`).
 * @returns The matching nodes `Accessibility.queryAXTree` gives, ignored ones included;
 *   {@link ChromiumOnly} outside Chromium; {@link CdpFailed} when the session or a call fails or
 *   an answer does not decode.
 */
export const axQuery = Effect.fn("axQuery")(function* axQuery(
  page: Page,
  engine: EngineName,
  query: { readonly name: string; readonly role: string },
): Effect.fn.Return<readonly AxNode[], CdpFailed | ChromiumOnly> {
  return yield* withSession(page, engine, (session) =>
    Effect.gen(function* queryDocument() {
      const document = yield* ask("DOM.getDocument", DocumentReply, () =>
        session.send("DOM.getDocument", { depth: 0 }),
      );

      return yield* ask("Accessibility.queryAXTree", AxNodesReply, () =>
        session.send("Accessibility.queryAXTree", {
          accessibleName: query.name,
          backendNodeId: document.root.backendNodeId,
          role: query.role,
        }),
      );
    }),
  ).pipe(Effect.map((reply) => reply.nodes.map(toAxNode)));
});
