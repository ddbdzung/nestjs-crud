import set from 'lodash/set'
import morgan from 'morgan'

morgan.format('custom', (tokens: any, req: any, res: any) => {
  const frm = ':remote-addr :user :method :url :status - :response-time ms'
  const fn = morgan.compile(frm)
  return fn(tokens, req, res)
})

export function useMorgan(logger: any) {
  return morgan('custom', {
    stream: logger,
  })
}

export const FASTIFY_MORGAN_LOGGER = {
  trustProxy: true,
  logger: {
    serializers: {
      res: (res: any) => {
        set(res, 'raw.user', res.request?.user ?? res.request?.source)
        return undefined
      },
    },
    stream: {
      write: () => {
        return
      },
    },
  },
}
