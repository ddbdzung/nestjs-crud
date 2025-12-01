import crypto from 'crypto'

import { CURRENT_ENV, ENV_CODE } from '../constants/common.constant'

const envCode = ENV_CODE[CURRENT_ENV]

const MACHINE_ID = Number(process.env.MACHINE_ID ?? 1)
const WORKER_ID = Number(process.env.WORKER_ID ?? process.env.pm_id ?? 0)

let lastTs = -1
let seq = 0

function pad(n: number, size: number) {
  return n.toString().padStart(size, '0')
}

function hashEndpoint(endpoint: string): string {
  const h = crypto.createHash('md5').update(endpoint).digest().readUInt16BE(0) // 2 bytes → 0–65535
  return h.toString(36).toUpperCase().padStart(3, '0')
}

export function generateRequestId(endpoint: string): string {
  const now = new Date()
  const ts =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1, 2) +
    pad(now.getDate(), 2) +
    '-' +
    pad(now.getHours(), 2) +
    pad(now.getMinutes(), 2) +
    pad(now.getSeconds(), 2) +
    pad(now.getMilliseconds(), 3)

  const currentMs = now.getTime()

  if (currentMs === lastTs) {
    seq = (seq + 1) & 0x1f // 5-bit sequence = 0–31
  } else {
    seq = 0
  }
  lastTs = currentMs

  const endpointHash = hashEndpoint(endpoint)

  // Format: ENV_CODE-timestamp-M{machine}-W{worker}-E{endpoint}-S{seq}
  return `${envCode}-${ts}-M${pad(MACHINE_ID, 2)}-W${pad(
    WORKER_ID,
    2
  )}-E${endpointHash}-S${pad(seq, 2)}`
}

// Ví dụ sử dụng:
// PROD: 1-20241206-121530500-M01-W00-E3KL-S00
// DEV:  3-20241206-121530500-M01-W00-E3KL-S00
