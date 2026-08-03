FROM node:24-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install --global pnpm@10.28.2

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY vendor ./vendor
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-alpine AS login-standalone

ARG VERSION=dev
ARG REVISION=unknown

LABEL org.opencontainers.image.title="IFA ZITADEL Login V2" \
    org.opencontainers.image.description="Standalone FOS login UI for ZITADEL" \
    org.opencontainers.image.source="https://github.com/lierose/fos-zitadel-login" \
    org.opencontainers.image.version="$VERSION" \
    org.opencontainers.image.revision="$REVISION"

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /.env-file && \
    touch /.env-file/.env && \
    chown -R nextjs:nodejs /.env-file

COPY --chown=nextjs:nodejs --from=build /app/.next/standalone ./

USER nextjs
EXPOSE 3000
ENV HOSTNAME="::" \
    PORT="3000" \
    NODE_ENV="production" \
    NODE_OPTIONS="--use-openssl-ca --require /app/load-ssl-cert-dir.cjs" \
    SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt" \
    ZITADEL_TLS_ENABLED="false" \
    OTEL_SERVICE_NAME="fos-zitadel-login" \
    OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/usr/local/bin/node", "/app/healthcheck.mjs", "/ready"]
ENTRYPOINT ["/app/entrypoint.sh", "node", "server.js"]
