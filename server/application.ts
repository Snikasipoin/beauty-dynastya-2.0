import { legalDocuments } from '../src/data/legal.ts'

export interface Application {
  full_name: string
  country: string
  role: 'participant' | 'judge' | 'speaker'
  language: 'en' | 'ru' | 'it' | 'de' | 'fr'
  personal_data_consent: true
  consent_version: string
  consent_given_at: string
  submission_id: string
}

const roles = ['participant', 'judge', 'speaker']
const languages = ['en', 'ru', 'it', 'de', 'fr']
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validText(value: unknown, max: number): value is string {
  // Управляющие символы исключаются, чтобы поля не подделывали строки уведомления.
  if (typeof value !== 'string' || !value.trim() || value.length > max) return false
  return [...value].every(character => {
    const code = character.charCodeAt(0)
    return code >= 32 && code !== 127
  })
}

// Клиентская проверка улучшает UX, но доверенная граница находится на сервере.
export function parseApplication(value: unknown): Application | null {
  if (typeof value !== 'object' || value === null) return null
  const body = value as Record<string, unknown>
  if (!validText(body.full_name, 120) || !validText(body.country, 100) ||
    typeof body.role !== 'string' || !roles.includes(body.role) ||
    typeof body.language !== 'string' || !languages.includes(body.language) ||
    body.personal_data_consent !== true || body.botcheck !== false ||
    body.consent_version !== legalDocuments.version ||
    typeof body.consent_given_at !== 'string' || body.consent_given_at.length > 40 ||
    !Number.isFinite(Date.parse(body.consent_given_at)) ||
    typeof body.submission_id !== 'string' || !uuid.test(body.submission_id)) return null
  return {
    full_name: body.full_name.trim(),
    country: body.country.trim(),
    role: body.role as Application['role'],
    language: body.language as Application['language'],
    personal_data_consent: true,
    consent_version: legalDocuments.version,
    consent_given_at: body.consent_given_at,
    submission_id: body.submission_id,
  }
}

export function telegramText(application: Application, origin: string, receivedAt: string): string {
  const role = { participant: 'Участник', judge: 'Судья', speaker: 'Спикер' }[application.role]
  return [
    'Новая заявка — Beauty Dynastya',
    '',
    'Имя: ' + application.full_name,
    'Страна: ' + application.country,
    'Роль: ' + role,
    'Язык формы: ' + application.language.toUpperCase(),
    '',
    'Согласие на обработку заявки: получено',
    'Редакция: ' + application.consent_version,
    'Время согласия (устройство): ' + application.consent_given_at,
    'Получено сервером: ' + receivedAt,
    origin + '/?lang=' + application.language + '#/consent',
    origin + '/?lang=' + application.language + '#/privacy',
    'Номер заявки: ' + application.submission_id,
  ].join('\n')
}
