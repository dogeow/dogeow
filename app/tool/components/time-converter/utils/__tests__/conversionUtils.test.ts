import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGE_LIST, MAX_YEAR, MIN_YEAR } from '../../constants'
import {
  cleanTimestamp,
  isValidOutput,
  standardizeDateTime,
  validateYear,
} from '../conversionUtils'

describe('conversionUtils', () => {
  describe('validateYear', () => {
    it('returns true for inclusive boundary years', () => {
      expect(validateYear(MIN_YEAR)).toBe(true)
      expect(validateYear(MAX_YEAR)).toBe(true)
    })

    it('returns false for years outside supported range', () => {
      expect(validateYear(MIN_YEAR - 1)).toBe(false)
      expect(validateYear(MAX_YEAR + 1)).toBe(false)
    })
  })

  describe('cleanTimestamp', () => {
    it('keeps digits only', () => {
      expect(cleanTimestamp('1a2b3c')).toBe('123')
      expect(cleanTimestamp(' 1712345678ms ')).toBe('1712345678')
    })

    it('returns empty string when no digits are present', () => {
      expect(cleanTimestamp('abc-_:')).toBe('')
    })
  })

  describe('standardizeDateTime', () => {
    it('pads month and day to two digits with time preserved', () => {
      expect(standardizeDateTime('2026-3-5 9:08:07')).toBe('2026-03-05 9:08:07')
    })

    it('pads month and day for date-only input', () => {
      expect(standardizeDateTime('2026-3-5')).toBe('2026-03-05')
    })

    it('returns input unchanged for invalid date segment shape', () => {
      expect(standardizeDateTime('2026/3/5 12:00:00')).toBe('2026/3/5 12:00:00')
    })
  })

  describe('isValidOutput', () => {
    it('returns false for empty output and known error outputs', () => {
      expect(isValidOutput('', ERROR_MESSAGE_LIST)).toBe(false)
      expect(isValidOutput(ERROR_MESSAGE_LIST[0], ERROR_MESSAGE_LIST)).toBe(false)
    })

    it('returns true for non-empty non-error output', () => {
      expect(isValidOutput('2026-03-05 10:20:30', ERROR_MESSAGE_LIST)).toBe(true)
    })
  })
})
