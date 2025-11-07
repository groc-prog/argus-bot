/**
 * Checks if the provided value is a object or not.
 * @param {unknown} value - The value to check.
 * @returns {boolean} `true` if the value is a valid JS object, otherwise `false`.
 */
export function isObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deeply merges the properties of the `source` object into the `target` object. Properties from
 * `source` take precedence over same properties in `target`.
 * @template T - The type of the target object.
 * @template P - The type of the source object.
 * @param {T} target - The target object that will be mutated and receive properties from `source`.
 * @param {P} source - The source object whose properties will be merged into `target`.
 * @returns {T & P} A new object that combines the properties of both `target` and `source`.
 */
export function merge<
  T extends Record<string | number | symbol, unknown>,
  P extends Record<string | number | symbol, unknown>,
>(target: T, source: P): T & P {
  const targetObj = (isObject(target) ? target : {}) as T & P;

  for (const key in source) {
    if (isObject(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      merge(
        target[key] as Record<string | number | symbol, unknown>,
        source[key] as Record<string | number | symbol, unknown>,
      );
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }

  return targetObj;
}
