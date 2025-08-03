import { describe, it, expect, vi } from 'vitest'
import { formatDate } from '../dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format valid date strings correctly', () => {
      expect(formatDate('2023-12-25')).toBe('2023-12-25')
      expect(formatDate('2023-01-01')).toBe('2023-01-01')
      expect(formatDate('2023-06-15')).toBe('2023-06-15')
    })

    it('should format ISO date strings correctly', () => {
      expect(formatDate('2023-12-25T10:30:00Z')).toBe('2023-12-25')
      expect(formatDate('2023-01-01T00:00:00.000Z')).toBe('2023-01-01')
      expect(formatDate('2023-06-15T15:45:30.123Z')).toBe('2023-06-15')
    })

    it('should format date strings with time correctly', () => {
      expect(formatDate('2023-12-25 10:30:00')).toBe('2023-12-25')
      expect(formatDate('2023-01-01 00:00:00')).toBe('2023-01-01')
      expect(formatDate('2023-06-15 15:45:30')).toBe('2023-06-15')
    })

    it('should handle different date formats', () => {
      expect(formatDate('2023-12-25')).toBe('2023-12-25')
      expect(formatDate('2023/12/25')).toBe('2023-12-25')
      expect(formatDate('2023-12-25T10:30:00Z')).toBe('2023-12-25')
    })

    it('should return "-" for null input', () => {
      expect(formatDate(null)).toBe('-')
    })

    it('should return "-" for undefined input', () => {
      expect(formatDate(undefined)).toBe('-')
    })

    it('should return "-" for empty string', () => {
      expect(formatDate('')).toBe('-')
    })

    it('should handle invalid date strings and log error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(formatDate('invalid-date')).toBe('无效日期')
      expect(formatDate('not-a-date')).toBe('无效日期')
      expect(formatDate('2023-13-45')).toBe('无效日期') // invalid month/day
      expect(formatDate('abc-def-ghi')).toBe('无效日期')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(4)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid date string:',
        'invalid-date',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle edge cases', () => {
      // Leap year
      expect(formatDate('2024-02-29')).toBe('2024-02-29')

      // Year boundaries
      expect(formatDate('1999-12-31')).toBe('1999-12-31')
      expect(formatDate('2000-01-01')).toBe('2000-01-01')

      // Month boundaries
      expect(formatDate('2023-01-31')).toBe('2023-01-31')
      expect(formatDate('2023-02-01')).toBe('2023-02-01')
    })

    it('should handle timestamps', () => {
      expect(formatDate('2023-12-25T10:30:00Z')).toBe('2023-12-25')
      expect(formatDate('2023-12-25T10:30:00.000Z')).toBe('2023-12-25')
    })

    it('should handle Date objects converted to string', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      expect(formatDate(date.toISOString())).toBe('2023-12-25')
      expect(formatDate(date.toString())).toBe('2023-12-25')
    })

    it('should handle numeric timestamps when passed as Date', () => {
      const timestamp = new Date('2023-12-25T10:30:00Z').getTime()
      const dateFromTimestamp = new Date(timestamp)
      expect(formatDate(dateFromTimestamp.toISOString())).toBe('2023-12-25')
    })
  })
})
