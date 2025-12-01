import set from 'lodash/set'
import morgan from 'morgan'

import { getViewerId } from '../api/get-viewer.helper'

morgan.token('user', (req: any) => {
  const viewerId = getViewerId(req)
  return viewerId ?? '-'
})

morgan.format('custom', (tokens: any, req: any, res: any) => {
  const frm = ':remote-addr :user :method :url :status - :response-time ms'
  const fn = morgan.compile(frm)
  return fn(tokens, req, res)
})

export function useMorgan(logger: any) {
  return morgan('custom', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim())
      },
    },
  })
}

export const FASTIFY_MORGAN_LOGGER = {
  trustProxy: true,
  logger: {
    serializers: {
      res: (res: any) => {
        set(res, 'raw.user', res.request?.user ?? res.request?.source)
        return {
          statusCode: res.statusCode,
        }
      },
    },
    stream: {
      write: () => {
        return
      },
    },
  },
} as const
