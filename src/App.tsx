import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { datasets, datasetTypes, institutions, diseases, drugs, allTags } from "./data";
import type { SortingState } from "@tanstack/react-table";
import type { Dataset, FilterState } from "./types";
import "./styles.css";


const FILTERS = [
  { key: "datasetType", label: "Dataset Type", options: datasetTypes },
  { key: "institution", label: "Institution", options: institutions },
  { key: "disease", label: "Disease", options: diseases },
  { key: "drug", label: "Drug", options: drugs },
] as const satisfies ReadonlyArray<{
  key: keyof FilterState;
  label: string;
  options: readonly string[];
}>;

const EMPTY_FILTERS: FilterState = {
  datasetType: null,
  institution: null,
  disease: null,
  drug: null,
};

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
      } catch {
        /* keep raw */
      }
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          {display}
        </a>
      );
    },
  }),
];

function App() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
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
        if (filters.datasetType && d.datasetType !== filters.datasetType) return false;
        if (filters.institution && d.institution !== filters.institution) return false;
        if (filters.disease && d.disease !== filters.disease) return false;
        if (filters.drug && d.drug !== filters.drug) return false;
        if (activeTags.size > 0 && (d.tags.length === 0 || ![...activeTags].every(t => d.tags.includes(t)))) return false;
        return true;
      }),
    [filters, activeTags],
  );

  // Per-option counts: count rows matching every OTHER active filter,
  // so values update honestly as the user narrows the view.
  const optionCounts = useMemo(() => {
    const result = {
      datasetType: {} as Record<string, number>,
      institution: {} as Record<string, number>,
      disease: {} as Record<string, number>,
      drug: {} as Record<string, number>,
    };
    for (const key of Object.keys(result) as (keyof FilterState)[]) {
      for (const d of datasets) {
        let match = true;
        for (const otherKey of Object.keys(filters) as (keyof FilterState)[]) {
          if (otherKey === key) continue;
          const v = filters[otherKey];
          if (v && d[otherKey] !== v) {
            match = false;
            break;
          }
        }
        if (match) {
          const val = d[key];
          if (val) result[key][val] = (result[key][val] || 0) + 1;
        }
      }
    }
    return result;
  }, [filters]);

  const activeFilters = FILTERS.flatMap((f) => {
    const value = filters[f.key];
    return value ? [{ key: f.key, label: f.label, value }] : [];
  });

  const clearFilter = (key: keyof FilterState) =>
    setFilters((prev) => ({ ...prev, [key]: null }));

  const clearAll = () => setFilters(EMPTY_FILTERS);

  const table = useReactTable({
    data: filteredDatasets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  const hasActiveFilters = activeFilters.length > 0;

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
        <section aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">
            Filters
          </h2>
          <div className="filters">
            {FILTERS.map((f) => (
              <FilterField
                key={f.key}
                id={`f-${f.key}`}
                label={f.label}
                value={filters[f.key]}
                options={f.options}
                counts={optionCounts[f.key]}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, [f.key]: v }))
                }
              />
            ))}
          </div>

          {hasActiveFilters && (
            <div className="chips" aria-label="Active filters">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="chip"
                  onClick={() => clearFilter(f.key)}
                  aria-label={`Remove ${f.label} filter: ${f.value}`}
                >
                  <span className="chip-label">{f.label}:</span>
                  <span className="chip-value">{f.value}</span>
                  <span aria-hidden="true" className="chip-x">
                    ×
                  </span>
                </button>
              ))}
              {activeFilters.length >= 2 && (
                <button type="button" className="clear-all" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>
          )}
        </section>

         {allTags.length > 0 && (
          <div className="tag-bar" aria-label="Filter by tag">
            <span className="tag-bar-label">Tags</span>
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
                Clear tags
              </button>
            )}
          </div>
        )}  
        <p className="count" role="status" aria-live="polite">
          Showing {filteredDatasets.length} of {datasets.length}
        </p>

        <section aria-labelledby="table-heading">
          <h2 id="table-heading" className="sr-only">
            Datasets
          </h2>
          {filteredDatasets.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => {
                        const s = h.column.getIsSorted() as
                          | false
                          | "asc"
                          | "desc";
                        const ariaSort =
                          s === "asc"
                            ? "ascending"
                            : s === "desc"
                              ? "descending"
                              : "none";
                        return (
                          <th key={h.id} scope="col" aria-sort={ariaSort}>
                            <button
                              type="button"
                              className="sort-btn"
                              onClick={h.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                h.column.columnDef.header,
                                h.getContext(),
                              )}
                              <span
                                className="sort-indicator"
                                aria-hidden="true"
                              >
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <p className="empty-msg">
                {hasActiveFilters
                  ? "No datasets match these filters."
                  : "No datasets available."}
              </p>
              {hasActiveFilters && (
                <button type="button" className="clear-all" onClick={clearAll}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

type FilterFieldProps = {
  id: string;
  label: string;
  value: string | null;
  options: readonly string[] | string[];
  counts: Record<string, number>;
  onChange: (v: string | null) => void;
};

function FilterField({
  id,
  label,
  value,
  options,
  counts,
  onChange,
}: FilterFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o} ({counts[o] || 0})
          </option>
        ))}
      </select>
    </div>
  );
}

export default App;


