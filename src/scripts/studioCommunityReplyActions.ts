export {};

const uuid =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

document.querySelectorAll<HTMLFormElement>(
  '[data-community-member-action]'
).forEach(form => {
  const status = form.querySelector<HTMLElement>(
    '[data-community-action-status]'
  );
  const button = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]'
  );
  const textarea = form.querySelector<HTMLTextAreaElement>(
    'textarea[name="body"]'
  );

  let submitting = false;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (submitting || !form.reportValidity()) return;

    const action = new FormData(form).get('action');

    if (action !== 'edit' && action !== 'delete') return;

    if (action === 'delete' &&
        !window.confirm(
          'Delete this comment? Any replies will remain visible.'
        )) {
      return;
    }

    submitting = true;
    if (button) button.disabled = true;
    if (status) {
      status.hidden = false;
      status.textContent = action === 'edit'
        ? 'Saving your changes.'
        : 'Deleting your comment.';
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: AbortSignal.timeout(15000)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok ||
          typeof result?.id !== 'string' ||
          !uuid.test(result.id)) {
        throw new Error(
          typeof result?.error === 'string'
            ? result.error
            : 'Your change could not be confirmed.'
        );
      }

      if (status) status.textContent = 'Change saved.';
      window.location.reload();
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error
          ? error.message
          : 'The change was not confirmed. Please retry.';
      }

      // Retain edited text and the original revision on failure.
      if (action === 'edit') textarea?.focus();
    } finally {
      submitting = false;
      if (button) button.disabled = false;
    }
  });
});
