import type { text } from '@metamask/snaps-sdk';
import type { EnrichmentData, VegaTransaction } from '../../types';
import type { getFormatNumber } from '../utils';
import { getMarginMode, getMarketById, minimiseId } from '../utils';

/**
 * Pretty print a batch market instructions transaction.
 *
 * @param tx - The transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintUpdateMarginMode(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const mode = getMarginMode(tx.mode);
  let marketId = minimiseId(tx.marketId);
  if (marketId === '') {
    marketId = 'Invalid market';
  }
  const market = getMarketById(enrichmentData, tx.asset);
  const code = market?.tradableInstrument?.instrument?.code;
  const elms = code
    ? [textFn(`Update market **${code}** margin mode to **${mode}**`)]
    : [textFn(`Update market **${marketId}** margin mode to **${mode}**`)];

  if (mode === 'Isolated margin') {
    const leverage = 1 / Number(tx.marginFactor);
    elms.push(textFn(`**Margin factor**: ${formatNumber(tx.marginFactor)}`));
    elms.push(textFn(`**Leverage**: ${formatNumber(leverage)}`));
  }

  return elms;
}
