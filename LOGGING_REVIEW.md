# Review: Logging Module Usage

## ✅ Đã sửa

### 1. **HttpLoggerInterceptor** - Missing `cls` property
**Vấn đề:** Dùng `this.cls.getId()` nhưng không lưu `cls` vào property
**Đã sửa:** Thêm `private readonly cls: ClsService` property

### 2. **UnknownExceptionsFilter** - Missing import
**Vấn đề:** Dùng `ClsService` nhưng không import
**Đã sửa:** Thêm `import { ClsService } from 'nestjs-cls'`

---

## ⚠️ Vấn đề cần xem xét

### 1. **Context Format Inconsistency**

**Vấn đề:** 
- `logger.service.ts` append context vào message: `(${this.context})`
- `logger.config.ts` expect context trong metadata: `info.loggerContext`

**Hiện tại:**
```typescript
// logger.service.ts - Line 73, 83, 91
winstonLogger[level](firstArg, ...restArgs, `(${this.context})`)
```

**Winston config expect:**
```typescript
// logger.config.ts - Line 264
if (info.loggerContext) contextInfo.push(`[${info.loggerContext}]`)
```

**Đề xuất:** 
- Option 1: Giữ format hiện tại (append vào message) - đơn giản nhưng mất metadata
- Option 2: Dùng metadata (recommended) - context hiển thị đúng trong format

**Recommendation:** Dùng metadata để context hiển thị đúng trong console format:
```typescript
winstonLogger[level](firstArg, {
  loggerContext: this.context,
  ...(restArgs[0] || {})
})
```

---

### 2. **RedisService - Context Mutation**

**Vấn đề:** Mutate logger context nhiều lần trong constructor
```typescript
// redis.service.ts - Line 23
this.logger.setContext(alias) // Mutate context nhiều lần
```

**Impact:** 
- Context bị thay đổi sau mỗi lần tạo Redis client
- Logs từ cùng một logger instance sẽ có context khác nhau

**Đề xuất:**
- Option 1: Tạo logger riêng cho mỗi Redis client
- Option 2: Dùng logger riêng cho RedisService và không mutate context

---

### 3. **RedisClientExtend - Hardcoded Context**

**Vấn đề:** 
```typescript
// redis.helper.ts - Line 26
this.logger.setContext('Redis') // Hardcoded context
```

**Đề xuất:** 
- Dùng dynamic context dựa trên database number hoặc options
- Hoặc inject logger với context đã set sẵn

---

### 4. **Error Logging Inconsistency**

**Vấn đề:** Một số chỗ log error không consistent

**Examples:**
```typescript
// redis-ratelimit.ts - Line 21
logger.error('Rate limit Redis client error:', error?.message)

// redis.helper.ts - Line 47
this.logger.error(`Redis error: ${error?.message}`, error?.stack)
```

**Đề xuất:** Standardize error logging format:
```typescript
logger.error('Error message', error.stack, { error: error.message, ...metadata })
```

---

## 📊 Usage Patterns Summary

### ✅ Good Patterns

1. **HealthController** - Inject và set context trong constructor
   ```typescript
   constructor(protected readonly logger: AppLogger) {
     this.logger.setContext(HealthController.name)
   }
   ```

2. **HttpLoggerInterceptor** - Dùng `AppLogger.create()` với class name
   ```typescript
   this.logger = AppLogger.create(cls, HttpLoggerInterceptor.name)
   ```

3. **BaseGenericService** - Set context với alias (có thể cần review)

### ⚠️ Patterns cần review

1. **RedisService** - Mutate context nhiều lần
2. **RedisClientExtend** - Hardcoded context
3. **createRedisRateLimit** - Optional logger, có thể không log gì

---

## 🎯 Best Practices Recommendations

### 1. **Context Management**
- ✅ Set context một lần trong constructor
- ❌ Không mutate context sau khi khởi tạo
- ✅ Dùng `AppLogger.create()` khi tạo mới
- ✅ Dùng `setContext()` khi inject qua DI

### 2. **Error Logging**
```typescript
// Standard format
logger.error('Operation failed', error.stack, {
  operation: 'operationName',
  errorCode: error.code,
  ...metadata
})
```

### 3. **HTTP Logging**
```typescript
// Use metadata for structured logging
logger.http('Request completed', {
  method,
  url,
  statusCode,
  duration,
  requestId
})
```

### 4. **Debug/Info Logging**
```typescript
// Simple message
logger.info('User created', userId)

// With metadata
logger.debug('Processing request', { requestId, userId })
```

---

## 🔧 Suggested Improvements

### 1. **Standardize Context Format**
- Dùng metadata thay vì append vào message
- Đảm bảo context hiển thị đúng trong winston format

### 2. **Create Logger Factory for Redis**
```typescript
// redis.service.ts
private createLogger(alias: string): AppLogger {
  return AppLogger.create(this.cls, alias)
}
```

### 3. **Add Logging Helper Methods**
```typescript
// logger.service.ts
logError(operation: string, error: Error, meta?: LogMetadata): void {
  this.error(`${operation} failed`, error.stack, {
    operation,
    errorMessage: error.message,
    ...meta
  })
}
```

### 4. **Document Logging Levels**
- `error`: Lỗi nghiêm trọng cần attention
- `warn`: Cảnh báo, có thể ảnh hưởng
- `info`: Thông tin quan trọng
- `debug`: Debug information
- `verbose`: Chi tiết hơn
- `http`: HTTP requests/responses

---

## 📝 Action Items

- [ ] Fix context format inconsistency (metadata vs message append)
- [ ] Review RedisService context mutation pattern
- [ ] Standardize error logging format
- [ ] Add logging helper methods
- [ ] Document logging best practices in README
