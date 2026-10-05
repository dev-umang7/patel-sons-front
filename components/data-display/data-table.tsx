"use client";

import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
  type ReactTable,
  type Row,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Columns3, ListFilter, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, type MouseEvent, type ReactNode } from "react";
import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { NativeSelect, SearchInput } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/overlays";
import { formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface DataColumnMeta {
  align?: "start" | "end";
  /** Name shown in the column-visibility menu when the header is not plain text. */
  label?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface FilterableRow {
  getValue: (columnId: string) => unknown;
}

/** Multi-select filter: keeps rows whose value is one of the selected options. */
function inSet(row: FilterableRow, columnId: string, filterValue: unknown): boolean {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  return filterValue.includes(String(row.getValue(columnId)));
}
inSet.autoRemove = (value: unknown) => !Array.isArray(value) || value.length === 0;

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic, datetime: sortFn_datetime },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString, inSet },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature,
  rowSelectionFeature,
  columnMeta: metaHelper<DataColumnMeta>(),
});

export type DataTableFeatures = typeof dataTableFeatures;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous column value types
export type DataColumn<T extends RowData> = ColumnDef<DataTableFeatures, T, any>;
export type DataRow<T extends RowData> = Row<DataTableFeatures, T>;

export function columnHelper<T extends RowData>() {
  return createColumnHelper<DataTableFeatures, T>();
}

export interface FacetFilter {
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface DataTableProps<T extends RowData> {
  data: T[];
  columns: DataColumn<T>[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  searchLabel?: string;
  filters?: FacetFilter[];
  initialSorting?: SortingState;
  initialVisibility?: ColumnVisibilityState;
  initialFilters?: { id: string; value: string[] }[];
  pageSize?: number;
  selectable?: boolean;
  bulkActions?: (rows: T[], clear: () => void) => ReactNode;
  rowHref?: (row: T) => string;
  /** Alternative to rowHref, e.g. to open a drawer. */
  onRowClick?: (row: T) => void;
  initialSearch?: string;
  mobileCard?: (row: T) => ReactNode;
  toolbarExtra?: ReactNode;
  emptyState?: ReactNode;
  entityName?: { singular: string; plural: string };
  dense?: boolean;
  className?: string;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function DataTable<T extends RowData>({
  data,
  columns: baseColumns,
  getRowId,
  searchPlaceholder = "Search…",
  searchLabel = "Search table",
  filters = [],
  initialSorting = [],
  initialVisibility = {},
  initialFilters = [],
  pageSize = 25,
  selectable = false,
  bulkActions,
  rowHref,
  onRowClick: onRowSelect,
  initialSearch = "",
  mobileCard,
  toolbarExtra,
  emptyState,
  entityName = { singular: "row", plural: "rows" },
  dense = false,
  className,
}: DataTableProps<T>) {
  const router = useRouter();

  const columns = useMemo<DataColumn<T>[]>(() => {
    if (!selectable) return baseColumns;
    const select: DataColumn<T> = {
      id: "__select",
      enableSorting: false,
      enableHiding: false,
      enableGlobalFilter: false,
      meta: { label: "Select", headerClassName: "w-10", cellClassName: "w-10" },
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows on this page"
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox aria-label="Select row" checked={row.getIsSelected()} onClick={(e) => { e.stopPropagation(); row.getToggleSelectedHandler()(e); }} />
      ),
    };
    return [select, ...baseColumns];
  }, [baseColumns, selectable]);

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId: (row) => getRowId(row),
    initialState: {
      sorting: initialSorting,
      columnVisibility: initialVisibility,
      columnFilters: initialFilters,
      pagination: { pageIndex: 0, pageSize },
      globalFilter: initialSearch,
    },
    globalFilterFn: "includesString",
    enableSortingRemoval: false,
  });

  const state = table.state;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasActiveFilters = Boolean(state.globalFilter) || state.columnFilters.length > 0;
  const { pageIndex, pageSize: size } = state.pagination;
  const from = filteredCount === 0 ? 0 : pageIndex * size + 1;
  const to = Math.min(filteredCount, (pageIndex + 1) * size);

  const resetFilters = () => {
    table.setGlobalFilter("");
    table.setColumnFilters([]);
  };

  const clickable = Boolean(rowHref || onRowSelect);
  const onRowClick = (e: MouseEvent, row: T) => {
    if (!clickable) return;
    const target = e.target as HTMLElement;
    if (target.closest("a,button,input,[role=checkbox],[role=menuitem]")) return;
    if (onRowSelect) return onRowSelect(row);
    if (!rowHref) return;
    if (e.metaKey || e.ctrlKey) window.open(rowHref(row), "_blank");
    else router.push(rowHref(row));
  };

  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-xs", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle p-3">
        <SearchInput label={searchLabel} value={String(state.globalFilter ?? "")} onValueChange={(v) => table.setGlobalFilter(v)} placeholder={searchPlaceholder} className="w-full sm:w-64" />
        {filters.map((f) => (
          <FacetFilterControl key={f.columnId} filter={f} table={table} />
        ))}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X /> Reset
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {toolbarExtra}
          <span className="num hidden text-xs text-fg-muted sm:inline">
            {formatNumber(filteredCount)} {filteredCount === 1 ? entityName.singular : entityName.plural}
          </span>
          {hideable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" aria-label="Choose columns">
                  <Columns3 /> <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                {hideable.map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(v === true)} onSelect={(e) => e.preventDefault()}>
                    {c.columnDef.meta?.label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      <AnimatePresence initial={false}>
        {selectable && selected.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition.base} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface-selected px-3 py-2">
              <span className="text-sm font-medium">{formatNumber(selected.length)} selected</span>
              <div className="flex flex-wrap items-center gap-2">{bulkActions?.(selected, () => table.resetRowSelection())}</div>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => table.resetRowSelection()}>
                Clear selection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data.length === 0 ? (
        emptyState ?? <EmptyState title={`No ${entityName.plural} yet`} description={`${entityName.plural[0].toUpperCase()}${entityName.plural.slice(1)} will appear here once they are recorded.`} />
      ) : filteredCount === 0 ? (
        <EmptyState
          icon={ListFilter}
          title={`No ${entityName.plural} match these filters`}
          description="Try a different search term, or clear the filters to see everything."
          action={
            <Button size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {mobileCard && (
            <ul className="divide-y divide-border-subtle md:hidden">
              {rows.map((row) => (
                <li key={row.id} onClick={(e) => onRowClick(e, row.original)} className={cn("px-4 py-3", clickable && "cursor-pointer active:bg-surface-hover")}>
                  {mobileCard(row.original)}
                </li>
              ))}
            </ul>
          )}
          <div className={cn("scrollbar-thin overflow-x-auto", mobileCard && "hidden md:block")}>
            <table className="w-full border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id} className="border-b border-border">
                    {group.headers.map((header) => {
                      const meta = header.column.columnDef.meta;
                      const sorted = header.column.getIsSorted();
                      const canSort = header.column.getCanSort();
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                          className={cn("h-9 px-3 text-left text-xs font-medium whitespace-nowrap text-fg-muted first:pl-4 last:pr-4", meta?.align === "end" && "text-right", meta?.headerClassName)}
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className={cn("-mx-1 inline-flex items-center gap-1 rounded-sm px-1 hover:text-fg", meta?.align === "end" && "flex-row-reverse", sorted && "text-fg")}
                            >
                              <table.FlexRender header={header} />
                              {sorted === "asc" ? <ArrowUp className="size-3" /> : sorted === "desc" ? <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    data-selected={row.getIsSelected() || undefined}
                    onClick={(e) => onRowClick(e, row.original)}
                    className={cn("border-b border-border-subtle transition-colors last:border-0 hover:bg-surface-hover data-[selected]:bg-surface-selected", clickable && "cursor-pointer")}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta;
                      return (
                        <td key={cell.id} className={cn("px-3 align-middle first:pl-4 last:pr-4", dense ? "h-10" : "h-12", meta?.align === "end" && "num text-right whitespace-nowrap", meta?.cellClassName)}>
                          <table.FlexRender cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-2.5 text-xs text-fg-muted">
            <span className="num">
              {formatNumber(from)}–{formatNumber(to)} of {formatNumber(filteredCount)}
            </span>
            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 sm:flex">
                Rows
                <NativeSelect aria-label="Rows per page" value={size} onChange={(e) => table.setPageSize(Number(e.target.value))} className="h-7 w-[68px] text-xs">
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect>
              </label>
              <span className="num">
                Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="icon-sm" aria-label="Previous page" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                  <ChevronLeft />
                </Button>
                <Button variant="secondary" size="icon-sm" aria-label="Next page" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FacetFilterControl<T extends RowData>({ filter, table }: { filter: FacetFilter; table: ReactTable<DataTableFeatures, T> }) {
  const column = table.getColumn(filter.columnId);
  const value = (column?.getFilterValue() as string[] | undefined) ?? [];
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of table.getCoreRowModel().rows) {
      const v = String(r.getValue(filter.columnId));
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    return map;
  }, [table, filter.columnId]);
  if (!column) return null;

  const toggle = (option: string) => {
    const next = value.includes(option) ? value.filter((v) => v !== option) : [...value, option];
    column.setFilterValue(next.length ? next : undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className={cn("border-dashed", value.length > 0 && "border-solid border-primary/40 bg-primary-soft text-primary-soft-fg")}>
          <ListFilter />
          {filter.label}
          {value.length > 0 && <span className="num rounded-sm bg-surface px-1 text-2xs text-fg">{value.length}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="px-2 pt-1.5 pb-1 text-2xs font-medium tracking-wide text-fg-muted uppercase">{filter.label}</div>
        <div className="scrollbar-thin max-h-72 overflow-y-auto">
          {filter.options.map((o) => (
            <label key={o.value} className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-surface-hover">
              <Checkbox checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
              <span className="flex-1 truncate">{o.label}</span>
              <span className="num text-xs text-fg-muted">{counts.get(o.value) ?? 0}</span>
            </label>
          ))}
        </div>
        {value.length > 0 && (
          <button type="button" onClick={() => column.setFilterValue(undefined)} className="mt-1 w-full rounded-md border-t border-border-subtle px-2 py-1.5 text-left text-xs text-fg-muted hover:text-fg">
            Clear {filter.label.toLowerCase()}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
