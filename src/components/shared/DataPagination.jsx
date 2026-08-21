import React from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

const getVisiblePages = (page, totalPages) => {
  if (totalPages <= 5) return Array.from({length: totalPages}, (_, index) => index + 1);

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return Array.from(pages)
    .filter(value => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
};

export default function DataPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'registros',
}) {
  if (totalItems <= pageSizeOptions[0] && totalPages <= 1) return null;

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-slate-500">
        Mostrando {start}-{end} de {totalItems} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-9 w-[112px] rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(option => (
              <SelectItem key={option} value={String(option)}>
                {option} / página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-2"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {visiblePages.map((pageNumber, index) => {
            const previous = visiblePages[index - 1];
            const showGap = previous && pageNumber - previous > 1;
            return (
              <React.Fragment key={pageNumber}>
                {showGap && <span className="px-1 text-xs font-bold text-slate-300">...</span>}
                <Button
                  type="button"
                  variant={pageNumber === page ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 w-9 rounded-xl px-0"
                  onClick={() => onPageChange(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                >
                  {pageNumber}
                </Button>
              </React.Fragment>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-2"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
