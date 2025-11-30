/**
 * Winston log level priority
 * error(0) > warn(1) > info(2) > http(3) > verbose(4) > debug(5)
 */
import * as path from 'path'
import * as util from 'util'

import { ClsService } from 'nestjs-cls'
import * as winston from 'winston'

import 'winston-daily-rotate-file'

import {
  CURRENT_ENV,
  ENVIRONMENT,
  LOG_LEVEL,
  type ENVIRONMENT as ENVIRONMENT_TYPE,
  type LOG_LEVEL as LOG_LEVEL_TYPE,
} from '../constants/common.constant'

// Types & Enums
export interface CallerInfo {
  file: string
  line: string
  filePath: string
}

export interface LogMetadata {
  requestId?: string
  userId?: string
  caller?: CallerInfo
  stack?: string
  [key: string]: any
}

// ========================
// Configuration
// ========================

const LOG_LEVEL_CONFIG =
  (process.env.LOG_LEVEL as (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL]) || LOG_LEVEL.INFO
const isTestEnv = CURRENT_ENV === ENVIRONMENT.TEST
const isProductionEnv = CURRENT_ENV === ENVIRONMENT.PRODUCTION
const ENABLE_CALLER_TRACKING = !isProductionEnv

// ========================
// Constants
// ========================

const STACK_REGEX = /\((.*):(\d+):(\d+)\)|at\s+(.*):(\d+):(\d+)/
const currentFileName = path.basename(__filename)

const COLOR = {
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RESET: '\x1b[0m',
  GRAY: '\x1b[90m',
  BLUE: '\x1b[34m',
} as const

const COLOR_BY_LEVEL: Record<(typeof LOG_LEVEL)[keyof typeof LOG_LEVEL], string> = {
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

const shouldSkipFrame = (line: string): boolean =>
  line.includes('node_modules') || line.includes(currentFileName)

const colorizeText = (text: string, color: string): string => `${color}${text}${COLOR.RESET}`

/**
 * Get caller information from stack trace
 */
function getCallerInfo(): CallerInfo | null {
  const stack = new Error().stack
  if (!stack) return null

  const lines = stack.split('\n')

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (shouldSkipFrame(line)) continue

    const match = STACK_REGEX.exec(line)
    if (!match) continue

    const filePath = match[1] || match[4]
    const lineNumber = match[2] || match[5]

    if (!filePath) continue

    const normalizedPath = filePath.replace(/^file:\/\//, '')
    const relativePath = path.relative(process.cwd(), normalizedPath)

    const pathParts = relativePath.split(path.sep)
    const fileName = pathParts[pathParts.length - 1]
    const parentDir = pathParts.length > 1 ? pathParts[pathParts.length - 2] : ''

    const displayPath = parentDir ? `${parentDir}/${fileName}` : fileName

    return {
      file: displayPath,
      line: lineNumber,
      filePath: relativePath,
    }
  }

  return null
}

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
function getConsoleLogLevel(env: ENVIRONMENT_TYPE): LOG_LEVEL_TYPE {
  const levelMap: Record<ENVIRONMENT_TYPE, LOG_LEVEL_TYPE> = {
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
function getFileLogLevel(env: ENVIRONMENT_TYPE): LOG_LEVEL_TYPE {
  const levelMap: Record<ENVIRONMENT_TYPE, LOG_LEVEL_TYPE> = {
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
 * Add caller information to log
 */
const callerFormat = winston.format((info) => {
  if (!ENABLE_CALLER_TRACKING) return info
  const caller = getCallerInfo()
  if (caller) info.caller = caller
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
  if (!clsService) return info

  try {
    const requestId = clsService.get<string>('requestId')
    if (requestId) info.requestId = requestId

    const userId = clsService.get<string>('userId')
    if (userId) info.userId = userId
  } catch {
    // Ignore context errors in async operations
  }

  return info
})

/**
 * Console format with colors
 */
const consoleFormat = winston.format.printf((info: any) => {
  const level = colorizeText(
    info.level.toUpperCase().padEnd(5),
    COLOR_BY_LEVEL[info.level as LOG_LEVEL_TYPE] || COLOR.RESET
  )

  const timestamp = colorizeText(info.timestamp, COLOR.GRAY)
  const ms = colorizeText(info.ms ?? '', COLOR.CYAN)

  const callerInfo =
    info.caller && info.level !== LOG_LEVEL.HTTP
      ? colorizeText(`(${info.caller.file}:${info.caller.line})`, COLOR.GRAY) + ' '
      : ''

  const contextInfo = []
  if (info.requestId) contextInfo.push(`[${info.requestId}]`)
  if (info.userId) contextInfo.push(`[user:${info.userId}]`)
  const context =
    contextInfo.length > 0 ? colorizeText(contextInfo.join(' '), COLOR.BLUE) + ' ' : ''

  const stackTrace =
    info.stack && info.level !== LOG_LEVEL.HTTP
      ? '\n' + colorizeText(info.stack as string, COLOR.RED)
      : ''

  return `[${timestamp} ${level}] ${context}${callerInfo}${info.message} ${ms}${stackTrace}`
})

/**
 * File format - remove caller to reduce size
 */
const fileFormat = winston.format((info) => {
  const { caller: _caller, ms: _ms, ...rest } = info
  return rest
})

// ========================
// Winston Logger Instance
// ========================

const commonFormats = [
  errorFormat(),
  contextFormat(),
  ...(ENABLE_CALLER_TRACKING ? [callerFormat()] : []),
  splatFormat(),
  winston.format.ms(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
]

export const winstonLogger = winston.createLogger({
  silent: isTestEnv,
  level: LOG_LEVEL_CONFIG,
  format: winston.format.combine(...commonFormats),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: '%DATE%-error.log',
      dirname: path.join(process.cwd(), 'logs'),
      level: getFileLogLevel(CURRENT_ENV as ENVIRONMENT_TYPE),
      format: winston.format.combine(fileFormat(), winston.format.json()),
      datePattern: 'DD-MM-YYYY',
      maxFiles: '7d',
      zippedArchive: true,
    }),
    new winston.transports.DailyRotateFile({
      filename: '%DATE%-combined.log',
      dirname: path.join(process.cwd(), 'logs'),
      level: getConsoleLogLevel(CURRENT_ENV as ENVIRONMENT_TYPE),
      format: winston.format.combine(fileFormat(), winston.format.json()),
      datePattern: 'DD-MM-YYYY',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new winston.transports.Console({
      silent: isTestEnv,
      level: getConsoleLogLevel(CURRENT_ENV as ENVIRONMENT_TYPE),
      stderrLevels: [LOG_LEVEL.ERROR],
      format: consoleFormat,
    }),
  ],
})

export default winstonLogger
