import { installSnap } from '@metamask/snaps-jest';
import { expect } from '@jest/globals';

describe('onRpcRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const { request, close } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: -32603,
      message: 'Internal JSON-RPC error.',
      data: {
        cause: {
          message: 'Method not found.',
          stack: expect.any(String),
        },
      },
    });

    await close();
  });

  it('should return a list of public keys', async () => {
    const { request, close } = await installSnap();

    const response = await request({
      method: 'client.list_keys',
    });

    expect(response).toRespondWith({
      keys: [
        {
          name: 'Snap Key 1',
          publicKey:
            '9de50c4b737d942cf6a415f15f3b73a0c19ad1dd80f4209e5c11408e1459a6a7',
        },
      ],
    });

    await close();
  });

  it('should return the chain ID', async () => {
    const { request, close, mock } = await installSnap();

    const { unmock } = await mock({
      url: /.*\/blockchain\/height$/u,
      response: {
        status: 200,
        body: JSON.stringify({
          chainId: 'testnet',
          height: '1',
        }),
      },
    });

    const response = await request({
      method: 'client.get_chain_id',
    });

    expect(response).toRespondWith({
      chainID: 'testnet',
    });

    await unmock();
    await close();
  });

  it('should error on get chain id if no healthy nodes are available', async () => {
    const { request, close, mock } = await installSnap();

    const { unmock } = await mock({
      url: /.*\/blockchain\/height$/u,
      response: {
        status: 500,
      },
    });

    const response = await request({
      method: 'client.get_chain_id',
    });

    expect(response).toRespondWithError({
      code: -32603,
      message: 'Internal JSON-RPC error.',
      data: {
        cause: {
          message: 'No healthy node found',
        },
      },
    });

    await unmock();
    await close();
  });
});
