import type { text } from '@metamask/snaps-sdk';
import { copyable } from '@metamask/snaps-sdk';
import type { EnrichmentData, VegaTransaction } from '../../types';
import { formatAssetAmount, type getFormatNumber } from '../utils';

/**
 * Pretty prints a windrawal submission.
 *
 * @param tx - The transaction to be pretty printed.
 * @param textFn - The text function to be use for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintWithdrawSubmission(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const amount = formatAssetAmount(
    tx.amount,
    tx.asset,
    enrichmentData,
    formatNumber,
  );

  const elms = [
    textFn(`**Amount**: ${amount}`),
    textFn(`**Asset ID**:`),
    copyable(`${tx.asset}`),
  ];

  if (tx.ext?.erc20?.receiverAddress) {
    elms.push(textFn(`**To Address**: `));
    elms.push(copyable(`${tx.ext?.erc20?.receiverAddress}`));
  }

  return elms;
}
