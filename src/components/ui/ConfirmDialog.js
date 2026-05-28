import { useState } from 'react';
import { Text } from 'react-native';
import CenterModal from './CenterModal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  onClose,
  title,
  text,
  confirmLabel = 'Delete',
  tone = 'danger',
  onConfirm,
}) {
  const [pending, setPending] = useState(false);

  const runConfirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm?.();
      onClose?.('submit');
    } catch {
      // Stays open so the user can retry. The API layer shows the error toast.
    } finally {
      setPending(false);
    }
  };

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      tone={tone}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={() => close()} className="flex-1">
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'ink'}
            loading={pending}
            disabled={pending}
            onClick={runConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      {text ? (
        typeof text === 'string' ? (
          <Text className="text-muted text-[14px] leading-[21px] font-sans">{text}</Text>
        ) : (
          text
        )
      ) : null}
    </CenterModal>
  );
}

// Imperative confirm. The ConfirmHost (src/components/ui/ConfirmHost.js), mounted
// once in the root layout, registers itself here, so requestConfirm works from
// any component or non-React code. Resolves true (confirmed) or false.
let host = null;
const queue = [];

export function setConfirmHost(fn) {
  host = fn;
  if (host) {
    while (queue.length) {
      const { opts, resolve } = queue.shift();
      host(opts, resolve);
    }
  }
}

export function requestConfirm(opts = {}) {
  return new Promise((resolve) => {
    if (host) host(opts, resolve);
    else {
      if (__DEV__) console.warn('requestConfirm: ConfirmHost is not mounted yet; queued.');
      queue.push({ opts, resolve });
    }
  });
}

export function useConfirm() {
  return requestConfirm;
}
