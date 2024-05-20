import type { text } from '@metamask/snaps-sdk';
import type { EnrichmentData, VegaTransaction } from '../../types';
import { formatMarketCode, minimiseId } from '../utils';

/**
 * Pretty print a cancel order transaction.
 *
 * @param tx - The cancel order transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintCancelOrder(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
) {
  const hasOrderId =
    tx.orderId !== undefined && tx.orderId !== null && tx.orderId !== '';
  const hasMarketId =
    tx.marketId !== undefined && tx.marketId !== null && tx.marketId !== '';

  if (hasOrderId && hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel order`),
      textFn(`**Order ID**: ${minimiseId(tx.orderId)}`),
      textFn(`**Market**: ${market}`),
    ];
  } else if (hasOrderId) {
    return [textFn(`Cancel order ${minimiseId(tx.orderId)}`)];
  } else if (hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel all orders on market`),
      textFn(`**Market ID**: ${market}`),
    ];
  }
  return [textFn(`Cancel all orders from all markets`)];
}
