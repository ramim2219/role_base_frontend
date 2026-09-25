import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  Search,
  X,
  Download,
  Columns3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
} from "lucide-react";

// DataTable — one-file, fully featured data table.
//
// Quick usage:
//
//   <DataTable
//     data={rows}
//     columns={[
//       { key: "name",  header: "Name",  sortable: true },
//       { key: "email", header: "Email" },
//       { key: "role",  header: "Role",  render: (v) => <Badge>{v}</Badge> },
//     ]}
//     selectable
//     actions={{
//       onView:   (row) => {},
//       onEdit:   (row) => {},
//       onDelete: (row) => {},
//     }}
//     bulkActions={(rows, clear) => (
//       <button onClick={() => { clear(); }}>Delete</button>
//     )}
//     title="Users"
//     showExport
//     exportFilename="users"
//   />
//
export default function DataTable({
  // ---------------- DATA ----------------
  data = [],
  columns = [],
  loading = false,
  error = null,

  // ---------------- SEARCH ----------------
  searchable = true,
  searchPlaceholder = "Search...",
  searchKeys,

  // ---------------- SORT ----------------
  sortable = true,
  initialSort = null,

  // ---------------- PAGINATION ----------------
  paginated = true,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],

  // ---------------- SELECTION ----------------
  selectable = false,
  onSelectionChange,
  getRowId = (row) => row.id,

  // ---------------- ACTIONS COLUMN ----------------
  actions = null, // { onView?, onEdit?, onDelete?, custom? (row) => JSX }

  // ---------------- BULK ACTIONS ----------------
  bulkActions = null, // (selectedRows, clearSelection) => JSX

  // ---------------- ROW CLICK ----------------
  onRowClick,

  // ---------------- APPEARANCE ----------------
  title,
  description,
  striped = false,
  dense = false,
  stickyHeader = true,
  emptyMessage = "No data found",
  emptyHint,
  extraActions,
  showExport = false,
  exportFilename = "export", // without .csv

  // ---------------- COLUMN PICKER ----------------
  showColumnPicker = true,
}) {
  // ============ STATE ============
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState([]);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnsOpen, setColumnsOpen] = useState(false);

  // ============ VISIBLE COLUMNS ============
  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumns.includes(c.key)),
    [columns, hiddenColumns]
  );

  // ============ FILTER ============
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return data.filter((row) =>
      keys.some((k) => {
        const val = row[k];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns, searchKeys]);

  // ============ SORT ============
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, direction } = sort;
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return direction === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return direction === "asc" ? -1 : 1;
      if (as > bs) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  // ============ PAGINATE ============
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paged = paginated
    ? sorted.slice((page - 1) * pageSize, page * pageSize)
    : sorted;

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, data.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // ============ SELECTION ============
  const allVisibleSelected =
    paged.length > 0 && paged.every((row) => selected.includes(getRowId(row)));

  const someVisibleSelected =
    !allVisibleSelected && paged.some((row) => selected.includes(getRowId(row)));

  const notifySelection = (ids) => {
    onSelectionChange?.(data.filter((r) => ids.includes(getRowId(r))));
  };

  const toggleAll = () => {
    if (allVisibleSelected) {
      const removeIds = paged.map(getRowId);
      const next = selected.filter((id) => !removeIds.includes(id));
      setSelected(next);
      notifySelection(next);
    } else {
      const addIds = paged.map(getRowId).filter((id) => !selected.includes(id));
      const next = [...selected, ...addIds];
      setSelected(next);
      notifySelection(next);
    }
  };

  const toggleRow = (id) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    notifySelection(next);
  };

  const clearSelection = () => {
    setSelected([]);
    notifySelection([]);
  };

  // ============ SORT HANDLER ============
  const handleSort = (key) => {
    if (!sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  // ============ COLUMN VISIBILITY ============
  const toggleColumn = (key) => {
    setHiddenColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ============ CSV / EXCEL EXPORT ============
  // Exports as .csv (Excel opens CSV natively).
  const handleExport = () => {
    const cols = visibleColumns.filter((c) => c.exportable !== false);

    // Build rows
    const header = cols.map((c) => c.header);
    const body = sorted.map((row) =>
      cols.map((c) => {
        const raw = row[c.key];
        if (raw == null) return "";
        return String(raw);
      })
    );

    // CSV escaping
    const escape = (val) => {
      const s = String(val ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const csv = [header, ...body]
      .map((line) => line.map(escape).join(","))
      .join("\r\n");

    // Prepend BOM so Excel opens UTF-8 correctly
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFilename}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ============ DERIVED ============
  const hasActionsColumn =
    actions &&
    (actions.onView || actions.onEdit || actions.onDelete || actions.custom);

  const cellPad = dense ? "px-4 py-2" : "px-4 py-3";
  const alignClass = (align) =>
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";

  // ============ PAGINATION NUMBERS ============
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  // ============ RENDER ============
  const navBtn =
    "p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300";

  const totalCols =
    visibleColumns.length +
    (selectable ? 1 : 0) +
    (hasActionsColumn ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* ---------------- Header ---------------- */}
      {(title || description) && (
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}

      {/* ---------------- Toolbar ---------------- */}
      {(searchable || showExport || extraActions || showColumnPicker) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {/* Search */}
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {extraActions}

            {/* Column picker */}
            {showColumnPicker && (
              <div className="relative">
                <button
                  onClick={() => setColumnsOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Columns3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Columns</span>
                </button>
                {columnsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setColumnsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-40 py-2 max-h-80 overflow-y-auto">
                      {columns
                        .filter((c) => c.toggleable !== false)
                        .map((c) => (
                          <label
                            key={c.key}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={!hiddenColumns.includes(c.key)}
                              onChange={() => toggleColumn(c.key)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{c.header}</span>
                          </label>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Export */}
            {showExport && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Bulk action bar ---------------- */}
      {selectable && selected.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/40">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selected.length} row{selected.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions?.(selected, clearSelection)}
            <button
              onClick={clearSelection}
              className="text-sm text-blue-700 dark:text-blue-300 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Table ---------------- */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead
            className={`bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 ${
              stickyHeader ? "sticky top-0 z-10" : ""
            }`}
          >
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {/* Select-all cell */}
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <button
                    onClick={toggleAll}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Select all"
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : someVisibleSelected ? (
                      <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                        <span className="block w-2 h-0.5 bg-white" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
              )}

              {/* Data columns */}
              {visibleColumns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`${cellPad} font-semibold whitespace-nowrap ${alignClass(
                      col.align
                    )}`}
                  >
                    {col.sortable !== false && sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className={`inline-flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors`}
                      >
                        {col.header}
                        {isSorted ? (
                          sort.direction === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}

              {/* Actions header */}
              {hasActionsColumn && (
                <th className={`${cellPad} font-semibold text-right`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* Loading */}
            {loading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, r) => (
                <tr
                  key={r}
                  className="border-b border-gray-100 dark:border-gray-700/60"
                >
                  {Array.from({ length: totalCols }).map((__, c) => (
                    <td key={c} className={cellPad}>
                      <div className="h-4 w-full max-w-[160px] rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              /* Error */
              <tr>
                <td
                  colSpan={totalCols}
                  className="px-4 py-10 text-center text-red-600 dark:text-red-400"
                >
                  {error}
                </td>
              </tr>
            ) : paged.length === 0 ? (
              /* Empty */
              <tr>
                <td colSpan={totalCols}>
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-4">
                      <Inbox className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {emptyMessage}
                    </p>
                    {emptyHint && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {emptyHint}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              /* Rows */
              paged.map((row, i) => {
                const id = getRowId(row);
                const isSelected = selected.includes(id);
                const rowBg = isSelected
                  ? "bg-blue-50/60 dark:bg-blue-900/10"
                  : striped && i % 2 === 1
                  ? "bg-gray-50/60 dark:bg-gray-800/40"
                  : "";

                return (
                  <tr
                    key={id ?? i}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-gray-100 dark:border-gray-700/60 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${rowBg} ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {/* Selection cell */}
                    {selectable && (
                      <td
                        className="w-10 px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => toggleRow(id)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          aria-label="Select row"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                    )}

                    {/* Data cells */}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`${cellPad} text-gray-700 dark:text-gray-200 ${alignClass(
                          col.align
                        )}`}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] ?? "—"}
                      </td>
                    ))}

                    {/* Actions cell */}
                    {hasActionsColumn && (
                      <td
                        className={`${cellPad} text-right`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          {actions.onView && (
                            <button
                              onClick={() => actions.onView(row)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {actions.onEdit && (
                            <button
                              onClick={() => actions.onEdit(row)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {actions.onDelete && (
                            <button
                              onClick={() => actions.onDelete(row)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {actions.custom?.(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- Pagination ---------------- */}
      {paginated && !loading && !error && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm">
          {/* Left: count + page size */}
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>
              –
              <span className="font-medium text-gray-800 dark:text-white">
                {Math.min(page * pageSize, totalItems)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {totalItems}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">
                Rows:
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className={navBtn}
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={navBtn}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e-${i}`}
                    className="px-2 text-gray-400 dark:text-gray-500"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[34px] h-[34px] rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className={navBtn}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className={navBtn}
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}