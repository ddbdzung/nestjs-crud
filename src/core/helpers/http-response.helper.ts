import { IThrowable } from '../common.interface'
import { HTTP_STATUS } from '../constants/http-status.constant'

const successResponse = HTTP_STATUS.OK

/**
 * Class to build standardized HTTP response
 * @type T - The type of the data
 * @type K - The type of the metadata
 */
export class HttpResponse<T = any, K = Record<string, any>> implements IThrowable {
  protected success: boolean
  protected timestamp: Date

  constructor(
    protected statusCode: number,
    protected data: T | null,
    protected message: string,
    protected metadata: K = {} as K
  ) {
    this.statusCode = statusCode ?? successResponse.code
    this.data = data
    this.message = message ?? successResponse.message
    this.metadata = metadata
    this.success = this.statusCode >= 200 && this.statusCode < 300
    this.timestamp = new Date()
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      meta: this.metadata,
      timestamp: this.timestamp,
    }
  }
}
