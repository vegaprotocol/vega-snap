import { copyable, divider, heading, panel, text } from '@metamask/snaps-sdk';
import { invalidParameters } from './errors';
import {
  prettyPrintBatchMarketInstructions,
  prettyPrintOrderSubmission,
  prettyPrintCancelOrder,
  prettyPrintOrderAmendment,
  prettyPrintStopOrdersSubmission,
  prettyPrintStopOrdersCancellation,
  prettyPrintWithdrawSubmission,
  prettyPrintTransferFunds,
  prettyPrintCreateReferralSet,
  prettyPrintUpdateReferralSet,
  prettyPrintApplyReferralCode,
  prettyPrintJoinTeam,
  prettyPrintUpdatePartyProfile,
  prettyPrint,
} from './transaction-ui/commands';
import { transactionTitle } from './transaction-ui/transaction-title';
import type { getFormatNumber } from './transaction-ui/utils';
import {
  getMarginMode,
  getMarketById,
  minimiseId,
} from './transaction-ui/utils';
import type { VegaTransaction, EnrichmentData } from './types';

/**
 * Displays a confirmation dialog with the given transaction, pretty printing
 * the transaction and providing a copyable raw transaction.
 *
 * @param origin - Origin of the transaction.
 * @param transaction - Transaction to display.
 * @param selectedNetworkEntrypoint - The selected network entrypoint as a URL. The origin is displayed to the user.
 * @param pair - The selected public key.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns `true` if the user approves the transaction, `false` otherwise.
 */
export async function reviewTransaction(
  origin: string,
  transaction: VegaTransaction,
  selectedNetworkEntrypoint: URL,
  pair: any,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const publicKey = pair.keyPair.publicKey.toString();
  const content = panel([
    heading(transactionTitle(transaction)),
    text(`Request from: **${origin}**`),
    text(`Selected key: Snap Key ${pair.index} (${minimiseId(publicKey)})`),
    text(`Selected network entrypoint: ${selectedNetworkEntrypoint.origin}`),
    divider(),
    ...prettyPrintTx(transaction, text, enrichmentData, formatNumber),
    divider(),
    text('Raw transaction:'),
    copyable(
      JSON.stringify(transaction, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    ),
  ]);

  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content,
    },
  });
}

type PrettyPrintTxFn = (
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) => any[];

const TRANSACTION_MAP: Record<string, PrettyPrintTxFn> = {
  batchMarketInstructions: prettyPrintBatchMarketInstructions,
  orderSubmission: prettyPrintOrderSubmission,
  orderCancellation: prettyPrintCancelOrder,
  orderAmendment: prettyPrintOrderAmendment,
  stopOrdersSubmission: prettyPrintStopOrdersSubmission,
  stopOrdersCancellation: prettyPrintStopOrdersCancellation,
  withdrawSubmission: prettyPrintWithdrawSubmission,
  transfer: prettyPrintTransferFunds,
  updateMarginMode: prettyPrintUpdateMarginMode,
  createReferralSet: prettyPrintCreateReferralSet,
  updateReferralSet: prettyPrintUpdateReferralSet,
  applyReferralCode: prettyPrintApplyReferralCode,
  joinTeam: prettyPrintJoinTeam,
  updatePartyProfile: prettyPrintUpdatePartyProfile,
};

/**
 * Pretty prints a transaction depending of its type.
 *
 * @param tx - The transaction to be pretty printed.
 * @param textFn - The text function to be use for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintTx(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const keys = Object.keys(tx);

  if (keys.length !== 1) {
    throw invalidParameters('Invalid transaction');
  }

  const txContent = tx[keys[0]];
  const renderTx = TRANSACTION_MAP[keys[0]];
  if (renderTx) {
    return renderTx(txContent, textFn, enrichmentData, formatNumber);
  }
  return prettyPrint(txContent);
}

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
