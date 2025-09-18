FROM node:18-bullseye

# Install PostgreSQL
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy dependencies
COPY package*.json ./

# Install Node dependencies
RUN npm install --legacy-peer-deps

# Copy NestJS project files
COPY . .

RUN npx prisma generate
# Build NestJS app
RUN npm run build

# Create a PostgreSQL user & database
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER nestjs WITH SUPERUSER PASSWORD 'nestjspass';" && \
    createdb -O nestjs nestjsdb

USER root

# Expose ports (NestJS + PostgreSQL)
EXPOSE 3000 5432

# Start script: PostgreSQL + NestJS
CMD service postgresql start && node dist/main.js
