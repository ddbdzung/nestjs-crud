# Request ID Generator

## Structure

```
{ENV}-{TIMESTAMP}-M{MACHINE_ID}-W{WORKER_ID}-E{ENDPOINT_HASH}-S{SEQUENCE}
```

**Example:** `1-20241206-121530500-M01-W00-E3KL-S00`

## Components

| Part | Description | Format | Example |
|------|-------------|--------|---------|
| **ENV** | Environment code | 1 char | `1`=PROD, `2`=STG, `3`=DEV, `4`=TEST, `5`=LOCAL, `6`=UAT, `7`=QA |
| **TIMESTAMP** | Date and time | YYYYMMDD-HHMMSSmmm | `20241206-121530500` |
| **MACHINE_ID** | Server ID | 2 digits (01-99) | `M01` |
| **WORKER_ID** | Process ID | 2 digits (00-99) | `W00` |
| **ENDPOINT_HASH** | Endpoint hash (MD5, base36) | 3 chars | `E3KL` |
| **SEQUENCE** | Request counter per ms | 2 digits (00-31) | `S00` |

## Usage

```typescript
import { generateRequestId } from './request-id'

// Basic
const id = generateRequestId('/api/users')
// → 3-20241206-121530500-M01-W00-E3KL-S00

// Express middleware
app.use((req, res, next) => {
  req.id = generateRequestId(req.path)
  res.setHeader('X-Request-ID', req.id)
  next()
})
```

## Configuration

```bash
NODE_ENV=production    # Environment (default: DEV)
MACHINE_ID=1          # Machine ID (default: 1)
WORKER_ID=0           # Worker ID (default: 0, auto from PM2)
```

## Limitations

- Max 99 machines × 99 workers
- Max 32 requests per millisecond per worker
