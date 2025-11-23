import Debug from 'debug'

// eslint-disable-next-line no-console
Debug.log = console.log.bind(console)
export const getDebugger = (namespace: string): Debug.Debugger =>
  Debug(namespace)
