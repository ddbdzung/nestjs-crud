export enum ENVIRONMENT {
  DEVELOPMENT = 'development', // Local machine maybe
  PRODUCTION = 'production',
  TEST = 'test',
  STAGING = 'staging',
}

export const ENV_CODE: Record<string, string> = {
  [ENVIRONMENT.PRODUCTION]: '1',
  [ENVIRONMENT.STAGING]: '2',
  [ENVIRONMENT.DEVELOPMENT]: '3',
  [ENVIRONMENT.TEST]: '4',
} as const

export enum APP_NAME {
  MAIN = 'main', // Main app (for serving API requests)
  WORKER = 'worker', // Worker app (for background processing tasks)
  SOCKET = 'socket', // Socket app (for real-time communication)
}

/**
 * Single source of truth for current environment
 */
export const CURRENT_ENV = process.env.NODE_ENV || ENVIRONMENT.DEVELOPMENT

// ============================================
// Logging
// ============================================

/**
 * Standardized logging levels based on best practices.
 * Used to classify the severity and verbosity of log messages.
 */
export enum LOG_LEVEL {
  /**
   * DEBUG – developer-focused debugging
   * - Use for tracking state, parameters, internal flow
   * - Helpful in staging for bug investigation
   */
  DEBUG = 'debug',

  /**
   * INFO – general system information
   * - Use for "happy path" events
   *   (e.g., service started, user logged in, job completed)
   * - Usually always enabled in production for business insights
   */
  INFO = 'info',

  /**
   * WARN – warnings
   * - System still works but something needs attention
   *   (e.g., API retry threshold reached, slow response)
   * - Often triggers low-priority alerts
   */
  WARN = 'warn',

  /**
   * ERROR – recoverable errors
   * - A request or process failed, but the service is still running
   *   (e.g., DB query failed, API call timeout, validation error)
   * - Typically triggers medium-priority alerts
   */
  ERROR = 'error',

  /**
   * VERBOSE – detailed info for tracing complex flows
   * - Use for tracing complex flows (e.g., database query results)
   */
  VERBOSE = 'verbose',

  /**
   * HTTP – HTTP-specific events
   * - Use for HTTP-specific events (e.g., request logs, status codes, latency)
   */
  HTTP = 'http',
}

// ============================================
// HTTP & API
// ============================================

export const API_PREFIX = 'api'

export const REQUEST_ID_KEY = 'X-Request-Id'

/**
 * Enable/disable trace info logging
 * Set ENABLE_TRACE_INFO=true in environment to enable trace logging
 */
export const ENABLE_TRACE_INFO =
  process.env.ENABLE_TRACE_INFO === 'true' || false

/**
 * Enable/disable writing HTTP trace logs to file
 * Set ENABLE_TRACE_FILE=true to lower combined file level to HTTP
 */
export const ENABLE_TRACE_FILE =
  process.env.ENABLE_TRACE_FILE === 'true' || false

// ============================================
// Error Handling
// ============================================

export const DEFAULT_ERROR_NAME = 'InternalServerError'
export const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred...'
export const DEFAULT_ERROR_CODE = 'INTERNAL_SERVER_ERROR'

// ============================================
// Provider Token
// ============================================

export const REDIS_SERVICE = Symbol('REDIS_SERVICE')
