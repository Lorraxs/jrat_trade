export type Interval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export interface IMarkPriceStream {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Mark price
  i: string; // Index price
  P: string; //  Estimated Settle Price, only useful in the last hour before the settlement starts
  r: string; //  Funding rate
  T: number; // Next funding time
}

export interface IKlineStream {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    f: number; // First trade ID
    L: number; // Last trade ID
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
    V: string; // Taker buy base asset volume
    Q: string; // Taker buy quote asset volume
    B: string; // Ignore
  };
}

export interface IMiniTickerStream {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
}

export type IWsRequestResponse = {
  result: null;
  id: number;
};

export type IWsMarketStreamPayload<T = any> =
  | {
      stream: string;
      data: T;
    }
  | {
      result: null;
      id: number;
    };

export type IWsResponse<T = any> =
  | IWsMarketStreamPayload<T>
  | IWsRequestResponse;

export const IsWsRequestResponse = (
  res: IWsMarketStreamPayload
): res is IWsRequestResponse => {
  return (res as IWsRequestResponse).id !== undefined;
};

export const DiscordLogChannels = [
  "DISCORD_LOG_CHANNEL_ID",
  "DISCORD_BUOB_CHANNEL_ID",
  "DISCORD_BUY_SIGNAL_CHANNEL_ID",
  "DISCORD_WS_CLOSE_CHANNEL_ID",
  "DISCORD_WS_DEBUG_CHANNEL_ID",

  "DISCORD_CONDITION_15M_1_CHANNEL_ID",
  "DISCORD_CONDITION_15M_2_CHANNEL_ID",
  "DISCORD_CONDITION_15M_3_CHANNEL_ID",
  "DISCORD_CONDITION_15M_4_CHANNEL_ID",
  "DISCORD_CONDITION_15M_5_CHANNEL_ID",

  "DISCORD_CONDITION_30M_1_CHANNEL_ID",
  "DISCORD_CONDITION_30M_2_CHANNEL_ID",
  "DISCORD_CONDITION_30M_3_CHANNEL_ID",
  "DISCORD_CONDITION_30M_4_CHANNEL_ID",
  "DISCORD_CONDITION_30M_5_CHANNEL_ID",

  "DISCORD_CONDITION_1H_1_CHANNEL_ID",
  "DISCORD_CONDITION_1H_2_CHANNEL_ID",
  "DISCORD_CONDITION_1H_3_CHANNEL_ID",
  "DISCORD_CONDITION_1H_4_CHANNEL_ID",
  "DISCORD_CONDITION_1H_5_CHANNEL_ID",
  "LUX_ALGO_ORDER_BLOCKS",
] as const;

export type IDiscordLogChannel = (typeof DiscordLogChannels)[number];

export interface ICandleData {
  baseAssetVolume: number;
  close: number;
  closeTime: number;
  high: number;
  interval: string;
  low: number;
  open: number;
  openTime: number;
  quoteAssetVolume: number;
  symbol: string;
  trades: number;
  volume: number;
}

export interface ICoinInfo {
  baseAsset: string;
  minQty: number;
  quoteAsset: string;
  status: string;
  symbol: string;
  tickSize: number;
}

export class Box {
  top: number;
  bottom: number;
  left: number;
  constructor(left: number, top: number, bottom: number) {
    this.left = left;
    this.top = top;
    this.bottom = bottom;
  }
}

export type IConditions = [boolean, boolean, boolean, boolean, boolean];

export interface TradeSignal {
  symbol: string;
  interval: string;
  bias: number;
  barHigh: number;
  barLow: number;
  barTime: number;
  hash: string;
}

export interface ICryptoSettings {
  condition1: number;
  condition2: number;
}
