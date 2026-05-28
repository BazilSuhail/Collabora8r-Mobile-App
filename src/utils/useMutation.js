import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { toFieldErrors } from './formErrors';

// Wraps a write call. Returns { run, pending, error, fieldErrors }.
// run(...args) resolves to the call's result on success, or to undefined on failure (error is then set).
// success: a toast string, or (result) => string. error: a toast string, or (err) => string.
// A 422 with field errors fills fieldErrors and shows no toast. A 422 without field errors toasts its message
// (or the error option). Other failures toast only when error is given.
export function useMutation(fn, { success, error: failure } = {}) {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const fnRef = useRef(fn);
  const optsRef = useRef({ success, failure });
  const toastRef = useRef(toast);

  useEffect(() => {
    fnRef.current = fn;
    optsRef.current = { success, failure };
    toastRef.current = toast;
  });

  const run = useCallback(async (...args) => {
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      const result = await fnRef.current(...args);
      const { success: ok } = optsRef.current;
      const message = typeof ok === 'function' ? ok(result) : ok;
      if (message) toastRef.current.success(message);
      return result;
    } catch (err) {
      setError(err);
      const fe = err?.status === 422 ? toFieldErrors(err.errors) : {};
      if (Object.keys(fe).length) {
        setFieldErrors(fe);
      } else {
        const { failure: fail } = optsRef.current;
        const msg = fail ? (typeof fail === 'function' ? fail(err) : fail) : (err?.status === 422 ? err.message : null);
        if (msg) toastRef.current.error(msg);
      }
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error, fieldErrors };
}
