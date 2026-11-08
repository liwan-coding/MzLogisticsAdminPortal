import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrganization, verifyOrganization } from '@/core/api/services.ts'
import { api, getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { ORGANIZATION_VERIFY_STATUSES } from '@/core/constants/statuses.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { displayValue, enumString, formatDate, formatPaymentTerms, isCustomerOrganization, organizationName } from '@/shared/utils/format.ts'
import type { OrganizationDocument } from '@/core/api/types.ts'

function ContactValue({ value, href }: { value?: string | null; href: string }) {
  if (!value) {
    return displayValue(null)
  }

  return (
    <a className="mz-link" href={href}>
      {value}
    </a>
  )
}

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const { hasPermission } = useAuth()
  const query = useQuery({ queryKey: ['organization', id], queryFn: () => fetchOrganization(id), enabled: Boolean(id) })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const org = query.data
  const primaryName = organizationName(org)
  const secondaryName = i18n.language.startsWith('ar')
    ? org.name && org.name !== primaryName
      ? org.name
      : null
    : org.name_ar && org.name_ar !== primaryName
      ? org.name_ar
      : null

  if (enumString(org.type) === 'provider') {
    return <Navigate to={`/providers/${org.id}`} replace />
  }

  if (enumString(org.type) && !isCustomerOrganization(org)) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  return (
    <>
      <PageHeader
        title={primaryName}
        subtitle={t('customers.detailTitle')}
        crumbs={[{ label: t('customers.title'), to: '/customers' }, { label: primaryName }]}
        actions={
          <>
            {hasPermission(PERMISSIONS.CUSTOMERS_MANAGE) ? (
              <Link className="mz-btn mz-btn--ghost" to={`/customers/${org.id}/edit`}>
                {t('common.edit')}
              </Link>
            ) : null}
            {org.status === 'active' && hasPermission(PERMISSIONS.SHIPMENTS_MANAGE) ? (
              <Link className="mz-btn mz-btn--primary" to={`/shipments/new?customer=${org.id}`}>
                {t('shipments.createForCustomer')}
              </Link>
            ) : null}
            <StatusBadge status={org.status} />
          </>
        }
      />
      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <IconWell name="customers" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{primaryName}</h2>
                {secondaryName ? <p className="mz-profile__aka">{secondaryName}</p> : null}
                <div className="mz-profile__contacts">
                  {org.email ? (
                    <a className="mz-profile__chip" href={`mailto:${org.email}`} dir="ltr">
                      <AppIcon name="email" />
                      {org.email}
                    </a>
                  ) : null}
                  {org.phone ? (
                    <a className="mz-profile__chip" href={`tel:${org.phone}`} dir="ltr">
                      <AppIcon name="phone" />
                      {org.phone}
                    </a>
                  ) : null}
                  {org.city ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="city" />
                      {org.city}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="phone" title={t('customers.contactSection')} />
            <InfoGrid
              variant="contact"
              fields={[
                {
                  icon: 'email',
                  label: t('common.email'),
                  value: org.email ? <ContactValue value={org.email} href={`mailto:${org.email}`} /> : null,
                  dir: 'ltr',
                  singleLine: true,
                },
                {
                  icon: 'phone',
                  label: t('common.phone'),
                  value: org.phone ? <ContactValue value={org.phone} href={`tel:${org.phone}`} /> : null,
                  dir: 'ltr',
                },
                { icon: 'city', label: t('common.city'), value: org.city },
                { icon: 'tracking', label: t('common.country'), value: org.country },
                { icon: 'city', label: t('common.address'), value: org.address, wide: true },
              ]}
            />
          </div>
        </section>
        <div className="mz-stack">
          {org.account_type === 'individual' ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="profile" title={t('customers.identitySection')} />
                <IdentityCardDocuments documents={org.identity_documents} />
              </div>
            </section>
          ) : (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="providers" title={t('customers.companySection')} />
                <InfoGrid
                  fields={[
                    { icon: 'invoices', label: t('customers.commercialRegister'), value: org.commercial_register, dir: 'ltr' },
                    { icon: 'quotations', label: t('customers.taxNumber'), value: org.tax_number, dir: 'ltr' },
                  ]}
                />
              </div>
            </section>
          )}
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="roles" title={t('customers.accountSection')} />
              <InfoGrid
                fields={[
                  { icon: 'profile', label: t('common.name'), value: org.name, dir: org.name && /[A-Za-z]/.test(org.name) ? 'ltr' : undefined },
                  { icon: 'profile', label: t('customers.nameAr'), value: org.name_ar },
                  { icon: 'roles', label: t('customers.accountType'), value: org.account_type ? t(`status.${org.account_type}`) : null },
                  { icon: 'roles', label: t('common.status'), value: <StatusBadge status={org.status} /> },
                  { icon: 'calendar', label: t('common.createdAt'), value: formatDate(org.created_at) },
                ]}
              />
            </div>
          </section>
          {hasPermission(PERMISSIONS.CUSTOMERS_MANAGE) ? <CustomerReviewForm id={org.id} /> : null}
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="invoices" title={t('paymentContract.title')} />
              <InfoGrid
                fields={[
                  {
                    icon: 'payments',
                    label: t('paymentContract.current'),
                    value: formatPaymentTerms(
                      org.payment_contract?.billing_trigger,
                      org.payment_contract?.due_days,
                      org.payment_contract?.billing_unit,
                    ),
                  },
                ]}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function IdentityCardDocuments({ documents }: { documents?: OrganizationDocument[] }) {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const cards = (documents ?? []).filter((document) => document.type === 'identity')

  async function openDocument(id: number) {
    setError('')
    try {
      const response = await api.get<Blob>(`/documents/${id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      window.open(url, '_blank', 'noopener')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setError(getApiMessage(err, t('customers.noIdentity')))
    }
  }

  if (cards.length === 0) {
    return <p className="mz-notes">{t('customers.noIdentity')}</p>
  }

  return (
    <div className="mz-stack">
      {error ? <div className="mz-alert">{error}</div> : null}
      {cards.map((document) => (
        <button key={document.id} type="button" className="mz-btn mz-btn--ghost" onClick={() => void openDocument(document.id)}>
          {t('customers.viewIdentity')}
        </button>
      ))}
    </div>
  )
}

function CustomerReviewForm({ id }: { id: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => verifyOrganization(id, { status, verification_notes: notes }),
    onSuccess: async () => {
      setFeedback(t('providers.verifySuccess'))
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['organization', id] })
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('providers.verifyFailed')))
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <section className="mz-card">
      <div className="mz-card__body">
        <SectionTitle icon="verify" title={t('providers.verifyTitle')} />
        <p className="mz-notes" style={{ color: 'var(--mz-muted)', marginBottom: 12 }}>
          {t('providers.verifyHint')}
        </p>
        <form className="mz-form" onSubmit={onSubmit}>
          {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
          {error ? <div className="mz-alert">{error}</div> : null}
          <FormField label={t('providers.newStatus')} htmlFor="customer-verify-status" required>
            <select id="customer-verify-status" className="mz-select" value={status} onChange={(event) => setStatus(event.target.value)}>
              {ORGANIZATION_VERIFY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`status.${value}`)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('providers.verificationNotes')} htmlFor="customer-verify-notes">
            <textarea id="customer-verify-notes" className="mz-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </FormField>
          <button type="submit" className="mz-btn mz-btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? t('providers.verifying') : t('providers.submitVerify')}
          </button>
        </form>
      </div>
    </section>
  )
}
