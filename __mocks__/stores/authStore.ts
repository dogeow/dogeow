import { vi } from 'vitest'

export const useAuthStore = vi.fn(() => ({
  user: {
    id: 1,
    name: 'testuser',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
}))

export default useAuthStore
