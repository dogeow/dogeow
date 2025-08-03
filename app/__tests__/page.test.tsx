import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import Home from '../page'

// Mock dependencies
vi.mock('@/components/app/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}))

vi.mock('@/components/app/TileCard', () => ({
  TileCard: ({ tile, onClick }: { tile: { name: string }; onClick: () => void }) => (
    <div data-testid={`tile-${tile.name}`} onClick={onClick}>
      {tile.name}
    </div>
  ),
}))

vi.mock('@/hooks/useTileManagement', () => ({
  useTileManagement: () => ({
    tiles: [
      {
        name: 'thing',
        nameKey: 'nav.thing',
        href: '/thing',
        color: '#2196F3',
        needLogin: true,
      },
      {
        name: 'lab',
        nameKey: 'nav.lab',
        href: '/lab',
        color: '#388e3c',
        needLogin: false,
      },
    ],
    showProjectCovers: false,
    handleTileClick: vi.fn(),
    getTileStatus: vi.fn(() => ({ needsLogin: false })),
  }),
}))

vi.mock('@/app/configs', () => ({
  configs: {
    gridLayout: {
      templateAreas: '"thing lab"',
    },
  },
}))

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the home page with correct structure', () => {
    render(<Home />)

    // Check for main content
    expect(screen.getByRole('main')).toBeInTheDocument()

    // Check for SEO content
    expect(screen.getByText('DogeOW - 个人工具和游戏平台')).toBeInTheDocument()
    expect(
      screen.getByText('包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台')
    ).toBeInTheDocument()

    // Check for tiles
    expect(screen.getByTestId('tile-thing')).toBeInTheDocument()
    expect(screen.getByTestId('tile-lab')).toBeInTheDocument()

    // Check for footer
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('should render tiles with correct grid layout', () => {
    render(<Home />)

    const mainElement = screen.getByRole('main')
    const gridContainer = mainElement.querySelector('.grid')

    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('gap-3', 'sm:gap-4')
  })

  it('should render tiles with correct styling', () => {
    render(<Home />)

    const tileContainers = screen.getAllByText(/thing|lab/)
    tileContainers.forEach(container => {
      expect(container.parentElement).toHaveClass('min-h-[8rem]')
    })
  })

  it('should have correct accessibility structure', () => {
    render(<Home />)

    // Check for proper heading structure
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('DogeOW - 个人工具和游戏平台')

    // Check that SEO content is visually hidden
    const seoContent = screen.getByText('DogeOW - 个人工具和游戏平台').closest('.sr-only')
    expect(seoContent).toBeInTheDocument()
  })

  it('should render with correct container classes', () => {
    render(<Home />)

    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveClass('max-w-7xl', 'p-2')
  })

  it('should render tiles with proper grid areas', () => {
    render(<Home />)

    const thingTile = screen.getByTestId('tile-thing').parentElement
    const labTile = screen.getByTestId('tile-lab').parentElement

    expect(thingTile).toHaveStyle({ gridArea: 'thing' })
    expect(labTile).toHaveStyle({ gridArea: 'lab' })
  })
})
