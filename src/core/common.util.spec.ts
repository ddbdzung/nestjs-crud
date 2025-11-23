/**
 * Unit tests for Common Utilities
 * Test file using Jest framework
 */
import { generateTraceId, mergeOptions } from './common.util'

describe('Common Utilities', () => {
  describe('generateTraceId', () => {
    test('should generate a trace ID without service hint', () => {
      const traceId = generateTraceId()
      expect(traceId).toBeDefined()
      expect(typeof traceId).toBe('string')
      // Format: TIMESTAMP-RANDOM (e.g., "L12345678-ABCDEF12")
      expect(traceId).toMatch(/^[A-Z0-9]+-[A-F0-9]{8}$/)
    })

    test('should generate a trace ID with service hint', () => {
      const serviceHint = 'user-service'
      const traceId = generateTraceId(serviceHint)
      expect(traceId).toBeDefined()
      expect(typeof traceId).toBe('string')
      // Format: TIMESTAMP-RANDOM-SERVICEHINT
      expect(traceId).toMatch(/^[A-Z0-9]+-[A-F0-9]{8}-user-service$/)
      expect(traceId).toContain(serviceHint)
    })

    test('should generate unique trace IDs', () => {
      const traceId1 = generateTraceId()
      const traceId2 = generateTraceId()
      expect(traceId1).not.toBe(traceId2)
    })

    test('should generate unique trace IDs with same service hint', () => {
      const serviceHint = 'api-service'
      const traceId1 = generateTraceId(serviceHint)
      const traceId2 = generateTraceId(serviceHint)
      expect(traceId1).not.toBe(traceId2)
      expect(traceId1).toContain(serviceHint)
      expect(traceId2).toContain(serviceHint)
    })

    test('should handle empty string service hint as no hint', () => {
      const traceId = generateTraceId('')
      expect(traceId).toBeDefined()
      // Empty string is falsy, so it should return format without service hint
      expect(traceId).toMatch(/^[A-Z0-9]+-[A-F0-9]{8}$/)
    })

    test('should handle special characters in service hint', () => {
      const serviceHint = 'service-v1.0'
      const traceId = generateTraceId(serviceHint)
      expect(traceId).toBeDefined()
      expect(traceId).toContain(serviceHint)
    })
  })
})

describe('mergeOptions', () => {
  describe('Basic functionality', () => {
    it('should return defaults when options is undefined', () => {
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(undefined, defaults)

      expect(result).toEqual({ timeout: 5000, retry: 3 })
      expect(result).not.toBe(defaults) // Should be new object
    })

    it('should return defaults when options is null', () => {
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(null, defaults)

      expect(result).toEqual({ timeout: 5000, retry: 3 })
      expect(result).not.toBe(defaults)
    })

    it('should merge options with defaults', () => {
      const options = { timeout: 3000 }
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: 3000, retry: 3 })
    })

    it('should override defaults with options', () => {
      const options = { timeout: 1000, retry: 5 }
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: 1000, retry: 5 })
    })
  })

  describe('Edge cases - Empty objects', () => {
    it('should handle empty options object', () => {
      const options = {}
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: 5000, retry: 3 })
    })

    it('should handle empty defaults object', () => {
      const options = { timeout: 3000 }
      const defaults = {}
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: 3000 })
    })

    it('should handle both empty objects', () => {
      const options = {}
      const defaults = {}
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({})
    })
  })

  describe('Edge cases - Falsy values', () => {
    it('should preserve false values in options', () => {
      const options = { enabled: false }
      const defaults = { enabled: true, timeout: 5000 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ enabled: false, timeout: 5000 })
    })

    it('should preserve 0 values in options', () => {
      const options = { timeout: 0 }
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: 0, retry: 3 })
    })

    it('should preserve empty string in options', () => {
      const options = { name: '' }
      const defaults = { name: 'default', timeout: 5000 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ name: '', timeout: 5000 })
    })

    it('should preserve NaN in options', () => {
      const options = { value: NaN }
      const defaults = { value: 100 }
      const result = mergeOptions(options, defaults)

      expect(result.value).toBeNaN()
    })
  })

  describe('Edge cases - Special values', () => {
    it('should handle undefined values in options', () => {
      const options = { timeout: undefined }
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(options, defaults)

      // undefined in options should override defaults
      expect(result).toEqual({ timeout: undefined, retry: 3 })
    })

    it('should handle null values in options', () => {
      const options = { timeout: null } as any
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: null, retry: 3 })
    })

    it('should handle Infinity in options', () => {
      const options = { timeout: Infinity }
      const defaults = { timeout: 5000 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: Infinity })
    })

    it('should handle negative numbers in options', () => {
      const options = { timeout: -1 }
      const defaults = { timeout: 5000 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ timeout: -1 })
    })
  })
  describe('Edge cases - Nested objects', () => {
    it('should do shallow merge (not deep merge)', () => {
      const options = { config: { timeout: 3000 } } as any
      const defaults = { config: { timeout: 5000, retry: 3 } }
      const result = mergeOptions(options, defaults)

      // Shallow merge means nested objects are replaced, not merged
      expect(result).toEqual({ config: { timeout: 3000 } })
      expect(result.config).not.toHaveProperty('retry')
    })

    it('should replace nested objects completely', () => {
      const options = { nested: { a: 1 } } as any
      const defaults = { nested: { b: 2 }, timeout: 5000 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ nested: { a: 1 }, timeout: 5000 })
    })
  })

  describe('Edge cases - Arrays', () => {
    it('should replace arrays, not merge them', () => {
      const options = { tags: ['new'] }
      const defaults = { tags: ['default', 'old'] }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ tags: ['new'] })
    })

    it('should handle empty arrays', () => {
      const options = { tags: [] }
      const defaults = { tags: ['default'] }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ tags: [] })
    })
  })

  describe('Edge cases - Functions', () => {
    it('should handle function values', () => {
      const fn = () => 'test'
      const options = { callback: fn }
      const defaults = { callback: () => 'default' }
      const result = mergeOptions(options, defaults)

      expect(result.callback).toBe(fn)
      expect(result.callback()).toBe('test')
    })
  })

  describe('Edge cases - Symbol and special keys', () => {
    it('should handle Symbol keys', () => {
      const sym = Symbol('test')
      const options = { [sym]: 'value' }
      const defaults = { [sym]: 'default', timeout: 5000 }
      const result = mergeOptions(options, defaults)

      expect(result[sym]).toBe('value')
      expect(result.timeout).toBe(5000)
    })

    it('should handle numeric string keys', () => {
      const options = { '0': 'zero' }
      const defaults = { '0': 'default', '1': 'one' }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ '0': 'zero', '1': 'one' })
    })
  })

  describe('Edge cases - Immutability', () => {
    it('should not mutate original options', () => {
      const options = { timeout: 3000 }
      const defaults = { timeout: 5000, retry: 3 }
      const optionsCopy = { ...options }

      mergeOptions(options, defaults)

      expect(options).toEqual(optionsCopy)
    })

    it('should not mutate original defaults', () => {
      const options = { timeout: 3000 }
      const defaults = { timeout: 5000, retry: 3 }
      const defaultsCopy = { ...defaults }

      mergeOptions(options, defaults)

      expect(defaults).toEqual(defaultsCopy)
    })

    it('should return new object reference', () => {
      const options = { timeout: 3000 }
      const defaults = { timeout: 5000, retry: 3 }
      const result = mergeOptions(options, defaults)

      expect(result).not.toBe(options)
      expect(result).not.toBe(defaults)
    })
  })

  describe('Edge cases - Type safety', () => {
    it('should work with complex types', () => {
      interface Config {
        timeout: number
        retry: number
        callback?: () => void
        nested?: { value: string }
      }

      const options: Partial<Config> = { timeout: 3000 }
      const defaults: Config = {
        timeout: 5000,
        retry: 3,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        callback: () => {},
        nested: { value: 'default' },
      }
      const result = mergeOptions(options, defaults)

      expect(result.timeout).toBe(3000)
      expect(result.retry).toBe(3)
    })

    it('should work with union types', () => {
      interface Config {
        mode: 'fast' | 'slow'
        timeout: number
      }

      const options: Partial<Config> = { mode: 'fast' }
      const defaults: Config = { mode: 'slow', timeout: 5000 }
      const result = mergeOptions(options, defaults)

      expect(result).toEqual({ mode: 'fast', timeout: 5000 })
    })
  })

  describe('Edge cases - Large objects', () => {
    it('should handle objects with many properties', () => {
      const largeDefaults = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`key${i}`, i])
      )
      const options = { key50: 999 }
      const result = mergeOptions(options, largeDefaults)

      expect(result.key50).toBe(999)
      expect(result.key0).toBe(0)
      expect(result.key99).toBe(99)
      expect(Object.keys(result)).toHaveLength(100)
    })
  })

  describe('Edge cases - Date and RegExp', () => {
    it('should handle Date objects', () => {
      const date = new Date('2024-01-01')
      const options = { createdAt: date }
      const defaults = { createdAt: new Date('2023-01-01') }
      const result = mergeOptions(options, defaults)

      expect(result.createdAt).toBe(date)
      expect(result.createdAt.getTime()).toBe(date.getTime())
    })

    it('should handle RegExp objects', () => {
      const regex = /test/i
      const options = { pattern: regex }
      const defaults = { pattern: /default/ }
      const result = mergeOptions(options, defaults)

      expect(result.pattern).toBe(regex)
    })
  })
})
