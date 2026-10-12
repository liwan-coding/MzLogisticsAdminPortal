const DEFAULT_TRIP_LOAD_LIMIT_TONS = 25

function asNumber(value?: string | number | null) {
  if (value == null || value === '') return 0
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export function tripLoadTons(capacity?: string | number | null, limit?: string | number | null) {
  const capacityTons = asNumber(capacity)
  const hasLimit = limit != null && limit !== ''
  const limitTons = hasLimit
    ? asNumber(limit)
    : Math.min(DEFAULT_TRIP_LOAD_LIMIT_TONS, capacityTons || DEFAULT_TRIP_LOAD_LIMIT_TONS)
  if (capacityTons <= 0) return limitTons > 0 ? limitTons : 0
  if (limitTons <= 0) return capacityTons
  return Math.min(capacityTons, limitTons)
}

export { DEFAULT_TRIP_LOAD_LIMIT_TONS }
