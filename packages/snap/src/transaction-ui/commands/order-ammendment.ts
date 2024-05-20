import type { text } from '@metamask/snaps-sdk';
import type { EnrichmentData, VegaTransaction } from '../../types';
import type { getFormatNumber } from '../utils';
import {
  minimiseId,
  formatTimestamp,
  isUnspecified,
  getTimeInForce,
  getPeggedReference,
  formatMarketCode,
  formatMarketPrice,
  formatSize,
} from '../utils';

/**
 * Pretty print an order amendment.
 *
 * @param tx - The order amendment transaction.
 * @param textFn - The test function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintOrderAmendment(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const market = formatMarketCode(tx.marketId, enrichmentData);

  const elms = [
    textFn(`**Order ID**: ${minimiseId(tx.orderId)}`),
    textFn(`**Market**: ${market}`),
  ];

  if (tx.price !== undefined && tx.price !== null && tx.price !== '') {
    const price = formatMarketPrice(
      tx.price,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(textFn(`**Price**: ${price}`));
  }

  if (
    tx.sizeDelta !== undefined &&
    tx.sizeDelta !== null &&
    tx.sizeDelta !== BigInt(0)
  ) {
    const size = formatSize(
      tx.sizeDelta,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    if (tx.sizeDelta > 0) {
      elms.push(textFn(`**Size Delta**: +${size}`));
    } else {
      elms.push(textFn(`**Size Delta**: ${size}`));
    }
  }

  if (tx.size !== undefined && tx.size !== null && tx.size !== BigInt(0)) {
    const size = formatSize(
      tx.sizeDelta,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    if (tx.size > 0) {
      elms.push(textFn(`**Size**: +${size}`));
    } else {
      elms.push(textFn(`**Size**: ${size}`));
    }
  }

  if (
    tx.expiresAt !== undefined &&
    tx.expiresAt !== null &&
    tx.expiresAt !== BigInt(0)
  ) {
    elms.push(
      textFn(`**Expires At**: ${formatTimestamp(Number(tx.expiresAt))}`),
    );
  }

  if (
    tx.timeInForce !== undefined &&
    tx.timeInForce !== null &&
    !isUnspecified(tx.timeInForce) &&
    tx.timeInForce !== ''
  ) {
    elms.push(textFn(`**Time In Force**: ${getTimeInForce(tx.timeInForce)}`));
  }

  if (
    tx.peggedReference !== undefined &&
    tx.peggedReference !== null &&
    !isUnspecified(tx.peggedReference) &&
    tx.peggedReference !== ''
  ) {
    elms.push(
      textFn(`**Pegged Reference**: ${getPeggedReference(tx.peggedReference)}`),
    );
  }

  if (
    tx.peggedOffset !== undefined &&
    tx.peggedOffset !== null &&
    tx.peggedOffset !== ''
  ) {
    const offset = formatMarketPrice(
      tx.peggedOffset,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(textFn(`**Pegged Offset**: ${offset}`));
  }

  return elms;
}
