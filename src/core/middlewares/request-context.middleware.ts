import { ClsService } from 'nestjs-cls'

import { Inject, Injectable, NestMiddleware } from '@nestjs/common'

import { AppLogger } from '@/core/logger'

import { generateRequestId } from '../api/generate-tracking-id'
import {
  setViewerEmailToCls,
  setViewerIdToCls,
  setViewerNameToCls,
} from '../api/viewer.helper'
import { ENABLE_TRACE_INFO, REQUEST_ID_KEY } from '../constants/common.constant'

/**
 * Enum định nghĩa các điểm trace trong chu trình xử lý request
 * - ON_REQUEST: Request entered Fastify `onRequest` hook – bắt đầu chu trình xử lý
 * - AFTER_GUARD: Sau khi guard xác thực (ví dụ JwtGuard) thành công
 * - CONTROLLER: (Tuỳ chọn) Đã vào controller – dùng khi muốn trace sâu
 * - SERVICE: (Tuỳ chọn) Đã vào service layer
 * - REPOSITORY: (Tuỳ chọn) Đã vào repository / persistence layer
 * - ON_RESPONSE: Response thành công chuẩn bị gửi về client (đặt tại ResponseTransformInterceptor)
 * - ON_ERROR: Xảy ra exception và response sẽ ở nhánh error (đặt tại ExceptionFilters)
 */
export enum ETrace {
  ON_REQUEST = 'onRequest',
  AFTER_GUARD = 'afterGuard',
  CONTROLLER = 'controller',
  SERVICE = 'service',
  REPOSITORY = 'repository',
  ON_RESPONSE = 'onResponse',
  ON_ERROR = 'onError',
}

export function pushTrace(cls: ClsService, label: ETrace) {
  // Skip verbose layers if not needed
  if (
    label === ETrace.CONTROLLER ||
    label === ETrace.SERVICE ||
    label === ETrace.REPOSITORY
  ) {
    return
  }

  try {
    let trace: string[] = cls.get('trace')
    if (!Array.isArray(trace)) {
      trace = Array.from(trace ?? [])
    }
    if (!trace.includes(label.toString())) {
      trace.push(label.toString())
    }
    cls.set('trace', trace)
  } catch {
    // ignore any CLS issues
  }
}

function shortenUrl(url: string, sliceLen = 10): string {
  try {
    const u = new URL(url)

    if (u.search) {
      // Lấy phần query string sau '?'
      const query = u.search.slice(1)
      const shortened =
        query.length > sliceLen ? query.slice(0, sliceLen) + '…' : query
      return `${u.origin}${u.pathname}?${shortened}`
    }

    return `${u.origin}${u.pathname}`
  } catch {
    return url
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  protected readonly logger: AppLogger

  constructor(@Inject(ClsService) private readonly cls: ClsService) {
    this.logger = AppLogger.create(cls, RequestContextMiddleware.name)
  }

  use(req: any, _res: any, next: () => void) {
    const endpoint = req.url
    const requestId = req.headers[REQUEST_ID_KEY] || generateRequestId(endpoint)
    if (ENABLE_TRACE_INFO) {
      this.logger.http(`→ ${ETrace.ON_REQUEST}`, {
        requestId,
        requestMethod: req.method,
        requestUrl: shortenUrl(endpoint),
        requestHost: req.headers['host'],
      })
    }

    req.cls = this.cls
    req.requestId = requestId
    const setCtx = () => {
      this.cls.set('requestId', requestId)
      // End time sẽ được lưu khi response được gửi
      this.cls.set('requestStartTime', Date.now())
      this.cls.set('url', endpoint)
      this.cls.set('method', req.method)
      this.cls.set('ip', req.ip)
      this.cls.set('protocol', req.protocol)
      this.cls.set('host', req.headers['host'])
      this.cls.set('userAgent', req.headers['user-agent'])
      this.cls.set('origin', req.headers['origin'])
      this.cls.set('referer', req.headers['referer'])
      this.cls.set('remotePort', req.socket?.remotePort)
      // viewer info sẽ được thêm sau khi JwtGuard xác thực (interceptor)
      setViewerIdToCls(this.cls, null)
      setViewerNameToCls(this.cls, '')
      setViewerEmailToCls(this.cls, '')

      // init trace array
      this.cls.set('trace', [])
      pushTrace(this.cls, ETrace.ON_REQUEST)
    }

    if (this.cls.isActive()) {
      setCtx()
      next()
    } else {
      // Tạo CLS context nếu chưa có (tránh lỗi No CLS context)
      this.cls.run(() => {
        setCtx()
        next()
      })
    }
  }
}

export function getReqCtx(cls: ClsService) {
  return {
    // 1. Metadata về request
    requestId: cls.get('requestId'),
    requestStartTime: cls.get('requestStartTime'),
    requestDuration: cls.get('requestDuration'),
    trace: Array.isArray(cls.get('trace'))
      ? cls.get('trace')
      : Array.from(cls.get('trace') || []),

    // 2. Thông tin HTTP (nếu có)
    method: cls.get('method'),
    protocol: cls.get('protocol'),
    url: cls.get('url'),
    host: cls.get('host'),
    ip: cls.get('ip'),
    remotePort: cls.get('remotePort'),
    userAgent: cls.get('userAgent'),

    // 2.1 Headers liên quan đến nguồn gốc request (nếu có)
    origin: cls.get('origin'),
    referer: cls.get('referer'),

    // 3. Thông tin user/viewer (nếu có)
    viewerId: cls.get('viewerId'),
    viewerName: cls.get('viewerName'),
    viewerEmail: cls.get('viewerEmail'),
  }
}

export function getReqCtxPretty(cls: ClsService) {
  return {
    requestId: cls.get('requestId'),
    requestStartTime: cls.get('requestStartTime'),
    requestDuration: cls.get('requestDuration'),
    trace: Array.isArray(cls.get('trace'))
      ? cls.get('trace')
      : Array.from(cls.get('trace') || []),

    http: {
      method: cls.get('method'),
      protocol: cls.get('protocol'),
      url: cls.get('url'),
      host: cls.get('host'),
      ip: cls.get('ip'),
      remotePort: cls.get('remotePort'),
      userAgent: cls.get('userAgent'),
    },

    viewer: {
      viewerId: cls.get('viewerId'),
      viewerName: cls.get('viewerName'),
      viewerEmail: cls.get('viewerEmail'),
    },
  }
}

// Sample:
// {
//   // 1. Metadata về request
//   "requestId": "363394b2-3003-473c-a263-57a833fd3730",
//   "requestStartTime": 1755576810691,
//   "requestDuration": 513,
//   "trace": ["onRequest", "afterGuard", "onResponse"],

//   // 2. Thông tin HTTP
//   "method": "GET",
//   "protocol": "http",
//   "url": "/api/bizs/test/auto-task/task/test-cls",
//   "host": "127.0.0.1:5020",
//   "ip": "127.0.0.1",
//   "remotePort": 55652,
//   "userAgent": "PostmanRuntime/7.45.0",

//   // 2.1 Headers liên quan đến nguồn gốc request
//   "origin": "http://localhost:3000",
//   "referer": "http://localhost:3000/home",

//   // 3. Thông tin user/viewer
//   "viewerId": "65e0990a727526866391d1d2"
//   "viewerName": "John Doe",
//   "viewerEmail": "john.doe@example.com",
// }
