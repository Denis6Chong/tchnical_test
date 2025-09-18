npx prisma migrate reset --force
npx prisma migrate dev --name init
node dist/src/main.js