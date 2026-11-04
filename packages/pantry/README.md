# pantry

> *No mystery jars.*
>
> pantry keeps everything labeled: it stores QTI in PostgreSQL and refuses anything it can't name.

Store QTI 3.0 packages in a strict PostgreSQL model, and export them unchanged.

## Read first

[docs/qti-intent.md](../../docs/qti-intent.md) records what was settled before the model was planned.

## Local database

`scripts/db.sh create`, `migrate` and `reset` manage the `gr8des_qti` database. The cluster, ports and passwords are
described in [AGENTS.md](../../AGENTS.md), "Local database".

## CLI

```sh
node src/cli.ts
```

## Dependencies

pantry depends on `@qti-pie/crust` for XML and exports nothing: no other package depends on it.
