import type { OnRpcRequestHandler, JsonRpcRequest } from '@metamask/snaps-sdk';
import rpc from './node-rpc';
import * as txs from './transaction';
import { deriveKeyPair } from './keys';
import { reviewTransaction } from './transaction-ui';
import {
  invalidParameters,
  JSONRPCError,
  methodNotFound,
  noHealthyNode,
  transactionDenied,
  transactionFailed,
} from './errors';
import { transactionTitle } from './transaction-ui/transaction-title';
import { getFormatNumber } from './transaction-ui/utils';

const fetchWithTimeout = async (node: rpc, path: string) => {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const res = await node.getJSON(path, { signal: controller.signal });
    return res;
  } catch (e) {
    return null;
  }
};

/**
 * List the keys in the wallet.
 */
async function listKeys() {
  const keys = [];

  // always generate the 11 first keys
  for (let i = 0; i < 11; i++) {
    const keyPair = await deriveKeyPair(i);
    keys.push({
      name: `Snap Key ${i}`,
      publicKey: keyPair.publicKey.toString(),
    });
  }

  return {
    keys,
  };
}

/**
 * Get the chain ID from a list of network endpoints.
 *
 * @param _ - Origin of the request.
 * @param request - JSON-RPC request.
 */
async function getChainId(_: string, request: JsonRpcRequest) {
  try {
    const { networkEndpoints } = request.params;
    if (!Array.isArray(networkEndpoints) || networkEndpoints.length === 0) {
      throw invalidParameters('Invalid network endpoints');
    }

    const res = await (
      await rpc.findHealthyNode(networkEndpoints.map((u) => new URL(u)))
    ).blockchainHeight();

    return { chainID: res.chainId };
  } catch (ex) {
    if (ex.message === 'No healthy node found') {
      throw noHealthyNode();
    }

    throw ex;
  }
}

/**
 * Send a transaction.
 *
 * @param origin - Origin of the request.
 * @param request - JSON-RPC request.
 */
async function sendTransaction(origin: string, request: JsonRpcRequest) {
  const { sendingMode, transaction, publicKey, networkEndpoints } =
    request.params;
  if (!Array.isArray(networkEndpoints) || networkEndpoints.length === 0) {
    throw invalidParameters('Invalid network endpoints');
  }

  if (['TYPE_SYNC', 'TYPE_ASYNC'].includes(sendingMode) === false) {
    throw invalidParameters('Invalid sending mode');
  }

  if (
    typeof publicKey !== 'string' ||
    /^[0-9a-f]{64}$/u.test(publicKey) === false
  ) {
    throw invalidParameters('Invalid public key');
  }

  const pair = await txs.findKeyPair(publicKey);

  if (pair === null) {
    throw invalidParameters('Unknown public key');
  }

  const node = await rpc.findHealthyNode(
    networkEndpoints.map((u) => new URL(u)),
  );

  // calling this function here as it will throw
  // appropriate errors if the transaction is empty,
  // or not containing an existing supported command.
  transactionTitle(transaction);

  const locale = await snap.request({
    method: 'snap_getLocale',
  });
  // TODO: the date should be the same here
  const formatNumber = getFormatNumber(locale);
  const sanitizedTransaction = await txs.sanitizeCommand(transaction);
  const [assets, markets] = await Promise.all([
    fetchWithTimeout(node, 'api/v2/assets'),
    fetchWithTimeout(node, 'api/v2/markets'),
  ]);
  // Transaction validation is somewhat handled down in this function.
  // Could be improved and made more explicit.
  const approved = await reviewTransaction(
    origin,
    sanitizedTransaction,
    node.getURL(),
    pair,
    {
      assets,
      markets,
    },
    formatNumber,
  );

  if (approved !== true) {
    throw transactionDenied();
  }

  try {
    return txs.send(node, transaction, sendingMode, publicKey);
  } catch (ex) {
    if (rpc.isTxError(ex)) {
      throw transactionFailed(ex);
    }

    throw ex;
  }
}

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  try {
    switch (request.method) {
      case 'client.list_keys':
        return await listKeys();
      case 'client.get_chain_id':
        return await getChainId(origin, request);
      case 'client.send_transaction':
        return await sendTransaction(origin, request);

      // No-op's to be compatible with Vega client API
      case 'client.connect_wallet':
      case 'client.disconnect_wallet':
        return null;

      default:
        throw methodNotFound();
    }
  } catch (ex) {
    if (ex instanceof JSONRPCError) {
      return { error: ex.toJSON() };
    }

    throw ex;
  }
};
