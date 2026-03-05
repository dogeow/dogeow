import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '../SearchBar'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          'common.search': '搜索',
          'location.search_placeholder': '搜索位置...',
          'location.expand_all': '展开全部',
          'location.collapse_all': '折叠全部',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}))

describe('SearchBar', () => {
  it('renders search input and triggers onSearchChange', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()

    render(
      <SearchBar
        searchTerm=""
        onSearchChange={onSearchChange}
        isExpanded={false}
        onToggleExpand={undefined}
      />
    )

    const input = screen.getByPlaceholderText('搜索位置...')
    expect(input).toHaveAttribute('aria-label', '搜索')

    await user.type(input, '客厅')
    expect(onSearchChange).toHaveBeenCalledWith('客')
    expect(onSearchChange).toHaveBeenLastCalledWith('厅')
  })

  it('shows toggle button when onToggleExpand exists and calls callback', async () => {
    const user = userEvent.setup()
    const onToggleExpand = vi.fn()

    render(
      <SearchBar
        searchTerm=""
        onSearchChange={() => {}}
        isExpanded={false}
        onToggleExpand={onToggleExpand}
      />
    )

    const button = screen.getByRole('button', { name: '展开全部' })
    await user.click(button)
    expect(onToggleExpand).toHaveBeenCalledTimes(1)
  })

  it('uses collapse label when expanded', () => {
    render(
      <SearchBar
        searchTerm=""
        onSearchChange={() => {}}
        isExpanded={true}
        onToggleExpand={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: '折叠全部' })).toBeInTheDocument()
  })

  it('does not render toggle button when onToggleExpand is absent', () => {
    render(
      <SearchBar
        searchTerm=""
        onSearchChange={() => {}}
        isExpanded={false}
        onToggleExpand={undefined}
      />
    )

    expect(screen.queryByRole('button', { name: '展开全部' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '折叠全部' })).not.toBeInTheDocument()
  })
})
