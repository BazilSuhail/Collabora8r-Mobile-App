import { useCallback, useEffect, useRef, useState } from 'react';

// Loads one resource. The fetcher resolves to { data, meta } as the axios layer returns it.
// Returns { status, data, meta, error, reload, setData }.
export function useResource(fetcher, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, meta: null, error: null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let alive = true;
    setState((s) => (s.status === 'loading' && !s.error ? s : { ...s, status: 'loading', error: null }));
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((res) => {
        if (alive) setState({ status: 'success', data: res?.data ?? null, meta: res?.meta ?? null, error: null });
      })
      .catch((error) => {
        if (alive) setState({ status: 'error', data: null, meta: null, error });
      });
    return () => {
      alive = false;
    };
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const setData = useCallback(
    (next) => setState((s) => ({ ...s, data: typeof next === 'function' ? next(s.data) : next })),
    [],
  );

  return { status: state.status, data: state.data, meta: state.meta, error: state.error, reload, setData };
}
