import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Home from '../page'

// Mock dependencies
vi.mock('@/components/app/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
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

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

vi.mock('@/components/themes/UIThemeProvider', () => ({
  useUITheme: () => null,
}))

vi.mock('@/stores/layoutStore', () => ({
  useLayoutStore: () => ({ siteLayout: 'grid' as const }),
}))

vi.mock('@/components/app/ThemedTileCard', () => ({
  ThemedTileCard: ({ tile, onClick }: { tile: { name: string }; onClick: () => void }) => (
    <div data-testid={`tile-${tile.name}`} onClick={onClick}>
      {tile.name}
    </div>
  ),
}))

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the home page with correct structure', async () => {
    render(<Home />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'DogeOW - 个人工具和游戏平台'
    )
    const descriptions = screen.getAllByText(
      '包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台'
    )
    expect(descriptions.length).toBeGreaterThanOrEqual(1)

    expect(screen.getByTestId('tile-thing')).toBeInTheDocument()
    expect(screen.getByTestId('tile-lab')).toBeInTheDocument()

    // Footer is dynamically loaded, wait for it
    await waitFor(() => {
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  it('should render tiles with correct grid layout', () => {
    render(<Home />)

    const gridContainer = document.querySelector('.grid')

    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('gap-4')
  })

  it('should render tiles with correct styling', () => {
    render(<Home />)

    expect(screen.getByTestId('tile-thing')).toBeInTheDocument()
    expect(screen.getByTestId('tile-lab')).toBeInTheDocument()
  })

  it('should have correct accessibility structure', () => {
    render(<Home />)

    // Check for single h1 in sr-only (SEO)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('DogeOW - 个人工具和游戏平台')
    expect(h1.closest('.sr-only')).toBeInTheDocument()
  })

  it('should render with correct container classes', () => {
    render(<Home />)

    const container = document.querySelector('[class*="space-y-6"]')
    expect(container).toBeInTheDocument()
  })

  it('should render tiles with proper grid areas', () => {
    render(<Home />)

    const thingTile = screen.getByTestId('tile-thing').parentElement
    const labTile = screen.getByTestId('tile-lab').parentElement

    expect(thingTile).toHaveStyle({ gridArea: 'thing' })
    expect(labTile).toHaveStyle({ gridArea: 'lab' })
  })
})
