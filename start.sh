#!/bin/sh
set -e

# Optional helpful output
echo "DATABASE_URL=${DATABASE_URL:-not-set}"
echo "Waiting for DB to be ready and applying migrations..."

# Keep trying until migrations succeed. This avoids needing external utilities.
# If prisma cannot connect it will exit non-zero and the loop will retry.
while true; do
  if npx prisma migrate deploy; then
    echo "Migrations applied successfully."
    break
  else
    echo "Prisma migrate failed (DB might not be ready). Retrying in 2s..."
    sleep 2
  fi
done

# ensure client exists (cheap/no-op if already generated)
npx prisma generate

echo "Starting Nest application..."
exec node dist/src/main.js
