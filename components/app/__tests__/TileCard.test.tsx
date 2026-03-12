import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { TileCard } from '../TileCard'

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    sizes,
    onError,
    onLoad,
  }: {
    src?: string
    alt?: string
    sizes?: string
    onError?: () => void
    onLoad?: () => void
  }) => (
    <div
      data-testid="image"
      data-src={src}
      data-alt={alt}
      data-sizes={sizes}
      onError={onError}
      onLoad={onLoad}
    />
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
    customStyles: '',
    projectCoverMode: 'image' as const,
    needsLogin: false,
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the translated tile name', () => {
    render(<TileCard {...defaultProps} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('测试瓦片')).toBeInTheDocument()
  })

  it('renders cover image in image mode', () => {
    render(<TileCard {...defaultProps} projectCoverMode="image" />)

    expect(screen.getByTestId('image')).toHaveAttribute(
      'data-src',
      '/images/projects/test-cover.png'
    )
  })

  it('falls back to generated cover path when cover is missing', () => {
    render(
      <TileCard
        {...defaultProps}
        projectCoverMode="image"
        tile={{ ...mockTile, cover: undefined }}
      />
    )

    expect(screen.getByTestId('image')).toHaveAttribute(
      'data-src',
      '/images/projects/test-tile.png'
    )
  })

  it('does not render image in color mode', () => {
    render(<TileCard {...defaultProps} projectCoverMode="color" />)

    expect(screen.queryByTestId('image')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).not.toHaveClass('border-white/15')
  })

  it('renders bordered neutral card in none mode', () => {
    render(<TileCard {...defaultProps} projectCoverMode="none" />)

    expect(screen.queryByTestId('image')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveClass('border', 'border-white/15')
  })

  it('renders lock icon for protected tiles without image skeleton interference', () => {
    render(<TileCard {...defaultProps} projectCoverMode="none" needsLogin={true} />)

    expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<TileCard {...defaultProps} onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('handles enter key activation', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<TileCard {...defaultProps} onClick={onClick} />)

    const card = screen.getByRole('button')
    card.focus()

    await user.keyboard('{Enter}')

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
