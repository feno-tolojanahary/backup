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