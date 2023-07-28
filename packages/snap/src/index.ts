import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { vega } from '@vegaprotocol/protos';
import { KeyPair } from '@vegaprotocol/crypto/cjs/keypair.cjs';
import rpc from './node-rpc';
import * as txs from './transaction';

// import * as InputData from '@vegaprotocol/protos/dist/vega/commands/v1/InputData/encode'
// import * as Transaction from '@vegaprotocol/protos/dist/vega/commands/v1/Transaction/encode'
// import { TX_VERSION_V3 } from '@vegaprotocol/protos/dist/vega/commands/v1/TxVersion'

const networks = new Map([
  [
    'Mainnet',
    {
      rest: [
        'https://vega-mainnet-data.commodum.io',
        'https://vega-data.nodes.guru:3008',
        'https://vega-data.bharvest.io',
        'https://datanode.vega.pathrocknetwork.org',
        'https://vega.aurora-edge.com',
        'https://darling.network',
      ],
    },
  ],
  [
    'Fairground',
    {
      rest: [
        'https://api.n06.testnet.vega.xyz',
        'https://api.n07.testnet.vega.xyz',
      ],
    },
  ],
]);

const DEFAULT_NETWORK = 'Fairground';

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'client.list_keys':
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

    case 'client.get_chain_id':
      var node = await rpc.findHealthyNode(
        networks.get(DEFAULT_NETWORK).rest.map((u) => new URL(u)),
      );
      const res = await node.blockchainHeight();

      return { chainID: res.chainId };

    case 'client.send_transaction':
      const { publicKey, sendingMode, transaction } = request.params;
      if (sendingMode != 'TYPE_SYNC' && sendingMode != 'TYPE_ASYNC') {
        throw new Error('Not a valid sending mode.');
      }

      var proceed = await txs.review(origin, transaction);
      if (!proceed) {
        return serializeError('User rejected the transaction');
      }

      var node = await rpc.findHealthyNode(
        networks.get(DEFAULT_NETWORK).rest.map((u) => new URL(u)),
      );

      return txs.send(node, transaction, sendingMode);

    case 'client.connect_wallet':
    case 'client.disconnect_wallet':
    default:
      throw new Error('Method not found.');
  }
};

const serializeError = (msg) => {
  return {
    error: {
      message: msg,
    },
  };
};
