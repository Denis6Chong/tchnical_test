# Dockerfile.nestjs - Clean version without scripts
FROM node:18-bullseye

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate
RUN chmod +x start.sh

# Build application
RUN npm run build

EXPOSE $PORT

CMD ["start.sh"]