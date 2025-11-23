import morgan from 'morgan'

import { getViewerId } from '../api/viewer.helper'

morgan.token('user', (req: any) => {
  const viewerId = getViewerId(req)
  return viewerId ? viewerId : '-'
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
  disableRequestLogging: true,
  ignoreTrailingSlash: true,
} as const
