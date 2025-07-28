export const useAuthStore = jest.fn(() => ({
  user: {
    id: 1,
    name: 'testuser',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  token: 'mock-token',
  login: jest.fn(),
  logout: jest.fn(),
  setUser: jest.fn(),
}))

export default useAuthStore
