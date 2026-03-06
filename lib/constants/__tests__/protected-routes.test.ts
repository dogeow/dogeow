import { describe, expect, it } from 'vitest'
import { isProtectedPath } from '../protected-routes'

describe('isProtectedPath', () => {
  it('returns true for protected tile routes', () => {
    expect(isProtectedPath('/thing')).toBe(true)
    expect(isProtectedPath('/chat/room-1')).toBe(true)
    expect(isProtectedPath('/word/editor')).toBe(true)
  })

  it('returns true for protected non-tile routes', () => {
    expect(isProtectedPath('/dashboard')).toBe(true)
    expect(isProtectedPath('/dashboard/settings')).toBe(true)
  })

  it('returns false for public routes', () => {
    expect(isProtectedPath('/')).toBe(false)
    expect(isProtectedPath('/about')).toBe(false)
    expect(isProtectedPath('/wiki')).toBe(false)
  })

  it('does not treat partial prefixes as protected routes', () => {
    expect(isProtectedPath('/things')).toBe(false)
    expect(isProtectedPath('/chatbot')).toBe(false)
    expect(isProtectedPath('/wordle')).toBe(false)
  })
})
