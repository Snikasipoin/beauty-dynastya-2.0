import { resolve } from 'node:path'
import { createApplicationServer } from './app.ts'

const port = Number(process.env.PORT || 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
const configuredOrigin = process.env.APP_ORIGIN?.trim()
const parsedOrigin = configuredOrigin ? new URL(configuredOrigin) : undefined
if (parsedOrigin && (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash || parsedOrigin.username || parsedOrigin.password)) throw new Error('APP_ORIGIN must contain only protocol and host')
const origin = parsedOrigin?.origin

const server = createApplicationServer({
  botToken: (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN)?.trim(),
  adminIds: [...new Set((process.env.TELEGRAM_ADMIN_IDS ?? '').split(/[,\s]+/).filter(Boolean))],
  origin,
  dist: resolve('dist'),
  apiOnly: process.env.API_ONLY === '1',
  trustProxy: process.env.TRUST_PROXY === '1',
})
server.listen(port, '0.0.0.0', () => console.log('Beauty Dynastya server listening on port ' + port))
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10000).unref()
  })
}
