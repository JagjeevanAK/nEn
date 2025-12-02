FROM oven/bun:1.3.2 AS builder

WORKDIR /app

ARG DATABASE_URL
ARG VITE_BACKEND_URL
ARG VITE_WS_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV DATABASE_URL=${DATABASE_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY package.json bun.lock turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages ./packages

RUN bun install
RUN cd packages/db && bunx --bun prisma generate

COPY apps/frontend ./apps/frontend

RUN bun run build

FROM nginx:alpine AS runtime

WORKDIR /app

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY conf/frontend-nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]