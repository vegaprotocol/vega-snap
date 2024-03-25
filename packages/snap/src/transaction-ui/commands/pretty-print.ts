import { text } from '@metamask/snaps-sdk';

/**
 * Recurively pretty prints an object as snap-ui elements.
 *
 * @param obj - Object to pretty print. Primitives will be coerced to strings, while objects will be recursed into.
 * @returns List of snap-ui elements.
 */
export function prettyPrint(obj: any) {
  const elms = [];

  if (obj === null || obj === undefined) {
    return [text(`**Empty transaction provided**`)];
  }

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      elms.push(text(`**${key}**: empty value`));
    } else if (typeof val === 'object') {
      elms.push(text(`**${key}**: `));
      elms.push(...prettyPrint(val));
    } else {
      elms.push(text(`**${key}**: ${val}`));
    }
  }

  return elms;
}
