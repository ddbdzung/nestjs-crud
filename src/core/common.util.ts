import { randomBytes } from 'crypto'

/**
 * Generate a trace ID for the current request
 * @param serviceHint - Optional service hint to identify the service
 * @returns The trace ID
 */
export function generateTraceId(serviceHint?: string): string {
  const ts = Date.now().toString(36).toUpperCase()

  const rand = randomBytes(4).toString('hex').toUpperCase() // 8 hex characters
  return serviceHint ? `${ts}-${rand}-${serviceHint}` : `${ts}-${rand}`
}
