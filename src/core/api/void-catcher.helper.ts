import { AppLogger } from '@/core/logger'

export const voidCatcher = (err: Error) => {
  // eslint-disable-next-line no-console
  console.warn(err)
}
export const voidCatcherLogger = (logger: AppLogger) => (err: Error) => {
  logger.warn(err)
}
