export function parseDateToUtcMs(date: string, which: "start" | "end") {
  const [yearStr, monthStr, dayStr] = date.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }
  if (which === "start") {
    return Date.UTC(year, month - 1, day, 0, 0, 0, 0)
  }
  return Date.UTC(year, month - 1, day, 23, 59, 59, 999)
}

export function buildMonthRange(fromMs: number, toMs: number) {
  const start = new Date(fromMs)
  const end = new Date(toMs)

  const startYear = start.getUTCFullYear()
  const startMonth = start.getUTCMonth()
  const endYear = end.getUTCFullYear()
  const endMonth = end.getUTCMonth()

  const months: string[] = []
  let year = startYear
  let month = startMonth
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month + 1).padStart(2, "0")}`)
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }
  return months
}

export function getMonthLabelLong(monthKey: string) {
  const [y, m] = monthKey.split("-")
  const year = Number(y)
  const monthIdx = Number(m) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx)) return monthKey

  return new Date(Date.UTC(year, monthIdx, 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  })
}

export function getMonthLabelShort(monthKey: string) {
  const [y, m] = monthKey.split("-")
  const year = Number(y)
  const monthIdx = Number(m) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx)) return monthKey

  return new Date(Date.UTC(year, monthIdx, 1)).toLocaleString("en-US", {
    month: "short",
  })
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatHours(value: number) {
  if (!Number.isFinite(value)) return "—"
  return `${value.toFixed(1)} hrs`
}

export function formatTeamMemberLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return value

  return trimmed
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const letters = word.replace(/[^A-Za-z]/g, "")
      const isAllUpper = letters !== "" && letters === letters.toUpperCase()
      const isAllLower = letters !== "" && letters === letters.toLowerCase()
      const rest = isAllUpper || isAllLower ? word.slice(1).toLowerCase() : word.slice(1)

      return `${word[0]?.toUpperCase() ?? ""}${rest}`
    })
    .join(" ")
}

export function formatRating(value: number) {
  if (!Number.isFinite(value)) return "—"
  return value.toFixed(2)
}

export function formatPercent(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  if (value > 0) return `+ ${formatted}%`
  if (value < 0) return `- ${formatted}%`
  return `${formatted}%`
}

export function percentChange(
  current: number | null | undefined,
  previous: number | null | undefined,
) {
  if (current == null || previous == null) return null
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

