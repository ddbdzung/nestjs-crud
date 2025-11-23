# Debug Module Usage

## Tổng quan

Module debug cho phép quản lý debug logging động trong ứng dụng NestJS, không cần restart server.

## Cấu hình

Thiết lập namespace mặc định qua biến môi trường:

```env
DEBUG_NAMESPACE=app:*
```

## API Endpoints

### 1. GET `/debug/status`

Kiểm tra trạng thái debug hiện tại.

**Response:**
```json
{
  "isEnable": true,
  "defaultNameSpace": "app:*"
}
```

### 2. POST `/debug/set`

Bật/tắt debug logging động.

**Request Body:**
```json
{
  "namespace": "app:*"  // hoặc "" để tắt
}
```

**Response:**
```json
{
  "body": { "namespace": "app:*" },
  "isEnable": true,
  "defaultNameSpace": "app:*"
}
```

## Sử dụng trong Code

### Import helper

```typescript
import { getDebugger } from '@core/debug/debug.helper'
```

### Tạo debugger instance

```typescript
const debug = getDebugger('app:database')

// Sử dụng
debug('Query executed: %s', query)
debug('Connection established')
```

### Namespace Patterns

- `app:*` - Tất cả namespace bắt đầu với `app:`
- `app:database` - Chỉ namespace `app:database`
- `*` - Tất cả debug logs
- `app:*,auth:*` - Nhiều namespace (phân cách bằng dấu phẩy)

## Ví dụ

### Kiểm tra trạng thái

```bash
curl http://localhost:3000/debug/status
```

### Bật debug cho tất cả

```bash
curl -X POST http://localhost:3000/debug/set \
  -H "Content-Type: application/json" \
  -d '{"namespace": "*"}'
```

### Bật debug cho namespace cụ thể

```bash
curl -X POST http://localhost:3000/debug/set \
  -H "Content-Type: application/json" \
  -d '{"namespace": "app:database"}'
```

### Tắt debug

```bash
curl -X POST http://localhost:3000/debug/set \
  -H "Content-Type: application/json" \
  -d '{"namespace": ""}'
```

## Lưu ý

- Thay đổi có hiệu lực ngay lập tức, không cần restart
- Debug logs chỉ hiển thị khi namespace được enable
- Có thể sử dụng wildcard `*` để bật nhiều namespace cùng lúc
- Hữu ích cho debugging trên production/staging environment
