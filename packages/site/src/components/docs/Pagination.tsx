import { useState, type ReactNode, Children } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  children: ReactNode;
  itemsPerPage?: number;
  showPageNumbers?: boolean;
}

function Pagination({
  children,
  itemsPerPage = 5,
  showPageNumbers = true,
}: PaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const childArray = Children.toArray(children);
  const totalPages = Math.ceil(childArray.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = childArray.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return <>{childArray}</>;
  }

  return (
    <div className="w-full">
      <div className="mb-8">{currentItems}</div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 my-8 flex-wrap">
        {/* Previous */}
        <button
          className="flex items-center gap-2 px-4 py-2 bg-background-secondary dark:bg-background-dark-secondary border border-primary/10 dark:border-white/10 rounded-md text-text-primary dark:text-text-dark-primary text-sm font-medium cursor-pointer transition-all hover:border-primary dark:hover:border-text-dark-primary hover:text-primary dark:hover:text-text-dark-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-primary/10"
          onClick={() => void goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={index}
                  className={`min-w-[36px] h-9 flex items-center justify-center px-2 rounded text-sm font-medium cursor-pointer transition-all ${
                    currentPage === page
                      ? "bg-primary dark:bg-text-dark-primary text-white dark:text-background-dark border border-primary dark:border-text-dark-primary"
                      : "bg-transparent border border-transparent text-text-secondary dark:text-text-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
                  }`}
                  onClick={() => void goToPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ) : (
                <span
                  key={index}
                  className="min-w-[36px] h-9 flex items-center justify-center text-text-secondary dark:text-text-dark-secondary text-sm"
                >
                  {page}
                </span>
              )
            )}
          </div>
        )}

        {/* Next */}
        <button
          className="flex items-center gap-2 px-4 py-2 bg-background-secondary dark:bg-background-dark-secondary border border-primary/10 dark:border-white/10 rounded-md text-text-primary dark:text-text-dark-primary text-sm font-medium cursor-pointer transition-all hover:border-primary dark:hover:border-text-dark-primary hover:text-primary dark:hover:text-text-dark-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-primary/10"
          onClick={() => void goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Info */}
      <div className="text-center text-text-secondary dark:text-text-dark-secondary text-xs mt-2">
        Showing {startIndex + 1}-{Math.min(endIndex, childArray.length)} of{" "}
        {childArray.length} items
      </div>
    </div>
  );
}

export default Pagination;
