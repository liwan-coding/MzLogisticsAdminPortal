import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/core/api/services.ts'
import type { AppNotification } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { formatDateTime } from '@/shared/utils/format.ts'
import { useNavigate } from 'react-router-dom'

function localized(item: AppNotification, language: string, field: 'title' | 'body'): string {
  const data = item.data ?? {}
  if (language.startsWith('en')) {
    return (field === 'title' ? data.title_en : data.body_en) || (field === 'title' ? data.title : data.body) || ''
  }
  return (field === 'title' ? data.title_ar : data.body_ar) || (field === 'title' ? data.title : data.body) || ''
}

function targetPath(item: AppNotification): string | undefined {
  const type = item.data?.target_type
  const id = item.data?.target_id
  const key = id == null || id === '' ? undefined : String(id)
  switch (type) {
    case 'shipment':
      return key ? `/shipments/${key}` : undefined
    case 'quotation':
      return key ? `/quotations/${key}` : undefined
    case 'job':
      return key ? `/jobs/${key}` : undefined
    case 'trip':
      return key ? `/trips/${key}` : undefined
    case 'payment':
      return '/payments'
    case 'invoice':
      return '/invoices'
    case 'settlement':
      return '/settlements'
    case 'organization':
      return key ? `/providers/${key}` : '/providers'
    default:
      return undefined
  }
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const query = useQuery({
    queryKey: ['notifications', status, page],
    queryFn: () => fetchNotifications({ page, status: status || undefined, per_page: 20 }),
  })
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  function open(item: AppNotification) {
    if (!item.read_at) {
      markOne.mutate(item.id)
    }
    const path = targetPath(item)
    if (path) {
      void navigate(path)
    }
  }

  const columns: Column<AppNotification>[] = [
    {
      id: 'title',
      header: t('notifications.titleColumn'),
      cell: (row) => (
        <button type="button" className={row.read_at ? 'mz-notify-title' : 'mz-notify-title is-unread'} onClick={() => open(row)}>
          {localized(row, i18n.language, 'title')}
        </button>
      ),
    },
    {
      id: 'body',
      header: t('notifications.bodyColumn'),
      cell: (row) => localized(row, i18n.language, 'body'),
    },
    {
      id: 'created_at',
      header: t('notifications.when'),
      cell: (row) => formatDateTime(row.created_at),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        icon="notifications"
        actions={
          <button type="button" className="mz-btn mz-btn--ghost" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            {t('notifications.markAll')}
          </button>
        }
      />
      <FilterBar>
        <StatusFilter
          value={status}
          allLabel={t('notifications.all')}
          options={['unread', 'read']}
          label={(option) => t(`notifications.${option}`)}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        meta={query.data?.meta}
        onPageChange={setPage}
      />
    </>
  )
}
