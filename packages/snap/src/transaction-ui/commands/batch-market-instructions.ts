import { text, divider } from '@metamask/snaps-sdk';
import type { VegaTransaction, EnrichmentData } from '../../types';
import { prettyPrintTx } from '../pretty-print-tx';
import type { getFormatNumber } from '../utils';
import { indentText } from '../utils';

/**
 * Pretty print a batch market instructions transaction.
 *
 * @param tx - The transaction.
 * @param _ - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintBatchMarketInstructions(
  tx: VegaTransaction,
  _: typeof text, // Not used as we wish to indent the text of the sub transaction within the batch market instructions.
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const elms = [];
  let addDivider = false;

  if (tx.cancellations && tx.cancellations.length > 0) {
    elms.push(text(`**Order Cancellations:**`));
    for (const [i, c] of tx.cancellations.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(
        ...prettyPrintTx(
          { orderCancellation: c },
          indentText,
          enrichmentData,
          formatNumber,
        ),
      );
    }
    addDivider = true;
  }

  if (tx.amendments && tx.amendments.length > 0) {
    if (addDivider) {
      elms.push(divider());
    }
    elms.push(text(`**Order Amendments:**`));
    for (const [i, c] of tx.amendments.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(
        ...prettyPrintTx(
          { orderAmendment: c },
          indentText,
          enrichmentData,
          formatNumber,
        ),
      );
    }
    addDivider = true;
  }

  if (tx.submissions && tx.submissions.length > 0) {
    if (addDivider) {
      elms.push(divider());
    }
    elms.push(text(`**Order Submissions:**`));
    for (const [i, c] of tx.submissions.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(
        ...prettyPrintTx(
          { orderSubmission: c },
          indentText,
          enrichmentData,
          formatNumber,
        ),
      );
    }
  }

  if (tx.stopOrdersCancellation && tx.stopOrdersCancellation.length > 0) {
    if (addDivider) {
      elms.push(divider());
    }
    elms.push(text(`**Stop Orders Cancellations:**`));
    for (const [i, c] of tx.stopOrdersCancellation.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(
        ...prettyPrintTx(
          { stopOrdersCancellation: c },
          indentText,
          enrichmentData,
          formatNumber,
        ),
      );
    }
  }

  if (tx.stopOrdersSubmission && tx.stopOrdersSubmission.length > 0) {
    if (addDivider) {
      elms.push(divider());
    }
    elms.push(text(`**Stop Orders Submissions:**`));
    for (const [i, c] of tx.stopOrdersSubmission.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(
        ...prettyPrintTx(
          { stopOrdersSubmission: c },
          indentText,
          enrichmentData,
          formatNumber,
        ),
      );
    }
  }

  if (tx.updateMarginMode && tx.updateMarginMode.length > 0) {
    if (addDivider) {
      elms.push(divider());
    }
    elms.push(text(`**Margin Mode Updates:**`));
    for (const [i, c] of tx.updateMarginMode.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(
        ...prettyPrintTx(
          { updateMarginMode: c },
          indentText,
          enrichmentData,
          formatNumber,
        ),
      );
    }
  }

  return elms;
}
