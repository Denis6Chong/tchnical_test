set -e

echo "🔄 Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready
until npx prisma db push --accept-data-loss; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🚀 Starting NestJS application..."
exec "$@