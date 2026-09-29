// requestFormView.js — "Employee Inactive Request" demo form page.
//
// Renders a self-service "Employee Inactive Request" form into the app shell's
// content region (`#app-content`, from appShell.js) so the persistent portal
// chrome (dark sidebar + white topbar + slim app-header) survives — exactly
// like the group list view. The router calls renderAppShell(mount) first, then
// renderRequestFormView(mount).
//
// This is a MOCKUP form: the "Submit Request" button is DECORATIVE (its click
// calls preventDefault and does nothing), auto-filled identity/location values
// are dummy text, and there is no real submission or persistence.
//
// Behavior:
//   - A read-only profile info panel shows dummy auto-filled identity values.
//   - The first dropdown ("Is your work location correct?") controls which of
//     two Work Location fields is visible: "Yes" reveals the read-only,
//     auto-filled Work Location; "No" reveals the manual Work Location input.
//     Both are hidden until a choice is made.
//   - Required fields are marked with a red asterisk in their labels.
//
// Import safety: router.js statically imports this module, so navigation uses a
// DYNAMIC import of router.js (matching loginView.js) to avoid a static cycle.

import { getContentRegion } from './appShell.js';

/** Dummy auto-filled identity values shown in the read-only profile panel. */
const PROFILE = [
  { label: 'Name', value: '-' },
  { label: 'Employee ID', value: '-' },
  { label: 'Department', value: '-' },
  { label: 'Work Location', value: '-' },
  { label: 'Job Title', value: '-' },
];

/** Dummy auto-filled work location prefilled into the read-only field. */
const AUTOFILLED_WORK_LOCATION = '-';

/**
 * Navigate back to the group list. Setting the hash lets the app's hashchange
 * listener (main.js) re-dispatch; we also dispatch directly so navigation works
 * regardless of whether that listener is wired yet. A dynamic import avoids a
 * static import cycle (router.js imports this view).
 */
function goToGroups() {
  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = '#/groups';
  }
  import('../router.js')
    .then(({ dispatch }) => dispatch())
    .catch(() => {
      /* router unavailable (e.g. isolated import) — hashchange will handle it */
    });
}

/**
 * Build a labeled form field wrapper (stacked label + control). The label gets
 * a red asterisk when required.
 *
 * @param {Document} doc
 * @param {string} labelText
 * @param {HTMLElement} control the input/select/textarea element
 * @param {Object} [opts]
 * @param {boolean} [opts.required] whether to mark the label with an asterisk
 * @param {string} [opts.forId] the id to associate the label with the control
 * @returns {HTMLElement} the `.req-field` wrapper
 */
function buildField(doc, labelText, control, opts = {}) {
  const field = doc.createElement('div');
  field.className = 'req-field';

  const label = doc.createElement('label');
  label.className = 'req-field__label';
  if (opts.forId) label.setAttribute('for', opts.forId);
  label.textContent = labelText;

  if (opts.required) {
    const star = doc.createElement('span');
    star.className = 'req-field__required';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = ' *';
    label.appendChild(star);
  }

  field.appendChild(label);

  control.classList.add('req-field__control');
  field.appendChild(control);

  return field;
}

/**
 * Render the Employee Inactive Request form into the app shell's content region.
 *
 * @param {HTMLElement} mount the shell mount element (typically `#app`). The
 *   app shell must already have been rendered into it so `#app-content` exists.
 */
export function renderRequestFormView(mount) {
  if (!mount) return;

  const doc = mount.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  const content = getContentRegion(mount);
  content.replaceChildren();

  const section = doc.createElement('section');
  section.className = 'req-view';
  section.setAttribute('aria-labelledby', 'req-form-title');

  // "← Back to Groups" link-style button at the top.
  const back = doc.createElement('button');
  back.type = 'button';
  back.className = 'req-form__back';
  back.textContent = '← Back to Groups';
  back.addEventListener('click', goToGroups);
  section.appendChild(back);

  // Page heading + subtitle.
  const title = doc.createElement('h1');
  title.id = 'req-form-title';
  title.className = 'req-form__title';
  title.textContent = 'Employee Inactive Request';
  section.appendChild(title);

  const subtitle = doc.createElement('p');
  subtitle.className = 'req-form__subtitle';
  subtitle.textContent = 'Fill in the form below to submit your request';
  section.appendChild(subtitle);

  // The form. `novalidate` + preventDefault on submit keeps Enter from
  // reloading the page (this is a decorative mockup).
  const form = doc.createElement('form');
  form.className = 'req-form';
  form.setAttribute('novalidate', '');
  form.addEventListener('submit', (event) => {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    // Decorative only — no submission, no side effects.
  });

  // ---- Read-only profile info panel (dummy auto-filled identity values) ----
  const profile = doc.createElement('div');
  profile.className = 'req-profile';
  for (const entry of PROFILE) {
    const item = doc.createElement('div');
    item.className = 'req-profile__item';

    const itemLabel = doc.createElement('span');
    itemLabel.className = 'req-profile__label';
    itemLabel.textContent = entry.label;
    item.appendChild(itemLabel);

    const itemValue = doc.createElement('span');
    itemValue.className = 'req-profile__value';
    itemValue.textContent = entry.value;
    item.appendChild(itemValue);

    profile.appendChild(item);
  }
  form.appendChild(profile);

  // ---- 1. "Is your work location correct?" dropdown (required) ----
  const locationCorrect = doc.createElement('select');
  locationCorrect.id = 'req-location-correct';
  locationCorrect.required = true;

  const placeholder = doc.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Select...';
  locationCorrect.appendChild(placeholder);

  for (const answer of ['Yes', 'No']) {
    const option = doc.createElement('option');
    option.value = answer;
    option.textContent = answer;
    locationCorrect.appendChild(option);
  }

  form.appendChild(
    buildField(doc, 'Is your work location correct?', locationCorrect, {
      required: true,
      forId: 'req-location-correct',
    })
  );

  // ---- 2. Work Location (auto-filled, read-only) — shown when "Yes" ----
  const workLocationAuto = doc.createElement('input');
  workLocationAuto.type = 'text';
  workLocationAuto.id = 'req-work-location-auto';
  workLocationAuto.readOnly = true;
  workLocationAuto.value = AUTOFILLED_WORK_LOCATION;

  const workLocationAutoField = buildField(doc, 'Work Location', workLocationAuto, {
    forId: 'req-work-location-auto',
  });
  workLocationAutoField.classList.add('req-field--work-location-auto');
  // Hidden until the dropdown answer is "Yes".
  workLocationAutoField.hidden = true;
  form.appendChild(workLocationAutoField);

  // ---- 3. Work Location (manual, required, empty) — shown when "No" ----
  const workLocationManual = doc.createElement('input');
  workLocationManual.type = 'text';
  workLocationManual.id = 'req-work-location-manual';
  workLocationManual.required = true;
  workLocationManual.placeholder = 'Enter your work location';

  const workLocationManualField = buildField(doc, 'Work Location', workLocationManual, {
    required: true,
    forId: 'req-work-location-manual',
  });
  workLocationManualField.classList.add('req-field--work-location-manual');
  // Hidden until the dropdown answer is "No".
  workLocationManualField.hidden = true;
  form.appendChild(workLocationManualField);

  // Wire the dropdown to toggle which Work Location field is visible.
  locationCorrect.addEventListener('change', () => {
    const answer = locationCorrect.value;
    workLocationAutoField.hidden = answer !== 'Yes';
    workLocationManualField.hidden = answer !== 'No';
  });

  // ---- 4. Contact Number (required) ----
  const contactNumber = doc.createElement('input');
  contactNumber.type = 'tel';
  contactNumber.id = 'req-contact-number';
  contactNumber.required = true;
  contactNumber.placeholder = 'e.g. +62 812 3456 7890';
  form.appendChild(
    buildField(doc, 'Contact Number', contactNumber, {
      required: true,
      forId: 'req-contact-number',
    })
  );

  // ---- 5. Inactive From (date, required) ----
  const inactiveFrom = doc.createElement('input');
  inactiveFrom.type = 'date';
  inactiveFrom.id = 'req-inactive-from';
  inactiveFrom.required = true;
  form.appendChild(
    buildField(doc, 'Inactive From', inactiveFrom, {
      required: true,
      forId: 'req-inactive-from',
    })
  );

  // ---- 6. Inactive Until (date, required) ----
  const inactiveUntil = doc.createElement('input');
  inactiveUntil.type = 'date';
  inactiveUntil.id = 'req-inactive-until';
  inactiveUntil.required = true;
  form.appendChild(
    buildField(doc, 'Inactive Until', inactiveUntil, {
      required: true,
      forId: 'req-inactive-until',
    })
  );

  // ---- 7. Reason Why Takes Inactive (textarea, required) ----
  const reason = doc.createElement('textarea');
  reason.id = 'req-reason';
  reason.required = true;
  reason.rows = 4;
  reason.placeholder = 'Describe the reason for going inactive';
  form.appendChild(
    buildField(doc, 'Reason Why Takes Inactive', reason, {
      required: true,
      forId: 'req-reason',
    })
  );

  // ---- Decorative submit button + demo note ----
  const submit = doc.createElement('button');
  submit.type = 'submit';
  submit.className = 'req-form__submit';
  submit.textContent = 'Submit Request';
  submit.addEventListener('click', (event) => {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    // Decorative only — submission is disabled in this mockup.
  });
  form.appendChild(submit);

  const note = doc.createElement('p');
  note.className = 'req-form__note';
  note.textContent = 'This is a demo form — submission is disabled.';
  form.appendChild(note);

  section.appendChild(form);
  content.appendChild(section);
}
