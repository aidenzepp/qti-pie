/**
 * The statements that bind the prefixed variable references of a test to the test's own modules.
 *
 * The prefixed arms (`ItemVariableRef`, `ItemInstanceVariableRef` and `SectionDurationRef`), the
 * hub `PrefixedVariableSource` and `SectionDurationTarget` are declared in
 * `#pantry/schema/processing.ts`. The statements here name those relations together with the
 * relations of the document, reference and test modules: an arm's document is a test document, a
 * hub row's test is a test document's, its item reference is one of that test's and has an item
 * document, a mapped source is a variable mapping of its item reference, and a section duration
 * target names a part or a section of its test. The test modules import `processing.ts`, so these
 * statements cannot live in it without a cycle. This module declares no relation.
 */
import { contained, on, select } from "@bjornpagen/grizzle";
import { Document } from "#pantry/schema/document.ts";
import {
  ItemInstanceVariableRef,
  ItemVariableRef,
  PrefixedMapped,
  PrefixedVariableSource,
  SectionDurationRef,
  SectionDurationTarget,
  SectionVariableRef,
  SectionVariableResolution,
} from "#pantry/schema/processing.ts";
import { ItemRefDocument } from "#pantry/schema/reference.ts";
import { VariableMapping } from "#pantry/schema/test/rules.ts";
import { TestDocument, TestReach } from "#pantry/schema/test/structure.ts";

/**
 * The statements over the prefixed arms, the hub, `SectionDurationTarget`, `SectionVariableRef` and
 * `SectionVariableResolution` that name another module's relations: each prefixed arm's root is a
 * document; the hub's test is a test document's, and its prefix is an item reference of that test,
 * which has an item document and, for a mapped source, a variable mapping; a section duration
 * target's test is a test document's and its prefix names a part or a section of it.
 */
export const rules = [
  contained(on(ItemVariableRef, "document", "root"), on(Document, "id", "root")),
  contained(on(ItemInstanceVariableRef, "document", "root"), on(Document, "id", "root")),
  contained(on(SectionDurationRef, "document", "root"), on(Document, "id", "root")),
  contained(on(SectionVariableRef, "document", "root"), on(Document, "id", "root")),
  contained(on(PrefixedVariableSource, "test", "document"), on(TestDocument, "test", "document")),
  contained(
    on(PrefixedVariableSource, "test", "prefix", "itemRef"),
    on(select(TestReach, { holderKind: "itemRef" }), "test", "identifier", "holder"),
  ),
  contained(
    on(PrefixedVariableSource, "itemRef", "itemDocument"),
    on(ItemRefDocument, "itemRef", "document"),
  ),
  contained(on(PrefixedMapped, "itemRef", "variable"), on(VariableMapping, "itemRef", "target")),
  contained(on(SectionDurationTarget, "test", "document"), on(TestDocument, "test", "document")),
  contained(
    on(SectionDurationTarget, "test", "prefix", "holder", "holderKind"),
    on(TestReach, "test", "identifier", "holder", "holderKind"),
  ),
  contained(
    on(SectionVariableResolution, "test", "document"),
    on(TestDocument, "test", "document"),
  ),
] as const;
