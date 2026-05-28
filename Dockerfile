# Multi-stage build. Each stage runs the exact commands verified locally
# (npm ci, astro build, tsc); Docker only sequences and packages them.

# ---- 1. build the static site ----
FROM node:22-slim AS site
WORKDIR /site
COPY site/package*.json ./
RUN npm ci
COPY site/ ./
RUN npm run build

# ---- 2. build the server (TypeScript -> dist) ----
FROM node:22-slim AS server-build
WORKDIR /server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ---- 3. runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# production deps only
COPY server/package*.json ./
RUN npm ci --omit=dev

# compiled server, built site, and the posts (the MCP server's data source)
COPY --from=server-build /server/dist ./dist
COPY --from=site /site/dist ./site-dist
COPY site/src/content/posts ./content/posts

ENV SITE_DIST=/app/site-dist
ENV POSTS_DIR=/app/content/posts
ENV PORT=8080
# Flip to "true" only once the artefact-one dataset is published and wired in.
ENV FINDINGS_ENABLED=false

EXPOSE 8080
CMD ["node", "dist/index.js"]
