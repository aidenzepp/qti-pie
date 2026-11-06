import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import * as foreign from "#pantry/schema/kinds/foreign.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import { admission, attributeAdmission, registries } from "#pantry/schema/seed/admission.ts";
import { globalElement, namespaces, wildcardHost } from "#pantry/schema/seed/wildcard.ts";
import { wildcardAdmissionRows } from "#pantry/schema/seed/wildcard-admission.ts";

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const has = (version: SchemaVersionHandle, parent: string, child: string): boolean =>
  admission.some((row) => row.version === version && row.parent === parent && row.child === child);

describe("the Admission rows that name foreign", () => {
  it("admits the foreign and typed children in both versions", () => {
    const present = [
      ["qti-custom-operator", "foreign"],
      ["xi:fallback", "p"],
      ["foreign", "p"],
      ["foreign", "xi:include"],
      ["cp:metadata.file", "foreign"],
      ["drd:accessForAllResource", "foreign"],
      ["lom:general", "foreign"],
      ["lom:lom", "qmd:qtiMetadata"],
    ] as const;
    for (const version of versions) {
      for (const [parent, child] of present) {
        assert.isTrue(has(version, parent, child), `${version}: (${parent}, ${child})`);
      }
    }
  });

  it("refuses the pairs the declarations do not admit", () => {
    const absent = [
      ["qti-custom-operator", "p"],
      ["foreign", "qti-response-processing"],
      ["foreign", "lom:lom"],
      ["foreign", "param"],
      ["foreign", "template"],
    ] as const;
    for (const version of versions) {
      for (const [parent, child] of absent) {
        assert.isFalse(has(version, parent, child), `${version}: (${parent}, ${child})`);
      }
    }
  });

  it("derives one row per pair, in each version", () => {
    const keys = admission.map((row) => `${row.version}\u0000${row.parent}\u0000${row.child}`);
    assert.strictEqual(new Set(keys).size, keys.length);
  });

  it("admits no kind that has no element name but foreign and the generic kinds", () => {
    const nameless = new Set(
      [...registries, foreign.registry].flatMap((registry) =>
        Object.entries(registry)
          .filter(
            ([kind, row]) => row.local === "" && !generic.kinds.some((known) => known === kind),
          )
          .map(([kind]) => kind),
      ),
    );
    const admitted = new Set(
      admission.map((row) => row.child).filter((child) => nameless.has(child)),
    );
    assert.deepStrictEqual([...admitted], ["foreign"]);
  });

  it("holds (lom:string, xml:lang) once", () => {
    const rows = attributeAdmission.filter(
      (row) => row.kind === "lom:string" && row.attribute === "xml:lang",
    );
    assert.strictEqual(rows.length, 1);
  });
});

describe("wildcardAdmissionRows", () => {
  const registry = {
    math: {
      attributes: [],
      local: "math",
      namespace: namespaces.mathml,
      parent: Option.none(),
    },
    mi: { attributes: [], local: "mi", namespace: namespaces.mathml, parent: Option.none() },
  };
  const globals = [
    { local: "math", namespace: namespaces.mathml, set: "asi" },
    { local: "mi", namespace: namespaces.mathml, set: "asi" },
  ] as const;

  it("admits math alone from the MathML namespace under a non-MathML host", () => {
    const rows = wildcardAdmissionRows({
      globals,
      hosts: wildcardHost.filter((host) => host.host === "xi:fallback" || host.host === "foreign"),
      registries: [registry],
    });
    const children = (parent: string) =>
      [...new Set(rows.filter((row) => row.parent === parent).map((row) => row.child))].toSorted();
    assert.deepStrictEqual(children("xi:fallback"), ["foreign", "math"]);
    assert.deepStrictEqual(children("foreign"), ["foreign", "math"]);
  });

  it("derives a row for each version of each host", () => {
    const rows = wildcardAdmissionRows({
      globals: globalElement,
      hosts: wildcardHost,
      registries,
    });
    for (const host of wildcardHost) {
      const own = rows.filter((row) => row.parent === host.host);
      assert.strictEqual(
        own.filter((row) => row.version === "3.0.0").length,
        own.filter((row) => row.version === "3.0.1").length,
        host.host,
      );
    }
  });
});
