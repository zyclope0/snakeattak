import test from 'node:test';
import assert from 'node:assert/strict';
import { bindPendingConfirm } from '../src/ui/pendingConfirm.ts';

/** The few members of a dialog and of its two buttons that the helper touches. */
function stage() {
  const log: string[] = [];
  const listeners: Record<string, () => void> = {};
  const dialog = {
    open: false,
    showModal() {
      this.open = true;
      log.push('open');
    },
    close() {
      if (this.open) log.push('close');
      this.open = false;
    },
    addEventListener(type: string, listener: () => void) {
      listeners[type] = listener;
    },
  };
  const cancel: { onclick: (() => void) | null } = { onclick: null };
  const confirm: { onclick: (() => void) | null } = { onclick: null };
  const ask = bindPendingConfirm<string>(
    dialog as unknown as HTMLDialogElement,
    cancel as unknown as HTMLElement,
    confirm as unknown as HTMLElement,
    (asked) => log.push(`accept ${asked}`),
  );
  return { log, dialog, ask, cancel, confirm, escape: () => listeners.cancel() };
}

test('what is asked waits for the answer; confirming closes the window, then hands it over', () => {
  const { log, ask, confirm } = stage();
  ask('new adventure');
  assert.deepEqual(log, ['open']);
  confirm.onclick!();
  assert.deepEqual(log, ['open', 'close', 'accept new adventure']);
});

test('the cancel button closes the window and forgets what was asked', () => {
  const { log, ask, cancel, confirm } = stage();
  ask('new adventure');
  cancel.onclick!();
  confirm.onclick!();
  assert.deepEqual(log, ['open', 'close']);
});

test('Escape forgets what was asked; the browser closes the window by itself', () => {
  const { log, dialog, ask, confirm, escape } = stage();
  ask('new adventure');
  escape();
  dialog.close();
  confirm.onclick!();
  assert.deepEqual(log, ['open', 'close']);
});

test('an answer is used once, and the last question replaces the previous one', () => {
  const { log, ask, confirm } = stage();
  ask('first');
  ask('second');
  confirm.onclick!();
  confirm.onclick!();
  assert.deepEqual(log, ['open', 'open', 'close', 'accept second']);
});
