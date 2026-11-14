import { test } from 'node:test'
import type { TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createApplicationServer } from '../../server/app.ts'
import type { ServerConfig } from '../../server/app.ts'
import { legalDocuments } from '../../src/data/legal.ts'

const origin = 'https://example.test'
const token = '123456789:test-token-kept-only-on-server'
const payload = () => ({
  full_name: 'Test Applicant', country: 'Italy', role: 'participant', language: 'ru',
  contact_method: 'telegram', contact_value: '@test_user',
  botcheck: false, personal_data_consent: true, consent_version: legalDocuments.version,
  consent_given_at: '2026-11-14T10:00:00.000Z', submission_id: randomUUID(),
})

async function fixture(t: TestContext, config: Partial<ServerConfig> = {}, send?: typeof fetch) {
  const prefix = join(tmpdir(), 'beauty-dynastya-server-')
  const dir = await mkdtemp(prefix)
  await mkdir(join(dir, 'dist', 'assets'), { recursive: true })
  await writeFile(join(dir, 'dist', 'index.html'), '<h1>Beauty Dynastya</h1>')
  await writeFile(join(dir, 'dist', 'assets', 'app-hash.js'), 'console.log("site")')
  await writeFile(join(dir, 'secret.txt'), token)
  const calls: { url: string; body: Record<string, unknown> }[] = []
  let time = Date.parse('2026-11-14T11:00:00.000Z')
  const mock: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), body: JSON.parse(String(init?.body)) as Record<string, unknown> })
    if (send) return send(input, init)
    return Response.json({ ok: true, result: { message_id: 1 } })
  }
  const server = createApplicationServer({
    botToken: token, adminIds: ['123456'], origin, dist: join(dir, 'dist'), ...config,
  }, { fetch: mock, now: () => time })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const address = server.address()
  assert(address && typeof address !== 'string')
  const base = 'http://127.0.0.1:' + address.port
  t.after(async () => {
    server.closeAllConnections()
    await new Promise<void>((done) => server.close(() => done()))
    // Удаляем только созданный этим тестом каталог с проверенным абсолютным префиксом.
    assert(resolve(dir).startsWith(resolve(prefix)))
    await rm(dir, { recursive: true, force: true })
  })
  const post = (body: unknown = payload(), headers: Record<string, string> = {}) =>
    fetch(base + '/api/applications', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  return { post, calls, base, advance: (ms: number) => { time += ms } }
}

test('delivers validated application and consent only to the configured private chat', async (t) => {
  const f = await fixture(t)
  const response = await f.post({ ...payload(), chat_id: 'attacker', consent_document: 'https://attacker.test', full_name: '<b>Applicant</b>' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true })
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].url, 'https://api.telegram.org/bot' + token + '/sendMessage')
  const message = f.calls[0].body
  assert.equal(message.chat_id, '123456')
  assert.equal(message.parse_mode, undefined)
  assert.match(String(message.text), /<b>Applicant<\/b>/)
  assert.match(String(message.text), /Участник/)
  assert.match(String(message.text), /2026-11-14T11:00:00.000Z/)
  assert.match(String(message.text), /https:\/\/example.test\/\?lang=ru#\/consent/)
  assert(!String(message.text).includes('attacker.test'))
  assert(!String(message.text).includes(token))
})

const invalid: Record<string, unknown>[] = [
  { full_name: '' }, { full_name: 'a'.repeat(121) }, { full_name: 'Name\nForged: line' },
  { country: '' }, { country: 'a'.repeat(101) }, { role: 'owner' }, { language: 'xx' },
  { personal_data_consent: false }, { personal_data_consent: 'true' },
  { botcheck: true }, { botcheck: undefined }, { consent_version: 'old' },
  { consent_given_at: 'invalid' }, { submission_id: 'not-a-uuid' },
  { contact_method: '' }, { contact_method: 'sms' }, { contact_method: undefined }, { contact_value: undefined },
  { contact_value: '' }, { contact_value: '@bad\nname' }, { contact_value: 'x'.repeat(255) },
  { contact_method: 'email', contact_value: 'not-an-email' },
  { contact_method: 'whatsapp', contact_value: '1234567' },
  { contact_method: 'telegram', contact_value: 'https://foreign.test/user' },
]
for (const [index, change] of invalid.entries()) {
  test('rejects invalid application before contacting Telegram: case ' + index, async (t) => {
    const f = await fixture(t)
    assert.equal((await f.post({ ...payload(), ...change })).status, 422)
    assert.equal(f.calls.length, 0)
  })
}

test('rejects foreign origins, non-JSON bodies, malformed JSON and oversized bodies', async (t) => {
  const f = await fixture(t)
  assert.equal((await f.post(payload(), { Origin: 'https://attacker.test' })).status, 403)
  assert.equal((await f.post(payload(), { 'Content-Type': 'text/plain' })).status, 415)
  const malformed = await fetch(f.base + '/api/applications', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{broken' })
  assert.equal(malformed.status, 400)
  assert.equal((await f.post({ ...payload(), extra: 'x'.repeat(9000) })).status, 413)
  assert.equal((await fetch(f.base + '/api/applications')).status, 405)
  assert.equal(f.calls.length, 0)
})

test('missing configuration and non-private chat IDs return unavailable without sending', async (t) => {
  for (const config of [{ botToken: '' }, { adminIds: [] }, { origin: '' }, { adminIds: ['-1001234'] }]) {
    const f = await fixture(t, config)
    const response = await f.post()
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { success: false, error: 'unavailable' })
    assert.equal(f.calls.length, 0)
  }
})

test('Telegram errors never report success or expose secrets and allow a retry', async (t) => {
  let failed = true
  const send: typeof fetch = async () => failed
    ? Response.json({ ok: false, description: token }, { status: 403 })
    : Response.json({ ok: true })
  const f = await fixture(t, {}, send)
  const body = payload()
  const response = await f.post(body)
  assert.equal(response.status, 502)
  assert(!String(await response.text()).includes(token))
  failed = false
  assert.equal((await f.post(body)).status, 200)
  assert.equal(f.calls.length, 2)
})

test('network failure is handled without disclosing the Telegram request URL', async (t) => {
  const f = await fixture(t, {}, async () => { throw new Error(token) })
  const response = await f.post()
  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), { success: false, error: 'delivery_failed' })
})

test('concurrent and subsequent retries of the same application send one message', async (t) => {
  const f = await fixture(t, {}, async () => {
    await new Promise((done) => setTimeout(done, 50))
    return Response.json({ ok: true })
  })
  const body = payload()
  const responses = await Promise.all([f.post(body), f.post(body), f.post(body)])
  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200])
  assert.equal((await f.post(body)).status, 200)
  assert.equal(f.calls.length, 1)
})

test('a submission number cannot be reused with different data', async (t) => {
  const f = await fixture(t)
  const body = payload()
  assert.equal((await f.post(body)).status, 200)
  assert.equal((await f.post({ ...body, country: 'Germany' })).status, 409)
  assert.equal(f.calls.length, 1)
})

test('rate limit cannot be bypassed with untrusted forwarded headers and expires', async (t) => {
  const f = await fixture(t)
  for (let index = 0; index < 5; index++) assert.equal((await f.post(payload(), { 'X-Forwarded-For': '192.0.2.' + index })).status, 200)
  const limited = await f.post(payload(), { 'X-Forwarded-For': '192.0.2.6' })
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '600')
  f.advance(600001)
  assert.equal((await f.post()).status, 200)
})

test('global rate limit applies even with different trusted client IPs', async (t) => {
  const f = await fixture(t, { trustProxy: true })
  for (let index = 1; index <= 30; index++) assert.equal((await f.post(payload(), { 'X-Forwarded-For': '192.0.2.' + index })).status, 200)
  assert.equal((await f.post(payload(), { 'X-Forwarded-For': '192.0.2.31' })).status, 429)
})

test('serves the production site and health check, but never files outside dist', async (t) => {
  const f = await fixture(t)
  const home = await fetch(f.base + '/')
  assert.equal(home.status, 200)
  assert.equal(home.headers.get('cache-control'), 'no-cache')
  assert.match(await home.text(), /Beauty Dynastya/)
  const asset = await fetch(f.base + '/assets/app-hash.js', { method: 'HEAD' })
  assert.equal(asset.status, 200)
  assert.match(asset.headers.get('cache-control') ?? '', /immutable/)
  assert.equal(await asset.text(), '')
  for (const path of ['/%2e%2e%2fsecret.txt', '/.env.local', '/server/index.ts', '/api/missing']) {
    assert.equal((await fetch(f.base + path)).status, 404)
  }
  assert.deepEqual(await (await fetch(f.base + '/api/health')).json(), { status: 'ok' })
})

test('notifies every allowed recipient and never repeats a confirmed delivery after partial failure', async (t) => {
  let failSecond = true
  const send: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    return body.chat_id === '222222' && failSecond
      ? Response.json({ ok: false }, { status: 403 })
      : Response.json({ ok: true })
  }
  const f = await fixture(t, { adminIds: ['111111', '222222', '111111'] }, send)
  const body = payload()
  assert.equal((await f.post(body)).status, 502)
  failSecond = false
  assert.equal((await f.post(body)).status, 200)
  assert.deepEqual(f.calls.map(call => call.body.chat_id), ['111111', '222222', '222222'])
})

test('cross-origin preflight permits only the configured site, POST and Content-Type', async (t) => {
  const f = await fixture(t)
  const headers = { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' }
  const allowed = await fetch(f.base + '/api/applications', { method: 'OPTIONS', headers })
  assert.equal(allowed.status, 204)
  assert.equal(allowed.headers.get('access-control-allow-origin'), origin)
  assert.equal(allowed.headers.get('access-control-allow-methods'), 'POST')
  assert.equal(allowed.headers.get('access-control-allow-headers'), 'Content-Type')
  assert.equal(allowed.headers.get('vary'), 'Origin')
  assert.equal(await allowed.text(), '')
  assert.equal(f.calls.length, 0)
  const foreign = await fetch(f.base + '/api/applications', { method: 'OPTIONS', headers: { ...headers, Origin: 'https://foreign.test' } })
  assert.equal(foreign.status, 403)
  assert.equal(foreign.headers.get('access-control-allow-origin'), null)
  for (const change of [{ 'Access-Control-Request-Method': 'PUT' }, { 'Access-Control-Request-Headers': 'authorization' }]) {
    const response = await fetch(f.base + '/api/applications', { method: 'OPTIONS', headers: { ...headers, ...change } })
    assert.equal(response.status, 403)
  }
  assert.equal(f.calls.length, 0)
})

test('browser can read both successful deliveries and server errors from the allowed site', async (t) => {
  const f = await fixture(t)
  const response = await f.post()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
  const unavailable = await fixture(t, { botToken: '' })
  const failure = await unavailable.post()
  assert.equal(failure.status, 503)
  assert.equal(failure.headers.get('access-control-allow-origin'), origin)
})

test('preflight works before bot configuration without sending a notification', async (t) => {
  const f = await fixture(t, { botToken: '' })
  const response = await fetch(f.base + '/api/applications', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' } })
  assert.equal(response.status, 204)
  assert.equal(f.calls.length, 0)
})

test('standalone Bothost service provides health checks and never publishes site assets', async (t) => {
  const f = await fixture(t, { apiOnly: true })
  for (const path of ['/', '/health', '/api/health']) assert.deepEqual(await (await fetch(f.base + path)).json(), { status: 'ok' })
  assert.equal((await fetch(f.base + '/assets/app-hash.js')).status, 404)
  assert.equal((await f.post()).status, 200)
})

for (const [method, value, normalized, label, link] of [
  ['instagram', 'https://www.instagram.com/test.user/?igsh=example', '@test.user', 'Instagram', 'https://www.instagram.com/test.user/'],
  ['telegram', 'https://t.me/test_user', '@test_user', 'Telegram', 'https://t.me/test_user'],
  ['email', ' member+test@example.org ', 'member+test@example.org', 'Почта', undefined],
  ['whatsapp', '+44 (7700) 900-123', '+447700900123', 'WhatsApp', 'https://wa.me/447700900123'],
] as const) {
  test('delivers the preferred contact and a usable link: ' + method, async (t) => {
    const f = await fixture(t)
    assert.equal((await f.post({ ...payload(), contact_method: method, contact_value: value })).status, 200)
    const text = String(f.calls[0].body.text)
    assert(text.includes('Способ связи: ' + label))
    assert(text.includes('Контакт: ' + normalized))
    if (link) assert(text.includes('Связаться: ' + link))
  })
}

test('cached previous form works without collecting contacts under its old consent', async (t) => {
  const f = await fixture(t)
  const body: Record<string, unknown> = { ...payload(), consent_version: '2026-11-14.3' }
  delete body.contact_method
  delete body.contact_value
  assert.equal((await f.post(body)).status, 200)
  assert(String(f.calls[0].body.text).includes('Редакция: 2026-11-14.3'))
  assert(String(f.calls[0].body.text).includes('Контакт не указан'))
  assert.equal((await f.post({ ...payload(), consent_version: '2026-11-14.3' })).status, 422)
})
