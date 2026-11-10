/**
 * @typedef {{
 *   type: string;
 *   name?: string;
 *   computed?: boolean;
 *   object?: SyntaxNode;
 *   property?: SyntaxNode;
 *   range: [number, number];
 * }} SyntaxNode
 *
 * @typedef {{
 *   callee: SyntaxNode;
 *   parent: SyntaxNode;
 *   range: [number, number];
 * }} CallExpressionNode
 *
 * @typedef {{
 *   insertTextBefore: (node: CallExpressionNode, text: string) => unknown;
 * }} RuleFixer
 *
 * @typedef {{
 *   report: (descriptor: {
 *     fix?: (fixer: RuleFixer) => unknown;
 *     messageId: "throwNewError";
 *     node: CallExpressionNode;
 *   }) => void;
 * }} RuleContext
 */

/**
 * The rule summary exposed by Oxlint configuration and editor tooling.
 */
const description =
  "Require `new` when creating an error, except through Effect's tagged error class factories.";

/**
 * The diagnostic: unicorn's, which this rule replaces.
 */
const message =
  "Require `new` when throwing an error. Using `new` ensures the error is correctly initialized.";

/**
 * The class factories whose call names an error but builds a class, each an object and its member:
 * `Data.TaggedError(tag)`, which oxc's rule exempts itself, and `Schema.TaggedError<Self>()`, which
 * it does not.
 */
const factories = [
  ["Data", "TaggedError"],
  ["Schema", "TaggedError"],
];

/**
 * Decide whether a callee is one of Effect's tagged error class factories.
 *
 * @param {SyntaxNode} callee - The call's callee.
 * @returns {boolean} Whether it is `Data.TaggedError` or `Schema.TaggedError`.
 */
const isFactory = (callee) =>
  callee.type === "MemberExpression" &&
  callee.computed === false &&
  callee.object?.type === "Identifier" &&
  callee.property?.type === "Identifier" &&
  factories.some(
    ([object, member]) => callee.object?.name === object && callee.property?.name === member,
  );

/**
 * Decide whether a name is an error's: at least five characters, an ASCII capital first, and
 * `Error` last, as oxc's rule decides it.
 *
 * @param {string | undefined} name - The called name.
 * @returns {boolean} Whether it names an error.
 */
const isErrorName = (name) =>
  name !== undefined && name.length >= 5 && /^[A-Z]/u.test(name) && name.endsWith("Error");

/**
 * Decide whether a call is made by an error's name: an identifier's, or a non-computed member's
 * property. Any other callee, a call or a computed member, names nothing, as oxc reads it.
 *
 * @param {SyntaxNode} callee - The call's callee.
 * @returns {boolean} Whether its name is an error's.
 */
const callsErrorName = (callee) => {
  if (callee.type === "Identifier") {
    return isErrorName(callee.name);
  }

  return (
    callee.type === "MemberExpression" &&
    callee.computed === false &&
    callee.property?.type === "Identifier" &&
    isErrorName(callee.property.name)
  );
};

/**
 * Reports an error constructor called without `new`: oxlint's `unicorn/throw-new-error`, read as
 * oxc implements it (`crates/oxc_linter/src/rules/unicorn/throw_new_error.rs`), which exempts only
 * `Data.TaggedError`, with `Schema.TaggedError` exempt beside it. `Schema.TaggedError<Self>()` is a
 * class factory called once in an `extends` clause and never thrown, and the rule has no option to
 * exempt it.
 *
 * A call that is a decorator is no construction and is skipped. A call in an `extends` clause is
 * reported without a fix, and every other is fixed by writing `new` before it.
 */
const throwNewError = {
  /**
   * @param {RuleContext} context Oxlint rule context for reporting diagnostics.
   * @returns {{ CallExpression: (node: CallExpressionNode) => void }} Visitor that inspects parsed
   *   call expressions.
   */
  create(context) {
    return {
      /**
       * @param {CallExpressionNode} node Parsed call expression candidate.
       */
      CallExpression(node) {
        if (
          node.parent.type === "Decorator" ||
          isFactory(node.callee) ||
          !callsErrorName(node.callee)
        ) {
          return;
        }

        if (node.parent.type === "ClassDeclaration" || node.parent.type === "ClassExpression") {
          context.report({ messageId: "throwNewError", node });

          return;
        }

        context.report({
          fix: (fixer) => fixer.insertTextBefore(node, "new "),
          messageId: "throwNewError",
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description,
    },
    fixable: "code",
    messages: {
      throwNewError: message,
    },
    schema: [],
    type: "problem",
  },
};

export default throwNewError;
