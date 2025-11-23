import { randomBytes } from 'crypto'

interface CustomError extends Error {
  code?: number
}
interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  cbEachRetry?: ((error: CustomError, retryCount: number) => void) | null
  shouldRetry?: ((error: CustomError) => boolean) | null
}

/**
 * Merge options with defaults
 */
export function mergeOptions<T extends Record<string, any>>(
  options: Partial<T> | undefined | null,
  defaults: T
): T {
  if (options === undefined || options === null) {
    return { ...defaults }
  }

  return {
    ...defaults,
    ...options,
  }
}

/**
 * Generate a trace ID for the current request
 * @param serviceHint - Optional service hint to identify the service
 */
export function generateTraceId(serviceHint?: string): string {
  const ts = Date.now().toString(36).toUpperCase()

  const rand = randomBytes(4).toString('hex').toUpperCase() // 8 hex characters
  return serviceHint ? `${ts}-${rand}-${serviceHint}` : `${ts}-${rand}`
}

/**
 * Check if value is null or undefined
 * @param {*} value - The value to check
 */
export const isNil = (value: unknown): value is null | undefined =>
  value === null || value === undefined

/**
 * Check if value is an object (excluding null and arrays)
 * @param {*} value - The value to check
 */
export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Check if value is a plain object (created by Object constructor or literal)
 * @param {*} value - The value to check
 */
export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> => {
  if (!isObject(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {unknown} value - The value to check
 */
export const isEmpty = (value: unknown): boolean => {
  if (isNil(value)) return true // null, undefined
  if (typeof value === 'string' || Array.isArray(value))
    return value.length === 0 // '', []
  if (isPlainObject(value)) return Object.keys(value).length === 0 // {}
  return false
}

function exponentialDelay(base: number, retries: number): number {
  return base * Math.pow(2, retries)
}

/**
 * Check if value is a primitive (null, undefined, string, number, boolean, symbol, bigint)
 * @param {unknown} value - The value to check
 */
export const isPrimitive = (value: unknown): boolean => {
  return (
    value === null ||
    typeof value === 'undefined' ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint'
  )
}

export const snooze = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const formatCurrency = (amount?: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(
    amount || 0
  )
}

/**
 * Executes an asynchronous function with automatic retry capabilities
 *
 * @template T - The type of the resolved promise value
 * @param {() => Promise<T>} fn - Asynchronous function to execute with retries
 * @param {RetryOptions} [options] - Configuration options for retry behavior
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.delay=1000] - Delay between retries in milliseconds
 * @param {(error: Error, retryCount: number) => void} [options.cbEachRetry] - Callback executed on each retry attempt
 * @param {(error: Error) => boolean} [options.shouldRetry] - Custom function to determine if a retry should be attempted
 * @returns {Promise<T>} - Promise resolving with the result of the successful execution
 * @throws {Error} - Original error or last encountered error after all retries fail
 *
 * @example
 * // Basic usage with default options
 * const result = await retryAsync(() => fetchData());
 *
 * @example
 * // Custom retry options and logging
 * await retryAsync(() => api.post(data), {
 *   maxRetries: 5,
 *   delay: 300,
 *   cbEachRetry: (error, attempt) => {
 *     console.warn(`Attempt ${attempt} failed: ${error.message}`);
 *   }
 * });
 *
 * @example
 * // Using with class methods (safe context handling)
 * class Service {
 *   async getData() {
 *     return await retryAsync(() => this.fetchInternal(), {
 *       shouldRetry: err => err.status !== 404
 *     });
 *   }
 * }
 *
 * @example
 * // Conditional retry logic
 * await retryAsync(() => processPayment(), {
 *   shouldRetry: (error) =>
 *     error.code === 'NETWORK_ERROR' ||
 *     error.code === 'TIMEOUT'
 * });
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1_000,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    cbEachRetry = () => {},
    shouldRetry = () => true,
  } = options

  for (let retries = 0; retries < maxRetries; retries++) {
    try {
      return await fn()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      if (retries + 1 >= maxRetries || (shouldRetry && !shouldRetry(err))) {
        throw err
      }

      cbEachRetry?.(err, retries + 1)
      await snooze(exponentialDelay(baseDelay, retries))
    }
  }

  throw new Error('Unreachable code')
}
