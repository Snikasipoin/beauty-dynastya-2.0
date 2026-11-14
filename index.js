// Отдельный сервис Bothost принимает заявки; сайт остаётся на Timeweb.
process.env.API_ONLY = '1'
await import('./server/index.js')
