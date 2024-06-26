import { copyable, divider, heading, panel, text } from '@metamask/snaps-sdk';
import { invalidParameters } from './errors';
import { transactionTitle } from './transaction-title';
import type { getFormatNumber } from './utils';
import {
  formatAssetAmount,
  formatMarketCode,
  formatMarketPrice,
  formatSize,
  formatTimestamp,
  getAccountType,
  getExpiryStrategy,
  getMarginMode,
  getPeggedReference,
  getSide,
  getTimeInForce,
  indentText,
  isUnspecified,
  minimiseId,
} from './utils';
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
  const market = formatMarketCode(tx.marketId, enrichmentData);
  const elms = market
    ? [textFn(`Update market **${market}** margin mode to **${mode}**`)]
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
  // handle only oneOff transfer, all others should be
  // the default prettyPrint
  if (!tx.oneOff && !tx.kind?.oneOff) {
    return prettyPrint(tx);
  }

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

/**
 * Pretty print and Order Submission.
 *
 * @param tx - The order submission transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintOrderSubmission(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const elms = [];
  const isLimit = tx.type === 'TYPE_LIMIT';
  const side = getSide(tx.side);

  if (tx.peggedOrder && Object.keys(tx.peggedOrder).length !== 0) {
    const formattedSize = formatSize(
      tx.size,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    const offset = formatMarketPrice(
      tx.peggedOrder.offset,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(
      textFn(
        `Pegged Limit ${side} - ${getTimeInForce(
          tx.timeInForce,
        )} ${formattedSize} @ ${getPeggedReference(
          tx.peggedOrder.reference,
        )}+${offset}`,
      ),
    );
  } else if (isLimit) {
    const formattedSize = formatSize(
      tx.size,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    const price = formatMarketPrice(
      tx.price,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(
      textFn(
        `Limit ${side} - ${getTimeInForce(
          tx.timeInForce,
        )} ${formattedSize} @ ${price}`,
      ),
    );
  } else {
    const size = formatSize(tx.size, tx.marketId, enrichmentData, formatNumber);

    elms.push(
      textFn(`Market ${side} - ${getTimeInForce(tx.timeInForce)} ${size}`),
    );
  }
  const market = formatMarketCode(tx.marketId, enrichmentData);
  elms.push(textFn(`**Market**: ${market}`));

  if (tx.expiresAt && tx.expiresAt > BigInt(0)) {
    elms.push(
      textFn(`**Expires At**: ${formatTimestamp(Number(tx.expiresAt))}`),
    );
  }

  if (tx.postOnly) {
    elms.push(textFn(`**Post Only**: yes`));
  }

  if (tx.reduceOnly) {
    elms.push(textFn(`**Reduce Only**: yes`));
  }

  if (tx.icebergOpts && Object.keys(tx.icebergOpts).length !== 0) {
    const peakSize = formatSize(
      tx.icebergOpts.peakSize,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    const minimumVisibleSize = formatSize(
      tx.icebergOpts.minimumVisibleSize,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(textFn(`**Iceberg Peak Size**: ${peakSize}`));
    elms.push(
      textFn(`**Iceberg Minimum Visible Size**: ${minimumVisibleSize}`),
    );
  }

  return elms;
}

/**
 * Pretty print an order amendment.
 *
 * @param tx - The order amendment transaction.
 * @param textFn - The test function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns List of snap-ui elements.
 */
export function prettyPrintOrderAmendment(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const market = formatMarketCode(tx.marketId, enrichmentData);

  const elms = [
    textFn(`**Order ID**: ${minimiseId(tx.orderId)}`),
    textFn(`**Market**: ${market}`),
  ];

  if (tx.price !== undefined && tx.price !== null && tx.price !== '') {
    const price = formatMarketPrice(
      tx.price,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(textFn(`**Price**: ${price}`));
  }

  if (
    tx.sizeDelta !== undefined &&
    tx.sizeDelta !== null &&
    tx.sizeDelta !== BigInt(0)
  ) {
    const size = formatSize(
      tx.sizeDelta,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    if (tx.sizeDelta > 0) {
      elms.push(textFn(`**Size Delta**: +${size}`));
    } else {
      elms.push(textFn(`**Size Delta**: ${size}`));
    }
  }

  if (tx.size !== undefined && tx.size !== null && tx.size !== BigInt(0)) {
    const size = formatSize(
      tx.sizeDelta,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    if (tx.size > 0) {
      elms.push(textFn(`**Size**: +${size}`));
    } else {
      elms.push(textFn(`**Size**: ${size}`));
    }
  }

  if (
    tx.expiresAt !== undefined &&
    tx.expiresAt !== null &&
    tx.expiresAt !== BigInt(0)
  ) {
    elms.push(
      textFn(`**Expires At**: ${formatTimestamp(Number(tx.expiresAt))}`),
    );
  }

  if (
    tx.timeInForce !== undefined &&
    tx.timeInForce !== null &&
    !isUnspecified(tx.timeInForce) &&
    tx.timeInForce !== ''
  ) {
    elms.push(textFn(`**Time In Force**: ${getTimeInForce(tx.timeInForce)}`));
  }

  if (
    tx.peggedReference !== undefined &&
    tx.peggedReference !== null &&
    !isUnspecified(tx.peggedReference) &&
    tx.peggedReference !== ''
  ) {
    elms.push(
      textFn(`**Pegged Reference**: ${getPeggedReference(tx.peggedReference)}`),
    );
  }

  if (
    tx.peggedOffset !== undefined &&
    tx.peggedOffset !== null &&
    tx.peggedOffset !== ''
  ) {
    const offset = formatMarketPrice(
      tx.peggedOffset,
      tx.marketId,
      enrichmentData,
      formatNumber,
    );
    elms.push(textFn(`**Pegged Offset**: ${offset}`));
  }

  return elms;
}

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

/**
 * Pretty print a cancel order transaction.
 *
 * @param tx - The cancel order transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintCancelOrder(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
) {
  const hasOrderId =
    tx.orderId !== undefined && tx.orderId !== null && tx.orderId !== '';
  const hasMarketId =
    tx.marketId !== undefined && tx.marketId !== null && tx.marketId !== '';

  if (hasOrderId && hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel order`),
      textFn(`**Order ID**: ${minimiseId(tx.orderId)}`),
      textFn(`**Market**: ${market}`),
    ];
  } else if (hasOrderId) {
    return [textFn(`Cancel order ${minimiseId(tx.orderId)}`)];
  } else if (hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel all orders on market`),
      textFn(`**Market ID**: ${market}`),
    ];
  }
  return [textFn(`Cancel all orders from all markets`)];
}

/**
 * Pretty print a cancel stop order transaction.
 *
 * @param tx - The cancel stop order transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintStopOrdersCancellation(
  tx: VegaTransaction,
  textFn: typeof text,
  enrichmentData: EnrichmentData,
) {
  const hasOrderId =
    tx.orderId !== undefined &&
    tx.stopOrderId !== null &&
    tx.stopOrderId !== '';
  const hasMarketId =
    tx.marketId !== undefined && tx.marketId !== null && tx.marketId !== '';

  if (hasOrderId && hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel stop order`),
      textFn(`**Stop Order ID**: ${minimiseId(tx.stopOrderId)}`),
      textFn(`**Market**: ${market}`),
    ];
  } else if (hasOrderId) {
    return [textFn(`Cancel stop order ${minimiseId(tx.stopOrderId)}`)];
  } else if (hasMarketId) {
    const market = formatMarketCode(tx.marketId, enrichmentData);
    return [
      textFn(`Cancel all stop orders on market`),
      textFn(`**Market**: ${market}`),
    ];
  }
  return [textFn(`Cancel all stop orders from all markets`)];
}

/**
 * Recurively pretty prints an object as snap-ui elements.
 *
 * @param obj - Object to pretty print. Primitives will be coerced to strings, while objects will be recursed into.
 * @returns List of snap-ui elements.
 */
export function prettyPrint(obj: any) {
  const elms = [];

  if (obj === null || obj === undefined) {
    return [text(`**Empty transaction provided**`)];
  }

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      elms.push(text(`**${key}**: empty value`));
    } else if (typeof val === 'object') {
      elms.push(text(`**${key}**: `));
      elms.push(...prettyPrint(val));
    } else {
      elms.push(text(`**${key}**: ${val}`));
    }
  }

  return elms;
}
