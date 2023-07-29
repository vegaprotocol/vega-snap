import { panel, text, heading, divider, copyable } from '@metamask/snaps-ui';
import { KeyPair } from '@vegaprotocol/crypto/cjs/keypair.cjs';
import { toBase64, toHex } from '@vegaprotocol/crypto/cjs/buf.cjs';
import { randomFill } from '@vegaprotocol/crypto/cjs/crypto.cjs';
import { solve } from '@vegaprotocol/crypto/cjs/pow.cjs';
import { InputData, Transaction } from '@vegaprotocol/protos/vega/commands/v1';

enum TransactionKeys {
  UNKNOWN = 'unknown',
  ORDER_SUBMISSION = 'orderSubmission',
  ORDER_CANCELLATION = 'orderCancellation',
  ORDER_AMENDMENT = 'orderAmendment',
  VOTE_SUBMISSION = 'voteSubmission',
  WITHDRAW_SUBMISSION = 'withdrawSubmission',
  LIQUIDTY_PROVISION_SUBMISSION = 'liquidityProvisionSubmission',
  LIQUIDTY_PROVISION_CANCELLATION = 'liquidityProvisionCancellation',
  LIQUIDITY_PROVISION_AMENDMENT = 'liquidityProvisionAmendment',
  PROPOSAL_SUBMISSION = 'proposalSubmission',
  ANNOUNCE_NODE = 'announceNode',
  NODE_VOTE = 'nodeVote',
  NODE_SIGNATURE = 'nodeSignature',
  CHAIN_EVENT = 'chainEvent',
  ORACLE_DATA_SUBMISSION = 'oracleDataSubmission',
  UNDELEGATE_SUBMISSION = 'undelegateSubmission',
  DELEGATE_SUBMISSION = 'delegateSubmission',
  TRANSFER = 'transfer',
  CANCEL_TRANSFER = 'cancelTransfer',
  KEY_ROTATE_SUBMISSION = 'keyRotateSubmission',
  ETHEREUM_KEY_ROTATE_SUBMISSION = 'ethereumKeyRotateSubmission',
}

const TRANSACTION_TITLES: Record<TransactionKeys, string> = {
  [TransactionKeys.UNKNOWN]: 'Unknown transaction',
  [TransactionKeys.ORDER_SUBMISSION]: 'Order submission',
  [TransactionKeys.ORDER_CANCELLATION]: 'Order cancellation',
  [TransactionKeys.ORDER_AMENDMENT]: 'Order amendment',
  [TransactionKeys.VOTE_SUBMISSION]: 'Vote submission',
  [TransactionKeys.WITHDRAW_SUBMISSION]: 'Withdraw submission',
  [TransactionKeys.LIQUIDTY_PROVISION_SUBMISSION]: 'Liquidity provision',
  [TransactionKeys.LIQUIDTY_PROVISION_CANCELLATION]:
    'Liquidity provision cancellation',
  [TransactionKeys.LIQUIDITY_PROVISION_AMENDMENT]:
    'Liquidity provision amendment',
  [TransactionKeys.PROPOSAL_SUBMISSION]: 'Proposal submission',
  [TransactionKeys.ANNOUNCE_NODE]: 'Announce node',
  [TransactionKeys.NODE_VOTE]: 'Node vote',
  [TransactionKeys.NODE_SIGNATURE]: 'Node signature',
  [TransactionKeys.CHAIN_EVENT]: 'Chain event',
  [TransactionKeys.ORACLE_DATA_SUBMISSION]: 'Oracle data submission',
  [TransactionKeys.UNDELEGATE_SUBMISSION]: 'Undelegate submission',
  [TransactionKeys.DELEGATE_SUBMISSION]: 'Delegate submission',
  [TransactionKeys.TRANSFER]: 'Transfer',
  [TransactionKeys.CANCEL_TRANSFER]: 'Cancel transfer',
  [TransactionKeys.KEY_ROTATE_SUBMISSION]: 'Key rotation submission',
  [TransactionKeys.ETHEREUM_KEY_ROTATE_SUBMISSION]:
    'Ethereum key rotation submission',
};

const prettyPrintRec = async (things, obj, tab) => {
  for (const propt in obj) {
    if (typeof obj[propt] === 'object') {
      things.push(text(`${tab}**${propt}**:`));
      prettyPrintRec(things, obj[propt], `${tab}`);
    } else {
      things.push(text(`${tab}**${propt}**: ${obj[propt]}`));
    }
  }
};

const prettyPrint = async (things, obj, tab) => {
  for (const propt in obj) {
    prettyPrintRec(things, obj[propt], tab);
  }
};

export const review = async (origin, transaction) => {
  const header =
    TRANSACTION_TITLES[Object.keys(transaction)[0] as TransactionKeys];

  const things = [];
  things.push(heading(`${header}`));
  things.push(text(`Request from: **${origin}**`));
  things.push(divider());
  await prettyPrint(things, transaction, '');
  things.push(divider());
  things.push(text(`Raw transaction:`));
  things.push(copyable(`${JSON.stringify(transaction, null, 2)}`));

  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel(things),
    },
  });
};

export const send = async (node, transaction, sendingMode) => {
  const latestBlock = await node.blockchainHeight();
  const tid = toHex(await randomFill(new Uint8Array(32)));
  const { chainId } = latestBlock;

  const pow = await solve(latestBlock.spamPowDifficulty, latestBlock.hash, tid);

  const entropy = await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: ['m', "1789'", "0'", "0'"],
      curve: 'ed25519',
    },
  });

  const keyPair = await KeyPair.fromSeed(
    entropy.index,
    Buffer.from(entropy.privateKey.slice(2), 'hex'),
  );

  const nonce = new DataView(
    await randomFill(new Uint8Array(8)).buffer,
  ).getBigUint64(0, false);

  const inputData = InputData.encode({
    blockHeight: BigInt(latestBlock.height),
    nonce,
    command: transaction,
  });

  const txData = {
    inputData,
    signature: {
      value: toHex(await keyPair.sign(inputData, chainId)),
      algo: keyPair.algorithm.name,
      version: keyPair.algorithm.version,
    },
    from: {
      pubKey: keyPair.publicKey.toString(),
    },
    version: 3,
    pow,
  };

  const tx = Transaction.encode(txData);

  const txJSON = {
    inputData: toBase64(inputData),
    signature: {
      value: txData.signature.value,
      algo: txData.signature.algo,
      version: txData.signature.version,
    },
    from: {
      pubKey: txData.from.pubKey,
    },
    version: txData.version,
    pow: {
      tid: toHex(tid),
      nonce: pow.nonce.toString(),
    },
  };

  const sentAt = new Date().toISOString();
  const hexTx = toBase64(tx);
  const res = await node.submitRawTransaction(hexTx, sendingMode);

  return {
    sentAt,
    transactionHash: res.txHash,
    transaction: txJSON,
  };
};

export const debug = async (_data) => {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([copyable(`${JSON.stringify(_data)}`)]),
    },
  });
};

export const debugString = async (data) => {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([copyable(`${data}`)]),
    },
  });
};
