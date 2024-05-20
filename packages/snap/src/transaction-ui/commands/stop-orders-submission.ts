import type { text } from '@metamask/snaps-sdk';
import { divider } from '@metamask/snaps-sdk';
import type { VegaTransaction, EnrichmentData } from '../../types';
import { prettyPrintTx } from '../pretty-print-tx';
import type { getFormatNumber } from '../utils';
import {
  indentText,
  formatTimestamp,
  getExpiryStrategy,
  formatMarketPrice,
} from '../utils';

/**
 * Pretty print a Stop Order details.
 *
 * @param so - The stop order transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintStopOrderDetails(
  so: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const elms = [];
  if (so.trigger?.price !== null && so.trigger?.price !== undefined) {
    elms.push(textFn(`Trigger price: ${so.trigger.price}`));
  }

  if (so.price !== null && so.price !== undefined) {
    const price = formatMarketPrice(
      so.price,
      so.orderSubmission?.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(textFn(`Trigger price: ${price}`));
  }

  if (
    so.trigger?.trailingPercentOffset !== null &&
    so.trigger?.trailingPercentOffset !== undefined
  ) {
    const offset = parseFloat(so.trigger.trailingPercentOffset) * 100;
    elms.push(textFn(`Trailing offset: ${offset}%`));
  }

  if (
    so.trailingPercentOffset !== null &&
    so.trailingPercentOffset !== undefined
  ) {
    const offset = parseFloat(so.trigger.trailingPercentOffset) * 100;
    elms.push(textFn(`Trailing offset: ${offset}%`));
  }

  if (so.expiresAt !== null && so.expiresAt !== undefined) {
    elms.push(textFn(`Expires on: ${formatTimestamp(Number(so.expiresAt))}`));
  }

  if (so.expiryStrategy !== null && so.expiryStrategy !== undefined) {
    elms.push(
      textFn(`Expiry strategy: ${getExpiryStrategy(so.expiryStrategy)}`),
    );
  }

  return elms;
}

/**
 * Pretty print a Stop Orders Submission.
 *
 * @param tx - The order submission transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintStopOrdersSubmission(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const elms = [];
  if (tx.risesAbove !== null && tx.risesAbove !== undefined) {
    elms.push(textFn('**Rises Above**'));

    elms.push(
      ...prettyPrintStopOrderDetails(
        tx.risesAbove,
        textFn,
        enrichmentData,
        formatNumber,
      ),
    );

    elms.push(
      textFn('**Order details**'),
      ...prettyPrintTx(
        { orderSubmission: tx.risesAbove.orderSubmission },
        indentText,
        enrichmentData,
        formatNumber,
      ),
    );
  }

  if (tx.fallsBelow !== null && tx.fallsBelow !== undefined) {
    if (tx.risesAbove !== null && tx.risesAbove !== undefined) {
      elms.push(divider());
    }

    elms.push(textFn('**Falls Below**'));

    elms.push(
      ...prettyPrintStopOrderDetails(
        tx.fallsBelow,
        textFn,
        enrichmentData,
        formatNumber,
      ),
    );

    elms.push(
      textFn('**Order details**'),
      ...prettyPrintTx(
        { orderSubmission: tx.fallsBelow.orderSubmission },
        indentText,
        enrichmentData,
        formatNumber,
      ),
    );
  }

  return elms;
}
