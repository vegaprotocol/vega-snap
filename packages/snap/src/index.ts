import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { KeyPair } from '@vegaprotocol/crypto/cjs/keypair.cjs';
import rpc from './node-rpc';
import * as txs from './transaction';
import * as utils from './utils';

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'client.list_keys': {
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

      return {
        keys: [{ name: 'Snap Key 1', publicKey: keyPair.publicKey.toString() }],
      };
    }

    case 'client.get_chain_id': {
      const res = await (
        await rpc.findHealthyNode(
          utils.networks.get(utils.DEFAULT_NETWORK).rest.map((u) => new URL(u)),
        )
      ).blockchainHeight();

      return { chainID: res.chainId };
    }

    case 'client.send_transaction': {
      const { sendingMode, transaction } = request.params;
      if (sendingMode !== 'TYPE_SYNC' && sendingMode !== 'TYPE_ASYNC') {
        throw new Error('Not a valid sending mode.');
      }

      const proceed = await txs.review(origin, transaction);
      if (!proceed) {
        return utils.serializeError('User rejected the transaction');
      }

      return txs.send(
        await rpc.findHealthyNode(
          utils.networks.get(utils.DEFAULT_NETWORK).rest.map((u) => new URL(u)),
        ),
        transaction,
        sendingMode,
      );
    }
    case 'client.connect_wallet':
    case 'client.disconnect_wallet':
    default:
      throw new Error('Method not found.');
  }
};
