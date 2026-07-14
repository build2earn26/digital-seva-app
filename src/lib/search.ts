// Hybrid, dependency-free search for the Digital Seva services feed.
// Designed for rural users: forgiving of typos, local synonyms, and mixed literacy.
// Combines (1) tokenized keyword matching and (2) light fuzzy/substring matching.
// No external deps — keeps the bundle small for low-bandwidth devices.

export type SearchableService = {
  id: string
  title: string
  description: string | null
  category: string
  tags: string[]
  academic_track: string
}

// Common Indian civic synonyms/typos → canonical tokens.
// Expanded as we learn real query patterns.
const SYNONYMS: Record<string, string[]> = {
  certificate: ['cert', 'certi', 'सर्टिफिकेट'],
  licence: ['license', 'लाइसेंस', 'permif'],
  license: ['licence'],
  income: ['aadhar', 'ration', 'bpl', 'परिवार'],
  caste: ['जाति', 'community'],
  birth: ['जन्म', 'dob'],
  death: ['मृत्यु'],
  ration: ['pds', 'food', 'अन्न'],
  pension: ['वृद्ध', 'oldage'],
  scholarship: ['scholar', 'फेलोशिप', 'study'],
  land: ['जमीन', 'property', 'patta'],
  water: ['jal', 'जल'],
  police: ['fir', 'complaint'],
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function expandTokens(tokens: string[]): string[] {
  const out = new Set(tokens)
  for (const t of tokens) {
    for (const [canon, alts] of Object.entries(SYNONYMS)) {
      if (canon === t || alts.includes(t)) {
        out.add(canon)
        alts.forEach((a) => out.add(a))
      }
    }
  }
  return [...out]
}

// Levenshtein edit distance (bounded) for fuzzy token matching.
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 2) return 3 // too far, prune early
  const dp = Array.from({ length: m + 1 }, (_, i) => i)
  for (let j = 1; j <= n; j++) {
    let prev = dp[0]
    dp[0] = j
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i]
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      prev = tmp
    }
  }
  return dp[m]
}

function tokenize(text: string): string[] {
  return expandTokens(normalize(text).split(' ').filter(Boolean))
}

export function searchServices(
  services: SearchableService[],
  rawQuery: string
): SearchableService[] {
  const query = rawQuery.trim()
  if (!query) return services

  const qTokens = tokenize(query)
  const qText = normalize(query)

  const scored = services.map((svc) => {
    const haystack = [
      svc.title,
      svc.description ?? '',
      svc.category,
      ...svc.tags,
    ].join(' ')
    const hTokens = tokenize(haystack)
    const hText = normalize(haystack)

    let score = 0

    // (1) Exact token overlap — strongest signal.
    for (const qt of qTokens) {
      if (hTokens.includes(qt)) score += 5
    }

    // (2) Substring / partial — handles longer typed terms.
    if (hText.includes(qText)) score += 4
    for (const qt of qTokens) {
      if (qt.length >= 3 && hText.includes(qt)) score += 2
    }

    // (3) Fuzzy token match (typo tolerance, distance <= 2).
    for (const qt of qTokens) {
      if (qt.length < 3) continue
      for (const ht of hTokens) {
        if (ht.length >= 3 && editDistance(qt, ht) <= 2) {
          score += 1
          break
        }
      }
    }

    return { svc, score }
  })

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.svc)
}
