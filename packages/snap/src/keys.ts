import assert from 'nanoassert';
import { KeyPair } from '@vegaprotocol/crypto/cjs/keypair.cjs';
import { hex as fromHex } from '@vegaprotocol/crypto/cjs/buf.cjs';

/**
 *
 * @param index
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
