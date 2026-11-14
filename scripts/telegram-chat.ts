// Запускается локально; токен читается из .env.local и никогда не выводится.
const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
if (!token) {
  console.error('Добавьте TELEGRAM_BOT_TOKEN в .env.local, затем повторите команду.')
  process.exit(1)
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
async function telegram(method: string): Promise<unknown> {
  const response = await fetch('https://api.telegram.org/bot' + token + '/' + method, { signal: AbortSignal.timeout(10000) })
  const data: unknown = await response.json()
  if (!response.ok || !record(data) || data.ok !== true) throw new Error('Telegram request failed')
  return data.result
}
try {
  const updates = await telegram('getUpdates?limit=100&timeout=0')
  if (!Array.isArray(updates)) throw new Error('Unexpected Telegram response')
  const chats = new Map<number, string>()
  for (const update of updates as unknown[]) {
    if (!record(update) || !record(update.message) || !record(update.message.chat)) continue
    const chat = update.message.chat
    if (chat.type === 'private' && typeof chat.id === 'number' && Number.isSafeInteger(chat.id) && chat.id > 0) {
      const name = typeof chat.first_name === 'string' ? chat.first_name : ''
      const username = typeof chat.username === 'string' ? '@' + chat.username : ''
      chats.set(chat.id, [name, username].filter(Boolean).join(' '))
    }
  }
  if (chats.size === 0) console.log('Откройте https://t.me/beautydynastya_bot, нажмите «Запустить», отправьте сообщение и повторите команду.')
  else for (const [id, name] of chats) console.log('Личный чат: ' + name + ' — TELEGRAM_ADMIN_IDS=' + id)
  console.log('Выберите только свой чат. Команда не отправляет сообщения и не подтверждает получение обновлений.')
} catch {
  console.error('Не удалось прочитать Telegram. Проверьте токен, сеть и отсутствие webhook у отдельного бота для заявок.')
  process.exitCode = 1
}
