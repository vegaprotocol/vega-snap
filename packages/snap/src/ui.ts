import { panel, heading, text, divider, copyable } from '@metamask/snaps-ui';
import { invalidParameters } from './errors';

/**
 * Displays a confirmation dialog with the given transaction, pretty printing
 * the transaction and providing a copyable raw transaction.
 *
 * @param origin - Origin of the transaction.
 * @param transaction - Transaction to display.
 * @param selectedNetworkEntrypoint - The selected network entrypoint as a URL. The origin is displayed to the user.
 * @returns `true` if the user approves the transaction, `false` otherwise.
 */
export async function reviewTransaction(
  origin: string,
  transaction: any,
  selectedNetworkEntrypoint: URL,
) {
  const content = panel([
    heading(transactionTitle(transaction)),
    text(`Request from: **${origin}**`),
    divider(),
    ...prettyPrintTx(transaction, text),
    divider(),
    text(`Selected network entrypoint: ${selectedNetworkEntrypoint.origin}`),
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

/**
 * Displays a debug dialog with the given object.
 *
 * @param obj - Any JSON serializable object to display.
 * @returns `true` if the user approves the transaction, `false` otherwise.
 */
export async function debug(obj: any) {
  const content = panel([
    heading('Debug'),
    divider(),
    ...prettyPrint(obj),
    divider(),
    text('Raw data:'),
    copyable(
      JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
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

/**
 * Indents a string to be send to a text snap-ui component.
 *
 * @param t - A string to be displayed.
 * @returns A text snap-ui component prepended with indentation.
 */
function indentText(t: string) {
  const indent = '&nbsp;&nbsp;&nbsp;&nbsp;';
  return text(`${indent}${t}`);
}

/**
 * Optimise the length of a Vega ID to be displayed.
 *
 * @param id - An ID to be minimised.
 * @returns A minimised Vega ID.
 */
function minimiseId(id: string) {
  if (id.length > 12) {
    return `${id.slice(0, 6)}…${id.slice(-6)}`;
  }
  return id;
}

/**
 * Formats a unix timestamps to human readable output.
 *
 * @param t - A unix timestamps as an integer.
 * @returns A unix timestamps formatted into a human readable date.
 */
function formatTimestamp(t: number) {
  return new Date(t * 1000).toLocaleString();
}

/**
 * Gets a human readable version of an account type.
 *
 * @param type - The account type.
 * @returns A human readable version of the account type.
 */
function getAccountType(type: string) {
  switch (type) {
    case 'ACCOUNT_TYPE_GLOBAL_REWARD':
      return 'Global Reward';
    case 'ACCOUNT_TYPE_GENERAL':
      return 'General';
    default:
      throw invalidParameters('Invalid account type');
  }
}

/**
 * Pretty prints a transaction depending of its type.
 *
 * @param tx - The transaction to be pretty printed.
 * @param textFn - The text function to be use for rendering.
 * @returns List of snap-ui elements.
 */
function prettyPrintTx(tx: any, textFn: any) {
  const keys = Object.keys(tx);

  if (keys.length !== 1) {
    throw invalidParameters('Invalid transaction');
  }

  const txContent = tx[keys[0]];

  switch (keys[0]) {
    case 'batchMarketInstructions':
      return prettyPrintBatchMarketInstructions(txContent);
    case 'orderSubmission':
      return prettyPrintOrderSubmission(txContent, textFn);
    case 'orderCancellation':
      return prettyPrintCancelOrder(txContent, textFn);
    case 'orderAmendment':
      return prettyPrintOrderAmendment(txContent, textFn);
    case 'withdrawSubmission':
      return prettyPrintWithdrawSubmission(txContent, textFn);
    case 'transfer':
      return prettyPrintTransferFunds(txContent, textFn);
    default:
      return prettyPrint(txContent);
  }
}

/**
 * Pretty prints a transfer funds transaction.
 *
 * @param tx - The transfer funds transaction.
 * @param textFn - The text function to be used for rendering.
 * @returns List of snap-ui elements.
 */
function prettyPrintTransferFunds(tx: any, textFn: any) {
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
 * @returns List of snap-ui elements.
 */
function prettyPrintWithdrawSubmission(tx: any, textFn: any) {
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
 * Pretty print and Order Submission.
 *
 * @param tx - The order submission transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
function prettyPrintOrderSubmission(tx: any, textFn: any) {
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
 * @returns List of snap-ui elements.
 */
function prettyPrintOrderAmendment(tx: any, textFn: any) {
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
 * Check if a vega proto enum is the unspecified field.
 *
 * @param v - The field to check.
 * @returns True if this v is an unspecified field.
 */
function isUnspecified(v: string) {
  return v.endsWith('_UNSPECIFIED');
}

/**
 * Gets a human readable string representing a pegged order reference.
 *
 * @param ref - A pegged order reference.
 * @returns The human readable string.
 */
function getPeggedReference(ref: string) {
  switch (ref) {
    case 'PEGGED_REFERENCE_UNSPECIFIED':
      return 'Unspecified';
    case 'PEGGED_REFERENCE_MID':
      return 'Mid';
    case 'PEGGED_REFERENCE_BEST_BID':
      return 'Bid';
    case 'PEGGED_REFERENCE_BEST_ASK':
      return 'Ask';
    default:
      throw invalidParameters('Unknown Pegged Reference');
  }
}

/**
 * Gets a human readable string representing a time in force.
 *
 * @param tif - The time in force.
 * @returns The human readable string.
 */
function getTimeInForce(tif: string) {
  switch (tif) {
    case 'TIME_IN_FORCE_UNSPECIFIED':
      return 'Unspecified';
    case 'TIME_IN_FORCE_GTC':
      return 'GTC';
    case 'TIME_IN_FORCE_GTT':
      return 'GTT';
    case 'TIME_IN_FORCE_IOC':
      return 'IOC';
    case 'TIME_IN_FORCE_FOK':
      return 'FOK';
    case 'TIME_IN_FORCE_GFA':
      return 'GFA';
    case 'TIME_IN_FORCE_GFN':
      return 'GFN';
    default:
      throw invalidParameters('Unknown Time in Force');
  }
}

/**
 * Gets a human readable string representing a side.
 *
 * @param side - The side.
 * @returns The human readable string.
 */
function getSide(side: string) {
  switch (side) {
    case 'SIDE_UNSPECIFIED':
      return 'Unspecified';
    case 'SIDE_BUY':
      return 'Buy';
    case 'SIDE_SELL':
      return 'Sell';
    default:
      throw invalidParameters('Unknown Side');
  }
}

/**
 * Pretty print a batch market instructions transaction.
 *
 * @param tx - The transaction.
 * @returns List of snap-ui elements.
 */
function prettyPrintBatchMarketInstructions(tx: any) {
  const elms = [];
  let addDivider = false;

  if (tx.cancellations && tx.cancellations.length > 0) {
    elms.push(text(`**Order Cancellations:**`));
    for (const [i, c] of tx.cancellations.entries()) {
      elms.push(text(`__${i + 1}:__`));
      elms.push(...prettyPrintTx({ orderCancellation: c }, indentText));
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
      elms.push(...prettyPrintTx({ orderAmendment: c }, indentText));
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
      elms.push(...prettyPrintTx({ orderSubmission: c }, indentText));
    }
  }

  return elms;
}

/**
 * Pretty print a cancel order transaction.
 *
 * @param tx - The cancel order transaction.
 * @param textFn - The text function used for rendering.
 * @returns List of snap-ui elements.
 */
function prettyPrintCancelOrder(tx: any, textFn: any) {
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
 * Recurively pretty prints an object as snap-ui elements.
 *
 * @param obj - Object to pretty print. Primitives will be coerced to strings, while objects will be recursed into.
 * @returns List of snap-ui elements.
 */
function prettyPrint(obj: any) {
  const elms = [];

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'object') {
      elms.push(text(`**${key}**: `));
      elms.push(...prettyPrint(val));
    } else {
      elms.push(text(`**${key}**: ${val}`));
    }
  }

  return elms;
}

/**
 * Formats a human readable transaction title based on the transaction command.
 *
 * @param tx - Object with a single command property. Uusally the incoming `transaction` property from `client.send_transaction`.
 * @returns A human readable transaction title.
 */
export function transactionTitle(tx: any): string {
  const keys = Object.keys(tx);

  if (keys.length !== 1) {
    throw invalidParameters('Invalid transaction');
  }

  switch (keys[0]) {
    case 'orderSubmission':
      return 'Order submission';
    case 'orderCancellation':
      return 'Order cancellation';
    case 'orderAmendment':
      return 'Order amendment';
    case 'withdrawSubmission':
      return 'Withdraw submission';
    case 'proposalSubmission':
      return 'Proposal submission';
    case 'voteSubmission':
      return 'Vote submission';
    case 'liquidityProvisionSubmission':
      return 'Liquidity provision';
    case 'delegateSubmission':
      return 'Delegate submission';
    case 'undelegateSubmission':
      return 'Undelegate submission';
    case 'liquidityProvisionCancellation':
      return 'Liquidity provision cancellation';
    case 'liquidityProvisionAmendment':
      return 'Liquidity provision amendment';
    case 'transfer':
      return 'Transfer';
    case 'cancelTransfer':
      return 'Cancel transfer';
    case 'announceNode':
      return 'Announce node';
    case 'batchMarketInstructions':
      return 'Batch market instructions';
    case 'stopOrdersSubmission':
      return 'Stop orders submission';
    case 'stopOrdersCancellation':
      return 'Stop orders cancellation';
    case 'nodeVote':
      return 'Node vote';
    case 'nodeSignature':
      return 'Node signature';
    case 'chainEvent':
      return 'Chain event';
    case 'keyRotateSubmission':
      return 'Key rotation submission';
    case 'stateVariableProposal':
      return 'State variable proposal';
    case 'validatorHeartbeat':
      return 'Validator heartbeat';
    case 'ethereumKeyRotateSubmission':
      return 'Ethereum key rotation submission';
    case 'protocolUpgradeProposal':
      return 'Protocol upgrade proposal';
    case 'issueSignatures':
      return 'Issue signatures';
    case 'oracleDataSubmission':
      return 'Oracle data submission';
    default:
      throw invalidParameters('Unknown transaction type');
  }
}
