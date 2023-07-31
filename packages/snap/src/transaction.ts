import { toBase64, toHex } from '@vegaprotocol/crypto/cjs/buf.cjs';
import { randomFill } from '@vegaprotocol/crypto/cjs/crypto.cjs';
import { solve } from '@vegaprotocol/crypto/cjs/pow.cjs';
import { InputData, Transaction } from '@vegaprotocol/protos/vega/commands/v1';
import { deriveKeyPair } from './keys';

export const send = async (node, transaction, sendingMode, publicKey) => {
  const latestBlock = await node.blockchainHeight();
  const { chainId } = latestBlock;

  const [pow, inputData] = await Promise.all([
    solvePoW(latestBlock),
    encodeInputData(transaction, latestBlock),
  ]);

  const keyPair = await deriveKeyPair(0);

  if (keyPair.publicKey.toString() !== publicKey) {
    throw new Error('Uknown public key');
  }

  const tx = await encodeTransaction(inputData, keyPair, pow, chainId);

  const sentAt = new Date().toISOString();
  const res = await node.submitRawTransaction(toBase64(tx.raw), sendingMode);

  return {
    sentAt,
    transactionHash: res.txHash,
    transaction: tx.json,
  };
};

/**
 *
 * @param command
 * @param latestBlock
 */
async function encodeInputData(command, latestBlock) {
  const inputData = InputData.encode({
    blockHeight: BigInt(latestBlock.height),
    nonce: await randomNonce(),
    command,
  });

  return inputData;
}

/**
 *
 * @param inputData
 * @param keyPair
 * @param pow
 * @param chainId
 */
async function encodeTransaction(inputData, keyPair, pow, chainId) {
  const signature = {
    value: toHex(await keyPair.sign(inputData, chainId)),
    algo: keyPair.algorithm.name,
    version: keyPair.algorithm.version,
  };

  const from = {
    pubKey: keyPair.publicKey.toString(),
  };

  const version = 3;

  const raw = Transaction.encode({
    inputData,
    signature,
    from,
    version,
    pow,
  });

  const json = {
    inputData: toBase64(inputData),
    signature,
    from,
    version,
    pow: {
      tid: pow.tid,
      nonce: pow.nonce.toString(),
    },
  };

  return { raw, json };
}

/**
 *
 * @param latestBlock
 */
async function solvePoW(latestBlock: any) {
  const tid = await randomTid();
  const pow = await solve(latestBlock.spamPowDifficulty, latestBlock.hash, tid);

  return pow;
}

/**
 *
 * @param command
 */
async function sanitizeCommand(command: any) {
  const inputData = InputData.decode(
    InputData.encode({
      command,
    }),
  );

  return inputData.command;
}

/**
 *
 */
async function randomTid(): Promise<string> {
  return toHex(await randomFill(new Uint8Array(32)));
}

/**
 *
 */
async function randomNonce(): Promise<bigint> {
  const dv = new DataView(await randomFill(new Uint8Array(8)).buffer);

  return dv.getBigUint64(0, false);
}
