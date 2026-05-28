import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 50;

// Cursor pagination. The fetcher gets { limit, cursor, ...params } and resolves to { data, meta }.
// Returns { items, status, error, hasMore, loadMore, loadingMore, reload, setItems }.
export function usePaged(fetcher, params = {}) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  const paramsRef = useRef(params);
  const requestRef = useRef(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    fetcherRef.current = fetcher;
    paramsRef.current = params;
  });

  const fetchPage = useCallback(async (after, append) => {
    requestRef.current += 1;
    const id = requestRef.current;
    if (append) setLoadingMore(true);
    try {
      const res = await fetcherRef.current({
        limit: PAGE_SIZE,
        ...paramsRef.current,
        ...(after ? { cursor: after } : {}),
      });
      if (id !== requestRef.current) return;
      setItems((prev) => (append ? [...prev, ...res.data] : res.data));
      setCursor(res.meta?.nextCursor ?? null);
      setError(null);
      setStatus('success');
    } catch (err) {
      if (id !== requestRef.current) return;
      setError(err);
      setStatus('error');
    } finally {
      if (append && id === requestRef.current) setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setStatus('loading');
    setItems([]);
    setLoadingMore(false);
    fetchPage(null, false);
  }, [paramsKey, tick, fetchPage]);

  const loadMore = useCallback(() => {
    if (cursor && !loadingMore) fetchPage(cursor, true);
  }, [cursor, loadingMore, fetchPage]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return {
    items,
    status,
    error,
    hasMore: Boolean(cursor),
    loadMore,
    loadingMore,
    reload,
    setItems,
  };
}
