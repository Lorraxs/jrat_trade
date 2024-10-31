import { sleep } from "bun";
import { KlineModel } from "../../models/candle.model";
import { Logger } from "../../utils/logger";
import type { ExchangeProvider } from "./crypto.extensions";
import type { Binance } from "./types/binance.type";
import type { Interval } from "./types/type";
import { inject, injectable } from "inversify";
import { IRedisService } from "../redis/redis.service";
import { container } from "../../utils/container";
import { IObWorkersService } from "./ob-workers.service";

@injectable()
export class Symbol extends Logger {
  private redisService: IRedisService;
  private obWorkersService: IObWorkersService;
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
  //klines: Binance.FormatedKline[] = [];

  async init() {
    this.redisService = container.get(IRedisService);
    this.obWorkersService = container.get(IObWorkersService);
    this.print.info(
      `Init symbol ${this.symbol} with interval ${this.interval}`
    );
    const klines = (
      await KlineModel.find({
        symbol: this.symbol,
        interval: this.interval,
      })
        .sort({ openTime: -1 })
        .limit(1000)
    ).reverse();
    this.print.info(`Init with ${klines.length} klines`);
    const pushData: string[] = [];
    klines.forEach((kline) => {
      pushData.push(JSON.stringify(kline));
    });
    await this.redisService.client.del(this.name);
    await this.redisService.client.rpush(this.name, ...pushData);
    await this.watchKline();
    await this.calcObs();
  }

  async getKlines(): Promise<Binance.FormatedKline[]> {
    const data = await this.redisService.client.lrange(this.name, 0, -1);
    return data.map((d) => JSON.parse(d));
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
          const beforeLength = await this.redisService.client.llen(this.name);
          await this.redisService.client.lpush(
            this.name,
            JSON.stringify(createdKline)
          );
          const afterLength = await this.redisService.client.llen(this.name);

          this.print.infoBg(
            `New kline for ${createdKline.symbol} with interval ${createdKline.interval} before: ${beforeLength} after: ${afterLength}`
          );
          await this.calcObs();
        }
      }
    );
  }

  async calcObs() {
    /* const klines = await this.getKlines();
    const convertedData: {
      high: number[];
      low: number[];
      close: number[];
      open: number[];
    } = { high: [], low: [], close: [], open: [] };
    for (const candle of klines) {
      convertedData.high.push(Number(candle.high));
      convertedData.low.push(Number(candle.low));
      convertedData.close.push(Number(candle.close));
      convertedData.open.push(Number(candle.open));
    }
    const obWorker = new Worker(new URL("./getob-worker.ts", import.meta.url));
    obWorker.postMessage({
      event: "start",
      data: convertedData,
    });
    obWorker.onmessage = (e: MessageEvent) => {
      const { event, data } = e.data;
      if (event === "done") {
        console.log(this.name, data);
        obWorker.terminate();
      }
    }; */
    return this.obWorkersService.calcOb(this.name);
  }
}
