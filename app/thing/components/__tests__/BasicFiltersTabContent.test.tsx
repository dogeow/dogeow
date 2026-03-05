import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BasicFiltersTabContent } from '../filters/components/BasicFiltersTabContent'
import { initialFilters } from '../filters/types'

vi.mock('../CategoryTreeSelect', () => ({
  default: ({ onSelect, selectedCategory }: any) => (
    <div>
      <div data-testid="selected-category">
        {selectedCategory ? `${selectedCategory.type}:${selectedCategory.id}` : 'none'}
      </div>
      <button type="button" onClick={() => onSelect('child', 2)}>
        pick-category
      </button>
    </div>
  ),
}))

vi.mock('@/components/ui/tag-selector', () => ({
  TagSelector: ({ selectedTags, onChange }: any) => (
    <div>
      <div data-testid="selected-tags">{selectedTags.join('|')}</div>
      <button type="button" onClick={() => onChange(['7'])}>
        change-tags
      </button>
    </div>
  ),
  Tag: {} as any,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid={`select-${String(value)}`}>
      <button
        type="button"
        aria-label={`pick-${String(value)}-active`}
        onClick={() => onValueChange?.('active')}
      />
      <button
        type="button"
        aria-label={`pick-${String(value)}-true`}
        onClick={() => onValueChange?.('true')}
      />
      <button
        type="button"
        aria-label={`pick-${String(value)}-null`}
        onClick={() => onValueChange?.('null')}
      />
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}))

describe('BasicFiltersTabContent', () => {
  it('should handle input/select/category/tag callbacks', async () => {
    const user = userEvent.setup()
    const onNameChange = vi.fn()
    const onDescriptionChange = vi.fn()
    const onStatusChange = vi.fn()
    const onIsPublicChange = vi.fn()
    const onTagsChange = vi.fn()
    const onCategorySelect = vi.fn()

    render(
      <BasicFiltersTabContent
        filters={{ ...initialFilters, tags: '1,2' }}
        selectedCategory={{ type: 'parent', id: 1 }}
        tags={[]}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onStatusChange={onStatusChange}
        onIsPublicChange={onIsPublicChange}
        onTagsChange={onTagsChange}
        onCategorySelect={onCategorySelect}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'A')
    await user.type(inputs[1], 'B')
    expect(onNameChange).toHaveBeenCalledWith('A')
    expect(onDescriptionChange).toHaveBeenCalledWith('B')

    await user.click(screen.getByRole('button', { name: 'pick-category' }))
    expect(onCategorySelect).toHaveBeenCalledWith('child', 2)

    await user.click(screen.getByRole('button', { name: '清空分类筛选' }))
    expect(onCategorySelect).toHaveBeenCalledWith('parent', null)

    await user.click(screen.getByLabelText('pick-all-active'))
    expect(onStatusChange).toHaveBeenCalledWith('active')

    await user.click(screen.getByLabelText('pick-null-true'))
    await user.click(screen.getByLabelText('pick-null-null'))
    expect(onIsPublicChange).toHaveBeenCalledWith(true)
    expect(onIsPublicChange).toHaveBeenCalledWith(null)

    expect(screen.getByTestId('selected-tags')).toHaveTextContent('1|2')
    await user.click(screen.getByRole('button', { name: 'change-tags' }))
    expect(onTagsChange).toHaveBeenCalledWith(['7'])
  })

  it('should map array tags and disable clear button without selected category', () => {
    render(
      <BasicFiltersTabContent
        filters={{ ...initialFilters, tags: [3, 4] }}
        selectedCategory={undefined}
        tags={[]}
        onNameChange={vi.fn()}
        onDescriptionChange={vi.fn()}
        onStatusChange={vi.fn()}
        onIsPublicChange={vi.fn()}
        onTagsChange={vi.fn()}
        onCategorySelect={vi.fn()}
      />
    )

    expect(screen.getByTestId('selected-tags')).toHaveTextContent('3|4')
    expect(screen.getByRole('button', { name: '清空分类筛选' })).toBeDisabled()
  })
})
