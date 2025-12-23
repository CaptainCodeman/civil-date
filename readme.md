# civil-date

A lightweight utility for handling **timezone-independent calendar dates**.

A "civil date" refers to a standard calendar day (Year-Month-Day) used for administrative and everyday purposes. Unlike a timestamp, it represents a whole day regardless of the time or the user's location.

## The Problem

Using standard UTC timestamps for daily data often leads to "off-by-one-day" errors. For example, `2025-12-19T23:00:00Z` is the 19th in New York but the 20th in London. Storing this as a single UTC timestamp makes it difficult to query "all records for the 19th" consistently across timezones. Often, users will only care about data for _their_ 'day'.

## The Solution

This package converts a local date (e.g., "2025-12-19") into a **Unix Day Count** (days since the epoch) and encodes it as a **compact, sortable Radix 36 string** (e.g., `FRT`).

This is ideal for:
- **Storage Keys:** Efficiently storing date-based data in Firestore maps, Redis hashes, or JSON.
- **Daily Metrics:** Tracking daily balances, counts, or habits without timezone ambiguity.
- **Compactness:** Reducing `2025-12-19` (10 chars) to `FRT` (3 chars).

## Relation to Temporal API

The upcoming JavaScript `Temporal` API provides a `PlainDate` class which will become the standard way to represent a date without time or timezone. While excellent for date math, converting a `PlainDate` to a simple integer (days since epoch) for storage is not yet widely available and surprisingly complex:

```ts
// Temporal
const date = Temporal.PlainDate.from('2025-12-19')
const epoch = Temporal.PlainDate.from('1970-01-01')
const days = date.since(epoch).days
```

`civil-date` focuses specifically on the storage aspect, providing a direct conversion to a compact, sortable key.

## Usage

C'mon, you know the drill, do I really have to say it? Use your favorite package manager to install it. I like pnpm:

    pnpm i civil-date

There are low-level tree-shakeable methods you can import and use, or a class if that's what you prefer.

### Tree-shakeable methods

You can use the individual functions directly if you don't want to use the class.

```ts
import { encode, decode, fromDate, toDate } from 'civil-date'

// Convert a Date object to a unix day number (uses local time)
const days = fromDate(new Date()) // 20447

// Encode a unix day number to a Radix 36 string
const key = encode(days) // 'FRT'

// Decode a Radix 36 string to a unix day number
const decodedDays = decode('FRT') // 20447

// Convert a unix day number or Radix 36 string to a Date object (midnight UTC)
const date = toDate(days)
const date2 = toDate('FRT')
```

### CivilDate Class

Create a new instance for the current day:

```ts
const day = new CivilDate()
```

Create a new instance from a JavaScript Date object (it will use the local year, month, and day):

```ts
const day = new CivilDate(new Date(2025, 11, 19))
```

Create a new instance from an ISO 8601 / RFC RFC 9557 Date string. Non YYYY-MM-DD format strings and invalid dates will throw an error.

```ts
const day = new CivilDate('2025-12-19')
```

Create a new instance from a Radix 36 encoded string of the number of unix days since the epoch:

```ts
const day = new CivilDate('FRT')
```

Create a new instance from a unix day (days since the unix epoch):

```ts
const day = new CivilDate(20447)
```

The unix day will be available as a `.value` property of the instance.

```ts
const day = new CivilDate('2025-12-19')

console.log(day.value)	// 20441
console.log(day.toString()) // FRT
```

You can use a previously saved key to restore a date using:

```ts
const day = new CivilDate('FRT')
```

Use `.toString()` to get the encoded key:

```ts
const key = day.toString()

console.log(key)		// 'FRT'
```

Use `.toISOString()` to get the ISO 8601 Date string:

```ts
const iso = day.toISOString()

console.log(iso)		// '2025-12-19'
```

Use `.toDate()` to get a JavaScript Date object (set to midnight UTC):

```ts
const date = day.toDate()
```