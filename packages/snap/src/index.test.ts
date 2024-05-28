import { createServer } from 'node:http';
import { installSnap } from '@metamask/snaps-jest';
import { expect } from '@jest/globals';
import type { Heading, Panel } from '@metamask/snaps-sdk';
import { assert } from '@metamask/utils';

/**
 * Small HTTP server helper to send JSON responses. The server is `unref`ed so it will not keep the process alive.
 *
 * @param handler - A function that returns a `{ status: number; response: any }`. Reponse will be JSON serialised.
 * @returns A promise that resolves to a `{ close(): Promise<void>; url: string }` object. `close` will close the server.
 */
async function createHTTPServer(
  handler,
): Promise<{ close(): Promise<void>; url: string }> {
  const server = createServer(async (req, res) => {
    const hres = await handler(req.url);

    res.writeHead(hres.status ?? 200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    res.end(JSON.stringify(hres.body));
  });

  server.unref();
  return new Promise((resolveServer) => {
    server.listen(() => {
      const { port } = server.address() as { port: number };
      const url = `http://localhost:${port}`;

      /**
       * Close the HTTP server, resolving when the fully closed.
       */
      function close(): Promise<void> {
        return new Promise((resolveClose, rejectClose) => {
          server.close((err) => {
            if (err) {
              return rejectClose(err);
            }
            return resolveClose();
          });
        });
      }

      resolveServer({
        close,
        url,
      });
    });
  });
}

describe('onRpcRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const { request, close } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWith({
      error: {
        code: -32601,
        message: 'Method not found',
        data: null,
      },
    });

    await close();
  });

  it('should return a list of 11 first public keys', async () => {
    const { request, close } = await installSnap();

    const response = await request({
      method: 'client.list_keys',
    });

    expect(response).toRespondWith({
      keys: [
        {
          name: 'Snap Key 0',
          publicKey:
            '9de50c4b737d942cf6a415f15f3b73a0c19ad1dd80f4209e5c11408e1459a6a7',
        },
        {
          name: 'Snap Key 1',
          publicKey:
            '66599d6ca8d6102a57f3fd049598a300232056a9d46d95a116d2d523c3b3feac',
        },
        {
          name: 'Snap Key 2',
          publicKey:
            'f004fb2bef25909033225254689cf18064b8130db2b00c6ae7f59e3a3b237a96',
        },
        {
          name: 'Snap Key 3',
          publicKey:
            '7adb4cfdc76ea148975ea2acc380b3a7794aec1a4ab2f3034e1041db882b5b08',
        },
        {
          name: 'Snap Key 4',
          publicKey:
            'e966107938c1c5fcb08147949d43bcb05057a8bc50742ca4f9742d102c5c085a',
        },
        {
          name: 'Snap Key 5',
          publicKey:
            'a4ffcea0c25354306947a4c80fbf6464d07b4b0d17e001916b2bcbcb6da4259e',
        },
        {
          name: 'Snap Key 6',
          publicKey:
            'afc6e36ff6b4c188f516d6a2ce3d76c72e90a4b35440808087f3db7b294c1a85',
        },
        {
          name: 'Snap Key 7',
          publicKey:
            '8e5263b318e2767de7b93a26a9e3ab168315d5503acd936bdeb6a17183c8393d',
        },
        {
          name: 'Snap Key 8',
          publicKey:
            '39d1ab506cda7a0d989dd0651f3d9fe7e2f2309814a5a449c4e021c8e8716e78',
        },
        {
          name: 'Snap Key 9',
          publicKey:
            '608a6a000f10ba588cbadfc1a274c6e3601f97d80288055ba36e6e954bf1ff60',
        },
        {
          name: 'Snap Key 10',
          publicKey:
            'eb3b36123a6714013e9418a7ad78991a6a7f58d15f7ee1956c0dbb46a79719af',
        },
      ],
    });

    await close();
  });

  it('should return the chain ID', async () => {
    const { request, close } = await installSnap();

    const { close: closeServer, url } = await createHTTPServer(() => {
      return {
        status: 200,
        body: {
          height: '1',
          chainId: 'testnet',
        },
      };
    });

    const response = await request({
      method: 'client.get_chain_id',
      params: {
        networkEndpoints: [url],
      },
    });

    expect(response).toRespondWith({
      chainID: 'testnet',
    });

    await close();
    await closeServer();
  });

  it('should error on get chain id if no healthy nodes are available', async () => {
    const { request, close } = await installSnap();
    const { close: closeServer, url } = await createHTTPServer(() => {
      return {
        status: 500,
        body: {},
      };
    });

    const response = await request({
      method: 'client.get_chain_id',
      params: {
        networkEndpoints: [url],
      },
    });

    expect(response).toRespondWith({
      error: {
        code: -6,
        message: 'No healthy node',
        data: expect.any(String),
      },
    });

    await close();
    await closeServer();
  });

  it('should error on get chain id if bad networkd endpoints are provided', async () => {
    const { request, close } = await installSnap();

    expect(
      await request({
        method: 'client.get_chain_id',
        params: {},
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Invalid network endpoints',
      },
    });

    expect(
      await request({
        method: 'client.get_chain_id',
        params: {
          networkEndpoints: [],
        },
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Invalid network endpoints',
      },
    });

    expect(
      await request({
        method: 'client.get_chain_id',
        params: {
          networkEndpoints: 'http://localhost:1234',
        },
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Invalid network endpoints',
      },
    });

    await close();
  });

  it('should error on invalid send transaction requests', async () => {
    const { request, close } = await installSnap();

    const publicKey =
      '9de50c4b737d942cf6a415f15f3b73a0c19ad1dd80f4209e5c11408e1459a6a7';

    expect(
      await request({
        method: 'client.send_transaction',
        params: {},
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: expect.any(String),
      },
    });

    expect(
      await request({
        method: 'client.send_transaction',
        params: {
          networkEndpoints: [],
        },
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Invalid network endpoints',
      },
    });

    expect(
      await request({
        method: 'client.send_transaction',
        params: {
          sendingMode: 'sync',
          networkEndpoints: ['http://localhost:1234'],
        },
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Invalid sending mode',
      },
    });

    expect(
      await request({
        method: 'client.send_transaction',
        params: {
          sendingMode: 'TYPE_SYNC',
          publicKey: '0x123',
          transaction: {},
          networkEndpoints: ['http://localhost:1234'],
        },
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Invalid public key',
      },
    });

    const { close: closeServer, url } = await createHTTPServer(() => {
      return {
        status: 200,
        body: {
          height: '1',
          chainId: 'testnet',
        },
      };
    });

    expect(
      await request({
        method: 'client.send_transaction',
        params: {
          sendingMode: 'TYPE_SYNC',
          publicKey,
          transaction: {},
          networkEndpoints: [url],
        },
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Invalid transaction',
      },
    });

    expect(
      await request({
        method: 'client.send_transaction',
        params: {
          sendingMode: 'TYPE_SYNC',
          publicKey,
          networkEndpoints: [url],
          transaction: {
            // Very subtle, but `transfers` is not a valid transaction, `transfer` is (singular case)
            transfers: {
              fromAccountType: 'ACCOUNT_TYPE_GENERAL',
              toAccountType: 'ACCOUNT_TYPE_GENERAL',

              // Vega
              asset:
                'fc7fd956078fb1fc9db5c19b88f0874c4299b2a7639ad05a47a28c0aef291b55',
              amount: '1',
              to: publicKey,
              kind: {
                oneOff: {},
              },
            },
          },
        },
      }),
    ).toRespondWith({
      error: {
        code: -1,
        message: 'Invalid parameters',
        data: 'Unknown transaction type',
      },
    });

    await close();
    await closeServer();
  });

  it('reject should not submit any transactions', async () => {
    const { request, close } = await installSnap();

    const publicKey =
      '9de50c4b737d942cf6a415f15f3b73a0c19ad1dd80f4209e5c11408e1459a6a7';

    const httpHandler = jest.fn().mockReturnValue({
      status: 200,
      body: {
        height: '1',
        chainId: 'testnet',
        spamPowDifficulty: 15,
        hash: '34E5220BF0A56C19C673D08057450350792D30B864B58756D1FD508A18AA6E67',
      },
    });
    const { close: closeServer, url } = await createHTTPServer(httpHandler);

    const response = request({
      method: 'client.send_transaction',
      params: {
        networkEndpoints: [url],
        sendingMode: 'TYPE_SYNC',
        publicKey,
        transaction: {
          transfer: {
            fromAccountType: 'ACCOUNT_TYPE_GENERAL',
            toAccountType: 'ACCOUNT_TYPE_GENERAL',

            // Vega
            asset:
              'fc7fd956078fb1fc9db5c19b88f0874c4299b2a7639ad05a47a28c0aef291b55',
            amount: '1',
            to: '0x123',
            kind: {
              oneOff: {},
            },
          },
        },
      },
    });

    const ui = await response.getInterface();

    assert(ui.type === 'confirmation');
    expect(
      (
        (ui.content as Panel).children.find((elm) => elm.type === 'heading') as
          | Heading
          | undefined
      )?.value,
    ).toBe('Transfer');
    await ui.cancel();

    expect(await response).toRespondWith({
      error: {
        code: -4,
        message: 'Transaction denied',
        data: 'The user denied the transaction',
      },
    });

    // This assertion is definitely implementation specific, but it guards the next assertion
    expect(httpHandler).toHaveBeenCalledTimes(3);
    expect(httpHandler).toHaveBeenCalledWith('/api/v2/assets');
    expect(httpHandler).toHaveBeenCalledWith('/api/v2/markets');
    expect(httpHandler).toHaveBeenCalledWith('/blockchain/height');

    // This is what we really want to guard against
    expect(httpHandler).not.toHaveBeenCalledWith('/transaction/raw');

    await close();
    await closeServer();
  });

  it('confirm should return tx and txHash', async () => {
    const { request, close } = await installSnap();

    const publicKey =
      '9de50c4b737d942cf6a415f15f3b73a0c19ad1dd80f4209e5c11408e1459a6a7';

    // Hard-coded tx hash so we can compare it later
    const txHash =
      '542db2288551c24359eb933cba5c43dd0cfd20a87a76756af97c93a1ec4d0577';

    const { url } = await createHTTPServer((pathname) => {
      if (pathname === '/blockchain/height') {
        return {
          status: 200,
          body: {
            height: '1',
            chainId: 'testnet',
            spamPowDifficulty: 15,
            hash: '34E5220BF0A56C19C673D08057450350792D30B864B58756D1FD508A18AA6E67',
          },
        };
      }

      if (pathname === '/transaction/raw') {
        return {
          status: 200,
          body: {
            txHash,
            code: 0,
          },
        };
      }

      return { status: 500 };
    });

    const response = request({
      method: 'client.send_transaction',
      params: {
        sendingMode: 'TYPE_SYNC',
        publicKey,
        networkEndpoints: [url],
        transaction: {
          transfer: {
            fromAccountType: 'ACCOUNT_TYPE_GENERAL',
            toAccountType: 'ACCOUNT_TYPE_GENERAL',

            // Vega
            asset:
              'fc7fd956078fb1fc9db5c19b88f0874c4299b2a7639ad05a47a28c0aef291b55',
            amount: '1',
            to: '0x123',
            kind: {
              oneOff: {},
            },
          },
        },
      },
    });

    const ui = await response.getInterface();

    assert(ui.type === 'confirmation');
    expect(
      (
        (ui.content as Panel).children.find((elm) => elm.type === 'heading') as
          | Heading
          | undefined
      )?.value,
    ).toBe('Transfer');
    await ui.ok();

    expect(await response).toRespondWith({
      sentAt: expect.any(String),
      transactionHash: txHash,
      transaction: expect.any(Object),
    });

    await close();
  });
});
