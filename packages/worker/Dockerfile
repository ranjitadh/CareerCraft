FROM node:20-slim

RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY packages/worker/package*.json ./
RUN npm ci

COPY packages/web/prisma ./prisma/
COPY packages/worker/.env ./.env
RUN npx prisma generate

COPY packages/worker/ .
RUN npm run build

CMD ["node", "dist/index.js"]
