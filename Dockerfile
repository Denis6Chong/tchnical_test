# Dockerfile.nestjs (Simple NestJS container)
FROM node:18-bullseye

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create wait script for database
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Waiting for postgres..."\n\
\n\
until npx prisma db push; do\n\
  echo "Postgres is unavailable - sleeping"\n\
  sleep 1\n\
done\n\
\n\
echo "Postgres is up - executing command"\n\
\n\
# Run migrations\n\
npx prisma migrate deploy\n\
\n\
# Start the application\n\
exec "$@"' > /usr/local/bin/wait-for-db.sh

RUN chmod +x /usr/local/bin/wait-for-db.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/wait-for-db.sh"]
CMD ["node", "dist/src/main.js"]