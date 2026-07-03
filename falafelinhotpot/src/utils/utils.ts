export const trim = (str = '', ch?: string) => {
  let start = 0;
  let end = str.length || 0;

  while (start < end && (ch ? str[start] === ch : /\s/.test(str[start]))) start++;
  while (end > start && (ch ? str[end - 1] === ch : /\s/.test(str[end - 1]))) end--;
  return start > 0 || end < str.length ? str.substring(start, end) : str;
};

export const getFormattedDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
