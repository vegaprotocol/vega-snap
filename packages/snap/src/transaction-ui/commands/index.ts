import { text, divider, copyable } from '@metamask/snaps-sdk';
import {
  formatTimestamp,
  getExpiryStrategy,
  getMarginMode,
  getPeggedReference,
  getSide,
  getTimeInForce,
  indentText,
  isUnspecified,
  minimiseId,
} from '../utils';
import { prettyPrintTx } from '../pretty-print-tx';
/**
 * Pretty prints an update margin mode transaction.
 *
 * @param tx - The update margin mode transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
export function prettyPrintUpdateMarginMode(tx: any, textFn: any) {
  const mode = getMarginMode(tx.mode);
  let marketId = minimiseId(tx.marketId);
  if (marketId === '') {
    marketId = 'Invalid market';
  }
  const elms = [
    textFn(`Update market **${marketId}** margin mode to **${mode}**`),
  ];

  if (mode === 'Isolated margin') {
    elms.push(textFn(`**Margin factor**: ${tx.marginFactor}`));
    elms.push(textFn(`**Margin factor**: ${tx.marginFactor}`));
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
export function prettyPrintUpdatePartyProfile(tx: any, textFn: any) {
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
export function prettyPrintCreateReferralSet(tx: any, textFn: any) {
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
export function prettyPrintUpdateReferralSet(tx: any, textFn: any) {
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
export function prettyPrintApplyReferralCode(tx: any, textFn: any) {
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
export function prettyPrintJoinTeam(tx: any, textFn: any) {
  const elms = [textFn(`Join team: ${minimiseId(tx.id)}`)];

  return elms;
}

/**
 * Pretty prints a transfer funds transaction.
 *
 * @param tx - The transfer funds transaction.
 * @param textFn - The text function to be used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintTransferFunds(
  tx: any,
  textFn: any,
  enrichmentData: any,
) {
  // handle only oneOff transfer, all others should be
  // the default prettyPrint
  if (!tx.oneOff && !tx.kind?.oneOff) {
    return prettyPrint(tx);
  }

  const elms = [
    textFn(`**Amount**: ${tx.amount}`),
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
 * @param tx - The withdrawal submission transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintWithdrawSubmission(
  tx: any,
  textFn: any,
  enrichmentData: any,
) {
  const elms = [
    textFn(`**Amount**: ${tx.amount}`),
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
 * @param so - The stop order details.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
export function prettyPrintStopOrderDetails(so: any, textFn: any) {
  const elms = [];
  if (so.trigger?.price !== null && so.trigger?.price !== undefined) {
    elms.push(textFn(`Trigger price: ${so.trigger.price}`));
  }

  if (so.price !== null && so.price !== undefined) {
    elms.push(textFn(`Trigger price: ${so.price}`));
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
 * @returns List of snap-ui elements.
 */
export function prettyPrintStopOrdersSubmission(
  tx: any,
  textFn: any,
  enrichmentData: any,
) {
  const elms = [];
  if (tx.risesAbove !== null && tx.risesAbove !== undefined) {
    elms.push(textFn('**Rises Above**'));

    elms.push(...prettyPrintStopOrderDetails(tx.risesAbove, textFn));

    elms.push(
      textFn('**Order details**'),
      ...prettyPrintTx(
        { orderSubmission: tx.risesAbove.orderSubmission },
        indentText,
        enrichmentData,
      ),
    );
  }

  if (tx.fallsBelow !== null && tx.fallsBelow !== undefined) {
    if (tx.risesAbove !== null && tx.risesAbove !== undefined) {
      elms.push(divider());
    }

    elms.push(textFn('**Falls Below**'));

    elms.push(...prettyPrintStopOrderDetails(tx.fallsBelow, textFn));

    elms.push(
      textFn('**Order details**'),
      ...prettyPrintTx(
        { orderSubmission: tx.fallsBelow.orderSubmission },
        indentText,
        enrichmentData,
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
 * @returns List of snap-ui elements.
 */
export function prettyPrintOrderSubmission(
  tx: any,
  textFn: any,
  enrichmentData: any,
) {
  const elms = [];
  const isLimit = tx.type === 'TYPE_LIMIT';
  const side = getSide(tx.side);

  if (tx.peggedOrder && Object.keys(tx.peggedOrder).length !== 0) {
    elms.push(
      textFn(
        `Pegged Limit ${side} - ${getTimeInForce(tx.timeInForce)} ${
          tx.size
        } @ ${getPeggedReference(tx.peggedOrder.reference)}+${
          tx.peggedOrder.offset
        }`,
      ),
    );
  } else if (isLimit) {
    elms.push(
      textFn(
        `Limit ${side} - ${getTimeInForce(tx.timeInForce)} ${tx.size} @ ${
          tx.price
        }`,
      ),
    );
  } else {
    elms.push(
      textFn(`Market ${side} - ${getTimeInForce(tx.timeInForce)} ${tx.size}`),
    );
  }

  const marketId = minimiseId(tx.marketId);
  elms.push(textFn(`**Market ID**: ${marketId}`));

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
    elms.push(textFn(`**Iceberg Peak Size**: ${tx.icebergOpts.peakSize}`));
    elms.push(
      textFn(
        `**Iceberg Minimum Visible Size**: ${tx.icebergOpts.minimumVisibleSize}`,
      ),
    );
  }

  return elms;
}

/**
 * Pretty print an order amendment.
 *
 * @param tx - The order amendment transaction.
 * @param textFn - The test function used for rendering.
 * @param enrichedData
 * @returns List of snap-ui elements.
 */
export function prettyPrintOrderAmendment(
  tx: any,
  textFn: any,
  enrichedData: any,
) {
  const elms = [
    textFn(`**Order ID**: ${minimiseId(tx.orderId)}`),
    textFn(`**Market ID**: ${minimiseId(tx.marketId)}`),
  ];

  if (tx.price !== undefined && tx.price !== null && tx.price !== '') {
    elms.push(textFn(`**Price**: ${tx.price}`));
  }

  if (
    tx.sizeDelta !== undefined &&
    tx.sizeDelta !== null &&
    tx.sizeDelta !== BigInt(0)
  ) {
    if (tx.sizeDelta > 0) {
      elms.push(textFn(`**Size Delta**: +${tx.sizeDelta}`));
    } else {
      elms.push(textFn(`**Size Delta**: ${tx.sizeDelta}`));
    }
  }

  if (tx.size !== undefined && tx.size !== null && tx.size !== BigInt(0)) {
    if (tx.size > 0) {
      elms.push(textFn(`**Size**: +${tx.size}`));
    } else {
      elms.push(textFn(`**Size**: ${tx.size}`));
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
    elms.push(textFn(`**Pegged Offset**: ${tx.peggedOffset}`));
  }

  return elms;
}

/**
 * Pretty print a batch market instructions transaction.
 *
 * @param tx - The transaction.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @returns List of snap-ui elements.
 */
export function prettyPrintBatchMarketInstructions(
  tx: any,
  enrichmentData: any,
) {
  const elms = [];
  let addDivider = false;

  if (tx.cancellations && tx.cancellations.length > 0) {
    elms.push(text(`**Order Cancellations:**`));
    for (const [i, c] of tx.cancellations.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(
        ...prettyPrintTx({ orderCancellation: c }, indentText, enrichmentData),
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
        ...prettyPrintTx({ orderAmendment: c }, indentText, enrichmentData),
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
        ...prettyPrintTx({ orderSubmission: c }, indentText, enrichmentData),
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
        ...prettyPrintTx({ updateMarginMode: c }, indentText, enrichmentData),
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
  tx: any,
  textFn: any,
  enrichmentData: any,
) {
  const hasOrderId =
    tx.orderId !== undefined && tx.orderId !== null && tx.orderId !== '';
  const hasMarketId =
    tx.marketId !== undefined && tx.marketId !== null && tx.marketId !== '';

  if (hasOrderId && hasMarketId) {
    return [
      textFn(`Cancel order`),
      textFn(`**Order ID**: ${minimiseId(tx.orderId)}`),
      textFn(`**Market ID**: ${minimiseId(tx.marketId)}`),
    ];
  } else if (hasOrderId) {
    return [textFn(`Cancel order ${minimiseId(tx.orderId)}`)];
  } else if (hasMarketId) {
    return [
      textFn(`Cancel all orders on market`),
      textFn(`**Market ID**: ${minimiseId(tx.marketId)}`),
    ];
  }
  return [textFn(`Cancel all orders from all markets`)];
}

/**
 * Pretty print a cancel stop order transaction.
 *
 * @param tx - The cancel stop order transaction.
 * @param textFn - The text function used for rendering.
 * @param enrichedData
 * @returns List of snap-ui elements.
 */
export function prettyPrintStopOrdersCancellation(
  tx: any,
  textFn: any,
  enrichedData: any,
) {
  const hasOrderId =
    tx.orderId !== undefined &&
    tx.stopOrderId !== null &&
    tx.stopOrderId !== '';
  const hasMarketId =
    tx.marketId !== undefined && tx.marketId !== null && tx.marketId !== '';

  if (hasOrderId && hasMarketId) {
    return [
      textFn(`Cancel stop order`),
      textFn(`**Stop Order ID**: ${minimiseId(tx.stopOrderId)}`),
      textFn(`**Market ID**: ${minimiseId(tx.marketId)}`),
    ];
  } else if (hasOrderId) {
    return [textFn(`Cancel stop order ${minimiseId(tx.stopOrderId)}`)];
  } else if (hasMarketId) {
    return [
      textFn(`Cancel all stop orders on market`),
      textFn(`**Market ID**: ${minimiseId(tx.marketId)}`),
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
