import { invalidParameters } from '../errors';
import {
  prettyPrintBatchMarketInstructions,
  prettyPrintOrderSubmission,
  prettyPrintCancelOrder,
  prettyPrintOrderAmendment,
  prettyPrintStopOrdersSubmission,
  prettyPrintStopOrdersCancellation,
  prettyPrintWithdrawSubmission,
  prettyPrintTransferFunds,
  prettyPrintUpdateMarginMode,
  prettyPrintCreateReferralSet,
  prettyPrintUpdateReferralSet,
  prettyPrintApplyReferralCode,
  prettyPrintJoinTeam,
  prettyPrintUpdatePartyProfile,
  prettyPrint,
} from './commands';

/**
 * Pretty prints a transaction depending of its type.
 *
 * @param tx - The transaction to be pretty printed.
 * @param textFn - The text function to be use for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintTx(tx: any, textFn: any, enrichmentData: any) {
  const keys = Object.keys(tx);

  if (keys.length !== 1) {
    throw invalidParameters('Invalid transaction');
  }

  const txContent = tx[keys[0]];

  switch (keys[0]) {
    case 'batchMarketInstructions':
      return prettyPrintBatchMarketInstructions(txContent, enrichmentData);
    case 'orderSubmission':
      return prettyPrintOrderSubmission(txContent, textFn, enrichmentData);
    case 'orderCancellation':
      return prettyPrintCancelOrder(txContent, textFn, enrichmentData);
    case 'orderAmendment':
      return prettyPrintOrderAmendment(txContent, textFn, enrichmentData);
    case 'stopOrdersSubmission':
      return prettyPrintStopOrdersSubmission(txContent, textFn, enrichmentData);
    case 'stopOrdersCancellation':
      return prettyPrintStopOrdersCancellation(
        txContent,
        textFn,
        enrichmentData,
      );

    case 'withdrawSubmission':
      return prettyPrintWithdrawSubmission(txContent, textFn, enrichmentData);
    case 'transfer':
      return prettyPrintTransferFunds(txContent, textFn, enrichmentData);

    // TODO: do we care about this one?
    case 'updateMarginMode':
      return prettyPrintUpdateMarginMode(txContent, textFn);

    case 'createReferralSet':
      return prettyPrintCreateReferralSet(txContent, textFn);
    case 'updateReferralSet':
      return prettyPrintUpdateReferralSet(txContent, textFn);
    case 'applyReferralCode':
      return prettyPrintApplyReferralCode(txContent, textFn);
    case 'joinTeam':
      return prettyPrintJoinTeam(txContent, textFn);
    case 'updatePartyProfile':
      return prettyPrintUpdatePartyProfile(txContent, textFn);
    default:
      return prettyPrint(txContent);
  }
}
