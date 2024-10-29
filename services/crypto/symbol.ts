import { sleep } from "bun";
import { KlineModel } from "../../models/candle.model";
import { Logger } from "../../utils/logger";
import type { ExchangeProvider } from "./crypto.extensions";
import type { Binance } from "./types/binance.type";
import type { Interval } from "./types/type";

export class Symbol extends Logger {
  constructor(
    type: "binance",
    symbol: string,
    interval: Interval,
    private readonly exchangeProvider: ExchangeProvider
  ) {
    super();
    this.name = `Symbol: ${type}:${symbol} ${interval}`;
    this.symbol = symbol;
    this.type = type;
    this.interval = interval;
  }
  symbol: string;
  type: "binance";
  interval: Interval;
  klines: Binance.FormatedKline[] = [];

  async init() {
    this.print.info(
      `Init symbol ${this.symbol} with interval ${this.interval}`
    );
    this.klines = (
      await KlineModel.find({
        symbol: this.symbol,
        interval: this.interval,
      })
        .sort({ openTime: -1 })
        .limit(500)
    ).reverse();
    this.print.info(`Init with ${this.klines.length} klines`);
    await this.watchKline();
  }

  async watchKline() {
    this.print.info(
      `Watching kline for ${this.symbol} with interval ${this.interval}`
    );
    await sleep(200);
    const handler = await this.exchangeProvider.wsMarketStreamManager.subscribe(
      "<symbol>@kline_<interval>",
      {
        symbol: this.symbol,
        interval: this.interval,
      },
      async (kline) => {
        if (kline.k.x) {
          const newKline: Binance.FormatedKline = {
            symbol: this.symbol,
            interval: this.interval,
            openTime: kline.k.t,
            open: kline.k.o,
            high: kline.k.h,
            low: kline.k.l,
            close: kline.k.c,
            volume: kline.k.v,
            closeTime: kline.k.T,
            quoteAssetVolume: kline.k.q,
            numberOfTrades: kline.k.n,
            takerBuyBaseAssetVolume: kline.k.V,
            takerBuyQuoteAssetVolume: kline.k.Q,
            ignore: kline.k.B,
          };
          const createdKline = await KlineModel.create(newKline);
          this.klines.unshift(createdKline);
          this.print.infoBg(
            `New kline for ${createdKline.symbol} with interval ${createdKline.interval}`
          );
        }
      }
    );
  }
}
