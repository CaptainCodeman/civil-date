// Milliseconds per day
const MS_PER_DAY = 86_400_000

// Regex: Expects YYYY-MM-DD exactly. Captures 3 groups.
const ISO_REGEX = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

// Regex: Strict validation for Radix 36 code (3 chars, alphanumeric)
const CODE_REGEX = /^[0-9A-Za-z]{3}$/

const MIN_DAYS = 1296
const MAX_DAYS = 46655

/**
 * Encodes the day-integer into a compact Radix 36 string.
 *
 * We zero fill to make it 3 characters and sortable, this gives a range of
 * - Start Date: July 20, 1973 (Day 1,296 — encoded as 100) to
 * - End Date: September 13, 2097 (Day 46,655 — encoded as zzz)
 *
 * This range is perfect for almost all modern software applications. It covers:
 * - The entire history of the Internet.
 * - The careers of almost every active developer.
 * - The vast majority of currently living people's birthdays.
 * - Financial and logistical data for the next 70+ years.
 *
 * @param day - The number of days since the Unix epoch.
 * @returns A 3-character Radix 36 string representing the day.
 * @throws {Error} If the days are out of the supported range (1296 to 46655).
 */
export function encode(days: number) {
	if (days < MIN_DAYS || days > MAX_DAYS) {
		throw new Error('Days out of range')
	}
	return Math.floor(days).toString(36).toUpperCase().padStart(3, '0')
}

/**
 * Decodes a Radix 36 string back into a unix day number.
 *
 * @param code - The 3-character Radix 36 string to decode.
 * @returns The number of days since the Unix epoch.
 * @throws {Error} If the code is invalid or not length 3.
 */
export function decode(code: string) {
	if (!CODE_REGEX.test(code)) throw new Error('Invalid civil-date code')
	const days = parseInt(code, 36)
	if (isNaN(days)) throw new Error('Invalid civil-date code')
	return days
}

/**
 * Captures the "wall clock" date and converts to epoch days.
 * Uses local time to determine the date.
 *
 * @param date - The Date object to convert.
 * @returns The number of days since the Unix epoch.
 */
export function fromDate(date: Date) {
	// We use the local values to ensure we capture the user's perceived 'today'
	const year = date.getFullYear()
	const month = date.getMonth()
	const day = date.getDate()

	// Date.UTC returns the raw timestamp for midnight on that day
	const utcTimestamp = Date.UTC(year, month, day)

	return Math.floor(utcTimestamp / MS_PER_DAY)
}

/**
 * Converts a day number or Radix 36 code to a Date object.
 * The returned Date is set to midnight UTC.
 *
 * @param days - The number of days since the Unix epoch.
 * @returns A Date object representing the day at midnight UTC.
 */
export function toDate(days: number): Date
/**
 * Converts a day number or Radix 36 code to a Date object.
 * The returned Date is set to midnight UTC.
 *
 * @param code - The Radix 36 code.
 * @returns A Date object representing the day at midnight UTC.
 */
export function toDate(code: string): Date

/**
 * Implementation of toDate
 *
 * @param value - The day number or Radix 36 code.
 * @returns A Date object representing the day at midnight UTC.
 */
export function toDate(value: number | string): Date {
	const days = typeof value === 'string' ? decode(value) : value
	return new Date(days * MS_PER_DAY)
}

/**
 * Returns the date as an ISO 8601 string (YYYY-MM-DD).
 * Uses the local time of the provided Date object, avoiding UTC shifts
 * that could happen if using the .toISOString() method of the Date object.
 *
 * @param date - The Date object to format.
 * @returns The ISO date string.
 */
export function toISOString(date: Date) {
	const y = date.getFullYear()
	// Pad month and day with a leading zero if they are < 10
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')

	return `${y}-${m}-${d}`
}

/**
 * A utility class for handling dates as compact Radix 36 strings or day numbers.
 */
export class CivilDate {
	public readonly value

	constructor()
	constructor(iso: string)
	constructor(code: string)
	constructor(days: number)
	constructor(date: Date)

	// Single implementation
	constructor(value?: string | number | Date) {
		if (value instanceof Date) {
			this.value = fromDate(value)
		} else if (typeof value === 'undefined') {
			this.value = fromDate(new Date())
		} else if (typeof value === 'number') {
			if (value < MIN_DAYS || value > MAX_DAYS) {
				throw new Error(`Days out of range`)
			}
			this.value = value
		} else {
			// Check if it's an ISO string (YYYY-MM-DD)
			const match = value.match(ISO_REGEX)

			if (match) {
				// match[0] is the full string, [1][2][3] are the capture groups
				const y = parseInt(match[1])
				const m = parseInt(match[2])
				const d = parseInt(match[3])
				const date = new Date(y, m - 1, d)
				const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
				if (valid) {
					this.value = fromDate(date)
				} else {
					throw new Error(`Invalid date`)
				}
			} else {
				this.value = decode(value)
			}
		}
	}

	/**
	 * Returns the compact Radix 36 string representation.
	 * @returns The 3-character code.
	 */
	toString() {
		return encode(this.value)
	}

	/**
	 * Converts the stored value to a Date object.
	 * @returns A Date object at midnight UTC.
	 */
	toDate() {
		return toDate(this.value)
	}

	/**
	 * Returns the date as an ISO 8601 string (YYYY-MM-DD).
	 * @returns The ISO date string.
	 */
	toISOString() {
		const date = toDate(this.value)
		// at this point, the date is a UTC date, so we make a local one with the UTC parts
		const local = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
		// toISOString uses the local parts, to avoid timezone jumps
		return toISOString(local)
	}
}
