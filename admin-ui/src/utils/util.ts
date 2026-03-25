import moment from 'moment';

export function timeAgo(date: string | Date | number): string {
  const now = moment();
  const then = moment(date);
  const diffMinutes = now.diff(then, 'minutes');
  const diffHours = now.diff(then, 'hours');

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} h ago`;
  }

  return then.format('YYYY-MM-DD HH:mm');
}

export function formatBytes(
  bytes: number,
  decimals = 2,
  base: 1000 | 1024 = 1024
): string {
  if (!Number.isFinite(bytes)) return '0 B'
  if (bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(base))

  const value = bytes / Math.pow(base, i)

  return `${parseFloat(value.toFixed(decimals))} ${sizes[i]}`
}