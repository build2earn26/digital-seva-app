// Smart sort for the services feed.
// - Universal eligibility: every service is always returned (never gated).
// - Profile-aligned: users with an academic_track get matching services pushed up.
// - "Not Applicable" / none: falls back to popularity.
// - Recency sub-sort: services created within the last 7 days float to the top
//   (first-come / chronological within the week), then the main sort applies.

export type SortKey = 'relevance' | 'popularity' | 'newest' | 'academic'

export type FeedService = {
  id: string
  title: string
  description: string | null
  category: string
  tags: string[]
  academic_track: string
  popularity: number
  created_at: string
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function sortFeed(
  services: FeedService[],
  sort: SortKey,
  academicTrack: string | null,
  now: number = Date.now()
): FeedService[] {
  const isNew = (s: FeedService) => now - new Date(s.created_at).getTime() <= WEEK_MS

  const byRecencyThenMain = (a: FeedService, b: FeedService) => {
    const an = isNew(a)
    const bn = isNew(b)
    if (an !== bn) return an ? -1 : 1 // new additions always first
    return mainCompare(a, b)
  }

  function mainCompare(a: FeedService, b: FeedService): number {
    switch (sort) {
      case 'popularity':
        return b.popularity - a.popularity
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'academic': {
        // Profile-aligned: matching track first, then popularity fallback.
        const am = academicTrack && a.academic_track === academicTrack ? 1 : 0
        const bm = academicTrack && b.academic_track === academicTrack ? 1 : 0
        if (am !== bm) return bm - am
        return b.popularity - a.popularity
      }
      case 'relevance':
      default:
        return b.popularity - a.popularity
    }
  }

  return [...services].sort(byRecencyThenMain)
}
