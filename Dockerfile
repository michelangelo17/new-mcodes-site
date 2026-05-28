# MCP server image. The static site deploys separately to object storage.

FROM node:22-slim AS server-build
WORKDIR /server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server-build /server/dist ./dist
# Posts are the server's data source — the same files the site renders.
COPY site/src/content/posts ./content/posts

ENV POSTS_DIR=/app/content/posts
ENV PORT=8080
ENV FINDINGS_ENABLED=false

EXPOSE 8080
CMD ["node", "dist/index.js"]
