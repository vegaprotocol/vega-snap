export class JSONRPCError extends Error {
  code: number;

  data: any;

  constructor(message: string, code: number, data: any) {
    super(message);
    this.code = code;
    this.data = data;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

// These are the same as Web Wallet
export const methodNotFound = () =>
  new JSONRPCError('Method not found', -32601, null);
export const invalidParameters = (message: string) =>
  new JSONRPCError('Invalid parameters', -1, message);
export const unknownPublicKey = () =>
  new JSONRPCError(
    'Unknown public key',
    -3,
    'The public key is not known to the wallet',
  );
export const transactionDenied = () =>
  new JSONRPCError('Transaction denied', -4, 'The user denied the transaction');
export const transactionFailed = (cause: any) =>
  new JSONRPCError('Transaction failed', -5, cause);
export const noHealthyNode = () =>
  new JSONRPCError('No healthy node', -6, 'No healthy node found');
