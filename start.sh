npx prisma migrate reset --force
npx prisma migrate dev --name init
npm run build
node dist/src/main.js