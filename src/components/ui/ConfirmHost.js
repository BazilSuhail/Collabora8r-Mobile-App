import { useEffect, useRef, useState } from 'react';
import ConfirmDialog, { requestConfirm, setConfirmHost, useConfirm } from './ConfirmDialog';

export { requestConfirm, useConfirm };

// Mount once near the app root (app/_layout.js), inside the safe-area provider:
//   <ConfirmHost />   or   <ConfirmHost>{children}</ConfirmHost>
// Requests are shown one at a time, in order.
export default function ConfirmHost({ children }) {
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);
  const queue = useRef([]);
  const active = useRef(null);

  const showNext = () => {
    const next = queue.current.shift() ?? null;
    active.current = next;
    setCurrent(next);
    setOpen(Boolean(next));
  };

  useEffect(() => {
    setConfirmHost((opts, resolve) => {
      queue.current.push({ opts, resolve, done: false });
      if (!active.current) showNext();
    });
    return () => setConfirmHost(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (value) => {
    const req = active.current;
    if (!req || req.done) return;
    req.done = true;
    req.resolve(value);
    setOpen(false);
    // Let the sheet animate out, then show the next queued request.
    setTimeout(showNext, 260);
  };

  const opts = current?.opts ?? {};

  return (
    <>
      {children}
      <ConfirmDialog
        open={open}
        onClose={() => finish(false)}
        title={opts.title}
        text={opts.text}
        confirmLabel={opts.confirmLabel}
        tone={opts.tone ?? 'danger'}
        onConfirm={async () => finish(true)}
      />
    </>
  );
}

export { ConfirmHost };
