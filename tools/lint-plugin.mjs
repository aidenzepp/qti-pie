import noBuiltInTryCatch from "./no-built-in-try-catch.mjs";
import throwNewError from "./throw-new-error.mjs";

/**
 * Enforces explicit Effect error boundaries, and `new` for errors outside Effect's class factories.
 */
export default {
  meta: { name: "workspace" },
  rules: {
    "no-built-in-try-catch": noBuiltInTryCatch,
    "throw-new-error": throwNewError,
  },
};
