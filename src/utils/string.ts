/**
 * Formats a given string by removing any leading or trailing whitespace.
 * @param {TemplateStringsArray} strings - The separate lines in the template string.
 * @param {unknown[]} values - The values used in the template string.
 * @returns {string} The formatted string.
 */
export function message(strings: TemplateStringsArray, ...values: unknown[]): string {
  const formatted = strings
    // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
    .reduce((prev, curr, index) => `${prev}${values[index - 1] ?? ''}${curr}`, '')
    .split('\n')
    .map((value) => value.trim())
    .join('\n');

  return formatted;
}
