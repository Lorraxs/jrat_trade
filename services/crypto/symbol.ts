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
import { IDiscordBotService } from "../discord/discordBot.service";
import { EmbedBuilder } from "discord.js";
import type { IOrderBlock } from "./types/luxAlgo.type";
import { IHttpService } from "../http/http.service";

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
  orderBlocks: IOrderBlock[] = [];
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
    try {
      const pushData: string[] = [];
      klines.forEach((kline) => {
        pushData.push(JSON.stringify(kline));
      });
      await this.redisService.client.del(this.name);
      await this.redisService.client.rpush(this.name, ...pushData);
      await this.watchKline();
      this.calcObs();
    } catch (error) {
      this.print.error(error);
    }
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
    this.orderBlocks = await this.obWorkersService.calcOb(this.name);
    if (this.orderBlocks.length === 0) return;
    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle(`Order Block: ${this.symbol} ${this.interval}`)
      .setTimestamp()
      .setDescription(
        `${this.orderBlocks
          .map((ob) => (ob.bias === 1 ? "🟢" : "🔴"))
          .join(" ")}`
      );
    this.orderBlocks.forEach((ob) => {
      embed.addFields(
        {
          name: "barTime",
          value: `\`\`\`${ob.barTime.toString()}\`\`\``,
        },
        {
          name: "barHigh",
          value: `\`\`\`${ob.barHigh.toString()}\`\`\``,
          inline: true,
        },
        {
          name: "barLow",
          value: `\`\`\`${ob.barLow.toString()}\`\`\``,
          inline: true,
        },
        {
          name: "bias",
          value: `\`\`\`${ob.bias.toString()}\`\`\``,
          inline: true,
        }
      );
    });
    this.httpService.publish({
      channel: "order_blocks",
      data: [
        {
          symbol: this.symbol,
          interval: this.interval,
          orderBlocks: this.orderBlocks,
        },
      ],
    });
    /* this.discordBotService.channels.LUX_ALGO_ORDER_BLOCKS?.send({
      embeds: [embed],
    }); */
  }
}
