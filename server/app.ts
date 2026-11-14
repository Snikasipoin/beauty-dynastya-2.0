import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { extname, resolve, sep } from 'node:path'
import { parseApplication, telegramText } from './application.ts'

export interface ServerConfig {
  botToken?: string
  adminIds: readonly string[]
  origin?: string
  dist: string
  trustProxy?: boolean
  apiOnly?: boolean
}

interface Dependencies {
  fetch?: typeof fetch
  now?: () => number
}

class HttpError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
  }
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
}

function json(response: ServerResponse, status: number, body: object) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(body))
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) throw new HttpError(415, 'content_type')
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 8192) throw new HttpError(413, 'too_large')
    chunks.push(buffer)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown }
  catch { throw new HttpError(400, 'invalid_json') }
}

function clientIp(request: IncomingMessage, trustProxy: boolean): string {
  // Доверяем последнему адресу только за управляемым reverse proxy хостинга.
  const forwarded = request.headers['x-forwarded-for']
  if (trustProxy && typeof forwarded === 'string') {
    const ip = forwarded.split(',').at(-1)?.trim()
    if (ip && isIP(ip)) return ip
  }
  return request.socket.remoteAddress ?? 'unknown'
}

export function createApplicationServer(config: ServerConfig, dependencies: Dependencies = {}) {
  const send = dependencies.fetch ?? fetch
  const now = dependencies.now ?? Date.now
  const dist = resolve(config.dist)
  const rates = new Map<string, { count: number; until: number }>()
  const deliveries = new Map<string, { hash: string; until: number; sent: Set<string>; promise?: Promise<void> }>()
  let globalWindow = { count: 0, until: 0 }

  function limit(ip: string) {
    const time = now()
    for (const [key, entry] of rates) if (entry.until <= time) rates.delete(key)
    if (globalWindow.until <= time) globalWindow = { count: 0, until: time + 60000 }
    const entry = rates.get(ip) ?? { count: 0, until: time + 600000 }
    if (entry.count >= 5 || globalWindow.count >= 30 || (!rates.has(ip) && rates.size >= 10000)) throw new HttpError(429, 'rate_limited')
    entry.count++
    globalWindow.count++
    rates.set(ip, entry)
  }

  async function handle(request: IncomingMessage, response: ServerResponse) {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    const path = new URL(request.url ?? '/', 'http://localhost').pathname
    if ((path === '/api/health' || path === '/health' || (config.apiOnly && path === '/')) && request.method === 'GET') {
      json(response, 200, { status: 'ok' })
      return
    }
    if (path === '/api/applications') {
      if (request.method !== 'POST' && request.method !== 'OPTIONS') {
        response.setHeader('Allow', 'POST, OPTIONS')
        throw new HttpError(405, 'method_not_allowed')
      }
      response.setHeader('Vary', 'Origin')
      if (!config.origin) throw new HttpError(503, 'unavailable')
      if (request.headers.origin !== config.origin) throw new HttpError(403, 'origin_not_allowed')
      // Браузер может обращаться к Bothost только с разрешённого сайта.
      response.setHeader('Access-Control-Allow-Origin', config.origin)
      if (request.method === 'OPTIONS') {
        const method = request.headers['access-control-request-method']
        const headers = request.headers['access-control-request-headers'] ?? ''
        if (method !== 'POST' || typeof headers !== 'string' ||
          headers.split(',').some(header => header.trim() && header.trim().toLowerCase() !== 'content-type')) throw new HttpError(403, 'preflight_not_allowed')
        response.writeHead(204, {
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '600',
        })
        response.end()
        return
      }
      if (!config.botToken || !config.adminIds.length || config.adminIds.length > 10 || config.adminIds.some(id => !/^[1-9]\d*$/.test(id))) throw new HttpError(503, 'unavailable')
      limit(clientIp(request, Boolean(config.trustProxy)))
      const application = parseApplication(await readJson(request))
      if (!application) throw new HttpError(422, 'invalid_application')
      const time = now()
      for (const [key, entry] of deliveries) if (entry.until <= time) deliveries.delete(key)
      const hash = createHash('sha256').update(JSON.stringify(application)).digest('hex')
      let delivery = deliveries.get(application.submission_id)
      if (delivery && delivery.hash !== hash) throw new HttpError(409, 'submission_conflict')
      if (!delivery) {
        if (deliveries.size >= 1000) throw new HttpError(429, 'rate_limited')
        delivery = { hash, until: time + 600000, sent: new Set() }
        deliveries.set(application.submission_id, delivery)
      }
      const entry = delivery
      const pending = entry.promise ?? (entry.promise = (async () => {
        // Уведомления получают только ID, указанные владельцем на сервере.
        const results = await Promise.allSettled([...new Set(config.adminIds)].map(async (adminId) => {
          if (entry.sent.has(adminId)) return
          const result = await send('https://api.telegram.org/bot' + config.botToken + '/sendMessage', {
            method: 'POST',
            signal: AbortSignal.timeout(8000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: adminId,
              text: telegramText(application, config.origin!, new Date(time).toISOString()),
              link_preview_options: { is_disabled: true },
            }),
          })
          const body: unknown = await result.json()
          if (!result.ok || typeof body !== 'object' || body === null || !('ok' in body) || body.ok !== true) throw new Error('Delivery failed')
          entry.sent.add(adminId)
        }))
        if (results.some(result => result.status === 'rejected')) throw new Error('Delivery failed')
      })())
      try { await pending }
      catch {
        // При повторе не отправляем заново тем, кому Telegram уже подтвердил доставку.
        if (entry.promise === pending) entry.promise = undefined
        throw new HttpError(502, 'delivery_failed')
      }
      json(response, 200, { success: true })
      return
    }
    if (config.apiOnly || path.startsWith('/api/')) throw new HttpError(404, 'not_found')
    if (request.method !== 'GET' && request.method !== 'HEAD') throw new HttpError(405, 'method_not_allowed')
    let decoded: string
    try { decoded = decodeURIComponent(path) }
    catch { throw new HttpError(400, 'invalid_path') }
    const file = resolve(dist, '.' + (decoded === '/' ? '/index.html' : decoded))
    if (!file.startsWith(dist + sep)) throw new HttpError(404, 'not_found')
    const info = await stat(file).catch(() => null)
    if (!info?.isFile()) throw new HttpError(404, 'not_found')
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': decoded.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).on('error', () => response.destroy()).pipe(response)
  }

  const server = createServer((request, response) => {
    void handle(request, response).catch((error: unknown) => {
      if (response.headersSent || response.destroyed) { response.destroy(); return }
      const failure = error instanceof HttpError ? error : new HttpError(500, 'internal_error')
      if (failure.status === 429) response.setHeader('Retry-After', '600')
      json(response, failure.status, { success: false, error: failure.code })
    })
  })
  server.requestTimeout = 15000
  server.headersTimeout = 10000
  server.maxHeadersCount = 50
  return server
}
