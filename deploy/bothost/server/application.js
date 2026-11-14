import { legalDocuments } from '../src/data/legal.js';
import { contactError, contactLink, isContactMethod, normalizeContact } from '../src/lib/applicationContact.js';
const roles = ['participant', 'judge', 'speaker'];
const languages = ['en', 'ru', 'it', 'de', 'fr'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validText(value, max) {
    // Управляющие символы исключаются, чтобы поля не подделывали строки уведомления.
    if (typeof value !== 'string' || !value.trim() || value.length > max)
        return false;
    return [...value].every(character => {
        const code = character.charCodeAt(0);
        return code >= 32 && code !== 127;
    });
}
// Клиентская проверка улучшает UX, но доверенная граница находится на сервере.
export function parseApplication(value) {
    if (typeof value !== 'object' || value === null)
        return null;
    const body = value;
    if (!validText(body.full_name, 120) || !validText(body.country, 100) ||
        typeof body.role !== 'string' || !roles.includes(body.role) ||
        typeof body.language !== 'string' || !languages.includes(body.language) ||
        body.personal_data_consent !== true || body.botcheck !== false ||
        (body.consent_version !== legalDocuments.version && body.consent_version !== '2026-11-14.3') ||
        typeof body.consent_given_at !== 'string' || body.consent_given_at.length > 40 ||
        !Number.isFinite(Date.parse(body.consent_given_at)) ||
        typeof body.submission_id !== 'string' || !uuid.test(body.submission_id))
        return null;
    // Старая форма .3 продолжает работать во время обновления сайта.
    // Контакты разрешены только при согласии новой редакции .4.
    const legacy = body.consent_version === '2026-11-14.3';
    if (legacy && (body.contact_method !== undefined || body.contact_value !== undefined))
        return null;
    if (!legacy && (!isContactMethod(body.contact_method) || typeof body.contact_value !== 'string' ||
        contactError(body.contact_method, body.contact_value)))
        return null;
    const contact = !legacy && isContactMethod(body.contact_method) && typeof body.contact_value === 'string'
        ? { contact_method: body.contact_method, contact_value: normalizeContact(body.contact_method, body.contact_value) }
        : {};
    return {
        ...contact,
        full_name: body.full_name.trim(),
        country: body.country.trim(),
        role: body.role,
        language: body.language,
        personal_data_consent: true,
        consent_version: legacy ? '2026-11-14.3' : legalDocuments.version,
        consent_given_at: body.consent_given_at,
        submission_id: body.submission_id,
    };
}
export function telegramText(application, origin, receivedAt) {
    const role = { participant: 'Участник', judge: 'Судья', speaker: 'Спикер' }[application.role];
    const labels = { instagram: 'Instagram', telegram: 'Telegram', email: 'Почта', whatsapp: 'WhatsApp' };
    const contact = application.contact_method && application.contact_value
        ? ['Способ связи: ' + labels[application.contact_method], 'Контакт: ' + application.contact_value]
        : ['Контакт не указан: заявка из предыдущей версии формы.'];
    const link = application.contact_method && application.contact_value ? contactLink(application.contact_method, application.contact_value) : undefined;
    if (link)
        contact.push('Связаться: ' + link);
    return [
        'Новая заявка — Beauty Dynastya',
        '',
        'Имя: ' + application.full_name,
        'Страна: ' + application.country,
        'Роль: ' + role,
        ...contact,
        'Язык формы: ' + application.language.toUpperCase(),
        '',
        'Согласие на обработку заявки: получено',
        'Редакция: ' + application.consent_version,
        'Время согласия (устройство): ' + application.consent_given_at,
        'Получено сервером: ' + receivedAt,
        origin + '/?lang=' + application.language + '#/consent',
        origin + '/?lang=' + application.language + '#/privacy',
        'Номер заявки: ' + application.submission_id,
    ].join('\n');
}
