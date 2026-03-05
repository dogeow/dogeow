import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import SearchInput from '../SearchInput'

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    React.createElement('input', props),
}))

vi.mock('@/components/ui/button', () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) =>
    React.createElement('button', props, props.children),
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  PopoverContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
}))

vi.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => React.createElement('svg', props)
  return {
    Search: Icon,
    X: Icon,
    Clock: Icon,
    TrendingUp: Icon,
  }
})

describe('SearchInput SSR', () => {
  it('should render safely when window is undefined', () => {
    const originalWindow = globalThis.window
    vi.stubGlobal('window', undefined)

    const html = renderToString(
      <SearchInput value="" onChange={() => undefined} onSearch={() => undefined} />
    )

    vi.stubGlobal('window', originalWindow)
    expect(html).toContain('搜索物品')
  })
})
