import { text } from '@metamask/snaps-sdk';
import { invalidParameters } from '../errors';

/**
 * Formats a number based on the locale of the user.
 *
 * @param locale - The locale of the user.
 * @returns A function that takes a number and returns a string formatted based on the locale.
 */
export function getFormatNumber(locale: string) {
  return (n: number) => n.toLocaleString(locale);
}

/**
 * Adds decimals to string numbers.
 *
 * @param number - The number to add decimal places to.
 * @param decimals - The number of decimal places to add.
 * @returns The number with the decimal places added.
 */
export function addDecimal(number: string, decimals: number) {
  if (decimals === 0) {
    return Number(number);
  }
  const numberWithDecimals = `${number.slice(0, -decimals)}.${number.slice(
    -decimals,
  )}`;
  return Number(numberWithDecimals);
}

/**
 * Given the enrichment data we are using to enrich the transaction data, this function
 * finds the asset with the given id.
 *
 * @param enrichmentData - The data used to enrich the transaction data.
 * @param id - The id of the asset to be found.
 * @returns The asset with the given id, or undefined if it does not exist.
 */
export function getAssetById(enrichmentData: any, id: string) {
  const node = enrichmentData?.assets?.edges?.find(
    (edge: any) => edge?.node?.id === id,
  );
  return node?.node;
}

/**
 * Given the enrichment data we are using to enrich the transaction data, this function
 * finds the market with the given id.
 *
 * @param enrichmentData - The data used to enrich the transaction data.
 * @param id - The id of the market to be found.
 * @returns The market with the given id, or undefined if it does not exist.
 */
export function getMarketById(enrichmentData: any, id: string) {
  const node = enrichmentData?.markets?.edges?.find(
    (edge: any) => edge?.node?.id === id,
  );
  return node?.node;
}

/**
 * Indents a string to be send to a text snap-ui component.
 *
 * @param t - A string to be displayed.
 * @returns A text snap-ui component prepended with indentation.
 */
export function indentText(t: string) {
  const indent = '&nbsp;&nbsp;&nbsp;&nbsp;';
  return text(`${indent}${t}`);
}

/**
 * Optimise the length of a Vega ID to be displayed.
 *
 * @param id - An ID to be minimised.
 * @returns A minimised Vega ID.
 */
export function minimiseId(id: string) {
  if (id.length > 12) {
    return `${id.slice(0, 6)}…${id.slice(-6)}`;
  }
  return id;
}

/**
 * Formats a unix timestamps to human readable output.
 *
 * @param t - A unix timestamps as an integer.
 * @returns A unix timestamps formatted into a human readable date.
 */
export function formatTimestamp(t: number) {
  return new Date(t * 1000).toLocaleString();
}

/**
 * Gets a human readable version of an account type.
 *
 * @param type - The account type.
 * @returns A human readable version of the account type.
 */
export function getAccountType(type: string) {
  switch (type) {
    case 'ACCOUNT_TYPE_GLOBAL_REWARD':
      return 'Global Reward';
    case 'ACCOUNT_TYPE_GENERAL':
      return 'General';
    default:
      throw invalidParameters('Invalid account type');
  }
}

/**
 * Check if a vega proto enum is the unspecified field.
 *
 * @param v - The field to check.
 * @returns True if this v is an unspecified field.
 */
export function isUnspecified(v: string) {
  return v.endsWith('_UNSPECIFIED');
}

/**
 * Gets a human readable string representing a pegged order reference.
 *
 * @param ref - A pegged order reference.
 * @returns The human readable string.
 */
export function getPeggedReference(ref: string) {
  switch (ref) {
    case 'PEGGED_REFERENCE_UNSPECIFIED':
      return 'Unspecified';
    case 'PEGGED_REFERENCE_MID':
      return 'Mid';
    case 'PEGGED_REFERENCE_BEST_BID':
      return 'Bid';
    case 'PEGGED_REFERENCE_BEST_ASK':
      return 'Ask';
    default:
      throw invalidParameters('Unknown Pegged Reference');
  }
}

/**
 * Gets a human readable string representing a time in force.
 *
 * @param tif - The time in force.
 * @returns The human readable string.
 */
export function getTimeInForce(tif: string) {
  switch (tif) {
    case 'TIME_IN_FORCE_UNSPECIFIED':
      return 'Unspecified';
    case 'TIME_IN_FORCE_GTC':
      return 'GTC';
    case 'TIME_IN_FORCE_GTT':
      return 'GTT';
    case 'TIME_IN_FORCE_IOC':
      return 'IOC';
    case 'TIME_IN_FORCE_FOK':
      return 'FOK';
    case 'TIME_IN_FORCE_GFA':
      return 'GFA';
    case 'TIME_IN_FORCE_GFN':
      return 'GFN';
    default:
      throw invalidParameters('Unknown Time in Force');
  }
}

/**
 * Gets a human readable string representing of an expiry strategy.
 *
 * @param st - The expiry strategy.
 * @returns The human readable string.
 */
export function getExpiryStrategy(st: string) {
  switch (st) {
    case 'EXPIRY_UNSPECIFIED':
      return 'Unspecified';
    case 'EXPIRY_STRATEGY_CANCELS':
      return 'Cancels';
    case 'EXPIRY_STRATEGY_SUBMIT':
      return 'Submit';
    default:
      throw invalidParameters('Unknown Expiry Strategy');
  }
}

/**
 * Gets a human readable string representing a side.
 *
 * @param side - The side.
 * @returns The human readable string.
 */
export function getSide(side: string) {
  switch (side) {
    case 'SIDE_UNSPECIFIED':
      return 'Unspecified';
    case 'SIDE_BUY':
      return 'Buy';
    case 'SIDE_SELL':
      return 'Sell';
    default:
      throw invalidParameters('Unknown Side');
  }
}

/**
 * Gets a human readable string representing a margin mode.
 *
 * @param mode - The margin mode.
 * @returns The human readable string.
 */
export function getMarginMode(mode: string) {
  switch (mode) {
    case 'MODE_UNSPECIFIED':
      return 'Unspecified';
    case 'MODE_CROSS_MARGIN':
      return 'Cross margin';
    case 'MODE_ISOLATED_MARGIN':
      return 'Isolated margin';
    default:
      throw invalidParameters('Unknown Margin Mode');
  }
}
