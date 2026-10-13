export type PricingBasis = 'trip' | 'ton'

export function billableTripCount(truckCount: number, tripCount: number): number | null {
  if (!Number.isInteger(truckCount) || truckCount < 1 || !Number.isInteger(tripCount) || tripCount < 1) {
    return null
  }

  return Math.max(truckCount, tripCount)
}

export function quotationTotal(pricePerTrip: number, trips: number): number {
  return roundQuoteMoney(pricePerTrip * trips)
}

export function tonQuotationTotal(pricePerTon: number, weightTons: number): number {
  return roundQuoteMoney(pricePerTon * weightTons)
}

export function additionalQuoteAmount(value: string): number {
  const trimmed = value.trim()
  if (trimmed === '') return 0
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0) return 0
  return roundQuoteMoney(amount)
}

export function payableQuotationTotal(transport: number, additional: number): number {
  const extra = Number.isFinite(additional) && additional > 0 ? additional : 0
  return roundQuoteMoney(transport + extra)
}

export function shipmentWeightTons(value?: string | number | null): number | null {
  if (value == null || value === '') return null
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

function roundQuoteMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}
