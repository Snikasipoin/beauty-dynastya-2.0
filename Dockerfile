FROM node:22-bookworm-slim
# Bothost монтирует исходники в /app; код расположен вне этой директории.
WORKDIR /opt/beauty-dynastya-bot
COPY . .
ENV NODE_ENV=production API_ONLY=1 PORT=3000
USER node
EXPOSE 3000
CMD ["node", "index.js"]
