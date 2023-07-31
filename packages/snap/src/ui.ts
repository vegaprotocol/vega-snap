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
  const transactionContent = transaction[Object.keys(transaction)[0]];

  const content = panel([
    heading(transactionTitle(transaction)),
    text(`Request from: **${origin}**`),
    divider(),
    ...prettyPrint(transactionContent),
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
