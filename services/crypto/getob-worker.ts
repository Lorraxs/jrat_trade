import { Table } from "console-table-printer";
import { Box } from "./types/type";
import type { IObWorkerMessage } from "./types/obWorker.type";
import Redis from "ioredis";
import type { Binance } from "./types/binance.type";

// prevents TS errors
declare var self: Worker;

function calculateCurrentRSI(prices: number[], period: number): number | null {
  if (prices.length < period + 1) {
    // Không đủ dữ liệu để tính RSI
    return null;
  }

  let gainSum = 0;
  let lossSum = 0;

  // Tính tổng lợi nhuận và tổn thất trong chu kỳ
  for (let i = prices.length - period; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference > 0) {
      gainSum += difference;
    } else {
      lossSum += -difference;
    }
  }

  // Tính mức tăng và giảm trung bình
  const averageGain = gainSum / period;
  const averageLoss = lossSum / period;

  if (averageLoss === 0) {
    return 100; // RSI sẽ là 100 nếu không có tổn thất trong chu kỳ
  }

  // Tính RS và RSI
  const rs = averageGain / averageLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}

interface Settings {
  zigzagLen: number;
  showZigzag: boolean;
  fibFactor: number;
  textSize: string;
  deleteBoxes: boolean;
  colors: {
    buOb: {
      color: string;
      borderColor: string;
      textColor: string;
    };
    beOb: {
      color: string;
      borderColor: string;
      textColor: string;
    };
    buBb: {
      color: string;
      borderColor: string;
      textColor: string;
    };
    beBb: {
      color: string;
      borderColor: string;
      textColor: string;
    };
  };
}

type IDataSet = {
  high: number;
  low: number;
  close: number;
  open: number;
  index: number;
};

const settings: Settings = {
  zigzagLen: 9,
  showZigzag: true,
  fibFactor: 0.33,
  textSize: "tiny",
  deleteBoxes: true,
  colors: {
    buOb: {
      color: "rgba(0, 128, 0, 0.7)",
      borderColor: "green",
      textColor: "green",
    },
    beOb: {
      color: "rgba(255, 0, 0, 0.7)",
      borderColor: "red",
      textColor: "red",
    },
    buBb: {
      color: "rgba(0, 128, 0, 0.7)",
      borderColor: "green",
      textColor: "green",
    },
    beBb: {
      color: "rgba(255, 0, 0, 0.7)",
      borderColor: "red",
      textColor: "red",
    },
  },
};

class DataSet {
  data: IDataSet[] = [];

  constructor(data: IDataSet[]) {
    this.data = data;
  }

  log() {
    const p = new Table();
    for (const d of this.data) {
      p.addRow({
        index: d.index,
        high: d.high,
        low: d.low,
        close: d.close,
        open: d.open,
      });
    }
    p.printTable();
  }

  getString() {
    const p = new Table();
    for (const d of this.data) {
      p.addRow({
        index: d.index,
        high: d.high,
        low: d.low,
        close: d.close,
        open: d.open,
      });
    }
    return p.render();
  }

  isSmallestCandle(candle: { close: number; open: number }) {
    for (const d of this.data) {
      const dSize = Math.abs(d.close - d.open);
      const candleSize = Math.abs(candle.close - candle.open);
      if (dSize < candleSize) {
        return false;
      }
    }
    return true;
  }
}

const nz = (value: any, defaultValue: any) => {
  return value === undefined ? defaultValue : value;
};

class OB {
  highPointsArr: number[] = [];
  highIndexArr: number[] = [];
  lowPointsArr: number[] = [];
  lowIndexArr: number[] = [];

  buObBoxes: any[] = [];
  beObBoxes: any[] = [];
  buBbBoxes: any[] = [];
  beBbBoxes: any[] = [];

  to_ups: boolean[] = [];
  to_downs: boolean[] = [];
  trends: number[] = [];
  last_trend_up_sinces: number[] = [];
  last_trend_down_sinces: number[] = [];
  low_vals: number[] = [];
  low_indexes: number[] = [];
  high_vals: number[] = [];
  high_indexes: number[] = [];
  low_points_arr: number[] = [];
  low_index_arr: number[] = [];
  high_points_arr: number[] = [];
  high_index_arr: number[] = [];
  h0s: number[] = [];
  h0is: number[] = [];
  h1s: number[] = [];
  h1is: number[] = [];
  l0s: number[] = [];
  l0is: number[] = [];
  l1s: number[] = [];
  l1is: number[] = [];
  last_l0s: number[] = [];
  last_h0s: number[] = [];
  markets: number[] = [];
  bu_ob_indexs: number[] = [];
  bu_ob_sinces: number[] = [];
  be_ob_indexs: number[] = [];
  be_ob_sinces: number[] = [];
  be_bb_indexs: number[] = [];
  be_bb_sinces: number[] = [];
  bu_bb_indexs: number[] = [];
  bu_bb_sinces: number[] = [];

  bu_ob_boxes: Set<Box> = new Set();
  bu_bb_boxes: Set<Box> = new Set();
  be_ob_boxes: Set<Box> = new Set();
  be_bb_boxes: Set<Box> = new Set();

  frames: { high: number; low: number; close: number; open: number }[] = [];

  trend = 1;
  market = 1;

  idle = true;
  redisClient = new Redis({
    password: process.env.REDIS_PASSWORD || ""
  });

  constructor(
    private data: {
      high: number[];
      low: number[];
      close: number[];
      open: number[];
    }
  ) {}

  async run(key: string) {
    const rawData = await this.redisClient.lrange(key, 0, -1);
    const klines = rawData.map((d) => JSON.parse(d) as Binance.FormatedKline);
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
    this.data = convertedData;
    this.mainLoop();
    this.data = {
      high: [],
      low: [],
      close: [],
      open: [],
    };
    return {
      bu_ob_boxes: Array.from(this.bu_ob_boxes),
      bu_bb_boxes: Array.from(this.bu_bb_boxes),
      be_ob_boxes: Array.from(this.be_ob_boxes),
      be_bb_boxes: Array.from(this.be_bb_boxes),
    };
  }

  barssince = (condition: boolean[]) => {
    for (let i = 0; i < condition.length; i++) {
      if (condition[i]) {
        return i;
      }
    }
    return -1;
  };
  lowest = (data: number[], length: number) => {
    return Math.min(...data.slice(-length));
  };
  highest = (data: number[], length: number) => {
    return Math.max(...data.slice(-length));
  };
  change = (data: number[], length: number) => {
    return data[data.length - 1] - data[data.length - 1 - length];
  };
  valuewhen = <T>(condition: boolean[], data: T[], occurrence: number) => {
    let c = 0;
    for (let i = 0; i < condition.length; i++) {
      if (condition[i]) {
        if (c === occurrence) {
          return data[i];
        }
        c++;
      }
    }
    return NaN;
  };

  getHighest(index: number, length: number): number {
    // Implement the logic to get the highest value in the range
    return Math.max(...this.data.high.slice(index + 1 - length, index + 1));
  }

  getLowest(index: number, length: number): number {
    // Implement the logic to get the lowest value in the range
    return Math.min(...this.data.low.slice(index + 1 - length, index + 1));
  }

  calcToUpToDown(index: number): { toUp: boolean; toDown: boolean } {
    const toUp =
      this.data.high[index] >= this.getHighest(index, settings.zigzagLen);
    const toDown =
      this.data.low[index] <= this.getLowest(index, settings.zigzagLen);
    this.trend =
      this.trend === 1 && toDown
        ? -1
        : this.trend === -1 && toUp
        ? 1
        : this.trend;
    return { toUp, toDown };
  }
  calcTrend(index: number): number {
    let trend = 1;
    const lastBarTrend =
      index > settings.zigzagLen ? this.calcTrend(index - 1) : 1;
    const { toUp, toDown } = this.calcToUpToDown(index);
    trend =
      lastBarTrend === 1 && toDown
        ? -1
        : lastBarTrend === -1 && toUp
        ? 1
        : lastBarTrend;
    return trend;
  }

  calcLastTrendUpSince(index: number): number {
    let c = 0;
    for (let i = index - 1; i >= 0; i--) {
      const { toUp } = this.calcToUpToDown(i);
      if (toUp) {
        return c;
      } else {
        c++;
      }
    }
    return c;
  }

  calcLastTrendDownSince(index: number): number {
    let c = 0;
    for (let i = index - 1; i >= 0; i--) {
      const { toDown } = this.calcToUpToDown(i);
      if (toDown) {
        return c;
      } else {
        c++;
      }
    }
    return c;
  }

  calcBarSinceLow(index: number, low: number): number {
    let c = 0;
    for (let i = index; i >= 0; i--) {
      if (this.data.low[i] === low) {
        return c;
      } else {
        c++;
      }
    }
    return c;
  }

  calcBarSinceHigh(index: number, high: number): number {
    let c = 0;
    for (let i = index; i >= 0; i--) {
      if (this.data.high[i] === high) {
        return c;
      } else {
        c++;
      }
    }
    return c;
  }

  calculateMarket(index: number): number {
    let market = 1;
    market = index > 0 ? this.calculateMarket(index - 1) : 1;
    const lastMarket = index > 0 ? this.calculateMarket(index - 1) : 1;
    const marketChange = market - lastMarket;

    return market;
  }

  mainLoop(): void {
    for (
      let index = settings.zigzagLen;
      index < this.data.high.length;
      index++
    ) {
      this.execute(index);
      /* console.log(
        index,
        this.data.high[index],
        this.to_ups[index],
        this.to_downs[index],
        this.trends[index],
        this.last_trend_up_sinces[index],
        this.last_trend_down_sinces[index],
        this.low_vals[index],
        this.low_indexes[index],
        this.high_vals[index],
        this.high_indexes[index],
        this.change(this.trends.slice(0, index + 1), 1),
        this.h0s[index],
        this.h0is[index],
        this.l0s[index],
        this.l0is[index],
        this.bu_ob_indexs[index],
        this.bu_ob_sinces[index],
        this.be_ob_indexs[index],
        this.be_ob_sinces[index],
        this.be_bb_indexs[index],
        this.be_bb_sinces[index],
        this.bu_bb_indexs[index],
        this.bu_bb_sinces[index],
        this.bu_ob_boxes.size,
        this.bu_bb_boxes.size,
        this.be_ob_boxes.size,
        this.be_bb_boxes.size
      ); */
    }
  }

  f_get_high(ind: 0 | 1) {
    return [
      this.high_points_arr[this.high_points_arr.length - 1 - ind],
      this.high_index_arr[this.high_index_arr.length - 1 - ind],
    ];
  }

  f_get_low(ind: 0 | 1) {
    return [
      this.low_points_arr[this.low_points_arr.length - 1 - ind],
      this.low_index_arr[this.low_index_arr.length - 1 - ind],
    ];
  }

  execute(index: number): void {
    const _to_up =
      this.data.high[index] >= this.getHighest(index, settings.zigzagLen);
    this.to_ups[index] = _to_up;

    const _to_down =
      this.data.low[index] <= this.getLowest(index, settings.zigzagLen);
    this.to_downs[index] = _to_down;

    let trend = 1;
    trend = nz(this.trends[index - 1], 1);
    trend = trend === 1 && _to_down ? -1 : trend === -1 && _to_up ? 1 : trend;
    this.trends[index] = trend;

    const last_trend_up_since = this.barssince(
      this.to_ups.slice(0, index).reverse()
    );
    this.last_trend_up_sinces[index] = last_trend_up_since;

    const last_trend_down_since = this.barssince(
      this.to_downs.slice(0, index).reverse()
    );
    this.last_trend_down_sinces[index] = last_trend_down_since;

    const low_val = this.lowest(
      this.data.low.slice(0, index + 1),
      nz(last_trend_up_since > 0 ? last_trend_up_since : 1, 1)
    );
    this.low_vals[index] = low_val;

    const low_index =
      index -
      this.barssince(
        this.data.low
          .slice(0, index + 1)
          .reverse()
          .map((val) => val === low_val)
      );
    this.low_indexes[index] = low_index;

    const high_val = this.highest(
      this.data.high.slice(0, index + 1),
      nz(last_trend_down_since > 0 ? last_trend_down_since : 1, 1)
    );
    this.high_vals[index] = high_val;

    const high_index =
      index -
      this.barssince(
        this.data.high
          .slice(0, index + 1)
          .reverse()
          .map((val) => val === high_val)
      );
    this.high_indexes[index] = high_index;

    if (this.change(this.trends.slice(0, index + 1), 1) !== 0) {
      if (trend === 1) {
        this.low_points_arr.push(low_val);
        this.low_index_arr.push(low_index);
      }
      if (trend === -1) {
        this.high_points_arr.push(high_val);
        this.high_index_arr.push(high_index);
      }
    }

    const [h0, h0i] = this.f_get_high(0);
    this.h0s[index] = h0;
    this.h0is[index] = h0i;

    const [h1, h1i] = this.f_get_high(1);
    this.h1s[index] = h1;
    this.h1is[index] = h1i;

    const [l0, l0i] = this.f_get_low(0);
    this.l0s[index] = l0;
    this.l0is[index] = l0i;

    const [l1, l1i] = this.f_get_low(1);
    this.l1s[index] = l1;
    this.l1is[index] = l1i;

    let market = 1;
    market = nz(this.markets[index - 1], 1);
    const marketFrame = [...this.markets];
    const marketChanges = marketFrame
      .map(
        (val, index) => this.change(marketFrame.slice(0, index + 1), 1) !== 0
      )
      .reverse();
    const last_h0 = this.valuewhen(
      marketChanges,
      this.h0s.slice(0, index).reverse(),
      0
    );
    this.last_h0s[index] = last_h0;
    const last_l0 = this.valuewhen(
      marketChanges,
      this.l0s.slice(0, index).reverse(),
      0
    );
    this.last_l0s[index] = last_l0;
    market =
      last_l0 === l0 || last_h0 === h0
        ? market
        : market === 1 &&
          l0 < l1 &&
          l0 < l1 - Math.abs(h0 - l1) * settings.fibFactor
        ? -1
        : market === -1 &&
          h0 > h1 &&
          h0 > h1 + Math.abs(h1 - l0) * settings.fibFactor
        ? 1
        : market;
    this.markets[index] = market;

    let bu_ob_index = index;
    bu_ob_index = nz(this.bu_ob_indexs[index - 1], index);
    if (h1i < this.l0is[index - settings.zigzagLen]) {
      for (let i = h1i; i <= this.l0is[index - settings.zigzagLen]; i++) {
        const _index = index - i;
        if (this.data.open[index - _index] > this.data.close[index - _index]) {
          bu_ob_index = index - _index;
        }
      }
    } else {
      for (let i = h1i; i >= this.l0is[index - settings.zigzagLen]; i--) {
        const _index = index - i;
        if (this.data.open[index - _index] > this.data.close[index - _index]) {
          bu_ob_index = index - _index;
        }
      }
    }
    this.bu_ob_indexs[index] = bu_ob_index;
    const bu_ob_since = index - bu_ob_index;
    this.bu_ob_sinces[index] = bu_ob_since;

    let be_ob_index = index;
    be_ob_index = nz(this.be_ob_indexs[index - 1], index);
    if (l1i < this.h0is[index - settings.zigzagLen]) {
      for (let i = l1i; i <= this.h0is[index - settings.zigzagLen]; i++) {
        const _index = index - i;
        if (this.data.open[index - _index] < this.data.close[index - _index]) {
          be_ob_index = index - _index;
        }
      }
    } else {
      for (let i = l1i; i >= this.h0is[index - settings.zigzagLen]; i--) {
        const _index = index - i;
        if (this.data.open[index - _index] < this.data.close[index - _index]) {
          be_ob_index = index - _index;
        }
      }
    }
    this.be_ob_indexs[index] = be_ob_index;
    const be_ob_since = index - be_ob_index;
    this.be_ob_sinces[index] = be_ob_since;

    let be_bb_index = index;
    be_bb_index = nz(this.be_bb_indexs[index - 1], index);
    if (h1i - settings.zigzagLen < l1i) {
      for (let i = h1i - settings.zigzagLen; i <= l1i; i++) {
        const _index = index - i;
        if (this.data.open[index - _index] > this.data.close[index - _index]) {
          be_bb_index = index - _index;
        }
      }
    } else {
      for (let i = h1i - settings.zigzagLen; i >= l1i; i--) {
        const _index = index - i;
        if (this.data.open[index - _index] > this.data.close[index - _index]) {
          be_bb_index = index - _index;
        }
      }
    }
    this.be_bb_indexs[index] = be_bb_index;
    const be_bb_since = index - be_bb_index;
    this.be_bb_sinces[index] = be_bb_since;

    let bu_bb_index = index;
    bu_bb_index = nz(this.bu_bb_indexs[index - 1], index);
    if (l1i - settings.zigzagLen < h1i) {
      for (let i = l1i - settings.zigzagLen; i <= h1i; i++) {
        const _index = index - i;
        if (this.data.open[index - _index] < this.data.close[index - _index]) {
          bu_bb_index = index - _index;
        }
      }
    } else {
      for (let i = l1i - settings.zigzagLen; i >= h1i; i--) {
        const _index = index - i;
        if (this.data.open[index - _index] < this.data.close[index - _index]) {
          bu_bb_index = index - _index;
        }
      }
    }
    this.bu_bb_indexs[index] = bu_bb_index;
    const bu_bb_since = index - bu_bb_index;
    this.bu_bb_sinces[index] = bu_bb_since;

    if (this.change(this.markets, 1) !== 0) {
      if (market === 1) {
        this.bu_ob_boxes.add(
          new Box(
            bu_ob_index,
            this.data.high[index - bu_ob_since],
            this.data.low[index - bu_ob_since]
          )
        );
        this.bu_bb_boxes.add(
          new Box(
            bu_bb_index,
            this.data.high[index - bu_bb_since],
            this.data.low[index - bu_bb_since]
          )
        );
      }
      if (market === -1) {
        this.be_ob_boxes.add(
          new Box(
            be_ob_index,
            this.data.high[index - be_ob_since],
            this.data.low[index - be_ob_since]
          )
        );
        this.be_bb_boxes.add(
          new Box(
            be_bb_index,
            this.data.high[index - be_bb_since],
            this.data.low[index - be_bb_since]
          )
        );
      }
    }

    for (const box of this.bu_ob_boxes) {
      if (this.data.close[index] < box.bottom) {
        this.bu_ob_boxes.clear();
      }
    }

    for (const box of this.be_ob_boxes) {
      if (this.data.close[index] > box.top) {
        this.be_ob_boxes.clear();
      }
    }

    for (const box of this.bu_bb_boxes) {
      if (this.data.close[index] < box.bottom) {
        this.bu_bb_boxes.clear();
      }
    }

    for (const box of this.be_bb_boxes) {
      if (this.data.close[index] > box.top) {
        this.be_bb_boxes.clear();
      }
    }
  }

  getDataSetFromIndex(index: number): DataSet {
    const ret: IDataSet[] = [];
    for (let i = index; i < this.data.high.length; i++) {
      ret.push({
        high: this.data.high[i],
        low: this.data.low[i],
        close: this.data.close[i],
        open: this.data.open[i],
        index: i,
      });
    }
    return new DataSet(ret);
  }

  rsi(period = 14) {
    return calculateCurrentRSI(this.data.close, period);
  }
}

self.onmessage = async (e: MessageEvent<IObWorkerMessage>) => {
  switch (e.data.event) {
    case "start":
      const newOB = new OB({
        high: [],
        low: [],
        close: [],
        open: [],
      });
      const result = await newOB.run(e.data.data);
      postMessage({
        event: "done",
        data: result,
      });
      break;
    default:
      break;
  }
};
