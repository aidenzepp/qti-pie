/**
 * The `qti-pie` registry item's component module: plate's `Item`, `Status`, `Navigation` and the
 * four shipped interaction components, each wrapped with Tailwind classes on shadcn's theme tokens.
 * `registry.json` lists this file as a `registry:component`, so shadcn copies it into a host's
 * components folder as `qti-pie.tsx`, where the host owns and edits it.
 *
 * The wrappers add classes and nothing else: each renders the plate component of its name, so the
 * markers, ids, names and text are plate's, and a host can swap `QtiItem` for `Item` with no other
 * change. The markup stays plate's because plate's sheet, `@qti-pie/plate/styles.css`, styles the
 * core HTML and the React parts alike; the classes here only add shadcn's look on top, through
 * arbitrary variants that select the `data-slot` markers plate writes (`Item` places its own
 * interactions, so a class on the item's root is the only way to reach their parts).
 *
 * Plate is not published to npm yet, so the item installs into an app that already has
 * `@qti-pie/plate`, as a workspace package or a tarball. The module imports only `react` and
 * `@qti-pie/plate/react`, the two specifiers such an app resolves; it never reaches `#plate/*`,
 * an alias that exists only inside the package.
 *
 * Tailwind generates a class only for a candidate it finds in the sources it scans. shadcn writes
 * this file into the host's components folder, which a Tailwind v4 host scans by default, so every
 * class below is written out whole and none is assembled from fragments.
 *
 * @module
 */
import {
  Choice,
  ExtendedText,
  InlineChoice,
  Item,
  Navigation,
  Status,
  TextEntry,
} from "@qti-pie/plate/react";
import type {
  InteractionComponent,
  ItemProps,
  NavigationProps,
  StatusProps,
} from "@qti-pie/plate/react";
import type { ReactNode } from "react";

/**
 * The classes that give a Choice's rows shadcn's raised, animated look, selected through the
 * markers plate writes so they work from the Choice's own root and from an item's.
 */
const choiceClasses = [
  "[&_[data-slot=choice-interaction-choice]]:shadow-xs",
  "[&_[data-slot=choice-interaction-choice]]:transition-colors",
] as const;

/**
 * The classes that give a Text Entry's control shadcn's input look.
 */
const textEntryClasses = [
  "[&_[data-slot=text-entry-interaction-control]]:shadow-xs",
  "[&_[data-slot=text-entry-interaction-control]]:transition-[color,box-shadow]",
] as const;

/**
 * The classes that give an Extended Text's control shadcn's textarea look.
 */
const extendedTextClasses = [
  "[&_[data-slot=extended-text-interaction-control]]:min-h-16",
  "[&_[data-slot=extended-text-interaction-control]]:shadow-xs",
  "[&_[data-slot=extended-text-interaction-control]]:transition-[color,box-shadow]",
] as const;

/**
 * The classes that give an Inline Choice's control shadcn's select look.
 */
const inlineChoiceClasses = [
  "[&_[data-slot=inline-choice-interaction-control]]:shadow-xs",
  "[&_[data-slot=inline-choice-interaction-control]]:transition-[color,box-shadow]",
] as const;

/**
 * The classes on an item's root: shadcn's foreground and every interaction's classes, since the
 * item places its interactions itself.
 */
const itemClasses = [
  "text-foreground",
  ...choiceClasses,
  ...textEntryClasses,
  ...extendedTextClasses,
  ...inlineChoiceClasses,
].join(" ");

/**
 * The classes on a Choice's root.
 */
const choiceRootClasses = ["text-foreground", ...choiceClasses].join(" ");

/**
 * The classes on a Text Entry's root.
 */
const textEntryRootClasses = ["text-foreground", ...textEntryClasses].join(" ");

/**
 * The classes on an Extended Text's root.
 */
const extendedTextRootClasses = ["text-foreground", ...extendedTextClasses].join(" ");

/**
 * The classes on an Inline Choice's root.
 */
const inlineChoiceRootClasses = ["text-foreground", ...inlineChoiceClasses].join(" ");

/**
 * The classes on the status region's root: shadcn's card surface and raised edge, and its
 * destructive colour for a refused answer's messages.
 */
const statusClasses = [
  "bg-card",
  "text-card-foreground",
  "shadow-xs",
  "[&_[data-slot=item-message]]:text-destructive",
].join(" ");

/**
 * The classes on the navigation's root: shadcn's foreground, and its button feedback for the
 * buttons inside.
 */
const navigationClasses = [
  "text-foreground",
  "[&_button]:shadow-xs",
  "[&_button]:transition-colors",
  "[&_button]:cursor-pointer",
  "[&_button:disabled]:cursor-not-allowed",
  "[&_button:disabled]:opacity-50",
].join(" ");

/**
 * Put a host's class beside a wrapper's classes, never in their place.
 *
 * @param classes The wrapper's classes.
 * @param className The host's class, when it gave one.
 * @returns The wrapper's classes, then the host's.
 */
const withHostClass = (classes: string, className: string | undefined): string =>
  className === undefined || className === "" ? classes : `${classes} ${className}`;

/**
 * An item, styled for a shadcn app: plate's `Item` with Tailwind classes on shadcn's theme tokens
 * merged into the root's `className`, and every other prop passed through. It is `Item`'s own type,
 * so a host can swap one for the other.
 *
 * @example
 *   <QtiItem configuration={configuration} redacted={redacted} onValueChange={record} />;
 *
 * @param props The props of `Item`: the item, its configuration, the parts and the callback.
 * @param props.className A class kept beside the wrapper's classes and plate's.
 * @returns The item, projected, with the wrapper's classes on its root.
 * @see {@link Item}
 */
export const QtiItem = ({ className, ...props }: ItemProps): ReactNode => (
  <Item {...props} className={withHostClass(itemClasses, className)} />
);

/**
 * The status region, styled for a shadcn app: plate's `Status` with Tailwind classes on shadcn's
 * card tokens merged into the root's `className`, and every other prop passed through.
 *
 * @example
 *   <QtiStatus configuration={configuration} input={{ heading: "scored", instance: "q1", score: "1" }} />;
 *
 * @param props The props of `Status`: its input, the configuration and the part replacements.
 * @param props.className A class kept beside the wrapper's classes and plate's.
 * @returns The status region, projected, with the wrapper's classes on its root.
 * @see {@link Status}
 */
export const QtiStatus = ({ className, ...props }: StatusProps): ReactNode => (
  <Status {...props} className={withHostClass(statusClasses, className)} />
);

/**
 * The test navigation, styled for a shadcn app: plate's `Navigation` with Tailwind classes on
 * shadcn's theme tokens merged into the root's `className`, and every other prop passed through,
 * `onIntent` included.
 *
 * @example
 *   <QtiNavigation configuration={configuration} onIntent={post} state={state} />;
 *
 * @param props The props of `Navigation`: its state, the configuration, the callback and the parts.
 * @param props.className A class kept beside the wrapper's classes and plate's.
 * @returns The navigation's root, projected, with the wrapper's classes on it.
 * @see {@link Navigation}
 */
export const QtiNavigation = ({ className, ...props }: NavigationProps): ReactNode => (
  <Navigation {...props} className={withHostClass(navigationClasses, className)} />
);

/**
 * A Choice, styled for a shadcn app: plate's `Choice` with Tailwind classes on shadcn's theme
 * tokens merged into the root's `className`, and every state prop passed through (`defaultValue`,
 * `value`, `onValueChange`, `name`, `disabled`, `parts` and `responseIdentifier`).
 *
 * @example
 *   <QtiChoice responseIdentifier="RESPONSE" onValueChange={setChosen} />;
 *
 * @param props The props of `Choice`.
 * @param props.className A class kept beside the wrapper's classes and plate's.
 * @returns The Choice's root, projected, with the wrapper's classes on it.
 * @see {@link Choice}
 */
export const QtiChoice: InteractionComponent<"choice-interaction"> = ({ className, ...props }) => (
  <Choice {...props} className={withHostClass(choiceRootClasses, className)} />
);

/**
 * A Text Entry, styled for a shadcn app: plate's `TextEntry` with Tailwind classes on shadcn's
 * theme tokens merged into the root's `className`, and every state prop passed through.
 *
 * @example
 *   <QtiTextEntry responseIdentifier="RESPONSE" onValueChange={setTyped} />;
 *
 * @param props The props of `TextEntry`.
 * @param props.className A class kept beside the wrapper's classes and plate's.
 * @returns The Text Entry's root, projected, with the wrapper's classes on it.
 * @see {@link TextEntry}
 */
export const QtiTextEntry: InteractionComponent<"text-entry-interaction"> = ({
  className,
  ...props
}) => <TextEntry {...props} className={withHostClass(textEntryRootClasses, className)} />;

/**
 * An Extended Text, styled for a shadcn app: plate's `ExtendedText` with Tailwind classes on
 * shadcn's theme tokens merged into the root's `className`, and every state prop passed through.
 *
 * @example
 *   <QtiExtendedText responseIdentifier="NOTE" onValueChange={setWritten} />;
 *
 * @param props The props of `ExtendedText`.
 * @param props.className A class kept beside the wrapper's classes and plate's.
 * @returns The Extended Text's root, projected, with the wrapper's classes on it.
 * @see {@link ExtendedText}
 */
export const QtiExtendedText: InteractionComponent<"extended-text-interaction"> = ({
  className,
  ...props
}) => <ExtendedText {...props} className={withHostClass(extendedTextRootClasses, className)} />;

/**
 * An Inline Choice, styled for a shadcn app: plate's `InlineChoice` with Tailwind classes on
 * shadcn's theme tokens merged into the root's `className`, and every state prop passed through.
 *
 * @example
 *   <QtiInlineChoice responseIdentifier="PICK" onValueChange={setPicked} />;
 *
 * @param props The props of `InlineChoice`.
 * @param props.className A class kept beside the wrapper's classes and plate's.
 * @returns The Inline Choice's root, projected, with the wrapper's classes on it.
 * @see {@link InlineChoice}
 */
export const QtiInlineChoice: InteractionComponent<"inline-choice-interaction"> = ({
  className,
  ...props
}) => <InlineChoice {...props} className={withHostClass(inlineChoiceRootClasses, className)} />;
