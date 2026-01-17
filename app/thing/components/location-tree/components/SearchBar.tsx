import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import FolderIcon from '../../FolderIcon'
import { useTranslation } from '@/hooks/useTranslation'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  isExpanded: boolean
  onToggleExpand?: () => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  isExpanded,
  onToggleExpand,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-2 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 transform" />
        <Input
          placeholder={t('location.search_placeholder')}
          className="h-8 pl-7 text-sm"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          aria-label={t('common.search')}
        />
      </div>
      {onToggleExpand && (
        <button
          className="hover:bg-accent hover:text-accent-foreground flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          onClick={onToggleExpand}
          title={isExpanded ? t('location.collapse_all') : t('location.expand_all')}
          aria-label={isExpanded ? t('location.collapse_all') : t('location.expand_all')}
        >
          <FolderIcon isOpen={isExpanded} size={18} />
        </button>
      )}
    </div>
  )
}
