export const HTTP_STATUS = {
  OK: { code: 200, message: 'OK', key: 'OK' },
  CREATED: { code: 201, message: 'Created', key: 'CREATED' },
  ACCEPTED: { code: 202, message: 'Accepted', key: 'ACCEPTED' },
  NO_CONTENT: { code: 204, message: 'No Content', key: 'NO_CONTENT' },

  BAD_REQUEST: { code: 400, message: 'Bad Request', key: 'BAD_REQUEST' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized', key: 'UNAUTHORIZED' },
  FORBIDDEN: { code: 403, message: 'Forbidden', key: 'FORBIDDEN' },
  NOT_FOUND: { code: 404, message: 'Not Found', key: 'NOT_FOUND' },
  REQUEST_TIMEOUT: {
    code: 408,
    message: 'Request Timeout',
    key: 'REQUEST_TIMEOUT',
  },
  CONFLICT: { code: 409, message: 'Conflict', key: 'CONFLICT' },
  UNPROCESSABLE_ENTITY: {
    code: 422,
    message: 'Unprocessable Entity',
    key: 'UNPROCESSABLE_ENTITY',
  },
  TOO_MANY_REQUESTS: {
    code: 429,
    message: 'Too Many Requests',
    key: 'TOO_MANY_REQUESTS',
  },

  INTERNAL_SERVER_ERROR: {
    code: 500,
    message: 'Internal Server Error',
    key: 'INTERNAL_SERVER_ERROR',
  },
  SERVICE_UNAVAILABLE: {
    code: 503,
    message: 'Service Unavailable',
    key: 'SERVICE_UNAVAILABLE',
  },
} as const

// Helper nếu thực sự cần
export const getHttpStatus = (code: number) => {
  const entry = Object.entries(HTTP_STATUS).find(([_, v]) => v.code === code)
  if (!entry) throw new Error(`Status code not found: ${code}`)
  return entry[1]
}

// Usage
// HTTP_STATUS.OK.code // 200
// HTTP_STATUS.OK.message // "OK"
// getHttpStatus(200) // { key: "OK", code: 200, message: "OK" }
