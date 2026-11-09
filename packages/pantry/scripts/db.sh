#!/usr/bin/env bash
# The QTI package's local database on grizzle's development cluster (grizzle's scripts/pg: pnpm pg:build, pg:init).
#
#   scripts/db.sh create    create the database from grizzle_template, owned by the migration identity
#   scripts/db.sh migrate   grizzle migrate, then give each of this package's logins its local password
#   scripts/db.sh reset     drop, then create and migrate again
#   scripts/db.sh drop      drop the database, the PostgreSQL roles the config installs and the password directory
#   scripts/db.sh check-clear  list the config's roles left on the cluster and gr8des_qti databases other than this
#                              one; exit 1 if any, else 0
#
# Roles are cluster-wide, so drop removes the config's roles along with the database. Each role is named by grizzle's
# roleNameOf over the config's logins and their roles, the installer's own naming, which names a login by the level of
# the installation it is over: one name per role the config installs, never a pattern over a schema's name. A role an
# earlier installation made for a login the config no longer names (one renamed or removed while the migrations were
# regenerated from zero) is not found: grizzle lists no installation's roles on the cluster.
# GR8DES_PG_DATABASE must match ^[a-z_][a-z0-9_]{0,62}$ (lowercase, at most 63 bytes), or every command exits 2.
# GR8DES_PG_PASSWORD_COMMAND, when set and not empty, names an executable that prints a role's password: every
# connection runs it, without a shell, with the role's name as its one argument, and reads its output, trimmed, as
# src/db/connection.ts does. It then replaces the migration identity's password file, and migrate gives no login a local
# password, since every login's comes from the command too.
# GR8DES_GRIZZLE_CONFIG names the grizzle config migrate runs (grizzle.config.ts by default), whose logins name every
# role the other commands find.
set -euo pipefail
cd "$(dirname "$0")/.."

# The GR8DES_PG_* and GRIZZLE_PG_STATE defaults below are read again, with the same values, by `localCluster` in
# src/db/connection.ts; change one, change both. They are exported, so the grizzle config connects where this script
# does.
: "${GRIZZLE_PG_STATE:=$HOME/.local/var/grizzle/pg19rc1}"
: "${GRIZZLE_PG_BIN:=$HOME/.local/opt/postgresql/19rc1/bin}"
: "${GR8DES_PG_HOST:=localhost}"
: "${GR8DES_PG_PORT:=5433}"
: "${GR8DES_PG_DATABASE:=gr8des_qti}"
: "${GR8DES_PG_SECRETS:=$HOME/.local/var/gr8des/$GR8DES_PG_DATABASE}"
: "${GR8DES_PG_CA:=$GRIZZLE_PG_STATE/tls/ca.crt}"
: "${GR8DES_PG_MIGRATION_ROLE:=grizzle_dev}"
export GRIZZLE_PG_STATE GR8DES_PG_HOST GR8DES_PG_PORT GR8DES_PG_DATABASE GR8DES_PG_SECRETS GR8DES_PG_CA GR8DES_PG_MIGRATION_ROLE
config="${GR8DES_GRIZZLE_CONFIG:-grizzle.config.ts}"

if ! [[ $GR8DES_PG_DATABASE =~ ^[a-z_][a-z0-9_]{0,62}$ ]]; then
	echo "GR8DES_PG_DATABASE is '$GR8DES_PG_DATABASE'; use 1 to 63 lowercase letters, digits or underscores, not starting with a digit (create folds an unquoted name to lowercase, but migrate connects as written)." >&2
	exit 2
fi

owner="$GR8DES_PG_MIGRATION_ROLE"
ca="$GR8DES_PG_CA"

# Prints the migration identity's password for one connection: GR8DES_PG_PASSWORD_COMMAND's output for it, trimmed,
# where the command is set, else the password file in the cluster's state folder.
owner_password() {
	if [[ -z "${GR8DES_PG_PASSWORD_COMMAND:-}" ]]; then
		cat "$GRIZZLE_PG_STATE/$owner.password"
		return
	fi
	local password
	password="$("$GR8DES_PG_PASSWORD_COMMAND" "$owner")"
	password="${password#"${password%%[![:space:]]*}"}"
	password="${password%"${password##*[![:space:]]}"}"
	if [[ -z "$password" ]]; then
		echo "GR8DES_PG_PASSWORD_COMMAND printed no password for $owner; run it by hand with $owner as its one argument to see why." >&2
		return 1
	fi
	printf '%s' "$password"
}

# Usage: as_owner <database> [psql args...]
as_owner() {
	local db=$1
	shift
	local password
	password="$(owner_password)"
	PGPASSWORD="$password" "$GRIZZLE_PG_BIN/psql" -X -q -v ON_ERROR_STOP=1 -At \
		"host=$GR8DES_PG_HOST port=$GR8DES_PG_PORT dbname=$db user=$owner sslmode=verify-full sslrootcert=$ca" "$@"
}

# Prints the PostgreSQL role of each login the config installs, one per line, and with "all" each role a login reaches
# as well: the names grizzle's roleNameOf gives them, read from the config's own logins, as `grizzle migrate` reads
# them. Loading the config reads the cluster's CA and connects nowhere.
# Usage: installed_roles logins|all
installed_roles() {
	node --input-type=module -e '
		import { pathToFileURL } from "node:url";
		import { roleNameOf } from "@bjornpagen/grizzle";
		const [file, which] = process.argv.slice(1);
		const { default: config } = await import(pathToFileURL(file).href);
		for (const login of config.logins) {
			console.log(roleNameOf(login));
			if (which === "all") {
				for (const { role } of Object.values(login.roles)) {
					console.log(roleNameOf(role));
				}
			}
		}
	' "$(realpath "$config")" "$1"
}

create() {
	if [[ -n "$(as_owner postgres -c "SELECT 1 FROM pg_database WHERE datname = '$GR8DES_PG_DATABASE'")" ]]; then
		echo "$GR8DES_PG_DATABASE: exists"
		return
	fi
	as_owner postgres -c "CREATE DATABASE $GR8DES_PG_DATABASE OWNER $owner TEMPLATE grizzle_template"
	echo "$GR8DES_PG_DATABASE: created"
}

# grizzle reads no environment variable for where to connect: the config's connection (src/db/connection.ts) reads
# the settings exported above and the migration identity's password, which only this command is given, or runs
# GR8DES_PG_PASSWORD_COMMAND for it, which also gives every login its password, so no login gets a local one.
migrate() {
	if [[ -n "${GR8DES_PG_PASSWORD_COMMAND:-}" ]]; then
		pnpm exec grizzle migrate "$config"
		return
	fi
	local password
	password="$(owner_password)"
	GR8DES_PG_MIGRATION_PASSWORD="$password" pnpm exec grizzle migrate "$config"
	mkdir -p "$GR8DES_PG_SECRETS"
	chmod 700 "$GR8DES_PG_SECRETS"
	local logins login file
	logins="$(installed_roles logins)"
	for login in $logins; do
		file="$GR8DES_PG_SECRETS/$login.password"
		[[ -f "$file" ]] || (umask 077 && openssl rand -hex 24 > "$file")
		as_owner postgres -c "ALTER ROLE $login PASSWORD '$(cat "$file")'"
		echo "$login: password in $file"
	done
}

drop() {
	local roles role
	roles="$(installed_roles all)"
	as_owner postgres -c "DROP DATABASE IF EXISTS $GR8DES_PG_DATABASE WITH (FORCE)"
	for role in $roles; do
		as_owner postgres -c "DROP ROLE IF EXISTS $role"
	done
	rm -rf "$GR8DES_PG_SECRETS"
}

reset() {
	drop
	create
	migrate
}

# Prints each leftover as "role: <name>" or "database: <name>"; exits 1 if any were found.
check_clear() {
	local roles role names=""
	roles="$(installed_roles all)"
	for role in $roles; do
		names="${names:+$names, }'$role'"
	done
	local found
	found="$(
		as_owner postgres -c "SELECT 'role: ' || rolname FROM pg_roles WHERE rolname IN ($names) ORDER BY rolname"
		as_owner postgres -c "SELECT 'database: ' || datname FROM pg_database WHERE datname LIKE 'gr8des_qti%' AND datname <> '$GR8DES_PG_DATABASE' ORDER BY datname"
	)"
	if [[ -n "$found" ]]; then
		echo "$found"
		return 1
	fi
}

case "${1:-}" in
	create) create ;;
	migrate) migrate ;;
	reset) reset ;;
	drop) drop ;;
	check-clear) check_clear ;;
	*)
		echo "usage: scripts/db.sh create|migrate|reset|drop|check-clear" >&2
		exit 2
		;;
esac
