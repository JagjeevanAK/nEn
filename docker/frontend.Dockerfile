FROM oven/bun:latest

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json bun.lock turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages ./packages

RUN bun install
RUN cd packages/db && bunx --bun prisma generate

COPY apps/frontend ./apps/frontend

RUN bun run build

EXPOSE 5173

CMD ["bun", "start:frontend"]