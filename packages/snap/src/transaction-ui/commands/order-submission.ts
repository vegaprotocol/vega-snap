import type { text } from '@metamask/snaps-sdk';
import type { EnrichmentData, VegaTransaction } from '../../types';
import type { getFormatNumber } from '../utils';
import {
  getSide,
  getTimeInForce,
  getPeggedReference,
  formatTimestamp,
  formatMarketPrice,
  formatSize,
  formatMarketCode,
} from '../utils';

/**
 * Pretty print and Order Submission.
 *
 * @param tx - The order submission transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintOrderSubmission(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const elms = [];
  const isLimit = tx.type === 'TYPE_LIMIT';
  const side = getSide(tx.side);

  if (tx.peggedOrder && Object.keys(tx.peggedOrder).length !== 0) {
    const offset = formatMarketPrice(
      tx.peggedOrder.offset,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(
      textFn(
        `Pegged Limit ${side} - ${getTimeInForce(tx.timeInForce)} ${
          tx.size
        } @ ${getPeggedReference(tx.peggedOrder.reference)}+${offset}`,
      ),
    );
  } else if (isLimit) {
    const price = formatMarketPrice(
      tx.price,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(
      textFn(
        `Limit ${side} - ${getTimeInForce(tx.timeInForce)} ${
          tx.size
        } @ ${price}`,
      ),
    );
  } else {
    const size = formatSize(tx.size, tx.marketId, enrichmentData, formatNumber);

    elms.push(
      textFn(`Market ${side} - ${getTimeInForce(tx.timeInForce)} ${size}`),
    );
  }
  const market = formatMarketCode(tx.marketId, enrichmentData);
  elms.push(textFn(`**Market**: ${market}`));

  if (tx.expiresAt && tx.expiresAt > BigInt(0)) {
    elms.push(
      textFn(`**Expires At**: ${formatTimestamp(Number(tx.expiresAt))}`),
    );
  }

  if (tx.postOnly) {
    elms.push(textFn(`**Post Only**: yes`));
  }

  if (tx.reduceOnly) {
    elms.push(textFn(`**Reduce Only**: yes`));
  }

  if (tx.icebergOpts && Object.keys(tx.icebergOpts).length !== 0) {
    const peakSize = formatSize(
      tx.icebergOpts.peakSize,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    const minimumVisibleSize = formatSize(
      tx.icebergOpts.minimumVisibleSize,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(textFn(`**Iceberg Peak Size**: ${peakSize}`));
    elms.push(
      textFn(`**Iceberg Minimum Visible Size**: ${minimumVisibleSize}`),
    );
  }

  return elms;
}
