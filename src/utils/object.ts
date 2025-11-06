/**
 * Checks if the provided value is a object or not.
 * @param {unknown} value - The value to check.
 * @returns {boolean} `true` if the value is a valid JS object, otherwise `false`.
 */
export function isObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
