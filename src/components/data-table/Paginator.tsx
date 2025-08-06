import { cn } from "~/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

export default function Paginator({
  currentPage,
  pages,
  onPaginate,
}: {
  currentPage: number;
  pages: (number | "...")[];
  onPaginate?: (page: number) => void;
}) {
  let lastPage = pages.at(-1);

  if (typeof lastPage !== "number") {
    lastPage = 1;
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem className={cn(currentPage <= 1 && "hidden")}>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPaginate?.(currentPage - 1);
            }}
          />
        </PaginationItem>
        {pages.map((page, i) => (
          <PaginationItem key={i}>
            {page === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof page === "number") {
                    onPaginate?.(page);
                  }
                }}
                isActive={page === currentPage}
                href="#"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem className={cn(currentPage >= lastPage && "hidden")}>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPaginate?.(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
