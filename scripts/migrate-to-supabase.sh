#!/usr/bin/env bash
set -euo pipefail

# Requires VPS_PG_URL and SUPABASE_DB_URL env vars.
# VPS_PG_URL example:   postgres://user:pw@vps.tail.../finanzas
# SUPABASE_DB_URL:      postgres://postgres.<ref>:<pw>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

: "${VPS_PG_URL:?Set VPS_PG_URL}"
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"

OUTDIR=$(mktemp -d)
echo "Working dir: $OUTDIR"

echo "→ Dumping schema..."
pg_dump --schema-only --no-owner --no-privileges \
  --schema=public \
  "$VPS_PG_URL" > "$OUTDIR/schema.sql"

echo "→ Dumping data..."
pg_dump --data-only --inserts --no-owner --no-privileges \
  --schema=public \
  "$VPS_PG_URL" > "$OUTDIR/data.sql"

echo "→ Schema dump at $OUTDIR/schema.sql"
echo "→ Data dump at $OUTDIR/data.sql"
echo "Inspect both files manually before applying."
echo
echo "To apply schema: psql \"\$SUPABASE_DB_URL\" -f $OUTDIR/schema.sql"
echo "To apply data:   psql \"\$SUPABASE_DB_URL\" -f $OUTDIR/data.sql"
