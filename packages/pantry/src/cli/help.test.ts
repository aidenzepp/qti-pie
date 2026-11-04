import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { captureCli } from "#pantry/test/cli.ts";

/**
 * The lines of the `EXAMPLES` section of a help text: from its heading to the next heading, which
 * starts in the first column.
 */
const examplesOf = (help: string): readonly string[] => {
  const lines = help.split("\n");
  const start = lines.indexOf("EXAMPLES");

  if (start === -1) {
    return [];
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^\S/u.test(line));

  return end === -1 ? rest : rest.slice(0, end);
};

/**
 * The help of `args` followed by `--help`, printed on standard output.
 */
const helpOf = Effect.fn("test.help.helpOf")(function* helpOf(args: readonly string[]) {
  const { stdout } = yield* captureCli([...args, "--help"]);

  return stdout;
});

layer(NodeServices.layer, { excludeTestServices: true })("help", (it) => {
  const cases = [
    { args: [], minimum: 2, name: "qti", writes: "writes the database" },
    { args: ["import"], minimum: 1, name: "import", writes: "writes the database" },
    { args: ["export"], minimum: 1, name: "export", writes: "writes files" },
    { args: ["roundtrip"], minimum: 1, name: "roundtrip", writes: "work/export/" },
  ] as const;

  for (const { args, minimum, name, writes } of cases) {
    it.effect(`${name} --help prints examples that name real paths`, () =>
      Effect.gen(function* examplesCase() {
        const section = examplesOf(yield* helpOf(args));
        const commands = section.filter((line) => line.trim().startsWith("qti "));

        assert.isAtLeast(commands.length, minimum);
        assert.isFalse(section.join("\n").includes("<"));
      }),
    );

    it.effect(`${name} --help says what it writes`, () =>
      Effect.gen(function* writesCase() {
        assert.include(yield* helpOf(args), writes);
      }),
    );
  }

  it.effect("the root's help holds every exit code of the table", () =>
    Effect.gen(function* codesCase() {
      const help = yield* helpOf([]);

      for (const code of ["0", "1", "2", "70", "74", "78", "130"]) {
        assert.match(help, new RegExp(`^\\s+${code}\\s`, "mu"));
      }
    }),
  );

  it.effect("the root's help says every input is a path", () =>
    Effect.gen(function* inputCase() {
      assert.include(yield* helpOf([]), "standard input");
    }),
  );

  for (const command of ["export", "roundtrip"]) {
    it.effect(`${command} --help shows --zip with its variable and default`, () =>
      Effect.gen(function* zipCase() {
        assert.include(yield* helpOf([command]), "[env: QTI_ZIP] [default: false]");
      }),
    );
  }
});
