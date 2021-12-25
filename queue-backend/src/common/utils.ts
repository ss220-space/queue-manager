export function ckeySanitize(key: string): string {
  return key.toLowerCase().replace(/[-_.\s]+/g, '').trim();
};