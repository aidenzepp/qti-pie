/**
 * The arm of the `template` handle (`TemplateDType`, the HTML `template` element, admitted only
 * inside `qti-interaction-markup`; spec unit V05).
 *
 * The arm carries no payload. The first milestone seeds no `Admission` row naming `template`, so
 * no node of that kind is imported or stored; the second milestone's M2e gives the arm its fields.
 *
 * It exists because grizzle compiles the `Node` alternatives only when every `NodeKind` handle has
 * an arm: at this size, one unarmed handle grows the `alternatives` law past what the printer can
 * emit, and `grizzle check` ends in a stack overflow (findings row 27). The arm's containment into
 * `Node` is expanded by `alternatives` in the composed schema, not written here.
 */
import { relation, uuid } from "@bjornpagen/grizzle";

/**
 * A `template` element, identified by its node.
 */
export const Template = relation("Template", { id: uuid }, ["id"]);

/**
 * The relations this module declares.
 */
export const relations = { Template } as const;

/**
 * The `NodeKind` handle this module arms.
 */
export const arms = { template: Template } as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;
