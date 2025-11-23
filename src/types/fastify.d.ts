import type { IAccountAuth } from '@/core/api/services/base.interface'

declare module 'fastify' {
  interface FastifyRequest {
    viewer?: IAccountAuth
  }
}
