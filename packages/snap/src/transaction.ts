import { toBase64, toHex } from '@vegaprotocol/crypto/cjs/buf.cjs';
import { randomFill } from '@vegaprotocol/crypto/cjs/crypto.cjs';
import { solve } from '@vegaprotocol/crypto/cjs/pow.cjs';
import { InputData, Transaction } from '@vegaprotocol/protos/vega/commands/v1';
import { invalidParameters } from './errors';
import { deriveKeyPair } from './keys';

/**
 * Encode and send a transaction to the Vega network.
 *
 * @param node - A `NodeRPC` instance.
 * @param transaction - The transaction to send.
 * @param sendingMode - The sending mode to use, must be one of `TYPE_SYNC` or `TYPE_ASYNC`.
 * @param publicKey - The public key of the key pair to use to sign the transaction.
 * @returns An object with the transaction hash, the transaction as JSON and the time it was sent.
 */
export async function send(node, transaction, sendingMode, publicKey) {
  const latestBlock = await node.blockchainHeight();
  const { chainId } = latestBlock;

  const [pow, inputData] = await Promise.all([
    solvePoW(latestBlock),
    encodeInputData(transaction, latestBlock),
  ]);

  const keyPair = await deriveKeyPair(0);

  if (keyPair.publicKey.toString() !== publicKey) {
    throw invalidParameters('Uknown public key');
  }

  const tx = await encodeTransaction(inputData, keyPair, pow, chainId);

  const sentAt = new Date().toISOString();
  const res = await node.submitRawTransaction(toBase64(tx.raw), sendingMode);

  return {
    sentAt,
    transactionHash: res.txHash,
    transaction: tx.json,
  };
}

/**
 * Helper to encode input data for a transaction, with a random nonce.
 *
 * @param command - The command to encode.
 * @param latestBlock - The latest block from the Vega network.
 * @param latestBlock.height - The height of the latest block.
 * @returns The encoded input data.
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
 * Helper to encode and sign a transaction.
 *
 * @param inputData - The encoded input data.
 * @param keyPair - The key pair to use to sign the transaction.
 * @param pow - The solved PoW challenge.
 * @param chainId - The chain ID of the Vega network.
 * @returns The encoded transaction as raw bytes and as JSON.
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
 * Helper to solve a PoW challenge. This is wrapped in a function to make it easier to run in parallel.
 *
 * @param latestBlock - The latest block from the Vega network.
 * @param latestBlock.spamPowDifficulty - The difficulty of the PoW challenge.
 * @param latestBlock.hash - The hash of the latest block.
 * @returns The solved PoW challenge.
 */
async function solvePoW(latestBlock: any) {
  const tid = await randomTid();
  const pow = await solve(latestBlock.spamPowDifficulty, latestBlock.hash, tid);

  return pow;
}

// /**
//  * Sanitizes a command to be used in a transaction, by encoding and decoding it.
//  * This effectively removes any unknown fields from the command.
//  *
//  * @param command - The command to sanitize.
//  * @returns The sanitized command.
//  */
// async function sanitizeCommand(command: any) {
//   const inputData = InputData.decode(
//     InputData.encode({
//       command,
//     }),
//   );
//
//   return inputData.command;
// }

/**
 * Generates a random transaction ID using a cryptographically secure random number generator.
 *
 * @returns A random transaction ID as a hex string.
 */
async function randomTid(): Promise<string> {
  return toHex(await randomFill(new Uint8Array(32)));
}

/**
 * Generates a random U64 bit nonce using a cryptographically secure random number generator.
 *
 * @returns A random nonce as a bigint.
 */
async function randomNonce(): Promise<bigint> {
  const dv = new DataView(await randomFill(new Uint8Array(8)).buffer);

  return dv.getBigUint64(0, false);
}
