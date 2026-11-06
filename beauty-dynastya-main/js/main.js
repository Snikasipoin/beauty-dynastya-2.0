// ===== 1. Burger menu =====
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');

burger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('nav--open');
  burger.setAttribute('aria-expanded', isOpen);
  // labels come from data-attributes, so each language page has its own text
  burger.setAttribute('aria-label', isOpen ? burger.dataset.labelClose : burger.dataset.labelOpen);
});

// close menu after clicking a link
nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('nav--open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', burger.dataset.labelOpen);
  });
});

// ===== 2. Judges filter =====
// Only .judge cards are filtered — participants use .participant, so they stay visible
const filterButtons = document.querySelectorAll('.filter__btn');
const judges = document.querySelectorAll('.judge');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;

    filterButtons.forEach((btn) => btn.setAttribute('aria-pressed', btn === button));

    judges.forEach((judge) => {
      judge.hidden = category !== 'all' && judge.dataset.category !== category;
    });
  });
});

// ===== 3. Photo not found -> show initials =====
document.querySelectorAll('.photo img').forEach((img) => {
  const removeImg = () => img.remove();

  if (img.complete && img.naturalWidth === 0) {
    removeImg(); // already failed before the script ran
  } else {
    img.addEventListener('error', removeImg);
  }
});

// ===== 4. Current year in footer =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== 5. Application modal =====
// Get a free key at https://web3forms.com — applications arrive at the e-mail you register there.
// The key is public by design (Web3Forms only sends to that e-mail), so it is safe in front-end code.
const WEB3FORMS_ACCESS_KEY = 'YOUR_ACCESS_KEY';

const MESSAGES = {
  en: { required: 'Please fill in this field', choose: 'Please choose one option', sending: 'Sending…',
        error: "Couldn't send your application. Please try again or write to us on Telegram." },
  ru: { required: 'Заполните это поле', choose: 'Выберите один вариант', sending: 'Отправка…',
        error: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.' },
  it: { required: 'Compila questo campo', choose: 'Scegli un’opzione', sending: 'Invio…',
        error: 'Invio non riuscito. Riprova o scrivici su Telegram.' },
  de: { required: 'Bitte fülle dieses Feld aus', choose: 'Bitte wähle eine Option', sending: 'Wird gesendet…',
        error: 'Senden fehlgeschlagen. Bitte versuche es erneut oder schreib uns auf Telegram.' },
  fr: { required: 'Veuillez remplir ce champ', choose: 'Veuillez choisir une option', sending: 'Envoi…',
        error: 'Échec de l’envoi. Réessayez ou écrivez-nous sur Telegram.' },
};

const modal = document.getElementById('apply');

if (modal) {
  const lang = document.documentElement.lang;
  const t = MESSAGES[lang] || MESSAGES.en;

  const form = modal.querySelector('.apply-form');
  const fields = [...form.querySelectorAll('[data-field]')];
  const submitBtn = form.querySelector('[type="submit"]');
  const formError = form.querySelector('.form__error');
  const success = modal.querySelector('.success');

  // --- validation: the browser checks "required", we only show the message ---
  const checkField = (field) => {
    const inputs = [...field.querySelectorAll('input')];
    const invalid = inputs.some((input) => !input.validity.valid);
    const message = invalid ? (inputs[0].type === 'radio' ? t.choose : t.required) : '';
    field.classList.toggle('field--error', invalid);
    field.querySelector('.field__error').textContent = message;
    inputs.forEach((input) => input.setAttribute('aria-invalid', String(invalid)));
    return !invalid;
  };

  const validate = () => {
    const results = fields.map(checkField);
    const firstBad = fields[results.indexOf(false)];
    if (firstBad) firstBad.querySelector('input').focus();
    return !firstBad;
  };

  // re-check a field as soon as the user fixes it
  form.addEventListener('input', (e) => {
    const field = e.target.closest('[data-field]');
    if (field && field.classList.contains('field--error')) checkField(field);
  });

  // --- open / close ---
  const resetForm = () => {
    form.reset();
    fields.forEach((field) => {
      field.classList.remove('field--error');
      field.querySelector('.field__error').textContent = '';
    });
    formError.textContent = '';
    form.hidden = false;
    success.hidden = true;
  };

  document.querySelectorAll('[data-open-apply]').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();                // without JS the link still scrolls to #register
      nav.classList.remove('nav--open');  // close the mobile menu if the button was inside it
      burger.setAttribute('aria-expanded', 'false');
      modal.showModal();
      form.querySelector('#ap-name').focus();
    });
  });

  modal.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => modal.close());
  });

  // .modal__inner covers the whole dialog, so a click on the <dialog> itself is a click on the overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  // after a successful submit, the next opening starts with a clean form
  modal.addEventListener('close', () => {
    if (!success.hidden) resetForm();
  });

  // --- submit to Web3Forms ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = Object.fromEntries(new FormData(form));
    data.access_key = WEB3FORMS_ACCESS_KEY;
    data.subject = `New application: ${data.role} — Beauty Dynastya (${lang.toUpperCase()})`;
    data.from_name = 'Beauty Dynastya website';

    const label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = t.sending;
    formError.textContent = '';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      form.hidden = true;
      success.hidden = false;
      success.querySelector('h3').focus();
    } catch (error) {
      formError.textContent = t.error;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
    }
  });
}
