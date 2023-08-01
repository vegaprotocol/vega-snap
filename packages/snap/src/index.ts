import { OnRpcRequestHandler } from '@metamask/snaps-types';
import rpc from './node-rpc';
import * as txs from './transaction';
import { deriveKeyPair } from './keys';
import { reviewTransaction } from './ui';

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'client.list_keys': {
      const keyPair = await deriveKeyPair(0);

      return {
        keys: [{ name: 'Snap Key 1', publicKey: keyPair.publicKey.toString() }],
      };
    }

    case 'client.get_chain_id': {
      const { networkEndpoints } = request.params;
      if (!networkEndpoints || networkEndpoints.length === 0) {
        throw new Error('No network endpoints provided');
      }

      const res = await (
        await rpc.findHealthyNode(networkEndpoints.map((u) => new URL(u)))
      ).blockchainHeight();

      return { chainID: res.chainId };
    }

    case 'client.send_transaction': {
      const { sendingMode, transaction, publicKey, networkEndpoints } =
        request.params;
      if (sendingMode !== 'TYPE_SYNC' && sendingMode !== 'TYPE_ASYNC') {
        throw new Error('Not a valid sending mode.');
      }

      if (!networkEndpoints || networkEndpoints.length === 0) {
        throw new Error('No network endpoints provided');
      }

      const node = await rpc.findHealthyNode(
        networkEndpoints.map((u) => new URL(u)),
      );

      const approved = await reviewTransaction(
        origin,
        transaction,
        node.getURL(),
      );

      if (approved !== true) {
        throw new Error('User rejected the transaction');
      }

      return txs.send(node, transaction, sendingMode, publicKey);
    }

    // No-op's to be compatible with Vega client API
    case 'client.connect_wallet':
    case 'client.disconnect_wallet':
      return null;

    default:
      throw new Error('Method not found.');
  }
};
