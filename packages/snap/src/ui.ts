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
  indentText,
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
 * Pretty prints an update margin mode transaction.
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
