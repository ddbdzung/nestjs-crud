/**
 * Winston log level priority
 * error(0) > warn(1) > info(2) > http(3) > verbose(4) > debug(5)
 */
import mongoose from 'mongoose'
import { ClsService } from 'nestjs-cls'
import * as path from 'path'
import * as util from 'util'
import * as winston from 'winston'
import 'winston-daily-rotate-file'

import {
  CURRENT_ENV,
  ENABLE_TRACE_FILE,
  ENVIRONMENT,
  LOG_LEVEL,
} from '../constants/common.constant'

// ========================
// Configuration
// ========================

const LOG_LEVEL_CONFIG = (process.env.LOG_LEVEL as LOG_LEVEL) || LOG_LEVEL.INFO
const isTestEnv = CURRENT_ENV === ENVIRONMENT.TEST
const isProductionEnv = CURRENT_ENV === ENVIRONMENT.PRODUCTION
const isDevelopmentEnv = CURRENT_ENV === ENVIRONMENT.DEVELOPMENT

// ========================
// Constants
// ========================

export const COLOR = {
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RESET: '\x1b[0m',
  GRAY: '\x1b[90m',
  BLUE: '\x1b[34m',
} as const

const COLOR_BY_LEVEL: Record<LOG_LEVEL, string> = {
  [LOG_LEVEL.ERROR]: COLOR.RED,
  [LOG_LEVEL.WARN]: COLOR.YELLOW,
  [LOG_LEVEL.INFO]: COLOR.GREEN,
  [LOG_LEVEL.DEBUG]: COLOR.CYAN,
  [LOG_LEVEL.HTTP]: COLOR.BLUE,
  [LOG_LEVEL.VERBOSE]: COLOR.CYAN,
}

// ========================
// Helper Functions
// ========================

export const colorizeText = (text: string, color: string): string =>
  `${color}${text}${COLOR.RESET}`

/**
 * Format argument for logging
 */
function formatArgument(arg: any): string {
  if (arg == null) return String(arg)
  if (typeof arg !== 'object') return String(arg)

  return util.inspect(arg, {
    depth: isProductionEnv ? 2 : Infinity,
    colors: false,
  })
}

/**
 * Get console log level based on environment
 */
function getConsoleLogLevel(env: ENVIRONMENT): LOG_LEVEL {
  const levelMap: Record<ENVIRONMENT, LOG_LEVEL> = {
    [ENVIRONMENT.PRODUCTION]: LOG_LEVEL.INFO,
    [ENVIRONMENT.DEVELOPMENT]: LOG_LEVEL.DEBUG,
    [ENVIRONMENT.STAGING]: LOG_LEVEL.VERBOSE,
    [ENVIRONMENT.TEST]: LOG_LEVEL.INFO,
  }
  return levelMap[env] || LOG_LEVEL.INFO
}

/**
 * Get file log level based on environment
 */
function getFileLogLevel(env: ENVIRONMENT): LOG_LEVEL {
  const levelMap: Record<ENVIRONMENT, LOG_LEVEL> = {
    [ENVIRONMENT.PRODUCTION]: LOG_LEVEL.ERROR,
    [ENVIRONMENT.DEVELOPMENT]: LOG_LEVEL.DEBUG,
    [ENVIRONMENT.STAGING]: LOG_LEVEL.VERBOSE,
    [ENVIRONMENT.TEST]: LOG_LEVEL.ERROR,
  }
  return levelMap[env] || LOG_LEVEL.ERROR
}

// ========================
// Winston Formats
// ========================

/**
 * Remove context from metadata before serialization
 */
const removeContextFormat = winston.format((info) => {
  if (info.context && typeof info.context === 'string') {
    if (!info.loggerContext) {
      info.loggerContext = info.context
    }
    delete info.context
  }
  return info
})

/**
 * Handle util.format style arguments (%s, %d, etc.)
 */
const splatFormat = winston.format((info) => {
  const args = info[Symbol.for('splat') as any]
  if (Array.isArray(args) && args.length > 0) {
    info.message = util.format(info.message, ...args.map(formatArgument))
  } else if (typeof info.message === 'object') {
    info.message = formatArgument(info.message)
  }
  delete info[Symbol.for('splat') as any]

  if (info.context) {
    delete info.context
  }

  return info
})

/**
 * Handle Error objects
 */
const errorFormat = winston.format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
    }
  }
  if (info.message instanceof Error) {
    const err = info.message
    info.message = err.message
    info.stack = err.stack
  }
  return info
})

/**
 * Add request context (requestId, userId) to log
 * Note: clsService will be injected at runtime
 */
let clsService: ClsService | null = null

export function setClsService(cls: ClsService): void {
  clsService = cls
}

const contextFormat = winston.format((info) => {
  if (!clsService) {
    if (info.context) {
      info.loggerContext = info.context
      delete info.context
    }
    return info
  }

  try {
    const requestId = clsService.get<string>('requestId')
    if (requestId) info.requestId = requestId

    const userId = clsService.get<string>('userId')
    if (userId) info.userId = userId
  } catch {
    // Ignore context errors in async operations
  }

  // Add logger context if available and remove from metadata
  if (info.context) {
    info.loggerContext = info.context
    delete info.context
  }

  return info
})

/**
 * Console format with colors
 */
const consoleFormat = winston.format.printf((info: any) => {
  const level = colorizeText(
    info.level.toUpperCase().padEnd(5),
    COLOR_BY_LEVEL[info.level as LOG_LEVEL] || COLOR.RESET
  )

  const timestamp = colorizeText(info.timestamp, COLOR.GRAY)
  const ms = colorizeText(info.ms ?? '', COLOR.CYAN)

  const contextInfo = []
  if (info.requestId) contextInfo.push(`[${info.requestId}]`)
  if (info.userId) contextInfo.push(`[user:${info.userId}]`)
  const context =
    contextInfo.length > 0
      ? colorizeText(contextInfo.join(' '), COLOR.BLUE) + ' '
      : ''

  // Append logger context vào cuối message nếu có
  const messageWithContext = info.loggerContext
    ? `${info.message} ${colorizeText(`(${info.loggerContext})`, COLOR.GRAY)}`
    : info.message

  const stackTrace =
    info.stack && info.level !== LOG_LEVEL.HTTP
      ? '\n' + colorizeText(info.stack as string, COLOR.RED)
      : ''

  return `[${timestamp} ${level}] ${context}${messageWithContext} ${ms}${stackTrace}`
})

/**
 * File format - remove context metadata to reduce size
 */
const fileFormat = winston.format((info) => {
  const { ms: _ms, context: _context, ...rest } = info
  // Append context vào message nếu có loggerContext
  if (info.loggerContext) {
    rest.message = `${rest.message} (${info.loggerContext})`
  }
  return rest
})

// ========================
// Winston Logger Instance
// ========================

const commonFormats = [
  errorFormat(),
  contextFormat(),
  removeContextFormat(), // Remove context from metadata before serialization
  splatFormat(),
  winston.format.ms(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
]

const combinedFileLevel = ENABLE_TRACE_FILE
  ? LOG_LEVEL.HTTP
  : getConsoleLogLevel(CURRENT_ENV as ENVIRONMENT)

export const winstonLogger = winston.createLogger({
  silent: isTestEnv,
  level: LOG_LEVEL_CONFIG,
  format: winston.format.combine(...commonFormats),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: '%DATE%-error.log',
      dirname: path.join(process.cwd(), 'logs'),
      level: getFileLogLevel(CURRENT_ENV as ENVIRONMENT),
      format: winston.format.combine(fileFormat(), winston.format.json()),
      datePattern: 'DD-MM-YYYY',
      maxFiles: '7d',
      zippedArchive: true,
    }),
    new winston.transports.DailyRotateFile({
      filename: '%DATE%-combined.log',
      dirname: path.join(process.cwd(), 'logs'),
      level: combinedFileLevel, // TODO: Add realtime enable/disable trace file
      format: winston.format.combine(fileFormat(), winston.format.json()),
      datePattern: 'DD-MM-YYYY',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new winston.transports.Console({
      silent: isTestEnv,
      level: getConsoleLogLevel(CURRENT_ENV as ENVIRONMENT),
      stderrLevels: [LOG_LEVEL.ERROR],
      format: consoleFormat,
    }),
  ],
})

function formatMongooseArgs(args: any[]): string {
  return args
    .map((arg) =>
      typeof arg === 'string'
        ? arg
        : util.inspect(arg, { depth: isProductionEnv ? 2 : 4, colors: false })
    )
    .join(', ')
}

export function inspectMessageMongoDb(
  loggerDB: Pick<winston.Logger, 'debug'> = winstonLogger
): void {
  if (!isDevelopmentEnv) {
    mongoose.set('debug', false)
    return
  }

  mongoose.set(
    'debug',
    (collectionName: string, methodName: string, ...methodArgs: any[]) => {
      const message = `${collectionName}.${methodName}(${formatMongooseArgs(methodArgs)})`
      loggerDB.debug(message)
    }
  )
}

export default winstonLogger
