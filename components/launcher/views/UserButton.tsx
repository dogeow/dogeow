import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface UserButtonProps {
  isAuthenticated: boolean
  onToggleAuth: () => void
}

export const UserButton = memo<UserButtonProps>(({ isAuthenticated, onToggleAuth }) => {
  const { t } = useTranslation()

  if (isAuthenticated) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleAuth}>
        <User className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button variant="default" className="h-8" data-login-trigger onClick={onToggleAuth}>
      {t('auth.login')}
    </Button>
  )
})

UserButton.displayName = 'UserButton'
