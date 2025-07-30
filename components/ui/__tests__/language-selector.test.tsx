/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageSelector, CompactLanguageSelector } from '../language-selector'

// Mock the translation hook
const mockSetLanguage = jest.fn()
const mockCurrentLanguage = 'zh-CN'
const mockCurrentLanguageInfo = {
  code: 'zh-CN',
  name: 'Chinese (Simplified)',
  nativeName: '简体中文',
  isDefault: true,
}
const mockAvailableLanguages = [
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isDefault: false },
  { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
]

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    currentLanguage: mockCurrentLanguage,
    currentLanguageInfo: mockCurrentLanguageInfo,
    availableLanguages: mockAvailableLanguages,
    setLanguage: mockSetLanguage,
  }),
}))

jest.mock('@/hooks/useLanguageTransition', () => ({
  useLanguageTransition: () => ({
    isTransitioning: false,
    switchLanguage: jest.fn(),
  }),
}))

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dropdown variant', () => {
    it('should render dropdown trigger with current language', () => {
      render(<LanguageSelector />)

      expect(screen.getByText('简体中文')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should show dropdown menu when clicked', async () => {
      render(<LanguageSelector />)

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('繁體中文')).toBeInTheDocument()
        expect(screen.getByText('English')).toBeInTheDocument()
        expect(screen.getByText('日本語')).toBeInTheDocument()
      })
    })

    it('should call setLanguage when language option is clicked', async () => {
      render(<LanguageSelector />)

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      expect(mockSetLanguage).toHaveBeenCalledWith('en')
    })
  })

  describe('Button variant', () => {
    it('should render all language buttons', () => {
      render(<LanguageSelector variant="button" />)

      expect(screen.getByText('简体中文')).toBeInTheDocument()
      expect(screen.getByText('繁體中文')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('日本語')).toBeInTheDocument()
    })

    it('should highlight current language button', () => {
      render(<LanguageSelector variant="button" />)

      const currentButton = screen.getByText('简体中文').closest('button')
      expect(currentButton).toHaveClass('bg-primary')
    })

    it('should call setLanguage when language button is clicked', () => {
      render(<LanguageSelector variant="button" />)

      const englishButton = screen.getByText('English').closest('button')
      fireEvent.click(englishButton!)

      expect(mockSetLanguage).toHaveBeenCalledWith('en')
    })
  })

  describe('Customization options', () => {
    it('should hide text when showText is false', () => {
      render(<LanguageSelector showText={false} />)

      expect(screen.queryByText('简体中文')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<LanguageSelector className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })
})

describe('CompactLanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render current language code', () => {
    render(<CompactLanguageSelector />)

    expect(screen.getByText('ZH-CN')).toBeInTheDocument()
  })

  it('should show dropdown with language options', async () => {
    render(<CompactLanguageSelector />)

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument()
      expect(screen.getByText('JA')).toBeInTheDocument()
    })
  })

  it('should call setLanguage when compact option is clicked', async () => {
    render(<CompactLanguageSelector />)

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    await waitFor(() => {
      const englishOption = screen.getByText('English')
      fireEvent.click(englishOption)
    })

    expect(mockSetLanguage).toHaveBeenCalledWith('en')
  })
})
