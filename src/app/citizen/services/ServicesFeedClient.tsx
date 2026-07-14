'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import ExpandingSearchBar from '@/components/ExpandingSearchBar'
import { searchServices, SearchableService } from '@/lib/search'
import { sortFeed, SortKey, FeedService } from '@/lib/sortFeed'

const ACADEMIC_OPTIONS = [
  { value: 'none', label: 'Not Applicable' }, // HARD REQUIREMENT: first option
  { value: 'school', label: 'Schooling (1–10)' },
  { value: 'higher_ed', label: 'Higher Education / College' },
  { value: 'vocational', label: 'Vocational / ITI / Diploma' },
  { value: 'skill', label: 'Skill / Short-term Training' },
  { value: 'general', label: 'General / Other' },
] as const

export default function ServicesFeed({ initial, initialAcademic = 'none' }: { initial: FeedService[]; initialAcademic?: string }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [academic, setAcademic] = useState<string>(initialAcademic)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [category, setCategory] = useState<string>('all')
  const [activeFilters, setActiveFilters] = useState(0)

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(initial.map((s) => s.category)))],
    [initial]
  )

  const results = useMemo(() => {
    // 1) Hybrid search (forgiving, typo-tolerant).
    const searched: SearchableService[] = query.trim()
      ? searchServices(initial, query)
      : initial
    // 2) Category filter.
    const filtered = category === 'all' ? searched : searched.filter((s) => s.category === category)
    // 3) Smart sort (recency sub-sort + profile alignment).
    const track = academic === 'none' ? null : academic
    return sortFeed(filtered as FeedService[], sort, track)
  }, [initial, query, category, sort, academic])

  function applyCategory(c: string) {
    setCategory(c)
    setActiveFilters((category === 'all' ? 0 : 1) + (academic !== 'none' ? 1 : 0))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header with academic profiling + search */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Government Services</h1>
            <Link href="/citizen" className="text-sm text-blue-600 hover:underline">Dashboard</Link>
          </div>

          {/* Academic profiling — Not Applicable first */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 shrink-0">I am:</label>
            <select
              value={academic}
              onChange={(e) => { setAcademic(e.target.value); applyCategory(category) }}
              className="flex-1 max-w-xs px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white"
            >
              {ACADEMIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <ExpandingSearchBar
            onQuery={setQuery}
            onSort={setSort}
            onOpenFilters={() => setFiltersOpen((v) => !v)}
            sort={sort}
            activeFilters={activeFilters}
          />

          {filtersOpen && (
            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => applyCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    category === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {c === 'all' ? 'All Categories' : c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <p className="text-xs text-gray-400 mb-3">
          {results.length} service{results.length !== 1 && 's'} • Anyone can apply to any service
        </p>
        <div className="grid gap-3">
          {results.map((s) => {
            const isNew = Date.now() - new Date(s.created_at).getTime() <= 7 * 864e5
            const matchesYou = academic !== 'none' && s.academic_track === academic
            return (
              <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{s.title}</h2>
                    {isNew && (
                      <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">NEW</span>
                    )}
                    {matchesYou && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">FOR YOU</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">{s.category}</span>
                    {s.tags.slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">#{t}</span>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/citizen/services/${s.id}/apply`}
                  className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Apply
                </Link>
              </div>
            )
          })}
          {results.length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm">
              No services match “{query}”. Try a simpler word or tap Filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
