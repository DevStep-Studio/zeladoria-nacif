import {useEffect, useMemo, useState} from 'react';

export function usePagination(items = [], {pageSize = 10, resetDeps = []} = {}) {
  const [page, setPageState] = useState(1);
  const [size, setSizeState] = useState(pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));

  useEffect(() => {
    setPageState(1);
  }, resetDeps);

  useEffect(() => {
    setPageState(current => Math.min(Math.max(current, 1), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  }, [items, page, size]);

  const setPage = (nextPage) => {
    setPageState(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const setPageSize = (nextSize) => {
    setSizeState(nextSize);
    setPageState(1);
  };

  return {
    page,
    pageSize: size,
    pageItems,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  };
}
