#!/usr/bin/env bash
# The QTI package's local database on grizzle's development cluster (grizzle's scripts/pg: pnpm pg:build, pg:init).
#
#   scripts/db.sh create    create the database from grizzle_template, owned by the migration identity
#   scripts/db.sh migrate   grizzle migrate, then give each of this package's logins its local password
#   scripts/db.sh reset     grizzle uninstall where the database exists, then create and migrate
#   scripts/db.sh drop      grizzle uninstall where the database exists, then drop it and the password directory
#   scripts/db.sh check-clear  list the installation's roles (grizzle roles) and the database left on the cluster;
#                              exit 1 if any, 2 if it cannot list them, else 0
#
# The database's name is its installation's role prefix (src/db/connection.ts), so grizzle names every role here.
# GR8DES_PG_DATABASE must match ^[a-z_][a-z0-9_]{0,62}$ (lowercase, at most 63 bytes), or every command exits 2.
# GR8DES_PG_PASSWORD_COMMAND, when set and not empty, names an executable that prints a role's password: every
# connection runs it, without a shell, with the role's name as its one argument, and reads its output, trimmed, as
# src/db/connection.ts does. A run that exits otherwise than 0, whatever it printed, or prints nothing gives no
# password, and the command stops before psql starts. It then replaces the migration identity's password file, and
# migrate gives no login a local password, since every login's comes from the command too. This script runs it before
# psql starts, with no bound; grizzle migrate runs it with GR8DES_PG_PASSWORD_COMMAND_TIMEOUT's.
# GR8DES_GRIZZLE_CONFIG names the grizzle config every grizzle command runs (grizzle.config.ts by default).
set -euo pipefail
cd "$(dirname "$0")/.."

# The GR8DES_PG_* and GRIZZLE_PG_STATE defaults below are read again, with the same values, by `localCluster` in
# src/db/connection.ts; change one, change both. They are exported, so the grizzle config connects where this script
# does. The CA is not: unset or empty, GR8DES_PG_CA stays so, and the config finds the same file in GRIZZLE_PG_STATE,
# so a missing one is reported as the local cluster's.
: "${GRIZZLE_PG_STATE:=$HOME/.local/var/grizzle/pg19rc1}"
: "${GRIZZLE_PG_BIN:=$HOME/.local/opt/postgresql/19rc1/bin}"
: "${GR8DES_PG_HOST:=localhost}"
: "${GR8DES_PG_PORT:=5433}"
: "${GR8DES_PG_DATABASE:=gr8des_qti}"
: "${GR8DES_PG_SECRETS:=$HOME/.local/var/gr8des/$GR8DES_PG_DATABASE}"
: "${GR8DES_PG_MIGRATION_ROLE:=grizzle_dev}"
export GRIZZLE_PG_STATE GR8DES_PG_HOST GR8DES_PG_PORT GR8DES_PG_DATABASE GR8DES_PG_SECRETS GR8DES_PG_MIGRATION_ROLE
config="${GR8DES_GRIZZLE_CONFIG:-grizzle.config.ts}"

if ! [[ $GR8DES_PG_DATABASE =~ ^[a-z_][a-z0-9_]{0,62}$ ]]; then
	echo "GR8DES_PG_DATABASE is '$GR8DES_PG_DATABASE'; use 1 to 63 lowercase letters, digits or underscores, not starting with a digit (create folds an unquoted name to lowercase, but migrate connects as written)." >&2
	exit 2
fi

owner="$GR8DES_PG_MIGRATION_ROLE"
ca="${GR8DES_PG_CA:-$GRIZZLE_PG_STATE/tls/ca.crt}"

# Prints the migration identity's password for one connection: GR8DES_PG_PASSWORD_COMMAND's output for it, trimmed,
# where the command is set, else the password file in the cluster's state folder. Fails, printing nothing, where the
# command exits otherwise than 0 or prints no password. Its callers read it in a command substitution, where errexit
# does not reach, so each checks its status.
owner_password() {
	if [[ -z "${GR8DES_PG_PASSWORD_COMMAND:-}" ]]; then
		cat "$GRIZZLE_PG_STATE/$owner.password"
		return
	fi
	local password status=0
	password="$("$GR8DES_PG_PASSWORD_COMMAND" "$owner")" || status=$?
	if ((status != 0)); then
		echo "The password command $GR8DES_PG_PASSWORD_COMMAND exited with code $status for the role $owner, so the connection has no password. Run it by hand with $owner as its one argument to see why it fails, and sign in if it asks you to; or unset GR8DES_PG_PASSWORD_COMMAND to use the local cluster's passwords." >&2
		return 1
	fi
	password="${password#"${password%%[![:space:]]*}"}"
	password="${password%"${password##*[![:space:]]}"}"
	if [[ -z "$password" ]]; then
		echo "The password command $GR8DES_PG_PASSWORD_COMMAND exited with code 0 for the role $owner but printed no password on standard output. GR8DES_PG_PASSWORD_COMMAND must print the role's password; run it by hand with $owner as its one argument to check that it is signed in." >&2
		return 1
	fi
	printf '%s' "$password"
}

# Usage: as_owner <database> [psql args...]
as_owner() {
	local db=$1
	shift
	local password
	password="$(owner_password)" || return
	PGPASSWORD="$password" "$GRIZZLE_PG_BIN/psql" -X -q -v ON_ERROR_STOP=1 -At \
		"host=$GR8DES_PG_HOST port=$GR8DES_PG_PORT dbname=$db user=$owner sslmode=verify-full sslrootcert=$ca" "$@"
}

# The installation's roles, comma-joined for an array literal: '{<roles>}'. grizzle roles connects as the migration
# identity, so it runs through as_migration.
installation_roles() {
	as_migration roles | paste -sd , -
}

# Exits 1 where the database is missing; stops the script where the cluster cannot be read.
exists() {
	local found
	found="$(as_owner postgres -c "SELECT 1 FROM pg_database WHERE datname = '$GR8DES_PG_DATABASE'")" || exit
	[[ -n "$found" ]]
}

# Usage: as_migration migrate|roles|uninstall. Only this is given the migration identity's password, unless
# GR8DES_PG_PASSWORD_COMMAND gives every role its own.
as_migration() {
	if [[ -n "${GR8DES_PG_PASSWORD_COMMAND:-}" ]]; then
		pnpm exec grizzle "$1" "$config"
		return
	fi
	local password
	password="$(owner_password)"
	GR8DES_PG_MIGRATION_PASSWORD="$password" pnpm exec grizzle "$1" "$config"
}

create() {
	if exists; then
		echo "$GR8DES_PG_DATABASE: exists"
		return
	fi
	as_owner postgres -c "CREATE DATABASE $GR8DES_PG_DATABASE OWNER $owner TEMPLATE grizzle_template"
	echo "$GR8DES_PG_DATABASE: created"
}

# grizzle reads no environment variable for where to connect: the config's connection (src/db/connection.ts) reads
# the settings exported above. A password command gives every login its password, so no login gets a local one.
migrate() {
	as_migration migrate
	[[ -z "${GR8DES_PG_PASSWORD_COMMAND:-}" ]] || return 0
	mkdir -p "$GR8DES_PG_SECRETS"
	chmod 700 "$GR8DES_PG_SECRETS"
	local roles logins login file
	roles="$(installation_roles)"
	logins="$(as_owner postgres -c "SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname = ANY ('{$roles}')")"
	for login in $logins; do
		file="$GR8DES_PG_SECRETS/$login.password"
		[[ -f "$file" ]] || (umask 077 && openssl rand -hex 24 > "$file")
		as_owner postgres -c "ALTER ROLE $login PASSWORD '$(cat "$file")'"
		echo "$login: password in $file"
	done
}

drop() {
	! exists || as_migration uninstall
	as_owner postgres -c "DROP DATABASE IF EXISTS $GR8DES_PG_DATABASE WITH (FORCE)"
	rm -rf "$GR8DES_PG_SECRETS"
}

# Keeps the password files, which migrate sets on the new login roles.
reset() {
	! exists || as_migration uninstall
	create
	migrate
}

# Prints each leftover as "role: <name>" or "database: <name>"; exits 1 if any were found.
check_clear() {
	local roles found
	roles="$(installation_roles)" || return 2
	found="$(as_owner postgres -c "SELECT 'role: ' || rolname FROM pg_roles WHERE rolname = ANY ('{$roles}')
		UNION ALL SELECT 'database: ' || datname FROM pg_database WHERE datname = '$GR8DES_PG_DATABASE' ORDER BY 1")" || return 2
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
