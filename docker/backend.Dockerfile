FROM oven/bun:latest

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages

RUN bun install
RUN cd packages/db && bunx --bun prisma generate

COPY apps/backend ./apps/backend

RUN bun run build

CMD ["bun", "start:backend"]