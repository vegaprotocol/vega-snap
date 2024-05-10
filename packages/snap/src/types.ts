import type {
  v2ListAssetsResponse,
  v2ListMarketsResponse,
} from '@vegaprotocol/rest-clients/dist/trading-data';

export type VegaTransaction = any;

export type EnrichmentData = {
  assets: v2ListAssetsResponse;
  markets: v2ListMarketsResponse;
};
