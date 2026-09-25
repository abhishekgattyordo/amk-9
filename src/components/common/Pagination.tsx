import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
  darkMode: boolean;
  itemsPerPageOptions?: number[];
  itemName?: string; // e.g., 'materials', 'users', 'items'
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  darkMode,
  itemsPerPageOptions = [5, 10, 25, 50],
  itemName = 'items'
}) => {
  const activePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  
  const indexOfLastItem = Math.min(activePage * itemsPerPage, totalItems);
  const indexOfFirstItem = totalItems === 0 ? 0 : (activePage - 1) * itemsPerPage + 1;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (activePage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (activePage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold ${
      darkMode ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50/60 text-slate-600'
    }`}>
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
        {onItemsPerPageChange && (
          <div className="flex items-center space-x-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className={`px-2 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {itemsPerPageOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>items</span>
          </div>
        )}
        <div className="flex items-center">
          {onItemsPerPageChange && <span className="hidden sm:inline mx-2 text-slate-300 dark:text-slate-700">|</span>}
          <span>
            Showing <span className={darkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{indexOfFirstItem}-{indexOfLastItem}</span> of <span className={darkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{totalItems}</span> {itemName}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
        <button
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage === 1}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex-shrink-0 ${
            activePage === 1
              ? 'opacity-40 cursor-not-allowed'
              : darkMode
                ? 'border-slate-700 hover:bg-slate-800 text-white'
                : 'border-slate-200 hover:bg-slate-100 text-slate-800'
          }`}
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`dots-${idx}`} className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center flex-shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }

          const pageNum = page as number;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-center transition-all cursor-pointer flex-shrink-0 ${
                activePage === pageNum
                  ? 'bg-emerald-600 text-white font-bold'
                  : darkMode
                    ? 'hover:bg-slate-800 text-slate-300 border border-transparent hover:border-slate-700'
                    : 'hover:bg-slate-100 text-slate-700 border border-transparent hover:border-slate-300'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage === totalPages}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex-shrink-0 ${
            activePage === totalPages
              ? 'opacity-40 cursor-not-allowed'
              : darkMode
                ? 'border-slate-700 hover:bg-slate-800 text-white'
                : 'border-slate-200 hover:bg-slate-100 text-slate-800'
          }`}
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
