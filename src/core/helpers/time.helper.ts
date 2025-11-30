import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// Register the plugins once at application bootstrap
// utc plugin is required by timezone plugin
// https://day.js.org/docs/en/plugin/timezone

dayjs.extend(utc)
dayjs.extend(timezone)

// Set default timezone for the application (Ho Chi Minh, Vietnam)
// Change this value if you need another default timezone later.
dayjs.tz.setDefault('Asia/Ho_Chi_Minh')

export { dayjs }

// Helper methods removed to avoid name collisions with moment util.
