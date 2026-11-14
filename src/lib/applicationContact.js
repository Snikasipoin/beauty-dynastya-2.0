export const contactMethods = ['instagram', 'telegram', 'email', 'whatsapp'];
export function isContactMethod(value) {
    return typeof value === 'string' && contactMethods.some(method => method === value);
}
function profileUsername(method, value) {
    let username = value.trim().replace(/^@/, '');
    if (/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|t\.me|telegram\.me)\//i.test(value.trim())) {
        try {
            const url = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : 'https://' + value.trim());
            const hosts = method === 'instagram' ? ['instagram.com', 'www.instagram.com'] : ['t.me', 'www.t.me', 'telegram.me', 'www.telegram.me'];
            if (!hosts.includes(url.hostname.toLowerCase()) || url.username || url.password)
                return null;
            username = url.pathname.replace(/^\/+|\/+$/g, '');
        }
        catch {
            return null;
        }
    }
    const pattern = method === 'instagram' ? /^[a-zA-Z0-9_.]{1,30}$/ : /^[a-zA-Z0-9_]{1,32}$/;
    return pattern.test(username) ? username : null;
}
export function contactError(method, value) {
    const text = value.trim();
    if (!text)
        return 'required';
    const invalid = text.length > 254 || [...text].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
    if (method === 'email') {
        const email = /^[^\s@<>]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
        return invalid || !email.test(text) ? 'contactEmailInvalid' : undefined;
    }
    if (method === 'whatsapp')
        return invalid || !/^\+[1-9]\d{6,14}$/.test(text.replace(/[\s().-]/g, '')) ? 'contactPhoneInvalid' : undefined;
    return invalid || !profileUsername(method, text) ? 'contactProfileInvalid' : undefined;
}
export function normalizeContact(method, value) {
    if (method === 'whatsapp')
        return value.trim().replace(/[\s().-]/g, '');
    if (method === 'instagram' || method === 'telegram') {
        const username = profileUsername(method, value);
        return username ? '@' + username : value.trim();
    }
    return value.trim();
}
export function contactLink(method, value) {
    const normalized = normalizeContact(method, value);
    if (method === 'telegram')
        return 'https://t.me/' + normalized.slice(1);
    if (method === 'instagram')
        return 'https://www.instagram.com/' + normalized.slice(1) + '/';
    if (method === 'whatsapp')
        return 'https://wa.me/' + normalized.slice(1);
    return undefined;
}
