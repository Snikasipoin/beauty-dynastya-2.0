import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
const destination = resolve(root, 'deploy/bothost')
// Штатный CLI TypeScript проверяет типы и переписывает .ts-импорты в .js.
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', resolve(root, 'tsconfig.bothost.json')], { cwd: root, stdio: 'inherit' })
await mkdir(destination, { recursive: true })

const packageJson = {
  name: 'beauty-dynastya-telegram',
  version: '1.0.0',
  private: true,
  type: 'module',
  main: 'index.js',
  engines: { node: '>=22' },
  scripts: { start: 'node index.js' },
}
const files = {
  'index.js': "// Отдельный сервис Bothost принимает заявки; сайт остаётся на Timeweb.\nprocess.env.API_ONLY = '1'\nawait import('./server/index.js')\n",
  'package.json': JSON.stringify(packageJson, null, 2) + '\n',
  'package-lock.json': JSON.stringify({
    name: packageJson.name, version: packageJson.version, lockfileVersion: 3, requires: true,
    packages: { '': { name: packageJson.name, version: packageJson.version, engines: packageJson.engines } },
  }, null, 2) + '\n',
  'Dockerfile': [
    'FROM node:22-bookworm-slim',
    '# Bothost монтирует исходники в /app; код расположен вне этой директории.',
    'WORKDIR /opt/beauty-dynastya-bot',
    'COPY . .',
    'ENV NODE_ENV=production API_ONLY=1 PORT=3000',
    'USER node',
    'EXPOSE 3000',
    'CMD ["node", "index.js"]',
    '',
  ].join('\n'),
  '.gitignore': '.env\n.env.*\n!.env.example\nnode_modules/\n*.log\n',
  '.dockerignore': '.git\n.env\n.env.*\n!.env.example\nnode_modules\n*.log\n',
  '.env.example': [
    '# Bothost передаёт токен из поля Bot Token как BOT_TOKEN.',
    '# Локально можно использовать TELEGRAM_BOT_TOKEN.',
    'TELEGRAM_BOT_TOKEN=',
    'TELEGRAM_ADMIN_IDS=',
    'APP_ORIGIN=https://beauty-dynastya.com',
    'PORT=3000',
    '# 1 только за управляемым reverse proxy хостинга.',
    'TRUST_PROXY=0',
    '',
  ].join('\n'),
  'README.md': await readFile(resolve(root, 'docs/bothost-setup.md'), 'utf8'),
}
for (const [path, source] of Object.entries(files)) await writeFile(resolve(destination, path), source)
console.log('Bothost deployment prepared in deploy/bothost; no runtime dependencies or secrets included.')
