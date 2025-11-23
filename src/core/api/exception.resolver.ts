// import { ERROR_MESSAGES } from '@shared'
import {
  HttpStatus,
  ValidationError as NestValidationError,
} from '@nestjs/common'

import { BaseError } from '../helpers/error.helper'

export const SUCCESS = '000000'
export const UNKNOWN = '999999'
export const SYSTEM_ERROR = '990001'
export const VALIDATION = 'VALIDATION_ERROR'
export const NOT_FOUND = 'NOT_FOUND'
export const DUPLICATE = 'DUPLICATE'
export const TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS'
export const UNAUTHORIZED = 'UNAUTHORIZED'
export const FORBIDDEN = 'FORBIDDEN'

// Worker-specific error codes (reference - these should match the ones in worker.exception.ts)
export const WORKER_ERROR = 'WORKER_ERROR'
export const JOB_EXECUTION_ERROR = 'JOB_EXECUTION_ERROR'
export const JOB_TIMEOUT_ERROR = 'JOB_TIMEOUT_ERROR'
export const JOB_SCHEDULING_ERROR = 'JOB_SCHEDULING_ERROR'
export const JOB_QUEUE_ERROR = 'JOB_QUEUE_ERROR'
export const WORKER_RESOURCE_ERROR = 'WORKER_RESOURCE_ERROR'

export const ALL_MESSAGES: Record<string, string> = {
  // ...ERROR_MESSAGES,
  [SUCCESS]: 'Thành công',
  [UNKNOWN]: 'Lỗi!!!',
  [SYSTEM_ERROR]: 'Uh oh, lỗi hệ thống!',
  [VALIDATION]: 'Dữ liệu nhập vào không đúng!',
  [NOT_FOUND]: 'Không tìm thấy dữ liệu!',
  [DUPLICATE]: 'Trùng lặp thông tin!',
  [TOO_MANY_REQUESTS]: 'Quá nhiều yêu cầu, vui lòng thử lại sau!',
  [UNAUTHORIZED]: 'Bạn chưa đăng nhập!',
  [FORBIDDEN]: 'Bạn không có quyền truy cập!',

  // Worker error messages
  [WORKER_ERROR]: 'Lỗi worker!',
  [JOB_EXECUTION_ERROR]: 'Lỗi xử lý job!',
  [JOB_TIMEOUT_ERROR]: 'Job bị timeout!',
  [JOB_SCHEDULING_ERROR]: 'Lỗi lập lịch job!',
  [JOB_QUEUE_ERROR]: 'Lỗi hàng đợi job!',
  [WORKER_RESOURCE_ERROR]: 'Lỗi tài nguyên worker!',
}
// const ALL_ERROR_CODES = Object.keys(ALL_MESSAGES);

const ERROR_CODE_PATTERN = /^[A-Z_.]*[0-9]*$/

function stripValidationTargets(
  validationErrors: NestValidationError[]
): NestValidationError[] {
  return validationErrors.map((error) => {
    const { target: _target, children, ...rest } = error
    return {
      ...rest,
      ...(children && { children: stripValidationTargets(children) }),
    } as NestValidationError
  })
}

function reduceConstraintMsgs(
  validationErrors: NestValidationError[]
): string[] {
  return validationErrors.reduce((acc, cur) => {
    const errorCodes =
      cur.contexts &&
      Object.values(cur.contexts)
        .map((context) => context?.errorCode)
        .filter(Boolean)

    let ret = acc.concat(errorCodes ?? Object.values(cur?.constraints || {}))

    if (cur?.children) ret = ret.concat(reduceConstraintMsgs(cur?.children))

    return ret
  }, [] as string[])
}

export function solveErrorCode(validationErrors: NestValidationError[]) {
  const constraintMsgs = reduceConstraintMsgs(validationErrors)
  const subStatuses = constraintMsgs
    .filter((message) => ERROR_CODE_PATTERN.test(message))
    .sort()

  if (subStatuses.length) return subStatuses[0]

  return VALIDATION
}

export class ValidationError extends BaseError {
  constructor(
    validationErrors: NestValidationError[],
    message = ALL_MESSAGES[VALIDATION]
  ) {
    const subStatus = solveErrorCode(validationErrors)
    const sanitizedErrors = stripValidationTargets(validationErrors)

    super(message, {
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: subStatus,
      context: {
        subStatus,
        errors: sanitizedErrors,
      },
    })
  }
}

export class NotFoundError extends BaseError {
  constructor(message = ALL_MESSAGES[NOT_FOUND]) {
    super(message, {
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: NOT_FOUND,
    })
  }
}

export class DuplicateError extends BaseError {
  constructor(message = ALL_MESSAGES[DUPLICATE]) {
    super(message, {
      statusCode: HttpStatus.CONFLICT,
      errorCode: DUPLICATE,
    })
  }
}

export class TooManyRequestsError extends BaseError {
  constructor(message = ALL_MESSAGES[TOO_MANY_REQUESTS]) {
    super(message, {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      errorCode: TOO_MANY_REQUESTS,
    })
  }
}

export class SystemError extends BaseError {
  constructor(message = ALL_MESSAGES[SYSTEM_ERROR]) {
    super(message, {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: SYSTEM_ERROR,
    })
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = ALL_MESSAGES[UNAUTHORIZED]) {
    super(message, {
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: UNAUTHORIZED,
    })
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = ALL_MESSAGES[FORBIDDEN]) {
    super(message, {
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: FORBIDDEN,
    })
  }
}
