import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { lexProlog } from "#qti/xml/dtd.ts";
import type { AttlistEntry } from "#qti/xml/dtd.ts";
import { ReaderRefusal, WellFormednessError } from "#qti/xml/errors.ts";

/**
 * Lex `text` and return its general-entity table as `[name, replacement]` pairs in declaration
 * order.
 */
const entitiesOf = (text: string) =>
  lexProlog(text).pipe(Effect.map((prolog) => [...prolog.entities]));

/**
 * The table of `element` from the `attlists` of the prolog of `text`, as `[attribute, entry]`
 * pairs.
 */
const attlistOf = (text: string, element: string) =>
  lexProlog(text).pipe(
    Effect.map((prolog): [string, AttlistEntry][] => [...(prolog.attlists.get(element) ?? [])]),
  );

/**
 * Lex `text`, which must be refused, and return the refusal.
 */
const refusalOf = (text: string) => Effect.flip(lexProlog(text));

describe("the XML declaration", () => {
  it.effect("is read field by field, as written", () =>
    Effect.gen(function* readsFields() {
      const prolog = yield* lexProlog(
        "<?xml version='1.1' encoding=\"ISO-8859-1\" standalone='no' ?><a/>",
      );

      assert.deepStrictEqual(
        prolog.declaration,
        Option.some({
          encoding: Option.some("ISO-8859-1"),
          standalone: Option.some("no"),
          version: "1.1",
        }),
      );
      assert.isFalse(prolog.standalone);
    }),
  );

  it.effect("leaves an absent field as None and reports standalone yes as true", () =>
    Effect.gen(function* readsAbsentFields() {
      const prolog = yield* lexProlog('<?xml version="1.0" standalone="yes"?><a/>');

      assert.deepStrictEqual(
        prolog.declaration,
        Option.some({
          encoding: Option.none(),
          standalone: Option.some("yes"),
          version: "1.0",
        }),
      );
      assert.isTrue(prolog.standalone);
    }),
  );

  it.effect("is absent for a document that starts with another processing instruction", () =>
    Effect.gen(function* readsNoDeclaration() {
      const prolog = yield* lexProlog('<?xml-stylesheet href="s.css"?><a/>');

      assert.isTrue(Option.isNone(prolog.declaration));
      assert.isFalse(prolog.standalone);
    }),
  );

  it.effect("is refused with its position when a pseudo-attribute is malformed", () =>
    Effect.gen(function* refusesMalformed() {
      const error = yield* refusalOf('<?xml version="1.0"\n encoding=UTF-8?><a/>');

      assert.instanceOf(error, WellFormednessError);
      assert.strictEqual(error.line, 2);
      assert.strictEqual(error.column, 11);
      assert.isFalse(error.afterSubstitution);
    }),
  );

  it.effect("is refused when it has no version", () =>
    Effect.gen(function* refusesNoVersion() {
      const error = yield* refusalOf('<?xml encoding="UTF-8"?><a/>');

      assert.instanceOf(error, WellFormednessError);
    }),
  );
});

describe("the document type declaration", () => {
  it.effect("is returned whole, internal subset included, and bodyStart follows it", () =>
    Effect.gen(function* readsDoctype() {
      const doctype = '<!DOCTYPE a SYSTEM "a.dtd" [<!ENTITY e "v">]>';
      const text = `<?xml version="1.0"?>\n${doctype}\n<a/>`;
      const prolog = yield* lexProlog(text);

      assert.deepStrictEqual(prolog.doctype, Option.some(doctype));
      assert.strictEqual(prolog.bodyStart, text.indexOf("\n<a/>"));
      assert.isTrue(prolog.externalSubset);
    }),
  );

  it.effect("marks a PUBLIC identifier as an external subset and a bare name as none", () =>
    Effect.gen(function* readsExternalIds() {
      const pub = yield* lexProlog('<!DOCTYPE a PUBLIC "-//X//EN" "x.dtd"><a/>');
      const bare = yield* lexProlog("<!DOCTYPE a [<!ENTITY e 'v'>]><a/>");

      assert.isTrue(pub.externalSubset);
      assert.isFalse(bare.externalSubset);
    }),
  );

  it.effect("is not confused by brackets, quotes and angle brackets inside literals", () =>
    Effect.gen(function* readsLiterals() {
      const doctype = '<!DOCTYPE a PUBLIC "a]>b" \'c[>d\' [<!ENTITY e "]>\'">]>';
      const prolog = yield* lexProlog(`${doctype}<a/>`);

      assert.deepStrictEqual(prolog.doctype, Option.some(doctype));
      assert.deepStrictEqual([...prolog.entities], [["e", "]>'"]]);
      assert.strictEqual(prolog.bodyStart, doctype.length);
    }),
  );

  it.effect(
    "is absent when there is none, and bodyStart follows the declaration and leading misc",
    () =>
      Effect.gen(function* readsNoDoctype() {
        const text = '<?xml version="1.0"?>\n<!-- c --><?pi x?>\n<a/>';
        const prolog = yield* lexProlog(text);

        assert.isTrue(Option.isNone(prolog.doctype));
        assert.isFalse(prolog.externalSubset);
        assert.strictEqual(prolog.bodyStart, text.indexOf("<a/>"));
      }),
  );

  it.effect("is found after a comment and a processing instruction that mention one", () =>
    Effect.gen(function* skipsMisc() {
      const text =
        "<!-- <!DOCTYPE x [<!ENTITY no 'n'>]> --><?p <!DOCTYPE y>?><!DOCTYPE a [<!ENTITY e 'v'>]><a/>";
      const prolog = yield* lexProlog(text);

      assert.deepStrictEqual(prolog.doctype, Option.some("<!DOCTYPE a [<!ENTITY e 'v'>]>"));
      assert.deepStrictEqual([...prolog.entities], [["e", "v"]]);
    }),
  );

  it.effect("is refused with its position when the internal subset is not closed", () =>
    Effect.gen(function* refusesUnclosed() {
      const error = yield* refusalOf('<?xml version="1.0"?>\n<!DOCTYPE a [\n<!ENTITY e "v">');

      assert.instanceOf(error, WellFormednessError);
      assert.strictEqual(error.line, 3);
    }),
  );

  it.effect("is refused with its position when an entity value is not quoted", () =>
    Effect.gen(function* refusesUnquoted() {
      const error = yield* refusalOf('<?xml version="1.0"?>\n<!DOCTYPE a [\n<!ENTITY e v>]><a/>');

      assert.instanceOf(error, WellFormednessError);
      assert.strictEqual(error.line, 3);
      assert.strictEqual(error.column, 12);
    }),
  );
});

describe("general entities", () => {
  it.effect("expand character references at declaration", () =>
    Effect.gen(function* expandsCharacterReferences() {
      assert.deepStrictEqual(yield* entitiesOf('<!DOCTYPE a [<!ENTITY e "a &#10; b">]><a/>'), [
        ["e", "a \n b"],
      ]);
      assert.deepStrictEqual(yield* entitiesOf('<!DOCTYPE a [<!ENTITY e "&#x20AC;&#65;">]><a/>'), [
        ["e", "€A"],
      ]);
    }),
  );

  it.effect("expand parameter-entity references at declaration", () =>
    Effect.gen(function* expandsParameterReferences() {
      const prolog = yield* lexProlog('<!DOCTYPE a [<!ENTITY % p "x"><!ENTITY e "%p;y">]><a/>');

      assert.deepStrictEqual([...prolog.entities], [["e", "xy"]]);
    }),
  );

  it.effect("leave general-entity references as written", () =>
    Effect.gen(function* leavesGeneralReferences() {
      assert.deepStrictEqual(yield* entitiesOf('<!DOCTYPE a [<!ENTITY e "&f;">]><a/>'), [
        ["e", "&f;"],
      ]);
      assert.deepStrictEqual(yield* entitiesOf('<!DOCTYPE a [<!ENTITY e "&lt;&#38;#60;">]><a/>'), [
        ["e", "&lt;&#60;"],
      ]);
    }),
  );

  it.effect("keep markup, quotes and angle brackets in their replacement text", () =>
    Effect.gen(function* keepsMarkup() {
      assert.deepStrictEqual(yield* entitiesOf('<!DOCTYPE a [<!ENTITY m "<b>x</b>">]><a/>'), [
        ["m", "<b>x</b>"],
      ]);
      assert.deepStrictEqual(yield* entitiesOf("<!DOCTYPE a [<!ENTITY q 'a\"b'>]><a/>"), [
        ["q", 'a"b'],
      ]);
    }),
  );

  it.effect("bind at their first declaration, internal or not", () =>
    Effect.gen(function* bindsFirst() {
      assert.deepStrictEqual(
        yield* entitiesOf('<!DOCTYPE a [<!ENTITY e "1"><!ENTITY e "2">]><a/>'),
        [["e", "1"]],
      );
      assert.deepStrictEqual(
        yield* entitiesOf('<!DOCTYPE a [<!ENTITY e SYSTEM "e.ent"><!ENTITY e "2">]><a/>'),
        [],
      );
    }),
  );

  it.effect("are not tabled when external or unparsed", () =>
    Effect.gen(function* skipsExternal() {
      assert.deepStrictEqual(
        yield* entitiesOf(
          '<!DOCTYPE a [<!ENTITY x SYSTEM "x.ent"><!ENTITY y PUBLIC "-//Y//EN" "y.ent"><!ENTITY z SYSTEM "z.gif" NDATA gif><!ENTITY e "v">]><a/>',
        ),
        [["e", "v"]],
      );
    }),
  );

  it.effect("take their name from the whole XML name character set", () =>
    Effect.gen(function* readsNonAsciiNames() {
      assert.deepStrictEqual(yield* entitiesOf('<!DOCTYPE a [<!ENTITY été-1 "v">]><a/>'), [
        ["été-1", "v"],
      ]);
      assert.instanceOf(
        yield* refusalOf('<!DOCTYPE a [<!ENTITY 1e "v">]><a/>'),
        WellFormednessError,
      );
    }),
  );

  it.effect("fold the line breaks of a literal to line feeds and count each break once", () =>
    Effect.gen(function* foldsLineBreaks() {
      const text = '<!DOCTYPE a [\r\n<!ENTITY e "x\r\ny\rz">\r\n<!ENTITY f v>]><a/>';

      assert.deepStrictEqual(yield* entitiesOf(text.replace(" f v", " f 'v'")), [
        ["e", "x\ny\nz"],
        ["f", "v"],
      ]);

      const error = yield* refusalOf(text);

      assert.instanceOf(error, WellFormednessError);
      assert.strictEqual(error.line, 5);
      assert.strictEqual(error.column, 12);
    }),
  );

  it.effect("are refused when a character reference names a character XML forbids", () =>
    Effect.gen(function* refusesBadCharacter() {
      const error = yield* refusalOf('<!DOCTYPE a [<!ENTITY e "&#0;">]><a/>');

      assert.instanceOf(error, WellFormednessError);
    }),
  );

  it.effect("are refused when a value holds a bare ampersand or percent sign", () =>
    Effect.gen(function* refusesBareMarkup() {
      assert.instanceOf(
        yield* refusalOf('<!DOCTYPE a [<!ENTITY e "a & b">]><a/>'),
        WellFormednessError,
      );
      assert.instanceOf(
        yield* refusalOf('<!DOCTYPE a [<!ENTITY e "50% off">]><a/>'),
        WellFormednessError,
      );
    }),
  );
});

describe("the internal subset", () => {
  it.effect("skips ELEMENT and NOTATION declarations, comments and processing instructions", () =>
    Effect.gen(function* skipsDeclarations() {
      const subset = [
        "<!ELEMENT a (#PCDATA|b)*>",
        '<!NOTATION gif SYSTEM "image/gif">',
        '<!-- <!ENTITY no "n"> -->',
        '<?target <!ENTITY no "n">?>',
        '<!ENTITY e "v">',
      ].join("\n");

      assert.deepStrictEqual(yield* entitiesOf(`<!DOCTYPE a [\n${subset}\n]><a/>`), [["e", "v"]]);
    }),
  );

  it.effect("stops at the first reference to a parameter entity it has not read", () =>
    Effect.gen(function* stopsAtUnreadReference() {
      const prolog = yield* lexProlog(
        '<!DOCTYPE a [<!ENTITY before "b">%undeclared;<!ENTITY after "a"><!ATTLIST a x CDATA "d">]><a/>',
      );

      assert.deepStrictEqual([...prolog.entities], [["before", "b"]]);
      assert.strictEqual(prolog.attlists.size, 0);
      assert.deepStrictEqual(
        prolog.doctype,
        Option.some(
          '<!DOCTYPE a [<!ENTITY before "b">%undeclared;<!ENTITY after "a"><!ATTLIST a x CDATA "d">]>',
        ),
      );
    }),
  );

  it.effect("stops at a parameter entity that is declared externally", () =>
    Effect.gen(function* stopsAtExternalParameterEntity() {
      assert.deepStrictEqual(
        yield* entitiesOf(
          '<!DOCTYPE a [<!ENTITY % ext SYSTEM "x.ent"> %ext; <!ENTITY e "v">]><a/>',
        ),
        [],
      );
    }),
  );

  it.effect("stops at an unread reference inside an entity value, which stays untabled", () =>
    Effect.gen(function* stopsInsideValue() {
      assert.deepStrictEqual(
        yield* entitiesOf('<!DOCTYPE a [<!ENTITY e "%undeclared;y"><!ENTITY f "v">]><a/>'),
        [],
      );
    }),
  );

  it.effect("keeps reading past an unread reference when the declaration says standalone yes", () =>
    Effect.gen(function* keepsReadingStandalone() {
      const prolog = yield* lexProlog(
        '<?xml version="1.0" standalone="yes"?><!DOCTYPE a [%undeclared;<!ENTITY e "v">]><a/>',
      );

      assert.deepStrictEqual([...prolog.entities], [["e", "v"]]);
    }),
  );

  it.effect("reads the declarations inside a parameter entity it has read", () =>
    Effect.gen(function* readsParameterEntityUse() {
      const prolog = yield* lexProlog(
        "<!DOCTYPE a [<!ENTITY % d \"<!ENTITY e 'v'>\"> %d; <!ENTITY f 'w'>]><a/>",
      );

      assert.deepStrictEqual(
        [...prolog.entities],
        [
          ["e", "v"],
          ["f", "w"],
        ],
      );
    }),
  );
});

describe("attribute-list declarations", () => {
  it.effect("table each attribute's type and default", () =>
    Effect.gen(function* tablesAttributes() {
      const table = yield* attlistOf(
        '<!DOCTYPE a [<!ATTLIST a x CDATA #FIXED "v" y CDATA "d" z CDATA #REQUIRED w CDATA #IMPLIED>]><a/>',
        "a",
      );

      assert.deepStrictEqual(table, [
        ["x", { default: Option.some("v"), type: "CDATA" }],
        ["y", { default: Option.some("d"), type: "CDATA" }],
        ["z", { default: Option.none(), type: "CDATA" }],
        ["w", { default: Option.none(), type: "CDATA" }],
      ]);
    }),
  );

  it.effect("table the tokenized types and an enumeration by their type", () =>
    Effect.gen(function* tablesTypes() {
      const table = yield* attlistOf(
        "<!DOCTYPE a [<!ATTLIST a i ID #IMPLIED n NMTOKENS ' p  q ' k ( p | q ) 'p' o NOTATION (gif|png) #IMPLIED>]><a/>",
        "a",
      );

      assert.deepStrictEqual(table, [
        ["i", { default: Option.none(), type: "ID" }],
        ["n", { default: Option.some(" p  q "), type: "NMTOKENS" }],
        ["k", { default: Option.some("p"), type: "( p | q )" }],
        ["o", { default: Option.none(), type: "NOTATION" }],
      ]);
    }),
  );

  it.effect(
    "give a default its character and predefined references expanded and its whitespace normalized",
    () =>
      Effect.gen(function* expandsDefault() {
        const table = yield* attlistOf(
          '<!DOCTYPE a [<!ATTLIST a x CDATA "a&amp;b&#x20AC;&#10;c\td\ne">]><a/>',
          "a",
        );

        assert.deepStrictEqual(table, [
          ["x", { default: Option.some("a&b€\nc d e"), type: "CDATA" }],
        ]);
      }),
  );

  it.effect("merge the declarations of one element and bind each attribute at its first", () =>
    Effect.gen(function* mergesDeclarations() {
      const table = yield* attlistOf(
        '<!DOCTYPE a [<!ATTLIST a x CDATA "1"><!ATTLIST a x CDATA "2" y CDATA "3"><!ATTLIST b z CDATA "4">]><a/>',
        "a",
      );

      assert.deepStrictEqual(table, [
        ["x", { default: Option.some("1"), type: "CDATA" }],
        ["y", { default: Option.some("3"), type: "CDATA" }],
      ]);
    }),
  );

  it.effect("are refused with a position when a default declaration is missing", () =>
    Effect.gen(function* refusesMissingDefault() {
      const error = yield* refusalOf("<!DOCTYPE a [<!ATTLIST a x CDATA>]><a/>");

      assert.instanceOf(error, WellFormednessError);
    }),
  );

  it.effect("are refused when a default holds an angle bracket", () =>
    Effect.gen(function* refusesAngleBracket() {
      const error = yield* refusalOf('<!DOCTYPE a [<!ATTLIST a x CDATA "<">]><a/>');

      assert.instanceOf(error, WellFormednessError);
    }),
  );
});

describe("recursive entities", () => {
  it.effect("are refused when an entity references itself", () =>
    Effect.gen(function* refusesSelfReference() {
      const error = yield* refusalOf('<!DOCTYPE a [<!ENTITY e "&e;">]><a/>');

      assert.instanceOf(error, ReaderRefusal);
      assert.strictEqual(error.rule, "entity-cycle");
      assert.include(error.detail, "e");
    }),
  );

  it.effect("are refused when entities reference each other in a ring", () =>
    Effect.gen(function* refusesRing() {
      const error = yield* refusalOf(
        '<!DOCTYPE a [<!ENTITY a "x&b;"><!ENTITY b "&c;"><!ENTITY c "&a;y">]><a/>',
      );

      assert.instanceOf(error, ReaderRefusal);
      assert.strictEqual(error.rule, "entity-cycle");
    }),
  );

  it.effect("are admitted when one entity is referenced twice without a ring", () =>
    Effect.gen(function* admitsDiamond() {
      assert.deepStrictEqual(
        yield* entitiesOf(
          '<!DOCTYPE a [<!ENTITY b "x"><!ENTITY c "&b;"><!ENTITY a "&b;&c;&b;">]><a/>',
        ),
        [
          ["b", "x"],
          ["c", "&b;"],
          ["a", "&b;&c;&b;"],
        ],
      );
    }),
  );

  it.effect(
    "are refused when a character reference writes the percent sign of a parameter entity that names itself",
    () =>
      Effect.gen(function* refusesParameterRing() {
        const error = yield* refusalOf('<!DOCTYPE a [<!ENTITY % p "&#37;p;"> %p;]><a/>');

        assert.instanceOf(error, ReaderRefusal);
        assert.strictEqual(error.rule, "entity-cycle");
      }),
  );
});
