#!/usr/bin/env bash
# Fetch the public caches plate's unit tests read, into $HOME/.cache/gr8des (or the directory the first argument
# names). Idempotent: a file already present with the right hash is not fetched again. Run from the repository
# root on Linux or macOS. It writes nothing into the repository and fetches nothing from 1EdTech's member area.
# It prints one line per cache: fetched, present or skipped.
set -euo pipefail

C="${1:-$HOME/.cache/gr8des}"
layout="packages/plate/src/test/xsd-layout.ts"
[ -f "$layout" ] || { echo "run from the repository root: $layout not found" >&2; exit 1; }

sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }

# fetch <url> <path> [sha256]: prints "fetched" or "present" on stdout; fails when the hash differs.
fetch() {
  local url="$1" dest="$2" want="${3:-}"
  if [ -s "$dest" ] && { [ -z "$want" ] || [ "$(sha256 "$dest")" = "$want" ]; }; then echo present; return 0; fi
  mkdir -p "$(dirname "$dest")"
  curl -fsSL --retry 3 -o "$dest.part" "$url"
  if [ -n "$want" ] && [ "$(sha256 "$dest.part")" != "$want" ]; then
    rm -f "$dest.part"; echo "hash mismatch for $url" >&2; return 1
  fi
  mv "$dest.part" "$dest"; echo fetched
}

# status <name> <result...>: one line, fetched when any file was fetched.
summarize() { if printf '%s\n' "$@" | grep -qx fetched; then echo fetched; else echo present; fi; }

# 1. The 1EdTech QTI 3 examples at commit 0a92fbb, each nested zip extracted into <zip>.d/ beside it.
D="$C/qti3-examples"
X="$D/qti-examples-0a92fbbb6d2e620a1f7fad19977be4c418246bc0"
T="$D/qti-examples-0a92fbb.tar.gz"
if [ -d "$X" ] && [ -z "$(find "$X" -name '*.zip' ! -exec test -d '{}.d' ';' -print -quit)" ]; then
  echo "corpus: present"
else
  mkdir -p "$D"
  [ -s "$T" ] || curl -fsSL --retry 3 -o "$T" "https://codeload.github.com/1EdTech/qti-examples/tar.gz/0a92fbbb6d2e620a1f7fad19977be4c418246bc0"
  tar -xzf "$T" -C "$D"
  find "$X" -name '*.zip' -exec sh -c 'unzip -q -n "$1" -d "$1.d"' _ {} \;
  echo "corpus: fetched"
fi

# 2. The XSDs, each at its path with its SHA-256, read from the table's own module so the list never drifts.
list="$(node --input-type=module -e '
const m = await import("./packages/plate/src/test/xsd-layout.ts");
for (const p of m.xsdPaths) {
  const x = m.cachedXsds[p];
  if (!x?.url || !x?.sha256) { console.error(`no url or sha256 for ${p}`); process.exit(1); }
  console.log(p, x.sha256, x.url);
}')"
results=()
count=0
while read -r p sha url; do
  results+=("$(fetch "$url" "$C/qti3/xsd/$p" "$sha")")
  count=$((count + 1))
  [ -s "$C/qti3/xsd/$p" ] || { echo "missing after fetch: $C/qti3/xsd/$p" >&2; exit 1; }
done <<<"$list"
[ "$count" -gt 0 ] || { echo "read no XSDs from $layout" >&2; exit 1; }
# The PNP reader's XSD is not in the table and has no pinned hash.
results+=("$(fetch "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_afa3p0pnp_v1p0.xsd" "$C/qti3/xsd/imsqtiv3p0_afa3p0pnp_v1p0.xsd")")
echo "xsd ($count listed + 1 PNP, all present): $(summarize "${results[@]}")"

# 3. The six response-processing templates.
results=()
for n in match_correct map_response map_response_point CC2_match CC2_match_basic CC2_map_response; do
  results+=("$(fetch "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/$n.xml" "$C/qti3/rptemplates/$n.xml")")
done
echo "rptemplates (6 files): $(summarize "${results[@]}")"

# 4. web-features 3.45.0's data.json, and XML Schema Part 2.
echo "web-features: $(fetch "https://unpkg.com/web-features@3.45.0/data.json" "$C/renderer-research/web/web-features-data.json" bcda8f1fd702fd2c7cc71779d35430022cf57b56dcd9415f3bb8ee14486eb3b4)"
echo "xsd-datatypes: $(fetch "https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/" "$C/w3c/xmlschema-2-20041028.html" 980de872aa2c50013d5202176eb85eef3f183a7df635fdcb6b4aa34c1c12eb72)"

# 5. The conformance text is member-only and not reproducible here.
echo "conformance-text: skipped (conf.txt is not fetched; its 3 tagged tests skip)"
