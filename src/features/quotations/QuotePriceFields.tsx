import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import {
  additionalQuoteAmount,
  billableTripCount,
  payableQuotationTotal,
  quotationTotal,
  shipmentWeightTons,
  tonQuotationTotal,
  type PricingBasis,
} from '@/features/quotations/quotationPrice.ts'
import { FormField } from '@/shared/components/FormField.tsx'
import { formatMoney } from '@/shared/utils/format.ts'

export function QuotePriceFields({
  idPrefix,
  basis,
  price,
  truckCount,
  tripCount,
  weightTons,
  disabled = false,
  onBasisChange,
  onPriceChange,
}: {
  idPrefix: string
  basis: PricingBasis
  price: string
  truckCount: string
  tripCount: string
  weightTons?: string | number | null
  disabled?: boolean
  onBasisChange: (basis: PricingBasis) => void
  onPriceChange: (price: string) => void
}) {
  const { t } = useTranslation()
  const labelId = useId()
  const weight = shipmentWeightTons(weightTons)
  const trips = billableTripCount(Number(truckCount), Number(tripCount))
  const unit = Number(price)
  const priced = price.trim() !== '' && Number.isFinite(unit) && unit > 0
  const total =
    !priced
      ? null
      : basis === 'ton'
        ? weight != null
          ? tonQuotationTotal(unit, weight)
          : null
        : trips != null
          ? quotationTotal(unit, trips)
          : null

  return (
    <>
      <div className="mz-field">
        <label id={labelId}>{t('quotations.pricingBasis')}</label>
        <div className="mz-segment" role="radiogroup" aria-labelledby={labelId}>
          <label className={basis === 'trip' ? 'is-active' : undefined}>
            <input
              type="radio"
              name={`${idPrefix}-pricing-basis`}
              checked={basis === 'trip'}
              disabled={disabled}
              onChange={() => onBasisChange('trip')}
            />
            {t('quotations.perTrip')}
          </label>
          <label className={basis === 'ton' ? 'is-active' : undefined}>
            <input
              type="radio"
              name={`${idPrefix}-pricing-basis`}
              checked={basis === 'ton'}
              disabled={disabled || weight == null}
              onChange={() => onBasisChange('ton')}
            />
            {t('quotations.perTon')}
          </label>
        </div>
        {weight == null ? <span className="mz-field__hint">{t('quotations.perTonUnavailable')}</span> : null}
      </div>
      <FormField
        label={basis === 'ton' ? t('quotations.pricePerTon') : t('quotations.pricePerTrip')}
        htmlFor={`${idPrefix}-price`}
        required
        hint={basis === 'ton' ? t('quotations.pricePerTonHint') : t('quotations.pricePerTripHint')}
      >
        <input
          id={`${idPrefix}-price`}
          className="mz-input"
          inputMode="decimal"
          value={price}
          disabled={disabled || (basis === 'ton' && weight == null)}
          onChange={(event) => onPriceChange(event.target.value)}
          required
        />
      </FormField>
      {total != null && basis === 'trip' && trips != null ? (
        <p className="mz-offer__hint">{t('quotations.calculatedTotal', { amount: formatMoney(total), count: trips })}</p>
      ) : null}
      {total != null && basis === 'ton' && weight != null ? (
        <p className="mz-offer__hint">
          {t('quotations.calculatedTonTotal', { amount: formatMoney(total), weight: formatWeight(weight) })}
        </p>
      ) : null}
    </>
  )
}

export function QuotePayableHint({
  transport,
  additionalCosts,
}: {
  transport: number | null
  additionalCosts: string
}) {
  const { t } = useTranslation()
  const extra = additionalQuoteAmount(additionalCosts)
  if (transport == null || extra <= 0) return null
  const payable = payableQuotationTotal(transport, extra)

  return (
    <p className="mz-offer__hint">
      {t('quotations.payableTotal', { amount: formatMoney(payable), extra: formatMoney(extra) })}
    </p>
  )
}

function formatWeight(weight: number) {
  return String(Math.round((weight + Number.EPSILON) * 1000) / 1000)
}
