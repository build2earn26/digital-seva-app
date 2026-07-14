'use client'

import { useState } from 'react'

type SortKey = 'relevance' | 'popularity' | 'newest' | 'academic'
type Props = {
  onQuery: (q: string) => void
  onSort: (s: SortKey) => void
  onOpenFilters: () => void
  sort: SortKey
  activeFilters: number
}

// Expanding search bar: starts as a magnifier icon, expands horizontally to
// full width and grows vertically (text-wrap) for long rural inputs. Sort sits
// to the LEFT, Filters to the RIGHT.
export default function ExpandingSearchBar({
  onQuery,
  onSort,
  onOpenFilters,
  sort,
  activeFilters,
}: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  function submit() {
    onQuery(value)
  }

  return (
    <div className="flex items-start gap-2 w-full">
      {/* LEFT: Sort */}
      <button
        type="button"
        onClick={() => {
          const order: SortKey[] = ['relevance', 'popularity', 'newest', 'academic']
          const next = order[(order.indexOf(sort) + 1) % order.length]
          onSort(next)
        }}
        aria-label="Sort applications"
        className="shrink-0 flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">{labelFor(sort)}</span>
      </button>

      {/* CENTER: Search (icon → wide) */}
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-out ${
          open ? 'ring-2 ring-blue-500 border-blue-500' : 'ring-1 ring-gray-200'
        } rounded-xl bg-white border overflow-hidden flex items-center`}
      >
        <button
          type="button"
          aria-label="Search"
          onClick={() => {
            setOpen(true)
            setTimeout(() => document.getElementById('ds-search-input')?.focus(), 50)
          }}
          className="shrink-0 p-2.5 text-gray-500 hover:text-blue-600"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
        </button>
        <textarea
          id="ds-search-input"
          rows={1}
          value={value}
          placeholder="Search schemes, certificates, services… (type in any language)"
          onChange={(e) => {
            setValue(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
            onQuery(e.target.value)
          }}
          onBlur={() => { if (!value) setOpen(false) }}
          className="flex-1 min-w-0 resize-none bg-transparent py-2.5 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none leading-5"
        />
      </div>

      {/* RIGHT: Filters */}
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label="Filters"
        className="shrink-0 relative flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Filters</span>
        {activeFilters > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center">
            {activeFilters}
          </span>
        )}
      </button>
    </div>
  )
}

function labelFor(s: SortKey): string {
  return { relevance: 'Relevance', popularity: 'Popular', newest: 'New', academic: 'For you' }[s]
}
