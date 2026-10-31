import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { SkeletonRows } from './Skeleton';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { Select } from './Select';

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Server-paginated table. Filters/page/search/sort live in the URL query string.
 * `columns`: [{ key, header, render?(row), sortKey?, align? }]
 * `data`: { data, page, pageSize, total } (the API list shape) | undefined while loading.
 */
export function DataTable({
  columns,
  data,
  isLoading,
  error,
  onRetry,
  onRowClick,
  searchPlaceholder = 'Search…',
  filters,
  emptyTitle = 'No results.',
  noResultsTitle = 'No results match these filters.',
}) {
  const [params, setParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(params.get('q') ?? '');

  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(params.get('pageSize') ?? 25);
  const sort = params.get('sort') ?? '';
  const hasFilters = [...params.keys()].some((k) => !['page', 'pageSize'].includes(k));

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft) setParam('q', searchDraft);
      else clearParam('q');
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value === undefined || value === null || value === '') next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next, { replace: true });
  }

  function clearParam(key) {
    setParam(key, undefined);
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true });
    setSearchDraft('');
  }

  function toggleSort(key) {
    const asc = `${key}`;
    const desc = `-${key}`;
    setParam('sort', sort === asc ? desc : sort === desc ? undefined : asc);
  }

  function goToPage(p) {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    setParams(next, { replace: true });
  }

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-1"
          />
        </div>
        {filters?.map((f) => (
          <Select
            key={f.key}
            aria-label={f.label}
            value={params.get(f.key) ?? ''}
            onChange={(e) => setParam(f.key, e.target.value)}
            options={f.options}
            placeholder={f.label}
            className="w-auto min-w-[140px]"
          />
        ))}
        {hasFilters && (
          <button onClick={clearAll} className="text-sm text-primary-700 hover:underline">
            Clear all
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={onRetry} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={!c.sortKey ? undefined : sort === c.sortKey ? 'ascending' : sort === `-${c.sortKey}` ? 'descending' : 'none'}
                      className={clsx('px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-600', c.align === 'right' && 'text-right')}
                    >
                      {c.sortKey ? (
                        <button onClick={() => toggleSort(c.sortKey)} className="inline-flex items-center gap-1 hover:text-gray-900">
                          {c.header}
                          {sort === c.sortKey ? <ChevronUp className="h-3 w-3" /> : sort === `-${c.sortKey}` ? <ChevronDown className="h-3 w-3" /> : null}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <SkeletonRows rows={8} cols={columns.length} />
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={clsx('h-11', onRowClick && 'cursor-pointer hover:bg-gray-50')}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={clsx('px-4 py-2 text-gray-900', c.align === 'right' && 'text-right tabular-nums')}>
                          {c.render ? c.render(row) : row[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {!isLoading && rows.length === 0 && <EmptyState title={hasFilters ? noResultsTitle : emptyTitle} />}
          </div>
        )}
      </div>

      {!error && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <span>
            {from}–{to} of {total.toLocaleString('en-IN')}
          </span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              Rows
              <Select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => setParam('pageSize', e.target.value)}
                options={PAGE_SIZES.map((n) => ({ value: n, label: String(n) }))}
                className="w-auto"
              />
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
                className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">{page}</span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={to >= total}
                aria-label="Next page"
                className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reads page/pageSize/sort/q/filters from the URL for the list query. */
export function useListQuery(extraKeys = []) {
  const [params] = useSearchParams();
  const query = {
    page: params.get('page') ?? '1',
    pageSize: params.get('pageSize') ?? '25',
  };
  if (params.get('sort')) query.sort = params.get('sort');
  if (params.get('q')) query.q = params.get('q');
  for (const k of extraKeys) {
    if (params.get(k)) query[k] = params.get(k);
  }
  return query;
}
