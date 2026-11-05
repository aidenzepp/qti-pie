# QTI on grizzle: intent

What was settled before planning, for whoever plans and builds `packages/pantry`. It records intent and constraints, not a
design. Every design decision is still open unless this page says otherwise.

## Why this exists

The goal is to put [grizzle](../vendor/README.md) through a large, real data model and find where it holds up and where
it breaks. The QTI implementation is the vehicle, not the product. A grizzle limit or defect the work runs into is a
result: record it in [grizzle-findings.md](grizzle-findings.md) with the smallest reproduction, so it can go back to
grizzle's author.

So the awkward parts are in scope on purpose. Mapping QTI content (item bodies, response processing) into relations is
part of the test, not a cost to avoid.

## What done looks like

1. **Import.** Real QTI 3.0 content packages, starting with 1EdTech's published examples, load into grizzle relations.
   That includes item bodies and response processing, not only metadata.
2. **Export.** What was imported is written back as QTI 3.0 XML and compared with the original package.

**Out of scope: delivery and scoring** (operator ruling, 2026-10-30). No candidate sessions, attempts or responses, no
attempt-time variable state, no execution of response or template processing, and no results reports. Response
processing, template processing and outcome processing are still modeled tightly as content, because they are part of
every item and test; they are stored and round-tripped, never run.

## Settled

- **Extremely tight data model.** Every rule QTI states becomes a rule PostgreSQL enforces through grizzle, so invalid
  QTI cannot be stored. Many rules exist only in the specification's prose, not in its XML schema, so tight means
  inventorying both. Examples of the bar:
  - identifiers carry the exact pattern QTI's schema allows;
  - `base-type` and `cardinality` are closed sets, and a declaration's default and correct values must match them;
  - an interaction's `response-identifier` names a declared response variable of a fitting type, its correct response
    names choices that exist, and `max-choices` does not exceed the choices;
  - a section cannot select more items than it holds, and every reference resolves.
- **Model everything.** Nothing that is valid QTI 3.0 is refused. QTI is deliberately open in places: item bodies may
  hold HTML, MathML and SSML, `data-*` attributes, portable custom interactions and vendor extensions. Each of those is
  modeled as tightly as the QTI elements themselves, as relations and rules, rather than refused or stored as opaque
  text. Content that is not valid QTI 3.0 is still refused.
- **Local only.** Node on the local grizzle cluster. No Cloudflare, no deploy.
- **Toolchain.** pnpm, Effect `4.1.2`, Vite+, and the lint, format and TypeScript rules carried over from the
  Cloudflare monorepo template. See [AGENTS.md](../AGENTS.md).
- **Location.** `packages/pantry` in this workspace, as `@qti-pie/pantry`.

## Open

- How much an import refuses when content is invalid: the one item, or the whole package.
- Everything about structure: how item body markup becomes rows, how response, template and outcome processing are
  stored as content, how the package splits into grizzle schemas, roles and logins, and the order import and export are
  built in.

## How it gets planned and built

- **No skimping on the model because it is hard.** Every QTI 3.0 structure and every rule, and every structure and rule
  of the languages QTI embeds, maps into grizzle relations and rules. Difficulty is not a reason to store something
  loosely, defer a rule or narrow coverage. Each of these standards is published in detail; read it and model it.
- **Planned as a DAG of thin slices with [shipyard](https://github.com/ianzepp/shipyard).** The scope is large and very
  parallel, so it runs through shipyard's pipeline: `goal-forge` and `goal-check` for the goal, `campaign` to order the
  goals (the QTI core, each embedded language, packaging, import and export), `delivery` for each stage's spec,
  and `slicer` to cut each spec into thin slices with exact write scopes and a dependency graph. `factory` builds the
  slices, in parallel where their write scopes are disjoint. Plans live in files under `docs/goals/` and `docs/campaigns/`, which git ignores, not in chat.
- **Parallel in git worktrees, within the resource budget.** See "Shared machine resources" in
  [AGENTS.md](../AGENTS.md): worktree and database limits, cleanup at every phase boundary, a disk budget, and how
  cluster-wide roles constrain parallel database work. The plan states how it meets each one.

## What grizzle means for the model

From grizzle's README (Limits) and its agent guide, `.agents/skills/grizzle/SKILL.md`:

- No nullable columns: an optional value is a row of its own relation.
- No JSON or XML column type, and every text field carries a regular expression.
- No timestamp type: an instant or a duration is a bigint contract.
- Tables are immutable unless declared `mutable(...)`.
- No outer joins, window functions or raw SQL at run time; queries are grizzle's query language, with recursive
  queries for trees and closed types that carry per-variant data.
- One SERIALIZABLE transaction per call.
- Roles compile to PostgreSQL roles, views and row-level security; a login is the trust boundary.

## Starting point

`packages/pantry/src/smoke/` is a two-table schema with a role, a login and a workload, migrated on the local cluster and
tested end to end. It proves the toolchain and is deleted once real schemas replace it.

## References

- [QTI 3.0 implementation guide](https://www.imsglobal.org/spec/qti/v3p0/impl)
- [QTI 3.0 information model](https://www.imsglobal.org/spec/qti/v3p0/info)
- [QTI 3.0 best practices](https://www.imsglobal.org/spec/qti/v3p0/guide)
