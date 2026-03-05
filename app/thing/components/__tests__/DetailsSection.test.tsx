import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetailsSection from '../DetailsSection'
import { ItemFormData } from '@/app/thing/types'

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
    name: '',
    description: '',
    quantity: 1,
    status: 'active',
    purchase_date: null,
    expiry_date: null,
    purchase_price: null,
    category_id: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: false,
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

      expect(screen.getByPlaceholderText('选择购买日期')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('选择过期日期')).toBeInTheDocument()
      expect(screen.getByLabelText('购买价格')).toBeInTheDocument()
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
      fireEvent.change(purchaseDatePicker, { target: { value: '2024-01-01' } })

      expect(mockSetFormData).toHaveBeenCalled()
      const updater = mockSetFormData.mock.calls.at(-1)?.[0] as (prev: ItemFormData) => ItemFormData
      const nextState = updater(mockFormData)
      expect(nextState.purchase_date).toEqual(new Date('2024-01-01'))
    })

    it('should update expiry_date when date picker changes', () => {
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
      const expiryDatePicker = datePickers[1]
      fireEvent.change(expiryDatePicker, { target: { value: '2026-12-31' } })

      expect(mockSetFormData).toHaveBeenCalled()
      const updater = mockSetFormData.mock.calls.at(-1)?.[0] as (prev: ItemFormData) => ItemFormData
      const nextState = updater(mockFormData)
      expect(nextState.expiry_date).toEqual(new Date('2026-12-31'))
    })

    it('should update purchase_price when input changes', async () => {
      render(
        <DetailsSection
          formData={mockFormData}
          setFormData={mockSetFormData}
          locationPath=""
          selectedLocation={undefined}
          onLocationSelect={mockOnLocationSelect}
        />
      )

      const priceInput = screen.getByLabelText('购买价格')
      fireEvent.change(priceInput, { target: { value: '100' } })

      expect(mockSetFormData).toHaveBeenCalled()
      const updater = mockSetFormData.mock.calls.at(-1)?.[0] as (prev: ItemFormData) => ItemFormData
      expect(updater(mockFormData).purchase_price).toBe(100)
    })

    it('should set purchase_price to null when input is cleared', () => {
      render(
        <DetailsSection
          formData={{ ...mockFormData, purchase_price: 99 }}
          setFormData={mockSetFormData}
          locationPath=""
          selectedLocation={undefined}
          onLocationSelect={mockOnLocationSelect}
        />
      )

      const priceInput = screen.getByLabelText('购买价格')
      fireEvent.change(priceInput, { target: { value: '' } })

      expect(mockSetFormData).toHaveBeenCalled()
      const updater = mockSetFormData.mock.calls.at(-1)?.[0] as (prev: ItemFormData) => ItemFormData
      expect(updater({ ...mockFormData, purchase_price: 99 }).purchase_price).toBeNull()
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
