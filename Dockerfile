FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/src/data/legal.ts ./src/data/legal.ts
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "server/index.ts"]
