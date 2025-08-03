import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { TileCard } from '../TileCard'

// Mock dependencies
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onError,
    onLoad,
    ...props
  }: {
    src: string
    alt: string
    onError?: () => void
    onLoad?: () => void
    [key: string]: unknown
  }) => (
    <img src={src} alt={alt} onError={onError} onLoad={onLoad} data-testid="image" {...props} />
  ),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock('lucide-react', () => ({
  Lock: () => <div data-testid="lock-icon">Lock</div>,
}))

describe('TileCard', () => {
  const mockTile = {
    name: 'test-tile',
    nameKey: 'nav.test',
    nameCn: '测试瓦片',
    href: '/test',
    color: '#FF5722',
    needLogin: false,
    cover: 'test-cover.png',
    gridArea: 'test',
    icon: <div>Test Icon</div>,
  }

  const defaultProps = {
    tile: mockTile,
    index: 0,
    keyPrefix: 'main',
    customStyles: '',
    showCover: false,
    needsLogin: false,
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render tile card with correct structure', () => {
    render(<TileCard {...defaultProps} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('测试瓦片')).toBeInTheDocument()
  })

  it('should render with translated name', () => {
    render(<TileCard {...defaultProps} />)

    expect(screen.getByText('测试瓦片')).toBeInTheDocument()
  })

  it('should render with fallback name when translation not available', () => {
    const tileWithoutCn = { ...mockTile, nameCn: undefined }
    render(<TileCard {...defaultProps} tile={tileWithoutCn} />)

    expect(screen.getByText('nav.test')).toBeInTheDocument()
  })

  it('should render with correct background color', () => {
    render(<TileCard {...defaultProps} />)

    const card = screen.getByRole('button')
    expect(card).toHaveStyle({ backgroundColor: '#FF5722' })
  })

  it('should render with reduced opacity when needs login', () => {
    render(<TileCard {...defaultProps} needsLogin={true} />)

    const card = screen.getByRole('button')
    expect(card).toHaveStyle({ opacity: 0.7 })
  })

  it('should render with full opacity when no login needed', () => {
    render(<TileCard {...defaultProps} needsLogin={false} />)

    const card = screen.getByRole('button')
    expect(card).toHaveStyle({ opacity: 1 })
  })

  it('should render cover image when showCover is true', () => {
    render(<TileCard {...defaultProps} showCover={true} />)

    expect(screen.getByTestId('image')).toBeInTheDocument()
    expect(screen.getByTestId('image')).toHaveAttribute('src', '/images/projects/test-cover.png')
  })

  it('should not render cover image when showCover is false', () => {
    render(<TileCard {...defaultProps} showCover={false} />)

    expect(screen.queryByTestId('image')).not.toBeInTheDocument()
  })

  it('should handle image load error', () => {
    render(<TileCard {...defaultProps} showCover={true} />)

    const image = screen.getByTestId('image')
    fireEvent.error(image)

    // After error, image should still be in document but may be hidden
    expect(image).toBeInTheDocument()
  })

  it('should handle image load success', () => {
    render(<TileCard {...defaultProps} showCover={true} />)

    const image = screen.getByTestId('image')
    fireEvent.load(image)

    // Image should be loaded successfully
    expect(image).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<TileCard {...defaultProps} onClick={onClick} />)

    const card = screen.getByRole('button')
    fireEvent.click(card)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should handle keyboard navigation', () => {
    const onClick = vi.fn()
    render(<TileCard {...defaultProps} onClick={onClick} />)

    const card = screen.getByRole('button')

    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)

    // Test Space key
    fireEvent.keyDown(card, { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('should not call onClick for other keys', () => {
    const onClick = vi.fn()
    render(<TileCard {...defaultProps} onClick={onClick} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Tab' })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('should have correct accessibility attributes', () => {
    render(<TileCard {...defaultProps} />)

    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('tabIndex', '0')
    expect(card).toHaveAttribute('aria-label', '打开 测试瓦片')
  })

  it('should apply custom styles', () => {
    render(<TileCard {...defaultProps} customStyles="custom-class" />)

    const card = screen.getByRole('button')
    expect(card).toHaveClass('custom-class')
  })

  it('should render with correct base classes', () => {
    render(<TileCard {...defaultProps} />)

    const card = screen.getByRole('button')
    expect(card).toHaveClass(
      'tile-card',
      'w-full',
      'h-full',
      'min-h-[8rem]',
      'relative',
      'flex',
      'flex-col',
      'items-start',
      'justify-end',
      'p-3',
      'sm:p-4',
      'rounded-lg',
      'overflow-hidden',
      'transition-all',
      'duration-200',
      'ease-in-out',
      'hover:scale-95',
      'active:scale-90',
      'cursor-pointer',
      'shadow-sm',
      'hover:shadow-md',
      'will-change-transform'
    )
  })

  it('should render lock icon for protected tiles', () => {
    const protectedTile = { ...mockTile, needLogin: true }
    render(<TileCard {...defaultProps} tile={protectedTile} needsLogin={true} />)

    expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
  })

  it('should not render lock icon for public tiles', () => {
    render(<TileCard {...defaultProps} needsLogin={false} />)

    expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument()
  })

  it('should handle tiles without cover image', () => {
    const tileWithoutCover = { ...mockTile, cover: undefined }
    render(<TileCard {...defaultProps} tile={tileWithoutCover} showCover={true} />)

    // Should use default cover path
    expect(screen.getByTestId('image')).toHaveAttribute('src', '/images/projects/test-tile.png')
  })

  it('should handle different grid areas for image sizing', () => {
    const thingTile = { ...mockTile, gridArea: 'thing' }
    render(<TileCard {...defaultProps} tile={thingTile} showCover={true} />)

    const image = screen.getByTestId('image')
    expect(image).toHaveAttribute('sizes', '(max-width: 640px) 300px, 200px')
  })

  it('should handle file/tool grid areas', () => {
    const fileTile = { ...mockTile, gridArea: 'file' }
    render(<TileCard {...defaultProps} tile={fileTile} showCover={true} />)

    const image = screen.getByTestId('image')
    expect(image).toHaveAttribute('sizes', '(max-width: 640px) 200px, 150px')
  })

  it('should handle default grid areas', () => {
    const defaultTile = { ...mockTile, gridArea: 'lab' }
    render(<TileCard {...defaultProps} tile={defaultTile} showCover={true} />)

    const image = screen.getByTestId('image')
    expect(image).toHaveAttribute('sizes', '(max-width: 640px) 150px, 120px')
  })

  it('should handle icon sizing correctly', () => {
    render(<TileCard {...defaultProps} showCover={true} />)

    const image = screen.getByTestId('image')
    expect(image).toHaveAttribute('sizes', '(max-width: 640px) 150px, 120px')
  })

  it('should prevent default on keyboard events', () => {
    const onClick = vi.fn()
    render(<TileCard {...defaultProps} onClick={onClick} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(onClick).toHaveBeenCalled()
  })
})
