import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';
import rpc from "./node-rpc";

import { KeyPair } from '@vegaprotocol/crypto/cjs/keypair.cjs'
import * as InputData from '@vegaprotocol/protos/dist/vega/commands/v1/InputData/encode'
import * as Transaction from '@vegaprotocol/protos/dist/vega/commands/v1/Transaction/encode'
import { TX_VERSION_V3 } from '@vegaprotocol/protos/dist/vega/commands/v1/TxVersion'
import { toBase64, toHex } from '@vegaprotocol/crypto/cjs/buf.cjs'
import { randomFill } from '@vegaprotocol/crypto/cjs/crypto.cjs'

const networks = new Map([
  ['Mainnet', {
    rest: [
      'https://vega-mainnet-data.commodum.io',
      'https://vega-data.nodes.guru:3008',
      'https://vega-data.bharvest.io',
      'https://datanode.vega.pathrocknetwork.org',
      'https://vega.aurora-edge.com',
      'https://darling.network'
    ]
  }],
  ['Fairground', {
    rest: [
      "https://api.n06.testnet.vega.xyz",
      "https://api.n07.testnet.vega.xyz"
    ]
  }]
])

const DEFAULT_NETWORK = 'Mainnet'

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'client.list_keys':
      const entropy = await snap.request({
        method: 'snap_getBip32Entropy',
        params: {
          path: ['m', "1789'", "0'", "0'"],
          curve: 'ed25519',
        }
      });

      const keyPair = await KeyPair.fromSeed(entropy.index, Buffer.from(entropy.privateKey.slice(2), 'hex'))

      return {
        keys: [{ name: 'Snap Key 1', publicKey: keyPair.publicKey.toString() }]
      }

    case 'client.get_chain_id':
      const node = await rpc.findHealthyNode(networks.get(DEFAULT_NETWORK).rest.map(u => new URL(u)))
      const res = await node.blockchainHeight()

      return { chainID: res.chainId }

    case 'client.send_transaction':
      const { sendingMode, transaction, publicKey } = request.params
      // TODO write logic to encode and POW and all that
      return

    case 'client.connect_wallet':
    case 'client.disconnect_wallet':
    default:
      throw new Error('Method not found.');
  }
};
