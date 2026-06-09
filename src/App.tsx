import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { datasets, allTags } from "./data";
import type { Dataset } from "./types";
import "./styles.css";

const columnHelper = createColumnHelper<Dataset>();

const columns = [
  columnHelper.accessor("researcher", { header: "Researcher" }),
  columnHelper.accessor("researcherEmail", {
    header: "Email",
    cell: (info) => (
      <a href={`mailto:${info.getValue()}`} className="link">
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor("institution", { header: "Institution" }),
  columnHelper.accessor("datasetName", { header: "Dataset" }),
  columnHelper.accessor("datasetDescription", {
    header: "Description",
    cell: (info) => (
      <span className="desc" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("datasetType", { header: "Type" }),
  columnHelper.accessor("disease", {
    header: "Disease",
    cell: (info) => info.getValue() || <span className="null">—</span>,
  }),
  columnHelper.accessor("drug", {
    header: "Drug",
    cell: (info) => info.getValue() || <span className="null">—</span>,
  }),
  columnHelper.accessor("url", {
    header: "Source",
    cell: (info) => {
      const url = info.getValue();
      if (!url) return <span className="null">—</span>;
      let display = url;
      try {
        display = new URL(url).host.replace(/^www\./, "");
      } catch { /* keep raw */ }
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="link">
          {display}
        </a>
      );
    },
  }),
];

function App() {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const filteredDatasets = useMemo(
    () =>
      datasets.filter((d) => {
        if (activeTags.size === 0) return true;
        const datasetTags = [...d.tags, d.institution].filter(Boolean);
        return [...activeTags].every(t => datasetTags.includes(t));
      }),
    [activeTags],
  );

  const table = useReactTable({
    data: filteredDatasets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <>
      <header className="header">
        <div className="wrap">
          <img
            src={`${import.meta.env.BASE_URL}white_horz_logo.jpg`}
            alt="Trident Preclinical Trials"
            className="logo"
          />
          <h1 className="title">Data Hub</h1>
        </div>
      </header>

      <main className="wrap main">
        {/* Tag filter bar */}
        <section aria-labelledby="tags-heading">
          <h2 id="tags-heading" className="sr-only">Tags</h2>
          <div className="tag-bar">
            <span className="tag-bar-label">Filter by tag</span>
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag-pill ${activeTags.has(tag) ? "tag-pill--active" : ""}`}
                onClick={() => toggleTag(tag)}
                aria-pressed={activeTags.has(tag)}
              >
                {tag}
              </button>
            ))}
            {activeTags.size > 0 && (
              <button
                type="button"
                className="clear-all"
                onClick={() => setActiveTags(new Set())}
              >
                Clear all
              </button>
            )}
          </div>
        </section>

        <p className="count" role="status" aria-live="polite">
          Showing {filteredDatasets.length} of {datasets.length}
        </p>

        {/* Table */}
        <section aria-labelledby="table-heading">
          <h2 id="table-heading" className="sr-only">Datasets</h2>
          {filteredDatasets.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => {
                        const s = h.column.getIsSorted() as false | "asc" | "desc";
                        return (
                          <th key={h.id} scope="col"
                            aria-sort={s === "asc" ? "ascending" : s === "desc" ? "descending" : "none"}>
                            <button type="button" className="sort-btn"
                              onClick={h.column.getToggleSortingHandler()}>
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              <span className="sort-indicator" aria-hidden="true">
                                {s === "asc" ? "↑" : s === "desc" ? "↓" : "↕"}
                              </span>
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <p className="empty-msg">No datasets match these tags.</p>
              <button type="button" className="clear-all"
                onClick={() => setActiveTags(new Set())}>
                Clear tags
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default App;