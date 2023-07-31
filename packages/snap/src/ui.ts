import { panel, heading, text, divider, copyable } from '@metamask/snaps-ui';

/**
 * Displays a confirmation dialog with the given transaction, pretty printing
 * the transaction and providing a copyable raw transaction.
 *
 * @param origin - Origin of the transaction.
 * @param transaction - Transaction to display.
 * @returns `true` if the user approves the transaction, `false` otherwise.
 */
export async function reviewTransaction(origin: string, transaction: any) {
  const content = panel([
    heading(transactionTitle(transaction)),
    text(`Request from: **${origin}**`),
    divider(),
    ...prettyPrintTx(transaction, text),
    divider(),
    text('Raw transaction:'),
    copyable(JSON.stringify(transaction, null, 2)),
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
    copyable(JSON.stringify(obj, null, 2)),
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
 *
 * @param t
 */
function indentText(t: string) {
  const indent = '&nbsp;&nbsp;&nbsp;&nbsp;';
  return text(`${indent}${t}`);
}

/**
 *
 * @param id
 */
function minimiseId(id: string) {
  if (id.length >= 12) {
    return `${id.slice(0, 6)}…${id.slice(id.length - 6, id.length)}`;
  }
  return id;
}

/**
 *
 * @param tx
 * @param textFn
 */
function prettyPrintTx(tx: any, textFn: any) {
  const keys = Object.keys(tx);
  const txContent = tx[Object.keys(tx)[0]];

  if (keys.length !== 1) {
    throw new Error('Invalid transaction');
  }

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
      prettyPrintWithdrawSubmission(txContent, textFn);
    case 'transfer':
      return prettyPrint(txContent);
    default:
      return prettyPrint(txContent);
  }
}

/**
 *
 * @param tx
 * @param textFn
 */
function prettyPrintWithdrawSubmission(tx: any, textFn: any) {
  const elms = [];
  return elms;
}

/**
 *
 * @param tx
 * @param textFn
 */
function prettyPrintOrderSubmission(tx: any, textFn: any) {
  const elms = [];
  const isLimit =
    tx.price !== undefined && tx.price !== null && tx.price !== '';
  const side = tx.side === 'TYPE_BUY' ? 'buy' : 'sell';

  if (tx.peggedOrder) {
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
  elms.push(textFn(`**market id**: ${marketId}`));

  if (tx.expiresAt && tx.expiresAt > 0) {
    elms.push(textFn(`**expires at**: ${marketId}`));
  }

  if (tx.postOnly) {
    elms.push(textFn(`**post only**: yes`));
  }

  if (tx.reduceOnly) {
    elms.push(textFn(`**reduce only**: yes`));
  }

  if (tx.icebergOpts) {
    elms.push(textFn(`**iceberg peak size**: ${tx.icebergOpts.peakSize}`));
    elms.push(
      textFn(
        `**iceberg minimum visible size**: ${tx.icebergOpts.minimumVisibleSize}`,
      ),
    );
  }

  return elms;
}

/**
 *
 * @param tx
 * @param textFn
 */
function prettyPrintOrderAmendment(tx: any, textFn: any) {
  const elms = [
    textFn(`**order id**: ${minimiseId(tx.orderId)}`),
    textFn(`**market id**: ${minimiseId(tx.marketId)}`),
  ];

  if (tx.price !== undefined && tx.price !== null && tx.price !== '') {
    elms.push(textFn(`**price**: ${tx.price}`));
  }

  if (
    tx.sizeDelta !== undefined &&
    tx.sizeDelta !== null &&
    tx.sizeDelta !== 0
  ) {
    if (tx.sizeDelta > 0) {
      elms.push(textFn(`**size delta**: +${tx.sizeDelta}`));
    } else {
      elms.push(textFn(`**size delta**: ${tx.sizeDelta}`));
    }
  }

  if (
    tx.expiresAt !== undefined &&
    tx.expiresAt !== null &&
    tx.expiresAt !== 0
  ) {
    elms.push(textFn(`**expires at**: ${tx.expiresAt}`));
  }

  if (
    tx.timeInForce !== undefined &&
    tx.timeInForce !== null &&
    tx.timeInForce !== ''
  ) {
    elms.push(textFn(`**time in force**: ${getTimeInForce(tx.timeInForce)}`));
  }

  if (
    tx.peggedReference !== undefined &&
    tx.peggedReference !== null &&
    tx.peggededReference !== ''
  ) {
    elms.push(
      textFn(`**pegged reference**: ${getPeggedReference(tx.peggedReference)}`),
    );
  }

  if (
    tx.peggedOffset !== undefined &&
    tx.peggedOffset !== null &&
    tx.peggededOffset !== ''
  ) {
    elms.push(textFn(`**pegged offset**: ${tx.peggedOffset}`));
  }

  return elms;
}

/**
 *
 * @param ref
 */
function getPeggedReference(ref: string) {
  switch (ref) {
    case 'PEGGED_REFERENCE_MID':
      return 'Mid';
    case 'PEGGED_REFERENCE_BEST_BID':
      return 'Bid';
    case 'PEGGED_REFERENCE_BEST_ASK':
      return 'Ask';
  }
}

/**
 *
 * @param tif
 */
function getTimeInForce(tif: string) {
  switch (tif) {
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
  }
}

/**
 *
 * @param tx
 */
function prettyPrintBatchMarketInstructions(tx: any) {
  const elms = [];
  let addDivider = false;

  if (tx.cancellations && tx.cancellations.length > 0) {
    elms.push(text(`**Order Cancellations:**`));
    let i = 0;
    for (const c of tx.cancellations.values()) {
      elms.push(text(`__${i}:__`));
      elms.push(...prettyPrintTx({ orderCancellation: c }, indentText));
      i += 1;
    }
    addDivider = true;
  }

  if (tx.amendments && tx.amendments.length > 0) {
    if (addDivider) {
      elms.push(divider());
    }
    elms.push(text(`**Order Amendments:**`));
    let i = 0;
    for (const c of tx.amendments.values()) {
      elms.push(text(`__${i}:__`));
      elms.push(...prettyPrintTx({ orderAmendment: c }, indentText));
      i += 1;
    }
    addDivider = true;
  }

  if (tx.submissions && tx.submissions.length > 0) {
    if (addDivider) {
      elms.push(divider());
    }
    elms.push(text(`**Order Submissions:**`));
    let i = 0;
    for (const c of tx.submissions.values()) {
      elms.push(text(`__${i}:__`));
      elms.push(...prettyPrintTx({ orderSubmission: c }, indentText));
      i += 1;
    }
  }

  return elms;
}

/**
 *
 * @param tx
 * @param textFn
 */
function prettyPrintCancelOrder(tx: any, textFn: any) {
  const hasOrderId =
    tx.orderId !== undefined && tx.orderId !== null && tx.orderId !== '';
  const hasMarketId =
    tx.marketId !== undefined && tx.marketId !== null && tx.marketId !== '';

  if (hasOrderId && hasMarketId) {
    return [
      textFn(`Cancel order`),
      textFn(`**order id**: ${minimiseId(tx.orderId)}`),
      textFn(`**market id**: ${minimiseId(tx.marketId)}`),
    ];
  } else if (hasOrderId) {
    return [textFn(`Cancel order ${minimiseId(tx.orderId)}`)];
  } else if (hasMarketId) {
    return [
      textFn(`Cancel all orders on market`),
      textFn(`**market id**: ${minimiseId(tx.marketId)}`),
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
function transactionTitle(tx: any): string {
  const keys = Object.keys(tx);

  if (keys.length !== 1) {
    throw new Error('Invalid transaction');
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
      throw new Error('Unknown transaction type');
  }
}
