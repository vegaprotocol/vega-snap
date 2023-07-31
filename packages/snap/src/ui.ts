import { panel, heading, text, divider, copyable } from '@metamask/snaps-ui';

/**
 *
 * @param origin
 * @param transaction
 */
export async function reviewTransaction(origin: string, transaction: any) {
  const content = panel([
    heading(transactionTitle(transaction)),
    text(`Request from: **${origin}**`),
    divider(),
    ...prettyPrint(transaction),
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
 *
 * @param obj
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
 * @param obj
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
 *
 * @param tx
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
