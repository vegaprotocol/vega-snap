import { OnRpcRequestHandler, JsonRpcRequest } from '@metamask/snaps-types';
import rpc from './node-rpc';
import * as txs from './transaction';
import { deriveKeyPair } from './keys';
import { reviewTransaction } from './ui';
import {
  invalidParameters,
  JSONRPCError,
  noHealthyNode,
  transactionDenied,
  transactionFailed,
} from './errors';

/**
 * List the keys in the wallet.
 */
async function listKeys() {
  const keyPair = await deriveKeyPair(0);

  return {
    keys: [{ name: 'Snap Key 1', publicKey: keyPair.publicKey.toString() }],
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

  const node = await rpc.findHealthyNode(
    networkEndpoints.map((u) => new URL(u)),
  );
  // Transaction validation is somewhat handled down in this function.
  // Could be improved and made more explicit.
  const approved = await reviewTransaction(origin, transaction, node.getURL());

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
        throw new Error('Method not found.');
    }
  } catch (ex) {
    if (ex instanceof JSONRPCError) {
      return { error: ex.toJSON() };
    }

    throw ex;
  }
};
