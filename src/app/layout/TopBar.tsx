import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { fetchUnreadNotificationCount } from '@/core/api/services.ts'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { formatDate, initials } from '@/shared/utils/format.ts'

interface TopBarProps {
  onMenu: () => void
}

export function TopBar({ onMenu }: TopBarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const unread = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationCount,
    refetchInterval: 60_000,
  })
  const role = user?.roles?.[0]
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [])

  return (
    <header className="mz-topbar">
      <div className="mz-topbar__start">
        <button type="button" className="mz-icon-btn" onClick={onMenu} aria-label={t('common.openMenu')}>
          <AppIcon name="menu" width={16} height={16} />
        </button>
        <div className="mz-topbar__clock">
          <AppIcon name="calendar" width={14} height={14} />
          <div>
            <strong>{formatDate(new Date().toISOString())}</strong>
            <span>{t('app.portal')}</span>
          </div>
        </div>
      </div>
      <div className="mz-topbar__end">
        <Link to="/notifications" className="mz-notify-btn" aria-label={t('notifications.title')}>
          <AppIcon name="notifications" width={16} height={16} />
          {(unread.data ?? 0) > 0 ? <span className="mz-notify-btn__count">{(unread.data ?? 0) > 99 ? '99+' : unread.data}</span> : null}
        </Link>
        <LanguageSwitcher />
        <div className="mz-user-menu" ref={menuRef}>
          <button
            type="button"
            className="mz-user-menu__trigger"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="mz-avatar">{initials(user?.name)}</span>
            <span className="mz-userchip">
              <span className="mz-userchip__name">{user?.name}</span>
              <span className="mz-userchip__role">{role ? t(`roles.${role}`, { defaultValue: role }) : user?.email}</span>
            </span>
          </button>
          {open ? (
            <div className="mz-user-menu__panel" role="menu">
              <Link to="/settings" role="menuitem" onClick={() => setOpen(false)}>
                <AppIcon name="profile" width={16} height={16} />
                {t('common.profile')}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  void logout()
                }}
              >
                <AppIcon className="mz-dir-icon" name="logout" width={16} height={16} />
                {t('common.logout')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
