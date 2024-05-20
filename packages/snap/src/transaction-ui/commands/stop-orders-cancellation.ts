import type { text } from '@metamask/snaps-sdk';
import type { EnrichmentData, VegaTransaction } from '../../types';
import { formatMarketCode, minimiseId } from '../utils';

/**
 * Pretty print a cancel stop order transaction.
 *
 * @param tx - The cancel stop order transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintStopOrdersCancellation(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
) {
  const hasOrderId =
    tx.orderId !== undefined &&
    tx.stopOrderId !== null &&
    tx.stopOrderId !== '';
  const hasMarketId =
    tx.marketId !== undefined && tx.marketId !== null && tx.marketId !== '';

  if (hasOrderId && hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel stop order`),
      textFn(`**Stop Order ID**: ${minimiseId(tx.stopOrderId)}`),
      textFn(`**Market**: ${market}`),
    ];
  } else if (hasOrderId) {
    return [textFn(`Cancel stop order ${minimiseId(tx.stopOrderId)}`)];
  } else if (hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel all stop orders on market`),
      textFn(`**Market**: ${market}`),
    ];
  }
  return [textFn(`Cancel all stop orders from all markets`)];
}
