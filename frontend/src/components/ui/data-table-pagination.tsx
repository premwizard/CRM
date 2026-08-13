"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface DataTablePaginationProps {
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export function DataTablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const { page, pageSize, totalItems, totalPages, hasPreviousPage, hasNextPage } =
    pagination;

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-4 bg-card border-t border-border rounded-b-lg text-xs">
      {/* Items Summary & Page Size Selector */}
      <div className="flex items-center gap-4 text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{startItem}</strong> to{" "}
          <strong className="text-foreground">{endItem}</strong> of{" "}
          <strong className="text-foreground">{totalItems}</strong> entries
        </span>

        <div className="flex items-center gap-2 border-l border-border pl-4">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 bg-background border border-input rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground mr-2 font-medium">
          Page <strong className="text-foreground">{page}</strong> of{" "}
          <strong className="text-foreground">{totalPages}</strong>
        </span>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className={`p-1.5 rounded border border-border transition-colors ${
            hasPreviousPage
              ? "hover:bg-accent text-foreground cursor-pointer"
              : "opacity-40 text-muted-foreground cursor-not-allowed"
          }`}
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={`p-1.5 rounded border border-border transition-colors ${
            hasNextPage
              ? "hover:bg-accent text-foreground cursor-pointer"
              : "opacity-40 text-muted-foreground cursor-not-allowed"
          }`}
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
