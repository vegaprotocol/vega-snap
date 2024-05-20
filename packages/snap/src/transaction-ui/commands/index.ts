import type { text } from '@metamask/snaps-sdk';
import { indentText, minimiseId } from '../utils';
import type { VegaTransaction } from '../../types';
import { prettyPrintTransferFunds } from './transfer';
import { prettyPrint } from './pretty-print';
import { prettyPrintUpdateMarginMode } from './margin-mode';
import { prettyPrintWithdrawSubmission } from './withdrawal-submission';
import { prettyPrintStopOrdersSubmission } from './stop-orders-submission';
import { prettyPrintStopOrdersCancellation } from './stop-orders-cancellation';
import { prettyPrintCancelOrder } from './order-cancellation';
import { prettyPrintBatchMarketInstructions } from './batch-market-instructions';
import { prettyPrintOrderAmendment } from './order-ammendment';
import { prettyPrintOrderSubmission } from './order-submission';

export {
  prettyPrintTransferFunds,
  prettyPrintUpdateMarginMode,
  prettyPrintWithdrawSubmission,
  prettyPrint,
  prettyPrintStopOrdersSubmission,
  prettyPrintStopOrdersCancellation,
  prettyPrintCancelOrder,
  prettyPrintBatchMarketInstructions,
  prettyPrintOrderAmendment,
  prettyPrintOrderSubmission,
};

/**
 * Pretty prints an update party profile transaction.
 *
 * @param tx - The update margin mode transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
export function prettyPrintUpdatePartyProfile(
  tx: VegaTransaction,
  textFn: typeof text,
) {
  const elms = [];
  if (tx.alias !== null) {
    elms.push(textFn(`**Alias**: ${tx.alias}`));
  }

  if (Array.isArray(tx.metadata) && tx.metadata.length > 0) {
    elms.push(textFn(`**Meta data**:`));
    for (const e of tx.metadata) {
      if (e !== null && e !== undefined) {
        elms.push(indentText(`**${e.key}**: ${e.value}`));
      }
    }
  }

  return elms;
}

/**
 * Pretty prints a create referral set transaction.
 *
 * @param tx - The create referral set transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
export function prettyPrintCreateReferralSet(
  tx: VegaTransaction,
  textFn: typeof text,
) {
  if (tx.isTeam === false) {
    return [textFn(`Create a new referral set`)];
  }

  const elms = [textFn(`Create a new referral set and team`)];

  if (tx.team !== null) {
    elms.push(textFn(`**Name**: ${tx.team.name}`));

    if (tx.team.teamUrl !== null) {
      elms.push(textFn(`**Team URL**: ${tx.team.teamUrl}`));
    }

    if (tx.team.avatarUrl !== null) {
      elms.push(textFn(`**Avatar URL**: ${tx.team.avatarUrl}`));
    }

    elms.push(textFn(`**Closed**: ${tx.team.closed}`));

    if (Array.isArray(tx.team.allowList) && tx.team.allowList.length > 0) {
      elms.push(textFn(`**Allow list**:`));
      for (const e of tx.team.allowList) {
        if (e !== null && e !== undefined) {
          const id = minimiseId(e);
          elms.push(indentText(id));
        }
      }
    }
  }

  return elms;
}

/**
 * Pretty prints an update referral set transaction.
 *
 * @param tx - The update referral set transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
export function prettyPrintUpdateReferralSet(
  tx: VegaTransaction,
  textFn: typeof text,
) {
  const id = minimiseId(tx.id);

  if (tx.isTeam === false) {
    return [textFn(`Update referral set ${id}`)];
  }

  const elms = [textFn(`Update referral set and team ${id}`)];

  if (tx.team !== null) {
    if (tx.team.name !== null) {
      elms.push(textFn(`**Name**: ${tx.team.name}`));
    }

    if (tx.team.teamUrl !== null) {
      elms.push(textFn(`**Team URL**: ${tx.team.teamUrl}`));
    }

    if (tx.team.avatarUrl !== null) {
      elms.push(textFn(`**Avatar URL**: ${tx.team.avatarUrl}`));
    }

    if (tx.team.closed !== null) {
      elms.push(textFn(`**Closed**: ${tx.team.closed}`));
    }

    if (Array.isArray(tx.team.allowList) && tx.team.allowList.length > 0) {
      elms.push(textFn(`**Allow list**:`));
      for (const e of tx.team.allowList) {
        if (e !== null && e !== undefined) {
          const allowedId = minimiseId(e);
          elms.push(indentText(allowedId));
        }
      }
    }
  }

  return elms;
}

/**
 * Pretty prints an apply referral code transaction.
 *
 * @param tx - The apply referral code transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
export function prettyPrintApplyReferralCode(
  tx: VegaTransaction,
  textFn: typeof text,
) {
  const elms = [textFn(`Submit referral code: ${minimiseId(tx.id)}`)];

  return elms;
}

/**
 * Pretty prints a join team transaction.
 *
 * @param tx - The join team transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
export function prettyPrintJoinTeam(tx: VegaTransaction, textFn: typeof text) {
  const elms = [textFn(`Join team: ${minimiseId(tx.id)}`)];

  return elms;
}
