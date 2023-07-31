export type RpcListKeys = {};

export type RpcGetChainId = {};

export type RpcSendTransaction = {
  transaction: Transaction;
  sendingMode: 'TYPE_SYNC' | 'TYPE_ASYNC';
  publicKey: string;
};
