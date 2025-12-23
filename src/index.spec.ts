import { encode, decode, fromDate, toDate, CivilDate } from './index'

describe('Civil Date Utilities', () => {
	describe('encode()', () => {
		it('should throw error for days < 1296', () => {
			expect(() => encode(0)).toThrow("Days out of range")
			expect(() => encode(1295)).toThrow("Days out of range")
		})

		it('should encode 1296 to 100 (start of 3-char range)', () => {
			expect(encode(1296)).toBe('100')
		})

		it('should encode today (2025-12-23) to FRX', () => {
			// 20445 days since epoch
			expect(encode(20445)).toBe('FRX')
		})

		it('should encode 46655 to ZZZ (end of 3-char range)', () => {
			expect(encode(46655)).toBe('ZZZ')
		})

		it('should throw error for days > 46655', () => {
			expect(() => encode(46656)).toThrow("Days out of range")
		})

		it('should handle floating point numbers by flooring them', () => {
			expect(encode(20445.9)).toBe('FRX')
		})
	})

	describe('decode()', () => {
		it('should decode Radix 36 strings regardless of case', () => {
			expect(decode('FRX')).toBe(20445)
			expect(decode('frx')).toBe(20445)
		})

		it('should decode boundary values', () => {
			expect(decode('100')).toBe(1296)
			expect(decode('ZZZ')).toBe(46655)
		})

		it('should throw error for invalid characters', () => {
			expect(() => decode('???')).toThrow("Invalid civil-date code")
		})

		it('should throw error for empty string', () => {
			expect(() => decode('')).toThrow("Invalid civil-date code")
		})

		it('should throw error for incorrect length', () => {
			expect(() => decode('FR')).toThrow("Invalid civil-date code")
			expect(() => decode('FRXX')).toThrow("Invalid civil-date code")
		})
	})

	describe('Timezone Safety (fromDate)', () => {
		it('should capture the same day regardless of the time / timezone', () => {
			const morning = new Date('2025-12-23T01:00:00-06:00')
			const evening = new Date('2025-12-23T23:00:00-06:00')

			expect(fromDate(morning)).toBe(fromDate(evening))
		})

		it('should correctly capture the local "wall clock" date', () => {
			// This test simulates a date object.
			// Manual check: Jan 2, 1970 should be index 1.
			const localDate = new Date(1970, 0, 2)
			expect(fromDate(localDate)).toBe(1)
		})
	})

	describe('toDate()', () => {
		it('should return a Date object at UTC midnight', () => {
			const date = toDate('FRX')
			expect(date.getUTCHours()).toBe(0)
			expect(date.getUTCMinutes()).toBe(0)
			expect(date.getUTCFullYear()).toBe(2025)
		})

		it('should accept a number input directly', () => {
			const date = toDate(20445)
			expect(date.getUTCFullYear()).toBe(2025)
			expect(date.getUTCMonth()).toBe(11) // Dec
			expect(date.getUTCDate()).toBe(23)
		})
	})

	describe('CivilDate Class', () => {
		afterEach(() => {
			vi.useRealTimers()
		})

		it('should initialize from a number', () => {
			const cd = new CivilDate(20445)
			expect(cd.toString()).toBe('FRX')
		})

		it('should initialize from a string code', () => {
			const cd = new CivilDate('FRX')
			expect(cd.value).toBe(20445)
		})

		it('should initialize from a Date object', () => {
			const date = new Date(2025, 11, 23) // Dec 23
			const cd = new CivilDate(date)
			expect(cd.toISOString()).toBe('2025-12-23')
		})

		it('should provide a clean ISO string', () => {
			const cd = new CivilDate('100')
			expect(cd.toISOString()).toBe('1973-07-20')
		})

		it('should default to today if no argument provided', () => {
			vi.useFakeTimers()
			// Set to a specific local date/time
			const mockDate = new Date('2023-03-14T22:15:37-06:00')
			vi.setSystemTime(mockDate)

			const cd = new CivilDate()
			expect(cd.toISOString()).toBe('2023-03-14')
		})

		it('should parse a valid ISO string (YYYY-MM-DD)', () => {
			const cd = new CivilDate('2025-12-23')
			expect(cd.value).toBe(20445)
		})

		it('should throw if ISO string represents an invalid date', () => {
			expect(() => new CivilDate('2025-02-30')).toThrow("Invalid date")
		})

		it('should throw if initialized with a number out of range', () => {
			expect(() => new CivilDate(1000)).toThrow("Days out of range")
			expect(() => new CivilDate(50000)).toThrow("Days out of range")
		})

		it('should throw if initialized with an invalid string format', () => {
			expect(() => new CivilDate('invalid')).toThrow("Invalid civil-date code")
			expect(() => new CivilDate('2025/01/01')).toThrow("Invalid civil-date code")
		})

		it('should handle leap years in ISO strings', () => {
			const leap = new CivilDate('2024-02-29')
			expect(leap.toISOString()).toBe('2024-02-29')

			expect(() => new CivilDate('2023-02-29')).toThrow("Invalid date")
		})
	})
})