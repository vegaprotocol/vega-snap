import type { text } from '@metamask/snaps-sdk';
import { invalidParameters } from '../errors';
import type { EnrichmentData, VegaTransaction } from '../types';
import {
  prettyPrintBatchMarketInstructions,
  prettyPrintOrderSubmission,
  prettyPrintCancelOrder,
  prettyPrintOrderAmendment,
  prettyPrintStopOrdersSubmission,
  prettyPrintStopOrdersCancellation,
  prettyPrintTransferFunds,
  prettyPrintUpdateMarginMode,
  prettyPrintCreateReferralSet,
  prettyPrintUpdateReferralSet,
  prettyPrintApplyReferralCode,
  prettyPrintJoinTeam,
  prettyPrintUpdatePartyProfile,
  prettyPrint,
  prettyPrintWithdrawSubmission,
} from './commands';
import type { getFormatNumber } from './utils';

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
