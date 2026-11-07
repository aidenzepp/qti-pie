import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { lexProlog, substitute } from "#crust/dtd.ts";
import type { AttlistEntry, ValuePiece } from "#crust/dtd.ts";
import { ReaderRefusal, WellFormednessError } from "#crust/errors.ts";

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

/**
 * A default value of one text piece.
 *
 * @param value - The text.
 * @returns The pieces.
 */
const textDefault = (value: string): readonly ValuePiece[] => [{ kind: "text", text: value }];

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
      assert.deepStrictEqual(prolog.undeclared, {
        _tag: "refused",
        why: "the document has no external subset and its internal subset references no parameter entity",
      });
    }),
  );

  it.effect(
    "leaves an absent field as None and refuses undeclared entities under standalone yes",
    () =>
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
        assert.deepStrictEqual(prolog.undeclared, {
          _tag: "refused",
          why: 'the document says standalone="yes"',
        });
      }),
  );

  it.effect("is absent for a document that starts with another processing instruction", () =>
    Effect.gen(function* readsNoDeclaration() {
      const prolog = yield* lexProlog('<?xml-stylesheet href="s.css"?><a/>');

      assert.isTrue(Option.isNone(prolog.declaration));
      assert.strictEqual(prolog.undeclared._tag, "refused");
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
      assert.deepStrictEqual(prolog.undeclared, { _tag: "kept" });
    }),
  );

  it.effect(
    "keeps undeclared entities under a PUBLIC identifier, refuses them under a bare name, and refuses them under standalone yes with an external subset",
    () =>
      Effect.gen(function* readsExternalIds() {
        const pub = yield* lexProlog('<!DOCTYPE a PUBLIC "-//X//EN" "x.dtd"><a/>');
        const bare = yield* lexProlog("<!DOCTYPE a [<!ENTITY e 'v'>]><a/>");
        const standalone = yield* lexProlog(
          '<?xml version="1.0" standalone="yes"?><!DOCTYPE a SYSTEM "a.dtd"><a/>',
        );

        assert.deepStrictEqual(pub.undeclared, { _tag: "kept" });
        assert.strictEqual(bare.undeclared._tag, "refused");
        assert.strictEqual(standalone.undeclared._tag, "refused");
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
        assert.strictEqual(prolog.undeclared._tag, "refused");
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

  it.effect("are refused when a value references a parameter entity the subset declared", () =>
    Effect.gen(function* refusesParameterReferences() {
      const error = yield* refusalOf('<!DOCTYPE a [<!ENTITY % p "x"><!ENTITY e "%p;y">]><a/>');

      assert.instanceOf(error, WellFormednessError);
      assert.strictEqual(error.line, 1);
      assert.strictEqual(error.column, 43);
      assert.isFalse(error.afterSubstitution);
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

/**
 * The table of `a` after `declarations` and a list whose default `d` names the entity `e`.
 */
const defaultOf = (declarations: string) =>
  attlistOf(`<!DOCTYPE a [${declarations}<!ATTLIST a d CDATA "1&e;2">]><a/>`, "a");

describe("attribute-list declarations", () => {
  it.effect("table each attribute's type and default", () =>
    Effect.gen(function* tablesAttributes() {
      const table = yield* attlistOf(
        '<!DOCTYPE a [<!ATTLIST a x CDATA #FIXED "v" y CDATA "d" z CDATA #REQUIRED w CDATA #IMPLIED>]><a/>',
        "a",
      );

      assert.deepStrictEqual(table, [
        ["x", { default: Option.some(textDefault("v")), type: "CDATA" }],
        ["y", { default: Option.some(textDefault("d")), type: "CDATA" }],
        ["z", { default: Option.none(), type: "CDATA" }],
        ["w", { default: Option.none(), type: "CDATA" }],
      ]);
    }),
  );

  it.effect("expand the general entities declared before the list in a default", () =>
    Effect.gen(function* expandsEntities() {
      assert.deepStrictEqual(yield* defaultOf('<!ENTITY e "x&#9;y">'), [
        ["d", { default: Option.some(textDefault("1x y2")), type: "CDATA" }],
      ]);
      assert.deepStrictEqual(yield* defaultOf('<!ENTITY f "q"><!ENTITY e "x&f;y">'), [
        ["d", { default: Option.some(textDefault("1xqy2")), type: "CDATA" }],
      ]);
      assert.deepStrictEqual(yield* defaultOf('<!ENTITY e "x&lt;y">'), [
        ["d", { default: Option.some(textDefault("1x<y2")), type: "CDATA" }],
      ]);
    }),
  );

  it.effect("refuse a default whose entity's replacement text holds a less-than sign", () =>
    Effect.gen(function* refusesLessThan() {
      const error = yield* refusalOf(
        '<!DOCTYPE a [<!ENTITY e "x&#60;y"><!ATTLIST a d CDATA "1&e;2">]><a/>',
      );

      assert.instanceOf(error, WellFormednessError);
    }),
  );

  it.effect(
    "keep an entity the internal subset never declares as a reference piece where an external subset may declare it",
    () =>
      Effect.gen(function* keepsUndeclaredEntity() {
        const table = yield* attlistOf(
          '<!DOCTYPE a SYSTEM "a.dtd" [<!ATTLIST a d CDATA "1&u;2">]><a/>',
          "a",
        );

        assert.deepStrictEqual(table, [
          [
            "d",
            {
              default: Option.some<readonly ValuePiece[]>([
                { kind: "text", text: "1" },
                { kind: "reference", name: "u" },
                { kind: "text", text: "2" },
              ]),
              type: "CDATA",
            },
          ],
        ]);
      }),
  );

  it.effect(
    "refuse an entity a default names before the internal subset declares it, beside an external subset too",
    () =>
      Effect.gen(function* refusesEarlyReference() {
        for (const declaration of ['<!ENTITY e "x">', '<!ENTITY e SYSTEM "e.ent">']) {
          const error = yield* refusalOf(
            `<!DOCTYPE a SYSTEM "a.dtd" [<!ATTLIST a d CDATA "1&e;2">${declaration}]><a/>`,
          );

          assert.instanceOf(error, ReaderRefusal);
          assert.include(
            error._tag === "ReaderRefusal" ? `${error.rule}: ${error.detail}` : "",
            'undeclared-entity: the entity "e" is referenced in the default of attribute "d" of element "a" before the internal subset declares it',
            declaration,
          );
        }
      }),
  );

  it.effect(
    "refuse an entity a default names before any declaration of it, in a document with no external subset",
    () =>
      Effect.gen(function* refusesLaterEntity() {
        const error = yield* refusalOf(
          '<!DOCTYPE a [<!ATTLIST a d CDATA "1&e;2"><!ENTITY e "x">]><a/>',
        );

        assert.instanceOf(error, ReaderRefusal);
        assert.strictEqual(error._tag === "ReaderRefusal" && error.rule, "undeclared-entity");
        assert.include(
          error._tag === "ReaderRefusal" ? error.detail : "",
          'the entity "e" is referenced in the default of attribute "d" of element "a" before the internal subset declares it, so the document is not well-formed',
        );
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
        ["n", { default: Option.some(textDefault(" p  q ")), type: "NMTOKENS" }],
        ["k", { default: Option.some(textDefault("p")), type: "( p | q )" }],
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
          ["x", { default: Option.some(textDefault("a&b€\nc d e")), type: "CDATA" }],
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
        ["x", { default: Option.some(textDefault("1")), type: "CDATA" }],
        ["y", { default: Option.some(textDefault("3")), type: "CDATA" }],
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

/**
 * Lex `text` and return its body with the declared entities substituted.
 */
const substituted = (text: string) =>
  Effect.gen(function* substitutesText() {
    return yield* substitute(text, yield* lexProlog(text));
  });

describe("substituting entities", () => {
  it.effect("puts the replacement text of a content reference into the body as markup", () =>
    Effect.gen(function* substitutesContent() {
      const { body } = yield* substituted('<!DOCTYPE a [<!ENTITY m "<b>x</b>">]><a>1&m;2</a>');

      assert.strictEqual(body, '<!DOCTYPE a [<!ENTITY m "<b>x</b>">]><a>1<b>x</b>2</a>');
    }),
  );

  it.effect("rescans the replacement text for further references", () =>
    Effect.gen(function* rescans() {
      const { body } = yield* substituted(
        '<!DOCTYPE a [<!ENTITY x "1"><!ENTITY y "&x;&x;"><!ENTITY z "[&y;]">]><a>&z;</a>',
      );

      assert.isTrue(body.endsWith("<a>[11]</a>"));
    }),
  );

  it.effect("substitutes a line feed of the replacement text into an attribute literal", () =>
    Effect.gen(function* substitutesLineFeed() {
      const { body } = yield* substituted('<!DOCTYPE a [<!ENTITY n "p&#10;q">]><a t="&n;"/>');

      assert.isTrue(body.endsWith('<a t="p\nq"/>'));
    }),
  );

  it.effect("writes a quote of the replacement text in an attribute literal as a reference", () =>
    Effect.gen(function* substitutesQuote() {
      const { body } = yield* substituted(
        "<!DOCTYPE a [<!ENTITY q 'say \"hi\" it&#39;s'>]><a t=\"&q;\" u='&q;'/>",
      );

      assert.isTrue(
        body.endsWith("<a t=\"say &#34;hi&#34; it&#39;s\" u='say &#34;hi&#34; it&#39;s'/>"),
      );
    }),
  );

  it.effect("leaves a character reference the document wrote as written in an attribute", () =>
    Effect.gen(function* keepsCharacterReference() {
      const { body } = yield* substituted('<!DOCTYPE a [<!ENTITY n "x">]><a t="&#10;&n;"/>');

      assert.isTrue(body.endsWith('<a t="&#10;x"/>'));
    }),
  );

  it.effect("leaves a '<' of replacement text in an attribute for the parser to refuse", () =>
    Effect.gen(function* keepsAngle() {
      const { body } = yield* substituted('<!DOCTYPE a [<!ENTITY l "<">]><a t="&l;"/>');

      assert.isTrue(body.endsWith('<a t="<"/>'));
    }),
  );

  it.effect("expands a reference nested in the replacement text of an attribute reference", () =>
    Effect.gen(function* nestsInAttribute() {
      const { body } = yield* substituted(
        '<!DOCTYPE a [<!ENTITY x "\'"><!ENTITY y "[&x;]">]><a t="&y;"/>',
      );

      assert.isTrue(body.endsWith('<a t="[&#39;]"/>'));
    }),
  );

  it.effect("leaves references inside a comment, a PI and a CDATA section untouched", () =>
    Effect.gen(function* skipsHidden() {
      const text = '<!DOCTYPE a [<!ENTITY m "X">]><a><!-- &m; --><?t &m;?><![CDATA[&m;]]>&m;</a>';
      const { body } = yield* substituted(text);

      assert.isTrue(body.endsWith("<a><!-- &m; --><?t &m;?><![CDATA[&m;]]>X</a>"));
    }),
  );

  it.effect("keeps the prolog verbatim so offsets into the body are offsets into the text", () =>
    Effect.gen(function* keepsProlog() {
      const text = '<?xml version="1.0"?>\n<!DOCTYPE a [<!ENTITY m "X">]>\n<a>&m;</a>';
      const prolog = yield* lexProlog(text);
      const { body } = yield* substitute(text, prolog);

      assert.strictEqual(body.slice(0, prolog.bodyStart), text.slice(0, prolog.bodyStart));
    }),
  );

  it.effect("reports a substitution only after the first one", () =>
    Effect.gen(function* reportsAfter() {
      const text = '<!DOCTYPE a [<!ENTITY m "XYZ">]><a><b/>&m;<c/></a>';
      const { afterSubstitution, body } = yield* substituted(text);
      const reference = body.lastIndexOf("XYZ");

      assert.isFalse(afterSubstitution(0));
      assert.isFalse(afterSubstitution(reference));
      assert.isTrue(afterSubstitution(reference + 1));
      assert.isTrue(afterSubstitution(body.length));
    }),
  );

  it.effect("reports after an empty replacement from the offset the reference stood at", () =>
    Effect.gen(function* reportsEmpty() {
      const { afterSubstitution, body } = yield* substituted(
        '<!DOCTYPE a [<!ENTITY e "">]><a>&e;<b/></a>',
      );
      const next = body.indexOf("<b/>");

      assert.isFalse(afterSubstitution(next - 1));
      assert.isTrue(afterSubstitution(next));
    }),
  );
});

/**
 * A subset that declares `p0` as `base` and `p<n>` as `copies` references to `p<n-1>` for `n` 1 to
 * `top`, then uses `%p<top>;` between declarations.
 */
const parameterChain = (base: string, copies: number, top: number) => {
  let subset = `<!ENTITY % p0 "${base}">`;
  for (let n = 1; n <= top; n += 1) {
    subset += `<!ENTITY % p${n} "${`&#37;p${n - 1};`.repeat(copies)}">`;
  }

  return `<!DOCTYPE a [${subset}%p${top};]><a/>`;
};

describe("the expansion budget", () => {
  it.effect("admits parameter entities opened 20 deep", () =>
    Effect.gen(function* admitsTwentyDeep() {
      const prolog = yield* lexProlog(parameterChain("<!-- c -->", 1, 19));

      assert.isAbove(prolog.expanded, 0);
    }),
  );

  it.effect("refuses parameter entities opened 21 deep", () =>
    Effect.gen(function* refusesTwentyOneDeep() {
      const error = yield* refusalOf(parameterChain("<!-- c -->", 1, 20));

      assert.instanceOf(error, ReaderRefusal);
      assert.strictEqual(error.rule, "entity-expansion");
      assert.include(error.detail, "p0");
    }),
  );

  it.effect("refuses parameter entities that expand past the limit", () =>
    Effect.gen(function* refusesAmplification() {
      const error = yield* refusalOf(parameterChain(`<!--${"c".repeat(1996)}-->`, 10, 3));

      assert.instanceOf(error, ReaderRefusal);
      assert.strictEqual(error.rule, "entity-expansion");
    }),
  );

  it.effect("admits the same chain with a small base", () =>
    Effect.gen(function* admitsSmallChain() {
      const prolog = yield* lexProlog(parameterChain("<!-- c -->", 10, 3));

      assert.isAbove(prolog.expanded, 0);
      assert.isBelow(prolog.expanded, 1_000_000);
    }),
  );

  it.effect("tables a chain of 20,000 general entities without refusing it", () =>
    Effect.gen(function* tablesLongChain() {
      // Declared from the outermost entity inward, so the search descends the whole chain at once.
      let subset = "";
      for (let n = 20_000; n >= 1; n -= 1) {
        subset += `<!ENTITY e${n} "&e${n - 1};">`;
      }
      subset += '<!ENTITY e0 "x">';
      const prolog = yield* lexProlog(`<!DOCTYPE a [${subset}]><a/>`);

      assert.strictEqual(prolog.entities.size, 20_001);
    }),
  );

  it.effect("refuses a body reference to general entities nested 21 deep", () =>
    Effect.gen(function* refusesDeepBody() {
      let subset = '<!ENTITY e0 "x">';
      for (let n = 1; n <= 20; n += 1) {
        subset += `<!ENTITY e${n} "&e${n - 1};">`;
      }
      const text = `<!DOCTYPE a [${subset}]><a>&e20;</a>`;
      const error = yield* Effect.flip(
        lexProlog(text).pipe(Effect.flatMap((p) => substitute(text, p))),
      );

      assert.instanceOf(error, ReaderRefusal);
      assert.strictEqual(error.rule, "entity-expansion");
    }),
  );

  it.effect("admits a body reference to general entities nested 20 deep", () =>
    Effect.gen(function* admitsTwentyBody() {
      let subset = '<!ENTITY e0 "x">';
      for (let n = 1; n <= 19; n += 1) {
        subset += `<!ENTITY e${n} "&e${n - 1};">`;
      }
      const text = `<!DOCTYPE a [${subset}]><a>&e19;</a>`;
      const { body } = yield* lexProlog(text).pipe(Effect.flatMap((p) => substitute(text, p)));

      assert.isTrue(body.endsWith("<a>x</a>"));
    }),
  );

  it.effect("refuses a body whose references expand past the limit", () =>
    Effect.gen(function* refusesBodyAmplification() {
      const text = `<!DOCTYPE a [<!ENTITY e0 "${"x".repeat(1000)}"><!ENTITY e1 "${"&e0;".repeat(10)}"><!ENTITY e2 "${"&e1;".repeat(10)}"><!ENTITY e3 "${"&e2;".repeat(10)}">]><a>&e3;</a>`;
      const error = yield* Effect.flip(
        lexProlog(text).pipe(Effect.flatMap((p) => substitute(text, p))),
      );

      assert.instanceOf(error, ReaderRefusal);
      assert.strictEqual(error.rule, "entity-expansion");
    }),
  );
});
