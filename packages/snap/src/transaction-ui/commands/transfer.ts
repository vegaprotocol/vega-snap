import { text, copyable } from '@metamask/snaps-sdk';
import { VegaTransaction, EnrichmentData } from '../../types';
import {
  getFormatNumber,
  getAssetById,
  addDecimal,
  getAccountType,
  formatTimestamp,
} from '../utils';
import { prettyPrint } from './pretty-print';

/**
 * Pretty prints a transfer funds transaction.
 *
 * @param tx - The transfer funds transaction.
 * @param textFn - The text function to be used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintTransferFunds(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const asset = getAssetById(enrichmentData, tx.asset);
  // handle only oneOff transfer, all others should be
  // the default prettyPrint
  if (!tx.oneOff && !tx.kind?.oneOff) {
    return prettyPrint(tx);
  }

  const symbol = asset?.details?.symbol;
  const decimals = asset?.details?.decimals;
  const amount =
    symbol && decimals
      ? `**Amount**: ${formatNumber(
          addDecimal(tx.amount, decimals),
        )}&nbsp;${symbol}`
      : `**Amount**: ${tx.amount}`;

  const elms = [
    textFn(amount),
    textFn(`**Asset ID**:`),
    copyable(`${tx.asset}`),
    textFn(`**To**:`),
    copyable(`${tx.to}`),
  ];

  // we do not want to display if it's general account too.
  if (
    tx.toAccountType !== undefined &&
    tx.toAccountType !== null &&
    tx.toAccountType !== 'ACCOUNT_TYPE_GENERAL' &&
    tx.toAccountType !== ''
  ) {
    elms.push(
      textFn(`**To Account Type**: ${getAccountType(tx.toAccountType)}`),
    );
  }

  if (
    tx.reference !== undefined &&
    tx.reference !== null &&
    tx.reference !== ''
  ) {
    elms.push(textFn(`**Reference**: ${tx.reference}`));
  }

  if (
    tx.kind?.oneOff?.deliverOn !== null &&
    tx.kind?.oneOff?.deliverOn !== undefined &&
    tx.kind?.oneOff?.deliverOn !== BigInt(0)
  ) {
    elms.push(
      textFn(
        `**Deliver On**: ${formatTimestamp(Number(tx.kind.oneOff.deliverOn))}`,
      ),
    );
  } else if (
    tx.oneOff?.deliverOn !== null &&
    tx.oneOff?.deliverOn !== undefined &&
    tx.oneOff?.deliverOn !== BigInt(0)
  ) {
    elms.push(
      textFn(`**Deliver On**: ${formatTimestamp(Number(tx.oneOff.deliverOn))}`),
    );
  }

  return elms;
}
