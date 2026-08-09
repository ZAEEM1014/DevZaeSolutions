/* ==========================================================================
   Contact form — validation + submission

  Delivery: this is a static site, so there is no server of its own to send
  mail from. The form POSTs to FormSubmit (https://formsubmit.co), a form
  backend that forwards submissions straight to an inbox — no code needed
  on your end beyond the endpoint below.

  SETUP (one-time, ~2 minutes):
     1. No account setup is required.
     2. The endpoint below sends directly to mza@devzaesolutions.com.
     3. If you want a custom confirmation page later, set the `_next` field.
   ========================================================================== */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const FORM_ENDPOINT = 'https://formsubmit.co/mza@devzaesolutions.com';
  const FALLBACK_EMAIL = 'mza@devzaesolutions.com';

  const fields = {
    name: { el: document.getElementById('fName'), err: document.getElementById('fNameErr') },
    email: { el: document.getElementById('fEmail'), err: document.getElementById('fEmailErr') },
    phone: { el: document.getElementById('fPhone'), err: document.getElementById('fPhoneErr') },
    service: { el: document.getElementById('fService'), err: document.getElementById('fServiceErr') },
    message: { el: document.getElementById('fMsg'), err: document.getElementById('fMsgErr') },
    terms: { el: document.getElementById('fTerms'), err: document.getElementById('fTermsErr') },
  };

  const submitBtn = document.getElementById('submitBtn');
  const statusBox = document.getElementById('formStatus');
  const toast = document.getElementById('toast');
  const charCountEl = document.getElementById('charCount');
  const successScreen = document.getElementById('successScreen');
  const newQueryBtn = document.getElementById('newQueryBtn');
  const serviceDropdown = document.getElementById('serviceDropdown');
  const serviceTrigger = document.getElementById('serviceTrigger');
  const serviceMenu = document.getElementById('serviceMenu');
  const serviceLabel = document.getElementById('serviceLabel');
  const MSG_MAX = 600;

  function setError(fieldKey, message) {
    const f = fields[fieldKey];
    if (!f || !f.el) return;
    const group = f.el.closest('.form-group');
    if (message) {
      group && group.classList.add('invalid');
      group && group.classList.remove('valid');
      if (f.err) f.err.textContent = message;
      return false;
    }
    group && group.classList.remove('invalid');
    group && group.classList.add('valid');
    if (f.err) f.err.textContent = '';
    return true;
  }

  function validateName() {
    const v = fields.name.el.value.trim();
    if (!v) return setError('name', 'Please tell us your name.');
    if (v.length < 2) return setError('name', 'That name looks too short.');
    return setError('name', '');
  }

  function validateEmail() {
    const v = fields.email.el.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) return setError('email', 'An email address is required.');
    if (!re.test(v)) return setError('email', 'Enter a valid email address.');
    return setError('email', '');
  }

  function validatePhone() {
    const v = fields.phone.el.value.trim();
    if (!v) return setError('phone', ''); // optional field
    const re = /^[+]?[\d\s().-]{7,20}$/;
    if (!re.test(v)) return setError('phone', 'Enter a valid phone number, or leave it blank.');
    return setError('phone', '');
  }

  function validateService() {
    const v = fields.service.el.value;
    if (!v) return setError('service', 'Select what you need help with.');
    return setError('service', '');
  }

  function validateMessage() {
    const v = fields.message.el.value.trim();
    if (!v) return setError('message', 'Tell us a little about the project.');
    if (v.length < 20) return setError('message', 'A few more details would help (20+ characters).');
    if (v.length > MSG_MAX) return setError('message', `Keep it under ${MSG_MAX} characters.`);
    return setError('message', '');
  }

  function validateTerms() {
    if (!fields.terms.el.checked) return setError('terms', 'Please agree to continue.');
    return setError('terms', '');
  }

  function validateAll() {
    const results = [
      validateName(),
      validateEmail(),
      validatePhone(),
      validateService(),
      validateMessage(),
      validateTerms(),
    ];
    return results.every(Boolean);
  }

  // Live validation as the person types/selects
  fields.name.el && fields.name.el.addEventListener('blur', validateName);
  fields.email.el && fields.email.el.addEventListener('blur', validateEmail);
  fields.phone.el && fields.phone.el.addEventListener('blur', validatePhone);
  fields.service.el && fields.service.el.addEventListener('change', validateService);
  fields.terms.el && fields.terms.el.addEventListener('change', validateTerms);

  function closeServiceMenu() {
    if (!serviceDropdown || !serviceTrigger || !serviceMenu) return;
    serviceDropdown.classList.remove('open');
    serviceTrigger.setAttribute('aria-expanded', 'false');
  }

  function openServiceMenu() {
    if (!serviceDropdown || !serviceTrigger || !serviceMenu) return;
    serviceDropdown.classList.add('open');
    serviceTrigger.setAttribute('aria-expanded', 'true');
  }

  if (serviceTrigger && serviceMenu && fields.service.el) {
    serviceTrigger.addEventListener('click', () => {
      const isOpen = serviceDropdown.classList.contains('open');
      if (isOpen) closeServiceMenu();
      else openServiceMenu();
    });

    serviceMenu.addEventListener('click', (e) => {
      const option = e.target.closest('.custom-select-option');
      if (!option) return;
      const value = option.getAttribute('data-value') || '';
      fields.service.el.value = value;
      if (serviceLabel) serviceLabel.textContent = value;
      validateService();
      closeServiceMenu();
    });

    document.addEventListener('click', (e) => {
      if (!serviceDropdown.contains(e.target)) closeServiceMenu();
    });
  }

  if (fields.message.el && charCountEl) {
    fields.message.el.addEventListener('input', () => {
      const len = fields.message.el.value.length;
      charCountEl.textContent = len;
      charCountEl.parentElement.classList.toggle('limit', len > MSG_MAX);
    });
  }

  function showToast(message, type) {
    if (!toast) return;
    toast.innerHTML = `<span class="toast-dot"></span>${message}`;
    toast.className = 'toast show ' + (type || '');
    setTimeout(() => toast.classList.remove('show'), 4200);
  }

  function showStatus(message, type) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.className = 'form-status show ' + type;
  }

  function showSuccessScreen() {
    form.classList.add('is-hidden');
    if (successScreen) successScreen.classList.add('show');
  }

  function resetQueryFlow() {
    form.reset();
    Object.keys(fields).forEach((k) => {
      const group = fields[k].el && fields[k].el.closest('.form-group');
      group && group.classList.remove('valid', 'invalid');
    });
    if (charCountEl) charCountEl.textContent = '0';
    if (serviceLabel) serviceLabel.textContent = '— Select a service —';
    closeServiceMenu();
    if (statusBox) {
      statusBox.textContent = '';
      statusBox.className = 'form-status';
    }
    if (successScreen) successScreen.classList.remove('show');
    form.classList.remove('is-hidden');
    fields.name.el && fields.name.el.focus();
  }

  newQueryBtn && newQueryBtn.addEventListener('click', resetQueryFlow);

  function buildMailto() {
    const subject = encodeURIComponent(`New project inquiry — ${fields.service.el.value || 'General'}`);
    const body = encodeURIComponent(
      `Name: ${fields.name.el.value}\n` +
      `Email: ${fields.email.el.value}\n` +
      `Phone: ${fields.phone.el.value || '—'}\n` +
      `Service: ${fields.service.el.value}\n\n` +
      `${fields.message.el.value}`
    );
    return `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      const firstInvalid = form.querySelector('.form-group.invalid input, .form-group.invalid select, .form-group.invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const payload = {
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      phone: fields.phone.el.value.trim(),
      service: fields.service.el.value,
      message: fields.message.el.value.trim(),
      _subject: `New project inquiry — ${fields.name.el.value.trim()}`,
      _captcha: false,
      _template: 'table',
      _next: `${window.location.origin}${window.location.pathname}#contact-success`,
    };

    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => formData.append(key, value));

      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Submission failed');

      form.reset();
      Object.keys(fields).forEach((k) => {
        const group = fields[k].el && fields[k].el.closest('.form-group');
        group && group.classList.remove('valid', 'invalid');
      });
      if (charCountEl) charCountEl.textContent = '0';
      if (serviceLabel) serviceLabel.textContent = '— Select a service —';
      closeServiceMenu();
      showStatus('Sent successfully. We will reply within 24 hours.', 'success');
      showToast('Message sent successfully!', 'success');
      showSuccessScreen();
    } catch (err) {
      showStatus(
        "We couldn't reach the mail service. Please try again in a moment.",
        'error'
      );
      showToast('Mail service unavailable.', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
})();
