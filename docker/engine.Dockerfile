FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/engine/package.json ./apps/engine/package.json
COPY packages ./packages

RUN bun install
RUN cd packages/db && bunx --bun prisma generate

COPY apps/engine ./apps/engine

RUN bun run build

CMD ["bun", "start:engine"]