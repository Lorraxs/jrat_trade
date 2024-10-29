import type { Binance } from "./types/binance.type";

export type ExchangeInfoData = {
  data: Binance.ExchangeInfomation;
  type: "binance";
};

export class ExchangeInfo {
  constructor(data: ExchangeInfoData) {
    if (data.type === "binance") {
      this.parseBinanceData(data.data);
    }
  }

  rateLimits: Binance.RateLimit[] = [];
  assets: Binance.Asset[] = [];
  symbols: Binance.Symbol[] = [];

  #cache: Record<string, any> = {};

  parseBinanceData(data: Binance.ExchangeInfomation) {
    this.rateLimits = data.rateLimits;
    this.assets = data.assets;
    this.symbols = data.symbols;
  }

  private getCache(key: string, fn: () => any) {
    if (!this.#cache[key]) {
      this.#cache[key] = fn();
    }
    return this.#cache[key];
  }

  get symbolList(): string[] {
    return this.getCache("symbolList", () => {
      return this.symbols.map((symbol) => symbol.symbol);
    });
  }
}
