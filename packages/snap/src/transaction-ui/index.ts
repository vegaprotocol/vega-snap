import { panel, heading, text, divider, copyable } from '@metamask/snaps-sdk';
import { EnrichmentData, VegaTransaction } from '../types';
import { getFormatNumber, minimiseId } from './utils';
import { transactionTitle } from './transaction-title';
import { prettyPrintTx } from './pretty-print-tx';

/**
 * Displays a confirmation dialog with the given transaction, pretty printing
 * the transaction and providing a copyable raw transaction.
 *
 * @param origin - Origin of the transaction.
 * @param transaction - Transaction to display.
 * @param selectedNetworkEntrypoint - The selected network entrypoint as a URL. The origin is displayed to the user.
 * @param pair - The selected public key.
 * @param enrichmentData - Data used to enrich the transaction data to make it more human readable.
 * @param formatNumber - Function to format numbers based on the user's locale.
 * @returns `true` if the user approves the transaction, `false` otherwise.
 */
export async function reviewTransaction(
  origin: string,
  transaction: VegaTransaction,
  selectedNetworkEntrypoint: URL,
  pair: any,
  enrichmentData: EnrichmentData,
  formatNumber: ReturnType<typeof getFormatNumber>,
) {
  const publicKey = pair.keyPair.publicKey.toString();
  const content = panel([
    heading(transactionTitle(transaction)),
    text(`Request from: **${origin}**`),
    text(JSON.stringify(enrichmentData, null, 2)),
    divider(),
    ...prettyPrintTx(transaction, text, enrichmentData, formatNumber),
    divider(),
    text(`Selected key: Snap Key ${pair.index} (${minimiseId(publicKey)})`),
    divider(),
    text(`Selected network entrypoint: ${selectedNetworkEntrypoint.origin}`),
    divider(),
    text('Raw transaction:'),
    copyable(
      JSON.stringify(transaction, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    ),
  ]);

  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content,
    },
  });
}
