# Beauty Dynastya

Website of the international online beauty championship **Beauty Dynastya**.
Static site: HTML + CSS + vanilla JS, no build step.

## Languages

| Language | Page |
| --- | --- |
| English | `index.html` |
| Русский | `ru/index.html` |
| Italiano | `it/index.html` |
| Deutsch | `de/index.html` |
| Français | `fr/index.html` |

All pages share `css/style.css`, `js/main.js` and `images/`.

## Structure

```
├── index.html
├── ru/  it/  de/  fr/      language versions
├── css/style.css
├── js/main.js              burger menu, judges filter, photo fallback, year, application form
└── images/
    ├── logo.png            site logo
    ├── favicon.png         tab icon
    └── posters/            judges, speakers, participants, sponsor
```

## Adding a judge

1. Put the poster into `images/posters/` (JPG, 800px wide).
2. Copy any `<li class="judge">` card in **every** language page and change name, role, country, Instagram.
3. `data-category` must be one of: `lash`, `pmu`, `brows`, `lamination`, `nails`, `hair` — the filter uses it.
4. Update the judges / countries numbers in the “About” block.

## Application form

The "Register" buttons in the header and hero open a form: name, country, role (Judge / Participant / Speaker)
and a link to the Telegram group https://t.me/Beautydynastya.

Applications are e-mailed through Web3Forms:

1. Go to https://web3forms.com → Create Access Key → enter the organiser's e-mail.
2. Paste the key into `js/main.js`: `const WEB3FORMS_ACCESS_KEY = '...';`

## Cache

Pages load `css/style.css?v=3` and `js/main.js?v=3`.
After changing CSS or JS, bump the number (`v=4`) in all five `index.html` files so phones load the new file.

## Deploy (GitHub Pages)

Settings → Pages → Source: branch `main`, folder `/ (root)` → Save.
