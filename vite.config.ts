import { defineConfig } from "vite-plus";
import core from "ultracite/oxlint/core";
import antiSlop from "ultracite/oxlint/anti-slop";

/**
 * Matches module declarations and calls without spacing local call groups.
 */
const topLevelUnit = {
  selector:
    'Program > :matches(ExportNamedDeclaration, ExportDefaultDeclaration, FunctionDeclaration, ClassDeclaration, TSTypeAliasDeclaration, TSInterfaceDeclaration, TSEnumDeclaration, TSModuleDeclaration, VariableDeclaration, ExpressionStatement[expression.type="CallExpression"])',
};

/**
 * Matches direct and yielded Effect logs, including piped log annotations.
 */
const effectLogStatement = {
  selector:
    'ExpressionStatement:matches([expression.type="CallExpression"], [expression.type="YieldExpression"]):has(CallExpression[callee.type="MemberExpression"][callee.object.name="Effect"][callee.property.name=/^log(Trace|Debug|Info|Warning|Error|Fatal)?$/])',
};

/**
 * Import specifiers every package refuses: relative paths, and absolute or `file:` paths.
 */
const sharedImportPatterns = [
  {
    message: "Use the package's `#<package>/*` import alias instead of a relative source import.",
    regex: "^\\.{1,2}/",
  },
  {
    message:
      "Use the package's `#<package>/*` import alias or a dependency's exported name instead of an absolute or `file:` path.",
    regex: "^(?:/|file:)",
  },
];

export default defineConfig({
  fmt: {
    ignorePatterns: [
      ".agents/**",
      ".claude/**",
      "pnpm-lock.yaml",
      "**/migrations/**",
      "README.md",
      "packages/*/README.md",
    ],
    jsdoc: { commentLineStrategy: "multiline", lineWrappingStyle: "balance" },
  },
  lint: {
    extends: [core, antiSlop],
    ignorePatterns: ["dist/**", ".agents/**", ".claude/**", "**/migrations/**"],
    jsPlugins: ["./tools/lint-plugin.mjs", "@stylistic/eslint-plugin"],
    // Keep source imports stable when files move: each package maps `#<package>/*` to its `src/` in package.json
    // `imports`, which Node resolves at run time and TypeScript resolves under nodenext.
    // The resolver already refuses an unlisted subpath and another package's alias; lint refuses what it allows:
    // a relative specifier, an absolute or `file:` specifier, and (in crust) the package's own name.
    // A later override replaces the rule's options for its files, so the crust override repeats the shared patterns.
    // Node-loaded lint plugins retain relative .mjs imports.
    // https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-restricted-imports
    overrides: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
          "no-restricted-imports": ["error", { patterns: sharedImportPatterns }],
        },
      },
      {
        files: ["packages/crust/**/*.ts"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                ...sharedImportPatterns,
                {
                  message:
                    "Import crust's own files through the `#crust/*` alias, not through the package name.",
                  regex: "^@qti-pie/crust(?:/|$)",
                },
              ],
            },
          ],
        },
      },
    ],
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", next: topLevelUnit, prev: "*" },
        { blankLine: "always", next: "*", prev: topLevelUnit },
        {
          blankLine: "always",
          next: "const",
          // Effect generator calls are wrapped in yield expressions.
          prev: {
            selector:
              'ExpressionStatement:matches([expression.type="CallExpression"], [expression.type="YieldExpression"][expression.argument.type="CallExpression"])',
          },
        },
        { blankLine: "always", next: "return", prev: "*" },
        { blankLine: "always", next: "*", prev: "if" },
        { blankLine: "always", next: "*", prev: effectLogStatement },
      ],
      // Related Effect schemas and errors form one cohesive module.
      "max-classes-per-file": "off",
      // Effect adapters return existing promises without introducing async wrappers.
      "typescript/promise-function-async": "off",
      // unicorn's rule reads `Schema.TaggedError<Self>()`, the class factory every error class extends,
      // as an error called without `new`, and has no option to exempt it (oxc exempts `Data.TaggedError`
      // alone, `throw_new_error.rs`). The workspace rule is unicorn's with `Schema.TaggedError` exempt too.
      "unicorn/throw-new-error": "off",
      "workspace/no-built-in-try-catch": "error",
      "workspace/throw-new-error": "error",
    },
  },
});
