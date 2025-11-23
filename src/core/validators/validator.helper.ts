import { plainToInstance } from 'class-transformer'
import {
  ValidationError as NestValidationError,
  validate,
} from 'class-validator'

import { BadRequestException, Type } from '@nestjs/common'

import { ValidationError } from '../api/exception.resolver'

export function exceptionFactory(errors: NestValidationError[]) {
  const messages = errors.map((error) => {
    const constraints = error.constraints || {}
    return Object.values(constraints).join(', ')
  })
  return new BadRequestException(messages.join('; '))
}

export async function handleValidate(
  classDto: Type,
  input: any,
  isReject = true
) {
  const dto = plainToInstance(classDto, input)
  const errors = await validate(dto, {
    whitelist: true,
    stopAtFirstError: true,
    forbidUnknownValues: false,
  })

  if (errors.length && isReject) throw new ValidationError(errors)

  return {
    dto,
    errors,
    isError: !!errors.length,
  }
}
