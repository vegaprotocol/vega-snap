# Vega Snap

This snap adds support for the Vega Protocol network to MetaMask.
It supports `client.list_keys`, `client.get_chain_id` and `client.send_transaction`
from the Vega Wallet API. `client.connect_wallet` and `client.disconnect_wallet`
are no-op's, but kept to provide compatibility with the Vega Wallet API.

## Testing

The snap comes with some basic tests, to demonstrate how to write tests for
snaps. To test the snap, run `yarn test` in this directory. This will use
[`@metamask/snaps-jest`](https://github.com/MetaMask/snaps/tree/main/packages/snaps-jest)
to run the tests in `src/index.test.ts`.

## Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with
  the CLI, `transpilationMode` must be set to `localOnly` (default) or
  `localAndDeps`.
