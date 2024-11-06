import { sleep } from "bun";
import { KlineModel } from "../../models/candle.model";
import { Logger } from "../../utils/logger";
import type { ExchangeProvider } from "./crypto.extensions";
import type { Binance } from "./types/binance.type";
import type { IConditions, Interval, TradeSignal } from "./types/type";
import { inject, injectable } from "inversify";
import { IRedisService } from "../redis/redis.service";
import { container } from "../../utils/container";
import { IObWorkersService } from "./ob-workers.service";
import { IDiscordBotService } from "../discord/discordBot.service";
import { EmbedBuilder } from "discord.js";
import type { IOrderBlock } from "./types/luxAlgo.type";
import { IHttpService } from "../http/http.service";
import { calculateCurrentRSI } from "./utils/utils";
import { TradeSignalModel } from "../../models/tradeSignal.model";

@injectable()
export class Symbol extends Logger {
  private redisService: IRedisService;
  private obWorkersService: IObWorkersService;
  private discordBotService: IDiscordBotService;
  private httpService: IHttpService;
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
  orderBlocks: (IOrderBlock & { conditions: IConditions })[] = [];
  rsi: number = 0;
  lastKline: Binance.FormatedKline | null = null;

  private lastUpdateKline = Date.now();
  //klines: Binance.FormatedKline[] = [];

  async init() {
    this.redisService = container.get(IRedisService);
    this.obWorkersService = container.get(IObWorkersService);
    this.discordBotService = container.get(IDiscordBotService);
    this.httpService = container.get(IHttpService);
    this.print.info(
      `Init symbol ${this.symbol} with interval ${this.interval}`
    );
    const klines = (
      await KlineModel.find({
        symbol: this.symbol,
        interval: this.interval,
      })
        .sort({ openTime: -1 })
        .limit(500)
    ).reverse();
    this.print.info(`Init with ${klines.length} klines`);
    if (klines.length <= 0) {
      this.print.error("No klines found");
      return;
    }
    try {
      const pushData: string[] = [];
      klines.forEach((kline) => {
        pushData.push(JSON.stringify(kline));
      });
      this.lastKline = klines[0];
      await this.redisService.client.del(this.name);
      await this.redisService.client.rpush(this.name, ...pushData);
      await this.watchKline();
      await this.run();
    } catch (error) {
      this.print.error(error);
    }
  }

  private async run() {
    await this.calcRsi();
    this.calcObs();
  }

  async calcRsi() {
    const klines = await this.getKlines();
    //if (this.lastKline) klines.unshift(this.lastKline);
    this.rsi =
      calculateCurrentRSI(
        klines.map((k) => Number(k.close)),
        14
      ) || 0;
    this.httpService.publish<{ rsi: number }>({
      channel: `rsi_${this.symbol}_${this.interval}`,
      data: { rsi: this.rsi },
    });
  }

  async getKlines(): Promise<Binance.FormatedKline[]> {
    const data = await this.redisService.client.lrange(this.name, 0, -1);
    return data.map((d) => JSON.parse(d));
  }

  async getKlineAt(index: number): Promise<Binance.FormatedKline | null> {
    const data = await this.redisService.client.lindex(this.name, index);
    return data ? JSON.parse(data) : null;
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
        const newKline = {
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
          closed: kline.k.x,
        };
        const curTime = Date.now();
        if (curTime - this.lastUpdateKline > 1500) {
          this.lastUpdateKline = Date.now();
          this.lastKline = newKline;
          this.httpService.publish({
            channel: `kline_${this.symbol}_${this.interval}`,
            data: newKline,
          });
        }
        if (kline.k.x) {
          this.httpService.publish({
            channel: "new_kline",
            data: newKline,
          });
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
          await this.run();
        }
      }
    );
  }

  async calcObs() {
    const orderBlocks = await this.obWorkersService.calcOb(this.name);
    if (orderBlocks.length === 0) return;
    this.orderBlocks = [];
    for (const ob of orderBlocks) {
      const conditions = await this.calcConditions(ob);
      this.orderBlocks.push({ ...ob, conditions });
    }
    this.httpService.publish<{
      orderBlocks: (IOrderBlock & { conditions: IConditions })[];
      numConditions: number;
    }>({
      channel: `order_blocks_${this.symbol}_${this.interval}`,
      data: {
        orderBlocks: this.orderBlocks,
        numConditions: this.numConditions,
      },
    });
  }

  get numConditions(): number {
    let c = 0;
    for (const ob of this.orderBlocks) {
      if (ob.conditions[0]) c++;
      if (ob.conditions[1]) c += 2;
      if (ob.conditions[2]) c += 3;
      if (ob.conditions[3]) c += 4;
      if (ob.conditions[4]) c += 5;
    }
    return c;
  }

  async calcConditions(ob: IOrderBlock): Promise<IConditions> {
    const conditions: IConditions = [false, false, false, false, false];
    conditions[0] = this.condition1();
    if (conditions[0]) conditions[1] = await this.condition2(ob);
    if (conditions[1]) conditions[2] = await this.condition3(ob);
    if (conditions[2]) conditions[3] = await this.condition4();
    if (conditions[3]) conditions[4] = await this.condition5();
    this.httpService.publish<{
      conditions: [boolean, boolean, boolean, boolean, boolean];
    }>({
      channel: `condition_${this.symbol}_${this.interval}`,
      data: {
        conditions: conditions,
      },
    });
    if (!conditions.includes(false)) {
      this.sendTradeSignal(ob);
    }
    return conditions;
  }

  async hasTradeSignal(hash: string): Promise<boolean> {
    try {
      const data = await TradeSignalModel.findOne({
        hash: hash,
      });
      if (data) return true;
    } catch (error) {
      return false;
    }
    return false;
  }

  async sendTradeSignal(ob: IOrderBlock) {
    const hash = `${this.symbol}_${this.interval}_${ob.barHigh}_${ob.barLow}_${ob.barTime}_${ob.bias}`;
    if (await this.hasTradeSignal(hash)) return;
    const signal: TradeSignal = {
      hash,
      symbol: this.symbol,
      interval: this.interval,
      bias: ob.bias,
      barHigh: ob.barHigh,
      barLow: ob.barLow,
      barTime: ob.barTime,
    };
    await TradeSignalModel.create(signal);
    const embed = new EmbedBuilder()
      .setTitle(`Trade Signal`)
      .setDescription(
        `Symbol: ${this.symbol}\nInterval: ${this.interval}\nBias: ${
          ob.bias === 1 ? "BULLISH" : "BEARISH"
        }\nOB: ${ob.barHigh} - ${ob.barLow}`
      )
      .setColor(ob.bias === 1 ? "#75f542" : "#ff1434")
      .setTimestamp();
    this.httpService.publish<TradeSignal>({
      channel: `trade_signal_${this.symbol}_${this.interval}`,
      data: signal,
    });
    await this.discordBotService.channels.LUX_ALGO_ORDER_BLOCKS?.send({
      embeds: [embed],
    });
  }

  //Kiểm tra xem RSI có lớn hơn 50 không
  condition1(): boolean {
    return this.rsi > 50;
  }

  //Nếu OB là BULLISH kiểm tra xem giá hiện tại có thấp hơn giá thấp nhất của OB không
  // Nếu OB là BEARISH kiểm tra xem giá hiện tại có cao hơn giá cao nhất của OB không
  async condition2(ob: IOrderBlock): Promise<boolean> {
    const lastKline = this.lastKline;
    if (!lastKline) return false;
    if (ob.bias === 1) {
      if (Number(lastKline.close) > ob.barHigh) return true;
    } else {
      if (Number(lastKline.close) < ob.barLow) return true;
    }
    return false;
  }

  //Kiểm tra xem nến có phải là màu xanh không
  condition3(ob: IOrderBlock): boolean {
    const lastKline = this.lastKline;
    if (!lastKline) return false;
    if (lastKline.close > lastKline.open) return true;
    return false;
  }

  //Kiểm tra 1 nến trước đó có phải là màu xanh không
  async condition4(): Promise<boolean> {
    const kline = await this.getKlineAt(1);
    if (!kline) return false;
    if (kline.close > kline.open) return true;
    return false;
  }

  //Kiểm tra 2 nến trước đó có phải là màu đỏ không
  async condition5(): Promise<boolean> {
    const kline = await this.getKlineAt(2);
    if (!kline) return false;
    if (kline.close < kline.open) return true;
    return false;
  }
}
