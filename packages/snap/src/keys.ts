import assert from 'nanoassert';
import { KeyPair } from '@vegaprotocol/crypto/cjs/keypair.cjs';
import { hex as fromHex } from '@vegaprotocol/crypto/cjs/buf.cjs';

/**
 * Derive a Vega key pair from a given index, using metamask as a source of entropy.
 *
 * @param index - Index of the key pair to derive. Must be in the interval [0, 2^31).
 */
export async function deriveKeyPair(index: number) {
  assert(index >= 0 && index < 2 ** 31, 'Key index out of bounds');

  const entropy = await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: ['m', "1789'", "0'", `${index}'`],
      curve: 'ed25519',
    },
  });

  return KeyPair.fromSeed(entropy.index, fromHex(entropy.privateKey.slice(2)));
}
