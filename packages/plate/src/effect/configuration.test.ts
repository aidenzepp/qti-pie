import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import {
  Configuration,
  ConfigurationFromEnv,
  configurationLayer,
} from "#plate/effect/configuration.ts";

/**
 * Each of the twelve `PLATE_` variables, a value it admits other than its default (but `LOCALE`,
 * whose only value is its default), and the field and value it decodes to.
 */
const variables = [
  { expected: true, field: "allowComment", value: "true", variable: "ALLOW_COMMENT" },
  { expected: false, field: "allowReview", value: "false", variable: "ALLOW_REVIEW" },
  { expected: false, field: "allowSkipping", value: "false", variable: "ALLOW_SKIPPING" },
  { expected: "/assets/", field: "assetBase", value: "/assets/", variable: "ASSET_BASE" },
  { expected: 3, field: "headingLevel", value: "3", variable: "HEADING_LEVEL" },
  { expected: "en", field: "locale", value: "en", variable: "LOCALE" },
  { expected: 3, field: "maxAttempts", value: "3", variable: "MAX_ATTEMPTS" },
  { expected: 1000, field: "outputBudget", value: "1000", variable: "OUTPUT_BUDGET" },
  { expected: "7", field: "seed", value: "7", variable: "SEED" },
  { expected: true, field: "showFeedback", value: "true", variable: "SHOW_FEEDBACK" },
  { expected: true, field: "showSolution", value: "true", variable: "SHOW_SOLUTION" },
  {
    expected: true,
    field: "validateResponses",
    value: "true",
    variable: "VALIDATE_RESPONSES",
  },
] as const;

/**
 * The twelve variables set together, each to its value in {@link variables}.
 */
const allTwelve = Object.fromEntries(variables.map(({ value, variable }) => [variable, value]));

/**
 * The tooling's own `PLATE_` variables, which name no configuration field.
 */
const tooling = {
  CORPUS_DIR: "/corpus",
  DEV_PORT: "8080",
  LEDGER_DIR: "/ledger",
  REQUIRE_CACHES: "1",
  WALK_CORPUS_DIR: "/walk",
  XMLLINT: "/bin/xmllint",
};

/**
 * Read the configuration {@link ConfigurationFromEnv} provides under a provider built from
 * literals, never the host's environment.
 *
 * @param provider The provider the layer reads.
 * @returns The provided configuration, or the layer's refusal.
 */
const fromProvider = (provider: ConfigProvider.ConfigProvider) =>
  Effect.provide(
    Configuration,
    ConfigurationFromEnv.pipe(Layer.provide(ConfigProvider.layer(provider))),
  );

/**
 * Read the configuration {@link ConfigurationFromEnv} provides when the provider holds the given
 * variables under `PLATE`.
 *
 * @param plate The variables, keyed by their names after `PLATE_`.
 * @returns The provided configuration, or the layer's refusal.
 */
const fromPlate = (plate: Readonly<Record<string, number | string>>) =>
  fromProvider(ConfigProvider.fromUnknown({ PLATE: plate }));

describe("ConfigurationFromEnv", () => {
  for (const { expected, field, value, variable } of variables) {
    it.effect(`reads configuration from PLATE_${variable}, setting ${field} alone`, () =>
      Effect.gen(function* oneVariable() {
        const defaults = yield* configure({});

        assert.deepStrictEqual(yield* fromPlate({ [variable]: value }), {
          ...defaults,
          [field]: expected,
        });
      }),
    );
  }

  it.effect(
    "reads configuration from PLATE_LOCALE, refusing a locale outside the supported ones",
    () =>
      Effect.gen(function* unsupportedLocale() {
        const error = yield* Effect.flip(fromPlate({ LOCALE: "fr" }));

        assert.strictEqual(error._tag, "InvalidConfiguration");
        assert.deepStrictEqual(error.field, Option.some("locale"));
      }),
  );

  it.effect("gives every default as the configuration from PLATE_ when there is no PLATE", () =>
    Effect.gen(function* noPlate() {
      assert.deepStrictEqual(
        yield* fromProvider(ConfigProvider.fromUnknown({})),
        yield* configure({}),
      );
    }),
  );

  it.effect("refuses configuration from PLATE_HEADING_LEVEL 9, naming headingLevel", () =>
    Effect.gen(function* headingNine() {
      const error = yield* Effect.flip(fromPlate({ HEADING_LEVEL: 9 }));

      assert.strictEqual(error._tag, "InvalidConfiguration");
      assert.deepStrictEqual(error.field, Option.some("headingLevel"));
    }),
  );

  it.effect("ignores the tooling's variables beside the configuration from PLATE_", () =>
    Effect.gen(function* toolingIgnored() {
      assert.deepStrictEqual(
        yield* fromPlate({ ...allTwelve, ...tooling }),
        yield* fromPlate(allTwelve),
      );
    }),
  );

  it.effect("reads configuration from PLATE_MAX_ATTEMPTS in the environment form", () =>
    Effect.gen(function* environmentForm() {
      const configuration = yield* fromProvider(
        ConfigProvider.fromEnv({ env: { PLATE_MAX_ATTEMPTS: "0" } }),
      );

      assert.strictEqual(configuration.maxAttempts, 0);
    }),
  );
});

describe("configurationLayer", () => {
  it.effect(
    "provides headingLevel 3, the settings-in-hand counterpart of configuration from PLATE_",
    () =>
      Effect.gen(function* levelThree() {
        const configuration = yield* Effect.provide(
          Configuration,
          configurationLayer({ headingLevel: 3 }),
        );

        assert.strictEqual(configuration.headingLevel, 3);
      }),
  );

  it.effect("refuses headingLevel 9, as the configuration from PLATE_ refuses it", () =>
    Effect.gen(function* levelNine() {
      const error = yield* Effect.flip(
        Effect.provide(Configuration, configurationLayer({ headingLevel: 9 })),
      );

      assert.strictEqual(error._tag, "InvalidConfiguration");
      assert.deepStrictEqual(error.field, Option.some("headingLevel"));
    }),
  );
});
