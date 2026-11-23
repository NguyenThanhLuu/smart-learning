export function normalizeUserName(name) {
  return typeof name === 'string' ? name.trim().toLowerCase() : '';
}
