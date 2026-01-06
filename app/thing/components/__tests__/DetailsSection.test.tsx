import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetailsSection from '../DetailsSection'
import { ItemFormData } from '../types'

// Mock LocationTreeSelect
vi.mock('../LocationTreeSelect', () => ({
  default: ({ onSelect, selectedLocation }: any) => (
    <div data-testid="location-tree-select">
      <button onClick={() => onSelect('area', 1, 'Area 1')}>Select Location</button>
    </div>
  ),
}))

// Mock DatePicker
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ date, setDate, placeholder }: any) => (
    <input
      type="date"
      value={date ? new Date(date).toISOString().split('T')[0] : ''}
      onChange={e => setDate(e.target.value ? new Date(e.target.value) : null)}
      placeholder={placeholder}
      data-testid="date-picker"
    />
  ),
}))

describe('DetailsSection', () => {
  const mockFormData: ItemFormData = {
    purchase_date: null,
    expiry_date: null,
    purchase_price: null,
  }

  const mockSetFormData = vi.fn()
  const mockOnLocationSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render details section with all fields', () => {
      render(
        <DetailsSection
          formData={mockFormData}
          setFormData={mockSetFormData}
          locationPath=""
          selectedLocation={undefined}
          onLocationSelect={mockOnLocationSelect}
        />
      )

      expect(screen.getByLabelText(/purchase_date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/expiry_date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/purchase_price/i)).toBeInTheDocument()
      expect(screen.getByTestId('location-tree-select')).toBeInTheDocument()
    })

    it('should display location path when provided', () => {
      render(
        <DetailsSection
          formData={mockFormData}
          setFormData={mockSetFormData}
          locationPath="Area > Room > Spot"
          selectedLocation={undefined}
          onLocationSelect={mockOnLocationSelect}
        />
      )

      expect(screen.getByText(/当前位置: Area > Room > Spot/)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should update purchase_date when date picker changes', async () => {
      const user = userEvent.setup()
      render(
        <DetailsSection
          formData={mockFormData}
          setFormData={mockSetFormData}
          locationPath=""
          selectedLocation={undefined}
          onLocationSelect={mockOnLocationSelect}
        />
      )

      const datePickers = screen.getAllByTestId('date-picker')
      const purchaseDatePicker = datePickers[0]
      await user.type(purchaseDatePicker, '2024-01-01')

      expect(mockSetFormData).toHaveBeenCalled()
    })

    it('should update purchase_price when input changes', async () => {
      const user = userEvent.setup()
      render(
        <DetailsSection
          formData={mockFormData}
          setFormData={mockSetFormData}
          locationPath=""
          selectedLocation={undefined}
          onLocationSelect={mockOnLocationSelect}
        />
      )

      const priceInput = screen.getByLabelText(/purchase_price/i)
      await user.type(priceInput, '100')

      expect(mockSetFormData).toHaveBeenCalled()
    })

    it('should call onLocationSelect when location is selected', async () => {
      const user = userEvent.setup()
      render(
        <DetailsSection
          formData={mockFormData}
          setFormData={mockSetFormData}
          locationPath=""
          selectedLocation={undefined}
          onLocationSelect={mockOnLocationSelect}
        />
      )

      const selectButton = screen.getByText('Select Location')
      await user.click(selectButton)

      expect(mockOnLocationSelect).toHaveBeenCalledWith('area', 1, 'Area 1')
    })
  })
})
