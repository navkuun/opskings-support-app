function isWhitespace(value: string) {
  return /\s/.test(value)
}

function getRank(query: string, text: string) {
  const q = query.toLowerCase()
  const t = text.toLowerCase()

  let rank = 0
  let queryIndex = 0
  let textIndex = 0
  let multiplier = 10

  while (queryIndex < q.length && textIndex < t.length) {
    if (q[queryIndex] === t[textIndex]) {
      rank += 1 * multiplier
      queryIndex += 1
      multiplier = 1.1
    } else {
      multiplier = isWhitespace(t[textIndex]) ? 5 : 1
    }
    textIndex += 1
  }

  if (queryIndex < q.length) {
    return 0
  }

  return rank
}

export function fuzzySearch<T>(
  searchQuery: string,
  items: readonly T[],
  itemToString: (item: T) => string,
) {
  const query = searchQuery.trim()
  if (!query) return [...items]

  const ranked = items
    .map((item) => ({
      item,
      rank: getRank(query, itemToString(item)),
    }))
    .filter((result) => result.rank > 0)

  ranked.sort((a, b) => {
    if (b.rank === a.rank) {
      return itemToString(a.item).localeCompare(itemToString(b.item))
    }
    return b.rank - a.rank
  })

  return ranked.map((result) => result.item)
}

