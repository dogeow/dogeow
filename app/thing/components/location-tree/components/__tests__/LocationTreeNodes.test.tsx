import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AreaNode } from '../AreaNode'
import { RoomNode } from '../RoomNode'
import { SpotNode } from '../SpotNode'

describe('LocationTree nodes', () => {
  it('renders AreaNode and handles select/toggle interactions', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onToggle = vi.fn()

    const { container } = render(
      <AreaNode
        area={{ id: 1, name: '客厅' }}
        isSelected={true}
        isExpanded={false}
        onSelect={onSelect}
        onToggle={onToggle}
      >
        <div>child-node</div>
      </AreaNode>
    )

    expect(screen.getByText('客厅')).toBeInTheDocument()
    expect(screen.getByText('child-node')).toBeInTheDocument()

    const selectedRow = screen.getByText('客厅').closest('div')
    expect(selectedRow).toHaveClass('bg-muted')

    await user.click(screen.getByText('客厅'))
    expect(onSelect).toHaveBeenCalledTimes(1)

    const toggleButton = container.querySelector('span.flex.items-center') as HTMLElement
    await user.click(toggleButton)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders RoomNode with optional area name and toggle behavior', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onToggle = vi.fn()

    const { container } = render(
      <RoomNode
        room={{ id: 2, name: '主卧', area_id: 1 }}
        isSelected={false}
        onSelect={onSelect}
        onToggle={onToggle}
        showAreaName={true}
        areaName="二楼"
      >
        <div>room-child</div>
      </RoomNode>
    )

    expect(screen.getByText('主卧')).toBeInTheDocument()
    expect(screen.getByText('二楼')).toBeInTheDocument()
    expect(screen.getByText('room-child')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('ml-4')

    await user.click(screen.getByText('主卧'))
    expect(onSelect).toHaveBeenCalledTimes(1)

    const toggleButton = container.querySelector('span.flex.items-center') as HTMLElement
    await user.click(toggleButton)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders RoomNode without toggle and uses fallback icon branch', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    const { container } = render(
      <RoomNode room={{ id: 4, name: '次卧', area_id: 2 }} isSelected={true} onSelect={onSelect}>
        <div>no-toggle-child</div>
      </RoomNode>
    )

    expect(container.firstChild).not.toHaveClass('ml-4')
    expect(screen.getByText('次卧')).toBeInTheDocument()
    expect(screen.getByText('no-toggle-child')).toBeInTheDocument()
    expect(screen.queryByText('二楼')).not.toBeInTheDocument()

    await user.click(screen.getByText('次卧'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('renders SpotNode selected state and triggers select callback', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    const { container } = render(
      <SpotNode
        spot={{ id: 3, name: '衣柜上层', room_id: 2 }}
        isSelected={true}
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('衣柜上层')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-muted')

    await user.click(screen.getByText('衣柜上层'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
