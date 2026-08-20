FROM node:20-slim

RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-science \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY packages/worker/package*.json ./
RUN npm ci

COPY packages/web/prisma ./prisma/
RUN npx prisma generate

COPY packages/worker/ .
RUN npm run build

CMD ["node", "dist/index.js"]
