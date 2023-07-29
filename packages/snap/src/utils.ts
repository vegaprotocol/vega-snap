export const networks = new Map([
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

export const DEFAULT_NETWORK = 'Fairground';

export const serializeError = (msg) => {
  return {
    error: {
      message: msg,
    },
  };
};
