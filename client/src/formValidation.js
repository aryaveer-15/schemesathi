export const feedbackId = 'account-form-feedback';

export function checkFields(form, key) {
  const fields = Object.fromEntries([...form.elements]
    .filter((field) => field.id && field.willValidate && !field.validity.valid)
    .map((field) => [field.id, field.validationMessage]));

  return Object.keys(fields).length ? { key, fields } : null;
}

export function fieldFeedback(feedback, name) {
  if (!feedback?.fields || !Object.hasOwn(feedback.fields, name)) return {};
  return { 'aria-invalid': true, 'aria-describedby': feedback.fields[name] ? `${feedbackId}-${name}` : feedbackId };
}
