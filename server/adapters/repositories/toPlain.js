export function toPlain(data) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(toPlain);
  if (typeof data === 'object') {
    if (typeof data.toJSON === 'function') return data.toJSON();
    return JSON.parse(JSON.stringify(data));
  }
  return data;
}
