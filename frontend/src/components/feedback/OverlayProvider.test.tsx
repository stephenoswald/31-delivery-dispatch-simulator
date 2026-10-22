import { afterEach, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverlayProvider, useFeedback } from './OverlayProvider';
afterEach(cleanup);
function Action() {
  const feedback = useFeedback();
  return (
    <button
      onClick={async () => {
        if (
          await feedback.confirm({
            title: 'Confirm delivery',
            description: 'Has the recipient received the package?',
            action: 'Confirm receipt',
          })
        )
          feedback.toast('Delivery completed.');
      }}
    >
      Finish delivery
    </button>
  );
}
it('requires confirmation before reporting success', async () => {
  render(
    <OverlayProvider>
      <Action />
    </OverlayProvider>,
  );
  const ui = userEvent.setup();
  await ui.click(screen.getByRole('button', { name: 'Finish delivery' }));
  expect(screen.getByRole('dialog').getAttribute('open')).not.toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
  await ui.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.queryByRole('status')).toBeNull();
  await ui.click(screen.getByRole('button', { name: 'Finish delivery' }));
  await ui.click(screen.getByRole('button', { name: 'Confirm receipt' }));
  expect((await screen.findByRole('status')).textContent).toContain('Delivery completed.');
});

it('wraps keyboard focus inside a confirmation dialog', async () => {
  render(
    <OverlayProvider>
      <Action />
    </OverlayProvider>,
  );
  const ui = userEvent.setup();
  await ui.click(screen.getByRole('button', { name: 'Finish delivery' }));
  const last = screen.getByRole('button', { name: 'Confirm receipt' });
  last.focus();
  await ui.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Go back' }));
  await ui.tab({ shift: true });
  expect(document.activeElement).toBe(last);
});
