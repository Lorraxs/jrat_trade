declare var self: Worker;
import Redis from "ioredis";
import type { IObWorkerMessage } from "./types/obWorker.type";
import type { Binance } from "./types/binance.type";
import { Series } from "./utils/series";
import { change, crossover, crossunder, highest, lowest } from "./utils/utils";
import type { Pivot } from "./utils/pivot";
import { Alerts } from "./utils/alerts";
import { calculateATR } from "./utils/atr";
import { type ITrailingExtremes, type IOrderBlock } from "./types/luxAlgo.type";

// Constants & Inputs
const BULLISH_LEG = 1;
const BEARISH_LEG = 0;

const BULLISH = +1;
const BEARISH = -1;

const HISTORICAL = "Historical";
const PRESENT = "Present";

const COLORED = "Colored";
const MONOCHROME = "Monochrome";

const ALL = "All";
const BOS = "BOS";
const CHOCH = "CHoCH";

const TINY = "tiny";
const SMALL = "small";
const NORMAL = "normal";

const ATR = "Atr";
const RANGE = "Cumulative Mean Range";

const CLOSE = "Close";
const HIGHLOW = "High/Low";

declare var self: Worker;

class Var<T> {
  data: T[] = [];

  set(barIndex: number, value: T) {
    this.data[barIndex] = value;
  }

  get(barIndex?: number) {
    if (barIndex) {
      return this.data[barIndex];
    }
    return this.data[this.data.length - 1];
  }
}

type orderBlock = {
  barHigh: number;
  barLow: number;
  barTime: number;
  bias: number; //BULLISH or BEARISH
};

interface Trend {
  bias: number;
}

class LuxAlgo {
  constructor() {}
  redisClient = new Redis({
    password: process.env.REDIS_PASSWORD || ""
  });
  cache = new Map<string, Series>();

  high = new Series<number>();
  low = new Series<number>();
  close = new Series<number>();
  open = new Series<number>();
  bar_index = new Series<number>();
  openTime = new Series<number>();

  //config
  internalFilterConfluenceInput = false;
  showInternalsInput = true;
  showInternalBullInput = ALL;
  showStructureInput = true;
  showSwingBullInput = ALL;
  showInternalOrderBlocksInput = true;
  showSwingOrderBlocksInput = false;
  showInternalBearInput = ALL;
  showSwingBearInput = ALL;
  swingsLengthInput = 50;
  equalHighsLowsLengthInput = 3;
  equalHighsLowsThresholdInput = 0.1;
  orderBlockFilterInput = "Atr";
  orderBlockMitigationInput = HIGHLOW;
  internalOrderBlocksSizeInput = 5;
  swingOrderBlocksSizeInput = 5;

  currentAlerts: Alerts = new Alerts();

  internalOrderBlocks: orderBlock[] = [];
  internalHigh = new Series<Pivot>();
  internalLow = new Series<Pivot>();
  equalHigh = new Series<Pivot>();
  equalLow = new Series<Pivot>();
  swingHigh = new Series<Pivot>();
  swingLow = new Series<Pivot>();

  parsedHighs: number[] = [];
  parsedLows: number[] = [];
  highs: number[] = [];
  lows: number[] = [];
  times: number[] = [];
  trailing: ITrailingExtremes = {
    top: NaN,
    bottom: NaN,
    barTime: NaN,
    barIndex: NaN,
    lastTopTime: NaN,
    lastBottomTime: NaN,
  };

  internalTrend = new Series<Trend>();
  swingTrend = new Series<Trend>();
  swingOrderBlocks: orderBlock[] = [];
  atrMeasure = new Series<number>();

  async run(key: string) {
    const rawData = await this.redisClient.lrange(key, 0, -1);
    const klines = rawData.map((d) => JSON.parse(d) as Binance.FormatedKline);
    const convertedData: {
      high: number[];
      low: number[];
      close: number[];
      open: number[];
      openTime: number[];
    } = { high: [], low: [], close: [], open: [], openTime: [] };

    for (const candle of klines) {
      convertedData.high.push(Number(candle.high));
      convertedData.low.push(Number(candle.low));
      convertedData.close.push(Number(candle.close));
      convertedData.open.push(Number(candle.open));
      convertedData.openTime.push(Number(candle.openTime));
    }

    for (let i = 0; i < klines.length; i++) {
      const kline = klines[i];
      this.high.add(Number(kline.high));
      this.low.add(Number(kline.low));
      this.open.add(Number(kline.open));
      this.close.add(Number(kline.close));
      this.openTime.add(Number(kline.openTime));
      this.bar_index.add(i);
      if (i === 0) {
        this.internalHigh.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.swingHigh.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.internalHigh.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.internalLow.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.equalHigh.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.equalLow.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.swingHigh.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.swingLow.add({
          currentLevel: NaN,
          lastLevel: NaN,
          crossed: false,
          barIndex: i,
          barTime: convertedData.openTime[i],
        });
        this.internalTrend.add({
          bias: 0,
        });
        this.swingTrend.add({
          bias: 0,
        });
      } else {
        this.internalHigh.next();
        this.internalLow.next();
        this.equalHigh.next();
        this.equalLow.next();
        this.swingHigh.next();
        this.swingLow.next();
      }
      this.calcAtr();
      const volatilityMeasure = this.atrMeasure.current();
      const highVolatilityBar =
        this.high.current() - this.low.current() >= 2 * volatilityMeasure;
      const parsedHigh = highVolatilityBar
        ? this.low.current()
        : this.high.current();
      const parsedLow = highVolatilityBar
        ? this.high.current()
        : this.low.current();
      this.parsedHighs.push(parsedHigh);
      this.parsedLows.push(parsedLow);
      this.highs.push(this.high.current());
      this.lows.push(this.low.current());
      this.times.push(this.openTime.current());
      this.frame();
    }
    return this.drawOrderBlocks(true);
  }

  private calcAtr() {
    try {
      const atr = calculateATR(
        this.high.data,
        this.low.data,
        this.close.data,
        200
      );
      this.atrMeasure.add(atr);
    } catch (error) {}
  }

  private frame() {
    try {
      //this.displayStructure();
      this.getCurrentStructure(this.swingsLengthInput, false, false);
      this.getCurrentStructure(5, false, true);
      this.displayStructure(true);
      this.deleteOrderBlocks(true);
    } catch (error) {
      //console.error(error);
    }
  }

  private getCache<T>(key: string, initialValue: T) {
    const cacheStore = this.cache.get(key);
    if (cacheStore) {
      return cacheStore as Series<T>;
    } else {
      const newCache = new Series<T>([initialValue]);
      this.cache.set(key, newCache);
      return newCache;
    }
  }

  private leg(size: number) {
    let legCache = this.getCache<number>(`func:leg:${size}`, 0);
    let leg = legCache.current();
    const newLegHigh = this.high.at(size) > highest(this.high.data, size);
    const newLegLow = this.low.at(size) < lowest(this.low.data, size);
    if (newLegHigh) {
      leg = BEARISH_LEG;
    } else if (newLegLow) {
      leg = BULLISH_LEG;
    }
    legCache.add(leg);
    return legCache;
  }

  private startOfNewLeg(leg: Series<number>) {
    return change(leg.data) !== 0;
  }

  private startOfBearishLeg(leg: Series<number>) {
    return change(leg.data) === -1;
  }

  private startOfBullishLeg(leg: Series<number>) {
    return change(leg.data) === 1;
  }

  private log(...args: any[]) {
    console.log(this.open.current(), ...args);
  }

  private getCurrentStructure(
    size: number,
    equalHighLow: boolean,
    internal: boolean
  ) {
    const currentLeg = this.leg(size);
    const newPivot = this.startOfNewLeg(currentLeg);
    const pivotLow = this.startOfBullishLeg(currentLeg);
    const pivotHigh = this.startOfBearishLeg(currentLeg);
    //this.log(currentLeg.current(), newPivot, pivotLow, pivotHigh);
    if (newPivot) {
      if (pivotLow) {
        const p_ivot = equalHighLow
          ? this.equalLow
          : internal
          ? this.internalLow
          : this.swingLow;
        if (
          equalHighLow &&
          Math.abs(p_ivot.current().currentLevel - this.low.at(size)) <
            this.equalHighsLowsThresholdInput * this.atrMeasure.current()
        ) {
          console.log(this.open.current(), "drawEqualHighLow");
        }
        p_ivot.current().lastLevel = p_ivot.current().currentLevel;
        p_ivot.current().currentLevel = this.low.at(size);
        p_ivot.current().crossed = false;
        p_ivot.current().barTime = this.openTime.at(size);
        p_ivot.current().barIndex = this.bar_index.at(size);
        /* console.log(
          this.open.current(),
          1,
          p_ivot.current().lastLevel,
          p_ivot.current().currentLevel,
          p_ivot.current().crossed,
          p_ivot.current().barTime,
          p_ivot.current().barIndex
        ); */
        if (!equalHighLow && !internal) {
          this.trailing.bottom = p_ivot.current().currentLevel;
          this.trailing.barTime = p_ivot.current().barTime;
          this.trailing.barIndex = p_ivot.current().barIndex;
          this.trailing.lastBottomTime = p_ivot.current().barTime;
        }
      } else {
        const p_ivot = equalHighLow
          ? this.equalHigh
          : internal
          ? this.internalHigh
          : this.swingHigh;
        if (
          equalHighLow &&
          Math.abs(p_ivot.current().currentLevel - this.high.at(size)) <
            this.equalHighsLowsThresholdInput * this.atrMeasure.current()
        ) {
          console.log(this.open.current(), "drawEqualHighLow");
        }
        p_ivot.current().lastLevel = p_ivot.current().currentLevel;
        p_ivot.current().currentLevel = this.high.at(size);
        p_ivot.current().crossed = false;
        p_ivot.current().barTime = this.openTime.at(size);
        p_ivot.current().barIndex = this.bar_index.at(size);
        /* console.log(
          this.open.current(),
          2,
          p_ivot.current().lastLevel,
          p_ivot.current().currentLevel,
          p_ivot.current().crossed,
          p_ivot.current().barTime,
          p_ivot.current().barIndex
        ); */
        if (!equalHighLow && !internal) {
          this.trailing.bottom = p_ivot.current().currentLevel;
          this.trailing.barTime = p_ivot.current().barTime;
          this.trailing.barIndex = p_ivot.current().barIndex;
          this.trailing.lastBottomTime = p_ivot.current().barTime;
        }
      }
    }
  }

  private displayStructure(internal: boolean = false) {
    let bullishBar = true;
    let bearishBar = true;

    const high = this.high.current();
    const close = this.close.current();
    const open = this.open.current();
    const low = this.low.current();
    const bar_index = this.bar_index.current();

    const internalHigh = this.internalHigh.current();
    const swingHigh = this.swingHigh.current();
    const internalTrend = this.internalTrend.current();
    const swingTrend = this.swingTrend.current();

    if (this.internalFilterConfluenceInput) {
      bullishBar = high - Math.max(close, open) > Math.min(close, open - low);
      bearishBar = high - Math.max(close, open) < Math.min(close, open - low);
    }

    let p_ivot: Series<Pivot> = internal ? this.internalHigh : this.swingHigh;
    let t_rend: Series<Trend> = internal ? this.internalTrend : this.swingTrend;
    /* console.log(
      this.bar_index.current(),
      this.close.current(),
      high,
      p_ivot.current().currentLevel,
      t_rend.current().bias
    ); */

    let lineStyle = internal ? "dashed" : "solid";

    let extraCondition = internal
      ? internalHigh.currentLevel !== swingHigh.currentLevel && bullishBar
      : true;
    //this.log(extraCondition);
    if (
      crossover(
        this.close.data,
        p_ivot.data.map((p) => p.currentLevel)
      ) &&
      !p_ivot.current().crossed &&
      extraCondition
    ) {
      let tag = t_rend.current().bias === BEARISH ? CHOCH : BOS;

      if (internal) {
        this.currentAlerts.internalBullishCHoCH = tag === CHOCH;
        this.currentAlerts.internalBullishBOS = tag === BOS;
      } else {
        this.currentAlerts.swingBullishCHoCH = tag === CHOCH;
        this.currentAlerts.swingBullishBOS = tag === BOS;
      }

      p_ivot.current().crossed = true;
      t_rend.current().bias = BULLISH;

      let displayCondition = internal
        ? this.showInternalsInput &&
          (this.showInternalBullInput === "ALL" ||
            (this.showInternalBullInput === "BOS" && tag !== CHOCH) ||
            (this.showInternalBullInput === "CHOCH" && tag === CHOCH))
        : this.showStructureInput &&
          (this.showSwingBullInput === "ALL" ||
            (this.showSwingBullInput === "BOS" && tag !== CHOCH) ||
            (this.showSwingBullInput === "CHOCH" && tag === CHOCH));

      if (displayCondition) {
        //drawStructure(p_ivot, tag);
        this.log("displayCondition", p_ivot.current(), tag);
      }

      if (
        (internal && this.showInternalOrderBlocksInput) ||
        (!internal && this.showSwingOrderBlocksInput)
      ) {
        //this.log("storeOrderBlock", p_ivot.current(), internal, BULLISH);
        this.storeOrderBlock(p_ivot, internal, BULLISH);
      }
    }

    p_ivot = internal ? this.internalLow : this.swingLow;
    extraCondition = internal
      ? this.internalLow.current().currentLevel !==
          this.swingLow.current().currentLevel && bearishBar
      : true;

    if (
      crossunder(
        this.close.data,
        p_ivot.data.map((p) => p.currentLevel)
      ) &&
      !p_ivot.current().crossed &&
      extraCondition
    ) {
      let tag = t_rend.current().bias === BULLISH ? CHOCH : BOS;

      if (internal) {
        this.currentAlerts.internalBearishCHoCH = tag === CHOCH;
        this.currentAlerts.internalBearishBOS = tag === BOS;
      } else {
        this.currentAlerts.swingBearishCHoCH = tag === CHOCH;
        this.currentAlerts.swingBearishBOS = tag === BOS;
      }

      p_ivot.current().crossed = true;
      t_rend.current().bias = BEARISH;

      let displayCondition = internal
        ? this.showInternalsInput &&
          (this.showInternalBearInput === "ALL" ||
            (this.showInternalBearInput === "BOS" && tag !== CHOCH) ||
            (this.showInternalBearInput === "CHOCH" && tag === CHOCH))
        : this.showStructureInput &&
          (this.showSwingBearInput === "ALL" ||
            (this.showSwingBearInput === "BOS" && tag !== CHOCH) ||
            (this.showSwingBearInput === "CHOCH" && tag === CHOCH));

      if (displayCondition) {
        this.log(
          "displayCondition",
          p_ivot.current(),
          tag,
          lineStyle,
          "label_up"
        );
      }

      if (
        (internal && this.showInternalOrderBlocksInput) ||
        (!internal && this.showSwingOrderBlocksInput)
      ) {
        //storeOrderBlock(p_ivot, internal, BEARISH);
        //this.log("storeOrderBlock", p_ivot.current(), internal, BEARISH);
        this.storeOrderBlock(p_ivot, internal, BEARISH);
      }
    }
  }

  storeOrderBlock(p_ivot: Series<Pivot>, internal: boolean, bias: number) {
    /* this.log(
      p_ivot.current().currentLevel,
      p_ivot.current().lastLevel,
      p_ivot.current().crossed,
      p_ivot.current().barIndex,
      p_ivot.current().barTime,
      bias
    ); */
    if (
      (!internal && this.showSwingOrderBlocksInput) ||
      (internal && this.showInternalOrderBlocksInput)
    ) {
      let a_rray: number[] = [];
      let parsedIndex: number = NaN;
      if (bias === BEARISH) {
        a_rray = this.parsedHighs.slice(
          p_ivot.current().barIndex,
          this.bar_index.current()
        );
        parsedIndex =
          p_ivot.current().barIndex + a_rray.indexOf(Math.max(...a_rray));
      } else {
        a_rray = this.parsedLows.slice(
          p_ivot.current().barIndex,
          this.bar_index.current()
        );
        parsedIndex =
          p_ivot.current().barIndex + a_rray.indexOf(Math.min(...a_rray));
      }
      const o_rderBlock: IOrderBlock = {
        barHigh: this.parsedHighs[parsedIndex],
        barLow: this.parsedLows[parsedIndex],
        barTime: this.times[parsedIndex],
        bias: bias,
      };
      /* this.log(
        o_rderBlock.barHigh,
        o_rderBlock.barLow,
        o_rderBlock.barTime,
        o_rderBlock.bias
      ); */
      const orderBlocks = internal
        ? this.internalOrderBlocks
        : this.swingOrderBlocks;
      if (orderBlocks.length >= 100) {
        orderBlocks.pop();
      }
      orderBlocks.unshift(o_rderBlock);
      //this.log(internal, orderBlocks.length);
    }
  }

  private deleteOrderBlocks(internal = false) {
    const bearishOrderBlockMitigationSource =
      this.orderBlockMitigationInput === CLOSE
        ? this.close.current()
        : this.high.current();
    const bullishOrderBlockMitigationSource =
      this.orderBlockMitigationInput === CLOSE
        ? this.close.current()
        : this.low.current();
    const orderBlocks = internal
      ? this.internalOrderBlocks
      : this.swingOrderBlocks;
    for (let i = 0; i < [...orderBlocks].length; i++) {
      const eachOrderBlock = orderBlocks[i];
      let crossedOderBlock = false;
      if (
        bearishOrderBlockMitigationSource > eachOrderBlock.barHigh &&
        eachOrderBlock.bias === BEARISH
      ) {
        crossedOderBlock = true;
        if (internal) {
          this.currentAlerts.internalBearishOrderBlock = true;
        } else {
          this.currentAlerts.swingBearishOrderBlock = true;
        }
      } else if (
        bullishOrderBlockMitigationSource < eachOrderBlock.barLow &&
        eachOrderBlock.bias === BULLISH
      ) {
        crossedOderBlock = true;
        if (internal) {
          this.currentAlerts.internalBullishOrderBlock = true;
        } else {
          this.currentAlerts.swingBullishOrderBlock = true;
        }
      }
      if (crossedOderBlock) {
        orderBlocks.splice(i, 1);
      }
    }
  }

  private drawOrderBlocks(internal = false) {
    const orderBlocks = internal
      ? this.internalOrderBlocks
      : this.swingOrderBlocks;
    const orderBlocksSize = orderBlocks.length;
    const OBs: IOrderBlock[] = [];
    if (orderBlocksSize > 0) {
      const maxOrderBlocks = internal
        ? this.internalOrderBlocksSizeInput
        : this.swingOrderBlocksSizeInput;
      const parsedOrdeBlocks = orderBlocks.slice(
        0,
        Math.min(maxOrderBlocks, orderBlocksSize)
      );
      for (let i = 0; i <= parsedOrdeBlocks.length - 1; i++) {
        const eachOrderBlock = parsedOrdeBlocks[i];
        /* this.log(
          eachOrderBlock.barTime,
          eachOrderBlock.barHigh,
          eachOrderBlock.barLow,
          eachOrderBlock.bias
        ); */
        OBs.push(eachOrderBlock);
      }
    }
    return OBs;
  }
}

self.onmessage = async (e: MessageEvent<IObWorkerMessage>) => {
  //console.log(e.data);
  switch (e.data.event) {
    case "start":
      const instance = new LuxAlgo();
      const result = await instance.run(e.data.data);
      /* console.log(result); */
      postMessage({
        event: "done",
        data: result,
      });
      break;
    default:
      break;
  }
};

function drawStructure(p_ivot: Series<Pivot>, tag: string) {
  const currentPivot = p_ivot.current();
  if (!currentPivot) return;

  const structure = {
    level: currentPivot.currentLevel,
    tag: tag,
  };

  // Assuming there's a method to store or display the structure
  // This is a placeholder for the actual implementation
  console.log("Drawing structure:", structure);
}
